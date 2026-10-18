/* ============================================================
   Pelajaran Contoh Project React JS — Bab 1: Pengenalan & Setup Proyek
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-setup',
  title: 'Pengenalan & Setup Proyek',
  chapter: 'Fondasi',
  duration: '14 menit',
  intro: [
    'Selama materi React kamu sudah belajar potongan-potongan: komponen, hooks, routing, context. Sekarang kita <b>merangkainya menjadi satu proyek nyata</b>: <b>Dashboard Toko</b> — aplikasi manajemen produk dengan login, proteksi halaman, dan halaman khusus admin.',
    'Pelajaran ini menyiapkan kerangka proyek: memilih teknologi, menyusun struktur folder, dan menjalankan frontend React + backend dummy (json-server) berdampingan. Pelajaran berikutnya mengisi tiap bagiannya — dari custom component hingga refresh token otomatis.'
  ],
  objectives: [
    'Memahami fitur apa saja yang akan dibangun dan bagaimana potongannya saling terhubung',
    'Mengetahui peran setiap library: Vite, Ant Design, React Router DOM, Axios, json-server, dan JWT',
    'Menyusun struktur folder proyek React yang rapi dan terukur',
    'Menyiapkan file dasar: package.json, vite.config.js, index.html, dan main.jsx',
    'Menjalankan backend dummy dan frontend secara bersamaan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang akan kita bangun?</h3><p>Proyek ini bernama <b>Dashboard Toko</b>. Ia menyimpan data produk sederhana (nama, kategori, harga, stok) dan punya dua peran pengguna: <b>admin</b> yang mengelola semua data dan user, serta <b>user biasa</b> yang hanya boleh mengurus produk miliknya sendiri.</p><p>Daftar fitur yang akan jadi, dan topik materi tempat fitur itu diajarkan:</p>'
    },
    {
      type: 'example',
      title: 'Daftar fitur proyek',
      lang: 'text',
      output: false,
      code: `Halaman & rute
  /login, /register      → form masuk & daftar akun
  /                      → dashboard (statistik produk)
  /products              → tabel produk + tambah/ubah/hapus
  /products/new          → form produk baru
  /products/:id/edit     → form ubah produk (rute dinamis)
  /users                 → manajemen user (khusus admin)
  *                      → halaman 404

Keamanan
  Authentication        → login, token disimpan, sesi dipulihkan
  Authorization         → RoleGate: /users hanya untuk admin
  Access token          → 1 menit, dipasang otomatis oleh axios
  Refresh token         → 7 hari, diputar (rotasi) saat dipakai

Teknologi
  React 19 + Vite       → UI & alat build super cepat
  Ant Design (antd)     → component library siap pakai
  React Router DOM      → routing SPA
  Axios                 → HTTP client + interceptor
  json-server           → dummy backend REST di db.json
  JWT                   → access & refresh token`,
      explain: [
        'Setiap baris "Keamanan" adalah materi tersendiri di pelajaran 5–8, bukan sekadar tambahan.',
        'Perhatikan rute <code>/products/:id/edit</code> — titik dua menandai parameter dinamis.',
        'Dua peran pengguna membuat demonstrasi otorisasi jadi nyata, bukan sekadar teori.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kenapa library-nya itu?</h3><p>Setiap pilihan di bawah ini punya alasan jelas. React dan Vite tidak perlu diragukan lagi; sisanya adalah standar de facto di dunia kerja React:</p>'
    },
    {
      type: 'example',
      title: 'Peran setiap library dalam proyek',
      lang: 'text',
      output: false,
      code: `Vite              build & dev server; start dalam hitungan detik
Ant Design        komponen UI (Form, Table, Modal, Tag, dll) + ikon
React Router DOM  navigasi antar halaman tanpa reload
Axios             HTTP client; dipakai untuk interceptor token
json-server       REST API palsu dari file db.json — tanpa menulis backend
jsonwebtoken      menerbitkan & memverifikasi JWT di server.js`,
      explain: [
        'Ant Design dipilih karena dokumentasinya lengkap dan komponennya siap pakai — kita fokus ke logika React, bukan menggambar tombol dari nol.',
        'json-server membuat kamu bisa berlatih sisi klien hari ini juga, tanpa harus menguasai framework backend dulu.',
        'Axios dipilih dari fetch karena interceptor-nya memudahkan pemasangan dan pemutaran token.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Diagram arsitektur aplikasi: React memanggil axios lalu server json-server dengan JWT, yang membaca db.json">
        <defs><marker id="mk-rp-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="20" y="40" width="180" height="90" rx="8" class="u-hd"/>
        <text x="110" y="70" class="u-title" text-anchor="middle">React (Vite :5173)</text>
        <text x="110" y="94" class="u-lbl" text-anchor="middle">halaman + custom component</text>
        <text x="110" y="112" class="u-lbl" text-anchor="middle">AuthContext + axios</text>
        <line x1="204" y1="85" x2="263" y2="85" class="u-line" marker-end="url(#mk-rp-1)"/>
        <text x="234" y="70" class="u-lbl" text-anchor="middle">HTTP + JSON</text>
        <rect x="267" y="40" width="200" height="90" rx="8" class="u-box"/>
        <text x="367" y="70" class="u-title" text-anchor="middle">server.js (:3001)</text>
        <text x="367" y="94" class="u-lbl" text-anchor="middle">json-server (CRUD)</text>
        <text x="367" y="112" class="u-lbl" text-anchor="middle">JWT: login, refresh, proteksi</text>
        <line x1="471" y1="85" x2="530" y2="85" class="u-line" marker-end="url(#mk-rp-1)"/>
        <rect x="534" y="52" width="150" height="66" rx="8" class="u-box"/>
        <text x="609" y="80" class="u-title" text-anchor="middle">db.json</text>
        <text x="609" y="100" class="u-lbl" text-anchor="middle">users, products</text>
        <line x1="367" y1="134" x2="367" y2="182" class="u-line"/>
        <line x1="365" y1="182" x2="112" y2="182" class="u-line"/>
        <line x1="110" y1="182" x2="110" y2="136" class="u-line" marker-end="url(#mk-rp-1)"/>
        <text x="240" y="204" class="u-lbl" text-anchor="middle">respons JSON: data, access token, refresh token</text>
        <rect x="267" y="238" width="417" height="46" rx="8" class="u-box"/>
        <text x="475" y="266" class="u-lbl" text-anchor="middle">Interceptor axios: pasang token saat kirim, perbarui saat 401</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Arsitektur Dashboard Toko: frontend React berbicara dengan dummy backend lewat HTTP + JSON</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Struktur Folder</h3><p>Proyek React bebas ditata, tetapi pola di bawah ini sangat umum dan mudah dipindahkan ke proyek lain: <code>api</code> untuk komunikasi HTTP, <code>auth</code> untuk logika login, <code>components</code> untuk komponen kustom, dan <code>pages</code> untuk satu halaman satu berkas.</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder proyek',
      lang: 'text',
      output: false,
      code: `react-project/
├── db.json                # data dummy: users, products, refreshTokens
├── server.js              # json-server + endpoint auth JWT
├── vite.config.js
├── package.json
├── index.html             # shell halaman untuk Vite
└── src/
    ├── main.jsx           # gerbang masuk React
    ├── App.jsx            # peta rute seluruh aplikasi
    ├── styles.css
    ├── api/
    │   ├── client.js      # axios + interceptor refresh token
    │   ├── authApi.js     # login / register / me / logout
    │   ├── productApi.js  # CRUD produk
    │   └── userApi.js     # daftar & hapus user (admin)
    ├── auth/
    │   ├── token.js       # simpan & hapus token di localStorage
    │   └── AuthContext.jsx# Context API: user, login, logout
    ├── components/        # komponen kustom buatan sendiri
    │   ├── AppShell.jsx   # layout sidebar + header
    │   ├── PageHeader.jsx
    │   ├── StatCard.jsx
    │   ├── ProductTable.jsx
    │   ├── ProtectedRoute.jsx
    │   └── RoleGate.jsx
    └── pages/             # satu halaman satu berkas
        ├── Login.jsx  ├── Register.jsx  ├── Dashboard.jsx
        ├── Products.jsx  ├── ProductForm.jsx
        ├── Users.jsx     └── NotFound.jsx`,
      explain: [
        'Pemisahan <code>api</code> membuat halaman tidak perlu tahu alamat backend — cukup memanggil <code>productApi.list()</code>.',
        'Komponen di <code>components</code> dipakai ulang lintas halaman; komponen di <code>pages</code> mewakili satu rute.',
        'Logika token dipisah di <code>auth/token.js</code> agar bisa dipakai axios (di luar React) maupun AuthContext.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 1 — Siapkan proyek & dependensi</h3><p>Karena semua berkas proyek dibahas di materi ini, kita tidak memakai generator yang menyembunyikan isinya. Cukup buat folder, tulis <code>package.json</code> berikut, lalu pasang dependensinya.</p>'
    },
    {
      type: 'example',
      title: 'package.json',
      lang: 'json',
      output: false,
      code: `{
  "name": "contoh-project-react",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "server": "node server.js",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "^6.3.4",
    "antd": "^6.6.6",
    "axios": "^1.20.0",
    "jsonwebtoken": "^9.0.3",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "react-router-dom": "^7.18.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.1.2",
    "json-server": "^0.17.4",
    "vite": "^8.3.4"
  }
}`,
      explain: [
        '<code>"type": "module"</code> membuat semua berkas .js memakai sintaks ESM (<code>import</code>) — termasuk server.js.',
        'json-server sengaja dipasang di versi 0.17.x karena versi itulah yang mendukung pemakaian programatik lewat <code>router()</code> yang kita butuhkan di server.js.',
        'Ant Design dan ikonnya dipasang sebagai pasangan: <code>@ant-design/icons</code> v6 hanya kompatibel dengan antd v6.'
      ]
    },
    {
      type: 'example',
      title: 'vite.config.js — konfigurasi build',
      lang: 'js',
      output: false,
      code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});`,
      explain: [
        'Plugin React menangani kompilasi JSX dan Fast Refresh (hot reload) untuk kita.',
        'Port 5173 adalah alamat frontend; backend dummy nanti berjalan di port 3001 — keduanya sengaja berbeda.'
      ]
    },
    {
      type: 'example',
      title: 'index.html & src/main.jsx — gerbang aplikasi',
      lang: 'jsx',
      output: false,
      code: `<!-- index.html (di root proyek) -->
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard Toko — Contoh Project React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={idID}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);`,
      explain: [
        'Komponen dibungkus berlapis: <code>ConfigProvider</code> (locale Indonesia) → <code>AntApp</code> (konteks notifikasi Ant Design) → <code>BrowserRouter</code> (routing) → <code>AuthProvider</code> (sesi login).',
        '<code>&lt;App&gt;</code> dari Ant Design membuat fitur seperti <code>message</code> dan <code>Modal</code> mengikuti tema dan bahasa — inilah gaya modern yang disarankan dokumentasi antd.',
        '<code>AuthProvider</code> sengaja diletakkan <i>di dalam</i> BrowserRouter agar hook routing bisa dipakai di dalamnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 2 — Jalankan dua proses</h3><p>Aplikasi ini terdiri dari dua proses yang berjalan berdampingan: <b>backend dummy</b> (node server.js) dan <b>frontend</b> (vite). Siapkan dua terminal di folder proyek.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan proyek',
      lang: 'bash',
      output: false,
      code: `npm install

# terminal 1 — backend dummy
npm run server        # JSON Server + JWT berjalan di http://localhost:3001

# terminal 2 — frontend React
npm run dev           # Vite berjalan di http://localhost:5173

# buka http://localhost:5173 — login dengan admin / admin123`,
      explain: [
        'Jika lupa menyalakan salah satu, halaman tetap terbuka tetapi muncul pesan "Gagal memuat" — itulah tanda frontend tidak menemukan backend.',
        'Urutan tidak berpengaruh; Vite dan server.js tidak saling menunggu.'
      ]
    },
    {
      type: 'warn',
      title: 'Rahasia tidak boleh ditebak dari sisi klien',
      text: 'Semua kode di folder <code>src/</code> dikirim ke browser dalam bentuk yang bisa dibaca siapa pun. Karena itu <b>tidak ada satu pun keputusan keamanan yang boleh ditentukan frontend</b> — peran admin, kepemilikan produk, dan status token semuanya diverifikasi oleh server.js. Materi pelajaran 5–7 akan menegaskan hal ini berulang kali.'
    },
    {
      type: 'live',
      title: 'Latihan: telusuri struktur proyek',
      lang: 'html',
      hint: 'Klik nama folder/berkas di pohon untuk melihat tugasnya. Ubah juga teks penjelasan bawaan salah satu berkas untuk memastikan kamu memahaminya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Telusuri Struktur Proyek</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
    .wrap { display: flex; gap: 16px; }
    .tree { background: #fff; border-radius: 10px; padding: 12px; min-width: 230px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .node { padding: 6px 8px; border-radius: 6px; cursor: pointer; font-family: monospace; font-size: 13px; }
    .node:hover { background: #eef2ff; }
    .node.on { background: #1677ff; color: #fff; }
    .panel { background: #fff; border-radius: 10px; padding: 16px; flex: 1; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    h3 { margin: 0 0 8px; color: #1677ff; font-family: monospace; }
    p { margin: 0; line-height: 1.6; }
    .hint { color: #888; font-size: 12px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="tree" id="tree"></div>
    <div class="panel">
      <h3 id="nama">src/</h3>
      <p id="jelas">Klik salah satu berkas di kiri untuk melihat tugasnya.</p>
      <div class="hint">Semua berkas ini akan kita bahas pelan-pelan di pelajaran berikutnya.</div>
    </div>
  </div>
  <script>
    const info = {
      'src/': 'Folder kode React — satu-satunya yang dikirim ke browser.',
      'src/main.jsx': 'Gerbang aplikasi: memasang React, routing, locale, dan AuthProvider.',
      'src/App.jsx': 'Peta rute: mana halaman publik, mana yang wajib login.',
      'src/api/client.js': 'Instance axios + interceptor pemasang dan pemutar token.',
      'src/auth/token.js': 'Membaca dan menulis token di localStorage.',
      'src/auth/AuthContext.jsx': 'Context API: satu sumber kebenaran data login.',
      'src/components/': 'Komponen kustom buatan sendiri, dipakai lintas halaman.',
      'src/components/ProtectedRoute.jsx': 'Penjaga rute: hanya user login yang boleh lewat.',
      'src/components/RoleGate.jsx': 'Penjaga peran: halaman admin vs halaman semua user.',
      'src/pages/': 'Satu halaman satu berkas, sesuai rutenya.',
      'server.js': 'json-server + endpoint auth JWT (login, refresh, logout).',
      'db.json': 'Isi database dummy: users, products, refreshTokens.'
    };
    const daftar = Object.keys(info);
    const tree = document.getElementById('tree');
    daftar.forEach((nama, i) => {
      const d = document.createElement('div');
      d.className = 'node' + (i === 0 ? ' on' : '');
      d.textContent = nama;
      d.onclick = () => {
        document.querySelectorAll('.node').forEach(n => n.classList.remove('on'));
        d.classList.add('on');
        document.getElementById('nama').textContent = nama;
        document.getElementById('jelas').textContent = info[nama];
      };
      tree.appendChild(d);
    });
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Vite', 'Alat build & dev server modern untuk proyek frontend; start dan hot reload sangat cepat.'],
        ['Dummy backend', 'Server palsu untuk pengembangan: merespons request nyata dengan data contoh.'],
        ['json-server', 'Mengubah file JSON menjadi REST API lengkap (GET, POST, PATCH, DELETE) tanpa menulis kode backend.'],
        ['JWT', 'JSON Web Token — string berisi klaim (data) yang ditandatangani server, dipakai sebagai bukti login.'],
        ['Rotasi token', 'Menerbitkan token baru setiap kali refresh token dipakai, sehingga token lama langsung dicabut.'],
        ['Interceptor', 'Fungsi yang dijalankan axios sebelum request dikirim / sesudah respons diterima.'],
        ['Shell halaman', 'Dokumen HTML minim (root + script) yang menjadi tempat React menggantungkan seluruh UI.']
      ]
    }
  ],
  recap: [
    'Proyek Dashboard Toko memuat semua topik materi ini dalam satu aplikasi nyata.',
    'Peran library: Vite (build), Ant Design (UI), React Router (navigasi), Axios (HTTP), json-server (dummy backend), JWT (token).',
    'Struktur folder: api/ untuk HTTP, auth/ untuk sesi, components/ untuk komponen kustom, pages/ untuk halaman.',
    'File gerbang aplikasi adalah index.html → src/main.jsx, tempat semua provider dipasang berlapis.',
    'Proyek berjalan sebagai dua proses: npm run server (port 3001) dan npm run dev (port 5173).',
    'Frontend tidak pernah boleh menjadi sumber keputusan keamanan — semua diverifikasi server.'
  ]
});
