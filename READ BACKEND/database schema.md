# DATABASE-SCHEMA.md · Thiết kế cơ sở dữ liệu

11 databases PostgreSQL riêng biệt, mỗi microservice sở hữu 1 database. Không dùng foreign key cross-database — tham chiếu cross-service bằng ID, đồng bộ qua Kafka events.

---

## Quy ước chung

### Tên bảng / cột

- Bảng: `snake_case` số nhiều (`products`, `order_items`)
- Cột: `snake_case` (`created_at`, `customer_name`)
- Primary key: `id BIGSERIAL`
- Foreign key cùng database: `<table>_id BIGINT REFERENCES <table>(id)`
- Tham chiếu cross-service: `<entity>_id BIGINT` (không FK, chỉ lưu ID)

### Cột bắt buộc mọi bảng

```sql
id          BIGSERIAL PRIMARY KEY,
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Soft delete

Bảng có business data quan trọng (products, customers, staff) dùng soft delete:

```sql
deleted_at  TIMESTAMPTZ NULL  -- NULL = chưa xóa, có giá trị = đã xóa
```

### JSONB

Dùng cho dữ liệu linh hoạt không cần normalize: `attributes JSONB` (variant properties), `tags TEXT[]` (PostgreSQL array).

---

## 1. omni_products

```sql
-- Danh mục sản phẩm (cây đa cấp)
CREATE TABLE categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    parent_id       BIGINT REFERENCES categories(id),
    sort_order      INT DEFAULT 0,
    seo_title       VARCHAR(300),
    seo_description TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Sản phẩm
CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    sku             VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    category_id     BIGINT REFERENCES categories(id),
    brand           VARCHAR(200),
    price           BIGINT NOT NULL DEFAULT 0,          -- giá bán (VND)
    cost_price      BIGINT NOT NULL DEFAULT 0,          -- giá vốn
    sale_price      BIGINT,                             -- giá khuyến mãi (NULL = không KM)
    stock           INT NOT NULL DEFAULT 0,             -- tồn kho tổng (denormalized)
    sold            INT NOT NULL DEFAULT 0,             -- đã bán tổng
    rating          DECIMAL(2,1) DEFAULT 0,             -- 0.0 - 5.0
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | inactive | out_of_stock
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Biến thể sản phẩm
CREATE TABLE product_variants (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             VARCHAR(50) NOT NULL UNIQUE,
    attributes      JSONB NOT NULL DEFAULT '{}',        -- {"color": "Đen", "size": "M"}
    price           BIGINT NOT NULL DEFAULT 0,
    stock           INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- Giá theo kênh bán hàng
CREATE TABLE channel_prices (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    channel         VARCHAR(50) NOT NULL,               -- Website | Shopee | Lazada | TikTok | Tiki
    price           BIGINT NOT NULL DEFAULT 0,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, channel)
);
CREATE INDEX idx_channel_prices_product ON channel_prices(product_id);

