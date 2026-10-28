/* ============================================================
   Pelajaran Micro-Frontend — Bab 10: Sekali Login, Token, dan Otorisasi
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-auth-otorisasi',
  title: 'Sekali Login, Token, dan Otorisasi',
  chapter: 'Kontrak & Data',
  duration: '18 menit',
  intro: [
    'Pengguna cukup login sekali di shell, lalu berpindah antara katalog, keranjang, dan akun tanpa diminta masuk ulang. Remote tidak punya halaman login sendiri dan tidak menyimpan token sendiri. Semua keputusan sesi berada di satu tempat: shell.',
    'Model yang dipakai TokoMicro React memisahkan dua hal. <b>Access token</b> berumur pendek dan disimpan di memori JavaScript. <b>Refresh token</b> berumur panjang, disimpan server dalam cookie <code>httpOnly</code> dan <code>SameSite</code>, lalu dirotasi setiap kali dipakai. Dengan begitu, skrip yang berhasil mencuri access token tidak otomatis mendapat sesi panjang.',
    'Bab ini membangun login, refresh diam-diam, <code>ctx.getToken()</code>, rute terproteksi, pemeriksaan peran, dan logout. Kamu juga akan membedakan <b>401</b> (belum terautentikasi) dari <b>403</b> (sudah login tetapi tidak berwenang), lalu menambahkan halaman admin yang hanya boleh dibuka akun <code>admin</code>.'
  ],
  objectives: [
    'Menjelaskan mengapa login dan access token hanya dimiliki shell',
    'Menerapkan refresh token httpOnly, SameSite, dan rotasi di sisi server',
    'Memakai ctx.getToken() di remote tanpa menyimpan token sendiri',
    'Membangun rute terproteksi dan pemeriksaan peran yang bekerja untuk deep link',
    'Membedakan 401 dan 403 serta memverifikasi sesi bertahan setelah reload'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua Token, Dua Tempat, Dua Umur</h3><table class="vocab"><tr><th>Token</th><th>Tempat</th><th>Umur</th><th>Tujuan</th></tr><tr><td>Access token</td><td>Variabel memori di shell</td><td>Sekitar 15 menit</td><td>Dikirim di header <code>Authorization: Bearer</code> ke API.</td></tr><tr><td>Refresh token</td><td>Cookie <code>httpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code></td><td>Beberapa hari</td><td>Hanya dikirim ke <code>/api/refresh</code> dan <code>/api/logout</code>.</td></tr></table><p>Access token di memori hilang saat halaman di-refresh. Itu normal: shell memanggil <code>/api/refresh</code> dengan cookie, mendapat access token baru, lalu memanggil <code>/api/me</code>. Pengguna tidak melihat layar login karena sesi dipulihkan diam-diam.</p><p>Refresh token dirotasi: setiap refresh mengeluarkan token baru dan membatalkan yang lama. Bila token lama dipakai lagi, server menganggapnya dicuri dan mencabut seluruh sesi. Ini jauh lebih aman daripada menyimpan token di <code>localStorage</code>, yang dapat dibaca skrip mana pun pada origin yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Login, refresh, dan cookie di server',
      lang: 'js',
      output: false,
      code: `// ilustrasi handler auth di server.js
const REFRESH_COOKIE = {
  httpOnly: true, secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', path: '/api', maxAge: 7 * 24 * 60 * 60 * 1000
};
app.post('/api/login', async (req, res) => {
  const user = await authService.verify(req.body.username, req.body.password);
  if (!user) return res.status(401).json({ error: 'Kredensial salah' });
  const refreshToken = await tokens.issueRefresh(user.id);
  res.cookie('tm_refresh', refreshToken, REFRESH_COOKIE);
  res.json({
    accessToken: tokens.signAccess(user), expiresAt: Date.now() + 15 * 60 * 1000,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  });
});
app.post('/api/refresh', async (req, res) => {
  const rotated = await tokens.rotate(req.cookies.tm_refresh);
  if (!rotated) return res.status(401).json({ error: 'Sesi berakhir' });
  res.cookie('tm_refresh', rotated.refreshToken, REFRESH_COOKIE);
  res.json({ accessToken: rotated.accessToken, expiresAt: rotated.expiresAt });
});
app.post('/api/logout', async (req, res) => {
  await tokens.revoke(req.cookies.tm_refresh);
  res.clearCookie('tm_refresh', { ...REFRESH_COOKIE, maxAge: undefined });
  res.status(204).end();
});`,
      explain: [
        'Refresh token tidak pernah masuk ke body respons. JavaScript tidak dapat membacanya karena <code>httpOnly</code>.',
        'Cookie dibatasi pada path <code>/api</code> agar tidak ikut terkirim ke aset statis atau CDN.',
        '<code>sameSite: "lax"</code> mengurangi risiko CSRF untuk navigasi lintas situs. Bila API benar-benar lintas situs, gunakan <code>none</code> bersama <code>secure</code> dan tambahkan proteksi CSRF.'
      ]
    },
    {
      type: 'example',
      title: 'AuthProvider: token di memori dan single-flight refresh',
      lang: 'jsx',
      output: false,
      code: `// apps/shell/src/auth.ts (penyederhanaan AuthProvider)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
const AuthContext = createContext(null);
let accessToken = null, expiresAt = 0, refreshPromise = null;
async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/refresh', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('SESSION_EXPIRED');
        const data = await res.json();
        accessToken = data.token;
        expiresAt = data.expiresAt;
        return accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    refreshSession()
      .then((token) => fetch('/api/me', { headers: { Authorization: 'Bearer ' + token } }))
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);
  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/login', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Login gagal');
    accessToken = data.token; expiresAt = data.expiresAt;
    setUser(data.user);
    return data.user;
  }, []);
  const getToken = useCallback(async () => {
    if (!accessToken) return null;
    if (expiresAt - Date.now() > 60_000) return accessToken;
    try { return await refreshSession(); }
    catch { accessToken = null; expiresAt = 0; setUser(null); return null; }
  }, []);
  const logout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    accessToken = null; expiresAt = 0; setUser(null);
  }, []);
  const value = useMemo(() => ({ user, ready, login, logout, getToken }), [user, ready, login, logout, getToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth harus di dalam AuthProvider');
  return value;
}`,
      explain: [
        '<code>refreshPromise</code> mencegah lima request remote memicu lima refresh sekaligus. Semua pemanggil menunggu promise yang sama.',
        'Saat mount, shell mencoba refresh lalu <code>/api/me</code>. Inilah yang membuat sesi bertahan setelah reload tanpa token di penyimpanan browser.',
        '<code>getToken</code> memperbarui token bila tersisa kurang dari 60 detik. Remote tidak perlu tahu kapan token kedaluwarsa.'
      ]
    },
    {
      type: 'example',
      title: 'Rute terproteksi dan pemeriksaan peran',
      lang: 'jsx',
      output: false,
      code: `// apps/shell/src/App.tsx — guard di dalam shell
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
export function RequireAuth({ children }) {
  const { user, ready } = useAuth(); const location = useLocation();
  if (!ready) return <p role="status">Memeriksa sesi…</p>;
  if (user) return children;
  return <Navigate to={'/masuk?next=' + encodeURIComponent(location.pathname + location.search)} replace />;
}
export function RequireRole({ role, whenPath, children }) {
  const { user } = useAuth(); const { pathname } = useLocation();
  if (whenPath && pathname !== whenPath) return children;
  if (user?.role !== role) return <section role="alert"><h1>Akses ditolak</h1><p>Hanya untuk peran {role}.</p></section>;
  return children;
}`,
      explain: [
        '<b>401</b> berarti belum terautentikasi: token tidak ada atau tidak valid. Tindakannya adalah refresh sekali; bila gagal, arahkan ke login dengan <code>next</code>.',
        '<b>403</b> berarti sudah terautentikasi tetapi tidak berwenang. Jangan logout dan jangan retry; tampilkan "Akses ditolak".',
        'Guard di browser hanya untuk pengalaman pengguna. Server tetap wajib memeriksa token dan peran pada setiap endpoint.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: halaman admin hanya untuk role admin',
      lang: 'jsx',
      output: false,
      code: `// 1. shell: satu rute wildcard, guard admin aktif hanya untuk /akun/admin
<Route path="/akun/*" element={
  <RequireAuth><RequireRole role="admin" whenPath="/akun/admin"><Account ctx={ctx} /></RequireRole></RequireAuth>
} />
// 2. account: rute bersarang "admin" memanggil endpoint khusus
const token = await ctx.getToken();
const res = await fetch('/api/orders?scope=all', { headers: { Authorization: 'Bearer ' + token } });
if (res.status === 403) return ctx.toast('Kamu tidak berwenang melihat semua pesanan', 'error');
// 3. build dan verifikasi
npm run build && npm start
# login demo/demo123  -> /akun/admin menampilkan "Akses ditolak"
# login admin/admin123 -> daftar semua pesanan tampil
# reload /akun/admin  -> sesi admin bertahan lewat /api/refresh
npm run test:e2e`,
      explain: [
        'Shell memakai satu rute <code>/akun/*</code> agar remote akun tetap memiliki URL bersarang. Guard <code>RequireRole</code> hanya aktif ketika <code>useLocation().pathname</code> tepat <code>/akun/admin</code>, sehingga halaman profil dan riwayat tetap bisa dibuka customer.',
        'Remote akun mencocokkan <code>admin</code> relatif terhadap <code>/akun</code>. Customer yang memaksa memanggil endpoint lewat curl tetap mendapat 403 dari server; guard klien bukan batas keamanan.',
        'Setelah reload, access token di memori hilang. Shell memakai cookie refresh untuk mendapat token baru, lalu memulihkan user admin.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Simpan Token di localStorage',
      text: '<code>localStorage</code> dapat dibaca skrip mana pun yang berjalan di origin yang sama, termasuk dependensi yang disusupi. Jangan menyimpan access token, refresh token, atau data sesi sensitif di sana; jangan menaruh token di URL, <code>sessionStorage</code>, atau state yang ikut terserialisasi ke HTML. Refresh token harus <code>httpOnly</code>, <code>Secure</code> di produksi, dan <code>SameSite</code> yang sesuai. Jangan menganggap peran dari klien sebagai otorisasi, jangan mencatat header <code>Authorization</code> di log, dan pastikan logout mencabut refresh token di server, bukan hanya menghapus state di browser. Bila memakai cookie lintas situs, tambahkan proteksi CSRF.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: Reload, 401, 403, dan Logout</h3><ol><li>Login sebagai <code>admin/admin123</code>, buka <code>/akun/admin</code>, lalu refresh. Halaman harus tetap tampil tanpa login ulang.</li><li>Buka DevTools Application, Cookies. Cookie <code>tm_refresh</code> harus <code>HttpOnly</code> dan <code>SameSite=Lax</code>; nilai token tidak boleh terlihat di <code>localStorage</code> atau <code>sessionStorage</code>.</li><li>Login sebagai <code>demo/demo123</code>, buka <code>/akun/admin</code>. Harus muncul "Akses ditolak", bukan halaman login dan bukan logout paksa.</li><li>Hapus cookie refresh lalu buka rute terproteksi. Shell harus mencoba refresh sekali, gagal, lalu mengarahkan ke <code>/masuk?next=...</code>.</li><li>Klik logout. Cookie harus dibersihkan, state user menjadi <code>null</code>, dan tombol kembali tidak boleh membuka halaman terproteksi.</li></ol><p>Uji juga deep link <code>/keranjang</code> saat belum login: setelah berhasil masuk, kamu harus kembali ke keranjang. Bila halaman admin masih terbuka untuk customer, periksa guard server sebelum menyalahkan React.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Access token', 'Token berumur pendek untuk memanggil API, disimpan di memori shell.'],
        ['Refresh token', 'Token berumur panjang untuk mendapat access token baru, disimpan di cookie httpOnly.'],
        ['httpOnly', 'Atribut cookie yang mencegah JavaScript membaca nilai cookie.'],
        ['SameSite', 'Atribut cookie yang membatasi pengiriman lintas situs untuk mengurangi CSRF.'],
        ['Rotasi refresh', 'Mengganti refresh token setiap pemakaian dan membatalkan token lama.'],
        ['getToken', 'Fungsi AppContext yang memberi remote access token yang masih berlaku.'],
        ['Rute terproteksi', 'Rute yang hanya dapat dibuka setelah pengguna terautentikasi.'],
        ['RBAC', 'Role-Based Access Control: izin ditentukan oleh peran pengguna.'],
        ['401', 'Belum terautentikasi atau token tidak valid; tindakannya refresh atau login.'],
        ['403', 'Sudah terautentikasi tetapi tidak berwenang; jangan logout atau retry.']
      ]
    }
  ],
  recap: [
    'Login hanya terjadi di shell; remote tidak menyimpan token atau memasang form login sendiri.',
    'Access token hidup di memori, sedangkan refresh token hidup di cookie httpOnly, Secure, dan SameSite.',
    'Rotasi refresh dan single-flight mencegah token lama dipakai ulang serta mencegah badai refresh.',
    'Rute terproteksi memakai RequireAuth dan RequireRole, tetapi server tetap pemilik otorisasi sebenarnya.',
    '401 berarti perlu autentikasi; 403 berarti akses ditolak. Logout harus mencabut sesi di server.'
  ]
});
