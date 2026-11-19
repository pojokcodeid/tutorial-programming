# 🐘 Bab: Apache Kafka dari 0 sampai Mahir

> **Untuk siapa:** yang baru memulai atau sudah pernah pakai Kafka tapi ingin tertata dari dasar sampai mahir — termasuk yang berangkat dari roadmap [roadmap-belajar-apache-kafka.md](../../roadmap-belajar-apache-kafka.md).
> **Sifat:** fokus penuh pada **Apache Kafka** — container (image `apache/kafka`) hanya dipakai sebagai environment lab.
> **Jumlah:** 25 pelajaran + 40 soal kuis.
> **Estimasi:** ± 15 menit baca + lab per pelajaran → mengikuti jadwal 10 level + proyek akhir.
> **Sumber rujukan:** [roadmap-belajar-apache-kafka.md](../../roadmap-belajar-apache-kafka.md) — Level 1 sampai Proyek Akhir.

---

## Apa yang akan kamu bisa setelah bab ini?

1. Menjelaskan masalah yang diselesaikan Kafka serta konsep inti **topic, partition, offset, replication**.
2. Menjalankan Kafka dengan **KRaft** (tanpa ZooKeeper) di container dan memakai CLI sehari-hari.
3. Menjelaskan **replication, ISR, dan durability** serta menentukan konfigurasi yang tahan kegagalan.
4. Menulis **producer** yang efisien (key, batching, acks, idempotence) dan **consumer** yang andal (poll → proses → commit).
5. Mengelola **consumer group** dan menangani **rebalance** tanpa kehilangan data.
6. Mendesain **integrasi event-driven**: notification, state transfer, event sourcing, CQRS, choreography vs orchestration.
7. Menentukan **delivery semantics** (at-most/at-least/exactly once) dan memilih yang tepat per kasus.
8. Menerapkan **transactional outbox** untuk menyelesaikan dual-write problem.
9. Menangani error dengan **retry berbatas + Dead Letter Topic** beserta prosedur replay.
10. Memakai **Schema Registry** dan melakukan **evolusi skema** yang kompatibel.
11. Menghubungkan Kafka ke sistem lain dengan **Kafka Connect & CDC (Debezium)**.
12. Memproses stream dengan **Kafka Streams & ksqlDB** (window, agregasi, join).
13. Mengamankan Kafka: **TLS, SASL, dan ACL** dengan prinsip least privilege.
14. Membangun **monitoring & observability**: metrik wajib, consumer lag, dashboard, alerting.
15. Mengelola **storage, retensi, compaction, dan pemulihan** data.
16. Melakukan **performance tuning** secara terukur (batching, kompresi, paralelisme).
17. Merancang **arsitektur lanjutan**: multi-datacenter, quota/multi-tenancy, rack awareness.
18. Membangun **proyek akhir**: pipeline pesanan end-to-end yang siap produksi.

---

## Peta 25 Pelajaran

| # | Pelajaran | Inti yang dipelajari | Level roadmap |
|---|-----------|----------------------|---------------|
| 1 | [Apa Itu Apache Kafka?](01-pengantar-event-streaming.md) | Masalah yang diselesaikan Kafka, event streaming vs queue | Level 1 |
| 2 | [Konsep Inti: Topic, Partition, Offset](02-konsep-inti-kafka.md) | Topic, partition, offset, consumer position | Level 1 |
| 3 | [Menjalankan Kafka: Environment & KRaft](03-setup-environment.md) | Container `apache/kafka`, env `KAFKA_*`, KRaft | Level 2 |
| 4 | [KRaft vs ZooKeeper](04-kraft-vs-zookeeper.md) | Quorum metadata, controller, kenapa ZooKeeper ditinggalkan | Level 2 |
| 5 | [Perintah CLI Kafka Sehari-hari](05-kafka-cli.md) | `kafka-topics`, `kafka-console-producer/consumer`, configs | Level 2 |
| 6 | [Topic & Partition Lebih Dalam](06-topic-partition.md) | Key, hashing, partisi & paralelisme, konfigurasi topic | Level 3 |
| 7 | [Offset, Consumer Position & Lag](07-offset-dan-lag.md) | Commit, lag, earliest/latest, titik awal baca | Level 3 |
| 8 | [Replication, ISR & Durability](08-replication-durability.md) | RF, ISR, min.insync.replicas, acks, unclean election | Level 3 |
| 9 | [Producer: Key, Batching & Acks](09-producer.md) | Serializers, batching, linger, kompresi, delivery guarantee | Level 4 |
| 10 | [Consumer: Membaca & Memproses Data](10-consumer.md) | Siklus poll→proses→commit, titik baca, idempotensi, DLT | Level 4 |
| 11 | [Consumer Group & Rebalancing](11-consumer-group-rebalance.md) | Group, assign, rebalance, static membership | Level 4 |
| 12 | [Integrasi & Event-Driven Architecture](12-integrasi-event-driven.md) | Notification, state transfer, event sourcing, CQRS | Level 5 |
| 13 | [Desain Event & Schema](13-desain-event.md) | Bentuk event, envelope, penamaan, evolusi & kompatibilitas | Level 5 |
| 14 | [Delivery Semantics: At-Least/At-Most/Exactly Once](14-delivery-semantics.md) | Tiga semantik, idempotency, transaksi Kafka | Level 5 |
| 15 | [Transactional Outbox Pattern](15-transactional-outbox.md) | Dual-write problem, outbox + CDC/relay | Level 5 |
| 16 | [Error Handling, Retry & Dead Letter Topic](16-error-handling-dlt.md) | Backoff + jitter, retry topic, DLT, replay | Level 6 |
| 17 | [Schema Registry & Evolusi Skema](17-schema-registry.md) | Subject, kompatibilitas, REST API, Avro | Level 7 |
| 18 | [Kafka Connect & CDC](18-kafka-connect-cdc.md) | Source/sink, distributed, offset, Debezium | Level 7 |
| 19 | [Kafka Streams & ksqlDB](19-kafka-streams-ksqldb.md) | Stream/table, window, state store, SQL atas stream | Level 7 |
| 20 | [Security: SSL, SASL & ACL](20-security-acl.md) | TLS, SCRAM/mTLS, ACL, least privilege | Level 8 |
| 21 | [Monitoring & Observability](21-monitoring-observability.md) | Metrik wajib, lag, dashboard, alerting, tracing | Level 9 |
| 22 | [Storage, Retention & Recovery](22-storage-retention-recovery.md) | Segment, retensi, compaction, ISR & pemulihan | Level 9 |
| 23 | [Performance Tuning](23-performance-tuning.md) | Metodologi ukur, batching, paralelisme, bottleneck | Level 10 |
| 24 | [Arsitektur Lanjutan](24-arsitektur-lanjutan.md) | Multi-datacenter, MirrorMaker 2, quota, tiered storage | Level 10 |
| 25 | [Proyek Akhir: Pipeline Pesanan](25-proyek-akhir.md) | Sistem end-to-end: outbox → topics → consumers → monitoring | Proyek Akhir |

