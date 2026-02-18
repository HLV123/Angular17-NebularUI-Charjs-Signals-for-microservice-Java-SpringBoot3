# API-CONTRACTS.md · REST Endpoint Specification

Tất cả endpoint đi qua API Gateway `http://localhost:8080/api/v1`. Frontend Angular gọi tới base URL này, backend Spring Boot phải trả response đúng format dưới đây.

---

## Quy ước chung

### Authentication

Mọi request (trừ login) phải gửi header:

```
Authorization: Bearer <jwt_token>
```

Frontend `auth.interceptor.ts` tự động gắn token từ `localStorage.getItem('omni_token')`.

### Pagination

Mọi endpoint danh sách trả format Spring Boot Page:

```json
{
  "content": [ ... ],
  "totalElements": 1526,
  "totalPages": 77,
  "size": 20,
  "number": 0,
  "first": true,
  "last": false
}
```

Query params: `?page=0&size=20&sort=createdAt,desc`

Frontend `pagination.component.ts` đã dùng `totalElements`, `size`, `number`.

### Tiền tệ

Backend trả số nguyên VND (không chia 100, không dùng float):

```json
{ "price": 520000, "total": 1280000 }
```

Frontend pipe `vnd` sẽ format: `520.000₫`, `1.280.000₫`.

### Ngày giờ

Backend trả ISO 8601 string:

```json
{ "createdAt": "2026-02-18T10:30:00Z" }
```

Frontend pipe `relativeTime` sẽ convert: "5 phút trước", "2 giờ trước".

### Error Response

Format thống nhất cho mọi lỗi:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Tên sản phẩm không được để trống",
  "timestamp": "2026-02-18T10:30:00Z",
  "path": "/api/v1/products",
  "errors": [
    { "field": "name", "message": "không được để trống" },
    { "field": "price", "message": "phải lớn hơn 0" }
  ]
}
```

---

## 1. Auth (staff-service)

### POST /api/v1/auth/login

```
Request:
{
  "username": "superadmin",
  "password": "123456"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "superadmin",
    "fullName": "Nguyễn Văn Admin",
    "role": "SUPER_ADMIN",
    "roleLabel": "Super Admin",
    "initials": "SA",
    "department": "IT",
    "email": "admin@omnirevenue.vn"
  }
}

Response 401:
{
  "status": 401,
  "message": "Tên đăng nhập hoặc mật khẩu không đúng"
}
```

JWT payload chứa: `sub` (username), `role` (UserRole), `exp` (expiration), `iat` (issued at).

---

## 2. Products (product-service)

### GET /api/v1/products

```
Query: ?page=0&size=20&sort=createdAt,desc&category=&status=&search=
Response 200: Page<ProductDTO>
```

### GET /api/v1/products/{id}

```
Response 200:
{
  "id": 1,
  "sku": "TT-OS-001",
  "name": "Áo khoác bomber nam cao cấp",
  "description": "Áo khoác bomber chất liệu dù cao cấp, form regular fit",
  "category": "Thời trang nam",
  "brand": "OmniStyle",
  "price": 520000,
  "costPrice": 280000,
  "salePrice": 468000,
  "stock": 95,
  "sold": 1240,
  "rating": 4.8,
  "status": "active",
  "images": ["https://cdn.omnirevenue.vn/products/tt-os-001-1.jpg"],
  "variants": [
    {
      "id": 1,
      "sku": "TT-OS-001-BK-M",
      "attributes": { "color": "Đen", "size": "M" },
      "price": 520000,
      "stock": 30
    }
  ],
  "channels": [
    { "channel": "Website", "price": 520000, "enabled": true },
    { "channel": "Shopee", "price": 540000, "enabled": true }
  ],
  "createdAt": "2025-10-15T00:00:00Z"
}

Response 404:
{ "status": 404, "message": "Sản phẩm không tồn tại" }
```

### POST /api/v1/products

```
Request:
{
  "name": "Áo khoác bomber nam cao cấp",
  "description": "...",
  "category": "Thời trang nam",
  "brand": "OmniStyle",
  "price": 520000,
  "costPrice": 280000,
  "salePrice": 468000,
  "stock": 95,
  "variants": [...],
  "channels": [...]
}

