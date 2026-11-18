# Pelajaran 18 — Capstone: Nginx sebagai Gateway Aplikasi

> **Durasi:** ± 30–45 menit (proyek akhir)
> **Prasyarat:** Pelajaran 1–17 selesai dipahami, dan lab [`examples/nginx-lab/`](../../examples/nginx-lab/) bisa dijalankan

---

## Tujuan belajar

- Menjalankan seluruh lab capstone dari nol: sertifikat → container → uji → reload.
- Menjelaskan **alur request** dari client ke Nginx ke backend dengan bahasa sendiri.
- Menentukan `location` mana yang terpilih untuk URI tertentu, dan membuktikannya lewat curl.
- Memicu serta menganalisis error **404, 502, dan 504** secara sistematis.
- Menjelaskan alasan setiap directive penting dalam konfigurasi gateway.
- Menyusun konfigurasi yang aman, terdokumentasi, dan bisa di-reload tanpa downtime.

---

## Cerita pembuka: pemeriksaan akhir di gedung baru

Setelah bangunan selesai, ada satu hari khusus: **serah terima**. Inspektor datang bukan untuk membangun ulang, tapi untuk memastikan setiap ruang berfungsi sesuai denah — air mengalir, pintu darurat terbuka, lampu menyala di semua lantai. Denahnya sudah ada; hari ini kamu jadi inspektornya.

> **Capstone = hari serah terima.** Tidak ada konsep baru. Yang diuji adalah apakah kamu bisa **menjalankan, membuktikan, dan menjelaskan** gateway yang sudah kamu susun dari pelajaran pertama. Kalau kamu bisa menceritakan alur satu request dari `curl` sampai `backend-2` dan kembali, kamu lulus.

---

## Arsitektur lab

Seluruh capstone memakai lab bersama di [`examples/nginx-lab/`](../../examples/nginx-lab/) — konfigurasi nyatanya bisa kamu baca langsung di repo:

```text
Client (curl/browser)
  |
  +-- HTTP  :8080   (gateway utama, default_server app.local)
  +-- HTTP  :8081   (hanya redirect 301 -> HTTPS)
  +-- HTTPS :8443   (gateway TLS, sertifikat self-signed)
        |
    [ Nginx  nginx-lab ]  <-- limit_req, security header, log format custom
        |
        +-- /        -> static website (web/index.html, SPA fallback)
        +-- /docs/   -> dokumentasi via alias
        +-- /private -> 403 (diblokir)
        +-- /api/    -> upstream app_backend (round-robin)
        +-- /app/    -> upstream app_backend (round-robin)
        +-- /slow/   -> latihan error 502/504
                        |
                  Podman network
                        |
              +---------+---------+
              |         |         |
          backend-1  backend-2  backend-3
```

Tiga `server_name` dipisah lewat **Host header**: `app.local`, `api.local`, `docs.local` — semuanya listen di port `8080`.

## Struktur project

```text
examples/nginx-lab/
├── compose.yaml              # 4 service: nginx-lab + 3 backend (nginx:alpine)
├── README.md                 # panduan menjalankan lab
├── nginx/
│   ├── nginx.conf            # main+http: log format, zone rate limit, include
│   ├── conf.d/
│   │   ├── app.conf          # vhost app.local (8080/8443) + redirect 8081
│   │   └── api.conf          # upstream app_backend + vhost api.local/docs.local
│   └── snippets/
│       ├── proxy-headers.conf     # header & timeout proxy
│       ├── proxy-routes.conf      # location /api/ dan /app/
│       └── security-headers.conf  # nosniff, X-Frame-Options, CSP, dst.
├── backends/                 # backend.conf bersama + index.html tiap backend
├── web/                      # website statis + assets/ + docs/
├── certs/                    # diisi gen-certs.sh (key tidak masuk Git)
└── scripts/
    ├── gen-certs.sh          # sertifikat self-signed ber-SAN
    ├── test-routing.sh       # uji routing, vhost, redirect, TLS (PASS/FAIL)
    └── test-proxy.sh         # uji proxy, LB, 413, 502/504, rate limit
```

## Langkah pengerjaan (dari nol)

