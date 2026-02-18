# GRPC-CONTRACTS.md · Protocol Buffers & gRPC Specification

5 file proto, 10 RPC methods. Dùng cho giao tiếp nội bộ giữa microservices (không expose ra frontend).

---

## Quy ước chung

### Proto syntax

```
syntax = "proto3";
package omnirevenue.<service>;
option java_package = "vn.omnirevenue.<service>.grpc";
option java_multiple_files = true;
```

### Timeout

| Loại call | Deadline | Lý do |
|---|---|---|
| CheckStock, CheckPaymentStatus | 500ms | Đọc đơn giản, phải nhanh |
| ReserveStock, ReleaseStock | 1s | Cần write lock |
| InitiateRefund | 3s | Gọi external payment gateway |
| CreateShipment | 5s | Gọi external carrier API |
| GetTracking | 2s | Gọi external carrier API |
| AddPoints, RedeemPoints | 1s | Write nội bộ |
| SendAlert | 500ms | Fire-and-forget |

### Error handling

Dùng gRPC status codes chuẩn:

| Code | Khi nào dùng |
|---|---|
| OK (0) | Thành công |
| INVALID_ARGUMENT (3) | Request thiếu field, giá trị không hợp lệ |
| NOT_FOUND (5) | Sản phẩm, đơn hàng, khách hàng không tồn tại |
| ALREADY_EXISTS (6) | Đã reserve rồi, điểm đã đổi rồi |
| RESOURCE_EXHAUSTED (8) | Hết hàng, không đủ điểm |
| FAILED_PRECONDITION (9) | Trạng thái không cho phép (vd: đơn đã hủy không reserve được) |
| UNAVAILABLE (14) | Service tạm thời không khả dụng |
| DEADLINE_EXCEEDED (4) | Timeout |
| INTERNAL (13) | Lỗi không xác định |

Lỗi trả trong `Status.description` dạng JSON:

```
{ "code": "INSUFFICIENT_STOCK", "message": "SKU TT-OS-001-BK-M chỉ còn 5, cần 10", "details": { "sku": "TT-OS-001-BK-M", "available": 5, "requested": 10 } }
```

### Circuit breaker

Mỗi gRPC client cấu hình Resilience4j:

```
failureRateThreshold: 50%
waitDurationInOpenState: 30s
slidingWindowSize: 10
```

Khi circuit open, trả lỗi UNAVAILABLE ngay lập tức, không chờ timeout.

---

## 1. inventory.proto

```protobuf
syntax = "proto3";
package omnirevenue.inventory;

option java_package = "vn.omnirevenue.inventory.grpc";
option java_multiple_files = true;

service InventoryService {
  // Kiểm tra tồn kho realtime cho 1 hoặc nhiều sản phẩm
  rpc CheckStock(CheckStockRequest) returns (CheckStockResponse);

  // Lock tồn kho cho đơn hàng (tạo reservation)
  rpc ReserveStock(ReserveStockRequest) returns (ReserveStockResponse);

  // Mở lock khi đơn bị hủy hoặc hết thời gian thanh toán
  rpc ReleaseStock(ReleaseStockRequest) returns (ReleaseStockResponse);
}

// ========== CheckStock ==========

message CheckStockRequest {
  repeated StockQuery items = 1;
  string preferred_warehouse = 2; // optional: WH-HCM, WH-HN (empty = check tất cả)
}

message StockQuery {
  int64 product_id = 1;
  string sku = 2;
  int32 quantity_needed = 3;
}

message CheckStockResponse {
  bool all_available = 1;              // true nếu TẤT CẢ items đều đủ hàng
  repeated StockResult items = 2;
}

message StockResult {
  int64 product_id = 1;
  string sku = 2;
  bool available = 3;
  int32 current_quantity = 4;          // tồn kho thực tế
  int32 reserved = 5;                  // đã lock cho đơn khác
  int32 available_quantity = 6;        // = current_quantity - reserved
  string warehouse_code = 7;           // kho nào có hàng
}

// ========== ReserveStock ==========

message ReserveStockRequest {
  int64 order_id = 1;
  string order_code = 2;
  repeated ReserveItem items = 3;
  int32 ttl_seconds = 4;              // thời gian giữ lock (mặc định 900 = 15 phút)
}

message ReserveItem {
  int64 product_id = 1;
  string sku = 2;
  int32 quantity = 3;
  string preferred_warehouse = 4;      // optional
}

message ReserveStockResponse {
  bool success = 1;
  string reservation_id = 2;          // UUID, dùng để release sau này
  repeated ReserveResult items = 3;
}

message ReserveResult {
  string sku = 1;
  bool reserved = 2;
  int32 quantity_reserved = 3;
  string warehouse_code = 4;
  string failure_reason = 5;           // empty nếu thành công
}

// ========== ReleaseStock ==========

message ReleaseStockRequest {
  string reservation_id = 1;
  int64 order_id = 2;
  string reason = 3;                   // "order_cancelled" | "payment_timeout" | "manual"
}

message ReleaseStockResponse {
  bool success = 1;
  int32 items_released = 2;
}
```

