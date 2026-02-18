# OmniRevenue Platform · Backend Microservices

Cấu trúc thư mục backend Java Spring Boot theo kiến trúc microservice, tương thích với frontend Angular đã hoàn thiện.

---

## 1. Cấu trúc tổng quan

```
omnirevenue-backend/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env
├── .env.example
├── pom.xml
├── README.md
│
├── api-gateway/
├── service-registry/
├── config-server/
│
├── product-service/
├── order-service/
├── inventory-service/
├── customer-service/
├── payment-service/
├── marketing-service/
├── channel-service/
├── shipping-service/
├── notification-service/
├── staff-service/
├── finance-service/
├── search-service/
│
├── spark-jobs/
├── airflow-dags/
│
├── proto/
│
└── infra/
```

---

## 2. Chi tiết từng thư mục

### 2.1 Hạ tầng chung

```
omnirevenue-backend/
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env
├── .env.example
├── pom.xml
│
├── infra/
│   ├── docker/
│   │   ├── kafka/
│   │   │   └── docker-compose.kafka.yml
│   │   ├── elasticsearch/
│   │   │   ├── docker-compose.es.yml
│   │   │   └── elasticsearch.yml
│   │   ├── atlas/
│   │   │   ├── docker-compose.atlas.yml
│   │   │   └── atlas-application.properties
│   │   ├── ranger/
│   │   │   ├── docker-compose.ranger.yml
│   │   │   └── ranger-admin-site.xml
│   │   ├── airflow/
│   │   │   ├── docker-compose.airflow.yml
│   │   │   └── airflow.cfg
│   │   ├── spark/
│   │   │   └── docker-compose.spark.yml
│   │   ├── postgres/
│   │   │   └── init-databases.sql
│   │   ├── redis/
│   │   │   └── redis.conf
│   │   └── monitoring/
│   │       ├── docker-compose.monitoring.yml
│   │       ├── prometheus.yml
│   │       └── grafana/
│   │           └── dashboards/
│   │               ├── jvm-overview.json
│   │               └── kafka-overview.json
│   ├── k8s/
│   │   ├── namespace.yml
│   │   ├── configmap.yml
│   │   ├── secrets.yml
│   │   ├── gateway-deployment.yml
│   │   ├── product-deployment.yml
│   │   ├── order-deployment.yml
│   │   ├── inventory-deployment.yml
│   │   ├── customer-deployment.yml
│   │   ├── payment-deployment.yml
│   │   ├── marketing-deployment.yml
│   │   ├── channel-deployment.yml
│   │   ├── shipping-deployment.yml
│   │   ├── notification-deployment.yml
│   │   ├── staff-deployment.yml
│   │   ├── finance-deployment.yml
│   │   ├── search-deployment.yml
│   │   └── ingress.yml
│   └── scripts/
│       ├── start-all.sh
│       ├── stop-all.sh
│       ├── init-kafka-topics.sh
│       └── seed-data.sh
│
├── proto/
│   ├── inventory.proto
│   ├── payment.proto
│   ├── shipping.proto
│   ├── loyalty.proto
│   └── notification.proto
```

### 2.2 Service Registry (Eureka)

```
service-registry/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/registry/
        │       └── ServiceRegistryApplication.java
        └── resources/
            ├── application.yml
            └── bootstrap.yml
```

Port: `8761`

### 2.3 Config Server (Spring Cloud Config)

```
config-server/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/config/
        │       └── ConfigServerApplication.java
        └── resources/
            ├── application.yml
            └── configurations/
                ├── application-common.yml
                ├── api-gateway.yml
                ├── product-service.yml
                ├── order-service.yml
                ├── inventory-service.yml
                ├── customer-service.yml
                ├── payment-service.yml
                ├── marketing-service.yml
                ├── channel-service.yml
                ├── shipping-service.yml
                ├── notification-service.yml
                ├── staff-service.yml
                ├── finance-service.yml
                └── search-service.yml
```

Port: `8888`

### 2.4 API Gateway

