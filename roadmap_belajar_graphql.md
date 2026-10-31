# Roadmap Belajar GraphQL: Dari Nol Sampai Mahir 🚀

Dokumen ini dirancang sebagai panduan bertahap (step-by-step) untuk menguasai GraphQL, mulai dari konsep dasar hingga teknik arsitektur tingkat lanjut.

---

## 📍 Fase 1: Konsep Dasar & Alasan Menggunakan GraphQL (Pemula)

Sebelum menulis kode, penting untuk memahami **mengapa** GraphQL diciptakan dan bagaimana ia berbeda dari REST API.

### 1. Perbandingan REST API vs GraphQL
- **Masalah pada REST API**: *Over-fetching* (menerima terlalu banyak data) dan *Under-fetching* (harus membuat beberapa HTTP request untuk mendapatkan data yang dibutuhkan).
- **Pendekatan GraphQL**: *Declarative Data Fetching* — Klien menentukan struktur data yang presisi, dan server merespons sesuai permintaan tersebut.
- **Endpoint**: REST menggunakan banyak URL/endpoint (`/users`, `/posts`), sedangkan GraphQL menggunakan **satu endpoint tunggal** (biasanya `/graphql`).

### 2. Dasar-Dasar GraphQL
- **Schema & Type System**: GraphQL menggunakan Type Definition Language (SDL) yang bersifat *strongly-typed*.
- **3 Operasi Utama**:
  1. `Query`: Untuk membaca data (seperti GET pada REST).
  2. `Mutation`: Untuk mengubah, menambah, atau menghapus data (seperti POST/PUT/DELETE).
  3. `Subscription`: Untuk komunikasi *real-time* berbasis WebSocket.

---

## 📍 Fase 2: Sintaksis & Operasi Klien (Klien Dasar)

Memahami cara menulis query GraphQL dari sudut pandang *frontend* atau aplikasi klien.

### 1. Menulis Query
- **Selection Sets**: Memilih *field* yang spesifik.
- **Arguments**: Mengirim parameter ke field (misal: `user(id: "123")`).
- **Aliases**: Mengubah nama field di respon untuk menghindari konflik.
- **Fragments**: Mengelompokkan field yang sering digunakan kembali untuk efisiensi kode.

### 2. Menulis Mutation
- Mengirim data input (*Variables*).
- Mengembalikan data dari objek yang baru diperbarui/dibuat.

### 3. Konsep Ekstra
- **Directives**: Kondisional pada query seperti `@include(if: Boolean)` dan `@skip(if: Boolean)`.

---

## 📍 Fase 3: Pembangunan GraphQL Server (Backend)

Membuat backend GraphQL pertama Anda menggunakan Node.js (misal: Apollo Server, Yoga GraphQL, atau Mercurius).

### 1. Schema Definition Language (SDL)
- **Scalar Types**: `Int`, `Float`, `String`, `Boolean`, `ID`.
- **Custom Types**: Membuat objek data kustom.
- **Enums**: Tipe data terbatas pada sekumpulan nilai tetap.
- **Input Types**: Struktur data khusus untuk argument pada Mutation.
- **Non-Null & Lists**: Tanda `!` (harus ada/wajib) dan `[]` (array).

### 2. Resolvers
- Memahami konsep **Resolver Function**: `(parent, args, context, info)`.
- **Execution Flow**: Bagaimana GraphQL mengeksekusi resolver pohon data (Graph traversal).
- **Context Handling**: Mengakses data global seperti koneksi database, header HTTP, atau data otentikasi.

### 3. Integrasi Database
- Menyambungkan resolver ke ORM/Query Builder (Prisma, TypeORM, Mongoose, Drizzle).

---

## 📍 Fase 4: Mengintegrasikan Klien Frontend (Frontend Specialist)

Menghubungkan GraphQL dengan *framework* modern seperti React, Vue, atau Svelte.

### 1. GraphQL Client Libraries
- **Apollo Client**: Paling umum, fitur lengkap (Caching, State Management).
- **URQL**: Ringan, modular, dan fleksibel.
- **TanStack Query (React Query)** / **Relay**: Alternatif lain untuk pengelolaan data.

### 2. Fitur Utama Klien
- **Normalized Caching**: Memahami cara kerja cache di Apollo Client/URQL.
- **Code Generation**: Menggunakan **GraphQL Code Generator** untuk membuat tipe TypeScript otomatis dari Query/Mutation Anda.

---

## 📍 Fase 5: Teknik Tingkat Lanjut & Optimasi (Lanjutan)

Menghadapi tantangan performa dan keamanan aplikasi GraphQL tingkat produksi.

### 1. Menangani Masalah Performa
- **N+1 Problem**: Masalah query berulang pada relasi data.
- **DataLoader**: Menggunakan pola *Batching* dan *Caching* untuk menyelesaikan N+1 problem.

### 2. Keamanan (Security & Hardening)
- **Rate Limiting**: Membatasi jumlah request.
- **Query Depth Limiting**: Mencegah serangan nested query yang dalam/tak terbatas.
- **Query Cost Analysis / Complexity**: Mengukur beratnya query sebelum dieksekusi.
- **Disabling Introspection**: Mematikan introspeksi schema di lingkungan Production.

### 3. Otentikasi & Otorisasi
- **Authentication**: JWT / Session handling melalui `context`.
- **Authorization**:
  - *Field-level authorization* (di dalam resolver).
  - *Directive-based authorization* (misal: `@auth`, `@hasRole`).

### 4. Real-time dengan Subscriptions
- Mengkonfigurasi WebSocket Server untuk GraphQL Subscriptions.

---

## 📍 Fase 6: Arsitektur Skala Besar (Mahir)

Pola arsitektur untuk sistem enterprise dan mikroservis.

### 1. Schema Stitching vs GraphQL Federation
- **Schema Stitching**: Menggabungkan beberapa schema GraphQL terpisah menjadi satu gateway secara manual.
- **GraphQL Federation (Apollo Federation)**: Pendekatan modern di mana setiap mikroservis (*subgraph*) memiliki sebagian schema, dan *gateway*/router merangkainya menjadi satu *supergraph*.

### 2. Observability & Monitoring
- **Tracing & Logging**: Mengukur waktu eksekusi tiap resolver.
- **Metrics**: Memantau kesalahan (error rate) dan performa API.

---

## 🛠️ Checklist Proyek Portofolio

Untuk memastikan pemahaman Anda selaras dengan praktik nyata, buatlah proyek berikut bertahap:

1. **Pemula**: Aplikasi Todo / Blog API sederhana menggunakan Node.js, GraphQL Yoga/Apollo Server, dan SQLite/PostgreSQL.
2. **Menengah**: Aplikasi E-Commerce / Media Sosial dengan React + Apollo Client, mencakup Fitur Autentikasi, Pagination (Cursor-based), dan Code Generation TypeScript.
3. **Mahir**: Sistem Mikroservis E-Commerce menggunakan **Apollo Federation**, dilengkapi DataLoader untuk optimasi database, proteksi rate limiting, dan GraphQL Subscriptions untuk notifikasi real-time.

---

## 📚 Sumber Belajar Direkomendasikan
- **Dokumentasi Resmi**: [graphql.org](https://graphql.org/)
- **Tutorial Interactive**: Odyssey oleh Apollo GraphQL
- **Library Populer**: Apollo Server/Client, GraphQL Yoga, GraphQL Code Generator, Prisma ORM.