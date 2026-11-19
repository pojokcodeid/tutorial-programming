# Pelajaran 10 — Consumer: Membaca & Memproses Data

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 7–9 (offset, lag, consumer group)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Memilih **titik awal baca**: earliest, latest, berbasis timestamp, dan `seek()`.
- Menulis siklus kerja consumer: **poll → proses → commit** dengan benar.
- Membandingkan **commitSync** dan **commitAsync**.
- Menangani **poison pill** dan menerapkan **consumer idempoten**.

---

## Siklus dasar: poll, proses, commit

1. **`poll()`** — ambil record (maksimal `max.poll.records`).
2. **Proses** — simpan ke DB, panggil API, dsb.
3. **Commit** — catat kemajuan (offset berikutnya).
4. Ulangi.

Dua perangkap utama:

- Memproses terlalu lama → melewati `max.poll.interval.ms` → **rebalance**.
- Commit terlalu awal → record **hilang** saat crash.

```text
poll() ──▶ Proses batch ──▶ commit (sync/aman)
   ▲             │
   │             ▼
   │      Proses GAGAL? → JANGAN commit; retry / dead-letter
   │             │
 Idempotensi ◀──┘
 (aman bila diproses ulang)

Prinsip: commit SELALU setelah proses tuntas
crash di tengah → diproses ulang → konsumen harus idempoten
```

---

## Titik awal baca: earliest, latest, dan timestamp

Sebelum memproses, tentukan **posisi awal**:

- **`earliest`** — mulai offset 0 = **seluruh riwayat** yang masih ada di log.
- **`latest`** — mulai ujung log = hanya **record baru** sesudah consumer berjalan.

Keduanya hanya berlaku **saat belum ada committed offset** — begitu ada, posisi terakhir menang, kecuali `seek()` atau reset eksplisit. Untuk titik waktu (mis. *"sejak insiden pukul 10:05"*), baca dari **timestamp record** dengan `--offset <epoch millis>` (CLI) atau `offsetsForTimes()` + `seek()` (API).

| Skenario | Titik awal |
|----------|-----------|
| Real-time (notifikasi) | **latest** |
| Backfill / migrasi / state awal service | **earliest** |
| Audit sejak waktu tertentu | **timestamp** |
| Debug satu record | **`--partition` + `--offset`** |

```bash
# earliest: seluruh riwayat yang masih ada
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic user-events --from-beginning

# latest: hanya record baru (default tanpa opsi offset)
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic user-events

# dari timestamp: epoch millis (nilai besar = waktu, bukan offset)
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic user-events \
  --partition 0 --offset 1795716300000
```

Di aplikasi: `offsetsForTimes()` → `seek(tp, offset)` → **commit setelah proses tuntas** agar posisi bertahan restart (bila `seek()` tanpa commit, posisi melonjak balik ke committed offset lama).

---

## Pola consumer andal (Java)

```java
Properties props = new Properties();
props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ConsumerConfig.GROUP_ID_CONFIG, "analytics");
props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class.getName());
props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");   // komit manual
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "500");

KafkaConsumer<String, JsonNode> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("user-events"));

while (running) {
    ConsumerRecords<String, JsonNode> records = consumer.poll(Duration.ofMillis(500));
    if (records.isEmpty()) continue;
    try {
        for (ConsumerRecord<String, JsonNode> r : records) {
            simpanKeDatabase(r);          // idempoten: upsert berdasarkan event_id
        }
        consumer.commitSync();            // hanya setelah semua sukses
    } catch (Exception e) {
        log.error("gagal memproses batch: tidak dicommit", e);
    }
}
```

- `enable.auto.commit=false` + `commitSync()` = **at-least-once** yang benar.
- `max.poll.records=500` menjaga siklus ringan & jauh di bawah `max.poll.interval.ms`.
- Batch gagal tanpa commit → terbaca ulang → **wajib idempoten**.

---

## commitSync vs commitAsync

| Aspek | `commitSync()` | `commitAsync()` |
|-------|----------------|-----------------|
| **Blokir?** | Ya — tunggu broker | Tidak — lanjut sambil jalan |
| **Kegagalan** | Exception (bisa ditangani) | Callback; terakhir menang |
| **Cocok untuk** | Komit kritis setelah sukses | Komit sering di batch besar |

Pola lazim: `commitAsync` selama memproses, `commitSync sekali di akhir batch`.

```java
while (running) {
    ConsumerRecords<String, JsonNode> records = consumer.poll(Duration.ofMillis(500));
    int i = 0;
    for (ConsumerRecord<String, JsonNode> r : records) {
        simpanKeDatabase(r);
        if (++i % 100 == 0) consumer.commitAsync();   // komit berkala
    }
    try {
        consumer.commitSync();                        // jaminan terakhir
    } catch (CommitFailedException e) {
        log.error("rebalance saat commit", e);
        break;                                        // baca ulang offset lama
    }
}
```

