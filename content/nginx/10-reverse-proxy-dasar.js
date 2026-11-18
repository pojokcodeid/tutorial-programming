/* ============================================================
   Pelajaran Nginx — 10: Reverse Proxy Dasar: proxy_pass
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'reverse-proxy-dasar',
  title: 'Reverse Proxy Dasar: proxy_pass',
  chapter: 'Reverse Proxy',
  duration: '10 menit',
  intro: [
    'Kamu menelepon layanan pelanggan: yang kamu hubungi adalah <b>petugas di depan</b> lewat satu nomor resmi, dan dia meneruskan pesananmu ke unit yang benar. Kamu tidak pernah tahu nomor internal tiap unit — dan itulah pekerjaan <b>reverse proxy</b>.',
    'Di Nginx, pekerjaan itu ditulis dalam satu directive: <code>proxy_pass</code>. Pelajaran ini membedah aturan resmi penggantian URI (trailing slash mengubah segalanya), dua jebakan klasik, serta kapan <code>proxy_http_version</code> harus dinaikkan ke 1.1.'
  ],
  objectives: [
    'Menjelaskan apa itu reverse proxy dan kenapa Nginx dipakai di depan aplikasi',
    'Menulis proxy_pass dengan benar di dalam location',
    'Memprediksi URI hasil penggantian saat trailing slash ada atau tidak ada',
    'Mengatur proxy_http_version dan tahu kapan ia penting'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Petugas yang meneruskan ke dapur</h3><p>Reverse proxy adalah <b>perantara yang mewakili server</b> di depan klien: klien hanya bicara ke Nginx, Nginx meneruskan ke aplikasi di baliknya, lalu membawa pulang jawabannya.</p><table><thead><tr><th>Di layanan pelanggan</th><th>Di sistem aplikasi</th></tr></thead><tbody><tr><td>Kamu (penelepon)</td><td>Klien / browser</td></tr><tr><td>Nomor resmi yang dihubungi</td><td>Nginx (<code>http://situs.com</code>)</td></tr><tr><td>Petugas yang meneruskan</td><td><b>Reverse proxy</b> (<code>proxy_pass</code>)</td></tr><tr><td>Unit internal</td><td><b>Backend</b> (<code>http://127.0.0.1:3000</code>)</td></tr></tbody></table><p>Jangan tertukar dengan <i>forward proxy</i>: forward proxy mewakili <b>klien</b> (misal VPN kantor), sedangkan reverse proxy mewakili <b>server</b> — klien tidak pernah sadar ada aplikasi di balik Nginx, dan backend tetap tidak terekspos ke publik.</p>'
    },
    {
      type: 'text',
      html: '<h3>Bentuk dasar dan satu pertanyaan besar</h3><p>Tulisan paling sederhana hanya dua baris:</p><pre style="background:rgba(127,127,127,.12);padding:10px;border-radius:8px;overflow:auto">location /api/ {\n    proxy_pass http://127.0.0.1:3000;\n}</pre><p>Lalu muncul pertanyaan yang jadi sumber bug paling sering: <b>URI apa yang benar-benar diteruskan ke backend?</b> Dokumentasi nginx.org merumuskannya dalam dua kalimat:</p><ol><li><code>proxy_pass</code> <b>tanpa bagian URI</b> (<code>http://backend;</code>) → request URI diteruskan <b>apa adanya</b>.</li><li><code>proxy_pass</code> <b>dengan bagian URI</b> (<code>http://backend/;</code>) → bagian URI yang <b>cocok dengan location diganti</b> oleh path di <code>proxy_pass</code>.</li></ol><p>Simpan dua kalimat itu — semua kasus selanjutnya bisa diprediksi tanpa menebak.</p>'
    },
    {
      type: 'example',
      title: 'Trailing slash mengubah segalanya',
      lang: 'text',
      output: false,
      code: `proxy_pass http://backend;        proxy_pass http://backend/;
--------------------------------   --------------------------------
/api/users -> dipertahankan        /api/users -> ganti /api/ jadi /
            -> /api/users                        -> /users

   tanpa slash: URI utuh dikirim      dengan slash: prefix location
   ke backend                        dibuang lalu diganti`,
      explain: [
        'Dengan <code>location /api/</code> dan <code>proxy_pass http://backend;</code>, request <code>GET /api/users</code> sampai ke backend sebagai <code>/api/users</code> — URI dipertahankan apa adanya.',
        'Dengan <code>proxy_pass http://backend/;</code>, bagian yang cocok dengan location (<code>/api/</code>) diganti oleh path di proxy_pass (<code>/</code>), sehingga backend menerima <code>/users</code>.',
        'Buktikan di lab: <code>podman logs api-backend 2>&amp;1 | tail -2</code> menampilkan baris <code>GET /legacy/ HTTP/1.1</code> dan <code>GET / HTTP/1.1</code> untuk dua location yang berbeda.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tabel prediksi URI</h3><p>Dengan <code>location /api/ { ... }</code> dan backend yang punya endpoint <code>/users</code>:</p><table><thead><tr><th>Request</th><th><code>proxy_pass http://backend;</code></th><th><code>proxy_pass http://backend/;</code></th></tr></thead><tbody><tr><td><code>GET /api/users</code></td><td><code>/api/users</code> (apa adanya)</td><td><code>/users</code> (<code>/api/</code> diganti <code>/</code>)</td></tr><tr><td><code>GET /api/</code></td><td><code>/api/</code></td><td><code>/</code></td></tr><tr><td><code>GET /api</code></td><td><code>/api</code></td><td><b>301</b> → <code>/api/</code> (otomatis)</td></tr><tr><td><code>GET /</code></td><td>tidak match, tidak di-proxy</td><td>tidak match, tidak di-proxy</td></tr></tbody></table><p>Angka <b>301</b> pada baris ketiga adalah Nginx memaksa penambahan slash, bukan error. Sedangkan bila kamu memakai <code>location / { proxy_pass http://backend/; }</code>, kedua hasilnya <b>identik</b> — bagian yang diganti (<code>/</code>) dan penggantinya (<code>/</code>) sama persis.</p>'
    },
    {
      type: 'text',
      html: '<h3>Dua jebakan klasik</h3><ul><li><b><code>location /api</code> (tanpa slash) + <code>proxy_pass http://backend/;</code></b> — location tetap bersifat prefix, jadi <code>/apix</code> juga match dan jatuh menjadi <code>/x</code>. Tulis konsisten: <code>location /api/</code> dipasangkan dengan <code>proxy_pass http://backend/;</code>.</li><li><b>Regex location + <code>proxy_pass</code> berpath</b> — penggantian jadi membingungkan karena regex tidak punya &quot;prefix&quot;. Dokumentasi menyarankan memakai <b>named location</b> (<code>location @nama</code>) untuk kasus ini.</li></ul><h4>proxy_http_version: 1.0 vs 1.1</h4><p>Default Nginx bicara ke backend memakai <b>HTTP/1.0</b>. Untuk backend modern, naikkan ke 1.1:</p><table><thead><tr><th></th><th>Default (1.0)</th><th><code>proxy_http_version 1.1</code></th></tr></thead><tbody><tr><td>Koneksi ke backend</td><td>Ditutup tiap response</td><td>Bisa <b>keepalive</b></td></tr><tr><td>Chunked transfer</td><td>Tidak</td><td>Ya</td></tr><tr><td>Header <code>Upgrade</code> (WebSocket)</td><td>Tidak</td><td>Didukung</td></tr><tr><td>Kapan dipakai</td><td>Request-response sederhana</td><td>Keepalive, WebSocket, streaming</td></tr></tbody></table><p>Syarat keepalive: <code>proxy_http_version 1.1;</code> <b>dan</b> <code>proxy_set_header Connection &quot;&quot;;</code> agar <code>Connection: close</code> dari klien tidak ikut diteruskan.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: tiga location dengan perilaku berbeda',
      lang: 'nginx',
      output: false,
      code: `server {
    listen 80;
    server_name app.local;

    # tanpa trailing slash -> URI diteruskan apa adanya
    location /legacy/ {
        proxy_pass http://127.0.0.1:3000;
    }

    # dengan trailing slash -> prefix /api/ diganti /
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
    }

    # HTTP/1.1 + header standar untuk backend modern
    location /v2/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`,
      explain: [
        '<code>location /legacy/</code> memakai <code>proxy_pass http://127.0.0.1:3000;</code> tanpa path — URI diteruskan utuh, cocok untuk backend yang memang menyediakan path lengkap.',
        '<code>location /api/</code> memakai path <code>/</code> sehingga prefix location dibuang — cocok saat backend hanya mengenal <code>/</code> sampai <code>/users</code>.',
        '<code>proxy_http_version 1.1</code> dan <code>proxy_set_header</code> disiapkan di <code>/v2/</code>; pembahasan lengkap header forwarding ada di Pelajaran 11.',
        'Uji konfigurasi dengan <code>podman exec nginx-lab nginx -t</code> sebelum reload — pesan error akan menunjuk location yang salah.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: dua backend path, satu Nginx',
      lang: 'bash',
      output: false,
      code: `podman network create lab-net 2>/dev/null || true

# backend simulasi: halaman berisi nama container-nya
podman run -d --name api-backend --network lab-net docker.io/library/nginx:alpine
podman exec api-backend sh -c 'echo "SALAM DARI api-backend" > /usr/share/nginx/html/index.html'

mkdir -p nginx-proxy/conf.d
cat > nginx-proxy/conf.d/proxy.conf <<'EOF'
server {
    listen 80;
    server_name app.local;
    location /legacy/ { proxy_pass http://api-backend; }
    location /api/    { proxy_pass http://api-backend/; }
}
EOF

podman run -d --name nginx-lab --network lab-net -p 8080:80 \\
  -v "$PWD/nginx-proxy/conf.d:/etc/nginx/conf.d:ro" \\
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t`,
      explain: [
        'Kedua container berada di jaringan <code>lab-net</code> sehingga nama <code>api-backend</code> bisa di-resolve oleh Nginx — tanpa satu jaringan, proxy_pass akan gagal.',
        '<code>nginx -t</code> harus menghasilkan <code>syntax is ok</code> dan <code>test is successful</code>; kalau nama host salah, error muncul saat <code>nginx -t</code> atau saat request pertama.',
        'Host header diuji memakai <code>-H &#39;Host: app.local&#39;</code> bila kamu tidak menambahkan entri DNS.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: membuktikan perbedaan URI',
      lang: 'bash',
      output: false,
      code: `curl -i -H 'Host: app.local' http://localhost:8080/legacy/
curl -i -H 'Host: app.local' http://localhost:8080/api/

# URI yang benar-benar diteruskan terlihat di log backend
podman logs api-backend 2>&1 | tail -2

curl -i -H 'Host: app.local' http://localhost:8080/api | head -1
curl -i -H 'Host: app.local' http://localhost:8080/tidak-ada | head -1

podman rm -f nginx-lab api-backend && podman network rm lab-net`,
      explain: [
        'Dua request pertama sama-sama <code>200 OK</code> dengan body <code>SALAM DARI api-backend</code>, tetapi isi log backend berbeda: <code>GET /legacy/</code> (dipertahankan) vs <code>GET /</code> (prefix sudah diganti).',
        '<code>curl .../api</code> tanpa slash harus <code>301 Moved Temporarily</code> menuju <code>/api/</code>, sedangkan <code>/tidak-ada</code> menjawab <code>404 Not Found</code> langsung dari Nginx.',
        'Baris terakhir membersihkan container dan jaringan agar lab berikutnya dimulai dari keadaan bersih.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum proxy_pass',
      text: '<ul><li><b>Lupa trailing slash</b> → URI utuh dikirim ke backend yang tidak punya path itu → 404. Lihat <code>podman logs backend</code> untuk membaca URI asli yang diterima.</li><li><b><code>location /api</code> + <code>proxy_pass http://backend/;</code></b> memakan path tak terduga: <code>/apix</code> berubah menjadi <code>/x</code>.</li><li><b>Menganggap proxy_pass di-resolve tiap request</b> — untuk host statis Nginx meng-resolve <b>saat load/reload</b>, jadi backend harus sudah ada sebelum <code>nginx -t</code> dan reload.</li><li><b>Tetap memakai HTTP/1.0</b> padahal butuh keepalive atau WebSocket — naikkan <code>proxy_http_version 1.1</code>.</li><li><b>Request jatuh ke default server</code> lalu mengira proxy rusak — cocokkan dulu Host header saat menguji.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Baca log backend untuk melihat URI asli',
      text: '<p>Kunci debugging trailing slash bukan di Nginx, melainkan di <b>backend</b>. Jalankan <code>podman logs api-backend 2>&amp;1 | tail -5</code> setelah satu request: baris <code>GET ... HTTP/1.1</code> di sana adalah URI persis yang diterima. Kalau angka itu berbeda dari prediksimu, masalahnya ada di pasangan location/proxy_pass — bukan di aplikasi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Reverse proxy', 'Server perantara yang mewakili server belakang di depan klien.'],
        ['proxy_pass', 'Directive Nginx untuk meneruskan request ke backend.'],
        ['Trailing slash', 'Garis miring di akhir path; penentu apakah URI diganti.'],
        ['URI replacement', 'Penggantian bagian URI request oleh path di proxy_pass.'],
        ['Backend / upstream', 'Server yang diproses di balik Nginx.'],
        ['proxy_http_version', 'Versi HTTP yang dipakai Nginx ke backend; default 1.0.'],
        ['Named location', 'Location berbentuk @nama, saran dokumentasi untuk kasus regex.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Dengan <code>location /news/ { proxy_pass http://backend/articles; }</code>, prediksi URI untuk <code>GET /news/2026</code> lalu buktikan lewat log backend.</li><li>Tambahkan <code>location /static/</code> yang di-proxy <b>tanpa</b> slash, lalu tabelkan perbedaan perilakunya dibanding <code>location /api/</code>.</li><li>Jelaskan kenapa <code>curl -i http://localhost:8080/api</code> menjawab 301, bukan 404 — kapan Nginx mengirimkannya?</li></ol>'
    }
  ],
  recap: [
    '<b>Reverse proxy mewakili server</b> di depan klien; <code>proxy_pass</code> menentukan ke mana request diteruskan.',
    '<b>Aturan URI:</b> tanpa path → diteruskan apa adanya; dengan path → bagian yang cocok dengan location <b>diganti</b>.',
    'Trailing slash adalah pembeda <code>http://backend;</code> vs <code>http://backend/;</code> — dampaknya bisa 404 atau path yang salah.',
    '<code>proxy_http_version</code> default <b>1.0</b>; naikkan ke <b>1.1</b> (plus <code>Connection &quot;&quot;</code>) untuk keepalive, chunked, atau WebSocket.'
  ]
});
