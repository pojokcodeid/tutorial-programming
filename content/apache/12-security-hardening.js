/* ============================================================
   Pelajaran Apache — 12: Security Hardening
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'security-hardening',
  title: 'Security Hardening: Header, Akses, Batas & Perlindungan',
  chapter: 'Security Hardening',
  duration: '12 menit',
  intro: [
    'Web server adalah pintu depan — dan pintu depan yang longgar membuat semua pengaman di belakangnya tak berguna. Kabar baiknya: sebagian besar celah yang sering dieksploitasi pada Apache bukanlah 0-day, melainkan konfigurasi default yang dibiarkan: daftar isi terbuka, header Server membocorkan versi, <code>/server-status</code> terbuka untuk dunia, atau file <code>.env</code> bisa diunduh publik.',
    'Pelajaran ini menyusun checklist hardening berlapis: menyembunyikan identitas, membatasi akses per IP/halaman, memasang security header, membatasi ukuran & kecepatan request, menutup file sensitif, sampai memverifikasi semuanya lewat lab — termasuk membuktikan setiap lapisan benar-benar menolak ketika seharusnya menolak.'
  ],
  objectives: [
    'Menyembunyikan identitas server dengan <code>ServerTokens</code> dan <code>ServerSignature</code>',
    'Menerapkan security header wajib beserta alasan masing-masing',
    'Membatasi akses lokasi tertentu ke IP/jaringan tertentu dengan <code>Require</code>',
    'Membatasi ukuran upload, kecepatan koneksi, dan metode HTTP',
    'Menutup file sensitif dan halaman internal, lalu memverifikasinya dengan curl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Prinsip: batasi, sembunyikan, buktikan</h3><p>Tiga langkah berulang di seluruh hardening:</p><ol><li><b>Batasi</b> — hanya izinkan yang memang dibutuhkan (default menolak, bukan default mengizinkan).</li><li><b>Sembunyikan</b> — jangan bantu penyerang memetakan teknologi dan versi kamu.</li><li><b>Buktikan</b> — setiap aturan diuji dengan request yang seharusnya <i>ditolak</i>. Aturan yang tidak pernah diuji sama saja dengan tidak ada.</li></ol><p>Peringatan penting: hardening bukan pengganti update. Apache 2.4 yang tertinggal jauh di belakang versi stabil tetap membawa kerentanan inti yang tak bisa ditambal konfigurasi — <code>httpd -v</code> harus kamu cek berkala.</p>'
    },
    {
      type: 'example',
      title: 'Sembunyikan identitas server',
      lang: 'apache',
      output: false,
      code: `# httpd.conf (global)
ServerTokens Prod        # "Server: Apache"  (bukan "Apache/2.4.71 (Unix) OpenSSL/...")
ServerSignature Off      # hapus baris versi di halaman error

# Bukti sebelum/sesudah:
# sebelum: Server: Apache/2.4.71 (Unix)
# sesudah : Server: Apache

# Uji
curl -sI http://localhost:8080/ | grep -i '^server:'`,
      explain: [
        '<code>ServerTokens Prod</code> adalah pilihan paling hemat: tetap menyebut Apache (wajar), tapi tanpa versi, OS, dan modul — penyerang tidak bisa langsung memetakan exploit versi itu.',
        'Alternatif <code>Full</code>/<code>Minor</code>/<code>OS</code> justru memberi informasi lengkap ke publik. Nilai <code>Prod</code> adalah rekomendasi keamanan resmi Apache.',
        '<code>ServerSignature Off</code> menyangkut baris penanda di halaman error/daftar isi — keduanya melengkapi, tidak saling menggantikan.'
      ]
    },
    {
      type: 'example',
      title: 'Security header wajib',
      lang: 'apache',
      output: false,
      code: `# snippets/security-headers.conf (dipakai semua vhost lab)
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'"
# HTTPS saja:
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# Uji
curl -sI http://localhost:8080/ | grep -Ei 'x-content|x-frame|referrer'`,
      explain: [
        '<b>nosniff</b> — larang browser menebak-nebak jenis file; menutup jalur MIME-sniffing jadi XSS.',
        '<b>X-Frame-Options / frame-ancestors</b> — cegah situs lain membingkai halamanmu (clickjacking).',
        '<b>Referrer-Policy</b> — jaga agar URL internal tidak bocor ke situs lain lewat header Referer.',
        '<b>CSP</b> — batasi sumber skrip/gaya yang boleh dimuat; untuk website statis lab, <code>default-src \'self\'</code> sudah memadai dan langsung menandai pelanggaran di console browser.',
        'Selalu pakai <code>Header always set</code> agar ikut terkirim pada response error — justru saat itulah proteksi paling dibutuhkan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membatasi akses: sintaks Require</h3><p>Apache 2.4 memakai satu sintaks seragam untuk otorisasi (pengganti <code>Allow</code>/<code>Deny</code>/<code>Satisfy</code> lawas):</p><table><thead><tr><th>Direktif</th><th>Arti</th></tr></thead><tbody><tr><td><code>Require all granted</code> / <code>all denied</code></td><td>Izinkan / tolak semua</td></tr><tr><td><code>Require ip 10.0.0.0/8</code></td><td>Hanya dari rentang IP itu</td></tr><tr><td><code>Require host internal.example.com</code></td><td>Hostname yang di-resolve balik (hati-hati, bisa dipalsukan lewat header Host? tidak — ini reverse DNS klien)</td></tr><tr><td><code>Require valid-user</code></td><td>Siapa pun yang berhasil login (butuh AuthType)</td></tr><tr><td><code>Require expr ...</code></td><td>Kondisi ekspresi, mis. tolak bila User-Agent kosong</td></tr></tbody></table><p>Beberapa aturan <code>Require</code> digabung dalam satu konteks = <b>OR</b>; memisahkannya ke blok <code>&lt;RequireAll&gt;</code> = <b>AND</b>. Lab memakainya untuk <code>/private/</code> (ditolak semua) dan <code>/server-status</code> (harus dibatasi di produksi).</p>'
    },
    {
      type: 'example',
      title: 'Basic Authentication: htpasswd & Require valid-user',
      lang: 'apache',
      output: false,
      code: `# 1. Buat file pengguna (bisa dari host: htpasswd -cB .htpasswd admin,
#    lalu salin ke lab — atau langsung di dalam container)
podman exec apache-lab /usr/local/apache2/bin/htpasswd -cB /usr/local/apache2/conf/.htpasswd admin
# ikuti prompt-nya; -B = hash bcrypt

# 2. Amankan satu direktori
<Directory "/usr/local/apache2/htdocs/admin">
    AuthType Basic
    AuthName "Area Terbatas"
    AuthUserFile "/usr/local/apache2/conf/.htpasswd"
    Require valid-user
</Directory>

# 3. Uji
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/admin/
# 401 Unauthorized (tanpa kredensial)
curl -s -o /dev/null -w '%{http_code}\\n' -u admin:password123 http://localhost:8080/admin/
# 200 (dengan kredensial)`,
      explain: [
        '<code>401</code> berarti "otentikasi diperlukan" (server minta kredensial); <code>403</code> berarti "kredensial ada, tapi tidak diizinkan" — membedakan keduanya mempercepat diagnosis.',
        'Basic auth mengirim kredensial yang hanya di-<b>base64</b> (bukan enkripsi) — tanpa HTTPS, siapa pun di jaringan bisa membacanya. Karena itu di produksi selalu pasangkan dengan TLS (Pelajaran 11).',
        'File <code>.htpasswd</code> jangan diletakkan di dalam DocumentRoot, dan beri permission ketat; <code>-B</code> memakai bcrypt agar hash-nya tidak mudah dibobol offline.'
      ]
    },
    {
      type: 'example',
      title: 'Membuktikan lapisan akses di lab',
      lang: 'bash',
      output: true,
      code: `# 1. /private/ ditolak total -> 403
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/private/
# 403

# 2. Batasi /server-status hanya dari jaringan lokal (di status.conf)
#    <Location "/server-status">
#        SetHandler server-status
#        Require ip 127.0.0.1 ::1
#    </Location>
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/server-status
# 200 dari localhost — uji dari IP lain (mis. lewat container) -> 403

# 3. File sensitif tidak pernah tersaji
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/.htaccess
# 403 (blok <Files ".ht*">)`,
      explain: [
        'Lab membiarkan <code>/server-status</code> terbuka agar bisa dipelajari; pada <code>apache/extra/status.conf</code> ada komentar berisi konfigurasi pembatasan yang <b>wajib</b> kamu aktifkan bila lab ini dipakai di jaringan bersama.',
        '<code>Require ip</code> menilai IP sumber koneksi — bila di depannya ada proxy lain, yang terlihat justru IP proxy itu. Untuk kasus nyata, pertimbangkan <code>mod_remoteip</code>.',
        'Blok <code>&lt;Files ".ht*"&gt;</code> bawaan melindungi seluruh file .htaccess/.htpasswd di mana pun lokasinya — jangan dihapus.'
      ]
    },
    {
      type: 'example',
      title: 'Membatasi ukuran, kecepatan, dan metode',
      lang: 'apache',
      output: false,
      code: `# Lab: tolak body lebih dari 1 MB pada rute API (snippets/proxy-routes.conf)
<Location "/api/">
    LimitRequestBody 1048576
</Location>

# Uji: body 2 MB harus ditolak
head -c 2097152 /dev/zero | curl -s -o /dev/null -w '%{http_code}\\n' \\
  --data-binary @- http://localhost:8080/api/
# 413 Request Entity Too Large

# Metode yang tidak dipakai: ditolak 405
<LimitExcept GET POST>
    Require all denied
</LimitExcept>

# Perlambat unduhan besar per koneksi (mod_ratelimit)
<Directory "/usr/local/apache2/htdocs/downloads">
    SetOutputFilter RATE-LIMIT
    LimitRate 500k
</Directory>`,
      explain: [
        '<code>LimitRequestBody</code> mencegah satu klien menghabiskan disk/CPU untuk upload raksasa; nilainya dalam byte dan bisa dipasang per Directory/Location/vhost.',
        '<code>&lt;LimitExcept&gt;</code> menutup method yang tidak perlu (TRACE sering dimatikan karena rawan XST).',
        '<code>LimitRate</code> menjaga satu koneksi unduhan besar tidak menelan seluruh lebar pita — ini keamanan daya tahan, bukan sekadar kenyamanan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menutup file &amp; endpoint sensitif</h3><ul><li><b>File backup dan sumber</b>: <code>.env</code>, <code>*.bak</code>, <code>*.sql</code>, <code>.git/</code> — blokir via <code>&lt;FilesMatch&gt;</code> atau aturan rewrite <code>RewriteRule \\.(env|bak|sql)$ - [F,L]</code> (Pelajaran 08).</li><li><b>Endpoint internal</b>: <code>/server-info</code> memperlihatkan seluruh peta konfigurasi; di produksi <code>Require ip</code> ketat atau matikan sama sekali.</li><li><b>Daftar isi</b>: <code>Options -Indexes</code> — bocornya struktur direktori sering menjadi langkah pertama penyerangan.</li><li><b>Permission proses worker</b>: worker berjalan sebagai user rendah; file sensitif jangan pernah berada di dalam DocumentRoot.</li><li><b>Konfigurasi &amp; key</b>: beri permission ketat di disk (600 untuk <code>*.key</code>), karena siapa pun yang bisa membaca key bisa memimpin dirinya sebagai server kamu.</li></ul><pre><code>&lt;FilesMatch "^\\.(env|git|ht)"&gt;\n    Require all denied\n&lt;/FilesMatch&gt;\n\nRedirectMatch 404 "^/\\.git/"</code></pre>'
    },
    {
      type: 'example',
      title: 'Checklist verifikasi hardening',
      lang: 'bash',
      output: false,
      code: `# Semua baris ini harus memberi hasil yang diharapkan:
curl -sI http://localhost:8080/ | grep -i '^server:'            # Apache (tanpa versi)
curl -sI http://localhost:8080/ | grep -i x-content-type        # nosniff
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/private/          # 403
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/assets/           # 403 (tanpa Indexes)
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/.env              # 404/403
head -c 2097152 /dev/zero | curl -s -o /dev/null -w '%{http_code}\\n' \\
  --data-binary @- http://localhost:8080/api/                    # 413
podman exec apache-lab httpd -M | grep -c module                # hanya modul terpakai`,
      explain: [
        'Simpan daftar ini sebagai skrip — di dunia nyata, checklist verifikasi inilah yang dijalankan setelah setiap perubahan konfigurasi (pola yang sama dengan <code>scripts/test-routing.sh</code>).',
        'Perhatikan: setiap baris menguji <i>penolakan</i>. Uji yang hanya memastikan halaman tampil tidak pernah menangkap konfigurasi keamanan yang terlepas.'
      ]
    },
    {
      type: 'warn',
      title: 'Dua kesalahan hardening yang justru membahayakan',
      text: '<p>(1) <b>Memblokir terlalu luas</b> — mis. <code>Require ip 127.0.0.1</code> pada rute yang juga diakses proxy internal, lalu trafik produksi berhenti tanpa pesan jelas (gejalanya: 403 mendadak pada endpoint tertentu). Selalu uji jalur akses yang sah sebelum meninggalkan konfigurasi. (2) <b>HSTS + includeSubDomains tergesa-gesa</b> — sekali browser mengunci domain, mencabutnya butuh waktu max-age penuh. Turunkan dulu ke max-age pendek, uji semua subdomain, baru naikkan.</p>'
    },
    {
      type: 'tip',
      title: 'Hardening bertahap, satu lapis per perubahan',
      text: '<p>Jangan menyalin seluruh "hardening config" internet sekaligus. Setiap lapis berpotensi memutus sesuatu (upload besar jadi 413, frame embed jadi blank, IP baru jadi 403). Terapkan per lapis, jalankan <code>httpd -t</code> + <code>graceful</code>, uji bukti penolakannya, barulah lanjut. Bila suatu saat terjadi insiden, kamu akan tahu lapis mana yang menutup jalur penyerangan — dan lapis mana yang perlu diperbaiki.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['ServerTokens', 'Mengatur jumlah informasi versi pada header Server; Prod = paling minim.'],
        ['Security header', 'Header respons yang memperketat perilaku client (nosniff, frame, CSP, HSTS).'],
        ['CSP', 'Content-Security-Policy — membatasi sumber konten yang boleh dimuat halaman.'],
        ['Require', 'Sintaks otorisasi Apache 2.4 (all/ip/host/expr/valid-user).'],
        ['RequireAll / RequireAny', 'Menggabungkan syarat dengan AND / OR.'],
        ['LimitRequestBody', 'Batas ukuran body request dalam byte.'],
        ['LimitExcept', 'Menerapkan aturan hanya untuk metode HTTP tertentu (atau kebalikannya).'],
        ['LimitRate', 'Membatasi kecepatan transfer per koneksi (mod_ratelimit).'],
        ['mod_remoteip', 'Membaca IP asli dari header proxy tepercaya di depan Apache.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan seluruh checklist verifikasi di atas pada lab dan catat hasilnya — perbaiki bila ada yang tidak sesuai (mis. daftar isi masih terbuka).</li><li>Batasi <code>/server-status</code> dengan <code>Require ip 127.0.0.1</code>, lalu buktikan tolakannya dengan mengaksesnya dari container lain (<code>podman exec backend-1 wget -qO- http://apache-lab:8080/server-status</code> — harus ditolak).</li><li>Tulis aturan <code>Header always set Content-Security-Policy</code> yang melarang skrip inline, lalu buka lab di browser dan amati console — jelaskan apa yang berubah dan kenapa <code>always</code> penting.</li><li>Turunkan <code>LimitRequestBody</code> ke <code>1024</code>, uji dengan body 2 KB, lalu kembalikan — pastikan kamu memahami angka byte yang harus ditulis untuk 1 MB, 5 MB.</li></ol>'
    }
  ],
  recap: [
    'Hardening = batasi (default tolak), sembunyikan (ServerTokens Prod), buktikan (uji setiap penolakan).',
    '<code>ServerTokens Prod</code> + <code>ServerSignature Off</code> menghapus jejak versi; security header (nosniff, frame, Referrer-Policy, CSP, HSTS) dipasang dengan <code>Header always set</code>.',
    'Otorisasi Apache 2.4 memakai <code>Require</code> — <code>all/ip/host/expr/valid-user</code>, digabung OR di konteks biasa atau AND di <code>&lt;RequireAll&gt;</code>.',
    'Batas daya tahan: <code>LimitRequestBody</code> (413), <code>&lt;LimitExcept&gt;</code> (metode), <code>LimitRate</code> (kecepatan); endpoint internal dan file sensitif ditutup — semua diverifikasi dengan skrip uji.'
  ]
});
