# Roadmap Belajar Micro-Frontend (0 → Mahir)

*Untuk kamu yang sudah menguasai React JS. Estimasi total ±12-16 minggu (5-8 jam/minggu).*

**Asumsi:** kamu sudah menguasai React JS (hooks, context, lazy/Suspense, router, state management). Sesuaikan kecepatan dengan kemampuanmu.

## Gambaran Fase

| Fase | Topik | Durasi |
| --- | --- | --- |
| 0 | Persiapan & prasyarat | 1 minggu |
| 1 | Konsep dasar micro-frontend | 1 minggu |
| 2 | Bundler & monorepo | 2 minggu |
| 3 | Teknik integrasi | 1 minggu |
| 4 | Module Federation (inti) | 2-3 minggu |
| 5 | Komunikasi & state antar MFE | 1 minggu |
| 6 | Routing, shell, styling, design system | 1-2 minggu |
| 7 | Auth & cross-cutting concerns | 1 minggu |
| 8 | Testing | 1 minggu |
| 9 | CI/CD, deployment, observability | 1-2 minggu |
| 10 | Performance & SSR | 1 minggu |
| 11 | Arsitektur lanjutan & migrasi | 1-2 minggu |

## Fase 0: Persiapan

**Tujuan:** memastikan fondasi yang dibutuhkan sebelum masuk ke MFE.

- [ ] JavaScript modern: ES Modules, dynamic `import()`, top-level await
- [ ] TypeScript (sangat disarankan): generics, type declaration (`.d.ts`)
- [ ] React lanjutan: `React.lazy`, `Suspense`, Error Boundary, Context
- [ ] npm/pnpm/yarn: dependencies, peerDependencies, semver
- [ ] Git & GitHub/GitLab workflow
- [ ] Dasar HTTP, caching, CDN

**Output:** bisa menjelaskan bagaimana browser memuat module dan bagaimana `React.lazy` bekerja.

## Fase 1: Konsep Dasar Micro-Frontend

**Topik:**

- Apa itu micro-frontend, dan apa bedanya dengan monolith dan microservices
- Masalah yang diselesaikan: tim besar, deploy independen, tech autonomy
- Kapan **tidak** perlu MFE (overengineering, tim kecil, aplikasi sederhana)
- Strategi pemecahan:
  - **Vertical split** (per fitur/halaman, satu tim memiliki end-to-end)
  - **Horizontal split** (beberapa MFE dalam satu halaman)
- Prinsip: isolasi tim, deploy independen, tidak ada shared state global, resilient
- Konsep pendukung: Domain-Driven Design (bounded context), Conway's Law
- Trade-off: kompleksitas, duplikasi dependency, konsistensi UI, performa

**Bacaan:** artikel "Micro Frontends" oleh Cam Jackson (martinfowler.com), micro-frontends.org

**Output:** tulis 1 halaman dokumen: "Apakah proyek X cocok memakai MFE? Mengapa?"

## Fase 2: Bundler & Monorepo

### 2.1 Webpack 5 (wajib paham)

- Entry, output, loaders, plugins
- Code splitting, chunk, `splitChunks`
- `publicPath` dan cara kerjanya (krusial untuk MFE)
- Dev server, HMR
- Analisis bundle (`webpack-bundle-analyzer`)

### 2.2 Alternatif modern

- **Vite**: dasar, plugin ecosystem
- **Rspack**: kompatibel dengan Webpack, lebih cepat, support Module Federation

### 2.3 Monorepo

- pnpm workspaces / npm workspaces
- **Nx** atau **Turborepo**: task caching, affected builds
- Struktur: `apps/`, `packages/`

**Proyek mini:** buat monorepo berisi 2 aplikasi React + 1 shared package (misalnya `ui-kit`), build dengan Turborepo/Nx.

## Fase 3: Teknik Integrasi MFE

Pelajari semua pendekatan dulu agar tahu trade-off-nya:

| Teknik | Cara Kerja | Kelebihan | Kekurangan |
| --- | --- | --- | --- |
| **iframe** | Tiap MFE dalam iframe | Isolasi total | UX, routing, komunikasi sulit |
| **NPM packages** (build-time) | MFE dipublish sebagai package | Sederhana | Deploy tidak independen |
| **Web Components** | Custom elements + Shadow DOM | Framework-agnostic | Butuh wrapper, SSR sulit |
| **Import Maps / SystemJS** | Runtime module loading | Standar browser | Tooling lebih manual |
| **single-spa** | Framework orkestrasi lifecycle | Mendukung banyak framework | Kurva belajar |
| **Module Federation** | Runtime sharing via bundler | Paling populer di ekosistem React | Terikat bundler |
| **Server-side composition** | SSI/ESI/edge composition | SEO & performa baik | Infrastruktur lebih rumit |

