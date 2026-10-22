# Roadmap Belajar Micro-Frontend dari Nol sampai Mahir

## Tujuan

Mampu membagi aplikasi frontend menjadi beberapa **micro-frontend** yang dibangun, diuji, dan dirilis secara mandiri, tanpa mengorbankan konsistensi tampilan dan pengalaman pengguna.

**Estimasi durasi:** 8–12 minggu
**Waktu belajar:** 6–8 jam per minggu
**Metode:** 25% teori, 75% praktik
**Bahasa & tools:** HTML, CSS, JavaScript (ES Modules), Node.js, Vite, Module Federation, React (opsional), Docker, Playwright
**Prasyarat:** sudah nyaman menulis JavaScript modern (`async/await`, modul ES), CSS layout (Flexbox/Grid), dan Git dasar. Materi prasyarat ada di Tahap 0.

---

## Peta Perjalanan

1. Tahap 0 — Fondasi Frontend
2. Tahap 1 — Monolith Frontend vs Micro-Frontend
3. Tahap 2 — Anatomi dan teknik komposisi
4. Tahap 3 — Shell, routing, dan lazy loading
5. Tahap 4 — Komunikasi antar remote dan shared state
6. Tahap 5 — Isolasi styling dan design system
7. Tahap 6 — Data, API, dan autentikasi
8. Tahap 7 — Build, monorepo, dan deployment
9. Tahap 8 — Pengujian, ketahanan, dan observability
10. Tahap 9 — Organisasi tim, CI/CD, dan versioning
11. Tahap 10 — Jebakan umum dan kapan kembali ke monolith
12. Proyek akhir dan contoh proyek lengkap

---

# Bagian A — Memahami Konsep

## Tahap 0 — Fondasi Frontend

**Durasi:** 1 minggu

### Materi

- [ ] Struktur HTML semantik.
- [ ] CSS: box model, Flexbox, Grid, custom properties (variabel CSS).
- [ ] JavaScript: `let`/`const`, arrow function, destructuring, spread.
- [ ] **ES Modules**: `import`/`export`, `import()` dinamis.
- [ ] `fetch`, Promise, `async/await`, `AbortController`.
- [ ] DOM: `createElement`, `appendChild`, `addEventListener`, `document.querySelector`.
- [ ] Event: `click`, `input`, `hashchange`, CustomEvent.
- [ ] npm dan `package.json` (hanya memakai, belum menulis tooling).
- [ ] Git dasar: branch, commit, pull request.

### Praktik

- [ ] Buat halaman statis dengan tiga berkas terpisah (`index.html`, `style.css`, `app.js`).
- [ ] Ubah `app.js` menjadi modul ES (`type="module"`) dan impor satu fungsi dari berkas lain.
- [ ] Ambil data dari JSON palsu dengan `fetch`, tampilkan sebagai daftar, lalu tampilkan pesan galat bila request gagal.
- [ ] Batalkan request yang menggantung dengan `AbortController` saat pengguna berpindah halaman.

### Target

Mampu memecah satu aplikasi kecil menjadi beberapa berkas modul yang saling terhubung tanpa bundler.

---

## Tahap 1 — Monolith Frontend vs Micro-Frontend

**Durasi:** 2–3 hari

### Materi

**Apa itu micro-frontend?**
Micro-frontend adalah arsitektur di mana sebuah *halaman atau aplikasi web* disusun dari beberapa aplikasi frontend kecil yang masing-masing:

1. **dimiliki** oleh satu tim,
2. **dirilis** secara mandiri (tanpa menunggu tim lain),
3. **digabungkan** saat runtime oleh sebuah wadah yang disebut **shell** (juga dikenal sebagai *container*, *host*, atau *shell application*).

Istilah ini dipopulerkan oleh Cam Jackson (ThoughtWorks). Prinsip utamanya bukan "memecah kode", melainkan **memecah kepemilikan tim**: setiap tim bebas memilih pustaka sendiri, asalkan hasilnya tetap menyatu di mata pengguna.

**Contoh nyata:** sebuah e-commerce dengan tim berbeda untuk header/menu, katalog produk, keranjang, dan dasbor penjual. Setiap tim merilis kapan saja tanpa mengganggu tim lain.

### Perbandingan langsung

| Aspek | Monolith Frontend | Micro-Frontend |
| --- | --- | --- |
| Rilis | satu pipeline untuk seluruh halaman | satu pipeline per modul |
| Pemilik | satu tim besar | satu tim per modul |
| Pustaka UI | seragam dipilih sekali | bebas per modul, dijembatani design system |
| Kecepatan awal | cepat | lambat (perlu setup) |
| Biaya kompleksitas | rendah | tinggi (routing, state, styling, deploy) |
| Risiko kegagalan | satu bug mematikan seluruh halaman | kegagalan terisolasi per modul |

### Kapan micro-frontend COCOK

- [ ] Beberapa tim besar mengembangkan satu produk dan sering saling menunggu.
- [ ] Bagian aplikasi punya ritme rilis berbeda (misalnya checkout sering, profil jarang).
- [ ] Bagian lama perlu dimigrasi bertahap tanpa menulis ulang semuanya sekaligus.
- [ ] Bagian aplikasi punya kebutuhan teknis berbeda (video editor vs halaman statis).

### Kapan TIDAK cocok

- [ ] Tim hanya satu atau dua orang — biaya orkestrasi lebih besar dari manfaatnya.
- [ ] Aplikasi masih berupa CRUD sederhana dengan sedikit halaman.
- [ ] Konsistensi UX sangat ketat dan tim belum punya design system.
- [ ] Belum ada otomatisasi CI/CD — rilis manual akan menjadi mimpi buruk.

> **Aturan emas:** jangan memakai micro-frontend hanya karena sedang tren. Tambahkan kompleksitas hanya jika masalahnya benar-benar organisasional, bukan sekadar ingin "rapi".

### Praktik

- [ ] Buat diagram monolith frontend: satu build, satu deploy, satu tim.
- [ ] Buat diagram micro-frontend: shell + 3 remote + tim yang memilikinya.
- [ ] Tuliskan 3 alasan pro dan 3 alasan kontra untuk produk Anda sendiri.

### Target

Mampu menjelaskan kapan micro-frontend menyelesaikan masalah nyata dan kapan justru menambah masalah.

---

