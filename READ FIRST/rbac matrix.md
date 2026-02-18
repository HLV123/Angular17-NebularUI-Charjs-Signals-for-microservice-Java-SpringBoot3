# RBAC-MATRIX.md · Ma trận phân quyền chi tiết

Phân quyền 3 lớp: Module-level (frontend sidebar), API-level (backend endpoint), Data-level (Ranger row/column).

---

## 1. Module-level — Frontend sidebar (đã implement)

Module không có quyền sẽ **biến mất hoàn toàn** khỏi sidebar và không truy cập được qua URL.

Source: `core/models/index.ts → ROLE_PERMISSIONS`

| Module | SUPER_ADMIN | ADMIN | SALES_MGR | INV_MGR | MKT_MGR | CS_AGENT | CASHIER | ANALYST |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sản phẩm | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Kho hàng | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Đơn hàng | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| CRM 360° | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Marketing | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Đa kênh | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Tài chính | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Nhân viên | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Thông báo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tìm kiếm | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Atlas/Ranger | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Pipeline | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Tổng modules** | **14** | **14** | **8** | **7** | **8** | **5** | **6** | **6** |

---

## 2. API-level — Backend endpoint authorization

Backend dùng `@PreAuthorize` annotation trên mỗi controller method.

### Products

| Endpoint | SUPER_ADMIN | ADMIN | SALES_MGR | INV_MGR | MKT_MGR | CS_AGENT | CASHIER | ANALYST |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| GET /products | ✅ | ✅ | ✅ view | ✅ view | ✅ view | ❌ | ✅ view | ❌ |
| GET /products/{id} | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| POST /products | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PUT /products/{id} | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DELETE /products/{id} | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Orders

| Endpoint | SUPER_ADMIN | ADMIN | SALES_MGR | INV_MGR | MKT_MGR | CS_AGENT | CASHIER | ANALYST |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| GET /orders | ✅ all | ✅ all | ✅ all | ❌ | ❌ | ✅ assigned | ✅ own POS | ❌ |
| GET /orders/{id} | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| PUT /orders/{id}/status | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ limited | ❌ | ❌ |
| POST /orders (POS) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

CS_AGENT chỉ được update status: `new → confirmed`, `delivered → returned`. Không được `cancelled`.

CASHIER chỉ thấy đơn từ POS channel của kho mình.

### Inventory

| Endpoint | SUPER_ADMIN | ADMIN | SALES_MGR | INV_MGR | MKT_MGR | CS_AGENT | CASHIER | ANALYST |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| GET /warehouses | ✅ all | ✅ all | ❌ | ✅ own | ❌ | ❌ | ❌ | ❌ |
| GET /stock | ✅ all | ✅ all | ❌ | ✅ own warehouse | ❌ | ❌ | ❌ | ❌ |
| POST /purchase-orders | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /stock-transfers | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /suppliers | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

INV_MGR chỉ thấy stock của kho mình (`warehouse_code` trong JWT = filter).

### Customers

| Endpoint | SUPER_ADMIN | ADMIN | SALES_MGR | INV_MGR | MKT_MGR | CS_AGENT | CASHIER | ANALYST |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| GET /customers | ✅ full | ✅ full | ✅ full | ❌ | ✅ view | ✅ full | ❌ | ❌ |
| GET /customers/{id} | ✅ | ✅ | ✅ | ❌ | ✅ no PII | ✅ | ❌ | ❌ |
| POST /customers | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| DELETE /customers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /customers/segments | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

MKT_MGR thấy customer nhưng phone/email bị mask (Ranger column mask).

### Marketing

| Endpoint | SUPER_ADMIN | ADMIN | SALES_MGR | INV_MGR | MKT_MGR | CS_AGENT | CASHIER | ANALYST |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| GET /campaigns | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| POST /campaigns | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| DELETE /campaigns | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| GET /vouchers | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| POST /vouchers | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

### Staff

| Endpoint | SUPER_ADMIN | ADMIN | Others |
|---|:---:|:---:|:---:|
| GET /staff | ✅ all | ✅ all (trừ SUPER_ADMIN) | ❌ |
| POST /staff | ✅ | ✅ (không tạo SUPER_ADMIN) | ❌ |
| DELETE /staff | ✅ | ❌ | ❌ |
| GET /shifts | ✅ all | ✅ all | ❌ |

ADMIN không thể tạo hoặc sửa SUPER_ADMIN. Chỉ SUPER_ADMIN mới xóa được nhân viên.

### Finance

| Endpoint | SUPER_ADMIN | ADMIN | SALES_MGR | CASHIER | ANALYST |
|---|:---:|:---:|:---:|:---:|:---:|
| GET /transactions | ✅ all | ✅ all | ❌ | ✅ own shift | ❌ |
| GET /reconciliation | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /finance/summary | ✅ | ✅ | ❌ | ✅ shift only | ❌ |

CASHIER chỉ thấy transaction từ POS shift của mình.

---

## 3. Data-level — Ranger row/column permissions

### 3.1 Row-level filter

