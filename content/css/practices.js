/* ============================================================
   Pelajaran CSS — Bab: Praktik Terbaik
   (topik info.md: "best praktis penulisan css" dan
    "css reset dan normalize")
   ============================================================ */
'use strict';

window.CSS_LESSONS = window.CSS_LESSONS || [];

window.CSS_LESSONS.push({
  id: 'best-praktis-penulisan-css',
  title: 'Best Praktis Penulisan CSS',
  chapter: 'Praktik Terbaik',
  duration: '6 menit',
  intro: [
    'CSS yang <b>rapi</b> adalah CSS yang masih bisa dibaca dan dimodifikasi bulan depan tanpa sakit kepala. Pelajaran ini membahas kebiasaan menulis CSS yang awet: dari penamaan kelas sampai performa.',
    'Fokusnya praktis: spesifisitas dan <code>!important</code>, prinsip <b>DRY</b>, urutan aturan, konvensi nama, komentar, dan animasi yang ringan.'
  ],
  objectives: [
    'Menerapkan DRY: tidak mengulang aturan yang sama',
    'Mengurutkan aturan: tata letak, lalu tipografi, lalu warna',
    'Memakai konvensi nama kelas BEM dengan kebab-case',
    'Menjelaskan kenapa selektor terlalu dalam dan !important dihindari',
    'Menulis animasi yang hemat performa'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Satu berkas CSS itu seperti dapur: kalau berantak, masakan (tampilan) jadi sulit dikontrol. Tiga prinsip dasar menulis CSS yang rapi:</p><ol><li><b>DRY</b> (jangan ulang diri) — aturan yang sama ditulis sekali saja, lalu dipakai lewat <b>kelas bersama</b>.</li><li><b>Urutan aturan</b> — kelompokkan deklarasi: <b>tata letak</b> (display, ukuran, posisi) &rarr; <b>tipografi</b> (font, jarak baris) &rarr; <b>warna &amp; latar</b>.</li><li><b>Konsistensi format</b> — indentasi dan spasi seragam di seluruh berkas, plus <b>komentar</b> untuk membagi berkas jadi bagian-bagian jelas.</li></ol><p>Untuk nama kelas, pakai <b>kebab-case</b> dengan format BEM ringkas: <code>block__element--modifier</code>, misalnya <code>kartu__judul--tebal</code>.</p>'
    },
    {
      type: 'example',
      title: 'Contoh rapi: kelas bersama, komentar pembagi, urutan aturan',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Produk</title>
  <style>
    /* ==== Komponen kartu ==== */
    .kartu {
      /* tata letak */
      max-width: 320px;
      padding: 16px;
      border-radius: 10px;
      /* tipografi */
      font-family: system-ui, sans-serif;
      /* warna & latar */
      background: #f7f9fc;
      border: 1px solid #dde3ea;
      color: #333;
    }

    .kartu__judul {
      margin: 0 0 8px;  /* tata letak */
      font-size: 20px;  /* tipografi */
      color: #1572B6;   /* warna */
    }

    .kartu__teks {
      margin: 0;
      font-size: 15px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="kartu">
    <h2 class="kartu__judul">Sepatu Lari</h2>
    <p class="kartu__teks">Ringan, empuk, dan awet untuk lari harianmu.</p>
  </div>
</body>
</html>`,
      explain: [
        'Kelas <code>.kartu</code> ditulis sekali; elemen anak memakai <code>kartu__judul</code> dan <code>kartu__teks</code> — itulah format BEM ringkas dengan <b>kebab-case</b>.',
        'Deklarasi diurutkan: tata letak dulu, lalu tipografi, lalu warna — properti jadi mudah dicari.',
        'Komentar <code>/* ==== ... ==== */</code> membagi berkas jadi bagian yang mudah diskor.',
        'Semua aturan pakai kelas, bukan selektor tag berlapis — spesifisitas rendah dan tidak bentrok.'
      ]
    },
    {
      type: 'example',
      title: 'Sebelum vs sesudah: berantak menjadi rapi',
      lang: 'css',
      output: false,
      code: `/* ===== SEBELUM: berantak ===== */
div div .item { color: red; }
.item { font-size: 14px; }
#item-1 { font-size: 14px; color: red; }
.item-2 { font-size: 14px; }

/* ===== SESUDAH: rapi (DRY) ===== */
.teks-kecil { font-size: 14px; }
.teks-merah { color: red; }

/* Pemakaian di HTML:
   <p class="teks-kecil teks-merah">...</p> */`,
      explain: [
        'Aturan <code>font-size: 14px</code> ditulis 3 kali di versi awal — di versi rapi cukup satu kelas bersama.',
        'Selektor <code>div div .item</code> terlalu dalam dan <b>over-qualified</b>; kelas tunggal jauh lebih ringan dibaca dan diproses.',
        'Gabungkan beberapa kelas di satu elemen (<code>class="teks-kecil teks-merah"</code>) alih-alih menduplikasi aturan.'
      ]
    },
    {
      type: 'tip',
      title: 'Spesifisitas: yang lebih spesifik menang',
      text: 'Browser menghitung "bobot" selektor: <code>id</code> &gt; <code>kelas</code> &gt; <code>tag</code>. Alih-alih menambah <code>!important</code>, perkecil konflik dengan kelas yang tepat sasaran. <code>!important</code> mematikan mekanisme cascading — sisakan hanya untuk keadaan darurat, misalnya menimpa gaya dari pustaka pihak ketiga.'
    },
    {
      type: 'warn',
      title: 'Jangan seluki terlalu dalam',
      text: 'Selektor seperti <code>body div.container ul li a</code> rapuh: ubah satu tag HTML dan aturannya mati. Sama halnya dengan <code>!important</code> — setelah dipakai, penimpaan berikutnya butuh <code>!important</code> yang lebih "penting". Batasi kedalaman selektor maksimal 2–3 level.'
    },
    {
      type: 'example',
      title: 'Animasi yang ramah performa',
      lang: 'css',
      output: true,
      code: `.kotak {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  background: #1572B6;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.kotak:hover {
  transform: translateY(-8px) scale(1.05);
  opacity: 0.9;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Animasi Ringan</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 24px;
    }
    __CODE__
  </style>
</head>
<body>
  <p>Arahkan kursor ke kotak biru:</p>
  <div class="kotak"></div>
</body>
</html>`,
      explain: [
        '<code>transform</code> dan <code>opacity</code> dijalankan oleh GPU — animasi terasa mulus tanpa membuat browser menghitung ulang tata letak (<i>reflow</i>).',
        'Hindari menganimasikan <code>width</code>, <code>height</code>, atau <code>margin</code> — properti itu memicu reflow yang mahal.',
        'Selektor mahal (misalnya <code>*</code> berlapis atau kualifikasi tag berlebihan) dihindari — kelas tunggal paling murah diproses browser.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['DRY', 'Prinsip "jangan mengulang diri": tulis aturan sekali, pakai berkali-kali lewat kelas bersama.'],
        ['Spesifisitas', 'Bobot selektor yang menentukan aturan mana yang menang saat terjadi konflik.'],
        ['!important', 'Deklarasi paksa yang mengabaikan cascading; sebaiknya dihindari.'],
        ['BEM', 'Block__Element--Modifier — konvensi penamaan kelas yang rapi dan memakai kebab-case.'],
        ['Over-qualified', 'Selektor yang menyertakan tag secara berlebihan, misalnya <code>div.kartu</code>.'],
        ['Reflow', 'Penghitungan ulang tata letak oleh browser; sebaiknya tidak dipicu oleh animasi.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: bersihkan kode ini!',
      lang: 'html',
      hint: 'Perpendek selektor berlapis jadi kelas tunggal (.kartu, .kartu__judul, .kartu__teks), hapus aturan yang berulang, dan urutkan deklarasi: tata letak, lalu tipografi, lalu warna. Klik "Jalankan" — tampilannya harus tetap sama.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Bersih-Bersih CSS</title>
  <style>
    /* CSS ini sengaja dibuat berantak. Tugasmu: rapikan! */
    div.wrap div.kartu {
      color: #333;
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 14px;
      font-family: system-ui, sans-serif;
      background: #f7f9fc;
      max-width: 300px;
    }
    div.wrap div.kartu h3 {
      color: #1572B6;
      font-size: 18px;
      margin: 0 0 6px;
    }
    div.wrap div.kartu p {
      color: #333;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }
    .lbl-biru {
      color: #1572B6;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="kartu">
      <h3>Judul Kartu</h3>
      <p>Paragraf isi kartu yang masih pakai selektor berlapis.</p>
      <span class="lbl-biru">Label biru</span>
    </div>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'DRY: satu aturan cukup ditulis sekali, pakai kelas bersama.',
    'Urutan aturan rapi: tata letak, lalu tipografi, lalu warna.',
    'Nama kelas kebab-case, format BEM ringkas: block__element--modifier.',
    'Komentar membagi berkas; selektor dangkal lebih awet daripada berlapis.',
    'Animasikan transform/opacity; hindari !important dan selektor mahal.'
  ]
});

window.CSS_LESSONS.push({
  id: 'css-reset-dan-normalize',
  title: 'CSS Reset & Normalize',
  chapter: 'Praktik Terbaik',
  duration: '6 menit',
  intro: [
    'Pernahkah kamu bertanya-tanya mengapa tampilan halaman sedikit berbeda di Chrome, Firefox, dan Safari? Setiap browser membawa <b>gaya bawaan</b> sendiri: margin <b>&lt;h1&gt;</b>, ukuran <b>&lt;button&gt;</b>, hingga jarak antarparagraf bisa beda-beda.',
    'Dua solusi populer: <b>reset</b> (mengosongkan hampir semua gaya bawaan) dan <b>normalize</b> (memperbaiki ketidakkonsistenan tanpa mengosongkan). Pilih yang sesuai kebutuhanmu.'
  ],
  objectives: [
    'Memahami mengapa gaya bawaan browser berbeda-beda',
    'Membedakan CSS reset dan normalize',
    'Menerapkan reset modern sederhana (box-sizing dan margin body)',
    'Menilai kapan reset diperlukan dan kapan tidak'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Setiap browser punya <b>stylesheet bawaan</b> (user agent stylesheet) yang mengatur tampilan elemen sebelum CSS-mu jalan. Karena dibuat oleh pihak berbeda, <b>&lt;h1&gt;</b> bisa lebih besar di satu browser, <b>&lt;button&gt;</b> lebih tebal di browser lain, dan seterusnya.</p><p>Akibatnya, halaman yang sama bisa terlihat sedikit berbeda di tiap browser. Di sinilah <b>reset</b> dan <b>normalize</b> berperan sebagai "pembersih awal" sebelum gaya desainmu sendiri.</p>'
    },
    {
      type: 'example',
      title: 'Reset modern sederhana yang bisa langsung dipakai',
      lang: 'css',
      output: true,
      code: `/* Reset modern yang ringan */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  line-height: 1.5;
}

img {
  max-width: 100%;
  display: block;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Reset Modern Sederhana</title>
  <style>
    __CODE__

    body {
      font-family: system-ui, sans-serif;
      padding: 24px;
    }
    h1 { color: #1572B6; }
  </style>
</head>
<body>
  <h1>Halo dengan Reset</h1>
  <p>Margin bawaan body sudah dikosongkan, tapi jarak antarbaris tetap nyaman.</p>
</body>
</html>`,
      explain: [
        '<code>box-sizing: border-box</code> membuat padding dan border ikut dihitung dalam lebar elemen — tata letak jadi lebih mudah diprediksi.',
        '<code>body { margin: 0; }</code> menghilangkan jarak putih di pinggir halaman yang besarnya beda-beda antar browser.',
        '<code>img { max-width: 100%; }</code> mencegah gambar membesar melewati wadahnya.',
        'Reset ini bisa langsung disalin ke proyek apa pun sebagai titik awal yang konsisten.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Reset</b> mengosongkan gaya bawaan hampir semua elemen — misalnya <code>* { margin: 0; padding: 0; }</code> — lalu kamu membangun dari nol. <b>Normalize</b> tidak mengosongkan: ia hanya memperbaiki ketidakkonsistenan, misalnya menyamakan ukuran <b>&lt;h1&gt;</b> atau membuat tombol mewarisi font halaman.</p><p>Reset memberi kebebasan penuh tapi butuh lebih banyak kode pengganti; normalize mempertahankan gaya yang berguna (misalnya huruf tebal pada judul) dan lebih ringan untuk kebanyakan proyek.</p>'
    },
    {
      type: 'example',
      title: 'Reset vs normalize berdampingan',
      lang: 'css',
      output: false,
      code: `/* RESET: mengosongkan */
* { margin: 0; padding: 0; }

/* NORMALIZE: memperbaiki tanpa mengosongkan */
html { line-height: 1.15; }
img { display: block; }        /* hilangkan celah di bawah gambar */
button { font: inherit; }      /* tombol ikut font halaman */
h1 { font-size: 2em; margin: 0.67em 0; }  /* konsisten, margin tetap ada */`,
      explain: [
        'Reset menghapus margin <b>&lt;h1&gt;</b> sepenuhnya; normalize memastikan ukuran <b>&lt;h1&gt;</b> sama di semua browser tanpa membuang marginnya.',
        '<code>button { font: inherit; }</code> adalah khas normalize: memperbaiki tombol yang tampil beda, bukan menghapus gayanya.',
        'Proyek modern sering memilih normalize (atau reset ringan) karena lebih sedikit kode pengganti yang harus ditulis.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan pakai, kapan tidak',
      text: 'Reset/normalize paling berguna untuk proyek dengan banyak halaman, komponen kompleks, atau target banyak browser. Untuk <b>proyek kecil</b> (satu halaman, latihan, demo) hal itu <b>tidak wajib</b> — cukup atur manual bagian yang mengganjal, misalnya <code>body { margin: 0; }</code>.'
    },
    {
      type: 'warn',
      title: 'Reset sembarangan bisa merusak',
      text: '<code>* { margin: 0; padding: 0; }</code> juga menghapus jarak pada formulir, daftar, dan heading — kamu harus mengembalikannya satu per satu. Reset total seperti ini cocok untuk desain yang benar-benar dari nol, bukan untuk sekadar "merapikan" tampilan.'
    },
    {
      type: 'vocab',
      items: [
        ['User agent stylesheet', 'Gaya bawaan yang dipakai browser sebelum CSS penulis halaman.'],
        ['Reset', 'Pendekatan mengosongkan gaya bawaan untuk membangun dari nol.'],
        ['Normalize', 'Pendekatan memperbaiki ketidakkonsistenan browser tanpa mengosongkan gaya.'],
        ['box-sizing: border-box', 'Model ukuran di mana padding dan border termasuk dalam lebar/tinggi elemen.'],
        ['Margin', 'Jarak di luar elemen; pada <code>body</code> sering dikosongkan oleh reset.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: rasakan bedanya reset!',
      lang: 'html',
      hint: 'Tambahkan *, *::before, *::after { box-sizing: border-box; } dan body { margin: 0; } di dalam &lt;style&gt;, lalu klik "Jalankan". Perhatikan jarak di pinggir halaman dan lebar total kotak biru.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Reset & Normalize</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 24px;
      background: #f2f2f2;
    }
    .kotak {
      width: 200px;
      padding: 20px;
      border: 4px solid #1572B6;
      background: white;
    }
    /* Tantangan: tambahkan reset modern di sini! */
  </style>
</head>
<body>
  <h1>Belum di-reset</h1>
  <p>Paragraf ini masih memakai margin bawaan browser.</p>
  <div class="kotak">Lebar 200px + padding + border</div>
</body>
</html>`
    }
  ],
  recap: [
    'Browser punya gaya bawaan berbeda — sumber perbedaan tampilan antar browser.',
    'Reset mengosongkan gaya bawaan; normalize memperbaikinya tanpa mengosongkan.',
    'Reset modern ringan: box-sizing: border-box di semua elemen dan margin: 0 pada body.',
    'Reset/normalize tidak wajib untuk proyek kecil.',
    'Reset agresif butuh banyak kode pengganti — pilih sesuai kebutuhan.'
  ]
});