-- Ảnh sản phẩm
CREATE TABLE product_images (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url             VARCHAR(1000) NOT NULL,
    sort_order      INT DEFAULT 0,
    is_primary      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_product_images_product ON product_images(product_id);

-- Lịch sử giá
CREATE TABLE price_history (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id),
    field           VARCHAR(20) NOT NULL,               -- price | cost_price | sale_price
    old_value       BIGINT,
    new_value       BIGINT,
    changed_by      VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_price_history_product ON price_history(product_id);
```

### ERD

```
categories ──1:N──► products ──1:N──► product_variants
                         │──1:N──► channel_prices
                         │──1:N──► product_images
                         └──1:N──► price_history
```

---

## 2. omni_orders

```sql
-- Đơn hàng
CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(20) NOT NULL UNIQUE,        -- #DH-9823, #TT-2312
    channel             VARCHAR(50) NOT NULL,               -- Shopee | TikTok | Website | POS | Lazada | Facebook | Tiki
    customer_id         BIGINT,                             -- FK cross-service → omni_customers
    customer_name       VARCHAR(200) NOT NULL,
    customer_phone      VARCHAR(20),
    customer_email      VARCHAR(200),
    subtotal            BIGINT NOT NULL DEFAULT 0,
    shipping_fee        BIGINT NOT NULL DEFAULT 0,
    discount            BIGINT NOT NULL DEFAULT 0,
    total               BIGINT NOT NULL DEFAULT 0,
    payment_method      VARCHAR(50),                        -- VNPay | Momo | COD | Tiền mặt | ShopeePay | ...
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'pending', -- paid | pending | cod | refunded
    status              VARCHAR(20) NOT NULL DEFAULT 'new',
    note                TEXT,
    shipping_address    TEXT,
    tracking_number     VARCHAR(100),
    voucher_code        VARCHAR(50),
    sla_deadline        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_code ON orders(code);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_sla ON orders(sla_deadline) WHERE status NOT IN ('completed', 'cancelled');

-- Chi tiết đơn hàng
CREATE TABLE order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL,                        -- FK cross-service → omni_products
    sku             VARCHAR(50) NOT NULL,
    name            VARCHAR(500) NOT NULL,                  -- snapshot tên SP tại thời điểm mua
    price           BIGINT NOT NULL,                        -- snapshot giá tại thời điểm mua
    quantity        INT NOT NULL DEFAULT 1,
    total           BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Lịch sử thay đổi trạng thái
CREATE TABLE order_status_logs (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id),
    from_status     VARCHAR(20),
    to_status       VARCHAR(20) NOT NULL,
    changed_by      VARCHAR(100),                           -- username hoặc "SYSTEM"
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_logs_order ON order_status_logs(order_id);

-- Yêu cầu hoàn/đổi hàng
CREATE TABLE return_requests (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id),
    type            VARCHAR(10) NOT NULL,                   -- return | exchange
    reason          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | received | completed | rejected
    refund_amount   BIGINT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_returns_order ON return_requests(order_id);
```

### Trạng thái đơn hàng (enum values)

```
new → confirmed → pending_payment → paid → processing → packing → shipping → delivered → completed
                                                                                          └→ returned
new|confirmed|pending_payment → cancelled
```

### ERD

```
orders ──1:N──► order_items
   │──1:N──► order_status_logs
   └──1:N──► return_requests
```

---

## 3. omni_inventory

```sql
-- Kho hàng
CREATE TABLE warehouses (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(20) NOT NULL UNIQUE,            -- WH-HCM, WH-HN, V-SPE
    address         TEXT,
    type            VARCHAR(20) NOT NULL DEFAULT 'physical', -- physical | virtual
    total_products  INT DEFAULT 0,                          -- denormalized
    total_value     BIGINT DEFAULT 0,                       -- denormalized
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tồn kho theo sản phẩm × kho
CREATE TABLE stock_items (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL,                        -- FK cross-service
    sku             VARCHAR(50) NOT NULL,
    product_name    VARCHAR(500) NOT NULL,                  -- denormalized
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id),
    quantity        INT NOT NULL DEFAULT 0,
    reserved        INT NOT NULL DEFAULT 0,                 -- lock cho đơn chưa thanh toán
    min_threshold   INT NOT NULL DEFAULT 10,
    max_threshold   INT NOT NULL DEFAULT 500,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id)
);
CREATE INDEX idx_stock_product ON stock_items(product_id);
CREATE INDEX idx_stock_warehouse ON stock_items(warehouse_id);
CREATE INDEX idx_stock_low ON stock_items(quantity) WHERE quantity <= min_threshold;

