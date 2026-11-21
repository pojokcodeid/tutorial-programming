# apache-lab — Lab Apache HTTP Server dengan Podman

Lab latihan untuk bab **Apache HTTP Server** pada tutorial ini. Satu gateway
`httpd:2.4` melayani website statis, virtual host, reverse proxy, load
balancer, dan HTTPS — ditemani tiga container backend.

Semua port memakai angka **non-standar** (8080/8081/8443) supaya container
dapat berjalan **tanpa hak istimewa**.

```text
                    client (curl / browser)
                            |
        +-------------------+-------------------+
        |                   |                   |
   :8080 HTTP           :8081 redirect      :8443 HTTPS
        |                   |                   |
        +--------- apache-lab (httpd:2.4) -------+
                            |
        +-------------------+-------------------+
        |                   |                   |
   backend-1:80        backend-2:80        backend-3:80
   (nginx:alpine)      (nginx:alpine)      (nginx:alpine)
```

Isi lab:

| Route / Fitur | Lokasi konfigurasi | Yang dibuktikan |
| --- | --- | --- |
| `/` | `apache/extra/app.conf` | Website statis dari `DocumentRoot` |
| `/docs/` | `Alias` di `app.conf` | Dokumen **di luar** `DocumentRoot` |
| `/private/` | `<Location>` + `Require all denied` | 403 |
| `/assets/*` | `<Directory>` + `mod_expires` | Cache 30 hari |
| `/halaman/tentang` | `RewriteRule` | SPA fallback ke `index.html` |
| `/api/`, `/app/` | `snippets/proxy-routes.conf` | `ProxyPass` ke `balancer://` |
| `/slow/` | `ProxyPass ... timeout=3` | Error 502/503 vs timeout |
| `Host: api.local`, `Host: docs.local` | `apache/extra/*.conf` | Name-based virtual host |
| `:8081` | `Redirect permanent` | HTTP → HTTPS |
| `:8443` | `<VirtualHost *:8443>` | TLS + HTTP/2 (`Protocols h2`) |
| `/server-status` | `apache/extra/status.conf` | `mod_status` |

## Persyaratan

- Podman (dengan `podman compose` atau `podman-compose`)
- `curl` dan `openssl` di **host** (image `httpd:2.4` tidak memuat keduanya)
- Port 8080, 8081, 8443 bebas

> **Catatan mount:** konfigurasi dipasang sebagai bind mount file
> (`./apache/httpd.conf` → `/usr/local/apache2/conf/httpd.conf`).
> Bila editor kamu mengganti file (inode baru) dan container tidak melihat
> perubahan lagi, jalankan `podman compose up -d --force-recreate apache-lab`.
> Di macOS, folder repo juga harus berada di lokasi yang dibagikan ke mesin
> Podman (`/Users`, `/private`, `/var/folders`) — salin lab ke `~/apache-lab`
> bila repo ada di disk luar.

## Menjalankan

```bash
bash scripts/gen-certs.sh   # sertifikat self-signed (sekali saja)
podman compose up -d
podman logs -f apache-lab   # Ctrl+C untuk berhenti melihat log
```

Uji otomatis:

```bash
bash scripts/test-routing.sh   # 35 pemeriksaan routing & HTTPS
bash scripts/test-proxy.sh     # 25 pemeriksaan proxy & load balancing
```

Kedua skrip mencetak `PASS`/`FAIL` per pemeriksaan dan **exit code 1**
bila ada yang gagal.

Berhenti:

```bash
podman compose down
```

## Struktur

```text
apache-lab/
├── compose.yaml            # apache-lab + backend-1/2/3
├── apache/
│   ├── httpd.conf          # konfigurasi utama (Listen, modul, balancer)
│   ├── extra/              # virtual host: app, api, docs, status
│   └── snippets/           # potongan dipakai ulang (proxy & header)
├── web/                    # DocumentRoot (index.html, api.html, assets/)
├── docs/                   # dokumen terpisah (diakses lewat Alias)
├── backends/               # konfigurasi & konten ketiga backend
├── certs/                  # hasil gen-certs.sh (tidak masuk Git)
└── scripts/                # gen-certs, test-routing, test-proxy
```

## Uji manual (per materi)

### Virtual host

```bash
curl -H "Host: app.local" http://localhost:8080/
curl -H "Host: api.local" http://localhost:8080/
curl -H "Host: docs.local" http://localhost:8080/
podman exec apache-lab httpd -S      # daftar vhost & default vhost
```

**Ekspektasi:** tiga balasan berbeda pada port yang sama — bukti satu port
melayani beberapa website. `httpd -S` mencetak `app.local:8080` sebagai
default vhost karena bloknya paling atas.

### Konfigurasi & modul

```bash
podman exec apache-lab httpd -t        # validasi konfigurasi
podman exec apache-lab httpd -M        # modul yang dimuat
podman exec apache-lab httpd -l        # modul yang dikompilasi statis
```

