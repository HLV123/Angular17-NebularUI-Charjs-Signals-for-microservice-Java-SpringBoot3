# BUSINESS-FLOWS.md · Luồng nghiệp vụ chính

Sequence diagram dạng text cho các luồng quan trọng nhất.

---

## 1. Đăng nhập & Phân quyền

```
Angular                  Gateway              staff-service          Redis
  │                        │                      │                    │
  │ POST /auth/login       │                      │                    │
  │ {username, password}   │                      │                    │
  │───────────────────────►│                      │                    │
  │                        │ forward              │                    │
  │                        │─────────────────────►│                    │
  │                        │                      │ BCrypt verify      │
  │                        │                      │ Generate JWT       │
  │                        │    {token, user}      │                    │
  │                        │◄─────────────────────│                    │
  │                        │                      │ Cache session      │
  │                        │                      │───────────────────►│
  │  {token, user}         │                      │                    │
  │◄───────────────────────│                      │                    │
  │                        │                      │                    │
  │ localStorage.set       │                      │                    │
  │ ('omni_token', jwt)    │                      │                    │
  │ ('omni_user', user)    │                      │                    │
  │                        │                      │                    │
  │ Navigate to            │                      │                    │
  │ getFirstAllowedPage()  │                      │                    │
  │ RBAC sidebar filter    │                      │                    │
```

---

## 2. Đặt hàng từ Shopee (Marketplace Order)

```
Shopee Webhook     channel-service    Kafka           order-service      inventory(gRPC)    notification
    │                   │               │                  │                   │                │
    │ POST /webhook     │               │                  │                   │                │
    │ {order data}      │               │                  │                   │                │
    │──────────────────►│               │                  │                   │                │
    │                   │ Normalize     │                  │                   │                │
    │                   │ format        │                  │                   │                │
    │                   │               │                  │                   │                │
    │                   │ marketplace   │                  │                   │                │
    │                   │ .orders       │                  │                   │                │
    │                   │──────────────►│                  │                   │                │
    │                   │               │                  │                   │                │
    │                   │               │ consume          │                   │                │
    │                   │               │─────────────────►│                   │                │
    │                   │               │                  │                   │                │
    │                   │               │                  │ CheckStock()      │                │
    │                   │               │                  │──────────────────►│                │
    │                   │               │                  │ {all_available}   │                │
    │                   │               │                  │◄──────────────────│                │
    │                   │               │                  │                   │                │
    │                   │               │                  │ ReserveStock()    │                │
    │                   │               │                  │──────────────────►│                │
    │                   │               │                  │ {reservation_id}  │                │
    │                   │               │                  │◄──────────────────│                │
    │                   │               │                  │                   │                │
    │                   │               │                  │ Save order DB     │                │
    │                   │               │                  │ status = "new"    │                │
    │                   │               │                  │                   │                │
    │                   │               │ orders.created   │                   │                │
    │                   │               │◄─────────────────│                   │                │
    │                   │               │                  │                   │                │
    │                   │               │         consume  │                   │                │
    │                   │               │─────────────────────────────────────────────────────►│
    │                   │               │                  │                   │                │
    │                   │               │                  │                   │   WebSocket    │
    │                   │               │                  │                   │   push to      │
    │                   │               │                  │                   │   Angular      │
```

---

## 3. Vòng đời đơn hàng (Order Lifecycle)

```
Trạng thái         Ai thực hiện         Hành động kèm theo
────────────────────────────────────────────────────────────────

  ┌─────┐
  │ new │ ◄──── Hệ thống tạo tự động từ marketplace webhook hoặc POS
  └──┬──┘
     │
     ▼  Xác nhận đơn (Admin/Sales)
  ┌───────────┐
  │ confirmed │ ──► Kafka: orders.confirmed
  └─────┬─────┘     inventory: commit reservation
        │           notification: email xác nhận → khách
        ▼
  ┌─────────────────┐
  │ pending_payment  │ (nếu COD hoặc chờ chuyển khoản)
  └───────┬─────────┘
          │ Payment gateway callback
          ▼
  ┌──────┐
  │ paid │ ──► Kafka: payments.completed
  └──┬───┘     finance: ghi nhận income
     │         loyalty: cộng điểm
     ▼
  ┌────────────┐
  │ processing │ ──► Nhân viên kho bắt đầu chuẩn bị
  └─────┬──────┘
        ▼
  ┌─────────┐
  │ packing │ ──► Nhân viên đóng gói, in label
  └────┬────┘
       │ gRPC: shipping.CreateShipment()
       ▼
  ┌──────────┐
  │ shipping │ ──► Kafka: orders.shipped
  └────┬─────┘     notification: SMS tracking → khách
       │
       │ Carrier xác nhận giao thành công
       ▼
  ┌───────────┐
  │ delivered │ ──► Kafka: orders.completed
  └─────┬─────┘     loyalty: AddPoints()
        │           customer: cập nhật totalSpent
        ▼
  ┌───────────┐
  │ completed │ ──► Đơn hoàn tất
  └───────────┘


  Nhánh hủy (từ new/confirmed/pending_payment):
  ┌───────────┐
  │ cancelled │ ──► Kafka: orders.cancelled
  └───────────┘     inventory: ReleaseStock()
                    payment: InitiateRefund() (nếu đã thanh toán)

  Nhánh hoàn hàng (từ delivered):
  ┌──────────┐
  │ returned │ ──► inventory: nhập lại kho
  └──────────┘     payment: InitiateRefund()
                   customer: trừ điểm loyalty
```

