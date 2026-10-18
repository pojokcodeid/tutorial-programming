/* ============================================================
   Pelajaran Contoh Project React JS — Bab 5: Context API: State Global Aplikasi
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-context',
  title: 'Context API: State Global Aplikasi',
  chapter: 'State & HTTP',
  duration: '13 menit',
  intro: [
    'Data login — siapa user yang sedang masuk, apakah sudah login, dan bagaimana cara login/logout — dibutuhkan oleh banyak komponen yang jauh dari akar: header aplikasi, tabel produk, form login, sampai penjaga rute. Kalau semua itu dioper lewat <b>props berantai</b> (prop drilling), komponen di tengah harus meneruskan props yang bahkan tidak ia pakai sendiri — berantakan dan rapuh.',
    '<b>Context API</b> memberi jalan pintas: satu "sumber kebenaran" yang bisa dibaca komponen mana pun tanpa berantai. Pelajaran ini membangun <code>AuthContext</code> lengkap dari proyek Dashboard Toko — state user, fungsi login/register/logout, pemulihan sesi saat aplikasi dibuka, sampai jembatan sinyal "sesi berakhir" dari axios ke React.'
  ],
  objectives: [
    'Memahami masalah prop drilling dan kapan Context menjadi solusinya',
    'Membuat Context dengan createContext dan membungkus aplikasi dengan Provider',
    'Membuat custom hook useAuth agar pemakaian context rapi dan aman',
    'Mengisi provider dengan state dan fungsi login/register/logout berbasis useCallback dan useMemo',
    'Memulihkan sesi saat aplikasi dibuka dengan useEffect berbasis async',
    'Menjembatani berita sesi berakhir dari axios interceptor ke React lewat event window'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Masalah prop drilling</h3><p>Bayangkan aplikasi tanpa context. State <code>user</code> hidup di komponen paling atas, lalu harus dioper turun berlapis: <code>&lt;App user={user}&gt;</code> → <code>&lt;AppShell user={user}&gt;</code> → <code>&lt;Products user={user}&gt;</code> → <code>&lt;ProductTable user={user}&gt;</code>. Padahal <code>Products</code> sendiri tidak butuh <code>user</code> — ia hanya ikut meneruskan, alias menjadi "kabel" yang tidak ia pakai.</p><p>Di proyek ini setidaknya tiga tempat membutuhkan data login: <b>AppShell</b> (nama &amp; peran untuk header dan menu admin), <b>ProductTable</b> (untuk menyalakan tombol Ubah/Hapus), dan <b>Login</b> (untuk langsung mengalihkan user yang sudah masuk). Tiap ada komponen baru yang butuh <code>user</code>, rantai harus diperpanjang — dan satu komponen yang lupa meneruskan = bug diam-diam yang baru ketahuan saat tombol tidak muncul.</p>'
    },
    {
      type: 'text',
      html: '<h3>Konsep Context: satu sumber kebenaran</h3><p>Context bekerja seperti radio siaran: ada satu <b>Provider</b> yang menyiarkan nilai, dan komponen mana pun boleh <b>mendengarkan</b> lewat <code>useContext</code> tanpa dioper satu per satu. Tiga langkahnya: (1) <code>createContext(null)</code> membuat saluran, (2) <code>&lt;AuthContext.Provider value={...}&gt;</code> membungkus aplikasi di <code>main.jsx</code>, (3) komponen membaca lewat hook <code>useAuth()</code>.</p><p>Nilai yang disiarkan berupa objek: state <code>user</code>, bendera <code>ready</code>, turunan <code>isAdmin</code>, plus fungsi <code>login</code>, <code>register</code>, dan <code>logout</code>. Agar efisien, ketiga fungsi itu dibungkus <b>useCallback</b> (referensinya stabil, tidak dibuat ulang tiap render) dan objek nilainya dibungkus <b>useMemo</b> (objek baru hanya terbentuk saat dependensinya berubah). Akibatnya komponen yang berlangganan tidak ikut render ulang kalau tidak ada yang benar-benar berubah.</p>'
    },
    {
      type: 'example',
      title: 'src/auth/AuthContext.jsx — membuat context, state, dan custom hook',
      lang: 'jsx',
      output: false,
      code: `/* Context API: satu sumber kebenaran untuk data login */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';
