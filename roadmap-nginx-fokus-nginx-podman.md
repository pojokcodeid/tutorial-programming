# Roadmap Belajar Nginx dari 0 sampai Mahir
## Fokus Nginx — Podman hanya sebagai Environment Lab

> Tujuan: menguasai Nginx dari konfigurasi dasar sampai penggunaan sebagai web server, reverse proxy, load balancer, dan komponen deployment yang aman serta terukur.
>
> **Catatan:** Podman hanya dipakai untuk menjalankan Nginx dan backend simulasi. Pembelajaran tidak berfokus pada Podman/container.

## Target Kompetensi

Setelah roadmap selesai, kamu mampu:

- Memahami arsitektur dan cara kerja Nginx.
- Menulis, membaca, dan mengelola konfigurasi Nginx.
- Mengatur static web server, virtual host, dan URL routing.
- Memahami aturan pemilihan `location`.
- Menggunakan Nginx sebagai reverse proxy.
- Mengonfigurasi load balancing.
- Mengaktifkan HTTPS/TLS.
- Mengatur caching, compression, dan optimasi.
- Menerapkan security hardening.
- Membaca log dan melakukan troubleshooting secara sistematis.
- Menyiapkan konfigurasi Nginx yang siap diuji dan didokumentasikan.

## Prasyarat

- Dasar terminal.
- Dasar HTTP: request, response, method, status code, header.
- Dasar jaringan: IP, port, DNS, TCP.
- Podman sudah terpasang untuk kebutuhan lab.

---

# Tahap 1 — Fundamental Nginx

## Materi
- Apa itu Nginx dan kegunaannya.
- Web server, reverse proxy, load balancer, dan HTTP cache.
- Arsitektur Nginx:
  - Master process.
  - Worker processes.
  - Event-driven architecture.
- Alur request dari client ke Nginx.
- Perbedaan Nginx OSS dan Nginx Plus.
- Struktur konfigurasi dan konsep directive/context.

## Lab
- Jalankan Nginx di Podman.
- Akses halaman default.
- Periksa konfigurasi aktif.
- Amati access log dan error log.

```bash
podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
curl -i http://localhost:8080
podman logs nginx-lab
podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -T
```

## Checklist
- [ ] Menjelaskan fungsi Nginx.
- [ ] Memahami master dan worker process.
- [ ] Memahami request lifecycle secara umum.
- [ ] Mengenal konfigurasi dan log Nginx.

---

# Tahap 2 — Struktur Konfigurasi Nginx

## Materi
- Struktur `nginx.conf`.
- Context:
  - `main`
  - `events`
  - `http`
  - `server`
  - `location`
- Directive dan parameter.
- Include file konfigurasi.
- Scope dan inheritance directive.
- Komentar dan praktik menyusun konfigurasi.
- Validasi konfigurasi:
  - `nginx -t`
  - `nginx -T`
- Reload dan restart Nginx.
- Pengelolaan konfigurasi melalui bind mount.

## Lab
- Mount `nginx.conf` dari host.
- Pisahkan konfigurasi server ke `conf.d`.
- Ubah konfigurasi dan validasi.
- Lakukan reload tanpa menghapus container.

## Checklist
- [ ] Bisa membaca struktur konfigurasi.
- [ ] Bisa membuat file konfigurasi terpisah.
- [ ] Bisa validasi sebelum reload.
- [ ] Memahami perbedaan reload dan restart.

---

# Tahap 3 — Static Web Server

## Materi
- Directive `root`.
- Directive `alias`.
- `index`.
- `try_files`.
- `autoindex`.
- MIME types.
- Serving HTML, CSS, JavaScript, image, dan file download.
- Permission dan ownership file.
- Penanganan 403 dan 404.
- SPA fallback.

## Lab
Buat website statis dengan:
- `/` halaman utama.
- `/assets/` file CSS dan JS.
- `/docs/` dokumentasi.
- `/download/` file download.
- `/private/` path yang diblokir.

## Checklist
- [ ] Bisa melayani website statis.
- [ ] Memahami perbedaan `root` dan `alias`.
- [ ] Bisa menggunakan `try_files`.
- [ ] Bisa menangani 403 dan 404.

