# TokoMicro React — Contoh Micro-Frontend dengan React JS

Versi **React** dari contoh TokoMicro pada [`examples/micro-frontend/`](../micro-frontend/).
Satu shell + tiga remote (`header`, `products`, `cart`) yang dibangun **terpisah**
dengan Vite dan digabungkan saat runtime memakai **Module Federation** —
teknik komposisi yang dibahas pada Tahap 2 dan Tahap 7 materi
[`micro-frontend.md`](../../micro-frontend.md).

| | Contoh vanilla | Contoh React (ini) |
| --- | --- | --- |
| Framework | DOM JavaScript murni | React 18 |
| Build | tidak ada | Vite per remote |
| Penggabungan | `import()` dinamis | Module Federation (`remoteEntry.js`) |
| Kontrak remote | `mount()` / `unmount()` | komponen React + lifecycle bawaan React |
| State bersama | event bus + store modul | `globalThis` + `useSyncExternalStore` |
| Penangkap galat | `try/catch` di shell | React *error boundary* per remote |

## Menjalankan

Butuh Node.js 18+ dan koneksi internet untuk `npm install`.

```bash
cd examples/micro-frontend-react
npm install          # sekali saja, seluruh workspace
npm run build        # membangun shell + 3 remote secara terpisah
npm start            # → http://localhost:4173
```

Atau satu perintah: `npm run demo`.

> **Kenapa wajib build?** Mode dev Vite (`vite dev`) belum mendukung Module
> Federation. Federasi bekerja pada hasil build, jadi setiap perubahan kode
> perlu `npm run build` ulang — hanya remote yang berubah yang dibangun
> ulang, tetap mandiri.

## Empat origin, satu halaman

`server.js` melayani empat port sekaligus — meniru deployment asli di mana tiap
remote berada di server/CDN sendiri. CORS dibuka karena shell memang memuat
remote lintas origin.

| Port | Aplikasi | Folder build | Peran |
| --- | --- | --- | --- |
| 4173 | shell | `apps/shell/dist` | pemilik URL, layout, routing, error boundary, API `/api/*` |
| 4174 | header | `apps/header/dist` | logo, navigasi, badge keranjang |
| 4175 | products | `apps/products/dist` | katalog & filter kategori |
| 4176 | cart | `apps/cart/dist` | daftar item, jumlah, checkout |

## Struktur

```text
micro-frontend-react/
├── package.json           # npm workspaces: seluruh app dibangun dari satu install
├── server.js              # 4 origin + API palsu (/api/products, /api/orders)
├── packages/
│   └── shared/            # @tokomicro/shared — state keranjang (tanpa React)
└── apps/
    ├── shell/             # aplikasi induk
    │   ├── vite.config.js #   remotes + shared react (singleton)
    │   └── src/App.jsx    #   routing hash, lazy remote, error boundary, toast
    ├── header/
    │   ├── vite.config.js #   exposes: { './App': './src/App.jsx' }
    │   └── src/App.jsx
    ├── products/          # pola sama: remote mandiri + halaman uji sendiri
    └── cart/
```

Setiap remote punya `index.html` sendiri, sehingga bisa dibuka mandiri
(misal `vite preview --port 4175`) untuk dikembangkan tanpa menjalankan shell —
syarat rilis mandiri per tim (Tahap 9).

## Kontrak antar pihak

| Pihak | Kewajiban |
| --- | --- |
| Shell | menyiapkan slot, memuat remote lewat `import('nama/App')`, routing, skeleton, error boundary per remote, menyediakan `ctx` |
| Remote | mengekspor komponen default menerima `{ ctx }`, memakai awalan CSS sendiri, tidak mengimpor berkas internal remote lain |
| `@tokomicro/shared` | state satu instance untuk semua remote, tidak mengimpor remote maupun React |

`ctx` berisi `{ route, navigate(to), toast(message, type) }` — dibuat shell dan
diteruskan sebagai props. Cara kedua (untuk data lintas remote) adalah modul
bersama.

## Bagaimana state keranjang bisa satu

