/* ============================================================
   Pelajaran HAProxy — 08: Logging, Stats Page, dan Observabilitas
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'monitoring-observability',
  title: 'Logging, Stats Page, dan Observabilitas',
  chapter: 'Observabilitas',
  duration: '14 menit',
  intro: [
    'Bayangkan ruang kontrol pembangkit listrik: dinding penuh layar yang menunjukkan tegangan, suhu, dan alarm, plus buku catatan yang merekam setiap kejadian detik demi detik. Tanpa keduanya, petugas hanya tahu listrik padam <i>setelah</i> lampu mati — dan itulah posisi kamu kalau HAProxy berjalan tanpa log dan tanpa statistik.',
    'Pelajaran ini menyalakan dua perangkat itu: <b>logging</b> ke stdout container (lengkap dengan cara membaca tiap field), dan <b>stats page</b> yang menampilkan kondisi frontend/backend/server secara langsung. Keduanya adalah sumber jawaban pertama saat ada yang aneh.',
    'Selanjutnya kamu susun <b>tabel metrik wajib pantau</b>, lalu naik satu tingkat ke observabilitas modern: Prometheus exporter, Grafana, logging terpusat, alerting, dan rotasi log — supaya lab kamu berubah dari &quot;cek manual&quot; jadi sistem yang memberi tahu duluan.'
  ],
  objectives: [
    'Mengaktifkan logging HAProxy ke stdout dan membaca tiap field pada log HTTP',
    'Menampilkan stats page dengan URI, refresh, dan autentikasi yang benar',
    'Mengenali metrik wajib pantau beserta tanda bahaya pada masing-masing',
    'Menjelaskan jalur observabilitas lanjutan: Prometheus, Grafana, logging terpusat, alerting, dan rotasi log'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua alat, dua pertanyaan berbeda</h3><p><b>Log</b> menjawab <i>&quot;kenapa kejadian ini terjadi?&quot;</i> — ia merekam tiap request lengkap dengan backend terpilih, durasi, status, dan penyebab koneksi berakhir. <b>Stats/metrics</b> menjawab <i>&quot;kapan harus bertindak?&quot;</i> — angka agregat yang bisa dibaca dalam sekali lirik dan dipantau terus-menerus.</p><table><thead><tr><th>Alat</th><th>Cocok untuk</th><th>Bentuk</th></tr></thead><tbody><tr><td><b>Log</b> (<code>option httplog</code>)</td><td>Diagnosa satu request bermasalah, audit, analisis pola</td><td>Baris per request, ke stdout container</td></tr><tr><td><b>Stats page</b></td><td>Memantau kondisi live: koneksi, antrean, status server</td><td>Halaman web di port terpisah</td></tr><tr><td><b>Exporter + Grafana</b></td><td>Tren, perbandingan, dashboard bersama tim</td><td>Metrik scraped → grafik → alert</td></tr></tbody></table><p>Di Podman, log paling praktis diarahkan ke <b>stdout</b> — satu jalur yang sudah ditangani runtime container, sehingga kamu bisa membacanya dengan <code>podman logs</code> tanpa mengurus file rotasi sendiri.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">Kebalikannya juga berlaku: angka tanpa log membuat kamu tahu <i>ada</i> masalah tapi tidak tahu <i>kenapa</i>. Pakai keduanya — log untuk diagnosis, stats untuk deteksi dini.</blockquote>'
    },
    {
      type: 'example',
      title: 'Aktifkan logging HTTP ke stdout',
      lang: 'cfg',
      output: false,
      code: `global
    log stdout format raw local0
    maxconn 2000

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5s
    timeout client 30s
    timeout server 30s`,
      explain: [
        '<code>log stdout format raw local0</code> mengarahkan log ke aliran standar output proses (bukan file/syslog) dengan format <i>raw</i> dan fasilitas <code>local0</code> — di container, artinya semua baris log terbaca lewat <code>podman logs haproxy</code>.',
        '<code>log global</code> di <code>defaults</code> mewariskan perintah log ke <b>semua</b> frontend/backend; tanpa baris ini, konfigurasi log global tidak dipakai proxy mana pun.',
        '<code>option httplog</code> membuat log berformat HTTP lengkap (request, status, durasi, byte) — tanpanya kamu hanya mendapat log TCP yang jauh lebih singkat.',
        '<code>option dontlognull</code> membuang koneksi tanpa request (misal scan port); ketiga timeout tetap wajib agar koneksi gantung tidak memenuhi statistikmu.'
      ]
    },
    {
      type: 'example',
      title: 'Satu baris log HTTP dan arti tiap bagiannya',
      lang: 'text',
      output: false,
      code: `haproxy[61]: 127.0.0.1:52344 [15/Jan/2026:10:21:33.121] http_front web_servers/web1 0/0/1/1/3 200 256 - - ---- 1/1/1/1/0 0/0 {} {} "GET / HTTP/1.1"`,
      explain: [
        'Berturut-turut: <b>client</b> <code>127.0.0.1:52344</code>, <b>waktu request</b> dalam kurung, <b>frontend</b> <code>http_front</code>, lalu <b>backend/server</b> terpilih <code>web_servers/web1</code> (berubah jadi <code>&lt;NOSRV&gt;</code> bila request tidak sampai ke server mana pun).',
        '<code>0/0/1/1/3</code> adalah lima durasi milidetik <code>Tq/Tw/Tc/Tr/Tt</code>: waktu terima request, <b>antrean</b>, koneksi ke server, respons server, dan total — angka antrean yang terus positif adalah sinyal server kehabisan slot.',
        '<code>200</code> status, <code>256</code> byte terkirim, dua tanda <code>- -</code> adalah cookie request/response yang ditangkap (kosong bila <code>capture cookie</code> tidak dipakai).',
        '<code>----</code> adalah <b>termination state</b>: karakter pertama penyebab akhir (huruf <code>c</code>/<code>s</code> = timeout client/server, <code>C</code>/<code>S</code> = diputus client/server, <code>P</code> = diblokir proxy, <code>-</code> = normal), karakter kedua tahap saat berakhir (<code>R</code> menunggu request, <code>Q</code> antre, <code>C</code> menghubungi server, <code>D</code> fase data, <code>-</code> selesai), dua sisanya info cookie persistensi. <code>----</code> berarti berakhir normal.',
        'Sisa baris <code>1/1/1/1/0</code> = koneksi aktif proses/frontend/backend/server/retries, <code>0/0</code> = antrean server/backend, lalu diakhiri baris request dalam tanda kutip.'
      ]
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Pipeline observabilitas HAProxy: log ke stdout lalu ke penyimpanan log terpusat, dan stats ke Prometheus lalu Grafana, keduanya memicu alerting">\n        <rect x="30" y="40" width="180" height="80" rx="8" class="u-hd"/>\n        <text x="120" y="72" class="u-title" text-anchor="middle">HAProxy</text>\n        <text x="120" y="98" class="u-lbl" text-anchor="middle">log + stats</text>\n        <line x1="216" y1="76" x2="294" y2="54" class="u-line" marker-end="url(#u-arrow)"/>\n        <line x1="216" y1="88" x2="294" y2="150" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="252" y="44" class="u-lbl" text-anchor="middle">log http</text>\n        <text x="252" y="132" class="u-lbl" text-anchor="middle">metrik</text>\n        <rect x="300" y="20" width="200" height="64" rx="6" class="u-box"/>\n        <text x="400" y="58" class="u-lbl" text-anchor="middle">stdout - podman logs</text>\n        <rect x="300" y="120" width="200" height="64" rx="6" class="u-box"/>\n        <text x="400" y="158" class="u-lbl" text-anchor="middle">stats :8404 / metrics</text>\n        <line x1="506" y1="52" x2="574" y2="52" class="u-line" marker-end="url(#u-arrow)"/>\n        <line x1="506" y1="152" x2="574" y2="152" class="u-line" marker-end="url(#u-arrow)"/>\n        <rect x="580" y="20" width="160" height="64" rx="6" class="u-hd"/>\n        <text x="660" y="58" class="u-lbl" text-anchor="middle">Loki / ELK</text>\n        <rect x="580" y="120" width="160" height="64" rx="6" class="u-hd"/>\n        <text x="660" y="158" class="u-lbl" text-anchor="middle">Prometheus - Grafana</text>\n        <line x1="400" y1="188" x2="400" y2="216" class="u-line" marker-end="url(#u-arrow)"/>\n        <line x1="660" y1="188" x2="660" y2="216" class="u-line" marker-end="url(#u-arrow)"/>\n        <rect x="300" y="222" width="440" height="52" rx="8" class="u-box"/>\n        <text x="520" y="254" class="u-lbl" text-anchor="middle">Alerting: error rate naik, backend down, antrean membesar</text>\n        <text x="380" y="294" class="u-lbl" text-anchor="middle">log menjawab kenapa, metrik menjawab kapan harus bertindak</text>\n      </svg></div><figcaption>Log mengalir ke penyimpanan terpusat untuk diagnosis; metrik mengalir ke Prometheus/Grafana untuk grafik dan alert — keduanya menyentuh kanal alerting yang sama.</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Stats page (dengan autentikasi) dan endpoint Prometheus',
      lang: 'cfg',
      output: false,
      code: `listen stats
    bind :8404
    mode http
    stats enable
    stats uri /stats
    stats refresh 5s
    stats auth admin:rahasia123
    stats realm "HAProxy Lab Stats"
    stats hide version

frontend prometheus
    bind :8405 expose-fd listeners
    http-request use-service prometheus-exporter if { path /metrics }`,
      explain: [
        '<code>bind :8404</code> membuka port terpisah khusus statistik sehingga traffic monitoring tidak bercampur dengan traffic aplikasi.',
        '<code>stats enable</code> mengaktifkan halaman, <code>stats uri /stats</code> menentukan alamatnya (<code>http://localhost:8404/stats</code>), dan <code>stats refresh 5s</code> memuat ulang otomatis tiap 5 detik.',
        '<code>stats auth admin:rahasia123</code> mewajibkan username/password — <b>tanpa baris ini halaman terbuka untuk siapa pun</b>, dan ia membocorkan nama backend, jumlah koneksi, serta trafik.',
        '<code>stats hide version</code> menyembunyikan versi HAProxy dari halaman publik (mengurangi informasi untuk pemindai).',
        'Blok kedua menyediakan metrik format Prometheus di <code>:8405/metrics</code>: <code>expose-fd listeners</code> memberi service akses ke socket listener, dan <code>http-request use-service prometheus-exporter</code> menjawab request di path itu tanpa menyentuh backend — inilah yang di-<i>scrape</i> Prometheus.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Metrik yang wajib kamu pantau</h3><p>Buka stats page, lalu biasakan menilai kolom-kolom ini secara berurutan. Angka saja tidak bermakna tanpa konteks, jadi bandingkan dengan nilai normal harianmu:</p><table><thead><tr><th>Metrik</th><th>Apa artinya</th><th>Tanda bahaya</th></tr></thead><tbody><tr><td><b>Active sessions</b></td><td>Koneksi yang sedang berjalan sekarang</td><td>Naik terus tanpa turun = ada yang menggantung</td></tr><tr><td><b>Current / max connections</b></td><td>Pemakaian vs puncak koneksi pernah tercapai</td><td>Mendekati <code>maxconn</code> = request baru bakal diantrekan</td></tr><tr><td><b>Queue</b></td><td>Request menunggu slot server</td><td>Antrean persisten = kapasitas server kurang atau <code>maxconn</code> server terlalu kecil</td></tr><tr><td><b>Request rate</b></td><td>Permintaan per detik</td><td>Lonjakan tiba-tiba = trafik sah atau serangan</td></tr><tr><td><b>Response time</b></td><td>Waktu backend menjawab</td><td>Naik tanpa trafik naik = aplikasi mulai tersendat</td></tr><tr><td><b>Error rate</b></td><td>Respons 5xx dan galat koneksi</td><td>Server hijau tapi error naik = masalah di aplikasi</td></tr><tr><td><b>Bytes in / out</b></td><td>Volume trafik masuk/keluar</td><td>Lonjakan tak wajar = unduhan besar atau abuse</td></tr><tr><td><b>Health check failure</b></td><td>Gagal check berturut-turut</td><td>Server dikeluarkan pool = kapasitas berkurang</td></tr><tr><td><b>Saturation</b></td><td>Sekat mana yang paling dekat dengan batas</td><td>Mendekati batas = tambah resource <i>sebelum</i> error berdatangan</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Naik satu tingkat: dari lab ke sistem yang memberi tahu</h3><ul><li><b>Prometheus exporter</b> — endpoint <code>/metrics</code> dari konfigurasi tadi di-<i>scrape</i> tiap beberapa detik, sehingga semua angka stats tersimpan sebagai deret waktu.</li><li><b>Grafana</b> — sumber Prometheus disajikan sebagai dashboard: panel koneksi, antrean, error rate, dan status server yang bisa dibagikan ke tim.</li><li><b>Centralized logging</b> — <code>podman logs</code> bagus untuk satu node; untuk banyak node, arahkan ke Loki/ELK agar log bisa dicari lintas container dan tidak hilang saat container dihapus.</li><li><b>Alerting</b> — aturan seperti &quot;error rate &gt; 5% selama 5 menit&quot; atau &quot;ada server DOWN &gt; 2 menit&quot; dikirim ke surel/Slack; angka yang tidak dipantau otomatis tidak akan pernah membangunkan siapa pun.</li><li><b>Log rotation</b> — log yang tumbuh tanpa batas menghabiskan disk. Batasi dengan <code>podman run --log-opt max-size=10m --log-opt max-file=3</code>, matikan noise dengan <code>option dontlognull</code>, dan jangan pernah menyimpan token/password ke log.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum monitoring',
      text: '<ul><li><b>Stats dibuka tanpa <code>stats auth</code></b> — di jaringan bersama, siapa pun bisa melihat pola traffic dan nama layananmu. Selalu kombinasikan autentikasi, port terbatas, dan firewall.</li><li><b>Log menumpuk tanpa rotasi</b> — disk penuh membuat HAProxy dan container lain ikut gagal; atur batas ukuran sejak awal.</li><li><b>Hanya melihat status hijau</b> — server &quot;UP&quot; tidak menjamin aplikasi sehat; pantau juga error rate, response time, dan antrean.</li><li><b>Menyalin ambang alert dari orang lain</b> — ambang yang tepat lahir dari trafik normalmu sendiri; mulai dari pengamatan satu-dua minggu.</li><li><b>Log berisi data sensitif</b> — header otorisasi dan query parameter berisi token sebaiknya tidak ikut tercatat; pertimbangkan <code>option http-ignore-probes</code> dan filter sebelum mengirim log ke layanan pihak ketiga.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Rutinitas lima menit tiap pagi',
      text: '<p>Biasakan membuka stats page dengan <code>stats refresh 5s</code>, lalu baca empat angka ini: <b>antrean</b> (ada yang menunggu?), <b>error rate</b> (ada yang gagal semalam?), <b>status server</b> (semua UP?), dan <b>respons time</b> (ada yang melambat?). Bila semuanya normal, selesai — bila tidak, barulah turun ke log dengan <code>podman logs haproxy --since 30m</code> untuk mencari baris dengan status 5xx atau termination state yang bukan <code>----</code>.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['httplog', '<code>option httplog</code> — format log lengkap per request HTTP, aktif di <code>defaults</code>.'],
        ['stdout logging', 'Log ditulis ke aliran output proses sehingga terbaca lewat <code>podman logs</code>.'],
        ['Stats page', 'Halaman web bawaan HAProxy berisi statistik frontend, backend, dan server.'],
        ['stats auth', 'Autentikasi username/password untuk halaman statistik — wajib di luar lab pribadi.'],
        ['Termination state', 'Empat karakter penyebab dan tahap berakhirnya sesi pada log HTTP.'],
        ['Prometheus exporter', 'Layanan bawaan HAProxy yang menyajikan metrik di endpoint <code>/metrics</code>.'],
        ['Alerting', 'Aturan ambang yang mengirim notifikasi bila metrik melewati batas.'],
        ['Saturation', 'Seberapa dekat pemakaian dengan batas maksimum — prediksi masalah sebelum error muncul.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan <code>podman logs haproxy</code>, salin satu baris log request, lalu <b>petakan setiap field</b> (client, waktu, frontend, backend/server, durasi, status, byte, termination state) ke sebuah tabel.</li><li>Kirim 10 request lalu matikan satu backend; amati perubahan pada stats page (status server, jumlah koneksi) dan bandingkan dengan baris log termination state yang muncul.</li><li>Tambahkan <code>stats auth</code> ke konfigurasimu, buktikan akses tanpa password ditolak, lalu buka <code>http://localhost:8404/stats</code> dengan kredensial yang benar.</li><li><b>Checkpoint:</b> mampu mengidentifikasi backend down, koneksi tinggi, antrean, dan error hanya dari membaca log serta stats — tanpa menebak-nebak.</li></ol>'
    }
  ],
  recap: [
    'Aktifkan <b><code>log stdout format raw local0</code> + <code>log global</code> + <code>option httplog</code></b>, lalu baca log lewat <code>podman logs</code>.',
    'Satu baris log HTTP memuat client, waktu, frontend, backend/server, <b>lima durasi Tq/Tw/Tc/Tr/Tt</b>, status, byte, dan termination state 4 karakter.',
    '<b>Stats page</b> (port terpisah, <code>stats uri</code>, <code>stats refresh</code>) wajib dijaga <code>stats auth</code>; sembilan metrik wajib pantau dari active sessions sampai saturation.',
    'Observabilitas produksi = <b>exporter → Prometheus → Grafana → alerting</b> ditambah logging terpusat dan rotasi log — angka tanpa alert tidak pernah membangunkan siapa pun.'
  ]
});