import { tokenStore, AUTH_EXPIRED_EVENT } from './token.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);   // sesi sudah selesai dipulihkan?

  /* ...login, register, logout, dan useEffect dibahas di bagian berikut... */

  const value = useMemo(
    () => ({ user, ready, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* hook kecil agar pemakaian tidak mengetik Context secara langsung */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() harus dipakai di dalam <AuthProvider>');
  return ctx;
}`,
      explain: [
        '<code>createContext(null)</code> membuat saluran dengan nilai awal null — nilai sesungguhnya baru ada saat Provider mengisi.',
        'Pengecekan <code>if (!ctx)</code> di useAuth membuat pesan error yang jelas ("useAuth() harus dipakai di dalam &lt;AuthProvider&gt;") ketika hook dipakai di luar pembungkusnya, bukan error aneh yang bikin bingung.',
        '<code>useMemo</code> membungkus objek value sehingga Provider tidak melempar objek baru tiap render — komponen langganan tidak dirender ulang sia-sia.',
        'Kata <code>children</code> adalah isi yang dibungkus Provider; di main.jsx, isi itu adalah seluruh aplikasi.'
      ]
    },
    {
      type: 'example',
      title: 'src/auth/AuthContext.jsx — fungsi login, register, dan logout',
      lang: 'jsx',
      output: false,
      code: `const login = useCallback(async (username, password) => {
  const data = await authApi.login(username, password);
  tokenStore.save(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data.user;
}, []);

const register = useCallback(async (payload) => {
  const data = await authApi.register(payload);
  tokenStore.save(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data.user;
}, []);

const logout = useCallback(async () => {
  const refreshToken = tokenStore.refresh;
  tokenStore.clear();                    // lokal dulu agar UI langsung sigap
  setUser(null);
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken); // cabut token di server
    } catch { /* server mungkin sudah mati — abaikan */ }
  }
}, []);`,
      explain: [
        'Urutannya penting: token disimpan lewat tokenStore dulu, baru <code>setUser(data.user)</code> — begitu state berubah, semua pembaca context langsung tahu.',
        'Logout membersihkan lokal dulu (localStorage + <code>setUser(null)</code>) supaya UI langsung sigap, baru memanggil API.',
        'Panggilan logout ke server dibungkus try/catch dan tidak dipaksakan menunggu hasil (fire-and-forget): server bisa saja sudah mati, tapi pengguna tetap harus keluar dari sisi klien.',
        'Ketiga fungsi memakai useCallback dengan dependency kosong karena hanya memanggil import — referensinya boleh tetap seumur hidup Provider.'
      ]
    },
    {
      type: 'example',
      title: 'src/auth/token.js — penyimpanan token (utuh)',
      lang: 'js',
      output: false,
      code: `/* Penyimpanan token di localStorage + sinyal "sesi berakhir" */

const ACCESS_KEY = 'toko-access-token';
const REFRESH_KEY = 'toko-refresh-token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  /* simpan pasangan token baru (dipakai login, register, dan hasil refresh) */
  save(accessToken, refreshToken) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  /* refresh token gagal → sesi dianggap berakhir */
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

export const AUTH_EXPIRED_EVENT = 'auth:expired';

/* dipanggil axios interceptor ketika refresh token tidak bisa dipakai lagi */
export function announceSessionExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}`,
      explain: [
        'Berkas ini sengaja <b>tidak memakai React sama sekali</b> sehingga bisa dipakai dua dunia: axios (yang berjalan di luar React) dan AuthContext.',
        'Getter <code>access</code> dan <code>refresh</code> menyembunyikan detail localStorage — pemanggil cukup menulis <code>tokenStore.access</code>.',
        'announceSessionExpired adalah jembatan antar dunia: interceptor cukup <code>window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))</code> tanpa perlu mengimpor komponen React mana pun.',
        'Token disimpan di localStorage agar sesi bertahan saat halaman di-refresh — inilah alasan penyimpanan tidak diletakkan di state context saja.'
      ]
    },
    {
      type: 'example',
      title: 'src/auth/AuthContext.jsx — memulihkan sesi & mendengarkan sesi berakhir',
      lang: 'jsx',
      output: false,
      code: `/* 1) saat aplikasi dibuka: pulihkan sesi dari token tersimpan */
