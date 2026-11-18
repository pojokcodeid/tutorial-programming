# 🌐 Bab: Nginx dari 0 sampai Mahir

> **Untuk siapa:** yang baru memulai atau sudah pernah pakai Nginx tapi ingin tertata dari dasar sampai mahir.
> **Sifat:** fokus penuh pada **Nginx** — Podman hanya dipakai sebagai environment lab.
> **Jumlah:** 18 pelajaran + 40 soal kuis + 1 capstone project.
> **Estimasi:** ± 10–15 menit baca + lab per pelajaran → mengikuti jadwal 12 minggu.
> **Sumber rujukan:** [roadmap-nginx-fokus-nginx-podman.md](../../roadmap-nginx-fokus-nginx-podman.md) — Tahap 1 sampai Capstone.

---

## Apa yang akan kamu bisa setelah bab ini?

1. Menjelaskan arsitektur Nginx (master, worker, event-driven) dan alur request dari client ke backend.
2. Membaca, menulis, dan memvalidasi konfigurasi Nginx secara modular (`nginx -t`, `nginx -T`, reload).
3. Melayani website statis, termasuk `root` vs `alias`, `try_files`, 403/404, dan SPA fallback.
4. Memprediksi location mana yang terpilih, serta menulis rewrite dan redirect.
5. Menyusun beberapa virtual host dalam satu Nginx.
6. Membangun reverse proxy yang benar: header, timeout, URI replacement, WebSocket, upload.
7. Mengonfigurasi load balancing 3 backend beserta failure handling-nya.
8. Mengaktifkan HTTPS/TLS, redirect HTTP→HTTPS, dan menguji sertifikat.
9. Mengatur caching (browser + proxy), gzip, dan optimasi performance.
10. Menerapkan security hardening: rate limit, allow/deny, security headers.
11. Membaca log, membuat log format custom, dan menganalisis error 403/404/502/504 secara sistematis.
12. Menyusun konfigurasi produksi-like yang aman, terdokumentasi, dan mudah di-reload.

---

## Peta 18 Pelajaran

| # | Pelajaran | Inti yang dipelajari | Tahap roadmap |
|---|-----------|----------------------|---------------|
| 1 | [Apa Itu Nginx?](01-apa-itu-nginx.md) | Web server, reverse proxy, load balancer, HTTP cache | Tahap 1 |
| 2 | [Arsitektur & Request Lifecycle](02-arsitektur-dan-lifecycle.md) | Master/worker, event-driven, alur request, OSS vs Plus | Tahap 1 |
| 3 | [Struktur Konfigurasi](03-struktur-konfigurasi.md) | Directive, context, include, scope & inheritance | Tahap 2 |
| 4 | [Mengelola Konfigurasi](04-mengelola-konfigurasi.md) | `nginx -t`/`-T`, reload vs restart, bind mount, conf.d | Tahap 2 |
| 5 | [Static Web Server](05-static-web-server.md) | `root`, `alias`, `index`, `try_files`, `autoindex`, MIME | Tahap 3 |
| 6 | [File, 403/404 & SPA Fallback](06-file-403-404-dan-spa.md) | Permission, blocking path, error 403/404, SPA | Tahap 3 |
| 7 | [Location Matching](07-location-matching.md) | Prefix, `=`, `^~`, regex, urutan evaluasi | Tahap 4 |
| 8 | [Rewrite, Redirect & error_page](08-rewrite-redirect-error-page.md) | `rewrite`, `return`, 301/302, internal redirect | Tahap 4 |
| 9 | [Virtual Host](09-virtual-host.md) | `server`, `server_name`, default server, wildcard, DNS | Tahap 5 |
| 10 | [Reverse Proxy Dasar](10-reverse-proxy-dasar.md) | `proxy_pass`, trailing slash, penggantian URI | Tahap 6 |
| 11 | [Reverse Proxy Lanjutan](11-reverse-proxy-lanjutan.md) | Header, timeout, buffering, WebSocket, upload | Tahap 6 |
| 12 | [Load Balancing](12-load-balancing.md) | `upstream`, algoritma, weight, failure, health check | Tahap 7 |
| 13 | [HTTPS & TLS](13-https-tls.md) | Sertifikat, `listen 443 ssl`, redirect, SNI, HSTS | Tahap 8 |
| 14 | [Caching & Performance](14-caching-dan-performance.md) | Browser cache, `proxy_cache`, gzip, sendfile, keepalive | Tahap 9 |
| 15 | [Security Hardening](15-security-hardening.md) | `server_tokens`, allow/deny, rate limit, security headers | Tahap 10 |
| 16 | [Logging & Troubleshooting](16-logging-troubleshooting.md) | `log_format`, variabel, stub_status, analisis error | Tahap 11 |
| 17 | [Best Practices & Deployment](17-best-practices-deployment.md) | Modular config, snippets, graceful reload, edge proxy | Tahap 12 |
| 18 | [Capstone: Gateway Nginx](18-capstone-gateway-nginx.md) | Proyek akhir: gateway lengkap sesuai roadmap | Capstone |

