# Pelajaran 3 — Struktur Konfigurasi Nginx: Directive & Context

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 1–2 (tahu Nginx dan arsitektur master/worker), dasar terminal, Podman terpasang.

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Membaca struktur `nginx.conf` dari baris pertama sampai terakhir.
- Membedakan **directive** (satu baris aturan) dengan **context** (blok `{ }` pembungkusnya).
- Menjelaskan hierarki `main → events → http → server → location` dan aturan pewarisan.
- Memakai `include` untuk memecah konfigurasi jadi banyak file.
- Menulis konfigurasi yang rapi: komentar, indentasi, dan pemisahan file.

---

## Cerita pembuka: kamu pindah ke gedung apartemen

Setiap gedung punya **peraturan berlapis**: peraturan gedung, peraturan lantai, peraturan unitmu, lalu aturan spesifik di dalam kamar. Nginx bekerja persis seperti itu.

| Di gedung | Di konfigurasi Nginx | Nama teknisnya |
|-----------|----------------------|----------------|
| Peraturan dasar gedung | Aturan global untuk semua | **Context `main`** |
| Aturan cara pemakaian lift/listrik | Aturan cara kerja worker | **Context `events`** |
| Seluruh gedung | Seluruh traffic HTTP | **Context `http`** |
| Satu unit (satu penghuni) | Satu virtual host / domain | **Context `server`** |
| Satu ruangan | Aturan untuk satu path URL | **Context `location`** |
| Tulisan "lampu mati jam 22:00" | `keepalive_timeout 65;` | **Directive** |

Kuncinya: **aturan di ruangan dalam menimpa aturan luar — tapi hanya jika ruangan itu tidak punya aturan sendiri.** Persis seperti Nginx.

---

## Anatomi directive & parameter

```text
keepalive_timeout 65;      ← satu directive: nama + parameter + titik koma
location /api { ... }      ← directive berbentuk blok (ada kurung kurawal)
# komentar                 ← berlaku sampai akhir baris
```

- Parameter dipisah **spasi/tab**, tanpa koma; setiap directive **wajib diakhiri `;`**, dan blok `{ }` berisi kumpulan directive milik context tersebut.
- Salah satu saja salah (lupa `;`, kurang kurawal) membuat seluruh konfigurasi gagal dibaca.

---

## Context: ruang lingkup aturan

```text
main (paling luar — tanpa kurung kurawal)
├── events { ... }                ← cara kerja worker process
└── http { ... }                  ← seluruh traffic HTTP
        ├── server { ... }        ← 1 virtual host (domain:port)
        │       └── location / { ... }     ← aturan per path URL
        └── server { ... }
                └── location /api { ... }
```

| Context | Isi | Contoh directive |
|---------|-----|------------------|
| `main` | Pengaturan global proses | `user`, `worker_processes`, `pid`, `error_log` |
| `events` | Cara worker bekerja | `worker_connections` |
| `http` | Perlakuan umum semua request | `include`, `sendfile`, `access_log` |
| `server` | Satu virtual host | `listen`, `server_name` |
| `location` | Satu pola URL | `root`, `index`, `proxy_pass`, `return` |

Setiap directive punya context resmi. Menaruhnya di tempat lain → `nginx -t` bilang *"directive is not allowed here"* (mis. `worker_connections` hanya boleh di `events`).

---

## Scope & inheritance (pewarisan)

> **Directive di context luar diwarisi ke context dalam. Jika context dalam mendefinisikan directive yang sama, nilai dalam menimpa nilai luar.**

```nginx
http {
    keepalive_timeout 65;       # berlaku untuk SEMUA server
    server {
        keepalive_timeout 10;   # menimpa → hanya server ini
        location /api {
            keepalive_timeout 2;  # menimpa lagi → hanya /api
        }
    }
}
```

Jadi request ke `/api` memakai nilai `2` — **nilai paling dalam yang menang**, bukan gabungan. Sebagian directive punya parameter `off` (mis. `sendfile off;`) untuk mematikan warisan di context dalam.

---

## Include: memecah konfigurasi jadi banyak file

```nginx
include /etc/nginx/mime.types;      # satu file
include /etc/nginx/conf.d/*.conf;   # banyak file sekaligus
```

- Wildcard `*.conf` dievaluasi **urut alfabet** — karena itu file kadang diberi awalan angka (`00-default.conf`); pakai path absolut agar tidak bergantung pada prefix.
- `nginx -T` membuka semua hasil `include` jadi satu — jadi kamu selalu bisa melihat konfigurasi efektif.

---

## Komentar & praktik konfigurasi rapi

- **Komentari *kenapa*, bukan *apa***: `# health check untuk LB` lebih berguna dari `# location /health`.
- **Satu directive per baris**, indentasi konsisten (2–4 spasi) mengikuti bloknya.
- **Satu `server` (satu domain) per file** di `conf.d/`; kelompokkan potongan berulang di folder `snippets/`.
- Jangan menumpuk directive yang sama di context berdekatan tanpa sadar — timpa atau hapus.

