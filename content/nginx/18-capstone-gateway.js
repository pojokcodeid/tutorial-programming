/* ============================================================
   Pelajaran Nginx — 18: Capstone: Nginx sebagai Gateway Aplikasi
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'capstone-gateway',
  title: 'Capstone: Nginx sebagai Gateway Aplikasi',
  chapter: 'Proyek Akhir',
  duration: '30–45 menit',
  intro: [
    'Setelah bangunan selesai, ada satu hari khusus: <b>serah terima</b>. Inspektor datang bukan untuk membangun ulang, tapi untuk memastikan setiap ruang berfungsi sesuai denah — air mengalir, pintu darurat terbuka, lampu menyala di semua lantai. Denahnya sudah ada; hari ini kamu jadi inspektornya.',
    '<b>Capstone = hari serah terima.</b> Tidak ada konsep baru. Yang diuji adalah apakah kamu bisa <b>menjalankan, membuktikan, dan menjelaskan</b> gateway yang sudah kamu susun dari pelajaran pertama. Seluruh proyek memakai lab bersama di <code>examples/nginx-lab/</code> — konfigurasi nyatanya bisa kamu baca langsung. Kalau kamu bisa menceritakan alur satu request dari <code>curl</code> sampai <code>backend-2</code> dan kembali, kamu lulus.'
  ],
  objectives: [
    'Menjalankan seluruh lab capstone dari nol: sertifikat, container, uji otomatis, sampai reload',
    'Menjelaskan alur request dari client ke Nginx ke backend serta menentukan location mana yang terpilih untuk URI tertentu',
    'Memicu serta menganalisis error 404, 502, dan 504 secara sistematis',
    'Menjelaskan alasan setiap directive penting dan menyusun konfigurasi yang aman, terdokumentasi, serta bisa di-reload tanpa downtime'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Arsitektur lab: satu gateway, tiga backend</h3><p>Seluruh capstone memakai lab di <code>examples/nginx-lab/</code>. Client (curl/browser) menyentuh tiga port: <code>:8080</code> (gateway utama, default_server <code>app.local</code>), <code>:8081</code> (hanya redirect 301 ke HTTPS), dan <code>:8443</code> (gateway TLS dengan sertifikat self-signed). Di belakangnya berdiri container <code>nginx-lab</code> yang menjalankan Nginx dengan rate limit, security header, dan log format custom.</p><table><thead><tr><th>Path / fitur</th><th>Tujuan</th></tr></thead><tbody><tr><td><code>/</code></td><td>website statis dari <code>web/index.html</code> (SPA fallback)</td></tr><tr><td><code>/docs/</code></td><td>dokumentasi lewat <code>alias</code></td></tr><tr><td><code>/private</code></td><td>403 (diblokir)</td></tr><tr><td><code>/api/</code> dan <code>/app/</code></td><td>upstream <code>app_backend</code> (round-robin ke backend-1/2/3)</td></tr><tr><td><code>/slow/</code></td><td>latihan error 502/504</td></tr><tr><td>3 virtual host</td><td><code>app.local</code>, <code>api.local</code>, <code>docs.local</code> — dipisah lewat Host header, semuanya di port 8080</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Struktur project</h3><ul><li><code>examples/nginx-lab/compose.yaml</code> — 4 service: <code>nginx-lab</code> + 3 backend (<code>nginx:alpine</code>).</li><li><code>examples/nginx-lab/nginx/nginx.conf</code> — main + http: log format, zone rate limit, <code>include</code>.</li><li><code>examples/nginx-lab/nginx/conf.d/app.conf</code> — vhost <code>app.local</code> (8080/8443) + redirect 8081; <code>api.conf</code> — upstream <code>app_backend</code> + vhost <code>api.local</code>/<code>docs.local</code>.</li><li><code>examples/nginx-lab/nginx/snippets/</code> — <code>proxy-headers.conf</code> (header &amp; timeout proxy), <code>proxy-routes.conf</code> (location <code>/api/</code> dan <code>/app/</code>), <code>security-headers.conf</code> (nosniff, X-Frame-Options, CSP, dst.).</li><li><code>examples/nginx-lab/backends/</code> — <code>backend.conf</code> bersama + <code>index.html</code> tiap backend; <code>web/</code> — website statis + assets/ + docs/.</li><li><code>examples/nginx-lab/certs/</code> — diisi <code>gen-certs.sh</code> (key tidak masuk Git); <code>scripts/</code> — <code>gen-certs.sh</code>, <code>test-routing.sh</code> (uji routing, vhost, redirect, TLS), <code>test-proxy.sh</code> (uji proxy, LB, 413, 502/504, rate limit).</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Langkah pengerjaan (dari nol)</h3><ol><li><b>Pahami dasarnya</b> — ingat kembali peran master/worker dalam satu gateway (Pelajaran 1–2).</li><li><b>Tinjau struktur konfigurasi</b> — pastikan kamu hafal konteks <code>main</code>/<code>events</code>/<code>http</code> dan urutan <code>nginx -t</code> → <code>nginx -s reload</code> (Pelajaran 3–4).</li><li><b>Baca kerangka lab</b> — buka <code>nginx/nginx.conf</code>: kenapa <code>root</code> ada di <code>server</code> bukan di <code>http</code> (Pelajaran 5).</li><li><b>Telusuri routing statis</b> — <code>location ^~ /private</code>, <code>location /docs/</code> (alias), dan SPA fallback <code>try_files</code> (Pelajaran 6–7).</li><li><b>Cek redirect</b> — blok <code>:8081</code> memakai <code>return 301</code> (Pelajaran 8).</li><li><b>Petakan virtual host</b> — tiga <code>server_name</code> di port yang sama (Pelajaran 9).</li><li><b>Bedah reverse proxy</b> — baca <code>snippets/proxy-routes.conf</code> dan <code>proxy-headers.conf</code>: kenapa <code>proxy_pass</code> diakhiri slash (Pelajaran 10–11).</li><li><b>Jelaskan load balancing</b> — blok <code>upstream app_backend</code> memakai round-robin (Pelajaran 12).</li><li><b>Aktifkan TLS</b> — jalankan <code>scripts/gen-certs.sh</code>, cocokkan dengan <code>ssl_certificate</code> di <code>app.conf</code> (Pelajaran 13).</li><li><b>Periksa cache &amp; performa</b> — <code>expires 30d</code>, <code>gzip</code>, <code>sendfile</code> (Pelajaran 14).</li><li><b>Audit keamanan</b> — <code>server_tokens off</code>, <code>limit_req zone=gw_rate</code>, snippet security headers (Pelajaran 15).</li><li><b>Siapkan log &amp; analisis</b> — <code>log_format main</code> dengan <code>rt=</code>/<code>urt=</code>; log dibaca lewat <code>podman logs nginx-lab</code> (Pelajaran 16).</li><li><b>Terapkan best practices</b> — konvensi penamaan, snippet, graceful reload (Pelajaran 17).</li><li><b>Jalankan seluruh uji</b> — <code>scripts/gen-certs.sh</code>, <code>podman compose up -d</code>, lalu <code>scripts/test-routing.sh</code> dan <code>scripts/test-proxy.sh</code>.</li><li><b>Uji error &amp; reload</b> — skenario 404/502/504 dan graceful reload pada bagian Lab.</li><li><b>Dokumentasikan</b> — tulis catatan alur request dan alasan tiap directive (lihat kriteria kelulusan).</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Checklist persyaratan capstone</h3><ul><li>✅ Static website terlayani dari <code>web/</code> lewat <code>root</code>.</li><li>✅ Minimal 3 virtual host/rute jelas: <code>app.local</code>, <code>api.local</code>, <code>docs.local</code>.</li><li>✅ URL routing dengan <code>location</code> (<code>^~</code>, prefix, regex aset).</li><li>✅ Reverse proxy <code>/api/</code> dan <code>/app/</code> ke upstream.</li><li>✅ Load balancing 3 backend (round-robin <code>app_backend</code>).</li><li>✅ HTTPS <code>:8443</code> + redirect <code>:8081</code> → HTTPS.</li><li>✅ Cache aset statis (<code>expires 30d</code>) + gzip.</li><li>✅ Rate limiting (<code>limit_req zone=gw_rate burst=20 nodelay</code>).</li><li>✅ Security headers (snippet <code>security-headers.conf</code> + HSTS).</li><li>✅ Custom access log (<code>log_format main</code> dengan <code>rt</code>/<code>urt</code>).</li><li>✅ Uji error 404, 502, dan 504 terbukti.</li><li>✅ Graceful reload terbukti saat trafik berjalan.</li><li>✅ Dokumentasi konfigurasi &amp; troubleshooting (README + komentar tiap file).</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: inti gateway yang wajib bisa kamu baca tanpa pemandu',
      lang: 'nginx',
      output: false,
      code: `# nginx/conf.d/api.conf — upstream + dua virtual host
upstream app_backend {
    server backend-1:80;   # di-resolve saat config dimuat -> backend harus hidup dulu
    server backend-2:80;
    server backend-3:80;
}

server {
    listen 8080;
    server_name api.local;
    default_type text/plain;
    include /etc/nginx/snippets/proxy-routes.conf;   # /api/ dan /app/ sekali tulis
    location / { return 200 "api.local - virtual host API pada port 8080\\n"; }
}

# nginx/snippets/proxy-routes.conf — route proxy yang dipakai 3 server block
location /api/ {
    limit_req               zone=gw_rate burst=20 nodelay;
    client_max_body_size    1m;
    include                 /etc/nginx/snippets/proxy-headers.conf;
    proxy_pass              http://app_backend/;   # slash akhir: /api/x -> backend /x
}`,
      explain: [
        '<code>upstream app_backend</code> memusatkan 3 backend agar dipakai ulang oleh <code>/api/</code> dan <code>/app/</code>; nama upstream di-resolve saat konfigurasi dimuat, jadi backend harus hidup dulu sebelum <code>nginx -t</code> dijalankan.',
        '<code>limit_req zone=gw_rate</code> melindungi backend dari lonjakan — zone-nya wajib dibuat di konteks <code>http</code>, bukan di dalam location.',
        '<code>client_max_body_size 1m</code> menolak upload besar dengan <b>413</b> sebelum membebani backend; <code>include proxy-headers.conf</code> menjaga header identik di semua route proxy.',
        '<code>proxy_pass http://app_backend/;</code> dengan slash akhir mengganti prefix path <code>/api/</code> menjadi <code>/</code> — backend tidak perlu tahu struktur URL publik.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Directive penting dan alasannya</h3><table><thead><tr><th>Directive</th><th>Alasan keberadaannya</th></tr></thead><tbody><tr><td><code>upstream app_backend</code></td><td>Memusatkan 3 backend agar dipakai ulang oleh <code>/api/</code> dan <code>/app/</code></td></tr><tr><td><code>limit_req zone=gw_rate</code></td><td>Melindungi backend dari lonjakan; zone-nya wajib dibuat di konteks <code>http</code></td></tr><tr><td><code>client_max_body_size 1m</code></td><td>Menolak upload besar dengan 413 sebelum membebani backend</td></tr><tr><td><code>include proxy-headers.conf</code></td><td>Menjaga header identik di semua route proxy</td></tr><tr><td><code>proxy_pass .../</code></td><td>Mengganti prefix path supaya backend tidak tahu struktur URL publik</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Lab (1/3): dari nol sampai uji otomatis',
      lang: 'bash',
      output: false,
      code: `cd examples/nginx-lab
bash scripts/gen-certs.sh
podman compose up -d
bash scripts/test-routing.sh
bash scripts/test-proxy.sh`,
      explain: [
        '<code>gen-certs.sh</code> membuat sertifikat self-signed ber-SAN; ekspektasi baris pertama: <code>OK : sertifikat dibuat...</code>.',
        '<code>podman compose up -d</code> menyalakan 4 container: <code>nginx-lab</code> plus <code>backend-1</code>, <code>backend-2</code>, <code>backend-3</code> — pastikan semuanya <code>running</code> sebelum lanjut.',
        'Kedua skrip uji mencetak <code>PASS</code> di tiap pemeriksaan (routing, vhost, redirect, TLS, proxy, LB, 413, 502/504, rate limit) dan menutup dengan <b><code>TOTAL: PASS=n FAIL=0</code></b> berstatus exit 0.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (2/3): skenario uji error 404 / 502 / 504',
      lang: 'bash',
      output: false,
      code: `# 404: path berekstensi yang tidak ada (SPA fallback menutupi path halaman!)
curl -s -o /dev/null -w '404 -> %{http_code}\\n' http://localhost:8080/assets/hilang.css

# 502: location /slow/ memproxy ke 127.0.0.1:9090 yang tidak ada listener-nya
curl -s -o /dev/null -w '502 -> %{http_code}\\n' http://localhost:8080/slow/

# 504: listener menerima koneksi tapi tidak pernah menjawab (proxy_read_timeout 2s)
podman exec -d nginx-lab sh -c 'sleep 60 | nc -l -p 9090'
curl -s -o /dev/null -w '504 -> %{http_code}\\n' http://localhost:8080/slow/
podman exec nginx-lab sh -c 'pkill -f "nc -l -p 9090"' || true`,
      explain: [
        'Tercetak <code>404 -&gt; 404</code>, <code>502 -&gt; 502</code>, <code>504 -&gt; 504</code> — 504 memakan waktu ±2 detik karena menunggu <code>proxy_read_timeout 2s</code>.',
        'Pakai path berekstensi untuk 404: <code>/halaman/tentang</code> tidak membuktikan apa pun karena SPA fallback memang menutupinya dengan 200.',
        '502 = koneksi ke backend <b>gagal</b> (tidak ada listener di 9090); 504 = koneksi <b>ada</b> tapi backend terlalu lambat — bedakan lewat cara memicu, bukan hafalan.',
        'Alasan tiap kode ada di error log: baca dengan <code>podman logs --tail 20 nginx-lab</code> — cari <code>connect() failed</code> dan <code>upstream timed out</code> sebelum menghafal.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (3/3): graceful reload saat trafik berjalan',
      lang: 'bash',
      output: false,
      code: `( for i in $(seq 1 200); do
    curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/api/
  done > /tmp/capstone.txt ) &

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -s reload
wait
sort /tmp/capstone.txt | uniq -c`,
      explain: [
        '200 request berjalan di latar belakang selama reload dilakukan — inilah momen membuktikan <i>graceful</i>.',
        '<code>nginx -t</code> wajib mencetak <code>syntax is ok</code> dulu; hanya bila lolos barulah <code>nginx -s reload</code> dijalankan (worker baru mulai, worker lama menyelesaikan request yang sedang berjalan).',
        '<code>uniq -c</code> harus menampilkan hanya satu baris <b><code>200 200</code></b> — nol request gagal karena reload.'
      ]
    },
    {
      type: 'example',
      title: 'Panduan demo: menjelaskan alur request dalam 6 langkah',
      lang: 'text',
      output: false,
      code: `[1] Client  : curl membuka TCP ke localhost:8080, kirim GET /api/headers/ + Host: localhost:8080
[2] Server  : tidak ada server_name cocok -> jatuh ke default_server (app.local, listen 8080)
[3] Location: evaluasi location -> prefix /api/ (snippet proxy-routes.conf) mengalahkan location /
[4] Proteksi: limit_req zone=gw_rate dicek; client_max_body_size 1m dicek bila ada body
[5] Proxy   : proxy-headers.conf menambahkan X-Real-IP/X-Forwarded-For/X-Forwarded-Proto,
              lalu proxy_pass http://app_backend/  ->  prefix /api/ diganti "/"
[6] Upstream: round-robin memilih backend-1/2/3:80 -> backend membalas -> Nginx menulis log rt=/urt=`,
      explain: [
        'Contoh perintah: <code>curl http://localhost:8080/api/headers/</code> — tiap langkah punya bukti sendiri: <code>curl -H &apos;Host: docs.local&apos;</code> untuk vhost, <code>podman logs</code> untuk log, dan <code>rt=</code>/<code>urt=</code> untuk waktu.',
        'Buktikan tiap klaim dengan satu perintah — <b>jangan menceritakan alur tanpa bukti</b>; semua buktinya tersedia di lab.',
        'Latihan lanjutan: ceritakan alur <code>curl -H &apos;Host: docs.local&apos; http://localhost:8080/</code> dengan skrip 6 langkah yang sama dan sebutkan file konfigurasi tempat tiap keputusan dibuat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kriteria kelulusan</h3><p>Capstone selesai bila kamu mampu:</p><ol><li>Menjalankan seluruh lab dari repository (sertifikat → container → uji → reload).</li><li>Menjelaskan alur request dari client sampai backend dengan bahasa sendiri.</li><li>Menentukan location mana yang terpilih untuk URI tertentu.</li><li>Membuktikan reverse proxy dan load balancing.</li><li>Menguji TLS dan cache.</li><li>Memicu serta menganalisis error 404, 502, dan 504.</li><li>Menjelaskan alasan setiap directive dalam konfigurasi gateway.</li><li>Menyusun konfigurasi yang aman dan maintainable, terdokumentasi, bisa di-reload tanpa downtime.</li></ol>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum',
      text: '<ul><li>Menguji <code>/halaman/tentang</code> lalu kecewa tidak dapat 404 — SPA fallback memang menutupinya; pakai path berekstensi (<code>/assets/hilang.css</code>).</li><li>Menjalankan <code>nginx -t</code> sebelum container backend siap → <code>upstream app_backend</code> gagal di-resolve.</li><li>Menganggap 502 dan 504 sama: 502 = koneksi ke backend <b>gagal</b>, 504 = koneksi ada tapi backend <b>terlalu lambat</b>.</li><li>Reload tanpa <code>nginx -t</code> → konfigurasi rusak tak pernah aktif, tapi kamu mengira perubahan sudah jalan.</li><li>Menyebut alur request tanpa membuktikannya dengan curl/log — padahal semua buktinya ada di lab.</li><li>Lupa bahwa port 80/443 butuh hak istimewa, karena itu lab memakai 8080/8081/8443.</li></ul>'
    },
    {
      type: 'vocab',
      items: [
        ['Capstone', 'Proyek akhir yang menggabungkan seluruh materi bab.'],
        ['Gateway', 'Titik tunggal yang menerima request lalu mengarahkannya ke layanan yang tepat.'],
        ['Edge proxy', 'Nginx sebagai lapisan pertama dari luar: TLS, routing, proteksi.'],
        ['Round-robin', 'Distribusi request bergiliran ke tiap backend dalam upstream.'],
        ['Passive failure detection', 'Nginx OSS hanya menandai backend mati setelah ada request yang gagal.'],
        ['Graceful reload', 'Memuat konfigurasi baru tanpa memutus koneksi aktif.'],
        ['Self-signed certificate', 'Sertifikat yang ditandatangani sendiri — hanya untuk lab.'],
        ['SAN', 'Subject Alternative Name: daftar nama yang dicakup sertifikat.'],
        ['Skenario uji', 'Rangkaian request terencana untuk membuktikan perilaku tertentu.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Ceritakan alur <code>curl -H &apos;Host: docs.local&apos; http://localhost:8080/</code> dalam 6 langkah — sebutkan file konfigurasi tempat keputusan itu dibuat.</li><li>Pindahkan satu <code>location</code> di <code>app.conf</code> ke file snippet baru, lalu buktikan perilaku identik setelah reload.</li><li>Hentikan <code>backend-2</code>, buktikan <code>/api/</code> tetap 200, lalu jelaskan kenapa Nginx OSS baru mengetahuinya saat request gagal (<i>passive failure detection</i>).</li></ol>'
    }
  ],
  recap: [
    'Capstone <b>tidak menambah konsep baru</b> — ia menguji gabungan Pelajaran 1–17 pada satu gateway nyata di <code>examples/nginx-lab/</code> (4 container: gateway + 3 backend load-balanced, 3 virtual host, TLS, rate limit, log custom).',
    '<b>Bukti mengalahkan ingatan</b>: setiap klaim (routing, proxy, LB, TLS, error) punya satu perintah <code>curl</code> atau baris log pendukung.',
    '<b>404</b> = file tak ada, <b>502</b> = backend tak terjangkau, <b>504</b> = backend terlalu lambat — bedakan lewat cara memicu, bukan hafalan.',
    'Graceful reload = <code>nginx -t</code> lalu <code>nginx -s reload</code>, terbukti nol request gagal di tengah trafik; kelulusan = bisa <b>menjalankan, membuktikan, dan menjelaskan</b> alur request dari client sampai backend.'
  ]
});
