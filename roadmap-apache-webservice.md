# Roadmap Belajar Apache HTTP Server dari 0 sampai Mahir

Roadmap ini dirancang untuk mempelajari **Apache HTTP Server (httpd)** dari dasar hingga tingkat mahir, dengan pendekatan praktik langsung menggunakan **Podman** sebagai media simulasi.

Target akhir adalah mampu mengelola Apache sebagai:

- Web Server
- Virtual Host
- Reverse Proxy
- SSL/TLS Gateway
- Load Balancer
- Production Web Infrastructure

---

# Daftar Roadmap

- [ ] Level 0 — Fundamental Web & HTTP
- [ ] Level 1 — Pengenalan Apache HTTP Server
- [ ] Level 2 — Instalasi & Konfigurasi Dasar
- [ ] Level 3 — Virtual Host & Multiple Website
- [ ] Level 4 — Apache Modules
- [ ] Level 5 — URL Rewrite & Routing
- [ ] Level 6 — Reverse Proxy & Backend Integration
- [ ] Level 7 — SSL/TLS & HTTPS
- [ ] Level 8 — Security Hardening
- [ ] Level 9 — Performance & Optimization
- [ ] Level 10 — Logging & Monitoring
- [ ] Level 11 — Load Balancing & High Availability
- [ ] Level 12 — Advanced Apache
- [ ] Final Project — Production-like Apache Architecture

---

# Level 0 — Fundamental Web & HTTP

## Tujuan

Memahami bagaimana browser berkomunikasi dengan web server sebelum mempelajari Apache.

## Materi

- [ ] Internet
- [ ] Client dan Server
- [ ] DNS
- [ ] IP Address
- [ ] Port
- [ ] TCP
- [ ] HTTP
- [ ] HTTPS
- [ ] Request dan Response
- [ ] HTTP Headers
- [ ] HTTP Methods
- [ ] HTTP Status Codes
- [ ] MIME Types
- [ ] URL dan URI
- [ ] Cookies
- [ ] Session

## HTTP Request

```http
GET /index.html HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
```

## HTTP Response

```http
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 120

<html>
    <body>
        <h1>Hello Apache</h1>
    </body>
</html>
```

## HTTP Status Codes

| Status | Keterangan            |
| ------ | --------------------- |
| 200    | OK                    |
| 201    | Created               |
| 301    | Permanent Redirect    |
| 302    | Temporary Redirect    |
| 400    | Bad Request           |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Not Found             |
| 500    | Internal Server Error |
| 502    | Bad Gateway           |
| 503    | Service Unavailable   |

## Praktik

- [ ] Menggunakan `curl`
- [ ] Melihat response headers
- [ ] Menggunakan `curl -v`
- [ ] Menggunakan `curl -I`
- [ ] Memahami DNS resolution
- [ ] Mengakses website menggunakan IP
- [ ] Memahami perbedaan HTTP dan HTTPS

---

# Level 1 — Pengenalan Apache HTTP Server

## Tujuan

Memahami fungsi, arsitektur, dan cara kerja Apache HTTP Server.

## Materi

- [ ] Apa itu Apache HTTP Server?
- [ ] Sejarah Apache
- [ ] Apache vs Nginx
- [ ] Apache vs Caddy
- [ ] Web Server vs Application Server
- [ ] Apache Architecture
- [ ] Apache Request Lifecycle
- [ ] Apache Process Model
- [ ] Multi-Processing Module (MPM)
- [ ] Document Root
- [ ] Configuration File
- [ ] Apache Modules

## Arsitektur

```text
Browser
   |
   | HTTP Request
   v
Apache HTTP Server
   |
   | Read Configuration
   | Resolve Virtual Host
   | Process Request
   v
Document Root
   |
   v
HTTP Response
   |
   v
Browser
```

## Konsep Penting

| Konsep       | Fungsi                         |
| ------------ | ------------------------------ |
| httpd        | Apache daemon                  |
| DocumentRoot | Direktori website              |
| ServerName   | Identitas hostname             |
| VirtualHost  | Konfigurasi website            |
| Module       | Fitur tambahan                 |
| MPM          | Pengelolaan proses dan koneksi |
| Directory    | Pengaturan akses direktori     |
| Log          | Catatan aktivitas server       |

