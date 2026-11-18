/* ============================================================
   Pelajaran Nginx — 06: Permission, 403/404 & SPA Fallback
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'file-403-404-spa',
  title: 'Permission, 403/404 & SPA Fallback',
  chapter: 'Web Server Statis',
  duration: '10 menit',
  intro: [
    'Malam ini kamu ke perpustakaan mencari buku di rak C-3. Kalau raknya ada tapi bukunya tidak, pustakawan bilang <b>&quot;tidak ketemu&quot;</b>. Kalau bukunya ada tapi tersimpan di lemari terkunci dan kamu bukan petugasnya, jawabannya <b>&quot;tidak boleh&quot;</b>. Dua jawaban sama-sama mengecewakan, tapi diagnosis-nya beda jauh.',
    'Di dunia server, yang pertama <b>404</b> (alamatnya salah), yang kedua <b>403</b> (alamatnya benar, izinnya salah). Salah baca, kamu akan muter-mener memperbaiki <code>root</code> padahal masalahnya <code>chmod</code>. Pelajaran ini membongkar siapa yang membaca file, matriks 403 vs 404, cara memblokir path sensitif, halaman error kustom, sampai SPA fallback yang tidak menyembunyikan error.'
  ],
  objectives: [
    'Menjelaskan siapa yang membaca file di server Nginx dan kenapa permission menentukan',
    'Membedakan penyebab 403 dan 404 lewat matriks keputusan',
    'Memblokir path sensitif seperti /private/ dengan return, deny, atau internal',
    'Membuat SPA fallback dengan try_files tanpa menyembunyikan error aset'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>403 vs 404: rak terkunci vs buku yang tidak ada</h3><p>Keduanya <b>sama-sama mengecewakan, tapi diagnosis-nya beda jauh</b>:</p><table><thead><tr><th>Situasi di perpustakaan</th><th>Status di server</th><th>Arti</th></tr></thead><tbody><tr><td>Rak ada, bukunya tidak ada</td><td><b>404 Not Found</b></td><td>Alamatnya salah atau file belum ter-deploy</td></tr><tr><td>Buku ada, tapi lemari terkunci</td><td><b>403 Forbidden</b></td><td>Alamatnya benar, izinnya salah</td></tr></tbody></table><p>Membedakan keduanya adalah separuh ilmu troubleshooting. Baca statusnya dulu sebelum menyentuh <code>root</code>, <code>alias</code>, atau <code>chmod</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Siapa yang membaca file?</h3><pre>   Client  --GET /index.html--&gt;  Nginx\n                                  |\n                          +-------+--------+\n                          | master process |  (root)\n                          +-------+--------+\n                                  | fork\n                          +-------+--------+\n                          | worker process |  (user nginx)\n                          +-------+--------+\n                                  | open() + read()\n                                  v\n                       /usr/share/nginx/html/index.html</pre><p>Di image resmi <code>nginx:alpine</code>, konfigurasi bawaannya memuat <code>user nginx;</code>. Master memang berjalan sebagai root, tetapi <b>worker-lah yang benar-benar membuka file</b> — dan worker memakai user <code>nginx</code>.</p><table><thead><tr><th>Objek di disk</th><th>Izin yang dibutuhkan</th><th>Kenapa</th></tr></thead><tbody><tr><td>Folder di sepanjang path</td><td><b>execute/search</b> (<code>x</code>)</td><td>Worker harus bisa &quot;melewati&quot; folder itu</td></tr><tr><td>Folder (untuk autoindex)</td><td><b>read</b> (<code>r</code>)</td><td>Membaca daftar isi</td></tr><tr><td>File HTML/CSS/JS/gambar</td><td><b>read</b> (<code>r</code>)</td><td>Isi file dikirim ke client</td></tr></tbody></table><p>Untuk konten statis publik, <code>chmod 644 file</code> dan <code>chmod 755 folder</code> biasanya sudah lebih dari cukup.</p>'
    },
    {
      type: 'text',
      html: '<h3>Matriks 403 vs 404</h3><table><thead><tr><th>Kondisi</th><th>Status</th><th>Petunjuk di error log</th></tr></thead><tbody><tr><td>File tidak ada di path hasil <code>root</code>/<code>alias</code></td><td><b>404</b></td><td><code>open() ... failed (2: No such file or directory)</code></td></tr><tr><td>File ada, tapi worker tidak punya izin baca</td><td><b>403</b></td><td><code>open() ... failed (13: Permission denied)</code></td></tr><tr><td>Folder ada, tidak ada index, <code>autoindex off</code></td><td><b>403</b></td><td><code>directory index ... is forbidden</code></td></tr><tr><td>Diblokir konfigurasi (<code>deny all</code> / <code>return 403</code>)</td><td><b>403</b></td><td>Memang disengaja</td></tr><tr><td>Lokasi ditandai <code>internal</code>, request datang dari luar</td><td><b>404</b></td><td>Memang disengaja</td></tr></tbody></table><p>Alur diagnosanya:</p><pre>muncul 403 atau 404?\n|\n|-- 404 --&gt; path hasil root/alias salah? typo? file belum ter-deploy?\n|            cek: podman exec nginx-lab nginx -T | grep -E "root|alias"\n|\n|-- 403 --&gt; cek isi container: podman exec nginx-lab ls -l /usr/share/nginx/html/\n              |-- file tidak terbaca (mode 600/000) --&gt; chmod 644\n              |-- folder tanpa index                  --&gt; tambah index / autoindex on\n              |-- memang diblokir konfigurasi         --&gt; itu memang disengaja</pre>'
    },
    {
      type: 'example',
      title: 'Tiga cara memblokir path sensitif',
      lang: 'nginx',
      output: false,
      code: `# 1. paling hemat: langsung berhenti, file tidak pernah dibuka
location /private/ {
    return 403;
}

# 2. memakai ngx_http_access_module (bawaan Nginx)
location ^~ /private/ {
    deny all;
}

# 3. hanya boleh lewat internal redirect (error_page, try_files, X-Accel-Redirect)
location /internal-reports/ {
    internal;
}`,
      explain: [
        '<code>return 403</code> paling ringan: request berhenti sebelum file apa pun dibuka dari disk.',
        '<code>deny all</code> memakai modul akses bawaan; kombinasikan dengan <code>allow</code> bila hanya IP tertentu yang boleh masuk, dan ingat <code>^~</code> menghentikan cek regex lain.',
        '<code>internal</code> membuat location hanya bisa dipanggil dari proses internal Nginx — request langsung dari luar membalas 404, bukan 403.',
        'Penting: memblokir URL <b>bukan</b> berarti file hilang. Untuk data benar-benar rahasia, kombinasikan dengan permission file (<code>chmod 600</code>) dan jangan taruh di folder web sama sekali.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Directive error_page</h3><pre>error_page 404 /404.html;\nerror_page 403 404 /error.html;</pre><p>Saat Nginx akan membalas kode tertentu, ia melakukan <b>internal redirect</b> ke URI yang kamu tentukan:</p><table><thead><tr><th>Bentuk</th><th>Arti</th></tr></thead><tbody><tr><td><code>error_page 404 /404.html;</code></td><td>Pindah ke <code>/404.html</code>, <b>kode 404 tetap</b></td></tr><tr><td><code>error_page 404 =200 /empty.gif;</code></td><td>Kode diganti jadi 200</td></tr><tr><td><code>error_page 404 = @fallback;</code></td><td>Diproses di <i>named location</i></td></tr><tr><td><code>error_page 404 https://contoh.com/nf;</code></td><td><b>Redirect keluar</b>, default balas 302</td></tr></tbody></table><ul><li>Method diubah menjadi <code>GET</code> untuk semua method selain <code>GET</code>/<code>HEAD</code>.</li><li>Pasangkan dengan <code>location = /404.html { internal; }</code> agar halaman error tidak bisa dibuka langsung oleh client.</li><li><code>error_page</code> diwariskan ke context di bawahnya <b>hanya bila</b> level itu tidak mendefinisikan <code>error_page</code> sendiri.</li><li>Nginx membatasi <b>10 internal redirect</b> per request; kalau lebih, keluar <b>500</b> dengan pesan <code>rewrite or internal redirection cycle</code>.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>SPA fallback dengan try_files</h3><p>Aplikasi React/Vue/Angular adalah &quot;satu file HTML&quot; — semua route seperti <code>/app/dashboard</code> atau <code>/app/settings</code> harus jatuh ke <code>index.html</code>, lalu aplikasi yang menentukan halaman mana yang tampil.</p><pre>GET /app/dashboard\n        |\n        v\nada file /usr/share/nginx/html/app/dashboard?  -- ya --&gt; kirim file itu\n        | tidak\n        v\nada direktori .../app/dashboard/?             -- ya --&gt; index\n        | tidak\n        v\ninternal redirect ke /app/index.html  --&gt;  200 (URL tetap /app/dashboard)</pre><p>Aturan emas: <b>file aset (JS/CSS/gambar) tidak boleh ikut fallback.</b> Kalau <code>/app/assets/app.js</code> hilang dan ikut jatuh ke <code>index.html</code>, browser menerima HTML dengan status 200 — error-nya jadi sangat sulit ditemukan. Solusinya: aset diberi <code>try_files $uri =404;</code> agar laporkan apa adanya.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: halaman error, blokir, dan SPA',
      lang: 'nginx',
      output: false,
      code: `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Halaman error kustom, hanya bisa dipanggil internal
    error_page 404 /404.html;
    error_page 403 /403.html;
    location = /404.html { internal; }
    location = /403.html { internal; }

    # Path sensitif: tolak tanpa membuka file apa pun
    location /private/ {
        return 403;
    }

    # Aset SPA: kalau hilang, laporkan 404 apa adanya
    location /app/assets/ {
        try_files $uri =404;
    }

    # SPA: route apa pun jatuh ke index.html aplikasi
    location /app/ {
        try_files $uri $uri/ /app/index.html;
    }
}`,
      explain: [
        '<code>error_page 404 /404.html;</code> mengganti halaman error bawaan Nginx, sementara <code>location = /404.html { internal; }</code> memastikan halaman itu tidak bisa dibuka langsung dari luar.',
        '<code>location /private/ { return 403; }</code> menolak sebelum file disentuh; <code>try_files $uri =404;</code> pada aset membuat JS/CSS yang hilang tetap melaporkan 404 jujur.',
        '<code>try_files $uri $uri/ /app/index.html;</code> berarti: cek file, cek direktori, terakhir internal redirect ke halaman aplikasi — statusnya 200 tapi URL tetap seperti asal request.',
        'Verifikasi dengan <code>nginx -t</code>, lalu jalankan deretan <code>curl -I</code> di Lab untuk membedakan 403 permission, 403 folder kosong, dan 404 file hilang.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: siapkan konten (termasuk file yang sengaja bermasalah)',
      lang: 'bash',
      output: false,
      code: `mkdir -p web/app/assets web/kosong nginx

printf '<!doctype html><title>Beranda</title><h1>Halaman utama</h1>\\n' > web/index.html
printf '<!doctype html><title>404</title><h1>Halaman tidak ditemukan</h1>\\n' > web/404.html
printf '<!doctype html><title>403</title><h1>Akses ditolak</h1>\\n'        > web/403.html
printf '<!doctype html><title>SPA</title><div id="root"></div>\\n<script src="/app/assets/app.js"></script>\\n' > web/app/index.html
printf 'console.log("SPA jalan");\\n' > web/app/assets/app.js
printf 'RAHASIA\\n' > web/secret.txt
chmod 000 web/secret.txt          # sengaja tidak terbaca

cat > nginx/default.conf <<'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;
    error_page 403 /403.html;
    location = /404.html { internal; }
    location = /403.html { internal; }

    location /private/ {
        return 403;
    }

    location /app/assets/ {
        try_files $uri =404;
    }

    location /app/ {
        try_files $uri $uri/ /app/index.html;
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
        '<code>chmod 000 web/secret.txt</code> membuat file ada di disk tapi tidak terbaca worker — pemicu 403 karena permission, bukan karena path salah.',
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> dan <code>test is successful</code> sebelum kamu menguji apa pun.',
        'Folder <code>web</code> di-mount read-only ke root Nginx, sehingga file <code>404.html</code>, <code>403.html</code>, dan isi SPA tersedia persis seperti yang diharapkan konfigurasi.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: 403 permission, 404, blokir, dan SPA',
      lang: 'bash',
      output: false,
      code: `curl -I http://localhost:8080/secret.txt
podman logs nginx-lab 2>&1 | grep -i 'denied'

curl -I http://localhost:8080/kosong/             # 403 (autoindex off, tanpa index)
curl -I http://localhost:8080/tidak-ada.html      # 404 + isi 404.html
curl -I http://localhost:8080/private/rahasia.txt # 403
curl -s http://localhost:8080/tidak-ada.html | grep -o 'tidak ditemukan'

curl -I http://localhost:8080/app/dashboard       # 200 — isi index.html SPA
curl -I http://localhost:8080/app/settings        # 200 — route lain, hasil sama
curl -I http://localhost:8080/app/assets/app.js   # 200, application/javascript
curl -I http://localhost:8080/app/assets/hilang.js # 404 (tidak ikut fallback)

chmod 644 web/secret.txt
curl -I http://localhost:8080/secret.txt          # 200, text/plain`,
      explain: [
        '<code>/secret.txt</code> awalnya <code>403 Forbidden</code> dan log memuat <code>Permission denied</code>; setelah <code>chmod 644</code>, request yang sama berubah jadi <code>200</code> dengan <code>Content-Type: text/plain</code> — bukti 403 tadi murni masalah izin.',
        '<code>/kosong/</code> balas <code>403</code> (folder ada, tanpa index, autoindex off) sedangkan <code>/tidak-ada.html</code> balas <code>404</code> berisi halaman kustom — beda penyebab, beda kode, dan keduanya terlihat dari <code>curl -I</code>.',
        '<code>/app/dashboard</code> dan <code>/app/settings</code> sama-sama <code>200</code> berisi index.html SPA, tapi <code>/app/assets/hilang.js</code> tetap <code>404</code> — aturan emas aset tidak ikut fallback terbukti.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum permission & error',
      text: '<ul><li><b>Langsung menyalahkan <code>root</code> saat 404</b>, padahal masalahnya permission &rarr; 403. Baca statusnya dulu.</li><li><b><code>chmod -R 777</code> sebagai solusi</b> &rarr; membuka file rahasia untuk semua orang. Cukup <code>644</code>/<code>755</code>.</li><li><b>Lupa <code>internal</code> pada halaman error</b> &rarr; <code>/404.html</code> jadi halaman publik yang bisa di-bookmark.</li><li><b>Semua route SPA ikut <code>try_files</code></b> &rarr; JS/CSS yang hilang diam-diam dibalas <code>index.html</code> berstatus 200.</li><li><b><code>error_page</code> tidak jalan</b> &rarr; kemungkinan context bawah sudah punya <code>error_page</code> sendiri, sehingga definisi atas tidak diwariskan.</li><li><b>Siklus fallback</b> &rarr; <code>try_files</code> jatuh ke URI yang mengarah ke lokasi sama, berujung 500 <code>rewrite or internal redirection cycle</code>.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Baca error log sebelum menebak',
      text: '<p>Satu baris log membedakan dua dunia: <code>failed (2: No such file or directory)</code> berarti <b>path-mu salah</b> (perbaiki <code>root</code>/<code>alias</code>), sedangkan <code>failed (13: Permission denied)</code> berarti <b>filenya ada, izinnya kurang</b> (perbaiki <code>chmod</code>). Jalankan <code>podman logs nginx-lab 2&gt;&amp;1 | grep -i failed</code> setiap kali muncul 403 atau 404 yang membingungkan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Permission', 'Izin baca/tulis/eksekusi (rwx) pada file dan folder.'],
        ['Ownership', 'Pemilik file (user:group) yang menentukan izin yang berlaku.'],
        ['403 Forbidden', 'Request ditolak: objek ada atau dikenal, tapi akses tidak diizinkan.'],
        ['404 Not Found', 'Objek tidak ditemukan di path yang diminta.'],
        ['error_page', 'Mengganti halaman atau kode error dengan URI lain lewat internal redirect.'],
        ['internal', 'Menandai location hanya boleh diakses dari proses internal Nginx.'],
        ['SPA', 'Single Page Application: satu index.html yang menangani semua route.'],
        ['Fallback', 'Pilihan terakhir ketika file yang diminta tidak ada.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Dari tabel matriks, sebutkan status yang muncul untuk: (a) <code>root</code> salah menulis folder, (b) file <code>chmod 000</code>, (c) folder kosong tanpa index, (d) <code>location /private/ { return 403; }</code>.</li><li>Tambahkan <code>error_page 500 502 /50x.html;</code> dan buktikan dengan <code>curl -I</code> bahwa kode asli tetap 502, bukan 200.</li><li>Buat route <code>/app/orders/123</code> yang tetap mengembalikan 200 berisi <code>index.html</code>, lalu tunjukkan bedanya dengan <code>/app/assets/hilang.js</code>.</li><li>Hapus <code>internal</code> dari <code>location = /404.html</code> dan amati apa yang berubah saat membuka <code>http://localhost:8080/404.html</code> langsung.</li></ol>'
    }
  ],
  recap: [
    '<b>Worker Nginx membuka file dengan user nginx</b> — folder sepanjang path butuh izin <code>x</code>, file butuh izin <code>r</code>.',
    '<b>404 = file tidak ada</b> di path hasil <code>root</code>/<code>alias</code>; <b>403 = objek ada tapi ditolak</b> (permission, autoindex off, atau blokir konfigurasi).',
    '<b>return 403 / deny all / internal</b> adalah tiga cara memblokir path; memblokir URL tidak menghapus file dari disk.',
    '<b>error_page</b> mengganti halaman error lewat internal redirect (pasangkan dengan <code>internal</code>); <b>SPA fallback</b> memakai <code>try_files $uri $uri/ /index.html</code> sementara aset diberi <code>=404</code> agar error tetap terlihat.'
  ]
});
