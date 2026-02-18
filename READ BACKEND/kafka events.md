# KAFKA-EVENTS.md · Event Schema & Topic Specification

16 Kafka topics, mỗi topic có payload JSON schema cụ thể. Mọi service produce/consume phải tuân thủ schema này.

---

## Quy ước chung

### Envelope format

Mọi Kafka message đều bọc trong envelope:

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "ORDER_CREATED",
  "source": "order-service",
  "timestamp": "2026-02-18T10:30:00.123Z",
  "version": 1,
  "data": { ... }
}
```

| Field | Kiểu | Mô tả |
|---|---|---|
| eventId | UUID string | Dùng để dedup (idempotency) |
| eventType | string | Tên event, UPPER_SNAKE_CASE |
| source | string | Tên service produce |
| timestamp | ISO 8601 | Thời điểm event xảy ra |
| version | int | Schema version, tăng khi thay đổi breaking |
| data | object | Payload chính |

### Serialization

JSON UTF-8. Key: String. Value: JSON bytes.

Nếu chuyển sang Avro sau này, đăng ký schema tại Confluent Schema Registry `http://localhost:8081`.

### Partition key strategy

| Chiến lược | Áp dụng cho | Lý do |
|---|---|---|
| `orderId` | orders.* topics | Đảm bảo mọi event của cùng 1 đơn xử lý tuần tự |
| `productId` | inventory.* topics | Tránh race condition tồn kho cùng sản phẩm |
| `customerId` | customers.* topics | Segment update tuần tự theo khách |
| `paymentId` | payments.* topics | Trạng thái thanh toán tuần tự |
| `campaignId` | campaigns.* topics | Chiến dịch tuần tự |

### Idempotency

Consumer phải lưu `eventId` đã xử lý (trong Redis hoặc DB table `processed_events`). Nếu nhận trùng eventId → skip.

### Dead Letter Queue

Mỗi topic có DLQ tương ứng: `<topic>.dlq`. Event xử lý thất bại sau 3 lần retry → chuyển sang DLQ.

### Retention

- Business events: 7 ngày
- Audit events: 30 ngày
- DLQ: 30 ngày

### Partition count

Mặc định 3 partitions / topic. Tăng lên 6-12 cho high-throughput topics (`orders.created`, `inventory.updated`).

---

## 1. orders.created

```
Producer:    order-service
Consumers:   inventory-service, notification-service, spark-streaming
Key:         orderId (string)
Partitions:  6

Payload:
{
  "eventId": "uuid",
  "eventType": "ORDER_CREATED",
  "source": "order-service",
  "timestamp": "2026-02-18T10:30:00Z",
  "version": 1,
  "data": {
    "orderId": 1,
    "code": "#DH-9823",
    "channel": "Shopee",
    "customerId": 1,
    "customerName": "Nguyễn Minh Anh",
    "customerPhone": "0987654321",
    "items": [
      {
        "productId": 1,
        "sku": "TT-OS-001-BK-M",
        "name": "Áo khoác bomber nam cao cấp",
        "quantity": 2,
        "price": 520000
      }
    ],
    "subtotal": 1420000,
    "shippingFee": 0,
    "discount": 140000,
    "total": 1280000,
    "paymentMethod": "VNPay",
    "shippingAddress": "123 Nguyễn Huệ, Q1, TP.HCM",
    "slaDeadline": "2026-02-18T11:30:00Z"
  }
}

Consumer xử lý:
  inventory-service → ReserveStock cho từng item (gRPC nội bộ hoặc trực tiếp DB)
  notification-service → Push WebSocket alert đến dashboard Angular
  spark-streaming → Cập nhật realtime revenue aggregation
```

---

## 2. orders.confirmed

```
Producer:    order-service
Consumers:   inventory-service, payment-service, notification-service
Key:         orderId (string)
Partitions:  6

Payload:
{
  "eventId": "uuid",
  "eventType": "ORDER_CONFIRMED",
  "source": "order-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "orderId": 1,
    "code": "#DH-9823",
    "channel": "Shopee",
    "customerId": 1,
    "items": [
      { "productId": 1, "sku": "TT-OS-001-BK-M", "quantity": 2 }
    ],
    "total": 1280000,
    "paymentMethod": "VNPay",
    "confirmedBy": "admin"
  }
}

Consumer xử lý:
  inventory-service → Commit trừ tồn kho (từ reserved → deducted)
  payment-service → Initiate payment nếu chưa thanh toán
  notification-service → Gửi email/SMS xác nhận cho khách
```

---

## 3. orders.shipped