**Latihan:** implementasikan 1 contoh sederhana dengan iframe dan 1 dengan Web Component untuk merasakan perbedaannya.

## Fase 4: Module Federation (Inti)

### 4.1 Dasar

- Konsep **Host** (container) dan **Remote**
- Konfigurasi `ModuleFederationPlugin`: `name`, `filename` (`remoteEntry.js`), `exposes`, `remotes`, `shared`
- Memuat remote dengan `React.lazy(() => import('remote/Component'))`

### 4.2 Shared dependencies

- `singleton`, `requiredVersion`, `eager`, `strictVersion`
- Menghindari 2 instance React (penyebab error hooks)
- Strategi versioning dependency

### 4.3 Lanjutan

- **Dynamic remotes** (URL remote dari config/API, bukan hardcode)
- Fallback & Error Boundary saat remote gagal dimuat
- TypeScript types untuk remote (generate/sync types)
- **Module Federation 2.0** (`@module-federation/enhanced`): runtime plugins, type hints, manifest
- Module Federation di **Vite** dan **Rspack**
- Bi-directional host (host sekaligus remote)

### 4.4 Alternatif

- single-spa + `single-spa-react`
- Qiankun, Piral, Luigi (cukup tahu konsepnya)

**Proyek utama #1:** buat 1 **Shell (host)** + 3 **remote** (misal: `auth`, `dashboard`, `products`). Semua React + TypeScript, dijalankan lokal secara independen.

## Fase 5: Komunikasi & State Antar MFE

**Prinsip:** minimalkan coupling. Hindari shared state global sebisa mungkin.

Metode (urut dari paling loose coupling):

1. **Props/callback** dari shell ke MFE
2. **URL / query params** sebagai state bersama
3. **Custom Events** (`window.dispatchEvent`) / event bus
4. **BroadcastChannel / Storage events** (lintas tab)
5. **Shared store** kecil (Zustand/Redux yang di-expose via federation), gunakan seperlunya
6. **Pub/Sub** dengan kontrak event yang jelas

**Topik penting:**

- Mendesain **event contract** (nama event, payload, versioning)
- Kapan state sebaiknya di backend, bukan di frontend

**Latihan:** buat fitur keranjang belanja. MFE `products` mengirim event "add-to-cart", MFE `cart` menerimanya tanpa saling import.

## Fase 6: Routing, App Shell, Styling & Design System

### 6.1 Routing

- Shell memegang **routing tingkat atas**, MFE memegang **sub-route**
- React Router: nested routes, `basename` per MFE
- Navigasi lintas MFE tanpa full reload
- Deep linking & 404 handling

### 6.2 App Shell

- Layout bersama (header, sidebar, footer)
- Lifecycle loading, skeleton, dan error state per MFE

### 6.3 Styling

- Masalah: CSS bentrok antar MFE
- Solusi: CSS Modules, CSS-in-JS dengan namespace, prefix Tailwind, Shadow DOM, konvensi BEM

### 6.4 Design System

- Membuat **shared component library** (di-versioning & dipublish)
- Design tokens (warna, spacing, typography)
- Storybook untuk dokumentasi
- Strategi: library via npm vs via Module Federation

**Proyek utama #2:** tambahkan routing, shared design system (Storybook), dan theming (dark/light) ke proyek #1.

## Fase 7: Auth & Cross-Cutting Concerns

- **Autentikasi:** shell mengelola login, token dibagikan ke MFE secara aman (hindari menyimpan token sembarangan)
- **Otorisasi:** role/permission per MFE dan per route
- **i18n:** shared translation vs translation per MFE
- **Error handling & logging:** Error Boundary global, Sentry
- **Analytics:** event tracking konsisten
- **Config & environment:** runtime config (bukan hanya build-time)
- **Feature flags** (LaunchDarkly/Unleash/GrowthBook)

## Fase 8: Testing

Piramida testing untuk MFE:

- **Unit & component test:** Jest/Vitest + React Testing Library (per MFE)
- **Contract testing:** pastikan kontrak `exposes` dan event tidak rusak (Pact atau test kontrak manual)
- **Integration test:** shell + remote
- **E2E test:** Playwright / Cypress untuk alur lintas MFE
- **Visual regression:** Chromatic / Percy
- Strategi: test remote secara terisolasi (standalone mode) dan test integrasi di staging

## Fase 9: CI/CD, Deployment & Observability

### 9.1 CI/CD

- Pipeline **independen per MFE** (GitHub Actions / GitLab CI)
- Monorepo: build hanya yang berubah (`nx affected` / Turborepo filter)
- Lint, test, build, deploy otomatis

### 9.2 Deployment

