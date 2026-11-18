/* ============================================================
   Pelajaran Nginx — 15: Security Hardening
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'security-hardening',
  title: 'Security Hardening',
  chapter: 'Security Hardening',
  duration: '10 menit',
  intro: [
    'Menyimpan uang di rumah bukan cuma soal gembok pintu: <b>pagar</b> menentukan siapa boleh masuk halaman, <b>satpam</b> menolak tamu yang datang berbondong-bondong, <b>lemari besi</b> menjaga barang berharga, dan pintu belakang tidak pernah dibiarkan terbuka.',
    'Hardening Nginx juga begitu — <b>bukan satu setting ajaib, tapi puluhan hal kecil yang menutup celah satu per satu</b>: menyembunyikan versi, membatasi IP dan method, membatasi laju request, memasang header keamanan, sampai mengunci protokol TLS. Pelajaran ini merangkumnya jadi satu konfigurasi lengkap beserta lab pembuktian bertahap.'
  ],
  objectives: [
    'Menutup informasi berlebih dengan server_tokens dan menerapkan least privilege pada container Nginx',
    'Membatasi akses per IP (allow/deny), per path (dotfiles, /private, /admin), dan per method (limit_except)',
    'Menerapkan rate limit (limit_req), connection limit (limit_conn), dan client_max_body_size beserta cara menguji burst-nya',
    'Memasang security headers, TLS hardening, dan HSTS; serta menjelaskan batas Nginx: ia pagar, bukan pengganti authorization aplikasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Rumah aman itu tiga lapis</h3><p>Bayangkan menyimpan uang di rumah. Gembok pintu saja tidak cukup: <b>pagar</b> menentukan siapa boleh masuk halaman, <b>satpam</b> menolak tamu yang datang berbondong-bondong, <b>lemari besi</b> menjaga barang berharga, dan pintu belakang tidak pernah dibiarkan terbuka. Setiap lapis menutup celah berbeda.</p><table><thead><tr><th>Di rumah</th><th>Di Nginx</th></tr></thead><tbody><tr><td>Pagar &amp; gerbang</td><td><code>allow</code> / <code>deny</code>, <code>limit_except</code></td></tr><tr><td>Satpam anti-kerumunan</td><td><code>limit_req</code>, <code>limit_conn</code></td></tr><tr><td>Ukuran koper yang boleh lewat</td><td><code>client_max_body_size</code></td></tr><tr><td>Nama plate pintu &amp; laci terbuka</td><td><code>server_tokens off</code>, blok <code>.git</code>, <code>.env</code>, <code>/private</code></td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Bentuk penyaringan satu request dari luar ke dalam',
      lang: 'text',
      output: false,
      code: `request ─┬─ allow/deny ─────── 403 (IP)          limit_except ── 403 (method)
         ├─ limit_req ──────── 503 (laju)        client_max_body_size ── 413
         ├─ limit_conn ─────── 503 (koneksi)     setelah lolos semua:
         └─ location ───────── 200 konten  |  403 dotfile (.env, /private)`,
      explain: [
        'Pagar pertama adalah <code>allow</code>/<code>deny</code>: IP yang tidak diizinkan dihentikan dengan <b>403</b> sebelum menyentuh konten; <code>limit_except</code> menolak method yang dilarang dengan 403.',
        'Laju dan jumlah koneksi dijaga <code>limit_req</code> dan <code>limit_conn</code> — keduanya menjawab <b>503</b> dan menulis pesan <code>limiting requests</code>/<code>limiting connections</code> ke error log.',
        'Body yang kebesaran dihentikan <code>client_max_body_size</code> dengan <b>413</b>; hanya request yang lolos semua pagar sampai ke <code>location</code>, tempat file rahasia diblokir 403 dan konten sah dibalas 200.'
      ]
    },
    {
      type: 'text',
      html: '<h3>server_tokens dan least privilege</h3><p>Directive <code>server_tokens on|off|build|string</code> (default <code>on</code>) mengendalikan baris <code>Server:</code> dan versi pada halaman error 4xx/5xx. Versi yang terekspos memberi petunjuk ke pelaku scan: &quot;nginx/1.27.0 — ada CVE belum patch?&quot;.</p><table><thead><tr><th>Directive</th><th>Efek</th></tr></thead><tbody><tr><td><code>server_tokens off</code></td><td><code>Server: nginx</code> tanpa versi; halaman error juga tanpa versi</td></tr><tr><td><code>server_tokens build</code></td><td>versi + nama build (1.11.10)</td></tr><tr><td><code>server_tokens &quot;web-$hostname&quot;</code></td><td>teks kustom (khusus Nginx Plus/komersial)</td></tr></tbody></table><p><b>Least privilege</b> = beri Nginx sesedikit mungkin untuk tugasnya:</p><ul><li>worker berjalan sebagai user <code>nginx</code>, bukan <code>root</code> (bawaan image — jangan ditimpa <code>user root;</code>).</li><li>konten dan konfigurasi bersifat baca-saja bagi container.</li><li>hanya port 80/443 yang diekspos; upstream berada di jaringan internal.</li><li>secret diberi permission <code>600</code>, bukan <code>644</code>.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>allow/deny dan proteksi path</h3><p>Direktif <code>allow</code> dan <code>deny</code> menerima IP/CIDR atau <code>all</code>, dan berlaku di konteks <code>http</code>, <code>server</code>, <code>location</code>, serta <code>limit_except</code>.</p><p>Aturan dibaca <b>dari atas dan berhenti pada kecocokan pertama</b>, jadi <code>allow</code> harus ditulis <b>sebelum</b> <code>deny all;</code> — bila urutannya terbalik, semua orang ditolak. Begitu ada minimal satu <code>allow</code>/<code>deny</code> di lokasi itu, aturan dari level atas tidak diwariskan lagi.</p><p>Praktiknya: lokasi <code>/admin/</code> memakai <code>allow 10.0.0.0/8;</code> lalu <code>deny all;</code>; lokasi <code>/private/</code> cukup <code>deny all;</code>; file rahasia diblokir satu regex: <code>location ~ /\\.(?!well-known) { deny all; }</code> — negative lookahead menyisakan <code>/.well-known/acme-challenge/...</code> tetap terbaca agar renewal Let&#39;s Encrypt tidak ikut mati.</p><p>Penting: perlindungan file di Nginx hanya menolak <b>baca lewat HTTP</b> — permission di disk tetap wajib, dan <code>autoindex off</code> (default) jangan dinyalakan di direktori publik.</p>'
    },
    {
      type: 'text',
      html: '<h3>Rate limit, connection limit, body &amp; method</h3><p>Dua pagar untuk mencegah penyalahgunaan laju dan resource:</p><table><thead><tr><th>Directive</th><th>Fungsi</th><th>Bila melanggar</th></tr></thead><tbody><tr><td><code>limit_req_zone key zone=name:size rate=rate</code></td><td>membuat zona status di RAM (konteks <code>http</code>)</td><td>—</td></tr><tr><td><code>limit_req zone=.. burst=n [nodelay]</code></td><td>batasi laju request per key</td><td><b>503</b>, log <code>limiting requests</code></td></tr><tr><td><code>limit_conn_zone key zone=name:size</code></td><td>membuat zona koneksi (konteks <code>http</code>)</td><td>—</td></tr><tr><td><code>limit_conn zone number</code></td><td>maks koneksi simultan per key</td><td><b>503</b>, log <code>limiting connections</code></td></tr></tbody></table><table><thead><tr><th>Directive</th><th>Default</th><th>Peran</th></tr></thead><tbody><tr><td><code>client_max_body_size 1m</code></td><td><code>1m</code></td><td>body melebihi batas → <b>413</b>; <code>0</code> = pemeriksaan dimatikan</td></tr><tr><td><code>limit_except GET HEAD { deny all; }</code></td><td>—</td><td>semua method selain GET/HEAD ditolak (HEAD ikut saat GET ditulis)</td></tr></tbody></table><p>Tanpa <code>nodelay</code>, request melebihi burst <b>diantrikan</b> dulu; begitu meledak melewati burst → ditolak. Ubah kode penolakan dengan <code>limit_req_status 429;</code> atau <code>limit_conn_status 503;</code>. Variabel <code>$binary_remote_addr</code> hanya 4 byte untuk IPv4 — jauh lebih hemat daripada <code>$remote_addr</code>. Endpoint sensitif dikunci berlapis: <code>allow</code>/<code>deny</code> sebagai pagar kasar, lalu <code>auth_basic</code> (opsional) dengan file <code>.htpasswd</code> berpermission <code>600</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Security headers</h3><table><thead><tr><th>Header</th><th>Nilai contoh</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>X-Content-Type-Options</code></td><td><code>nosniff</code></td><td>larang browser menebak tipe konten (anti MIME sniffing)</td></tr><tr><td><code>X-Frame-Options</code></td><td><code>SAMEORIGIN</code></td><td>anti clickjacking (generasi lama, pelengkap CSP)</td></tr><tr><td><code>Content-Security-Policy</code></td><td><code>default-src &#39;self&#39;; frame-ancestors &#39;self&#39;</code></td><td>resource mana yang boleh dimuat; mulai longgar, perketat bertahap</td></tr><tr><td><code>Referrer-Policy</code></td><td><code>strict-origin-when-cross-origin</code></td><td>sembunyikan URL lengkap saat pindah domain</td></tr></tbody></table><p>Dua aturan baca wajib: (1) selalu pakai parameter <b><code>always</code></b> agar header ikut terkirim pada 403/404; (2) <b>satu <code>add_header</code> di sebuah location membuat seluruh <code>add_header</code> warisan dari level atas gugur</b> untuk lokasi itu — daftarkan ulang semuanya di lokasi tersebut.</p>'
    },
    {
      type: 'text',
      html: '<h3>TLS hardening, HSTS &amp; manajemen secret</h3><ul><li><code>ssl_protocols TLSv1.2 TLSv1.3;</code> — TLS 1.0/1.1 sudah usang; cipher dibersihkan dengan <code>ssl_ciphers HIGH:!aNULL:!MD5;</code> plus <code>ssl_session_cache shared:SSL:10m;</code>.</li><li><code>add_header Strict-Transport-Security &quot;max-age=31536000; includeSubDomains&quot; always;</code> mengunci browser ke HTTPS. <code>includeSubDomains</code> menyeret <b>semua</b> subdomain — nyalakan hanya setelah semuanya siap HTTPS.</li><li>Kunci privat diberi permission <code>600</code>, file <code>certs/</code>, <code>*.key</code>, <code>.env</code>, dan <code>.htpasswd</code> masuk <code>.gitignore</code>.</li><li>Simpan secret sebagai <b>file yang di-mount read-only</b>, bukan variabel lingkungan — env mudah terbaca lewat <code>podman inspect</code>. Pisahkan konfigurasi rahasia ke file kecil (<code>include /etc/nginx/snippets/secrets.conf;</code>) agar tidak ikut ter-commit.</li><li>Pin <b>tag versi</b> lalu <b>digest</b> image (<code>nginx:1.27-alpine</code>, bukan <code>latest</code>), jadwalkan rebuild berkala, dan cek advisori — hardening percuma kalau versinya basi.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: satu server block yang sudah di-hardening',
      lang: 'nginx',
      output: false,
      code: `# di dalam konteks http (nginx.conf atau file yang di-include)
limit_req_zone  $binary_remote_addr zone=req10:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=addr1:10m;

server {
    server_name localhost;
    root /usr/share/nginx/html;
    server_tokens off;
    client_max_body_size 1m;
    add_header X-Content-Type-Options  "nosniff" always;
    add_header X-Frame-Options         "SAMEORIGIN" always;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'" always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    location ~ /\\.(?!well-known) { deny all; }
    location /private/           { deny all; }
    location /admin/             { allow 10.0.0.0/8; deny all; }
    location /api/               { limit_req zone=req10 burst=5; limit_except GET HEAD { deny all; } try_files $uri =404; }
    location /download/          { limit_conn addr1 2; limit_rate 500k; try_files $uri =404; }
}`,
      explain: [
        '<code>limit_req_zone</code> dan <code>limit_conn_zone</code> <b>wajib di konteks <code>http</code></b> — <code>nginx -t</code> akan menolaknya bila ditulis di dalam <code>server{}</code>.',
        'Pagar IP: <code>allow 10.0.0.0/8;</code> ditulis <b>sebelum</b> <code>deny all;</code> karena kecocokan pertama menang; regex dotfiles menyisakan <code>/.well-known/acme-challenge/</code> agar renewal Let&#39;s Encrypt tetap jalan.',
        '<code>burst=5</code> menyediakan antrian 5 request; tanpa <code>burst</code> nilainya 0 sehingga request wajar pun bisa kena 503. <code>limit_rate 500k</code> membatasi kecepatan unduh per koneksi di <code>/download/</code>.',
        '<code>limit_except GET HEAD { deny all; }</code> membuat konten tetap bisa di-GET sementara POST/PUT/DELETE diblokir total, dan <code>client_max_body_size 1m</code> menjawab 413 pada body yang kebesaran.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (1/2): container, file uji, dan konfigurasi hardening',
      lang: 'bash',
      output: false,
      code: `podman rm -f nginx-lab 2>/dev/null
podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
podman exec nginx-lab sh -c 'rm -f /etc/nginx/conf.d/default.conf
mkdir -p /usr/share/nginx/html/private /usr/share/nginx/html/admin /usr/share/nginx/html/api /usr/share/nginx/html/.well-known/acme-challenge /usr/share/nginx/html/.git
echo RAHASIA > /usr/share/nginx/html/.env
echo cfg > /usr/share/nginx/html/.git/config
echo token > /usr/share/nginx/html/.well-known/acme-challenge/tok123
echo ADMIN > /usr/share/nginx/html/admin/index.html
echo OK > /usr/share/nginx/html/api/hello.txt
echo HALO > /usr/share/nginx/html/private/inbox.txt'

podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/15-hardening.conf' <<'NGINX'
limit_req_zone  $binary_remote_addr zone=req10:10m rate=10r/s;
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    server_tokens off;
    client_max_body_size 1k;
    add_header X-Content-Type-Options  "nosniff" always;
    add_header X-Frame-Options         "SAMEORIGIN" always;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'" always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    location ~ /\\.(?!well-known) { deny all; }
    location /private/           { deny all; }
    location /admin/             { allow 127.0.0.1; deny all; }
    location /api/               { limit_req zone=req10 burst=5; limit_except GET HEAD { deny all; } try_files $uri =404; }
    location /                   { try_files $uri $uri/ =404; }
}
NGINX

podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload && sleep 1`,
      explain: [
        'Container dibuat bersih, lalu file uji disiapkan: <code>.env</code> dan <code>.git/config</code> yang harus diblokir, challenge Let&#39;s Encrypt yang harus tetap terbaca, plus konten sah di <code>/admin/</code>, <code>/api/</code>, dan <code>/private/</code> untuk pembanding.',
        'Konfigurasi ditulis lewat heredoc <code>&lt;&apos;NGINX&apos;</code> ke <code>/etc/nginx/conf.d/15-hardening.conf</code> — cara menulis file di container tanpa membuka shell interaktif.',
        'Ekspektasi <code>nginx -t</code>: <code>syntax is ok</code> dan <code>test is successful</code>. Reload digabung dengan <code>&amp;&amp;</code> sehingga hanya dijalankan bila test lolos — inilah kebiasaan aman yang dipakai sepanjang bab ini.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (2/2): uji bertahap — identitas, akses, method, burst',
      lang: 'bash',
      output: false,
      code: `# 1) identitas + header keamanan -> Server: nginx (tanpa versi) + 4 header keamanan
curl -s -D - -o /dev/null http://localhost:8080/ | grep -iE '^server|x-content-type|x-frame|content-security|referrer'

# 2) file & path terlarang -> urutannya: 403, 403, 403, 200, 200
for p in /.env /.git/config /private/inbox.txt /.well-known/acme-challenge/tok123 /api/hello.txt; do
  printf '%s -> ' "$p"; curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080$p; done

# 3) IP-mu belum diizinkan (403), lalu izinkan lewat sed (200)
curl -s -o /dev/null -w 'admin sebelum allow -> %{http_code}\\n' http://localhost:8080/admin/
IP=$(podman logs --tail 20 nginx-lab 2>&1 | grep '"GET' | tail -1 | awk '{print $1}')
podman exec nginx-lab sed -i "s|allow 127.0.0.1;|allow $IP;|" /etc/nginx/conf.d/15-hardening.conf
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload && sleep 1
curl -s -o /dev/null -w 'admin sesudah allow -> %{http_code}\\n' http://localhost:8080/admin/

# 4) method & body -> urutannya: 200, 403 (limit_except), 413 (client_max_body_size 1k)
printf 'GET  /api    -> '; curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/api/hello.txt
printf 'POST /api    -> '; curl -s -o /dev/null -w '%{http_code}\\n' -X POST -d 'abc' http://localhost:8080/api/hello.txt
printf 'POST body 4k -> '; curl -s -o /dev/null -w '%{http_code}\\n' -X POST -d "$(yes | head -c 4096)" http://localhost:8080/api/hello.txt

# 5) burst: loop sekuensial tidak meledak, 15 request paralel meledak
sleep 3
for i in $(seq 1 6); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/hello.txt; done; echo
sleep 3
for i in $(seq 1 15); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/hello.txt & done; wait; echo
podman logs nginx-lab 2>&1 | grep -i 'limiting requests' | tail -2`,
      explain: [
        'Uji 1 mencetak <code>Server: nginx</code> <b>tanpa versi</b> plus empat header keamanan — bukti <code>server_tokens off</code> dan parameter <code>always</code> bekerja.',
        'Uji 2 harus berurutan <code>403, 403, 403, 200, 200</code>: dotfile dan <code>/private/</code> diblokir, tetapi challenge Let&#39;s Encrypt serta <code>/api/</code> tetap terbaca.',
        'Uji 3: sebelum IP diizinkan, <code>/admin/</code> menjawab 403. IP diambil dari log karena di container IP-mu adalah gateway podman, bukan 127.0.0.1 — sesudah <code>allow</code> diubah hasilnya 200.',
        'Uji 4 menghasilkan <code>200, 403, 413</code>. Uji 5: loop sekuensial semua 200, sedangkan 15 request paralel melebihi <code>burst=5</code> sehingga sebagian menjawab 503 — buktinya baris <code>limiting requests</code> di log.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum',
      text: '<ul><li><code>limit_req_zone</code>/<code>limit_conn_zone</code> ditulis di <code>server{}</code> → <code>nginx -t</code> gagal: kedua directive ini hanya boleh di konteks <code>http</code>.</li><li><code>deny all;</code> ditulis sebelum <code>allow &lt;IP&gt;;</code> → semua orang ditolak, termasuk IP yang kamu izinkan (kecocokan pertama menang).</li><li>Lupa <code>burst</code> → <code>burst=0</code>, lalu menguji dengan loop sekuensial → kesimpulan keliru &quot;limit tidak bekerja&quot;. Uji dengan request paralel.</li><li>Menambah satu <code>add_header</code> di location → seluruh header keamanan warisan dari <code>server{}</code> hilang; dan tanpa <code>always</code> mereka absen pada 403/404.</li><li><code>client_max_body_size</code> terlalu kecil → upload user gagal 413 (browser sering tidak bisa menampilkan error ini dengan baik).</li><li>Regex dotfiles tanpa pengecualian <code>(?!well-known)</code> → challenge Let&#39;s Encrypt ikut diblokir.</li><li><code>return 200 ...;</code> di lokasi yang juga memuat <code>deny all</code> → <code>return</code> jalan di fase rewrite sebelum fase akses, jadi <code>deny</code> terlewat percuma.</li><li><code>server_tokens off</code> saja tidak cukup kalau backend tetap menampilkan versi di header lain seperti <code>X-Powered-By</code>.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Nginx bukan pengganti authorization aplikasi</h3><p>Nginx tahu <b>IP, path, method, ukuran body, dan laju request</b>; Nginx <b>tidak tahu</b> peran user, kepemilikan data, atau sisa saldo rekening. Nginx adalah pagar, bukan buku induk hak akses.</p><ul><li><code>allow</code>/<code>deny</code> adalah otorisasi kasar satu lapis — hak akses per user/role/objek tetap di aplikasi (session, RBAC, cek kepemilikan).</li><li><code>X-Forwarded-For</code> mentah <b>tidak boleh dipercaya</b> untuk <code>allow/deny</code>: client bisa memalsukannya.</li><li>Backend <b>hanya</b> boleh bisa diakses dari Nginx — kalau backend terbuka ke jaringan publik, semua aturan di pelajaran ini gampang dilewati.</li></ul>'
    },
    {
      type: 'vocab',
      items: [
        ['server_tokens', 'Sembunyikan/tampilkan versi Nginx di header dan halaman error.'],
        ['Least privilege', 'Beri hak akses sesedikit mungkin untuk tugas itu.'],
        ['allow / deny', 'Izin/tolak berdasarkan IP atau CIDR, dicek berurutan.'],
        ['limit_req_zone', 'Zona RAM di konteks http untuk menyimpan status laju request.'],
        ['burst', 'Jumlah request berlebih yang masih diantrikan sebelum ditolak.'],
        ['limit_conn_zone', 'Zona RAM untuk batas koneksi bersamaan per key.'],
        ['client_max_body_size', 'Batas ukuran body request (413 bila dilewati).'],
        ['limit_except', 'Batasi method HTTP tertentu dalam sebuah location.'],
        ['HSTS', 'Header yang memaksa browser memakai HTTPS.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Hapus baris <code>allow 127.0.0.1;</code> dari lokasi <code>/admin/</code>, uji lagi, lalu jelaskan kenapa hasilnya 403 baik sebelum maupun sesudah kamu menambah IP — dan mengapa <code>deny all;</code> harus tetap di urutan terakhir.</li><li>Ubah <code>rate=10r/s</code> menjadi <code>rate=1r/s</code>, ulangi loop paralel 15 request, dan bandingkan jumlah 503 — tunjukkan pula baris <code>limiting requests</code> pada <code>podman logs</code>.</li><li>Buat dokumen <code>upload.txt</code> di <code>/private/</code>, buktikan 403, lalu pindahkan ke <code>/public/</code> dan buktikan 200 tanpa mengubah konfigurasi Nginx sama sekali. Apa artinya bagi pemahamanmu soal otorisasi di Nginx vs di aplikasi?</li></ol>'
    }
  ],
  recap: [
    '<b>server_tokens off</b> menyembunyikan versi; least privilege = akses, permission, dan port sesedikit mungkin untuk tugas itu.',
    '<b>allow sebelum deny all</b> (kecocokan pertama menang); dotfiles diblokir regex dengan pengecualian <code>.well-known</code> agar TLS renewal tetap jalan.',
    '<code>limit_req</code> membatasi <b>laju</b>, <code>limit_conn</code> membatasi <b>koneksi bersamaan</b> (sama-sama 503); <code>client_max_body_size</code> menjawab 413 dan <code>limit_except</code> menutup method selain GET/HEAD.',
    'Security headers selalu pakai <code>always</code> dan didaftarkan ulang di tiap location yang memakai <code>add_header</code>; Nginx tetap <b>pagar — bukan pengganti authorization aplikasi</b>.'
  ]
});
