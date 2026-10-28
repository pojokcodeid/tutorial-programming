/* ============================================================
   Pelajaran Micro-Frontend — Bab 20: Proyek Akhir TokoMicro
   End-to-End dan Langkah Lanjut
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-proyek-akhir-20',
  title: 'Proyek Akhir: TokoMicro End-to-End dan Langkah Lanjut',
  chapter: 'Produksi & Evolusi',
  duration: '25 menit',
  intro: [
    'Inilah bab penutup: bukan menambah fitur baru, tetapi membuktikan bahwa seluruh sistem bekerja sebagai satu toko. Kamu akan menjalankan build, pengujian, alur belanja, rilis, rollback, dan pemeriksaan produksi dalam satu urutan yang bisa diulang.',
    'TokoMicro React terdiri dari shell di port 4173 dan empat remote di 4174–4177, ditambah legacy di 4178. Setiap remote punya build, manifest, dan pemilik sendiri. Tugasmu adalah memastikan batas-batas itu tetap terlihat saat semuanya digabungkan.',
    'Setelah checkpoint end-to-end, kita memetakan langkah lanjut: lab iframe/Web Component/import map, Webpack 5 + Rspack, SSR + hydration, serta kapan sebaiknya tetap memakai Vite dan Module Federation yang sekarang.'
  ],
  objectives: [
    'Menjalankan seluruh proyek dari instalasi sampai pengujian browser',
    'Menjelaskan alur belanja lintas remote dan batas kepemilikannya',
    'Melakukan rilis, canary, dan rollback lalu membaca status remote',
    'Menilai kesiapan produksi dengan checklist end-to-end',
    'Memilih langkah lanjut: Module Federation 2.0, Rspack, atau SSR'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta Sistem yang Akan Kamu Buktikan</h3><p>Enam origin, satu pengalaman pengguna:</p><table class="vocab"><tr><th>Origin</th><th>Aplikasi</th><th>Tanggung jawab</th></tr><tr><td><code>4173</code></td><td>shell</td><td>URL, layout, login, manifest, status, API <code>/api/*</code></td></tr><tr><td><code>4174</code></td><td>header</td><td>navigasi, badge keranjang, tema, locale</td></tr><tr><td><code>4175</code></td><td>products</td><td>katalog, filter, detail, tambah ke keranjang</td></tr><tr><td><code>4176</code></td><td>cart</td><td>keranjang, checkout, pembuatan pesanan</td></tr><tr><td><code>4177</code></td><td>account</td><td>profil dan riwayat pesanan</td></tr><tr><td><code>4178</code></td><td>legacy</td><td>katalog lama statis untuk latihan migrasi</td></tr></table><p>Shell memuat remote lewat manifest <code>/api/remotes</code>. Setiap remote bisa dibuka mandiri, tetapi pengalaman utama selalu lewat shell. Legacy hanya dibuka di rute <code>/katalog-lama</code> sebagai jembatan migrasi.</p>'
    },
    {
      type: 'example',
      title: 'Jalankan seluruh proyek dari nol',
      lang: 'bash',
      output: false,
      code: `cd examples/micro-frontend-react
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:visual
npm run perf
npm start

# buka http://localhost:4173
# login demo / demo123 saat checkout
# halaman status: http://localhost:4173/status`,
      explain: [
        '<code>npm run build</code> harus selesai sebelum E2E, visual, dan perf karena semuanya membaca folder <code>dist</code>. E2E dan visual menyalakan server sendiri bila belum ada.',
        '<code>npm run test:e2e</code> menguji alur nyata: katalog, badge, login, checkout, pesanan, sesi setelah reload, tema, status, legacy, dan isolasi remote gagal.',
        '<code>npm run perf</code> memeriksa anggaran bundel. Bila ada yang melewati batas, perbaiki sebelum menyatakan proyek selesai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alur Belanja dan Batas Kepemilikan</h3><ol><li><b>Katalog.</b> Remote <code>products</code> memanggil <code>GET /api/products</code>, menampilkan filter, dan mengirim event tambah ke keranjang.</li><li><b>Badge.</b> Remote <code>header</code> membaca shared store yang sama, sehingga jumlah item berubah tanpa reload.</li><li><b>Keranjang.</b> Remote <code>cart</code> menampilkan item, jumlah, dan total. Ia tidak memanggil API remote produk.</li><li><b>Checkout.</b> Cart meminta token lewat <code>ctx.getToken()</code>. Bila belum masuk, shell mengarahkan ke <code>/masuk?next=keranjang</code>.</li><li><b>Pesanan.</b> Setelah login, <code>POST /api/orders</code> mengirim header <code>Authorization</code>. Server menghitung ulang total, bukan mempercayai angka dari klien.</li><li><b>Akun.</b> Remote <code>account</code> menampilkan profil dan riwayat pesanan dengan token dari shell.</li></ol><p>Uji isolasi kegagalan dengan memblokir request <code>remoteEntry.js</code> produk di DevTools atau mengarahkan manifest ke URL salah. Shell, header, dan keranjang harus tetap hidup; slot katalog menampilkan fallback dan tombol coba lagi.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: eksperimen rilis products 1.1.0 lalu rollback',
      lang: 'bash',
      output: false,
      code: `cd examples/micro-frontend-react
npm run build
npm start

# terminal kedua
npm run release -- products 1.1.0
curl -s http://localhost:4173/api/remotes | python3 -m json.tool

# buka http://localhost:4173/status
# pastikan products 1.1.0 dan URL /v/1.1.0/assets/remoteEntry.js
# DevTools → Network → remoteEntry.js berasal dari /v/1.1.0/

npm run rollback -- products
curl -s http://localhost:4173/api/remotes | python3 -m json.tool

# version products kembali ke versi stabil sebelumnya
# shell tidak dibangun ulang di langkah mana pun`,
      explain: [
        'Ini bukti inti micro-frontend: satu remote naik versi, shell tetap memakai build yang sama, dan pengguna hanya perlu memuat ulang halaman.',
        'Bandingkan halaman <code>/status</code> sebelum dan sesudah rollback. Versi, pemilik, status, dan URL harus konsisten dengan manifest.',
        'Bila ingin mencoba canary, tambahkan <code>--canary</code>. Di proyek ini status hanya label; produksi membutuhkan pemisahan trafik nyata di edge atau feature flag.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checkpoint Produksi End-to-End</h3><p>Proyek dinyatakan siap bila daftar berikut tercentang dengan bukti, bukan asumsi:</p><ul><li><b>Kualitas:</b> <code>typecheck</code>, <code>test</code>, <code>build</code>, <code>test:e2e</code>, <code>test:visual</code>, dan <code>perf</code> lulus.</li><li><b>Enam origin:</b> shell, header, products, cart, account, dan legacy merespons.</li><li><b>Autentikasi:</b> login <code>demo/demo123</code> dan <code>admin/admin123</code>, refresh setelah reload, logout, dan checkout terproteksi.</li><li><b>Belanja:</b> tambah produk, badge berubah, ubah jumlah, checkout, pesanan muncul di akun.</li><li><b>Ketahanan:</b> satu remote diblokir, shell dan remote lain tetap hidup, fallback muncul.</li><li><b>Rilis:</b> manifest menunjuk versi baru, rollback mengembalikan versi lama tanpa build shell.</li><li><b>Operasi:</b> <code>/status</code> menampilkan empat remote; telemetry dan Web Vitals masuk.</li><li><b>Keamanan dan aksesibilitas:</b> header dari Bab 19 diaudit; alur utama selesai dengan keyboard.</li><li><b>Dokumentasi:</b> ADR, diagram, daftar event, pemilik remote, runbook rollback, dan on-call.</li></ul><p><b>Kriteria lulus:</b> semua perintah di atas lulus, dan kamu bisa menjelaskan apa yang terjadi pada setiap langkah tanpa membuka catatan.</p>'
    },
    {
      type: 'example',
      title: 'Lab lanjutan: bandingkan teknik komposisi dan rendering',
      lang: 'bash',
      output: false,
      code: `# 1. iframe, Web Component, import map
cd examples/micro-frontend-techniques
node server.js
# buka http://localhost:4180

# 2. Webpack 5 Module Federation + varian Rspack
cd examples/micro-frontend-webpack
npm install && npm run build && npm start
# host http://localhost:4181 · remote http://localhost:4182

# 3. CSR vs SSR + hydration
cd examples/micro-frontend-ssr
npm install && npm run dev
# http://localhost:5173/ssr · http://localhost:5173/csr
# coba juga /ssr?mismatch=1`,
      explain: [
        'Di lab teknik, bandingkan cara komunikasi: <code>postMessage</code> pada iframe, <code>CustomEvent</code> pada Web Component, dan <code>import()</code> pada import map.',
        'Di lab Webpack, perhatikan <code>remoteEntry.js</code> di port 4182 dan bagaimana host memuat <code>remote/App</code>. Varian Rspack memakai konfigurasi yang sama dengan build lebih cepat.',
        'Di lab SSR, lihat View Source: <code>/ssr</code> mengirim HTML katalog, sedangkan <code>/csr</code> mengirim <code>#root</code> kosong. Bandingkan first paint dan waktu hydration.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Memilih MF 2.0, Rspack, atau SSR</h3><table class="vocab"><tr><th>Pilihan</th><th>Masalah yang dijawab</th><th>Biaya</th></tr><tr><td><b>Vite + Module Federation</b></td><td>SPA React, tim kecil–menengah, DX cepat</td><td>Runtime federasi sudah cukup; jangan menambah tooling tanpa kebutuhan</td></tr><tr><td><b>Module Federation 2.0</b></td><td>Banyak remote, manifest runtime, tipe lintas remote, devtools</td><td>Dependensi dan konfigurasi bertambah; perlu disiplin versi</td></tr><tr><td><b>Rspack</b></td><td>Build Webpack lambat, ingin kompatibilitas ekosistem Webpack</td><td>Uji plugin dan loader; belum tentu semua cocok</td></tr><tr><td><b>SSR</b></td><td>SEO dan first paint kritis</td><td>Server, hydration, mismatch, dan kompleksitas remote SSR</td></tr></table><p>Urutan keputusan yang sehat: ukur masalahnya dulu, pilih perubahan terkecil yang menjawab masalah itu, lalu uji di lab sebelum menyentuh produksi. Jangan memilih Rspack hanya karena lebih baru, atau SSR hanya karena kompetitor memakainya.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Mengukur Keberhasilan dari Jumlah Remote',
      text: 'Menambah remote per halaman terlihat seperti kemajuan, tetapi setiap remote menambah build, manifest, kontrak, on-call, dan biaya koordinasi. Ukur hasil yang penting: waktu dari commit ke produksi, frekuensi rilis, jumlah koordinasi lintas tim, error rate per remote, dan waktu pemulihan. Bila angka-angka itu tidak membaik, micro-frontend hanya menambah lapisan. Kembali ke modular monolith adalah keputusan yang sah.'
    },
    {
      type: 'vocab',
      items: [
        ['End-to-end', 'Pengujian dan verifikasi alur lengkap dari browser sampai API dan kembali.'],
        ['Canary', 'Rilis ke sebagian pengguna sebelum dipromosikan ke semua.'],
        ['Rollback', 'Mengembalikan manifest ke versi yang sudah terbukti.'],
        ['Hydration', 'Proses React mengambil alih HTML dari server dan memasang interaktivitas.'],
        ['Rspack', 'Bundler berbasis Rust yang kompatibel dengan banyak konfigurasi Webpack.'],
        ['Module Federation 2.0', 'Versi federasi dengan manifest runtime, tipe, dan devtools yang lebih kaya.'],
        ['SSR', 'Server-Side Rendering: HTML awal dibuat di server sebelum dikirim ke browser.'],
        ['Runbook', 'Panduan langkah operasional saat rilis atau insiden.'],
        ['Decommission', 'Penghapusan resmi remote, rute, atau aplikasi lama setelah tidak dipakai.']
      ]
    }
  ],
  recap: [
    'Proyek akhir membuktikan satu toko utuh: shell, empat remote, legacy, API, auth, dan rilis mandiri.',
    'Alur belanja menguji batas kepemilikan: katalog, badge, keranjang, checkout, pesanan, dan akun.',
    'Rilis 1.1.0 lalu rollback membuktikan shell tidak perlu dibangun ulang saat remote berubah.',
    'Checklist produksi mencakup kualitas, auth, ketahanan, observability, keamanan, aksesibilitas, dan dokumentasi.',
    'Langkah lanjut dipilih berdasarkan masalah terukur: MF 2.0, Rspack, atau SSR, bukan karena tren.'
  ]
});
