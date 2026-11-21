/* ============================================================
   Pelajaran Apache — 06: Apache Modules
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'apache-modules',
  title: 'Apache Modules: LoadModule & Modul Inti',
  chapter: 'Modul',
  duration: '10 menit',
  intro: [
    'Apache disebut modular sejak dulu: inti server hanya menangani koneksi, request, dan file — sisanya (SSL, rewrite, proxy, kompresi, autentikasi) ditambahkan lewat <b>modul</b>. Konsekuensinya, direktif yang kamu ketik baru ada <i>setelah</i> modulnya dimuat; kalau belum, <code>httpd -t</code> akan menolaknya.',
    'Pelajaran ini memetakan cara kerja modul, membedakan modul statis dan dinamis, membaca daftar modul inti yang paling sering dipakai, lalu melatih menyalakan/mematikan modul pada lab — lengkap dengan cara memverifikasinya lewat <code>httpd -M</code> dan <code>httpd -l</code>.'
  ],
  objectives: [
    'Menjelaskan perbedaan modul statis dan modul dinamis (.so)',
    'Menyalakan dan mematikan modul pada image container resmi',
    'Menyebutkan fungsi modul inti: rewrite, headers, alias, status, deflate, expires, auth',
    'Menghubungkan direktif dengan modul penyedianya ketika muncul error unknown directive',
    'Menguji efek sebuah modul pada lab sebelum dan sesudah diaktifkan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Statis vs dinamis</h3><table><thead><tr><th></th><th>Statis</th><th>Dinamis (<code>.so</code>)</th></tr></thead><tbody><tr><td>Cara masuk</td><td>Dikompilasi ke binari <code>httpd</code></td><td><code>LoadModule nama modules/nama.so</code></td></tr><tr><td>Terketahui dari</td><td><code>httpd -l</code></td><td><code>httpd -M</code></td></tr><tr><td>Menambah/menghapus</td><td>Harus kompilasi ulang</td><td>Edit baris <code>LoadModule</code> lalu reload</td></tr><tr><td>Praktik</td><td>hampir tidak perlu</td><td>mayoritas modul yang kamu pakai</td></tr></tbody></table><p>Modul juga punya <b>dependensi</b>: <code>mod_proxy_http</code> butuh <code>mod_proxy</code>, <code>mod_ssl</code> butuh <code>mod_socache_shmcb</code> (untuk session cache), dan MPM hanya boleh satu. Urutan <code>LoadModule</code> mengikuti dependensi — menyalakan anak sebelum induk membuat startup gagal.</p>'
    },
    {
      type: 'example',
      title: 'Menyalakan, memeriksa, mematikan modul di lab',
      lang: 'bash',
      output: true,
      code: `# 1. Lihat modul yang sudah dimuat sekarang
podman exec apache-lab httpd -M

# 2. Aktifkan modul contoh: mod_info (di lab sudah aktif di httpd.conf)
#    Cukup pastikan baris ini ada dan TIDAK dikomentari:
#    LoadModule info_module modules/mod_info.so

# 3. Validasi lalu terapkan
podman exec apache-lab httpd -t      # Syntax OK
podman exec apache-lab httpd -k graceful

# 4. Buktikan modulnya hidup
curl -s http://localhost:8080/server-info | grep -i 'Loaded Modules' -A3

# 5. Mematikan = komentari barisnya (# di awal), lalu uji ulang.
#    Direktif yang hanya milik modul mati akan membuat httpd -T gagal.`,
      explain: [
        'Di container, "menyalakan modul" = memastikan baris <code>LoadModule</code> ada di <code>apache/httpd.conf</code> lalu graceful — tanpa <code>a2enmod</code> (itu gaya Debian).',
        'Selalu <code>httpd -t</code> dulu: kalau ada direktif lain yang bergantung pada modul yang kamu matikan, kamu tahu sebelum server sempat memuat konfigurasi rusak.',
        '<code>httpd -M</code> mencetak <code>(shared)</code> untuk modul dinamis dan <code>(static)</code> untuk yang dikompilasi — bila nama modul tidak muncul sama sekali, file .so-nya salah path atau tidak ada.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Peta modul yang dipakai bab ini</h3><table><thead><tr><th>Modul</th><th>Direktif utama</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>mod_rewrite</code></td><td><code>RewriteRule</code>, <code>RewriteCond</code></td><td>Routing &amp; transformasi URL (Pelajaran 07)</td></tr><tr><td><code>mod_alias</code></td><td><code>Alias</code>, <code>Redirect</code></td><td>Pemetaan URL ke path lain &amp; pengalihan 3xx</td></tr><tr><td><code>mod_dir</code></td><td><code>DirectoryIndex</code>, <code>FallbackResource</code></td><td>File pembuka direktori (sudah aktif bawaan)</td></tr><tr><td><code>mod_headers</code></td><td><code>Header</code>, <code>RequestHeader</code></td><td>Menambah/mengubah/menghapus header (Pelajaran 11)</td></tr><tr><td><code>mod_mime</code></td><td><code>AddType</code>, <code>AddOutputFilterByType</code></td><td>Pemetaan ekstensi → MIME type</td></tr><tr><td><code>mod_log_config</code></td><td><code>LogFormat</code>, <code>CustomLog</code></td><td>Format &amp; tujuan log akses (Pelajaran 13)</td></tr><tr><td><code>mod_deflate</code></td><td><code>AddOutputFilterByType DEFLATE</code></td><td>Kompresi gzip response teks</td></tr><tr><td><code>mod_expires</code></td><td><code>ExpiresActive</code>, <code>ExpiresByType</code></td><td>Cache-Control / Expires di browser</td></tr><tr><td><code>mod_ssl</code></td><td><code>SSLEngine</code>, <code>SSLCertificateFile</code></td><td>HTTPS/TLS (Pelajaran 10)</td></tr><tr><td><code>mod_http2</code></td><td><code>Protocols h2 http/1.1</code></td><td>HTTP/2 lewat ALPN di atas TLS</td></tr><tr><td><code>mod_proxy*</code></td><td><code>ProxyPass</code>, <code>BalancerMember</code></td><td>Reverse proxy &amp; load balancer (Pelajaran 08, 14)</td></tr><tr><td><code>mod_auth*</code></td><td><code>AuthType</code>, <code>Require</code></td><td>Autentikasi basic &amp; otorisasi (Pelajaran 11)</td></tr><tr><td><code>mod_status</code></td><td><code>SetHandler server-status</code></td><td>Monitoring live (Pelajaran 13)</td></tr><tr><td><code>mod_info</code></td><td><code>SetHandler server-info</code></td><td>Inspeksi modul &amp; konfigurasi efektif</td></tr><tr><td><code>mod_ratelimit</code></td><td><code>LimitRate</code></td><td>Membatasi kecepatan per koneksi</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Directive tidak dikenal? → ini modulnya',
      lang: 'bash',
      output: false,
      code: `# Gejala:
AH01574: module is not configured to handle ... 
# atau
AH00526: Invalid command 'SSLCertificateFile'...   (mod_ssl belum dimuat)

# Diagnosis — cocokkan direktif dengan modulnya:
podman exec apache-lab httpd -M | grep -E 'ssl|proxy|rewrite'

# Hasil yang diharapkan di lab:
 ssl_module (shared)
 proxy_module (shared)
 proxy_http_module (shared)
 proxy_balancer_module (shared)
 rewrite_module (shared)`,
      explain: [
        'Setiap direktif terdaftar pada modulnya di dokumentasi (kolom <b>Context</b> dan <b>Module</b>) — halaman itu adalah jawaban pasti saat bingung.',
        'Kesalahan umum: menyalakan <code>mod_proxy</code> tapi lupa <code>mod_proxy_http</code> → <code>ProxyPass</code> ada, tapi request HTTP ke backend tetap gagal.',
        'Untuk MPM: hanya satu boleh aktif. Menambah <code>mpm_prefork</code> di lab yang memakai <code>mpm_event</code> membuat startup menolak dengan pesan "MPM already loaded".'
      ]
    },
    {
      type: 'text',
      html: '<h3>Modul yang jarang terlihat tapi penting</h3><ul><li><code>mod_reqtimeout</code> — membatasi waktu membaca request; pelindung dasar dari serangan lambat (slowloris). Bawaan sudah aktif.</li><li><code>mod_setenvif</code> &amp; <code>mod_env</code> — menentukan variabel lingkungan berdasarkan request; sering dipakai untuk memecah log/behavior per klien.</li><li><code>mod_filter</code> — menyaring kapan filter output (deflate) diterapkan.</li><li><code>mod_slotmem_shm</code> &amp; <code>mod_lbmethod_*</code> — dependensi balancer yang sering lupa dimuat.</li><li><code>mod_auth_digest</code> — autentikasi digest yang lebih aman dari basic, tapi jarang dibutuhkan karena HTTPS sudah mengenkripsi kredensial.</li></ul><p>Prinsip hematnya: <b>muat hanya modul yang dipakai</b>. Tiap modul menambah permukaan konfigurasi (dan potensi konflik), sementara yang tidak dimuat tidak mungkin dieksploitasi lewat direktifnya.</p>'
    },
    {
      type: 'warn',
      title: 'Komentar di akhir baris LoadModule adalah jebakan',
      text: '<p>Apache memakai <b>seluruh sisa baris</b> sebagai argumen direktif. Menulis <code>LoadModule ssl_module modules/mod_ssl.so # untuk HTTPS</code> membuatnya dianggap tiga argumen → <code>AH00526: LoadModule takes two arguments</code>. Tulis komentar di baris terpisah. Kebalikannya juga berlaku: <code>Listen 8080 # port web</code> akan error karena <code># port web</code> dianggap argumen ketiga.</p>'
    },
    {
      type: 'tip',
      title: 'Aktifkan modul hanya saat dibutuhkan, bukan "siapa tahu berguna"',
      text: '<p>Modul yang aktif menambah memori, log, dan sekurangnya kebingungan saat membaca konfigurasi. <code>mod_info</code> dan <code>mod_status</code> misalnya, aktif di lab untuk pembelajaran tapi wajib dibatasi <code>Require ip</code> di produksi karena menampilkan peta konfigurasi server. Audit berkala dengan <code>httpd -M</code> lalu matikan yang tidak dipakai — itu bagian dari hardening (Pelajaran 11).</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Modul', 'Unit fitur Apache yang menambahkan direktif dan handler.'],
        ['LoadModule', 'Baris yang memuat modul dinamis (.so) saat startup.'],
        ['modul statis', 'Dikompilasi ke binari; terlihat pada <code>httpd -l</code>.'],
        ['Handler', 'Komponen yang mengisi response untuk URL/lokasi tertentu.'],
        ['Dependensi', 'Modul yang harus dimuat lebih dulu (mis. proxy sebelum proxy_http).'],
        ['a2enmod', 'Alat Debian mengaktifkan modul via symlink; ekuivalennya baris LoadModule.'],
        ['httpd -M', 'Menampilkan modul yang dimuat beserta tanda (shared)/(static).'],
        ['httpd -l', 'Menampilkan hanya modul yang dikompilasi statis.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan <code>httpd -M</code> di lab dan tandai modul yang memang kamu pakai untuk lab ini (ssl, proxy, rewrite, deflate, expires, status, http2). Bandingkan jumlahnya dengan total baris modul — berapa yang menganggur?</li><li>Komentari <code>LoadModule expires_module ...</code>, jalankan <code>httpd -t</code>, lalu cek <code>curl -sI http://localhost:8080/assets/style.css</code> — header <code>Cache-Control</code> hilang? Pulihkan kembali.</li><li>Cari di dokumentasi direktif <code>Protocols</code>: modul apa yang menyediakannya, dan apa yang terjadi bila <code>mod_http2</code> tidak dimuat.</li><li>Sengaja tulis komentar di akhir baris <code>Listen</code>, buktikan pesan errornya, lalu perbaiki. Catat kode errornya untuk diingat.</li></ol>'
    }
  ],
  recap: [
    'Modul <b>statis</b> dikompilasi ke binari (<code>httpd -l</code>); <b>dinamis</b> dimuat lewat <code>LoadModule ... .so</code> dan terlihat pada <code>httpd -M</code>.',
    'Directive baru hanya ada setelah modulnya dimuat — "invalid command" hampir selalu berarti modul belum aktif atau nama file salah.',
    'Modul inti yang dipakai bab ini: rewrite, alias, headers, mime, log_config, deflate, expires, ssl, http2, proxy+proxy_http+proxy_balancer, auth*, status, info, ratelimit.',
    'Muat hanya yang dipakai, ikuti dependensi urutannya, dan jangan pernah menaruh komentar di akhir baris direktif.'
  ]
});