## Tahap 2 — Anatomi dan Teknik Komposisi

**Durasi:** 3–4 hari

### Anatomi

```text
┌──────────────────────────────────────────────┐
│ SHELL (aplikasi induk)                        │
│  • layout, navigasi, routing, auth global     │
│  • memuat remote sesuai URL                   │
│  • menangani kegagalan (error boundary)       │
├──────────────┬───────────────┬───────────────┤
│ remote:header│ remote:products│ remote:cart   │
│  milik Tim A │ milik Tim B    │ milik Tim C   │
│  rilis sendiri│ rilis sendiri │ rilis sendiri │
└──────────────┴───────────────┴───────────────┘
              ▲
   shared modules (state, event bus, design tokens,
   pustaka UI yang disepakati bersama)
```

Tiga istilah yang wajib dikuasai:

- **Shell**: pemilik URL, layout, dan siklus hidup halaman.
- **Remote** (mikro-frontend): aplikasi kecil yang dimount ke slot DOM yang disediakan shell.
- **Shared module**: kode yang dipakai bersama (state, bus event, token CSS) dan hanya boleh berisi hal yang *benar-benar* disepakati semua tim.

### Teknik komposisi (cara menggabungkan remote)

| Teknik | Cara kerja | Kelebihan | Kekurangan | Cocok untuk |
| --- | --- | --- | --- | --- |
| Build time (npm package) | remote dipaketkan lalu di-bundle shell | sederhana, cepat | rilis tetap tergantung shell | tim kecil, transisi awal |
| Runtime JS entry | shell mengimpor berkas `entry.js` remote | mandiri & fleksibel | perlu kontrak & isolasi ketat | tim besar, rilis mandiri |
| Web Components | remote mendaftarkan `<my-cart>` | tahan framework apa pun | styling & aksesibilitas perlu usaha | design system lintas framework |
| Module Federation | bundler membagi & berbagi dependensi saat runtime | penghematan bundle, shared deps | terikat tooling bundler | React/Vue/Angular modern |
| single-spa | kerangka komposisi dengan lifecycle baku | standar, banyak integrasi | kurva belajar | migrasi besar |
| iframe | tiap remote halaman sendiri | isolasi sempurna | masalah sizing, SEO, UX terpecah | bagian legacy/eksternal |
| Server-side (SSI/ESI/nginx) | remote digabung di server/CDN | TTFB cepat, SEO bagus | interaktivitas tetap di client | landing page, portal |

### Perbandingan tools populer

| Tool | Jenis | Catatan |
| --- | --- | --- |
| Vite + `@originjs/vite-plugin-federation` | Module Federation | cepat, ringan, cocok untuk proyek baru |
| Webpack 5 Module Federation | Module Federation | bawaan Webpack, paling matang |
| single-spa | kerangka komposisi | lifecycle `bootstrap/mount/unmount`, integrasi banyak framework |
| Piral | toolkit | sudah menyediakan shell, feed, dan portal bawaan |
| Module Federation + Rspack/Rsbuild | Module Federation | build jauh lebih cepat untuk monorepo besar |

### Praktik

- [ ] Rancang tiga remote untuk produk Anda: tentukan nama, pemilik tim, dan tanggung jawabnya.
- [ ] Tentukan data yang dibutuhkan tiap remote dan siapa pemilik API-nya.
- [ ] Pilih satu teknik komposisi dan tulis alasannya dalam satu paragraf (Architectural Decision Record).

### Target

Mampu memilih teknik komposisi yang sesuai dan menjelaskan konsekuensinya.

---

# Bagian B — Membangun

## Tahap 3 — Shell, Routing, dan Lazy Loading

**Durasi:** 4–5 hari

### Materi

- [ ] Shell menyediakan slot DOM (`#view`, `#mfe-header`).
- [ ] Routing berbasis hash (`#/katalog`, `#/keranjang`) atau History API.
- [ ] `import()` dinamis: satu bundel per remote.
- [ ] Siklus hidup remote: `mount(container, ctx)` dan `unmount()`.
- [ ] Cache modul agar remote tidak diimpor ulang saat berpindah rute.
- [ ] Kerangka pemuatan (skeleton) agar shell tetap terasa responsif.
- [ ] Deep link: buka URL langsung di remote tertentu harus tetap berfungsi.
- [ ] Rute tidak dikenal: arahkan ke halaman utama atau halaman 404.

### Praktik

- [ ] Bangun shell dengan dua rute yang memuat dua remote berbeda.
- [ ] Tambahkan kerangka pemuatan selama remote dimuat.
- [ ] Uji deep link: `http://localhost:PORT/#/keranjang` langsung membuka keranjang.
- [ ] Ukur jumlah berkas yang diunduh per rute di tab Network — pastikan remote lain tidak ikut terunduh.

### Target

Shell mampu memuat dan membongkar remote dengan bersih, dengan berkas terpisah per rute.

---

## Tahap 4 — Komunikasi Antarmodul dan Shared State

**Durasi:** 4–5 hari

### Materi

**Tiga cara berkomunikasi, dari yang paling longgar ke paling erat:**

1. **Melalui URL** — parameter rute (`#/produk/p1`) adalah cara paling sederhana dan selalu tersedia.
2. **Melalui event bus** — event `cart:change`, `route:change`, `toast`; pengirim tidak tahu siapa penerimanya.
3. **Melalui shared store** — satu instance modul state dipakai bersama (setara *shared dependencies* pada Module Federation).

Aturan main:

- [ ] Remote tidak boleh mengimpor berkas internal remote lain.
- [ ] Shared store hanya menyimpan state yang *benar-benar* bersama (misalnya keranjang, tema, bahasa, token).
- [ ] Setiap langganan event **wajib** dibersihkan di `unmount()` — kalau tidak, terjadi *listener leak*.
- [ ] Satu remote yang rusak tidak boleh membuat handler remote lain ikut gagal: bungkus handler dengan `try/catch`.

### Praktik

- [ ] Buat event bus kecil (maksimal 40 baris) dengan `on`, `off`, `emit`.
- [ ] Buat shared store keranjang: `addItem`, `changeQty`, `removeItem`, `cartSummary`.
- [ ] Tampilkan jumlah item di header (remote A) dan daftar item di halaman keranjang (remote B).
- [ ] Bongkar remote keranjang, lalu periksa di DevTools → Event Listeners bahwa tidak ada listener yang tersisa.