## Praktik

- [ ] Menjalankan Apache
- [ ] Mengakses halaman default
- [ ] Mengubah halaman HTML
- [ ] Menghentikan Apache
- [ ] Menjalankan Apache kembali
- [ ] Memahami proses Apache

---

# Level 2 — Instalasi & Konfigurasi Dasar

## Tujuan

Mampu menginstal, menjalankan, dan mengkonfigurasi Apache secara mandiri.

## Materi

- [ ] Instalasi Apache di Linux
- [ ] Instalasi Apache menggunakan Podman
- [ ] Apache Container
- [ ] Configuration Directory
- [ ] `httpd.conf`
- [ ] `apache2.conf`
- [ ] `conf.d`
- [ ] `sites-available`
- [ ] `sites-enabled`
- [ ] `Listen`
- [ ] `ServerName`
- [ ] `DocumentRoot`
- [ ] `DirectoryIndex`
- [ ] `Directory`
- [ ] `Options`
- [ ] `AllowOverride`
- [ ] `Require`
- [ ] `Include`
- [ ] Reload vs Restart

## Struktur Konfigurasi Debian/Ubuntu

```text
/etc/apache2/
├── apache2.conf
├── ports.conf
├── mods-available/
├── mods-enabled/
├── sites-available/
├── sites-enabled/
└── conf-available/
```

## Struktur Konfigurasi Official Container

```text
/usr/local/apache2/
├── conf/
│   ├── httpd.conf
│   └── extra/
├── htdocs/
├── logs/
└── modules/
```

## Praktik

- [ ] Menjalankan Apache menggunakan Podman
- [ ] Mengubah port 80 menjadi 8080
- [ ] Mengubah DocumentRoot
- [ ] Membuat halaman HTML
- [ ] Mengaktifkan konfigurasi
- [ ] Menonaktifkan konfigurasi
- [ ] Reload Apache
- [ ] Restart Apache
- [ ] Membaca error log

---

# Level 3 — Virtual Host & Multiple Website

## Tujuan

Mampu menjalankan beberapa website menggunakan satu Apache Server.

## Materi

- [ ] Virtual Host
- [ ] Name-based Virtual Host
- [ ] IP-based Virtual Host
- [ ] Port-based Virtual Host
- [ ] `VirtualHost`
- [ ] `ServerName`
- [ ] `ServerAlias`
- [ ] `DocumentRoot`
- [ ] `Directory`
- [ ] Default Virtual Host
- [ ] Hostname Resolution
- [ ] Local DNS Simulation

## Contoh Konfigurasi

```apache
<VirtualHost *:80>
    ServerName app1.local

    DocumentRoot "/var/www/app1"

    <Directory "/var/www/app1">
        Require all granted
        AllowOverride None
    </Directory>

    ErrorLog logs/app1-error.log
    CustomLog logs/app1-access.log combined
</VirtualHost>
```

Website Kedua:

```apache
<VirtualHost *:80>
    ServerName app2.local

    DocumentRoot "/var/www/app2"

    <Directory "/var/www/app2">
        Require all granted
        AllowOverride None
    </Directory>

    ErrorLog logs/app2-error.log
    CustomLog logs/app2-access.log combined
</VirtualHost>
```

## Arsitektur Simulasi

```text
Client
  |
  v
Apache :80
  |
  ├── app1.local
  │      └── /var/www/app1
  │
  ├── app2.local
  │      └── /var/www/app2
  │
  └── app3.local
         └── /var/www/app3
```

## Praktik

- [ ] Membuat 3 website
- [ ] Setiap website memiliki hostname berbeda
- [ ] Menggunakan port yang sama
- [ ] Membuat Virtual Host masing-masing
- [ ] Menggunakan `/etc/hosts`
- [ ] Menguji hostname menggunakan curl
- [ ] Membuat default Virtual Host
- [ ] Memahami hostname yang tidak dikenal

---

# Level 4 — Apache Modules

## Tujuan

Memahami modul Apache dan mengaktifkan fitur tambahan.

## Materi

