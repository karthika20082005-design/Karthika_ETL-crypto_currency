"""
Crypto Producer DAG — Full Pipeline
=====================================
- Fetches crypto prices from CoinGecko every ~30 seconds (2 fetches per 1-min DAG run)
- Validates API response (data quality checks)
- Checks Kafka health before pushing
- Pushes to Kafka with dead letter handling for failed records
- Verifies data landed in Kafka
- Logs all metrics to PostgreSQL (run count, records pushed, latency)
- Email alerts on failure/retry
- SLA monitoring (alerts if task exceeds expected duration)
- All credentials read from environment variables
"""


import os
from datetime import datetime, timedelta
import json
import time
import logging


import requests
import psycopg2
from kafka import KafkaProducer, KafkaConsumer, KafkaAdminClient
from kafka.errors import KafkaError


from airflow import DAG
from airflow.operators.python import PythonOperator


# ════════════════════════════════════════════
# Configuration — all from environment
# ════════════════════════════════════════════


KAFKA_BROKER = "kafka:9092"
KAFKA_TOPIC = "crypto-prices"


POSTGRES_CONN = {
   "host": os.getenv("POSTGRES_HOST", "postgres"),
   "port": int(os.getenv("POSTGRES_PORT", 5432)),
   "dbname": os.getenv("POSTGRES_DB"),
   "user": os.getenv("POSTGRES_USER"),
   "password": os.getenv("POSTGRES_PASSWORD"),
}


API_KEY = os.getenv("API_KEY")
ALERT_EMAIL = os.getenv("ALERT_EMAIL")


COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets"
PARAMS = {
   "vs_currency": "usd",
   "ids": ",".join([
       "bitcoin", "ethereum", "solana", "cardano", "ripple",
       "dogecoin", "polkadot", "binancecoin", "avalanche", "chainlink",
       "polygon", "cosmos", "uniswap", "litecoin", "stellar",
       "vechain", "shiba-inu", "tron", "tezos", "neo",
   ]),
   "order": "market_cap_desc",
   "per_page": 20,
   "page": 1,
   "sparkline": "false",
   "price_change_percentage": "24h",
}


DESIRED_KEYS = [
   "id", "symbol", "current_price", "market_cap",
   "total_volume", "high_24h", "low_24h", "last_updated",
]


EXPECTED_COIN_COUNT = 20


logger = logging.getLogger(__name__)




# ════════════════════════════════════════════
# Helper: Log metrics to PostgreSQL
# ════════════════════════════════════════════


def log_metric(run_id, task, status, records_pushed=0, latency_ms=0, error_message=None):
   try:
       conn = psycopg2.connect(**POSTGRES_CONN)
       cur = conn.cursor()
       cur.execute(
           """
           INSERT INTO pipeline_metrics (run_id, task, status, records_pushed, latency_ms, error_message)
           VALUES (%s, %s, %s, %s, %s, %s)
           """,
           (run_id, task, status, records_pushed, latency_ms, error_message),
       )
       conn.commit()
       cur.close()
       conn.close()
   except Exception as e:
       logger.error(f"Failed to log metric: {e}")




def log_dead_letter(run_id, payload, error_message):
   try:
       conn = psycopg2.connect(**POSTGRES_CONN)
       cur = conn.cursor()
       cur.execute(
           """
           INSERT INTO dead_letter_queue (run_id, payload, error_message)
           VALUES (%s, %s, %s)
           """,
           (run_id, json.dumps(payload) if payload else None, error_message),
       )
       conn.commit()
       cur.close()
       conn.close()
   except Exception as e:
       logger.error(f"Failed to log dead letter: {e}")




# ════════════════════════════════════════════
# Callback functions
# ════════════════════════════════════════════


def on_failure_callback(context):
   task_id = context["task_instance"].task_id
   dag_id = context["task_instance"].dag_id
   exec_date = context["execution_date"]
   error = context.get("exception", "Unknown error")
   logger.error(f"TASK FAILED: {dag_id}.{task_id} at {exec_date} — {error}")




def on_success_callback(context):
   dag_id = context["task_instance"].dag_id
   exec_date = context["execution_date"]
   logger.info(f"DAG SUCCESS: {dag_id} at {exec_date}")




def on_retry_callback(context):
   task_id = context["task_instance"].task_id
   try_number = context["task_instance"].try_number
   logger.warning(f"TASK RETRY: {task_id} — attempt {try_number}")




def sla_miss_callback(dag, task_list, blocking_task_list, slas, blocking_tis):
   missed = [str(t) for t in task_list]
   logger.error(f"SLA MISS: tasks {missed} exceeded their expected duration")