# Desain Big Data Pipeline ITERA — Medallion Architecture
## Insightera V.1.0 — Kasus: Dashboard IKU Pimpinan ITERA

---

## 1. Gambaran Arsitektur

Pipeline ini mengikuti skema **Medallion (Bronze → Silver → Gold)** yang dipetakan ke **Data Lake Station 1 → Station 2 → Station 3 → Station 4 → Data Warehousing**, sesuai diagram Insightera V.1.0.

```
[Sumber Data] → Portal → Station 1 (Bronze/Raw)
                          ↓ Quality Check (Metric)
                          Station 2 (Silver/Cleaned)
                          ↓ ETL 1 → Columnar Processing
                          Station 3 (Gold/Aggregated)
                          ↓ ETL 2
                          Station 4 (Serving) → Data Warehousing
                                                  ↓
                                          Dashboard Pimpinan (IKU)
```

---

## 2. Sumber Data (Raw Layer — Station 1)

Semua tabel sumber disimpan dalam format **CSV** (simulasi streaming/batch dari sistem akademik ITERA).

### 2.1 Domain Data

| No | Domain | Sistem Sumber | Format |
|----|--------|--------------|--------|
| 1 | Mahasiswa & Akademik | SIAK / PDDikti | CSV |
| 2 | Dosen & Kepegawaian | SIMPEG | CSV |
| 3 | Penelitian & PkM | SIPPMA / LPPM | CSV |
| 4 | Kerjasama & MBKM | SIM Kerjasama | CSV |
| 5 | Keuangan & Anggaran | SIM Keuangan | CSV |
| 6 | Akreditasi & Mutu | BAN-PT / LP3M | CSV |
| 7 | Sarana & Prasarana | SIMPER | CSV |

---

## 3. Desain Tabel per Layer

---

### LAYER BRONZE — Station 1 (Raw Data)

#### 3.1 `raw_mahasiswa`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| mahasiswa_id | STRING | NIM mahasiswa |
| nama | STRING | Nama lengkap |
| prodi_id | STRING | Kode program studi |
| jurusan_id | STRING | Kode jurusan |
| angkatan | INT | Tahun masuk |
| jalur_masuk | STRING | SNBP / SNBT / Mandiri |
| jenis_kelamin | STRING | L / P |
| asal_provinsi | STRING | Provinsi asal |
| status_aktif | STRING | Aktif / Cuti / DO |
| ipk_terakhir | FLOAT | IPK kumulatif |
| total_sks | INT | SKS yang sudah ditempuh |
| sks_luar_kampus | INT | SKS MBKM di luar kampus |
| tanggal_masuk | DATE | Tanggal registrasi pertama |
| ingested_at | TIMESTAMP | Waktu data masuk pipeline |

