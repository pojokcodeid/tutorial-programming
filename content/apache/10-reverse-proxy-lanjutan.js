/* ============================================================
   Pelajaran Apache — 10: Reverse Proxy Lanjutan
   Timeout, Error & WebSocket
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'reverse-proxy-lanjutan',
  title: 'Reverse Proxy Lanjutan: Timeout, Error & WebSocket',
  chapter: 'Reverse Proxy',
  duration: '10 menit',
  intro: [
    'Saat backend mulai melambat atau gagal, kualitas gateway-mu diuji. Apache membalas dengan status yang <i>berbeda-beda tergantung di mana kegagalannya</i> — koneksi ditolak, nama host tidak bisa dicari, atau respons terlambat — dan tiap kasus meninggalkan kode error berbeda di log.',
    'Pelajaran ini membedah tiga hal yang paling sering dibutuhkan di lapangan: menyetel <b>timeout</b> per rute, membaca <b>status error proxy</b> (502/503/504/500) beserta lognya, dan meneruskan <b>WebSocket</b> yang butuh perlakuan khusus. Semuanya diuji langsung pada lab melalui route <code>/slow/</code> dan skrip <code>test-proxy.sh</code>.'
  ],
  objectives: [
    'Menyetel <code>Timeout</code>, <code>ProxyTimeout</code>, dan atribut <code>timeout</code>/<code>connectiontimeout</code> per ProxyPass',
    'Membedakan penyebab 502, 503, 504, dan 500 pada rute proxy serta menemukannya di error log',
    'Menguji sendiri skenario backend tak terjangkau vs backend yang tidak menjawab',
    'Meneruskan WebSocket lewat <code>mod_proxy_wstunnel</code> atau penyetelan header Upgrade',
    'Menyusun halaman error custom untuk status proxy'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga tingkat timeout</h3><table><thead><tr><th>Direktif</th><th>Konteks</th><th>Menjaga apa</th></tr></thead><tbody><tr><td><code>Timeout 60</code></td><td>server</td><td>Interaksi inti Apache (membaca request dll)</td></tr><tr><td><code>ProxyTimeout 15</code></td><td>server/vhost</td><td>Default menunggu respons backend untuk semua rute proxy</td></tr><tr><td><code>ProxyPass ... timeout=3 connectiontimeout=2</code></td><td>per rute</td><td>Rute tertentu saja — paling fleksibel</td></tr></tbody></table><p>Fungsinya terbagi dua: <code>connectiontimeout</code> membatasi waktu <b>membuka koneksi</b> (backend mati cepat terdeteksi), <code>timeout</code> membatasi waktu <b>menunggu respons</b> setelah koneksi terbuka. Di lab, <code>/slow/</code> memakai <code>connectiontimeout=2 timeout=3</code> agar kedua kegagalan terlihat jelas dalam hitungan detik.</p><pre><code>ProxyPass "/slow/" "http://backend-1:9090/" connectiontimeout=2 timeout=3\nProxyPass "/api/"  "balancer://app_backend/"   # timeout per member:\n                                             # connectiontimeout=2 timeout=15</code></pre>'
    },
    {
      type: 'example',
      title: 'Mereproduksi dua jenis kegagalan di lab',
      lang: 'bash',
      output: false,
      code: `# KASUS A — tidak ada yang mendengar di backend-1:9090 (koneksi ditolak)
curl -s -o /dev/null -w '%{http_code} %{time_total}s\\n' http://localhost:8080/slow/
# -> 503 dalam hitungan milidetik (connectiontimeout=2 tidak sempat habis,
#    karena penolakan terjadi seketika)

# KASUS B — ada yang menerima koneksi tapi tidak pernah menjawab
podman exec -d backend-1 sh -c 'sleep 60 | nc -l -p 9090'
sleep 1
curl -s -o /dev/null -w '%{http_code} %{time_total}s\\n' http://localhost:8080/slow/
# -> 502 setelah ±3 detik (timeout=3 habis menunggu baris status)

podman exec backend-1 sh -c 'pkill -f "nc -l -p 9090"'

# Jejak di error log:
podman logs apache-lab 2>&1 | tail -4`,
      explain: [
        'Waktu respons membedakan dua kasus: <b>cepat</b> = koneksi gagal dibuka, <b>lambat = timeout yang kamu setel</b> = koneksi terbuka tapi tidak ada jawaban.',
        'Jejak log untuk kasus A: <code>AH00957 attempt to connect ... failed</code> + <code>AH01114 failed to make connection to backend</code>. Kasus B: <code>AH01102 error reading status line from remote server</code>.',
        'Karena skrip uji memakai pengukuran status <b>dan</b> waktu, hasilnya tetap bermakna walau angka status persisnya berbeda antar versi Apache.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Peta status error proxy di Apache</h3><p>Angkanya memang tidak sepenuhnya sama dengan Nginx — itulah sebabnya menghafal tanpa log berisiko. Yang diandalkan: <b>kode + pesan log</b>.</p><table><thead><tr><th>Status</th><th>Arti</th><th>Jejak di error log (lab)</th></tr></thead><tbody><tr><td><code>500</code></td><td>Kegagalan sebelum koneksi, mis. DNS backend tidak terpecahkan</td><td><code>AH00898 DNS lookup failure for: backend-1</code></td></tr><tr><td><code>502</code></td><td>Terhubung tapi respons backend tidak valid / tidak selesai</td><td><code>AH01102 error reading status line</code>, <code>AH00898 Error reading from remote server</code></td></tr><tr><td><code>503</code></td><td>Koneksi ke backend tidak dapat dibuka / tidak ada worker tersedia</td><td><code>AH00957 attempt to connect ... failed</code>, <code>AH01114 failed to make connection</code></td></tr><tr><td><code>504</code></td><td>Timeout gateway (menunggu backend terlalu lama)</td><td>Baris timeout proxy pada log</td></tr></tbody></table><p>Yang penting bukan angkanya, melainkan <b>urutan diagnosisnya</b>: baca log → cek backend hidup → cek namanya bisa di-resolve → cek port &amp; konfigurasi → baru <code>httpd -t</code> dan reload.</p>'
    },
    {
      type: 'example',
      title: 'Failure handling: apa yang terjadi saat satu backend mati',
      lang: 'bash',
      output: false,
      code: `podman stop backend-1
for i in $(seq 1 8); do
  curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/
done
echo
# -> 500 200 200 200 200 200 200 200
#    ^^^ satu kegagalan pertama: nama DNS backend-1 hilang, lalu
#        balancer menyingkirkan member itu dari rotasi

podman start backend-1
podman exec apache-lab httpd -k graceful   # resolusi ulang & pulih normal`,
      explain: [
        'Apache balancer <b>tidak</b> mencoba member lain di dalam request yang sama (berbeda dengan <code>proxy_next_upstream</code> Nginx) — kegagalan pertama tetap terlihat klien.',
        'Setelah satu kegagalan, member ditandai error dan dilewati selama jendela <code>retry</code> (default 60 detik), sehingga request berikutnya dilayani member sehat.',
        'Karena nama backend di-resolve saat koneksi dibuat (bukan saat startup), <code>httpd -t</code> tetap <code>Syntax OK</code> walau semua backend mati — tapi setelah backend hidup lagi, <code>graceful</code> memastikan resolusi dan koneksi pool dibangun ulang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>WebSocket: proxy yang harus diizinkan meng-upgrade</h3><p>WebSocket diawali request HTTP biasa dengan <code>Upgrade: websocket</code> dan <code>Connection: Upgrade</code>. Banyak proxy membuang kedua header itu sehingga handshake gagal. Dua pendekatan di Apache:</p><pre><code># PENDAKATAN 1 — mod_proxy_wstunnel (sederhana, khusus WebSocket)\nLoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so\n\nProxyPass        "/ws/" "ws://app-ws:3000/ws/"\nProxyPassReverse "/ws/" "ws://app-ws:3000/ws/"\n\n# PENDAKATAN 2 — HTTP biasa dengan header Upgrade dilewatkan\nProxyPass "/ws/" "http://app-ws:3000/ws/"\nRequestHeader set Connection "upgrade"\nRequestHeader set Upgrade    "websocket"</code></pre><p>Beberapa catatan lapangan: skema <code>ws://</code>/<code>wss://</code> hanya dikenal mod_proxy_wstunnel; <b>komunikasi dua arah</b> berarti timeout pendek akan memutus koneksi diam-diam — beri timeout lebih panjang untuk rute WebSocket; dan beberapa fitur (<code>mod_proxy_http2</code>, kompresi) tidak relevan untuk koneksi ini.</p>'
    },
    {
      type: 'example',
      title: 'Halaman error custom untuk status proxy',
      lang: 'apache',
      output: false,
      code: `# Di dalam vhost yang memuat route proxy
ErrorDocument 502 /errors/gateway.html
ErrorDocument 503 /errors/maintenance.html
ErrorDocument 504 /errors/timeout.html

# Syarat: file harus ada dan tidak ikut ter-proxy!
# Letakkan di direktori khusus yang tidak di-ProxyPass.
# Sementara kegagalan, log detailnya tetap utuh di error log.`,
      explain: [
        'Kata kuncinya: halaman error <b>dilayani Apache</b>, bukan backend — karena itu lokasinya harus bisa diakses tanpa melewati ProxyPass yang sedang rusak.',
        'Pesan error generik ("502 Bad Gateway") tidak membantu user; halaman yang menjelaskan gangguan sementara jauh lebih baik, sementara penyebab teknisnya tetap dibaca dari log.'
      ]
    },
    {
      type: 'warn',
      title: 'Timeout terlalu panjang = antrean, terlalu pendek = 504 palsu',
      text: '<p><code>timeout=3</code> di <code>/slow/</code> adalah pilihan lab agar uji cepat. Di produksi, timeout harus <b>lebih besar dari p95 durasi respons backend</b> — mis. backend rata-rata 800ms dengan p95 2 detik, maka 5–10 detik masuk akal. Terlalu pendek membuat request lambat terputus padahal backend hampir selesai (membakar kapasitas dua kali); terlalu panjang membuat worker Apache menumpuk menunggu, sehingga satu backend yang hang bisa menjatuhkan seluruh gateway.</p>'
    },
    {
      type: 'tip',
      title: 'Uji kegagalan secara berkala, bukan hanya saat terjadi insiden',
      text: '<p>Skrip <code>test-proxy.sh</code> melakukan persis itu: menghentikan satu backend, memverifikasi trafik tetap mengalir, menyalakan listener yang tidak menjawab, memeriksa status + waktu, lalu memulihkan semuanya lewat <code>trap cleanup</code>. Jalankan rutin sebelum perubahan konfigurasi besar — jauh lebih murah daripada menemukan bahwa failover tidak bekerja tepat saat produksi padam.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['ProxyTimeout', 'Default durasi menunggu respons backend (konteks server/vhost).'],
        ['timeout= / connectiontimeout=', 'Atribut ProxyPass per rute: menunggu respons / membuka koneksi.'],
        ['AH01114', 'Kode log: gagal membuka koneksi ke backend (sering disertai 503).'],
        ['AH01102', 'Kode log: gagal membaca baris status dari backend (sering disertai 502).'],
        ['AH00898', 'Kode log: kegagalan berasal dari backend/ resolusi nama backend.'],
        ['mod_proxy_wstunnel', 'Modul khusus meneruskan skema ws:// dan wss://.'],
        ['Upgrade header', 'Header HTTP yang meminta perpindahan protokol (WebSocket).'],
        ['failover', 'Alihkan trafik ke backend sehat setelah satu member gagal.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan dua kasus di atas (tanpa listener vs listener diam) dan catat tiga hal untuk masing-masing: status code, waktu respons, dan kode <code>AH####</code> di error log. Jelaskan kenapa log lebih tahan versi daripada angka status.</li><li>Ubah <code>timeout=3</code> pada <code>/slow/</code> menjadi <code>timeout=10</code>, ulangi kasus B, dan pastikan waktu respons ikut berubah — bukti bahwa nilai itu memang terpakai.</li><li>Hentikan <code>backend-1</code>, amati pola 8 request (kapan gagal, kapan pulih), lalu hidupkan lagi dan jalankan <code>httpd -k graceful</code>. Bandingkan polanya dengan <code>proxy_next_upstream</code> Nginx.</li><li>(Eksplorasi) Pasang <code>mod_proxy_wstunnel</code> dan tulis rute <code>/ws/</code> ke backend yang menjawab — perhatikan pesan error bila backend-nya bukan server WebSocket.</li></ol>'
    }
  ],
  recap: [
    'Tiga tingkat timeout: <code>Timeout</code> (Apache), <code>ProxyTimeout</code> (default proxy), dan atribut per rute <code>connectiontimeout</code>/<code>timeout</code> pada <code>ProxyPass</code>.',
    'Status proxy Apache: 500 = DNS/resolusi gagal, 503 = koneksi tidak dapat dibuka, 502 = respons backend tidak valid/terputus, 504 = timeout — selalu verifikasi dengan kode <code>AH####</code> di error log.',
    'Balancer menyingkirkan member yang gagal dari rotasi, tapi <b>tidak</b> menggantikannya di dalam request yang sama — kegagalan pertama tetap terlihat klien.',
    'WebSocket butuh header <code>Upgrade</code>/<code>Connection</code> diteruskan (mod_proxy_wstunnel atau RequestHeader) dan timeout yang lebih longgar; halaman error proxy disajikan oleh Apache dari lokasi yang tidak ikut ter-proxy.'
  ]
});
