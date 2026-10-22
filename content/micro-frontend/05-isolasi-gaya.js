/* ============================================================
   Pelajaran Micro-Frontend — Bab 5: Isolasi Gaya & Design Tokens
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-isolasi-gaya',
  title: 'Isolasi Gaya & Design Tokens',
  chapter: 'Membangun',
  duration: '13 menit',
  intro: [
    'CSS adalah satu-satunya ruang nama <b>global</b> yang tersisa di halaman web. Ketika tiga tim menulis gaya masing-masing dalam satu halaman, satu selektor seperti <code>.btn</code> dari remote keranjang bisa mengubah tombol di remote katalog tanpa pernah disadari siapa pun — dan biasanya ditemukan pertama kali oleh pengguna, bukan pengembang.',
    'Bab ini membahas tiga lapisan pertahanan: <b>awalan selektor</b>, <b>CSS Modules</b>, dan <b>Shadow DOM</b>, lalu menutupnya dengan <b>design tokens</b> — cara paling murah membuat banyak tim tampil seragam tanpa harus berbagi berkas CSS yang sama.',
    'Di bagian praktik kamu akan merasakan langsung kekuatan Shadow DOM: sebuah komponen yang gayanya tetap utuh meski halaman induk menulis gaya yang bertabrakan.'
  ],
  objectives: [
    'Menjelaskan mengapa CSS peramban berlaku global di seluruh halaman',
    'Menerapkan awalan selektor dan CSS Modules untuk mencegah tabrakan',
    'Menggunakan Shadow DOM untuk isolasi gaya penuh',
    'Menyusun design tokens di shell dan memakainya dari remote',
    'Menghindari kesalahan seperti CSS reset di dalam remote'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Masalahnya: Gaya Berlaku untuk Semua Orang</h3><p>Ketika remote keranjang memuat berkas CSS yang berisi <code>.panel { border: none; }</code>, aturan itu tidak hanya berlaku untuk panel milik keranjang — ia berlaku untuk <b>setiap</b> elemen dengan kelas <code>panel</code> di halaman, termasuk milik remote lain. Tidak ada pemberitahuan, tidak ada galat di konsol: hanya tampilan yang tiba-tiba berubah setelah sebuah remote dirilis.</p><p>Karena itu, <b>setiap remote wajib memakai awalan kelasnya sendiri</b>: <code>.hd-</code> untuk header, <code>.pf-</code> untuk katalog, <code>.ct-</code> untuk keranjang. Awalan bukan sekadar gaya penulisan — ia adalah bagian dari kontrak antartim.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 230" width="760" role="img" aria-label="Tiga lapisan pertahanan isolasi gaya: awalan selektor, CSS Modules, Shadow DOM"><rect x="20" y="60" width="230" height="110" rx="8" class="u-box"/><text x="135" y="85" class="u-title" text-anchor="middle">1. Awalan selektor</text><text x="135" y="106" class="u-lbl" text-anchor="middle">.pf-panel, .ct-item</text><text x="135" y="124" class="u-lbl" text-anchor="middle">murah, mudah diaudit</text><text x="135" y="142" class="u-lbl" text-anchor="middle">bergantung disiplin tim</text><line x1="250" y1="115" x2="270" y2="115" class="u-line" marker-end="url(#u-arrow)"/><rect x="275" y="60" width="210" height="110" rx="8" class="u-box"/><text x="380" y="85" class="u-title" text-anchor="middle">2. CSS Modules</text><text x="380" y="106" class="u-lbl" text-anchor="middle">kelas di-hash bundler</text><text x="380" y="124" class="u-lbl" text-anchor="middle">otomatis, tanpa disiplin</text><text x="380" y="142" class="u-lbl" text-anchor="middle">butuh tooling build</text><line x1="485" y1="115" x2="505" y2="115" class="u-line" marker-end="url(#u-arrow)"/><rect x="510" y="60" width="230" height="110" rx="8" class="u-hl"/><text x="625" y="85" class="u-title" text-anchor="middle">3. Shadow DOM</text><text x="625" y="106" class="u-lbl" text-anchor="middle">isolasi penuh, mustahil bocor</text><text x="625" y="124" class="u-lbl" text-anchor="middle">butuh komponen berbasis elemen</text><text x="625" y="142" class="u-lbl" text-anchor="middle">token tetap harus disepakati</text><text x="380" y="205" class="u-lbl" text-anchor="middle">tiga lapisan ini melindungi dari tabrakan gaya — semuanya tetap memakai design tokens yang sama</text></svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Tiga lapisan pertahanan dari yang paling ringan sampai paling kuat</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Awalan selektor dalam praktik',
      lang: 'css',
      output: false,
      code: `/* remote/products/styles.css — SELALU dengan awalan .pf- */
