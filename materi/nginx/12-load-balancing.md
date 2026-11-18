# Pelajaran 12 — Load Balancing dengan upstream

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 10–11 (reverse proxy, header, timeout), paham `proxy_pass`.

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menulis blok `upstream` dan mengarahkan `proxy_pass` ke sana.
- Membedakan **round-robin**, **least_conn**, **ip_hash**, dan **weighted server**.
- Mengatur **`max_fails` & `fail_timeout`** serta menjelaskan **passive failure detection**.
- Mengaktifkan **upstream keepalive** dengan syarat `proxy_http_version 1.1`.
- Menjelaskan batasan **session persistence** dan kenapa **Nginx OSS tidak punya active health check** — beserta opsi solusinya.

---

## Cerita pembuka: kasir di supermarket

Supermarket punya 5 kasir. Kalau semua orang antri di **satu** kasir sementara 4 menganggur, antrean menggunung padahal kapasitas besar — manajer membagi rata, itu **round-robin**; kalau ada kasir paling sepi, pelanggan dialihkan ke sana, itu **least_conn**. Lalu skenario paling penting: ada kasir yang **sakit tiba-tiba**. Supermarket "OSS" **tidak punya pengawas berkeliling** — pengawas hanya bertindak ketika ada pelanggan **gagal dilayani**. Itulah **passive failure detection**, dan di situ letak kejujuran besar soal Nginx open source.

```text
                    ┌──────────────────────────┐
 client ── HTTP ───▶│  upstream app_backend {  │
                    │    server backend-1;     │──▶ backend-1
                    │    server backend-2;     │──▶ backend-2
                    │    server backend-3;     │──▶ backend-3
                    └──────────────────────────┘
```

---

## Penjelasan inti

### 1. Blok `upstream` dan round-robin (default)

```nginx
upstream app_backend {
    server backend-1:80;
    server backend-2:80;
    server backend-3:80;
}
server {
    listen 80;
    location / { proxy_pass http://app_backend; }   # nama upstream, TANPA path
}
```

- `upstream` didefinisikan di context `http` (di luar `server`); tanpa parameter, algoritmanya **round-robin**: request 1 → backend-1, 2 → backend-2, 3 → backend-3, 4 → backend-1, ...
- `proxy_pass` memakai **nama upstream tanpa URI** supaya URI tidak diubah (Pelajaran 10).
- Nama host di `upstream` di-resolve **saat config di-load/reload** — backend harus sudah ada sebelum `nginx -t`/reload.

### 2. Pilihan algoritma

| Algoritma | Cara memilih | Cocok untuk | Catatan |
|---|---|---|---|
| **Round-robin** (default) | Bergantian satu per satu | Server sebanding | Tanpa kondisi |
| **`least_conn`** | Paling sedikit koneksi aktif | Request berdurasi panjang | Koneksi lama "menahan" bobot |
| **`ip_hash`** | Hash IP klien → backend tetap | Sesi ke server sama | Lihat batasannya |
| **`hash $var`** | Hash variabel bebas (cookie) | Sticky berbasis cookie | Tambah `consistent` |
| **Weighted** | `server ... weight=N;` | Kapasitas mesin beda | Round-robin berbobot |

Contoh: `least_conn;` lalu `server backend-1:80 weight=3; server backend-2:80 weight=2;` — backend-1 menerima 3× porsi, backend-2 2×.

### 3. `max_fails` dan `fail_timeout`

```nginx
server backend-1:80 max_fails=3 fail_timeout=30s;   # mengganti default
server backend-2:80 max_fails=1 fail_timeout=10s;   # nilai default
```

| Parameter | Default | Arti |
|---|---|---|
| `max_fails` | **1** | Jumlah kegagalan (dalam `fail_timeout`) yang cukup menandai server down |
| `fail_timeout` | **10s** | (1) jendela hitung kegagalan, dan (2) **durasi server ditolak** setelah dianggap down |

Setelah `fail_timeout` habis, server **dicoba lagi** — jika berhasil, status normal kembali.

### 4. Passive failure detection (satu-satunya di Nginx OSS)

```text
Request gagal (koneksi ditolak / reset) → kegagalan dicatat pada server itu
   │ gagal ≥ max_fails dalam fail_timeout?
   ├─ ya ──▶ ditandai DOWN selama fail_timeout → request dialihkan
   └─ tidak ▶ server tetap dipakai, kegagalan dihitung
```

