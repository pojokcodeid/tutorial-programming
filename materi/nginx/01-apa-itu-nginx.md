# Pelajaran 1 — Apa Itu Nginx? Kenapa Web Butuh Nginx

> **Durasi:** ± 10 menit
> **Prasyarat:** dasar terminal, dasar HTTP (request, response, status code), dasar jaringan (IP, port, DNS)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan apa itu Nginx dengan kalimatmu sendiri.
- Membedakan 4 peran utama Nginx: **web server, reverse proxy, load balancer, HTTP cache**.
- Menjelaskan posisi Nginx "di depan" aplikasi dan kenapa arsitektur itu dipakai.
- Menyebutkan perbedaan singkat **Nginx OSS** vs **Nginx Plus**.
- Menjalankan container Nginx pertama kamu dan membukanya lewat `curl`.

---

## Cerita pembuka: restoran dengan satu pintu masuk

Bayangkan sebuah kantor yang ribuan orang mau masuk setiap menit. Kalau setiap tamu langsung mengetuk pintu ruangan masing-masing, ruangannya kewalahan: pintu ditabrak, lobi berantakan, dan tidak ada yang mengatur siapa boleh masuk.

Solusinya klasik: **buat satu lobi besar dengan satpam.** Tamu datang ke lobi, satpam meneruskan mereka ke ruangan yang benar, mencegah orang asing masuk ruangan tertentu, dan menampung antrian kalau ruangannya sedang sibuk.

Di dunia web, **Nginx adalah lobi itu.** Aplikasi kamu (disebut *upstream*) tetap duduk manis di dalam ruangan, tidak perlu ribut menghadapi kerumunan dari luar. Semua orang masuk lewat satu pintu yang dijaga Nginx.

| Di kantor | Di dunia web |
|-----------|--------------|
| Tamu | Client (browser, aplikasi HP) |
| Lobi + satpam | **Nginx** |
| Ruangan di belakang | Aplikasi/backend (Node, Python, Java, ...) |
| Antrian & antrean rapi | Koneksi & request yang diatur Nginx |
| Satpam menolak orang asing | Nginx memblokir/membatasi akses |

---

## Jadi, apa itu Nginx?

**Nginx** (dibaca "engine-x") adalah **server web open source** yang dirilis pertama tahun 2004 oleh Igor Sysoev. Ia dirancang untuk satu hal yang jadi masalah besar di era itu: **melayani puluhan ribu koneksi secara bersamaan tanpa menumpuk proses yang boros.**

Secara singkat:

> **Nginx = program yang duduk di depan aplikasi kamu, menerima request HTTP dari internet, lalu memutuskan harus dibawa ke mana dan dijawab bagaimana.**

Satu hal penting: **Nginx tidak menulis aplikasi kamu.** Ia tidak menghitung saldo, tidak memvalidasi login, tidak menyimpan database. Ia hanya *mengatur lalu lintas* — dan itu sudah sangat banyak gunanya.

---

## Empat peran utama Nginx

Satu binary, empat pekerjaan yang sering dipakai bersamaan.

### 1. Web server — "pelayan halaman statis"

Nginx membaca file HTML, CSS, JavaScript, gambar, dan PDF dari disk lalu mengirimkannya ke browser. Ini pekerjaan paling sederhananya: *client minta `/index.html`, Nginx kirim file-nya.*

### 2. Reverse proxy — "penerus pesan ke ruang belakang"

Aplikasi kamu biasanya jalan di port tertentu (misal `3000`) dan tidak langsung diekspos ke internet. Nginx menerima request di port 80/443, lalu **meneruskannya ke aplikasi** dan mengembalikan jawabannya ke client. Client tidak pernah tahu bahwa di balik layar ada aplikasi lain.

```text
Client ──HTTP :80──▶ [ Nginx ] ──HTTP :3000──▶ [ Aplikasi kamu ]
                      reverse proxy            (tidak diekspos publik)
```

### 3. Load balancer — "pembagi tugas ke banyak ruangan"

Kalau aplikasinya cuma satu, satu ruangan bisa kewalahan. Solusinya: jalankan **banyak salinan** aplikasi, lalu Nginx membagi request secara merata (atau sesuai aturan) ke semuanya. Satu salinan mati? Nginx mengalihkan ke yang hidup.

```text
                    ┌──▶ [ app-1 ]
Client ──▶ [ Nginx ]├──▶ [ app-2 ]
                    └──▶ [ app-3 ]
```

### 4. HTTP cache — "gudang salinan"

Kalau banyak client meminta halaman yang sama, Nginx bisa **menyimpan salinannya** dan menjawab dari gudang itu tanpa menyusahkan backend. Hasilnya: latency turun, beban backend turun.

| Peran | Analogi | Pertanyaan yang dijawab |
|-------|---------|------------------------|
| Web server | Pelayan yang menyiapkan menu | "Di mana file halamannya?" |
| Reverse proxy | Satpam penerus ke ruangan | "Ke aplikasi mana request ini?" |
| Load balancer | Pembagi tugas antar ruangan | "Aplikasi mana yang paling longgar?" |
| HTTP cache | Gudang salinan cepat | "Pernahkah permintaan ini dijawab sebelumnya?" |

---

## Kenapa harus "di depan" aplikasi?

Kalau aplikasi langsung diekspos ke publik, kamu harus mengurus semuanya di dalam aplikasi: HTTPS, rate limit, CORS, melayani file statis, logging, dan seterusnya. Semuanya jadi tanggung jawab kode bisnis — yang seharusnya fokus menghitung saldo, bukan mengurus socket.