### Target

State yang sama tampil konsisten di dua remote yang dibangun terpisah.

---

## Tahap 5 — Isolasi Styling dan Design System

**Durasi:** 3–4 hari

### Materi

- [ ] Awalan kelas CSS per remote (`.hd-`, `.pf-`, `.ct-`) — cara termurah dan efektif.
- [ ] CSS Modules (`produk.module.css`) — isolasi otomatis oleh bundler.
- [ ] Design tokens: variabel CSS (`--accent`, `--card`) ditentukan shell, dipakai semua remote.
- [ ] Shadow DOM: isolasi paling kuat, cocok untuk komponen lintas framework.
- [ ] Jangan letakkan *CSS reset* di dalam remote — itu merusak remote lain.
- [ ] Jangan gunakan selektor global seperti `button {}` atau `h1 {}` di dalam remote.

### Praktik

- [ ] Pindahkan semua variabel warna ke `shell.css` lalu gunakan `var(--accent)` di semua remote.
- [ ] Tambahkan remote baru dengan awalan kelas berbeda dan pastikan tampilannya tetap satu keluarga.
- [ ] Uji: matikan `shell.css` — remote seharusnya masih terbaca (karena memakai nilai cadangan `var(--accent, #4f46e5)`).

### Target

Tiga remote dengan tiga gaya berbeda tetap terlihat sebagai satu produk.

---

## Tahap 6 — Data, API, dan Autentikasi

**Durasi:** 4–5 hari

### Materi

- [ ] Setiap remote memanggil API-nya sendiri, bukan API remote lain.
- [ ] Bila perlu agregasi, buat **BFF** (Backend for Frontend) sebagai satu pintu.
- [ ] Hindari remote memanggil remote lain langsung (HTTP antar-remote) — itu memunculkan *distributed monolith*.
- [ ] Untuk kebutuhan lintas remote, pakai **event** atau **API gateway**.
- [ ] Auth global di shell: simpan token, lalu shell menyediakan `ctx.getToken()`.
- [ ] Silent refresh token agar pengguna tidak terus-terusan diminta login.
- [ ] Proteksi rute: remote yang butuh login diperiksa shell sebelum `mount()`.
- [ ] Konsistensi kontrak API: siapa pun boleh mengubah API asal tetap *backward compatible*.

### Praktik

- [ ] Simulasi token kadaluarsa: perbarui token diam-diam sebelum request berikutnya.
- [ ] Buat halaman yang hanya bisa diakses setelah login, lalu uji deep link-nya.
- [ ] Buat satu endpoint BFF yang menggabungkan data dua remote dalam satu respons.

### Target

Autentikasi terasa satu kali login untuk seluruh halaman, dan tidak ada remote yang saling memanggil langsung.

---

## Tahap 7 — Build, Monorepo, dan Deployment

**Durasi:** 5–6 hari

### Materi

- [ ] Struktur monorepo: `apps/shell`, `apps/products`, `packages/design-system`.
- [ ] Build per remote: tiap remote menghasilkan `remoteEntry.js` sendiri.
- [ ] Vite + Module Federation: `shared` dependencies (React sekali muat untuk semua remote).
- [ ] `singleton: true` untuk pustaka yang tidak boleh dimuat dua kali.
- [ ] Manifest rute/versi remote agar shell tahu entri terbaru.
- [ ] Deployment: shell di origin utama, remote di CDN atau subdomain berbeda.
- [ ] CORS: remote lintas origin butuh header yang benar.
- [ ] Versioning remote: jangan pernah menimpa artefak versi lama (pakai hash nama berkas).

### Contoh konfigurasi Vite + Module Federation

`apps/products/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'products',
      filename: 'remoteEntry.js',          // berkas yang dimuat shell
      exposes: {
        './App': './src/App.jsx'           // fitur yang dipancarkan
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true }
      }
    })
  ],
  build: { target: 'esnext', minify: false }
});
```

`apps/shell/vite.config.js` (bagian federasi):

```js
federation({
  name: 'shell',
  remotes: {
    products: 'http://cdn.example.com/products/assets/remoteEntry.js',
    cart: 'http://cdn.example.com/cart/assets/remoteEntry.js'
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true }
  }
})
```

### Praktik

- [ ] Buat monorepo dengan shell + dua remote, masing-masing bisa dibangun mandiri.
- [ ] Pastikan React hanya dimuat satu kali (cek tab Network: hanya ada satu bundel React).
- [ ] Ubah kode remote products lalu rilis — halaman lain tidak perlu dibangun ulang.
- [ ] Uji skenario gagal: arahkan shell ke URL remote yang salah dan pastikan tetap ada fallback.

### Target

Perubahan pada satu remote bisa dirilis tanpa menyentuh kode remote lain.

---

## Tahap 8 — Pengujian, Ketahanan, dan Observability

**Durasi:** 4–5 hari

### Materi

- [ ] Unit test per remote (fungsi murni: format rupiah, perhitungan total, validasi).
- [ ] Component test dengan Testing Library.
- [ ] Contract test: bentuk respons API dipastikan sama antar-tim.
- [ ] End-to-end test untuk **alur komposisi** (Playwright/Cypress): buka halaman, tambah produk, checkout.
- [ ] Visual regression test untuk menjaga konsistensi design system.
- [ ] **Error boundary per remote**: satu remote gagal, shell dan remote lain tetap hidup.
- [ ] Fallback UI: tampilkan tombol "Coba lagi" alih-alih halaman kosong.
- [ ] Observability: catat nama remote, versi, dan lama waktu muat tiap mount.
- [ ] Performance budget: misalnya shell maksimal 150 KB, remote maksimal 200 KB.

### Praktik

- [ ] Sengaja rusakkan satu remote lalu buka aplikasi — pastikan shell tetap berfungsi penuh.
- [ ] Tulis satu E2E test alur tambah-ke-keranjang sampai pesanan dibuat.
- [ ] Catat waktu `mount()` tiap remote ke `console`/endpoint logging.
- [ ] Uji di koneksi lambat (DevTools → Slow 3G) dan pastikan skeleton muncul.

### Target

Kegagalan satu modul terisolasi, terdeteksi, dan bisa dipulihkan tanpa memuat ulang seluruh halaman.

---

# Bagian C — Tingkat Mahir

