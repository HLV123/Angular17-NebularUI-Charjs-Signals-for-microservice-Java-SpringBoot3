# OmniRevenue Platform · Cài đặt môi trường Windows

Hướng dẫn cài đặt tất cả công cụ cần thiết để chạy full project (frontend Angular + backend microservices + hạ tầng) trên Windows.

---

## 1. Tổng quan những gì cần cài

```
┌─────────────────────────────────────────────────────────────┐
│                        WINDOWS 10/11                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Frontend   │  │   Backend   │  │     Hạ tầng         │ │
│  │             │  │             │  │                     │ │
│  │ Node.js     │  │ JDK 17     │  │ Docker Desktop      │ │
│  │ Angular CLI │  │ Maven      │  │  ├ PostgreSQL        │ │
│  │             │  │ Protobuf   │  │  ├ Kafka + Zookeeper │ │
│  │             │  │            │  │  ├ Elasticsearch     │ │
│  │             │  │            │  │  ├ Redis             │ │
│  │             │  │            │  │  ├ Apache Atlas      │ │
│  │             │  │            │  │  ├ Apache Ranger     │ │
│  │             │  │            │  │  ├ Airflow           │ │
│  │             │  │            │  │  ├ Spark             │ │
│  │             │  │            │  │  ├ Prometheus        │ │
│  │             │  │            │  │  └ Grafana           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  IDE: Visual Studio Code + IntelliJ IDEA                    │
│  Terminal: Windows Terminal                                 │
│  Version Control: Git                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Yêu cầu phần cứng tối thiểu

| Thành phần | Tối thiểu | Khuyến nghị |
|---|---|---|
| RAM | 16 GB | 32 GB |
| CPU | 4 cores | 8 cores |
| Ổ cứng trống | 40 GB | 80 GB (SSD) |
| Windows | 10 version 2004+ | 11 |

RAM 16 GB là bắt buộc vì Docker Desktop chạy đồng thời Kafka, Elasticsearch, Spark, Airflow rất tốn bộ nhớ. Nếu chỉ có 16 GB nên tắt bớt service không dùng.

---

## 3. Cài đặt từng bước
### Angular CLI (cho Frontend)
Sau khi có Node.js:

```powershell
npm install -g @angular/cli@17
```

Kiểm tra:

```powershell
ng version
```

Kết quả: `Angular CLI: 17.x.x`

### JDK 17 (cho Backend Spring Boot)
Chạy installer. Nếu dùng Temurin, tick `Set JAVA_HOME` và `Add to PATH` trong installer.
Nếu cài thủ công, thêm biến môi trường:

```
System Variables:
  JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot

Path (thêm dòng):
  %JAVA_HOME%\bin
```
Kiểm tra:

```powershell
java -version
javac -version
```
Kết quả: `openjdk version "17.x.x"`
### Apache Maven (cho Backend build)
Tải: https://maven.apache.org/download.cgi — file `apache-maven-3.9.x-bin.zip`
Giải nén vào `C:\tools\apache-maven-3.9.x`
Thêm biến môi trường:

```
System Variables:
  MAVEN_HOME = C:\tools\apache-maven-3.9.x

Path (thêm dòng):
  %MAVEN_HOME%\bin
```

Kiểm tra:

```powershell
mvn -version
```
Kết quả: `Apache Maven 3.9.x` kèm `Java version: 17.x.x`
### Protocol Buffers Compiler (cho gRPC)
Tải: https://github.com/protocolbuffers/protobuf/releases — file `protoc-xx.x-win64.zip`
Giải nén vào `C:\tools\protoc`
Thêm vào Path:

```
Path (thêm dòng):
  C:\tools\protoc\bin
```
Kiểm tra:

```powershell
protoc --version
```
Kết quả: `libprotoc 2x.x`
### Docker Desktop (cho toàn bộ hạ tầng)
**Bước 1 — Bật WSL2**
Mở PowerShell (Run as Administrator):

```powershell
wsl --install
```
Khởi động lại máy. Sau khi restart:

```powershell
wsl --set-default-version 2
wsl --update
```
**Bước 2 — Cài Docker Desktop**
Tải: https://www.docker.com/products/docker-desktop/
Chạy installer → tick `Use WSL 2 instead of Hyper-V`. Khởi động lại máy.
Mở Docker Desktop, vào Settings:

```
Settings → Resources → WSL Integration → Enable cho distro mặc định
Settings → Resources → Advanced:
  CPUs: 4 (hoặc hơn)
  Memory: 8 GB (tối thiểu 6 GB, khuyến nghị 10 GB)
  Swap: 2 GB
  Disk image size: 60 GB
```
Kiểm tra:

```powershell
docker --version
docker compose version
```
Kết quả: `Docker version 2x.x.x` và `Docker Compose version v2.x.x`
**Bước 3 — Kiểm tra Docker chạy được**

```powershell
docker run hello-world
```
Thấy `Hello from Docker!` là thành công.

## 4. Kiểm tra tất cả đã cài xong
Mở Windows Terminal, chạy lần lượt:

```powershell
git --version
node --version
npm --version
ng version
java -version
mvn -version
protoc --version
docker --version
docker compose version
```

Tất cả phải trả về phiên bản, không lỗi `not recognized`. Nếu lệnh nào báo lỗi, kiểm tra lại biến Path.

---
## 5. Khởi động hạ tầng bằng Docker
Tạo file `docker-compose.yml` tại thư mục gốc backend hoặc chạy từng cụm:

```powershell
# Chạy tất cả hạ tầng một lần
docker compose up -d
```
Nếu muốn chạy từng phần:
### PostgreSQL + Redis

```yaml
# docker-compose.infra.yml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: omni
      POSTGRES_PASSWORD: omni_secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

