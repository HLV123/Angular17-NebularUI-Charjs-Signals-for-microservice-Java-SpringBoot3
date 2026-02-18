# TESTING-GUIDE.md · Chiến lược kiểm thử

---

## 1. Kim tự tháp testing

```
                 ┌─────────┐
                 │  E2E    │  ← Ít nhất, chậm nhất, đắt nhất
                 │  Tests  │
                ┌┴─────────┴┐
                │Integration │  ← Vừa phải
                │   Tests    │
               ┌┴────────────┴┐
               │  Unit Tests   │  ← Nhiều nhất, nhanh nhất
               └───────────────┘
```

| Loại | Tỷ lệ | Tốc độ | Scope |
|---|---|---|---|
| Unit test | 70% | < 1s / test | 1 class, mock dependencies |
| Integration test | 20% | 1-10s / test | Service + DB + Kafka (Testcontainers) |
| Contract test | 5% | 2-5s / test | Kafka schema, gRPC proto, REST API |
| E2E test | 5% | 10-60s / test | Full flow qua nhiều services |

---

## 2. Unit Tests

### Backend (JUnit 5 + Mockito)

Test service layer, mock repository và external calls.

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    void getProduct_existingId_returnsDTO() {
        // Given
        Product entity = new Product();
        entity.setId(1L);
        entity.setSku("TT-OS-001");
        entity.setName("Áo khoác bomber");

        ProductDTO dto = new ProductDTO();
        dto.setId(1L);
        dto.setSku("TT-OS-001");

        when(productRepository.findById(1L)).thenReturn(Optional.of(entity));
        when(productMapper.toDTO(entity)).thenReturn(dto);

        // When
        ProductDTO result = productService.getProduct(1L);

        // Then
        assertThat(result.getSku()).isEqualTo("TT-OS-001");
        verify(productRepository).findById(1L);
    }

    @Test
    void getProduct_nonExistingId_throwsNotFound() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class,
            () -> productService.getProduct(999L));
    }

    @Test
    void createProduct_duplicateSku_throwsConflict() {
        ProductCreateRequest req = new ProductCreateRequest();
        req.setSku("TT-OS-001");

        when(productRepository.existsBySku("TT-OS-001")).thenReturn(true);

        assertThrows(DuplicateSkuException.class,
            () -> productService.createProduct(req));
    }
}
```

### Quy tắc đặt tên test

```
methodName_condition_expectedResult

getProduct_existingId_returnsDTO
getProduct_nonExistingId_throwsNotFound
createOrder_insufficientStock_throwsException
updateStatus_invalidTransition_throwsBadRequest
reserveStock_concurrentRequests_onlyOneSucceeds
```

### Mỗi service cần unit test cho

| Layer | Test gì | Mock gì |
|---|---|---|
| Service | Business logic, validation, edge cases | Repository, Mapper, gRPC clients, Kafka publishers |
| Controller | Request mapping, status codes, error handling | Service |
| Mapper | Entity ↔ DTO conversion đúng fields | Không mock |
| Kafka listener | Deserialize event, gọi đúng service method | Service |

### Frontend (Jasmine + Karma — đã có sẵn trong Angular)

```typescript
describe('ProductService', () => {
    let service: ProductService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ProductService);
    });

    it('should return 12 mock products', () => {
        expect(service.getProducts().length).toBe(12);
    });

    it('should find product by id', () => {
        const product = service.getProducts().find(p => p.id === 1);
        expect(product?.sku).toBe('TT-OS-001');
    });
});
```

---

## 3. Integration Tests

Dùng **Testcontainers** để spin up PostgreSQL + Kafka thật trong Docker.

### Setup

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>kafka</artifactId>
    <scope>test</scope>
</dependency>
```

### Repository test (DB thật)

```java
@DataJpaTest
@Testcontainers
class ProductRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ProductRepository productRepository;

    @Test
    void findByStatus_active_returnsOnlyActive() {
        // Given: Flyway migration tạo bảng + seed data
        // When
        List<Product> active = productRepository.findByStatus("active");
        // Then
        assertThat(active).allMatch(p -> p.getStatus().equals("active"));
    }

    @Test
    void findBySku_unique_returnsOne() {
        Product product = productRepository.findBySku("TT-OS-001");
        assertThat(product).isNotNull();
        assertThat(product.getName()).contains("Áo khoác");
    }
}
```

### Kafka integration test

