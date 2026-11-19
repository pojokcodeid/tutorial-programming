# Pelajaran 22 — Storage, Retention & Recovery

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 6–8 (partition, replication)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **struktur penyimpanan**: log, segment, index.
- Mengatur **retensi** waktu & ukuran beserta konsekuensinya.
- Membandingkan **retensi biasa vs compaction**.
- Menjelaskan **pemulihan**: ISR, leadership, unclean leader election.

---

## Bagaimana Kafka menyimpan data

Partition = **satu log di disk**, ditulis berurutan (append), dibaca dari offset.

| Komponen | Fungsi |
|----------|--------|
| **Log segment** | File record (`00000000000000000000.log` = offset awal) |
| **Index** | offset/timestamp → posisi byte (pencarian cepat) |
| **Active segment** | Sedang ditulisi; tak pernah dihapus retensi |
| **Log cleaner** | Proses **compaction** |

Append-only tanpa update in-place → tanpa B-tree/buffer besar → optimal untuk disk.

```text
Partition order-events (satu direktori)
┌ segment lama ┐ ┌ segment lama ┐ ┌ segment aktif ┐ ┌ .index ┐ ┌ .timeindex ┐
│ offset 0–9.999│ │10.000–19.999│ │20.000–sekarang│ │offset→byte│ │waktu→byte│
└──────────────┘ └─────────────┘ └──────────────┘ └─────────┘ └──────────┘

Retensi menghapus segment LAMA — tak perlu memotong isi file
Compaction: sisakan nilai TERAKHIR per key (untuk topic state)
```

---

## Retensi: waktu dan ukuran

- **`retention.ms`** — lama record bertahan (default 7 hari).
- **`retention.bytes`** — batas ukuran per partisi (default tak terbatas).

Mana yang lebih dulu tercapai, itulah yang berlaku. **Membaca tidak menghapus** — penghapusan murni berdasarkan umur/ukuran.

Retensi = **seberapa jauh kamu bisa replay** (perbaiki offset salah, bangun ulang projection, audit). Wajar: **7–30 hari** topik bisnis, **24 jam** log teknis.

```bash
# retensi 30 hari
kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --add-config retention.ms=2592000000 \
  --entity-type topics --entity-name order-events

# batasi 50 GB per partisi
kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --add-config retention.bytes=53687091200 \
  --entity-type topics --entity-name order-events

# lihat konfigurasi aktif
kafka-configs.sh --bootstrap-server localhost:9092 \
  --describe --entity-type topics --entity-name order-events

# topik baru dengan retensi sejak awal
kafka-topics.sh --bootstrap-server localhost:9092 --create \
  --topic payment-events --partitions 12 --replication-factor 3 \
  --config retention.ms=604800000 --config segment.bytes=134217728

# hapus record manual (PERMANEN)
kafka-delete-records.sh --bootstrap-server localhost:9092 \
  --offset-json-file delete-before-offset.json
```

- `retention.ms` dihitung dari **waktu tulis**, bukan baca.
- `segment.bytes` menentukan granularitas penghapusan.

---

## Compaction: retensi untuk data berbasis kunci

Untuk topic berperilaku **database per kunci** (checkpoint, profil, konfigurasi):

- Tidak hapus berdasarkan umur → **pertahankan nilai terakhir per kunci**.
- Urutan key tak dijamin; **setiap key dijamin ada minimal 1 record**.
- Berjalan di background (log cleaner) — I/O signifikan pada topic besar.

```text
RETENSI BIASA (order-events, 7 hari)
  offset 0: user-1 login ─┐ semua bertahan sampai
  offset 1: user-2 login  │ lewat 7 hari → DIHAPUS
  offset 3: user-3 login ─┘

COMPACTION (user-profile, cleanup.policy=compact)
  key=user-1: {name:"Andi"}        ─┐
  key=user-2: {name:"Budi"}         │ setelah compaction:
  key=user-1: {name:"Andi Wibowo"}  │ user-1 hanya nilai TERAKHIR
  key=user-3: {name:"Citra"}       ─┘

KONFIGURASI
  cleanup.policy=compact, min.cleanable.dirty.ratio=0.5, segment.bytes=104857600

              retention biasa          compaction
  hapus       waktu / ukuran           key lama (nilai terakhir menang)
  cocok untuk event / riwayat          state per kunci / checkpoint
  jaminan     semua dalam retensi      setiap key ada ≥1 record
```

