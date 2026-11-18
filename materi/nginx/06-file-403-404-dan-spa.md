# Pelajaran 6 — Permission, 403/404 & SPA Fallback

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 5 — Static Web Server (`root`, `alias`, `index`, `try_files`) dan Pelajaran 4 — Mengelola Konfigurasi (`nginx -t`, reload).

---

## Tujuan belajar

- Menjelaskan **siapa** yang membaca file di server Nginx dan kenapa permission menentukan.
- Membedakan penyebab **403** dan **404** lewat matriks keputusan.
- Memblokir path sensitif seperti `/private/`.
- Mengganti halaman error bawaan dengan **`error_page`**.
- Membuat **SPA fallback** dengan `try_files` tanpa memicu siklus internal redirect.

---

## Cerita pembuka: rak yang terkunci vs buku yang tidak ada

Malam ini kamu ke perpustakaan mencari buku *Sejarah Nusantara* di rak C-3.

- Rak C-3 ada, tapi bukunya tidak ada di rak → pustakawan bilang *"tidak ketemu."*
- Buku ada, tapi tersimpan di lemari terkunci dan kamu bukan petugasnya → pustakawan bilang *"tidak boleh."*

Dua jawaban yang **sama-sama mengecewakan, tapi diagnosis-nya beda jauh**: yang pertama **404** (alamatnya salah), yang kedua **403** (alamatnya benar, izinnya salah).

Di dunia server, membedakan keduanya adalah separuh ilmu troubleshooting. Salah baca, kamu akan muter-mener memperbaiki `root` padahal masalahnya `chmod`.

---

## Siapa yang membaca file?

```text
   Client  ──GET /index.html──▶  Nginx
                                  │
                          ┌───────┴────────┐
                          │ master process │  (root)
                          └───────┬────────┘
                                  │ fork
                          ┌───────┴────────┐
                          │ worker process │  (user nginx, dari `user nginx;`)
                          └───────┬────────┘
                                  │ open() + read()
                                  ▼
                       /usr/share/nginx/html/index.html
```

Di image resmi `nginx:alpine`, konfigurasi bawaannya memuat `user nginx;`. Master memang berjalan sebagai root, tetapi **worker-lah yang benar-benar membuka file** — dan worker memakai user `nginx`. Artinya:

| Objek di disk | Izin yang dibutuhkan | Kenapa |
|---|---|---|
| Folder di sepanjang path (mis. `.../html/docs/`) | **execute/search** (`x`) | worker harus bisa "melewati" folder itu |
| Folder (untuk `autoindex`) | **read** (`r`) | membaca daftar isi |
| File HTML/CSS/JS/gambar/download | **read** (`r`) | isi file dikirim ke client |

Untuk konten statis publik, `chmod 644 file` dan `chmod 755 folder` biasanya sudah lebih dari cukup.

---

## Matriks 403 vs 404

| Kondisi | Status | Petunjuk di error log |
|---|---|---|
| File tidak ada di path hasil `root`/`alias` | **404** | `open() ... failed (2: No such file or directory)` |
| File ada, tetapi worker tidak punya izin baca | **403** | `open() ... failed (13: Permission denied)` |
| Folder ada, tidak ada `index`, `autoindex off` | **403** | `directory index ... is forbidden` |
| Diblokir konfigurasi (`deny all` / `return 403`) | **403** | — (memang disengaja) |
| Lokasi ditandai `internal`, request datang dari luar | **404** | — |

Alur diagnosanya:

```text
muncul 403 atau 404?
│
├── 404  →  path hasil root/alias salah? typo? file belum ter-deploy?
│           cek:  podman exec nginx-lab nginx -T | grep -E 'root|alias'
│
└── 403  →  cek isi container:  podman exec nginx-lab ls -l /usr/share/nginx/html/
            ├── file tidak terbaca (mode 600/000)  → chmod 644
            ├── folder tanpa index                  → tambah index / autoindex on
            └── memang diblokir oleh konfigurasi    → itu memang disengaja ✓
```

## Memblokir path seperti `/private/`

Ada tiga cara umum, dari yang paling ringan:

```nginx
# 1. paling hemat: langsung berhenti, file tidak pernah dibuka
location /private/ {
    return 403;
}

# 2. memakai ngx_http_access_module (bawaan Nginx)
location ^~ /private/ {
    deny all;
}

# 3. hanya boleh lewat internal redirect (error_page, try_files, X-Accel-Redirect)
location /internal-reports/ {
    internal;
}
```

> ⚠️ Memblokir URL **bukan** berarti file hilang. File tetap ada di disk — jadi untuk data benar-benar rahasia, kombinasikan dengan permission file (`chmod 600`) **dan** jangan taruh di folder web sama sekali.

