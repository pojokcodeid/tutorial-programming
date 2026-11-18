# Pelajaran 14 — Caching & Performance

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 10 (Reverse Proxy Dasar) dan 12 (Load Balancing); container `nginx-lab` yang bisa dijalankan (Pelajaran 3–4).

---

## Tujuan belajar

- Membedakan **browser cache** (tersimpan di laptop pelanggan) dan **proxy cache** (tersimpan di server Nginx), serta mengatur masa berlakunya dengan `expires` dan `Cache-Control`.
- Mengaktifkan `proxy_cache` + `proxy_cache_path` beserta `proxy_cache_key`, `proxy_cache_valid`, `proxy_cache_bypass`, dan `proxy_no_cache`.
- Menguji cache **MISS → HIT** dengan dua kali `curl` dan membaca header `X-Cache-Status`.
- Menyalakan gzip serta optimasi pengiriman (`sendfile`, `tcp_nopush`, `tcp_nodelay`, keepalive, buffering, `worker_connections`).

---

## Cerita pembuka: etalase kue dan kulkas pelanggan

Warung kue langganan selalu menyiapkan **sepiring contoh di etalase** — dipungut siapa pun tanpa perlu masuk ke dapur — dan sebagian pelanggan juga **menyimpan kue di kulkas rumah** supaya besok tinggal makan. Dapur (upstream) hanya sibuk saat kue baru dibuat.

| Di warung | Di web |
|---|---|
| Kue contoh di etalase | **Proxy cache** di Nginx |
| Kue di kulkas pelanggan | **Browser cache** di laptop/HP |
| Label "boleh simpan sampai kapan" | `Cache-Control` / `Expires` |
| Kue pesanan khusus per orang | Data personal — **jangan taruh di etalase** |

---

## Dua lapis cache

| | Browser cache | Proxy cache |
|---|---|---|
| Disimpan di | laptop/HP pelanggan | server Nginx |
| Dikontrol oleh | `expires`, `Cache-Control` | `proxy_cache_path`, `proxy_cache*` |
| Keuntungan | nol request ke server | 1 request ke upstream untuk ribuan user |
| Risiko | konten basi di client | **konten salah saji ke user lain** |

## Browser cache: `expires` dan `Cache-Control`

`expires` (konteks http/server/location) menulis **dua header sekaligus**: `Expires` (tanggal kedaluwarsa) dan `Cache-Control: max-age=` (detik sejak sekarang). Default `expires off`, jadi tanpa directive ini browser bebas menebak.

| Jenis konten | Tulisan | Hasil di response |
|---|---|---|
| HTML | `expires -1h;` | `Cache-Control: no-cache` → selalu cek ulang |
| Aset ber-hash (`app.3fa2.js`) | `expires 30d;` | `Cache-Control: max-age=2592000` |
| Konten personal | `expires off;` + `add_header Cache-Control "no-store" always;` | tidak boleh disimpan |

Catatan dokumentasi: `expires`/`add_header` hanya menempel pada kode **200, 201, 204, 206, 301, 302, 303, 304, 307, 308** — beri `always` pada `add_header` agar ikut terkirim pada 403/404. `expires max` mengisi `Expires` tanggal 2037 dan `max-age` 10 tahun.

## Proxy cache: dari path ke header

```text
  GET /pub/hello
        │
        ▼
  ada di /var/cache/nginx/site ? ── YA ──► X-Cache-Status: HIT (langsung dibalas)
        │ TIDAK
        ▼
  upstream dihubungi ──► X-Cache-Status: MISS ──► response disimpan ke zona `site`
```

| Directive | Konteks | Peran |
|---|---|---|
| `proxy_cache_path path levels=1:2 keys_zone=site:10m inactive=10m max_size=100m` | **http** | wajib: membuat folder cache + metadata bersama |
| `proxy_cache zone \| off` | http, server, location | menyalakan cache (default `off`) |
| `proxy_cache_key $scheme$proxy_host$request_uri` | http, server, location | identitas konten; dua URL sama = satu cache |
| `proxy_cache_valid 200 302 10m; proxy_cache_valid 404 1m;` | http, server, location | berapa lama tiap kode disimpan |
| `proxy_cache_bypass $arg_nocache;` / `proxy_no_cache $http_authorization;` | http, server, location | `bypass` → **jangan baca** cache; `no_cache` → **jangan simpan** response (bila bernilai ≠ "" dan ≠ "0") |
| `add_header X-Cache-Status $upstream_cache_status always;` | server, location | membocorkan status cache supaya bisa diuji |

