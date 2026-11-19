/* ============================================================
   Pelajaran HAProxy — 10: Performance, Benchmark, dan Tuning
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'performance-tuning',
  title: 'Performance, Benchmark, dan Tuning',
  chapter: 'Performa',
  duration: '15 menit',
  intro: [
    'Performa load balancer ibarat lalu lintas di jalan tol: pengendara hanya merasa &quot;mulus atau macet&quot;, sementara petugas tahu persis berapa kendaraan per jam, seberapa lama antre di pintu gerbang, dan di ruas mana lampu merah menyala. Tanpa angka, optimasi hanyalah perasaan — dan perasaan berhenti bekerja tepat saat trafik naik.',
    'Pelajaran ini mengubah perasaan itu menjadi data. Kamu akan mempelajari knob yang menentukan throughput (<code>maxconn</code>, timeout, keep-alive &amp; connection reuse, queue/backlog, file descriptor, CPU/memori/jaringan), memakai tool benchmark (<code>wrk</code>, <code>ab</code>, <code>hey</code>), lalu menjalankan eksperimen tuning yang terdokumentasi rapi.',
    'Satu prinsip dipegang sepanjang pelajaran ini: <b>angka tuning milik orang lain tidak berlaku di sistemmu</b>. Workload, resource, dan latency lab kamu berbeda dengan mesin siapa pun — termasuk angka yang bertebaran di internet.'
  ],
  objectives: [
    'Menjelaskan peran <code>maxconn</code>, timeout connect/client/server, keep-alive &amp; connection reuse, queue/backlog, serta limit file descriptor terhadap throughput',
    'Menjalankan benchmark dengan <code>wrk</code>/<code>ab</code>/<code>hey</code> dan mencatat metrik wajib: req/s, latency p95/p99, error, CPU, dan jumlah koneksi',
    'Merancang eksperimen tuning (maxconn, timeout, jumlah backend, backend lambat, roundrobin vs leastconn) dan mendokumentasikan hasil sebelum/sesudah',
    'Mengidentifikasi bottleneck dari data lalu menyusun rekomendasi berbasis pengukuran, bukan salinan angka'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Knob yang menentukan throughput</h3><p>Sebelum menyentuh angka, pahami dulu lima tuas yang bisa kamu putar. Semuanya saling terkait: menaikkan satu tanpa menyesuaikan yang lain justru memindahkan masalah, bukan menyelesaikannya.</p><table><thead><tr><th>Knob</th><th>Peran</th><th>Gejala bila salah setel</th></tr></thead><tbody><tr><td><b><code>maxconn</code></b></td><td>Batas koneksi simultan (global, defaults, frontend)</td><td>Terlalu kecil = request ditolak/antre; terlalu besar = kehabisan file descriptor</td></tr><tr><td><b>timeout connect / client / server</b></td><td>Batas waktu connect ke backend, membaca request client, dan menunggu response server</td><td>Terlalu pendek = request lambat diputus; terlalu lama = slot koneksi menumpuk</td></tr><tr><td><b>keep-alive &amp; connection reuse</b></td><td>Koneksi klien dipakai ulang (<code>option http-reuse safe|always</code>)</td><td>Koneksi baru terus-menerus = mahal di sisi backend</td></tr><tr><td><b>queue &amp; backlog</b></td><td>Antrean bila semua slot server penuh; <code>bind ... backlog</code> untuk koneksi masuk</td><td>Antrean melebihi <code>timeout queue</code> = klien menerima 503</td></tr><tr><td><b>file descriptor &amp; ulimit</b></td><td>±2 FD per koneksi; limit OS harus di atas <code>maxconn</code></td><td>Log <code>too many open files</code>, koneksi gagal acak</td></tr></tbody></table><p>CPU, memori, dan throughput jaringan adalah lapisan ketiga: HAProxy sangat ringan, jadi biasanya <b>backend atau jaringan</b> yang lebih dulu jenuh. Itulah kenapa benchmark harus selalu memantau HAProxy <i>dan</i> backend sekaligus.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Peta bottleneck HAProxy: request melewati bind backlog, maxconn, dan queue di HAProxy lalu sampai ke backend yang bisa cepat, lambat, atau penuh">
        <text x="20" y="30" class="u-title" text-anchor="start">Titik bottleneck bisa ada di mana saja</text>
        <rect x="20" y="110" width="130" height="70" rx="8" class="u-hd"/>
        <text x="85" y="140" class="u-title" text-anchor="middle">Client</text>
        <text x="85" y="164" class="u-lbl" text-anchor="middle">wrk / ab / hey</text>
        <line x1="156" y1="145" x2="194" y2="145" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="200" y="60" width="300" height="180" rx="10" class="u-box"/>
        <text x="350" y="86" class="u-title" text-anchor="middle">HAProxy</text>
        <rect x="216" y="100" width="268" height="36" rx="6" class="u-hd"/>
        <text x="350" y="124" class="u-lbl" text-anchor="middle">bind :8080 backlog 1024</text>
        <rect x="216" y="144" width="268" height="36" rx="6" class="u-box"/>
        <text x="350" y="168" class="u-lbl" text-anchor="middle">maxconn + timeout connect/client/server</text>
        <rect x="216" y="188" width="268" height="36" rx="6" class="u-box"/>
        <text x="350" y="212" class="u-lbl" text-anchor="middle">queue: menunggu slot server bebas</text>
        <line x1="506" y1="145" x2="544" y2="145" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="550" y="60" width="190" height="180" rx="10" class="u-box"/>
        <text x="645" y="86" class="u-title" text-anchor="middle">Pool backend</text>
        <rect x="564" y="100" width="162" height="36" rx="6" class="u-hd"/>
        <text x="645" y="124" class="u-lbl" text-anchor="middle">web1 sehat: 12 ms</text>
        <rect x="564" y="144" width="162" height="36" rx="6" class="u-box"/>
        <text x="645" y="168" class="u-lbl" text-anchor="middle">web2 lambat: makan timeout</text>
        <rect x="564" y="188" width="162" height="36" rx="6" class="u-box"/>
        <text x="645" y="212" class="u-lbl" text-anchor="middle">semua sibuk: 503</text>
        <text x="380" y="272" class="u-lbl" text-anchor="middle">Amati tiap lapisan: bind, maxconn, queue, lalu backend — jangan menebak</text>
      </svg></div><figcaption>Request melewati bind/backlog, maxconn, dan queue di HAProxy sebelum sampai ke backend; bottleneck paling sering ada di backend yang lambat atau jenuh.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi siap benchmark',
      lang: 'cfg',
      output: false,
      code: `global
  maxconn 20000
  ulimit-n 40000

defaults
  mode http
  timeout connect 5s
  timeout client 30s
  timeout server 30s
  timeout queue 10s
  option http-reuse safe
  option httplog

frontend fe_http
  bind :8080 backlog 1024
  maxconn 5000
  default_backend web_pool

backend web_pool
  balance roundrobin
  option httpchk GET /healthz
  server web1 web1:80 check maxconn 100
  server web2 web2:80 check maxconn 100
  server web3 web3:80 check maxconn 100`,
      explain: [
        '<code>global maxconn 20000</code> adalah batas total koneksi proses; <code>ulimit-n 40000</code> memastikan limit file descriptor OS di atasnya karena tiap koneksi memakai ±2 FD. Tanpa ini log akan menyala dengan <code>too many open files</code> di tengah benchmark.',
        'Tiga timeout dipisah per tahap: <code>timeout connect 5s</code> untuk membuka koneksi ke backend, <code>timeout client 30s</code> untuk menerima seluruh request dari klien, dan <code>timeout server 30s</code> untuk menunggu response backend. Menyamakan semuanya ke satu angka besar menyembunyikan masalah, bukan menyelesaikannya.',
        '<code>timeout queue 10s</code> membatasi waktu request menunggu slot server bebas — bila lewat, klien menerima 503. <code>option http-reuse safe</code> mengizinkan koneksi backend dipakai ulang dengan aman antar klien berbeda.',
        '<code>bind :8080 backlog 1024</code> mengatur antrean koneksi masuk di kernel; <code>frontend maxconn 5000</code> membatasi yang dilayani agar tidak membanjiri backend. <code>maxconn 100</code> di tiap server membagi beban dan membuat efek penambahan backend terukur.',
        '<code>option httpchk GET /healthz</code> + <code>check</code> membuat backend sakit otomatis keluar dari pool, sehingga angka benchmark benar-benar merepresentasikan kondisi sehat.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan benchmark dengan wrk, ab, dan hey',
      lang: 'bash',
      output: false,
      code: `# 1) baseline dulu — jangan ubah apa pun sebelum angka pertama tercatat
wrk -t4 -c100 -d30s http://localhost:8080/

# 2) cross-check dengan dua tool lain
ab -n 20000 -c 100 http://localhost:8080/
hey -n 20000 -c 100 http://localhost:8080/

# 3) pantau resource selama benchmark berjalan (terminal kedua)
podman stats --no-stream
podman exec haproxy sh -c 'nproc; cat /proc/loadavg'

# 4) bandingkan 1 backend vs 3 backend
podman stop web2 web3
wrk -t4 -c100 -d30s http://localhost:8080/
podman start web2 web3
wrk -t4 -c100 -d30s http://localhost:8080/`,
      explain: [
        '<code>wrk -t4 -c100 -d30s</code> berarti 4 thread, 100 koneksi terbuka bersamaan, berjalan 30 detik — kombinasi yang cukup stabil untuk lab. Angka <code>req/s</code>, <code>Latency Avg/Max</code>, dan <code>Non-2xx or 3xx responses</code> adalah output wajib yang kamu catat.',
        '<code>ab -n 20000 -c 100</code> memakai 20.000 request dengan 100 koneksi bersamaan, sedangkan <code>hey -n 20000 -c 100</code> memberi persentil latensi yang lebih mudah dibaca. Ketiganya boleh berbeda angka sedikit — yang penting trennya konsisten.',
        '<code>podman stats --no-stream</code> menampilkan CPU/memori HAProxy dan backend pada satu titik waktu; tambahkan pengambilan berulang (misalnya tiap 5 detik) untuk melihat puncak, bukan rata-rata sesaat.',
        'Langkah 4 adalah eksperimen paling berharga: menghentikan <code>web2</code> dan <code>web3</code> membuat kamu membandingkan <b>1 backend vs 3 backend</b> dengan konfigurasi identik, sehingga perbedaan req/s dan latency murni berasal dari jumlah backend.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Formulir catatan benchmark</h3><p>Angka tanpa konteks adalah sampah. Untuk setiap percobaan, isi satu baris berikut — minimal dua kolom perubahannya: sebelum dan sesudah.</p><table><thead><tr><th>Kategori</th><th>Yang dicatat</th></tr></thead><tbody><tr><td><b>Throughput</b></td><td>Requests per second (req/s) dan jumlah request total</td></tr><tr><td><b>Latency</b></td><td>Average, p95, p99, maksimum (detik/detik dari wrk atau hey)</td></tr><tr><td><b>Error</b></td><td>Jumlah response non-2xx/3xx, timeout, dan koneksi gagal</td></tr><tr><td><b>Resource</b></td><td>CPU HAProxy, CPU tiap backend, pemakaian memori, load average</td></tr><tr><td><b>Koneksi</b></td><td>Jumlah koneksi aktif, koneksi baru per detik, isi queue</td></tr><tr><td><b>Perbandingan</b></td><td>1 backend vs 3 backend, roundrobin vs leastconn, TLS on/off</td></tr></tbody></table><p><b>p95 dan p99</b> lebih berguna daripada rata-rata: rata-rata bisa terlihat 40 ms sementara 1% pengguna menunggu 2 detik. Angka itulah yang muncul sebagai &quot;webnya lemot&quot; di laporan pengguna.</p>'
    },
    {
      type: 'example',
      title: 'Mendokumentasikan hasil sebelum dan sesudah',
      lang: 'text',
      output: false,
      code: `PERCOBAAN: 1 backend -> 3 backend (konfigurasi lain identik)
wrk -t4 -c100 -d30s http://localhost:8080/

METRIK                  SEBELUM (1)        SESUDAH (3)
------------------------------------------------------------
req/s                   1.850              4.920
latency avg             43,1 ms            19,8 ms
latency p95             88,0 ms            41,2 ms
latency p99             150,4 ms           76,9 ms
error non-2xx           0                  0
CPU HAProxy             38%                61%
CPU backend             92% (jenuh)        55% per node
koneksi aktif           100                100 (terbagi)
isi queue               12 req/detik       0 req/detik
verifikasi              -                  stats page: 3 UP`,
      explain: [
        'Judul percobaan ditulis lengkap beserta perintah persisnya, supaya kamu atau rekan bisa <b>mengulang</b> benchmark di lain waktu dan mendapat angka yang sebanding.',
        'Kolom SEBELUM dan SESUDAH berdampingan membuat kesimpulan terlihat seketika: req/s naik 2,7 kali, p99 turun separuh, dan queue yang tadinya menumpuk menjadi nol.',
        'CPU backend turun dari 92% (jenuh) ke 55% per node membuktikan bottleneck sebelumnya ada di backend, bukan di HAProxy — HAProxy hanya naik dari 38% ke 61% karena memang melayani lebih banyak request.',
        'Baris verifikasi memastikan ketiga backend benar-benar UP di stats page sebelum sesudah dianggap valid — tanpa ini, perbandingan bisa tidak adil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Eksperimen tuning yang wajib kamu jalankan</h3><p>Urutan eksperimen di bawah dirancang agar setiap langkah hanya mengubah <b>satu variabel</b>, sehingga efeknya bisa dipastikan berasal dari perubahan itu sendiri:</p><ol><li><b>Ubah <code>maxconn</code></b> — setel ke setengah lalu dua kali lipat baseline, amati kapan error dan antrean mulai muncul.</li><li><b>Ubah timeout</b> — perpendek <code>timeout server</code> ke 5s, amati berapa request lambat yang terputus lalu kembalikan ke nilai wajar.</li><li><b>Ubah jumlah backend</b> — 1 vs 2 vs 3 instance dengan beban identik.</li><li><b>Simulasikan backend lambat</b> — tambahkan delay (misalnya endpoint khusus <code>/slow</code>), amati latency p99 dan pertumbuhan antrean.</li><li><b>Simulasikan backend overload</b> — jalankan <code>wrk</code> dengan <code>-c200</code> sampai CPU backend jenuh.</li><li><b>Bandingkan roundrobin vs leastconn</b> — terbaik pada request berdurasi bervariasi.</li><li><b>Amati queue</b> — pantau kolom <code>Queued</code> di stats page saat beban naik.</li><li><b>Identifikasi bottleneck</b> — tentukan apakah di HAProxy, backend, atau jaringan berdasarkan CPU dan latency.</li><li><b>Dokumentasikan sebelum/sesudah</b> — pakai tabel pada contoh sebelumnya.</li></ol>'
    },
    {
      type: 'warn',
      title: 'Jangan menyalin angka tuning orang lain',
      text: '<ul><li><b>Angka blog tidak berlaku di mesinmu</b> — <code>maxconn 50000</code> dari server 32 core dan 64 GB RAM akan membunuh lab laptop kamu yang 2 core.</li><li><b>Timeout tiruan sering terlalu agresif</b> — menyalin <code>timeout server 2s</code> tanpa tahu durasi request aplikasi membuat user lambat selalu dapat 500/503.</li><li><b>Menaikkan <code>maxconn</code> bukan obat 503</b> — kalau backend jenuh, antrean hanya bertambah panjang lalu tetap berakhir 503 pada <code>timeout queue</code>.</li><li><b>Lab bukan produksi</b> — di lab semua komponen ada di satu mesin tanpa TLS; di produksi ada biaya handshake TLS, jaringan, dan lebih banyak klien nyata. Selalu skalakan harapanmu, bukan angkanya.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Satu variabel, satu percobaan, satu catatan',
      text: '<p>Simpan baseline pertama di <code>notes.md</code> lengkap dengan perintahnya, lalu ubah hanya satu hal setiap kali. Ulangi tiap konfigurasi minimal tiga kali dan pakai median angkanya, karena sekali jalan bisa saja kebetulan lambat. Simpan juga <code>haproxy.cfg</code> di Git sehingga &quot;sebelum&quot; dan &quot;sesudah&quot; bisa dibandingkan dengan <code>git diff</code> — inilah cara paling murah untuk tidak pernah berdebat soal hasil tuning.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['maxconn', 'Batas jumlah koneksi simultan yang dilayani HAProxy; ada di global, defaults, dan frontend.'],
        ['timeout connect / client / server', 'Tiga jam waktu berbeda: membuka koneksi ke backend, menerima request klien, dan menunggu response backend.'],
        ['Keep-alive &amp; connection reuse', 'Koneksi yang dipakai ulang alih-alih dibuka-tutup tiap request; diatur <code>option http-reuse safe|always</code>.'],
        ['Queue &amp; backlog', 'Antrean bila semua slot server penuh (<code>timeout queue</code>) dan antrean koneksi masuk di kernel (<code>backlog</code>).'],
        ['File descriptor / ulimit', 'Jendela file yang dibuka proses OS; tiap koneksi memakai ±2 FD sehingga limit harus di atas <code>maxconn</code>.'],
        ['p95 / p99', 'Persentil latensi: 95% (atau 99%) request selesai di bawah angka itu — gambaran pengguna terburuk, bukan rata-rata.'],
        ['Bottleneck', 'Komponen paling lambat yang menentukan kecepatan seluruh sistem; ditemukan lewat pengukuran, bukan tebakan.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan <code>wrk -t4 -c100 -d30s http://localhost:8080/</code> sebagai baseline, lalu <b>catat enam metrik</b>: req/s, latency avg, p95/p99, error, CPU HAProxy, dan CPU backend.</li><li>Ulangi benchmark dalam tiga kondisi — 1 backend, 2 backend, 3 backend — lalu isi tabel sebelum/sesudah seperti contoh di atas.</li><li>Simulasikan backend lambat (endpoint <code>/slow</code>) dan amati apa yang terjadi pada p99, kolom <code>Queued</code> di stats page, serta nilai <code>timeout server</code> yang kamu pilih.</li><li><b>Checkpoint:</b> mampu menjalankan benchmark terukur dan menjelaskan perubahan performa berdasarkan hasil eksperimen, bukan berdasarkan angka hasil salinan.</li></ol>'
    }
  ],
  recap: [
    'Throughput ditentukan lima tuas: <b><code>maxconn</code>, timeout per tahap, keep-alive/connection reuse, queue/backlog, dan limit file descriptor</b> — plus CPU/memori/jaringan.',
    'Benchmark memakai <code>wrk</code>/<code>ab</code>/<code>hey</code> dan selalu mencatat <b>req/s, p95/p99, error, CPU HAProxy &amp; backend, jumlah koneksi</b>, serta perbandingan 1 vs banyak backend.',
    'Eksperimen tuning mengubah <b>satu variabel tiap kali</b> dan mendokumentasikan hasil sebelum/sesudah dalam tabel yang bisa diulang.',
    '<b>Jangan menyalin angka tuning orang lain</b> — ukur di sistemmu, dan ingat lab tidak mewakili kondisi produksi.'
  ]
});