Cocok untuk **state store changelog** (Kafka Streams) — pemulihan cukup nilai terakhir.

---

## Replication & pemulihan

- **Leader** melayani baca/tulis; **follower** meniru.
- **ISR** = replica yang dianggap sinkron.
- **`min.insync.replicas`** = minimum sinkron agar write aman (RF=3, min=2 → toleransi 1 kegagalan).
- Leader mati → **leader election** dari ISR.
- **Unclean leader election** = leader dari luar ISR → **record terbaru hilang permanen** (matikan untuk data penting).

```properties
# BROKER
default.replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
log.dirs=/var/kafka/data,/var/kafka/data2
log.retention.hours=168

# PRODUCER (topik penting)
acks=all
enable.idempotence=true
max.in.flight.requests.per.connection=5

SAAT BROKER MATI
  1. ISR menyusut (min.insync bisa terlampaui)
  2. Leader baru dari ISR tersisa
  3. Producer menerima NotEnoughReplicas → menunggu/gagal jujur
  4. Broker kembali → follower menyusul dari leader
  5. ISR pulih → normal

PEMERIKSAAN
  kafka-topics.sh --describe --under-replicated-partitions   # kosong
  kafka-metadata.sh --describe
```

`acks=all` + `min.insync.replicas=2` = inti daya tahan: sukses = **dua mesin** menyimpannya.

---

## Kesalahan yang sering terjadi

- **Retensi default tanpa dipertimbangkan** (audit kurang / disk penuh).
- **`retention.bytes` tak terbatas** pada topik besar → disk broker penuh → cluster ikut terseret.
- **RF=1** di produksi → satu kegagalan disk = data hilang.
- **`min.insync.replicas=1`** → write bisa lolos hanya di satu mesin.
- **Unclean leader election demi ketersediaan** → data hilang diam-diam.
- **SSD tanpa memperhatikan IOPS** — compaction/snapshot/replikasi berebut I/O.

> 💡 **Checklist sehat:** (1) RF ≥ 3 + min.insync = 2, (2) unclean election mati, (3) retensi per topik sesuai kebutuhan replay, (4) pantau disk & ukuran partisi, (5) **uji pemulihan berkala** di staging (matikan 1 broker, pastikan ISR pulih & data utuh).

---

## Rangkuman

- Partition = **log append-only** → **segment** (penghapusan) + **index** (pencarian).
- **Retensi** = jarak replay; **compaction** = nilai terakhir per kunci.
- **RF + min.insync + acks=all** = write tersimpan di beberapa mesin.
- Pemulihan via **ISR**; **unclean election** berisiko kehilangan data.

## Latihan

1. Bagaimana **segment + index** membuat penghapusan & pencarian efisien?
2. Mengapa **membaca tidak menghapus**? Kapan penghapusan terjadi?
3. **Retensi vs compaction** — kapan masing-masing tepat?
4. RF=3, min.insync=2, satu broker mati → producer masih bisa menulis? Dua mati?
5. Risiko **unclean leader election** + cara mencegahnya.

## Istilah

| Istilah | Arti |
|---------|------|
| Log (partition) | Urutan record append-only |
| Segment | Potongan file log = unit penghapusan |
| Index | Pemetaan offset/waktu → byte |
| Retensi | Penghapusan berdasar waktu/ukuran |
| Log compaction | Sisakan nilai terakhir per kunci |
| ISR | Replica yang sinkron dengan leader |
| Leader election | Pemilihan broker pemimpin |
| Unclean leader election | Leader dari luar ISR — berisiko data |

---

**Lanjut → [Pelajaran 23 — Performance Tuning](23-performance-tuning.md)**
