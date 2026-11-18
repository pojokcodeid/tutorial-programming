# Pelajaran 17 — Best Practices, Modular Config & Deployment

> **Durasi:** ± 10–15 menit
> **Prasyarat:** Pelajaran 3–4 (struktur & validasi konfigurasi), Pelajaran 9–12 (virtual host sampai load balancing), dan container `nginx-lab` yang bisa dijalankan

---

## Tujuan belajar

- Menyusun konfigurasi **modular**: `nginx.conf` tipis + `include`, dengan **konvensi penamaan file** yang konsisten.
- Membuat **snippet** (`include`) yang dipakai berulang dan memahami aturan warisan `add_header`.
- Memisahkan konfigurasi per environment (dev/staging/prod) tanpa menyalin file secara liar.
- Menjelaskan **graceful reload**, konsep minimal downtime, dan deployment **blue-green**.
- Menempatkan Nginx sebagai **edge proxy**: reverse proxy multi-service serta static + API dalam satu domain.
- Menyentuh **performance testing & capacity planning**, serta mengenali **batas Nginx OSS vs Plus**.
- Menjalankan **review & dokumentasi** konfigurasi sebelum layanan dibuka ke pengguna.

---

## Cerita pembuka: bengkel dengan kotak perkakas berlabel

Bayangkan dua bengkel. Bengkel pertama menaruh **semua perkakas di satu laci panjang**: saat butuh obeng, kamu harus mengobrak-abrik, dan saat mengganti satu perkakas kamu khawatir ketuker. Bengkel kedua memakai **laci-laci berlabel** — obeng di laci A, kunci di laci B — dan tiap laci punya kartu catatan isi laci. Perkakasnya sama, tapi bengkel kedua jauh lebih cepat diperbaiki tanpa menghentikan pekerjaan.

> **Konfigurasi produksi = bengkel kedua.** Modul berlabel (`conf.d/`), potongan yang dipakai berulang (`snippets/`), dan kartu catatan (komentar dokumentasi). Dengan begitu, **mengganti satu bagian tidak perlu membongkar seluruh konfigurasi** — dan Nginx bisa memuat perubahan itu lewat *graceful reload* tanpa memutus koneksi yang sedang berjalan.

---

## Konfigurasi modular & konvensi penamaan file

Modular = `nginx.conf` hanya berisi **kerangka global**, sedangkan detail per layanan dipisah ke file kecil yang di-`include`. Struktur yang dipakai lab ini:

```text
nginx/
├── nginx.conf      # kerangka: main, events, http + include terakhir
├── conf.d/         # per virtual host / per layanan
│   ├── app.conf    # app.local: 8080, 8443, redirect 8081
│   └── api.conf    # upstream + api.local + docs.local
└── snippets/       # potongan dipakai banyak file
    ├── proxy-headers.conf · proxy-routes.conf
    └── security-headers.conf   # dipakai di context http, server, location
```

| Bagian | Berisi | Aturan main |
|-------|--------|-------------|
| `nginx.conf` | `user`, `worker_processes`, `events`, `http` (log format, zone, `include` terakhir) | Tipis — jangan taruh `server` di sini |
| `conf.d/*.conf` | Satu file = satu virtual host atau satu kelompok layanan | **Urutan baca = urutan glob**, jadi pakai prefix angka |
| `snippets/*.conf` | Potongan `location`/directive yang dipakai ≥2 tempat | Tanpa `server {}` — hanya potongan |

**Konvensi penamaan yang mudah dipertahankan tim:**

- Prefix angka menentukan prioritas baca: `10-default.conf` (fallback), `30-app.conf`, `50-api.conf`, `90-maintenance.conf` — atau nama berbasis domain (`app.local.conf`); pilih **satu gaya** dan konsisten.
- Nama file menjawab *"apa isinya"*, bukan *"siapa yang mengubah"* (`30-app.conf`, bukan `fix-baru.conf`).
- Komentar di tiap file menjawab **mengapa**, bukan mengulang sintaks.

---

## Snippets: tulis sekali, pakai banyak

`include` bekerja di semua context. Pola snippet yang terbukti di lab:

| Snippet | Dipakai di | Isi |
|---------|-----------|-----|
| `proxy-headers.conf` | tiap `location` proxy | `proxy_set_header Host/X-Real-IP/X-Forwarded-For/X-Forwarded-Proto`, timeout |
| `proxy-routes.conf` | app.local (8080 & 8443) + api.local | `location /api/` dan `/app/` + `limit_req` + `client_max_body_size` |
| `security-headers.conf` | context `http`, server HTTPS, location aset | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP |

Satu jebakan warisan yang wajib dihafal: **`add_header` di context atas TIDAK diwariskan** bila server/location di bawahnya mendefinisikan `add_header` sendiri (aturan resmi nginx.org). Karena itu lab menyertakan ulang snippet security headers di server `:8443` dan di location cache — bukan duplikasi yang salah, melainkan konsekuensi aturan warisan.

---

## Pemisahan konfigurasi per environment

Jangan menyalin seluruh folder lalu mengubah-ubah diam-diam. Pola sehatnya: `nginx.conf` meng-`include` `conf.d/` (inti yang berlaku untuk semua env) plus satu file kecil `env/$ENVIRONMENT.conf` — beda env = beda satu file.

- Yang **berbeda** antar env: nama domain, IP upstream, ukuran cache, level log, `server_tokens`.
- Yang **sama**: struktur `location`, snippet header, aturan error.
- Di container, env dipilih lewat variabel (`ENVIRONMENT=staging`) atau command `nginx -g "..."`; di lab cukup satu set `conf.d/` karena memang hanya ada satu environment.
- Larangan keras: **edit langsung di dalam container** tanpa menulis ulang ke file host — perubahan hilang saat container dibuat ulang. Di lab semua mount bersifat `:ro` supaya kebiasaan ini tidak terbentuk.

---

## Graceful reload, minimal downtime, dan blue-green

`nginx -s reload` (alias mengirim **SIGHUP** ke proses master) memakai urutan aman: **baca & validasi konfigurasi baru → fork worker baru → worker lama menyelesaikan request yang sedang berjalan lalu berhenti**. Koneksi yang sedang terbuka tidak diputus — itulah **graceful**.

| Istilah | Arti | Di Nginx OSS |
|---------|------|--------------|
| Graceful reload | Ganti konfigurasi tanpa memutus koneksi aktif | ✅ bawaan (`nginx -t` lalu `nginx -s reload`) |
| Minimal downtime | Deploy dengan downtime nyaris nol | ✅ selama selalu `nginx -t` sebelum reload |
| Blue-green | Dua set layanan identik (biru & hijau), trafik dipindah seketika ke satu set | ⚠️ konsep di **lapisan di atas** Nginx (komposer/upstream), bukan perintah Nginx |

Prinsipnya selalu sama: **validasi dulu, baru muat**. Konfigurasi yang gagal `nginx -t` tidak akan pernah menyentuh worker yang sedang melayani — Nginx menolak reload dan mempertahankan konfigurasi lama.

---

## Nginx sebagai edge proxy

**Edge** = titik pertama yang disentuh request dari luar. Di posisi itu Nginx mengerjakan banyak hal sebelum aplikasi bangun:

```text
client ──▶ [ EDGE: TLS · rate limit · routing · log · cache ] ──▶ static files
                                                          └──▶ API & app service
```

- **Reverse proxy multi-service**: beda layanan dipisah lewat `server_name` (Host header) atau lewat path (`/api/`, `/app/`).
- **Static + API satu domain**: file statis disajikan Nginx langsung (`root`/`alias`), hanya path API yang di-proxy — hemat round trip dan beban aplikasi.
- Lab ini memakai keduanya: `app.local` menggabungkan static + `/api/` + `/app/`, sementara `api.local`/`docs.local` memisahkan peran lewat Host header.

---

## Performance testing & capacity planning (singkat)

| Langkah | Isi | Contoh |
|---------|-----|--------|
| 1. Uji beban | Ukur RPS + latensi p50/p95 + error rate | `wrk`, `ab`, `hey` terhadap `/api/` |
| 2. Temukan bottleneck | Bandingkan `worker_connections`, CPU, dan waktu upstream | log `rt=` vs `urt=` (pelajaran 16) |
| 3. Hitung kapasitas | RPS terukur ÷ faktor aman | pakai **50–60%** dari beban puncak terukur |
| 4. Sisakan headroom | Kapasitas cadangan untuk trafik tak terduga | target minimal **2×** beban rata-rata |

Catatan jujur: angka dari laptop/container belajar **bukan** angka produksi — gunanya untuk membandingkan *sebelum vs sesudah* perubahan (mis. menyalakan `gzip`, menaikkan `worker_connections`), bukan untuk menjanjikan kapasitas ke klien.

