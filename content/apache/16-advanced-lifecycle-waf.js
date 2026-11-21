/* ============================================================
   Pelajaran Apache — 16: Advanced Apache I
   Lifecycle, Unix Socket, Ekspresi & WAF
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'advanced-lifecycle-waf',
  title: 'Advanced Apache: Lifecycle, Unix Socket, Ekspresi & WAF',
  chapter: 'Advanced',
  duration: '12 menit',
  intro: [
    'Pelajaran-pelajaran sebelumnya memakai fitur Apache sehari-hari. Level 12 menuntut pemahaman yang lebih dalam: kapan <i>sebenarnya</i> konfigurasi baru berlaku, bagaimana Apache berkomunikasi dengan backend tanpa jaringan (unix socket), bagaimana menulis kondisi yang lebih canggih dari <code>RewriteCond</code>, dan di mana posisi WAF (Web Application Firewall) seperti ModSecurity dalam arsitektur.',
    'Materi ini adalah jembatan dari "bisa mengonfigurasi" ke "bisa merancang": lifecycle reload yang aman, proxy antar-proses, mesin ekspresi Apache (<code>&lt;If&gt;</code>), sampai lapisan keamanan tambahan yang tidak bisa dicapai konfigurasi biasa.'
  ],
  objectives: [
    'Membedakan <code>graceful</code>, <code>graceful-stop</code>, dan <code>restart</code> beserta dampaknya pada koneksi',
    'Meneruskan request ke backend lewat unix socket (<code>unix:/path|http://...</code>)',
    'Menulis kondisi memakai mesin ekspresi Apache: <code>&lt;If&gt;</code> dan <code>Require expr</code>',
    'Menempatkan WAF (ModSecurity) di depan Apache dan menjelaskan batasnya',
    'Menyusun urutan perubahan konfigurasi yang aman untuk produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Lifecycle: tiga perintah berbeda</h3><table><thead><tr><th>Perintah</th><th>Yang terjadi</th><th>Kapan dipakai</th></tr></thead><tbody><tr><td><code>httpd -k graceful</code></td><td>Worker baru (konfigurasi baru) mulai; worker lama menyelesaikan request yang sedang berjalan lalu keluar</td><td>Perubahan konfigurasi rutin — tanpa downtime</td></tr><tr><td><code>httpd -k graceful-stop</code></td><td>Proses induk berhenti menerima koneksi baru, lalu membereskan anak-anaknya secara perlahan</td><td>Sebelum maintenance / sebelum mematikan mesin</td></tr><tr><td><code>httpd -k restart</code></td><td>Semua proses dimatikan, lalu dibuka lagi — koneksi terputus</td><td>Hanya untuk perubahan yang tidak bisa ditangani graceful (mis. ganti MPM)</td></tr></tbody></table><p>Yang sering tidak disadari: <b>konfigurasi baru baru berlaku setelah graceful</b> — mengedit file saja tidak mengubah apa pun, dan <code>httpd -t</code> hanya memvalidasi file tanpa menyentuh proses yang berjalan. Urutan aman selalu: <code>httpd -t</code> → <code>graceful</code> → baca log → uji.</p>'
    },
    {
      type: 'example',
      title: 'Graceful dalam praktik di container',
      lang: 'bash',
      output: false,
      code: `# Terminal 1: koneksi berjalan tanpa henti
while true; do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/; sleep 0.3; done

# Terminal 2: terapkan perubahan konfigurasi
podman exec apache-lab httpd -t
podman exec apache-lab httpd -k graceful
# -> TIDAK boleh ada satupun 000 / connection refused pada terminal 1

# Saat akan mematikan container dengan rapi:
podman exec apache-lab httpd -k graceful-stop
podman stop apache-lab`,
      explain: [
        'Loop curl inilah "uji tidak ada downtime" paling sederhana — angka <code>000</code> (curl gagal terhubung) yang muncul menandakan ada putus koneksi.',
        'Pada container, <code>graceful-stop</code> memberi proses waktu menguras koneksi sebelum <code>podman stop</code> mengirim sinyal berikutnya (grace period <code>--time</code>).',
        'Konfigurasi yang bergantung pada hal baru (file tambahan, modul, port baru) tetap butuh langkah ekstra di container — mis. menambah <code>Listen</code> baru portnya harus dipublikasikan di <code>compose.yaml</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Unix socket proxy: tanpa port TCP',
      lang: 'apache',
      output: false,
      code: `# Backend yang hanya mendengar di unix socket (mis. PHP-FPM, app Go)
ProxyPass        "/app/" "unix:/run/app.sock|http://localhost/app/"
ProxyPassReverse "/app/" "unix:/run/app.sock|http://localhost/app/"

# Mengapa memakai unix socket?
# - hemat port (tidak perlu listen di jaringan)
# - tidak melewati stack TCP penuh -> latensi lebih rendah di mesin yang sama
# - kontrol akses lewat permission file socket saja (tidak ada firewall port)`,
      explain: [
        'Formatnya <code>unix:&lt;path&gt;|http://&lt;host&gt;&lt;path&gt;</code>: bagian setelah <code>|</code> tetap dibutuhkan karena HTTP/1.1 tetap membutuhkan header <code>Host</code> yang sah.',
        'Syaratnya jelas: socket harus berada di <b>path yang sama terlihat oleh kedua container/proses</b> — pada container, itu berarti volume bersama (mis. <code>type=volume</code> atau tmpfs yang dipasang di keduanya).',
        'Backend harus benar-benar melayani di socket itu; port TCP yang salah terdeteksi sebagai error koneksi biasa di log (<code>AH00957</code>).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mesin ekspresi: &lt;If&gt; dan Require expr</h3><p>Sejak 2.4, Apache punya bahasa kondisi baku — lebih kuat daripada menumpuk <code>RewriteCond</code>, dan berlaku untuk direktif apa pun, bukan hanya rewrite:</p><pre><code># Tolak bila user-agent kosong (sering bot/scanner)\n&lt;If "%{HTTP_USER_AGENT} == \\"\\""&gt;\n    Require all denied\n&lt;/If&gt;\n\n# Kombinasi: hanya HTTPS atau IP internal\n&lt;If "%{REQUEST_SCHEME} == \'http\' &amp;&amp; ! -R \'127.0.0.1\'"&gt;\n    Require all denied\n&lt;/If&gt;\n\n# Require expr — otorisasi berbasis ekspresi (tanpa blok If)\n&lt;Location "/api/"&gt;\n    Require expr %{QUERY_STRING} =~ /token=[a-z0-9]+/\n&lt;/Location&gt;</code></pre><p>Kata kunci: <code>==</code>, <code>!=</code>, <code>=~</code> (regex), <code>&amp;&amp;</code>, <code>||</code>, <code>!</code>, variabel <code>%{...}</code>, dan fungsi seperti <code>-R</code> (IP klien). Ekspresi juga bisa memakai pemanggilan <code>file()</code>, <code>env()</code>, dan meta variabel — lengkapnya di dokumentasi "Expressions in Apache HTTP Server".</p>'
    },
    {
      type: 'example',
      title: 'Kapan memakai &lt;If&gt; vs RewriteRule vs Limit',
      lang: 'text',
      output: false,
      code: `MASALAH                              ALAT YANG TEPAT
---------------------------------------------------------------
URL harus diubah / dialihkan      ->  RewriteRule / Redirect
Memblokir path/ekstensi tertentu  ->  RewriteRule ... [F]  atau <FilesMatch>
Aturan per file/direktori         ->  <Directory>, Options, Require
Kondisi atas request (header,     ->  <If "...">
  query, IP, skema)
Batas ukuran/metode               ->  LimitRequestBody, <LimitExcept>
Mengubah response header          ->  Header always set ...`,
      explain: [
        'Aturan praktis: <b>pilih alat paling deklaratif</b> untuk masalahnya — memakai rewrite untuk membatasi ukuran body hanya menambah ambiguitas urutan evaluasi.',
        '<code>&lt;If&gt;</code> dievaluasi setelah <code>&lt;Location&gt;</code>/<code>&lt;Directory&gt;</code> dipetakan, jadi ia melihat kondisi final — sering jadi tempat terbaik untuk aturan kondisional yang tidak cocok di konteks lain.',
        'Untuk keputusan yang <i>menyangkut keamanan kritis</i>, tulis di <code>&lt;Directory&gt;</code> bila memungkinkan: aturan berbasis path URL bisa dilewati bila ada rewrite atau alternate path.'
      ]
    },
    {
      type: 'text',
      html: '<h3>WAF: ModSecurity dan batasnya</h3><p><b>ModSecurity</b> adalah modul Apache yang berperan sebagai Web Application Firewall: membaca isi request (form, query, header) dan mencocokkannya dengan aturan — pada umumnya <b>Core Rule Set (CRS)</b> dari OWASP. Ia menempel di proses Apache sehingga request yang mencurigakan bisa diblokir sebelum sampai ke backend.</p><ul><li><b>Yang bisa ditangani</b>: injeksi SQL/XSS pola umum, scan otomatis, path traversal, rate/bad behavior dasar.</li><li><b>Batasnya</b>: ia tidak menggantikan patch aplikasi; aturan bisa menghasilkan <i>false positive</i> — karena itu mode <code>DetectionOnly</code> dipakai sebelum beralih ke blokir.</li><li><b>Di container resmi</b>: modul ModSecurity <b>tidak</b> dibundel; tersedia pada distro tertentu (mis. <code>libapache2-mod-security2</code>) atau dibangun sendiri. Alternatif modern: engine eksternal seperti Coraza yang dipasang di depan/di belakang Apache.</li></ul><pre><code># Pada instalasi yang memuat mod_security2:\nSecRuleEngine On\nSecAuditEngine RelevantOnly\nSecAuditLog /proc/self/fd/2\n\n&lt;Location "/"&gt;\n    SecRuleEngine DetectionOnly   # tahap amati dulu\n&lt;/Location&gt;</code></pre>'
    },
    {
      type: 'warn',
      title: 'Menyalakan WAF tanpa tahap amati = gangguan massal',
      text: '<p>CRS dalam mode blokir pada aplikasi yang belum pernah diuji dengannya akan menolak pengguna sah — mulai dari form login sampai upload file, sering dengan 403 yang membingungkan. Urutan yang benar: pasang <code>DetectionOnly</code> → kumpulkan log audit beberapa hari → tinjau baris false positive → turunkan tingkat anjuran (paranoia level) → baru aktifkan blokir per endpoint. Catat bahwa lab bab ini <b>tidak</b> memasang ModSecurity; modul inti Apache sudah cukup untuk seluruh latihan hardening pada Pelajaran 12.</p>'
    },
    {
      type: 'tip',
      title: 'Saat konfigurasi "valid tapi tidak berlaku"',
      text: '<p>Daftar pemeriksaan ketika <code>httpd -t</code> lolos tapi perilaku tidak berubah: (1) sudah <code>graceful</code> belum? (2) direktif ditulis di konteks yang benar (bandingkan dengan <code>httpd -S</code> — vhost mana yang benar-benar melayani)? (3) ada <code>&lt;IfModule&gt;</code> yang diam-diam melewatkan blok karena modul belum dimuat? (4) file yang diedit memang yang dibaca container (inode/mount)? <code>httpd -M</code> dan log <code>Include</code> menutup sebagian besar kasus ini.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['graceful-stop', 'Berhenti menerima koneksi baru, lalu menguras koneksi berjalan dengan perlahan.'],
        ['Unix socket proxy', 'Backend diakses lewat file socket antar-proses, bukan port TCP.'],
        ['Mesin ekspresi', 'Bahasa kondisi Apache 2.4 (==, =~, &&, variabel %{}) untuk &lt;If&gt; dan Require expr.'],
        ['&lt;If&gt;', 'Blok kondisional yang dievaluasi terhadap kondisi request saat runtime.'],
        ['WAF', 'Web Application Firewall — lapisan penyaring request berbasis konten.'],
        ['ModSecurity', 'Modul WAF Apache yang umum dipasang dengan OWASP CRS.'],
        ['DetectionOnly', 'Mode WAF: mencatat tanpa memblokir — prasyarat sebelum mode protektif.'],
        ['False positive', 'Request sah yang keliru ditandai berbahaya oleh aturan WAF.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan uji loop curl sambil <code>httpd -k graceful</code> — pastikan tidak ada satupun kode 000. Ulangi dengan <code>httpd -k restart</code> dan catat apa yang berbeda; kembalikan konfigurasi ke semula.</li><li>Tulis satu blok <code>&lt;If&gt;</code> yang menolak request tanpa <code>User-Agent</code>, uji dengan <code>curl -A \'\'</code> vs <code>curl</code> biasa, lalu bandingkan caranya dengan blok <code>RewriteCond %{HTTP_USER_AGENT}</code> yang setara.</li><li>(Eksplorasi) Baca dokumentasi expression dan tulis kondisi yang menggabungkan dua hal: skema <code>http</code> <b>dan</b> path berawalan <code>/admin</code>. Uji dari <code>:8080</code> dan <code>:8443</code>.</li><li>Tuliskan rencana penerapan WAF untuk aplikasi nyata (dari <code>DetectionOnly</code> sampai blokir) dalam lima langkah, beserta apa yang kamu pantau di tiap langkah.</li></ol>'
    }
  ],
  recap: [
    'Perubahan konfigurasi hanya hidup setelah <code>httpd -t</code> → <code>graceful</code>; <code>graceful-stop</code> untuk menguras koneksi sebelum berhenti, <code>restart</code> memutus koneksi.',
    'Backend lokal bisa diakses via unix socket dengan format <code>unix:/path|http://host/path</code> — hemat port &amp; latensi, asal path socket terlihat oleh kedua pihak.',
    'Mesin ekspresi (<code>&lt;If&gt;</code>, <code>Require expr</code>) menangani kondisi request yang kompleks tanpa menumpuk rewrite; pilih alat sesuai jenis masalahnya.',
    'WAF (ModSecurity/CRS) adalah lapisan tambahan di atas hardening modul inti — selalu mulai <code>DetectionOnly</code>, matikan false positive sebelum memblokir.'
  ]
});