---

## 4. Flash Sale

```
Airflow (scheduled)     marketing-service     Kafka           product-service    notification     Angular
     │                       │                  │                  │                │               │
     │ Trigger DAG           │                  │                  │                │               │
     │ campaigns.flashsale   │                  │                  │                │               │
     │──────────────────────►│                  │                  │                │               │
     │                       │ Update campaign  │                  │                │               │
     │                       │ status=running   │                  │                │               │
     │                       │                  │                  │                │               │
     │                       │ flashsale        │                  │                │               │
     │                       │ .started         │                  │                │               │
     │                       │─────────────────►│                  │                │               │
     │                       │                  │                  │                │               │
     │                       │                  │ consume          │                │               │
     │                       │                  │─────────────────►│                │               │
     │                       │                  │                  │                │               │
     │                       │                  │        Cập nhật  │                │               │
     │                       │                  │        sale_price│                │               │
     │                       │                  │        cho SP    │                │               │
     │                       │                  │                  │                │               │
     │                       │                  │ consume                           │               │
     │                       │                  │─────────────────────────────────►│               │
     │                       │                  │                  │                │               │
     │                       │                  │                  │                │ WebSocket     │
     │                       │                  │                  │                │ "Flash sale   │
     │                       │                  │                  │                │  bắt đầu!"   │
     │                       │                  │                  │                │──────────────►│
     │                       │                  │                  │                │               │
     │                       │                  │                  │                │  Dashboard    │
     │                       │                  │                  │                │  hiện banner  │
```

---

## 5. Fraud Detection (Realtime)

```
payment-service     Kafka               Spark Streaming     Kafka           notification      Angular (Admin)
     │                │                      │                │                │                │
     │ payments       │                      │                │                │                │
     │ .initiated     │                      │                │                │                │
     │───────────────►│                      │                │                │                │
     │                │                      │                │                │                │
     │                │ consume              │                │                │                │
     │                │─────────────────────►│                │                │                │
     │                │                      │                │                │                │
     │                │          ML Model    │                │                │                │
     │                │          score=0.92  │                │                │                │
     │                │          > threshold │                │                │                │
     │                │                      │                │                │                │
     │                │                      │ fraud.alert    │                │                │
     │                │                      │───────────────►│                │                │
     │                │                      │                │                │                │
     │                │                      │                │ consume        │                │
     │                │                      │                │───────────────►│                │
     │                │                      │                │                │                │
     │                │                      │                │                │ WebSocket      │
     │                │                      │                │                │ severity=crit  │
     │                │                      │                │                │───────────────►│
     │                │                      │                │                │                │
     │ Hold payment   │                      │                │                │     Admin thấy │
     │ (from Kafka    │                      │                │                │     alert đỏ   │
     │  fraud.alert)  │                      │                │                │     trên       │
     │                │                      │                │                │     dashboard  │
```

---

## 6. Phân tích RFM (Daily Batch)

