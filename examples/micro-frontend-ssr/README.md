# Lab SSR + Hydration untuk Micro-Frontend

Lab kecil untuk memahami **Server-Side Rendering (SSR)** dan **hydration** pada
React 18, lalu melihat implikasinya ketika kamu ingin memakai SSR di dunia
micro-frontend.

Di lab ini kamu tidak mengintegrasikan SSR ke Module Federation. Fokusnya justru
lebih dasar: **satu aplikasi React** yang bisa dibuka dalam dua mode, sehingga
kamu bisa membandingkan HTML yang dikirim server dengan HTML kosong yang dirakit
di browser.

```text
/ssr  → server mengambil data, renderToString, kirim HTML katalog, lalu hydrate
/csr  → server hanya kirim shell kosong; browser mengambil bundle + data
```

## Yang akan kamu pelajari

- Perbedaan alur CSR dan SSR pada satu halaman katalog produk.
- Kenapa SSR mengirim **HTML awal** dan apa yang terjadi saat **hydration**.
- Cara mengukur **first paint** dan waktu hydration di browser.
- Penyebab **hydration mismatch** dan bagaimana React 18 menanganinya.
- Tantangan SSR saat komponen berasal dari **remote micro-frontend**.
- Kapan SSR benar-benar diperlukan dan kapan justru tidak.

## Prasyarat

- Node.js **18+** (lab diuji dengan Node 24).
- npm.
- Browser modern dengan Performance API.

## Menjalankan

```bash
cd examples/micro-frontend-ssr
npm install
npm run dev
```

Buka:

- <http://localhost:5173/ssr> — mode SSR.
- <http://localhost:5173/csr> — mode CSR.
- <http://localhost:5173/ssr?mismatch=1> — demo hydration mismatch.
- <http://localhost:5173/api/products> — API lokal.

Mode development memakai **Express + Vite middleware**. Vite menangani
transformasi TypeScript/React dan asset; Express menangani route halaman, API,
dan pemanggilan `renderToString`.

Untuk mencoba hasil build production:

```bash
npm run build
npm start
```

`npm start` membaca `dist/client/index.html`, menyajikan asset statis dari
`dist/client`, dan memuat bundle SSR dari `dist/server/entry-server.js`.

Perintah lain:

```bash
npm run typecheck   # cek TypeScript
npm test            # build lalu jalankan test tanpa server hidup
npm run preview     # build + start
```

Port default adalah `5173`. Kalau bentrok:

```bash
PORT=5174 npm run dev
```

Simulasi latency API bisa diatur lewat `API_DELAY_MS`:

```bash
API_DELAY_MS=500 npm run dev
```

## Route

| Route | Yang terjadi |
| --- | --- |
| `/` | Redirect ke `/ssr`. |
| `/ssr` | Server memanggil `/api/products`, menjalankan `renderToString`, menyisipkan HTML + initial data ke template. |
| `/csr` | Server mengirim template dengan `<div id="root"></div>` kosong. |
| `/ssr?mismatch=1` | SSR dengan komponen probe yang sengaja berbeda antara server dan client. |
| `/csr?mismatch=1` | Probe tampil, tetapi tidak ada hydration sehingga tidak ada mismatch. |
| `/api/products` | JSON katalog lokal dengan delay buatan. |

## Struktur

```text
micro-frontend-ssr/
├── index.html                 # template Vite; #root kosong untuk CSR
├── package.json
├── server.mjs                 # Express: API, CSR, SSR, dev middleware, production static
├── test.mjs                   # test render string + injectHtml (tanpa server hidup)
├── tsconfig.json
├── vite.config.ts             # build client ke dist/client
├── data/
│   └── products.json          # sumber data API lokal
├── public/
│   └── styles.css             # CSS yang dipakai kedua mode
└── src/
    ├── App.tsx                # UI katalog, perbandingan, panel diagnosis
    ├── entry-client.tsx       # createRoot (CSR) atau hydrateRoot (SSR)
    ├── entry-server.tsx       # renderToString untuk server
    ├── global.d.ts            # tipe window.__INITIAL_DATA__ dll.
    └── types.ts               # Product, AppProps, ServerTiming
```

## Alur CSR

1. Browser meminta `/csr`.
2. Express mengirim `index.html` yang isinya hanya `<div id="root"></div>` dan
   `<script type="module" src="/src/entry-client.tsx">`.
3. Browser mengunduh dan mengeksekusi bundle React.
4. `entry-client.tsx` tidak menemukan `window.__INITIAL_DATA__`, jadi memakai
   `createRoot(...).render(<App mode="csr" />)`.