File `init-databases.sql`:

```sql
CREATE DATABASE omni_products;
CREATE DATABASE omni_orders;
CREATE DATABASE omni_inventory;
CREATE DATABASE omni_customers;
CREATE DATABASE omni_payments;
CREATE DATABASE omni_marketing;
CREATE DATABASE omni_channels;
CREATE DATABASE omni_shipping;
CREATE DATABASE omni_notifications;
CREATE DATABASE omni_staff;
CREATE DATABASE omni_finance;
```

```powershell
docker compose -f docker-compose.infra.yml up -d
```

### Kafka + Zookeeper

```yaml
# docker-compose.kafka.yml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

```powershell
docker compose -f docker-compose.kafka.yml up -d
```
### Elasticsearch

```yaml
# docker-compose.es.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - es_data:/usr/share/elasticsearch/data

volumes:
  es_data:
```

```powershell
docker compose -f docker-compose.es.yml up -d
```
### Apache Spark

```yaml
# docker-compose.spark.yml
services:
  spark-master:
    image: bitnami/spark:3.5
    ports:
      - "8180:8080"
      - "7077:7077"
    environment:
      SPARK_MODE: master

  spark-worker:
    image: bitnami/spark:3.5
    depends_on:
      - spark-master
    environment:
      SPARK_MODE: worker
      SPARK_MASTER_URL: spark://spark-master:7077
      SPARK_WORKER_MEMORY: 2G
```

```powershell
docker compose -f docker-compose.spark.yml up -d
```

### Apache Airflow

```yaml
# docker-compose.airflow.yml
services:
  airflow:
    image: apache/airflow:2.8.1
    ports:
      - "8280:8080"
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://omni:omni_secret@postgres:5432/omni_airflow
      AIRFLOW__CORE__LOAD_EXAMPLES: "false"
      _AIRFLOW_DB_MIGRATE: "true"
      _AIRFLOW_WWW_USER_CREATE: "true"
      _AIRFLOW_WWW_USER_USERNAME: admin
      _AIRFLOW_WWW_USER_PASSWORD: admin
    volumes:
      - ./airflow-dags/dags:/opt/airflow/dags
    depends_on:
      - postgres
```

```powershell
docker compose -f docker-compose.airflow.yml up -d
```

### Apache Atlas

```yaml
# docker-compose.atlas.yml
services:
  atlas:
    image: sburn/apache-atlas:2.3.0
    ports:
      - "21000:21000"
    volumes:
      - atlas_data:/opt/apache-atlas-2.3.0/data

volumes:
  atlas_data:
```

Đăng nhập: `http://localhost:21000` — user `admin`, password `admin`.

```powershell
docker compose -f docker-compose.atlas.yml up -d
```

### Apache Ranger

```yaml
# docker-compose.ranger.yml
services:
  ranger-admin:
    image: kadensungbincho/apache-ranger:2.4.0
    ports:
      - "6080:6080"
    environment:
      DB_HOST: postgres
      DB_ROOT_USER: omni
      DB_ROOT_PASSWORD: omni_secret
    depends_on:
      - postgres
```

Đăng nhập: `http://localhost:6080` — user `admin`, password `rangerR0cks!`.

```powershell
docker compose -f docker-compose.ranger.yml up -d
```

### Monitoring (Prometheus + Grafana)

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:v2.50.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:10.3.0
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
```

Grafana: `http://localhost:3000` — user `admin`, password `admin`.

```powershell
docker compose -f docker-compose.monitoring.yml up -d
```

---
## Thứ tự khởi động toàn bộ hệ thống

```
Bước 1 — Hạ tầng (Docker)
    docker compose up -d
    Chờ 1-2 phút để tất cả container healthy

Bước 2 — Backend Spring Boot (mỗi service 1 terminal)
    Terminal 1:  cd service-registry && mvn spring-boot:run
    Terminal 2:  cd config-server && mvn spring-boot:run
                 (chờ registry và config sẵn sàng)
    Terminal 3:  cd api-gateway && mvn spring-boot:run
    Terminal 4:  cd product-service && mvn spring-boot:run
    Terminal 5:  cd order-service && mvn spring-boot:run
    Terminal 6:  cd inventory-service && mvn spring-boot:run
    Terminal 7:  cd customer-service && mvn spring-boot:run
    Terminal 8:  cd payment-service && mvn spring-boot:run
    Terminal 9:  cd marketing-service && mvn spring-boot:run
    Terminal 10: cd channel-service && mvn spring-boot:run
    Terminal 11: cd shipping-service && mvn spring-boot:run
    Terminal 12: cd notification-service && mvn spring-boot:run
    Terminal 13: cd staff-service && mvn spring-boot:run
    Terminal 14: cd finance-service && mvn spring-boot:run
    Terminal 15: cd search-service && mvn spring-boot:run

Bước 3 — Frontend Angular
    Terminal 16: cd frontend && npm install && ng serve

Bước 4 — Mở trình duyệt
    http://localhost:4200
```

---