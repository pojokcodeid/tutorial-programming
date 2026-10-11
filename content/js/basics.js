/* ============================================================
   Pelajaran JavaScript — Bab 1: Dasar-dasar
   (topik info.md: "mengenal javascript",
    "cara menulis javascript di html",
    "fungsi output di javascript")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran 1: Mengenal JavaScript ---------- */
window.JS_LESSONS.push({
  id: 'mengenal-javascript',
  title: 'Mengenal JavaScript',
  chapter: 'Pendahuluan',
  duration: '7 menit',
  intro: [
    'Di materi HTML kamu membangun <b>kerangka</b> halaman, dan di CSS kamu memberi <b>cat</b>-nya. <b>JavaScript</b> (disingkat <b>JS</b>) adalah <b>otot dan otaknya</b>: JS membuat halaman bisa bergerak, merespons klik, dan berubah sesuai tindakan pengunjung.',
    'Pelajaran ini membahas apa itu JavaScript, perbedaannya dengan Java, dan tempat menulis kode pertama.'
  ],
  objectives: [
    'Memahami apa itu JavaScript dan perannya di web',
    'Membedakan JavaScript dengan Java',
    'Mengetahui di mana JavaScript bisa dijalankan',
    'Menulis dan menjalankan kode JavaScript pertama'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>JavaScript</b> adalah bahasa pemrograman yang berjalan di hampir semua browser dunia. Dibuat pada <b>1995</b> oleh <b>Brendan Eich</b>, awalnya hanya untuk halaman web kecil — kini JS juga dipakai di server (<b>Node.js</b>, aplikasi mobile, hingga perangkat IoT.</p><p>Ingat tiga lapisannya:</p><ul><li><b>HTML</b> = struktur (dinding rumah)</li><li><b>CSS</b> = tampilan (cat dan dekorasi)</li><li><b>JavaScript</b> = perilaku (listrik dan saklar)</li></ul>'
    },
    {
      type: 'example',
      title: 'Kode JavaScript pertama',
      lang: 'javascript',
      output: false,
      code: `// komentar satu baris — diabaikan browser
let nama = "Andi";      // variabel yang bisa berubah
const tahun = 2026;     // konstanta, nilainya tetap

console.log("Halo, " + nama);  // menulis ke konsol
console.log(\`Belajar JS sejak \${tahun}\`);`,
      explain: [
        'Kode ini menulis ke <b>konsol</b>, bukan ke halaman. Tekan <b>F12</b> lalu pilih tab <b>Console</b> untuk melihat hasilnya.',
        '<code>//</code> menandai komentar satu baris; <code>/* ... */</code> untuk komentar beberapa baris.',
        'Tanda <code>+</code> menggabungkan teks; teks di dalam <code>...</code> (backtick) bisa menyisipkan variabel dengan <code>${...}</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'JavaScript ≠ Java',
      text: 'Meski namanya mirip, JavaScript dan Java adalah <b>dua bahasa yang berbeda</b> — beda konsep, beda cara jalan, beda pemakaiannya. Nama yang mirip hanya urusan pemasaran tahun 1990-an. Jangan tertukar!'
    },
    {
      type: 'warn',
      title: 'JavaScript bisa dimatikan',
      text: 'Pengunjung bisa mematikan JavaScript di browsernya, dan beberapa ekstensi pemblokir iklan juga memblokirnya. Untuk informasi penting di halaman, jangan andalkan JS saja — pastikan konten inti tetap tampil lewat HTML.'
    },
    {
      type: 'example',
      title: 'Di mana JavaScript bisa berjalan?',
      lang: 'javascript',
      output: false,
      code: `// 1. Di BROWSER (paling umum)
//    - halaman interaktif, animasi, validasi form

// 2. Di SERVER (Node.js)
//    - API, database, website seperti biasa

// 3. DI MANA SAJA
//    - aplikasi desktop (Electron),
//      aplikasi mobile (React Native),
//      bahkan robot dan IoT`,
      explain: [
        'Browser adalah tempat paling umum: setiap halaman modern memakai JS.',
        '<b>Node.js</b> memungkinkan JS berjalan di komputer server tanpa browser.',
        'Karena JS ada di mana-mana, belajar JS membuka banyak jalan karier.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['JavaScript', 'Bahasa pemrograman untuk membuat halaman web menjadi interaktif.'],
        ['ECMAScript', 'Spesifikasi standar resmi JavaScript — versi baru tiap tahun (ES6, ES2020, dst).'],
        ['Interpreter', 'Program yang membaca dan menjalankan kode JS baris per baris (di dalam browser).'],
        ['Runtime', 'Lingkungan tempat kode JS dijalankan, misalnya browser atau Node.js.'],
        ['Konsol', 'Panel developer tools (F12) untuk membaca pesan dan menjalankan kode cepat.'],
        ['Dynamic typing', 'Variabel JS tidak perlu dideklarasikan tipe datanya — bisa berubah isinya.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: tulis pesan ke halaman',
      lang: 'html',
      hint: 'Klik "Jalankan". Lalu ubah teks di dalam variabel pesan dan klik lagi untuk melihat perubahannya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>JS Pertamaku</title>
</head>
<body>
  <h1>Halo dari JavaScript!</h1>
  <p id="keluaran">Kalimat ini akan diganti oleh JavaScript.</p>
  <script>
    let pesan = "JavaScript sedang bekerja...";
    document.getElementById("keluaran").textContent = pesan;
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'JavaScript adalah bahasa pemrograman yang membuat halaman web interaktif.',
    'HTML = struktur, CSS = tampilan, JavaScript = perilaku.',
    'JavaScript dibuat oleh Brendan Eich pada 1995; berbeda jauh dari Java.',
    'JS berjalan di browser, di server (Node.js), dan banyak tempat lain.',
    'Komentar ditulis dengan // atau /* ... */.'
  ]
});

/* ---------- Pelajaran 2: Cara Menulis JavaScript di HTML ---------- */
window.JS_LESSONS.push({
  id: 'cara-menulis-javascript-di-html',
  title: 'Cara Menulis JavaScript di HTML',
  chapter: 'Pendahuluan',
  duration: '9 menit',
  intro: [
    'Ada <b>tiga cara</b> menyisipkan JavaScript ke halaman: langsung di atribut elemen (inline), di dalam tag &lt;script&gt; pada halaman itu sendiri, atau di <b>berkas .js terpisah</b> yang dipanggil dengan <code>src</code>.',
    'Pelajaran ini membahas ketiganya plus aturan penempatan yang membuat kode kamu andal.'
  ],
  objectives: [
    'Menyebutkan 3 cara menyisipkan JavaScript ke HTML',
    'Menulis kode di dalam tag &lt;script&gt;',
    'Memanggil berkas .js terpisah',
    'Menjelaskan mengapa penempatan &lt;script&gt; penting'
  ],
  sections: [
    {
      type: 'example',
      title: 'Cara 1: internal — tag <script> di halaman',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Script Internal</title>
</head>
<body>
  <h1>Belajar JavaScript</h1>
  <p id="info">Tunggu sebentar...</p>

  <script>
    // kode JavaScript langsung di halaman ini
    document.getElementById("info").textContent =
      "Paragraf ini diubah oleh <script> internal.";
  <\/script>
</body>
</html>`,
      explain: [
        'Tag <b>&lt;script&gt;</b> bisa diletakkan di <code>&lt;head&gt;</code> maupun <code>&lt;body&gt;</code>.',
        'Kode dijalankan <b>sesaat browser menemukan tag</b> &lt;script&gt; itu — karena itu elemen yang diubah harus sudah ada di atasnya.',
        'Penulisan di dalam halaman cocok untuk kode kecil dan percobaan.'
      ]
    },
    {
      type: 'example',
      title: 'Cara 2: eksternal — berkas .js terpisah',
      lang: 'javascript',
      output: false,
      code: `// berkas: js/saya.js
function sapa(nama) {
  return "Halo, " + nama + "!";
}

document.getElementById("info").textContent = sapa("Andi");`,
      explain: [
        'Simpan kode di berkas terpisah, misalnya <code>saya.js</code> — tanpa tag &lt;script&gt; di dalamnya.',
        'Berkas itu dipanggil dari HTML: <code>&lt;script src="js/saya.js"&gt;&lt;/script&gt;</code>.',
        'Kode yang sama bisa dipakai oleh banyak halaman — ubah sekali, semua halaman ikut berubah.',
        'Ini cara yang <b>paling direkomendasikan</b> untuk proyek sungguhan.'
      ]
    },
    {
      type: 'example',
      title: 'Cara 3: inline — atribut event pada elemen',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Inline JavaScript</title>
</head>
<body>
  <button onclick="document.getElementById('m').textContent='Tombol diklik!'">
    Klik aku
  </button>
  <p id="m">Belum ada yang klik.</p>
</body>
</html>`,
      explain: [
        'Atribut <code>onclick="..."</code> berisi kode JS yang jalan saat tombol diklik.',
        'Cepat untuk coba-coba, tapi <b>tidak disarankan</b> untuk proyek besar: HTML dan JS bercampur jadi sulit dibaca.',
        'Cara modern: pakai <code>addEventListener</code> (dibahas di pelajaran Event).'
      ]
    },
    {
      type: 'tip',
      title: 'Letakkan <script> di akhir <body>',
      text: 'Menaruh <code>&lt;script&gt;</code> tepat sebelum <code>&lt;/body&gt;</code> membuat seluruh konten HTML termuat lebih dulu — jadi kode JS tidak perlu menunggu. Alternatif modern: tambahkan atribut <code>defer</code> (<code>&lt;script defer src="..."&gt;</code>) sehingga kode jalan setelah seluruh HTML siap.'
    },
    {
      type: 'warn',
      title: 'Jangan tulis <script> di dalam <script>',
      text: 'Kode JavaScript tidak boleh memuat string <code>&lt;/script&gt;</code> secara langsung (mis. di dalam teks atau kode yang dibangun dinamis) — browser akan menganggap tag &lt;script&gt; sudah selesai. Solusinya: pecah string itu, misalnya tulis <code>&lt;scr&lt;/code&gt; + <code>ipt&gt;</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Inline script', 'Kode JS di atribut event elemen, mis. <code>onclick="..."</code>.'],
        ['Internal script', 'Kode JS di dalam tag &lt;script&gt; pada halaman itu sendiri.'],
        ['External script', 'Kode JS di berkas .js terpisah, dipanggil lewat <code>src</code>.'],
        ['src', 'Atribut yang menunjukkan alamat berkas JS yang dipanggil.'],
        ['defer', 'Atribut yang menunda eksekusi script sampai HTML selesai dimuat.'],
        ['Parsing', 'Proses browser membaca dan mengartikan kode HTML/JS.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: script internal di akhir body',
      lang: 'html',
      hint: 'Jalankan, lalu pindahkan &lt;script&gt; ke atas &lt;p&gt; dan jalankan lagi — perhatikan bedanya (elemen belum ada saat kode jalan).',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Posisi Script</title>
</head>
<body>
  <h1>Posisi Script Penting</h1>
  <p id="status">Tunggu...</p>

  <script>
    // Elemen <p> di atas sudah ada, jadi kode ini bekerja.
    document.getElementById("status").textContent =
      "Berhasil! Elemen sudah ditemukan.";
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Tiga cara menyisipkan JS: inline (atribut event), internal (tag &lt;script&gt;), eksternal (berkas .js).',
    'Berkas .js terpisah adalah cara paling rapi dan dapat dipakai ulang.',
    'Kode di &lt;script&gt; jalan saat browser menemukan tag-nya.',
    'Letakkan &lt;script&gt; di akhir &lt;body&gt; atau pakai defer agar elemen sudah tersedia.',
    'Jangan sisipkan string &lt;/script&gt; di dalam kode JS.',
  ]
});

/* ---------- Pelajaran 3: Fungsi Output di JavaScript ---------- */
window.JS_LESSONS.push({
  id: 'fungsi-output-javascript',
  title: 'Fungsi Output di JavaScript',
  chapter: 'Pendahuluan',
  duration: '9 menit',
  intro: [
    'Supaya kode JavaScript "berbicara", kita butuh cara menampilkan hasilnya. Ada <b>empat jalur keluaran</b> umum: <b>konsol</b> (console.log), <b>popup</b> (alert), <b>tulis ke halaman</b> (document.write), dan <b>ubah elemen</b> (innerHTML / textContent).',
    'Masing-masing punya waktu dan tempat yang tepat — pelajaran ini membahas kapan memakai yang mana.'
  ],
  objectives: [
    'Menampilkan pesan di konsol dengan console.log',
    'Menampilkan popup dengan alert',
    'Mengubah isi elemen dengan innerHTML dan textContent',
    'Memahami bahaya document.write'
  ],
  sections: [
    {
      type: 'example',
      title: 'console.log — sahabat programmer',
      lang: 'javascript',
      output: false,
      code: `let harga = 15000;
let jumlah = 3;

console.log("Harga satuan:", harga);
console.log("Total:", harga * jumlah);
console.log("Tipe dari harga:", typeof harga);`,
      explain: [
        '<code>console.log()</code> menulis ke <b>konsol</b> (F12 → tab Console) — tidak mengubah tampilan halaman.',
        'Bisa menerima banyak argumen sekaligus, dipisah koma.',
        'Ini alat utama untuk <b>memeriksa nilai variabel</b> saat kode tidak berperilaku seperti yang diharapkan.',
        'Di pratinjau terkotak (sandbox), konsol tidak tampak — coba buka halaman sungguhan lalu tekan F12.'
      ]
    },
    {
      type: 'example',
      title: 'alert — popup sederhana',
      lang: 'html',
      output: false,
      code: `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Alert</title></head>
<body>
  <script>
    alert("Selamat datang!");
  <\/script>
</body>
</html>`,
      explain: [
        '<code>alert()</code> menampilkan <b>popup</b> dengan tombol OK.',
        'Popup <b>menghentikan</b> sementara seluruh halaman sampai OK ditekan — pengunjung tidak bisa melakukan apa pun.',
        'Di pratinjau materi ini popup <b>diblokir</b> (browser melarangnya di iframe terkotak), jadi contoh ini tidak menampilkan pratinjau.',
        'Popup hanya cocok untuk pesan singkat yang sangat penting; jangan dipakai berlebihan.'
      ]
    },
    {
      type: 'example',
      title: 'innerHTML — mengubah isi elemen',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>innerHTML</title>
</head>
<body>
  <h2>Keranjang Belanja</h2>
  <div id="keranjang">Masih kosong.</div>

  <script>
    const keranjang = document.getElementById("keranjang");
    keranjang.innerHTML = "<strong>3 item</strong> ditambahkan ✓";
  <\/script>
</body>
</html>`,
      explain: [
        '<code>innerHTML</code> mengganti isi elemen — dan <b>menafsirkan tag HTML</b> di dalamnya (karena itu <code>&lt;strong&gt;</code> jadi tebal).',
        '<code>textContent</code> lebih aman: ia hanya menulis <b>teks biasa</b>, tanpa menafsirkan HTML.',
        'Kedua cara ini adalah yang paling sering dipakai sehari-hari.'
      ]
    },
    {
      type: 'warn',
      title: 'document.write itu berbahaya',
      text: '<code>document.write()</code> menulis langsung ke aliran HTML saat halaman dimuat. Jika dipakai <b>setelah halaman termuat</b>, ia <b>menghapus seluruh isi halaman</b> dan menulis ulang dari awal! Hindari kecuali untuk eksperimen kecil. Pakai innerHTML/textContent atau DOM saja.'
    },
    {
      type: 'tip',
      title: 'Mana yang dipakai?',
      text: 'Aturan praktis: <b>debugging</b> → <code>console.log</code>. <b>Pesan ke pengunjung</b> → ubah elemen dengan <code>textContent</code>/<code>innerHTML</code>. <b>Popup penting sekali</b> → <code>alert</code>. Jangan <code>document.write</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['console.log()', 'Menulis pesan ke konsol developer tools — alat utama debugging.'],
        ['alert()', 'Menampilkan popup dengan tombol OK; menghentikan sementara halaman.'],
        ['document.write()', 'Menulis ke aliran HTML saat pemuatan; berbahaya setelah halaman siap.'],
        ['innerHTML', 'Properti untuk mengganti isi elemen termasuk tag HTML di dalamnya.'],
        ['textContent', 'Properti untuk mengganti isi elemen sebagai teks biasa (lebih aman).'],
        ['Debugging', 'Kegiatan mencari dan memperbaiki kesalahan dalam kode.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: bandingkan innerHTML dan textContent',
      lang: 'html',
      hint: 'Jalankan dulu. Lalu ubah baris textContent menjadi innerHTML, atau sebaliknya, dan lihat perbedaannya!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Output Latihan</title>
</head>
<body>
  <h2>Latihan Output</h2>
  <p id="a">Baris pertama (diubah dengan innerHTML).</p>
  <p id="b">Baris kedua (diubah dengan textContent).</p>

  <script>
    const a = document.getElementById("a");
    const b = document.getElementById("b");

    // innerHTML menafsirkan tag: kata "TEBAL" jadi tebal
    a.innerHTML = "Kata <strong>TEBAL</strong> lewat innerHTML.";

    // textContent menampilkan tag apa adanya, sebagai teks biasa
    b.textContent = "Kata <strong>TEBAL</strong> lewat textContent.";
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Empat jalur output: console.log (konsol), alert (popup), document.write (aliran HTML), innerHTML/textContent (elemen).',
    'console.log adalah alat utama untuk memeriksa kode — buka konsol dengan F12.',
    'innerHTML menafsirkan HTML; textContent hanya menulis teks biasa.',
    'alert menghentikan halaman sebentar; jangan dipakai berlebihan.',
    'Hindari document.write — bisa menghapus isi halaman.',
  ]
});
