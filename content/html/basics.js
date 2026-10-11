/* ============================================================
   Pelajaran HTML — Bab 1: Pendahuluan & Dasar HTML (L1–L4)
   ============================================================ */
'use strict';

window.HTML_LESSONS = window.HTML_LESSONS || [];

window.HTML_LESSONS.push({
  id: 'pengenalan',
  title: 'Apa itu HTML?',
  chapter: 'Pendahuluan',
  duration: '5 menit',
  intro: [
    'Halaman web yang kamu buka setiap hari itu seperti sebuah rumah. <b>HTML</b> adalah kerangka bangunannya — menentukan mana dinding, mana jendela, mana pintu. <b>CSS</b> adalah cat, wallpaper, dan dekorasinya. Sedangkan <b>JavaScript</b> adalah listrik dan mesin yang membuat rumah itu "hidup".',
    '<b>HTML</b> (kependekan dari <b>HyperText Markup Language</b>) adalah bahasa <i>markah</i> (bukan bahasa pemrograman!) yang dipakai untuk menyusun <b>struktur</b> halaman web. Dengan HTML kita memberi tahu browser: "ini judul", "ini paragraf", "ini gambar", "ini tautan", dan seterusnya.'
  ],
  objectives: [
    'Memahami apa itu HTML dan perannya di web',
    'Mengetahui perbedaan HTML, CSS, dan JavaScript',
    'Mengenal cara browser menampilkan halaman HTML',
    'Membuat dokumen HTML pertama kamu'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bayangkan kamu membaca sebuah artikel di koran. Ada <b>judul besar</b>, ada <b>subjudul</b>, ada <b>paragraf</b>, ada <b>gambar</b>, dan ada <b>tautan</b>. HTML persis bekerja seperti itu — kamu "menandai" setiap bagian konten dengan tag supaya browser tahu bagaimana menyusun dan menampilkannya.</p><p>Saat kamu membuka sebuah situs, inilah yang sebenarnya terjadi:</p><ol><li>Browser mengambil file <b>.html</b> dari komputer atau internet.</li><li>Browser membaca setiap tag di dalamnya.</li><li>Browser menyusun struktur (disebut <b>DOM</b>) lalu menggambar halamannya.</li></ol>'
    },
    {
      type: 'example',
      title: 'Dokumen HTML pertama',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Halaman Pertamaku</title>
  </head>
  <body>
    <h1>Halo, Dunia! 👋</h1>
    <p>Ini adalah halaman web pertama saya.</p>
    <p>Saya sedang belajar <strong>HTML</strong>.</p>
  </body>
</html>`,
      explain: [
        '<b>&lt;!DOCTYPE html&gt;</b> memberi tahu browser bahwa ini dokumen HTML versi 5.',
        '<b>&lt;html&gt;</b> adalah pembungkus seluruh halaman.',
        '<b>&lt;head&gt;</b> berisi pengaturan halaman (judul tab, karakter, dll) — tidak terlihat di halaman.',
        '<b>&lt;body&gt;</b> berisi semua konten yang terlihat oleh pengunjung.',
        '<b>&lt;h1&gt;</b> = judul utama, <b>&lt;p&gt;</b> = paragraf, <b>&lt;strong&gt;</b> = teks tebal.'
      ]
    },
    {
      type: 'tip',
      title: 'Kabar baiknya',
      text: 'HTML pemula banget. Kamu tidak perlu hafal semua tag — cukup pahami pola dasarnya, sisanya akan diingat otomatis seiring latihan. Kamu bahkan bisa melihat kode HTML situs mana pun dengan klik kanan → "Lihat sumber halaman".'
    },
    {
      type: 'vocab',
      items: [
        ['Browser', 'Program untuk membuka halaman web, misalnya Chrome, Firefox, atau Safari.'],
        ['Tag', 'Tanda di dalam tanda kurung sudut, misalnya &lt;p&gt;, yang memberi makna pada konten.'],
        ['Elemen', 'Kesatuan tag pembuka, konten, dan tag penutup.'],
        ['Markup', 'Sistem penandaan teks agar punya makna/struktur.'],
        ['DOM', 'Struktur pohon yang dibentuk browser dari HTML untuk menggambar halaman.']
      ]
    }
  ],
  recap: [
    'HTML = HyperText Markup Language, bahasa markah untuk menyusun struktur halaman web.',
    'HTML menentukan struktur; CSS menentukan tampilan; JavaScript menentukan interaksi.',
    'Konten yang terlihat diletakkan di dalam &lt;body&gt;, pengaturan halaman di &lt;head&gt;.'
  ]
});

window.HTML_LESSONS.push({
  id: 'struktur-dasar',
  title: 'Struktur Dasar Dokumen HTML',
  chapter: 'Dasar HTML',
  duration: '7 menit',
  intro: [
    'Setiap dokumen HTML yang benar selalu mengikuti kerangka standar yang sama. Begitu kamu hafal kerangka ini, semua halaman web yang kamu buat akan terasa familier.',
    'Kerangka ini seperti formulir kosong: tiap bagian punya tempatnya sendiri. Mari kita bedah satu per satu.'
  ],
  objectives: [
    'Mengenal kerangka standar dokumen HTML',
    'Memahami peran &lt;head&gt; dan &lt;body&gt;',
    'Mengetahui isi penting dari bagian &lt;head&gt;'
  ],
  sections: [
    {
      type: 'example',
      title: 'Kerangka standar dokumen HTML',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Judul Tab Browser</title>
  </head>
  <body>
    <h1>Ini Terlihat di Halaman</h1>
    <p>Semua yang tampak oleh pengunjung ada di sini.</p>
  </body>
</html>`,
      explain: [
        '<b>&lt;html lang="id"&gt;</b> — atribut lang memberi tahu browser bahasa konten (id = Indonesia). Ini membantu pembaca layar dan mesin pencari.',
        '<b>&lt;meta charset="UTF-8"&gt;</b> — memastikan huruf Indonesia (á, é, tanda kutip, emoji) tampil dengan benar.',
        '<b>&lt;meta name="viewport"&gt;</b> — membuat halaman menyesuaikan lebar layar HP (desain responsif).',
        '<b>&lt;title&gt;</b> — judul yang muncul di tab browser dan di hasil pencarian Google.',
        'Perhatikan aturan emas: <b>konten di &lt;body&gt;, pengaturan di &lt;head&gt;</b>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Bagian <b>&lt;head&gt;</b> sering diremehkan, padahal ia menyimpan "otak pengaturan" halaman. Selain <code>meta charset</code> dan <code>viewport</code>, kamu juga bisa meletakkan <b>deskripsi halaman</b> untuk mesin pencari:</p>'
    },
    {
      type: 'example',
      title: 'Bekali &lt;head&gt;-mu dengan deskripsi',
      lang: 'html',
      output: false,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Resep Nasi Goreng Spesial</title>
  <meta name="description"
        content="Resep nasi goreng rumahan yang mudah, lengkap dengan bumbu dan langkah memasak.">
</head>
<body>
  <!-- Isi halaman di sini -->
</body>
</html>`,
      explain: [
        '<b>&lt;meta name="description"&gt;</b> — ringkasan halaman yang kadang muncul di bawah judul pada hasil pencarian Google.',
        '<b>&lt;!-- komentar --&gt;</b> — catatan untuk manusia (pengembang). Browser mengabaikannya.'
      ]
    },
    {
      type: 'warn',
      title: 'Hati-hati',
      text: 'Jangan pernah meletakkan konten (teks, gambar, tombol) di dalam &lt;head&gt; — isinya tidak akan terlihat oleh pengunjung. Semua konten tampilan harus di dalam &lt;body&gt;.'
    },
    {
      type: 'tip',
      title: 'Biasakan menulis rapi',
      text: 'Gunakan indentasi (spasi/tab) saat menulis tag bertingkat, misalnya body di-indent satu tingkat dari html. Kode yang rapi jauh lebih mudah dibaca dan dicari kesalahannya.'
    }
  ],
  recap: [
    'Kerangka standar: &lt;!DOCTYPE html&gt; → &lt;html&gt; → &lt;head&gt; + &lt;body&gt;.',
    '&lt;head&gt; berisi pengaturan: charset, viewport, title, dan meta description.',
    '&lt;body&gt; menampung semua konten yang terlihat.',
    'Selalu gunakan charset UTF-8 agar teks Indonesia tampil benar.'
  ]
});

window.HTML_LESSONS.push({
  id: 'tag-elemen-atribut',
  title: 'Tag, Elemen, dan Atribut',
  chapter: 'Dasar HTML',
  duration: '8 menit',
  intro: [
    'Tag, elemen, dan atribut adalah tiga kata kunci yang akan kamu pakai sepanjang belajar HTML. Mari pahami perbedaannya dengan contoh nyata.'
  ],
  objectives: [
    'Membedakan tag, elemen, dan atribut',
    'Mengenal elemen kosong (void element)',
    'Memakai atribut pada elemen'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebuah <b>elemen</b> biasanya terdiri dari tiga bagian:</p><ol><li><b>Tag pembuka</b> — misalnya <code>&lt;p&gt;</code></li><li><b>Konten</b> — teks atau elemen lain di dalamnya</li><li><b>Tag penutup</b> — misalnya <code>&lt;/p&gt;</code></li></ol><p>Bayangkan tag pembuka seperti <b>rakel tanda mulai</b> dan tag penutup seperti <b>rakel tanda selesai</b>.</p>'
    },
    {
      type: 'example',
      title: 'Bagian-bagian sebuah elemen',
      lang: 'html',
      output: true,
      code: `<p>Selamat datang di <em>dunia HTML</em>!</p>

<!-- Elemen di atas terdiri dari:
     tag pembuka <p>, konten teks,
     lalu tag penutup </p>. -->`,
      explain: [
        'Elemen <b>&lt;p&gt;</b> membungkus paragraf lengkap.',
        'Di dalamnya ada elemen <b>&lt;em&gt;</b> (penekanan, tampil miring) yang juga punya tag pembuka dan penutup sendiri.',
        'Elemen boleh disusun di dalam elemen lain — ini disebut <i>nested</i> (bersarang), seperti boneka Rusia.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sebagian elemen <b>tidak memiliki konten maupun tag penutup</b> — disebut <b>elemen kosong (void element)</b>. Mereka langsung "menutup sendiri". Contoh yang paling sering dipakai: <code>&lt;br&gt;</code> (baris baru), <code>&lt;hr&gt;</code> (garis pemisah), <code>&lt;img&gt;</code> (gambar), dan <code>&lt;input&gt;</code> (isian formulir).</p>'
    },
    {
      type: 'example',
      title: 'Elemen kosong (void elements)',
      lang: 'html',
      output: true,
      code: `<p>Baris pertama.<br>Baris kedua adalah baris baru.</p>
<hr>
<p>Garis pemisah horizontal di atas dibuat dengan tag hr.</p>`,
      explain: [
        '<b>&lt;br&gt;</b> memaksa pindah baris di dalam paragraf.',
        '<b>&lt;hr&gt;</b> menggambar garis horizontal sebagai pemisah bagian.'
      ]
    },
    {
      type: 'text',
      html: '<p>Terakhir, <b>atribut</b> adalah keterangan tambahan pada tag pembuka, ditulis dengan pola <code>nama="nilai"</code>. Atribut memberi tahu browser <i>bagaimana</i> sebuah elemen harus bekerja.</p>'
    },
    {
      type: 'example',
      title: 'Memakai atribut',
      lang: 'html',
      output: true,
      code: `<a href="https://www.w3.org/" target="_blank" title="Situs resmi W3C">
  Kunjungi situs W3C (terbuka di tab baru)
</a>

<img src="assets/sample.svg" alt="Contoh gambar SVG lokal"
     width="320" height="180" title="Ini keterangan saat kursor diarahkan">`,
      explain: [
        '<b>href</b> pada <code>&lt;a&gt;</code> menentukan alamat tujuan tautan.',
        '<b>target="_blank"</b> membuka tautan di tab baru.',
        '<b>src</b> pada <code>&lt;img&gt;</code> menunjuk ke lokasi gambar (di sini file lokal <code>assets/sample.svg</code>).',
        '<b>alt</b> adalah teks cadangan bila gambar gagal dimuat.',
        '<b>width/height</b> mengatur ukuran tampilan gambar.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: ubah-ubah teks dan atribut!',
      lang: 'html',
      hint: 'Ubah kata "dunia", ganti atribut alt pada gambar, atau tambah paragraf baru. Klik "Jalankan" untuk melihat hasilnya.',
      initial: `<h1>Latihan Tag &amp; Atribut</h1>
<p>Saya <strong>sedang belajar</strong> membuat elemen HTML.</p>
<a href="assets/sample.svg">Lihat gambar lokal kami</a>`
    }
  ],
  recap: [
    'Elemen = tag pembuka + konten + tag penutup.',
    'Elemen kosong (void): &lt;br&gt;, &lt;hr&gt;, &lt;img&gt;, &lt;input&gt; — tanpa tag penutup.',
    'Atribut ditulis nama="nilai" di dalam tag pembuka, misal href, src, alt.'
  ]
});

window.HTML_LESSONS.push({
  id: 'heading-paragraf',
  title: 'Heading dan Paragraf',
  chapter: 'Dasar HTML',
  duration: '7 menit',
  intro: [
    'Judul dan paragraf adalah fondasi hampir semua halaman web. Di HTML, judul dibuat dengan tag <b>heading</b> dan teks biasa dibuat dengan <b>paragraf</b>.'
  ],
  objectives: [
    'Menggunakan heading h1–h6 dengan urutan yang benar',
    'Menulis paragraf yang rapi',
    'Memakai &lt;br&gt; dan &lt;hr&gt; dengan tepat'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Heading tersedia dalam 6 tingkat: <code>&lt;h1&gt;</code> (terbesar/terpenting) hingga <code>&lt;h6&gt;</code> (terkecil). Ini bukan cuma soal ukuran huruf — heading membentuk <b>hirarki dokumen</b> yang dibaca oleh mesin pencari dan pembaca layar.</p>'
    },
    {
      type: 'example',
      title: 'Enam tingkat heading',
      lang: 'html',
      output: true,
      code: `<h1>Heading 1 — Judul Utama</h1>
<h2>Heading 2 — Sub Judul</h2>
<h3>Heading 3 — Bagian</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>`,
      explain: [
        'Pakai <b>&lt;h1&gt;</b> hanya sekali sebagai judul utama halaman.',
        'Berjenjang ke bawah: h2 untuk bab, h3 untuk sub-bab, dan seterusnya.',
        'Heading bukan untuk memperbesar huruf — untuk itu nanti gunakan CSS.'
      ]
    },
    {
      type: 'text',
      html: '<p>Tag <b>&lt;p&gt;</b> membuat paragraf. Yang menarik: di HTML, <b>enter berulang dan spasi berlebih diabaikan</b>. Browser menggabungkannya jadi satu spasi. Untuk pindah baris di tengah paragraf, gunakan <code>&lt;br&gt;</code>, dan untuk garis pemisah gunakan <code>&lt;hr&gt;</code>.</p>'
    },
    {
      type: 'example',
      title: 'Paragraf, baris baru, dan garis pemisah',
      lang: 'html',
      output: true,
      code: `<p>Ini paragraf pertama.
Setiap baris baru di kode ini tetap
menjadi satu paragraf yang sama.</p>
<p>Ini paragraf kedua.<br>Baris ini dipaksa pindah dengan tag br.</p>
<hr>
<p>Bagian di atas dipisah dengan garis pemisah (tag hr).</p>`,
      explain: [
        'Paragraf otomatis punya jarak antar satu sama lain.',
        '<b>&lt;br&gt;</b> = pindah baris paksa di dalam paragraf.',
        '<b>&lt;hr&gt;</b> = garis pemisah antar bagian.'
      ]
    },
    {
      type: 'tip',
      title: 'Rencanakan hierarki sebelum menulis',
      text: 'Tulis dulu garis besar halaman: satu h1, beberapa h2, lalu isi tiap bagian dengan paragraf. Halamanmu akan mudah dipahami — baik oleh manusia, pembaca layar, maupun Google.'
    },
    {
      type: 'live',
      title: 'Latihan: susun halaman profil singkat',
      lang: 'html',
      hint: 'Buat satu h1, dua h2, dan setidaknya tiga paragraf tentang dirimu atau hal favoritmu.',
      initial: `<h1>Profil Saya</h1>
<h2>Tentang</h2>
<p>Tulis beberapa kalimat tentang dirimu di sini.</p>
<h2>Hobi</h2>
<p>Sebutkan hobi-hobimu di sini.</p>`
    }
  ],
  recap: [
    'Heading: h1 (utama, satu per halaman) → h6 (terkecil).',
    'Paragraf dengan &lt;p&gt;; browser mengabaikan enter/spasi ganda di kode.',
    'Gunakan &lt;br&gt; untuk baris baru dan &lt;hr&gt; untuk garis pemisah.'
  ]
});