---

## Batas Nginx OSS vs Plus

| Kemampuan | Nginx OSS (dipakai lab) | Nginx Plus |
|-----------|------------------------|------------|
| Reverse proxy, vhost, load balancing, TLS, cache, rate limit | ✅ | ✅ |
| Failure detection | **Pasif** — hanya saat request gagal | Aktif + pasif (health check berkelanjutan) |
| API & dashboard monitoring | ❌ (pakai `stub_status` + exporter) | ✅ bawaan |
| Rekonfigurasi dinamis tanpa reload | ❌ (selalu reload) | ✅ lewat API |
| Session persistence (sticky) | Terbatas (`ip_hash`) | ✅ |
| WAF | ❌ | Modul terpisah (NGINX App Protection) |

Pada dasarnya: **semua materi di bab ini berjalan penuh di OSS**. Plus menambah kenyamanan operasional, bukan fitur dasar routing.

---

## Review & dokumentasi konfigurasi

Checklist sebelum konfigurasi dianggap layak deploy:

1. `nginx -t` sukses; `nginx -T` menampilkan semua file yang benar-benar ikut terbaca.
2. Tiap file `conf.d/` punya komentar **mengapa** direktif itu ada, bukan hanya apa isinya.
3. Ada satu halaman daftar: alur request, port, domain, lokasi snippet, dan cara reload/rollback.
4. Error page, log format, health check sederhana, dan tahu langkah rollback (`nginx -t` → `nginx -s reload`) sudah disepakati tim.
5. Tidak ada rahasia di repo (private key, token) — di lab, `certs/*.key` sudah masuk `.gitignore`.

---

## Contoh konfigurasi

```nginx
# /etc/nginx/nginx.conf — kerangka tipis: hanya yang berlaku global
user  nginx;
worker_processes  auto;
error_log  /var/log/nginx/error.log  warn;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    # Satu format log untuk semua virtual host (pelajaran 16)
    log_format main '$remote_addr [$time_local] "$request" $status '
                    'rt=$request_time urt=$upstream_response_time';
    access_log /var/log/nginx/access.log main;

    sendfile           on;
    keepalive_timeout  65;
    server_tokens      off;
    # Zone rate limit: hanya boleh di context http
    limit_req_zone $binary_remote_addr zone=gw_rate:10m rate=10r/s;
    # Snippet global — diwariskan ke semua server (hati-hati aturan add_header)
    include /etc/nginx/snippets/security-headers.conf;
    # Poin tunggal untuk memuat semua virtual host (urutan = nama file)
    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# /etc/nginx/conf.d/30-app.conf — satu file = satu virtual host
server {
    listen       8080 default_server;
    server_name  app.local;

    root   /usr/share/nginx/html;
    index  index.html;

    # Snippet dipakai ulang di 8443 dan api.local — tidak disalin tangan
    include /etc/nginx/snippets/proxy-routes.conf;

    # SPA fallback (pelajaran 6)
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|svg|ico)$ {
        expires 30d;
        # add_header di location membatalkan warisan http -> sertakan ulang
        include /etc/nginx/snippets/security-headers.conf;
    }
}
```

| Directive | Context | Peran dalam desain modular |
|-----------|---------|----------------------------|
| `include` | semua | Titik penyusun modular: conf.d, snippets, env |
| `limit_req_zone` | `http` | Zone dipakai banyak `location` via snippet |
| `log_format` | `http` | Satu format untuk seluruh layanan |
| `expires` / `add_header` | `server`/`location` | Warisan terputus di level yang mendefinisikan `add_header` sendiri |

---

## Lab

Pastikan lab hidup, lalu **uji graceful reload saat trafik berjalan** — inti Tahap 12:

```bash
cd examples/nginx-lab
bash scripts/gen-certs.sh
podman compose up -d

# Bukti konfigurasi benar-benar termodular (jumlah file yang ikut dimuat)
podman exec nginx-lab nginx -T | grep -c 'configuration file'

# Trafik 300 request berjalan di latar belakang, sambil kita reload
( for i in $(seq 1 300); do
    curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/
  done > /tmp/reload-status.txt ) &

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -s reload
wait
sort /tmp/reload-status.txt | uniq -c
```

