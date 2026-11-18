# Pelajaran 7 — Location Matching & Urutan Evaluasi

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 5 — Static Web Server (`root`, `alias`, `try_files`) dan Pelajaran 6 — Permission, 403/404 & SPA Fallback.

---

## Tujuan belajar

- Mengenal 4 bentuk `location`: prefix, `=`, `^~`, dan regex `~`/`~*`.
- Menjelaskan **urutan evaluasi** Nginx saat memilih location.
- Memprediksi location mana yang menang ketika ada konflik.
- Membedakan **URI** (yang dicocokkan) dari **filesystem path** (yang dibuka).

---

## Cerita pembuka: tiga jenis pintu di gedung perkantoran

Kamu masuk gedung kantor yang punya banyak pintu.

1. **Pintu utama bernomor** — hanya cocok untuk alamat persis: pintu `Lobi`. Kalau kamu minta "Lobi", langsung masuk, tidak perlu dicek pintu lain.
2. **Pintu bertanda khusus** — mis. pintu bertanda `^~ Dapur`: begitu kamu masuk lewat sana, pencarian **dihentikan**; tidak ada lagi pemeriksaan jalan pintas.
3. **Jalan pintas berpola** — pintu-pintu berpola seperti "semua yang bawa gambar" atau "semua yang berakhiran `.txt`". Pencarian berhenti di **pola pertama yang cocok**, bukan pola paling spesifik.
4. **Pintu umum** — semua orang bisa lewat; hanya dipakai kalau tidak ada pintu lain yang cocok.

`location` di Nginx bekerja persis seperti itu. Dan seperti di gedung nyata, **yang menentukan bukan pintu mana yang paling "mirip", melainkan aturan urutan yang disepakati semua orang.**

---

## Empat bentuk `location`

| Bentuk | Contoh | Kapan dipakai |
|---|---|---|
| **Exact** | `location = /login` | URI persis; paling cepat, pencarian langsung berhenti |
| **Prefix biasa** | `location /documents/` | rute umum; Nginx memilih yang **terpanjang** |
| **Prefix prioritas** | `location ^~ /images/` | sama seperti prefix, **tapi menghentikan cek regex** |
| **Regex** | `location ~ \.php$` / `~* \.JPG$` | pola ekstensi/karakter; `~` sensitif huruf, `~*` tidak |

Ada juga **named location** `location @fallback` — tidak dipakai untuk request biasa, hanya sebagai tujuan `try_files`/`error_page`.

## URI yang dicocokkan sudah dinormalisasi

Sebelum dibandingkan dengan `location`, URI dinormalisasi lebih dulu:

```text
%70%61%6e%64%75%61%6e   →   /panduan          (decoding %XX)
/docs/../docs/a.html    →   /docs/a.html      (resolusi . dan ..)
//docs///a.html         →   /docs/a.html      (gabung //)
```

Konsekuensinya: **query string tidak ikut dicocokkan.** `/docs/a.html?user=1` dicocokkan sebagai `/docs/a.html`. Jadi `location ~ user=1` tidak akan pernah menang.

## Urutan evaluasi location

```text
GET /images/badge/logo.jpg
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Exact match  "="  ──────── cocok? → LANGSUNG MENANG   │
├─────────────────────────────────────────────────────────┤
│ 2. Kumpulkan semua prefix yang cocok, ingat YANG        │
│    TERPANJANG. Kalau yang terpanjang bertanda "^~"      │
│    → MENANG, langkah 3 & 4 dilewati.                    │
├─────────────────────────────────────────────────────────┤
│ 3. Cek regex "~" dan "~*" URUTAN DEKLARASI dari atas.   │
│    Pertama yang cocok → MENANG.                         │
├─────────────────────────────────────────────────────────┤
│ 4. Tidak ada regex yang cocok → pakai prefix terpanjang │
│    dari langkah 2.                                      │
└─────────────────────────────────────────────────────────┘
```

### Tabel urutan prioritas

| Prioritas | Jenis location | Aturan menang | Aturan kalah |
|---|---|---|---|
| **1** | `=` exact | URI sama persis → menang seketika, pencarian berhenti | — |
| **2** | `^~` prefix prioritas | harus menjadi **prefix terpanjang** yang cocok → menang, regex **tidak dicek** | kalau ada prefix lebih panjang tanpa `^~`, tetap lanjut ke regex |
| **3** | `~` / `~*` regex | **urutan deklarasi di file konfigurasi**, yang pertama cocok menang | yang dideklarasikan belakangan tidak pernah sempat diuji |
| **4** | prefix biasa | dipakai sebagai pilihan terakhir: yang **terpanjang** menang | kalah ke regex yang cocok |

