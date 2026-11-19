# Pelajaran 24 — Arsitektur Lanjutan

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 20–23

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Merancang **multi-datacenter** dengan MirrorMaker 2 + topologi/risiko.
- Menjelaskan **cluster linking** vs MirrorMaker.
- Menerapkan **multi-tenancy**: quota, batas, tata nama topik.
- Menjelaskan **rack/AZ awareness, skalabilitas KRaft, tiered storage**.

---

## Mengapa multi-datacenter?

Tiga alasan: **ketahanan wilayah**, **latensi** (baca lokal), **kepatuhan** (data tetap di wilayah).

- **Active-passive** — wilayah kedua menunggu, aktif saat bencana (sederhana).
- **Active-active** — dua wilayah menulis & membaca (kompleks: **penulisan ganda**).

Kafka **tidak menyalin antarcluster bawaan** → butuh alat replikasi.

```text
┌ Datacenter Utama (A) ┐   Mirror   ┌ Datacenter Wilayah (B) ┐
│ Cluster A (RF=3)     │◀──Maker 2──▶ Cluster B (RF=3)       │
│ Aplikasi A (lokal)   │   A↔B      │ Aplikasi B (lokal)     │
│ Schema Registry A    │            │ Schema Registry B      │
└──────────────────────┘            └────────────────────────┘

active-active: hindari dua wilayah menulis key yang sama
(pilih writer per key / per region)
```

---

## MirrorMaker 2 (berbasis Connect)

```properties
# mm2.properties
clusters = A, B
A.bootstrap.servers = kafka-a1:9092,kafka-a2:9092
B.bootstrap.servers = kafka-b1:9092,kafka-b2:9092

A->B.enabled = true
A->B.topics = order-events, payment-events, user-events.*
A->B.emit.heartbeats = true
A->B.sync.topic.acls.enabled = true

B->A.enabled = true
B->A.topics = order-events, payment-events

replication.policy.class = org.apache.kafka.connect.mirror.IdentityReplicationPolicy

tasks.max = 4
replication.factor = 3
```

- MM2 = **Kafka Connect** → ada topic internal `heartbeats`/`checkpoints` (kemajuan replikasi).
- **Filter topik** — menyalin semua (termasuk internal) = kesalahan umum.
- `IdentityReplicationPolicy` mempertahankan nama asli; kebijakan lain menambah awalan per cluster.

---

## Konflik active-active

Tiga strategi:

1. **Region affinity** — tiap key hanya ditulis di satu wilayah (mis. `user_id`) — paling aman.
2. **Last-write-wins + clock** — terima konflik, menang timestamp terbaru (bila toleran).
3. **Reconciler** — tulis dua wilayah, rekonsiliasi terpisah (paling kompleks).

Jangan lupa: **idempotensi consumer** dan **Schema Registry sinkron** (skema di A tak dikenal di B = masalah).

---

## Cluster linking vs MirrorMaker 2

| Aspek | MirrorMaker 2 | Cluster linking |
|-------|--------------|-----------------|
| **Lapisan** | Kafka Connect (client) | Di dalam broker |
| **Offset & metadata** | Topic checkpoints | Dikirim broker sumber |
| **Beban cluster sumber** | Memakai consumer (client) | Lebih efisien, tanpa jalur client |
| **Kontrol** | Konfigurasi Connect | Perintah admin sumber |

Masalah sama — pilih sesuai versi & kebutuhan: MM2 mapan & fleksibel, cluster linking lebih efisien untuk replikasi jangka panjang.

---

## Multi-tenancy & quota

- **Produce/fetch byte rate** — batas throughput per client-id/user.
- **Request rate** — batas permintaan/detik.
- **Connection rate** — batas koneksi baru.

