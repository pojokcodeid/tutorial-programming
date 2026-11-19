# Roadmap Belajar Apache Kafka: 0 sampai Mahir

> Panduan belajar bertahap dari konsep dasar hingga mampu merancang,
> mengoperasikan, mengamankan, dan mengoptimalkan Apache Kafka untuk
> kebutuhan production.
>
> **Target akhir:** mampu membangun aplikasi event-driven,
> mengintegrasikan Kafka dengan service lain, menangani kegagalan, serta
> melakukan monitoring dan tuning cluster.
>
> **Estimasi waktu:** 8--12 minggu dengan belajar 1--2 jam per hari.
> Durasi dapat disesuaikan dengan pengalaman dan intensitas praktik.

------------------------------------------------------------------------

## Cara Menggunakan Roadmap

-   [ ] Pelajari konsep pada setiap tahap sebelum berpindah ke tahap
    berikutnya.
-   [ ] Jalankan semua praktik menggunakan environment lokal berbasis
    Docker Compose atau Podman.
-   [ ] Simpan konfigurasi dan source code latihan dalam satu
    repository.
-   [ ] Catat hasil eksperimen: command, konfigurasi, pesan error, dan
    solusi.
-   [ ] Kerjakan mini project di akhir setiap tahap.
-   [ ] Gunakan checklist untuk mengukur pemahaman, bukan sekadar
    menyelesaikan materi.

## Prasyarat

Tidak harus menguasai semuanya, tetapi akan sangat membantu jika sudah
memahami:

-   Dasar Linux dan terminal.
-   Dasar jaringan: IP, port, DNS, TCP, dan TLS.
-   Dasar pemrograman (Go, Java, JavaScript/TypeScript, atau Python).
-   Dasar JSON dan HTTP/REST API.
-   Dasar Docker atau Podman.
-   Dasar database relasional.

**Catatan:** Kafka bukan database pengganti untuk semua kebutuhan. Kafka
terutama digunakan sebagai distributed event streaming platform untuk
mengirim, menyimpan sementara/berdasarkan retensi, dan memproses aliran
event.

------------------------------------------------------------------------

# Level 1 --- Fondasi Event Streaming

**Estimasi: Minggu 1**

## 1.1 Memahami masalah yang diselesaikan Kafka

Pelajari:

-   Apa itu message broker.
-   Perbedaan komunikasi synchronous dan asynchronous.
-   Perbedaan request-response, message queue, dan event streaming.
-   Konsep event-driven architecture (EDA).
-   Producer, consumer, dan message.
-   Use case: sinkronisasi data, audit log, notifikasi, aktivitas
    pengguna, dan integrasi microservices.

Pahami perbedaan Kafka dengan teknologi lain:

  Teknologi       Fokus utama
  --------------- ---------------------------------------------------
  Apache Kafka    Distributed event streaming dan log terdistribusi
  RabbitMQ        Message broker dengan routing dan antrean pesan
  Redis Pub/Sub   Pub/sub ringan; pesan tidak disimpan untuk replay
  Database        Penyimpanan dan query data terstruktur

Jangan menganggap satu teknologi selalu menggantikan yang lain.
Pemilihan bergantung pada kebutuhan, pola konsumsi, retensi, routing,
dan operasional.

## 1.2 Konsep inti Kafka

Pelajari istilah berikut:

-   **Event/Record:** unit data yang dikirim ke Kafka.
-   **Topic:** kategori atau stream tempat record ditulis.
-   **Partition:** pembagian topic untuk skalabilitas dan paralelisme.
-   **Offset:** posisi record dalam sebuah partition.
-   **Producer:** aplikasi yang menulis record.
-   **Consumer:** aplikasi yang membaca record.
-   **Broker:** server Kafka yang menyimpan partition.
-   **Cluster:** kumpulan broker yang bekerja bersama.
-   **Replication:** salinan partition untuk toleransi kegagalan.
-   **Consumer Group:** sekumpulan consumer yang berbagi pekerjaan
    membaca topic.

## 1.3 Memahami arsitektur dasar