## Directive `error_page`

```nginx
error_page 404 /404.html;
error_page 403 404 /error.html;
```

Saat Nginx akan membalas kode itu, ia melakukan **internal redirect** ke URI yang ditentukan:

| Bentuk | Arti |
|---|---|
| `error_page 404 /404.html;` | pindah ke `/404.html`, **kode 404 tetap** |
| `error_page 404 =200 /empty.gif;` | kode diganti jadi 200 |
| `error_page 404 = @fallback;` | diproses di *named location* |
| `error_page 404 https://contoh.com/nf;` | **redirect keluar**, default balas 302 |

Catatan penting:

- Method diubah menjadi `GET` untuk semua method selain `GET`/`HEAD`.
- Pakai `location = /404.html { internal; }` agar halaman error tidak bisa dibuka langsung oleh client.
- `error_page` diwariskan ke context di bawahnya **hanya bila** level itu tidak mendefinisikan `error_page` sendiri.
- Nginx membatasi **10 internal redirect** per request untuk mencegah siklus; kalau lebih, keluar **500** dengan pesan `rewrite or internal redirection cycle`.

## SPA fallback dengan `try_files`

Aplikasi React/Vue/Angular adalah "satu file HTML" — semua route (`/app/dashboard`, `/app/settings`) harus jatuh ke `index.html`, lalu aplikasi yang menentukan halaman mana yang tampil.

```text
GET /app/dashboard
        │
        ▼
ada file /usr/share/nginx/html/app/dashboard?  ── ya → kirim file itu
        │ tidak
        ▼
ada direktori /usr/share/nginx/html/app/dashboard/? ── ya → index
        │ tidak
        ▼
internal redirect ke /app/index.html  →  200 (URL tetap /app/dashboard)
```

Aturan emas: **file aset (JS/CSS/gambar) tidak boleh ikut fallback.** Kalau `/app/assets/app.js` hilang dan ikut jatuh ke `index.html`, browser menerima HTML dengan status 200 — error-nya jadi sangat sulit ditemukan.

---

## Contoh konfigurasi

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Halaman error kustom, hanya bisa dipanggil internal
    error_page 404 /404.html;
    error_page 403 /403.html;
    location = /404.html { internal; }
    location = /403.html { internal; }

    # Path sensitif: tolak tanpa membuka file apa pun
    location /private/ {
        return 403;
    }

    # Aset SPA: kalau hilang, laporkan 404 apa adanya
    location /app/assets/ {
        try_files $uri =404;
    }

    # SPA: route apa pun jatuh ke index.html aplikasi
    location /app/ {
        try_files $uri $uri/ /app/index.html;
    }
}
```

| Directive | Peran |
|---|---|
| `error_page 404 /404.html` | mengganti halaman error bawaan Nginx |
| `internal` | halaman error tidak boleh dibuka langsung dari luar |
| `return 403` | blokir `/private/` sebelum file disentuh |
| `try_files $uri =404` | aset yang hilang tetap 404 (jujur, tidak ditutupi) |
| `try_files ... /app/index.html` | fallback SPA via internal redirect |

---

## Lab

Siapkan konten (termasuk file yang sengaja bermasalah):

```bash
mkdir -p web/app/assets web/kosong

printf '<!doctype html><title>Beranda</title><h1>Halaman utama</h1>\n' > web/index.html
printf '<!doctype html><title>404</title><h1>Halaman tidak ditemukan</h1>\n' > web/404.html
printf '<!doctype html><title>403</title><h1>Akses ditolak</h1>\n'        > web/403.html
printf '<!doctype html><title>SPA</title><div id="root"></div>\n<script src="/app/assets/app.js"></script>\n' > web/app/index.html
printf 'console.log("SPA jalan");\n' > web/app/assets/app.js
printf 'RAHASIA\n' > web/secret.txt
chmod 000 web/secret.txt          # sengaja tidak terbaca

mkdir -p nginx
cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;
    error_page 403 /403.html;
    location = /404.html { internal; }
    location = /403.html { internal; }

    location /private/ {
        return 403;
    }

    location /app/assets/ {
        try_files $uri =404;
    }

    location /app/ {
        try_files $uri $uri/ /app/index.html;
    }
}
EOF

podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 \
  -v "$PWD/web":/usr/share/nginx/html:ro,Z \
  -v "$PWD/nginx/default.conf":/etc/nginx/conf.d/default.conf:ro,Z \
  docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t