- Hosting statis: S3 + CloudFront, Vercel, Netlify, Cloudflare Pages
- Docker + Nginx (opsional)
- **Versioning remote:** `remoteEntry.js` dengan hash vs URL "latest"
- Strategi cache & invalidasi CDN
- **Canary release, blue-green, rollback cepat**

### 9.3 Observability

- Monitoring error per MFE
- Performance monitoring (RUM, Web Vitals)
- Tracing versi MFE yang sedang aktif di production

**Proyek utama #3:** deploy shell + remote ke hosting nyata dengan pipeline CI/CD terpisah. Buktikan bahwa 1 MFE bisa di-deploy tanpa rebuild yang lain.

## Fase 10: Performance & SSR

### 10.1 Performance

- Mengurangi duplikasi dependency (shared libs)
- Lazy load & **preload/prefetch** remote
- Analisis bundle per MFE
- Core Web Vitals (LCP, CLS, INP)
- Menghindari waterfall loading `remoteEntry.js`

### 10.2 SSR & SEO

- Tantangan SSR pada MFE
- Opsi: Next.js + Module Federation (cek status dukungan terbaru karena berubah cepat), Astro islands, server-side composition (ESI/edge)
- Kapan SSR benar-benar dibutuhkan

## Fase 11: Arsitektur Lanjutan & Migrasi

- **Migrasi monolith → MFE:** Strangler Fig Pattern, migrasi bertahap per halaman
- **Governance:** standar kode, kontrak antar tim, ownership, dokumentasi
- **Anti-pattern:**
  - Distributed monolith (MFE terlalu bergantung satu sama lain)
  - Terlalu banyak shared state
  - MFE terlalu kecil (nano-frontend)
  - Versi dependency tidak terkoordinasi
- **Multi-framework MFE** (React + Vue + Angular): kapan masuk akal, kapan tidak
- **Platform MFE:** internal tooling, CLI generator template, standar bersama
- Architecture Decision Record (ADR)

**Proyek akhir (capstone):** bangun aplikasi **e-commerce / dashboard** dengan ≥4 MFE, shell, design system, auth, event bus, CI/CD independen, monitoring, dan dokumentasi arsitektur (ADR).

## Checklist Kompetensi "Mahir"

- [ ] Bisa menjelaskan kapan MFE layak dipakai dan kapan tidak
- [ ] Mampu mengonfigurasi Module Federation dari nol (Webpack & Rspack/Vite)
- [ ] Paham dan bisa menyelesaikan masalah shared dependency & versioning
- [ ] Bisa mendesain komunikasi antar MFE dengan coupling rendah
- [ ] Bisa membangun design system & strategi styling yang aman
- [ ] Mampu membuat pipeline deploy independen + rollback
- [ ] Bisa merancang strategi migrasi dari monolith
- [ ] Mampu mendokumentasikan keputusan arsitektur

## Sumber Belajar

- **Artikel:** micro-frontends.org, martinfowler.com (Micro Frontends)
- **Dokumentasi:** module-federation.io, webpack.js.org (Module Federation), single-spa.js.org, rspack.dev
- **Buku:** *Micro Frontends in Action* (Michael Geers), *Building Micro-Frontends* (Luca Mezzalira)
- **Video/Kursus:** channel YouTube Jack Herrington (Module Federation), Zack Jackson (pencipta Module Federation)
- **Repo contoh:** `module-federation/module-federation-examples` di GitHub

## Tips Belajar

1. **Praktik > teori.** Setiap fase minimal ada 1 repo latihan.
2. Mulai dari **monorepo lokal** dulu, baru pisah repo dan deploy.
3. Catat setiap error shared dependency dan solusinya. Ini akan sering muncul.
4. Jangan langsung kompleks: mulai dari 2 MFE, baru tambah.
5. Dokumentasikan proyekmu di GitHub sebagai portofolio.

## Fase 12: Contoh Proyek Micro-Frontend dengan React JS

Kumpulan ide proyek dari level pemula sampai mahir. Semuanya memakai React + TypeScript, dan bisa dikerjakan dengan Module Federation (Webpack/Rspack/Vite) di dalam monorepo.

| No | Proyek | Level | Fokus Belajar |
| --- | --- | --- | --- |
| 1 | Dashboard Admin | Pemula | Shell + remote, routing dasar |
| 2 | Toko Online (E-commerce) | Menengah | Event bus, state antar MFE, shared design system |
| 3 | Portal Perusahaan (Intranet) | Menengah | Auth, otorisasi, feature flags |
| 4 | Aplikasi Perbankan / Fintech | Lanjut | Keamanan, testing kontrak, observability |
| 5 | Platform Belajar Online (LMS) | Lanjut | Multi-tim, deploy independen, versioning remote |
| 6 | Migrasi Monolith ke MFE | Mahir | Strangler Fig, koeksistensi legacy dan MFE |