**Ekspektasi:** `nginx -t` → `syntax is ok` / `test is successful`; penghitung `nginx -T` ≥ 4 (ada `nginx.conf`, `app.conf`, `api.conf`, plus snippet yang di-include); hasil `uniq -c` hanya menampilkan **`300 200`** — tidak ada request yang gagal karena reload. Uji juga sisi keamanannya: konfigurasi rusak harus **ditolak**, bukan dimuat.

```bash
podman exec -i nginx-lab sh -c 'echo "directive_ngawur;" > /etc/nginx/conf.d/99-broken.conf'
podman exec nginx-lab nginx -t        # → FAILED, jangan reload!
podman exec nginx-lab rm /etc/nginx/conf.d/99-broken.conf
podman exec nginx-lab nginx -t        # → syntax is ok lagi
```

**Ekspektasi:** `nginx -t` pertama gagal dengan `unknown directive`; traffic tetap dilayani konfigurasi lama selama kamu tidak memaksakan reload.

---

## Kesalahan umum

- Menumpuk semua `server` di `nginx.conf` → sulit direview, mudah konflik saat tim bertambah.
- Menamai file `baru.conf`, `fix2.conf` → tidak terbaca urutannya; pakai prefix angka atau nama domain.
- Mengedit konfigurasi langsung di dalam container (apalagi mount `:ro`) → perubahan hilang saat container dibuat ulang.
- Lupa `nginx -t` sebelum reload → kalau gagal, konfigurasi lama tetap jalan tapi kamu tidak tahu perubahanmu belum pernah aktif.
- Mengira `add_header` di context `http` selalu ikut turun → salah; level yang mendefinisikan `add_header` sendiri memutus warisan.
- Mengira blue-green = perintah Nginx → itu pola deployment; di OSS perpindahannya lewat perubahan upstream/komposer.
- Menjanjikan angka benchmark laptop sebagai kapasitas produksi.

---

## Rangkuman

- **Modular** = `nginx.conf` tipis + `include conf.d/*.conf` + `snippets/` untuk yang dipakai berulang.
- **Konvensi penamaan** (prefix angka atau nama domain) membuat urutan baca dan review bisa ditebak siapa pun.
- **Graceful reload** (`nginx -t` → `nginx -s reload`) mengganti worker tanpa memutus koneksi; konfigurasi rusak selalu ditolak sebelum menyentuh trafik.
- **Blue-green** dan pemisahan environment adalah pola di atas Nginx; Nginx OSS menyediakan semua dasarnya.
- **Edge proxy** menggabungkan static + API satu domain dan memecah multi-service lewat Host/path.
- **OSS vs Plus**: deteksi kegagalan pasif vs aktif, tanpa API/dashboard — sisanya sama.
- **Review + dokumentasi** adalah bagian dari konfigurasi, bukan pekerjaan setelah deploy.

---

## Latihan

1. Dalam 5 menit, tunjukkan ke rekan: file mana yang kamu ubah saat menambah domain baru, dan mengapa `nginx.conf` tidak perlu disentuh.
2. Jelaskan perbedaan `nginx -t`, `nginx -s reload`, dan `systemctl restart nginx` dari sisi koneksi pengguna.
3. Susun daftar **3 hal** yang kamu dokumentasikan sebelum menyerahkan konfigurasi Nginx ke tim operasional.

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **Modular config** | Konfigurasi dipecah jadi file kecil yang di-`include`, bukan satu file raksasa. |
| **Snippet** | File potongan konfigurasi yang dipakai ulang di banyak tempat. |
| **Graceful reload** | Memuat konfigurasi baru tanpa memutus koneksi yang sedang berjalan. |
| **SIGHUP** | Sinyal yang dikirim `nginx -s reload` ke master untuk reload. |
| **Edge proxy** | Titik pertama yang menerima trafik dari luar; tempat TLS, routing, dan proteksi dipasang. |
| **Blue-green deployment** | Dua set layanan identik, perpindahan trafik dilakukan seketika ke set baru. |
| **Capacity planning** | Menghitung kapasitas dari pengukuran beban lalu menyisakan headroom. |
| **Headroom** | Cadangan kapasitas di atas beban rata-rata untuk lonjakan tak terduga. |
| **Nginx Plus** | Edisi komersial: health check aktif, API/dashboard, rekonfigurasi dinamis. |

**Lanjut ke [Pelajaran 18 — Capstone: Gateway Nginx →](18-capstone-gateway-nginx.md)**