```java
@SpringBootTest
@Testcontainers
@EmbeddedKafka(partitions = 1, topics = {"orders.created"})
class OrderEventPublisherTest {

    @Autowired
    private OrderEventPublisher publisher;

    @Autowired
    private KafkaConsumer<String, String> testConsumer;

    @Test
    void publishOrderCreated_validOrder_messageOnTopic() {
        // Given
        OrderCreatedEvent event = OrderCreatedEvent.builder()
            .orderId(1L)
            .code("#DH-9823")
            .channel("Shopee")
            .total(1280000L)
            .build();

        // When
        publisher.publish(event);

        // Then
        ConsumerRecords<String, String> records = KafkaTestUtils.getRecords(testConsumer);
        assertThat(records.count()).isEqualTo(1);

        String value = records.iterator().next().value();
        assertThat(value).contains("DH-9823");
        assertThat(value).contains("1280000");
    }
}
```

### gRPC integration test

```java
@SpringBootTest
class InventoryGrpcServiceTest {

    @Autowired
    private InventoryGrpcService grpcService;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Test
    void checkStock_availableItem_returnsTrue() {
        // Given: seed data có TT-OS-001 quantity=60 ở WH-HCM
        CheckStockRequest request = CheckStockRequest.newBuilder()
            .addItems(StockQuery.newBuilder()
                .setProductId(1)
                .setSku("TT-OS-001")
                .setQuantityNeeded(10)
                .build())
            .build();

        // When
        CheckStockResponse response = grpcService.checkStock(request);

        // Then
        assertThat(response.getAllAvailable()).isTrue();
        assertThat(response.getItems(0).getAvailableQuantity()).isGreaterThanOrEqualTo(10);
    }

    @Test
    void reserveStock_exceedsAvailable_returnsFalse() {
        ReserveStockRequest request = ReserveStockRequest.newBuilder()
            .setOrderId(999)
            .addItems(ReserveItem.newBuilder()
                .setProductId(1)
                .setSku("TT-OS-001")
                .setQuantity(99999)
                .build())
            .build();

        ReserveStockResponse response = grpcService.reserveStock(request);

        assertThat(response.getSuccess()).isFalse();
    }
}
```

---

## 4. Contract Tests

Đảm bảo producer và consumer đồng ý về schema. Nếu producer thay đổi event format mà consumer chưa update → test fail.

### Kafka contract test (Spring Cloud Contract)

```java
// Trong order-service (producer)
@Test
void orderCreatedEvent_matchesContract() {
    String json = objectMapper.writeValueAsString(event);

    // Verify schema
    assertThat(json).containsKey("eventId");
    assertThat(json).containsKey("eventType");
    assertThat(json).containsKey("data");
    assertThat(json.get("data")).containsKey("orderId");
    assertThat(json.get("data")).containsKey("code");
    assertThat(json.get("data")).containsKey("items");
    assertThat(json.get("data").get("items")[0]).containsKey("productId");
    assertThat(json.get("data").get("items")[0]).containsKey("sku");
    assertThat(json.get("data").get("items")[0]).containsKey("quantity");
}
```

```java
// Trong inventory-service (consumer)
@Test
void canDeserializeOrderCreatedEvent() {
    String json = """
        {
          "eventId": "uuid",
          "eventType": "ORDER_CREATED",
          "source": "order-service",
          "timestamp": "2026-02-18T10:30:00Z",
          "version": 1,
          "data": {
            "orderId": 1,
            "code": "#DH-9823",
            "items": [{"productId":1,"sku":"TT-OS-001","quantity":2}]
          }
        }
    """;

    OrderCreatedEvent event = objectMapper.readValue(json, OrderCreatedEvent.class);

    assertThat(event.getData().getItems()).hasSize(1);
    assertThat(event.getData().getItems().get(0).getSku()).isEqualTo("TT-OS-001");
}
```

