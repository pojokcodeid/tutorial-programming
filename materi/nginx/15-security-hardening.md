# Pelajaran 15 — Security Hardening

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 6 (403/404), 13 (HTTPS), dan container `nginx-lab` yang bisa dijalankan (Pelajaran 3–4).

---

## Tujuan belajar

- Menutup informasi berlebih dengan `server_tokens` dan menerapkan **least privilege** pada container Nginx.
- Membatasi akses per IP (`allow`/`deny`), per path (dotfiles, `/private`, `/admin`), dan per method (`limit_except`).
- Menerapkan **rate limit** (`limit_req_zone`+`limit_req`), **connection limit** (`limit_conn_zone`+`limit_conn`), dan `client_max_body_size` — beserta cara menguji burst-nya.
- Memasang security headers, TLS hardening, dan HSTS; serta menjelaskan batas Nginx: ia pagar, **bukan pengganti authorization aplikasi**.

---

## Cerita pembuka: rumah aman itu tiga lapis

Menyimpan uang di rumah bukan cuma soal gembok pintu: **pagar** menentukan siapa boleh masuk halaman, **satpam** menolak tamu yang datang berbondong-bondong, **lemari besi** menjaga barang berharga, dan pintu belakang tidak pernah dibiarkan terbuka. Hardening bukan satu setting ajaib, tapi puluhan hal kecil yang menutup celah satu per satu.

| Di rumah | Di Nginx |
|---|---|
| Pagar & gerbang | `allow` / `deny`, `limit_except` |
| Satpam anti-kerumunan | `limit_req`, `limit_conn` |
| Ukuran koper yang boleh lewat | `client_max_body_size` |
| Nama plate pintu & laci terbuka | `server_tokens off`, blok `.git`/`.env`/`/private` |

Bentuk penyaringan satu request dari luar ke dalam:

```text
request ─┬─ allow/deny ─────── 403 (IP)          limit_except ── 403 (method)
         ├─ limit_req ──────── 503 (laju)        client_max_body_size ── 413
         ├─ limit_conn ─────── 503 (koneksi)     setelah lolos semua:
         └─ location ───────── 200 konten  |  403 dotfile (`.env`, `/private`)
```

---

## `server_tokens` dan least privilege

`server_tokens on|off|build|string` (default `on`) mengendalikan baris `Server:` dan versi pada halaman error 4xx/5xx. Versi yang terekspos memberi petunjuk ke pelaku scan: "nginx/1.27.0 — ada CVE belum patch?".

| Directive | Efek |
|---|---|
| `server_tokens off` | `Server: nginx` tanpa versi; halaman error juga tanpa versi |
| `server_tokens build` | versi + nama build (1.11.10) |
| `server_tokens "web-$hostname"` | teks kustom (khusus Nginx Plus/komersial) |

**Least privilege** = beri Nginx sesedikit mungkin: worker jalan sebagai user `nginx` bukan root (bawaan image; jangan ditimpa `user root;`), konten & konfigurasi baca-saja bagi container, hanya port 80/443 yang diekspos (upstream di jaringan internal), dan secret diberi permission `600` bukan `644`.

## `allow`/`deny` dan proteksi path

| Directive | Konteks | Arti |
|---|---|---|
| `allow <IP/CIDR>\|all` | http, server, location, limit_except | izinkan |
| `deny <IP/CIDR>\|all` | idem | tolak |

Aturan dibaca **dari atas dan berhenti pada kecocokan pertama**, jadi `allow` harus ditulis **sebelum** `deny all;`. Ada minimal satu `allow`/`deny` di lokasi itu → aturan dari level atas tidak diwariskan:

```nginx
location /admin/ {
    allow 10.0.0.0/8;
    deny  all;              # kalau baris ini di atas, semua orang ditolak
}
# file rahasia cukup satu regex; negative lookahead menyisakan
# /.well-known/acme-challenge/... tetap terbaca (renewal Let's Encrypt)
location ~ /\.(?!well-known) { deny all; }   # .env, .git, .htaccess, .DS_Store
location /private/           { deny all; }
```

Perlindungan file di Nginx hanya menolak **baca lewat HTTP**; permission di disk tetap wajib dan `autoindex off` (default) jangan dinyalakan di direktori publik.

## Rate limit dan connection limit

```nginx
# dua-duanya HANYA boleh di konteks http
limit_req_zone  $binary_remote_addr zone=req10:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=addr1:10m;
server {
    location /api/ {
        limit_req  zone=req10 burst=5;   # default burst=0
        limit_conn addr1 2;              # maks 2 koneksi bersamaan per IP
    }
}
```

