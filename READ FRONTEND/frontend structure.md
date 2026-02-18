# OmniRevenue Platform · Frontend
Hệ thống Quản Lý Bán Hàng & Marketing Đa Kênh — Angular 17 + Nebular 13

---
## Cấu trúc project frontend
Mở bằng VSCode sẽ thấy:

```
omni-app/
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   ├── favicon.ico
│   ├── environments/
│   │   └── environment.ts
│   ├── assets/
│   │   ├── .gitkeep
│   │   ├── logo.png
│   │   ├── logo-sm.png
│   │   ├── hero-banner.jpg
│   │   ├── dashboard-preview.png
│   │   ├── marketing-campaign.jpg
│   │   ├── warehouse.jpg
│   │   ├── channel-shopee.png
│   │   ├── channel-shopee-sm.png
│   │   ├── channel-lazada.png
│   │   ├── channel-lazada-sm.png
│   │   ├── channel-tiktok.png
│   │   ├── channel-tiktok-sm.png
│   │   ├── channel-tiki.png
│   │   ├── channel-tiki-sm.png
│   │   ├── channel-facebook.png
│   │   ├── channel-facebook-sm.png
│   │   ├── channel-pos.png
│   │   └── channel-pos-sm.png
│   └── app/
│       ├── app.component.ts
│       ├── app.component.html
│       ├── app.component.scss
│       ├── app.config.ts
│       ├── app.routes.ts
│       ├── core/
│       │   ├── guards/
│       │   │   └── auth.guard.ts
│       │   ├── interceptors/
│       │   │   └── auth.interceptor.ts
│       │   ├── models/
│       │   │   ├── index.ts
│       │   │   └── entities.ts
│       │   └── services/
│       │       ├── api.service.ts
│       │       ├── auth.service.ts
│       │       ├── product.service.ts
│       │       ├── order.service.ts
│       │       ├── customer.service.ts
│       │       ├── inventory.service.ts
│       │       ├── marketing.service.ts
│       │       ├── channel.service.ts
│       │       ├── staff.service.ts
│       │       ├── finance.service.ts
│       │       └── notification.service.ts
│       ├── shared/
│       │   ├── components/
│       │   │   ├── confirm-dialog.component.ts
│       │   │   ├── empty-state.component.ts
│       │   │   ├── loading-spinner.component.ts
│       │   │   └── pagination.component.ts
│       │   └── pipes/
│       │       ├── vnd-currency.pipe.ts
│       │       └── relative-time.pipe.ts
│       ├── layout/
│       │   ├── layout.component.ts
│       │   ├── layout.component.html
│       │   └── layout.component.scss
│       └── pages/
│           ├── login/
│           │   ├── login.component.ts
│           │   ├── login.component.html
│           │   └── login.component.scss
│           ├── dashboard/
│           │   ├── dashboard.component.ts
│           │   ├── dashboard.component.html
│           │   └── dashboard.component.scss
│           ├── products/
│           │   ├── products.component.ts
│           │   ├── products.component.html
│           │   └── products.component.scss
│           ├── inventory/
│           │   ├── inventory.component.ts
│           │   ├── inventory.component.html
│           │   └── inventory.component.scss
│           ├── orders/
│           │   ├── orders.component.ts
│           │   ├── orders.component.html
│           │   └── orders.component.scss
│           ├── crm/
│           │   ├── crm.component.ts
│           │   ├── crm.component.html
│           │   └── crm.component.scss
│           ├── marketing/
│           │   ├── marketing.component.ts
│           │   ├── marketing.component.html
│           │   └── marketing.component.scss
│           ├── omnichannel/
│           │   ├── omnichannel.component.ts
│           │   ├── omnichannel.component.html
│           │   └── omnichannel.component.scss
│           ├── analytics/
│           │   ├── analytics.component.ts
│           │   ├── analytics.component.html
│           │   └── analytics.component.scss
│           ├── finance/
│           │   ├── finance.component.ts
│           │   ├── finance.component.html
│           │   └── finance.component.scss
│           ├── staff/
│           │   ├── staff.component.ts
│           │   ├── staff.component.html
│           │   └── staff.component.scss
│           ├── notifications/
│           │   ├── notifications.component.ts
│           │   ├── notifications.component.html
│           │   └── notifications.component.scss
│           ├── search/
│           │   ├── search.component.ts
│           │   ├── search.component.html
│           │   └── search.component.scss
│           ├── data-governance/
│           │   ├── data-governance.component.ts
│           │   ├── data-governance.component.html
│           │   └── data-governance.component.scss
│           └── pipeline/
│               ├── pipeline.component.ts
│               ├── pipeline.component.html
│               └── pipeline.component.scss
```

