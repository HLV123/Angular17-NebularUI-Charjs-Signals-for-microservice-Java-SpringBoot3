# MOCK-DATA.md · Frontend Mock ↔ Backend Seed Data

Frontend Angular hiện tại dùng mock data (hardcode trong services). Khi backend sẵn sàng, cần seed data khớp chính xác để demo nhất quán.

---

## Quy tắc

- Backend seed data phải khớp **id, code, SKU** với frontend mock
- Frontend gọi API → backend trả data → frontend hiển thị giống y hệt như mock hiện tại
- Nếu backend trả thiếu field hoặc sai tên field → frontend crash hoặc hiển thị sai

---

## 1. Products — 12 sản phẩm, 12 variants, 8 danh mục

### Source: `product.service.ts`

### Categories

| id | name | slug | productCount |
|---|---|---|---|
| 1 | Thời trang nam | thoi-trang-nam | 324 |
| 2 | Mỹ phẩm | my-pham | 186 |
| 3 | Giày dép | giay-dep | 142 |
| 4 | Điện tử | dien-tu | 278 |
| 5 | Thực phẩm | thuc-pham | 195 |
| 6 | Thời trang nữ | thoi-trang-nu | 256 |
| 7 | Phụ kiện | phu-kien | 98 |
| 8 | Nhà cửa | nha-cua | 47 |

### Products

| id | sku | name | category | brand | price | costPrice | salePrice | stock | sold | rating | status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TT-OS-001 | Áo khoác bomber nam cao cấp | Thời trang nam | OmniStyle | 520000 | 280000 | 468000 | 95 | 1240 | 4.8 | active |
| 2 | MP-VB-001 | Serum Vitamin C 20% | Mỹ phẩm | VietBeauty | 380000 | 120000 | — | 245 | 3420 | 4.9 | active |
| 3 | GD-UF-001 | Giày Air Comfort Pro | Giày dép | UrbanFit | 980000 | 450000 | — | 85 | 876 | 4.7 | active |
| 4 | DT-TV-001 | Tai nghe Bluetooth TWS Pro Max | Điện tử | TechViet | 690000 | 320000 | 590000 | 121 | 2156 | 4.6 | active |
| 5 | TP-GL-001 | Trà hoa cúc organic | Thực phẩm | GreenLife | 150000 | 45000 | — | 500 | 4567 | 4.9 | active |
| 6 | TT-OS-002 | Áo sơ mi Oxford Classic | Thời trang nam | OmniStyle | 420000 | 190000 | — | 67 | 932 | 4.5 | active |
| 7 | DT-TV-002 | Sạc dự phòng 20000mAh PD 65W | Điện tử | TechViet | 850000 | 420000 | — | 0 | 1890 | 4.4 | out_of_stock |
| 8 | MP-VB-002 | Kem chống nắng SPF50+ PA++++ | Mỹ phẩm | VietBeauty | 290000 | 85000 | — | 178 | 2876 | 4.8 | active |
| 9 | TN-OS-001 | Váy hoa vintage retro | Thời trang nữ | OmniStyle | 380000 | 165000 | — | 43 | 654 | 4.6 | active |
| 10 | PK-OS-001 | Balo laptop chống nước | Phụ kiện | OmniStyle | 650000 | 280000 | — | 34 | 423 | 4.7 | active |
| 11 | TP-GL-002 | Mật ong rừng nguyên chất | Thực phẩm | GreenLife | 280000 | 120000 | — | 89 | 1234 | 4.8 | active |
| 12 | NC-HM-001 | Nến thơm sáp đậu nành | Nhà cửa | HomeMade | 180000 | 55000 | — | 156 | 789 | 4.9 | active |

### Variants (product_id → variants)

