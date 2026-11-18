/* ============================================================
   Pelajaran Nginx — 11: Reverse Proxy Lanjutan: Header, Timeout & WebSocket
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'reverse-proxy-lanjutan',
  title: 'Reverse Proxy Lanjutan: Header, Timeout & WebSocket',
  chapter: 'Reverse Proxy',
  duration: '10 menit',
  intro: [
    'Kirim paket lewat kurir. Kalau <b>alamat pengirim lengkap</b>, penerima tahu siapa pengirimnya dan bisa membalas; kalau label hilang, balasan bisa nyasar. Request yang diteruskan Nginx juga begitu — tanpa label yang tepat, backend salah tahu domain asli, IP klien asli, dan skema <code>http</code>/<code>https</code>.',
    'Label-label itu bernama <b>header forwarding</b>. Selain itu, pelajaran ini membahas tiga hal yang membuat proxy layak dipakai di produksi: <b>timeout</b>, <b>buffering</b>, dan <b>WebSocket</b> — plus cara membaca beda <code>502</code> dan <code>504</code> serta menahan upload besar dengan <code>client_max_body_size</code>.'
  ],
  objectives: [
    'Meneruskan header penting: Host, X-Real-IP, X-Forwarded-For, dan X-Forwarded-Proto',
    'Mengatur ketiga timeout proxy dan memprediksi dampaknya',
    'Meneruskan WebSocket lewat header Upgrade dan Connection',
    'Membatasi ukuran upload serta mendiagnosis 502 vs 504'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Empat label yang wajib menempel</h3><p>Begitu request melewati Nginx, klien asli hanya terlihat sebagai IP container proxy. Supaya aplikasi tetap tahu konteks asli, empat header ini harus diteruskan secara eksplisit:</p><table><thead><tr><th>Header</th><th>Dibuat dari</th><th>Kenapa backend butuh</th></tr></thead><tbody><tr><td><code>Host</code></td><td><code>$host</code></td><td>Aplikasi tahu domain asli (untuk generasi URL)</td></tr><tr><td><code>X-Real-IP</code></td><td><code>$remote_addr</code></td><td>IP klien asli (satu hop)</td></tr><tr><td><code>X-Forwarded-For</code></td><td><code>$proxy_add_x_forwarded_for</code></td><td>Rantai IP: klien → Nginx → backend</td></tr><tr><td><code>X-Forwarded-Proto</code></td><td><code>$scheme</code></td><td>Skema asli <code>http</code>/<code>https</code> untuk redirect dan cookie</td></tr></tbody></table><p>Alurnya: browser mengirim <code>Host: app.local</code>, Nginx meneruskannya sekaligus menambahkan IP klien dan skema, lalu backend membaca ketiganya seolah-olah klien bicara langsung kepadanya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Aturan warisan yang sering menjebak</h3><p><code>proxy_set_header</code> di satu level <b>diwarisi dari level atas hanya jika</b> level itu tidak punya <code>proxy_set_header</code> sama sekali. Konsekuensinya tajam: <b>menambah satu saja <code>proxy_set_header</code> di <code>location</code> membatalkan seluruh set dari <code>server</code></b>.</p><p>Karena itu header ditaruh di file terpisah lalu dipakai ulang dengan <code>include snippets/proxy-headers.conf;</code> — menulis ulang empat baris di setiap location, atau sekali di file snippet. Praktik ini juga membuat penambahan location baru tidak pernah melupakan header.</p>'
    },
    {
      type: 'text',
      html: '<h3>Tiga timeout proxy</h3><p>Timeout menghitung tiga fase berbeda; defaultnya sama, 60 detik, tapi dampaknya jauh berbeda:</p><table><thead><tr><th>Directive</th><th>Default</th><th>Menghitung waktu...</th></tr></thead><tbody><tr><td><code>proxy_connect_timeout</code></td><td>60s</td><td>Membuka <b>koneksi TCP</b> ke backend</td></tr><tr><td><code>proxy_read_timeout</code></td><td>60s</td><td>Menunggu <b>response</b> dari backend</td></tr><tr><td><code>proxy_send_timeout</code></td><td>60s</td><td>Mengirim <b>request</b> ke backend</td></tr></tbody></table><p>Paling sering menyiksa di produksi adalah <code>proxy_read_timeout</code>: koneksi terbuka, tetapi backend belum selesai memproses — misal query lambat atau job panjang. Menaikkan timeout menyelesaikan gejalanya, bukan penyebabnya; optimasi aplikasi tetap langkah utama.</p><h4>Buffering: tampung dulu, kirim pelan-pelan</h4><ul><li><code>proxy_buffering on</code> (default) — Nginx menampung response ke buffer dulu sehingga backend cepat bebas, RAM terpakai.</li><li><code>proxy_request_buffering on</code> (default) — body request (mis. upload) dibaca dulu sebelum diteruskan.</li><li><code>proxy_buffers 8 4k</code> / <code>8 8k</code> — jumlah dan ukuran buffer response.</li></ul><p>Matikan <code>proxy_buffering</code> untuk <b>streaming/SSE</b> yang harus mengalir per-event, dan matikan <code>proxy_request_buffering</code> bila backend ingin menerima upload secara streaming.</p>'
    },
    {
      type: 'text',
      html: '<h3>WebSocket: upgrade koneksi</h3><p>WebSocket meminta perubahan protokol lewat header <code>Upgrade: websocket</code>. Header itu hanya dikenal HTTP/1.1, sedangkan default Nginx bicara HTTP/1.0 ke backend — jadi <code>proxy_http_version 1.1</code> <b>wajib</b>, bersama dua header forwarding:</p><ul><li><code>proxy_set_header Upgrade $http_upgrade;</code> — meneruskan permintaan upgrade apa adanya.</li><li><code>proxy_set_header Connection &quot;upgrade&quot;;</code> — menandai koneksi ini sebagai upgrade.</li><li><code>proxy_read_timeout 3600s;</code> — koneksi WebSocket bisa hidup sangat lama tanpa data.</li></ul><p>Untuk location yang melayani HTTP biasa sekaligus WS, ganti baris <code>Connection</code> dengan variabel hasil <code>map</code>, agar nilai <code>Connection</code> hanya <code>upgrade</code> saat klien benar-benar meminta:</p><pre style="background:rgba(127,127,127,.12);padding:10px;border-radius:8px;overflow:auto">map $http_upgrade $connection_upgrade {\n    default upgrade;\n    &#39;&#39;      close;\n}</pre><h4>Upload: client_max_body_size</h4><p>Default hanya <b>1 MB</b>. Bila dilanggar, Nginx menjawab <b>413 Request Entity Too Large</b> sebelum body diteruskan ke backend. Naikkan hanya di location yang memang menerima file besar (mis. <code>client_max_body_size 50m;</code>), jangan global tanpa perhitungan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Diagnosis: 502 vs 504</h3><p>Dua status ini sering tertukar, padahal penyebab dan solusinya berlawanan:</p><table><thead><tr><th></th><th><b>502 Bad Gateway</b></th><th><b>504 Gateway Timeout</b></th></tr></thead><tbody><tr><td><b>Arti</b></td><td>Nginx <b>tidak bisa dapat jawaban</b> dari backend</td><td>Backend <b>terlalu lama</b> menjawab</td></tr><tr><td><b>Penyebab umum</b></td><td>Backend mati, port salah, aplikasi crash, koneksi ditolak</td><td>Backend lambat/nyangkut, query lambat, timeout terlalu kecil</td></tr><tr><td><b>Pesan error.log</b></td><td><code>connect() failed (111: Connection refused)</code></td><td><code>upstream timed out (110: Connection timed out)</code></td></tr><tr><td><b>Timeout terkait</b></td><td><code>proxy_connect_timeout</code></td><td><code>proxy_read_timeout</code></td></tr><tr><td><b>Solusi</b></td><td>Perbaiki aplikasi, port, atau jaringan</td><td>Optimasi proses, naikkan timeout, atau terima batasnya</td></tr></tbody></table><p>Aturan praktisnya: <b>menaikkan timeout tidak menyelesaikan 502</b>, dan <b>memperbaiki port tidak menyelesaikan 504</b>.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: snippet header, API, dan WebSocket',
      lang: 'nginx',
      output: false,
      code: `# snippets/proxy-headers.conf — dipakai ulang tiap location
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

server {
    listen 80;
    server_name app.local;
    client_max_body_size 50m;          # izinkan upload s/d 50MB

    # API: header lengkap + timeout wajar
    location /api/ {
        include snippets/proxy-headers.conf;
        proxy_pass http://api-backend/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_connect_timeout 5s;
        proxy_read_timeout    30s;
    }

    # WebSocket: upgrade + timeout panjang
    location /ws/ {
        include snippets/proxy-headers.conf;
        proxy_pass http://api-backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}`,
      explain: [
        'Empat baris pertama adalah file snippet; <code>include snippets/proxy-headers.conf;</code> memakainya kembali sehingga penambahan location baru tidak pernah melupakan header forwarding.',
        'Di <code>/api/</code>, <code>proxy_set_header Connection &quot;&quot;;</code> mengosongkan header Connection agar keepalive ke backend jalan — ini menggantikan (bukan menambah) nilai dari snippet.',
        '<code>client_max_body_size 50m;</code> berlaku untuk seluruh server; request di atas 50 MB dijawab <code>413</code> sebelum body diteruskan.',
        'Verifikasi dengan <code>podman exec nginx-lab nginx -t</code>; setelah itu buktikan header di backend memakai endpoint pemantul pada lab berikutnya.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: backend pemantul header dan backend lambat',
      lang: 'bash',
      output: false,
      code: `podman network create lab-net 2>/dev/null || true

# backend normal + endpoint pemantul header
podman run -d --name api-backend --network lab-net docker.io/library/nginx:alpine
podman exec api-backend sh -c 'echo SALAM > /usr/share/nginx/html/index.html'
podman exec api-backend sh -c 'cat > /etc/nginx/conf.d/h.conf' <<'EOF'
server {
    listen 80;
    location /headers/ {
        return 200 "host=$host xri=$http_x_real_ip xfp=$http_x_forwarded_proto";
    }
}
EOF
podman exec api-backend nginx -s reload

# backend lambat: terima koneksi, tahan response 1 jam
podman run -d --name slow-backend --network lab-net docker.io/library/node:alpine \\
  node -e "require('http').createServer((q,s)=>setTimeout(()=>s.end('late'),3600000)).listen(80)"

mkdir -p nginx-adv/snippets nginx-adv/conf.d
cat > nginx-adv/snippets/proxy-headers.conf <<'EOF'
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF
cat > nginx-adv/conf.d/proxy.conf <<'EOF'
server {
    listen 80;
    server_name app.local;
    client_max_body_size 50m;
    location /api/ {
        include /etc/nginx/snippets/proxy-headers.conf;
        proxy_pass http://api-backend/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 10s;
    }
    location /slow/ {
        proxy_pass http://slow-backend/;
        proxy_read_timeout 3s;
    }
}
EOF

podman run -d --name nginx-lab --network lab-net -p 8080:80 \\
  -v "$PWD/nginx-adv/conf.d:/etc/nginx/conf.d:ro" \\
  -v "$PWD/nginx-adv/snippets:/etc/nginx/snippets:ro" \\
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t`,
      explain: [
        'Endpoint <code>/headers/</code> membalas dengan nilai <code>$host</code>, <code>$http_x_real_ip</code>, dan <code>$http_x_forwarded_proto</code> — variabel backend yang dibaca dari header masuk, jadi jawabannya langsung membuktikan forwarding.',
        '<code>slow-backend</code> menerima koneksi tetapi menahan response 1 jam; dengan <code>proxy_read_timeout 3s</code>, Nginx akan menyerah lebih dulu.',
        'Snippet di-mount terpisah ke <code>/etc/nginx/snippets</code> sehingga <code>include</code> di konfigurasi menemukan file-nya.',
        'Ekspektasi <code>nginx -t</code>: <code>syntax is ok</code> dan <code>test is successful</code>; kalau container backend belum ada di jaringan yang sama, proxy_pass akan gagal saat request pertama.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: header, 504, 502, dan 413',
      lang: 'bash',
      output: false,
      code: `# 1) bukti header diteruskan
curl -s -H 'Host: app.local' http://localhost:8080/api/headers/
# -> host=app.local xri=10.88.0.1 xfp=http

# 2) bukti 504: backend lambat, timeout 3 detik
time curl -i -H 'Host: app.local' http://localhost:8080/slow/
podman logs nginx-lab 2>&1 | grep -i "timed out"

# 3) bukti 502: backend dimatikan
podman stop api-backend
curl -i -H 'Host: app.local' http://localhost:8080/api/ | head -1
podman logs nginx-lab 2>&1 | grep -i refused
podman start api-backend

# 4) bukti 413: upload 60MB melebihi limit 50m
dd if=/dev/zero of=/tmp/besar.bin bs=1m count=60
curl -i -H 'Host: app.local' -X POST --data-binary @/tmp/besar.bin \\
  http://localhost:8080/api/upload | head -1`,
      explain: [
        'Tes 1 mengembalikan IP container Nginx pada <code>xri</code> dan <code>http</code> pada <code>xfp</code> — kalau header kosong, ada location yang menambah <code>proxy_set_header</code> tanpa mengulang empat baris snippet.',
        'Tes 2 menjawab <code>504 Gateway Timeout</code> setelah ±3 detik, dan log memuat <code>upstream timed out ... while reading response header from upstream</code>.',
        'Tes 3 menjawab <code>502 Bad Gateway</code> dengan log <code>connect() failed (111: Connection refused)</code> — perhatikan pesan log yang berbeda dari kasus 504.',
        'Tes 4 menjawab <code>413 Request Entity Too Large</code> langsung dari Nginx karena 60 MB melebihi <code>client_max_body_size 50m</code>; body tidak pernah sampai ke backend.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum reverse proxy lanjutan',
      text: '<ul><li><b>Menambah satu <code>proxy_set_header</code> lalu semua header atas hilang</b> — aturan inheritance membatalkan seluruh set dari level atas.</li><li><b>Menganggap <code>X-Forwarded-For</code> identitas terpercaya</b> — header itu bisa dipalsukan klien, jangan dipakai sebagai satu-satunya bukti IP.</li><li><b>Membiarkan timeout default 60s</b> — terlalu kecil untuk proses panjang, terlalu besar untuk menyembunyikan masalah.</li><li><b>WebSocket gagal (400/426)</b> karena <code>Upgrade</code> tidak diteruskan atau backend masih diakses lewat HTTP/1.0.</li><li><b>Upload kena 413</b> — <code>client_max_body_size</code> default cuma <b>1 MB</b>.</li><li><b>Salah diagnosis 502 vs 504</b> — menaikkan timeout tidak menyelesaikan 502; memperbaiki port tidak menyelesaikan 504.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Baca error.log sebelum menebak',
      text: '<p>Saat proxy bermasalah, buka log lebih dulu: <code>podman logs nginx-lab 2>&amp;1 | grep -Ei &quot;refused|timed out&quot;</code>. Pesan <b>Connection refused</b> menunjuk ke masalah koneksi (502), sedangkan <b>upstream timed out</b> menunjuk ke kecepatan backend (504). Satu baris log ini menghemat waktu dibanding menebak-nebak konfigurasi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['X-Forwarded-For', 'Rantai IP klien dari proxy menuju backend.'],
        ['X-Forwarded-Proto', 'Skema asli request, http atau https.'],
        ['X-Real-IP', 'IP klien asli dalam versi satu-hop.'],
        ['proxy_read_timeout', 'Batas waktu Nginx menunggu data dari backend.'],
        ['client_max_body_size', 'Batas ukuran request body; default 1 MB.'],
        ['Buffering', 'Menampung data di memori sebelum diteruskan.'],
        ['WebSocket upgrade', 'Mengubah koneksi HTTP menjadi WebSocket.'],
        ['502 / 504', '502 = backend tak terhubungi; 504 = backend terlalu lambat.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Pindahkan semua <code>proxy_set_header</code> ke context <code>server</code>, lalu tambahkan satu <code>proxy_set_header Connection &quot;&quot;;</code> di <code>location /api/</code> — buktikan <code>X-Real-IP</code> <b>hilang</b> di backend dan jelaskan kenapa.</li><li>Ubah <code>proxy_read_timeout</code> ke <code>1s</code>, jalankan <code>time curl /slow/</code>, lalu bandingkan pesan log dengan kasus backend dimatikan (502).</li><li>Tulis konfigurasi satu location untuk HTTP biasa sekaligus WS memakai <code>map $http_upgrade $connection_upgrade</code> — jelaskan isi <code>Connection</code> untuk klien biasa vs klien WS.</li></ol>'
    }
  ],
  recap: [
    'Teruskan <b>Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto</b> agar aplikasi tahu konteks asli request.',
    '<code>proxy_set_header</code> <b>menggantikan</b> warisan level atas — satu set di level bawah membatalkan seluruh set di atasnya.',
    'Tiga timeout: <b>connect</b> (koneksi TCP), <b>read</b> (menunggu response), <b>send</b> (mengirim request); buffering menstabilkan — matikan untuk streaming/SSE.',
    'WebSocket butuh <code>proxy_http_version 1.1</code> + <code>Upgrade</code>/<code>Connection</code> + timeout panjang; <code>client_max_body_size</code> default 1m → dilanggar = <b>413</b>; <b>502 = backend tak terhubungi, 504 = backend terlalu lambat</b>.'
  ]
});
