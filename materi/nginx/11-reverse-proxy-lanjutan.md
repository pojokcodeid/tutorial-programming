# Pelajaran 11 — Reverse Proxy Lanjutan: Header, Timeout & WebSocket

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 10 (`proxy_pass`, trailing slash, `proxy_http_version`).

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Meneruskan header penting: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.
- Mengatur ketiga timeout proxy dan tahu dampaknya.
- Mengaktifkan buffering (dan kapan mematikannya).
- Meneruskan **WebSocket** lewat `Upgrade`/`Connection`.
- Membatasi ukuran upload dan **mendiagnosis 502 vs 504**.

---

## Cerita pembuka: kurir yang lupa menempel label

Kirim paket lewat kurir. Kalau **alamat pengirim lengkap**, penerima tahu siapa pengirimnya dan bisa membalas; kalau label hilang, balasan bisa nyasar. Begitu juga request yang diteruskan Nginx — tanpa label yang tepat, aplikasi belakang salah tahu domain asli, IP klien (yang terlihat cuma IP container Nginx), dan skema `http`/`https`. Label-label itu adalah **header forwarding**, dan pelajaran ini juga membahas tiga hal yang membuat proxy layak dipakai produksi: timeout, buffering, dan WebSocket.

---

## Penjelasan inti

### 1. Header yang wajib diteruskan

| Header | Dibuat dari | Kenapa backend butuh |
|---|---|---|
| `Host` | `$host` | Aplikasi tahu domain asli (generasi URL) |
| `X-Real-IP` | `$remote_addr` | IP klien asli (1 hop) |
| `X-Forwarded-For` | `$proxy_add_x_forwarded_for` | Rantai IP klien → Nginx → backend |
| `X-Forwarded-Proto` | `$scheme` | Skema asli `http`/`https` untuk redirect & cookie |

```text
browser ── Host: app.local ─────▶ ┌─────────┐ ── Host: app.local ───────▶ backend
          X-Real-IP: 10.1.2.3    │  Nginx  │ ── X-Real-IP: 10.1.2.3 ──▶ backend
                                 └─────────┘ ── X-Forwarded-Proto: https ▶ backend
```

> **Aturan warisan:** `proxy_set_header` di satu level diwarisi dari level atas **hanya jika** level itu **tidak punya** `proxy_set_header` sama sekali. Menambah satu di `location` membatalkan seluruh set dari `server` — tulis ulang semuanya atau pakai `include` snippet.

### 2. Tiga timeout proxy

| Directive | Default | Menghitung waktu... |
|---|---|---|
| `proxy_connect_timeout` | 60s | Membuka **koneksi TCP** ke backend |
| `proxy_read_timeout` | 60s | Menunggu **response** dari backend |
| `proxy_send_timeout` | 60s | Mengirim **request** ke backend |

Paling sering menyiksa di produksi: `proxy_read_timeout` — koneksi terbuka, tapi backend belum selesai memproses.

### 3. Buffering request & response

| Directive | Default | Fungsi |
|---|---|---|
| `proxy_buffering on` | on | Tampung response ke buffer dulu → backend cepat bebas, RAM terpakai |
| `proxy_request_buffering on` | on | Baca **body** (mis. upload) dulu sebelum diteruskan |
| `proxy_buffers` | 8 4k/8k | Jumlah & ukuran buffer response |

Matikan `proxy_buffering` untuk **streaming/SSE** yang harus mengalir per-event; matikan `proxy_request_buffering` kalau backend ingin menerima upload streaming.

### 4. WebSocket: upgrade koneksi

WebSocket butuh `Upgrade: websocket` diteruskan — dan HTTP/1.0 default tidak mengenalnya, jadi `proxy_http_version 1.1` wajib:

```nginx
location /ws/ {
    proxy_pass http://backend/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;   # koneksi ws bisa hidup sangat lama
}
```

Untuk location yang melayani HTTP **dan** WS, ganti baris `Connection` dengan variabel hasil `map` agar `Connection` hanya `upgrade` saat klien benar-benar meminta: `map $http_upgrade $connection_upgrade { default upgrade; '' close; }` lalu `proxy_set_header Connection $connection_upgrade;`.

