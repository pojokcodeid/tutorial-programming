# Pelajaran 4 — Mengelola & Memvalidasi Konfigurasi

> **Durasi:** ± 10 menit
> **Prasyarat:** Pelajaran 3 (paham directive & context), container `nginx-lab`, dasar terminal & Podman.

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Memakai `nginx -t` untuk memvalidasi dan `nginx -T` untuk melihat konfigurasi efektif (semua `include` sudah dibuka).
- Membedakan **reload** (graceful, tanpa downtime) dengan **restart** (mati hidup total).
- Menjalankan Nginx dengan **bind mount** dan memisahkan konfigurasi per file di folder `conf.d/`.

---

## Cerita pembuka: ganti resep tanpa menutup restoran

Restoran sedang ramai dan chef ingin mengganti resep. Ada dua cara: **tutup restoran sebentar** (pelanggan sempat tidak dilayani), atau **ganti resep di dapur yang tetap masak** — chef baru menerima resep baru, chef lama menyelesaikan pesanan yang sedang berjalan. Cara 1 = **restart**, cara 2 = **reload** (*graceful reload*). Nginx punya `nginx -s reload` khusus untuk mengganti konfigurasi **tanpa memutus koneksi yang sedang berjalan**. Syaratnya: resep baru harus dicek dulu — di Nginx, "cek dulu" = `nginx -t`.

---

## Dua perintah wajib: `nginx -t` dan `nginx -T`

**`nginx -t`** membaca konfigurasi lengkap (termasuk semua `include`) lalu melaporkan valid atau tidak — **tanpa mengubah apa pun**:

```text
$ nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Hasilnya cuma dua: `test is successful` → aman reload; atau `nginx: [emerg] ...` + `test failed` (syntax salah, file hilang, port bentrok) → perbaiki dulu, **jangan reload**.

**`nginx -T`** mencetak **seluruh** konfigurasi efektif setelah wildcard dan `include` dibuka, lengkap dengan nama file asalnya — kepakai memastikan file di `conf.d/` benar-benar termuat dan mendokumentasikan konfigurasi aktif.

> **Aturan emas: tidak pernah reload sebelum `nginx -t` sukses.**

---

## Reload vs restart

| | `nginx -s reload` | `podman restart nginx-lab` |
|---|---|---|
| **Cara kerja** | Master baca konfigurasi baru → spawn worker baru → worker lama selesaikan request lama | Hentikan seluruh proses container, jalankan lagi |
| **Koneksi berjalan** | **Tetap hidup** sampai request selesai; downtime nol | **Terputus** semua; ada jeda mati-hidup |
| **Konfigurasi rusak** | Ditolak; worker lama **tetap jalan** dengan konfigurasi lama | Container bisa gagal start |
| **Kapan dipakai** | Perubahan konfigurasi rutin (hampir selalu) | Ganti binary/env container, perbaikan darurat |

Di dalam container: `podman exec nginx-lab nginx -t` dulu, baru `podman exec nginx-lab nginx -s reload`. Alurnya: **edit → `nginx -t` → reload → `curl` verifikasi**; kalau `nginx -t` gagal, perbaiki file — Nginx lama tetap jalan dengan konfigurasi lama.

---

## Bind mount: konfigurasi hidup di host

Secara default file konfigurasi ada **di dalam container** — hilang kalau container dibuang. Versi tanpa mount: `podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine`.

**Bind mount** menempelkan file/folder host ke path container — inilah yang dipakai lab kita:

```bash
podman run -d --name nginx-lab -p 8080:80 -v "$PWD/nginx.conf":/etc/nginx/nginx.conf:ro,Z docker.io/library/nginx:alpine
```

Bagian `-v` dibaca `sumber:tujuan:opsi`:

| Bagian | Arti |
|--------|------|
| `$PWD/nginx.conf` | File di **host** (yang kamu edit) |
| `/etc/nginx/nginx.conf` | Lokasi di **container** (yang dibaca Nginx) |
| `ro` | *read-only* — container hanya boleh baca; konfigurasi memang tidak ditulis |
| `Z` | Pelabelan konten untuk **SELinux** (Fedora/RHEL); tanpa SELinux efeknya nol |

Hasilnya: edit file di host, lalu `nginx -t` + reload — tidak perlu masuk container.

---

## Struktur `conf.d/` dan cara include-nya

Berdasarkan Pelajaran 3, satu file = satu tanggung jawab. `nginx.conf` cukup aturan global + rujukan:

```text
nginx-lab/                     ← folder di HOST, di-mount ke container
├── nginx.conf                 ← aturan global + rujukan include
└── conf.d/
    ├── 00-default.conf        ← server default (urutan alfabet)
    └── 01-status.conf         ← server tambahan