Nilai `$upstream_cache_status` (dokumentasi nginx.org): `MISS` (diambil dari upstream lalu disimpan), `HIT` (dari cache), `BYPASS` (`proxy_cache_bypass` aktif), `EXPIRED` (kedaluwarsa → versi baru diambil), `STALE` (kedaluwarsa + upstream error → versi lama dipakai), `UPDATING` (refresh sedang berjalan), `REVALIDATED` (upstream menjawab 304, data lama masih sah).

Nginx **menolak menyimpan** response yang memuat `Set-Cookie` atau `Vary: *`, dan membaca `Expires`/`Cache-Control` milik upstream untuk menentukan masa simpan — semuanya bisa dimatikan lewat `proxy_ignore_headers`.

## Buffering: tampung dulu, kirim pelan-pelan

`proxy_buffering on` (default) berarti Nginx menarik response dari upstream secepat mungkin ke `proxy_buffers`, lalu menyalurkannya ke client yang lambat — upstream cepat bebas untuk request berikutnya. Matikan (`off`) untuk SSE/streaming, atau biarkan upstream mengirim `X-Accel-Buffering: no`.

## gzip: kompresi di Nginx

| Directive | Default | Catatan |
|---|---|---|
| `gzip on` | **off** | wajib dinyalakan manual |
| `gzip_types` | **hanya `text/html`** | daftarkan sendiri css/js/json/svg — kesalahan paling umum |
| `gzip_min_length 1024` / `gzip_comp_level 5` | `20` / `1` (rentang 1–9) | respons kecil jangan dibuang CPU; 4–6 titik tengah terbaik |
| `gzip_vary` / `gzip_proxied` | `off` / `off` | `vary on` → `Vary: Accept-Encoding`; `proxied` harus `any` agar response upstream ikut dikompres |

Yang sudah terkompresi (jpg, png, zip, woff2) jangan masuk `gzip_types`. Kompresi hanya terjadi bila client mengirim `Accept-Encoding: gzip`; hasilnya `Content-Encoding: gzip` dan `Content-Length` asli hilang.

## Optimasi pengiriman & koneksi

| Directive | Default | Peran |
|---|---|---|
| `sendfile on` | `off` (image resmi sudah on) | file dikirim langsung dari kernel ke socket |
| `tcp_nopush on` / `tcp_nodelay on` | `off` / `on` | `nopush` satukan header + awal file satu paket (hanya saat `sendfile` on); `nodelay` agar paket kecil tidak ditahan |
| `keepalive_timeout 65s` / `keepalive_requests 1000` | `75s` / `1000` | umur dan isi satu koneksi client |
| `worker_processes auto` / `worker_connections 1024` | `1` / `512` | jumlah worker = jumlah CPU; `worker_connections` = koneksi **per worker**, termasuk koneksi ke upstream |
| `keepalive 32` (blok `upstream`) | — | koneksi ke backend dipakai ulang; butuh `proxy_http_version 1.1` + `proxy_set_header Connection ""` |

```text
  kapasitas klien = worker_processes × worker_connections, dan tiap request proxy
  memakai 2 slot (client + upstream) → siapkan ≥ 2× lipat; dibatasi RLIMIT_NOFILE
  (naikkan dengan worker_rlimit_nofile bila perlu)
```

## Static asset, invalidation, dan risiko data personal

1. **Filename ber-hash** (`app.3fa2.js`) aman diberi `expires 30d`/`max`; ganti file = hash ganti = versi lama ditinggalkan. HTML cukup `no-cache`.
2. **Invalidation**: tunggu kedaluwarsa (`inactive`/`max_age`), hapus isi folder cache, atau lewati sekali dengan `?nocache=1`. Nginx OSS **tidak punya perintah `PURGE` bawaan** — ada modul `ngx_cache_purge` atau Nginx Plus.
3. **Risiko data personal**: cache key default `...$request_uri` **tidak membawa cookie maupun `Authorization`**. Untuk `/dashboard` per user, user A bisa kebagian konten user B. Cache hanya endpoint **publik dan identik**; endpoint personal diberi `proxy_no_cache` + `proxy_cache_bypass`, atau jangan di-cache.

---

## Contoh konfigurasi

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
events { worker_connections 1024; }        # per worker; proxy memakai 2 koneksi

