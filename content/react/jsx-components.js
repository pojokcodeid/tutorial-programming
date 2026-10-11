/* ============================================================
   Pelajaran React — Bab 2: JSX, Komponen & Props, Styling
   (topik info.md:
    - "JSX (JavaScript XML): aturan penulisan & embedded expressions"
    - "Components & Props: functional components, mengirim data"
    - "Styling di React: inline CSS, CSS Modules, atau Tailwind CSS")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 3: JSX (JavaScript XML) ---------- */
window.REACT_LESSONS.push({
  id: 'jsx',
  title: 'JSX (JavaScript XML)',
  chapter: 'Dasar React',
  duration: '12 menit',
  intro: [
    '<b>JSX</b> adalah sintaks khusus React yang membuat kita bisa menulis struktur tampilan <b>mirip HTML</b> langsung di dalam JavaScript. Contohnya: <code>const el = &lt;h1&gt;Halo&lt;/h1&gt;;</code>.',
    'JSX bukan HTML, dan bukan pula string. Ia adalah cara singkat menulis <code>React.createElement(...)</code>. Pelajaran ini membahas aturannya dan cara menyisipkan nilai JavaScript ke dalamnya.'
  ],
  objectives: [
    'Memahami apa itu JSX dan mengapa dipakai',
    'Menuliskan aturan-aturan penting JSX',
    'Menyisipkan ekspresi JavaScript (embedded expressions) di dalam JSX',
    'Membedakan atribut JSX dengan atribut HTML'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tanpa JSX, membuat satu elemen React akan terasa panjang:</p><p><code>React.createElement("h1", { className: "judul" }, "Halo")</code></p><p>Dengan JSX, kode yang sama menjadi jauh lebih mudah dibaca:</p><p><code>&lt;h1 className="judul"&gt;Halo&lt;/h1&gt;</code></p><p>Di balik layar, alat build seperti <b>Vite</b> mengubah setiap JSX menjadi pemanggilan <code>createElement</code> seperti di atas. Jadi JSX hanyalah "gula" agar kode tampilan lebih nyaman ditulis.</p>'
    },
    {
      type: 'example',
      title: 'JSX dasar',
      lang: 'jsx',
      output: false,
      code: `const elemen = <h1>Selamat datang di React</h1>;

// JSX boleh ditulis lebih dari satu baris — bungkus dengan tanda kurung.
const kartu = (
  <div className="kartu">
    <h2>Judul</h2>
    <p>Deskripsi singkat.</p>
  </div>
);

function Sapaan() {
  return <p>Halo dunia!</p>;
}`,
      explain: [
        'JSX mirip HTML, tetapi ditulis di dalam berkas JavaScript.',
        'Tanda kurung <code>( ... )</code> hanya untuk membaca kode multi-baris dengan rapi.',
        'Setiap komponen dapat mengembalikan (return) potongan JSX.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kekuatan JSX ada pada <b>embedded expression</b>: kita bisa menyisipkan nilai JavaScript apa pun ke dalam tampilan dengan <b>kurawal <code>{ }</code></b>. Isi kurawal harus berupa <b>ekspresi</b> yang menghasilkan nilai — variabel, perhitungan, pemanggilan fungsi, atau ternary.</p>'
    },
    {
      type: 'example',
      title: 'Menyisipkan ekspresi dengan { }',
      lang: 'jsx',
      output: false,
      code: `const nama = 'Andi';
const angka = 7;

function Profil() {
  return (
    <div>
      <h1>Halo, {nama}!</h1>              {/* variabel */}
      <p>Umur kamu 7 tahun lagi: {5 + 2}</p> {/* perhitungan */}
      <p>Nama huruf besar: {nama.toUpperCase()}</p> {/* fungsi */}
      <p>{angka > 5 ? 'Angka besar' : 'Angka kecil'}</p> {/* ternary */}
    </div>
  );
}`,
      explain: [
        'Apa pun di dalam <code>{ }</code> dievaluasi sebagai JavaScript dan hasilnya ditampilkan.',
        '<code>{5 + 2}</code> menampilkan <code>7</code>.',
        '<code>{nama.toUpperCase()}</code> menampilkan <code>ANDI</code>.',
        'Di dalam JSX, komentar ditulis <code>{/* seperti ini */}</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Aturan penting JSX',
      lang: 'jsx',
      output: false,
      code: `// 1. class -> className, for -> htmlFor
<label htmlFor="nama">Nama</label>

// 2. Tag tunggal harus ditutup sendiri
<img src="foto.jpg" alt="Foto" />
<br />

// 3. Harus mengembalikan SATU elemen induk (bungkus semuanya)
return (
  <div>
    <h1>Judul</h1>
    <p>Isi</p>
  </div>
);

// 4. Fragment <></> membungkus tanpa menambah elemen ke DOM
return (
  <>
    <h1>Judul</h1>
    <p>Isi</p>
  </>
);

// 5. Nama atribut memakai gaya camelCase
<div tabIndex={0} onClick={handleKlik}></div>`,
      explain: [
        'Karena <code>class</code> dan <code>for</code> sudah dipakai JavaScript, JSX memakai <code>className</code> dan <code>htmlFor</code>.',
        'JSX mewajibkan tag ditutup: <code>&lt;img /&gt;</code>, <code>&lt;br /&gt;</code>.',
        'Satu <code>return</code> hanya boleh mengembalikan satu elemen induk. Fragment <code>&lt;&gt;...&lt;/&gt;</code> adalah solusinya.',
        'Atribut seperti <code>onclick</code> ditulis <code>onClick</code> (camelCase) karena JSX memakai properti DOM.'
      ]
    },
    {
      type: 'tip',
      title: 'Nilai atribut juga boleh ekspresi',
      text: 'Atribut JSX bisa menerima nilai tetap (<code>src="foto.jpg"</code>) atau ekspresi (<code>src={gambarURL}</code>). Untuk nilai string tetap, tanda kutip cukup; untuk variabel/angka/objek, gunakan kurawal tanpa tanda kutip: <code>lebar={200}</code>.'
    },
    {
      type: 'warn',
      title: 'Satu blok JSX = satu elemen induk',
      text: 'Mengembalikan dua elemen bersaudara tanpa pembungkus akan menimbulkan error: <code>Adjacent JSX elements must be wrapped</code>. Solusinya bungkus dengan <code>&lt;div&gt;</code> atau fragment <code>&lt;&gt;...&lt;/&gt;</code>. Fragment berguna agar DOM tidak dipenuhi <code>div</code> tambahan.'
    },
    {
      type: 'vocab',
      items: [
        ['JSX', 'Sintaks mirip HTML di dalam JavaScript untuk mendeskripsikan tampilan React.'],
        ['Embedded expression', 'Nilai JavaScript yang disisipkan ke JSX dengan kurawal { }.'],
        ['createElement', 'Fungsi React yang dihasilkan saat JSX dikompilasi.'],
        ['className', 'Padanan atribut class di JSX.'],
        ['htmlFor', 'Padanan atribut for di JSX.'],
        ['Fragment', 'Pembungkus &lt;&gt;...&lt;/&gt; yang tidak menambah elemen ke DOM.'],
        ['camelCase', 'Penulisan nama atribut JSX, mis. onClick, tabIndex.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: tampilan hasil JSX',
      lang: 'html',
      hint: 'Ini HTML yang dihasilkan JSX di atas. Ubah teks atau warnanya, lalu klik Jalankan untuk melihat hasilnya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Hasil JSX</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }
    .profil { border: 2px solid #61dafb; border-radius: 12px; padding: 16px; max-width: 360px; }
    h1 { color: #087ea4; margin: 0 0 6px; }
    .kecil { color: #666; font-size: 13px; }
  </style>
</head>
<body>
  <div class="profil">
    <h1>Halo, Andi!</h1>
    <p>Umur kamu 7 tahun lagi: 7</p>
    <p>Nama huruf besar: ANDI</p>
    <p>Angka besar</p>
    <p class="kecil">Setiap baris di atas berasal dari satu ekspresi { }.</p>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'JSX memungkinkan menulis tampilan mirip HTML di dalam JavaScript.',
    'JSX dikompilasi menjadi pemanggilan React.createElement.',
    'Ekspresi JavaScript disisipkan dengan kurawal { }.',
    'Gunakan className (bukan class), htmlFor (bukan for), dan camelCase untuk event.',
    'Tag tunggal wajib ditutup sendiri, dan satu return hanya boleh satu elemen induk.',
    'Fragment <>...</> membungkus tanpa menambah elemen ke DOM.'
  ]
});

/* ---------- Pelajaran 4: Components & Props ---------- */
window.REACT_LESSONS.push({
  id: 'components-dan-props',
  title: 'Komponen & Props',
  chapter: 'Dasar React',
  duration: '13 menit',
  intro: [
    'Aplikasi React dibangun dari <b>komponen</b>: potongan UI yang bisa dipakai ulang. Agar satu komponen bisa menampilkan data berbeda-beda, kita mengirim data ke dalamnya lewat <b>props</b> (singkatan dari <i>properties</i>).',
    'Pelajaran ini membahas cara membuat functional component, mengirim & menerima props, memakai <code>children</code>, serta menyusun komponen satu dari yang lain.'
  ],
  objectives: [
    'Membuat functional component',
    'Mengirim data ke komponen dengan props',
    'Menerima props dengan destructuring & memberi nilai bawaan',
    'Mengenal props spesial children',
    'Menyusun (compose) komponen dari komponen lain'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Functional component</b> adalah function JavaScript yang namanya diawali huruf kapital dan mengembalikan JSX. Ia bisa dipakai seperti tag HTML buatan sendiri. Sebuah aplikasi React pada dasarnya adalah pohon (tree) komponen yang saling bersarang.</p>'
    },
    {
      type: 'example',
      title: 'Membuat komponen dan memakainya',
      lang: 'jsx',
      output: false,
      code: `function Tombol() {
  return <button>Klik aku</button>;
}

function Aplikasi() {
  return (
    <div>
      <h1>Belajar Komponen</h1>
      <Tombol />
      <Tombol />
    </div>
  );
}`,
      explain: [
        'Komponen didefinisikan sekali, lalu dipakai berulang kali.',
        'Nama komponen <b>wajib diawali huruf kapital</b>. React memakai huruf kapital untuk membedakannya dari tag HTML biasa.',
        '<code>&lt;Tombol /&gt;</code> memanggil function <code>Tombol</code> lalu memasang hasil JSX-nya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Komponen yang tidak menerima data selalu menampilkan hal yang sama. Agar fleksibel, kita mengirim data lewat <b>props</b> — seperti argumen pada function. Nilai props ditulis sebagai atribut saat memakai komponen.</p>'
    },
    {
      type: 'example',
      title: 'Mengirim props',
      lang: 'jsx',
      output: false,
      code: `// Komponen menerima props sebagai satu objek parameter.
function Sapaan(props) {
  return <h2>Halo, {props.nama}!</h2>;
}

function Aplikasi() {
  return (
    <div>
      <Sapaan nama="Andi" />
      <Sapaan nama="Budi" />
      <Sapaan nama="Citra" />
    </div>
  );
}

// Hasil di layar:
// Halo, Andi!
// Halo, Budi!
// Halo, Citra!`,
      explain: [
        'Props dikirim lewat atribut saat komponen dipanggil: <code>nama="Andi"</code>.',
        'Di dalam komponen, nilai itu dibaca dari objek <code>props</code>: <code>props.nama</code>.',
        'Satu komponen yang sama dapat menghasilkan tampilan berbeda sesuai props.'
      ]
    },
    {
      type: 'example',
      title: 'Destructuring & nilai bawaan (default)',
      lang: 'jsx',
      output: false,
      code: `// Cara yang lebih rapi: langsung "membedah" props di parameter.
function Kartu({ judul, isi, warna = 'biru' }) {
  return (
    <div className={'kartu ' + warna}>
      <h3>{judul}</h3>
      <p>{isi}</p>
    </div>
  );
}

function Aplikasi() {
  return (
    <div>
      <Kartu judul="Berita" isi="React makin populer." />
      <Kartu judul="Tips" isi="Pakai destructuring." warna="hijau" />
    </div>
  );
}`,
      explain: [
        '<code>{ judul, isi }</code> adalah destructuring: mengambil properti tertentu dari objek props.',
        '<code>warna = "biru"</code> memberi <b>nilai bawaan</b> bila props warna tidak dikirim.',
        'Kartu pertama memakai warna bawaan "biru"; kartu kedua memakai "hijau" yang dikirim eksplisit.'
      ]
    },
    {
      type: 'text',
      html: '<p>Props tidak harus berupa teks. Kita bisa mengirim <b>angka</b>, <b>boolean</b>, <b>array</b>, <b>objek</b>, bahkan <b>function</b> — dan semuanya dituliskan di dalam kurawal, kecuali nilai string tetap.</p>'
    },
    {
      type: 'example',
      title: 'Berbagai jenis props',
      lang: 'jsx',
      output: false,
      code: `function Info({ nama, umur, aktif, hobi, saatKlik }) {
  return (
    <div>
      <p>Nama: {nama}</p>
      <p>Umur: {umur}</p>                {/* angka, tanpa tanda kutip */}
      <p>Status: {aktif ? 'Aktif' : 'Nonaktif'}</p> {/* boolean */}
      <p>Hobi: {hobi.join(', ')}</p>     {/* array */}
      <button onClick={saatKlik}>Feed</button> {/* function */}
    </div>
  );
}

function Aplikasi() {
  return (
    <Info
      nama="Andi"
      umur={30}
      aktif={true}
      hobi={['membaca', 'berkoding']}
      saatKlik={() => alert('Hai!')}
    />
  );
}`,
      explain: [
        'String ditulis dengan tanda kutip: <code>nama="Andi"</code>.',
        'Angka, boolean, array, objek, dan function harus di dalam kurawal: <code>umur={30}</code>, <code>aktif={true}</code>.',
        'Mengirim function lewat props sangat penting — begitulah komponen anak melaporkan sesuatu kepada induknya.'
      ]
    },
    {
      type: 'example',
      title: 'Props spesial: children',
      lang: 'jsx',
      output: false,
      code: `// Isi yang berada DI ANTARA tag pembuka & penutup dikirim sebagai props.children.
function Panel({ judul, children }) {
  return (
    <div className="panel">
      <h3>{judul}</h3>
      <div>{children}</div>
    </div>
  );
}

function Aplikasi() {
  return (
    <Panel judul="Pengumuman">
      <p>Ujian akhir dimulai besok.</p>
      <button>Saya mengerti</button>
    </Panel>
  );
}`,
      explain: [
        'Segala sesuatu di antara <code>&lt;Panel&gt;</code> dan <code>&lt;/Panel&gt;</code> menjadi <code>children</code>.',
        'Pola ini membuat komponen "pembungkus" yang rapi — seperti kartu, dialog, atau panel.',
        'Kamu bisa mengisi children dengan teks, beberapa elemen, bahkan komponen lain.'
      ]
    },
    {
      type: 'tip',
      title: 'Susun komponen dari yang kecil',
      text: 'Aturan praktis: bila sebuah komponen menjadi terlalu panjang, pecah menjadi komponen-komponen kecil yang lebih fokus. Mulailah dari komponen terkecil (tombol, avatar, badge), lalu susun menjadi kartu, lalu halaman. Pohon komponen yang rapi mempermudah pencarian bug.'
    },
    {
      type: 'warn',
      title: 'Props itu hanya-baca (read-only)',
      text: 'Komponen <b>tidak boleh mengubah</b> props yang diterimanya. <code>props.nama = "X"</code> adalah kesalahan. Props mengalir satu arah dari induk ke anak, seperti air mengalir ke bawah. Bila anak perlu mengubah sesuatu, ia meminta induk melakukannya lewat function yang dikirim sebagai props.'
    },
    {
      type: 'vocab',
      items: [
        ['Functional component', 'Komponen berbentuk function yang mengembalikan JSX.'],
        ['Props', 'Data yang dikirim dari komponen induk ke komponen anak.'],
        ['Destructuring', 'Mengambil properti tertentu dari objek, mis. { nama } dari props.'],
        ['Default props', 'Nilai bawaan yang dipakai bila props tidak dikirim.'],
        ['children', 'Props spesial berisi isi di antara tag pembuka & penutup komponen.'],
        ['One-way data flow', 'Data mengalir satu arah: dari induk ke anak, tidak sebaliknya.'],
        ['Komposisi', 'Menyusun komponen besar dari komponen-komponen kecil.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: kartu dengan props berbeda',
      lang: 'html',
      hint: 'Bayangkan tiga kartu di bawah dibuat dari SATU komponen <Kartu judul="..." isi="..." warna="..." /> dengan props berbeda.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Props</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    .kartu { border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; border-left: 6px solid #94a3b8; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .biru { border-color: #3b82f6; }
    .hijau { border-color: #22c55e; }
    .merah { border-color: #ef4444; }
    h3 { margin: 0 0 4px; }
    p { margin: 0; color: #475569; }
  </style>
</head>
<body>
  <div class="kartu biru"><h3>Berita</h3><p>React makin populer.</p></div>
  <div class="kartu hijau"><h3>Tips</h3><p>Pakai destructuring props.</p></div>
  <div class="kartu merah"><h3>Peringatan</h3><p>Jangan ubah props di dalam komponen.</p></div>
</body>
</html>`
    }
  ],
  recap: [
    'Komponen adalah function bernama kapital yang mengembalikan JSX.',
    'Props mengirim data dari induk ke anak, dibaca sebagai objek props atau lewat destructuring.',
    'String dikutip, sedangkan angka/boolean/array/objek/function ditulis dalam kurawal.',
    'children berisi isi di antara tag pembuka dan penutup komponen.',
    'Props bersifat read-only — data mengalir satu arah dari induk ke anak.',
    'Pecah komponen besar menjadi komponen kecil yang bisa dipakai ulang.'
  ]
});

/* ---------- Pelajaran 5: Styling di React ---------- */
window.REACT_LESSONS.push({
  id: 'styling-react',
  title: 'Styling di React',
  chapter: 'Dasar React',
  duration: '12 menit',
  intro: [
    'Ada beberapa cara memberi gaya pada komponen React: <b>inline CSS</b> lewat objek style, <b>berkas CSS biasa</b> dengan <code>className</code>, <b>CSS Modules</b> agar gaya bersifat lokal, dan <b>Tailwind CSS</b> dengan kelas utilitas.',
    'Setiap cara punya kelebihan. Pelajaran ini menunjukkan keempatnya beserta kapan sebaiknya dipakai.'
  ],
  objectives: [
    'Memberi gaya dengan inline style (objek JavaScript)',
    'Memakai berkas CSS dan className di komponen',
    'Memakai CSS Modules agar kelas tidak bentrok',
    'Mengenal pendekatan utility-first dengan Tailwind CSS'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Cara paling langsung adalah <b>inline style</b>. Berbeda dari HTML biasa, di React gaya ditulis sebagai <b>objek JavaScript</b>: nama propertinya <b>camelCase</b> (<code>fontSize</code>, bukan <code>font-size</code>) dan nilainya berupa string atau angka.</p>'
    },
    {
      type: 'example',
      title: 'Inline style (objek JavaScript)',
      lang: 'jsx',
      output: false,
      code: `function Kartu() {
  const gayaKartu = {
    backgroundColor: '#eef2ff',   // background-color -> backgroundColor
    padding: '16px',
    borderRadius: '12px',
    fontSize: 16                  // angka otomatis diberi satuan "px"
  };

  return (
    <div style={gayaKartu}>
      <h2 style={{ color: '#4338ca', marginTop: 0 }}>Kartu Berwarna</h2>
      <p style={{ color: '#475569' }}>Gaya ditulis sebagai objek JavaScript.</p>
    </div>
  );
}`,
      explain: [
        'Perhatikan <b>dua pasang kurawal</b> <code>style={{ ... }}</code>: kurawal luar adalah JSX, kurawal dalam adalah objek JavaScript.',
        'Nama properti memakai camelCase: <code>backgroundColor</code>, <code>borderRadius</code>, <code>fontSize</code>.',
        'Angka tanpa satuan otomatis ditafsirkan sebagai piksel, mis. <code>fontSize: 16</code> sama dengan <code>16px</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk gaya yang lebih banyak dan ingin dipakai ulang, lebih rapi menyimpannya di <b>berkas CSS terpisah</b> lalu memanggilnya dengan atribut <code>className</code>.</p>'
    },
    {
      type: 'example',
      title: 'Berkas CSS + className',
      lang: 'jsx',
      output: false,
      code: `// App.css
// .kartu { background:#eef2ff; border-radius:12px; padding:16px; }
// .kartu h2 { color:#4338ca; margin-top:0; }

// App.jsx
import './App.css';

function App() {
  return (
    <div className="kartu">
      <h2>Kartu dari CSS</h2>
      <p>Gaya diambil dari berkas App.css.</p>
    </div>
  );
}

export default App;`,
      explain: [
        'Impor berkas CSS sekali saja (biasanya di komponen teratas) dengan <code>import "./App.css"</code>.',
        'Gaya dipanggil lewat <code>className</code>, bukan <code>class</code>.',
        'Kekurangannya: kelas CSS bersifat <b>global</b> — nama yang sama di dua berkas bisa saling menimpa.'
      ]
    },
    {
      type: 'example',
      title: 'CSS Modules (gaya bersifat lokal)',
      lang: 'jsx',
      output: false,
      code: `// Kartu.module.css
// .kartu { background:#eef2ff; border-radius:12px; padding:16px; }
// .judul { color:#4338ca; }

// Kartu.jsx
import styles from './Kartu.module.css';

function Kartu() {
  return (
    <div className={styles.kartu}>
      <h2 className={styles.judul}>Kartu Aman</h2>
      <p>Nama kelasnya diacak otomatis, tidak akan bentrok.</p>
    </div>
  );
}`,
      explain: [
        'Berkas CSS Modules diberi akhiran <code>.module.css</code>.',
        'Kelasnya diakses sebagai properti objek: <code>styles.kartu</code>.',
        'React+Vite akan mengubah nama kelas menjadi unik (mis. <code>kartu_a1b2</code>), sehingga gaya satu komponen tidak bocor ke komponen lain.'
      ]
    },
    {
      type: 'example',
      title: 'Tailwind CSS (utility-first)',
      lang: 'jsx',
      output: false,
      code: `// Setiap gaya adalah kelas kecil (utility) yang digabung di className.
function Kartu() {
  return (
    <div className="bg-indigo-50 rounded-xl p-4 shadow">
      <h2 className="text-indigo-700 font-bold text-lg">Kartu Tailwind</h2>
      <p className="text-slate-600">Gaya disusun dari kelas-kelas utilitas.</p>
    </div>
  );
}

// Pemasangan Tailwind (ringkas, lewat npm):
//   npm install -D tailwindcss @tailwindcss/postcss
// lalu tambahkan direktif Tailwind di index.css.`,
      explain: [
        'Tailwind menyediakan kelas siap pakai: <code>bg-indigo-50</code> (latar), <code>rounded-xl</code> (sudut), <code>p-4</code> (padding), <code>shadow</code> (bayangan).',
        'Gaya ditulis langsung di JSX, tanpa berpindah ke berkas CSS.',
        'Pendekatan ini cepat dan konsisten, tetapi class bisa menjadi panjang — banyak orang memakai bantuan library seperti <code>clsx</code> untuk menggabungkan kelas secara kondisional.'
      ]
    },
    {
      type: 'example',
      title: 'Menggabungkan kelas secara kondisional',
      lang: 'jsx',
      output: false,
      code: `// className bisa diisi hasil ekspresi, bukan hanya teks tetap.
function Tombol({ aktif, children }) {
  const kelas = aktif ? 'btn btn-aktif' : 'btn';
  return <button className={kelas}>{children}</button>;
}

// Pola umum dengan template literal:
function Lencana({ penting }) {
  return (
    <span className={\`badge \${penting ? 'badge-merah' : 'badge-abu'}\`}>
      Baru
    </span>
  );
}`,
      explain: [
        '<code>className</code> menerima string apa pun, termasuk hasil ternary atau gabungan string.',
        'Pola ini memudahkan menyalakan/mematikan gaya berdasarkan state atau props.',
        'Untuk kasus rumit, library <code>clsx</code> atau <code>classnames</code> membuat gabungan kelas lebih rapi.'
      ]
    },
    {
      type: 'tip',
      title: 'Mana yang sebaiknya dipakai?',
      text: 'Untuk latihan kecil, inline style atau CSS biasa sudah cukup. Untuk proyek menengah, <b>CSS Modules</b> memberi keamanan karena gaya bersifat lokal. Untuk membangun antarmuka besar dengan cepat dan konsisten, <b>Tailwind CSS</b> sangat membantu. Tidak masalah memadukan beberapa pendekatan.'
    },
    {
      type: 'warn',
      title: 'Jangan lupa: class → className',
      text: 'Sering terjadi kesalahan: menulis <code>class="kartu"</code> di JSX. Ini akan memicu peringatan di konsol dan gayanya tidak terpasang. Selalu pakai <code>className</code>. Begitu juga <code>for</code> pada label harus menjadi <code>htmlFor</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Inline style', 'Gaya yang ditulis langsung sebagai objek JavaScript pada atribut style.'],
        ['className', 'Atribut JSX pengganti class untuk memasang kelas CSS.'],
        ['CSS Modules', 'Berkas *.module.css yang kelasnya bersifat lokal per komponen.'],
        ['Tailwind CSS', 'Framework CSS utility-first dengan kelas-kelas kecil siap pakai.'],
        ['Global CSS', 'Gaya pada berkas CSS biasa yang berlaku untuk seluruh aplikasi.'],
        ['clsx', 'Library kecil untuk menggabungkan kelas CSS secara kondisional.'],
        ['Utility-first', 'Pendekatan menyusun tampilan dari banyak kelas utilitas kecil.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: bereksperimen dengan CSS',
      lang: 'html',
      hint: 'Di React, HTML ini bisa dibuat dari satu komponen. Ubah warnanya di bagian <style> untuk melihat efeknya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Styling</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; background: #f1f5f9; }
    .kartu {
      background: #eef2ff;
      border-radius: 12px;
      padding: 16px;
      max-width: 340px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, .15);
    }
    .kartu h2 { color: #4338ca; margin: 0 0 4px; }
    .kartu p { color: #475569; margin: 0; }
  </style>
</head>
<body>
  <div class="kartu">
    <h2>Kartu dari CSS</h2>
    <p>Gaya diambil dari kelas CSS.</p>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'Inline style ditulis sebagai objek JavaScript dengan properti camelCase.',
    'Berkas CSS dipanggil lewat import dan kelas dipasang dengan className.',
    'CSS Modules (*.module.css) membuat nama kelas unik sehingga tidak bentrok.',
    'Tailwind CSS menyusun gaya dari kelas utilitas langsung di JSX.',
    'className menerima ekspresi, jadi gaya bisa berubah sesuai state atau props.',
    'Di JSX, selalu pakai className dan htmlFor, bukan class dan for.'
  ]
});
