# Pelajaran 9 — Virtual Host: Banyak Domain dalam Satu Nginx

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 8 (rewrite & error_page), paham context `server` di `nginx.conf`.

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan cara Nginx memilih `server` block lewat **Host header**.
- Menulis beberapa virtual host (`server_name`) dalam satu Nginx.
- Mengatur **default server** untuk request yang tidak cocok.
- Memakai **wildcard** dan **regex** pada `server_name`.
- Memisahkan konfigurasi per domain dan menguji tanpa DNS sungguhan.

---

## Cerita pembuka: satu gedung, banyak nama toko

Bayangkan satu ruko berisi tiga toko: *Kopi Senja*, *Toko Buku*, *Servis HP*. Alamatnya sama — Jl. Merdeka No. 10. Tapi begitu kamu menyebut "saya ke Kopi Senja", satpam mengarahkanmu ke unit yang benar.

Satu gedung = satu Nginx, satu port. Banyak nama toko = banyak `server_name`. Yang membedakan adalah **sebutan nama di pintu** — di HTTP, itu bernama **Host header**.

```text
       Host: app.local      Host: api.local     Host: docs.local
              │                   │                    │
              ▼                   ▼                    ▼
     ┌────────────────────────────────────────────────────────┐
     │  Nginx (satu proses, satu port 80, satu IP)            │
     │  server { server_name app.local; }  → halaman app      │
     │  server { server_name api.local; }  → halaman api      │
     │  server { server_name docs.local; } → halaman docs     │
     │  server { default_server; }         → "taku tak dikenal"│
     └────────────────────────────────────────────────────────┘
```

---

## Penjelasan inti

### 1. Satu `server` = satu virtual host

Setiap blok `server { ... }` di context `http` adalah satu **virtual host**. Nginx memilih blok dengan dua langkah:

1. Cocokkan **Host header** dengan `server_name` pada blok-blok di port tersebut.
2. Jika tidak ada yang cocok, pakai **default server** port itu.

> `server_name` **bukan** pengarah ke mesin — itu pekerjaan **DNS**. `server_name` hanya berarti: *"jika klien menyebut nama ini, pakai blok saya."*

### 2. Dari mana Host header datang?

Mengetik `http://app.local/` di browser membuat browser mengirim `Host: app.local`. Sedangkan `curl http://localhost:8080` mengirim `Host: localhost:8080`. Karena itu di lab kita cukup **memalsukan** Host tanpa DNS: `curl -H 'Host: app.local' http://localhost:8080`.

### 3. Urutan pemilihan server

```text
Request ke port 80 → Host header dicocokkan dengan server_name
   │
   ├─ cocok ───────▶ pakai blok server tersebut
   └─ tidak cocok ─▶ pakai DEFAULT SERVER port itu
```

Default server ditentukan oleh `default_server` pada `listen`; tanpa tanda itu, **blok pertama** yang didefinisikan untuk port tersebut jadi default.

### 4. Bentuk `server_name`

| Bentuk | Contoh | Cocok untuk |
|---|---|---|
| Exact | `server_name app.local;` | Hanya `app.local` |
| Wildcard subdomain | `server_name *.example.com;` | `www.example.com` — **bukan** `example.com` |
| Wildcard lama | `server_name .example.com;` | `example.com` + `www.example.com` (gaya lama) |
| Regex | `server_name ~^www\.example\.com$;` | Pola — **wajib** diawali `~` |
| Banyak nama | `server_name app.local www.app.local;` | Beberapa nama dalam satu blok |
| Catch-all | `server_name _;` | Penanda saja — yang bekerja tetap `default_server` |

Contoh regex berguna: `server_name ~^docs-\d+\.local$;` melayani `docs-1.local`, `docs-2.local`, dst. Bila beberapa blok sama-sama cocok: **exact > wildcard > regex** (regex dievaluasi urut definisi).

### 5. Pemisahan konfigurasi per domain

```text
nginx/
├── nginx.conf          # http { include conf.d/*.conf; }  (sudah ada di image)
└── conf.d/
    ├── 00-default.conf # alfabetis paling awal → default server
    ├── app.conf  app.local      ├── api.conf   api.local
    └── docs.conf docs.local
```

### 6. DNS dan resolusi: dua hal yang sering tertukar

Alurnya: `app.local` → (DNS / `/etc/hosts`) → `203.0.113.10` → Nginx di IP itu:80 — lalu **Host header** dipakai memilih blok `server`.

| | DNS | `server_name` |
|---|---|---|
| **Fungsi** | Mengubah nama → IP | Memilih blok `server` |
| **Dikelola di** | Registrar / `/etc/hosts` / cluster DNS | File konfigurasi Nginx |
| **Kalau salah** | Klien tidak tahu ke mana connect | Sampai, tapi dapat halaman default server |

Untuk produksi: pasang A record/CNAME ke IP Nginx, lalu pastikan `server_name` sama dengan nama record itu. Untuk lab: cukup `-H 'Host: ...'` di curl.

---