### 5. Upload: `client_max_body_size`

Default hanya **1 MB**; dilanggar → Nginx menjawab **413 Request Entity Too Large** sebelum body diteruskan. Naikkan hanya di location yang memang menerima file besar (mis. `client_max_body_size 50m;`), jangan global tanpa perhitungan.

### 6. Diagnosis: 502 vs 504

| | **502 Bad Gateway** | **504 Gateway Timeout** |
|---|---|---|
| **Arti** | Nginx **tidak bisa dapat jawaban** dari backend | Backend **terlalu lama** menjawab |
| **Penyebab umum** | Backend **mati**, port **salah**, app crash, koneksi ditolak/reset | Backend **lambat/nyangkut**, query lambat, timeout terlalu kecil |
| **Pesan `error.log`** | `connect() failed (111: Connection refused)` | `upstream timed out (110: Connection timed out)` |
| **Timeout terkait** | `proxy_connect_timeout` | `proxy_read_timeout` |
| **Solusi** | Perbaiki aplikasi/port/network | Optimasi proses, naikkan timeout, atau terima batasnya |

---

## Contoh konfigurasi

```nginx
# snippets/proxy-headers.conf — dipakai ulang tiap location
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

server {
    listen 80;
    server_name app.local;
    client_max_body_size 50m;          # izinkan upload s/d 50MB

    # API: header lengkap + timeout wajar
    location /api/ {
        include snippets/proxy-headers.conf;
        proxy_pass http://api-backend/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_connect_timeout 5s;
        proxy_read_timeout    30s;
    }

    # WebSocket: upgrade + timeout panjang
    location /ws/ {
        include snippets/proxy-headers.conf;
        proxy_pass http://api-backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
```

| Directive | Penjelasan singkat |
|---|---|
| `Host $host` | Domain asli tanpa port |
| `X-Real-IP $remote_addr` | IP klien asli (single-hop) |
| `X-Forwarded-For $proxy_add_x_forwarded_for` | Tambah IP klien ke rantai yang sudah ada |
| `X-Forwarded-Proto $scheme` | Skema asli (`http`/`https`) |
| `proxy_read_timeout 30s` | Tak ada data 30s → **504** |
| `Connection ""` | Bersihkan `Connection` agar keepalive upstream jalan |

---

## Lab

```bash
podman network create lab-net 2>/dev/null || true

# Backend normal + endpoint pemantul header
podman run -d --name api-backend --network lab-net docker.io/library/nginx:alpine
podman exec api-backend sh -c 'printf "server { listen 80; location /headers/ { return 200 \"host=$host|xri=$http_x_real_ip|xfp=$http_x_forwarded_proto\\n\"; } }\n" > /etc/nginx/conf.d/h.conf; echo SALAM > /usr/share/nginx/html/index.html; nginx -s reload'

# Backend lambat: terima koneksi, tahan response 1 jam
podman run -d --name slow-backend --network lab-net docker.io/library/node:alpine \
  node -e "require('http').createServer((q,s)=>setTimeout(()=>s.end('late'),3600000)).listen(80)"

mkdir -p nginx-adv/snippets nginx-adv/conf.d
cat > nginx-adv/snippets/proxy-headers.conf <<'EOF'
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF
cat > nginx-adv/conf.d/proxy.conf <<'EOF'
server {
    listen 80;
    server_name app.local;
    client_max_body_size 50m;
    location /api/ {
        include /etc/nginx/snippets/proxy-headers.conf;
        proxy_pass http://api-backend/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 10s;
    }
    location /slow/ {
        proxy_pass http://slow-backend/;
        proxy_read_timeout 3s;
    }
}
EOF

podman run -d --name nginx-lab --network lab-net -p 8080:80 \
  -v "$PWD/nginx-adv/conf.d:/etc/nginx/conf.d:ro" \
  -v "$PWD/nginx-adv/snippets:/etc/nginx/snippets:ro" \
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t
```

