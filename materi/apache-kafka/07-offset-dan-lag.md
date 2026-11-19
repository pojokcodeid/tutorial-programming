# Pelajaran 7 — Offset, Consumer Position & Lag

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 5–6

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Membedakan **current position, committed offset, dan log end offset**.
- Menjelaskan **auto commit vs manual commit** beserta risikonya.
- Menjelaskan **auto.offset.reset** dan kapan earliest/latest dipakai.
- **Menghitung consumer lag** serta menjalankan reset offset dengan aman.

---

## Tiga angka yang perlu dikenal

| Istilah | Arti | Siapa memegang |
|---------|------|----------------|
| **Log end offset** | Offset tertinggi yang sudah ada (ujung log) | Broker |
| **Current position** | Offset berikutnya yang akan dibaca | Consumer (di memori) |
| **Committed offset** | Penanda kemajuan agar restart tidak mulai nol | Kafka (per group + partition) |

**Consumer lag = log end offset − committed offset.**

```text
Partition 0 — log end offset = 20
┌──────────────────────────────────────────────────┐
│ record offset 0 ... 13 (sudah diproses)          │
└──────────────────────────────────────────────────┘
                    ▲ committed offset = 14
Consumer (group analytics): position 14 → baca 14, 15, 16...

LAG = 20 − 14 = 6 record belum diproses
lag nol = consumer sudah menyusul (catch up)
```

Lag tinggi bisa berarti consumer lambat, consumer mati, atau ada lonjakan trafik.

---

## Auto commit vs manual commit

**Auto commit** (`enable.auto.commit=true`, bawaan) menyimpan posisi berkala (`auto.commit.interval.ms`, default 5 detik) setiap `poll()`:

- **Commit bisa terjadi sebelum pemrosesan selesai** → consumer mati di titik itu = record terlewat (at-most-once).
- **Commit bisa gagal tanpa sadar** → restart membaca ulang (at-least-once).

**Manual commit** (`enable.auto.commit=false`) memberi kendali penuh — commit hanya setelah tuntas.

```java
// AUTO COMMIT (bawaan)
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
properties.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "5000");
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    proses(records);   // posisi bisa ter-commit sebelum proses selesai
}

// MANUAL COMMIT (lebih aman untuk efek samping)
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    try {
        for (ConsumerRecord<String, String> r : records) {
            simpanKeDatabase(r);
        }
        consumer.commitSync();      // commit hanya bila semua sukses
    } catch (Exception e) {
        log.error("proses gagal, offset belum dicommit", e);
        // jangan commit: record diproses ulang saat restart
    }
}
```

Karena diproses ulang bisa menggandakan efek, pasangkan manual commit dengan **consumer idempoten** (pelajaran Delivery Semantics).

---

## auto.offset.reset

Berlaku ketika consumer membaca partition **tanpa committed offset** (group baru / offset lama terhapus retensi):

| Nilai | Perilaku | Cocok untuk |
|-------|----------|-------------|
| `earliest` | Mulai offset 0 — seluruh riwayat | Backfill, migrasi, replay |
| `latest` | Mulai ujung log — hanya record baru | Proses real-time tanpa riwayat |
| `none` | Error bila tak ada committed offset | Memaksa konfigurasi eksplisit |

**Tidak ada pilihan "lanjut dari terakhir" secara ajaib** — bila committed offset ada, dipakai itu; bila tidak ada, barulah aturan ini berlaku.

---

## Mengukur dan mereset offset

```bash
# ukur lag suatu group
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group analytics

# ujung log tiap partition
docker exec kafka /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server localhost:9092 --topic user-events

# RESET — consumer harus berhenti dulu!
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --group analytics \
  --topic user-events --reset-offsets --to-earliest --execute

# periksa sebelum menyalakan consumer lagi
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group analytics
```

- `--reset-offsets` **ditolak** bila group masih aktif.
- Pilihan lain: `--to-latest`, `--shift-by`, `--to-datetime`.
- **Selalu deskripsikan ulang setelah reset** sebelum consumer dinyalakan.

---

## Lag: membaca angka dengan benar

- **Lag stabil kecil** — consumer sehat.
- **Lag naik terus** — consumer tidak sanggup (lambat/error/kurang paralelisme).
- **Lag melonjak lalu turun** — normal setelah lonjakan atau restart.
- **Lag sangat besar setelah downtime** — wajar bila banyak record tertunda; masalah bila SLA ketat.

Di production, pantau **per partition** — rata-rata menutupi satu partition bermasalah. Alert memakai **ambang lag maksimum + waktu tertinggal**, bukan angka tunggal.

---

## Kesalahan offset yang paling sering terjadi

- **Auto commit untuk pemrosesan berat** — poll terlalu jauh memicu rebalance; record bisa terlewat.
- **Commit sebelum selesai** — record hilang tanpa diproses sempurna.
- **Reset saat group aktif** — perintah ditolak / posisi kacau.
- **Mengira lag = record hilang** — lag hanya tertinggal; record tetap di log sampai kena retensi.
- **Mengabaikan auto.offset.reset** — group baru tiba-tiba membaca (atau melewatkan) riwayat.

> 💡 **Resep aman:** `enable.auto.commit=false` + `auto.offset.reset=earliest` + commit setelah sukses + consumer idempoten.

---

## Rangkuman

- **Lag = log end offset − committed offset**; committed offset disimpan per group & partition.
- **Auto commit berisiko**; manual commit + idempotensi untuk pemrosesan penting.
- `auto.offset.reset` hanya berlaku **saat belum ada committed offset**.
- Reset offset hanya saat group **tidak aktif**; lag dipantau per partition.

## Latihan

1. Bedakan **log end offset, current position, committed offset** (satu kalimat masing-masing).
2. Hitung lag: log end 1.500, committed 1.230 — berapa? Artinya?
3. Kapan `earliest` tepat? Kapan `latest`?
4. Mengapa auto commit berisiko pada record yang sedang diproses?
5. Baca 10 record, restart consumer — ia mulai dari offset terakhir? Buktikan dengan `--describe`.

## Istilah

| Istilah | Arti |
|--------|------|
| Log end offset | Offset tertinggi tersedia di partition |
| Current position | Offset berikutnya yang dibaca consumer |
| Committed offset | Penanda kemajuan per group & partition |
| Consumer lag | Selisih log end dengan committed |
| Auto commit | Penyimpanan posisi otomatis berkala |
| Manual commit | Penyimpanan posisi eksplisit |
| auto.offset.reset | Aturan saat belum ada committed offset |
| Replay | Membaca ulang dari offset awal |

---

**Lanjut → [Pelajaran 8 — Replication, ISR & Durability](08-replication-durability.md)**
