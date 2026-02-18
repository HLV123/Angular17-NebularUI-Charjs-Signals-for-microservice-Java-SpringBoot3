# TROUBLESHOOTING.md · Xử lý lỗi & Debug

---

## 1. Lỗi khởi động

### 1.1 Service không tìm thấy Eureka

```
com.netflix.discovery.shared.transport.TransportException: Cannot execute request on any known server
```

**Nguyên nhân**: service-registry chưa start hoặc chưa healthy.

**Cách sửa**: Start service-registry trước, chờ log `Started Eureka Server` rồi mới start các service khác. Kiểm tra `http://localhost:8761`.

### 1.2 Service không lấy được config

```
Could not resolve placeholder 'spring.datasource.url'
```

**Nguyên nhân**: config-server chưa start.

**Cách sửa**: Start config-server sau service-registry. Chờ log `Started ConfigServerApplication`. Test: `curl http://localhost:8888/product-service/default`.

### 1.3 Database connection refused

```
org.postgresql.util.PSQLException: Connection to localhost:5432 refused
```

**Nguyên nhân**: PostgreSQL container chưa chạy hoặc database chưa tạo.

**Cách sửa**:

```bash
docker ps | grep postgres
docker exec omni-postgres psql -U omni -l    # liệt kê databases
```

Nếu thiếu database → chạy lại init script hoặc tạo thủ công:

```bash
docker exec omni-postgres psql -U omni -c "CREATE DATABASE omni_products;"
```

### 1.4 Kafka connection timeout

```
org.apache.kafka.common.errors.TimeoutException: Topic orders.created not present in metadata after 60000 ms
```

**Nguyên nhân**: Kafka chưa start, hoặc topic chưa tạo (auto.create.topics = false).

**Cách sửa**:

```bash
# Kiểm tra Kafka
docker logs omni-kafka --tail 50

# Kiểm tra topics
docker exec omni-kafka kafka-topics --list --bootstrap-server localhost:9092

# Nếu thiếu topics → chạy lại kafka-init
docker compose up -d kafka-init
```

### 1.5 Elasticsearch max virtual memory

```
max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

**Cách sửa** (Windows):

```powershell
wsl -d docker-desktop sysctl -w vm.max_map_count=262144
```

Để set vĩnh viễn, tạo file `%USERPROFILE%\.wslconfig`:

```
[wsl2]
kernelCommandLine = sysctl.vm.max_map_count=262144
```

### 1.6 Port đã bị chiếm

```
Web server failed to start. Port 8080 was already in use.
```

**Cách sửa** (Windows):

```powershell
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

---

## 2. Lỗi runtime

### 2.1 JWT token expired

**Triệu chứng**: Frontend hiển thị trang login sau 1 thời gian, hoặc API trả 401.

**Debug**:

```bash
# Decode JWT (paste token vào jwt.io hoặc)
echo "<token>" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .

# Kiểm tra exp timestamp
# "exp": 1708336400 → convert sang datetime
date -d @1708336400
```

**Cách sửa**: Frontend `auth.interceptor.ts` nên check token expiry, tự động redirect về login. Backend nên trả `401` với message rõ ràng.

### 2.2 CORS error

```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/products' from origin 'http://localhost:4200' has been blocked by CORS policy
```

**Cách sửa**: Kiểm tra `CorsConfig.java` trong api-gateway:

```java
@Bean
public CorsWebFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.addAllowedOrigin("http://localhost:4200");
    config.addAllowedMethod("*");
    config.addAllowedHeader("*");
    config.setAllowCredentials(true);
    // ...
}
```

### 2.3 gRPC deadline exceeded

```
io.grpc.StatusRuntimeException: DEADLINE_EXCEEDED: deadline exceeded after 499.9ms
```

**Nguyên nhân**: inventory-service xử lý quá chậm hoặc bị overload.

**Debug**:

```bash
# Kiểm tra CPU/Memory inventory-service
# Kiểm tra DB query performance
# Kiểm tra có lock contention không (concurrent ReserveStock)
```

