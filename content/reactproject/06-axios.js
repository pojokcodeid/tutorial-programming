/* ============================================================
   Pelajaran Contoh Project React JS — Bab 6: Axios: Instance, Interceptor & CRUD
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-axios',
  title: 'Axios: Instance, Interceptor & CRUD',
  chapter: 'State & HTTP',
  duration: '14 menit',
  intro: [
    'Setiap halaman butuh data dari backend: Dashboard memuat ringkasan produk, halaman Produk menambah dan menghapus data, form login mengirim kredensial. Kalau tiap komponen menulis <code>fetch</code>-nya sendiri, alamat server, header Authorization, dan penanganan error jadi seragam-ragam — satu komponen yang lupa memasang token langsung menghasilkan bug 401 misterius.',
    'Solusinya: <b>axios dengan satu instance pusat</b> di <code>src/api/client.js</code>, lalu dilapisi modul API per domain — <code>authApi</code>, <code>productApi</code>, <code>userApi</code>. Pelajaran ini membahas caranya dari pembuatan instance, interceptor request, sampai pola CRUD yang dipanggil halaman.'
  ],
  objectives: [
    'Membuat instance axios dengan baseURL sekali di satu berkas',
    'Memahami keunggulan axios dibanding fetch (response.data otomatis, error berstatus)',
    'Memasang interceptor request untuk menyisipkan header Authorization',
    'Menangani error respons secara terpusat lewat interceptor response',
    'Menyusun lapisan modul API dengan pola satu function satu endpoint',
    'Memanggil API dari halaman dengan pola loading, pesan error, dan notifikasi Ant Design'
  ],
  sections: [
    {
      type: 'text',
      html: `<h3>Kenapa axios, dan kenapa satu instance?</h3><p>Ada dua kandidat HTTP client: <code>fetch</code> bawaan browser dan <b>axios</b>. Fetch juga bisa, tapi serba manual — setiap kali harus <code>await res.json()</code>, respons 404/500 tetap dianggap "berhasil" (yang ditolak hanya gangguan jaringan), dan soal header atau token diserahkan sepenuhnya ke kamu. Axios menyelesaikan ketiganya: <code>response.data</code> langsung berupa objek, kegagalan status memunculkan error berstatus, dan ada titik khusus untuk memasang header bernama <b>interceptor</b>.</p><p>Semua request di proyek ini keluar dari satu instance di <code>src/api/client.js</code>:</p><p><code>export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';</code></p><p><code>const api = axios.create({ baseURL: BASE_URL });</code></p><p>Nilai <code>VITE_API_URL</code> dibaca dari file <code>.env</code> di root proyek (hanya variabel berawalan <code>VITE_</code> yang diekspos Vite ke browser); bila kosong, fallback-nya adalah alamat json-server di port 3001. Berkat <code>baseURL</code>, pemanggil cukup menulis jalur relatif seperti <code>api.get('/products')</code> — alamat lengkap disusun oleh instance.</p>`
    },
    {
      type: 'example',
      title: 'src/api/client.js — interceptor REQUEST: sisipkan access token',
      lang: 'js',
      output: false,
      code: `import axios from 'axios';
import { tokenStore, announceSessionExpired } from '../auth/token.js';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: BASE_URL });

/* ---------- interceptor REQUEST: sisipkan access token ---------- */
api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});`,
      explain: [
        'Interceptor request dijalankan <b>setiap kali</b> request keluar dari instance ini — halaman tidak perlu repot menulis header apa pun.',
        'Syarat <code>!config.headers.Authorization</code> menjaga agar header yang sudah dipasang pemanggil tidak ditimpa sembarangan.',
        'Saat user belum login atau baru logout, <code>tokenStore.access</code> kosong — request tetap dikirim tanpa header, jadi endpoint publik seperti /auth/login tetap jalan.',
        'tokenStore diimpor dari auth/token.js yang tidak memakai React, sehingga axios tetap bisa membacanya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Interceptor response: menangani error di satu tempat</h3><p>Selain request, axios juga bisa menyuntikkan logika setiap kali respons datang — termasuk saat gagal. Pola di proyek ini: respons sukses diteruskan apa adanya; respons gagal diperiksa dulu apakah layak dicoba refresh. Syaratnya: statusnya <code>401</code>, request ini <b>belum</b> pernah dicoba ulang (ditandai <code>original._retry</code>), dan endpoint-nya bukan termasuk daftar <code>TANPA_RETRY</code> — daftar endpoint auth seperti <code>/auth/login</code> yang tidak boleh memicu refresh (login salah password ya tetap ditolak, bukan di-refresh).</p><p>Kalau syarat terpenuhi, axios memanggil <code>/auth/refresh</code> lalu mengirim ulang request awal dengan token baru. Kalau tidak, token dibersihkan dan sesi dianggap berakhir. Alur refresh lengkap — termasuk trik satu proses refresh dipakai bersama banyak request yang kebetulan sama-sama menerima 401 — dibongkar habis di pelajaran <b>Access &amp; Refresh Token Otomatis</b>. Untuk sekarang cukup hafal dua nama ini: <code>original._retry</code> (penanda "sudah sekali coba") dan <code>TANPA_RETRY</code>.</p>'
    },
    {
      type: 'example',
      title: 'src/api/productApi.js — CRUD produk (utuh)',
      lang: 'js',
      output: false,
      code: `import api from './client.js';