---

## Pemrosesan aman per partition

- **Urutan per key wajib** → proses record satu partition berurutan.
- **State per partition** → simpan per `TopicPartition`, bukan global.
- **Commit presisi** → `Map<TopicPartition, OffsetAndMetadata>`.

```java
Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
for (TopicPartition tp : records.partitions()) {
    List<ConsumerRecord<String, JsonNode>> partRecs = records.records(tp);
    for (ConsumerRecord<String, JsonNode> r : partRecs) {
        simpanKeDatabase(r);                      // urut per partition
    }
    long last = partRecs.get(partRecs.size() - 1).offset() + 1;
    offsets.put(tp, new OffsetAndMetadata(last));
}
consumer.commitSync(offsets);    // hanya partition yang selesai
```

- Satu partition gagal **tidak menarik mundur** offset partition lain.
- Committed offset = **berikutnya** yang dibaca (makanya +1).

---

## Poison pill dan consumer idempoten

**Poison pill** = record yang selalu membuat crash → offset tak pernah commit → **alur mandek**.

Penanganan:

- **Dead-letter topic (DLT)** — record dialihkan, offset tetap commit.
- **Validasi cepat + skip ber-log** — data kadaluarsa/salah format ditinggalkan.
- **Retry terbatas** → setelah batas, ke DLT.

```java
for (ConsumerRecord<String, JsonNode> r : records) {
    JsonNode payload;
    try {
        payload = parser.readTree(r.value());
        wajibAda(payload, "event_id", "event_type");
    } catch (Exception e) {
        kirimKeDeadLetter(r, e);       // JANGAN hentikan alur
        log.warn("record rusak → DLT: offset {}", r.offset());
        continue;
    }
    try {
        upsertBerdasarkanEventId(payload);   // idempoten
    } catch (Exception e) {
        log.error("proses gagal", e);
        throw e;                        // hentikan batch: jangan commit
    }
}
```

- Pisahkan **kegagalan format** (rusak → DLT) dan **kegagalan proses** (error sistem → jangan commit).
- **Idempoten** = upsert berdasarkan `event_id` → pembacaan ulang tak menggandakan data.

---

## Kesalahan consumer di aplikasi

- **Auto commit aktif** untuk proses kritis → record terlewat.
- **Batch tanpa batas** → rebalance berulang.
- **Commit sebelum selesai** → record hilang.
- **Tanpa idempotensi** → data ganda saat replay.
- **Poison pill tanpa DLT** → konsumsi mandek.
- **Exception tak tertangani** → proses mati, lag melonjak.

> 💡 **Checklist production:** `enable.auto.commit=false` · `max.poll.records` diatur · parsing try-catch + DLT · idempoten · `auto.offset.reset` disengaja.

---

## Rangkuman

- **poll → proses → commit** — komit hanya setelah tuntas; batch dibatasi `max.poll.records`.
- **Titik awal baca**: **earliest** (riwayat), **latest** (baru), **timestamp/seek** (presisi) — hanya berlaku sebelum ada committed offset.
- **commitAsync** berkala, **commitSync** jaminan akhir; **poison pill → dead-letter topic** lalu tetap commit.
- **Idempoten (upsert event_id)** membuat at-least-once aman.

## Latihan

1. Bandingkan **earliest** dan **latest**: kapan tepat, dan mengapa hanya berlaku sebelum ada committed offset?
2. Baca record dari **waktu tertentu** (epoch millis), buktikan dengan `--partition --offset`.
3. Tulis ulang siklus consumer 4 langkah + dua perangkap tiap tahap.
4. Bandingkan `commitSync` vs `commitAsync`.
5. Tanpa DLT apa yang terjadi pada poison pill? Uji idempotensi dengan upsert dua kali.

## Istilah

| Istilah | Arti |
|---------|------|
| earliest | Baca dari offset paling awal tersedia |
| latest | Baca dari ujung log (record baru) |
| offsetsForTimes + seek | Baca dari timestamp tertentu |
| poll() | Ambil batch record dari partition |
| max.poll.records | Maks record per poll |
| commitSync | Commit bloking + bisa ditangani |
| commitAsync | Commit non-bloking (callback) |
| Poison pill | Record yang selalu bikin gagal |
| Dead-letter topic | Topic tujuan record bermasalah |
| Idempoten | Proses ulang tak mengubah hasil |
| Upsert | Insert/update — kunci idempotensi |

---

**Lanjut → [Pelajaran 11 — Consumer Group & Rebalancing](11-consumer-group-rebalance.md)**
