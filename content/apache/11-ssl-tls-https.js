/* ============================================================
   Pelajaran Apache — 11: SSL/TLS & HTTPS
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'ssl-tls-https',
  title: 'SSL/TLS & HTTPS: Sertifikat, mod_ssl, HTTP/2',
  chapter: 'HTTPS & TLS',
  duration: '12 menit',
  intro: [
    'HTTPS bukan sekadar gembok di address bar. Di dalam terowongan TLS itulah identitas server dibuktikan lewat sertifikat, kunci disepakati, dan isi percakapan dienkripsi — sebelum satu byte HTTP pun berpindah. Satu kesalahan pada sertifikat membuat browser menolak total, tanpa error 5xx apa pun untuk dirujuk.',
    'Pelajaran ini membedah komponen sertifikat (CSPR, CN, SAN, chain), alur handshake TLS singkat, konfigurasi <code>mod_ssl</code> di Apache, memaksa HTTP→HTTPS, HSTS, cipher &amp; protokol, sampai HTTP/2 lewat ALPN — seluruhnya diuji pada vhost <code>:8443</code> lab dengan sertifikat self-signed hasil <code>scripts/gen-certs.sh</code>.'
  ],
  objectives: [
    'Menjelaskan fungsi sertifikat, private key, SAN, dan certificate chain',
    'Mengonfigurasi <code>SSLEngine</code> beserta pasangan sertifikat dan key pada virtual host',
    'Menguji sertifikat dengan <code>openssl s_client</code> dan <code>curl --cacert</code>',
    'Menerapkan redirect HTTP→HTTPS dan HSTS dengan aturan yang aman',
    'Mengaktifkan HTTP/2 dan memilih cipher/protokol TLS yang layak'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Empat komponen yang wajib kamu kenal</h3><table><thead><tr><th>Komponen</th><th>Siapa memegang</th><th>Peran</th></tr></thead><tbody><tr><td><b>Public key + identitas</b> (sertifikat)</td><td>Dipasang di server, publik</td><td>Bukti "ini pemilik domain itu"; ditandatangani CA</td></tr><tr><td><b>Private key</b></td><td>Hanya server, rahasia</td><td>Membuktikan kepemilikan saat handshake (tanda tangan digital)</td></tr><tr><td><b>SAN</b> (Subject Alternative Name)</td><td>Di dalam sertifikat</td><td>Daftar hostname/IP yang divalidasi client — <b>ini yang dicek browser</b>, bukan CN lagi</td></tr><tr><td><b>Chain / intermediate cert</b></td><td>Server + CA</td><td>Menghubungkan sertifikat kamu ke root CA yang dipercaya OS/browser</td></tr></tbody></table><p>Sertifikat <b>self-signed</b> (dibuat sendiri) cocok untuk lab: client tidak menandainya tepercaya secara bawaan, jadi diuji dengan <code>-k</code> atau <code>--cacert certs/server.crt</code>. Di produksi, CA publik (Let\'s Encrypt dsb) menandatangani agar dipercaya otomatis.</p>'
    },
    {
      type: 'example',
      title: 'Membaca sertifikat dengan openssl',
      lang: 'bash',
      output: true,
      code: `# Isi sertifikat: issuer, validity, SAN
openssl x509 -in certs/server.crt -noout -subject -issuer -dates -ext subjectAltName
# subject=CN = localhost
# notBefore=...  notAfter=...
# X509v3 Subject Alternative Name: DNS:localhost, DNS:app.local, ..., IP Address:127.0.0.1

# Detail handshake ke server lab (TLS version, cipher, sertifikat server)
openssl s_client -connect localhost:8443 -servername app.local </dev/null 2>/dev/null | head -12
# Protocol  : TLSv1.3
# Cipher    : TLS_AES_256_GCM_SHA384
# Verify return code: 18 (self-signed certificate)

# Uji lewat curl yang dipercaya (tanpa -k)
curl --cacert certs/server.crt https://127.0.0.1:8443/ -o /dev/null -w '%{http_code}\\n'`,
      explain: [
        'Baris <code>SAN</code> adalah yang paling penting: hostname yang kamu ketik di curl harus cocok dengan salah satu entri di dalamnya — cocok CN saja sudah tidak cukup di browser modern.',
        '<code>Verify return code: 18</code> berarti sertifikat valid secara struktur tapi ditandatangani diri sendiri — inilah yang membuat <code>curl</code> tanpa <code>-k</code> menolak.',
        'Membaca handshake secara manual berguna ketika browser hanya menampilkan pesan generik "Your connection is not secure".'
      ]
    },
    {
      type: 'example',
      title: 'HTTPS di Apache: konfigurasi vhost lab',
      lang: 'apache',
      output: false,
      code: `# httpd.conf (global) — modul & cache sesi
LoadModule ssl_module modules/mod_ssl.so
LoadModule socache_shmcb_module modules/mod_socache_shmcb.so
Listen 8443
SSLSessionCache "shmcb:/usr/local/apache2/logs/ssl_scache(512000)"
SSLSessionCacheTimeout 300

# extra/app.conf — vhost HTTPS
<VirtualHost *:8443>
    ServerName app.local
    DocumentRoot "/usr/local/apache2/htdocs"

    SSLEngine on
    SSLCertificateFile    "/usr/local/apache2/certs/server.crt"
    SSLCertificateKeyFile "/usr/local/apache2/certs/server.key"
    # SSLCACertificateFile "/path/chain.pem"   # bila pakai CA/rantai

    # Protokol & cipher modern
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite HIGH:!aNULL:!MD5
    SSLHonorCipherOrder on

    # HTTP/2 (ALPN; hanya lewat TLS)
    Protocols h2 http/1.1
</VirtualHost>`,
      explain: [
        '<code>SSLEngine on</code> + dua direktif sertifikat adalah syarat minimum; tanpa <code>mod_socache_shmcb</code>, Apache menolak start dengan pesan bahwa <code>SSLSessionCache</code> tidak didukung.',
        'Kunci dan sertifikat <b>harus cocok</b> — pasangan yang tidak cocok membuat startup gagal dengan "PrivateKey mismatch". Itulah sebabnya gen-certs.sh selalu membuat keduanya berpasangan.',
        '<code>Protocols h2 http/1.1</code> mengumumkan pilihan via ALPN: client yang mendukung HTTP/2 akan memakainya, sisanya jatuh ke HTTP/1.1.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alur handshake (versi singkat)</h3><ol><li><b>ClientHello</b> — client menawarkan versi TLS, cipher, dan SNI (nama host yang diminta, agar server memilih sertifikat yang tepat).</li><li><b>ServerHello</b> — server memilih parameter + mengirim sertifikatnya.</li><li><b>Verifikasi</b> — client memeriksa: cocok hostname (SAN)?, tanggal berlaku?,- rantai menuju CA tepercaya?</li><li><b>Pertukaran kunci</b> — client mengenkripsi premaster secret dengan public key server; server mendekripsinya dengan private key.</li><li><b>Session key → data</b> — keduanya menghitung kunci simetris, lalu HTTP berjalan di dalamnya.</li></ol><p>Titik kegagalan menentukan gejalanya: hostname tidak cocok di SAN → error sertifikat; chain tidak lengkap → "not trusted"; SNI tidak dikirim → server mengirim sertifikat default yang pasti salah. Sama sekali beda dengan error 5xx yang datang dari HTTP.</p>'
    },
    {
      type: 'example',
      title: 'Redirect HTTP → HTTPS dengan benar',
      lang: 'apache',
      output: false,
      code: `# Lab: port 8081 khusus membalas redirect (extra/app.conf)
<VirtualHost *:8081>
    ServerName app.local
    Redirect permanent / "https://localhost:8443/"
</VirtualHost>

# Uji:
curl -sI http://localhost:8081/ | head -3
# HTTP/1.1 301 Moved Permanently
# Location: https://localhost:8443/`,
      explain: [
        '<code>Redirect permanent / tujuan</code> (mod_alias) membalas 301 untuk semua path dan menyisipkan path asal ke tujuan — paling sederhana dan efisien.',
        'Pola lain yang lazim: vhost port 80 tetap melayani site, tapi tiap request di-rewrite ke HTTPS — berguna bila kamu butuh membedakan kondisi (mis. path yang dikecualikan).',
        'Pastikan <b>tidak ada dua langkah redirect</b> (mis. vhost 80 → 8081 → 8443): tiap hop ekstra memperlambat first byte dan bisa memicu loop bila salah satu arah salah.'
      ]
    },
    {
      type: 'example',
      title: 'HSTS dan header keamanan HTTPS',
      lang: 'apache',
      output: false,
      code: `# snippets/security-headers.conf — hanya untuk vhost HTTPS
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Uji (harus muncul di response HTTPS, dan TIDAK muncul di HTTP)
curl -skI https://localhost:8443/ | grep -i strict-transport`,
      explain: [
        '<code>always</code> membuat header ikut dikirim pada response error (4xx/5xx) — tanpa itu, HSTS bisa terlewat tepat saat server bermasalah.',
        'HSTS hanya boleh dikirim lewat HTTPS. Nilai <code>max-age</code> mendefinisikan berapa lama browser memaksa HTTPS — mulai dari angka kecil (mis. 300) saat pertama kali mengaktifkan, jangan langsung setahun.',
        '<code>includeSubDomains</code> memberlakukan ke seluruh subdomain — pastikan semuanya sudah siap HTTPS sebelum mencantumkannya, karena browser tidak mencabut keputusan itu sampai max-age habis.'
      ]
    },
    {
      type: 'text',
      html: '<h3>HTTP/2 di Apache</h3><p>HTTP/2 hanya tersedia lewat TLS (ALPN) pada lab ini. Persyaratannya: <code>mod_http2</code> dimuat dan <code>Protocols h2 http/1.1</code> ditulis di vhost. Manfaatnya nyata untuk halaman dengan banyak file kecil (multiplexing + header compression).</p><pre><code>curl -k --http2 -I https://localhost:8443/ | head -1\n# HTTP/2 200   (bila http/1.1, barisnya HTTP/1.1 200)</code></pre><p>Beberapa catatan: HTTP/2 tidak menjamin lebih cepat untuk satu file besar di jaringan lambat; prioritas punya dampak kecil di praktik nyata; dan tetap pertahankan HTTP/1.1 untuk client lama. Untuk HTTP/3 (QUIC) dibutuhkan modul terpisah yang belum umum di image resmi.</p>'
    },
    {
      type: 'warn',
      title: 'Jebakan yang paling sering muncul di HTTPS',
      text: '<p>(1) <b>Key/cert tidak cocok</b> → startup gagal, baca pesannya. (2) <b>SAN tidak memuat hostname</b> → <code>curl</code> menolak padahal sertifikat terpasang. (3) <b>Chain tidak lengkap</b> → server percaya, client (HP/CA lain) menolak — uji dengan <code>openssl s_client -showcerts</code>. (4) <b>Port lupa <code>Listen</code></b> → <code>Connection refused</code>. (5) <b>HSTS terlanjur aktif</b> di domain produksi sementara sertifikatnya rusak → semua visitor terkunci; siapkan rencana sebelum menaikkan max-age.</p>'
    },
    {
      type: 'tip',
      title: 'Uji dengan dua tingkat kepercayaan',
      text: '<p>Selalu menguji dua kali: <code>curl -k</code> untuk memastikan layanan HTTPS-nya hidup dan konfigurasinya benar, lalu <code>curl --cacert certs/server.crt</code> (atau tanpa keduanya untuk CA publik) untuk memastikan rantai kepercayaannya benar. Uji pertama bisa lolos untuk sertifikat yang cacat — hanya uji kedua yang meniru apa yang dilakukan browser pengunjungmu.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['TLS', 'Protokol terowongan terenkripsi tempat HTTP berjalan (pengganti SSL).'],
        ['Sertifikat', 'Dokumen publik berisi public key + identitas, ditandatangani CA.'],
        ['Private key', 'Kunci rahasia server untuk membuktikan kepemilikan; jangan pernah dibagikan.'],
        ['SAN', 'Daftar hostname/IP yang divalidasi client — pengganti fungsi CN.'],
        ['CA', 'Certificate Authority — pihak yang menandatangani sertifikat agar dipercaya.'],
        ['Self-signed', 'Sertifikat yang ditandatangani sendiri; bagus untuk lab, tidak dipercaya browser.'],
        ['SNI', 'Extension TLS yang menyebut nama host saat connect, agar server memilih sertifikat tepat.'],
        ['ALPN', 'Negosiasi protokol aplikasi (h2 vs http/1.1) di dalam handshake TLS.'],
        ['HSTS', 'Memberitahu browser memaksa HTTPS selama max-age tertentu.'],
        ['mod_ssl', 'Modul Apache yang menyediakan SSLEngine dan direktif TLS.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Baca sertifikat lab dengan <code>openssl x509 ... -ext subjectAltName</code> dan cocokkan isinya dengan hostname yang berhasil diuji lewat <code>curl --cacert</code>.</li><li>Uji <code>curl https://localhost:8443/</code> tanpa apa pun (harus ditolak), dengan <code>-k</code> (lolos), dan dengan <code>--cacert</code> (lolos) — jelaskan ketiga hasilnya dengan kata-katamu.</li><li>Hapus baris <code>SSLCertificateKeyFile</code>, jalankan <code>httpd -t</code>, dan catat pesan errornya; pulihkan.</li><li>Buktikan HSTS hanya muncul di HTTPS: bandingkan <code>curl -sI http://localhost:8080/</code> dengan <code>curl -skI https://localhost:8443/</code>. Lalu naikkan <code>max-age</code> dan uji ulang bahwa perubahannya terbaca setelah <code>graceful</code>.</li></ol>'
    }
  ],
  recap: [
    'Sertifikat = public key + identitas + SAN; private key tetap rahasia di server; client memvalidasi SAN, tanggal, dan chain ke CA tepercaya.',
    'HTTPS di Apache: <code>Listen</code> + <code>SSLEngine on</code> + <code>SSLCertificateFile</code> + <code>SSLCertificateKeyFile</code>, ditambah <code>SSLSessionCache</code> (butuh <code>mod_socache_shmcb</code>).',
    'Redirect 301 sekali langkah saja; HSTS hanya lewat HTTPS dan dimulai dari max-age kecil.',
    'HTTP/2 lewat ALPN butuh <code>mod_http2</code> + <code>Protocols h2 http/1.1</code>; uji dengan <code>curl --cacert</code> agar meniru kepercayaan browser.'
  ]
});