**Ekspektasi:** `Syntax OK`, dan daftar `-M` memuat `ssl_module`,
`rewrite_module`, `proxy_module`, `proxy_balancer_module`,
`deflate_module`, `expires_module`, `http2_module`, `status_module`.

### Reverse proxy & header

```bash
curl http://localhost:8080/api/headers/
curl -k https://localhost:8443/api/headers/
```

**Ekspektasi:** baris `host=`, `x-real-ip=`, `x-forwarded-for=`, dan
`x-forwarded-proto=` terisi; nilai `x-forwarded-proto` berubah `http` →
`https` sesuai pintu masuk. Backend juga melihat `Host` asli
(`ProxyPreserveHost On`).

### Load balancing

```bash
# Round-robin: ulangi sampai isi body berganti antar backend
for i in $(seq 1 12); do
  curl -s http://localhost:8080/api/ | grep -o 'backend-[0-9]' | head -1
done

podman logs --tail 3 backend-1
podman logs --tail 3 backend-2
podman logs --tail 3 backend-3
```

**Ekspektasi:** lebih dari satu nilai berbeda, dan `podman logs` tiap
backend menunjukkan baris `GET /` — request memang dibagi.

### Gagal total & failover

```bash
podman stop backend-1                  # satu backend mati
for i in $(seq 1 8); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/; done
podman start backend-1
podman exec apache-lab httpd -k graceful
```

**Ekspektasi:** hampir semua request tetap `200`. Saat container dihentikan
nama DNS `backend-1` ikut hilang, sehingga **satu** request pertama boleh
gagal (500/503) sebelum balancer menyingkirkan member itu dari rotasi.
Apache **tidak** otomatis mencoba member lain di dalam request yang sama
(beda dengan `proxy_next_upstream` Nginx).

### Error 502/503 vs timeout

```bash
curl -o /dev/null -w '%{http_code} %{time_total}\n' http://localhost:8080/slow/
# tanpa listener backend-1:9090 -> 503, cepat (connectiontimeout=2)

podman exec -d backend-1 sh -c 'sleep 60 | nc -l -p 9090'
curl -o /dev/null -w '%{http_code} %{time_total}\n' http://localhost:8080/slow/
# ada listener tapi tidak menjawab -> 502, ±3 detik (timeout=3)
podman exec backend-1 sh -c 'pkill -f "nc -l -p 9090"'
```

**Ekspektasi:** status cepat untuk "tidak bisa dijangkau", lambat untuk
"tidak menjawab". Di lab ini koneksi yang ditolak membalas **503** dan
timeout membaca respons membalas **502** (lihat `podman logs apache-lab`
— `AH01114` vs `AH01102`); di lingkungan lain bisa 502/504. Gunakan
*waktu* + log untuk membedakan, bukan menghafal angka.

### HTTPS & HTTP/2

```bash
curl -k https://localhost:8443/
curl -k --http2 -I https://localhost:8443/ | head -1     # HTTP/2 200
curl --cacert certs/server.crt https://127.0.0.1:8443/   # dipercaya
curl -sI http://localhost:8081/ | head -3                 # 301 -> https
openssl s_client -connect localhost:8443 -servername app.local </dev/null | head -5
```

### Monitoring

```bash
curl -s http://localhost:8080/server-status | head -20
curl -s 'http://localhost:8080/server-status?auto'
curl -s http://localhost:8080/server-info | grep -i 'loaded modules' -A5
```

**Ekspektasi:** jumlah worker, request aktif, trafik per detik.
`/server-status` di lab ini sengaja terbuka agar bisa diuji — di produksi
wajib dibatasi `Require ip ...` (lihat komentar di `apache/extra/status.conf`).

## Troubleshooting

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| `AH00526: LoadModule takes two arguments` | Komentar `# ...` di akhir baris direktif | Pindahkan komentar ke baris sendiri |
| `ProxyPass unknown Balancer parameter` | Atribut tidak didukung target `balancer://` | Set `timeout`/`connectiontimeout` di `BalancerMember` |
| `Syntax error ... snippets/proxy-routes.conf` | Salinan lama di container | `podman compose up -d --force-recreate apache-lab` |
| Container mati: `AH00172` / bind mount | File konfigurasi diganti inode baru | Force recreate (lihat Catatan mount) |
| 403 padahal file ada | `<Directory>` belum `Require all granted` / `Options -Indexes` | Cek `httpd -S`, lalu blok `<Directory>` vhost |
| 404 untuk `/docs/` | `Alias` belum didefinisikan atau folder tak termount | Cek volume `./docs` di `compose.yaml` |
| 500 pada `/api/` | Nama backend gagal di-resolve (container berhenti) | `podman start backend-*` lalu `httpd -k graceful` |
| Sertifikat ditolak | `certs/` belum dibuat / SAN tidak cocok | `bash scripts/gen-certs.sh` lalu force recreate |

## Kebersihan

```bash
podman compose down --rmi local --volumes
rm -f certs/server.crt certs/server.key
```