**1) Bukti header diteruskan:**

```bash
curl -s -H 'Host: app.local' http://localhost:8080/api/headers/
# → host=app.local|xri=10.88.0.1|xfp=http
```

**2) Bukti 504** (backend lambat, timeout 3s):

```bash
time curl -i http://localhost:8080/slow/     # → HTTP/1.1 504, setelah ± 3 detik
podman logs nginx-lab 2>&1 | grep -i "timed out"
# upstream timed out ... while reading response header from upstream
```

**3) Bukti 502** (backend mati):

```bash
podman stop api-backend
curl -i http://localhost:8080/api/           # → HTTP/1.1 502 Bad Gateway
podman logs nginx-lab 2>&1 | grep -i refused
# connect() failed (111: Connection refused) ... upstream: "http://api-backend/"
```

**4) Bukti 413** (upload melebihi batas):

```bash
dd if=/dev/zero of=/tmp/besar.bin bs=1m count=60
curl -i -X POST --data-binary @/tmp/besar.bin http://localhost:8080/api/upload
# → HTTP/1.1 413 Request Entity Too Large
```

Bersihkan: `podman rm -f nginx-lab api-backend slow-backend && podman network rm lab-net`

---

## Kesalahan umum

- **Menambah satu `proxy_set_header` lalu semua header atas hilang** — aturan inheritance membatalkan seluruh set dari level atas.
- **Menganggap `X-Forwarded-For` identitas terpercaya** — header itu bisa dipalsukan klien.
- **Timeout default 60s tidak disesuaikan** — terlalu kecil untuk proses panjang, terlalu besar untuk menyembunyikan masalah.
- **WebSocket gagal (400/426)** karena `Upgrade` tidak diteruskan atau masih HTTP/1.0.
- **Upload 413** — `client_max_body_size` default cuma **1 MB**.
- **Salah diagnosis 502 vs 504** — menaikkan timeout tidak menyelesaikan 502; memperbaiki port tidak menyelesaikan 504.

---

## Rangkuman

- Teruskan **Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto** agar aplikasi tahu konteks asli request.
- `proxy_set_header` **menggantikan** warisan level atas — satu set di level bawah membatalkan yang atas.
- Tiga timeout: **connect** (koneksi TCP), **read** (menunggu response), **send** (mengirim request); **buffering** menstabilkan — matikan untuk streaming/SSE.
- WebSocket butuh `proxy_http_version 1.1` + `Upgrade`/`Connection` + timeout panjang.
- `client_max_body_size` default **1m** → dilanggar = **413**.
- **502 = backend tak terhubungi; 504 = backend terlalu lambat** — buktikan lewat `error.log`.

---

## Latihan

1. Pindahkan semua `proxy_set_header` ke context `server`, lalu tambahkan satu `proxy_set_header Connection "";` di `location /api/` — buktikan `X-Real-IP` **hilang** di backend dan jelaskan kenapa.
2. Ubah `proxy_read_timeout` ke `1s`, jalankan `time curl /slow/`, lalu bandingkan pesan log dengan kasus backend dimatikan (502).
3. Tulis konfigurasi satu-location untuk HTTP biasa sekaligus WS memakai `map $http_upgrade $connection_upgrade` — jelaskan isi `Connection` untuk klien biasa vs klien WS.

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **`X-Forwarded-For`** | Rantai IP klien melewati proxy |
| **`X-Forwarded-Proto`** | Skema asli request (`http`/`https`) |
| **`X-Real-IP`** | IP klien asli, versi satu-hop |
| **`proxy_read_timeout`** | Batas waktu Nginx menunggu data dari backend |
| **`client_max_body_size`** | Batas ukuran request body; default 1 MB |
| **Buffering** | Menampung data di memori sebelum diteruskan |
| **WebSocket upgrade** | Mengubah koneksi HTTP menjadi WebSocket |
| **502 / 504** | 502 = backend tak terhubung; 504 = backend terlalu lambat |

**Lanjut ke [Pelajaran 12 — Load Balancing dengan upstream →](12-load-balancing.md)**
