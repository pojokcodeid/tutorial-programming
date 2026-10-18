/* ============================================================
   Pelajaran Contoh Project React JS — Bab 4: Routing dengan React Router DOM
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-routing',
  title: 'Routing dengan React Router DOM',
  chapter: 'Komponen & Navigasi',
  duration: '14 menit',
  intro: [
    'Aplikasi React adalah <b>single page application</b>: dokumen HTML hanya dimuat sekali, sehingga pergantian "halaman" harus ditangani di dalam JavaScript. <b>React Router DOM</b> menyelesaikan masalah ini dengan peta rute — URL berubah, komponen yang dirender ikut berganti, tapi browser tidak memuat ulang halaman sama sekali.',
    'Di proyek Dashboard Toko, routing dipakai untuk dua hal sekaligus: menyusun peta halaman (dari /login sampai halaman 404) dan <b>menjaga halaman</b> — user yang belum login tidak akan pernah melihat isi /products, melainkan dilempar dulu ke form login. Routing juga menangkap parameter seperti id produk di /products/:id/edit, serta mengembalikan user ke halaman tujuannya setelah berhasil login.'
  ],
  objectives: [
    'Menyusun peta rute aplikasi dengan &lt;Routes&gt; dan &lt;Route&gt;',
    'Memahami nested route dan peran &lt;Outlet&gt; sebagai titik isi halaman',
    'Membuat layout route yang membungkus banyak rute anak sekaligus',
    'Membuat komponen penjaga rute (ProtectedRoute) dengan &lt;Navigate&gt; + state',
    'Membaca parameter rute dinamis dengan useParams',
    'Memakai useNavigate dan location.state untuk mengembalikan user ke tujuan awal setelah login'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta rute aplikasi</h3><p>Semua rute Dashboard Toko dideklarasikan di satu berkas: <code>src/App.jsx</code>. Secara garis besar peta rutenya begini: <code>/login</code> dan <code>/register</code> adalah halaman <b>publik</b>; semua halaman lain wajib login dengan pembungkus <code>ProtectedRoute</code>; di dalamnya semua halaman memakai layout <code>AppShell</code> (sidebar + header); dan rute terakhir <code>*</code> menangkap URL yang tidak dikenal menuju halaman 404.</p>'
    },
    {
      type: 'example',
      title: 'Daftar rute aplikasi (dibaca dari atas ke bawah)',
      lang: 'text',
      output: false,
      code: `/login              → halaman Login          (publik)
/register           → halaman Register       (publik)

    — mulai di sini semua rute dibungkus ProtectedRoute —
    — lalu dibungkus AppShell (sidebar + header + Outlet) —

/                   → Dashboard  (Route index)
/products           → Products   (tabel produk)
/products/new       → ProductForm (form tambah)
/products/:id/edit  → ProductForm (form ubah — rute dinamis)
/users              → Users      (dibungkus RoleGate admin)

*                   → NotFound   (halaman 404)`,
      explain: [
        'Urutan pembungkusan dari luar ke dalam: <b>ProtectedRoute → AppShell → halaman</b>. Setiap lapis punya satu tugas: login, layout, lalu isi.',
        'Rute <code>/login</code> dan <code>/register</code> sengaja berdiri di luar pembungkus — user yang belum login tidak mungkin melewati ProtectedRoute.',
        'Rute <code>*</code> diletakkan paling akhir agar menangkap semua URL yang belum cocok rute mana pun.'
      ]
    },
    {
      type: 'example',
      title: 'App.jsx — peta rute seluruh aplikasi',
      lang: 'jsx',
      output: false,
      code: `import { Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleGate from './components/RoleGate.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Products from './pages/Products.jsx';
import Register from './pages/Register.jsx';
import Users from './pages/Users.jsx';

/* Peta rute seluruh aplikasi:
   /login & /register publik → sisanya wajib login (ProtectedRoute)
   → di dalamnya memakai layout AppShell → /users dibungkus RoleGate admin */
