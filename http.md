# Roadmap Belajar HTTP: Dari Nol sampai Mahir

> **Tujuan:** memahami HTTP dari konsep dasar hingga mampu menganalisis, merancang, mengamankan, dan mengoptimalkan komunikasi HTTP untuk aplikasi web dan API.
>
> **Durasi saran:** 8–12 minggu, sekitar 5–7 jam per minggu. Sesuaikan dengan pengalaman dan waktu yang tersedia.

## Cara Menggunakan Roadmap

- Ikuti modul secara berurutan; tiap modul mengandalkan konsep sebelumnya.
- Praktikkan menggunakan `curl`, browser DevTools, dan API lokal.
- Simpan catatan request/response dan hasil eksperimen dalam repositori belajar.
- Jangan hanya menghafal status code atau header: pahami alasan dan dampaknya.
- Gunakan endpoint milik sendiri atau lingkungan latihan yang memang diizinkan.

## Gambaran Tahapan

| Tahap | Fokus | Perkiraan |
|---|---|---:|
| 1 | Dasar jaringan dan web | 1 minggu |
| 2 | Struktur HTTP request/response | 1 minggu |
| 3 | Method, status code, dan header | 1–2 minggu |
| 4 | HTTP body, format data, dan content negotiation | 1 minggu |
| 5 | Cookies, session, cache, dan autentikasi | 1–2 minggu |
| 6 | HTTPS, TLS, dan keamanan | 1–2 minggu |
| 7 | HTTP/2, HTTP/3, proxy, dan performa | 1–2 minggu |
| 8 | Debugging, pengujian, dan proyek akhir | 1–2 minggu |

---

## Tahap 0 — Persiapan Alat

### Pelajari
- Apa itu client, server, browser, API, dan web server.
- Perbedaan URL, URI, domain, IP address, port, dan path.
- Peran DNS, TCP, TLS, dan HTTP dalam membuka situs.
- Perbedaan frontend, backend, reverse proxy, dan load balancer.

### Siapkan
- Browser modern dengan Developer Tools.
- Terminal dan `curl`.
- Editor kode.
- Opsional: Postman, Insomnia, atau Bruno.
- Server lokal sederhana, misalnya Node.js, Bun, Go, atau Python.

### Praktik
- Buka tab **Network** di DevTools.
- Kunjungi beberapa situs dan perhatikan URL, status, request headers, response headers, dan timing.
- Jalankan:

```bash
curl -I https://example.com
curl -v https://example.com
curl -o /dev/null -s -w 'HTTP: %{http_code}\nTotal: %{time_total}s\n' https://example.com
```

### Target kelulusan
- [ ] Dapat menjelaskan perjalanan dasar dari URL hingga respons server.
- [ ] Dapat menggunakan `curl` untuk melihat header dan detail koneksi.

## Tahap 1 — Fondasi HTTP

### Pelajari
- HTTP sebagai protokol komunikasi client-server.
- Model request-response.
- HTTP stateless dan makna “stateless”.
- Perbedaan HTTP dan HTTPS.
- Versi protokol: HTTP/1.0, HTTP/1.1, HTTP/2, HTTP/3.
- Peran standar RFC dan dokumentasi MDN.

### Praktik
- Bandingkan beberapa situs menggunakan `curl -I`.
- Temukan redirect dan header `Location`.
- Amati bahwa satu halaman dapat memicu banyak request (HTML, CSS, JavaScript, gambar, API).

### Target kelulusan
- [ ] Dapat menjelaskan peran HTTP dalam aplikasi web.
- [ ] Dapat membedakan HTTP dengan DNS, TCP, TLS, dan IP.

## Tahap 2 — Struktur Request dan Response

### Pelajari request
- Request line: method, target, dan versi protokol (format bergantung versi).
- Headers.
- Blank line pemisah header dan body.
- Request body.
- URL: scheme, authority/host, port, path, query string, fragment.
- Perbedaan query string dan request body.

