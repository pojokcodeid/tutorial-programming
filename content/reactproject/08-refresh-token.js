/* ============================================================
   Pelajaran Contoh Project React JS — Bab 8: Access & Refresh Token Otomatis
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-refresh',
  title: 'Access & Refresh Token Otomatis',
  chapter: 'Keamanan',
  duration: '16 menit',
  intro: [
    'Access token di proyek ini sengaja dibuat pendek — satu menit. Keputusan itu aman bagi server, tetapi berarti buruk bagi user bila tiap menit ia diminta login ulang. Jawabannya: <b>refresh token</b> yang panjang umur, dipakai diam-diam oleh axios untuk menukar token baru dan <b>mengirim ulang request yang tadi gagal</b>.',
    'Pelajaran ini membongkar interceptor di <code>src/api/client.js</code> dan pasangannya di <code>server.js</code> — mulai dari alur dasar, penanganan banyak request bersamaan (antrean refresh), hingga rotasi dan pencabutan token.'
  ],
  objectives: [
    'Memahami alasan memisahkan access token pendek dan refresh token panjang',
    'Mengikuti alur lengkap: request 401 → refresh → retry otomatis',
    'Membaca dan menulis interceptor request/response pada instance axios',
    'Mencegah panggilan refresh yang bertumpuk dengan satu promise bersama',
    'Mengimplementasikan rotasi refresh token & pencabutan (logout) di server',
    'Mengamati perilaku refresh secara langsung di DevTools dan lewat curl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa dua token?</h3><p>Access token dibawa setiap request, jadi ia harus <b>sependek mungkin</b> agar bocor pun cepat kedaluwarsa. Refresh token hanya dikirim ke satu endpoint (<code>/auth/refresh</code>), jadi ia boleh <b>panjang</b> agar user tidak repot. Kombinasi ini membuat sesi terasa mulus tanpa mengorbankan keamanan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Diagram alur refresh token: request gagal 401, interceptor memanggil auth refresh, lalu mengirim ulang request">
        <defs><marker id="mk-rf-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="20" y="16" width="200" height="58" rx="8" class="u-box"/>
        <text x="120" y="42" class="u-title" text-anchor="middle">Request (axios)</text>
        <text x="120" y="62" class="u-lbl" text-anchor="middle">Authorization: Bearer token</text>
        <line x1="120" y1="78" x2="120" y2="112" class="u-line" marker-end="url(#mk-rf-1)"/>
        <rect x="20" y="116" width="200" height="52" rx="8" class="u-hd"/>
        <text x="120" y="138" class="u-title" text-anchor="middle">Server: 401</text>
        <text x="120" y="157" class="u-lbl" text-anchor="middle">access token kedaluwarsa</text>
        <line x1="224" y1="142" x2="283" y2="142" class="u-line" marker-end="url(#mk-rf-1)"/>
        <rect x="287" y="116" width="210" height="52" rx="8" class="u-box"/>
        <text x="392" y="138" class="u-title" text-anchor="middle">Interceptor respons</text>
        <text x="392" y="157" class="u-lbl" text-anchor="middle">tandai _retry, kumpulkan antrean</text>
        <line x1="392" y1="172" x2="392" y2="206" class="u-line" marker-end="url(#mk-rf-1)"/>
        <rect x="287" y="210" width="210" height="58" rx="8" class="u-box"/>
        <text x="392" y="232" class="u-title" text-anchor="middle">POST /auth/refresh</text>
        <text x="392" y="252" class="u-lbl" text-anchor="middle">kirim refresh token</text>
        <text x="392" y="268" class="u-lbl" text-anchor="middle">terima pasangan token baru</text>
        <line x1="501" y1="239" x2="560" y2="239" class="u-line" marker-end="url(#mk-rf-1)"/>
        <rect x="564" y="210" width="176" height="58" rx="8" class="u-box"/>
        <text x="652" y="232" class="u-title" text-anchor="middle">Simpan token baru</text>
        <text x="652" y="252" class="u-lbl" text-anchor="middle">localStorage</text>
        <line x1="652" y1="206" x2="652" y2="118" class="u-line"/>
        <line x1="650" y1="116" x2="499" y2="60" class="u-line"/>
        <line x1="287" y1="52" x2="224" y2="52" class="u-line" marker-end="url(#mk-rf-1)"/>
        <text x="470" y="88" class="u-lbl" text-anchor="middle">kirim ulang request awal dengan token baru</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Alur deteksi 401, penukaran token, dan pengiriman ulang request</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Interceptor request: memasang token</h3><p>Sebelum request berangkat, interceptor menyisipkan header Authorization dari localStorage. Dengan begini tidak ada satu pun halaman yang perlu mengurus pemasangan token secara manual.</p>'
    },
    {
      type: 'example',
      title: 'client.js — instance & interceptor request',
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
});

/* endpoint auth yang tidak boleh memicu percobaan refresh */
const TANPA_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];`,
      explain: [
        '<code>import.meta.env.VITE_API_URL</code> memungkinkan alamat backend diganti lewat file .env tanpa menyentuh kode — berguna saat dipindah ke server lain.',
        'Header hanya dipasang bila belum ada (<code>!config.headers.Authorization</code>), sehingga token hasil refresh bisa dikirim ulang tanpa ditimpa.',
        'Daftar TANPA_RETRY mencegah kesalahan fatal: password salah di /auth/login akan selalu 401, dan itu bukan tanda access token kedaluwarsa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Interceptor respons: refresh saat 401</h3><p>Inilah jantung pelajaran ini. Aturannya ringkas: bila respons 401, request belum pernah dicoba ulang, endpointnya bukan endpoint auth, dan refresh token masih ada — maka tukar dulu token, lalu kirim ulang request awal persis dengan konfigurasi yang sama.</p>'
    },
    {
      type: 'example',
      title: 'client.js — interceptor respons + antrean refresh',
      lang: 'js',
      output: false,
      code: `/* satu proses refresh dipakai bersama oleh banyak request yang kebetulan
   sama-sama menerima 401 di saat yang bersamaan */
