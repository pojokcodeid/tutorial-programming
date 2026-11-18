# Pelajaran 5 — Static Web Server: root, alias, index, try_files

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 3 — Struktur Konfigurasi dan Pelajaran 4 — Mengelola Konfigurasi.

---

## Tujuan belajar

- Menjelaskan alur dari URL yang diketik user sampai file yang dibaca Nginx.
- Membedakan **`root`** dan **`alias`**, plus kapan memakai yang mana.
- Memakai **`index`** dan **`try_files`** untuk file default.
- Mengaktifkan **`autoindex`** dengan sadar risikonya.
- Melayani HTML, CSS, JS, gambar, dan download dengan MIME type yang benar.

---

## Cerita pembuka: alamat rumah vs nama gedung

Kamu kirim paket ke "Jl. Mawar No. 5": kurir memakai **alamat rumah utuh**, nomor rumah ditambahkan di belakang. Tapi untuk "Gedung A lantai 3", kurir harus **mengganti** bagian "kampus" pada alamat dengan "Gedung A lantai 3".

| Cara kerja alamat | Padanan di Nginx |
|---|---|
| folder dasar **+** nomor rumah | `root` |
| sebagian alamat **diganti** folder lain | `alias` |

Kuncinya cuma satu: **Nginx selalu menerjemahkan URI (alamat) menjadi path file (lokasi di disk).** `root` dan `alias` hanyalah dua cara menerjemahkan yang sama.

---

## Dari URL ke file di disk

```text
GET /docs/panduan.html
        │
        ▼  normalisasi URI  (%XX, /a/../b, // → /)
pilih location  ←  aturannya di Pelajaran 7
        │
        ▼  terjemahkan ke filesystem
   root  → folder root + URI lengkap
   alias → nilai alias + sisa URI
        │
        ▼
/usr/share/nginx/html/docs/panduan.html
        │
  ada? ── ya  → kirim file + header Content-Type
          tidak → 404 (atau dicoba lagi oleh try_files)
```

## `root` dan `alias`

```nginx
location /i/ { root /data/w3; }               # /i/top.gif → /data/w3/i/top.gif
location /i/ { alias /data/w3/images/; }      # /i/top.gif → /data/w3/images/top.gif
```

`root` berlaku di `http`/`server`/`location` (default `html`); `alias` **hanya di `location`**. Di location regex (`~ ...`), `alias` berarti path lengkap sehingga wajib memakai capture: `alias /data/w3/images/$1;`

| Aspek | `root` | `alias` |
|---|---|---|
| Cara kerja | folder dasar + **URI lengkap** | nilai alias + **sisa URI** |
| Struktur disk | meniru struktur URL | bebas, beda dari URL |
| Jebakan | mengira `root` = folder isinya | lupa `/` di akhir → 404 |

> Dokumentasi menyarankan: bila isi alias persis sama dengan isi location, pakai `root` saja — lebih pendek dan tidak menyesatkan.

## `index` dan `try_files`

```nginx
index index.html index.htm;              # default
try_files $uri $uri/ /index.html;        # alternatif: try_files ... =404
```

`index` dipakai saat URI berakhir `/`; file dicari **kiri ke kanan**, yang pertama ketemu menang, dan bila tidak ada satu pun Nginx lanjut ke `autoindex`. `try_files` mengecek beberapa kandidat **berurutan** (path dibangun dari `root`/`alias`); parameter terakhir adalah keputusan saat semua gagal:

| Parameter terakhir | Arti |
|---|---|
| `/index.html` | **internal redirect** ke URI itu |
| `=404` | balas kode error itu |
| `@fallback` | pindah ke *named location* |

## `autoindex`

```nginx
autoindex on | off;    # default: off
```

| Kondisi | Hasil |
|---|---|
| folder punya `index.html` | `index.html` disajikan |
| `autoindex off`, tanpa index | **403 Forbidden** |
| `autoindex on`, tanpa index | daftar isi folder |

Daftar isi membocorkan struktur servermu — aktifkan hanya untuk arsip publik, bukan untuk root website.

## MIME types dan jenis file

Nginx menebak tipe konten dari **ekstensi file** lewat peta `conf/mime.types`:

```nginx
http {
    include       mime.types;
    default_type  application/octet-stream;
}
```

| Ekstensi | `Content-Type` | Dipakai untuk |
|---|---|---|
| `.html` | `text/html` | halaman |
| `.css` / `.js` | `text/css` / `application/javascript` | stylesheet & script |
| `.png` / `.jpg` / `.svg` | `image/png` / `image/jpeg` / `image/svg+xml` | gambar |
| `.json` / `.txt` / `.pdf` | `application/json` / `text/plain` / `application/pdf` | data & dokumen |
| `.zip` dan lainnya | `application/octet-stream` | unduhan |
| tidak dikenal | nilai `default_type` | fallback |

Agar file di `/download/` selalu **terunduh** (bukan ditampilkan), kosongkan peta ekstensi lalu isi `default_type` — contohnya di konfigurasi berikut.

---