### Pelajari response
- Status line pada HTTP/1.1.
- Status code.
- Response headers.
- Response body.
- Mengapa fragment `#...` tidak dikirim ke server sebagai bagian request target.

### Contoh konseptual HTTP/1.1

```http
GET /products?page=2 HTTP/1.1
Host: example.com
Accept: application/json
User-Agent: LearningClient/1.0
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

{"items":[],"page":2}
```

### Praktik
```bash
curl -v 'https://httpbin.org/get?topic=http'
curl -i https://httpbin.org/headers
```

> Gunakan layanan pengujian publik secara wajar; bila tidak tersedia, ganti dengan server lokal.

### Target kelulusan
- [ ] Dapat membaca request dan response secara manual.
- [ ] Dapat menjelaskan fungsi header dan body.

## Tahap 3 — HTTP Methods dan Semantik

### Pelajari method
- `GET`: mengambil representasi resource.
- `HEAD`: seperti `GET`, tetapi tanpa response body.
- `POST`: mengirim data untuk diproses, sering untuk membuat resource atau menjalankan aksi.
- `PUT`: membuat atau mengganti representasi resource pada target URI.
- `PATCH`: menerapkan perubahan parsial.
- `DELETE`: meminta penghapusan resource.
- `OPTIONS`: menemukan opsi komunikasi; juga digunakan dalam CORS preflight.
- `TRACE` dan `CONNECT`: pahami tujuan dan alasan penggunaannya dibatasi pada banyak sistem.

### Konsep penting
- **Safe:** method tidak dimaksudkan mengubah state server.
- **Idempotent:** pengulangan request yang sama memiliki efek yang setara dengan satu kali untuk semantik yang ditentukan.
- Idempotensi bukan berarti response harus identik.
- `GET` seharusnya tidak digunakan untuk aksi yang mengubah data.
- Perbedaan penggunaan `PUT` dan `PATCH`.

### Praktik
```bash
curl -i https://httpbin.org/get
curl -i -X POST https://httpbin.org/post \
  -H 'Content-Type: application/json' \
  -d '{"name":"Belajar HTTP"}'
curl -i -X PUT https://httpbin.org/put \
  -H 'Content-Type: application/json' \
  -d '{"name":"HTTP"}'
curl -i -X PATCH https://httpbin.org/patch \
  -H 'Content-Type: application/json' \
  -d '{"name":"HTTP tingkat lanjut"}'
curl -i -X DELETE https://httpbin.org/delete
```

### Target kelulusan
- [ ] Dapat memilih method berdasarkan semantik, bukan kebiasaan.
- [ ] Dapat menjelaskan safe dan idempotent beserta contohnya.

## Tahap 4 — Status Codes dan Header

### Status code yang perlu dikuasai

| Kode | Arti umum | Contoh penggunaan |
|---|---|---|
| `200 OK` | Berhasil | Request berhasil |
| `201 Created` | Resource dibuat | Pembuatan data berhasil |
| `202 Accepted` | Diterima untuk diproses | Proses berjalan asynchronous |
| `204 No Content` | Berhasil tanpa body | Update berhasil tanpa representasi |
| `301 Moved Permanently` | Redirect permanen | URL pindah permanen |
| `302 Found` | Redirect sementara secara historis | Redirect sementara |
| `304 Not Modified` | Representasi tidak berubah | Validasi cache |
| `400 Bad Request` | Request tidak valid | Sintaks/parameter salah |
| `401 Unauthorized` | Kredensial autentikasi tidak ada/tidak valid | Perlu login atau token valid |
| `403 Forbidden` | Akses ditolak | Identitas tidak memiliki izin |
| `404 Not Found` | Resource tidak ditemukan | ID tidak ada |
| `405 Method Not Allowed` | Method tidak didukung untuk resource | `POST` pada endpoint read-only |
| `409 Conflict` | Konflik state | Duplikasi atau konflik versi |
| `415 Unsupported Media Type` | Format body tidak didukung | Content-Type salah |
| `422 Unprocessable Content` | Konten dipahami tetapi instruksi/data tidak dapat diproses | Validasi bisnis gagal |
| `429 Too Many Requests` | Terlalu banyak request | Rate limit |
| `500 Internal Server Error` | Kesalahan server | Bug tak terduga |
| `502 Bad Gateway` | Gateway menerima respons tidak valid | Masalah upstream |
| `503 Service Unavailable` | Layanan sementara tidak tersedia | Maintenance/overload |
| `504 Gateway Timeout` | Gateway timeout ke upstream | Backend terlalu lambat |

