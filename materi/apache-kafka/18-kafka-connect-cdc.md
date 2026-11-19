# Pelajaran 18 — Kafka Connect & CDC

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 15 (Outbox), 17 (Schema Registry)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **arsitektur Kafka Connect**: worker, connector, tasks, converters.
- Membedakan **Source vs Sink** serta mode **distributed vs standalone**.
- Menjelaskan **offset tracking** & idempotensi saat restart.
- Menerapkan ide **CDC dengan Debezium** beserta alurnya.

---

## Apa itu Kafka Connect?

Kerangka integrasi **berbasis konfigurasi** — tanpa menulis kode producer/consumer:

- **Source connector** — dari sistem luar → Kafka (PostgreSQL, Debezium, S3, file, API).
- **Sink connector** — dari Kafka → sistem tujuan (Elasticsearch, PostgreSQL, S3, HTTP).

| Komponen | Tugas |
|----------|-------|
| **Worker** | Proses JVM pelaksana; **distributed** (klaster, tahan kegagalan) / **standalone** (dev) |
| **Connector** | Objek konfigurasi (tabel mana, topic apa) |
| **Task** | Unit kerja paralel hasil pemecahan connector |
| **Converter** | Json / String / Avro / Protobuf |
| **REST API** | Kelola connector (default `:8083`) |

```text
PostgreSQL ──▶ Source Connector (worker + N task, offset di Kafka)
                    │  dbserver1.public.orders (Avro/JSON)
                    ▼
              Kafka Topics ──▶ Sink Connector ──▶ Elasticsearch / DWH
                                            idempotent writes + DLT

kelola lewat REST API :8083 — POST/GET/DELETE /connectors
```

---

## Menjalankan source & sink (REST API)

```bash
# 1) source: PostgreSQL CDC (Debezium)
curl -s -X POST http://localhost:8083/connectors \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "orders-source",
    "config": {
      "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
      "database.hostname": "postgres",
      "database.port": "5432",
      "database.user": "replicator",
      "database.dbname": "shop",
      "table.include.list": "public.orders",
      "topic.prefix": "dbserver1",
      "plugin.name": "pgoutput",
      "tasks.max": "2"
    }
  }'

# 2) pantau status
curl -s http://localhost:8083/connectors/orders-source/status | jq

# 3) sink: Elasticsearch
curl -s -X POST http://localhost:8083/connectors \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "orders-sink",
    "config": {
      "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
      "topics": "dbserver1.public.orders",
      "connection.url": "http://elasticsearch:9200",
      "behavior.on.null.values": "delete",
      "errors.tolerance": "all",
      "errors.deadletter.topic.name": "orders-sink-dlq"
    }
  }'

# 4) kontrol
curl -s -X POST http://localhost:8083/connectors/orders-source/pause
curl -s -X POST http://localhost:8083/connectors/orders-source/resume
curl -s -X DELETE http://localhost:8083/connectors/orders-source
```

- `tasks.max` = paralelisme task di banyak worker.
- `topic.prefix` + `table.include.list` → topic tujuan (`dbserver1.public.orders`).
- `errors.deadletter.topic.name` → praktik **DLT** di dunia Connect.

---

## Distributed vs standalone

| Aspek | Standalone | Distributed |
|-------|-----------|-------------|
| **Proses** | Satu JVM | Beberapa worker klaster |
| **Config/offset** | File lokal | Topic internal Kafka |
| **Fault tolerance** | Tidak ada | Task pindah otomatis |
| **Skala** | Satu mesin | Horizontal |
| **Cocok untuk** | Dev/eksperimen | Semua yang serius |

State Connect disimpan di Kafka (`connect-configs`, `connect-status`, `connect-offsets`) → worker mati-hidup tanpa kehilangan posisi.

---

## Offset & idempotensi

- Tiap source task menyimpan **offset** (LSN DB, offset file, timestamp).
- `offset.flush.interval.ms` = seberapa sering offset disimpan → terlalu panjang = **kirim ulang saat restart** (at-least-once).
- **Sink idempoten** — tulis dengan kunci unik (upsert) agar pengulangan tak merusak.
- `flush.size` membatasi record per batch → batas wajar memperkecil pengulangan.

---

## Change Data Capture (CDC) dengan Debezium

Membaca perubahan langsung dari **log database** (PostgreSQL WAL, MySQL binlog) — tanpa query berulang:

1. Connector terhubung sebagai **replica logikal**.
2. Setiap INSERT/UPDATE/DELETE terbaca → event `read/insert/update/delete` + image **before/after**.
3. Ditulis ke topic per tabel (`dbserver1.public.orders`).
4. Consumer membangun projection, search index, cache — **tanpa menyentuh DB sumber**.

```json
{
  "before": null,
  "after": { "id": "ORD-1001", "user_id": "USR-1001", "total": 250000 },
  "source": { "connector": "postgresql", "name": "dbserver1",
              "db": "shop", "schema": "public", "table": "orders" },
  "op": "c",
  "ts_ms": 1795716301200
}
```

- `op`: `c` create, `u` update, `d` delete, `r` read (snapshot awal).
- `before`/`after` = konteks penuh → konsumen tak perlu baca ulang DB.
- Fase snapshot menghasilkan `r` untuk seluruh baris → konsumen baru bisa bangun state awal dari topic.

---

## Jebakan umum

- **Converter tanpa registry** — JSON dengan `schemas.enable` menghasilkan envelope; pakai Avro + registry agar konsisten.
- **Sink non-idempoten** — restart menulis ulang → wajib upsert.
- **Snapshot tabel besar** — bisa membanjiri DB → atur mode & throttle.
- **Slot replica lama menumpuk** — bersihkan slot tak terpakai.
- **Lupa pantau status** — connector bisa PAUSED/FAILED tanpa terasa → alert `/connectors/{name}/status`.
- **Skema tabel berubah** — consumer harus toleran (lihat Pelajaran 17).

> 💡 **Connect vs kode sendiri:** Connect untuk integrasi umum (DB, search, storage, REST) — cepat & minim kode. Tulis producer/consumer sendiri bila logikanya khusus (transformasi berat, API berulir rumit). Keduanya hidup berdampingan.

---

## Rangkuman

- Connect = **worker → connector → task → converter**, dikelola REST `:8083`.
- **Source** (luar → Kafka) vs **Sink** (Kafka → tujuan); **distributed** simpan state di Kafka.
- Offset task → restart lanjut; kirim ulang = sink **idempoten + DLT**.
- **CDC/Debezium** baca log DB → event before/after per tabel.

## Latihan

1. Sebutkan **5 komponen Connect** + tugasnya.
2. Contoh nyata **source** dan **sink**.
3. Mengapa offset Connect disimpan di **Kafka**, bukan file worker?
4. Uraikan alur **CDC Debezium** dari INSERT sampai consumer.
5. Kapan pakai **Connect**, kapan tulis **kode sendiri**?

## Istilah

| Istilah | Arti |
|---------|------|
| Kafka Connect | Kerangka integrasi berbasis konfigurasi |
| Source connector | Luar → Kafka |
| Sink connector | Kafka → tujuan |
| Worker | Proses JVM pelaksana connector |
| Task | Unit kerja paralel |
| Converter | Konverter format data |
| CDC | Change Data Capture dari log DB |
| Debezium | Platform CDC sebagai connector |

---

**Lanjut → [Pelajaran 19 — Kafka Streams & ksqlDB](19-kafka-streams-ksqldb.md)**
