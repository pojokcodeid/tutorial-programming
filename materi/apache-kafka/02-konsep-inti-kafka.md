# Pelajaran 2 — Konsep Inti: Topic, Partition, Offset

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 1 (Apa Itu Apache Kafka?)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan fungsi **record, topic, partition, offset, broker, cluster, replication, dan consumer group**.
- Menguraikan **alur 6 langkah** data di Kafka dari producer hingga consumer mengelola offset.
- Menjelaskan mengapa **urutan dijamin per partition**, bukan per topic.
- Menghubungkan **jumlah partition** dengan throughput, paralelisme, dan jumlah consumer.

---

## Sepuluh istilah inti

| Istilah | Fungsi |
|---------|--------|
| **Event / Record** | Unit data yang dikirim (memiliki key, value, timestamp) |
| **Topic** | Kategori tempat record ditulis, mis. `user-events` |
| **Partition** | Bagian dari topic; satu file log berurutan pada satu broker |
| **Offset** | Nomor urut posisi record dalam satu partition (mulai 0) |
| **Producer** | Aplikasi yang menulis record |
| **Consumer** | Aplikasi yang membaca record |
| **Broker** | Satu server Kafka penyimpan partition |
| **Cluster** | Kumpulan broker yang bekerja bersama |
| **Replication** | Salinan partition di broker lain untuk toleransi kegagalan |
| **Consumer group** | Sekelompok consumer yang berbagi pekerjaan membaca topic |

---

## Arsitektur dasar

```text
                 ┌─────────────────── Cluster Kafka (3 broker) ───────────────────┐
                 │                                                                │
Producer ──────▶ │  Broker 1            Broker 2            Broker 3             │
user-service     │  Partition 0 (leader) Partition 1 (leader) Partition 2 (leader)│
                 │   └ salinan: P0 di B2  └ salinan: P1 di B3  └ salinan: P2 di B1│
                 └───────────┬────────────────┬───────────────────┬───────────────┘
                             ▼                ▼                   ▼
                     Consumer group "analytics"      Consumer group "audit"
                     (membaca posisi masing-masing, saling independen)
```

Satu topic (`user-events`) terbagi ke tiga partition yang **tersimpan di broker berbeda**. Tiap partition memiliki **leader** (melayani baca/tulis) dan **follower** (salinan) di broker lain.

---

## Alur 6 langkah data di Kafka

1. **Producer membuat event** — memilih topic tujuan dan (opsional) key record.
2. **Producer mengirim event ke topic** — koneksi ke bootstrap server cluster.
3. **Kafka menentukan partition tujuan** — lewat partitioner berdasarkan key (atau round-robin bila tanpa key).
4. **Broker menyimpan record dan memberi offset** — record ditulis berurutan ke akhir log partition.
5. **Consumer membaca record berdasarkan offset** — dari posisi yang ditentukan consumer itu.
6. **Consumer mengelola kemajuan baca** — mencatat (commit) offset supaya restart tidak membaca ulang dari awal.

Poin penting: Kafka **bukan antrean yang menghapus data setelah dibaca**. Data tetap di tempat; yang berpindah hanyalah **penanda posisi baca** (offset) milik tiap consumer.

---

## Mengapa urutan hanya dijamin per partition

Kafka menjamin **urutan record di dalam satu partition** — offset 5 selalu sebelum offset 6. Tetapi **tidak ada urutan global antar partition**, karena record diedarkan ke beberapa broker yang menulis paralel.

Konsekuensinya untuk desain aplikasi:

- Urutan wajib dipertahankan (urutan perubahan saldo satu akun) → taruh di **satu partition yang sama** dengan **key yang sama**.
- Data tidak butuh urutan antar entitas → penyebaran ke banyak partition justru meningkatkan throughput.
- Itulah sebabnya **key** menjadi senjata utama: key sama → hash sama → partition sama.

---

## Apa yang terjadi di dalam satu partition

```text
Partition 0 topic "order-created" (disimpan Broker 1)
+--------+--------+---------------------+------------+
| Offset |  Key   |        Value        |  Timestamp |
+--------+--------+---------------------+------------+
|   0    | ACC-01 | {"total": 100000}   | 10:00:01.0 |
|   1    | ACC-07 | {"total": 250000}   | 10:00:01.2 |
|   2    | ACC-01 | {"total": 50000}    | 10:00:02.1 |
|   3    | ACC-03 | {"total": 75000}    | 10:00:02.9 |
+--------+--------+---------------------+------------+
Consumer membaca: offset 0,1,2,3 lalu commit offset 4
("saya sudah sampai di sini")
```

