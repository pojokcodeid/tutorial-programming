# Panduan Micro-Frontend: Dari Nol sampai Produksi

**Dari satu tim yang saling menunggu menjadi banyak tim yang bisa merilis sendiri.**

Panduan ini adalah jalur belajar 20 bab untuk membangun micro-frontend yang benar-benar bisa dijalankan, diuji, dirilis, dan di-rollback. Semua praktik memakai **React 18 + TypeScript + Vite 5 + Module Federation**, dengan proyek rujukan **TokoMicro React** di [`examples/micro-frontend-react/`](examples/micro-frontend-react/).

Kamu tidak perlu menghafal semua istilah. Yang penting adalah bisa menjalankan proyek, memahami batas tanggung jawab, dan tahu kapan arsitektur ini justru merugikan.

---

## Daftar Isi

**Bagian A — Fondasi**
1. [Memahami Micro-Frontend dan Biayanya](#bab-1--memahami-micro-frontend-dan-biayanya)
2. [Anatomi, Batas Tanggung Jawab, dan Tujuh Teknik Komposisi](#bab-2--anatomi-batas-tanggung-jawab-dan-tujuh-teknik-komposisi)
3. [Menyiapkan Monorepo dan Lingkungan Kerja](#bab-3--menyiapkan-monorepo-dan-lingkungan-kerja)

**Bagian B — Shell dan Remote**
4. [Membangun Shell React TypeScript](#bab-4--membangun-shell-react-typescript)
5. [Remote Pertama dengan Module Federation](#bab-5--remote-pertama-dengan-module-federation)
6. [Routing Bersarang dan Kontrak Remote](#bab-6--routing-bersarang-dan-kontrak-remote)

**Bagian C — Kontrak dan Data**
7. [State Bersama dan Event Bus Bertipe](#bab-7--state-bersama-dan-event-bus-bertipe)
8. [Design System, Token, dan Isolasi Gaya](#bab-8--design-system-token-dan-isolasi-gaya)
9. [Data, API, BFF, dan Validasi Kontrak](#bab-9--data-api-bff-dan-validasi-kontrak)
10. [Sekali Login, Token, dan Otorisasi](#bab-10--sekali-login-token-dan-otorisasi)

**Bagian D — Identitas dan Ketahanan**
11. [Manifest Dinamis dan Feature Flag](#bab-11--manifest-dinamis-dan-feature-flag)
12. [Error Boundary, Suspense, dan Isolasi Kegagalan](#bab-12--error-boundary-suspense-dan-isolasi-kegagalan)

**Bagian E — Kualitas dan Operasi**
13. [Menguji Micro-Frontend](#bab-13--menguji-micro-frontend)
14. [Observability: Telemetry, Web Vitals, dan Status](#bab-14--observability-telemetry-web-vitals-dan-status)
15. [Performa dan Budget Bundel](#bab-15--performa-dan-budget-bundel)
16. [Rilis Mandiri, CDN Berversi, dan Rollback](#bab-16--rilis-mandiri-cdn-biversi-dan-rollback)
17. [CI/CD dan Kepemilikan Tim](#bab-17--cicd-dan-kepemilikan-tim)

**Bagian F — Produksi dan Evolusi**
18. [Migrasi Bertahap dari Aplikasi Legacy](#bab-18--migrasi-bertahap-dari-aplikasi-legacy)
19. [Keamanan, Aksesibilitas, dan Tata Kelola](#bab-19--keamanan-aksesibilitas-dan-tata-kelola)
20. [Proyek Akhir: TokoMicro End-to-End](#bab-20--proyek-akhir-tokomicro-end-to-end)

**Lampiran**
- [A. Peta perintah](#lampiran-a--peta-perintah)
- [B. Glosarium](#lampiran-b--glosarium)
- [C. Checklist produksi](#lampiran-c--checklist-produksi)
- [D. Rujukan](#lampiran-d--rujukan)

---

## Sebelum Mulai

### Prasyarat

Kamu sudah nyaman dengan:

- JavaScript modern: modul ES, `async/await`, destructuring, `Promise`.
- React: komponen, props, `useState`, `useEffect`, `React.lazy`, `Suspense`.
- TypeScript dasar: tipe objek, union, `interface`, generics sederhana.
- Terminal, npm, dan Git.
- Dasar HTTP: request/response, status code, header, cookie.

Jika belum, pelajari dulu materi React, TypeScript, HTTP, dan Git di repositori ini. Micro-frontend bukan tempat pertama belajar React.

### Yang akan kamu bangun

**TokoMicro** — toko daring kecil dengan enam origin:

| Origin | Aplikasi | Tanggung jawab |
| --- | --- | --- |
| `4173` | shell | Layout, URL, login, manifest, error boundary, API |
| `4174` | header | Navigasi, badge keranjang, tema, bahasa |
| `4175` | products | Katalog dan detail produk |
| `4176` | cart | Keranjang dan checkout |
| `4177` | account | Profil, riwayat pesanan, dan halaman admin |
| `4178` | legacy | Aplikasi lama untuk latihan migrasi |

Semua kode ada di [`examples/micro-frontend-react/`](examples/micro-frontend-react/).

### Cara memakai panduan ini

1. Baca konsep di bab.
2. Jalankan praktiknya di proyek rujukan.
3. Periksa bagian **Verifikasi** sebelum lanjut.
4. Catat jebakan yang kamu temui.
5. Kerjakan 3 soal kuis di aplikasi materi.

Estimasi: 12–16 minggu, 5–8 jam per minggu. Bisa lebih cepat jika kamu sudah pernah memakai Module Federation.

---

## Bab 1 — Memahami Micro-Frontend dan Biayanya

**Tujuan:** memutuskan apakah micro-frontend layak untuk masalahmu, bukan sekadar mengikuti tren.

### Konsep inti

**Micro-frontend** adalah pendekatan menyusun satu halaman dari beberapa aplikasi frontend kecil yang:

1. **dimiliki satu tim**;
2. **dibangun dan diuji sendiri**;
3. **dirilis tanpa menunggu tim lain**;
4. **digabungkan saat runtime** oleh sebuah shell.

Kata “micro” menyangkut kepemilikan, bukan jumlah baris kode. Satu remote boleh berisi ribuan baris selama satu tim menguasainya.

| Bentuk | Satu build? | Rilis mandiri? | Cocok untuk |
| --- | --- | --- | --- |
| Monolith frontend | Ya | Tidak | Tim kecil, produk awal |
| Modular monolith | Ya | Tidak | Batas modul jelas, tim sedang |
| Micro-frontend | Tidak | Ya | Banyak tim, ritme rilis berbeda |
| Microservices | Tidak (backend) | Ya | Batas domain backend |

### Tiga masalah yang dijawab

- **Tim saling menunggu.** Perbaikan teks tombol tidak perlu menunggu build keranjang.
- **Ritme rilis berbeda.** Checkout bisa rilis harian; profil cukup bulanan.
- **Migrasi bertahap.** Satu rute lama bisa dipindahkan tanpa menulis ulang semuanya.

### Biaya yang harus diterima

- Kontrak antar remote harus dijaga.
- Routing menjadi lebih rumit.
- Shared state dan event perlu aturan.
- CSS bisa bertabrakan.
- Pengujian lintas aplikasi bertambah.
- Versi, manifest, CDN, dan rollback harus dioperasikan.
- Observability menjadi wajib, bukan opsional.

### Kapan sebaiknya tidak

- Hanya satu atau dua pengembang.
- Aplikasi masih CRUD sederhana.
- Belum ada CI/CD dan tes otomatis.
- Tidak ada waktu merawat kontrak dan observability.
- Konsistensi UX ketat tetapi belum ada design system.

### Praktik: tulis ADR

Buat `docs/adr/0001-micro-frontend.md`:

```md
# ADR 0001 — Memakai Micro-Frontend

## Konteks
- 4 tim, 3 zona rilis berbeda
- rilis monolith tiap 2 minggu, checkout butuh harian
- aplikasi lama akan dimigrasi bertahap

## Keputusan
Memakai micro-frontend dengan shell + remote per domain.

## Konsekuensi positif
- tim bisa rilis mandiri
- migrasi bertahap
- batas kepemilikan jelas

## Konsekuensi negatif
- perlu kontrak, manifest, observability
- biaya CI naik
- debugging lintas origin lebih sulit

## Alternatif yang ditolak
- modular monolith: rilis masih terkunci
- iframe semua: isolasi terlalu ketat, UX sulit disatukan
```

### Verifikasi

- [ ] Kamu bisa menjelaskan micro-frontend dalam satu kalimat tanpa kata “bundel kecil”.
- [ ] Kamu bisa menyebut tiga masalah organisasi yang dijawab.
- [ ] Kamu bisa menyebut tiga biaya nyata.
- [ ] ADR memuat konteks, keputusan, konsekuensi, dan alternatif.

### Jebakan

- Memilih micro-frontend karena “biar modern”.
- Menganggap micro-frontend otomatis mempercepat aplikasi. Belum tentu; tanpa disiplin, ia memperlambat.
- Memecah berdasarkan komponen, bukan berdasarkan kepemilikan tim atau domain.

### Ringkasan

Micro-frontend membeli kecepatan rilis dengan kompleksitas. Pilih hanya jika masalahnya organisasional dan kamu siap merawat kontrak, versi, serta observability.

---

## Bab 2 — Anatomi, Batas Tanggung Jawab, dan Tujuh Teknik Komposisi

**Tujuan:** memahami bagian-bagian sistem dan memilih teknik komposisi dengan alasan.

### Anatomi

```
┌──────────────────────────────────────────────┐
│                   SHELL                      │
│ URL · layout · login · manifest · boundary   │
└───────────────┬──────────────────────────────┘
                │ ctx + slot
     ┌──────────┼──────────┬──────────┐
     ▼          ▼          ▼          ▼
  header     products     cart     account
   :4174       :4175      :4176     :4177
     └──────────┴────┬─────┴──────────┘
                     ▼
        contracts · shared · ui-kit · telemetry
```

### Aturan batas

1. Shell tidak mengimpor berkas internal remote; hanya `remote/App`.
2. Remote tidak punya halaman login sendiri.
3. Remote tidak memanggil API remote lain.
4. Gaya memakai token, bukan warna hard-coded.
5. Setiap remote bisa berdiri sendiri untuk pengembangan.

### Tujuh teknik komposisi

| Teknik | Isolasi | Integrasi | Biaya utama |
| --- | --- | --- | --- |
| Build-time package | Rendah | Sangat mudah | Rilis terkunci |
| Runtime JS entry | Sedang | Fleksibel | Kontrak runtime |
| Module Federation | Sedang | Sangat fleksibel | Konfigurasi bundler |
| Web Components | Tinggi | Sedang | Shadow DOM, event |
| iframe | Sangat tinggi | Rendah | Layout, komunikasi, SEO |
| single-spa | Sedang | Tinggi | Router orkestrasi |
| Server-side/ESI | Tinggi | Sedang | Infrastruktur server |

### Memilih teknik

- Butuh rilis mandiri + UX menyatu → **Module Federation**.
- Aplikasi lama yang tidak boleh disentuh → **iframe** dulu.
- Widget lintas framework → **Web Components**.
- Prototipe tanpa bundler → **import map**.
- Halaman yang SEO-nya kritis → pertimbangkan **SSR/ESI**, bukan CSR murni.

### Praktik: pilih teknik untuk tiga skenario

Tulis tabel keputusan:

```text
Skenario A — dashboard internal, 3 tim, rilis mingguan
  Pilihan: Module Federation
  Alasan: butuh rilis mandiri, UX satu halaman

Skenario B — aplikasi akuntansi lama, tim baru ingin menambah halaman
  Pilihan: iframe / route terpisah
  Alasan: risiko migrasi rendah, isolasi maksimal

Skenario C — widget rekomendasi di 5 situs berbeda
  Pilihan: Web Component
  Alasan: lintas framework, gaya terisolasi
```

### Verifikasi

- [ ] Kamu bisa menggambar shell, remote, dan shared module.
- [ ] Kamu bisa menyebut satu kelebihan dan satu biaya untuk tiga teknik.
- [ ] Kamu bisa menjelaskan mengapa iframe bukan default untuk semua kasus.

### Jebakan

- Memakai iframe untuk semua hal lalu kesulitan menyatukan navigasi dan tema.
- Memakai Module Federation tanpa kontrak sehingga remote saling mengetahui internal.
- Menganggap Web Components selalu lebih aman; Shadow DOM tidak menyelesaikan masalah data dan auth.

### Ringkasan

Tidak ada teknik terbaik secara universal. Pilih berdasarkan isolasi yang dibutuhkan, tingkat integrasi UX, dan biaya operasi yang sanggup kamu rawat.

---

## Bab 3 — Menyiapkan Monorepo dan Lingkungan Kerja

**Tujuan:** menyiapkan workspace yang bisa membangun banyak aplikasi tanpa saling mengganggu.

### Struktur

```
apps/
  shell/
  header/
  products/
  cart/
  account/
  legacy/
packages/
  contracts/
  shared/
  ui-kit/
  i18n/
  telemetry/
```

`apps/*` adalah aplikasi yang di-deploy. `packages/*` adalah kode bersama yang tidak punya origin sendiri.

### npm workspaces

```json
{
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "build": "turbo run build",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "vitest run"
  }
}
```

### TypeScript strict

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

### Port

| Aplikasi | Port |
| --- | --- |
| shell | 4173 |
| header | 4174 |
| products | 4175 |
| cart | 4176 |
| account | 4177 |
| legacy | 4178 |

### Praktik

```bash
cd examples/micro-frontend-react
npm install
npm run typecheck
npm run build
```

Periksa bahwa setiap `apps/*/dist/assets/remoteEntry.js` ada:

```bash
ls apps/*/dist/assets/remoteEntry.js
```

### Verifikasi

- [ ] `npm install` selesai tanpa error.
- [ ] `npm run typecheck` lulus di semua workspace.
- [ ] `npm run build` menghasilkan `dist` untuk lima aplikasi.
- [ ] Tidak ada `node_modules` di dalam `apps/*` atau `packages/*`.

### Jebakan

- Lupa `packageManager` di root; Turbo menolak berjalan.
- Dua versi React berbeda antar workspace.
- Mengimpor source package tanpa konfigurasi `exports`.
- Menjalankan `npm install` di dalam subfolder sehingga lockfile terpecah.

### Ringkasan

Monorepo menyatukan kode, bukan menyatukan rilis. Setiap aplikasi tetap punya build dan output sendiri.

---

## Bab 4 — Membangun Shell React TypeScript

**Tujuan:** shell yang memiliki URL, layout, sesi, dan batas kegagalan.

### Tanggung jawab shell

- `BrowserRouter` dan peta rute.
- Layout global dan slot remote.
- Login, logout, refresh token.
- Manifest remote dan feature flag.
- Error boundary per slot.
- Toast, halaman 404, halaman status.

### Yang tidak boleh dilakukan shell

- Mengimpor komponen internal remote.
- Memanggil API bisnis milik remote.
- Menyimpan state keranjang milik domain cart.
- Menentukan markup detail di dalam remote.

### Kerangka

```tsx
<BrowserRouter>
  <App />
</BrowserRouter>
```

Di dalam `App`:

```tsx
<Routes>
  <Route path="/" element={<Navigate to="/katalog" replace />} />
  <Route path="/katalog/*" element={<RemoteSlot name="products" />} />
  <Route path="/keranjang/*" element={<RemoteSlot name="cart" />} />
  <Route path="/akun/*" element={<ProtectedRoute><RemoteSlot name="account" /></ProtectedRoute>} />
  <Route path="/masuk" element={<LoginView />} />
  <Route path="/status" element={<StatusView />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Boot shell

Shell memuat tiga hal sekaligus:

```ts
const [manifest, flags, session] = await Promise.allSettled([
  fetchManifest(),
  fetchFlags(),
  refreshSession()
]);
```

Jika manifest gagal, shell memakai manifest bawaan. Jika sesi gagal, pengguna tetap bisa melihat katalog.

### Praktik

1. Buka `apps/shell/src/App.tsx`.
2. Tambahkan rute `/bantuan` yang merender komponen lokal sederhana.
3. Tambahkan tautan ke rute itu di header.
4. Jalankan `npm run typecheck` dan `npm run build`.
5. Buka `http://localhost:4173/bantuan` dan reload halaman.

### Verifikasi

- [ ] Deep link `/bantuan` tidak 404 setelah reload.
- [ ] Navigasi tidak memuat ulang halaman.
- [ ] Halaman 404 muncul untuk rute yang tidak dikenal.
- [ ] Judul dokumen berubah sesuai rute.

### Jebakan

- Memasang `BrowserRouter` di dalam remote → dua router bertabrakan.
- Lupa SPA fallback di server → deep link 404.
- Menaruh seluruh state aplikasi di shell → shell menjadi monolith baru.
- Tidak memfokuskan ulang konten setelah navigasi → pengguna screen reader kehilangan konteks.

### Ringkasan

Shell adalah pemilik halaman, bukan pemilik seluruh domain. Ia menyediakan konteks dan slot, lalu mundur dari urusan internal remote.

---

## Bab 5 — Remote Pertama dengan Module Federation

**Tujuan:** mengekspos satu komponen remote dan memuatnya dari shell.

### Konfigurasi remote

```ts
federation({
  name: 'header',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App.tsx' },
  shared: {
    react: { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
    'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' }
  }
})
```

### Konfigurasi shell

```ts
federation({
  name: 'shell',
  remotes: {
    header: 'http://localhost:4174/assets/remoteEntry.js',
    products: 'http://localhost:4175/assets/remoteEntry.js',
    cart: 'http://localhost:4176/assets/remoteEntry.js',
    account: 'http://localhost:4177/assets/remoteEntry.js'
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
    'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' }
  }
})
```

### Memuat remote

```tsx
const Header = lazy(() => import('header/App'));
```

Bungkus dengan `Suspense` dan `ErrorBoundary`.

### Mode mandiri

Remote memakai `MemoryRouter` saat dibuka sendiri:

```tsx
<MemoryRouter initialEntries={['/katalog']}>
  <App ctx={mockCtx} />
</MemoryRouter>
```

### Praktik

1. Buat remote sederhana yang mengekspos `./App`.
2. Tambahkan URL-nya ke konfigurasi shell.
3. Build remote, lalu shell.
4. Jalankan server dan buka shell.
5. Buka juga origin remote secara langsung.

### Verifikasi

- [ ] `curl -I http://localhost:4174/assets/remoteEntry.js` menghasilkan 200.
- [ ] Shell menampilkan remote tanpa error console.
- [ ] Remote bisa dibuka sendiri.
- [ ] Hanya ada satu React di halaman (cek `window.React` atau React DevTools).

### Jebakan

- Dua React karena `shared` tidak `singleton` → hook error.
- `react-router-dom` tidak di-share → `useContext` null saat memakai `Link`.
- CORS diblokir karena origin remote tidak mengizinkan shell.
- `remoteEntry.js` di-cache terlalu lama → versi lama terus dipakai.
- Build remote belum selesai tetapi shell sudah dijalankan.

### Ringkasan

Module Federation memungkinkan shell memuat kode yang tidak ia bangun. Kuncinya adalah kontrak yang stabil, shared dependency yang benar, dan origin yang bisa diakses.

---

## Bab 6 — Routing Bersarang dan Kontrak Remote

**Tujuan:** membagi URL antara shell dan remote tanpa konflik.

### Pembagian rute

| URL | Pemilik |
| --- | --- |
| `/` | shell (redirect) |
| `/katalog` | shell → remote products |
| `/katalog/detail/:id` | remote products |
| `/keranjang` | shell → remote cart |
| `/keranjang/checkout` | remote cart |
| `/akun` | shell → remote account (protected) |
| `/masuk` | shell |
| `/status` | shell |
| `/katalog-lama` | shell (iframe legacy) |

Shell hanya tahu prefix. Remote mengelola sisa URL dengan `<Routes>` bersarang.

```tsx
// remote products
<Routes>
  <Route index element={<ProductList />} />
  <Route path="detail/:id" element={<ProductDetail />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Kontrak `AppContext`

```ts
interface AppContext {
  route: string;
  params: URLSearchParams;
  href(path: string): string;
  navigate(path: string, options?: { replace?: boolean }): void;
  toast(message: string, type?: 'info' | 'success' | 'error'): void;
  user: User | null;
  getToken(): Promise<string | null>;
  login(username: string, password: string): Promise<User>;
  logout(): void;
  locale: 'id' | 'en';
  setLocale(locale: 'id' | 'en'): void;
  t(key: string, vars?: Record<string, string | number>): string;
  flags: Record<string, boolean>;
  telemetry: Telemetry;
  theme: 'light' | 'dark';
  toggleTheme(): void;
}
```

### Deklarasi tipe remote

```ts
declare module 'products/App' {
  import type { ComponentType } from 'react';
  import type { RemoteAppProps } from './index';
  const App: ComponentType<RemoteAppProps>;
  export default App;
}
```

### Praktik

1. Tambahkan rute `detail/:id` di remote products.
2. Tambahkan rute 404 di dalam remote.
3. Tambahkan tombol kembali yang memakai `Link to=".."`.
4. Uji URL langsung dan tombol back browser.

### Verifikasi

- [ ] `/katalog/detail/kb-01` merender detail.
- [ ] Reload URL detail tetap bekerja.
- [ ] Rute remote yang tidak dikenal menampilkan 404 remote, bukan blank.
- [ ] Shell tidak perlu tahu parameter `id`.

### Jebakan

- Remote memakai `window.location.hash` sementara shell memakai History API.
- Remote memasang `BrowserRouter` sendiri.
- Shell menangani rute detail, sehingga remote kehilangan otonomi.
- Tautan absolut ke `/katalog` dari dalam remote yang sedang standalone.

### Ringkasan

URL adalah kontrak. Shell memiliki prefix; remote memiliki sisanya. Jangan ada dua router yang bersaing.

---

## Bab 7 — State Bersama dan Event Bus Bertipe

**Tujuan:** berbagi state tanpa menyalin data dan tanpa impor antar remote.

### Tiga tingkat komunikasi

| Kebutuhan | Mekanisme |
| --- | --- |
| Navigasi, filter, deep link | URL |
| Kabar “sesuatu terjadi” | Event bus |
| Data yang dibaca banyak remote | Shared store |

### Shared store

`@tokomicro/shared` menyimpan keranjang di `globalThis`:

```ts
const namespace = (globalThis.__TOKOMICRO__ ??= {});
if (!namespace.cart) namespace.cart = { items: [], listeners: new Set() };
```

Mengapa `globalThis`? Karena setiap remote membundel modulnya sendiri. Tanpa satu objek global, header dan cart bisa memiliki salinan state berbeda.

### React binding

```tsx
const items = useSyncExternalStore(subscribe, getSnapshot);
```

`getSnapshot` harus mengembalikan referensi yang stabil sampai data berubah.

### Event bus

```ts
emitAddToCart({
  productId: 'kb-01',
  name: 'Keyboard Mekanik',
  price: 850_000,
  qty: 1,
  at: new Date().toISOString()
});
```

Penerima memvalidasi payload dengan Zod. Payload rusak diabaikan, bukan dipercaya.

### Kapan tidak memakai shared store

- Data hanya dipakai satu remote.
- Data adalah sumber kebenaran backend dan harus selalu segar.
- Data besar yang tidak perlu dimuat semua remote.

Gunakan API/BFF untuk data bisnis yang perlu konsistensi kuat.

### Praktik

1. Tambahkan event `tokomicro:wishlist-added`.
2. Buat skema Zod untuk payload-nya.
3. Kirim event dari remote products.
4. Tampilkan toast di shell saat event diterima.
5. Kirim payload rusak dan pastikan diabaikan.

### Verifikasi

- [ ] Badge header berubah tanpa reload.
- [ ] Payload tidak valid memunculkan warning, bukan crash.
- [ ] Listener dibersihkan saat unmount.
- [ ] Tidak ada impor langsung dari remote products ke remote cart.

### Jebakan

- Menyimpan state di module scope tanpa `globalThis` → salinan ganda.
- `getSnapshot` membuat objek baru setiap render → infinite loop.
- Event tanpa versi/skema → perubahan payload memecahkan penerima.
- Shared store dipakai untuk data yang seharusnya berasal dari server.

### Ringkasan

Gunakan URL untuk alamat, event untuk kabar, dan shared store hanya untuk state kecil yang memang milik bersama.

---

## Bab 8 — Design System, Token, dan Isolasi Gaya

**Tujuan:** tampilan konsisten tanpa CSS remote saling menimpa.

### Tiga lapis pertahanan

1. **Token** — warna, radius, font berasal dari `--tm-*`.
2. **Prefix kelas** — `.hd-`, `.pf-`, `.ct-`, `.ac-`.
3. **Isolasi kuat** — CSS Modules atau Shadow DOM bila benar-benar perlu.

### Token

```css
:root,
[data-theme='light'] {
  --tm-bg: #f5f7fb;
  --tm-card: #ffffff;
  --tm-text: #1c2333;
  --tm-accent: #4f46e5;
}

[data-theme='dark'] {
  --tm-bg: #0f1420;
  --tm-card: #171e2e;
  --tm-text: #eef2ff;
  --tm-accent: #818cf8;
}
```

Remote memakai:

```css
.card {
  background: var(--tm-card);
  color: var(--tm-text);
  border: 1px solid var(--tm-border);
}
```

### Tema

Shell memegang `useTheme` dan menulis `document.documentElement.dataset.theme`. Remote hanya membaca token; tidak perlu tahu bagaimana tema disimpan.

### Design system

`packages/ui-kit` berisi `Button`, `Card`, `Badge`, dan token. Storybook hanya untuk paket ini, bukan untuk remote, agar batas tanggung jawab jelas.

### Praktik

1. Tambahkan komponen `PriceTag` di `packages/ui-kit`.
2. Gunakan token, bukan warna literal.
3. Tambahkan story `PriceTag.stories.tsx`.
4. Jalankan `npm run storybook:build`.
5. Ganti tema dan pastikan kontras tetap terbaca.

### Verifikasi

- [ ] Tidak ada warna hard-coded di remote.
- [ ] Tema gelap mengubah seluruh halaman.
- [ ] Storybook berhasil di-build.
- [ ] Tidak ada reset global di CSS remote.

### Jebakan

- Remote menulis `body { ... }` → mengubah seluruh halaman.
- Memakai `!important` untuk menang melawan shell.
- Token diberi nama generik (`--primary`) lalu bertabrakan dengan library lain.
- Shadow DOM dipakai tanpa strategi tema dan event.

### Ringkasan

Konsistensi datang dari token dan komponen bersama; isolasi datang dari prefix dan batas CSS yang disiplin.

---

## Bab 9 — Data, API, BFF, dan Validasi Kontrak

**Tujuan:** setiap remote mengambil datanya sendiri dengan aman dan dapat diprediksi.

### Aturan

- Remote memiliki endpoint-nya sendiri.
- Remote tidak memanggil API remote lain.
- Bentuk respons divalidasi.
- Request dibatalkan saat komponen unmount.
- Loading, error, dan empty adalah keadaan yang dirancang.

### Fetch yang benar

```tsx
useEffect(() => {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch('/api/products', { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const parsed = productSchema.array().safeParse(data.products);
      if (!parsed.success) throw new Error('Bentuk data tidak sesuai kontrak');
      setProducts(parsed.data);
    } catch (error) {
      if (!controller.signal.aborted) setError(error);
    }
  })();

  return () => controller.abort();
}, []);
```

### BFF

Jika satu halaman butuh data dari beberapa layanan, jangan menyambungkannya di browser. Buat endpoint BFF:

```
GET /api/home
  → produk populer
  → status pesanan
  → rekomendasi
```

BFF juga tempat yang tepat untuk menggabungkan auth, cache, dan transformasi respons.

### Praktik

1. Tambahkan filter kategori dari API.
2. Rusak sengaja bentuk respons (ubah `products` menjadi string).
3. Pastikan UI menampilkan error yang bisa dipahami, bukan blank.
4. Tambahkan tombol “Coba lagi”.

### Verifikasi

- [ ] Request dibatalkan saat pindah halaman.
- [ ] Respons rusak tidak meruntuhkan remote.
- [ ] Empty state muncul saat data kosong.
- [ ] Tidak ada `fetch` ke origin remote lain.

### Jebakan

- Mempercayai `response.json()` tanpa validasi.
- Menampilkan `error.message` mentah ke pengguna.
- Tidak membedakan 401 (belum masuk) dan 500 (server rusak).
- Cache data sensitif di service worker tanpa aturan.

### Ringkasan

Data adalah milik domain. Validasi di batas masuk, tangani semua keadaan, dan gunakan BFF untuk agregasi.

---

## Bab 10 — Sekali Login, Token, dan Otorisasi

**Tujuan:** satu sesi untuk semua remote tanpa membocorkan token.

### Alur

```
1. Pengguna login di shell → POST /api/login
2. Server mengembalikan access token + Set-Cookie refresh (httpOnly)
3. Shell menyimpan access token di memori
4. Remote meminta token lewat ctx.getToken()
5. Saat token hampir kedaluwarsa, shell memanggil /api/refresh
6. Refresh token dirotasi; cookie lama tidak berlaku
7. Logout menghapus cookie dan token di server
```

### Mengapa access token di memori?

- Tidak bisa dibaca JavaScript lain lewat `localStorage`.
- Hilang saat tab ditutup, tetapi sesi dipulihkan lewat cookie httpOnly.
- XSS tetap berbahaya, tetapi dampaknya lebih terbatas.

### Refresh token

```
Set-Cookie: tm_refresh=...; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

Jangan menaruh refresh token di `localStorage`, URL, atau response body yang bisa dibaca klien.

### Remote meminta token

```ts
const token = await ctx.getToken();
if (!token) {
  ctx.navigate('/masuk?next=%2Fkeranjang%2Fcheckout');
  return;
}
```

### Otorisasi

- **401** — belum terautentikasi.
- **403** — sudah masuk, tetapi tidak berhak.
- Role diperiksa di server, bukan hanya di UI.
- Route terproteksi di shell adalah kenyamanan UX, bukan pengganti otorisasi server.

### Praktik

1. Buka `/akun/admin`; halaman ini hanya boleh diakses role `admin`.
2. Login sebagai `demo` → harus ditolak oleh guard shell dan endpoint `scope=all`.
3. Login sebagai `admin` → daftar seluruh pesanan tampil.
4. Reload halaman → sesi tetap ada.
5. Logout → cookie hilang dan remote tidak bisa checkout.

### Verifikasi

- [ ] Access token tidak ada di `localStorage`.
- [ ] Refresh token tidak terlihat di JavaScript.
- [ ] Customer tidak bisa mengakses endpoint admin.
- [ ] Setelah reload, sesi pulih.
- [ ] Logout benar-benar menghapus sesi server.

### Jebakan

- Menyimpan token di `localStorage` karena “lebih mudah”.
- Hanya menyembunyikan tombol tanpa memeriksa server.
- Refresh token tidak dirotasi.
- Cookie `SameSite=None` tanpa `Secure` di produksi.
- Remote menyimpan token sendiri lalu lupa membersihkannya.

### Ringkasan

Auth adalah tanggung jawab shell dan server. Remote hanya meminta token dan menangani 401/403 dengan benar.

---

## Bab 11 — Manifest Dinamis dan Feature Flag

**Tujuan:** mengganti versi remote dan menyalakan fitur tanpa build ulang shell.

### Manifest

`cdn/manifest.json`:

```json
{
  "remotes": {
    "products": {
      "version": "1.0.1",
      "owner": "Tim Katalog",
      "status": "stable",
      "releasedAt": "2026-10-27T10:00:00.000Z"
    }
  }
}
```

Server membentuk URL:

```
http://localhost:4175/v/1.0.1/assets/remoteEntry.js
```

### Runtime override

```ts
__federation_method_setRemote('products', {
  url: () => Promise.resolve(manifest.remotes.products.url),
  format: 'esm',
  from: 'vite'
});
const module = await __federation_method_getRemote('products', './App');
```

### Feature flag

```ts
const flags = await fetch('/api/flags').then((r) => r.json());
if (flags.newCheckout) {
  // render checkout baru
}
```

Flag harus bisa dimatikan tanpa deploy. Jangan memakai flag untuk selamanya; hapus setelah fitur stabil.

### Rilis dan rollback

```bash
npm run build
node scripts/release.mjs products 1.0.1
curl -s http://localhost:4173/api/remotes | python3 -m json.tool
node scripts/rollback.mjs products
```

### Praktik

1. Rilis products 1.0.0.
2. Rilis products 1.0.1.
3. Muat ulang shell dan cek URL di `/status`.
4. Rollback ke 1.0.0.
5. Pastikan shell tidak di-build ulang.

### Verifikasi

- [ ] `/api/remotes` menunjuk versi baru.
- [ ] Halaman status menampilkan versi yang sama.
- [ ] Rollback mengubah URL tanpa menyentuh build shell.
- [ ] Flag bisa diubah dari server dan langsung terlihat setelah reload.

### Jebakan

- Manifest di-cache lama → pengguna terjebak versi usang.
- URL versi lama dihapus sebelum yakin tidak ada pengguna aktif.
- Canary tanpa metrik → tidak tahu apakah versi baru lebih buruk.
- Flag dievaluasi di build, bukan runtime.

### Ringkasan

Manifest memisahkan rilis remote dari rilis shell. Flag memisahkan aktivasi fitur dari deploy. Keduanya membutuhkan observability agar aman.

---

## Bab 12 — Error Boundary, Suspense, dan Isolasi Kegagalan

**Tujuan:** satu remote gagal, sisanya tetap hidup.

### Lapisan pelindung

```tsx
<ErrorBoundary name="cart" fallback={<RemoteError />}>
  <Suspense fallback={<Skeleton />}>
    <Cart ctx={ctx} />
  </Suspense>
</ErrorBoundary>
```

- `Suspense` menangani loading.
- `ErrorBoundary` menangani gagal unduh dan gagal render.
- Tombol “Coba lagi” menaikkan `attempt` untuk membuat komponen lazy baru.

### Retry

```tsx
const [attempt, setAttempt] = useState(0);
const Remote = useMemo(
  () => createRemoteComponent(name, manifestRef, onLoaded),
  [name, attempt]
);
```

Jangan retry tanpa batas. Setelah beberapa kali, tampilkan fallback permanen dan arahkan pengguna ke halaman status.

### Uji isolasi

```js
await page.route('http://localhost:4176/**', (route) => route.abort());
await page.goto('/keranjang');
// header dan shell harus tetap tampil
```

### Praktik

1. Blokir origin cart di DevTools.
2. Buka `/keranjang`.
3. Pastikan header, navigasi, dan remote lain tetap bekerja.
4. Klik “Coba lagi” setelah blokir dilepas.

### Verifikasi

- [ ] Shell tidak blank saat satu remote mati.
- [ ] Pesan galat menyebut modul yang gagal.
- [ ] Tombol retry berfungsi.
- [ ] Error tercatat di telemetry.

### Jebakan

- Satu error boundary membungkus seluruh aplikasi → semua ikut mati.
- Fallback menampilkan stack trace ke pengguna.
- Retry otomatis tanpa henti → banjir request.
- Remote gagal karena shared dependency, bukan jaringan; retry tidak akan menolong.

### Ringkasan

Kegagalan harus terkurung di slotnya. Shell menyediakan fallback yang jujur, tombol retry yang terkendali, dan catatan untuk tim terkait.

---

## Bab 13 — Menguji Micro-Frontend

**Tujuan:** membangun kepercayaan tanpa menguji semuanya di setiap lapisan.

### Piramida

| Lapisan | Alat | Fokus |
| --- | --- | --- |
| Unit | Vitest | fungsi murni, store, skema |
| Komponen | Testing Library | perilaku UI |
| Kontrak | Zod | bentuk data dan event |
| E2E | Playwright | alur lintas remote |
| Visual | Playwright screenshot | tampilan utama |
| Resilience | Playwright route abort | isolasi kegagalan |

### Yang diuji di mana

- **Shared** — penambahan item, qty, total, event valid/invalid.
- **Contracts** — produk, pesanan, manifest, event.
- **UI kit** — tombol, card, badge, aksesibilitas dasar.
- **E2E** — katalog → keranjang → login → checkout → akun.
- **Shell** — 404, protected route, remote gagal.

Jangan menguji implementasi internal remote dari shell. Uji kontraknya.

### Perintah

```bash
npm test
npm run test:e2e
npm run test:visual
```

### Praktik

1. Tambahkan satu test kontrak untuk event `wishlist-added`.
2. Tambahkan satu test komponen untuk `PriceTag`.
3. Jalankan semua tes.
4. Perbaiki tes yang gagal tanpa menurunkan cakupan.

### Verifikasi

- [ ] Unit test lulus.
- [ ] E2E lulus tanpa error console.
- [ ] Tes kegagalan remote lulus.
- [ ] Screenshot terang/gelap/mobile dihasilkan.

### Jebakan

- E2E bergantung pada teks yang sering berubah.
- Tes visual membandingkan pixel tanpa toleransi.
- Menjalankan E2E tanpa build terbaru.
- Tes menguji detail implementasi, bukan perilaku.

### Ringkasan

Uji kontrak dan alur, bukan struktur internal. E2E adalah jaring pengaman terakhir, bukan satu-satunya alat.

---

## Bab 14 — Observability: Telemetry, Web Vitals, dan Status

**Tujuan:** tahu apa yang terjadi di produksi tanpa menebak.

### Tiga sinyal

- **Event** — login, add to cart, checkout.
- **Error** — remote gagal dimuat, API error, render error.
- **Metrik** — `boot_ms`, `remote_load_ms`, LCP, CLS, INP.

### Telemetry

```ts
ctx.telemetry.event('checkout_completed', { orderId, total });
ctx.telemetry.metric('checkout_ms', duration);
ctx.telemetry.error(error, { remote: 'cart' });
```

Implementasi memakai `navigator.sendBeacon` bila tersedia, lalu fallback ke `fetch` dengan `keepalive`.

### Halaman status

`/status` menampilkan:

- versi dan pemilik setiap remote;
- URL remote yang sedang aktif;
- jumlah event, error, dan metrik;
- ringkasan per aplikasi.

### Privasi

- Jangan kirim password, token, atau data pribadi.
- Hash atau buang identifier yang tidak perlu.
- Sediakan kebijakan retensi.
- Hormati preferensi pengguna.

### Praktik

1. Buka `/status`.
2. Tambahkan metrik `checkout_ms` di remote cart.
3. Lakukan checkout.
4. Muat ulang status dan pastikan metrik bertambah.

### Verifikasi

- [ ] Event login dan checkout tercatat.
- [ ] Error remote tercatat dengan nama remote.
- [ ] Web Vitals muncul sebagai metrik.
- [ ] Tidak ada token di payload telemetry.

### Jebakan

- Mengirim seluruh objek error yang berisi data sensitif.
- Telemetry memblokir UI saat jaringan lambat.
- Tidak ada korelasi antara error dan versi remote.
- Metrik dikumpulkan tetapi tidak pernah dibaca.

### Ringkasan

Observability adalah bagian dari arsitektur, bukan tambahan setelah rilis. Catat secukupnya, lindungi privasi, dan hubungkan dengan versi.

---

## Bab 15 — Performa dan Budget Bundel

**Tujuan:** menjaga aplikasi tetap cepat saat remote bertambah.

### Sumber berat

- React dan ReactDOM terduplikasi.
- `react-router-dom` dibundel di setiap remote.
- Library tanggal/grafik besar.
- Shared module yang menyeret dependensi ke semua remote.
- Terlalu banyak remote dimuat di awal.

### Strategi

1. **Shared singleton** untuk React, ReactDOM, dan router.
2. **Lazy load** remote per rute.
3. **Preload** hanya remote yang akan segera dibuka.
4. **Cache immutable** untuk aset ber-hash.
5. **Budget** di CI.
6. **Ukur** sebelum optimasi.

### Budget

`scripts/perf-report.mjs` menghitung ukuran gzip dan membandingkan dengan budget:

```bash
npm run perf
```

Contoh keluaran:

```
shell     141.6 kB / 320 kB  ok
header    134.8 kB / 140 kB  ok
products  136.1 kB / 140 kB  ok
```

### Praktik

1. Jalankan `npm run perf`.
2. Catat ukuran setiap aplikasi.
3. Hapus satu dependensi yang tidak terpakai dari remote.
4. Build ulang dan bandingkan.
5. Turunkan budget sedikit demi sedikit.

### Verifikasi

- [ ] Semua bundel di bawah budget.
- [ ] Remote tidak memuat React dua kali saat berjalan di shell.
- [ ] Halaman awal tidak memuat remote yang belum dibutuhkan.
- [ ] LCP dan INP tercatat di telemetry.

### Jebakan

- Mengoptimasi tanpa mengukur.
- Memindahkan semua kode ke shared module → semua remote ikut berat.
- Preload semua remote → menghilangkan manfaat lazy.
- Budget terlalu ketat sampai tim mematikan fitur.

### Ringkasan

Performa adalah anggaran yang dijaga, bukan hasil sekali kerja. Ukur, potong, dan pantau terus.

---

## Bab 16 — Rilis Mandiri, CDN Berversi, dan Rollback

**Tujuan:** merilis satu remote tanpa menyentuh shell dan bisa kembali dengan cepat.

### Alur rilis

```bash
npm run build
node scripts/release.mjs products 1.0.1
```

Skrip:

1. menyalin `apps/products/dist` ke `cdn/products/1.0.1`;
2. memperbarui `cdn/manifest.json` secara atomik;
3. tidak menyentuh build shell.

### Penyajian versi

```
/v/1.0.0/assets/remoteEntry.js
/v/1.0.1/assets/remoteEntry.js
```

Aset ber-hash memakai cache `immutable`. Manifest memakai `no-store` agar perubahan cepat terlihat.

### Rollback

```bash
node scripts/rollback.mjs products
```

Rollback hanya mengganti manifest ke versi lama. Tidak ada build ulang.

### Urutan rilis aman

1. Rilis versi baru sebagai canary.
2. Pantau error dan Web Vitals.
3. Naikkan ke stable.
4. Simpan versi lama minimal satu siklus rilis.
5. Hapus versi lama setelah yakin tidak ada pengguna aktif.

### Praktik

1. Rilis products 1.0.0.
2. Rilis products 1.0.1.
3. Buka `/status` dan catat URL.
4. Rollback.
5. Muat ulang dan pastikan URL kembali.

### Verifikasi

- [ ] Manifest berubah tanpa build shell.
- [ ] Versi lama masih bisa diakses.
- [ ] Rollback selesai dalam hitungan detik.
- [ ] Cache aset tidak membuat versi baru tertahan.

### Jebakan

- Menghapus versi lama terlalu cepat.
- Manifest di-cache oleh CDN.
- Perubahan kontrak tanpa versi → remote lama tidak kompatibel.
- Rollback tanpa memeriksa kompatibilitas data.

### Ringkasan

Rilis mandiri membutuhkan versi yang alamatnya stabil, manifest yang atomik, dan rollback yang benar-benar dicoba.

---

## Bab 17 — CI/CD dan Kepemilikan Tim

**Tujuan:** membuat rilis mandiri aman dan dapat diulang.

### Pipeline minimum

```yaml
- npm ci
- npm run typecheck
- npm test
- npm run build
- npx playwright install --with-deps chromium
- npm run test:e2e
- npm run perf
```

### Pipeline per remote

- Filter `paths` agar perubahan di `apps/cart/**` tidak membangun semua aplikasi.
- Jalankan tes kontrak bersama.
- Build hanya remote yang berubah.
- Publikasikan artefak versi.
- Perbarui manifest lewat job terpisah yang bisa di-approve.

### Kepemilikan

- Satu remote satu tim.
- `CODEOWNERS` menentukan reviewer.
- Perubahan kontrak membutuhkan review tim konsumen.
- ADR untuk keputusan besar.
- On-call untuk remote yang kamu miliki.

### Praktik

1. Baca `.github/workflows/ci.yml`.
2. Tambahkan langkah `npm run perf`.
3. Buat PR yang sengaja merusak tipe.
4. Pastikan pipeline gagal sebelum merge.
5. Perbaiki dan pastikan pipeline hijau.

### Verifikasi

- [ ] CI berjalan pada PR.
- [ ] Typecheck, unit, build, E2E, dan perf dijalankan.
- [ ] Artefak build tersimpan.
- [ ] Release workflow meminta versi dan remote.

### Jebakan

- Semua tim memakai satu pipeline monolith → kembali saling menunggu.
- Tidak ada branch protection.
- Rilis manual tanpa catatan versi.
- Tes E2E memakai server yang tidak di-build ulang.

### Ringkasan

CI/CD adalah tempat aturan arsitektur ditegakkan. Tanpa pipeline yang cepat dan tepercaya, rilis mandiri hanya teori.

---

## Bab 18 — Migrasi Bertahap dari Aplikasi Legacy

**Tujuan:** memindahkan aplikasi lama tanpa big bang rewrite.

### Strangler fig

1. Petakan rute lama.
2. Pilih satu rute bernilai tinggi dan risiko rendah.
3. Bangun remote baru untuk rute itu.
4. Arahkan sebagian trafik.
5. Bandingkan metrik.
6. Hapus rute lama setelah yakin.

### Teknik sementara

- **iframe** — isolasi maksimal, komunikasi terbatas.
- **Web Component** — widget lintas framework.
- **Import map** — prototipe tanpa bundler.
- **Route terpisah** — redirect ke aplikasi lama selama transisi.

### Yang harus dijaga

- URL lama tetap bekerja (redirect 301 bila perlu).
- Sesi login tidak hilang saat berpindah.
- Tema dan bahasa konsisten.
- SEO tidak hancur.
- Analitik tetap mengumpulkan data.

### Praktik

1. Buka `/katalog-lama`.
2. Amati iframe dan keterbatasannya.
3. Pindahkan satu rute lama ke remote products.
4. Tambahkan redirect dari URL lama.
5. Hapus tautan ke iframe setelah semua rute pindah.

### Verifikasi

- [ ] URL lama mengarah ke halaman baru.
- [ ] Pengguna tetap login.
- [ ] Tidak ada halaman kosong saat JavaScript gagal.
- [ ] Metrik kunjungan tetap tercatat.

### Jebakan

- Menulis ulang semuanya sekaligus.
- Mematikan aplikasi lama sebelum migrasi selesai.
- Tidak mengukur apakah rute baru lebih baik.
- Mengabaikan bookmark dan tautan eksternal.

### Ringkasan

Migrasi adalah perjalanan, bukan acara. Pindahkan satu irisan, ukur, lalu lanjutkan.

---

## Bab 19 — Keamanan, Aksesibilitas, dan Tata Kelola

**Tujuan:** menjaga sistem tetap aman, bisa dipakai semua orang, dan tidak menjadi liar saat tim bertambah.

### Keamanan

- CSP yang membatasi script dan koneksi.
- SRI untuk aset pihak ketiga bila memungkinkan.
- CORS hanya untuk origin yang dikenal.
- Jangan menaruh token di URL atau `localStorage`.
- Validasi input di server.
- Audit dependensi (`npm audit`, Dependabot).
- Batasi remote yang boleh dimuat lewat manifest tepercaya.

### Aksesibilitas lintas remote

- Satu `h1` per halaman.
- Fokus dipindahkan setelah navigasi.
- `aria-live` untuk toast.
- Kontras warna memadai di tema terang dan gelap.
- Navigasi keyboard berfungsi di semua remote.
- Jangan mengandalkan warna saja untuk status.

### Tata kelola

- Katalog remote: pemilik, versi, status, kontak.
- Kebijakan versi kontrak: patch, minor, major.
- RFC/ADR untuk perubahan besar.
- Jadwal audit dependensi.
- Definition of Done mencakup aksesibilitas dan observability.

### Praktik

1. Audit satu remote dengan checklist aksesibilitas.
2. Periksa header keamanan di `curl -I`.
3. Cari token di `localStorage` dan URL.
4. Catat temuan di `docs/audit.md`.
5. Perbaiki satu temuan dan buktikan dengan tes.

### Verifikasi

- [ ] Tidak ada token di storage yang bisa dibaca JavaScript.
- [ ] Semua halaman bisa dinavigasi dengan keyboard.
- [ ] Kontras teks memadai di dua tema.
- [ ] Dependensi tidak memiliki kerentanan kritis.

### Jebakan

- Menganggap iframe otomatis aman.
- CSP terlalu longgar (`unsafe-inline`, `*`).
- Aksesibilitas hanya diuji di shell, bukan remote.
- Tidak ada pemilik untuk audit keamanan.

### Ringkasan

Keamanan dan aksesibilitas adalah properti sistem, bukan properti satu remote. Tata kelola membuat keduanya bertahan saat tim berganti.

---

## Bab 20 — Proyek Akhir: TokoMicro End-to-End

**Tujuan:** membuktikan bahwa kamu bisa menjalankan, menguji, merilis, dan menjelaskan seluruh sistem.

### Jalankan

```bash
cd examples/micro-frontend-react
npm install
npm run build
npm start
```

Buka `http://localhost:4173`.

### Alur yang harus berhasil

1. Katalog memuat 8 produk.
2. Tambah produk → badge header berubah.
3. Buka detail produk.
4. Buka keranjang → checkout.
5. Checkout tanpa login → diarahkan ke login.
6. Login `demo/demo123` → kembali ke checkout.
7. Buat pesanan → nomor pesanan muncul.
8. Reload → sesi tetap ada.
9. Buka akun → profil dan riwayat pesanan.
10. Ganti tema → bertahan setelah reload.
11. Buka status → empat remote tampil.
12. Buka katalog lama → iframe berfungsi.
13. Blokir satu origin remote → shell tetap hidup.
14. Rilis lalu rollback → manifest berubah tanpa build shell.

### Perintah verifikasi

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:visual
npm run perf
npm run storybook:build
```

### Lab lanjutan

| Lab | Fokus | Kapan dipakai |
| --- | --- | --- |
| `examples/micro-frontend-techniques` | iframe, Web Component, import map | membandingkan teknik |
| `examples/micro-frontend-webpack` | Webpack 5 + Rspack | tim yang sudah memakai Webpack |
| `examples/micro-frontend-ssr` | CSR vs SSR + hydration | SEO dan first paint |

Module Federation 2.0 dan Rspack sengaja dipisah dari proyek utama agar kamu bisa mempelajarinya tanpa mengganggu alur yang sudah stabil.

### Rubrik penilaian

| Aspek | Bobot | Bukti |
| --- | --- | --- |
| Batas tanggung jawab | 20% | shell tidak mengimpor internal remote |
| Kontrak dan tipe | 15% | `contracts`, Zod, deklarasi remote |
| Ketahanan | 15% | error boundary, retry, isolasi |
| Pengujian | 15% | unit, E2E, visual, resilience |
| Operasi | 15% | manifest, rilis, rollback, telemetry |
| Aksesibilitas & keamanan | 10% | audit, keyboard, token |
| Dokumentasi | 10% | README, ADR, catatan rilis |

### Tugas pengembangan

- Tambahkan remote `wishlist` di port 4179.
- Tambahkan pencarian produk dengan debounce.
- Tambahkan halaman admin dengan role.
- Tambahkan BFF `/api/home`.
- Tambahkan canary 10% untuk remote cart.
- Tambahkan audit aksesibilitas otomatis.

### Verifikasi akhir

- [ ] Semua perintah di atas lulus.
- [ ] Kamu bisa menjelaskan setiap keputusan tanpa membaca catatan.
- [ ] Kamu bisa merilis satu remote tanpa menyentuh shell.
- [ ] Kamu bisa rollback dan menjelaskan risikonya.
- [ ] Kamu tahu kapan harus kembali ke modular monolith.

### Ringkasan

Micro-frontend yang baik bukan yang paling banyak remote, tetapi yang batasnya jelas, rilisnya aman, dan kegagalannya terkurung.

---

## Lampiran A — Peta Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm install` | Pasang dependensi workspace |
| `npm run build` | Build semua aplikasi |
| `npm start` | Jalankan enam origin |
| `npm run typecheck` | TypeScript seluruh workspace |
| `npm test` | Unit test Vitest |
| `npm run test:e2e` | E2E Playwright |
| `npm run test:visual` | Tangkapan layar utama |
| `npm run perf` | Laporan ukuran bundel |
| `npm run storybook` | Storybook ui-kit |
| `npm run storybook:build` | Build Storybook statis |
| `node scripts/release.mjs products 1.1.0` | Rilis remote |
| `node scripts/rollback.mjs products` | Rollback remote |

---

## Lampiran B — Glosarium

| Istilah | Arti |
| --- | --- |
| **Shell** | Aplikasi induk pemilik layout, URL, login, dan pemuatan remote. |
| **Remote** | Micro-frontend yang diekspos dan dimuat shell. |
| **remoteEntry.js** | Berkas entri yang memberi tahu shell modul apa yang diekspos remote. |
| **Module Federation** | Mekanisme berbagi modul dan dependensi saat runtime. |
| **Shared singleton** | Satu instance dependensi untuk semua remote, misalnya React. |
| **Manifest** | Daftar versi dan URL remote yang aktif. |
| **Canary** | Rilis ke sebagian kecil pengguna sebelum stable. |
| **Rollback** | Mengembalikan manifest ke versi sebelumnya. |
| **BFF** | Backend for Frontend; agregasi API untuk kebutuhan UI. |
| **Error boundary** | Komponen React yang menangkap error di bawahnya. |
| **Feature flag** | Saklar runtime untuk menyalakan/mematikan fitur. |
| **Strangler fig** | Pola migrasi bertahap dengan menggantikan bagian lama satu per satu. |

---

## Lampiran C — Checklist Produksi

**Arsitektur**

- [ ] Batas shell dan remote tertulis.
- [ ] Kontrak `AppContext` berversi.
- [ ] Tidak ada impor internal antar remote.
- [ ] ADR tersedia.

**Keamanan**

- [ ] Access token di memori.
- [ ] Refresh token httpOnly + Secure + SameSite.
- [ ] CSP dan CORS dikonfigurasi.
- [ ] Dependensi diaudit.
- [ ] Tidak ada secret di bundle.

**Kualitas**

- [ ] Typecheck lulus.
- [ ] Unit, kontrak, E2E, visual lulus.
- [ ] Error boundary diuji.
- [ ] Aksesibilitas diaudit.

**Operasi**

- [ ] Manifest atomik.
- [ ] Versi lama masih tersedia.
- [ ] Rollback diuji.
- [ ] Telemetry dan Web Vitals aktif.
- [ ] Budget performa dijaga.
- [ ] On-call dan pemilik jelas.

---

## Lampiran D — Rujukan

- [Micro Frontends — Martin Fowler](https://martinfowler.com/articles/micro-frontends.html)
- [Micro Frontends in Action — Cam Jackson](https://www.manning.com/books/micro-frontends-in-action)
- [Module Federation — Webpack](https://webpack.js.org/concepts/module-federation/)
- [@originjs/vite-plugin-federation](https://github.com/originjs/vite-plugin-federation)
- [React — useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
- [Vite Documentation](https://vite.dev/guide/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MDN — Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [single-spa](https://single-spa.js.org/docs/getting-started-overview/)
- [Rspack](https://rspack.dev/)
- [Storybook](https://storybook.js.org/docs)
- [web.dev — Web Vitals](https://web.dev/articles/vitals)

---

**Selamat membangun.** Mulailah dari satu shell dan satu remote. Tambahkan kompleksitas hanya ketika masalahnya benar-benar muncul.
