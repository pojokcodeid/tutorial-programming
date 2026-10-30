# 📄 Planning Bab: Dasar RESTful API

> **Status:** Rencana penulisan materi (belum menjadi naskah materi)
> **Sumber rujukan:** `roadmap-belajar-restful-api.md` — Fase 1 sampai Fase 3
> **Bentuk akhir:** Dokumen materi (Markdown) — penulisan materi lengkap adalah tahap setelah planning ini disetujui.

---

## 1. Ringkasan Bab

| Aspek | Keterangan |
|-------|-----------|
| **Nama bab** | Dasar RESTful API |
| **Sifat** | Materi dasar yang **berdiri sendiri** (bukan kelanjutan materi tertentu) |
| **Target pembaca** | Orang awam / pemula total yang baru mengenal dunia backend & API |
| **Prasyarat** | Familiar membuka terminal (bisa diajari seperlunya di materi), tidak wajib sudah bisa bahasa pemrograman |
| **Jumlah pelajaran** | 15 pelajaran + kuis |
| **Estimasi durasi** | ± 3 menit baca + latihan per pelajaran → total ± 1–2 minggu (belajar santai) |
| **Cakupan roadmap** | Fase 1 (HTTP, dipilih bagian dasarnya), Fase 2 (Konsep REST), Fase 3 (Konsumsi API), ditutup proyek mini pengantar Fase 4 |
| **Bentuk akhir** | Dokumen materi (Markdown) — penulisan materi lengkap adalah tahap setelah planning ini disetujui |

### Pemetaan ke roadmap

| Fase di roadmap | Pelajaran di bab ini |
|-----------------|----------------------|
| Fase 1 — Fundamental Web & HTTP | Pelajaran 2, 3, 4, 5, 6, 7, 8 |
| Fase 2 — Konsep REST | Pelajaran 1, 9, 10, 11, 12 |
| Fase 3 — Konsumsi API | Pelajaran 13, 14 |
| Fase 4 — Membangun API (pengantar) | Pelajaran 15 (proyek mini) |

> **Catatan pemisahan:** materi HTTP mendalam (cookie, cache, CORS, HTTPS, HTTP/2, dsb.) sudah ada di materi **HTTP (19 pelajaran)**. Bab ini hanya mengambil **kunci-kunci dasar** yang dibutuhkan untuk memahami REST, lalu merujuk ke materi HTTP untuk pembahasan lebih lanjut — tanpa mengulang.

---

## 2. Tujuan Pembelajaran Akhir

Setelah menyelesaikan bab ini, pembaca **diharapkan mampu**:

1. Menjelaskan apa itu API dan REST dengan bahasa sendiri memakai analogi sehari-hari.
2. Membaca dan memahami satu request–response HTTP (method, URL, header, body, status code).
3. Membaca data JSON tanpa kebingungan.
4. Membedakan mana yang benar untuk GET, POST, PUT, PATCH, dan DELETE — serta kapan status code 201/404/500 dipakai.
5. Menilai sebuah endpoint "sudah REST atau belum" (penamaan, idempotency, format response).
6. Mencoba API sungguhan menggunakan Postman/curl, lalu memanggil API dari kode program.

---

## 3. Rancangan 15 Pelajaran

### Pelajaran 1 — Apa Itu API? Kenapa Aplikasi Butuh API

- **Tujuan:** menjelaskan API dengan analogi; membedakan website biasa vs API.
- **Poin bahasan:**
  - API = *Application Programming Interface* — "perantara resmi" agar dua program bisa saling bicara.
  - **Analogi utama: restoran.** Kamu (klien) tidak masuk ke dapur (server); kamu pesan lewat pelayan (API) memakai menu yang sudah disepakati.
  - Contoh nyata: cek cuaca di HP, login pakai Google, bayar e-wallet, notifikasi pesanan ojek online.
  - Beda **website** (untuk manusia) vs **API** (untuk program).
- **Contoh:** diagram teks `Aplikasi HP → request → API → server → response JSON → Aplikasi HP`.
- **Latihan:** tulis 3 kegiatan harianmu yang ternyata memakai API.

### Pelajaran 2 — Client, Server, dan Anatomi Request–Response

- **Tujuan:** menggambar alur komunikasi web; tahu isi request dan response.
- **Poin bahasan:**
  - Client vs Server (klien = yang minta, server = yang melayani).
  - Siklus: **request** (method + URL + header + body) → server memproses → **response** (status code + header + body).
  - **Analogi surat:** method = jenis surat, URL = alamat tujuan, header = amplop, body = isi surat, status code = tanda terima.
  - Kenapa komunikasi ini terjadi ribuan kali sehari tanpa kita sadari.