```
Producer:    shipping-service
Consumers:   notification-service, customer-service
Key:         orderId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "ORDER_SHIPPED",
  "source": "shipping-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "orderId": 1,
    "code": "#DH-9823",
    "customerId": 1,
    "carrier": "GHN",
    "trackingNumber": "GHN-12345678",
    "estimatedDelivery": "2026-02-20"
  }
}
```

---

## 4. orders.completed

```
Producer:    shipping-service (khi xác nhận giao thành công)
Consumers:   customer-service (loyalty), notification-service
Key:         orderId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "ORDER_COMPLETED",
  "source": "shipping-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "orderId": 1,
    "code": "#DH-9823",
    "customerId": 1,
    "total": 1280000,
    "channel": "Shopee",
    "deliveredAt": "2026-02-20T14:30:00Z"
  }
}

Consumer xử lý:
  customer-service → AddPoints (1280000 VND → 1280 points), cập nhật totalOrders/totalSpent
  notification-service → Gửi SMS "Đơn hàng đã giao thành công"
```

---

## 5. orders.cancelled

```
Producer:    order-service
Consumers:   inventory-service, payment-service, spark-streaming
Key:         orderId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "ORDER_CANCELLED",
  "source": "order-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "orderId": 10,
    "code": "#DH-9815",
    "customerId": 8,
    "reason": "KH yêu cầu hủy",
    "cancelledBy": "csagent",
    "items": [
      { "productId": 1, "sku": "TT-OS-001-NV-M", "quantity": 1 }
    ],
    "requiresRefund": true,
    "refundAmount": 498000
  }
}

Consumer xử lý:
  inventory-service → ReleaseStock cho từng item
  payment-service → InitiateRefund nếu đã thanh toán
  spark-streaming → Cập nhật tỷ lệ hủy đơn realtime
```

---

## 6. inventory.updated

```
Producer:    inventory-service
Consumers:   product-service, channel-service, notification-service
Key:         productId (string)
Partitions:  6

Payload:
{
  "eventId": "uuid",
  "eventType": "INVENTORY_UPDATED",
  "source": "inventory-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "productId": 1,
    "sku": "TT-OS-001",
    "warehouseId": 1,
    "warehouseCode": "WH-HCM",
    "previousQuantity": 62,
    "newQuantity": 60,
    "changeType": "outbound",
    "referenceType": "order",
    "referenceId": 1,
    "totalStockAllWarehouses": 95
  }
}

Consumer xử lý:
  product-service → Cập nhật products.stock = totalStockAllWarehouses
  channel-service → Đồng bộ tồn kho ra Shopee/Lazada/TikTok API
  notification-service → Nếu quantity <= minThreshold → trigger low_stock alert
```

---

## 7. inventory.low_stock

```
Producer:    inventory-service
Consumers:   notification-service, inventory-service (auto PO suggestion)
Key:         productId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "LOW_STOCK_ALERT",
  "source": "inventory-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "productId": 8,
    "sku": "MP-VB-002",
    "productName": "Kem chống nắng SPF50+",
    "warehouseId": 1,
    "warehouseCode": "WH-HCM",
    "currentQuantity": 12,
    "minThreshold": 30,
    "suggestedOrderQuantity": 188,
    "preferredSupplierId": 2
  }
}

Consumer xử lý:
  notification-service → Push WebSocket alert severity "warn" đến dashboard
  inventory-service (internal) → Tạo draft Purchase Order gợi ý
```

---

## 8. customers.segment_updated

```
Producer:    spark-batch (qua Kafka producer trong Spark job)
Consumers:   customer-service, marketing-service
Key:         customerId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "SEGMENT_UPDATED",
  "source": "spark-batch",
  "timestamp": "...",
  "version": 1,
  "data": {
    "batchId": "rfm_2026-02-18",
    "results": [
      {
        "customerId": 1,
        "previousSegment": "Loyal Customers",
        "newSegment": "Champions",
        "rfmScore": { "recency": 5, "frequency": 4, "monetary": 5 }
      },
      {
        "customerId": 7,
        "previousSegment": "Potential Loyalists",
        "newSegment": "At Risk",
        "rfmScore": { "recency": 2, "frequency": 2, "monetary": 3 }
      }
    ],
    "totalProcessed": 10019,
    "segmentSummary": {
      "Champions": 1240,
      "Loyal Customers": 2350,
      "Potential Loyalists": 3892,
      "At Risk": 432,
      "Hibernating": 2105
    }
  }
}

Consumer xử lý:
  customer-service → Cập nhật customers.segment cho từng customer
  marketing-service → Tự động đề xuất chiến dịch cho "At Risk" segment
```

---

## 9. payments.initiated

