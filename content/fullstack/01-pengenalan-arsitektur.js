/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 1: Pengenalan & Arsitektur
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-pengenalan',
  title: 'Pengenalan & Arsitektur TokoKita',
  chapter: 'Fondasi',
  duration: '14 menit',
  intro: [
    'Selama ini kamu belajar teknologi satu per satu: Go, MariaDB, Redis, RabbitMQ, React. Sekarang kita <b>merangkainya menjadi satu aplikasi nyata</b> bernama <b>TokoKita</b> — aplikasi toko daring sederhana yang dibangun dari tiga microservice Go, satu MariaDB dengan tiga database terpisah, Redis sebagai cache katalog, RabbitMQ sebagai pengumuman antar service, dan frontend React dengan Ant Design. Seluruhnya berjalan di container Podman dan bisa dinyalakan dengan <b>satu perintah</b>. Kode lengkap hasil akhir seluruh bab sudah tersedia di folder contoh <code>examples/fullstack-microservice/</code> — masuk ke folder itu lalu jalankan <code>podman compose up --build</code>, dan seluruh TokoKita menyala: buka <code>http://localhost:8080</code>.',
    'Bab ini menyiapkan cara berpikirmu sebelum menulis kode: apa saja yang akan dibangun, mengapa komponennya dipisah menjadi beberapa service, bagaimana data mengalir dari klik tombol di browser sampai tersimpan di database dan kembali sebagai notifikasi, serta bagaimana susunan folder monorepo yang memuat semuanya. Tanpa peta ini, pelajaran berikutnya akan terasa seperti potongan-potongan yang saling bertabrakan.',
    'Setelah bab ini kamu akan tahu peran masing-masing container, alur lengkap sebuah pesanan lintas service, dan keputusan desain penting seperti mengapa setiap service punya database sendiri dan mengapa notifikasi tidak disatukan dengan pembuatan pesanan.'
  ],
  objectives: [
    'Menjelaskan peran masing-masing komponen TokoKita: tiga service Go, MariaDB, Redis, RabbitMQ, dan frontend React',
    'Membedakan komunikasi sinkron (HTTP antar service) dari komunikasi asinkron (event RabbitMQ) beserta kapan masing-masing dipakai',
    'Menggambar alur lengkap pembuatan pesanan dari browser sampai notifikasi muncul kembali',
    'Memahami alasan database-per-service dan konsekuensinya',
    'Mengenali susunan folder monorepo dan isi tiap bagian'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang Akan Kita Bangun?</h3><p>TokoKita adalah aplikasi toko daring yang sederhana namun lengkap alurnya: pengguna melihat daftar produk, membuat pesanan, dan menerima notifikasi bahwa pesanan sudah dikonfirmasi. Yang membuat proyek ini menarik bukan jumlah fiturnya, melainkan <b>bagaimana potongannya tersebar</b>:</p>'
    },
    {
      type: 'example',
      title: 'Daftar komponen TokoKita dan tugasnya',
      lang: 'text',
      output: false,
      code: `Layanan Go (masing-masing port sendiri)
  product-service        :8081  CRUD produk + cache Redis
  order-service          :8082  buat pesanan + terbitkan event
  notification-service   :8083  dengarkan event + simpan notifikasi

Penyimpanan & pesan
  MariaDB  :3306   product_db, order_db, notification_db (SATU instance,
                   TIGA database terpisah — satu per service)
  Redis    :6379   cache daftar & detail produk (TTL 30 detik)
  RabbitMQ :5672   exchange topic "tokokita.events"
                   + dashboard manajemen :15672

Antarmuka
  React + Ant Design  :8080  halaman Produk, Pesanan, Notifikasi, Dashboard
                             (port host :8080 → port container :80) di balik
                             nginx yang meneruskan /api ke tiga service`,
      explain: [
        'Setiap service Go berdiri sendiri dengan biner, log, dan portnya sendiri — inilah cirri microservice yang membedakannya dari modular monolith.',
        'Tiga database berada pada SATU instance MariaDB demi ringkasnya komposer lokal; yang penting adalah <b>tiap service hanya mengenal database miliknya sendiri</b>. Prinsip ini tetap berlaku penuh walau nanti database-nya dipisah ke mesin berbeda.',
        'RabbitMQ berperan sebagai penyampai pesan: order-service cukup mengumumkan "pesanan dibuat" tanpa perlu tahu siapa yang mendengar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dua Gaya Komunikasi, Dua Alasan Berbeda</h3><p>Salah satu keputusan paling penting dalam microservices adalah: <b>kapan memakai HTTP langsung, kapan memakai pesan?</b> TokoKita memakai keduanya dengan pembagian tugas yang tegas.</p>'
    },
    {
      type: 'example',
      title: 'Perbandingan komunikasi sinkron dan asinkron di TokoKita',
      lang: 'text',
      output: false,
      code: `Sinkron (HTTP) — dipakai KETIKA jawaban dibutuhkan seketika
  order-service → product-service   GET /products/{id}
  Alasannya: harga & stok WAJIB divalidasi sebelum pesanan sah.
  Kalau katalog tidak bisa dihubungi, pesanan memang harus ditolak.
  Timeout dipasang (2 detik) agar order-service tidak menggantung.

Asinkron (event RabbitMQ) — dipakai KETIKA efek samping boleh tertunda
  order-service → "tokokita.events" → notification-service
  Alasannya: notifikasi tidak boleh menggagalkan pesanan.
  Kalau notification-service sedang mati, pesanan tetap tersimpan —
  notifikasi menyusul begitu konsumer hidup lagi.`,
      explain: [
        'Aturan praktis yang dipakai sepanjang materi ini: <b>bila tanpa jawaban lawan bicara keputusanmu menjadi salah, pakai HTTP; bila hanya menambah efek samping, pakai event.</b>',
        'Timeout pada HTTP client bukan opsi kosmetik. Tanpa timeout, satu service yang sedang hang akan menahan seluruh antrean permintaan di belakangnya.',
        'Pemisahan ini juga yang membuat sistem tetap waras ketika satu komponen sedang bermasalah — lihat materi Microservices bab komunikasi antar service.'
      ]
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Arsitektur TokoKita: browser React di balik nginx, tiga service Go, MariaDB dengan tiga database, Redis, dan RabbitMQ"><defs><marker id="mk-fs01-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs><rect x="250" y="15" width="260" height="50" rx="8" class="u-hd"/><text x="380" y="38" class="u-title" text-anchor="middle">Browser — React + Ant Design</text><text x="380" y="57" class="u-lbl" text-anchor="middle">Produk · Pesanan · Notifikasi · Dashboard</text><line x1="380" y1="65" x2="380" y2="95" class="u-line" marker-end="url(#mk-fs01-1)"/><text x="500" y="84" class="u-lbl" text-anchor="middle">HTTP (satu origin)</text><rect x="250" y="100" width="260" height="44" rx="8" class="u-box"/><text x="380" y="120" class="u-title" text-anchor="middle">nginx (container frontend)</text><text x="380" y="137" class="u-lbl" text-anchor="middle">/ → file build · /api/* → proxy ke service</text><line x1="130" y1="144" x2="130" y2="180" class="u-line" marker-end="url(#mk-fs01-1)"/><line x1="380" y1="144" x2="380" y2="180" class="u-line" marker-end="url(#mk-fs01-1)"/><line x1="630" y1="144" x2="630" y2="180" class="u-line" marker-end="url(#mk-fs01-1)"/><rect x="45" y="185" width="170" height="56" rx="8" class="u-box"/><text x="130" y="207" class="u-title" text-anchor="middle">product-service</text><text x="130" y="227" class="u-lbl" text-anchor="middle">:8081 · CRUD + cache</text><rect x="295" y="185" width="170" height="56" rx="8" class="u-box"/><text x="380" y="207" class="u-title" text-anchor="middle">order-service</text><text x="380" y="227" class="u-lbl" text-anchor="middle">:8082 · buat pesanan</text><rect x="545" y="185" width="170" height="56" rx="8" class="u-box"/><text x="630" y="207" class="u-title" text-anchor="middle">notification-service</text><text x="630" y="227" class="u-lbl" text-anchor="middle">:8083 · konsumer event</text><line x1="215" y1="213" x2="290" y2="213" class="u-line" marker-end="url(#mk-fs01-1)"/><text x="252" y="203" class="u-lbl" text-anchor="middle">HTTP</text><line x1="465" y1="213" x2="540" y2="213" class="u-line" marker-end="url(#mk-fs01-1)"/><text x="502" y="203" class="u-lbl" text-anchor="middle">event</text><rect x="45" y="262" width="170" height="52" rx="8" class="u-hl"/><text x="130" y="283" class="u-title" text-anchor="middle">MariaDB :3306</text><text x="130" y="302" class="u-lbl" text-anchor="middle">product_db · order_db · notif_db</text><rect x="295" y="262" width="170" height="52" rx="8" class="u-hl"/><text x="380" y="283" class="u-title" text-anchor="middle">Redis :6379</text><text x="380" y="302" class="u-lbl" text-anchor="middle">cache produk (TTL 30 dtk)</text><rect x="545" y="262" width="170" height="52" rx="8" class="u-hl"/><text x="630" y="283" class="u-title" text-anchor="middle">RabbitMQ :5672</text><text x="630" y="302" class="u-lbl" text-anchor="middle">exchange tokokita.events</text><line x1="130" y1="241" x2="130" y2="259" class="u-line"/><line x1="380" y1="241" x2="380" y2="259" class="u-line"/><line x1="630" y1="241" x2="630" y2="259" class="u-line"/></svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Arsitektur TokoKita: satu browser, tiga service Go, satu MariaDB berisi tiga database, plus Redis dan RabbitMQ</figcaption></figure>'
    },
    {
      type: 'text',
      html: '<h3>Alur Lengkap Satu Pesanan</h3><p>Agar kamu membayangkan sistemnya sebagai satu kesatuan, telusuri perjalanan sebuah pesanan dari awal sampai akhir. Perhatikan bagian mana yang memakai HTTP dan bagian mana yang memakai event.</p><ol><li>Frontend mengirim <code>POST /api/orders</code> berisi produk, jumlah, dan nama pelanggan, lengkap dengan header <code>Idempotency-Key</code> acak.</li><li>Nginx meneruskannya ke <b>order-service</b>.</li><li>order-service memanggil <b>product-service</b> (<code>GET /products/{id}</code>) untuk memastikan produk ada, mengambil harga terkini, dan memeriksa stok — dengan timeout 2 detik.</li><li>Bila validasi lolos, pesanan disimpan ke <code>order_db</code> memakai kunci idempotensi sebagai jaminan request ulang tidak menggandakan data.</li><li>order-service menerbitkan event <code>order.created</code> ke exchange <code>tokokita.events</code> di RabbitMQ, lalu langsung menjawab frontend dengan pesanan yang tersimpan. <b>Ia tidak menunggu siapa pun.</b></li><li><b>notification-service</b>, yang sejak awal mendengarkan queue <code>notification.orders</code>, menerima event itu dan menyimpan baris notifikasi ke <code>notification_db</code>.</li><li>Frontend memuat halaman Notifikasi (berisi polling ringan tiap 5 detik) dan lonceng di header menunjukkan angka baru.</li></ol><p>Perhatikan langkah 5 dan 6: kalau pada detik yang sama notification-service sedang restart, pesanan di langkah 4 <b>tidak pernah gagal</b>. Event menunggu di RabbitMQ dan dikirim ulang begitu konsumer kembali sehat. Inilah pembeda utama komunikasi asinkron.</p>'
    },
    {
      type: 'example',
      title: 'Bentuk event yang beredar di RabbitMQ',
      lang: 'json',
      output: false,
      code: `{
  "event_id":   "ord-7-9f2c4a81b0e3d517",
  "order_id":   7,
  "customer":   "Budi Santoso",
  "product":    "Kopi Arabika Gayo",
  "qty":        2,
  "total":      170000,
  "created_at": "2026-10-20T09:15:04Z"
}`,
      explain: [
        '<code>event_id</code> adalah pengenal unik per kejadian. Konsumer menyimpannya di kolom UNIQUE sehingga event yang dikirim ulang oleh broker tidak pernah menghasilkan notifikasi ganda.',
        '<code>created_at</code> memakai format RFC 3339 (bawaan serialisasi <code>time.Time</code> Go) — format yang mudah dibaca mesin mana pun.',
        'Field disalin dari pesanan (snapshot), bukan dirujuk lewat ID produk saja: riwayat notifikasi harus tetap bermakna walaupun produk nanti dihapus.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengapa Database-per-Service?</h3><p>Keputusan paling sering diperdebatkan dalam microservices adalah soal database. TokoKita mengikuti aturan keras: <b>setiap service hanya boleh membaca dan menulis database miliknya sendiri</b>. product-service tidak pernah menyentuh <code>order_db</code>, sekalipun keduanya berada di instance MariaDB yang sama.</p><p>Manfaatnya nyata: setiap service bisa mengubah skemanya tanpa berkoordinasi dengan service lain, skala dan backup bisa diatur per service, dan kegagalan satu database tidak serta-merta menjatuhkan seluruh sistem. Harganya juga nyata: kamu tidak bisa lagi menulis satu query <code>JOIN</code> yang menyilangkan produk dan pesanan. Bila laporan butuh data gabungan, jalannya adalah <b>API</b>, <b>event</b>, atau <b>materialisasi</b> di service yang membutuhkan — bukan query silang.</p><p>Di TokoKita, kolom <code>product_name</code> dan <code>unit_price</code> ikut tersimpan di tabel pesanan meski data produknya ada di database lain. Keputusan menyimpan salinan ini (bukan sekadar <code>product_id</code>) adalah konsekuensi langsung dari database-per-service: riwayat pesanan harus tetap terbaca walau produk sudah berubah harga atau dihapus.</p>'
    },
    {
      type: 'example',
      title: 'Susunan folder monorepo TokoKita',
      lang: 'text',
      output: false,
      code: `fullstack-microservice/
├── compose.yaml                 # seluruh stack: 7 container, satu perintah
├── Dockerfile                   # image Go bersama (parameter SERVICE=...)
├── internal/
│   └── logx/                    # logger JSON bersama ketiga service (slog)
├── migrations/
│   ├── 001_product.sql          # product_db + pengguna product_svc
│   ├── 002_order.sql            # order_db + pengguna order_svc
│   └── 003_notification.sql     # notification_db + pengguna notification_svc
├── services/
│   ├── product/
│   │   ├── cmd/main.go          # wiring: config → DB → Redis → HTTP
│   │   └── internal/
│   │       ├── store/           # akses MariaDB product_db
│   │       ├── cache/           # cache-aside di Redis
│   │       └── httpapi/         # handler REST + validasi
│   ├── order/
│   │   ├── cmd/main.go
│   │   └── internal/
│   │       ├── store/           # akses order_db + idempotensi
│   │       ├── publisher/       # penerbit event RabbitMQ
│   │       └── httpapi/         # handler + HTTP client ke product-service
│   └── notification/
│       ├── cmd/main.go
│       └── internal/
│           ├── store/           # akses notification_db + dedup event
│           ├── consumer/        # konsumer event (reconnect, ack manual)
│           └── httpapi/         # API notifikasi untuk frontend
└── frontend/
    ├── Dockerfile               # build Vite lalu sajikan dengan nginx
    ├── nginx.conf               # SPA + proxy /api ke tiga service
    ├── vite.config.js           # proxy serupa untuk mode pengembangan
    └── src/
        ├── main.jsx / App.jsx   # gerbang React + peta rute
        ├── api/                 # axios: productApi, orderApi, notificationApi
        ├── components/          # AppShell (sidebar + lonceng), PageHeader
        └── pages/               # Dashboard, Products, Orders, Notifications`,
      explain: [
        'Satu module Go (<code>example.com/tokokita</code>) untuk ketiga service: berbagi proses build dan versi dependensi, tetapi tiap service tetap punya folder sendiri yang bisa dilepas menjadi repository terpisah kapan saja.',
        'Folder <code>internal/</code> di bawah tiap service memakai fitur bawaan Go: paket di dalamnya tidak bisa diimpor dari luar module — batas antar service dipertegas oleh kompiler, bukan sekadar kesepakatan tim.',
        'Folder <code>internal/logx/</code> di tingkat root adalah satu-satunya pengecualian yang disengaja: paket logging bersama (slog JSON) yang boleh diimpor ketiga service, ikut dibangun oleh Dockerfile bersama.',
        'Migrasi ditempatkan di tingkat atas karena dijalankan oleh container MariaDB saat pertama boot, bukan oleh satu service tertentu.'
      ]
    },
    {
      type: 'tip',
      title: 'Bila Proyek Ini Terasa Terlalu Besar',
      text: 'Tidak apa-apa. Materi ini memang disusun bertahap: bab 2–3 menyiapkan Podman dan database, bab 4–7 membangun service Go satu per sisi (catatan untuk bab 7: RabbitMQ harus sudah menyala karena order-service menunggu broker lalu berhenti fatal bila broker tidak pernah siap), bab 8–9 menyambungkan RabbitMQ lewat penerbit event dan notification-service, bab 10–11 memasang serta mengintegrasikan frontend React, dan bab 12 menutup dengan containerisasi dan rilis seluruh stack. Kamu selalu bisa berhenti di bab 7 dan tetap punya REST API pesanan yang berjalan — frontend hanya lapisan penutup yang menyatukannya.'
    },
    {
      type: 'warn',
      title: 'Jangan Tergoda Berbagi Database',
      text: 'Pada proyek kecil, sekali lagi terdengar efisien kalau semua tabel ditaruh di satu database agar bisa <code>JOIN</code> bebas. Tahan godaan itu. Yang tampak hemat di minggu pertama berubah menjadi pengelompokan raksasa di bulan ketiga: satu perubahan skema memaksa seluruh tim berhenti, dan kamu kembali ke monolit — tapi tanpa keuntungan monolit yang rapi. Simpan batas ini sejak awal walau masih satu container MariaDB.'
    },
    {
      type: 'vocab',
      items: [
        ['Microservice', 'Gaya arsitektur di mana aplikasi dipecah menjadi sekumpulan layanan kecil yang berdiri sendiri, berkomunikasi lewat jaringan, dan dirilis secara terpisah.'],
        ['Database-per-service', 'Setiap service memiliki database miliknya sendiri dan tidak boleh mengakses database service lain; pertukaran data dilakukan lewat API atau event.'],
        ['Komunikasi sinkron', 'Pola tanya-jawab (misal HTTP) di mana pengirim menunggu balasan sebelum melanjutkan langkah berikutnya.'],
        ['Komunikasi asinkron', 'Pola kirim-lupakan lewat message broker: pengirim tidak menunggu penerima memproses pesannya.'],
        ['Idempotency key', 'Pengenal unik per permintaan yang membuat pengulangan request yang sama menghasilkan efek yang sama — bukan data ganda.'],
        ['Snapshot harga', 'Menyimpan salinan harga/nama produk pada saat transaksi, bukan sekadar menunjuk ID, agar riwayat tetap akurat walau data asli berubah.'],
        ['Monorepo', 'Susunan di mana beberapa layanan berada dalam satu repository dan satu module, dengan folder sebagai batas kepemilikan.'],
        ['Deklarasi topologi', 'Penerbit dan konsumer sama-sama mendeklarasikan exchange/queue yang dipakai sehingga urutan start container tidak lagi krusial.']
      ]
    }
  ],
  recap: [
    'TokoKita tersusun dari tiga service Go (product, order, notification), satu MariaDB berisi tiga database, Redis sebagai cache, RabbitMQ sebagai broker, dan frontend React + Ant Design di balik nginx.',
    'HTTP dipakai ketika jawaban dibutuhkan seketika (validasi produk saat membuat pesanan); event RabbitMQ dipakai ketika efek samping boleh tertunda (notifikasi).',
    'Alur pesanan: frontend → nginx → order-service → validasi ke product-service → simpan ke order_db → terbitkan event → notification-service menyimpan notifikasi → lonceng di frontend bertambah.',
    'Database-per-service memutus ketergantungan skema antar service dengan harga hilangnya JOIN lintas database — konsekuensinya data transaksi menyimpan snapshot, bukan sekadar rujukan ID.',
    'Monorepo memakai satu module Go dengan folder internal/ sebagai batas yang dipertegas kompiler; migrasi dijalankan container MariaDB saat boot pertama.'
  ]
});
