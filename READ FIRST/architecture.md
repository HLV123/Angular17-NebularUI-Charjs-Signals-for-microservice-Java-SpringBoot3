# ARCHITECTURE.md · Kiến trúc hệ thống & Quyết định thiết kế

---

## 1. Tổng quan kiến trúc

```
                         ┌──────────────────┐
                         │   Angular 17     │
                         │   Nebular 13     │
                         │   :4200          │
                         └────────┬─────────┘
                                  │
                          REST + WebSocket
                                  │
                         ┌────────▼─────────┐
                         │   API Gateway    │
                         │   Spring Cloud   │
                         │   :8080          │
                         │                  │
                         │  JWT Filter      │
                         │  Rate Limiter    │
                         │  Route Config    │
                         │  WebSocket Proxy │
                         └──┬──┬──┬──┬──┬──┘
                            │  │  │  │  │
              ┌─────────────┘  │  │  │  └─────────────┐
              │         ┌──────┘  │  └──────┐         │
              ▼         ▼         ▼         ▼         ▼
         ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
         │Product ││Order   ││Customer││Marketing││Staff   │
         │Service ││Service ││Service ││Service  ││Service │
         │:8081   ││:8082   ││:8084   ││:8086    ││:8090   │
         └────────┘└──┬─────┘└────────┘└─────────┘└────────┘
                      │ gRPC
              ┌───────┼───────┬───────┐
              ▼       ▼       ▼       ▼
         ┌────────┐┌────────┐┌────────┐┌────────┐
         │Inventory││Payment ││Shipping││Notif.  │
         │Service  ││Service ││Service ││Service │
         │:8083    ││:8085   ││:8088   ││:8089   │
         │gRPC:9091││gRPC:9092│gRPC:9093│gRPC:9095│
         └────────┘└────────┘└────────┘└────────┘
                      │
              ┌───────┼───────┬───────┐
              ▼       ▼       ▼       ▼
         ┌────────┐┌────────┐┌────────┐┌────────┐
         │Channel ││Finance ││Search  ││Spark   │
         │Service ││Service ││Service ││Jobs    │
         │:8087   ││:8091   ││:8092   ││        │
         └────────┘└────────┘└────────┘└────────┘
```

---

## 2. Quyết định thiết kế

### 2.1 Tại sao microservice thay vì monolith?

| Lý do | Giải thích |
|---|---|
| Scale độc lập | Order-service cần 4 instances khi flash sale, product-service chỉ cần 1 |
| Deploy độc lập | Fix bug payment không cần redeploy toàn bộ hệ thống |
| Team ownership | Team kho quản lý inventory-service, team sales quản lý order-service |
| Tech stack linh hoạt | Spark jobs viết Scala, còn lại Java — monolith không cho phép |
| Fault isolation | payment-service down, order-service vẫn tiếp nhận đơn (queue lại thanh toán) |

### 2.2 Tại sao chọn từng giao thức

| Giao thức | Dùng cho | Tại sao không dùng cái khác |
|---|---|---|
| **REST** | Frontend → Gateway, CRUD operations | Đơn giản, tooling tốt, debug dễ (Postman, curl), team quen thuộc |
| **gRPC** | Order ↔ Inventory ↔ Payment ↔ Shipping nội bộ | REST quá chậm cho chain call (order xác nhận → check tồn → reserve → tạo vận đơn). gRPC nhanh hơn 2-10x nhờ HTTP/2 + Protobuf binary. Strongly-typed contract tránh lỗi runtime |
| **Kafka** | Event streaming giữa services | RabbitMQ không đảm bảo ordering per partition. Kafka có log retention cho replay, partition cho parallelism, tốt hơn cho event sourcing |
| **WebSocket** | Dashboard realtime, notifications | REST polling tốn bandwidth, SSE chỉ 1 chiều. WebSocket 2 chiều, persistent, latency thấp |
| **RSocket** | Spark streaming → backend | gRPC stream cũng được, nhưng RSocket có backpressure tốt hơn cho high-volume data stream từ Spark |

### 2.3 Tại sao database-per-service

Mỗi service sở hữu 1 PostgreSQL database riêng:

- **Loose coupling**: thay đổi schema service A không ảnh hưởng service B
- **Scale độc lập**: product database read-heavy → thêm read replica, order database write-heavy → tối ưu write
- **Polyglot persistence**: search-service dùng Elasticsearch thay vì PostgreSQL