Tổng cộng ban đầu: **97 files** (79 source + 18 ảnh).

---
## 2. Chạy `npm install` — sinh thêm những gì
Mở Terminal trong VSCode tại thư mục gốc, chạy:

```bash
npm install
```
Lệnh này đọc `package.json`, tải tất cả dependencies và devDependencies, sinh thêm:

```
omni-app/
├── node_modules/                  ← THƯ MỤC MỚI (~242 packages)
│   ├── @angular/
│   ├── @angular-devkit/
│   │   └── build-angular/
│   ├── @nebular/
│   │   ├── theme/
│   │   ├── eva-icons/
│   │   └── auth/
│   ├── chart.js/
│   ├── eva-icons/
│   └── ... (còn ~230 packages phụ thuộc khác)
├── package-lock.json              ← FILE MỚI (lock phiên bản chính xác)
└── ... (toàn bộ source giữ nguyên)
```
Sau bước này cấu trúc project đầy đủ là:

```
omni-app/
├── angular.json
├── package.json
├── package-lock.json              ← mới
├── tsconfig.json
├── tsconfig.app.json
├── node_modules/                  ← mới (~242 packages)
└── src/
    └── ... (giữ nguyên như mục 1)
```
---
## Chạy `ng serve` — trải nghiệm web trên trình duyệt

```bash
npm start
```
Khi chạy, Angular CLI sẽ:
- Biên dịch TypeScript → JavaScript
- Biên dịch SCSS → CSS
- Sinh thư mục ẩn `.angular/cache/` chứa build cache (không cần quan tâm)
- Khởi động dev server tại `http://localhost:4200`

Terminal hiện:

```
  ➜  Local:   http://localhost:4200/
```
Tài khoản demo (mật khẩu chung: `123456`):

| Username | Vai trò | Trang mặc định | Số module nhìn thấy |
|---|---|---|---|
| `superadmin` | Super Admin | Dashboard | 14 |
| `admin` | Admin | Dashboard | 14 |
| `sales` | Sales Manager | Dashboard | 8 |
| `warehouse` | Inventory Manager | Kho hàng | 7 |
| `marketing` | Marketing Manager | Marketing | 8 |
| `csagent` | CS Agent | Đơn hàng | 5 |
| `cashier` | Cashier (POS) | Đơn hàng | 6 |
| `analyst` | Data Analyst | Analytics | 6 |

Mỗi vai trò đăng nhập sẽ thấy sidebar và giao diện hoàn toàn khác nhau — các module không có quyền sẽ biến mất hoàn toàn khỏi sidebar và không truy cập được qua URL.

---
## Chạy `ng build` — sinh thêm thư mục `dist/`

```bash
ng build
```
Sinh thêm thư mục `dist/` chứa bản production đã tối ưu:

```
omni-app/
├── dist/                                  ← THƯ MỤC MỚI
│   └── omni-app/
│       ├── 3rdpartylicenses.txt
│       └── browser/
│           ├── index.html
│           ├── favicon.ico
│           ├── main-KHZQTK7S.js
│           ├── polyfills-FFHMD2TL.js
│           ├── styles-ZZFR5CUA.css
│           ├── chunk-47FE4KWT.js
│           ├── chunk-4MGDWZKK.js
│           ├── chunk-66D5TQFD.js
│           ├── chunk-A5SP4Z5O.js
│           ├── chunk-ASHOX4CI.js
│           ├── chunk-DWDSFKY6.js
│           ├── chunk-GL5HOPPB.js
│           ├── chunk-HHW7FHDI.js
│           ├── chunk-ILGILSRN.js
│           ├── chunk-IP3LHA7B.js
│           ├── chunk-J6F2LQGY.js
│           ├── chunk-JLD2RF66.js
│           ├── chunk-K5NXCXLM.js
│           ├── chunk-KH3GJDKN.js
│           ├── chunk-KT4ACL3U.js
│           ├── chunk-MHBLHHTZ.js
│           ├── chunk-MJ2XFR7F.js
│           ├── chunk-NMWTRAD7.js
│           ├── chunk-NPGVRHJK.js
│           ├── chunk-O2WXVPU5.js
│           ├── chunk-PQXS2RNQ.js
│           ├── chunk-ROMCFOUT.js
│           ├── chunk-TJU77SKC.js
│           ├── chunk-VZN5YS3V.js
│           ├── chunk-WWEJEW4C.js
│           ├── chunk-YU45PA6M.js
│           ├── chunk-ZUROKHOM.js
│           ├── chunk-ZY4WVC2B.js
│           └── assets/
│               ├── logo.png
│               ├── logo-sm.png
│               ├── hero-banner.jpg
│               ├── dashboard-preview.png
│               ├── marketing-campaign.jpg
│               ├── warehouse.jpg
│               ├── channel-shopee.png
│               ├── channel-shopee-sm.png
│               ├── channel-lazada.png
│               ├── channel-lazada-sm.png
│               ├── channel-tiktok.png
│               ├── channel-tiktok-sm.png
│               ├── channel-tiki.png
│               ├── channel-tiki-sm.png
│               ├── channel-facebook.png
│               ├── channel-facebook-sm.png
│               ├── channel-pos.png
│               └── channel-pos-sm.png
├── angular.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── node_modules/
└── src/
    └── ... (giữ nguyên)
```

Tổng `dist/`: **52 files** — gồm 1 `main`, 1 `polyfills`, 1 CSS, 28 lazy-loaded chunks (mỗi page 1 chunk), 18 ảnh, `index.html`, `favicon.ico`, `3rdpartylicenses.txt`.

28 chunk files là kết quả của lazy loading: mỗi page component được Angular tách thành file JS riêng, chỉ tải khi người dùng điều hướng tới page đó.

Thư mục `dist/omni-app/browser/` là bản build hoàn chỉnh, có thể deploy lên bất kỳ static web server nào (Nginx, Apache, S3, Netlify...).

---
## Tương thích với backend Spring Boot
### Endpoint cấu hình
File `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl: 'ws://localhost:8080/ws'
};
```
Frontend gọi mọi REST API qua base URL `http://localhost:8080/api/v1`. 
Backend Spring Boot chạy cổng `8080`, prefix `/api/v1`.
###  Xác thực — JWT Bearer Token
File `core/interceptors/auth.interceptor.ts` tự động gắn header `Authorization: Bearer <token>` vào mọi HTTP request nếu có token trong `localStorage`. 
Backend cần trả token JWT khi login thành công qua endpoint `POST /api/v1/auth/login`.
### HTTP Client tổng — `api.service.ts`
File `core/services/api.service.ts` cung cấp các method `get()`, `post()`, `put()`, `delete()` gọi tới backend, kèm xử lý loading state và error handling. 
Tất cả domain service sẽ gọi qua service này khi chuyển từ mock data sang API thật.
### Mapping giữa TypeScript Models và Spring Boot DTOs
File `core/models/entities.ts` định nghĩa toàn bộ interface TypeScript tương ứng 1:1 với Java DTO/Entity phía backend:

| TypeScript Interface | Java DTO tương ứng | REST Endpoint |
|---|---|---|
| `Product`, `ProductVariant`, `ChannelPrice` | ProductDTO, VariantDTO | `GET/POST/PUT/DELETE /products` |
| `Category` | CategoryDTO | `GET /categories` |
| `Order`, `OrderItem` | OrderDTO, OrderItemDTO | `GET/POST/PUT /orders` |
| `Customer`, `Address`, `CustomerActivity` | CustomerDTO, AddressDTO | `GET/POST/PUT/DELETE /customers` |
| `Warehouse`, `StockItem` | WarehouseDTO, StockDTO | `GET /warehouses`, `GET /stock` |
| `PurchaseOrder`, `PurchaseOrderItem` | PurchaseOrderDTO | `GET/POST /purchase-orders` |
| `Supplier` | SupplierDTO | `GET/POST/DELETE /suppliers` |
| `StockTransfer` | StockTransferDTO | `GET/POST /stock-transfers` |
| `Campaign` | CampaignDTO | `GET/POST/DELETE /campaigns` |
| `Voucher` | VoucherDTO | `GET/POST/DELETE /vouchers` |
| `SalesChannel` | ChannelDTO | `GET /channels` |
| `Staff`, `Role`, `Shift` | StaffDTO, RoleDTO, ShiftDTO | `GET/POST/DELETE /staff`, `GET /shifts` |
| `Transaction`, `ReconciliationItem` | TransactionDTO, ReconciliationDTO | `GET /transactions`, `GET /reconciliation` |
| `DagRun`, `DagTask` | DagRunDTO, DagTaskDTO | `GET /pipeline/dags` |
| `DataEntity`, `RangerPolicy`, `AuditLog` | DataEntityDTO, PolicyDTO, AuditDTO | `GET /atlas/entities`, `GET /ranger/policies` |
| `SearchResult`, `SearchAnalytics` | SearchResultDTO, SearchAnalyticsDTO | `GET /search` |

### Mapping từng domain service → REST endpoints
Mỗi service trong `core/services/` hiện dùng mock data bằng Angular signals. 
Khi backend sẵn sàng, chỉ cần thay phần mock bằng lời gọi `ApiService`:

| Frontend Service | Phương thức | Backend REST Endpoint | Giao thức nghiệp vụ |
|---|---|---|---|
| **auth.service.ts** | `login()` | `POST /auth/login` | REST |
| **product.service.ts** | `getProducts()` | `GET /products` | REST |
| | `addProduct()` | `POST /products` | REST |
| | `updateProduct()` | `PUT /products/:id` | REST |
| | `deleteProduct()` | `DELETE /products/:id` | REST |
| **order.service.ts** | `getOrders()` | `GET /orders` | REST |
| | `updateStatus()` | `PUT /orders/:id/status` | REST |
| **customer.service.ts** | `getCustomers()` | `GET /customers` | REST + Elasticsearch |
| | `getSegments()` | `GET /customers/segments` | Spark → REST |
| | `getActivities()` | `GET /customers/:id/activities` | REST |
| **inventory.service.ts** | `getWarehouses()` | `GET /warehouses` | REST |
| | `getStockItems()` | `GET /stock` | gRPC proxy → REST |
| | `getSuppliers()` | `GET /suppliers` | REST |
| | `getPurchaseOrders()` | `GET /purchase-orders` | REST |
| | `getTransfers()` | `GET /stock-transfers` | REST |
| **marketing.service.ts** | `getCampaigns()` | `GET /campaigns` | REST |
| | `getVouchers()` | `GET /vouchers` | REST |
| **channel.service.ts** | `getChannels()` | `GET /channels` | Kafka status → REST |
| | `toggleChannel()` | `PUT /channels/:id/toggle` | REST |
| **staff.service.ts** | `getStaff()` | `GET /staff` | REST + Ranger |
| | `getShifts()` | `GET /shifts` | REST |
| | `getLeaderboard()` | `GET /staff/leaderboard` | REST |
| **finance.service.ts** | `getTransactions()` | `GET /transactions` | REST |
| | `getReconciliation()` | `GET /reconciliation` | REST |
| | `getSummary()` | `GET /finance/summary` | REST |
| **notification.service.ts** | real-time alerts | `ws://localhost:8080/ws` | WebSocket |
| | `markRead()` | `PUT /notifications/:id/read` | REST |