Dengan Nginx di depan:

- **Keamanan** — TLS, blokir IP, dan batas request ditangani lapisan terpisah.
- **Skala** — satu pintu melayani banyak salinan aplikasi di belakangnya.
- **Ketahanan** — aplikasi bisa di-restart, di-scale, atau diganti tanpa client sadar.
- **Kecepatan** — file statis dan cache dilayani tanpa menyentuh aplikasi.

Pola ini disebut **edge/gateway pattern**: Nginx adalah pintu masuk tunggal, aplikasi tetap privat di belakangnya.

---

## Nginx OSS vs Nginx Plus (singkat)

| | **Nginx OSS (open source)** | **Nginx Plus** |
|---|---|---|
| Biaya | Gratis, lisensi BSD-style | Berbayar, langganan |
| Fungsi inti | Lengkap: web server, proxy, load balancer, cache, TLS | Sama, plus tambahan |
| Health check aktif | Tidak ada (hanya deteksi pasif) | Ada (active health check) |
| Dashboard/API monitoring | Tidak ada | Ada |
| Support resmi | Komunitas | F2F support dari F5 |

Untuk belajar dan sebagian besar produksi, **OSS sudah lebih dari cukup** — materi di bab ini memakai OSS kecuali disebut lain. Kamu perlu tahu Plus ada, supaya tidak bingung saat membaca dokumentasi yang menyebut fitur berbayar.

---

## Contoh konfigurasi

Konfigurasi paling sederhana — cukup untuk mengenal bentuk file Nginx (dibahas tuntas di Pelajaran 3):

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
```

| Directive | Arti |
|-----------|------|
| `server { ... }` | Satu "rumah" virtual host — blok konfigurasi untuk satu situs. |
| `listen 80` | Dengarkan request HTTP di port 80. |
| `server_name localhost` | Cocokkan Host header `localhost`. |
| `location /` | Tangani semua request yang diawali `/`. |
| `root` | Folder tempat file dicari (di container: `/usr/share/nginx/html`). |
| `index` | File yang dikirim bila client meminta folder (di sini `index.html`). |

---

## Lab

Jalankan container Nginx (lewati bila sudah berjalan):

```bash
podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
```

Lalu buka halaman default dan amati:

```bash
curl -i http://localhost:8080
podman logs nginx-lab
podman exec nginx-lab nginx -t
```

**Ekspektasi hasil:**

- `curl -i` → baris pertama `HTTP/1.1 200 OK`, header `Server: nginx/x.x.x`, lalu body berisi `Welcome to nginx!`
- `podman logs` → baris akses log untuk request `curl` tadi (IP, waktu, `GET /`, status `200`)
- `nginx -t` → `syntax is ok` dan `test is successful`

Verifikasi tambahan:

```bash
curl -s http://localhost:8080 | head -n 3
```

Harus menampilkan awal halaman HTML — bukti Nginx benar-benar membaca file dari disk dan mengirimkannya.

---

## Kesalahan umum

- Menganggap Nginx adalah "aplikasi" — sebenarnya ia lapisan pengatur lalu lintas *di depan* aplikasi.
- Mengira Nginx menggantikan backend — Nginx tidak mengolah data bisnis.
- Langsung mengekspos port aplikasi ke publik tanpa reverse proxy.
- Bingung `nginx -t` gagal padahal container belum jalan — pastikan container `nginx-lab` sudah `running`.
- Menyangka semua fitur tersedia di OSS — health check aktif dan dashboard adalah fitur Nginx Plus.

---

## Rangkuman

- **Nginx = server web** yang menerima request HTTP dan memutuskan ke mana request diteruskan.
- Empat peran utama: **web server, reverse proxy, load balancer, HTTP cache**.
- Pola dasarnya: **Nginx berdiri di depan aplikasi**, aplikasi tetap privat di belakangnya.
- Nginx melayani koneksi dalam jumlah besar dengan efisien — itulah alasan ia begitu populer.
- **OSS gratis dan cukup untuk belajar/most produksi**; Plus menambah health check aktif, dashboard, dan support.
- Lab pertama: container `nginx-lab` di port 8080, dibuka dengan `curl -i http://localhost:8080`.

---

## Latihan

1. Tulis **2 kalimat** menjelaskan Nginx ke teman yang belum tahu IT, memakai analogi lobi/kantor.
2. Sebutkan **4 peran Nginx** dan satu contoh nyata penggunaan masing-masing.
3. Jalankan `curl -i http://localhost:8080`, lalu sebutkan **status code** dan **header `Server`** yang muncul. Apa artinya?

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **Nginx** | Server web open source yang berdiri di depan aplikasi. |
| **Web server** | Program yang menyajikan file HTML/aset ke browser. |
| **Reverse proxy** | Perantara yang meneruskan request client ke backend. |
| **Load balancer** | Pembagi request ke banyak salinan backend. |
| **HTTP cache** | Penyimpan salinan response agar tidak selalu ke backend. |
| **Upstream** | Backend/aplikasi yang menerima request dari Nginx. |
| **OSS vs Plus** | Versi gratis (open source) vs versi berbayar Nginx. |

**Lanjut ke [Pelajaran 2 — Arsitektur Nginx & Request Lifecycle →](02-arsitektur-dan-lifecycle.md)**