**Cách sửa**:
- Tăng deadline (nhưng không nên quá 5s)
- Optimize query (thêm index)
- Check circuit breaker status — nếu circuit open, cần chờ hoặc restart target service

### 2.4 Kafka consumer lag tăng

**Triệu chứng**: Đơn hàng tạo xong nhưng tồn kho chưa trừ, notification chưa gửi.

**Debug**:

```bash
# Kiểm tra consumer lag
docker exec omni-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe \
  --group inventory-service-group

# Output:
# TOPIC          PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# orders.created 0          1000            1250            250  ← lag 250 messages
```

**Cách sửa**:
- Consumer xử lý chậm → optimize logic, tăng `max.poll.records`
- Consumer bị crash → kiểm tra log, restart
- Partition quá ít → tăng partition (nhưng cần restart consumer group)

### 2.5 Duplicate events (Kafka at-least-once)

**Triệu chứng**: Tồn kho bị trừ 2 lần cho cùng 1 đơn hàng.

**Debug**: Kiểm tra log inventory-service xem eventId có trùng không.

**Cách sửa**: Consumer phải implement idempotency:

```java
public void handleOrderCreated(OrderCreatedEvent event) {
    // Check đã xử lý chưa
    if (processedEventRepository.existsByEventId(event.getEventId())) {
        log.warn("Duplicate event {}, skipping", event.getEventId());
        return;
    }
    // Xử lý
    reserveStock(event);
    // Ghi nhận đã xử lý
    processedEventRepository.save(new ProcessedEvent(event.getEventId()));
}
```

### 2.6 Stock race condition

**Triệu chứng**: 2 đơn cùng đặt sản phẩm chỉ còn 1 → cả 2 đều thành công → stock âm.

**Cách sửa**: Dùng optimistic locking hoặc pessimistic locking:

```java
// Optimistic lock (entity)
@Version
private Long version;

// Hoặc pessimistic lock (repository)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT s FROM StockItem s WHERE s.sku = :sku AND s.warehouseId = :warehouseId")
Optional<StockItem> findAndLockBySku(@Param("sku") String sku, @Param("warehouseId") Long warehouseId);
```

---

## 3. Tracing request qua nhiều services

### 3.1 Cách tìm request flow

Mỗi request có `traceId` duy nhất truyền qua tất cả services:

```
Angular → Gateway (traceId=abc123)
       → order-service (traceId=abc123, spanId=001)
       → inventory-service gRPC (traceId=abc123, spanId=002)
       → Kafka orders.created (header trace-id=abc123)
       → notification-service (traceId=abc123, spanId=003)
```

### 3.2 Tìm log theo traceId

```bash
# Tìm trong 1 service
docker logs omni-order-service 2>&1 | grep "abc123"

# Tìm tất cả services
for svc in product order inventory customer payment marketing channel shipping notification staff finance search; do
  echo "=== ${svc}-service ==="
  docker logs omni-${svc}-service 2>&1 | grep "abc123"
done
```

### 3.3 Grafana + Tempo (distributed tracing)

Nếu đã setup Tempo:

```
Grafana → Explore → Tempo → Search → traceId = abc123
```

Sẽ hiển thị waterfall diagram: service nào mất bao lâu, service nào lỗi.

---

## 4. Debug tools

### 4.1 Database

```bash
# Kết nối trực tiếp
docker exec -it omni-postgres psql -U omni -d omni_orders

# Query nhanh
psql> SELECT id, code, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10;
psql> SELECT * FROM order_status_logs WHERE order_id = 1 ORDER BY created_at;
```

### 4.2 Kafka

```bash
# Consume messages realtime (debug)
docker exec omni-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders.created \
  --from-beginning \
  --max-messages 5

# Xem chi tiết topic
docker exec omni-kafka kafka-topics \
  --describe \
  --topic orders.created \
  --bootstrap-server localhost:9092
```

### 4.3 Elasticsearch

