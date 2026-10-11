/* ============================================================
   Pelajaran CSS — Bab: Selektor & Properti
   (topik info.md: "selektor css", "properti dasar",
    "unit ukuran", "text styling")
   ============================================================ */
'use strict';

window.CSS_LESSONS = window.CSS_LESSONS || [];

window.CSS_LESSONS.push({
  id: 'selektor-css',
  title: 'Selektor CSS',
  chapter: 'Selektor & Properti',
  duration: '8 menit',
  intro: [
    'Bayangkan kamu punya satu lusin kartu pos dan ingin mewarnai hanya kartu ulang tahun saja. <b>Selektor</b> adalah cara CSS menyebut kartu mana yang diatur: berdasarkan nama tag, kelas, id, atau hubungannya dengan elemen lain.',
    'Pelajaran ini membahas selektor yang paling sering dipakai sehari-hari. Kuasai ini, dan kamu bisa mengatur elemen mana pun di halaman tanpa menyentuh HTML-nya.'
  ],
  objectives: [
    'Membedakan selektor elemen, kelas, dan id',
    'Memakai selektor universal (*) dan pengelompokan (koma)',
    'Memahami kombinator turunan, anak (&gt;), dan saudara (+/~)',
    'Memakai selektor atribut sederhana'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Selektor berada di awal aturan CSS. Empat bentuk paling umum:</p><ul><li><b>Elemen</b> — <code>h1</code>, <code>p</code>: semua elemen dengan tag itu.</li><li><b>Kelas</b> — <code>.menu</code>: semua elemen dengan class="menu".</li><li><b>ID</b> — <code>#judul</code>: tepat satu elemen dengan id="judul".</li><li><b>Universal</b> — <code>*</code>: semua elemen tanpa terkecuali.</li></ul>'
    },
    {
      type: 'example',
      title: 'Selektor elemen, kelas, dan id',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Kopi</title>
  <style>
    h2 {
      color: #6F4E37;
    }
    .menu {
      background: #FFF3E0;
      border: 2px solid #6F4E37;
      padding: 10px;
      border-radius: 6px;
    }
    #spesial {
      color: #B23A48;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h2>Menu Kopi Kami</h2>
  <p class="menu">Espresso — Rp 12.000</p>
  <p class="menu" id="spesial">Latte Art — Rp 18.000 (spesial hari ini!)</p>
</body>
</html>`,
      explain: [
        'Aturan <code>h2</code> memakai <b>selektor elemen</b>: semua elemen <code>&lt;h2&gt;</code> di halaman ikut berubah.',
        '<code>.menu</code> adalah <b>selektor kelas</b> — ditulis dengan titik sebelum nama kelas, dan boleh dipakai banyak elemen.',
        '<code>#spesial</code> adalah <b>selektor id</b> — ditulis dengan pagar (#), dan sebaiknya hanya dipakai satu elemen per halaman.',
        'Satu elemen boleh punya kelas dan id sekaligus, seperti kartu yang diberi stiker merah dan label "spesial".'
      ]
    },
    {
      type: 'example',
      title: 'Universal (*) dan pengelompokan (koma)',
      lang: 'css',
      output: false,
      code: `/* Universal: semua elemen dapat margin bawaan nol */
* {
  margin: 0;
  box-sizing: border-box;
}

/* Pengelompokan: aturan yang sama untuk h1, h2, dan h3 */
h1, h2, h3 {
  font-family: Georgia, serif;
  color: #2C3E50;
}

/* Kelas digabung elemen: hanya <p class="catatan"> */
p.catatan {
  font-style: italic;
  background: #FFF9C4;
}`,
      explain: [
        '<code>*</code> memilih <b>semua</b> elemen — sering dipakai untuk me-reset margin bawaan browser.',
        'Pisahkan selektor yang dikelompokkan dengan <b>koma</b>; spasi setelah koma tidak wajib, tapi rapi.',
        '<code>p.catatan</code> berarti "elemen <code>&lt;p&gt;</code> yang punya kelas <code>catatan</code>" — lebih spesifik daripada <code>.catatan</code> saja.'
      ]
    },
    {
      type: 'example',
      title: 'Kombinator: turunan, anak, dan saudara',
      lang: 'css',
      output: true,
      code: `/* Turunan: semua <a> di mana pun di dalam .kartu */
.kartu a {
  color: #B23A48;
}

/* Anak langsung: hanya <strong> yang langsung di dalam <li> */
li > strong {
  color: #1B5E20;
}

/* Saudara bertetangga: <p> yang tepat setelah <h3> */
h3 + p {
  margin-top: 0;
  font-style: italic;
}

/* Semua saudara sesudahnya: <p> setelah .label */
.label ~ p {
  color: #555;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kombinator Selektor</title>
  <style>
    .kartu { border: 2px solid #6F4E37; border-radius: 8px; padding: 12px; max-width: 340px; }
    ul { padding-left: 18px; }
    __CODE__
  </style>
</head>
<body>
  <div class="kartu">
    <h3>Resep Kopi Susu</h3>
    <p>Paragraf langsung setelah judul (h3 + p).</p>
    <p class="label">Bahan:</p>
    <p>Kopi bubuk 2 sendok (sesudah .label).</p>
    <ul>
      <li><strong>Kopi</strong> — 2 sendok (anak langsung li &gt; strong)</li>
      <li>Gula secukupnya</li>
    </ul>
    <p>Lihat juga <a href="#">resep lainnya</a> di dalam kartu (.kartu a).</p>
  </div>
</body>
</html>`,
      explain: [
        '<b>Turunan</b> <code>.kartu a</code> (spasi): memilih <code>&lt;a&gt;</code> di level mana pun di dalam <code>.kartu</code>, termasuk yang bersarang dua level ke bawah.',
        '<b>Anak</b> <code>li &gt; strong</code>: hanya <code>&lt;strong&gt;</code> yang <b>langsung</b> berada di dalam <code>&lt;li&gt;</code>, bukan yang bersarang lebih dalam.',
        '<b>Saudara bertetangga</b> <code>h3 + p</code>: hanya <code>&lt;p&gt;</code> yang <b>tepat sesudah</b> <code>&lt;h3&gt;</code>.',
        '<b>Saudara sejalan</b> <code>.label ~ p</code>: semua <code>&lt;p&gt;</code> yang berada <b>setelah</b> <code>.label</code> di tingkat yang sama.'
      ]
    },
    {
      type: 'tip',
      title: 'Spesifikitas: id lebih kuat daripada kelas',
      text: 'Kalau dua aturan mengatur hal yang sama pada elemen yang sama, yang <b>lebih spesifik</b> menang: <code>#id</code> mengalahkan <code>.kelas</code>, dan <code>.kelas</code> mengalahkan selektor elemen. Jadi kalau aturanmu "tidak berhasil", cek apakah ada aturan lain yang lebih spesifik.'
    },
    {
      type: 'example',
      title: 'Selektor atribut',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Selektor Atribut</title>
  <style>
    p { padding: 6px 0; }

    /* Semua elemen yang punya atribut target */
    [target] {
      text-decoration: underline dotted;
    }

    /* Tautan yang href-nya diawali https */
    a[href^="https"] {
      color: #1B5E20;
      font-weight: bold;
    }

    /* Gambar berformat SVG */
    img[src$=".svg"] {
      border: 3px dashed #6F4E37;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <p>
    <a href="https://developer.mozilla.org" target="_blank">MDN (https)</a> ·
    <a href="http://contoh.test" target="_blank">Situs http</a>
  </p>
  <p>
    <img src="assets/sample.svg" alt="Ikon SVG" width="48">
    <img src="assets/logo.svg" alt="Logo SVG" width="48">
  </p>
</body>
</html>`,
      explain: [
        '<code>[target]</code> memilih <b>semua elemen yang punya atribut</b> <code>target</code>, isinya apa pun.',
        '<code>a[href^="https"]</code>: tanda <code>^=</code> berarti "diawali dengan" — hanya tautan aman https yang ditebalkan dan dihijaukan.',
        '<code>img[src$=".svg"]</code>: tanda <code>$=</code> berarti "diakhiri dengan" — berguna untuk menyasar format berkas tertentu.',
        'Ada juga <code>*=</code> (berisi teks), <code>~=</code> (kata dalam daftar), dan <code>|=</code> (awalan bahasa, misalnya <code>lang|="id"</code>).'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Selektor elemen', 'Nama tag, misalnya <code>p</code> — memilih semua elemen dengan tag itu.'],
        ['Selektor kelas', '<code>.nama</code> — memilih elemen dengan class="nama".'],
        ['Selektor id', '<code>#nama</code> — memilih satu elemen dengan id="nama".'],
        ['Kombinator', 'Simbol yang mengatur hubungan: spasi (turunan), <code>&gt;</code> (anak), <code>+</code> dan <code>~</code> (saudara).'],
        ['Spesifikitas', 'Tingkat kekuatan selektor; yang lebih spesifik menang saat terjadi bentrok.'],
        ['Selektor atribut', 'Menyeleksi elemen berdasarkan atributnya, misalnya <code>[href]</code> atau <code>[type="text"]</code>.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: atur kartu menu pakai selektor',
      lang: 'html',
      hint: 'Tambahkan aturan .panas { color: #B23A48; } lalu beri class="panas" pada satu menu. Lalu coba #favorit { background: #FFF3E0; } pada paragraf ber-id favorit. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Selektor</title>
  <style>
    body { font-family: Georgia, serif; }
    /* Tulis aturanmu di sini */
  </style>
</head>
<body>
  <h1>Kartu Menu</h1>
  <p class="menu">Americano — Rp 10.000</p>
  <p class="menu" id="favorit">Cappuccino — Rp 14.000 (favorit!)</p>
  <p class="menu">Mocha — Rp 16.000</p>
</body>
</html>`
    }
  ],
  recap: [
    'Selektor elemen menyangkut semua elemen dengan tag yang sama.',
    'Kelas (.nama) bisa dipakai berulang; id (#nama) sebaiknya unik per halaman.',
    '<code>*</code> memilih semua elemen; koma mengelompokkan beberapa selektor dalam satu aturan.',
    'Kombinator: spasi (turunan), <code>&gt;</code> (anak), <code>+</code> (saudara tepat sesudah), <code>~</code> (saudara sesudahnya).',
    'Selektor atribut menyasar elemen berdasarkan atributnya, misalnya <code>[href^="https"]</code>.'
  ]
});

window.CSS_LESSONS.push({
  id: 'properti-dasar',
  title: 'Properti Dasar CSS',
  chapter: 'Selektor & Properti',
  duration: '7 menit',
  intro: [
    'Kalau selektor adalah alamat tujuan, <b>properti</b> adalah tombol pengaturnya. Properti dasar mengatur tiga hal yang paling sering diutak-atik pemula: warna, huruf, dan bentuk kotak.',
    'Pelajaran ini membahas properti yang dipakai di hampir setiap halaman web — mulai dari <code>color</code> hingga <code>border</code>.'
  ],
  objectives: [
    'Mengatur warna teks dan latar dengan color dan background-color',
    'Mengatur huruf dengan font-family, font-size, font-weight, dan font-style',
    'Meratakan teks dan menggambar border',
    'Menulis warna dalam empat notasi: nama, heksa, rgb, dan hsl'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Properti dasar bisa dikelompokkan jadi tiga keluarga:</p><ul><li><b>Warna</b> — <code>color</code> untuk teks, <code>background-color</code> untuk latar.</li><li><b>Huruf</b> — <code>font-family</code>, <code>font-size</code>, <code>font-weight</code>, <code>font-style</code>.</li><li><b>Bentuk &amp; ukuran</b> — <code>text-align</code>, <code>border</code>, <code>width</code>, <code>height</code>.</li></ul><p>Semuanya ditulis dengan pola yang sama: <code>properti: nilai;</code> di dalam blok selektor.</p>'
    },
    {
      type: 'example',
      title: 'Warna, latar, dan huruf pada kartu kopi',
      lang: 'css',
      output: true,
      code: `body {
  background-color: #F5F0EB;
  font-family: Verdana, sans-serif;
}

.kartu {
  color: #3E2723;
  background-color: #FFFFFF;
  border: 2px solid #6F4E37;
  border-radius: 10px;
  padding: 16px;
}

.kartu h3 {
  font-size: 22px;
  font-weight: bold;
}

.kartu .harga {
  font-style: italic;
  color: #B23A48;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Kopi</title>
  <style>
    __CODE__
  </style>
</head>
<body>
  <div class="kartu" style="max-width: 300px">
    <h3>Kopi Susu Gula Aren</h3>
    <p>Manis, creamy, dan hangat — cocok untuk pagi hari.</p>
    <p class="harga">Rp 15.000</p>
  </div>
</body>
</html>`,
      explain: [
        '<code>color</code> mengatur warna <b>teks</b>; <code>background-color</code> mengatur warna <b>latar</b> elemen.',
        '<code>font-family</code> menamai huruf; tuliskan cadangan (fallback) seperti <code>sans-serif</code> bila huruf pertama tidak ada di komputer pembaca.',
        '<code>font-weight: bold</code> menebalkan, <code>font-style: italic</code> memiringkan, dan <code>font-size</code> mengubah ukuran huruf.',
        '<code>border-radius</code> membulatkan sudut kartu — properti kecil dengan efek visual besar.'
      ]
    },
    {
      type: 'example',
      title: 'Border, width, dan height',
      lang: 'css',
      output: false,
      code: `/* Border: tebal | jenis | warna */
.kotak {
  border: 4px dashed #1572B6;
  width: 200px;
  height: 120px;
  background-color: #E3F2FD;
}

/* Border bisa diatur per sisi */
.notif {
  border-top: 6px solid #F9A825;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #DDD;
}

/* Lebar dan tinggi bisa pakai % juga */
.gambar {
  width: 100%;
  height: auto;
}`,
      explain: [
        'Bentuk singkat <code>border</code> berurutan: <b>tebal, jenis, warna</b> — misalnya <code>4px dashed #1572B6</code>.',
        'Jenis border yang umum: <code>solid</code>, <code>dashed</code>, <code>dotted</code>, dan <code>double</code>.',
        '<code>width</code> dan <code>height</code> bisa dalam <code>px</code> atau <code>%</code>; <code>height: auto</code> membiarkan browser menghitung tinggi otomatis.',
        'Atur tiap sisi dengan <code>border-top</code>, <code>border-right</code>, <code>border-bottom</code>, dan <code>border-left</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Empat cara menulis warna',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Nilai Warna</title>
  <style>
    p { padding: 8px; margin: 6px 0; border-radius: 6px; }
    .nama  { color: white; background-color: red; }
    .heksa { color: #FFFFFF; background-color: #FF0000; }
    .rgb   { color: rgb(255, 255, 255); background-color: rgb(255, 0, 0); }
    .hsl   { color: hsl(0, 0%, 100%); background-color: hsl(0, 100%, 50%); }
  </style>
</head>
<body>
  <p class="nama">Warna nama: red</p>
  <p class="heksa">Heksadesimal: #FF0000 (bisa disingkat #F00)</p>
  <p class="rgb">RGB: rgb(255, 0, 0)</p>
  <p class="hsl">HSL: hsl(0, 100%, 50%)</p>
</body>
</html>`,
      explain: [
        '<b>Nama</b> — paling mudah dihafal (<code>red</code>, <code>teal</code>, <code>tomato</code>), tapi pilihannya terbatas (sekitar 140 nama).',
        '<b>Heksa</b> — <code>#RRGGBB</code>, paling umum dipakai desainer; <code>#FF0000</code> bisa dipendekkan jadi <code>#F00</code> karena pasangan digitnya sama.',
        '<b>RGB</b> — <code>rgb(merah, hijau, biru)</code>, tiap angka 0–255; cocok saat kamu mencampur warna secara presisi.',
        '<b>HSL</b> — <code>hsl(hue, saturasi, terang)</code>: hue 0–360 derajat; paling intuitif untuk membuat variasi, misalnya versi yang lebih terang atau lebih gelap.'
      ]
    },
    {
      type: 'warn',
      title: 'Hati-hati: width bisa "membengkak"',
      text: 'Secara bawaan, <code>width: 200px</code> hanya mengatur lebar <b>isi</b> — padding dan border <b>ditambahkan di luar</b>, jadi totalnya bisa jadi 224px atau lebih. Solusinya: tambahkan <code>* { box-sizing: border-box; }</code> agar <code>width</code> mencakup padding dan border. (Box model dibahas lengkap di pelajaran berikutnya.)'
    },
    {
      type: 'vocab',
      items: [
        ['color', 'Warna teks di dalam elemen.'],
        ['background-color', 'Warna latar elemen.'],
        ['font-family', 'Daftar huruf yang dipakai, dari utama hingga cadangan.'],
        ['font-size', 'Ukuran huruf, misalnya <code>16px</code> atau <code>1.2rem</code>.'],
        ['font-weight', 'Ketebalan huruf: <code>normal</code>, <code>bold</code>, atau angka 100–900.'],
        ['border', 'Garis tepi elemen: tebal, jenis, dan warna.'],
        ['text-align', 'Perataan teks: <code>left</code>, <code>center</code>, <code>right</code>, <code>justify</code>.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: kustomisasi kartu menu',
      lang: 'html',
      hint: 'Ganti color jadi teal, background-color jadi #FFF8E1, dan coba border: 3px dotted #6F4E37 pada .kartu. Lalu tambahkan aturan .tebal { font-weight: bold; } dan beri class="tebal" pada h3. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Properti Dasar</title>
  <style>
    .kartu {
      /* ganti warna, latar, dan border di sini */
      padding: 16px;
      max-width: 300px;
    }
  </style>
</head>
<body>
  <div class="kartu">
    <h3>Kopi Tarik</h3>
    <p>Susu pekat manis, kopi hitam pekat, es batu.</p>
    <p>Rp 13.000</p>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    '<code>color</code> mengatur warna teks; <code>background-color</code> mengatur warna latar.',
    '<code>font-family</code>, <code>font-size</code>, <code>font-weight</code>, dan <code>font-style</code> mengatur jenis, ukuran, ketebalan, dan kemiringan huruf.',
    '<code>text-align</code> meratakan teks; <code>border</code> menggambar garis tepi (tebal, jenis, warna).',
    'Warna bisa ditulis dengan nama, heksa (<code>#RRGGBB</code>), <code>rgb()</code>, atau <code>hsl()</code>.',
    'Ingat <code>box-sizing: border-box</code> agar width/height tidak membengkak karena padding dan border.'
  ]
});

window.CSS_LESSONS.push({
  id: 'unit-ukuran',
  title: 'Unit Ukuran CSS',
  chapter: 'Selektor & Properti',
  duration: '7 menit',
  intro: [
    'Nilai ukuran CSS selalu terdiri dari <b>angka + unit</b>, misalnya <code>16px</code>. Memilih unit yang tepat itu penting: <code>px</code> bersifat tetap, <code>em/rem</code> mengikuti pengaturan pembaca, dan <code>%/vw/vh</code> mengikuti ukuran layar atau elemen induk.',
    'Pelajaran ini membahas unit yang paling sering dipakai, plus angka tanpa unit yang sering ditemui di <code>line-height</code> dan <code>font-weight</code>.'
  ],
  objectives: [
    'Membedakan px, em, dan rem',
    'Memahami %, vw, dan vh',
    'Tahu kapan pt dan cm dipakai',
    'Mengenal nilai tanpa unit (line-height, font-weight, 0)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Ada dua keluarga besar unit: <b>mutlak</b> (tetap, seperti <code>px</code> dan <code>cm</code>) dan <b>relatif</b> (mengikuti sesuatu, seperti <code>em</code>, <code>rem</code>, dan <code>%</code>). Aturan praktisnya: untuk ukuran huruf dan jarak, pilih unit <b>relatif terhadap akar</b> (rem) agar halaman tetap nyaman dibaca di berbagai perangkat.</p>'
    },
    {
      type: 'example',
      title: 'px, em, dan rem pada kartu resep',
      lang: 'css',
      output: true,
      code: `html {
  font-size: 16px; /* acuan rem */
}

.kartu {
  font-size: 1rem;   /* = 16px, mengikuti akar */
  border: 1px solid #6F4E37;
  border-radius: 8px;
  padding: 12px;
  max-width: 320px;
}

.judul {
  font-size: 1.5rem; /* = 24px */
  color: #3E2723;
}

.catatan {
  font-size: 0.875rem; /* = 14px */
  color: #5D4037;
}

.em-contoh {
  font-size: 2em; /* 2x ukuran induknya (32px di sini) */
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>px, em, rem</title>
  <style>
    body { font-family: Verdana, sans-serif; }
    __CODE__
  </style>
</head>
<body>
  <div class="kartu">
    <p class="judul">Resep Kopi Gula Aren</p>
    <p class="catatan">Seduh 3 menit, aduk perlahan.</p>
    <p>Teks biasa berukuran 1rem.</p>
    <p class="em-contoh">Teks ini 2em dari induknya.</p>
  </div>
</body>
</html>`,
      explain: [
        '<code>px</code> (piksel) bersifat <b>tetap</b>: 16px selalu 16px, tidak peduli pengaturan browser pembaca.',
        '<code>rem</code> ("root em") selalu relatif terhadap <b>ukuran huruf elemen akar</b> (<code>&lt;html&gt;</code>) — 1.5rem dengan akar 16px berarti 24px.',
        '<code>em</code> relatif terhadap <b>ukuran huruf induk langsung</b>, jadi mudah "berlipat" kalau bersarang — hati-hati di elemen berlapis.',
        'Coba ubah <code>html { font-size }</code> di pratinjau: semua nilai rem ikut berubah sekaligus, sedangkan px tidak bergerak.'
      ]
    },
    {
      type: 'example',
      title: 'Persen, vw/vh, dan unit cetak',
      lang: 'css',
      output: false,
      code: `/* Persen: relatif terhadap elemen induk */
.gambar {
  width: 100%;   /* selebar induknya */
  height: auto;  /* tinggi mengikuti rasio asli */
}

.bungkus {
  width: 75%;     /* 3/4 lebar induk */
  margin: 0 auto; /* rata tengah */
}

/* vw/vh: relatif terhadap layar (viewport) */
.jumbotron {
  height: 50vh;   /* setinggi setengah layar */
  font-size: 4vw; /* 4% lebar layar */
}

/* Unit cetak: untuk stylesheet @media print */
@media print {
  body {
    font-size: 12pt;
    margin: 2cm;
  }
}`,
      explain: [
        '<code>%</code> menghitung terhadap <b>elemen induk</b> — <code>width: 75%</code> berarti tiga perempat lebar induknya.',
        '<code>vw</code> adalah 1% lebar layar, <code>vh</code> adalah 1% tinggi layar; <code>50vh</code> berarti setengah tinggi jendela browser.',
        '<code>pt</code> (point) dan <code>cm</code> biasanya untuk <b>cetak</b>; di layar, lebih baik pakai px atau rem.',
        '<code>height: auto</code> menjaga rasio gambar tetap proporsional saat lebarnya berubah.'
      ]
    },
    {
      type: 'example',
      title: 'Angka tanpa unit: kapan boleh?',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tanpa Unit</title>
  <style>
    .teks {
      line-height: 1.6; /* tanpa unit: kelipatan font-size */
      font-weight: 700; /* angka tanpa unit */
      opacity: 0.9;     /* 0 sampai 1 */
    }
    .nol {
      margin: 0;        /* nol tidak perlu unit */
    }
    p { border-left: 4px solid #B23A48; padding: 8px 12px; background: #FFF3E0; }
  </style>
</head>
<body>
  <p class="teks">Paragraf ini punya line-height 1.6 dan huruf tebal (font-weight 700).</p>
  <p class="teks nol">margin: 0 tidak butuh unit — nol adalah nol, satuan apa pun hasilnya sama.</p>
</body>
</html>`,
      explain: [
        '<code>line-height: 1.6</code> berarti 1,6 kali ukuran huruf — tanpa unit, sehingga otomatis ikut berubah kalau font-size berubah.',
        '<code>font-weight</code> memakai angka 100–900 (400 = normal, 700 = bold) tanpa unit.',
        '<code>opacity</code> dan <code>z-index</code> juga angka tanpa unit.',
        'Untuk nilai <b>nol</b>, unit tidak wajib: <code>margin: 0</code> sama dengan <code>margin: 0px</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'rem adalah sahabat aksesibilitas',
      text: 'Banyak pembaca memperbesar ukuran huruf bawaan browser (misalnya jadi 20px). Kalau semua ukuranmu pakai <code>rem</code>, seluruh halaman ikut membesar dengan rapi. Praktik umum: atur <code>html { font-size: 100%; }</code> lalu ukur semuanya dalam rem — <code>font-size: 1rem</code> untuk teks, <code>1.25rem</code> untuk judul, dan seterusnya.'
    },
    {
      type: 'warn',
      title: 'Jangan campur unit secara asal',
      text: 'CSS tidak otomatis mengubah <code>px</code> ke <code>em</code>. Kalau kamu menulis <code>padding: 1em 8px;</code>, keduanya tetap bekerja, tapi skalanya berbeda saat teks diperbesar — tata letak bisa janggal. Putuskan satu "bahasa unit" untuk tiap bagian: rem untuk ukuran huruf dan jarak, % atau vw untuk lebar yang fleksibel.'
    },
    {
      type: 'vocab',
      items: [
        ['px', 'Piksel — unit tetap di layar.'],
        ['em', 'Relatif terhadap ukuran huruf elemen induk.'],
        ['rem', 'Relatif terhadap ukuran huruf elemen akar (<code>&lt;html&gt;</code>).'],
        ['%', 'Persen — relatif terhadap elemen induk.'],
        ['vw / vh', '1% lebar / tinggi viewport (layar browser).'],
        ['pt / cm', 'Unit cetak: point dan sentimeter.'],
        ['Viewport', 'Area tampilan halaman di jendela browser.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: mainkan skala kartu',
      lang: 'html',
      hint: 'Ubah font-size pada html (misal 18px), lalu ganti ukuran .judul jadi 1.75rem dan .catatan jadi 0.8rem. Perhatikan semuanya ikut berubah skala. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Unit</title>
  <style>
    html { font-size: 16px; }
    body { font-family: Verdana, sans-serif; }
    .kartu {
      font-size: 1rem;
      border: 2px solid #6F4E37;
      border-radius: 8px;
      padding: 1rem;
      max-width: 320px;
    }
    .judul { font-size: 1.5rem; color: #3E2723; }
    .catatan { font-size: 0.875rem; color: #5D4037; }
  </style>
</head>
<body>
  <div class="kartu">
    <p class="judul">Es Kopi Susu</p>
    <p class="catatan">Es batu, kopi es, susu uap.</p>
    <p>Harga: Rp 12.000</p>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    '<code>px</code> tetap; <code>em</code> relatif ke induk; <code>rem</code> relatif ke elemen akar.',
    '<code>%</code> relatif ke induk; <code>vw/vh</code> relatif ke layar; <code>pt/cm</code> untuk cetak.',
    '<code>line-height</code>, <code>font-weight</code>, <code>opacity</code>, dan angka 0 tidak memerlukan unit.',
    'rem adalah pilihan utama agar halaman ikut membesar saat pengguna mengubah ukuran huruf browser.'
  ]
});

window.CSS_LESSONS.push({
  id: 'text-styling',
  title: 'Text Styling',
  chapter: 'Selektor & Properti',
  duration: '8 menit',
  intro: [
    'Teks adalah mayoritas isi kebanyakan halaman, jadi cara mengaturnya sangat berpengaruh pada kesan sebuah situs. CSS punya dua kelompok properti: <b>font</b> (bentuk huruf itu sendiri) dan <b>teks</b> (jarak, perataan, dan dekorasi).',
    'Pelajaran ini merangkum properti teks yang paling sering dipakai, plus tips memilih font yang aman di semua perangkat.'
  ],
  objectives: [
    'Mengatur font-family, font-size, font-weight, dan font-style',
    'Mengatur line-height, letter-spacing, dan word-spacing',
    'Meratakan dan mendekorasi teks (text-align, text-decoration, text-transform)',
    'Memilih font dengan font stack yang aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebagian besar properti teks mengikuti satu prinsip: <b>kebanyakan pembaca tidak menyadari tipografi yang bagus, tapi langsung merasakan tipografi yang buruk</b>. Jarak antarbaris yang cukup dan ukuran huruf yang nyaman lebih penting daripada dekorasi.</p>'
    },
    {
      type: 'example',
      title: 'Font pada kartu menu kopi',
      lang: 'css',
      output: true,
      code: `body {
  font-family: Georgia, 'Times New Roman', serif;
  background-color: #F5F0EB;
}

.kartu {
  max-width: 340px;
  margin: 0 auto;
  background: #FFFDF9;
  border: 2px solid #6F4E37;
  border-radius: 10px;
  padding: 18px;
}

.kartu h2 {
  font-family: Verdana, sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

.deskripsi {
  font-size: 15px;
  font-style: italic;
  line-height: 1.5;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Font</title>
  <style>
    __CODE__
  </style>
</head>
<body>
  <div class="kartu">
    <h2>KOPI TUBRUK</h2>
    <p class="deskripsi">Kopi tubruk adalah kopi seduh khas Indonesia: bubuk kopi diseduh langsung dengan air panas, gula secukupnya, tanpa disaring.</p>
    <p>Kental, wangi, dan bikin melek.</p>
  </div>
</body>
</html>`,
      explain: [
        '<code>font-family</code> ditulis sebagai <b>daftar cadangan</b>: Georgia dulu, lalu Times New Roman, lalu serif generik kalau keduanya tidak ada.',
        'Nama font yang punya spasi diberi tanda kutip, misalnya <code>\'Times New Roman\'</code>.',
        '<code>font-weight: 700</code> setara dengan <code>bold</code>; <code>font-style: italic</code> memiringkan.',
        '<code>line-height: 1.5</code> memberi jarak antarbaris yang nyaman dibaca — angka tanpa unit adalah cara paling aman.'
      ]
    },
    {
      type: 'example',
      title: 'Jarak antar huruf, kata, dan baris',
      lang: 'css',
      output: false,
      code: `/* Jarak antar huruf dan antar kata */
.judul {
  letter-spacing: 2px;
  word-spacing: 6px;
}

/* Jarak antar baris */
.paragraf {
  line-height: 1.7;
}

/* Perataan teks */
.teks-tengah {
  text-align: center;
}
.teks-rata {
  text-align: justify;
}

/* Cara teks membungkus */
.kutipan {
  white-space: pre-line; /* pecah di newline, spasi ganda digabung */
}
.pre {
  white-space: pre;      /* persis seperti ditulis */
}`,
      explain: [
        '<code>letter-spacing</code> menambah jarak antar huruf — cocok untuk judul berkapital, tapi jangan berlebihan.',
        '<code>word-spacing</code> mengatur jarak antar kata.',
        '<code>text-align: justify</code> meratakan teks ke kiri dan kanan seperti koran; bisa membuat jarak kata tidak rata pada kolom sempit.',
        '<code>white-space: pre</code> mempertahankan spasi dan baris baru persis seperti dalam HTML; <code>pre-line</code> menggabungkan spasi ganda tapi tetap memecah pada baris baru.'
      ]
    },
    {
      type: 'example',
      title: 'Dekorasi dan perubahan huruf',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dekorasi Teks</title>
  <style>
    p { padding: 6px 0; }
    .garis { text-decoration: underline; color: #1572B6; }
    .coret { text-decoration: line-through; color: #B23A48; }
    .custom { text-decoration: underline dotted #6F4E37 3px; }
    .besar { text-transform: uppercase; letter-spacing: 1px; }
    .awal { text-transform: capitalize; }
    .kecil { text-transform: lowercase; }
  </style>
</head>
<body>
  <p class="garis">Teks ini digarisbawahi.</p>
  <p class="coret">Harga lama: Rp 20.000</p>
  <p class="custom">Garis bawah titik-titik cokelat.</p>
  <p class="besar">kopi tubruk jadi huruf besar semua</p>
  <p class="awal">kopi tubruk jadi Huruf Awal Kapital</p>
  <p class="kecil">KOPI TUBRUK JADI huruf kecil semua</p>
</body>
</html>`,
      explain: [
        '<code>text-decoration: underline</code> menambah garis bawah; <code>line-through</code> membuat garis tengah — biasa dipakai untuk harga lama.',
        'Bentuk lengkapnya bisa diatur: <code>underline dotted #6F4E37 3px</code> berarti garis bawah, titik-titik, warna cokelat, tebal 3px.',
        '<code>text-transform: uppercase</code> mengubah <b>tampilan</b> jadi huruf besar tanpa mengubah isi HTML — salin-tempel tetap mendapat teks aslinya.',
        '<code>capitalize</code> membuat huruf awal tiap kata kapital; <code>lowercase</code> membuat semuanya huruf kecil.'
      ]
    },
    {
      type: 'tip',
      title: 'Memilih font: aman dulu, kreatif kemudian',
      text: 'Font "aman" (web-safe) seperti Arial, Verdana, Georgia, dan Times New Roman hampir pasti ada di semua perangkat. Untuk tampilan lebih khas, tumpukkan beberapa pilihan (font stack): <code>font-family: "Segoe UI", Roboto, Arial, sans-serif;</code> — browser memakai yang pertama yang tersedia, dan selalu akhiri dengan keluarga generik (<code>sans-serif</code> atau <code>serif</code>) sebagai jaring pengaman.'
    },
    {
      type: 'warn',
      title: 'Dekorasi secukupnya',
      text: 'Garis bawah secara tradisional menandai <b>tautan</b> — menggarisbawahi teks biasa bisa membingungkan pembaca. Batasi <code>text-decoration</code> untuk penekanan seperti harga lama (line-through), dan jangan pakai <code>uppercase</code> untuk paragraf panjang: huruf kapital semua lebih sulit dibaca.'
    },
    {
      type: 'vocab',
      items: [
        ['font-family', 'Nama huruf dan daftar cadangannya.'],
        ['font-size', 'Ukuran huruf.'],
        ['font-weight', 'Ketebalan huruf (normal, bold, atau 100–900).'],
        ['font-style', 'Kemiringan: normal atau italic.'],
        ['line-height', 'Tinggi baris — jarak antarbaris teks.'],
        ['letter-spacing / word-spacing', 'Jarak antar huruf / antar kata.'],
        ['text-align', 'Perataan: left, center, right, justify.'],
        ['text-decoration', 'Dekorasi garis: underline, overline, line-through.'],
        ['text-transform', 'Perubahan kapital: uppercase, lowercase, capitalize.'],
        ['white-space', 'Cara browser menangani spasi dan baris baru.'],
        ['Font stack', 'Daftar font cadangan di properti font-family.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: gaya teks kartu resep',
      lang: 'html',
      hint: 'Tambahkan text-transform: uppercase dan letter-spacing: 2px pada h2, line-height: 1.7 pada p, dan text-decoration: underline dotted pada .promo. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Text Styling</title>
  <style>
    body { font-family: Georgia, serif; background: #F5F0EB; }
    .kartu {
      max-width: 320px;
      background: #FFFDF9;
      border: 2px solid #6F4E37;
      border-radius: 8px;
      padding: 16px;
    }
    /* tambahkan gaya teksmu di sini */
  </style>
</head>
<body>
  <div class="kartu">
    <h2>Resep Kopi Pandan</h2>
    <p>Seduh kopi bubuk dengan air panas, tambahkan daun pandan dan gula batu. Aduk hingga dingin.</p>
    <p class="promo">Diskon 20% untuk pembelian hari ini</p>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    '<code>font-family</code> (dengan font stack), <code>font-size</code>, <code>font-weight</code>, dan <code>font-style</code> mengatur bentuk huruf.',
    '<code>line-height</code>, <code>letter-spacing</code>, dan <code>word-spacing</code> mengatur kerapatan dan jarak teks.',
    '<code>text-align</code> meratakan teks; <code>text-decoration</code> menambah garis; <code>text-transform</code> mengubah kapital tampilan.',
    '<code>white-space</code> mengatur cara spasi dan baris baru ditampilkan.',
    'Pakai font aman atau font stack dengan keluarga generik sebagai cadangan; dekorasi secukupnya.'
  ]
});
