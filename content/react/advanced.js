/* ============================================================
   Pelajaran React — Bab 7: Performa, Custom Hook, Testing
   (topik info.md:
    - "Performance Optimization: code splitting & lazy loading,
       mencegah re-render yang tidak perlu"
    - "Custom Hooks: reusable logic"
    - "Testing: unit & component testing (Jest + RTL)")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 15: Performance Optimization ---------- */
window.REACT_LESSONS.push({
  id: 'performance-optimization',
  title: 'Optimasi Performa',
  chapter: 'Topik Lanjutan',
  duration: '15 menit',
  intro: [
    'Aplikasi React bisa menjadi lambat karena dua sebab utama: <b>bundel JavaScript terlalu besar</b> sehingga lama dimuat, dan <b>terlalu banyak render ulang</b> yang sebenarnya tidak perlu.',
    'Pelajaran ini membahas dua senjata utamanya: <b>code splitting</b> dengan <code>React.lazy</code> + <code>Suspense</code>, serta cara mencegah re-render mubazir.'
  ],
  objectives: [
    'Memahami penyebab utama aplikasi React lambat',
    'Memuat komponen secara terpisah dengan React.lazy & Suspense',
    'Mencegah render ulang yang tidak perlu',
    'Mengetahui kapan optimasi benar-benar diperlukan'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Saat aplikasi React di-<i>build</i>, semua kode digabung menjadi beberapa berkas JavaScript. Bila aplikasi besar, berkas ini bisa bermegabita — pengunjung harus mengunduh semuanya sebelum melihat apa pun. <b>Code splitting</b> memecah bundel menjadi bagian-bagian kecil yang dimuat <b>hanya saat diperlukan</b>. Di React, alatnya adalah <code>React.lazy</code> dan <code>Suspense</code>.</p>'
    },
    {
      type: 'example',
      title: 'Memuat komponen saat dibutuhkan',
      lang: 'jsx',
      output: false,
      code: `import { lazy, Suspense, useState } from 'react';

// Komponen ini TIDAK ikut bundel awal — diunduh saat dirender.
const HalamanLaporan = lazy(() => import('./HalamanLaporan'));

function App() {
  const [tampil, setTampil] = useState(false);

  return (
    <div>
      <button onClick={() => setTampil(true)}>Buka Laporan</button>

      {/* Suspense menampilkan cadangan selama komponen dimuat. */}
      <Suspense fallback={<p>⏳ Memuat laporan...</p>}>
        {tampil && <HalamanLaporan />}
      </Suspense>
    </div>
  );
}`,
      explain: [
        '<code>lazy(() =&gt; import(...))</code> menandai komponen agar dimuat terpisah saat pertama dibutuhkan.',
        '<code>Suspense</code> menampilkan <code>fallback</code> (mis. spinner) selama berkasnya diunduh.',
        'Hasilnya: bundel awal lebih kecil, halaman pertama tampil lebih cepat.'
      ]
    },
    {
      type: 'example',
      title: 'Code splitting per halaman (routing)',
      lang: 'jsx',
      output: false,
      code: `import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Setiap halaman menjadi berkas terpisah.
const Beranda = lazy(() => import('./pages/Beranda'));
const Produk = lazy(() => import('./pages/Produk'));
const Profil = lazy(() => import('./pages/Profil'));

function App() {
  return (
    <Suspense fallback={<div className="spinner">Memuat halaman...</div>}>
      <Routes>
        <Route path="/" element={<Beranda />} />
        <Route path="/produk" element={<Produk />} />
        <Route path="/profil" element={<Profil />} />
      </Routes>
    </Suspense>
  );
}`,
      explain: [
        'Ini pola paling umum: pengunjung hanya mengunduh halaman yang ia kunjungi.',
        'Halaman Profil tidak ikut dimuat bila pengunjung tidak pernah membukanya.',
        'Satu <code>Suspense</code> bisa membungkus banyak rute sekaligus.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sebab lambat kedua adalah <b>render ulang yang tidak perlu</b>. Setiap kali state/parent berubah, React menjalankan ulang komponen anak. Bila props-nya sebenarnya tidak berubah, render itu mubazir. Untuk mengatasinya: bungkus komponen dengan <code>React.memo</code>, dan stabilkan function dengan <code>useCallback</code> serta nilai dengan <code>useMemo</code>.</p>'
    },
    {
      type: 'example',
      title: 'Mencegah render ulang anak',
      lang: 'jsx',
      output: false,
      code: `import { memo, useCallback, useMemo, useState } from 'react';

// React.memo: hanya render ulang bila props berubah (secara referensi).
const BarisItem = memo(function BarisItem({ item, saatPilih }) {
  console.log('render', item.id);
  return <li onClick={() => saatPilih(item.id)}>{item.nama}</li>;
});

function Daftar() {
  const [pilih, setPilih] = useState(null);
  const [kata, setKata] = useState('');

  const item = useMemo(
    () => [{ id: 1, nama: 'Apel' }, { id: 2, nama: 'Jeruk' }],
    []
  );

  // Function stabil agar React.memo benar-benar bekerja.
  const tanganiPilih = useCallback((id) => setPilih(id), []);

  return (
    <div>
      <input value={kata} onChange={(e) => setKata(e.target.value)} />
      <ul>
        {item.map((it) => (
          <BarisItem key={it.id} item={it} saatPilih={tanganiPilih} />
        ))}
      </ul>
      <p>Dipilih: {pilih}</p>
    </div>
  );
}`,
      explain: [
        '<code>React.memo</code> melewati render bila props tidak berubah.',
        '<code>useMemo</code> menjaga array <code>item</code> tetap objek yang sama antar-render.',
        '<code>useCallback</code> menjaga <code>tanganiPilih</code> stabil, sehingga <code>BarisItem</code> tidak dianggap menerima props baru.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenali dulu penyebabnya',
      text: 'Gunakan <b>React DevTools Profiler</b> untuk melihat komponen mana yang sering render dan berapa lama. Perbaiki yang benar-benar lambat. Untuk daftar yang sangat panjang (ribuan baris), pertimbangkan <b>virtualisasi</b> dengan library seperti <code>react-window</code> yang hanya merender baris yang terlihat.'
    },
    {
      type: 'warn',
      title: 'Jangan optimalkan sebelum waktunya',
      text: 'Menambahkan <code>memo</code>, <code>useMemo</code>, dan <code>useCallback</code> di mana-mana membuat kode lebih rumit dan bisa jadi <b>lebih lambat</b>, karena pembandingan props dan pembuatan memo juga memakan biaya. Ukur dulu; optimalkan hanya bila ada masalah nyata.'
    },
    {
      type: 'vocab',
      items: [
        ['Code splitting', 'Memecah bundel menjadi bagian kecil yang dimuat saat dibutuhkan.'],
        ['React.lazy', 'Memuat komponen secara dinamis (on demand).'],
        ['Suspense', 'Menampilkan fallback selama komponen lazy dimuat.'],
        ['React.memo', 'Mencegah render ulang komponen bila props tidak berubah.'],
        ['Dynamic import', 'import() yang memuat modul saat runtime.'],
        ['Bundel', 'Berkas gabungan hasil build berisi kode aplikasi.'],
        ['Virtualisasi', 'Teknik merender hanya elemen yang terlihat di layar.'],
        ['Profiler', 'Alat React DevTools untuk mengukur performa render.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: menunggu komponen "lazy" dimuat',
      lang: 'html',
      hint: 'Klik tombol lalu perhatikan spinner sebentar, baru konten muncul. Beginilah Suspense menampilkan fallback saat komponen lazy dimuat.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Lazy</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; }
    button { padding: 10px 16px; border: 0; border-radius: 8px; background: #4f46e5; color: #fff; cursor: pointer; font-size: 15px; }
    .spinner { margin-top: 16px; color: #7c3aed; font-weight: bold; }
    .konten { margin-top: 16px; padding: 16px; background: #f5f3ff; border-radius: 12px; }
  </style>
</head>
<body>
  <button id="buka">Buka Laporan (lazy)</button>
  <div id="area"></div>
  <script>
    // Simulasi React.lazy: tampilkan fallback, lalu muat "komponen".
    document.getElementById("buka").addEventListener("click", function () {
      const area = document.getElementById("area");
      area.innerHTML = '<div class="spinner">⏳ Memuat laporan...</div>';   // fallback
      setTimeout(function () {
        area.innerHTML = '<div class="konten"><h3>Laporan Bulanan</h3><p>Terjual 120 unit. 🎉</p></div>';
      }, 900);   // "unduh" berkas terpisah
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Dua penyebab utama lambat: bundel besar dan render ulang mubazir.',
    'React.lazy + Suspense memecah bundel dan memuat komponen saat dibutuhkan.',
    'Code splitting per halaman adalah pola paling umum.',
    'React.memo melewati render bila props tidak berubah.',
    'useMemo & useCallback menjaga referensi stabil agar memo bekerja.',
    'Ukur dengan Profiler dulu — jangan optimalkan tanpa alasan nyata.'
  ]
});

/* ---------- Pelajaran 16: Custom Hooks ---------- */
window.REACT_LESSONS.push({
  id: 'custom-hooks',
  title: 'Custom Hooks',
  chapter: 'Topik Lanjutan',
  duration: '13 menit',
  intro: [
    'Bila beberapa komponen butuh logika yang sama (mis. menaikkan/menurunkan nilai, menyimpan ke localStorage, atau mengambil data), menyalin kode yang sama berulang kali bukan ide baik. React memberi jalan keluar: <b>Custom Hook</b>.',
    'Custom Hook adalah function JavaScript biasa berawalan <code>use</code> yang memakai Hook lain di dalamnya. Ia memungkingkan kita mengemas logika yang bisa dipakai ulang.'
  ],
  objectives: [
    'Memahami apa itu Custom Hook dan aturannya',
    'Membuat Hook untuk mengelola input (useInput)',
    'Membuat Hook penyimpan ke localStorage',
    'Membuat Hook untuk mengambil data (useFetch) dan useDebounce'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Custom Hook</b> adalah function yang: (1) namanya diawali <code>use</code>, dan (2) boleh memanggil Hook bawaan React seperti <code>useState</code> atau <code>useEffect</code>. Hook adalah cara resmi memakai kembali <b>logika berisi state</b> — sesuatu yang tidak bisa dilakukan function biasa.</p>'
    },
    {
      type: 'example',
      title: 'useInput — mengelola input',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

// Hook kustom: mengemas logika input.
function useInput(nilaiAwal = '') {
  const [nilai, setNilai] = useState(nilaiAwal);

  const ubah = (e) => setNilai(e.target.value);
  const reset = () => setNilai(nilaiAwal);

  // Kembalikan apa pun yang dibutuhkan komponen.
  return { nilai, ubah, reset };
}

// Pemakaian — logika form menjadi ringkas:
function FormNama() {
  const nama = useInput('');
  const email = useInput('');

  return (
    <div>
      <input value={nama.nilai} onChange={nama.ubah} placeholder="Nama" />
      <input value={email.nilai} onChange={email.ubah} placeholder="Email" />
      <button onClick={() => { nama.reset(); email.reset(); }}>Bersihkan</button>
      <p>{nama.nilai} · {email.nilai}</p>
    </div>
  );
}`,
      explain: [
        'Setiap komponen yang memakai <code>useInput</code> mendapat state-nya <b>sendiri</b>.',
        'Nama function wajib diawali <code>use</code> agar React & ESLint memperlakukannya sebagai Hook.',
        'Hook mengembalikan objek (atau array) berisi nilai & function yang dibutuhkan pemakainya.'
      ]
    },
    {
      type: 'example',
      title: 'useLocalStorage — menyimpan ke browser',
      lang: 'jsx',
      output: false,
      code: `import { useState, useEffect } from 'react';

function useLocalStorage(kunci, nilaiAwal) {
  const [nilai, setNilai] = useState(() => {
    try {
      const tersimpan = localStorage.getItem(kunci);
      return tersimpan ? JSON.parse(tersimpan) : nilaiAwal;
    } catch {
      return nilaiAwal;
    }
  });

  // Setiap nilai berubah, simpan ke localStorage.
  useEffect(() => {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  }, [kunci, nilai]);

  return [nilai, setNilai];
}

// Pemakaian: tema tersimpan walau halaman dimuat ulang.
function PengaturanTema() {
  const [tema, setTema] = useLocalStorage('tema', 'terang');
  return (
    <button onClick={() => setTema(tema === 'terang' ? 'gelap' : 'terang')}>
      Tema: {tema}
    </button>
  );
}`,
      explain: [
        'Nilai awal dibaca dari <code>localStorage</code> lewat function (lazy initializer) agar hanya dijalankan sekali.',
        '<code>useEffect</code> menyimpan setiap perubahan nilai.',
        'Hook ini membuat data bertahan meski halaman dimuat ulang.'
      ]
    },
    {
      type: 'example',
      title: 'useFetch — mengambil data dari API',
      lang: 'jsx',
      output: false,
      code: `import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let dibatalkan = false;
    setMemuat(true);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat');
        return res.json();
      })
      .then((json) => { if (!dibatalkan) setData(json); })
      .catch((err) => { if (!dibatalkan) setError(err.message); })
      .finally(() => { if (!dibatalkan) setMemuat(false); });

    return () => { dibatalkan = true; };
  }, [url]);

  return { data, memuat, error };
}

// Pemakaian:
function Pengguna() {
  const { data, memuat, error } = useFetch('https://jsonplaceholder.typicode.com/users');
  if (memuat) return <p>⏳...</p>;
  if (error) return <p>❌ {error}</p>;
  return <p>Jumlah pengguna: {data.length}</p>;
}`,
      explain: [
        'Tiga state (data, memuat, error) dikemas menjadi satu Hook.',
        'Komponen pemakainya cukup memanggil <code>useFetch(url)</code> — logika detail tersembunyi.',
        'Setiap URL berbeda akan memicu efek baru karena <code>url</code> ada di dependensi.'
      ]
    },
    {
      type: 'example',
      title: 'useDebounce — menunda nilai sementara',
      lang: 'jsx',
      output: false,
      code: `import { useState, useEffect } from 'react';

// Menunda perubahan nilai: berguna untuk pencarian agar
// tidak memanggil API pada setiap ketikan.
function useDebounce(nilai, jeda = 500) {
  const [nilaiTertunda, setNilaiTertunda] = useState(nilai);

  useEffect(() => {
    const id = setTimeout(() => setNilaiTertunda(nilai), jeda);
    return () => clearTimeout(id);   // batalkan bila nilai berubah lagi
  }, [nilai, jeda]);

  return nilaiTertunda;
}

function Pencarian() {
  const [kata, setKata] = useState('');
  const kataTertunda = useDebounce(kata, 400);

  useEffect(() => {
    if (kataTertunda) console.log('Mencari:', kataTertunda); // panggil API di sini
  }, [kataTertunda]);

  return <input value={kata} onChange={(e) => setKata(e.target.value)} />;
}`,
      explain: [
        'Setiap kali <code>nilai</code> berubah, timer lama dibatalkan dan timer baru dipasang.',
        'Akibatnya, pencarian baru dijalankan setelah pengguna berhenti mengetik sejenak.',
        'Pola debounce sangat umum untuk pencarian, validasi, dan auto-save.'
      ]
    },
    {
      type: 'tip',
      title: 'Custom Hook berbagi LOGIKA, bukan state',
      text: 'Penting dipahami: dua komponen yang memakai <code>useInput</code> yang sama <b>tidak</b> berbagi nilai input. Setiap pemanggilan Hook menciptakan state-nya sendiri. Bila yang kamu butuhkan adalah <b>berbagi state</b> antar komponen, gunakan Context atau library state global.'
    },
    {
      type: 'warn',
      title: 'Ikuti aturan Hooks',
      text: 'Custom Hook juga tunduk pada aturan Hooks: panggil di level teratas, jangan di dalam if/loop. Nama function <b>wajib</b> diawali <code>use</code> — kalau tidak, React tidak tahu ia berisi Hook dan bug sulit dilacak. Sebaliknya, jangan memberi awalan <code>use</code> pada function biasa yang tidak memakai Hook.'
    },
    {
      type: 'vocab',
      items: [
        ['Custom Hook', 'Function berawalan use yang mengemas logika memakai Hook lain.'],
        ['Reusable logic', 'Logika yang dapat dipakai ulang di banyak komponen.'],
        ['useInput', 'Hook kustom pengelola nilai input.'],
        ['useLocalStorage', 'Hook kustom untuk menyimpan state ke localStorage.'],
        ['useFetch', 'Hook kustom untuk mengambil data dari API.'],
        ['useDebounce', 'Hook kustom yang menunda nilai sementara waktu.'],
        ['Lazy initializer', 'Function sebagai nilai awal useState agar dihitung sekali.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: efek debounce',
      lang: 'html',
      hint: 'Ketik cepat di kotak. Perhatikan "diproses" baru muncul setelah kamu berhenti mengetik sejenak — itulah kerja useDebounce.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Debounce</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; }
    input { padding: 10px; font-size: 15px; width: 260px; border: 2px solid #cbd5e1; border-radius: 8px; }
    .kotak { margin-top: 16px; color: #7c3aed; font-weight: bold; }
  </style>
</head>
<body>
  <h2>Pencarian dengan Debounce</h2>
  <input id="cari" placeholder="Ketik sesuatu..." />
  <div class="kotak" id="hasil">Menunggu ketikan...</div>
  <script>
    // Simulasi useDebounce: tunda aksi sampai ketikan berhenti.
    let timer = null;
    document.getElementById("cari").addEventListener("input", function (e) {
      clearTimeout(timer);                       // batalkan timer lama
      const kata = e.target.value;
      document.getElementById("hasil").textContent = "Mengetik...";
      timer = setTimeout(function () {           // pasang timer baru
        document.getElementById("hasil").textContent = 'Diproses: "' + kata + '"';
      }, 500);
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Custom Hook adalah function berawalan use yang mengemas logika memakai Hook lain.',
    'Ia memungkinkn pemakaian ulang logika berisi state antar komponen.',
    'Contoh umum: useInput, useLocalStorage, useFetch, useDebounce.',
    'Custom Hook berbagi logika, BUKAN state — tiap pemakaian punya state sendiri.',
    'Tetap patuhi aturan Hooks: panggil di level teratas.',
    'Untuk berbagi state antar komponen, gunakan Context atau state global.'
  ]
});

/* ---------- Pelajaran 17: Testing React ---------- */
window.REACT_LESSONS.push({
  id: 'testing-react',
  title: 'Testing di React',
  chapter: 'Topik Lanjutan',
  duration: '16 menit',
  intro: [
    'Menambah fitur tanpa tes ibarat berjalan di kegelapan — satu perubahan bisa diam-diam merusak bagian lain. <b>Testing</b> memastikan komponen berperilaku sesuai harapan, sekaligus memberi kepercayaan diri saat mengubah kode.',
    'Pelajaran ini memperkenalkan <b>Jest</b> sebagai test runner dan <b>React Testing Library (RTL)</b> untuk menguji komponen dari sudut pandang pengguna.'
  ],
  objectives: [
    'Memahami jenis-jenis pengujian (unit, komponen, end-to-end)',
    'Memasang Jest & React Testing Library',
    'Menulis tes render komponen',
    'Menguji interaksi pengguna & proses asynchronous'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Pengujian umumnya dibagi tiga tingkat. <b>Unit test</b> menguji satu function kecil. <b>Component test</b> menguji satu komponen: apakah tampil benar dan merespons interaksi. <b>End-to-end (E2E)</b> menguji seluruh aplikasi dari browser sungguhan (mis. dengan Playwright). Di React, kombinasi paling populer adalah <b>Jest + React Testing Library</b>.</p>'
    },
    {
      type: 'example',
      title: 'Memasang Jest & React Testing Library',
      lang: 'bash',
      output: false,
      code: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom \\
  @testing-library/user-event jest-environment-jsdom

# Bila memakai Vite, alternatif yang lebih mulus adalah Vitest:
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom

# Tambahkan skrip di package.json:
#   "test": "jest"      (atau "vitest")`,
      explain: [
        '<code>jest</code> menjalankan test dan menyediakan fungsi <code>test</code>/<code>expect</code>.',
        '<code>@testing-library/react</code> menyediakan <code>render</code> dan <code>screen</code> untuk menguji komponen.',
        '<code>@testing-library/jest-dom</code> menambah matcher ramah seperti <code>toBeInTheDocument()</code>.',
        'Bila proyek memakai <b>Vite</b>, <b>Vitest</b> lebih direkomendasikan karena memakai konfigurasi yang sama.'
      ]
    },
    {
      type: 'example',
      title: 'Tes pertama: menampilkan komponen',
      lang: 'jsx',
      output: false,
      code: `// Sapaan.jsx
function Sapaan({ nama }) {
  return <h1>Halo, {nama}!</h1>;
}
export default Sapaan;

// Sapaan.test.jsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sapaan from './Sapaan';

test('menampilkan nama yang dikirim lewat props', () => {
  render(<Sapaan nama="Andi" />);

  // Cari teks di layar, lalu pastikan ada.
  const judul = screen.getByText('Halo, Andi!');
  expect(judul).toBeInTheDocument();
});`,
      explain: [
        '<code>render(&lt;Sapaan /&gt;)</code> menggambar komponen ke DOM virtual untuk diuji.',
        '<code>screen.getByText(...)</code> mencari elemen berdasarkan teks yang dilihat pengguna.',
        '<code>expect(...).toBeInTheDocument()</code> memastikan elemen benar-benar tampil.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji interaksi pengguna',
      lang: 'jsx',
      output: false,
      code: `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Penghitung from './Penghitung';

test('nilai bertambah saat tombol diklik', async () => {
  const pengguna = userEvent.setup();
  render(<Penghitung />);

  // Keadaan awal.
  expect(screen.getByText(/0 kali/)).toBeInTheDocument();

  // Simulasikan klik seperti pengguna sungguhan.
  await pengguna.click(screen.getByRole('button', { name: /tambah/i }));

  expect(screen.getByText(/1 kali/)).toBeInTheDocument();
});`,
      explain: [
        '<code>userEvent.setup()</code> menyiapkan simulasi interaksi yang mirip perilaku asli (klik, ketik).',
        '<code>getByRole("button", { name: ... })</code> mencari tombol berdasarkan perannya — cara yang disarankan.',
        'Setelah klik, kita memastikan tampilan ikut berubah.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji komponen dengan data async',
      lang: 'jsx',
      output: false,
      code: `import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DaftarPengguna from './DaftarPengguna';

// Ganti fetch dengan tiruan agar tes tidak bergantung internet.
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Andi' }])
    })
  );
});

test('menampilkan data setelah memuat', async () => {
  render(<DaftarPengguna />);

  // Awalnya status memuat.
  expect(screen.getByText(/memuat/i)).toBeInTheDocument();

  // findByText menunggu (await) sampai elemen muncul.
  const nama = await screen.findByText('Andi');
  expect(nama).toBeInTheDocument();
});`,
      explain: [
        'Kita mengganti (<i>mock</i>) <code>fetch</code> agar hasilnya pasti dan cepat.',
        '<code>findByText</code> mengembalikan Promise dan menunggu elemen muncul.',
        'Pola ini menguji alur loading → data tampil.'
      ]
    },
    {
      type: 'tip',
      title: 'Uji seperti pengguna memakainya',
      text: 'React Testing Library menganjurkan mencari elemen dengan cara yang sama seperti pengguna melihatnya: berdasarkan teks (<code>getByText</code>) atau peran (<code>getByRole</code>). Hindari mengecek kelas CSS atau state internal, karena tes seperti itu mudah patah ketika tampilan diubah — padahal perilakunya tetap benar.'
    },
    {
      type: 'warn',
      title: 'Quality over quantity',
      text: 'Banyak tes tidak berarti lebih baik bila isinya rapuh. Fokuskan tes pada <b>perilaku penting</b>: apakah pengguna bisa menyelesaikan tugasnya? Tes yang mengejar 100% cakupan angka tapi rapuh justru menyita waktu. Mulai dari alur utama, tambah tes seiring bug ditemukan.'
    },
    {
      type: 'vocab',
      items: [
        ['Unit test', 'Menguji satu function/modul kecil secara terpisah.'],
        ['Component test', 'Menguji satu komponen: tampilan & interaksinya.'],
        ['E2E test', 'Menguji aplikasi dari browser sungguhan secara menyeluruh.'],
        ['Jest', 'Test runner populer untuk JavaScript & React.'],
        ['Vitest', 'Test runner yang serasi dengan Vite.'],
        ['React Testing Library', 'Alat menguji komponen dari sudut pandang pengguna.'],
        ['userEvent', 'Simulasi interaksi pengguna (klik, mengetik).'],
        ['Mock', 'Pengganti function/dependency agar tes terkendali.']
      ]
    }
  ],
  recap: [
    'Tiga tingkat tes: unit, komponen, dan end-to-end.',
    'Jest sebagai test runner; React Testing Library untuk menguji komponen.',
    'Gunakan render + screen.getByText/getByRole untuk memeriksa tampilan.',
    'userEvent menyimulasikan interaksi pengguna seperti klik dan mengetik.',
    'findByText menunggu hasil asynchronous (mis. setelah fetch data).',
    'Uji perilaku penting dari sudut pandang pengguna, bukan detail internal.'
  ]
});
