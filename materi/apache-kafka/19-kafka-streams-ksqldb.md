# Pelajaran 19 — Kafka Streams & ksqlDB

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 12–18

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **stream vs table** dan **time window**.
- Menjelaskan arsitektur **Kafka Streams**: topology, state store, repartition.
- Menulis contoh **filter, map, agregasi, join**.
- Membandingkan **Kafka Streams vs ksqlDB**.

---

## Stream dan table

- **Stream** — urutan record **append-only**; setiap record fakta baru (pesanan, klik, sensor).
- **Table** — **state terkini** per kunci (saldo, profil, stok); hasil **pengurangan** stream.

**Table adalah snapshot dari stream.** Butuh "nilai terakhir key X" → table; butuh "setiap peristiwa" → stream.

```text
Topic in ──▶ filter + map ──▶ groupBy + aggregate (repartition) ──▶ Topic out
order-events                    state store: penjualan per jam        sales-per-hour
                                window: 1 jam (tumbling)

state store lokal + changelog topic untuk pemulihan & rebalance
```

---

## Time window

| Bentuk | Karakter | Contoh makna |
|--------|----------|--------------|
| **Tumbling** | Berdampingan, tanpa tumpang tindih | Penjualan per jam |
| **Hopping** | Langkah < ukuran (tumpang tindih) | "5 menit terakhir" |
| **Session** | Dinamis, tumbuh diam saat ada aktivitas | Sesi browsing |

---

## Kafka Streams: agregasi per jam (Java)

```java
StreamsBuilder builder = new StreamsBuilder();
KStream<String, OrderEvent> orders =
    builder.stream("order-events", Consumed.with(Serdes.String(), orderSerde));

orders
  .filter((k, v) -> v != null && "PAID".equals(v.getStatus()))
  .map((k, v) -> new KeyValue<>(v.getUserId(), v))          // repartition by user
  .groupByKey()
  .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
  .aggregate(
      () -> 0L,
      (user, order, total) -> total + order.getTotal(),
      Materialized.<String, Long, WindowStore<Bytes, byte[]>>as("sales-per-hour")
          .withKeySerde(Serdes.String()).withValueSerde(Serdes.Long())
  )
  .toStream()
  .map((wk, total) -> new KeyValue<>(wk.key() + "@" + wk.window().startTime(), total))
  .to("sales-per-hour", Produced.with(Serdes.String(), Serdes.Long()));
```

- `filter`/`map` = per record, tanpa state (murah, paralel per partition).
- `groupByKey` = **repartition** (titik termahal — pilih kunci tepat sejak awal).
- `Materialized.as(...)` = **state store** + **changelog** → pemulihan tanpa baca dari nol.

---

## ksqlDB: agregasi yang sama tanpa kode

```sql
CREATE STREAM orders (
  order_id VARCHAR, user_id VARCHAR, status VARCHAR, total BIGINT
) WITH (KAFKA_TOPIC='order-events', VALUE_FORMAT='AVRO', PARTITIONS=6);

CREATE STREAM paid_orders AS SELECT * FROM orders WHERE status = 'PAID';

CREATE TABLE sales_per_hour AS
  SELECT user_id,
         HOPPING_WINDOW(timestamp, 3600000, 3600000) AS window,
         SUM(total) AS revenue, COUNT(*) AS orders
  FROM paid_orders
  GROUP BY user_id, HOPPING_WINDOW(timestamp, 3600000, 3600000)
  EMIT CHANGES;

SELECT * FROM sales_per_hour WHERE user_id = 'USR-1001' EMIT CHANGES;
```

- **CSAS/CTAS** = inti ksqlDB: satu pernyataan → topik baru yang terus diperbarui.
- `HOPPING_WINDOW` ≡ `TimeWindows` di Streams — konsep sama, sintaks berbeda.
- `EMIT CHANGES` = query **kontinu**, bukan snapshot.

---

## Kafka Streams vs ksqlDB

| Aspek | Kafka Streams | ksqlDB |
|-------|--------------|--------|
| **Bentuk** | Pustaka JVM (bagian aplikasi) | Server + SQL (layanan terpisah) |
| **Ekspresivitas** | Penuh (join kompleks, custom) | Terbatas operator SQL |
| **Mulai cepat** | Proyek + build + deploy | Satu pernyataan SQL |
| **Tim** | Backend JVM | Analis / engineer SQL |
| **Cocok untuk** | Logika inti produk | Prototipe, eksplorasi, pipeline ringan |

> Praktis: **ksqlDB untuk prototipe** (menit), pindah ke **Streams** saat logika jadi bagian aplikasi inti.

---

## Operasi umum & perangkap

- **Filter & map** — murah, tanpa state.
- **Join** — stream–stream butuh **jendela waktu**; stream–table = lookup state terkini.
- **Agregasi** — selalu **repartition + state store**; perhatikan ukuran & retensi.
- **Deduplikasi** — `event_id` sebagai kunci + jendela.
- **Grace period** — tanpanya, record terlambat bisa masuk jendela yang sudah ditutup.

> ⚠️ **Jebakan:** repartition tak diperhatikan (biaya nyata) · state store tanpa jendela (menumpuk) · late events tanpa grace · HA tanpa standby replicas · mengira query ksqlDB transaksional (setidaknya sekali).

> 💡 **Cara pilih:** (1) Perlu SQL/eksplorasi? → ksqlDB. (2) Logika jadi bagian app + CI? → Streams. (3) Operator tak tersedia di SQL? → Streams (atau Flink bila jauh melampaui Kafka).

---

## Rangkuman

- **Stream** = fakta; **table** = state terkini (snapshot stream).
- **Streams**: topology + **state store** + changelog.
- **ksqlDB**: `CREATE STREAM/TABLE AS SELECT` + jendela — cepat untuk prototipe.
- Agregasi → **repartition & state store**; perhatikan **grace period**.

## Latihan

1. Jelaskan **stream vs table** dengan contoh nyata.
2. Mengapa `groupByKey` memicu **repartition** dan apa biayanya?
3. Bedakan **tumbling / hopping / session** + skenario masing-masing.
4. Tulis ulang agregasi per jam dalam **ksqlDB** — bandingkan dengan versi Java.
5. Bila **state store hilang**, bagaimana Streams memulihkannya?

## Istilah

| Istilah | Arti |
|---------|------|
| Kafka Streams | Pustaka pemrosesan stream dalam aplikasi |
| ksqlDB | Server SQL atas stream Kafka |
| Stream | Urutan fakta append-only |
| Table | State terkini per kunci |
| State store | Penyimpanan lokal hasil agregasi/join |
| Changelog topic | Rekaman perubahan state store |
| Repartition | Pindah partition karena kunci berubah |
| Time window | Potongan waktu agregasi |

---

**Lanjut → [Pelajaran 20 — Security: SSL, SASL & ACL](20-security-acl.md)**
