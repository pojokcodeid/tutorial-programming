# 🐰 Panduan Kurikulum Belajar RabbitMQ: Dari 0 Sampai Mahir

Panduan ini dirancang untuk mempelajari **RabbitMQ** dari konsep paling dasar hingga tingkat mahir (production-ready) menggunakan **Podman** sebagai lingkungan kontainerisasi lokal.

---

## 📌 Phase 1: Fondasi Message Broker & Setup Podman (Level 0)

### 1.1. Konsep Dasar Message Broker
* **Apa itu Message Broker?**
  * Perbedaan komunikasi *Synchronous* (HTTP/REST, gRPC) vs *Asynchronous* (Event-Driven).
  * Kapan harus menggunakan Message Broker (Decoupling, Asynchronous Processing, Rate Limiting/Spike Leveling).
  * Perbandingan singkat: RabbitMQ vs Apache Kafka vs Redis Pub/Sub.
* **Protokol AMQP 0-9-1**
  * Memahami protokol utama RabbitMQ: Advanced Message Queuing Protocol.

### 1.2. Setup RabbitMQ Server via Podman
* Menjalankan container RabbitMQ dengan **Management Plugin** aktif:
  ```bash
  podman run -d \
    --name rabbitmq-server \
    -p 5672:5672 \
    -p 15672:15672 \
    -e RABBITMQ_DEFAULT_USER=admin \
    -e RABBITMQ_DEFAULT_PASS=admin123 \
    rabbitmq:3-management
  ```
* Memahami port penting:
  * `5672`: Port default AMQP communication.
  * `15672`: Port RabbitMQ Management Web Dashboard.
* Mengakses & mengeksplorasi **Management Dashboard UI** di `http://localhost:15672`.

---

## 🏗️ Phase 2: Arsitektur Utama RabbitMQ & Komponen Dasar

### 2.1. Blok Bangunan Utama (Core Concepts)
* **Producer / Publisher:** Aplikasi yang mengirimkan pesan.
* **Exchange:** Komponen penerima pesan dari Producer yang menentukan aturan routing.
* **Queue:** Buffer penyimpan pesan sampai pesan tersebut dikonsumsi.
* **Binding & Binding Key:** Aturan/penghubung antara Exchange dan Queue.
* **Routing Key:** Label yang ditempelkan Producer pada pesan untuk dicocokkan oleh Exchange.
* **Consumer:** Aplikasi yang menerima dan memproses pesan dari Queue.

### 2.2. Manajemen via Command Line (`rabbitmqctl` & `rabbitmqadmin`)
* Menjalankan perintah di dalam Podman container:
  ```bash
  # Cek status node
  podman exec -it rabbitmq-server rabbitmqctl status

  # Melihat daftar queue, exchange, dan binding
  podman exec -it rabbitmq-server rabbitmqctl list_queues
  podman exec -it rabbitmq-server rabbitmqctl list_exchanges
  ```

---

## 🔀 Phase 3: Tipe-Tipe Exchange & Pola Routing (Messaging Patterns)

### 3.1. Default Exchange (Nameless)
* Routing pesan langsung ke Queue berdasarkan kesamaan `routing_key` dengan nama Queue.

### 3.2. Direct Exchange
* Unicast routing: Pesan dikirim ke Queue yang memiliki `binding_key` persis sama dengan `routing_key`.
* **Case Study:** Sistem notifikasi spesifik (Email, SMS).

### 3.3. Fanout Exchange
* Broadcast routing: Pesan dikirim ke **semua Queue** yang terikat tanpa mempedulikan `routing_key`.
* **Case Study:** Update cache global, leaderboard update.

### 3.4. Topic Exchange
* Multicast routing berbasis pattern matching (`*` untuk 1 kata, `#` untuk 0 atau banyak kata).
* **Case Study:** Log Aggregation (misal: `app.europe.error`, `audit.asia.info`).

### 3.5. Headers Exchange
* Routing berbasis kriteria pada atribut `headers` pesan, bukan `routing_key`.

---

## 🛡️ Phase 4: Keandalan Pesan & Pengolahan Lanjutan (Intermediate)

### 4.1. Message Durability & Persistence
* **Transient vs Durable Queue:** Memastikan Queue tidak hilang saat RabbitMQ restart.
* **Persistent Messages:** Menyimpan pesan ke dalam disk (`delivery_mode = 2`).