| id | product_id | sku | attributes | price | stock |
|---|---|---|---|---|---|
| 1 | 1 | TT-OS-001-BK-M | {"color":"Đen","size":"M"} | 520000 | 30 |
| 2 | 1 | TT-OS-001-BK-L | {"color":"Đen","size":"L"} | 520000 | 35 |
| 3 | 1 | TT-OS-001-NV-M | {"color":"Navy","size":"M"} | 520000 | 30 |
| 4 | 2 | MP-VB-001-30 | {"size":"30ml"} | 380000 | 145 |
| 5 | 2 | MP-VB-001-50 | {"size":"50ml"} | 520000 | 100 |
| 6 | 3 | GD-UF-001-40 | {"size":"40"} | 980000 | 25 |
| 7 | 3 | GD-UF-001-41 | {"size":"41"} | 980000 | 30 |
| 8 | 3 | GD-UF-001-42 | {"size":"42"} | 980000 | 30 |
| 9 | 4 | DT-TV-001-BK | {"color":"Đen"} | 690000 | 65 |
| 10 | 4 | DT-TV-001-WH | {"color":"Trắng"} | 690000 | 56 |
| 11 | 5 | TP-GL-001-100 | {"size":"100g"} | 150000 | 300 |
| 12 | 5 | TP-GL-001-250 | {"size":"250g"} | 320000 | 200 |

### Channel Prices (product_id → channels)

| product_id | channel | price | enabled |
|---|---|---|---|
| 1 | Website | 520000 | true |
| 1 | Shopee | 540000 | true |
| 1 | Lazada | 530000 | true |
| 2 | Website | 380000 | true |
| 2 | Shopee | 399000 | true |
| 2 | TikTok | 385000 | true |
| 3 | Website | 980000 | true |
| 3 | Lazada | 999000 | true |
| 4 | Website | 690000 | true |
| 4 | Shopee | 710000 | true |
| 4 | TikTok | 700000 | true |
| 5 | Website | 150000 | true |
| 5 | Shopee | 155000 | true |
| 5 | Tiki | 152000 | true |
| 10 | Website | 650000 | true |
| 10 | Shopee | 670000 | true |

---

## 2. Orders — 10 đơn hàng

### Source: `order.service.ts`

| id | code | channel | customerName | total | paymentMethod | paymentStatus | status |
|---|---|---|---|---|---|---|---|
| 1 | #DH-9823 | Shopee | Nguyễn Minh Anh | 1280000 | VNPay | paid | confirmed |
| 2 | #TT-2312 | TikTok | Lê Thảo Nhi | 672000 | COD | cod | pending_payment |
| 3 | #WEB-671 | Website | Trần Hoàng Nam | 2140000 | Momo | paid | processing |
| 4 | #CS-54 | POS | Khách lẻ | 455000 | Tiền mặt | paid | completed |
| 5 | #LZ-8834 | Lazada | Phạm Thị Lan | 835000 | Ví Lazada | paid | shipping |
| 6 | #FB-445 | Facebook | Đặng Thùy Dương | 545000 | COD | cod | new |
| 7 | #TK-1156 | Tiki | Bùi Thanh Hải | 690000 | VNPay | paid | packing |
| 8 | #DH-9820 | Shopee | Trương Văn Tùng | 1134000 | Ví ShopeePay | paid | delivered |
| 9 | #WEB-668 | Website | Nguyễn Thị Mai | 585000 | Chuyển khoản | paid | completed |
| 10 | #DH-9815 | Shopee | Lý Minh Đức | 498000 | VNPay | paid | cancelled |

### Order Status Labels (phải khớp)

```
new → "Mới"
confirmed → "Đã xác nhận"
pending_payment → "Chờ thanh toán"
paid → "Đã thanh toán"
processing → "Đang xử lý"
packing → "Đóng gói"
shipping → "Đang giao"
shipped → "Đã giao"
delivered → "Đã nhận hàng"
completed → "Hoàn thành"
cancelled → "Đã hủy"
returned → "Hoàn hàng"
```

---

## 3. Customers — 8 khách hàng

### Source: `customer.service.ts`

