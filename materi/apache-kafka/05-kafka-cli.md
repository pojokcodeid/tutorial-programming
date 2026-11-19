# Pelajaran 5 — Perintah CLI Kafka Sehari-hari

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 3 (Kafka berjalan, topic `user-events` sudah dibuat)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- **Membuat, memeriksa, mengubah, dan menghapus topic** dengan `kafka-topics.sh`.
- **Mengirim record** lewat console producer dan **membacanya** lewat console consumer dengan opsi offset yang tepat.
- **Memeriksa posisi consumer group** dan offset dengan `kafka-consumer-groups.sh` serta `kafka-get-offsets.sh`.
- **Membaca output describe**: partitions, leader, replicas, dan ISR.

---

## Peta perintah

Seluruh CLI berada di `/opt/kafka/bin/` dan hampir semua membutuhkan `--bootstrap-server localhost:9092`:

| Kebutuhan | Perintah |
|-----------|----------|
| Buat/ubah/hapus topic | `kafka-topics.sh` |
| Lihat detail partition | `kafka-topics.sh --describe` |
| Kirim record (uji cepat) | `kafka-console-producer.sh` |
| Baca record (uji cepat) | `kafka-console-consumer.sh` |
| Posisi offset suatu group | `kafka-consumer-groups.sh --describe` |
| Offset terakhir tiap partition | `kafka-get-offsets.sh` |
| Baca/ubah konfigurasi topic | `kafka-configs.sh` |
| Metadata cluster | `kafka-metadata.sh` |

```text
┌─ Topic ────────────────┐ ┌─ Produksi & Konsumsi ───────┐ ┌─ Offset & Group ───────────┐
│ kafka-topics.sh        │ │ kafka-console-producer.sh   │ │ kafka-consumer-groups.sh   │
│  --create --describe   │ │ kafka-console-consumer.sh   │ │  --describe --reset-offsets│
│  --alter --delete      │ │  --from-beginning --offset  │ │ kafka-get-offsets.sh       │
└────────────────────────┘ └─────────────────────────────┘ └────────────────────────────┘
┌─ Konfigurasi ────────────────────────────┐ ┌─ Metadata Cluster ────────────────┐
│ kafka-configs.sh --describe --alter      │ │ kafka-metadata.sh --snapshot      │
│ retention.ms, cleanup.policy, min.isr    │ │ kafka-broker-api-versions.sh      │
└──────────────────────────────────────────┘ └───────────────────────────────────┘
```

---

## Mengelola topic

Tiga hal penting saat membuat topic:

- **`--partitions`** — jumlah partition (unit paralelisme). Latihan: 3; production: dihitung dari throughput.
- **`--replication-factor`** — jumlah salinan. Latihan 1 broker: `1`; production minimal `3`.
- **`--config`** — override konfigurasi per topic, mis. `retention.ms=604800000` (retensi 7 hari).

```bash
# buat topic 3 partition
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --create \
  --topic user-events --partitions 3 --replication-factor 1

# daftar & detail
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --describe --topic user-events

# ubah jumlah partition (hanya boleh bertambah)
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --alter \
  --topic user-events --partitions 6

# hapus topic latihan
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --delete --topic user-events
```

Contoh baris `--describe`:

```text
Topic: user-events   Partition: 0   Leader: 1   Replicas: 1   ISR: 1
```

Artinya partition 0 berada di broker 1 (leader), salinannya juga broker 1, dan broker 1 in-sync (sehat).

---

## Console producer & consumer

```bash
# kirim record (satu baris = satu record, Ctrl+D untuk selesai)
docker exec -it kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic user-events
{"event":"login","user":"andi"}
{"event":"logout","user":"andi"}

# baca dari awal (termasuk record lama)
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic user-events --from-beginning

# baca hanya record baru
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic user-events

# baca dari partition tertentu mulai offset tertentu
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic user-events \
  --partition 0 --offset 2
```