```

**Ekspektasi:** `nginx -t` → `syntax is ok` / `test is successful`.

Uji 403 karena permission (file ada, tapi `chmod 000`):

```bash
curl -I http://localhost:8080/secret.txt
podman logs nginx-lab 2>&1 | grep -i 'denied'
```

**Ekspektasi:** `HTTP/1.1 403 Forbidden`, `Content-Type: text/html` (halaman 403 kustom), dan log memuat `Permission denied`.

Uji 403 karena folder tanpa index, 404 karena file hilang, dan blokir path:

```bash
curl -I http://localhost:8080/kosong/            # 403 (autoindex off, tanpa index)
curl -I http://localhost:8080/tidak-ada.html     # 404 + isi 404.html
curl -I http://localhost:8080/private/rahasia.txt # 403
curl -s http://localhost:8080/tidak-ada.html | grep -o 'tidak ditemukan'
```

Uji SPA fallback dan proteksi halaman error:

```bash
curl -I http://localhost:8080/app/dashboard        # 200 — isi index.html SPA
curl -I http://localhost:8080/app/settings         # 200 — route lain, hasil sama
curl -s http://localhost:8080/app/dashboard | grep -o '<div id="root">'
curl -I http://localhost:8080/app/assets/app.js    # 200, application/javascript
curl -I http://localhost:8080/app/assets/hilang.js # 404 (tidak ikut fallback)
```

Perbaiki permission dan buktikan 403 berubah jadi 200:

```bash
chmod 644 web/secret.txt
curl -I http://localhost:8080/secret.txt          # 200, text/plain
```

Bersihkan:

```bash
podman rm -f nginx-lab
```

---

## Kesalahan umum

- **Langsung menyalahkan `root` saat 404**, padahal masalahnya permission → 403. Baca statusnya dulu.
- **`chmod -R 777` sebagai solusi** → membuka file rahasia untuk semua orang. Cukup `644`/`755`.
- **Lupa `internal` pada halaman error** → `/404.html` jadi halaman publik yang bisa di-bookmark.
- **Semua route SPA ikut `try_files`** → JS/CSS yang hilang diam-diam dibalas `index.html` 200.
- **`error_page` tidak jalan** → kemungkinan level bawah (server/location) sudah punya `error_page` sendiri, sehingga definisi atas tidak diwariskan.
- **Siklus fallback** → `try_files` jatuh ke URI yang mengarah ke lokasi yang sama → 500 `rewrite or internal redirection cycle`.

---

## Rangkuman

- **Worker Nginx membuka file dengan user `nginx`** — folder butuh izin `x`, file butuh izin `r`.
- **404 = file tidak ada** di path hasil `root`/`alias`; **403 = file/folder ada tapi ditolak** (permission, `autoindex off`, atau blokir konfigurasi).
- **`return 403` / `deny all` / `internal`** adalah tiga cara memblokir path; blokir URL tidak menghapus file dari disk.
- **`error_page`** mengganti halaman error lewat internal redirect; padukan dengan `location ... { internal; }`.
- **SPA fallback** = `try_files $uri $uri/ /index.html`, sedangkan aset statis diberi `try_files $uri =404` agar error tetap terlihat.

---

## Latihan

1. Dari tabel matriks, sebutkan status yang muncul untuk: (a) `root` salah menulis folder, (b) file `chmod 000`, (c) folder kosong tanpa index, (d) `location /private/ { return 403; }`.
2. Tambahkan `error_page 500 502 /50x.html;` dan buktikan dengan `curl -I` bahwa kode asli tetap 502, bukan 200.
3. Buat route `/app/orders/123` yang tetap mengembalikan 200 berisi `index.html`, lalu tunjukkan bedanya dengan `/app/assets/hilang.js`.
4. Hapus `internal` dari `location = /404.html` dan amati apa yang berubah saat membuka `http://localhost:8080/404.html` langsung.

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **Permission** | Izin baca/tulis/eksekusi (`rwx`) pada file dan folder. |
| **Ownership** | Pemilik file (`user:group`) yang menentukan izin yang berlaku. |
| **403 Forbidden** | Request ditolak: objek ada atau dikenal, tapi akses tidak diizinkan. |
| **404 Not Found** | Objek tidak ditemukan di path yang diminta. |
| **`error_page`** | Mengganti halaman/kode error dengan URI lain (internal redirect). |
| **`internal`** | Menandai location hanya boleh diakses dari proses internal Nginx. |
| **SPA** | Single Page Application: satu `index.html` yang menangani semua route. |
| **Fallback** | Pilihan terakhir ketika file yang diminta tidak ada. |

**Lanjut ke [Pelajaran 7 — Location Matching & Urutan Evaluasi →](07-location-matching.md)**