Response 201: ProductDTO (có id, sku tự sinh)
Response 400: Validation errors
Response 409: { "message": "SKU đã tồn tại" }
```

### PUT /api/v1/products/{id}

```
Request: Partial<ProductDTO> (chỉ gửi fields cần update)
Response 200: ProductDTO updated
Response 404: Không tìm thấy
```

### DELETE /api/v1/products/{id}

```
Response 204: No Content (soft delete)
Response 409: { "message": "Không thể xóa, sản phẩm đã có đơn hàng" }
```

### GET /api/v1/categories

```
Response 200:
[
  {
    "id": 1,
    "name": "Thời trang nam",
    "slug": "thoi-trang-nam",
    "parentId": null,
    "children": [],
    "productCount": 324
  }
]
```

---

## 3. Orders (order-service)

### GET /api/v1/orders

```
Query: ?page=0&size=20&sort=createdAt,desc&status=&channel=&search=
Response 200: Page<OrderDTO>
```

### GET /api/v1/orders/{id}

```
Response 200:
{
  "id": 1,
  "code": "#DH-9823",
  "channel": "Shopee",
  "customerName": "Nguyễn Minh Anh",
  "customerPhone": "0987654321",
  "customerEmail": "anh@email.com",
  "items": [
    {
      "productId": 1,
      "sku": "TT-OS-001-BK-M",
      "name": "Áo khoác bomber nam cao cấp",
      "price": 520000,
      "quantity": 2,
      "total": 1040000
    }
  ],
  "subtotal": 1420000,
  "shippingFee": 0,
  "discount": 140000,
  "total": 1280000,
  "paymentMethod": "VNPay",
  "paymentStatus": "paid",
  "status": "confirmed",
  "note": "",
  "shippingAddress": "123 Nguyễn Huệ, Q1, TP.HCM",
  "trackingNumber": null,
  "slaDeadline": "2026-02-18T11:30:00Z",
  "createdAt": "2026-02-18T10:25:00Z",
  "updatedAt": "2026-02-18T10:25:00Z"
}
```

### PUT /api/v1/orders/{id}/status

```
Request:
{ "status": "processing", "note": "Đang chuẩn bị hàng" }

Response 200: OrderDTO (status updated)

Response 400:
{ "message": "Không thể chuyển từ 'new' sang 'completed'" }
```

Luồng trạng thái hợp lệ:

```
new → confirmed → pending_payment → paid → processing → packing → shipping → delivered → completed
new → cancelled
confirmed → cancelled
pending_payment → cancelled
delivered → returned
```

### GET /api/v1/orders/stats

```
Response 200:
{
  "today": { "total": 284, "pending": 47, "completionRate": 89.2, "cancelled": 12 },
  "revenue": { "today": 168500000, "changePercent": 12.3 }
}
```

---

## 4. Customers (customer-service)

### GET /api/v1/customers

```
Query: ?page=0&size=20&sort=totalSpent,desc&segment=&tier=&search=
Response 200: Page<CustomerDTO>
```

### GET /api/v1/customers/{id}

```
Response 200:
{
  "id": 1,
  "code": "KH-001",
  "name": "Nguyễn Minh Anh",
  "email": "anh@email.com",
  "phone": "0987654321",
  "gender": "Nữ",
  "birthday": "1995-03-15",
  "totalOrders": 28,
  "totalSpent": 15600000,
  "avgOrderValue": 557142,
  "segment": "Champions",
  "loyaltyTier": "Gold",
  "loyaltyPoints": 15600,
  "tags": ["thường mua cuối tuần", "ưa flash sale"],
  "addresses": [
    {
      "id": 1,
      "label": "Nhà",
      "fullAddress": "123 Nguyễn Huệ, Q1, TP.HCM",
      "isDefault": true
    }
  ],
  "createdAt": "2024-06-15T00:00:00Z",
  "lastOrderAt": "2026-02-18T10:25:00Z"
}
```

### POST /api/v1/customers

```
Request:
{ "name": "...", "email": "...", "phone": "...", "gender": "..." }