```
api-gateway/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/gateway/
        │       ├── ApiGatewayApplication.java
        │       ├── config/
        │       │   ├── RouteConfig.java
        │       │   ├── CorsConfig.java
        │       │   ├── WebSocketConfig.java
        │       │   └── RSocketConfig.java
        │       ├── filter/
        │       │   ├── JwtAuthFilter.java
        │       │   ├── RateLimitFilter.java
        │       │   └── LoggingFilter.java
        │       └── security/
        │           ├── SecurityConfig.java
        │           ├── JwtTokenProvider.java
        │           └── JwtTokenValidator.java
        └── resources/
            └── application.yml
```

Port: `8080` — frontend gọi tới đây (`http://localhost:8080/api/v1`).

Route mapping:

```
/api/v1/auth/**        → staff-service
/api/v1/products/**    → product-service
/api/v1/categories/**  → product-service
/api/v1/orders/**      → order-service
/api/v1/warehouses/**  → inventory-service
/api/v1/stock/**       → inventory-service
/api/v1/suppliers/**   → inventory-service
/api/v1/purchase-orders/** → inventory-service
/api/v1/stock-transfers/** → inventory-service
/api/v1/customers/**   → customer-service
/api/v1/campaigns/**   → marketing-service
/api/v1/vouchers/**    → marketing-service
/api/v1/channels/**    → channel-service
/api/v1/shipping/**    → shipping-service
/api/v1/transactions/**    → finance-service
/api/v1/reconciliation/**  → finance-service
/api/v1/finance/**     → finance-service
/api/v1/staff/**       → staff-service
/api/v1/shifts/**      → staff-service
/api/v1/notifications/**   → notification-service
/api/v1/search/**      → search-service
/api/v1/atlas/**       → search-service (proxy Atlas REST)
/api/v1/ranger/**      → staff-service (proxy Ranger Admin)
/api/v1/pipeline/**    → channel-service (proxy Airflow REST)
/ws/**                 → notification-service (WebSocket)
```

### 2.5 Product Service

```
product-service/
├── pom.xml
├── Dockerfile
└── src/
    ├── main/
    │   ├── java/
    │   │   └── vn/omnirevenue/product/
    │   │       ├── ProductServiceApplication.java
    │   │       ├── config/
    │   │       │   ├── KafkaProducerConfig.java
    │   │       │   └── KafkaConsumerConfig.java
    │   │       ├── controller/
    │   │       │   ├── ProductController.java
    │   │       │   └── CategoryController.java
    │   │       ├── dto/
    │   │       │   ├── ProductDTO.java
    │   │       │   ├── ProductCreateRequest.java
    │   │       │   ├── ProductUpdateRequest.java
    │   │       │   ├── VariantDTO.java
    │   │       │   ├── ChannelPriceDTO.java
    │   │       │   ├── CategoryDTO.java
    │   │       │   └── PageResponse.java
    │   │       ├── entity/
    │   │       │   ├── Product.java
    │   │       │   ├── ProductVariant.java
    │   │       │   ├── Category.java
    │   │       │   ├── ChannelPrice.java
    │   │       │   └── ProductImage.java
    │   │       ├── repository/
    │   │       │   ├── ProductRepository.java
    │   │       │   ├── VariantRepository.java
    │   │       │   └── CategoryRepository.java
    │   │       ├── service/
    │   │       │   ├── ProductService.java
    │   │       │   ├── ProductServiceImpl.java
    │   │       │   ├── CategoryService.java
    │   │       │   └── CategoryServiceImpl.java
    │   │       ├── mapper/
    │   │       │   ├── ProductMapper.java
    │   │       │   └── CategoryMapper.java
    │   │       ├── kafka/
    │   │       │   ├── ProductEventPublisher.java
    │   │       │   └── InventoryEventListener.java
    │   │       └── exception/
    │   │           ├── ProductNotFoundException.java
    │   │           ├── DuplicateSkuException.java
    │   │           └── GlobalExceptionHandler.java
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── db/
    │           └── migration/
    │               ├── V1__create_products.sql
    │               ├── V2__create_variants.sql
    │               ├── V3__create_categories.sql
    │               └── V4__create_channel_prices.sql
    └── test/
        └── java/
            └── vn/omnirevenue/product/
                ├── controller/
                │   └── ProductControllerTest.java
                └── service/
                    └── ProductServiceTest.java
```

