/* ============================================================
   Pelajaran Apache — 08: URL Rewrite, Redirect & .htaccess
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'rewrite-redirect',
  title: 'URL Rewrite, Redirect & .htaccess (mod_rewrite)',
  chapter: 'Routing',
  duration: '10 menit',
  intro: [
    'URL yang baik tidak membocorkan isi proyek: <code>/produk/kaos-merah</code> lebih enak dibaca daripada <code>/detail.php?id=88&amp;kategori=3</code>. Namun file kedua itulah yang nyata di disk. Di sinilah <b>rewrite</b> bekerja: mengubah URL yang diketik user menjadi resource yang benar, tanpa user tahu.',
    'Ada dua alat yang sering tertukar: <code>Redirect</code> (mod_alias) <i>selalu</i> membalas 3xx ke client, sedangkan <code>RewriteRule</code> (mod_rewrite) bisa mengubah request secara <b>internal</b> atau juga membalas 3xx. Pelajaran ini membedah keduanya, sintaks kondisi &amp; regex, query string, sampai menulis aturan di <code>.htaccess</code> untuk pola front controller.'
  ],
  objectives: [
    'Membedakan <code>Redirect</code> (mod_alias) dan <code>RewriteRule</code> (mod_rewrite) beserta kapan memakai masing-masing',
    'Menulis <code>RewriteCond</code> + <code>RewriteRule</code> dengan flag <code>R</code>, <code>L</code>, dan <code>QSA</code>',
    'Membedakan redirect permanen (301) dan sementara (302/307) serta dampaknya pada browser &amp; SEO',
    'Mengaktifkan rewrite di <code>.htaccess</code> dan menjelaskan syarat <code>AllowOverride</code> serta <code>RewriteBase</code>',
    'Menerapkan pola front controller tanpa mengorbankan file yang benar-benar ada'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua alat, dua sifat</h3><table><thead><tr><th></th><th><code>Redirect</code> (mod_alias)</th><th><code>RewriteRule</code> (mod_rewrite)</th></tr></thead><tbody><tr><td>Balasan ke client</td><td>Selalu 3xx + header Location</td><td>Bisa internal (tanpa 3xx) atau 3xx</td></tr><tr><td>Cocok terhadap</td><td>Awalan path (prefix)</td><td>Regex pada path (dan query via <code>%{QUERY_STRING}</code>)</td></tr><tr><td>Kondisi</td><td>Tidak ada</td><td><code>RewriteCond</code> berulang, diuji berurutan</td></tr><tr><td>Kinerja</td><td>Sangat ringan</td><td>Ringan, tapi tiap aturan dievaluasi per request</td></tr><tr><td>Cocok untuk</td><td>Alih sederhana: HTTP→HTTPS, domain lama, /old → /new</td><td>Rewrite kompleks, routing app, fallback, pemblokiran</td></tr></tbody></table><p>Prinsip pemakaian: <b>untuk kebutuhan sederhana, pakai <code>Redirect</code></b> — lebih sedikit yang bisa salah. Naik ke <code>RewriteRule</code> ketika butuh kondisi atau transformasi internal.</p>'
    },
    {
      type: 'example',
      title: 'Redirect permanen vs sementara',
      lang: 'apache',
      output: false,
      code: `# mod_alias — redirect 301 (permanen) dengan path disisipkan otomatis
Redirect permanent /old https://example.com/new
# GET /old/a/b  ->  301  Location: https://example.com/new/a/b

# 302/307 sementara (untuk maintenance / A-B test)
Redirect temp /promo /index.html

# Paksa seluruh trafik port 8081 ke HTTPS (dipakai lab)
<VirtualHost *:8081>
    ServerName app.local
    Redirect permanent / "https://localhost:8443/"
</VirtualHost>

# Equivalent dengan rewrite (untuk aturan lebih rumit)
RewriteEngine On
RewriteRule ^(.*)$ https://localhost:8443/$1 [R=301,L,NE]`,
      explain: [
        '<b>301 permanen</b> disimpan browser/CDN — mengembalikannya ke HTTP di kemudian hari jadi sulit. Pastikan tujuannya sudah final sebelum memakai 301.',
        'Sintaks <code>Redirect [permanent|temp] daftar path tujuan</code>: bagian path setelah daftar otomatis disisipkan ke tujuan, sehingga <code>/redirect/selanjutnya</code> menjadi <code>https://.../redirect/selanjutnya</code>.',
        'Flag pada rewrite: <code>R=301</code> = balas redirect, <code>L</code> = berhenti, <code>NE</code> = jangan encode karakter khusus (penting untuk anchor <code>#</code>).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anatomi RewriteCond + RewriteRule</h3><pre><code>RewriteEngine On\n\n# kondisi diuji BERURUTAN; satu saja gagal = aturan dilewati\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule !\\.[a-zA-Z0-9]+$ /index.html [L]</code></pre><table><thead><tr><th>Bagian</th><th>Arti</th></tr></thead><tbody><tr><td><code>%{REQUEST_FILENAME}</code></td><td>Path lengkap file yang dituju (DocumentRoot + path)</td></tr><tr><td><code>!-f</code> / <code>!-d</code></td><td>Negasi: file <i>tidak</i> ada / bukan direktori</td></tr><tr><td>Pola <code>!\\.[a-zA-Z0-9]+$</code></td><td>Path tidak berakhir dengan titik+ekstensi</td></tr><tr><td>Substitusi <code>/index.html</code></td><td>URL internal baru (di-proses ulang dari awal)</td></tr></tbody></table><p>Kumpulan tes yang sering dipakai: <code>-f</code> file ada, <code>-d</code> direktori ada, <code>-s</code> file ada &amp; tidak kosong, <code>^https?://</code> sudah URL lengkap, <code>^/maintenance</code> path berawalan itu, serta <code>%{HTTP_HOST}</code> untuk membedakan domain.</p>'
    },
    {
      type: 'example',
      title: 'Rewrite internal vs eksternal, dan query string',
      lang: 'apache',
      output: false,
      code: `# 1. INTERNAL — client tidak tahu, status tetap 200
RewriteRule ^users/([0-9]+)$ /user.php?id=$1 [L]
# GET /users/100  ->  internal ke /user.php?id=100  ->  200 OK

# 2. EKSTERNAL — client menerima 3xx dan mengambil URL baru
RewriteRule ^product/(.*)$ /p/$1 [R=301,L]

# 3. QSA — pertahankan query string asli
RewriteRule ^search$ /hasil.php [L,QSA]
# /search?q=baju  ->  /hasil.php?q=baju   (tanpa QSA, q= hilang)

# 4. Memblokir file berbahaya dengan balasan 403
RewriteRule \\.(env|bak|sql|git) - [F,L]
# tanda "-" = tidak mengubah URL; flag F = 403 Forbidden`,
      explain: [
        'Kunci membedakan: aturan <b>internal</b> menghasilkan status 200 dengan resource lain; aturan <b>eksternal</b> selalu 301/302 dan klien memanggil ulang.',
        '<code>QSA</code> (Query String Append) wajib bila aturanmu menulis query sendiri tetapi query asli juga harus selamat.',
        'Tanda ganti <code>-</code> berarti "biarkan URL apa adanya" — dipadukan dengan <code>F</code> untuk memblokir, atau <code>N</code>/<code>END</code> untuk aksi lain.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Front controller: satu pintu untuk semua route</h3><p>Pola ini dipakai Laravel, Symfony, React build produksi, dsb. Semua path yang tidak menunjuk file nyata diserahkan ke satu file pembuka:</p><pre><code>RewriteEngine On\nRewriteCond %{REQUEST_URI}    !^/(api|app|static)/\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule .* /index.php [L]</code></pre><p>Yang membuat pola ini <b>tidak</b> merusak kebiasaan web: pengecualian proxy (agar <code>/api/</code> tetap ke backend), <code>!-f</code> (agar file yang ada tetap dilayani apa adanya), dan syarat tanpa ekstensi (agar <code>/css/hilang.css</code> tetap 404 — lihat Pelajaran 07).</p><p>Di versi per-dir (<code>.htaccess</code>), substitusi jadi relatif: <code>RewriteRule .* index.php [L]</code> (tanpa <code>/</code> di depan) karena konteksnya sudah berada di dalam direktori itu.</p>'
    },
    {
      type: 'example',
      title: 'Rewrite di .htaccess dan syaratnya',
      lang: 'bash',
      output: false,
      code: `# /usr/local/apache2/htdocs/.htaccess  (lab: AllowOverride All)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule .* /index.html [L]
</IfModule>

# Uji: tanpa restart, .htaccess langsung terbaca pada request berikutnya
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/halaman/tentang`,
      explain: [
        '<code>&lt;IfModule mod_rewrite.c&gt;</code> membuat file tetap valid walau modul rewrite tidak dimuat — berguna untuk hosting yang tidak kamu kendalikan.',
        '<code>RewriteBase /</code> diperlukan bila direktori disajikan dari URL berbeda dari lokasi fisiknya; tanpa itu, redirect internal bisa salah menempel.',
        'Syarat wajib: <code>AllowOverride FileInfo</code> (atau All) di blok <code>&lt;Directory&gt;</code> untuk direktori itu. Bila <code>AllowOverride None</code>, file .htaccess <b>diam-diam diabaikan</b> — tidak ada error, hanya perilaku yang berubah.'
      ]
    },
    {
      type: 'warn',
      title: 'Performa .htaccess dan risiko rewrite yang salah',
      text: '<p>Pertama, <code>.htaccess</code> dibaca pada <b>tiap request, tiap direktori yang dilewati</b>. Untuk trafik besar, pindahkan aturannya ke konfigurasi utama lalu set <code>AllowOverride None</code>. Kedua, aturan rewrite yang menangkap terlalu luas bisa membuat <i>loop</i>: <code>/a</code> → <code>/b</code> → <code>/a</code> → ... Apache menghentikannya dengan error 500 "rewrite rule with maximum internal redirects" — pesan itu di error log menandakan aturanmu saling menangkap.</p>'
    },
    {
      type: 'tip',
      title: 'Pilih mod_rewrite atau mod_alias dari bentuk masalahnya',
      text: '<p>Tes cepatnya: kalau yang kamu tulis hanya "path ini pindah ke sana", pakai <code>Redirect</code>. Kalau ada "jika memenuhi syarat ini, ubah jadi begitu tanpa memberi tahu client", pakai <code>RewriteRule</code>. Hindari mencampur keduanya pada daftar path yang sama dalam satu konteks — <code>Redirect</code> dievaluasi lebih dulu pada beberapa versi dan bisa memotong aturan rewrite-nya. Pada lab, redirect 8081 memakai mod_alias sementara fallback SPA memakai mod_rewrite, keduanya pada port berbeda sehingga tidak bertabrakan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['mod_rewrite', 'Modul rewrite berbasis regex dengan kondisi; bisa internal maupun 3xx.'],
        ['mod_alias', 'Modul pemetaan &amp; redirect sederhana (<code>Alias</code>, <code>Redirect</code>).'],
        ['RewriteCond', 'Syarat yang harus terpenuhi agar RewriteRule di bawahnya dijalankan.'],
        ['Flag [L]', 'Berhenti memproses aturan rewrite setelah aturan ini cocok.'],
        ['Flag [R=301]', 'Balas redirect permanen ke client.'],
        ['QSA', 'Query String Append — query asli disertakan pada URL hasil.'],
        ['RewriteBase', 'Basis path untuk substitusi relatif di direktori tertentu.'],
        ['Front controller', 'Satu file pembuka melayani semua route aplikasi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat <code>Redirect permanent /lama /barus</code> pada vhost lab, lalu buktikan dengan <code>curl -sI http://localhost:8080/lama</code> — catat status dan header <code>Location</code>-nya.</li><li>Tulis aturan internal <code>RewriteRule ^produk/([0-9]+)$ /index.php?id=$1 [L]</code> (file index.php boleh berisi <code>&lt;?php echo $_GET["id"]; ?&gt;</code> atau cukup teks), lalu pastikan statusnya tetap <b>200</b> — bedakan dengan kasus nomor 1.</li><li>Aktifkan <code>.htaccess</code> di <code>web/</code>, buktikan fallback berfungsi tanpa reload, lalu ubah vhost ke <code>AllowOverride None</code> dan perhatikan apa yang berubah — jelaskan kenapa tidak ada error yang muncul.</li><li>Tambahkan aturan blokir <code>\\.(env|bak)$ - [F,L]</code>, buat file <code>web/.env</code>, dan buktikan aksesnya membalas 403.</li></ol>'
    }
  ],
  recap: [
    '<code>Redirect</code> (mod_alias) selalu membalas 3xx dan cocok untuk alih sederhana; <code>RewriteRule</code> (mod_rewrite) memberi kondisi dan bisa mengubah request <b>internal</b> tanpa diketahui client.',
    '301 permanen disimpan browser/CDN — pakai hanya untuk tujuan final; 302/307 untuk sementara.',
    'Kombinasi wajib front controller: pengecualian proxy → <code>!-f</code> → <code>!-d</code> → syarat tanpa ekstensi → substitusi ke index.',
    '<code>.htaccess</code> butuh <code>AllowOverride FileInfo/All</code>, diam-diam diabaikan bila None, lebih lambat dari konfigurasi utama, dan bisa memicu loop rewrite (500).'
  ]
});
