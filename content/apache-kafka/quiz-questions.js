/* ============================================================
   Soal kuis Apache Kafka — 40 soal (kafka01–kafka40)
   Sebaran: 1–10 = pelajaran 1–5 · 11–20 = pelajaran 6–11
            21–30 = pelajaran 12–17 · 31–37 = pelajaran 18–22
            38–40 = pelajaran 23–25
   ============================================================ */
'use strict';

window.KAFKA_QUIZ_POOL = window.KAFKA_QUIZ_POOL || [];

window.KAFKA_QUIZ_POOL.push(
  {
    id: 'kafka01',
    q: 'Perbedaan paling mendasar antara event streaming (Kafka) dan antrean pesan (queue) klasik adalah...',
    options: [
      'Kafka hanya bisa memproses pesan teks, queue bisa biner',
      'Kafka menyimpan riwayat data dan mendukung pembaca ulang, queue biasanya menghapus pesan setelah dibaca',
      'Queue tidak mendukung multiple consumer, Kafka hanya satu consumer',
      'Kafka tidak membutuhkan server, queue membutuhkan'
    ],
    answer: 1,
    explain: 'Kafka adalah log terdistribusi: record tetap tersimpan selama retensi sehingga bisa dibaca ulang oleh banyak consumer/group — queue klasik menghapus pesan setelah satu consumer menerimanya.'
  },
  {
    id: 'kafka02',
    q: 'Keunggulan utama pola event-driven architecture (EDA) dibanding komunikasi sinkron HTTP antarlayanan adalah...',
    options: [
      'Setiap layanan harus mengetahui semua layanan lain agar bisa memanggil',
      'Pengirim tidak perlu tahu siapa penerima, dan kegagalan satu penerima tidak menahan pengirim',
      'Data selalu harus berukuran besar agar tidak hilang',
      'Menghilangkan kebutuhan validasi data sama sekali'
    ],
    answer: 1,
    explain: 'Dengan EDA, satu peristiwa ditulis sekali ke topic lalu dibaca siapa pun yang berlangganan — pengirim tidak terikat pada penerima, dan layanan baru bisa bergabung tanpa mengubah pengirim.'
  },
  {
    id: 'kafka03',
    q: 'Dalam Kafka, yang dimaksud dengan PARTITION adalah...',
    options: [
      'Pembagian satu topic menjadi beberapa bagian log yang paralel dan berurutan di dalamnya',
      'Salinan penuh dari satu broker ke broker lain',
      'Kategori pengguna yang boleh mengakses topic',
      'Waktu kedaluwarsa sebuah record'
    ],
    answer: 0,
    explain: 'Partition adalah unit paralelisme Kafka: satu topic dipecah menjadi beberapa partition, masing-masing berupa log berurutan yang dapat dilayani broker berbeda secara bersamaan.'
  },
  {
    id: 'kafka04',
    q: 'OFFSET pada record Kafka paling tepat diartikan sebagai...',
    options: [
      'Jumlah byte yang dipakai record tersebut di disk',
      'Nomor urut posisi record di dalam satu partition',
      'Identitas unik broker yang menulis record',
      'Bobot prioritas antrean record'
    ],
    answer: 1,
    explain: 'Offset adalah penanda posisi (indeks) record di dalam satu partition — consumer menyimpan offset terakhir yang diproses agar bisa melanjutkan dari posisi itu.'
  },
  {
    id: 'kafka05',
    q: 'Sejak Kafka versi 4.0, mode koordinasi metadata yang didukung penuh (ZooKeeper sudah dihapus) adalah...',
    options: [
      'ZooKeeper mode',
      'KRaft mode',
      'Standalone mode',
      'Replicated mode'
    ],
    answer: 1,
    explain: 'Kafka 4.0 hanya mendukung KRaft (Kafka Raft Metadata mode) — ZooKeeper sudah tidak didukung, sehingga seluruh klaster harus berjalan tanpa ZooKeeper.'
  },
  {
    id: 'kafka06',
    q: 'Untuk container image apache/kafka, variabel lingkungan yang dipakai untuk konfigurasi broker adalah prefix...',
    options: [
      'KAFKA_',
      'KAFKA_BROKER_',
      'KAFKACFG_',
      'BROKER_'
    ],
    answer: 0,
    explain: 'Image apache/kafka membaca konfigurasi dari variabel lingkungan berprefix KAFKA_ (mis. KAFKA_NODE_ID, KAFKA_PROCESS_ROLES) yang diterjemahkan ke server.properties.'
  },
  {
    id: 'kafka07',
    q: 'Port bawaan listener inter-broker pada konfigurasi KRaft contoh (KRaft single-node) adalah...',
    options: [
      '2181',
      '8083',
      '9093',
      '3306'
    ],
    answer: 2,
    explain: '9093 adalah port listener internal/inter-broker (9092 untuk listener eksternal client) — 2181 adalah ZooKeeper yang tidak dipakai di KRaft, 8083 milik Kafka Connect, 3306 milik MySQL.'
  },
  {
    id: 'kafka08',
    q: 'Perintah untuk melihat daftar topic beserta detail partition dan replica-nya adalah...',
    options: [
      'kafka-topics.sh --describe',
      'kafka-configs.sh --list',
      'kafka-consumer-groups.sh --describe',
      'kafka-broker-api-versions.sh'
    ],
    answer: 0,
    explain: 'kafka-topics.sh --describe (opsional --topic nama) menampilkan partition, leader, ISR, dan replica — alat utama untuk memeriksa kesehatan topic.'
  },
  {
    id: 'kafka09',
    q: 'Broker KRaft memainkan peran apa?',
    options: [
      'Menyimpan data record (log) DAN metadata klaster dalam quorum controller',
      'Hanya menyimpan file log tanpa metadata',
      'Hanya menjadi client dari ZooKeeper',
      'Menjalankan UI web saja'
    ],
    answer: 0,
    explain: 'Di KRaft, broker sekaligus menjadi anggota quorum metadata: sebagian node berperan controller (metadata klaster) dan sebagian/sekaligus broker (penyimpanan record) tanpa ZooKeeper.'
  },
  {
    id: 'kafka10',
    q: 'Perbedaan utama antara Kafka CLI dengan CLI database (mis. psql/mysql) adalah...',
    options: [
      'Kafka CLI bekerja per topic/partition/offset dan memerlukan bootstrap server, bukan koneksi ke satu basis data relasional',
      'Kafka CLI hanya bisa dijalankan lewat Docker',
      'Kafka CLI tidak bisa menulis data',
      'Kafka CLI selalu butuh akses root'
    ],
    answer: 0,
    explain: 'Perintah Kafka berorientasi pada topik, partition, offset, dan consumer group melalui bootstrap server — bukan tabel/baris seperti CLI database relasional.'
  },
  {
    id: 'kafka11',
    q: 'Semakin BANYAK partition pada satu topic, dampaknya adalah...',
    options: [
      'Selalu mempercepat penulisan tanpa efek samping',
      'Meningkatkan potensi paralelisme, tetapi menambah jumlah file terbuka, memori index, dan waktu pemulihan metadata',
      'Mengurangi ukuran data menjadi separuhnya',
      'Membuat consumer tidak perlu lagi memproses data'
    ],
    answer: 1,
    explain: 'Partition adalah unit paralelisme — bertambah = lebih banyak yang bisa diparalelkan, tapi juga lebih banyak file index, memori, dan metadata yang harus dikelola (karenanya jumlahnya harus disengaja).'
  },
  {
    id: 'kafka12',
    q: 'Pemilihan PARTITION untuk sebuah record ditentukan oleh...',
    options: [
      'Jumlah consumer yang sedang berjalan',
      'Key record (hash key) atau round-robin bila tanpa key',
      'Waktu record dikirim',
      'Ukuran payload record'
    ],
    answer: 1,
    explain: 'Bila ada key, Kafka meng-hash key untuk menentukan partition sehingga record dengan key sama selalu jatuh ke partition yang sama (menjaga urutan per key); tanpa key, Kafka menyebar (round-robin/murmur2).'
  },
  {
    id: 'kafka13',
    q: 'CONSUMER LAG terbaca dari mana?',
    options: [
      'Dari selisih offset terakhir yang diproduksi dan offset terakhir yang dikonsumsi',
      'Dari jumlah consumer dalam group',
      'Dari ukuran file log di disk',
      'Dari jumlah broker yang hidup'
    ],
    answer: 0,
    explain: 'Lag = LOG-END-OFFSET (posisi tulis terakhir) dikurangi CURRENT-OFFSET (posisi baca terakhir) per partition — angka ini menunjukkan seberapa jauh consumer tertinggal.'
  },
  {
    id: 'kafka14',
    q: 'Ketika consumer group kehilangan salah satu anggotanya (mis. mati), yang terjadi adalah...',
    options: [
      'Seluruh record dihapus agar aman',
      'REBALANCE: partition dibagi ulang ke consumer yang masih hidup',
      'Kafka berhenti menerima record baru',
      'Consumer lain menggabungkan semua group menjadi satu'
    ],
    answer: 1,
    explain: 'Rebalance membagi ulang kepemilikan partition dalam group saat anggota baru bergabung atau lama keluar/mati — inilah alasan pengaturan max.poll.interval.ms dan session timeout penting.'
  },
  {
    id: 'kafka15',
    q: 'ISR (In-Sync Replicas) adalah...',
    options: [
      'Daftar semua broker yang terdaftar di klaster, termasuk yang mati',
      'Daftar replica yang dianggap sinkron dengan leader (masih mengikuti tulisan terbaru)',
      'Daftar topic yang sedang direplikasi ke wilayah lain',
      'Daftar consumer yang sedang membaca partition'
    ],
    answer: 1,
    explain: 'ISR berisi replica yang tertinggalnya tidak melebihi toleransi — hanya dari ISR yang dipilih leader baru, dan min.insync.replicas menentukan jumlah minimum yang harus sinkron agar write dianggap aman.'
  },
  {
    id: 'kafka16',
    q: 'Konfigurasi min.insync.replicas=2 dengan replication.factor=3 menjamin...',
    options: [
      'Data hilang bila satu broker mati',
      'Write yang di-acks=all baru dianggap sukses bila minimal 2 replica menyimpannya — toleransi 1 kegagalan tanpa kehilangan acknowledged write',
      'Hanya boleh ada 2 consumer per partition',
      'Log dibagi menjadi 2 file'
    ],
    answer: 1,
    explain: 'Kombinasi acks=all + min.insync.replicas=2 berarti sukses = tersimpan di minimal 2 mesin; bila hanya 1 yang tersinkron, producer menerima NotEnoughReplicas (menolak, bukan mengaku sukses).'
  },
  {
    id: 'kafka17',
    q: 'Konfigurasi producer acks=all maksudnya adalah...',
    options: [
      'Semua client diizinkan menulis ke topic yang sama',
      'Record dianggap sukses setelah tersimpan di SEMUA replica in-sync (bukan hanya leader)',
      'Semua record harus berukuran sama',
      'Producer harus menunggu semua consumer selesai membaca'
    ],
    answer: 1,
    explain: "acks=all (=-1) meminta konfirmasi dari seluruh in-sync replica — memberi ketahanan terbaik, dengan biaya latency sedikit lebih tinggi."
  },
  {
    id: 'kafka18',
    q: 'Siklus kerja consumer yang benar dalam aplikasi adalah...',
    options: [
      'Commit offset dulu, lalu proses record',
      'Poll → proses → commit (commit hanya setelah proses tuntas)',
      'Hanya poll tanpa pernah menyimpan posisi',
      'Proses tanpa poll agar tidak bolak-balik'
    ],
    answer: 1,
    explain: 'Commit setelah proses tuntas membuat crash di tengah menyebabkan record diproses ulang (at-least-once) — lebih baik daripada commit di awal yang bisa membuat record hilang.'
  },
  {
    id: 'kafka19',
    q: 'Mengapa jumlah partition menjadi batas paralelisme dalam satu consumer group?',
    options: [
      'Karena satu consumer hanya boleh memproses 1 record',
      'Karena satu partition hanya boleh dimiliki satu consumer per group pada satu waktu',
      'Karena consumer harus bergiliran membaca semua partition',
      'Karena partition dibatasi 10 per group'
    ],
    answer: 1,
    explain: 'Dalam satu group, satu partition hanya di-assign ke satu consumer — sehingga menambah consumer melebihi jumlah partition tidak menambah paralelisme apa pun.'
  },
  {
    id: 'kafka20',
    q: 'Saat terjadi rebalance, hal yang paling perlu diwaspadai oleh developer adalah...',
    options: [
      'Data otomatis terhapus dari topic',
      'Offset yang belum ter-commit bisa diproses ulang — konsumen harus idempoten',
      'Consumer tidak bisa membaca sama sekali setelah rebalance',
      'Partition menjadi tidak berurutan selamanya'
    ],
    answer: 1,
    explain: 'Rebalance memindahkan partition ke consumer lain; record yang belum ter-commit akan dibaca ulang oleh penerima baru — karena itu idempotensi adalah pengaman wajib.'
  },
  {
    id: 'kafka21',
    q: 'Pola event notification berbeda dari event-carried state transfer karena...',
    options: [
      'Notification membawa salinan data lengkap agar penerima mandiri',
      'Notification hanya memberi tahu "ada yang terjadi" dengan payload ringkas — penerima menarik data sendiri',
      'Notification hanya boleh dibaca oleh satu consumer',
      'Keduanya identik, hanya namanya berbeda'
    ],
    answer: 1,
    explain: 'Notification ringkas (mis. hanya order_id) sehingga penerima harus memanggil service asal; state transfer membawa data lengkap agar penerima mandiri — trade-off antara ukuran payload dan ketergantungan.'
  },
  {
    id: 'kafka22',
    q: 'Perbedaan utama antara CHOREOGRAPHY dan ORCHESTRATION dalam integrasi event-driven adalah...',
    options: [
      'Choreography memakai satu koordinator pusat yang memerintahkan langkah demi langkah',
      'Choreography tanpa pusat — tiap layanan bereaksi sendiri; orchestration memakai koordinator yang mengatur alur',
      'Orchestration hanya berlaku untuk database relasional',
      'Keduanya selalu membutuhkan Kafka Streams'
    ],
    answer: 1,
    explain: 'Choreography sederhana dan longgar tapi sulit dilacak saat alur panjang; orchestration membuat alur jelas dan terawasi tetapi koordinator menjadi titik kompleksitas — pilih sesuai panjang dan pengecualian alur.'
  },
  {
    id: 'kafka23',
    q: 'Yang dimaksud dengan EVENT SOURCING adalah...',
    options: [
      'Menyimpan state terkini saja tanpa riwayat',
      'Menyimpan urutan event sebagai sumber kebenaran utama; state terbaru dihitung dengan merekayasa ulang event',
      'Mengirim event ke banyak topic sekaligus',
      'Menghapus event setelah state diperbarui'
    ],
    answer: 1,
    explain: 'Event sourcing menjadikan log event sebagai database utama — state saat ini adalah hasil rekayasa ulang seluruh event, memberi jejak audit lengkap dan kemampuan rekonstruksi.'
  },
  {
    id: 'kafka24',
    q: 'CQRS (Command Query Responsibility Segregation) berarti...',
    options: [
      'Menggabungkan model tulis dan baca menjadi satu tabel agar sederhana',
      'Memisahkan model tulis dan model baca — model baca dibangun sebagai projection dari event',
      'Membatasi satu consumer untuk menulis saja',
      'Menulis data dua kali ke dua topic berbeda'
    ],
    answer: 1,
    explain: 'CQRS memisahkan sisi tulis dan baca: baca dilayani projection yang dibangun dari stream event (mis. Kafka Streams) sehingga tampilan bisa dioptimalkan tanpa memengaruhi penulisan.'
  },
  {
    id: 'kafka25',
    q: 'Delivery semantics AT-LEAST-ONCE berarti...',
    options: [
      'Setiap record diproses tepat satu kali, tidak lebih tidak kurang',
      'Record diproses setidaknya sekali — bisa terduplikasi setelah crash/retry',
      'Record bisa hilang bila consumer mati',
      'Record hanya diproses bila ada satu consumer saja'
    ],
    answer: 1,
    explain: 'At-least-once menghasilkan kemungkinan duplikasi (proses ulang setelah commit tertunda) — aman bila konsumen idempoten; exactly-once yang menjamin tepat sekali butuh mekanisme transaksional khusus.'
  },
  {
    id: 'kafka26',
    q: 'Masalah utama yang dipecahkan oleh TRANSACTIONAL OUTBOX adalah...',
    options: [
      'Topic yang terlalu banyak',
      'Dual-write problem: menulis database dan Kafka dalam dua langkah yang bisa gagal terpisah',
      'Consumer yang terlalu lambat membaca',
      'Ukuran payload yang terlalu besar'
    ],
    answer: 1,
    explain: 'Outbox menulis perubahan bisnis dan catatan event dalam SATU transaksi database, lalu relay (polling/CDC) mendistribusikannya ke Kafka — tidak ada lagi celah antara "data berubah" dan "event terkirim".'
  },
  {
    id: 'kafka27',
    q: 'Dead Letter Topic (DLT) berfungsi sebagai...',
    options: [
      'Topic utama tempat seluruh record ditulis',
      'Topic tujuan record yang sudah menyerah setelah percobaan gagal, lengkap dengan metadata error untuk diperiksa/di-replay',
      'Salinan cadangan seluruh topic untuk backup',
      'Topic khusus consumer yang sedang rebalance'
    ],
    answer: 1,
    explain: 'DLT menyimpan pesan bermasalah (payload rusak, error permanen) beserta keterangan errornya — pesan tidak hilang dan bisa diperbaiki lalu di-replay secara terkendali.'
  },
  {
    id: 'kafka28',
    q: 'Perbedaan kegagalan TRANSIENT dan NON-RETRYABLE adalah...',
    options: [
      'Transient (broker/jaringan/DB mati sesaat) layak diulang; non-retryable (payload rusak) langsung ke DLT',
      'Keduanya selalu diulang tanpa batas',
      'Non-retryable hanya terjadi pada producer',
      'Transient tidak pernah terjadi di produksi'
    ],
    answer: 0,
    explain: 'Kegagalan luar aplikasi biasanya membaik dengan sendirinya (layak backoff); sedangkan isi payload yang rusak tidak akan pernah berhasil diproses sehingga mengulang hanya membuang waktu — langsung ke DLT.'
  },
  {
    id: 'kafka29',
    q: 'Peran Schema Registry dalam ekosistem Kafka adalah...',
    options: [
      'Menyimpan seluruh record data di dalamnya',
      'Menjadi pusat pendaftaran dan validasi skema; record di Kafka hanya membawa schema id yang menunjuk definisi di registry',
      'Menggantikan broker Kafka untuk menulis data',
      'Menjalankan consumer group'
    ],
    answer: 1,
    explain: 'Registry menyimpan definisi skema dan memeriksa kompatibilitas saat registrasi; payload tetap ringkas (hanya schema id + data biner) sehingga makna data tetap terkontrol tanpa membebani log.'
  },
  {
    id: 'kafka30',
    q: 'Skema Avro v2 menambah field baru "currency" dengan default "IDR". Pada mode kompatibilitas BACKWARD, hasil registrasi akan...',
    options: [
      'Ditolak karena menambah field',
      'Diterima, karena skema baru tetap bisa membaca data lama (field baru punya default)',
      'Ditolak karena default tidak diperbolehkan',
      'Diterima hanya bila memakai ZooKeeper'
    ],
    answer: 1,
    explain: 'BACKWARD menuntut skema baru bisa membaca data lama — field baru dengan default memenuhi syarat itu. Mengubah tipe field lama yang justru akan ditolak.'
  },
  {
    id: 'kafka31',
    q: 'Kafka Connect terutama digunakan untuk...',
    options: [
      'Menulis logika bisnis dalam Java',
      'Memindahkan data antara Kafka dan sistem lain (database, search, storage) secara berbasis KONFIGURASI tanpa menulis kode',
      'Menggantikan Schema Registry',
      'Mengelola consumer group secara manual'
    ],
    answer: 1,
    explain: 'Connect adalah kerangka integrasi berbasis konfigurasi: deploy connector (source/sink) lewat REST API :8083 — tanpa menulis producer/consumer untuk integrasi yang sudah umum.'
  },
  {
    id: 'kafka32',
    q: 'Debezium termasuk connector jenis apa dan bekerja dengan cara apa?',
    options: [
      'Sink connector yang menulis ke Elasticsearch',
      'Source connector CDC yang membaca perubahan database langsung dari log perubahannya (WAL/binlog)',
      'Connector yang hanya menyalin file dari disk',
      'Connector yang menghapus data lama'
    ],
    answer: 1,
    explain: 'Debezium adalah source connector Change Data Capture: terhubung sebagai replica logikal sehingga setiap INSERT/UPDATE/DELETE terbaca dari log database menjadi event (before/after) ke Kafka tanpa query berulang.'
  },
  {
    id: 'kafka33',
    q: 'Perbedaan mendasar STREAM dan TABLE dalam Kafka Streams/ksqlDB adalah...',
    options: [
      'Stream adalah urutan fakta append-only; table adalah state terkini per kunci (hasil pengurangan stream)',
      'Stream hanya untuk teks, table untuk angka',
      'Table selalu lebih kecil dari stream',
      'Stream tidak bisa diagregasi'
    ],
    answer: 0,
    explain: 'Stream mencatat setiap peristiwa; table menyimpan nilai terakhir per kunci — table pada dasarnya adalah snapshot dari stream, keduanya saling melengkapi dalam pemrosesan.'
  },
  {
    id: 'kafka34',
    q: 'Mekanisme SASL yang paling direkomendasikan untuk produksi (tanpa mengirim password mentah) adalah...',
    options: [
      'PLAIN tanpa TLS',
      'SCRAM-SHA-256/512 (challenge–response) — idealnya dibungkus TLS',
      'Menyimpan password di kode aplikasi',
      'Mematikan autentikasi agar cepat'
    ],
    answer: 1,
    explain: 'SCRAM mengirim challenge–response sehingga password tidak pernah mengalir mentah; PLAIN hanya aman bila berada di dalam koneksi TLS. Autentikasi tanpa TLS membuat seluruh upaya keamanan lain percuma.'
  },
  {
    id: 'kafka35',
    q: 'Dalam ACL Kafka, prinsip "least privilege" berarti...',
    options: [
      'Memberikan hak SELUAS mungkin agar aplikasi tidak terhambat',
      'Memberikan hak paling sedikit yang benar-benar dibutuhkan oleh tiap principal',
      'Menjalankan semua aplikasi dengan user super admin',
      'Menonaktifkan authorizer agar sederhana'
    ],
    answer: 1,
    explain: 'Least privilege = producer hanya WRITE+DESCRIBE topiknya, consumer hanya READ+DESCRIBE topik dan group-nya — memperkecil dampak bila ada kredensial yang bocor.'
  },
  {
    id: 'kafka36',
    q: 'Metrik yang paling berguna sebagai DETEKSI DINI bahwa consumer tertinggal jauh adalah...',
    options: [
      'Jumlah broker yang hidup',
      'Consumer lag (records-lag-max) per partition/group',
      'Ukuran file server.log',
      'Jumlah topic yang dibuat'
    ],
    answer: 1,
    explain: 'Lag menunjukkan langsung seberapa jauh pemrosesan tertinggal dari produksi; dipantau per partition (bukan hanya rata-rata total) agar satu partisi yang bermasalah tidak tersembunyi.'
  },
  {
    id: 'kafka37',
    q: 'Mengapa log compaction berbeda dari retensi biasa?',
    options: [
      'Retensi biasa menghapus seluruh record lama berdasar umur; compaction menyisakan nilai TERAKHIR per kunci sehingga setiap key tetap tersedia',
      'Compaction menghapus semua record yang belum dibaca',
      'Retensi biasa hanya berlaku untuk key numerik',
      'Compaction menggandakan ukuran log dua kali lipat'
    ],
    answer: 0,
    explain: 'Compaction cocok untuk topik berbasis kunci (state/checkpoint): duplikat lama dibuang tapi nilai terbaru per key dijamin tetap ada — berbeda dari retensi yang membuang berdasarkan waktu/ukuran.'
  },
  {
    id: 'kafka38',
    q: 'Mengapa linger.ms dinaikkan (mis. 20 ms) dapat menaikkan throughput producer?',
    options: [
      'Karena record menjadi lebih kecil ukurannya',
      'Karena producer menunggu sebentar agar batch lebih penuh — lebih sedikit request dengan data lebih banyak per request',
      'Karena broker memaksa mengirim ulang data',
      'Karena consumer mempercepat komit'
    ],
    answer: 1,
    explain: 'Jeda kecil membuat record terkumpul menjadi batch besar (dengan batch.size memadai) sehingga jumlah request menurun dan throughput naik — biayanya adalah penambahan latency kecil.'
  },
  {
    id: 'kafka39',
    q: 'Untuk arsitektur multi-datacenter, mekanisme replikasi yang berjalan DI DALAM broker (server-side) adalah...',
    options: [
      'MirrorMaker 2 yang berjalan di atas Kafka Connect',
      'Cluster linking',
      'kafka-console-consumer.sh',
      'Schema Registry'
    ],
    answer: 1,
    explain: 'Cluster linking menyalin data langsung antarbroker tanpa jalur client, sehingga lebih efisien dan offset dikirim oleh broker sumber; MirrorMaker 2 bekerja di lapisan client lewat Connect.'
  },
  {
    id: 'kafka40',
    q: 'Langkah PALING PENTING sebelum menyebut pipeline Kafka "siap produksi" menurut proyek akhir adalah...',
    options: [
      'Menambah jumlah topic menjadi dua kali lipat',
      'Menguji jalur KEGAGALAN (DLT, retry, uji matikan broker) — bukan hanya jalur sukses — serta memastikan checklist, runbook, dan idempotensi terpenuhi',
      'Mematikan monitoring agar tampilan bersih',
      'Menggunakan replication.factor 1 untuk mempercepat'
    ],
    answer: 1,
    explain: 'Banyak tim hanya menguji jalur sukses lalu menemukan DLT/replay bermasalah saat insiden. Uji kegagalan + checklist + runbook + idempotensi adalah bukti kesiapan nyata sebuah sistem.'
  }
);