Pelajari alur berikut:

1.  Producer membuat event.
2.  Producer mengirim event ke topic.
3.  Kafka menentukan partition tujuan.
4.  Broker menyimpan record dan memberikan offset.
5.  Consumer membaca record berdasarkan offset.
6.  Consumer mengelola kemajuan pembacaan melalui consumer offset.

Pahami juga bahwa urutan record dijamin di dalam satu partition, bukan
otomatis di seluruh topic.

## Praktik

-   [ ] Gambar arsitektur producer → broker → topic/partition →
    consumer.
-   [ ] Jelaskan perbedaan topic dan partition dengan contoh.
-   [ ] Buat contoh event JSON sederhana.
-   [ ] Jelaskan mengapa offset penting untuk proses replay.

**Mini project:** rancang alur event sederhana untuk pencatatan
aktivitas pengguna (user activity).

------------------------------------------------------------------------

# Level 2 --- Menjalankan Kafka di Local Environment

**Estimasi: Minggu 2**

## 2.1 Menyiapkan environment

Gunakan Docker Compose atau Podman Compose agar environment mudah dibuat
ulang.

Komponen latihan:

-   Kafka broker.
-   Kafka CLI tools.
-   Kafka UI (opsional, untuk inspeksi).
-   Volume untuk data Kafka.
-   Network khusus untuk komunikasi antarkontainer.

Pelajari konfigurasi koneksi:

-   `listeners`
-   `advertised.listeners`
-   `listener.security.protocol.map`
-   `inter.broker.listener.name`
-   `controller.listener.names` (pada mode KRaft)
-   `process.roles`
-   `node.id`
-   `controller.quorum.voters` atau konfigurasi quorum yang sesuai versi

> Gunakan dokumentasi resmi sesuai versi Kafka yang dipilih. Konfigurasi
> dan cara menjalankan Kafka dapat berbeda antarversi.

## 2.2 Mengenal KRaft

Pelajari:

-   Apa itu KRaft.
-   Peran controller dan broker.
-   Metadata quorum.
-   Perbedaan arsitektur ZooKeeper lama dengan KRaft.
-   Mengapa tutorial lama mungkin masih menggunakan ZooKeeper.

Fokus latihan pada deployment Kafka modern berbasis KRaft. Pelajari
ZooKeeper sebatas untuk memahami sistem lama dan kebutuhan migrasi.

## 2.3 Menggunakan Kafka CLI

Latih perintah dasar:

-   Membuat topic.
-   Melihat daftar topic.
-   Menampilkan detail partition dan replication.
-   Mengirim record menggunakan console producer.
-   Membaca record menggunakan console consumer.
-   Membaca dari awal dengan opsi yang sesuai.
-   Menghapus topic latihan.
-   Melihat konfigurasi topic.

Contoh perintah (sesuaikan nama container dan alamat bootstrap server):

``` bash
# Membuat topic
kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create \
  --topic user-events \
  --partitions 3 \
  --replication-factor 1

# Melihat daftar topic
kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list

# Melihat detail topic
kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --topic user-events

# Mengirim pesan
kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic user-events

# Membaca pesan
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic user-events \
  --from-beginning
```

**Catatan:** replication factor 1 hanya cocok untuk latihan
single-broker, bukan konfigurasi production.

## Praktik

-   [ ] Jalankan Kafka menggunakan container.
-   [ ] Pastikan broker dapat diakses dari host dan dari container lain.
-   [ ] Buat topic `user-events` dengan tiga partition.
-   [ ] Kirim minimal 10 record.
-   [ ] Baca record dari awal.
-   [ ] Periksa offset dan metadata partition.
-   [ ] Hentikan dan jalankan ulang environment; amati persistensi data.

**Mini project:** buat environment Kafka lokal yang dapat dijalankan dan
dihentikan dengan satu perintah.

------------------------------------------------------------------------

# Level 3 --- Topic, Partition, Offset, dan Replication

**Estimasi: Minggu 3**

## 3.1 Topic dan partition lebih dalam

Pelajari:

-   Mengapa topic dibagi menjadi partition.
-   Hubungan partition dengan throughput dan paralelisme.
-   Distribusi record ke partition.
-   Key dan partitioner.
-   Record tanpa key dibanding record dengan key.
-   Batas urutan pesan.
-   Strategi menentukan jumlah partition.

Pahami bahwa record dengan key yang sama umumnya diarahkan ke partition
yang sama menggunakan partitioner standar, sehingga urutan untuk key
tersebut dapat dipertahankan selama konfigurasi dan kondisi partition
tidak berubah secara tidak terduga.

## 3.2 Offset dan consumer position

Pelajari:

-   Current position.
-   Committed offset.
-   Auto commit dan manual commit.
-   Reset offset.
-   Replay event.
-   Offset awal dan akhir partition.
-   Consumer lag.

## 3.3 Replication dan durability

Pelajari:

-   Leader dan follower replica.
-   Replication factor.
-   In-sync replicas (ISR).
-   Leader election.
-   `acks=0`, `acks=1`, dan `acks=all`.
-   `min.insync.replicas`.
-   Unclean leader election dan risikonya.

Pahami trade-off antara durability, availability, dan latency.

## Praktik

-   [ ] Buat topic dengan beberapa partition.
-   [ ] Kirim record dengan key berbeda dan key sama.
-   [ ] Amati distribusi record ke partition.
-   [ ] Baca record per partition.
-   [ ] Ubah konfigurasi producer `acks`.
-   [ ] Simulasikan kegagalan broker pada cluster multi-broker jika
    resource memungkinkan.
-   [ ] Amati perubahan leader dan ISR.

**Mini project:** rancang topic transaksi dengan key `account_id` dan
jelaskan alasan pemilihan key serta jumlah partition.

------------------------------------------------------------------------

# Level 4 --- Producer dan Consumer

**Estimasi: Minggu 4**

## 4.1 Producer

Pelajari:

-   Bootstrap server.
-   Serialization key dan value.
-   Message key.
-   Partition selection.
-   Batching.
-   Compression.
-   Retries dan delivery timeout.
-   Idempotent producer.
-   Acknowledgment.
-   Producer transaction sebagai konsep lanjutan.

Konfigurasi yang perlu dikenal:

-   `bootstrap.servers`
-   `key.serializer`
-   `value.serializer`
-   `acks`
-   `retries`
-   `enable.idempotence`
-   `batch.size`
-   `linger.ms`
-   `compression.type`
-   `delivery.timeout.ms`
-   `request.timeout.ms`

Jangan menyalin nilai konfigurasi secara membabi buta. Pahami efeknya
terhadap throughput, latency, dan reliabilitas.

## 4.2 Consumer

Pelajari:

-   Subscribe dan assign.
-   Poll loop.
-   Deserialization.
-   Consumer group.
-   Offset commit.
-   Auto commit vs manual commit.
-   Rebalance.
-   Heartbeat dan session timeout.
-   `max.poll.interval.ms`.
-   `max.poll.records`.
-   Consumer lag.

Konfigurasi yang perlu dikenal:

-   `bootstrap.servers`
-   `group.id`
-   `key.deserializer`
-   `value.deserializer`
-   `auto.offset.reset`
-   `enable.auto.commit`
-   `max.poll.records`
-   `max.poll.interval.ms`
-   `session.timeout.ms`

## 4.3 Consumer Group

Pahami:

-   Satu partition hanya ditugaskan kepada maksimal satu consumer dalam
    satu consumer group pada satu waktu.
-   Satu consumer dapat membaca beberapa partition.
-   Jumlah consumer yang melebihi jumlah partition dapat membuat
    sebagian consumer tidak memperoleh assignment.
-   Consumer group berbeda dapat membaca topic yang sama secara
    independen.

## 4.4 Rebalancing

Pelajari:

-   Kapan rebalance terjadi.
-   Consumer join/leave.
-   Partition assignment.
-   Eager dan cooperative rebalancing.
-   Dampak rebalance pada throughput dan latency.
-   Cara mengurangi rebalance yang tidak perlu.