---

# Tahap 4 — Location Matching dan URL Routing

## Materi
- Prefix location.
- Exact match `=`.
- Prioritas prefix `^~`.
- Regex `~` dan `~*`.
- Urutan evaluasi location.
- Perbedaan URI dan filesystem path.
- Rewrite URL.
- `rewrite`, `return`, dan `try_files`.
- Redirect 301 dan 302.
- Internal redirect.
- `error_page`.

## Lab
- Buat route dengan exact, prefix, dan regex.
- Buat redirect `/old` ke `/new`.
- Buat aturan ekstensi file.
- Uji konflik beberapa location.
- Periksa hasil dengan `curl -I` dan `curl -v`.

## Checklist
- [ ] Bisa memprediksi location yang terpilih.
- [ ] Bisa menulis rewrite dan redirect.
- [ ] Memahami perbedaan internal dan external redirect.

---

# Tahap 5 — Virtual Host

## Materi
- `server` block.
- `server_name`.
- Host header.
- Default server.
- Beberapa domain dalam satu Nginx.
- Wildcard dan regex server name.
- Pemisahan konfigurasi per domain.
- DNS dan resolusi domain.

## Lab
Simulasikan:
- `app.local`
- `api.local`
- `docs.local`

Gunakan Host header:

```bash
curl -H 'Host: app.local' http://localhost:8080
curl -H 'Host: api.local' http://localhost:8080
curl -H 'Host: docs.local' http://localhost:8080
```

## Checklist
- [ ] Bisa membuat beberapa virtual host.
- [ ] Memahami pemilihan server block.
- [ ] Bisa mengatur default server.

---

# Tahap 6 — Reverse Proxy

## Materi
- Konsep reverse proxy.
- `proxy_pass`.
- `proxy_set_header`.
- `proxy_http_version`.
- Header forwarding:
  - `Host`
  - `X-Real-IP`
  - `X-Forwarded-For`
  - `X-Forwarded-Proto`
- Timeout:
  - `proxy_connect_timeout`
  - `proxy_read_timeout`
  - `proxy_send_timeout`
- URI replacement pada `proxy_pass`.
- Trailing slash pada `proxy_pass`.
- Buffering request dan response.
- WebSocket proxying.
- Upload file dan `client_max_body_size`.

## Lab
- Nginx meneruskan `/api/` ke backend.
- Nginx meneruskan `/app/` ke service aplikasi.
- Uji header forwarding.
- Uji timeout dan upload.
- Simulasikan backend mati.

## Checklist
- [ ] Bisa membuat reverse proxy.
- [ ] Memahami perubahan URI pada `proxy_pass`.
- [ ] Bisa mengatur header dan timeout.
- [ ] Bisa mendiagnosis 502 dan 504.

---

# Tahap 7 — Load Balancing

## Materi
- `upstream`.
- Round-robin.
- `least_conn`.
- `ip_hash`.
- Weighted server.
- `max_fails`.
- `fail_timeout`.
- Upstream keepalive.
- Session persistence dan keterbatasannya.
- Passive failure detection.
- Health check: fitur OSS vs Plus dan solusi eksternal.

## Lab
- Jalankan 3 backend dengan identitas berbeda.
- Buat upstream group.
- Amati distribusi request.
- Uji `least_conn`.
- Matikan backend dan amati perilaku Nginx.
- Uji parameter failure.

## Checklist
- [ ] Bisa membuat upstream.
- [ ] Memahami algoritma load balancing.
- [ ] Memahami failure handling.
- [ ] Mengetahui batasan health check Nginx OSS.

---

# Tahap 8 — HTTPS dan TLS

## Materi
- Dasar TLS handshake.
- Certificate, private key, CA, SAN, certificate chain.
- `listen 443 ssl`.
- `ssl_certificate`.
- `ssl_certificate_key`.
- HTTP ke HTTPS redirect.
- SNI.
- TLS protocol dan cipher baseline.
- Sertifikat self-signed untuk lab.
- Let's Encrypt dan renewal (konsep).
- HSTS dan konsekuensinya.