### Header penting
- Representasi: `Content-Type`, `Content-Length`, `Content-Encoding`.
- Preferensi client: `Accept`, `Accept-Language`, `Accept-Encoding`.
- Cache: `Cache-Control`, `ETag`, `Last-Modified`, `If-None-Match`, `If-Modified-Since`, `Vary`, `Age`.
- Koneksi dan pengalihan: `Location`, `Host` (HTTP/1.1), `Connection` (perhatikan batasan pada HTTP/2 dan HTTP/3).
- Keamanan: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`.
- Identitas dan observabilitas: `Authorization`, `traceparent`, request ID yang ditetapkan sistem.

### Praktik
- Buat endpoint yang mengembalikan `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, dan `500`.
- Periksa respons dengan `curl -i`.
- Tentukan status code untuk 10 skenario API buatan sendiri.

### Target kelulusan
- [ ] Dapat memilih status code yang konsisten.
- [ ] Dapat membaca header yang memengaruhi konten, cache, dan keamanan.

## Tahap 5 — Body, Media Types, dan Content Negotiation

### Pelajari
- `Content-Type` menjelaskan format konten yang dikirim.
- `Accept` menyatakan format respons yang dapat diterima.
- JSON, form URL-encoded, multipart form data, teks, HTML, dan binary.
- Charset dan encoding.
- `Content-Encoding` seperti gzip atau Brotli.
- Upload file dan batas ukuran.
- Perbedaan `Content-Length` dengan transfer framing; HTTP/2 dan HTTP/3 memiliki framing berbeda dari HTTP/1.1.

### Praktik
```bash
# JSON
curl -i https://httpbin.org/post \
  -H 'Content-Type: application/json' \
  -d '{"message":"hello"}'

# Form URL-encoded
curl -i https://httpbin.org/post \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'username=demo&active=true'

# Mengirim file sebagai multipart
curl -i https://httpbin.org/post \
  -F 'description=contoh' \
  -F 'file=@./contoh.txt'
```

### Target kelulusan
- [ ] Dapat memilih `Content-Type` yang benar.
- [ ] Dapat membedakan format body, media type, dan content encoding.

## Tahap 6 — Cookies, Session, Authentication, dan Authorization

### Pelajari
- HTTP stateless dan cara aplikasi mempertahankan state.
- `Cookie` dan `Set-Cookie`.
- Atribut cookie: `Secure`, `HttpOnly`, `SameSite`, `Path`, `Domain`, `Expires`, `Max-Age`.
- Session berbasis server vs token.
- Basic authentication (untuk pemahaman; hanya melalui HTTPS).
- Bearer token dan header `Authorization`.
- Perbedaan authentication (siapa pengguna) dan authorization (apa yang boleh dilakukan).
- Refresh token, expiry, logout, dan pencabutan token.
- CORS bukan mekanisme autentikasi.

### Praktik
- Buat endpoint login dan endpoint profil pada server lokal.
- Uji cookie dengan dan tanpa `HttpOnly`, `Secure`, serta `SameSite`.
- Simpan cookie pada file sementara dan gunakan kembali dengan `curl`:

```bash
curl -i -c cookies.txt http://localhost:3000/login
curl -i -b cookies.txt http://localhost:3000/profile
```