1. **Pahami dasarnya** — baca ulang [Pelajaran 1 — Apa Itu Nginx?](01-apa-itu-nginx.md) dan [Pelajaran 2 — Arsitektur & Lifecycle](02-arsitektur-dan-lifecycle.md): apa peran master/worker dalam satu gateway.
2. **Tinjau struktur konfigurasi** — [Pelajaran 3 — Struktur Konfigurasi](03-struktur-konfigurasi.md) dan [Pelajaran 4 — Mengelola Konfigurasi](04-mengelola-konfigurasi.md): pastikan kamu hafal context `main/events/http` dan urutan `nginx -t` → `nginx -s reload`.
3. **Baca kerangka lab** — buka `nginx/nginx.conf`, cocokkan dengan [Pelajaran 5 — Static Web Server](05-static-web-server.md): kenapa `root` ada di `server` bukan di `http`.
4. **Telusuri routing statis** — `location ^~ /private`, `location /docs/` (alias), dan SPA fallback `try_files` dari [Pelajaran 6 — File, 403/404 & SPA](06-file-403-404-dan-spa.md) serta [Pelajaran 7 — Location Matching](07-location-matching.md).
5. **Cek redirect** — blok `:8081` memakai `return 301` dari [Pelajaran 8 — Rewrite, Redirect & error_page](08-rewrite-redirect-error-page.md).
6. **Petakan virtual host** — `nginx/conf.d/*.conf` berisi tiga `server_name` di port yang sama; hubungkan dengan [Pelajaran 9 — Virtual Host](09-virtual-host.md).
7. **Bedah reverse proxy** — baca `snippets/proxy-routes.conf` dan `proxy-headers.conf`; tautan ke [Pelajaran 10 — Reverse Proxy Dasar](10-reverse-proxy-dasar.md) dan [Pelajaran 11 — Reverse Proxy Lanjutan](11-reverse-proxy-lanjutan.md): kenapa `proxy_pass` diakhiri slash.
8. **Jelaskan load balancing** — blok `upstream app_backend` di `api.conf` memakai round-robin, topik [Pelajaran 12 — Load Balancing](12-load-balancing.md).
9. **Aktifkan TLS** — jalankan `scripts/gen-certs.sh`, cocokkan dengan `ssl_certificate` di app.conf dan [Pelajaran 13 — HTTPS & TLS](13-https-tls.md).
10. **Periksa cache & performa** — `expires 30d`, `gzip`, `sendfile` dari [Pelajaran 14 — Caching & Performance](14-caching-dan-performance.md).
11. **Audit keamanan** — `server_tokens off`, `limit_req zone=gw_rate`, snippet security headers; rujukan [Pelajaran 15 — Security Hardening](15-security-hardening.md).
12. **Siapkan log & analisis** — `log_format main` dengan `rt=`/`urt=` dari [Pelajaran 16 — Logging & Troubleshooting](16-logging-troubleshooting.md); log dibaca lewat `podman logs nginx-lab`.
13. **Terapkan best practices** — konvensi penamaan, snippet, graceful reload dari [Pelajaran 17 — Best Practices & Deployment](17-best-practices-deployment.md).
14. **Jalankan seluruh uji** — `scripts/gen-certs.sh`, `podman compose up -d`, lalu `scripts/test-routing.sh` dan `scripts/test-proxy.sh`.
15. **Uji error & reload** — skenario 404/502/504 dan graceful reload di bagian Lab bawah.
16. **Dokumentasikan** — tulis catatan alur request dan alasan tiap directive (lihat `README.md` lab dan bagian kriteria kelulusan).

## Checklist persyaratan capstone

- [ ] Static website terlayani dari `web/` lewat `root`.
- [ ] Minimal 3 virtual host/rute jelas: `app.local`, `api.local`, `docs.local`.
- [ ] URL routing dengan `location` (`^~`, prefix, regex aset).
- [ ] Reverse proxy `/api/` dan `/app/` ke upstream.
- [ ] Load balancing 3 backend (round-robin `app_backend`).
- [ ] HTTPS `:8443` + redirect `:8081` → HTTPS.
- [ ] Cache aset statis (`expires 30d`) + gzip.
- [ ] Rate limiting (`limit_req zone=gw_rate burst=20 nodelay`).
- [ ] Security headers (snippet `security-headers.conf` + HSTS).
- [ ] Custom access log (`log_format main` dengan `rt`/`urt`).
- [ ] Uji error 404, 502, dan 504 terbukti.
- [ ] Graceful reload terbukti saat trafik berjalan.
- [ ] Dokumentasi konfigurasi & troubleshooting (README + komentar tiap file).