.pf-panel   { border: 1px solid var(--line, #e5e7eb); border-radius: 12px; padding: 16px; }
.pf-panel h3{ margin: 0 0 12px; font-size: 18px; }
.pf-item    { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line, #eee); }
.pf-item:last-child { border-bottom: none; }
.pf-btn     { background: var(--accent, #4f46e5); color: #fff; border: 0;
              padding: 8px 14px; border-radius: 8px; cursor: pointer; }
.pf-btn:hover { filter: brightness(1.08); }

/* SALAH — jangan pernah menulis ini di dalam remote */
/* body { font-family: Arial; }        → mengubah seluruh halaman */
/* *  { box-sizing: border-box; }      → milik shell, bukan remote */
/* .btn { ... }                        → tanpa awalan, pasti suatu saat bentrok */`,
      explain: [
        'Setiap selektor diawali <code>.pf-</code> milik remote katalog; remote lain tidak akan pernah tersentuh karena tidak ada yang memakai awalan itu.',
        'Perhatikan penggunaan <code>var(--accent, #4f46e5)</code> — token dari shell dengan <b>nilai cadangan</b>. Bila shell belum memuat token, tampilan tetap terbaca, bukan berubah transparan.',
        'Komentar di bawah adalah contoh kesalahan yang paling sering ditemukan: mengatur <code>body</code> atau memasang reset di dalam remote berarti mengubah gaya milik semua orang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Shadow DOM: Isolasi Penuh</h3><p>Bila awalan bergantung pada disiplin, <b>Shadow DOM</b> menegakkannya secara teknis. Dengan <code>attachShadow({ mode: \'open\' })</code>, komponen mendapat dokumennya sendiri: selektor dari halaman induk tidak menembus ke dalam, dan gaya di dalamnya tidak menembus keluar. Ini adalah mekanisme yang sama dengan yang dipakai Web Components di bab sebelumnya.</p>'
    },
    {
      type: 'live',
      title: 'Coba sendiri: komponen kebal dari gaya induk',
      lang: 'html',
      hint: 'Halaman induk sengaja menulis * { color: red } dan button { ... } — perhatikan isi shadow DOM tetap biru dengan tombolnya sendiri. Ubah gaya induk untuk membuktikannya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Shadow DOM</title>
  <style>
    /* gaya HALAMAN INDUK yang berusaha menyerang komponen */
    * { color: red; }
    button { background: black; color: white; border: 0; padding: 10px; }
    body { font-family: system-ui, sans-serif; padding: 16px; }
  </style>
</head>
<body>
  <p style="color:red">Teks induk (terpengaruh gaya induk)</p>
  <app-kartu></app-kartu>

  <script>
    class KartuEl extends HTMLElement {
      connectedCallback() {
        // mode "open" supaya bisa diperiksa lewat devtools
        const shadow = this.attachShadow({ mode: 'open' });

        shadow.innerHTML =
          '<style>' +
            '  :host { display: block; }' +
            '  .card { border: 1px solid #c7d2fe; border-radius: 10px;' +
            '          padding: 12px; font-family: system-ui; color: #111827; }' +
            '  button { background: #6366f1; color: #fff; border: 0;' +
            '           padding: 8px 14px; border-radius: 8px; cursor: pointer; }' +
            '  p { color: #4b5563; }' +
          '</style>' +
          '<div class="card">' +
            '  <b>Kartu Remote (Shadow DOM)</b>' +
            '  <p>Gaya di sini kebal dari halaman induk.</p>' +
            '  <button>Tombol remote</button>' +
          '</div>';
      }
    }

    customElements.define('app-kartu', KartuEl);
  </script>
</body>
</html>`
    },
    {
      type: 'warn',
      title: 'Shadow DOM Bukan Alasan untuk Mengabaikan Design Tokens',
      text: 'Shadow DOM mengisolasi <b>selektor</b>, bukan <b>keputusan desain</b>. Karena dokumen shadow tidak mewarisi variabel dari induk secara otomatis, komponen jangan mengganti <code>--accent</code> dengan nilai tetap — baca token lewat <code>getComputedStyle(this).getPropertyValue(\'--accent\')</code> saat dipasang, lalu pakai nilainya di dalam shadow. Tanpa langkah ini, komponenmu kebal secara teknis tetapi tetap tampil beda dari produk.'
    },
    {
      type: 'text',
      html: '<h3>Design Tokens: Seragam Tanpa Berbagi Berkas</h3><p><b>Design tokens</b> adalah variabel CSS berisi keputusan desain — warna aksen, warna latar kartu, warna teks, radius, jarak. Shell menyatakan sekali di <code>:root</code>, lalu semua remote memakai <code>var(--accent)</code> tanpa perlu tahu dari mana nilainya datang. Inilah jembatan paling murah menuju tampilan satu keluarga di antara banyak tim.</p>'
    },
    {
      type: 'example',
      title: 'Tokens di shell dan pemakaiannya di remote',
      lang: 'css',
      output: false,
      code: `/* shell/shell.css — pemilik token */
:root {
  --accent: #4f46e5;
  --accent-soft: #eef2ff;
  --bg: #ffffff;
  --card: #f9fafb;
  --text: #111827;
  --muted: #6b7280;
  --line: #e5e7eb;
  --radius: 12px;
  --space: 12px;
  font-family: system-ui, sans-serif;
}

/* remotes/products/styles.css — pemakai token + nilai cadangan */
.pf-panel  { background: var(--card, #f9fafb); color: var(--text, #111827);
             border: 1px solid var(--line, #e5e7eb); border-radius: var(--radius, 12px);
             padding: var(--space, 12px); }
.pf-price  { color: var(--accent, #4f46e5); font-weight: 600; }
.pf-muted  { color: var(--muted, #6b7280); font-size: 13px; }`,
      explain: [
        'Shell adalah satu-satunya tempat yang menyatakan nilai warna. Ketika produk ingin mengganti warna aksen, hanya berkas shell yang disentuh — seluruh remote berubah serentak.',
        'Nilai cadangan di <code>var(--accent, #4f46e5)</code> membuat remote tetap tampil wajar saat dijalankan mandiri, misal saat pengujian atau ketika dimuat di halaman lain.',
        'Dengan token, remote tidak perlu saling menyalin berkas CSS: yang dibagikan adalah <b>nilai</b>, bukan berkas — ketergantungan jauh lebih ringan.'
      ]
    },
    {
      type: 'tip',
      title: 'Uji Tabrakan Gaya sebagai Bagian dari Rilis',
      text: 'Tambahkan satu pemeriksaan sederhana di pengujian visual: muat dua remote di halaman yang sama dan bandingkan tangkapan layarnya dengan baseline. Bila tombol remote katalog tiba-tiba berubah setelah keranjang dirilis, tabrakan gaya tertangkap sebelum pengguna melihatnya. Pemeriksaan ini murah (satu skrip tangkapan layar) dan menangkap masalah yang mustahil ditemukan oleh pengujian unit per remote.'
    },
    {
      type: 'vocab',
      items: [
        ['Ruang nama global', 'Kondisi di mana nama kelas dan id di seluruh halaman berbagi satu daftar — sumber utama tabrakan gaya.'],
        ['Awalan selektor', 'Pola memberi prefiks kelas (misal .pf-) milik setiap remote agar selektor tidak pernah bertabrakan.'],
        ['CSS Modules', 'Cara penulisan CSS yang memperoleh nama kelas unik dari bundler sehingga tabrakan mustahil terjadi.'],
        ['Shadow DOM', 'Lapisan DOM terisolasi: selektor induk tidak menembus ke dalam, gaya dalam tidak menembus keluar.'],
        ['Design tokens', 'Variabel berisi keputusan desain (warna, jarak, radius) yang dideklarasikan shell dan dipakai semua remote.'],
        ['Nilai cadangan', 'Nilai kedua pada var(--x, #nilai) yang dipakai bila token tidak tersedia, agar remote tetap terbaca.'],
        ['CSS reset', 'Kumpulan aturan yang menormalkan gaya bawaan peramban; hanya boleh ada di shell, satu kali saja.'],
        ['Kontrak gaya', 'Kesepakatan bersama berisi daftar token dan pola kelas yang dipakai seluruh tim.']
      ]
    }
  ],
  recap: [
    'CSS peramban berlaku global, maka setiap remote wajib memakai awalan kelasnya sendiri (.hd-, .pf-, .ct-).',
    'Tiga lapisan pertahanan: awalan selektor (murah), CSS Modules (otomatis), dan Shadow DOM (isolasi penuh).',
    'CSS reset dan aturan pada elemen dasar seperti body hanya boleh ditulis di shell, satu kali saja.',
    'Design tokens dideklarasikan di shell lalu dipakai semua remote lewat var(--accent, #nilai-cadangan) — seragam tanpa berbagi berkas CSS.',
    'Shadow DOM mengisolasi selektor, tetapi token tetap harus dibaca dari induk agar tampilan tetap satu keluarga.'
  ]
});
