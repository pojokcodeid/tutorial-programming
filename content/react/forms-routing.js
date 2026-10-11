/* ============================================================
   Pelajaran React — Bab 5: Form & Routing
   (topik info.md:
    - "Form Handling: controlled vs uncontrolled,
       validasi/RHF + Zod atau Yup"
    - "Routing: React Router DOM (dynamic routes, nested routes,
       useNavigate, useParams)")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 11: Form Handling di React ---------- */
window.REACT_LESSONS.push({
  id: 'form-handling',
  title: 'Form Handling di React',
  chapter: 'Interaksi Lanjutan',
  duration: '15 menit',
  intro: [
    'Form adalah jantung banyak aplikasi: login, pendaftaran, pencarian, checkout. Di React ada dua gaya mengelola form: <b>controlled</b> (nilai dikendalikan state) dan <b>uncontrolled</b> (browser yang menyimpan nilainya).',
    'Pelajaran ini membahas keduanya, cara validasi sederhana, hingga memakai library populer <b>React Hook Form</b> dengan <b>Zod</b>.'
  ],
  objectives: [
    'Memahami perbedaan controlled & uncontrolled component',
    'Mengelola input teks, textarea, select, dan checkbox',
    'Menangani submit form dan validasi sederhana',
    'Mengenal React Hook Form + Zod untuk form yang kompleks'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Controlled component</b> adalah input yang nilainya diikat ke state React: nilai ditulis di atribut <code>value</code> dan perubahan ditangkap oleh <code>onChange</code>. Karena React yang "memegang" nilainya, kita bisa memvalidasi atau memanipulasinya setiap kali pengguna mengetik. <b>Uncontrolled component</b> menyerahkan nilai ke DOM; kita membacanya saat dibutuhkan, biasanya lewat <code>ref</code> atau <code>FormData</code>.</p>'
    },
    {
      type: 'example',
      title: 'Controlled input',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

function FormNama() {
  const [nama, setNama] = useState('');

  function kirim(e) {
    e.preventDefault();               // cegah halaman reload
    alert('Halo, ' + nama + '!');
  }

  return (
    <form onSubmit={kirim}>
      <label>
        Nama:
        <input
          value={nama}                 // nilai dari state
          onChange={(e) => setNama(e.target.value)} // simpan tiap ketikan
        />
      </label>
      <button type="submit">Kirim</button>
      <p>Kamu mengetik: {nama}</p>     {/* tampilan mengikuti state */}
    </form>
  );
}`,
      explain: [
        'Pasangan <code>value</code> + <code>onChange</code> membuat React menjadi "sumber kebenaran" nilai input.',
        '<code>e.preventDefault()</code> mencegah perilaku bawaan form yang memuat ulang halaman.',
        'Karena nilai ada di state, kita bisa menampilkan atau memvalidasinya langsung.'
      ]
    },
    {
      type: 'example',
      title: 'Berbagai jenis field dalam satu form',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

function FormProfil() {
  const [form, setForm] = useState({
    nama: '',
    bio: '',
    kota: 'jakarta',
    setuju: false
  });

  // Satu handler untuk semua field: pakai atribut name.
  function ubah(e) {
    const { name, value, type, checked } = e.target;
    setForm((lama) => ({
      ...lama,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  return (
    <form>
      <input name="nama" value={form.nama} onChange={ubah} placeholder="Nama" />

      <textarea name="bio" value={form.bio} onChange={ubah} placeholder="Bio" />

      <select name="kota" value={form.kota} onChange={ubah}>
        <option value="jakarta">Jakarta</option>
        <option value="bandung">Bandung</option>
        <option value="surabaya">Surabaya</option>
      </select>

      <label>
        <input type="checkbox" name="setuju" checked={form.setuju} onChange={ubah} />
        Saya setuju
      </label>

      <p>{JSON.stringify(form)}</p>
    </form>
  );
}`,
      explain: [
        'Untuk checkbox, nilai yang diambil adalah <code>checked</code> (boolean), bukan <code>value</code>.',
        'Satu handler <code>ubah</code> melayani semua field dengan membaca <code>e.target.name</code>.',
        'Properti dinamis <code>[name]: value</code> menyimpan nilai ke field yang sesuai.'
      ]
    },
    {
      type: 'example',
      title: 'Validasi sederhana saat submit',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

function FormLogin() {
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [pesan, setPesan] = useState('');

  function kirim(e) {
    e.preventDefault();

    if (!email.includes('@')) {
      setPesan('❌ Email tidak valid.');
      return;
    }
    if (sandi.length < 6) {
      setPesan('❌ Kata sandi minimal 6 karakter.');
      return;
    }
    setPesan('✅ Berhasil masuk!');
  }

  return (
    <form onSubmit={kirim} noValidate>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={sandi} onChange={(e) => setSandi(e.target.value)} placeholder="Sandi" />
      <button type="submit">Masuk</button>
      {pesan && <p>{pesan}</p>}
    </form>
  );
}`,
      explain: [
        'Validasi dijalankan saat submit, lalu menampilkan pesan bila ada yang salah.',
        '<code>noValidate</code> mematikan validasi bawaan browser agar kita bisa memakai aturan sendiri.',
        'Untuk form kecil, cara ini sudah cukup; tidak perlu library.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk form yang besar (banyak field, aturan berlapis), menulis state satu per satu melelahkan. Di sinilah library membantu. <b>React Hook Form</b> menangani state & error dengan ringkas, sedangkan <b>Zod</b> mendefinisikan skema validasi yang jelas dan bisa dipakai ulang.</p>'
    },
    {
      type: 'example',
      title: 'Uncontrolled dengan ref (tanpa state)',
      lang: 'jsx',
      output: false,
      code: `import { useRef } from 'react';

function FormCari() {
  const inputRef = useRef(null);

  function kirim(e) {
    e.preventDefault();
    alert('Mencari: ' + inputRef.current.value);
  }

  return (
    <form onSubmit={kirim}>
      {/* Tidak ada value / onChange — DOM yang menyimpan nilainya */}
      <input ref={inputRef} defaultValue="" placeholder="Kata kunci" />
      <button type="submit">Cari</button>
    </form>
  );
}

// Cara modern lain: ambil semua nilai sekaligus lewat FormData.
function kirimDenganFormData(e) {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  console.log(Object.fromEntries(data));
}`,
      explain: [
        'Uncontrolled cocok bila kita hanya perlu membaca nilai saat submit.',
        'Gunakan <code>defaultValue</code>, bukan <code>value</code>, agar React tidak mengunci input.',
        '<code>FormData</code> mengambil semua field berdasarkan atribut <code>name</code>-nya sekaligus.'
      ]
    },
    {
      type: 'example',
      title: 'React Hook Form + Zod (form kompleks)',
      lang: 'jsx',
      output: false,
      code: `// Pemasangan:
//   npm install react-hook-form zod @hookform/resolvers

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 1) Definisikan aturan dengan skema Zod
const skema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email salah'),
  umur: z.coerce.number().min(17, 'Minimal 17 tahun')
});