-- Lịch sử biến động tồn kho
CREATE TABLE stock_movements (
    id              BIGSERIAL PRIMARY KEY,
    stock_item_id   BIGINT NOT NULL REFERENCES stock_items(id),
    type            VARCHAR(20) NOT NULL,                   -- inbound | outbound | adjustment | transfer_out | transfer_in | reserve | release
    quantity        INT NOT NULL,                           -- dương = nhập, âm = xuất
    reference_type  VARCHAR(30),                            -- order | purchase_order | transfer | manual
    reference_id    BIGINT,
    note            TEXT,
    performed_by    VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_movements_stock ON stock_movements(stock_item_id);
CREATE INDEX idx_movements_type ON stock_movements(type);
CREATE INDEX idx_movements_created ON stock_movements(created_at DESC);

-- Nhà cung cấp
CREATE TABLE suppliers (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(300) NOT NULL,
    contact_person  VARCHAR(200),
    phone           VARCHAR(20),
    email           VARCHAR(200),
    address         TEXT,
    rating          DECIMAL(2,1) DEFAULT 0,
    total_orders    INT DEFAULT 0,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phiếu đặt mua (Purchase Order)
CREATE TABLE purchase_orders (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE,            -- PO-2026-001
    supplier_id     BIGINT NOT NULL REFERENCES suppliers(id),
    warehouse_id    BIGINT NOT NULL REFERENCES warehouses(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',   -- draft | approved | received | cancelled
    total_amount    BIGINT NOT NULL DEFAULT 0,
    expected_date   DATE,
    received_date   DATE,
    approved_by     VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

-- Chi tiết phiếu đặt mua
CREATE TABLE purchase_order_items (
    id              BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL,                        -- FK cross-service
    sku             VARCHAR(50) NOT NULL,
    name            VARCHAR(500) NOT NULL,
    quantity        INT NOT NULL,
    unit_price      BIGINT NOT NULL,
    total           BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phiếu chuyển kho
CREATE TABLE stock_transfers (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,            -- ST-001
    from_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
    to_warehouse_id   BIGINT NOT NULL REFERENCES warehouses(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',   -- draft | approved | in_transit | received
    approved_by     VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chi tiết chuyển kho
CREATE TABLE stock_transfer_items (
    id              BIGSERIAL PRIMARY KEY,
    transfer_id     BIGINT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    sku             VARCHAR(50) NOT NULL,
    name            VARCHAR(500) NOT NULL,
    quantity        INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### ERD

```
warehouses ──1:N──► stock_items ──1:N──► stock_movements
suppliers ──1:N──► purchase_orders ──1:N──► purchase_order_items
warehouses ──1:N──► stock_transfers ──1:N──► stock_transfer_items
```

---

## 4. omni_customers

```sql
-- Khách hàng
CREATE TABLE customers (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,            -- KH-001
    name            VARCHAR(200) NOT NULL,
    email           VARCHAR(200),
    phone           VARCHAR(20),
    gender          VARCHAR(10),
    birthday        DATE,
    total_orders    INT DEFAULT 0,                          -- denormalized
    total_spent     BIGINT DEFAULT 0,                       -- denormalized
    avg_order_value BIGINT DEFAULT 0,                       -- denormalized
    segment         VARCHAR(50) DEFAULT 'Potential Loyalists',
    loyalty_tier    VARCHAR(20) DEFAULT 'Bronze',           -- Bronze | Silver | Gold | Platinum
    loyalty_points  INT DEFAULT 0,
    tags            TEXT[] DEFAULT '{}',                     -- PostgreSQL array
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_order_at   TIMESTAMPTZ
);
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_customers_tier ON customers(loyalty_tier);

-- Sổ địa chỉ
CREATE TABLE addresses (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label           VARCHAR(50) NOT NULL,                   -- Nhà | Văn phòng | ...
    full_address    TEXT NOT NULL,
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_customer ON addresses(customer_id);

-- Lịch sử hoạt động
CREATE TABLE customer_activities (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    type            VARCHAR(30) NOT NULL,                   -- order | review | loyalty | support | browse
    description     TEXT NOT NULL,
    channel         VARCHAR(50),                            -- Shopee | Website | Zalo | Facebook | POS
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activities_customer ON customer_activities(customer_id);
CREATE INDEX idx_activities_created ON customer_activities(created_at DESC);

-- Tài khoản loyalty
CREATE TABLE loyalty_accounts (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL UNIQUE REFERENCES customers(id),
    tier            VARCHAR(20) NOT NULL DEFAULT 'Bronze',
    points          INT NOT NULL DEFAULT 0,
    lifetime_points INT NOT NULL DEFAULT 0,
    tier_expiry     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lịch sử điểm
CREATE TABLE loyalty_transactions (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT NOT NULL REFERENCES customers(id),
    type            VARCHAR(20) NOT NULL,                   -- earn | redeem | expire | adjust
    points          INT NOT NULL,                           -- dương = cộng, âm = trừ
    reference_type  VARCHAR(30),                            -- order | voucher | manual | expiry
    reference_id    BIGINT,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loyalty_tx_customer ON loyalty_transactions(customer_id);
```

### ERD

```
customers ──1:N──► addresses
    │──1:N──► customer_activities
    │──1:1──► loyalty_accounts
    └──1:N──► loyalty_transactions
```

---

## 5. omni_payments

```sql
-- Giao dịch thanh toán
CREATE TABLE payment_transactions (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE,
    order_id        BIGINT NOT NULL,                        -- FK cross-service
    amount          BIGINT NOT NULL,
    method          VARCHAR(50) NOT NULL,                   -- VNPay | Momo | ZaloPay | COD | Tiền mặt | ShopeePay | Chuyển khoản
    gateway_tx_id   VARCHAR(200),                           -- mã giao dịch từ payment gateway
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | completed | failed | expired
    paid_at         TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_status ON payment_transactions(status);
CREATE INDEX idx_payment_gateway ON payment_transactions(gateway_tx_id);

-- Hoàn tiền
CREATE TABLE refund_records (
    id              BIGSERIAL PRIMARY KEY,
    payment_id      BIGINT NOT NULL REFERENCES payment_transactions(id),
    order_id        BIGINT NOT NULL,
    amount          BIGINT NOT NULL,
    reason          TEXT,
    method          VARCHAR(50) NOT NULL,                   -- original_method | wallet
    gateway_refund_id VARCHAR(200),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | completed | failed
    processed_by    VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refund_payment ON refund_records(payment_id);
CREATE INDEX idx_refund_order ON refund_records(order_id);
```

---

## 6. omni_marketing

```sql
-- Chiến dịch marketing
CREATE TABLE campaigns (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(300) NOT NULL,
    type            VARCHAR(20) NOT NULL,                   -- email | sms | zns | push | facebook
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',   -- draft | scheduled | running | completed | paused
    target_segment  VARCHAR(100),
    budget          BIGINT DEFAULT 0,
    spent           BIGINT DEFAULT 0,
    reach           INT DEFAULT 0,
    clicks          INT DEFAULT 0,
    conversions     INT DEFAULT 0,
    open_rate       DECIMAL(5,2),
    click_rate      DECIMAL(5,2),
    start_date      TIMESTAMPTZ,
    end_date        TIMESTAMPTZ,
    created_by      VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);

-- Voucher / Khuyến mãi
CREATE TABLE vouchers (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(300) NOT NULL,
    type                VARCHAR(20) NOT NULL,               -- percentage | fixed | freeship | buy_x_get_y
    value               BIGINT NOT NULL,                    -- % hoặc số tiền
    min_order_value     BIGINT DEFAULT 0,
    max_discount        BIGINT,                             -- giới hạn giảm (cho loại percentage)
    usage_limit         INT DEFAULT 100,
    used_count          INT DEFAULT 0,
    per_customer_limit  INT DEFAULT 1,
    applicable_products VARCHAR(500) DEFAULT 'Tất cả',
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'active', -- active | expired | disabled
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_dates ON vouchers(start_date, end_date);

-- Lịch sử sử dụng voucher
CREATE TABLE voucher_usage (
    id              BIGSERIAL PRIMARY KEY,
    voucher_id      BIGINT NOT NULL REFERENCES vouchers(id),
    customer_id     BIGINT NOT NULL,
    order_id        BIGINT NOT NULL,
    discount_amount BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_voucher_usage_voucher ON voucher_usage(voucher_id);
CREATE INDEX idx_voucher_usage_customer ON voucher_usage(customer_id);
```

---

## 7. omni_channels

```sql
-- Kênh bán hàng
CREATE TABLE sales_channels (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(20) NOT NULL,                   -- marketplace | own | pos | social
    icon            VARCHAR(200),
    status          VARCHAR(20) NOT NULL DEFAULT 'disconnected', -- connected | disconnected | error
    oauth_token     TEXT,                                   -- encrypted
    oauth_refresh   TEXT,                                   -- encrypted
    config          JSONB DEFAULT '{}',                     -- cấu hình riêng mỗi kênh
    total_orders    INT DEFAULT 0,
    total_revenue   BIGINT DEFAULT 0,
    last_sync_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log đồng bộ kênh
CREATE TABLE sync_logs (
    id              BIGSERIAL PRIMARY KEY,
    channel_id      BIGINT NOT NULL REFERENCES sales_channels(id),
    type            VARCHAR(30) NOT NULL,                   -- product_sync | stock_sync | order_import | price_update
    status          VARCHAR(20) NOT NULL,                   -- success | failed | partial
    items_total     INT DEFAULT 0,
    items_success   INT DEFAULT 0,
    items_failed    INT DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ NOT NULL,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sync_logs_channel ON sync_logs(channel_id);
CREATE INDEX idx_sync_logs_created ON sync_logs(created_at DESC);
```

---

## 8. omni_shipping

```sql
-- Vận đơn
CREATE TABLE shipments (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL,                        -- FK cross-service
    carrier         VARCHAR(50) NOT NULL,                   -- GHTK | GHN | ViettelPost
    tracking_number VARCHAR(100) UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'created', -- created | picked_up | in_transit | delivered | failed | returned
    weight          INT,                                    -- gram
    shipping_fee    BIGINT DEFAULT 0,
    insurance_fee   BIGINT DEFAULT 0,
    estimated_date  DATE,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Lịch sử tracking
CREATE TABLE tracking_events (
    id              BIGSERIAL PRIMARY KEY,
    shipment_id     BIGINT NOT NULL REFERENCES shipments(id),
    status          VARCHAR(50) NOT NULL,
    location        VARCHAR(300),
    description     TEXT,
    event_time      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tracking_shipment ON tracking_events(shipment_id);
```

---

## 9. omni_notifications

```sql
-- Thông báo
CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT,                                 -- NULL = broadcast, có giá trị = gửi cho user cụ thể
    type            VARCHAR(30) NOT NULL,                   -- order | inventory | system | marketing | alert
    title           VARCHAR(300) NOT NULL,
    message         TEXT NOT NULL,
    icon            VARCHAR(50),                            -- fa-shopping-cart, fa-box-open, ...
    severity        VARCHAR(10) NOT NULL DEFAULT 'info',    -- info | warn | crit
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## 10. omni_staff

```sql
-- Nhân viên
CREATE TABLE staff_members (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,            -- NV-001
    name            VARCHAR(200) NOT NULL,
    email           VARCHAR(200) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(200) NOT NULL,
    department      VARCHAR(100),
    position        VARCHAR(100),
    role_id         BIGINT REFERENCES roles(id),
    warehouse_code  VARCHAR(20),                            -- WH-HCM, WH-HN (NULL = không gắn kho)
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | inactive
    mfa_secret      VARCHAR(100),
    kpi_orders      INT DEFAULT 0,                          -- denormalized
    kpi_revenue     BIGINT DEFAULT 0,                       -- denormalized
    deleted_at      TIMESTAMPTZ,
    joined_at       DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_staff_email ON staff_members(email);
CREATE INDEX idx_staff_role ON staff_members(role_id);
CREATE INDEX idx_staff_department ON staff_members(department);

-- Vai trò
CREATE TABLE roles (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,            -- SUPER_ADMIN, ADMIN, SALES_MGR, ...
    label           VARCHAR(100) NOT NULL,                  -- Super Admin, Admin, Sales Manager, ...
    is_system       BOOLEAN DEFAULT FALSE,                  -- TRUE = vai trò mặc định, không xóa được
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quyền hạn
CREATE TABLE permissions (
    id              BIGSERIAL PRIMARY KEY,
    module          VARCHAR(50) NOT NULL,                   -- products | orders | inventory | crm | marketing | ...
    action          VARCHAR(20) NOT NULL,                   -- view | create | edit | delete | export
    UNIQUE(module, action)
);

-- Mapping role ↔ permission
CREATE TABLE role_permissions (
    role_id         BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Ca làm việc
CREATE TABLE shifts (
    id              BIGSERIAL PRIMARY KEY,
    staff_id        BIGINT NOT NULL REFERENCES staff_members(id),
    date            DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled | checked_in | completed
    check_in_at     TIMESTAMPTZ,
    check_out_at    TIMESTAMPTZ,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shifts_staff ON shifts(staff_id);
CREATE INDEX idx_shifts_date ON shifts(date);

-- Audit log hệ thống
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT,
    username        VARCHAR(100) NOT NULL,
    action          VARCHAR(50) NOT NULL,                   -- LOGIN | CREATE | UPDATE | DELETE | EXPORT | VIEW
    resource        VARCHAR(200) NOT NULL,                  -- products/1, orders/DH-9823
    result          VARCHAR(20) NOT NULL,                   -- allowed | denied
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    details         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_logs(username);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

### ERD

```
roles ──1:N──► role_permissions ◄──N:1── permissions
roles ◄──N:1── staff_members ──1:N──► shifts
                    └──────────────────► audit_logs
```

---

## 11. omni_finance

```sql
-- Giao dịch tài chính
CREATE TABLE transactions (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,            -- TX-001
    type            VARCHAR(20) NOT NULL,                   -- income | expense | refund
    amount          BIGINT NOT NULL,
    method          VARCHAR(50) NOT NULL,                   -- VNPay | Momo | Tiền mặt | Chuyển khoản | ...
    order_id        BIGINT,                                 -- FK cross-service (NULL cho expense)
    payment_id      BIGINT,                                 -- FK cross-service
    description     TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'completed', -- completed | pending | failed
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_method ON transactions(method);

-- Đối soát
CREATE TABLE reconciliation_records (
    id              BIGSERIAL PRIMARY KEY,
    period_date     DATE NOT NULL,
    channel         VARCHAR(50) NOT NULL,
    expected        BIGINT NOT NULL,
    actual          BIGINT NOT NULL,
    difference      BIGINT NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL,                   -- matched | mismatch | pending
    note            TEXT,
    reconciled_by   VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recon_date ON reconciliation_records(period_date);
CREATE INDEX idx_recon_channel ON reconciliation_records(channel);

-- Báo cáo tổng hợp tháng
CREATE TABLE monthly_reports (
    id              BIGSERIAL PRIMARY KEY,
    year_month      VARCHAR(7) NOT NULL UNIQUE,             -- 2026-02
    income          BIGINT NOT NULL DEFAULT 0,
    expense         BIGINT NOT NULL DEFAULT 0,
    refund          BIGINT NOT NULL DEFAULT 0,
    profit          BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Tổng hợp cross-service references

| Cột | Ở database | Tham chiếu tới | Đồng bộ qua |
|---|---|---|---|
| orders.customer_id | omni_orders | omni_customers.customers.id | Kafka `orders.created` |
| order_items.product_id | omni_orders | omni_products.products.id | snapshot tại thời điểm mua |
| stock_items.product_id | omni_inventory | omni_products.products.id | Kafka `inventory.updated` |
| voucher_usage.customer_id | omni_marketing | omni_customers.customers.id | Kafka `orders.confirmed` |
| voucher_usage.order_id | omni_marketing | omni_orders.orders.id | Kafka `orders.confirmed` |
| payment_transactions.order_id | omni_payments | omni_orders.orders.id | Kafka `payments.completed` |
| shipments.order_id | omni_shipping | omni_orders.orders.id | Kafka `orders.shipped` |
| transactions.order_id | omni_finance | omni_orders.orders.id | Kafka `payments.completed` |
| notifications.user_id | omni_notifications | omni_staff.staff_members.id | Kafka events |

Quy tắc: KHÔNG BAO GIỜ join cross-database. Nếu cần dữ liệu từ service khác, gọi REST API hoặc lưu denormalized field (vd: `order_items.name` snapshot tên sản phẩm).
