/* ============================================================
   Pelajaran React — Bab 1: Pendahuluan
   (topik info.md:
    - "Pengenalan React: Apa itu SPA (Single Page Application),
       konsep Virtual DOM, dan mengapa menggunakan React."
    - "Setup Project: Menggunakan Vite atau Create React App.")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 1: Pengenalan React ---------- */
window.REACT_LESSONS.push({
  id: 'pengenalan-react',
  title: 'Pengenalan React',
  chapter: 'Pendahuluan',
  duration: '10 menit',
  intro: [
    '<b>React</b> adalah <b>library JavaScript</b> untuk membangun <b>antarmuka pengguna</b> (user interface) di web. Dibuat oleh tim Facebook (Meta) pada <b>2013</b>, React kini menjadi salah satu alat paling populer di dunia untuk membuat aplikasi web modern.',
    'Di pelajaran ini kita akan memahami tiga pondasi React: cara berpikir <b>berbasis komponen</b>, istilah <b>Single Page Application (SPA)</b>, dan teknologi <b>Virtual DOM</b> yang membuat React cepat.'
  ],
  objectives: [
    'Memahami apa itu React dan mengapa ia populer',
    'Menjelaskan konsep Single Page Application (SPA)',
    'Memahami cara kerja Virtual DOM',
    'Mengenal cara berpikir berbasis komponen'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>React</b> memecah tampilan halaman menjadi bagian-bagian kecil yang disebut <b>komponen</b>. Setiap komponen adalah "potongan UI" yang bisa berdiri sendiri — misalnya tombol, kartu produk, atau bilah navigasi. Komponen kecil disusun menjadi komponen besar, sampai membentuk satu halaman penuh.</p><p>React murni hanya mengurus <b>tampilan dan perilakunya</b>. Ia bukan framework lengkap: routing, pengambilan data, dan state global biasanya ditangani library tambahan (akan kita pelajari nanti).</p>'
    },
    {
      type: 'text',
      html: '<p>Di web tradisional, setiap kali pengguna pindah halaman browser akan <b>memuat ulang seluruh halaman</b> dari server. Cara ini disebut <b>MPA</b> (Multi Page Application). React memakai pendekatan lain: <b>SPA</b> (Single Page Application) — satu halaman dimuat <b>sekali saja</b>, lalu isinya diganti-ganti lewat JavaScript tanpa reload.</p>'
    },
    {
      type: 'text',
      html: '<table class="vocab"><tr><th>Aspek</th><th>MPA (tradisional)</th><th>SPA (React)</th></tr><tr><td>Perpindahan halaman</td><td>Memuat ulang seluruh dokumen</td><td>Mengganti bagian konten saja</td></tr><tr><td>Kecepatan setelah dimuat</td><td>Terasa lambat karena reload</td><td>Terasa mulus &amp; instan</td></tr><tr><td>Permintaan ke server</td><td>HTML lengkap setiap halaman</td><td>Cukup data (JSON)</td></tr><tr><td>Contoh</td><td>Website berita klasik</td><td>Gmail, Facebook, X</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Alur MPA vs SPA',
      lang: 'text',
      output: false,
      code: `MPA — tiap klik membuat dokumen dimuat ulang:

  [Halaman Awal] --klik--> (server kirim HTML baru) --> [Halaman Baru]
        reload penuh          browser berkedip        reload penuh

SPA — halaman tetap, kontennya ditukar:

  [Aplikasi React] --klik--> JavaScript mengganti konten --> [Tampilan Baru]
        tidak reload          mulus, secepat kilat        tidak reload`,
      explain: [
        'Pada SPA, browser hanya memuat satu dokumen HTML + berkas JavaScript.',
        'Saat pengguna "berpindah halaman", React mengganti <b>komponen</b> yang tampil — bukan memuat dokumen baru.',
        'Karena itu aplikasi terasa cepat dan responsif, seperti aplikasi desktop.'
      ]
    },
    {
      type: 'text',
      html: '<p>Pertanyaan penting: bagaimana React tahu bagian mana yang perlu diperbarui? Di sinilah <b>Virtual DOM</b> berperan. <b>DOM</b> adalah representasi halaman di memori browser. Mengubah DOM asli itu relatif lambat. React membuat tiruannya di memori — <b>Virtual DOM</b> — lalu bekerja seperti ini:</p><ol><li>React menyusun Virtual DOM baru dari kondisi data terbaru.</li><li>Ia <b>membandingkan</b> (diffing) Virtual DOM baru dengan yang lama.</li><li>Hanya <b>perbedaan</b> saja yang ditulis ke DOM asli.</li></ol><p>Akibatnya React jarang menyentuh DOM asli, sehingga pembaruan jauh lebih hemat dan cepat.</p>'
    },
    {
      type: 'example',
      title: 'Cara berpikir deklaratif (khas React)',
      lang: 'jsx',
      output: false,
      code: `// Pendekatan IMPERATIF (DOM biasa): kita memberi perintah langkah demi langkah
// "buat elemen, isi teks, lalu tempelkan ke halaman".
const judul = document.createElement('h1');
judul.textContent = 'Halo, Andi!';
document.body.appendChild(judul);

// Pendekatan DEKLARATIF (React): kita cukup "mendeskripsikan" tampilan,
// lalu React yang mengurus cara membuat & memperbaruinya.
function Sapaan({ nama }) {
  return <h1>Halo, {nama}!</h1>;
}`,
      explain: [
        'Kode DOM biasa bersifat <b>imperatif</b>: kita menuliskan <i>bagaimana</i> caranya.',
        'React bersifat <b>deklaratif</b>: kita mendeskripsikan <i>apa</i> yang ingin ditampilkan untuk suatu kondisi data.',
        'React yang menerjemahkan deskripsi itu menjadi perubahan DOM yang efisien.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kekuatan utama React adalah <b>komposisi komponen</b>. Komponen kecil dapat dipakai ulang di banyak tempat dan disusun menjadi tampilan besar. Inilah bentuk paling sederhana sebuah komponen React:</p>'
    },
    {
      type: 'example',
      title: 'Komponen React pertama',
      lang: 'jsx',
      output: false,
      code: `// Sebuah komponen hanyalah FUNCTION yang mengembalikan (return) tampilan.
function Tombol() {
  return <button>Klik aku</button>;
}

// Komponen bisa dipakai berulang, seperti tag HTML buatan sendiri.
function Aplikasi() {
  return (
    <div>
      <h1>Belajar React</h1>
      <Tombol />
      <Tombol />
    </div>
  );
}`,
      explain: [
        'Nama komponen <b>diawali huruf kapital</b> (<code>Tombol</code>, <code>Aplikasi</code>). Huruf kecil hanya untuk tag HTML asli seperti <code>div</code> atau <code>button</code>.',
        'Komponen dipanggil seperti tag: <code>&lt;Tombol /&gt;</code>.',
        'Komponen <code>Aplikasi</code> memakai <code>Tombol</code> dua kali — kode ditulis sekali, tampil berkali-kali.'
      ]
    },
    {
      type: 'tip',
      title: 'React juga untuk mobile: React Native',
      text: 'React yang kamu pelajari di web (React DOM) memiliki saudara: <b>React Native</b>. Dengan pola komponen yang sama, kamu bisa membuat aplikasi <b>Android</b> dan <b>iOS</b>. Jadi ilmu React tidak berhenti di browser.'
    },
    {
      type: 'warn',
      title: 'Pastikan dulu dasar JavaScript sudah kuat',
      text: 'React sangat bergantung pada JavaScript modern: <b>function</b>, <b>arrow function</b>, <b>array map</b>, <b>destructuring</b>, <b>spread</b>, dan <b>ES Modules</b>. Bila istilah-istilah itu masih terdengar asing, pelajari dulu materi JavaScript di aplikasi ini sebelum lanjut.'
    },
    {
      type: 'vocab',
      items: [
        ['React', 'Library JavaScript untuk membangun antarmuka pengguna berbasis komponen.'],
        ['Komponen', 'Potongan UI yang berdiri sendiri, ditulis sebagai function yang mengembalikan tampilan.'],
        ['SPA', 'Single Page Application — satu halaman yang kontennya ditukar lewat JavaScript tanpa reload.'],
        ['MPA', 'Multi Page Application — tiap perpindahan memuat ulang dokumen dari server.'],
        ['DOM', 'Representasi struktur halaman di memori browser.'],
        ['Virtual DOM', 'Tiruan DOM di memori yang dipakai React untuk menghitung perubahan paling efisien.'],
        ['Deklaratif', 'Gaya menulis kode dengan mendeskripsikan hasil yang diinginkan, bukan langkah-langkahnya.'],
        ['Rendering', 'Proses mengubah deskripsi komponen menjadi tampilan di layar.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: rasakan bedanya SPA',
      lang: 'html',
      hint: 'Klik tombol menu — perhatikan alamat halaman tidak berubah dan tidak ada reload. Inilah sensasi SPA yang nanti dibuat dengan React.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Mini SPA</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
    nav { display: flex; gap: 8px; margin-bottom: 16px; }
    nav button { padding: 8px 14px; border: 0; border-radius: 8px; cursor: pointer; background: #334155; color: #e2e8f0; font-size: 14px; }
    nav button.aktif { background: #61dafb; color: #0f172a; font-weight: bold; }
    .halaman { background: #1e293b; border-radius: 12px; padding: 18px; }
  </style>
</head>
<body>
  <nav>
    <button data-hal="beranda" class="aktif">Beranda</button>
    <button data-hal="profil">Profil</button>
    <button data-hal="kontak">Kontak</button>
  </nav>
  <div class="halaman" id="isi">Ini halaman Beranda.</div>

  <script>
    // SPA sederhana: ganti isi tanpa memuat ulang halaman.
    const isi = document.getElementById("isi");
    const teks = {
      beranda: "Ini halaman Beranda.",
      profil: "Ini halaman Profil.",
      kontak: "Ini halaman Kontak."
    };

    document.querySelectorAll("nav button").forEach(function (tombol) {
      tombol.addEventListener("click", function () {
        document.querySelectorAll("nav button").forEach(function (b) {
          b.classList.remove("aktif");
        });
        tombol.classList.add("aktif");
        isi.textContent = teks[tombol.dataset.hal];
      });
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'React adalah library JavaScript untuk membangun antarmuka berbasis komponen.',
    'SPA memuat satu halaman lalu menukar kontennya tanpa reload — terasa cepat seperti aplikasi.',
    'Virtual DOM adalah tiruan DOM di memori; React hanya menulis perbedaannya ke DOM asli.',
    'React bersifat deklaratif: kita mendeskripsikan tampilan, React yang mengurus DOM.',
    'Sebuah komponen hanyalah function yang mengembalikan tampilan dan namanya diawali huruf kapital.'
  ]
});

/* ---------- Pelajaran 2: Menyiapkan Proyek React ---------- */
window.REACT_LESSONS.push({
  id: 'setup-project-react',
  title: 'Menyiapkan Proyek React',
  chapter: 'Pendahuluan',
  duration: '11 menit',
  intro: [
    'Menulis React langsung di file HTML memang bisa, tetapi untuk proyek sungguhan kita butuh <b>alat build</b> — supaya kode JSX diubah menjadi JavaScript biasa, proyek di-<i>refresh</i> otomatis, dan hasilnya bisa dibagi ke orang lain.',
    'Ada dua alat populer: <b>Vite</b> (modern dan cepat — yang kita pakai) dan <b>Create React App</b> (cara lama). Pelajaran ini memandu dari nol sampai aplikasi React pertama berjalan.'
  ],
  objectives: [
    'Menyiapkan Node.js dan npm',
    'Membuat proyek React baru dengan Vite',
    'Mengenal struktur folder proyek React',
    'Menjalankan aplikasi di browser dan melakukan build produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebelum mulai, pastikan komputermu punya <b>Node.js</b> (versi <b>18 ke atas</b>). Node.js menyertakan <b>npm</b>, pengelola paket untuk memasang React dan alat pendukungnya. Cek dulu dengan perintah berikut di terminal.</p>'
    },
    {
      type: 'example',
      title: 'Cek versi Node.js dan npm',
      lang: 'bash',
      output: false,
      code: `node -v     # contoh keluaran: v20.11.0
npm -v      # contoh keluaran: 10.2.4

# Bila belum ada, unduh dari https://nodejs.org (pilih versi LTS).`,
      explain: [
        'Tanda <code>#</code> menandakan komentar — diabaikan saat menjalankan perintah.',
        'Vite memerlukan Node.js 18+; versi LTS adalah pilihan paling stabil.',
        'Setelah Node.js terpasang, npm otomatis tersedia.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sekarang buat proyek React baru dengan <b>Vite</b>. Perintah <code>npm create</code> menjalankan pembuat proyek interaktif; kita langsung memberi nama dan template supaya tidak ditanya-tanya lagi.</p>'
    },
    {
      type: 'example',
      title: 'Membuat proyek dengan Vite',
      lang: 'bash',
      output: false,
      code: `# Buat proyek baru bernama "aplikasi-saya" dengan template React
npm create vite@latest aplikasi-saya -- --template react

# Masuk ke folder proyek
cd aplikasi-saya

# Pasang semua dependensi
npm install

# Jalankan server pengembangan
npm run dev`,
      explain: [
        '<code>--template react</code> memilih template <b>React + JavaScript</b> (sudah termasuk JSX).',
        'Bila ingin TypeScript, ganti menjadi <code>--template react-ts</code>.',
        '<code>npm install</code> mengunduh React dan alat build ke folder <code>node_modules</code>.',
        '<code>npm run dev</code> menyalakan server pengembangan: setiap kamu menyimpan file, browser otomatis diperbarui.'
      ]
    },
    {
      type: 'tip',
      title: 'Yakin mau pakai template JavaScript atau TypeScript?',
      text: 'Untuk pemula, mulai dengan <code>--template react</code> (JavaScript) supaya fokus pada konsep React. Setelah nyaman, beralihlah ke <code>--template react-ts</code> — TypeScript akan membantu menangkap kesalahan lebih awal.'
    },
    {
      type: 'text',
      html: '<p>Setelah <code>npm run dev</code>, terminal menampilkan alamat lokal, biasanya <code>http://localhost:5173</code>. Buka alamat itu di browser dan kamu akan melihat halaman React sudah berjalan.</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder proyek React (Vite)',
      lang: 'text',
      output: false,
      code: `aplikasi-saya/
├── index.html          # halaman HTML tunggal (SPA) — ada <div id="root">
├── package.json        # daftar dependensi & skrip perintah
├── vite.config.js      # konfigurasi Vite
├── public/             # berkas statis (gambar, favicon)
└── src/
    ├── main.jsx        # titik masuk: menempelkan React ke index.html
    ├── App.jsx         # komponen utama aplikasi
    ├── App.css         # gaya untuk App
    └── index.css       # gaya global`,
      explain: [
        'Hampir seluruh pekerjaanmu ada di dalam folder <code>src/</code>.',
        '<code>index.html</code> hanya berisi wadah kosong: <code>&lt;div id="root"&gt;&lt;/div&gt;</code>.',
        'React akan "mengambil alih" elemen <code>#root</code> itu dan menggambar seluruh aplikasi di dalamnya.'
      ]
    },
    {
      type: 'example',
      title: 'Berkas utama: main.jsx',
      lang: 'jsx',
      output: false,
      code: `// src/main.jsx — titik masuk aplikasi
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Cari <div id="root"> di index.html,
// lalu gambar komponen <App /> ke dalamnya.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      explain: [
        '<code>createRoot</code> membuat "akar" React pada elemen <code>#root</code>.',
        '<code>.render(&lt;App /&gt;)</code> memerintahkan React menggambar komponen App.',
        '<code>React.StrictMode</code> adalah pembungkus yang membantu mendeteksi kesalahan saat pengembangan.'
      ]
    },
    {
      type: 'example',
      title: 'Komponen utama: App.jsx',
      lang: 'jsx',
      output: false,
      code: `// src/App.jsx — komponen utama yang akan kita ubah-ubah
import { useState } from 'react';

function App() {
  const [hitung, setHitung] = useState(0);

  return (
    <div className="App">
      <h1>Halo, React! 👋</h1>
      <p>Kamu mengklik {hitung} kali.</p>
      <button onClick={() => setHitung(hitung + 1)}>Klik aku</button>
    </div>
  );
}

export default App;`,
      explain: [
        'Berkas komponen biasanya berekstensi <code>.jsx</code> karena berisi sintaks JSX.',
        '<code>export default App</code> membuat komponen ini bisa diimpor di berkas lain.',
        'Jangan khawatir dulu soal <code>useState</code> — itu dibahas di bab State.'
      ]
    },
    {
      type: 'warn',
      title: 'Create React App (CRA) sudah tidak disarankan',
      text: '<b>Create React App</b> (<code>npx create-react-app</code>) adalah cara lama membuat proyek React. Kini proyeknya tidak lagi aktif dirawat, lebih lambat, dan dokumentasi resmi React sudah mengarahkan ke <b>Vite</b> atau framework seperti <b>Next.js</b>. Untuk proyek baru, pilih Vite.'
    },
    {
      type: 'example',
      title: 'Membangun versi produksi',
      lang: 'bash',
      output: false,
      code: `# Membuat berkas siap-pakai (dioptimalkan & diperkecil)
npm run build

# Hasil build ada di folder dist/ — inilah yang diunggah ke hosting
# (Netlify, Vercel, GitHub Pages, dan lain-lain).

# Melihat hasil build secara lokal
npm run preview`,
      explain: [
        '<code>npm run build</code> memampatkan HTML, CSS, dan JavaScript agar ringan diunduh pengunjung.',
        'Folder <code>dist/</code> berisi file statis yang siap diunggah ke hosting mana pun.',
        '<code>npm run preview</code> membantu memeriksa hasil build sebelum benar-benar dipublikasikan.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Node.js', 'Runtime JavaScript di luar browser; wajib untuk menjalankan alat build React.'],
        ['npm', 'Node Package Manager — pengelola paket/dependensi proyek.'],
        ['Vite', 'Alat build modern yang cepat, dipakai membuat proyek React baru.'],
        ['JSX', 'Sintaks mirip HTML di dalam JavaScript (dibahas bab berikutnya).'],
        ['package.json', 'Berkas daftar dependensi dan skrip perintah proyek.'],
        ['main.jsx', 'Titik masuk aplikasi: menempelkan React ke elemen #root.'],
        ['npm run dev', 'Menjalankan server pengembangan dengan auto-refresh (hot reload).'],
        ['Build', 'Proses mengubah kode menjadi berkas siap-pakai untuk produksi.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: pratinjau aplikasi yang akan kamu buat',
      lang: 'html',
      hint: 'Ini tampilan aplikasi "Halo React" dari App.jsx di atas, dirender di sini sebagai HTML biasa agar bisa kamu rasakan. Di proyek sungguhan, React yang menghasilkannya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Halo React (pratinjau)</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #20232a; color: #e2e8f0; }
    .kartu { max-width: 380px; margin: 40px auto; background: #282c34; border-radius: 14px; padding: 24px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
    h1 { color: #61dafb; margin-top: 0; }
    button { background: #61dafb; color: #20232a; border: 0; padding: 10px 18px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; }
    button:active { transform: translateY(1px); }
  </style>
</head>
<body>
  <div class="kartu">
    <h1>Halo, React! 👋</h1>
    <p>Kamu mengklik <b id="n">0</b> kali.</p>
    <button id="btn">Klik aku</button>
  </div>
  <script>
    // Ini HANYA simulasi. Di React, angka ini dikelola oleh useState.
    let hitung = 0;
    document.getElementById("btn").addEventListener("click", function () {
      hitung = hitung + 1;
      document.getElementById("n").textContent = hitung;
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'React membutuhkan Node.js 18+ dan npm.',
    'Cara tercepat membuat proyek: npm create vite@latest nama-proyek -- --template react.',
    'main.jsx menempelkan komponen App ke elemen #root di index.html.',
    'Seluruh pengembangan terjadi di folder src/, dijalankan dengan npm run dev.',
    'Create React App sudah usang — gunakan Vite (atau Next.js).',
    'npm run build menghasilkan folder dist/ yang siap diunggah ke hosting.'
  ]
});
