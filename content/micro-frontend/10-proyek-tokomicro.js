/* ============================================================
   Pelajaran Micro-Frontend — Bab 10: Proyek Akhir TokoMicro React
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-proyek-tokomicro',
  title: 'Proyek Akhir: TokoMicro React',
  chapter: 'Proyek',
  duration: '24 menit',
  intro: [
    'Seluruh materi ini bermuara di satu proyek nyata bernama <b>TokoMicro</b> — toko daring kecil yang tersusun atas satu shell dan tiga micro-frontend: header, katalog produk, dan keranjang. Versi yang kamu jalankan di bab ini adalah <b>TokoMicro React</b> yang sudah jadi: React 18, Vite, dan Module Federation, lengkap dengan uji E2E.',
    'Proyek contoh ada di folder <code>examples/micro-frontend-react/</code>. Cukup tiga perintah — <code>npm install</code>, <code>npm run build</code>, <code>npm start</code> — lalu buka <code>http://localhost:4173</code>. Di situ empat aplikasi React yang dibangun terpisah hidup berdampingan dalam satu halaman, persis seperti yang kamu baca sepanjang bab-bab sebelumnya.',
    'Masih ada juga versi pendahulunya di <code>examples/micro-frontend/</code> — vanilla JavaScript tanpa framework dan tanpa build. Versi itu sengaja dibuat telanjang agar konsep terlihat apa adanya; begitu konsepnya pindah, inilah bentuk produksinya.'
  ],
  objectives: [
    'Menjalankan TokoMicro React dari folder contoh',
    'Menyelesaikan panduan build langkah 1–5 dari cek prasyarat sampai aplikasi terbuka di browser',
    'Menjelaskan susunan monorepo dan peran tiap workspace',
    'Membaca konfigurasi Module Federation pada shell dan remote',
    'Menjelaskan bagaimana state keranjang tetap satu instance di empat bundel berbeda',
    'Menguji rilis mandiri dan isolasi kegagalan pada contoh React',
    'Mengikuti praktik langkah 0–6 dari persiapan lingkungan sampai uji E2E, lengkap dengan verifikasi tiap langkah'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta Lengkap TokoMicro React</h3><p>Susunan proyek ini adalah gambaran langsung dari seluruh materi: satu proses Node menyajikan empat alamat (origin) berbeda — meniru deployment asli tempat tiap remote berada di server atau CDN sendiri — lalu shell merangkai ketiga remote itu di browser memakai Module Federation.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Struktur TokoMicro React: server.js menyajikan empat origin, shell React memuat tiga remote lewat Module Federation, shared module menopang state"><rect x="230" y="10" width="300" height="46" rx="8" class="u-hd"/><text x="380" y="30" class="u-title" text-anchor="middle">server.js — Node.js</text><text x="380" y="47" class="u-lbl" text-anchor="middle">4173 shell · 4174 header · 4175 products · 4176 cart</text><line x1="380" y1="56" x2="380" y2="84" class="u-line" marker-end="url(#u-arrow)"/><rect x="130" y="88" width="500" height="60" rx="8" class="u-box"/><text x="380" y="112" class="u-title" text-anchor="middle">shell (React 18 + Vite)</text><text x="380" y="130" class="u-lbl" text-anchor="middle">routing hash · React.lazy · ErrorBoundary per remote</text><text x="380" y="144" class="u-lbl" text-anchor="middle">ctx = { route, navigate, toast }</text><line x1="200" y1="148" x2="130" y2="184" class="u-line" marker-end="url(#u-arrow)"/><line x1="380" y1="148" x2="380" y2="184" class="u-line" marker-end="url(#u-arrow)"/><line x1="560" y1="148" x2="630" y2="184" class="u-line" marker-end="url(#u-arrow)"/><text x="380" y="172" class="u-lbl" text-anchor="middle">import() → remoteEntry.js (federasi)</text><rect x="30" y="188" width="200" height="50" rx="8" class="u-box"/><text x="130" y="210" class="u-title" text-anchor="middle">remote: header :4174</text><text x="130" y="228" class="u-lbl" text-anchor="middle">badge dari state bersama</text><rect x="280" y="188" width="200" height="50" rx="8" class="u-box"/><text x="380" y="210" class="u-title" text-anchor="middle">remote: products :4175</text><text x="380" y="228" class="u-lbl" text-anchor="middle">katalog + fetch API sendiri</text><rect x="530" y="188" width="200" height="50" rx="8" class="u-box"/><text x="630" y="210" class="u-title" text-anchor="middle">remote: cart :4176</text><text x="630" y="228" class="u-lbl" text-anchor="middle">jumlah item + checkout</text><line x1="130" y1="238" x2="130" y2="258" class="u-dash"/><line x1="380" y1="238" x2="380" y2="258" class="u-dash"/><line x1="630" y1="238" x2="630" y2="258" class="u-dash"/><rect x="160" y="262" width="440" height="34" rx="8" class="u-hl"/><text x="380" y="277" class="u-title" text-anchor="middle">packages/shared — @tokomicro/shared</text><text x="380" y="292" class="u-lbl" text-anchor="middle">state keranjang satu instance (globalThis) · tanpa React</text></svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — TokoMicro React: empat origin terpisah dirangkai shell lewat Module Federation, state bersama menopang ketiga remote</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Struktur folder proyek',
      lang: 'text',
      output: false,
      code: `examples/micro-frontend-react/
├── package.json            # npm workspaces + skrip build / start
├── server.js               # 4 origin (CORS terbuka) + API palsu
├── e2e-smoke.mjs           # uji E2E Playwright (opsional)
├── packages/
│   └── shared/             # @tokomicro/shared — dipakai semua remote
│       └── index.js        # state keranjang + rupiah(), tanpa React
└── apps/
    ├── shell/              # aplikasi induk — Tim Inti
    │   ├── vite.config.js  # remotes + shared react singleton
    │   └── src/App.jsx     # routing, React.lazy, ErrorBoundary, toast
    ├── header/             # remote Tim A — badge keranjang (.hd-)
    │   ├── vite.config.js  # exposes: { './App': './src/App.jsx' }
    │   └── src/App.jsx
    ├── products/           # remote Tim B — katalog, filter (.pf-)
    └── cart/               # remote Tim C — keranjang + checkout (.ct-)`,
      explain: [
        'Tiap aplikasi punya <code>package.json</code> dan <code>vite.config.js</code> sendiri — pipeline boleh membangun salah satunya saja: <code>npm run build -w @tokomicro/products</code>.',
        'Bentuk kontrak berpindah dari <code>mount()/unmount()</code> menjadi komponen React biasa; siklus hidupnya kini diurus React sendiri.',
        '<code>packages/shared</code> sengaja tidak memakai React — remote yang kelak pindah framework tetap bisa memakai state yang sama.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan proyek',
      lang: 'bash',
      output: false,
      code: `cd examples/micro-frontend-react

npm install        # sekali saja — seluruh workspace terpasang bersama
npm run build      # shell + 3 remote dibangun TERPISAH, masing-masing
npm start          # 4173 shell · 4174 header · 4175 products · 4176 cart

# buka http://localhost:4173
# rebuild satu remote saja, tanpa menyentuh yang lain:
npm run build -w @tokomicro/products`,
      explain: [
        'Perintah <code>npm run build</code> berjalan di setiap workspace — persis seperti pipeline per remote pada bab 9: yang berubah hanya yang dibangun ulang.',
        'Empat port dipakai agar shell benar-benar memuat remote <b>lintas origin</b>, seperti penggunaan CDN sungguhan. <code>server.js</code> membuka CORS karena memang itu gunanya.',
        'Seluruh alamat remote bisa diganti lewat variabel lingkungan (misal <code>CART_REMOTE</code>) tanpa mengubah kode shell.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kontrak yang Sama, Alat yang Berbeda</h3><p>Sepanjang materi, shell memanggil <code>mount(container, ctx)</code> lalu <code>unmount()</code>. Pada React, kontrak itu diterjemahkan menjadi komponen yang dimuat malas: shell mengimpor modul remote sesuai rute, merendernya di dalam slot, dan membiarkan React mengurus pemasangan maupun pembongkaran — termasuk membersihkan langganan state lewat <i>cleanup effect</i>.</p>'
    },
    {
      type: 'example',
      title: 'Shell memuat remote sesuai rute',
      lang: 'jsx',
      output: false,
      code: `// apps/shell/src/App.jsx
const ROUTES = {
  katalog:   { label: 'Katalog',   load: () => import('products/App') },
  keranjang: { label: 'Keranjang', load: () => import('cart/App') }
};

// remote dibuat BARU setiap kali "Coba lagi" ditekan —
// React.lazy yang sudah gagal tidak boleh dipakai ulang.
const Remote = useMemo(
  () => remoteComponent(entry.label, entry.load),
  [entry, attempt]
);

return (
  <main className="view">
    <ErrorBoundary
      key={route + ':' + attempt}
      fallback={<div className="error-box">…tombol Coba lagi…</div>}
    >
      <Suspense fallback={<Skeleton />}>
        <Remote ctx={ctx} />
      </Suspense>
    </ErrorBoundary>
  </main>
);`,
      explain: [
        '<code>import(\'products/App\'</code> adalah modul yang diekspos remote lewat <code>exposes</code> — shell tidak pernah tahu berkas internal remote, hanya kontraknya.',
        '<code>Suspense</code> menyediakan kerangka pemuatan dari bab 3; <code>ErrorBoundary</code> menyediakan kotak pemulihan dari bab 8.',
        'Kunci <code>key</code> pada boundary dan pembuatan ulang komponen lazy memastikan tombol <b>Coba lagi</b> benar-benar memuat ulang remote yang rusak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>State Keranjang yang Tetap Satu</h3><p>Tantangan khas React pada micro-frontend: empat aplikasi, empat bundel, tetapi jumlah keranjang di header dan isi keranjang di halaman keranjang wajib sama. Jawabannya memakai pola <b>state eksternal</b> — sumber kebenarannya disimpan di luar React, dan tiap komponen menyubscribe perubahannya.</p>'
    },
    {
      type: 'example',
      title: 'Modul bersama: satu instance di empat bundel',
      lang: 'js',
      output: false,
      code: `// packages/shared/index.js
const NS = (globalThis.__TOKOMICRO__ ??= {});
if (!NS.cart) NS.cart = { items: [], listeners: new Set() };
const cart = NS.cart;             // siapa pun yang membuka duluan membuatnya

export function subscribe(listener) {
  cart.listeners.add(listener);
  return () => cart.listeners.delete(listener);   // cleanup otomatis React
}

export function getSnapshot() {
  return cart.items;              // identitas berubah hanya saat isi berubah
}

export function addItem(product) {
  cart.items = [...cart.items, { ...product, qty: 1 }];
  for (const fn of [...cart.listeners]) fn();     // satu listener gagal tak merusak lain
}`,
      explain: [
        'Meski tiap remote menggandakan berkas ini ke bundelnya sendiri, seluruh state bermuara pada satu objek di <code>globalThis</code> — sehingga badge header dan daftar keranjang tidak mungkin berbeda.',
        '<code>getSnapshot</code> harus mengembalikan nilai yang identik bila isi tidak berubah; karena itu array ditulis ulang (imut), bukan diubah di tempat.',
        'Alternatif yang setara: daftarkan paket ini di <code>shared</code> Module Federation dengan <code>singleton: true</code> — bundler-lah yang menjamin satu salinan.'
      ]
    },
    {
      type: 'example',
      title: 'Remote membaca state bersama',
      lang: 'jsx',
      output: false,
      code: `// apps/header/src/App.jsx
import { useSyncExternalStore } from 'react';
import { cartSummary, getSnapshot, subscribe } from '@tokomicro/shared';

export default function Header({ ctx }) {
  const items = useSyncExternalStore(subscribe, getSnapshot);
  const { qty } = cartSummary(items);

  return (
    <header className="hd">
      <a className="hd-brand" href="#/katalog">🛍️ TokoMicro</a>
      <nav>
        <a href="#/katalog" className={ctx.route === 'katalog' ? 'is-active' : ''}>Katalog</a>
        <a href="#/keranjang" className={ctx.route === 'keranjang' ? 'is-active' : ''}>
          Keranjang {qty > 0 && <span className="hd-badge">{qty}</span>}
        </a>
      </nav>
    </header>
  );
}`,
      explain: [
        '<code>useSyncExternalStore</code> adalah hook React untuk state eksternal: ia menyubscribe otomatis dan <b>membersihkan langganan saat remote dibongkar</b> — persis jawaban atas peringatan <i>listener leak</i> pada bab 4.',
        'Produk menulis dengan <code>addItem(product)</code>, header membaca lewat langganan, keranjang merender daftannya — tiga remote, satu data, tanpa saling mengimpor.',
        'Navigasi memakai <code>href="#/…"</code> biasa: URL tetap media komunikasi paling sederhana antar remote.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Peta ke Bab-Bab Sebelumnya</h3><p>Setiap potongan proyek ini adalah penerjemahan langsung dari konsep yang sudah dibahas. Tabel berikut membantumu menemukan kembali lokasi ide ketika kelak membaca ulang kodenya.</p>'
    },
    {
      type: 'example',
      title: 'Konsep materi ↔ berkas proyek',
      lang: 'text',
      output: false,
      code: `kontrak mount()/unmount()      → komponen React + React.lazy      (bab 3)
import() dinamis per rute      → import('products/App') federasi   (bab 3 & 7)
kerangka pemuatan (skeleton)   → fallback <Suspense>               (bab 3)
error boundary per remote      → <ErrorBoundary key=route>         (bab 8)
event bus & shared store       → @tokomicro/shared + hook          (bab 4)
awalan kelas .hd-/.pf-/.ct-    → CSS per remote + token var()      (bab 5)
AbortController saat bongkar   → efek bersih di remote products    (bab 3 & 6)
remoteEntry + shared singleton → vite.config.js tiap aplikasi      (bab 7)
observability waktu muat       → log [shell] remote "…" ms         (bab 8)
pengujian E2E komposisi        → e2e-smoke.mjs (Playwright)        (bab 8)`,
      explain: [
        'Bila kamu bisa menunjuk berkas mana yang mewakili tiap baris, berarti seluruh materi sudah tersusun utuh di kepalamu.',
        'Perbedaan terbesar hanya pada baris pertama: siklus hidup yang dulu kamu tulis sendiri, sekarang diurus React — tapi tanggung jawabnya sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Panduan Build: Dari Nol sampai Berjalan</h3><p>Sebelum menyentuh praktik, kita bangun proyeknya dari keadaan paling awal — folder yang baru di-clone, belum ada apa pun di dalamnya. Panduan ini disusun menjadi lima build berurutan, masing-masing dengan tujuan, perintah, hasil yang diharapkan, dan cara memverifikasi. Kerjakan berurutan; setelah Build 5 selesai, aplikasinya benar-benar bisa dibuka dan dipakai.</p><p>Satu hal yang membedakan proyek ini dari aplikasi React biasa: <b>Mode dev Vite tidak digunakan sama sekali</b>. Federasi bekerja pada hasil build, jadi setiap perubahan kode selalu diakhiri dengan <code>npm run build</code> — inilah alasan build diletakkan paling depan.</p>'
    },
    {
      type: 'example',
      title: 'Build 1 — Cek prasyarat',
      lang: 'text',
      output: false,
      code: `TUJUAN     : memastikan alat yang dibutuhkan sudah terpasang

PERINTAH   : (Terminal mana pun)
   node -v
   npm -v

HASIL      : node ≥ v18   dan   npm ≥ 8
             (contoh ini diuji pada Node 24 + npm 11)

BILA GAGAL : "command not found" → pasang Node.js LTS dari nodejs.org
             lalu buka ulang terminal, ulangi dua perintah di atas`,
      explain: [
        'Node hanya dibutuhkan untuk dua hal: menjalankan <code>npm install</code> dan menjalankan <code>server.js</code> — keduanya sudah termasuk dalam proyek, tanpa instalasi global lain.',
        'Bila versi Node di bawah 18, build Vite akan langsung menolak berjalan dengan pesan versi yang jelas.'
      ]
    },
    {
      type: 'example',
      title: 'Build 2 — Instalasi satu kali untuk seluruh workspace',
      lang: 'text',
      output: false,
      code: `TUJUAN     : memasang dependensi keempat aplikasi sekaligus

PERINTAH   : (Terminal 2)
   cd examples/micro-frontend-react
   npm install

HASIL      : folder node_modules terbentuk; npm mencetak jumlah paket
             yang terpasang tanpa error merah

MENGAPA    : proyek memakai npm workspaces — satu instalasi melayani
             packages/shared dan keempat apps/*, sehingga "@tokomicro/shared"
             bisa langsung diimpor tiap aplikasi tanpa dipublikasikan

VERIFIKASI :
   ls node_modules/@tokomicro
   → tercantum bersama-sama:  cart  header  products  shell  shared

CATATAN    : cukup SEKALI. Ulangi hanya bila package.json berubah.`,
      explain: [
        'Poin "cukup sekali" penting untuk diingat: instalasi menghubungkan seluruh workspace, sedangkan build yang dijalankan berulang-ulang hanya untuk perubahan kode.',
        'Kalau <code>npm install</code> diminta izin menjalankan skrip pascapemasangan (misal esbuild), izinkan — itu bagian normal dari tooling Vite.'
      ]
    },
    {
      type: 'example',
      title: 'Build 3 — Bangun keempat aplikasi',
      lang: 'text',
      output: false,
      code: `TUJUAN     : menghasilkan berkas siap saji per aplikasi

PERINTAH   : (Terminal 2) — satu perintah untuk semua:
   npm run build

             atau bangun satu per satu (yang akan dipakai sepanjang praktik):
   npm run build -w @tokomicro/shell
   npm run build -w @tokomicro/header
   npm run build -w @tokomicro/products
   npm run build -w @tokomicro/cart

HASIL      : folder dist terbentuk di tiap aplikasi:
   apps/shell/dist      → index.html + bundel shell (React, routing, boundary)
   apps/header/dist     → remoteEntry.js + chunk header + CSS .hd-
   apps/products/dist   → remoteEntry.js + chunk katalog + CSS .pf-
   apps/cart/dist       → remoteEntry.js + chunk keranjang + CSS .ct-

CATATAN    : remoteEntry.js adalah "pintu masuk" remote (bab 7);
             berkas itulah yang akan dimuat shell lewat federasi.

URUTAN BEBAS: keempat aplikasi saling tidak menunggu — bukti pertama
             bahwa build-nya benar-benar mandiri.`,
      explain: [
        'Perintah <code>-w</code> (workspace) akan kamu pakai terus-menerus di praktik berikutnya: mengubah satu remote cukup satu perintah build.',
        'Kalau build berhenti dengan pesan galat, baca baris pertamanya — hampir selalu typo pada <code>vite.config.js</code> atau berkas JSX yang tidak lengkap.',
        'Hasil build bersifat statis: folder <code>dist</code> ini yang nanti disajikan server, dan di produksi diunggah ke CDN.'
      ]
    },
    {
      type: 'example',
      title: 'Build 4 — Periksa hasil build',
      lang: 'text',
      output: false,
      code: `TUJUAN     : memastikan tiap remote benar-benar menghasilkan entri federasi

PERINTAH   : (Terminal 2)
   ls apps/shell/dist
   ls apps/products/dist/assets

HASIL      : apps/shell/dist        → index.html  assets/
             apps/products/dist/assets → remoteEntry.js  index-*.js  index-*.css

VERIFIKASI : (periksa berkas HTML hasil build)
   cat apps/shell/dist/index.html
   → tag script menunjuk berkas di assets/ (hasil build),
     BUKAN lagi /src/main.jsx (berkas sumber)

BILA GAGAL : dist tidak ada atau kosong → build belum berjalan / gagal;
             jalankan ulang "npm run build" dan baca pesan error pertamanya`,
      explain: [
        'Langkah periksa ini terlihat sepele, tetapi menyelamatkan separuh waktu debugging: server yang menyajikan folder kosong akan membuat bingung karena semua terlihat "jalan tapi kosong".',
        'Nama berkas <code>index-*.js</code> memuat content hash — tiap build menghasilkan nama baru, sehingga cache tidak pernah menyimpan berkas basi (bab 7).'
      ]
    },
    {
      type: 'example',
      title: 'Build 5 — Nyalakan server dan buka aplikasinya',
      lang: 'text',
      output: false,
      code: `TUJUAN     : menyajikan keempat hasil build + API palsu

PERINTAH   : (Terminal 1 — dibiarkan hidup)
   npm start

HASIL      : empat baris port tercetak:
   shell     → http://localhost:4173
   header    → http://localhost:4174
   products  → http://localhost:4175
   cart      → http://localhost:4176
   TokoMicro (React) siap. Buka http://localhost:4173

VERIFIKASI : (Terminal 2)
   curl -sI http://localhost:4173/                        → HTTP 200
   curl -sI http://localhost:4175/assets/remoteEntry.js   → HTTP 200
   curl -s http://localhost:4173/api/products             → deret JSON 6 produk

             (browser) buka http://localhost:4173
   → katalog 6 produk tampil, header "🛍️ TokoMicro" menempel di atas

═══════════════════════════════════════════════════════════
 BUILD SELESAI — APLIKASI SUDAH BISA DIJALANKAN
 lanjut ke "Praktik Langkah demi Langkah" di bawah
═══════════════════════════════════════════════════════════

BILA PORT TERPAKAI :
   lsof -i :4173
   → tutup proses yang memakainya, lalu npm start ulang`,
      explain: [
        'Empat port berbeda disengaja: shell harus memuat remote <b>lintas origin</b>, persis seperti memakai CDN sungguhan — karena itu <code>server.js</code> membuka CORS.',
        'Kalau browser menampilkan pesan 503 "hasil build belum ada", kembali ke Build 3 — server sudah hidup, tetapi folder <code>dist</code> belum terbentuk.',
        'Kini keempat aplikasi React berjalan: satu shell sebagai pemilik halaman, tiga remote yang dimuat sesuai rute.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Praktik Langkah demi Langkah</h3><p>Setelah Build 5 di atas selesai, bagian ini bisa diikuti lurus dari atas ke bawah, sambil dikerjakan. Setiap langkah memuat empat bagian yang sama: <b>tujuan</b> (apa yang dibuktikan), <b>aksi</b> (perintah atau klik apa), <b>hasil yang diharapkan</b>, dan <b>verifikasi</b> (bagaimana tahu berhasil). Bila satu langkah gagal, jangan lanjut dulu — kotak <i>Bila Macet</i> di akhir berisi penyebab paling umum beserta cara memulihkannya.</p><p>Gunakan dua terminal: Terminal 1 untuk server yang <b>dibiarkan hidup sepanjang praktik</b>, Terminal 2 untuk perintah build dan uji. Mengubah kode selalu diakhiri <code>npm run build -w &lt;workspace&gt;</code> — kembali ke Build 3 bila ragu.</p>'
    },
    {
      type: 'example',
      title: 'Langkah 0 — Pastikan build & server siap',
      lang: 'text',
      output: false,
      code: `TUJUAN     : memastikan Build 1–5 di atas benar-benar selesai,
             supaya seluruh praktik berikutnya berjalan mulus

SYARAT     : "Panduan Build" sudah diikuti — tandanya:
   • node_modules sudah terpasang (Build 2)
   • folder dist terbentuk di keempat aplikasi (Build 3–4)
   • server hidup di Terminal 1 (Build 5)

CEKAT      : (browser) buka http://localhost:4173
   ✓ header "🛍️ TokoMicro" menempel di atas
   ✓ 6 produk tampil, tiap kartu punya "Tambah ke keranjang"
   ✓ tidak ada kotak merah ErrorBoundary

   (Terminal 2, bila ragu server masih hidup)
   curl -sI http://localhost:4173/                          → HTTP 200
   curl -sI http://localhost:4176/assets/remoteEntry.js     → HTTP 200

BILA BELUM  : kembali ke Build 2–5 — jangan lanjut ke Langkah 1.
             Seluruh praktik berikutnya bergantung pada server yang hidup.`,
      explain: [
        'Langkah 0 sengaja hanya berisi pemeriksaan, bukan perintah build lagi — panduan lengkapnya ada tepat di atas, pada bagian <i>Panduan Build</i>.',
        'Pembagian ini mencerminkan alur kerja sehari-hari: setup (install + build) dilakukan sekali, sedangkan pengujian dijalankan berulang-ulang.',
        'Kalau keempat tanda centang terpenuhi, kamu siap masuk ke Langkah 1 tanpa ragu-ragu.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 1 — Alur utama: dari produk sampai pesanan',
      lang: 'text',
      output: false,
      code: `TUJUAN     : membuktikan state bersama dan API bekerja utuh

AKSI       : (browser, http://localhost:4173)
   1. Tekan "Tambah ke keranjang" pada Keyboard Mekanik
      → toast hijau muncul: "Keyboard Mekanik masuk keranjang"
   2. Ulangi pada Mouse Nirkabel
   3. Lihat header: badge keranjang menunjukkan angka 2 (tanpa reload)
   4. Klik menu "Keranjang"
      → dua item tertera, Total Rp1.070.000
   5. Tekan "+" pada Mouse Nirkabel
      → subtotal item, total, dan badge header berubah serentak
   6. Tekan "Buat pesanan"
      → kotak sukses: "✅ Pesanan ORD-0001 diterima"

HASIL      : keranjang kosong lagi, badge header hilang,
             tersedia tombol "Belanja lagi"

VERIFIKASI : DevTools → tab Network → saring "doc"
             tidak ada muat ulang halaman penuh; semuanya lewat fetch/XHR`,
      explain: [
        'Badge header berubah karena remote header dan remote cart membaca <b>satu instance state yang sama</b> — bukan karena shell menyalin data di antara mereka.',
        'Langkah 5 adalah inti bab 4: satu aksi di remote cart langsung terbaca remote header tanpa event khusus yang kamu tulis sendiri.',
        'Angka ORD-0001 datang dari API di <code>server.js</code> — remote cart tidak menghitung nomor pesanan sendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 2 — Lazy load dan deep link',
      lang: 'text',
      output: false,
      code: `TUJUAN     : membuktikan remote diunduh sesuai kebutuhan (bab 3)

AKSI       : (DevTools → tab Network, d Kosongkan dulu)
   1. Muat ulang http://localhost:4173
      → chunk header dan products terunduh; chunk cart BELUM ada
   2. Klik menu "Keranjang"
      → chunk cart muncul di Network saat itu juga (bukan di awal)
   3. Salin alamat ini ke bilah alamat lalu Enter:
      http://localhost:4173/#/keranjang
      → keranjang langsung tampil (skeleton sesaat, lalu daftar)
   4. Coba rute yang tidak ada:
      http://localhost:4173/#/profil
      → halaman 404 milik shell; header tetap jalan, tidak ada remote rusak

HASIL      : tiap rute hanya mengunduh chunk miliknya,
             deep link tetap berfungsi, rute aneh ditangani shell`,
      explain: [
        'Kalau chunk cart ikut terunduh di awal, berarti remote dimuat bukan lewat <code>React.lazy</code> — periksa kembali <code>apps/shell/src/App.jsx</code>.',
        'Langkah 3 dan 4 menguji dua baris materi sekaligus: deep link (bab 3) dan rute tidak dikenal (bab 3).',
        'Perhatikan pula konsol: setiap remote menulis <code>[shell] remote "…" siap dalam … ms</code> — data observability dari bab 8.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 3 — Rusakkan satu remote, lalu pulihkan',
      lang: 'text',
      output: false,
      code: `TUJUAN     : membuktikan kegagalan terisolasi (bab 8)

AKSI       :
   1. Buka apps/products/src/App.jsx, cari baris paling atas fungsi:
        export default function Products({ ctx }) {
      Ubah menjadi (satu kurung tutup dihapus → sintaks rusak):
        export default function Products({ ctx } {
   2. (Terminal 2) npm run build -w @tokomicro/products
   3. Muat ulang halaman, buka http://localhost:4173

HASIL      : header, navigasi, dan toast tetap berfungsi penuh;
             hanya area konten yang menampilkan kotak merah
             "Modul Katalog tidak dapat dimuat" + tombol "Coba lagi";
             konsol mencatat galat dari ErrorBoundary shell

AKSI       :
   4. Tekan "Coba lagi"
      → kotak galat muncul kembali (wajar: kodenya masih rusak),
        yang penting tombolnya benar-benar mencoba memuat ulang remote
   5. Kembalikan baris export seperti semula
   6. (Terminal 2) npm run build -w @tokomicro/products
   7. Tekan "Coba lagi" lagi
      → katalog pulih utuh TANPA memuat ulang halaman

HASIL      : satu remote bisa patah dan pulih tanpa menyentuh remote lain`,
      explain: [
        'Inilah latihan kegagalan bab 8: memecah sesuatu dengan sengaja adalah cara tercepat memahami pertahanannya.',
        'Tombol Coba lagi bekerja karena shell membuat komponen <code>React.lazy</code> yang baru setiap kali ditekan — komponen lazy yang sudah gagal tidak pernah dipakai ulang.',
        'Perhatikan bagian pemulihan: hanya workspace products yang dibangun ulang, shell dan remote lain tidak.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 4 — Rilis mandiri satu remote',
      lang: 'text',
      output: false,
      code: `TUJUAN     : membuktikan satu tim merilis tanpa mengganggu tim lain (bab 9)

AKSI       :
   1. Buka apps/products/src/App.jsx, ubah teks tombol:
        Tambah ke keranjang
      menjadi:
        + Keranjang
   2. (Terminal 2) npm run build -w @tokomicro/products
      → perhatikan log: hanya workspace products yang dibangun
   3. Muat ulang halaman

HASIL      : teks tombol di katalog berubah;
             header dan halaman keranjang identik dengan sebelumnya

PEMULIHAN  : kembalikan teks tombol seperti semula, lalu build ulang
             workspace itu sekali lagi. Ini WAJIB sebelum Langkah 5 —
             uji E2E mencari tombol dengan teks "Tambah ke keranjang"

VERIFIKASI : cek waktu build — jauh lebih singkat daripada "npm run build"
             penuh; itulah pipeline satu remote yang sesungguhnya`,
      explain: [
        'Skrip <code>-w</code> (workspace) membangun satu aplikasi saja — persis yang dilakukan pipeline CI/CD per remote pada bab 9.',
        'Bila header ikut berubah, berarti ada gaya atau kode shell yang tidak sengaja kamu sentuh: periksa <code>git diff</code>.',
        'Kembalikan teks semula bila ingin ulangi dari Langkah 0 dalam keadaan bersih.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 5 — Jalankan uji E2E',
      lang: 'text',
      output: false,
      code: `TUJUAN     : mengubah pengujian "rasa-rasa" jadi perintah (bab 8)

PERSIAPAN  : (sekali saja, butuh unduhan browser)
   npx playwright install chromium

PRASYARAT  : server dari Langkah 0 masih hidup

PERINTAH   : (Terminal 2)
   node e2e-smoke.mjs

HASIL      : lima tanda centang, diakhiri baris:
   HASIL: LULUS

   Uji yang berjalan: katalog termuat → tombol tambah ditekan
   → badge header "1" → pindah ke #/keranjang → "Buat pesanan"
   → muncul ORD-0001 → nol error console/pageerror

BILA GAGAL : daftar error ikut tercetak — langsung terlihat
             remote mana yang bermasalah dan pesan errornya apa`,
      explain: [
        'Skrip ini adalah alasan praktik Langkah 1 sampai 4 bernilai: begitu polanya paham, pasang skrip yang sama ke pipeline CI/CD bab 9.',
        'Nomor pesanan dihitung di memori server; bila ingin mengulang dari ORD-0001, hentikan lalu jalankan ulang <code>npm start</code>.',
        'Ketiadaan error console/pageerror selama alur berjalan adalah pemeriksaan paling murah untuk komposisi empat aplikasi.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 6 — Periksa kebersihan dan waktu muat',
      lang: 'text',
      output: false,
      code: `TUJUAN     : memastikan tidak ada kebocoran langganan dan memantau performa

AKSI       :
   1. Buka konsol, catat log waktu muat:
        [shell] remote "products" siap dalam 120 ms
      → inilah metrik "waktu muat per remote" dari bab 8
   2. Berpindah rute katalog ⇄ keranjang 10 kali
   3. DevTools → Elements → Event Listener Blocks
      → jumlah listener TIDAK bertambah terus
   4. Telusuri seluruh alur sekali lagi

HASIL      : waktu muat tercatat per remote, jumlah listener stabil,
             dan tidak ada satu pun console.error

BILA BERTAMBAH : langganan tidak dibersihkan — periksa apakah
             useSyncExternalStore dipakai langsung pada modul bersama,
             bukan subscribe manual tanpa fungsi bersih`,
      explain: [
        'React membersihkan langganan otomatis ketika remote dibongkar — bandingkan dengan versi vanilla yang harus melakukannya di <code>unmount()</code>.',
        'Konsol bersih tanpa error adalah tanda komposisi sehat: galat dari satu remote tidak merambat ke remote lain (bab 8).'
      ]
    },
    {
      type: 'example',
      title: 'Checklist keberhasilan',
      lang: 'text',
      output: false,
      code: `Tandai setiap kotak setelah kamu sendiri yang membuktikannya:

 [ ] npm start mencetak empat baris port, browser menampilkan katalog
 [ ] badge header bergerak mengikuti isi keranjang tanpa muat ulang
 [ ] chunk cart hanya terunduh saat rute keranjang dibuka
 [ ] membuka #/keranjang langsung dari bilah alamat berhasil
 [ ] remote yang dirusakkan hanya mengubah slotnya; tombol
     "Coba lagi" memulihkannya kembali
 [ ] mengubah satu remote tidak membangun ulang shell
 [ ] node e2e-smoke.mjs menampilkan HASIL: LULUS
 [ ] konsol bebas console.error sepanjang sesi

Semua tercentang  →  konsep micro-frontend sudah kamu kuasai
                     dari kontrak sampai rilis. Lanjut ke bab 9
                     untuk menerapkannya pada proyekmu sendiri.`,
      explain: [
        'Checklist ini adalah jembatan dari "membaca materi" menjadi "bisa mendemonstrasikannya" — hal yang paling sering diminta saat wawancara atau review arsitektur.',
        'Bila satu kotak belum tercentang, ulangi langkah terkait saja; tidak perlu mengulang dari awal.'
      ]
    },
    {
      type: 'tip',
      title: 'Bila Macet: Peta Masalah Umum',
      text: '<b>503 "hasil build belum ada"</b> → jalankan <code>npm run build</code>. <b>Tampilan remote terlihat lama setelah diubah</b> → build ulang workspace remote itu, lalu reload keras (Ctrl/Cmd+Shift+R). <b>remoteEntry.js 404 atau gagal CORS</b> → server.js belum jalan atau portnya tidak cocok; periksa daftar <code>SITES</code> di <code>server.js</code>. <b>Impor remote gagal di konsol</b> → nama <code>exposes</code> dan pemanggilan <code>import(\'products/App\')</code> tidak cocok. <b>Bukan ORD-0001</b> → counter pesanan tersimpan di memori; hentikan lalu jalankan ulang <code>npm start</code>.'
    },
    {
      type: 'example',
      title: 'Ide pengembangan TokoMicro React',
      lang: 'text',
      output: false,
      code: `TINGKAT MENENGAH
  • Tambah remote keempat "riwayat" + guard rute login di shell
    → menerapkan bab 6 pada shell React
  • Ganti globalThis dengan shared packagePath pada federation
    → membandingkan dua cara state satu instance (bab 7)
  • Pakai CSS Modules di satu remote, bandingkan dengan awalan kelas
    → memperdalam bab 5

TINGKAT LANJUT
  • Pisahkan tiap remote ke pipeline CI/CD sendiri + manifest versi
    → mewujudkan bab 9 di repo ini
  • Pasang E2E di CI: node e2e-smoke.mjs sebagai smoke test deploy
  • Sisipkan BFF sebagai pengganti server.js, lalu pakai token
    → menggabungkan bab 6 dengan contoh yang sudah berjalan
  • Tambahkan Playwright test lintas remote (kegagalan + pemulihan)`,
      explain: [
        'Pilihan tingkat menengah cocok untuk memperdalam konsep tanpa mengubah cara proyek dibangun.',
        'Pilihan tingkat lanjut menyentuh topik operasional bab 9 — di sanalah mikro-frontend diuji sebagai praktik tim, bukan sebagai kode.',
        'Yang paling bernilai bukan menyelesaikan semuanya, melainkan <b>satu perubahan yang benar-benar kamu pahami</b> dari awal sampai akhir.'
      ]
    },
    {
      type: 'tip',
      title: 'Satu Salinan React untuk Empat Aplikasi',
      text: 'Keempat <code>vite.config.js</code> menyepakati hal yang sama: <code>shared: { react: { singleton: true }, \'react-dom\': { singleton: true } }</code>. Shell yang menyiapkan React, remote tinggal memakai. Buktikan di tab Network: cari berkas React — hanya satu bundel untuk seluruh halaman. Inilah pembeda paling teknis antara micro-frontend yang sehat dengan yang sekadar "banyak berkas".'
    },
    {
      type: 'warn',
      title: 'Wajib Build: Mode Dev Vite Belum Mendukung Federation',
      text: 'Federasi bekerja pada hasil build, bukan pada <code>vite dev</code>. Setiap perubahan kode harus diikuti <code>npm run build</code> (boleh hanya satu workspace dengan <code>-w</code>) sebelum hasilnya terlihat di browser. Bila halaman menampilkan remote lama, kemungkinan besar build-nya belum dijalankan — bukan kodenya yang salah.'
    },
    {
      type: 'vocab',
      items: [
        ['TokoMicro React', 'Proyek contoh versi React: shell + 3 remote dengan Vite & Module Federation di examples/micro-frontend-react/.'],
        ['npm workspace', 'Pengaturan satu instalasi npm untuk banyak paket dalam satu repository, sehingga build bisa dijalankan per paket.'],
        ['React.lazy', 'Komponen React yang mengimpor modul remote hanya saat dibutuhkan, lengkap dengan fallback Suspense.'],
        ['Error boundary React', 'Penangkap galat komponen; shell memasangnya per remote agar kegagalan satu modul tetap terisolasi.'],
        ['useSyncExternalStore', 'Hook React untuk membaca state eksternal; menyubscribe dan membersihkan langganan secara otomatis.'],
        ['Instance global', 'Penyimpanan state pada globalThis sehingga tetap satu meski berkas yang sama dibundel tiap aplikasi.'],
        ['Origin terpisah', 'Alamat server berbeda tiap remote — meniru deployment CDN sesungguhnya, lengkap dengan CORS.'],
        ['Uji E2E', 'Pengujian alur lengkap pada browser sungguhan untuk memastikan komposisi shell + remote bekerja utuh.']
      ]
    }
  ],
  recap: [
    'TokoMicro React tersusun atas satu proses Node (4 origin + API), shell React, tiga remote (header, products, cart), dan paket bersama @tokomicro/shared.',
    'Kontrak mount/unmount berubah menjadi komponen React yang dimuat React.lazy, dengan Suspense sebagai skeleton dan ErrorBoundary sebagai penangkap galat per remote.',
    'State keranjang disimpan di globalThis sehingga tetap satu instance walau tiap remote membundelnya sendiri, dibaca lewat useSyncExternalStore.',
    'Tiap aplikasi mempunyai vite.config.js sendiri dengan exposes, remotes, dan shared react singleton — rilis mandiri benar-benar terwujud di perintah build.',
    'Panduan Build 1–5 membawa dari nol sampai jalan: cek prasyarat, instalasi sekali per workspace, build per aplikasi (npm run build -w), periksa hasil dist & remoteEntry.js, lalu nyalakan server dan verifikasi empat origin.',
    'Praktik disusun runut langkah 0–6: siapkan lingkungan, alur utama, lazy load & deep link, rusakkan-pulihkan remote, rilis mandiri, uji E2E, lalu periksa kebersihan — masing-masing dengan tujuan, aksi, hasil yang diharapkan, dan verifikasi.',
    'Checklist keberhasilan dan peta "Bila Macet" melengkapi praktik agar pembaca tahu persis kapan sebuah langkah dianggap selesai dan bagaimana memulihkannya bila gagal.'
  ]
});
