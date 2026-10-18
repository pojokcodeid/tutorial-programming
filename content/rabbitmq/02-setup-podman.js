/* ============================================================
   Pelajaran RabbitMQ — Bab 2: Setup RabbitMQ dengan Podman
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'setup-podman',
  title: 'Setup RabbitMQ dengan Podman & Dashboard',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'RabbitMQ ditulis dalam bahasa Erlang, dan memasangnya langsung ke sistem berarti memasang Erlang runtime, mencocokkan versi, lalu merawatnya sendiri. Dengan container, seluruh itu sudah disiapkan image resmi — kamu cukup menjalankannya.',
    'Bab ini menjalankan RabbitMQ pertama kali memakai <b>Podman</b>: container dengan <b>management plugin</b> aktif, dua port penting (5672 untuk aplikasi dan 15672 untuk dashboard), kredensial awal, hingga memeriksa kesehatan node dengan <code>rabbitmqctl</code> dan <code>rabbitmq-diagnostics</code>.',
    'Setelah bab ini kamu akan punya "mainan" yang siap dipakai di seluruh sisa materi: satu broker lokal yang bisa dikunjungi lewat browser, dimatikan, dinyalakan lagi, dan tetap menyimpan datanya.'
  ],
  objectives: [
    'Menjalankan container RabbitMQ dengan management plugin memakai Podman',
    'Memahami peran port 5672 (AMQP) dan 15672 (dashboard manajemen)',
    'Masuk dan menjelajahi Management Dashboard di http://localhost:15672',
    'Memeriksa kesehatan node memakai rabbitmqctl status dan rabbitmq-diagnostics ping'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Lewat Container?</h3><p>RabbitMQ dibangun di atas <b>Erlang/OTP</b> dan <b>Elixir</b>. Di Linux, memasangnya berarti menambahkan repository, mencocokkan versi Erlang yang didukung, lalu mengelola upgrade. Di macOS, ceritanya lebih panjang lagi. Container menyederhanakan semuanya: image resmi <code>rabbitmq:3-management</code> sudah berisi RabbitMQ versi terbaru, Erlang yang sesuai, dan management plugin yang aktif.</p><p>Podman dipakai di materi ini karena sifatnya <b>rootless dan tanpa daemon</b> — tidak ada proses latar belakang yang berjalan terus di sistem kamu, dan container berhenti begitu terminal ditutup bila tidak diberi opsi <code>-d</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Container Pertama Kali</h3><p>Perintah berikut menjalankan RabbitMQ di latar belakang, membuka dua port, dan menetapkan pengguna awal:</p><pre><code>podman run -d \\\n  --name rabbitmq-server \\\n  -p 5672:5672 \\\n  -p 15672:15672 \\\n  -e RABBITMQ_DEFAULT_USER=admin \\\n  -e RABBITMQ_DEFAULT_PASS=admin123 \\\n  rabbitmq:3-management</code></pre><p>Penjelasan tiap bagian:</p><ul><li><code>-d</code> — jalankan di latar belakang (<i>detached</i>).</li><li><code>--name rabbitmq-server</code> — nama container, dipakai pada setiap perintah <code>podman exec</code> berikutnya.</li><li><code>-p 5672:5672</code> — port AMQP: aplikasi kamu di host terhubung ke sini.</li><li><code>-p 15672:15672</code> — port management dashboard untuk dibuka di browser.</li><li><code>-e RABBITMQ_DEFAULT_USER/PASS</code> — membuat akun admin saat pertama kali boot (akun <code>guest</code> bawaan hanya boleh dipakai dari localhost).</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 290" width="760" role="img" aria-label="Dua port RabbitMQ: 5672 untuk koneksi AMQP aplikasi dan 15672 untuk dashboard manajemen">
        <rect x="40" y="30" width="680" height="200" rx="10" class="u-box"/>
        <text x="380" y="56" class="u-title" text-anchor="middle">Container: rabbitmq-server (image rabbitmq:3-management)</text>
        <line x1="56" y1="66" x2="704" y2="66" class="u-line"/>
        <rect x="70" y="86" width="270" height="120" rx="8" class="u-hd"/>
        <text x="205" y="112" class="u-title" text-anchor="middle">Port 5672 — AMQP</text>
        <text x="205" y="140" class="u-lbl" text-anchor="middle">dipakai aplikasi (producer/consumer)</text>
        <text x="205" y="162" class="u-lbl" text-anchor="middle">library: amqplib, amqp091-go,</text>
        <text x="205" y="182" class="u-lbl" text-anchor="middle">amqp-client (Java)</text>
        <rect x="420" y="86" width="270" height="120" rx="8" class="u-box"/>
        <text x="555" y="112" class="u-title" text-anchor="middle">Port 15672 — Management</text>
        <text x="555" y="140" class="u-lbl" text-anchor="middle">dashboard web: queues, exchanges,</text>
        <text x="555" y="162" class="u-lbl" text-anchor="middle">connections, chanel, publishes</text>
        <text x="555" y="182" class="u-lbl" text-anchor="middle">HTTP API juga di port ini</text>
        <line x1="205" y1="216" x2="205" y2="248" class="u-dash" marker-end="url(#u-arrow)"/>
        <line x1="555" y1="216" x2="555" y2="248" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="205" y="268" class="u-lbl" text-anchor="middle">kode aplikasi</text>
        <text x="555" y="268" class="u-lbl" text-anchor="middle">browser kamu</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Satu container, dua pintu: 5672 untuk aplikasi dan 15672 untuk dashboard</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Memeriksa Container &amp; Kesehatan Node',
      lang: 'bash',
      output: false,
      code: `# Lihat status container (pastikan STATUS: Up ...)
podman ps --filter name=rabbitmq-server

# Lihat log boot RabbitMQ
podman logs -f rabbitmq-server

# Tunggu sampai node benar-benar siap (harus menjawab pong)
podman exec rabbitmq-server rabbitmq-diagnostics -q ping

# Status node: versi, memori, uptime, alarm
podman exec rabbitmq-server rabbitmqctl status

# Daftar vhost, user, dan permission awal
podman exec rabbitmq-server rabbitmqctl list_vhosts
podman exec rabbitmq-server rabbitmqctl list_users`,
      explain: [
        '<code>rabbitmq-diagnostics -q ping</code> adalah pemeriksaan termurah; jalankan sebelum memastikan aplikasi bisa terhubung, karena container memang butuh beberapa detik setelah start.',
        '<code>rabbitmqctl status</code> menampilkan kesehatan menyeluruh: versi RabbitMQ dan Erlang, pemakaian memori/disk, dan apakah ada <i>alarm</i> aktif yang memblokir penerimaan pesan baru.',
        'Kedua perintah dijalankan <b>di dalam container</b> lewat <code>podman exec</code> — RabbitMQ tidak perlu dipasang apa pun di host kamu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menjelajahi Management Dashboard</h3><p>Buka <code>http://localhost:15672</code> lalu masuk dengan <code>admin</code> / <code>admin123</code> (sesuai variabel lingkungan tadi). Dashboard adalah cara tercepat memahami apa yang terjadi di broker. Halaman-halaman penting:</p><ul><li><b>Overview</b> — ringkasan node: connections, channels, queues, penggunaan memori/disk, dan status alarm.</li><li><b>Queues / Exchanges / Bindings</b> — tempat kamu melihat antrean yang ada, berapa pesan menumpuk, dan bagaimana exchange terhubung ke queue. Tab <b>Get messages</b> / <b>Publish message</b> memungkinkan kamu mengirim dan mengambil pesan tanpa menulis kode sama sekali.</li><li><b>Connections / Channels</b> — siapa yang sedang terhubung ke broker, dari alamat mana, dan seberapa banyak channel yang dipakai.</li><li><b>Admin</b> — mengelola pengguna, vhost, dan permission.</li></ul><p>Tips belajar: setiap kali kamu menjalankan kode contoh pada bab-bikutnya, buka dashboard dan amati angka pada tab <b>Queues</b> berubah — pesan masuk, menumpuk, lalu berkurang setelah dikonsumsi.</p>'
    },
    {
      type: 'example',
      title: 'Operasional Harian: Start, Stop, Bersihkan',
      lang: 'bash',
      output: false,
      code: `# Berhenti (data tetap aman selama container tidak dihapus)
podman stop rabbitmq-server

# Jalankan lagi
podman start rabbitmq-server

# Masuk shell di dalam container (misal untuk inspeksi)
podman exec -it rabbitmq-server bash

# Bersih-bersih HANYA bila ingin memulai dari nol
podman stop rabbitmq-server
podman rm rabbitmq-server`,
      explain: [
        '<code>podman stop</code> lalu <code>start</code> adalah rutinitas aman: RabbitMQ menutup koneksi dengan rapi dan data tetap tersimpan di dalam container.',
        '<code>podman rm</code> menghapus container beserta seluruh isi datanya — queues dan messages ikut hilang. Untuk latihan biasa tidak masalah, tetapi ingat konsekuensinya.',
        'Untuk data yang harus bertahan selamanya, jalankan container dengan volume, misalnya <code>-v rabbitmq_data:/var/lib/rabbitmq</code>, sehingga data ikut pindah bila container dibuat ulang.'
      ]
    },
    {
      type: 'example',
      title: 'Versi Image yang Boleh Dipakai',
      lang: 'text',
      output: false,
      code: `rabbitmq:3-management       versi 3.x terbaru + management plugin (disarankan)
rabbitmq:3                  versi 3.x terbaru, TANPA dashboard
rabbitmq:3.13-management     versi tetap (pin) — disarankan untuk produksi
rabbitmq:4-management        lini versi 4 (fitur lebih baru, cek kompatibilitas)

Untuk belajar       : rabbitmq:3-management
Untuk produksi       : pin versi eksplisit, mis. rabbitmq:3.13-management`,
      explain: [
        'Tag <code>-management</code> adalah pembeda penting: tanpa tag ini, port 15672 tidak terbuka dan kamu kehilangan dashboard.',
        'Memakai tag <code>3</code> tanpa patch membuat hasil belajar tidak pernah ketinggalan, tetapi di produksi selalu <b>pin versi penuh</b> agar pembaruan hanya terjadi saat kamu siap.',
        'Versi RabbitMQ dan Erlang harus saling didukung; image resmi sudah menyelesaikan pencocokan ini untukmu.'
      ]
    },
    {
      type: 'tip',
      title: 'Belajar Tanpa Biaya',
      text: 'Seluruh materi RabbitMQ di situs ini hanya membutuhkan Podman dan image gratis dari Docker Hub. Tidak ada layanan berbayar, tidak ada akun cloud. Bila ada perintah yang gagal, jalankan <code>podman logs rabbitmq-server</code> — hampir selalu penyebabnya port sudah terpakai atau container lama belum dihapus.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Akun <code>guest</code> bawaan RabbitMQ <b>hanya bisa dipakai dari localhost</b> dan diblokir dari jaringan. Itulah sebabnya kamu membuat <code>admin</code> lewat variabel lingkungan. Jangan pernah menaruh kata sandi produksi di dalam perintah <code>podman run</code> yang ikut tercatat di riwayat shell — gunakan file environment atau rahasia (secret) untuk lingkungan sungguhan.'
    },
    {
      type: 'vocab',
      items: [
        ['Management plugin', 'Plugin resmi RabbitMQ yang menyediakan dashboard web dan HTTP API pada port 15672.'],
        ['rabbitmqctl', 'Alat baris perintah untuk mengelola node: status, user, vhost, queue, dan policy.'],
        ['rabbitmq-diagnostics', 'Alat pemeriksaan kesehatan RabbitMQ: ping, koneksi, disk, dan uji-jiwa komponen.'],
        ['vhost', 'Ruang lingkung (namespace) logis di dalam broker; queue, exchange, dan permission dipisah per vhost.'],
        ['Node', 'Satu instalasi Erlang yang menjalankan proses RabbitMQ; satu cluster bisa berisi beberapa node.'],
        ['Detached (-d)', 'Opsi menjalankan container di latar belakang agar tidak menempel pada terminal.'],
        ['Volume', 'Penyimpanan di luar container agar data RabbitMQ tetap hidup saat container dibuat ulang.']
      ]
    }
  ],
  recap: [
    'RabbitMQ berjalan paling mudah lewat container resmi rabbitmq:3-management dengan Podman, tanpa memasang Erlang apa pun.',
    'Port 5672 dipakai aplikasi lewat protokol AMQP; port 15672 dipakai dashboard manajemen dan HTTP API.',
    'Dashboard di http://localhost:15672 adalah cara tercepat mengamati queues, exchanges, connections, dan mengirim/mengambil pesan tanpa kode.',
    'Kesehatan node diperiksa dengan rabbitmqctl status dan rabbitmq-diagnostics ping; stop/start aman, sedangkan rm menghapus seluruh data.'
  ]
});
