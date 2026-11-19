/* ============================================================
   Pelajaran HAProxy — 12: Troubleshooting dan Kesiapan Produksi
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'troubleshooting-production',
  title: 'Troubleshooting dan Kesiapan Produksi',
  chapter: 'Operasional',
  duration: '15 menit',
  intro: [
    'Pada duka sebuah sistem produksi, yang menentukan bukan siapa yang panik lebih dulu, tapi siapa yang punya <b>peta jalan</b>. Bayangkan petugas pemadam kebakaran: mereka tidak menebak-nebak dari asap, mereka mengikuti urutan cek — sumber api, jalur listrik, akses air — sehingga lima menit pertama tidak terbuang percuma.',
    'Pelajaran ini memberimu peta itu untuk HAProxy: alur diagnosis dari gejala ke akar masalah, penyebab paling umum dari <b>HAProxy tidak start, backend DOWN, 503, timeout, dan distribusi yang tidak merata</b>, plus production readiness checklist supaya masalah jarang terjadi sejak awal.',
    'Satu kebiasaan yang akan menyelamatkanmu berulang kali: <b>baca log dan buktikan dengan perintah sebelum mengubah konfigurasi</b>. Perubahan yang didasarkan tebakan menciptakan masalah baru yang jauh lebih sulit ditebak.'
  ],
  objectives: [
    'Mendiagnosis HAProxy yang tidak start memakai <code>podman logs</code> dan <code>haproxy -c -f</code> hingga menemukan penyebab pastinya',
    'Menelusuri backend DOWN, 503 Service Unavailable, dan request timeout ke titik salahnya: jaringan, health check, ACL, atau timeout',
    'Menjelaskan penyebab trafik tidak terbagi rata dan memeriksanya lewat algoritma, weight, persistence, serta perilaku klien',
    'Memeriksa kesiapan produksi terhadap checklist lengkap: timeout, health check, redundansi, TLS, logging, metrics, failover, backup, rollback, dan runbook'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Urutan diagnosis yang selalu berlaku</h3><p>Apapun gejalanya, urutan cek dari lapisan paling bawah ke paling atas ini hemat waktu karena memastikan fondasi dulu sebelum naik ke logika:</p><ol><li><b>Proses hidup?</b> — <code>podman ps -a</code> menunjukkan apakah container <code>Up</code> atau <code>Exited</code>, dan <code>podman logs</code> menyebut pesan kegagalannya.</li><li><b>Konfigurasi valid?</b> — <code>haproxy -c -f</code> memberi tahu baris bermasalah dalam hitungan detik.</li><li><b>Konektivitas?</b> — apakah HAProxy bisa mencapai backend (network, nama container, port)?</li><li><b>Backend sehat?</b> — status di stats page harus selaras dengan kenyataan di <code>/healthz</code>.</li><li><b>Routing benar?</b> — ACL dan <code>use_backend</code> menunjuk pool yang kamu bayangkan?</li><li><b>Timeout &amp; resource?</b> — bila kelima lapisan di atas bersih, barulah ini tersangka.</li></ol><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Aturan emas: satu perubahan, satu pengamatan.</b> Ubah hanya satu hal lalu uji ulang — jika kamu memperbaiki tiga hal sekaligus dan berhasil, kamu tidak tahu mana yang bekerja dan masalah yang sama akan datang lagi.</blockquote>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 530" width="760" role="img" aria-label="Alur troubleshooting HAProxy: dari request gagal memeriksa apakah HAProxy menerima request, apakah backend sehat, apakah routing benar, lalu menuju cek timeout log resource dan queue">
        <text x="20" y="24" class="u-title" text-anchor="start">Workflow troubleshooting: cek dari lapisan terbawah</text>
        <rect x="20" y="40" width="210" height="48" rx="8" class="u-hd"/>
        <text x="125" y="70" class="u-lbl" text-anchor="middle">Request gagal (503 / timeout)</text>
        <line x1="125" y1="92" x2="125" y2="118" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="138" y="112" class="u-lbl" text-anchor="start">mulai</text>
        <rect x="20" y="122" width="210" height="54" rx="8" class="u-box"/>
        <text x="125" y="154" class="u-lbl" text-anchor="middle">HAProxy menerima request?</text>
        <line x1="234" y1="149" x2="470" y2="149" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="330" y="141" class="u-lbl" text-anchor="middle">tidak</text>
        <rect x="476" y="124" width="264" height="50" rx="8" class="u-box"/>
        <text x="608" y="154" class="u-lbl" text-anchor="middle">Cek port, bind, network, podman logs</text>
        <line x1="125" y1="180" x2="125" y2="228" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="138" y="212" class="u-lbl" text-anchor="start">ya</text>
        <rect x="20" y="232" width="210" height="54" rx="8" class="u-box"/>
        <text x="125" y="264" class="u-lbl" text-anchor="middle">Backend healthy?</text>
        <line x1="234" y1="259" x2="470" y2="259" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="330" y="251" class="u-lbl" text-anchor="middle">tidak</text>
        <rect x="476" y="234" width="264" height="50" rx="8" class="u-box"/>
        <text x="608" y="264" class="u-lbl" text-anchor="middle">Cek nama container, port, health check, timeout</text>
        <line x1="125" y1="290" x2="125" y2="338" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="138" y="322" class="u-lbl" text-anchor="start">ya</text>
        <rect x="20" y="342" width="210" height="54" rx="8" class="u-box"/>
        <text x="125" y="374" class="u-lbl" text-anchor="middle">Routing (ACL/host) benar?</text>
        <line x1="234" y1="369" x2="470" y2="369" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="330" y="361" class="u-lbl" text-anchor="middle">tidak</text>
        <rect x="476" y="344" width="264" height="50" rx="8" class="u-box"/>
        <text x="608" y="374" class="u-lbl" text-anchor="middle">Cek ACL, use_backend, default_backend</text>
        <line x1="125" y1="400" x2="125" y2="444" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="138" y="430" class="u-lbl" text-anchor="start">ya</text>
        <rect x="20" y="448" width="210" height="48" rx="8" class="u-hd"/>
        <text x="125" y="478" class="u-lbl" text-anchor="middle">Cek timeout, log, resource, queue</text>
        <text x="470" y="512" class="u-lbl" text-anchor="middle">Setiap cabang kanan adalah perintah verifikasi, bukan dugaan</text>
      </svg></div><figcaption>Workflow troubleshooting: mulai dari apakah HAProxy menerima request, lalu kesehatan backend, kebenaran routing, dan terakhir timeout serta resource.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Diagnosis: HAProxy tidak mau start',
      lang: 'bash',
      output: false,
      code: `# 1) pesan kegagalan terakhir
podman logs haproxy --tail 50

# 2) validasi konfigurasi langsung di dalam container
podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

# 3) cek hal fisik: status, port, dan file yang dipakai
podman ps -a
podman port haproxy
ls -l haproxy/haproxy.cfg haproxy/certs/lab.pem
podman inspect haproxy --format '{{.Mounts}}'`,
      explain: [
        '<code>podman logs</code> adalah sumber kebenaran pertama: HAProxy mencetak <code>[ALERT]</code> beserta penyebabnya, misalnya <code>parsing ... : syntax error</code> atau <code>unable to bind</code> — baca baris terakhir, bukan yang pertama.',
        '<code>haproxy -c -f ...</code> mengulang pemeriksaan parser dan seluruh referensi (file sertifikat, map, userlist) tanpa menjalankan proses; pesannya menyebut nomor baris sehingga kamu langsung tahu ke mana harus membuka editor.',
        '<code>podman ps -a</code> membedakan container yang <code>Exited</code> (biasanya karena port sudah dipakai proses lain atau konfigurasi ditolak) dengan yang masih <code>Up</code> tetapi tidak melayani. <code>podman port</code> memastikan pemetaan <code>-p 8080:80</code> benar-benar terpasang.',
        '<code>ls -l</code> mengecek keberadaan <code>haproxy.cfg</code> dan <code>certs/lab.pem</code>; bila file cert hilang, HAProxy menolak bind SSL. <code>inspect --format {{.Mounts}}</code> membuktikan path mount di dalam container cocok dengan file di host — mount salah membuat proses memakai konfigurasi lama atau kosong.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca gejala lewat curl: 503, 429, dan timeout',
      lang: 'http',
      output: false,
      code: `curl -i http://localhost:8080/
curl -i -H "Host: api.lab.local" http://localhost:8080/
curl -i --max-time 5 http://localhost:8080/slow

--- contoh respons yang perlu kamu kenali ---

HTTP/1.1 503 Service Unavailable
Server: haproxy
Content-Type: text/html

HTTP/1.1 429 Too Many Requests
Server: haproxy

curl: (28) Operation timed out after 5001 milliseconds`,
      explain: [
        '<code>-i</code> menampilkan header sehingga kamu tahu siapa yang menjawab: <code>Server: haproxy</code> berarti jawaban datang dari proxy, bukan dari backend — kasus 503 yang paling umum adalah tidak ada server sehat di pool.',
        'Tambahan <code>-H &quot;Host: ...&quot;</code> menguji routing berbasis hostname; respons 503 pada host tertentu sementara host lain normal menunjuk masalah di ACL atau <code>use_backend</code>, bukan di backend.',
        '<code>--max-time 5</code> memaksa curl berhenti sehingga timeout terlihat eksplisit sebagai <code>curl: (28)</code>; tanpa itu request yang menggantung akan terlihat seperti &quot;lama sekali&quot; tanpa angka pasti.',
        'Kode 429 berarti rate limit yang kamu pasang di stick-table bekerja — membedakannya dari 503 mencegah kamu menyalahi backend untuk kesalahan yang sebenarnya berasal dari aturan sendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi sehat untuk mengatasi 503 dan timeout',
      lang: 'cfg',
      output: false,
      code: `defaults
  mode http
  timeout connect 5s
  timeout client 30s
  timeout server 60s
  timeout queue 10s

backend web_pool
  balance roundrobin
  option httpchk GET /healthz
  http-check expect status 200
  default-server inter 2s fall 3 rise 2
  server web1 web1:80 check maxconn 50
  server web2 web2:80 check maxconn 50`,
      explain: [
        '<code>timeout connect 5s</code>, <code>timeout client 30s</code>, dan <code>timeout server 60s</code> dipisah per tahap: connect yang gagal menandai jaringan/port mati, sedangkan server timeout menandai aplikasi lambat — menyetel ulang bagian yang tepat adalah inti penyembuhan.',
        '<code>option httpchk GET /healthz</code> dengan <code>http-check expect status 200</code> membuat health check menuntut jawaban spesifik; backend yang masih menerima request tetapi aplikasinya sakit akan dikeluarkan dari pool, sehingga 503 karena &quot;server UP tapi rusak&quot; tidak terjadi.',
        '<code>default-server inter 2s fall 3 rise 2</code> menetapkan ritme pemeriksaan: 2 detik sekali, dianggap sakit setelah 3 kali gagal, dan pulih setelah 2 kali berhasil — terlalu agresif membuat server sehat ikut terusir karena satu gangguan sesaat.',
        '<code>maxconn 50</code> per server membatasi beban per node dan memaksa antrean terlihat di <code>timeout queue</code> alih-alih membanjiri aplikasi; inilah yang membuat perbaikan dapat dipantau di stats page.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Lima gejala, penyebab, dan cek pertama</h3><table><thead><tr><th>Gejala</th><th>Penyebab paling sering</th><th>Cek pertama</th></tr></thead><tbody><tr><td><b>HAProxy tidak start</b></td><td>Syntax error, port sudah dipakai, file cert tidak ditemukan, permission, mount salah, atau directive yang tidak tersedia di versi itu</td><td><code>podman logs haproxy</code> lalu <code>haproxy -c -f</code></td></tr><tr><td><b>Backend DOWN</b></td><td>Nama/DNS container salah, beda network, port backend salah, health check URI/status tidak cocok, timeout terlalu pendek, firewall</td><td><code>podman network inspect</code> + <code>curl</code> langsung ke backend dari dalam container HAProxy</td></tr><tr><td><b>503 Service Unavailable</b></td><td>Semua backend tidak sehat, ACL mengarah ke backend kosong, health check gagal, antrean/maxconn penuh</td><td>Stats page (status server) lalu log request di <code>option httplog</code></td></tr><tr><td><b>Request timeout</b></td><td><code>timeout connect/client/server</code> terlalu pendek, backend lambat, resource (CPU/memori) habis</td><td><code>curl --max-time</code> ke backend + pantau CPU backend</td></tr><tr><td><b>Trafik tidak merata</b></td><td>Algoritma kurang tepat, weight tidak seimbang, persistence aktif, jumlah koneksi tidak sama, request durasinya beda jauh, klien memakai keep-alive</td><td>Stats page: kolom <code>Status</code>, <code>Load</code>, <code>Session</code> per server</td></tr></tbody></table><p>Catatan penting soal distribusi: roundrobin menghitung <b>koneksi</b>, bukan request. Klien yang membuka satu koneksi keep-alive lalu mengirim seribu request hanya dihitung sekali — jadi &quot;timpang&quot; sering kali bukan bug, melainkan konsekuensi perilaku klien.</p>'
    },
    {
      type: 'text',
      html: '<h3>Production readiness checklist</h3><p>Centang tiap butir sebelum menyebut sistemmu siap produksi. Bila satu butir gagal, itu bukan keterbatasan — itu pekerjaan berikutnya.</p><ul><li><b>Konfigurasi &amp; trafik</b> — konfigurasi tervalidasi (<code>haproxy -c -f</code>), timeout sesuai workload, health check mewakili kesiapan aplikasi, connection &amp; resource limit ditinjau, graceful reload sudah diuji.</li><li><b>Redundansi</b> — minimal dua instance backend per pool kritis, HAProxy redundancy (dua node), failover dan failback diuji, backup konfigurasi tersedia, rollback teruji.</li><li><b>Keamanan</b> — TLS certificate valid dan masa berlaku dipantau, private key aman (permission ketat, tidak di Git), stats endpoint dibatasi (autentikasi + IP), redirect HTTP→HTTPS aktif.</li><li><b>Observabilitas</b> — logging terintegrasi ke sistem log pusat, metrics dan alerting terpasang (latensi, error, status server), rotasi log jelas.</li><li><b>Dokumentasi</b> — dokumentasi arsitektur, runbook troubleshooting (langkah per gejala), catatan perubahan (change management), dan prosedur rollback tertulis.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum saat troubleshooting',
      text: '<ul><li><b>Langsung restart tanpa membaca log</b> — masalah hilang sementara, penyebabnya raib, dan ia akan kembali tepat saat kamu sedang tidur.</li><li><b>Menambah <code>maxconn</code> untuk mengatasi 503</b> — kalau backend sakit, antrean hanya bertambah panjang dan tetap berakhir 503; perbaiki kesehatan backend lebih dulu.</li><li><b>Menganggap stats page hijau berarti sehat</b> — health check yang hanya mengecek port bukan jaminan aplikasi berfungsi; endpoint health harus mewakili kesiapan nyata.</li><li><b>Mengubah banyak hal sekaligus</b> — kamu tidak akan pernah tahu perubahan mana yang menolong, dan rollback menjadi mustahil.</li><li><b>Lupa beda lab dan produksi</b> — TLS, jumlah klien, dan durasi request di produksi berbeda jauh; parameter lab bukan angka final.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Siapkan runbook sebelum insiden, bukan sesudahnya',
      text: '<p>Tulis runbook setingkat halaman untuk lima gejala di atas: perintah persis, apa yang diharapkan, dan tindakan bila hasilnya berbeda. Simpan juga contoh output normal (<code>show info</code>, stats page, log satu baris) sebagai pembanding. Saat insiden datang, kamu tinggal mengikuti daftar — adrenalin tidak lagi mengambil alih penalaranmu. Uji runbook dengan sengaja mematikan satu backend dan ikuti langkahnya sampai selesai.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['503 Service Unavailable', 'Respons HAProxy ketika tidak ada server sehat yang bisa melayani request — bukan error aplikasi langsung.'],
        ['timeout connect/client/server', 'Tiga batas waktu berbeda yang masing-masing menunjukkan titik salah bila request gagal pada tahapnya.'],
        ['Health check', 'Pemeriksaan berkala (TCP/HTTP) yang menentukan server masuk atau keluar pool; harus mewakili kesiapan aplikasi.'],
        ['Drain', 'Mengeluarkan server dari rotasi secara halus dengan <code>disable server</code> sehingga koneksi berjalan tetap tuntas.'],
        ['Graceful reload', 'Membaca konfigurasi baru tanpa memutus koneksi lama: proses baru hidup, proses lama menyelesaikan tugasnya (soft-stop).'],
        ['Bottleneck', 'Komponen paling lambat (backend, jaringan, atau HAProxy sendiri) yang membatasi seluruh sistem.'],
        ['Runbook', 'Dokumen langkah-demi-langkah untuk suatu gejala insiden, ditulis sebelum insiden terjadi.'],
        ['Production readiness checklist', 'Daftar verifikasi kesiapan produksi: konfigurasi, redundansi, keamanan, observabilitas, dan dokumentasi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Sengaja buat HAProxy gagal start dengan satu typo di <code>haproxy.cfg</code>, lalu <b>temukan barisnya</b> hanya memakai <code>podman logs</code> dan <code>haproxy -c -f</code> sebelum memperbaikinya.</li><li>Matikan dua backend sekaligus dan amati jalannya stats page, log, serta respons <code>curl -i</code> — catat urutan peristiwa hingga muncul 503, lalu hidupkan kembali dan dokumentasikan pemulihannya.</li><li>Perpanjang <code>timeout server</code> pada backend yang sengaja dibuat lambat dan bandingkan hasilnya dengan sebelumnya; jelaskan kenapa menaikkan <code>maxconn</code> bukan solusi.</li><li><b>Checkpoint:</b> mampu menelusuri lima gejala umum (tidak start, backend DOWN, 503, timeout, distribusi timpang) mengikuti workflow dan menyebut cek pertama yang tepat untuk masing-masing.</li></ol>'
    }
  ],
  recap: [
    'Diagnosis selalu berurutan dari bawah ke atas: <b>proses → validasi <code>haproxy -c -f</code> → konektivitas → kesehatan backend → routing → timeout/resource</b>.',
    'Lima gejala utama punya cek pertama yang khas: <b>log untuk tidak start, network/port/health check untuk backend DOWN, stats+log untuk 503, <code>curl --max-time</code> untuk timeout, kolom Session/Load untuk distribusi timpang</b>.',
    'Health check harus mewakili kesiapan aplikasi, dan <b>antrean/maxconn bukan obat 503</b> selama backend masih sakit.',
    'Kesiapan produksi adalah checklist yang dicek berkala: <b>timeout, health check, redundansi, TLS, stats terbatas, logging, metrics, failover, backup, rollback, dokumentasi, runbook</b>.'
  ]
});
