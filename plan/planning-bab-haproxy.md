# Planning — Bab Tutorial HAProxy (aplikasi web)

> Rujukan utama: [`roadmap-belajar-haproxy-podman.md`](../roadmap-belajar-haproxy-podman.md) — Level 0 sampai Level 11 + Capstone.
> Format mengikuti bab yang sudah ada: `content/apache-kafka/`, `content/nginx/`, `content/rabbitmq/`.
> Lokasi materi: **`content/haproxy/*.js`** (tampil di aplikasi web, bukan markdown).

---

## 1. Daftar 13 pelajaran

| # | File | id | Judul | chapter | Durasi | Level roadmap |
|---|------|----|-------|---------|--------|---------------|
| 1 | `01-persiapan-lab-podman.js` | `persiapan-lab-podman` | Persiapan Lab: Podman, Network, dan Workspace | Fondasi | 12 menit | Level 0 |
| 2 | `02-fondasi-proxy.js` | `fondasi-proxy` | Fundamental Proxy, Load Balancer, dan Peran HAProxy | Fondasi | 15 menit | Level 1 |
| 3 | `03-instalasi-reverse-proxy.js` | `instalasi-reverse-proxy` | Instalasi HAProxy dan Reverse Proxy Pertama | Konfigurasi Dasar | 15 menit | Level 2 |
| 4 | `04-load-balancing.js` | `load-balancing` | Load Balancing: Algoritma, Weight, dan Distribusi | Konfigurasi Dasar | 15 menit | Level 3 |
| 5 | `05-health-check-resilience.js` | `health-check-resilience` | Health Check dan Ketahanan Backend | Ketahanan | 15 menit | Level 4 |
| 6 | `06-acl-routing.js` | `acl-routing` | ACL, Routing, dan Manajemen Traffic | Routing | 15 menit | Level 5 |
| 7 | `07-tls-https.js` | `tls-https` | TLS/HTTPS, Termination, dan Keamanan Frontend | Keamanan | 15 menit | Level 6 |
| 8 | `08-monitoring-observability.js` | `monitoring-observability` | Logging, Stats Page, dan Observabilitas | Observabilitas | 14 menit | Level 7 |
| 9 | `09-high-availability.js` | `high-availability` | High Availability: Dua HAProxy + Keepalived | High Availability | 16 menit | Level 8 |
| 10 | `10-performance-tuning.js` | `performance-tuning` | Performance, Benchmark, dan Tuning | Performa | 15 menit | Level 9 |
| 11 | `11-advanced-operations.js` | `advanced-operations` | Konfigurasi Lanjutan dan Operasional Harian | Operasional | 16 menit | Level 10 |
| 12 | `12-troubleshooting-production.js` | `troubleshooting-production` | Troubleshooting dan Kesiapan Produksi | Operasional | 15 menit | Level 11 |
| 13 | `13-capstone-multi-service.js` | `capstone-multi-service` | Capstone: Arsitektur HAProxy Multi-Service | Capstone | 20 menit | Capstone |

Kuis terpisah: `content/haproxy/quiz-questions.js` — **40 soal**, id `haproxy01` … `haproxy40`.

---

## 2. Struktur file pelajaran (WAJIB)

```js
/* ============================================================
   Pelajaran HAProxy — 01: <Judul>
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: '<id persis tabel>',
  title: '<judul>',
  chapter: '<chapter persis tabel>',
  duration: '<N> menit',
  intro: [ '<paragraf 1>', '<paragraf 2>', '<paragraf 3>' ],   // tepat 3
  objectives: [ ... ],                                          // tepat 4
  sections: [ ... ],
  recap: [ ... ]                                                // tepat 4
});
```

Aturan `sections` (dicek otomatis oleh `tests/smoke.js`):

