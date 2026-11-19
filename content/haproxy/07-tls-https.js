/* ============================================================
   Pelajaran HAProxy — 07: TLS/HTTPS, Termination, dan Keamanan Frontend
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'tls-https',
  title: 'TLS/HTTPS, Termination, dan Keamanan Frontend',
  chapter: 'Keamanan',
  duration: '15 menit',
  intro: [
    'Bayangkan surat yang dikirim lewat kurir: kalau ditulis terbuka, siapa pun di jalan bisa membacanya dan kamu tidak bisa memastikan pengirimnya benar-benar orang yang kamu kenal. Surat itu baru aman bila dimasukkan ke <b>amplop bersegel</b> dan dilampiri kartu identitas yang diterbitkan kantor pos tepercaya.',
    'HTTPS bekerja persis begitu. Di baliknya ada protokol <b>TLS</b> yang mengunci isi komunikasi (enkripsi) sekaligus memperkenalkan identitas server lewat <b>sertifikat</b>. Di lab ini, <b>HAProxy berperan sebagai kurir yang membuka segel</b>: ia menerima TLS dari client, mendekripsi request, lalu meneruskan HTTP biasa ke backend.',
    'Pelajaran ini membangun sertifikat lab dengan <code>openssl</code>, memasang frontend <code>bind :443 ssl</code>, mengarahkan HTTP ke HTTPS, membedakan TLS termination dengan passthrough, lalu menutup dengan checklist keamanan dan peringatan lab vs produksi.'
  ],
  objectives: [
    'Menjelaskan TLS handshake beserta peran certificate, private key, CA, certificate chain, dan SNI',
    'Membuat sertifikat self-signed lalu menggabungkannya menjadi satu file PEM untuk HAProxy',
    'Mengaktifkan HTTPS pada frontend dengan <code>bind :443 ssl crt ...</code> plus redirect HTTP ke HTTPS',
    'Membedakan TLS termination, TLS passthrough, dan backend TLS beserta konsekuensi keamanannya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Handshake dan empat komponen kunci</h3><p>TLS handshake terjadi <b>sekali di awal koneksi</b>, bukan tiap request: (1) client mengirim versi TLS, daftar cipher, angka acak, dan nama domain lewat ekstensi <b>SNI</b>; (2) server memilih parameter lalu mengirim sertifikatnya; (3) client memverifikasi sertifikat itu ke rantai yang ia percaya; (4) kedua pihak menyepakati kunci sesi, lalu semua data dikirim terenkripsi.</p><table><thead><tr><th>Komponen</th><th>Fungsi</th><th>Boleh dibagikan?</th></tr></thead><tbody><tr><td><b>Certificate</b> (<code>.crt</code>)</td><td>Identitas server: domain, public key, masa berlaku, tanda tangan CA</td><td>Ya — memang dikirim ke client</td></tr><tr><td><b>Private key</b> (<code>.key</code>)</td><td>Kunci rahasia untuk membuktikan kepemilikan domain</td><td><b>Tidak pernah</b></td></tr><tr><td><b>CA</b></td><td>Pihak penerbit yang dipercaya (mis. Let&#39;s Encrypt); self-signed = CA-nya diri sendiri</td><td>—</td></tr><tr><td><b>Certificate chain</b></td><td>Rantai leaf → intermediate → root yang diverifikasi client</td><td>Ya</td></tr><tr><td><b>SNI</b></td><td>Nama domain yang dikirim client saat handshake, dipakai memilih sertifikat yang tepat</td><td>Ya</td></tr></tbody></table><p>File PEM gabungan (sertifikat + key) adalah format yang dipahami HAProxy lewat <code>crt</code> — karena itu langkah pertama lab ini adalah membuat dua file lalu menggabungkannya.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 280" width="760" role="img" aria-label="TLS termination: client mengirim HTTPS terenkripsi ke HAProxy, HAProxy mendekripsi lalu meneruskan HTTP polos ke backend">\n        <text x="20" y="30" class="u-title" text-anchor="start">TLS termination di HAProxy</text>\n        <rect x="20" y="96" width="160" height="80" rx="8" class="u-hd"/>\n        <text x="100" y="128" class="u-title" text-anchor="middle">Client</text>\n        <text x="100" y="154" class="u-lbl" text-anchor="middle">https://localhost:8443</text>\n        <line x1="186" y1="136" x2="294" y2="136" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="240" y="124" class="u-lbl" text-anchor="middle">TLS terenkripsi</text>\n        <rect x="300" y="44" width="200" height="184" rx="10" class="u-box"/>\n        <text x="400" y="70" class="u-title" text-anchor="middle">HAProxy</text>\n        <rect x="314" y="86" width="172" height="46" rx="6" class="u-hd"/>\n        <text x="400" y="114" class="u-lbl" text-anchor="middle">bind :443 ssl crt ...</text>\n        <rect x="314" y="146" width="172" height="46" rx="6" class="u-box"/>\n        <text x="400" y="174" class="u-lbl" text-anchor="middle">terminasi: dekripsi</text>\n        <text x="400" y="214" class="u-lbl" text-anchor="middle">private key ada di sini</text>\n        <line x1="506" y1="136" x2="594" y2="136" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="550" y="124" class="u-lbl" text-anchor="middle">HTTP polos</text>\n        <rect x="600" y="96" width="140" height="80" rx="8" class="u-hd"/>\n        <text x="670" y="128" class="u-title" text-anchor="middle">Backend</text>\n        <text x="670" y="154" class="u-lbl" text-anchor="middle">web1:80</text>\n        <text x="380" y="264" class="u-lbl" text-anchor="middle">TLS berhenti di HAProxy — backend cukup melayani HTTP biasa</text>\n      </svg></div><figcaption>Client mengenkripsi sampai HAProxy; sesudah didekripsi, request diteruskan ke backend sebagai HTTP biasa di jaringan internal.</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Buat sertifikat self-signed dan gabungkan jadi PEM',
      lang: 'bash',
      output: false,
      code: `cd haproxy-lab
mkdir -p certs

openssl req -x509 -newkey rsa:2048 \\
  -keyout certs/lab.key \\
  -out certs/lab.crt \\
  -days 365 -nodes \\
  -subj "/CN=localhost"

cat certs/lab.crt certs/lab.key > certs/lab.pem
chmod 600 certs/lab.key certs/lab.pem

openssl x509 -in certs/lab.crt -noout -subject -issuer -dates`,
      explain: [
        '<code>openssl req -x509</code> membuat sertifikat baru (self-signed) alih-alih permintaan ke CA; <code>-newkey rsa:2048</code> membuat pasangan key 2048-bit, <code>-nodes</code> membuat key tanpa passphrase, dan <code>-days 365</code> menentukan masa berlaku.',
        '<code>-subj &quot;/CN=localhost&quot;</code> mengisi field nama (Common Name) tanpa interaksi prompt — di lab ini cukup karena target uji adalah <code>localhost</code>.',
        '<code>cat certs/lab.crt certs/lab.key &gt; certs/lab.pem</code> menggabungkan sertifikat lalu key ke satu file PEM — direktif <code>crt</code> HAProxy mewajibkan keduanya berada dalam satu file (dengan urutan sertifikat lebih dulu seperti pada langkah ini).',
        'Baris terakhir memverifikasi hasilnya: harus tercetak <code>subject=CN=localhost</code>, <code>issuer=CN=localhost</code>, serta tanggal <code>notBefore</code>/<code>notAfter</code>. <code>chmod 600</code> membatasi akses file key hanya untuk pemilik.'
      ]
    },
    {
      type: 'example',
      title: 'Frontend HTTPS dan redirect HTTP ke HTTPS',
      lang: 'cfg',
      output: false,
      code: `frontend http_front
    bind :80
    http-request redirect scheme https code 301 if !{ ssl_fc }

frontend https_front
    bind :443 ssl crt /usr/local/etc/haproxy/certs/lab.pem ssl-min-ver TLSv1.2
    default_backend web_servers

backend web_servers
    balance roundrobin
    server web1 web1:80 check
    server web2 web2:80 check`,
      explain: [
        'Baris <code>bind :443 ssl crt /usr/local/etc/haproxy/certs/lab.pem</code> adalah inti HTTPS: HAProxy membuka TLS di port 443 memakai PEM gabungan tadi; path-nya <b>di dalam container</b>, jadi harus cocok dengan tujuan mount volume.',
        '<code>ssl-min-ver TLSv1.2</code> menolak client dengan TLS lebih tua (1.0/1.1 dianggap usang) — satu baris ini sudah menutup sebagian besar cipher lawas.',
        '<code>http-request redirect scheme https code 301 if !{ ssl_fc }</code> menjawab 301 untuk request yang <b>bukan</b> TLS: <code>http://</code> diubah jadi <code>https://</code> dengan hostname dan path yang sama; <code>ssl_fc</code> adalah fetch yang bernilai benar bila koneksi memakai TLS.',
        'Frontend dipisah agar aturan redirect hanya berlaku di port 80; kalau kamu gabung, pastikan kondisi <code>!{ ssl_fc }</code> tetap ada supaya koneksi HTTPS tidak ikut di-redirect ke dirinya sendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Jalankan HAProxy dengan sertifikat lalu uji',
      lang: 'bash',
      output: false,
      code: `podman rm -f haproxy
podman run -d \\
  --name haproxy \\
  --network haproxy-lab \\
  -p 8080:80 -p 8443:443 \\
  -v ./haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro \\
  -v ./certs:/usr/local/etc/haproxy/certs:ro \\
  docker.io/library/haproxy:alpine

podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

curl -si http://localhost:8080/ | head -n 3
curl -ki https://localhost:8443/
openssl s_client -connect localhost:8443 -servername localhost < /dev/null`,
      explain: [
        'Dua flag <code>-v</code> memasang konfigurasi dan folder <code>certs/</code> ke container secara <b>read-only</code>; tanpa mount kedua, HAProxy langsung gagal start dengan pesan file PEM tidak ditemukan.',
        'Port dipublikasikan berpasangan: <code>8080:80</code> untuk HTTP (redirect) dan <code>8443:443</code> untuk HTTPS — memakai 8443 agar tidak perlu hak istimewa port 443 di mesin lokal.',
        '<code>haproxy -c -f ...</code> wajib dijalankan sebelum uji: semua galat konfigurasi (path PEM salah, directive tak dikenal) tertangkap di sini, bukan saat traffic datang.',
        '<code>curl -si http://localhost:8080/</code> harus menjawab <code>301</code> dengan header <code>Location</code> ber-https; <code>curl -k</code> mematikan verifikasi agar <code>200 OK</code> muncul (tanpa <code>-k</code> curl exit 60 karena sertifikat self-signed tidak dipercaya), dan <code>openssl s_client</code> menampilkan sertifikat serta versi TLS yang benar-benar disajikan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Termination vs passthrough vs backend TLS</h3><p>Pilihan ini menentukan seberapa besar HAProxy &quot;melihat&quot; isi traffic:</p><table><thead><tr><th>Mode</th><th>Konfigurasi</th><th>Konsekuensi</th></tr></thead><tbody><tr><td><b>TLS termination</b> (default lab ini)</td><td><code>mode http</code> + <code>bind :443 ssl crt ...</code></td><td>HAProxy mendekripsi: ACL, routing, dan log lengkap; setelah itu HTTP polos ke backend</td></tr><tr><td><b>TLS passthrough</b></td><td><code>mode tcp</code> + <code>bind :443</code> tanpa <code>ssl</code></td><td>Terowongan mentah; HAProxy hanya bisa routing berdasarkan SNI/alamat, isi request tak terbaca</td></tr><tr><td><b>Backend TLS</b></td><td><code>server api api.local:8443 check ssl verify required ca-file ca.pem</code></td><td>Koneksi ke backend ikut terenkripsi; HAProxy wajib memegang rantai kepercayaan (CA) yang benar</td></tr></tbody></table><p>Traffic internal yang cuma antarcontainer di network <code>haproxy-lab</code> cukup HTTP; tetapi begitu melewati jaringan yang tidak kamu kendalikan, aktifkan TLS ke backend. Untuk backend dengan sertifikat sendiri, siapkan <code>ca-file</code> berisi CA penerbitnya dan tambahkan <code>check-ssl</code> bila health check-nya juga harus lewat HTTPS — tanpa rantai kepercayaan yang cocok, HAProxy akan menolak koneksi seperti client pada umumnya.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Aturan cepat:</b> butuh ACL, routing per path, dan log isi request? TLS termination. Isi tidak boleh dilihat pihak mana pun? TLS passthrough. Jalur ke backend tidak tepercaya? Tambahkan backend TLS.</blockquote>'
    },
    {
      type: 'text',
      html: '<h3>Checklist keamanan frontend</h3><ul><li><b>Batasi versi TLS</b> — set <code>ssl-min-ver TLSv1.2</code> pada bind (atau <code>ssl-default-bind-options</code> di <code>global</code>) dan tinjau cipher dengan <code>ssl-default-bind-ciphers</code> / <code>ssl-default-bind-ciphersuites</code>.</li><li><b>Lindungi private key</b> — <code>chmod 600</code>, mount read-only, masukkan <code>*.key</code> ke <code>.gitignore</code>, dan jangan pernah menempelkan isi key ke chat/tiket.</li><li><b>Jangan buka stats tanpa autentikasi</b> — halaman stats memuat nama backend dan traffic; wajib <code>stats auth</code> plus firewall/port terbatas (detail di pelajaran Observabilitas).</li><li><b>Tetapkan timeout</b> — <code>timeout connect/client/server</code> mencegah satu koneksi menggantung memakan resource.</li><li><b>Batasi kecepatan dan jumlah koneksi</b> — nilai <code>maxconn</code> plus rate limiting berbasis stick table mencegah satu client membanjiri frontend.</li><li><b>Validasi selalu</b> — jalankan <code>haproxy -c -f</code> setiap perubahan; konfigurasi yang gagal membuat HAProxy tidak start sama sekali.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Lab vs produksi (dan kesalahan umum)',
      text: '<ul><li><b>Sertifikat self-signed hanya untuk lab</b> — tidak ada jaminan identitas, semua browser menolaknya. Produksi wajib CA tepercaya (mis. Let&#39;s Encrypt) dengan proses perpanjangan otomatis.</li><li><b>PEM tidak lengkap</b> — hanya sertifikat tanpa key, key milik sertifikat lain, atau mount folder <code>certs</code> terlewat membuat HAProxy gagal start; cek dengan <code>haproxy -c -f</code> dan <code>podman logs haproxy</code> serta pastikan path <code>/usr/local/etc/haproxy/certs/lab.pem</code> benar-benar ada di dalam container.</li><li><b>Mengira TLS otomatis ke backend</b> — setelah terminasi, hop ke backend justru HTTP polos; aktifkan <code>ssl verify required</code> bila jalur itu tidak tepercaya.</li><li><b>Menyusun sendiri cipher lawas</b> — lebih baik mulai dari default HAProxy lalu batasi versinya, daripada menyalin daftar cipher lama dari artikel tua.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Dua perintah verifikasi yang selalu dipakai',
      text: '<p>Setiap kali menyentuh TLS, jalankan pasangan ini: <code>podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg</code> untuk memastikan file PEM terbaca, lalu <code>openssl s_client -connect localhost:8443 -servername localhost</code> untuk melihat sertifikat, versi TLS, dan hasil verifikasi yang <i>benar-benar</i> disajikan ke client. Sertakan <code>-servername</code> supaya pemilihan lewat SNI ikut teruji — kalau yang tampil bukan nama yang kamu harapkan, masalahnya di pemilihan sertifikat, bukan di curl.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['TLS', 'Protokol yang mengenkripsi komunikasi sekaligus memverifikasi identitas server.'],
        ['HTTPS', 'HTTP yang dibungkus TLS, umumnya pada port 443.'],
        ['Certificate', 'File publik berisi domain, public key, masa berlaku, dan tanda tangan CA.'],
        ['Private key', 'Kunci rahasia pemilik domain; wajib dijaga dan tidak pernah dibagikan.'],
        ['CA', 'Certificate Authority — penerbit yang dianggap tepercaya oleh client.'],
        ['Certificate chain', 'Rantai sertifikat leaf → intermediate → root yang diverifikasi client.'],
        ['SNI', 'Ekstensi TLS yang membawa nama domain saat handshake untuk memilih sertifikat.'],
        ['TLS termination', 'HAProxy memutus TLS, mendekripsi, lalu meneruskan request sebagai HTTP ke backend.'],
        ['TLS passthrough', 'Koneksi TLS diteruskan mentah lewat <code>mode tcp</code> tanpa dekripsi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat sertifikat untuk <code>app.local</code> (ganti <code>-subj &quot;/CN=app.local&quot;</code>), gabungkan ke PEM, lalu buktikan <code>curl -k --resolve app.local:8443:127.0.0.1 https://app.local:8443/</code> menampilkan sertifikat itu lewat <code>openssl s_client</code>.</li><li>Hapus mount folder <code>certs</code> dari perintah <code>podman run</code>, jalankan lagi, lalu <b>catat pesan error</b> dari <code>podman logs haproxy</code>. Kembalikan mount-nya.</li><li>Tambahkan <code>ssl-min-ver TLSv1.3</code>, uji dengan <code>curl -ki --tlsv1.2 https://localhost:8443/</code> dan jelaskan hasilnya.</li><li><b>Checkpoint:</b> mampu mengonfigurasi HTTPS frontend lengkap dengan redirect, serta menjelaskan kapan TLS termination, passthrough, atau backend TLS yang tepat dipakai.</li></ol>'
    }
  ],
  recap: [
    '<b>TLS menjaga dua hal</b>: enkripsi untuk isi, sertifikat untuk identitas; handshake terjadi sekali di awal koneksi.',
    'HAProxy membutuhkan <b>satu file PEM</b> berisi sertifikat lalu key: <code>cat lab.crt lab.key &gt; lab.pem</code>, dipasang dengan <code>bind :443 ssl crt ...</code>.',
    '<b>HTTP dipaksa ke HTTPS</b> dengan <code>http-request redirect scheme https code 301 if !{ ssl_fc }</code>; versi lama dibatasi <code>ssl-min-ver TLSv1.2</code>.',
    '<b>Termination</b> membuka TLS untuk routing dan log, <b>passthrough</b> meneruskan mentah, <b>backend TLS</b> mengamankan hop internal — dan self-signed hanya layak untuk lab.'
  ]
});
