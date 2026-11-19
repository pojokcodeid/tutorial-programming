/* ============================================================
   Pelajaran HAProxy — 02: Fundamental Proxy, Load Balancer, dan Peran HAProxy
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'fondasi-proxy',
  title: 'Fundamental Proxy, Load Balancer, dan Peran HAProxy',
  chapter: 'Fondasi',
  duration: '15 menit',
  intro: [
    'Bayangkan sebuah gedung perkantoran besar dengan satu resepsionis di lobi. Setiap tamu cukup menyebut nama perusahaan yang dituju, lalu resepsionis mengarahkannya ke ruangan yang benar — tamu tidak perlu tahu berapa lantai, ruangan mana yang sedang renovasi, atau siapa yang sedang cuti. Kalau satu ruangan penuh, resepsionis mengalihkan tamu ke ruangan cadangan. <b>Itulah gambaran kerja reverse proxy</b> yang akan kamu pelajari di pelajaran ini.',
    'Kamu akan membedah konsep inti lebih dulu: perbedaan forward dan reverse proxy, apa itu load balancer, perbedaan layer 4 (TCP) dan layer 7 (HTTP), serta istilah ketahanan sistem seperti SPOF, availability, redundancy, health check, failover, failback, dan session persistence.',
    'Setelah konsepnya mantap, kamu mengenali peran HAProxy (dari TCP proxy sampai health checker), menggambar alur request client → HAProxy → tiga backend, dan membaca skeleton konfigurasi <code>global/defaults/frontend/backend/listen</code> yang akan kamu ketik sendiri di pelajaran berikutnya. Fondasi ini yang membuat directive di sisa bab terasa masuk akal, bukan hafalan kosong.'
  ],
  objectives: [
    'Membedakan forward proxy dan reverse proxy beserta situasi kapan masing-masing dipakai',
    'Menjelaskan peran load balancer serta perbedaan mode L4 (TCP) dan L7 (HTTP)',
    'Mendefinisikan SPOF, availability, redundancy, health check, failover, failback, dan session persistence beserta trade-off-nya',
    'Mengenali peran HAProxy dan membaca struktur konfigurasi global, defaults, frontend, backend, dan listen'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Forward proxy vs reverse proxy</h3><p>Keduanya sama-sama berdiri di tengah perjalanan request, hanya saja <b>mewakili pihak yang berbeda</b>:</p><table><thead><tr><th>Aspek</th><th>Forward proxy</th><th>Reverse proxy</th></tr></thead><tbody><tr><td><b>Mewakili</b></td><td>Client (pengguna)</td><td>Server (aplikasi)</td></tr><tr><td><b>Siapa yang tahu?</b></td><td>Client dikonfigurasi menunjuk proxy</td><td>Client hanya tahu alamat reverse proxy</td></tr><tr><td><b>Tujuan</b></td><td>Menyembunyikan client, menyaring konten, caching</td><td>Menyamarkan backend, membagi beban, menambah ketahanan</td></tr><tr><td><b>Contoh</b></td><td>Proxy kantor, VPN, Tor</td><td>HAProxy, nginx sebagai upstream</td></tr></tbody></table><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">Reverse proxy berdiri <b>di depan server</b>: client mengirim request ke HAProxy, dan hanya HAProxy yang tahu ke server mana request itu diteruskan.</blockquote>'
    },
    {
      type: 'example',
      title: 'Dua arah yang sering tertukar di kepala',
      lang: 'text',
      output: false,
      code: `FORWARD PROXY (mewakili CLIENT)
[PC kantor] --request--> [Proxy] --> [situs internet]
                              ^
                   internet tahu IP proxy,
                   bukan IP PC kantor

REVERSE PROXY (mewakili SERVER)
[Pengguna] --request--> [HAProxy] ---> [web1]
                                \\----> [web2]
       pengguna hanya mengenal alamat HAProxy`,
      explain: [
        'Pada forward proxy, <b>client yang diatur</b> untuk melewati proxy — konten internet tidak tahu asal client sebenarnya. Ini dipakai untuk penyaringan dan privasi di jaringan internal.',
        'Pada reverse proxy, <b>server yang dilindungi</b>: pengguna cukup mengenal satu alamat HAProxy, sementara di baliknya ada banyak backend yang bisa bertambah atau berkurang tanpa konfigurasi client.',
        'HAProxy di bab ini selalu berperan sebagai reverse proxy — client (curl) cukup menunjuk <code>localhost:8080</code>, dan HAProxy meneruskan ke container backend bernama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Load balancer, L4 vs L7</h3><p><b>Load balancer</b> adalah proxy yang tugas utamanya membagi request ke beberapa server agar tidak ada satu server yang menanggung semuanya, sekaligus menjauhkan server yang rusak. HAProxy membagi traffic di dua lapisan yang berbeda:</p><table><thead><tr><th>Aspek</th><th>Layer 4 (mode tcp)</th><th>Layer 7 (mode http)</th></tr></thead><tbody><tr><td><b>Yang dibaca</b></td><td>IP dan port saja (stream TCP mentah)</td><td>Isi request HTTP: method, path, header, cookie</td></tr><tr><td><b>Keputusan</b></td><td>Berdasarkan alamat jaringan</td><td>Berdasarkan hostname, path, header, dan lainnya</td></tr><tr><td><b>Kelebihan</b></td><td>Cepat, generik untuk protocol apa pun</td><td>Routing cerdas, logging kaya, manipulasi header</td></tr><tr><td><b>Kekurangan</b></td><td>Tidak bisa melihat isi HTTP</td><td>Harus memahami HTTP (dan menangani TLS bila dipakai)</td></tr></tbody></table><p>Untuk aplikasi web modern, kamu akan hidup di <b>mode http (L7)</b>. Mode tcp (L4) dipakai untuk protocol non-HTTP seperti database atau protokol proprietary.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur request HAProxy: client mengirim request ke HAProxy yang berisi frontend http_front lalu backend web_servers, dan HAProxy meneruskan ke salah satu dari tiga server web1, web2, web3">
        <text x="20" y="34" class="u-title" text-anchor="start">Alur request: client - HAProxy - backend</text>
        <rect x="20" y="110" width="130" height="64" rx="8" class="u-hd"/>
        <text x="85" y="138" class="u-lbl" text-anchor="middle">Client (curl)</text>
        <text x="85" y="162" class="u-lbl" text-anchor="middle">localhost:8080</text>
        <line x1="156" y1="142" x2="210" y2="142" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="216" y="52" width="210" height="198" rx="10" class="u-box"/>
        <text x="321" y="78" class="u-title" text-anchor="middle">HAProxy</text>
        <rect x="228" y="92" width="186" height="44" rx="6" class="u-hd"/>
        <text x="321" y="120" class="u-lbl" text-anchor="middle">frontend http_front :80</text>
        <line x1="321" y1="140" x2="321" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="228" y="164" width="186" height="44" rx="6" class="u-box"/>
        <text x="321" y="192" class="u-lbl" text-anchor="middle">backend web_servers</text>
        <text x="321" y="234" class="u-lbl" text-anchor="middle">pilih server sehat</text>
        <line x1="432" y1="90" x2="514" y2="90" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="432" y1="158" x2="514" y2="158" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="432" y1="226" x2="514" y2="226" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="520" y="66" width="170" height="48" rx="6" class="u-hd"/>
        <text x="605" y="96" class="u-lbl" text-anchor="middle">web1:80</text>
        <rect x="520" y="134" width="170" height="48" rx="6" class="u-box"/>
        <text x="605" y="164" class="u-lbl" text-anchor="middle">web2:80</text>
        <rect x="520" y="202" width="170" height="48" rx="6" class="u-box"/>
        <text x="605" y="232" class="u-lbl" text-anchor="middle">web3:80</text>
        <text x="380" y="282" class="u-lbl" text-anchor="middle">request selalu masuk lewat HAProxy; backend bertukar tanpa mengubah client</text>
      </svg></div><figcaption>Client mengirim request ke frontend HAProxy; backend memilih satu server yang sehat untuk meneruskannya.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Ketahanan sistem: SPOF sampai session persistence</h3><p>Istilah-istilah ini akan muncul berulang di seluruh bab, jadi kunci maknanya sekarang:</p><table><thead><tr><th>Istilah</th><th>Makna singkat</th></tr></thead><tbody><tr><td><b>SPOF</b> (Single Point of Failure)</td><td>Satu komponen yang kalau mati, seluruh sistem ikut mati — misalnya hanya ada satu server web.</td></tr><tr><td><b>Availability</b></td><td>Presentase waktu service bisa dipakai; 99,9% berarti toleransi downtime sekitar 8 jam per tahun.</td></tr><tr><td><b>Redundancy</b></td><td>Menyediakan salinan komponen (backend ganda, HAProxy ganda) agar kegagalan satu tidak berakibat fatal.</td></tr><tr><td><b>Health check</b></td><td>Pemeriksaan berkala: apakah server masih benar-benar melayani, bukan sekadar hidup prosesnya.</td></tr><tr><td><b>Failover</b></td><td>Perpindahan otomatis ke komponen cadangan ketika yang utama dinyatakan gagal.</td></tr><tr><td><b>Failback</b></td><td>Kembali ke komponen utama setelah pulih — perlu kehati-hatian agar tidak bolak-balik (flapping).</td></tr><tr><td><b>Session persistence</b></td><td>Menjaga client tetap dilayani server yang sama (sticky session) saat state aplikasi tersimpan di server itu.</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Peran HAProxy dalam satu daftar</h3><p>HAProxy bukan sekadar &quot;penerus request&quot;. Dalam satu proses, dia bisa menjadi:</p><ul><li><b>TCP proxy</b> — meneruskan stream TCP apa adanya (mode tcp / L4).</li><li><b>HTTP reverse proxy</b> — memahami dan meneruskan request HTTP (mode http / L7).</li><li><b>Load balancer</b> — membagi request ke banyak server dengan berbagai algoritma.</li><li><b>TLS termination point</b> — menerima koneksi HTTPS, mendekripsi, lalu meneruskan HTTP ke backend (pelajaran TLS).</li><li><b>Traffic router</b> — mengarahkan request berdasarkan hostname, path, atau header memakai ACL.</li><li><b>Health checker</b> — memeriksa backend berkala dan mengeluarkan yang gagal.</li><li><b>Komponen high availability</b> — pasangan HAProxy lain yang siap mengambil alih (pelajaran High Availability).</li></ul><p>Enam peran pertama sudah kamu sentuh di pelajaran berikutnya; peran terbaru butuh dua HAProxy, jadi disimpan untuk nanti.</p>'
    },
    {
      type: 'example',
      title: 'Skeleton konfigurasi: lima section yang wajib kamu kenal',
      lang: 'cfg',
      output: false,
      code: `global
    log stdout format raw local0
    maxconn 2000

defaults
    mode http
    option httplog
    timeout connect 5s
    timeout client 30s
    timeout server 30s

frontend http_front
    bind :80
    default_backend web_servers

backend web_servers
    balance roundrobin
    server web1 web1:80 check
    server web2 web2:80 check

listen stats
    bind :8404
    mode http
    stats enable
    stats uri /stats`,
      explain: [
        '<code>global</code> berisi pengaturan level proses: <code>log stdout format raw local0</code> mengirim log ke stdout container (praktis dibaca lewat <code>podman logs</code>), <code>maxconn</code> membatasi jumlah koneksi serentak.',
        '<code>defaults</code> adalah nilai bawaan yang diwarisi semua frontend/backend berikutnya — menulis timeout sekali di sini menghindari lupa timeout yang membuat koneksi menggantung.',
        '<code>frontend</code> adalah titik masuk: <code>bind :80</code> mendengarkan port di dalam container, <code>default_backend</code> menentukan tujuan request bila tidak ada aturan routing lain.',
        '<code>backend</code> adalah daftar server tujuan: <code>balance</code> memilih algoritma pembagian, tiap baris <code>server</code> menyebut nama, alamat:port, dan <code>check</code> menyalakan health check.',
        '<code>listen</code> menggabungkan frontend dan backend dalam satu section — pola paling umum untuk halaman statistik yang kamu pakai di pelajaran Monitoring.'
      ]
    },
    {
      type: 'example',
      title: 'Satu request dari sisi client',
      lang: 'http',
      output: false,
      code: `$ curl -i http://localhost:8080/
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 615
Server: nginx

<!DOCTYPE html>
<html>
  <head><title>web1</title></head>
  <body><h1>Halo dari web1</h1></body>
</html>`,
      explain: [
        'Client cukup tahu satu alamat: <code>localhost:8080</code> — di situ HAProxy mendengarkan, lalu meneruskan ke backend yang dipilih.',
        'Status <code>200 OK</code> datang dari backend, bukan dari HAProxy; HAProxy hanya meneruskan response beserta header-nya secara utuh.',
        'Identitas server asli (di sini <code>web1</code>) sebenarnya tidak terlihat oleh client — itulah inti penyamaran reverse proxy; kamu membuktikannya dengan halaman identitas di pelajaran load balancing.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum memahami konsep',
      text: '<ul><li><b>Menganggap HAProxy adalah server web</b> — HAProxy tidak menyimpan halaman; dia meneruskan dan mengatur traffic.</li><li><b>Menyamakan redundancy dengan availability</b> — menambah server tanpa health check bisa menambah SPOF baru yang justru gagal terdeteksi.</li><li><b>Mengira health check = proses hidup</b> — proses bisa hidup tapi aplikasinya menggantung; karena itu check harus di level layanan.</li><li><b>Menonaktifkan session persistence tanpa paham state</b> — bila aplikasi menyimpan keranjang belanja di memori server, sticky session justru wajib.</li><li><b>Lupa failback bisa berbahaya</b> — server yang baru pulih belum tentu siap; langsung menariknya kembali bisa memicu flap.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Belajar konsep dengan menggambar',
      text: '<p>Sebelum menyentuh container di pelajaran berikutnya, latih dirimu menggambar alur <b>client → HAProxy → backend</b> di selembar kertas: tandai di mana letak frontend, backend, dan server, lalu tunjukkan apa yang berubah kalau web2 dimatikan. Kemampuan menggambar alur ini yang akan menyelamatkanmu saat troubleshooting 503 atau timeout di akhir bab — bukan kemampuan menghafal directive.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Forward proxy', 'Proxy yang mewakili client menuju internet; client dikonfigurasi untuk melewatinya.'],
        ['Reverse proxy', 'Proxy yang mewakili server di depan aplikasi; client hanya mengenal alamat proxy.'],
        ['Load balancer', 'Komponen yang membagi request ke banyak server dan menjauhkan server yang gagal.'],
        ['L4 / Layer 4', 'Mode <code>tcp</code>: HAProxy hanya melihat IP dan port, meneruskan stream mentah tanpa membaca HTTP.'],
        ['L7 / Layer 7', 'Mode <code>http</code>: HAProxy membaca isi request HTTP sehingga bisa routing per host/path/header.'],
        ['SPOF', 'Single Point of Failure — satu komponen yang membuat seluruh sistem mati bila gagal.'],
        ['Failover &amp; failback', 'Failover = pindah ke cadangan saat utama gagal; failback = kembali ke utama setelah pulih.'],
        ['Session persistence', 'Menjaga client dilayani server yang sama (sticky) saat state tersimpan di server tersebut.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis satu paragraf memakai analogi resepsionis untuk menjelaskan reverse proxy ke rekan yang belum tahu HAProxy.</li><li>Bandingkan <b>L4 dan L7</b> dalam empat baris: apa yang dibaca, contoh keputusan routing, kelebihan, dan kekurangan masing-masing.</li><li>Sebutkan <b>tiga komponen</b> yang bisa menjadi SPOF pada aplikasi web sederhana, lalu bagaimana redundancy dan health check menanganinya.</li><li><b>Checkpoint:</b> mampu menjelaskan perbedaan frontend, backend, dan server serta menggambarkan request flow client → HAProxy → tiga backend, lengkap dengan urutan <code>curl localhost:8080</code> sampai halaman web1 tampil.</li></ol>'
    }
  ],
  recap: [
    '<b>Reverse proxy mewakili server</b>: client hanya mengenal HAProxy, sementara backend bisa bertambah atau berkurang tanpa mengubah client.',
    'HAProxy bekerja di dua lapisan: <b>L4 (mode tcp)</b> untuk stream mentah dan <b>L7 (mode http)</b> untuk traffic web yang butuh routing cerdas.',
    'Ketahanan dibangun dari redundancy + health check + <b>failover</b>, dengan <b>failback</b> dan <b>session persistence</b> sebagai keputusan trade-off.',
    'Konfigurasi HAProxy terbagi lima section: <b>global, defaults, frontend, backend, listen</b> — masing-masing punya peran yang akan kamu praktikkan langsung.'
  ]
});
