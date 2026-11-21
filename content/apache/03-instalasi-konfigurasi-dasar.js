/* ============================================================
   Pelajaran Apache — 03: Instalasi & Konfigurasi Dasar
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'instalasi-konfigurasi-dasar',
  title: 'Instalasi & Konfigurasi Dasar: httpd.conf, Port, DocumentRoot',
  chapter: 'Konfigurasi',
  duration: '10 menit',
  intro: [
    'Apache terasa rumit karena satu hal: ia dikemas dalam berbagai cara. Di Debian konfigurasinya terpecah ke <code>apache2.conf</code>, <code>ports.conf</code>, <code>sites-enabled/</code>, <code>mods-enabled/</code>; di CentOS/RHEL semuanya menumpuk di <code>/etc/httpd/conf/httpd.conf</code>; di image resmi container semuanya berada di bawah <code>/usr/local/apache2/</code>. Perbedaan itu sering bikin tutorial terasa saling bertentangan.',
    'Pelajaran ini membereskan kebingungan itu: kamu akan mengenali tiga tata letak, membaca konfigurasi utama baris demi blok, mengubah port dan DocumentRoot di lab Podman, lalu memahami kapan <b>reload</b> dan kapan <b>restart</b> yang benar.'
  ],
  objectives: [
    'Membandingkan struktur konfigurasi Debian (a2enmod/a2ensite), RHEL, dan image resmi container',
    'Menjelaskan fungsi <code>Listen</code>, <code>ServerName</code>, <code>DocumentRoot</code>, dan <code>DirectoryIndex</code>',
    'Mengubah port dan DocumentRoot pada lab lalu memvalidasinya dengan <code>httpd -t</code>',
    'Membedakan <code>httpd -k graceful</code>, <code>restart</code>, dan reload yang hanya membaca file',
    'Membaca error log ketika Apache menolak start'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga tata letak, satu Apache</h3><table><thead><tr><th></th><th>Debian/Ubuntu</th><th>RHEL/CentOS/Fedora</th><th>Container resmi <code>httpd:2.4</code></th></tr></thead><tbody><tr><td>File utama</td><td><code>/etc/apache2/apache2.conf</code></td><td><code>/etc/httpd/conf/httpd.conf</code></td><td><code>/usr/local/apache2/conf/httpd.conf</code></td></tr><tr><td>Port</td><td><code>ports.conf</code></td><td>di dalam httpd.conf</td><td>baris <code>Listen</code> di httpd.conf</td></tr><tr><td>Website</td><td><code>sites-available/</code> → <code>sites-enabled/</code> (symlink)</td><td><code>conf.d/</code></td><td><code>Include conf/extra/*.conf</code></td></tr><tr><td>Modul</td><td><code>mods-available/</code> → <code>mods-enabled/</code> (<code>a2enmod</code>)</td><td><code>conf.modules.d/</code></td><td>baris <code>LoadModule</code> di httpd.conf</td></tr><tr><td>Alat bantu</td><td><code>a2ensite</code>, <code>a2enmod</code>, <code>a2enconf</code></td><td>langsung edit + <code>systemctl</code></td><td><code>httpd -t</code> / <code>httpd -k graceful</code></td></tr></tbody></table><p>Intinya sama saja: <b>file utama + potongan yang di-Include</b>. Debian hanya mengganti "menyalakan modul" dengan symlink, yang pada dasarnya menulis/menghapus baris Include juga. Lab kita memakai gaya container resmi karena tidak tergantung distro.</p>'
    },
    {
      type: 'example',
      title: 'Struktur yang dipakai lab ini',
      lang: 'text',
      output: false,
      code: `/usr/local/apache2/
├── conf/
│   ├── httpd.conf          <- file utama (Listen, LoadModule, Include)
│   ├── mime.types          <- pemetaan ekstensi -> MIME type
│   ├── extra/              <- virtual host lab (app, api, docs, status)
│   └── snippets/           <- potongan dipakai ulang (proxy & header)
├── modules/                <- file .so untuk LoadModule
├── htdocs/                 <- DocumentRoot (di-mount dari ./web)
├── docs/                   <- dokumen Alias (di-mount dari ./docs)
├── logs/                   <- pid & mutex (log ke stdout/stderr)
└── bin/                    <- httpd, apachectl, htpasswd`,
      explain: [
        'Path relatif dalam konfigurasi (mis. <code>modules/mod_ssl.so</code> atau <code>conf/extra/app.conf</code>) dihitung dari <b>ServerRoot</b>, yaitu <code>/usr/local/apache2</code>.',
        'Direktori <code>htdocs</code> dan <code>docs</code> di-mount dari host, jadi kamu mengedit HTML di luar container dan cukup refresh browser.',
        '<code>logs/</code> hanya menyimpan pid dan mutex; isi akses/error log diarahkan ke <code>/proc/self/fd/1</code> dan <code>/fd/2</code> agar terbaca lewat <code>podman logs</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Empat direktif pertama yang wajib kamu paham</h3><table><thead><tr><th>Direktif</th><th>Konteks</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>Listen 8080</code></td><td>server</td><td>Alamat/port yang dibuka; boleh lebih dari satu baris</td></tr><tr><td><code>ServerName localhost:8080</code></td><td>server / vhost</td><td>Identitas default; menghilangkan peringatan "Could not reliably determine..."</td></tr><tr><td><code>DocumentRoot "/usr/local/apache2/htdocs"</code></td><td>server / vhost</td><td>Akar path URL untuk website ini</td></tr><tr><td><code>DirectoryIndex index.html</code></td><td>server / dir / .htaccess</td><td>File yang dibuka ketika path berakhir direktori</td></tr></tbody></table><p>Perhatikan: <code>Listen</code> ada di <b>server</b> (global), sedangkan <code>DocumentRoot</code> boleh ditimpa per <b>virtual host</b>. Salah satu sumber bug paling sering adalah mengubah DocumentRoot di tempat yang tidak terbaca oleh vhost yang kamu uji.</p>'
    },
    {
      type: 'example',
      title: 'Mengubah port dan DocumentRoot di lab',
      lang: 'bash',
      output: true,
      code: `cd examples/apache-lab

# Port di apache/httpd.conf:
#     Listen 8080
# Ganti menjadi 8088, lalu SELALU validasi dulu
podman exec apache-lab httpd -t
#   -> Syntax OK   atau   AH.... Syntax error on line N ...

# Terapkan tanpa memutus koneksi yang sedang berjalan
podman exec apache-lab httpd -k graceful

# Sesuaikan mapping port di compose.yaml ("8088:8088") lalu:
podman compose up -d --force-recreate apache-lab

curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8088/`,
      explain: [
        '<code>httpd -t</code> mengembalikan <b>kode keluar non-nol</b> bila ada error — inilah alasan ia harus selalu dijalankan sebelum reload. Pesannya menyebut nomor baris file yang bermasalah.',
        'Graceful membaca konfigurasi baru tanpa memutus koneksi lama. Namun bila <i>file itu sendiri dipasang lewat bind mount</i> dan diganti inode baru oleh editor, container bisa kehilangan keterlihatan file → jalankan <code>--force-recreate</code>.',
        'Mapping port di <code>compose.yaml</code> tidak ikut berubah hanya dengan edit konfigurasi container; keduanya harus selaras.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Blok &lt;Directory&gt;: pintu akses filesystem</h3><p>Struktur paling penting di konfigurasi dasar adalah pasangan berikut — tanpanya justru request kamu akan <b>ditolak semua</b>, karena default globalnya menolak:</p><pre><code>&lt;Directory /&gt;\n    AllowOverride none\n    Require all denied\n&lt;/Directory&gt;\n\nDocumentRoot "/usr/local/apache2/htdocs"\n&lt;Directory "/usr/local/apache2/htdocs"&gt;\n    Options Indexes FollowSymLinks\n    AllowOverride All\n    Require all granted\n&lt;/Directory&gt;</code></pre><table><thead><tr><th>Direktif</th><th>Pilihan yang sering dipakai</th></tr></thead><tbody><tr><td><code>Options</code></td><td><code>Indexes</code> (daftar isi bila index tidak ada), <code>FollowSymLinks</code>, <code>None</code></td></tr><tr><td><code>AllowOverride</code></td><td><code>None</code> (abaikan .htaccess), <code>All</code>, atau daftar kategori (<code>FileInfo AuthConfig Limit</code>)</td></tr><tr><td><code>Require</code></td><td><code>all granted</code>, <code>all denied</code>, <code>ip 10.0.0.0/8</code>, <code>valid-user</code></td></tr></tbody></table><p>Prinsipnya: <b>semakin spesifik path-nya, semakin menang</b>. Blok <code>&lt;Directory "/usr/local/apache2/htdocs/assets"&gt;</code> mengalahkan blok <code>htdocs</code>, yang mengalahkan <code>&lt;Directory /&gt;</code>.</p>'
    },
    {
      type: 'example',
      title: 'Alur kerja mengubah konfigurasi dengan aman',
      lang: 'bash',
      output: false,
      code: `1. Edit file konfigurasi        (nano apache/httpd.conf)
2. httpd -t                      (validasi — WAJIB sebelum apply)
3. httpd -k graceful             (terapkan tanpa downtime)
4. podman logs --tail 20 apache-lab   (pastikan tidak ada error baru)
5. curl -sI http://localhost:8080/     (buktikan perilakunya berubah)

Kalau gagal di langkah 2: perbaiki file, JANGAN reload.
Kalau 3 menghasilkan error: konfigurasi lama tetap berjalan —
   klien tidak terputus, dan kamu masih punya waktu memperbaiki.`,
      explain: [
        'Urutan ini yang membuat perubahan konfigurasi aman di produksi: <b>validasi → terapkan → amati → buktikan</b>.',
        '<code>httpd -k graceful</code> membuka worker baru memakai konfigurasi baru lalu membereskan worker lama setelah request terakhirnya selesai.',
        'Bandingkan dengan <code>httpd -k restart</code> (atau <code>systemctl restart apache2</code>): semua koneksi diputus — hanya untuk perubahan yang tidak bisa ditangani graceful, mis. pergantian MPM.'
      ]
    },
    {
      type: 'warn',
      title: 'Reload yang tidak terlihat: file terganti, mount basi',
      text: '<p>Pada lab ini <code>./apache/httpd.conf</code> dipasang sebagai bind mount <b>file</b>. Beberapa editor menyimpan dengan menulis file baru lalu mengganti nama (inode baru) — container masih menunjuk inode lama, sehingga <code>httpd -t</code> seolah membaca file lama. Gejalanya: perubahan tidak pernah terbaca walau sudah <code>graceful</code>. Solusinya: <code>podman compose up -d --force-recreate apache-lab</code>. Untuk sync dari repo, gunakan penulisan in-place (<code>rsync --inplace</code> atau <code>cp</code>).</p>'
    },
    {
      type: 'tip',
      title: 'Mulai dari log ketika Apache menolak start',
      text: '<p>Pesan error startup selalu menyebut <b>nomor baris</b> dan direktif yang bermasalah, mis. <code>AH00526: Syntax error on line 58 ... LoadModule takes two arguments</code>. Kesalahan klasik di image resmi: menulis komentar <code># teks</code> di akhir baris direktif — Apache membaca sisa baris sebagai argumen, sehingga <code>LoadModule x y.so # komentar</code> dianggap tiga argumen. Pindahkan komentar ke barisnya sendiri.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['ServerRoot', 'Akar instalasi Apache; path relatif dihitung dari sini.'],
        ['Listen', 'Direktif yang membuka alamat/port untuk menerima koneksi.'],
        ['DocumentRoot', 'Akar filesystem konten web vhost yang sedang dilayani.'],
        ['DirectoryIndex', 'Daftar file yang dicari saat path berakhir direktori (index.html).'],
        ['Include', 'Menyisipkan file lain ke dalam konfigurasi — dasar konfigurasi modular.'],
        ['httpd -t', 'Validasi konfigurasi (configtest) tanpa menyentuh proses yang berjalan.'],
        ['Graceful', 'Reload: worker baru dengan konfigurasi baru, worker lama diselesaikan.'],
        ['a2enmod / a2ensite', 'Alat Debian untuk menyalakan modul/situs via symlink Include.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Baca <code>examples/apache-lab/apache/httpd.conf</code> dari atas ke bawah dan catat fungsi tiap bagian: Listen, LoadModule, Directory, log, modul tambahan, balancer, Include.</li><li>Ubah <code>Listen 8080</code> menjadi <code>Listen 8090</code> (jangan lupa <code>compose.yaml</code>), jalankan alur 5 langkah di atas, lalu kembalikan lagi ke 8080.</li><li>Sengaja rusak konfigurasi (hapus satu tanda kutip), buktikan <code>httpd -t</code> menolak dan server lama tetap berjalan, lalu perbaiki.</li><li>Bandingkan <code>httpd -k graceful</code> dengan <code>httpd -k restart</code> pada lab: jalankan <code>curl</code> berulang di satu terminal sementara perintah dijalankan di terminal lain, dan catat apakah ada koneksi gagal.</li></ol>'
    }
  ],
  recap: [
    'Debian, RHEL, dan container resmi memakai file utama yang berbeda, tapi prinsipnya sama: <b>file utama + Include</b>.',
    '<code>Listen</code> membuka port (server), <code>ServerName</code> mengidentifikasi, <code>DocumentRoot</code> menentukan akar file, <code>DirectoryIndex</code> menentukan file pembuka direktori.',
    'Alur aman: <b>edit → <code>httpd -t</code> → <code>httpd -k graceful</code> → log → curl</b>.',
    '<code>&lt;Directory&gt;</code> mengatur akses per path filesystem dan mengikuti prinsip "yang paling spesifik menang"; default global menolak semua sehingga DocumentRoot wajib <code>Require all granted</code>.'
  ]
});
