# Pelajaran 10 — Reverse Proxy Dasar: proxy_pass

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 9 (virtual host), paham `location` dan dasar HTTP.

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan apa itu **reverse proxy** dan kenapa Nginx dipakai di depan aplikasi.
- Menulis `proxy_pass` dengan benar di dalam `location`.
- Memprediksi **URI hasil penggantian** saat trailing slash ada atau tidak ada.
- Membedakan `proxy_pass http://backend;` vs `proxy_pass http://backend/;` lewat tabel contoh.
- Mengatur `proxy_http_version` dan tahu kapan ia penting.

---

## Cerita pembuka: satpam yang meneruskan ke dapur

Kamu menelepon layanan pelanggan: kamu bicara ke **petugas di depan** (satu nomor resmi), dan ia meneruskan pesananmu ke unit yang benar. Kamu tidak pernah tahu nomor internal tiap unit.

Nginx sebagai **reverse proxy** bekerja seperti petugas itu:

| Di layanan pelanggan | Di sistem aplikasi |
|---|---|
| Kamu (penelepon) | Klien / browser |
| Nomor resmi yang dihubungi | Nginx (`http://situs.com`) |
| Petugas yang meneruskan | **Reverse proxy** (`proxy_pass`) |
| Unit internal | **Backend** (`http://127.0.0.1:3000`) |

```text
                       ┌──────────────────────────┐
  client ── HTTP ─────▶│  Nginx (reverse proxy)    │──▶ backend (tidak terekspos)
                       │  location /api/ {         │
                       │    proxy_pass http://…; } │
                       └──────────────────────────┘
```

Bedakan: **forward proxy** mewakili **klien** (VPN kantor); **reverse proxy** mewakili **server** — klien tidak sadar ada backend di baliknya.

---

## Penjelasan inti

### 1. Bentuk dasar

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000;
}
```

Yang jadi misteri (dan sumber bug): **URI apa yang diteruskan ke backend?**

### 2. Aturan resmi penggantian URI (dokumentasi nginx.org)

1. `proxy_pass` **tanpa bagian URI** (`http://backend;`) → request URI diteruskan **apa adanya**.
2. `proxy_pass` **dengan bagian URI** (`http://backend/;`) → bagian URI yang **cocok dengan location diganti** oleh path di `proxy_pass`.

Simpan dua kalimat itu — semua kasus bisa diprediksi.

### 3. Tabel contoh: trailing slash mengubah segalanya

Dengan `location /api/ { ... }` dan backend yang punya endpoint `/users`:

| Request | `proxy_pass http://backend;` | `proxy_pass http://backend/;` |
|---|---|---|
| `GET /api/users` | `/api/users` (apa adanya) | `/users` (`/api/` diganti `/`) |
| `GET /api/` | `/api/` | `/` |
| `GET /api` | `/api` | **301** → `/api/` (otomatis) |
| `GET /` | `/` (tidak match, tidak di-proxy) | `/` (tidak match) |

Sedangkan dengan `location / { proxy_pass http://backend/; }` kedua hasilnya **identik** — bagian yang diganti (`/`) dan penggantinya (`/`) sama.

```text
proxy_pass http://backend;        proxy_pass http://backend/;
────────────────────────          ────────────────────────────
/api/users ───────────▶ /api/users  /api/users ─ ganti /api/ → / ─▶ /users
(dipertahankan)                     (prefix dibuang)
```

### 4. Dua jebakan klasik

- **`location /api` (tanpa slash) + `proxy_pass http://backend/;`** — `/api` bersifat prefix, jadi `/apix` juga match dan jatuh jadi `/x`. Tulis konsisten: `location /api/` + `proxy_pass http://backend/;`.
- **Regex location + `proxy_pass` berpath** — penggantian jadi membingungkan karena regex tak punya "prefix"; dokumentasi menyarankan **named location** (`location @name`) untuk kasus ini.

### 5. `proxy_http_version`: 1.0 vs 1.1

Default Nginx bicara ke backend memakai **HTTP/1.0**:

```nginx
proxy_http_version 1.1;              # syarat keepalive & WebSocket
proxy_set_header Connection "";      # bersihkan hop-by-hop header
```

| | Default (1.0) | `proxy_http_version 1.1` |
|---|---|---|
| Koneksi ke backend | Ditutup tiap response | Bisa **keepalive** |
| Chunked transfer | Tidak | Ya |
| Header `Upgrade` (WebSocket) | Tidak | Didukung |
| Kapan perlu | Request-response sederhana | Keepalive upstream, WebSocket, streaming |

Syarat keepalive: `proxy_http_version 1.1` **dan** `Connection ""` agar `Connection: close` dari klien tidak ikut diteruskan.

---

## Contoh konfigurasi