- `--from-beginning` = replay dari offset 0 — bukti record lama masih tersimpan.
- Tanpa opsi offset = `auto.offset.reset=latest` → hanya record **sesudah** consumer mulai.
- `--partition 0 --offset 2` = penelusuran presisi pada satu partition.

---

## Offset dan consumer group

Dua perintah untuk pertanyaan *"sudah sampai mana consumer saya?"*:

```bash
docker exec kafka /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server localhost:9092 --topic user-events

docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group analytics

# contoh output:
# GROUP      TOPIC         PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# analytics  user-events   0          14              20              6
# analytics  user-events   1          20              20              0
# analytics  user-events   2          8               20              12
```

- **LAG = LOG-END-OFFSET − CURRENT-OFFSET** — metrik kesehatan consumer yang paling penting.
- LAG 0 = consumer sudah *catch up*; LAG besar = tertinggal (lambat atau mati).
- Reset posisi: `--reset-offsets --to-earliest --execute` **saat group tidak aktif**.

---

## Konfigurasi topic dengan kafka-configs.sh

| Konfigurasi | Fungsi |
|-------------|--------|
| `retention.ms` | Berapa lama record disimpan (milidetik) |
| `retention.bytes` | Batas ukuran maksimum partition |
| `cleanup.policy` | `delete` (hapus lama) atau `compact` (simpan nilai terbaru per key) |
| `min.insync.replicas` | Jumlah replica sehat minimal agar tulis dianggap aman |

```bash
# baca dulu
docker exec kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 --entity-type topics \
  --entity-name user-events --describe

# baru ubah: retensi 7 hari
docker exec kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 --entity-type topics \
  --entity-name user-events --alter \
  --add-config retention.ms=604800000
```

**Selalu `--describe` dulu sebelum `--alter`.**

---

## Kesalahan umum saat memakai CLI

- **Lupa `--bootstrap-server`** — hampir semua perintah modern wajib menyebutnya.
- **Salah path** — image `apache/kafka` menyimpannya di `/opt/kafka/bin/`.
- **Replication-factor > jumlah broker** — pembuatan topic langsung gagal.
- **Mengira `--from-beginning` default** — default console consumer adalah *latest*.
- **`--reset-offsets` saat group aktif** — ditolak; hentikan consumer dulu.
- **`--alter --partitions` untuk mengurangi** — hanya menambah yang didukung.

---

## Rangkuman

- Semua CLI di `/opt/kafka/bin/` dan hampir semua butuh `--bootstrap-server localhost:9092`.
- Topic dikelola `kafka-topics.sh`: **create, describe, alter (hanya menambah), delete**.
- Console consumer default **latest**; `--from-beginning` untuk replay; `--partition/--offset` untuk presisi.
- **LAG = log end offset − current offset**; konfigurasi topic via `kafka-configs.sh`.

## Latihan

1. Buat topic `order-created` 3 partition, tampilkan `--describe`, sebutkan leader tiap partition.
2. Kirim **10 record** via console producer, lalu baca dengan `--from-beginning`.
3. Baca record dari **partition 1 mulai offset 0** — bandingkan dengan pembacaan seluruh partition.
4. Tampilkan konfigurasi topic, ubah `retention.ms` jadi 1 hari, buktikan perubahannya.
5. Buat topic dengan `--replication-factor 3` pada cluster 1 broker — apa errornya? Mengapa?

## Istilah

| Istilah | Arti |
|--------|------|
| kafka-topics.sh | CLI pengelola topic |
| console producer | CLI kirim record per baris input |
| console consumer | CLI baca record dari topic |
| consumer groups CLI | CLI inspeksi group & offset |
| Log end offset | Offset tertinggi yang sudah ada di partition |
| LAG | Selisih log end offset dan posisi consumer |
| retention.ms | Batas waktu penyimpanan record |

---

**Lanjut → [Pelajaran 6 — Topic & Partition Lebih Dalam](06-topic-partition.md)**
