/* ============================================================
   Soal kuis Apache HTTP Server — 40 soal (apache01–apache40)
   ============================================================ */
'use strict';

window.APACHE_QUIZ_POOL = window.APACHE_QUIZ_POOL || [];

window.APACHE_QUIZ_POOL.push(
  {
    id: 'apache01',
    q: 'Dalam analogi gedung perkantoran, Apache HTTP Server berperan paling mirip...',
    options: [
      'Satpam lobi yang meneruskan tamu ke ruangan yang benar',
      'Karyawan yang mengerjakan pekerjaan kantor di dalam ruangan',
      'Gudang arsip tempat dokumen disimpan permanen',
      'Teknisi listrik yang menyalakan lampu gedung'
    ],
    answer: 0,
    explain: 'Apache adalah pintu masuk yang menerima request, lalu melayani file sendiri atau meneruskannya ke aplikasi di belakangnya (reverse proxy).'
  },
  {
    id: 'apache02',
    q: 'Browser mengirim `GET /index.html HTTP/1.1` beserta header `Host: app.local`. Bagian yang menentukan file mana yang harus dibaca Apache adalah...',
    options: [
      'Baris method dan path, dipadukan dengan DocumentRoot vhost yang cocok',
      'User-Agent, karena browser yang memilih file',
      'Angka 200 pada response',
      'Port yang ditulis di header Host'
    ],
    answer: 0,
    explain: 'Apache memakai path untuk menemukan file relatif terhadap DocumentRoot, dan header Host untuk memilih virtual host yang melayani.'
  },
  {
    id: 'apache03',
    q: 'Status `403 Forbidden` pada Apache paling sering berarti...',
    options: [
      'File tidak ada di disk',
      'File/lokasi ada, tapi aturan otorisasi menolak akses',
      'Backend proxy sedang mati',
      'Konfigurasi syntax error sehingga server tidak bisa mulai'
    ],
    answer: 1,
    explain: '403 = ditolak oleh aturan akses (`Require all denied`, permission, `Options -Indexes`). File yang tidak ada menghasilkan 404.'
  },
  {
    id: 'apache04',
    q: 'Header `Content-Type: text/html; charset=UTF-8` pada response berfungsi untuk...',
    options: [
      'Memberi tahu client cara menafsirkan isi response (MIME type)',
      'Memaksa browser mengunduh file sebagai ZIP',
      'Menyimpan sesi user di server',
      'Mengenkripsi isi response'
    ],
    answer: 0,
    explain: 'Content-Type menjelaskan jenis media (MIME type) sehingga browser tahu harus merender HTML, CSS, JSON, dan sebagainya.'
  },
  {
    id: 'apache05',
    q: 'Nama lain proses/daemon Apache HTTP Server adalah...',
    options: [
      'nginx',
      'httpd',
      'systemd',
      'sshd'
    ],
    answer: 1,
    explain: 'Banyak distro memanggilnya `httpd` (HTTP daemon); Debian/Ubuntu menamai binarnya `apache2`, image resmi memakai `httpd`.'
  },
  {
    id: 'apache06',
    q: 'Perbedaan paling mendasar Apache 2.4 dengan Nginx terletak pada...',
    options: [
      'Apache hanya bisa menyajikan file statis',
      'Model pemrosesan: Apache memakai MPM (proses/thread per konfigurasi), Nginx memakai master + worker event-driven',
      'Apache tidak mendukung virtual host',
      'Nginx tidak bisa menjadi reverse proxy'
    ],
    answer: 1,
    explain: 'Apache menjalankan model yang dipilih lewat MPM (prefork/worker/event); Nginx memakai satu master dengan worker event-driven non-blocking.'
  },
  {
    id: 'apache07',
    q: 'MPM yang menjalankan satu proses anak per proses (tanpa thread) dan dipilih saat harus kompatibel dengan modul lama adalah...',
    options: [
      'mpm_event',
      'mpm_worker',
      'mpm_prefork',
      'mpm_thread'
    ],
    answer: 2,
    explain: 'mpm_prefork memakai proses tunggal per koneksi; mahal di memori, tapi wajib untuk modul non-thread-safe seperti mod_php lama.'
  },
  {
    id: 'apache08',
    q: 'Direktif `DocumentRoot` menentukan...',
    options: [
      'Direktori tempat file konfigurasi disimpan',
      'Direktori dasar yang menjadi akar path URL website',
      'Direktori log akses',
      'Direktori tempat modul dimuat'
    ],
    answer: 1,
    explain: 'DocumentRoot adalah akar filesystem untuk konten web; `/style.css` dibaca dari `<DocumentRoot>/style.css`.'
  },
  {
    id: 'apache09',
    q: 'Di container `docker.io/library/httpd:2.4`, konfigurasi utama berada di...',
    options: [
      '/etc/httpd/conf/httpd.conf',
      '/etc/apache2/apache2.conf',
      '/usr/local/apache2/conf/httpd.conf',
      '/usr/local/apache2/httpd.conf'
    ],
    answer: 2,
    explain: 'Image resmi mengompilasi Apache ke /usr/local/apache2, sehingga konfigurasi, modul, htdocs, dan logs berada di bawah prefix itu.'
  },
  {
    id: 'apache10',
    q: 'Perintah `Listen 8080` pada httpd.conf artinya...',
    options: [
      'Apache hanya boleh diakses lewat IP 8080',
      'Apache membuka port 8080 pada semua interface untuk menerima koneksi',
      'Apache meneruskan semua request ke port 8080 lain',
      'Apache membatasi jumlah 8080 koneksi'
    ],
    answer: 1,
    explain: '`Listen` menentukan alamat dan/atau port yang dibuka server; beberapa `Listen` boleh ditulis untuk melayani banyak port.'
  },
  {
    id: 'apache11',
    q: 'Sebelum reload konfigurasi, perintah yang memvalidasi isi konfigurasi adalah...',
    options: [
      'httpd -t',
      'httpd -M',
      'httpd -S',
      'httpd -l'
    ],
    answer: 0,
    explain: '`httpd -t` (sama dengan `apachectl configtest`) memeriksa syntax dan mengembalikan `Syntax OK` bila konfigurasi valid.'
  },
  {
    id: 'apache12',
    q: '`httpd -k graceful` dibanding `httpd -k restart` keuntungannya adalah...',
    options: [
      'Konfigurasi baru terbaca tanpa memutus koneksi klien yang sedang berjalan',
      'Lebih cepat memuat modul baru',
      'Tidak perlu hak root dengan cara apa pun',
      'Menghapus semua worker lama dari memori seketika'
    ],
    answer: 0,
    explain: 'Graceful membuka proses anak baru dengan konfigurasi baru, lalu membereskan proses lama setelah request-nya selesai — tanpa downtime.'
  },
  {
    id: 'apache13',
    q: 'Blok `<Directory "/var/www/html">` dipakai untuk...',
    options: [
      'Mencocokkan berdasarkan path URL yang diketik klien',
      'Menerapkan aturan (izin, opsi) berdasarkan lokasi filesystem',
      'Mengganti nama domain virtual host',
      'Mengubah format log'
    ],
    answer: 1,
    explain: '`<Directory>` cocok terhadap path filesystem sehingga aturannya berlaku walau URL-nya berbeda; `<Location>` mencocokkan path URL.'
  },
  {
    id: 'apache14',
    q: 'Directive `AllowOverride FileInfo` pada blok Directory berarti...',
    options: [
      'Semua direktori anak boleh mengabaikan konfigurasi induk',
      'File .htaccess boleh memuat directive kategori FileInfo (mis. RewriteEngine, Header)',
      '.htaccess tidak akan pernah dibaca',
      'Konfigurasi induk otomatis dihapus'
    ],
    answer: 1,
    explain: '`AllowOverride` adalah daftar izin per kategori directive yang boleh ditulis di .htaccess; `None` berarti .htaccess diabaikan sepenuhnya.'
  },
  {
    id: 'apache15',
    q: 'Bila ada dua blok `<VirtualHost *:8080>` dengan ServerName berbeda dan klien mengirim Host yang tidak cocok dengan keduanya, request dilayani oleh...',
    options: [
      'Virtual host yang ditulis paling awal untuk port itu (default vhost)',
      'Virtual host terakhir dalam file',
      'Selalu error 404',
      'Dibagikan rata ke kedua vhost'
    ],
    answer: 0,
    explain: 'Blok pertama pada IP:port yang sama menjadi default vhost — seperti `default_server` pada Nginx.'
  },
  {
    id: 'apache16',
    q: 'Direktif `ServerAlias www.app.local` pada vhost app.local berguna untuk...',
    options: [
      'Menambahkan hostname lain yang dilayani vhost tersebut',
      'Mengubah DocumentRoot vhost',
      'Membuat sertifikat baru',
      'Mengaktifkan HTTP/2'
    ],
    answer: 0,
    explain: 'ServerAlias menambah variasi Host header (mis. versi www) yang jatuh ke vhost yang sama.'
  },
  {
    id: 'apache17',
    q: 'Modul yang dimuat dengan `LoadModule rewrite_module modules/mod_rewrite.so` disebut modul...',
    options: [
      'Statis (dikompilasi ke binari httpd)',
      'Dinamis (file .so dimuat saat startup)',
      'Bawaan kernel',
      'Eksperimental yang tidak boleh dipakai'
    ],
    answer: 1,
    explain: 'LoadModule memuat shared object dari direktori `modules/`; modul statis justru tampil pada `httpd -l` tanpa baris LoadModule.'
  },
  {
    id: 'apache18',
    q: 'Untuk mengubah URL tanpa membalas ke client (rewrite internal), modul yang tepat adalah...',
    options: [
      'mod_alias dengan `Redirect`',
      'mod_rewrite dengan `RewriteRule`',
      'mod_status',
      'mod_headers'
    ],
    answer: 1,
    explain: '`Redirect` (mod_alias) selalu membalas client dengan status 3xx; `RewriteRule` bisa mengubah request secara internal di dalam server.'
  },
  {
    id: 'apache19',
    q: 'Pada `RewriteRule ^/users/([0-9]+)$ /user.php?id=$1 [L]`, arti `$1` dan flag `L` berturut-turut adalah...',
    options: [
      'Variabel lingkungan, dan log ke file',
      'Tangkapan grup pertama regex, serta berhenti memproses aturan rewrite lain',
      'Nomor port, dan load modul',
      'Versi HTTP, dan lokasi file'
    ],
    answer: 1,
    explain: 'Grup regex dirujuk sebagai $1, $2, ...; flag `L` (last) menghentikan rangkaian rewrite untuk request ini.'
  },
  {
    id: 'apache20',
    q: 'Konsekuensi terbesar mengaktifkan `.htaccess` (AllowOverride All) adalah...',
    options: [
      'Setiap request harus membaca file .htaccess di tiap direktori ziarah, memperlambat server',
      'Konfigurasi menjadi tidak bisa divalidasi',
      'Apache otomatis menghapus file .htaccess',
      'Modul tidak bisa dimuat lagi'
    ],
    answer: 0,
    explain: 'Apache membaca .htaccess pada setiap direktori untuk tiap request; untuk trafik besar, pindahkan aturan ke konfigurasi utama dan set `AllowOverride None`.'
  },
  {
    id: 'apache21',
    q: 'Direktif `Alias "/docs/" "/usr/local/apache2/docs/"` dipakai untuk...',
    options: [
      'Melayani path URL dari lokasi filesystem di luar DocumentRoot',
      'Mengganti nama domain website',
      'Membuat alias IP address',
      'Mengalihkan request ke backend proxy'
    ],
    answer: 0,
    explain: 'Alias memetakan URL ke path mana pun di disk, sehingga dokumen tidak harus berada di dalam DocumentRoot.'
  },
  {
    id: 'apache22',
    q: '`Options Indexes` pada direktori artinya...',
    options: [
      'Apache mengindeks file ke mesin pencari',
      'Bila file index tidak ada, Apache menampilkan daftar isi direktori',
      'Hanya file berekstensi .idx yang dilayani',
      'Direktori hanya bisa dibuka oleh root'
    ],
    answer: 1,
    explain: 'Daftar isi direktori bocor ke publik bila dibiarkan; praktik aman menulis `Options -Indexes`.'
  },
  {
    id: 'apache23',
    q: 'Suatu halaman diam-diam membalas 404 padahal file-nya tidak ada. Langkah diagnosis pertama yang paling tepat:',
    options: [
      'Menonaktifkan seluruh modul satu per satu',
      'Membaca error log dan mengecek apakah ada aturan rewrite/fallback yang menangkap path itu',
      'Mengganti versi Apache',
      'Menghapus seluruh cache browser'
    ],
    answer: 1,
    explain: 'Log menunjukkan handler mana yang memproses request; aturan SPA fallback memang dibuat agar path yang tidak ada jatuh ke index.'
  },
  {
    id: 'apache24',
    q: 'Untuk menampilkan halaman custom ketika error 403/404, direktif yang dipakai adalah...',
    options: [
      'ErrorDocument',
      'CustomError',
      'FallbackPage',
      'ErrorPage'
    ],
    answer: 0,
    explain: '`ErrorDocument 404 /404.html` menunjuk halaman (path lokal, URL, atau teks) yang ditampilkan untuk status tersebut.'
  },
  {
    id: 'apache25',
    q: 'Pasangan `ProxyPass /api http://backend:8080/api` dan `ProxyPassReverse /api http://backend:8080/api` berfungsi...',
    options: [
      'ProxyPass meneruskan request; ProxyPassReverse memperbaiki header Location/Content-Location di response agar klien tetap melihat URL publik',
      'Keduanya identik dan sengaja ditulis dua kali untuk redundansi',
      'ProxyPassReverse hanya dipakai untuk HTTPS',
      'ProxyPassReverse membalik arah proxy menjadi forward proxy'
    ],
    answer: 0,
    explain: 'Backend sering membalas redirect internal; ProxyPassReverse menulis ulangnya agar klien tidak diajak ke alamat backend yang tidak terjangkau.'
  },
  {
    id: 'apache26',
    q: '`ProxyPreserveHost On` menyebabkan...',
    options: [
      'Backend menerima Host header asli dari klien (mis. app.local)',
      'Host header backend yang diteruskan ke klien',
      'Apache mengabaikan header Host sama sekali',
      'Port Host diubah menjadi 80'
    ],
    answer: 0,
    explain: 'Secara default backend melihat host backend (mis. backend-1:80); PreserveHost mempertahankan nama asli, penting untuk aplikasi multi-tenant.'
  },
  {
    id: 'apache27',
    q: 'Header yang harus diteruskan ke backend agar aplikasi tahu IP klien asli adalah...',
    options: [
      'Server dan Date',
      'X-Forwarded-For (dan X-Real-IP / X-Forwarded-Proto sebagai pelengkap)',
      'Content-Length dan Keep-Alive',
      'Accept-Encoding dan Vary'
    ],
    answer: 1,
    explain: 'Tanpa X-Forwarded-For, backend hanya melihat IP gateway proxy — log dan pembatasan IP menjadi tidak berguna.'
  },
  {
    id: 'apache28',
    q: 'Perbedaan forward proxy dan reverse proxy:',
    options: [
      'Forward proxy mewakili klien ke internet; reverse proxy mewakili server ke klien',
      'Keduanya sama saja, hanya beda nama',
      'Reverse proxy hanya bekerja untuk HTTPS',
      'Forward proxy selalu mengenkripsi trafik'
    ],
    answer: 0,
    explain: 'Apache dengan `ProxyRequests Off` adalah reverse proxy; `ProxyRequests On` membukanya sebagai forward proxy yang rawan disalahgunakan.'
  },
  {
    id: 'apache29',
    q: 'Pada lab, request ke `/slow/` yang backend-nya menerima koneksi tapi tidak pernah menjawab menghasilkan error 5xx setelah ±3 detik. Nilai 3 detik itu berasal dari...',
    options: [
      'KeepAliveTimeout',
      'Atribut `timeout=3` pada ProxyPass',
      'MaxRequestWorkers',
      'Timeout DNS resolver'
    ],
    answer: 1,
    explain: 'Timeout proxy diatur per rute lewat `ProxyPass ... timeout=` (dan `connectiontimeout=` untuk koneksi), bukan oleh KeepAliveTimeout.'
  },
  {
    id: 'apache30',
    q: 'Agar WebSocket bisa lewat reverse proxy Apache, konfigurasi minimal yang dibutuhkan adalah...',
    options: [
      'Set `Upgrade` dan `Connection` request ke backend (mod_proxy_wstunnel atau ekspresi http/1.1)',
      'Menambah port 8080 baru',
      'Menonaktifkan mod_ssl',
      'Mengubah DocumentRoot backend'
    ],
    answer: 0,
    explain: 'Handshake WebSocket membutuhkan header Upgrade/Connection yang biasa dibuang proxy; tanpanya koneksi langsung ditolak backend.'
  },
  {
    id: 'apache31',
    q: 'Sertifikat self-signed pada lab dibuat dengan SAN (Subject Alternative Name) karena...',
    options: [
      'Membuat sertifikat lebih murah',
      'Client modern menolak kecocokan hanya berdasarkan CN; SAN berisi nama host/IP yang divalidasi',
      'SAN wajib untuk HTTP/2',
      'Agar private key tidak dibutuhkan'
    ],
    answer: 1,
    explain: 'Chrome/Firefox mengabaikan CN dan memvalidasi SAN; tanpa SAN, `curl` menolak hostname walaupun file sertifikat terpasang.'
  },
  {
    id: 'apache32',
    q: 'Di dalam `<VirtualHost *:8443>`, agar HTTPS aktif wajib ada...',
    options: [
      'Hanya `Listen 443` saja',
      '`SSLEngine on` beserta `SSLCertificateFile` dan `SSLCertificateKeyFile`',
      '`ProxyRequests On`',
      '`ServerAlias https`'
    ],
    answer: 1,
    explain: 'SSLEngine mengaktifkan TLS di vhost itu, dan dua direktif sertifikat menyediakan pasangan public key + private key.'
  },
  {
    id: 'apache33',
    q: 'Cara paling sederhana dan efisien untuk memaksa seluruh trafik HTTP ke HTTPS pada port redirect adalah...',
    options: [
      'Menulis `Redirect permanent / https://contoh.com/` di vhost port HTTP',
      'Menambah `Options Indexes` di vhost HTTP',
      'Mengganti DocumentRoot ke direktori HTTPS',
      'Mematikan semua modul selain mod_ssl'
    ],
    answer: 0,
    explain: '`Redirect permanent` (mod_alias) membalas 301 dan menyisipkan path asal ke URL tujuan; RewriteRule bisa dipakai untuk aturan yang lebih rumit.'
  },
  {
    id: 'apache34',
    q: 'Header `Strict-Transport-Security` hanya boleh dikirim...',
    options: [
      'Saat response lewat HTTPS',
      'Saat response 404 saja',
      'Saat klien memakai HTTP',
      'Kapan pun, tanpa syarat'
    ],
    answer: 0,
    explain: 'Mengirim HSTS dari HTTP justru memaksa klien mengenkripsi ke depannya dengan sertifikat yang mungkin belum benar — hanya kirim lewat HTTPS.'
  },
  {
    id: 'apache35',
    q: 'Kombinasi `ServerTokens Prod` dan `ServerSignature Off` bertujuan...',
    options: [
      'Mempercepat response header',
      'Menyembunyikan versi dan detail Apache agar informasi server tidak bocor ke penyerang',
      'Mengaktifkan kompresi',
      'Menonaktifkan log'
    ],
    answer: 1,
    explain: 'Header `Server:` cukup berisi "Apache", tanpa versi dan modul — penyerang sulit memetakan versi yang rentan.'
  },
  {
    id: 'apache36',
    q: 'Membatasi akses ke `/admin` hanya dari jaringan 192.168.1.0/24 ditulis dengan...',
    options: [
      'Require ip 192.168.1.0/24',
      'Allow from 192.168.1.0/24 tanpa mod_authz_host',
      'Listen 192.168.1.0/24',
      'ServerAlias 192.168.1.0/24'
    ],
    answer: 0,
    explain: 'Apache 2.4 memakai sintaks autorisasi seragam `Require`; `Require ip ...` menolak semua IP di luar rentang itu.'
  },
  {
    id: 'apache37',
    q: 'Untuk mencegah Apache menyajikan daftar isi ketika index.html tidak ada, praktik yang benar adalah...',
    options: [
      'Menghapus seluruh file dari direktori',
      'Options -Indexes pada blok Directory',
      'Mematikan DocumentRoot',
      'Mengubah port ke 8080'
    ],
    answer: 1,
    explain: 'Menonaktifkan `Indexes` membuat Apache membalas 403 alih-alih memamerkan isi direktori.'
  },
  {
    id: 'apache38',
    q: 'Directive `AddOutputFilterByType DEFLATE text/html` membuat...',
    options: [
      'Response HTML dikompresi dengan gzip bila client mendukung',
      'File HTML dihapus dari disk',
      'Ukuran MaxRequestWorkers dikalikan',
      'HTTPS dipaksa aktif'
    ],
    answer: 0,
    explain: 'mod_deflate mengompresi teks di saat kirim — menghemat transfer; jangan kompresi file yang sudah terkompresi (jpg, zip).'
  },
  {
    id: 'apache39',
    q: 'Membuka `<Proxy "balancer://app">` berisi tiga `BalancerMember` lalu `ProxyPass /app balancer://app/` artinya...',
    options: [
      'Request /app didistribusikan ke tiga backend memakai algoritma yang dipilih (default byrequests/round-robin)',
      'Ketiga backend dibuka sebagai forward proxy',
      'Hanya backend pertama yang melayani',
      'Apache menolak konfigurasi seperti ini'
    ],
    answer: 0,
    explain: 'balancer:// adalah kumpulan backend yang dibebani bersama; `ProxySet lbmethod=byrequests` mengatur algoritmanya.'
  },
  {
    id: 'apache40',
    q: 'Halaman statis normal, tapi `/api/` selalu gagal 5xx. Urutan diagnosis yang paling tepat:',
    options: [
      'Mengganti seluruh konfigurasi Apache dari nol',
      'Baca error log (baris proxy), cek apakah backend hidup dan namanya bisa di-resolve, lalu `httpd -t` sebelum `httpd -k graceful`',
      'Menghapus file .htaccess di seluruh direktori',
      'Mengubah ServerName ke domain lain'
    ],
    answer: 1,
    explain: 'Kegagalan hanya pada rute proxy menunjuk ke masalah upstream; error log memuat penyebabnya (koneksi ditolak, DNS gagal, timeout).'
  }
);
