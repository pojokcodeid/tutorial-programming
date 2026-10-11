/* ============================================================
   Pelajaran React — Bab 3: State, Event, Conditional & List
   (topik info.md:
    - "Basic State & Event Handling: useState, onClick, onChange"
    - "Conditional Rendering & Lists: ternary, &&, .map() & key")
   ============================================================ */
'use strict';

window.REACT_LESSONS = window.REACT_LESSONS || [];

/* ---------- Pelajaran 6: Basic State & Event Handling ---------- */
window.REACT_LESSONS.push({
  id: 'state-dan-event',
  title: 'State Dasar & Event Handling',
  chapter: 'Kontrol Komponen',
  duration: '14 menit',
  intro: [
    'Yang membuat aplikasi React terasa hidup adalah <b>state</b>: data yang bisa berubah dan, ketika berubah, React otomatis menggambar ulang tampilan. Untuk mengubah state, kita merespons <b>event</b> pengguna seperti klik atau ketikan.',
    'Pelajaran ini memperkenalkan Hook <code>useState</code> dan cara menangani event seperti <code>onClick</code> dan <code>onChange</code>.'
  ],
  objectives: [
    'Memahami apa itu state dan bedanya dengan props',
    'Menggunakan Hook useState',
    'Memperbarui state dengan aman (termasuk functional update)',
    'Menangani event onClick, onChange, dan mengirim argumen'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>State</b> adalah memori milik komponen. Ia menyimpan data yang berubah seiring interaksi: angka penghitung, teks input, daftar todo, dan sebagainya. Perbedaan penting dengan props: <b>props</b> dikirim dari luar dan hanya-baca, sedangkan <b>state</b> dimiliki dan diubah oleh komponen itu sendiri.</p><p>Setiap kali state berubah, React <b>me-render ulang</b> komponen tersebut dan memperbarui DOM seperlunya.</p>'
    },
    {
      type: 'example',
      title: 'useState: penghitung pertama',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

function Penghitung() {
  // useState mengembalikan PASANGAN: [nilai saat ini, function pengubah]
  const [hitung, setHitung] = useState(0);

  return (
    <div>
      <p>Kamu mengklik {hitung} kali.</p>
      <button onClick={() => setHitung(hitung + 1)}>Tambah</button>
    </div>
  );
}`,
      explain: [
        '<code>useState(0)</code> membuat state dengan nilai awal <code>0</code>.',
        'Ia mengembalikan array dua elemen: <code>hitung</code> (nilai) dan <code>setHitung</code> (pengubah).',
        'Saat <code>setHitung</code> dipanggil, React me-render ulang komponen dengan nilai baru.'
      ]
    },
    {
      type: 'text',
      html: '<p>Menangani <b>event</b> mirip HTML, tetapi dengan beberapa perbedaan: nama event memakai <b>camelCase</b> (<code>onClick</code>, bukan <code>onclick</code>) dan nilainya adalah <b>function</b>, bukan teks. Function ini bisa didefinisikan sebelum <code>return</code> atau langsung sebagai arrow function.</p>'
    },
    {
      type: 'example',
      title: 'Menangani onClick & onChange',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

function FormSederhana() {
  const [nama, setNama] = useState('');
  const [pesan, setPesan] = useState('Belum disapa.');

  function sapa() {
    setPesan('Halo, ' + nama + '!');
  }

  return (
    <div>
      {/* onChange jalan setiap kali isi input berubah */}
      <input
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        placeholder="Tulis namamu"
      />

      {/* onClick jalan saat tombol diklik */}
      <button onClick={sapa}>Sapa</button>

      <p>{pesan}</p>
    </div>
  );
}`,
      explain: [
        '<code>onChange={(e) =&gt; setNama(e.target.value)}</code> menyimpan isi input ke state setiap kali pengguna mengetik.',
        '<code>e</code> adalah <b>event object</b>; <code>e.target.value</code> berisi teks yang diketik.',
        'Kita menulis <code>onClick={sapa}</code> (tanpa tanda kurung) — artinya "jalankan sapa saat diklik", bukan "jalankan sekarang".'
      ]
    },
    {
      type: 'example',
      title: 'Menambah, mengurangi, dan mereset',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

function Penghitung() {
  const [nilai, setNilai] = useState(0);

  return (
    <div>
      <h2>Nilai: {nilai}</h2>
      <button onClick={() => setNilai(nilai - 1)}>−1</button>
      <button onClick={() => setNilai(nilai + 1)}>+1</button>
      <button onClick={() => setNilai(0)}>Reset</button>
    </div>
  );
}`,
      explain: [
        'Setiap tombol memanggil <code>setNilai</code> dengan nilai baru.',
        'React akan menggambar ulang dan menampilkan angka terbaru.',
        'Menyimpan beberapa logika berbeda bukan masalah — semuanya memakai satu state.'
      ]
    },
    {
      type: 'text',
      html: '<p>Ketika nilai baru <b>bergantung pada nilai sebelumnya</b>, sebaiknya gunakan <b>functional update</b>: berikan sebuah function ke pengubah state, mis. <code>setNilai(n =&gt; n + 1)</code>. Cara ini selalu memakai nilai state paling baru — penting saat beberapa pembaruan terjadi beruntun.</p>'
    },
    {
      type: 'example',
      title: 'Functional update & object di dalam state',
      lang: 'jsx',
      output: false,
      code: `import { useState } from 'react';

function Contoh() {
  const [angka, setAngka] = useState(0);
  const [user, setUser] = useState({ nama: 'Andi', poin: 0 });

  // Functional update: aman walau dipanggil beberapa kali beruntun.
  const tambahDua = () => {
    setAngka(n => n + 1);
    setAngka(n => n + 1);   // hasil akhir: +2
  };

  // Object state: buat SALINAN, jangan ubah objek lama.
  const tambahPoin = () => {
    setUser({ ...user, poin: user.poin + 1 });
  };

  return (
    <div>
      <p>Angka: {angka}</p>
      <button onClick={tambahDua}>Tambah 2</button>

      <p>{user.nama} — poin {user.poin}</p>
      <button onClick={tambahPoin}>Tambah poin</button>
    </div>
  );
}`,
      explain: [
        '<code>setAngka(n =&gt; n + 1)</code> memakai nilai terbaru, sehingga dua pemanggilan beruntun menghasilkan +2.',
        'Untuk state berbentuk objek, buat salinan dengan spread <code>{ ...user, poin: user.poin + 1 }</code>.',
        'Jangan mengubah state lama secara langsung (<code>user.poin++</code>) — React tidak akan mendeteksi perubahannya.'
      ]
    },
    {
      type: 'tip',
      title: 'Dua aturan state di React',
      text: 'Pertama: <b>jangan mengubah state langsung</b> — selalu pakai function pengubah. Kedua: <b>setState bersifat asynchronous</b>; nilainya tidak langsung berubah pada baris berikutnya. Bila butuh nilai baru, hitung dulu ke variabel lalu pakai variabel itu.'
    },
    {
      type: 'warn',
      title: 'Kenapa mengubah state langsung itu salah?',
      text: 'Bila kamu menulis <code>hitung = hitung + 1</code> lalu menampilkan state, React tidak tahu ada perubahan dan <b>tidak me-render ulang</b>. Juga jangan memodifikasi array/objek state tanpa menyalin: <code>daftar.push(x)</code> memutasi array lama. Gunakan <code>setDaftar([...daftar, x])</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['State', 'Data milik komponen yang bisa berubah dan memicu render ulang.'],
        ['useState', 'Hook untuk membuat state pada functional component.'],
        ['Setter', 'Function pengubah state, mis. setHitung dari useState.'],
        ['Event handler', 'Function yang dijalankan saat event terjadi, mis. onClick.'],
        ['Functional update', 'setState(n => n + 1) — memperbarui berdasarkan nilai terbaru.'],
        ['Immutable update', 'Memperbarui dengan menyalin (spread), bukan mengubah data lama.'],
        ['Re-render', 'Proses React menjalankan ulang komponen dan memperbarui tampilan.'],
        ['Event object', 'Parameter e yang memuat informasi event, mis. e.target.value.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: penghitung dengan event',
      lang: 'html',
      hint: 'Ini "penghitung" versi JavaScript biasa. Ingat, di React kamu tidak menyentuh DOM — cukup setState lalu React memperbarui angka.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Penghitung</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 30px; text-align: center; }
    .n { font-size: 48px; font-weight: bold; color: #4338ca; margin: 10px; }
    button { font-size: 16px; padding: 8px 14px; margin: 0 4px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: pointer; }
    button:hover { background: #eef2ff; }
  </style>
</head>
<body>
  <div>
    <p>Nilai saat ini</p>
    <div class="n" id="nilai">0</div>
    <button data-d="-1">−1</button>
    <button data-d="1">+1</button>
    <button data-r="1">Reset</button>
  </div>
  <script>
    let nilai = 0;
    function gambar() { document.getElementById("nilai").textContent = nilai; }
    document.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.r) { nilai = 0; }
        else { nilai += Number(b.dataset.d); }
        gambar();
      });
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'State adalah data milik komponen yang memicu render ulang saat berubah.',
    'useState mengembalikan pasangan [nilai, setter].',
    'Event di React memakai camelCase (onClick) dan menerima function.',
    'onChange pada input menyimpan nilai dengan e.target.value.',
    'Gunakan functional update (setNilai(n => n + 1)) bila bergantung pada nilai sebelumnya.',
    'Jangan mengubah state langsung; salin dulu array/objek dengan spread.'
  ]
});

/* ---------- Pelajaran 7: Conditional Rendering & Lists ---------- */
window.REACT_LESSONS.push({
  id: 'conditional-rendering-lists',
  title: 'Conditional Rendering & Lists',
  chapter: 'Kontrol Komponen',
  duration: '12 menit',
  intro: [
    'Tampilan jarang statis: kadang sebuah elemen hanya muncul dengan syarat tertentu, dan sering kita perlu menampilkan sekumpulan data dari array. React menangani keduanya dengan sangat alami karena JSX hanyalah JavaScript.',
    'Pelajaran ini membahas menampilkan elemen secara <b>bersyarat</b> (ternary &amp; <code>&amp;&amp;</code>) dan <b>merender daftar</b> dengan method <code>.map()</code> beserta pentingnya <code>key</code>.'
  ],
  objectives: [
    'Merender elemen secara kondisional dengan ternary',
    'Memakai logical && untuk menampilkan/menyembunyikan elemen',
    'Merender array menjadi daftar dengan .map()',
    'Memahami pentingnya key yang unik & stabil'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Karena isi <code>{ }</code> adalah ekspresi JavaScript, kita bisa menaruh <b>operator ternary</b> di sana. Pola ini dipakai untuk memilih satu dari dua tampilan.</p>'
    },
    {
      type: 'example',
      title: 'Ternary: pilih salah satu',
      lang: 'jsx',
      output: false,
      code: `function Status({ masuk }) {
  return (
    <div>
      {/* Jika masuk true -> "Selamat datang", jika false -> "Silakan masuk" */}
      <p>{masuk ? 'Selamat datang! 👋' : 'Silakan masuk dulu.'}</p>

      {/* Ternary juga bisa memilih komponen, bukan hanya teks */}
      {masuk ? <TombolKeluar /> : <TombolMasuk />}
    </div>
  );
}`,
      explain: [
        'Ternary berbentuk <code>kondisi ? nilaiBenar : nilaiSalah</code>.',
        'Hasilnya bisa berupa teks, angka, atau bahkan komponen JSX.',
        'Ternary bersarang sebaiknya dihindari karena sulit dibaca — pecah ke variabel.'
      ]
    },
    {
      type: 'text',
      html: '<p>Bila elemen hanya perlu <b>muncul atau tidak muncul</b> (tanpa pilihan lain), operator <b>logical AND</b> <code>&amp;&amp;</code> lebih ringkas: <code>{kondisi &amp;&amp; &lt;Elemen /&gt;}</code>. Bila <code>kondisi</code> bernilai salah, React tidak menampilkan apa pun.</p>'
    },
    {
      type: 'example',
      title: 'Logical && dan variabel kondisi',
      lang: 'jsx',
      output: false,
      code: `function KotakPesan({ adaPesan, jumlah }) {
  // Cara rapi: hitung dulu ke variabel bila kondisinya rumit.
  const pesan = jumlah > 0 ? \`Ada \${jumlah} pesan baru\` : 'Tidak ada pesan';

  return (
    <div>
      <h2>Kotak Masuk</h2>

      {/* && : tampil hanya bila adaPesan bernilai true */}
      {adaPesan && <p className="merah">Perhatian: ada pesan belum dibaca!</p>}

      <p>{pesan}</p>
    </div>
  );
}

// Hindari menaruh angka di kiri && bila bisa bernilai 0,
// karena 0 akan ikut tampil. Pakai pembanding eksplisit:
// {jumlah > 0 && <p>{jumlah} pesan</p>}`,
      explain: [
        '<code>adaPesan &amp;&amp; &lt;p&gt;...&lt;/p&gt;</code> menampilkan paragraf hanya bila <code>adaPesan</code> bernilai benar.',
        'Bila kondisi bernilai <code>false</code>, <code>null</code>, atau <code>undefined</code>, React tidak merender apa pun.',
        'Hati-hati angka <code>0</code>: gunakan <code>jumlah &gt; 0</code> agar angka 0 tidak ikut tampil.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk menampilkan data dari array, kita ubah tiap item menjadi elemen JSX dengan method <code>.map()</code>. Method ini mengembalikan array elemen yang siap dipasang di dalam JSX.</p>'
    },
    {
      type: 'example',
      title: 'Merender daftar dengan .map()',
      lang: 'jsx',
      output: false,
      code: `function DaftarBuah() {
  const buah = ['Apel', 'Jeruk', 'Mangga'];

  return (
    <ul>
      {buah.map((nama, index) => (
        <li key={index}>{nama}</li>
      ))}
    </ul>
  );
}

// Sering lebih praktis dengan array berisi objek:
function DaftarProduk({ produk }) {
  return (
    <div>
      {produk.map((item) => (
        <div className="kartu" key={item.id}>
          <h3>{item.nama}</h3>
          <p>Rp {item.harga.toLocaleString('id-ID')}</p>
        </div>
      ))}
    </div>
  );
}`,
      explain: [
        '<code>.map()</code> mengubah setiap item array menjadi sebuah elemen JSX.',
        'Setiap elemen dalam daftar <b>wajib punya props <code>key</code></b> yang unik.',
        'Bila data punya id unik, pakai id (<code>key={item.id}</code>) — lebih baik daripada index.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Key</b> membantu React mengenali item mana yang berubah, ditambah, atau dihapus tanpa menggambar ulang seluruh daftar. Tanpa key, React akan menampilkan peringatan di konsol dan pembaruan daftar bisa salah.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan memakai index sebagai key bila daftar bisa berubah',
      text: 'Memakai <code>key={index}</code> aman untuk daftar statis yang tidak pernah diurutkan ulang atau dihapus. Tetapi bila item bisa ditambah/dihapus/diurutkan, key berbasis index bisa membuat state salah tersambung ke item yang keliru. Selalu utamakan <b>id unik yang stabil</b>.'
    },
    {
      type: 'example',
      title: 'Contoh lengkap: mencari & menyaring sekaligus',
      lang: 'jsx',
      output: false,
      code: `function DaftarBelanja({ barang }) {
  // Saring hanya yang belum dibeli, lalu urutkan berdasarkan nama.
  const belumDibeli = barang
    .filter((b) => !b.sudahDibeli)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  if (belumDibeli.length === 0) {
    return <p>🎉 Semua sudah dibeli!</p>;   // early return
  }

  return (
    <ul>
      {belumDibeli.map((b) => (
        <li key={b.id}>{b.nama}</li>
      ))}
    </ul>
  );
}`,
      explain: [
        'Logika data (filter, sort) ditulis di JavaScript biasa sebelum <code>return</code>.',
        '<b>Early return</b> mengembalikan tampilan alternatif lebih awal bila daftar kosong.',
        'Ini contoh "conditional rendering": satu kondisi, dua kemungkinan tampilan.'
      ]
    },
    {
      type: 'tip',
      title: 'Key ada di elemen PALING LUAR dari map',
      text: '<code>key</code> harus dipasang pada elemen yang dikembalikan langsung oleh <code>.map()</code>, bukan pada anak di dalamnya. Key hanya dipakai React untuk pelacakan internal — ia tidak muncul sebagai atribut di DOM.'
    },
    {
      type: 'vocab',
      items: [
        ['Conditional rendering', 'Menampilkan elemen berdasarkan kondisi tertentu.'],
        ['Ternary', 'Operator kondisi ? nilaiBenar : nilaiSalah.'],
        ['Logical &&', 'Cara ringkas menampilkan elemen hanya bila kondisi benar.'],
        ['Early return', 'Mengembalikan tampilan lebih awal sebelum bagian lain dijalankan.'],
        ['.map()', 'Method array yang dipakai mengubah data menjadi elemen JSX.'],
        ['key', 'Penanda unik tiap item daftar agar React melacak perubahan dengan tepat.'],
        ['Render list', 'Proses menampilkan array data sebagai daftar elemen.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: daftar dari data',
      lang: 'html',
      hint: 'Di React, daftar ini dibuat dari array dengan .map() dan setiap item diberi key. Coba tambah/hapus item di HTML ini untuk membayangkan hasilnya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Daftar</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }
    ul { list-style: none; padding: 0; max-width: 320px; }
    li { padding: 10px 14px; margin-bottom: 8px; background: #eef2ff; border-radius: 10px; display: flex; justify-content: space-between; }
    .harga { color: #4338ca; font-weight: bold; }
  </style>
</head>
<body>
  <h2>Daftar Produk</h2>
  <ul id="daftar"></ul>
  <script>
    const produk = [
      { id: 1, nama: "Kopi", harga: 20000 },
      { id: 2, nama: "Teh", harga: 15000 },
      { id: 3, nama: "Susu", harga: 25000 }
    ];
    // Ini "map" versi DOM. Di React: produk.map(p => <li key={p.id}>...</li>)
    const ul = document.getElementById("daftar");
    produk.forEach(function (p) {
      const li = document.createElement("li");
      li.innerHTML = "<span>" + p.nama + "</span>" +
        '<span class="harga">Rp ' + p.harga.toLocaleString("id-ID") + "</span>";
      ul.appendChild(li);
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Karena JSX adalah JavaScript, kondisi ditulis dengan ternary atau logical &&.',
    'Ternary memilih satu dari dua tampilan; && hanya menampilkan bila kondisi benar.',
    'Hati-hati angka 0 pada && — gunakan pembanding eksplisit.',
    'Array data diubah menjadi daftar elemen dengan .map().',
    'Setiap item daftar wajib punya key unik & stabil.',
    'Hindari key berbasis index untuk daftar yang bisa berubah urutannya.'
  ]
});