Setelahnya: **[Kuis 40 Soal](kuis-40-soal.md)** untuk mengukur pemahamanmu.

**Lab praktik:** seluruh pelajaran memakai lab yang sama di [`examples/nginx-lab/`](../../examples/nginx-lab/) — jalankan sekali, dipakai berulang tiap tahap.

---

## Urutan Belajar (12 Minggu)

| Minggu | Pelajaran | Output |
|---|---|---|
| 1 | 1–2 | Nginx berjalan dan memahami request |
| 2 | 3–4 | Config modular dan tervalidasi |
| 3 | 5–6 | Website statis |
| 4 | 7–8 | Routing dan rewrite |
| 5 | 9 | Multi-domain lab (virtual host) |
| 6 | 10–11 | Proxy ke backend |
| 7 | 12 | 3 backend load balanced |
| 8 | 13 | HTTPS dan redirect |
| 9 | 14 | Cache dan gzip |
| 10 | 15 | Rate limit dan access control |
| 11 | 16 | Log format dan error lab |
| 12 | 17–18 + kuis | Gateway Nginx lengkap |

> 💡 Kerjakan berurutan. Tiap pelajaran memakai konsep dari pelajaran sebelumnya, dan tiap pelajaran ditutup dengan **rangkuman** + **latihan** yang bisa selesai kurang dari 15 menit (termasuk lab).

---

## Prasyarat

- Dasar terminal (menjalankan perintah, `cd`, membaca output).
- Dasar HTTP: request, response, method, status code, header. (Ada materi di [http.md](../../http.md))
- Dasar jaringan: IP, port, DNS, TCP.
- **Podman** sudah terpasang — hanya untuk menjalankan Nginx dan backend simulasi, bukan fokus pembelajaran.

---

## Pemetaan ke Roadmap

| Tahap di roadmap | Pelajaran di bab ini |
|---|---|
| Tahap 1 — Fundamental Nginx | 1, 2 |
| Tahap 2 — Struktur Konfigurasi | 3, 4 |
| Tahap 3 — Static Web Server | 5, 6 |
| Tahap 4 — Location Matching & URL Routing | 7, 8 |
| Tahap 5 — Virtual Host | 9 |
| Tahap 6 — Reverse Proxy | 10, 11 |
| Tahap 7 — Load Balancing | 12 |
| Tahap 8 — HTTPS dan TLS | 13 |
| Tahap 9 — Caching dan Performance | 14 |
| Tahap 10 — Security Hardening | 15 |
| Tahap 11 — Logging, Monitoring, Troubleshooting | 16 |
| Tahap 12 — Nginx Lanjutan dan Best Practices | 17 |
| Capstone — Nginx sebagai Gateway Aplikasi | 18 + `examples/nginx-lab/` |

---

## Rujukan

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Admin Guide — docs.nginx.com](https://docs.nginx.com/nginx/admin-guide/)
- [ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) · [ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html) · [ngx_http_ssl_module](https://nginx.org/en/docs/http/ngx_http_ssl_module.html)
- [Podman Documentation](https://docs.podman.io/) (hanya environment lab)

> **Catatan:** fitur tertentu berbeda antara **Nginx OSS** dan **Nginx Plus**. Konfigurasi lab bukan otomatis konfigurasi produksi — sesuaikan dengan kebutuhan aplikasi dan threat model kamu.
