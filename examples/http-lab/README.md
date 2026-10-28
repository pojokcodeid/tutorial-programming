# HTTP Lab — Laboratorium Latihan HTTP

Server latihan kecil untuk tutorial **HTTP** di aplikasi Belajar Koding. Semua contoh di materi bisa dijalankan di sini tanpa layanan eksternal dan tanpa dependensi npm.

> **Peringatan:** lab ini hanya untuk belajar di komputer sendiri. Data disimpan di memori, kredensialnya fiktif, dan konfigurasinya **bukan untuk produksi**. Jangan membuka port lab ke internet.

## Menjalankan

Prasyarat: **Node.js 18+** dan `curl`.

```bash
node examples/http-lab/server.js
```

Buka <http://localhost:8787/> untuk melihat daftar endpoint dan contoh `curl`. Hentikan dengan `Ctrl+C`.

Port bisa diganti:

```bash
PORT=9090 node examples/http-lab/server.js
```

## Pemeriksaan pertama

```bash
curl -i http://localhost:8787/health
curl -i "http://localhost:8787/echo?topik=http&page=2"
curl -i http://localhost:8787/headers
```

## Endpoint

| Endpoint | Kegunaan |
|---|---|
| `GET /` | Halaman daftar endpoint dan contoh perintah. |
| `GET /health` | Status server dan versi HTTP. |
| `GET /headers` | Seluruh request header yang diterima server. |
| `/echo` | Mengembalikan method, query, header, body, dan versi HTTP. |
| `GET /status/{kode}` | Mengembalikan status code 200–599. |
| `GET /redirect?to=/products` | Redirect 302 dengan header `Location`. |
| `GET /products` | Daftar produk dengan `page`, `limit`, dan `q`. |
| `POST /products` | Membuat produk; wajib JSON dan mendukung `Idempotency-Key`. |
| `GET /products/{id}` | Detail produk. |
| `PUT /products/{id}` | Mengganti seluruh data produk. |
| `PATCH /products/{id}` | Mengubah sebagian data produk. |
| `DELETE /products/{id}` | Menghapus produk, membalas `204`. |
| `POST /login` | Login demo, mengembalikan token dan cookie sesi. |
| `POST /logout` | Menghapus sesi/token dan cookie. |
| `GET /profile` | Butuh cookie sesi atau bearer token. |
| `GET /admin` | Butuh role `admin`; user biasa mendapat `403`. |
| `GET /cache` | ETag, `Cache-Control`, dan respons `304`. |
| `GET /private` | Contoh `Cache-Control: no-store`. |
| `GET /negotiate` | Content negotiation berdasarkan `Accept`. |
| `POST /upload` | Menghitung ukuran dan SHA-256 body (maksimal 1 MiB). |
| `GET /cors` | Contoh respons CORS; coba juga preflight `OPTIONS`. |
| `GET /rate` | Rate limit 5 request per 10 detik. |
| `GET /slow?ms=2000` | Respons lambat untuk latihan timeout. |
| `GET /range/sample.txt` | Range request dan `206 Partial Content`. |
| `GET /gzip` | Respons gzip/Brotli sesuai `Accept-Encoding`. |
| `GET /version` | Versi HTTP koneksi saat ini. |
| `POST /reset` | Mengembalikan data lab ke kondisi awal. |

## Akun demo

| Username | Password | Role |
|---|---|---|
| `nina` | `rahasia123` | `user` |
| `admin` | `admin123` | `admin` |

Jangan memakai kredensial asli atau data pribadi di lab ini.

## Alur latihan yang disarankan

### 1. Melihat request dan response

```bash
curl -i "http://localhost:8787/echo?nama=Nina&topik=http"
curl -i -X POST http://localhost:8787/echo \
  -H "Content-Type: application/json" \
  -d '{"pesan":"halo HTTP"}'
```

### 2. CRUD produk

```bash
curl -i "http://localhost:8787/products?page=1&limit=2"

curl -i -X POST http://localhost:8787/products \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: produk-001" \
  -d '{"name":"Gula Aren","price":25000,"stock":20}'

curl -i -X PATCH http://localhost:8787/products/4 \
  -H "Content-Type: application/json" \
  -d '{"stock":18}'

curl -i -X DELETE http://localhost:8787/products/4
```

### 3. Session dengan cookie

```bash
curl -i -c cookies.txt -X POST http://localhost:8787/login \
  -H "Content-Type: application/json" \
  -d '{"username":"nina","password":"rahasia123"}'

curl -i -b cookies.txt http://localhost:8787/profile
curl -i -b cookies.txt -X POST http://localhost:8787/logout
```

### 4. Bearer token

```bash
curl -i -X POST http://localhost:8787/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Salin `access_token` dari respons, lalu:

```bash
curl -i http://localhost:8787/admin \
  -H "Authorization: Bearer TOKEN_DARI_RESPONS"
```

### 5. Cache dan conditional request

```bash
curl -i http://localhost:8787/cache
```

Salin nilai `ETag`, lalu kirim kembali:

```bash
curl -i http://localhost:8787/cache \
  -H 'If-None-Match: "etag-dari-respons"'
```

Respons kedua seharusnya `304 Not Modified` tanpa body.

### 6. CORS

```bash
curl -i -X OPTIONS http://localhost:8787/cors \
  -H "Origin: http://localhost:8123" \
  -H "Access-Control-Request-Method: POST"
```

### 7. Reverse proxy

Jalankan lab di satu terminal, lalu proxy di terminal lain:

```bash
node examples/http-lab/proxy.js
curl -i http://localhost:8788/health
curl -i http://localhost:8788/__down
curl -i "http://localhost:8788/slow?ms=4000"
```

Proxy berjalan di port `8788`, meneruskan ke `8787`, menambahkan `X-Forwarded-For`, dan membalas `502`/`504` saat upstream bermasalah.

## HTTPS lokal (opsional)

Buat sertifikat self-signed untuk latihan:

```bash
mkdir -p examples/http-lab/certs
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout examples/http-lab/certs/localhost-key.pem \
  -out examples/http-lab/certs/localhost-cert.pem \
  -subj "/CN=localhost"
node examples/http-lab/server.js --https
```

Lalu:

```bash
curl -k -i https://localhost:8787/health
```

Flag `-k` hanya untuk sertifikat latihan yang belum dipercaya sistem. Jangan membiasakan `-k` di lingkungan nyata.

## Menjalankan pengujian

```bash
node --test examples/http-lab/lab.test.js
```

Pengujian memeriksa status code, header, body, cookie/token, ETag/304, CORS, range, kompresi, rate limit, dan proxy.

## Batasan yang disengaja

- Data produk dan sesi hanya di memori; restart menghapus semuanya.
- Token berupa string acak, bukan JWT bertanda tangan. Materi menjelaskan konsep JWT secara terpisah tanpa mengklaim lab ini produksi.
- Parser multipart tidak diurai; endpoint `/upload` hanya melaporkan ukuran dan hash body.
- Rate limit memakai fixed window sederhana, bukan algoritma terdistribusi.
- HTTPS memakai sertifikat self-signed, bukan sertifikat tepercaya.