- [ ] Apache Module Architecture
- [ ] Static Module
- [ ] Dynamic Module
- [ ] `LoadModule`
- [ ] Enable dan Disable Module
- [ ] `mod_rewrite`
- [ ] `mod_headers`
- [ ] `mod_ssl`
- [ ] `mod_proxy`
- [ ] `mod_proxy_http`
- [ ] `mod_proxy_balancer`
- [ ] `mod_deflate`
- [ ] `mod_expires`
- [ ] `mod_auth_basic`
- [ ] `mod_authz_core`
- [ ] `mod_alias`
- [ ] `mod_status`
- [ ] `mod_log_config`

## Module Penting

| Module             | Fungsi                  |
| ------------------ | ----------------------- |
| mod_rewrite        | URL rewriting           |
| mod_headers        | Manipulasi HTTP headers |
| mod_ssl            | HTTPS                   |
| mod_proxy          | Proxy                   |
| mod_proxy_http     | Reverse proxy HTTP      |
| mod_proxy_balancer | Load balancing          |
| mod_deflate        | Compression             |
| mod_expires        | Cache expiration        |
| mod_auth_basic     | Basic Authentication    |
| mod_status         | Monitoring              |
| mod_alias          | URL mapping             |

## Praktik

- [ ] Melihat module aktif
- [ ] Mengaktifkan module
- [ ] Menonaktifkan module
- [ ] Membuat URL Rewrite
- [ ] Menambahkan HTTP Headers
- [ ] Mengaktifkan Compression
- [ ] Mengaktifkan Apache Status

---

# Level 5 — URL Rewrite & Routing

## Tujuan

Mampu mengatur URL agar lebih fleksibel dan memahami routing web server.

## Materi

- [ ] URL Rewriting
- [ ] Redirect
- [ ] Permanent Redirect
- [ ] Temporary Redirect
- [ ] Rewrite Rule
- [ ] Rewrite Condition
- [ ] Regular Expression
- [ ] Query String
- [ ] Rewrite Flags
- [ ] `RewriteBase`
- [ ] `.htaccess`
- [ ] `AllowOverride`
- [ ] Front Controller Pattern

## Contoh Redirect

```apache
Redirect permanent /old https://example.com/new
```

## Contoh Rewrite

```apache
RewriteEngine On

RewriteRule ^users/([0-9]+)$ /user.php?id=$1 [L]
```

URL:

```text
/users/100
```

Diubah menjadi:

```text
/user.php?id=100
```

## Front Controller

```text
Browser
   |
   v
Apache
   |
   v
index.php
   |
   ├── /users
   ├── /products
   ├── /orders
   └── /dashboard
```

## Praktik

- [ ] Redirect HTTP ke HTTPS
- [ ] Redirect domain
- [ ] Redirect www ke non-www
- [ ] Membuat URL clean
- [ ] Membuat routing sederhana
- [ ] Menghilangkan ekstensi PHP
- [ ] Membuat fallback ke index.php
- [ ] Mencegah akses file tertentu

---

# Level 6 — Reverse Proxy & Backend Integration

## Tujuan

Mampu menggunakan Apache sebagai gateway menuju aplikasi backend.

## Materi

- [ ] Forward Proxy
- [ ] Reverse Proxy
- [ ] Proxy Architecture
- [ ] `mod_proxy`
- [ ] `mod_proxy_http`
- [ ] `ProxyPass`
- [ ] `ProxyPassReverse`
- [ ] Proxy Headers
- [ ] `X-Forwarded-For`
- [ ] `X-Forwarded-Host`
- [ ] `X-Forwarded-Proto`
- [ ] Backend Connection
- [ ] Proxy Timeout
- [ ] Proxy Error Handling
- [ ] WebSocket Proxy

## Arsitektur

```text
Client
   |
   v
Apache :80
   |
   ├── /api
   │      |
   │      v
   │   Backend API :8080
   │
   ├── /auth
   │      |
   │      v
   │   Auth Service :8081
   │
   └── /
          |
          v
       Frontend :3000
```

## Contoh Konfigurasi

```apache
ProxyPreserveHost On

ProxyPass        /api http://backend:8080/api
ProxyPassReverse /api http://backend:8080/api

ProxyPass        /auth http://auth-service:8081/auth
ProxyPassReverse /auth http://auth-service:8081/auth
```