let refreshing = null;

async function runRefresh() {
  // axios polos (bukan instance api) agar interceptor tidak berputar-putar
  const res = await axios.post(\`\${BASE_URL}/auth/refresh\`, {
    refreshToken: tokenStore.refresh
  });
  tokenStore.save(res.data.accessToken, res.data.refreshToken);
  return res.data.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const bolehCobaRefresh =
      status === 401 &&
      !original._retry &&                    // hanya sekali per request
      !TANPA_RETRY.includes(original.url) && // login salah password tidak di-refresh
      tokenStore.refresh;                    // tanpa refresh token, ya sudah

    if (!bolehCobaRefresh) return Promise.reject(error);

    original._retry = true;
    try {
      refreshing = refreshing || runRefresh();
      const accessToken = await refreshing;
      original.headers.Authorization = \`Bearer \${accessToken}\`;
      return api(original);                  // kirim ulang request awal
    } catch (err) {
      tokenStore.clear();
      announceSessionExpired();              // beri tahu AuthContext
      return Promise.reject(err);
    } finally {
      refreshing = null;
    }
  }
);`,
      explain: [
        'Bendera <code>original._retry = true</code> memastikan satu request hanya boleh satu kali percobaan ulang — kalau token barunya pun 401, error diteruskan apa adanya agar tidak berputar selamanya.',
        '<code>refreshing = refreshing || runRefresh()</code> adalah kunci antrean: request kedua, ketiga, dan seterusnya menumpang pada promise yang sama, sehingga <code>/auth/refresh</code> hanya dipanggil sekali walau sepuluh request gagal bersamaan.',
        '<code>axios.post</code> polos dipakai agar panggilan refresh sendiri tidak melewati interceptor ini (hindari rekursi).',
        'Kegagalan refresh berarti sesi benar-benar habis: token dibersihkan dan sinyal <code>auth:expired</code> dikirim ke AuthContext.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menjembatani axios dan React</h3><p>Interceptor berjalan di luar React, sedangkan state login ada di dalam AuthContext. Jembatannya sederhana: sebuah event pada <code>window</code>. Token disimpan di <code>token.js</code> yang bisa dipakai kedua dunia.</p>'
    },
    {
      type: 'example',
      title: 'token.js & pendengar di AuthContext',
      lang: 'js',
      output: false,
      code: `// token.js — dipakai axios (di luar React) dan AuthContext
export const tokenStore = {
  get access() { return localStorage.getItem('toko-access-token'); },
  get refresh() { return localStorage.getItem('toko-refresh-token'); },
  save(accessToken, refreshToken) { /* tulis keduanya ke localStorage */ },
  clear() { /* hapus keduanya */ }
};

export const AUTH_EXPIRED_EVENT = 'auth:expired';

export function announceSessionExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

// AuthContext.jsx — pendengar sinyal sesi berakhir
useEffect(() => {
  const akhiriSesi = () => setUser(null);
  window.addEventListener(AUTH_EXPIRED_EVENT, akhiriSesi);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, akhiriSesi);
}, []);`,
      explain: [
        'Pemisahan ini penting: axios tidak boleh mengimpor komponen React, dan context tidak boleh tahu detail URL backend.',
        'Ketika sinyal tiba, <code>user</code> menjadi null → ProtectedRoute langsung mengarahkan ke /login. Tidak ada state yang nyangkut.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Sisi server: rotasi & pencabutan</h3><p>Server tidak cukup memverifikasi tanda tangan refresh token; ia juga memeriksanya di db. Setiap kali dipakai, token lama dicabut dan diganti yang baru — pola yang disebut <b>rotasi</b>. Bila sebuah token lama tiba-tiba dipakai lagi, berarti token itu bocor dan memang harus sudah mati.</p>'
    },
    {
      type: 'example',
      title: 'server.js — endpoint /auth/refresh',
      lang: 'js',
      output: false,
      code: `server.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ message: 'refreshToken wajib dikirim' });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, SECRET);
    if (payload.type !== 'refresh') throw new Error('bukan refresh token');
  } catch {
    return res.status(401).json({ message: 'Refresh token tidak valid' });
  }

  const stored = db.get('refreshTokens').find({ token: refreshToken }).value();
  if (!stored || stored.expiresAt < Date.now()) {
    return res.status(401).json({ message: 'Refresh token kedaluwarsa atau sudah dicabut' });
  }

  const user = db.get('users').find({ id: payload.sub }).value();
  if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });

  // rotasi: token lama dicabut, sepasang token baru diterbitkan
  db.get('refreshTokens').remove({ token: refreshToken }).write();
  res.json(issueTokens(user));
});`,
      explain: [
        'Tiga lapis pengecekan: tanda tangan JWT, keberadaan di db (bisa dicabut), dan masa berlaku yang tercatat.',
        'Pengecekan <code>type !== \'refresh\'</code> menolak access token yang sengaja dimasukkan ke endpoint ini.',
        'Logout melakukan hal yang sama tanpa menerbitkan token baru — cukup menghapus catatan di db.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengamati dengan mata kepala</h3><p>Karena access token di proyek ini hidup satu menit, kamu bisa melihatnya bekerja tanpa menunggu lama: buka DevTools → tab Network, lalu diamkan halaman selama satu menit, lalu klik Muat Ulang pada halaman Produk. Amati urutannya.</p>'
    },
    {
      type: 'example',
      title: 'Yang terlihat di tab Network',
      lang: 'text',
      output: false,
      code: `1. GET  /products         → 401  (token sudah lewat 1 menit)
2. POST /auth/refresh     → 200  { accessToken, refreshToken }
3. GET  /products         → 200  (request awal dikirim ulang)

# percobaan lewat terminal — bukti rotasi bekerja
curl -s -X POST http://localhost:3001/auth/refresh \\
  -H 'Content-Type: application/json' -d '{"refreshToken":"RT_LAMA"}'

# pakai lagi RT_LAMA → 401 "Refresh token kedaluwarsa atau sudah dicabut"`,
      explain: [
        'Hanya tiga entri itulah yang terlihat karena pengguna tidak merasa apa-apa — itulah tujuan otomatisasi ini.',
        'Setelah refresh, refresh token yang tersimpan di localStorage juga sudah yang baru; menyimpan yang lama akan membuat sesi terputus pada refresh berikutnya.'
      ]
    },
    {
      type: 'warn',
      title: 'Lima hal yang tidak boleh dilakukan pada alur ini',
      text: 'Jangan panggil <code>/auth/refresh</code> tanpa rotasi (token bocor tetap hidup selamanya). Jangan simpan refresh token di URL atau log. Jangan izinkan retry lebih dari satu kali (<code>_retry</code> wajib). Jangan refresh untuk endpoint login — 401 di sana berarti password salah. Dan jangan mengandalkan localStorage saja di produksi: refresh token sebaiknya dikirim lewat cookie <code>httpOnly</code> agar tidak terbaca skrip.'
    },
    {
      type: 'tip',
      title: 'Mempercepat percobaan',
      text: 'Ingin melihat refresh tanpa menunggu satu menit? Jalankan backend dengan masa hidup token pendek: <code>ACCESS_TTL=15s npm run server</code>. Variabel <code>ACCESS_TTL</code>, <code>REFRESH_TTL</code>, dan <code>JWT_SECRET</code> dibaca langsung oleh server.js.'
    },
    {
      type: 'live',
      title: 'Latihan: simulasi alur refresh token',
      lang: 'html',
      hint: 'Klik "Kirim request" berkali-kali setelah token dianggap kedaluwarsa untuk melihat urutan 401 → refresh → retry. Ubah juga checkbox agar refresh token dianggap dicabut.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Refresh Token</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .bar { background: #fff; border-radius: 10px; padding: 14px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    button { padding: 8px 16px; background: #1677ff; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
    button.warn { background: #d46b08; }
    .tag { font-family: monospace; font-size: 12px; padding: 3px 8px; border-radius: 999px; background: #f0f0f0; }
    .tag.mat { background: #fff1f0; color: #cf1322; }
    .tag.hid { background: #f6ffed; color: #0a7d32; }
    .log { background: #0f172a; color: #e2e8f0; border-radius: 10px; padding: 14px; font-family: monospace; font-size: 13px; margin-top: 14px; min-height: 200px; }
    .l-ok { color: #4ade80; } .l-no { color: #f87171; } .l-in { color: #93c5fd; } .l-wr { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="bar">
      <button onclick="kirim()">Kirim request</button>
      <button class="warn" onclick="usang()">Buat token kedaluwarsa</button>
      <label><input type="checkbox" id="dicabut"> Refresh token dicabut server</label>
      <span>access token:</span> <span id="tagA" class="tag hid">hidup</span>
      <span>refresh token:</span> <span id="tagR" class="tag hid">tersimpan</span>
    </div>
    <div class="log" id="log">$ siap. Klik "Kirim request"…</div>
  </div>
  <script>
    let accessHidup = true;
    let refreshAda = true;
    let antrian = null;   // satu promise dipakai bersama (antrean refresh)

    const log = (teks, kelas) => {
      const el = document.getElementById('log');
      el.innerHTML += '<div class="' + (kelas || '') + '">' + teks + '</div>';
      el.scrollTop = el.scrollHeight;
    };
    const gambar = () => {
      const a = document.getElementById('tagA');
      a.textContent = accessHidup ? 'hidup' : 'kedaluwarsa';
      a.className = 'tag ' + (accessHidup ? 'hid' : 'mat');
      const r = document.getElementById('tagR');
      r.textContent = refreshAda ? 'tersimpan' : 'dicabut';
      r.className = 'tag ' + (refreshAda ? 'hid' : 'mat');
    };

    // meniru runRefresh() di client.js
    function refresh() {
      if (antrian) return antrian;   // request lain menumpang promise yang sama
      antrian = new Promise((resolve, reject) => {
        log('POST /auth/refresh — menukar refresh token…', 'l-in');
        setTimeout(() => {
          if (!refreshAda) {
            log('401 — refresh token sudah dicabut → sesi berakhir', 'l-no');
            antrian = null;
            return reject(new Error('sesi habis'));
          }
          log('200 — sepasang token baru diterbitkan (rotasi)', 'l-ok');
          accessHidup = true;
          gambar();
          antrian = null;
          resolve('TOKEN_BARU');
        }, 700);
      });
      return antrian;
    }

    async function kirim() {
      log('GET /products — Authorization: Bearer …', 'l-in');
      if (!accessHidup) {
        log('401 — access token kedaluwarsa', 'l-no');
        try {
          const token = await refresh();
          log('retry GET /products dengan ' + token + ' → 200 OK', 'l-ok');
        } catch { /* sesi berakhir */ }
      } else {
        log('200 OK', 'l-ok');
      }
    }

    function usang() {
      accessHidup = false;
      log('…1 menit kemudian, access token kedaluwarsa', 'l-wr');
      gambar();
    }

    gambar();
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Access token', 'Token jangka pendek berisi identitas & peran; dibawa setiap request.'],
        ['Refresh token', 'Token jangka panjang yang hanya dipakai untuk menukar access token baru.'],
        ['Rotasi token', 'Menerbitkan token baru setiap refresh dan mencabut yang lama.'],
        ['_retry', 'Penanda pada konfigurasi request agar satu request tidak diretry berkali-kali.'],
        ['Antrean refresh', 'Satu promise dipakai bersama banyak request yang sedang menunggu token baru.'],
        ['Rekursi interceptor', 'Keadaan di mana panggilan refresh sendiri memicu interceptor lagi; dicegah dengan axios polos.'],
        ['TTL', 'Time to live — masa hidup token, mis. 1m untuk access dan 7d untuk refresh.'],
        ['Pencabutan (revocation)', 'Membatalkan token yang sudah terbit lewat catatan di database.']
      ]
    }
  ],
  recap: [
    'Access token pendek demi keamanan, refresh token panjang demi kenyamanan — keduanya dipasangkan.',
    'Interceptor respons menangkap 401 → menukar token → mengirim ulang request awal, sekali saja.',
    'Bendera _retry mencegah loop; TANPA_RETRY mencegah refresh dipicu oleh login yang gagal.',
    'Satu promise bersama (refreshing) membuat sepuluh request gagal hanya memicu satu panggilan refresh.',
    'Server memutar refresh token dan mencabut yang lama; logout mencabut tanpa menerbitkan baru.',
    'Sesi berakhir ditandai lewat event window sehingga AuthContext langsung mengarahkan user ke /login.'
  ]
});
