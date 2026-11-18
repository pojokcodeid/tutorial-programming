/* ============================================================
   Pelajaran Nginx — 01: Apa Itu Nginx? Kenapa Web Butuh Nginx
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'apa-itu-nginx',
  title: 'Apa Itu Nginx? Kenapa Web Butuh Nginx',
  chapter: 'Fondasi',
  duration: '10 menit',
  intro: [
    'Bayangkan kantor yang tiap menit didatangi ribuan orang. Kalau setiap tamu langsung mengetuk pintu ruangannya masing-masing, pintu ditabrak dan lobi berantakan. Solusi klasiknya: <b>satu lobi besar dengan satpam</b> yang meneruskan tamu ke ruangan yang benar, menolak orang asing, dan menampung antrian saat ruangan sedang penuh.',
    'Di dunia web, <b>Nginx adalah lobi itu</b>. Aplikasi backend-mu tetap duduk manis di dalam ruangan, sementara semua orang masuk lewat satu pintu yang dijaga Nginx. Pelajaran ini membedah arti Nginx, empat peran utamanya, posisinya di depan aplikasi, lalu menjalankan container Nginx pertamamu.'
  ],
  objectives: [
    'Menjelaskan apa itu Nginx dengan kalimatmu sendiri memakai analogi lobi kantor',
    'Membedakan 4 peran utama Nginx: web server, reverse proxy, load balancer, dan HTTP cache',
    'Menjelaskan posisi Nginx di depan aplikasi serta alasan arsitektur itu dipakai',
    'Menjalankan container Nginx pertama dan membukanya lewat perintah curl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Analogi: kantor dengan satu pintu masuk</h3><p>Bayangkan sebuah kantor yang ribuan orang mau masuk setiap menit. Kalau setiap tamu langsung mengetuk pintu ruangan masing-masing, ruangannya kewalahan: pintu ditabrak, lobi berantakan, dan tidak ada yang mengatur siapa boleh masuk.</p><p>Solusinya klasik: <b>buat satu lobi besar dengan satpam.</b> Tamu datang ke lobi, satpam meneruskan mereka ke ruangan yang benar, mencegah orang asing masuk ruangan tertentu, dan menampung antrian kalau ruangannya sedang sibuk.</p><table><thead><tr><th>Di kantor</th><th>Di dunia web</th></tr></thead><tbody><tr><td>Tamu</td><td>Client (browser, aplikasi HP)</td></tr><tr><td>Lobi + satpam</td><td><b>Nginx</b></td></tr><tr><td>Ruangan di belakang</td><td>Aplikasi/backend (Node, Python, Java, ...)</td></tr><tr><td>Antrian yang teratur</td><td>Koneksi &amp; request yang diatur Nginx</td></tr><tr><td>Satpam menolak orang asing</td><td>Nginx memblokir/membatasi akses</td></tr></tbody></table><p>Kuncinya satu: <b>semua orang masuk lewat satu pintu yang dijaga</b>, sementara aplikasi tetap tenang di dalam ruangan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Jadi, apa itu Nginx?</h3><p><b>Nginx</b> (dibaca &quot;engine-x&quot;) adalah <b>server web open source</b> yang dirilis pertama tahun 2004 oleh Igor Sysoev. Ia dirancang untuk satu hal yang jadi masalah besar di era itu: <b>melayani puluhan ribu koneksi secara bersamaan tanpa menumpuk proses yang boros.</b></p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Nginx = program yang duduk di depan aplikasi kamu</b>, menerima request HTTP dari internet, lalu memutuskan harus dibawa ke mana dan dijawab bagaimana.</blockquote><p>Satu hal penting: <b>Nginx tidak menulis aplikasi kamu.</b> Ia tidak menghitung saldo, tidak memvalidasi login, tidak menyimpan database. Ia hanya <i>mengatur lalu lintas</i> — dan itu sudah sangat banyak gunanya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Empat peran utama Nginx</h3><p>Satu binary, empat pekerjaan yang sering dipakai bersamaan:</p><table><thead><tr><th>Peran</th><th>Analogi</th><th>Pertanyaan yang dijawab</th></tr></thead><tbody><tr><td><b>Web server</b></td><td>Pelayan yang menyiapkan menu</td><td>&quot;Di mana file halamannya?&quot;</td></tr><tr><td><b>Reverse proxy</b></td><td>Satpam penerus ke ruangan</td><td>&quot;Ke aplikasi mana request ini?&quot;</td></tr><tr><td><b>Load balancer</b></td><td>Pembagi tugas antar ruangan</td><td>&quot;Aplikasi mana yang paling longgar?&quot;</td></tr><tr><td><b>HTTP cache</b></td><td>Gudang salinan cepat</td><td>&quot;Pernahkah permintaan ini dijawab sebelumnya?&quot;</td></tr></tbody></table><p>Secara detail: <b>web server</b> membaca file HTML, CSS, JavaScript, gambar, lalu mengirimkannya ke browser. <b>Reverse proxy</b> menerima request di port 80/443 lalu meneruskannya ke aplikasi (misal port 3000) dan mengembalikan jawabannya. <b>Load balancer</b> membagi request ke banyak salinan aplikasi. <b>HTTP cache</b> menyimpan salinan response agar tidak selalu menyusahkan backend.</p>'
    },
    {
      type: 'example',
      title: 'Dua peran paling sering dipakai bersama',
      lang: 'text',
      output: false,
      code: `Client ──HTTP :80──▶ [ Nginx ] ──HTTP :3000──▶ [ Aplikasi kamu ]
                      reverse proxy            (tidak diekspos publik)

                    ┌──▶ [ app-1 ]
Client ──▶ [ Nginx ]├──▶ [ app-2 ]
                    └──▶ [ app-3 ]`,
      explain: [
        'Bagian atas adalah <b>reverse proxy</b>: client hanya bicara ke port 80, Nginx meneruskan ke aplikasi di port 3000, dan client tidak pernah tahu ada aplikasi lain di balik layar.',
        'Bagian bawah adalah <b>load balancer</b>: satu pintu membagi request ke tiga salinan aplikasi; satu salinan mati, Nginx mengalihkan ke yang hidup.',
        'Buktikan sendiri: jalankan container lalu lihat <code>curl -i http://localhost:8080</code> — jawaban datang dari Nginx, bukan dari aplikasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kenapa Nginx harus &quot;di depan&quot; aplikasi?</h3><p>Kalau aplikasi langsung diekspos ke publik, kamu harus mengurus semuanya di dalam aplikasi: HTTPS, rate limit, CORS, melayani file statis, logging, dan seterusnya. Semua itu jadi tanggung jawab kode bisnis — yang seharusnya fokus menghitung saldo, bukan mengurus socket.</p><p>Dengan Nginx di depan:</p><ul><li><b>Keamanan</b> — TLS, blokir IP, dan batas request ditangani lapisan terpisah.</li><li><b>Skala</b> — satu pintu melayani banyak salinan aplikasi di belakangnya.</li><li><b>Ketahanan</b> — aplikasi bisa di-restart, di-scale, atau diganti tanpa client sadar.</li><li><b>Kecepatan</b> — file statis dan cache dilayani tanpa menyentuh aplikasi.</li></ul><p>Pola ini disebut <b>edge/gateway pattern</b>: Nginx adalah pintu masuk tunggal, aplikasi tetap privat di belakangnya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Nginx OSS vs Nginx Plus</h3><p>Sebelum melangkah, kamu perlu tahu ada dua versi supaya tidak bingung saat membaca dokumentasi:</p><table><thead><tr><th></th><th>Nginx OSS (open source)</th><th>Nginx Plus</th></tr></thead><tbody><tr><td><b>Biaya</b></td><td>Gratis, lisensi BSD-style</td><td>Berbayar, langganan</td></tr><tr><td><b>Fungsi inti</b></td><td>Lengkap: web server, proxy, load balancer, cache, TLS</td><td>Sama, plus tambahan</td></tr><tr><td><b>Health check aktif</b></td><td>Tidak ada (hanya deteksi pasif)</td><td>Ada (active health check)</td></tr><tr><td><b>Dashboard/API monitoring</b></td><td>Tidak ada</td><td>Ada</td></tr><tr><td><b>Support resmi</b></td><td>Komunitas</td><td>Support dari F5</td></tr></tbody></table><p>Untuk belajar dan sebagian besar produksi, <b>OSS sudah lebih dari cukup</b> — materi bab ini memakai OSS kecuali disebut lain.</p>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: server block paling sederhana',
      lang: 'nginx',
      output: false,
      code: `server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}`,
      explain: [
        '<code>server { ... }</code> adalah satu &quot;rumah&quot; virtual host — blok konfigurasi untuk satu situs; <code>listen 80</code> mendengarkan request HTTP di port 80.',
        '<code>server_name localhost</code> mencocokkan header Host <code>localhost</code>, sedangkan <code>location /</code> menangani semua request yang diawali <code>/</code>.',
        '<code>root</code> menentukan folder tempat file dicari (di container: <code>/usr/share/nginx/html</code>) dan <code>index</code> menentukan file yang dikirim bila client meminta folder.',
        'Konfigurasi ini dibedah tuntas di pelajaran Struktur Konfigurasi — di sini cukup kenali bentuknya dulu.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: container Nginx pertama kamu',
      lang: 'bash',
      output: false,
      code: `podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine

curl -i http://localhost:8080
podman logs nginx-lab
podman exec nginx-lab nginx -t
curl -s http://localhost:8080 | head -n 3`,
      explain: [
        'Baris pertama <code>curl -i</code> harus <code>HTTP/1.1 200 OK</code>, lalu header <code>Server: nginx/x.x.x</code>, dan body berisi <code>Welcome to nginx!</code>.',
        '<code>podman logs nginx-lab</code> menampilkan baris akses log untuk request curl tadi: IP, waktu, <code>GET /</code>, status <code>200</code>.',
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> dan <code>test is successful</code> — pastikan container statusnya <code>running</code> dulu, kalau tidak perintah ini gagal.',
        '<code>curl -s ... | head -n 3</code> menampilkan awal halaman HTML — bukti Nginx benar-benar membaca file dari disk lalu mengirimkannya.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum pemula',
      text: '<ul><li>Menganggap Nginx adalah &quot;aplikasi&quot; — sebenarnya ia lapisan pengatur lalu lintas <b>di depan</b> aplikasi.</li><li>Mengira Nginx menggantikan backend — Nginx tidak mengolah data bisnis sama sekali.</li><li>Langsung mengekspos port aplikasi ke publik tanpa reverse proxy.</li><li>Bingung <code>nginx -t</code> gagal padahal container belum jalan — cek dulu <code>podman ps</code>.</li><li>Menyangka semua fitur tersedia di OSS — health check aktif dan dashboard adalah fitur Nginx Plus.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Beda response dengan satu flag',
      text: '<p>Pakai <code>curl -i</code> (bukan <code>curl</code> biasa) saat belajar Nginx. Flag <code>-i</code> menampilkan <b>status line + header</b> di atas body, sehingga kamu langsung melihat status code dan header <code>Server</code> — dua petunjuk pertama saat mendiagnosis masalah web server.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Nginx', 'Server web open source yang berdiri di depan aplikasi.'],
        ['Web server', 'Program yang menyajikan file HTML/aset ke browser.'],
        ['Reverse proxy', 'Perantara yang meneruskan request client ke backend.'],
        ['Load balancer', 'Pembagi request ke banyak salinan backend.'],
        ['HTTP cache', 'Penyimpan salinan response agar tidak selalu ke backend.'],
        ['Upstream', 'Backend/aplikasi yang menerima request dari Nginx.'],
        ['OSS vs Plus', 'Versi gratis (open source) vs versi berbayar Nginx.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis <b>2 kalimat</b> menjelaskan Nginx ke teman yang belum tahu IT, memakai analogi lobi/kantor.</li><li>Sebutkan <b>4 peran Nginx</b> dan satu contoh nyata penggunaan masing-masing.</li><li>Jalankan <code>curl -i http://localhost:8080</code>, lalu sebutkan <b>status code</b> dan <b>header Server</b> yang muncul. Apa artinya?</li></ol>'
    }
  ],
  recap: [
    '<b>Nginx = server web</b> yang menerima request HTTP dan memutuskan ke mana request diteruskan.',
    'Empat peran utama: <b>web server, reverse proxy, load balancer, HTTP cache</b> — satu binary untuk empat pekerjaan.',
    'Pola dasarnya: <b>Nginx berdiri di depan aplikasi</b>, aplikasi tetap privat di belakangnya (edge/gateway pattern).',
    '<b>OSS gratis dan cukup untuk belajar serta sebagian besar produksi</b>; Plus menambah health check aktif, dashboard, dan support resmi.'
  ]
});