useEffect(() => {
  let aktif = true;

  async function pulihkanSesi() {
    if (tokenStore.access || tokenStore.refresh) {
      try {
        const u = await authApi.me();   // token mati → interceptor refresh sendiri
        if (aktif) setUser(u);
      } catch {
        tokenStore.clear();             // refresh token ikut habis → mulai dari nol
      }
    }
    if (aktif) setReady(true);
  }

  pulihkanSesi();
  return () => { aktif = false; };
}, []);

/* 2) dengarkan sinyal sesi berakhir dari axios interceptor */
useEffect(() => {
  const akhiriSesi = () => setUser(null);
  window.addEventListener(AUTH_EXPIRED_EVENT, akhiriSesi);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, akhiriSesi);
}, []);`,
      explain: [
        'Flag <code>aktif</code> dicek sebelum setiap setState: bila komponen sudah unmount (pengguna pindah halaman saat masih memuat), setState dilewati — tidak ada peringatan "setState on unmounted component".',
        'useEffect pertama hanya dijalankan sekali (dependency kosong) karena tugasnya satu: memulihkan sesi di awal aplikasi.',
        'Bila authApi.me() gagal karena refresh token ikut habis, <code>tokenStore.clear()</code> menghapus kedua token — pengguna dianggap mulai dari nol, bukan setengah login.',
        'useEffect kedua adalah pendengar: ketika interceptor memancarkan auth:expired, <code>setUser(null)</code> membuat ProtectedRoute otomatis mengirim pengguna ke halaman login.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Cara memakai context di halaman</h3><p>Setelah Provider terpasang di <code>main.jsx</code>, komponen mana pun tinggal memanggil hook kecil <code>useAuth()</code> — tanpa tahu dari mana data itu berasal dan tanpa menerima satu props pun. Di <code>AppShell.jsx</code> cukup satu baris: <code>const { user, isAdmin, logout } = useAuth();</code> untuk menampilkan nama user di header, menambahkan menu User hanya untuk admin, dan memanggil logout.</p><p>Di <code>ProtectedRoute.jsx</code> bahkan hanya <code>const { user } = useAuth();</code>, lalu komponen memutuskan sendiri: belum login? render <code>&lt;Navigate to="/login"&gt;</code>. Perhatikan tidak ada satu pun props <code>user</code> yang diteruskan dari App ke AppShell ke halaman ke tabel — semua mengambil dari sumber yang sama, kapan pun dan di mana pun.</p>'
    },
    {
      type: 'tip',
      title: 'Jangan bikin context raksasa',
      text: 'Context sangat cocok untuk data yang <b>dibaca banyak komponen dan jarang berubah</b> (login, tema, bahasa, keranjang belanja). Untuk data yang sering berubah dan hanya dipakai sedikit tempat (isi form, state tabel), useState biasa lebih hemat. Jangan menaruh semua state aplikasi di satu context besar — pecah per domain: <code>AuthContext</code>, <code>ThemeContext</code>, <code>CartContext</code>.'
    },
    {
      type: 'warn',
      title: 'Data di context hilang saat halaman di-refresh',
      text: 'State React — termasuk isi context — hidup di memori tab. Begitu halaman dimuat ulang, <code>user</code> kembali null meski server belum tentu mencabut sesi. Karena itu token &amp; sesi wajib disimpan di localStorage lewat <code>token.js</code>, lalu <b>dipulihkan kembali</b> oleh useEffect di AuthContext. Context hanya "menyalakan" UI, bukan tempat penyimpanan.'
    },
    {
      type: 'live',
      title: 'Latihan: satu sumber kebenaran, dua kotak',
      lang: 'html',
      hint: 'Klik "Login" dan perhatikan kedua kotak berubah bersama dari satu objek sumber. Lalu centang "mode manual" dan ulangi — hanya kotak A yang tahu, kotak B tertinggal. Tekan "Salin manual" untuk merasakan repotnya prop drilling.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Context API</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; color: #1f2937; }
    h2 { margin: 0 0 4px; color: #1677ff; }
    .ket { color: #6b7280; font-size: 13px; margin-bottom: 14px; }
    .baris { display: flex; gap: 14px; flex-wrap: wrap; }
    .kartu { background: #fff; border-radius: 10px; padding: 14px; flex: 1; min-width: 230px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .kartu h4 { margin: 0 0 8px; font-size: 14px; color: #374151; }
    .isi { background: #f0f5ff; border: 1px dashed #91caff; border-radius: 8px; padding: 12px; font-size: 14px; min-height: 54px; }
    .kosong { color: #9ca3af; font-style: italic; }
    .kontrol { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    button { border: 0; border-radius: 8px; padding: 8px 12px; background: #1677ff; color: #fff; font-size: 13px; cursor: pointer; }
    button:disabled { background: #cbd5e1; cursor: not-allowed; }
    button.abu { background: #6b7280; }
    label { font-size: 13px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 7px 10px; cursor: pointer; }
    .log { margin-top: 14px; background: #111827; color: #d1d5db; border-radius: 10px; padding: 10px 12px; font-family: monospace; font-size: 12px; height: 130px; overflow-y: auto; }
    .log div { margin-bottom: 3px; }
    .ok { color: #4ade80; }
    .jelek { color: #f87171; }
  </style>
</head>
<body>
  <h2>Context API — simulasi mini</h2>
  <div class="ket">Kotak A dan B membaca dari objek sumber yang sama, seperti komponen berlangganan Provider.</div>
  <div class="baris">
    <div class="kartu">
      <h4>Kotak A — header aplikasi</h4>
      <div class="isi" id="kotakA"></div>
    </div>
    <div class="kartu">
      <h4>Kotak B — sidebar</h4>
      <div class="isi" id="kotakB"></div>
    </div>
  </div>
  <div class="kontrol">
    <button id="btnLogin">Login "Budi"</button>
    <button id="btnGanti">Ganti nama → "Sari"</button>
    <button id="btnLogout">Logout</button>
    <button id="btnSinkron" class="abu" disabled>Salin manual ke kotak B</button>
    <label><input type="checkbox" id="modeManual"> Mode manual (tanpa context)</label>
  </div>
  <div class="log" id="log"></div>

  <script>
    const sumber = { user: null };      // "Provider": satu sumber kebenaran
    const langganan = [];               // siapa saja yang ikut dirender ulang
    let manualA = null;                 // salinan pribadi (mode manual)
    let manualB = null;

    const logEl = document.getElementById('log');
    function log(teks, kelas) {
      const d = document.createElement('div');
      if (kelas) d.className = kelas;
      d.textContent = new Date().toLocaleTimeString('id-ID') + '  ' + teks;
      logEl.appendChild(d);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function gambar(id, user) {
      const el = document.getElementById(id);
      el.innerHTML = user
        ? '<b>' + user.name + '</b> · ' + user.role
        : '<span class="kosong">belum login</span>';
    }

    // gaya context: kedua kotak berlangganan pada sumber yang sama
    langganan.push(function () {
      gambar('kotakA', sumber.user);
      gambar('kotakB', sumber.user);
    });

    function setSumber(user) {
      sumber.user = user;
      langganan.forEach(function (fn) { fn(); });
      log('sumber berubah → ' + (user ? 'user "' + user.name + '"' : 'null') + ' — semua yang berlangganan ikut dirender ulang', 'ok');
    }

    function modeManual() { return document.getElementById('modeManual').checked; }

    function gambarManual() {
      gambar('kotakA', manualA);
      gambar('kotakB', manualB);
    }

    document.getElementById('modeManual').onchange = function () {
      if (this.checked) {
        manualA = sumber.user;
        manualB = sumber.user;          // mulai dari kondisi sama
        gambarManual();
        log('MODE MANUAL: kotak berhenti berlangganan, masing-masing menyimpan salinan sendiri', 'jelek');
      } else {
        manualA = null;
        manualB = null;
        langganan.forEach(function (fn) { fn(); });
        log('kembali memakai context: kedua kotak langsung sinkron lagi', 'ok');
      }
      document.getElementById('btnSinkron').disabled = !modeManual();
    };

    document.getElementById('btnLogin').onclick = function () {
      if (modeManual()) {
        manualA = { name: 'Budi', role: 'admin' };
        gambarManual();
        log('kotak A menyalin data login — kotak B tidak tahu apa-apa (props terlupa)', 'jelek');
      } else {
        setSumber({ name: 'Budi', role: 'admin' });
      }
    };

    document.getElementById('btnGanti').onclick = function () {
      if (modeManual()) {
        if (!manualA) { log('belum ada user di kotak A — klik Login dulu', 'jelek'); return; }
        manualA = { name: 'Sari', role: 'admin' };
        gambarManual();
        log('kotak A diperbarui — kotak B masih menyimpan nama lama', 'jelek');
      } else {
        if (!sumber.user) { log('belum ada user — klik Login dulu', 'jelek'); return; }
        setSumber({ name: 'Sari', role: 'admin' });
      }
    };

    document.getElementById('btnLogout').onclick = function () {
      if (modeManual()) {
        manualA = null;
        gambarManual();
        log('kotak A logout — kotak B masih bilang sedang login (bug diam-diam!)', 'jelek');
      } else {
        setSumber(null);
      }
    };

    document.getElementById('btnSinkron').onclick = function () {
      manualB = manualA;
      gambarManual();
      log('kotak B akhirnya disalin manual dari kotak A — bayangkan melakukannya di 10 komponen…', 'jelek');
    };

    langganan.forEach(function (fn) { fn(); });
    log('kedua kotak mulai membaca sumber yang sama — klik Login untuk mencoba');
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Context', 'Saluran React untuk menyiarkan data ke komponen mana pun tanpa dioper lewat props berantai.'],
        ['Provider', 'Komponen pembungkus yang mengisi nilai Context; di proyek ini &lt;AuthContext.Provider&gt; di dalam AuthProvider.'],
        ['useContext', 'Hook bawaan React untuk membaca nilai Context terdekat.'],
        ['Prop drilling', 'Meneruskan props melewati komponen yang tidak memakainya hanya untuk sampai ke komponen jauh di bawah.'],
        ['Custom hook', 'Fungsi buatan sendiri yang diawali kata use (mis. useAuth) untuk membungkus logika hooks.'],
        ['State global', 'State yang dibaca banyak bagian aplikasi, bukan milik satu komponen (mis. data login, tema).'],
        ['Sesi', 'Kondisi "sedang login" yang berlangsung dari login sampai logout atau token habis.'],
        ['Event window', 'Sinyal lintas-modul memakai browser: window.dispatchEvent(new Event(...)) dan addEventListener.']
      ]
    }
  ],
  recap: [
    'Prop drilling meneruskan props berlapis melewati komponen yang tidak memakainya — rawan lupa dan berantakan saat proyek membesar.',
    'Context = createContext + Provider + useContext; di proyek ini dibungkus custom hook useAuth agar pemakaiannya rapi dan aman.',
    'Provider mengisi objek value berisi state user, ready, isAdmin, dan fungsi login/register/logout; fungsi dibungkus useCallback, objek dibungkus useMemo.',
    'token.js menyimpan token di localStorage dan memancarkan event window auth:expired — dipakai axios di luar React maupun AuthContext.',
    'useEffect pertama memulihkan sesi dengan flag aktif agar aman saat unmount; useEffect kedua mendengarkan berakhirnya sesi dan melempar pengguna ke login.',
    'Data context hilang saat refresh halaman — karena itu sesi butuh localStorage, bukan context saja.'
  ]
});