### WebSocket — realtime
File `environment.ts` cấu hình `wsUrl: 'ws://localhost:8080/ws'`. 
Backend Spring Boot cần expose WebSocket endpoint tại `/ws` cho:
- Đơn hàng mới (Kafka topic `orders.created` → WebSocket push)
- Cảnh báo tồn kho (topic `inventory.low_stock` → WebSocket push)
- Thông báo gian lận (topic `fraud.alert` → WebSocket push)
- Cập nhật trạng thái đơn live
- Flash sale countdown

Frontend `notification.service.ts` đã có `Subject` và `alerts$` Observable sẵn sàng nhận events từ WebSocket.

### Phân quyền RBAC — Ranger
File `core/models/index.ts` định nghĩa ma trận `ROLE_PERMISSIONS` cho 8 vai trò × 14 modules. 
Logic phân quyền xử lý tại 3 lớp:

- **Router level**: `auth.guard.ts` chặn truy cập URL trái phép dựa trên `data.pageKey`
- **Sidebar level**: `layout.component.ts` gọi `auth.getVisibleMenuItems()` chỉ render menu items mà role được phép
- **Data level**: Backend Ranger kiểm soát row-level (nhân viên chỉ thấy kho mình) và column-level (mask PII cho role không đủ quyền)

### Giao thức ngoài REST

| Giao thức | Backend Component | Frontend tiếp nhận qua |
|---|---|---|
| **Kafka** | Event bus nội bộ giữa microservices | Không gọi trực tiếp — backend consume Kafka rồi push qua WebSocket hoặc expose qua REST |
| **gRPC** | Order↔Inventory↔Payment nội bộ | Không gọi trực tiếp — API Gateway proxy gRPC thành REST cho frontend |
| **WebSocket** | Spring WebSocket `/ws` | `environment.wsUrl` → `notification.service.ts` |
| **RSocket** | Spark streaming → backend | Backend nhận RSocket stream rồi chuyển tiếp qua WebSocket hoặc REST polling cho frontend |
| **Elasticsearch** | Indexing và full-text search | Frontend gọi `GET /search?q=...` — backend proxy query tới Elasticsearch |
| **Airflow** | DAG scheduling | Frontend gọi `GET /pipeline/dags` — backend proxy Airflow REST API |
| **Atlas** | Data catalog metadata | Frontend gọi `GET /atlas/entities` — backend proxy Atlas REST API |
| **Ranger** | Access control policies | Frontend gọi `GET /ranger/policies` — backend proxy Ranger Admin API |

Frontend không bao giờ gọi trực tiếp Kafka, gRPC, RSocket, Elasticsearch, Airflow, Atlas, hay Ranger. Tất cả đều đi qua API Gateway (Spring Cloud Gateway) rồi backend expose thành REST hoặc WebSocket cho Angular.

### 6.9 Tóm tắt kiến trúc tích hợp

```
┌────────────────────────────────────────────────────┐
│              Angular 17 + Nebular 13                │
│                                                     │
│  HttpClient ──► REST /api/v1/*                      │
│  WebSocket  ──► ws://localhost:8080/ws               │
│  JWT Token  ──► Authorization: Bearer <token>        │
│  AuthGuard  ──► ROLE_PERMISSIONS matrix              │
│                                                     │
│  14 lazy-loaded page modules                        │
│  11 domain services (mock data → API ready)         │
│  Signal-based state management                      │
└──────────────┬────────────────┬─────────────────────┘
               │ REST           │ WebSocket
               ▼                ▼
┌──────────────────────────────────────────────────────┐
│           API Gateway (Spring Cloud Gateway)          │
│                    :8080                              │
├────────┬────────┬────────┬────────┬─────────────────┤
│  REST  │  gRPC  │ Kafka  │ Atlas  │ Elasticsearch   │
│   ▼    │   ▼    │   ▼    │   ▼    │      ▼          │
│Product │ Order↔ │ Event  │  Data  │  Full-text      │
│Service │Inventory│Stream │Catalog │  Search         │
│        │↔Payment│        │+Ranger │                 │
├────────┴────────┴────────┴────────┴─────────────────┤
│  Spark Streaming + Batch (Airflow scheduled)         │
│  RSocket feed → WebSocket bridge → Angular           │
└──────────────────────────────────────────────────────┘
```