/* ============================================================
   Pelajaran Nginx — 16: Logging, Monitoring & Troubleshooting
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'logging-troubleshooting',
  title: 'Logging, Monitoring & Troubleshooting',
  chapter: 'Logging & Troubleshooting',
  duration: '10–15 menit',
  intro: [
    'Setiap pesawat punya <i>black box</i>. Bukan untuk menghukum pilot, tapi untuk <b>menceritakan ulang kejadian</b> saat ada hal aneh. Tanpa rekaman itu, semua orang hanya menebak — dan server kamu juga begitu: saat user bilang &quot;kok error?&quot;, tanpa log kamu cuma menebak.',
    '<b>Log = black box-nya server.</b> Bukan soal menumpuk sebanyak mungkin, tapi memastikan log mampu menceritakan ulang kejadian: siapa minta apa, kapan, statusnya berapa, dan berapa lamanya. Pelajaran ini membaca kedua log itu, menyusun <code>log_format</code> sendiri, lalu membedah error 400–504 dengan metode <b>client → Nginx → upstream</b>.'
  ],
  objectives: [
    'Membaca access_log dan error_log, serta memilih log level yang tepat',
    'Menulis log_format custom berisi $request, $status, $request_time, $upstream_response_time, $remote_addr, dan request ID',
    'Membaca metrik dasar lewat stub_status dan menjelaskan konsep exporter',
    'Menganalisis error 400–504 memakai tabel diagnosis dan menjalankan troubleshooting sistematis client → Nginx → upstream'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Log = black box-nya server</h3><p>Server kamu menyimpan dua kotak hitam dengan isi yang berbeda peran:</p><table><thead><tr><th>Kotak</th><th>File</th><th>Isi</th><th>Dibuka saat</th></tr></thead><tbody><tr><td><b>Access log</b></td><td><code>access.log</code></td><td>Satu baris untuk tiap request yang selesai dilayani</td><td>Melihat pola &amp; status code</td></tr><tr><td><b>Error log</b></td><td><code>error.log</code></td><td>Kejadian tidak biasa: warning, error, konfigurasi salah</td><td>Mencari root cause</td></tr></tbody></table><p>Prinsipnya: <b>access.log menjawab &quot;apa yang terjadi&quot;, error.log menjawab &quot;mengapa bisa terjadi&quot;</b>. Keduanya dibaca berpasangan, bukan salah satu saja.</p>'
    },
    {
      type: 'text',
      html: '<h3>Log level: seberapa rinci error log</h3><p>Directive <code>error_log file level;</code> menulis kejadian dengan level minimum tertentu:</p><table><thead><tr><th>Level</th><th>Ditulis saat</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><code>debug</code></td><td>Detail teknis sangat halus</td><td>Mengejar bug sesaat (boros I/O)</td></tr><tr><td><code>info</code> / <code>notice</code></td><td>Informasi normal</td><td>Audit tertentu</td></tr><tr><td><code>warn</code></td><td>Perlu perhatian, masih jalan</td><td><b>Pilihan aman untuk produksi</b></td></tr><tr><td><code>error</code></td><td>Request gagal (mis. upstream mati)</td><td>Fokus kegagalan</td></tr><tr><td><code>crit</code> / <code>alert</code> / <code>emerg</code></td><td>Kritis sampai Nginx sulit melayani</td><td>Masalah besar</td></tr></tbody></table><p>Catatan: <code>access_log off;</code> mematikan log di konteks itu (hemat I/O, tapi kamu jadi buta). Di image resmi Nginx, <code>access.log</code> dan <code>error.log</code> sudah disambungkan ke <code>stdout</code>/<code>stderr</code> container — cukup baca dengan <code>podman logs nginx-lab</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>log_format dan variabel yang wajib hafal</h3><p>Format bawaan hanya enak dibaca manusia. Untuk analisis, buat format sendiri — <code>log_format</code> <b>hanya boleh di konteks <code>http</code></b> dan harus ada sebelum dipakai.</p><table><thead><tr><th>Variabel</th><th>Isi</th><th>Contoh</th></tr></thead><tbody><tr><td><code>$request</code></td><td>Metode + URI + protokol utuh</td><td><code>GET /api/users HTTP/1.1</code></td></tr><tr><td><code>$status</code></td><td>Status code response</td><td><code>200</code>, <code>502</code></td></tr><tr><td><code>$request_time</code></td><td>Waktu total client sampai selesai</td><td><code>0.043</code> (detik)</td></tr><tr><td><code>$upstream_response_time</code></td><td>Waktu Nginx menunggu upstream membalas</td><td><code>0.041</code>, atau <code>-</code> bila tanpa upstream</td></tr><tr><td><code>$remote_addr</code></td><td>IP client asli</td><td><code>103.94.12.7</code></td></tr><tr><td><code>$request_id</code></td><td>ID acak unik 16 karakter hex</td><td><code>9f3c1a7b2d4e5f60</code></td></tr></tbody></table><p>Bedah dua variabel waktu: <code>$request_time</code> = baca request + antrian + tunggu upstream + tulis response, sedangkan <code>$upstream_response_time</code> hanya bagian di belakang Nginx. Jadi <code>$request_time</code> besar tapi upstream kecil → masalah di sisi client (sering berujung <b>499</b>); keduanya besar → upstream lambat → berisiko <b>504</b>.</p>'
    },
    {
      type: 'example',
      title: 'Request ID menutup celah &quot;log ke-42 tidak membantu&quot;',
      lang: 'text',
      output: false,
      code: `client ──▶ [ Nginx  rid=9f3c1a ] ──▶ [ app-1  rid=9f3c1a ] ──▶ [ database ]
                 └── semua baris log memakai rid sama → tinggal grep 9f3c1a`,
      explain: [
        'Saat 100 request per detik, satu request butuh penanda unik — <code>$request_id</code> disimpan di log Nginx lalu diteruskan ke backend dengan <code>proxy_set_header X-Request-Id $request_id;</code>.',
        'Backend tinggal mencetak header yang sama, sehingga satu perintah <code>grep 9f3c1a</code> menghubungkan baris log Nginx, aplikasi, sampai query database.',
        'Verifikasi: kirim satu request <code>curl -s http://localhost:8080/</code>, lalu ambil ID-nya dari log dan pastikan nilai yang sama muncul di <code>podman logs --tail 5 nginx-lab</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>stub_status, log rotation, dan metrik</h3><p><code>stub_status</code> (modul <code>ngx_http_stub_status_module</code>) menampilkan hitungan internal Nginx — vital sign-nya: <code>Active connections</code>, baris <code>server accepts handled requests</code>, lalu <code>Reading</code>/<code>Writing</code>/<code>Waiting</code>. Artinya: <code>accepts</code>/<code>handled</code> = koneksi diterima/ditangani (selisihnya yang gagal), <code>requests</code> = total request (bisa lebih besar karena keepalive), dan ketiga angka terakhir = sedang membaca header / menulis response / idle menunggu.</p><p>Log tumbuh terus, jadi lakukan <b>rotasi</b>: arsipkan log lama (<code>mv access.log access.log.1</code>) lalu suruh Nginx membuka file baru dengan <code>nginx -s reopen</code> (alias kirim SIGHUP ke master; di server asli biasanya diotomatiskan logrotate).</p><p>Angka <code>stub_status</code> enak dibaca manusia, tapi Prometheus butuh angka yang bisa di-<i>scrape</i>: <code>[ Nginx stub_status ] → [ exporter ] → [ Prometheus ] → [ Grafana ]</code>. <b>Exporter</b> menerjemahkan data mentah Nginx ke format metrik; alternatifnya hitung dari access log lewat pipeline log. Nginx Plus punya API monitoring bawaan, OSS tidak.</p>'
    },
    {
      type: 'text',
      html: '<h3>Tabel diagnosis error 400–504</h3><p>Simpan tabel ini, jangan andalkan ingatan:</p><table><thead><tr><th>Kode</th><th>Arti</th><th>Penyebab umum</th><th>Langkah cek</th></tr></thead><tbody><tr><td><b>400</b></td><td>Bad Request</td><td>Header rusak/kebesaran, request line salah</td><td><code>curl -v</code>; cek <code>error.log</code> (&quot;too big header&quot;)</td></tr><tr><td><b>403</b></td><td>Forbidden</td><td>Permission file, aturan <code>allow</code>/<code>deny</code>, direktori tanpa index</td><td><code>ls -l</code> file; cek <code>deny</code>/<code>satisfy</code></td></tr><tr><td><b>404</b></td><td>Not Found</td><td><code>root</code>/<code>alias</code> salah, location tidak cocok, file tiada</td><td><code>nginx -T</code>; cocokkan URI dengan <code>location</code></td></tr><tr><td><b>499</b></td><td>Client closed request</td><td>Client menutup koneksi sebelum response selesai</td><td>Bandingkan <code>$request_time</code> vs <code>$upstream_response_time</code></td></tr><tr><td><b>500</b></td><td>Internal Server Error</td><td>Nginx gagal menulis log/cache, permission path runtime</td><td><code>error.log</code>; cek hak akses direktori</td></tr><tr><td><b>502</b></td><td>Bad Gateway</td><td>Upstream mati, port salah, response upstream rusak</td><td><code>curl</code> langsung ke port backend; cek proses backend</td></tr><tr><td><b>503</b></td><td>Service Unavailable</td><td>Upstream kelebihan beban, <code>limit_req</code> menolak</td><td><code>error.log</code> (&quot;limiting requests&quot;); cek kapasitas</td></tr><tr><td><b>504</b></td><td>Gateway Timeout</td><td>Upstream terlalu lambat melebihi <code>proxy_read_timeout</code></td><td>Cek <code>$upstream_response_time</code>; naikkan timeout / perbaiki backend</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Metode troubleshooting: client → Nginx → upstream</h3><p>Jangan langsung &quot;buka semua log&quot;. Telusuri <b>berurutan dari lapisan yang paling dekat dengan gejala</b>:</p><ol><li><b>Reproduksi</b> — ulangi dengan <code>curl -v</code>, catat status code dan header.</li><li><b>Client</b> — cek URL, DNS, header, jaringan; coba dari jaringan lain.</li><li><b>Nginx</b> — <code>error.log</code> menjelaskan <i>mengapa</i>, <code>access.log</code> menunjukkan <i>apa</i>, <code>nginx -T</code> memastikan konfigurasi yang benar-benar aktif.</li><li><b>Upstream</b> — keluarkan Nginx dari persamaan: <code>curl</code> langsung ke port backend. Kalau langsung juga gagal, masalahnya di backend.</li><li><b>Perbaiki satu hal, uji ulang</b> — jangan ubah lima hal sekaligus.</li></ol>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: log_format custom + stub_status',
      lang: 'nginx',
      output: false,
      code: `# context http — /etc/nginx/nginx.conf atau file include-nya
log_format detailed '$request_id $remote_addr [$time_local] "$request" $status '
                    'rt=$request_time uct=$upstream_connect_time urt=$upstream_response_time';
access_log /var/log/nginx/access.log detailed;
error_log  /var/log/nginx/error.log warn;

server {
    listen 80;
    server_name app.local;

    location /api/ {
        proxy_set_header Host         $host;
        proxy_set_header X-Request-Id $request_id;   # kirim rid ke backend
        proxy_pass http://api_backend;
        access_log /var/log/nginx/api.log detailed;
    }

    location = /nginx_status {
        stub_status;
        allow 10.0.0.0/8;    # sesuaikan dengan jaringan lab
        deny all;
    }
}`,
      explain: [
        '<code>log_format</code> mendefinisikan pola baris lalu <code>access_log ... detailed</code> memakainya — keduanya di konteks <code>http</code>; file log per-location (<code>api.log</code>) boleh ditimpa di <code>server</code>/<code>location</code>.',
        '<code>error_log ... warn</code> berarti hanya kejadian <code>warn</code> ke atas yang ditulis — level aman untuk produksi.',
        '<code>stub_status</code> dijaga <code>allow</code>/<code>deny</code>: tanpa itu, counter internal (jumlah koneksi dan request server) bocor ke publik.',
        '<code>X-Request-Id</code> meneruskan <code>$request_id</code> ke backend sehingga satu request bisa ditelusuri lintas sistem.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (1/2): pasang log format custom + stub_status',
      lang: 'bash',
      output: false,
      code: `podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/10-lab.conf' <<'NGINX'
log_format detailed '$request_id $remote_addr [$time_local] "$request" $status rt=$request_time urt=$upstream_response_time';
access_log /var/log/nginx/access.log detailed;

server {
    listen 80;
    server_name localhost;
    location = /nginx_status { stub_status; }
    location / { root /usr/share/nginx/html; index index.html; }
}
NGINX

podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
curl -s http://localhost:8080/nginx_status
curl -s -o /dev/null http://localhost:8080/tidak-ada.html
podman logs --tail 2 nginx-lab`,
      explain: [
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> dan <code>test is successful</code> sebelum reload dijalankan.',
        '<code>/nginx_status</code> menampilkan <code>Active connections</code>, baris <code>server accepts handled requests</code>, serta <code>Reading/Writing/Waiting</code> — vital sign Nginx.',
        'Request terakhir sengaja dibuat 404; <code>podman logs --tail 2</code> harus menampilkan baris log ber-<code>rid</code> (request ID) dengan status <code>404</code> — bukti format baru aktif.'
      ]
    },
    {
      type: 'example',
      title: 'Lab (2/2): sengaja picu 400, 404, 502, dan 504',
      lang: 'bash',
      output: false,
      code: `curl -s -o /dev/null -w '404 -> %{http_code}\\n' http://localhost:8080/tidak-ada.html
BIG=$(awk 'BEGIN{for(i=0;i<9000;i++)printf "a"}')
curl -s -o /dev/null -w '400 -> %{http_code}\\n' -H "X-Big: $BIG" http://localhost:8080/

podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/30-proxy.conf' <<'NGINX'
server {
    listen 80;
    server_name api.local;
    location /dead/ { proxy_pass http://127.0.0.1:9999/; }
}
NGINX
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
curl -s -o /dev/null -w '502 -> %{http_code}\\n' -H 'Host: api.local' http://localhost:8080/dead/

podman exec -d nginx-lab nc -l -p 9998
podman exec -i nginx-lab sh -c 'cat > /etc/nginx/conf.d/40-slow.conf' <<'NGINX'
server {
    listen 80;
    server_name slow.local;
    location / { proxy_read_timeout 2s; proxy_pass http://127.0.0.1:9998/; }
}
NGINX
podman exec nginx-lab nginx -t && podman exec nginx-lab nginx -s reload
curl -s -o /dev/null -w '504 -> %{http_code}\\n' -H 'Host: slow.local' http://localhost:8080/

podman exec nginx-lab sh -c 'echo "bukan_directive_ada;" > /etc/nginx/conf.d/99-broken.conf'
podman exec nginx-lab nginx -t
podman exec nginx-lab rm /etc/nginx/conf.d/99-broken.conf
podman exec nginx-lab nginx -t`,
      explain: [
        'Keempat kode tercetak sesuai urutan: <code>404</code> (file tiada), <code>400</code> (header 9000 karakter melebihi batas 8k), <code>502</code> (tidak ada listener di 127.0.0.1:9999), dan <code>504</code> setelah ±2 detik (listener diam dengan <code>proxy_read_timeout 2s</code>).',
        'Alasan tiap kode ada di error log: baca dengan <code>podman logs --tail 20 nginx-lab</code> — cari <code>connect() failed</code> untuk 502 dan <code>upstream timed out</code> untuk 504.',
        'Konfigurasi rusak harus <b>ditolak</b>: <code>nginx -t</code> pertama gagal dengan <code>unknown directive</code> — jangan reload; setelah file dihapus, <code>nginx -t</code> kembali <code>syntax is ok</code>.',
        'Bila <code>nc</code> tidak ada di image-mu, lewati uji 504 dan ulangi di pelajaran Capstone.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum',
      text: '<ul><li>Hanya membaca <code>access.log</code> saat mencari penyebab — <code>error.log</code> yang menjelaskan <b>mengapa</b>.</li><li>Menulis <code>log_format</code> di konteks <code>server</code>/<code>location</code> → directive itu hanya boleh di <code>http</code>.</li><li>Lupa <code>nginx -t</code> sebelum <code>nginx -s reload</code> → konfigurasi rusak terpakai.</li><li>Membiarkan <code>debug</code> menyala di produksi → disk penuh dan I/O meledak.</li><li>Mengira <code>$upstream_response_time</code> selalu sama dengan <code>$request_time</code> (padahal <code>-</code> saat tanpa upstream).</li><li>Menyajikan <code>/nginx_status</code> tanpa <code>allow</code>/<code>deny</code> → info server bocor ke publik.</li></ul>'
    },
    {
      type: 'vocab',
      items: [
        ['access_log', 'Log satu baris untuk tiap request yang dilayani.'],
        ['error_log', 'Log kejadian tidak biasa: warning sampai kegagalan.'],
        ['log level', 'Tingkat kerincian error log (debug … emerg).'],
        ['log_format', 'Pola penulisan baris log, hanya di konteks http.'],
        ['Request ID', 'Nomor unik per request untuk menghubungkan log antar sistem.'],
        ['stub_status', 'Halaman counter internal Nginx (koneksi, request).'],
        ['Log rotation', 'Mengarsipkan log lama + menyuruh Nginx membuka file baru.'],
        ['Exporter', 'Program yang menerjemahkan data Nginx ke format metrik.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Dari satu request <code>curl -v</code> ke <code>http://localhost:8080/</code>, tulis <b>3 baris log</b> yang paling informatif — sebutkan variabel yang dipakai.</li><li>Jelaskan beda <b>502</b> dan <b>504</b> dalam satu kalimat, lalu sebutkan <b>2 langkah cek</b> untuk masing-masing.</li><li>Buat skenario <code>$request_time</code> besar tapi <code>$upstream_response_time</code> kecil — apa artinya dan kode error apa yang mungkin muncul?</li></ol>'
    }
  ],
  recap: [
    '<b>Access log</b> = satu baris per request; <b>error log</b> = penjelasan kejadian tidak biasa; level produksi aman = <code>warn</code>.',
    '<code>log_format</code> hanya di konteks <code>http</code>; variabel inti: <code>$request</code>, <code>$status</code>, <code>$request_time</code>, <code>$upstream_response_time</code>, <code>$remote_addr</code>, <code>$request_id</code>.',
    '<b>Request ID</b> menghubungkan satu request di Nginx, backend, dan database lewat satu <code>grep</code>; <code>stub_status</code> = vital sign Nginx; rotasi log = arsipkan + <code>nginx -s reopen</code>; exporter mengubah counter jadi metrik.',
    'Diagnosis error 400–504 memakai tabel; troubleshooting berurutan <b>client → Nginx → upstream</b>, ubah satu hal lalu uji ulang.'
  ]
});
