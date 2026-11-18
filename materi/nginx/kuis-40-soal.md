# 📝 Kuis Nginx — 40 Soal

> **Cara pakai:** kerjakan seluruh soal **tanpa membuka materi dulu**, dan **tandai soal yang kamu ragu** — jujur pada diri sendiri lebih berguna daripada skor tinggi yang dibantu. Kuis ini berisi **40 soal pilihan ganda** (A–D) yang tersebar merata di 18 pelajaran.
>
> **Skor kamu:**
> - **30–40 = Mahir** — paham konsep sampai praktik, boleh langsung ke capstone.
> - **20–29 = Perlu ulang pelajaran X** — lihat soal mana yang salah, lalu baca ulang pelajaran yang tertulis di judul soal itu.
> - **< 20 = Ulang dari pelajaran 1** — baca berurutan perlahan, jangan buru-buru ke materi lanjutan.
>
> Buka [Kunci Jawaban](#kunci-jawaban) **setelah** selesai; kolom pembahasan menjelaskan *kenapa* jawabannya benar.

### No. 1 — Nginx sebagai reverse proxy (Pelajaran 1)
Dalam analogi restoran, Nginx yang berdiri di depan beberapa server aplikasi lalu meneruskan request ke salah satu di antaranya paling menyerupai...

- A. Dapur yang memasak makanan
- B. Pelayan yang menerima pesanan lalu meneruskannya ke dapur
- C. Koki yang menyiapkan makanan
- D. Pemilik restoran yang mencatat keuangan

### No. 2 — Peran utama Nginx (Pelajaran 1)
Manakah yang **BUKAN** termasuk peran utama Nginx versi open source?

- A. Menyajikan file statis seperti HTML, CSS, dan gambar
- B. Menjadi reverse proxy di depan backend aplikasi
- C. Menyimpan data relasional seperti basis data SQL
- D. Membagi beban ke beberapa server (load balancing)

### No. 3 — Master process (Pelajaran 2)
Apa tugas utama **master process** dalam arsitektur Nginx?

- A. Menangani setiap request HTTP dari client secara langsung
- B. Membaca dan memvalidasi konfigurasi, lalu memulai serta mengelola worker process
- C. Menyimpan hasil cache ke disk
- D. Menyeimbangkan beban secara round-robin ke upstream

### No. 4 — Arsitektur event-driven (Pelajaran 2)
Kenapa hanya beberapa worker process Nginx bisa menangani puluhan ribu koneksi sekaligus?

- A. Karena arsitektur event-driven non-blocking: satu worker menunggu banyak koneksi tanpa membuat thread baru per koneksi
- B. Karena setiap koneksi selalu mendapatkan thread sendiri dari master
- C. Karena semua request diantre dan dijalankan satu per satu oleh master
- D. Karena Nginx otomatis menambah worker setiap kali RAM tersedia

### No. 5 — Context main (Pelajaran 3)
Di mana letak context `main` pada file `nginx.conf`?

- A. Di dalam blok `events { }`
- B. Di dalam blok `http { }`
- C. Di dalam blok `server { }`
- D. Di area top-level file, yaitu di luar semua blok `{ }`

### No. 6 — Scope & inheritance (Pelajaran 3)
`access_log /var/log/nginx/access.log;` ditulis di context `http`, sedangkan tidak ada `access_log` sama sekali di dalam `server` block. Apa yang terjadi?

- A. Server block tersebut tidak mendapatkan log apa pun
- B. Konfigurasi dianggap tidak valid saat reload
- C. Server block mewarisi `access_log` dari context induknya
- D. Log hanya aktif jika ada `location` yang menuliskannya ulang

### No. 7 — Validasi dengan nginx -t (Pelajaran 4)
Apa fungsi perintah `nginx -t`?

- A. Langsung menerapkan konfigurasi baru ke proses yang sedang berjalan
- B. Memeriksa sintaks dan validitas konfigurasi tanpa mengubah proses Nginx yang berjalan
- C. Merestart seluruh worker process
- D. Menghapus seluruh file log lama

### No. 8 — Reload vs restart (Pelajaran 4)
Saat traffic sedang ramai, kamu menjalankan `nginx -s reload`. Apa yang terjadi pada worker process lama?

- A. Dipaksa mati seketika sehingga koneksi client terputus
- B. Semua koneksi client langsung ditutup
- C. Container Nginx dihapus dan dibuat ulang
- D. Worker lama berhenti menerima koneksi baru lalu menyelesaikan request yang sedang berjalan

### No. 9 — Melihat konfigurasi dengan nginx -T (Pelajaran 4)
Kamu ingin melihat hasil akhir seluruh konfigurasi aktif, termasuk semua file yang masuk lewat `include`. Perintah yang tepat adalah...

- A. `nginx -T`
- B. `nginx -t`
- C. `nginx -s quit`
- D. `nginx -s reload`

### No. 10 — root vs alias (Pelajaran 5)
Dengan konfigurasi `location /img/ { alias /data/images/; }`, request ke `/img/logo.png` akan dilayani dari file...

- A. `/data/images/img/logo.png`
- B. `/img/data/images/logo.png`
- C. `/data/images/logo.png`
- D. `/data/logo.png`

### No. 11 — autoindex (Pelajaran 5)
Directive `autoindex on;` pada sebuah location akan...

- A. Mengompres file sebelum dikirim ke client
- B. Menampilkan daftar file (directory listing) saat client membuka direktori yang tidak punya file index
- C. Mengindeks seluruh file ke dalam basis data
- D. Menyembunyikan nama file dari client

### No. 12 — Penyebab 403 (Pelajaran 6)
File `/var/www/private/rahasia.txt` benar-benar ada, tetapi saat diakses client menerima `403 Forbidden`. Penyebab paling mungkin adalah...

- A. File tidak ditemukan, jadi seharusnya 404
- B. Backend aplikasi sedang mati
- C. Sertifikat HTTPS belum diperbarui
- D. Proses Nginx tidak punya izin membaca file/direktori tersebut, atau path diblokir dengan `deny`

### No. 13 — SPA fallback dengan try_files (Pelajaran 6)
Dengan `location / { root /var/www/app; try_files $uri $uri/ /index.html; }`, client meminta `/dashboard/profile` yang tidak ada sebagai file. Apa yang terjadi?

- A. Nginx melakukan internal redirect ke `/index.html`, sehingga halaman utama aplikasi (SPA) yang dikirim
- B. Client langsung menerima 404
- C. Nginx mengembalikan 502
- D. Client di-redirect 301 ke `/`

### No. 14 — Urutan evaluasi location (Pelajaran 7)
Manakah urutan evaluasi `location` yang benar menurut dokumentasi nginx?

- A. Prefix terpanjang → regex → `=` → `^~`
- B. Urutan deklarasi di file → `=` → regex → prefix
- C. Exact `=` → prefix `^~` → regex `~`/`~*` sesuai urutan deklarasi → prefix terpanjang
- D. Regex selalu paling akhir, setelah semua prefix diperiksa

### No. 15 — Membaca location: mana yang menang (Pelajaran 7)
Dengan konfigurasi `location = /home { return 200 "exact"; }`, `location ~ ^/home/.*\.html$ { return 200 "regex"; }`, dan `location /home { return 200 "prefix"; }`, request ke `/home/index.html` akan dilayani oleh blok...

- A. `location = /home` (exact)
- B. `location ~ ^/home/.*\.html$` (regex)
- C. `location /home` (prefix)
- D. Tidak ada, client menerima 404

### No. 16 — Prioritas prefix ^~ (Pelajaran 7)
Sebuah URI kebetulan cocok dengan prefix location yang diberi awalan `^~` **dan** juga cocok dengan salah satu regex location. Blok mana yang dipakai?

- A. Regex, karena regex selalu menang
- B. Blok yang paling akhir ditulis di file
- C. Keduanya dijalankan bergantian
- D. Prefix `^~`, karena tanda itu menghentikan pencarian regex

### No. 17 — Redirect permanen dengan return (Pelajaran 8)
Dengan konfigurasi `server { listen 80; return 301 https://$host$request_uri; }`, apa yang dilakukan Nginx?

- A. Merespons setiap request HTTP dengan redirect permanen 301 ke HTTPS, path dan query asli tetap dipertahankan
- B. Menyajikan website statis melalui port 80
- C. Meneruskan request ke upstream di port 443
- D. Mengubah seluruh response menjadi format JSON

### No. 18 — error_page (Pelajaran 8)
Dengan `error_page 404 /halaman-hilang.html;`, bagaimana Nginx menemukan `/halaman-hilang.html`?

- A. Client di-redirect eksternal sehingga alamat berubah di browser
- B. File dicari di direktori root milik backend aplikasi
- C. Nginx melakukan internal redirect ke URI itu, lalu location biasa yang menanganinya
- D. Halaman tidak pernah tampil karena 404 selalu diabaikan

### No. 19 — Default server (Pelajaran 9)
Satu `listen 80;` menampung beberapa `server` block. Request datang dengan header `Host: tidak-ada-domain-ini.test` yang tidak cocok dengan `server_name` mana pun. Block mana yang melayani?

- A. Server block terakhir yang dideklarasikan pada listen tersebut
- B. Server block pertama yang dideklarasikan pada `listen 80` tersebut (default server)
- C. Semua server block melayani secara bergantian
- D. Nginx langsung menolak dengan status 400

### No. 20 — Bentuk server_name (Pelajaran 9)
Manakah pola `server_name` yang **TIDAK** didukung Nginx?

- A. `www.example.com` (nama persis)
- B. `*.example.com` (wildcard di awal)
- C. `~^(?<sub>.+)\.example\.com$` (regex)
- D. `www.*.com` (wildcard di tengah nama)

### No. 21 — proxy_pass tanpa slash (Pelajaran 10)
Dengan `location /api/ { proxy_pass http://backend; }`, request `/api/users?id=7` diteruskan ke backend sebagai...

- A. `/users?id=7`
- B. `/id=7`
- C. `/api/users?id=7`
- D. `/api/`

### No. 22 — proxy_pass dengan slash (Pelajaran 10)
Dengan `location /api/ { proxy_pass http://backend/; }`, request `/api/users?id=7` diteruskan ke backend sebagai...

- A. `/users?id=7`
- B. `/api/users?id=7`
- C. `/api/users`
- D. `/`

### No. 23 — Error proxy_pass di location regex (Pelajaran 10)
`nginx -t` menampilkan error `proxy_pass cannot have uri part in location given by regular expression`. Konfigurasimu memakai `location ~ /api/(.*)` bersama `proxy_pass http://backend/new/;`. Cara memperbaiki yang benar:

- A. Menambahkan `default_server` pada `listen`
- B. Menggunakan location prefix (misalnya `location /api/`) **atau** menghapus bagian URI dari `proxy_pass`
- C. Menambahkan `proxy_http_version 1.1;`
- D. Mengubah port backend menjadi 443

### No. 24 — Header Host ke backend (Pelajaran 11)
Secara default header `Host` yang diteruskan Nginx adalah `$proxy_host` (sesuai `proxy_pass`). Agar backend menerima domain yang diketulis client, kamu menambahkan...

- A. `proxy_set_header Host $proxy_host;`
- B. `proxy_set_header X-Real-IP $host;`
- C. `proxy_set_header Host $upstream_addr;`
- D. `proxy_set_header Host $host;`

### No. 25 — 502 vs 504 (Pelajaran 11)
Client menerima `504 Gateway Timeout` dari Nginx, sementara halaman statis di server yang sama normal. Diagnosis paling tepat:

- A. Backend menerima koneksi tetapi tidak mengirim response hingga batas `proxy_read_timeout` tercapai
- B. Backend menolak koneksi (connection refused) — itu menyebabkan 502, bukan 504
- C. File halaman tidak ditemukan — itu menyebabkan 404
- D. Client melebihi batas rate limit — itu menyebabkan 503

### No. 26 — Algoritma default upstream (Pelajaran 12)
Dengan `upstream app { server 10.0.0.1:8080; server 10.0.0.2:8080; server 10.0.0.3:8080; }` tanpa parameter tambahan, algoritma apa yang dipakai?

- A. `least_conn`
- B. `ip_hash`
- C. Round-robin (default Nginx)
- D. Random dengan dua algoritma sekaligus

### No. 27 — max_fails & fail_timeout (Pelajaran 12)
Directive `server backend-1:8080 max_fails=3 fail_timeout=30s;` berarti...

- A. Backend dimatikan selamanya setelah gagal 3 kali
- B. Setelah gagal 3 kali dalam periode `fail_timeout`, server dianggap tidak tersedia selama 30 detik
- C. Request ketiga selalu dialihkan ke backend lain tanpa syarat
- D. Setiap request dipaksa selesai dalam 30 detik

### No. 28 — Health check OSS vs Plus (Pelajaran 12)
Fitur **active health check** — Nginx mengganti server yang mati tanpa menunggu request gagal — tersedia pada...

- A. Nginx open source saja
- B. Keduanya, hanya namanya berbeda
- C. Nginx open source asalkan memakai block `upstream`
- D. Nginx Plus; versi OSS hanya punya deteksi kegagalan pasif (`max_fails`/`fail_timeout`)

### No. 29 — Konfigurasi minimum HTTPS (Pelajaran 13)
Konfigurasi minimum agar sebuah server menjalankan HTTPS adalah...

- A. `listen 443 ssl;` plus `ssl_certificate` dan `ssl_certificate_key`
- B. `listen 80;` saja, HTTPS menyala otomatis
- C. `server_name` yang benar saja
- D. `ssl_protocols TLSv1.2;` tanpa sertifikat

### No. 30 — HSTS (Pelajaran 13)
Kamu menambahkan header `Strict-Transport-Security: max-age=31536000` pada respons HTTPS. Apa efeknya ke browser?

- A. Browser langsung memakai HTTP biasa selama setahun
- B. Browser menolak sertifikat self-signed
- C. Browser memaksa koneksi HTTPS untuk domain itu selama masa berlaku, jadi HTTPS harus benar-benar siap sebelum mengaktifkannya
- D. Sertifikat diperpanjang otomatis oleh Nginx

### No. 31 — Cache status HIT/MISS (Pelajaran 14)
Kamu menambahkan `add_header X-Cache-Status $upstream_cache_status always;` dan respons menampilkan `X-Cache-Status: HIT`. Artinya...

- A. Request melewati cache untuk pertama kali sehingga terjadi miss
- B. Response diambil dari cache Nginx tanpa memanggil backend
- C. Backend mengembalikan error
- D. Cache dimatikan untuk request ini

### No. 32 — gzip_types default (Pelajaran 14)
Konfigurasi hanya berisi `gzip on;` tanpa `gzip_types ...`. File mana yang dikompresi Nginx?

- A. Semua file, termasuk gambar dan video
- B. Hanya file yang diakhiri `.html`
- C. Semua file teks seperti `.css`, `.js`, dan `.json`
- D. Hanya `text/html` (default `gzip_types`); tipe lain harus ditambahkan manual

### No. 33 — Status saat limit_req (Pelajaran 15)
Dengan `limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;` dan `limit_req zone=one burst=20 nodelay;`, saat rate dan burst terlampaui status apa yang **secara default** dikirim Nginx?

- A. 429 Too Many Requests
- B. 403 Forbidden
- C. 503 Service Temporarily Unavailable
- D. 400 Bad Request

### No. 34 — allow & deny (Pelajaran 15)
Dengan `location /admin/ { allow 10.0.0.0/8; deny all; }`, request datang dari IP `203.0.113.5` (di luar 10.0.0.0/8). Apa yang diterima client?

- A. 403 Forbidden
- B. 200 OK, karena `allow` selalu dicek lebih dulu
- C. 404 Not Found
- D. 502 Bad Gateway

### No. 35 — request_time vs upstream_response_time (Pelajaran 16)
Di log terlihat `request_time` sangat besar, tetapi `upstream_response_time` kecil. Kesimpulan yang tepat:

- A. Backend sangat lambat memproses
- B. Waktu habis di sisi client/Nginx (misalnya upload lambat atau koneksi client lambat), bukan di backend
- C. Resolusi DNS ke upstream gagal
- D. Cache terus menerus menghasilkan miss

### No. 36 — Status 499 (Pelajaran 16)
Access log menampilkan status `499`. Artinya...

- A. Nginx gagal membuka file log
- B. Backend menolak koneksi
- C. Halaman tidak ditemukan
- D. Client menutup koneksi sebelum Nginx selesai mengirim response, sering karena backend lambat

### No. 37 — Snippets & include (Pelajaran 17)
Kamu membuat `snippets/proxy-headers.conf` lalu menulis `include snippets/proxy-headers.conf;` di dalam sebuah `server` block. Apa yang terjadi saat konfigurasi dimuat?

- A. File include hanya bisa dibaca jika Nginx dijalankan sebagai root
- B. Directive di dalamnya otomatis menjadi global untuk semua context
- C. Isi file disisipkan (di-expand) tepat di titik `include`, sehingga scope-nya mengikuti context tempat `include` diletakkan
- D. Include hanya berlaku di context `main`

### No. 38 — Graceful reload saat traffic (Pelajaran 17)
Konfigurasi baru sudah lolos `nginx -t` dan traffic sedang berjalan. Langkah paling aman berikutnya adalah...

- A. `nginx -s reload` — worker baru dibuat sementara worker lama menyelesaikan request yang berjalan
- B. `systemctl restart nginx` langsung agar cepat
- C. Menghapus container lalu membuat yang baru
- D. Mematikan semua worker sebelum memulai yang baru

### No. 39 — Routing di capstone (Pelajaran 18)
Dengan `location / { root /var/www/site; }` dan `location /api/ { proxy_pass http://api_upstream/; }` yang berisi 3 backend, request `/api/orders` akan...

- A. Disajikan dari `/var/www/site/api/orders`
- B. Diteruskan ke backend sebagai `/api/orders`
- C. Diarahkan ke `index.html`
- D. Diteruskan ke salah satu server di `api_upstream` sebagai `/orders`, karena bagian `/api/` digantikan

### No. 40 — Diagnosis 502 di capstone (Pelajaran 18)
Di capstone, halaman statis `/` normal tetapi `/api/` selalu membalas 502. Urutan diagnosis paling tepat:

- A. Mengganti seluruh versi Nginx dan menulis ulang konfigurasi dari nol
- B. Baca `error_log` Nginx, cek apakah port upstream hidup dan benar, lalu jalankan `nginx -t` sebelum reload
- C. Menghapus cache browser lalu mencoba lagi
- D. Mengubah `server_name` menjadi domain lain

## Kunci Jawaban

| No | Jawaban | Pembahasan |
|----|---------|------------|
| 1 | B | Reverse proxy menerima request client lalu meneruskannya ke backend — persis peran pelayan yang meneruskan pesanan ke dapur. |
| 2 | C | Nginx adalah web server/proxy/load balancer, bukan penyimpan data; menyimpan data relasional adalah pekerjaan basis data. |
| 3 | B | Master bertugas membaca konfigurasi dan mengelola worker (fork, reconfigure, sementara request ditangani worker). |
| 4 | A | Model event-driven non-blocking membuat satu worker dapat menunggu ribuan koneksi tanpa membuat thread per koneksi. |
| 5 | D | Context `main` adalah area top-level di luar semua blok, karena `nginx.conf` tidak punya blok `main` eksplisit. |
| 6 | C | Directive diwarisi dari context induk bila tidak didefinisikan pada level saat ini, jadi `server` mewarisi `access_log` dari `http`. |
| 7 | B | `nginx -t` hanya memvalidasi konfigurasi ke file dan tidak menyentuh proses Nginx yang sedang berjalan. |
| 8 | D | Reload bersifat graceful: worker lama berhenti menerima koneksi baru tetapi menyelesaikan request yang sudah berjalan. |
| 9 | A | `nginx -T` mencetak hasil akhir seluruh konfigurasi termasuk semua file `include`, sedangkan `-t` hanya validasi. |
| 10 | C | `alias` menggantikan bagian URI yang cocok dengan location, jadi `/img/` diganti menjadi `/data/images/`. |
| 11 | B | `autoindex on` menampilkan daftar file ketika direktori dibuka dan tidak ada `index` yang bisa disajikan. |
| 12 | D | 403 berarti akses ditolak karena izin user Nginx atau aturan `deny`, berbeda dengan 404 yang berarti file tidak ada. |
| 13 | A | `try_files` mencoba tiap argumen berurutan dan `/index.html` terakhir dipakai sebagai internal redirect — pola standar SPA. |
| 14 | C | Urutan resmi nginx: exact `=` → prefix `^~` → regex sesuai urutan deklarasi → prefix terpanjang untuk sisanya. |
| 15 | B | Exact tidak cocok untuk `/home/index.html`, lalu regex diperiksa setelah exact dan cocok sebelum prefix dipakai. |
| 16 | D | Tanda `^~` menandai prefix yang begitu cocok pencarian regex dihentikan dan prefix itulah yang dipakai. |
| 17 | A | `return 301` mengirim redirect permanen dengan `$request_uri`, sehingga path dan query asli tetap ada di URL baru. |
| 18 | C | `error_page` memicu internal redirect ke URI baru yang kemudian diproses location biasa, tanpa mengubah URL di browser. |
| 19 | B | Tanpa flag `default_server`, server pertama pada `listen` tersebut menjadi default untuk Host yang tidak cocok. |
| 20 | D | Wildcard Nginx hanya boleh di awal atau akhir nama, tidak boleh di tengah seperti `www.*.com`. |
| 21 | C | `proxy_pass` tanpa bagian URI membuat request diteruskan ke backend persis seperti bentuk aslinya. |
| 22 | A | `proxy_pass` yang diakhiri `/` menggantikan bagian URI yang cocok dengan location, jadi `/api/` menjadi `/`. |
| 23 | B | `proxy_pass` tidak boleh memiliki bagian URI di location regex; pindah ke location prefix atau hapus URI-nya. |
| 24 | D | `$host` diambil dari header Host client, sedangkan default `Host` yang dikirim adalah `$proxy_host` dari `proxy_pass`. |
| 25 | A | 504 berarti backend terhubung tapi tidak menanggung hingga `proxy_read_timeout`, sedangkan 502 = backend tak terhubungi/tak valid. |
| 26 | C | Tanpa `least_conn`, `ip_hash`, atau `random`, block `upstream` Nginx memakai round-robin sebagai default. |
| 27 | B | Setelah tercapai `max_fails` kegagalan dalam periode `fail_timeout`, server dianggap tidak tersedia selama `fail_timeout`. |
| 28 | D | Active health check adalah fitur Nginx Plus; versi OSS hanya punya deteksi pasif lewat `max_fails`/`fail_timeout`. |
| 29 | A | HTTPS menuntut `listen 443 ssl;` plus pasangan `ssl_certificate` dan `ssl_certificate_key`. |
| 30 | C | HSTS memaksa browser memakai HTTPS selama `max-age`, jadi aktifkan hanya setelah HTTPS benar-benar siap. |
| 31 | B | `$upstream_cache_status` bernilai `HIT` berarti response diambil dari cache proxy Nginx tanpa memanggil backend. |
| 32 | D | Default `gzip_types` hanya berisi `text/html`; tipe lain harus dinyatakan secara eksplisit. |
| 33 | C | Default `limit_req_status` adalah 503, bukan 429 seperti yang sering diasumsikan. |
| 34 | A | Aturan `allow`/`deny` dicek berurutan, dan `deny all` menangkap IP di luar `allow` sehingga client itu menerima 403. |
| 35 | B | `request_time` dihitung dari request pertama client hingga response terakhir Nginx, jadi selisihnya menunjukkan waktu di luar backend. |
| 36 | D | 499 adalah kode khusus Nginx saat client menutup koneksi sebelum response selesai dikirim. |
| 37 | C | `include` menyisipkan isi file saat konfigurasi dimuat, sehingga scope mengikuti context tempat `include` ditulis. |
| 38 | A | Reload membuat worker baru sementara worker lama menyelesaikan request berjalan — inilah graceful reload tanpa downtime. |
| 39 | D | `proxy_pass` ber-`/` menggantikan `/api/` menjadi `/`, lalu request disebar ke salah satu backend di upstream. |
| 40 | B | 502 pada path proxy menandakan masalah di sisi upstream, jadi mulai dari `error_log` dan cek backend sebelum reload. |

**Selesai! → kembali ke [Daftar Pelajaran](README.md)**
