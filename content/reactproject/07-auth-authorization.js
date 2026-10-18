/* ============================================================
   Pelajaran Contoh Project React JS — Bab 7: Authentication & Authorization
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-auth',
  title: 'Authentication & Authorization',
  chapter: 'Keamanan',
  duration: '15 menit',
  intro: [
    'Dua istilah yang sering tertukar: <b>authentication</b> menjawab "kamu siapa?" (login dengan username & password), sedangkan <b>authorization</b> menjawab "kamu boleh apa?" (admin boleh mengelola user, user biasa tidak). Aplikasi ini butuh keduanya — di sisi server maupun di sisi tampilan.',
    'Pelajaran ini merangkai semuanya: form login yang memanggil API, penyimpanan token, sesi yang dipulihkan saat halaman dibuka, penjaga rute, sampai penjaga peran untuk halaman admin.'
  ],
  objectives: [
    'Membedakan authentication dan authorization beserta penerapannya di proyek',
    'Membangun form login & register dengan Form Ant Design dan validasi bawaan',
    'Menyimpan token hasil login dan memulihkan sesi saat aplikasi dibuka',
    'Membuat komponen penjaga rute (ProtectedRoute) yang mengembalikan user ke tujuan aslinya',
    'Membuat penjaga peran (RoleGate) untuk halaman khusus admin',
    'Menerapkan otorisasi di tampilan tanpa menjadikannya satu-satunya pertahanan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Alur lengkap sebuah login</h3><p>Berikut perjalanan data ketika kamu mengetik <code>admin</code> / <code>admin123</code> lalu menekan tombol Masuk:</p><ul><li>Form Ant Design menyerahkan nilai ke <code>onFinish</code> (nilai tersimpan di state, bukan di DOM).</li><li><code>authApi.login()</code> mengirim <code>POST /auth/login</code> lewat instance axios.</li><li>Server membandingkan hash password, lalu membalas <code>{ accessToken, refreshToken, user }</code>.</li><li>AuthContext menyimpan token ke localStorage dan menaruh <code>user</code> di state → seluruh halaman yang membaca context ikut ter-update seketika.</li><li><code>navigate(tujuan)</code> membawa user ke halaman yang tadi ia tuju.</li></ul>'
    },
    {
      type: 'example',
      title: 'pages/Login.jsx — form masuk',
      lang: 'jsx',
      output: false,
      code: `export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* tujuan awal sebelum dipaksa ke /login (bisa juga beranda) */
  const tujuan = location.state?.from?.pathname || '/';

  if (user) return <Navigate to="/" replace />;   // sudah login? tidak perlu lihat form

  async function onFinish(values) {
    try {
      setError(null);
      setLoading(true);
      await login(values.username, values.password);
      navigate(tujuan, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal — pastikan backend berjalan (npm run server)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <Card className="auth-card" title="Masuk ke Dashboard">
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Username" name="username"
            rules={[{ required: true, message: 'Username wajib diisi' }]}>
            <Input placeholder="admin" autoComplete="username" />
          </Form.Item>
          <Form.Item label="Password" name="password"
            rules={[{ required: true, message: 'Password wajib diisi' }]}>
            <Input.Password placeholder="admin123" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>Masuk</Button>
        </Form>
      </Card>
    </div>
  );
}`,
      explain: [
        'Properti <code>name</code> pada Form.Item membuat Ant Design mengumpulkan nilai form sendiri — tidak perlu state terpisah untuk tiap input.',
        '<code>err.response?.data?.message</code> menampilkan pesan error dari server ("Username atau password salah") apa adanya; fallback menutupi kasus backend tidak menyala.',
        '<code>loading</code> pada tombol mencegah user menekan Masuk berkali-kali saat request masih berjalan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Register: validasi sebelum dikirim</h3><p>Halaman daftar memakai aturan validasi bawaan Ant Design, termasuk aturan yang <b>membandingkan dua field</b> — konfirmasi password harus sama dengan password. Aturan semacam ini dideklarasikan, bukan ditulis manual di dalam handler.</p>'
    },
    {
      type: 'example',
      title: 'Register: rules & validator silang',
      lang: 'jsx',
      output: false,
      code: `<Form.Item
  label="Password"
  name="password"
  dependencies={['konfirmasi']}
  rules={[
    { required: true, message: 'Password wajib diisi' },
    { min: 6, message: 'Minimal 6 karakter' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || getFieldValue('konfirmasi') === value) return Promise.resolve();
        return Promise.reject(new Error('Konfirmasi password tidak sama'));
      }
    })
  ]}
