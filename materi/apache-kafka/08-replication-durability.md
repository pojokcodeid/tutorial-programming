# Pelajaran 8 — Replication, ISR & Durability

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 5–7

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan peran **leader, follower, replication factor, dan in-sync replicas (ISR)**.
- Menjelaskan perbedaan **acks=0, acks=1, dan acks=all** beserta konsekuensinya.
- Menjelaskan peran **min.insync.replicas** dalam menjamin keamanan tulis.
- Menjelaskan **unclean leader election** dan trade-off durability vs availability.

---

## Leader, follower, dan replication factor

Setiap partition punya satu **leader** — broker tempat seluruh baca/tulis dilayani. Selain leader ada **follower**: salinan di broker lain yang terus mengikuti (fetch) dari leader.

- **Replication factor (RF)** — jumlah total salinan. RF=3 = 3 salinan di 3 broker berbeda.
- **Followers menyalin asinkron** — ada jeda kecil (sumber trade-off latency vs keamanan).
- **Ketika leader mati** — follower yang memenuhi syarat dipromosikan jadi leader baru.

> **Aturan praktis:** RF **minimal 3** di production, tempatkan replica di broker/rack berbeda.

---

## Leader & ISR dalam satu pandang

```text
Broker 1                 Broker 2                 Broker 3
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ Partition 0 LEADER │   │ Partition 0 Follower│   │ Partition 0 Follower│
│ baca/tulis di sini │   │ in-sync (ISR)      │   │ tertinggal 12 offset│
└─────────┬──────────┘   └─────────▲──────────┘   └─────────▲──────────┘
          │  fetch                 │                        │
          └────────────────────────┴────────────────────────┘

ISR (In-Sync Replicas) = [Broker 1, Broker 2]
RF = 3 · min.insync.replicas = 2
tulis aman hanya bila minimal 2 anggota ISR mengonfirmasi
```

---

## In-Sync Replicas (ISR)

**ISR** = kumpulan replica (termasuk leader) yang **dianggap sehat dan cukup up-to-date**.

- Follower **keluar** ISR bila tertinggal lebih dari `replica.lag.time.max.ms` (default 30 detik).
- Follower **kembali masuk** ISR begitu menyusul.
- Saat leader mati, Kafka hanya mempromosikan follower dari **ISR** — inilah leader election yang aman.

---

## Tiga mode acks

```text
acks=0 (fire-and-forget)
  Producer ──▶ Broker : langsung dianggap sukses
  Risiko: broker belum menerima / jaringan putus TETAP sukses.
  Cocok: log metrik non-kritis.

acks=1 (leader only)
  Producer ──▶ Leader: sukses begitu leader menulis
  Risiko: leader mati sebelum follower menyalin → data hilang.

acks=all (leader + seluruh ISR)
  Producer ──▶ Leader + minimal min.insync.replicas mengonfirmasi
  Data jauh lebih aman; latency sedikit lebih tinggi.
  (acks=-1 identik dengan all.)
```

| acks | Kepastian | Risiko utama | Latensi |
|------|-----------|--------------|---------|
| `0` | Tidak ada | Data hilang tanpa kabar | Terendah |
| `1` | Leader menerima | Kehilangan saat leader mati | Sedang |
| `all` | Seluruh ISR (sesuai min.isr) | Tulis gagal saat ISR menyusut | Tertinggi |

---

## min.insync.replicas: pasangan wajib acks=all

| RF | min.insync.replicas | Tetap aman saat... |
|----|---------------------|--------------------|
| 3 | 2 | 1 broker mati (ISR tinggal 2) |
| 3 | 3 | Tidak ada — satu broker mati pun tulis berhenti |
| 2 | 2 | Tidak ada — sama ketatnya |

Bila anggota ISR turun di bawah `min.insync.replicas`, producer `acks=all` **gagal menulis** (NotEnoughReplicas) — Kafka memilih **tidak menerima data** daripada menerima data berisiko hilang.