#### 3.2 `raw_lulusan`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| lulusan_id | STRING | ID unik lulusan |
| mahasiswa_id | STRING | FK ke mahasiswa |
| prodi_id | STRING | Kode prodi |
| tanggal_lulus | DATE | Tanggal wisuda |
| ipk | FLOAT | IPK akhir |
| lama_studi_bulan | INT | Durasi studi dalam bulan |
| status_pasca_lulus | STRING | Bekerja/Studi/Wirausaha/Belum |
| nama_perusahaan | STRING | Tempat kerja (jika ada) |
| bidang_kerja | STRING | Sesuai prodi / Tidak |
| masa_tunggu_bulan | INT | Bulan sampai dapat kerja pertama |
| sumber_data | STRING | Tracer Study / Laporan Wisuda |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.3 `raw_dosen`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| dosen_id | STRING | NIDN / NIDK |
| nama | STRING | Nama dosen |
| prodi_id | STRING | Prodi home base |
| jurusan_id | STRING | Jurusan |
| jenis_kelamin | STRING | L / P |
| status_asn | STRING | PNS / PPPK / Non-ASN |
| pendidikan_terakhir | STRING | S2 / S3 |
| jabatan_fungsional | STRING | Tenaga Pengajar / Asisten Ahli / Lektor / dst |
| sedang_tugas_belajar | BOOLEAN | True/False |
| sertifikat_dosen | BOOLEAN | True/False |
| berasal_praktisi | BOOLEAN | True/False |
| tahun_bergabung | INT | Tahun rekrut |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.4 `raw_kegiatan_dosen`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| kegiatan_id | STRING | ID unik kegiatan |
| dosen_id | STRING | FK ke dosen |
| jenis_kegiatan | STRING | Tridarma_PT_Lain / Praktisi_Industri / Pembina_Prestasi / QS100 |
| nama_institusi | STRING | Nama PT/Industri mitra |
| tanggal_mulai | DATE | Mulai kegiatan |
| tanggal_selesai | DATE | Selesai kegiatan |
| tahun | INT | Tahun pelaksanaan |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.5 `raw_penelitian`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| penelitian_id | STRING | ID penelitian |
| judul | STRING | Judul penelitian |
| dosen_id | STRING | Ketua peneliti (FK) |
| jurusan_id | STRING | Jurusan |
| tahun | INT | Tahun pelaksanaan |
| skema | STRING | Mandiri / Dana ITERA / Hibah Dikti / Industri |
| dana | BIGINT | Nominal dana (Rp) |
| topik | STRING | Sustainable Energy / Innovative Industry / Green Infrastructure / Community Dev |
| status_publikasi | STRING | Belum / Jurnal Nasional / Jurnal Internasional |
| rekognisi_internasional | BOOLEAN | True/False |
| diterapkan_masyarakat | BOOLEAN | True/False |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.6 `raw_pengabdian`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| pkm_id | STRING | ID PkM |
| judul | STRING | Judul pengabdian |
| dosen_id | STRING | Ketua (FK) |
| jurusan_id | STRING | Jurusan |
| tahun | INT | Tahun |
| dana | BIGINT | Nominal dana (Rp) |
| lokasi | STRING | Kabupaten/Kota |
| rekognisi_internasional | BOOLEAN | True/False |
| diterapkan_masyarakat | BOOLEAN | True/False |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.7 `raw_kerjasama`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| kerjasama_id | STRING | ID MoU/PKS |
| jenis | STRING | MoU / PKS |
| mitra | STRING | Nama institusi mitra |
| kategori_mitra | STRING | PT_DN / PT_LN / Industri / Pemerintah / Litbang |
| lingkup | STRING | Pendidikan / Penelitian / PkM / MBKM / Semua |
| prodi_id | STRING | Prodi terkait (FK, nullable) |
| tanggal_mulai | DATE | Efektif dari |
| tanggal_berakhir | DATE | Berakhir |
| status | STRING | Aktif / Tidak Aktif |
| tahun | INT | Tahun penandatanganan |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.8 `raw_mbkm`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| mbkm_id | STRING | ID kegiatan MBKM |
| mahasiswa_id | STRING | FK mahasiswa |
| prodi_id | STRING | Prodi asal |
| jenis_mbkm | STRING | Magang / KKN Tematik / Riset / Pertukaran / Wirausaha / Proyek Kemanusiaan |
| institusi_mitra | STRING | Nama mitra |
| sks_diakui | INT | SKS yang diakui |
| tahun | INT | Tahun pelaksanaan |
| semester | STRING | Ganjil / Genap |
| prestasi_nasional | BOOLEAN | True/False (jika kompetisi) |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.9 `raw_akreditasi`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| akreditasi_id | STRING | ID akreditasi |
| prodi_id | STRING | FK prodi |
| lembaga | STRING | BAN-PT / LAM / Internasional |
| nama_lembaga_detail | STRING | Nama spesifik |
| predikat | STRING | Baik / Baik Sekali / Unggul / A / B / Internasional |
| tanggal_sk | DATE | Tanggal SK |
| tanggal_berakhir | DATE | Masa berlaku |
| tahun | INT | Tahun akreditasi |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.10 `raw_prodi`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| prodi_id | STRING | Kode prodi |
| nama_prodi | STRING | Nama program studi |
| jenjang | STRING | S1 / S2 / D3 |
| jurusan_id | STRING | FK jurusan |
| tahun_berdiri | INT | Tahun SK pendirian |
| status | STRING | Aktif / Proses |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.11 `raw_keuangan`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| anggaran_id | STRING | ID anggaran |
| tahun | INT | Tahun anggaran |
| sumber_dana | STRING | PNBP / APBN / SBSN / Hibah |
| komponen | STRING | Gaji / Operasional / Penelitian / Investasi / PkM |
| pagu | BIGINT | Pagu anggaran (Rp) |
| realisasi | BIGINT | Realisasi (Rp) |
| triwulan | INT | 1 / 2 / 3 / 4 |
| ingested_at | TIMESTAMP | Waktu data masuk |