Response 201: CustomerDTO (code tự sinh KH-XXX)
```

### DELETE /api/v1/customers/{id}

```
Response 204: No Content
```

### GET /api/v1/customers/{id}/activities

```
Response 200:
[
  {
    "id": 1,
    "type": "order",
    "description": "Đặt đơn hàng #DH-9823 - 1.280.000₫",
    "channel": "Shopee",
    "date": "2026-02-18T10:25:00Z"
  }
]
```

### GET /api/v1/customers/segments

```
Response 200:
[
  { "name": "Champions", "count": 1240, "color": "#00D68F", "change": 12 },
  { "name": "Loyal Customers", "count": 2350, "color": "#3366FF", "change": 5 },
  { "name": "Potential Loyalists", "count": 3892, "color": "#FFAA00", "change": 8 },
  { "name": "At Risk", "count": 432, "color": "#FF3D71", "change": -3 },
  { "name": "Hibernating", "count": 2105, "color": "#8F9BB3", "change": -7 }
]
```

### GET /api/v1/customers/loyalty-tiers

```
Response 200:
[
  { "name": "Platinum", "minPoints": 25000, "discount": 15, "freeShip": true, "count": 45 },
  { "name": "Gold", "minPoints": 10000, "discount": 10, "freeShip": true, "count": 234 },
  { "name": "Silver", "minPoints": 5000, "discount": 5, "freeShip": false, "count": 567 },
  { "name": "Bronze", "minPoints": 0, "discount": 0, "freeShip": false, "count": 3210 }
]
```

---

## 5. Inventory (inventory-service)

### GET /api/v1/warehouses

```
Response 200:
[
  {
    "id": 1,
    "name": "Kho chính TP.HCM",
    "code": "WH-HCM",
    "address": "123 Nguyễn Văn Linh, Q7, TP.HCM",
    "type": "physical",
    "totalProducts": 856,
    "totalValue": 2450000000
  }
]
```

### GET /api/v1/stock

```
Query: ?warehouseId=&lowStock=true&outOfStock=true
Response 200:
[
  {
    "productId": 1,
    "sku": "TT-OS-001",
    "productName": "Áo khoác bomber nam",
    "warehouseId": 1,
    "warehouseName": "WH-HCM",
    "quantity": 60,
    "minThreshold": 20,
    "maxThreshold": 200,
    "lastUpdated": "2026-02-18T10:00:00Z"
  }
]
```

### GET /api/v1/suppliers

```
Response 200: List<SupplierDTO>
```

### POST /api/v1/suppliers

```
Request:
{ "name": "...", "contactPerson": "...", "phone": "...", "email": "...", "address": "..." }

Response 201: SupplierDTO
```

### DELETE /api/v1/suppliers/{id}

```
Response 204: No Content
```

### GET /api/v1/purchase-orders

```
Response 200: List<PurchaseOrderDTO>
{
  "id": 1,
  "code": "PO-2026-001",
  "supplierId": 1,
  "supplierName": "OmniStyle Factory",
  "warehouseId": 1,
  "items": [
    { "productId": 1, "sku": "TT-OS-001", "name": "Áo khoác bomber", "quantity": 200, "unitPrice": 280000, "total": 56000000 }
  ],
  "status": "approved",
  "totalAmount": 84500000,
  "createdAt": "2026-02-17T00:00:00Z",
  "expectedDate": "2026-02-25T00:00:00Z"
}
```

### GET /api/v1/stock-transfers

```
Response 200: List<StockTransferDTO>
{
  "id": 1,
  "code": "ST-001",
  "fromWarehouse": "WH-HCM",
  "toWarehouse": "WH-HN",
  "status": "in_transit",
  "items": [
    { "sku": "TT-OS-001", "name": "Áo khoác bomber", "quantity": 30 }
  ],
  "createdAt": "2026-02-16T00:00:00Z"
}
```

---

## 6. Marketing (marketing-service)

### GET /api/v1/campaigns

```
Response 200: List<CampaignDTO>
{
  "id": 1,
  "name": "Flash Sale 20h - Giảm sốc 50%",
  "type": "push",
  "status": "running",
  "targetSegment": "Champions",
  "budget": 15000000,
  "spent": 8700000,
  "reach": 12500,
  "clicks": 3200,
  "conversions": 456,
  "openRate": 68,
  "clickRate": 25.6,
  "startDate": "2026-02-17T00:00:00Z",
  "endDate": "2026-02-19T00:00:00Z",
  "createdAt": "2026-02-16T00:00:00Z"
}
```

### POST /api/v1/campaigns

```
Request:
{ "name": "...", "type": "email", "targetSegment": "...", "budget": 5000000, "startDate": "...", "endDate": "..." }

