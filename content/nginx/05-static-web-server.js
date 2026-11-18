/* ============================================================
   Pelajaran Nginx — 05: Static Web Server: root, alias, index, try_files
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'static-web-server',
  title: 'Static Web Server: root, alias, index, try_files',
  chapter: 'Web Server Statis',
  duration: '10 menit',
  intro: [
    'Kamu kirim paket ke &quot;Jl. Mawar No. 5&quot;: kurir memakai <b>alamat rumah utuh</b> — nomor rumah ditambahkan di belakang. Tapi untuk &quot;Gedung A lantai 3&quot;, kurir harus <b>mengganti</b> bagian &quot;kampus&quot; pada alamat dengan &quot;Gedung A lantai 3&quot;. Dua cara menerjemahkan alamat, satu tujuan yang sama.',
    'Begitu pula Nginx: <b>selalu menerjemahkan URI menjadi path file di disk</b>. <code>root</code> dan <code>alias</code> hanyalah dua cara menerjemahkan yang sama, lalu <code>index</code>, <code>try_files</code>, dan <code>autoindex</code> menentukan apa yang terjadi kalau hasil terjemahan itu tidak ada. Pelajaran ini membedah alurnya dari URL yang diketik user sampai file yang terbaca.'
  ],
  objectives: [
    'Menjelaskan alur dari URL yang diketik user sampai file yang dibaca Nginx',
    'Membedakan root dan alias beserta kapan memakai yang mana',
    'Memakai index dan try_files untuk menentukan file default',
    'Mengaktifkan autoindex dengan sadar risikonya serta memastikan MIME type benar'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Analogi: alamat rumah vs nama gedung</h3><p>Semua bermula dari satu kebiasaan Nginx: <b>menerjemahkan URI (alamat) menjadi path file (lokasi di disk)</b>. <code>root</code> dan <code>alias</code> adalah dua cara menerjemahkan yang sama.</p><table><thead><tr><th>Cara kerja alamat</th><th>Padanan di Nginx</th><th>Contoh</th></tr></thead><tbody><tr><td>Folder dasar <b>+</b> nomor rumah (URI lengkap)</td><td><code>root</code></td><td><code>root /data/w3;</code></td></tr><tr><td>Sebagian alamat <b>diganti</b> folder lain</td><td><code>alias</code></td><td><code>alias /data/w3/images/;</code></td></tr></tbody></table><p>Kuncinya cuma satu: struktur URL tidak harus sama dengan struktur disk — tapi kamu harus tahu mana yang dipakai, kalau tidak setiap 404 jadi tebakan mistis.</p>'
    },
    {
      type: 'text',
      html: '<h3>Dari URL ke file di disk</h3><pre>GET /docs/panduan.html\n        |\n        v  normalisasi URI  (%XX, /a/../b, //)\n  pilih location   &lt;-- aturannya di pelajaran Location Matching\n        |\n        v  terjemahkan ke filesystem\n   root  --&gt; folder root + URI lengkap\n   alias --&gt; nilai alias + sisa URI\n        |\n        v\n/usr/share/nginx/html/docs/panduan.html\n        |\n  ada? -- ya   --&gt; kirim file + header Content-Type\n          tidak --&gt; 404 (atau dicoba lagi oleh try_files)</pre><p>Perhatikan dua tahap yang sering tertukar: <b>location dicocokkan dengan URI</b>, sedangkan <b>file dibuka dengan path hasil <code>root</code>/<code>alias</code></b>. Salah satu saja meleset, hasilnya 404 meski file terlihat &quot;ada&quot; di matamu.</p>'
    },
    {
      type: 'text',
      html: '<h3>root dan alias: dua gaya terjemahan</h3><pre>location /i/ { root /data/w3; }              # /i/top.gif --&gt; /data/w3/i/top.gif\nlocation /i/ { alias /data/w3/images/; }     # /i/top.gif --&gt; /data/w3/images/top.gif</pre><table><thead><tr><th>Aspek</th><th><code>root</code></th><th><code>alias</code></th></tr></thead><tbody><tr><td>Cara kerja</td><td>Folder dasar + <b>URI lengkap</b></td><td>Nilai alias + <b>sisa URI</b></td></tr><tr><td>Struktur disk</td><td>Meniru struktur URL</td><td>Bebas, boleh beda dari URL</td></tr><tr><td>Context</td><td><code>http</code>, <code>server</code>, <code>location</code> (default <code>html</code>)</td><td><b>Hanya <code>location</code></b> — <code>nginx -t</code> menolak di context lain</td></tr><tr><td>Jebakan</td><td>Mengira <code>root</code> = folder isinya</td><td>Lupa <code>/</code> di akhir &rarr; nama file menempel ke folder</td></tr><tr><td>Di location regex</td><td>Tetap menempel URI</td><td>Wajib pakai capture: <code>alias /data/w3/images/$1;</code></td></tr></tbody></table><p>Dokumentasi menyarankan: bila isi alias persis sama dengan isi location, <b>pakai <code>root</code> saja</b> — lebih pendek dan tidak menyesatkan.</p>'
    },
    {
      type: 'text',
      html: '<h3>index dan try_files</h3><pre>index index.html index.htm;             # default bawaan\ntry_files $uri $uri/ /index.html;       # alternatif: try_files ... =404</pre><p><b><code>index</code></b> dipakai saat URI berakhir <code>/</code>. Kandidat dicari <b>kiri ke kanan</b>, yang pertama ketemu menang; bila tidak ada satu pun, Nginx lanjut ke <code>autoindex</code>.</p><p><b><code>try_files</code></b> mengecek beberapa kandidat berurutan (path dibangun dari <code>root</code>/<code>alias</code>), lalu parameter terakhir adalah keputusan saat semua gagal:</p><table><thead><tr><th>Parameter terakhir</th><th>Arti</th></tr></thead><tbody><tr><td><code>/index.html</code></td><td><b>Internal redirect</b> ke URI itu (location dicari ulang)</td></tr><tr><td><code>=404</code></td><td>Langsung balas kode error itu</td></tr><tr><td><code>@fallback</code></td><td>Pindah ke <i>named location</i></td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>autoindex: daftar isi folder</h3><pre>autoindex on | off;    # default: off</pre><table><thead><tr><th>Kondisi</th><th>Hasil</th></tr></thead><tbody><tr><td>Folder punya <code>index.html</code></td><td><code>index.html</code> disajikan</td></tr><tr><td><code>autoindex off</code>, tanpa index</td><td><b>403 Forbidden</b> (bukan 404!)</td></tr><tr><td><code>autoindex on</code>, tanpa index</td><td>Daftar isi folder</td></tr></tbody></table><p>Daftar isi membocorkan struktur servermu. Aktifkan hanya untuk arsip publik yang memang ingin dijelajahi, bukan untuk root website.</p><h4>MIME types dan jenis file</h4><p>Nginx menebak tipe konten dari <b>ekstensi file</b> lewat peta <code>mime.types</code>; ekstensi yang tidak dikenal memakai nilai <code>default_type</code>. Contoh: <code>.html</code> &rarr; <code>text/html</code>, <code>.css</code> &rarr; <code>text/css</code>, <code>.js</code> &rarr; <code>application/javascript</code>, <code>.png</code>/<code>.jpg</code>/<code>.svg</code> &rarr; tipe gambar, dan yang tidak dikenal &rarr; <code>application/octet-stream</code>.</p><p>Agar file di <code>/download/</code> selalu <b>terunduh</b> (bukan ditampilkan), kosongkan peta ekstensi lalu isi <code>default_type</code>: <code>types { } default_type application/octet-stream;</code></p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: web server statis lengkap',
      lang: 'nginx',
      output: false,
      code: `server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /docs/ { alias /usr/share/docs/; index index.html; }
    location /listing/ { autoindex on; }
    location /download/ {
        types        { }
        default_type application/octet-stream;
    }
    location /private/ { return 403; }
}`,
      explain: [
        '<code>root</code> menempel URI lengkap ke folder dasar, sedangkan <code>location /docs/ { alias /usr/share/docs/; }</code> mengganti prefix <code>/docs/</code> dengan folder terpisah — dua gaya terjemahan dalam satu server.',
        '<code>location /listing/ { autoindex on; }</code> menampilkan daftar isi folder ketika tidak ada <code>index.html</code>; <code>types { }</code> + <code>default_type application/octet-stream</code> membuat semua file di <code>/download/</code> benar-benar terunduh oleh browser.',
        '<code>location /private/ { return 403; }</code> menolak request sebelum file disentuh sama sekali — pembahasan tuntasnya ada di pelajaran Permission &amp; 403/404.',
        'Validasi dengan <code>nginx -t</code>, lalu buktikan tiap perilaku memakai <code>curl -I</code> — lihat Lab di bawah.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: siapkan konten statis dan jalankan container',
      lang: 'bash',
      output: false,
      code: `mkdir -p web/assets web/download web/listing web/private docs nginx
printf '<!doctype html><title>Beranda</title><link rel="stylesheet" href="/assets/style.css"><h1>Halo dari Nginx!</h1>\\n' > web/index.html
printf 'body { font-family: sans-serif; }\\n'  > web/assets/style.css
printf 'console.log("JS aktif");\\n'           > web/assets/app.js
printf 'catatan unduhan\\n'                    > web/download/catatan.txt
printf 'bukan index\\n'                        > web/listing/baca-dulu.txt
printf 'RAHASIA\\n'                            > web/private/rahasia.txt
printf '<!doctype html><title>Dokumen</title><p>Isi dokumentasi.</p>\\n' > docs/index.html
printf '<!doctype html><title>Panduan</title><p>Halaman panduan.</p>\\n'  > docs/panduan.html

cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location /docs/ { alias /usr/share/docs/; index index.html; }
    location /listing/ { autoindex on; }
    location /download/ { types { } default_type application/octet-stream; }
    location /private/ { return 403; }
}
EOF

podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 \\
  -v "$PWD/web":/usr/share/nginx/html:ro,Z \\
  -v "$PWD/docs":/usr/share/docs:ro,Z \\
  -v "$PWD/nginx/default.conf":/etc/nginx/conf.d/default.conf:ro,Z \\
  docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t`,
      explain: [
        'Folder <code>web</code> di-mount ke <code>/usr/share/nginx/html</code> (root) dan <code>docs</code> ke <code>/usr/share/docs</code> (alias) — sengaja terpisah supaya perbedaan dua direktif bisa dibuktikan.',
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> dan <code>test is successful</code>; kalau gagal, baca pesan <code>[emerg]</code>-nya sebelum lanjut.',
        'Isi <code>nginx/default.conf</code> memakai heredoc <code>&lt;&#39;EOF&#39;</code> agar karakter <code>$</code> dan kutip di dalamnya tidak diubah shell.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: buktikan tiap perilaku dengan curl -I',
      lang: 'bash',
      output: false,
      code: `curl -I http://localhost:8080/                      # 200, Content-Type: text/html
curl -I http://localhost:8080/assets/style.css      # 200, text/css
curl -I http://localhost:8080/docs/panduan.html     # 200 — datang dari alias
curl -I http://localhost:8080/docs/hilang.html      # 404 — tidak ada di folder alias
curl -I http://localhost:8080/download/catatan.txt  # 200, application/octet-stream
curl -I http://localhost:8080/listing/              # 200 — halaman autoindex
curl -I http://localhost:8080/private/rahasia.txt   # 403

podman exec nginx-lab ls /usr/share/nginx/html/docs  # No such file or directory
podman exec nginx-lab ls /usr/share/docs             # index.html  panduan.html
podman rm -f nginx-lab                               # bersihkan bila sudah selesai`,
      explain: [
        'Status tiap <code>curl -I</code> harus sesuai komentar: <code>/docs/panduan.html</code> balas <code>200</code> padahal folder <code>.../html/docs</code> tidak ada — bukti isi <code>/docs/</code> diambil dari folder alias yang terpisah.',
        '<code>/download/catatan.txt</code> balas <code>200</code> dengan <code>Content-Type: application/octet-stream</code>, sedangkan <code>/assets/style.css</code> balas <code>text/css</code> — berkat peta <code>mime.types</code>.',
        'Dua perintah <code>ls</code> terakhir membuktikan langsung di container: yang pertama menolak (folder memang tidak ada di root), yang kedua menampilkan <code>index.html</code> dan <code>panduan.html</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum web server statis',
      text: '<ul><li><b><code>root</code> diisi folder isinya</b> &rarr; Nginx mencari <code>/var/www/docs/docs/...</code> karena URI lengkap ikut terpasang, hasilnya 404.</li><li><b><code>alias</code> tanpa <code>/</code> di akhir</b> &rarr; nama file menempel ke nama folder (<code>/data/images</code> + <code>top.gif</code>).</li><li><b><code>alias</code> di context <code>http</code>/<code>server</code></b> &rarr; <code>nginx -t</code> langsung menolak.</li><li><b><code>autoindex on</code> di root server</b> &rarr; seluruh struktur website bocor ke publik.</li><li><b>Lupa <code>include mime.types</code></b> &rarr; browser menerima CSS/JS sebagai teks biasa sehingga tidak dieksekusi.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Selalu uji dengan curl -I, bukan tebakan',
      text: '<p><code>curl -I</code> mengambil header saja: kamu langsung melihat <b>status code</b> dan <b>Content-Type</b>, dua petunjuk pertama untuk menebak apakah masalahnya ada di terjemahan URI (<code>root</code>/<code>alias</code>), di file yang hilang, atau di peta MIME. Browser sering menyembunyikan detail ini dengan halaman error cantiknya — curl tidak.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['URI', 'Path pada URL, misalnya /docs/panduan.html.'],
        ['Filesystem path', 'Lokasi nyata file di disk.'],
        ['root', 'Folder dasar yang ditimpa URI lengkap.'],
        ['alias', 'Pengganti sebagian URI oleh folder lain.'],
        ['index', 'Daftar file default saat URI berakhir slash.'],
        ['try_files', 'Mengecek beberapa file berurutan, lalu jatuh ke fallback.'],
        ['autoindex', 'Daftar isi folder, default off.'],
        ['MIME type', 'Label tipe konten di header Content-Type.'],
        ['Internal redirect', 'Nginx memproses ulang URI baru tanpa memberi tahu client.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis path file di disk yang dibuka untuk <code>/</code>, <code>/assets/style.css</code>, dan <code>/docs/index.html</code> pada konfigurasi Lab di atas.</li><li>Ubah <code>location /docs/</code> memakai <code>root</code> saja (tanpa <code>alias</code>) — apa hasil <code>curl -I</code>, dan kenapa?</li><li>Buat folder <code>web/galeri/</code> berisi 3 gambar tanpa <code>index.html</code>; buktikan <code>autoindex off</code> menghasilkan 403 dan <code>autoindex on</code> menampilkan daftar file.</li><li>Tambahkan <code>location /img/ { alias /usr/share/nginx/html/assets/; }</code> lalu uji <code>curl -I http://localhost:8080/img/style.css</code>.</li></ol>'
    }
  ],
  recap: [
    'Inti kerja web server: <b>URI &rarr; path file</b> — <code>root</code> menambah URI lengkap, <code>alias</code> mengganti prefix URI.',
    '<b>index</b> memilih file default saat URI berakhir <code>/</code>; <b>try_files</b> mengecek kandidat lalu jatuh ke URI, <code>=code</code>, atau named location.',
    '<b>autoindex</b> default <code>off</code>; folder tanpa index + <code>autoindex off</code> = <b>403</b>, bukan 404.',
    '<b>MIME type</b> ditentukan ekstensi file; <code>types { }</code> + <code>default_type</code> membuat file benar-benar terunduh — dan semua itu diverifikasi dengan <code>curl -I</code>.'
  ]
});