Aturan emasnya: **regex mengalahkan prefix biasa, `^~` mengalahkan regex, `=` mengalahkan semuanya** — dengan satu syarat: `^~` hanya aktif kalau location-nya sendiri adalah prefix terpanjang yang cocok.

## Regex: urutan deklarasi, bukan kecocokan terbaik

Nginx **tidak** memilih regex yang paling spesifik. Ia membaca dari atas ke bawah dan berhenti di yang pertama cocok:

```nginx
location ~* \.txt$      { return 200 "R2 txt"; }   # dibaca duluan
location ~* ^/assets/   { return 200 "R3 assets"; } # dibaca belakangan
```

`/assets/notes.txt` cocok dengan **keduanya**, tapi yang menang adalah `.txt` — karena dideklarasi pertama. Menukar urutan kedua blok akan menukar pemenangnya.

## URI vs filesystem path

Dua dunia yang sering tertukar:

```text
   URI (dunia routing)                Filesystem path (dunia disk)
   ───────────────────                ────────────────────────────
   /documents/notes.txt      ──▶      /usr/share/nginx/html/
        ▲                              documents/notes.txt
        │                                   ▲
   dipakai untuk:                        dipakai untuk:
   • mencocokkan location               • membuka file (open/read)
   • rewrite & redirect                 • menentukan 404 vs 403
   • log akses                          • nilai $document_root
```

| Variabel | Isi | Contoh |
|---|---|---|
| `$uri` | URI ternormalisasi, **tanpa** query | `/documents/notes.txt` |
| `$request_uri` | URI asli persis yang dikirim client | `/documents/notes.txt?dl=1` |
| `$document_root` | nilai `root` yang sedang berlaku | `/usr/share/nginx/html` |
| `$request_filename` | path file final di disk | `/usr/share/nginx/html/documents/notes.txt` |
| `$args` | query string | `dl=1` |

Penerjemahan URI → path dilakukan oleh `root`/`alias` (Pelajaran 5). **Location dicocokkan dengan URI; file dibuka dengan path.**

---

## Contoh konfigurasi

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # 1. exact — menang seketika untuk "/"
    location = / {
        return 200 "A  exact  location = /\n";
    }

    # 2. prefix biasa — jaring pengaman
    location / {
        return 200 "B  prefix location /\n";
    }

    location /documents/ {
        return 200 "C  prefix /documents/\n";
    }

    # 3. prefix prioritas — menghentikan cek regex
    location ^~ /images/ {
        return 200 "D  prefix ^~ /images/\n";
    }

    # prefix LEBIH PANJANG tanpa ^~ — mengalahkan D
    location /images/badge/ {
        return 200 "X  prefix /images/badge/\n";
    }

    # 4. regex — urutan deklarasi menentukan pemenang
    location ~* \.(jpg|png)$ {   # dibaca pertama
        return 200 "R1 regex ekstensi gambar\n";
    }

    location ~* \.txt$ {          # dibaca kedua
        return 200 "R2 regex ekstensi .txt\n";
    }

    location ~* ^/assets/ {       # dibaca ketiga
        return 200 "R3 regex prefix /assets/\n";
    }
}
```

| Directive | Peran |
|---|---|
| `location = /` | pencarian berhenti begitu URI persis `/` |
| `location /` | fallback bila tidak ada location lain yang cocok |
| `^~` | "regex tidak usah dicek" — asal ini prefix terpanjang |
| `~` / `~*` | regex PCRE, urutan blok = urutan pemeriksaan |
| `return 200 "..."` | membalas teks langsung, jadi mudah terlihat location mana yang menang |

---

## Lab

Susun konfigurasi discriminator di host lalu jalankan container:

```bash
mkdir -p nginx
cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location = / {
        return 200 "A  exact  location = /\n";
    }

    location / {
        return 200 "B  prefix location /\n";
    }

    location /documents/ {
        return 200 "C  prefix /documents/\n";
    }

    location ^~ /images/ {
        return 200 "D  prefix ^~ /images/\n";
    }

    location /images/badge/ {
        return 200 "X  prefix /images/badge/\n";
    }

    location ~* \.(jpg|png)$ {
        return 200 "R1 regex ekstensi gambar\n";
    }

    location ~* \.txt$ {
        return 200 "R2 regex ekstensi .txt\n";
    }

    location ~* ^/assets/ {
        return 200 "R3 regex prefix /assets/\n";
    }
}
EOF

podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 \
  -v "$PWD/nginx/default.conf":/etc/nginx/conf.d/default.conf:ro,Z \
  docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t