Port: `8081`. Database: `omni_products` (PostgreSQL).

### 2.6 Order Service

```
order-service/
├── pom.xml
├── Dockerfile
└── src/
    ├── main/
    │   ├── java/
    │   │   └── vn/omnirevenue/order/
    │   │       ├── OrderServiceApplication.java
    │   │       ├── config/
    │   │       │   ├── KafkaConfig.java
    │   │       │   └── GrpcClientConfig.java
    │   │       ├── controller/
    │   │       │   └── OrderController.java
    │   │       ├── dto/
    │   │       │   ├── OrderDTO.java
    │   │       │   ├── OrderCreateRequest.java
    │   │       │   ├── OrderItemDTO.java
    │   │       │   ├── OrderStatusUpdateRequest.java
    │   │       │   └── SlaInfoDTO.java
    │   │       ├── entity/
    │   │       │   ├── Order.java
    │   │       │   ├── OrderItem.java
    │   │       │   └── OrderStatusLog.java
    │   │       ├── enums/
    │   │       │   ├── OrderStatus.java
    │   │       │   ├── PaymentStatus.java
    │   │       │   └── ChannelType.java
    │   │       ├── repository/
    │   │       │   ├── OrderRepository.java
    │   │       │   └── OrderStatusLogRepository.java
    │   │       ├── service/
    │   │       │   ├── OrderService.java
    │   │       │   ├── OrderServiceImpl.java
    │   │       │   ├── OrderLifecycleService.java
    │   │       │   └── SlaService.java
    │   │       ├── mapper/
    │   │       │   └── OrderMapper.java
    │   │       ├── grpc/
    │   │       │   ├── InventoryGrpcClient.java
    │   │       │   ├── PaymentGrpcClient.java
    │   │       │   └── ShippingGrpcClient.java
    │   │       ├── kafka/
    │   │       │   ├── OrderEventPublisher.java
    │   │       │   ├── MarketplaceOrderListener.java
    │   │       │   └── PaymentEventListener.java
    │   │       └── exception/
    │   │           ├── OrderNotFoundException.java
    │   │           ├── InvalidStatusTransitionException.java
    │   │           └── GlobalExceptionHandler.java
    │   └── resources/
    │       ├── application.yml
    │       └── db/migration/
    │           ├── V1__create_orders.sql
    │           ├── V2__create_order_items.sql
    │           └── V3__create_status_logs.sql
    └── test/
        └── java/
            └── vn/omnirevenue/order/
                ├── controller/
                │   └── OrderControllerTest.java
                └── service/
                    └── OrderLifecycleServiceTest.java
```

Port: `8082`. Database: `omni_orders`. gRPC client gọi inventory (`:9091`), payment (`:9092`), shipping (`:9093`).

### 2.7 Inventory Service

