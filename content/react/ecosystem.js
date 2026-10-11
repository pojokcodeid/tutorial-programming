/* ============================================================
   Pelajaran React — Bab 8: Ekosistem
   (topik info.md:
    - "TypeScript dengan React: tipe untuk Props, State, useRef,
       dan Event handler"
    - "Ekosistem Full-Stack / Framework Modern: Next.js, SSR,
       App Router, SEO")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 18: TypeScript dengan React ---------- */
window.REACT_LESSONS.push({
  id: 'typescript-react',
  title: 'TypeScript dengan React',
  chapter: 'Topik Lanjutan',
  duration: '15 menit',
  intro: [
    'React dan TypeScript adalah pasangan yang sangat serasi. TypeScript memberi <b>tipe</b> pada props, state, ref, dan event — sehingga kesalahan seperti mengirim prop yang salah atau salah tulis nama field bisa diketahui <b>sebelum</b> kode dijalankan.',
    'Pelajaran ini menunjukkan cara memberi tipe pada bagian-bagian utama komponen React.'
  ],
  objectives: [
    'Membuat proyek React + TypeScript',
    'Memberi tipe pada props dengan interface/type',
    'Memberi tipe pada useState, useRef, dan event handler',
    'Mengetik Custom Hook dan meneruskan ref (forwardRef)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Untuk membuat proyek baru React + TypeScript dengan Vite, gunakan template <code>react-ts</code>. Berkas komponen akan berekstensi <code>.tsx</code>.</p>'
    },
    {
      type: 'example',
      title: 'Membuat proyek React + TypeScript',
      lang: 'bash',
      output: false,
      code: `npm create vite@latest aplikasi-ts -- --template react-ts
cd aplikasi-ts
npm install
npm run dev`,
      explain: [
        '<code>--template react-ts</code> menyiapkan proyek React dengan TypeScript.',
        'Semua komponen ditulis di berkas <code>.tsx</code> (TS + JSX).',
        'Vite akan melaporkan kesalahan tipe saat pengembangan.'
      ]
    },
    {
      type: 'example',
      title: 'Memberi tipe pada props',
      lang: 'typescript',
      output: false,
      code: `// Tentukan "bentuk" props lewat interface.
interface KartuProps {
  judul: string;
  isi: string;
  poin?: number;          // opsional — boleh tidak dikirim
  onClick?: () => void;
}

function Kartu({ judul, isi, poin = 0, onClick }: KartuProps) {
  return (
    <div className="kartu" onClick={onClick}>
      <h3>{judul}</h3>
      <p>{isi}</p>
      <small>Poin: {poin}</small>
    </div>
  );
}

// Pemakaian — TypeScript memastikan props wajib terisi:
<Kartu judul="Berita" isi="React + TS." poin={10} />`,
      explain: [
        '<code>interface KartuProps</code> mendefinisikan properti apa saja yang diterima komponen.',
        'Tanda tanya <code>poin?</code> menandai properti opsional (boleh kosong).',
        'Bila lupa mengisi <code>judul</code> atau salah tulis, editor langsung memberi peringatan.'
      ]
    },
    {
      type: 'example',
      title: 'Memberi tipe pada state & children',
      lang: 'typescript',
      output: false,
      code: `import { useState, type ReactNode } from 'react';

// children bertipe ReactNode — bisa teks, elemen, atau komponen.
interface PanelProps {
  judul: string;
  children: ReactNode;
}

function Panel({ judul, children }: PanelProps) {
  // Tipe state dapat ditulis eksplisit atau disimpulkan dari nilai awal.
  const [terbuka, setTerbuka] = useState<boolean>(true);
  const [nama, setNama] = useState<string>('');

  // Union type: nilai hanya boleh salah satu dari ini.
  const [status, setStatus] = useState<'memuat' | 'sukses' | 'gagal'>('memuat');

  return (
    <div>
      <h3 onClick={() => setTerbuka(!terbuka)}>{judul}</h3>
      {terbuka && <div>{children}</div>}
    </div>
  );
}`,
      explain: [
        '<code>useState&lt;boolean&gt;(true)</code> menetapkan tipe eksplisit; TypeScript juga bisa menyimpulkan sendiri.',
        '<code>ReactNode</code> adalah tipe standar untuk <code>children</code>.',
        'Union <code>\'memuat\' | \'sukses\' | \'gagal\'</code> mencegah nilai status yang salah ketik.'
      ]
    },
    {
      type: 'example',
      title: 'Memberi tipe pada event handler',
      lang: 'typescript',
      output: false,
      code: `import { useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';

function FormNama() {
  const [nama, setNama] = useState('');

  // Event perubahan input
  function ubah(e: ChangeEvent<HTMLInputElement>) {
    setNama(e.target.value);
  }

  // Event submit form
  function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert(nama);
  }

  // Event klik
  function klik(e: MouseEvent<HTMLButtonElement>) {
    console.log('posisi:', e.clientX, e.clientY);
  }

  return (
    <form onSubmit={kirim}>
      <input value={nama} onChange={ubah} />
      <button type="button" onClick={klik}>Catat posisi</button>
      <button type="submit">Kirim</button>
    </form>
  );
}`,
      explain: [
        '<code>ChangeEvent&lt;HTMLInputElement&gt;</code> mengetik event perubahan khusus input.',
        '<code>FormEvent</code> untuk form, <code>MouseEvent</code> untuk klik mouse.',
        'Dengan tipe ini, editor tahu properti apa yang tersedia pada <code>e</code> dan salah tulis akan ditandai.'
      ]
    },
    {
      type: 'example',
      title: 'Memberi tipe pada useRef',
      lang: 'typescript',
      output: false,
      code: `import { useRef } from 'react';

function FokusInput() {
  // Ref ke elemen DOM: beri nilai awal null, tipe elemennya HTMLInputElement.
  const inputRef = useRef<HTMLInputElement>(null);

  function fokus() {
    // current bisa null sebelum render — aman dengan optional chaining.
    inputRef.current?.focus();
  }

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={fokus}>Fokus</button>
    </div>
  );
}`,
      explain: [
        '<code>useRef&lt;HTMLInputElement&gt;(null)</code> memberitahu TypeScript elemen apa yang dirujuk.',
        '<code>inputRef.current?.focus()</code> mencegah error bila ref belum terpasang.',
        'Tipe elemen lain: <code>HTMLButtonElement</code>, <code>HTMLDivElement</code>, dan seterusnya.'
      ]
    },
    {
      type: 'example',
      title: 'Custom Hook dengan Generic',
      lang: 'typescript',
      output: false,
      code: `import { useState } from 'react';

// Generic <T> membuat hook bisa menyimpan tipe apa pun.
function useLocalStorage<T>(kunci: string, nilaiAwal: T) {
  const [nilai, setNilai] = useState<T>(() => {
    const tersimpan = localStorage.getItem(kunci);
    return tersimpan ? (JSON.parse(tersimpan) as T) : nilaiAwal;
  });

  function simpan(baru: T) {
    setNilai(baru);
    localStorage.setItem(kunci, JSON.stringify(baru));
  }

  return [nilai, simpan] as const;
}

// Pemakaian — TypeScript tahu tipe yang disimpan:
interface Pengguna { nama: string; umur: number }

function Profil() {
  const [user, setUser] = useLocalStorage<Pengguna>('user', { nama: '', umur: 0 });
  return <p>{user.nama} ({user.umur})</p>;
}`,
      explain: [
        '<code>&lt;T&gt;</code> adalah generic: hook yang sama dapat menyimpan string, angka, atau objek.',
        '<code>useLocalStorage&lt;Pengguna&gt;(...)</code> menetapkan tipe T menjadi <code>Pengguna</code>.',
        'Hasilnya tetap aman-tipe: <code>setUser</code> hanya menerima objek Pengguna.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai tanpa tipe, tambahkan bertahap',
      text: 'Tidak semua hal perlu tipe rumit. Biarkan TypeScript <b>menyimpulkan</b> (inference) bila sudah jelas, dan beri tipe eksplisit pada props, event, serta batas antar-modul. Justru di situlah TypeScript memberi nilai terbesar.'
    },
    {
      type: 'warn',
      title: 'Hindari any untuk mematikan TypeScript',
      text: 'Memakai <code>any</code> di mana-mana menghapus manfaat TypeScript — sama seperti menulis JavaScript tanpa keamanan. Bila tipe belum diketahui, gunakan <code>unknown</code> lalu periksa tipenya, atau generik. Simpan <code>any</code> sebagai pilihan terakhir.'
    },
    {
      type: 'vocab',
      items: [
        ['TypeScript', 'JavaScript dengan tipe statis yang dicek saat pengembangan.'],
        ['Props type', 'Bentuk data yang diterima komponen, ditulis sebagai interface/type.'],
        ['ReactNode', 'Tipe untuk children: teks, elemen, atau komponen.'],
        ['Union type', 'Nilai yang boleh salah satu dari beberapa tipe.'],
        ['Generic', 'Tipe yang menjadi parameter, mis. useLocalStorage&lt;T&gt;.'],
        ['ChangeEvent', 'Tipe event perubahan input di React.'],
        ['Inference', 'TypeScript menyimpulkan tipe secara otomatis.'],
        ['any', 'Tipe bebas yang mematikan pemeriksaan — sebaiknya dihindari.']
      ]
    }
  ],
  recap: [
    'Gunakan template react-ts untuk proyek React + TypeScript.',
    'Beri tipe props dengan interface/type; tanda ? untuk properti opsional.',
    'children bertipe ReactNode; state bisa bertipe eksplisit atau inference.',
    'Event handler memakai ChangeEvent, FormEvent, MouseEvent sesuai konteksnya.',
    'useRef bertipe elemennya, mis. useRef<HTMLInputElement>(null).',
    'Generic membuat Custom Hook aman-tipe untuk berbagai jenis data; hindari any.'
  ]
});

