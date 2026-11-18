# 🧪 nginx-lab — Lab Nginx: Gateway Aplikasi Lengkap

Lab bersama untuk seluruh [bab materi Nginx](../../materi/nginx/README.md): satu container Nginx yang berperan sebagai **gateway** (static site + reverse proxy + load balancer + TLS) di depan **3 backend** Nginx kecil.

> ⚠️ **Ini lab belajar, bukan produksi.** Sertifikat self-signed, port non-standar (8080/8081/8443), rate limit longgar, dan tanpa hardening tambahan — jangan pernah dipakai apa adanya di server sungguhan.

**Tujuan lab:**

- Melihat modular config nyata: `nginx.conf` tipis + `include conf.d/*.conf` + `snippets/`.
- Membuktikan routing (`location`), virtual host (Host header), reverse proxy, dan load balancing 3 backend.
- Menguji TLS, redirect HTTP→HTTPS, cache aset, rate limit, dan security headers.
- Memicu serta menganalisis error **404 / 413 / 502 / 504** dengan sengaja.
- Berlatih **graceful reload** (`nginx -t` → `nginx -s reload`) tanpa memutus trafik.

## Prasyarat

| Alat | Untuk apa | Cek |
|------|-----------|-----|
| **Podman** (+ `podman compose`) | Menjalankan container | `podman --version` |
| **curl** | Semua uji HTTP/HTTPS | `curl --version` |
| **openssl** | Membuat sertifikat lab | `openssl version` |

## Menjalankan lab

```bash
cd examples/nginx-lab

# 1. Buat sertifikat self-signed (SAN: localhost, app.local, api.local, docs.local, 127.0.0.1)
bash scripts/gen-certs.sh

# 2. Nyalakan gateway + 3 backend
podman compose up -d

# 3. Uji cepat
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/          # -> 200
curl -s http://localhost:8080/api/                                        # -> halaman backend-N
```

Uji otomatis lengkap (keduanya menghitung PASS/FAIL per pemeriksaan):

```bash
bash scripts/test-routing.sh   # routing, vhost, redirect, TLS, SAN
bash scripts/test-proxy.sh     # proxy, header, LB, 413, 502/504, rate limit
```

**Ekspektasi:** kedua skrip menutup dengan `TOTAL: PASS=n FAIL=0` dan exit code 0.

## Troubleshooting

### `Error: statfs .../examples/nginx-lab/...: no such file or directory`

`podman compose up -d` gagal dengan pesan `statfs ... no such file atau directory` **walau file jelas ada**.

**Penyebab:** folder lab berada di path yang tidak dibagikan ke VM Podman. Secara default `podman machine` hanya membagikan `/Users`, `/private`, `/var/folders`, dan `/etc/containers` (lihat `podman machine init --help` bagian `--volume`). Drive eksternal di `/Volumes/...` biasanya tidak termasuk, jadi kontainer tidak bisa melihatnya.

**Solusi cepat (disarankan):** jalankan lab dari folder bersama:

```bash
cp -R examples/nginx-lab ~/nginx-lab
cd ~/nginx-lab
bash scripts/gen-certs.sh && podman compose up -d
```

**Solusi permanen:** buat ulang Podman machine sambil menambahkan path repo.

```bash
podman machine stop && podman machine rm   # HATI-HATI: menghapus semua container lama
podman machine init -v /Volumes/Asep:/Volumes/Asep
```

## Struktur

```text
nginx-lab/
├── compose.yaml              # nginx-lab + backend-1/2/3 (nginx:alpine)
├── nginx/
│   ├── nginx.conf            # main+http: log_format main, zone gw_rate, gzip, include
│   ├── conf.d/
│   │   ├── app.conf          # app.local :8080 (default), :8443 (TLS), :8081 (redirect)
│   │   └── api.conf          # upstream app_backend + api.local + docs.local
│   └── snippets/
│       ├── proxy-headers.conf     # Host/X-Real-IP/X-Forwarded-*, timeout
│       ├── proxy-routes.conf      # location /api/ dan /app/ (+ limit_req, 1m)
│       └── security-headers.conf  # nosniff, X-Frame-Options, Referrer-Policy, CSP
├── backends/backend.conf     # konfigurasi bersama 3 backend (+ endpoint /headers/)
├── web/                      # website statis (index.html, assets/, docs/)
├── certs/                    # diisi gen-certs.sh — key TIDAK masuk Git
└── scripts/                  # gen-certs.sh, test-routing.sh, test-proxy.sh
```