- **Offset** adalah nomor urut internal dari broker — producer tidak menentukannya.
- Record dengan **key sama** (ACC-01) selalu ke partition sama → urutan per akun terjaga.
- **Commit offset dilakukan consumer** — bila mati dan restart, ia lanjut dari offset terakhir yang dicommit.

---

## Partition, throughput, dan jumlah consumer

Partition adalah unit **paralelisme** Kafka. Semakin banyak partition, semakin banyak yang bisa menulis/membaca bersamaan — tetapi juga semakin banyak file log, index, dan metadata broker.

| Kondisi | Akibat |
|---------|--------|
| Partition > consumer | Sebagian consumer memegang lebih banyak partition |
| Consumer > partition | Consumer berlebih **idle** (tidak membaca apa pun) dalam group itu |
| Consumer group berbeda | Saling independen, semua membaca topic sama dari posisi masing-masing |

**Aturan emas: satu partition hanya ditugaskan ke maksimal satu consumer dalam satu consumer group pada satu waktu.**

```text
Topic "user-events" : P0   P1   P2
                      │    │    │
Group "analytics"     ▼    ▼    ▼
  consumer-a          [P0]
  consumer-b               [P1][P2]

Group "audit"         ▼    ▼    ▼
  consumer-x          [P0][P1][P2]   ← membaca dari awal, independen

consumer-c (group "analytics") → tidak dapat partition (lebih dari jumlah partition)
```

---

## Analogi buku kas besar

Pikirkan topic sebagai **buku kas besar**, partition sebagai **jilid buku (jilid 1, 2, 3)**, dan offset sebagai **nomor baris di tiap jilid**. Producer menulis di akhir tiap jilid; consumer menandai sampai baris berapa ia membaca. Karena tiap jilid ditangani broker berbeda, urutan antar jilid bebas — tetapi urutan di dalam satu jilid selalu rapi.

---

## Mitos yang sering menyesatkan

- **"Kafka menghapus record setelah dibaca"** — tidak. Record hilang karena **retensi** (waktu/ukuran), bukan karena dibaca.
- **"Urutan global di seluruh topic terjaga"** — tidak; urutan hanya dijamin per partition.
- **"Semakin banyak partition selalu lebih baik"** — berlebihan menambah partition memperbesar metadata dan waktu recovery.
- **"Offset ditentukan producer"** — tidak; offset diberikan broker saat record ditulis.

---

## Rangkuman

- Sepuluh istilah inti: **record, topic, partition, offset, producer, consumer, broker, cluster, replication, consumer group**.
- Alur: producer → tentukan partition → broker menulis + memberi offset → consumer membaca → **consumer commit offset**.
- **Urutan hanya dijamin di dalam satu partition**; key menentukan partition tujuan.
- **Maksimal satu consumer per partition dalam satu group**; consumer berlebih idle; group berbeda independen.

## Latihan

1. Urutkan kembali **alur 6 langkah** data di Kafka dengan bahasamu sendiri.
2. Sebutkan **10 istilah inti** dan fungsi singkatnya tanpa melihat tabel.
3. Jelaskan mengapa record dengan **key yang sama** selalu masuk partition yang sama.
4. Pada topic 3 partition: berapa consumer maksimal yang berguna dalam satu group? Apa yang terjadi bila ada 5?
5. Mengapa offset disebut "kemajuan pembacaan milik consumer", bukan milik broker?

## Istilah

| Istilah | Arti |
|--------|------|
| Record / Event | Unit data key + value + timestamp |
| Topic | Nama logikal tempat record ditulis |
| Partition | Segmen log berurutan milik topic |
| Offset | Nomor urut posisi record dalam partition |
| Broker | Server Kafka penyimpan partition |
| Replication | Salinan partition (leader + follower) |
| Consumer group | Kumpulan consumer yang berbagi partition |
| Bootstrap server | Alamat awal yang dipakai client untuk bergabung ke cluster |

---

**Lanjut → [Pelajaran 3 — Menjalankan Kafka: Environment & KRaft](03-setup-environment.md)**
