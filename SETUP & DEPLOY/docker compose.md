# DOCKER-COMPOSE.md · All-in-One Docker Configuration

File `docker-compose.yml` duy nhất chạy toàn bộ hạ tầng. Một lệnh `docker compose up -d` là đủ.

---

## Cách sử dụng

```bash
# Khởi động tất cả
docker compose up -d

# Xem logs
docker compose logs -f

# Xem trạng thái
docker compose ps

# Dừng tất cả
docker compose down

# Dừng và xóa data (reset hoàn toàn)
docker compose down -v
```

---

## docker-compose.yml

```yaml
version: '3.8'

services:

  # ══════════════════════════════════════════
  #  DATABASE
  # ══════════════════════════════════════════

  postgres:
    image: postgres:16-alpine
    container_name: omni-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: omni
      POSTGRES_PASSWORD: omni_secret
      POSTGRES_DB: omni_staff
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/docker/postgres/init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U omni"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: omni-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # ══════════════════════════════════════════
  #  KAFKA + ZOOKEEPER
  # ══════════════════════════════════════════

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    container_name: omni-zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zk_data:/var/lib/zookeeper/data
    healthcheck:
      test: ["CMD-SHELL", "echo ruok | nc localhost 2181 | grep imok"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: omni-kafka
    ports:
      - "9092:9092"
    depends_on:
      zookeeper:
        condition: service_healthy
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INTERNAL:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: INTERNAL://kafka:29092,EXTERNAL://localhost:9092
      KAFKA_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"
      KAFKA_LOG_RETENTION_HOURS: 168
    volumes:
      - kafka_data:/var/lib/kafka/data
    healthcheck:
      test: ["CMD-SHELL", "kafka-broker-api-versions --bootstrap-server localhost:9092"]
      interval: 15s
      timeout: 10s
      retries: 10
    restart: unless-stopped

  kafka-init:
    image: confluentinc/cp-kafka:7.6.0
    container_name: omni-kafka-init
    depends_on:
      kafka:
        condition: service_healthy
    entrypoint: ["/bin/sh", "-c"]
    command: |
      "
      echo 'Creating Kafka topics...' && sleep 5
      kafka-topics --create --if-not-exists --topic orders.created --partitions 6 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic orders.confirmed --partitions 6 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic orders.shipped --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic orders.completed --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic orders.cancelled --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic inventory.updated --partitions 6 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic inventory.low_stock --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic customers.segment_updated --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic payments.initiated --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic payments.completed --partitions 6 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic payments.refunded --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic campaigns.activated --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic campaigns.flashsale.started --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic marketplace.orders --partitions 6 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic fraud.alert --partitions 3 --replication-factor 1 --bootstrap-server kafka:29092
      kafka-topics --create --if-not-exists --topic analytics.rfm.results --partitions 1 --replication-factor 1 --bootstrap-server kafka:29092
      echo '16 topics created.'
      kafka-topics --list --bootstrap-server kafka:29092
      "
    restart: "no"

  # ══════════════════════════════════════════
  #  ELASTICSEARCH
  # ══════════════════════════════════════════

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    container_name: omni-elasticsearch
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - cluster.name=omni-cluster
    volumes:
      - es_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 10
    restart: unless-stopped

  # ══════════════════════════════════════════
  #  SPARK
  # ══════════════════════════════════════════

  spark-master:
    image: bitnami/spark:3.5
    container_name: omni-spark-master
    ports:
      - "8180:8080"
      - "7077:7077"
    environment:
      SPARK_MODE: master
      SPARK_MASTER_HOST: spark-master
    volumes:
      - ./spark-jobs:/opt/spark-jobs
    restart: unless-stopped

  spark-worker:
    image: bitnami/spark:3.5
    container_name: omni-spark-worker
    depends_on:
      - spark-master
    environment:
      SPARK_MODE: worker
      SPARK_MASTER_URL: spark://spark-master:7077
      SPARK_WORKER_MEMORY: 2G
      SPARK_WORKER_CORES: 2
    restart: unless-stopped

  # ══════════════════════════════════════════
  #  AIRFLOW
  # ══════════════════════════════════════════

  airflow:
    image: apache/airflow:2.8.1
    container_name: omni-airflow
    ports:
      - "8280:8080"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://omni:omni_secret@postgres:5432/omni_airflow
      AIRFLOW__CORE__LOAD_EXAMPLES: "false"
      AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: "false"
      AIRFLOW__WEBSERVER__EXPOSE_CONFIG: "true"
      _AIRFLOW_DB_MIGRATE: "true"
      _AIRFLOW_WWW_USER_CREATE: "true"
      _AIRFLOW_WWW_USER_USERNAME: admin
      _AIRFLOW_WWW_USER_PASSWORD: admin
    volumes:
      - ./airflow-dags/dags:/opt/airflow/dags
    restart: unless-stopped

  # ══════════════════════════════════════════
  #  ATLAS + RANGER
  # ══════════════════════════════════════════

  atlas:
    image: sburn/apache-atlas:2.3.0
    container_name: omni-atlas
    ports:
      - "21000:21000"
    volumes:
      - atlas_data:/opt/apache-atlas-2.3.0/data
    restart: unless-stopped

  ranger-admin:
    image: kadensungbincho/apache-ranger:2.4.0
    container_name: omni-ranger
    ports:
      - "6080:6080"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_NAME: omni_ranger
      DB_ROOT_USER: omni
      DB_ROOT_PASSWORD: omni_secret
    restart: unless-stopped

  # ══════════════════════════════════════════
  #  MONITORING
  # ══════════════════════════════════════════

  prometheus:
    image: prom/prometheus:v2.50.0
    container_name: omni-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./infra/docker/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:10.3.0
    container_name: omni-grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

# ══════════════════════════════════════════
#  VOLUMES
# ══════════════════════════════════════════

volumes:
  postgres_data:
  redis_data:
  zk_data:
  kafka_data:
  es_data:
  atlas_data:
  prometheus_data:
  grafana_data:
```