```
Airflow (01:00 AM)     Spark Batch        Kafka                  customer-service    marketing-service
     │                      │                │                        │                    │
     │ Trigger DAG          │                │                        │                    │
     │ daily_rfm            │                │                        │                    │
     │─────────────────────►│                │                        │                    │
     │                      │                │                        │                    │
     │          Read orders │                │                        │                    │
     │          from Kafka  │                │                        │                    │
     │          + DB        │                │                        │                    │
     │                      │                │                        │                    │
     │          Tính RFM    │                │                        │                    │
     │          10019 KH    │                │                        │                    │
     │          ~5 phút     │                │                        │                    │
     │                      │                │                        │                    │
     │                      │ analytics      │                        │                    │
     │                      │ .rfm.results   │                        │                    │
     │                      │───────────────►│                        │                    │
     │                      │                │                        │                    │
     │                      │ customers      │                        │                    │
     │                      │ .segment       │                        │                    │
     │                      │ _updated       │                        │                    │
     │                      │───────────────►│                        │                    │
     │                      │                │ consume                │                    │
     │                      │                │───────────────────────►│                    │
     │                      │                │                        │                    │
     │                      │                │      Cập nhật segment  │                    │
     │                      │                │      156 KH thay đổi   │                    │
     │                      │                │                        │                    │
     │                      │                │ consume                                     │
     │                      │                │────────────────────────────────────────────►│
     │                      │                │                        │                    │
     │                      │                │                        │       Tự động tạo  │
     │                      │                │                        │       campaign     │
     │                      │                │                        │       "Win-back"   │
     │                      │                │                        │       cho "At Risk"│
```

---

## 7. Đồng bộ tồn kho đa kênh

```
inventory-service      Kafka              channel-service      Shopee API     Lazada API     TikTok API
     │                   │                     │                  │              │              │
     │ Stock thay đổi    │                     │                  │              │              │
     │ (do bán hàng)     │                     │                  │              │              │
     │                   │                     │                  │              │              │
     │ inventory         │                     │                  │              │              │
     │ .updated          │                     │                  │              │              │
     │──────────────────►│                     │                  │              │              │
     │                   │                     │                  │              │              │
     │                   │ consume             │                  │              │              │
     │                   │────────────────────►│                  │              │              │
     │                   │                     │                  │              │              │
     │                   │                     │ Đọc channel_prices│              │              │
     │                   │                     │ cho product này   │              │              │
     │                   │                     │                  │              │              │
     │                   │                     │ PUT /stock        │              │              │
     │                   │                     │─────────────────►│              │              │
     │                   │                     │                  │              │              │
     │                   │                     │ PUT /stock                       │              │
     │                   │                     │─────────────────────────────────►│              │
     │                   │                     │                  │              │              │
     │                   │                     │ PUT /stock                                      │
     │                   │                     │────────────────────────────────────────────────►│
     │                   │                     │                  │              │              │
     │                   │                     │ Ghi sync_log     │              │              │
     │                   │                     │ {success/fail}   │              │              │
```

---

## 8. Hoàn hàng / Hoàn tiền

```
Angular (CS Agent)    order-service      payment(gRPC)     inventory(gRPC)    Kafka           customer-service
     │                    │                  │                  │                │                │
     │ POST /orders/1     │                  │                  │                │                │
     │ /return            │                  │                  │                │                │
     │ {reason, items}    │                  │                  │                │                │
     │───────────────────►│                  │                  │                │                │
     │                    │                  │                  │                │                │
     │                    │ Validate:        │                  │                │                │
     │                    │ status==delivered│                  │                │                │
     │                    │ within 7 days    │                  │                │                │
     │                    │                  │                  │                │                │
     │                    │ Create return    │                  │                │                │
     │                    │ request          │                  │                │                │
     │                    │                  │                  │                │                │
     │                    │ Update order     │                  │                │                │
     │                    │ status=returned  │                  │                │                │
     │                    │                  │                  │                │                │
     │                    │ InitiateRefund() │                  │                │                │
     │                    │─────────────────►│                  │                │                │
     │                    │ {refund_id}      │                  │                │                │
     │                    │◄─────────────────│                  │                │                │
     │                    │                  │                  │                │                │
     │                    │                  │ payments         │                │                │
     │                    │                  │ .refunded        │                │                │
     │                    │                  │─────────────────────────────────►│                │
     │                    │                  │                  │                │                │
     │                    │                  │                  │                │ consume        │
     │                    │                  │                  │                │───────────────►│
     │                    │                  │                  │                │                │
     │                    │                  │                  │                │   Trừ points   │
     │                    │                  │                  │                │   Cập nhật     │
     │                    │                  │                  │                │   totalSpent   │
     │                    │                  │                  │                │                │
     │                    │ (Khi nhận hàng về)                 │                │                │
     │                    │ ReleaseStock()   │                  │                │                │
     │                    │ (nhập lại kho)   │                  │                │                │
     │                    │────────────────────────────────────►│                │                │
     │                    │                  │                  │                │                │
     │ {return confirmed} │                  │                  │                │                │
     │◄───────────────────│                  │                  │                │                │
```