Server: `inventory-service:9091`
Client: `order-service`

---

## 2. payment.proto

```protobuf
syntax = "proto3";
package omnirevenue.payment;

option java_package = "vn.omnirevenue.payment.grpc";
option java_multiple_files = true;

service PaymentService {
  // Khởi tạo hoàn tiền
  rpc InitiateRefund(RefundRequest) returns (RefundResponse);

  // Kiểm tra trạng thái thanh toán
  rpc CheckPaymentStatus(PaymentStatusRequest) returns (PaymentStatusResponse);
}

// ========== InitiateRefund ==========

message RefundRequest {
  int64 order_id = 1;
  int64 payment_id = 2;               // ID giao dịch thanh toán gốc
  int64 amount = 3;                    // số tiền hoàn (VND), có thể partial
  string reason = 4;
  string initiated_by = 5;            // username admin/csagent
  string refund_method = 6;           // "original" (về PTTT gốc) | "wallet" (về ví)
}

message RefundResponse {
  bool success = 1;
  string refund_id = 2;
  string status = 3;                   // "processing" | "completed" | "failed"
  string gateway_refund_id = 4;       // mã hoàn từ payment gateway
  string estimated_completion = 5;    // ISO 8601 datetime
  string failure_reason = 6;          // empty nếu thành công
}

// ========== CheckPaymentStatus ==========

message PaymentStatusRequest {
  int64 order_id = 1;                 // check theo order_id
  // hoặc
  string gateway_tx_id = 2;           // check theo mã gateway
}

message PaymentStatusResponse {
  int64 payment_id = 1;
  int64 order_id = 2;
  string status = 3;                   // "pending" | "completed" | "failed" | "expired"
  int64 amount = 4;
  string method = 5;
  string paid_at = 6;                 // ISO 8601, empty nếu chưa thanh toán
}
```

Server: `payment-service:9092`
Client: `order-service`

---

## 3. shipping.proto

```protobuf
syntax = "proto3";
package omnirevenue.shipping;

option java_package = "vn.omnirevenue.shipping.grpc";
option java_multiple_files = true;

service ShippingService {
  // Tạo vận đơn với đơn vị vận chuyển
  rpc CreateShipment(CreateShipmentRequest) returns (CreateShipmentResponse);

  // Lấy thông tin tracking
  rpc GetTracking(TrackingRequest) returns (TrackingResponse);
}

// ========== CreateShipment ==========

message CreateShipmentRequest {
  int64 order_id = 1;
  string order_code = 2;
  string carrier = 3;                 // "GHTK" | "GHN" | "ViettelPost" | "auto" (tự chọn tối ưu)
  ShipmentSender sender = 4;
  ShipmentReceiver receiver = 5;
  repeated ShipmentItem items = 6;
  int32 total_weight_gram = 7;
  int64 cod_amount = 8;               // 0 nếu đã thanh toán online
  bool insurance = 9;
}

message ShipmentSender {
  string name = 1;
  string phone = 2;
  string address = 3;
  string warehouse_code = 4;
}

message ShipmentReceiver {
  string name = 1;
  string phone = 2;
  string address = 3;
  string province = 4;
  string district = 5;
  string ward = 6;
}

message ShipmentItem {
  string name = 1;
  int32 quantity = 2;
  int64 price = 3;
  int32 weight_gram = 4;
}

message CreateShipmentResponse {
  bool success = 1;
  string tracking_number = 2;
  string carrier = 3;
  int64 shipping_fee = 4;             // phí vận chuyển thực tế từ carrier
  string estimated_delivery = 5;      // ISO date
  string label_url = 6;               // URL tải label in vận đơn
  string failure_reason = 7;
}

// ========== GetTracking ==========

message TrackingRequest {
  string tracking_number = 1;
  // hoặc
  int64 order_id = 2;
}

message TrackingResponse {
  string tracking_number = 1;
  string carrier = 2;
  string current_status = 3;          // "created" | "picked_up" | "in_transit" | "delivered" | "failed" | "returned"
  string estimated_delivery = 4;
  repeated TrackingEvent events = 5;
}

message TrackingEvent {
  string status = 1;
  string location = 2;
  string description = 3;
  string event_time = 4;              // ISO 8601
}
```

