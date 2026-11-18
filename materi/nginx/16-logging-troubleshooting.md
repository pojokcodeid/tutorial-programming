# Pelajaran 16 — Logging, Monitoring & Troubleshooting

> **Durasi:** ± 10–15 menit
> **Prasyarat:** Pelajaran 10–15 (reverse proxy, load balancing, security) dan container `nginx-lab` yang bisa dijalankan

---

## Tujuan belajar

- Membaca `access_log` dan `error_log`, serta memilih `log level` yang tepat.
- Menulis `log_format` custom berisi `$request`, `$status`, `$request_time`, `$upstream_response_time`, `$remote_addr`, dan request ID.
- Membaca metrik dasar lewat `stub_status` dan menjelaskan konsep exporter.
- Menganalisis error 400–504 memakai tabel diagnosis, bukan ingatan.
- Menjalankan troubleshooting sistematis: **client → Nginx → upstream**.

---

## Cerita pembuka: kotak hitam di pesawat

Setiap pesawat punya *black box*. Bukan untuk menghukum pilot, tapi untuk **menceritakan ulang kejadian** saat ada hal aneh. Tanpa rekaman itu, semua orang hanya menebak. Server kamu juga begitu: saat user bilang *"kok error?"*, tanpa log kamu cuma menebak.

> **Log = black box-nya server.** Bukan soal menumpuk sebanyak mungkin, tapi memastikan log mampu **menceritakan ulang kejadian** — siapa minta apa, kapan, statusnya berapa, dan berapa lamanya.

| Kotak | File | Isi | Dibuka saat |
|-------|------|-----|-------------|
| **Access log** | `access.log` | Satu baris untuk tiap request yang selesai dilayani | Melihat pola & status code |
| **Error log** | `error.log` | Kejadian tidak biasa: warning, error, config salah | Mencari root cause |

---

## Log level: seberapa rinci error log

| Level | Ditulis saat | Cocok untuk |
|-------|--------------|-------------|
| `debug` | Detail teknis sangat halus | Mengejar bug sesaat (boros I/O) |
| `info` / `notice` | Informasi normal | Audit tertentu |
| `warn` | Perlu perhatian, masih jalan | **Pilihan aman untuk produksi** |
| `error` | Request gagal (mis. upstream mati) | Fokus kegagalan |
| `crit` / `alert` / `emerg` | Kritis sampai Nginx sulit melayani | Masalah besar |

Catatan: `access_log off;` mematikan log di context itu (hemat I/O, tapi kamu jadi buta). Di image resmi Nginx, `access.log` dan `error.log` sudah disambungkan ke `stdout`/`stderr` container — cukup baca dengan `podman logs nginx-lab`.

---

## log_format dan variabel yang wajib hafal

Format bawaan hanya enak dibaca manusia. Untuk analisis buat format sendiri — `log_format` **hanya boleh di context `http`**.

| Variabel | Isi | Contoh |
|----------|-----|--------|
| `$request` | Metode + URI + protokol utuh | `GET /api/users HTTP/1.1` |
| `$status` | Status code response | `200`, `502` |
| `$request_time` | Waktu total client sampai selesai | `0.043` (detik) |
| `$upstream_response_time` | Waktu Nginx menunggu upstream membalas | `0.041`, atau `-` bila tanpa upstream |
| `$remote_addr` | IP client asli | `103.94.12.7` |
| `$request_id` | ID acak unik 16 karakter hex | `9f3c1a7b2d4e5f60` |

Bedah dua variabel waktu: `$request_time` = baca request + antrian + tunggu upstream + tulis response, sedangkan `$upstream_response_time` hanya bagian di belakang Nginx. Jadi `$request_time` besar tapi upstream kecil → masalah di sisi client (sering berujung **499**); keduanya besar → upstream lambat → berisiko **504**.

**Request ID** menutup celah "log ke-42 tidak membantu saat 100 request per detik":

```text
client ──▶ [ Nginx  rid=9f3c1a ] ──▶ [ app-1  rid=9f3c1a ] ──▶ [ database ]
                 └── semua baris log memakai rid sama → tinggal grep 9f3c1a
```

Caranya: simpan `$request_id` di log, lalu teruskan ke backend dengan `proxy_set_header X-Request-Id $request_id;` (lihat Contoh konfigurasi) — backend tinggal mencetak header yang sama.

---

## stub_status, log rotation, dan metrik

`stub_status` (modul `ngx_http_stub_status_module`) menampilkan hitungan internal Nginx — vital sign-nya:

```text
Active connections: 12 
server accepts handled requests
 512 512 987 
Reading: 1 Writing: 2 Waiting: 9
```

Artinya: `accepts`/`handled` = koneksi diterima/ditangani (selisihnya yang gagal), `requests` = total request (bisa lebih besar karena keepalive), dan `reading`/`writing`/`waiting` = sedang membaca header / menulis response / idle menunggu.

