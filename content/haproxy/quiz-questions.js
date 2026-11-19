/* ============================================================
   Soal kuis HAProxy — 40 soal (haproxy01–haproxy40)
   Sebaran: haproxy01–03 = Level 0 · haproxy04–06 = Level 1
            haproxy07–09 = Level 2 · haproxy10–12 = Level 3
            haproxy13–15 = Level 4 · haproxy16–18 = Level 5
            haproxy19–21 = Level 6 · haproxy22–24 = Level 7
            haproxy25–27 = Level 8 · haproxy28–30 = Level 9
            haproxy31–33 = Level 10 · haproxy34–36 = Level 11
            haproxy37–40 = Capstone
   ============================================================ */
'use strict';

window.HAPROXY_QUIZ_POOL = window.HAPROXY_QUIZ_POOL || [];

window.HAPROXY_QUIZ_POOL.push(
  {
    id: 'haproxy01',
    q: 'Kamu baru membuka terminal di mesin lab dan ingin segera memastikan Podman terpasang beserta versinya. Perintah paling langsung untuk itu adalah...',
    options: [
      'podman --version',
      'podman machine start',
      'podman network create haproxy-lab',
      'podman logs haproxy'
    ],
    answer: 0,
    explain: 'podman --version hanya mencetak versi sehingga cepat memastikan kesiapan tool; perintah lain menyalakan mesin, membuat network, atau membaca log container yang bahkan belum ada.'
  },
  {
    id: 'haproxy02',
    q: 'Di macOS, kamu menjalankan podman ps lalu muncul galat bahwa Podman Machine tidak berjalan. Langkah paling tepat berikutnya adalah...',
    options: [
      'Menghapus seluruh Podman lalu menginstal ulang dari awal',
      'podman machine list untuk melihat statusnya, lalu podman machine start bila masih Stopped',
      'podman network create agar koneksi container pulih',
      'podman rm haproxy agar container lama terganti'
    ],
    answer: 1,
    explain: 'Di macOS Podman berjalan di dalam mesin virtual, jadi galat machine not running diselesaikan dengan memeriksa dan menyalakan Podman Machine — bukan reinstall atau membuat network.'
  },
  {
    id: 'haproxy03',
    q: 'Di konfigurasi lab kamu menulis server web1 web1:80. Kenapa hostname web1 bisa diselesaikan dari dalam container HAProxy?',
    options: [
      'Karena web1 ditambahkan manual ke file /etc/hosts tiap kali container hidup',
      'Karena HAProxy selalu mencari IP backend lewat DNS publik',
      'Karena HAProxy dan web1 berada di network Podman yang sama, sehingga nama container terselesaikan lewat DNS internal network itu',
      'Karena port 80 otomatis menerjemahkan nama menjadi IP'
    ],
    answer: 2,
    explain: 'Container pada network Podman yang sama saling menemukan lewat nama container via DNS internal network; tanpa network bersama, hostname web1 tidak akan resolve dari container HAProxy.'
  },
  {
    id: 'haproxy04',
    q: 'Client mengakses http://lab.local dan merasa sedang berbicara langsung dengan server aplikasi, padahal request diteruskan ke tiga backend. Peran HAProxy dalam situasi ini disebut...',
    options: [
      'Forward proxy, karena HAProxy berada di sisi jaringan internal',
      'Caching server, karena response disimpan dulu sebelum dikirim',
      'Load balancer L4 murni, karena HAProxy hanya meneruskan paket',
      'Reverse proxy, karena HAProxy berdiri di depan server asli dan meneruskan request atas namanya'
    ],
    answer: 3,
    explain: 'Reverse proxy dikenal client sebagai tujuan request sehingga client tidak perlu tahu backend; forward proxy melayani client internal menuju internet, dan caching bukan peran utama HAProxy di sini.'
  },
  {
    id: 'haproxy05',
    q: 'Kamu memakai mode tcp pada frontend HAProxy. Apa konsekuensi terbesarnya terhadap routing?',
    options: [
      'HAProxy hanya meneruskan byte tanpa membaca isi HTTP, jadi routing berdasarkan path atau header tidak mungkin',
      'HAProxy tidak boleh membagi traffic ke lebih dari satu backend',
      'Health check otomatis berubah menjadi HTTP check',
      'Client tidak akan pernah bisa memakai TLS'
    ],
    answer: 0,
    explain: 'Mode tcp bekerja di lapisan transport: HAProxy tidak memahami HTTP sehingga tidak ada path atau header yang bisa dijadikan dasar keputusan — kalau butuh itu, frontend harus mode http.'
  },
  {
    id: 'haproxy06',
    q: 'Seluruh layanan hanya bisa diakses lewat satu container HAProxy, dan saat container itu mati semua aplikasi ikut tidak bisa diakses. Kondisi ini disebut...',
    options: [
      'Load balancing',
      'Single point of failure (SPOF)',
      'Session persistence',
      'Failback'
    ],
    answer: 1,
    explain: 'SPOF adalah titik yang begitu gagal mengambil seluruh sistem ikut gagal; mengatasinya butuh redundansi seperti dua HAProxy dengan VIP, bukan sekadar menambah backend.'
  },
  {
    id: 'haproxy07',
    q: 'Apa fungsi directive default_backend di dalam sebuah frontend?',
    options: [
      'Menentukan algoritma load balancing yang dipakai frontend tersebut',
      'Menambahkan server baru ke dalam backend',
      'Menunjuk backend yang dipakai ketika tidak ada use_backend ... if yang cocok',
      'Membuat backend menjadi pilihan utama selama semua server sehat'
    ],
    answer: 2,
    explain: 'default_backend adalah jaring pengaman terakhir: bila tidak ada ACL atau use_backend yang match, request diteruskan ke backend yang disebut di sana.'
  },
  {
    id: 'haproxy08',
    q: 'Di defaults tertulis timeout connect 5s, timeout client 30s, timeout server 30s. Batas 5s pada timeout connect dihitung mulai dari...',
    options: [
      'Request client pertama diterima HAProxy sampai response selesai dikirim',
      'Koneksi client terbuka sampai koneksi itu ditutup',
      'HAProxy selesai mengirim request ke backend sampai backend mengirim response pertama',
      'HAProxy mulai membuka koneksi TCP ke backend sampai koneksi itu benar-benar terbuka'
    ],
    answer: 3,
    explain: 'timeout connect khusus menunggu handshake TCP ke backend terbuka; kalau backend lambat merespons SETELAH tersambung, yang terlampaui adalah timeout server, bukan connect.'
  },
  {
    id: 'haproxy09',
    q: 'Di konfigurasi lab ada blok listen stats yang memuat bind :8404 dan stats enable. Apa gunanya section listen?',
    options: [
      'Menggabungkan frontend dan backend dalam satu section, cocok untuk halaman statistik',
      'Mendefinisikan pengaturan global proses seperti maxconn',
      'Menjalankan script eksternal sebelum konfigurasi dimuat',
      'Menjadi alias untuk defaults agar konfigurasi lebih ringkas'
    ],
    answer: 0,
    explain: 'listen pada dasarnya adalah frontend dan backend dalam satu blok; karena itu listen sangat lazim dipakai untuk stats listener yang hanya butuh bind dan aturan stats.'
  },
  {
    id: 'haproxy10',
    q: 'Backend kamu melayani request dengan durasi sangat bervariasi (ada 200 ms, ada 15 detik). Algoritma mana yang paling tepat agar backend lambat tidak menumpuk koneksi?',
    options: [
      'balance roundrobin, karena pembagian bergiliran selalu paling adil',
      'balance leastconn, karena request baru diarahkan ke server dengan koneksi aktif paling sedikit',
      'balance source, karena IP client yang unik menjaga distribusi tetap stabil',
      'balance static-rr, karena urutan statis menghindari perpindahan antar server'
    ],
    answer: 1,
    explain: 'leastconn menilai beban aktual lewat jumlah koneksi aktif, sehingga request panjang tidak menumpuk di satu server seperti yang bisa terjadi pada roundrobin yang hanya bergiliran tanpa melihat beban.'
  },
  {
    id: 'haproxy11',
    q: 'Backend web_servers memakai balance roundrobin dengan web1 weight 5 dan web2 weight 2. Apa yang kamu harapkan terjadi?',
    options: [
      'Web1 selalu menerima tepat 5 kali lipat jumlah koneksi aktif milik web2',
      'Weight diabaikan karena roundrobin selalu membagi rata 50:50',
      'Web1 menerima porsi request yang lebih besar dengan perbandingan kira-kira 5:2 terhadap web2',
      'Web1 hanya dipakai ketika web2 sedang down'
    ],
    answer: 2,
    explain: 'Di HAProxy roundrobin mendukung weight: porsi request mengikuti rasio weight (5:2) — bukan jumlah koneksi aktif yang tepat lima kali, dan bukan pembagian rata 50:50.'
  },
  {
    id: 'haproxy12',
    q: 'Kamu memakai balance source, lalu seluruh user di kantor keluar lewat satu IP NAT yang sama. Apa yang kemungkinan besar terjadi?',
    options: [
      'Request tetap terbagi rata karena HAProxy mengenali tiap user di balik NAT',
      'HAProxy menolak konfigurasi karena balance source tidak valid',
      'Semua request jatuh ke backend pertama karena urutan weight',
      'Semua request dari IP NAT itu jatuh ke backend yang sama, sehingga distribusi jadi tidak merata'
    ],
    answer: 3,
    explain: 'balance source meng-hash alamat IP sumber; di balik NAT semua client terlihat sebagai satu IP sehingga selalu memilih backend yang sama — inilah konsekuensi distribusi tak merata yang perlu diwaspadai.'
  },
  {
    id: 'haproxy13',
    q: 'Sebuah server ditulis server web1 web1:80 check inter 2s fall 3 rise 2. Artinya...',
    options: [
      'Check tiap 2 detik; dianggap down setelah 3 kegagalan berturut-turut dan kembali up setelah 2 check sukses berturut-turut',
      'Check tiap 3 detik; dianggap up setelah 2 kali gagal',
      'Timeout koneksi ke backend 2 detik lalu diulang 3 kali',
      'Server hanya dicek sekali saat HAProxy baru mulai'
    ],
    answer: 0,
    explain: 'inter adalah interval antar check, fall adalah jumlah kegagalan berturut untuk menurunkan status, rise adalah jumlah keberhasilan berturut untuk mengangkatnya kembali — semuanya berjalan otomatis tanpa reload.'
  },
  {
    id: 'haproxy14',
    q: 'Port 80 container web1 tetap terbuka, tetapi aplikasinya sedang hang sehingga tidak pernah membalas. Health check mana yang tetap menganggap server ini sehat?',
    options: [
      'option httpchk GET /health beserta http-check expect status 200',
      'TCP check bawaan yang hanya memeriksa apakah port terbuka',
      'Check yang memakai method POST ke endpoint login',
      'Tidak ada; setiap health check pasti mendeteksi hang tersebut'
    ],
    answer: 1,
    explain: 'TCP check hanya menilai apakah koneksi port berhasil dibuka, sehingga aplikasi yang portnya hidup tapi prosesnya hang tetap dianggap sehat — inilah alasan HTTP check dengan status yang diharapkan dipakai untuk service penting.'
  },
  {
    id: 'haproxy15',
    q: 'Setelah kamu menjalankan podman start web2 (sebelumnya di-stop), bagaimana web2 kembali menerima traffic?',
    options: [
      'Kamu harus menulis ulang haproxy.cfg lalu mereload HAProxy',
      'HAProxy langsung mengirim traffic begitu container menyala, tanpa menunggu apa pun',
      'HAProxy kembali mengirim traffic setelah web2 lulus rise check beberapa kali berturut-turut',
      'Web2 hanya menerima traffic bila bobot weight-nya kamu tambahkan lagi'
    ],
    answer: 2,
    explain: 'Status server dipulihkan oleh health check: setelah container hidup dan check berhasil sebanyak rise, server dianggap UP dan masuk rotasi kembali — tanpa perubahan konfigurasi apa pun.'
  },
  {
    id: 'haproxy16',
    q: 'Frontend memuat acl path_api path_beg /api dan use_backend api_servers if path_api. Request ke /api/orders akan...',
    options: [
      'Selalu dilayani default_backend karena path tidak pernah dicek',
      'Diteruskan ke default_backend web_servers',
      'Ditolak dengan 403 karena ACL tidak mengenali /api',
      'Diteruskan ke backend api_servers, karena ACL path_api cocok dengan awalan /api'
    ],
    answer: 3,
    explain: 'path_beg mencocokkan awalan URI; begitu ACL cocok, use_backend ... if mengarahkan request ke api_servers sebelum default_backend ikut dipertimbangkan.'
  },
  {
    id: 'haproxy17',
    q: 'Di frontend tertulis http-request redirect scheme https code 301 if !{ ssl_fc }. Apa perilaku aturan itu?',
    options: [
      'Mengirim redirect permanen ke HTTPS hanya untuk koneksi yang belum lewat TLS; koneksi HTTPS diteruskan normal',
      'Mengubah setiap response backend menjadi 301',
      'Mengarahkan request ke backend bernama ssl_fc',
      'Mengenkripsi ulang response yang sudah terlanjur dikirim'
    ],
    answer: 0,
    explain: '!{ ssl_fc } berarti bukan koneksi TLS, jadi hanya request HTTP biasa yang di-redirect; tanpa negasi itu, koneksi HTTPS pun akan terjebak redirect berulang alias redirect loop.'
  },
  {
    id: 'haproxy18',
    q: 'Client sudah mengirim header X-Forwarded-For, dan kamu ingin backend menerima nilai yang kamu tentukan tanpa membuat header kembar. Directive yang tepat adalah...',
    options: [
      'http-request add-header, karena menambahkan header baru selalu aman',
      'http-request set-header, karena mengganti kemunculan header yang sudah ada dengan satu nilai baru',
      'http-request del-header, karena menghapus header lama lalu backend menambahkan sendiri',
      'http-response redirect, karena nilai sebaiknya dikirim lewat lokasi baru'
    ],
    answer: 1,
    explain: 'add-header selalu menambah satu baris baru sehingga X-Forwarded-For bisa kembar, sedangkan set-header mengganti semua kemunculannya — pilihan tepat saat header itu sudah datang dari client.'
  },
  {
    id: 'haproxy19',
    q: 'Frontend tertulis bind :443 ssl crt lab.pem, sedangkan backend ditulis server web1 web1:80 tanpa ssl. Apa yang diterima web1?',
    options: [
      'Koneksi TLS dari client yang diteruskan apa adanya',
      'Response HTTPS yang sudah dikonversi kembali oleh HAProxy',
      'Request HTTP biasa (plain text), karena HAProxy sudah mengakhiri TLS di depannya',
      'Koneksi TLS baru memakai sertifikat yang sama milik frontend'
    ],
    answer: 2,
    explain: 'Itulah TLS termination: HAProxy memegang sertifikat, mendekripsi, lalu berbicara HTTP biasa ke backend — backend tidak perlu sertifikat dan tidak menangani enkripsi sama sekali.'
  },
  {
    id: 'haproxy20',
    q: 'Kamu memilih TLS passthrough untuk satu layanan. Pernyataan yang benar tentang konfigurasi itu adalah...',
    options: [
      'HAProxy tetap membuka sertifikat lalu menyusun ulang koneksi TLS ke backend',
      'HAProxy menganalisis header HTTP untuk memilih backend sambil mempertahankan enkripsi',
      'Backend menerima request HTTP plain text meski client memakai TLS',
      'HAProxy meneruskan byte TLS apa adanya dalam mode tcp, sehingga tidak bisa memakai routing berbasis path atau header'
    ],
    answer: 3,
    explain: 'Passthrough berarti HAProxy tidak memegang kunci dekripsi — ia hanya jembatan TCP, jadi keputusan routing hanya bisa dari hal yang terlihat di lapisan koneksi seperti SNI, IP, atau port.'
  },
  {
    id: 'haproxy21',
    q: 'Kenapa langkah lab memakai cat certs/lab.crt certs/lab.key > certs/lab.pem sebelum menulis bind :443 ssl crt certs/lab.pem?',
    options: [
      'Karena HAProxy meminta satu file PEM yang memuat sertifikat sekaligus private key',
      'Karena sertifikat self-signed tidak boleh disimpan terpisah dari key',
      'Karena private key harus diubah menjadi sertifikat agar dianggap valid',
      'Karena container HAProxy hanya bisa membaca file berekstensi .pem'
    ],
    answer: 0,
    explain: 'Direktif crt menerima bundle PEM berisi rantai sertifikat plus private key dalam satu file; menyimpannya terpisah justru lebih baik untuk keamanan file, bukan syarat HAProxy.'
  },
  {
    id: 'haproxy22',
    q: 'Konfigurasi lab memakai log stdout format raw local0 dan option httplog. Ke mana log request HAProxy akan muncul?',
    options: [
      'Ke file /var/log/haproxy.log di dalam container yang harus dibaca lewat podman exec',
      'Ke stdout proses container, sehingga terbaca lewat podman logs haproxy',
      'Ke halaman stats di port 8404',
      'Tidak ada log sama sekali kecuali kamu memasang rsyslog'
    ],
    answer: 1,
    explain: 'Container sebaiknya tidak menulis file ke dalam dirinya; dengan log stdout, keluaran HAProxy menjadi stdout container sehingga langsung terbaca lewat podman logs dan mudah diambil sistem logging host.'
  },
  {
    id: 'haproxy23',
    q: 'Kamu menemukan listen stats dengan stats uri /stats tanpa autentikasi lalu mem-publishnya ke jaringan kantor. Risiko terbesarnya adalah...',
    options: [
      'Stats memperlambat performa proxy hingga traffic berhenti total',
      'Halaman stats menampilkan private key backend',
      'Siapa pun bisa memantau topologi dan status backend, dan pada konfigurasi bawaan bahkan bisa menonaktifkan server',
      'HAProxy otomatis restart setiap stats refresh 5 detik'
    ],
    answer: 2,
    explain: 'Stats memuat informasi operasional sensitif plus kendali atas server, jadi di luar lab halaman ini wajib dibatasi autentikasinya dan jangan diekspos sembarangan.'
  },
  {
    id: 'haproxy24',
    q: 'Di halaman stats, bagian mana yang paling langsung memberi tahu kamu bahwa HAProxy mulai kehabisan kapasitas menangani koneksi?',
    options: [
      'Kolom byte in/out yang terus bertambah',
      'Angka request rate yang terlihat tinggi',
      'Status semua backend yang berubah menjadi UP',
      'Nilai current connections yang mendekati maxconn dan antrean (queue) yang mulai terisi'
    ],
    answer: 3,
    explain: 'Saturasi terlihat dari koneksi aktif yang mendekati batas maxconn dan memanjangnya antrean; request rate tinggi justru normal selama belum ada antrean atau koneksi menumpuk.'
  },
  {
    id: 'haproxy25',
    q: 'Pada arsitektur active-passive dengan dua HAProxy, apa yang terjadi pada node standby selama node aktif sehat?',
    options: [
      'Standby tetap siap tetapi tidak melayani traffic utama; VIP berada di node aktif',
      'Standby menerima separuh traffic agar beban seimbang',
      'Standby mati total sampai node aktif dimatikan manual',
      'Standby menggantikan node aktif tiap 5 menit secara bergantian'
    ],
    answer: 0,
    explain: 'Active-passive berarti satu node memegang VIP dan melayani traffic sementara yang lain menunggu; perpindahan (failover) hanya terjadi ketika node aktif dianggap gagal.'
  },
  {
    id: 'haproxy26',
    q: 'Dalam lab HAProxy plus Keepalived, apa peran utama Keepalived?',
    options: [
      'Menyeimbangkan beban request antar backend secara roundrobin',
      'Mempertahankan dan memindahkan Virtual IP antar node lewat protokol VRRP berdasarkan kondisi node',
      'Menyimpan konfigurasi HAProxy agar tidak perlu dipusatkan di Git',
      'Mengenkripsi seluruh traffic antarcontainer'
    ],
    answer: 1,
    explain: 'Keepalived menjalankan VRRP: node aktif mengumumkan kepemilikan VIP secara berkala; bila pengumuman berhenti, node pengganti mengambil VIP sehingga client tetap menemui titik masuk yang sama.'
  },
  {
    id: 'haproxy27',
    q: 'Roadmap memperingatkan bahwa simulasi VIP/VRRP dengan Podman di macOS sulit. Alasan utamanya adalah...',
    options: [
      'HAProxy tidak mendukung VIP pada versi apa pun',
      'macOS tidak mengizinkan dua container berjalan bersamaan',
      'Podman di macOS berjalan di dalam mesin virtual Linux, sehingga multicast VRRP dan penempatan VIP langsung di host tidak tersedia',
      'Keepalived hanya bisa dijalankan di Windows'
    ],
    answer: 2,
    explain: 'VRRP bergantung pada multicast dan VIP pada antarmuka host; di macOS seluruh container hidup di dalam VM Podman, jadi simulasinya butuh VM Linux atau pendekatan host networking khusus.'
  },
  {
    id: 'haproxy28',
    q: 'Kamu menaikkan maxconn menjadi 50000 di section global tetapi tidak menyentuh batas file descriptor OS. Apa yang kemungkinan terjadi?',
    options: [
      'HAProxy langsung menolak konfigurasi karena maxconn tidak boleh diubah',
      'Backend otomatis ditambah agar kuat menampung koneksi',
      'timeout client ikut terpaksa memanjang tiga kali lipat',
      'Proses tidak sanggup membuka socket sebanyak itu sehingga batas efektif tetap rendah atau muncul peringatan kegagalan menaikkan maxconn'
    ],
    answer: 3,
    explain: 'Setiap koneksi membutuhkan file descriptor; maxconn yang melebihi limit OS tidak akan pernah tercapai — karena itu ulur limit fd dulu sebelum menaikkan maxconn.'
  },
  {
    id: 'haproxy29',
    q: 'Setelah mengubah maxconn dan timeout, kamu ingin tahu apakah performa benar-benar membaik. Cara paling sah untuk memastikannya adalah...',
    options: [
      'Menjalankan benchmark dengan skenario yang sama sebelum dan sesudah perubahan, lalu membandingkan requests per second, latency, dan error',
      'Melihat berapa lama proses HAProxy melakukan start',
      'Menambah jumlah backend terus menerus sampai angkanya naik',
      'Membandingkan hasil benchmark di komputer lain dengan tool yang berbeda'
    ],
    answer: 0,
    explain: 'Perubahan hanya bisa dinilai lewat pengukuran yang kondisinya terkendali dan sebanding; angka tuning milik orang lain atau pengukuran yang tidak setara tidak menyatakan apa pun tentang bebanmu.'
  },
  {
    id: 'haproxy30',
    q: 'Kamu menurunkan timeout client menjadi 1s agar terdengar lebih cepat. Apa yang paling mungkin terjadi pada client yang memakai keep-alive?',
    options: [
      'Backend otomatis memperpanjang koneksi idle agar client nyaman',
      'Koneksi keep-alive yang menganggur diputus setelah 1 detik, sehingga client sering membuka koneksi baru',
      'timeout server ikut mengecil sehingga response lambat tetap dianggap sukses',
      'HAProxy menolak semua request yang durasinya lebih dari 1 detik'
    ],
    answer: 1,
    explain: 'timeout client mengatur berapa lama HAProxy menunggu request berikutnya dari client pada koneksi yang sudah terbuka; angka terlalu kecil memutus keep-alive idle yang justru memperbanyak handshake.'
  },
  {
    id: 'haproxy31',
    q: 'Kamu mengaktifkan cookie persistence pada web pool. Apa konsekuensi langsungnya terhadap distribusi load?',
    options: [
      'Distribusi justru menjadi lebih merata karena tiap client diberi cookie berbeda',
      'Health check otomatis dimatikan agar cookie tidak hilang',
      'Client cenderung kembali ke backend yang sama, sehingga distribusi bisa jauh dari rata meski algoritmanya tetap roundrobin',
      'Semua request dikirim ke backend pertama yang sehat'
    ],
    answer: 2,
    explain: 'Persistence mempertahankan client pada satu backend demi state, dan itu bertabrakan dengan keseimbangan beban — karena itu pakai hanya bila aplikasi benar-benar butuh, dan pantau distribusinya.'
  },
  {
    id: 'haproxy32',
    q: 'Untuk menolak IP yang mengirim lebih dari 100 request dalam 10 detik, fitur HAProxy yang paling tepat adalah...',
    options: [
      'balance source, karena pembagian berdasar IP sekaligus berarti membatasi',
      'weight pada setiap server, karena bobot menentukan jumlah request yang diterima',
      'timeout client 10s, karena membatasi waktu sama dengan membatasi kecepatan',
      'stick-table yang menyimpan http_req_rate per IP, lalu http-request deny berdasarkan rate itu'
    ],
    answer: 3,
    explain: 'Stick-table adalah penyimpanan state per kunci seperti IP yang bisa mencatat rate request; dari situ aturan deny menyaring IP yang melebihi ambang — balance source dan weight tidak pernah membatasi jumlah request.'
  },
  {
    id: 'haproxy33',
    q: 'Traffic sedang berjalan dan kamu sudah mengubah haproxy.cfg. Apa yang dilakukan proses lama ketika kamu melakukan graceful reload?',
    options: [
      'Berhenti menerima koneksi baru tetapi tetap menyelesaikan koneksi yang sedang berjalan sampai tuntas',
      'Langsung mematikan semua koneksi client agar konfigurasi baru terasa bersih',
      'Menjalankan konfigurasi baru di proses yang sama tanpa memulai proses baru',
      'Menghapus file konfigurasi lama dari disk'
    ],
    answer: 0,
    explain: 'Graceful reload memulai proses baru sementara proses lama tidak lagi menerima koneksi baru dan hanya menyelesaikan yang sudah berjalan — inilah alasan reload aman dilakukan di tengah traffic.'
  },
  {
    id: 'haproxy34',
    q: 'Client aplikasi menerima 503 Service Unavailable dari HAProxy, padahal saat kamu membuka backend langsung lewat portnya aplikasinya normal. Penjelasan paling mungkin adalah...',
    options: [
      'Sertifikat HTTPS sudah kedaluwarsa sehingga frontend tidak bisa melayani',
      'Health check HAProxy gagal sehingga semua server dianggap DOWN dan tidak ada server sehat yang bisa dipilih',
      'DNS di mesin client sedang bermasalah sehingga HAProxy membalas 503',
      'Backend menolak TLS dari client sehingga request dibuang'
    ],
    answer: 1,
    explain: '503 dari HAProxy berarti proxy tidak punya server sehat untuk dipilih; dengan backend yang tetap sehat saat diakses langsung, penyebab tersering adalah health check yang tidak lolos karena salah URI, port, atau status yang diharapkan.'
  },
  {
    id: 'haproxy35',
    q: 'Setelah kamu memperbaiki haproxy.cfg, container HAProxy langsung mati begitu start. Perintah paling tepat untuk menemukan penyebabnya adalah...',
    options: [
      'podman rm -f haproxy lalu membuat container baru tanpa membaca galatnya',
      'curl -i http://localhost:8080 berulang kali sampai muncul error',
      'podman logs haproxy dan haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg untuk melihat galat konfigurasinya',
      'menaikkan maxconn agar proses punya lebih banyak ruang saat start'
    ],
    answer: 2,
    explain: 'Container yang langsung mati biasanya karena konfigurasi tidak valid; podman logs menampilkan pesan galat dan haproxy -c -f memvalidasi file tanpa menjalankannya, sehingga baris bermasalah cepat terlihat.'
  },
  {
    id: 'haproxy36',
    q: 'Distribusi di lab terlihat tidak merata: 20 request terakhir jatuh semua ke web1 padahal balancenya roundrobin. Pemeriksaan pertama yang paling tepat adalah...',
    options: [
      'Langsung mengganti algoritma ke source agar distribusi dipaksa berubah',
      'Menambah weight web1 menjadi 10 agar porsinya makin besar',
      'Merestart semua backend bersamaan agar kembali sinkron',
      'Memeriksa apakah ada persistence (cookie atau stick table) yang mengikat client, serta status server yang sedang DOWN'
    ],
    answer: 3,
    explain: 'Roundrobin hanya menyebarkan request ke server SEHAT; bila sebagian server DOWN atau ada persistence yang mengikat client, tampilan memang menumpuk ke satu server — cek itu dulu sebelum mengganti algoritma.'
  },
  {
    id: 'haproxy37',
    q: 'Pada capstone, request dengan Host yang tidak dikenal (bukan web.lab.local, api.lab.local, maupun admin.lab.local) seharusnya tetap dilayani. Aturan yang menjamin itu adalah...',
    options: [
      'default_backend pada frontend, sebagai pilihan terakhir saat tidak ada ACL host yang cocok',
      'balance leastconn di backend web',
      'stats uri /stats agar tujuan request terlihat di halaman statistik',
      'bind :443 ssl crt lab.pem yang otomatis memilih backend'
    ],
    answer: 0,
    explain: 'Routing host memakai use_backend ... if; kalau tidak ada yang cocok, hanya default_backend yang menentukan tujuan — tanpa itu request bisa berakhir tanpa backend sehingga berakhir 503.'
  },
  {
    id: 'haproxy38',
    q: 'Web pool memakai roundrobin sedangkan API pool memakai leastconn. Alasan paling tepat untuk pilihan itu adalah...',
    options: [
      'Karena web selalu lebih berat dari API sehingga butuh pembagian bergiliran',
      'Karena durasi request API bervariasi dan cenderung lama, sehingga leastconn menyeimbangkan beban berdasar koneksi aktif',
      'Karena leastconn hanya boleh dipakai di dalam frontend',
      'Karena roundrobin tidak mendukung weight pada HAProxy'
    ],
    answer: 1,
    explain: 'leastconn unggul saat durasi request bervariasi: server yang sedang memproses request lama tidak diberi request baru selama koneksi aktifnya masih banyak — persis karakter API; roundrobin cukup untuk request web yang pendek dan seragam.'
  },
  {
    id: 'haproxy39',
    q: 'Frontend HTTPS capstone kamu sudah tertulis bind :443 ssl crt certs/lab.pem, tetapi kamu tetap ingin http://web.lab.local berpindah ke https. Tambahan yang perlu dibuat adalah...',
    options: [
      'Backend baru khusus HTTP agar port 80 tetap hidup melayani',
      'Mengubah balance menjadi static-rr pada web pool',
      'http-request redirect scheme https code 301 if !{ ssl_fc } pada frontend port 80',
      'Menonaktifkan health check agar redirect tidak terganggu'
    ],
    answer: 2,
    explain: 'Redirect HTTP ke HTTPS dibuat di frontend port 80 dengan syarat koneksi belum TLS; tanpa itu client yang mengetik http:// tetap dilayani HTTP biasa dan tidak pernah mencapai frontend 443.'
  },
  {
    id: 'haproxy40',
    q: 'Menurut test plan capstone, langkah yang paling menentukan arsitekturmu layak disebut siap produksi adalah...',
    options: [
      'Menambah jumlah container backend sebanyak mungkin tanpa mengubah konfigurasi',
      'Memastikan halaman stats tampil rapi dan enak dilihat',
      'Menjalankan traffic normal saja dan berhenti begitu tidak ada error',
      'Menguji jalur kegagalan: backend down lalu pulih, node HAProxy mati (failover), reload, serta rollback konfigurasi'
    ],
    answer: 3,
    explain: 'Sistem benar-benar teruji ketika kegagalannya sanggup ditangani; menguji hanya jalur sukses menyembunyikan masalah pada failover, pemulihan, dan rollback yang justru muncul di produksi.'
  }
);
