/* ============================================================
   Pelajaran HTML — Bab 4: Semantik, Media & Lanjutan (L11–L13)
   ============================================================ */
'use strict';

window.HTML_LESSONS = window.HTML_LESSONS || [];

window.HTML_LESSONS.push({
  id: 'semantik',
  title: 'HTML Semantik',
  chapter: 'Struktur Halaman',
  duration: '9 menit',
  intro: [
    'Kalau kamu melihat kode <b>&lt;div&gt;</b> bertumpuk-tumpuk tanpa makna, kamu tidak akan tahu bagian mana header dan mana footer. Elemen <b>semantik</b> menyelesaikan masalah ini: namanya sendiri sudah menjelaskan fungsinya.'
  ],
  objectives: [
    'Mengenal elemen semantik: header, nav, main, section, article, aside, footer',
    'Menyusun tata letak halaman yang bermakna',
    'Mengetahui mengapa semantik penting untuk SEO & aksesibilitas'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Elemen semantik memberi <b>makna</b> pada struktur halaman, tidak sekadar tampilan. Bandingkan <code>&lt;div class="menu"&gt;</code> dengan <code>&lt;nav&gt;</code> — keduanya bisa terlihat sama, tetapi <code>&lt;nav&gt;</code> memberi tahu browser, mesin pencari, dan pembaca layar: <i>"ini navigasi"</i>.</p>'
    },
    {
      type: 'example',
      title: 'Kerangka halaman dengan elemen semantik',
      lang: 'html',
      output: true,
      code: `<header>
  <h1>Blog Belajar Koding</h1>
  <nav>
    <a href="#">Beranda</a> |
    <a href="#">Tutorial</a> |
    <a href="#">Tentang</a>
  </nav>
</header>

<main>
  <article>
    <h2>Apa itu HTML Semantik?</h2>
    <p>Elemen semantik memberi makna pada struktur halaman…</p>
  </article>

  <section>
    <h2>Artikel Lainnya</h2>
    <p>Kumpulan tulisan menarik lainnya.</p>
  </section>

  <aside>
    <h3>Info Penulis</h3>
    <p>Ditulis oleh Tim Belajar Koding.</p>
  </aside>
</main>

<footer>
  <p>© 2026 Belajar Koding — semua tutorial gratis.</p>
</footer>`,
      explain: [
        '<b>&lt;header&gt;</b> — bagian kepala halaman/bagian (logo + judul).',
        '<b>&lt;nav&gt;</b> — kumpulan tautan navigasi utama.',
        '<b>&lt;main&gt;</b> — konten utama yang unik di halaman ini (hanya satu per halaman).',
        '<b>&lt;article&gt;</b> — konten mandiri (artikel, postingan blog).',
        '<b>&lt;section&gt;</b> — pengelompokan tematik di dalam halaman.',
        '<b>&lt;aside&gt;</b> — konten pelengkap/tepi (sidebar, info penulis).',
        '<b>&lt;footer&gt;</b> — bagian penutup halaman.'
      ]
    },
    {
      type: 'example',
      title: 'figure & time — semantik yang lebih halus',
      lang: 'html',
      output: true,
      code: `<figure>
  <img src="assets/sample.svg" alt="Ilustrasi belajar HTML" width="240" height="135">
  <figcaption>Gambar 1. Ilustrasi proses belajar HTML.</figcaption>
</figure>

<p>Artikel diterbitkan pada
  <time datetime="2026-10-10">10 Oktober 2026</time>.</p>`,
      explain: [
        '<b>&lt;figure&gt;</b> membungkus media beserta keterangannya <b>&lt;figcaption&gt;</b>.',
        '<b>&lt;time datetime="…"&gt;</b> menandai tanggal/waktu dalam format yang bisa dibaca mesin.'
      ]
    },
    {
      type: 'tip',
      title: 'Aturan praktis',
      text: 'Kalau sebuah elemen hanya <b>pembungkus untuk gaya</b>, pakai &lt;div&gt; atau &lt;span&gt;. Kalau ia <b>memiliki peran/makna</b> (judul grup, navigasi, artikel), gunakan elemen semantik yang sesuai.'
    },
    {
      type: 'warn',
      title: 'Hati-hati dengan &lt;main&gt;',
      text: 'Hanya boleh ada <b>satu</b> &lt;main&gt; per halaman. Letakkan konten unik di sana; jangan masukkan sidebar atau footer ke dalam &lt;main&gt;.'
    }
  ],
  recap: [
    'Elemen semantik: header, nav, main, section, article, aside, footer, figure, time.',
    '&lt;main&gt; hanya satu per halaman; &lt;div&gt; untuk pembungkus netral.',
    'Semantik membantu SEO, aksesibilitas, dan keterbacaan kode.'
  ]
});

