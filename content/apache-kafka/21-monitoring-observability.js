/* ============================================================
   Pelajaran Apache Kafka — 21: Monitoring & Observability
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'monitoring-observability',
  title: 'Monitoring & Observability',
  chapter: 'Produksi',
  duration: '15 menit',
  intro: [
    'Sistem yang tidak dipantau adalah sistem yang sedang menuju insiden tanpa sepengetahuan siapa pun. Kafka memiliki banyak titik kegagalan yang perlahan: disk yang penuh karena retensi terlalu panjang, consumer yang mulai tertinggal (lag tumbuh), leader partition yang pindah-pindah, atau ISR yang menyusut hingga satu. Gejala-gejala ini <b>tidak terlihat dari aplikasi</b> — yang terlihat hanyalah &quot;kenapa sistemnya lemot?&quot;.',
    'Pelajaran ini membahas cara membangun observabilitas Kafka secara lengkap: <b>metrics yang wajib dipantau</b> (broker, producer, consumer), metrik lag sebagai detektor dini utama, papan pantau (dashboard) dan <b>alerting</b> yang bermakna, tracing request end-to-end, serta strategi pengumpulan metrics dari broker dan client.'
  ],
  objectives: [
    'Memilih metrik broker, producer, dan consumer yang paling menentukan kesehatan',
    'Mengukur dan memantau consumer lag sebagai detektor dini masalah',
    'Merancang dashboard dan alerting yang bermakna (bukan noise)',
    'Menjelaskan cara mengumpulkan metrics dan logs dari broker dan client'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga pilar observabilitas Kafka</h3><ul><li><b>Metrics</b> — angka yang menceritakan kesehatan: throughput, lag, ISR, penggunaan disk, waktu proses.</li><li><b>Logs</b> — peristiwa rinci dari broker dan aplikasi: perpindahan leadership, kegagalan autentikasi, exception consumer.</li><li><b>Traces</b> — perjalanan satu request dari HTTP masuk hingga record tertulis dan diproses consumer (butuh correlation ID).</li></ul><p>Kombinasi ketiganya membuat pertanyaan &quot;apa yang terjadi?&quot; bisa dijawab: <b>metrics</b> memberi tahu <i>kapan</i> dan <i>seberapa parah</i>, <b>logs</b> memberi tahu <i>apa</i> yang terjadi, <b>traces</b> memberi tahu <i>di mana</i> letak masalahnya dalam alur panjang.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Arsitektur observabilitas Kafka: broker dan client mengirim metrics dan logs ke Prometheus dan ELK lalu dashboard dan alerting">
        <rect x="20" y="30" width="180" height="64" rx="8" class="u-hd"/>
        <text x="110" y="56" class="u-title" text-anchor="middle">Broker Kafka</text>
        <text x="110" y="80" class="u-lbl" text-anchor="middle">JMX metrics</text>
        <rect x="20" y="110" width="180" height="64" rx="8" class="u-box"/>
        <text x="110" y="136" class="u-title" text-anchor="middle">Producer app</text>
        <text x="110" y="160" class="u-lbl" text-anchor="middle">metrics + logs</text>
        <rect x="20" y="190" width="180" height="64" rx="8" class="u-box"/>
        <text x="110" y="216" class="u-title" text-anchor="middle">Consumer app</text>
        <text x="110" y="240" class="u-lbl" text-anchor="middle">lag + commit stats</text>
        <line x1="206" y1="62" x2="270" y2="106" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="206" y1="142" x2="270" y2="132" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="206" y1="222" x2="270" y2="158" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="276" y="80" width="200" height="110" rx="8" class="u-box"/>
        <text x="376" y="108" class="u-title" text-anchor="middle">Prometheus</text>
        <text x="376" y="134" class="u-lbl" text-anchor="middle">scrape + alert rules</text>
        <text x="376" y="160" class="u-lbl" text-anchor="middle">kafka_broker_* metrics</text>
        <rect x="276" y="210" width="200" height="70" rx="8" class="u-box"/>
        <text x="376" y="238" class="u-title" text-anchor="middle">Log store (ELK/Loki)</text>
        <text x="376" y="264" class="u-lbl" text-anchor="middle">server.log + app logs</text>
        <line x1="482" y1="135" x2="540" y2="106" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="482" y1="245" x2="540" y2="166" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="546" y="70" width="194" height="110" rx="8" class="u-hd"/>
        <text x="643" y="98" class="u-title" text-anchor="middle">Dashboard</text>
        <text x="643" y="124" class="u-lbl" text-anchor="middle">throughput, lag, ISR</text>
        <text x="643" y="150" class="u-lbl" text-anchor="middle">disk, p99 latency</text>
        <rect x="546" y="200" width="194" height="80" rx="8" class="u-hd"/>
        <text x="643" y="228" class="u-title" text-anchor="middle">Alerting</text>
        <text x="643" y="254" class="u-lbl" text-anchor="middle">Slack / PagerDuty</text>
      </svg></div><figcaption>Metrics memberi tahu kapan dan seberapa parah, logs memberi tahu apa yang terjadi, traces menunjukkan di mana letaknya.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Metrik wajib: broker, producer, consumer',
      lang: 'text',
      output: false,
      code: `BROKER (JMX)
kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec        # masuk
kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec        # keluar
kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions # ISR < RF (BAHAYA)
kafka.server:type=ReplicaManager,name=LeaderElectionRateAndTime # pindah leadership
kafka.log:type=Log,name=Size                                   # ukuran log per topic
kafka.server:type=RequestHandlerPool,name=RequestHandlerAvgTime # antrian handler
kafka.network:type=RequestMetrics,name=TotalTimeMs,purpose=Produce  # p99 produce

PRODUCER
kafka-producer-record-send-total                              # record terkirim
kafka-producer-record-error-total                             # gagal (JIKA NAIK = MASALAH)
kafka-producer-record-max-latency-ms                          # latency terburuk
kafka-producer-request-latency-avg                            # rata-rata request

CONSUMER
kafka.consumer.fetch-manager-records-lag-max                  # lag tertinggi
kafka.consumer.type=consumer,name=records-lag-max             # per partition
kafka.consumer.coordinator-name=heartbeat-frequency-avg       # jantung hidup
kafka.consumer.type=consumer,name=commit-latency-avg          # latensi commit`,
      explain: [
        '<b>UnderReplicatedPartitions</b> adalah salah satu metrik paling penting: nilai di atas nol berarti ada partition yang replikanya tertinggal — dan itu adalah pintu menuju kehilangan data bila broker lain ikut mati.',
        'Di sisi consumer, <b>records-lag-max</b> lebih berguna daripada rata-rata: rata-rata bisa terlihat kecil sementara satu partition tertinggal jauh dan menahan seluruh alur bisnis.',
        'Metrik <b>TotalTimeMs per purpose</b> (Produce, Fetch, UpdateMetadata) memberi latency p99 broker — bila Fetch melonjak padahal throughput stabil, biasanya disk atau beban replikasi yang bermasalah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Consumer lag: detektor dini paling berguna</h3><p><b>Lag</b> = selisih antara offset terakhir yang diproduksi dan offset terakhir yang dikonsumsi. Ia adalah satu-satunya angka yang langsung menjawab: <i>&quot;seberapa jauh aplikasi tertinggal dari real-time?&quot;</i></p><ul><li><b>Lag nol atau stabil</b> — sehat.</li><li><b>Lag naik terus</b> — consumer tidak sanggup mengikuti (atau macet); selisihnya menentukan seberapa besar backlog yang menumpuk.</li><li><b>Lag melonjak lalu turun</b> — restart, rebalance, atau lonjakan traffic sesaat.</li></ul><p>Pantau <b>per group dan per partition</b>, bukan hanya total: total bisa menipu ketika satu partition tertinggal sementara yang lain nol. Untuk pengukuran, Kafka menyediakan <code>kafka-consumer-groups.sh --describe</code> (titik waktu) dan tool monitoring berbasis consumer offset yang berjalan berkala.</p>'
    },
    {
      type: 'example',
      title: 'Memeriksa lag dan kesehatan cluster',
      lang: 'bash',
      output: false,
      code: `# lag per partition untuk satu consumer group
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\\\
  --group payment-service --describe
#   TOPIC          PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG   CONSUMER-ID
#   order-events   0          15230          15344           114   consumer-1
#   order-events   1          15102          15102           0     consumer-2

# kesehatan cluster: ISR, leader, online/offline
kafka-metadata.sh --bootstrap-server localhost:9092 --describe \\\\
  --topics order-events

# partisi under-replicated (harus kosong)
kafka-topics.sh --bootstrap-server localhost:9092 \\\\
  --describe --under-replicated-partitions

# log broker: perpindahan leadership & error
docker exec kafka grep -E \"(State transition|ERROR|Shutdown)\" \\\\
  /var/log/kafka/server.log | tail -20`,
      explain: [
        'Baris <b>CURRENT-OFFSET vs LOG-END-OFFSET</b> adalah sumber kebenaran lag: selisihnya (kolom LAG) menunjukkan seberapa banyak record yang belum diproses di tiap partition.',
        '<code>--under-replicated-partitions</code> menghasilkan daftar kosong saat sehat — jadikan ini bagian dari pemeriksaan rutin dan alert otomatis, bukan hanya cek manual saat insiden.',
        'Grep pada <b>server.log</b> untuk &quot;State transition&quot; menunjukkan perpindahan <i>leader → follower → shutdown</i> — pola perpindahan berulang menandakan broker yang tidak stabil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dashboard dan alerting yang bermakna</h3><p>Dashboard yang baik menjawab pertanyaan berlapis: <b>apakah sistem sehat?</b> (satu panel ringkasan), <b>kalau tidak, di mana?</b> (panel per topic/partition), <b>sejak kapan?</b> (grafik tren). Susun minimal:</p><ol><li><b>Ringkasan cluster</b> — jumlah broker hidup, under-replicated partition, penggunaan disk rata-rata.</li><li><b>Traffic</b> — bytes in/out per detik, record produce/fetch per detik.</li><li><b>Latensi</b> — p99 produce &amp; fetch (bukan hanya rata-rata).</li><li><b>Consumer lag</b> — per group, dengan garis ambang.</li><li><b>Resource</b> — disk, CPU, file descriptor, jaringan.</li></ol><p>Untuk <b>alerting</b>, ikuti prinsip: alert harus <i>akan ditindaklanjuti</i>. Ambang terlalu sensitif = noise yang dilatih untuk diabaikan; ambang terlalu longgar = insiden tak tertangani. Alert berbasis <b>durasi</b> (mis. under-replicated &gt; 0 selama 5 menit) lebih baik daripada berbasis titik tunggal.</p>'
    },
    {
      type: 'example',
      title: 'Contoh aturan alert (Prometheus)',
      lang: 'yaml',
      output: false,
      code: `groups:
  - name: kafka
    rules:
      - alert: KafkaUnderReplicatedPartitions
        expr: kafka_server_replicamanager_underreplicatedpartitions > 0
        for: 5m
        labels: {severity: critical}
        annotations:
          summary: \"{{ $value }} partition under-replicated\"

      - alert: KafkaConsumerLagHigh
        expr: max by (group, topic, partition)
               (kafka_consumergroup_lag) > 10000
        for: 10m
        labels: {severity: warning}

      - alert: KafkaConsumerLagCritical
        expr: max by (group, topic)
               (kafka_consumergroup_lag) > 1000000
        for: 5m
        labels: {severity: critical}

      - alert: KafkaDiskAlmostFull
        expr: (1 - kafka_log_log_size / 100000000000) < 0.15
        for: 15m
        labels: {severity: warning}`, 
      explain: [
        'Aturan memakai <b>for: 5m/10m</b> — alert baru dinyatakan setelah kondisi bertahan lama, menghindari alarm sesaat akibat restart atau rebalance yang wajar.',
        'Lag dipantau <b>bertingkat</b>: warning pada 10 ribu record, critical pada 1 juta — eskalasi yang berbeda memanggil respons yang berbeda (observasi vs perbaikan mendesak).',
        'Ambang angka di atas adalah <b>contoh</b>, bukan aturan universal — sesuaikan dengan throughput normal layananmu dan aturan praktis: ambang = beberapa kali backlog normal yang masih aman.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tracing end-to-end dengan correlation ID</h3><p>Metrics dan logs berhenti di pintu broker; untuk melacak satu pesanan dari HTTP hingga effect, kamu membutuhkan <b>correlation ID</b> yang mengalir bersama record:</p><ol><li>API menerima request → membuat <code>X-Request-Id</code> (atau menerima dari client).</li><li>Producer menaruh ID itu di <b>header record Kafka</b> (bukan di payload — header tidak memengaruhi key partitioning).</li><li>Consumer membaca header, mencatatnya di setiap log, lalu meneruskannya ke service berikutnya.</li><li>Di observability platform, satu ID menampilkan seluruh rantai: HTTP → producer → broker → consumer → database.</li></ol><p>Hasilnya: ketika pengguna mengeluh &quot;pesanan saya tidak masuk&quot;, kamu mengetik satu ID dan melihat persis di mana ia berhenti — bukan menebak dari lima log terpisah.</p>'
    },
    {
      type: 'text',
      html: '<h3>Praktik pengumpulan metrics dan logs</h3><ul><li><b>Broker</b> — metrics JMX diekspos ke Prometheus lewat exporter (jmx_exporter). Aktifkan sejak awal, bukan setelah insiden.</li><li><b>Client</b> — producer/consumer punya metrics sendiri (Micrometer/Prometheus client) — pasang sebagai bagian standar kerangka aplikasi.</li><li><b>Logs</b> — struktur (JSON) dan sertakan request/record ID; atur retensi agar disk tidak penuh oleh log.</li><li><b>Cardinality</b> — jangan jadikan <code>order_id</code> sebagai label metrics (jumlah label meledak); gunakan untuk logs/traces.</li><li><b>Korelasi</b> — satu ID untuk metrics, logs, dan traces agar bisa berpindah konteks dengan cepat.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Perangkap observability',
      text: '<ul><li><b>Mengandalkan rata-rata saja</b> — p99/p999 menyembunyikan masalah yang rata-ratanya sehat.</li><li><b>Alert tanpa runbook</b> — notifikasi yang tidak menjelaskan &quot;apa yang harus dilakukan&quot; menambah kecemasan, bukan membantu.</li><li><b>Dashboard terlalu banyak</b> — panel yang tak pernah dilihat hanya menambah noise; mulai dari 5 panel inti.</li><li><b>Lupa memantau Connect, Registry, dan Schema</b> — komponen pendamping pun bisa menjadi titik kegagalan.</li><li><b>Retensi metrics terlalu pendek</b> — insiden minggu lalu tak bisa diselidiki bila data metrics hanya bertahan sehari.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Checklist observability minimum',
      text: '<p>Sebelum menyebut sistem Kafka &quot;produksi&quot;, pastikan sudah ada: (1) <b>metrics broker</b> terkumpul + dashboard ringkasan, (2) <b>consumer lag per group</b> dipantau dengan ambang jelas, (3) <b>alert under-replicated</b> dan <b>disk hampir penuh</b>, (4) <b>correlation ID</b> mengalir dari API hingga consumer, (5) <b>runbook</b> singkat untuk tiap alert. Lima hal ini menyelesaikan sebagian besar misteri operasional sehari-hari.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Metrics', 'Angka kesehatan sistem yang dikumpulkan berkala.'],
        ['Consumer lag', 'Selisih offset terproduksi dan terkonsumsi — ukuran ketertinggalan.'],
        ['Under-replicated partition', 'Partition yang replikanya kurang dari konfigurasi — tanda bahaya.'],
        ['Leader election', 'Perpindahan broker pemimpin partition saat broker mati.'],
        ['p99 latency', '99 persen request lebih cepat dari nilai ini — mendeteksi ekor panjang.'],
        ['Correlation ID', 'ID unik yang mengalir lintas layanan untuk melacak satu request.'],
        ['JMX', 'Java Management Extensions — sumber metrics broker Kafka.'],
        ['Runbook', 'Dokumen langkah penanganan saat alert berbunyi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Sebutkan 6 metrik broker yang wajib dipantau dan makna masing-masing.</li><li>Mengapa <b>lag per partition</b> lebih informatif daripada rata-rata lag total?</li><li>Skenario: under-replicated partition &gt; 0 selama 10 menit — apa artinya dan langkah pertamamu?</li><li>Rancang 5 panel dashboard inti untuk timmu + 3 aturan alert dengan <code>for</code> durasi.</li><li>Uraikan bagaimana correlation ID mengalir dari HTTP hingga consumer, dan apa manfaatnya saat insiden.</li></ol>'
    }
  ],
  recap: [
    'Tiga pilar: <b>metrics</b> (kapan/seberapa parah), <b>logs</b> (apa), <b>traces</b> (di mana) — semuanya dengan correlation ID.',
    'Metrik kunci: <b>UnderReplicatedPartitions</b>, <b>records-lag-max per partition</b>, p99 produce/fetch, penggunaan disk.',
    '<b>Consumer lag</b> = detektor dini terbaik — pantau per group &amp; per partition dengan ambang bertingkat.',
    'Alert harus <b>ditindaklanjuti</b>: gunakan durasi (<code>for</code>), sediakan runbook, dan hindari noise.'
  ]
});