| Directive | Fungsi | Bila melanggar |
|---|---|---|
| `limit_req_zone key zone=name:size rate=rate` | membuat zona status di RAM (`http`) | — |
| `limit_req zone=.. burst=n [nodelay]` | batasi laju request per key | **503**, log `limiting requests` |
| `limit_conn_zone key zone=name:size` | membuat zona koneksi (`http`) | — |
| `limit_conn zone number` | maks koneksi simultan per key | **503**, log `limiting connections` |

Tanpa `nodelay`, request melebihi burst **diantrikan (di-delay)**; begitu meledak melewati burst → ditolak. Ubah kode penolakan dengan `limit_req_status 429;`/`limit_conn_status 503;`. `$binary_remote_addr` hanya 4 byte untuk IPv4 — jauh lebih hemat daripada `$remote_addr`; sesuaikan `size` zona dengan jumlah klien.

## Batasi body, method, dan endpoint sensitif

| Directive | Default | Peran |
|---|---|---|
| `client_max_body_size 1m` | `1m` | body melebihi batas → **413**; `0` = pemeriksaan dimatikan |
| `limit_except GET HEAD { deny all; }` | — | semua method selain GET/HEAD ditolak (HEAD ikut saat GET ditulis) |

Endpoint sensitif dikunci berlapis: `allow/deny` sebagai pagar kasar, lalu `auth_basic` (opsional) satu lapis lagi — `auth_basic "Restricted";` plus `auth_basic_user_file /etc/nginx/.htpasswd;` dengan permission file `600`.

## Security headers

| Header | Nilai contoh | Fungsi |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | larang browser menebak tipe konten (anti MIME sniffing) |
| `X-Frame-Options` | `SAMEORIGIN` | anti clickjacking (generasi lama, pelengkap CSP) |
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'self'` | resource mana yang boleh dimuat; mulai longgar, perketat bertahap |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | sembunyikan URL lengkap saat pindah domain |

Dua aturan baca wajib: (1) selalu pakai parameter **`always`** agar header ikut terkirim pada 403/404; (2) **satu `add_header` di sebuah location membuat seluruh `add_header` warisan dari level atas gugur** untuk lokasi itu — daftarkan ulang semuanya.

## TLS hardening dan HSTS

```nginx
ssl_protocols TLSv1.2 TLSv1.3;                      # 1.0/1.1 sudah usang
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_session_cache shared:SSL:10m;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

TLS 1.2/1.3 + cipher default yang sudah dibersihkan menutup protokol lawas; HSTS mengunci browser ke HTTPS. Seperti di Pelajaran 13: `includeSubDomains` menyeret semua subdomain — nyalakan hanya setelah semuanya siap HTTPS.

## Secret management, update, dan pinning image

```bash
chmod 600 ~/nginx-lab/certs/localhost.key        # kunci privat: hanya pemilik
printf 'certs/\n*.key\n*.env\n.htpasswd\n' >> .gitignore
podman pull docker.io/library/nginx:1.27-alpine  # tag versi eksplisit, bukan latest
podman images --digests docker.io/library/nginx  # catat sha256-nya → run image@sha256:...
```

- Simpan secret sebagai **file/secret yang di-mount read-only**, bukan variabel lingkungan (env mudah terbaca lewat `podman inspect`/`/proc`); pisahkan konfigurasi rahasia ke file kecil (`include /etc/nginx/snippets/secrets.conf;`) agar tidak ikut ter-commit.
- `latest` berubah diam-diam: pin **tag versi** lalu **digest** untuk hasil yang bisa direproduksi dan diaudit.
- Jadwalkan rebuild + cek advisori (renovate/dependabot, `podman pull` berkala) — hardening percuma kalau versinya basi.

## Nginx bukan pengganti authorization aplikasi

Nginx tahu IP, path, method, ukuran body, dan laju request; Nginx **tidak tahu** peran user, kepemilikan data, atau sisa saldo rekening. `allow/deny` adalah otorisasi kasar satu lapis: hak akses per user/role/objek tetap di aplikasi (session, RBAC, cek kepemilikan), `X-Forwarded-For` mentah tidak boleh dipercaya untuk `allow/deny` (client bisa memalsukannya), dan backend **hanya** boleh bisa diakses dari Nginx — kalau backend terbuka ke jaringan, semua aturan di pelajaran ini gampang dilewati.

---

## Contoh konfigurasi

