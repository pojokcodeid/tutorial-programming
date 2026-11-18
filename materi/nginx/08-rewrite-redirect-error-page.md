# Pelajaran 8 — Rewrite, Redirect & error_page

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 7 — Location Matching & Urutan Evaluasi. Pelajaran 6 sudah membahas dasar `error_page`, di sini dipakai ulang untuk routing.

---

## Tujuan belajar

- Menulis `rewrite` dan `return` untuk mengubah atau memindah URI.
- Membedakan **internal redirect** (diam-diam) dari **external redirect** (memberi tahu client).
- Memilih **301** atau **302** dengan tepat.
- Menggunakan `try_files` sebagai alat routing, bukan hanya fallback.
- Menulis aturan berbasis **ekstensi file** dengan regex location.

---

## Cerita pembuka: kamu pindah rumah

Kamu pindah dari Jl. Lama ke Jl. Baru. Kartu nama lama masih tersebar di dompet teman-teman. Ada dua cara mengatasinya:

1. **Pos meneruskan surat** — surat tetap dikirim ke Jl. Lama, petugas pos diam-diam meneruskannya ke Jl. Baru. Temanmu **tidak tahu** alamatmu berubah; yang penting suratnya sampai.
2. **Kamu kabari semua orang** — temanmu menerima pemberitahuan *"alamat saya sekarang Jl. Baru"*, lalu mereka **mengirim ulang** surat ke alamat baru. Mereka tahu persis alamat lamanya sudah tidak berlaku.

Cara 1 = **internal redirect**. Cara 2 = **external redirect (301/302)**. Keduanya memindahkan surat ke tujuan yang sama, tapi **siapa yang tahu** dan **siapa yang bekerja** berbeda total.

---

## `return` vs `rewrite`

| Directive | Kegunaan | Contoh |
|---|---|---|
| `return` | berhenti dan balas sekarang juga — paling sederhana | `return 301 /new;` |
| `rewrite` | mengganti URI dengan regex, lalu diproses ulang | `rewrite ^/old/(.*)$ /new/$1 last;` |

Gunakan `return` kalau tidak ada pencocokan regex yang dibutuhkan: lebih cepat dan lebih mudah dibaca.

## `rewrite` dan flag-nya

```nginx
rewrite regex replacement [flag];
```

| Flag | Efek |
|---|---|
| *(tanpa flag)* | lanjut ke `rewrite` berikutnya di blok yang sama, lalu location dicari ulang |
| `last` | hentikan rewrite, **cari location baru** untuk URI hasil rewrite (internal) |
| `break` | hentikan rewrite, tetap di location sekarang |
| `redirect` | balas **302** ke client (external) |
| `permanent` | balas **301** ke client (external) |

Dua aturan penting dari dokumentasi:

- Replacement yang diawali `http://`, `https://`, atau `$scheme` **otomatis berhenti** dan menjadi redirect ke client.
- Jika replacement memuat argumen baru, argumen lama ikut disambung — akhiri dengan `?` untuk membuangnya: `rewrite ^/user/(.*)$ /show?user=$1? last;`

## Internal redirect vs external redirect

```text
INTERNAL (client tidak tahu)                EXTERNAL (client tahu)
────────────────────────────                ────────────────────────
GET /halaman-lama                           GET /old
   │                                          │
   ▼                                          ▼
Nginx: rewrite/try_files/error_page        Nginx: return 301 /new
   │                                          │
   ▼                                          ▼
Nginx proses ulang URI BARU                Client terima 301 + Location: /new
   │                                          │
   ▼                                          ▼
balas 200 ke client                         Client kirim request BARU ke /new
URL di browser TETAP /halaman-lama          URL di browser JADI /new
```

| | Internal redirect | External redirect |
|---|---|---|
| Bentuk | `rewrite ... last`, `try_files ... uri`, `error_page ... uri`, `index` | `return 301/302`, `rewrite ... permanent/redirect` |
| Response ke client | **tidak** ada status 3xx | **ada** 3xx + header `Location` |
| Request tambahan | tidak — Nginx memproses ulang sendiri | browser mengirim request baru |
| URL address bar | tetap seperti semula | berubah |
| Status akhir | 200 (atau kode error asli) | 301/302/303/307/308 |
| Batas | maksimal **10** per request → kalau lebih, **500** | tanpa batas |

## 301 vs 302

| | **301** Moved Permanently | **302** Found |
|---|---|---|
| Sifat | permanen | sementara |
| Browser | **mencache** — request berikutnya langsung ke URL baru | tidak dicache, tetap mengecek URL lama |
| Pakai saat | URL lama tidak akan dipakai lagi | perawatan, promosi, A/B test, pindah sementara |
| Cara menulis | `return 301 /new;` / `rewrite ... permanent;` | `return 302 /new;` / `rewrite ... redirect;` |
| Varian | **308** = 301 yang mempertahankan method (POST tetap POST) | **307** = 302 yang mempertahankan method |