## Praktik

-   [ ] Buat producer menggunakan bahasa pilihan.
-   [ ] Buat consumer menggunakan bahasa yang sama.
-   [ ] Kirim dan baca JSON.
-   [ ] Buat dua consumer dengan `group.id` yang sama.
-   [ ] Buat consumer ketiga dan amati assignment.
-   [ ] Ubah `group.id` dan amati perilaku pembacaan.
-   [ ] Matikan satu consumer ketika proses berjalan.
-   [ ] Uji auto commit dan manual commit.

**Mini project:** aplikasi producer transaksi dan consumer yang
menghitung jumlah transaksi per jenis.

------------------------------------------------------------------------

# Level 5 --- Integrasi Aplikasi dan Event-Driven Architecture

**Estimasi: Minggu 5**

## 5.1 Integrasi dengan backend service

Bangun beberapa service sederhana:

-   `user-service`: menerbitkan event user.
-   `order-service`: menerbitkan event order.
-   `notification-service`: mengonsumsi event untuk notifikasi.
-   `audit-service`: mengonsumsi event untuk audit.

Contoh event:

``` json
{
  "event_id": "evt-10001",
  "event_type": "order.created",
  "event_version": 1,
  "occurred_at": "2026-11-18T10:00:00Z",
  "data": {
    "order_id": "ORD-1001",
    "user_id": "USR-1001",
    "total": 250000
  }
}
```

## 5.2 Desain event

Pelajari:

-   Event naming convention.
-   Event envelope.
-   Event ID.
-   Timestamp.
-   Event version.
-   Correlation ID dan trace ID.
-   Payload design.
-   Backward dan forward compatibility.
-   Menghindari payload yang terlalu besar.
-   PII dan data sensitif dalam event.

## 5.3 Reliability dan delivery semantics

Pelajari perbedaan:

-   At-most-once.
-   At-least-once.
-   Exactly-once semantics (EOS).

Pahami bahwa exactly-once memiliki cakupan dan batasan tertentu. Efek
samping ke database atau API eksternal tetap membutuhkan desain
idempotensi dan koordinasi yang tepat.

## 5.4 Idempotent consumer

Pelajari:

-   Mengapa pesan dapat diproses lebih dari sekali.
-   Idempotency key.
-   Deduplication.
-   Inbox pattern.
-   Unique constraint untuk mencegah pemrosesan ganda.
-   Menangani retry tanpa menggandakan transaksi.

## 5.5 Transactional Outbox Pattern

Pelajari masalah dual-write:

1.  Aplikasi menyimpan data ke database.
2.  Aplikasi menerbitkan event ke Kafka.
3.  Salah satu operasi dapat berhasil sementara yang lain gagal.

Pelajari outbox table, publisher/CDC, status pengiriman, dan idempotensi
consumer.

## Praktik

-   [ ] Buat minimal dua service yang berkomunikasi melalui Kafka.
-   [ ] Simpan event ID dan correlation ID.
-   [ ] Buat consumer idempotent.
-   [ ] Simulasikan consumer gagal setelah menerima pesan.
-   [ ] Implementasikan retry yang aman.
-   [ ] Rancang outbox untuk transaksi bisnis.

**Mini project:** sistem order sederhana: API menyimpan order, event
diterbitkan, lalu notification dan audit service memproses event secara
independen.

------------------------------------------------------------------------

# Level 6 --- Error Handling, Retry, dan Dead Letter Topic

**Estimasi: Minggu 6**

## 6.1 Jenis kegagalan

Kenali:

-   Broker tidak tersedia.
-   Network timeout.
-   Serialization/deserialization error.
-   Payload tidak valid.
-   Business validation gagal.
-   Database/API tujuan tidak tersedia.
-   Consumer crash.
-   Duplicate event.
-   Poison message.

## 6.2 Strategi penanganan error

Pelajari:

-   Retry langsung dan retry dengan backoff.
-   Exponential backoff dan jitter.
-   Batas jumlah retry.
-   Retry topic.
-   Dead Letter Topic (DLT/DLQ).
-   Error metadata.
-   Manual replay.
-   Alerting dan observability.