function FormDaftar() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(skema) });

  async function onSubmit(data) {
    await fetch('/api/daftar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('nama')} placeholder="Nama" />
      {errors.nama && <p className="error">{errors.nama.message}</p>}

      <input {...register('email')} placeholder="Email" />
      {errors.email && <p className="error">{errors.email.message}</p>}

      <input {...register('umur')} placeholder="Umur" />
      {errors.umur && <p className="error">{errors.umur.message}</p>}

      <button disabled={isSubmitting}>Daftar</button>
    </form>
  );
}`,
      explain: [
        '<code>register("nama")</code> menghubungkan input ke React Hook Form tanpa state manual.',
        'Skema <b>Zod</b> mendefinisikan aturan sekaligus pesan errornya.',
        '<code>zodResolver</code> menghubungkan skema itu ke React Hook Form.',
        'Pesan error tersedia lewat <code>formState.errors</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Pilih sesuai kebutuhan',
      text: 'Form sederhana (1–3 field) → controlled state biasa. Form menengah dengan sedikit validasi → bisa tetap manual. Form besar, banyak field, butuh validasi & performa → <b>React Hook Form + Zod</b>. Hindari menulis library besar untuk form kecil.'
    },
    {
      type: 'warn',
      title: 'input value tanpa onChange = read-only',
      text: 'Kesalahan klasik: menulis <code>&lt;input value={nama} /&gt;</code> tetapi lupa <code>onChange</code>. Input akan tampak bisa diketik tetapi tidak berubah satu huruf pun, disertai peringatan di konsol. Ingat pasangannya: <code>value</code> selalu berpasangan dengan <code>onChange</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Controlled component', 'Input yang nilainya dikendalikan state React.'],
        ['Uncontrolled component', 'Input yang nilainya disimpan DOM, dibaca lewat ref/FormData.'],
        ['e.preventDefault()', 'Mencegah aksi bawaan, mis. reload halaman saat submit.'],
        ['Validasi', 'Pemeriksaan apakah isian memenuhi aturan sebelum diproses.'],
        ['React Hook Form', 'Library pengelola form yang ringan & efisien.'],
        ['Zod', 'Library pembuat skema validasi TypeScript-friendly.'],
        ['ZodResolver', 'Jembatan antara skema Zod dan React Hook Form.'],
        ['defaultValue', 'Nilai awal untuk uncontrolled input.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: validasi form',
      lang: 'html',
      hint: 'Coba kirim dengan email atau sandi yang salah, lalu perbaiki. Di React, logika yang sama ditulis di dalam function handler onSubmit.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Form</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; }
    form { max-width: 320px; }
    input { display: block; width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 10px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 15px; }
    button { width: 100%; padding: 10px; border: 0; border-radius: 8px; background: #16a34a; color: #fff; font-size: 15px; cursor: pointer; }
    .pesan { margin-top: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <h2>Masuk</h2>
  <form id="f" novalidate>
    <input id="email" placeholder="Email" />
    <input id="sandi" type="password" placeholder="Kata sandi" />
    <button type="submit">Masuk</button>
  </form>
  <div class="pesan" id="pesan"></div>
  <script>
    // Di React, handler ini menjadi fungsi onSubmit dengan e.preventDefault().
    document.getElementById("f").addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const sandi = document.getElementById("sandi").value;
      const pesan = document.getElementById("pesan");
      if (email.indexOf("@") === -1) { pesan.textContent = "❌ Email tidak valid."; return; }
      if (sandi.length < 6) { pesan.textContent = "❌ Kata sandi minimal 6 karakter."; return; }
      pesan.textContent = "✅ Berhasil masuk!";
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Controlled component memakai value + onChange; uncontrolled memakai ref/FormData.',
    'e.preventDefault() mencegah form memuat ulang halaman.',
    'Untuk checkbox gunakan e.target.checked, untuk input gunakan e.target.value.',
    'Validasi sederhana bisa ditulis manual di handler submit.',
    'Form kompleks lebih rapi dengan React Hook Form + Zod.',
    'input value wajib berpasangan dengan onChange, jika tidak akan read-only.'
  ]
});

/* ---------- Pelajaran 12: Routing di React ---------- */
window.REACT_LESSONS.push({
  id: 'routing-react-router',
  title: 'Routing dengan React Router',
  chapter: 'Interaksi Lanjutan',
  duration: '16 menit',
  intro: [
    'Aplikasi SPA tetap butuh "halaman": beranda, produk, detail produk, login. Karena halaman tidak benar-benar dimuat ulang, kita butuh <b>router</b> untuk memetakan alamat (URL) ke komponen. Library standarnya adalah <b>React Router DOM</b>.',
    'Pelajaran ini membahas pemasangan, rute dasar, navigasi, rute dinamis, hingga rute bersarang.'
  ],
  objectives: [
    'Memasang dan mengonfigurasi React Router DOM',
    'Membuat rute dengan Routes & Route',
    'Bernavigasi dengan Link, NavLink, dan useNavigate',
    'Membaca parameter dinamis dengan useParams',
    'Menyusun rute bersarang dengan Outlet'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>React Router DOM</b> menghubungkan URL di address bar dengan komponen yang ditampilkan. Saat URL berubah, ia mengganti komponen tanpa memuat ulang halaman — persis semangat SPA. Pasang dulu paketnya:</p>'
    },
    {
      type: 'example',
      title: 'Pemasangan React Router',
      lang: 'bash',
      output: false,
      code: `# Versi 6/7 ke atas
