/* ============================================================
   Pelajaran React — Bab 4: React Hooks Esensial
   (topik info.md:
    - "React Hooks Esensial: useEffect, useRef,
       useMemo & useCallback")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 8: useEffect ---------- */
window.REACT_LESSONS.push({
  id: 'useeffect',
  title: 'useEffect — Side Effects',
  chapter: 'React Hooks',
  duration: '15 menit',
  intro: [
    'Komponen React idealnya hanya "menghitung tampilan" dari props dan state. Namun nyatanya aplikasi perlu melakukan hal di luar itu: <b>mengambil data</b> dari API, mengubah judul tab, memasang pengatur waktu, atau berlangganan event. Semua kegiatan "di luar render" itu disebut <b>side effect</b>.',
    'Hook <code>useEffect</code> adalah tempat resmi untuk menjalankan side effect sekaligus membersihkannya.'
  ],
  objectives: [
    'Memahami apa itu side effect di React',
    'Menjalankan efek sekali saja, setiap render, atau saat nilai tertentu berubah',
    'Membersihkan efek (cleanup) seperti timer dan event listener',
    'Mengambil data dari API dengan loading & error'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><code>useEffect</code> menerima dua argumen: sebuah <b>function efek</b> dan <b>array dependensi</b>. React akan menjalankan efek itu <i>setelah</i> render. Isi array dependensi menentukan <b>kapan</b> efek dijalankan ulang:</p><table class="vocab"><tr><th>Array dependensi</th><th>Kapan efek berjalan</th></tr><tr><td>tidak ada</td><td>Setiap kali komponen selesai render</td></tr><tr><td><code>[]</code> (kosong)</td><td>Sekali saja, setelah render pertama</td></tr><tr><td><code>[nilai]</code></td><td>Saat pertama kali &amp; setiap <code>nilai</code> berubah</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Menyesuaikan judul tab (sekali saja)',
      lang: 'jsx',
      output: false,
      code: `import { useEffect, useState } from 'react';

function Aplikasi() {
  const [nama, setNama] = useState('Tamu');

  // [] => jalankan sekali, setelah render pertama.
  useEffect(() => {
    document.title = 'Halo, ' + nama;
  }, []);

  return (
    <button onClick={() => setNama('Andi')}>Masuk sebagai Andi</button>
  );
}

// Karena dependensinya [], judul tab hanya diatur sekali
// dan TIDAK ikut berubah saat nama berganti.`,
      explain: [
        'Efek dijalankan <b>setelah</b> React menggambar tampilan, bukan saat render.',
        '<code>[]</code> berarti "jalankan sekali saja" — mirip <code>componentDidMount</code> di React lama.',
        'Di <code>React.StrictMode</code>, efek dengan <code>[]</code> dijalankan dua kali saat pengembangan untuk membantu menemukan bug.'
      ]
    },
    {
      type: 'example',
      title: 'Bergantung pada nilai tertentu',
      lang: 'jsx',
      output: false,
      code: `import { useEffect, useState } from 'react';

function Pencarian() {
  const [query, setQuery] = useState('');

  // Berjalan saat pertama kali DAN setiap kali "query" berubah.
  useEffect(() => {
    if (!query) return;
    console.log('Mencari:', query);
  }, [query]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Cari sesuatu..."
    />
  );
}`,
      explain: [
        'React membandingkan isi array dependensi dengan render sebelumnya.',
        'Bila <code>query</code> berubah, efek dijalankan lagi dengan nilai terbaru.',
        'Sertakan <b>semua</b> nilai yang dipakai di dalam efek ke array dependensi.'
      ]
    },
    {
      type: 'text',
      html: '<p>Efek sering meninggalkan "jejak" yang harus dibersihkan: timer, langganan event, atau koneksi. Untuk itu, function efek boleh <b>mengembalikan function cleanup</b>. React memanggil cleanup sebelum efek dijalankan ulang, dan saat komponen dilepas dari layar (unmount).</p>'
    },
    {
      type: 'example',
      title: 'Cleanup: timer & event listener',
      lang: 'jsx',
      output: false,
      code: `import { useEffect, useState } from 'react';

function Jam() {
  const [detik, setDetik] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setDetik((d) => d + 1);
    }, 1000);

    // cleanup: hentikan timer saat komponen dilepas.
    return () => clearInterval(id);
  }, []);

  return <p>Berjalan {detik} detik.</p>;
}

function LebarJendela() {
  const [lebar, setLebar] = useState(window.innerWidth);

  useEffect(() => {
    const ukur = () => setLebar(window.innerWidth);
    window.addEventListener('resize', ukur);

    // cleanup: lepaskan listener agar tidak menumpuk.
    return () => window.removeEventListener('resize', ukur);
  }, []);

  return <p>Lebar jendela: {lebar}px</p>;
}`,
      explain: [
        'Function yang dikembalikan dari efek adalah <b>cleanup</b>.',
        '<code>clearInterval</code> menghentikan timer agar tidak terus berjalan setelah komponen hilang.',
        '<code>removeEventListener</code> mencegah listener menumpuk setiap render.'
      ]
    },
    {
      type: 'example',
      title: 'Mengambil data dari API dengan loading & error',
      lang: 'jsx',
      output: false,
      code: `import { useEffect, useState } from 'react';

function DaftarPengguna() {
  const [pengguna, setPengguna] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let dibatalkan = false;   // penanda agar aman bila komponen dilepas

    async function ambilData() {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
        if (!dibatalkan) setPengguna(data);
      } catch (err) {
        if (!dibatalkan) setError(err.message);
      } finally {
        if (!dibatalkan) setMemuat(false);
      }
    }

    ambilData();
    return () => { dibatalkan = true; };
  }, []);

  if (memuat) return <p>⏳ Memuat...</p>;
  if (error) return <p>❌ {error}</p>;

  return (
    <ul>
      {pengguna.map((u) => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}`,
      explain: [
        'Kita memakai tiga state: data, status memuat, dan pesan error.',
        '<code>async</code> tidak boleh langsung dijadikan function efek, jadi kita buat function di dalam lalu panggil.',
        'Penanda <code>dibatalkan</code> mencegah setState saat komponen sudah tidak ada di layar.'
      ]
    },
    {
      type: 'tip',
      title: 'Aturan Hooks',
      text: 'Hook (nama diawali <code>use</code>) hanya boleh dipanggil di <b>level teratas</b> komponen atau Custom Hook — jangan di dalam if, loop, atau function bersarang. Urutan pemanggilan Hook harus sama di setiap render. Ikuti aturan ini dan React akan bekerja sesuai harapan.'
    },
    {
      type: 'warn',
      title: 'Hati-hati efek tanpa dependensi',
      text: 'Efek tanpa array dependensi berjalan <b>setiap render</b>. Bila di dalamnya kamu memanggil <code>setState</code>, akan terjadi render → efek → setState → render → ... alias <b>loop tak berujung</b>. Selalu pikirkan dependensi dengan cermat.'
    },
    {
      type: 'vocab',
      items: [
        ['Side effect', 'Kegiatan di luar render: fetch data, timer, mengubah DOM luar, dll.'],
        ['useEffect', 'Hook untuk menjalankan & membersihkan side effect.'],
        ['Dependency array', 'Daftar nilai yang menentukan kapan efek dijalankan ulang.'],
        ['Cleanup', 'Function yang dikembalikan efek untuk membersihkan jejak.'],
        ['Mount / Unmount', 'Saat komponen muncul di layar / dilepas dari layar.'],
        ['StrictMode', 'Pembungkus yang menjalankan efek dua kali saat pengembangan.'],
        ['Race condition', 'Bug saat respons lama datang setelah respons baru; dicegah dengan pembatalan.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: efek berjalan seiring waktu',
      lang: 'html',
      hint: 'Jam ini bergerak tiap detik. Di React, efek inilah yang dipasang di dalam useEffect dan dibersihkan dengan clearInterval.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Timer</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; text-align: center; }
    .jam { font-size: 42px; font-weight: bold; color: #0ea5e9; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <p>Timer berjalan (efek samping):</p>
  <div class="jam" id="jam">0</div>
  <script>
    let detik = 0;
    const el = document.getElementById("jam");
    const id = setInterval(function () {
      detik++; el.textContent = detik + " s";
    }, 1000);
    // Di React, "clearInterval(id)" dipanggil di dalam cleanup useEffect.
    window.addEventListener("beforeunload", function () { clearInterval(id); });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Side effect adalah kegiatan di luar render, mis. fetch data atau timer.',
    'useEffect(fn) berjalan tiap render; useEffect(fn, []) sekali; useEffect(fn, [x]) saat x berubah.',
    'Efek boleh mengembalikan function cleanup untuk membersihkan timer/listener.',
    'Data fetch biasanya memakai state memuat, data, dan error sekaligus.',
    'Hook hanya dipanggil di level teratas komponen/Custom Hook.',
    'setState di dalam efek tanpa dependensi bisa memicu loop tak berujung.'
  ]
});

/* ---------- Pelajaran 9: useRef ---------- */
window.REACT_LESSONS.push({
  id: 'useref',
  title: 'useRef — Referensi & Nilai Tetap',
  chapter: 'React Hooks',
  duration: '12 menit',
  intro: [
    'Ada kalanya kita perlu <b>menyentuh elemen DOM secara langsung</b> (mis. memfokuskan input) atau menyimpan nilai yang <b>tidak perlu memicu render ulang</b> (mis. id timer, jumlah render). Untuk dua kebutuhan itu React menyediakan Hook <code>useRef</code>.',
    'Pelajaran ini menjelaskan apa itu ref, kapan memakainya, dan bedanya dengan state.'
  ],
  objectives: [
    'Mengakses elemen DOM dengan useRef',
    'Menyimpan nilai yang tidak memicu render ulang',
    'Menyimpan id timer untuk dibersihkan',
    'Membedakan ref dengan state'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><code>useRef</code> mengembalikan sebuah <b>objek dengan satu properti <code>current</code></b>. Objek ini bertahan sepanjang umur komponen, dan kita bisa membacanya/menulisnya kapan saja. Dua kegunaan utamanya:</p><ul><li><b>Merujuk elemen DOM</b> — dengan memasang ref ke atribut <code>ref</code> sebuah elemen.</li><li><b>Menyimpan nilai "kotak"</b> — nilai apa pun yang perubahannya <b>tidak</b> perlu membuat tampilan dirender ulang.</li></ul>'
    },
    {
      type: 'example',
      title: 'Memfokuskan input dengan ref',
      lang: 'jsx',
      output: false,
      code: `import { useRef } from 'react';

function FormFokus() {
  const inputRef = useRef(null);

  function fokuskan() {
    // inputRef.current adalah elemen <input> di DOM
    inputRef.current.focus();
  }

  return (
    <div>
      <input ref={inputRef} placeholder="Nama" />
      <button onClick={fokuskan}>Fokuskan input</button>
    </div>
  );
}`,
      explain: [
        '<code>useRef(null)</code> membuat ref dengan nilai awal <code>null</code>.',
        'Pasang ke elemen dengan <code>ref={inputRef}</code>; setelah render, <code>inputRef.current</code> berisi elemen itu.',
        'Memanggil <code>.focus()</code> pada elemen nyata adalah hal yang tidak bisa dilakukan tanpa DOM; ref-lah jembatannya.'
      ]
    },
    {
      type: 'example',
      title: 'Menyimpan nilai tanpa render ulang',
      lang: 'jsx',
      output: false,
      code: `import { useRef, useState, useEffect } from 'react';

function Stopwatch() {
  const [detik, setDetik] = useState(0);
  const [jalan, setJalan] = useState(false);
  const timerRef = useRef(null);   // menyimpan id timer

  useEffect(() => {
    if (jalan) {
      timerRef.current = setInterval(() => setDetik((d) => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [jalan]);

  return (
    <div>
      <p>{detik} detik</p>
      <button onClick={() => setJalan((j) => !j)}>
        {jalan ? 'Jeda' : 'Mulai'}
      </button>
    </div>
  );
}`,
      explain: [
        '<code>timerRef.current</code> menyimpan id interval agar bisa dibersihkan nanti.',
        'Mengubah <code>timerRef.current</code> <b>tidak</b> memicu render ulang — dan memang tidak perlu.',
        'Kita memisahkan "nilai yang tampil" (state) dari "buku catatan internal" (ref).'
      ]
    },
    {
      type: 'example',
      title: 'Menghitung jumlah render & menyimpan nilai sebelumnya',
      lang: 'jsx',
      output: false,
      code: `import { useRef, useState, useEffect } from 'react';

function Contoh() {
  const [nilai, setNilai] = useState(0);
  const renderRef = useRef(0);
  const nilaiSebelumnya = useRef(null);

  useEffect(() => {
    renderRef.current += 1;   // bertambah tanpa memicu render
  });

  useEffect(() => {
    nilaiSebelumnya.current = nilai;   // simpan untuk render berikutnya
  }, [nilai]);

  return (
    <div>
      <p>Nilai sekarang: {nilai}</p>
      <p>Nilai sebelumnya: {nilaiSebelumnya.current}</p>
      <p>Komponen sudah dirender {renderRef.current} kali</p>
      <button onClick={() => setNilai(nilai + 1)}>Tambah</button>
    </div>
  );
}`,
      explain: [
        '<code>renderRef.current += 1</code> menghitung berapa kali komponen dirender, tanpa memicu render tambahan.',
        '<code>nilaiSebelumnya.current</code> menyimpan nilai dari render lalu.',
        'Pola "nilai sebelumnya" sulit dilakukan dengan state karena setState justru memicu render.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan pakai ref, kapan pakai state?',
      text: 'Bila perubahan nilai <b>harus terlihat di layar</b> → pakai <b>state</b>. Bila nilai itu hanya dipakai "di belakang layar" (id timer, referensi DOM, penghitung internal) → pakai <b>ref</b>. Salah pilih: memakai state untuk hal yang tak tampil akan menyebabkan render mubazir, memakai ref untuk hal yang tampil akan membuat tampilan tidak ikut berubah.'
    },
    {
      type: 'warn',
      title: 'Mengubah ref tidak me-render ulang',
      text: 'Ini jebakan umum: menaruh data penting di <code>ref.current</code> lalu bingung mengapa tampilan tidak berubah. Ingat, ref hanyalah "kotak" biasa. Bila tampilan perlu ikut berubah, gunakan state. Selain itu, <b>jangan membaca/mengubah</b> ref DOM saat render — lakukan di event handler atau efek.'
    },
    {
      type: 'vocab',
      items: [
        ['useRef', 'Hook yang mengembalikan objek { current } yang bertahan antar-render.'],
        ['ref', 'Atribut pada elemen untuk menautkannya dengan sebuah ref object.'],
        ['current', 'Properti ref yang berisi nilai/elemen terkini.'],
        ['Imperative', 'Gaya mengakses sesuatu secara langsung, mis. memanggil elemen.focus().'],
        ['Mutable value', 'Nilai yang bisa diubah tanpa menyebabkan render ulang.'],
        ['Forwarding ref', 'Meneruskan ref dari komponen induk ke elemen di dalam komponen anak.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: memfokuskan input',
      lang: 'html',
      hint: 'Klik tombolnya — kursor berpindah ke input. Di React, inilah peran useRef: menyentuh elemen DOM secara langsung.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>useRef</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; }
    input { padding: 10px 12px; font-size: 15px; border: 2px solid #cbd5e1; border-radius: 8px; }
    input:focus { border-color: #0ea5e9; outline: none; }
    button { margin-left: 8px; padding: 10px 16px; border: 0; border-radius: 8px; background: #0ea5e9; color: #fff; font-size: 15px; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Tes Fokus</h2>
  <input id="nama" placeholder="Nama kamu" />
  <button id="fokus">Fokuskan</button>
  <script>
    // Di React: const inputRef = useRef(null); lalu inputRef.current.focus()
    document.getElementById("fokus").addEventListener("click", function () {
      document.getElementById("nama").focus();
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'useRef mengembalikan objek { current } yang bertahan antar-render.',
    'Pasang ref ke elemen dengan ref={inputRef} untuk mengakses DOM-nya.',
    'Perubahan ref.current tidak memicu render ulang.',
    'Ref cocok untuk menyimpan id timer atau nilai internal.',
    'Untuk nilai yang harus tampil di layar, gunakan state, bukan ref.',
    'Jangan membaca/mengubah ref DOM selama proses render.'
  ]
});

/* ---------- Pelajaran 10: useMemo & useCallback ---------- */
window.REACT_LESSONS.push({
  id: 'usememo-usecallback',
  title: 'useMemo & useCallback — Optimasi',
  chapter: 'React Hooks',
  duration: '14 menit',
  intro: [
    'Setiap kali state berubah, React menjalankan ulang seluruh function komponen — termasuk perhitungan di dalamnya. Bila ada perhitungan berat atau pembuatan function baru yang tidak diperlukan, kita bisa "mengingat" (memoize) hasilnya dengan <code>useMemo</code> dan <code>useCallback</code>.',
    'Pelajaran ini menjelaskan keduanya, kapan dipakai, dan mengapa jangan berlebihan.'
  ],
  objectives: [
    'Memahami konsep memoization',
    'Menggunakan useMemo untuk mengingat hasil perhitungan berat',
    'Menggunakan useCallback untuk menjaga identitas function tetap stabil',
    'Mengenal React.memo dan kapan optimasi ini diperlukan'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Memoization</b> berarti "menyimpan hasil" agar tidak dihitung ulang bila input-nya masih sama. <code>useMemo</code> mengingat <b>nilai/hasil</b>, sedangkan <code>useCallback</code> mengingat <b>function</b>. Keduanya menerima <b>array dependensi</b> sebagai penentu kapan harus menghitung ulang.</p>'
    },
    {
      type: 'example',
      title: 'useMemo: mengingat hasil perhitungan',
      lang: 'jsx',
      output: false,
      code: `import { useMemo, useState } from 'react';

function DaftarAngka() {
  const [angka, setAngka] = useState(30);
  const [tema, setTema] = useState('terang');

  // Perhitungan berat: dihitung ulang HANYA bila "angka" berubah.
  // Berganti tema tidak akan menghitung ulang deret ini.
  const deret = useMemo(() => {
    console.log('Menghitung deret...');
    const hasil = [];
    for (let i = 1; i <= angka; i++) hasil.push(i * i);
    return hasil;
  }, [angka]);

  return (
    <div>
      <button onClick={() => setAngka(a => a + 1)}>Angka: {angka}</button>
      <button onClick={() => setTema(t => t === 'terang' ? 'gelap' : 'terang')}>
        Tema: {tema}
      </button>
      <p>Jumlah deret: {deret.length}</p>
    </div>
  );
}`,
      explain: [
        '<code>useMemo(() =&gt; hitung(), [deps])</code> menjalankan perhitungan hanya saat dependensinya berubah.',
        'Bila <code>tema</code> berganti tetapi <code>angka</code> tetap, deret tidak dihitung ulang.',
        'Simpan hasil ke variabel — bukan efek samping seperti mengubah DOM.'
      ]
    },
    {
      type: 'example',
      title: 'useCallback: menjaga function tetap stabil',
      lang: 'jsx',
      output: false,
      code: `import { useCallback, useState } from 'react';

function Induk() {
  const [hitung, setHitung] = useState(0);

  // Tanpa useCallback, setiap render membuat function BARU.
  // Dengan useCallback, function sama dipakai selama deps tak berubah.
  const tambah = useCallback(() => {
    setHitung((h) => h + 1);
  }, []);

  return <Anak saatKlik={tambah} />;
}

// React.memo membungkus komponen agar hanya render ulang
// bila props-nya benar-benar berubah.
const Anak = React.memo(function Anak({ saatKlik }) {
  console.log('Anak dirender');
  return <button onClick={saatKlik}>Tambah</button>;
});`,
      explain: [
        '<code>useCallback(fn, [deps])</code> mengembalikan function yang sama selama dependensi tidak berubah.',
        'Ini penting bila function dikirim ke komponen anak yang dibungkus <code>React.memo</code>.',
        'Tanpa useCallback, anak akan dianggap menerima props baru setiap render induk, sehingga render ulang tidak bisa dihindari.'
      ]
    },
    {
      type: 'example',
      title: 'Menyaring daftar dengan useMemo',
      lang: 'jsx',
      output: false,
      code: `import { useMemo, useState } from 'react';

function PencarianProduk({ produk }) {
  const [kata, setKata] = useState('');

  const hasil = useMemo(() => {
    const k = kata.toLowerCase();
    return produk.filter((p) => p.nama.toLowerCase().includes(k));
  }, [produk, kata]);

  return (
    <div>
      <input value={kata} onChange={(e) => setKata(e.target.value)} />
      <ul>
        {hasil.map((p) => <li key={p.id}>{p.nama}</li>)}
      </ul>
    </div>
  );
}`,
      explain: [
        'Penyaringan daftar bisa jadi berat bila datanya banyak.',
        '<code>useMemo</code> memastikan penyaringan hanya diulang saat <code>produk</code> atau <code>kata</code> berubah.',
        'Semua nilai dari luar yang dipakai di dalam wajib masuk daftar dependensi.'
      ]
    },
    {
      type: 'tip',
      title: 'Ukur dulu, baru optimalkan',
      text: 'useMemo dan useCallback punya biaya sendiri dan membuat kode lebih rumit. Sebagian besar aplikasi <b>tidak memerlukannya</b> sampai terasa lambat. Optimalkan hanya pada perhitungan yang benar-benar berat atau komponen yang jelas sering render ulang. Prinsipnya: <i>ukur, jangan menebak</i>.'
    },
    {
      type: 'warn',
      title: 'Daftar dependensi harus lengkap & benar',
      text: 'Lupa mencantumkan dependensi membuat <code>useMemo</code>/<code>useCallback</code> memakai nilai lama (<i>stale</i>), sehingga bug sulit dilacak. Terlalu banyak dependensi yang berubah setiap render membuat memoization sia-sia. Bantu dengan <b>ESLint</b> plugin React Hooks yang memperingatkan dependensi yang kurang.'
    },
    {
      type: 'vocab',
      items: [
        ['Memoization', 'Menyimpan hasil agar tidak dihitung ulang bila input masih sama.'],
        ['useMemo', 'Hook untuk mengingat hasil (nilai) sebuah perhitungan.'],
        ['useCallback', 'Hook untuk mengingat sebuah function agar identitasnya stabil.'],
        ['React.memo', 'Pembungkus komponen agar hanya render ulang bila props berubah.'],
        ['Referential equality', 'Dua nilai dianggap "sama" bila menunjuk objek/function yang sama.'],
        ['Stale value', 'Nilai lama yang ikut terjebak karena dependensi tidak lengkap.'],
        ['Re-render', 'React menjalankan ulang function komponen.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: rasakan manfaat "mengingat hasil"',
      lang: 'html',
      hint: 'Buka konsol browser (kalau bisa) atau lihat penghitung di layar. Tanpa cache, Deret(unik) dihitung berkali-kali; dengan cache, hasil lama dipakai ulang.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Memoization</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }
    button { padding: 8px 14px; border: 0; border-radius: 8px; background: #7c3aed; color: #fff; cursor: pointer; margin-right: 6px; }
    .kotak { margin-top: 14px; padding: 12px; background: #f5f3ff; border-radius: 10px; }
  </style>
</head>
<body>
  <h2>Kalkulator "Berat"</h2>
  <button id="hitung">Hitung Deret(30)</button>
  <button id="lain">Ubah Tema</button>
  <div class="kotak" id="hasil">
    Hitungan dijalankan: <b id="n">0</b> kali<br>
    Jumlah deret: <b id="jml">-</b><br>
    Tema: <b id="tema">terang</b>
  </div>
  <script>
    // Simulasi useMemo: cache menyimpan hasil berdasarkan kunci (angka).
    const cache = {};
    let hitungan = 0;
    function deret(angka) {
      if (cache[angka]) return cache[angka];   // pakai hasil lama
      hitungan++;
      document.getElementById("n").textContent = hitungan;
      const r = []; for (let i = 1; i <= angka; i++) r.push(i * i);
      cache[angka] = r;
      return r;
    }
    document.getElementById("hitung").addEventListener("click", function () {
      const r = deret(30);
      document.getElementById("jml").textContent = r.length;
    });
    document.getElementById("lain").addEventListener("click", function () {
      const t = document.getElementById("tema");
      t.textContent = t.textContent === "terang" ? "gelap" : "terang";
    });
    deret(30); // hitung awal
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Memoization menyimpan hasil agar tidak dihitung ulang bila input sama.',
    'useMemo mengingat hasil perhitungan; useCallback mengingat function.',
    'Keduanya menerima array dependensi sebagai penentu kapan menghitung ulang.',
    'useCallback berguna bersama React.memo untuk mencegah render ulang anak.',
    'Jangan optimalkan sebelum mengukur — kebanyakan aplikasi tak memerlukannya.',
    'Daftar dependensi yang tidak lengkap menimbulkan nilai stale (usang).'
  ]
});