Trade-off: không có cross-service JOIN → phải denormalize hoặc gọi API. Đã chấp nhận trade-off này vì:
- Dữ liệu snapshot tại thời điểm tạo (vd: `order_items.name` lưu tên SP, không phụ thuộc products table)
- Aggregation queries chạy qua Spark batch, không cần realtime JOIN

### 2.4 Tại sao PostgreSQL thay vì MySQL

- JSONB native → lưu `product_variants.attributes` linh hoạt
- Array type → lưu `customers.tags` không cần bảng phụ
- Full-text search cơ bản (cho quick search trước khi Elasticsearch index xong)
- Better MVCC, concurrent write performance
- Partitioning tốt hơn cho bảng lớn (orders, stock_movements)

### 2.5 Tại sao Spring Cloud Gateway thay vì Nginx

- Cùng hệ sinh thái Spring → chia sẻ config, security, tracing
- Tích hợp Eureka service discovery tự động
- Custom filter bằng Java (JWT validation, rate limiting, request/response transformation)
- WebSocket proxying built-in
- Trade-off: chậm hơn Nginx cho static content, nhưng frontend serve riêng nên không ảnh hưởng

---

## 3. Luồng giao tiếp chính

### 3.1 Frontend → Backend

```
Angular HttpClient
    │
    │ REST: Authorization: Bearer <jwt>
    │ Base URL: http://localhost:8080/api/v1
    ▼
API Gateway (:8080)
    │
    │ JwtAuthFilter → validate token → extract role
    │ RateLimitFilter → 100 req/s per user
    │ RouteConfig → forward tới service tương ứng
    ▼
Target Microservice (:808x)
```

### 3.2 Order lifecycle (gRPC chain)

```
order-service nhận POST /orders
    │
    ├── gRPC → inventory-service.CheckStock()     [500ms timeout]
    │       └── Trả về: all_available = true/false
    │
    ├── gRPC → inventory-service.ReserveStock()    [1s timeout]
    │       └── Trả về: reservation_id
    │
    ├── Kafka → orders.created                      [async]
    │       └── notification-service → WebSocket push
    │
    ├── ... (khách thanh toán) ...
    │
    ├── gRPC → shipping-service.CreateShipment()    [5s timeout]
    │       └── Trả về: tracking_number
    │
    └── Kafka → orders.shipped                      [async]
```

### 3.3 Realtime notifications

```
Kafka Consumer (notification-service)
    │
    │ Nhận events từ: orders.created, inventory.low_stock, fraud.alert
    │
    ├── Lưu DB (notifications table)
    │
    └── WebSocket push
        │
        ▼
    API Gateway (:8080/ws)
        │
        │ WebSocket proxy
        ▼
    Angular NotificationService
        │
        └── Subject.next() → UI update
```

### 3.4 Analytics pipeline

```
Kafka topics (orders.*, payments.*, inventory.*)
    │
    ▼
Spark Streaming
    ├── Realtime aggregation → RSocket → notification-service → WebSocket → Dashboard
    └── Fraud detection → Kafka fraud.alert → notification-service
    │
    ▼
Airflow DAGs (scheduled)
    ├── daily_rfm_calculation → Spark Batch → Kafka analytics.rfm.results → customer-service
    ├── daily_abc_analysis → Spark Batch → product-service
    ├── churn_prediction → Spark ML → customer-service
    └── hourly_revenue_report → Spark SQL → finance-service
```

---

## 4. Cross-cutting concerns

### 4.1 Service Discovery

```
Eureka Server (:8761)
    │
    ├── product-service đăng ký: "PRODUCT-SERVICE" → 192.168.1.10:8081
    ├── order-service đăng ký: "ORDER-SERVICE" → 192.168.1.10:8082
    └── ... (tất cả services đều đăng ký)

API Gateway dùng Eureka để route:
    /api/v1/products/** → lb://PRODUCT-SERVICE
    /api/v1/orders/**   → lb://ORDER-SERVICE
```

### 4.2 Configuration Management

```
Config Server (:8888)
    │
    ├── application-common.yml       (shared: datasource, kafka, logging)
    ├── product-service.yml          (riêng: database URL, service-specific)
    └── order-service-dev.yml        (riêng theo profile: dev/staging/prod)
```

