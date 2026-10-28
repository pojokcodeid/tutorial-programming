/* ============================================================
   Pelajaran HTTP — Bab 12: HTTPS, TLS, dan Sertifikat
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'https-tls',
  title: 'HTTPS, TLS, dan Sertifikat',
  chapter: 'Keamanan & Transport',
  duration: '14–16 menit',
  intro: [
    'HTTP mengirim pesan dalam bentuk yang bisa dibaca siapa pun yang berada di jalur yang sama. Di jaringan rumah mungkin tidak terasa, tetapi di Wi-Fi publik, jaringan kantor, atau jalur internet, pesan itu melewati banyak perangkat. <b>HTTPS</b> menutup celah tersebut dengan menjalankan HTTP di dalam koneksi <b>TLS</b>.',
    'TLS memberikan tiga hal: <b>kerahasiaan</b> melalui enkripsi, <b>integritas</b> agar pesan tidak diubah diam-diam, dan <b>autentikasi server</b> melalui sertifikat. TLS tidak membuat aplikasi otomatis aman; ia melindungi jalur komunikasi, bukan menggantikan validasi input, otorisasi, atau perlindungan terhadap XSS.',
    'Bab ini membedah sertifikat, certificate chain, hostname verification, masa berlaku, dan HSTS. Kita akan menjalankan lab dalam mode HTTPS dengan sertifikat self-signed, lalu memeriksa mengapa <code>curl</code> menolak sertifikat tersebut sebelum kita menambahkan pengecualian khusus untuk latihan.'
  ],
  objectives: [
    'Menjelaskan apa yang dilindungi dan tidak dilindungi oleh TLS',
    'Membaca informasi sertifikat dan certificate chain pada koneksi HTTPS',
    'Menjalankan lab HTTPS lokal dengan sertifikat self-signed',
    'Memahami HSTS, redirect HTTP ke HTTPS, dan terminasi TLS di proxy'
  ],
  sections: [
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Tahapan TLS handshake sebelum HTTP dikirim">
        <rect x="24" y="120" width="150" height="80" rx="10" class="u-box"/>
        <text x="99" y="150" class="u-title" text-anchor="middle">Client</text>
        <text x="99" y="173" class="u-lbl" text-anchor="middle">browser / curl</text>

        <rect x="560" y="120" width="170" height="80" rx="10" class="u-box"/>
        <text x="645" y="150" class="u-title" text-anchor="middle">Server</text>
        <text x="645" y="173" class="u-lbl" text-anchor="middle">sertifikat + private key</text>

        <line x1="180" y1="136" x2="552" y2="136" class="u-line"/>
        <text x="366" y="126" class="u-lbl" text-anchor="middle">1 · Client Hello: versi TLS, cipher suite, SNI</text>

        <line x1="552" y1="162" x2="180" y2="162" class="u-line"/>
        <text x="366" y="184" class="u-lbl" text-anchor="middle">2 · Server Hello + sertifikat + chain</text>

        <line x1="180" y1="210" x2="552" y2="210" class="u-line"/>
        <text x="366" y="232" class="u-lbl" text-anchor="middle">3 · Verifikasi hostname, masa berlaku, dan rantai ke CA tepercaya</text>

        <line x1="180" y1="258" x2="552" y2="258" class="u-line"/>
        <text x="366" y="280" class="u-lbl" text-anchor="middle">4 · Kunci sesi disepakati, lalu HTTP dienkripsi</text>

        <text x="380" y="322" class="u-lbl" text-anchor="middle">Jika verifikasi gagal, client menolak koneksi sebelum HTTP dikirim</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — TLS memverifikasi server dan menyepakati kunci sebelum HTTP berjalan</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Apa yang Dilindungi TLS</h3><table><thead><tr><th>Aspek</th><th>Dilindungi?</th><th>Penjelasan</th></tr></thead><tbody><tr><td>Isi request dan response</td><td>Ya</td><td>Header dan body dienkripsi selama transit.</td></tr><tr><td>Integritas data</td><td>Ya</td><td>Perubahan di tengah jalan terdeteksi.</td></tr><tr><td>Identitas server</td><td>Ya, jika sertifikat valid</td><td>Client memeriksa nama host dan rantai sertifikat.</td></tr><tr><td>Identitas client</td><td>Tidak otomatis</td><td>Butuh autentikasi tambahan seperti token atau mTLS.</td></tr><tr><td>Keamanan aplikasi</td><td>Tidak</td><td>XSS, SQL injection, dan otorisasi tetap harus ditangani aplikasi.</td></tr><tr><td>Metadata koneksi</td><td>Sebagian</td><td>Alamat IP dan ukuran trafik masih bisa terlihat.</td></tr></tbody></table><p>Jadi, HTTPS melindungi <b>jalur</b>. Ia tidak memvalidasi input, tidak menentukan siapa yang boleh menghapus data, dan tidak mencegah aplikasi mencatat token ke log.</p>'
    },
    {
      type: 'text',
      html: '<h3>Sertifikat dan Rantai Kepercayaan</h3><p>Sertifikat mengikat nama host ke public key. Browser tidak mempercayai sertifikat begitu saja; ia memeriksa apakah sertifikat ditandatangani oleh <b>certificate authority</b> (CA) yang ada di trust store, apakah nama host cocok, apakah masa berlakunya masih valid, dan apakah rantainya lengkap.</p><ul><li><b>Hostname verification</b> — sertifikat untuk <code>api.example.com</code> tidak otomatis berlaku untuk <code>www.example.com</code>.</li><li><b>Certificate chain</b> — server harus mengirim sertifikat leaf dan intermediate yang diperlukan. Root CA biasanya sudah ada di sistem client.</li><li><b>Expiry</b> — sertifikat kedaluwarsa membuat koneksi ditolak, meskipun private key masih benar.</li><li><b>Self-signed</b> — ditandatangani oleh dirinya sendiri, sehingga tidak dipercaya sistem kecuali ditambahkan manual. Cocok untuk latihan, bukan produksi.</li></ul>'
    },
    {
      type: 'example',
      title: 'Menyiapkan Sertifikat Lokal dan Menjalankan HTTPS',
      lang: 'bash',
      output: false,
      code: `# Buat folder sertifikat
mkdir -p examples/http-lab/certs

# Buat sertifikat self-signed untuk localhost
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \\
  -keyout examples/http-lab/certs/localhost-key.pem \\
  -out examples/http-lab/certs/localhost-cert.pem \\
  -subj '/CN=localhost'

# Jalankan lab dalam mode HTTPS di port terpisah
PORT=8443 node examples/http-lab/server.js --https

# Di terminal lain: curl akan menolak karena sertifikat tidak tepercaya
curl -v https://localhost:8443/health

# Untuk latihan saja, izinkan sertifikat self-signed
curl -k -i https://localhost:8443/health

# Periksa detail sertifikat
openssl s_client -connect localhost:8443 -servername localhost`,
      explain: [
        'Sertifikat self-signed tidak ditandatangani CA tepercaya, sehingga client menolak koneksi sebelum request HTTP dikirim. Ini perilaku benar, bukan bug.',
        'Flag <code>-k</code> mematikan verifikasi sertifikat. Jangan membiasakan opsi ini di lingkungan nyata karena membuka peluang man-in-the-middle.',
        'Opsi <code>s_client</code> menampilkan subject, issuer, masa berlaku, dan chain. Perhatikan bahwa issuer dan subject sama pada sertifikat self-signed.'
      ]
    },
    {
      type: 'example',
      title: 'HSTS dan Redirect ke HTTPS',
      lang: 'bash',
      output: false,
      code: `# Di server HTTPS lab, periksa header HSTS
curl -k -sI https://localhost:8443/health | grep -i strict-transport-security

# Perilaku redirect yang umum di produksi:
# HTTP :80  -> 301/308 ke https://...
# Lalu HTTPS menambahkan HSTS agar browser tidak kembali ke HTTP.
#
# Contoh konfigurasi konseptual di reverse proxy:
# listen 80;
# return 308 https://$host$request_uri;
#
# listen 443 ssl;
# add_header Strict-Transport-Security "max-age=31536000" always;

# Cek protokol dan TLS pada situs nyata
curl -v https://example.com 2>&1 | grep -E 'SSL connection|TLS|subject|expire'`,

      explain: [
        'HSTS (<code>Strict-Transport-Security</code>) memerintahkan browser memakai HTTPS untuk waktu tertentu, sehingga redirect HTTP tidak perlu terjadi berulang.',
        'Redirect <code>308</code> mempertahankan method dan body, berbeda dengan <code>301</code>/<code>302</code> yang secara historis dapat mengubah method pada client lama.',
        'HSTS hanya efektif setelah browser pernah menerima header melalui HTTPS yang valid. Jangan mengaktifkan masa berlaku panjang sebelum yakin seluruh subdomain mendukung HTTPS.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Terminasi TLS dan Koneksi Internal</h3><p>Pada arsitektur nyata, TLS sering berhenti di <b>load balancer</b> atau <b>reverse proxy</b>. Setelah itu, proxy meneruskan request ke backend melalui jaringan internal. Pola ini disebut <b>TLS termination</b>. Proxy menambahkan header seperti <code>X-Forwarded-Proto: https</code> agar aplikasi tahu koneksi asli dari client memakai HTTPS.</p><p>Jika backend hanya bisa diakses dari jaringan internal, koneksi HTTP di dalam bisa diterima dengan kontrol jaringan yang ketat. Namun untuk data sangat sensitif, enkripsi end-to-end atau mTLS antar-service tetap dipertimbangkan. Yang penting: jangan menganggap “di dalam jaringan” otomatis aman.</p>'
    },
    {
      type: 'tip',
      title: 'Praktik Langsung',
      text: 'Jalankan lab HTTPS, lalu bandingkan <code>curl -v</code> tanpa dan dengan <code>-k</code>. Catat baris yang menunjukkan verifikasi sertifikat, protokol TLS, dan cipher. Setelah itu periksa header <code>Strict-Transport-Security</code> pada respons HTTPS dan jelaskan mengapa header itu tidak muncul pada respons HTTP biasa.'
    },
    {
      type: 'warn',
      title: 'Jangan Mematikan Verifikasi di Produksi',
      text: 'Mematikan verifikasi sertifikat (<code>-k</code>, <code>rejectUnauthorized: false</code>, atau setara) membuat HTTPS kehilangan fungsi autentikasi. Jika sertifikat internal bermasalah, perbaiki trust store atau gunakan CA internal yang benar, bukan menonaktifkan pemeriksaan.'
    },
    {
      type: 'vocab',
      items: [
        ['TLS', 'Protokol keamanan yang menyediakan enkripsi, integritas, dan autentikasi pada koneksi.'],
        ['HTTPS', 'HTTP yang berjalan di dalam koneksi TLS.'],
        ['Sertifikat', 'Dokumen digital yang mengikat nama host ke public key dan ditandatangani CA.'],
        ['Certificate chain', 'Rangkaian sertifikat dari leaf hingga root yang membangun kepercayaan.'],
        ['HSTS', 'Header yang memerintahkan browser selalu memakai HTTPS untuk host tertentu.'],
        ['TLS termination', 'Praktik mengakhiri koneksi TLS di proxy atau load balancer.'],
        ['SNI', 'Nama host yang dikirim client saat handshake agar server memilih sertifikat yang tepat.'],
        ['mTLS', 'TLS dengan sertifikat client, sehingga kedua pihak saling terautentikasi.']
      ]
    }
  ],
  recap: [
    'TLS melindungi kerahasiaan dan integritas jalur serta mengautentikasi server melalui sertifikat.',
    'Sertifikat harus cocok dengan hostname, belum kedaluwarsa, dan memiliki rantai kepercayaan yang valid.',
    'Sertifikat self-signed cocok untuk latihan lokal, tetapi client harus diberi pengecualian khusus, bukan verifikasi dimatikan permanen.',
    'HSTS dan redirect ke HTTPS membantu mencegah downgrade, sementara TLS termination di proxy harus diikuti kontrol keamanan internal.'
  ]
});