Response 201: CampaignDTO (status = "draft")
```

### DELETE /api/v1/campaigns/{id}

```
Response 204: No Content
```

### GET /api/v1/vouchers

```
Response 200: List<VoucherDTO>
{
  "id": 1,
  "code": "COMBO30",
  "name": "Giảm 30% combo",
  "type": "percentage",
  "value": 30,
  "minOrderValue": 500000,
  "maxDiscount": 200000,
  "usageLimit": 500,
  "usedCount": 342,
  "perCustomerLimit": 1,
  "applicableProducts": "Tất cả",
  "startDate": "2026-02-11T00:00:00Z",
  "endDate": "2026-02-25T00:00:00Z",
  "status": "active"
}
```

### POST /api/v1/vouchers

```
Request:
{ "code": "...", "name": "...", "type": "percentage", "value": 30, "minOrderValue": 500000, ... }

Response 201: VoucherDTO
Response 409: { "message": "Mã voucher đã tồn tại" }
```

### DELETE /api/v1/vouchers/{id}

```
Response 204: No Content
```

---

## 7. Channels (channel-service)

### GET /api/v1/channels

```
Response 200:
[
  {
    "id": 1,
    "name": "Shopee",
    "type": "marketplace",
    "icon": "assets/channel-shopee-sm.png",
    "status": "connected",
    "orders": 3456,
    "revenue": 1850000000,
    "lastSync": "2026-02-18T10:29:00Z"
  }
]
```

### PUT /api/v1/channels/{id}/toggle

```
Response 200: SalesChannelDTO (status toggled)
```

### GET /api/v1/pipeline/dags

```
Response 200 (proxy Airflow):
[
  {
    "id": "run_001",
    "dagId": "daily_rfm_calculation",
    "name": "Tính RFM hàng ngày",
    "schedule": "01:00 AM",
    "status": "success",
    "startTime": "2026-02-18T01:00:00Z",
    "endTime": "2026-02-18T01:05:42Z",
    "duration": "342s",
    "tasks": [
      { "id": "task_1", "name": "extract_orders", "status": "success", "duration": "45s" },
      { "id": "task_2", "name": "compute_rfm", "status": "success", "duration": "256s" },
      { "id": "task_3", "name": "publish_results", "status": "success", "duration": "41s" }
    ]
  }
]
```

---

## 8. Staff (staff-service)

### GET /api/v1/staff

```
Response 200: List<StaffDTO>
{
  "id": 1,
  "code": "NV-001",
  "name": "Nguyễn Văn Admin",
  "email": "admin@omnirevenue.vn",
  "phone": "0901000001",
  "department": "IT",
  "position": "Giám đốc CNTT",
  "role": "SUPER_ADMIN",
  "warehouse": null,
  "status": "active",
  "kpiOrders": 0,
  "kpiRevenue": 0,
  "joinedAt": "2023-01-01T00:00:00Z"
}
```

### POST /api/v1/staff

```
Request:
{ "name": "...", "email": "...", "phone": "...", "department": "...", "position": "...", "role": "CS_AGENT", "warehouse": "WH-HN" }

