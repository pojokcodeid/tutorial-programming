/* ============================================================
   Pelajaran CSS — Chapter: Layout Modern
   (topik info.md: "flexbox dasar", "grid layout",
    "media query dan responsive web design")
   ============================================================ */
'use strict';

window.CSS_LESSONS = window.CSS_LESSONS || [];

/* ---------- Pelajaran 1: Flexbox Dasar ---------- */
window.CSS_LESSONS.push({
  id: 'flexbox-dasar',
  title: 'Flexbox Dasar',
  chapter: 'Layout Modern',
  duration: '10 menit',
  intro: [
    'Bayangkan <b>Flexbox</b> seperti menata sepatu di rak: kamu menyusunnya dalam satu baris, lalu mengatur jarak, perataan, dan urutannya — tanpa mengukur satu per satu. Semua itu bisa dilakukan dengan beberapa baris CSS.',
    'Caranya: beri induk <code>display: flex</code>. Otomatis anak-anaknya menjadi <b>flex item</b> yang bisa direntangkan, diratakan, dan dibungkus sesuai kebutuhan.'
  ],
  objectives: [
    'Mengaktifkan flexbox dengan display: flex',
    'Mengatur arah dan perataan dengan flex-direction, justify-content, dan align-items',
    'Memakai gap dan flex-wrap agar rapi di layar sempit',
    'Mengatur ukuran anak dengan flex (grow, shrink, basis) dan urutannya dengan order',
    'Menerapkan flexbox pada menu navigasi dan deretan kartu'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Flexbox punya dua pemain: <b>wadah</b> (induk) dan <b>item</b> (anak). Begitu induk jadi flex container, semua anak langsung mengikuti "arus" yang disebut <b>main axis</b> — secara bawaan horizontal dari kiri ke kanan.</p><p>Sisanya adalah mengatur arah aliran, perataan, dan jarak. Anggap saja kamu jadi mandor yang mengatur antrian orang di loket: siapa di depan, siapa di belakang, dan berapa jarak antar orang.</p>'
    },
    {
      type: 'example',
      title: 'Menu navigasi: logo kiri, tautan kanan',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Navbar Flexbox</title>
  <style>
    * { margin: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; padding: 20px; }
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      background: #1572B6;
      padding: 12px 18px;
      border-radius: 10px;
    }
    .logo { color: #fff; font-weight: bold; font-size: 20px; }
    .nav a {
      color: #fff;
      text-decoration: none;
      padding: 6px 10px;
    }
    .nav a:hover { background: #0d4d80; border-radius: 6px; }
  </style>
</head>
<body>
  <nav class="nav">
    <span class="logo">BelajarKoding</span>
    <div>
      <a href="#">Beranda</a>
      <a href="#">Tutorial</a>
      <a href="#">Kontak</a>
    </div>
  </nav>
  <p>Logo di kiri, tautan di kanan — tanpa satu pun float atau position.</p>
</body>
</html>`,
      explain: [
        '<code>display: flex</code> mengubah <b>&lt;nav&gt;</b> menjadi wadah fleksibel, sehingga logo dan daftar tautan otomatis sejajar dalam satu baris.',
        '<code>justify-content: space-between</code> mendorong logo ke ujung kiri dan tautan ke ujung kanan, menyisakan ruang di tengah.',
        '<code>align-items: center</code> membuat logo dan tautan sejajar vertikal di tengah garis navbar.',
        '<code>gap: 16px</code> memberi jarak antar item tanpa perlu <code>margin</code> manual.'
      ]
    },
    {
      type: 'example',
      title: 'Deretan kartu warna-warni yang bisa bungkus',
      lang: 'css',
      output: true,
      code: `.wadah {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.kartu {
  flex: 1 1 220px;
  background: #E8F0FE;
  border: 2px solid #1572B6;
  border-radius: 10px;
  padding: 16px;
}
.kartu.favorit {
  order: -1;
  background: #FFF4E5;
  border-color: #E34F26;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kartu Flexbox</title>
  <style>
__CODE__
  </style>
</head>
<body>
  <div class="wadah">
    <div class="kartu">Kartu 1</div>
    <div class="kartu favorit">Kartu 2 (favorit)</div>
    <div class="kartu">Kartu 3</div>
    <div class="kartu">Kartu 4</div>
  </div>
</body>
</html>`,
      explain: [
        '<code>flex-wrap: wrap</code> membuat kartu turun ke baris berikutnya saat ruang tidak cukup — tidak perlu menghitung lebar secara manual.',
        '<code>flex: 1 1 220px</code> berarti tiap kartu bisa <b>tumbuh</b> (grow 1), bisa <b>menyusut</b> (shrink 1), dengan ukuran awal (basis) 220 piksel.',
        '<code>order: -1</code> memindahkan kartu favorit ke awal baris tanpa mengubah urutan di HTML.'
      ]
    },
    {
      type: 'example',
      title: 'Kumpulan properti Flexbox yang sering dipakai',
      lang: 'css',
      output: false,
      code: `/* ===== INDUK (flex container) ===== */
.wadah {
  display: flex;            /* aktifkan flexbox */
  flex-direction: row;      /* row | row-reverse | column | column-reverse */
  justify-content: center;  /* sepanjang baris: flex-start | center | space-between | space-around */
  align-items: center;      /* melintang baris: stretch | center | flex-start | flex-end */
  gap: 12px;                /* jarak antar item */
  flex-wrap: wrap;          /* bungkus ke baris baru saat sempit */
}

/* ===== ANAK (flex item) ===== */
.item {
  flex: 1 1 auto;           /* grow | shrink | basis */
  order: 2;                 /* urutan tampil, nilai awal 0 */
}`,
      explain: [
        'Semua properti pertama dijalankan pada <b>induk</b>; hanya <code>flex</code> dan <code>order</code> yang dipasang pada <b>anak</b>.',
        '<code>flex-direction: column</code> memutar arah aliran jadi vertikal — cocok untuk menu samping atau daftar formulir.',
        '<code>align-items: stretch</code> (nilai bawaan) membuat semua anak setinggi anak tertinggi.'
      ]
    },
    {
      type: 'tip',
      title: 'Memusatkan elemen jadi dua baris',
      text: 'Mau memusatkan sesuatu secara horizontal <i>dan</i> vertikal? Pasang <code>display: flex</code>, <code>justify-content: center</code>, dan <code>align-items: center</code> pada induknya. Dulu trik ini butuh <code>position</code> dan margin negatif — sekarang cukup tiga baris.'
    },
    {
      type: 'warn',
      title: 'Kenapa tidak berubah apa pun?',
      text: 'Kalau <code>justify-content</code> atau <code>gap</code> tampak diabaikan, hampir selalu penyebabnya sama: induk belum diberi <code>display: flex</code>. Properti itu hanya bekerja di dalam flex container, jadi periksa dulu baris itu.'
    },
    {
      type: 'vocab',
      items: [
        ['Flex container', 'Elemen induk yang diberi <code>display: flex</code>; semua anaknya ikut aturan fleksibel.'],
        ['Flex item', 'Anak langsung dari flex container yang bisa diatur ukuran dan urutannya.'],
        ['Main axis', 'Arah aliran utama item — horizontal untuk <code>row</code>, vertikal untuk <code>column</code>.'],
        ['Cross axis', 'Arah melintang utama: tegak lurus terhadap main axis.'],
        ['flex-wrap', 'Properti induk yang mengizinkan item turun ke baris baru (<code>wrap</code>) saat ruang sempit.'],
        ['order', 'Properti anak untuk mengubah urutan tampil tanpa mengubah HTML.'],
        ['flex', 'Singkatan tiga properti anak sekaligus: <code>grow</code> (bertumbuh), <code>shrink</code> (menyusut), <code>basis</code> (ukuran awal).']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: mainkan navbar dan kartu',
      lang: 'html',
      hint: 'Coba ubah justify-content menjadi center lalu space-around, ganti flex-direction ke column, dan beri order: -1 pada kartu pertama. Klik Jalankan untuk melihat hasilnya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Latihan Flexbox</title>
  <style>
    .nav {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 12px;
      background: #1572B6;
      padding: 12px;
      border-radius: 8px;
    }
    .nav a { color: #fff; text-decoration: none; }
    .deretan {
      display: flex;
      gap: 10px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .kotak {
      background: #FFF4E5;
      border: 2px solid #E34F26;
      border-radius: 8px;
      padding: 14px;
    }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="#">Home</a>
    <a href="#">Belajar</a>
    <a href="#">Latihan</a>
    <a href="#">Kuis</a>
  </nav>
  <div class="deretan">
    <div class="kotak">Kotak A</div>
    <div class="kotak">Kotak B</div>
    <div class="kotak">Kotak C</div>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'display: flex pada induk mengaktifkan Flexbox; anak-anaknya jadi flex item.',
    'justify-content mengatur perataan searah baris; align-items melintang baris.',
    'gap memberi jarak antar item; flex-wrap membungkus item ke baris baru.',
    'flex: grow shrink basis mengatur ukuran anak; order mengubah urutan tampil.',
    'Kasus nyata: menu navigasi (space-between) dan deretan kartu (wrap + gap).'
  ]
});

/* ---------- Pelajaran 2: Grid Layout ---------- */
window.CSS_LESSONS.push({
  id: 'grid-layout',
  title: 'Grid Layout',
  chapter: 'Layout Modern',
  duration: '9 menit',
  intro: [
    'Flexbox hebat untuk satu baris atau satu kolom. Tapi kalau kamu butuh <b>baris dan kolom sekaligus</b> — seperti tata letak majalah — <b>Grid Layout</b> adalah jawabannya.',
    'Grid bekerja seperti kertas grafik: kamu membuat petak-petak kolom dan baris, lalu menempatkan elemen di petak mana pun, bahkan membentang melewati beberapa petak.'
  ],
  objectives: [
    'Membuat grid dengan display: grid dan grid-template-columns / rows',
    'Menggunakan unit fr dan fungsi repeat() untuk kolom fleksibel',
    'Memberi jarak antar petak dengan gap',
    'Membentangkan elemen dengan grid-column: span',
    'Membuat kolom responsif tanpa media query memakai auto-fit dan minmax()'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bayangkan kamu merancang <b>denah lantai</b>: Flexbox mengatur isi satu ruangan, sedangkan Grid mengatur <b>posisi ruangan-ruangan</b>nya — mana kamar, mana dapur, mana koridor.</p><p>Grid punya dua sumbu yang setara: <b>kolom</b> (garis vertikal) dan <b>baris</b> (garis horizontal). Karena itu Grid disebut tata letak <b>dua dimensi</b>, sedangkan Flexbox disebut <b>satu dimensi</b>.'
    },
    {
      type: 'example',
      title: 'Galeri tiga kolom sejajar dengan unit fr',
      lang: 'css',
      output: true,
      code: `.galeri {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}
.kartu {
  background: #FFF4E5;
  border: 2px solid #E34F26;
  border-radius: 10px;
  padding: 18px;
  text-align: center;
  font-weight: bold;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Galeri Grid</title>
  <style>
__CODE__
  </style>
</head>
<body>
  <div class="galeri">
    <div class="kartu">1</div>
    <div class="kartu">2</div>
    <div class="kartu">3</div>
    <div class="kartu">4</div>
    <div class="kartu">5</div>
    <div class="kartu">6</div>
  </div>
</body>
</html>`,
      explain: [
        '<code>display: grid</code> mengubah <b>&lt;div&gt;</b> menjadi kisi dua dimensi.',
        '<code>grid-template-columns: 1fr 1fr 1fr</code> membuat tiga kolom sama lebar. Unit <code>fr</code> (fraction) membagi sisa ruang secara adil, jadi kolom selalu pas dengan lebar layar.',
        '<code>gap: 14px</code> mengatur jarak antar petak sekaligus — baik mendatar maupun menurun.'
      ]
    },
    {
      type: 'example',
      title: 'Kartu unggulan membentang dua kolom',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Span pada Grid</title>
  <style>
    .galeri {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .kartu {
      background: #E6F4EA;
      border: 2px solid #188038;
      border-radius: 10px;
      padding: 18px;
      text-align: center;
      font-weight: bold;
    }
    .fitur {
      grid-column: span 2;
      background: #FEF7E0;
      border-color: #F9AB00;
    }
  </style>
</head>
<body>
  <div class="galeri">
    <div class="kartu fitur">Unggulan — membentang 2 kolom</div>
    <div class="kartu">Biasa</div>
    <div class="kartu">Biasa</div>
    <div class="kartu">Biasa</div>
    <div class="kartu">Biasa</div>
  </div>
</body>
</html>`,
      explain: [
        '<code>grid-column: span 2</code> membuat kartu unggulan membentang melewati dua jejak kolom, langsung menggeser kartu lain ke samping.',
        '<code>repeat(3, 1fr)</code> adalah cara singkat menulis <code>1fr 1fr 1fr</code> — sangat berguna untuk kolom yang banyak.',
        'Item berikutnya otomatis mengisi petak kosong berikutnya, jadi kamu tidak perlu mengatur posisi satu per satu.'
      ]
    },
    {
      type: 'example',
      title: 'Kolom responsif otomatis: auto-fit + minmax()',
      lang: 'css',
      output: false,
      code: `.galeri {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

/* Browser yang menghitung jumlah kolom:
   layar 1200px -> 4 kolom
   layar  900px -> 3 kolom
   layar  600px -> 2 kolom
   layar  400px -> 1 kolom
   Semua tanpa satu pun @media! */`,
      explain: [
        '<code>minmax(240px, 1fr)</code> berarti tiap kolom minimal 240 piksel, tapi boleh tumbuh mengisi ruang yang tersisa.',
        '<code>auto-fit</code> menyuruh browser memasukkan kolom sebanyak yang muat — inilah kunci responsif tanpa media query.',
        'Kalau lebih suka kolom yang mengembang mengisi sisa ruang, ganti <code>auto-fit</code> dengan <code>auto-fill</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kapan pakai yang mana? <b>Flexbox</b> paling enak untuk <b>satu arah</b>: menu navigasi, deretan tombol, atau barisan kartu. <b>Grid</b> paling enak untuk <b>dua arah</b>: kerangka halaman, galeri foto, dan form berlabel.</p><p>Keduanya juga bisa dipakai bersama: pakai Grid untuk kerangka besar halaman, lalu Flexbox untuk merapikan isi di dalam tiap kartu. Anggap Grid sebagai peta kota dan Flexbox sebagai penataan furnitur di tiap rumah.</p>'
    },
    {
      type: 'tip',
      title: 'Bentangkan elemen sampai ujung kisi',
      text: 'Butuh elemen selebar kisi? Tulis <code>grid-column: 1 / -1</code> — artinya dari garis kolom pertama sampai garis terakhir, berapa pun jumlah kolommu. Lebih fleksibel daripada <code>span</code> kalau jumlah kolom sering berubah.'
    },
    {
      type: 'warn',
      title: 'Satu elemen, satu jenis display',
      text: 'Elemen hanya bisa punya satu <code>display</code>. Kalau kamu menimpa <code>display: flex</code> dengan <code>display: grid</code>, aturan flexbox pada elemen itu (seperti <code>flex-direction</code>) berhenti bekerja. Pilih salah satu sesuai kebutuhan utama elemen tersebut.'
    },
    {
      type: 'vocab',
      items: [
        ['Grid container', 'Elemen induk yang diberi <code>display: grid</code>.'],
        ['Grid item', 'Anak langsung dari grid container yang menempati satu atau beberapa petak.'],
        ['Track', 'Satu jalur kolom atau baris pada kisi.'],
        ['fr', 'Unit pecahan: membagi sisa ruang secara proporsional antar track.'],
        ['repeat()', 'Fungsi untuk menyingkat pola track berulang, misalnya <code>repeat(3, 1fr)</code>.'],
        ['gap', 'Jarak antar track, bisa ditulis sekali untuk kedua arah atau dua nilai (baris kolom).'],
        ['span', 'Jumlah track yang dibentangi oleh satu grid item.'],
        ['minmax()', 'Fungsi yang menetapkan batas minimum dan maksimum lebar sebuah track.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: susun galeri grid-mu',
      lang: 'html',
      hint: 'Ubah grid-template-columns menjadi 4 kolom, buat kartu pertama membentang dua kolom dengan grid-column: span 2, lalu coba ganti semua kolom ke repeat(auto-fit, minmax(200px, 1fr)). Klik Jalankan.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Latihan Grid</title>
  <style>
    .galeri {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .kartu {
      background: #E8F0FE;
      border: 2px solid #1572B6;
      border-radius: 10px;
      padding: 18px;
      text-align: center;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="galeri">
    <div class="kartu">A</div>
    <div class="kartu">B</div>
    <div class="kartu">C</div>
    <div class="kartu">D</div>
    <div class="kartu">E</div>
    <div class="kartu">F</div>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'display: grid mengaktifkan kisi dua dimensi (baris dan kolom).',
    'grid-template-columns / rows menentukan jejak kisi; gap memberi jarak antar petak.',
    'Unit fr membagi ruang secara adil; repeat() menyingkat pola berulang.',
    'grid-column: span N membentangkan elemen melewati beberapa kolom.',
    'auto-fit + minmax() menghasilkan kolom responsif tanpa @media; Flexbox untuk satu arah, Grid untuk dua arah.'
  ]
});

/* ---------- Pelajaran 3: Media Query & Responsive Web Design ---------- */
window.CSS_LESSONS.push({
  id: 'media-query-responsive',
  title: 'Media Query & Responsive Web Design',
  chapter: 'Layout Modern',
  duration: '11 menit',
  intro: [
    'Desain web yang bagus harus nyaman dilihat di ponsel, tablet, dan komputer. Rahasia utamanya ada dua: tag <code>&lt;meta name="viewport"&gt;</code> dan <b>media query</b>.',
    'Media query adalah aturan CSS yang hanya aktif saat kondisi tertentu terpenuhi — misalnya, "kalau layar lebih sempit dari 600 piksel, susun kartu jadi satu kolom".'
  ],
  objectives: [
    'Memahami fungsi meta viewport dan mengapa tag itu wajib ada',
    'Menulis sintaks @media dengan max-width dan min-width',
    'Memilih breakpoint logis seperti 600px dan 900px',
    'Menerapkan pendekatan mobile-first (min-width)',
    'Memakai satuan fleksibel (%, rem, vw) dan gambar responsif'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebelum <code>@media</code>, masukkan dulu tag ini di <b>&lt;head&gt;</b> setiap halaman: <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code>. Tanpanya, ponsel menganggap halamanmu selebar layar komputer dan mengecilkan seluruh tampilan agar muat.</p><p>Setelah itu, baru kita bicara <b>breakpoint</b>: titik lebar layar di mana tata letak berubah. Pilih breakpoint dari <i>kontenmu</i>, bukan dari daftar perangkat — misalnya <code>600px</code> saat kartu mulai sempit dan <code>900px</code> saat sidebar ingin disingkirkan.</p>'
    },
    {
      type: 'example',
      title: 'Mobile-first: satu kolom dulu, dua kolom di layar lebar',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mobile-first</title>
  <style>
    .daftar {
      display: grid;
      gap: 12px;
    }
    .kartu {
      background: #E6F4EA;
      border: 2px solid #188038;
      border-radius: 10px;
      padding: 14px;
    }
    @media (min-width: 600px) {
      .daftar {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <h1>Daftar Harga</h1>
  <div class="daftar">
    <div class="kartu">Paket Dasar — Rp 19.000</div>
    <div class="kartu">Paket Menengah — Rp 39.000</div>
    <div class="kartu">Paket Premium — Rp 79.000</div>
    <div class="kartu">Paket Bisnis — Rp 149.000</div>
  </div>
</body>
</html>`,
      explain: [
        'CSS dasar ditulis untuk layar <b>terkecil</b> (satu kolom) — itulah inti pendekatan mobile-first.',
        '<code>@media (min-width: 600px)</code> menambahkan dua kolom hanya ketika lebar layar minimal 600 piksel.',
        'Dengan mobile-first, layar kecil tidak perlu "membatalkan" aturan layar besar — kode jadi lebih ringan.'
      ]
    },
    {
      type: 'example',
      title: 'Pendekatan desktop-first dengan max-width',
      lang: 'css',
      output: true,
      code: `.galeri {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.kartu {
  background: #E8F0FE;
  border: 2px solid #1572B6;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  font-weight: bold;
}
@media (max-width: 900px) {
  .galeri { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .galeri { grid-template-columns: 1fr; }
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Max-width</title>
  <style>
__CODE__
  </style>
</head>
<body>
  <div class="galeri">
    <div class="kartu">1</div>
    <div class="kartu">2</div>
    <div class="kartu">3</div>
    <div class="kartu">4</div>
    <div class="kartu">5</div>
    <div class="kartu">6</div>
  </div>
  <p>Ubah lebar jendela pratinjau untuk melihat kartu berpindah kolom.</p>
</body>
</html>`,
      explain: [
        '<code>@media (max-width: 900px)</code> aktif hanya saat layar lebarnya 900 piksel atau kurang — kebalikan dari min-width.',
        'Breakpoint terkecil (600px) ditulis paling bawah agar aturannya menang saat beberapa kondisi terpenuhi sekaligus.',
        'Pola ini disebut desktop-first: desain untuk layar besar, lalu mengecil untuk layar kecil.'
      ]
    },
    {
      type: 'example',
      title: 'Kurangi media query dengan satuan fleksibel',
      lang: 'css',
      output: false,
      code: `.kolom {
  width: 48%;        /* relatif terhadap lebar induk */
  font-size: 1rem;   /* mengikuti ukuran font root, biasanya 16px */
  padding: 2vw;      /* relatif terhadap lebar layar (viewport) */
  max-width: 1200px; /* tetap, tapi tidak pernah lebih lebar dari ini */
}`,
      explain: [
        '<code>%</code> dan <code>vw</code> menyesuaikan diri dengan layar, jadi sering kali kamu tidak butuh @media hanya untuk mengubah lebar.',
        '<code>rem</code> menjaga konsistensi: mengubah ukuran font di elemen root sekaligus mengubah seluruh halaman secara proporsional.',
        'Kombinasi <code>width</code> fleksibel dengan <code>max-width</code> mencegah teks membentang terlalu lebar di layar besar.'
      ]
    },
    {
      type: 'example',
      title: 'Gambar responsif: jangan pernah meluber',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gambar Responsif</title>
  <style>
    .bingkai {
      width: 900px;
      max-width: 100%;
      height: auto;
      background: linear-gradient(135deg, #1572B6, #E34F26);
      border-radius: 12px;
      color: #fff;
      padding: 40px 20px;
      text-align: center;
      font-weight: bold;
    }
    p { color: #444; }
  </style>
</head>
<body>
  <div class="bingkai">Gambar 900px — menyusut saat layar sempit</div>
  <p>Elemen di atas berukuran 900px, tapi tidak pernah melebihi lebar layar.</p>
</body>
</html>`,
      explain: [
        '<code>max-width: 100%</code> mengunci lebar elemen agar tidak pernah melebihi induknya — trik paling penting untuk gambar responsif.',
        'Pada elemen <code>&lt;img&gt;</code> asli, tambahkan juga <code>height: auto</code> supaya proporsi gambar tidak rusak saat menyusut.'
      ]
    },
    {
      type: 'tip',
      title: 'Breakpoint yang logis, bukan asal pilih',
      text: 'Alih-alih menghafal ukuran tiap perangkat, perhatikan <i>kapan kontenmu rusak</i>. Kalau kartu mulai terlalu sempit di 600px, itulah breakpoint-mu. Kalau sidebar terasa sempit di 900px, itulah yang kedua. Sedikit breakpoint yang pas lebih baik daripada banyak breakpoint asal.'
    },
    {
      type: 'warn',
      title: 'Meta viewport bukan pilihan',
      text: 'Tanpa <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code>, media query bisa berperilaku aneh di ponsel karena browser melaporkan lebar layar yang salah (biasanya 980px). Selalu masukkan tag itu di setiap halaman, tepat di <b>&lt;head&gt;</b>.'
    },
    {
      type: 'vocab',
      items: [
        ['Media query', 'Aturan CSS bersyarat, misalnya <code>@media (max-width: 600px) { ... }</code>.'],
        ['Breakpoint', 'Titik lebar layar tempat tata letak berubah.'],
        ['Viewport', 'Area layar yang terlihat di perangkat; diatur lewat tag meta viewport.'],
        ['Mobile-first', 'Pendekatan menulis CSS untuk layar kecil dulu, lalu menambah lebar lewat <code>min-width</code>.'],
        ['Desktop-first', 'Kebalikannya: desain layar besar dulu, lalu menyempit lewat <code>max-width</code>.'],
        ['rem', 'Unit yang relatif terhadap ukuran font elemen root.'],
        ['vw', 'Unit yang relatif terhadap lebar viewport: 1vw = 1% lebar layar.'],
        ['Gambar responsif', 'Gambar yang menyusut mengikuti wadahnya, biasanya dengan <code>max-width: 100%</code>.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: buat tata letak responsif-mu',
      lang: 'html',
      hint: 'Tambahkan @media (min-width: 900px) agar daftar menjadi 3 kolom, lalu coba ubah ukuran font h1 memakai vw (misalnya font-size: 5vw). Klik Jalankan dan amati pratinjau.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Latihan Media Query</title>
  <style>
    body { font-family: system-ui, sans-serif; }
    .daftar {
      display: grid;
      gap: 12px;
    }
    .kartu {
      background: #FFF4E5;
      border: 2px solid #E34F26;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      font-weight: bold;
    }
    @media (min-width: 600px) {
      .daftar { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <h1>Galeri Latihan</h1>
  <div class="daftar">
    <div class="kartu">Foto 1</div>
    <div class="kartu">Foto 2</div>
    <div class="kartu">Foto 3</div>
    <div class="kartu">Foto 4</div>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'meta viewport wajib di setiap halaman agar ponsel membaca lebar layar dengan benar.',
    '@media (max-width: ...) aktif di layar sempit; @media (min-width: ...) aktif di layar lebar.',
    'Pilih breakpoint dari konten, misalnya 600px dan 900px.',
    'Mobile-first: tulis CSS layar kecil dulu, lalu tambahkan lebar dengan min-width.',
    'Satuan fleksibel (%, rem, vw) dan max-width: 100% mengurangi ketergantungan pada media query.'
  ]
});
