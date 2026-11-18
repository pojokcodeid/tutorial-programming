# Pelajaran 2 — Arsitektur Nginx & Request Lifecycle

> **Durasi:** ± 10 menit
> **Prasyarat:** [Pelajaran 1 — Apa Itu Nginx?](01-apa-itu-nginx.md), lab `nginx-lab` sudah berjalan

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan perbedaan **master process** dan **worker processes**.
- Menjelaskan mengapa Nginx disebut **event-driven dan non-blocking**.
- Memetakan alur request: **client → Nginx → filesystem/upstream → response**.
- Menentukan **jumlah worker** yang disarankan untuk mesin kamu.
- Memakai `nginx -t` dan `nginx -T` sebagai alat investigasi konfigurasi.

---

## Cerita pembuka: kantor tanpa antrean panjang

Ingat lobi dari Pelajaran 1. Kali ini bayangkan lobi itu **dengan dua aturan aneh**:

1. **Satu manajer** mengatur semua pegawai — manajer ini tidak pernah menyapa tamu sendiri, ia hanya membagi tugas dan mengawasi.
2. **Pegawai di lobi tidak pernah tidur menunggu satu tamu.** Begitu ada tamu datang, dia layani; sementara menunggu dokumen diproses di belakang, dia **langsung melayani tamu berikutnya**. Tidak ada pegawai yang menganggur hanya karena satu tamu lambat.

Hasilnya? Dengan 4 pegawai, lobi bisa melayani **ribuan tamu** tanpa menambah pegawai. Bandingkan dengan model lama: **satu pegawai per tamu** — 10.000 tamu berarti 10.000 pegawai, lobi langsung kolaps.

Dua aturan itulah inti arsitektur Nginx: **master + worker**, dan **event-driven non-blocking**.

---

## Master process: si pengawas

Saat kamu menjalankan `nginx`, yang pertama hidup adalah **master process** (berjalan sebagai `root`).

Fokusnya cuma satu: **mengelola worker**:

- Membaca dan memvalidasi konfigurasi.
- Membuka port yang diminta (`listen 80`, `listen 443`).
- **Menjalankan dan mengawasi worker** — kalau worker mati, master segera menyalakan penggantinya.
- Menangani `reload`: menerima konfigurasi baru, menjalankan worker baru, lalu menghentikan worker lama dengan **graceful** (tanpa memutus koneksi yang sedang berjalan).

Master **tidak menyentuh request HTTP sama sekali**. Dia manajer, bukan pelayan.

```text
$ ps -ef | grep nginx
root     1     ...  nginx: master process nginx -g daemon off;
nginx   32     ...  nginx: worker process
nginx   33     ...  nginx: worker process
```

---

## Worker processes: si pelayan

**Worker** adalah proses yang benar-benar melayani request — berjalan dengan **privilege turunan** (user `nginx`, bukan `root`) sesuai prinsip *least privilege*. Setiap worker bisa menangani **ribuan koneksi sekaligus** dalam satu proses; kuncinya ada di cara ia bekerja.

---

## Event-driven & non-blocking: kenapa sedikit worker bisa banyak koneksi

Ini konsep paling penting di pelajaran ini.

| Model | Cara kerja | Masalah |
|-------|-----------|---------|
| **Thread-per-request** (model lama) | Satu thread/ proses untuk satu koneksi, tidur menunggu I/O selesai | 10.000 koneksi = 10.000 thread → boros memori, konteks berganti terus |
| **Nginx: event-driven non-blocking** | Satu worker menangani banyak koneksi; ketika menunggu disk/backend, worker **tidak tidur** — dia melayani koneksi lain, lalu kembali lagi saat data siap | Sedikit worker, puluhan ribu koneksi, memori tetap kecil |

Istilahnya:

- **Event-driven** — worker hanya "terbangun" saat ada *event* (koneksi masuk, data siap dibaca, socket tertulis).
- **Non-blocking** — operasi I/O (baca file, koneksi ke backend) dijalankan tanpa memblokir worker. Sambil menunggu, worker mengurus event lain — persis seperti kasir yang melayani orang berikutnya sambil menunggu pelanggan pertama mengambil dompet.

---

## Jumlah worker yang disarankan

Aturan baku dari dokumentasi Nginx: **jumlah worker = jumlah core CPU**. Banyak distro memakai `worker_processes auto;` agar dihitung otomatis. Satu worker per core menghindari saling berebut CPU; untuk I/O-bound boleh sedikit lebih banyak, tapi **jangan** ratusan worker — bukan begitu cara Nginx menghemat.

---

## Alur request: client → Nginx → upstream → response

Sekarang kita rangkai semuanya. Berikut perjalanan satu request HTTP:

```text
 [Client] ──GET /index.html──▶
 ┌────────────────────────── Nginx ──────────────────────────┐
 │  master process (mengawasi, tidak menyentuh request)      │
 │        │  membagi ke worker yang available                │
 │        ▼                                                  │
 │  [ worker ]  1. terima koneksi   2. baca request header   │
 │              3. pilih server & location yang cocok        │
 │              4. ambil konten (non-blocking)               │
 └──────────────┬──────────────────┬─────────────────────────┘
                ▼                  ▼
        [filesystem]        [upstream / backend]
        /usr/share/         app-1 :3000
          nginx/html        (mengolah request,
          index.html         mengirim response)
                │                  │
                └────────┬─────────┘
                         ▼
        Nginx menyusun response (status, header,
        body — atau dari cache bila HIT)
                         │
                         ▼
                 [Client] 200 OK
```