Bedakan error sementara (transient) dan error permanen (non-retryable).
Jangan melakukan retry tanpa batas karena dapat menyebabkan antrean
menumpuk dan memperburuk gangguan.

## 6.3 Urutan dan retry

Retry melalui topic terpisah dapat mengubah urutan pemrosesan. Tentukan
apakah urutan per entity/key wajib dipertahankan dan desain strategi
retry sesuai kebutuhan bisnis.

## Praktik

-   [ ] Kirim payload JSON yang tidak valid.
-   [ ] Buat consumer dengan validasi.
-   [ ] Implementasikan retry terbatas.
-   [ ] Pindahkan pesan yang gagal permanen ke DLT.
-   [ ] Simpan informasi error dan waktu kegagalan.
-   [ ] Buat prosedur replay pesan dari DLT.
-   [ ] Pastikan replay tidak menggandakan efek bisnis.

**Mini project:** pipeline pemrosesan order dengan retry topic dan DLT.

------------------------------------------------------------------------

# Level 7 --- Kafka Ecosystem

**Estimasi: Minggu 7--8**

## 7.1 Schema Registry dan format data

Pelajari:

-   Mengapa schema dibutuhkan.
-   JSON Schema.
-   Apache Avro.
-   Protocol Buffers.
-   Schema Registry.
-   Schema evolution.
-   Compatibility: backward, forward, full, dan none.
-   Strategi perubahan field.

Latihan menggunakan schema untuk event order. Uji perubahan field wajib,
field opsional, dan perubahan tipe data.

## 7.2 Kafka Connect

Pelajari:

-   Fungsi Kafka Connect.
-   Source connector dan sink connector.
-   Worker standalone dan distributed.
-   Connector, task, dan configuration.
-   Converter dan serialization.
-   Offset dan status connector.
-   Error handling dan dead letter queue pada Connect.

Contoh integrasi:

-   Database → Kafka.
-   Kafka → database.
-   Kafka → object storage.
-   Kafka → search/indexing platform.

## 7.3 Change Data Capture (CDC)

Pelajari:

-   Pengertian CDC.
-   Snapshot awal.
-   Log-based CDC.
-   Database transaction log.
-   Debezium sebagai salah satu solusi CDC.
-   Insert, update, delete event.
-   Sinkronisasi data antarservice.
-   Penanganan schema change.

## 7.4 Kafka Streams

Pelajari:

-   Apa itu stream processing.
-   KStream dan KTable.
-   Stateless transformation.
-   Stateful transformation.
-   Filter, map, groupBy, aggregate.
-   Windowing.
-   Join stream dan table.
-   State store.
-   Fault tolerance dan repartitioning.

## 7.5 ksqlDB dan alternatif pemrosesan

Kenali ksqlDB sebagai teknologi ekosistem yang dapat digunakan untuk
stream processing berbasis SQL pada distribusi/lingkungan yang
mendukungnya. Pelajari juga kapan lebih tepat menggunakan Kafka Streams
atau Apache Flink. Periksa status dukungan dan kompatibilitas produk
sebelum memilihnya untuk sistem baru.

## Praktik

-   [ ] Validasi event dengan schema.
-   [ ] Buat source atau sink connector.
-   [ ] Uji CDC dari database lokal.
-   [ ] Buat stream transformation sederhana.
-   [ ] Buat agregasi jumlah order per menit.
-   [ ] Amati state dan hasil pemrosesan.

**Mini project:** database order → CDC → Kafka → stream aggregation →
consumer dashboard.

------------------------------------------------------------------------

# Level 8 --- Security dan Governance

**Estimasi: Minggu 9**

## 8.1 Keamanan koneksi

Pelajari:

-   PLAINTEXT dan risikonya.
-   TLS encryption.
-   Certificate dan truststore/keystore.
-   SASL.
-   SASL/SCRAM.
-   SASL/OAUTHBEARER.
-   mTLS jika diperlukan.