```text
header (port 4174)  ─┐
products (4175)     ─┼─ @tokomicro/shared → globalThis.__TOKOMICRO__.cart
cart (4176)         ─┘
```

Tiap remote menggandakan `@tokomicro/shared` ke bundelnya sendiri, tetapi
seluruh state diletakkan di `globalThis`, jadi tetap **satu instance**.
Komponen membacanya dengan `useSyncExternalStore(subscribe, getSnapshot)` —
API React untuk state eksternal; langganan otomatis dibersihkan saat remote
dibongkar (tanpa takut *listener leak*).

Alternatif setara: daftarkan paket bersama itu di `shared` Module Federation
dengan `singleton: true`, seperti `react` dan `react-dom` di
`vite.config.js` — bundler-lah yang menjamin satu salinan.

## Mengapa React hanya dimuat sekali

Keempat `vite.config.js` menyepakati hal yang sama:

```js
shared: {
  react: { singleton: true, requiredVersion: '^18.2.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.2.0' }
}
```

Shell yang menyiapkan React, remote tinggal memakai. Tanpa konfigurasi ini,
tiap remote membawa React sendiri → dua kinstance framework dalam satu halaman
(boros memori, konteks & hook bisa gagal terbaca).

## Uji coba mandiri

1. **Alur utama** — buka `http://localhost:4173`, tambah dua produk, lihat badge
   header bertambah, buka **Keranjang**, ubah jumlah, lalu **Buat pesanan**
   (`ORD-0001` muncul).
2. **Rilis mandiri** — ubah teks tombol di `apps/products/src/App.jsx`, jalankan
   `npm run build -w @tokomicro/products`, muat ulang halaman. Hanya katalog
   yang berubah; shell, header, dan cart tidak dibangun ulang.
3. **Isolasi kegagalan** — ubah isi `apps/products/src/App.jsx` menjadi
   `export default function` (sintaks rusak), `npm run build -w @tokomicro/products`,
   muat ulang. Shell tetap hidup: header jalan, area konten menampilkan kotak
   galat + tombol **Coba lagi**.
4. **Satu React** — di tab Network cari `react`; hanya satu bundel React yang
   dimuat meski ada empat aplikasi.
5. **Lazy per rute** — berpindah ke `#/keranjang` mengunduh chunk `cart` saat
   itu juga, bukan di awal halaman. Log `[shell] remote "…" siap dalam … ms`
   tercetak di konsol (observability, Tahap 8).

## Uji end-to-end (opsional)

Tersedia skrip uji asap browser headless dengan Playwright — alur lengkap
tambah ke keranjang → badge header → checkout:

```bash
npm install                 # bila belum
npm run build && node server.js   # terminal 1 (biarkan hidup)
npx playwright install chromium    # sekali saja, unduh browser
node e2e-smoke.mjs                # terminal 2 → HASIL: LULUS
```

Skrip ini juga memastikan tidak ada `console.error` maupun `pageerror`
selama alur berjalan — deteksi dini kegagalan komposisi antar remote.

## Menambah remote baru

1. Salin `apps/header` menjadi `apps/wishlist`, ubah `name` di `package.json`
   dan `name`/`exposes` di `vite.config.js`.
2. Daftarkan di `apps/shell/vite.config.js`: `remotes: { wishlist: remoteUrl('wishlist', 4177) }`.
3. Tambahkan port baru di `server.js`.
4. `npm install` lalu `npm run build`.
5. Muat dari shell: `lazy(() => import('wishlist/App'))`.

## Catatan versi

- Vite **5** + `@vitejs/plugin-react` **4** + `@originjs/vite-plugin-federation`
  **1.4.1** — kombinasi yang dipakai materi dan diuji pada contoh ini.
- React **18** agar cocok dengan `requiredVersion: '^18.2.0'` pada materi.
- `build.target: 'esnext'` dan `minify: false` wajib untuk plugin federasi.
- Versi remote dapat diganti tanpa membangun ulang shell lewat variabel
  lingkungan, misal `CART_REMOTE=https://cdn.example.com/cart/assets/remoteEntry.js npm start`.
