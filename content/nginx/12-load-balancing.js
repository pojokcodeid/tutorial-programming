/* ============================================================
   Pelajaran Nginx — 12: Load Balancing dengan upstream
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'load-balancing',
  title: 'Load Balancing dengan upstream',
  chapter: 'Load Balancing',
  duration: '10 menit',
  intro: [
    'Supermarket punya lima kasir. Kalau semua orang antri di <b>satu</b> kasir sementara empat menganggur, antrean menggunung padahal kapasitasnya besar. Manajer membagi rata — itu <b>round-robin</b>; kalau ada kasir paling sepi, pelanggan dialihkan ke sana — itu <b>least_conn</b>.',
    'Skenario paling penting justru saat ada kasir yang <i>sakit tiba-tiba</i>. Nginx open source tidak punya pengawas berkeliling; pengawas hanya bertindak ketika ada pelanggan <b>gagal dilayani</b>. Pelajaran ini membedah blok <code>upstream</code>, pilihan algoritma, <code>max_fails</code>/<code>fail_timeout</code>, keepalive, dan batasan health check.'
  ],
  objectives: [
    'Menulis blok upstream dan mengarahkan proxy_pass ke sana',
    'Membedakan round-robin, least_conn, ip_hash, dan weighted server',
    'Mengatur max_fails dan fail_timeout serta menjelaskan passive failure detection',
    'Mengaktifkan upstream keepalive dan menjelaskan batasan health check Nginx OSS'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu pintu, banyak backend</h3><p>Load balancer adalah <b>pembagi tugas</b> antar salinan aplikasi. Di Nginx, pengelompokan backend ditulis dalam blok <code>upstream</code>, lalu <code>proxy_pass</code> menunjuk ke nama blok itu — Nginx yang memilih backend tiap request.</p><table><thead><tr><th>Di supermarket</th><th>Di Nginx</th></tr></thead><tbody><tr><td>Antrean kasir</td><td>Request dari client</td></tr><tr><td>Deretan kasir</td><td>Blok <code>upstream</code></td></tr><tr><td>Kasir per orang</td><td>Satu <code>server backend-N:80;</code></td></tr><tr><td>Aturan pembagian</td><td>Algoritma (round-robin, least_conn, ip_hash)</td></tr><tr><td>Kasir yang sakit</td><td>Backend yang gagal → ditandai down</td></tr></tbody></table><p>Klien tetap hanya bicara ke satu pintu: <code>http://app.local</code>. Ia tidak tahu ada tiga atau tiga puluh salinan aplikasi di baliknya, dan tidak perlu tahu.</p>'
    },
    {
      type: 'example',
      title: 'Blok upstream dan pola proxy_pass yang benar',
      lang: 'text',
      output: false,
      code: `                    +----------------------------------+
 client -- HTTP --- |  upstream app_backend {          |
                    |    server backend-1:80;          |--> backend-1
                    |    server backend-2:80;          |--> backend-2
                    |    server backend-3:80;          |--> backend-3
                    +----------------------------------+

 location / { proxy_pass http://app_backend; }   <- nama upstream, TANPA path`,
      explain: [
        '<code>upstream</code> didefinisikan di context <code>http</code>, yaitu di luar blok <code>server</code>; tanpa parameter apa pun algoritmanya <b>round-robin</b>: request 1 ke backend-1, 2 ke backend-2, 3 ke backend-3, 4 kembali ke backend-1.',
        '<code>proxy_pass http://app_backend;</code> memakai <b>nama upstream tanpa URI</b> — aturan trailing slash dari Pelajaran 10 berlaku, jadi jangan menulis <code>http://app_backend/;</code> kecuali memang ingin mengubah URI.',
        'Nama host di dalam <code>upstream</code> di-resolve <b>saat konfigurasi di-load/reload</b>, sehingga backend harus sudah ada sebelum <code>nginx -t</code> dan reload dijalankan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Empat pilihan algoritma</h3><p>Tanpa konfigurasi tambahan kamu sudah memakai round-robin. Tiga opsi lain menutup kebutuhan yang berbeda:</p><table><thead><tr><th>Algoritma</th><th>Cara memilih</th><th>Cocok untuk</th><th>Catatan</th></tr></thead><tbody><tr><td><b>Round-robin</b> (default)</td><td>Bergantian satu per satu</td><td>Server sebanding</td><td>Tanpa syarat apa pun</td></tr><tr><td><code>least_conn</code></td><td>Paling sedikit koneksi aktif</td><td>Request berdurasi panjang</td><td>Koneksi lama menahan bobot</td></tr><tr><td><code>ip_hash</code></td><td>Hash IP klien → backend tetap</td><td>Sesi ke server yang sama</td><td>Lihat batasannya di bawah</td></tr><tr><td><code>hash $var</code></td><td>Hash variabel bebas (cookie)</td><td>Sticky berbasis cookie</td><td>Tambahkan <code>consistent</code></td></tr><tr><td>Weighted</td><td><code>server ... weight=N;</code></td><td>Kapasitas mesin berbeda</td><td>Round-robin berbobot</td></tr></tbody></table><p>Contoh gabungan: <code>least_conn;</code> bersama <code>server backend-1:80 weight=3;</code> dan <code>server backend-2:80 weight=2;</code> — backend-1 menerima tiga porsi, backend-2 dua porsi dari setiap lima request.</p>'
    },
    {
      type: 'text',
      html: '<h3>max_fails dan fail_timeout</h3><p>Dua parameter per baris <code>server</code> mengatur kapan backend dianggap down:</p><table><thead><tr><th>Parameter</th><th>Default</th><th>Arti</th></tr></thead><tbody><tr><td><code>max_fails</code></td><td><b>1</b></td><td>Jumlah kegagalan (di dalam <code>fail_timeout</code>) yang cukup menandai server down</td></tr><tr><td><code>fail_timeout</code></td><td><b>10s</b></td><td>(1) jendela hitung kegagalan, sekaligus (2) durasi server ditolak setelah dianggap down</td></tr></tbody></table><p>Setelah <code>fail_timeout</code> habis, server <b>dicoba lagi</b>; bila berhasil, status normal kembali. Inilah mekanisme <b>passive failure detection</b> — satu-satunya yang dimiliki Nginx OSS:</p><ul><li>Request gagal (koneksi ditolak/di-reset) → kegagalan dicatat pada server itu.</li><li>Gagal <b>≥ max_fails</b> di dalam <code>fail_timeout</code> → ditandai DOWN selama <code>fail_timeout</code>, request dialihkan.</li><li>Belum mencapai ambang → server tetap dipakai, kegagalan tetap dihitung.</li></ul><p>Kuncinya: <b>deteksi hanya terjadi saat ada request yang gagal.</b> Tanpa request berarti tanpa pengawasan, dan server yang hidup tapi terus membalas 500 tetap dianggap sehat karena Nginx hanya mengukur keberhasilan <b>koneksi</b>, bukan kualitas response.</p>'
    },
    {
      type: 'text',
      html: '<h3>Session persistence, keepalive, dan health check</h3><p><b>Sticky session</b> sering diminta, tapi punya batas fundamental: load balancer tetap harus siap memindahkan klien ketika backend sticky-nya mati — sehingga sesi yang disimpan di luar proses backend (Redis/database) jauh lebih aman daripada mengandalkan stickiness.</p><table><thead><tr><th>Teknik</th><th>Kekuatan</th><th>Keterbatasan</th></tr></thead><tbody><tr><td><code>ip_hash</code></td><td>Tanpa cookie, sederhana</td><td>IP berubah (mobile/VPN/NAT), IPv4 dan IPv6 beda hash, IP kantor berisi banyak user</td></tr><tr><td><code>hash $cookie_sessionid consistent;</code></td><td>Akurat per browser</td><td>Butuh cookie; klien tanpa cookie jatuh ke hash default</td></tr><tr><td>Sesi di Redis/DB (aplikasi)</td><td>Paling andal</td><td>Butuh dukungan aplikasi — <b>solusi yang disarankan</b></td></tr></tbody></table><p><b>Upstream keepalive</b> menghemat handshake tiap request, dengan tiga syarat yang harus lengkap: <code>keepalive 32;</code> di blok upstream, <code>proxy_http_version 1.1;</code>, dan <code>proxy_set_header Connection &quot;&quot;;</code>. Tanpa ketiganya, tiap request membangun koneksi TCP baru ke backend.</p><table><thead><tr><th></th><th>Nginx OSS (yang kita pakai)</th><th>Nginx Plus (berbayar)</th></tr></thead><tbody><tr><td><b>Passive check</b></td><td>Ada — <code>max_fails</code>/<code>fail_timeout</code></td><td>Ada</td></tr><tr><td><b>Active check</b> (probe berkala)</td><td><b>Tidak ada</b></td><td>Ada — directive <code>health_check</code></td></tr><tr><td>Endpoint cek khusus</td><td>Buat sendiri <code>/healthz</code> di aplikasi</td><td><code>match</code> + <code>health_check uri</code></td></tr></tbody></table><p>Tidak ada directive <code>health_check</code> di OSS — mengarangnya membuat <code>nginx -t</code> gagal. Alternatif jujurnya: health check eksternal (skrip/probe yang menandai server keluar-masuk), membeli Nginx Plus, atau memakai pendamping open source seperti HAProxy, Traefik, dan Envoy.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: least_conn, bobot, dan keepalive',
      lang: 'nginx',
      output: false,
      code: `upstream app_backend {
    least_conn;                          # pilih backend paling sedikit koneksi
    keepalive 32;
    server backend-1:80 weight=3 max_fails=3 fail_timeout=30s;
    server backend-2:80 weight=2 max_fails=3 fail_timeout=30s;
    server backend-3:80 weight=1;
}
server {
    listen 80;
    server_name app.local;
    location / {
        proxy_pass http://app_backend;    # nama upstream, tanpa URI
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}`,
      explain: [
        '<code>least_conn;</code> membuat backend dengan koneksi aktif paling sedikit diprioritaskan, sementara <code>weight=3/2/1</code> membagi porsi secara proporsional untuk kapasitas mesin yang berbeda.',
        '<code>max_fails=3 fail_timeout=30s</code> berarti tiga kegagalan dalam 30 detik menandai server down selama 30 detik, lalu dicoba lagi.',
        '<code>keepalive 32;</code> menyimpan hingga 32 koneksi idle ke backend — hanya efektif karena pasangan <code>proxy_http_version 1.1</code> dan <code>proxy_set_header Connection &quot;&quot;</code> ikut ditulis.',
        'Selalu jalankan <code>podman exec nginx-lab nginx -t</code> sebelum reload; nama host di upstream harus sudah bisa di-resolve pada saat itu.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: tiga backend identik',
      lang: 'bash',
      output: false,
      code: `podman network create lab-net 2>/dev/null || true
for i in 1 2 3; do
  podman run -d --name backend-$i --network lab-net docker.io/library/nginx:alpine
  podman exec backend-$i sh -c "echo 'SALAM DARI backend-$i' > /usr/share/nginx/html/index.html"
done

mkdir -p nginx-lb/conf.d
cat > nginx-lb/conf.d/lb.conf <<'EOF'
upstream app_backend {
    server backend-1:80;
    server backend-2:80;
    server backend-3:80;
}
server {
    listen 80;
    server_name app.local;
    location / { proxy_pass http://app_backend; }
}
EOF

podman run -d --name nginx-lab --network lab-net -p 8080:80 \\
  -v "$PWD/nginx-lb/conf.d:/etc/nginx/conf.d:ro" \\
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t`,
      explain: [
        'Loop <code>for i in 1 2 3</code> membuat tiga container bernama <code>backend-1</code> sampai <code>backend-3</code>, masing-masing menyimpan halaman yang menyebut namanya sendiri sehingga jawaban backend mudah dikenali.',
        'Ketiganya berada di <code>lab-net</code> yang sama dengan Nginx, jadi nama <code>backend-1</code> bisa di-resolve saat konfigurasi dibaca.',
        'Ekspektasi <code>nginx -t</code>: <code>syntax is ok</code> dan <code>test is successful</code>; kalau ada nama host yang salah, error muncul di langkah ini.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: round-robin dan passive failure detection',
      lang: 'bash',
      output: false,
      code: `# 1) amati round-robin: jalankan 6 kali
for i in 1 2 3 4 5 6; do curl -s -H 'Host: app.local' http://localhost:8080/; done
# ekspektasi berurutan: backend-1, backend-2, backend-3, backend-1, backend-2, backend-3

# 2) uji least_conn: tambahkan "least_conn;" di upstream, lalu reload
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload

# 3) uji passive failure detection
podman stop backend-2
curl -i -H 'Host: app.local' http://localhost:8080/ | head -1
podman logs nginx-lab 2>&1 | grep "backend-2" | tail -1
curl -s -H 'Host: app.local' http://localhost:8080/
podman start backend-2 && sleep 12
for i in 1 2 3; do curl -s -H 'Host: app.local' http://localhost:8080/; done`,
      explain: [
        'Enam request pertama berputar rata: backend-1, backend-2, backend-3, lalu berulang — itulah bukti round-robin sebagai default.',
        'Setelah <code>backend-2</code> dimatikan, satu request bisa menjawab <code>502 Bad Gateway</code> dengan log <code>connect() failed (111: Connection refused) ... upstream: &quot;http://app_backend/&quot;</code>; pada request berikutnya backend-2 dianggap down dan dialihkan.',
        '<code>sleep 12</code> melewati <code>fail_timeout</code> default 10 detik, sehingga setelah <code>podman start backend-2</code> ketiganya kembali melayani — server dicoba lagi otomatis tanpa reload.',
        'Untuk mengubah algoritma, edit file upstream lalu jalankan <code>nginx -t</code> dan <code>nginx -s reload</code> — tidak perlu membuat ulang container.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum load balancing',
      text: '<ul><li><b><code>proxy_pass http://app_backend/;</code> (ada slash)</b> — mengubah URI; untuk upstream biarkan tanpa path kecuali memang disengaja.</li><li><b>Menganggap <code>ip_hash</code> menjamin sesi selamanya</b> — IP berubah, NAT dipakai bersama, dan server down memutus rantai hash.</li><li><b>Mencari directive <code>health_check</code> di OSS</b> — itu fitur Nginx Plus; <code>nginx -t</code> akan menolaknya.</li><li><b>Berpikir passive check mendeteksi server sakit-tapi-hidup</b> — hanya kegagalan koneksi yang terukur; response 500 terus tetap dianggap sehat.</li><li><b>Lupa <code>proxy_http_version 1.1</code> + <code>Connection &quot;&quot;</code></b> saat memakai <code>keepalive</code> — keepalive tidak pernah aktif.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Uji distribusi dengan loop, bukan feeling',
      text: '<p>Untuk membuktikan algoritma, jalankan <code>for i in 1 2 3 4 5 6; do curl -s ...; done</code> lalu hitung kemunculan tiap nama backend. Kalau kamu menambah <code>weight=5</code> ke satu server, hitung lagi 60 request — perbedaannya harus terlihat angka, bukan sekadar terasa. Ini juga cara tercepat memastikan reload konfigurasi benar-benar mengubah perilaku.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['upstream', 'Blok pengelompok server backend untuk dibebani bersama.'],
        ['Round-robin', 'Distribusi bergantian satu per satu; algoritma default.'],
        ['least_conn', 'Memilih backend dengan koneksi aktif paling sedikit.'],
        ['ip_hash', 'Sticky sesi berdasarkan hash IP klien.'],
        ['weight', 'Bobot server untuk distribusi yang tidak seragam.'],
        ['max_fails / fail_timeout', 'Ambang kegagalan dan durasi server ditandai down.'],
        ['Passive health check', 'Deteksi gagal hanya saat request nyata gagal; milik Nginx OSS.'],
        ['Active health check', 'Probe berkala tanpa menunggu request; fitur Nginx Plus.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Ubah ke <code>ip_hash</code>, akses enam kali, lalu jelaskan apa yang terjadi kalau IP-mu berubah — dan kenapa sesi sebaiknya disimpan di Redis, bukan di memori backend.</li><li>Beri <code>weight=5</code> ke <code>backend-1</code>, hitung perkiraan distribusi 60 request, lalu buktikan dengan loop curl dan hitung kemunculan tiap nama.</li><li>Jelaskan ke temanmu: kenapa server yang <b>mengembalikan 500 terus-menerus</b> tetap dianggap sehat oleh Nginx OSS, dan sebutkan <b>2 solusi</b> untuk kasus itu.</li></ol>'
    }
  ],
  recap: [
    '<code>upstream</code> mengelompokkan backend; <code>proxy_pass http://nama_upstream;</code> mendistribusikan request ke anggotanya.',
    'Default <b>round-robin</b>; <b>least_conn</b> untuk request panjang, <b>ip_hash</b>/<b>hash</b> untuk sticky, <b>weight</b> untuk kapasitas beda.',
    '<b>max_fails + fail_timeout</b> menentukan ambang server down dan berapa lama server ditolak sebelum dicoba lagi.',
    'Nginx OSS hanya punya <b>passive detection</b> (active health check = fitur Plus); <b>keepalive</b> butuh <code>proxy_http_version 1.1</code> + <code>Connection &quot;&quot;</code>, dan session persistence adalah optimasi, bukan jaminan.'
  ]
});