---

## init-databases.sql

File `infra/docker/postgres/init-databases.sql`:

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
CREATE DATABASE omni_finance;
CREATE DATABASE omni_airflow;
CREATE DATABASE omni_ranger;
```

---

## prometheus.yml

File `infra/docker/monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8080']

  - job_name: 'product-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8081']

  - job_name: 'order-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8082']

  - job_name: 'inventory-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8083']

  - job_name: 'customer-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8084']

  - job_name: 'payment-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8085']

  - job_name: 'marketing-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8086']

  - job_name: 'channel-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8087']

  - job_name: 'shipping-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8088']

  - job_name: 'notification-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8089']

  - job_name: 'staff-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8090']

  - job_name: 'finance-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8091']

  - job_name: 'search-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8092']
```

---

## Tài nguyên ước tính

| Container | RAM tối thiểu | RAM khuyến nghị |
|---|---|---|
| postgres | 256 MB | 512 MB |
| redis | 64 MB | 128 MB |
| zookeeper | 256 MB | 512 MB |
| kafka | 512 MB | 1 GB |
| elasticsearch | 512 MB | 1 GB |
| spark-master | 512 MB | 1 GB |
| spark-worker | 1 GB | 2 GB |
| airflow | 512 MB | 1 GB |
| atlas | 1 GB | 2 GB |
| ranger-admin | 512 MB | 1 GB |
| prometheus | 128 MB | 256 MB |
| grafana | 128 MB | 256 MB |
| **Tổng** | **~4.5 GB** | **~10 GB** |

Docker Desktop nên cấu hình ít nhất 8 GB RAM. Nếu máy chỉ có 16 GB RAM, có thể tắt bớt atlas + ranger + spark-worker khi không cần.

---

## Thứ tự khởi động và dependencies

```
postgres ─────────► kafka-init
    │                  │
    ├► redis           ├► (thoát sau khi tạo topics)
    │                  │
    ├► airflow         │
    │                  │
    ├► ranger-admin    │
    │                  │
zookeeper ──► kafka ──┘
                │
elasticsearch   spark-master ──► spark-worker
    │
atlas           prometheus ──► grafana
```

Sau khi `docker compose up -d`, chờ khoảng 60-90 giây để tất cả containers healthy, rồi mới chạy các Spring Boot services.

---

## Kiểm tra health

```bash
# Tất cả containers đang chạy
docker compose ps

# PostgreSQL
docker exec omni-postgres psql -U omni -l

# Kafka topics
docker exec omni-kafka kafka-topics --list --bootstrap-server localhost:9092

# Elasticsearch
curl http://localhost:9200/_cluster/health?pretty

# Redis
docker exec omni-redis redis-cli ping

# Airflow UI
# Mở http://localhost:8280 (admin / admin)

# Atlas UI
# Mở http://localhost:21000 (admin / admin)

# Ranger UI
# Mở http://localhost:6080 (admin / rangerR0cks!)

# Spark Master UI
# Mở http://localhost:8180

# Grafana UI
# Mở http://localhost:3000 (admin / admin)
```

---

## Profiles — chạy từng nhóm

Nếu không muốn chạy tất cả, dùng profiles:

```bash
# Chỉ database + kafka (đủ để dev backend)
docker compose up -d postgres redis zookeeper kafka kafka-init

# Thêm elasticsearch (cho search-service)
docker compose up -d elasticsearch

# Thêm monitoring
docker compose up -d prometheus grafana

# Thêm data platform (cho analytics)
docker compose up -d spark-master spark-worker airflow atlas ranger-admin
```

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| Elasticsearch `max virtual memory areas too low` | WSL2 cần tăng vm.max_map_count | `wsl -d docker-desktop sysctl -w vm.max_map_count=262144` |
| Kafka `kafka-init` liên tục restart | Kafka chưa healthy khi init chạy | Chờ kafka healthy rồi chạy lại `docker compose up -d kafka-init` |
| Atlas mất 3-5 phút để start | Atlas startup chậm (load Solr, HBase embedded) | Chờ đợi, kiểm tra log `docker logs omni-atlas -f` |
| Port conflict `5432` | PostgreSQL local đang chạy | Tắt PostgreSQL local hoặc đổi port `"5433:5432"` |
| `host.docker.internal` không resolve | Docker Desktop cũ | Update Docker Desktop, hoặc dùng `extra_hosts: ["host.docker.internal:host-gateway"]` |
| Tổng RAM vượt Docker limit | Quá nhiều containers | Tăng RAM trong Docker Desktop Settings → Resources |