```nginx
# conf.d/proxy.conf
server {
    listen 80;
    server_name app.local;

    # tanpa trailing slash → URI diteruskan apa adanya
    location /legacy/ {
        proxy_pass http://127.0.0.1:3000;
    }

    # dengan trailing slash → prefix /api/ diganti /
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
    }

    # HTTP/1.1 + header standar (backend modern)
    location /v2/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

| Directive | Fungsi |
|---|---|
| `proxy_pass http://127.0.0.1:3000;` | Teruskan request **tanpa** mengubah URI |
| `proxy_pass http://127.0.0.1:3000/;` | Ganti bagian URI yang cocok dengan location |
| `proxy_http_version 1.1;` | HTTP/1.1 ke backend (syarat keepalive & WebSocket) |
| `proxy_set_header ...` | Kirim header ke backend — tuntas di Pelajaran 11 |

---

## Lab

```bash
podman network create lab-net 2>/dev/null || true

# Backend simulasi: halaman berisi nama container-nya
podman run -d --name api-backend --network lab-net docker.io/library/nginx:alpine
podman exec api-backend sh -c 'echo "SALAM DARI api-backend" > /usr/share/nginx/html/index.html'

mkdir -p nginx-proxy/conf.d
cat > nginx-proxy/conf.d/proxy.conf <<'EOF'
server {
    listen 80;
    server_name app.local;
    location /legacy/ { proxy_pass http://api-backend; }
    location /api/    { proxy_pass http://api-backend/; }
}
EOF

podman run -d --name nginx-lab --network lab-net -p 8080:80 \
  -v "$PWD/nginx-proxy/conf.d:/etc/nginx/conf.d:ro" \
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t
```

Ekspektasi: `test is successful`, dan `api-backend` terresolve (satu jaringan `lab-net`). Verifikasi perbedaan URI:

```bash
curl -i http://localhost:8080/legacy/   # → 200, body "SALAM DARI api-backend"
curl -i http://localhost:8080/api/      # → 200, body sama

# Buktikan URI yang benar-benar diterima backend:
podman logs api-backend 2>&1 | tail -2
# GET /legacy/ HTTP/1.1   ← dipertahankan (tanpa slash)
# GET / HTTP/1.1          ← /api/ sudah diganti (dengan slash)

curl -i http://localhost:8080/api | head -1    # → 301 Moved Temporarily
curl -i http://localhost:8080/tidak-ada | head -1  # → 404 Not Found (Nginx sendiri)

podman rm -f nginx-lab api-backend && podman network rm lab-net
```

---

## Kesalahan umum

- **Lupa trailing slash** → URI utuh dikirim ke backend yang tidak punya path itu → 404; cek `podman logs backend` untuk melihat URI asli.
- **`location /api` + `proxy_pass http://backend/;`** memakan path tak terduga (`/apix` → `/x`).
- **Menganggap `proxy_pass` me-resolve per request** — untuk host statis Nginx resolve **saat load/reload**, jadi backend harus sudah ada sebelum reload.
- **Masih HTTP/1.0** saat butuh keepalive atau WebSocket — set `proxy_http_version 1.1`.
- **Request jatuh ke default server** (pelajaran 9) lalu mengira proxy rusak — cocokkan Host header saat menguji.

---

## Rangkuman

- **Reverse proxy** mewakili server di depan klien; `proxy_pass` menentukan ke mana request diteruskan.
- **Aturan URI:** tanpa path → apa adanya; dengan path → bagian yang cocok dengan location **diganti**.
- Trailing slash adalah pembeda `http://backend;` vs `http://backend/;` — dampaknya bisa 404 atau path salah.
- Prefix konsisten (`location /api/` + slash di `proxy_pass`) menghindari penggantian tak terduga.
- `proxy_http_version` default **1.0**; naikkan ke **1.1** untuk keepalive, chunked, atau WebSocket.

---

## Latihan

1. Dengan `location /news/ { proxy_pass http://backend/articles; }`, prediksi URI untuk `GET /news/2026` lalu buktikan dengan log backend.
2. Tambahkan `location /static/` yang di-proxy **tanpa** slash; tabelkan perbedaan perilakunya dibanding `location /api/`.
3. Jelaskan kenapa `curl -i http://localhost:8080/api` menjawab 301, bukan 404 — kapan Nginx melakukan ini?

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **Reverse proxy** | Server perantara yang mewakili server belakang di depan klien |
| **`proxy_pass`** | Directive Nginx untuk meneruskan request ke backend |
| **Trailing slash** | Garis miring di akhir path, menentukan apakah URI diganti |
| **URI replacement** | Penggantian bagian URI request oleh path di `proxy_pass` |
| **Backend / upstream** | Server yang diproses di balik Nginx |
| **`proxy_http_version`** | Versi HTTP Nginx ke backend (default 1.0) |

**Lanjut ke [Pelajaran 11 — Reverse Proxy Lanjutan →](11-reverse-proxy-lanjutan.md)**