5. `App` baru memanggil `fetch('/api/products')` setelah mount.
6. Selama menunggu, yang terlihat adalah shell + skeleton. Katalog muncul setelah
   bundle dieksekusi dan API selesai.

Konsekuensinya: **HTML pertama kosong**, tetapi server tidak perlu merender
apa pun per request. Cocok untuk aplikasi yang sangat interaktif dan tidak butuh
SEO pada konten awalnya.

## Alur SSR

1. Browser meminta `/ssr`.
2. Express memanggil API lokal `/api/products` (self-fetch ke `127.0.0.1`) untuk
   mendapatkan data.
3. Express memanggil `renderToString(<App mode="ssr" products={...} />)`.
4. HTML hasil render disisipkan ke `<div id="root">...</div>`.
5. Initial data disisipkan sebelum `</body>`:

   ```html
   <script>
     window.__INITIAL_DATA__ = { props: ..., timing: ... };
   </script>
   ```

6. Browser menerima HTML yang **sudah berisi katalog**.
7. Bundle client dieksekusi. Karena ada `window.__INITIAL_DATA__`,
   `entry-client.tsx` memakai `hydrateRoot(...)`, bukan `createRoot(...)`.
8. React mencocokkan HTML server dengan hasil render client. Kalau cocok, React
   hanya memasang event listener dan state, tanpa membangun ulang DOM.

Konsekuensinya: **first paint sudah berisi konten**, tetapi server menanggung
biaya fetch + render per request. Di lab ini API sengaja diberi delay 120 ms,
jadi first paint SSR bisa terlihat lebih lambat daripada first paint CSR. Yang
membedakan adalah isi paint-nya: SSR sudah menampilkan katalog, CSR masih
skeleton. Karena itu panel perbandingan juga menampilkan kapan **katalog**
benar-benar muncul.

## Hydration itu apa?

Hydration adalah proses mengambil alih HTML yang sudah ada di DOM dan
menjadikannya aplikasi React yang interaktif.

```tsx
// entry-client.tsx (ringkas)
if (window.__INITIAL_DATA__) {
  hydrateRoot(rootElement, <App {...props} />, { onRecoverableError });
} else {
  createRoot(rootElement).render(<App {...props} />);
}
```

Syarat hydration: **markup server dan markup client pertama harus sama**.
Perbedaan kecil seperti waktu, angka acak, `localStorage`, `window`, atau format
tanggal bisa memicu peringatan:

```text
Text content did not match. Server: "..." Client: "..."
Hydration failed because the initial UI does not match what was rendered on the server.
```

React 18 akan mencoba memulihkan bagian yang mismatch, tetapi ini membuang
manfaat SSR dan bisa menyebabkan flicker. Di production, React juga bisa
merender ulang seluruh root.

### Demo mismatch di lab ini

Buka `/ssr?mismatch=1`. Komponen `HydrationProbe` sengaja merender:

- `SERVER` saat `renderToString` (tidak ada `window`).
- `CLIENT` saat hydration di browser.

React mendeteksi perbedaan ini. Lab menangkap error lewat opsi
`onRecoverableError` dan juga menangkap pesan `console.error` di development,
lalu menampilkannya di panel diagnosis. Buka Console browser untuk melihat pesan
asli React.

Waktu hydration di panel adalah perkiraan setelah frame pertama, bukan hasil
profiler React. Angka ini cukup untuk melihat dampak relatif, bukan untuk
benchmark produksi.

