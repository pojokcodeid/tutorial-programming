# Pelajaran 23 — Performance Tuning

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 9, 10, 21–22

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menerapkan metodologi **ukur → ubah satu variabel → bandingkan**.
- Mengatur **batching & kompresi** producer untuk throughput tinggi.
- Mengoptimalkan **partition, paralelisme consumer, I/O broker**.
- Mengenali **bottleneck** umum + cara sistematis menanganinya.

---

## Metodologi

1. **Tentukan metrik target** — throughput atau latency p99 (berbeda, kadang bertentangan).
2. **Ukur baseline** — beban uji mewakili produksi.
3. **Ubah satu variabel** — ukur ulang.
4. **Bandingkan & putuskan** — pertahankan yang membaik.

> **Trade-off:** batch besar = throughput ↑ tetapi latency ↑. Jangan kejar throughput tanpa melihat p99.

```text
Producer ──▶ Batching + kompresi ──▶ Broker ──▶ Consumer
[ukur 1]    batch.size · linger.ms   [ukur p99]  [ukur lag]
                                    disk·ISR     fetch·poll·proses

         Paralelisme: jumlah partition × consumer

ubah SATU variabel → ukur ulang → bandingkan
```

---

## Producer: batching, kompresi, acks

- **`batch.size`** (default 16 KB) — lebih besar = lebih sedikit request, tapi latency & memori naik.
- **`linger.ms`** (default 0) — jeda kecil (5–50 ms) → batch penuh → **throughput melonjak**.
- **`compression.type`** — `lz4`/`snappy` (cepat), `zstd` (rasio terbaik) → jaringan + disk hemat.
- **`acks=all`** + `enable.idempotence=true` — aman tanpa duplikat.
- **`buffer.memory`** — antrian memori; terlalu kecil = producer memblokir.

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka1:9092,kafka2:9092");

// batching & throughput
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 65536);          // 64 KB
props.put(ProducerConfig.LINGER_MS_CONFIG, 20);              // tunggu 20 ms
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864);    // 64 MB
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");

// keamanan + retry efisien
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
```

- `linger.ms=20` = perubahan **paling berdampak** untuk throughput beban tinggi.
- **lz4** sering menjadi peningkatan terbesar dengan usaha terkecil pada payload besar.

---

## Broker: partition, disk, jaringan

- **Partition** — unit paralelisme; mulai **3–6 per broker per topik**, tambah hanya bila terbukti.
- **Disk** — sequential append cocok untuk SSD/NVMe; pisahkan `log.dirs` ke beberapa disk.
- **Jaringan** — `num.network.threads`, `num.io.threads` agar permintaan tak menumpuk.
- **Segment** — terlalu kecil = banyak file; terlalu besar = penghapusan tertunda (default 1 GB wajar).

```properties
# BROKER
num.network.threads=8
num.io.threads=16
log.dirs=/data/kafka1,/data/kafka2
log.segment.bytes=1073741824
default.replication.factor=3
min.insync.replicas=2

# CONSUMER
fetch.min.bytes=1
fetch.max.wait.ms=500
max.poll.records=500
max.poll.interval.ms=300000
enable.auto.commit=false

ANALISIS PARALELISME
  target                200.000 record/detik
  kapasitas 1 consumer  ~30.000 record/detik
  → minimal              7 consumer
  → partition            >= 8 (idealnya kelipatan)

KAPAN MENAMBAH PARTITION
  ✓ lag tinggi walau consumer sudah maksimal
  ✓ satu partisi jauh lebih panjang (skew)
  ✗ belum yakin penyebabnya paralelisme
```

- `fetch.min.bytes` kecil = respons segera; `fetch.max.wait.ms` = batas tunggu.
- **Partition ≥ consumer**; menambah consumer melebihi partisi = sia-sia.
- Menambah partition **mengubah hash key** → sulit dibatalkan; hanya saat bottleneck terbukti.

---

## Consumer: paralelisme & pemrosesan

- **Consumer ≤ partition** — satu per partition per group = batas paralelisme alami.
- **`max.poll.records`** — kecil = komit rapat, besar = efisien tapi rentan **rebalance**.
- **Pemrosesan berat** → pindah ke thread/queue; jangan menahan poll.
- **Multi-group** untuk jenis pekerjaan berbeda.

**Anti-pattern:** satu consumer menangani semua + batch besar + proses lambat → lag tumbuh → rebalance → makin lambat. Solusi: batch kecil, percepat proses, atau partisi + consumer.

---

## Bottleneck umum

| Gejala | Penyebab | Tindakan |
|--------|----------|----------|
| Throughput producer rendah | Batch kecil, tanpa kompresi, linger 0 | `linger.ms`+`batch.size`↑, lz4 |
| Latensi p99 melonjak | Batch terlalu besar, disk/jaringan jenuh | Kecilkan batch, cek I/O |
| Lag terus naik | Consumer kurang / proses lambat / partisi kurang | Percepat proses; partisi bila terbukti |
| CPU broker tinggi | Terlalu banyak partisi, replikasi tertinggal | Kurangi partisi, cek ISR |
| Disk I/O tinggi | Retensi panjang, compaction, consumer lama | Retensi, jadwal compaction, audit |

> ⚠️ **Kesalahan:** tuning tanpa baseline · kejar throughput abaikan p99 · menambah partisi tiap lag naik (padahal kode lambat) · nyalakan semua optimasi sekaligus · abaikan I/O compaction/replikasi.

> 💡 **Urutan tuning:** (1) ukur baseline, (2) producer: linger 5–50 ms + batch besar + lz4, (3) pastikan partisi ≥ consumer, (4) batasi `max.poll.records` + pindahkan pekerjaan berat, (5) broker: I/O threads + disk terpisah, (6) ukur ulang — pertahankan yang terbukti.

---

## Rangkuman

- **Ukur → ubah satu → ukur ulang → bandingkan**.
- **linger.ms + batch.size + kompresi** = tuas throughput; latency biayanya.
- **Partition ≥ consumer**; menambah partisi mengubah hash key.
- **Gejala → penyebab → tindakan** — lag naik ≠ selalu kurang partisi.

## Latihan

1. Metodologi tuning **4 langkah** + mengapa satu variabel.
2. Hubungan `linger.ms`, `batch.size`, throughput, latency.
3. Target 500 ribu/detik, 1 consumer = 40 ribu → minimal berapa? Apa bila consumer > partisi?
4. Lag naik terus — **3 penyebab** + cara membedakan.
5. Kapan **kompresi** justru memperburuk latency? Kapan memperbaiki?

## Istilah

| Istilah | Arti |
|---------|------|
| Batching | Gabung banyak record jadi satu request |
| linger.ms | Waktu tunggu agar batch lebih penuh |
| Kompresi | Perkecil payload (lz4, snappy, zstd) |
| Throughput | Record per satuan waktu |
| Latensi p99 | 99% request lebih cepat dari nilai ini |
| Paralelisme | Kerja bersamaan (partition × consumer) |
| Bottleneck | Titik paling lambat pembatas sistem |
| Skew | Beban tidak merata antarpartisi |

---

**Lanjut → [Pelajaran 24 — Arsitektur Lanjutan](24-arsitektur-lanjutan.md)**
