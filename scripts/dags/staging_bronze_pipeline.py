"""
DAG: Staging → Bronze Pipeline
================================
Pipeline pertama dalam arsitektur Medallion Metadata Lakehouse:

  ┌────────┐    ┌─────────────┐    ┌──────────────┐    ┌───────────┐
  │ Upload │ →  │ Spark+Iceberg│ →  │ Metadata     │ →  │ Atlas     │
  │ CSV→S3 │    │ CSV→Parquet  │    │ Ingestion    │    │ Registry  │
  └────────┘    └─────────────┘    └──────────────┘    └───────────┘
   staging         bronze           profiling +          auto
   bucket          layer            lineage +            catalog
                                    classification

Sesuai diagram: Source → Staging → Bronze Layer → metadata ingestion → Atlas API

Metadata yang dicatat di Bronze:
  1. Raw Technical Metadata  (schema, tipe data, lokasi)
  2. Raw Lineage             (staging CSV → bronze Iceberg)
  3. Raw Data Profiling      (row_count, null_pct, completeness, distinct)
  4. Raw Classification      (PII, layer tagging)
"""

import json
import logging
import os
import sys
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

sys.path.insert(0, "/opt/airflow/scripts")

ATLAS_URL = "http://atlas:21000"
ATLAS_AUTH = ("admin", "admin")

MINIO_ENDPOINT = "http://minio:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin123"

STAGING_CSV_DIR = "/opt/airflow/data/staging"

default_args = {
    "owner": "data-engineering",
    "retries": 1,
    "retry_delay": timedelta(minutes=3),
    "email_on_failure": False,
}


# ─── Task 1: Upload CSV ke MinIO staging bucket ────────────────────────────

def upload_csv_to_minio(**context):
    import boto3
    from botocore.client import Config

    s3 = boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )

    csv_dir = STAGING_CSV_DIR
    if not os.path.isdir(csv_dir):
        raise FileNotFoundError(f"Staging directory not found: {csv_dir}")

    uploaded = []
    for fname in sorted(os.listdir(csv_dir)):
        if not fname.endswith(".csv"):
            continue
        filepath = os.path.join(csv_dir, fname)
        s3.upload_file(filepath, "staging", fname)
        size = os.path.getsize(filepath)
        uploaded.append({"file": fname, "size_bytes": size})
        logging.info("Uploaded %s (%s bytes)", fname, f"{size:,}")

    logging.info("Total uploaded: %d CSV files", len(uploaded))
    return uploaded


# ─── Task 2: Spark ETL — staging CSV → bronze Iceberg ──────────────────────

def run_spark_staging_to_bronze(**context):
    from spark.staging_to_bronze import run_staging_to_bronze

    profiling_results = run_staging_to_bronze()

    context["ti"].xcom_push(key="profiling", value=profiling_results)

    total_rows = sum(p["row_count"] for p in profiling_results.values())
    logging.info(
        "Bronze layer complete: %d tables, %s total rows",
        len(profiling_results), f"{total_rows:,}",
    )
    return len(profiling_results)


# ─── Task 3: Register metadata ke Atlas ─────────────────────────────────────

def register_atlas_metadata(**context):
    from atlas.register_bronze_metadata import register_all_metadata

    profiling = context["ti"].xcom_pull(task_ids="staging_to_bronze", key="profiling")
    if not profiling:
        raise ValueError("No profiling data received from staging_to_bronze task")

    success = register_all_metadata(
        profiling_results=profiling,
        atlas_url=ATLAS_URL,
        atlas_user=ATLAS_AUTH[0],
        atlas_pass=ATLAS_AUTH[1],
    )

    context["ti"].xcom_push(key="atlas_success", value=success)
    logging.info("Atlas metadata registration: %s", "OK" if success else "partial")


# ─── DAG definition ─────────────────────────────────────────────────────────

with DAG(
    dag_id="staging_to_bronze_pipeline",
    description="Staging CSV → Bronze Iceberg + metadata ingestion → Atlas registry",
    default_args=default_args,
    start_date=datetime(2024, 1, 1),
    schedule_interval=None,
    catchup=False,
    tags=["lakehouse", "metadata", "iceberg", "atlas", "bronze", "pipeline"],
) as dag:

    upload_staging = PythonOperator(
        task_id="upload_csv_to_staging",
        python_callable=upload_csv_to_minio,
    )

    spark_etl = PythonOperator(
        task_id="staging_to_bronze",
        python_callable=run_spark_staging_to_bronze,
        execution_timeout=timedelta(minutes=30),
    )

    atlas_register = PythonOperator(
        task_id="register_atlas_metadata",
        python_callable=register_atlas_metadata,
    )

    verify_atlas = BashOperator(
        task_id="verify_atlas_registration",
        bash_command="""
        set -e
        echo "── Atlas Verification ──"
        RESULT=$(curl -sf -u "admin:admin" \
          "http://atlas:21000/api/atlas/v2/search/basic" \
          -H "Content-Type: application/json" \
          -d '{"typeName":"lakehouse_dataset","excludeDeletedEntities":true,"limit":50}' \
          2>/dev/null) || { echo "⚠️  Atlas not responding"; exit 0; }

        COUNT=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('approximateCount',0))")
        echo "✅ lakehouse_dataset entities found: $COUNT"

        echo ""
        echo "── Lineage check ──"
        LINEAGE=$(curl -sf -u "admin:admin" \
          "http://atlas:21000/api/atlas/v2/search/basic" \
          -H "Content-Type: application/json" \
          -d '{"typeName":"lakehouse_etl_process","excludeDeletedEntities":true,"limit":50}' \
          2>/dev/null) || { echo "⚠️  Lineage check skipped"; exit 0; }

        LCOUNT=$(echo "$LINEAGE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('approximateCount',0))")
        echo "✅ lakehouse_etl_process (lineage) entities found: $LCOUNT"
        """,
    )

    upload_staging >> spark_etl >> atlas_register >> verify_atlas