```bash
# Cluster health
curl http://localhost:9200/_cluster/health?pretty

# Xem indices
curl http://localhost:9200/_cat/indices?v

# Search
curl "http://localhost:9200/products/_search?q=áo+khoác&pretty"
```

### 4.4 Redis

```bash
docker exec omni-redis redis-cli

> KEYS *                          # tất cả keys
> GET session:1                   # session user id=1
> TTL product:1                   # thời gian sống còn lại
> MONITOR                         # xem realtime tất cả commands (CẢNH BÁO: chậm production)
```

### 4.5 gRPC (grpcurl)

```bash
# Cài grpcurl: https://github.com/fullstorydev/grpcurl

# List services
grpcurl -plaintext localhost:9091 list

# Call CheckStock
grpcurl -plaintext -d '{
  "items": [{"productId":1,"sku":"TT-OS-001","quantityNeeded":5}]
}' localhost:9091 omnirevenue.inventory.InventoryService/CheckStock
```

### 4.6 WebSocket (wscat)

```bash
# Cài: npm install -g wscat

# Kết nối
wscat -c "ws://localhost:8080/ws?token=<jwt_token>"

# Chờ nhận message
# Khi có đơn mới, sẽ thấy JSON push vào
```

### 4.7 Actuator endpoints (mỗi Spring Boot service)

```bash
# Health check
curl http://localhost:8081/actuator/health

# Metrics
curl http://localhost:8081/actuator/metrics/jvm.memory.used

# Kafka consumer metrics
curl http://localhost:8081/actuator/metrics/kafka.consumer.records.lag

# Environment
curl http://localhost:8081/actuator/env

# Thread dump (khi bị treo)
curl http://localhost:8081/actuator/threaddump
```

---

## 5. Checklist debug theo triệu chứng

### "Frontend gọi API nhưng không có response"

```
1. Mở DevTools → Network tab → xem request có gửi đi không
2. Kiểm tra status code:
   - 0 / ERR_CONNECTION_REFUSED → Gateway chưa chạy
   - 401 → Token hết hạn hoặc sai
   - 403 → Không có quyền (kiểm tra role)
   - 404 → URL sai hoặc service target chưa đăng ký Eureka
   - 500 → Lỗi backend (xem log service)
   - 502/503 → Service target down
3. curl http://localhost:8080/api/v1/products → test trực tiếp
4. curl http://localhost:8081/api/v1/products → test bỏ qua gateway
5. Kiểm tra Eureka: http://localhost:8761 → service có đăng ký không
```

### "Đơn hàng tạo rồi nhưng tồn kho không trừ"

```
1. Kiểm tra order status log → đơn đã confirmed chưa
2. Kiểm tra Kafka consumer lag cho topic orders.confirmed
3. Kiểm tra log inventory-service → có nhận event không
4. Kiểm tra eventId → có bị deduplicate không (đã xử lý trước đó)
5. Kiểm tra DLQ → event có bị đẩy vào dead letter không
6. Kiểm tra circuit breaker state → gRPC inventory có bị circuit open không
```

### "Dashboard không hiện notification realtime"

```
1. DevTools → Console → có lỗi WebSocket không
2. DevTools → Network → WS tab → connection status
3. Kiểm tra gateway log → WebSocket proxy có forward không
4. Kiểm tra notification-service → WebSocketSessionManager → có session nào connected không
5. Kiểm tra Kafka consumer → notification-service có nhận event không
6. Test thủ công: wscat -c "ws://localhost:8080/ws?token=xxx"
```

### "Spark job chạy lỗi"

```
1. Airflow UI http://localhost:8280 → DAG → check task status
2. Click task failed → View Log
3. Kiểm tra Spark Master UI http://localhost:8180 → Completed Applications → stderr
4. Lỗi phổ biến:
   - OutOfMemoryError → tăng SPARK_WORKER_MEMORY
   - Connection refused Kafka → kiểm tra kafka bootstrap server config
   - ClassNotFoundException → jar chưa build hoặc thiếu dependency
```
