# CODING-CONVENTIONS.md · Quy ước code cho team

---

## 1. Java / Spring Boot (Backend)

### Package structure mỗi service

```
vn.omnirevenue.<service>/
├── <Service>Application.java        // @SpringBootApplication
├── config/                           // @Configuration beans
├── controller/                       // @RestController
├── dto/                              // Request/Response DTOs
├── entity/                           // @Entity JPA
├── enums/                            // Enum types
├── repository/                       // @Repository JPA
├── service/                          // Interface + Impl
├── mapper/                           // Entity ↔ DTO conversion
├── grpc/                             // gRPC server/client
├── kafka/                            // Kafka producer/consumer
├── exception/                        // Custom exceptions + GlobalExceptionHandler
└── util/                             // Helper classes
```

### Naming conventions

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Class | PascalCase | `ProductService`, `OrderController` |
| Interface | PascalCase, không prefix I | `ProductService` (không phải `IProductService`) |
| Implementation | Interface + Impl | `ProductServiceImpl` |
| Method | camelCase, verb first | `getProducts()`, `createOrder()`, `updateStatus()` |
| Variable | camelCase | `totalAmount`, `orderItems` |
| Constant | UPPER_SNAKE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| DTO | PascalCase + DTO/Request/Response | `ProductDTO`, `OrderCreateRequest`, `LoginResponse` |
| Entity | PascalCase, singular | `Product`, `Order`, `Customer` |
| Repository | Entity + Repository | `ProductRepository`, `OrderRepository` |
| Controller | Entity + Controller | `ProductController`, `OrderController` |
| Kafka listener | Event + Listener | `OrderEventListener`, `PaymentEventListener` |
| Kafka publisher | Event + Publisher | `OrderEventPublisher`, `InventoryEventPublisher` |
| Table name | snake_case, plural | `products`, `order_items`, `stock_movements` |
| Column name | snake_case | `created_at`, `customer_name`, `total_amount` |
| Kafka topic | dot.separated | `orders.created`, `inventory.low_stock` |

### DTO vs Entity

- **Entity**: map 1:1 với database table. Chỉ dùng trong service/repository layer. KHÔNG BAO GIỜ return entity ra controller.
- **DTO**: dùng cho API request/response. Controller chỉ nhận/trả DTO.
- **Mapper**: convert Entity ↔ DTO bằng MapStruct hoặc manual method.

```java
// Controller
@GetMapping("/{id}")
public ResponseEntity<ProductDTO> getProduct(@PathVariable Long id) {
    return ResponseEntity.ok(productService.getProduct(id));
}

// Service
public ProductDTO getProduct(Long id) {
    Product entity = productRepository.findById(id)
        .orElseThrow(() -> new ProductNotFoundException(id));
    return productMapper.toDTO(entity);
}
```

### Error handling

Mỗi service có `GlobalExceptionHandler`:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse(404, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(f -> new FieldError(f.getField(), f.getDefaultMessage()))
            .toList();
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(400, "Validation failed", errors));
    }
}
```

### Logging

Format: `[traceId] [service] [level] message`

```java
// Dùng Slf4j
@Slf4j
public class OrderServiceImpl {
    public OrderDTO createOrder(OrderCreateRequest req) {
        log.info("Creating order for customer: {}", req.getCustomerName());
        // ...
        log.info("Order {} created successfully", order.getCode());
    }
}
```

Quy tắc:
- `INFO`: business event quan trọng (order created, payment completed, stock updated)
- `WARN`: recoverable error (retry Kafka, timeout nhưng đã fallback)
- `ERROR`: unrecoverable error (database down, null pointer)
- `DEBUG`: chi tiết kỹ thuật (query params, response body) — chỉ bật ở dev
- KHÔNG log PII (phone, email) ở INFO level. Nếu cần debug → DEBUG level + mask

---

## 2. Angular / TypeScript (Frontend)

### File naming

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Component | kebab-case | `products.component.ts`, `order-detail.component.ts` |
| Service | kebab-case | `product.service.ts`, `auth.service.ts` |
| Model / Interface | kebab-case file, PascalCase interface | `entities.ts` → `export interface Product` |
| Pipe | kebab-case | `vnd-currency.pipe.ts` |
| Guard | kebab-case | `auth.guard.ts` |

### Component structure

```typescript
@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, FormsModule, ...],
    templateUrl: './products.component.html',
    styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
    // 1. Injected services
    private productService = inject(ProductService);
    private authService = inject(AuthService);

    // 2. Signals / state
    products = signal<Product[]>([]);
    loading = signal(false);
    selectedProduct = signal<Product | null>(null);

    // 3. Lifecycle
    ngOnInit() {
        this.loadProducts();
    }

    // 4. Public methods (used in template)
    loadProducts() { ... }
    deleteProduct(id: number) { ... }

    // 5. Private helpers
    private handleError(err: any) { ... }
}
```

### Không dùng

- `any` type → dùng interface cụ thể hoặc `unknown`
- `var` → dùng `const` hoặc `let`
- jQuery → dùng Angular built-in
- Direct DOM manipulation → dùng template binding

---

## 3. Git Conventions

### Branch naming

```
main                        ← production-ready
develop                     ← integration branch
feature/ORM-123-add-voucher ← feature branch (Jira ticket)
bugfix/ORM-456-fix-stock    ← bug fix
hotfix/ORM-789-payment-down ← production hotfix
```

### Commit message

Format: `<type>(<scope>): <subject>`

```
feat(order): add return/exchange workflow
fix(inventory): fix stock race condition on concurrent orders
refactor(product): extract variant service from product service
docs(api): update API contracts for search endpoint
test(payment): add integration test for VNPay callback
chore(docker): update Kafka image to 7.6.0
perf(search): add Elasticsearch index for product name
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

Scope: service name hoặc module (`order`, `product`, `inventory`, `gateway`, `frontend`, `docker`, `kafka`)

### Pull Request

- Title: giống commit message
- Description: WHY (tại sao thay đổi), WHAT (thay đổi gì), HOW (cách test)
- Ít nhất 1 reviewer approve trước khi merge
- CI phải pass (build + test)
- Squash merge vào develop

---

## 4. API Design

### URL structure

```
GET    /api/v1/products              → danh sách (có pagination)
GET    /api/v1/products/{id}         → chi tiết
POST   /api/v1/products              → tạo mới
PUT    /api/v1/products/{id}         → cập nhật
DELETE /api/v1/products/{id}         → xóa
PUT    /api/v1/orders/{id}/status    → action cụ thể trên resource
GET    /api/v1/staff/leaderboard     → sub-resource
```

### Response format

Luôn trả JSON, luôn có HTTP status code đúng:

| Status | Khi nào |
|---|---|
| 200 OK | GET, PUT thành công |
| 201 Created | POST tạo mới thành công |
| 204 No Content | DELETE thành công |
| 400 Bad Request | Validation error |
| 401 Unauthorized | Chưa login hoặc token hết hạn |
| 403 Forbidden | Không có quyền (role không đủ) |
| 404 Not Found | Resource không tồn tại |
| 409 Conflict | Trùng lặp (duplicate SKU, voucher code) |
| 500 Internal Server Error | Lỗi server |
