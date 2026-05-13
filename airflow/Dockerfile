FROM apache/airflow:2.9.1

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

USER airflow
RUN pip install --no-cache-dir pyspark==3.5.1 boto3