| id | code | name | phone | segment | loyaltyTier | loyaltyPoints | totalOrders | totalSpent |
|---|---|---|---|---|---|---|---|---|
| 1 | KH-001 | Nguyễn Minh Anh | 0987654321 | Champions | Gold | 15600 | 28 | 15600000 |
| 2 | KH-002 | Lê Thảo Nhi | 0912345678 | Loyal Customers | Silver | 8900 | 15 | 8900000 |
| 3 | KH-003 | Trần Hoàng Nam | 0901234567 | Champions | Platinum | 32500 | 42 | 32500000 |
| 4 | KH-004 | Phạm Thị Lan | 0976543210 | Potential Loyalists | Bronze | 4200 | 8 | 4200000 |
| 5 | KH-005 | Đặng Thùy Dương | 0965432109 | Potential Loyalists | Bronze | 1650 | 3 | 1650000 |
| 6 | KH-006 | Bùi Thanh Hải | 0943216789 | Loyal Customers | Silver | 9800 | 12 | 9800000 |
| 7 | KH-007 | Trương Văn Tùng | 0932165487 | At Risk | Bronze | 3200 | 5 | 3200000 |
| 8 | KH-008 | Nguyễn Thị Mai | 0918765432 | Loyal Customers | Gold | 11200 | 19 | 11200000 |

### Segments

| name | count | color | change |
|---|---|---|---|
| Champions | 1240 | #00D68F | +12% |
| Loyal Customers | 2350 | #3366FF | +5% |
| Potential Loyalists | 3892 | #FFAA00 | +8% |
| At Risk | 432 | #FF3D71 | -3% |
| Hibernating | 2105 | #8F9BB3 | -7% |

### Loyalty Tiers

| name | minPoints | discount (%) | freeShip | count |
|---|---|---|---|---|
| Platinum | 25000 | 15 | true | 45 |
| Gold | 10000 | 10 | true | 234 |
| Silver | 5000 | 5 | false | 567 |
| Bronze | 0 | 0 | false | 3210 |

---

## 4. Inventory — 5 kho, 11 stock items, 4 nhà cung cấp, 2 PO, 2 transfers

### Source: `inventory.service.ts`

### Warehouses

| id | name | code | type | totalProducts | totalValue |
|---|---|---|---|---|---|
| 1 | Kho chính TP.HCM | WH-HCM | physical | 856 | 2450000000 |
| 2 | Kho Hà Nội | WH-HN | physical | 534 | 1280000000 |
| 3 | Kho Đà Nẵng | WH-DN | physical | 267 | 650000000 |
| 4 | Virtual - Shopee | V-SPE | virtual | 420 | 0 |
| 5 | Virtual - Lazada | V-LZD | virtual | 380 | 0 |

### Suppliers

| id | name | contactPerson | phone | rating | totalOrders |
|---|---|---|---|---|---|
| 1 | OmniStyle Factory | Nguyễn Văn A | 0281234567 | 4.8 | 156 |
| 2 | VietBeauty Lab | Trần Thị B | 0289876543 | 4.9 | 89 |
| 3 | TechViet Electronics | Lê Văn C | 0287654321 | 4.5 | 67 |
| 4 | GreenLife Agriculture | Phạm Thị D | 0283456789 | 4.7 | 45 |

### Stock Items (lưu ý: product id 8 (Kem chống nắng) quantity=12 < minThreshold=30 → low stock alert)

| productId | sku | productName | warehouseId | quantity | minThreshold | maxThreshold |
|---|---|---|---|---|---|---|
| 1 | TT-OS-001 | Áo khoác bomber nam | 1 (WH-HCM) | 60 | 20 | 200 |
| 1 | TT-OS-001 | Áo khoác bomber nam | 2 (WH-HN) | 35 | 15 | 100 |
| 2 | MP-VB-001 | Serum Vitamin C 20% | 1 | 145 | 30 | 300 |
| 2 | MP-VB-001 | Serum Vitamin C 20% | 2 | 100 | 20 | 200 |
| 3 | GD-UF-001 | Giày Air Comfort Pro | 1 | 55 | 15 | 150 |
| 3 | GD-UF-001 | Giày Air Comfort Pro | 3 (WH-DN) | 30 | 10 | 80 |
| 4 | DT-TV-001 | Tai nghe TWS Pro Max | 1 | 80 | 25 | 200 |
| 4 | DT-TV-001 | Tai nghe TWS Pro Max | 2 | 41 | 15 | 100 |
| 5 | TP-GL-001 | Trà hoa cúc organic | 1 | 300 | 50 | 500 |
| 7 | DT-TV-002 | Sạc dự phòng 20000mAh | 1 | 0 | 20 | 150 |
| 8 | MP-VB-002 | Kem chống nắng SPF50+ | 1 | 12 | 30 | 200 |

