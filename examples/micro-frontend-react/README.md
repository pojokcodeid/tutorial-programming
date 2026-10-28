# TokoMicro React — Proyek Rujukan Micro-Frontend

Contoh lengkap micro-frontend dengan **React 18 + TypeScript + Vite + Module Federation**. Satu shell memuat empat remote yang dibangun, diuji, dan dirilis terpisah, ditambah satu aplikasi legacy untuk latihan migrasi.

Proyek ini dipakai oleh 20 bab materi micro-frontend di repositori utama. Setiap keputusan penting di sini punya alasan yang dijelaskan di bab terkait.

---

## Yang bisa kamu pelajari di sini

- Shell sebagai pemilik URL, layout, login, dan error boundary.
- Empat remote: `header`, `products`, `cart`, dan `account`.
- Kontrak bersama bertipe (`@tokomicro/contracts`) dan validasi Zod.
- State keranjang bersama tanpa menyalin data antar remote.
- Event bus bertipe untuk komunikasi antar remote.
- Design system + token + tema terang/gelap + Storybook.
- Autentikasi sekali login: access token di memori, refresh token di cookie `httpOnly`.
- Manifest remote dinamis, rilis berversi, dan rollback tanpa build ulang shell.
- Feature flag, telemetry, Web Vitals, dan halaman status.
- Pengujian unit, E2E, visual, dan laporan ukuran bundel.
- CI/CD dengan GitHub Actions.
- Migrasi bertahap dari aplikasi legacy lewat iframe.

---

## Prasyarat

- Node.js 18 atau lebih baru (disarankan 20+).
- npm 9+.
- Browser modern (Chromium/Firefox/Safari terbaru).

---

## Menjalankan

```bash
cd examples/micro-frontend-react

npm install
npm run build
npm start
```

Buka **http://localhost:4173**.

> Module Federation pada proyek ini memakai build produksi. Untuk pengembangan sehari-hari, jalankan `npm run build` lebih dulu, lalu `npm start`; shell akan memuat `remoteEntry.js` dari origin masing-masing.

### Akun demo

| Nama pengguna | Kata sandi | Peran |
| --- | --- | --- |
| `demo` | `demo123` | customer |
| `admin` | `admin123` | admin |

---

## Peta origin

Satu proses Node melayani enam origin berbeda agar batas jaringan antar tim terlihat nyata.

| Origin | Aplikasi | Isi |
| --- | --- | --- |
| `http://localhost:4173` | shell | Halaman induk, router, login, API `/api/*` |
| `http://localhost:4174` | header | Navigasi, badge keranjang, tema, bahasa |
| `http://localhost:4175` | products | Katalog + rute detail |
| `http://localhost:4176` | cart | Keranjang + checkout |
| `http://localhost:4177` | account | Profil, riwayat pesanan, dan halaman admin `/akun/admin` |
| `http://localhost:4178` | legacy | Aplikasi katalog lama (statis) |

Setiap origin remote juga melayani versi rilis:

```
http://localhost:4175/v/1.0.0/assets/remoteEntry.js
```

---

## Struktur folder

```
examples/micro-frontend-react/
├── apps/
│   ├── shell/            # BrowserRouter, auth, manifest, status, legacy
│   ├── header/           # remote: nav, badge, tema, locale
│   ├── products/         # remote: katalog + detail/:id
│   ├── cart/             # remote: keranjang + checkout
│   ├── account/          # remote: profil + pesanan + admin
│   └── legacy/           # aplikasi lama statis (tanpa bundler)
├── packages/
│   ├── contracts/        # tipe, skema Zod, deklarasi remote
│   ├── shared/           # state keranjang + event bus
│   ├── ui-kit/           # Button, Card, Badge, token, Storybook
│   ├── i18n/             # kamus id/en
│   └── telemetry/        # event, error, metrik
├── scripts/
│   ├── release.mjs       # salin build ke cdn/<remote>/<versi>
│   ├── rollback.mjs      # ganti manifest ke versi lama
│   └── perf-report.mjs   # laporan ukuran bundel
├── cdn/                  # manifest + hasil rilis (di-ignore)
├── tests/                # unit, setup, visual
├── e2e-smoke.mjs         # uji alur nyata dengan Playwright
└── server.js             # enam origin + API + penyajian versi
```

---

## Perintah penting

| Perintah | Fungsi |
| --- | --- |
| `npm run build` | Build semua aplikasi dengan Turbo |
| `npm run typecheck` | TypeScript di seluruh workspace |
| `npm test` | Unit test Vitest (shared, kontrak, UI, i18n) |
| `npm run test:e2e` | E2E Playwright; menyalakan server sendiri bila perlu |
| `npm run test:visual` | Tangkapan layar terang/gelap/status/mobile |
| `npm run perf` | Laporan ukuran bundel + cek budget |
| `npm run storybook` | Storybook design system di port 6006 |
| `npm run storybook:build` | Build Storybook statis |
| `npm run release -- products 1.1.0` | Rilis remote produk versi 1.1.0 |
| `npm run rollback -- products` | Rollback produk ke versi stabil sebelumnya |
| `npm start` | Jalankan enam origin |

Contoh rilis semua remote:

```bash
for app in header products cart account; do
  node scripts/release.mjs "$app" 1.0.0
done
```

Setelah rilis, muat ulang shell. Manifest `/api/remotes` akan menunjuk ke `/v/1.0.0/assets/remoteEntry.js`.

---

## Arsitektur singkat