```
Producer:    payment-service
Consumers:   spark-streaming (fraud detection), finance-service
Key:         paymentId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "PAYMENT_INITIATED",
  "source": "payment-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "paymentId": 1,
    "orderId": 1,
    "customerId": 1,
    "amount": 1280000,
    "method": "VNPay",
    "ipAddress": "118.69.x.x",
    "deviceFingerprint": "abc123",
    "metadata": {
      "orderChannel": "Shopee",
      "customerOrderCount": 28
    }
  }
}

Consumer xử lý:
  spark-streaming → Fraud detection model phân tích trong 1 giây
  finance-service → Ghi nhận pending transaction
```

---

## 10. payments.completed

```
Producer:    payment-service (callback từ gateway)
Consumers:   order-service, customer-service (loyalty), finance-service
Key:         orderId (string)
Partitions:  6

Payload:
{
  "eventId": "uuid",
  "eventType": "PAYMENT_COMPLETED",
  "source": "payment-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "paymentId": 1,
    "orderId": 1,
    "customerId": 1,
    "amount": 1280000,
    "method": "VNPay",
    "gatewayTxId": "VNP-20260218103500",
    "paidAt": "2026-02-18T10:35:00Z"
  }
}

Consumer xử lý:
  order-service → Chuyển status sang "paid"
  customer-service → Cập nhật totalSpent
  finance-service → Ghi nhận income transaction (TX-xxx)
```

---

## 11. payments.refunded

```
Producer:    payment-service
Consumers:   order-service, inventory-service, finance-service
Key:         orderId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "PAYMENT_REFUNDED",
  "source": "payment-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "refundId": 1,
    "paymentId": 5,
    "orderId": 10,
    "customerId": 8,
    "refundAmount": 498000,
    "method": "VNPay",
    "gatewayRefundId": "VNP-RF-20260218",
    "reason": "KH yêu cầu hủy"
  }
}
```

---

## 12. campaigns.activated

```
Producer:    marketing-service
Consumers:   notification-service, product-service
Key:         campaignId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "CAMPAIGN_ACTIVATED",
  "source": "marketing-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "campaignId": 1,
    "name": "Flash Sale 20h - Giảm sốc 50%",
    "type": "push",
    "targetSegment": "Champions",
    "affectedProducts": [1, 2, 4],
    "discountType": "percentage",
    "discountValue": 50,
    "startTime": "2026-02-18T20:00:00Z",
    "endTime": "2026-02-18T22:00:00Z"
  }
}
```

---

## 13. campaigns.flashsale.started

```
Producer:    airflow (trigger qua marketing-service API)
Consumers:   product-service, notification-service
Key:         campaignId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "FLASHSALE_STARTED",
  "source": "airflow",
  "timestamp": "...",
  "version": 1,
  "data": {
    "campaignId": 1,
    "name": "Flash Sale 20h",
    "products": [
      { "productId": 1, "originalPrice": 520000, "flashPrice": 260000, "stockLimit": 50 },
      { "productId": 4, "originalPrice": 690000, "flashPrice": 345000, "stockLimit": 30 }
    ],
    "endsAt": "2026-02-18T22:00:00Z"
  }
}

Consumer xử lý:
  product-service → Cập nhật sale_price, đánh dấu flash sale
  notification-service → Push WebSocket "Flash sale bắt đầu!" đến tất cả Angular clients
```

---

## 14. marketplace.orders

```
Producer:    channel-service (nhận webhook từ Shopee/Lazada/Tiki/TikTok → publish)
Consumers:   order-service
Key:         externalOrderId (string)
Partitions:  6

Payload:
{
  "eventId": "uuid",
  "eventType": "MARKETPLACE_ORDER_RECEIVED",
  "source": "channel-service",
  "timestamp": "...",
  "version": 1,
  "data": {
    "marketplace": "Shopee",
    "externalOrderId": "SPE-240218-ABC123",
    "customerName": "Nguyễn Minh Anh",
    "customerPhone": "0987654321",
    "shippingAddress": "123 Nguyễn Huệ, Q1, TP.HCM",
    "items": [
      { "externalSku": "shopee-sku-001", "internalSku": "TT-OS-001-BK-M", "productId": 1, "quantity": 2, "price": 540000 }
    ],
    "subtotal": 1080000,
    "shippingFee": 0,
    "discount": 108000,
    "total": 972000,
    "paymentMethod": "ShopeePay",
    "paidAt": "2026-02-18T10:25:00Z"
  }
}

Consumer xử lý:
  order-service → Tạo đơn nội bộ, normalize format, kiểm tra trùng lặp (theo externalOrderId)
```

---

## 15. fraud.alert

