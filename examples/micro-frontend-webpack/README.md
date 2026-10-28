# Lab Micro-Frontend — Webpack 5 Module Federation (+ varian Rspack)

Lab ini membuat satu **host** dan satu **remote** React 18 + TypeScript yang
digabungkan saat runtime dengan **Module Federation**. Semua kode berada di
folder ini saja:

```text
examples/micro-frontend-webpack/
```

Kamu akan melihat dua hal sekaligus:

1. jalur utama memakai **Webpack 5** dan `ModuleFederationPlugin` bawaan
   `webpack`;
2. varian konfigurasi yang sama memakai **Rspack** (`@rspack/core` +
   `@module-federation/enhanced/rspack`).

Tidak ada Vite di lab ini. Build menghasilkan berkas statis, lalu `server.mjs`
melayaninya dari dua origin berbeda.

---

## 1. Apa yang kamu bangun

| Aplikasi | Port | Peran | Yang dimiliki |
| --- | --- | --- | --- |
| `apps/host` | **4181** | pemilik URL dan layout | header, hero, footer, `React.lazy` + `Suspense`, error boundary |
| `apps/remote` | **4182** | penyedia komponen | `remoteEntry.js`, ekspos `./App`, kartu produk |

Host **tidak** membundel kode remote. Saat halaman dibuka, host mengunduh
`http://localhost:4182/remoteEntry.js`, lalu memuat modul `remote/App` secara
dinamis.

Alurnya:

```text
Browser
  └─ http://localhost:4181
       ├─ index.html + host bundle
       └─ React.lazy(() => import('remote/App'))
            └─ fetch http://localhost:4182/remoteEntry.js
                 └─ fetch chunk remote (App + CSS)
                      └─ render <RemoteApp /> di dalam <Suspense>
```

Kontrak federasinya:

```text
Host   : remotes: { remote: 'remote@http://localhost:4182/remoteEntry.js' }
Remote : name: 'remote', filename: 'remoteEntry.js',
         exposes: { './App': './src/App.tsx' }
Bersama: react, react-dom, react/jsx-runtime → singleton
```

---

## 2. Prasyarat

- Node.js **18.18+** (disarankan 20 atau lebih baru)
- npm **9+** (lab memakai npm workspaces)
- Koneksi internet saat `npm install`

Cek versi:

```bash
node -v
npm -v
```

---

## 3. Install dan jalankan

Dari folder lab:

```bash
cd examples/micro-frontend-webpack
npm install
npm run build
npm start
```

Lalu buka:

- Host: **http://localhost:4181**
- Remote standalone: **http://localhost:4182**

Yang harus terlihat di host: header TokoMicro, hero, lalu **3 kartu produk**
yang berasal dari remote. Di DevTools → Network, kamu akan melihat permintaan
ke port **4182** untuk `remoteEntry.js` dan chunk remote.

> `npm start` hanya melayani hasil build. Tidak ada hot reload. Setiap kali
> kode berubah, jalankan `npm run build` lagi (atau hanya workspace yang
> berubah, lihat latihan).

### Script yang tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm install` | memasang dependensi workspace (script `install` di root memakai `--ignore-scripts` agar tidak rekursif) |
| `npm run build` | build host + remote dengan **Webpack 5** |
| `npm run build:webpack` | alias eksplisit untuk build Webpack |
| `npm run build:rspack` | build host + remote dengan **Rspack** (opsional) |
| `npm start` | jalankan server dua origin di port 4181 & 4182 |
| `npm test` | test konfigurasi + fungsi murni + artefak build (tanpa server) |
| `npm run typecheck` | cek TypeScript host dan remote |

Build Rspack menulis ke folder `dist` yang sama dengan Webpack. Jalankan salah
satu, bukan keduanya bersamaan. Kalau kamu berpindah engine, build ulang lalu
restart server.

---

## 4. Struktur folder