Kuncinya: **deteksi hanya terjadi saat ada request yang gagal.** Tanpa request = tanpa pengawasan. Server yang hidup tapi terus membalas 500 dianggap **sehat**, karena Nginx hanya mengukur keberhasilan **koneksi**, bukan kualitas response.

### 5. Session persistence dan batasannya

| Teknik | Kekuatan | Keterbatasan |
|---|---|---|
| `ip_hash` | Tanpa cookie, sederhana | IP berubah (mobile/VPN/NAT), IPv4↔IPv6 beda hash, IP kantor = banyak user menumpuk |
| `hash $cookie_sessionid consistent;` | Akurat per browser | Butuh cookie; klien tanpa cookie jatuh ke hash default |
| Sesi di Redis/DB (di aplikasi) | Paling andal | Butuh dukungan aplikasi — **solusi yang disarankan** |

Batasan fundamental: LB tetap harus siap **memindahkan** klien ketika backend sticky-nya mati — jadi sesi di luar proses backend jauh lebih aman daripada mengandalkan stickiness.

### 6. Upstream keepalive

```nginx
upstream app_backend { server backend-1:80; keepalive 32; }  # idle connection disimpan
server {
    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;          # syarat #1
        proxy_set_header Connection "";  # syarat #2
    }
}
```

Tanpa ketiga syarat itu, tiap request membangun TCP baru ke backend — mahal di bawah beban tinggi.

### 7. Health check: OSS vs Plus vs solusi lain (jujur)

| | **Nginx OSS** (kita pakai) | **Nginx Plus** (berbayar) | **Solusi eksternal** |
|---|---|---|---|
| **Passive check** (gagal saat dipakai) | ✅ `max_fails`/`fail_timeout` | ✅ | — |
| **Active check** (probe berkala) | ❌ **Tidak ada** | ✅ directive `health_check` | Script + reload/API, sidecar, DNS |
| **Endpoint cek khusus** | ❌ | ✅ `match` + `health_check uri` | Buat `/healthz` di aplikasi |

**Kenapa OSS tidak punya active health check?** Karena itu **fitur Nginx Plus** — dokumentasi resmi menempatkan `health_check` di sisi Plus, sementara OSS hanya punya mekanisme pasif dari `ngx_http_upstream_module`. Tidak ada directive `health_check` di OSS; mengarangnya membuat `nginx -t` gagal. Untuk kasus kecil passive detection cukup — asal paham artinya: server sakit baru "terlihat" **setelah ada korban**.

Opsi jujur untuk OSS:

1. **Health check eksternal** — skrip/Kubernetes readiness probe mengecek `/healthz`, lalu menandai server keluar/masuk (DNS, API, atau `nginx -s reload` setelah ubah `upstream`).
2. **Beli Nginx Plus** — active check + API status bawaan.
3. **Pendampingi LB open source ber-check aktif** — HAProxy, Traefik, Envoy — atau andalkan readiness probe Kubernetes.

---

## Contoh konfigurasi

```nginx
upstream app_backend {
    least_conn;                          # pilih backend paling sedikit koneksi
    keepalive 32;
    server backend-1:80 weight=3 max_fails=3 fail_timeout=30s;
    server backend-2:80 weight=2 max_fails=3 fail_timeout=30s;
    server backend-3:80 weight=1;
}
server {
    listen 80;
    server_name app.local;
    location / {
        proxy_pass http://app_backend;    # nama upstream, tanpa URI
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

| Directive | Fungsi |
|---|---|
| `upstream app_backend { ... }` | Kelompok backend untuk `proxy_pass http://app_backend` |
| `least_conn;` / `weight=3` | Algoritma koneksi terendah; backend-1 menerima 3× porsi |
| `keepalive 32;` | Simpan hingga 32 koneksi idle ke backend |
| `max_fails=3 fail_timeout=30s` | 3 gagal dalam 30s → down 30s, lalu dicoba lagi |

---

## Lab

```bash
podman network create lab-net 2>/dev/null || true
for i in 1 2 3; do
  podman run -d --name backend-$i --network lab-net docker.io/library/nginx:alpine
  podman exec backend-$i sh -c "echo 'SALAM DARI backend-$i' > /usr/share/nginx/html/index.html"
done

mkdir -p nginx-lb/conf.d
cat > nginx-lb/conf.d/lb.conf <<'EOF'
upstream app_backend {
    server backend-1:80;
    server backend-2:80;
    server backend-3:80;
}
server {
    listen 80;
    server_name app.local;
    location / { proxy_pass http://app_backend; }
}
EOF

podman run -d --name nginx-lab --network lab-net -p 8080:80 \
  -v "$PWD/nginx-lb/conf.d:/etc/nginx/conf.d:ro" \
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t
```

