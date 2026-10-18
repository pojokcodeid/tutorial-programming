/* ============================================================
   Pelajaran Contoh Project React JS — Bab 2: json-server sebagai Dummy Backend
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-json-server',
  title: 'json-server sebagai Dummy Backend',
  chapter: 'Fondasi',
  duration: '16 menit',
  intro: [
    'Frontend yang serius butuh lawan bicara: ada login, ada data yang diambil dan disimpan. Untuk berlatih, kamu tidak perlu langsung menulis backend sungguhan — <b>json-server</b> mengubah satu file <code>db.json</code> menjadi REST API lengkap dalam hitungan detik.',
    'Tetapi json-server tidak tahu apa-apa soal login. Karena itu pelajaran ini juga menulis <code>server.js</code>: endpoint login, penerbitan access & refresh token, dan middleware yang menolak request ilegal. Hasilnya dummy backend yang perilakunya menyerupai backend sungguhan.'
  ],
  objectives: [
    'Memahami apa yang diberikan json-server secara gratis (CRUD dari file JSON)',
    'Menyusun db.json dengan koleksi users, products, dan refreshTokens',
    'Menjalankan json-server secara mandiri maupun programatik lewat server.js',
    'Menambahkan endpoint auth (register, login, refresh, logout, me) di atas json-server',
    'Membaca isi header Authorization dan memverifikasi JWT di middleware',
    'Menerapkan aturan otorisasi: admin, pemilik data, dan penolakan akses publik'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu json-server?</h3><p><b>json-server</b> membaca file JSON lalu menyajikannya sebagai REST API. Setiap kunci di file itu menjadi koleksi dengan route lengkap: <code>GET</code>, <code>POST</code>, <code>GET /:id</code>, <code>PATCH /:id</code>, dan <code>DELETE /:id</code> — tanpa satu baris pun kode backend. Ia juga paham filter (<code>?category=Minuman</code>), pengurutan, dan pagination.</p><p>Karena datanya cuma file teks, kamu bebas merusak dan memulihkannya: hapus <code>db.json</code>, jalankan ulang, selesai. Cocok sekali untuk mengembangkan frontend.</p>'
    },
    {
      type: 'example',
      title: 'db.json — isi dummy backend',
      lang: 'json',
      output: false,
      code: `{
  "users": [
    { "id": "1", "name": "Admin Toko", "username": "admin",
      "password": "ea2143…:8db855…", "role": "admin" },
    { "id": "2", "name": "Budi Santoso", "username": "budi",
      "password": "a56353…:730456…", "role": "user" }
  ],
  "products": [
    { "id": "1", "name": "Kopi Arabika Gayo 250g", "category": "Minuman",
      "price": 68000, "stock": 24, "createdBy": "1" },
    { "id": "2", "name": "Teh Melati Celup 25s", "category": "Minuman",
      "price": 12500, "stock": 60, "createdBy": "1" }
  ],
  "refreshTokens": []
}`,
      explain: [
        'Nilai <code>password</code> bukan teks biasa melainkan hash scrypt berformat <code>salt:hash</code> (ditulis terpotong di atas). Hash baru bisa dibuat dengan <code>scryptSync</code> bawaan Node — tanpa library tambahan.',
        'Field <code>createdBy</code> mencatat pemilik produk; field inilah yang nanti dipakai menentukan boleh tidaknya user mengubah sebuah produk.',
        'Koleksi <code>refreshTokens</code> awalnya kosong dan diisi otomatis setiap user login.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mencoba json-server apa adanya</h3><p>Sebelum menyentuh kode, rasakan dulu kemudahannya. Cukup perintah berikut (port default 3000), lalu sapa lewat browser atau curl:</p>'
    },
    {
      type: 'example',
      title: 'CRUD gratis dari satu file',
      lang: 'bash',
      output: false,
      code: `npx json-server db.json

# baca semua produk
curl http://localhost:3000/products

# baca satu produk
curl http://localhost:3000/products/1

# filter & pagination
curl "http://localhost:3000/products?category=Minuman"
curl "http://localhost:3000/products?_page=1&_limit=5"

# tambah (id dibuat otomatis)
curl -X POST http://localhost:3000/products \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Sambal Baru","category":"Makanan","price":20000,"stock":4}'`,
      explain: [
        'Satu perintah <code>npx json-server db.json</code> sudah menghasilkan seluruh route di tabel REST.',
        'Perhatikan semua route di atas terbuka untuk siapa pun — tidak ada login, tidak ada peran. Inilah keterbatasan yang kita tutup di bagian berikutnya.',
        'Saat dipakai bersama React, port 3000 itu kita ganti menjadi 3001 agar tidak bentrok dengan kebiasaan dan tetap jelas mana frontend, mana backend.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Naik level: json-server programatik</h3><p>Agar bisa menambahkan login, kita menjalankan json-server <b>di dalam kode Node sendiri</b>. Perhatikan bahwa <code>type: "module"</code> di package.json membuat berkas ini memakai <code>import</code>, dan <code>router(\'db.json\')</code> memberi kita akses ke isi database lewat <code>api.db</code> — untuk menyimpan refresh token, misalnya.</p>'
    },
    {
      type: 'example',
      title: 'server.js — konfigurasi & hash password',
      lang: 'js',
      output: false,
      code: `import jsonServer from 'json-server';
import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const { create, defaults, router, bodyParser } = jsonServer;

const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || 'rahasia-contoh-ganti-di-produksi';
const ACCESS_TTL = process.env.ACCESS_TTL || '1m';    // sengaja pendek agar mudah diamati
const REFRESH_TTL = process.env.REFRESH_TTL || '7d';

const server = create();
const api = router('db.json');   // CRUD otomatis untuk users, products, dll.
const db = api.db;               // akses isi db.json (lowdb) dari kode kita

server.use(defaults());          // CORS, logger, kompresi
server.use(bodyParser);          // baca body JSON (tidak ikut di defaults())

function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  return \`\${salt}:\${scryptSync(plain, salt, 64).toString('hex')}\`;
}

function checkPassword(plain, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(plain, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}`,
      explain: [
        '<code>defaults()</code> sudah menyalakan CORS sehingga frontend di port 5173 boleh memanggil port 3001; <code>bodyParser</code> tidak ikut di dalamnya, jadi dipasang terpisah agar <code>req.body</code> tersedia.',
        'Garam acak (<code>salt</code>) membuat dua password sama menghasilkan hash berbeda, sehingga daftar hash tidak bisa dibobol massal.',
        '<code>timingSafeEqual</code> membandingkan hash tanpa membocorkan petunjuk lewat perbedaan waktu — kebiasaan baik saat memverifikasi kredensial.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Endpoint login & penerbitan token</h3><p>Setelah password cocok, server menerbitkan dua token sekaligus: <b>access token</b> (berisi identitas & peran, hidup sebentar) dan <b>refresh token</b> (hanya untuk memperpanjang sesi, hidup lama). Refresh token dicatat ke db.json agar bisa dicabut kapan saja.</p>'
    },
    {
      type: 'example',
      title: 'issueTokens: access + refresh token',
      lang: 'js',
      output: false,
      code: `function issueTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, username: user.username, role: user.role, type: 'access' },
    SECRET,
    { expiresIn: ACCESS_TTL }
  );
  const refreshToken = jwt.sign(
    // jti (id unik) membuat token berbeda walau terbit di detik yang sama
    { sub: user.id, type: 'refresh', jti: randomBytes(8).toString('hex') },
    SECRET,
    { expiresIn: REFRESH_TTL }
  );
  // refresh token dicatat di db agar bisa dicabut (logout / rotasi)
  db.get('refreshTokens').push({
    token: refreshToken,
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  }).write();
  return { accessToken, refreshToken };
}

server.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.get('users').find({ username }).value();
  if (!user || !checkPassword(String(password), user.password)) {
    return res.status(401).json({ message: 'Username atau password salah' });
  }
  res.json({ ...issueTokens(user), user: publicUser(user) });
});`,
      explain: [
        'Klaim <code>sub</code> (subject) berisi id user, <code>role</code> berisi perannya, dan <code>type</code> mencegah refresh token disalahgunakan sebagai access token.',
        'Pesan gagal login sengaja seragam — "username atau password salah" — agar penyerang tidak bisa menebak daftar username yang valid.',
        '<code>publicUser()</code> membuang field password sebelum data user dikirim ke klien.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Middleware: gerbang setiap request</h3><p>Middleware adalah fungsi yang dijalankan Express <b>sebelum</b> request sampai ke route. Di sinilah token dibaca dari header <code>Authorization: Bearer &lt;token&gt;</code>, diverifikasi, lalu hasilnya dititipkan ke <code>req.user</code> agar route lain tinggal memakai.</p>'
    },
    {
      type: 'example',
      title: 'authenticate & requireRole',
      lang: 'js',
      output: false,
      code: `function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Access token tidak ditemukan' });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.type !== 'access') throw new Error('bukan access token');
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();                            // lolos → teruskan ke route
  } catch {
    res.status(401).json({ message: 'Access token tidak valid atau kedaluwarsa' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak: peran Anda tidak mencukupi' });
    }
    next();
  };
}`,
      explain: [
        '<code>401</code> berarti "kamu belum/tidak terbukti siapa" — token hilang, salah, atau kedaluwarsa. <code>403</code> berarti "kamu sudah dikenali, tetapi tidak diizinkan" — peran atau kepemilikan tidak cukup.',
        'Karena <code>jwt.verify</code> memeriksa tanda tangan dengan SECRET, tidak ada pihak yang bisa mengubah isi token tanpa ketahuan.',
        '<code>requireRole(\'admin\')</code> mengembalikan middleware baru — pola ini membuat peran bisa dideklarasikan per route.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menutup celah CRUD bebas</h3><p>json-server membuat <code>POST /products</code> bisa dipanggil siapa pun. Satu middleware di depan router menutup celah itu: daftar refresh token disembunyikan, data user hanya untuk admin, dan tulis/hapus produk wajib login plus aturan kepemilikan.</p>'
    },
    {
      type: 'example',
      title: 'Aturan akses resource (ringkasan middleware)',
      lang: 'text',
      output: false,
      code: `GET    /products            publik       — baca boleh siapa pun
POST   /products            login        — pemilik (createdBy) diisi dari token
PATCH  /products/:id        login        — admin atau pemilik produk
DELETE /products/:id        login        — admin atau pemilik produk

GET    /users               admin        — daftar semua user
DELETE /users/:id           admin        — hapus user
POST   /users               ditolak 403  — daftar lewat /auth/register

GET    /refreshTokens       ditolak 404  — data internal, jangan terekspos
POST   /auth/login          publik       — satu-satunya jalan masuk
POST   /auth/refresh        publik+token — butuh refresh token yang sah`,
      explain: [
        'Pola "baca publik, tulis butuh login, kelola butuh admin" adalah bentuk paling umum dari otorisasi berbasis peran.',
        'Menyembunyikan <code>/refreshTokens</code> dengan 404 (bukan 403) membuat keberadaan koleksi itu tidak terbaca publik.',
        'Id produk diambil dari URL dengan <code>req.path.split(\'/\')[2]</code> lalu dicocokkan dengan <code>createdBy</code> milik pemanggil.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji dengan curl (buka terminal kedua)',
      lang: 'bash',
      output: false,
      code: `# 1. login sebagai admin → ambil token
curl -s -X POST http://localhost:3001/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"admin","password":"admin123"}'

# 2. baca produk dengan token (ganti TOKEN dengan hasil langkah 1)
curl http://localhost:3001/auth/me -H "Authorization: Bearer TOKEN"

# 3. tulis produk tanpa token → 401
curl -X POST http://localhost:3001/products \\
  -H 'Content-Type: application/json' -d '{"name":"x"}'

# 4. tukar refresh token (rotasi) → sepasang token baru
curl -X POST http://localhost:3001/auth/refresh \\
  -H 'Content-Type: application/json' -d '{"refreshToken":"REFRESH_TOKEN"}'`,
      explain: [
        'Langkah 3 adalah pengujian negatif yang wajib ada: bukti bahwa aturan benar-benar menolak, bukan sekadar asumsi.',
        'Respons login memuat ketiganya: <code>accessToken</code>, <code>refreshToken</code>, dan <code>user</code> — persis yang dibutuhkan AuthContext di pelajaran 4.'
      ]
    },
    {
      type: 'warn',
      title: 'Ini dummy backend, bukan backend produksi',
      text: 'json-server menyimpan data sebagai file teks tanpa kunci transaksi, tanpa HTTPS, dan tanpa pembatasan jumlah percobaan login (rate limiting). Secret JWT di proyek ini pun ditulis sebagai nilai bawaan. Perlakukan seluruh <code>server.js</code> sebagai <b>alat belajar</b>: polanya (hash password, verifikasi token, middleware peran) bisa dipindahkan ke backend sungguhan, tetapi jangan segera dipakai melayani pengguna nyata.'
    },
    {
      type: 'tip',
      title: 'Reset data kapan saja',
      text: 'Karena semua data ada di <code>db.json</code>, mengembalikan kondisi awal cukup dengan menghapus baris yang tidak diinginkan (atau mengembalikannya lewat git) lalu menjalankan ulang <code>npm run server</code>. Untuk menambah akun uji sendiri, daftar lewat halaman Register — lebih mudah dan langsung teruji.'
    },
    {
      type: 'live',
      title: 'Latihan: simulasi REST API & gerbang token',
      lang: 'html',
      hint: 'Klik route untuk melihat responsnya. Ubah status "token" menjadi TANPA token, lalu klik route yang terproteksi untuk melihat penolakan 401.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi REST API</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
    .wrap { display: flex; gap: 16px; }
    .menu { background: #fff; border-radius: 10px; padding: 12px; min-width: 260px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .route { padding: 8px; margin-bottom: 6px; border-radius: 6px; cursor: pointer; font-family: monospace; font-size: 13px; border: 1px solid #e5e7eb; }
    .route:hover { background: #eef2ff; }
    .m-get { color: #0a7d32; } .m-post { color: #1677ff; } .m-del { color: #cf1322; }
    .panel { flex: 1; }
    .bar { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    pre { background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 10px; font-size: 13px; min-height: 180px; margin: 0; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .status-ok { color: #0a7d32; font-weight: 700; }
    .status-no { color: #cf1322; font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="menu" id="menu"></div>
    <div class="panel">
      <div class="bar">
        <label><input type="checkbox" id="token" checked> Saya punya token login</label>
        <span id="status" class="status-ok">siap</span>
      </div>
      <pre>Klik salah satu route di kiri…</pre>
    </div>
  </div>
  <script>
    const routes = [
      { m: 'GET',  p: '/products',        admin: false, out: [ { id:'1', name:'Kopi Arabika Gayo 250g', price:68000, stock:24 } ] },
      { m: 'POST', p: '/products',        admin: false, out: { name:'Produk Baru', id:'9x2' } },
      { m: 'DEL',  p: '/products/1',      admin: false, out: {} },
      { m: 'GET',  p: '/users',           admin: true,  out: [ { id:'1', username:'admin', role:'admin' } ] },
      { m: 'POST', p: '/auth/login',      admin: false, out: { accessToken:'eyJhbGci…', refreshToken:'eyJhbGci…' } }
    ];
    const menu = document.getElementById('menu');
    routes.forEach(r => {
      const d = document.createElement('div');
      d.className = 'route';
      d.innerHTML = '<span class="m-' + (r.m === 'DEL' ? 'del' : r.m.toLowerCase()) + '">' + r.m + '</span> ' + r.p + (r.admin ? ' &nbsp;<small>(admin)</small>' : '');
      d.onclick = () => {
        const punya = document.getElementById('token').checked;
        const status = document.getElementById('status');
        const out = document.querySelector('pre');
        // /auth/login tidak butuh token — itu justru pintu masuknya
        if (r.p !== '/auth/login' && !punya) {
          status.textContent = '401 Unauthorized';
          status.className = 'status-no';
          out.textContent = JSON.stringify({ message: 'Access token tidak ditemukan' }, null, 2);
          return;
        }
        status.textContent = '200 OK';
        status.className = 'status-ok';
        out.textContent = JSON.stringify(r.out, null, 2);
      };
      menu.appendChild(d);
    });
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['json-server', 'Alat yang mengubah file JSON menjadi REST API lengkap tanpa menulis kode backend.'],
        ['Dummy backend', 'Server tiruan untuk pengembangan frontend; menangani request nyata dengan data contoh.'],
        ['Middleware', 'Fungsi antrean yang dijalankan Express sebelum request mencapai route (memeriksa, mengubah, atau menolak).'],
        ['Klaim (claim)', 'Isi payload JWT, mis. sub (pemilik), role (peran), exp (waktu kedaluwarsa).'],
        ['Bearer token', 'Cara memakai token: header Authorization berisi "Bearer &lt;token&gt;".'],
        ['Rotasi refresh token', 'Menerbitkan refresh token baru setiap dipakai dan mencabut yang lama.'],
        ['scrypt', 'Algoritma hash password bawaan Node.js — lambat disengaja, sehingga brute-force mahal.'],
        ['401 vs 403', '401 = belum terbukti siapa; 403 = sudah dikenali tetapi tidak diizinkan.']
      ]
    }
  ],
  recap: [
    'json-server mengubah db.json menjadi REST API: GET, POST, PATCH, DELETE gratis dari satu file.',
    'Secara bawaan semua route terbuka — karena itu server.js menambahkan endpoint auth dan middleware.',
    'issueTokens() menerbitkan access token pendek (berisi peran) dan refresh token panjang (dicatat di db agar bisa dicabut).',
    'authenticate() membaca header Authorization dan memverifikasi tanda tangan JWT; requireRole() menambahkan syarat peran.',
    'Aturan proyek: baca produk publik, tulis/hapus butuh login + kepemilikan, kelola user hanya admin, refreshTokens ditutup rapat.',
    'Bedakan 401 (belum terbukti siapa) dan 403 (sudah dikenali tetapi tidak diizinkan).'
  ]
});