## Tahap 9 — Organisasi Tim, CI/CD, dan Versioning

**Durasi:** 5–6 hari

### Materi

- [ ] Hukum Conway: struktur tim harus sejajar dengan potongan produk.
- [ ] *You build it, you run on it* — tim remote bertanggung jawab sampai produksi.
- [ ] Pipeline CI/CD per remote: lint → test → build → publish → deploy → smoke test.
- [ ] Semantic versioning untuk kontrak (API dan komponen shared).
- [ ] Halaman katalog remote: daftar remote, versi, pemilik, dan status rilis.
- [ ] Canary release dan feature flag untuk remote baru.
- [ ] Rollback cepat: simpan versi sebelumnya dan kembalikan pointer manifest.
- [ ] Perubahan bersifat *backward compatible* — remote versi lama harus tetap jalan saat shell sudah baru.

### Praktik

- [ ] Buat pipeline untuk satu remote dengan smoke test setelah deploy.
- [ ] Terbitkan dua versi remote, lalu buat shell memakai versi lama tanpa perubahan kode.
- [ ] Buat halaman daftar remote (manifest) yang menampilkan versi aktif tiap modul.

### Target

Rilis satu remote tidak pernah membutuhkan koordinasi jadwal dengan tim lain.

---

## Tahap 10 — Jebakan Umum dan Kapan Kembali ke Monolith

**Durasi:** 2–3 hari

### Jebakan yang paling sering terjadi

| Jebakan | Gejala | Pencegahan |
| --- | --- | --- |
| Distributed monolith | rilis tetap menunggu tim lain | hilangkan dependensi rilis, pakai kontrak |
| Duplikasi dependensi | bundle bloat, React dimuat dua kali | shared dependency dengan `singleton` |
| CSS bocor | remote satu menimpa tampilan remote lain | awalan kelas, CSS Modules, Shadow DOM |
| State bersama kebablasan | semua state dipindahkan ke shared | state lokal dulu, baru naik kelas bila perlu |
| Inkonsistensi UX | tombol berbeda-beda bentuk | design tokens + komponen bersama |
| Versi kacau | shell memuat remote yang sudah berubah kontrak | manifest versi + kontrak backward compatible |
| Sulit debugging | galat muncul di lintas remote | logging dengan `remoteId` dan trace ID |
| Performa menurun | terlalu banyak request kecil | gabungkan berkas, preload, cache |

### Tanda harus kembali ke monolith (atau modular monolith)

- [ ] Hanya satu tim yang benar-benar mengembangkan seluruh frontend.
- [ ] Lebih dari separuh waktu habis untuk mengurus kontrak, bukan fitur.
- [ ] Perubahan kecil selalu menyentuh banyak remote sekaligus.
- [ ] Biaya hosting dan monitoring naik tanpa peningkatan kecepatan rilis.

### Strategi migrasi (bila tetap melanjutkan)

Gunakan pola **strangler fig**: bangun shell baru, pindahkan rute satu per satu dari aplikasi lama, dan buang modul lama setelah rute baru stabil. Jangan pernah memigrasi seluruh sekaligus.

### Praktik

- [ ] Audit aplikasi Anda: sebutkan tiga jebakan yang paling mungkin terjadi.
- [ ] Tulis aturan "apa yang boleh masuk shared module" (maksimal satu halaman).

### Target

Mampu memutuskan, dengan alasan terukur, apakah arsitektur ini layak dipertahankan.

---

# Proyek Akhir — Pasar Digital "TokoMicro"

**Durasi:** 2 minggu atau lebih

Bangun aplikasi e-commerce kecil yang terdiri atas empat micro-frontend.

### Remote dan pemiliknya

| Remote | Tanggung jawab | API yang dipakai |
| --- | --- | --- |
| `header` | logo, navigasi, badge keranjang, tema | — (membaca shared store) |
| `products` | katalog, pencarian, filter kategori | `GET /api/products` |
| `cart` | daftar item, jumlah, checkout | `GET/PATCH` keranjang, `POST /api/orders` |
| `account` | profil dan riwayat pesanan | `GET /api/me`, `GET /api/orders` |

### Persyaratan proyek

- [ ] Shell memuat remote secara lazy, dengan skeleton dan error boundary.
- [ ] Tiap remote punya CI/CD sendiri dan bisa dirilis mandiri.
- [ ] State keranjang dipakai bersama oleh `header` dan `cart`.
- [ ] Semua gaya memakai design tokens dari shell; tidak ada CSS global di remote.
- [ ] Autentikasi sekali login untuk seluruh halaman.
- [ ] Unit test, contract test, dan minimal satu alur E2E.
- [ ] Metrik sederhana: waktu muat tiap remote tercatat.
- [ ] Dokumentasi arsitektur: diagram shell + remote, daftar event, dan kontrak shared module.
- [ ] Uji ketahanan: matikan satu remote, halaman tetap berfungsi.

### Kriteria akhir

Proyek dianggap berhasil bila dapat dijalankan dari repository, tiap remote dirilis mandiri tanpa membangun ulang yang lain, dan kegagalan satu remote tidak membuat aplikasi mati total.

---

# Contoh Proyek Lengkap — TokoMicro

Contoh berikut **bisa langsung dijalankan** tanpa framework dan tanpa build, agar konsepnya jelas sebelum Anda pindah ke Vite/Module Federation. Seluruh berkas juga tersedia di folder [`examples/micro-frontend/`](examples/micro-frontend/) pada repository ini.

**Hasil akhir:** halaman katalog dengan filter kategori → tambah ke keranjang → badge header bertambah → checkout → nomor pesanan tampil.

## Struktur proyek

```text
micro-frontend/
├── server.js                  # server statis + API palsu (/api/products, /api/orders)
├── shell/                     # aplikasi induk
│   ├── index.html
│   ├── shell.js
│   └── shell.css
├── shared/                    # modul bersama
│   ├── bus.js
│   └── store.js
└── remotes/
    ├── header/                # remote 1
    │   ├── header.js
    │   └── header.css
    ├── products/              # remote 2
    │   ├── products.js
    │   └── products.css
    └── cart/                  # remote 3
        ├── cart.js
        └── cart.css
```

## Langkah menjalankan

```bash
cd examples/micro-frontend
node server.js
# buka http://localhost:4173
```

## 1. `server.js` — server statis + API palsu