```
inventory-service/
├── pom.xml
├── Dockerfile
└── src/
    ├── main/
    │   ├── java/
    │   │   └── vn/omnirevenue/inventory/
    │   │       ├── InventoryServiceApplication.java
    │   │       ├── config/
    │   │       │   ├── KafkaConfig.java
    │   │       │   └── GrpcServerConfig.java
    │   │       ├── controller/
    │   │       │   ├── WarehouseController.java
    │   │       │   ├── StockController.java
    │   │       │   ├── SupplierController.java
    │   │       │   ├── PurchaseOrderController.java
    │   │       │   └── StockTransferController.java
    │   │       ├── dto/
    │   │       │   ├── WarehouseDTO.java
    │   │       │   ├── StockItemDTO.java
    │   │       │   ├── SupplierDTO.java
    │   │       │   ├── SupplierCreateRequest.java
    │   │       │   ├── PurchaseOrderDTO.java
    │   │       │   ├── PurchaseOrderItemDTO.java
    │   │       │   ├── StockTransferDTO.java
    │   │       │   └── StockAlertDTO.java
    │   │       ├── entity/
    │   │       │   ├── Warehouse.java
    │   │       │   ├── StockItem.java
    │   │       │   ├── StockMovement.java
    │   │       │   ├── Supplier.java
    │   │       │   ├── PurchaseOrder.java
    │   │       │   ├── PurchaseOrderItem.java
    │   │       │   └── StockTransfer.java
    │   │       ├── repository/
    │   │       │   ├── WarehouseRepository.java
    │   │       │   ├── StockItemRepository.java
    │   │       │   ├── StockMovementRepository.java
    │   │       │   ├── SupplierRepository.java
    │   │       │   ├── PurchaseOrderRepository.java
    │   │       │   └── StockTransferRepository.java
    │   │       ├── service/
    │   │       │   ├── WarehouseService.java
    │   │       │   ├── StockService.java
    │   │       │   ├── StockServiceImpl.java
    │   │       │   ├── SupplierService.java
    │   │       │   ├── PurchaseOrderService.java
    │   │       │   └── StockTransferService.java
    │   │       ├── mapper/
    │   │       │   ├── WarehouseMapper.java
    │   │       │   ├── StockMapper.java
    │   │       │   └── SupplierMapper.java
    │   │       ├── grpc/
    │   │       │   └── InventoryGrpcService.java
    │   │       ├── kafka/
    │   │       │   ├── InventoryEventPublisher.java
    │   │       │   └── OrderEventListener.java
    │   │       └── exception/
    │   │           ├── InsufficientStockException.java
    │   │           └── GlobalExceptionHandler.java
    │   └── resources/
    │       ├── application.yml
    │       └── db/migration/
    │           ├── V1__create_warehouses.sql
    │           ├── V2__create_stock_items.sql
    │           ├── V3__create_suppliers.sql
    │           ├── V4__create_purchase_orders.sql
    │           └── V5__create_stock_transfers.sql
    └── test/
        └── java/
            └── vn/omnirevenue/inventory/
                └── grpc/
                    └── InventoryGrpcServiceTest.java
```

Port: `8083` (REST), `9091` (gRPC). Database: `omni_inventory`.

### 2.8 Customer Service

```
customer-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/customer/
        │       ├── CustomerServiceApplication.java
        │       ├── controller/
        │       │   └── CustomerController.java
        │       ├── dto/
        │       │   ├── CustomerDTO.java
        │       │   ├── CustomerCreateRequest.java
        │       │   ├── AddressDTO.java
        │       │   ├── CustomerActivityDTO.java
        │       │   ├── SegmentDTO.java
        │       │   └── LoyaltyTierDTO.java
        │       ├── entity/
        │       │   ├── Customer.java
        │       │   ├── Address.java
        │       │   ├── CustomerActivity.java
        │       │   └── LoyaltyAccount.java
        │       ├── repository/
        │       │   ├── CustomerRepository.java
        │       │   └── ActivityRepository.java
        │       ├── service/
        │       │   ├── CustomerService.java
        │       │   ├── CustomerServiceImpl.java
        │       │   ├── SegmentService.java
        │       │   ├── LoyaltyService.java
        │       │   └── CustomerMergeService.java
        │       ├── grpc/
        │       │   └── LoyaltyGrpcService.java
        │       ├── kafka/
        │       │   ├── SegmentUpdateListener.java
        │       │   └── OrderCompletedListener.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                ├── V1__create_customers.sql
                ├── V2__create_addresses.sql
                ├── V3__create_activities.sql
                └── V4__create_loyalty.sql
```

Port: `8084`, `9094` (gRPC Loyalty). Database: `omni_customers`.

### 2.9 Payment Service

```
payment-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/payment/
        │       ├── PaymentServiceApplication.java
        │       ├── controller/
        │       │   └── PaymentController.java
        │       ├── dto/
        │       │   ├── PaymentInitRequest.java
        │       │   ├── PaymentCallbackDTO.java
        │       │   └── RefundRequest.java
        │       ├── entity/
        │       │   ├── PaymentTransaction.java
        │       │   └── RefundRecord.java
        │       ├── repository/
        │       │   ├── PaymentRepository.java
        │       │   └── RefundRepository.java
        │       ├── service/
        │       │   ├── PaymentService.java
        │       │   ├── PaymentServiceImpl.java
        │       │   └── RefundService.java
        │       ├── gateway/
        │       │   ├── VnPayGateway.java
        │       │   ├── MomoGateway.java
        │       │   └── ZaloPayGateway.java
        │       ├── grpc/
        │       │   └── PaymentGrpcService.java
        │       ├── kafka/
        │       │   ├── PaymentEventPublisher.java
        │       │   └── OrderEventListener.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                ├── V1__create_payments.sql
                └── V2__create_refunds.sql
```