window.HTML_LESSONS.push({
  id: 'multimedia',
  title: 'Audio dan Video',
  chapter: 'Multimedia',
  duration: '7 menit',
  intro: [
    'HTML bisa memutar audio dan video langsung di halaman tanpa plug-in tambahan. Cukup dengan tag <b>&lt;audio&gt;</b> dan <b>&lt;video&gt;</b>.'
  ],
  objectives: [
    'Memasang audio dengan &lt;audio&gt; dan atribut kontrolnya',
    'Memasang video dengan &lt;video&gt;',
    'Mengenal atribut controls, autoplay, loop, muted, dan poster'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tanpa atribut <b>controls</b>, pemutar media tidak akan menampilkan tombol apa pun — pengunjung tidak bisa memutar! Untuk pemanasan, contoh di bawah memakai file <code>assets/beep.wav</code> yang ada di folder aplikasi ini.</p>'
    },
    {
      type: 'example',
      title: 'Memutar audio (file lokal)',
      lang: 'html',
      output: true,
      code: `<p>Dengarkan bunyi contoh:</p>
<audio controls src="assets/beep.wav">
  Browser kamu tidak mendukung elemen audio.
</audio>

<p>Audio lain dengan fallback sumber:</p>
<audio controls>
  <source src="assets/beep.wav" type="audio/wav">
  Browser tidak mendukung file audio ini.
</audio>`,
      explain: [
        '<b>src</b> menunjuk ke file audio; teks di dalam tag muncul bila browser tidak mendukung.',
        'Tag <b>&lt;source&gt;</b> di dalam &lt;audio&gt; bisa berisi beberapa format — browser memakai yang pertama ia dukung.',
        'Atribut lain: <b>muted</b>, <b>loop</b>, dan <b>preload</b>.'
      ]
    },
    {
      type: 'example',
      title: 'Memutar video (contoh dengan file dari internet)',
      lang: 'html',
      output: false,
      code: `<video controls width="480" poster="assets/sample.svg">
  <source src="contoh.mp4" type="video/mp4">
  <source src="contoh.webm" type="video/webm">
  Browser kamu tidak mendukung elemen video.
</video>`,
      explain: [
        '<b>controls</b> menampilkan tombol play/volume/fullscreen; <b>poster</b> = gambar sebelum video diputar.',
        'Sediakan beberapa format (&lt;source&gt;) karena dukungan codec tiap browser berbeda.',
        'Hindari <b>autoplay</b> dengan suara — browser modern memblokirnya demi kenyamanan pengguna; kombinasikan dengan muted bila terpaksa.'
      ]
    },
    {
      type: 'warn',
      title: 'Soal ukuran file',
      text: 'File video besar bikin halaman lambat. Untuk produksi, kompres videomu dan pertimbangkan layanan streaming (YouTube/Vimeo) yang bisa disisipkan lewat &lt;iframe&gt;.'
    },
    {
      type: 'live',
      title: 'Latihan: pemutar audio',
      lang: 'html',
      hint: 'Pasang audio dengan controls, lalu tambahkan tombol play otomatis? (petunjuk: coba tambahkan atribut preload="none").',
      initial: `<h2>Pemutar Audio</h2>
<audio controls src="assets/beep.wav"></audio>`
    }
  ],
  recap: [
    '&lt;audio&gt; dan &lt;video&gt; memutar media langsung di halaman.',
    'Atribut controls wajib agar ada tombol pemutar untuk pengunjung.',
    'Gunakan &lt;source&gt; untuk beberapa format dan selalu sediakan teks fallback.'
  ]
});