export const list = () => api.get('/products').then((r) => r.data);

export const get = (id) => api.get(\`/products/\${id}\`).then((r) => r.data);

export const create = (payload) => api.post('/products', payload).then((r) => r.data);

export const update = (id, payload) => api.patch(\`/products/\${id}\`, payload).then((r) => r.data);

export const remove = (id) => api.delete(\`/products/\${id}\`).then((r) => r.data);`,
      explain: [
        'Satu function satu endpoint — pemanggil cukup tahu nama function dan bentuk datanya, bukan detail HTTP.',
        'Ekor <code>.then((r) =&gt; r.data)</code> membongkar objek respons axios: yang kembali ke halaman langsung berupa data, tanpa perlu mengurusi status, header, atau pembungkus respons.',
        'Fungsi di sini juga <b>async</b> secara alami (mengembalikan promise), sehingga halaman boleh memakai gaya await maupun .then().',
        'Gaya <code>import * as productApi</code> membuat pemanggilan terbaca sebagai kata benda: productApi.list(), productApi.remove(id).'
      ]
    },
    {
      type: 'example',
      title: 'Modul API lain — src/api/authApi.js & src/api/userApi.js',
      lang: 'js',
      output: false,
      code: `// src/api/authApi.js
import api from './client.js';

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);

export const register = (payload) =>
  api.post('/auth/register', payload).then((r) => r.data);

/* memulihkan sesi dari token yang tersimpan; 401 ditangani interceptor */
export const me = () => api.get('/auth/me').then((r) => r.data.user);

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken }).then((r) => r.data);

// src/api/userApi.js
import api from './client.js';

/* hanya admin yang boleh memanggil ini — dijaga oleh backend */
export const list = () => api.get('/users').then((r) => r.data);

export const remove = (id) => api.delete(\`/users/\${id}\`).then((r) => r.data);`,
      explain: [
        '<code>authApi.me()</code> adalah tombol "siapa saya" — dipakai AuthContext saat memulihkan sesi (pelajaran sebelumnya); 401-nya ditangani interceptor, jadi fungsi ini tetap polos.',
        'Perhatikan bedanya: <code>me()</code> membongkar dua lapis sekaligus (<code>r.data.user</code>) karena yang dibutuhkan hanya objek user, bukan seluruh isi respons.',
        'userApi sengaja dipisah dari productApi karena otoritasnya berbeda: hanya admin yang boleh memanggilnya — aturan itu dijaga backend, bukan sekadar disembunyikan di UI.'
      ]
    },
    {
      type: 'example',
      title: 'Pemakaian di halaman — src/pages/Dashboard.jsx & src/pages/Products.jsx',
      lang: 'jsx',
      output: false,
      code: `// Dashboard.jsx — muat data sekali saat halaman tampil
useEffect(() => {
  let aktif = true;
  productApi
    .list()
    .then((data) => aktif && setProducts(data))
    .catch(() => aktif && setProducts([]))
    .finally(() => aktif && setLoading(false));
  return () => { aktif = false; };
}, []);

// Products.jsx — pola try/catch + notifikasi Ant Design
async function muat() {
  try {
    setLoading(true);
    setProducts(await productApi.list());
  } catch (err) {
    message.error(err.response?.data?.message || 'Gagal memuat produk');
  } finally {
    setLoading(false);
  }
}

async function hapus(produk) {
  try {
    await productApi.remove(produk.id);
    message.success(\`"\${produk.name}" dihapus\`);
    setProducts((lama) => lama.filter((p) => p.id !== produk.id));
  } catch (err) {
    message.error(err.response?.data?.message || 'Gagal menghapus');
    muat();                        // 403 → segarkan daftar agar UI konsisten
  }
}`,
      explain: [
        'Tiga status ditangani berbeda: <b>loading</b> (tombol/tabel berputar), <b>sukses</b> (data masuk state, notifikasi hijau), dan <b>gagal</b> (pesan dari server, fallback bila tidak ada).',
        'Pesan error diambil dari <code>err.response?.data?.message</code> — server mengirim pesan manusiawi; Optional chaining membuatnya aman saat error datang dari kegagalan jaringan (respons tidak ada).',
        '<code>message</code> diambil dari <code>App.useApp()</code> Ant Design, bukan import statis — notifikasi ikut tema dan locale aplikasi.',
        'Flag <code>aktif</code> di Dashboard mencegah setState setelah komponen unmount; hapus() memanggil muat() ulang saat gagal agar tabel kembali konsisten dengan isi server.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kenapa halaman tidak boleh memanggil axios/fetch langsung?</h3><p>Karena folder <code>api/</code> adalah <b>satu-satunya tempat</b> yang tahu cara bicara dengan backend. Kalau backend berpindah alamat (mis. dari <code>localhost:3001</code> menjadi <code>api.toko.id/v2</code>), cukup satu baris di <code>client.js</code> yang diubah — bukan dua puluh berkas halaman yang harus dicari satu per satu.</p><p>Kebalikannya juga nyata: kalau tiap halaman menulis fetch sendiri, satu saja yang lupa memasang interceptor/token akan menghasilkan bug yang hanya muncul di kondisi tertentu — user tiba-tiba dikeluarkan tanpa sebab. Dengan lapisan modul API, aturan seperti header Authorization, refresh token, dan penanganan 401 ditulis <b>sekali</b> dan otomatis berlaku untuk semua pemanggilan.</p>'
    },
    {
      type: 'tip',
      title: 'Pasang timeout untuk produksi',
      text: 'Selalu beri batas waktu pada instance agar spinner tidak berputar selamanya saat backend menggantung: <code>api.defaults.timeout = 10000;</code> (10 detik). Respons yang melewati batas otomatis jatuh ke blok <code>catch</code> halaman, dan pengguna mendapat pesan "Gagal memuat" alih-alih layar diam tanpa keterangan.'
    },
    {
      type: 'warn',
      title: '401 belum tentu berarti salah password',
      text: 'Di proyek ini access token sengaja berumur pendek, jadi respons 401 paling sering berarti <b>token sudah kedaluwarsa</b>, bukan kredensial salah. Jangan langsung melempar pengguna ke halaman login setiap melihat 401 — biarkan interceptor mencoba refresh dulu. Kalau kamu menulis alur error sendiri tanpa pikir panjang, pengguna bisa melihat pesan "password salah" padahal ia hanya kehilangan sesi sebentar.'
    },
    {
      type: 'live',
      title: 'Latihan: simulasi interceptor axios',
      lang: 'html',
      hint: 'Klik beberapa tombol request dan baca kolom "Langkah interceptor". Coba urutan: "Access token kedaluwarsa" → GET /products → perhatikan refresh berjalan lalu request dikirim ulang. Sesudah itu "Buang semua token" → GET /products lagi → refresh gagal dan sesi berakhir.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Interceptor Axios</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; color: #1f2937; }
    h2 { margin: 0 0 4px; color: #1677ff; }
    .ket { color: #6b7280; font-size: 13px; margin-bottom: 14px; }
    .baris { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .kartu { background: #fff; border-radius: 10px; padding: 12px 14px; min-width: 170px; box-shadow: 0 1px 4px rgba(0,0,0,.08); font-size: 13px; }
    .kartu code { display: block; margin-top: 4px; background: #f0f5ff; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
    .kontrol { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    button { border: 0; border-radius: 8px; padding: 8px 12px; background: #1677ff; color: #fff; font-size: 13px; cursor: pointer; font-family: monospace; }
    button:disabled { background: #cbd5e1; cursor: not-allowed; }
    button.abu { background: #6b7280; font-family: system-ui, sans-serif; }
    .tabel-wrap { background: #fff; border-radius: 10px; padding: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    th { color: #6b7280; font-weight: 600; background: #f8fafc; }
    .mono { font-family: monospace; white-space: nowrap; }
    .ok td:last-child { color: #0a7d32; font-weight: 600; }
    .bad td:last-child { color: #cf1322; font-weight: 600; }
    .warn td:last-child { color: #d46b08; font-weight: 600; }
    .okx { color: #0a7d32; font-weight: 700; }
    .badx { color: #cf1322; font-weight: 700; }
  </style>
</head>
<body>
  <h2>Axios interceptor — simulasi</h2>
  <div class="ket">Tiap request melewati interceptor request (pemasang token) lalu interceptor response (penanganan error).</div>

  <div class="baris">
    <div class="kartu">Access token<code id="acc"></code></div>
    <div class="kartu">Refresh token<code id="ref"></code></div>
    <div class="kartu">Status sesi: <b id="status"></b></div>
  </div>

  <div class="kontrol">
    <button data-req="GET|/products">GET /products</button>
    <button data-req="POST|/auth/login">POST /auth/login (salah)</button>
    <button data-req="GET|/users">GET /users (user biasa)</button>
    <button data-req="POST|/products">POST /products</button>
    <button class="abu" id="btnExp">Access token kedaluwarsa</button>
    <button class="abu" id="btnBuang">Buang semua token</button>
    <button class="abu" id="btnLogin">Login lagi</button>
  </div>

  <div class="tabel-wrap">
    <table>
      <thead>
        <tr><th>Waktu</th><th>Request</th><th>Langkah interceptor</th><th>Hasil</th></tr>
      </thead>
      <tbody id="log"></tbody>
    </table>
  </div>

  <script>
    const TANPA_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
    let accessToken = 'acc-7f3a';
    let refreshToken = 'ref-9c21';
    let sibuk = false;

    const tb = document.getElementById('log');

    function baris(req, langkah, hasil, kelas) {
      const tr = document.createElement('tr');
      if (kelas) tr.className = kelas;
      const jam = new Date().toLocaleTimeString('id-ID');
      const td = function (isi, kelasLain) {
        const c = document.createElement('td');
        if (kelasLain) c.className = kelasLain;
        c.textContent = isi;
        return c;
      };
      tr.appendChild(td(jam));
      tr.appendChild(td(req, 'mono'));
      tr.appendChild(td(langkah));
      tr.appendChild(td(hasil));
      tb.insertBefore(tr, tb.firstChild);
      while (tb.rows.length > 14) tb.deleteRow(-1);
    }

    function segarkan() {
      document.getElementById('acc').textContent = accessToken || '(kosong)';
      document.getElementById('ref').textContent = refreshToken || '(kosong)';
      const st = document.getElementById('status');
      st.textContent = accessToken ? 'login' : 'belum login';
      st.className = accessToken ? 'okx' : 'badx';
    }

    function tidur(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    // seperti apa jawaban server untuk sebuah URL
    function statusServer(url) {
      if (url === '/auth/login') return 401;      // simulasi salah password
      if (!accessToken) return 401;               // belum login
      if (url === '/users') return 403;           // user biasa, bukan admin
      return 200;
    }

    async function kirim(method, url) {
      if (sibuk) return;
      sibuk = true;
      const tombol = document.querySelectorAll('[data-req]');
      tombol.forEach(function (b) { b.disabled = true; });

      // --- interceptor REQUEST: sisipkan access token ---
      baris(method + ' ' + url,
        accessToken ? 'sisipkan Bearer ' + accessToken : 'token kosong — request dikirim tanpa Authorization',
        'menunggu respons…');

      await tidur(400);
      const status = statusServer(url);

      if (status < 400) {
        baris(method + ' ' + url, 'respons sukses diteruskan apa adanya', 'respons ' + status + ' — response.data siap dipakai halaman', 'ok');
      } else if (status === 401 && TANPA_RETRY.indexOf(url) !== -1) {
        baris(method + ' ' + url, '401 + ada di TANPA_RETRY → refresh TIDAK dicoba', 'langsung error: "username atau password salah"', 'bad');
      } else if (status === 401 && !refreshToken) {
        accessToken = null;
        baris(method + ' ' + url, '401 + refresh token habis → tokenStore.clear() + announceSessionExpired()', 'React menerima event → setUser(null) → pindah ke /login', 'bad');
      } else if (status === 401) {
        baris(method + ' ' + url, '401 + belum _retry + ada refresh token → boleh refresh', 'meng POST /auth/refresh…', 'warn');
        await tidur(400);
        accessToken = 'acc-' + Math.random().toString(16).slice(2, 6);
        refreshToken = 'ref-' + Math.random().toString(16).slice(2, 6);
        baris('POST /auth/refresh', 'token lama ditukar (rotasi) → ' + accessToken, 'respons 200', 'ok');
        await tidur(400);
        const akhir = statusServer(url);
        baris(method + ' ' + url, 'request ASLI dikirim ulang dengan ' + accessToken,
          akhir < 400 ? 'respons ' + akhir + ' — pengguna tidak sadar sesi sempat diperbarui'
                      : 'respons ' + akhir + ' — ditolak, error diteruskan ke halaman',
          akhir < 400 ? 'ok' : 'bad');
      } else {
        baris(method + ' ' + url, 'respons ' + status + ' — di luar urusan refresh', 'error diteruskan ke halaman', 'bad');
      }

      segarkan();
      tombol.forEach(function (b) { b.disabled = false; });
      sibuk = false;
    }

    document.querySelectorAll('[data-req]').forEach(function (b) {
      const bagian = b.getAttribute('data-req').split('|');
      b.onclick = function () { kirim(bagian[0], bagian[1]); };
    });

    document.getElementById('btnExp').onclick = function () {
      accessToken = null;                 // refresh token masih ada
      baris('—', 'access token kedaluwarsa (refresh token masih ada)', 'klik GET /products untuk melihat refresh berjalan otomatis', 'warn');
      segarkan();
    };

    document.getElementById('btnBuang').onclick = function () {
      accessToken = null;
      refreshToken = null;
      baris('—', 'tokenStore.clear() — kedua token dihapus', 'kondisi: pengguna belum login', 'bad');
      segarkan();
    };

    document.getElementById('btnLogin').onclick = function () {
      accessToken = 'acc-7f3a';
      refreshToken = 'ref-9c21';
      baris('POST /auth/login', 'tokenStore.save(accessToken, refreshToken)', 'respons 200 — login sukses', 'ok');
      segarkan();
    };

    segarkan();
    baris('siap', 'klik salah satu tombol request di atas', 'perhatikan kolom "Langkah interceptor"');
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Axios', 'Library HTTP client untuk browser & Node: response.data otomatis dan error berstatus respons.'],
        ['Instance', 'Salah satu hasil axios.create(); punya konfigurasi sendiri (baseURL, timeout, interceptor) terpisah dari axios global.'],
        ['baseURL', 'Alamat dasar yang menempel pada setiap jalur relatif, mis. http://localhost:3001 + /products.'],
        ['Interceptor', 'Fungsi yang dijalankan axios sebelum request berangkat atau setiap respons datang — tempat memasang token & menangani error terpusat.'],
        ['response.data', 'Isi respons yang sudah di-parse otomatis oleh axios; pemanggil tidak perlu res.json().'],
        ['Modul API', 'Berkas pembungkus endpoint per domain (authApi, productApi, userApi) sehingga halaman tidak tahu detail HTTP.'],
        ['Loading state', 'Boolean di state komponen (setLoading) yang menandai sedang memuat — dipakai memutar tabel/tombol.'],
        ['Server state', 'Data yang tinggal di backend dan dibawa ke UI; punya risiko basi sehingga butuh cara memuat ulang.']
      ]
    }
  ],
  recap: [
    'Axios dipilih karena response.data otomatis, error membawa status respons, dan ada interceptor — lebih siap dari fetch untuk aplikasi bertoken.',
    'Semua request keluar dari satu instance axios.create({ baseURL }) di src/api/client.js; alamat backend cukup diubah di satu tempat.',
    'Interceptor request menyisipkan Authorization: Bearer token dari tokenStore; saat token kosong, request dikirim tanpa header.',
    'Interceptor response menangani error terpusat: 401 dicoba refresh sekali (original._retry), kecuali endpoint dalam TANPA_RETRY.',
    'Lapisan modul api/ memakai pola satu function satu endpoint dan .then(r => r.data) supaya halaman hanya memikirkan data.',
    'Halaman memanggil API dengan pola loading → sukses/gagal (try/catch + message Ant Design), dan tidak boleh memanggil axios/fetch langsung.'
  ]
});