## Praktik

- [ ] Membuat Apache Reverse Proxy
- [ ] Proxy ke aplikasi Go
- [ ] Proxy ke Node.js
- [ ] Proxy ke Lucee
- [ ] Proxy ke React frontend
- [ ] Proxy beberapa backend
- [ ] Menggunakan prefix URL
- [ ] Mengatur timeout
- [ ] Menguji backend yang down
- [ ] Memahami 502 Bad Gateway

---

# Level 7 — SSL/TLS & HTTPS

## Tujuan

Mampu mengamankan website menggunakan HTTPS.

## Materi

- [ ] SSL vs TLS
- [ ] HTTPS
- [ ] Certificate
- [ ] Private Key
- [ ] Public Key
- [ ] Certificate Authority
- [ ] Self-signed Certificate
- [ ] Let's Encrypt
- [ ] Certificate Chain
- [ ] PEM Format
- [ ] CSR
- [ ] TLS Handshake
- [ ] TLS Versions
- [ ] Cipher Suites
- [ ] SNI
- [ ] HTTP to HTTPS Redirect
- [ ] Certificate Renewal

## Arsitektur

```text
Client
   |
   | HTTPS :443
   v
Apache
   |
   ├── SSL Certificate
   ├── Private Key
   └── TLS Configuration
          |
          v
      Application
```

## Contoh HTTPS

```apache
<VirtualHost *:443>
    ServerName app.local

    DocumentRoot "/var/www/app"

    SSLEngine on

    SSLCertificateFile "/etc/ssl/certs/server.crt"
    SSLCertificateKeyFile "/etc/ssl/private/server.key"

    <Directory "/var/www/app">
        Require all granted
    </Directory>
</VirtualHost>
```

## Praktik

- [ ] Membuat self-signed certificate
- [ ] Mengaktifkan `mod_ssl`
- [ ] Mengkonfigurasi HTTPS
- [ ] Mengakses website melalui HTTPS
- [ ] Redirect HTTP ke HTTPS
- [ ] Menguji certificate
- [ ] Memahami certificate error
- [ ] Menggunakan TLS 1.2/1.3 sesuai dukungan
- [ ] Menggunakan Let's Encrypt pada domain valid

---

# Level 8 — Security Hardening

## Tujuan

Mengamankan Apache dari konfigurasi yang berisiko dan serangan umum.

## Materi

- [ ] Server Information Disclosure
- [ ] Directory Listing
- [ ] Access Control
- [ ] File Permission
- [ ] Directory Permission
- [ ] Least Privilege
- [ ] Basic Authentication
- [ ] IP Restriction
- [ ] HTTP Security Headers
- [ ] CORS
- [ ] Host Header
- [ ] Request Size Limit
- [ ] DoS Mitigation
- [ ] Slow HTTP Attacks
- [ ] Rate Limiting
- [ ] Security Updates
- [ ] OWASP Top 10
- [ ] Log Monitoring
- [ ] Web Application Firewall
- [ ] ModSecurity

## Menghindari Directory Listing

```apache
<Directory "/var/www/html">
    Options -Indexes
    Require all granted
</Directory>
```

## Mengurangi Informasi Server

```apache
ServerTokens Prod
ServerSignature Off
```

## Security Headers

```apache
Header always set X-Content-Type-Options "nosniff"

Header always set X-Frame-Options "SAMEORIGIN"

Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

## IP Restriction

```apache
<Directory "/var/www/admin">
    Require ip 192.168.1.0/24
</Directory>
```

## Basic Authentication

```apache
<Directory "/var/www/private">
    AuthType Basic
    AuthName "Restricted Area"
    AuthUserFile "/etc/apache2/.htpasswd"
    Require valid-user
