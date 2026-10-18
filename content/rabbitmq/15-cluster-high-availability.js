/* ============================================================
   Pelajaran RabbitMQ — Bab 15: Cluster & High Availability
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'cluster-high-availability',
  title: 'Clustering dan High Availability (Quorum Queue)',
  chapter: 'High Availability',
  duration: '22–24 menit',
  intro: [
    'Sampai sejauh ini kita menjalankan satu instance RabbitMQ. Untuk pembelajaran itu cukup, tetapi di produksi satu titik gagal (<i>single point of failure</i>) adalah risiko yang tidak bisa diterima: ketika broker mati, seluruh sistem berhenti mengirim pesan. Solusinya adalah <b>clustering</b> — menggabungkan beberapa node RabbitMQ menjadi satu cluster logis, sehingga bila satu node tumbang, node lain bisa melayani.',
    'Clustering saja belum cukup: agar pesan tidak hilang ketika node pemilik antrean mati, RabbitMQ menyediakan mekanisme <b>high availability</b>. Untuk antrean klasik, tersedia <i>mirrored queues</i> (antrean berbayang) yang menyalin isi antrean ke node lain — namun mekanisme ini kini dianggap legacy. Pendekatan modern yang direkomendasikan adalah <b>quorum queue</b>, yang memakai protokol konsensus Raft untuk menyalin antrean ke beberapa node secara konsisten.',
    'Bab ini akan membangun cluster RabbitMQ tiga node menggunakan Podman, lalu mempraktikkan perbedaan antara antrean biasa, mirrored queue, dan quorum queue. Kamu akan melihat langsung bagaimana ketahanan cluster bekerja ketika sebuah node dimatikan secara paksa.'
  ],
  objectives: [
    'Menjelaskan konsep cluster RabbitMQ dan bagaimana node saling terhubung.',
    'Membangun cluster tiga node RabbitMQ menggunakan Podman dengan shared Erlang cookie.',
    'Membedakan mirrored queue (legacy) dan quorum queue berbasis Raft.',
    'Membuat quorum queue dan menguji ketahanannya dengan mematikan satu node.'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Konsep Dasar Cluster RabbitMQ</h3><p>Dalam cluster RabbitMQ, setiap node berdiri sejajar (<i>peer-to-peer</i>) — tidak ada node master yang mengatur sisanya. Setiap node memiliki salinan metadata yang sama (exchange, binding, user, vhost), dan perubahan pada satu node otomatis disebarkan ke node lain melalui protokol <i>mirroring</i> bawaan Erlang. Yang membedakan adalah lokasi <b>pesan</b>: sebuah pesan fisik berada di node tertentu, bukan disalin ke semua node.</p><p>Syarat utama sebuah cluster: semua node harus berbagi <b>Erlang cookie</b> yang sama (file <code>.erlang.cookie</code>), karena cookie inilah yang memungkinkan node saling mempercayai komunikasi Erlang di antaranya.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 280" width="760" role="img" aria-label="Cluster tiga node dengan quorum queue yang menyalin antrean via Raft ke mayoritas node">
        <rect x="30" y="30" width="220" height="90" rx="10" class="u-box"/>
        <text x="140" y="54" class="u-title" text-anchor="middle">Node A (rabbit@node-a)</text>
        <line x1="46" y1="64" x2="234" y2="64" class="u-line"/>
        <text x="140" y="88" class="u-lbl" text-anchor="middle">Quorum Queue: orders</text>
        <text x="140" y="108" class="u-lbl" text-anchor="middle">anggota Raft</text>

        <rect x="270" y="30" width="220" height="90" rx="10" class="u-box"/>
        <text x="380" y="54" class="u-title" text-anchor="middle">Node B (rabbit@node-b)</text>
        <line x1="286" y1="64" x2="474" y2="64" class="u-line"/>
        <text x="380" y="88" class="u-lbl" text-anchor="middle">Salinan antrean</text>
        <text x="380" y="108" class="u-lbl" text-anchor="middle">anggota Raft</text>

        <rect x="510" y="30" width="220" height="90" rx="10" class="u-box"/>
        <text x="620" y="54" class="u-title" text-anchor="middle">Node C (rabbit@node-c)</text>
        <line x1="526" y1="64" x2="714" y2="64" class="u-line"/>
        <text x="620" y="88" class="u-lbl" text-anchor="middle">Salinan antrean</text>
        <text x="620" y="108" class="u-lbl" text-anchor="middle">anggota Raft</text>

        <line x1="140" y1="130" x2="380" y2="130" class="u-dash" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="130" x2="620" y2="130" class="u-dash" marker-end="url(#u-arrow)"/>
        <line x1="620" y1="130" x2="140" y2="130" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="380" y="152" class="u-lbl" text-anchor="middle">Saling menyalin (mirror metadata + Raft quorum)</text>

        <rect x="30" y="180" width="700" height="80" rx="10" class="u-box"/>
        <text x="380" y="208" class="u-title" text-anchor="middle">Ketahanan Quorum Queue</text>
        <line x1="46" y1="218" x2="714" y2="218" class="u-line"/>
        <text x="380" y="240" class="u-lbl" text-anchor="middle">Kehilangan 1 node masih aman (kuorum 2/3 tetap utuh); kehilangan 2 node berhenti menulis</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 15.1</b> — Cluster tiga node dengan quorum queue; Raft menjaga mayoritas node tetap sinkron</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menyiapkan Erlang cookie bersama untuk tiga node',
      lang: 'bash',
      output: false,
      code: `# Buat folder untuk cookie bersama
mkdir -p rabbitmq-cluster-config

# Buat cookie acak (bisa juga tulis manual string sederhana untuk belajar)
echo "TUTORIALCLUSTERCOOKIE" > rabbitmq-cluster-config/.erlang.cookie
chmod 600 rabbitmq-cluster-config/.erlang.cookie

# Periksa isi dan izinnya
ls -la rabbitmq-cluster-config/`,
      explain: [
        'Erlang cookie adalah berkas rahasia yang harus identik di semua node cluster; tanpa kecocokan cookie, node menolak untuk saling terhubung.',
        'Perintah chmod 600 memberi izin baca-tulis hanya kepada pemilik file — Erlang menolak cookie yang terlalu terbuka (izin terlalu longgar) demi keamanan.',
        'Menempatkan cookie pada folder bersama memudahkan kita memasangnya ke setiap container RabbitMQ lewat volume Podman berikutnya.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan tiga node RabbitMQ dalam Podman',
      lang: 'bash',
      output: false,
      code: `# Jalankan node pertama (rabbitmq-a) dengan cookie bersama
podman run -d --name rabbitmq-a \\
  -e RABBITMQ_ERLANG_COOKIE=TUTORIALCLUSTERCOOKIE \\
  -p 15672:15672 -p 5672:5672 \\
  docker.io/library/rabbitmq:3-management

# Node kedua dan ketiga tanpa port host (hanya internal cluster)
podman run -d --name rabbitmq-b \\
  -e RABBITMQ_ERLANG_COOKIE=TUTORIALCLUSTERCOOKIE \\
  docker.io/library/rabbitmq:3-management

podman run -d --name rabbitmq-c \\
  -e RABBITMQ_ERLANG_COOKIE=TUTORIALCLUSTERCOOKIE \\
  docker.io/library/rabbitmq:3-management

# Tunggu sampai semuanya siap
sleep 15 && podman ps --filter name=rabbitmq-`,
      explain: [
        'Variabel RABBITMQ_ERLANG_COOKIE mengatur cookie Erlang secara langsung; nilai yang sama pada ketiga node membuatnya saling mempercayai.',
        'Hanya rabbitmq-a yang memetakan port 5672 dan 15672 ke host agar aplikasi dan dashboard tetap bisa diakses; node lain cukup berkomunikasi internal.',
        'Perintah sleep memberi waktu Erlang VM boot penuh sebelum kita mencoba membentuk cluster — proses startup RabbitMQ bisa memakan waktu belasan detik.'
      ]
    },
    {
      type: 'example',
      title: 'Membentuk cluster dengan join_cluster',
      lang: 'bash',
      output: false,
      code: `# Dari dalam node rabbitmq-a, masukkan node rabbitmq-b ke cluster
podman exec rabbitmq-a rabbitmqctl stop_app
podman exec rabbitmq-a rabbitmqctl reset
podman exec rabbitmq-a rabbitmqctl join_cluster rabbit@$(podman exec rabbitmq-b hostname)
podman exec rabbitmq-a rabbitmqctl start_app

# Ulangi untuk rabbitmq-c
podman exec rabbitmq-c rabbitmqctl stop_app
podman exec rabbitmq-c rabbitmqctl reset
podman exec rabbitmq-c rabbitmqctl join_cluster rabbit@$(podman exec rabbitmq-a hostname)
podman exec rabbitmq-c rabbitmqctl start_app

# Periksa status cluster
podman exec rabbitmq-a rabbitmqctl cluster_status`,
      explain: [
        'stop_app dan reset menghentikan aplikasi RabbitMQ dan membersihkan state sebelum bergabung — langkah wajib sebelum join_cluster.',
        'join_cluster rabbit@hostnamebergabung menambahkan node ke dalam cluster; hostname container dipakai sebagai identitas node Erlang.',
        'setelah start_app, cluster_status menampilkan daftar node dan menegaskan bahwa ketiganya kini berbagi metadata yang sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Quorum Queue: HA Modern Berbasis Raft</h3><p>Setelah cluster terbentuk, saatnya membuat antrean bertahan tinggi. Mari mulai dengan <b>quorum queue</b> — pendekatan yang direkomendasikan RabbitMQ untuk kebanyakan kasus. Quorum queue menggunakan protokol Raft dan menyalin isi antrean ke mayoritas (kuorum) node, sehingga bila satu node mati, data tetap aman di node lain.</p>'
    },
    {
      type: 'example',
      title: 'Membuat quorum queue',
      lang: 'bash',
      output: false,
      code: `# Cara 1: gunakan policy untuk mengubah antrean menjadi quorum
# (berlaku untuk antrean yang namanya diawali "orders")
podman exec rabbitmq-a rabbitmqctl set_policy ha-quorum "^orders$" \\
  '{"queue-type":"quorum"}' --apply-to queues

# Cara 2: langsung saat deklarasi lewat API manajemen
curl -u admin:admin123 -X POST http://localhost:15672/api/queues/%2F/orders \\
  -H "content-type: application/json" \\
  -d '{
    "durable": true,
    "arguments": { "x-queue-type": "quorum", "x-quorum-initial-group": "rabbit@a,rabbit@b,rabbit@c" }
  }'`,
      explain: [
        'Perintah set_policy memberlakukan aturan {"queue-type":"quorum"} pada semua antrean yang cocok dengan pola regex "^orders$".',
        'Argumen x-queue-type=quorum pada deklarasi API menandai antrean ini sebagai quorum queue; x-quorum-initial-group menentukan anggota awal konsensus Raft.',
        'Setelah dibuat, antrean ini menyalin pesannya ke mayoritas anggota; klien tetap cukup terhubung ke satu node saja (misal rabbitmq-a) tanpa perlu tahu detail internalnya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Uji ketahanannya: kirim beberapa pesan ke antrean <code>orders</code>, lalu matikan satu node yang menjadi anggota kuorum, misal <code>rabbitmq-c</code>:</p>'
    },
    {
      type: 'example',
      title: 'Menguji ketahanan quorum queue',
      lang: 'bash',
      output: false,
      code: `# Matikan salah satu node anggota kuorum
podman stop rabbitmq-c

# Periksa pesan masih aman — konsumsi dari antrean orders
podman exec rabbitmq-a rabbitmqctl list_queues name messages

# Jika perlu, jalankan ulang node yang tadi dimatikan
podman start rabbitmq-c

# Pantau pemulihan kuorum
podman exec rabbitmq-a rabbitmqctl eval rabbit_quorum_queue:status().`,
      explain: [
        'Saat satu node mati, kuorum (mayoritas) dari tiga node tetap utuh, sehingga antrean tetap dapat dibaca dan ditulis seperti biasa.',
        'list_queues name messages menunjukkan jumlah pesan tetap utuh meski satu node anggota dimatikan — inilah inti ketahanan quorum queue.',
        'Setelah node dijalankan kembali, Raft melakukan sinkronisasi otomatis; anggota kuorum kembali lengkap tiga node seperti semula.'
      ]
    },
    {
      type: 'text',
      html: '<p>Bagaimana dengan mirrored queue? Mirror queue adalah pendekatan lama: satu node bertindak sebagai master antrean, dan node lain menyalinnya sebagai slave. Ia masih berfungsi, tetapi memiliki beberapa keterbatasan, terutama terkait perilaku saat master berpindah dan konsistensi data. Karena itu RabbitMQ kini merekomendasikan quorum queue untuk sebagian besar kasus. Mirror queue bersifat kompatibilitas mundur dan sebaiknya dihindari untuk desain baru.</p>'
    },
    {
      type: 'tip',
      title: 'Alternatif untuk Belajar Cluster',
      text: 'Untuk belajar cluster tanpa repot mengelola banyak container, kamu juga bisa memakai RabbitMQ Cluster Operator di Kubernetes, atau tool seperti rabbitmq-diagnostics untuk memeriksa kesehatan node (ping, status, alarms) sebelum dan sesudah perubahan.'
    },
    {
      type: 'warn',
      title: 'Cluster Bukan Solusi Geografis',
      text: 'Cluster hanya menyelesaikan masalah ketersediaan node — bukan geografis. Untuk ketahanan terhadap kegagalan pusat data (region), kamu tetap butuh strategi berbeda seperti federation atau mirror per-region. Cluster dalam satu lokasi masih rentan terhadap kegagalan lokal (listrik, jaringan).'
    },
    {
      type: 'text',
      html: '<p>Dengan ini kamu telah membangun cluster tiga node dan mempraktikkan quorum queue yang bertahan terhadap kegagalan satu node. Untuk skenario antar-lokasi atau antar-perusahaan, ketahanan berbasis cluster saja tidak cukup — kita butuh cara menyalin pesan antar cluster secara selektif. Itulah topik bab berikutnya: <i>federation</i> dan <i>shovel</i>.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Cluster', 'Kumpulan node RabbitMQ yang terhubung dan berbagi metadata secara otomatis.'],
        ['Erlang Cookie', 'Kunci rahasia bersama yang memungkinkan node saling mempercayai komunikasi Erlang.'],
        ['Quorum Queue', 'Antrean modern yang memakai konsensus Raft untuk menyalin data ke mayoritas node.'],
        ['Mirrored Queue', 'Antrean klasik dengan pendekatan master-slave yang kini dianggap legacy.'],
        ['Konsensus Raft', 'Algoritma distribusi yang memastikan mayoritas node sepakat tentang isi antrean.']
      ]
    }
  ],
  recap: [
    'Cluster RabbitMQ menggabungkan beberapa node sejajar yang berbagi metadata melalui komunikasi Erlang berbasis cookie yang sama.',
    'Erlang cookie yang identik adalah prasyarat mutlak agar node saling mempercayai dan bisa membentuk cluster.',
    'Mirrored queue adalah mekanisme HA lama (master-slave); quorum queue berbasis Raft adalah pendekatan modern yang direkomendasikan.',
    'Quorum queue menyalin data ke mayoritas node sehingga tetap tersedia walau satu node anggota mati.'
  ]
});