Mỗi service khi start sẽ fetch config từ Config Server trước khi khởi tạo beans.

### 4.3 Distributed Tracing

Mỗi request có `traceId` + `spanId` truyền xuyên suốt qua:
- HTTP header: `X-Trace-Id`
- Kafka header: `trace-id`
- gRPC metadata: `trace-id`

Log format:

```
2026-02-18 10:30:00.123 [traceId=abc123] [spanId=def456] INFO order-service - Order #DH-9823 created
2026-02-18 10:30:00.234 [traceId=abc123] [spanId=ghi789] INFO inventory-service - Stock reserved for order #DH-9823
```

### 4.4 Caching Strategy

```
Redis (:6379)
    │
    ├── Session cache:    "session:<userId>"        → user info (TTL 30m)
    ├── Product cache:    "product:<id>"            → ProductDTO (TTL 5m)
    ├── Category cache:   "categories:all"          → List<Category> (TTL 1h)
    ├── Stock cache:      "stock:<productId>:<whId>" → quantity (TTL 30s)
    ├── Rate limit:       "rate:<userId>"           → counter (TTL 1s)
    ├── Idempotency:      "event:<eventId>"         → "processed" (TTL 24h)
    └── Cart (nếu cần):   "cart:<sessionId>"        → CartDTO (TTL 2h)
```

Cache invalidation: write-through (update DB + invalidate cache đồng thời).

---

## 5. Security Architecture

```
┌───────────────────────────────────────────────────┐
│                    Frontend                        │
│  localStorage: omni_token (JWT)                    │
│  auth.interceptor.ts: gắn Bearer token             │
│  auth.guard.ts: check ROLE_PERMISSIONS              │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────┐
│              API Gateway (:8080)                    │
│                                                    │
│  JwtAuthFilter:                                    │
│    1. Extract token từ Authorization header        │
│    2. Validate signature (HS256 secret key)        │
│    3. Check expiration                             │
│    4. Extract role → set SecurityContext            │
│                                                    │
│  RateLimitFilter:                                  │
│    100 requests/second per user (Redis counter)    │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────┐
│              Each Microservice                     │
│                                                    │
│  @PreAuthorize("hasRole('ADMIN')")                │
│    → Method-level authorization                    │
│                                                    │
│  Ranger Plugin (data-level):                       │
│    → Row filter: nhân viên chỉ thấy kho mình      │
│    → Column mask: CS_AGENT thấy phone ****321     │
└───────────────────────────────────────────────────┘
```

JWT payload:

```json
{
  "sub": "superadmin",
  "role": "SUPER_ADMIN",
  "userId": 1,
  "department": "IT",
  "warehouse": null,
  "iat": 1708250000,
  "exp": 1708336400
}
```

---

## 6. Deployment Architecture (Production)

```
                    ┌─────────────────┐
                    │   CloudFlare    │
                    │   CDN + WAF     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx         │
                    │   Load Balancer │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌──────────────┐┌──────────────┐┌──────────────┐
    │ Gateway ×2   ││ Gateway ×2   ││ Frontend     │
    │ (Active)     ││ (Standby)    ││ (Static S3)  │
    └──────┬───────┘└──────────────┘└──────────────┘
           │
    Kubernetes Cluster
    ┌──────┼──────────────────────────────────┐
    │      │                                   │
    │  ┌───▼──────┐ ┌──────────┐ ┌──────────┐│
    │  │order ×4  │ │product ×2│ │customer×2││
    │  └──────────┘ └──────────┘ └──────────┘│
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐│
    │  │inventory │ │payment ×2│ │marketing ││
    │  │    ×2    │ │          │ │    ×1    ││
    │  └──────────┘ └──────────┘ └──────────┘│
    │                                         │
    │  ┌────────────────────────────────────┐ │
    │  │ Managed Services (AWS/GCP)        │ │
    │  │ RDS PostgreSQL (Multi-AZ)         │ │
    │  │ ElastiCache Redis (Cluster)       │ │
    │  │ MSK Kafka (3 brokers)             │ │
    │  │ OpenSearch (3 nodes)              │ │
    │  │ EMR Spark                         │ │
    │  │ MWAA Airflow                      │ │
    │  └────────────────────────────────────┘ │
    └─────────────────────────────────────────┘
```