### 4.2. Consumer Acknowledgements (ACK / NACK / Reject)
* **Auto ACK vs Manual ACK:** Risiko kehilangan pesan jika pemrosesan gagal.
* Mencegah *message loss* dengan perintah `basic.ack`, `basic.nack`, dan `basic.reject`.
* `requeue = true` vs `requeue = false`.

### 4.3. Consumer Prefetch & Fair Dispatch
* Memahami masalah Unfair Dispatch (Round-robin default).
* Mengatur `qos(prefetch_count = 1)` agar Consumer hanya menerima beban sesuai kapasitas pemrosesannya.

### 4.4. Handling Failures (Dead Letter Exchange - DLX)
* Konfigurasi **DLX (Dead Letter Exchange)** dan **DLQ (Dead Letter Queue)**.
* Kasus terjadinya Dead Letter:
  * Pesan di-NACK/Reject dengan `requeue = false`.
  * Pesan kadaluarsa karena **TTL (Time-To-Live)**.
  * Queue melebihi batas kapasitas (*length limit*).

### 4.5. Fitur Lainnya
* **Message TTL & Queue TTL:** Pengaturan masa berlaku pesan.
* **Priority Queues:** Memprioritaskan pesan penting (0 - 255).

---

## 💻 Phase 5: Praktik Integrasi Kode (Multi-Language)

Mempelajari SDK klien RabbitMQ pada bahasa pemrograman yang diminati:

* **Node.js / TypeScript:** Menggunakan library `amqplib`.
* **Go (Golang):** Menggunakan driver `amqp091-go`.
* **Java:** Menggunakan `amqp-client` atau Spring AMQP (`spring-boot-starter-amqp`).

**Skenario Latihan:**
1. Membuat Worker Queue (Task Queue) sederhana.
2. Membuat Publisher & Subscriber dengan Retry Mechanism jika jaringan putus.
3. Mengimplementasikan Graceful Shutdown pada Consumer.

---

## ⚡ Phase 6: High Availability, Security, & Cluster (Advanced)

### 6.1. Clustering & High Availability (HA)
* Konsep RabbitMQ Cluster: Membagi metadata dan mengelola node.
* Menjalankan Multi-node Cluster lokal dengan **Podman Compose**.
* **Classic Queue Mirroring vs Quorum Queues:**
  * Memahami **Quorum Queues** (berbasis algoritma konsensus Raft) untuk ketahanan data modern.

### 6.2. Federation & Shovel Plugins
* **Shovel Plugin:** Memindahkan pesan secara eksplisit dari satu broker/queue ke broker/queue lain.
* **Federation Plugin:** Menghubungkan broker antar datacenter/region.

### 6.3. Security & Access Control
* **Authentication & Authorization:**
  * Pengelolaan User, Password, dan Virtual Hosts (`vhosts`).
  * Konfigurasi Permissions (Read, Write, Configure).
* **Enkripsi TLS/SSL:** Mengamankan komunikasi AMQP (Port 5671) dan HTTPS Management.

---

## 📊 Phase 7: Observability, Tuning, & Production Readiness

### 7.1. Monitoring & Metrics
* Exporting metrik RabbitMQ ke **Prometheus** (`rabbitmq_prometheus` plugin).
* Visualisasi dashboard performa menggunakan **Grafana**.
* Metrik kunci yang wajib dipantau:
  * Queue Depth (jumlah pesan menumpuk).
  * Consumer Unacknowledged Messages.
  * Node Memory & File Descriptors Usage.

### 7.2. Performance Tuning & Best Practices
* **Publisher Confirms:** Memastikan pesan diterima oleh broker secara asinkron.
* Memory Alarms & Disk Free Space Alarms.
* Menghindari perangkap umum (*Anti-patterns*):
  * Membuat dan menghapus Queue/Connection secara terus-menerus (*Connection Thrashing*).
  * Menggunakan terlalu banyak Queue atau Virtual Host dalam 1 cluster.

---

## 🛠️ Ringkasan Command Cheatsheet (Podman)

| Aksi | Perintah |
| :--- | :--- |
| **Start Server** | `podman run -d --name rmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management` |
| **Cek Status Node** | `podman exec -it rmq rabbitmqctl status` |
| **List Queues** | `podman exec -it rmq rabbitmqctl list_queues name messages consumers` |
| **Enable Plugin** | `podman exec -it rmq rabbitmq-plugins enable <nama_plugin>` |
| **Cek Health** | `podman exec -it rmq rabbitmq-diagnostics ping` |