---

## 5. Marketing — 5 campaigns, 5 vouchers

### Source: `marketing.service.ts`

### Campaigns

| id | name | type | status | targetSegment | budget | spent | reach | conversions |
|---|---|---|---|---|---|---|---|---|
| 1 | Flash Sale 20h - Giảm sốc 50% | push | running | Champions | 15000000 | 8700000 | 12500 | 456 |
| 2 | Email: Bỏ quên giỏ hàng | email | running | All | 5000000 | 2100000 | 8400 | 234 |
| 3 | Zalo ZNS: Thông báo KM Tết | zns | scheduled | Loyal Customers | 8000000 | 0 | 0 | 0 |
| 4 | SMS: Chúc mừng sinh nhật T2 | sms | completed | Birthday Feb | 3000000 | 2840000 | 2840 | 145 |
| 5 | Facebook Ads: BST mùa xuân | facebook | paused | Potential Loyalists | 20000000 | 12500000 | 45000 | 312 |

### Vouchers

| id | code | name | type | value | minOrderValue | maxDiscount | usageLimit | usedCount | status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | COMBO30 | Giảm 30% combo | percentage | 30 | 500000 | 200000 | 500 | 342 | active |
| 2 | FREESHIP50 | Freeship đơn từ 300K | freeship | 50000 | 300000 | — | 1000 | 567 | active |
| 3 | NEWUSER100 | Giảm 100K khách mới | fixed | 100000 | 400000 | — | 200 | 89 | active |
| 4 | LOYAL500 | Đổi 500 điểm | fixed | 50000 | 200000 | — | 9999 | 234 | active |
| 5 | TET2026 | Tết Nguyên Đán giảm 20% | percentage | 20 | 300000 | 150000 | 2000 | 2000 | expired |

---

## 6. Channels — 8 kênh bán hàng

### Source: `channel.service.ts`

| id | name | type | status | orders | revenue |
|---|---|---|---|---|---|
| 1 | Shopee | marketplace | connected | 3456 | 1850000000 |
| 2 | Lazada | marketplace | connected | 2134 | 1200000000 |
| 3 | TikTok Shop | marketplace | connected | 1876 | 980000000 |
| 4 | Website | own | connected | 4521 | 2500000000 |
| 5 | POS Hà Nội | pos | connected | 1234 | 650000000 |
| 6 | POS TP.HCM | pos | connected | 2345 | 1100000000 |
| 7 | Facebook Shop | social | connected | 876 | 420000000 |
| 8 | Tiki | marketplace | connected | 987 | 530000000 |

---

## 7. Staff — 10 nhân viên, 4 ca làm việc

### Source: `staff.service.ts`

| id | code | name | email | department | position | role | warehouse | status |
|---|---|---|---|---|---|---|---|---|
| 1 | NV-001 | Nguyễn Văn Admin | admin@omnirevenue.vn | IT | Giám đốc CNTT | SUPER_ADMIN | — | active |
| 2 | NV-002 | Trần Thị Quản Lý | quanly@omnirevenue.vn | Operations | Trưởng phòng Vận hành | ADMIN | — | active |
| 3 | NV-003 | Lê Minh Bán Hàng | sales@omnirevenue.vn | Sales | Trưởng phòng Kinh doanh | SALES_MGR | WH-HCM | active |
| 4 | NV-004 | Phạm Kho Hàng | kho@omnirevenue.vn | Warehouse | Quản lý kho | INV_MGR | WH-HCM | active |
| 5 | NV-005 | Hoàng Thị Marketing | mkt@omnirevenue.vn | Marketing | Trưởng phòng Marketing | MKT_MGR | — | active |
| 6 | NV-006 | Vũ Chăm Sóc | cs@omnirevenue.vn | Support | Nhân viên CSKH | CS_AGENT | — | active |
| 7 | NV-007 | Đỗ Thu Ngân | pos@omnirevenue.vn | POS | Thu ngân | CASHIER | WH-HN | active |
| 8 | NV-008 | Ngô Phân Tích | data@omnirevenue.vn | Data | Data Analyst | ANALYST | — | active |
| 9 | NV-009 | Đinh Văn Bán | dinhvan@omnirevenue.vn | Sales | Nhân viên bán hàng | SALES_MGR | WH-HN | active |
| 10 | NV-010 | Cao Thị Ngọc | caongoc@omnirevenue.vn | Support | Nhân viên CSKH | CS_AGENT | — | inactive |