npm install react-router-dom

# Jalankan proyek seperti biasa
npm run dev`,
      explain: [
        '<code>react-router-dom</code> adalah paket untuk aplikasi React berbasis browser.',
        'Setelah terpasang, router bisa dipakai di <code>main.jsx</code> atau <code>App.jsx</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Rute dasar: Routes & Route',
      lang: 'jsx',
      output: false,
      code: `import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Beranda() { return <h1>🏠 Beranda</h1>; }
function Tentang() { return <h1>ℹ️ Tentang</h1>; }
function TidakAda() { return <h1>404 — Halaman tidak ditemukan</h1>; }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Beranda />} />
        <Route path="/tentang" element={<Tentang />} />
        <Route path="*" element={<TidakAda />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;`,
      explain: [
        '<code>BrowserRouter</code> membungkus aplikasi dan mengaktifkan kemampuan routing.',
        '<code>Routes</code> berisi kumpulan <code>Route</code>; React Router memilih yang cocok dengan URL.',
        '<code>path="*"</code> adalah rute penangkap untuk alamat yang tidak dikenal (halaman 404).'
      ]
    },
    {
      type: 'example',
      title: 'Navigasi dengan Link & NavLink',
      lang: 'jsx',
      output: false,
      code: `import { Link, NavLink } from 'react-router-dom';

function Menu() {
  return (
    <nav>
      {/* Link: seperti <a>, tetapi tidak memuat ulang halaman */}
      <Link to="/">Beranda</Link>
      <Link to="/tentang">Tentang</Link>

      {/* NavLink: otomatis diberi kelas saat rutenya aktif */}
      <NavLink
        to="/profil"
        className={({ isActive }) => (isActive ? 'aktif' : '')}
      >
        Profil
      </NavLink>
    </nav>
  );
}

// SALAH: <a href="/tentang"> memuat ulang seluruh halaman.
// BENAR: <Link to="/tentang"> menavigasi tanpa reload.`,
      explain: [
        'Gunakan <code>&lt;Link&gt;</code>, bukan <code>&lt;a&gt;</code>, agar tidak terjadi reload.',
        '<code>NavLink</code> berguna untuk menu: ia bisa menandai tautan yang sedang aktif.',
        '<code>to</code> adalah tujuan; <code>className</code> bisa berupa function yang menerima <code>isActive</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Rute dinamis dengan useParams',
      lang: 'jsx',
      output: false,
      code: `import { Routes, Route, Link, useParams } from 'react-router-dom';

function DaftarProduk() {
  const produk = [
    { id: 'kopi', nama: 'Kopi' },
    { id: 'teh', nama: 'Teh' }
  ];
  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id}>
          <Link to={'/produk/' + p.id}>{p.nama}</Link>
        </li>
      ))}
    </ul>
  );
}

function DetailProduk() {
  const { id } = useParams();      // ambil :id dari URL
  return <h1>Detail produk: {id}</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/produk" element={<DaftarProduk />} />
      <Route path="/produk/:id" element={<DetailProduk />} />
    </Routes>
  );
}`,
      explain: [
        'Tanda titik dua <code>:id</code> menandai bagian URL yang dinamis.',
        '<code>useParams()</code> mengembalikan objek berisi nilai parameter, mis. <code>{ id: "kopi" }</code>.',
        'Dengan ini, satu komponen <code>DetailProduk</code> melayani semua id produk.'
      ]
    },
    {
      type: 'example',
      title: 'Rute bersarang (nested) dengan Outlet',
      lang: 'jsx',
      output: false,
      code: `import { Routes, Route, Outlet, NavLink } from 'react-router-dom';

function TataLetak() {
  return (
    <div>
      <h1>Aplikasi Saya</h1>
      <nav>
        <NavLink to="/">Beranda</NavLink> | <NavLink to="/akun">Akun</NavLink>
      </nav>
      {/* Outlet: tempat komponen anak rute dirender */}
      <Outlet />
    </div>
  );
}

function Beranda() { return <p>Selamat datang.</p>; }

function Akun() {
  return (
    <div>
      <h2>Akun</h2>
      <Routes>
        <Route path="profil" element={<p>Profil pengguna</p>} />
        <Route path="pengaturan" element={<p>Pengaturan akun</p>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<TataLetak />}>
        <Route index element={<Beranda />} />
        <Route path="akun/*" element={<Akun />} />
      </Route>
    </Routes>
  );
}`,
      explain: [
        'Rute induk <code>TataLetak</code> selalu tampil; isi anaknya dirender di posisi <code>&lt;Outlet /&gt;</code>.',
        '<code>index</code> menandai rute bawaan saat URL tepat "/" (tidak ada segmen tambahan).',
        'Pola ini menghindari menulis ulang menu/navbar di setiap halaman.'
      ]
    },
    {
      type: 'example',
      title: 'Navigasi lewat kode: useNavigate',
      lang: 'jsx',
      output: false,
      code: `import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function FormLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  function kirim(e) {
    e.preventDefault();
    // ...proses login...
    navigate('/dasbor');            // pindah halaman lewat kode
    // navigate(-1);                // kembali ke halaman sebelumnya
    // navigate('/dasbor', { replace: true }); // ganti riwayat, bukan tambah
  }

  return (
    <form onSubmit={kirim}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button>Masuk</button>
    </form>
  );
}`,
      explain: [
        '<code>useNavigate()</code> memberi kita function untuk berpindah halaman dari kode — misalnya setelah login berhasil.',
        '<code>navigate(-1)</code> setara tombol "kembali" di browser.',
        '<code>replace: true</code> menggantikan entri riwayat, berguna untuk halaman login agar tidak bisa di-back ulang.'
      ]
    },
    {
      type: 'tip',
      title: 'Buat layout route untuk kerangka aplikasi',
      text: 'Letakkan navbar, sidebar, dan footer di satu komponen "TataLetak" dengan <code>&lt;Outlet /&gt;</code>. Semua halaman di bawahnya otomatis memakai kerangka itu. Ini menjaga tampilan konsisten dan menghindari duplikasi kode.'
    },
    {
      type: 'warn',
      title: 'SPA di hosting butuh "fallback" ke index.html',
      text: 'Karena semua rute ditangani JavaScript, memuat <code>https://situs.com/produk/kopi</code> secara langsung bisa menghasilkan 404 di server. Atur hosting agar semua permintaan yang tidak menemukan berkas dialihkan ke <code>index.html</code> (perilaku "SpaFallback"/rewrite). Di Vite + Netlify/Vercel hal ini biasanya diatur dengan satu baris konfigurasi.'
    },
    {
      type: 'vocab',
      items: [
        ['Router', 'Alat yang memetakan URL ke komponen.'],
        ['BrowserRouter', 'Pembungkus yang mengaktifkan routing berbasis URL browser.'],
        ['Route', 'Aturan pemetaan satu path ke satu elemen/komponen.'],
        ['Link / NavLink', 'Komponen navigasi tanpa reload; NavLink tahu rutenya aktif.'],
        ['useParams', 'Hook untuk membaca parameter dinamis dari URL.'],
        ['useNavigate', 'Hook untuk berpindah halaman lewat kode.'],
        ['Outlet', 'Penanda tempat rute anak dirender di dalam rute induk.'],
        ['Nested route', 'Rute yang berada di dalam rute lain.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: routing tanpa reload',
      lang: 'html',
      hint: 'Perhatikan alamat di address bar berubah setelah tanda #, tetapi halaman tidak dimuat ulang. React Router mengurus ini otomatis lewat URL path.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Router Mini</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 22px; background: #0f172a; color: #e2e8f0; }
    nav a { color: #61dafb; margin-right: 14px; text-decoration: none; font-weight: bold; }
    #view { margin-top: 18px; background: #1e293b; padding: 18px; border-radius: 12px; }
  </style>
</head>
<body>
  <h2>Mini Router</h2>
  <nav>
    <a href="#/beranda">Beranda</a>
    <a href="#/produk">Produk</a>
    <a href="#/produk/kopi">Produk: Kopi</a>
  </nav>
  <div id="view"></div>
  <script>
    // Simulasi sederhana: React Router memetakan path ke komponen.
    function rute(path) {
      if (path === "/produk/kopi") return "<h3>Detail Produk</h3><p>Nama: kopi</p>";
      if (path === "/produk") return "<h3>Daftar Produk</h3><p>Kopi, Teh, Susu</p>";
      return "<h3>Beranda</h3><p>Selamat datang di SPA!</p>";
    }
    function gambar() {
      const path = location.hash.replace("#", "") || "/beranda";
      document.getElementById("view").innerHTML = rute(path);
    }
    window.addEventListener("hashchange", gambar);
    gambar();
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'React Router DOM memetakan URL ke komponen tanpa reload.',
    'BrowserRouter + Routes + Route mendefinisikan rute; path="*" untuk 404.',
    'Gunakan Link/NavLink, bukan <a>, agar tidak memuat ulang halaman.',
    'useParams membaca parameter dinamis seperti :id; useNavigate berpindah lewat kode.',
    'Rute bersarang memakai Outlet sebagai tempat anak dirender.',
    'Di hosting SPA, atur fallback semua rute ke index.html.'
  ]
});
