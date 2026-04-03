# MarketFlow Atlas — Real-Time Crypto Analytics Platform

> A production-grade ETL pipeline that ingests live cryptocurrency data, processes it with Apache Spark, and displays real-time analytics on a beautiful dashboard.

---

## Dashboard Preview

```
+-------------------------------------------------------------+
|  MarketFlow Atlas                    * Pipeline Healthy      |
|  Real-time crypto analytics          Data Lag: 5 min        |
+-------------------------------------------------------------+
|  Coins: 18  |  Last Data: 10:09  |  Avg Volatility: 9.63   |
+-------------------------------------------------------------+
|  Live Ticker Board                                          |
|  BTC $66,809  |  ETH $2,059  |  SOL $79.85                 |
+-------------------------------------------------------------+
|  Price Chart (SMA · EMA)  |  Top Gainers & Losers          |
+-------------------------------------------------------------+
|  Price Alerts             |  Pipeline Health Status         |
+-------------------------------------------------------------+
|  Fear & Greed Index       |  My Portfolio                   |
+-------------------------------------------------------------+
```

---

## What This Project Does

This platform automatically:
1. Fetches live crypto prices every minute from CoinGecko API (18 coins)
2. Streams the data through Apache Kafka in real-time
3. Stores raw data as Parquet files in MinIO (S3-compatible storage)
4. Processes the data with Apache Spark — calculating SMA, EMA, volatility, OHLCV candles
5. Saves analytics results to PostgreSQL
6. Displays everything on a live React dashboard that refreshes every 15 seconds
7. Alerts you via email when any coin moves more than 2% in 5 minutes

---

## Architecture