## Lab
- Buat sertifikat lokal.
- Aktifkan HTTPS.
- Redirect HTTP ke HTTPS.
- Uji dengan `curl` dan `openssl s_client`.
- Periksa certificate dan hostname.

## Checklist
- [ ] Bisa mengaktifkan HTTPS.
- [ ] Memahami sertifikat dan private key.
- [ ] Bisa menguji TLS.
- [ ] Tidak menyimpan private key ke Git.

---

# Tahap 9 — Caching dan Performance

## Materi
- Browser caching.
- `expires`.
- `Cache-Control`.
- `proxy_cache_path`.
- `proxy_cache`.
- `proxy_cache_key`.
- `proxy_cache_valid`.
- `proxy_cache_bypass`.
- `proxy_no_cache`.
- Cache status dan observability.
- Gzip compression.
- `sendfile`.
- `tcp_nopush` dan `tcp_nodelay`.
- Keepalive.
- Worker connections.
- Buffering.
- Static asset optimization.
- Cache invalidation dan risiko cache data personal.

## Lab
- Atur cache static assets.
- Atur proxy cache untuk endpoint publik.
- Uji cache hit/miss.
- Tambahkan header status cache untuk lab.
- Aktifkan gzip.
- Bandingkan response sebelum dan sesudah optimasi.

## Checklist
- [ ] Memahami browser cache dan proxy cache.
- [ ] Bisa menguji cache hit/miss.
- [ ] Bisa mengatur gzip.
- [ ] Memahami risiko caching.

---

# Tahap 10 — Security Hardening

## Materi
- `server_tokens`.
- Least privilege.
- `allow` dan `deny`.
- Proteksi file dan directory.
- Rate limiting:
  - `limit_req_zone`
  - `limit_req`
- Connection limiting:
  - `limit_conn_zone`
  - `limit_conn`
- `client_max_body_size`.
- Security headers.
- TLS hardening.
- HSTS.
- Restriksi method HTTP.
- Perlindungan endpoint sensitif.
- Secret management.
- Update dan pinning image.
- Nginx bukan pengganti authorization aplikasi.

## Lab
- Blok `/private`.
- Terapkan allow/deny IP.
- Terapkan rate limit.
- Batasi request body.
- Uji request burst.
- Verifikasi request valid tetap berjalan.

## Checklist
- [ ] Bisa membatasi akses path/IP.
- [ ] Bisa menerapkan rate limit.
- [ ] Memahami connection limit.
- [ ] Memahami security headers dan dampaknya.

---

# Tahap 11 — Logging, Monitoring, dan Troubleshooting

## Materi
- `access_log`.
- `error_log`.
- Log level.
- `log_format`.
- `$request`, `$status`, `$request_time`.
- `$upstream_response_time`.
- `$remote_addr`.
- Request ID dan correlation.
- `stub_status`.
- Log rotation.
- Metrik Nginx dan exporter (konsep).
- Analisis error:
  - 400
  - 403
  - 404
  - 499
  - 500
  - 502
  - 503
  - 504
- Troubleshooting client → Nginx → upstream.

## Lab
Sengaja buat error:
- Root salah.
- Permission salah.
- Upstream port salah.
- Backend lambat.
- Syntax konfigurasi salah.
- Request terlalu besar.

Gunakan:
```bash
podman logs nginx-lab
podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -T
curl -v http://localhost:8080/
```

## Checklist
- [ ] Bisa membaca access dan error log.
- [ ] Bisa membuat log format custom.
- [ ] Bisa mencari root cause.
- [ ] Bisa menjelaskan error proxy.

---

# Tahap 12 — Nginx Lanjutan dan Best Practices

## Materi
- Modular configuration.
- Konvensi penamaan file.
- Reusable snippets melalui `include`.
- Pemisahan konfigurasi per environment.
- Graceful reload.
- Zero/minimal downtime deployment (konsep).
- Nginx sebagai edge proxy.
- Reverse proxy multi-service.
- Static content + API dalam satu domain.
- Deployment blue-green (konsep).
- Performance testing dan capacity planning.
- Batas Nginx OSS vs Nginx Plus.
- Review konfigurasi dan dokumentasi.