## 8.2 Authorization

Pelajari:

-   Kafka ACL.
-   Principal.
-   Resource: topic, group, cluster, transactional ID.
-   Operation: read, write, describe, create, dan lainnya.
-   Least privilege.
-   Pemisahan hak producer dan consumer.

## 8.3 Governance

Pelajari:

-   Penamaan topic.
-   Ownership.
-   Data classification.
-   Retention policy.
-   Data privacy.
-   Schema compatibility.
-   Audit dan dokumentasi event.
-   Kebijakan akses lintas tim.

## Praktik

-   [ ] Aktifkan TLS pada environment latihan.
-   [ ] Konfigurasikan autentikasi.
-   [ ] Buat user/service account untuk producer dan consumer.
-   [ ] Terapkan ACL dengan hak minimum.
-   [ ] Uji akses yang diizinkan dan ditolak.
-   [ ] Dokumentasikan standar nama topic dan schema.

**Mini project:** amankan cluster latihan sehingga setiap service hanya
dapat mengakses topic yang dibutuhkan.

------------------------------------------------------------------------

# Level 9 --- Monitoring, Operasional, dan Production Readiness

**Estimasi: Minggu 10--11**

## 9.1 Monitoring

Pelajari metrik penting:

-   Broker availability.
-   Under-replicated partitions.
-   Offline partitions.
-   Active controller/quorum health.
-   Request latency.
-   Bytes in/out.
-   Messages in/out.
-   Disk usage.
-   Network throughput.
-   Consumer lag.
-   Rebalance rate.
-   ISR shrink/expand.
-   Produce/fetch request errors.

Kenali JMX metrics dan cara mengekspos metrik ke sistem monitoring.

## 9.2 Observability

Pelajari:

-   Metrics.
-   Logs.
-   Distributed tracing.
-   Correlation ID.
-   Trace propagation melalui header record.
-   Dashboard.
-   Alert threshold.
-   Runbook incident.

Tools yang dapat dieksplorasi:

-   Prometheus.
-   Grafana.
-   OpenTelemetry.
-   JMX Exporter.
-   Kafka UI atau tool administrasi sejenis.

## 9.3 Storage dan retention

Pelajari:

-   Log segment.
-   Log retention berdasarkan waktu dan ukuran.
-   `retention.ms`.
-   `retention.bytes`.
-   `cleanup.policy=delete`.
-   `cleanup.policy=compact`.
-   Log compaction.
-   Tombstone record.
-   Disk capacity planning.

Pahami bahwa compaction mempertahankan nilai terbaru per key sesuai
mekanisme Kafka, bukan sekadar menghapus semua record lama.

## 9.4 Backup dan disaster recovery

Pelajari:

-   Replication bukan pengganti backup.
-   Backup konfigurasi dan metadata yang relevan.
-   MirrorMaker 2 dan replikasi lintas cluster.
-   Recovery objective: RPO dan RTO.
-   Strategi failover.
-   Pengujian pemulihan.
-   Batasan replikasi dan potensi kehilangan/duplikasi data.

## 9.5 Upgrade dan maintenance

Pelajari:

-   Rolling restart.
-   Upgrade broker.
-   Compatibility client dan broker.
-   Partition reassignment.
-   Disk balancing.
-   Capacity planning.
-   Patch management.
-   Perubahan konfigurasi secara aman.

## Praktik

-   [ ] Pasang Prometheus dan Grafana.
-   [ ] Tampilkan consumer lag dan kesehatan broker.
-   [ ] Buat alert untuk under-replicated partition.
-   [ ] Simulasikan broker down.
-   [ ] Simulasikan consumer berhenti.
-   [ ] Periksa dampak disk penuh pada environment uji.
-   [ ] Buat runbook untuk incident umum.
-   [ ] Uji prosedur recovery.

**Mini project:** dashboard operasional Kafka dengan alert dan
dokumentasi penanganan insiden.

------------------------------------------------------------------------

# Level 10 --- Performance Tuning dan Advanced Architecture

**Estimasi: Minggu 12 dan seterusnya**