Port: `8085`, `9092` (gRPC). Database: `omni_payments`.

### 2.10 Marketing Service

```
marketing-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/marketing/
        │       ├── MarketingServiceApplication.java
        │       ├── controller/
        │       │   ├── CampaignController.java
        │       │   └── VoucherController.java
        │       ├── dto/
        │       │   ├── CampaignDTO.java
        │       │   ├── CampaignCreateRequest.java
        │       │   ├── VoucherDTO.java
        │       │   └── VoucherCreateRequest.java
        │       ├── entity/
        │       │   ├── Campaign.java
        │       │   ├── Voucher.java
        │       │   └── VoucherUsage.java
        │       ├── repository/
        │       │   ├── CampaignRepository.java
        │       │   ├── VoucherRepository.java
        │       │   └── VoucherUsageRepository.java
        │       ├── service/
        │       │   ├── CampaignService.java
        │       │   ├── CampaignServiceImpl.java
        │       │   ├── VoucherService.java
        │       │   └── VoucherServiceImpl.java
        │       ├── automation/
        │       │   ├── WorkflowEngine.java
        │       │   ├── EmailSender.java
        │       │   ├── SmsSender.java
        │       │   └── ZaloZnsSender.java
        │       ├── kafka/
        │       │   ├── CampaignEventPublisher.java
        │       │   └── SegmentUpdateListener.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                ├── V1__create_campaigns.sql
                ├── V2__create_vouchers.sql
                └── V3__create_voucher_usage.sql
```

Port: `8086`. Database: `omni_marketing`.

### 2.11 Channel Service

```
channel-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/channel/
        │       ├── ChannelServiceApplication.java
        │       ├── controller/
        │       │   ├── ChannelController.java
        │       │   └── PipelineProxyController.java
        │       ├── dto/
        │       │   ├── SalesChannelDTO.java
        │       │   ├── DagRunDTO.java
        │       │   └── DagTaskDTO.java
        │       ├── entity/
        │       │   └── SalesChannel.java
        │       ├── repository/
        │       │   └── ChannelRepository.java
        │       ├── service/
        │       │   ├── ChannelService.java
        │       │   ├── ChannelServiceImpl.java
        │       │   └── AirflowProxyService.java
        │       ├── marketplace/
        │       │   ├── ShopeeConnector.java
        │       │   ├── LazadaConnector.java
        │       │   ├── TiktokConnector.java
        │       │   ├── TikiConnector.java
        │       │   └── FacebookConnector.java
        │       ├── kafka/
        │       │   ├── MarketplaceOrderPublisher.java
        │       │   └── InventoryUpdateListener.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                └── V1__create_channels.sql
```

Port: `8087`. Database: `omni_channels`. Proxy Airflow REST API (`http://airflow:8280/api/v1`) cho frontend.

### 2.12 Shipping Service

```
shipping-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/shipping/
        │       ├── ShippingServiceApplication.java
        │       ├── controller/
        │       │   └── ShippingController.java
        │       ├── dto/
        │       │   ├── ShipmentDTO.java
        │       │   └── TrackingDTO.java
        │       ├── entity/
        │       │   └── Shipment.java
        │       ├── repository/
        │       │   └── ShipmentRepository.java
        │       ├── service/
        │       │   ├── ShippingService.java
        │       │   └── ShippingServiceImpl.java
        │       ├── carrier/
        │       │   ├── GhtkCarrier.java
        │       │   ├── GhnCarrier.java
        │       │   └── ViettelPostCarrier.java
        │       ├── grpc/
        │       │   └── ShippingGrpcService.java
        │       ├── kafka/
        │       │   └── ShippingEventPublisher.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                └── V1__create_shipments.sql
```

Port: `8088`, `9093` (gRPC). Database: `omni_shipping`.

### 2.13 Notification Service