</Directory>
```

## Praktik

- [ ] Menonaktifkan directory listing
- [ ] Mengamankan folder sensitif
- [ ] Membuat Basic Authentication
- [ ] Restrict akses berdasarkan IP
- [ ] Membuat security headers
- [ ] Mengamankan file `.env`
- [ ] Mencegah akses file backup
- [ ] Menguji permission
- [ ] Melakukan security scan
- [ ] Memahami ModSecurity

---

# Level 9 — Performance & Optimization

## Tujuan

Memahami cara Apache menangani banyak koneksi dan mengoptimalkan performa.

## Materi

- [ ] Apache MPM
- [ ] Prefork MPM
- [ ] Worker MPM
- [ ] Event MPM
- [ ] Thread
- [ ] Process
- [ ] Connection
- [ ] KeepAlive
- [ ] KeepAliveTimeout
- [ ] MaxRequestWorkers
- [ ] ThreadsPerChild
- [ ] ServerLimit
- [ ] Timeout
- [ ] Compression
- [ ] Browser Caching
- [ ] Static File Optimization
- [ ] HTTP/2
- [ ] HTTP/3 Overview
- [ ] Benchmarking
- [ ] Load Testing

## Perbandingan MPM

| MPM     | Model                                               | Penggunaan                           |
| ------- | --------------------------------------------------- | ------------------------------------ |
| Prefork | Process                                             | Kompatibilitas tertentu              |
| Worker  | Process + Thread                                    | Multiprocessing dan thread           |
| Event   | Process + Thread + event-driven connection handling | Pilihan modern untuk banyak workload |

## Contoh Konfigurasi

```apache
KeepAlive On

MaxKeepAliveRequests 100

KeepAliveTimeout 5

Timeout 60
```

## Compression

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>
```

## Cache

```apache
<IfModule mod_expires.c>
    ExpiresActive On

    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

## Praktik

- [ ] Mengukur performa baseline
- [ ] Mengubah konfigurasi MPM
- [ ] Mengatur KeepAlive
- [ ] Mengatur Timeout
- [ ] Mengaktifkan Compression
- [ ] Mengatur cache static file
- [ ] Menguji concurrent requests
- [ ] Membandingkan benchmark
- [ ] Mengidentifikasi bottleneck
- [ ] Mengoptimalkan berdasarkan hasil pengujian

---

# Level 10 — Logging, Monitoring & Troubleshooting

## Tujuan

Mampu menganalisis masalah Apache melalui log, status, dan pengujian.

## Materi

- [ ] Access Log
- [ ] Error Log
- [ ] Log Format
- [ ] Custom Log Format
- [ ] Log Rotation
- [ ] Apache Status
- [ ] Server Status
- [ ] Monitoring Resource
- [ ] CPU
- [ ] Memory
- [ ] Disk
- [ ] Network
- [ ] Connection Monitoring
- [ ] Request Monitoring
- [ ] HTTP Error Diagnosis

## Contoh Access Log

```text
192.168.1.10 - - [20/Nov/2026:10:00:00 +0700]
"GET /index.html HTTP/1.1" 200 1200
```

## Contoh Error Log

```text
[error] File does not exist: /var/www/html/test.html
```

## Apache Status

```apache
<Location "/server-status">
    SetHandler server-status

    Require ip 127.0.0.1
</Location>
```

## Troubleshooting

| Error                     | Kemungkinan Penyebab                       |
| ------------------------- | ------------------------------------------ |
| 403 Forbidden             | Permission / access restriction            |
| 404 Not Found             | File atau routing tidak ditemukan          |
| 500 Internal Server Error | Konfigurasi atau aplikasi bermasalah       |
| 502 Bad Gateway           | Backend tidak tersedia / proxy error       |
| 503 Service Unavailable   | Service overload atau unavailable          |
| Connection Refused        | Service tidak berjalan / port tidak listen |
| SSL Error                 | Certificate atau TLS configuration         |
| Timeout                   | Backend lambat / network / timeout config  |

## Praktik

- [ ] Membaca access log
- [ ] Membaca error log
- [ ] Membuat custom log format
- [ ] Mengaktifkan `mod_status`
- [ ] Troubleshooting 403
- [ ] Troubleshooting 404
- [ ] Troubleshooting 500
- [ ] Troubleshooting 502
- [ ] Troubleshooting HTTPS
- [ ] Troubleshooting Backend Timeout
- [ ] Menggunakan `curl`
- [ ] Menggunakan `ss` atau `netstat`
- [ ] Menggunakan `ps`
- [ ] Menggunakan `top` atau `htop`

---

# Level 11 — Load Balancing & High Availability

## Tujuan

Memahami cara Apache mendistribusikan traffic ke beberapa backend server.

## Materi

- [ ] Load Balancer
- [ ] Reverse Proxy Load Balancing
- [ ] Backend Pool
- [ ] Load Balancing Algorithm
- [ ] `mod_proxy_balancer`
- [ ] `balancer://`
- [ ] `mod_lbmethod_byrequests`
- [ ] `mod_lbmethod_bytraffic`
- [ ] Health Check
- [ ] Failover
- [ ] Backend Availability
- [ ] Sticky Session
- [ ] Session Persistence
- [ ] High Availability
- [ ] Redundancy