- Jangan gunakan kredensial asli pada endpoint latihan publik.

### Target kelulusan
- [ ] Dapat menjelaskan alur login berbasis session atau token.
- [ ] Dapat menentukan atribut cookie sesuai kebutuhan.
- [ ] Dapat membedakan autentikasi, otorisasi, dan CORS.

## Tahap 7 — Caching dan Conditional Requests

### Pelajari
- Browser cache, shared cache, CDN, dan reverse proxy cache.
- `Cache-Control`: `max-age`, `no-cache`, `no-store`, `public`, `private`, `s-maxage`, `must-revalidate`.
- `ETag` dan `Last-Modified`.
- Conditional request: `If-None-Match`, `If-Modified-Since`, `If-Match`, `If-Unmodified-Since`.
- `304 Not Modified`.
- Cache invalidation, variasi respons (`Vary`), dan risiko menyimpan respons sensitif.
- `no-cache` tidak sama dengan `no-store`: `no-cache` mengizinkan penyimpanan tetapi mewajibkan validasi sebelum penggunaan ulang.

### Praktik
```bash
curl -i https://example.com
curl -i -H 'If-None-Match: "nilai-etag-dari-respons"' https://example.com
```

Ganti nilai ETag dengan nilai yang benar-benar dikembalikan server. Bandingkan ukuran respons dan status code.

### Target kelulusan
- [ ] Dapat merancang kebijakan cache untuk aset statis dan data API.
- [ ] Dapat menjelaskan validasi cache dengan ETag dan `304`.

## Tahap 8 — HTTPS, TLS, dan Keamanan HTTP

