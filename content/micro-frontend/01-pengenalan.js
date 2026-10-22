/* ============================================================
   Pelajaran Micro-Frontend — Bab 1: Pengenalan Micro-Frontend
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-pengenalan',
  title: 'Pengenalan Micro-Frontend',
  chapter: 'Fondasi',
  duration: '13 menit',
  intro: [
    'Kamu mungkin sudah pernah merasakan hal ini: satu halaman web dikerjakan banyak orang, tetapi setiap kali ada perubahan kecil semua orang harus menunggu. Satu orang memperbaiki keranjang, satu orang memperbarui katalog, dan ketiganya harus menunggu satu pipeline build yang sama. Situasi inilah yang dijawab oleh <b>micro-frontend</b> — gaya arsitektur yang memecah halaman menjadi beberapa aplikasi kecil yang masing-masing dimiliki satu tim dan dirilis sendiri-sendiri, sementara pengguna tetap melihat satu aplikasi utuh.',
    'Materi ini memakai contoh proyek bernama <b>TokoMicro</b>: sebuah toko daring kecil yang tersusun atas satu shell dan tiga micro-frontend (header, katalog produk, keranjang). Contoh proyek lengkap yang bisa langsung dijalankan tersedia di folder <code>examples/micro-frontend/</code> — masuk ke folder itu lalu jalankan <code>node server.js</code> dan buka <code>http://localhost:4173</code>. Sepanjang materi, kode yang kamu baca adalah kode yang benar-benar berjalan di sana.',
    'Setelah bab ini kamu akan memahami apa itu micro-frontend, membedakannya dari monolith frontend, mengetahui kapan arsitektur ini layak dipakai dan kapan justru harus dihindari, serta mengenali tiga bagian utamanya: shell, remote, dan shared module.'
  ],
  objectives: [
    'Menjelaskan pengertian micro-frontend dan perbedaannya dari monolith frontend',
    'Menyebutkan tiga bagian utama micro-frontend beserta tugasnya',
    'Membedakan masalah organisasional yang dijawab micro-frontend dari sekadar masalah kode',
    'Menimbang kapan arsitektur ini cocok dipakai dan kapan sebaiknya ditolak',
    'Menggambar susunan shell dan remote untuk produk sendiri'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa Itu Micro-Frontend?</h3><p><b>Micro-frontend</b> adalah cara menyusun sebuah aplikasi web dari beberapa aplikasi frontend kecil yang masing-masing: dimiliki satu tim, dibangun dan diuji sendiri, dirilis tanpa menunggu yang lain, lalu digabungkan saat halaman dibuka oleh sebuah wadah bernama <b>shell</b>.</p><p>Istilah ini dipopulerkan Cam Jackson dari ThoughtWorks. Penekanannya bukan "memecah kode menjadi kecil", melainkan <b>memecah kepemilikan tim</b>. Ketika satu tim bertanggung jawab penuh atas satu bagian halaman — dari kode, pengujian, sampai pemantauan di produksi — tim itu bisa bergerak cepat tanpa terus berkoordinasi dengan tim lain.</p>'
    },
    {
      type: 'example',
      title: 'Monolith frontend vs micro-frontend',
      lang: 'text',
      output: false,
      code: `MONOLITH FRONTEND
  Satu aplikasi, satu repository, satu pipeline, satu tim (atau banyak tim)
  Hasil build: berkas-bundel tunggal untuk seluruh halaman
  Rilis      : semua bagian naik bersamaan — perbaikan tombol checkout
               menunggu selesainya perubahan dasbor penjual
  Risiko     : satu bug bisa menjatuhkan seluruh halaman

MICRO-FRONTEND
  Shell (wadah)        : layout, navigasi, routing, login
  remote:header        : milik Tim A — rilis kapan saja
  remote:products      : milik Tim B — rilis kapan saja
  remote:cart          : milik Tim C — rilis kapan saja
  Hasil build : satu bundel untuk shell + satu bundel untuk tiap remote
  Rilis       : per remote, sering kali beberapa kali sehari
  Risiko      : kegagalan terbatas pada satu bagian halaman`,
      explain: [
        'Perhatikan baris "Hasil build": pada micro-frontend, satu halaman mengunduh beberapa berkas bundel sekaligus — konsekuensi langsung dari rilis yang terpisah.',
        'Yang dibeli dari arsitektur ini adalah kecepatan rilis dan kejelasan kepemilikan; yang dibayar adalah kompleksitas komposisi, routing, dan pengujian lintas bagian.',
        'Kata "micro" di sini menyangkut organisasi, bukan ukuran baris kode. Sebuah remote bisa saja berisi ribuan baris asalkan satu tim menguasainya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tiga Bagian yang Wajib Kamu Kenal</h3><p>Semua micro-frontend, apa pun tooling-nya, tersusun dari tiga hal yang sama. Mengenali peran ketiganya lebih penting daripada menghafal nama pustaka.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 260" width="760" role="img" aria-label="Susunan TokoMicro: shell menampung remote header, products, dan cart, di atasnya ada shared module"><rect x="230" y="15" width="300" height="46" rx="8" class="u-hd"/><text x="380" y="37" class="u-title" text-anchor="middle">SHELL — pemilik URL &amp; layout</text><text x="380" y="54" class="u-lbl" text-anchor="middle">routing · lazy load · login · error boundary</text><line x1="130" y1="61" x2="130" y2="95" class="u-line" marker-end="url(#u-arrow)"/><line x1="380" y1="61" x2="380" y2="95" class="u-line" marker-end="url(#u-arrow)"/><line x1="630" y1="61" x2="630" y2="95" class="u-line" marker-end="url(#u-arrow)"/><rect x="45" y="100" width="170" height="52" rx="8" class="u-box"/><text x="130" y="122" class="u-title" text-anchor="middle">remote: header</text><text x="130" y="140" class="u-lbl" text-anchor="middle">milik Tim A</text><rect x="295" y="100" width="170" height="52" rx="8" class="u-box"/><text x="380" y="122" class="u-title" text-anchor="middle">remote: products</text><text x="380" y="140" class="u-lbl" text-anchor="middle">milik Tim B</text><rect x="545" y="100" width="170" height="52" rx="8" class="u-box"/><text x="630" y="122" class="u-title" text-anchor="middle">remote: cart</text><text x="630" y="140" class="u-lbl" text-anchor="middle">milik Tim C</text><line x1="130" y1="152" x2="130" y2="196" class="u-line"/><line x1="380" y1="152" x2="380" y2="196" class="u-line"/><line x1="630" y1="152" x2="630" y2="196" class="u-line"/><rect x="160" y="200" width="440" height="44" rx="8" class="u-hl"/><text x="380" y="221" class="u-title" text-anchor="middle">SHARED MODULE — dipakai bersama</text><text x="380" y="237" class="u-lbl" text-anchor="middle">event bus · state keranjang · design tokens</text></svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Tiga bagian micro-frontend: shell di atas, remote di tengah, shared module yang menopang semuanya</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Tugas masing-masing bagian',
      lang: 'text',
      output: false,
      code: `SHELL (aplikasi induk)
  • menentukan tampilan dasar: header, area konten, footer
  • memetakan URL ke remote mana yang harus dimuat
  • memuat remote secara malas lalu memanggil mount()/unmount()
  • menangani login dan menampilkan pesan bila remote gagal
  • TIDAK tahu isi internal remote mana pun

REMOTE (mikro-frontend)
  • aplikasi kecil yang punya berkas entri sendiri
  • diekspor lewat mount(container, ctx) dan unmount()
  • memanggil API miliknya sendiri
  • memakai awalan gaya CSS sendiri (.hd-, .pf-, .ct-)
  • hanya berkomunikasi lewat shared module

SHARED MODULE
  • berkas kecil yang dipakai beberapa remote sekaligus
  • berisi: event bus, state bersama (keranjang), design tokens
  • TIDAK BOLEH mengimpor remote mana pun`,
      explain: [
        'Perhatikan dua larangan pada catatan di atas: shell tidak boleh tahu isi remote, dan shared module tidak boleh mengimpor remote. Keduanya adalah pagar yang menjaga agar rilis tetap mandiri.',
        'Bila kamu menemukan dirimu menambahkan isi remote ke shell "sekadar agar cepat", itulah tanda arsitektur mulai melorot kembali menjadi monolith — hanya saja kali ini lebih berantakan.',
        'Shared module memang sengaja dibuat sedikit. Setiap isinya mengikat beberapa tim dalam satu berkas, jadi hanya hal yang benar-benar disepakati bersama yang layak masuk.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Masalah yang Benar-Benar Dijawab</h3><p>Banyak tim mencoba micro-frontend karena merasa kodenya berantakan. Sebenarnya ada tiga masalah nyata yang dijawab arsitektur ini, dan ketiganya bersifat <b>organisasional</b>:</p><ol><li><b>Banyak tim saling menunggu.</b> Perubahan kecil pada satu bagian memaksa tim lain menguji dan merilis ulang bagian mereka, walau tidak ada hubungannya.</li><li><b>Ritme rilis berbeda.</b> Bagian kasir mungkin butuh rilis harian, sedangkan bagian profil cukup per bulan. Satu pipeline memaksa keduanya mengikuti irama terlambat.</li><li><b>Migrasi bertahap.</b> Aplikasi lama terlalu besar untuk ditulis ulang sekaligus; dibagi menjadi remote, bagian per bagian bisa diganti tanpa menghentikan layanan.</li></ol><p>Sebaliknya, kalau masalahmu hanya "kodenya tidak rapi", jawabannya adalah modularisasi kode dan aturan yang jelas — bukan menambah lapisan komposisi.</p>'
    },
    {
      type: 'example',
      title: 'Pembagian tim untuk TokoMicro',
      lang: 'text',
      output: false,
      code: `Tim A — "Chrome"
  Kepemilikan : remote header (navigasi, badge, tema, bahasa)
  API dipakai : tidak ada — cukup membaca shared store
  Rilis       : bebas, rata-rata 2x seminggu

Tim B — "Katalog"
  Kepemilikan : remote products (daftar, filter, pencarian, detail)
  API dipakai : GET /api/products, GET /api/products/{id}
  Rilis       : bebas, rata-rata tiap hari

Tim C — "Transaksi"
  Kepemilikan : remote cart (daftar item, jumlah, checkout)
  API dipakai : POST /api/orders
  Rilis       : bebas, rata-rata 3x seminggu

Kesepakatan bersama (dibahas sekali, lalu jarang disentuh)
  • bentuk event     : cart:change berisi daftar item
  • bentuk store     : addItem, changeQty, removeItem, cartSummary
  • design tokens    : --accent, --card, --text (milik shell)`,
      explain: [
        'Setiap tim punya daftar kepemilikan yang tegas: kalau ada bug di keranjang, tidak ada pertanyaan "ini tim siapa?" — jawabannya sudah terlihat di tabel.',
        'API dipakai bukan berarti dimiliki: remote cart memanggil POST /api/orders, tetapi endpoint itu milik tim backend, bukan milik remote cart.',
        'Bagian "kesepakatan bersama" adalah daftar paling mahal — di situlah tiga tim harus sepakat sebelum kode ditulis. Semakin pendek daftar ini, semakin mandiri timnya.'
      ]
    },
    {
      type: 'warn',
      title: 'Kapan Arsitektur Ini Justru Harus Ditolak',
      text: 'Jangan memakai micro-frontend bila timmu hanya satu atau dua orang: rilis mandiri tidak berarti apa-apa bila kamu sendirian yang menyentuh semua bagian, sementara kamu tetap harus membayar biaya routing, isolasi gaya, dan pengujian lintas modul. Tolak juga bila aplikasimu masih berupa beberapa halaman sederhana, atau bila tim belum memiliki otomatisasi pengujian — komposisi tanpa pengujian otomatis membuat setiap rilis terasa seperti menebak. Aturan praktisnya: pilih arsitektur ini ketika masalahnya <b>koordinasi antar tim</b>, bukan karena ingin terlihat modern.'
    },
    {
      type: 'tip',
      title: 'Belajar dari Modular Monolith Dulu',
      text: 'Sebelum memecah deployment, pecah dulu mentalnya. Tetaplah membangun satu aplikasi, tetapi pisahkan tiap bagian ke dalam modul dengan batas yang jelas: satu folder, satu tanggung jawab, komunikasi lewat antarmuka yang kecil. Bila sebuah modul sudah bisa dijelaskan, diuji, dan dirilis secara terpisah dalam pikiranmu, barulah ia siap dijadikan remote. Banyak tim menemukan bahwa modular monolith ternyata sudah cukup — dan itu bukan kegagalan, melainkan keputusan yang tepat waktu.'
    },
    {
      type: 'vocab',
      items: [
        ['Micro-frontend', 'Potongan aplikasi frontend yang dimiliki satu tim, dibangun dan dirilis mandiri, lalu digabungkan menjadi satu halaman oleh shell.'],
        ['Shell (container/host)', 'Aplikasi induk pemilik URL, layout, routing, autentikasi global, dan pemanggil siklus hidup remote.'],
        ['Remote', 'Micro-frontend individual yang diekspor sebagai modul masuk (entry) dan dipasang ke slot DOM yang disediakan shell.'],
        ['Shared module', 'Modul kecil yang dipakai bersama beberapa remote, seperti event bus, state keranjang, dan design tokens.'],
        ['Komposisi', 'Cara remote digabungkan menjadi satu halaman: saat build, saat runtime di peramban, atau di server.'],
        ['Rilis mandiri', 'Kemampuan merilis satu remote tanpa membangun ulang atau menunggu remote lain.'],
        ['Distributed monolith', 'Kondisi ketika modul-modul yang berpura-pura terpisah ternyata harus selalu rilis bersamaan karena ketergantungan erat.'],
        ['Hukum Conway', 'Prinsip bahwa struktur produk cenderung mencerminkan struktur tim yang membangunnya.']
      ]
    }
  ],
  recap: [
    'Micro-frontend menyusun satu halaman dari beberapa aplikasi kecil yang masing-masing dimiliki satu tim dan dirilis mandiri, dengan shell sebagai penggabungnya.',
    'Tiga bagiannya: shell (pemilik URL, layout, siklus hidup), remote (aplikasi kecil dengan mount/unmount), dan shared module (event bus, state bersama, design tokens).',
    'Masalah yang dijawab bersifat organisasional: tim saling menunggu, ritme rilis berbeda, dan migrasi bertahap — bukan sekadar kode yang berantakan.',
    'Micro-frontend tidak cocok untuk tim kecil, aplikasi sederhana, atau tim tanpa otomatisasi pengujian.',
    'Contoh proyek TokoMicro (shell + remote header, products, cart) bisa dijalankan dari examples/micro-frontend/ untuk mengikuti seluruh materi ini.'
  ]
});
