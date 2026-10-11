/* ============================================================
   Pelajaran CSS — Gaya & Efek
   (topik info.md: "pseudo class dan pseudo element",
    "transition dan animasi dasar", "box shadow dan text shadow",
    "css variable")
   ============================================================ */
'use strict';

window.CSS_LESSONS = window.CSS_LESSONS || [];

/* ---------- Pelajaran 1: Pseudo-class & Pseudo-element ---------- */
window.CSS_LESSONS.push({
  id: 'pseudo-class-dan-pseudo-element',
  title: 'Pseudo-class & Pseudo-element',
  chapter: 'Gaya & Efek',
  duration: '8 menit',
  intro: [
    'Pernahkah kamu perhatikan tautan yang berubah warna saat kursor menimpanya, atau paragraf yang huruf pertamanya tampil beda? Itulah kerja <b>pseudo-class</b> dan <b>pseudo-element</b>: CSS yang mengatur keadaan khusus atau bagian khusus dari sebuah elemen — tanpa perlu menambah class di HTML.',
    'Bayangkan elemen HTML itu seorang pemain: <b>pseudo-class</b> mengatur kostum pemain saat dalam kondisi tertentu (disentuh kursor, diketik, dikunjungi), sedangkan <b>pseudo-element</b> mengatur aksesori di bagian tertentu (sebelum isi, sesudah isi, baris pertama).'
  ],
  objectives: [
    'Membedakan pseudo-class dan pseudo-element',
    'Menjelaskan perbedaan satu titik dua (:) dan dua titik dua (::)',
    'Memakai :hover, :focus, :active, :visited, :first-child, :last-child, dan :nth-child()',
    'Menghias elemen dengan ::before, ::after, ::first-line, dan ::placeholder'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Pseudo-class</b> ditulis dengan <b>satu titik dua</b>, misalnya <code>a:hover</code>. Ia menjawab pertanyaan "elemen ini sedang dalam keadaan apa?". <b>Pseudo-element</b> ditulis dengan <b>dua titik dua</b>, misalnya <code>p::first-line</code>. Ia menjawab "bagian mana dari elemen ini yang diatur?".</p><p>Dua titik dua bukan sekadar gaya: ia dipakai agar pseudo-element tidak tertukar dengan pseudo-class. Browser lama masih mengenal <code>:before</code> (satu titik dua), tapi standar modern memakai <code>::before</code> — biasakan menulis dua titik dua.</p>'
    },
    {
      type: 'example',
      title: 'Empat kostum tautan: :visited, :hover, :active',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Keadaan Tautan</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    a {
      color: #1572B6;
      text-decoration: none;
      padding: 6px 10px;
      border-radius: 8px;
    }
    a:visited { color: #7A4DA3; }
    a:hover { background: #EAF4FD; }
    a:active { color: #E34F26; }
  </style>
</head>
<body>
  <p>Arahkan kursor (hover) ke tautan berikut, lalu klik dan tahan:</p>
  <p>
    <a href="#/">Beranda</a>
    <a href="#/tentang">Tentang</a>
    <a href="#/kontak">Kontak</a>
  </p>
</body>
</html>`,
      explain: [
        '<code>:hover</code> aktif saat kursor menimpa elemen — ini pseudo-class karena menggambarkan <i>keadaan</i> elemen.',
        '<code>:visited</code> hanya berlaku untuk tautan yang sudah pernah dikunjungi browser; <code>:active</code> aktif saat tombol mouse sedang ditekan.',
        'Urutan penulisan yang aman adalah :link, :visited, :hover, :active (disingkat LVHA) agar gaya tidak saling menimpa.',
        'Semua aturan ini memakai satu titik dua karena semuanya pseudo-class, bukan pseudo-element.'
      ]
    },
    {
      type: 'example',
      title: 'Dekorasi kartu dengan ::before dan ::after',
      lang: 'css',
      output: true,
      code: `.kartu {
  position: relative;
  max-width: 320px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-family: system-ui, sans-serif;
}
.kartu::before {
  content: "BARU";
  position: absolute;
  top: -12px;
  left: 16px;
  background: #E34F26;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}
.kartu::after {
  content: "";
  display: block;
  margin-top: 12px;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #1572B6, #7A4DA3);
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dekorasi ::before & ::after</title>
  <style>
__CODE__
  </style>
</head>
<body>
  <div class="kartu">
    <b>Kartu Promo</b>
    <p>Lengkapi profilmu hari ini untuk mendapatkan hadiah.</p>
  </div>
</body>
</html>`,
      explain: [
        '<code>::before</code> menyisipkan konten <i>sebelum</i> isi elemen dan <code>::after</code> <i>sesudahnya</i> — keduanya wajib punya properti <code>content</code>.',
        'Di contoh ini <code>::before</code> membuat lencana "BARU" yang menempel di sudut kartu (bantu <code>position: absolute</code>).',
        '<code>::after</code> dipakai untuk menggambar garis dekorasi di bawah kartu, tanpa menambah elemen <code>&lt;div&gt;</code> baru di HTML.',
        'Pseudo-element ditulis dengan dua titik dua (<code>::</code>) supaya tidak bingung dengan pseudo-class satu titik dua (<code>:</code>).'
      ]
    },
    {
      type: 'text',
      html: '<p>Ada pseudo-class yang memilih elemen berdasarkan <b>posisi</b>: <code>:first-child</code> (elemen pertama di antara saudara-saudaranya), <code>:last-child</code> (terakhir), dan <code>:nth-child()</code> (elemen ke-n, misal <code>:nth-child(even)</code> untuk bernomor genap). Pseudo-class juga bisa <b>dikombinasikan</b> dengan selektor lain: <code>a:hover</code> berarti "tautan yang sedang di-hover", dan <code>button:focus</code> berarti "tombol yang sedang difokuskan".</p><p><code>:focus</code> sangat penting untuk aksesibilitas: pengguna keyboard berpindah antar elemen dengan tombol Tab, dan <code>:focus</code> adalah penanda visual mereka. Jangan pernah menghilangkan garis fokus tanpa menggantinya dengan gaya lain.</p>'
    },
    {
      type: 'example',
      title: 'Daftar zebra dengan :first-child, :last-child, :nth-child()',
      lang: 'css',
      output: true,
      code: `ul.daftar {
  list-style: none;
  padding: 0;
  max-width: 340px;
  font-family: system-ui, sans-serif;
}
ul.daftar li {
  padding: 10px 14px;
  border-bottom: 1px solid #eeeeee;
}
ul.daftar li:first-child {
  border-radius: 10px 10px 0 0;
  background: #1572B6;
  color: #ffffff;
  font-weight: 700;
}
ul.daftar li:last-child {
  border-radius: 0 0 10px 10px;
  border-bottom: none;
}
ul.daftar li:nth-child(even) {
  background: #F3F7FB;
}
ul.daftar li:hover {
  background: #FDEBDD;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Selektor Struktural</title>
  <style>
__CODE__
  </style>
</head>
<body>
  <ul class="daftar">
    <li>Minggu ini: belanja bahan makanan</li>
    <li>Senin: olahraga pagi</li>
    <li>Selasa: rapat tim</li>
    <li>Rabu: nonton tutorial CSS</li>
    <li>Kamis: belanja bahan makanan</li>
    <li>Jumat: istirahat</li>
  </ul>
</body>
</html>`,
      explain: [
        '<code>:first-child</code> dan <code>:last-child</code> memilih elemen yang pertama dan terakhir di antara saudara-saudaranya — di sini dipakai untuk membulatkan sudut daftar.',
        '<code>:nth-child(even)</code> memilih elemen bernomor genap, menghasilkan daftar zebra yang mudah dibaca baris per baris.',
        '<code>:hover</code> di akhir mengubah latar baris yang disentuh kursor: beberapa pseudo-class boleh dipakai pada selektor yang berbeda-beda untuk elemen yang sama.',
        'Karena baris pertama sudah biru, aturan <code>:nth-child(even)</code> tidak mengubahnya — nomor 1 termasuk ganjil.'
      ]
    },
    {
      type: 'tip',
      title: 'Jangan lupa ::first-line dan ::placeholder',
      text: '<code>::first-line</code> mengatur baris pertama paragraf (misalnya <code>p::first-line { font-weight: 700; }</code>), dan <code>::placeholder</code> mengatur warna teks isian formulir (misalnya <code>input::placeholder { color: #999; }</code>). Catatan: hanya sebagian kecil properti (seperti <code>font</code>, <code>color</code>, dan <code>background</code>) yang berlaku untuk <code>::first-line</code>.'
    },
    {
      type: 'warn',
      title: 'Satu titik dua vs dua titik dua — dan urutan tautan',
      text: 'Untuk pseudo-element selalu pakai dua titik dua (<code>::before</code>, <code>::after</code>); bentuk satu titik dua (<code>:before</code>) hanya untuk kompatibilitas lama. Untuk tautan, atur urutan <code>:link → :visited → :hover → :active</code>: kalau <code>:hover</code> ditulis sebelum <code>:visited</code>, gaya hover bisa ditutupi oleh gaya tautan yang sudah dikunjungi.'
    },
    {
      type: 'vocab',
      items: [
        ['Pseudo-class', 'Selektor yang mengatur elemen dalam keadaan tertentu, misalnya <code>:hover</code> dan <code>:focus</code>.'],
        ['Pseudo-element', 'Selektor yang mengatur bagian tertentu dari elemen, misalnya <code>::before</code> dan <code>::first-line</code>.'],
        [':hover', 'Aktif saat kursor menimpa elemen.'],
        [':focus', 'Aktif saat elemen sedang dipilih, misalnya kolom isian yang diketik.'],
        [':active', 'Aktif saat elemen sedang ditekan.'],
        [':visited', 'Khusus untuk tautan yang sudah pernah dikunjungi.'],
        [':nth-child()', 'Memilih elemen berdasarkan urutan, misalnya <code>nth-child(2n)</code> berarti elemen genap.'],
        ['content', 'Properti wajib untuk <code>::before</code> dan <code>::after</code> — isi konten yang disisipkan.'],
        ['LVHA', 'Urutan aman aturan tautan: Link, Visited, Hover, Active.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: hias daftar tugasmu',
      lang: 'html',
      hint: 'Tambahkan ::before berisi emoji (misalnya "✅ ") pada tiap li, ubah nth-child(even) menjadi nth-child(odd), dan ubah gaya input saat :focus. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Pseudo-class & Pseudo-element</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    ul { list-style: none; padding: 0; max-width: 320px; }
    li {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
      margin-bottom: 6px;
      border-radius: 8px;
    }
    li:hover { background: #FDEBDD; }
    input:focus { outline: 2px solid #1572B6; }
  </style>
</head>
<body>
  <h2>Daftar Belanja</h2>
  <ul>
    <li>Telur</li>
    <li>Roti</li>
    <li>Susu</li>
  </ul>
  <input type="text" placeholder="Ketik sesuatu lalu fokus...">
</body>
</html>`
    }
  ],
  recap: [
    'Pseudo-class (satu titik dua) mengatur keadaan elemen; pseudo-element (dua titik dua) mengatur bagian elemen.',
    'Pseudo-class umum: :hover, :focus, :active, :visited, :first-child, :last-child, :nth-child().',
    'Pseudo-element umum: ::before, ::after, ::first-line, ::placeholder — ::before/::after wajib punya content.',
    'Kombinasi seperti a:hover atau button:focus menargetkan elemen dalam keadaan tertentu.',
    'Urutan aturan tautan yang aman: :link → :visited → :hover → :active (LVHA).'
  ]
});

/* ---------- Pelajaran 2: Transition & Animasi Dasar ---------- */
window.CSS_LESSONS.push({
  id: 'transition-dan-animasi-dasar',
  title: 'Transition & Animasi Dasar',
  chapter: 'Gaya & Efek',
  duration: '8 menit',
  intro: [
    'Pernah lihat tombol yang warnanya berubah mulus saat kursor menimpanya? Itu namanya <b>transition</b>: CSS yang mengubah properti secara perlahan, bukan langsung berpindah. Sementara <b>animasi</b> dengan <code>@keyframes</code> membuat elemen bergerak mengikuti adegan yang kita tulis sendiri — dari titik A ke B, lalu C, dan seterusnya.',
    'Analognya: transition seperti pintu otomatis yang meluncur pelan saat dibuka, sedangkan animasi seperti boneka wayang yang bergerak mengikuti naskah. Keduanya membuat tampilan terasa hidup, asal tidak berlebihan.'
  ],
  objectives: [
    'Menulis transition lengkap: property, duration, timing-function, dan delay',
    'Memakai shorthand transition pada pemicu :hover',
    'Membuat @keyframes dan mengaturnya dengan animation-name, duration, iteration-count, direction',
    'Memakai shorthand animation',
    'Menjelaskan mengapa prefers-reduced-motion penting'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Transition</b> mengubah sebuah properti <i>secara halus</i> saat nilainya berubah — biasanya karena <code>:hover</code> atau <code>:focus</code>. Tanpa transition, perubahan terjadi seketika; dengan transition, perubahan "meluncur" selama durasi yang kamu tentukan.</p><p>Transition cocok untuk perubahan sederhana (satu keadaan ke keadaan lain). Untuk gerakan berulang atau bertahap — misalnya bola memantul atau teks yang muncul berkedip — pakai <b>animasi</b> dengan <code>@keyframes</code>.</p>'
    },
    {
      type: 'example',
      title: 'Tombol yang melayang saat di-hover',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tombol dengan Transition</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    .tombol {
      background: #1572B6;
      color: #ffffff;
      border: none;
      padding: 12px 22px;
      font-size: 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: background-color 0.3s ease, transform 0.2s ease;
    }
    .tombol:hover {
      background: #0E5C93;
      transform: translateY(-3px);
    }
    .tombol:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <p>Arahkan kursor ke tombol, lalu klik dan tahan:</p>
  <button class="tombol">Arahkan ke sini</button>
</body>
</html>`,
      explain: [
        '<code>transition</code> ditulis sebagai <b>shorthand</b>: properti, durasi, lalu timing-function — di sini <code>background-color 0.3s ease</code> dan <code>transform 0.2s ease</code>.',
        'Pemicunya adalah <code>:hover</code>: saat kursor masuk, warna dan posisi berubah pelan; saat kursor keluar, keduanya kembali pelan juga.',
        '<code>transform: translateY(-3px)</code> menggeser tombol ke atas 3 piksel, menciptakan kesan "melayang".',
        '<code>ease</code> membuat gerakan dimulai dan diakhiri dengan kecepatan yang berubah-ubah, terasa lebih natural daripada <code>linear</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Secara panjang, transition punya empat properti: <code>transition-property</code> (properti mana yang diubah), <code>transition-duration</code> (berapa lama), <code>transition-timing-function</code> (kecepatannya: <code>ease</code>, <code>linear</code>, <code>ease-in-out</code>, dan lainnya), serta <code>transition-delay</code> (jeda sebelum mulai). Bentuk panjangnya:</p><p><code>transition: transform 0.25s ease-in-out 0.1s;</code> — urutannya adalah properti, durasi, timing-function, lalu delay.</p>'
    },
    {
      type: 'example',
      title: 'Kartu terangkat: shorthand transition',
      lang: 'css',
      output: true,
      code: `.kartu {
  max-width: 300px;
  padding: 18px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-family: system-ui, sans-serif;
  transition: transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out;
}
.kartu:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Terangkat</title>
  <style>
__CODE__
  </style>
</head>
<body style="padding:32px">
  <div class="kartu">
    <b>Kartu Produk</b>
    <p>Hover kartu ini — ia terangkat dan bayangannya membesar.</p>
  </div>
</body>
</html>`,
      explain: [
        '<code>transition-property</code> (di sini <code>transform</code> dan <code>box-shadow</code>) mengatakan properti mana yang diubah halus; properti lain tetap berubah seketika.',
        '<code>ease-in-out</code> membuat gerakan mulai dan berakhir pelan, cocok untuk efek "terangkat" yang lembut.',
        'Beberapa properti dipisahkan koma dalam satu shorthand transition.',
        'Durasi 0.25 detik terasa responsif; lebih dari 0.5 detik biasanya terasa lambat untuk interaksi kecil.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Animasi</b> dibangun dari dua bagian: <code>@keyframes</code> — "naskah" yang menulis keadaan di titik-titik persentase (0%, 50%, 100%, atau <code>from</code>/<code>to</code>) — dan properti <code>animation-*</code> yang menjalankannya: <code>animation-name</code>, <code>animation-duration</code>, <code>animation-iteration-count</code> (berapa kali diulang, <code>infinite</code> untuk terus-menerus), dan <code>animation-direction</code> (<code>alternate</code> untuk bolak-balik).</p><p>Shorthand-nya: <code>animation: nama durasi timing-function delay iteration-count direction;</code>. Misalnya <code>animation: denyut 1.2s ease-in-out infinite;</code> menjalankan naskah "denyut" selama 1,2 detik, berulang selamanya.</p>'
    },
    {
      type: 'example',
      title: 'Animasi @keyframes: denyut dan meluncur',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Animasi @keyframes</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    .denyut {
      display: inline-block;
      background: #E34F26;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 999px;
      animation: denyut 1.2s ease-in-out infinite;
    }
    @keyframes denyut {
      0% { transform: scale(1); }
      50% { transform: scale(1.12); }
      100% { transform: scale(1); }
    }
    .slide {
      margin-top: 18px;
      background: #1572B6;
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 10px;
      animation: masuk 0.9s ease-out 1;
    }
    @keyframes masuk {
      from { transform: translateX(-120px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  </style>
</head>
<body>
  <span class="denyut">Notifikasi baru!</span>
  <div class="slide">Saya meluncur dari kiri</div>
</body>
</html>`,
      explain: [
        '<code>@keyframes denyut</code> menulis naskah: di 0% ukuran normal, di 50% membesar 12%, di 100% kembali normal — jadi lencana berdenyut.',
        '<code>animation: denyut 1.2s ease-in-out infinite</code> adalah shorthand untuk animation-name, animation-duration, animation-timing-function, dan animation-iteration-count.',
        'Naskah <code>masuk</code> memakai <code>from</code> dan <code>to</code> (sama artinya dengan 0% dan 100%) untuk meluncur dari kiri sambil memudar.',
        'Iterasi <code>1</code> berarti animasi jalan sekali; ganti dengan <code>infinite</code> atau <code>alternate</code> untuk efek lain.'
      ]
    },
    {
      type: 'warn',
      title: 'Hormati prefers-reduced-motion',
      text: 'Sebagian orang sensitif terhadap gerakan (misalnya penderita vertigo). Sediakan jalur aman dengan media query: <code>@media (prefers-reduced-motion: reduce) { * { animation: none; transition: none; } }</code>. Begitu pengguna mengaktifkan "kurangi gerakan" di sistemnya, situsmu otomatis tenang. Ini bagian dari aksesibilitas, bukan pilihan.'
    },
    {
      type: 'tip',
      title: 'Aturan praktis durasi',
      text: 'Untuk interaksi kecil (tombol, hover), pakai durasi 200–400 milidetik. Pakai <code>ease-in-out</code> untuk gerakan yang masuk dan <code>linear</code> untuk hal seperti progress bar. Animasi dekoratif sebaiknya tidak lebih dari sekitar 500 ms agar tidak mengganggu.'
    },
    {
      type: 'live',
      title: 'Coba sendiri: buat bola meluncur',
      lang: 'html',
      hint: 'Tambahkan keyframe 50% yang menggeser bola ke bawah (top: 120px), ganti animation-direction alternate menjadi 2, dan ubah durasi jadi 3s. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Animasi</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; }
    .bola {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #E34F26;
      position: relative;
      animation: meluncur 1.5s ease-in-out infinite alternate;
    }
    @keyframes meluncur {
      from { left: 0; }
      to { left: 240px; }
    }
  </style>
</head>
<body>
  <div class="bola"></div>
  <p>Ubah durasi, timing-function, atau tambahkan keyframe 50%!</p>
</body>
</html>`
    }
  ],
  recap: [
    'Transition mengubah properti secara halus saat keadaan berubah (biasanya karena :hover).',
    'Komponen transition: property, duration, timing-function (ease, linear, ease-in-out), dan delay.',
    'Shorthand transition: transition: properti durasi timing-function delay;',
    '@keyframes menulis naskah gerakan; animation-name/duration/iteration-count/direction menjalankannya.',
    'Selalu sediakan @media (prefers-reduced-motion: reduce) demi aksesibilitas.'
  ]
});

/* ---------- Pelajaran 3: Box Shadow & Text Shadow ---------- */
window.CSS_LESSONS.push({
  id: 'box-shadow-dan-text-shadow',
  title: 'Box Shadow & Text Shadow',
  chapter: 'Gaya & Efek',
  duration: '7 menit',
  intro: [
    'Bayangan memberi kesan kedalaman: kartu yang seolah melayang di atas halaman, atau judul yang bercahaya. CSS punya dua properti untuk itu: <b>box-shadow</b> untuk kotak sebuah elemen dan <b>text-shadow</b> untuk teks.',
    'Seperti lampu di ruangan: arah dan jarak bayangan menentukan kesan objek — dekat dan tajam terasa ringkas, jauh dan lembut terasa mengambang.'
  ],
  objectives: [
    'Menulis box-shadow: offset-x offset-y blur spread color',
    'Membedakan bayangan luar dan bayangan inset',
    'Membuat bayangan bertingkat untuk kesan realistis',
    'Memakai text-shadow untuk judul dan teks dekoratif',
    'Menilai kapan bayangan sebaiknya tidak dipakai'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>box-shadow</b> ditulis berurutan: <code>offset-x offset-y blur spread warna</code>. <code>offset-x</code> menggeser bayangan ke kanan (boleh negatif), <code>offset-y</code> ke bawah, <code>blur</code> membuat tepi lembut, dan <code>spread</code> memperluas atau mempersempit ukuran bayangan. Contoh: <code>box-shadow: 4px 6px 12px 0 rgba(0,0,0,0.15);</code></p><p><b>text-shadow</b> memakai urutan yang sama, hanya tanpa <code>spread</code>: <code>text-shadow: 2px 2px 4px rgba(0,0,0,0.3);</code></p>'
    },
    {
      type: 'example',
      title: 'Kartu melayang dan tombol inset',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu & Tombol Bernaung</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 28px; background: #F6F8FA; }
    .kartu {
      max-width: 300px;
      padding: 20px;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }
    .tombol {
      margin-top: 14px;
      padding: 10px 18px;
      border: none;
      border-radius: 8px;
      background: #1572B6;
      color: #ffffff;
      font-size: 15px;
      cursor: pointer;
      box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.25);
    }
  </style>
</head>
<body>
  <div class="kartu">
    <b>Paket Premium</b>
    <p>Kartu ini seolah melayang di atas latar abu.</p>
    <button class="tombol">Sisipkan</button>
  </div>
</body>
</html>`,
      explain: [
        'Bayangan kartu: <code>0</code> piksel ke samping, <code>6</code> piksel ke bawah, <code>blur 16</code> — kesan "melayang" yang ringan.',
        'Warna <code>rgba(0,0,0,0.12)</code> adalah hitam dengan transparansi 12%; bayangan jadi lebih halus daripada hitam pekat.',
        'Tombol memakai kata kunci <code>inset</code>: bayangan muncul di <i>dalam</i> elemen, menciptakan kesan tepi yang tertekan.',
        'Tanpa spread (nilai keempat), bayangan mengikuti ukuran elemen aslinya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kata kunci <b>inset</b> membalik arah bayangan ke dalam elemen. Sementara <b>spread</b> (nilai keempat) memperluas bayangan tanpa mengaburkannya: <code>box-shadow: 0 0 0 4px rgba(21,114,182,0.3);</code> sering dipakai untuk membuat "cincin fokus" di sekeliling elemen yang aktif.</p>'
    },
    {
      type: 'example',
      title: 'Bayangan bertingkat: kesan kardus premium',
      lang: 'css',
      output: true,
      code: `.kartu-mewah {
  max-width: 320px;
  padding: 22px;
  background: #ffffff;
  border-radius: 16px;
  font-family: system-ui, sans-serif;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 12px 24px rgba(0, 0, 0, 0.10),
    0 32px 64px rgba(0, 0, 0, 0.06);
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bayangan Bertingkat</title>
  <style>
__CODE__
  </style>
</head>
<body style="padding:36px; background:#F6F8FA">
  <div class="kartu-mewah">
    <b>Kesan Melayang</b>
    <p>Tiga lapisan bayangan kecil, sedang, dan besar meniru cahaya sungguhan.</p>
  </div>
</body>
</html>`,
      explain: [
        'Beberapa bayangan dipisahkan dengan koma: lapisan pertama terlihat paling atas, lapisan terakhir paling bawah.',
        'Lapisan kecil (blur pendek) memberi detail tajam di dekat kartu; lapisan besar (blur panjang) memberi kesan lingkungan sekitar.',
        'Trik ini meniru dunia nyata: benda yang terangkat punya bayangan kontak yang tajam <i>dan</i> bayangan jauh yang lembut.',
        'Perhatikan transparansi tiap lapisan dibuat kecil (6–10%) agar hasilnya tidak seperti tinta hitam.'
      ]
    },
    {
      type: 'example',
      title: 'Judul neon dan teks timbul dengan text-shadow',
      lang: 'css',
      output: true,
      code: `.judul {
  font-family: Georgia, serif;
  font-size: 44px;
  color: #ffffff;
  background: #101828;
  display: inline-block;
  padding: 10px 18px;
  border-radius: 10px;
  text-shadow:
    0 0 6px #7A4DA3,
    0 0 18px #7A4DA3;
}
.kredit {
  font-family: system-ui, sans-serif;
  font-size: 14px;
  color: #374151;
  text-shadow: 1px 1px 0 #ffffff;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Text Shadow</title>
  <style>
__CODE__
  </style>
</head>
<body style="padding:36px">
  <div class="judul">NEON</div>
  <p class="kredit">Teks ini punya bayangan putih tipis agar terbaca di latar ramai.</p>
</body>
</html>`,
      explain: [
        '<code>text-shadow</code> memakai urutan yang sama dengan box-shadow — offset-x, offset-y, blur, warna — tetapi tanpa spread.',
        'Dua lapisan glow ungu dengan blur berbeda (6px dan 18px) menghasilkan efek neon yang menyala.',
        'Kredit memakai offset <code>1px 1px 0</code> tanpa blur untuk kesan timbul ringan (emboss) yang meningkatkan keterbacaan.',
        'Offset <code>0 0</code> menaruh cahaya tepat di sekeliling teks — kunci efek glow.'
      ]
    },
    {
      type: 'tip',
      title: 'Mainkan arah cahaya',
      text: 'Nilai offset boleh negatif: <code>-4px 4px</code> menaruh bayangan ke kiri bawah, dan <code>4px -4px</code> ke kanan atas. Konsistenlah — bayangan di seluruh halaman sebaiknya mengarah ke satu sisi yang sama, seperti cahaya matahari dari satu arah.'
    },
    {
      type: 'warn',
      title: 'Kapan TIDAK memakai bayangan',
      text: 'Bayangan besar dengan blur lebar memakan tenaga GPU, terabila ada ratusan elemen atau elemen yang dianimasikan — halaman bisa berat di perangkat lama. Selain itu, jangan pakai bayangan sebagai satu-satunya petunjuk penting: pengguna dengan kontras rendah mungkin tidak melihatnya. Selalu sediakan cara lain (garis tepi, teks, ikon) untuk menyampaikan informasi.'
    },
    {
      type: 'live',
      title: 'Coba sendiri: naikkan kartumu ke level berikutnya',
      lang: 'html',
      hint: 'Tambahkan lapisan bayangan kedua pada .kartu (pisahkan dengan koma), buat aturan .kartu:hover yang menggeser bayangan ke bawah, dan beri text-shadow pada h2. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan Bayangan</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 32px; background: #F6F8FA; }
    .kartu {
      max-width: 300px;
      padding: 20px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    h2 { margin-top: 0; }
  </style>
</head>
<body>
  <div class="kartu">
    <h2>Kartu Sederhana</h2>
    <p>Perbanyak lapisan bayangannya, atau buat judulnya bercahaya.</p>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'box-shadow: offset-x offset-y blur spread warna; tambahkan inset untuk bayangan di dalam elemen.',
    'text-shadow memakai urutan serupa tanpa spread.',
    'Warna rgba dengan transparansi kecil menghasilkan bayangan yang lebih natural.',
    'Bayangan bertingkat (dipisahkan koma) meniru cahaya sungguhan: tajam di dekat, lembut di jauh.',
    'Hindari bayangan blur besar pada banyak elemen atau animasi; jangan jadikan bayangan satu-satunya petunjuk.'
  ]
});

/* ---------- Pelajaran 4: CSS Variable (Custom Properties) ---------- */
window.CSS_LESSONS.push({
  id: 'css-variable',
  title: 'CSS Variable (Custom Properties)',
  chapter: 'Gaya & Efek',
  duration: '7 menit',
  intro: [
    'Pernahkah kamu mengubah satu warna yang dipakai di 30 tempat, satu per satu? <b>CSS Variable</b> (disebut juga <b>Custom Properties</b>) menghapus pekerjaan itu: tulis sekali di satu tempat, pakai di mana saja, dan ubah sekali untuk mengubah semuanya.',
    'Bayangkan variabel seperti botol saos beralas label: semua resep menulis "sambal botol A". Kalau isi botol diganti, semua hidangan ikut berubah tanpa mengubah resepnya.'
  ],
  objectives: [
    'Mendeklarasikan --nama-variabel di :root',
    'Memakai var(--nama, nilai-cadangan)',
    'Meng-override variabel di selektor lain',
    'Membuat tema terang/gelap hanya dengan mengganti nilai variabel',
    'Menjelaskan keunggulan variabel dibanding nilai hardcode'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Variabel CSS dideklarasikan dengan dua tanda hubung di awal nama, misalnya <code>--warna-utama: #1572B6;</code>. Tempat paling umum untuk menyimpannya adalah <code>:root</code> — selektor untuk elemen terluar dokumen — agar bisa dipakai di seluruh halaman.</p><p>Untuk memakainya, tulis <code>var(--warna-utama)</code> di posisi mana pun sebuah nilai biasa ditulis: <code>color: var(--warna-utama);</code>. Perhatikan nama variabel <b>peka huruf besar/kecil</b>: <code>--Warna</code> dan <code>--warna</code> adalah dua variabel berbeda.</p>'
    },
    {
      type: 'example',
      title: 'Satu variabel, tiga pemakaian',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Variabel Pertamaku</title>
  <style>
    :root {
      --warna-utama: #1572B6;
      --warna-teks: #333333;
    }
    body {
      font-family: system-ui, sans-serif;
      color: var(--warna-teks);
      padding: 24px;
    }
    h1 { color: var(--warna-utama); }
    a { color: var(--warna-utama); }
    .tombol {
      background: var(--warna-utama);
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Semua biru dari satu variabel</h1>
  <p>Judul, tautan, dan tombol memakai var(--warna-utama).</p>
  <p><a href="#/">Tautan contoh</a></p>
  <button class="tombol">Tombol</button>
</body>
</html>`,
      explain: [
        '<code>:root</code> adalah selektor elemen terluar dokumen — tempat ideal menyimpan variabel yang dipakai di seluruh halaman.',
        'Deklarasi memakai nama berawalan dua tanda hubung (<code>--warna-utama</code>); pemakaiannya dengan fungsi <code>var()</code>.',
        'Ubah nilai di <code>:root</code> sekali saja — judul, tautan, dan tombol ikut berubah sekaligus.',
        'Ini keunggulan dibanding nilai hardcode: tidak ada lagi warna yang terlewat saat harus diganti.'
      ]
    },
    {
      type: 'text',
      html: '<p>Fungsi <code>var()</code> menerima <b>nilai cadangan</b> sebagai argumen kedua: <code>color: var(--aksen, #999);</code>. Nilai cadangan hanya dipakai jika variabel belum didefinisikan. Lebih dari itu, variabel bisa <b>di-override</b> di selektor lain: deklarasi ulang <code>--aksen</code> di dalam <code>.kartu.alt</code> hanya berlaku untuk elemen itu dan keturunannya, tanpa menyentuh <code>:root</code>.</p>'
    },
    {
      type: 'example',
      title: 'Override variabel di selektor lain',
      lang: 'css',
      output: true,
      code: `:root {
  --aksen: #E34F26;
}
.badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  color: #ffffff;
  background: var(--aksen);
  font-family: system-ui, sans-serif;
}
.badge.alt {
  --aksen: #1572B6;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Override Variabel</title>
  <style>
__CODE__
  </style>
</head>
<body style="padding:32px">
  <span class="badge">Badge Bawaan</span>
  <span class="badge alt">Badge Alt</span>
  <p>Elemen .alt meng-override --aksen di lingkupnya sendiri.</p>
</body>
</html>`,
      explain: [
        'Kedua badge memakai aturan yang sama, <code>background: var(--aksen)</code> — bedanya hanya nilai variabelnya.',
        '<code>.badge.alt</code> mendeklarasikan ulang <code>--aksen: #1572B6</code>, sehingga badge kedua berwarna biru tanpa mengubah <code>:root</code>.',
        'Variabel mengikuti aturan cascade seperti properti biasa: deklarasi yang lebih dekat dengan elemen menang.',
        'Inilah dasar pembuatan tema: ganti kumpulan variabel di satu selektor, seluruh halaman mengikuti.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kombinasi ini sangat cocok untuk <b>tema terang/gelap</b>. Simpan semua warna sebagai variabel di <code>:root</code> (tema terang), lalu definisikan ulang satu set variabel yang sama di selektor <code>[data-theme="gelap"]</code>. Semua aturan tetap memakai <code>var()</code> — berpindah tema cukup mengganti atribut <code>data-theme</code> pada elemen (biasanya lewat tombol dan sedikit JavaScript).</p>'
    },
    {
      type: 'example',
      title: 'Tema terang & gelap dengan satu set variabel',
      lang: 'css',
      output: true,
      code: `:root {
  --latar: #ffffff;
  --teks: #222222;
  --aksen: #1572B6;
}
[data-theme="gelap"] {
  --latar: #101828;
  --teks: #f2f4f7;
  --aksen: #7AB8F5;
}
.halaman {
  background: var(--latar);
  color: var(--teks);
  padding: 24px;
  border-radius: 12px;
  font-family: system-ui, sans-serif;
  margin-bottom: 16px;
}
a { color: var(--aksen); }`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tema Terang & Gelap</title>
  <style>
__CODE__
  </style>
</head>
<body>
  <div class="halaman">
    <b>Tema Terang</b>
    <p><a href="#/">Tautan</a> memakai aksen biru tua.</p>
  </div>
  <div class="halaman" data-theme="gelap">
    <b>Tema Gelap</b>
    <p><a href="#/">Tautan</a> memakai aksen biru muda — tanpa aturan baru, hanya nilai variabel yang berubah.</p>
  </div>
</body>
</html>`,
      explain: [
        'Kedua tema memakai aturan yang identik — hanya nilai <code>--latar</code>, <code>--teks</code>, dan <code>--aksen</code> yang berbeda.',
        'Atribut <code>data-theme="gelap"</code> membuat selektor <code>[data-theme="gelap"]</code> cocok, sehingga variabel di dalamnya berlaku untuk kartu itu dan isinya.',
        'Di situs sungguhan, atribut itu biasanya dipasang di elemen <code>&lt;html&gt;</code> dan diubah lewat tombol — seluruh halaman berpindah tema seketika.',
        'Karena semua warna berasal dari variabel, tidak ada lagi warna yang terlewat saat membuat tema baru.'
      ]
    },
    {
      type: 'tip',
      title: 'Konvensi penamaan',
      text: 'Awali nama variabel dengan dua tanda hubung dan pakai kata berhubung: <code>--warna-utama</code>, <code>--ukuran-huruf</code>. Simpan nilai default di <code>:root</code>, dan kelompokkan variabel terkait dengan komentar. Nama variabel peka huruf besar/kecil, jadi konsistenlah dalam penulisannya.'
    },
    {
      type: 'warn',
      title: 'Batasan var() yang sering mengejutkan',
      text: '<code>var()</code> tidak bisa dipakai untuk menyusun nama properti atau selektor (misalnya menjadikan <code>--ukuran</code> sebagai nama properti tidak berfungsi). Nilai cadangan pada <code>var(--nama, cadangan)</code> hanya dipakai saat variabel <i>belum didefinisikan</i> — bukan saat nilainya kosong atau tidak valid. Dan variabel tanpa nilai akan membatalkan deklarasi propertinya.'
    },
    {
      type: 'live',
      title: 'Coba sendiri: jadi desainer tema',
      lang: 'html',
      hint: 'Tambahkan variabel --radius di :root dan pakai di border-radius kartu; lalu buat kelas .malam yang meng-override --latar dan --teks, dan terapkan pada kartu kedua. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan CSS Variable</title>
  <style>
    :root {
      --warna-utama: #1572B6;
      --latar: #ffffff;
      --teks: #333333;
    }
    body {
      font-family: system-ui, sans-serif;
      padding: 24px;
    }
    .kartu {
      background: var(--latar);
      color: var(--teks);
      border: 2px solid var(--warna-utama);
      border-radius: 10px;
      padding: 18px;
      max-width: 300px;
      margin-bottom: 12px;
    }
    .kartu b { color: var(--warna-utama); }
  </style>
</head>
<body>
  <div class="kartu">
    <b>Kartu 1</b>
    <p>Semuanya diatur dari tiga variabel di :root.</p>
  </div>
  <div class="kartu">
    <b>Kartu 2</b>
    <p>Coba override variabel di sini!</p>
  </div>
</body>
</html>`
    }
  ],
  recap: [
    'Variabel CSS dideklarasikan sebagai --nama: nilai; dan dipakai dengan var(--nama).',
    'Simpan variabel default di :root agar berlaku di seluruh halaman.',
    'var(--nama, cadangan) memakai nilai cadangan hanya jika variabel belum didefinisikan.',
    'Override variabel di selektor lain untuk membuat tema terang/gelap tanpa aturan baru.',
    'Variabel menghemat kerja: ubah satu nilai, seluruh halaman mengikuti — tidak ada warna yang terlewat.'
  ]
});
