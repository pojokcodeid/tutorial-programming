/* ============================================================
   Pelajaran Go REST API — Bab 1: Pengenalan & Arsitektur
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-pengenalan',
  title: 'Apa itu RESTful API & Rancangan Proyek',
  chapter: 'Pengenalan',
  duration: '10 menit',
  intro: [
    '<b>RESTful API</b> adalah cara membangun layanan web yang bisa dipanggil aplikasi lain lewat HTTP: browser, aplikasi mobile, atau service lain. Setiap data punya "alamat" (endpoint) dan diproses dengan method HTTP seperti GET, POST, PUT, dan DELETE.',
    'Pelajaran ini membedah REST dari sisi konsep, lalu merancang struktur proyek Go yang <b>modular</b> dan <b>scalable</b> — arsitektur layered yang dipakai seluruh materi berikutnya.'
  ],
  objectives: [
    'Memahami prinsip REST dan cara merancang resource',
    'Mengenal arsitektur layered: handler → service → repository',
    'Memahami peran tiap package dalam proyek Go yang modular',
    'Membedakan authentication dan authorization'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu REST?</h3><p><b>REST</b> (Representational State Transfer) adalah gaya arsitektur untuk API. Bukan framework atau library — melainkan sekumpulan aturan yang membuat API mudah diprediksi. Ciri utamanya:</p><ul><li><b>Stateless</b> — server tidak menyimpan sesi. Setiap request membawa identitasnya sendiri (dalam kasus kita: JWT).</li><li><b>Resource-oriented</b> — setiap data punya nama resource, mis. <code>/products</code>, <code>/users</code>.</li><li><b>Metode HTTP bermakna</b> — GET membaca, POST membuat, PUT mengubah, DELETE menghapus.</li></ul>'
    },
    {
      type: 'example',
      title: 'Peta Endpoint REST untuk aplikasi toko',
      lang: 'text',
      output: false,
      code: `GET    /api/v1/products      → ambil daftar produk
GET    /api/v1/products/12    → ambil produk id 12
POST   /api/v1/products       → buat produk baru
PUT    /api/v1/products/12    → ubah produk id 12
DELETE /api/v1/products/12    → hapus produk id 12`,
      explain: [
        'Method HTTP menentukan <b>aksi</b>, path menentukan <b>resource mana</b>.',
        'Versi API (<code>/v1</code>) dipisah di path agar perubahan besar tidak merusak klien lama.',
        'Angka di ujung path adalah <b>id resource</b> (path parameter).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Status Code: Bahasa Respons HTTP</h3><p>API yang baik selalu mengirim status code yang tepat agar klien tahu apa yang terjadi tanpa membaca body respons:</p><ul><li><b>200</b> OK — sukses membaca/mengubah.</li><li><b>201</b> Created — resource baru berhasil dibuat.</li><li><b>204</b> No Content — sukses menghapus, tanpa body.</li><li><b>400</b> Bad Request — input tidak valid.</li><li><b>401</b> Unauthorized — belum login / token tidak valid.</li><li><b>403</b> Forbidden — sudah login tapi tidak berhak.</li><li><b>404</b> Not Found — resource tidak ada.</li><li><b>500</b> Internal Server Error — kegagalan di sisi server.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh respons JSON sukses & gagal',
      lang: 'json',
      output: false,
      code: `// Sukses (201 Created)
{
  "id": 1,
  "name": "Laptop Gaming",
  "price": 15000000,
  "stock": 3
}

// Gagal (400 Bad Request)
{
  "error": "validasi gagal: nama harus 3–100 karakter"
}`,
      explain: [
        'Respons sukses berisi data yang diminta dalam bentuk JSON.',
        'Respons gagal memakai field <code>error</code> berisi pesan yang bisa ditampilkan ke pengguna.',
        'Konsistensi bentuk respons membuat klien mudah memproses.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Arsitektur Layered (Bertingkat)</h3><p>Agar proyek tetap rapi saat tumbuh besar, tanggung jawab dipisah menjadi lapisan-lapisan. Setiap lapisan hanya bicara dengan lapisan di sebelahnya:</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Diagram arsitektur layered REST API">
        <rect x="180" y="20" width="400" height="52" rx="8" class="u-box"/>
        <text x="380" y="42" class="u-title" text-anchor="middle">HTTP Handler</text>
        <text x="380" y="60" class="u-lbl" text-anchor="middle">decode/encode JSON · status code · validasi input</text>
        <line x1="380" y1="72" x2="380" y2="102" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="180" y="106" width="400" height="52" rx="8" class="u-box"/>
        <text x="380" y="128" class="u-title" text-anchor="middle">Service</text>
        <text x="380" y="146" class="u-lbl" text-anchor="middle">logika bisnis · hash password · terbitkan JWT</text>
        <line x1="380" y1="158" x2="380" y2="188" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="180" y="192" width="400" height="52" rx="8" class="u-box"/>
        <text x="380" y="214" class="u-title" text-anchor="middle">Repository</text>
        <text x="380" y="232" class="u-lbl" text-anchor="middle">query SQL · prepared statement · mapping baris → struct</text>
        <line x1="380" y1="244" x2="380" y2="274" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="180" y="278" width="400" height="44" rx="8" class="u-hd"/>
        <text x="380" y="304" class="u-title" text-anchor="middle">MariaDB (database/sql)</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Alur request: handler menerima HTTP, service memutuskan logika, repository bicara dengan database</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Aturan main arsitektur ini:</p><ul><li><b>Handler</b> tidak tahu-menahu soal SQL. Ia hanya menerjemahkan HTTP ↔ data.</li><li><b>Service</b> tidak tahu soal HTTP. Ia menerima data mentah, memutuskan logika, dan mengembalikan hasil.</li><li><b>Repository</b> tidak tahu soal logika bisnis. Ia hanya "CRUD" data.</li></ul><p>Karena dependensi mengarah ke satu arah, tiap lapisan bisa diganti atau diuji secara terpisah.</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder proyek',
      lang: 'text',
      output: false,
      code: `go-restapi/
├── cmd/
│   ├── server/main.go      # titik masuk: wiring & start server
│   └── seed/main.go        # menanam data awal (admin)
├── internal/
│   ├── config/             # baca konfigurasi dari env / .env
│   ├── database/           # koneksi & connection pool MariaDB
│   ├── model/              # struct entitas + validasi
│   ├── repository/         # akses data (SQL)
│   ├── service/            # logika bisnis (auth, produk)
│   ├── handler/            # lapisan HTTP
│   ├── middleware/         # logging, JWT, role check
│   └── router/             # registrasi semua route
├── migrations/             # file SQL skema database
├── .env.example            # contoh konfigurasi
└── go.mod`,
      explain: [
        '<code>cmd/</code> berisi executable — tiap subfolder adalah satu program.',
        '<code>internal/</code> adalah package privat: tidak bisa di-import package luar (konvensi Go untuk menyembunyikan detail implementasi).',
        'Pemisahan per lapisan membuat mudah menambah fitur: cukup tambah file di lapisan yang tepat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Authentication vs Authorization</h3><p>Dua istilah ini sering tertukar padahal berbeda:</p><ul><li><b>Authentication (Autentikasi)</b> = "kamu siapa?" — dibuktikan lewat login, hasilnya berupa token.</li><li><b>Authorization (Otorisasi)</b> = "kamu boleh apa?" — dicek dari peran yang kamu miliki (mis. admin boleh menghapus, user biasa tidak).</li></ul>'
    },
    {
      type: 'example',
      title: 'Alur login → token → akses terproteksi',
      lang: 'text',
      output: false,
      code: `1. Klien POST /auth/login {username, password}
2. Service verifikasi password (bcrypt) → terbitkan JWT
3. Server balikkan token ke klien
4. Klien menyimpan token, menyertakannya di header tiap request:
      Authorization: Bearer <token>
5. Middleware memverifikasi token → meloloskan atau menolak (401)
6. RequireRole memeriksa peran → admin lolos, user ditolak (403)`,
      explain: [
        'Token menggantikan sesi di server → server tetap <b>stateless</b>.',
        'Pemeriksaan dilakukan di <b>middleware</b> sebelum request sampai ke handler.',
        'Karena itu, route yang butuh proteksi cukup dibungkus middleware yang sama.'
      ]
    },
    {
      type: 'tip',
      title: 'Mengapa net/http standar?',
      text: 'Go 1.22+ sudah mendukung <code>mux.HandleFunc("GET /products/{id}", ...)</code> di <code>net/http</code> — routing lengkap tanpa framework. Proyek contoh ini memakai standar library agar konsep terlihat jelas, tapi pola yang sama berlaku untuk Gin/Echo.'
    },
    {
      type: 'vocab',
      items: [
        ['REST', 'Gaya arsitektur API berbasis resource + metode HTTP, stateless.'],
        ['Endpoint', 'Kombinasi method + path yang bisa dipanggil klien, mis. POST /api/v1/products.'],
        ['Stateless', 'Server tidak menyimpan sesi; identitas dibawa tiap request.'],
        ['Layered architecture', 'Pemisahan tanggung jawab menjadi handler, service, repository.'],
        ['JWT', 'Token berisi klaim yang ditandatangani server, dipakai autentikasi stateless.'],
        ['Authentication', 'Proses memverifikasi identitas ("kamu siapa?").'],
        ['Authorization', 'Proses memverifikasi hak akses ("kamu boleh apa?").']
      ]
    }
  ],
  recap: [
    'REST memakai resource + method HTTP; response memakai status code yang bermakna.',
    'Arsitektur layered memisah handler (HTTP), service (logika), repository (SQL).',
    'Struktur folder modular: cmd/ untuk executable, internal/ untuk detail implementasi.',
    'Authentication membuktikan identitas (JWT), authorization menentukan hak akses (peran).'
  ]
});