```text
micro-frontend-webpack/
├── package.json               # npm workspaces + script root
├── tsconfig.base.json         # pengaturan TypeScript bersama
├── .gitignore                 # node_modules, dist, dsb. tidak ikut commit
├── server.mjs                 # server statis 2 origin, CORS + SPA fallback
├── test.mjs                   # test tanpa server hidup
├── lib/
│   └── lab-config.mjs         # port, URL remote, parse/federation helper
├── apps/
│   ├── host/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── webpack.config.mjs # ModuleFederationPlugin dari webpack
│   │   ├── rspack.config.mjs  # varian Rspack
│   │   ├── public/index.html
│   │   └── src/
│   │       ├── index.ts       # async boundary → bootstrap
│   │       ├── bootstrap.tsx  # createRoot + render host
│   │       ├── App.tsx        # header + React.lazy('remote/App')
│   │       ├── ErrorBoundary.tsx
│   │       ├── styles.css
│   │       └── types/remote.d.ts
│   └── remote/
│       ├── package.json
│       ├── tsconfig.json
│       ├── webpack.config.mjs # exposes ./App + remoteEntry.js
│       ├── rspack.config.mjs  # varian Rspack
│       ├── public/index.html
│       └── src/
│           ├── index.ts       # async boundary untuk halaman standalone
│           ├── bootstrap.tsx
│           ├── App.tsx        # kartu produk (default export)
│           ├── styles.css
│           └── standalone.css
└── README.md
```

---

## 5. Bagian penting dari konfigurasi

### 5.1 Host — Webpack

`apps/host/webpack.config.mjs`:

```js
import webpack from 'webpack';

const { ModuleFederationPlugin } = webpack.container;

export default {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remote: 'remote@http://localhost:4182/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        'react/jsx-runtime': { singleton: true, requiredVersion: '^18.2.0' },
      },
    }),
  ],
};
```

`remotes` adalah peta nama lokal → `namaContainer@URL`. Nama `remote` di sini
yang kamu pakai di kode:

```tsx
const RemoteApp = React.lazy(() => import('remote/App'));
```

### 5.2 Remote — Webpack

`apps/remote/webpack.config.mjs`:

```js
new ModuleFederationPlugin({
  name: 'remote',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App.tsx',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
    'react/jsx-runtime': { singleton: true, requiredVersion: '^18.2.0' },
  },
});
```

Remote juga punya entry standalone (`src/index.ts` → `src/bootstrap.tsx`) supaya
bisa dibuka sendiri di port 4182. Entry itu **tidak** ikut dieksekusi saat host
memuat `remote/App`.

### 5.3 Kenapa ada `index.ts` dan `bootstrap.tsx`?

Karena `shared` tidak memakai `eager: true`, React harus selesai dimuat sebelum
kode aplikasi memakai React. Entry `index.ts` hanya berisi:

```ts
import('./bootstrap');
```

Ini disebut **async boundary**. Tanpa itu, Webpack bisa memunculkan:

```text
Shared module is not available for eager consumption
```

### 5.4 Kenapa `singleton: true`?

Host dan remote sama-sama mengimpor React. Tanpa `singleton`, tiap build bisa
membawa salinan React sendiri. Dua salinan React di satu halaman menyebabkan
masalah seperti:

```text
Invalid hook call. Hooks can only be called inside of the body of a function component.
```

Dengan `singleton: true` dan versi yang kompatibel, host dan remote berbagi satu
instance React/ReactDOM.

### 5.5 `publicPath` remote

Remote memakai:

```js
output: {
  publicPath: 'http://localhost:4182/',
}
```

Tujuannya agar chunk async milik remote tetap diambil dari **origin remote**,
bukan dari origin host. Kalau `publicPath` salah, `remoteEntry.js` bisa termuat
tetapi chunk `App` gagal diambil.

---

## 6. Webpack vs Rspack

