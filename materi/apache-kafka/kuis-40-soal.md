# 📝 Kuis Apache Kafka — 40 Soal

> **Cara pakai:** kerjakan seluruh soal **tanpa membuka materi dulu**, dan **tandai soal yang kamu ragu** — jujur pada diri sendiri lebih berguna daripada skor tinggi yang dibantu. Kuis ini berisi **40 soal pilihan ganda** (A–D) yang tersebar merata di 25 pelajaran.
>
> **Skor kamu:**
> - **30–40 = Mahir** — paham konsep sampai praktik, boleh langsung ke Proyek Akhir.
> - **20–29 = Perlu ulang pelajaran** — lihat soal mana yang salah, lalu baca ulang pelajaran yang tertulis di judul soal itu.
> - **< 20 = Ulang dari pelajaran 1** — baca berurutan perlahan, jangan buru-buru ke materi lanjutan.
>
> Buka [Kunci Jawaban](#kunci-jawaban) **setelah** selesai; kolom pembahasan menjelaskan *kenapa* jawabannya benar.

### No. 1 — Event streaming vs queue (Pelajaran 1)
Perbedaan paling mendasar antara event streaming (Kafka) dan antrean pesan (queue) klasik adalah...

- A. Kafka hanya bisa memproses pesan teks, queue bisa biner
- B. Kafka menyimpan riwayat data dan mendukung pembaca ulang, queue biasanya menghapus pesan setelah dibaca
- C. Queue tidak mendukung multiple consumer, Kafka hanya satu consumer
- D. Kafka tidak membutuhkan server, queue membutuhkan

### No. 2 — Keunggulan EDA (Pelajaran 1)
Keunggulan utama pola event-driven architecture (EDA) dibanding komunikasi sinkron HTTP antarlayanan adalah...

- A. Setiap layanan harus mengetahui semua layanan lain agar bisa memanggil
- B. Pengirim tidak perlu tahu siapa penerima, dan kegagalan satu penerima tidak menahan pengirim
- C. Data selalu harus berukuran besar agar tidak hilang
- D. Menghilangkan kebutuhan validasi data sama sekali

### No. 3 — Konsep partition (Pelajaran 2)
Dalam Kafka, yang dimaksud dengan PARTITION adalah...

- A. Pembagian satu topic menjadi beberapa bagian log yang paralel dan berurutan di dalamnya
- B. Salinan penuh dari satu broker ke broker lain
- C. Kategori pengguna yang boleh mengakses topic
- D. Waktu kedaluwarsa sebuah record

### No. 4 — Arti offset (Pelajaran 2)
OFFSET pada record Kafka paling tepat diartikan sebagai...

- A. Jumlah byte yang dipakai record tersebut di disk
- B. Nomor urut posisi record di dalam satu partition
- C. Identitas unik broker yang menulis record
- D. Bobot prioritas antrean record

### No. 5 — KRaft di Kafka 4.0 (Pelajaran 4)
Sejak Kafka versi 4.0, mode koordinasi metadata yang didukung penuh (ZooKeeper sudah dihapus) adalah...

- A. ZooKeeper mode
- B. KRaft mode
- C. Standalone mode
- D. Replicated mode

### No. 6 — Variabel lingkungan broker (Pelajaran 3)
Untuk container image apache/kafka, variabel lingkungan yang dipakai untuk konfigurasi broker adalah prefix...

- A. KAFKA_
- B. KAFKA_BROKER_
- C. KAFKACFG_
- D. BROKER_

### No. 7 — Port inter-broker (Pelajaran 3)
Port bawaan listener inter-broker pada konfigurasi KRaft contoh (KRaft single-node) adalah...

- A. 2181
- B. 8083
- C. 9093
- D. 3306

### No. 8 — Melihat detail topic (Pelajaran 5)
Perintah untuk melihat daftar topic beserta detail partition dan replica-nya adalah...

- A. kafka-topics.sh --describe
- B. kafka-configs.sh --list
- C. kafka-consumer-groups.sh --describe
- D. kafka-broker-api-versions.sh

### No. 9 — Peran broker KRaft (Pelajaran 4)
Broker KRaft memainkan peran apa?

- A. Menyimpan data record (log) DAN metadata klaster dalam quorum controller
- B. Hanya menyimpan file log tanpa metadata
- C. Hanya menjadi client dari ZooKeeper
- D. Menjalankan UI web saja

### No. 10 — Karakteristik Kafka CLI (Pelajaran 5)
Perbedaan utama antara Kafka CLI dengan CLI database (mis. psql/mysql) adalah...

- A. Kafka CLI bekerja per topic/partition/offset dan memerlukan bootstrap server, bukan koneksi ke satu basis data relasional
- B. Kafka CLI hanya bisa dijalankan lewat Docker
- C. Kafka CLI tidak bisa menulis data
- D. Kafka CLI selalu butuh akses root

### No. 11 — Efek jumlah partition (Pelajaran 6)
Semakin BANYAK partition pada satu topic, dampaknya adalah...

- A. Selalu mempercepat penulisan tanpa efek samping
- B. Meningkatkan potensi paralelisme, tetapi menambah jumlah file terbuka, memori index, dan waktu pemulihan metadata
- C. Mengurangi ukuran data menjadi separuhnya
- D. Membuat consumer tidak perlu lagi memproses data

### No. 12 — Pemilihan partition (Pelajaran 6)
Pemilihan PARTITION untuk sebuah record ditentukan oleh...

- A. Jumlah consumer yang sedang berjalan
- B. Key record (hash key) atau round-robin bila tanpa key
- C. Waktu record dikirim
- D. Ukuran payload record

### No. 13 — Consumer lag (Pelajaran 7)
CONSUMER LAG terbaca dari mana?

- A. Dari selisih offset terakhir yang diproduksi dan offset terakhir yang dikonsumsi
- B. Dari jumlah consumer dalam group
- C. Dari ukuran file log di disk
- D. Dari jumlah broker yang hidup

### No. 14 — Rebalance saat anggota hilang (Pelajaran 11)
Ketika consumer group kehilangan salah satu anggotanya (mis. mati), yang terjadi adalah...

- A. Seluruh record dihapus agar aman
- B. REBALANCE: partition dibagi ulang ke consumer yang masih hidup
- C. Kafka berhenti menerima record baru
- D. Consumer lain menggabungkan semua group menjadi satu

### No. 15 — Pengertian ISR (Pelajaran 8)
ISR (In-Sync Replicas) adalah...

- A. Daftar semua broker yang terdaftar di klaster, termasuk yang mati
- B. Daftar replica yang dianggap sinkron dengan leader (masih mengikuti tulisan terbaru)
- C. Daftar topic yang sedang direplikasi ke wilayah lain
- D. Daftar consumer yang sedang membaca partition

### No. 16 — min.insync.replicas (Pelajaran 8)
Konfigurasi min.insync.replicas=2 dengan replication.factor=3 menjamin...

- A. Data hilang bila satu broker mati
- B. Write yang di-acks=all baru dianggap sukses bila minimal 2 replica menyimpannya — toleransi 1 kegagalan tanpa kehilangan acknowledged write
- C. Hanya boleh ada 2 consumer per partition
- D. Log dibagi menjadi 2 file

### No. 17 — acks=all (Pelajaran 9)
Konfigurasi producer acks=all maksudnya adalah...

- A. Semua client diizinkan menulis ke topic yang sama
- B. Record dianggap sukses setelah tersimpan di SEMUA replica in-sync (bukan hanya leader)
- C. Semua record harus berukuran sama
- D. Producer harus menunggu semua consumer selesai membaca

### No. 18 — Siklus consumer (Pelajaran 10)
Siklus kerja consumer yang benar dalam aplikasi adalah...

- A. Commit offset dulu, lalu proses record
- B. Poll → proses → commit (commit hanya setelah proses tuntas)
- C. Hanya poll tanpa pernah menyimpan posisi
- D. Proses tanpa poll agar tidak bolak-balik

### No. 19 — Paralelisme consumer group (Pelajaran 11)
Mengapa jumlah partition menjadi batas paralelisme dalam satu consumer group?

- A. Karena satu consumer hanya boleh memproses 1 record
- B. Karena satu partition hanya boleh dimiliki satu consumer per group pada satu waktu
- C. Karena consumer harus bergiliran membaca semua partition
- D. Karena partition dibatasi 10 per group

### No. 20 — Risiko saat rebalance (Pelajaran 11)
Saat terjadi rebalance, hal yang paling perlu diwaspadai oleh developer adalah...

- A. Data otomatis terhapus dari topic
- B. Offset yang belum ter-commit bisa diproses ulang — konsumen harus idempoten
- C. Consumer tidak bisa membaca sama sekali setelah rebalance
- D. Partition menjadi tidak berurutan selamanya

### No. 21 — Notification vs state transfer (Pelajaran 12)
Pola event notification berbeda dari event-carried state transfer karena...

- A. Notification membawa salinan data lengkap agar penerima mandiri
- B. Notification hanya memberi tahu "ada yang terjadi" dengan payload ringkas — penerima menarik data sendiri
- C. Notification hanya boleh dibaca oleh satu consumer
- D. Keduanya identik, hanya namanya berbeda

### No. 22 — Choreography vs orchestration (Pelajaran 12)
Perbedaan utama antara CHOREOGRAPHY dan ORCHESTRATION dalam integrasi event-driven adalah...

- A. Choreography memakai satu koordinator pusat yang memerintahkan langkah demi langkah
- B. Choreography tanpa pusat — tiap layanan bereaksi sendiri; orchestration memakai koordinator yang mengatur alur
- C. Orchestration hanya berlaku untuk database relasional
- D. Keduanya selalu membutuhkan Kafka Streams

### No. 23 — Event sourcing (Pelajaran 13)
Yang dimaksud dengan EVENT SOURCING adalah...

- A. Menyimpan state terkini saja tanpa riwayat
- B. Menyimpan urutan event sebagai sumber kebenaran utama; state terbaru dihitung dengan merekayasa ulang event
- C. Mengirim event ke banyak topic sekaligus
- D. Menghapus event setelah state diperbarui

### No. 24 — CQRS (Pelajaran 13)
CQRS (Command Query Responsibility Segregation) berarti...

- A. Menggabungkan model tulis dan baca menjadi satu tabel agar sederhana
- B. Memisahkan model tulis dan model baca — model baca dibangun sebagai projection dari event
- C. Membatasi satu consumer untuk menulis saja
- D. Menulis data dua kali ke dua topic berbeda

### No. 25 — At-least-once (Pelajaran 14)
Delivery semantics AT-LEAST-ONCE berarti...

- A. Setiap record diproses tepat satu kali, tidak lebih tidak kurang
- B. Record diproses setidaknya sekali — bisa terduplikasi setelah crash/retry
- C. Record bisa hilang bila consumer mati
- D. Record hanya diproses bila ada satu consumer saja

### No. 26 — Transactional outbox (Pelajaran 15)
Masalah utama yang dipecahkan oleh TRANSACTIONAL OUTBOX adalah...

- A. Topic yang terlalu banyak
- B. Dual-write problem: menulis database dan Kafka dalam dua langkah yang bisa gagal terpisah
- C. Consumer yang terlalu lambat membaca
- D. Ukuran payload yang terlalu besar

### No. 27 — Dead Letter Topic (Pelajaran 16)
Dead Letter Topic (DLT) berfungsi sebagai...

- A. Topic utama tempat seluruh record ditulis
- B. Topic tujuan record yang sudah menyerah setelah percobaan gagal, lengkap dengan metadata error untuk diperiksa/di-replay
- C. Salinan cadangan seluruh topic untuk backup
- D. Topic khusus consumer yang sedang rebalance

### No. 28 — Transient vs non-retryable (Pelajaran 16)
Perbedaan kegagalan TRANSIENT dan NON-RETRYABLE adalah...

- A. Transient (broker/jaringan/DB mati sesaat) layak diulang; non-retryable (payload rusak) langsung ke DLT
- B. Keduanya selalu diulang tanpa batas
- C. Non-retryable hanya terjadi pada producer
- D. Transient tidak pernah terjadi di produksi

### No. 29 — Peran Schema Registry (Pelajaran 17)
Peran Schema Registry dalam ekosistem Kafka adalah...

- A. Menyimpan seluruh record data di dalamnya
- B. Menjadi pusat pendaftaran dan validasi skema; record di Kafka hanya membawa schema id yang menunjuk definisi di registry
- C. Menggantikan broker Kafka untuk menulis data
- D. Menjalankan consumer group

### No. 30 — Kompatibilitas BACKWARD (Pelajaran 17)
Skema Avro v2 menambah field baru "currency" dengan default "IDR". Pada mode kompatibilitas BACKWARD, hasil registrasi akan...

- A. Ditolak karena menambah field
- B. Diterima, karena skema baru tetap bisa membaca data lama (field baru punya default)
- C. Ditolak karena default tidak diperbolehkan
- D. Diterima hanya bila memakai ZooKeeper

### No. 31 — Peran Kafka Connect (Pelajaran 18)
Kafka Connect terutama digunakan untuk...

- A. Menulis logika bisnis dalam Java
- B. Memindahkan data antara Kafka dan sistem lain (database, search, storage) secara berbasis KONFIGURASI tanpa menulis kode
- C. Menggantikan Schema Registry
- D. Mengelola consumer group secara manual

### No. 32 — Debezium (CDC) (Pelajaran 18)
Debezium termasuk connector jenis apa dan bekerja dengan cara apa?

- A. Sink connector yang menulis ke Elasticsearch
- B. Source connector CDC yang membaca perubahan database langsung dari log perubahannya (WAL/binlog)
- C. Connector yang hanya menyalin file dari disk
- D. Connector yang menghapus data lama

### No. 33 — Stream vs table (Pelajaran 19)
Perbedaan mendasar STREAM dan TABLE dalam Kafka Streams/ksqlDB adalah...

- A. Stream adalah urutan fakta append-only; table adalah state terkini per kunci (hasil pengurangan stream)
- B. Stream hanya untuk teks, table untuk angka
- C. Table selalu lebih kecil dari stream
- D. Stream tidak bisa diagregasi

### No. 34 — Mekanisme SASL produksi (Pelajaran 20)
Mekanisme SASL yang paling direkomendasikan untuk produksi (tanpa mengirim password mentah) adalah...

- A. PLAIN tanpa TLS
- B. SCRAM-SHA-256/512 (challenge–response) — idealnya dibungkus TLS
- C. Menyimpan password di kode aplikasi
- D. Mematikan autentikasi agar cepat

### No. 35 — Prinsip least privilege (Pelajaran 20)
Dalam ACL Kafka, prinsip "least privilege" berarti...

- A. Memberikan hak SELUAS mungkin agar aplikasi tidak terhambat
- B. Memberikan hak paling sedikit yang benar-benar dibutuhkan oleh tiap principal
- C. Menjalankan semua aplikasi dengan user super admin
- D. Menonaktifkan authorizer agar sederhana

### No. 36 — Deteksi dini consumer tertinggal (Pelajaran 21)
Metrik yang paling berguna sebagai DETEKSI DINI bahwa consumer tertinggal jauh adalah...

- A. Jumlah broker yang hidup
- B. Consumer lag (records-lag-max) per partition/group
- C. Ukuran file server.log
- D. Jumlah topic yang dibuat

### No. 37 — Retensi vs compaction (Pelajaran 22)
Mengapa log compaction berbeda dari retensi biasa?

- A. Retensi biasa menghapus seluruh record lama berdasar umur; compaction menyisakan nilai TERAKHIR per kunci sehingga setiap key tetap tersedia
- B. Compaction menghapus semua record yang belum dibaca
- C. Retensi biasa hanya berlaku untuk key numerik
- D. Compaction menggandakan ukuran log dua kali lipat

### No. 38 — Efek linger.ms (Pelajaran 23)
Mengapa linger.ms dinaikkan (mis. 20 ms) dapat menaikkan throughput producer?

- A. Karena record menjadi lebih kecil ukurannya
- B. Karena producer menunggu sebentar agar batch lebih penuh — lebih sedikit request dengan data lebih banyak per request
- C. Karena broker memaksa mengirim ulang data
- D. Karena consumer mempercepat komit

### No. 39 — Cluster linking (Pelajaran 24)
Untuk arsitektur multi-datacenter, mekanisme replikasi yang berjalan DI DALAM broker (server-side) adalah...

- A. MirrorMaker 2 yang berjalan di atas Kafka Connect
- B. Cluster linking
- C. kafka-console-consumer.sh
- D. Schema Registry

### No. 40 — Kesiapan produksi (Pelajaran 25)
Langkah PALING PENTING sebelum menyebut pipeline Kafka "siap produksi" menurut proyek akhir adalah...

- A. Menambah jumlah topic menjadi dua kali lipat
- B. Menguji jalur KEGAGALAN (DLT, retry, uji matikan broker) — bukan hanya jalur sukses — serta memastikan checklist, runbook, dan idempotensi terpenuhi
- C. Mematikan monitoring agar tampilan bersih
- D. Menggunakan replication.factor 1 untuk mempercepat

## Kunci Jawaban

| No | Jawaban | Pembahasan |
|----|---------|------------|
| 1 | B | Kafka adalah log terdistribusi: record tetap tersimpan selama retensi sehingga bisa dibaca ulang oleh banyak consumer/group — queue klasik menghapus pesan setelah satu consumer menerimanya. |
| 2 | B | Dengan EDA, satu peristiwa ditulis sekali ke topic lalu dibaca siapa pun yang berlangganan — pengirim tidak terikat pada penerima, dan layanan baru bisa bergabung tanpa mengubah pengirim. |
| 3 | A | Partition adalah unit paralelisme Kafka: satu topic dipecah menjadi beberapa partition, masing-masing berupa log berurutan yang dapat dilayani broker berbeda secara bersamaan. |
| 4 | B | Offset adalah penanda posisi (indeks) record di dalam satu partition — consumer menyimpan offset terakhir yang diproses agar bisa melanjutkan dari posisi itu. |
| 5 | B | Kafka 4.0 hanya mendukung KRaft (Kafka Raft Metadata mode) — ZooKeeper sudah tidak didukung, sehingga seluruh klaster harus berjalan tanpa ZooKeeper. |
| 6 | A | Image apache/kafka membaca konfigurasi dari variabel lingkungan berprefix KAFKA_ (mis. KAFKA_NODE_ID, KAFKA_PROCESS_ROLES) yang diterjemahkan ke server.properties. |
| 7 | C | 9093 adalah port listener internal/inter-broker (9092 untuk listener eksternal client) — 2181 adalah ZooKeeper yang tidak dipakai di KRaft, 8083 milik Kafka Connect, 3306 milik MySQL. |
| 8 | A | kafka-topics.sh --describe (opsional --topic nama) menampilkan partition, leader, ISR, dan replica — alat utama untuk memeriksa kesehatan topic. |
| 9 | A | Di KRaft, broker sekaligus menjadi anggota quorum metadata: sebagian node berperan controller (metadata klaster) dan sebagian/sekaligus broker (penyimpanan record) tanpa ZooKeeper. |
| 10 | A | Perintah Kafka berorientasi pada topik, partition, offset, dan consumer group melalui bootstrap server — bukan tabel/baris seperti CLI database relasional. |
| 11 | B | Partition adalah unit paralelisme — bertambah = lebih banyak yang bisa diparalelkan, tapi juga lebih banyak file index, memori, dan metadata yang harus dikelola (karenanya jumlahnya harus disengaja). |
| 12 | B | Bila ada key, Kafka meng-hash key untuk menentukan partition sehingga record dengan key sama selalu jatuh ke partition yang sama (menjaga urutan per key); tanpa key, Kafka menyebar (round-robin/murmur2). |
| 13 | A | Lag = LOG-END-OFFSET (posisi tulis terakhir) dikurangi CURRENT-OFFSET (posisi baca terakhir) per partition — angka ini menunjukkan seberapa jauh consumer tertinggal. |
| 14 | B | Rebalance membagi ulang kepemilikan partition dalam group saat anggota baru bergabung atau lama keluar/mati — inilah alasan pengaturan max.poll.interval.ms dan session timeout penting. |
| 15 | B | ISR berisi replica yang tertinggalnya tidak melebihi toleransi — hanya dari ISR yang dipilih leader baru, dan min.insync.replicas menentukan jumlah minimum yang harus sinkron agar write dianggap aman. |
| 16 | B | Kombinasi acks=all + min.insync.replicas=2 berarti sukses = tersimpan di minimal 2 mesin; bila hanya 1 yang tersinkron, producer menerima NotEnoughReplicas (menolak, bukan mengaku sukses). |
| 17 | B | acks=all (=-1) meminta konfirmasi dari seluruh in-sync replica — memberi ketahanan terbaik, dengan biaya latency sedikit lebih tinggi. |
| 18 | B | Commit setelah proses tuntas membuat crash di tengah menyebabkan record diproses ulang (at-least-once) — lebih baik daripada commit di awal yang bisa membuat record hilang. |
| 19 | B | Dalam satu group, satu partition hanya di-assign ke satu consumer — sehingga menambah consumer melebihi jumlah partition tidak menambah paralelisme apa pun. |
| 20 | B | Rebalance memindahkan partition ke consumer lain; record yang belum ter-commit akan dibaca ulang oleh penerima baru — karena itu idempotensi adalah pengaman wajib. |
| 21 | B | Notification ringkas (mis. hanya order_id) sehingga penerima harus memanggil service asal; state transfer membawa data lengkap agar penerima mandiri — trade-off antara ukuran payload dan ketergantungan. |
| 22 | B | Choreography sederhana dan longgar tapi sulit dilacak saat alur panjang; orchestration membuat alur jelas dan terawasi tetapi koordinator menjadi titik kompleksitas — pilih sesuai panjang dan pengecualian alur. |
| 23 | B | Event sourcing menjadikan log event sebagai database utama — state saat ini adalah hasil rekayasa ulang seluruh event, memberi jejak audit lengkap dan kemampuan rekonstruksi. |
| 24 | B | CQRS memisahkan sisi tulis dan baca: baca dilayani projection yang dibangun dari stream event (mis. Kafka Streams) sehingga tampilan bisa dioptimalkan tanpa memengaruhi penulisan. |
| 25 | B | At-least-once menghasilkan kemungkinan duplikasi (proses ulang setelah commit tertunda) — aman bila konsumen idempoten; exactly-once yang menjamin tepat sekali butuh mekanisme transaksional khusus. |
| 26 | B | Outbox menulis perubahan bisnis dan catatan event dalam SATU transaksi database, lalu relay (polling/CDC) mendistribusikannya ke Kafka — tidak ada lagi celah antara "data berubah" dan "event terkirim". |
| 27 | B | DLT menyimpan pesan bermasalah (payload rusak, error permanen) beserta keterangan errornya — pesan tidak hilang dan bisa diperbaiki lalu di-replay secara terkendali. |
| 28 | A | Kegagalan luar aplikasi biasanya membaik dengan sendirinya (layak backoff); sedangkan isi payload yang rusak tidak akan pernah berhasil diproses sehingga mengulang hanya membuang waktu — langsung ke DLT. |
| 29 | B | Registry menyimpan definisi skema dan memeriksa kompatibilitas saat registrasi; payload tetap ringkas (hanya schema id + data biner) sehingga makna data tetap terkontrol tanpa membebani log. |
| 30 | B | BACKWARD menuntut skema baru bisa membaca data lama — field baru dengan default memenuhi syarat itu. Mengubah tipe field lama yang justru akan ditolak. |
| 31 | B | Connect adalah kerangka integrasi berbasis konfigurasi: deploy connector (source/sink) lewat REST API :8083 — tanpa menulis producer/consumer untuk integrasi yang sudah umum. |
| 32 | B | Debezium adalah source connector Change Data Capture: terhubung sebagai replica logikal sehingga setiap INSERT/UPDATE/DELETE terbaca dari log database menjadi event (before/after) ke Kafka tanpa query berulang. |
| 33 | A | Stream mencatat setiap peristiwa; table menyimpan nilai terakhir per kunci — table pada dasarnya adalah snapshot dari stream, keduanya saling melengkapi dalam pemrosesan. |
| 34 | B | SCRAM mengirim challenge–response sehingga password tidak pernah mengalir mentah; PLAIN hanya aman bila berada di dalam koneksi TLS. Autentikasi tanpa TLS membuat seluruh upaya keamanan lain percuma. |
| 35 | B | Least privilege = producer hanya WRITE+DESCRIBE topiknya, consumer hanya READ+DESCRIBE topik dan group-nya — memperkecil dampak bila ada kredensial yang bocor. |
| 36 | B | Lag menunjukkan langsung seberapa jauh pemrosesan tertinggal dari produksi; dipantau per partition (bukan hanya rata-rata total) agar satu partisi yang bermasalah tidak tersembunyi. |
| 37 | A | Compaction cocok untuk topik berbasis kunci (state/checkpoint): duplikat lama dibuang tapi nilai terbaru per key dijamin tetap ada — berbeda dari retensi yang membuang berdasarkan waktu/ukuran. |
| 38 | B | Jeda kecil membuat record terkumpul menjadi batch besar (dengan batch.size memadai) sehingga jumlah request menurun dan throughput naik — biayanya adalah penambahan latency kecil. |
| 39 | B | Cluster linking menyalin data langsung antarbroker tanpa jalur client, sehingga lebih efisien dan offset dikirim oleh broker sumber; MirrorMaker 2 bekerja di lapisan client lewat Connect. |
| 40 | B | Banyak tim hanya menguji jalur sukses lalu menemukan DLT/replay bermasalah saat insiden. Uji kegagalan + checklist + runbook + idempotensi adalah bukti kesiapan nyata sebuah sistem. |