- **Latihan:** buka browser → DevTools → tab **Network**, amati request pertama saat membuka satu situs.

### Pelajaran 3 — URL & Endpoint: Alamat Rumah untuk Data

- **Tujuan:** membedakan URL, domain, path, dan endpoint.
- **Poin bahasan:**
  - Anatomi URL: `https://toko.com/api/v1/products?category=sepatu` → skema, domain, path, query.
  - **Endpoint** = alamat resource yang bisa dipanggil API (URL + method).
  - Singkat soal DNS & IP (domain = nama, IP = nomor rumah) — cukup satu paragraf.
  - Kenapa endpoint memakai kata benda (`/products`), bukan kata kerja (`/getProducts`) — ditekankan sejak awal.
- **Latihan:** bedakan mana path, query, dan domain dari 3 contoh URL.

### Pelajaran 4 — HTTP Method: GET, POST, PUT, PATCH, DELETE

- **Tujuan:** memetakan 5 method utama ke operasi CRUD.
- **Poin bahasan:**
  - **Analogi buku tamu/perpustakaan:** GET = membaca daftar, POST = menambah anggota baru, PUT = mengganti seluruh data, PATCH = memperbarui sebagian, DELETE = menghapus.
  - Tabel pemetaan CRUD → method → contoh endpoint → status sukses.
  - `HEAD` & `OPTIONS` cukup dikenal (penjelasan satu kalimat).
  - Aturan sederhana: **method menentukan AKSI, path menentukan SIAPA yang diaksi.**
- **Latihan:** tulis kombinasi method + endpoint untuk skenario "ubah harga satu produk".

### Pelajaran 5 — Status Code: Kode Balasan Server

- **Tujuan:** hafal dan paham status code yang paling sering muncul.
- **Poin bahasan:**
  - **Analogi nomor antrean/struk:** angka pertama menentukan kategori hasil.
  - `2xx` sukses (200, 201, 204) · `3xx` pindah halaman · `4xx` **salah di sisi klien** (400, 401, 403, 404, 409, 422, 429) · `5xx` **server bermasalah** (500, 502, 503).
  - Bedah kasus: 401 vs 403 (belum login vs tidak berhak) — sering tertukar.
  - Kenapa API harus jujur mengirim kode (bukan 200 terus walau gagal).
- **Latihan:** tebak status code untuk 8 skenario singkat (mis. "menghapus produk yang tidak ada").

### Pelajaran 6 — Mengenal JSON: Bahasa Data Web

- **Tujuan:** membaca dan menulis JSON sederhana.
- **Poin bahasan:**
  - JSON = format data ringan yang mudah dibaca manusia **dan** mesin; penerus praktis XML.
  - Struktur: objek `{}`, array `[]`, pasangan `"kunci": nilai`; aturan tanda kutip.
  - JSON boleh bersarang — cara membacanya bertingkat.
  - Kenapa hampir semua API modern memakai JSON.
- **Latihan:** ubah daftar 3 buku (judul, penulis, tahun) menjadi JSON yang valid.

### Pelajaran 7 — Path, Query, dan Body: Di mana Data Diletakkan?

- **Tujuan:** tahu tempat yang tepat untuk setiap jenis data.
- **Poin bahasan:**
  - **Path parameter** → menunjuk **siapa** resource (`/products/42`).
  - **Query parameter** → mengatur **cara membaca** (filter, cari, halaman): `?page=2&status=aktif`.
  - **Body** → **isi data** untuk membuat/mengubah (JSON).
  - **Analogi:** path = nama orang yang dituju, query = instruksi tambahan di amplop, body = isi surat.
  - Kenapa password tidak boleh di query (tercatat di riwayat URL).
- **Latihan:** tentukan tempat yang tepat untuk 6 data (id user, kata kunci cari, halaman, data pendaftaran, dst.).

### Pelajaran 8 — HTTP Headers: Amplop yang Menyimpan Instruksi

- **Tujuan:** mengenali header yang paling sering dipakai API.
- **Poin bahasan:**
  - Header = informasi tambahan di luar body.
  - `Content-Type` (isi apa yang kubirim), `Accept` (isi apa yang kumau), `Authorization` (aku siapa), `User-Agent`, `Cache-Control` (singkat).
  - **Analogi:** seperti keterangan pada amplop surat.
  - Cara membaca request di Postman/DevTools.
- **Latihan:** tuliskan header yang dibutuhkan untuk request "kirim data pendaftaran JSON + sertakan token".

### Pelajaran 9 — Apa Itu REST? 6 Prinsipnya dengan Bahasa Sederhana

