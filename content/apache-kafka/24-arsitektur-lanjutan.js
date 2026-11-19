/* ============================================================
   Pelajaran Apache Kafka — 24: Arsitektur Lanjutan
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'arsitektur-lanjutan',
  title: 'Arsitektur Lanjutan',
  chapter: 'Skala Besar',
  duration: '15 menit',
  intro: [
    'Sampai di sini kamu sudah mampu merancang Kafka yang andal untuk satu wilayah. Tetapi skala membawa pertanyaan baru: bagaimana melayani pengguna di dua benua dengan latensi wajar? Bagaimana menjaga dua cluster tetap sinkron saat jaringan antarwilayah putus? Bagaimana menampung ribuan topic tanpa kacau, dan bagaimana bertahan ketika seluruh quorum KRaft kehilangan anggota?',
    'Pelajaran ini membahas arsitektur tingkat lanjut: <b>multi-datacenter dengan MirrorMaker 2</b>, konsep <b>cluster linking</b> yang lebih baru, <b>multi-tenancy dan quota</b>, awareness terhadap <b>rack/availability zone</b>, sampai <b>skalabilitas KRaft</b> dan <b>tiered storage</b> — beserta pertanyaan kapan arsitektur sebesar itu benar-benar dibutuhkan.'
  ],
  objectives: [
    'Merancang arsitektur multi-datacenter dengan MirrorMaker 2 beserta topologi dan risikonya',
    'Menjelaskan peran cluster linking dan kapan dipakai dibanding MirrorMaker',
    'Menerapkan multi-tenancy: quota, batas resource, dan pemisahan topik',
    'Menjelaskan awareness rack/AZ, skalabilitas KRaft, dan tiered storage'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa multi-datacenter?</h3><p>Tiga alasan paling umum: <b>ketahanan wilayah</b> (satu datacenter mati total, layanan tetap hidup di wilayah lain), <b>latensi</b> (pengguna di wilayah X membaca dari broker di wilayah X, bukan menyeberangi benua), dan <b>kepatuhan</b> (data wajib tetap berada di wilayah tertentu). Ketiganya menuntut data yang sama tersedia di dua tempat — tetapi dengan <b>topologi yang jelas</b>, karena Kafka tidak menyalin data antarcluster secara bawaan.</p><p>Pilihan topologi paling sederhana: <b>active-passive</b> (wilayah kedua menunggu, aktif hanya saat bencana) atau <b>active-active</b> (dua wilayah menulis dan membaca; paling kompleks karena bisa terjadi <b>penulisan ganda</b> dan konflik).</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Arsitektur multi-datacenter Kafka dengan MirrorMaker 2 menyalin topic antara cluster utama dan cluster wilayah lain">
        <rect x="20" y="30" width="320" height="240" rx="10" class="u-box"/>
        <text x="180" y="56" class="u-title" text-anchor="middle">Datacenter Utama (Region A)</text>
        <line x1="40" y1="66" x2="320" y2="66" class="u-line"/>
        <rect x="40" y="80" width="280" height="52" rx="6" class="u-hd"/>
        <text x="180" y="104" class="u-title" text-anchor="middle">Cluster A (RF=3)</text>
        <text x="180" y="124" class="u-lbl" text-anchor="middle">order-events · payment-events</text>
        <rect x="40" y="144" width="280" height="52" rx="6" class="u-box"/>
        <text x="180" y="168" class="u-title" text-anchor="middle">Aplikasi A</text>
        <text x="180" y="188" class="u-lbl" text-anchor="middle">producer &amp; consumer lokal</text>
        <rect x="40" y="208" width="280" height="52" rx="6" class="u-box"/>
        <text x="180" y="232" class="u-title" text-anchor="middle">Schema Registry A</text>
        <text x="180" y="252" class="u-lbl" text-anchor="middle">subject kompatibel dua arah</text>
        <rect x="420" y="30" width="320" height="240" rx="10" class="u-box"/>
        <text x="580" y="56" class="u-title" text-anchor="middle">Datacenter Wilayah (Region B)</text>
        <line x1="440" y1="66" x2="720" y2="66" class="u-line"/>
        <rect x="440" y="80" width="280" height="52" rx="6" class="u-hd"/>
        <text x="580" y="104" class="u-title" text-anchor="middle">Cluster B (RF=3)</text>
        <text x="580" y="124" class="u-lbl" text-anchor="middle">salinan topic (replicated.*.src)</text>
        <rect x="440" y="144" width="280" height="52" rx="6" class="u-box"/>
        <text x="580" y="168" class="u-title" text-anchor="middle">Aplikasi B</text>
        <text x="580" y="188" class="u-lbl" text-anchor="middle">baca lokal · tulis bila aktif</text>
        <rect x="440" y="208" width="280" height="52" rx="6" class="u-box"/>
        <text x="580" y="232" class="u-title" text-anchor="middle">Schema Registry B</text>
        <text x="580" y="252" class="u-lbl" text-anchor="middle">replicasi registry / sinkron manual</text>
        <rect x="344" y="90" width="76" height="120" rx="8" class="u-hd"/>
        <text x="382" y="134" class="u-title" text-anchor="middle">Mirror</text>
        <text x="382" y="154" class="u-title" text-anchor="middle">Maker 2</text>
        <text x="382" y="180" class="u-lbl" text-anchor="middle">A↔B</text>
        <line x1="344" y1="110" x2="324" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="324" y1="180" x2="344" y2="180" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="420" y1="110" x2="440" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="440" y1="180" x2="420" y2="180" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="20" y="288" width="720" height="40" rx="8" class="u-box"/>
        <text x="380" y="313" class="u-lbl" text-anchor="middle">active-active: hindari dua wilayah menulis key yang sama (pilih writer per key / per region)</text>
      </svg></div><figcaption>MirrorMaker 2 menyalin topic antarcluster; aplikasi di tiap wilayah membaca secara lokal.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'MirrorMaker 2: konfigurasi dasar',
      lang: 'properties',
      output: false,
      code: `# mm2.properties (dijalankan sebagai service terpisah)
clusters = A, B
A.bootstrap.servers = kafka-a1:9092,kafka-a2:9092
B.bootstrap.servers = kafka-b1:9092,kafka-b2:9092

# salin dua arah (active-active) — atau hapus B untuk A→B saja
A->B.enabled = true
A->B.topics = order-events, payment-events, user-events.*
A->B.emit.heartbeats = true
A->B.sync.topic.acls.enabled = true

B->A.enabled = true
B->A.topics = order-events, payment-events

# topik salinan otomatis memakai awalan replicated.
replication.policy.class = org.apache.kafka.connect.mirror.IdentityReplicationPolicy

# kontrol beban
tasks.max = 4
replication.factor = 3
checkpoints.topic.replication.factor = 3
heartbeats.topic.replication.factor = 3`,
      explain: [
        'MirrorMaker 2 berjalan di atas <b>Kafka Connect</b> — konfigurasi di atas persis pola Connect: ada topic internal (<code>heartbeats</code>, <code>checkpoints</code>) yang memantau kemajuan replikasi per topic.',
        'Pola penamaan <code>A->B.topics</code> membatasi topik yang disalin; menyalin semua topik tanpa filter (termasuk topic internal) adalah kesalahan umum yang membingungkan konfigurasi.',
        '<b>IdentityReplicationPolicy</b> mempertahankan nama topic asli — pilihan wajar bila nama topic sama di dua wilayah; kebijakan lain menambah awalan per cluster untuk menghindari tabrakan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konflik active-active dan cara menghindarinya</h3><p>Ketika dua wilayah sama-sama menulis, record dengan <b>key yang sama bisa ditulis di dua tempat</b> dan saling menimpa saat direplikasi — hasilnya bergantung pada timestamp mana yang menang. Tiga strategi yang lazim:</p><ul><li><b>Partisi wilayah (region affinity)</b> — setiap key hanya boleh ditulis di satu wilayah tertentu (misal berdasarkan user_id). Paling sederhana dan paling aman.</li><li><b>Last-write-wins + clock</b> — terima konflik, menangkan yang timestamp-nya terbaru; hanya cocok bila kehilangan tulisan lama dapat ditoleransi.</li><li><b>Reconciler / merge layer</b> — tulis ke dua wilayah lalu biarkan proses terpisah merekonsiliasi; paling kompleks.</li></ul><p>Di luar penulisan, perhatikan juga <b>idempotensi consumer</b> dan <b>Schema Registry</b>: dua registry yang tidak sinkron membuat skema terdaftar di wilayah A tak dikenal di wilayah B.</p>'
    },
    {
      type: 'text',
      html: '<h3>Cluster linking: alternatif yang lebih baru</h3><p>MirrorMaker 2 bekerja di lapisan <b>client</b> (membaca dari satu cluster, menulis ke cluster lain melalui Connect). <b>Cluster linking</b> adalah mekanisme yang berjalan <b>di dalam broker</b>: broker sumber menyalin data langsung ke cluster tujuan dengan protokol internal, tanpa perantara Connect.</p><table><thead><tr><th>Aspek</th><th>MirrorMaker 2</th><th>Cluster linking</th></tr></thead><tbody><tr><td><b>Lapisan</b></td><td>Di atas Kafka Connect (client)</td><td>Di dalam broker (server-side)</td></tr><tr><td><b>Offset &amp; metadata</b></td><td>Disinkronkan lewat topic checkpoints</td><td>Offset dikirim langsung oleh broker sumber</td></tr><tr><td><b>Konsumsi I/O cluster sumber</b></td><td>Memakai consumer — membebani cluster sumber</td><td>Lebih efisien, tidak memakai jalur client</td></tr><tr><td><b>Kontrol</b></td><td>Konfigurasi Connect</td><td>Perintah admin pada cluster sumber</td></tr></tbody></table><p>Keduanya memecahkan masalah yang sama — pilih sesuai versi dan kebutuhan: MM2 tetap pilihan mapan dan fleksibel, cluster linking menjanjikan efisiensi lebih baik untuk replikasi jangka panjang.</p>'
    },
    {
      type: 'text',
      html: '<h3>Multi-tenancy dan quota</h3><p>Saat satu cluster melayani banyak tim (multi-tenancy), satu tim yang salah konfigurasi bisa memengaruhi semua orang. Kafka menyediakan <b>quota</b> untuk membatasi:</p><ul><li><b>Produce/fetch byte rate</b> — batas throughput per client-id atau user.</li><li><b>Request rate</b> — batas permintaan per detik.</li><li><b>Connection rate</b> — batas koneksi baru.</li></ul><p>Dilengkapi dengan <b>topic-level</b> (jumlah partition, retensi) dan pemisahan topik berdasarkan tim, cluster menjadi layanan bersama yang adil. Praktik baik: satu <b>service account per aplikasi</b> (bukan per tim) agar pemakaian bisa ditelusuri, dan <b>pantau pemakaian per principal</b> secara berkala.</p>'
    },
    {
      type: 'example',
      title: 'Quota dan pembatasan resource',
      lang: 'bash',
      output: false,
      code: `# batasi satu aplikasi: 50 MB/s keluar & masuk, 10.000 request/detik
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --alter --add-config 'produce_byte_rate=52428800,\\
fetch_byte_rate=52428800,request_percentage=80' \\
  --entity-type clients --entity-name billing-app

# batasi per user SCRAM
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --alter --add-config 'produce_byte_rate=10485760' \\
  --entity-type users --entity-name reporting-team

# lihat quota yang berlaku
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --describe --entity-type clients --entity-name billing-app

# aturan topic untuk multi-tenancy
kafka-topics.sh --bootstrap-server localhost:9092 --create \\
  --topic team-a-events --partitions 6 --replication-factor 3 \\
  --config retention.ms=2592000000 \\
  --config max.message.bytes=1048576`,
      explain: [
        'Quota dikenakan <b>per client-id</b> (dan juga per user bila SASL aktif) — karena itu penting menetapkan <b>satu client-id per aplikasi</b> agar batas dan pemakaian terlacak dengan benar.',
        'Mekanisme quota bekerja dengan <b>throttling</b>: saat melebihi batas, broker memperlambat client tersebut, bukan memutusnya — tetap menghargai kerja sama antarlayanan dalam satu cluster.',
        'Konfigurasi <code>max.message.bytes</code> per topic mencegah satu topik membanjiri memori broker dengan pesan raksasa — pembatasan sejak level topik lebih mudah diprediksi daripada mengandalkan client yang sadar diri.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Rack / availability zone awareness</h3><p>Bila broker tersebar di beberapa rak atau availability zone, Kafka dapat menyebarkan <b>replica satu partition ke rak yang berbeda</b> (konfigurasi <code>broker.rack</code> atau <code>replica.selector.class=rack</code>). Manfaatnya nyata: ketika satu rak mati (daya, jaringan), replika di rak lain tetap hidup dan <b>leader baru tersedia tanpa kehilangan data</b>.</p><p>Untuk client, <code>client.rack</code> memungkinkan consumer membaca dari replica <b>di rak yang sama</b> lebih dulu — mengurangi biaya jaringan antar-rak. Pola ini disebut <b>rack-aware replica placement</b> dan merupakan salah satu peningkatan ketahanan paling berharga pada klaster besar.</p>'
    },
    {
      type: 'text',
      html: '<h3>Skalabilitas KRaft dan tiered storage</h3><p>KRaft menggantikan ZooKeeper dengan quorum controller internal. Pada skala besar, hal-hal berikut perlu diperhatikan:</p><ul><li><b>Jumlah partisi sangat besar</b> — metadata di memori controller; perencanaan partisi harus masuk akal (ribuan per topik × banyak topik = jutaan metadata). Batasi jumlah topik &amp; partisi dengan disiplin.</li><li><b>Tiered storage</b> — memisahkan <b>data panas</b> (baru, sering dibaca) dan <b>data dingin</b> (retensi lama) ke penyimpanan objek (S3/dsb). Data lama di-stream on-demand — menekan biaya disk lokal untuk retensi panjang.</li><li><b>Backup &amp; disaster recovery</b> — replikasi antarwilayah (MirrorMaker/cluster linking) + backup registry + dokumentasi RTO/RPO yang jelas.</li></ul><p>Prinsip yang tidak berubah: <b>sebagian besar masalah skala datang dari keputusan di awal</b> — jumlah topic, ukuran retensi, dan pola akses. Arsitektur canggih tidak menggantikan keputusan dasar yang keliru.</p>'
    },
    {
      type: 'warn',
      title: 'Kapan arsitektur ini TIDAK diperlukan',
      text: '<ul><li><b>Satu wilayah, satu tim, beban sedang</b> — satu cluster dengan RF 3 dan retensi wajar sudah lebih dari cukup; jangan menambah komponen tanpa kebutuhan nyata.</li><li><b>Multi-datacenter tanpa rencana failover</b> — salinan yang tidak pernah diuji sama saja dengan tidak ada; uji failover berkala.</li><li><b>Active-active tanpa strategi konflik</b> — penulisan ganda tanpa rekonsiliasi menghasilkan data yang tidak konsisten.</li><li><b>Ribuan topic tanpa tata nama dan tata kelola</b> — topic hantu menumpuk, tak ada yang berani menghapus.</li><li><b>Quota tanpa pemantauan</b> — batas yang tidak dipantau tidak melindungi siapa pun.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Jalur evolusi yang wajar',
      text: '<p>(1) <b>Satu cluster, RF 3, retensi jelas</b> — sampai benar-benar dibuktikan kurang. (2) <b>Rack/AZ awareness</b> — murah dan sangat bermanfaat bila infrastruktur sudah tersebar. (3) <b>Quota + tata nama topic</b> sebelum banyak tim bergabung. (4) <b>Multi-datacenter</b> ketika ada kebutuhan nyata (latensi, kepatuhan, DR) — mulai active-passive lalu active-active dengan strategi penulisan yang jelas. (5) <b>Tiered storage</b> bila retensi panjang mulai membebani biaya disk. Setiap tahap berdiri di atas tahap sebelumnya, bukan melompatinya.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Multi-datacenter', 'Kafka berjalan di lebih dari satu wilayah/geografis.'],
        ['MirrorMaker 2', 'Alat replikasi antarcluster berbasis Kafka Connect.'],
        ['Cluster linking', 'Mekanisme replikasi antarcluster di dalam broker.'],
        ['Active-passive', 'Wilayah kedua menunggu dan aktif saat bencana.'],
        ['Active-active', 'Dua wilayah sama-sama menulis — berisiko konflik.'],
        ['Region affinity', 'Setiap key hanya ditulis di wilayah tertentu.'],
        ['Quota', 'Batas resource (throughput, request, koneksi) per client/user.'],
        ['Rack awareness', 'Penyebaran replica antar rak/AZ agar tahan kegagalan rak.'],
        ['Tiered storage', 'Pemisahan data panas dan dingin ke penyimpanan objek.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan tiga alasan membangun Kafka multi-datacenter dan tiga topologi yang mungkin.</li><li>MirrorMaker 2 bekerja di lapisan apa? Apa konsekuensinya bagi cluster sumber?</li><li>Skenario active-active: dua wilayah menulis key yang sama — apa yang terjadi dan tiga strategi menghindarinya?</li><li>Bandingkan MirrorMaker 2 dan cluster linking dari sisi lapisan, efisiensi, dan kontrol.</li><li>Sebutkan lima langkah evolusi arsitektur secara berurutan dan prinsip di baliknya.</li></ol>'
    }
  ],
  recap: [
    'Multi-datacenter: <b>active-passive</b> (sederhana) vs <b>active-active</b> (perlu strategi konflik: region affinity, last-write-wins, reconciler).',
    '<b>MirrorMaker 2</b> replikasi via Connect (client); <b>cluster linking</b> di dalam broker (lebih efisien, offset dari broker sumber).',
    '<b>Quota + tata nama topic + service account per aplikasi</b> membuat cluster multi-tenancy adil dan terlacak.',
    'Evolusi wajar: <b>satu cluster → rack/AZ awareness → quota → multi-datacenter → tiered storage</b> — tanpa melompati tahap.'
  ]
});