Menyediakan file frontend dan dua endpoint. Header CORS dibuka lebar karena pada skenario nyata tiap remote dilayani oleh server/CDN berbeda.

```js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const products = [
  { id: 'p1', name: 'Keyboard Mekanik', category: 'Aksesori', price: 750000, emoji: '⌨️' },
  { id: 'p2', name: 'Mouse Nirkabel', category: 'Aksesori', price: 320000, emoji: '🖱️' },
  { id: 'p3', name: 'Layar 27 inci', category: 'Monitor', price: 2450000, emoji: '🖥️' },
  { id: 'p4', name: 'Kursi Ergonomis', category: 'Furnitur', price: 1890000, emoji: '🪑' },
  { id: 'p5', name: 'Lampu Meja LED', category: 'Furnitur', price: 210000, emoji: '💡' },
  { id: 'p6', name: 'Headset Stereo', category: 'Aksesori', price: 540000, emoji: '🎧' }
];

const orders = [];
let orderSeq = 1;

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (url === '/api/products' && req.method === 'GET') {
    json(res, 200, products);
    return;
  }

  if (url === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body || '{}'); }
      catch { json(res, 400, { error: 'Payload bukan JSON yang sah.' }); return; }

      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        json(res, 400, { error: 'Keranjang kosong — pesanan tidak dibuat.' });
        return;
      }
      const total = payload.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const order = {
        id: 'ORD-' + String(orderSeq++).padStart(4, '0'),
        items: payload.items,
        total,
        createdAt: new Date().toISOString()
      };
      orders.push(order);
      json(res, 201, order);
    });
    return;
  }

  const file = path.join(ROOT, url === '/' ? 'shell/index.html' : url);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Terlarang'); return; }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — tidak ditemukan: ' + url);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`TokoMicro berjalan di http://localhost:${PORT}`));
```

## 2. `shared/bus.js` — penghubung antar remote

```js
const listeners = new Map();

export function on(name, handler) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(handler);
  return () => off(name, handler);
}

export function off(name, handler) {
  const set = listeners.get(name);
  if (set) set.delete(handler);
}