export default function App() {
  const { ready } = useAuth();

  /* tunggu pemulihan sesi selesai agar halaman tidak "loncat" ke /login
     padahal token user masih ada di localStorage */
  if (!ready) {
    return (
      <div className="center-page">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route
            path="users"
            element={
              <RoleGate roles={['admin']}>
                <Users />
              </RoleGate>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}`,
      explain: [
        'Dua <code>&lt;Route&gt;</code> tanpa <code>path</code> — hanya element — adalah <b>layout route</b>: ProtectedRoute dan AppShell tidak punya halaman sendiri, mereka membungkus rute anak dan merender <code>&lt;Outlet/&gt;</code>.',
        'Di dalam nested route, path ditulis relatif tanpa garis miring di depan: <code>products</code> berarti /products, <code>products/:id/edit</code> berarti /products/7/edit.',
        '<code>Route index</code> adalah halaman bawaan saat URL berada persis di / — Dashboard tanpa perlu menulis path="/".',
        '<code>Route path="*"</code> adalah wildcard: URL apa pun yang tidak cocok rute lain jatuh ke NotFound, sehingga aplikasi tidak pernah menampilkan layar kosong.',
        'Sebelum peta rute dirender, App menunggu <code>ready</code> dari useAuth (menampilkan Spin) agar user dengan token valid tidak "loncat" ke /login saat aplikasi baru dimuat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>ProtectedRoute: penjaga halaman</h3><p>Kata kuncinya adalah <b>layout route</b>. Karena <code>ProtectedRoute</code> tidak punya path sendiri, ia bisa dipakai sebagai pembungkus banyak rute sekaligus — cukup satu komponen penjaga untuk seluruh halaman yang wajib login, tanpa mengulang pengecekan di tiap halaman.</p>'
    },
    {
      type: 'example',
      title: 'ProtectedRoute.jsx — hanya user login yang boleh lewat',
      lang: 'jsx',
      output: false,
      code: `import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

/* Komponen penjaga rute: hanya user login yang boleh masuk.
   Dipakai sebagai layout route sehingga semua rute anak di dalamnya
   otomatis terlindungi tanpa mengulang kode. */
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
        'Cek <code>user</code> dari useAuth: bila null, komponen mengembalikan <code>&lt;Navigate to="/login" /&gt;</code> — React Router langsung mengganti URL, bukan merender halaman.',
        'Tujuan awal disimpan lewat <code>state={{ from: location }}</code> — ibarat membukukan "tadi mau ke mana" sebelum user dilempar ke form login.',
        'Bila sudah login, <code>&lt;Outlet/&gt;</code> merender rute anak yang cocok — inilah alasan komponen ini layak jadi layout route.',
        'Halaman Login juga menolak user yang sudah login dengan baris <code>if (user) return &lt;Navigate to="/" replace /&gt;;</code> — form tidak pernah terlihat oleh user yang sesungguhnya sudah masuk.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Rute dinamis: satu form untuk tambah &amp; ubah</h3><p>Rute <code>products/new</code> dan <code>products/:id/edit</code> sama-sama dirender oleh <code>ProductForm</code> — satu komponen, dua pekerjaan. Pembedanya adalah keberadaan parameter <code>:id</code>, yang dibaca dengan hook <code>useParams()</code>. Perhatikan juga bahwa rute statis <code>products/new</code> ditulis eksplisit: React Router memberi peringkat lebih tinggi pada segmen statis daripada dinamis, sehingga /products/new tidak pernah salah tertangkap sebagai parameter.</p>'
    },
    {
      type: 'example',
      title: 'ProductForm.jsx — useParams membedakan mode tambah & ubah',
      lang: 'jsx',
      output: false,
      code: `import { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, InputNumber } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import * as productApi from '../api/productApi.js';

const KOSONG = { name: '', category: '', price: 0, stock: 0 };

/* Satu komponen untuk dua pekerjaan: menambah (/products/new)
   dan mengubah (/products/:id/edit) — dipisah oleh keberadaan :id */
export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [memuat, setMemuat] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;                       // mode tambah: tidak ada yang perlu dimuat
    productApi
      .get(id)
      .then((p) => form.setFieldsValue(p))
      .catch(() => message.error('Produk tidak ditemukan'))
      .finally(() => setMemuat(false));
  }, [id, form, message]);

  async function onFinish(values) {
    try {
      setLoading(true);
      if (id) {
        await productApi.update(id, values);      // mode ubah
        message.success('Produk diperbarui');
      } else {
        await productApi.create(values);          // mode tambah
        message.success('Produk ditambahkan');
      }
      navigate('/products');
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  }

  // ... bagian JSX (return) sengaja tidak ditampilkan di sini —
  // yang penting: judul halaman pun memakai id, mis.
  //   title={id ? 'Ubah Produk' : 'Produk Baru'}`,
      explain: [
        '<code>useParams()</code> mengembalikan objek berisi semua parameter rute aktif — di URL /products/7/edit hasilnya <code>&#123; id: &apos;7&apos; &#125;</code> (selalu string).',
        'Di /products/new, variabel <code>id</code> bernilai undefined sehingga <code>Boolean(id)</code> false: form langsung kosong dan tombol Simpan memanggil create, bukan update.',
        'Satu bentuk form, dua mode simpan — mengubah data cukup dengan melihat ada tidaknya id, tanpa menduplikasi berkas form.',
        'Setelah simpan, <code>navigate(&apos;/products&apos;)</code> mengantar user kembali ke tabel — pola umum setelah aksi CRUD berhasil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tujuan setelah login: dilempar, lalu dikembalikan</h3><p>Bayangkan user membuka <code>/products</code> langsung tanpa login. <code>ProtectedRoute</code> melemparnya ke <code>/login</code> sambil menyimpan tujuan awal di <code>state</code>. Sesudah login berhasil, halaman Login membaca state itu dan mengembalikan user ke tempat tujuan aslinya — bukan ke beranda, sesuai harapan user.</p>'
    },
    {
      type: 'example',
      title: 'Login.jsx — membaca tujuan awal & kembali ke sana',
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
  }`,
      explain: [
        '<code>location.state?.from?.pathname</code> membaca tujuan yang disimpan ProtectedRoute; optional chaining membuat baris ini aman saat user membuka /login langsung (state kosong → tujuan jadi /).',
        '<code>navigate(tujuan, { replace: true })</code> mengganti entri /login di riwayat browser — tombol Back tidak akan kembali ke form login, melainkan ke halaman sebelum /login.',
        'Alurnya lengkap begini: user buka /products → ProtectedRoute lempar ke /login dengan state → login sukses → user dikembalikan ke /products.',
        'Baris <code>if (user) return &lt;Navigate to="/" replace /&gt;</code> memastikan user yang sudah login tidak pernah melihat form login lagi, walau mengetik URL-nya manual.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyorot menu aktif dengan useLocation</h3><p>Sidebar di <code>AppShell</code> harus tahu halaman mana yang sedang terbuka agar item menu tersorot. React Router menyediakan hook <code>useLocation()</code> yang mengembalikan lokasi saat ini — dari <code>pathname</code>-nya, AppShell menghitung halaman aktif dari segmen pertama URL.</p>'
    },
    {
      type: 'example',
      title: 'AppShell.jsx — halamanAktif dari location.pathname',
      lang: 'jsx',
      output: false,
      code: `export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  /* halaman aktif dihitung dari segmen pertama URL, mis. /products/3/edit → /products */
  const halamanAktif = '/' + (location.pathname.split('/')[1] || '');

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/products', icon: <ShoppingCartOutlined />, label: 'Produk' },
    ...(isAdmin ? [{ key: '/users', icon: <TeamOutlined />, label: 'User' }] : [])
  ];

  // ... dipakai pada JSX Menu:
  //   <Menu
  //     items={menuItems}
  //     selectedKeys={[halamanAktif]}
  //     onClick={(e) => navigate(e.key)}
  //   />`,
      explain: [
        '<code>location.pathname</code> di /products/3/edit dipotong dengan <code>split(&apos;/&apos;)</code> menjadi [&apos;&apos;, &apos;products&apos;, &apos;3&apos;, &apos;edit&apos;] — segmen ke-1 (&apos;products&apos;) adalah halaman induknya.',
        'Karena menu hanya punya item untuk halaman utama, URL sedetail apa pun tetap menyorot menu yang benar: /products/3/edit menyorot item /products.',
        'Untuk URL beranda "/", <code>split</code> menghasilkan elemen kedua kosong, jadi fallback <code>|| &apos;&apos;</code> membuat halamanAktif kembali menjadi "/".',
        'Kunci menu dan URL memakai satu sumber kebenaran yang sama — highlight menu, navigasi onClick, dan URL tidak akan pernah saling bertengkar.'
      ]
    },
    {
      type: 'tip',
      title: 'Selalu pakai replace untuk redirect setelah aksi',
      text: 'Pakai <code>&lt;Navigate replace /&gt;</code> atau <code>navigate(path, { replace: true })</code> untuk semua perpindahan yang bersifat penggantian — redirect penjaga rute, kembali setelah login, dan pindah setelah logout (lihat baris logout di AppShell). Tanpa replace, tombol Back membawa user kembali ke halaman yang seharusnya sudah ia tinggalkan.'
    },
    {
      type: 'warn',
      title: 'Jangan simpan token atau rahasia di URL',
      text: 'Query string dan path bisa terekam di history browser, log server, riwayat proxy, dan tidak sengaja ikut terbagikan saat URL disalin. Token akses hanya boleh hidup di header Authorization (dipasang interceptor axios) atau penyimpanan yang aman — tidak pernah menjadi bagian URL.'
    },
    {
      type: 'live',
      title: 'Latihan: router mini tanpa reload',
      lang: 'html',
      hint: 'Klik tautan menu — URL berubah dan konten berganti tanpa memuat ulang halaman. Coba klik Produk saat masih belum masuk: kamu akan dilempar ke Login, dan setelah menekan Masuk dikembalikan ke Produk. Tombol Back meniru perilaku riwayat browser.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Router Mini</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
    .bar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
    .url { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 6px 10px; font-family: monospace; font-size: 13px; min-width: 140px; }
    nav { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
    nav a { padding: 6px 12px; border-radius: 6px; background: #fff; color: #1677ff; text-decoration: none; border: 1px solid #dbeafe; font-size: 13px; cursor: pointer; }
    nav a.on { background: #1677ff; color: #fff; border-color: #1677ff; }
    #konten { background: #fff; border-radius: 10px; padding: 20px; min-height: 140px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    #konten h2 { margin: 0 0 8px; color: #1677ff; font-size: 18px; }
    #konten p { margin: 0 0 12px; line-height: 1.6; }
    button { border: 0; border-radius: 6px; padding: 8px 14px; background: #1677ff; color: #fff; cursor: pointer; font-size: 13px; }
    button.abu { background: #8c8c8c; }
    .catatan { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 6px; padding: 8px 10px; font-size: 12px; margin-bottom: 12px; }
    .status { font-size: 12px; color: #888; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="bar">
    <span>URL:</span> <span class="url" id="url">/</span>
    <button class="abu" id="kembali">&larr; Back</button>
  </div>
  <nav id="menu"></nav>
  <div id="konten"></div>
  <div class="status" id="status"></div>
  <script>
    // Status login palsu — di aplikasi nyata isinya dari context/token
    let login = false;
    let tujuanTertunda = null;   // simulasi location.state.from
    const riwayat = [];

    const rute = {
      '/':         { judul: 'Beranda', isi: 'Dashboard berisi ringkasan toko. Halaman ini publik.', terproteksi: false },
      '/products': { judul: 'Produk',  isi: 'Tabel produk — halaman ini hanya untuk user login.', terproteksi: true },
      '/users':    { judul: 'User',    isi: 'Manajemen user — halaman terproteksi.', terproteksi: true },
      '/login':    { judul: 'Login',   isi: 'Form masuk untuk melanjutkan ke halaman tujuanmu.', terproteksi: false }
    };

    // ganti isi halaman tanpa reload (otomatis menyapu sorotan menu & status)
    function tampilkan(path) {
      const hal = rute[path];
      const wadah = document.getElementById('konten');
      let isi;

      if (!hal) {
        isi = '<h2>404</h2><p>Halaman <code>' + path + '</code> tidak dikenal — ditangkap wildcard route <code>*</code>.</p>';
      } else if (path === '/login') {
        isi = '<h2>Login</h2><p>' + hal.isi + '</p>' +
          (tujuanTertunda
            ? '<div class="catatan">Dilempar ke /login dari <b>' + tujuanTertunda + '</b> — tujuan disimpan, nanti kamu dikembalikan ke sana.</div>'
            : '') +
          '<button id="masuk">Masuk (palsu)</button>';
      } else {
        isi = '<h2>' + hal.judul + '</h2><p>' + hal.isi + '</p>';
      }
      wadah.innerHTML = isi;

      const tombol = document.getElementById('masuk');
      if (tombol) {
        tombol.onclick = () => {
          login = true;
          const kembali = tujuanTertunda || '/';
          tujuanTertunda = null;
          pergi(kembali, true);      // seperti navigate(tujuan, { replace: true })
        };
      }

      document.querySelectorAll('#menu a').forEach((a) => {
        a.classList.toggle('on', a.dataset.path === path);
      });
      document.getElementById('url').textContent = path;
      document.getElementById('status').textContent =
        'Status login: ' + (login ? 'true (sudah masuk)' : 'false (belum masuk)');
    }

    // "menjalankan" rute, termasuk penjaga rute terproteksi
    function pergi(path, ganti) {
      const hal = rute[path];
      if (hal && hal.terproteksi && !login) {
        tujuanTertunda = path;          // seperti state={{ from: location }}
        pergi('/login', true);          // seperti <Navigate replace />
        return;
      }
      if (ganti) riwayat[riwayat.length - 1] = path;   // replace: ganti entri terakhir
      else riwayat.push(path);                          // push: tambah entri baru
      tampilkan(path);
    }

    document.getElementById('kembali').onclick = () => {
      if (riwayat.length > 1) {
        riwayat.pop();
        tampilkan(riwayat[riwayat.length - 1]);
      }
    };

    // bangun menu + satu tautan uji wildcard
    ['/', '/products', '/users', '/halaman-ngawur'].forEach((p) => {
      const a = document.createElement('a');
      a.textContent = p === '/halaman-ngawur' ? '?? (uji 404)' : p;
      a.dataset.path = p;
      a.onclick = () => pergi(p);
      document.getElementById('menu').appendChild(a);
    });

    pergi('/');
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['SPA', 'Single Page Application — satu dokumen HTML dimuat sekali; pergantian halaman hanya mengganti isi, tanpa memuat ulang.'],
        ['Rute', 'Peta antara URL aplikasi dan komponen yang harus dirender pada URL itu.'],
        ['Route', 'Satu entri peta rute berupa path dan element; bisa beranak (nested route) untuk membentuk layout.'],
        ['Outlet', 'Titik kosong di dalam layout tempat React Router merender halaman anak yang cocok dengan URL.'],
        ['Nested route', 'Rute yang dideklarasikan di dalam rute induk tanpa path sehingga induk berperan sebagai layout.'],
        ['useParams', 'Hook yang mengembalikan parameter rute dinamis sebagai objek string, mis. { id: "7" }.'],
        ['useNavigate', 'Hook berisi fungsi navigate() untuk berpindah halaman secara programatis dari dalam kode.'],
        ['useLocation', 'Hook yang membaca lokasi saat ini: pathname, search, dan state yang dibawa Navigate.'],
        ['Wildcard route', 'Rute path="*" yang menangkap semua URL yang tidak cocok rute mana pun — tempat halaman 404.']
      ]
    }
  ],
  recap: [
    'App.jsx adalah satu-satunya peta rute: /login & /register publik, sisanya dibungkus ProtectedRoute lalu AppShell, wildcard * menuju NotFound.',
    'Route tanpa path adalah layout route; isinya adalah Outlet tempat halaman anak dirender.',
    'ProtectedRoute melempar user belum login ke /login sambil menyimpan tujuan di state={{ from: location }}, lalu merender Outlet bila sudah login.',
    'useParams membaca rute dinamis: satu ProductForm melayani /products/new (id undefined) dan /products/:id/edit (id terisi).',
    'location.state?.from?.pathname mengembalikan user ke halaman tujuan awal sesudah login, dengan navigate replace agar Back tidak ke /login.',
    'useLocation.pathname menjadi sumber halamanAktif untuk menyorot menu; jangan pernah menaruh token atau rahasia di URL.'
  ]
});