## 10.1 Performance tuning

Pelajari pengaruh:

-   Jumlah partition.
-   Jumlah broker.
-   Producer batching.
-   `linger.ms`.
-   `batch.size`.
-   Compression: none, gzip, snappy, lz4, zstd (tergantung dukungan
    versi/client).
-   `acks` dan replication.
-   Consumer concurrency.
-   Fetch size.
-   Payload size.
-   Network bandwidth.
-   Disk throughput dan latency.

Pahami trade-off throughput vs latency. Lakukan benchmark dengan beban
yang realistis, bukan hanya satu kali pengujian.

## 10.2 Capacity planning

Pelajari cara memperkirakan:

-   Event per second.
-   Ukuran rata-rata event.
-   Total throughput masuk dan keluar.
-   Retention period.
-   Storage dengan replication factor.
-   Jumlah partition.
-   Jumlah consumer.
-   Pertumbuhan traffic.
-   Headroom untuk recovery dan rebalance.

Contoh estimasi sederhana:

``` text
events_per_second = 1,000
average_event_size = 2 KB
retention = 7 days

raw_ingest_per_second = 1,000 * 2 KB
raw_storage = raw_ingest_per_second * 60 * 60 * 24 * 7
```

Tambahkan overhead format, index, segment, dan replication ketika
menghitung kapasitas aktual.

## 10.3 Advanced producer dan consumer

Pelajari:

-   Idempotent producer.
-   Producer transactions.
-   `read_committed` dan `read_uncommitted`.
-   Transactional ID.
-   Exactly-once processing dengan Kafka Streams.
-   Cooperative rebalancing.
-   Static membership.
-   Manual partition assignment.
-   Custom partitioner.
-   Pause/resume consumer.
-   Backpressure.

## 10.4 Advanced architecture

Pelajari:

-   Multi-broker cluster.
-   Multi-region dan multi-cluster.
-   Cluster linking atau solusi replikasi yang sesuai distribusi.
-   Active-active vs active-passive.
-   Data locality.
-   Event sourcing.
-   CQRS.
-   Saga pattern.
-   Outbox dan CDC.
-   Schema governance.
-   Multi-tenancy.

## Praktik

-   [ ] Buat benchmark producer dan consumer.
-   [ ] Bandingkan compression.
-   [ ] Bandingkan konfigurasi batching.
-   [ ] Uji perubahan jumlah partition.
-   [ ] Ukur consumer lag pada beberapa beban.
-   [ ] Uji transaksi Kafka pada use case yang sesuai.
-   [ ] Dokumentasikan hasil benchmark dan alasan konfigurasi.

**Mini project:** rancang arsitektur Kafka untuk beberapa service dengan
target throughput, retention, durability, dan recovery yang ditentukan.

------------------------------------------------------------------------

# Proyek Akhir --- Sistem Event-Driven Terintegrasi

Bangun sistem simulasi bisnis yang mengintegrasikan beberapa service.

## Gambaran arsitektur

``` text
                 +----------------+
                 |    Client/API  |
                 +--------+-------+
                          |
                          v
                 +----------------+
                 |  Order Service |
                 +--------+-------+
                          |
                 Database + Outbox
                          |
                          v
                 +----------------+
                 |  CDC / Producer|
                 +--------+-------+
                          |
                          v
              +-----------------------+
              |     Kafka Cluster    |
              |                       |
              |  order-created        |
              |  payment-completed    |
              |  notification-events  |
              |  order-dlt             |
              +---+---------+---------+
                  |         |
          +-------+         +----------------+
          v                                  v
 +------------------+              +------------------+
 | Payment Consumer|              | Notification     |
 |                  |              | Consumer         |
 +--------+---------+              +------------------+
          |
          v
 +------------------+
 | Payment Database|
 +------------------+

                  +------------------+
                  | Audit Consumer   |
                  +------------------+
```

## Fitur wajib