## Arsitektur

```text
                    Client
                      |
                      v
               Apache Load Balancer
                      |
             +--------+--------+
             |        |        |
             v        v        v
          Backend1 Backend2 Backend3
          :8081    :8082    :8083
```

## Contoh Konfigurasi

```apache
<Proxy "balancer://appcluster">
    BalancerMember "http://app1:8080"
    BalancerMember "http://app2:8080"
    BalancerMember "http://app3:8080"

    ProxySet lbmethod=byrequests
</Proxy>

ProxyPass        /app balancer://appcluster/
ProxyPassReverse /app balancer://appcluster/
```

## Praktik

- [ ] Membuat 3 backend container
- [ ] Membuat Apache load balancer
- [ ] Mendistribusikan request
- [ ] Menguji backend yang mati
- [ ] Menguji failover
- [ ] Menguji sticky session
- [ ] Memahami health checking
- [ ] Membuat simulasi High Availability

---

# Level 12 — Advanced Apache

## Tujuan

Mampu memahami konfigurasi Apache tingkat lanjut dan menggunakannya dalam arsitektur production.

## Materi

- [ ] Apache Configuration Inheritance
- [ ] Directive Context
- [ ] Global Configuration
- [ ] Virtual Host Configuration
- [ ] Directory Context
- [ ] `.htaccess` Performance
- [ ] Graceful Restart
- [ ] Graceful Shutdown
- [ ] Custom Error Pages
- [ ] Reverse Proxy Advanced
- [ ] WebSocket Proxy
- [ ] Unix Socket Proxy
- [ ] HTTP/2
- [ ] TLS Optimization
- [ ] Rate Limiting
- [ ] ModSecurity
- [ ] WAF
- [ ] Apache with Docker/Podman
- [ ] Apache in Kubernetes
- [ ] Apache with CDN
- [ ] Apache with DNS
- [ ] Deployment Automation

## Graceful Restart

```bash
apachectl graceful
```

## Configuration Test

```bash
apachectl configtest
```

## Virtual Host Inspection

```bash
apachectl -S
```

## Module Inspection

```bash
apachectl -M
```

## Praktik

- [ ] Membuat Custom Error Page
- [ ] Menggunakan Graceful Reload
- [ ] Memahami Directive Inheritance
- [ ] Membuat konfigurasi modular
- [ ] Mengamankan Reverse Proxy
- [ ] Membuat WAF
- [ ] Membuat deployment simulation
- [ ] Membuat konfigurasi reusable

---

# Roadmap Simulasi Podman

## Struktur Project

```text
apache-learning/
│
├── compose.yaml
│
├── apache/
│   ├── Dockerfile
│   ├── conf/
│   │   ├── httpd.conf
│   │   ├── vhosts/
│   │   ├── proxy/
│   │   └── ssl/
│   │
│   ├── logs/
│   └── htdocs/
│
├── websites/
│   ├── app1/
│   ├── app2/
│   └── app3/
│
├── backend/
│   ├── app1/
│   ├── app2/
│   └── app3/
│
└── certs/
```

## Tahapan Simulasi

| Tahap | Simulasi                | Target                 |
| ----- | ----------------------- | ---------------------- |
| 1     | Apache Container        | Menjalankan Web Server |
| 2     | Custom HTML             | Mengubah DocumentRoot  |
| 3     | Multiple Websites       | Virtual Host           |
| 4     | Custom Hostname         | DNS / hosts simulation |
| 5     | URL Rewrite             | Routing                |
| 6     | Apache + Backend        | Reverse Proxy          |
| 7     | Apache + HTTPS          | SSL/TLS                |
| 8     | Security Testing        | Hardening              |
| 9     | Apache + 3 Backend      | Load Balancing         |
| 10    | Backend Failure         | Failover               |
| 11    | Load Testing            | Performance            |
| 12    | Production Architecture | Final Project          |