export function emit(name, payload) {
  const set = listeners.get(name);
  if (!set) return;
  for (const handler of [...set]) {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[bus] penangan event "${name}" gagal:`, err);
    }
  }
}
```

## 3. `shared/store.js` — state keranjang yang dipakai bersama

```js
import { emit } from './bus.js';

const state = { items: [] };

export function getCart() {
  return state.items;
}

export function addItem(product) {
  const found = state.items.find((i) => i.id === product.id);
  if (found) found.qty += 1;
  else state.items.push({ ...product, qty: 1 });
  emit('cart:change', getCart());
}

export function changeQty(id, delta) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeItem(id);
  emit('cart:change', getCart());
}

export function removeItem(id) {
  const index = state.items.findIndex((i) => i.id === id);
  if (index === -1) return;
  state.items.splice(index, 1);
  emit('cart:change', getCart());
}

export function clearCart() {
  state.items = [];
  emit('cart:change', getCart());
}

export function cartSummary() {
  const qty = state.items.reduce((sum, i) => sum + i.qty, 0);
  const total = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { qty, total };
}

export function rupiah(n) {
  return 'Rp' + n.toLocaleString('id-ID');
}
```

## 4. `shell/index.html` — kerangka halaman

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TokoMicro — Contoh Micro-Frontend</title>
  <link rel="stylesheet" href="/shell/shell.css">
</head>
<body>
  <div id="mfe-header"></div>
  <main id="view" class="view" tabindex="-1"></main>
  <div id="toast-root" class="toast-root" aria-live="polite"></div>
  <script type="module" src="/shell/shell.js"></script>
</body>
</html>
```

## 5. `shell/shell.js` — inti aplikasi induk

```js
import { emit } from '/shared/bus.js';

/* Peta rute → entry remote. Di produksi datang dari build manifest. */
const routes = {
  katalog: '/remotes/products/products.js',
  keranjang: '/remotes/cart/cart.js'
};

const registry = new Map();
let activeRemote = null;

function currentRoute() {
  const name = location.hash.replace(/^#\/?/, '').split('/')[0];
  return routes[name] ? name : 'katalog';
}

async function loadRemote(url) {
  if (registry.has(url)) return registry.get(url);
  const mod = await import(url);            // dinamis = bundel terpisah
  registry.set(url, mod);
  return mod;
}

function toast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function createContext(route) {
  return { route, navigate: (hash) => { location.hash = hash; }, toast };
}

async function render() {
  const name = currentRoute();
  const host = document.getElementById('view');

  emit('route:change', { name });

  /* 1. bongkar remote lama */
  if (activeRemote) {
    try { activeRemote.unmount?.(); } catch (err) { console.error('[shell] unmount gagal:', err); }
    activeRemote = null;
  }

  /* 2. kerangka pemuatan */
  host.innerHTML = '<div class="skeleton"><span></span><span></span><span></span></div>';

  /* 3. muat & pasang remote */
  try {
    const mod = await loadRemote(routes[name]);
    host.innerHTML = '';
    const slot = document.createElement('div');
    slot.className = 'mfe-slot';
    host.appendChild(slot);
    mod.mount(slot, createContext(name));
    activeRemote = mod;
    host.focus({ preventScroll: true });
  } catch (err) {
    /* 4. error boundary */
    console.error(`[shell] remote "${name}" gagal dimuat:`, err);
    host.innerHTML = `
      <div class="error-box" role="alert">
        <h2>Modul ${name} tidak dapat dimuat</h2>
        <p>Kerusakan terisolasi di satu micro-frontend — modul lain tetap berfungsi.</p>
        <button class="btn" data-retry>Coba lagi</button>
      </div>`;
    host.querySelector('[data-retry]').addEventListener('click', () => {
      registry.delete(routes[name]);
      render();
    });
  }
}

async function mountHeader() {
  const slot = document.getElementById('mfe-header');
  try {
    const mod = await loadRemote('/remotes/header/header.js');
    mod.mount(slot, createContext('header'));
  } catch (err) {
    console.error('[shell] remote header gagal:', err);
    slot.innerHTML = '<div class="hd hd-fallback"><a href="#/katalog">TokoMicro</a></div>';
  }
}

window.addEventListener('hashchange', render);

window.addEventListener('unhandledrejection', (e) => {
  console.error('[shell] promise gagal:', e.reason);
  toast('Terjadi kesalahan pada salah satu modul. Periksa konsol.', 'error');
});

mountHeader();
render();
```

## 6. `shell/shell.css` — design tokens + tata letak

```css
:root {
  --bg: #f5f7fb;
  --card: #ffffff;
  --text: #1c2333;
  --text-2: #525a6b;
  --muted: #7b8494;
  --border: #e3e8f0;
  --accent: #4f46e5;
  --accent-soft: #eef2ff;
  --green: #16a34a;
  --red: #dc2626;
  --radius: 12px;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }
body { margin: 0; font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

.view { max-width: 960px; margin: 0 auto; padding: 24px 20px 64px; outline: none; }
.mfe-slot { animation: mfe-in .25s ease; }
@keyframes mfe-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.skeleton { display: grid; gap: 12px; }
.skeleton span {
  display: block; height: 86px; border-radius: var(--radius);
  background: linear-gradient(90deg, #e9edf6 25%, #f4f7fd 37%, #e9edf6 63%);
  background-size: 400% 100%; animation: shimmer 1.3s ease infinite;
}
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }

.error-box {
  border: 1px solid color-mix(in srgb, var(--red) 35%, var(--border));
  background: #fef2f2; border-radius: var(--radius); padding: 22px;
}
.error-box h2 { margin: 0 0 6px; font-size: 17px; color: var(--red); }
.error-box p { margin: 0 0 14px; font-size: 14px; color: var(--text-2); }

.btn {
  border: 1px solid var(--border); background: var(--card); color: var(--text);
  padding: 8px 16px; border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn:hover { border-color: var(--accent); color: var(--accent); }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { filter: brightness(1.06); color: #fff; }

.toast-root {
  position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
  display: grid; gap: 8px; z-index: 100;
}
.toast {
  padding: 10px 18px; border-radius: 99px; font-size: 13.5px; font-weight: 600;
  background: var(--text); color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.18);
  animation: mfe-in .2s ease;
}
.toast-error { background: var(--red); }
.toast-success { background: var(--green); }

.hd-fallback { padding: 14px 20px; background: var(--card); border-bottom: 1px solid var(--border); font-weight: 700; }
```

## 7. Remote `header`

```js
import { on } from '/shared/bus.js';
import { cartSummary } from '/shared/store.js';

const CSS_URL = '/remotes/header/header.css';
let root = null;
const disposers = [];

function ensureStyles() {
  if (document.querySelector(`link[href="${CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

export function mount(container, ctx) {
  ensureStyles();

  root = document.createElement('header');
  root.className = 'hd';
  root.innerHTML = `
    <div class="hd-inner">
      <a class="hd-brand" href="#/katalog">🛍️ TokoMicro</a>
      <nav class="hd-nav" aria-label="Navigasi utama">
        <a href="#/katalog"   data-nav="katalog">Katalog</a>
        <a href="#/keranjang" data-nav="keranjang">Keranjang <span class="hd-badge" data-badge hidden>0</span></a>
      </nav>
    </div>`;
  container.appendChild(root);

  const paintBadge = () => {
    const { qty } = cartSummary();
    const badge = root.querySelector('[data-badge]');
    badge.textContent = qty;
    badge.hidden = qty === 0;
  };

  const paintActive = (name) => {
    root.querySelectorAll('[data-nav]').forEach((a) => {
      a.classList.toggle('is-active', a.dataset.nav === name);
    });
  };

  paintBadge();
  paintActive(ctx.route);

  disposers.push(on('cart:change', paintBadge));
  disposers.push(on('route:change', (e) => paintActive(e.name)));
}

export function unmount() {
  disposers.splice(0).forEach((dispose) => dispose());
  root?.remove();
  root = null;
}
```

```css
.hd { background: var(--card, #fff); border-bottom: 1px solid var(--border, #e3e8f0); position: sticky; top: 0; z-index: 50; }
.hd-inner { max-width: 960px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.hd-brand { font-size: 17px; font-weight: 800; color: var(--text, #1c2333); }
.hd-nav { display: flex; gap: 6px; }
.hd-nav a { padding: 7px 12px; border-radius: 9px; font-size: 14px; font-weight: 600; color: var(--text-2, #525a6b); }
.hd-nav a:hover { background: var(--accent-soft, #eef2ff); text-decoration: none; }
.hd-nav a.is-active { background: var(--accent-soft, #eef2ff); color: var(--accent, #4f46e5); }
.hd-badge { display: inline-block; min-width: 18px; padding: 0 5px; margin-left: 4px; border-radius: 99px; background: var(--accent, #4f46e5); color: #fff; font-size: 11px; font-weight: 800; text-align: center; line-height: 18px; }
.hd-badge[hidden] { display: none; }
```

## 8. Remote `products`

```js
import { addItem, rupiah } from '/shared/store.js';

const CSS_URL = '/remotes/products/products.css';
const API_URL = '/api/products';

let root = null;
let controller = null;

function ensureStyles() {
  if (document.querySelector(`link[href="${CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

function card(p) {
  return `
    <article class="pf-card">
      <div class="pf-emoji" aria-hidden="true">${p.emoji}</div>
      <span class="pf-cat">${p.category}</span>
      <h3 class="pf-name">${p.name}</h3>
      <p class="pf-price">${rupiah(p.price)}</p>
      <button class="btn btn-primary pf-add" data-id="${p.id}">Tambah ke keranjang</button>
    </article>`;
}

export async function mount(container, ctx) {
  ensureStyles();

  root = document.createElement('section');
  root.className = 'pf';
  root.innerHTML = `
    <div class="pf-head">
      <h1>Katalog Produk</h1>
      <p>Data diambil dari <code>${API_URL}</code> oleh remote ini secara mandiri.</p>
      <div class="pf-filter" data-filter></div>
    </div>
    <div class="pf-grid" data-grid>Memuat produk…</div>`;
  container.appendChild(root);

  /* Batalkan request yang menggantung saat remote dibongkar. */
  controller = new AbortController();

  let products = [];
  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    products = await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return;
    root.querySelector('[data-grid]').innerHTML =
      `<p class="pf-error">Gagal memuat produk: ${err.message}</p>`;
    return;
  }

  const categories = ['Semua', ...new Set(products.map((p) => p.category))];
  const filterBox = root.querySelector('[data-filter]');
  filterBox.innerHTML = categories
    .map((c, i) => `<button class="pf-chip${i === 0 ? ' is-active' : ''}" data-cat="${c}">${c}</button>`)
    .join('');

  const grid = root.querySelector('[data-grid]');
  const paint = (cat) => {
    const list = cat === 'Semua' ? products : products.filter((p) => p.category === cat);
    grid.innerHTML = list.map(card).join('');
  };
  paint('Semua');

  filterBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    filterBox.querySelectorAll('.pf-chip').forEach((c) => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    paint(btn.dataset.cat);
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;
    const product = products.find((p) => p.id === btn.dataset.id);
    if (!product) return;
    addItem(product);
    ctx.toast(`${product.name} masuk keranjang`, 'success');
  });
}

export function unmount() {
  controller?.abort();
  controller = null;
  root?.remove();
  root = null;
}
```

```css
.pf-head h1 { margin: 0 0 4px; font-size: 24px; }
.pf-head p { margin: 0 0 14px; font-size: 13.5px; color: var(--muted, #7b8494); }
.pf-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.pf-chip { border: 1px solid var(--border, #e3e8f0); background: var(--card, #fff); color: var(--text-2, #525a6b); padding: 6px 14px; border-radius: 99px; font-size: 13px; font-weight: 600; cursor: pointer; }
.pf-chip.is-active { background: var(--accent, #4f46e5); border-color: var(--accent, #4f46e5); color: #fff; }
.pf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.pf-card { background: var(--card, #fff); border: 1px solid var(--border, #e3e8f0); border-radius: var(--radius, 12px); padding: 18px; display: grid; gap: 6px; }
.pf-emoji { font-size: 34px; }
.pf-cat { justify-self: start; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent, #4f46e5); background: var(--accent-soft, #eef2ff); padding: 2px 8px; border-radius: 99px; }
.pf-name { margin: 2px 0 0; font-size: 16px; }
.pf-price { margin: 0 0 10px; font-size: 15px; font-weight: 700; }
.pf-error { color: var(--red, #dc2626); font-size: 14px; }
```

## 9. Remote `cart`

```js
import { on } from '/shared/bus.js';
import { getCart, changeQty, removeItem, clearCart, cartSummary, rupiah } from '/shared/store.js';

const CSS_URL = '/remotes/cart/cart.css';
const API_URL = '/api/orders';

let root = null;
let controller = null;
const disposers = [];

function ensureStyles() {
  if (document.querySelector(`link[href="${CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

function emptyState() {
  return `
    <div class="ct-empty">
      <p>🧺 Keranjang masih kosong.</p>
      <a class="btn btn-primary" href="#/katalog">Pilih produk dulu</a>
    </div>`;
}

function listHtml() {
  const items = getCart();
  if (items.length === 0) return emptyState();

  const rows = items.map((i) => `
    <li class="ct-item">
      <span class="ct-emoji" aria-hidden="true">${i.emoji}</span>
      <div class="ct-info"><b>${i.name}</b><span>${rupiah(i.price)} / item</span></div>
      <div class="ct-qty">
        <button class="ct-btn" data-dec="${i.id}" aria-label="Kurangi">−</button>
        <span>${i.qty}</span>
        <button class="ct-btn" data-inc="${i.id}" aria-label="Tambah">+</button>
      </div>
      <b class="ct-sub">${rupiah(i.price * i.qty)}</b>
      <button class="ct-remove" data-del="${i.id}" aria-label="Hapus ${i.name}">✕</button>
    </li>`).join('');

  const { total } = cartSummary();
  return `
    <ul class="ct-list">${rows}</ul>
    <div class="ct-summary"><span>Total</span><b>${rupiah(total)}</b></div>
    <button class="btn btn-primary ct-checkout" data-checkout>Buat pesanan</button>`;
}

export function mount(container, ctx) {
  ensureStyles();

  root = document.createElement('section');
  root.className = 'ct';
  root.innerHTML = `
    <div class="ct-head">
      <h1>Keranjang</h1>
      <p>State keranjang berasal dari <code>shared/store.js</code> — satu sumber untuk semua remote.</p>
    </div>
    <div data-body></div>`;
  container.appendChild(root);

  const body = root.querySelector('[data-body]');
  const paint = () => { body.innerHTML = listHtml(); };
  paint();
  disposers.push(on('cart:change', paint));

  controller = new AbortController();

  body.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.matches('[data-inc]')) return changeQty(t.dataset.inc, 1);
    if (t.matches('[data-dec]')) return changeQty(t.dataset.dec, -1);
    if (t.matches('[data-del]')) {
      removeItem(t.dataset.del);
      return ctx.toast('Item dihapus dari keranjang.', 'info');
    }
    if (!t.matches('[data-checkout]')) return;

    const items = getCart();
    const button = t;
    button.disabled = true;
    button.textContent = 'Mengirim…';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        signal: controller.signal
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);

      clearCart();
      body.innerHTML = `
        <div class="ct-done">
          <h2>✅ Pesanan ${data.id} diterima</h2>
          <p>Total ${rupiah(data.total)} · ${items.length} jenis produk</p>
          <a class="btn btn-primary" href="#/katalog">Belanja lagi</a>
        </div>`;
      ctx.toast(`Pesanan ${data.id} berhasil dibuat`, 'success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      button.disabled = false;
      button.textContent = 'Buat pesanan';
      ctx.toast('Gagal membuat pesanan: ' + err.message, 'error');
    }
  });
}

export function unmount() {
  disposers.splice(0).forEach((dispose) => dispose());
  controller?.abort();
  controller = null;
  root?.remove();
  root = null;
}
```

```css
.ct-head h1 { margin: 0 0 4px; font-size: 24px; }
.ct-head p { margin: 0 0 18px; font-size: 13.5px; color: var(--muted, #7b8494); }
.ct-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.ct-item { display: grid; grid-template-columns: auto 1fr auto auto auto; align-items: center; gap: 14px; background: var(--card, #fff); border: 1px solid var(--border, #e3e8f0); border-radius: var(--radius, 12px); padding: 12px 16px; }
.ct-emoji { font-size: 26px; }
.ct-info { display: grid; }
.ct-info span { font-size: 12.5px; color: var(--muted, #7b8494); }
.ct-qty { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.ct-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border, #e3e8f0); background: var(--card, #fff); cursor: pointer; }
.ct-sub { min-width: 96px; text-align: right; }
.ct-remove { border: 0; background: transparent; color: var(--muted, #7b8494); cursor: pointer; }
.ct-summary { display: flex; justify-content: space-between; margin: 18px 0 14px; padding: 14px 18px; border-radius: var(--radius, 12px); background: var(--accent-soft, #eef2ff); }
.ct-empty, .ct-done { text-align: center; padding: 42px 20px; background: var(--card, #fff); border: 1px dashed var(--border, #e3e8f0); border-radius: var(--radius, 12px); }
```

## 10. Uji coba mandiri

Coba lakukan lima percobaan berikut untuk memastikan Anda memahami arsitekturnya:

1. **Alur utama** — buka `http://localhost:4173`, tambahkan dua produk, buka keranjang, ubah jumlah, lalu buat pesanan. Nomor pesanan (`ORD-0001`) muncul.
2. **Perubahan mandiri** — ubah teks tombol di `remotes/products/products.js`, muat ulang halaman. Hanya katalog yang berubah.
3. **Isolasi kegagalan** — ubah isi `remotes/products/products.js` menjadi `export function mount(` (sintaks rusak), muat ulang. Header dan keranjang tetap berfungsi, hanya area konten yang menampilkan kotak galat dan tombol **Coba lagi**.
4. **Kebersihan listener** — buka DevTools → Event Listener Blocks, berpindah rute berkali-kali, lalu pastikan jumlah listener tidak terus bertambah.
5. **Jaringan** — pada tab Network, perhatikan `products.js` baru diunduh saat rute katalog dibuka, bukan di awal halaman.

## 11. Langkah lanjutan: pindah ke Vite + Module Federation

Setelah konsepnya jelas, pindahkan proyek ini ke tooling produksi. Contoh React
lengkapnya **sudah tersedia** di folder [`examples/micro-frontend-react/`](examples/micro-frontend-react/)
— shell + tiga remote (`header`, `products`, `cart`) yang dibangun mandiri lalu
digabungkan saat runtime dengan Module Federation:

```bash
cd examples/micro-frontend-react
npm install       # sekali saja, seluruh workspace
npm run build     # shell + 3 remote dibangun terpisah
npm start         # shell di :4173, remote di :4174–:4176
# buka http://localhost:4173
```

Bentuk proyeknya:

```text
micro-frontend-react/
├── server.js              # 4 origin terpisah + API palsu (CORS terbuka)
├── packages/shared/       # @tokomicro/shared — state keranjang (tanpa React)
└── apps/
    ├── shell/             # routing hash, React.lazy remote, error boundary
    ├── header/            # badge keranjang dari state bersama
    ├── products/          # katalog + fetch sendiri + AbortController
    └── cart/              # keranjang + checkout
```

Poin perubahan penting dari contoh tanpa build:

- `mount`/`unmount` diganti dengan komponen React biasa: shell memuatnya
  lewat `lazy(() => import('products/App'))`, sehingga *siklus hidup* remote
  diurus React (Suspense untuk skeleton, error boundary untuk galat).
- `shared/store.js` menjadi paket `@tokomicro/shared` yang dipakai bersama;
  state diletakkan di `globalThis` agar tetap satu instance walau tiap remote
  menggandakannya ke bundel sendiri — alternatifnya mendaftarkan paket itu di
  `shared` Module Federation dengan `singleton: true`.
- Setiap remote dibangun menghasilkan `remoteEntry.js` sendiri, lalu didaftarkan
  di shell melalui `remotes` pada `vite.config.js` (alamatnya bisa diganti lewat
  variabel lingkungan, bukan lewat kode shell).
- Shell tetap bertugas: routing, layout, `ctx` (navigasi & toast), serta
  error boundary per remote.

Bila harus menulis konfigurasi sendiri dari nol, kerangkanya seperti berikut.

```bash
npm create vite@latest apps/shell -- --template react
npm create vite@latest apps/products -- --template react
npm create vite@latest apps/cart -- --template react
npm install -D @originjs/vite-plugin-federation
```

Poin perubahan penting:

- `mount`/`unmount` diganti dengan lifecycle single-spa atau lifecycle bawaan plugin federasi.
- `shared/store.js` dipindahkan ke `packages/shared` dan di-*bundle* oleh shell sebagai *shared dependency* (`singleton: true`).
- Setiap remote dibangun menghasilkan `remoteEntry.js`, lalu didaftarkan di shell melalui manifest.
- Shell tetap bertugas: routing, layout, auth global, dan error boundary.

---

# Checklist Kesiapan Mahir

- [ ] Mampu menjelaskan micro-frontend dengan bahasa bisnis, bukan istilah teknis.
- [ ] Mampu memilih teknik komposisi dan mempertimbangkan biayanya.
- [ ] Mampu membangun shell dengan routing, lazy loading, dan error boundary.
- [ ] Mampu mendesain event bus dan shared state yang kecil tapi cukup.
- [ ] Mampu menjaga isolasi CSS di banyak remote.
- [ ] Mampu mengatur autentikasi sekali login untuk banyak remote.
- [ ] Mampu membangun dan merilis satu remote secara mandiri.
- [ ] Mampu menulis unit, contract, dan end-to-end test untuk komposisi.
- [ ] Mampu memantau performa dan kegagalan per remote.
- [ ] Mampu mengevaluasi ulang dan menyarankan kembali ke monolith bila sudah tidak layak.

---

# Referensi Resmi

### Konsep dan praktik

- https://martinfowler.com/articles/micro-frontends.html
- https://microfrontends.io/
- https://module-federation.io/
- https://single-spa.org/
- https://12factor.net/

### Tooling dan build

- https://vite.dev/guide/
- https://github.com/originjs/vite-plugin-federation
- https://webpack.js.org/concepts/module-federation/
- https://nx.dev/
- https://turbo.build/repo/docs

### Pengujian dan observability

- https://playwright.dev/docs/intro
- https://testing-library.com/docs/
- https://opentelemetry.io/docs/
- https://web.dev/vitals/

### Referensi Bahasa Indonesia

- https://developer.mozilla.org/id/
- https://react.dev/ (dokumentasi resmi, tersedia terjemahan otomatis)