- **Tujuan:** menjelaskan REST tanpa jargon berlebihan.
- **Poin bahasan:**
  - REST (*Representational State Transfer*) = **gaya merancang API** yang diperkenalkan Roy Fielding (2000). Bukan program/protokol, melainkan kumpulan aturan agar API mudah ditebak.
  - 6 prinsip dengan penjelasan awam:
    1. **Client–Server** — yang minta dan yang melayani dipisah.
    2. **Stateless** — server tidak mengingatmu; setiap request membawa identitasnya sendiri (analogi: setiap kali ke bank bawa KTP, bukan diingat satpam).
    3. **Cacheable** — boleh disimpan sementara agar cepat.
    4. **Uniform Interface** — aturan main yang sama untuk semua resource.
    5. **Layered System** — ada banyak lapisan di balik layar (proxy, gateway).
    6. **Code on Demand** — opsional: server bisa mengirim kode ke klien.
  - API yang "RESTful" = API yang taat pada prinsip-prinsip ini.
- **Latihan:** sebutkan contoh stateless pada aplikasi ojek online.

### Pelajaran 10 — Merancang Endpoint yang Enak Dibaca

- **Tujuan:** mampu menyusun daftar endpoint untuk satu aplikasi.
- **Poin bahasan:**
  - Aturan penamaan: kata benda jamak (`/users`), huruf kecil/kebab-case (`/order-items`), hindari kata kerja.
  - Resource bersarang secukupnya: `/users/42/orders` — maksimal 2–3 level.
  - Versi API: `/api/v1/products` (dan kenapa perlu).
  - Tabel endpoint lengkap untuk contoh **aplikasi toko** (produk, kategori, pesanan, pengguna).
  - Kombinasi dengan query untuk filter/halaman.
- **Latihan:** rancang minimal 6 endpoint untuk "Perpustakaan Online" (buku, anggota, peminjaman).

### Pelajaran 11 — Format Response & Error yang Konsisten

- **Tujuan:** membuat/membaca bentuk respons yang rapi dan konsisten.
- **Poin bahasan:**
  - Contoh respons **sukses** (data + pesan) dan **gagal** (kode error + detail) dalam JSON.
  - Pentingnya konsistensi: klien program jadi mudah memproses.
  - Mengapa pesan error harus **aman & jelas** (jangan bocorkan detail internal server).
  - Kenyamanan: field bantu seperti `meta` untuk halaman/data total.
- **Latihan:** perbaiki 2 contoh respons JSON yang "berantakan" agar konsisten.

### Pelajaran 12 — Safe, Idempotent, dan Kesalahan Desain yang Sering Terjadi

- **Tujuan:** memahami dua sifat method dan menghindari kebiasaan buruk.
- **Poin bahasan:**
  - **Safe** (tidak mengubah data): GET, HEAD, OPTIONS.
  - **Idempotent** (diulang berkali hasil akhirnya sama): GET, PUT, DELETE — dengan contoh konkret (DELETE dua kali tetap "terhapus").
  - **POST tidak idempotent** — mengulang = membuat dua data.
  - Kesalahan umum: GET dipakai menghapus, POST untuk membaca data, semua respons selalu `200 OK`, ID disimpan di body saat seharusnya di path.
- **Latihan:** perbaiki 4 endpoint "rusak" menjadi versi yang benar.

### Pelajaran 13 — Mencoba API Sungguhan: Postman & cURL

- **Tujuan:** bisa memanggil API pertama kali tanpa menulis program.
- **Poin bahasan:**
  - Pengenalan tool: Postman / Bruno / Thunder Client, dan `cURL` di terminal.
  - Anatomi satu request di Postman (URL, method, header, body, tombol kirim).
  - Membaca hasil: status code, header, body response.
  - API publik latihan: **JSONPlaceholder**, **PokéAPI**, **ReqRes**.
  - Menangani kegagalan: koneksi putus, 404, 500.
- **Latihan:** jalankan GET daftar post, GET satu post, dan POST buat data baru di JSONPlaceholder.

### Pelajaran 14 — Memanggil API dari Program (Fetch / Axios / Requests)

- **Tujuan:** memanfaatkan API di dalam kode program.
- **Poin bahasan:**
  - Contoh **JavaScript (Fetch API)**: GET membaca data → menampilkan; POST mengirim data → memeriksa status code.
  - Alternatif **Axios** (JavaScript) dan **requests** (Python) — satu contoh masing-masing.
  - Kebiasaan baik: selalu periksa `res.ok` / `status_code`, siapkan penanganan error (data tidak ada, server error, koneksi gagal).
  - Kenapa proses ini *asynchronous* (dijelaskan singkat dengan analogi menunggu pesanan).