```bash
# saat membuat topic (production)
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --create \
  --topic payment-events --partitions 12 \
  --replication-factor 3 \
  --config min.insync.replicas=2

# verifikasi konfigurasi & kesehatan replikasi
docker exec kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 --entity-type topics \
  --entity-name payment-events --describe
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --describe --topic payment-events
```

---

## Unclean leader election

Ketika **seluruh ISR mati bersamaan**, ada dua pilihan:

- **Menunggu** (`unclean.leader.election.enable=false`, default) — data aman, tetapi **partition offline**.
- **Leader tak bersih** (diaktifkan) — partition hidup kembali, tetapi **record yang belum tersalin hilang permanen**.

Default Kafka memilih keamanan data. Mengaktifkannya hanya layak untuk data yang rela kehilangan sebagian demi tetap tersedia.

---

## Membaca status replikasi dari describe

```text
Topic: payment-events  Partition: 0  Leader: 1  Replicas: 1,2,3  ISR: 1,2,3
Topic: payment-events  Partition: 1  Leader: 2  Replicas: 2,3,1  ISR: 2,3,1
Topic: payment-events  Partition: 2  Leader: 3  Replicas: 3,1,2  ISR: 3,1   ← broker 2 tertinggal

Replicas : urutan penempatan salinan (yang pertama = preferensi leader)
ISR      : salinan yang sehat & menyusul saat ini
Leader   : broker yang melayani baca/tulis sekarang
```

Pada partition 2, ISR menyusut (hanya 1,3): dengan `min.insync.replicas=2` tulis masih aman, tetapi satu kegagalan lagi membuat tulis berhenti. Kolom **Replicas tetap lengkap** — salinan tidak dihapus, hanya dianggap tidak in-sync.

---

## Konfigurasi replikasi yang sering keliru

- **`acks=all` tanpa `min.insync.replicas`** — ISR bisa menyusut ke 1, perlindungan sirna.
- **RF=1 di production** — satu kegagalan broker = data hilang permanen.
- **Semua replica di satu mesin/rack** — satu kegagalan menghabiskan semua salinan.
- **Mengaktifkan unclean election tanpa paham risikonya** — data bisa hilang diam-diam.
- **Mengabaikan ISR terus menyusut** — gejala awal kegagalan berat.

> 💡 **Formula lazim:** `replication.factor=3` + `min.insync.replicas=2` + `acks=all` — bertahan satu kegagalan broker tanpa mengorbankan keamanan tulis.

---

## Rangkuman

- Setiap partition punya **satu leader** + beberapa **follower**; total salinan = replication factor.
- **ISR = replica sehat & menyusul** — hanya anggota ISR yang dipromosikan jadi leader.
- **acks=0/1/all** menentukan kepastian tulis; `acks=all` baru bermakna dengan `min.insync.replicas` tepat.
- **Unclean election**: selamatkan ketersediaan dengan risiko kehilangan data — trade-off **durability vs availability**.

## Latihan

1. Sebutkan perbedaan **Replicas** dan **ISR** pada output `--describe`.
2. RF=3, min.insync.replicas=2: broker mana yang boleh mati tanpa menurunkan keamanan tulis?
3. Mengapa `acks=all` tanpa `min.insync.replicas` bisa menyesatkan?
4. Bandingkan **tunggu** vs **unclean election** saat seluruh ISR mati.
5. Hentikan satu broker di cluster latihan, amati perubahan ISR.

## Istilah

| Istilah | Arti |
|---------|------|
| Leader | Broker yang melayani baca/tulis partition |
| Follower | Salinan yang menyalin data dari leader |
| Replication factor | Jumlah total salinan partition |
| ISR | In-Sync Replicas — salinan sehat & menyusul |
| acks | Tingkat kepastian tulis: 0, 1, all |
| min.insync.replicas | Minimal ISR yang wajib mengonfirmasi tulis |
| Leader election | Pemilihan leader baru saat leader mati |
| Unclean leader election | Pemilihan leader dari follower yang tertinggal |

---

**Lanjut → [Pelajaran 9 — Producer: Key, Batching & Acks](09-producer.md)**