```

Satu baris di dalam blok `http` yang mengikat semuanya:

```nginx
include /etc/nginx/conf.d/*.conf;
```

- Wildcard `*.conf` dievaluasi **urut alfabet** → penamaan `00-`, `01-` berguna bila urutan penting; file tanpa akhiran `.conf` tidak ikut terbaca.
- Buktikan dengan `nginx -T`: header `# configuration file .../conf.d/...` harus muncul.

---

## Contoh konfigurasi

`nginx-lab/nginx.conf` — file utama yang di-mount ke `/etc/nginx/nginx.conf`:

```nginx
error_log  /var/log/nginx/error.log  notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    access_log  /var/log/nginx/access.log;
    include     /etc/nginx/mime.types;
    include     /etc/nginx/conf.d/*.conf;
}
```

| Directive | Context | Fungsi |
|-----------|---------|--------|
| `error_log ... notice` | main | Log error ke lokasi tetap (bukan log bawaan yang bisa hilang) |
| `pid /var/run/nginx.pid` | main | File PID master — tempat `nginx -s reload` mengirim sinyal |
| `worker_connections 1024` | events | Koneksi maksimal per worker |
| `access_log ...` | http | Access log ke lokasi tetap (di image resmi mengarah ke stdout) |
| `include .../mime.types` | http | Peta ekstensi file → tipe MIME |
| `include conf.d/*.conf` | http | Menyeret semua file `conf.d/` ke konfigurasi efektif |

Isi `conf.d/00-default.conf` (satu server = satu file) menyusul langsung di Lab.

---

## Lab

Siapkan file konfigurasi di host, lalu jalankan container dengan bind mount (bila container Pelajaran 3 masih ada, buang dulu):

```bash
podman rm -f nginx-lab
mkdir -p nginx-lab/conf.d

cat > nginx-lab/nginx.conf <<'EOF'
error_log  /var/log/nginx/error.log  notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    access_log  /var/log/nginx/access.log;
    include     /etc/nginx/mime.types;
    include     /etc/nginx/conf.d/*.conf;
}
EOF

cat > nginx-lab/conf.d/00-default.conf <<'EOF'
server {
    listen       80;
    server_name  _;

    location / {
        root  /usr/share/nginx/html;
        index index.html;
    }

    location = /health {
        return 200 "ok\n";
    }
}
EOF

podman run -d --name nginx-lab -p 8080:80 \
  -v "$PWD/nginx-lab/nginx.conf":/etc/nginx/nginx.conf:ro,Z \
  -v "$PWD/nginx-lab/conf.d":/etc/nginx/conf.d:ro,Z \
  docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -T | grep 'configuration file'
curl -i http://localhost:8080
curl -i http://localhost:8080/health
```

**Ekspektasi:** `nginx -t` → `test is successful`; `nginx -T` menampilkan `# configuration file .../nginx.conf:` **dan** `.../conf.d/00-default.conf:`; `curl /` → `200 OK` (halaman Welcome) dan `curl /health` → `200 OK` dengan body `ok`.

Uji perubahan **tanpa restart** — tambah satu file server baru lalu reload:

```bash
cat > nginx-lab/conf.d/01-status.conf <<'EOF'
server {
    listen       80;
    server_name  status.local;

    location = /status {
        return 200 "managed via conf.d\n";
    }
}
EOF

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -s reload
curl -i -H 'Host: status.local' http://localhost:8080/status
podman ps --filter name=nginx-lab
```

**Ekspektasi:** `curl` membalas `200 OK` dengan body `managed via conf.d`, dan container tetap `Up` — perubahan aktif tanpa pernah berhenti. (`Host: status.local` dipakai karena `01-status.conf` memakai `server_name` itu; tanpa header-nya request jatuh ke server default.)

Bandingkan dengan restart:

```bash
podman restart nginx-lab
curl -i http://localhost:8080/health
```

**Ekspektasi:** service hidup lagi, tapi waktu `Up` container menunjukkan mulai baru — artinya sempat mati sejenak.

---

## Kesalahan umum

- **Langsung reload tanpa `nginx -t`** — konfigurasi rusak membuat reload ditolak; kalau kamu sampai restart, baru ada downtime nyata.
- **`nginx -t` dihost padahal Nginx jalan di container** — yang dites file host terpisah. Selalu: `podman exec nginx-lab nginx -t`.
- **Lupa mount `conf.d/`** — kamu mengedit file host, container memakai folder bawaannya sendiri; perubahan tak pernah terlihat.
- **`conf.d/` tidak termuat** karena `nginx.conf` tidak punya `include /etc/nginx/conf.d/*.conf;` — cek lewat `nginx -T`.
- **Editor mengganti file (rename) saat menyimpan** — mount file bisa menunjuk inode lama. Simpan dengan menimpa konten (seperti `cat >`), atau mount foldernya saja.

---

## Rangkuman

- **`nginx -t`** = cek validitas tanpa mengubah apa pun; selalu sebelum reload. **`nginx -T`** = cetak konfigurasi efektif sebagai bukti file benar-benar termuat.
- **Reload** bersifat *graceful*: nol downtime, konfigurasi rusak justru ditolak dan Nginx lama tetap jalan. **Restart** mematikan seluruh proses — hanya untuk perubahan di luar konfigurasi.
- **Bind mount** (`-v sumber:tujuan:ro,Z`) membuat konfigurasi hidup di host dan selamat dari penghapusan container.
- Pola modular: `nginx.conf` global + `conf.d/*.conf` per domain, diikat satu baris `include`.

---

## Latihan

1. Hapus satu titik koma di `00-default.conf`, jalankan `nginx -t`, dan tuliskan **pesan error persisnya**. Kembalikan ke semula sampai `test is successful`.
2. Jalankan `curl` berulang ke `http://localhost:8080/` sambil melakukan `nginx -s reload`, lalu buktikan tidak ada request yang gagal.
3. Beri 2 contoh kasus nyata ketika **reload tidak cukup** dan kamu harus **restart** (petunjuk: perubahan di luar isi file konfigurasi).

---

## Istilah baru

| Istilah | Arti singkat |
|---------|--------------|
| **`nginx -t`** | Memvalidasi konfigurasi tanpa menerapkannya. |
| **`nginx -T`** | Mencetak seluruh konfigurasi efektif beserta nama file asalnya. |
| **Reload** | Membaca ulang konfigurasi secara graceful tanpa memutus koneksi. |
| **Graceful** | Proses lama diakhiri setelah request yang sedang berjalan selesai. |
| **Restart** | Mematikan dan menjalankan ulang seluruh proses. |
| **Bind mount** | Menempelkan file/folder host ke path di dalam container (`-v`). |
| **`conf.d/`** | Folder potongan konfigurasi yang diseret oleh `include`. |
| **SELinux / `Z`** | Mekanisme keamanan OS yang perlu pelabelan konten mount di Fedora/RHEL. |

**Lanjut ke [Pelajaran 5 — Static Web Server →](05-static-web-server.md)**
