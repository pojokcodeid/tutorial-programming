# Pelajaran 1 — Apa Itu API? Kenapa Aplikasi Butuh API

> **Durasi:** ± 10 menit
> **Prasyarat:** tidak ada — ini pelajaran pembuka.

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan apa itu API dengan kalimatmu sendiri.
- Membedakan **website** (untuk manusia) dengan **API** (untuk program).
- Menyebutkan 3 aktivitas harian yang ternyata memakai API.

---

## Cerita pembuka: kamu tidak pernah masuk dapur

Malam ini kamu lapar. Buka aplikasi pesan-antar makanan, pilih nasi goreng, bayar, dan 30 menit kemudian makanan sampai di depan pintu.

Pertanyaannya: **apakah kamu masuk ke dapur restoran untuk memasak sendiri?**

Tentu tidak. Kamu duduk manis, membuka aplikasi, memilih dari **menu**, lalu **pelayan** yang meneruskan pesananmu ke dapur. Dapur yang memasak, pelayan yang mengantar hasilnya kembali ke meja kamu.

Nah, di dunia aplikasi, peran-peran itu ada:

| Di restoran | Di aplikasi | Nama teknisnya |
|-------------|-------------|----------------|
| Kamu (tamu) | Aplikasi di HP-mu | **Klien (client)** |
| Pelayan | Perantara yang meneruskan pesanan | **API** |
| Dapur | Komputer yang menyimpan & mengolah data | **Server** |
| Menu | Daftar yang boleh kamu minta | **Dokumentasi API** |
| Pesanan | Permintaan yang kamu kirim | **Request** |
| Makanan yang datang | Jawaban dari server | **Response** |

Kunci dari cerita ini satu saja: **kamu tidak pernah masuk dapur.** Kamu hanya bicara lewat pelayan yang sudah disepakati caranya.

---

## Jadi, apa itu API?

**API** adalah kependekan dari ***Application Programming Interface*** — kalau diterjemahkan bebas: **antarmuka resmi agar dua program bisa saling bicara.**

Dengar rumit? Padahal intinya persis seperti pelayan tadi:

> **API = perantara resmi. Ia menentukan apa yang boleh diminta, bagaimana cara memintanya, dan bentuk jawabannya.**

Dua program yang bicara lewat API tidak perlu tahu isi "dapur" masing-masing. Mereka cukup sepakat pada aturan main di perantara itu. Itulah gunanya: **aturan yang disepakati bersama membuat semuanya bisa bekerja sama.**

### Contoh nyata yang kamu pakai tiap hari

- **Cek cuaca di HP** — aplikasi cuaca meminta data ke server penyedia cuaca, jawaban datang dalam bentuk JSON.
- **Login pakai Google** — aplikasi lain meminta Google: "orang ini benar pemilik akirnya?" tanpa pernah tahu password-mu.
- **Bayar e-wallet** — aplikasi toko menghubungi aplikasi bank: "potong saldo sebesar ini."
- **Notifikasi pesanan ojek online** — server memberi tahu aplikasi driver bahwa ada pesanan baru.
- **Buka timeline media sosial** — aplikasi meminta daftar postingan terbaru ke server.

Semua itu percakapan antar program. Dan percakapan itulah yang lewat API.

---

## Beda website dengan API

Ini penting, karena dua hal ini sering tertukar.

```text
Buka toko.com di browser
        │
        ▼
┌──────────────────────┐
│  Website             │   ← jawabannya HALAMAN WEB yang cantik
│  (untuk manusia)     │      (tulisan, gambar, tombol, CSS)
└──────────────────────┘

Kirim request ke api.toko.com/products
        │
        ▼
┌──────────────────────┐
│  API                 │   ← jawabannya DATA mentah (JSON)
│  (untuk program)     │      tidak ada hiasan, siap diproses
└──────────────────────┘
```

Perbedaannya mendasar:

| | Website | API |
|---|---------|-----|
| **Dibuat untuk** | Manusia (mata) | Program (kode) |
| **Jawabannya** | Halaman HTML yang dihias | Data terstruktur (biasanya JSON) |
| **Cara pakai** | Klik di browser | Dipanggil dari kode program |

Satu server bisa saja melayani keduanya. Website Tokopedia untuk kamu buka di browser, dan API Tokopedia untuk dipakai aplikasi mobile mereka — **makanan dari dapur yang sama, disajikan beda cara.**

Lalu kenapa repot-repot bikin API, bukan cuma website saja?

Karena **sekali bikin API, banyak yang bisa memakai**: aplikasi Android, aplikasi iPhone, website, smartwatch, bahkan sistem milik perusahaan lain. Tanpa API, tiap aplikasi harus mengurus semuanya sendiri dari nol.

---

## Kapan kamu "memakai" API tanpa sadar?

 Hampir selalu. Cobalah ingat:

1. Kamu membuka aplikasi → aplikasi **meminta** daftar produk ke server.
2. Kamu menekan tombol "Beli" → aplikasi **mengirim** pesanan ke server.
3. Kamu menerima notifikasi → server **mengirim** pemberitahuan ke HP-mu.

Tiga langkah itu masing-masing adalah satu kali percakapan lewat API. Satu menit membuka aplikasi bisa berarti puluhan percakapan kecil.

---

## Rangkuman

- **API = perantara resmi** agar dua program bisa saling bicara dengan aturan yang sudah disepakati.
- Analoginya **pelayan restoran**: kamu (klien) tidak pernah masuk dapur (server).
- **Website** disajikan untuk manusia, **API** disajikan untuk program — biasanya dalam bentuk JSON.
- Semua aktivitas digital harianmu (cek cuaca, bayar, login, notifikasi) berjalan lewat API.
- Ada API membuat satu layanan bisa dipakai banyak jenis aplikasi sekaligus.

---

## Latihan

1. Tulis **3 kegiatan harianmu** yang ternyata memakai API, lengkap dengan dugaan "siapa yang bicara ke siapa" (contoh: *aplikasi bank → server bank*).
2. Untuk satu kegiatan itu, sebutkan: **apa yang diminta** dan **kira-kira apa yang dibalaskan**.
3. *(Opsional)* Ceritakan ke temanmu apa itu API memakai **hanya** analogi restoran. Jika temanmu paham, kamu sudah benar-benar paham.

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **API** | Perantara resmi dua program untuk saling bertukar data. |
| **Klien (client)** | Program yang mengirim permintaan (mis. aplikasi di HP-mu). |
| **Server** | Program yang menyimpan data dan menjawab permintaan. |
| **Request** | Permintaan yang dikirim klien ke server. |
| **Response** | Jawaban yang dikirim server ke klien. |
| **Endpoint** | Alamat untuk memanggil API — dibahas tuntas di Pelajaran 3. |

**Lanjut ke [Pelajaran 2 — Client, Server, Request, Response →](02-client-server-request-response.md)**