## Tabel rute

Semua server di bawah listen di **:8080** kecuali disebut lain; pemisahan utama lewat `server_name` (Host header).

| Path / port | server_name | Ditangani oleh | Hasil |
|---|---|---|---|
| `/` | `app.local` (default_server) | `app.conf` — `root web/`, SPA fallback `try_files` | 200 halaman utama |
| `/docs/` | `app.local` | `app.conf` — `alias /usr/share/nginx/html/docs/` | 200 halaman Dokumentasi |
| `/private`, `/private/...` | `app.local` | `location ^~ /private` → `return 403` | **403** |
| `/assets/*.css/js/...` | `app.local` | regex location → `expires 30d` + security headers | 200 + `Cache-Control: max-age=2592000` |
| `/api/` | `app.local`, `api.local` | snippet `proxy-routes.conf` → `proxy_pass http://app_backend/` | 200 dari backend-1/2/3 |
| `/app/` | `app.local`, `api.local` | snippet `proxy-routes.conf` (upstream sama) | 200 dari backend-1/2/3 |
| `/headers/` (via `/api/headers/`) | — | `backends/backend.conf` | 200 teks header yang diteruskan gateway |
| `/slow/` | `app.local` | proxy ke `127.0.0.1:9090`, `proxy_read_timeout 2s` | **502** / **504** |
| `/` (path SPA, mis. `/halaman/tentang`) | `app.local` | `try_files $uri $uri/ /index.html` | 200 = isi index.html |
| `app.local` di **:8081** | `app.local` | `return 301 https://localhost:8443$request_uri` | **301** redirect |
| `app.local` di **:8443** | `app.local` | `listen 8443 ssl` + HSTS | 200 via HTTPS |
| `/` tanpa Host cocok | (jatuh ke default) | `listen 8080 default_server` | 200 halaman app.local |
| Host `api.local` + path lain | `api.local` | `location /` → `return 200 "api.local - ..."` | teks virtual host API |
| Host `docs.local` | `docs.local` | `root .../html/docs`, `try_files ... =404` | 200 Dokumentasi (404 bila file tak ada) |

## Uji virtual host (Host header)

```bash
curl -s -H 'Host: app.local' http://localhost:8080/            # halaman "nginx-lab — Gateway Aplikasi"
curl -s -H 'Host: api.local' http://localhost:8080/            # "api.local - virtual host API pada port 8080"
curl -s -H 'Host: docs.local' http://localhost:8080/           # halaman "Dokumentasi nginx-lab"
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: api.local' \
     http://localhost:8080/api/                                # 200 — /api/ tetap lewat proxy
```

**Ekspektasi:** tiap balasan berbeda sesuai `server_name` — bukti satu port melayani tiga virtual host.

## Uji load balancing

```bash
# Round-robin: ulangi sampai isi body berganti antar backend
for i in $(seq 1 12); do
  curl -s http://localhost:8080/api/ | grep -o 'backend-[0-9]' | head -1
done

# Buktikan lewat akses log tiap backend (tercetak stdout container)
podman logs --tail 3 backend-1
podman logs --tail 3 backend-2
podman logs --tail 3 backend-3
```

**Ekspektasi:** loop mencetak lebih dari satu nilai berbeda (`backend-1`, `backend-2`, `backend-3` bergiliran), dan `podman logs` tiap backend menunjukkan baris `GET /` — permintaan memang dibagi. Skenario gagal (backend mati tetap 200, semua mati → 502) sudah otomatis diuji `scripts/test-proxy.sh`.

