# Pelajaran 14 — Delivery Semantics: At-Least / At-Most / Exactly Once

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 12–13

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **tiga semantik pengiriman** beserta risiko hilang dan ganda.
- Menelusuri bagaimana **konfigurasi menentukan semantik** yang terjadi.
- Menjelaskan **exactly-once** di Kafka: idempotence dan transaksi.
- **Memilih semantik** sesuai kebutuhan bisnis dan biayanya.

---

## Tiga semantik, satu pilihan sadar

| Semantik | Arti praktis | Risiko |
|----------|--------------|--------|
| **At-most-once** | Diproses **sekaligus atau tidak sama sekali** | **Bisa hilang** — tidak pernah dobel |
| **At-least-once** | Diproses **minimal sekali** | **Bisa dobel** — tidak pernah hilang |
| **Exactly-once** | Diproses **persis sekali** | Tanpa hilang, tanpa dobel (biaya tinggi) |

Semantik adalah hasil gabungan keputusan di **producer** (acks, retries) dan **consumer** (urutan commit).

---

## Bagaimana semantik terbentuk

**Producer:**

- `acks=0`, tanpa retry → **at-most-once**.
- `acks=1/all` + retry → **at-least-once** (bisa ganda bila konfirmasi hilang).
- `acks=all` + `enable.idempotence=true` → tidak dobel, tidak bolak-balik.

**Consumer:**

- **Commit SEBELUM proses** → at-most-once (crash → hilang).
- **Commit SESUDAH proses** → at-least-once (crash → ganda).
- **Commit + proses atomik** → exactly-once (transaksi Kafka).

> **At-least-once adalah default yang paling sering didapat** ketika melakukan hal yang benar (commit setelah sukses + retry).

---

## Menelusuri skenario kegagalan

```text
SKENARIO: proses 10 record lalu crash SEBELUM commit

AT-MOST-ONCE (commit sebelum proses)
  commit(10) → crash saat proses
  → restart dari 10 → record 0..9 TIDAK PERNAH diproses (hilang)

AT-LEAST-ONCE (commit sesudah proses)
  proses 0..9 → crash SEBELUM commit
  → restart dari 0 → record 0..9 diproses LAGI (ganda)
  → solusi: idempoten (upsert) → hasil akhir tetap benar

EXACTLY-ONCE (transaksi Kafka)
  proses + commit dalam SATU transaksi atomik
  → crash di titik mana pun: batch diulang utuh TANPA dobel

ANALOGI WARUNG
  at-most-once  : catatan dulu, barang belum tentu diantar → bisa hilang
  at-least-once : barang diantar, catatan menyusul      → bisa dobel
  exactly-once  : serah-terima satu tanda tangan         → persis sekali
```

---

## Exactly-once di Kafka

Dua mekanisme:

- **Idempotent producer** — hapus duplikat akibat retry (sequence number per partition).
- **Transactions** — ikat "tulis ke topic A & B" atau "proses lalu commit offset" jadi unit atomik: berhasil semua atau batal semua.

Syarat: producer transaksional + consumer `isolation.level=read_committed` + (Kafka Streams/Connect) `processing.guarantee=exactly_once_v2`. Transaksi berlaku **dalam satu cluster**.

```java
// PRODUCER TRANSAKSIONAL
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "order-service-tx");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.initTransactions();

producer.beginTransaction();
try {
    producer.send(new ProducerRecord<>("order-events", order));
    producer.send(new ProducerRecord<>("payment-events", payment));
    producer.sendOffsetsToTransaction(offsets, groupMetadata);  // offset ikut transaksi
    producer.commitTransaction();
} catch (Exception e) {
    producer.abortTransaction();    // seolah tidak pernah terjadi
    throw e;
}

// CONSUMER: hanya baca transaksi yang sudah commit
props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
```

- `transactional.id` = pengenal transaksi yang bertahan saat producer restart → transaksi menggantung otomatis dibatalkan.
- `sendOffsetsToTransaction()` = **memproses data + catat posisi baca atomik**.
- `read_committed` wajib — tanpanya, EOS di producer jadi percuma.

---

## Memilih semantik

| Kebutuhan | Pilihan | Catatan |
|-----------|---------|---------|
| Log metrik / telemetry | **At-most-once** | Hilang tak berpengaruh; paling murah |
| Notifikasi, sinkronisasi | **At-least-once** + idempoten | Paling umum; ganda ditangani upsert |
| Finansial, ganda = salah | **Exactly-once** | Butuh transaksi; latensi & kompleksitas |
| Enrichment stream-to-stream | **EOS** (Kafka Streams) | Ganda mengubah hasil agregasi |

Sering **at-least-once + idempotensi** adalah jawaban praktis terbaik.

---

## Miskonsepsi yang berujung insiden

- **"acks=all = exactly-once"** — tidak; duplikat retry masih mungkin tanpa idempotence.
- **"Retries tinggi selalu aman"** — tanpa idempotence, justru menaikkan peluang ganda.
- **"Auto commit pasti aman"** — bisa commit sebelum proses tuntas → at-most-once tak direncanakan.
- **"Exactly-once gratis"** — ada latensi, koordinasi, batasan antar cluster.
- **"Idempotensi hanya di Kafka"** — idempotensi app tetap dibutuhkan untuk sistem luar (DB/API).

> 💡 **Panduan:** (1) apa yang lebih merugikan — hilang atau dobel? (2) bisakah sistem luar menyaring duplikat murah? Upset murah → **at-least-once + idempoten** hampir selalu terbaik.

---

## Rangkuman

- **At-most-once** (bisa hilang), **at-least-once** (bisa dobel), **exactly-once** (persis sekali).
- Terbentuk dari **urutan commit vs proses** dan **acks/retries/idempotence**.
- EOS Kafka = **idempotent producer + transaksi** + consumer `read_committed`.
- Pilihan praktis: **at-least-once + idempoten** — tidak hilang, ganda ditangani upsert.

## Latihan

1. Definisikan tiga semantik (satu kalimat + risiko masing-masing).
2. Konfigurasi apa yang menghasilkan at-most-once di consumer? Di producer?
3. Mengapa at-least-once = "default dari melakukan hal yang benar"?
4. Peran `read_committed` dan `sendOffsetsToTransaction()` dalam EOS?
5. Pilih semantik + alasan untuk: metrik, notifikasi, pembayaran.

## Istilah

| Istilah | Arti |
|---------|------|
| At-most-once | Maksimal sekali — bisa hilang |
| At-least-once | Minimal sekali — bisa dobel |
| Exactly-once | Persis sekali |
| Idempotence (producer) | Retry tanpa duplikat di broker |
| Transaksi Kafka | Unit atomik tulis + commit offset |
| transactional.id | Pengenal transaksi lintas restart |
| isolation.level | read_uncommitted vs read_committed |
| Idempotensi consumer | Proses ulang tak ubah hasil (upsert) |

---

**Lanjut → [Pelajaran 15 — Transactional Outbox Pattern](15-transactional-outbox.md)**