### Login accounts (mật khẩu: `123456`, password_hash: bcrypt)

| username | role | maps to staff id |
|---|---|---|
| superadmin | SUPER_ADMIN | 1 |
| admin | ADMIN | 2 |
| sales | SALES_MGR | 3 |
| warehouse | INV_MGR | 4 |
| marketing | MKT_MGR | 5 |
| csagent | CS_AGENT | 6 |
| cashier | CASHIER | 7 |
| analyst | ANALYST | 8 |

---

## 8. Finance — 10 giao dịch, 5 đối soát

### Source: `finance.service.ts`

### Transactions

| id | code | type | amount | method | orderId | description | status |
|---|---|---|---|---|---|---|---|
| 1 | TX-001 | income | 1280000 | VNPay | 1 | Thanh toán đơn #DH-9823 | completed |
| 2 | TX-002 | income | 2140000 | Momo | 3 | Thanh toán đơn #WEB-671 | completed |
| 3 | TX-003 | income | 455000 | Tiền mặt | 4 | POS #CS-54 | completed |
| 4 | TX-004 | income | 835000 | Ví Lazada | 5 | Thanh toán đơn #LZ-8834 | completed |
| 5 | TX-005 | income | 690000 | VNPay | 7 | Thanh toán đơn #TK-1156 | completed |
| 6 | TX-006 | income | 1134000 | ShopeePay | 8 | Thanh toán đơn #DH-9820 | completed |
| 7 | TX-007 | expense | 84500000 | Chuyển khoản | — | Nhập hàng PO-2026-001 | completed |
| 8 | TX-008 | refund | 498000 | VNPay | 10 | Hoàn tiền đơn #DH-9815 | completed |
| 9 | TX-009 | expense | 15000000 | Chuyển khoản | — | Chi phí marketing Flash Sale | completed |
| 10 | TX-010 | income | 585000 | Chuyển khoản | 9 | Thanh toán đơn #WEB-668 | completed |

### Reconciliation

| channel | expected | actual | difference | status |
|---|---|---|---|---|
| VNPay | 2468000 | 2468000 | 0 | matched |
| Momo | 2140000 | 2140000 | 0 | matched |
| ShopeePay | 1134000 | 1134000 | 0 | matched |
| Lazada Wallet | 835000 | 810000 | 25000 | mismatch |
| Tiền mặt (POS) | 455000 | 455000 | 0 | matched |

---

## 9. Notifications — 5 thông báo mặc định

### Source: `notification.service.ts`

| id | type | title | message | severity | read |
|---|---|---|---|---|---|
| 1 | order | Đơn hàng mới | Đơn #DH-9823 từ Shopee - 1.280.000₫ | info | false |
| 2 | inventory | Cảnh báo tồn kho | Áo thun basic đen sắp hết (còn 3) · Kho A | warn | false |
| 3 | alert | Phát hiện gian lận | Đơn #DH-9810 đã bị hold tự động | crit | false |
| 4 | system | Airflow DAG hoàn thành | daily_rfm_calculation chạy thành công | info | true |
| 5 | marketing | Flash sale sắp hết | Chiến dịch Flash 20h còn 30 phút | warn | false |