## Uji TLS

```bash
curl -k https://localhost:8443/                              # abaikan self-signed -> 200
curl -s -D - -o /dev/null -k https://localhost:8443/ | grep -i strict-transport-security   # HSTS ada

# Sertifikat dipercaya tanpa -k (SAN mencakup 127.0.0.1)
curl -s --cacert certs/server.crt https://127.0.0.1:8443/     # -> 200

# Redirect: 8081 -> HTTPS, path dipertahankan
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:8081/redirect/x
```

**Ekspektasi:** `200` untuk dua URL HTTPS pertama; baris `Location` HSTS muncul; redirect mencetak `301 https://localhost:8443/redirect/x`.

## Uji error 404 / 502 / 504

```bash
# 404 — path berekstensi yang tidak ada (path halaman ditutupi SPA fallback!)
curl -s -o /dev/null -w '404 -> %{http_code}\n' http://localhost:8080/assets/hilang.css

# 502 — /slow/ memproxy ke 127.0.0.1:9090 yang tidak punya listener
curl -s -o /dev/null -w '502 -> %{http_code}\n' http://localhost:8080/slow/

# 504 — listener menerima koneksi tapi tidak pernah menjawab (timeout 2 detik)
podman exec -d nginx-lab sh -c 'sleep 60 | nc -l -p 9090'
curl -s -o /dev/null -w '504 -> %{http_code}\n' http://localhost:8080/slow/
podman exec nginx-lab sh -c 'pkill -f "nc -l -p 9090"' || true

# Bonus: semua backend mati -> /api/ 502 atau 504, nyalakan lagi -> 200
podman stop backend-1 backend-2 backend-3
curl -s -o /dev/null -w 'upstream mati -> %{http_code}\n' http://localhost:8080/api/
podman start backend-1 backend-2 backend-3
```

**Ekspektasi:** tercetak `404 -> 404`, `502 -> 502`, `504 -> 504`, lalu `upstream mati -> 502` atau `-> 504` — keduanya menandakan upstream tidak tersedia; **502** = koneksi ditolak (refused), **504** = koneksi timeout. Di lab Podman IP backend yang berhenti cenderung menjawab timeout, jadi 504 lebih sering muncul di skenario terakhir. Penyebabnya bisa dibaca di `podman logs --tail 20 nginx-lab`. Setelah menyalakan backend kembali, jalankan reload (bagian berikut) agar upstream di-resolve ulang bila diperlukan.

## Reload aman (graceful)

Selalu **validasi dulu, baru muat** — konfigurasi rusak akan ditolak tanpa menyentuh trafik:

```bash
podman exec nginx-lab nginx -t
# -> syntax is ok / test is successful (bila gagal: JANGAN reload, perbaiki dulu)

podman exec nginx-lab nginx -s reload
```

**Ekspektasi:** `nginx -t` sukses, reload tanpa pesan error, dan request yang sedang berjalan tidak terputus. Buktikan dengan menjalankan loop `curl` di latar belakang saat reload (lihat [Pelajaran 17](../../materi/nginx/17-best-practices-deployment.md)).

> Catatan: nama host `backend-1/2/3` di-resolve **saat konfigurasi dimuat**, jadi backend harus sudah berjalan sebelum `nginx -t`/reload.

## Membersihkan

```bash
podman compose down          # hapus 4 container lab
```

Berkas kerja (`web/`, `nginx/`, `scripts/`) tetap ada — cukup `podman compose up -d` untuk memulai lagi. Sertifikat di `certs/` boleh dibuat ulang kapan pun dengan `bash scripts/gen-certs.sh`.

## Materi pendukung

Panduan konsep, lab per tahap, dan kuis: **[Bab: Nginx dari 0 sampai Mahir](../../materi/nginx/README.md)** — lab ini dipakai dari [Pelajaran 1](../../materi/nginx/01-apa-itu-nginx.md) sampai [Pelajaran 18 (Capstone)](../../materi/nginx/18-capstone-gateway-nginx.md).