```
notification-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/notification/
        │       ├── NotificationServiceApplication.java
        │       ├── config/
        │       │   ├── WebSocketConfig.java
        │       │   └── RSocketConfig.java
        │       ├── controller/
        │       │   ├── NotificationController.java
        │       │   └── NotificationRSocketController.java
        │       ├── dto/
        │       │   └── NotificationDTO.java
        │       ├── entity/
        │       │   └── Notification.java
        │       ├── repository/
        │       │   └── NotificationRepository.java
        │       ├── service/
        │       │   ├── NotificationService.java
        │       │   └── NotificationServiceImpl.java
        │       ├── websocket/
        │       │   ├── WebSocketHandler.java
        │       │   └── WebSocketSessionManager.java
        │       ├── grpc/
        │       │   └── NotificationGrpcService.java
        │       ├── kafka/
        │       │   ├── OrderEventListener.java
        │       │   ├── InventoryAlertListener.java
        │       │   ├── FraudAlertListener.java
        │       │   └── CampaignEventListener.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                └── V1__create_notifications.sql
```

Port: `8089`, `9095` (gRPC), `7000` (RSocket). Database: `omni_notifications`. WebSocket endpoint: `/ws` — API Gateway forward trực tiếp tới đây cho frontend.

### 2.14 Staff Service

```
staff-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/staff/
        │       ├── StaffServiceApplication.java
        │       ├── controller/
        │       │   ├── AuthController.java
        │       │   ├── StaffController.java
        │       │   ├── ShiftController.java
        │       │   └── RangerProxyController.java
        │       ├── dto/
        │       │   ├── LoginRequest.java
        │       │   ├── LoginResponse.java
        │       │   ├── StaffDTO.java
        │       │   ├── StaffCreateRequest.java
        │       │   ├── RoleDTO.java
        │       │   ├── ShiftDTO.java
        │       │   └── RangerPolicyDTO.java
        │       ├── entity/
        │       │   ├── StaffMember.java
        │       │   ├── Role.java
        │       │   ├── Permission.java
        │       │   ├── Shift.java
        │       │   └── AuditLog.java
        │       ├── repository/
        │       │   ├── StaffRepository.java
        │       │   ├── RoleRepository.java
        │       │   ├── ShiftRepository.java
        │       │   └── AuditLogRepository.java
        │       ├── service/
        │       │   ├── AuthService.java
        │       │   ├── AuthServiceImpl.java
        │       │   ├── StaffService.java
        │       │   ├── StaffServiceImpl.java
        │       │   ├── ShiftService.java
        │       │   └── RangerProxyService.java
        │       ├── security/
        │       │   ├── JwtTokenProvider.java
        │       │   └── PasswordEncoder.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                ├── V1__create_staff.sql
                ├── V2__create_roles_permissions.sql
                ├── V3__create_shifts.sql
                └── V4__create_audit_logs.sql
```

Port: `8090`. Database: `omni_staff`. Xử lý `POST /auth/login` trả JWT token. Proxy Ranger Admin API.

### 2.15 Finance Service

```
finance-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/finance/
        │       ├── FinanceServiceApplication.java
        │       ├── controller/
        │       │   ├── TransactionController.java
        │       │   ├── ReconciliationController.java
        │       │   └── FinanceSummaryController.java
        │       ├── dto/
        │       │   ├── TransactionDTO.java
        │       │   ├── ReconciliationItemDTO.java
        │       │   ├── FinanceSummaryDTO.java
        │       │   └── MonthlyDataDTO.java
        │       ├── entity/
        │       │   ├── Transaction.java
        │       │   └── ReconciliationRecord.java
        │       ├── repository/
        │       │   ├── TransactionRepository.java
        │       │   └── ReconciliationRepository.java
        │       ├── service/
        │       │   ├── TransactionService.java
        │       │   ├── ReconciliationService.java
        │       │   └── FinanceSummaryService.java
        │       ├── kafka/
        │       │   ├── PaymentCompletedListener.java
        │       │   └── RefundListener.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── db/migration/
                ├── V1__create_transactions.sql
                └── V2__create_reconciliation.sql
```