## Contoh konfigurasi

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /docs/ { alias /usr/share/docs/; index index.html; }
    location /listing/ { autoindex on; }
    location /download/ {
        types        { }
        default_type application/octet-stream;
    }
    location /private/ { return 403; }        # dibahas tuntas di Pelajaran 6
}
```

| Directive | Peran |
|---|---|
| `root` / `alias` | terjemahan URI → path file |
| `index` | file default saat URI berakhir `/` |
| `autoindex on` | daftar isi folder bila index tidak ada |
| `types { }` + `default_type` | semua file di location itu jadi unduhan |
| `return 403` | tolak tanpa membuka file |

---

## Lab

Siapkan konten statis lalu jalankan container — `web` di-mount ke root, `docs` ke lokasi `alias`:

```bash
mkdir -p web/assets web/download web/listing web/private docs nginx
printf '<!doctype html><title>Beranda</title><link rel="stylesheet" href="/assets/style.css"><h1>Halo dari Nginx!</h1>\n' > web/index.html
printf 'body { font-family: sans-serif; }\n'  > web/assets/style.css
printf 'console.log("JS aktif");\n'           > web/assets/app.js
printf 'catatan unduhan\n'                    > web/download/catatan.txt
printf 'bukan index\n'                        > web/listing/baca-dulu.txt
printf 'RAHASIA\n'                            > web/private/rahasia.txt
printf '<!doctype html><title>Dokumen</title><p>Isi dokumentasi.</p>\n' > docs/index.html
printf '<!doctype html><title>Panduan</title><p>Halaman panduan.</p>\n'  > docs/panduan.html

cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location /docs/ { alias /usr/share/docs/; index index.html; }
    location /listing/ { autoindex on; }
    location /download/ { types { } default_type application/octet-stream; }
    location /private/ { return 403; }
}
EOF

podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 \
  -v "$PWD/web":/usr/share/nginx/html:ro,Z \
  -v "$PWD/docs":/usr/share/docs:ro,Z \
  -v "$PWD/nginx/default.conf":/etc/nginx/conf.d/default.conf:ro,Z \
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t

curl -I http://localhost:8080/                     # 200, Content-Type: text/html
curl -I http://localhost:8080/assets/style.css     # 200, text/css
curl -I http://localhost:8080/docs/panduan.html    # 200 — datang dari alias
curl -I http://localhost:8080/docs/hilang.html     # 404 — tidak ada di folder alias
curl -I http://localhost:8080/download/catatan.txt # 200, application/octet-stream
curl -I http://localhost:8080/listing/             # 200 — halaman autoindex
curl -I http://localhost:8080/private/rahasia.txt  # 403
curl -v http://localhost:8080/assets/app.js 2>&1 | grep -E '^< HTTP|^< Content-Type'

podman exec nginx-lab ls /usr/share/nginx/html/docs  # No such file or directory
podman exec nginx-lab ls /usr/share/docs             # index.html  panduan.html
podman rm -f nginx-lab                               # bersihkan bila sudah selesai
```

**Ekspektasi:** `nginx -t` mencetak `syntax is ok` dan `test is successful`; status tiap `curl -I` sesuai komentar di atas. Dua perintah `ls` terakhir membuktikan `/docs/` memang diambil dari folder terpisah, bukan dari `root`.

---

## Kesalahan umum

- **`root` diisi folder isinya** → Nginx mencari `/var/www/docs/docs/...` karena URI lengkap ikut terpasang → 404.
- **`alias` tanpa `/` di akhir** → nama file menempel ke nama folder (`/data/images` + `top.gif`).
- **`alias` di context `http`/`server`** → `nginx -t` langsung menolak.
- **`autoindex on` di root server** → seluruh struktur website bocor ke publik.
- **Lupa `include mime.types`** → browser menerima CSS/JS sebagai teks biasa sehingga tidak dieksekusi.

---

## Rangkuman

- Inti kerja web server: **URI → path file**; `root` menambah URI, `alias` mengganti prefix URI.
- **`index`** memilih file default, **`try_files`** mengecek kandidat lalu jatuh ke URI/`=`code/named location.
- **`autoindex`** default `off`; folder tanpa index + `autoindex off` = **403**, bukan 404.
- **MIME type** ditentukan ekstensi; `types { }` + `default_type` membuat file benar-benar terunduh.
- Selalu uji dengan `curl -I` — bukan tebakan.

---

## Latihan

1. Tulis path file di disk yang dibuka untuk `/`, `/assets/style.css`, dan `/docs/index.html` pada konfigurasi lab.
2. Ubah `location /docs/` memakai `root` saja (tanpa `alias`) — apa hasil `curl -I`, dan kenapa?
3. Buat folder `web/galeri/` berisi 3 gambar tanpa `index.html`; buktikan `autoindex off` → 403 dan `autoindex on` → daftar file.
4. Tambahkan `location /img/ { alias /usr/share/nginx/html/assets/; }` lalu uji `curl -I http://localhost:8080/img/style.css`.

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **URI** | Path pada URL, mis. `/docs/panduan.html`. |
| **Filesystem path** | Lokasi nyata file di disk. |
| **`root`** | Folder dasar yang ditimpa URI lengkap. |
| **`alias`** | Pengganti sebagian URI oleh folder lain. |
| **`index`** | Daftar file default saat URI berakhir `/`. |
| **`try_files`** | Mengecek beberapa file berurutan, lalu jatuh ke fallback. |
| **`autoindex`** | Daftar isi folder, default `off`. |
| **MIME type** | Label tipe konten di header `Content-Type`. |
| **Internal redirect** | Nginx memproses ulang URI baru tanpa memberi tahu client (Pelajaran 8). |

**Lanjut ke [Pelajaran 6 — Permission, 403/404 & SPA Fallback →](06-file-403-404-dan-spa.md)**