```
Producer:    spark-streaming
Consumers:   notification-service, payment-service
Key:         paymentId (string)
Partitions:  3

Payload:
{
  "eventId": "uuid",
  "eventType": "FRAUD_ALERT",
  "source": "spark-streaming",
  "timestamp": "...",
  "version": 1,
  "data": {
    "alertId": "FRD-20260218-001",
    "paymentId": 15,
    "orderId": 25,
    "customerId": 12,
    "severity": "HIGH",
    "score": 0.92,
    "reasons": [
      "Đơn hàng giá trị cao từ tài khoản mới",
      "IP address khác vùng với địa chỉ giao hàng",
      "3 đơn liên tiếp trong 5 phút"
    ],
    "recommendedAction": "HOLD"
  }
}

Consumer xử lý:
  payment-service → Hold giao dịch, chờ admin review
  notification-service → Push WebSocket severity "crit" đến admin dashboard
```

---

## 16. analytics.rfm.results

```
Producer:    spark-batch (DAG daily_rfm_calculation)
Consumers:   customer-service
Key:         "batch" (fixed key, single partition)
Partitions:  1

Payload:
{
  "eventId": "uuid",
  "eventType": "RFM_CALCULATION_COMPLETED",
  "source": "spark-batch",
  "timestamp": "...",
  "version": 1,
  "data": {
    "batchId": "rfm_2026-02-18",
    "calculatedAt": "2026-02-18T01:05:42Z",
    "totalCustomers": 10019,
    "segmentDistribution": {
      "Champions": 1240,
      "Loyal Customers": 2350,
      "Potential Loyalists": 3892,
      "At Risk": 432,
      "Hibernating": 2105
    },
    "changedCustomers": 156,
    "detailsTopic": "customers.segment_updated"
  }
}

Consumer xử lý:
  customer-service → Log kết quả batch, cập nhật dashboard segment overview
  (Chi tiết từng customer nằm ở topic customers.segment_updated)
```

---

## Tổng hợp

| # | Topic | Partitions | Retention | Key | Throughput ước tính |
|---|---|---|---|---|---|
| 1 | orders.created | 6 | 7d | orderId | ~100 msg/min peak |
| 2 | orders.confirmed | 6 | 7d | orderId | ~80 msg/min |
| 3 | orders.shipped | 3 | 7d | orderId | ~50 msg/min |
| 4 | orders.completed | 3 | 7d | orderId | ~50 msg/min |
| 5 | orders.cancelled | 3 | 7d | orderId | ~10 msg/min |
| 6 | inventory.updated | 6 | 7d | productId | ~200 msg/min peak |
| 7 | inventory.low_stock | 3 | 7d | productId | ~5 msg/hour |
| 8 | customers.segment_updated | 3 | 7d | customerId | batch 1x/ngày |
| 9 | payments.initiated | 3 | 7d | paymentId | ~100 msg/min |
| 10 | payments.completed | 6 | 7d | orderId | ~80 msg/min |
| 11 | payments.refunded | 3 | 7d | orderId | ~5 msg/hour |
| 12 | campaigns.activated | 3 | 7d | campaignId | ~2 msg/ngày |
| 13 | campaigns.flashsale.started | 3 | 7d | campaignId | ~1 msg/ngày |
| 14 | marketplace.orders | 6 | 7d | externalOrderId | ~200 msg/min peak |
| 15 | fraud.alert | 3 | 30d | paymentId | ~1 msg/hour |
| 16 | analytics.rfm.results | 1 | 30d | "batch" | 1 msg/ngày |

### Script tạo topics

```bash
#!/bin/bash
BOOTSTRAP=localhost:9092

kafka-topics --create --topic orders.created --partitions 6 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic orders.confirmed --partitions 6 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic orders.shipped --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic orders.completed --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic orders.cancelled --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic inventory.updated --partitions 6 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic inventory.low_stock --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic customers.segment_updated --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic payments.initiated --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic payments.completed --partitions 6 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic payments.refunded --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic campaigns.activated --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic campaigns.flashsale.started --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic marketplace.orders --partitions 6 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic fraud.alert --partitions 3 --replication-factor 1 --bootstrap-server $BOOTSTRAP
kafka-topics --create --topic analytics.rfm.results --partitions 1 --replication-factor 1 --bootstrap-server $BOOTSTRAP

# DLQ topics
for topic in orders.created orders.confirmed orders.cancelled inventory.updated payments.initiated payments.completed marketplace.orders; do
  kafka-topics --create --topic ${topic}.dlq --partitions 1 --replication-factor 1 --bootstrap-server $BOOTSTRAP
done

echo "Done. Total topics:"
kafka-topics --list --bootstrap-server $BOOTSTRAP | wc -l
```