Log tumbuh terus, jadi lakukan **rotasi**: arsipkan log lama lalu suruh Nginx membuka file baru — `mv access.log access.log.1` diikuti `nginx -s reopen` (alias kirim SIGHUP ke master; di server asli biasanya diotomatiskan logrotate).

Angka `stub_status` enak dibaca manusia, tapi Prometheus butuh angka yang bisa di-*scrape*: `[ Nginx stub_status ] ─▶ [ exporter ] ─▶ [ Prometheus ] ─▶ [ Grafana ]`. **Exporter** menerjemahkan data mentah Nginx ke format metrik; alternatifnya hitung dari access log lewat pipeline log. Nginx Plus punya API monitoring bawaan, OSS tidak.

---

## Tabel diagnosis error 400–504

| Kode | Arti | Penyebab umum | Langkah cek |
|------|------|---------------|-------------|
| **400** | Bad Request | Header rusak/kebesaran, request line salah | `curl -v`; cek `error.log` ("too big header") |
| **403** | Forbidden | Permission file, aturan `allow`/`deny`, direktori tanpa index | `ls -l` file; cek `deny`/`satisfy` |
| **404** | Not Found | `root`/`alias` salah, location tidak cocok, file tiada | `nginx -T`; cocokkan URI dengan `location` |
| **499** | Client closed request | Client menutup koneksi sebelum response selesai | Bandingkan `$request_time` vs `$upstream_response_time` |
| **500** | Internal Server Error | Nginx gagal menulis log/cache, permission path runtime | `error.log`; cek hak akses direktori |
| **502** | Bad Gateway | Upstream mati, port salah, response upstream rusak | `curl` langsung ke port backend; cek proses backend |
| **503** | Service Unavailable | Upstream kelebihan beban, `limit_req` menolak | `error.log` ("limiting requests"); cek kapasitas |
| **504** | Gateway Timeout | Upstream terlalu lambat melebihi `proxy_read_timeout` | Cek `$upstream_response_time`; naikkan timeout / perbaiki backend |

---

## Metode troubleshooting: client → Nginx → upstream

Jangan langsung "buka semua log". Telusuri **berurutan dari lapisan yang paling dekat dengan gejala**:

```text
[1] CLIENT                 [2] NGINX                  [3] UPSTREAM
Browser / curl             access.log & error.log     backend langsung
curl -v (status, header)   podman logs + nginx -T     curl langsung ke port backend
```

1. **Reproduksi** — ulangi dengan `curl -v`, catat status code dan header.
2. **Client** — cek URL, DNS, header, jaringan; coba dari jaringan lain.
3. **Nginx** — `error.log` menjelaskan *mengapa*, `access.log` menunjukkan *apa*, `nginx -T` memastikan konfigurasi yang benar-benar aktif.
4. **Upstream** — keluarkan Nginx dari persamaan: `curl` langsung ke port backend. Kalau langsung juga gagal, masalahnya di backend.
5. **Perbaiki satu hal, uji ulang** — jangan ubah lima hal sekaligus.

---

## Contoh konfigurasi

```nginx
# context http — /etc/nginx/nginx.conf atau file include-nya
log_format detailed '$request_id $remote_addr [$time_local] "$request" $status '
                    'rt=$request_time uct=$upstream_connect_time urt=$upstream_response_time';
access_log /var/log/nginx/access.log detailed;
error_log  /var/log/nginx/error.log warn;

server {
    listen 80;
    server_name app.local;

    location /api/ {
        proxy_set_header Host         $host;
        proxy_set_header X-Request-Id $request_id;   # kirim rid ke backend
        proxy_pass http://api_backend;
        access_log /var/log/nginx/api.log detailed;
    }

    location = /nginx_status {
        stub_status;
        allow 10.0.0.0/8;    # sesuaikan dengan jaringan lab
        deny all;
    }
}
```

| Directive / variabel | Context | Arti |
|----------------------|---------|------|
| `log_format` | `http` | Pola baris log — harus ada sebelum dipakai |
| `access_log file format` | `http`/`server`/`location` | Menulis akses dengan format tertentu; `off` = matikan |
| `error_log file level` | `main`/`http`/`server`/`location` | Menulis log error dengan level minimum |
| `stub_status` + `allow`/`deny` | `location` | Counter internal yang hanya boleh dilihat orang dalam |

---

## Lab

Siapkan lab bila belum ada: `podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine`. Lalu pasang log format custom + `stub_status`:

```bash
podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/10-lab.conf' <<'NGINX'
log_format detailed '$request_id $remote_addr [$time_local] "$request" $status rt=$request_time urt=$upstream_response_time';
access_log /var/log/nginx/access.log detailed;

server {
    listen 80;
    server_name localhost;
    location = /nginx_status { stub_status; }
    location / { root /usr/share/nginx/html; index index.html; }
}
NGINX

podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
curl -s http://localhost:8080/nginx_status
curl -s -o /dev/null http://localhost:8080/tidak-ada.html
podman logs --tail 2 nginx-lab
```

