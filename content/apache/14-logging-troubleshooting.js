/* ============================================================
   Pelajaran Apache — 14: Logging & Troubleshooting
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'logging-troubleshooting',
  title: 'Logging & Troubleshooting: Membaca Jejak Error',
  chapter: 'Logging & Troubleshooting',
  duration: '12 menit',
  intro: [
    'Ketika website bermasalah, log adalah satu-satunya saksi mata: ia merekam request apa yang masuk, ke mana diteruskan, dan kenapa gagal — jauh sebelum kamu sempat menebak-nebak. Sayangnya, banyak yang membaca log hanya saat panik, tanpa tahu apa yang dicari.',
    'Pelajaran ini melatih dua hal sekaligus: <b>menyiapkan</b> log yang berguna (format, tujuan, rotasi) dan <b>membacanya</b> dengan metode diagnosis sistematis — dari memilih kata kunci kode <code>AH####</code>, menguji reproduksi, sampai menemukan akar masalahnya. Materi ini ditutup dengan pola troubleshooting paling umum pada Apache, semuanya diuji pada log container lab yang tersambung ke stdout.'
  ],
  objectives: [
    'Menulis <code>LogFormat</code> dan <code>CustomLog</code> sesuai kebutuhan analisis',
    'Mengatur log ke stdout/container dan menjelaskan rotasi log di produksi',
    'Membaca baris log akses: status, ukuran, waktu, referer, user-agent',
    'Menggunakan kode <code>AH####</code> dan pola diagnosis untuk menemukan akar masalah',
    'Menerapkan urutan troubleshooting: baca log → reproduksi → ubah satu hal → buktikan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua log, dua cerita</h3><table><thead><tr><th></th><th>Log akses</th><th>Log error</th></tr></thead><tbody><tr><td>Isi</td><td>Satu baris per request yang <b>selesai</b></td><td>Peringatan &amp; kegagalan proses server</td></tr><tr><td>Direktif</td><td><code>CustomLog</code> + <code>LogFormat</code></td><td><code>ErrorLog</code></td></tr><tr><td>Ditanya</td><td>"Apa yang diminta klien? Status berapa? Berapa berat?"</td><td>"Kenapa gagal? Di baris/konteks mana?"</td></tr><tr><td>Di lab</td><td><code>/proc/self/fd/1</code> → <code>podman logs</code></td><td><code>/proc/self/fd/2</code> → <code>podman logs</code></td></tr></tbody></table><p>Prinsip pembagian kerja: <b>mulai dari log error</b> ketika ada kegagalan; log akses dipakai untuk pola dan statistik (status 4xx/5xx apa yang sering muncul, siapa yang paling banyak meminta). Keduanya saling melengkapi — baris 404 di log akses menjawab "apa", log error menjawab "kenapa".</p>'
    },
    {
      type: 'example',
      title: 'Menyusun LogFormat sendiri',
      lang: 'apache',
      output: false,
      code: `# Format bawaan "combined" (yang dipakai lab)
LogFormat "%h %l %u %t \\"%r\\" %>s %b \\"%{Referer}i\\" \\"%{User-Agent}i\\"" combined

# Format ringkas untuk analisis status & waktu
LogFormat "%h %>s %b %D \\"%r\\" %v" timed

# Log terpisah berdasarkan status (mis. hanya 5xx di file khusus)
# CustomLog logs/5xx.log "%{%Y-%m-%d %T}t %h %>s %b %D \\"%r\\" \\"%{X-Forwarded-For}i\\"" env=ERR

CustomLog /proc/self/fd/1 timed`,
      explain: [
        'Baca format sebagai daftar penanda: <code>%h</code> IP klien, <code>%l</code> identd, <code>%u</code> user auth, <code>%t</code> waktu, <code>%r</code> baris request, <code>%&gt;s</code> status akhir, <code>%b</code> byte, <code>%D</code> mikrosekon (!), <code>%v</code> nama virtual host.',
        'Tanda <code>%&gt;s</code> (dengan <code>&gt;</code>) mencatat status akhir — penting ketika ada internal redirect (rewrite/fallback) yang mengubah status di tengah jalan.',
        'Bila lab melayani banyak vhost, <code>%v</code> di format membuat satu file log tetap bisa dibedakan asal website-nya.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca log akses lab',
      lang: 'bash',
      output: true,
      code: `podman logs apache-lab 2>&1 | tail -3
# 10.89.2.5 - - [20/Nov/2026:10:12:44 +0000] "GET /api/ HTTP/1.1" 200 512 "-" "curl/8.7.1"
# 10.89.2.5 - - [20/Nov/2026:10:12:45 +0000] "GET /assets/hilang.css HTTP/1.1" 404 196 "-" "curl/8.7.1"
# 10.89.2.5 - - [20/Nov/2026:10:12:46 +0000] "GET /private/ HTTP/1.1" 403 199 "-" "curl/8.7.1"

# Analisis cepat: status apa saja yang muncul hari ini?
podman logs apache-lab 2>&1 | grep '" 4' | tail -5

# Cari request ke path tertentu
podman logs apache-lab 2>&1 | grep 'GET /slow/'`,
      explain: [
        'Tiap baris mengandung: siapa (IP), kapan, apa yang diminta (method + path + versi), status, byte, dari mana (Referer), dan pakai apa (User-Agent).',
        'Kalimat "apa yang terjadi" paling sering terjawab dari lima kolom itu: <code>404</code> untuk path yang salah eja, <code>403</code> untuk aturan menolak, <code>5xx</code> → lanjut ke log error.',
        'Di lab, kedua log tercetak ke stdout container sehingga <code>podman logs</code> sudah cukup — tidak perlu <code>tail -f</code> di dalam container.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kode AH####: kata kunci pencarian terbaik</h3><p>Log error Apache dibanjiri teks; yang membuatnya bisa dicari adalah kode <code>AH####</code>. Kode yang paling sering kamu temui di lab ini:</p><table><thead><tr><th>Kode</th><th>Arti</th><th>Arah perbaikan</th></tr></thead><tbody><tr><td><code>AH00526</code></td><td>Syntax error pada direktif (argumen salah)</td><td>Baca nomor baris yang disebut; cek komentar di akhir baris</td></tr><tr><td><code>AH01574</code></td><td>Direktif tidak dikenal / modul belum dimuat</td><td><code>httpd -M</code>, cocokkan modul penyedia direktif</td></tr><tr><td><code>AH00898</code></td><td>DNS backend gagal / membaca dari remote server gagal</td><td><code>podman ps</code>, cek nama service di compose</td></tr><tr><td><code>AH00957</code> / <code>AH01114</code></td><td>Gagal membuka koneksi ke backend (→503)</td><td>Port salah, backend mati, connectiontimeout habis</td></tr><tr><td><code>AH01102</code></td><td>Gagal membaca baris status backend (→502)</td><td>Backend hang / timeout dibaca</td></tr><tr><td><code>AH00036</code></td><td>Permission menulis log/mutex</td><td>Permission direktori logs</td></tr><tr><td><code>AH01630</code></td><td>Client menolak koneksi saat kirim response</td><td>Biasanya klien menutup lebih dulu — bukan bug server</td></tr></tbody></table><p>Catatan: kode memudahkan pencarian (<code>grep -E \'AH0[0-9]+\'</code>), sedangkan <b>pesan</b>-nya menjelaskan penyebab. Selalu baca keduanya beserta konteks 1–2 baris sebelum &amp; sesudahnya — baris sebelumnya sering menyebut request yang sedang diproses.</p>'
    },
    {
      type: 'example',
      title: 'Metode diagnosis 5 langkah',
      lang: 'bash',
      output: false,
      code: `# 1. Amati gejala — status dan waktu (bukan menebak)
curl -s -o /dev/null -w '%{http_code} %{time_total}s\\n' http://localhost:8080/api/

# 2. Baca log error TERBARU — cari kode AH####
podman logs --tail 30 apache-lab 2>&1 | grep -iE 'error|AH[0-9]+' | tail -5

# 3. Persempit: apakah cuma rute ini? statis masih jalan?
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/api/

# 4. Cek sisi lain (backend hidup? namanya resolve?)
podman ps --format '{{.Names}} {{.Status}}'
podman logs --tail 5 backend-1

# 5. Ubah SATU hal, validasi, terapkan, uji ulang
podman exec apache-lab httpd -t && podman exec apache-lab httpd -k graceful`,
      explain: [
        'Langkah 3 adalah pemisah paling berharga: bila statis 200 tapi proxy 5xx, masalah ada di upstream — kamu tidak perlu menyentuh konfigurasi statis sama sekali.',
        'Satu perubahan per iterasi membuat penyebabnya jelas; mengubah tiga hal sekaligus saat keduanya benar membuat kamu tidak tahu faktor mana yang menolong.',
        'Log error yang muncul <b>setelah</b> kamu menerapkan perubahan juga harus dibaca — ada konfigurasi valid secara syntax tapi bermasalah saat runtime (mis. direktif yang diam-diam tidak berlaku di konteksnya).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pola masalah paling umum</h3><table><thead><tr><th>Gejala</th><th>Kemungkinan besar</th><th>Cek pertama</th></tr></thead><tbody><tr><td>403 pada file yang jelas ada</td><td><code>&lt;Directory&gt;</code> belum <code>Require all granted</code> / permission / <code>-Indexes</code></td><td><code>httpd -S</code>, lalu baca blok Directory vhost itu</td></tr><tr><td>404 padahal file ada</td><td>DocumentRoot salah, Alias belum ada, atau tertangkap fallback/rewrite</td><td>log error (handler mana yang memproses)</td></tr><tr><td>502/503 hanya di rute proxy</td><td>Backend mati / port salah / DNS gagal</td><td><code>podman ps</code> + kode <code>AH00957/AH00898</code></td></tr><tr><td>500 pertama lalu normal</td><td>Nama backend hilang sesaat (container berhenti) lalu disingkirkan balancer</td><td>Pulihkan backend + <code>httpd -k graceful</code></td></tr><tr><td>Halaman lama terus (padahal sudah diedit)</td><td>Cache browser / container membaca inode lama</td><td><code>curl -H \'Cache-Control: no-cache\'</code>, force recreate</td></tr><tr><td>Perubahan konfigurasi tidak mempan</td><td>File terganti inode (bind mount) / lupa reload</td><td><code>--force-recreate</code>, lalu <code>httpd -t</code> + graceful</td></tr><tr><td>Timeout lambat ± N detik</td><td>Atribut timeout ProxyPass habis</td><td>Cocokkan waktu respons dengan nilai timeout di rute itu</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Rotasi log: jangan biarkan tumbuh tanpa batas',
      lang: 'bash',
      output: false,
      code: `# Container lab: log ke stdout -> serahkan pada log driver podman
#   podman logs --max-size 10m apache-lab   (di daemon.conf / podman run)

# Instalasi host (gaya umum): rotasi dengan logrotate
# /etc/logrotate.d/apache2
# /usr/local/apache2/logs/*_log {
#     daily
#     missingok
#     rotate 14
#     compress
#     delaycompress
#     notifempty
#     sharedscripts
#     postrotate
#         /usr/local/apache2/bin/httpd -k graceful >/dev/null 2>&1 || true
#     endscript
# }`,
      explain: [
        'File log yang dipotong begitu saja membuat Apache terus menulis ke file lama (inode yang sudah dipindah) sampai <code>graceful</code> — itulah gunanya script pasca-rotate memanggil <code>httpd -k graceful</code>.',
        'Prinsip container: <b>jangan menyimpan log di dalam container</b>. Arahkan ke stdout dan serahkan penyimpanan/rotasi ke driver log container atau sistem pengumpul log.',
        'Kompres (gzip) harian; <code>delaycompress</code> menunda kompresi satu siklus agar file yang baru saja diputar masih bisa dibaca oleh skrip yang berjalan.'
      ]
    },
    {
      type: 'tip',
      title: 'Buat "buku resep" error dari pengalamanmu sendiri',
      text: '<p>Setiap kali menyelesaikan insiden, catat empat baris: gejala → kode/pesan di log → penyebab → perbaikan. Tiga bulan kemudian, daftar itu jauh lebih berharga daripada dokumentasi mana pun — karena isinya adalah error yang memang pernah kamu hadapi di lingkunganmu sendiri. Contoh entri pertama yang sudah kamu punyi dari lab ini: "503 cepat di /slow/ → <code>AH01114</code> → tidak ada listener backend-1:9090 → jalankan nc listener".</p>'
    },
    {
      type: 'vocab',
      items: [
        ['LogFormat', 'Menyusun pola baris log akses dengan penanda %h, %r, %>s, %b, %D, %v.'],
        ['CustomLog', 'Menetapkan tujuan dan format log akses (bisa lebih dari satu).'],
        ['ErrorLog', 'Tujuan log error; di lab diarahkan ke stderr container.'],
        ['%D vs %b', 'Mikrosekon durasi vs jumlah byte yang dikirim.'],
        ['Kode AH####', 'Penanda error Apache yang mudah dicari dengan grep.'],
        ['Graceful', 'Memuat konfigurasi baru tanpa memutus koneksi berjalan.'],
        ['logrotate', 'Alat rotasi log berkala dengan script pasca-rotate.'],
        ['Reproduksi', 'Memunculkan ulang masalah secara terkendali sebelum dan sesudah perubahan.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tambahkan <code>timed</code> LogFormat (atau format milikmu sendiri) dan arahkan ke tujuan terpisah, lalu buktikan isinya berbeda dari format combined.</li><li>Provokasi empat jenis error berbeda di lab (403, 404, 503 proxy, dan syntax error), lalu untuk masing-masing catat: kode <code>AH####</code>, baris log yang relevan, dan langkah pertama perbaikannya.</li><li>Uji pola "perubahan tidak mempan": edit <code>httpd.conf</code> dengan editor yang mengganti file (atau <code>perl -i</code>), coba <code>graceful</code>, amati kapan kamu butuh <code>--force-recreate</code> — jelaskan mengapa inode menentukan.</li><li>Tulis satu entri "buku resep" lengkap untuk kegagalan yang kamu temukan sendiri di latihan nomor 2, dengan format gejala → log → penyebab → perbaikan.</li></ol>'
    }
  ],
  recap: [
    'Log akses (CustomLog/LogFormat) menjawab "apa"; log error (ErrorLog) menjawab "kenapa" — mulai dari log error saat ada kegagalan.',
    'Penanda format utama: <code>%h</code>, <code>%t</code>, <code>%r</code>, <code>%&gt;s</code>, <code>%b</code>, <code>%D</code>, <code>%v</code>; konteks container mengarahkan keduanya ke stdout/stderr.',
    'Kode <code>AH####</code> adalah kata kunci pencarian; diagnosis 5 langkah: gejala → log → persempit → cek sisi lain → ubah satu hal.',
    'Pola umum: 403/404 menyangkut aturan &amp; pemetaan lokal, 5xx proxy menyangkut upstream, dan "perubahan tidak mempan" hampir selalu soal reload/inode.'
  ]
});
