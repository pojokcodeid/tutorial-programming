/* ============================================================
   Pelajaran Nginx — 13: HTTPS & TLS
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'https-tls',
  title: 'HTTPS & TLS',
  chapter: 'HTTPS & TLS',
  duration: '10 menit',
  intro: [
    'Kirim uang lewat pos ada dua cara: <b>terbuka</b> — isinya bisa dibaca siapa pun dan pengirimnya pun tidak pasti — atau masuk <b>amplop bersegel</b> yang ditandatangani dan dilampiri kartu identitas kantor pos: isi tertutup, pengirim pasti. HTTPS adalah cara kedua.',
    'Di baliknya ada protokol <b>TLS</b> yang mengunci isi komunikasi sekaligus memperkenalkan identitas server. Intinya sederhana: <b>enkripsi menjaga isi, sertifikat menjaga identitas.</b> Pelajaran ini membedah handshake, peran certificate/private key/CA/SAN/chain, SNI, lalu memasang HTTPS pertamamu di Nginx dengan sertifikat self-signed.'
  ],
  objectives: [
    'Menjelaskan alur TLS handshake beserta peran certificate, private key, CA, SAN, dan chain',
    'Mengaktifkan HTTPS dengan listen 443 ssl, ssl_certificate, dan ssl_certificate_key',
    'Membuat sertifikat self-signed ber-SAN untuk lab memakai openssl',
    'Mengarahkan HTTP ke HTTPS lalu memverifikasi sertifikat dengan curl dan openssl s_client'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Amplop bersegel vs surat terbuka</h3><p>Tanpa TLS, satu request GET dikirim <b>terbuka</b> di jaringan — siapa pun yang menyadap bisa membacanya, dan tidak ada bukti server yang menjawab benar-benar pemilik domain. HTTPS membungkus komunikasi itu dalam terowongan terenkripsi sekaligus menyertakan kartu identitas server.</p><table><thead><tr><th>Di pos</th><th>Di web</th></tr></thead><tbody><tr><td>Amplop bersegel</td><td>Enkripsi TLS</td></tr><tr><td>Kartu identitas pengirim</td><td><b>Certificate</b> (sertifikat)</td></tr><tr><td>Kunci pembuka amplop</td><td><b>Private key</b></td></tr><tr><td>Kantor pos penerbit kartu</td><td><b>CA</b> (Certificate Authority)</td></tr><tr><td>Nama yang sah di kartu</td><td><b>SAN</b></td></tr></tbody></table><p>Bedanya nyata di konfigurasi: <code>http://</code> memakai port 80 dengan <code>listen 80;</code>, sedangkan <code>https://</code> memakai port 443 dengan <code>listen 443 ssl;</code> — tanpa kata kunci <code>ssl</code>, Nginx tetap menjawab HTTP biasa di port itu.</p>'
    },
    {
      type: 'text',
      html: '<h3>TLS handshake dalam 5 langkah</h3><ol><li><b>ClientHello</b> — klien mengirim versi TLS yang didukung, daftar cipher, angka acak, dan nama lewat ekstensi <b>SNI</b>.</li><li><b>ServerHello</b> — server memilih versi/cipher, mengirim rantai sertifikat dan angka acaknya.</li><li>Klien <b>memverifikasi sertifikat</b> ke CA yang ia percaya, lalu mengirim <i>premaster secret</i> yang dienkripsi dengan <b>public key</b> server.</li><li>Kunci sesi disepakati kedua pihak.</li><li>Keduanya mengirim <b>Finished</b>; sejak itu semua data terenkripsi.</li></ol><p>Handshake hanya terjadi <b>sekali per koneksi</b> (lalu ada <i>session resumption</i>), jadi biayanya bukan di tiap request. Di arsitektur modern Nginx berperan sebagai <b>terminator TLS</b>: ia memegang private key, sementara koneksi dari Nginx ke backend di jaringan privat boleh tetap HTTP biasa.</p>'
    },
    {
      type: 'text',
      html: '<h3>Certificate, private key, CA, SAN, dan chain</h3><table><thead><tr><th>Istilah</th><th>Isi/fungsi</th><th>Boleh dibagikan?</th></tr></thead><tbody><tr><td><b>Certificate</b> (<code>.crt</code>)</td><td>&quot;Kartu identitas&quot;: nama domain, public key, masa berlaku, tanda tangan CA</td><td>Ya — memang dikirim ke client</td></tr><tr><td><b>Private key</b> (<code>.key</code>)</td><td>Kunci rahasia pemilik domain untuk membuktikan kepemilikan</td><td><b>TIDAK PERNAH</b></td></tr><tr><td><b>CA</b></td><td>Pihak tepercaya penerbit sertifikat (mis. Let&#39;s Encrypt)</td><td>—</td></tr><tr><td><b>SAN</b></td><td>Daftar hostname/IP yang sah: <code>DNS:localhost</code>, <code>IP:127.0.0.1</code></td><td>—</td></tr><tr><td><b>Chain</b></td><td>Urutan leaf → intermediate → root CA</td><td>—</td></tr></tbody></table><p>Rantainya berjenjang: <b>root CA</b> sudah dipercaya browser dan sistem operasi, di bawahnya <b>intermediate CA</b> yang menerbitkan sertifikat domainmu, dan di ujung bawah ada <b>sertifikat server</b> beserta private key-nya. Client menyusun rantai dari sertifikat yang diterima sampai root CA yang ia percaya.</p><p><b>Kalau rantai putus</b> — lupa mengirim intermediate — browser bilang <i>certificate error</i> meski sertifikatnya valid. Di Nginx, urutannya <b>leaf dulu, baru intermediate</b> dalam file <code>ssl_certificate</code>; urutan ini wajib. Sementara itu, CN saja sudah tidak cukup: browser modern menuntut <b>SAN</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>SNI: satu port untuk banyak sertifikat</h3><p>Satu IP hanya punya satu port 443, tetapi kamu melayani puluhan domain. Caranya: klien menuliskan nama domain yang dituju di <code>ClientHello</code> (ekstensi <b>SNI</b>), Nginx memilih blok <code>server</code> yang cocok, <b>baru</b> sertifikatnya dibaca. Tanpa SNI, satu IP:port hanya bisa menampilkan satu sertifikat default. Untuk menolak SNI yang tidak dikenal (anti-scanning) bisa dipakai <code>ssl_reject_handshake on;</code> di default server (Nginx ≥ 1.19.4).</p><h4>Baseline protocol dan cipher</h4><table><thead><tr><th>Directive</th><th>Nilai</th><th>Peran</th></tr></thead><tbody><tr><td><code>ssl_protocols</code></td><td><code>TLSv1.2 TLSv1.3;</code></td><td>Versi TLS yang diizinkan; TLS 1.0/1.1 sudah dianggap usang</td></tr><tr><td><code>ssl_ciphers</code></td><td><code>HIGH:!aNULL:!MD5;</code></td><td>Default Nginx, format daftar cipher OpenSSL</td></tr><tr><td><code>ssl_session_cache</code></td><td><code>shared:SSL:10m;</code></td><td>Sesi dibagi antar worker — handshake jadi murah; tanpa ini tiap koneksi baru handshake penuh</td></tr><tr><td><code>ssl_prefer_server_ciphers</code></td><td><code>off</code> (default)</td><td>Hanya berpengaruh untuk TLS ≤ 1.2</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>HSTS dan Let&#39;s Encrypt</h3><p><b>HSTS</b> (<code>Strict-Transport-Security</code>) memerintahkan browser memakai HTTPS saja untuk domain ini, meski kamu mengetik <code>http://</code>. Konsekuensinya nyata dan sulit dibatalkan:</p><ul><li><code>max-age=31536000</code> mengunci browser selama 1 tahun; <code>preload</code> praktis tidak bisa dibatalkan.</li><li><code>includeSubDomains</code> menyeret semua subdomain — yang belum siap HTTPS <b>akan mati</b>.</li><li>Kalau terlanjur salah, hanya bisa menunggu <code>max-age</code> habis atau menjalani proses panjang <i>preload removal</i>.</li></ul><p><b>Let&#39;s Encrypt</b> menerbitkan sertifikat <b>gratis</b> berlaku <b>90 hari</b> lewat protokol <b>ACME</b>: <code>HTTP-01</code> menguji lewat <code>http://domainmu/.well-known/acme-challenge/&lt;token&gt;</code> (port 80 harus terbuka), sedangkan <code>DNS-01</code> lewat record TXT dan cocok untuk wildcard. <code>certbot --nginx</code> memasang sertifikat sekaligus menulis konfigurasi Nginx, lalu <i>renewal</i> dijalankan cron/systemd timer hampir tiap hari — dengan masa berlaku 90 hari, kamu tidak pernah kehilangan sertifikat. Self-signed hanya untuk lab; produksi memakai jalur ini.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: redirect HTTP dan server HTTPS',
      lang: 'nginx',
      output: false,
      code: `server {                                  # HTTP -> HTTPS
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}

server {                                  # HTTPS
    listen 443 ssl;
    server_name localhost;

    ssl_certificate     /etc/nginx/certs/localhost.crt;  # leaf dulu, lalu intermediate
    ssl_certificate_key /etc/nginx/certs/localhost.key;  # RAHASIA - jangan masuk Git

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;

    root /usr/share/nginx/html;
    index index.html;

    add_header Strict-Transport-Security "max-age=31536000" always;
}`,
      explain: [
        '<code>listen 443 ssl</code> mengaktifkan TLS; tanpa kata kunci <code>ssl</code> Nginx menjawab HTTP biasa di port 443.',
        '<code>ssl_certificate</code> menunjuk file PEM berisi <b>leaf dulu, lalu intermediate</b>, sedangkan <code>ssl_certificate_key</code> menunjuk private key — keduanya wajib berpasangan, kalau key hilang <code>nginx -t</code> langsung gagal.',
        '<code>return 301 https://$host$request_uri;</code> memindahkan semua path ke HTTPS; <code>$host</code> tanpa port dan <code>$request_uri</code> mempertahankan query string.',
        '<code>add_header ... always</code> menyertakan header juga pada response 4xx/5xx, bukan hanya 200.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: sertifikat self-signed ber-SAN lalu jalankan Nginx',
      lang: 'bash',
      output: false,
      code: `podman rm -f nginx-lab 2>/dev/null || true
mkdir -p ~/nginx-lab/certs ~/nginx-lab/conf.d

openssl req -x509 -newkey rsa:2048 -nodes \\
  -keyout ~/nginx-lab/certs/localhost.key \\
  -out    ~/nginx-lab/certs/localhost.crt \\
  -days 365 -subj "/CN=localhost" \\
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
chmod 600 ~/nginx-lab/certs/localhost.key

openssl x509 -in ~/nginx-lab/certs/localhost.crt -noout -subject -issuer -dates
openssl x509 -in ~/nginx-lab/certs/localhost.crt -noout -text | grep -A1 'Subject Alternative Name'

cat > ~/nginx-lab/conf.d/https.conf <<'EOF'
server {
    listen 80;
    server_name localhost;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name localhost;
    ssl_certificate     /etc/nginx/certs/localhost.crt;
    ssl_certificate_key /etc/nginx/certs/localhost.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    root /usr/share/nginx/html;
    index index.html;
}
EOF

podman run -d --name nginx-lab -p 8080:80 -p 8443:443 \\
  -v ~/nginx-lab/certs:/etc/nginx/certs:ro \\
  -v ~/nginx-lab/conf.d:/etc/nginx/conf.d:ro \\
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t`,
      explain: [
        'Ekspektasi dua perintah <code>openssl x509</code>: <code>subject=CN=localhost</code>, <code>issuer=CN=localhost</code>, berlaku 1 tahun, dan bagian <code>Subject Alternative Name</code> berisi <code>DNS:localhost</code> serta <code>IP Address:127.0.0.1</code>.',
        '<code>-addext "subjectAltName=..."</code> wajib — browser modern menolak sertifikat yang hanya punya CN tanpa SAN.',
        'Port host 8443 dipetakan ke 443 container, sehingga uji HTTPS di lab tidak membutuhkan port 443 di mesin lokal.',
        '<code>nginx -t</code> harus <code>syntax is ok</code> dan <code>test is successful</code>; pesan <code>no &quot;ssl_certificate_key&quot; is defined</code> berarti salah satu baris SSL hilang.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: redirect, verifikasi, dan membaca sertifikat',
      lang: 'bash',
      output: false,
      code: `curl -i http://localhost:8080/          # 301, Location: https://localhost/
curl -k -i https://localhost:8443/       # 200 OK + Strict-Transport-Security
curl -i https://localhost:8443/          # GAGAL, exit 60: self-signed certificate

# sertifikat yang disajikan + protokolnya (Ctrl+C untuk keluar)
openssl s_client -connect localhost:8443 -servername localhost`,
      explain: [
        'Baris pertama menjawab <code>301 Moved Permanently</code> dengan <code>Location: https://localhost/</code> — perhatikan port tidak ikut, sesuai <code>$host</code>.',
        '<code>curl -k</code> memaksa verifikasi dimatikan sehingga <code>200 OK</code> muncul beserta header <code>Strict-Transport-Security</code>; tanpa <code>-k</code> curl keluar dengan kode 60 karena sertifikat self-signed tidak dipercaya — bukti browser pun akan menolaknya.',
        '<code>openssl s_client</code> menampilkan <code>subject=CN=localhost</code>, <code>Protocol: TLSv1.3</code>, dan <code>Verify return code: 18 (self-signed certificate)</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum HTTPS',
      text: '<ul><li><b><code>listen 443</code> tanpa <code>ssl</code></b> — port terbuka tapi Nginx menjawab HTTP biasa.</li><li><b><code>ssl_certificate_key</code> tidak diisi</b> — <code>nginx -t</code> gagal dengan pesan <code>no &quot;ssl_certificate_key&quot; is defined for certificate ...</code>.</li><li><b>Sertifikat tanpa SAN</b> — browser menolak; CN saja sudah tidak cukup.</li><li><b>Rantai putus</b> (lupa intermediate) — muncul <i>unable to get local issuer certificate</i>.</li><li><b><code>includeSubDomains</code>/<code>preload</code> terlalu dini</b> — subdomain yang belum siap HTTPS ikut mati.</li><li><b>Self-signed dipakai di produksi</b> — tidak ada jaminan identitas server sama sekali.</li><li><b>Private key masuk Git</b> — tambahkan <code>certs/</code>, <code>*.key</code>, <code>*.crt</code> ke <code>.gitignore</code>; file yang sudah ter-commit tetap tersimpan di riwayat Git selamanya meski file-nya dihapus.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Dua perintah verifikasi yang selalu dipakai',
      text: '<p>Selesai mengubah konfigurasi SSL, jalankan dua hal ini: <code>podman exec nginx-lab nginx -t</code> untuk memastikan pasangan sertifikat/key lengkap, lalu <code>openssl s_client -connect localhost:8443 -servername localhost</code> untuk melihat sertifikat yang <i>benar-benar</i> disajikan beserta protokolnya. Kalau yang tampil bukan nama domain yang kamu harapkan, masalahnya ada di pemilihan blok <code>server</code> atau SNI — bukan di file sertifikatnya.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['TLS', 'Protokol yang mengenkripsi dan memverifikasi koneksi.'],
        ['Certificate', 'File publik berisi nama domain, public key, dan tanda tangan CA.'],
        ['Private key', 'Kunci rahasia pemilik domain; tidak boleh masuk Git.'],
        ['CA', 'Certificate Authority, penerbit dan penandatangan sertifikat.'],
        ['SAN', 'Daftar hostname atau IP yang dicakup satu sertifikat.'],
        ['Chain', 'Rantai leaf → intermediate → root yang diverifikasi client.'],
        ['SNI', 'Ekstensi TLS pengirim nama domain saat handshake.'],
        ['HSTS', 'Header yang memaksa browser memakai HTTPS saja.'],
        ['ACME', 'Protokol penerbitan sertifikat otomatis milik Let&#39;s Encrypt.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat sertifikat self-signed untuk <code>app.local</code>, lalu buktikan <code>curl -k https://localhost:8443/</code> gagal verifikasi hostname sementara <code>curl -k --resolve app.local:8443:127.0.0.1 https://app.local:8443/</code> berhasil setelah <code>server_name</code> dan sertifikatnya diganti.</li><li>Hapus baris <code>ssl_certificate_key</code>, jalankan <code>podman exec nginx-lab nginx -t</code>, dan tuliskan pesan error persisnya. Kembalikan lagi.</li><li>Jelaskan kenapa HSTS dengan <code>includeSubDomains</code> bisa membuat <code>staging.example.com</code> ikut mati bila hanya <code>example.com</code> yang siap HTTPS.</li></ol>'
    }
  ],
  recap: [
    '<b>HTTPS = HTTP + TLS</b>: enkripsi menjaga isi, sertifikat menjaga identitas; Nginx berperan sebagai terminator TLS di depan backend.',
    '<b>Private key rahasia</b> dan tidak pernah dibagikan; sertifikat dan chain publik; <b>CA</b> menjamin, <b>SAN</b> menyebut hostname sah, urutan <code>ssl_certificate</code> = leaf lalu intermediate.',
    'Tiga langkah wajib: <code>listen 443 ssl</code> + <code>ssl_certificate</code> + <code>ssl_certificate_key</code>, dilengkapi redirect <code>return 301 https://$host$request_uri;</code>.',
    'Baseline: TLS 1.2/1.3, cipher <code>HIGH:!aNULL:!MD5</code>, session cache aktif; self-signed hanya untuk lab — produksi pakai Let&#39;s Encrypt dengan renewal otomatis, dan HSTS baru dinyalakan setelah semua layanan siap HTTPS.'
  ]
});