http {
    sendfile on; tcp_nopush on; tcp_nodelay on;
    keepalive_timeout 65s; keepalive_requests 1000;

    gzip on;                                # default off
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024; gzip_vary on; gzip_proxied any;

    proxy_cache_path /var/cache/nginx/site levels=1:2 keys_zone=site:10m
                     inactive=10m max_size=100m use_temp_path=off;

    upstream backend {                      # koneksi ke backend dipakai ulang
        server app.internal:8080;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;

        location /                    { expires -1h; }            # HTML: no-cache
        location ~* \.(js|css|png|svg|woff2)$ { expires 30d; }     # aset: 30 hari

        location ^~ /api/ {                                        # endpoint publik
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";   # wajib agar keepalive upstream jalan
            proxy_cache site;
            proxy_cache_key "$scheme$host$request_uri";
            proxy_cache_valid 200 10m;
            proxy_cache_valid 404 1m;
            proxy_cache_bypass $arg_nocache $cookie_nocache;
            proxy_no_cache $http_authorization;
            proxy_buffering on;
            add_header X-Cache-Status $upstream_cache_status always;
        }
    }
}
```

| Directive | Penjelasan |
|---|---|
| `proxy_cache_path ... keys_zone=site:10m` | `keys_zone` = metadata di RAM; isi file ada di `path`. Wajib sebelum `proxy_cache site`. |
| `proxy_cache_key` | Dua URL dianggap konten sama bila key-nya sama — sumber utama kebocoran antar user. |
| `proxy_cache_bypass` / `proxy_no_cache` | `bypass` = tidak **dibaca**; `no_cache` = tidak **disimpan**; "" atau "0" berarti cache tetap dipakai. |
| `^~` pada `/api/` | mencegah regex aset merebut path proxy (mis. `/api/app.css`). |

---

## Lab

Container siap pakai + konfigurasi (blok `http` tidak perlu ditulis di conf.d — file conf.d memang sudah di-include ke dalam `http{}`):

```bash
podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
podman exec nginx-lab rm -f /etc/nginx/conf.d/default.conf   # hindari dua server_name localhost
# sendfile & keepalive_timeout sudah ada di nginx.conf bawaan: hapus dulu, nginx menolak duplikat per konteks
podman exec nginx-lab sed -i '/sendfile/d; /keepalive_timeout/d' /etc/nginx/nginx.conf

podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/14-cache.conf' <<'NGINX'
proxy_cache_path /var/cache/nginx/site levels=1:2 keys_zone=site:10m
                 inactive=10m max_size=100m use_temp_path=off;
sendfile on; tcp_nopush on; tcp_nodelay on; keepalive_timeout 65s;

gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1024; gzip_comp_level 5; gzip_vary on; gzip_proxied any;

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;

    location /                    { expires -1h; }
    location ~* \.(js|css|png|jpg|svg|woff2)$ { expires 30d; try_files $uri =404; }

    location = /echo/gone { return 404; } location /echo/ { return 200 "upstream_time=$time_iso8601\n"; }

    location ^~ /pub/ {
        proxy_pass http://127.0.0.1:80/echo/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_cache site;
        proxy_cache_key "$scheme$proxy_host$request_uri";
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_bypass $arg_nocache $cookie_nocache;
        proxy_no_cache $http_authorization;
        proxy_buffering on;
        add_header X-Cache-Status $upstream_cache_status always;
    }
}
NGINX

podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
# file uji gzip: harus lebih besar dari gzip_min_length (1024 byte)
podman exec nginx-lab sh -c 'i=1; while [ $i -le 30 ]; do echo "/* blok $i padding padding padding padding padding */"; i=$((i+1)); done > /usr/share/nginx/html/app.css'
```

**Ekspektasi:** `nginx -t` → `syntax is ok, test is successful`. Pengujian berikut menghasilkan: `/` menjawab `Cache-Control: no-cache`; `/app.css` menjawab `max-age=2592000` + `Expires` 30 hari ke depan; request **kedua** ke `/pub/hello` menjawab `X-Cache-Status: HIT` dengan isi identik request pertama; `404` pun ikut ter-cache (MISS lalu HIT); `?nocache=1` menjawab `BYPASS`; ukuran response gzip jauh lebih kecil.

```bash
# 1) browser cache
curl -s -D - -o /dev/null http://localhost:8080/        | grep -i cache-control
curl -s -D - -o /dev/null http://localhost:8080/app.css | grep -iE 'cache-control|expires'

# 2) gzip: angka "gzip" lebih kecil, plus Content-Encoding: gzip dan Vary: Accept-Encoding
curl -s -o /dev/null -H 'Accept-Encoding: gzip' -w 'gzip      : %{size_download} byte\n' http://localhost:8080/app.css
curl -s -o /dev/null -w 'tanpa gzip : %{size_download} byte\n' http://localhost:8080/app.css
curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' http://localhost:8080/app.css | grep -iE 'content-encoding|vary'

# 3) MISS lalu HIT — jalankan baris pertama dua kali
curl -s -D - -o /dev/null http://localhost:8080/pub/hello | grep -iE 'HTTP/|x-cache-status'
#    jawabannya: HTTP/1.1 200 OK + X-Cache-Status: MISS ; ulangi -> HIT

