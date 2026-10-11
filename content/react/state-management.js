/* ============================================================
   Pelajaran React — Bab 6: Manajemen State
   (topik info.md:
    - "Global State Management (Dasar): Context API tanpa prop drilling"
    - "Advanced State Management: Zustand, Redux Toolkit,
       TanStack Query (server state & caching)")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 13: Context API ---------- */
window.REACT_LESSONS.push({
  id: 'context-api',
  title: 'Context API — State Global',
  chapter: 'Manajemen State',
  duration: '14 menit',
  intro: [
    'Ketika sebuah data dibutuhkan banyak komponen (mis. tema, bahasa, atau data pengguna yang login), mengirimnya lewat props ke setiap lapisan menjadi melelahkan. Gejala ini bernama <b>prop drilling</b>.',
    'React menyediakan <b>Context API</b>: cara menaruh data agar bisa diakses langsung oleh komponen mana pun tanpa melewati perantara.'
  ],
  objectives: [
    'Memahami masalah prop drilling',
    'Membuat Context dengan createContext',
    'Menyediakan nilai dengan Provider',
    'Membacanya dengan useContext',
    'Membungkusnya menjadi Custom Hook agar rapi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bayangkan data <code>tema</code> dibutuhkan oleh komponen paling bawah, padahal yang menyimpannya adalah komponen paling atas. Tanpa Context, data itu harus "diturunkan" lewat setiap komponen di antaranya — bahkan yang tidak membutuhkannya. Setiap lapisan menerima props <code>tema</code> hanya untuk diteruskan lagi.</p>'
    },
    {
      type: 'example',
      title: 'Masalah prop drilling',
      lang: 'jsx',
      output: false,
      code: `function App() {
  const [tema] = useState('gelap');
  return <TataLetak tema={tema} />;      // teruskan...
}
function TataLetak({ tema }) {
  return <Sidebar tema={tema} />;        // teruskan lagi...
}
function Sidebar({ tema }) {
  return <Menu tema={tema} />;           // teruskan lagi...
}
function Menu({ tema }) {
  return <Tombol tema={tema} />;         // akhirnya dipakai di sini
}
function Tombol({ tema }) {
  return <button>{tema}</button>;
}`,
      explain: [
        '<code>TataLetak</code> dan <code>Sidebar</code> tidak memakai <code>tema</code>, tetapi harus meneruskannya.',
        'Bila ada 10 lapisan, kode menjadi panjang dan rapuh.',
        'Inilah yang disebut <b>prop drilling</b>.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat Context & Provider',
      lang: 'jsx',
      output: false,
      code: `import { createContext, useState } from 'react';

// 1) Buat "wadah" context dengan nilai default.
export const TemaContext = createContext(null);

// 2) Komponen Provider menyediakan nilai untuk semua anak di bawahnya.
export function TemaProvider({ children }) {
  const [tema, setTema] = useState('terang');

  function gantiTema() {
    setTema((t) => (t === 'terang' ? 'gelap' : 'terang'));
  }

  // "value" memuat semua yang ingin dibagikan.
  return (
    <TemaContext.Provider value={{ tema, gantiTema }}>
      {children}
    </TemaContext.Provider>
  );
}`,
      explain: [
        '<code>createContext(null)</code> membuat context; nilai default hanya dipakai bila tidak ada Provider.',
        '<code>Provider value={...}</code> menyediakan data untuk semua komponen di dalamnya.',
        '<code>children</code> adalah seluruh aplikasi yang dibungkus provider.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca Context dengan useContext',
      lang: 'jsx',
      output: false,
      code: `import { useContext } from 'react';
import { TemaContext } from './TemaContext';

function TombolTema() {
  // Ambil nilai context langsung, tanpa props sama sekali.
  const { tema, gantiTema } = useContext(TemaContext);

  return (
    <button onClick={gantiTema}>
      Tema sekarang: {tema} (klik untuk ganti)
    </button>
  );
}

// Bungkus aplikasi dengan provider di main.jsx / App.jsx:
// <TemaProvider><App /></TemaProvider>`,
      explain: [
        '<code>useContext(TemaContext)</code> membaca nilai dari Provider terdekat di atasnya.',
        'Komponen <code>TombolTema</code> bisa berada di kedalaman berapa pun — tidak perlu props.',
        'Setiap komponen yang memakai context akan ikut render ulang saat nilai context berubah.'
      ]
    },
    {
      type: 'example',
      title: 'Custom Hook untuk Context (praktik yang rapi)',
      lang: 'jsx',
      output: false,
      code: `import { useContext } from 'react';
import { TemaContext } from './TemaContext';

// Bungkus useContext dalam Custom Hook.
export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) {
    throw new Error('useTema harus dipakai di dalam TemaProvider');
  }
  return ctx;
}

// Pemakaian menjadi ringkas & aman:
function TombolTema() {
  const { tema, gantiTema } = useTema();
  return <button onClick={gantiTema}>{tema}</button>;
}`,
      explain: [
        'Custom Hook menyembunyikan detail context dari komponen pemakainya.',
        'Pemeriksaan <code>if (!ctx)</code> memberi pesan error yang jelas bila lupa membungkus dengan Provider.',
        'Pola <code>useNama</code> ini menjadi kebiasaan baik di proyek React.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh lengkap: Context autentikasi',
      lang: 'jsx',
      output: false,
      code: `import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [pengguna, setPengguna] = useState(null);

  const masuk = (nama) => setPengguna({ nama });
  const keluar = () => setPengguna(null);

  return (
    <AuthContext.Provider value={{ pengguna, masuk, keluar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Di komponen mana pun:
// const { pengguna, masuk, keluar } = useAuth();`,
      explain: [
        'Pola provider + custom hook ini sangat lazim untuk data global seperti autentikasi.',
        'Semua komponen bisa tahu "siapa yang sedang login" tanpa prop drilling.',
        '<code>masuk</code> dan <code>keluar</code> dibagikan agar komponen lain bisa mengubah status login.'
      ]
    },
    {
      type: 'tip',
      title: 'Pecah context agar lebih efisien',
      text: 'Satu context besar yang nilainya sering berubah membuat <b>semua</b> pemakainya render ulang. Bila perlu, pisahkan menjadi beberapa context (mis. satu untuk data, satu untuk function pengubah), atau simpan data yang jarang berubah di context terpisah.'
    },
    {
      type: 'warn',
      title: 'Context bukan pengganti semua state',
      text: 'Context cocok untuk data yang memang <b>global</b> (tema, bahasa, sesi login). Jangan memindahkan <b>semua</b> state ke context — state lokal yang hanya dipakai satu komponen sebaiknya tetap <code>useState</code> biasa. Context tidak otomatis mengoptimalkan performa; salah tempat justru membuat segalanya render ulang.'
    },
    {
      type: 'vocab',
      items: [
        ['Prop drilling', 'Meneruskan props melewati banyak komponen perantara.'],
        ['Context', 'Mekanisme berbagi data tanpa props ke seluruh pohon komponen.'],
        ['createContext', 'Function untuk membuat context.'],
        ['Provider', 'Komponen yang menyediakan nilai context.'],
        ['useContext', 'Hook untuk membaca nilai context terdekat.'],
        ['Consumer', 'Cara lama membaca context (sebelum Hook); kini useContext lebih umum.'],
        ['Custom Hook', 'Function berawalan use untuk membungkus logika yang bisa dipakai ulang.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: pengganti tema (seperti Context)',
      lang: 'html',
      hint: 'Tombol mengubah tema seluruh halaman. Di React, nilai "tema" ini disimpan di Context sehingga komponen mana pun bisa membacanya.',
      initial: `<!DOCTYPE html>
<html lang="id" data-tema="terang">
<head>
  <meta charset="UTF-8">
  <title>Context</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; transition: background .3s, color .3s; }
    html[data-tema="terang"] body { background: #f8fafc; color: #0f172a; }
    html[data-tema="gelap"] body { background: #0f172a; color: #e2e8f0; }
    .kartu { padding: 18px; border-radius: 12px; background: rgba(97, 218, 251, .15); }
    button { padding: 10px 16px; border: 0; border-radius: 8px; background: #61dafb; color: #0f172a; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <div class="kartu">
    <h2>Tema Global</h2>
    <p>Nilai tema ini "dibagikan" ke seluruh halaman.</p>
    <button id="btn">Ganti Tema</button>
  </div>
  <script>
    // Simulasi nilai Context: satu nilai global yang dibaca banyak elemen.
    document.getElementById("btn").addEventListener("click", function () {
      const html = document.documentElement;
      html.dataset.tema = html.dataset.tema === "terang" ? "gelap" : "terang";
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Prop drilling adalah meneruskan props lewat banyak perantara yang tidak membutuhkannya.',
    'Context API membagikan data ke seluruh pohon komponen tanpa props.',
    'Alurnya: createContext → Provider (value) → useContext.',
    'Bungkus useContext dalam Custom Hook agar pemakaian ringkas dan aman.',
    'Pecah context dan jangan memindahkan semua state ke context.',
    'Context cocok untuk data global seperti tema, bahasa, dan sesi login.'
  ]
});

/* ---------- Pelajaran 14: Advanced State Management ---------- */
window.REACT_LESSONS.push({
  id: 'advanced-state-management',
  title: 'Manajemen State Lanjutan',
  chapter: 'Manajemen State',
  duration: '16 menit',
  intro: [
    'Seiring aplikasi bertumbuh, menyimpan semua state di useState dan Context mulai terasa berat. Muncul pertanyaan: kapan memakai <b>Zustand</b>, <b>Redux Toolkit</b>, atau <b>TanStack Query</b>?',
    'Pelajaran ini memetakan jenis-jenis state (lokal, global, server) dan memperkenalkan tiga library populer beserta contohnya.'
  ],
  objectives: [
    'Membedakan state lokal, global, dan server',
    'Mengenal Zustand untuk state global yang ringan',
    'Mengenal Redux Toolkit untuk state kompleks berskala besar',
    'Memakai TanStack Query untuk data dari server & caching'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebelum memilih library, kenali dulu <b>tiga jenis state</b>:</p><table class="vocab"><tr><th>Jenis</th><th>Contoh</th><th>Alat umum</th></tr><tr><td><b>State lokal</b></td><td>Buka/tutup dropdown, isi input</td><td>useState, useReducer</td></tr><tr><td><b>State global (klien)</b></td><td>Tema, sesi login, keranjang belanja</td><td>Context, Zustand, Redux</td></tr><tr><td><b>State server</b></td><td>Daftar produk, profil, komentar</td><td>TanStack Query, SWR</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Zustand — state global yang ringan',
      lang: 'jsx',
      output: false,
      code: `// Pemasangan: npm install zustand
import { create } from 'zustand';

// 1) Buat store dengan state + aksi sekaligus.
const useKeranjang = create((set) => ({
  item: [],
  tambah: (produk) => set((s) => ({ item: [...s.item, produk] })),
  hapus: (id) => set((s) => ({ item: s.item.filter((i) => i.id !== id) })),
  kosongkan: () => set({ item: [] })
}));

// 2) Pakai di komponen mana pun — tanpa Provider!
function TombolTambah({ produk }) {
  const tambah = useKeranjang((s) => s.tambah);
  return <button onClick={() => tambah(produk)}>Tambah ke keranjang</button>;
}

function JumlahKeranjang() {
  const jumlah = useKeranjang((s) => s.item.length);
  return <span>🛒 {jumlah}</span>;
}`,
      explain: [
        'Zustand sangat ringkas: satu store berisi state dan aksinya.',
        'Tidak perlu membungkus aplikasi dengan Provider.',
        'Komponen hanya "berlangganan" bagian store yang dipakai, sehingga render ulang lebih hemat.'
      ]
    },
    {
      type: 'example',
      title: 'Redux Toolkit — standar untuk aplikasi besar',
      lang: 'jsx',
      output: false,
      code: `// Pemasangan: npm install @reduxjs/toolkit react-redux
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';

// 1) Slice: gabungan state + reducer + action.
const keranjangSlice = createSlice({
  name: 'keranjang',
  initialState: { item: [] },
  reducers: {
    tambah: (state, action) => { state.item.push(action.payload); },
    hapus: (state, action) => {
      state.item = state.item.filter((i) => i.id !== action.payload);
    }
  }
});
export const { tambah, hapus } = keranjangSlice.actions;

// 2) Store.
const store = configureStore({ reducer: { keranjang: keranjangSlice.reducer } });

// 3) Provider di akar aplikasi: <Provider store={store}><App /></Provider>

// 4) Di komponen:
function TombolTambah({ produk }) {
  const dispatch = useDispatch();
  const jumlah = useSelector((s) => s.keranjang.item.length);

  return (
    <div>
      <button onClick={() => dispatch(tambah(produk))}>Tambah</button>
      <span>🛒 {jumlah}</span>
    </div>
  );
}`,
      explain: [
        '<code>createSlice</code> menyatukan state, reducer, dan action dalam satu tempat.',
        'Redux Toolkit memakai <b>Immer</b> di balik layar, jadi menulis <code>state.item.push(...)</code> tetap aman (seolah mutasi).',
        '<code>useDispatch</code> mengirim aksi; <code>useSelector</code> membaca state.',
        'Redux cocok bila state sangat kompleks, butuh jejak perubahan (DevTools), atau tim besar.'
      ]
    },
    {
      type: 'example',
      title: 'TanStack Query — untuk data dari server',
      lang: 'jsx',
      output: false,
      code: `// Pemasangan: npm install @tanstack/react-query
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Bungkus aplikasi: <QueryClientProvider client={queryClient}><App /></QueryClientProvider>

function DaftarPengguna() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pengguna'],                    // kunci cache
    queryFn: async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users');
      return res.json();
    }
  });

  if (isLoading) return <p>⏳ Memuat...</p>;
  if (isError) return <p>❌ Gagal memuat.</p>;

  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}`,
      explain: [
        'TanStack Query khusus menangani <b>server state</b>: data yang hidup di server dan di-cache di klien.',
        '<code>queryKey</code> adalah identitas cache; data yang sama tidak di-fetch berulang.',
        'Fitur bawaan: caching, refetch otomatis, status loading/error, dan sinkronisasi latar belakang.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan memilih yang bijak',
      text: 'Mulailah dari yang paling sederhana: <b>useState</b> → bila perlu di banyak tempat, <b>Context</b> → bila state global makin kompleks, <b>Zustand</b> (ringan) atau <b>Redux Toolkit</b> (besar) → untuk data dari API, langsung pakai <b>TanStack Query</b>. Jangan pakai alat berat untuk masalah ringan.'
    },
    {
      type: 'warn',
      title: 'Jangan menaruh semua hal di state global',
      text: 'State global yang berlebihan membuat aplikasi sulit dilacak dan boros render. Data yang hanya dipakai satu komponen tetap di <code>useState</code>. Selain itu, <b>state server</b> sebaiknya tidak disalin mentah ke state global — biarkan TanStack Query mengelolanya beserta cache-nya.'
    },
    {
      type: 'vocab',
      items: [
        ['State lokal', 'State yang hanya dipakai satu komponen/tree kecil.'],
        ['State global', 'State yang dibutuhkan banyak komponen di berbagai tempat.'],
        ['State server', 'Data yang sumbernya di server; butuh caching & sinkronisasi.'],
        ['Zustand', 'Library state global ringan tanpa boilerplate Provider.'],
        ['Redux Toolkit', 'Versi modern Redux: lebih ringkas, aman, dan punya DevTools.'],
        ['TanStack Query', 'Library untuk mengambil, menyimpan cache, dan menyinkronkan data server.'],
        ['Store', 'Tempat menyimpan state global beserta aksinya.'],
        ['queryKey', 'Kunci unik penanda cache pada TanStack Query.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: konsep store global',
      lang: 'html',
      hint: 'Angka keranjang di bawah adalah "state global": beberapa tombol mengubah satu sumber nilai. Di React, store semacam ini dikelola Zustand/Redux.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>State Global</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; }
    .bar { display: flex; align-items: center; gap: 12px; font-size: 18px; }
    button { padding: 8px 16px; border: 0; border-radius: 8px; background: #16a34a; color: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Keranjang Belanja</h2>
  <div class="bar">
    <button id="tambah">Tambah barang</button>
    <button id="kosong" style="background:#ef4444">Kosongkan</button>
    <span>🛒 <b id="jumlah">0</b> item</span>
  </div>
  <p id="daftar" style="color:#64748b">(belum ada item)</p>
  <script>
    // "Store" sederhana: satu nilai global + aksi pengubahnya.
    const store = {
      item: [],
      tambah: function () { store.item.push("Barang " + (store.item.length + 1)); },
      kosongkan: function () { store.item = []; }
    };
    function gambar() {
      document.getElementById("jumlah").textContent = store.item.length;
      document.getElementById("daftar").textContent =
        store.item.length ? store.item.join(", ") : "(belum ada item)";
    }
    document.getElementById("tambah").addEventListener("click", function () { store.tambah(); gambar(); });
    document.getElementById("kosong").addEventListener("click", function () { store.kosongkan(); gambar(); });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Ada tiga jenis state: lokal, global (klien), dan server.',
    'Zustand ringan dan tanpa Provider cocok untuk state global.',
    'Redux Toolkit adalah standar untuk state kompleks berskala besar.',
    'TanStack Query mengelola server state lengkap dengan caching & refetch.',
    'Pilih alat paling sederhana yang menyelesaikan masalah.',
    'Jangan memindahkan semua state ke global; pisahkan state server dari state klien.'
  ]
});