-   [ ] Producer untuk event order.
-   [ ] Consumer untuk memproses pembayaran simulasi.
-   [ ] Consumer notifikasi.
-   [ ] Audit consumer.
-   [ ] Event memiliki ID, timestamp, version, dan correlation ID.
-   [ ] Consumer idempotent.
-   [ ] Retry dan DLT.
-   [ ] Schema validation.
-   [ ] Outbox atau CDC.
-   [ ] Monitoring consumer lag.
-   [ ] TLS dan ACL.
-   [ ] Dokumentasi deployment dan recovery.

## Kriteria keberhasilan

1.  Event dapat diterbitkan dan dikonsumsi oleh beberapa service.
2.  Consumer dapat melanjutkan proses setelah restart.
3.  Pesan yang diproses ulang tidak menggandakan efek bisnis.
4.  Pesan gagal dapat ditelusuri dan di-replay dengan aman.
5.  Gangguan broker dapat dideteksi melalui monitoring.
6.  Hak akses service dibatasi sesuai kebutuhan.
7.  Ada dokumentasi arsitektur, konfigurasi, dan prosedur operasional.

------------------------------------------------------------------------

# Referensi Belajar

Utamakan dokumentasi resmi dan gunakan dokumentasi yang sesuai dengan
versi Kafka yang sedang dipakai.

-   [Apache Kafka
    Documentation](https://kafka.apache.org/documentation/)
-   [Apache Kafka Quickstart](https://kafka.apache.org/quickstart)
-   [Kafka Design](https://kafka.apache.org/documentation/#design)
-   [Kafka Producer
    Configuration](https://kafka.apache.org/documentation/#producerconfigs)
-   [Kafka Consumer
    Configuration](https://kafka.apache.org/documentation/#consumerconfigs)
-   [Kafka Broker
    Configuration](https://kafka.apache.org/documentation/#brokerconfigs)
-   [Kafka Connect](https://kafka.apache.org/documentation/#connect)
-   [Kafka Streams](https://kafka.apache.org/documentation/streams/)
-   [Confluent Developer](https://developer.confluent.io/)
-   [Debezium Documentation](https://debezium.io/documentation/)

------------------------------------------------------------------------

# Checklist Kompetensi Akhir

## Fundamental

-   [ ] Memahami event streaming dan event-driven architecture.
-   [ ] Memahami broker, topic, partition, offset, dan consumer group.
-   [ ] Memahami KRaft dan peran controller.

## Development

-   [ ] Membangun producer dan consumer.
-   [ ] Mengelola key, partition, dan offset.
-   [ ] Menangani retry, duplicate, dan poison message.
-   [ ] Mendesain event dan schema yang kompatibel.

## Integration

-   [ ] Mengintegrasikan Kafka dengan backend service.
-   [ ] Memahami Kafka Connect dan CDC.
-   [ ] Membangun stream processing sederhana.
-   [ ] Memahami outbox dan idempotent consumer.

## Operations

-   [ ] Mengamankan koneksi dan akses.
-   [ ] Memantau broker dan consumer lag.
-   [ ] Memahami replication dan recovery.
-   [ ] Melakukan capacity planning dan performance tuning.

## Production

-   [ ] Mendesain cluster sesuai kebutuhan beban.
-   [ ] Menyusun runbook dan prosedur incident.
-   [ ] Memahami trade-off durability, availability, latency, dan
    throughput.
-   [ ] Menyelesaikan proyek akhir end-to-end.

------------------------------------------------------------------------

## Saran Urutan Belajar

Jangan langsung mempelajari semua komponen ekosistem. Urutan yang
disarankan:

1.  Kuasai producer, consumer, topic, partition, dan offset.
2.  Bangun komunikasi antarservice menggunakan Kafka.
3.  Pelajari reliability: retry, idempotency, DLT, dan outbox.
4.  Lanjutkan ke Schema Registry, Connect, CDC, dan Streams.
5.  Terakhir, dalami security, monitoring, operasi cluster, dan
    performance tuning.

**Prinsip utama:** pahami alur data dan konsekuensi kegagalan terlebih
dahulu. Menguasai banyak konfigurasi CLI belum berarti siap
mengoperasikan Kafka di production.