Kata kunci setiap tahap: **terima** koneksi di port `listen` → **cocokkan** `server` lalu `location` → **ambil konten** dari filesystem, upstream, atau cache → **kirim** response, lalu catat di **access log**.

Karena worker non-blocking, satu worker bisa berada di tahap "menunggu backend" untuk 500 request sekaligus tanpa berhenti melayani request lain.

---

## Membuka lab dengan `nginx -t` dan `nginx -T`

Sebelum menyentuh konfigurasi apa pun (mulai Pelajaran 3), biasakan dua "tongkat" investigasi ini:

- **`nginx -t`** — *uji sintaks*: bilang `syntax is ok` / `test is successful`, atau menunjuk baris yang salah. **Selalu jalankan sebelum reload.**
- **`nginx -T`** — *dump lengkap*: mengeluarkan **seluruh** konfigurasi aktif (termasuk semua `include`) beserta lokasi filenya — cara melihat "apa yang benar-benar Nginx pakai sekarang".

Di container: `podman exec nginx-lab nginx -t` dan `podman exec nginx-lab nginx -T | head -n 40`.

---

## Contoh konfigurasi

Cuplikan minimal yang menunjukkan konsep arsitektur (bukan konfigurasi produksi):

```nginx
worker_processes auto;          # jumlah worker = jumlah core
events {
    worker_connections 1024;    # maksimum koneksi per worker
}
http {
    server {
        listen 80;
        server_name localhost;

        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
}
```

| Directive | Arti |
|-----------|------|
| `worker_processes` | Jumlah worker process; `auto` = ikut jumlah core. |
| `events { ... }` | Context untuk parameter level koneksi. |
| `worker_connections` | Maksimum koneksi yang ditangani **satu worker**. |
| `http { ... }` | Context untuk semua konfigurasi HTTP. |

> Kapasitas teoritis ≈ `worker_processes × worker_connections`. Itu juga yang membuktikan Nginx tidak butuh "satu proses per koneksi".

---

## Lab

Pastikan container hidup (lewati `run` bila sudah ada):

```bash
podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
```

Amati arsitektur dan konfigurasinya:

```bash
curl -i http://localhost:8080
podman logs nginx-lab
podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -T | sed -n '1,40p'
```

**Ekspektasi hasil:**

- `curl -i` → `HTTP/1.1 200 OK`, body halaman default.
- `podman logs` → akses log berisi `GET /` dengan status `200`.
- `nginx -t` → `syntax is ok` / `test is successful`.
- `nginx -T` → menampilkan `worker_processes`, blok `events`, lalu `http { ... }` — bukti konfigurasi dump lengkap termasuk file `include`.

Verifikasi arsitektur process: `podman exec nginx-lab sh -c 'ps -o pid,ppid,user,comm,args'` — harus terlihat minimal **`nginx: master process`** diikuti beberapa **`nginx: worker process`**, persis seperti diagram di atas.

---

## Kesalahan umum

- Mengira master yang melayani request — **hanya worker** yang menyentuh HTTP.
- Memasang ratusan worker agar "lebih kencang" — Nginx justru efisien dengan **sedikit** worker.
- Lupa bahwa `worker_connections` dikalikan jumlah worker — kapasitas mesin, bukan per proses.
- Menjalankan `nginx -t`/`-T` di host padahal konfigurasi ada di container — gunakan `podman exec nginx-lab ...`; dan jangan tertukar: `-t` hanya mengecek sintaks, `-T` menampilkan isi lengkap konfigurasi.

---

## Rangkuman

- **Master process** = pengawas: baca konfigurasi, buka port, kelola worker, tangani reload.
- **Worker process** = pelayan request, berjalan dengan privilege terbatas.
- Nginx **event-driven & non-blocking**: satu worker melayani ribuan koneksi tanpa tidur menunggu I/O.
- **Jumlah worker disarankan = jumlah core CPU** (`worker_processes auto`).
- Alur request: **client → worker (cocokkan server/location) → filesystem/upstream/cache → response → access log**.
- **`nginx -t`** mengecek sintaks; **`nginx -T`** menampilkan seluruh konfigurasi aktif — dua alat wajib sebelum reload.

---

## Latihan

1. Gambarkan dengan kata-katamu sendiri perbedaan **master** dan **worker**, plus satu tugas masing-masing.
2. Jelaskan kenapa **10.000 koneksi tidak berarti 10.000 proses** di Nginx (sebutkan istilah *event-driven* dan *non-blocking*).
3. Hitung kapasitas teoritis: `worker_processes auto` di mesin 4 core, `worker_connections 1024`. Berapa koneksi maksimum? Lalu buktikan dengan `podman exec nginx-lab nginx -T`.

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **Master process** | Proses pengawas yang mengelola worker dan reload. |
| **Worker process** | Proses yang benar-benar melayani request HTTP. |
| **Event-driven** | Worker bereaksi hanya saat ada kejadian (event) pada koneksi. |
| **Non-blocking** | Operasi I/O tidak menahan/memblokir worker. |
| **Upstream** | Backend yang menerima request diteruskan Nginx. |
| **worker_connections** | Batas koneksi maksimum per worker. |
| **nginx -t / -T** | Uji sintaks / dump seluruh konfigurasi aktif. |

**Lanjut ke [Pelajaran 3 — Struktur Konfigurasi Nginx →](03-struktur-konfigurasi.md)**
