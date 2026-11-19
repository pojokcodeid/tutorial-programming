/* ============================================================
   Pelajaran HAProxy — 13: Capstone Arsitektur Multi-Service
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'capstone-multi-service',
  title: 'Capstone: Arsitektur HAProxy Multi-Service',
  chapter: 'Capstone',
  duration: '20 menit',
  intro: [
    'Selama dua belas pelajaran kamu belajar memasang satu demi satu bata: proxy, load balancing, health check, ACL, TLS, monitoring, HA, tuning, dan operasional. Capstone ini adalah momen kamu <b>berhenti merangkai bata dan mulai menandatangani gedung</b> — satu proyek utuh yang bisa kamu tunjukkan ke siapa pun.',
    'Skenarionya nyata: satu entry point (VIP) melayani <b>dua node HAProxy</b> yang mengarah ke tiga pool — <b>web</b> (2 backend, roundrobin), <b>api</b> (2 backend, leastconn), dan <b>admin</b> (1 backend) — lengkap dengan routing per hostname, HTTPS, redirect, stats terbatas, logging, test plan bernomor, dan dokumentasi.',
    'Pelajaran ini menyajikan arsitektur, requirement, konfigurasi inti, test plan, deliverables, rubrik &quot;mahir&quot;, serta rencana belajar 6 minggu. Anggap ini ujian akhir: semua perintahnya berasal dari pelajaran sebelumnya.'
  ],
  objectives: [
    'Menjelaskan arsitektur capstone: VIP/entry point → 2 HAProxy → pool web/api/admin beserta routing tiap hostname',
    'Menulis konfigurasi HAProxy inti: routing berbasis host, algoritma per pool, TLS termination, redirect, stats, dan logging',
    'Menjalankan test plan bernomor mulai dari traffic normal, kegagalan backend, pemulihan, kegagalan node, sampai reload dan rollback',
    'Menyusun deliverables proyek (Git, compose, konfigurasi, cert, diagram, README, benchmark, dokumentasi) lalu menilai diri dengan rubrik mahir'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Skenario dan requirement infrastruktur</h3><p>Kamu membangun simulasi arsitektur produksi kecil dengan sumber daya satu mesin. Semua komponen berjalan di <b>Podman</b>, dengan network yang dirancang sengaja (bukan default) agar peran tiap container jelas:</p><ul><li><b>Dua node HAProxy</b> — <code>haproxy1</code> dan <code>haproxy2</code> melayani konfigurasi identik; keduanya menempel pada entry point (VIP) sehingga kegagalan satu node tidak menghentikan layanan.</li><li><b>Pool web</b> — minimal 2 instance (<code>web1</code>, <code>web2</code>) sebagai halaman publik.</li><li><b>Pool api</b> — minimal 2 instance (<code>api1</code>, <code>api2</code>) sebagai layanan dengan durasi request bervariasi.</li><li><b>Pool admin</b> — 1 instance (<code>admin1</code>) yang boleh jadi tunggal, tetapi konsekuensinya harus kamu tulis (tanpa redundansi).</li><li><b>Network terpisah</b> — misalnya <code>capstone-lab</code> untuk frontend dan backend, atau satu network dengan penamaan container yang disiplin.</li></ul><p>Pada macOS, Podman berjalan di dalam VM, sehingga VIP/VRRP murni sulit disimulasikan — dokumentasikan pendekatan alternatifmu (misalnya entry point berupa port host yang dilayani kedua node secara bergantian) sebagai bagian dari jawaban capstone.</p>' +
        `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 370" width="760" role="img" aria-label="Arsitektur capstone: client menuju VIP lalu ke dua node HAProxy yang melayani tiga pool yaitu web dengan dua backend, api dengan dua backend, dan admin dengan satu backend">
        <text x="20" y="24" class="u-title" text-anchor="start">Capstone: VIP entry point menuju dua node HAProxy dan tiga pool</text>
        <rect x="270" y="40" width="220" height="40" rx="8" class="u-hd"/><text x="380" y="66" class="u-lbl" text-anchor="middle">Client / browser</text>
        <line x1="380" y1="84" x2="380" y2="104" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="270" y="110" width="220" height="36" rx="6" class="u-box"/><text x="380" y="134" class="u-lbl" text-anchor="middle">VIP / entry point :80 dan :443</text>
        <line x1="356" y1="150" x2="234" y2="174" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="404" y1="150" x2="526" y2="174" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="120" y="178" width="200" height="44" rx="8" class="u-hd"/><text x="220" y="206" class="u-lbl" text-anchor="middle">HAProxy Node 1</text>
        <rect x="440" y="178" width="200" height="44" rx="8" class="u-hd"/><text x="540" y="206" class="u-lbl" text-anchor="middle">HAProxy Node 2</text>
        <line x1="324" y1="200" x2="436" y2="200" class="u-line" marker-end="url(#u-arrow)"/><text x="380" y="192" class="u-lbl" text-anchor="middle">failover</text>
        <line x1="220" y1="226" x2="220" y2="250" class="u-line"/>
        <line x1="540" y1="226" x2="540" y2="250" class="u-line"/>
        <line x1="135" y1="252" x2="625" y2="252" class="u-line"/>
        <line x1="135" y1="256" x2="135" y2="274" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="256" x2="380" y2="274" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="625" y1="256" x2="625" y2="274" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="30" y="278" width="210" height="54" rx="8" class="u-box"/><text x="135" y="300" class="u-lbl" text-anchor="middle">pool web: roundrobin</text><text x="135" y="320" class="u-lbl" text-anchor="middle">web1 dan web2</text>
        <rect x="275" y="278" width="210" height="54" rx="8" class="u-box"/><text x="380" y="300" class="u-lbl" text-anchor="middle">pool api: leastconn</text><text x="380" y="320" class="u-lbl" text-anchor="middle">api1 dan api2</text>
        <rect x="520" y="278" width="210" height="54" rx="8" class="u-box"/><text x="625" y="300" class="u-lbl" text-anchor="middle">pool admin: 1 server</text><text x="625" y="320" class="u-lbl" text-anchor="middle">admin1</text>
        <text x="380" y="356" class="u-lbl" text-anchor="middle">Routing: web.lab.local, api.lab.local, admin.lab.local + default backend</text>
      </svg></div><figcaption>Satu entry point (VIP) melayani dua node HAProxy; masing-masing node mengarahkan trafik ke pool web (roundrobin), api (leastconn), dan admin (satu backend).</figcaption></figure>` +
        '<h3>Routing, load balancing, security, monitoring</h3><p><b>Routing</b> berbasis hostname, dengan default backend sebagai pengaman bila host tidak dikenal:</p><table><thead><tr><th>Request</th><th>Tujuan</th></tr></thead><tbody><tr><td><code>web.lab.local</code></td><td><code>web_pool</code> (roundrobin, 2 backend)</td></tr><tr><td><code>api.lab.local</code></td><td><code>api_pool</code> (leastconn, 2 backend)</td></tr><tr><td><code>admin.lab.local</code></td><td><code>admin_pool</code> (1 backend)</td></tr><tr><td><b>Host lain / path tak dikenal</b></td><td><code>default_backend web_pool</code></td></tr></tbody></table><p><b>Load balancing</b>: web memakai <code>roundrobin</code> karena request berdurasi seragam; api memakai <code>leastconn</code> karena durasi request bervariasi; weight pada tiap server harus bisa diubah (lewat konfigurasi atau Runtime API <code>set server</code>) untuk mengarahkan beban saat maintenance. Backend yang gagal health check <b>otomatis keluar</b> dari pool dan kembali saat pulih.</p><p><b>Security</b>: HTTPS dengan TLS termination (HAProxy membuka TLS lalu meneruskan sebagai HTTP), redirect 301 dari <code>:80</code> ke HTTPS, stats page dengan autentikasi, serta header standar (<code>X-Forwarded-For</code>, <code>X-Forwarded-Proto</code>) agar aplikasi tahu konteks aslinya.</p><p><b>Monitoring</b>: stats page, log per request (<code>option httplog</code>), status health tiap server, distribusi request antarbackend, dan kejadian failover — semuanya harus bisa kamu tunjukkan saat demo.</p>'
    },
    {
      type: 'example',
      title: 'Kerangka haproxy.cfg untuk capstone',
      lang: 'cfg',
      output: false,
      code: `global
  stats socket /var/run/haproxy.sock mode 600 level admin

defaults
  mode http
  timeout connect 5s
  timeout client 30s
  timeout server 30s
  option httplog
  option http-server-close

frontend fe_http
  bind :80
  http-request set-header X-Forwarded-Proto https if { ssl_fc }
  http-request redirect scheme https code 301 if !{ ssl_fc }

frontend fe_https
  bind :443 ssl crt /usr/local/etc/haproxy/certs/lab.pem alpn h2,http/1.1
  acl host_web   hdr(host) -m dom web.lab.local
  acl host_api   hdr(host) -m dom api.lab.local
  acl host_admin hdr(host) -m dom admin.lab.local
  use_backend web_pool   if host_web
  use_backend api_pool   if host_api
  use_backend admin_pool if host_admin
  default_backend web_pool

backend web_pool
  balance roundrobin
  option httpchk GET /healthz
  server web1 web1:80 check cookie w1
  server web2 web2:80 check cookie w2

backend api_pool
  balance leastconn
  option httpchk GET /healthz
  server api1 api1:8080 check
  server api2 api2:8080 check

backend admin_pool
  balance roundrobin
  server admin1 admin1:8080 check

listen stats
  bind :8404
  stats enable
  stats uri /stats
  stats auth lab:rahasia`,
      explain: [
        'Bagian <code>fe_http</code> hanya bertugas memaksa HTTPS: <code>http-request redirect scheme https code 301 if !{ ssl_fc }</code> mengembalikan 301 ke semua request yang belum datang lewat TLS, sehingga tidak ada trafik plaintext yang lolos.',
        '<code>fe_https</code> melakukan TLS termination: <code>bind :443 ssl crt ... alpn h2,http/1.1</code> membuka sertifikat lab sekaligus menawarkan HTTP/2 ke klien modern. Tiga ACL memakai <code>-m dom</code> (domain) agar <code>evillab.local</code> tidak ikut cocok seperti halnya pada <code>-m end</code>.',
        'Baris <code>use_backend ... if ...</code> menentukan pool tujuan per hostname, dan <code>default_backend web_pool</code> menangkap host yang tidak dikenal — tanpa baris ini, request asing akan berakhir 503.',
        'Tiap pool memakai algoritma sesuai karakter trafiknya (<code>roundrobin</code> untuk web, <code>leastconn</code> untuk api) plus <code>option httpchk GET /healthz</code> sehingga backend sakit otomatis keluar. <code>cookie w1</code>/<code>w2</code> disiapkan agar persistence bisa diaktifkan bila aplikasi ternyata stateful.',
        '<code>listen stats</code> dibatasi ke port 8404 dengan <code>stats auth lab:rahasia</code>; di produksi port ini wajib diblokir oleh firewall agar tidak terekspos ke internet.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan test plan: routing, TLS, failover, reload',
      lang: 'bash',
      output: false,
      code: `# 1) validasi konfigurasi SEBELUM reload — tidak ada langkah yang boleh melewati ini
podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg
# 2) uji routing per hostname lewat TLS (kita pakai -k karena cert lab self-signed)
curl -i -k --resolve web.lab.local:443:127.0.0.1 https://web.lab.local/
curl -i -k --resolve api.lab.local:443:127.0.0.1 https://api.lab.local/
curl -i -k --resolve admin.lab.local:443:127.0.0.1 https://admin.lab.local/
# 3) uji redirect HTTP -> HTTPS
curl -i http://web.lab.local/
# 4) uji kegagalan backend lalu pemulihannya
podman stop web2
for i in 1 2 3 4 5; do curl -s -k -o /dev/null -w "%{http_code} " https://web.lab.local/; done
podman start web2
# 5) uji kegagalan node HAProxy
podman stop haproxy1
curl -i -k https://web.lab.local/
podman start haproxy1
# 6) graceful reload dengan konfigurasi yang sudah diubah
podman kill -s HUP haproxy1`,
      explain: [
        '<code>haproxy -c -f</code> menjadi gerbang pertama test plan: bila konfigurasi tidak valid, seluruh pengujian berikutnya tidak akan mewakili apa pun dan reload harus dibatalkan.',
        '<code>curl --resolve</code> memetakan nama host lab ke 127.0.0.1 tanpa mengedit <code>/etc/hosts</code>, sehingga kamu benar-benar menguji ACL berbasis <code>Host</code> dan handshake TLS sekaligus; <code>-k</code> diperlukan karena sertifikat lab self-signed.',
        'Langkah 3 memastikan <code>fe_http</code> mengembalikan 301 ke HTTPS — bukti security requirement terpenuhi, bukan sekadar klaim di README.',
        'Langkah 4 dan 5 adalah inti resilience: berhentinya <code>web2</code> tidak boleh menghasilkan 503 (karena health check mengeluarkannya), dan berhentinya <code>haproxy1</code> tidak boleh memutus layanan selama entry point masih menjangkau <code>haproxy2</code>.',
        '<code>podman kill -s HUP</code> pada langkah 6 menguji graceful reload: koneksi lama tetap selesai, koneksi baru dilayani proses baru tanpa jeda terasa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Test plan bernomor dan deliverables</h3><p>Jalankan dan catat hasil untuk sembilan pengujian ini — nomor urutnya sengaja sama dengan daftar requirement agar mudah ditelusuri:</p><ol><li><b>Traffic normal</b> — ketiga hostname menjawab 200 dan distribusi request terlihat rata di stats page.</li><li><b>Kegagalan backend</b> — matikan <code>web2</code>; request tetap 200, statusnya DOWN di stats.</li><li><b>Pemulihan backend</b> — hidupkan <code>web2</code>; kembali UP setelah <code>rise</code> terpenuhi dan trafik mengalir lagi.</li><li><b>Kegagalan node HAProxy</b> — matikan satu node; layanan tetap berjalan lewat node lain.</li><li><b>Uji TLS</b> — handshake sukses, <code>-k</code> hanya untuk cert lab, dan cipher/ALPN sesuai konfigurasi.</li><li><b>Uji routing</b> — tiga host + host tak dikenal jatuh ke <code>default_backend</code>.</li><li><b>Load test</b> — <code>wrk -t4 -c100 -d30s</code> terhadap <code>https://web.lab.local</code>, hasilnya dicatat (req/s, p95/p99, error, CPU).</li><li><b>Reload konfigurasi</b> — ubah satu nilai, validasi, lalu HUP tanpa gangguan trafik.</li><li><b>Rollback</b> — kembalikan versi konfigurasi sebelumnya (Git) dan buktikan layanan normal kembali.</li></ol><p><b>Deliverables</b> yang dikumpulkan: repository Git, <code>compose.yaml</code>/script Podman, <code>haproxy.cfg</code>, konfigurasi backend, sertifikat lab, diagram arsitektur, README setup, test plan, hasil benchmark, dokumentasi failover, dan troubleshooting guide.</p>'
    },
    {
      type: 'example',
      title: 'Contoh pencatatan hasil test dan benchmark',
      lang: 'text',
      output: false,
      code: `CAPSTONE - HASIL PENGUJIAN (tanggal, nama penguji, versi image)
------------------------------------------------------------
no  pengujian              hasil     bukti
1   traffic normal         LULUS     curl 200 x3 host, stats: 5 server UP
2   kegagalan backend      LULUS     podman stop web2 -> 0 respons 503
3   pemulihan backend      LULUS     web2 UP kembali dalam 6 detik
4   kegagalan node         LULUS     haproxy1 mati -> trafik lewat haproxy2
5   uji TLS                LULUS     handshake ok, HTTP/2 (alpn h2) terpakai
6   uji routing            LULUS     host asing jatuh ke default_backend
7   load test wrk          LULUS     4.780 req/s, p95 44 ms, p99 81 ms, 0 error
8   reload konfigurasi     LULUS     HUP, 0 koneksi terputus
9   rollback               LULUS     git revert + HUP, layanan normal

CPU HAProxy (saat load test): 58%      CPU backend: 54% rata-rata per node`,
      explain: [
        'Setiap baris memuat nomor test plan, hasil, dan <b>bukti</b> berupa perintah atau angka — tanpa bukti, klaim &quot;LULUS&quot; hanya pendapat.',
        'Kolom bukti sifatnya spesifik: jumlah respons 503, lama pemulihan dalam detik, dan nama node yang dipakai — detail ini yang membuat pengujian bisa diulang orang lain.',
        'Hasil load test memakai metrik yang sama dengan pelajaran Performance (req/s, p95, p99, error) sehingga angka capstone sebanding dengan baseline-mu sebelumnya.',
        'Ringkasan CPU di baris terakhir membantu reviewer memastikan sistem tidak berjalan di ambang jenuh — bukti kapasitas, bukan sekadar keberhasilan fungsi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Rubrik indikator &quot;mahir&quot; dan rencana belajar 6 minggu</h3><p>Nilai dirimu terhadap sepuluh indikator berikut; dianggap <b>mahir</b> bila seluruhnya terpenuhi dengan bukti:</p><ol><li>Arsitektur sesuai spesifikasi: 2 node HAProxy, pool web/api/admin dengan jumlah backend benar, network terencana.</li><li>Ketiga hostname serta default backend teruji berfungsi.</li><li>Algoritma per pool benar (web roundrobin, api leastconn) dan weight dapat diubah.</li><li>Backend yang gagal health check keluar otomatis dan kembali saat pulih.</li><li>HTTPS, TLS termination, dan redirect HTTP→HTTPS semuanya berfungsi.</li><li>Stats page terautentikasi dan logging per request aktif.</li><li>Health status, distribusi request, dan kejadian failover terpantau jelas.</li><li>Sembilan test plan dijalankan lengkap dengan bukti tertulis.</li><li>Konfigurasi tervalidasi <code>haproxy -c -f</code>, reload dan rollback pernah diuji.</li><li>Deliverables lengkap dan konsisten (README, diagram, benchmark, dokumentasi failover, troubleshooting guide).</li></ol><table><thead><tr><th>Minggu</th><th>Materi</th><th>Praktik</th></tr></thead><tbody><tr><td>1</td><td>Networking, proxy, Podman</td><td>Menyiapkan lab dan reverse proxy</td></tr><tr><td>2</td><td>Konfigurasi HAProxy &amp; load balancing</td><td>Tiga backend + algoritma</td></tr><tr><td>3</td><td>Health check &amp; ACL</td><td>Failover backend dan routing</td></tr><tr><td>4</td><td>TLS &amp; monitoring</td><td>HTTPS, stats, logs</td></tr><tr><td>5</td><td>High availability &amp; performa</td><td>Dua proxy, benchmark, failover</td></tr><tr><td>6</td><td>Operasional lanjutan &amp; capstone</td><td>Arsitektur multi-service HA</td></tr></tbody></table><p>Jadwal ini fleksibel — bila networking masih terasa baru, alokasikan waktu ekstra di minggu pertama daripada menekan tahap capstone.</p>'
    },
    {
      type: 'warn',
      title: 'Perangkap yang paling sering menjatuhkan capstone',
      text: '<ul><li><b>Routing &quot;berhasil&quot; karena <code>/etc/hosts</code> diubah diam-diam</b> — pastikan kamu menguji ACL dengan <code>curl --resolve</code> agar ketergantungan itu tidak tersembunyi.</li><li><b>Stats page terbuka tanpa autentikasi</b> — di lab terlihat sepele, di produksi ini adalah pembuka akses penuh ke informasi internal.</li><li><b>Pool admin tanpa dokumentasi risiko</b> — satu backend berarti satu titik gagal; tulis konsekuensinya dan rencananya, jangan disembunyikan.</li><li><b>Test plan hanya dijalankan saat demo</b> — pengujian yang tidak tercatat tidak bisa diulang dan dengan cepat kehilangan kredibilitasnya.</li><li><b>Menyalin konfigurasi tanpa memahami</b> — penguji akan menanyakan kenapa api memakai leastconn dan web roundrobin; jawaban &quot;karena ada di contoh&quot; bukan jawaban mahir.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Bangun bertahap, uji tiap tahap',
      text: '<p>Kerjakan capstone dalam empat tahap yang selalu berakhir dengan bukti: <b>(1)</b> infra — network, backend, dua node, dan <code>podman ps</code> menunjukkan semuanya hidup; <b>(2)</b> routing &amp; load balancing — tiga host terjawab dan distribusi terlihat di stats; <b>(3)</b> security &amp; monitoring — redirect, TLS, stats auth, dan log aktif; <b>(4)</b> resilience &amp; dokumen — test plan, benchmark, failover, rollback, lalu tulis README-nya. Bila satu tahap gagal, jangan lanjut: perbaiki dulu, karena tahap berikutnya dibangun di atasnya.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['VIP / entry point', 'Satu alamat (IP virtual atau port host) yang menjadi pintu masuk tunggal bagi klien ke seluruh arsitektur.'],
        ['Pool backend', 'Kumpulan server yang melayani satu jenis trafik (web, api, admin) dengan algoritma dan health check sendiri.'],
        ['TLS termination', 'HAProxy membuka sertifikat TLS lalu meneruskan request ke backend sebagai HTTP — backend tidak perlu mengurus TLS.'],
        ['Roundrobin vs leastconn', 'Algoritma bergantian per koneksi vs memilih server dengan koneksi aktif paling sedikit; pilihan disesuaikan karakter trafik.'],
        ['Failover / failback', 'Perpindahan beban ke komponen cadangan saat kegagalan, dan pengembaliannya setelah komponen utama pulih.'],
        ['Graceful reload', 'Pergantian proses HAProxy yang membaca konfigurasi baru tanpa memutus koneksi yang sedang berjalan.'],
        ['Deliverables', 'Keluaran proyek yang dikumpulkan: kode, konfigurasi, diagram, README, test plan, benchmark, dan dokumentasi operasional.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li><b>Tahap 1 — Infrastruktur:</b> buat network lab, jalankan dua node HAProxy serta backend web (2), api (2), dan admin (1) memakai Podman, lalu buktikan semuanya hidup dengan <code>podman ps</code> dan <code>podman network inspect</code>.</li><li><b>Tahap 2 — Routing &amp; load balancing:</b> tulis <code>haproxy.cfg</code> lengkap (ACL host, tiga pool, algoritma masing-masing, default backend), validasi dengan <code>haproxy -c -f</code>, lalu uji ketiga hostname plus satu host asing.</li><li><b>Tahap 3 — Security &amp; monitoring:</b> tambahkan TLS termination, redirect HTTP→HTTPS, stats berautentikasi, dan logging; buktikan dengan <code>curl -i</code> bahwa redirect, HTTPS, dan penolakan stats tanpa password berfungsi.</li><li><b>Tahap 4:</b> jalankan seluruh test plan bernomor (termasuk kegagalan backend, kegagalan node, load test, reload, dan rollback), catat hasilnya dalam tabel seperti contoh, lalu susun deliverables (Git, README, diagram, benchmark, dokumentasi failover, troubleshooting guide). <b>Checkpoint:</b> mampu mendemokan arsitektur multi-service HAProxy secara utuh dengan bukti pengujian tertulis dan menjelaskan setiap keputusan desainnya.</li></ol>'
    }
  ],
  recap: [
    'Capstone menyatukan seluruh bab: <b>VIP entry point → 2 HAProxy → pool web (roundrobin), api (leastconn), admin (1 backend)</b> dengan routing per hostname dan default backend.',
    'Security dan monitoring bukan aksesori: <b>TLS termination, redirect HTTP→HTTPS, stats berautentikasi, logging</b>, serta pemantauan distribusi dan failover wajib ada.',
    'Kualitas dibuktikan lewat <b>test plan bernomor dengan bukti</b>: traffic normal, kegagalan backend, pemulihan, kegagalan node, TLS, routing, load test, reload, dan rollback.',
    'Keluaran proyek adalah <b>deliverables yang bisa direproduksi</b> (Git, compose, konfigurasi, cert, diagram, README, benchmark, dokumentasi) dinilai dengan rubrik sepuluh indikator mahir.'
  ]
});