```nginx
# di dalam konteks http (nginx.conf atau file yang di-include)
limit_req_zone  $binary_remote_addr zone=req10:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=addr1:10m;

server {
    server_name localhost;
    root /usr/share/nginx/html;
    server_tokens off;
    client_max_body_size 1m;
    add_header X-Content-Type-Options  "nosniff" always;
    add_header X-Frame-Options         "SAMEORIGIN" always;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'" always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    location ~ /\.(?!well-known) { deny all; }
    location /private/           { deny all; }
    location /admin/             { allow 10.0.0.0/8; deny all; }
    location /api/               { limit_req zone=req10 burst=5; limit_except GET HEAD { deny all; } try_files $uri =404; }
    location /download/          { limit_conn addr1 2; limit_rate 500k; try_files $uri =404; }
}
```

| Directive | Penjelasan |
|---|---|
| `limit_req_zone` / `limit_conn_zone` | wajib di `http`; `nginx -t` menolaknya di `server{}`. |
| `allow` lalu `deny all` | urutan penting — kecocokan pertama menang. |
| `burst=5` | sediakan antrian 5 request; tanpa `burst` nilainya 0 dan request wajar bisa kena. |
| `limit_except GET HEAD` | konten tetap bisa di-GET; POST/PUT/DELETE/... diblokir total. |
| `try_files $uri =404` | konten nyata; jangan pakai `return` di lokasi berisi `deny` (lihat Kesalahan umum). |

---

## Lab

Container siap pakai, file uji, lalu konfigurasi hardening:

```bash
podman rm -f nginx-lab 2>/dev/null; podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
podman exec nginx-lab sh -c 'rm -f /etc/nginx/conf.d/default.conf
mkdir -p /usr/share/nginx/html/private /usr/share/nginx/html/admin /usr/share/nginx/html/api /usr/share/nginx/html/.well-known/acme-challenge /usr/share/nginx/html/.git
echo RAHASIA > /usr/share/nginx/html/.env;  echo cfg  > /usr/share/nginx/html/.git/config
echo token   > /usr/share/nginx/html/.well-known/acme-challenge/tok123
echo ADMIN   > /usr/share/nginx/html/admin/index.html;  echo OK > /usr/share/nginx/html/api/hello.txt;  echo HALO > /usr/share/nginx/html/private/inbox.txt'

podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/15-hardening.conf' <<'NGINX'
limit_req_zone  $binary_remote_addr zone=req10:10m rate=10r/s;
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    server_tokens off;
    client_max_body_size 1k;
    add_header X-Content-Type-Options  "nosniff" always;
    add_header X-Frame-Options         "SAMEORIGIN" always;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'" always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    location ~ /\.(?!well-known) { deny all; }
    location /private/           { deny all; }
    location /admin/             { allow 127.0.0.1; deny all; }
    location /api/               { limit_req zone=req10 burst=5; limit_except GET HEAD { deny all; } try_files $uri =404; }
    location /                   { try_files $uri $uri/ =404; }
}
NGINX

podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload && sleep 1
```

**Ekspektasi:** `nginx -t` → `syntax is ok, test is successful`. Lalu uji bertahap — identitas, akses, method, sampai burst:

```bash
# 1) identitas + header keamanan -> Server: nginx (tanpa versi) + 4 header keamanan
curl -s -D - -o /dev/null http://localhost:8080/ | grep -iE '^server|x-content-type|x-frame|content-security|referrer'

# 2) file & path terlarang -> urutannya: 403, 403, 403, 200, 200
for p in /.env /.git/config /private/inbox.txt /.well-known/acme-challenge/tok123 /api/hello.txt; do
  printf '%s -> ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080$p; done

# 3) IP-mu belum diizinkan (403), lalu izinkan lewat sed (200)
curl -s -o /dev/null -w 'admin sebelum allow -> %{http_code}\n' http://localhost:8080/admin/
IP=$(podman logs --tail 20 nginx-lab 2>&1 | grep '"GET' | tail -1 | awk '{print $1}')   # gateway podman, bukan 127.0.0.1
podman exec nginx-lab sed -i "s|allow 127.0.0.1;|allow $IP;|" /etc/nginx/conf.d/15-hardening.conf
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload && sleep 1   # tunggu worker baru aktif
curl -s -o /dev/null -w 'admin sesudah allow -> %{http_code}\n' http://localhost:8080/admin/

# 4) method & body -> urutannya: 200, 403 (limit_except), 413 (client_max_body_size 1k)
printf 'GET  /api    -> '; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/hello.txt
printf 'POST /api    -> '; curl -s -o /dev/null -w '%{http_code}\n' -X POST -d 'abc' http://localhost:8080/api/hello.txt
printf 'POST body 4k -> '; curl -s -o /dev/null -w '%{http_code}\n' -X POST -d "$(yes | head -c 4096)" http://localhost:8080/api/hello.txt

# 5) burst: loop sekuensial tidak meledak (semua 200)...
sleep 3
for i in $(seq 1 6); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/hello.txt; done; echo
#    ...sementara 15 request PARALEL meledak melewati burst=5 -> ±6 dapat 200, sisanya 503 (urutan campur)
sleep 3
for i in $(seq 1 15); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/hello.txt & done; wait; echo
podman logs nginx-lab 2>&1 | grep -i 'limiting requests' | tail -2

# 6) setelah kuota pulih, request valid tetap dilayani
sleep 3
curl -s -o /dev/null -w 'beranda -> %{http_code}\n' http://localhost:8080/; curl -s -o /dev/null -w 'api -> %{http_code}\n' http://localhost:8080/api/hello.txt
```