## Kriteria kelulusan

Capstone selesai bila kamu mampu: **(1)** menjalankan seluruh lab dari repository; **(2)** menjelaskan alur request; **(3)** menentukan location yang terpilih; **(4)** membuktikan reverse proxy dan load balancing; **(5)** menguji TLS dan cache; **(6)** memicu serta menganalisis error; **(7)** menjelaskan alasan setiap directive; **(8)** menyusun konfigurasi yang aman dan maintainable.

## Panduan demo: menjelaskan alur request

Saat diminta menceritakan alur, pakai skrip 6 langkah ini (contoh untuk `curl http://localhost:8080/api/headers/`):

```text
[1] Client  : curl membuka TCP ke localhost:8080, kirim GET /api/headers/ + Host: localhost:8080
[2] Server  : tidak ada server_name cocok -> jatuh ke default_server (app.local, listen 8080)
[3] Location: evaluasi location -> prefix /api/ (snippet proxy-routes.conf) mengalahkan location /
[4] Proteksi: limit_req zone=gw_rate dicek; client_max_body_size 1m dicek bila ada body
[5] Proxy   : proxy-headers.conf menambahkan X-Real-IP/X-Forwarded-For/X-Forwarded-Proto,
              lalu proxy_pass http://app_backend/  ->  prefix /api/ diganti "/"
[6] Upstream: round-robin memilih backend-1/2/3:80 -> backend membalas -> Nginx menulis log rt=/urt=
```

Buktikan tiap klaim dengan satu perintah (Host header, `curl -H`, `podman logs`, log `rt=`) — jangan menceritakan alur tanpa bukti.

---

## Contoh konfigurasi

Inti gateway yang wajib bisa kamu baca tanpa pemandu:

```nginx
# nginx/conf.d/api.conf — upstream + dua virtual host
upstream app_backend {
    server backend-1:80;   # di-resolve saat config dimuat -> backend harus hidup dulu
    server backend-2:80;
    server backend-3:80;
}

server {
    listen 8080;
    server_name api.local;
    default_type text/plain;
    include /etc/nginx/snippets/proxy-routes.conf;   # /api/ dan /app/ sekali tulis
    location / { return 200 "api.local - virtual host API pada port 8080\n"; }
}
```

```nginx
# nginx/snippets/proxy-routes.conf — route proxy yang dipakai 3 server block
location /api/ {
    limit_req               zone=gw_rate burst=20 nodelay;
    client_max_body_size    1m;
    include                 /etc/nginx/snippets/proxy-headers.conf;
    proxy_pass              http://app_backend/;   # slash akhir: /api/x -> backend /x
}
```

| Directive | Alasan keberadaannya |
|-----------|----------------------|
| `upstream app_backend` | Memusatkan 3 backend agar dipakai ulang oleh `/api/` dan `/app/` |
| `limit_req zone=gw_rate` | Melindungi backend dari lonjakan; zone-nya wajib dibuat di context `http` |
| `client_max_body_size 1m` | Menolak upload besar dengan 413 sebelum membebani backend |
| `include proxy-headers.conf` | Menjaga header identik di semua route proxy |
| `proxy_pass .../` | Mengganti prefix path supaya backend tidak tahu struktur URL publik |

---

## Lab

**1. Dari nol sampai uji otomatis** (baca lebih lanjut: [README lab](../../examples/nginx-lab/README.md)):

```bash
cd examples/nginx-lab
bash scripts/gen-certs.sh          # sertifikat self-signed ber-SAN
podman compose up -d               # nginx-lab + backend-1/2/3
bash scripts/test-routing.sh       # uji statis, vhost, redirect, TLS
bash scripts/test-proxy.sh         # uji proxy, LB, 413, 502/504, rate limit
```

**Ekspektasi:** `OK : sertifikat dibuat...`; kedua skrip mencetak `PASS` di tiap pemeriksaan dan menutup dengan `TOTAL: PASS=n FAIL=0` (exit 0).

**2. Skenario error 404 / 502 / 504:**