1. **Minimal 4 section** dan **minimal 4 tipe berbeda** dari `text`, `example`, `tip`, `warn`, `vocab`.
2. **Wajib ada tepat SATU** section `text` yang memuat figur:
   `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 <tinggi>" width="760" role="img" aria-label="...">...</svg></div><figcaption>...</figcaption></figure>`
   - Kelas SVG pakai konvensi yang sudah ada: `u-hd`, `u-box`, `u-title`, `u-lbl`, `u-line`, panah `marker-end="url(#u-arrow)"`.
   - Panah `u-arrow` sudah didefinisikan global di `index.html` (tidak perlu didefinisikan ulang).
3. **Wajib ada** section `vocab` dengan `items` array pasangan `[istilah, penjelasan]` — minimal **6** item.
4. **Wajib ada** minimal satu `tip` ATAU `warn` (disarankan keduanya: `warn` = kesalahan umum pemula, `tip` = strategi belajar/praktik).
5. **Wajib ada** minimal 3 section `example` dengan bentuk:
   ```js
   {
     type: 'example',
     title: '...',
     lang: 'bash' | 'cfg' | 'text' | 'json' | 'http',
     output: false,
     code: `...`,
     explain: [ '...', '...' ]   // minimal 2, disarankan 3–4
   }
   ```
   - `output` **harus `false`** (kode lab Podman tidak bisa dijalankan dari browser).
   - `code` **tidak boleh** mengandung tanda kutip balik (`` ` ``) maupun `${`.
   - Isi `code` dari lab roadmap: perintah `podman`, blok konfigurasi HAProxy (`cfg`), request/response `curl` (`http`).
6. **Tidak ada** section `type: 'live'` (bab infrastruktur tanpa editor HTML interaktif).
7. Ditutup dengan section `text` **Latihan** (`<h3>Latihan</h3><ol>...`) berisi 3–4 butir.

Field HTML (`html`, `text`, `explain`, `intro`, `objectives`, `recap`):

- Boleh memakai template literal (backtick) sebagai pembungkus, tetapi **isi** string tidak boleh memuat `` ` `` atau `${`.
- Tag yang didukung renderer: `<h3>`, `<p>`, `<ul>/<ol>/<li>`, `<table>`, `<b>/<i>/<code>`, `<blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">`.
- Setiap pelajaran ditutup blok Latihan, dan **recap** 4 poin ringkas ber-`<b>`.

---

## 3. Gaya penulisan

- Bahasa Indonesia, akrab dan konkret, konsisten memakai **kamu** (bukan "Anda").
- Tiap pelajaran dibuka dengan **analogi/metaphor** di `intro` (lihat `content/apache-kafka/01-pengantar-event-streaming.js`).
- Jangan menghafal directive — jelaskan *kenapa*, lalu *buktikan dengan lab*.
- Setiap konfigurasiHAProxy disertai penjelasan baris demi baris pada `explain`.
- Selalu sebut **checkpoint** ala roadmap di bagian latihan/eksperimen.
- Peringatkan perbedaan lab vs produksi (stats tanpa autentikasi, self-signed cert, dsb.).

## 4. Cakupan isi per pelajaran

Ikuti level roadmap apa adanya:

1. **Persiapan Lab** — prasyarat, `podman --version/info/ps/network ls`, workspace `haproxy-lab/`, `podman network create`, eksplorasi `run/inspect/logs/exec/stop/rm`.
2. **Fondasi Proxy** — forward vs reverse proxy, load balancer, L4 vs L7, SPOF, availability, health check, failover/failback, session persistence, peran HAProxy, alur request client→HAProxy→3 backend, komponen config `global/defaults/frontend/backend/listen`.
3. **Instalasi & Reverse Proxy** — container `nginx:alpine` sebagai web1, `haproxy.cfg` minimal (`global`, `defaults`, `frontend http_front bind :80`, `backend web_servers server web1 web1:80 check`), `podman run -p 8080:80 -v ...haproxy.cfg:ro`, uji `curl -i`, `podman logs`, directive penting, matikan backend dan amati 503.
4. **Load Balancing** — 3 backend, `balance roundrobin/leastconn/static-rr/source`, `weight`, distribusi dalam loop curl, kapan tiap algoritma tepat, kenapa distribusi tidak pernah persis rata.
5. **Health Check** — TCP vs HTTP check, `option httpchk`, `http-check expect status`, `inter/fall/rise/check`, simulasi `podman stop web2` lalu `podman start web2`, kenapa endpoint health harus mewakili kesiapan service.
6. **ACL & Routing** — `acl`, `use_backend ... if`, routing hostname/path/header, `http-request redirect`, manipulasi header (`set-header/add-header/del-header`), deny, multi-application.
7. **TLS/HTTPS** — konsep handshake/cert/key/CA/SNI, buat self-signed dengan `openssl` lalu `cat cert key > lab.pem`, `bind :443 ssl crt ...`, redirect HTTP→HTTPS, TLS termination vs passthrough (L4), checklist keamanan.
8. **Monitoring** — logging ke stdout (`log stdout format raw local0`, `option httplog`), membaca field log, stats page `listen stats :8404` + `stats uri /stats`, metrik yang wajib dipantau, integrasi Prometheus exporter/Grafana/alerting/log rotation.
9. **High Availability** — active-passive vs active-active, VIP, VRRP/Keepalived, arsitektur 2 HAProxy + 2 Keepalived + 2 backend, skenario failover & failback, keterbatasan Podman (macOS: VM, multicast/VRRP/host networking) beserta alternatif pendekatannya.
10. **Performance & Tuning** — `maxconn`, timeout, keep-alive, queue/backlog, file descriptor/OS limit, benchmark `wrk`/`ab`/`hey`, checklist pengukuran, eksperimen tuning berbasis data (jangan menyalang angka tuning mentah-mentah).
11. **Advanced & Operasional** — regex & map file, multiple frontend/backend, SNI routing, HTTP/2, WebSocket, gRPC, cookie persistence & stick tables, rate limiting per IP, Runtime API/socket admin, validasi `haproxy -c -f`, graceful reload, rolling update, rollback, version control konfigurasi.
12. **Troubleshooting & Produksi** — diagnosis HAProxy tak mau start, backend DOWN, 503, timeout, distribusi tak merata; workflow troubleshooting (diagram langkah); production readiness checklist.
13. **Capstone** — arsitektur multi-service (VIP → 2 HAProxy → pool web/api/admin), routing `web.lab.local`/`api.lab.local`/`admin.lab.local`, algoritma per pool, HTTPS + redirect, stats terbatas, test plan (traffic normal, backend down/recovery, node failure, reload, rollback), deliverables, rubrik "mahir".

---

## 5. Kuis (`quiz-questions.js`)

```js
window.HAPROXY_QUIZ_POOL = window.HAPROXY_QUIZ_POOL || [];
window.HAPROXY_QUIZ_POOL.push(
  { id: 'haproxy01', q: '...', options: [4 opsi], answer: <0-3>, explain: '...' },
  ... 40 soal ...   // haproxy01 … haproxy40
);
```

- Distribusi ± 3 soal per level (Level 0–11) + 4 soal capstone = 40.
- Sebar `answer` secara merata di indeks 0–3; `explain` menjelaskan *kenapa* jawaban benar.

## 6. Registrasi (sudah dikerjakan oleh pemimpin tugas)

- [x] `js/content.js` — entry `haproxy` + daftar `return { ... }`.
- [x] `index.html` — `<script>` 14 file (quiz dulu, lalu 01–13) sebelum `js/content.js`.
- [x] `tests/smoke.js` — daftar `order` + blok pemeriksaan bab HAProxy.
- [x] `assets/logos/haproxy.svg`.
- [x] `README.md` dan `info.md` — deskripsi bab baru.

## 7. Validasi sebelum selesai

```bash
for f in content/haproxy/*.js; do node --check "$f"; done
node tests/smoke.js
```

Kedua perintah harus lulus 100%.
