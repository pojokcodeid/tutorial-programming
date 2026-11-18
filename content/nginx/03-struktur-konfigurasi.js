/* ============================================================
   Pelajaran Nginx — 03: Struktur Konfigurasi Nginx: Directive & Context
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'struktur-konfigurasi',
  title: 'Struktur Konfigurasi Nginx: Directive & Context',
  chapter: 'Konfigurasi',
  duration: '10 menit',
  intro: [
    'Setiap gedung punya <b>peraturan berlapis</b>: peraturan gedung, peraturan lantai, peraturan unitmu, lalu aturan spesifik di dalam kamarnya. Nginx bekerja persis seperti itu — aturan di ruangan dalam <b>menimpa</b> aturan luar, asalkan ruangan itu belum punya aturan sendiri.',
    'Pelajaran ini membongkar isi <code>nginx.conf</code> dari baris pertama sampai terakhir: <b>directive</b> sebagai satu baris aturan, <b>context</b> sebagai blok pembungkusnya, hierarki <code>main &rarr; events &rarr; http &rarr; server &rarr; location</code>, aturan pewarisan, sampai trik <code>include</code> yang memecah konfigurasi raksasa jadi banyak file rapi.'
  ],
  objectives: [
    'Membaca struktur nginx.conf dari baris pertama sampai terakhir',
    'Membedakan directive (satu baris aturan) dengan context (blok pembungkus kurung kurawal)',
    'Menjelaskan hierarki main, events, http, server, location beserta aturan pewarisan',
    'Memakai include untuk memecah konfigurasi jadi banyak file yang rapi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Analogi: gedung dengan peraturan berlapis</h3><p>Di gedung, peraturan unit tidak boleh bertabrakan dengan peraturan gedung; penghuni hanya boleh mengatur bagian yang memang menjadi haknya. Nginx memakai logika yang sama, hanya saja &quot;gedung&quot; dan &quot;unit&quot; punya nama teknis.</p><table><thead><tr><th>Di gedung</th><th>Di konfigurasi Nginx</th><th>Nama teknisnya</th></tr></thead><tbody><tr><td>Peraturan dasar gedung</td><td>Aturan global untuk semua</td><td><b>Context main</b></td></tr><tr><td>Aturan cara memakai lift</td><td>Aturan cara kerja worker</td><td><b>Context events</b></td></tr><tr><td>Seluruh gedung</td><td>Seluruh traffic HTTP</td><td><b>Context http</b></td></tr><tr><td>Satu unit (satu penghuni)</td><td>Satu virtual host / domain</td><td><b>Context server</b></td></tr><tr><td>Satu ruangan</td><td>Aturan untuk satu path URL</td><td><b>Context location</b></td></tr><tr><td>Tulisan &quot;lampu mati jam 22:00&quot;</td><td><code>keepalive_timeout 65;</code></td><td><b>Directive</b></td></tr></tbody></table><p>Kuncinya: <b>aturan di ruangan dalam menimpa aturan luar, tapi hanya jika ruangan itu tidak punya aturan sendiri.</b> Persis seperti aturan di Nginx.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anatomi directive dan parameter</h3><p>Setiap aturan Nginx ditulis sebagai <b>nama directive</b>, lalu <b>parameter</b> yang dipisah spasi atau tab (tanpa koma), lalu ditutup titik koma. Blok <code>{ }</code> adalah kumpulan directive milik satu context.</p><pre>keepalive_timeout 65;   # nama + parameter + titik koma\nlocation /api {         # directive berbentuk blok (ada kurung kurawal)\n    return 200 &quot;ok&quot;;\n}\n# komentar             # berlaku sampai akhir baris</pre><p>Satu saja salah — lupa <code>;</code> atau kurang satu kurung kurawal — membuat <b>seluruh konfigurasi gagal dibaca</b>. Nginx tidak setengah-setengah: ia menolak hidup dengan konfigurasi rusak, bukan menebak maksudmu.</p>'
    },
    {
      type: 'text',
      html: '<h3>Hierarki context</h3><pre>main (paling luar, tanpa kurung kurawal)\n├── events { ... }           # cara kerja worker process\n└── http { ... }             # seluruh traffic HTTP\n        ├── server { ... }       # 1 virtual host (domain:port)\n        │       └── location / { ... }    # aturan per path URL\n        └── server { ... }\n                └── location /api { ... }</pre><table><thead><tr><th>Context</th><th>Isi</th><th>Contoh directive</th></tr></thead><tbody><tr><td><code>main</code></td><td>Pengaturan global proses</td><td><code>user</code>, <code>worker_processes</code>, <code>pid</code>, <code>error_log</code></td></tr><tr><td><code>events</code></td><td>Cara worker bekerja</td><td><code>worker_connections</code></td></tr><tr><td><code>http</code></td><td>Perlakuan umum semua request</td><td><code>include</code>, <code>sendfile</code>, <code>access_log</code></td></tr><tr><td><code>server</code></td><td>Satu virtual host</td><td><code>listen</code>, <code>server_name</code></td></tr><tr><td><code>location</code></td><td>Satu pola URL</td><td><code>root</code>, <code>index</code>, <code>proxy_pass</code>, <code>return</code></td></tr></tbody></table><p>Setiap directive punya context resmi. Menaruhnya di tempat lain membuat <code>nginx -t</code> menolak dengan pesan <code>directive is not allowed here</code> — misalnya <code>worker_connections</code> hanya boleh berada di <code>events</code>, dan <code>root</code> tidak boleh di <code>main</code>.</p>'
    },
    {
      type: 'example',
      title: 'Pewarisan: nilai paling dalam yang menang',
      lang: 'nginx',
      output: false,
      code: `http {
    keepalive_timeout 65;        # berlaku untuk SEMUA server
    server {
        keepalive_timeout 10;    # menimpa: hanya server ini
        location /api {
            keepalive_timeout 2; # menimpa lagi: hanya /api
        }
    }
}`,
      explain: [
        'Directive di context luar <b>diwarisi</b> ke context dalam; request ke <code>/api</code> memakai nilai <code>2</code> — <b>nilai paling dalam yang menang</b>, bukan gabungan dari tiga nilai.',
        'Sebagian directive menyediakan parameter <code>off</code> (misalnya <code>sendfile off;</code>) untuk mematikan warisan di context dalam.',
        'Verifikasi: tempel konfigurasi ini ke file lalu jalankan <code>podman exec nginx-lab nginx -t</code> — harus mencetak <code>syntax is ok</code> dan <code>test is successful</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Include: memecah konfigurasi jadi banyak file</h3><pre>include /etc/nginx/mime.types;      # satu file\ninclude /etc/nginx/conf.d/*.conf;   # banyak file sekaligus</pre><ul><li>Wildcard <code>*.conf</code> dievaluasi <b>urut alfabet</b> — karena itu file sering diberi awalan angka seperti <code>00-default.conf</code>.</li><li>Pakai <b>path absolut</b> agar tidak bergantung pada prefix instalasi.</li><li><code>nginx -T</code> membuka semua hasil <code>include</code> menjadi satu, sehingga kamu selalu bisa melihat konfigurasi efektif.</li></ul><h4>Praktik konfigurasi rapi</h4><ul><li>Komentari <b>kenapa</b>, bukan <b>apa</b>: <code># health check untuk LB</code> lebih berguna daripada <code># location /health</code>.</li><li>Satu directive per baris, indentasi konsisten 2–4 spasi mengikuti bloknya.</li><li>Satu <code>server</code> (satu domain) per file di <code>conf.d/</code>; potongan berulang dikumpulkan di folder <code>snippets/</code>.</li><li>Jangan menumpuk directive yang sama di context berdekatan tanpa sadar — timpa atau hapus.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: nginx.conf kecil + satu server per file',
      lang: 'nginx',
      output: false,
      code: `# /etc/nginx/nginx.conf — tetap kecil: pengaturan global + rujukan
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log  notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    keepalive_timeout  65;

    include  /etc/nginx/conf.d/*.conf;   # aturan per domain ada di sini
}

# /etc/nginx/conf.d/default.conf — satu file, satu server block
server {
    listen       80;
    server_name  _;            # konvensi: penanda server default

    location / {
        root  /usr/share/nginx/html;
        index index.html;
    }
}`,
      explain: [
        '<code>nginx.conf</code> hanya memuat pengaturan global (<code>user</code>, <code>worker_processes</code>, <code>error_log</code>, <code>pid</code>) plus rujukan <code>include</code> — semua aturan per domain disimpan di file terpisah.',
        '<code>worker_connections 1024</code> membatasi koneksi maksimal per worker, sedangkan <code>keepalive_timeout 65</code> menahan koneksi idle selama 65 detik untuk semua server di bawah blok <code>http</code>.',
        '<code>server_name _;</code> adalah konvensi penanda server default, bukan domain nyata; <code>location /</code> menangani semua URI yang belum tertangani location lain.',
        'Buktikan dengan <code>podman exec nginx-lab nginx -T</code>: baris <code># configuration file .../conf.d/default.conf:</code> harus muncul di tengah output.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Directive penting dan context-nya</h3><table><thead><tr><th>Directive</th><th>Context</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>user nginx</code> + <code>worker_processes auto</code></td><td>main</td><td>Worker berjalan sebagai user <code>nginx</code>, jumlahnya sama dengan jumlah CPU core</td></tr><tr><td><code>worker_connections 1024</code></td><td>events</td><td>Koneksi maksimal yang dilayani satu worker</td></tr><tr><td><code>include .../mime.types</code></td><td>http</td><td>Peta ekstensi file &rarr; tipe MIME</td></tr><tr><td><code>default_type</code></td><td>http</td><td>Tipe MIME dipakai bila ekstensi tidak dikenal</td></tr><tr><td><code>keepalive_timeout 65</code></td><td>http</td><td>Koneksi idle ditahan 65 detik</td></tr><tr><td><code>include conf.d/*.conf</code></td><td>http</td><td>Menyisipkan semua file di folder <code>conf.d</code></td></tr><tr><td><code>listen 80</code> + <code>server_name _</code></td><td>server</td><td>Port yang didengarkan + penanda server default</td></tr><tr><td><code>root</code> / <code>index</code></td><td>location</td><td>Direktori dasar file &amp; file bawaan direktori</td></tr></tbody></table><p>Cara cepat membacanya: mulai dari baris paling luar (pengaturan global), turun ke <code>events</code> dan <code>http</code>, lalu ikuti <code>include</code> ke file per domain — makin dalam, makin spesifik.</p>'
    },
    {
      type: 'example',
      title: 'Lab: bedah konfigurasi bawaan container',
      lang: 'bash',
      output: false,
      code: `podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -T
podman exec nginx-lab nginx -T | grep -nE '^(events|http|server) \\{|location'
curl -i http://localhost:8080`,
      explain: [
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> lalu <code>test is successful</code>; kalau muncul pesan <code>[emerg]</code>, jangan lanjut — perbaiki konfigurasinya dulu.',
        '<code>nginx -T</code> mencetak seluruh konfigurasi efektif, dan perintah <code>grep</code> berikutnya menyaring nomor baris blok <code>events</code>, <code>http</code>, <code>server</code>, beserta <code>location</code>-nya — bukti hierarkinya nyata dan bisa kamu tunjuk.',
        '<code>curl -i http://localhost:8080</code> harus membalas <code>HTTP/1.1 200 OK</code> dengan header <code>Server: nginx/...</code> dan halaman Welcome; biarkan container <code>nginx-lab</code> tetap hidup untuk dipakai di pelajaran berikutnya.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum pemula',
      text: '<ul><li><b>Lupa titik koma <code>;</code></b> &rarr; error <code>unexpected end of file</code> yang menyebut akhir file, bukan baris bermasalah — periksa dari atas saat pesannya membingungkan.</li><li><b>Directive di context yang salah</b> (misalnya <code>root</code> di <code>main</code>) &rarr; <code>directive is not allowed here</code>.</li><li><b>Salah baca pewarisan</b> — mengira nilai luar dan dalam digabung, padahal nilai dalam <b>menimpa penuh</b>.</li><li><b>File di <code>conf.d/</code> tidak termuat</b> karena <code>nginx.conf</code> tidak punya <code>include /etc/nginx/conf.d/*.conf;</code> atau path-nya salah — cek dengan <code>nginx -T</code>.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Baca konfigurasi efektif, bukan file mentah',
      text: '<p>Saat debugging, jangan hanya membuka file yang kamu edit — jalankan <code>nginx -T</code>. Perintah itu membuka semua wildcard dan <code>include</code>, mencetak seluruh konfigurasi efektif lengkap dengan nama file asalnya. Kalau direktori <code>conf.d/</code> tidak muncul di output, masalahnya ada di <code>include</code>, bukan di file server-mu.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Directive', 'Satu baris aturan berbentuk nama nilai; atau blok nama { }.'],
        ['Parameter', 'Nilai setelah nama directive, dipisah spasi tanpa koma.'],
        ['Context', 'Blok pembungkus yang menentukan ruang lingkup directive.'],
        ['Scope', 'Seberapa luas sebuah directive berlaku.'],
        ['Inheritance', 'Pewarisan nilai directive dari context luar ke context dalam.'],
        ['Include', 'Directive penyisip file konfigurasi lain, mendukung wildcard.'],
        ['nginx.conf', 'File konfigurasi utama tempat seluruh hierarki dimulai.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Dari output <code>nginx -T</code>, tunjukkan baris mana yang menjadi context <code>main</code>, <code>events</code>, <code>http</code>, dan <code>server</code> (sertakan nomor baris hasil <code>grep -n</code>).</li><li>Tulis potongan konfigurasi agar <code>keepalive_timeout</code> bernilai <code>65</code> di <code>http</code>, <code>30</code> di satu <code>server</code>, dan <code>5</code> di <code>location /api</code>; uji dengan <code>podman exec nginx-lab nginx -t</code>.</li><li>Jelaskan kenapa satu folder <code>conf.d/</code> dengan banyak file lebih baik daripada satu <code>nginx.conf</code> raksasa — sebutkan 2 keuntungan dan 1 risiko (petunjuk: urutan wildcard).</li></ol>'
    }
  ],
  recap: [
    'Konfigurasi Nginx = kumpulan <b>directive</b> (nama nilai;) di dalam <b>context</b> (blok kurung kurawal); satu tanda koma yang hilang membuat seluruh file gagal dibaca.',
    'Hierarki <b>main &rarr; events &rarr; http &rarr; server &rarr; location</b> — makin dalam makin spesifik, dan setiap directive hanya boleh berada di context resminya.',
    '<b>Pewarisan:</b> nilai luar berlaku ke dalam, context dalam menimpa penuh — bukan gabungan nilai.',
    '<b>Include</b> (mendukung wildcard, dievaluasi urut alfabet) memecah konfigurasi per file; konfigurasi rapi = komentar <i>kenapa</i>, indentasi konsisten, satu server block per file.'
  ]
});