```bash
# batasi aplikasi: 50 MB/s keluar & masuk, 80% request rate
kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --add-config 'produce_byte_rate=52428800,\
fetch_byte_rate=52428800,request_percentage=80' \
  --entity-type clients --entity-name billing-app

# batasi per user SCRAM
kafka-configs.sh --bootstrap-server localhost:9092 \
  --alter --add-config 'produce_byte_rate=10485760' \
  --entity-type users --entity-name reporting-team

# lihat quota
kafka-configs.sh --bootstrap-server localhost:9092 \
  --describe --entity-type clients --entity-name billing-app

# aturan topic per tim
kafka-topics.sh --bootstrap-server localhost:9092 --create \
  --topic team-a-events --partitions 6 --replication-factor 3 \
  --config retention.ms=2592000000 --config max.message.bytes=1048576
```

- **Satu client-id per aplikasi** → pemakaian terlacak.
- Quota = **throttling** (diperlambat), bukan diputus.
- `max.message.bytes` per topik mencegah pesan raksasa membanjiri broker.

---

## Rack / availability zone awareness

- `broker.rack` → **replica satu partition ke rak berbeda** → rak mati pun leader tetap ada.
- `client.rack` → consumer baca **replica lokal** dulu → hemat biaya jaringan antar-rak.
- **Rack-aware replica placement** = peningkatan ketahanan paling berharga pada klaster besar.

---

## Skalabilitas KRaft & tiered storage

- **Metadata di memori controller** — perencanaan partisi/topik harus masuk akal (jutaan metadata = masalah).
- **Tiered storage** — data **panas** (baru) di disk lokal, data **dingin** (retensi lama) di objek (S3); data lama di-stream on-demand → biaya disk turun.
- **Backup & DR** — replikasi antarwilayah + backup registry + RTO/RPO jelas.

> Prinsip: **sebagian besar masalah skala datang dari keputusan awal** — jumlah topik, retensi, pola akses.

---

## Kapan TIDAK diperlukan

- **Satu wilayah, satu tim, beban sedang** — RF 3 + retensi wajar sudah cukup.
- **Multi-datacenter tanpa uji failover** — salinan tak pernah diuji = tak ada.
- **Active-active tanpa strategi konflik** — data tidak konsisten.
- **Ribuan topik tanpa tata nama** — topik hantu menumpuk.
- **Quota tanpa pemantauan** — batas yang tak dipantau tak melindungi siapa pun.

> 💡 **Jalur evolusi wajar:** (1) satu cluster RF 3, (2) rack/AZ awareness, (3) quota + tata nama sebelum banyak tim, (4) multi-datacenter saat ada kebutuhan nyata (mulai active-passive), (5) tiered storage bila retensi panjang membebani biaya. **Tanpa melompati tahap.**

---

## Rangkuman

- **Active-passive** sederhana; **active-active** perlu strategi konflik (region affinity, LWW, reconciler).
- **MM2** = via Connect (client); **cluster linking** = di dalam broker.
- **Quota + tata nama + service account per aplikasi** = multi-tenancy adil.
- Evolusi: **satu cluster → rack awareness → quota → multi-DC → tiered storage**.

## Latihan

1. Tiga alasan **multi-datacenter** + tiga topologi.
2. MM2 di **lapisan apa**? Konsekuensinya bagi cluster sumber?
3. Skenario dua wilayah menulis key sama — apa yang terjadi + **3 strategi**.
4. Bandingkan **MM2 vs cluster linking** (lapisan, efisiensi, kontrol).
5. Lima langkah **evolusi arsitektur** + prinsipnya.

## Istilah

| Istilah | Arti |
|---------|------|
| Multi-datacenter | Kafka di lebih satu wilayah |
| MirrorMaker 2 | Replikasi antarcluster via Connect |
| Cluster linking | Replikasi antarcluster di broker |
| Active-passive | Wilayah kedua menunggu |
| Active-active | Dua wilayah sama-sama menulis |
| Region affinity | Key ditulis hanya di satu wilayah |
| Quota | Batas resource per client/user |
| Rack awareness | Replica tersebar antar rak/AZ |
| Tiered storage | Pemisahan data panas & dingin |

---

**Lanjut → [Pelajaran 25 — Proyek Akhir](25-proyek-akhir.md)**