# 4) isi cache membeku, upstream tetap jalan
curl -s http://localhost:8080/pub/hello       # upstream_time=T (tersimpan di cache)
sleep 2
curl -s http://localhost:8080/pub/hello       # masih T — tidak diambil dari upstream
curl -s http://localhost:8080/echo/hello      # waktu sekarang (langsung tanpa cache)

# 5) 404 ikut di-cache, BYPASS, lalu bersihkan
curl -s -D - -o /dev/null http://localhost:8080/pub/gone | grep -iE 'HTTP/|x-cache-status'    # 404 + MISS
curl -s -D - -o /dev/null http://localhost:8080/pub/gone | grep -i x-cache-status             # HIT
curl -s -D - -o /dev/null 'http://localhost:8080/pub/hello?nocache=1' | grep -i x-cache-status   # BYPASS
podman exec nginx-lab sh -c 'rm -rf /var/cache/nginx/site/*'                                  # kosongkan cache
curl -s -D - -o /dev/null http://localhost:8080/pub/hello | grep -i x-cache-status             # MISS lagi
```

---

## Kesalahan umum

- Lupa `gzip on` → `gzip_types` tidak ada gunanya; lupa `gzip_types` → hanya `text/html` yang dikompres; `gzip_proxied` tetap `off` → response `proxy_pass` tidak ikut dikompres.
- `proxy_cache_path` ditulis di `server{}` → `nginx -t` gagal (hanya boleh di konteks `http`); `proxy_cache` tanpa `proxy_cache_path` → error `the "site" cache requires a shared memory zone`.
- `proxy_cache_valid` tidak di-set → masa simpan hanya dihitung dari `Expires`/`Cache-Control` upstream.
- `add_header X-Cache-Status` tanpa `always` → hilang pada 403/404; satu `add_header` di location membuat header warisan level atas ikut gugur.
- `expires` digabung `add_header Cache-Control` di lokasi yang sama → dua header `Cache-Control` bertarung; pilih salah satu.
- Endpoint personal ikut di-cache dengan key `...$request_uri` → user lain melihat data user lain.

---

## Rangkuman

- Dua lapis cache: **browser** (`expires`/`Cache-Control`) dan **proxy Nginx** (`proxy_cache*`).
- `expires -1h` → `no-cache`, `expires 30d` → `max-age=2592000`, default `expires off`.
- Proxy cache butuh `proxy_cache_path` (http) + `proxy_cache`; kendali lewat `proxy_cache_key`, `proxy_cache_valid`, `proxy_cache_bypass` (tidak dibaca), `proxy_no_cache` (tidak disimpan).
- `X-Cache-Status` (`$upstream_cache_status`): MISS, HIT, BYPASS, EXPIRED, STALE, UPDATING, REVALIDATED.
- **Default `gzip_types` hanya `text/html`**; default `gzip off`, `gzip_vary off`, `gzip_proxied off`.
- `sendfile` + `tcp_nopush` mempercepat pengiriman file; keepalive memangkas handshake; `worker_connections` menghitung koneksi ke upstream juga.
- Cache hanya untuk konten publik; invalidation = kedaluwarsa, hapus folder cache, atau `?nocache=1`.

---

## Latihan

1. Ubah `expires 30d` menjadi `expires -1h` pada location aset, uji lagi `curl -sI http://localhost:8080/app.css`, dan jelaskan kenapa browser tetap men-download file setiap kali.
2. Hapus baris `proxy_cache_valid 200 302 10m;`, ulangi uji MISS→HIT, lalu jelaskan apa yang terjadi pada `X-Cache-Status` dan penyebabnya.
3. Buat dua URL berbeda yang berisi konten sama, buktikan keduanya berbagi satu cache karena `proxy_cache_key`-nya sama — lalu tuliskan variabel tambahan yang kamu butuhkan agar terpisah (mis. `$cookie_user`) beserta risikonya.

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **Browser cache** | Simpanan response di client, dikontrol `Expires`/`Cache-Control`. |
| **Proxy cache** | Simpanan response di server Nginx, dikontrol `proxy_cache*`. |
| **`proxy_cache_path`** | Folder + `keys_zone` bersama untuk menyimpan cache (konteks http). |
| **`proxy_cache_key`** | Identitas konten; key sama = konten dianggap sama. |
| **`$upstream_cache_status`** | Variabel status cache: MISS, HIT, BYPASS, dst. |
| **Invalidation** | Membuang cache lama sebelum masa berlakunya habis. |
| **gzip** | Kompresi response saat transit (butuh `Accept-Encoding`). |
| **`sendfile`** | Kirim file langsung dari kernel ke socket. |
| **Keepalive** | Koneksi TCP/TLS dipakai ulang untuk banyak request. |

**Lanjut ke [Pelajaran 15 — Security Hardening →](15-security-hardening.md)**