### Proyek 1: Dashboard Admin (Pemula)

**Tujuan:** merasakan alur dasar Host dan Remote.

- **Shell (host):** layout, sidebar, header, routing tingkat atas
- **MFE `users`:** tabel pengguna, pencarian, pagination
- **MFE `analytics`:** grafik (Recharts / Chart.js)
- **MFE `settings`:** form profil dan preferensi
- **Teknologi:** React, React Router, Webpack Module Federation, TypeScript
- **Yang dipelajari:** konfigurasi `exposes` / `remotes`, `shared` React (singleton), lazy load remote, Error Boundary saat remote gagal dimuat

### Proyek 2: Toko Online / E-commerce (Menengah)

**Tujuan:** latihan komunikasi antar MFE dengan coupling rendah.

- **Shell:** navigasi, layout, tema dark/light
- **MFE `products`:** daftar produk, filter, detail produk
- **MFE `cart`:** keranjang belanja (menerima event `add-to-cart`)
- **MFE `checkout`:** form alamat, pembayaran (simulasi)
- **MFE `account`:** login, riwayat pesanan
- **Package `ui-kit`:** design system bersama (Storybook)
- **Teknologi:** React, Zustand / event bus kustom, Tailwind (dengan prefix), Storybook
- **Yang dipelajari:** event contract, shared design system, styling tanpa bentrok, dynamic remote

### Proyek 3: Portal Perusahaan / Intranet (Menengah)

**Tujuan:** menangani autentikasi dan hak akses lintas MFE.

- **Shell:** login (OIDC / JWT), menu dinamis sesuai role
- **MFE `hr`:** pengajuan cuti, data karyawan
- **MFE `finance`:** laporan, persetujuan biaya
- **MFE `announcements`:** berita internal
- **Teknologi:** React, React Query, OIDC (Keycloak / Auth0), Unleash / GrowthBook untuk feature flags
- **Yang dipelajari:** berbagi token secara aman, otorisasi per route dan per MFE, i18n bersama, runtime config

### Proyek 4: Aplikasi Fintech (Lanjut)

**Tujuan:** menerapkan praktik kualitas dan keamanan tinggi.

- **Shell:** autentikasi, session timeout, layout
- **MFE `accounts`:** saldo dan mutasi
- **MFE `transfer`:** alur transfer multi-step
- **MFE `investments`:** portofolio dan grafik
- **Teknologi:** React, React Hook Form + Zod, Playwright, Pact (contract test), Sentry
- **Yang dipelajari:** contract testing, E2E lintas MFE, error tracking per MFE, CSP dan keamanan frontend

### Proyek 5: Platform Belajar Online / LMS (Lanjut)

**Tujuan:** mensimulasikan banyak tim dengan deploy terpisah.

- **Shell:** navigasi, profil, notifikasi
- **MFE `catalog`:** katalog kursus dan pencarian
- **MFE `player`:** pemutar video dan progres belajar
- **MFE `quiz`:** kuis interaktif
- **MFE `admin`:** manajemen kursus (untuk instruktur)
- **Teknologi:** React, Module Federation 2.0, GitHub Actions per MFE, S3 + CloudFront / Cloudflare Pages
- **Yang dipelajari:** pipeline CI/CD independen, versioning `remoteEntry.js`, canary release dan rollback, monitoring Web Vitals

### Proyek 6: Migrasi Monolith ke Micro-Frontend (Mahir)

**Tujuan:** latihan skenario dunia nyata yang paling sering terjadi.

1. Mulai dari 1 aplikasi React monolith (misalnya CRA / Vite dengan banyak halaman)
2. Buat shell baru yang membungkus aplikasi lama sebagai satu "legacy app"
3. Pecah halaman satu per satu menjadi remote (**Strangler Fig Pattern**)
4. Pastikan routing lama dan baru berjalan berdampingan
5. Setelah semua halaman berpindah, hapus aplikasi lama

**Yang dipelajari:** migrasi bertahap tanpa big-bang rewrite, koeksistensi, strategi rollback, dokumentasi keputusan (ADR)

### Tips Mengerjakan Proyek

- Mulai dari **2 MFE** dulu, baru tambah bertahap
- Kerjakan di **monorepo lokal** (Turborepo / Nx) sebelum dipisah per repo
- Terapkan **TypeScript** dan **ESLint** yang sama di semua MFE
- Simpan setiap proyek di GitHub lengkap dengan **README** dan diagram arsitektur sebagai portofolio
- Urutan yang disarankan: **Proyek 1 → 2 → 3 → 5 → 4 → 6**