```
+---------------------------------------------------------------------+
|                         DATA PIPELINE                               |
|                                                                     |
|  CoinGecko API                                                      |
|       |                                                             |
|       v  (every 1 min)                                              |
|  +-------------+    push     +---------+   stream   +-----------+  |
|  |   Airflow   | ----------> |  Kafka  | ---------> |  Spark    |  |
|  |  Producer   |             |  Topic  |            | Streaming |  |
|  |    DAG      |             +---------+            +-----+-----+  |
|  +-------------+                                         |         |
|                                                          v         |
|  +-------------+  trigger   +-----------+  write   +-----------+  |
|  |   Airflow   | ---------> |  Spark    | -------> |   MinIO   |  |
|  |  Analytics  |            | Analytics |          | (Parquet) |  |
|  |    DAG      |            +-----+-----+          +-----------+  |
|  +-------------+                  |                                |
|                                   v                                |
|                            +------------+                          |
|                            | PostgreSQL |                          |
|                            +-----+------+                          |
+----------------------------------|---------------------------------+
                                   |
                    +--------------v--------------+
                    |      FastAPI Backend         |
                    +--------------+--------------+
                                   |
                    +--------------v--------------+
                    |     React Dashboard          |
                    |    localhost:3000            |
                    +-----------------------------+
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Orchestration | Apache Airflow | Schedule and monitor all pipeline tasks |
| Streaming | Apache Kafka + Zookeeper | Real-time message queue for crypto prices |
| Processing | Apache Spark (PySpark) | Big data analytics — SMA, EMA, OHLCV |
| Storage | MinIO (S3-compatible) | Store raw Parquet files |
| Database | PostgreSQL | Store processed analytics results |
| Backend | FastAPI (Python) | REST API serving dashboard data |
| Frontend | React + Vite + Tailwind | Live crypto dashboard UI |
| DevOps | Docker + Docker Compose | Containerized deployment |
| Data Source | CoinGecko API | Live cryptocurrency market data |

---

## Project Structure

```
Karthika_ETL-crypto_currency/
|
+-- airflow/                       # Airflow Docker setup
|   +-- Dockerfile                 # Custom Airflow image with Kafka + psycopg2
|   +-- requirements.txt           # Python packages for DAGs
|
+-- dags/                          # Airflow DAG definitions
|   +-- crypto_producer_dag.py     # Fetches prices, validates, pushes to Kafka (every 1 min)
|   +-- crypto_analytics_dag.py    # Triggers Spark analytics job (every 5 min)
|
+-- spark-jobs/                    # PySpark processing scripts
|   +-- kafka_to_minio.py          # Streams Kafka, saves Parquet to MinIO (continuous)
|   +-- analytics.py               # Reads Parquet, calculates metrics, writes to PostgreSQL
|   +-- submit_analytics.sh        # Shell script to submit Spark job
|
+-- dashboard/
|   +-- api/                       # FastAPI backend
|   |   +-- main.py                # All REST API endpoints
|   |   +-- Dockerfile
|   |   +-- requirements.txt
|   +-- ui/                        # React frontend
|       +-- src/
|       |   +-- App.jsx            # Main app, fetches all data, manages state
|       |   +-- components/
|       |       +-- CoinGrid.jsx       # Live ticker board (18 coins)
|       |       +-- PriceChart.jsx     # SMA/EMA price chart
|       |       +-- TopMovers.jsx      # Top 5 gainers and losers
|       |       +-- AlertsFeed.jsx     # Price alert notifications
|       |       +-- PipelineStatus.jsx # Airflow task health monitor
|       |       +-- FearGreed.jsx      # Fear and Greed Index gauge
|       |       +-- Portfolio.jsx      # Personal crypto portfolio tracker
|       +-- Dockerfile
|       +-- nginx.conf
|
+-- postgres/
|   +-- init.sql                   # Database schema (auto-runs on first start)
|
+-- docker-compose.yml             # All 15 services defined here
+-- .env                           # All credentials and config
+-- README.md
```

---

## Database Schema

```sql
crypto_table        -- Latest price, SMA, EMA, volatility per coin
ohlcv_1min          -- 1-minute OHLCV candles for charting
top_5_gainers       -- Top 5 coins by 5-min price change
top_5_losers        -- Bottom 5 coins by 5-min price change
price_alerts        -- Triggered when coin moves more than 2% in 5 min
pipeline_metrics    -- Airflow task logs (latency, records pushed)
dead_letter_queue   -- Failed or invalid records for debugging
```

---

## Dashboard Features

| Feature | Description |
|---|---|
| Live Ticker Board | All 18 coins with 1-min and 5-min price changes |
| Price Chart | Click any coin to see SMA, EMA chart |
| Top Movers | Real-time top 5 gainers and losers |
| Price Alerts | Automatic alerts on moves greater than 2% in 5 minutes |
| Pipeline Health | Live Airflow task status with latency metrics |
| Fear and Greed Index | Market sentiment gauge (0 to 100) from Alternative.me |
| Portfolio Tracker | Enter your holdings, see real-time total value |

---

## How to Run

### Prerequisites
- Docker Desktop installed
- Internet connection (for CoinGecko API)
- 8GB or more RAM recommended

### Step 1 — Clone the repo
```bash
git clone https://github.com/karthika20082005-design/Karthika_ETL-crypto_currency.git
cd Karthika_ETL-crypto_currency
```

### Step 2 — Set up environment variables
Copy `.env` and fill in your values:

```env
API_KEY=your_coingecko_api_key
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=crypto_metrics
AIRFLOW_ADMIN_USER=admin
AIRFLOW_ADMIN_PASSWORD=admin
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

Get a free CoinGecko API key at https://www.coingecko.com/en/api

### Step 3 — Start all services
```bash
docker compose up -d postgres
docker compose up -d airflow-init
# Wait for: "User admin created with role Admin"
docker compose up -d
```

### Step 4 — Create Kafka topic
```bash
docker exec kafka kafka-topics --create \
  --topic crypto-prices \
  --bootstrap-server kafka:9092 \
  --partitions 1 \
  --replication-factor 1
```