>
  <Input.Password autoComplete="new-password" />
</Form.Item>`,
      explain: [
        '<code>dependencies</code> memberi tahu field ini untuk dinilai ulang ketika field konfirmasi berubah — tanpanya pesan "tidak sama" tidak akan muncul saat user mengubah konfirmasi.',
        'Validator mengembalikan Promise: <code>resolve</code> untuk lolos, <code>reject</code> untuk menampilkan pesan.',
        'Sisi server tetap memvalidasi ulang (panjang password, username unik) — validasi form hanya kenyamanan, bukan keamanan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyimpan token & memulihkan sesi</h3><p>Hasil login disimpan <code>tokenStore.save(accessToken, refreshToken)</code> di localStorage. Ketika halaman dimuat ulang, AuthContext mencoba memanggil <code>/auth/me</code>; access token yang sudah mati akan ditangani interceptor (pelajaran 8) sehingga sesi pulih tanpa login ulang. Selama proses itu berjalan, aplikasi menampilkan spinner — itulah guna bendera <code>ready</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>ProtectedRoute: penjaga rute</h3><p>Semua halaman penting digantungkan di bawah satu rute induk tanpa <code>path</code>. Karena induknya adalah komponen, ia bisa memeriksa login lalu me-render <code>&lt;Outlet/&gt;</code> — atau menolaknya.</p>'
    },
    {
      type: 'example',
      title: 'components/ProtectedRoute.jsx',
      lang: 'jsx',
      output: false,
      code: `import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    /* simpan tujuan awal agar bisa dikembalikan setelah login */
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}`,
      explain: [
        'Karena komponen ini membungkus banyak rute sekaligus, aturan "wajib login" cukup ditulis sekali di App.jsx.',
        '<code>state={{ from: location }}</code> menitipkan alamat tujuan; halaman Login membacanya kembali lewat <code>location.state?.from?.pathname</code>.',
        '<code>replace</code> menggantikan entri history sehingga tombol Back tidak membawa user kembali ke halaman login yang sudah selesai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>RoleGate: penjaga peran</h3><p>User sudah login, tetapi halaman <code>/users</code> hanya untuk admin. Penjaga ini berbeda dengan ProtectedRoute: yang dijaga bukan status login, melainkan nilai <code>role</code>.</p>'
    },
    {
      type: 'example',
      title: 'components/RoleGate.jsx',
      lang: 'jsx',
      output: false,
      code: `import { Result } from 'antd';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RoleGate({ roles, children }) {
  const { user } = useAuth();

  if (!roles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="403 — Akses Ditolak"
        subTitle={'Halaman ini hanya untuk peran: ' + roles.join(', ') + '.'}
      />
    );
  }
  return children;
}

