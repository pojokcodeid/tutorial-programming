/* ============================================================
   Pelajaran Nginx — 17: Best Practices, Modular Config & Deployment
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'best-practices-deployment',
  title: 'Best Practices, Modular Config & Deployment',
  chapter: 'Best Practices',
  duration: '10–15 menit',
  intro: [
    'Bayangkan dua bengkel. Bengkel pertama menaruh <b>semua perkakas di satu laci panjang</b>: saat butuh obeng, kamu harus mengobrak-abrik, dan saat mengganti satu perkakas kamu khawatir ketuker. Bengkel kedua memakai <b>laci-laci berlabel</b> dengan kartu catatan isi tiap laci — perkakasnya sama, tapi jauh lebih cepat diperbaiki tanpa menghentikan pekerjaan.',
    'Konfigurasi produksi harus seperti bengkel kedua: modul berlabel (<code>conf.d/</code>), potongan yang dipakai berulang (<code>snippets/</code>), dan kartu catatan (komentar dokumentasi). Dengan begitu, <b>mengganti satu bagian tidak perlu membongkar seluruh konfigurasi</b> — dan Nginx bisa memuat perubahan itu lewat <i>graceful reload</i> tanpa memutus koneksi yang sedang berjalan.'
  ],
  objectives: [
    'Menyusun konfigurasi modular: nginx.conf tipis + include, dengan konvensi penamaan file yang konsisten, serta membuat snippet yang dipakai berulang',
    'Memisahkan konfigurasi per environment dan menjelaskan graceful reload, minimal downtime, serta deployment blue-green',
    'Menempatkan Nginx sebagai edge proxy: reverse proxy multi-service serta static + API dalam satu domain, dan mengenali batas Nginx OSS vs Plus',
    'Menjalankan performance testing singkat serta review dan dokumentasi konfigurasi sebelum layanan dibuka ke pengguna'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Konfigurasi modular: nginx.conf tipis + include</h3><p>Modular = <code>nginx.conf</code> hanya berisi <b>kerangka global</b>, sedangkan detail per layanan dipisah ke file kecil yang di-<code>include</code>:</p><table><thead><tr><th>Bagian</th><th>Berisi</th><th>Aturan main</th></tr></thead><tbody><tr><td><code>nginx.conf</code></td><td><code>user</code>, <code>worker_processes</code>, <code>events</code>, <code>http</code> (log format, zone, <code>include</code> terakhir)</td><td>Tipis — jangan taruh <code>server</code> di sini</td></tr><tr><td><code>conf.d/*.conf</code></td><td>Satu file = satu virtual host atau satu kelompok layanan</td><td><b>Urutan baca = urutan glob</b>, jadi pakai prefix angka</td></tr><tr><td><code>snippets/*.conf</code></td><td>Potongan <code>location</code>/directive yang dipakai ≥2 tempat</td><td>Tanpa <code>server {}</code> — hanya potongan</td></tr></tbody></table><p>Satu <code>include /etc/nginx/conf.d/*.conf;</code> di akhir blok <code>http</code> menjadi <b>poin tunggal</b> tempat semua virtual host dimuat — menambah domain baru berarti menambah satu file, tanpa menyentuh <code>nginx.conf</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Konvensi penamaan file &amp; pemisahan environment</h3><p>Konvensi yang mudah dipertahankan tim:</p><ul><li>Prefix angka menentukan prioritas baca: <code>10-default.conf</code> (fallback), <code>30-app.conf</code>, <code>50-api.conf</code>, <code>90-maintenance.conf</code> — atau nama berbasis domain (<code>app.local.conf</code>). Pilih <b>satu gaya</b> dan konsisten.</li><li>Nama file menjawab <i>apa isinya</i>, bukan <i>siapa yang mengubah</i> (<code>30-app.conf</code>, bukan <code>fix-baru.conf</code>).</li><li>Komentar di tiap file menjawab <b>mengapa</b>, bukan mengulang sintaks.</li></ul><p>Untuk environment: jangan menyalin seluruh folder lalu mengubah-ubah diam-diam. Pola sehatnya <code>nginx.conf</code> meng-<code>include</code> <code>conf.d/</code> plus satu file kecil <code>env/$ENVIRONMENT.conf</code> — beda env = beda satu file.</p><table><thead><tr><th>Berbeda antar env</th><th>Sama antar env</th></tr></thead><tbody><tr><td>nama domain, IP upstream, ukuran cache, level log, <code>server_tokens</code></td><td>struktur <code>location</code>, snippet header, aturan error</td></tr></tbody></table><p>Larangan keras: <b>edit langsung di dalam container</b> tanpa menulis ulang ke file host — perubahan hilang saat container dibuat ulang.</p>'
    },
    {
      type: 'text',
      html: '<h3>Snippets: tulis sekali, pakai banyak</h3><p><code>include</code> bekerja di semua konteks. Pola snippet yang terbukti di lab:</p><table><thead><tr><th>Snippet</th><th>Dipakai di</th><th>Isi</th></tr></thead><tbody><tr><td><code>proxy-headers.conf</code></td><td>tiap <code>location</code> proxy</td><td><code>proxy_set_header Host/X-Real-IP/X-Forwarded-For/X-Forwarded-Proto</code>, timeout</td></tr><tr><td><code>proxy-routes.conf</code></td><td>app.local (8080 &amp; 8443) + api.local</td><td><code>location /api/</code> dan <code>/app/</code> + <code>limit_req</code> + <code>client_max_body_size</code></td></tr><tr><td><code>security-headers.conf</code></td><td>konteks <code>http</code>, server HTTPS, location aset</td><td><code>X-Content-Type-Options</code>, <code>X-Frame-Options</code>, <code>Referrer-Policy</code>, CSP</td></tr></tbody></table><p>Satu jebakan warisan yang wajib dihafal: <b><code>add_header</code> di konteks atas TIDAK diwariskan</b> bila server/location di bawahnya mendefinisikan <code>add_header</code> sendiri (aturan resmi nginx.org). Karena itu lab menyertakan ulang snippet security headers di server <code>:8443</code> dan di location cache — bukan duplikasi yang salah, melainkan konsekuensi aturan warisan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Graceful reload, minimal downtime &amp; blue-green</h3><p><code>nginx -s reload</code> (alias mengirim <b>SIGHUP</b> ke proses master) memakai urutan aman: <b>baca &amp; validasi konfigurasi baru → fork worker baru → worker lama menyelesaikan request yang sedang berjalan lalu berhenti</b>. Koneksi yang sedang terbuka tidak diputus — itulah <b>graceful</b>.</p><table><thead><tr><th>Istilah</th><th>Arti</th><th>Di Nginx OSS</th></tr></thead><tbody><tr><td>Graceful reload</td><td>Ganti konfigurasi tanpa memutus koneksi aktif</td><td>✅ bawaan (<code>nginx -t</code> lalu <code>nginx -s reload</code>)</td></tr><tr><td>Minimal downtime</td><td>Deploy dengan downtime nyaris nol</td><td>✅ selama selalu <code>nginx -t</code> sebelum reload</td></tr><tr><td>Blue-green</td><td>Dua set layanan identik (biru &amp; hijau), trafik dipindah seketika ke satu set</td><td>⚠️ konsep di <b>lapisan di atas</b> Nginx (komposer/upstream), bukan perintah Nginx</td></tr></tbody></table><p>Prinsipnya selalu sama: <b>validasi dulu, baru muat</b>. Konfigurasi yang gagal <code>nginx -t</code> tidak akan pernah menyentuh worker yang sedang melayani — Nginx menolak reload dan mempertahankan konfigurasi lama.</p>'
    },
    {
      type: 'text',
      html: '<h3>Nginx sebagai edge proxy</h3><p><b>Edge</b> = titik pertama yang disentuh request dari luar. Di posisi itu Nginx mengerjakan banyak hal sebelum aplikasi bangun: TLS, rate limit, routing, log, dan cache.</p><ul><li><b>Reverse proxy multi-service</b> — beda layanan dipisah lewat <code>server_name</code> (Host header) atau lewat path (<code>/api/</code>, <code>/app/</code>).</li><li><b>Static + API satu domain</b> — file statis disajikan Nginx langsung (<code>root</code>/<code>alias</code>), hanya path API yang di-proxy: hemat round trip dan beban aplikasi.</li></ul><p>Lab memakai keduanya: <code>app.local</code> menggabungkan static + <code>/api/</code> + <code>/app/</code>, sementara <code>api.local</code>/<code>docs.local</code> memisahkan peran lewat Host header — semuanya listen di port yang sama.</p>'
    },
    {
      type: 'text',
      html: '<h3>Performance testing, capacity planning &amp; batas OSS vs Plus</h3><p>Empat langkah perencanaan kapasitas:</p><table><thead><tr><th>Langkah</th><th>Isi</th><th>Contoh</th></tr></thead><tbody><tr><td>1. Uji beban</td><td>Ukur RPS + latensi p50/p95 + error rate</td><td><code>wrk</code>, <code>ab</code>, <code>hey</code> terhadap <code>/api/</code></td></tr><tr><td>2. Temukan bottleneck</td><td>Bandingkan <code>worker_connections</code>, CPU, dan waktu upstream</td><td>log <code>rt=</code> vs <code>urt=</code> (pelajaran 16)</td></tr><tr><td>3. Hitung kapasitas</td><td>RPS terukur ÷ faktor aman</td><td>pakai <b>50–60%</b> dari beban puncak terukur</td></tr><tr><td>4. Sisakan headroom</td><td>Kapasitas cadangan untuk trafik tak terduga</td><td>target minimal <b>2×</b> beban rata-rata</td></tr></tbody></table><p>Catatan jujur: angka dari laptop/container belajar <b>bukan</b> angka produksi — gunanya membandingkan <i>sebelum vs sesudah</i> perubahan, bukan menjanjikan kapasitas ke klien.</p><table><thead><tr><th>Kemampuan</th><th>Nginx OSS (dipakai lab)</th><th>Nginx Plus</th></tr></thead><tbody><tr><td>Reverse proxy, vhost, load balancing, TLS, cache, rate limit</td><td>✅</td><td>✅</td></tr><tr><td>Failure detection</td><td><b>Pasif</b> — hanya saat request gagal</td><td>Aktif + pasif (health check berkelanjutan)</td></tr><tr><td>API &amp; dashboard monitoring</td><td>❌ (pakai <code>stub_status</code> + exporter)</td><td>✅ bawaan</td></tr><tr><td>Rekonfigurasi dinamis tanpa reload</td><td>❌ (selalu reload)</td><td>✅ lewat API</td></tr><tr><td>Session persistence (sticky)</td><td>Terbatas (<code>ip_hash</code>)</td><td>✅</td></tr><tr><td>WAF</td><td>❌</td><td>Modul terpisah (NGINX App Protection)</td></tr></tbody></table><p>Semua materi di bab ini berjalan penuh di <b>OSS</b>; Plus menambah kenyamanan operasional, bukan fitur dasar routing.</p>'
    },
    {
      type: 'text',
      html: '<h3>Review &amp; dokumentasi konfigurasi</h3><p>Checklist sebelum konfigurasi dianggap layak deploy:</p><ol><li><code>nginx -t</code> sukses; <code>nginx -T</code> menampilkan semua file yang benar-benar ikut terbaca.</li><li>Tiap file <code>conf.d/</code> punya komentar <b>mengapa</b> direktif itu ada, bukan hanya apa isinya.</li><li>Ada satu halaman daftar: alur request, port, domain, lokasi snippet, dan cara reload/rollback.</li><li>Error page, log format, health check sederhana, dan langkah rollback (<code>nginx -t</code> → <code>nginx -s reload</code>) sudah disepakati tim.</li><li>Tidak ada rahasia di repo (private key, token) — di lab, <code>certs/*.key</code> sudah masuk <code>.gitignore</code>.</li></ol><p>Dokumentasi adalah <b>bagian dari konfigurasi</b>, bukan pekerjaan setelah deploy.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: kerangka tipis + satu virtual host',
      lang: 'nginx',
      output: false,
      code: `# /etc/nginx/nginx.conf — kerangka tipis: hanya yang berlaku global
user  nginx;
worker_processes  auto;
error_log  /var/log/nginx/error.log  warn;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    # Satu format log untuk semua virtual host (pelajaran 16)
    log_format main '$remote_addr [$time_local] "$request" $status '
                    'rt=$request_time urt=$upstream_response_time';
    access_log /var/log/nginx/access.log main;

    sendfile           on;
    keepalive_timeout  65;
    server_tokens      off;
    # Zone rate limit: hanya boleh di konteks http
    limit_req_zone $binary_remote_addr zone=gw_rate:10m rate=10r/s;
    # Snippet global — diwariskan ke semua server (hati-hati aturan add_header)
    include /etc/nginx/snippets/security-headers.conf;
    # Poin tunggal untuk memuat semua virtual host (urutan = nama file)
    include /etc/nginx/conf.d/*.conf;
}

# /etc/nginx/conf.d/30-app.conf — satu file = satu virtual host
server {
    listen       8080 default_server;
    server_name  app.local;

    root   /usr/share/nginx/html;
    index  index.html;

    # Snippet dipakai ulang di 8443 dan api.local — tidak disalin tangan
    include /etc/nginx/snippets/proxy-routes.conf;

    # SPA fallback (pelajaran 6)
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(css|js|png|jpg|svg|ico)$ {
        expires 30d;
        # add_header di location membatalkan warisan http -> sertakan ulang
        include /etc/nginx/snippets/security-headers.conf;
    }
}`,
      explain: [
        '<code>nginx.conf</code> tetap tipis: hanya kerangka global, satu <code>log_format</code>, satu zone rate limit, dan dua <code>include</code> di akhir blok <code>http</code> — tidak ada <code>server{}</code> di dalamnya.',
        '<code>include /etc/nginx/conf.d/*.conf;</code> adalah poin tunggal pembuka; <b>urutan baca = urutan nama file</b>, itulah gunanya prefix angka <code>30-app.conf</code>.',
        'Virtual host berdiri di file sendiri: <code>root</code>, snippet, dan location tidak pernah disalin ke <code>nginx.conf</code> — menambah domain cukup menambah satu file baru.',
        'Location aset memakai <code>expires 30d</code> dan <b>sertakan ulang</b> snippet security headers karena <code>add_header</code> di location membatalkan warisan dari konteks <code>http</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (1/2): bukti modular + graceful reload saat trafik berjalan',
      lang: 'bash',
      output: false,
      code: `cd examples/nginx-lab
bash scripts/gen-certs.sh
podman compose up -d

# Bukti konfigurasi benar-benar termodular (jumlah file yang ikut dimuat)
podman exec nginx-lab nginx -T | grep -c 'configuration file'

# Trafik 300 request berjalan di latar belakang, sambil kita reload
( for i in $(seq 1 300); do
    curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/api/
  done > /tmp/reload-status.txt ) &

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -s reload
wait
sort /tmp/reload-status.txt | uniq -c`,
      explain: [
        '<code>nginx -T | grep -c &apos;configuration file&apos;</code> harus <b>≥ 4</b>: ada <code>nginx.conf</code>, <code>app.conf</code>, <code>api.conf</code>, plus snippet yang di-include — bukti konfigurasi benar-benar termodular.',
        '<code>nginx -t</code> wajib mencetak <code>syntax is ok</code>/<code>test is successful</code> <b>sebelum</code> <code>nginx -s reload</code> dijalankan — urutan ini yang membuat reload aman.',
        '<code>uniq -c</code> harus hanya menampilkan <b><code>300 200</code></b>: 300 request semuanya 200, tidak ada yang gagal karena reload — itulah bukti <i>graceful</i>.',
        'Jalankan juga di terminal kedua: kirim <code>curl</code> berkali-kali selama reload berlangsung dan pastikan tidak ada koneksi yang terputus.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (2/2): konfigurasi rusak harus ditolak, bukan dimuat',
      lang: 'bash',
      output: false,
      code: `podman exec -i nginx-lab sh -c 'echo "directive_ngawur;" > /etc/nginx/conf.d/99-broken.conf'
podman exec nginx-lab nginx -t
podman exec nginx-lab rm /etc/nginx/conf.d/99-broken.conf
podman exec nginx-lab nginx -t`,
      explain: [
        '<code>nginx -t</code> pertama <b>gagal</b> dengan pesan <code>unknown directive</code> — jangan pernah melanjutkan ke <code>nginx -s reload</code> saat test gagal.',
        'Selama kamu tidak memaksakan reload, <b>traffic tetap dilayani oleh konfigurasi lama</b> — worker yang sedang berjalan tidak menyentuh file rusak itu.',
        'Setelah file dihapus, <code>nginx -t</code> kedua kembali <code>syntax is ok</code> — konfigurasi siap direload kapan pun diperlukan.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum',
      text: '<ul><li>Menumpuk semua <code>server</code> di <code>nginx.conf</code> → sulit direview, mudah konflik saat tim bertambah.</li><li>Menamai file <code>baru.conf</code>, <code>fix2.conf</code> → tidak terbaca urutannya; pakai prefix angka atau nama domain.</li><li>Mengedit konfigurasi langsung di dalam container (apalagi mount <code>:ro</code>) → perubahan hilang saat container dibuat ulang.</li><li>Lupa <code>nginx -t</code> sebelum reload → kalau gagal, konfigurasi lama tetap jalan tapi kamu tidak tahu perubahanmu belum pernah aktif.</li><li>Mengira <code>add_header</code> di konteks <code>http</code> selalu ikut turun → salah; level yang mendefinisikan <code>add_header</code> sendiri memutus warisan.</li><li>Mengira blue-green = perintah Nginx → itu pola deployment; di OSS perpindahannya lewat perubahan upstream/komposer.</li><li>Menjanjikan angka benchmark laptop sebagai kapasitas produksi.</li></ul>'
    },
    {
      type: 'vocab',
      items: [
        ['Modular config', 'Konfigurasi dipecah jadi file kecil yang di-include, bukan satu file raksasa.'],
        ['Snippet', 'File potongan konfigurasi yang dipakai ulang di banyak tempat.'],
        ['Graceful reload', 'Memuat konfigurasi baru tanpa memutus koneksi yang sedang berjalan.'],
        ['SIGHUP', 'Sinyal yang dikirim nginx -s reload ke master untuk reload.'],
        ['Edge proxy', 'Titik pertama yang menerima trafik dari luar; tempat TLS, routing, dan proteksi dipasang.'],
        ['Blue-green deployment', 'Dua set layanan identik, perpindahan trafik dilakukan seketika ke set baru.'],
        ['Capacity planning', 'Menghitung kapasitas dari pengukuran beban lalu menyisakan headroom.'],
        ['Headroom', 'Cadangan kapasitas di atas beban rata-rata untuk lonjakan tak terduga.'],
        ['Nginx Plus', 'Edisi komersial: health check aktif, API/dashboard, rekonfigurasi dinamis.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Dalam 5 menit, tunjukkan ke rekan: file mana yang kamu ubah saat menambah domain baru, dan mengapa <code>nginx.conf</code> tidak perlu disentuh.</li><li>Jelaskan perbedaan <code>nginx -t</code>, <code>nginx -s reload</code>, dan <code>systemctl restart nginx</code> dari sisi koneksi pengguna.</li><li>Susun daftar <b>3 hal</b> yang kamu dokumentasikan sebelum menyerahkan konfigurasi Nginx ke tim operasional.</li></ol>'
    }
  ],
  recap: [
    '<b>Modular</b> = <code>nginx.conf</code> tipis + <code>include conf.d/*.conf</code> + <code>snippets/</code> untuk yang dipakai berulang; konvensi penamaan membuat urutan baca dan review bisa ditebak siapa pun.',
    '<b>Graceful reload</b> (<code>nginx -t</code> → <code>nginx -s reload</code>) mengganti worker tanpa memutus koneksi; konfigurasi rusak selalu ditolak sebelum menyentuh trafik.',
    '<b>Edge proxy</b> menggabungkan static + API satu domain dan memecah multi-service lewat Host/path; blue-green dan pemisahan environment adalah pola di atas Nginx.',
    '<b>Review + dokumentasi</b> adalah bagian dari konfigurasi, bukan pekerjaan setelah deploy; OSS menyediakan semua dasarnya (Plus menambah health check aktif, API/dashboard, dan rekonfigurasi dinamis).'
  ]
});