Server: `shipping-service:9093`
Client: `order-service`

---

## 4. loyalty.proto

```protobuf
syntax = "proto3";
package omnirevenue.loyalty;

option java_package = "vn.omnirevenue.customer.grpc";
option java_multiple_files = true;

service LoyaltyService {
  // Cộng điểm sau khi đơn hàng hoàn thành
  rpc AddPoints(AddPointsRequest) returns (AddPointsResponse);

  // Đổi điểm lấy voucher/giảm giá
  rpc RedeemPoints(RedeemPointsRequest) returns (RedeemPointsResponse);
}

// ========== AddPoints ==========

message AddPointsRequest {
  int64 customer_id = 1;
  int64 order_id = 2;
  int64 order_total = 3;              // VND — quy đổi: 1000 VND = 1 point
  string channel = 4;
}

message AddPointsResponse {
  bool success = 1;
  int32 points_added = 2;
  int32 total_points = 3;
  string previous_tier = 4;
  string current_tier = 5;            // có thể thay đổi sau khi cộng điểm
  bool tier_upgraded = 6;
}

// ========== RedeemPoints ==========

message RedeemPointsRequest {
  int64 customer_id = 1;
  int32 points = 2;                   // số điểm muốn đổi
  string redeem_type = 3;             // "voucher" | "discount"
  int64 order_id = 4;                 // nếu redeem_type = "discount"
}

message RedeemPointsResponse {
  bool success = 1;
  int32 points_redeemed = 2;
  int32 remaining_points = 3;
  string voucher_code = 4;            // nếu redeem_type = "voucher", trả code voucher mới
  int64 discount_amount = 5;          // nếu redeem_type = "discount"
  string failure_reason = 6;          // "INSUFFICIENT_POINTS" | "CUSTOMER_NOT_FOUND"
}
```

Server: `customer-service:9094`
Client: `order-service`

---

## 5. notification.proto

```protobuf
syntax = "proto3";
package omnirevenue.notification;

option java_package = "vn.omnirevenue.notification.grpc";
option java_multiple_files = true;

service NotificationService {
  // Gửi cảnh báo nội bộ (fire-and-forget)
  rpc SendAlert(AlertRequest) returns (AlertResponse);
}

message AlertRequest {
  string type = 1;                    // "order" | "inventory" | "system" | "marketing" | "alert"
  string title = 2;
  string message = 3;
  string severity = 4;               // "info" | "warn" | "crit"
  string icon = 5;                   // "fa-shopping-cart", "fa-box-open", ...
  repeated int64 target_user_ids = 6; // empty = broadcast cho tất cả user online
  map<string, string> metadata = 7;   // thông tin bổ sung tùy ý
}

message AlertResponse {
  bool success = 1;
  int32 users_notified = 2;          // số user nhận được (qua WebSocket)
}
```

Server: `notification-service:9095`
Client: bất kỳ service nào cần gửi alert

---

## Tổng hợp

| Proto | Service | Port | Methods | Called by |
|---|---|---|---|---|
| inventory.proto | InventoryService | 9091 | CheckStock, ReserveStock, ReleaseStock | order-service |
| payment.proto | PaymentService | 9092 | InitiateRefund, CheckPaymentStatus | order-service |
| shipping.proto | ShippingService | 9093 | CreateShipment, GetTracking | order-service |
| loyalty.proto | LoyaltyService | 9094 | AddPoints, RedeemPoints | order-service |
| notification.proto | NotificationService | 9095 | SendAlert | any service |

### Build command

```bash
# Từ thư mục proto/
protoc --java_out=../inventory-service/src/main/java \
       --grpc-java_out=../inventory-service/src/main/java \
       inventory.proto

# Hoặc dùng Maven plugin (protobuf-maven-plugin) tự động generate khi build
```

### Maven dependency

```xml
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
    <version>1.62.2</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
    <version>1.62.2</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>1.62.2</version>
</dependency>
```