## Simulasi 1 — Apache Standalone

### Target

Menjalankan Apache HTTP Server menggunakan Podman.

```text
Browser
   |
   v
localhost:8080
   |
   v
Apache Container
   |
   v
HTML
```

### Praktik

- [ ] Menjalankan container
- [ ] Mapping port 8080
- [ ] Mount HTML
- [ ] Mengubah halaman
- [ ] Mengakses Apache
- [ ] Melihat logs

### Contoh Perintah

```bash
podman run -d \
  --name apache \
  -p 8080:80 \
  docker.io/library/httpd:2.4
```

Pengujian:

```bash
curl http://localhost:8080
```

---

## Simulasi 2 — Multiple Virtual Hosts

### Target

Menjalankan beberapa website dengan hostname berbeda.

```text
app1.local
app2.local
app3.local
       |
       v
Apache :80
       |
       +── app1
       +── app2
       └── app3
```

### Praktik

- [ ] Membuat website app1
- [ ] Membuat website app2
- [ ] Membuat website app3
- [ ] Membuat konfigurasi Virtual Host
- [ ] Menggunakan hostname
- [ ] Menguji dengan curl

---

## Simulasi 3 — Apache Reverse Proxy

### Target

Apache meneruskan request ke backend.

```text
Client
   |
   v
Apache :8080
   |
   ├── /api
   │     └── Go API :8081
   │
   └── /app
         └── React :3000
```

### Praktik

- [ ] Membuat backend API
- [ ] Membuat frontend
- [ ] Menghubungkan Apache dengan backend
- [ ] Proxy berdasarkan path
- [ ] Mengatur forwarding headers
- [ ] Menguji backend unavailable

---

## Simulasi 4 — HTTPS

### Target

Menjalankan HTTPS menggunakan sertifikat lokal.

```text
Client
   |
   | HTTPS :443
   v
Apache
   |
   v
Backend
```

### Praktik

- [ ] Membuat certificate
- [ ] Membuat private key
- [ ] Mengaktifkan SSL
- [ ] Membuat Virtual Host HTTPS
- [ ] Redirect HTTP ke HTTPS
- [ ] Menguji SSL

---

## Simulasi 5 — Apache Load Balancer

### Target

Mendistribusikan traffic ke beberapa backend.

```text
Client
   |
   v
Apache :80
   |
   +── Backend 1 :8081
   |
   +── Backend 2 :8082
   |
   +── Backend 3 :8083
```

### Praktik

- [ ] Membuat 3 backend
- [ ] Membuat konfigurasi balancer
- [ ] Mengatur metode balancing
- [ ] Menguji distribusi request
- [ ] Menghentikan Backend 1
- [ ] Menguji failover
- [ ] Mengaktifkan kembali Backend 1

---

# Final Project — Production-like Apache Architecture

## Project

**Build Production-ready Apache Reverse Proxy & Load Balancer**

## Arsitektur

```text
                         Internet / Client
                                |
                                v
                       Apache HTTP Server
                         80 / 443
                                |
                  +-------------+-------------+
                  |                           |
                  v                           v
             Static Frontend            API Gateway
                  |                           |
                  |                     Apache Proxy
                  |                           |
                  |               +-----------+-----------+
                  |               |           |           |
                  |               v           v           v
                  |            Backend 1   Backend 2   Backend 3
                  |              :8081       :8082       :8083
                  |
                  v
              Frontend
```

## Requirements

### Web Server

- [ ] Apache HTTP Server
- [ ] Custom configuration
- [ ] Virtual Host
- [ ] Multiple domain
- [ ] HTTPS
- [ ] Redirect HTTP to HTTPS

### Reverse Proxy

- [ ] Proxy frontend
- [ ] Proxy backend API
- [ ] Proxy authentication service
- [ ] Forward headers
- [ ] Custom timeout

### Load Balancing

