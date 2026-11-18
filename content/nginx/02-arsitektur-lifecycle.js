/* ============================================================
   Pelajaran Nginx — 02: Arsitektur Nginx & Request Lifecycle
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'arsitektur-lifecycle',
  title: 'Arsitektur Nginx & Request Lifecycle',
  chapter: 'Fondasi',
  duration: '10 menit',
  intro: [
    'Ingat lobi dari pelajaran sebelumnya. Kali ini bayangkan lobi itu <b>dengan dua aturan aneh</b>: satu manajer yang hanya membagi tugas dan mengawasi, serta pegawai yang <b>tidak pernah tidur menunggu satu tamu</b> — begitu dokumen diproses di belakang, dia langsung melayani tamu berikutnya.',
    'Hasilnya luar biasa: dengan 4 pegawai, lobi bisa melayani <b>ribuan tamu</b> tanpa menambah pegawai. Dua aturan itulah inti arsitektur Nginx: <b>master + worker</b>, dan <b>event-driven non-blocking</b>. Pelajaran ini juga memetakan alur satu request HTTP dari client sampai response.'
  ],
  objectives: [
    'Menjelaskan perbedaan master process dan worker processes beserta tugas masing-masing',
    'Menjelaskan mengapa Nginx disebut event-driven dan non-blocking',
    'Memetakan alur request: client → Nginx → filesystem/upstream → response',
    'Memakai nginx -t dan nginx -T sebagai alat investigasi konfigurasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua aturan aneh yang jadi inti arsitektur</h3><p>Model lama (thread-per-request) bekerja seperti <b>satu pegawai per tamu</b>: 10.000 tamu berarti 10.000 pegawai, lobi langsung kolaps. Nginx memakai dua aturan berbeda:</p><ol><li><b>Satu manajer</b> mengatur semua pegawai — manajer ini tidak pernah menyapa tamu sendiri, ia hanya membagi tugas dan mengawasi.</li><li><b>Pegawai di lobi tidak pernah tidur menunggu satu tamu.</b> Begitu ada tamu datang, dia layani; sementara menunggu dokumen diproses di belakang, dia langsung melayani tamu berikutnya.</li></ol><p>Aturan pertama melahirkan <b>master + worker</b>, aturan kedua melahirkan <b>event-driven non-blocking</b>. Keduanya akan kita bedah di bagian berikut.</p>'
    },
    {
      type: 'text',
      html: '<h3>Master process: si pengawas</h3><p>Saat kamu menjalankan <code>nginx</code>, yang pertama hidup adalah <b>master process</b> (berjalan sebagai <code>root</code>). Fokusnya cuma satu: <b>mengelola worker</b>:</p><ul><li>Membaca dan memvalidasi konfigurasi.</li><li>Membuka port yang diminta (<code>listen 80</code>, <code>listen 443</code>).</li><li><b>Menjalankan dan mengawasi worker</b> — kalau worker mati, master segera menyalakan penggantinya.</li><li>Menangani <b>reload</b>: menerima konfigurasi baru, menjalankan worker baru, lalu menghentikan worker lama secara <i>graceful</i> (tanpa memutus koneksi yang sedang berjalan).</li></ul><p>Master <b>tidak menyentuh request HTTP sama sekali</b>. Dia manajer, bukan pelayan.</p>'
    },
    {
      type: 'example',
      title: 'Melihat proses Nginx dari dalam container',
      lang: 'text',
      output: false,
      code: `$ ps -ef | grep nginx
root     1     ...  nginx: master process nginx -g daemon off;
nginx   32     ...  nginx: worker process
nginx   33     ...  nginx: worker process`,
      explain: [
        'Baris pertama dimiliki <code>root</code>: itulah <b>master process</b> yang membaca konfigurasi dan mengawasi.',
        'Baris berikutnya dimiliki user <code>nginx</code>: <b>worker process</b> — inilah yang benar-benar melayani request.',
        'Verifikasi di container kamu: <code>podman exec nginx-lab sh -c \'ps -o pid,ppid,user,comm,args\'</code> — harus terlihat minimal satu master dan beberapa worker.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Worker &amp; event-driven non-blocking</h3><p><b>Worker</b> adalah proses yang benar-benar melayani request — berjalan dengan privilege terbatas (user <code>nginx</code>, bukan <code>root</code>) sesuai prinsip <i>least privilege</i>. Setiap worker bisa menangani <b>ribuan koneksi sekaligus</b> dalam satu proses. Ini konsep paling penting di pelajaran ini:</p><table><thead><tr><th>Model</th><th>Cara kerja</th><th>Masalah/hasil</th></tr></thead><tbody><tr><td><b>Thread-per-request</b> (model lama)</td><td>Satu thread/proses untuk satu koneksi, tidur menunggu I/O selesai</td><td>10.000 koneksi = 10.000 thread → boros memori, konteks berganti terus</td></tr><tr><td><b>Nginx: event-driven non-blocking</b></td><td>Satu worker menangani banyak koneksi; saat menunggu disk/backend worker <b>tidur sebentar saja</b> — dia melayani koneksi lain, lalu kembali lagi saat data siap</td><td>Sedikit worker, puluhan ribu koneksi, memori tetap kecil</td></tr></tbody></table><p>Istilahnya: <b>event-driven</b> berarti worker hanya &quot;terbangun&quot; saat ada <i>event</i> (koneksi masuk, data siap dibaca, socket tertulis). <b>Non-blocking</b> berarti operasi I/O dijalankan tanpa memblokir worker — persis seperti kasir yang melayani orang berikutnya sambil menunggu pelanggan pertama mengambil dompet.</p>'
    },
    {
      type: 'text',
      html: '<h3>Jumlah worker yang disarankan</h3><p>Aturan baku dari dokumentasi Nginx: <b>jumlah worker = jumlah core CPU</b>. Banyak distro memakai <code>worker_processes auto;</code> agar dihitung otomatis.</p><p>Satu worker per core menghindari saling berebut CPU. Untuk beban I/O-heavy boleh sedikit lebih banyak, tapi <b>jangan</b> memasang ratusan worker — bukan begitu cara Nginx menghemat. Ingat juga bahwa kapasitas teoritis ≈ <code>worker_processes × worker_connections</code>; itu juga bukti bahwa Nginx tidak butuh &quot;satu proses per koneksi&quot;.</p>'
    },
    {
      type: 'example',
      title: 'Alur satu request HTTP: client → Nginx → response',
      lang: 'text',
      output: false,
      code: ` [Client] ──GET /index.html──▶
 ┌────────────────────────── Nginx ──────────────────────────┐
 │  master process (mengawasi, tidak menyentuh request)      │
 │        │  membagi ke worker yang available                │
 │        ▼                                                  │
 │  [ worker ]  1. terima koneksi   2. baca request header   │
 │              3. pilih server & location yang cocok        │
 │              4. ambil konten (non-blocking)               │
 └──────────────┬──────────────────┬─────────────────────────┘
                ▼                  ▼
        [filesystem]        [upstream / backend]
        /usr/share/         app-1 :3000
          nginx/html        (mengolah request,
          index.html         mengirim response)
                │                  │
                └────────┬─────────┘
                         ▼
        Nginx menyusun response (status, header,
        body — atau dari cache bila HIT)
                         │
                         ▼
                 [Client] 200 OK`,
      explain: [
        'Kata kunci tiap tahap: <b>terima</b> koneksi di port <code>listen</code> → <b>cocokkan</b> <code>server</code> lalu <code>location</code> → <b>ambil konten</b> dari filesystem, upstream, atau cache → <b>kirim</b> response, lalu catat di <b>access log</b>.',
        'Karena worker non-blocking, satu worker bisa berada di tahap &quot;menunggu backend&quot; untuk ratusan request sekaligus tanpa berhenti melayani request lain.',
        'Perhatikan master hanya berada di jalur pengawasan — tidak ada panah request yang melewati kotak master.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: konsep arsitektur',
      lang: 'nginx',
      output: false,
      code: `worker_processes auto;          # jumlah worker = jumlah core
events {
    worker_connections 1024;    # maksimum koneksi per worker
}
http {
    server {
        listen 80;
        server_name localhost;

        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
    }
}`,
      explain: [
        '<code>worker_processes auto</code> membuat jumlah worker ikut jumlah core CPU; <code>worker_connections 1024</code> adalah batas koneksi yang ditangani <b>satu</b> worker.',
        'Kapasitas teoritis ≈ <code>worker_processes × worker_connections</code> — misal 4 core × 1024 = 4096 koneksi, tanpa perlu satu proses per koneksi.',
        'Blok <code>events</code> berisi parameter level koneksi, blok <code>http</code> berisi seluruh konfigurasi HTTP. Ini bukan konfigurasi produksi, hanya ilustrasi konsep.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dua tongkat investigasi: nginx -t dan nginx -T</h3><p>Sebelum menyentuh konfigurasi apa pun, biasakan dua perintah ini:</p><ul><li><b><code>nginx -t</code> — uji sintaks.</b> Membaca konfigurasi lengkap (termasuk semua <code>include</code>) lalu bilang <code>syntax is ok</code> / <code>test is successful</code>, atau menunjuk baris yang salah. <b>Selalu jalankan sebelum reload.</b></li><li><b><code>nginx -T</code> — dump lengkap.</b> Mengeluarkan <b>seluruh</b> konfigurasi aktif (termasuk semua <code>include</code>) beserta lokasi filenya — cara melihat &quot;apa yang benar-benar Nginx pakai sekarang&quot;.</li></ul><p>Di container: <code>podman exec nginx-lab nginx -t</code> dan <code>podman exec nginx-lab nginx -T | head -n 40</code>. Jangan tertukar: <code>-t</code> mengecek sintaks, <code>-T</code> menampilkan isi lengkap.</p>'
    },
    {
      type: 'example',
      title: 'Lab: mengamati arsitektur dan konfigurasi',
      lang: 'bash',
      output: false,
      code: `podman run -d --name nginx-lab -p 8080:80 docker.io/library/nginx:alpine

curl -i http://localhost:8080
podman logs nginx-lab
podman exec nginx-lab nginx -t
podman exec nginx-lab nginx -T | sed -n '1,40p'
podman exec nginx-lab sh -c 'ps -o pid,ppid,user,comm,args'`,
      explain: [
        '<code>curl -i</code> harus membalas <code>HTTP/1.1 200 OK</code> dengan body halaman default; <code>podman logs</code> memuat akses log <code>GET /</code> status <code>200</code>.',
        '<code>nginx -t</code> harus mencetak <code>syntax is ok</code> lalu <code>test is successful</code>.',
        '<code>nginx -T | sed -n \'1,40p\'</code> menampilkan <code>worker_processes</code>, blok <code>events</code>, lalu <code>http { ... }</code> — bukti dump konfigurasi lengkap termasuk file <code>include</code>.',
        'Perintah <code>ps</code> terakhir menampilkan <code>nginx: master process</code> diikuti beberapa <code>nginx: worker process</code>, persis seperti diagram di atas.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum',
      text: '<ul><li>Mengira master yang melayani request — <b>hanya worker</b> yang menyentuh HTTP.</li><li>Memasang ratusan worker agar &quot;lebih kencang&quot; — Nginx justru efisien dengan <b>sedikit</b> worker.</li><li>Lupa bahwa <code>worker_connections</code> dikalikan jumlah worker — itu kapasitas mesin, bukan per proses.</li><li>Menjalankan <code>nginx -t</code>/<code>-T</code> di host padahal konfigurasi ada di container — gunakan <code>podman exec nginx-lab ...</code>.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Hitung kapasitas, bukan tebak',
      text: '<p>Dari output <code>nginx -T</code>, ambil <code>worker_processes</code> dan <code>worker_connections</code>, lalu kalikan. Hasilnya adalah <b>kapasitas teoritis</b> mesin kamu. Angka ini berguna saat menambah beban: kalau sudah mendekati batas, naikkan koneksi per worker atau tambah core — bukan menambah worker ratusan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Master process', 'Proses pengawas yang mengelola worker, port, dan reload.'],
        ['Worker process', 'Proses yang benar-benar melayani request HTTP dengan privilege terbatas.'],
        ['Event-driven', 'Worker bereaksi hanya saat ada kejadian (event) pada koneksi.'],
        ['Non-blocking', 'Operasi I/O tidak menahan/memblokir worker.'],
        ['Upstream', 'Backend yang menerima request diteruskan Nginx.'],
        ['worker_connections', 'Batas koneksi maksimum per worker.'],
        ['nginx -t / -T', 'Uji sintaks / dump seluruh konfigurasi aktif.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Gambarkan dengan kata-katamu sendiri perbedaan <b>master</b> dan <b>worker</b>, plus satu tugas masing-masing.</li><li>Jelaskan kenapa <b>10.000 koneksi tidak berarti 10.000 proses</b> di Nginx (sebutkan istilah <i>event-driven</i> dan <i>non-blocking</i>).</li><li>Hitung kapasitas teoritis: <code>worker_processes auto</code> di mesin 4 core dengan <code>worker_connections 1024</code>. Berapa koneksi maksimum? Lalu buktikan dengan <code>podman exec nginx-lab nginx -T</code>.</li></ol>'
    }
  ],
  recap: [
    '<b>Master process = pengawas</b>: baca konfigurasi, buka port, kelola worker, tangani reload — tidak menyentuh request.',
    '<b>Worker process = pelayan request</b>, berjalan dengan privilege terbatas (user <code>nginx</code>).',
    'Nginx <b>event-driven &amp; non-blocking</b>: satu worker melayani ribuan koneksi tanpa tidur menunggu I/O; jumlah worker disarankan = jumlah core CPU.',
    'Alur request: <b>client → worker (cocokkan server/location) → filesystem/upstream/cache → response → access log</b>; <code>nginx -t</code> untuk sintaks dan <code>nginx -T</code> untuk isi lengkap konfigurasi.'
  ]
});
