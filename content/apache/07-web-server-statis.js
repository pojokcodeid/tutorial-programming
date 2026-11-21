/* ============================================================
   Pelajaran Apache — 07: Web Server Statis
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'web-server-statis',
  title: 'Web Server Statis: DocumentRoot, Alias, 403/404 & SPA',
  chapter: 'Web Server Statis',
  duration: '10 menit',
  intro: [
    'Sebelum jadi gateway, Apache murni adalah <b>pembaca file</b>: menerima path dari URL, memetakannya ke disk, lalu mengirim isinya dengan Content-Type yang benar. Semua perilaku "aneh" pada website statis — daftar isi yang tiba-tiba muncul, 403 yang tak jelas, halaman lama masih tampil — berakar pada tahap pemetaan ini.',
    'Pelajaran ini membedah bagaimana <code>/gaya.css</code> berubah jadi path file, bagaimana <code>Alias</code> mengeluarkan dokumen dari DocumentRoot, kapan muncul 403 vs 404, cara mematikan daftar isi, membuat halaman error sendiri, dan menyiapkan fallback SPA tanpa mengorbankan 404 untuk aset yang hilang.'
  ],
  objectives: [
    'Menjelaskan proses pemetaan URL ke file di dalam DocumentRoot',
    'Memakai <code>Alias</code> untuk melayani path di luar DocumentRoot beserta blok Directory-nya',
    'Membedakan penyebab 403 dan 404 serta menemukannya dari log',
    'Menonaktifkan daftar isi dan membuat halaman <code>ErrorDocument</code> sendiri',
    'Menulis fallback SPA yang tetap mengembalikan 404 untuk file yang tidak ada'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dari URL ke file dan kembali</h3><ol><li>Ambil <b>path</b> dari request: <code>/docs/style.css</code>.</li><li>Gabung dengan DocumentRoot vhost: <code>/usr/local/apache2/htdocs/docs/style.css</code>.</li><li>Jalankan aturan per lokasi: <code>&lt;Location&gt;</code>, <code>RewriteRule</code>, otorisasi.</li><li>Cek keberadaan file; jika direktori dan ada <code>DirectoryIndex</code>, buka file index-nya.</li><li>Kirim isi + <code>Content-Type</code> dari <code>mime.types</code> + header lain.</li></ol><p>Dua modul menentukan langkah 4–5: <code>mod_dir</code> (index &amp; slash), <code>mod_mime</code> (ekstensi → MIME). Kegagalan sebelum langkah 5 menghasilkan <b>error</b> (403/404), bukan file yang tidak lengkap.</p><table><thead><tr><th>Kasus</th><th>Hasil</th></tr></thead><tbody><tr><td>File tidak ada</td><td><b>404</b> (kecuali tertangkap fallback/rewrite)</td></tr><tr><td>File ada, otorisasi menolak</td><td><b>403</b></td></tr><tr><td>Direktori tanpa index + <code>Options Indexes</code></td><td>Daftar isi (200) — harus dimatikan</td></tr><tr><td>Direktori tanpa index + <code>-Indexes</code></td><td><b>403</b></td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Alias: dokumen di luar DocumentRoot',
      lang: 'apache',
      output: false,
      code: `# Lab memuat ./docs ke /usr/local/apache2/docs (di luar htdocs)
Alias "/docs/" "/usr/local/apache2/docs/"

<Directory "/usr/local/apache2/docs">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

# Hasilnya:
#   /docs/         -> /usr/local/apache2/docs/index.html
#   /docs/docs.css -> /usr/local/apache2/docs/docs.css
#   /style.css     -> /usr/local/apache2/htdocs/style.css  (tetap normal)`,
      explain: [
        '<code>Alias</code> berlaku di konteks server/vhost dan diproses <b>sebelum</b> pemetaan DocumentRoot — jadi path yang sama tidak pernah "berebut" dengan file di htdocs.',
        'Karena lokasinya di luar DocumentRoot, blok <code>&lt;Directory&gt;</code> untuk path itu <b>wajib</b> menulis <code>Require all granted</code>; selain itu ia mewarisi <code>&lt;Directory /&gt;</code> yang menolak semua → 403.',
        'Trailing slash pada Alias penting: <code>/docs/</code> → <code>/usr/local/apache2/docs/</code>. Tanpa slash di keduanya, pemetaan berkas per bagian jadi tidak akurat.'
      ]
    },
    {
      type: 'example',
      title: 'Membuktikan alur statis di lab',
      lang: 'bash',
      output: true,
      code: `# 200 — ada file
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/assets/style.css

# 200 — Alias menunjuk ke luar DocumentRoot
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/docs/

# 403 — diblokir <Location "/private"> + Require all denied
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/private/
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/private/rahasia.txt

# 404 — berekstensi, tidak ada, dan tidak ikut fallback SPA
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/assets/hilang.css

# 200 — tanpa ekstensi, jatuh ke index.html (SPA fallback)
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/halaman/tentang`,
      explain: [
        'Urutan 403/404/200 ini persis yang diuji <code>scripts/test-routing.sh</code> — tiap perilaku punya bukti status code.',
        'Perhatikan pembeda fallback: path <b>berdekstensi</b> (ada titiknya) tidak boleh jatuh ke index, agar <code>/assets/hilang.css</code> tetap 404 dan error bisa terdeteksi.',
        'Karena <code>&lt;Location "/private"&gt;</code> mengevaluasi aturan otorisasi sebelum handler, <code>/private/rahasia.txt</code> tetap 403 walau filenya tidak pernah ada.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Matikan daftar isi, jangan andalkan keberuntungan</h3><p><code>Options Indexes</code> nyaman saat mengembangkan, berbahaya di produksi: ia mengungkap seluruh struktur direktori termasuk file backup (<code>config.php.bak</code>, <code>dump.sql</code>). Praktik yang benar:</p><pre><code>&lt;Directory "/usr/local/apache2/htdocs"&gt;\n    Options -Indexes FollowSymLinks\n    Require all granted\n&lt;/Directory&gt;</code></pre><p>Catatan: <code>Indexes</code> bersifat <b>menyala secara bawaan</b> di banyak distro, jadi <code>-Indexes</code> harus ditulis eksplisit. Bila kamu memang butuh daftar isi untuk folder unduhan, buat direktori khusus dengan <code>Options +Indexes</code> dan <code>Satisfy</code> yang terbatas — jangan aktifkan di root website.</p>'
    },
    {
      type: 'example',
      title: 'Halaman error sendiri (ErrorDocument)',
      lang: 'apache',
      output: false,
      code: `# Ditulis di vhost / httpd.conf
ErrorDocument 404 /errors/404.html
ErrorDocument 403 /errors/403.html
ErrorDocument 500 /errors/500.html

# Alternatif: URL eksternal (berguna bila error berasal dari backend)
# ErrorDocument 502 https://status.example.com/gateway

# Catatan:
# - path lokal harus bisa diakses (jangan jatuh ke error lagi!)
# - untuk 404, isi ErrorDocument masih dicatat sebagai 404 di log akses
# - nilai "default" mengembalikan halaman default Apache`,
      explain: [
        '<code>ErrorDocument</code> menerima path lokal (di-serve dari DocumentRoot), URL lengkap, atau teks literal.',
        'Waspadai lingkaran: halaman error yang sendirinya 404 akan membuat Apache menampilkan halaman error bawaan dengan pesan bahwa ErrorDocument-nya sendiri tidak bisa diakses.',
        'Untuk error proxy (502/504), halaman error lokal tetap berguna sebagai "wajah ramah" — log detailnya tetap ada di error log.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Fallback SPA tanpa mematikan 404</h3><p>Aplikasi frontend modern memakai banyak route (<code>/halaman/tentang</code>) yang tidak ada sebagai file. Solusinya: semua path tanpa file diarahkan ke <code>index.html</code>, dan aplikasilah yang menangani route-nya. Syaratnya: <b>request berekstensi tidak ikut fallback</b>, supaya aset yang hilang tetap 404.</p><pre><code>RewriteEngine On\n# jangan sentuh rute proxy\nRewriteCond %{REQUEST_URI}    !^/(api|app|slow)/\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule  !\\.[a-zA-Z0-9]+$  /index.html [L]</code></pre><p>Uraian tiap baris: <code>!-f</code> = file tidak ada; <code>!-d</code> = bukan direktori (agar <code>/assets/</code> tetap bisa daftar/redirect); <code>!\\.[a-zA-Z0-9]+$</code> = path tidak berakhir dengan ekstensi. Hasilnya: <code>/halaman/tentang</code> → 200 index.html, sedangkan <code>/assets/hilang.css</code> → 404.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan letakkan fallback di atas kebutuhan proxy & file',
      text: '<p>Fallback yang tertulis tanpa pengecualian akan menangkap <b>semua</b> yang tidak ada — termasuk <code>/api/</code> yang sedang diteruskan ke backend dan <code>/assets/hilang.css</code>. Gejalanya: API membalas HTML halaman utama (klien bingung), dan 404 hilang begitu saja. Urutan yang benar: pengecualian proxy dulu, baru kondisi file/direktori, baru syarat "tanpa ekstensi". Lab menerapkannya di kedua vhost HTTP dan HTTPS.</p>'
    },
    {
      type: 'tip',
      title: 'Membaca 403 dengan cepat',
      text: '<p>403 bisa berasal dari empat tempat dan tiap tempat menulis pesan berbeda di error log: (1) <code>Require all denied</code> / <code>Require ip</code> — "access denied by server configuration"; (2) permission file di disk (<code>ls -l</code> — worker berjalan sebagai <code>www-data</code>); (3) <code>Options -Indexes</code> pada direktori tanpa index; (4) nama file <code>.ht*</code> yang diblokir <code>&lt;Files ".ht*"&gt;</code>. Selalu cocokkan dengan <code>podman logs apache-lab | tail</code> sebelum menebak.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['DocumentRoot', 'Akar filesystem yang menjadi dasar pemetaan path URL.'],
        ['Alias', 'Pemetaan path URL ke lokasi file di luar DocumentRoot.'],
        ['DirectoryIndex', 'File yang dibuka saat path berakhir direktori (index.html).'],
        ['Options Indexes', 'Menampilkan daftar isi bila index tidak ada; matikan dengan -Indexes.'],
        ['403 / 404', 'Ditolak aturan akses / tidak ada di filesystem.'],
        ['ErrorDocument', 'Halaman kustom untuk status error tertentu.'],
        ['SPA fallback', 'Path tanpa file diarahkan ke index.html agar aplikasi menangani route.'],
        ['mod_dir / mod_mime', 'Modul penentu index+slash dan pemetaan ekstensi ke MIME type.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buka <code>examples/apache-lab/docs/</code> di luar container, ubah isinya, lalu refresh <code>http://localhost:8080/docs/</code> — buktikan file di luar DocumentRoot tetap terlayani lewat Alias.</li><li>Tambahkan <code>Options -Indexes</code> ke vhost app.local, akses <code>/assets/</code> (direktori tanpa index.html), dan catat statusnya sebelum &amp; sesudah perubahan.</li><li>Buat <code>web/errors/404.html</code> berisi pesan khusus, daftarkan <code>ErrorDocument 404 /errors/404.html</code>, lalu buktikan <code>/assets/hilang.css</code> menampilkan halaman barumu (status tetap 404).</li><li>Hapus satu syarat <code>RewriteCond</code> fallback pada lab dan amati dampaknya pada <code>/assets/hilang.css</code> — jelaskan syarat mana yang paling menentukan 404 tetap ada.</li></ol>'
    }
  ],
  recap: [
    'Pemetaan: path URL + DocumentRoot → cek aturan lokasi → cek file/index → isi response dengan MIME type dari <code>mime.types</code>.',
    '<code>Alias</code> melayani path di luar DocumentRoot dan <b>wajib</b> disertai blok <code>&lt;Directory&gt;</code> dengan <code>Require all granted</code>.',
    '404 = file tidak ada; 403 = ada/tidak ada tapi aturan menolak (permission, <code>Require</code>, <code>-Indexes</code>); matikan daftar isi dengan <code>Options -Indexes</code>.',
    'Fallback SPA ditulis dengan pengecualian proxy + syarat <code>!-f</code>/<code>!-d</code> + path tanpa ekstensi, agar 404 aset tetap hidup; halaman error memakai <code>ErrorDocument</code>.'
  ]
});