```
                        ┌──────────────────────────────┐
                        │            SHELL             │
                        │ BrowserRouter · auth · flags │
                        │ manifest · error boundary    │
                        └──────────────┬───────────────┘
                                       │ ctx + slot
          ┌────────────────┬───────────┴──────────┬────────────────┐
          ▼                ▼                      ▼                ▼
     ┌─────────┐     ┌──────────┐          ┌──────────┐     ┌──────────┐
     │ header  │     │ products │          │   cart   │     │ account  │
     │ :4174   │     │  :4175   │          │  :4176   │     │  :4177   │
     └────┬────┘     └────┬─────┘          └────┬─────┘     └────┬─────┘
          │               │                     │                │
          └───────────────┴──────┬──────────────┴────────────────┘
                                 ▼
                    @tokomicro/contracts + shared
                    state keranjang · event · tipe ctx
```

Aturan batas yang dipegang:

1. Shell tidak mengimpor berkas internal remote; hanya `remote/App`.
2. Remote tidak punya halaman login sendiri; token diminta lewat `ctx.getToken()`.
3. Remote tidak memanggil API remote lain; komunikasi lewat kontrak event.
4. Gaya memakai token `--tm-*`, bukan warna hard-coded.
5. Setiap remote bisa dibuka sendiri lewat `MemoryRouter`.

---

## Autentikasi

- Access token disimpan **di memori** shell, berlaku 15 menit.
- Refresh token disimpan di cookie **`httpOnly` + `SameSite=Lax`**, dirotasi setiap refresh.
- Setelah reload, shell memanggil `/api/refresh`, lalu `/api/me`.
- Remote meminta token segar lewat `ctx.getToken()`; tidak ada salinan sesi di remote.

Akun demo ada di `server.js`. Di produksi, ganti dengan identity provider sungguhan.

---

## Rilis, versi, dan rollback

`cdn/manifest.json` menyimpan versi aktif tiap remote. Server membacanya dan membentuk URL lengkap sesuai host yang dipakai.

```bash
# 1. build
npm run build

# 2. rilis produk 1.0.0 dan 1.0.1
node scripts/release.mjs products 1.0.0
node scripts/release.mjs products 1.0.1

# 3. cek manifest
curl -s http://localhost:4173/api/remotes | python3 -m json.tool

# 4. rollback ke versi sebelumnya
node scripts/rollback.mjs products
```

Shell **tidak perlu di-build ulang** karena URL remote dibaca saat runtime.

---

## Telemetry dan status

Buka **http://localhost:4173/status**.

Halaman ini menampilkan:

- versi, pemilik, status, dan URL setiap remote;
- jumlah event, error, dan metrik yang masuk ke `/api/telemetry`;
- ringkasan per aplikasi.

Shell mengirim `boot_ms`, `remote_load_ms`, LCP, CLS, dan INP lewat `web-vitals`.

---

## Storybook

```bash
npm run storybook
```

Buka **http://localhost:6006**. Storybook hanya untuk `packages/ui-kit`, bukan untuk remote, supaya batas tanggung jawab tetap jelas.

---

## Lab pendamping

| Folder | Isi |
| --- | --- |
| `examples/micro-frontend-techniques` | iframe, Web Component, import map |
| `examples/micro-frontend-webpack` | Webpack 5 + varian Rspack |
| `examples/micro-frontend-ssr` | CSR vs SSR + hydration |

Lab dipisah agar proyek utama tetap ringan dan bisa dijalankan tanpa dependensi tambahan.

---

## Troubleshooting

**Shell menampilkan "Modul … tidak dapat dimuat".**
Pastikan `npm run build` sudah dijalankan dan keenam origin hidup. Buka URL `remoteEntry.js` di browser untuk memastikan 200.

**Remote gagal karena CORS.**
Server sudah mengirim `Access-Control-Allow-Origin`. Jika kamu mengganti port, perbarui `apps/shell/vite.config.ts` dan `server.js`.

**Halaman detail 404 setelah reload.**
Shell memakai SPA fallback. Pastikan kamu mengakses lewat `server.js`, bukan `file://`.

**Perubahan remote tidak terlihat.**
Manifest mungkin menunjuk versi CDN lama. Cek `/api/remotes`, lalu rilis ulang atau jalankan `node scripts/rollback.mjs`.

**Storybook tidak menemukan komponen.**
Jalankan dari root proyek: `npm run storybook`. Konfigurasi berada di `packages/ui-kit/.storybook`.

---

## Latihan

1. Tambahkan remote `wishlist` di port 4179 dengan rute `/wishlist`.
2. Tambahkan feature flag `newCheckout` untuk mengubah teks tombol checkout.
3. Buat event `tokomicro:wishlist-added` dan validasi payload-nya dengan Zod.
4. Tambahkan satu cerita Storybook untuk komponen baru.
5. Rilis `cart` versi `1.2.0`, lalu rollback dan bandingkan halaman status.

---

## Checkpoint

Kamu dianggap selesai mencoba proyek ini bila:

- [ ] `npm run typecheck`, `npm test`, `npm run build`, dan `npm run test:e2e` lulus.
- [ ] Bisa menambah produk, checkout, dan melihat pesanan di remote akun.
- [ ] Customer ditolak di `/akun/admin`; admin melihat seluruh pesanan lewat `scope=all`.
- [ ] Reload halaman tetap login.
- [ ] Tema bertahan setelah reload.
- [ ] `/status` menampilkan empat remote.
- [ ] Rilis lalu rollback mengubah URL di manifest tanpa build ulang shell.
- [ ] Mematikan satu origin remote tidak menjatuhkan shell.