- **Latihan:** buat skrip kecil yang menampilkan 10 judul data dari API publik + pesan error yang ramah.

### Pelajaran 15 — Proyek Mini, Rangkuman, dan Langkah Berikutnya

- **Tujuan:** merangkum bab dan menguji pemahaman lewat proyek.
- **Isi:**
  - **Rangkuman 15 pelajaran** (daftar konsep kunci satu baris per pelajaran).
  - **Proyek Mini A — Konsumsi API:** aplikasi kecil (web sederhana) yang menampilkan data dari API publik (PokéAPI atau JSONPlaceholder) lengkap dengan pencarian, pagination opsional, dan pesan error yang ramah.
  - **Proyek Mini B — Rancang API:** tulis dokumen rancangan API toko/warung: daftar endpoint + method + status code + contoh request/response JSON, lalu uji request-nya ke mock API (ReqRes / json-server) di Postman.
  - **Checklist siap lanjut** → menuju Fase 4 roadmap: "Membangun REST API Pertamamu".
- **Latihan:** kerjakan salah satu Proyek Mini, unggah catatan/rancangan ke GitHub (jika sudah kenal Git).

---

## 4. Kuis Bab

| Aspek | Rencana |
|-------|---------|
| Jumlah soal | **40 soal** pilihan ganda (4 opsi) + pembahasan singkat tiap soal |
| Format | Mengikuti pola kuis aplikasi (id `restful01`–`restful40`, field `q`, `options`, `answer`, `explain`) |
| Sebaran topik | Konsep API & client–server: 4 · Request–response & URL: 4 · Method: 6 · Status code: 8 · JSON: 5 · Parameter & header: 5 · Prinsip REST & desain endpoint: 4 · Safe/idempotent & praktik: 4 |

> Contoh arah soal: *"Mengapa GET termasuk method yang aman dipanggil berkali-kali?"*, *"Status code apa yang tepat saat membuat data baru?"*, *"Manakah penulisan endpoint yang benar?"*

---

## 5. Panduan Gaya Bahasa (Wajib untuk Pembaca Awam)

1. **Kalimat pendek & aktif.** Maksimal ± 20 kata per kalimat; satu ide per paragraf.
2. **Selalu mulai dari analogi** sehari-hari (restoran, surat, antrean, KTP, struk) sebelum istilah teknis.
3. **Istilah asing diberi padanan & penjelasan** saat pertama muncul, mis. *"endpoint (alamat resource)"*.
4. **Hindari jargon tanpa pembuka:** "middleware", "serialization", "HATEOAS" tidak boleh muncul sebelum dijelaskan — di bab ini sebaiknya tidak dipakai sama sekali kecuali di kotak "istilah lanjutan".
5. **Pakai bahasa "kamu"** agar terasa seperti teman menjelaskan.
6. **Gunakan tabel & diagram teks** untuk hal yang lebih mudah dilihat daripada dibaca.
7. **Contoh dari aplikasi lokal:** Tokopedia, GoFood, WhatsApp, e-wallet — lebih dekat ke keseharian pembaca Indonesia.
8. **Tiap pelajaran ditutup** dengan: rangkuman 3–5 poin + satu latihan kecil yang bisa dikerjakan < 10 menit.
9. **Panjang target:** setara 800–1.200 kata per pelajaran (± 3 menit baca).
10. **Tidak ada kode panjang** di bab ini — cukup potongan JSON/curl pendek, karena ini bab konsep.

---

## 6. Rujukan

- [restfulapi.net — REST API Tutorial](https://restfulapi.net/)
- [MDN Web Docs — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) · [PokéAPI](https://pokeapi.co/) · [ReqRes](https://reqres.in/)
- [Postman Learning Center](https://learning.postman.com/)
- Dokumen resmi Fetch API (MDN)
- Roadmap sumber: `roadmap-belajar-restful-api.md` (Fase 1–3)

---

## 7. Checklist Penyusunan (Tahapan Setelah Planning Disetujui)

- [ ] Tulis naskah Pelajaran 1–5 (fondasi: apa itu API → status code)
- [ ] Tulis naskah Pelajaran 6–8 (JSON, parameter, header)
- [ ] Tulis naskah Pelajaran 9–12 (inti REST & desain)
- [ ] Tulis naskah Pelajaran 13–15 (praktik, proyek, rangkuman)
- [ ] Susun 40 soal kuis + pembahasan
- [ ] Review konsistensi istilah & gaya bahasa (sesuai bagian 5)
- [ ] (Opsional, jika kelak dijadikan materi aplikasi) daftarkan ke `js/content.js`, `index.html`, `tests/smoke.js`