| Role | Bảng | Filter | Ví dụ |
|---|---|---|---|
| INV_MGR | stock_items | `warehouse_id IN (kho mà nhân viên quản lý)` | Phạm Kho Hàng (WH-HCM) chỉ thấy stock WH-HCM |
| CASHIER | orders | `channel = 'POS' AND warehouse_code = '<user.warehouse>'` | Đỗ Thu Ngân (WH-HN) chỉ thấy đơn POS Hà Nội |
| CASHIER | transactions | `method = 'Tiền mặt' AND shift_id = <current_shift>` | Chỉ thấy giao dịch tiền mặt ca mình |
| CS_AGENT | orders | `status IN ('new','confirmed','delivered')` | Không thấy đơn đang processing/packing (việc của kho) |
| SALES_MGR | orders | no filter | Thấy tất cả đơn mọi kênh |

### 3.2 Column-level mask

| Role | Bảng | Cột bị mask | Kiểu mask | Ví dụ |
|---|---|---|---|---|
| MKT_MGR | customers | phone | Partial mask | 098***4321 |
| MKT_MGR | customers | email | Partial mask | a***@email.com |
| ANALYST | customers | phone | Full mask | ********** |
| ANALYST | customers | email | Full mask | ********** |
| ANALYST | customers | birthday | Null | null |
| CASHIER | customers | phone | Partial mask | 098***4321 |
| CASHIER | customers | email | Hidden | (không trả field này) |
| CS_AGENT | customers | phone | Full visible | 0987654321 (cần để liên hệ) |
| CS_AGENT | customers | email | Full visible | anh@email.com |

### 3.3 Ranger Policy definition

```json
{
  "policies": [
    {
      "name": "PII Column Masking - Marketing",
      "resource": "omni_customers.customers",
      "columns": ["phone", "email"],
      "accessType": "mask",
      "roles": ["MKT_MGR"],
      "maskType": "PARTIAL",
      "maskConfig": "x]3,[x]4,[x"
    },
    {
      "name": "Inventory Row Filter - INV_MGR",
      "resource": "omni_inventory.stock_items",
      "accessType": "rowFilter",
      "roles": ["INV_MGR"],
      "filterExpr": "warehouse_id IN (SELECT id FROM warehouses WHERE code = ${user.warehouse})"
    },
    {
      "name": "POS Order Filter - Cashier",
      "resource": "omni_orders.orders",
      "accessType": "rowFilter",
      "roles": ["CASHIER"],
      "filterExpr": "channel = 'POS'"
    },
    {
      "name": "Full PII Access - CS Agent",
      "resource": "omni_customers.customers",
      "columns": ["phone", "email"],
      "accessType": "allow",
      "roles": ["CS_AGENT"]
    }
  ]
}
```

---

## 4. Tóm tắt trải nghiệm mỗi role

### SUPER_ADMIN
- Thấy toàn bộ 14 modules, mọi data không filter, mọi cột không mask
- Có thể tạo/xóa SUPER_ADMIN khác
- Quản lý Ranger policies, Atlas metadata

### ADMIN
- Thấy 14 modules, mọi data không filter
- Không thể tạo SUPER_ADMIN, không xóa nhân viên
- Không truy cập Ranger policy editor (chỉ view)

### SALES_MGR
- 8 modules: Dashboard, Sản phẩm (view), Đơn hàng (full), CRM (full), Đa kênh (view), Analytics (limited), Thông báo, Tìm kiếm
- Thấy tất cả đơn hàng mọi kênh
- Thấy customer đầy đủ PII

### INV_MGR
- 7 modules: Dashboard, Sản phẩm (view), Kho hàng (full), Đa kênh (view), Analytics (limited), Thông báo, Tìm kiếm
- Chỉ thấy stock/PO/transfer của kho mình quản lý
- Trang mặc định: Kho hàng

### MKT_MGR
- 8 modules: Dashboard, Sản phẩm (view), CRM (view), Marketing (full), Đa kênh (view), Analytics (limited), Thông báo, Tìm kiếm
- Thấy customer nhưng phone/email bị mask
- Trang mặc định: Marketing

### CS_AGENT
- 5 modules: Dashboard, Đơn hàng (limited), CRM (full), Thông báo, Tìm kiếm
- Thấy full PII khách hàng (cần để liên hệ hỗ trợ)
- Chỉ được update status hạn chế
- Trang mặc định: Đơn hàng

### CASHIER
- 6 modules: Dashboard, Sản phẩm (view), Đơn hàng (POS only), Tài chính (own shift), Thông báo, Tìm kiếm
- Chỉ thấy đơn POS của kho mình, giao dịch tiền mặt ca mình
- Trang mặc định: Đơn hàng

### ANALYST
- 6 modules: Dashboard, Analytics (full), Atlas/Ranger (view), Pipeline (view), Thông báo, Tìm kiếm
- Mọi PII bị mask hoàn toàn (phone, email, birthday)
- Chỉ xem data, không có quyền create/edit/delete
- Trang mặc định: Analytics