```bash
# 404: path berekstensi yang tidak ada (SPA fallback menutupi path halaman!)
curl -s -o /dev/null -w '404 -> %{http_code}\n' http://localhost:8080/assets/hilang.css

# 502: location /slow/ memproxy ke 127.0.0.1:9090 yang tidak ada listener-nya
curl -s -o /dev/null -w '502 -> %{http_code}\n' http://localhost:8080/slow/

# 504: listener menerima koneksi tapi tidak pernah menjawab (proxy_read_timeout 2s)
podman exec -d nginx-lab sh -c 'sleep 60 | nc -l -p 9090'
curl -s -o /dev/null -w '504 -> %{http_code}\n' http://localhost:8080/slow/   # ±2 detik
podman exec nginx-lab sh -c 'pkill -f "nc -l -p 9090"' || true
```

**Ekspektasi:** tercetak `404 -> 404`, `502 -> 502`, `504 -> 504`. Alasan tiap kode ada di `error.log` (`podman logs --tail 20 nginx-lab`) — cek sebelum menghafal.

**3. Graceful reload saat trafik berjalan:**

```bash
( for i in $(seq 1 200); do
    curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/
  done > /tmp/capstone.txt ) &

podman exec nginx-lab nginx -t          # wajib: syntax is ok
podman exec nginx-lab nginx -s reload   # worker baru mulai, lama menyelesaikan request
wait
sort /tmp/capstone.txt | uniq -c
```

**Ekspektasi:** hanya ada satu baris `200 200` — nol request gagal karena reload.

---

## Kesalahan umum

- Menguji `/halaman/tentang` lalu kecewa tidak dapat 404 — SPA fallback memang menutupinya; pakai path berekstensi (`/assets/hilang.css`).
- Menjalankan `nginx -t` sebelum container backend siap → `upstream app_backend` gagal di-resolve.
- Menganggap 502 dan 504 sama: 502 = koneksi ke backend **gagal**, 504 = koneksi ada tapi backend **terlalu lambat**.
- Reload tanpa `nginx -t` → konfigurasi rusak tak pernah aktif, tapi kamu mengira perubahan sudah jalan.
- Menyebut alur request tanpa membuktikannya dengan curl/log — padahal semua buktinya ada di lab.
- Lupa bahwa port 80/443 butuh hak istimewa, karena itu lab memakai 8080/8081/8443.

---

## Rangkuman

- Capstone **tidak menambah konsep baru** — ia menguji gabungan Pelajaran 1–17 pada satu gateway nyata.
- Lab `examples/nginx-lab/` berisi 4 container: gateway + 3 backend load-balanced, dengan 3 virtual host, TLS, rate limit, dan log custom.
- Bukti mengalahkan ingatan: setiap klaim (routing, proxy, LB, TLS, error) punya satu perintah `curl` atau log pendukung.
- **404** = file tak ada, **502** = backend tak terjangkau, **504** = backend terlalu lambat — bedakan lewat cara memicu, bukan hafalan.
- Graceful reload = `nginx -t` lalu `nginx -s reload`, terbukti nol request gagal di tengah trafik.
- Kelulusan = bisa **menjalankan, membuktikan, dan menjelaskan** alur request dari client sampai backend.

---

## Latihan

1. Ceritakan alur `curl -H 'Host: docs.local' http://localhost:8080/` dalam 6 langkah — sebutkan file konfigurasi tempat keputusan itu dibuat.
2. Pindahkan satu `location` di `app.conf` ke file snippet baru, lalu buktikan perilaku identik setelah reload.
3. Hentikan `backend-2`, buktikan `/api/` tetap 200, lalu jelaskan kenapa Nginx OSS baru mengetahuinya saat request gagal (*passive failure detection*).

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **Capstone** | Proyek akhir yang menggabungkan seluruh materi bab. |
| **Gateway** | Titik tunggal yang menerima request lalu mengarahkannya ke layanan yang tepat. |
| **Edge proxy** | Nginx sebagai lapisan pertama dari luar: TLS, routing, proteksi. |
| **Round-robin** | Distribusi request bergiliran ke tiap backend dalam `upstream`. |
| **Passive failure detection** | Nginx OSS hanya menandai backend mati setelah ada request yang gagal. |
| **Graceful reload** | Memuat konfigurasi baru tanpa memutus koneksi aktif. |
| **Self-signed certificate** | Sertifikat yang ditandatangani sendiri — hanya untuk lab. |
| **SAN** | Subject Alternative Name: daftar nama yang dicakup sertifikat. |
| **Skenario uji** | Rangkaian request terencana untuk membuktikan perilaku tertentu. |

**Uji pemahamanmu dengan [Kuis 40 Soal →](kuis-40-soal.md)**
