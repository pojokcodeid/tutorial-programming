/* ============================================================
   Pelajaran Nginx — 04: Mengelola & Memvalidasi Konfigurasi
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'mengelola-konfigurasi',
  title: 'Mengelola & Memvalidasi Konfigurasi',
  chapter: 'Konfigurasi',
  duration: '10 menit',
  intro: [
    'Restoran sedang ramai dan chef ingin mengganti resep. Ada dua cara: <b>tutup restoran sebentar</b> (pelanggan sempat tidak dilayani), atau <b>ganti resep di dapur yang tetap masak</b> — chef baru menerima resep baru sementara chef lama menyelesaikan pesanan yang sedang berjalan. Cara pertama = <i>restart</i>, cara kedua = <i>reload</i>.',
    'Nginx punya <code>nginx -s reload</code> khusus untuk mengganti konfigurasi <b>tanpa memutus koneksi yang sedang berjalan</b>. Syaratnya: resep baru harus dicek dulu — di Nginx, &quot;cek dulu&quot; berarti <code>nginx -t</code>. Pelajaran ini membedah dua perintah wajib itu, perbedaan reload dengan restart, serta bind mount yang membuat konfigurasimu hidup di host.'
  ],
  objectives: [
    'Memakai nginx -t untuk memvalidasi dan nginx -T untuk melihat konfigurasi efektif',
    'Membedakan reload (graceful, tanpa downtime) dengan restart (mati hidup total)',
    'Menjalankan Nginx dengan bind mount agar konfigurasi hidup di host',
    'Memisahkan konfigurasi per file di folder conf.d dan mengikatnya dengan include'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua perintah wajib: nginx -t dan nginx -T</h3><p><b><code>nginx -t</code></b> membaca konfigurasi lengkap (termasuk semua <code>include</code>) lalu melaporkan valid atau tidak — <b>tanpa mengubah apa pun</b>:</p><pre>$ nginx -t\nnginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful</pre><p>Hasilnya cuma dua: <code>test is successful</code> berarti aman di-reload; atau <code>nginx: [emerg] ...</code> disusul <code>test failed</code> berarti ada yang salah (syntax, file hilang, port bentrok) — perbaiki dulu, <b>jangan reload</b>.</p><p><b><code>nginx -T</code></b> mencetak <b>seluruh</b> konfigurasi efektif setelah wildcard dan <code>include</code> dibuka, lengkap dengan nama file asalnya. Kepakai untuk memastikan file di <code>conf.d/</code> benar-benar termuat dan untuk mendokumentasikan konfigurasi yang sedang aktif.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Aturan emas: tidak pernah reload sebelum nginx -t sukses.</b></blockquote>'
    },
    {
      type: 'text',
      html: '<h3>Reload vs restart</h3><table><thead><tr><th></th><th><code>nginx -s reload</code></th><th><code>podman restart nginx-lab</code></th></tr></thead><tbody><tr><td><b>Cara kerja</b></td><td>Master baca konfigurasi baru &rarr; spawn worker baru &rarr; worker lama menyelesaikan request lama</td><td>Hentikan seluruh proses container, jalankan lagi</td></tr><tr><td><b>Koneksi berjalan</b></td><td><b>Tetap hidup</b> sampai request selesai; downtime nol</td><td><b>Terputus</b> semua; ada jeda mati-hidup</td></tr><tr><td><b>Konfigurasi rusak</b></td><td>Ditolak; worker lama <b>tetap jalan</b> dengan konfigurasi lama</td><td>Container bisa gagal start</td></tr><tr><td><b>Kapan dipakai</b></td><td>Perubahan konfigurasi rutin (hampir selalu)</td><td>Ganti binary/env container, perbaikan darurat</td></tr></tbody></table><p>Alur baku di container: <b>edit &rarr; <code>nginx -t</code> &rarr; <code>nginx -s reload</code> &rarr; <code>curl</code> verifikasi</b>. Kalau <code>nginx -t</code> gagal, perbaiki file — Nginx lama tetap jalan dengan konfigurasi lamanya, tanpa satu pun request terganggu.</p>'
    },
    {
      type: 'text',
      html: '<h3>Bind mount: konfigurasi hidup di host</h3><p>Secara default file konfigurasi ada <b>di dalam container</b> — hilang kalau container dibuang. <b>Bind mount</b> menempelkan file atau folder host ke path di dalam container:</p><pre>podman run -d --name nginx-lab -p 8080:80 \\\n  -v &quot;$PWD/nginx.conf&quot;:/etc/nginx/nginx.conf:ro,Z \\\n  docker.io/library/nginx:alpine</pre><p>Bagian <code>-v</code> dibaca dengan pola <code>sumber:tujuan:opsi</code>:</p><table><thead><tr><th>Bagian</th><th>Arti</th></tr></thead><tbody><tr><td><code>$PWD/nginx.conf</code></td><td>File di <b>host</b> — yang kamu edit</td></tr><tr><td><code>/etc/nginx/nginx.conf</code></td><td>Lokasi di <b>container</b> — yang dibaca Nginx</td></tr><tr><td><code>ro</code></td><td><i>read-only</i>: container hanya boleh baca; konfigurasi memang tidak pernah ditulis container</td></tr><tr><td><code>Z</code></td><td>Pelabelan konten untuk <b>SELinux</b> (Fedora/RHEL); tanpa SELinux efeknya nol</td></tr></tbody></table><p>Hasilnya: edit file di host, jalankan <code>nginx -t</code> lalu reload — tidak perlu masuk container sama sekali, dan konfigurasi tetap selamat saat container dibuang.</p>'
    },
    {
      type: 'text',
      html: '<h3>Struktur folder conf.d</h3><pre>nginx-lab/                 # folder di HOST, di-mount ke container\n├── nginx.conf             # aturan global + rujukan include\n└── conf.d/\n    ├── 00-default.conf    # server default (urutan alfabet)\n    └── 01-status.conf     # server tambahan</pre><p>Cukup satu baris di dalam blok <code>http</code> untuk mengikat semuanya: <code>include /etc/nginx/conf.d/*.conf;</code></p><ul><li>Wildcard dievaluasi <b>urut alfabet</b> &rarr; penamaan <code>00-</code>, <code>01-</code> berguna bila urutan penting.</li><li>File tanpa akhiran <code>.conf</code> tidak ikut terbaca — jangan simpan catatan di folder itu dengan nama sembarangan.</li><li>Buktikan dengan <code>nginx -T</code>: header <code># configuration file .../conf.d/...</code> harus muncul untuk tiap file yang termuat.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: file utama yang di-mount',
      lang: 'nginx',
      output: false,
      code: `# nginx-lab/nginx.conf — di-mount ke /etc/nginx/nginx.conf
error_log  /var/log/nginx/error.log  notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    access_log  /var/log/nginx/access.log;
    include     /etc/nginx/mime.types;
    include     /etc/nginx/conf.d/*.conf;
}`,
      explain: [
        '<code>error_log ... notice</code> dan <code>access_log ...</code> mengarahkan log ke lokasi tetap, bukan ke log bawaan yang bisa hilang saat container dibuang.',
        '<code>pid /var/run/nginx.pid</code> adalah file PID master — tempat <code>nginx -s reload</code> mengirim sinyal; tanpa file ini reload tidak akan sampai ke proses yang benar.',
        '<code>include /etc/nginx/mime.types;</code> memuat peta ekstensi &rarr; MIME, sedangkan <code>include /etc/nginx/conf.d/*.conf;</code> menyeret semua file potongan ke konfigurasi efektif.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Directive penting di file utama</h3><table><thead><tr><th>Directive</th><th>Context</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>error_log ... notice</code></td><td>main</td><td>Log error ke lokasi tetap</td></tr><tr><td><code>pid /var/run/nginx.pid</code></td><td>main</td><td>File PID master, tujuan sinyal reload</td></tr><tr><td><code>worker_connections 1024</code></td><td>events</td><td>Koneksi maksimal per worker</td></tr><tr><td><code>access_log ...</code></td><td>http</td><td>Access log ke lokasi tetap (di image resmi mengarah ke stdout)</td></tr><tr><td><code>include .../mime.types</code></td><td>http</td><td>Peta ekstensi file &rarr; tipe MIME</td></tr><tr><td><code>include conf.d/*.conf</code></td><td>http</td><td>Menyeret semua file <code>conf.d/</code> ke konfigurasi efektif</td></tr></tbody></table><p>Isi <code>conf.d/00-default.conf</code> (satu server = satu file) menyusul langsung di Lab — di sini cukup pastikan kerangkanya sudah benar dulu.</p>'
    },
    {
      type: 'example',
      title: 'Lab: bind mount + konfigurasi per file',
      lang: 'bash',
      output: false,
      code: `podman rm -f nginx-lab
mkdir -p nginx-lab/conf.d

cat > nginx-lab/nginx.conf <<'EOF'
error_log  /var/log/nginx/error.log  notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    access_log  /var/log/nginx/access.log;
    include     /etc/nginx/mime.types;
    include     /etc/nginx/conf.d/*.conf;
}
EOF

cat > nginx-lab/conf.d/00-default.conf <<'EOF'
server {
    listen       80;
    server_name  _;

    location / {
        root  /usr/share/nginx/html;
        index index.html;
    }

    location = /health {
        return 200 "ok\\n";
    }
}
EOF

podman run -d --name nginx-lab -p 8080:80 \\
  -v "$PWD/nginx-lab/nginx.conf":/etc/nginx/nginx.conf:ro,Z \\
  -v "$PWD/nginx-lab/conf.d":/etc/nginx/conf.d:ro,Z \\
  docker.io/library/nginx:alpine

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -T | grep 'configuration file'
curl -i http://localhost:8080
curl -i http://localhost:8080/health`,
      explain: [
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> dan <code>test is successful</code> sebelum lanjut ke langkah berikutnya.',
        '<code>nginx -T | grep &quot;configuration file&quot;</code> harus menampilkan dua header: <code>.../nginx.conf</code> <b>dan</b> <code>.../conf.d/00-default.conf</code> — bukti kedua file benar-benar ikut termuat lewat bind mount.',
        '<code>curl -i http://localhost:8080</code> membalas <code>200 OK</code> dengan halaman Welcome, sedangkan <code>curl -i http://localhost:8080/health</code> membalas <code>200 OK</code> dengan body <code>ok</code> hasil <code>return 200</code>.',
        'Kalau header file <code>conf.d</code> tidak muncul, periksa dua hal: baris <code>include</code> di <code>nginx.conf</code> dan opsi <code>-v</code> saat container dijalankan.'
      ]
    },
    {
      type: 'example',
      title: 'Lab lanjutan: tambah server baru tanpa restart',
      lang: 'bash',
      output: false,
      code: `cat > nginx-lab/conf.d/01-status.conf <<'EOF'
server {
    listen       80;
    server_name  status.local;

    location = /status {
        return 200 "managed via conf.d\\n";
    }
}
EOF

podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -s reload
curl -i -H 'Host: status.local' http://localhost:8080/status
podman ps --filter name=nginx-lab

podman restart nginx-lab
curl -i http://localhost:8080/health`,
      explain: [
        'Setelah <code>nginx -s reload</code>, <code>curl -H &quot;Host: status.local&quot;</code> membalas <code>200 OK</code> dengan body <code>managed via conf.d</code>, dan <code>podman ps</code> menunjukkan container tetap <code>Up</code> — perubahan aktif tanpa pernah berhenti sekejap pun.',
        'Header <code>Host: status.local</code> wajib dipakai karena server baru memakai <code>server_name</code> itu; tanpa header tersebut request jatuh ke server default dan membalas halaman Welcome.',
        '<code>podman restart nginx-lab</code> membuat service hidup lagi, tapi waktu <code>Up</code>-nya mulai dari nol — artinya sempat mati sejenak. Bandingkan dengan reload yang koneksi berjalan tetap utuh.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum mengelola konfigurasi',
      text: '<ul><li><b>Langsung reload tanpa <code>nginx -t</code></b> — konfigurasi rusak membuat reload ditolak; justru aman. Bahaya muncul kalau kamu sampai pakai restart: baru ada downtime nyata.</li><li><b><code>nginx -t</code> di host padahal Nginx jalan di container</b> — yang dites adalah file host yang terpisah. Selalu jalankan <code>podman exec nginx-lab nginx -t</code>.</li><li><b>Lupa mount folder <code>conf.d/</code></b> — kamu mengedit file host, container memakai folder bawaannya sendiri, dan perubahan tak pernah terlihat.</li><li><b><code>conf.d/</code> tidak termuat</b> karena <code>nginx.conf</code> tidak punya <code>include /etc/nginx/conf.d/*.conf;</code> — buktikan lewat <code>nginx -T</code>.</li><li><b>Editor mengganti file (rename) saat menyimpan</b> — mount file bisa menunjuk inode lama. Simpan dengan menimpa konten, atau mount folder-nya saja.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Buktikan perubahan tanpa pernah berhenti',
      text: '<p>Untuk meyakinkan diri bahwa reload itu nol downtime, jalankan <code>curl</code> berulang dalam loop di satu terminal, lalu <code>nginx -s reload</code> di terminal lain. Semua request tetap <code>200 OK</code> — tidak ada yang putus. Sebaliknya, setelah <code>podman restart</code> kamu akan melihat jeda singkat: inilah alasan hampir semua perubahan konfigurasi cukup pakai reload.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['nginx -t', 'Memvalidasi konfigurasi tanpa menerapkannya.'],
        ['nginx -T', 'Mencetak seluruh konfigurasi efektif beserta nama file asalnya.'],
        ['Reload', 'Membaca ulang konfigurasi secara graceful tanpa memutus koneksi.'],
        ['Graceful', 'Proses lama diakhiri setelah request yang sedang berjalan selesai.'],
        ['Restart', 'Mematikan dan menjalankan ulang seluruh proses.'],
        ['Bind mount', 'Menempelkan file/folder host ke path di dalam container lewat -v.'],
        ['conf.d/', 'Folder potongan konfigurasi yang diseret oleh directive include.'],
        ['SELinux / Z', 'Mekanisme keamanan OS yang perlu pelabelan konten mount di Fedora/RHEL.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Hapus satu titik koma di <code>00-default.conf</code>, jalankan <code>nginx -t</code>, lalu tuliskan <b>pesan error persisnya</b>. Kembalikan ke semula sampai <code>test is successful</code>.</li><li>Jalankan <code>curl</code> berulang ke <code>http://localhost:8080/</code> sambil melakukan <code>nginx -s reload</code>, lalu buktikan tidak ada request yang gagal.</li><li>Beri 2 contoh kasus nyata ketika <b>reload tidak cukup</b> dan kamu harus <b>restart</b> (petunjuk: perubahan di luar isi file konfigurasi).</li></ol>'
    }
  ],
  recap: [
    '<b>nginx -t</b> = cek validitas tanpa mengubah apa pun, selalu sebelum reload; <b>nginx -T</b> = cetak konfigurasi efektif sebagai bukti file benar-benar termuat.',
    '<b>Reload</b> bersifat graceful: nol downtime, konfigurasi rusak justru ditolak dan Nginx lama tetap jalan — <b>restart</b> mematikan seluruh proses, hanya untuk perubahan di luar konfigurasi.',
    '<b>Bind mount</b> (-v sumber:tujuan:ro,Z) membuat konfigurasi hidup di host dan selamat dari penghapusan container.',
    'Pola modular: <b>nginx.conf global + conf.d per domain</b>, diikat satu baris include yang dievaluasi urut alfabet.'
  ]
});