Setelahnya: **[Kuis 40 Soal](kuis-40-soal.md)** untuk mengukur pemahamanmu.

---

## Urutan Belajar

| Fase | Pelajaran | Output |
|---|---|---|
| Fondasi | 1–2 | Memahami masalah & konsep inti Kafka |
| Menjalankan | 3–5 | Kafka KRaft berjalan di container + lancar memakai CLI |
| Data plane | 6–8 | Paham partition, offset, lag, replication & durability |
| Produksi data | 9–11 | Producer & consumer andal, group & rebalance terkendali |
| Desain event | 12–15 | Integrasi event-driven + outbox bebas dual-write |
| Keandalan | 16 | Error tertangani: retry + DLT + replay |
| Ekosistem | 17–19 | Registry, Connect/CDC, Streams/ksqlDB |
| Keamanan | 20 | TLS + SASL + ACL aktif |
| Operasional | 21–22 | Monitoring, retensi, pemulihan terpasang |
| Skala | 23–24 | Tuning terukur + arsitektur lanjutan |
| Proyek | 25 + kuis | Pipeline pesanan siap produksi & skor kuis |

---

## Prasyarat

- Dasar terminal (perintah, `cd`, membaca output).
- Dasar HTTP dan jaringan: request/response, IP, port, TCP.
- Dasar pemrograman untuk membaca contoh kode (Java/Python/SQL tidak harus dikuasai penuh).
- **Container runtime** (Podman/Docker) terpasang — hanya untuk menjalankan Kafka, bukan fokus pembelajaran.
- Pemahaman dasar SQL membantu memahami CDC dan analitik, tetapi tidak wajib.

---

## Pemetaan ke Roadmap

| Level di roadmap | Pelajaran di bab ini |
|---|---|
| Level 1 — Fondasi Event Streaming | 1, 2 |
| Level 2 — Menjalankan Kafka di Local Environment | 3, 4, 5 |
| Level 3 — Topic, Partition, Offset, dan Replication | 6, 7, 8 |
| Level 4 — Producer dan Consumer | 9, 10, 11 |
| Level 5 — Integrasi Aplikasi dan Event-Driven Architecture | 12, 13, 14, 15 |
| Level 6 — Error Handling, Retry, dan Dead Letter Topic | 16 |
| Level 7 — Kafka Ecosystem | 17, 18, 19 |
| Level 8 — Security dan Governance | 20 |
| Level 9 — Monitoring, Operasional, dan Production Readiness | 21, 22 |
| Level 10 — Performance Tuning dan Advanced Architecture | 23, 24 |
| Proyek Akhir — Sistem Event-Driven Terintegrasi | 25 |

---

## Rujukan

- [Dokumentasi Resmi Apache Kafka](https://kafka.apache.org/documentation/)
- [Apache Kafka Quickstart](https://kafka.apache.org/quickstart/)
- [Kafka Streams Documentation](https://kafka.apache.org/documentation/streams/)
- [Apache Kafka on Docker Hub (apache/kafka)](https://hub.docker.com/r/apache/kafka)

> **Catatan:** contoh konfigurasi memakai lingkungan KRaft (Kafka 4.0 — ZooKeeper sudah tidak didukung). Konfigurasi lab bukan otomatis konfigurasi produksi — selalu sesuaikan `replication.factor`, `min.insync.replicas`, retensi, keamanan, dan monitoring dengan kebutuhan nyata kamu.