#### 3.12 `raw_prestasi_mahasiswa`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| prestasi_id | STRING | ID prestasi |
| mahasiswa_id | STRING | FK mahasiswa |
| nama_kompetisi | STRING | Nama lomba/kompetisi |
| bidang | STRING | Riset / Olahraga / Seni / Teknologi / dst |
| tingkat | STRING | Institusi / Regional / Nasional / Internasional |
| peringkat | STRING | Juara 1 / 2 / 3 / Finalis |
| tahun | INT | Tahun |
| dosen_pembina_id | STRING | FK dosen (nullable) |
| ingested_at | TIMESTAMP | Waktu data masuk |

---

### LAYER SILVER — Station 2 (Cleaned & Validated)

> Data dari Station 1 yang telah lulus quality check (metric ≥ 60%), dilakukan standarisasi, dedup, dan enrichment.

#### Tabel Silver (transformasi dari Bronze):
- `silver_mahasiswa` — Enriched dengan nama_prodi, nama_jurusan, flag is_mbkm (sks_luar_kampus ≥ 20)
- `silver_lulusan` — Enriched dengan flag is_employed, is_lanjut_studi, is_wirausaha
- `silver_dosen` — Enriched dengan flag is_s3, is_praktisi, is_serdos, is_aktif_tridarma
- `silver_penelitian_pkm` — Join penelitian + pengabdian, dengan flag is_rekognisi
- `silver_kerjasama_aktif` — Filter kerjasama aktif saja + kategori MBKM
- `silver_akreditasi_aktif` — Akreditasi terakhir per prodi yang masih berlaku

---

### LAYER GOLD — Station 3 (Aggregated — IKU Dashboard)

> Tabel fakta dan dimensi untuk **Data Warehousing** yang menjadi sumber **Dashboard Pimpinan**.

---

#### 3A. DIMENSI

##### `dim_waktu`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| waktu_id | INT | Surrogate key |
| tahun | INT | Tahun |
| semester | STRING | Ganjil / Genap |
| triwulan | INT | 1–4 |
| bulan | INT | 1–12 |
| nama_bulan | STRING | Januari–Desember |

##### `dim_prodi`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| prodi_id | STRING | NK dari raw |
| nama_prodi | STRING | Nama prodi |
| jenjang | STRING | S1/S2/D3 |
| nama_jurusan | STRING | JTIK / JSains / JTPI |
| nama_fakultas | STRING | Fakultas (rencana) |
| tahun_berdiri | INT | Tahun SK |
| status | STRING | Aktif/Proses |

##### `dim_dosen`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| dosen_id | STRING | NIDN/NIDK |
| nama | STRING | |
| prodi_id | STRING | FK |
| status_asn | STRING | PNS/Non-ASN |
| pendidikan | STRING | S2/S3 |
| jabatan_fungsional | STRING | |
| is_s3 | BOOLEAN | |
| is_serdos | BOOLEAN | |
| is_praktisi | BOOLEAN | |

##### `dim_mahasiswa`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| mahasiswa_id | STRING | NIM |
| prodi_id | STRING | FK |
| angkatan | INT | |
| jalur_masuk | STRING | |
| asal_provinsi | STRING | |
| jenis_kelamin | STRING | |

##### `dim_topik_penelitian`
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| topik_id | INT | SK |
| nama_topik | STRING | Sustainable Energy / Innovative Industry / Green Infrastructure / Community Dev |
| deskripsi | STRING | |

---

#### 3B. TABEL FAKTA (IKU)

##### `fact_iku1_lulusan` — IKU 1: Lulusan Bekerja/Studi/Wirausaha
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK dim_waktu |
| prodi_id | STRING | FK dim_prodi |
| total_lulusan | INT | Jumlah lulusan periode |
| lulusan_bekerja | INT | |
| lulusan_lanjut_studi | INT | |
| lulusan_wirausaha | INT | |
| lulusan_belum | INT | |
| persen_terserap | FLOAT | (bekerja+studi+wirausaha)/total |
| target_iku | FLOAT | Target sesuai Renstra |
| capaian_iku | FLOAT | Persen capaian |