### Pelajari
- Peran TLS: kerahasiaan, integritas, dan autentikasi server.
- Sertifikat, certificate chain, hostname verification, dan masa berlaku.
- Redirect HTTP ke HTTPS dan HSTS.
- CORS: origin, preflight `OPTIONS`, `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, dan header yang diizinkan.
- CSRF, XSS, clickjacking, request smuggling, SSRF, dan open redirect pada tingkat konsep.
- Security headers dan validasi input.
- Rate limiting, ukuran request, timeout, dan batas resource.
- Jangan menaruh token rahasia di URL karena URL sering masuk ke log atau riwayat.

### Prinsip penting
- CORS terutama membatasi akses yang dilakukan browser; bukan pengganti otorisasi server.
- Jika menggunakan credential/cookie lintas origin, konfigurasi origin harus spesifik; `Access-Control-Allow-Origin: *` tidak cocok dengan credentialed requests.
- `HttpOnly` mengurangi akses JavaScript ke cookie, tetapi tidak menghilangkan seluruh risiko XSS atau CSRF.
- TLS tidak menggantikan validasi input atau kontrol akses.

### Praktik
- Jalankan server lokal dengan HTTPS untuk latihan.
- Periksa sertifikat menggunakan browser atau `curl -v`.
- Uji request preflight dari frontend lokal ke API lokal.
- Audit security headers aplikasi sendiri.

### Target kelulusan
- [ ] Dapat menjelaskan apa yang dilindungi TLS dan apa yang tidak.
- [ ] Dapat mendiagnosis masalah CORS umum.
- [ ] Dapat membuat daftar mitigasi dasar untuk API.

## Tahap 9 — HTTP/1.1, HTTP/2, HTTP/3, dan Infrastruktur

### Pelajari
- HTTP/1.1: persistent connections, pipelining (jarang digunakan), chunked transfer coding.
- HTTP/2: binary framing, multiplexing, stream, HPACK header compression, dan prioritas (perilaku implementasi dapat berbeda).
- HTTP/3: HTTP di atas QUIC, yang menggunakan UDP dan mengintegrasikan transport security melalui TLS 1.3.
- Head-of-line blocking pada level transport dan bagaimana HTTP/2/3 mengubah karakteristiknya.
- Reverse proxy, load balancer, CDN, TLS termination, dan upstream.
- Forwarded headers seperti `Forwarded` dan `X-Forwarded-For`; hanya percaya header proxy dari proxy tepercaya.
- Connection pooling, keep-alive, timeout, retry, dan backpressure.

### Praktik
- Periksa protokol yang dinegosiasikan di DevTools atau `curl -v`.
- Buat arsitektur lokal: client → reverse proxy → backend.
- Uji apa yang terjadi ketika backend lambat atau tidak tersedia.
- Amati redirect, timeout, dan header yang diteruskan proxy.

### Target kelulusan
- [ ] Dapat membandingkan HTTP/1.1, HTTP/2, dan HTTP/3.
- [ ] Dapat menggambarkan alur request melalui proxy dan backend.
- [ ] Dapat menjelaskan timeout dan retry yang aman.

## Tahap 10 — API Design dan Perilaku Lanjutan

### Pelajari
- Resource-oriented API dan penamaan URI.
- Pagination, filtering, sorting, dan versioning.
- Idempotency key untuk operasi yang berisiko diulang, terutama pembuatan/pembayaran.
- Retry dengan exponential backoff dan jitter; jangan retry sembarang operasi tanpa memahami semantiknya.
- Rate limit headers dan pola `429`.
- Long polling, Server-Sent Events (SSE), WebSocket, dan kapan HTTP biasa tidak cukup.
- Range requests (`Range`, `206 Partial Content`, `Content-Range`).
- `Expect: 100-continue`, `Prefer`, `Link`, dan `Retry-After` sesuai kebutuhan.
- HTTP trailers dan dukungan yang bervariasi di infrastruktur.

### Praktik
Rancang API katalog produk:
- `GET /products`
- `GET /products/{id}`
- `POST /products`
- `PUT /products/{id}`
- `PATCH /products/{id}`
- `DELETE /products/{id}`

Dokumentasikan method, status code, header, skema request/response, validasi, autentikasi, pagination, dan kebijakan cache.

### Target kelulusan
- [ ] Dapat mendesain API yang konsisten dan mudah dipahami.
- [ ] Dapat menjelaskan dampak retry dan idempotensi.
- [ ] Dapat memilih antara HTTP request-response, SSE, dan WebSocket.

## Tahap 11 — Debugging, Observability, dan Pengujian

### Pelajari
- Browser DevTools Network panel.
- `curl -v`, `curl -i`, `--trace-ascii`, dan opsi timing.
- Log request/response dengan redaksi token, cookie, dan data pribadi.
- Correlation ID, trace ID, dan distributed tracing.
- Latency: DNS, connect, TLS, time-to-first-byte, dan total time.
- Unit test, integration test, contract test, dan pengujian beban.
- Perbedaan error client, server, proxy, DNS, TLS, dan jaringan.
- Jangan merekam body atau credential sensitif tanpa alasan dan perlindungan yang memadai.

### Praktik diagnosis
Saat request gagal, periksa secara berurutan:
1. URL, DNS, dan konektivitas.
2. Negosiasi TLS dan sertifikat.
3. Redirect dan URL akhir.
4. Method, headers, body, dan encoding.
5. Status code dan response body.
6. Cookie, token, izin, dan CORS.
7. Proxy, timeout, log backend, serta dependency.
8. Apakah kegagalan dapat diulang dengan aman.

### Target kelulusan
- [ ] Dapat mereproduksi bug HTTP menggunakan `curl`.
- [ ] Dapat menemukan penyebab dari bukti, bukan sekadar menebak.
- [ ] Dapat membuat test untuk perilaku sukses dan gagal.

## Tahap 12 — Proyek Akhir

Bangun API kecil menggunakan bahasa atau framework pilihan (misalnya Bun/TypeScript, Go, atau Lucee/CFML).

### Persyaratan
- [ ] CRUD resource dengan method yang tepat.
- [ ] Status code dan error response yang konsisten.
- [ ] JSON request/response dan validasi `Content-Type`.
- [ ] Login dengan session cookie atau bearer token.
- [ ] Otorisasi pada setiap endpoint yang membutuhkan izin.
- [ ] CORS yang tepat untuk frontend yang digunakan.
- [ ] HTTPS pada lingkungan deployment.
- [ ] Cache aset dan conditional request pada setidaknya satu endpoint.
- [ ] Rate limiting dan batas ukuran request.
- [ ] Timeout, logging terstruktur, dan request ID.
- [ ] Integration tests yang mencakup status code, headers, dan body.
- [ ] Dokumentasi endpoint beserta contoh `curl`.
- [ ] README berisi cara menjalankan, konfigurasi, dan threat model singkat.

### Kriteria penilaian
| Area | Bobot |
|---|---:|
| Semantik method dan status code | 20% |
| Header, body, dan content type | 15% |
| Authentication, authorization, dan CORS | 20% |
| Cache dan performa | 15% |
| Testing dan debugging | 15% |
| Dokumentasi dan observability | 15% |

Target yang disarankan: minimal 80% dan tidak ada kelemahan kritis pada autentikasi atau otorisasi.

---

## Checklist Kompetensi Akhir

- [ ] Menjelaskan siklus request-response HTTP.
- [ ] Membaca request dan response mentah.
- [ ] Memilih method dan status code dengan tepat.
- [ ] Memahami header, body, media type, dan content negotiation.
- [ ] Menerapkan cookie, session/token, autentikasi, dan otorisasi.
- [ ] Mengonfigurasi cache dan conditional requests.
- [ ] Memahami TLS, CORS, CSRF, XSS, dan security headers.
- [ ] Membandingkan HTTP/1.1, HTTP/2, dan HTTP/3.
- [ ] Mendiagnosis redirect, timeout, proxy, dan error API.
- [ ] Merancang API, menguji perilaku HTTP, dan mendokumentasikannya.

## Referensi Belajar

Utamakan dokumentasi resmi dan sumber yang menjelaskan konsep secara terstruktur:

- MDN HTTP: https://developer.mozilla.org/en-US/docs/Web/HTTP
- MDN HTTP messages: https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages
- MDN HTTP methods: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
- MDN HTTP status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- MDN HTTP headers: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
- MDN CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- MDN Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
- RFC 9110 — HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110
- RFC 9111 — HTTP Caching: https://www.rfc-editor.org/rfc/rfc9111
- RFC 9112 — HTTP/1.1: https://www.rfc-editor.org/rfc/rfc9112
- RFC 9113 — HTTP/2: https://www.rfc-editor.org/rfc/rfc9113
- RFC 9114 — HTTP/3: https://www.rfc-editor.org/rfc/rfc9114
- curl documentation: https://curl.se/docs/

## Saran Jadwal Mingguan

- **Minggu 1:** Tahap 0–1; konsep web, jaringan, dan HTTP.
- **Minggu 2:** Tahap 2; request dan response.
- **Minggu 3:** Tahap 3–4; method, status code, dan header.
- **Minggu 4:** Tahap 5; body dan content negotiation.
- **Minggu 5:** Tahap 6; cookie, session, authentication, authorization.
- **Minggu 6:** Tahap 7; caching.
- **Minggu 7:** Tahap 8; HTTPS dan keamanan.
- **Minggu 8:** Tahap 9; HTTP/2, HTTP/3, dan proxy.
- **Minggu 9:** Tahap 10; desain API.
- **Minggu 10:** Tahap 11; debugging dan testing.
- **Minggu 11–12:** Tahap 12; proyek akhir dan evaluasi.

**Prinsip utama:** setiap konsep harus diikuti eksperimen nyata. Jika sebuah request gagal, gunakan DevTools atau `curl` untuk mengamati bukti, lalu jelaskan penyebab dan solusinya dengan kata-kata sendiri.