**Ekspektasi:** `nginx -t` → `syntax is ok`; `/nginx_status` menampilkan `Active connections`, `server accepts handled requests`, `Reading/Writing/Waiting`; log berakhir dengan baris ber-`rid` berstatus `404`.

Sengaja picu error, satu per satu:

```bash
curl -s -o /dev/null -w '404 -> %{http_code}\n' http://localhost:8080/tidak-ada.html     # file tiada
BIG=$(awk 'BEGIN{for(i=0;i<9000;i++)printf "a"}')
curl -s -o /dev/null -w '400 -> %{http_code}\n' -H "X-Big: $BIG" http://localhost:8080/  # header > 8k

podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/30-proxy.conf' <<'NGINX'
server {
    listen 80;
    server_name api.local;
    location /dead/ { proxy_pass http://127.0.0.1:9999/; }
}
NGINX
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
curl -s -o /dev/null -w '502 -> %{http_code}\n' -H 'Host: api.local' http://localhost:8080/dead/

podman exec -d nginx-lab nc -l -p 9998
podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/40-slow.conf' <<'NGINX'
server {
    listen 80;
    server_name slow.local;
    location / { proxy_read_timeout 2s; proxy_pass http://127.0.0.1:9998/; }
}
NGINX
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
curl -s -o /dev/null -w '504 -> %{http_code}\n' -H 'Host: slow.local' http://localhost:8080/  # ±2 detik

podman exec nginx-lab sh -c 'echo "bukan_directive_ada;" > /etc/nginx/conf.d/99-broken.conf'
podman exec nginx-lab nginx -t        # → failed: unknown directive (JANGAN reload)
podman exec nginx-lab rm /etc/nginx/conf.d/99-broken.conf
podman exec nginx-lab nginx -t        # → syntax is ok
```

**Verifikasi:** keempat kode (`400 404 502 504`) tercetak sesuai urutan, alasannya muncul di `error.log` (`podman logs --tail 20 nginx-lab`). Untuk 403, buat file lalu `chmod 600` agar worker tak bisa membacanya. Jika `nc` tidak ada di image-mu, lewati uji 504 dan ulangi di Pelajaran 18.

---

## Kesalahan umum

- Hanya membaca `access.log` saat mencari penyebab — `error.log` yang menjelaskan *mengapa*.
- Menulis `log_format` di context `server`/`location` → directive itu hanya boleh di `http`.
- Lupa `nginx -t` sebelum `nginx -s reload` → konfigurasi rusak terpakai.
- Membiarkan `debug` menyala di produksi → disk penuh dan I/O meledak.
- Mengira `$upstream_response_time` selalu sama dengan `$request_time` (padahal `-` saat tanpa upstream).
- Menyajikan `/nginx_status` tanpa `allow`/`deny` → info server bocor ke publik.

---

## Rangkuman

- **Access log** = satu baris per request; **error log** = penjelasan kejadian tidak biasa; level produksi aman = `warn`.
- `log_format` hanya di context `http`; variabel inti: `$request`, `$status`, `$request_time`, `$upstream_response_time`, `$remote_addr`, `$request_id`.
- **Request ID** menghubungkan satu request di Nginx, backend, dan database lewat satu `grep`.
- `stub_status` = vital sign Nginx; rotasi log = arsipkan + `nginx -s reopen`; exporter mengubah counter jadi metrik.
- Diagnosis error 400–504 memakai tabel; troubleshooting berurutan **client → Nginx → upstream**, ubah satu hal lalu uji ulang.

---

## Latihan

1. Dari satu request `curl -v` ke `http://localhost:8080/`, tulis **3 baris log** yang paling informatif — sebutkan variabel yang dipakai.
2. Jelaskan beda **502** dan **504** dalam satu kalimat, lalu sebutkan **2 langkah cek** untuk masing-masing.
3. Buat skenario `$request_time` besar tapi `$upstream_response_time` kecil — apa artinya dan kode error apa yang mungkin muncul?

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **access_log** | Log satu baris untuk tiap request yang dilayani. |
| **error_log** | Log kejadian tidak biasa: warning sampai kegagalan. |
| **log level** | Tingkat kerincian error log (`debug` … `emerg`). |
| **log_format** | Pola penulisan baris log, hanya di context `http`. |
| **Request ID** | Nomor unik per request untuk menghubungkan log antar sistem. |
| **stub_status** | Halaman counter internal Nginx (koneksi, request). |
| **Log rotation** | Mengarsipkan log lama + menyuruh Nginx membuka file baru. |
| **Exporter** | Program yang menerjemahkan data Nginx ke format metrik. |

**Lanjut ke [Pelajaran 17 — Best Practices, Modular Config & Deployment →](17-best-practices-deployment.md)**
