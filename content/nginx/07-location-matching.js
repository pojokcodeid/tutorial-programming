/* ============================================================
   Pelajaran Nginx — 07: Location Matching & Urutan Evaluasi
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'location-matching',
  title: 'Location Matching & Urutan Evaluasi',
  chapter: 'Routing',
  duration: '10 menit',
  intro: [
    'Bayangkan gedung perkantoran dengan banyak pintu: <b>pintu utama bernomor</b> yang hanya cocok untuk alamat persis, <b>pintu bertanda khusus</b> yang begitu kamu lewat, pencarian jalan pintas dihentikan, <b>jalan pintas berpola</b> yang berhenti di pola pertama yang cocok, dan <b>pintu umum</b> yang hanya dipakai kalau tidak ada pintu lain yang cocok.',
    '<b>Location di Nginx bekerja persis seperti itu</b> — dan seperti gedung nyata, yang menentukan bukan pintu mana yang paling &quot;mirip&quot;, melainkan <b>aturan urutan yang disepakati semua orang</b>. Pelajaran ini membedah empat bentuk location, urutan evaluasinya, cara memprediksi pemenang saat konflik, serta beda URI (yang dicocokkan) dengan filesystem path (yang dibuka).'
  ],
  objectives: [
    'Mengenal 4 bentuk location: prefix biasa, exact =, prioritas ^~, dan regex ~ / ~*',
    'Menjelaskan urutan evaluasi Nginx saat memilih location',
    'Memprediksi location mana yang menang ketika ada konflik',
    'Membedakan URI (yang dicocokkan) dari filesystem path (yang dibuka)'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Empat bentuk location</h3><p>Sebelum memikirkan urutan, kenali dulu keempat bentuknya:</p><table><thead><tr><th>Bentuk</th><th>Contoh</th><th>Kapan dipakai</th></tr></thead><tbody><tr><td><b>Exact</b></td><td><code>location = /login</code></td><td>URI persis; paling cepat, pencarian langsung berhenti</td></tr><tr><td><b>Prefix biasa</b></td><td><code>location /documents/</code></td><td>Rute umum; Nginx memilih yang <b>terpanjang</b></td></tr><tr><td><b>Prefix prioritas</b></td><td><code>location ^~ /images/</code></td><td>Sama seperti prefix, <b>tapi menghentikan cek regex</b></td></tr><tr><td><b>Regex</b></td><td><code>location ~ \\.php$</code> / <code>~* \\.JPG$</code></td><td>Pola ekstensi/karakter; <code>~</code> sensitif huruf, <code>~*</code> tidak</td></tr></tbody></table><p>Ada juga <b>named location</b> <code>location @fallback</code> — tidak dipakai untuk request biasa, hanya sebagai tujuan <code>try_files</code>/<code>error_page</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>URI yang dicocokkan sudah dinormalisasi</h3><p>Sebelum dibandingkan dengan <code>location</code>, URI dinormalisasi lebih dulu:</p><pre>%70%61%6e%64%75%61%6e   --&gt;   /panduan          (decoding %XX)\n/docs/../docs/a.html    --&gt;   /docs/a.html      (resolusi . dan ..)\n//docs///a.html         --&gt;   /docs/a.html      (gabung //)</pre><p>Konsekuensinya penting: <b>query string tidak ikut dicocokkan.</b> Request <code>/docs/a.html?user=1</code> dicocokkan sebagai <code>/docs/a.html</code>, sehingga <code>location ~ user=1</code> <b>tidak akan pernah menang</b> — jangan pernah menulis aturan berdasarkan parameter query di <code>location</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Urutan evaluasi location</h3><pre>GET /images/badge/logo.jpg\n        |\n        v\n1. Exact match "="  -- cocok? --&gt; LANGSUNG MENANG, berhenti\n2. Kumpulkan semua prefix yang cocok, ingat YANG TERPANJANG.\n   Kalau yang terpanjang bertanda "^~" --&gt; MENANG,\n   langkah 3 dan 4 dilewati.\n3. Cek regex "~" dan "~*" URUTAN DEKLARASI dari atas.\n   Pertama yang cocok --&gt; MENANG.\n4. Tidak ada regex yang cocok --&gt; pakai prefix terpanjang\n   dari langkah 2.</pre><table><thead><tr><th>Prioritas</th><th>Jenis location</th><th>Aturan menang</th><th>Aturan kalah</th></tr></thead><tbody><tr><td><b>1</b></td><td><code>=</code> exact</td><td>URI sama persis &rarr; <b>menang seketika</b>, pencarian berhenti</td><td>Tidak pernah kalah bila URI-nya persis</td></tr><tr><td><b>2</b></td><td><code>^~</code> prefix prioritas</td><td>Harus menjadi <b>prefix terpanjang</b> yang cocok &rarr; menang, <b>regex tidak dicek</b></td><td>Kalau ada prefix lebih panjang tanpa <code>^~</code>, tetap lanjut ke regex</td></tr><tr><td><b>3</b></td><td><code>~</code> / <code>~*</code> regex</td><td><b>Urutan deklarasi di file konfigurasi</b> — yang pertama cocok menang</td><td>Yang dideklarasikan belakangan tidak pernah sempat diuji</td></tr><tr><td><b>4</b></td><td>Prefix biasa</td><td>Pilihan terakhir: yang <b>terpanjang</b> menang</td><td>Kalah ke regex yang cocok</td></tr></tbody></table><p>Aturan emasnya: <b>regex mengalahkan prefix biasa, <code>^~</code> menghentikan cek regex, <code>=</code> mengalahkan semuanya</b> — dengan satu syarat: <code>^~</code> hanya aktif kalau location-nya sendiri adalah prefix terpanjang yang cocok.</p>'
    },
    {
      type: 'text',
      html: '<h3>Regex: urutan deklarasi, bukan kecocokan terbaik</h3><p>Nginx <b>tidak</b> memilih regex yang paling spesifik. Ia membaca dari atas ke bawah dan berhenti di yang pertama cocok:</p><pre>location ~* \\.txt$      { return 200 "R2 txt"; }   # dibaca duluan\nlocation ~* ^/assets/    { return 200 "R3 assets"; } # dibaca belakangan</pre><p>Request <code>/assets/notes.txt</code> cocok dengan <b>keduanya</b>, tapi yang menang adalah <code>.txt</code> — karena dideklarasi pertama. Menukar urutan kedua blok akan menukar pemenangnya. Ingat juga bahwa regex di sini berlaku pada URI ternormalisasi, jadi kasus huruf besar/kecil mengikuti <code>~</code> (sensitif) atau <code>~*</code> (tidak sensitif).</p>'
    },
    {
      type: 'text',
      html: '<h3>URI vs filesystem path</h3><p>Dua dunia yang sering tertukar:</p><pre>   URI (dunia routing)              Filesystem path (dunia disk)\n   ------------------              ---------------------------\n   /documents/notes.txt   --&gt;      /usr/share/nginx/html/\n        ^                             documents/notes.txt\n        |                                  ^\n   dipakai untuk:                       dipakai untuk:\n   - mencocokkan location               - membuka file (open/read)\n   - rewrite dan redirect               - menentukan 404 vs 403\n   - log akses                          - nilai $document_root</pre><table><thead><tr><th>Variabel</th><th>Isi</th><th>Contoh</th></tr></thead><tbody><tr><td><code>$uri</code></td><td>URI ternormalisasi, <b>tanpa</b> query</td><td><code>/documents/notes.txt</code></td></tr><tr><td><code>$request_uri</code></td><td>URI asli persis yang dikirim client</td><td><code>/documents/notes.txt?dl=1</code></td></tr><tr><td><code>$document_root</code></td><td>Nilai <code>root</code> yang sedang berlaku</td><td><code>/usr/share/nginx/html</code></td></tr><tr><td><code>$request_filename</code></td><td>Path file final di disk</td><td><code>/usr/share/nginx/html/documents/notes.txt</code></td></tr><tr><td><code>$args</code></td><td>Query string</td><td><code>dl=1</code></td></tr></tbody></table><p>Penerjemahan URI &rarr; path dilakukan oleh <code>root</code>/<code>alias</code>. Ingat satu kalimat: <b>location dicocokkan dengan URI; file dibuka dengan path.</b></p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: server discriminator untuk semua aturan',
      lang: 'nginx',
      output: false,
      code: `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # 1. exact - menang seketika untuk "/"
    location = / {
        return 200 "A  exact  location = /\\n";
    }

    # 2. prefix biasa - jaring pengaman
    location / {
        return 200 "B  prefix location /\\n";
    }

    location /documents/ {
        return 200 "C  prefix /documents/\\n";
    }

    # 3. prefix prioritas - menghentikan cek regex
    location ^~ /images/ {
        return 200 "D  prefix ^~ /images/\\n";
    }

    # prefix LEBIH PANJANG tanpa ^~ - mengalahkan D
    location /images/badge/ {
        return 200 "X  prefix /images/badge/\\n";
    }

    # 4. regex - urutan deklarasi menentukan pemenang
    location ~* \\.(jpg|png)$ {   # dibaca pertama
        return 200 "R1 regex ekstensi gambar\\n";
    }

    location ~* \\.txt$ {          # dibaca kedua
        return 200 "R2 regex ekstensi .txt\\n";
    }

    location ~* ^/assets/ {       # dibaca ketiga
        return 200 "R3 regex prefix /assets/\\n";
    }
}`,
      explain: [
        '<code>location = /</code> membuat pencarian berhenti begitu URI persis <code>/</code>, sementara <code>location /</code> menjadi jaring pengaman terakhir bila tidak ada location lain yang cocok.',
        '<code>^~ /images/</code> menghentikan cek regex — tapi hanya untuk URI yang cocok prefix terpanjang; karena <code>/images/badge/</code> lebih panjang dan tidak bertanda <code>^~</code>, regex tetap diperiksa untuk URI di bawahnya.',
        'Tiga blok regex dibaca berurutan dari atas; <code>return 200 &quot;...&quot;</code> membalas teks langsung sehingga location mana yang menang langsung terlihat di body response.',
        'Pakai konfigurasi ini sebagai labatorium: setiap <code>curl</code> di bawah menghasilkan kode huruf yang berbeda sesuai tabel urutan evaluasi.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: pasang konfigurasi discriminator',
      lang: 'bash',
      output: false,
      code: `mkdir -p nginx
cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location = / {
        return 200 "A  exact  location = /\\n";
    }

    location / {
        return 200 "B  prefix location /\\n";
    }

    location /documents/ {
        return 200 "C  prefix /documents/\\n";
    }

    location ^~ /images/ {
        return 200 "D  prefix ^~ /images/\\n";
    }

    location /images/badge/ {
        return 200 "X  prefix /images/badge/\\n";
    }

    location ~* \\.(jpg|png)$ {
        return 200 "R1 regex ekstensi gambar\\n";
    }

    location ~* \\.txt$ {
        return 200 "R2 regex ekstensi .txt\\n";
    }

    location ~* ^/assets/ {
        return 200 "R3 regex prefix /assets/\\n";
    }
}
EOF

podman rm -f nginx-lab 2>/dev/null || true
podman run -d --name nginx-lab -p 8080:80 \\
  -v "$PWD/nginx/default.conf":/etc/nginx/conf.d/default.conf:ro,Z \\
  docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t`,
      explain: [
        'Heredoc <code>&lt;&#39;EOF&#39;</code> dipakai agar karakter balik miring dan dolar di konfigurasi tidak disentuh shell.',
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> dan <code>test is successful</code>; kalau ada blok regex yang salah tulis, pesan <code>[emerg]</code> akan menunjuk barisnya.',
        'Container hanya memuat konfigurasi ini — tidak ada file lain, sehingga setiap balasan <code>return 200</code> murni berasal dari salah satu location di atas.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: matriks prioritas dengan curl',
      lang: 'bash',
      output: false,
      code: `curl -s http://localhost:8080/                        # A  exact
curl -s http://localhost:8080/index.html               # B  prefix
curl -s http://localhost:8080/documents/page.html      # C  prefix
curl -s http://localhost:8080/documents/notes.txt      # R2 - regex mengalahkan prefix
curl -s http://localhost:8080/images/logo.jpg          # D  ^~ - regex R1 dilewati
curl -s http://localhost:8080/images/badge/logo.jpg    # R1 - prefix terpanjang tanpa ^~
curl -s http://localhost:8080/assets/app.js            # R3
curl -s http://localhost:8080/assets/notes.txt         # R2 - urutan deklarasi

curl -I http://localhost:8080/images/logo.jpg
curl -v http://localhost:8080/ 2>&1 | grep -E '^< HTTP|^< Content-Type'`,
      explain: [
        'Balasan tiap curl harus sesuai komentar: <code>/</code> menghasilkan <b>A</b> (exact menang seketika), <code>/images/logo.jpg</code> menghasilkan <b>D</b> (prefix <code>^~</code> menghentikan cek regex R1), dan <code>/images/badge/logo.jpg</code> menghasilkan <b>R1</b> karena prefix terpanjang <code>/images/badge/</code> tidak bertanda <code>^~</code>.',
        '<code>/documents/notes.txt</code> menghasilkan <b>R2</b> — bukti regex mengalahkan prefix biasa <code>/documents/</code>, walau prefix itu cocok untuk URI yang sama.',
        'Untuk membuktikan aturan urutan deklarasi: pindahkan blok <code>~* ^/assets/</code> ke atas blok <code>~* \\.txt$</code>, jalankan <code>nginx -t</code> lalu <code>nginx -s reload</code>, dan uji lagi <code>/assets/notes.txt</code> — sekarang <b>R3</b> yang menang.',
        '<code>curl -v ... | grep</code> menampilkan status code beserta <code>Content-Type: text/plain</code> dari <code>return</code> — memastikan yang berubah memang location, bukan tipe konten.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum location matching',
      text: '<ul><li><b>Menyusun regex berdasarkan &quot;paling spesifik&quot;</b> &rarr; Nginx memakai <b>urutan deklarasi</b>, bukan skor kecocokan.</li><li><b>Mengira <code>^~</code> selalu menang</b> &rarr; ia hanya aktif jika location itu sendiri adalah prefix <b>terpanjang</b> yang cocok.</li><li><b>Mencocokkan query string</b> (<code>location ~ user=1</code>) &rarr; query tidak pernah ikut pencocokan.</li><li><b>Lupa regex mengalahkan prefix biasa</b> &rarr; <code>location /documents/</code> bisa kalah ke <code>location ~ \\.txt$</code>.</li><li><b>Menguji dengan browser yang meng-cache</b> &rarr; selalu pakai <code>curl</code> supaya hasilnya murni dari Nginx.</li><li><b>Menaruh <code>location = /</code> setelah <code>location /</code></b> &rarr; urutannya tidak berpengaruh untuk exact match, tapi tetap rapikan dari spesifik ke umum agar pembaca config tidak bingung.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Buktikan pemenang dengan satu baris teks',
      text: '<p>Isi tiap location dengan <code>return 200 &quot;kode huruf&quot;;</code> saat belajar. Dengan begitu setiap <code>curl -s</code> langsung memberi tahu location mana yang menang tanpa perlu membuka log atau menebak dari isi file. Setelah paham, ganti <code>return</code> dengan <code>root</code>/<code>alias</code>/<code>proxy_pass</code> yang sebenarnya — location yang dipilih tidak berubah.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Location', 'Blok konfigurasi yang menangani URI tertentu.'],
        ['Prefix match', 'Pencocokan berdasarkan awalan URI; yang terpanjang menang.'],
        ['Exact match (=)', 'URI harus sama persis; pencarian langsung berhenti.'],
        ['Prioritas prefix (^~)', 'Menang tanpa mengecek regex, asal menjadi prefix terpanjang.'],
        ['Regex (~ / ~*)', 'Pola PCRE; ~* tidak memperhatikan huruf besar/kecil.'],
        ['Normalized URI', 'URI hasil decode %XX, resolusi titik-titik, dan gabung garis ganda.'],
        ['Named location', 'Location @nama yang hanya dipakai internal (try_files, error_page).'],
        ['Filesystem path', 'Lokasi file di disk hasil gabungan root/alias dengan URI.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Prediksi pemenang untuk <code>/</code>, <code>/documents/1.jpg</code>, <code>/images/a.png</code>, dan <code>/images/badge/a.txt</code>, lalu buktikan dengan <code>curl -s</code>.</li><li>Tambahkan <code>location ~* \\.JPG$</code> <b>sebelum</b> <code>location ~* \\.(jpg|png)$</code> — bagaimana hasil untuk <code>/images/logo.JPG</code>?</li><li>Buat <code>location = /documents/notes.txt</code> dan uji: apakah ia mengalahkan regex <code>\\.txt$</code>? Jelaskan kenapa.</li><li>Ganti satu <code>return 200</code> menjadi <code>alias</code> + <code>try_files</code>, lalu uji apakah location yang sama tetap dipakai (location menentukan konfigurasi, bukan file).</li></ol>'
    }
  ],
  recap: [
    'Empat bentuk location: <b><code>=</code> exact, prefix biasa, <code>^~</code> prefix prioritas, dan regex <code>~</code>/<code>~*</code></b>.',
    'Urutan evaluasi: <b>exact <code>=</code> menang seketika &rarr; prefix terpanjang (cek <code>^~</code>) &rarr; regex urutan deklarasi &rarr; prefix terpanjang</b>.',
    '<b><code>^~</code> menghentikan cek regex</b>, tapi hanya bila location itu sendiri prefix terpanjang yang cocok.',
    '<b>Regex mengalahkan prefix biasa</b>; di antara regex, yang <b>dideklarasi pertama</b> menang — dan <b>URI ternormalisasi tanpa query</b> dipakai untuk mencocokkan, filesystem path untuk membuka file.'
  ]
});