Port: `8091`. Database: `omni_finance`.

### 2.16 Search Service

```
search-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/
        │   └── vn/omnirevenue/search/
        │       ├── SearchServiceApplication.java
        │       ├── config/
        │       │   └── ElasticsearchConfig.java
        │       ├── controller/
        │       │   ├── SearchController.java
        │       │   └── AtlasProxyController.java
        │       ├── dto/
        │       │   ├── SearchResultDTO.java
        │       │   ├── SearchAnalyticsDTO.java
        │       │   └── DataEntityDTO.java
        │       ├── document/
        │       │   ├── ProductDocument.java
        │       │   ├── OrderDocument.java
        │       │   └── CustomerDocument.java
        │       ├── repository/
        │       │   ├── ProductSearchRepository.java
        │       │   ├── OrderSearchRepository.java
        │       │   └── CustomerSearchRepository.java
        │       ├── service/
        │       │   ├── SearchService.java
        │       │   ├── SearchServiceImpl.java
        │       │   ├── SearchAnalyticsService.java
        │       │   └── AtlasProxyService.java
        │       ├── kafka/
        │       │   ├── ProductIndexListener.java
        │       │   ├── OrderIndexListener.java
        │       │   └── CustomerIndexListener.java
        │       └── exception/
        │           └── GlobalExceptionHandler.java
        └── resources/
            ├── application.yml
            └── elasticsearch/
                ├── product-mapping.json
                ├── order-mapping.json
                └── customer-mapping.json
```

Port: `8092`. Elasticsearch cluster: `http://elasticsearch:9200`. Proxy Atlas REST API (`http://atlas:21000/api/atlas`).

### 2.17 Spark Jobs

```
spark-jobs/
├── pom.xml
├── build.sbt
├── src/
│   └── main/
│       ├── scala/
│       │   └── vn/omnirevenue/spark/
│       │       ├── streaming/
│       │       │   ├── RealtimeRevenueAggregator.scala
│       │       │   ├── FraudDetector.scala
│       │       │   └── InventoryTracker.scala
│       │       ├── batch/
│       │       │   ├── RfmCalculator.scala
│       │       │   ├── AbcAnalysis.scala
│       │       │   ├── ChurnPredictor.scala
│       │       │   ├── RevenueReporter.scala
│       │       │   └── RecommendationTrainer.scala
│       │       └── common/
│       │           ├── KafkaReader.scala
│       │           ├── KafkaWriter.scala
│       │           └── SparkSessionFactory.scala
│       └── resources/
│           ├── application.conf
│           └── log4j.properties
└── scripts/
    ├── submit-streaming.sh
    └── submit-batch.sh
```

### 2.18 Airflow DAGs

```
airflow-dags/
├── dags/
│   ├── daily_rfm_calculation.py
│   ├── daily_abc_analysis.py
│   ├── hourly_revenue_report.py
│   ├── inventory_balance.py
│   ├── marketplace_sync.py
│   ├── expire_vouchers.py
│   ├── churn_prediction.py
│   └── recommendation_retrain.py
├── plugins/
│   ├── spark_submit_operator.py
│   └── kafka_sensor.py
└── config/
    └── connections.json
```

### 2.19 Protobuf Definitions

```
proto/
├── inventory.proto
├── payment.proto
├── shipping.proto
├── loyalty.proto
└── notification.proto
```

Chia sẻ giữa tất cả service dùng gRPC. Mỗi service chạy `protoc` generate Java stubs từ các file `.proto` này.

---

## 3. Bảng tổng hợp ports

| Service | REST Port | gRPC Port | Database |
|---|---|---|---|
| Service Registry (Eureka) | 8761 | — | — |
| Config Server | 8888 | — | — |
| API Gateway | 8080 | — | — |
| Product Service | 8081 | — | omni_products |
| Order Service | 8082 | — | omni_orders |
| Inventory Service | 8083 | 9091 | omni_inventory |
| Customer Service | 8084 | 9094 | omni_customers |
| Payment Service | 8085 | 9092 | omni_payments |
| Marketing Service | 8086 | — | omni_marketing |
| Channel Service | 8087 | — | omni_channels |
| Shipping Service | 8088 | 9093 | omni_shipping |
| Notification Service | 8089 | 9095 | omni_notifications |
| Staff Service | 8090 | — | omni_staff |
| Finance Service | 8091 | — | omni_finance |
| Search Service | 8092 | — | — (Elasticsearch) |