> ⚠️ Salah memilih 301 adalah salah satu bug paling menyebalkan: browser user (dan mesin pencari) mengingatnya untuk waktu lama, sehingga mengembalikan 302 jadi 301 itu susah dibatalkan.

## `try_files` untuk routing

`try_files` tidak hanya "cari file" — parameter terakhirnya adalah **keputusan routing**:

```nginx
location /news/ {
    try_files $uri $uri/ /news/index.html;   # jatuh ke halaman lain (URI)
}

location /status/ {
    try_files $uri @pemeliharaan;            # jatuh ke named location
}

location @pemeliharaan {
    return 503 "Layanan sedang pemeliharaan";
}
```

- **URI terakhir** → internal redirect, location dicari ulang.
- **`@nama`** → langsung ke named location, tanpa pencarian location.
- **`=code`** → langsung balas kode error.

## `error_page` sebagai router

```nginx
error_page 404 /404.html;            # internal redirect, kode 404 tetap
error_page 500 502 503 504 /50x.html;
error_page 404 =200 /empty.gif;      # kode diganti
error_page 404 = @fallback;          # ke named location
error_page 404 https://contoh.com/nf; # external, default balas 302
```

Selalu pasangkan dengan `location = /404.html { internal; }` supaya halaman error tidak bisa diminta langsung dari luar (detail di Pelajaran 6).

## Aturan ekstensi file

Nginx **tidak pernah membaca isi file** untuk menebak tipenya — semuanya berdasarkan **ekstensi pada URI**, dan aturan per-ekstensi ditulis dengan regex location:

| Aturan | Konfigurasi |
|---|---|
| Sembunyikan file sensitif | `location ~* \.(env\|inc\|log\|bak)$ { return 404; }` |
| Paksa sebagai unduhan | `location ~* \.(zip\|tar\.gz)$ { types { } default_type application/octet-stream; }` |
| Cache aset (Tahap 9) | `location ~* \.(css\|js)$ { expires 30d; }` |
| Teruskan ke backend (Tahap 6) | `location ~* \.php$ { fastcgi_pass ...; }` |

Ingat Pelajaran 7: **urutan deklarasi regex menentukan pemenang**, dan query string tidak ikut pencocokkan (`/a.zip?x=1` tetap terlihat sebagai `/a.zip`).

---

## Contoh konfigurasi

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;
    location = /404.html { internal; }

    # --- external redirect ---
    location = /old   { return 301 /new; }
    location = /promo { return 302 /new; }

    # --- rewrite internal ---
    location = /halaman-lama {
        rewrite ^/halaman-lama$ /halaman-baru last;
    }

    # --- routing dengan try_files ---
    location /news/ {
        try_files $uri $uri/ /news/index.html;
    }

    location /status/ {
        try_files $uri @pemeliharaan;
    }

    location @pemeliharaan {
        return 503 "Layanan sedang dalam pemeliharaan\n";
    }

    # --- aturan ekstensi file ---
    location ~* \.(env|inc|log)$ {
        return 404;
    }

    location ~* \.zip$ {
        types        { }
        default_type application/octet-stream;
    }
}
```

| Directive | Peran |
|---|---|
| `return 301 /new` | external redirect permanen, URL baru dibentuk dari `Host` client |
| `return 302 /new` | external redirect sementara |
| `rewrite ... last` | ganti URI lalu cari location baru — **internal**, tanpa header `Location` |
| `try_files ... /news/index.html` | routing: route tak dikenal jatuh ke halaman utama |
| `try_files $uri @pemeliharaan` | routing ke named location |
| `location ~* \.(env\|inc\|log)$` | sembunyikan file sensitif lewat ekstensi |

---

## Lab

Siapkan konten, konfigurasi, lalu jalankan container:

```bash
mkdir -p web/news nginx

printf '<!doctype html><title>Beranda</title><h1>Beranda</h1>\n'        > web/index.html
printf '<!doctype html><title>Baru</title><h1>Halaman baru</h1>\n'      > web/new.html
printf '<!doctype html><title>Baru</title><h1>Isi halaman baru</h1>\n'  > web/halaman-baru.html
printf '<!doctype html><title>404</title><h1>Tidak ditemukan</h1>\n'    > web/404.html
printf '<!doctype html><title>News</title><h1>Berita terbaru</h1>\n'     > web/news/index.html
printf 'PASSWORD=rahasia\n'                                            > web/.env
printf 'isi arsip zip\n'                                               > web/unduhan.zip

cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;
    location = /404.html { internal; }

    location = /old   { return 301 /new; }
    location = /promo { return 302 /new; }

    location = /halaman-lama {
        rewrite ^/halaman-lama$ /halaman-baru last;
    }

    location /news/ {
        try_files $uri $uri/ /news/index.html;
    }

    location /status/ {
        try_files $uri @pemeliharaan;
    }

    location @pemeliharaan {
        return 503 "Layanan sedang dalam pemeliharaan\n";
    }

    location ~* \.(env|inc|log)$ {
        return 404;
    }

    location ~* \.zip$ {
        types        { }
        default_type application/octet-stream;
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

Uji **external redirect** (client diberi tahu):

```bash
curl -sI http://localhost:8080/old
curl -sI http://localhost:8080/promo
```

**Ekspektasi:** `/old` → `HTTP/1.1 301 Moved Permanently` + `Location: http://localhost:8080/new`; `/promo` → `302 Found` + `Location` yang sama. Lanjutkan ke targetnya:

```bash
curl -s http://localhost:8080/new | grep -o 'Halaman baru'
```

Uji **internal redirect** (client tidak diberi tahu):

```bash
curl -sI http://localhost:8080/halaman-lama
curl -s  http://localhost:8080/halaman-lama | grep -o 'Isi halaman baru'
```

**Ekspektasi:** `HTTP/1.1 200 OK` **tanpa** header `Location`, tetapi isi badannya adalah `halaman-baru.html` — bukti Nginx memproses ulang URI sendiri.

Uji routing `try_files` dan aturan ekstensi:

```bash
curl -sI http://localhost:8080/news/berita-hari-ini   # 200, isi news/index.html
curl -sI http://localhost:8080/status/                # 503 dari named location
curl -sI http://localhost:8080/.env                   # 404 meski file ada di disk
curl -sI http://localhost:8080/unduhan.zip            # 200, application/octet-stream
curl -sI http://localhost:8080/halaman-tidak-ada      # 404, isi 404.html
```

Periksa langsung bahwa file `.env` memang ada (artinya 404 berasal dari konfigurasi, bukan dari ketiadaan file):

```bash
podman exec nginx-lab ls -l /usr/share/nginx/html/.env
podman logs nginx-lab 2>&1 | tail -5
```

Bersihkan:

```bash
podman rm -f nginx-lab
```

---

## Kesalahan umum

- **`rewrite ... last` di dalam `location` yang sama dengan pola URI hasil rewrite** → berputar 10 kali lalu **500** `rewrite or internal redirection cycle`. Pakai `break` kalau tidak perlu ganti location.
- **Mengira `return 301` itu internal** — client justru mengubah address bar-nya dan men-cache perubahan itu.
- **301 dipakai untuk URL sementara** → browser user mengingatnya terlalu lama; pakai 302/307.
- **Replacement tanpa `?`** → argumen lama (`?id=1`) ikut tersambung ke URL baru.
- **Aturan ekstensi ditulis sebagai prefix biasa** (`location /secret.env`) — tidak akan menang melawan regex lain; tulis dengan `~*`.
- **Lupa `internal` pada halaman error** → `/404.html` jadi konten publik.

---

## Rangkuman

- **`return`** untuk balas seketika; **`rewrite`** untuk mengganti URI dengan regex (`last`, `break`, `redirect`, `permanent`).
- **Internal redirect** = Nginx memproses ulang URI sendiri (tanpa `Location`, URL client tetap, maksimal 10x).
- **External redirect** = client menerima 3xx + `Location` lalu mengirim request baru.
- **301 permanen (dicache)** vs **302 sementara (tidak dicache)**; 307/308 menjaga method.
- **`try_files`** bisa dipakai untuk routing ke URI lain, named location (`@`), atau kode error (`=code`).
- **Aturan ekstensi file** ditulis dengan regex location, berdasarkan URI — bukan isi file.

---

## Latihan

1. Tulis `rewrite` yang memindahkan `/artikel/2024/judul-kita` ke `/blog/judul-kita` (hint: capture `$1`), lalu buktikan dengan `curl -sI`.
2. Bedakan hasil `curl -sI /old` dengan `curl -sI /halaman-lama` — sebutkan header mana yang membedakannya.
3. Ubah `return 301 /new` menjadi `return 302 /new`, lalu jelaskan kapan kamu sengaja memilih yang versi sementara.
4. Tambahkan `location ~* \.(sql|db)$ { return 404; }` **sebelum** aturan `.zip` dan uji `/backup.sql` — mengapa tidak perlu khawatir tentang urutannya?

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **Rewrite** | Mengganti URI request dengan pola regex sebelum diproses. |
| **`last` / `break`** | Lanjut pencarian location baru / berhenti di location sekarang. |
| **Internal redirect** | Nginx memproses URI baru sendiri tanpa memberi tahu client. |
| **External redirect** | Client menerima 3xx + `Location` dan mengirim request baru. |
| **301 / 302** | Redirect permanen (dicache) / sementara (tidak dicache). |
| **Named location** | Location `@nama` yang hanya dipanggil internal. |
| **`error_page`** | Mengganti halaman atau kode error dengan URI lain. |
| **Aturan ekstensi** | Kebijakan per jenis file (`.env`, `.zip`, `.php`) ditulis dengan regex. |

**Lanjut ke [Pelajaran 9 — Virtual Host →](09-virtual-host.md)**