---

## Contoh konfigurasi

`/etc/nginx/nginx.conf` — tetap kecil karena hanya pengaturan global + rujukan:

```nginx
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log  notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    keepalive_timeout  65;

    include  /etc/nginx/conf.d/*.conf;   # aturan per domain ada di sini
}
```

`/etc/nginx/conf.d/default.conf` — satu file, satu server block:

```nginx
server {
    listen       80;
    server_name  _;            # konvensi: penanda server default

    location / {
        root  /usr/share/nginx/html;
        index index.html;
    }
}
```

Penjelasan directive penting:

| Directive | Context | Fungsi |
|-----------|---------|--------|
| `user nginx` + `worker_processes auto` | main | Worker berjalan sebagai user `nginx`, jumlahnya = jumlah CPU core |
| `worker_connections 1024` | events | Koneksi maksimal per worker |
| `include .../mime.types` | http | Peta ekstensi file → tipe MIME |
| `default_type` | http | Tipe MIME bila ekstensi tidak dikenal |
| `keepalive_timeout 65` | http | Koneksi idle ditahan 65 detik |
| `include conf.d/*.conf` | http | Menyisipkan semua file di folder `conf.d` |
| `listen 80` + `server_name _` | server | Port didengarkan + penanda server default (bukan domain nyata) |
| `root` / `index` | location | Direktori dasar file & file bawaan direktori |

---

## Lab

Jalankan container Nginx lalu bedah konfigurasi bawaannya:

```bash
# 1. Jalankan container (sekali jalan, dipakai lagi di Pelajaran 4)
podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
# 2. Validasi konfigurasi resmi di dalam container
podman exec nginx-lab nginx -t
# 3. Lihat konfigurasi lengkap (semua include sudah dibuka) + struktur context-nya
podman exec nginx-lab nginx -T
podman exec nginx-lab nginx -T | grep -nE '^(events|http|server) \{|location'
# 4. Akses halaman default
curl -i http://localhost:8080
```

**Ekspektasi hasil:**

- `nginx -t`: `syntax is ok` lalu `test is successful`; `nginx -T` menampilkan isi `main`, blok `events`, blok `http`, sampai `server { ... }` hasil `include /etc/nginx/conf.d/*.conf`.
- `curl -i`: `HTTP/1.1 200 OK` dengan header `Server: nginx/...` dan halaman "Welcome to nginx!" — container `nginx-lab` dibiarkan hidup, dipakai lagi di Pelajaran 4.

---

## Kesalahan umum

- **Lupa titik koma `;`** → error `unexpected end of file`.
- **Directive di context yang salah** (mis. `root` di `main`) → `directive is not allowed here`.
- **Salah baca pewarisan** — mengira nilai luar dan dalam digabung, padahal nilai dalam **menimpa penuh**.
- **File di `conf.d/` tidak termuat** karena `nginx.conf` tidak punya `include /etc/nginx/conf.d/*.conf;` atau path `include`-nya salah.

---

## Rangkuman

- Konfigurasi Nginx = kumpulan **directive** (`nama nilai;`) dalam **context** (`blok { }`).
- Hierarki: `main → events → http → server → location`; makin dalam, makin spesifik.
- **Pewarisan**: nilai luar berlaku ke dalam, kecuali context dalam menimpanya sendiri.
- `include` (mendukung wildcard) memecah konfigurasi jadi banyak file — konfigurasi rapi = komentar *kenapa*, indentasi konsisten, satu server block per file.

---

## Latihan

1. Dari output `nginx -T`, tunjukkan baris mana yang context `main`, `events`, `http`, dan `server` (sertakan nomor baris hasil `grep`).
2. Tulis potongan konfigurasi agar `keepalive_timeout` bernilai `65` di `http`, `30` di satu `server`, dan `5` di `location /api`. Uji dengan `podman exec nginx-lab nginx -t`.
3. Jelaskan kenapa satu folder `conf.d/` dengan banyak file lebih baik daripada satu `nginx.conf` raksasa — sebutkan 2 keuntungan dan 1 risiko (petunjuk: urutan wildcard).

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **Directive** | Satu baris aturan `nama nilai;` atau blok `nama { }`. |
| **Parameter** | Nilai setelah nama directive, dipisah spasi tanpa koma. |
| **Context** | Blok pembungkus yang menentukan ruang lingkup directive. |
| **Scope** | Seberapa luas sebuah directive berlaku. |
| **Inheritance** | Pewarisan nilai directive dari context luar ke dalam. |
| **Include** | Directive penyisip file konfigurasi lain (mendukung wildcard). |
| **nginx.conf** | File konfigurasi utama tempat seluruh hierarki dimulai. |

**Lanjut ke [Pelajaran 4 — Mengelola & Memvalidasi Konfigurasi →](04-mengelola-konfigurasi.md)**