| Hạ tầng | Port |
|---|---|
| PostgreSQL | 5432 |
| Kafka | 9092 |
| Zookeeper | 2181 |
| Elasticsearch | 9200 |
| Redis | 6379 |
| Apache Atlas | 21000 |
| Apache Ranger | 6080 |
| Airflow Webserver | 8280 |
| Spark Master UI | 8180 |
| Prometheus | 9090 |
| Grafana | 3000 |

---

## 4. Kafka Topics

| Topic | Producer | Consumer |
|---|---|---|
| `orders.created` | order-service | inventory, notification, spark-streaming |
| `orders.confirmed` | order-service | inventory, payment, notification |
| `orders.shipped` | shipping-service | notification, customer |
| `orders.completed` | shipping-service | customer (loyalty), notification |
| `orders.cancelled` | order-service | inventory, payment, spark |
| `inventory.updated` | inventory-service | product, channel (marketplace sync), notification |
| `inventory.low_stock` | inventory-service | notification, inventory (auto PO) |
| `customers.segment_updated` | spark-batch | customer, marketing |
| `payments.initiated` | payment-service | spark-streaming (fraud), finance |
| `payments.completed` | payment-service | order, customer (loyalty), finance |
| `payments.refunded` | payment-service | order, inventory, finance |
| `campaigns.activated` | marketing-service | notification, product |
| `campaigns.flashsale.started` | airflow → marketing | product, notification |
| `marketplace.orders` | channel-service (webhook) | order-service |
| `fraud.alert` | spark-streaming | notification, payment |
| `analytics.rfm.results` | spark-batch | customer-service |

---

## 5. gRPC Service Methods

| Proto File | Service | Method | Server | Client |
|---|---|---|---|---|
| inventory.proto | InventoryService | `CheckStock` | inventory-service:9091 | order-service |
| inventory.proto | InventoryService | `ReserveStock` | inventory-service:9091 | order-service |
| inventory.proto | InventoryService | `ReleaseStock` | inventory-service:9091 | order-service |
| payment.proto | PaymentService | `InitiateRefund` | payment-service:9092 | order-service |
| payment.proto | PaymentService | `CheckPaymentStatus` | payment-service:9092 | order-service |
| shipping.proto | ShippingService | `CreateShipment` | shipping-service:9093 | order-service |
| shipping.proto | ShippingService | `GetTracking` | shipping-service:9093 | order-service |
| loyalty.proto | LoyaltyService | `AddPoints` | customer-service:9094 | order-service |
| loyalty.proto | LoyaltyService | `RedeemPoints` | customer-service:9094 | order-service |
| notification.proto | NotificationService | `SendAlert` | notification-service:9095 | any service |

---

## 6. Mỗi service chạy lệnh gì

```bash
# Hạ tầng (chạy trước)
docker-compose -f infra/docker/kafka/docker-compose.kafka.yml up -d
docker-compose -f infra/docker/elasticsearch/docker-compose.es.yml up -d
docker-compose -f infra/docker/postgres/docker-compose.postgres.yml up -d
docker-compose -f infra/docker/redis/docker-compose.redis.yml up -d

# Spring Boot services (mỗi service 1 terminal hoặc dùng docker-compose)
cd service-registry && mvn spring-boot:run
cd config-server && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run
cd product-service && mvn spring-boot:run
cd order-service && mvn spring-boot:run
cd inventory-service && mvn spring-boot:run
cd customer-service && mvn spring-boot:run
cd payment-service && mvn spring-boot:run
cd marketing-service && mvn spring-boot:run
cd channel-service && mvn spring-boot:run
cd shipping-service && mvn spring-boot:run
cd notification-service && mvn spring-boot:run
cd staff-service && mvn spring-boot:run
cd finance-service && mvn spring-boot:run
cd search-service && mvn spring-boot:run

# Hoặc tất cả bằng docker-compose
docker-compose up -d
```
