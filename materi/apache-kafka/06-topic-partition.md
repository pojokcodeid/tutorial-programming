# Pelajaran 6 — Topic & Partition Lebih Dalam

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 2 (Konsep Inti) dan Pelajaran 5 (CLI)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan hubungan **jumlah partition dengan throughput dan paralelisme**.
- Menjelaskan cara kerja **partitioner**: key, hash murmur2, dan perilaku record tanpa key.
- Menjelaskan mengapa **urutan terjamin per key** dan konsekuensinya bagi desain key.
- Menyusun **pertimbangan menentukan jumlah partition** topic.

---

## Mengapa topic dibagi menjadi partition?

Kalau seluruh record satu topic disimpan dalam satu log tunggal, hanya **satu broker** yang menulis dan membacanya — throughput terbatas pada satu mesin. Dengan membagi ke beberapa partition:

- **Paralelisme menulis** — beberapa producer menulis bersamaan ke partition berbeda.
- **Paralelisme membaca** — beberapa consumer dalam satu group membaca bersamaan.
- **Kesebaran beban disk & jaringan** — tidak menumpuk di satu mesin.
- **Skala horizontal** — menambah broker memungkinkan partition ditambah/disebar.

**Partition = unit paralelisme sekaligus unit replikasi** — satu log berurutan yang bisa punya beberapa salinan (replica) di broker berbeda.

```text
                ┌── Partition 0 ── Broker 1 (leader) ── salinan di Broker 2
Topic: orders ──┼── Partition 1 ── Broker 2 (leader) ── salinan di Broker 3
                └── Partition 2 ── Broker 3 (leader) ── salinan di Broker 1
```

---

## Key, hash, dan partitioner

Untuk record yang punya **key**, Kafka memakai hash murmur2 lalu modulus:

```text
partition = hash(key) % jumlah_partition
```

Konsekuensinya:

- **Key sama → partition sama** — penempatan deterministik selama jumlah partition tidak berubah.
- **Urutan per key terjaga** — semua record satu akun berada di satu log berurutan.
- **Key beda → bisa ke partition mana saja** — tersebar bila key cukup beragam.

**Pilihan key mencerminkan satuan urutan yang dibutuhkan bisnis**: akun untuk mutasi saldo, user ID untuk aktivitas, order ID untuk lifecycle pesanan. Key yang selalu sama = satu partition jadi botol leher.

```text
Record dengan key                Record tanpa key
─────────────────                ─────────────────
key "ACC-01" → hash → P0         r1 → P0  (sticky: menempel
key "ACC-07" → hash → P1         r2 → P0   sampai batch penuh,
key "ACC-01" → hash → P0         r3 → P0   lalu berganti)
                                 r4 → P1
                                 r5 → P1
```

> **Sticky partition**: default modern producer menempel ke satu partition sampai batch penuh lalu berganti — bukan round-robin per record seperti versi lama. Tujuannya batch lebih besar dan throughput lebih tinggi.

---

## Urutan: per key, bukan global

Janji Kafka: **urutan dijamin di dalam satu partition**. Praktiknya:

- Urutan **per key terjamin** (key sama → partition sama).
- Urutan **antar key tidak dijamin** (bisa berbeda partition).
- Urutan **antar partition tidak dijamin** (dua broker menulis paralel).

Menambah partition mengubah hasil modulus — **penempan key lama tidak dihitung ulang**, jadi key lama tetap di partition lamanya, hanya key baru terdistribusi ulang. Karena itu jumlah partition sulit dibatalkan: **menambah relatif aman, tetapi mengurangi tidak didukung**.

---

## Menentukan jumlah partition

```text
TARGET THROUGHPUT
  target_bytes_per_sec   = 50 MB/s (arah tulis)
  throughput_per_partition ≈ 10 MB/s (asumsi aman)
  partitions_min = ceil(50 / 10) = 5

KONSUMSI
  kebutuhan paralelisme consumer = 6
  (maks consumer berguna per group = jumlah partition)
  → setidaknya 6 partition

KEAMANAN
  jumlah broker = 3
  partition jangan terlalu jauh melebihi jumlah broker
  (rule of thumb cluster kecil: 2–4x jumlah broker)

HASIL: mulai dari 6, lalu validasi dengan benchmark nyata
```

Jumlah partition diturunkan dari **target throughput** dan **kebutuhan paralelisme consumer**, dibatasi jumlah broker, lalu divalidasi dengan benchmark.

---

## Mistake desain yang paling mahal

- **Key selalu sama** (mis. key "global") — satu partition menampung semua traffic.
- **Key kardinalitas rendah** (status order: paid/pending) — hanya 2-3 partition yang hidup dari 12 yang dibuat.
- **Menambah partition tanpa pertimbangan** — membatalkan asumsi urutan yang dibangun aplikasi.
- **Partition terlalu banyak untuk cluster kecil** — metadata membengkak, recovery lambat.
- **Menaruh PII pada key** — key terlihat di monitoring, log, dan tooling.

---

## Cara memeriksa distribusi nyata

Jangan percaya asumsi — buktikan:

```bash
docker exec kafka /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server localhost:9092 --topic user-events
```

Bila satu partition jauh lebih besar offsetnya → di situ ada **skew**: key terlalu sempit atau ada satu entitas yang sangat aktif.

---

## Rangkuman

- Partition = **unit paralelisme sekaligus unit replikasi**.
- Record ber-key: **hash(key) % jumlah partition** → urutan per key terjaga.
- Record tanpa key: **sticky partition** — tidak ada urutan yang diandalkan.
- Jumlah partition dari **throughput + kebutuhan consumer**, dibatasi broker, divalidasi benchmark.

## Latihan

1. Jelaskan dua peran partition: **paralelisme** dan **replikasi**.
2. Hitung: target tulis 50 MB/s, 10 MB/s per partition → berapa partition minimum? Faktor apa yang menaikkannya?
3. Key apa untuk topic `order-events` bila urutan lifecycle per pesanan wajib terjaga? Mengapa?
4. Apa yang terjadi pada penempatan key lama saat partition 3 → 6?
5. Kirim 20 record dengan 3 key, bandingkan offset tiap partition.

## Istilah

| Istilah | Arti |
|--------|------|
| Partition | Segmen log berurutan; unit paralelisme & replikasi |
| Key | Nilai penentu partition tujuan record |
| Partitioner | Logika memilih partition (hash % N) |
| Murmur2 | Fungsi hash bawaan Kafka |
| Sticky partition | Strategi default producer tanpa key |
| Partition skew | Satu partition jauh lebih padat dari lainnya |
| Kardinalitas key | Jumlah nilai unik key (menentukan kerataan) |

---

**Lanjut → [Pelajaran 7 — Offset, Consumer Position & Lag](07-offset-dan-lag.md)**
