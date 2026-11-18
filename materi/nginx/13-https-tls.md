# Pelajaran 13 — HTTPS & TLS

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 9 (Virtual Host) dan Pelajaran 10 (Reverse Proxy), dasar HTTP, dasar terminal Podman.

---

## Tujuan belajar

- Menjelaskan alur TLS handshake serta peran certificate, private key, CA, SAN, dan chain.
- Mengaktifkan HTTPS dengan `listen 443 ssl`, `ssl_certificate`, dan `ssl_certificate_key`.
- Membuat sertifikat self-signed ber-SAN untuk lab memakai `openssl`.
- Mengarahkan HTTP ke HTTPS dan memahami konsekuensi HSTS.
- Memverifikasi sertifikat dengan `curl -k` dan `openssl s_client`.

---

## Cerita pembuka: surat terbuka vs amplop bersegel

Kirim uang lewat pos ada dua cara: **terbuka** (isinya kebaca siapa pun, pengirimnya pun tidak pasti) atau masuk **amplop bersegel** yang ditandatangani dan dilampiri **kartu identitas** kantor pos — isi tertutup, pengirim pasti. HTTPS adalah cara kedua; di baliknya ada protokol **TLS** yang mengunci isi komunikasi sekaligus memperkenalkan identitas server.

| Di pos | Di web |
|---|---|
| Amplop bersegel | Enkripsi TLS |
| Kartu identitas pengirim | **Certificate** (sertifikat) |
| Kunci pembuka amplop | **Private key** |
| Kantor pos penerbit kartu | **CA (Certificate Authority)** |
| Nama yang sah di kartu | **SAN** |

Intinya: **enkripsi menjaga isi, sertifikat menjaga identitas.**

---

## HTTPS = HTTP yang dibungkus TLS

```text
  TANPA TLS                        DENGAN TLS
┌─────────┐  GET /login  ┌──────┐  ┌─────────╮ ╭────────────╮ ┌──────┐
│ browser │ ───────────► │nginx │  │ browser │─┤ TLS tunnel ├─┤nginx │
└─────────┘  (terbuka)   └──────┘  └─────────╯ ╰────────────╯ └──────┘
```

| | `http://` | `https://` | | Di Nginx |
|---|---|---|---|---|
| Port bawaan | 80 | 443 | | `listen 80;` vs `listen 443 ssl;` |
| Isi request/response | terbuka di jaringan | terenkripsi | | identitas server: tidak ada vs certificate |

## TLS handshake dalam 5 langkah

```text
  Client (browser)                        Server (Nginx)
       │ 1. ClientHello (versi TLS, cipher, random, SNI)
       │───────────────────────────────────────►│
       │ 2. ServerHello + certificate chain + random
       │◄───────────────────────────────────────│
       │ 3. client verifikasi sertifikat ke CA, lalu "premaster secret"
       │    dienkripsi dengan PUBLIC key server
       │───────────────────────────────────────►│
       │ 4. kunci sesi disepakati
       │ 5. Finished ──► data berikutnya terenkripsi ◄── Finished
       │◄───────────────────────────────────────►│
```

Handshake hanya sekali per koneksi (lalu ada *session resumption*), jadi biayanya bukan di tiap request. Nginx berperan **terminator TLS**: ia memegang private key, koneksi ke backend di jaringan privat boleh tetap HTTP biasa.

## Certificate, private key, CA, SAN, dan chain

