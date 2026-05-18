# Template — Runtime Pipeline Medallion (BAB IV §4.1.1)

## Ringkasan eksekusi

| Item | Nilai |
|------|-------|
| Tanggal run | |
| DAG utama | `metadata_full_experiment` |
| Status keseluruhan | Berhasil / Gagal |

## Tabel runtime per tahap

| Tahap | Task Airflow | Durasi (s) | Status | Sumber JSON |
|-------|--------------|------------|--------|-------------|
| Staging → Bronze | staging_to_bronze | | | `staging_to_bronze_*.json` → `duration_sec` |
| Bronze → Silver | bronze_to_silver | | | `bronze_to_silver_*.json` |
| Silver → Gold | silver_to_gold | | | `silver_to_gold_*.json` |
| **Total** | | | | `experiment_summary_latest.json` → `pipeline_runtime_total_sec` |

## Verifikasi output

| Layer | Cek | Hasil |
|-------|-----|-------|
| Bronze | entitas `Bronze_Layer` di Atlas | |
| Silver | entitas `Silver_Layer` | |
| Gold | entitas `Gold_Layer` + star schema | |
| Portal | `/layers` menampilkan 4 layer | |

## Screenshot / lampiran

| No | File | Keterangan |
|----|------|------------|
| 1 | | Airflow graph `metadata_full_experiment` sukses |