| Aspek | Webpack 5 | Rspack |
| --- | --- | --- |
| Engine | JavaScript (Node.js) | Rust |
| Plugin federasi | `webpack.container.ModuleFederationPlugin` | `@module-federation/enhanced/rspack` |
| Berkas konfigurasi | `webpack.config.mjs` | `rspack.config.mjs` |
| TypeScript/TSX | `ts-loader` (atau loader lain) | `builtin:swc-loader` bawaan, tanpa paket loader tambahan |
| HTML | `html-webpack-plugin` | `rspack.HtmlRspackPlugin` bawaan |
| CSS di lab ini | `style-loader` + `css-loader` | `style-loader` + `css-loader` (kompatibel) |
| Kecepatan build | Baseline, matang | Umumnya lebih cepat, terutama di proyek besar |
| Ekosistem | Sangat luas; hampir semua loader/plugin ada | Tumbuh cepat; sebagian plugin/loader belum 1:1 |
| Cocok untuk | Proyek existing, kompatibilitas maksimal | CI/dev yang butuh cepat, migrasi bertahap |
| Risiko | Build besar bisa lambat | Perbedaan perilaku plugin/loader tertentu |

Kontrak federasinya **sama** di kedua engine:

```js
{
  name: 'remote',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App.tsx' },
  shared: { react: { singleton: true } /* ... */ }
}
```

Yang berubah terutama sumber plugin, cara menangani TypeScript, dan plugin HTML.
Di `rspack.config.mjs`, TSX ditangani `builtin:swc-loader` (loader SWC bawaan
Rspack), bukan `ts-loader`; karena itu ada aturan loader tambahan untuk
`.ts`/`.tsx` di konfigurasi Rspack.

### Catatan dependensi Rspack (opsional)

Lab ini menaruh `@rspack/core`, `@rspack/cli`, dan `@module-federation/enhanced`
di `devDependencies` root supaya `npm run build:rspack` bisa langsung dicoba.
Kalau kamu hanya ingin jalur Webpack:

1. hapus tiga dependensi tersebut dari `package.json`;
2. hapus script `build:rspack` di root dan di kedua app (opsional);
3. `npm install` ulang.

Konfigurasi `rspack.config.mjs` tetap disimpan sebagai referensi. Kalau kamu
memakai `rspack-plugin-federation` sebagai ganti `@module-federation/enhanced`,
opts `name`, `filename`, `exposes`, dan `shared` tetap sama; yang berbeda hanya
import plugin-nya.

---

## 7. Latihan

Kerjakan satu per satu, lalu build dan refresh browser.

1. **Ubah data produk.** Tambah produk keempat di
   `apps/remote/src/App.tsx`. Build hanya remote:
   ```bash
   npm run build -w @mf-lab/remote
   ```
   Host tidak perlu dibuild ulang karena remote dimuat saat runtime. Ini salah
   satu keuntungan komposisi runtime.

2. **Ubah tombol remote.** Ganti label `Tambah` / `Ditambahkan`, atau tampilkan
   jumlah item yang sudah ditambahkan. Perhatikan state ini tetap lokal di
   remote.

3. **Ekspos modul kedua.** Tambahkan `'./Cart': './src/Cart.tsx'` di `exposes`,
   buat komponen `Cart`, lalu render dari host lewat `React.lazy`. Jangan lupa
   tambahkan deklarasi tipe untuk `remote/Cart`.

4. **Tambah remote kedua.** Buat `apps/catalog` (atau remote lain), daftarkan di
   `remotes` host, dan tampilkan dua remote di halaman yang sama. Perhatikan
   bagaimana `shared` mencegah duplikasi React.

5. **Matikan remote saat host berjalan.** Hentikan server, atau ubah URL remote
   ke port yang salah, lalu build host. Error boundary harus menampilkan pesan
   ramah, bukan halaman putih. Kembalikan URL dan build ulang.

6. **Bandingkan ukuran build.** Build Webpack, catat ukuran `dist`:
   ```bash
   npm run build
   du -sh apps/host/dist apps/remote/dist
   ```
   Lalu build Rspack dan bandingkan:
   ```bash
   npm run build:rspack
   du -sh apps/host/dist apps/remote/dist
   ```
   Catat juga waktu build di terminal.