- [ ] Minimal 3 backend
- [ ] Request distribution
- [ ] Failover
- [ ] Backend recovery
- [ ] Health monitoring

### Security

- [ ] Disable directory listing
- [ ] Security headers
- [ ] Restrict sensitive files
- [ ] TLS configuration
- [ ] IP restriction
- [ ] Basic authentication for admin
- [ ] Prevent server information disclosure

### Monitoring

- [ ] Access log
- [ ] Error log
- [ ] Custom log format
- [ ] Apache Status
- [ ] Monitoring backend

### Performance

- [ ] Compression
- [ ] Static file caching
- [ ] KeepAlive
- [ ] MPM configuration
- [ ] Load testing

---

# Checklist Kompetensi

## Beginner

- [ ] Memahami HTTP dan HTTPS
- [ ] Memahami Client-Server
- [ ] Menginstal Apache
- [ ] Menjalankan Apache
- [ ] Mengubah port
- [ ] Mengubah DocumentRoot
- [ ] Mengelola konfigurasi dasar

## Intermediate

- [ ] Membuat Virtual Host
- [ ] Mengelola Multiple Website
- [ ] Menggunakan Apache Modules
- [ ] Membuat Rewrite Rule
- [ ] Mengkonfigurasi HTTPS
- [ ] Membuat Reverse Proxy
- [ ] Mengintegrasikan Apache dengan Backend

## Advanced

- [ ] Mengkonfigurasi Load Balancer
- [ ] Memahami MPM
- [ ] Mengoptimalkan Performance
- [ ] Mengamankan Apache
- [ ] Troubleshooting Production
- [ ] Monitoring Apache
- [ ] Membuat Failover
- [ ] Membuat Deployment Architecture

## Expert

- [ ] Merancang Apache Architecture
- [ ] Mengoptimalkan Server High Traffic
- [ ] Mengimplementasikan High Availability
- [ ] Mengintegrasikan WAF
- [ ] Mengelola TLS secara advanced
- [ ] Membuat Configuration Automation
- [ ] Melakukan Security Audit
- [ ] Melakukan Performance Benchmark

---

# Jadwal Belajar 12 Minggu

| Minggu | Fokus                     | Target                         |
| ------ | ------------------------- | ------------------------------ |
| 1      | Fundamental HTTP + Apache | Memahami cara kerja Web Server |
| 2      | Instalasi + Konfigurasi   | Apache berjalan                |
| 3      | Virtual Host              | Multiple Website               |
| 4      | Modules + Rewrite         | Routing                        |
| 5      | Reverse Proxy             | Backend Integration            |
| 6      | SSL/TLS                   | HTTPS                          |
| 7      | Security                  | Hardening                      |
| 8      | Performance               | Optimization                   |
| 9      | Logging + Troubleshooting | Debugging                      |
| 10     | Load Balancing            | Distribusi Traffic             |
| 11     | Advanced                  | High Availability              |
| 12     | Final Project             | Production-like Environment    |

Estimasi waktu belajar: **1–2 jam per hari, 5 hari per minggu**.

---

# Referensi

- Apache HTTP Server Documentation: https://httpd.apache.org/docs/
- Apache HTTP Server 2.4 Documentation: https://httpd.apache.org/docs/2.4/
- Apache Virtual Hosts: https://httpd.apache.org/docs/2.4/vhosts/
- Apache Modules: https://httpd.apache.org/docs/2.4/mod/
- Apache Reverse Proxy: https://httpd.apache.org/docs/2.4/howto/reverse_proxy.html
- Apache SSL/TLS: https://httpd.apache.org/docs/2.4/ssl/
- Podman Documentation: https://docs.podman.io/

---

# Prinsip Belajar

> Jangan hanya menghafal directive Apache. Untuk setiap konfigurasi, pahami request yang masuk, aturan yang diproses, backend atau file yang dituju, response yang keluar, serta cara membuktikan konfigurasi tersebut bekerja.

Setiap lab sebaiknya mencakup:

1. Tujuan
2. Diagram arsitektur
3. Konfigurasi
4. Perintah menjalankan
5. Pengujian (`curl`)
6. Simulasi error
7. Troubleshooting melalui log
8. Catatan dan kesimpulan
