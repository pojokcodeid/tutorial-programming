/* ============================================================
   Pelajaran Nginx — 08: Rewrite, Redirect & error_page
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'rewrite-redirect-error',
  title: 'Rewrite, Redirect & error_page',
  chapter: 'Routing',
  duration: '10 menit',
  intro: [
    'Kamu pindah dari Jl. Lama ke Jl. Baru, sementara kartu nama lama masih tersebar di dompet teman-teman. Ada dua cara mengatasinya: <b>pos meneruskan surat</b> — petugas diam-diam meneruskannya ke alamat baru sehingga temanmu tidak tahu alamat berubah, atau <b>kamu kabari semua orang</b> — mereka menerima pemberitahuan lalu mengirim ulang surat ke alamat baru.',
    'Cara pertama = <b>internal redirect</b>, cara kedua = <b>external redirect (301/302)</b>. Keduanya memindahkan surat ke tujuan yang sama, tapi <b>siapa yang tahu</b> dan <b>siapa yang bekerja</b> berbeda total. Pelajaran ini membedah <code>return</code> dan <code>rewrite</code>, pemilihan 301 vs 302, <code>try_files</code> sebagai alat routing, sampai aturan ekstensi file.'
  ],
  objectives: [
    'Menulis rewrite dan return untuk mengubah atau memindah URI',
    'Membedakan internal redirect (diam-diam) dari external redirect (memberi tahu client)',
    'Memilih 301 atau 302 dengan tepat sesuai sifat perubahan URL',
    'Memakai try_files sebagai alat routing serta menulis aturan berbasis ekstensi file'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Analogi: pindah rumah</h3><p>Dua cara memindahkan surat ke alamat baru:</p><ul><li><b>Pos meneruskan surat</b> — surat tetap dikirim ke alamat lama, petugas diam-diam meneruskannya. Temanmu <b>tidak tahu</b> alamatmu berubah; yang penting suratnya sampai.</li><li><b>Kamu kabari semua orang</b> — temanmu menerima pemberitahuan <i>&quot;alamat saya sekarang Jl. Baru&quot;</i>, lalu mereka <b>mengirim ulang</b> surat ke alamat baru. Mereka tahu persis alamat lamanya sudah tidak berlaku.</li></ul><p>Cara pertama = <b>internal redirect</b>: Nginx memproses ulang URI sendiri, client tidak diberi tahu. Cara kedua = <b>external redirect</b>: client menerima kode 3xx beserta header <code>Location</code>, lalu mengirim request baru. Pahami perbedaan ini dulu, sisanya mengikuti.</p>'
    },
    {
      type: 'text',
      html: '<h3>return vs rewrite</h3><table><thead><tr><th>Directive</th><th>Kegunaan</th><th>Contoh</th></tr></thead><tbody><tr><td><code>return</code></td><td>Berhenti dan balas sekarang juga — paling sederhana</td><td><code>return 301 /new;</code></td></tr><tr><td><code>rewrite</code></td><td>Mengganti URI dengan regex, lalu diproses ulang</td><td><code>rewrite ^/old/(.*)$ /new/$1 last;</code></td></tr></tbody></table><p>Gunakan <code>return</code> kalau tidak ada pencocokan regex yang dibutuhkan: lebih cepat dan lebih mudah dibaca. Untuk <code>rewrite</code>, hafalkan bentuknya <code>rewrite regex replacement [flag];</code> beserta flag-nya:</p><table><thead><tr><th>Flag</th><th>Efek</th></tr></thead><tbody><tr><td>(tanpa flag)</td><td>Lanjut ke <code>rewrite</code> berikutnya di blok yang sama, lalu location dicari ulang</td></tr><tr><td><code>last</code></td><td>Hentikan rewrite, <b>cari location baru</b> untuk URI hasil rewrite (internal)</td></tr><tr><td><code>break</code></td><td>Hentikan rewrite, tetap di location sekarang</td></tr><tr><td><code>redirect</code></td><td>Balas <b>302</b> ke client (external)</td></tr><tr><td><code>permanent</code></td><td>Balas <b>301</b> ke client (external)</td></tr></tbody></table><ul><li>Replacement yang diawali <code>http://</code>, <code>https://</code>, atau <code>$scheme</code> <b>otomatis berhenti</b> dan menjadi redirect ke client.</li><li>Jika replacement memuat argumen baru, argumen lama ikut disambung — akhiri dengan <code>?</code> untuk membuangnya: <code>rewrite ^/user/(.*)$ /show?user=$1? last;</code></li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Internal redirect vs external redirect</h3><pre>INTERNAL (client tidak tahu)           EXTERNAL (client tahu)\n--------------------------           ----------------------\nGET /halaman-lama                     GET /old\n   |                                     |\n   v                                     v\nNginx: rewrite/try_files/error_page   Nginx: return 301 /new\n   |                                     |\n   v                                     v\nNginx proses ulang URI BARU           Client terima 301 + Location: /new\n   |                                     |\n   v                                     v\nbalas 200 ke client                   Client kirim request BARU ke /new\nURL di browser TETAP                  URL di browser JADI /new</pre><table><thead><tr><th></th><th>Internal redirect</th><th>External redirect</th></tr></thead><tbody><tr><td><b>Bentuk</b></td><td><code>rewrite ... last</code>, <code>try_files ... uri</code>, <code>error_page ... uri</code>, <code>index</code></td><td><code>return 301/302</code>, <code>rewrite ... permanent/redirect</code></td></tr><tr><td><b>Response ke client</b></td><td><b>Tidak</b> ada status 3xx</td><td><b>Ada</b> 3xx + header <code>Location</code></td></tr><tr><td><b>Request tambahan</b></td><td>Tidak — Nginx memproses ulang sendiri</td><td>Browser mengirim request baru</td></tr><tr><td><b>URL address bar</b></td><td>Tetap seperti semula</td><td>Berubah</td></tr><tr><td><b>Status akhir</b></td><td>200 (atau kode error asli)</td><td>301/302/303/307/308</td></tr><tr><td><b>Batas</b></td><td>Maksimal <b>10</b> per request &rarr; kalau lebih, <b>500</b></td><td>Tanpa batas</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>301 vs 302: pilih yang benar sejak awal</h3><table><thead><tr><th></th><th><b>301</b> Moved Permanently</th><th><b>302</b> Found</th></tr></thead><tbody><tr><td><b>Sifat</b></td><td>Permanen</td><td>Sementara</td></tr><tr><td><b>Browser</b></td><td><b>Mencache</b> — request berikutnya langsung ke URL baru</td><td>Tidak dicache, tetap mengecek URL lama</td></tr><tr><td><b>Pakai saat</b></td><td>URL lama tidak akan dipakai lagi</td><td>Perawatan, promosi, A/B test, pindah sementara</td></tr><tr><td><b>Cara menulis</b></td><td><code>return 301 /new;</code> / <code>rewrite ... permanent;</code></td><td><code>return 302 /new;</code> / <code>rewrite ... redirect;</code></td></tr><tr><td><b>Varian</b></td><td><b>308</b> = 301 yang mempertahankan method</td><td><b>307</b> = 302 yang mempertahankan method</td></tr></tbody></table><p>Salah memilih 301 adalah salah satu bug paling menyebalkan: browser user (dan mesin pencari) mengingatnya untuk waktu lama, sehingga mengembalikan 302 yang sudah terlanjur jadi 301 itu susah dibatalkan.</p>'
    },
    {
      type: 'text',
      html: '<h3>try_files sebagai alat routing</h3><p><code>try_files</code> tidak hanya &quot;cari file&quot; — parameter terakhirnya adalah <b>keputusan routing</b>:</p><pre>location /news/ {\n    try_files $uri $uri/ /news/index.html;   # jatuh ke halaman lain (URI)\n}\n\nlocation /status/ {\n    try_files $uri @pemeliharaan;            # jatuh ke named location\n}\n\nlocation @pemeliharaan {\n    return 503 "Layanan sedang pemeliharaan";\n}</pre><ul><li><b>URI terakhir</b> &rarr; internal redirect, location dicari ulang.</li><li><b><code>@nama</code></b> &rarr; langsung ke named location, tanpa pencarian location.</li><li><b><code>=code</code></b> &rarr; langsung balas kode error.</li></ul><h4>error_page sebagai router</h4><pre>error_page 404 /404.html;               # internal redirect, kode 404 tetap\nerror_page 500 502 503 504 /50x.html;\nerror_page 404 =200 /empty.gif;         # kode diganti\nerror_page 404 = @fallback;             # ke named location\nerror_page 404 https://contoh.com/nf;   # external, default balas 302</pre><p>Selalu pasangkan dengan <code>location = /404.html { internal; }</code> supaya halaman error tidak bisa diminta langsung dari luar.</p>'
    },
    {
      type: 'text',
      html: '<h3>Aturan ekstensi file</h3><p>Nginx <b>tidak pernah membaca isi file</b> untuk menebak tipenya — semuanya berdasarkan <b>ekstensi pada URI</b>, dan aturan per-ekstensi ditulis dengan regex location:</p><table><thead><tr><th>Aturan</th><th>Konfigurasi</th></tr></thead><tbody><tr><td>Sembunyikan file sensitif</td><td><code>location ~* \\.(env|inc|log|bak)$ { return 404; }</code></td></tr><tr><td>Paksa sebagai unduhan</td><td><code>location ~* \\.(zip|tar\\.gz)$ { types { } default_type application/octet-stream; }</code></td></tr><tr><td>Cache aset</td><td><code>location ~* \\.(css|js)$ { expires 30d; }</code></td></tr><tr><td>Teruskan ke backend</td><td><code>location ~* \\.php$ { fastcgi_pass ...; }</code></td></tr></tbody></table><p>Ingat pelajaran Location Matching: <b>urutan deklarasi regex menentukan pemenang</b>, dan query string tidak ikut pencocokkan — <code>/a.zip?x=1</code> tetap terlihat sebagai <code>/a.zip</code>.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: redirect, rewrite, routing, dan ekstensi',
      lang: 'nginx',
      output: false,
      code: `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;
    location = /404.html { internal; }

    # --- external redirect ---
    location = /old   { return 301 /new; }
    location = /promo { return 302 /new; }

    # --- rewrite internal ---
    location = /halaman-lama {
        rewrite ^/halaman-lama$ /halaman-baru last;
    }

    # --- routing dengan try_files ---
    location /news/ {
        try_files $uri $uri/ /news/index.html;
    }

    location /status/ {
        try_files $uri @pemeliharaan;
    }

    location @pemeliharaan {
        return 503 "Layanan sedang dalam pemeliharaan\\n";
    }

    # --- aturan ekstensi file ---
    location ~* \\.(env|inc|log)$ {
        return 404;
    }

    location ~* \\.zip$ {
        types        { }
        default_type application/octet-stream;
    }
}`,
      explain: [
        '<code>return 301 /new</code> dan <code>return 302 /new</code> adalah external redirect: client menerima kode 3xx beserta header <code>Location</code>, URL baru dibentuk dari header <code>Host</code> client.',
        '<code>rewrite ... last</code> pada <code>/halaman-lama</code> adalah internal: tidak ada header <code>Location</code>, Nginx mencari location baru untuk <code>/halaman-baru</code>, dan client tetap melihat URL aslinya.',
        '<code>try_files $uri $uri/ /news/index.html</code> merutekan route tak dikenal ke halaman utama berita, sedangkan <code>try_files $uri @pemeliharaan</code> melompat langsung ke named location tanpa pencarian location.',
        'Dua location regex terakhir menutup file sensitif dengan 404 dan memaksa <code>.zip</code> jadi unduhan — semuanya berdasarkan ekstensi URI, bukan isi file.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: siapkan konten dan konfigurasi',
      lang: 'bash',
      output: false,
      code: `mkdir -p web/news nginx

printf '<!doctype html><title>Beranda</title><h1>Beranda</h1>\\n'        > web/index.html
printf '<!doctype html><title>Baru</title><h1>Halaman baru</h1>\\n'      > web/new.html
printf '<!doctype html><title>Baru</title><h1>Isi halaman baru</h1>\\n'  > web/halaman-baru.html
printf '<!doctype html><title>404</title><h1>Tidak ditemukan</h1>\\n'    > web/404.html
printf '<!doctype html><title>News</title><h1>Berita terbaru</h1>\\n'     > web/news/index.html
printf 'PASSWORD=rahasia\\n'                                            > web/.env
printf 'isi arsip zip\\n'                                               > web/unduhan.zip

cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;
    location = /404.html { internal; }

    location = /old   { return 301 /new; }
    location = /promo { return 302 /new; }

    location = /halaman-lama {
        rewrite ^/halaman-lama$ /halaman-baru last;
    }

    location /news/ {
        try_files $uri $uri/ /news/index.html;
    }

    location /status/ {
        try_files $uri @pemeliharaan;
    }

    location @pemeliharaan {
        return 503 "Layanan sedang dalam pemeliharaan\\n";
    }

    location ~* \\.(env|inc|log)$ {
        return 404;
    }

    location ~* \\.zip$ {
        types        { }
        default_type application/octet-stream;
    }
}
EOF

podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 \\
  -v "$PWD/web":/usr/share/nginx/html:ro,Z \\
  -v "$PWD/nginx/default.conf":/etc/nginx/conf.d/default.conf:ro,Z \\
  docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t`,
      explain: [
        'File <code>web/.env</code> sengaja dibuat: ia <b>ada di disk</code> tapi harus tetap membalas 404 berkat aturan regex — inilah cara membuktikan 404-nya berasal dari konfigurasi, bukan dari ketiadaan file.',
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> dan <code>test is successful</code>; perhatikan balik miring di dalam regex location harus lolos utuh.',
        'Heredoc memakai <code>&lt;&#39;EOF&#39;</code> supaya karakter dolar pada <code>$uri</code> dan <code>$1</code> tidak diubah shell saat file ditulis.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: buktikan external, internal, routing, dan ekstensi',
      lang: 'bash',
      output: false,
      code: `curl -sI http://localhost:8080/old
curl -sI http://localhost:8080/promo
curl -s http://localhost:8080/new | grep -o 'Halaman baru'

curl -sI http://localhost:8080/halaman-lama
curl -s  http://localhost:8080/halaman-lama | grep -o 'Isi halaman baru'

curl -sI http://localhost:8080/news/berita-hari-ini
curl -sI http://localhost:8080/status/
curl -sI http://localhost:8080/.env
curl -sI http://localhost:8080/unduhan.zip
curl -sI http://localhost:8080/halaman-tidak-ada

podman exec nginx-lab ls -l /usr/share/nginx/html/.env
podman logs nginx-lab 2>&1 | tail -5`,
      explain: [
        '<code>/old</code> membalas <code>301 Moved Permanently</code> dan <code>/promo</code> membalas <code>302 Found</code>, keduanya dengan header <code>Location: http://localhost:8080/new</code> — bukti external redirect.',
        '<code>/halaman-lama</code> membalas <code>200 OK</code> <b>tanpa</b> header <code>Location</code>, tapi isinya <code>halaman-baru.html</code> — bukti internal redirect: client tidak diberi tahu, URL-nya tetap.',
        '<code>/news/berita-hari-ini</code> balas <code>200</code> berisi index berita dan <code>/status/</code> balas <code>503</code> dari named location — bukti <code>try_files</code> bekerja sebagai router.',
        '<code>/.env</code> balas <code>404</code> padahal perintah <code>ls -l</code> menunjukkan file itu benar-benar ada di disk, sedangkan <code>/unduhan.zip</code> balas <code>200</code> dengan <code>application/octet-stream</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum rewrite & redirect',
      text: '<ul><li><b><code>rewrite ... last</code> di location yang sama dengan pola URI hasil rewrite</b> &rarr; berputar 10 kali lalu <b>500</b> <code>rewrite or internal redirection cycle</code>. Pakai <code>break</code> kalau tidak perlu ganti location.</li><li><b>Mengira <code>return 301</code> itu internal</b> &rarr; client justru mengubah address bar-nya dan men-cache perubahan itu.</li><li><b>301 dipakai untuk URL sementara</b> &rarr; browser user mengingatnya terlalu lama; pakai 302/307.</li><li><b>Replacement tanpa <code>?</code></b> &rarr; argumen lama (<code>?id=1</code>) ikut tersambung ke URL baru.</li><li><b>Aturan ekstensi ditulis sebagai prefix biasa</b> (<code>location /secret.env</code>) &rarr; tidak akan menang melawan regex lain; tulis dengan <code>~*</code>.</li><li><b>Lupa <code>internal</code> pada halaman error</b> &rarr; <code>/404.html</code> jadi konten publik.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Bandingkan dengan curl -sI',
      text: '<p>Saat ragu apakah sebuah aturan internal atau eksternal, jalankan <code>curl -sI</code> (hanya header). Kalau muncul baris <code>HTTP/1.1 301</code> beserta <code>Location:</code>, itu ekstensi eksternal — client yang bekerja. Kalau statusnya langsung <code>200 OK</code> tanpa <code>Location</code>, itu internal — Nginx yang memproses ulang sendiri. Satu perintah membedakan dua dunia.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Rewrite', 'Mengganti URI request dengan pola regex sebelum diproses.'],
        ['last / break', 'Lanjut pencarian location baru / berhenti di location sekarang.'],
        ['Internal redirect', 'Nginx memproses URI baru sendiri tanpa memberi tahu client.'],
        ['External redirect', 'Client menerima 3xx + Location lalu mengirim request baru.'],
        ['301 / 302', 'Redirect permanen (dicache) / sementara (tidak dicache).'],
        ['Named location', 'Location @nama yang hanya dipanggil dari internal.'],
        ['error_page', 'Mengganti halaman atau kode error dengan URI lain.'],
        ['Aturan ekstensi', 'Kebijakan per jenis file (.env, .zip, .php) yang ditulis dengan regex.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis <code>rewrite</code> yang memindahkan <code>/artikel/2024/judul-kita</code> ke <code>/blog/judul-kita</code> (hint: capture <code>$1</code>), lalu buktikan dengan <code>curl -sI</code>.</li><li>Bedakan hasil <code>curl -sI /old</code> dengan <code>curl -sI /halaman-lama</code> — sebutkan header mana yang membedakannya.</li><li>Ubah <code>return 301 /new</code> menjadi <code>return 302 /new</code>, lalu jelaskan kapan kamu sengaja memilih versi sementara.</li><li>Tambahkan <code>location ~* \\.(sql|db)$ { return 404; }</code> <b>sebelum</b> aturan <code>.zip</code> dan uji <code>/backup.sql</code> — mengapa urutannya tidak perlu dikhawatirkan di kasus ini?</li></ol>'
    }
  ],
  recap: [
    '<b>return</b> untuk balas seketika; <b>rewrite</b> untuk mengganti URI dengan regex memakai flag <code>last</code>, <code>break</code>, <code>redirect</code>, atau <code>permanent</code>.',
    '<b>Internal redirect</b> = Nginx memproses ulang URI sendiri (tanpa <code>Location</code>, URL client tetap, maksimal 10 kali); <b>external redirect</b> = client menerima 3xx + <code>Location</code> lalu mengirim request baru.',
    '<b>301 permanen (dicache)</b> vs <b>302 sementara (tidak dicache)</b>; 307/308 menjaga method — pilih sejak awal karena 301 sulit dibatalkan.',
    '<b>try_files</b> bisa merutekan ke URI lain, named location (<code>@</code>), atau kode error (<code>=code</code>); aturan ekstensi file ditulis dengan regex location berdasarkan URI, bukan isi file.'
  ]
});
