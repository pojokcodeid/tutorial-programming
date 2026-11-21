/* ============================================================
   Pelajaran Apache — 02: Apa Itu Apache HTTP Server
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'apa-itu-apache',
  title: 'Apa Itu Apache HTTP Server? Arsitektur & Request Lifecycle',
  chapter: 'Fondasi',
  duration: '10 menit',
  intro: [
    'Nama "Apache" berasal dari "a patchy server" — kumpulan tambalan para pengembang di awal 1990-an yang akhirnya menjadi proyek paling lama masih hidup di web. Sampai hari ini ia dipakai untuk sekitar sepertiga situs di internet, dari blog kecil sampai infrastruktur perusahaan.',
    'Yang membedakan Apache dari Nginx bukan fiturnya — keduanya sama kuat — melainkan <b>cara memproses koneksi</b>. Apache menjalankan model yang kamu pilih sendiri lewat <b>MPM</b>. Pelajaran ini membedah peran Apache, arsitektur prosesnya, urutan penanganan satu request, lalu menjalankan container Apache pertamamu.'
  ],
  objectives: [
    'Menyebutkan peran Apache: web server, virtual host, reverse proxy, load balancer, TLS terminator',
    'Membedakan web server, application server, dan basis data',
    'Menjelaskan tiga MPM (prefork, worker, event) beserta trade-off-nya',
    'Menyusun urutan request lifecycle Apache dari koneksi sampai response',
    'Menjalankan container <code>httpd:2.4</code> dan membuktikan ia menjawab lewat curl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apache mengerjakan apa saja?</h3><p>Satu binari <code>httpd</code> bisa mengambil banyak topi. Dalam materi ini kita akan memakai semuanya:</p><table><thead><tr><th>Peran</th><th>Di lapangan</th></tr></thead><tbody><tr><td><b>Web server statis</b></td><td>Menyajikan HTML/CSS/JS/gambar dari DocumentRoot</td></tr><tr><td><b>Virtual host</b></td><td>Satu proses melayani banyak website dengan Host berbeda</td></tr><tr><td><b>Reverse proxy</b></td><td><code>ProxyPass</code> meneruskan /api ke aplikasi Go/Node/Java</td></tr><tr><td><b>Load balancer</b></td><td><code>balancer://</code> membagi request ke 3+ backend</td></tr><tr><td><b>TLS terminator</b></td><td><code>mod_ssl</code> mengelola HTTPS lalu meneruskannya sebagai HTTP</td></tr><tr><td><b>Gateway &amp; pengendali akses</b></td><td>Rewrite, autentikasi, pembatasan IP, security header</td></tr></tbody></table><p>Penting dibedakan: <b>web server</b> menyajikan file dan menangani protokol HTTP; <b>application server</b> (Lucee, Node, Gunicorn) menjalankan logika bisnis dan menghasilkan response; <b>basis data</b> menyimpan data. Apache biasanya duduk di depan, aplikasi di tengah, database di belakang.</p>'
    },
    {
      type: 'example',
      title: 'Arsitektur dan posisi Apache',
      lang: 'text',
      output: false,
      code: `Browser
   |
   |  HTTP / HTTPS
   v
+-----------------------------------------------+
| Apache HTTP Server (httpd)                    |
|   1. baca konfigurasi (sudah saat startup)     |
|   2. pilih virtual host dari header Host       |
|   3. cocokkan aturan (Directory/Location/Rewrite)
|   4. putuskan: file statis ATAU teruskan proxy |
+----------------------+------------------------+
                       |
        +--------------+--------------+
        |                             |
        v                             v
  DocumentRoot                    Backend apps
  (file di disk)              (api:8080, app:3000)
        |                             |
        +--------------+--------------+
                       |
                       v
                 HTTP response
                       |
                       v
                    Browser`,
      explain: [
        'Konfigurasi dibaca <b>sekali saat startup/reload</b>, bukan tiap request — karena itu perubahan file harus diikuti <code>httpd -t</code> lalu <code>httpd -k graceful</code>.',
        'Langkah 2 memakai header <code>Host</code>; tanpa kecocokan, request jatuh ke <b>default vhost</b> (blok pertama pada port itu).',
        'Langkah 4 adalah titik percabangan utama: file yang ada di disk dilayani langsung; selain itu bisa di-rewrite, di-autentikasi, atau diteruskan ke backend.'
      ]
    },
    {
      type: 'text',
      html: '<h3>MPM: tiga cara mengelola koneksi</h3><p><b>Multi-Processing Module</b> menentukan bagaimana Apache mencocokkan koneksi masuk dengan proses/thread. Hanya satu MPM aktif, dipilih lewat <code>LoadModule</code>. Ini adalah keputusan arsitektural paling berdampak pada memori dan daya tahan trafik.</p><table><thead><tr><th>MPM</th><th>Model</th><th>Kekuatan</th><th>Kelemahan</th></tr></thead><tbody><tr><td><code>mpm_prefork</code></td><td>1 proses = 1 koneksi</td><td>Aman untuk modul non-thread (mod_php lawas)</td><td>Ramai memori; 1000 koneksi = 1000 proses</td></tr><tr><td><code>mpm_worker</code></td><td>beberapa proses × banyak thread</td><td>Jauh lebih ringan dari prefork</td><td>Thread berbagi memori proses</td></tr><tr><td><code>mpm_event</code></td><td>worker + penanganan koneksi <i>keep-alive</i> secara event-driven</td><td>Paling hemat untuk trafik banyak; bawaan image <code>httpd:2.4</code></td><td>Tidak cocok untuk modul yang memblokir I/O</td></tr></tbody></table><p>Konfigurasi utama terkait: <code>StartServers</code>, <code>MinSpareThreads</code>, <code>MaxSpareThreads</code>, <code>ThreadsPerChild</code>, <code>MaxRequestWorkers</code> (dulunya MaxClients), dan <code>ServerLimit</code>. Pelajaran 12 membahas penyetelannya.</p>'
    },
    {
      type: 'example',
      title: 'Container Apache pertama kamu',
      lang: 'bash',
      output: true,
      code: `# Jalankan httpd di port 8080 (non-privileged, tanpa sudo)
podman run -d --name apache-pertama \\
  -p 8080:80 docker.io/library/httpd:2.4

# Buktikan ia menjawab
curl -sI http://localhost:8080/ | head -3

# Lihat proses Apache di dalam container (1 proses induk + anak)
podman exec apache-pertama ps -ef

# Lihat log (akses & error tercetak ke stdout/stderr)
podman logs --tail 5 apache-pertama

# Bersihkan
podman rm -f apache-pertama`,
      explain: [
        'Port host 8080 → port container 80. Container bebas membuka port 80 <i>di dalam</i> namespace-nya; yang butuh hak istimewa adalah publikasinya ke host.',
        '<code>ps -ef</code> menunjukkan satu proses <code>httpd -DFOREGROUND</code> (proses induk, tetap root) dan beberapa proses anak yang turun ke user <code>www-data</code> — inilah model MPM yang terlihat langsung.',
        'Image resmi menulis log ke <code>/proc/self/fd/1</code> dan <code>/proc/self/fd/2</code>, sehingga <code>podman logs</code> cukup — tidak perlu masuk container untuk membaca file log.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Request lifecycle: tujuh langkah</h3><p>Setiap request melewati urutan tetap. Menghafal urutan ini membuat troubleshooting jauh lebih cepat, karena kamu tahu <i>di langkah ke berapa</i> request berhenti.</p><ol><li><b>Terima koneksi</b> — worker mengambil koneksi dari antrean (di sini kegagalan = <i>connection refused</i>).</li><li><b>Baca request line &amp; header</b> — termasuk <code>Host</code>.</li><li><b>Tentukan vhost</b> — kecocokan ServerName/ServerAlias; kalau tidak ada, default vhost.</li><li><b>Terapkan aturan per URL/lokasi</b> — <code>&lt;Location&gt;</code>, <code>RewriteRule</code>, auth, header.</li><li><b>Petakan ke resource</b> — file di DocumentRoot, hasil <code>Alias</code>, atau tujuan <code>ProxyPass</code>.</li><li><b>Isi response</b> — oleh handler: core (file), mod_proxy (backend), mod_dir (index), dan seterusnya.</li><li><b>Tulis log akses</b> — satu baris per request sesuai <code>LogFormat</code>.</li></ol><p>Kegagalan di tiap langkah meninggalkan jejak berbeda: langkah 1 → log jaringan, langkah 3–5 → error log Apache, langkah 6 → error log backend, langkah 7 tidak pernah terjadi bila request gagal sebelum selesai.</p>'
    },
    {
      type: 'warn',
      title: 'Apache bukan pengganti aplikasi',
      text: '<p>Meski Apache bisa menjalankan PHP lewat mod_php atau CGI, batasnya jelas: Apache menangani protokol, file, dan routing — <b>bukan logika bisnis, transaksi, atau penyimpanan data</b>. Menumpuk semua di dalam proses httpd membuat aplikasi sulit diskalakan dan satu error PHP bisa mempengaruhi proses web server. Pola yang dipakai bab ini: Apache di depan sebagai gateway, aplikasi berdiri sendiri di belakangnya.</p>'
    },
    {
      type: 'tip',
      title: 'Kenapa tetap mempelajari Apache di era Nginx',
      text: '<p>Karena kamu akan bertemu Apache di mana-mana: paket distro lama, shared hosting, intranet perusahaan, lampiran CI/CD, dan konfigurasi warisan yang harus dipelihara. Selain itu, gaya deklaratifnya (blok <code>&lt;Directory&gt;</code>, <code>&lt;Location&gt;</code>, <code>&lt;VirtualHost&gt;</code>, direktif per konteks) membuat konsep <i>konteks &amp; pewarisan konfigurasi</i> jauh lebih terlihat dibanding penulisan per-server ala Nginx — ilmu yang langsung terbawa ke HAProxy, Caddy, atau web server mana pun.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['httpd', 'Binari/daemon Apache HTTP Server.'],
        ['MPM', 'Modul yang menentukan model proses/thread untuk menangani koneksi.'],
        ['prefork', 'MPM satu proses per koneksi; kompatibel tapi boros memori.'],
        ['worker / event', 'MPM multi-thread; event menangani keep-alive secara event-driven.'],
        ['DocumentRoot', 'Akar direktori konten web.'],
        ['VirtualHost', 'Konfigurasi satu website dalam satu proses Apache.'],
        ['Graceful', 'Memuat konfigurasi baru tanpa memutus koneksi berjalan.'],
        ['Handler', 'Komponen yang mengisi response (core, proxy, dir, dll).']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan container <code>httpd:2.4</code> pertama (lihat contoh), buktikan dengan <code>curl -sI</code>, lalu hentikan dan jalankan lagi — catat apa yang berubah dan apa yang tetap.</li><li>Buka <code>http://localhost:8080/server-status</code> pada lab dan identifikasi MPM yang dipakai, jumlah proses anak, dan jumlah request per detik.</li><li>Jelaskan dengan bahasamu: kenapa <b>reload</b> konfigurasi tidak memutus klien, sedangkan edit file saja (tanpa reload) tidak mengubah perilaku server.</li><li>Petakan 7 langkah lifecycle pada request <code>curl http://localhost:8080/api/</code> — tandai di langkah ke berapa Apache berpindah dari membaca file ke meneruskan ke backend.</li></ol>'
    }
  ],
  recap: [
    'Apache = web server statis + virtual host + reverse proxy + load balancer + TLS terminator dalam satu binari <code>httpd</code>.',
    'Web server menyajikan file &amp; menangani HTTP; application server menjalankan logika; basis data menyimpan — Apache berada di depan keduanya.',
    'Satu MPM aktif: <b>prefork</b> (proses tunggal, kompatibel), <b>worker</b> (proses × thread), <b>event</b> (bawaan, hemat koneksi keep-alive).',
    'Lifecycle: koneksi → header → pilih vhost → aturan → petakan resource → isi response → log. Kegagalan tiap langkah meninggalkan jejak di tempat berbeda.'
  ]
});