// dipakai di App.jsx:
// <Route path="users"
//   element={<RoleGate roles={['admin']}><Users /></RoleGate>} />`,
      explain: [
        'Properti <code>roles</code> membuat komponen ini bisa dipakai ulang untuk peran lain — mis. <code>roles={[\'admin\', \'kasir\']}</code>.',
        'Pesan 403 ditampilkan di tempat (bukan dialihkan) agar user tetap tahu bahwa halaman itu ada, hanya tidak berhak.',
        'Pengecekan peran ini akan diulang oleh server ketika halaman Users memanggil <code>GET /users</code> — lihat pelajaran 5.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Otorisasi di tampilan: kenyamanan, bukan pertahanan</h3><p>Tampilan juga menyembunyikan apa yang tidak boleh diakses: menu User hanya muncul untuk admin, dan tombol Ubah/Hapus dinonaktifkan bagi yang bukan pemilik. Ini membuat aplikasi terasa wajar — tetapi perlu diingat ini lapisan kenyamanan.</p>'
    },
    {
      type: 'example',
      title: 'Aturan peran di sisi tampilan',
      lang: 'jsx',
      output: false,
      code: `// AppShell.jsx — menu admin muncul hanya untuk admin
const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <ShoppingCartOutlined />, label: 'Produk' },
  ...(isAdmin ? [{ key: '/users', icon: <TeamOutlined />, label: 'User' }] : [])
];

// ProductTable.jsx — tombol hanya aktif untuk admin atau pemilik
const bolehUbah = isAdmin || produk.createdBy === user.id;
return (
  <Button size="small" icon={<EditOutlined />} disabled={!bolehUbah} onClick={() => onEdit(produk)}>
    Ubah
  </Button>
);`,
      explain: [
        'Menyembunyikan menu tidak menghapus route: user masih bisa mengetik <code>/users</code> langsung di bilah alamat — dan memang RoleGate-lah yang menolaknya.',
        'Tombol yang dinonaktifkan pun masih bisa dipancing lewat DevTools; itulah alasan server mengulang pengecekan yang sama.',
        'Satu sumber peran: <code>isAdmin</code> berasal dari context, sehingga tidak ada tempat nilai peran disalin ulang.'
      ]
    },
    {
      type: 'warn',
      title: 'Menyembunyikan tombol bukan otorisasi',
      text: 'Buktikan sendiri dengan terminal: login sebagai <code>budi</code>, lalu jalankan <code>curl -X DELETE http://localhost:3001/products/1 -H "Authorization: Bearer TOKEN_BUDI"</code>. Server membalas <b>403</b> karena produk itu milik admin. Backend tidak pernah peduli apakah tombolnya disembunyikan atau tidak — yang dibuktikan hanyalah token dan datanya.'
    },
    {
      type: 'tip',
      title: 'Uji skenario yang salah, bukan hanya yang benar',
      text: 'Daftar pengujian yang layak dijalankan berkali-kali: password salah (muncul pesan server), mengakses <code>/products</code> tanpa login (dilempar ke /login), user biasa membuka <code>/users</code> (Result 403), dan mencoba menghapus produk orang lain (tombol mati + 403 dari server). Skenario gagal inilah yang membuktikan pengamanmu bekerja.'
    },
    {
      type: 'live',
      title: 'Latihan: simulasi login & penjaga rute',
      lang: 'html',
      hint: 'Masuklah dengan admin/admin123 atau budi/budi123, lalu coba buka route /users sebagai budi — perhatikan bagaimana penjaga rute dan penjaga peran menangani berbeda.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Auth & Route Guard</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
    .app { max-width: 720px; margin: 0 auto; }
    .box { background: #fff; border-radius: 10px; padding: 18px; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 14px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 12px; }
    .tab { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .tab.on { background: #1677ff; color: #fff; border-color: #1677ff; }
    input { display: block; width: 100%; box-sizing: border-box; padding: 8px; margin-bottom: 10px; border: 1px solid #d9d9d9; border-radius: 6px; }
    button { padding: 8px 16px; background: #1677ff; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
    .out { font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; }
    .ok { background: #f6ffed; border: 1px solid #b7eb8f; color: #0a7d32; }
    .no { background: #fff1f0; border: 1px solid #ffa39e; color: #cf1322; }
    .info { background: #e6f4ff; border: 1px solid #91caff; color: #0958d9; }
  </style>
</head>
<body>
  <div class="app">
    <div class="box">
      <b>Status:</b> <span id="user">belum login</span> — peran: <span id="role">—</span>
    </div>
    <div class="box">
      <div class="tabs" id="tabs"></div>
      <div id="isi"></div>
    </div>
  </div>
  <script>
    const akun = { admin: { role: 'admin', pass: 'admin123' }, budi: { role: 'user', pass: 'budi123' } };
    let sesi = null;                 // { username, role }
    let rute = '/';

    const halaman = {
      '/':          { judul: 'Dashboard',            peran: null },
      '/products':  { judul: 'Produk',               peran: null },
      '/users':     { judul: 'Manajemen User',       peran: 'admin' },
      '/login':     { judul: 'Form Login',           peran: null }
    };

    function gambar() {
      document.getElementById('user').textContent = sesi ? sesi.username : 'belum login';
      document.getElementById('role').textContent = sesi ? sesi.role : '—';
      const tabs = document.getElementById('tabs');
      tabs.innerHTML = '';
      Object.keys(halaman).forEach(r => {
        const t = document.createElement('div');
        t.className = 'tab' + (r === rute ? ' on' : '');
        t.textContent = r;
        t.onclick = () => { rute = r; gambar(); };
        tabs.appendChild(t);
      });

      const isi = document.getElementById('isi');
      const hal = halaman[rute];

      if (rute === '/login') {
        isi.innerHTML =
          '<input id="u" placeholder="username"><input id="p" type="password" placeholder="password">' +
          '<button onclick="masuk()">Masuk</button><div id="pesan"></div>';
        return;
      }
      // penjaga rute: wajib login
      if (!sesi) {
        isi.innerHTML = '<div class="out no">ProtectedRoute: belum login → dialihkan ke /login ' +
          '<i>(tujuan asli ' + rute + ' disimpan di state)</i></div>';
        return;
      }
      // penjaga peran
      if (hal.peran && sesi.role !== hal.peran) {
        isi.innerHTML = '<div class="out no">RoleGate: 403 — halaman ini hanya untuk peran: ' + hal.peran + '.</div>';
        return;
      }
      isi.innerHTML = '<div class="out ok">✔ ' + hal.judul + ' dirender (Outlet dari AppShell)</div>';
    }

    function masuk() {
      const u = document.getElementById('u').value.trim();
      const p = document.getElementById('p').value;
      const pesan = document.getElementById('pesan');
      if (akun[u] && akun[u].pass === p) {
        sesi = { username: u, role: akun[u].role };
        rute = '/';                    // navigate(tujuan, { replace: true })
        gambar();
      } else {
        pesan.innerHTML = '<div class="out no" style="margin-top:10px">401 — Username atau password salah</div>';
      }
    }

    gambar();
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Authentication', 'Memverifikasi identitas pengguna — "kamu siapa?".'],
        ['Authorization', 'Memutuskan cakupan akses — "kamu boleh apa?".'],
        ['ProtectedRoute', 'Komponen React yang merender Outlet hanya bila user sudah login.'],
        ['RoleGate', 'Komponen yang membatasi halaman berdasarkan peran (role).'],
        ['Controlled form', 'Nilai input dipegang oleh state React; di Ant Design dikelola Form + Form.Item.'],
        ['Sesi (session)', 'Rentang waktu user dianggap login; dipulihkan dari token tersimpan saat aplikasi dibuka.'],
        ['State navigasi', 'Data tambahan yang dibawa bersama Navigate ({ state }), terbaca lewat useLocation.']
      ]
    }
  ],
  recap: [
    'Authentication = identitas (login); authorization = cakupan akses (peran & kepemilikan).',
    'Form Ant Design mengumpulkan nilai via Form.Item; server tetap memvalidasi ulang semuanya.',
    'Token disimpan di localStorage, sesi dipulihkan lewat /auth/me dengan bendera ready agar tidak ada halaman yang "loncat" ke login.',
    'ProtectedRoute mengamankan banyak rute sekaligus dan mengembalikan user ke tujuan awalnya setelah login.',
    'RoleGate membatasi halaman berdasarkan peran, mis. /users hanya untuk admin.',
    'Menyembunyikan menu dan menonaktifkan tombol hanyalah kenyamanan — server selalu mengulang pengecekan.'
  ]
});