> Di build production, pesan React diminifikasi (misalnya error #425/#418/#423).
> Jalankan `npm run dev` kalau kamu ingin membaca pesan lengkapnya.

### Cara menghindari mismatch

- Jangan render `Date.now()`, `Math.random()`, atau locale browser langsung saat
  render awal.
- Pindahkan akses `window`, `localStorage`, dan `matchMedia` ke `useEffect`.
- Kirim nilai yang bergantung pada server lewat initial data, lalu pakai nilai
  yang sama di client.
- Pastikan data yang dipakai `renderToString` dan render pertama client identik.
- Hindari perbedaan format angka/tanggal antara ICU Node dan browser; lab ini
  memakai formatter rupiah manual agar deterministik.

## Perbandingan singkat

| Aspek | CSR | SSR |
| --- | --- | --- |
| HTML pertama | Kosong, hanya `#root` | Sudah berisi katalog |
| Data produk | Fetch setelah JS | Diambil saat request |
| First paint | Cepat, tetapi sering masih shell/skeleton | Bisa lebih lambat karena menunggu data, tetapi paint berisi konten |
| Waktu interaktif | Setelah bundle dieksekusi | Setelah hydration |
| Beban server | Hampir hanya file statis | Fetch + render per request |
| Cocok untuk | Dashboard, aplikasi internal, halaman sangat interaktif | Konten publik, SEO, pratinjau sosial, halaman yang perlu cepat terlihat |
| Risiko utama | Konten terlambat terlihat, SEO lemah | TTFB naik, server lebih berat, hydration mismatch |

## Tantangan SSR pada micro-frontend

Ini bagian yang membuat SSR di micro-frontend jauh lebih rumit daripada SSR
aplikasi tunggal.

### 1. `remoteEntry` adalah konsep runtime browser

Module Federation memuat remote lewat `remoteEntry.js` dan `import()` dinamis.
Di server, belum tentu ada `window`, `document`, atau DOM. Remote juga bisa
memakai API browser saat modul dievaluasi. Artinya, komponen remote yang aman di
client belum tentu bisa dirender dengan `renderToString`.

Pertanyaan yang harus dijawab:

- Apakah setiap remote punya build SSR sendiri?
- Siapa yang menyediakan React singleton di server?
- Bagaimana server menemukan URL/versi remote yang benar?
- Bagaimana CSS remote diekstrak dan diurutkan?

Pola yang umum: SSR hanya untuk shell, sementara remote dirender client-side
sebagai island; atau setiap remote dirender terpisah di server lalu HTML-nya
dikomposisi (misalnya edge-side includes). Integrasi penuh SSR + Module
Federation butuh kontrak dan tooling tambahan, bukan sekadar menambahkan
`renderToString`.

### 2. Streaming dan Suspense

`renderToString` menunggu seluruh pohon selesai. Untuk halaman besar,
`renderToPipeableStream` + `Suspense` bisa mengirim shell lebih dulu, lalu
streaming bagian yang lambat. Di micro-frontend, batas `Suspense` sering
berimpit dengan batas remote. Kamu perlu memikirkan:

- urutan streaming dan hydration,
- error boundary per remote,
- fallback yang konsisten antara server dan client,
- remote yang gagal dimuat di tengah stream.

Lab ini sengaja memakai `renderToString` agar alurnya mudah diikuti. Streaming
adalah latihan lanjutan, bukan bawaan lab.

### 3. Caching

HTML SSR bisa di-cache di CDN, tetapi cache key harus mempertimbangkan:

- status login dan role pengguna,
- locale, mata uang, dan preferensi,
- versi remote yang sedang aktif,
- data yang cepat berubah (stok, harga),
- asset hash yang direferensikan HTML.

Jangan pernah men-cache HTML berisi data pribadi sebagai halaman publik. Di lab
ini route SSR memakai `Cache-Control: no-store` supaya eksperimen tidak
menampilkan data basi.

### 4. Auth dan data per request

Server perlu akses ke session/token untuk mengambil data yang dipersonalisasi.
Beberapa hal yang mudah salah:

- Token bocor ke `window.__INITIAL_DATA__`.
- Data user di-cache bersama pengguna lain.
- Fetch internal API kehilangan cookie/header asli.
- Auth dicek di client saja, padahal HTML sudah dirender server.

Initial data harus berisi data yang memang boleh dilihat browser, bukan rahasia
server. Untuk request yang bergantung pada user, gunakan context per request dan
jangan menyimpan state di variabel module global.

### 5. Routing, state, dan versi

Server harus tahu route mana yang dirender, termasuk 404, redirect, dan base
path. Kalau shell dan remote punya router masing-masing, sinkronisasi URL di
server dan client menjadi rumit. Version skew juga berbahaya: HTML dari versi
remote lama bisa di-hydrate oleh bundle remote baru.

### 6. Observability

SSR menambah titik gagal: fetch API gagal, render server error, remote tidak
SSR-safe, hydration mismatch, dan stream terputus. Kamu perlu log dan metrik
terpisah untuk server render, TTFB, hydration, serta error per remote.

## Kapan SSR diperlukan?

SSR masuk akal kalau:

- Halaman harus **terindeks mesin pencari** dan kontennya penting untuk SEO.
- Kamu ingin **konten terlihat cepat** di perangkat/jaringan lambat.
- Kamu butuh **pratinjau sosial** (Open Graph) yang berisi data.
- Halaman perlu data per request yang tidak bisa dihasilkan saat build.
- Kamu ingin mengurangi layout shift karena konten utama sudah ada.

SSR mungkin **tidak perlu** kalau:

- Aplikasi berada di balik login dan tidak perlu diindeks.
- Halaman sangat interaktif dan hampir seluruh UI bergantung pada state client.
- Kamu bisa memakai **SSG/ISR** karena kontennya statis atau jarang berubah.
- Tim belum siap menanggung kompleksitas server, caching, auth, dan observability.
- Micro-frontend-mu masih sangat dinamis dan belum punya kontrak SSR yang jelas.

SSR bukan default yang selalu lebih baik. Ia adalah trade-off antara **TTFB dan
beban server** dengan **kecepatan konten terlihat dan SEO**.

## Latihan

1. **Latency API**: jalankan `API_DELAY_MS=800 npm run dev`, lalu bandingkan
   first paint dan waktu katalog muncul di `/ssr` vs `/csr`.
2. **Halaman detail**: tambahkan `/produk/:id` yang dirender SSR. Tangani produk
   yang tidak ditemukan dengan status 404 yang benar.
3. **Streaming**: ganti `renderToString` dengan `renderToPipeableStream` dan
   bungkus katalog dalam `Suspense`. Ukur TTFB sebelum dan sesudah.
4. **Cache publik**: tambahkan cache in-memory/CDN untuk katalog publik. Pastikan
   route yang berisi data user tetap `no-store`.
5. **Remote yang tidak SSR-safe**: buat komponen yang mengakses `window` saat
   render. Lihat error di server, lalu perbaiki dengan `useEffect` atau guard
   `typeof window`.
6. **Mismatch yang halus**: render waktu server di salah satu komponen, amati
   peringatan, lalu perbaiki dengan mengirim timestamp lewat initial data.
7. **Auth**: tambahkan cookie sederhana dan tampilkan nama user di HTML SSR.
   Pastikan token asli tidak ikut masuk ke initial data.

## Checkpoint

- [ ] `/csr` punya `<div id="root"></div>` kosong saat View Source.
- [ ] `/ssr` sudah berisi nama produk saat View Source, sebelum JavaScript jalan.
- [ ] Dengan JavaScript dimatikan, `/ssr` tetap menampilkan katalog sedangkan
      `/csr` benar-benar kosong.
- [ ] Network tab menunjukkan response SSR berisi HTML katalog; response CSR hanya
      shell.
- [ ] Panel diagnosis SSR default menunjukkan **tidak ada mismatch**.
- [ ] `/ssr?mismatch=1` menampilkan peringatan mismatch dan probe berubah dari
      `SERVER` menjadi `CLIENT`.
- [ ] Kamu bisa menjelaskan kenapa first paint SSR di lab ini bisa lebih lambat
      daripada CSR, tetapi paint-nya sudah berisi katalog.
- [ ] `npm test` lulus tanpa menyalakan server.
- [ ] Kamu bisa menjelaskan minimal tiga alasan kenapa `remoteEntry` menyulitkan
      SSR.

## Bacaan lanjutan

- [React: `renderToString`](https://react.dev/reference/react-dom/server/renderToString)
- [React: `hydrateRoot` dan `onRecoverableError`](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React: streaming dengan `renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [Vite: Server-Side Rendering](https://vitejs.dev/guide/ssr.html)
- [Module Federation](https://module-federation.io/) — perhatikan catatan SSR dan
  batasan runtime-nya.
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)

**Next.js** dan **Astro** adalah opsi populer yang menangani routing, data
fetching, streaming, dan build SSR/SSG. Keduanya sengaja tidak dipakai di lab ini
agar kamu bisa melihat mekanisme `renderToString` + `hydrateRoot` secara langsung
tanpa framework tambahan. Setelah memahami lab ini, mempelajari keduanya akan
terasa lebih mudah.

## Troubleshooting

**`npm start` gagal: build belum ada.** Jalankan `npm run build` lebih dulu.

**Port 5173 dipakai.** Gunakan `PORT=5174 npm run dev` atau
`PORT=5174 npm start`.

**`/csr` menampilkan error fetch `/api/products`.** Pastikan kamu membuka lewat
Express (`npm run dev`), bukan hanya `vite` tanpa server API.

**Peringatan mismatch tidak terbaca.** Build production memakai React yang
diminifikasi. Jalankan `npm run dev` dan buka Console.

**`npm test` gagal mengimpor `dist/server/entry-server.js`.** Jalankan
`npm test` (yang otomatis build), bukan `node --test test.mjs` pada repo yang
belum dibuild.

**Versi Node terlalu lama.** Lab membutuhkan Node 18+ karena memakai `fetch`
global dan `node --test`.