##### `fact_iku2_mbkm` — IKU 2: Mahasiswa ≥20 SKS di Luar Kampus / Prestasi Nasional
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| prodi_id | STRING | FK |
| total_mahasiswa_aktif | INT | |
| mahasiswa_sks_luar_20 | INT | Mahasiswa ≥20 SKS luar kampus |
| mahasiswa_prestasi_nasional | INT | Prestasi ≥ nasional |
| mahasiswa_memenuhi_iku2 | INT | Union keduanya |
| persen_iku2 | FLOAT | |
| target_iku | FLOAT | |
| capaian_iku | FLOAT | |

##### `fact_iku3_dosen_tridarma` — IKU 3: Dosen Aktif Tridarma Luar / Industri / Bina Prestasi
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| prodi_id | STRING | FK |
| total_dosen_tetap | INT | |
| dosen_tridarma_pt_lain | INT | |
| dosen_praktisi_industri | INT | |
| dosen_bina_prestasi | INT | |
| dosen_qs100 | INT | |
| dosen_memenuhi_iku3 | INT | Union |
| persen_iku3 | FLOAT | |
| target_iku | FLOAT | |
| capaian_iku | FLOAT | |

##### `fact_iku4_kualifikasi_dosen` — IKU 4: Dosen S3/Sertifikat/Praktisi
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| prodi_id | STRING | FK |
| total_dosen_tetap | INT | |
| dosen_s3 | INT | Bergelar Doktor |
| dosen_sertifikat_industri | INT | Sertifikat kompetensi/profesi |
| dosen_dari_praktisi | INT | Dari industri/dunia kerja |
| dosen_memenuhi_iku4 | INT | Union |
| persen_iku4 | FLOAT | |
| target_iku | FLOAT | |
| capaian_iku | FLOAT | |

##### `fact_iku5_penelitian_pkm` — IKU 5: Rekognisi Internasional / Diterapkan Masyarakat per Dosen
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| jurusan_id | STRING | FK (level jurusan) |
| total_dosen | INT | |
| output_rekognisi_internasional | INT | Penelitian + PkM dengan rekognisi intl |
| output_diterapkan_masyarakat | INT | Yang digunakan langsung masyarakat |
| total_output_eligible | INT | |
| rasio_per_dosen | FLOAT | total_output / total_dosen |
| target_iku | FLOAT | |
| capaian_iku | FLOAT | |

##### `fact_iku6_kerjasama_prodi` — IKU 6: Prodi Bekerjasama dengan Mitra
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| total_prodi_s1 | INT | |
| prodi_berkerjasama | INT | Punya ≥1 kerjasama aktif |
| persen_iku6 | FLOAT | |
| target_iku | FLOAT | |
| capaian_iku | FLOAT | |

##### `fact_iku7_metode_pembelajaran` — IKU 7: MK Case Method / Team-Based
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| prodi_id | STRING | FK |
| total_mk | INT | Total mata kuliah |
| mk_case_method | INT | MK pakai case method |
| mk_team_based | INT | MK pakai team-based project |
| mk_memenuhi | INT | Union |
| persen_iku7 | FLOAT | |
| target_iku | FLOAT | |
| capaian_iku | FLOAT | |

##### `fact_iku8_akreditasi_internasional` — IKU 8: Prodi Akreditasi / Sertifikat Internasional
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| total_prodi_s1 | INT | |
| prodi_akreditasi_internasional | INT | |
| persen_iku8 | FLOAT | |
| target_iku | FLOAT | |
| capaian_iku | FLOAT | |

##### `fact_tata_kelola` — Sasaran 4: SAKIP & Kinerja Anggaran
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| predikat_sakip | STRING | BB / B / A / AA |
| nilai_sakip | FLOAT | Skor numerik |
| nilai_kinerja_anggaran | FLOAT | Skor RKA-K/L |
| pagu_total | BIGINT | Total pagu anggaran |
| realisasi_total | BIGINT | Total realisasi |
| persen_realisasi | FLOAT | |
| target_sakip | STRING | BB |
| target_kinerja_anggaran | FLOAT | 80/85 |

