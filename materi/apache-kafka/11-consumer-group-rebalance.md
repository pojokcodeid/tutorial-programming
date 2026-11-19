# Pelajaran 11 — Consumer Group & Rebalancing

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 7 (Offset & Lag)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan cara **consumer group membagi partition** secara eksklusif.
- Menguraikan **alur rebalancing**: join group, sync, assignment, dan resume.
- Membandingkan strategi assignment **Range, RoundRobin, dan CooperativeSticky**.
- Mengenali **penyebab rebalance tak terduga** dan cara meminimalkannya.

---

## Bagaimana satu group bekerja

Semua consumer dalam group memakai **group.id yang sama**. Saat bergabung, Kafka membagi seluruh partition secara **eksklusif**:

- **Satu partition → maksimal satu consumer** dalam satu group pada satu waktu.
- Tidak ada record diproses dua kali oleh group yang sama.
- Tidak ada partition terlewat — selalu ada yang bertugas.
- **Group berbeda saling independen** — masing-masing dari posisinya sendiri.

> ⚠️ Jumlah consumer **berguna** per group tidak boleh melebihi jumlah partition — sisanya duduk idle.

```text
Sebelum rebalance (group: analytics)     Sesudah consumer-c bergabung
┌────┬────┬────┐                          ┌────┬────┬────┐
│ P0 │ P1 │ P2 │                          │ P0 │ P1 │ P2 │
│ a  │ b  │ b  │                          │ a  │ b  │ c  │
└────┴────┴────┘                          └────┴────┴────┘
```

---

## Alur rebalancing langkah demi langkah

1. **JoinGroup** — semua anggota memberi tahu Kafka siap (dan topic yang diikuti); satu anggota ditunjuk **group leader**.
2. **Subscription/assignment** — **leader group** (bukan broker!) menghitung pembagian partition.
3. **SyncGroup** — hasil pembagian dikirim balik ke masing-masing consumer.
4. **Resume polling** — semua consumer lanjut `poll()` dengan tugas barunya.

Selama proses berlangsung, **pembacaan berhenti sesaat**. Rebalance terlalu sering membuat throughput anjlok dan lag melonjak.

---

## Strategi assignment

Kondisi: topic `user-events` P0–P4 (5 partition), 2 consumer:

```text
RANGE (default, per topic)
  consumer-a: P0,P1,P2   consumer-b: P3,P4
  → rentoran awal ke consumer pertama; bisa tidak merata lintas topic

ROUNDROBIN (merata lintas semua topic)
  consumer-a: P0,P2,P4   consumer-b: P1,P3
  → dibulatkan bergiliran; paling rata

COOPERATIVESTICKY (gangguan minimal)
  consumer-a: P0,P1,P2 (tetap)   consumer-b: P3,P4 (tetap)
  → hanya partition yang pindah dibagikan ulang
```

| Strategi | Kekurangan | Cocok |
|----------|-----------|-------|
| **Range** | Rentoran ke consumer pertama → bisa timpang | Default sederhana, sedikit topic |
| **RoundRobin** | Salah hitung bila subscription tiap consumer berbeda | Banyak topic, ingin merata |
| **CooperativeSticky** | Perilaku lebih kompleks dipantau | Production yang tak mau gangguan |

---

## Penyebab rebalance tak terduga

Rebalance wajar saat deploy. Rebalance **berulang tanpa jelas** adalah gejala masalah:

- **Poll terlalu jarang** — jeda antar `poll()` melewati `max.poll.interval.ms` (default 5 menit) → consumer dianggap mati.
- **Batch terlalu besar** — `max.poll.records` terlalu banyak, satu siklus memproses terlalu lama.
- **Proses lambat** — pemrosesan (mis. panggil API luar) butuh waktu lama.
- **Session timeout habis** — heartbeat putus (`session.timeout.ms` default 45 detik) karena GC panjang/jaringan.
- **Exception tak tertangani** — proses keluar tanpa leave group rapi.

```java
properties.put(ConsumerConfig.GROUP_ID_CONFIG, "analytics");
// strategi kooperatif: hanya partition yang pindah dibagikan ulang
properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
    CooperativeStickyAssignor.class.getName());

// beri ruang: proses batch harus selesai sebelum batas ini
properties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, "300000");   // 5 menit
properties.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "500");

properties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, "45000");
properties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, "15000");

properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
```

**Kunci: waktu memproses satu batch harus jauh di bawah `max.poll.interval.ms`.**

---

## Kapan rebalance itu wajar?

- **Scaling** — menambah/mengurangi consumer sesuai beban.
- **Rolling restart / deploy** — consumer lama keluar, baru masuk.
- **Kegagalan nyata** — consumer crash, tugas dialihkan.
- **Perubahan subscription** — consumer mengikuti topic baru.

Yang dihindari: **rebalance karena kekeliruan konfigurasi**. Pantau metrik `rebalance-rate-per-hour` dan waktu dalam status rebalancing.

---

## Kesalahan consumer group yang sering terjadi

- **`group.id` berbeda tiap deploy** — group baru dianggap belum pernah membaca → lari ke awal log atau melompat ke ujung.
- **Consumer melebihi jumlah partition** — idle dan percuma.
- **Pemrosesan berat tanpa membatasi batch** — interval terlampaui → rebalance loop.
- **Auto commit + proses panjang** — posisi ter-commit sebelum selesai.
- **Mengabaikan consumer mati** — lag membengkak bila sisa consumer tidak sanggup.

> 💡 **Cek cepat:** `kafka-consumer-groups.sh --describe --group NAMA` — perhatikan CURRENT-OFFSET bergerak dan LAG tidak membesar; kolom MEMBER kosong = ada partition belum ditugaskan.

---

## Rangkuman

- Dalam satu group: **satu partition hanya ke satu consumer** — eksklusif, tanpa duplikasi internal.
- Rebalance = **JoinGroup → assignment di leader group → SyncGroup → poll lagi**; pembacaan berhenti sesaat.
- **Range** per topic, **RoundRobin** merata lintas topic, **CooperativeSticky** minim gangguan.
- Rebalance tak terduga umumnya **batch terlalu besar / proses lambat melewati max.poll.interval.ms**.

## Latihan

1. Jelaskan aturan eksklusivitas: mengapa satu partition hanya ke satu consumer dalam satu group?
2. Urutkan **5 langkah alur rebalancing** dengan bahasamu sendiri.
3. Topic 5 partition, 2 consumer: bandingkan **Range** dan **RoundRobin**. Kapan hasilnya sama?
4. Sebutkan **4 penyebab rebalance tak terduga** dan solusinya.
5. Matikan satu proses consumer — amati `--describe` sebelum & sesudahnya.

## Istilah

| Istilah | Arti |
|---------|------|
| Consumer group | Consumer dengan group.id sama yang berbagi partition |
| Rebalancing | Pembagian ulang partition antar anggota group |
| Group leader | Anggota yang menghitung assignment |
| JoinGroup | Pendaftaran anggota saat mulai rebalance |
| SyncGroup | Penyebaran hasil assignment ke anggota |
| Range assignor | Default: rentoran partition per topic |
| RoundRobin assignor | Membulatkan lintas seluruh topic |
| CooperativeSticky | Hanya memindahkan partition yang perlu |

---

**Lanjut → [Pelajaran 12 — Integrasi & Event-Driven Architecture](12-integrasi-event-driven.md)**