/* ---------- Pelajaran 19: Next.js & Ekosistem Full-Stack ---------- */
window.REACT_LESSONS.push({
  id: 'nextjs-ekosistem',
  title: 'Next.js & Ekosistem Full-Stack',
  chapter: 'Topik Lanjutan',
  duration: '15 menit',
  intro: [
    'React murni berjalan sepenuhnya di sisi klien (<b>CSR</b>). Cara ini hebat untuk aplikasi interaktif, tetapi kurang ideal untuk halaman yang perlu cepat tampil atau ramah mesin pencari (SEO). Di sinilah <b>framework</b> seperti <b>Next.js</b> berperan.',
    'Pelajaran ini menjelaskan transisi dari CSR ke <b>SSR/SSG</b>, dasar <b>App Router</b> Next.js, serta keunggulannya untuk SEO.'
  ],
  objectives: [
    'Memahami perbedaan CSR, SSR, SSG, dan ISR',
    'Mengenal Next.js dan App Router',
    'Membuat halaman dengan Server Component di Next.js',
    'Memahami peran metadata untuk SEO'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Ada beberapa "mode" merender halaman web. Memahami perbedaannya memudahkan memilih alat yang tepat.</p><table class="vocab"><tr><th>Mode</th><th>Di mana HTML dibuat</th><th>Cocok untuk</th></tr><tr><td><b>CSR</b> (Client-Side Rendering)</td><td>Di browser pengunjung</td><td>Aplikasi interaktif, dasbor, setelah login</td></tr><tr><td><b>SSR</b> (Server-Side Rendering)</td><td>Di server, tiap ada permintaan</td><td>Konten yang selalu segar &amp; perlu SEO</td></tr><tr><td><b>SSG</b> (Static Site Generation)</td><td>Di server, sekali saat build</td><td>Blog, dokumentasi, halaman jarang berubah</td></tr><tr><td><b>ISR</b> (Incremental Static Regeneration)</td><td>Statis, tapi diperbarui berkala</td><td>Katalog produk, berita</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Alur CSR vs SSR',
      lang: 'text',
      output: false,
      code: `CSR (React murni):
  Browser minta halaman -> server kirim HTML kosong + JS
  -> browser menjalankan JS -> React menggambar tampilan
  -> Konten baru terlihat setelah JS selesai (lebih lambat, kurang SEO)

SSR (Next.js):
  Browser minta halaman -> server menjalankan React
  -> server kirim HTML YANG SUDAH TERISI
  -> browser menampilkan cepat -> JS menyempurnakan (hydration)
  -> Konten siap sebelum JS selesai (lebih ramah SEO)`,
      explain: [
        'Pada CSR, HTML awal kosong sehingga crawler & pengunjung menunggu JavaScript.',
        'Pada SSR, server mengirim HTML yang sudah berisi konten — halaman tampil lebih cepat.',
        '<b>Hydration</b> adalah proses JavaScript "menghidupkan" HTML statis agar interaktif.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat proyek Next.js',
      lang: 'bash',
      output: false,
      code: `npx create-next-app@latest aplikasi-next

# Beberapa pertanyaan akan muncul; jawab sesuai kebutuhan.
# Untuk TypeScript, Tailwind, dan App Router: pilih "Yes".

cd aplikasi-next
npm run dev
# Buka http://localhost:3000`,
      explain: [
        'Next.js dibangun di atas React, jadi semua konsep React (komponen, props, state, hooks) tetap berlaku.',
        'Ia menambah fitur server: SSR, API routes, optimasi gambar, dan lainnya.',
        'Secara bawaan Next.js sudah siap untuk SEO.'
      ]
    },
    {
      type: 'text',
      html: '<p>Next.js memakai <b>App Router</b> dengan routing berbasis <b>struktur folder</b>: setiap folder di dalam <code>app/</code> menjadi satu segmen URL, dan berkas <code>page.tsx</code> (atau <code>page.jsx</code>) menjadi halamannya. Secara bawaan, komponen di App Router adalah <b>Server Component</b> — dirender di server, dan bisa mengambil data langsung tanpa efek di klien.</p>'
    },
    {
      type: 'example',
      title: 'Rute berbasis folder (App Router)',
      lang: 'text',
      output: false,
      code: `app/
├── layout.tsx           -> kerangka seluruh aplikasi (navbar/footer)
├── page.tsx             -> halaman "/" (beranda)
├── tentang/
│   └── page.tsx         -> halaman "/tentang"
└── produk/
    ├── page.tsx         -> halaman "/produk"
    └── [id]/
        └── page.tsx     -> halaman dinamis "/produk/kopi"`,
      explain: [
        '<code>layout.tsx</code> membungkus semua halaman — mirip komponen TataLetak dengan Outlet.',
        'Folder <code>[id]</code> dengan tanda kurung siku menandai segmen dinamis (seperti <code>:id</code>).',
        'Tidak perlu menulis konfigurasi rute secara manual — cukup menata folder.'
      ]
    },
    {
      type: 'example',
      title: 'Server Component mengambil data',
      lang: 'typescript',
      output: false,
      code: `// app/produk/page.tsx — Server Component (default di App Router)
async function halamanProduk() {
  // fetch berjalan DI SERVER, langsung saat render.
  const res = await fetch('https://fakestoreapi.com/products', {
    next: { revalidate: 60 }   // ISR: segarkan cache tiap 60 detik
  });
  const produk = await res.json();

  return (
    <ul>
      {produk.map((p: { id: number; title: string }) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}

export default halamanProduk;`,
      explain: [
        'Komponen <code>async</code> boleh mengambil data langsung — tanpa <code>useEffect</code>.',
        'Karena berjalan di server, pengunjung menerima HTML yang sudah berisi daftar produk.',
        '<code>revalidate</code> adalah ISR: halaman statis namun diperbarui berkala.'
      ]
    },
    {
      type: 'example',
      title: 'Metadata untuk SEO',
      lang: 'typescript',
      output: false,
      code: `// app/produk/[id]/page.tsx
import type { Metadata } from 'next';

// Metadata dinamis untuk setiap halaman produk.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: 'Produk ' + params.id + ' — Toko Saya',
    description: 'Detail produk ' + params.id + ' dengan harga terbaik.',
    openGraph: { images: ['/og-produk.jpg'] }
  };
}

export default function Halaman({ params }: { params: { id: string } }) {
  return <h1>Detail produk: {params.id}</h1>;
}`,
      explain: [
        '<code>generateMetadata</code> menghasilkan judul & deskripsi <code>&lt;head&gt;</code> yang dilihat mesin pencari.',
        'Karena HTML dikirim lengkap dari server, crawler Google bisa membaca kontennya.',
        'Inilah alasan Next.js sangat cocok untuk situs yang butuh peringkat pencarian.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan tetap pakai React murni (Vite)?',
      text: 'React + Vite (CSR) tetap pilihan bagus untuk <b>dasbor internal</b>, aplikasi yang butuh login, atau saat SEO tidak penting. Pilih Next.js ketika kamu perlu halaman cepat tampil, ramah mesin pencari, atau ingin API dan antarmuka dalam satu proyek.'
    },
    {
      type: 'warn',
      title: 'Server Component ≠ Client Component',
      text: 'Di App Router, komponen secara bawaan berjalan di <b>server</b> dan tidak boleh memakai Hook seperti useState/useEffect. Bila butuh interaktivitas, tambahkan <code>"use client"</code> di baris paling atas berkas. Memahami batas server/klien ini adalah kunci memakai Next.js dengan benar.'
    },
    {
      type: 'vocab',
      items: [
        ['CSR', 'Rendering di browser; React murni bekerja seperti ini.'],
        ['SSR', 'Rendering di server pada setiap permintaan.'],
        ['SSG', 'Rendering sekali saat build menjadi HTML statis.'],
        ['ISR', 'Halaman statis yang diperbarui berkala di latar belakang.'],
        ['Hydration', 'Proses JS menghidupkan HTML hasil render server.'],
        ['App Router', 'Sistem routing Next.js berbasis struktur folder app/.'],
        ['Server Component', 'Komponen yang berjalan di server (bawaan App Router).'],
        ['Metadata', 'Informasi halaman (judul, deskripsi) yang dibaca mesin pencari.']
      ]
    }
  ],
  recap: [
    'CSR merender di browser; SSR di server; SSG saat build; ISR statis yang diperbarui berkala.',
    'Next.js adalah framework di atas React yang mendukung SSR/SSG/ISR.',
    'App Router memakai routing berbasis folder: app/nama/page.tsx.',
    'Server Component boleh mengambil data langsung dengan async/await.',
    'Metadata (generateMetadata) penting untuk SEO.',
    'Gunakan React + Vite untuk aplikasi interaktif; Next.js untuk situs yang butuh SEO.'
  ]
});