### REST API contract test

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class ProductControllerContractTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void getProducts_returnsPageFormat() {
        ResponseEntity<String> response = rest.getForEntity("/api/v1/products?page=0&size=5", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.has("content")).isTrue();
        assertThat(body.has("totalElements")).isTrue();
        assertThat(body.has("totalPages")).isTrue();
        assertThat(body.has("size")).isTrue();
        assertThat(body.has("number")).isTrue();
    }

    @Test
    void getProductById_returnsCorrectFields() {
        ResponseEntity<String> response = rest.getForEntity("/api/v1/products/1", String.class);

        JsonNode product = objectMapper.readTree(response.getBody());

        // Verify fields frontend entities.ts expects
        assertThat(product.has("id")).isTrue();
        assertThat(product.has("sku")).isTrue();
        assertThat(product.has("name")).isTrue();
        assertThat(product.has("price")).isTrue();
        assertThat(product.has("costPrice")).isTrue();
        assertThat(product.has("stock")).isTrue();
        assertThat(product.has("variants")).isTrue();
        assertThat(product.has("channels")).isTrue();
        assertThat(product.has("createdAt")).isTrue();

        // Verify price is integer VND (not float)
        assertThat(product.get("price").isInt() || product.get("price").isLong()).isTrue();
    }
}
```

---

## 5. E2E Tests

### Full order flow test

```java
@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OrderFlowE2ETest {

    @Autowired private TestRestTemplate rest;

    static String jwt;
    static Long orderId;

    @Test @Order(1)
    void step1_login() {
        ResponseEntity<LoginResponse> response = rest.postForEntity(
            "http://localhost:8080/api/v1/auth/login",
            new LoginRequest("admin", "123456"),
            LoginResponse.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        jwt = response.getBody().getToken();
    }

    @Test @Order(2)
    void step2_createOrder() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwt);
        // ... create order
        // orderId = response id
    }

    @Test @Order(3)
    void step3_confirmOrder() {
        // PUT /orders/{orderId}/status → confirmed
        // Verify inventory reserved
    }

    @Test @Order(4)
    void step4_verifyStockReserved() {
        // GET /stock?productId=1
        // Verify quantity decreased by order amount
    }

    @Test @Order(5)
    void step5_verifyNotification() {
        // GET /notifications
        // Verify "Đơn hàng mới" notification exists
    }
}
```

---

## 6. Test data management

### Seed data cho test

Mỗi service có `src/test/resources/`:

```
src/test/resources/
├── application-test.yml          ← DB URL trỏ tới Testcontainers
├── data/
│   ├── seed_products.sql         ← 12 products từ MOCK-DATA.md
│   ├── seed_orders.sql           ← 10 orders từ MOCK-DATA.md
│   └── seed_customers.sql        ← 8 customers từ MOCK-DATA.md
└── contracts/
    ├── order_created_event.json  ← Sample event cho contract test
    └── product_response.json     ← Expected response format
```

### Quy tắc

- Test KHÔNG dùng production database
- Mỗi test class tự setup/teardown data (`@BeforeEach` / `@AfterEach`)
- Dùng `@Transactional` trên test class → auto rollback sau mỗi test
- Integration test dùng Testcontainers → mỗi lần chạy tạo DB mới

---

## 7. CI Pipeline

```
git push → GitHub Actions / GitLab CI
    │
    ├── Stage 1: Build
    │   mvn clean compile (mỗi service parallel)
    │
    ├── Stage 2: Unit Tests
    │   mvn test -pl product-service
    │   mvn test -pl order-service
    │   mvn test -pl ... (parallel)
    │   ng test --watch=false (frontend)
    │
    ├── Stage 3: Integration Tests
    │   mvn verify -pl product-service -P integration
    │   mvn verify -pl order-service -P integration
    │   (cần Docker-in-Docker cho Testcontainers)
    │
    ├── Stage 4: Contract Tests
    │   mvn test -pl order-service -Dtest=*Contract*
    │   mvn test -pl inventory-service -Dtest=*Contract*
    │
    ├── Stage 5: Build Docker Images
    │   docker build -t omni/product-service .
    │   docker build -t omni/order-service .
    │
    └── Stage 6: Deploy to staging
        kubectl apply -f k8s/
```

---

## 8. Coverage targets

| Layer | Coverage mục tiêu | Bắt buộc |
|---|---|---|
| Service classes | >= 80% | Có |
| Controller classes | >= 70% | Có |
| Repository (custom queries) | >= 60% | Có |
| Mapper | >= 90% | Có (đơn giản, dễ test) |
| Kafka listener/publisher | >= 70% | Có |
| gRPC service | >= 70% | Có |
| Config classes | Không test | Không |
| Entity (getter/setter) | Không test | Không |

Tool: JaCoCo cho Java, Istanbul cho Angular.

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <rules>
            <rule>
                <limits>
                    <limit>
                        <counter>LINE</counter>
                        <minimum>0.70</minimum>
                    </limit>
                </limits>
            </rule>
        </rules>
    </configuration>
</plugin>
```