## Contoh konfigurasi

```nginx
# conf.d/00-default.conf — blok pertama untuk port 80 = default server
server {
    listen 80 default_server;
    server_name _;
    location / { return 444; }   # tutup koneksi tanpa response
}

# conf.d/app.conf
server {
    listen 80;
    server_name app.local www.app.local;
    root /usr/share/nginx/html/app;
}

# conf.d/api.conf
server {
    listen 80;
    server_name api.local;
    location / { return 200 "api.local — ini endpoint API\n"; }
}

# conf.d/docs.conf — wildcard subdomain
server {
    listen 80;
    server_name *.docs.local;
    root /usr/share/nginx/html/docs;
}
```

| Directive | Arti |
|---|---|
| `listen 80` | Melayani port 80 pada semua interface |
| `default_server` | Penerima request yang tidak cocok di port 80 |
| `server_name _;` | Penanda nama dummy — `default_server` yang bekerja |
| `server_name *.docs.local;` | Wildcard satu label (tidak match `a.b.docs.local`) |

---

## Lab

```bash
mkdir -p nginx-vhost/conf.d
cat > nginx-vhost/conf.d/sites.conf <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    location / { return 200 "DEFAULT — server block tidak dikenal\n"; }
}
server {
    listen 80;
    server_name app.local www.app.local;
    location / { return 200 "APP — halaman utama aplikasi\n"; }
}
server {
    listen 80;
    server_name api.local;
    location / { return 200 "API — endpoint service\n"; }
}
server {
    listen 80;
    server_name *.docs.local;
    location / { return 200 "DOCS — dokumentasi\n"; }
}
EOF

podman run -d --name nginx-lab -p 8080:80 \
  -v "$PWD/nginx-vhost/conf.d:/etc/nginx/conf.d:ro" \
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t
```

Ekspektasi: `nginx -t` → `test is successful`. Verifikasi Host header menentukan jawaban:

```bash
curl -H 'Host: app.local'     http://localhost:8080   # → APP — halaman utama aplikasi
curl -H 'Host: api.local'     http://localhost:8080   # → API — endpoint service
curl -H 'Host: v1.docs.local' http://localhost:8080   # → DOCS — dokumentasi (wildcard)
curl -H 'Host: asal.local'    http://localhost:8080   # → DEFAULT — tidak dikenal
curl                          http://localhost:8080   # → DEFAULT (Host: localhost)
podman logs nginx-lab 2>&1 | tail -3   # bukti Host yang diterima per request
podman rm -f nginx-lab                 # bersihkan
```

---

## Kesalahan umum

- **Menyamakan `server_name` dengan DNS** — `server_name app.local` tidak mengarahkan `app.local` ke mesin ini; tetap butuh A record atau `/etc/hosts`.
- **Lupa `default_server`** lalu bingung request aneh jatuh ke blok pertama — tandai eksplisit.
- **Mengira `*.example.com` mencakup apex** — `example.com` sendiri tidak cocok; tulis `server_name example.com www.example.com;`.
- **Regex tanpa `~`** — `server_name ^www\.x\.com;` tidak valid; wajib `server_name ~^www\.x\.com$;`.
- **Menguji lewat browser lalu mengira konfigurasi salah** — browser mengirim Host asli; pakai `curl -H 'Host: ...'`.

---

## Rangkuman

- Satu `server` block = satu **virtual host**; banyak blok hidup di satu Nginx dan satu port.
- Pemilihan blok didasarkan **Host header → `server_name`**, bukan DNS.
- Tidak ada yang cocok → **default server** (`default_server` atau blok pertama).
- `server_name` mendukung exact, **wildcard**, dan **regex** (`~^...$`).
- Konfigurasi sehat **dipisah per domain** di `conf.d/`.
- **DNS** = nama → IP; `server_name` = memilih blok — dua hal terpisah yang sering tertukar.

---

## Latihan

1. Tambahkan virtual host `shop.local` yang mengembalikan `SHOP — toko online`, lalu buktikan dengan curl dan pastikan blok lain tidak berubah.
2. Jelaskan kenapa `curl http://localhost:8080` (tanpa `-H`) di lab ini menjawab DEFAULT.
3. Buat `server_name ~^v[0-9]+\.app\.local$;` dan buktikan `v2.app.local` terlayani, sedangkan `beta.app.local` jatuh ke default server.

---

## Istilah baru

| Istilah | Arti singkat |
|---|---|
| **Virtual host** | Satu blok `server` untuk satu nama domain di satu IP/port |
| **`server_name`** | Daftar nama yang dicocokkan dengan Host header |
| **Host header** | Header HTTP berisi nama domain yang diminta klien |
| **Default server** | Blok penerima request yang `server_name`-nya tidak cocok |
| **Wildcard** | Pola `*.domain` untuk banyak subdomain |
| **DNS** | Layanan mengubah nama domain menjadi IP |

**Lanjut ke [Pelajaran 10 — Reverse Proxy Dasar: proxy_pass →](10-reverse-proxy-dasar.md)**