| Istilah | Isi/fungsi | Boleh dibagikan? |
|---|---|---|
| **Certificate (`.crt`)** | "Kartu identitas": nama domain, public key, masa berlaku, tanda tangan CA | Ya — memang dikirim ke client |
| **Private key (`.key`)** | Kunci rahasia pemilik domain untuk membuktikan kepemilikan | **TIDAK PERNAH** |
| **CA** | Pihak tepercaya penerbit sertifikat (mis. Let's Encrypt) | — |
| **SAN** | Daftar hostname/IP yang sah: `DNS:localhost`, `IP:127.0.0.1` | — |
| **Chain** | Urutan leaf → intermediate → root CA | — |

```text
[ root CA ]            ← sudah dipercaya browser & OS (trust store)
   └─[ intermediate CA ]── penerbit sertifikat domainmu
         └─[ sertifikat server ]── CN=localhost, SAN=DNS:localhost
               └─[ private key ]── RAHASIA, tidak pernah dikirim
```

Client menyusun rantai dari sertifikat yang diterimanya sampai root CA yang ia percaya. Kalau rantai putus (lupa kirim intermediate), browser bilang *"certificate error"* meski sertifikatnya valid. Di Nginx, `ssl_certificate` berisi **leaf dulu, baru intermediate** — urutan ini wajib.

## SNI: satu port untuk banyak sertifikat

Satu IP hanya punya satu port 443, tetapi kamu melayani puluhan domain. Caranya: client menuliskan nama domain yang dituju di `ClientHello` (ekstensi **SNI**), lalu Nginx memilih `server` block yang cocok — **baru** sertifikatnya dibaca. Tanpa SNI, satu IP:port hanya bisa menampilkan satu sertifikat default. Untuk menolak SNI tak dikenal (anti-scanning): `ssl_reject_handshake on;` di default server (Nginx ≥ 1.19.4).

## Baseline protocol dan cipher

```nginx
ssl_protocols TLSv1.2 TLSv1.3;     # TLS 1.0/1.1 sudah dianggap usang
ssl_ciphers HIGH:!aNULL:!MD5;      # default Nginx
ssl_session_cache shared:SSL:10m;  # sesi dibagi antar worker -> handshake murah
```

| Directive | Peran |
|---|---|
| `ssl_protocols` | Versi TLS yang diizinkan; default Nginx terbaru sudah `TLSv1.2 TLSv1.3` — tulis eksplisit agar konsisten. |
| `ssl_ciphers` | Daftar cipher format OpenSSL; default `HIGH:!aNULL:!MD5`. |
| `ssl_prefer_server_ciphers` | `off` (default); hanya berpengaruh untuk TLS ≤ 1.2. |
| `ssl_session_cache` | Tanpa ini tiap koneksi baru melakukan handshake penuh. |

## HSTS: sekali bilang "ya", selamanya

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Browser diperintahkan memakai HTTPS saja untuk domain ini, meski kamu mengetik `http://`. Konsekuensinya nyata:

- `max-age=31536000` → browser terkunci HTTPS 1 tahun; `preload` praktis tidak bisa dibatalkan.
- `includeSubDomains` menyeret semua subdomain — yang belum siap HTTPS **akan mati**.
- Kalau terlanjur salah: hanya bisa menunggu `max-age` habis atau proses panjang *preload removal*.

## Let's Encrypt: sertifikat gratis dan renewal

Let's Encrypt menerbitkan sertifikat **gratis** berlaku **90 hari**, divalidasi protokol **ACME**:

- **HTTP-01**: CA mengakses `http://domainmu/.well-known/acme-challenge/<token>` → port 80 harus terbuka untuk challenge ini.
- **DNS-01**: lewat record TXT di DNS → cocok untuk wildcard.

`certbot --nginx` memasang sertifikat dan menulis konfigurasi Nginx, lalu **renewal** dijalankan cron/systemd timer hampir tiap hari — dengan masa berlaku 90 hari, kamu tidak pernah kehilangan sertifikat.

---

## Contoh konfigurasi

```nginx
server {                                  # HTTP -> HTTPS
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}

server {                                  # HTTPS
    listen 443 ssl;
    server_name localhost;

    ssl_certificate     /etc/nginx/certs/localhost.crt;  # leaf dulu, lalu intermediate
    ssl_certificate_key /etc/nginx/certs/localhost.key;  # RAHASIA — jangan masuk Git

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;

    root /usr/share/nginx/html;
    index index.html;

    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

| Directive | Penjelasan |
|---|---|
| `listen 443 ssl` | Aktifkan TLS di 443. Tanpa `ssl`, Nginx menjawab HTTP biasa di port itu. |
| `ssl_certificate` / `ssl_certificate_key` | Sertifikat PEM (leaf dulu, lalu intermediate) dan private key PEM-nya. |
| `return 301 https://$host$request_uri` | Pindahkan semua path ke HTTPS; `$host` tanpa port, `$request_uri` mempertahankan query string. |
| `add_header ... always` | Menyertakan header juga pada response error (4xx/5xx), bukan hanya 200. |

---

## Lab

Siapkan sertifikat self-signed **dengan SAN** untuk `localhost`, lalu jalankan Nginx (8443 di host → 443 container):

```bash
podman rm -f nginx-lab 2>/dev/null || true
mkdir -p ~/nginx-lab/certs ~/nginx-lab/conf.d

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout ~/nginx-lab/certs/localhost.key \
  -out    ~/nginx-lab/certs/localhost.crt \
  -days 365 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
chmod 600 ~/nginx-lab/certs/localhost.key

openssl x509 -in ~/nginx-lab/certs/localhost.crt -noout -subject -issuer -dates
openssl x509 -in ~/nginx-lab/certs/localhost.crt -noout -text | grep -A1 'Subject Alternative Name'
```

**Ekspektasi:** `subject=CN=localhost`, `issuer=CN=localhost`, berlaku 1 tahun, dan `X509v3 Subject Alternative Name: DNS:localhost, IP Address:127.0.0.1`.

```bash
cat > ~/nginx-lab/conf.d/https.conf <<'EOF'
server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name localhost;
    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    root /usr/share/nginx/html;
    index index.html;
}
EOF

podman run -d --name nginx-lab -p 8080:80 -p 8443:443 \
  -v ~/nginx-lab/certs:/etc/nginx/certs:ro \
  -v ~/nginx-lab/conf.d:/etc/nginx/conf.d:ro \
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t        # ekspektasi: syntax is ok, test is successful

curl -i http://localhost:8080/        # 301, Location: https://localhost/ (tanpa port)
curl -k -i https://localhost:8443/    # 200 OK + Strict-Transport-Security
curl -i https://localhost:8443/       # GAGAL, exit 60: self-signed certificate
                                      # (bukti sertifikatmu tak dipercaya browser)

# sertifikat yang disajikan + protokolnya (Ctrl+C untuk keluar)
openssl s_client -connect localhost:8443 -servername localhost
#   ekspektasi: subject=CN=localhost, Protocol: TLSv1.3,
#               Verify return code: 18 (self-signed certificate)
```

> ⚠️ **Private key jangan pernah di-commit ke Git.** Tambahkan `certs/`, `*.key`, `*.crt` ke `.gitignore`, lalu cek `git check-ignore ~/nginx-lab/certs/localhost.key`. Private key adalah bukti kepemilikan domain: kalau ikut ter-commit, ia tetap tersimpan di riwayat Git selamanya meski file-nya dihapus — siapa pun bisa menyamar jadi domainmu. Sertifikat publik boleh dibagikan, kuncinya tidak.

---

## Kesalahan umum

- `listen 443` **tanpa `ssl`** → port terbuka tapi Nginx menjawab HTTP biasa.
- `ssl_certificate_key` tidak diisi → `nginx -t` gagal: `no "ssl_certificate_key" is defined for certificate ...`.
- Sertifikat **tanpa SAN** → browser menolak; CN saja sudah tidak cukup.
- Rantai putus (lupa intermediate) → *"unable to get local issuer certificate"*.
- Redirect menunjuk 443 sedangkan lab memakai 8443 → buka manual `https://localhost:8443/`.
- `includeSubDomains`/`preload` terlalu dini → subdomain yang belum siap HTTPS ikut mati.
- Self-signed dipakai di produksi → tidak ada jaminan identitas server.

---

## Rangkuman

- **HTTPS = HTTP + TLS**: enkripsi menjaga isi, sertifikat menjaga identitas.
- **Private key rahasia**; sertifikat & chain publik; **CA** menjamin, **SAN** menyebut hostname sah.
- Tiga langkah wajib: `listen 443 ssl` + `ssl_certificate` + `ssl_certificate_key`.
- **SNI** membuat satu port melayani banyak sertifikat.
- Baseline: TLS 1.2/1.3, cipher `HIGH:!aNULL:!MD5`, session cache aktif.
- Self-signed hanya untuk lab; produksi pakai Let's Encrypt + renewal otomatis.
- **HSTS** kuat dan sulit dibatalkan — nyalakan setelah semua layanan siap HTTPS.

---

## Latihan

1. Buat sertifikat self-signed untuk `app.local`, lalu buktikan `curl -k https://localhost:8443/` **gagal verifikasi hostname** sementara `curl -k --resolve app.local:8443:127.0.0.1 https://app.local:8443/` berhasil setelah `server_name` dan sertifikat diganti.
2. Hapus baris `ssl_certificate_key`, jalankan `podman exec nginx-lab nginx -t`, dan tuliskan pesan error persisnya. Kembalikan lagi.
3. Jelaskan kenapa HSTS dengan `includeSubDomains` bisa membuat `staging.example.com` ikut mati bila hanya `example.com` yang siap HTTPS.

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **TLS** | Protokol yang mengenkripsi dan memverifikasi koneksi. |
| **Certificate** | File publik: nama domain, public key, tanda tangan CA. |
| **Private key** | Kunci rahasia pemilik domain; tidak boleh masuk Git. |
| **CA** | Certificate Authority — penerbit dan penandatangan sertifikat. |
| **SAN** | Daftar hostname/IP yang dicakup satu sertifikat. |
| **Chain** | Rantai leaf → intermediate → root yang diverifikasi client. |
| **SNI** | Ekstensi TLS pengirim nama domain saat handshake. |
| **HSTS** | Header yang memaksa browser memakai HTTPS. |
| **ACME** | Protokol penerbitan sertifikat otomatis (Let's Encrypt). |
| **Self-signed** | Sertifikat yang menandatangani diri sendiri — tak dipercaya browser. |

**Lanjut ke [Pelajaran 14 — Caching & Performance →](14-caching-dan-performance.md)**
