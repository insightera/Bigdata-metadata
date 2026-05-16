"""Align PySpark driver (Airflow) and executors (Spark workers) on the same Python minor version."""

import os


def apply_pyspark_python_configs(builder):
    """Spark workers (apache/spark image) use Python 3.10; driver must match."""
    py = os.environ.get("PYSPARK_PYTHON", "python3")
    driver_py = os.environ.get("PYSPARK_DRIVER_PYTHON", py)
    return (
        builder.config("spark.pyspark.python", py)
        .config("spark.pyspark.driver.python", driver_py)
        .config("spark.executorEnv.PYSPARK_PYTHON", py)
    )