window.HTML_LESSONS.push({
  id: 'metadata-lanjut',
  title: 'Metadata & Praktik Terbaik',
  chapter: 'Level Lanjut',
  duration: '8 menit',
  intro: [
    'Kamu sudah menguasai fondasi HTML. Sekarang mari rapikan: <b>metadata</b> yang benar (agar halaman tampil optimal) dan <b>kebiasaan menulis kode</b> yang sehat.'
  ],
  objectives: [
    'Menulis metadata lengkap (charset, viewport, description, favicon)',
    'Menerapkan gaya penulisan kode yang rapi',
    'Mengetahui cara memeriksa validitas HTML'
  ],
  sections: [
    {
      type: 'example',
      title: 'Rangkaian &lt;head&gt; yang lengkap',
      lang: 'html',
      output: false,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Belajar Koding — Tutorial HTML Interaktif</title>
  <meta name="description"
        content="Tutorial HTML interaktif berbahasa Indonesia, lengkap dengan latihan dan kuis.">
  <meta name="author" content="Tim Belajar Koding">

  <!-- Ikon tab browser (favicon) -->
  <link rel="icon" href="assets/logo.svg" type="image/svg+xml">

  <!-- CSS dan JavaScript dihubungkan di sini -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Konten halaman -->
</body>
</html>`,
      explain: [
        '<b>charset</b> dan <b>viewport</b> wajib ada di setiap halaman baru.',
        '<b>description</b> membantu mesin pencari menampilkan ringkasan halaman.',
        '<b>&lt;link rel="icon"&gt;</b> mengganti ikon tab browser dengan file logo.',
        '<b>&lt;link rel="stylesheet"&gt;</b> menyambungkan file CSS; <b>&lt;script&gt;</b> untuk JavaScript.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sebuah catatan jujur: <code>&lt;meta name="keywords"&gt;</code> <b>tidak lagi dipakai</b> oleh Google untuk peringkat, jadi tidak perlu diisi. Fokuslah pada konten yang bagus dan struktur HTML yang valid.</p>'
    },
    {
      type: 'example',
      title: 'Pola kode rapi vs berantakan',
      lang: 'html',
      output: true,
      code: `<h2>Versi rapi ✨</h2>
<div class="kartu">
  <h3>Kopi Susu</h3>
  <p><strong>Rp18.000</strong></p>
</div>

<h2>Versi berantakan (hindari!)</h2>
<div class=kartu><h3>Kopi Susu</h3><p><b>Rp18.000</b></p>
</div>`,
      explain: [
        'Indentasi bertingkat membuat struktur terbaca sekilas.',
        'Tulis atribut dengan tanda kutip: <code>class="kartu"</code>, bukan <code>class=kartu</code>.',
        'Gunakan huruf kecil untuk semua tag dan atribut.',
        'Kedua versi bekerja, tetapi versi rapi jauh lebih mudah dipelihara.'
      ]
    },
    {
      type: 'tip',
      title: 'Cek validitas HTML-mu',
      text: 'Kunjungi validator resmi W3C (validator.w3.org) dan tempel URL atau upload file HTML-mu. Ia akan menunjukkan tag yang salah tutup atau atribut yang keliru.'
    },
    {
      type: 'warn',
      title: 'Yang tidak boleh kamu lakukan',
      text: 'Jangan memakai tag yang sudah usang seperti &lt;font&gt;, &lt;center&gt;, atau atribut bgcolor — semuanya sudah digantikan oleh CSS. Jangan juga menulis tag dengan huruf besar: &lt;HTML&gt; tetap bisa jalan, tetapi konsistensi huruf kecil adalah standar.'
    },
    {
      type: 'live',
      title: 'Latihan terakhir: halaman lengkap',
      lang: 'html',
      hint: 'Susun halaman dengan header+nav, main berisi section, dan footer. Jangan lupa caption/detail kecil yang rapi.',
      initial: `<header>
  <h1>Situs Saya</h1>
</header>
<main>
  <section>
    <h2>Selamat Datang</h2>
    <p>Ini halaman latihan terakhir di materi HTML.</p>
  </section>
</main>
<footer>
  <p>© 2026 — dibuat dengan HTML</p>
</footer>`
    }
  ],
  recap: [
    'Head lengkap: charset, viewport, title, description, favicon, dan link CSS.',
    'Tulis kode rapi: indentasi, kutip atribut, huruf kecil, tag selalu ditutup.',
    'Periksa validitas dengan validator W3C agar halaman konsisten di semua browser.'
  ]
});