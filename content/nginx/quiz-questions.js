/* ============================================================
   Soal kuis Nginx — 40 soal (nginx01–nginx40)
   ============================================================ */
'use strict';

window.NGINX_QUIZ_POOL = window.NGINX_QUIZ_POOL || [];

window.NGINX_QUIZ_POOL.push(
  {
    id: 'nginx01',
    q: 'Dalam analogi restoran, Nginx yang berdiri di depan beberapa server aplikasi lalu meneruskan request ke salah satu di antaranya paling menyerupai...',
    options: [
      'Dapur yang memasak makanan',
      'Pelayan yang menerima pesanan lalu meneruskannya ke dapur',
      'Koki yang menyiapkan makanan',
      'Pemilik restoran yang mencatat keuangan'
    ],
    answer: 1,
    explain: 'Reverse proxy menerima request client lalu meneruskannya ke backend — persis peran pelayan yang meneruskan pesanan ke dapur.'
  },
  {
    id: 'nginx02',
    q: 'Manakah yang BUKAN termasuk peran utama Nginx versi open source?',
    options: [
      'Menyajikan file statis seperti HTML, CSS, dan gambar',
      'Menjadi reverse proxy di depan backend aplikasi',
      'Menyimpan data relasional seperti basis data SQL',
      'Membagi beban ke beberapa server (load balancing)'
    ],
    answer: 2,
    explain: 'Nginx adalah web server/proxy/load balancer, bukan penyimpan data; menyimpan data relasional adalah pekerjaan basis data.'
  },
  {
    id: 'nginx03',
    q: 'Apa tugas utama master process dalam arsitektur Nginx?',
    options: [
      'Menangani setiap request HTTP dari client secara langsung',
      'Membaca dan memvalidasi konfigurasi, lalu memulai serta mengelola worker process',
      'Menyimpan hasil cache ke disk',
      'Menyeimbangkan beban secara round-robin ke upstream'
    ],
    answer: 1,
    explain: 'Master bertugas membaca konfigurasi dan mengelola worker (fork, reconfigure, sementara request ditangani worker).'
  },
  {
    id: 'nginx04',
    q: 'Kenapa hanya beberapa worker process Nginx bisa menangani puluhan ribu koneksi sekaligus?',
    options: [
      'Karena arsitektur event-driven non-blocking: satu worker menunggu banyak koneksi tanpa membuat thread baru per koneksi',
      'Karena setiap koneksi selalu mendapatkan thread sendiri dari master',
      'Karena semua request diantre dan dijalankan satu per satu oleh master',
      'Karena Nginx otomatis menambah worker setiap kali RAM tersedia'
    ],
    answer: 0,
    explain: 'Model event-driven non-blocking membuat satu worker dapat menunggu ribuan koneksi tanpa membuat thread per koneksi.'
  },
  {
    id: 'nginx05',
    q: 'Di mana letak context main pada file nginx.conf?',
    options: [
      'Di dalam blok events { }',
      'Di dalam blok http { }',
      'Di dalam blok server { }',
      'Di area top-level file, yaitu di luar semua blok { }'
    ],
    answer: 3,
    explain: 'Context main adalah area top-level di luar semua blok, karena nginx.conf tidak punya blok main eksplisit.'
  },
  {
    id: 'nginx06',
    q: 'access_log /var/log/nginx/access.log; ditulis di context http, sedangkan tidak ada access_log sama sekali di dalam server block. Apa yang terjadi?',
    options: [
      'Server block tersebut tidak mendapatkan log apa pun',
      'Konfigurasi dianggap tidak valid saat reload',
      'Server block mewarisi access_log dari context induknya',
      'Log hanya aktif jika ada location yang menuliskannya ulang'
    ],
    answer: 2,
    explain: 'Directive diwarisi dari context induk bila tidak didefinisikan pada level saat ini, jadi server mewarisi access_log dari http.'
  },
  {
    id: 'nginx07',
    q: 'Apa fungsi perintah nginx -t?',
    options: [
      'Langsung menerapkan konfigurasi baru ke proses yang sedang berjalan',
      'Memeriksa sintaks dan validitas konfigurasi tanpa mengubah proses Nginx yang berjalan',
      'Merestart seluruh worker process',
      'Menghapus seluruh file log lama'
    ],
    answer: 1,
    explain: 'nginx -t hanya memvalidasi konfigurasi ke file dan tidak menyentuh proses Nginx yang sedang berjalan.'
  },
  {
    id: 'nginx08',
    q: 'Saat traffic sedang ramai, kamu menjalankan nginx -s reload. Apa yang terjadi pada worker process lama?',
    options: [
      'Dipaksa mati seketika sehingga koneksi client terputus',
      'Semua koneksi client langsung ditutup',
      'Container Nginx dihapus dan dibuat ulang',
      'Worker lama berhenti menerima koneksi baru lalu menyelesaikan request yang sedang berjalan'
    ],
    answer: 3,
    explain: 'Reload bersifat graceful: worker lama berhenti menerima koneksi baru tetapi menyelesaikan request yang sudah berjalan.'
  },
  {
    id: 'nginx09',
    q: 'Kamu ingin melihat hasil akhir seluruh konfigurasi aktif, termasuk semua file yang masuk lewat include. Perintah yang tepat adalah...',
    options: [
      'nginx -T',
      'nginx -t',
      'nginx -s quit',
      'nginx -s reload'
    ],
    answer: 0,
    explain: 'nginx -T mencetak hasil akhir seluruh konfigurasi termasuk semua file include, sedangkan -t hanya validasi.'
  },
  {
    id: 'nginx10',
    q: 'Dengan konfigurasi location /img/ { alias /data/images/; }, request ke /img/logo.png akan dilayani dari file...',
    options: [
      '/data/images/img/logo.png',
      '/img/data/images/logo.png',
      '/data/images/logo.png',
      '/data/logo.png'
    ],
    answer: 2,
    explain: 'alias menggantikan bagian URI yang cocok dengan location, jadi /img/ diganti menjadi /data/images/.'
  },
  {
    id: 'nginx11',
    q: 'Directive autoindex on; pada sebuah location akan...',
    options: [
      'Mengompres file sebelum dikirim ke client',
      'Menampilkan daftar file (directory listing) saat client membuka direktori yang tidak punya file index',
      'Mengindeks seluruh file ke dalam basis data',
      'Menyembunyikan nama file dari client'
    ],
    answer: 1,
    explain: 'autoindex on menampilkan daftar file ketika direktori dibuka dan tidak ada index yang bisa disajikan.'
  },
  {
    id: 'nginx12',
    q: 'File /var/www/private/rahasia.txt benar-benar ada, tetapi saat diakses client menerima 403 Forbidden. Penyebab paling mungkin adalah...',
    options: [
      'File tidak ditemukan, jadi seharusnya 404',
      'Backend aplikasi sedang mati',
      'Sertifikat HTTPS belum diperbarui',
      'Proses Nginx tidak punya izin membaca file/direktori tersebut, atau path diblokir dengan deny'
    ],
    answer: 3,
    explain: '403 berarti akses ditolak karena izin user Nginx atau aturan deny, berbeda dengan 404 yang berarti file tidak ada.'
  },
  {
    id: 'nginx13',
    q: 'Dengan location / { root /var/www/app; try_files $uri $uri/ /index.html; }, client meminta /dashboard/profile yang tidak ada sebagai file. Apa yang terjadi?',
    options: [
      'Nginx melakukan internal redirect ke /index.html, sehingga halaman utama aplikasi (SPA) yang dikirim',
      'Client langsung menerima 404',
      'Nginx mengembalikan 502',
      'Client di-redirect 301 ke /'
    ],
    answer: 0,
    explain: 'try_files mencoba tiap argumen berurutan dan /index.html terakhir dipakai sebagai internal redirect — pola standar SPA.'
  },
  {
    id: 'nginx14',
    q: 'Manakah urutan evaluasi location yang benar menurut dokumentasi nginx?',
    options: [
      'Prefix terpanjang → regex → = → ^~',
      'Urutan deklarasi di file → = → regex → prefix',
      'Exact = → prefix ^~ → regex ~/~* sesuai urutan deklarasi → prefix terpanjang',
      'Regex selalu paling akhir, setelah semua prefix diperiksa'
    ],
    answer: 2,
    explain: 'Urutan resmi nginx: exact = → prefix ^~ → regex sesuai urutan deklarasi → prefix terpanjang untuk sisanya.'
  },
  {
    id: 'nginx15',
    q: 'Dengan konfigurasi location = /home { return 200 "exact"; }, location ~ ^/home/.*\.html$ { return 200 "regex"; }, dan location /home { return 200 "prefix"; }, request ke /home/index.html akan dilayani oleh blok...',
    options: [
      'location = /home (exact)',
      'location ~ ^/home/.*\.html$ (regex)',
      'location /home (prefix)',
      'Tidak ada, client menerima 404'
    ],
    answer: 1,
    explain: 'Exact tidak cocok untuk /home/index.html, lalu regex diperiksa setelah exact dan cocok sebelum prefix dipakai.'
  },
  {
    id: 'nginx16',
    q: 'Sebuah URI kebetulan cocok dengan prefix location yang diberi awalan ^~ dan juga cocok dengan salah satu regex location. Blok mana yang dipakai?',
    options: [
      'Regex, karena regex selalu menang',
      'Blok yang paling akhir ditulis di file',
      'Keduanya dijalankan bergantian',
      'Prefix ^~, karena tanda itu menghentikan pencarian regex'
    ],
    answer: 3,
    explain: 'Tanda ^~ menandai prefix yang begitu cocok pencarian regex dihentikan dan prefix itulah yang dipakai.'
  },
  {
    id: 'nginx17',
    q: 'Dengan konfigurasi server { listen 80; return 301 https://$host$request_uri; }, apa yang dilakukan Nginx?',
    options: [
      'Merespons setiap request HTTP dengan redirect permanen 301 ke HTTPS, path dan query asli tetap dipertahankan',
      'Menyajikan website statis melalui port 80',
      'Meneruskan request ke upstream di port 443',
      'Mengubah seluruh response menjadi format JSON'
    ],
    answer: 0,
    explain: 'return 301 mengirim redirect permanen dengan $request_uri, sehingga path dan query asli tetap ada di URL baru.'
  },
  {
    id: 'nginx18',
    q: 'Dengan error_page 404 /halaman-hilang.html;, bagaimana Nginx menemukan /halaman-hilang.html?',
    options: [
      'Client di-redirect eksternal sehingga alamat berubah di browser',
      'File dicari di direktori root milik backend aplikasi',
      'Nginx melakukan internal redirect ke URI itu, lalu location biasa yang menanganinya',
      'Halaman tidak pernah tampil karena 404 selalu diabaikan'
    ],
    answer: 2,
    explain: 'error_page memicu internal redirect ke URI baru yang kemudian diproses location biasa, tanpa mengubah URL di browser.'
  },
  {
    id: 'nginx19',
    q: 'Satu listen 80; menampung beberapa server block. Request datang dengan header Host: tidak-ada-domain-ini.test yang tidak cocok dengan server_name mana pun. Block mana yang melayani?',
    options: [
      'Server block terakhir yang dideklarasikan pada listen tersebut',
      'Server block pertama yang dideklarasikan pada listen 80 tersebut (default server)',
      'Semua server block melayani secara bergantian',
      'Nginx langsung menolak dengan status 400'
    ],
    answer: 1,
    explain: 'Tanpa flag default_server, server pertama pada listen tersebut menjadi default untuk Host yang tidak cocok.'
  },
  {
    id: 'nginx20',
    q: 'Manakah pola server_name yang TIDAK didukung Nginx?',
    options: [
      'www.example.com (nama persis)',
      '*.example.com (wildcard di awal)',
      '~^(?<sub>.+)\.example\.com$ (regex)',
      'www.*.com (wildcard di tengah nama)'
    ],
    answer: 3,
    explain: 'Wildcard Nginx hanya boleh di awal atau akhir nama, tidak boleh di tengah seperti www.*.com.'
  },
  {
    id: 'nginx21',
    q: 'Dengan location /api/ { proxy_pass http://backend; }, request /api/users?id=7 diteruskan ke backend sebagai...',
    options: [
      '/users?id=7',
      '/id=7',
      '/api/users?id=7',
      '/api/'
    ],
    answer: 2,
    explain: 'proxy_pass tanpa bagian URI membuat request diteruskan ke backend persis seperti bentuk aslinya.'
  },
  {
    id: 'nginx22',
    q: 'Dengan location /api/ { proxy_pass http://backend/; }, request /api/users?id=7 diteruskan ke backend sebagai...',
    options: [
      '/users?id=7',
      '/api/users?id=7',
      '/api/users',
      '/'
    ],
    answer: 0,
    explain: 'proxy_pass yang diakhiri / menggantikan bagian URI yang cocok dengan location, jadi /api/ menjadi /.'
  },
  {
    id: 'nginx23',
    q: 'nginx -t menampilkan error proxy_pass cannot have uri part in location given by regular expression. Konfigurasimu memakai location ~ /api/(.*) bersama proxy_pass http://backend/new/;. Cara memperbaiki yang benar:',
    options: [
      'Menambahkan default_server pada listen',
      'Menggunakan location prefix (misalnya location /api/) atau menghapus bagian URI dari proxy_pass',
      'Menambahkan proxy_http_version 1.1;',
      'Mengubah port backend menjadi 443'
    ],
    answer: 1,
    explain: 'proxy_pass tidak boleh memiliki bagian URI di location regex; pindah ke location prefix atau hapus URI-nya.'
  },
  {
    id: 'nginx24',
    q: 'Secara default header Host yang diteruskan Nginx adalah $proxy_host (sesuai proxy_pass). Agar backend menerima domain yang diketulis client, kamu menambahkan...',
    options: [
      'proxy_set_header Host $proxy_host;',
      'proxy_set_header X-Real-IP $host;',
      'proxy_set_header Host $upstream_addr;',
      'proxy_set_header Host $host;'
    ],
    answer: 3,
    explain: '$host diambil dari header Host client, sedangkan default Host yang dikirim adalah $proxy_host dari proxy_pass.'
  },
  {
    id: 'nginx25',
    q: 'Client menerima 504 Gateway Timeout dari Nginx, sementara halaman statis di server yang sama normal. Diagnosis paling tepat:',
    options: [
      'Backend menerima koneksi tetapi tidak mengirim response hingga batas proxy_read_timeout tercapai',
      'Backend menolak koneksi (connection refused) — itu menyebabkan 502, bukan 504',
      'File halaman tidak ditemukan — itu menyebabkan 404',
      'Client melebihi batas rate limit — itu menyebabkan 503'
    ],
    answer: 0,
    explain: '504 berarti backend terhubung tapi tidak menanggung hingga proxy_read_timeout, sedangkan 502 = backend tak terhubungi/tak valid.'
  },
  {
    id: 'nginx26',
    q: 'Dengan upstream app { server 10.0.0.1:8080; server 10.0.0.2:8080; server 10.0.0.3:8080; } tanpa parameter tambahan, algoritma apa yang dipakai?',
    options: [
      'least_conn',
      'ip_hash',
      'Round-robin (default Nginx)',
      'Random dengan dua algoritma sekaligus'
    ],
    answer: 2,
    explain: 'Tanpa least_conn, ip_hash, atau random, block upstream Nginx memakai round-robin sebagai default.'
  },
  {
    id: 'nginx27',
    q: 'Directive server backend-1:8080 max_fails=3 fail_timeout=30s; berarti...',
    options: [
      'Backend dimatikan selamanya setelah gagal 3 kali',
      'Setelah gagal 3 kali dalam periode fail_timeout, server dianggap tidak tersedia selama 30 detik',
      'Request ketiga selalu dialihkan ke backend lain tanpa syarat',
      'Setiap request dipaksa selesai dalam 30 detik'
    ],
    answer: 1,
    explain: 'Setelah tercapai max_fails kegagalan dalam periode fail_timeout, server dianggap tidak tersedia selama fail_timeout.'
  },
  {
    id: 'nginx28',
    q: 'Fitur active health check — Nginx mengganti server yang mati tanpa menunggu request gagal — tersedia pada...',
    options: [
      'Nginx open source saja',
      'Keduanya, hanya namanya berbeda',
      'Nginx open source asalkan memakai block upstream',
      'Nginx Plus; versi OSS hanya punya deteksi kegagalan pasif (max_fails/fail_timeout)'
    ],
    answer: 3,
    explain: 'Active health check adalah fitur Nginx Plus; versi OSS hanya punya deteksi pasif lewat max_fails/fail_timeout.'
  },
  {
    id: 'nginx29',
    q: 'Konfigurasi minimum agar sebuah server menjalankan HTTPS adalah...',
    options: [
      'listen 443 ssl; plus ssl_certificate dan ssl_certificate_key',
      'listen 80; saja, HTTPS menyala otomatis',
      'server_name yang benar saja',
      'ssl_protocols TLSv1.2; tanpa sertifikat'
    ],
    answer: 0,
    explain: 'HTTPS menuntut listen 443 ssl; plus pasangan ssl_certificate dan ssl_certificate_key.'
  },
  {
    id: 'nginx30',
    q: 'Kamu menambahkan header Strict-Transport-Security: max-age=31536000 pada respons HTTPS. Apa efeknya ke browser?',
    options: [
      'Browser langsung memakai HTTP biasa selama setahun',
      'Browser menolak sertifikat self-signed',
      'Browser memaksa koneksi HTTPS untuk domain itu selama masa berlaku, jadi HTTPS harus benar-benar siap sebelum mengaktifkannya',
      'Sertifikat diperpanjang otomatis oleh Nginx'
    ],
    answer: 2,
    explain: 'HSTS memaksa browser memakai HTTPS selama max-age, jadi aktifkan hanya setelah HTTPS benar-benar siap.'
  },
  {
    id: 'nginx31',
    q: 'Kamu menambahkan add_header X-Cache-Status $upstream_cache_status always; dan respons menampilkan X-Cache-Status: HIT. Artinya...',
    options: [
      'Request melewati cache untuk pertama kali sehingga terjadi miss',
      'Response diambil dari cache Nginx tanpa memanggil backend',
      'Backend mengembalikan error',
      'Cache dimatikan untuk request ini'
    ],
    answer: 1,
    explain: '$upstream_cache_status bernilai HIT berarti response diambil dari cache proxy Nginx tanpa memanggil backend.'
  },
  {
    id: 'nginx32',
    q: 'Konfigurasi hanya berisi gzip on; tanpa gzip_types ... . File mana yang dikompresi Nginx?',
    options: [
      'Semua file, termasuk gambar dan video',
      'Hanya file yang diakhiri .html',
      'Semua file teks seperti .css, .js, dan .json',
      'Hanya text/html (default gzip_types); tipe lain harus ditambahkan manual'
    ],
    answer: 3,
    explain: 'Default gzip_types hanya berisi text/html; tipe lain harus dinyatakan secara eksplisit.'
  },
  {
    id: 'nginx33',
    q: 'Dengan limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s; dan limit_req zone=one burst=20 nodelay;, saat rate dan burst terlampaui status apa yang secara default dikirim Nginx?',
    options: [
      '429 Too Many Requests',
      '403 Forbidden',
      '503 Service Temporarily Unavailable',
      '400 Bad Request'
    ],
    answer: 2,
    explain: 'Default limit_req_status adalah 503, bukan 429 seperti yang sering diasumsikan.'
  },
  {
    id: 'nginx34',
    q: 'Dengan location /admin/ { allow 10.0.0.0/8; deny all; }, request datang dari IP 203.0.113.5 (di luar 10.0.0.0/8). Apa yang diterima client?',
    options: [
      '403 Forbidden',
      '200 OK, karena allow selalu dicek lebih dulu',
      '404 Not Found',
      '502 Bad Gateway'
    ],
    answer: 0,
    explain: 'Aturan allow/deny dicek berurutan, dan deny all menangkap IP di luar allow sehingga client itu menerima 403.'
  },
  {
    id: 'nginx35',
    q: 'Di log terlihat request_time sangat besar, tetapi upstream_response_time kecil. Kesimpulan yang tepat:',
    options: [
      'Backend sangat lambat memproses',
      'Waktu habis di sisi client/Nginx (misalnya upload lambat atau koneksi client lambat), bukan di backend',
      'Resolusi DNS ke upstream gagal',
      'Cache terus menerus menghasilkan miss'
    ],
    answer: 1,
    explain: 'request_time dihitung dari request pertama client hingga response terakhir Nginx, jadi selisihnya menunjukkan waktu di luar backend.'
  },
  {
    id: 'nginx36',
    q: 'Access log menampilkan status 499. Artinya...',
    options: [
      'Nginx gagal membuka file log',
      'Backend menolak koneksi',
      'Halaman tidak ditemukan',
      'Client menutup koneksi sebelum Nginx selesai mengirim response, sering karena backend lambat'
    ],
    answer: 3,
    explain: '499 adalah kode khusus Nginx saat client menutup koneksi sebelum response selesai dikirim.'
  },
  {
    id: 'nginx37',
    q: 'Kamu membuat snippets/proxy-headers.conf lalu menulis include snippets/proxy-headers.conf; di dalam sebuah server block. Apa yang terjadi saat konfigurasi dimuat?',
    options: [
      'File include hanya bisa dibaca jika Nginx dijalankan sebagai root',
      'Directive di dalamnya otomatis menjadi global untuk semua context',
      'Isi file disisipkan (di-expand) tepat di titik include, sehingga scope-nya mengikuti context tempat include diletakkan',
      'Include hanya berlaku di context main'
    ],
    answer: 2,
    explain: 'include menyisipkan isi file saat konfigurasi dimuat, sehingga scope mengikuti context tempat include ditulis.'
  },
  {
    id: 'nginx38',
    q: 'Konfigurasi baru sudah lolos nginx -t dan traffic sedang berjalan. Langkah paling aman berikutnya adalah...',
    options: [
      'nginx -s reload — worker baru dibuat sementara worker lama menyelesaikan request yang berjalan',
      'systemctl restart nginx langsung agar cepat',
      'Menghapus container lalu membuat yang baru',
      'Mematikan semua worker sebelum memulai yang baru'
    ],
    answer: 0,
    explain: 'Reload membuat worker baru sementara worker lama menyelesaikan request berjalan — inilah graceful reload tanpa downtime.'
  },
  {
    id: 'nginx39',
    q: 'Dengan location / { root /var/www/site; } dan location /api/ { proxy_pass http://api_upstream/; } yang berisi 3 backend, request /api/orders akan...',
    options: [
      'Disajikan dari /var/www/site/api/orders',
      'Diteruskan ke backend sebagai /api/orders',
      'Diarahkan ke index.html',
      'Diteruskan ke salah satu server di api_upstream sebagai /orders, karena bagian /api/ digantikan'
    ],
    answer: 3,
    explain: 'proxy_pass ber-/ menggantikan /api/ menjadi /, lalu request disebar ke salah satu backend di upstream.'
  },
  {
    id: 'nginx40',
    q: 'Di capstone, halaman statis / normal tetapi /api/ selalu membalas 502. Urutan diagnosis paling tepat:',
    options: [
      'Mengganti seluruh versi Nginx dan menulis ulang konfigurasi dari nol',
      'Baca error_log Nginx, cek apakah port upstream hidup dan benar, lalu jalankan nginx -t sebelum reload',
      'Menghapus cache browser lalu mencoba lagi',
      'Mengubah server_name menjadi domain lain'
    ],
    answer: 1,
    explain: '502 pada path proxy menandakan masalah di sisi upstream, jadi mulai dari error_log dan cek backend sebelum reload.'
  }
);