### Step 5 — Enable Airflow DAGs
1. Open http://localhost:8081
2. Login with admin / admin
3. Enable and trigger Crypto_Producer DAG
4. Enable crypto_analytics DAG

### Step 6 — Open the dashboard
http://localhost:3000 — data appears within 5 to 10 minutes

---

## Service URLs

| Service | URL | Credentials |
|---|---|---|
| Dashboard | http://localhost:3000 | — |
| Airflow UI | http://localhost:8081 | admin / admin |
| Dashboard API Docs | http://localhost:8000/docs | — |
| MinIO Console | http://localhost:9011 | minioadmin / minioadmin |
| Spark Master UI | http://localhost:8090 | — |

---

## API Endpoints

| Endpoint | Description |
|---|---|
| GET /api/coins/latest | Latest price for all 18 coins |
| GET /api/gainers | Top 5 gainers by 5-min change |
| GET /api/losers | Top 5 losers by 5-min change |
| GET /api/alerts | Triggered price alerts |
| GET /api/pipeline | Airflow pipeline health status |
| GET /api/stats | Overall market statistics |
| GET /api/coins/{id}/summary | Chart data for a specific coin |
| GET /api/anomalies | Unusual price movements (z-score) |
| GET /api/health | API and database health check |

---

## Analytics Calculated by Spark

For each coin, Apache Spark calculates:

- SMA (Simple Moving Average) — average price over last 5 records
- EMA (Exponential Moving Average) — weighted average over last 3 records
- Volatility — standard deviation of price over last 5 records
- 1-min change % — price change from 1 minute ago
- 5-min change % — price change from 5 minutes ago
- OHLCV Candles — Open, High, Low, Close per 1-minute bucket
- Price Alerts — triggered when change exceeds threshold (default 2%)

---

## Data Flow Timeline

```
T+0:00  Airflow Crypto_Producer triggers
T+0:05  CoinGecko API called — 18 coin prices fetched
T+0:10  Prices pushed to Kafka topic (crypto-prices)
T+0:40  Second fetch pushed to Kafka (30s gap for more data points)
T+1:00  Spark Streaming reads Kafka, writes Parquet to MinIO
T+5:00  Airflow crypto_analytics triggers
T+5:10  Spark reads Parquet from MinIO
T+5:30  SMA, EMA, OHLCV, alerts calculated
T+5:45  Results written to PostgreSQL
T+6:00  Dashboard fetches fresh data, UI updates
```

---

## Troubleshooting

**Dashboard shows no data**
- Check Airflow DAGs are running at http://localhost:8081
- Verify Kafka topic exists: `docker exec kafka kafka-topics --list --bootstrap-server kafka:9092`

**Airflow webserver not loading**
- Port 8080 may be in use. Change to 8081 in docker-compose.yml under airflow-webserver ports

**Spark analytics failing**
- Check MinIO bucket exists: `docker exec minio mc ls local/`
- Create if missing: `docker exec minio mc mb local/crypto-data`

**High memory usage or laptop hanging**
- Stop unused containers: `docker compose stop spark-worker-2`
- Ensure Docker Desktop has at least 6GB RAM allocated

---

## What This Project Demonstrates

This project showcases a complete modern data engineering stack used in production by fintech companies:

- Real-time data ingestion with Kafka
- Pipeline orchestration with Airflow (DAGs, retries, SLA monitoring, email alerts)
- Big data processing with PySpark (streaming and batch)
- Cloud-native storage with MinIO/S3 (Parquet format)
- Relational database design with PostgreSQL (indexes, upserts, data retention)
- REST API development with FastAPI
- Modern frontend with React, Vite, and Tailwind CSS
- Containerized deployment with Docker Compose
- Data quality checks (dead letter queue, field validation)
- Monitoring and alerting (pipeline metrics, email on failure)

---

## Built By

Karthika — Infosys Springboard Virtual Internship 6.0 Project, 2026
