# Benchmark & Metrik Otomatis Metadata (End-to-End)

Skrip pengukuran eksperimen metadata: pipeline Medallion, registrasi Atlas, UMT, kualitas metadata, dan agregasi laporan.

## Struktur

| Skrip | Fungsi | Output |
|-------|--------|--------|
| [`dataset_summary.py`](dataset_summary.py) | Statistik CSV staging | `metrics/dataset_summary_*.json` |
| [`atlas_quality.py`](atlas_quality.py) | Kualitas metadata per layer | `metrics/metadata_quality_*.json` |
| [`atlas_inventory.py`](atlas_inventory.py) | Coverage + lineage | `metrics/atlas_inventory_*.json` |
| [`collect_umt.py`](collect_umt.py) | Snapshot UMT | `metrics/umt_*.json` |
| [`aggregate_results.py`](aggregate_results.py) | Ringkasan eksperimen | `metrics/experiment_summary_*.json` |
| [`run_experiment.py`](run_experiment.py) | Orkestrator lengkap | Semua file di atas |

Pipeline Spark juga menulis metrik otomatis:

- `staging_to_bronze_*.json`
- `bronze_to_silver_*.json`
- `silver_to_gold_*.json`

## Jalankan eksperimen penuh

### Opsi A — Airflow DAG (disarankan di Docker)

```bash
python3 scripts/generate_bronze_data.py --mode full
./start.sh
docker exec lhmeta-airflow-scheduler airflow dags trigger metadata_full_experiment
```

Pantau: http://localhost:18681 → DAG `metadata_full_experiment`

### Opsi B — Skrip lokal

```bash
export PYTHONPATH=scripts META_METRICS_DIR=metrics
python3 scripts/benchmark/run_experiment.py --mode local
```

### Opsi C — Langkah per langkah

```bash
export PYTHONPATH=scripts META_METRICS_DIR=metrics

python3 scripts/benchmark/dataset_summary.py --staging-dir data/staging
# ... pipeline via Airflow atau run_experiment ...

python3 scripts/benchmark/atlas_quality.py --write
python3 scripts/benchmark/atlas_inventory.py --write
python3 scripts/benchmark/collect_umt.py --write
python3 scripts/benchmark/aggregate_results.py --write-latest
```

## Pemetaan laporan (BAB IV)

| Output JSON | Subbab README utama |
|-------------|---------------------|
| `dataset_summary_*.json` | Metodologi §3 — dataset |
| `staging_to_bronze_*.json`, dll. | §4.1.1 runtime pipeline |
| `metadata_quality_*.json` | §4.1.6 kualitas metadata |
| `atlas_inventory_*.json` | §4.1.3 lineage, §4.1.6 coverage |
| `umt_*.json` | §4.1.4 UMT |
| `experiment_summary_latest.json` | Ringkasan seluruh eksperimen |

Panduan metodologi: [`../../docs/eksperimen/README.md`](../../docs/eksperimen/README.md)
