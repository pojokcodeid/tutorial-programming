/* ============================================================
   Pelajaran Microservices — Bab 1: Fondasi Backend & Arsitektur Aplikasi
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'fondasi-backend-arsitektur',
  title: 'Fondasi Backend: Client-Server, HTTP, dan Arsitektur Aplikasi',
  chapter: 'Fondasi Backend',
  duration: '14–16 menit',
  intro: [
    'Setiap fitur di aplikasi web bermula dari satu perjalanan: ada klien yang mengirim permintaan, ada server yang menjawab, dan ada database yang menyimpan jejaknya. Memahami perjalanan itu sampai tuntas adalah bekal terpenting sebelum kita memecah aplikasi menjadi banyak microservices, sebab setiap masalah di skala besar berakar dari salah satu tahap perjalanan ini.',
    'Bab ini menyiapkan fondasi bersama seluruh materi: perjalanan satu request HTTP dari DNS sampai respons, bahasa HTTP dan REST yang dipakai semua service, pembedaan authentication dengan authorization, gambaran singkat SQL dan transaksi, lalu fokus utamanya — membandingkan monolith, modular monolith, dan microservices beserta kapan ketiganya layak dipilih.',
    'Sepanjang materi kita memakai satu contoh sistem: <b>Order Management System (OMS)</b> dengan tiga service Go — <code>catalog-service</code> (port 8081, katalog produk), <code>order-service</code> (port 8082, pesanan), dan <code>notification-service</code> (port 8083, notifikasi). Semua konsep langsung terlihat penerapannya pada sistem ini.'
  ],
  objectives: [
    'Menjelaskan perjalanan satu request HTTP dari klien sampai database dan kembali',
    'Menggunakan HTTP methods, status codes, header, dan body secara tepat lewat curl',
    'Membedakan authentication dengan authorization serta mengenali prinsip REST dan JSON',
    'Membandingkan monolith, modular monolith, dan microservices beserta biaya masing-masing',
    'Merangkum prinsip 12-Factor yang paling menentukan kualitas sebuah service'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Perjalanan Satu Request HTTP</h3><p>Ketika pengguna menekan tombol beli, kirimannya tidak serta-merta langsung sampai ke server. Ada serangkaian tahap, dan masing-masing bisa menambah latency:</p><ul><li><b>DNS lookup</b> — nama domain diterjemahkan menjadi alamat IP; bila tahap ini lambat, biasanya masalah ada pada resolver, bukan servermu.</li><li><b>TCP handshake</b> — tiga langkah (SYN, SYN-ACK, ACK) membuka koneksi; dilewati bila koneksi dipakai ulang lewat keep-alive.</li><li><b>TLS handshake</b> — klien dan server menukar sertifikat lalu menyetujui kunci enkripsi; di sinilah HTTPS menjamin kerahasiaan dan integritas data.</li><li><b>Pemrosesan server</b> — router mencocokkan method dan path, middleware berjalan, handler memvalidasi input dan menjalankan logika bisnis, lalu mengirim query ke database.</li><li><b>Respons</b> — status code, header, dan body (umumnya JSON) dikirim kembali ke klien.</li></ul><p>Anggap tiap tahap sebagai antrean: latency total adalah <b>jumlah</b> seluruh tahap. Karena itu ketika p95 melonjak, kita telusuri per tahap — jangan langsung menyalahkan kode handler.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 180" width="760" role="img" aria-label="Perjalanan request dari klien ke catalog-service lalu ke database PostgreSQL dan kembali"><rect x="20" y="45" width="150" height="70" rx="10" class="u-box"/><text x="95" y="75" class="u-title" text-anchor="middle">Klien</text><text x="95" y="98" class="u-lbl" text-anchor="middle">browser / aplikasi mobile</text><line x1="175" y1="80" x2="283" y2="80" class="u-line" marker-end="url(#u-arrow)"/><text x="229" y="70" class="u-lbl" text-anchor="middle">HTTP + JSON</text><rect x="290" y="35" width="190" height="90" rx="10" class="u-box"/><text x="385" y="62" class="u-title" text-anchor="middle">catalog-service :8081</text><text x="385" y="85" class="u-lbl" text-anchor="middle">Go · net/http · handler</text><text x="385" y="106" class="u-lbl" text-anchor="middle">validasi &amp; logika bisnis</text><line x1="485" y1="80" x2="573" y2="80" class="u-line" marker-end="url(#u-arrow)"/><text x="529" y="70" class="u-lbl" text-anchor="middle">SQL parameterized</text><rect x="580" y="45" width="160" height="70" rx="10" class="u-box"/><text x="660" y="75" class="u-title" text-anchor="middle">catalog_db</text><text x="660" y="98" class="u-lbl" text-anchor="middle">PostgreSQL 16</text><text x="380" y="160" class="u-lbl" text-anchor="middle">respons JSON kembali ke klien lewat jalur yang sama, arahnya terbalik</text></svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Alur request OMS: klien memanggil API, API memproses lalu membaca database, respons kembali sebagai JSON</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>HTTP: Method, Status Code, Header, Body</h3><p>HTTP adalah protokol ringkas berbasis teks: klien mengirim baris method dan path, beberapa header, opsional body, lalu server menjawab dengan status code, header, dan body. Yang wajib kamu kuasai sejak awal:</p><ul><li><b>Method</b> — <code>GET</code> membaca dan seharusnya tidak mengubah data; <code>POST</code> membuat sumber baru; <code>PUT</code> mengganti seluruh representasi; <code>PATCH</code> mengubah sebagian; <code>DELETE</code> menghapus. Memilih method yang salah membuat API terasa asing bagi klien.</li><li><b>Status code</b> — <code>200</code> OK, <code>201</code> Created (disertai header <code>Location</code>), <code>204</code> No Content untuk sukses tanpa body, <code>400</code> Bad Request (input tidak valid), <code>401</code> belum login, <code>403</code> login tetapi tidak berhak, <code>404</code> tidak ditemukan, <code>409</code> konflik data, <code>422</code> lolos sintaks tetapi gagal validasi bisnis, <code>500</code> kesalahan server.</li><li><b>Header</b> — membawa metadata: <code>Content-Type</code>, <code>Authorization</code>, <code>Idempotency-Key</code>, dan <code>X-Request-Id</code> untuk melacak request lintas service.</li></ul><p><b>REST</b> adalah gaya desain API berbasis sumber daya: setiap entitas punya URL stabil (bukan nama aksi), data dipertukarkan lewat representasi seperti <b>JSON</b>, dan komunikasi bersifat <i>stateless</i> — setiap request membawa seluruh informasi yang dibutuhkan server, tanpa mengandalkan sesi di memori.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Menguji OMS dengan curl',
      lang: 'bash',
      output: false,
      code: `# 1. Daftar produk dari catalog-service
curl -s http://localhost:8081/products | jq .

# 2. Lihat status code saja, praktis untuk pengecekan cepat
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8081/products

# 3. Tambah produk: minta header respons dikirim (status 201 + Location)
curl -s -i -X POST http://localhost:8081/products \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Kopi Susu Gula Aren","price":24000,"stock":50}'

# 4. Ambil satu produk; 404 bila ID tidak ada
curl -s -i http://localhost:8081/products/3f1d2a88-6c1b-4a5e-9b3a-1d2f4e6a7b8c

# 5. Buat pesanan dua kali dengan Idempotency-Key yang sama:
#    order-service wajib mengembalikan pesanan yang sama, bukan dua pesanan
KEY=$(uuidgen)
curl -s -X POST http://localhost:8082/orders \\
  -H 'Content-Type: application/json' -H "Idempotency-Key: $KEY" \\
  -d '{"product_id":"3f1d2a88-6c1b-4a5e-9b3a-1d2f4e6a7b8c","quantity":2}'
curl -s -X POST http://localhost:8082/orders \\
  -H 'Content-Type: application/json' -H "Idempotency-Key: $KEY" \\
  -d '{"product_id":"3f1d2a88-6c1b-4a5e-9b3a-1d2f4e6a7b8c","quantity":2}'`,
      explain: [
        'Flag <code>-i</code> menampilkan header respons — dari situ kamu bisa memastikan status <code>201</code> dan header <code>Location</code> benar-benar dikirim, bukan sekadar melihat body.',
        'Perintah nomor 2 membuang body (<code>-o /dev/null</code>) dan hanya mencetak status code; cara paling ringkas memeriksa endpoint health atau mencari endpoint yang salah rute.',
        'Percobaan nomor 5 adalah gambaran <b>idempotency</b>: dua request dengan kunci yang sama harus menghasilkan satu pesanan. Kebiasaan ini kita bangun sejak awal karena jaringan bisa mengirim ulang request tanpa sepengetahuan kita.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Authentication vs Authorization</h3><p>Dua istilah yang sering tertukar. <b>Authentication</b> menjawab "siapa kamu?" — lewat kata sandi, token JWT, atau API key. <b>Authorization</b> menjawab "apa yang boleh kamu lakukan?" — apakah user role admin boleh menghapus produk, apakah pemilik pesanan boleh melihat pesanannya. Urutan wajibnya authentication dulu, baru authorization; dan server yang benar memeriksa otorisasi di setiap endpoint, bukan sekadar menyembunyikan tombol di tampilan.</p><h3>SQL, Database, dan Transaksi (Singkat)</h3><p>Backend pada umumnya menyimpan data di database relasional. <b>SQL</b> adalah bahasa standar untuk berbicara dengannya, sedangkan <b>transaksi</b> menjamin serangkaian operasi berjalan utuh: semua berhasil (<b>commit</b>) atau semuanya batal (<b>rollback</b>) — dikenal dengan akronim <b>ACID</b>. Contoh paling dekat dengan OMS: mengurangi stok produk dan membuat pesanan wajib berjalan dalam satu transaksi, supaya kejadian "stok berkurang tetapi pesanan tidak tercatat" tidak pernah ada. Penerapannya di Go kita bahas pada Bab 4.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Monolith vs Modular Monolith vs Microservices',
      lang: 'text',
      output: false,
      code: `ASPEK                MONOLITH              MODULAR MONOLITH        MICROSERVICES
-------------------  --------------------  ----------------------  ------------------------
Bentuk               1 proses, 1 berkas    1 proses, N package     N proses, deploy terpisah
Komunikasi internal  panggilan fungsi      panggilan fungsi        HTTP / gRPC / pesan
Database             1 untuk semua         1 untuk semua           1 per service
Tim ownership        campur, saling        per modul               per service, tim khusus
                     tergantung
Deployment           seluruh aplikasi      seluruh aplikasi        hanya service yang berubah
Skala                seluruh aplikasi      seluruh aplikasi        per service sesuai beban
Biaya operasional    rendah                rendah                  tinggi
Cocok untuk          tim kecil, fitur      tim sedang, domain      tim besar, kebutuhan
                     masih sedikit         mulai tumbuh            skala & isolasi nyata`,
      explain: [
        '<b>Monolith</b> adalah satu proses berisi seluruh logika; sederhana untuk dijalankan dan di-debug, tetapi batas modulnya sering kabur sehingga perubahan kecil berisiko merusak bagian lain.',
        '<b>Modular monolith</b> mempertahankan satu proses tetapi memaksa batas tegas antar package (di Go: <code>internal/catalog</code>, <code>internal/order</code>, masing-masing dengan interface sendiri). Untuk banyak tim, inilah titik keseimbangan terbaik — manfaat kejelasan batas tanpa biaya jaringan.',
        '<b>Microservices</b> memecahnya menjadi proses terpisah: setiap service punya database, pipeline deploy, dan pemilik sendiri. Keuntungan skala dan isolasi baru terasa ketika tim dan trafiknya memang besar.'
      ]
    },
    {
      type: 'warn',
      title: 'Kapan Microservices TIDAK Disarankan',
      text: 'Microservices bukan penghargaan untuk kode yang rapi. Hati-hati bila kamu memecah service hanya karena tren. Dua jebakan paling sering: <b>distributed monolith</b> — service dipisah tetapi setiap permintaan harus memanggil lima service lain secara sinkron sehingga satu service mati dan semuanya ikut gagal, deployment pun selalu harus berpasangan; dan <b>biaya operasional</b> — kamu kini butuh service discovery, TLS antar service, monitoring per service, pipeline CI/CD per service, serta penanganan kegagalan jaringan yang sebelumnya tidak pernah ada. Tanda paling jelas: bila kamu belum nyaman mengobservabilitas (logging, metrics, tracing) satu service, menambah sepuluh service hanya akan melipatgandakan kegelapan.'
    },
    {
      type: 'text',
      html: '<h3>12-Factor App: Ringkas tapi Menentukan</h3><p>Metodologi 12-Factor (<i>the twelve-factor app</i>) adalah daftar praktik menyusun aplikasi berbasis web yang tahan dijalankan di banyak lingkungan — lahir dari pengalaman tim Heroku. Bagi microservices, beberapa poinnya nyaris wajib:</p><ul><li><b>Config di environment</b> — URL database, port, dan secret tidak boleh tertanam di kode; dibaca dari environment variable saat runtime.</li><li><b>Backing services diperlakukan sama</b> — database dan broker dilepas kaitannya: ganti PostgreSQL lokal ke managed service cukup dengan mengubah konfigurasi.</li><li><b>Proses stateless dan disposability</b> — service harus bisa dimatikan dan dinyalakan kapan saja dalam hitungan detik; kaitkan dengan graceful shutdown yang kita bangun di Bab 3.</li><li><b>Concurrency</b> — skala lewat menambah proses (replica), bukan membesarkan satu proses.</li><li><b>Logs sebagai event stream</b> — service tidak menyimpan log ke file; log ditulis ke stdout lalu dikumpulkan pihak lain.</li><li><b>Dev/prod parity</b> — lingkungan pengembangan sedekat mungkin dengan produksi, termasuk versi database.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Struktur Monorepo OMS',
      lang: 'text',
      output: false,
      code: `oms/                             # satu Go module: example.com/oms
├── services/
│   ├── catalog/                 # port 8081 · DB catalog_db · tabel products
│   │   ├── cmd/api/main.go
│   │   ├── internal/httpapi/
│   │   └── migrations/
│   ├── order/                   # port 8082 · DB order_db · tabel orders
│   └── notification/            # port 8083 · konsumen event RabbitMQ
├── deploy/
│   └── compose.yaml             # jalur cepat menjalankan seluruh stack
└── go.mod`,
      explain: [
        'Satu <b>Go module</b> untuk tiga service membuat berbagi kode utilitas menjadi mudah, tetapi setiap service tetap dikompilasi menjadi binary terpisah sehingga deployment tetap independen.',
        'Setiap service memegang folder <code>migrations</code> sendiri — bukti fisik dari prinsip <b>database per service</b> yang akan kita bangun di Bab 4.'
      ]
    },
    {
      type: 'tip',
      title: 'Latihan Mandiri',
      text: 'Perkuat pemahaman bab ini dengan tiga hal kecil. (1) Panggil endpoint OMS dengan curl dan catat status code setiap percobaan, termasuk yang gagal. (2) Gambar diagram sederhana klien → API → database untuk skenario buat pesanan, lengkap dengan data apa yang mengalir di setiap panah. (3) Tulis dokumen API singkat (method, path, status code, contoh body JSON) untuk tiga endpoint pertama — kebiasaan mendokumentasikan kontrak ini akan sangat membantu saat service mulai berpindah tangan antar tim.'
    },
    {
      type: 'vocab',
      items: [
        ['Client-server', 'Pola komunikasi di mana klien mengirim permintaan dan server menjawab dengan layanan atau data.'],
        ['HTTP method', 'Kata perintah pada request (GET, POST, PUT, PATCH, DELETE) yang menandakan niat klien terhadap sumber daya.'],
        ['Status code', 'Angka tiga digit pada respons: 2xx sukses, 4xx kesalahan klien, 5xx kesalahan server.'],
        ['REST', 'Gaya desain API berbasis sumber daya, representasi JSON, dan komunikasi stateless.'],
        ['JSON', 'Format teks ringkas berupa objek dan array untuk menukar data antar sistem.'],
        ['Authentication', 'Proses memastikan identitas pengguna: siapa yang masuk.'],
        ['Authorization', 'Proses menentukan hak akses: apa yang boleh dilakukan setelah identitas terbukti.'],
        ['Transaksi (ACID)', 'Kumpulan operasi database yang berjalan utuh: Atomic, Consistent, Isolated, Durable.'],
        ['Monolith', 'Aplikasi satu proses berisi seluruh fitur, di-deploy sebagai satu kesatuan.'],
        ['Modular monolith', 'Satu proses dengan modul-modul berbatas tegas dan tanggung jawab jelas.'],
        ['Microservices', 'Arsitektur memecah aplikasi menjadi banyak service kecil yang merdeka dan berkomunikasi lewat jaringan.'],
        ['Distributed monolith', 'Service terpecah tetapi begitu saling tergantung sehingga kehilangan manfaat microservices.'],
        ['12-Factor App', 'Dua belas praktik menyusun aplikasi yang portabel, tangguh, dan siap skala horizontal.']
      ]
    }
  ],
  recap: [
    'Perjalanan satu request: DNS → TCP → TLS → pemrosesan server (route, middleware, handler, database) → respons; latency total adalah jumlah seluruh tahap.',
    'Kuasai method, status code, dan header sebelum menulis kode API; REST menuntut URL stabil, representasi JSON, dan komunikasi stateless.',
    'Authentication menjawab siapa kamu, authorization menjawab boleh apa kamu; keduanya diperiksa server, bukan tampilan.',
    'Monolith, modular monolith, dan microservices adalah pilihan biaya: makin terpecah makin besar manfaat isolasinya dan makin besar pula biaya operasionalnya.',
    'Microservices jangan diadopsi demi tren; distributed monolith dan biaya observability adalah dua jebakan paling mahal.',
    'Prinsip 12-Factor seperti config di environment, proses stateless, dan logs sebagai event stream adalah syarat dasar sebuah service layak dipecah.'
  ]
});