Response 201: StaffDTO
```

### DELETE /api/v1/staff/{id}

```
Response 204: No Content
```

### GET /api/v1/staff/leaderboard

```
Response 200: List<StaffDTO> (sorted by kpiRevenue desc, chỉ trả staff có KPI > 0)
```

### GET /api/v1/shifts

```
Query: ?date=2026-02-18
Response 200: List<ShiftDTO>
{
  "id": 1,
  "staffId": 7,
  "staffName": "Đỗ Thu Ngân",
  "date": "2026-02-18",
  "startTime": "08:00",
  "endTime": "16:00",
  "status": "checked_in"
}
```

---

## 9. Finance (finance-service)

### GET /api/v1/transactions

```
Query: ?type=income&method=&page=0&size=20
Response 200: Page<TransactionDTO>
{
  "id": 1,
  "code": "TX-001",
  "type": "income",
  "amount": 1280000,
  "method": "VNPay",
  "orderId": 1,
  "description": "Thanh toán đơn #DH-9823",
  "status": "completed",
  "createdAt": "2026-02-18T10:25:00Z"
}
```

### GET /api/v1/reconciliation

```
Response 200:
[
  { "channel": "VNPay", "expected": 2468000, "actual": 2468000, "difference": 0, "status": "matched" },
  { "channel": "Lazada Wallet", "expected": 835000, "actual": 810000, "difference": 25000, "status": "mismatch" }
]
```

### GET /api/v1/finance/summary

```
Response 200:
{
  "income": 7119000,
  "expense": 99500000,
  "refund": 498000,
  "profit": -92879000
}
```

### GET /api/v1/finance/monthly

```
Response 200:
[
  { "month": "T8/25", "income": 3200000000, "expense": 1800000000 },
  { "month": "T9/25", "income": 3500000000, "expense": 2000000000 }
]
```

---

## 10. Notifications (notification-service)

### GET /api/v1/notifications

```
Response 200:
[
  {
    "id": 1,
    "type": "order",
    "title": "Đơn hàng mới",
    "message": "Đơn #DH-9823 từ Shopee - 1.280.000₫",
    "time": "2026-02-18T10:25:00Z",
    "read": false,
    "icon": "fa-shopping-cart",
    "severity": "info"
  }
]
```

### PUT /api/v1/notifications/{id}/read

```
Response 200: NotificationDTO (read = true)
```

### PUT /api/v1/notifications/read-all

```
Response 200: { "updated": 4 }
```

### WebSocket /ws

```
Connection: ws://localhost:8080/ws
Auth: ?token=<jwt_token>

Server push format:
{
  "type": "ORDER_NEW",
  "data": {
    "id": 1,
    "type": "order",
    "title": "Đơn hàng mới",
    "message": "Đơn #DH-9824 từ TikTok - 672.000₫",
    "time": "2026-02-18T10:35:00Z",
    "severity": "info"
  }
}
```

---

## 11. Search (search-service)

### GET /api/v1/search

```
Query: ?q=áo khoác&type=product&page=0&size=20
Response 200:
{
  "content": [
    {
      "id": 1,
      "type": "product",
      "title": "Áo khoác bomber nam cao cấp",
      "subtitle": "TT-OS-001 · OmniStyle · 520.000₫",
      "highlights": ["<em>Áo khoác</em> bomber chất liệu dù cao cấp"],
      "score": 12.5
    }
  ],
  "totalElements": 3
}
```

### GET /api/v1/search/analytics

```
Response 200:
[
  { "keyword": "áo khoác", "count": 1234, "hasResults": true, "ctr": 0.45 },
  { "keyword": "kem chống nắng SPF50", "count": 234, "hasResults": false, "ctr": 0 }
]
```

---

## 12. Data Governance (search-service proxy Atlas/Ranger)

### GET /api/v1/atlas/entities

```
Response 200:
[
  {
    "id": 1,
    "name": "customers",
    "type": "TABLE",
    "schema": "omni_customers",
    "classification": "PII",
    "owner": "CRM Service",
    "tags": ["email", "phone"],
    "lastUpdated": "2026-02-18T01:00:00Z"
  }
]
```

### GET /api/v1/ranger/policies

```
Response 200:
[
  {
    "id": 1,
    "name": "PII Column Masking",
    "resource": "omni_customers.customers.phone",
    "accessType": "mask",
    "roles": ["ANALYST", "CASHIER"],
    "status": "active",
    "conditions": "Mask tất cả trừ 2 số cuối",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

### GET /api/v1/ranger/audit-logs

```
Query: ?user=&action=&page=0&size=20
Response 200: Page<AuditLogDTO>
{
  "id": 1,
  "user": "analyst",
  "action": "SELECT",
  "resource": "omni_customers.customers",
  "result": "allowed",
  "timestamp": "2026-02-18T10:30:00Z",
  "details": "Columns: name, segment (phone masked)"
}
```
