/* ============================================================
   Pelajaran Nginx — 14: Caching & Performance
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'caching-performance',
  title: 'Caching & Performance',
  chapter: 'Caching & Performa',
  duration: '10 menit',
  intro: [
    'Warung kue langganan selalu menyiapkan <b>sepiring contoh di etalase</b> — dipungut siapa pun tanpa perlu masuk ke dapur — dan sebagian pelanggan juga menyimpan kue di kulkas rumah supaya besok tinggal makan. Dapur (upstream) hanya sibuk saat kue baru dibuat.',
    'Begitulah dua lapis cache di web: <b>proxy cache</b> Nginx (etalase) dan <b>browser cache</b> pelanggan (kulkas), lengkap dengan label &quot;boleh simpan sampai kapan&quot; berupa <code>Cache-Control</code>/<code>Expires</code>. Pelajaran ini juga menyalakan gzip dan optimasi pengiriman: <code>sendfile</code>, <code>tcp_nopush</code>, keepalive, dan buffering.'
  ],
  objectives: [
    'Membedakan browser cache dan proxy cache serta mengatur masa berlakunya dengan expires dan Cache-Control',
    'Mengaktifkan proxy_cache_path dan proxy_cache beserta proxy_cache_key, proxy_cache_valid, proxy_cache_bypass, dan proxy_no_cache',
    'Menguji cache MISS lalu HIT dengan dua kali curl dan membaca header X-Cache-Status',
    'Menyalakan gzip dan optimasi pengiriman seperti sendfile, tcp_nopush, keepalive, serta worker_connections'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua lapis cache, dua risiko</h3><p>Keduanya mempercepat dengan cara yang sama — menyimpan salinan jawaban — tetapi berada di tempat berbeda dan membawa risiko berbeda pula.</p><table><thead><tr><th></th><th>Browser cache</th><th>Proxy cache (Nginx)</th></tr></thead><tbody><tr><td><b>Disimpan di</b></td><td>laptop/HP pelanggan</td><td>server Nginx</td></tr><tr><td><b>Dikontrol oleh</b></td><td><code>expires</code>, <code>Cache-Control</code></td><td><code>proxy_cache_path</code>, <code>proxy_cache*</code></td></tr><tr><td><b>Keuntungan</b></td><td>nol request ke server</td><td>1 request ke upstream untuk ribuan user</td></tr><tr><td><b>Risiko</b></td><td>konten basi di client</td><td><b>konten salah saji ke user lain</b></td></tr></tbody></table><p>Karena itu aturan emasnya: <b>kue contoh boleh di etalase, kue pesanan khusus jangan</b> — data personal tidak boleh masuk cache yang dipakai bersama.</p>'
    },
    {
      type: 'text',
      html: '<h3>Browser cache: expires dan Cache-Control</h3><p>Directive <code>expires</code> (konteks http/server/location) menulis <b>dua header sekaligus</b>: <code>Expires</code> (tanggal kedaluwarsa) dan <code>Cache-Control: max-age=</code> (detik sejak sekarang). Defaultnya <code>expires off</code>, jadi tanpa directive ini browser bebas menebak sendiri.</p><table><thead><tr><th>Jenis konten</th><th>Tulisan</th><th>Hasil di response</th></tr></thead><tbody><tr><td>HTML</td><td><code>expires -1h;</code></td><td><code>Cache-Control: no-cache</code> → selalu cek ulang</td></tr><tr><td>Aset ber-hash (<code>app.3fa2.js</code>)</td><td><code>expires 30d;</code></td><td><code>Cache-Control: max-age=2592000</code></td></tr><tr><td>Konten personal</td><td><code>expires off;</code> + <code>add_header Cache-Control &quot;no-store&quot; always;</code></td><td>tidak boleh disimpan sama sekali</td></tr></tbody></table><p>Dua catatan dokumentasi yang penting: <code>expires</code>/<code>add_header</code> hanya menempel pada kode <b>200, 201, 204, 206, 301, 302, 303, 304, 307, 308</b> — beri <code>always</code> pada <code>add_header</code> agar ikut terkirim pada 403/404. Dan jangan mencampur <code>expires</code> dengan <code>add_header Cache-Control</code> di location yang sama, karena dua header <code>Cache-Control</code> akan saling bertarung.</p>'
    },
    {
      type: 'text',
      html: '<h3>Proxy cache: dari path ke header</h3><p>Alurnya sederhana: request masuk, Nginx mencari isi di folder cache. Bila ada → <code>X-Cache-Status: HIT</code> dan langsung dibalas; bila tidak ada → upstream dihubungi, jawabannya disimpan, dan statusnya <code>MISS</code>.</p><table><thead><tr><th>Directive</th><th>Konteks</th><th>Peran</th></tr></thead><tbody><tr><td><code>proxy_cache_path path levels=1:2 keys_zone=site:10m inactive=10m max_size=100m</code></td><td><b>http</b></td><td>Wajib: membuat folder cache + metadata bersama</td></tr><tr><td><code>proxy_cache zone</code> / <code>off</code></td><td>http, server, location</td><td>Menyalakan cache (default <code>off</code>)</td></tr><tr><td><code>proxy_cache_key</code></td><td>http, server, location</td><td>Identitas konten; dua URL sama = satu cache</td></tr><tr><td><code>proxy_cache_valid 200 302 10m;</code></td><td>http, server, location</td><td>Berapa lama tiap kode disimpan</td></tr><tr><td><code>proxy_cache_bypass</code> / <code>proxy_no_cache</code></td><td>http, server, location</td><td><b>bypass</b> = jangan <b>baca</b> cache; <b>no_cache</b> = jangan <b>simpan</b> response</td></tr><tr><td><code>add_header X-Cache-Status $upstream_cache_status always;</code></td><td>server, location</td><td>Membocorkan status cache supaya bisa diuji</td></tr></tbody></table><p>Nilai <code>$upstream_cache_status</code>: <b>MISS</b> (diambil dari upstream lalu disimpan), <b>HIT</b> (dari cache), <b>BYPASS</b> (<code>proxy_cache_bypass</code> aktif), <b>EXPIRED</b> (kedaluwarsa, versi baru diambil), <b>STALE</b> (kedaluwarsa + upstream error, versi lama dipakai), <b>UPDATING</b> (refresh berjalan), <b>REVALIDATED</b> (upstream menjawab 304).</p><p>Nginx <b>menolak menyimpan</b> response ber-<code>Set-Cookie</code> atau <code>Vary: *</code>, dan membaca <code>Expires</code>/<code>Cache-Control</code> milik upstream untuk menentukan masa simpan — keduanya bisa dimatikan lewat <code>proxy_ignore_headers</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Buffering dan gzip</h3><p><b>Buffering</b> (<code>proxy_buffering on</code>, default) berarti Nginx menarik response dari upstream secepat mungkin ke <code>proxy_buffers</code>, lalu menyalurkannya ke client yang lambat — upstream cepat bebas untuk request berikutnya. Matikan untuk SSE/streaming, atau biarkan upstream mengirim <code>X-Accel-Buffering: no</code>.</p><p><b>gzip</b> mengompresi response di Nginx. Empat hal yang paling sering salah:</p><table><thead><tr><th>Directive</th><th>Default</th><th>Catatan</th></tr></thead><tbody><tr><td><code>gzip on</code></td><td><b>off</b></td><td>Wajib dinyalakan manual; tanpa ini <code>gzip_types</code> tidak ada gunanya</td></tr><tr><td><code>gzip_types</code></td><td><b>hanya <code>text/html</code></b></td><td>Daftarkan sendiri css/js/json/svg — kesalahan paling umum</td></tr><tr><td><code>gzip_min_length</code> / <code>gzip_comp_level</code></td><td><code>20</code> / <code>1</code></td><td>Respons kecil jangan dibuang CPU; level 4–6 titik tengah terbaik</td></tr><tr><td><code>gzip_vary</code> / <code>gzip_proxied</code></td><td><code>off</code> / <code>off</code></td><td><code>vary on</code> menambah <code>Vary: Accept-Encoding</code>; <code>proxied</code> harus <code>any</code> agar response proxy ikut dikompres</td></tr></tbody></table><p>Yang sudah terkompresi (jpg, png, zip, woff2) jangan dimasukkan ke <code>gzip_types</code>. Kompresi hanya terjadi bila client mengirim <code>Accept-Encoding: gzip</code>; hasilnya <code>Content-Encoding: gzip</code> dan <code>Content-Length</code> asli hilang.</p>'
    },
    {
      type: 'text',
      html: '<h3>Optimasi pengiriman dan aturan main cache</h3><table><thead><tr><th>Directive</th><th>Default</th><th>Peran</th></tr></thead><tbody><tr><td><code>sendfile on</code></td><td><code>off</code> (image resmi sudah on)</td><td>File dikirim langsung dari kernel ke socket</td></tr><tr><td><code>tcp_nopush on</code> / <code>tcp_nodelay on</code></td><td><code>off</code> / <code>on</code></td><td><code>nopush</code> menyatukan header + awal file dalam satu paket (hanya saat sendfile on); <code>nodelay</code> agar paket kecil tidak ditahan</td></tr><tr><td><code>keepalive_timeout 65s</code> / <code>keepalive_requests 1000</code></td><td><code>75s</code> / <code>1000</code></td><td>Umur dan isi satu koneksi client</td></tr><tr><td><code>worker_processes auto</code> / <code>worker_connections 1024</code></td><td><code>1</code> / <code>512</code></td><td>Jumlah worker = jumlah CPU; koneksi per worker, termasuk koneksi ke upstream</td></tr></tbody></table><p>Perhitungannya: kapasitas klien ≈ <code>worker_processes × worker_connections</code>, dan tiap request proxy memakai <b>2 slot</b> (client + upstream) — siapkan minimal dua kali lipat, dibatasi <code>RLIMIT_NOFILE</code>. Lalu tiga aturan main cache:</p><ol><li><b>Filename ber-hash</b> (<code>app.3fa2.js</code>) aman diberi <code>expires 30d</code>; ganti file = hash ganti = versi lama ditinggalkan. HTML cukup <code>no-cache</code>.</li><li><b>Invalidation</b>: tunggu kedaluwarsa, hapus isi folder cache, atau lewati sekali dengan <code>?nocache=1</code>. Nginx OSS <b>tidak punya perintah PURGE bawaan</b> — ada modul <code>ngx_cache_purge</code> atau Nginx Plus.</li><li><b>Data personal</b>: cache key default tidak membawa cookie maupun <code>Authorization</code>, sehingga <code>/dashboard</code> per user bisa kebagian konten user lain. Cache hanya endpoint publik dan identik.</li></ol>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: cache, gzip, dan pengiriman',
      lang: 'nginx',
      output: false,
      code: `# /etc/nginx/nginx.conf
worker_processes auto;
events { worker_connections 1024; }        # per worker; proxy memakai 2 koneksi

http {
    sendfile on; tcp_nopush on; tcp_nodelay on;
    keepalive_timeout 65s; keepalive_requests 1000;

    gzip on;                                # default off
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024; gzip_vary on; gzip_proxied any;

    proxy_cache_path /var/cache/nginx/site levels=1:2 keys_zone=site:10m
                     inactive=10m max_size=100m use_temp_path=off;

    upstream backend {                      # koneksi ke backend dipakai ulang
        server app.internal:8080;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;

        location /                    { expires -1h; }            # HTML: no-cache
        location ~* \\.(js|css|png|svg|woff2)$ { expires 30d; }     # aset: 30 hari

        location ^~ /api/ {                                        # endpoint publik
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";   # wajib agar keepalive upstream jalan
            proxy_cache site;
            proxy_cache_key "$scheme$host$request_uri";
            proxy_cache_valid 200 10m;
            proxy_cache_valid 404 1m;
            proxy_cache_bypass $arg_nocache $cookie_nocache;
            proxy_no_cache $http_authorization;
            proxy_buffering on;
            add_header X-Cache-Status $upstream_cache_status always;
        }
    }
}`,
      explain: [
        '<code>proxy_cache_path ... keys_zone=site:10m</code> hanya boleh di konteks <code>http</code>: <code>keys_zone</code> adalah metadata di RAM, sedangkan isi file ada di <code>path</code>. Wajib ada sebelum <code>proxy_cache site</code> dipakai.',
        '<code>proxy_cache_key</code> menentukan identitas konten — dua URL dianggap sama bila key-nya sama, dan ini sumber utama kebocoran antar user.',
        '<code>proxy_cache_bypass</code> mencegah cache <b>dibaca</b>, <code>proxy_no_cache</code> mencegah response <b>disimpan</code>; keduanya aktif bila nilainya tidak kosong dan bukan <code>0</code>.',
        'Wildcard <code>^~ /api/</code> mencegah regex aset merebut path proxy seperti <code>/api/app.css</code>, dan <code>gzip_types</code> mengganti default yang hanya <code>text/html</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: konfigurasi cache dan gzip di container',
      lang: 'bash',
      output: false,
      code: `podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine
podman exec nginx-lab rm -f /etc/nginx/conf.d/default.conf   # hindari dua server_name localhost
# sendfile & keepalive_timeout sudah ada di nginx.conf bawaan: hapus dulu agar tidak duplikat
podman exec nginx-lab sed -i '/sendfile/d; /keepalive_timeout/d' /etc/nginx/nginx.conf

podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/14-cache.conf' <<'NGINX'
proxy_cache_path /var/cache/nginx/site levels=1:2 keys_zone=site:10m
                 inactive=10m max_size=100m use_temp_path=off;
sendfile on; tcp_nopush on; tcp_nodelay on; keepalive_timeout 65s;

gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1024; gzip_comp_level 5; gzip_vary on; gzip_proxied any;

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;

    location /                    { expires -1h; }
    location ~* \\.(js|css|png|jpg|svg|woff2)$ { expires 30d; try_files $uri =404; }

    location = /echo/gone { return 404; }
    location /echo/ { return 200 "upstream_time=$time_iso8601"; }

    location ^~ /pub/ {
        proxy_pass http://127.0.0.1:80/echo/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_cache site;
        proxy_cache_key "$scheme$proxy_host$request_uri";
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_bypass $arg_nocache $cookie_nocache;
        proxy_no_cache $http_authorization;
        proxy_buffering on;
        add_header X-Cache-Status $upstream_cache_status always;
    }
}
NGINX

podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
# file uji gzip: harus lebih besar dari gzip_min_length (1024 byte)
podman exec nginx-lab sh -c 'i=1; while [ $i -le 30 ]; do echo "/* blok $i padding padding padding padding padding */"; i=$((i+1)); done > /usr/share/nginx/html/app.css'`,
      explain: [
        'File <code>conf.d</code> memang sudah di-include ke dalam <code>http{}</code>, sehingga <code>proxy_cache_path</code> di file itu sah; menaruhnya di dalam <code>server{}</code> justru membuat <code>nginx -t</code> gagal.',
        'Heredoc <code>&lt;&lt;&#39;NGINX&#39;</code> menulis konfigurasi apa adanya, termasuk tanda kutip dan dolar, lalu <code>nginx -t</code> menyusul dengan hasil <code>syntax is ok, test is successful</code> sebelum reload.',
        'Baris terakhir membuat <code>app.css</code> berisi lebih dari 1024 byte supaya lolos <code>gzip_min_length</code> — file kecil tidak akan pernah terkompresi.',
        'Endpoint <code>/echo/</code> mengembalikan timestamp; karena duduk di balik <code>/pub/</code> yang di-cache, timestamp yang terbaca kedua kalinya membuktikan isi berasal dari cache.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: browser cache, gzip, dan MISS → HIT',
      lang: 'bash',
      output: false,
      code: `# 1) browser cache
curl -s -D - -o /dev/null http://localhost:8080/        | grep -i cache-control
curl -s -D - -o /dev/null http://localhost:8080/app.css | grep -iE 'cache-control|expires'

# 2) gzip: angka "gzip" lebih kecil dari tanpa gzip
curl -s -o /dev/null -H 'Accept-Encoding: gzip' -w 'gzip      : %{size_download} byte\\n' http://localhost:8080/app.css
curl -s -o /dev/null -w 'tanpa gzip : %{size_download} byte\\n' http://localhost:8080/app.css
curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' http://localhost:8080/app.css | grep -iE 'content-encoding|vary'

# 3) MISS lalu HIT - jalankan baris pertama dua kali
curl -s -D - -o /dev/null http://localhost:8080/pub/hello | grep -iE 'HTTP/|x-cache-status'

# 4) isi cache membeku, upstream tetap jalan
curl -s http://localhost:8080/pub/hello       # upstream_time=T (tersimpan di cache)
sleep 2
curl -s http://localhost:8080/pub/hello       # masih T - tidak diambil dari upstream
curl -s http://localhost:8080/echo/hello      # waktu sekarang (langsung tanpa cache)

# 5) BYPASS lalu bersihkan cache
curl -s -D - -o /dev/null 'http://localhost:8080/pub/hello?nocache=1' | grep -i x-cache-status
podman exec nginx-lab sh -c 'rm -rf /var/cache/nginx/site/*'
curl -s -D - -o /dev/null http://localhost:8080/pub/hello | grep -i x-cache-status`,
      explain: [
        'Uji 1: <code>/</code> menjawab <code>Cache-Control: no-cache</code>, sedangkan <code>/app.css</code> menjawab <code>max-age=2592000</code> beserta <code>Expires</code> 30 hari ke depan.',
        'Uji 2: ukuran dengan <code>Accept-Encoding: gzip</code> jauh lebih kecil dan muncul <code>Content-Encoding: gzip</code> plus <code>Vary: Accept-Encoding</code>. Perhatikan format <code>-w</code> memakai <code>\\n</code> untuk newline.',
        'Uji 3: request pertama <code>X-Cache-Status: MISS</code>, ulangi → <code>HIT</code>. Uji 4 membuktikan isi cache membeku: timestamp-nya tetap T sementara <code>/echo/hello</code> tetap menampilkan waktu sekarang.',
        'Uji 5: <code>?nocache=1</code> menjawab <code>BYPASS</code>; setelah folder cache dikosongkan, status kembali <code>MISS</code> — inilah cara termudah mereset cache di lab.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum caching dan performa',
      text: '<ul><li><b>Lupa <code>gzip on</code></b> → <code>gzip_types</code> tidak ada gunanya; <b>lupa <code>gzip_types</code></b> → hanya <code>text/html</code> yang dikompres; <code>gzip_proxied</code> tetap <code>off</code> → response proxy tidak ikut dikompres.</li><li><b><code>proxy_cache_path</code> ditulis di <code>server{}</code></b> → <code>nginx -t</code> gagal (hanya boleh di konteks <code>http</code>); <code>proxy_cache</code> tanpa <code>proxy_cache_path</code> → error <i>the &quot;site&quot; cache requires a shared memory zone</i>.</li><li><b><code>proxy_cache_valid</code> tidak di-set</b> → masa simpan hanya dihitung dari <code>Expires</code>/<code>Cache-Control</code> milik upstream.</li><li><b><code>add_header X-Cache-Status</code> tanpa <code>always</code></b> → hilang pada 403/404; satu <code>add_header</code> di location membuat header warisan level atas ikut gugur.</li><li><b><code>expires</code> digabung <code>add_header Cache-Control</code></b> di lokasi yang sama → dua header <code>Cache-Control</code> bertarung; pilih salah satu.</li><li><b>Endpoint personal ikut di-cache</b> dengan key berbasis <code>$request_uri</code> → user lain bisa melihat data user lain.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Header X-Cache-Status adalah jendela ke cache',
      text: '<p>Selama belajar, selalu tampilkan status cache pada response: <code>add_header X-Cache-Status $upstream_cache_status always;</code> lalu uji dengan <code>curl -s -D - -o /dev/null ... | grep -i x-cache-status</code>. Satu kata MISS, HIT, BYPASS, atau EXPIRED langsung memberi tahu apakah cache menyala, dipaksa lewat, atau kedaluwarsa — jauh lebih cepat daripada menebak dari kecepatan response saja.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Browser cache', 'Simpanan response di client, dikontrol Expires/Cache-Control.'],
        ['Proxy cache', 'Simpanan response di server Nginx, dikontrol proxy_cache*.'],
        ['proxy_cache_path', 'Folder plus keys_zone bersama untuk menyimpan cache; konteks http.'],
        ['proxy_cache_key', 'Identitas konten; key sama berarti konten dianggap sama.'],
        ['$upstream_cache_status', 'Variabel status cache: MISS, HIT, BYPASS, EXPIRED, dst.'],
        ['Invalidation', 'Membuang cache lama sebelum masa berlakunya habis.'],
        ['gzip', 'Kompresi response saat transit, butuh Accept-Encoding dari client.'],
        ['sendfile', 'Mengirim file langsung dari kernel ke socket.'],
        ['Keepalive', 'Koneksi TCP/TLS dipakai ulang untuk banyak request.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Ubah <code>expires 30d</code> menjadi <code>expires -1h</code> pada location aset, uji lagi dengan <code>curl -sI http://localhost:8080/app.css</code>, lalu jelaskan kenapa browser tetap men-download file setiap kali.</li><li>Hapus baris <code>proxy_cache_valid 200 302 10m;</code>, ulangi uji MISS → HIT, lalu jelaskan apa yang terjadi pada <code>X-Cache-Status</code> beserta penyebabnya.</li><li>Buat dua URL berbeda yang berisi konten sama, buktikan keduanya berbagi satu cache karena <code>proxy_cache_key</code>-nya sama — lalu tuliskan variabel tambahan yang kamu butuhkan agar terpisah (mis. <code>$cookie_user</code>) beserta risikonya.</li></ol>'
    }
  ],
  recap: [
    'Dua lapis cache: <b>browser</b> (<code>expires</code>/<code>Cache-Control</code>) dan <b>proxy Nginx</b> (<code>proxy_cache*</code>); <code>expires -1h</code> → no-cache, <code>expires 30d</code> → max-age 2592000.',
    'Proxy cache butuh <code>proxy_cache_path</code> (konteks http) + <code>proxy_cache</code>; kendali lewat <code>proxy_cache_key</code>, <code>proxy_cache_valid</code>, <code>proxy_cache_bypass</code> (tidak dibaca), dan <code>proxy_no_cache</code> (tidak disimpan).',
    '<code>X-Cache-Status</code> (<code>$upstream_cache_status</code>) bernilai MISS, HIT, BYPASS, EXPIRED, STALE, UPDATING, atau REVALIDATED — uji dengan dua kali curl.',
    'Default <b><code>gzip_types</code> hanya <code>text/html</code></b> (dan <code>gzip off</code>); <code>sendfile</code> + <code>tcp_nopush</code> mempercepat pengiriman file, keepalive memangkas handshake, dan <code>worker_connections</code> menghitung koneksi ke upstream juga.'
  ]
});