```

**Ekspektasi:** `syntax is ok` / `test is successful`.

Uji matriks prioritas — jalankan berurutan dan cocokkan dengan tabel:

```bash
curl -s http://localhost:8080/                    # A  exact   → menang duluan
curl -s http://localhost:8080/index.html          # B  prefix  → tak ada regex cocok
curl -s http://localhost:8080/documents/page.html # C  prefix  → regex tak ada yang cocok
curl -s http://localhost:8080/documents/notes.txt # R2         → regex kalahkan prefix biasa
curl -s http://localhost:8080/images/logo.jpg     # D  ^~      → regex R1 dilewati
curl -s http://localhost:8080/images/badge/logo.jpg  # R1      → prefix terpanjang (X) tanpa ^~
curl -s http://localhost:8080/assets/app.js       # R3         → regex prefix /assets/
curl -s http://localhost:8080/assets/notes.txt    # R2         → urutan deklarasi: R2 duluan
```

Buktikan bahwa **urutan deklarasi** menentukan pemenang — balik dua blok regex terakhir lalu reload:

```bash
podman exec nginx-lab sh -c "grep -n 'regex ekstensi .txt\|regex prefix /assets' /etc/nginx/conf.d/default.conf"
sed -i '' -e 's/PLACEHOLDER//' nginx/default.conf   # edit manual: pindahkan blok R3 ke atas R2
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
curl -s http://localhost:8080/assets/notes.txt      # sekarang R3 (karena dideklarasi pertama)
```

Verifikasi header response tetap normal (`return` memakai `text/plain`):

```bash
curl -I http://localhost:8080/images/logo.jpg
curl -v http://localhost:8080/ 2>&1 | grep -E '^< HTTP|^< Content-Type'
```

Bersihkan:

```bash
podman rm -f nginx-lab
```

---

## Kesalahan umum

- **Menyusun regex berdasarkan "paling spesifik"** — Nginx memakai urutan deklarasi, bukan skor kecocokan.
- **Mengira `^~` selalu menang** — ia hanya aktif jika location itu sendiri prefix **terpanjang** yang cocok.
- **Mencocokkan query string** (`location ~ user=1`) — query tidak pernah ikut pencocokan.
- **Lupa bahwa regex mengalahkan prefix biasa** — `location /documents/` bisa kalah ke `location ~ \.txt$`.
- **Menaruh `location = /` setelah `location /`** — urutan tidak berpengaruh untuk exact match, tapi membuat pembaca config bingung; tetap rapikan dari spesifik ke umum.
- **Menguji dengan browser yang meng-cache** — selalu pakai `curl` supaya hasil murni dari Nginx.

---

## Rangkuman

- Empat bentuk `location`: **`=` exact**, **prefix biasa**, **`^~` prefix prioritas**, dan **regex `~`/`~*`**.
- Urutan evaluasi: **exact `=` → prefix terpanjang (cek `^~`) → regex urutan deklarasi → prefix terpanjang**.
- **`^~`** berhenti sebelum regex, tapi hanya bila location itu prefix terpanjang.
- **Regex menang atas prefix biasa**; di antara regex, **yang dideklarasi pertama** menang.
- **URI (ternormalisasi, tanpa query) untuk mencocokkan; filesystem path (root/alias) untuk membuka file.**

---

## Latihan

1. Prediksi pemenang untuk `/`, `/documents/1.jpg`, `/images/a.png`, `/images/badge/a.txt`, lalu buktikan dengan `curl -s`.
2. Tambahkan `location ~* \.JPG$` **sebelum** `location ~* \.(jpg|png)$` — bagaimana hasil untuk `/images/logo.JPG`?
3. Buat `location = /documents/notes.txt` dan uji: apakah ia mengalahkan regex `\.txt$`? Jelaskan kenapa.
4. Ganti satu `return 200` menjadi `alias` + `try_files`, lalu uji apakah location yang sama tetap dipakai (location menentukan *config*, bukan file).

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **Location** | Blok konfigurasi yang menangani URI tertentu. |
| **Prefix match** | Pencocokan berdasarkan awalan URI. |
| **Exact match (`=`)** | URI harus sama persis; pencarian langsung berhenti. |
| **Prioritas prefix (`^~`)** | Menang tanpa mengecek regex, asal jadi prefix terpanjang. |
| **Regex (`~` / `~*`)** | Pola PCRE; `~*` tidak memperhatikan huruf besar/kecil. |
| **Normalized URI** | URI hasil decode `%XX`, resolusi `..`, dan gabung `//`. |
| **Named location** | Location `@nama` yang hanya dipakai internal (`try_files`, `error_page`). |
| **Filesystem path** | Lokasi file di disk hasil gabungan `root`/`alias` + URI. |

**Lanjut ke [Pelajaran 8 — Rewrite, Redirect & error_page →](08-rewrite-redirect-error-page.md)**
