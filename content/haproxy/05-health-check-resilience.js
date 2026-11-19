/* ============================================================
   Pelajaran HAProxy — 05: Health Check dan Ketahanan Backend
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'health-check-resilience',
  title: 'Health Check dan Ketahanan Backend',
  chapter: 'Ketahanan',
  duration: '15 menit',
  intro: [
    'Bayangkan petugas gudang yang tidak cukup hanya melihat lampu di pintu gudang menyala, tapi benar-benar masuk, memastikan barangnya lengkap, dan baru menganggukkan kepala. Kalau petugas itu hanya mengecek lampu, gudang yang raknya kosong akan tetap dilaporkan &quot;sehat&quot; — dan pelanggan pulang dengan tangan hampa. <b>Itulah bedanya health check dangkal dan health check yang jujur.</b>',
    'Di pelajaran ini kamu membawa backend-mu naik satu tingkat: mengganti pemeriksaan bawaan (hanya membuka koneksi TCP) dengan <code>option httpchk</code> yang benar-benar mengirim request HTTP, memperketatnya lewat <code>http-check expect status 200</code>, lalu mengatur tempo deteksi memakai <code>check inter</code>, <code>fall</code>, dan <code>rise</code>.',
    'Semua itu lalu diuji dengan aksi paling sederhana namun paling meyakinkan: <code>podman stop web2</code>, amati HAProxy menyingkirkannya dari rotasi, lalu <code>podman start web2</code> dan saksikan ia kembali masuk. Kamu akan belajar membaca status itu dari log dan stats, serta memahami kenapa endpoint health harus mewakili <b>kesiapan service</b>, bukan sekadar halaman yang selalu tersedia.'
  ],
  objectives: [
    'Membedakan TCP health check dan HTTP health check beserta kapan masing-masing cukup',
    'Menulis konfigurasi option httpchk dan http-check expect status untuk pengecekan yang tegas',
    'Mengatur check inter, fall, rise, dan check port serta menghitung waktu deteksi kegagalan',
    'Menguji simulasi backend down dan recovery sambil membaca status dari log dan stats'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>TCP check vs HTTP check: dua tingkat kedalaman</h3><p>Tanpa konfigurasi apa pun, health check bawaan HAProxy sudah aktif untuk setiap baris <code>server ... check</code> — tapi pemeriksaannya setengah hati:</p><table><thead><tr><th>Aspek</th><th>TCP check (bawaan)</th><th>HTTP check (option httpchk)</th></tr></thead><tbody><tr><td><b>Yang dilakukan</b></td><td>Hanya mencoba membuka koneksi TCP ke port server</td><td>Membuka koneksi lalu mengirim request HTTP lengkap</td></tr><tr><td><b>Yang dibuktikan</b></td><td>Port terbuka dan ada yang mendengarkan</td><td>Aplikasi benar-benar menjawab sesuai harapan</td></tr><tr><td><b>Kelebihan</b></td><td>Cepat dan cukup untuk protocol non-HTTP</td><td>Menggambarkan kondisi aplikasi yang sesungguhnya</td></tr><tr><td><b>Kelemahan</b></td><td>Proses hidup tapi aplikasi menggantung tetap dianggap sehat</td><td>Sedikit lebih berat; perlu endpoint yang tepat</td></tr></tbody></table><p>Bayangkan nginx masih memasang socket-nya tapi database di belakang aplikasi sudah mati: TCP check akan terus berkata &quot;sehat&quot;. Di situlah <code>option httpchk</code> masuk.</p>'
    },
    {
      type: 'example',
      title: 'Naikkan health check ke level HTTP',
      lang: 'cfg',
      output: false,
      code: `backend web_servers
    balance roundrobin
    option httpchk GET /
    server web1 web1:80 check
    server web2 web2:80 check
    server web3 web3:80 check`,
      explain: [
        '<code>option httpchk GET /</code> mengubah pemeriksaan menjadi request HTTP lengkap dengan method <code>GET</code> dan URI <code>/</code> — HAProxy dianggap tahu isi layanan, bukan cuma portnya.',
        'Secara bawaan HAProxy menerima respons <b>2xx dan 3xx</b> sebagai sehat; status lain (termasuk tidak ada respons sama sekali) berarti kegagalan.',
        '<code>check</code> tetap ditulis di tiap baris <code>server</code> — <code>option httpchk</code> hanya mengubah <b>cara</b> check berjalan, bukan menyalakan check-nya.',
        'URI check diatur di baris <code>httpchk</code> ini (bukan directive terpisah): cukup ganti <code>GET /</code> menjadi <code>GET /health</code> bila aplikasimu punya endpoint khusus.'
      ]
    },
    {
      type: 'example',
      title: 'Perketat syarat sehat dan atur tempo deteksi',
      lang: 'cfg',
      output: false,
      code: `backend web_servers
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    server web1 web1:80 check inter 2s fall 3 rise 2
    server web2 web2:80 check inter 2s fall 3 rise 2 port 80
    server web3 web3:80 check inter 2s fall 3 rise 2`,
      explain: [
        '<code>http-check expect status 200</code> membuat syarat lebih tegas: hanya <code>200 OK</code> yang diterima, sehingga respons <code>302</code> atau <code>500</code> dianggap gagal walaupun masih 2xx/3xx.',
        '<code>inter 2s</code> = jarak antar check (default HAProxy 2 detik); <code>fall 3</code> = dianggap DOWN setelah 3 kegagalan berturut (±6 detik); <code>rise 2</code> = dianggap UP lagi setelah 2 keberhasilan berturut (±4 detik).',
        '<code>port 80</code> pada baris web2 memaksa check menuju port tertentu — berguna bila port layanan berbeda dari port check (misal service di 80 tapi health endpoint di 8081); di lab ini keduanya sama sehingga hanya ilustrasi sintaks.',
        'Angka 2s/3/2 yang kamu tulis di sini adalah nilai default; menuliskannya secara eksplisit membuat niat konfigurasimu terbaca jelas saat ditinjau orang lain.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Siklus health check HAProxy: server UP diperiksa berkala, jatuh DOWN setelah tiga kegagalan, lalu kembali UP setelah dua keberhasilan berturut saat container dihidupkan lagi">
        <text x="30" y="34" class="u-title" text-anchor="start">Siklus deteksi dan pemulihan backend</text>
        <rect x="30" y="70" width="176" height="64" rx="8" class="u-hd"/>
        <text x="118" y="98" class="u-lbl" text-anchor="middle">web2 UP</text>
        <text x="118" y="120" class="u-lbl" text-anchor="middle">menerima traffic</text>
        <line x1="212" y1="102" x2="256" y2="102" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="234" y="88" class="u-lbl" text-anchor="middle">inter 2s</text>
        <rect x="262" y="60" width="212" height="84" rx="8" class="u-box"/>
        <text x="368" y="88" class="u-lbl" text-anchor="middle">HAProxy mengirim check</text>
        <text x="368" y="112" class="u-lbl" text-anchor="middle">GET /health (httpchk)</text>
        <text x="368" y="134" class="u-lbl" text-anchor="middle">syarat: status 200</text>
        <line x1="480" y1="102" x2="524" y2="102" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="502" y="88" class="u-lbl" text-anchor="middle">fall 3</text>
        <rect x="530" y="70" width="180" height="64" rx="8" class="u-box"/>
        <text x="620" y="98" class="u-lbl" text-anchor="middle">web2 DOWN</text>
        <text x="620" y="120" class="u-lbl" text-anchor="middle">dikeluarkan dari rotasi</text>
        <line x1="620" y1="134" x2="620" y2="182" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="668" y="164" class="u-lbl" text-anchor="middle">podman start web2</text>
        <rect x="530" y="188" width="180" height="56" rx="8" class="u-box"/>
        <text x="620" y="212" class="u-lbl" text-anchor="middle">rise 2 check sukses</text>
        <text x="620" y="234" class="u-lbl" text-anchor="middle">kembali dihitung sehat</text>
        <line x1="524" y1="216" x2="240" y2="216" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="382" y="204" class="u-lbl" text-anchor="middle">web2 kembali masuk rotasi</text>
        <text x="380" y="276" class="u-lbl" text-anchor="middle">waktu deteksi = inter x fall; waktu pemulihan = inter x rise</text>
      </svg></div><figcaption>HAProxy menurunkan server setelah fall kegagalan berturut dan mengangkatnya kembali setelah rise keberhasilan berturut.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Simulasi backend down lalu pulih',
      lang: 'bash',
      output: false,
      code: `# pastikan semua sehat dulu
for i in $(seq 1 6); do curl -s http://localhost:8080; done

# matikan web2 dan amati selama HAProxy mendeteksinya
podman stop web2
sleep 8
for i in $(seq 1 12); do curl -s http://localhost:8080; done

# baca keputusan HAProxy dari log
podman logs haproxy | grep -i "web2"

# hidupkan lagi dan amati pemulihan
podman start web2
sleep 6
for i in $(seq 1 12); do curl -s http://localhost:8080; done`,
      explain: [
        'Loop pertama membuktikan kondisi awal: ketiga identitas muncul bergiliran sebelum kamu mengganggu apa pun.',
        'Setelah <code>podman stop web2</code>, beri jeda <code>sleep 8</code> agar <code>inter 2s x fall 3 = ±6 detik</code> deteksi selesai — loop berikutnya seharusnya hanya menampilkan web1 dan web3, artinya web2 sudah dikeluarkan dari rotasi.',
        '<code>grep -i "web2"</code> menyaring log transisi status: di situ kamu melihat kapan server dinyatakan DOWN beserta alasan check-nya, lalu kembali UP setelah container dinyalakan.',
        '<code>podman start web2</code> menghidupkan container yang sama; dengan <code>rise 2</code>, web2 butuh ±4 detik dua check sukses sebelum layak menerima traffic lagi.'
      ]
    },
    {
      type: 'example',
      title: 'Bentuk hasil yang menandakan ketahanan bekerja',
      lang: 'text',
      output: false,
      code: `SEBELUM (semua sehat)
      6 request: web1, web2, web3, web1, web2, web3

SAAT web2 DOWN (setelah fall x inter)
     12 request: web1, web3, web1, web3, ...   (tanpa web2 sama sekali)

SESUDAH web2 start lagi (setelah rise x inter)
     12 request: web1, web3, web1, web2, web3, ...  (web2 kembali)

LOG (dari podman logs haproxy)
 [WARNING] Server web_servers/web2 is DOWN, check successful
 ... request berikutnya dialihkan ke web1 dan web3
 [WARNING] Server web_servers/web2 is UP, ready for resuming traffic`,
      explain: [
        'Tidak ada satu pun request yang jatuh ke web2 selama statusnya DOWN — inilah inti ketahanan: kegagalan tidak sampai ke pengguna.',
        'Respons client tetap <code>200 OK</code> selama masih ada server sehat; 503 baru muncul kalau <b>seluruh</b> backend down (yang sudah kamu lihat di pelajaran instalasi).',
        'Bentuk baris log persisnya bisa sedikit berbeda antarversi HAProxy, tapi polanya selalu sama: keputusan DOWN/UP, alasan, dan lama check dicatat — itulah bahan baku troubleshooting.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membaca status backend: dari mana datangnya?</h3><p>Di lab ini kamu punya tiga jendela yang saling melengkapi:</p><ul><li><b><code>podman logs haproxy</code></b> — jejak keputusan historis: kapan server DOWN/UP, alasan, dan durasi check. Filter dengan <code>grep</code> nama server agar tidak tenggelam.</li><li><b>Loop <code>curl</code></b> — bukti perilaku di sisi klien: server mana yang benar-benar menerima request sekarang.</li><li><b>Halaman stats</b> — tampilan status semua server secara langsung; konfigurasinya baru kamu bangun di pelajaran Monitoring, jadi di sini cukup kenali dulu konsepnya.</li></ul><p>Ketiganya menjawab pertanyaan berbeda: <i>apa yang terjadi</i>, <i>apa dampaknya</i>, dan <i>kondisi sekarang bagaimana</i>. Troubleshooting yang baik menengok ketiganya, bukan hanya salah satu.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kenapa endpoint health harus mewakili kesiapan service?</h3><p><code>option httpchk GET /</code> ke halaman utama sering sudah cukup untuk aplikasi statis, tapi untuk aplikasi nyata pertanyaannya lebih tajam: <b>apakah service benar-benar siap melayani?</b></p><ul><li><b>Periksa dependency kunci</b> — endpoint <code>/health</code> yang mengecek koneksi database atau antrian jauh lebih jujur daripada halaman yang selalu tampil walau aplikasi lumpuh.</li><li><b>Jangan selalu menjawab 200</b> — bila endpoint health mengembalikan 200 dalam kondisi apa pun, HAProxy tidak akan pernah menyingkirkan server yang rusak dan health check jadi teater belaka.</li><li><b>Buat ringan</b> — check berjalan berkali-kali per menit; query berat di endpoint health akan membebani backend justru saat ia sedang rapuh.</li><li><b>Bedakan hidup vs siap</b> — proses yang baru start tapi belum selesai memuat data seharusnya masih menjawab bukan-200 sampai benar-benar siap.</li></ul><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">Health check yang jujur akan membuat HAProxy menyingkirkan server yang rusak <b>sebelum</b> pengguna mengeluh — itulah nilai sebenarnya dari pelajaran ini.</blockquote>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum health check',
      text: '<ul><li><b>Berhenti di TCP check untuk aplikasi web</b> — port terbuka bukan bukti aplikasi melayani; selalu naikkan ke <code>option httpchk</code>.</li><li><b>Endpoint health yang selalu 200</b> — HAProxy akan melindungi server yang sebenarnya sakit, dan kamu baru sadar saat pengguna komplain.</li><li><b><code>inter</code> terlalu kecil</b> (ratusan milidetik) — check membanjiri backend dan status bisa berfluktuatif; <b>terlalu besar</b> membuat kegagalan baru terdeteksi berpuluh-puluh detik.</li><li><b>Lupa menghitung waktu deteksi</b> — tanpa menyadari <code>inter x fall</code>, kamu mengira HAProxy &quot;lambat&quot; padahal konfigurasimu sendiri yang menentukan.</li><li><b>Salah port check</b> — bila <code>check port</code> menunjuk port yang tidak melayani, server sehat akan terus dinyatakan DOWN dan traffic menyempit ke server lain tanpa sebab jelas.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Uji ketahanan seperti uji bencana mini',
      text: '<p>Saat simulasi, jalankan loop <code>curl</code> secara <b>terus-menerus</b> di terminal kedua selama kamu <code>stop</code> dan <code>start</code> backend. Dengan begitu kamu melihat sendiri momen peralihan: request terakhir ke web2, periode tanpa web2, lalu request pertama kembali ke web2. Catat angka <code>inter</code>, <code>fall</code>, dan <code>rise</code> beserta detik nyata yang terukur — perbandingan ini menjadi dasar kamu menentukan parameter check di produksi nanti, bukan sekadar menyalin angka dari tutorial.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Health check', 'Pemeriksaan berkala oleh HAProxy untuk memastikan server masih layak menerima traffic.'],
        ['TCP check', 'Health check bawaan yang hanya mencoba membuka koneksi ke port server.'],
        ['option httpchk', 'Directive yang mengubah check menjadi request HTTP lengkap dengan method dan URI tertentu.'],
        ['http-check expect status', 'Aturan tambahan untuk menerima status response tertentu saja, misal hanya 200.'],
        ['inter', 'Jarak antar health check; default 2 detik, dan juga berperan sebagai batas waktu check.'],
        ['fall', 'Jumlah kegagalan berturut sebelum server dinyatakan DOWN; default 3.'],
        ['rise', 'Jumlah keberhasilan berturut sebelum server dinyatakan UP kembali; default 2.'],
        ['check port', 'Opsi baris server untuk mengarahkan health check ke port yang berbeda dari port layanan.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis blok backend dengan <code>option httpchk GET /</code>, lalu ubah jadi <code>/health</code> dan <code>http-check expect status 200</code> — jelaskan perbedaan syarat sehat pada kedua versi.</li><li>Jalankan simulasi <code>podman stop web2</code> dan <code>podman start web2</code> sambil loop <code>curl</code> berjalan; catat <b>detik nyata</b> deteksi dan pemulihan, lalu cocokkan dengan <code>inter x fall</code> serta <code>inter x rise</code>.</li><li>Tuliskan tiga kriteria sebuah endpoint health yang baik untuk aplikasi milikmu sendiri (termasuk apa yang harus ikut diperiksa).</li><li><b>Checkpoint:</b> mampu memahami dan menguji deteksi kegagalan serta pemulihan backend, lengkap dengan membaca buktinya dari log dan pola curl.</li></ol>'
    }
  ],
  recap: [
    'Health check bawaan hanya <b>TCP</b>; <code>option httpchk</code> mengangkatnya ke HTTP sehingga yang diperiksa adalah jawaban aplikasi, bukan sekadar port terbuka.',
    '<code>http-check expect status 200</code> membuat syarat sehat lebih tegas, sementara URI check diatur dari baris <code>option httpchk</code>.',
    'Tempo deteksi ditentukan <b><code>inter x fall</code></b> dan pemulihan oleh <b><code>inter x rise</code></b> — hitung dulu sebelum mengelola HAProxy terasa lambat.',
    'Bukti ketahanan dibaca dari tiga jendela: <b>log</b> (apa yang terjadi), <b>loop curl</b> (dampaknya), dan <b>stats</b> (kondisi sekarang) — plus endpoint health yang jujur agar keputusan DOWN/UP benar.'
  ]
});