##### `fact_rekap_iku_institusi` — Ringkasan Semua IKU (untuk Executive Dashboard)
| Atribut | Tipe | Keterangan |
|---------|------|------------|
| fact_id | INT | SK |
| waktu_id | INT | FK |
| iku_kode | STRING | IKU-1 s.d. IKU-8 |
| iku_nama | STRING | Deskripsi IKU |
| nilai_capaian | FLOAT | Nilai aktual |
| nilai_target | FLOAT | Target Renstra |
| satuan | STRING | % / Rasio / Predikat |
| status_capaian | STRING | Tercapai / Tidak Tercapai / On Track |

---

## 4. Target IKU per Tahun (dari Renstra ITERA 2020–2024)

| IKU | Indikator | 2021 | 2022 | 2023 | 2024 |
|-----|-----------|------|------|------|------|
| IKU-1 | % Lulusan bekerja/studi/wirausaha | 75% | 76% | 77% | 78% |
| IKU-2 | % Mahasiswa ≥20 SKS luar kampus / prestasi nasional | 20% | 25% | 30% | 35% |
| IKU-3 | % Dosen tridarma luar/praktisi/bina prestasi | 15% | 17% | 20% | 25% |
| IKU-4 | % Dosen S3/sertifikat kompetensi/praktisi | 30% | 32% | 40% | 50% |
| IKU-5 | Rasio output penelitian rekognisi intl per dosen | 0.10 | 0.15 | 0.20 | 0.25 |
| IKU-6 | % Prodi bekerjasama dengan mitra | 35% | 40% | 50% | 60% |
| IKU-7 | % MK case method / team-based project | 25% | 30% | 35% | 40% |
| IKU-8 | % Prodi akreditasi / sertifikat internasional | 2.5% | 2.5% | 2.5% | 3.0% |
| SAKIP | Predikat SAKIP | BB | BB | BB | BB |
| Anggaran | Nilai Kinerja Anggaran | 80 | 85 | 85 | 85 |

---

## 5. Struktur Folder Output

```
data/
├── bronze/          ← Station 1 (raw CSV)
│   ├── raw_mahasiswa.csv
│   ├── raw_lulusan.csv
│   ├── raw_dosen.csv
│   ├── raw_kegiatan_dosen.csv
│   ├── raw_penelitian.csv
│   ├── raw_pengabdian.csv
│   ├── raw_kerjasama.csv
│   ├── raw_mbkm.csv
│   ├── raw_akreditasi.csv
│   ├── raw_prodi.csv
│   ├── raw_keuangan.csv
│   └── raw_prestasi_mahasiswa.csv
│
├── silver/          ← Station 2 (cleaned Parquet)
│   ├── silver_mahasiswa.parquet
│   ├── silver_lulusan.parquet
│   ├── silver_dosen.parquet
│   ├── silver_penelitian_pkm.parquet
│   ├── silver_kerjasama_aktif.parquet
│   └── silver_akreditasi_aktif.parquet
│
└── gold/            ← Station 3 + 4 (DWH Parquet)
    ├── dim_waktu.parquet
    ├── dim_prodi.parquet
    ├── dim_dosen.parquet
    ├── dim_mahasiswa.parquet
    ├── dim_topik_penelitian.parquet
    ├── fact_iku1_lulusan.parquet
    ├── fact_iku2_mbkm.parquet
    ├── fact_iku3_dosen_tridarma.parquet
    ├── fact_iku4_kualifikasi_dosen.parquet
    ├── fact_iku5_penelitian_pkm.parquet
    ├── fact_iku6_kerjasama_prodi.parquet
    ├── fact_iku7_metode_pembelajaran.parquet
    ├── fact_iku8_akreditasi_internasional.parquet
    ├── fact_tata_kelola.parquet
    └── fact_rekap_iku_institusi.parquet
```

---

## 6. Catatan Implementasi

- **Bronze → Silver**: Quality check dengan threshold metric 60–79% masuk quarantine, ≥80% lanjut ke Station 2
- **Silver → Gold**: ETL 1 menghasilkan Columnar Table Processing → Raw Clean Data → masuk Station 3
- **Gold → DWH**: ETL 2 menghasilkan agregasi final untuk Dashboard Pimpinan (MLOps API / Portal AI)
- Semua file gold disimpan dalam format **Parquet** untuk efisiensi columnar query
- File bronze dalam format **CSV** mensimulasikan sumber sistem informasi akademik ITERA