---

## Kesalahan umum

- `limit_req_zone`/`limit_conn_zone` ditulis di `server{}` → `nginx -t` gagal: kedua directive ini hanya boleh di konteks `http`.
- `deny all;` ditulis sebelum `allow <IP>;` → semua orang ditolak, termasuk IP yang kamu izinkan (kecocokan pertama menang).
- Lupa `burst` → `burst=0`, jadi satu request sedikit saja sudah 503; lalu mengujinya dengan loop sekuensial → kesimpulan keliru "limit tidak bekerja" — uji dengan request paralel.
- Menambah satu `add_header` di location → seluruh header keamanan warisan dari `server{}` hilang; dan tanpa `always` mereka absen pada 403/404.
- `client_max_body_size` terlalu kecil → upload user gagal 413 (browser sering tidak bisa menampilkan error ini dengan baik).
- Regex dotfiles tanpa pengecualian `(?!well-known)` → challenge Let's Encrypt ikut diblokir.
- `return 200 ...;` di lokasi yang juga memuat `deny all` → `return` jalan di fase rewrite sebelum fase akses, jadi `deny` terlewat percuma.
- `server_tokens off` saja tidak cukup kalau backend tetap menampilkan versi di header lain (`X-Powered-By`).

---

## Rangkuman

- `server_tokens off` menyembunyikan versi; least privilege = akses, permission, dan port sesedikit mungkin.
- `allow` **sebelum** `deny all` (kecocokan pertama menang); dotfiles diblokir regex dengan pengecualian `.well-known`.
- `limit_req_zone`+`limit_req` membatasi **laju**; `limit_conn_zone`+`limit_conn` membatasi **koneksi bersamaan**; keduanya menjawab 503 dan menulis `limiting ...` ke log.
- `client_max_body_size` menjawab 413; `limit_except GET HEAD { deny all; }` menutup method selain GET/HEAD.
- Security headers selalu pakai `always` dan didaftarkan ulang di tiap location yang memakai `add_header`.
- Kunci privat `600`, image di-pin per digest, `latest` tidak layak dipakai di produksi, dan **Nginx tetap pagar — bukan pengganti authorization aplikasi**.

---

## Latihan

1. Hapus baris `allow 127.0.0.1;` dari lokasi `/admin/`, uji lagi, lalu jelaskan kenapa hasilnya 403 baik sebelum maupun sesudah kamu menambah IP — dan mengapa `deny all;` harus tetap di urutan terakhir.
2. Ubah `rate=10r/s` menjadi `rate=1r/s`, ulangi loop paralel 15 request, dan bandingkan jumlah 503 — tunjukkan pula baris `limiting requests` pada `podman logs`.
3. Buat dokumen `upload.txt` di `/private/`, buktikan 403, lalu pindahkan ke `/public/` dan buktikan 200 tanpa mengubah konfigurasi Nginx sama sekali. Apa artinya bagi pemahamanmu soal "otorisasi di Nginx vs di aplikasi"?

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **`server_tokens`** | Sembunyikan/tampilkan versi Nginx di header dan halaman error. |
| **Least privilege** | Beri hak akses sesedikit mungkin untuk tugas itu. |
| **`allow` / `deny`** | Izin/tolak berdasarkan IP atau CIDR, dicek berurutan. |
| **`limit_req_zone`** | Zona RAM di `http` untuk menyimpan status laju request. |
| **`burst`** | Jumlah request berlebih yang masih diantrikan sebelum ditolak. |
| **`limit_conn_zone`** | Zona RAM untuk batas koneksi bersamaan per key. |
| **`client_max_body_size`** | Batas ukuran body request (413 bila dilewati). |
| **`limit_except`** | Batasi method HTTP tertentu dalam sebuah location. |
| **HSTS** | Header yang memaksa browser memakai HTTPS. |

**Lanjut ke [Pelajaran 16 — Logging & Troubleshooting →](16-logging-troubleshooting.md)**