## Lab
- Susun konfigurasi modular.
- Buat beberapa virtual host dan upstream.
- Terapkan TLS, caching, rate limit, dan logging.
- Uji graceful reload saat traffic berjalan.
- Dokumentasikan setiap directive penting.

## Checklist
- [ ] Konfigurasi modular dan mudah dibaca.
- [ ] Bisa melakukan reload dengan aman.
- [ ] Bisa mengelola banyak service.
- [ ] Bisa menjelaskan desain konfigurasi.

---

# Capstone — Nginx sebagai Gateway Aplikasi

## Arsitektur Lab

```text
Client
  |
  +-- HTTP :8080
  +-- HTTPS :8443
        |
    [ Nginx ]
        |
        +-- /       -> static website
        +-- /api/   -> API upstream
        +-- /app/   -> application upstream
        +-- /docs/  -> documentation static
                       |
                 Podman network
                       |
              +--------+--------+
              |        |       |
          backend-1 backend-2 backend-3
```

## Struktur project

```text
nginx-lab/
├── compose.yaml
├── README.md
├── nginx/
│   ├── nginx.conf
│   ├── conf.d/
│   │   ├── app.conf
│   │   └── api.conf
│   └── snippets/
│       ├── proxy-headers.conf
│       └── security-headers.conf
├── certs/
│   └── README.md
├── web/
│   ├── index.html
│   └── assets/
└── scripts/
    ├── test-routing.sh
    └── test-proxy.sh
```

## Persyaratan Capstone

- [ ] Static website.
- [ ] Minimal 3 virtual host atau server route yang jelas.
- [ ] URL routing dengan `location`.
- [ ] Reverse proxy ke API.
- [ ] Load balancing 3 backend.
- [ ] HTTPS dan redirect HTTP.
- [ ] Cache static assets.
- [ ] Rate limiting.
- [ ] Security headers yang sesuai.
- [ ] Custom access log.
- [ ] Uji error 404, 502, dan 504.
- [ ] Graceful reload.
- [ ] Dokumentasi konfigurasi dan troubleshooting.

## Kriteria kelulusan

Capstone selesai jika kamu mampu:
1. Menjalankan seluruh lab dari repository.
2. Menjelaskan alur request.
3. Menentukan location yang terpilih.
4. Membuktikan reverse proxy dan load balancing.
5. Menguji TLS dan cache.
6. Memicu serta menganalisis error.
7. Menjelaskan alasan setiap directive.
8. Menyusun konfigurasi yang aman dan maintainable.

---

# Jadwal Belajar 12 Minggu

| Minggu | Fokus | Output |
|---|---|---|
| 1 | Fundamental Nginx | Nginx berjalan dan memahami request |
| 2 | Konfigurasi | Config modular dan tervalidasi |
| 3 | Static server | Website statis |
| 4 | Location & routing | Routing dan rewrite |
| 5 | Virtual host | Multi-domain lab |
| 6 | Reverse proxy | Proxy ke backend |
| 7 | Load balancing | 3 backend |
| 8 | HTTPS/TLS | HTTPS dan redirect |
| 9 | Cache & performance | Cache dan gzip |
| 10 | Security | Rate limit dan access control |
| 11 | Logging & troubleshooting | Log format dan error lab |
| 12 | Capstone | Gateway Nginx lengkap |

---

# Referensi Resmi

- Nginx Documentation: https://nginx.org/en/docs/
- Beginner's Guide: https://nginx.org/en/docs/beginners_guide.html
- Admin Guide: https://docs.nginx.com/nginx/admin-guide/
- Nginx Core Module: https://nginx.org/en/docs/ngx_core_module.html
- HTTP Proxy Module: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- Upstream Module: https://nginx.org/en/docs/http/ngx_http_upstream_module.html
- SSL Module: https://nginx.org/en/docs/http/ngx_http_ssl_module.html
- Podman Documentation (hanya untuk environment lab): https://docs.podman.io/

> **Catatan:** fitur tertentu berbeda antara Nginx OSS dan Nginx Plus. Periksa dokumentasi sesuai versi yang digunakan. Konfigurasi lab bukan otomatis konfigurasi production; sesuaikan dengan kebutuhan aplikasi dan threat model.