7. **Coba `eager: true`.** Ubah salah satu shared module menjadi `eager: true`
   di kedua config, lalu amati dampaknya pada bundle awal dan peringatan build.
   Diskusikan kapan `eager` masuk akal.

8. **Ganti port.** Ubah `HOST_PORT`/`REMOTE_PORT` di `lib/lab-config.mjs`,
   build ulang keduanya, dan pastikan URL remote di host ikut berubah. Jelaskan
   mengapa URL remote perlu di-build ulang (petunjuk: `remotes` ditanam saat
   build).

9. **Tambah routing.** Tambahkan hash router sederhana di host dan tampilkan
   remote hanya di route `/katalog`. Diskusikan siapa yang memiliki URL.

10. **Tambah health check.** Tambahkan endpoint `/health` di `server.mjs` yang
    mengembalikan JSON status kedua aplikasi. Jangan lupa CORS dan test tanpa
    server hidup.

---

## 8. Troubleshooting

### `Shared module is not available for eager consumption`

Penyebab: kode yang memakai React dieksekusi sebelum shared module siap.

Perbaikan: pertahankan pola async boundary:

```ts
// src/index.ts
import('./bootstrap');
```

dan pastikan entry di config menunjuk ke `src/index.ts`, bukan langsung ke
`bootstrap.tsx`.

### `remoteEntry.js` 404 / `Loading chunk ... failed`

Cek berurutan:

1. Apakah remote sudah dibuild? `ls apps/remote/dist/remoteEntry.js`
2. Apakah server hidup dan port 4182 bisa diakses?
   ```bash
   curl -I http://localhost:4182/remoteEntry.js
   ```
3. Apakah URL di `remotes` host sama dengan port server?
4. Apakah `publicPath` remote menunjuk ke origin remote?
5. Apakah kamu baru mengganti port tetapi belum build ulang host?

### CORS error di console

Server lab sudah mengirim:

```text
Access-Control-Allow-Origin: *
```

Kalau kamu memakai server lain, tambahkan header tersebut untuk `remoteEntry.js`
dan chunk remote. Untuk produksi, ganti `*` dengan origin host yang spesifik.

### `Invalid hook call` atau dua instance React

- Pastikan `react`, `react-dom`, dan `react/jsx-runtime` memakai
  `singleton: true` di **host dan remote**.
- Pastikan versi React host dan remote kompatibel (lab ini memakai 18.3.1).
- Hapus `node_modules` dan `package-lock.json` hanya jika kamu yakin ada
  duplikasi versi, lalu install ulang.

### TypeScript: `Cannot find module 'remote/App'`

Tambahkan/pertahankan deklarasi di
`apps/host/src/types/remote.d.ts`:

```ts
declare module 'remote/App' {
  import type { ComponentType } from 'react';
  const RemoteApp: ComponentType;
  export default RemoteApp;
}
```

### Port 4181 atau 4182 sudah dipakai

```bash
lsof -i :4181
lsof -i :4182
```

Hentikan proses yang memakai port, atau ubah port di `lib/lab-config.mjs` lalu
build ulang.

### Halaman host putih

1. Buka DevTools → Console.
2. Cek Network: apakah `remoteEntry.js` 200?
3. Cek apakah ada error boundary atau error JavaScript.
4. Pastikan `apps/host/dist/index.html` ada dan `npm start` dijalankan dari
   folder lab.

### `Cannot find module '@rspack/core'`

Jalur Rspack memang opsional. Pasang dependensinya:

```bash
npm install
```

Kalau kamu sengaja menghapusnya, cukup pakai `npm run build` (Webpack).

### Build Rspack menimpa hasil Webpack

Itu normal: keduanya menulis ke `apps/*/dist`. Build ulang dengan engine yang
kamu inginkan sebelum `npm start`.

### Perubahan kode tidak muncul