**1) Amati round-robin** — jalankan 6 kali:

```bash
for i in 1 2 3 4 5 6; do curl -s http://localhost:8080/; done
# ekspektasi berurutan: backend-1, backend-2, backend-3, backend-1, backend-2, backend-3
```

**2) Uji `least_conn`** — tambahkan `least_conn;` di `upstream`, lalu reload tanpa restart container:

```bash
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
# → syntax is ok / test is successful; request tetap terjawab
```

**3) Uji passive failure detection:**

```bash
podman stop backend-2
curl -i http://localhost:8080/ | head -1
# kemungkinan: HTTP/1.1 502 Bad Gateway  ← backend-2 kena sial
podman logs nginx-lab 2>&1 | grep "backend-2" | tail -1
# connect() failed (111: Connection refused) ... upstream: "http://app_backend/"
curl -s http://localhost:8080/          # → backend-2 dianggap down, request dialihkan
podman start backend-2 && sleep 12      # lewati fail_timeout
for i in 1 2 3; do curl -s http://localhost:8080/; done   # → backend-2 melayani lagi
```

Bersihkan: `podman rm -f nginx-lab backend-1 backend-2 backend-3 && podman network rm lab-net`

---

## Kesalahan umum

- **`proxy_pass http://app_backend/;` (ada slash)** — mengubah URI; untuk upstream biarkan tanpa path kecuali sengaja.
- **Menganggap `ip_hash` menjamin sesi selamanya** — IP berubah, NAT shared, dan server down memutus rantai.
- **Mencari directive `health_check` di OSS** — itu fitur Plus; `nginx -t` menolaknya.
- **Berpikir passive check mendeteksi server "sakit tapi hidup"** — hanya kegagalan koneksi yang terukur.
- **Lupa `proxy_http_version 1.1` + `Connection ""`** saat memakai `keepalive` — keepalive tidak pernah aktif.

---

## Rangkuman

- `upstream` mengelompokkan backend; `proxy_pass http://nama_upstream;` mendistribusikan request.
- Default **round-robin**; **`least_conn`** untuk request panjang, **`ip_hash`/`hash`** untuk sticky, **`weight`** untuk kapasitas beda.
- **`max_fails` + `fail_timeout`** = ambang server down dan lama server ditolak.
- **Nginx OSS hanya punya passive detection**; **active health check adalah fitur Plus** — alternatifnya: check eksternal, Nginx Plus, HAProxy/Traefik/Envoy, atau probe platform.
- **`keepalive`** butuh `proxy_http_version 1.1` + `proxy_set_header Connection ""`; **session persistence adalah optimasi, bukan jaminan**.

---

## Latihan

1. Ubah ke `ip_hash`, akses 6 kali, lalu jelaskan apa yang terjadi kalau IP-mu berubah — dan kenapa sesi sebaiknya disimpan di Redis, bukan di memori backend.
2. Beri `weight=5` ke `backend-1`; hitung perkiraan distribusi 60 request, buktikan dengan loop curl dan hitung kemunculan tiap nama.
3. Jelaskan ke temanmu: kenapa server yang **mengembalikan 500 terus-menerus** tetap dianggap sehat oleh Nginx OSS, dan sebutkan **2 solusi** untuk itu.

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **`upstream`** | Blok pengelompok server backend untuk dibebani bersama |
| **Round-robin** | Distribusi bergantian satu per satu (default) |
| **`least_conn`** | Memilih backend dengan koneksi aktif paling sedikit |
| **`ip_hash`** | Sticky sesi berdasarkan hash IP klien |
| **`weight`** | Bobot server untuk distribusi tidak seragam |
| **`max_fails` / `fail_timeout`** | Ambang kegagalan & durasi server ditandai down |
| **Passive health check** | Deteksi gagal hanya saat request nyata gagal (OSS) |
| **Active health check** | Probe berkala tanpa menunggu request (Nginx Plus) |

**Lanjut ke [Pelajaran 13 — HTTPS & TLS →](13-https-tls.md)**