Lab ini bukan dev server dengan HMR. Jalankan `npm run build` lagi, lalu
refresh. Untuk remote saja:

```bash
npm run build -w @mf-lab/remote
```

`remoteEntry.js` dikirim dengan `Cache-Control: no-store`, jadi refresh biasa
biasanya cukup. Kalau masih ragu, hard refresh (Cmd/Ctrl + Shift + R).

---

## 9. Checkpoint verifikasi

Centang satu per satu. Semua perintah dijalankan dari
`examples/micro-frontend-webpack`.

- [ ] **Install bersih**
  ```bash
  npm install
  ```
  Selesai tanpa error, dan `node_modules/` tidak masuk git (lihat `.gitignore`).

- [ ] **Build Webpack**
  ```bash
  npm run build
  ```
  Exit code 0. Berkas ini ada:
  ```bash
  ls apps/host/dist/index.html
  ls apps/remote/dist/remoteEntry.js
  ```

- [ ] **Test tanpa server**
  ```bash
  npm test
  ```
  Semua test lulus. Setelah build, test artefak tidak di-skip.

- [ ] **Typecheck (opsional)**
  ```bash
  npm run typecheck
  ```
  Tidak ada error TypeScript.

- [ ] **Server dua origin**
  ```bash
  npm start
  ```
  Terminal menampilkan dua baris:
  ```text
  [host  ] http://localhost:4181  →  apps/host/dist
  [remote] http://localhost:4182  →  apps/remote/dist
  ```

- [ ] **Cek HTTP + CORS**
  Di terminal lain:
  ```bash
  curl -sI http://localhost:4181/ | head -n 8
  curl -sI http://localhost:4182/remoteEntry.js | head -n 8
  ```
  Keduanya `200 OK` dan menyertakan `Access-Control-Allow-Origin: *`.

- [ ] **Cek SPA fallback host**
  ```bash
  curl -s -H 'Accept: text/html' http://localhost:4181/katalog | head -n 3
  ```
  Harus mengembalikan HTML host (bukan 404).

- [ ] **Cek di browser**
  Buka `http://localhost:4181`:
  - header dan hero host tampil;
  - tiga kartu produk dari remote tampil;
  - tombol `Tambah` bisa berubah menjadi `Ditambahkan`;
  - Network menunjukkan `remoteEntry.js` dari port 4182;
  - Console tidak menampilkan error.

- [ ] **Remote standalone**
  Buka `http://localhost:4182` — katalog remote tampil tanpa host.

- [ ] **Varian Rspack (opsional)**
  Hentikan server, lalu:
  ```bash
  npm run build:rspack
  npm test
  npm start
  ```
  UI dan perilaku harus sama seperti hasil Webpack.

- [ ] **Batas lab**
  ```bash
  git status --short
  ```
  Hanya ada perubahan di `examples/micro-frontend-webpack/`. Tidak ada
  `node_modules` yang ter-stage.

---

## 10. Ringkasan konsep

- **Build terpisah, komposisi runtime.** Host dan remote punya build sendiri.
  Remote bisa dirilis tanpa membangun ulang host, selama kontrak `./App` stabil.
- **Kontrak eksplisit.** `exposes` di remote dan `remotes` di host adalah
  antarmuka antar tim.
- **Shared singleton.** React/ReactDOM harus satu instance agar hook, context,
  dan state library bekerja.
- **Async boundary.** Shared module harus siap sebelum kode aplikasi berjalan.
- **Origin terpisah.** `publicPath` dan CORS adalah hal nyata di deployment
  micro-frontend, bukan detail build.
- **Webpack vs Rspack.** Kontrak federasi sama; engine, plugin, dan tooling
  berbeda. Rspack bisa mempercepat build, tetapi ekosistem dan perilaku
  plugin/loader perlu diuji.

Selamat mencoba. Kalau kamu mengubah sesuatu, build ulang, jalankan `npm test`,
lalu cek checkpoint di atas.
