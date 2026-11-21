/* ============================================================
   Pelajaran Apache — 13: Performance & Caching
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'performance-caching',
  title: 'Performance: MPM, Kompresi, Cache & Optimasi',
  chapter: 'Caching & Performa',
  duration: '12 menit',
  intro: [
    'Website yang lambat bukan selalu karena servernya kecil. Sering kali ia lambat karena: response tidak pernah dikompresi, browser diminta mengunduh aset yang sama tiap kunjungan, atau MPM disetel untuk 20 koneksi padahal melayani ribuan. Kabar baiknya, ketiganya bisa diperbaiki tanpa menambah mesin.',
    'Pelajaran ini bekerja dari yang paling terukur: memilih &amp; menyetel MPM, menyalakan kompresi <code>mod_deflate</code>, mengatur cache browser via <code>mod_expires</code>, membaca <code>mod_status</code> untuk melihat tekanan nyata, lalu menyentuh topik lanjutan (keep-alive, caching server) — semuanya dengan bukti angka dari lab sebelum dan sesudah perubahan.'
  ],
  objectives: [
    'Memilih MPM yang sesuai beban dan menyetel parameter utamanya',
    'Mengaktifkan kompresi gzip untuk tipe konten yang tepat',
    'Mengatur <code>Cache-Control</code> lewat <code>mod_expires</code> mempercepat kunjungan ulang',
    'Membaca <code>/server-status</code> dan mengartikan worker, request, dan trafik',
    'Mengukur dampak perubahan dengan <code>curl -w</code> sebelum dan sesudah'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Urutan optimasi yang terukur</h3><p>Jangan mulai dari menebak-nebak. Urutan yang memberi dampak terbesar dengan usaha paling kecil:</p><ol><li><b>Ukur dulu</b> — waktu respons, ukuran transfer, status worker saat ini.</li><li><b>Kompresi</b> — hampir selalu menang 60–80% untuk teks, tanpa risiko.</li><li><b>Cache browser</b> — menghapus biaya kunjungan ulang untuk aset statis.</li><li><b>Keep-alive &amp; MPM</b> — menyesuaikan kapasitas koneksi dengan beban.</li><li><b>Baru yang berat</b> — caching server, CDN, optimasi aplikasi di belakang proxy.</li></ol><p>Semua langkah diukur ulang dengan cara yang sama: <code>curl -s -o /dev/null -w \'size=%{size_download} time=%{time_total}\\n\'</code>.</p>'
    },
    {
      type: 'example',
      title: 'Ukur sebelum dan sesudah',
      lang: 'bash',
      output: true,
      code: `# Kompresi: bandingkan ukuran transfer HTML
curl -s -o /dev/null -w 'tanpa-accept-encoding: %{size_download} bytes\\n' \\
  -H 'Accept-Encoding: identity' http://localhost:8080/
curl -s -o /dev/null -w 'dengan-gzip: %{size_download} bytes\\n' \\
  -H 'Accept-Encoding: gzip' http://localhost:8080/

# Header bukti kompresi aktif
curl -sI -H 'Accept-Encoding: gzip' http://localhost:8080/ | grep -i content-encoding
# Content-Encoding: gzip

# Cache: header untuk aset statis
curl -sI http://localhost:8080/assets/style.css | grep -i -E 'cache-control|expires'
# Cache-Control: max-age=2592000   (30 hari)`,
      explain: [
        'Angka <code>size_download</code> yang turun drastis pada baris kedua adalah bukti kompresi bekerja — jauh lebih meyakinkan daripada sekadar melihat header.',
        '<code>Content-Encoding</code> harus disertai <code>Vary: Accept-Encoding</code> (otomatis dari mod_deflate) supaya proxy di antara tidak menyimpan satu varian untuk semua klien.',
        'Ukur selalu dengan <code>Accept-Encoding</code> yang sama dengan yang dikirim browser, kalau tidak hasilnya menyesatkan.'
      ]
    },
    {
      type: 'example',
      title: 'Kompresi dengan mod_deflate',
      lang: 'apache',
      output: false,
      code: `# httpd.conf
LoadModule deflate_module modules/mod_deflate.so

AddOutputFilterByType DEFLATE text/html text/plain text/css
AddOutputFilterByType DEFLATE application/javascript application/json
AddOutputFilterByType DEFLATE application/xml image/svg+xml

# Jangan kompresi yang sudah terkompresi / berat dikompresi ulang:
# image/jpeg, image/png, video/*, application/zip, application/gzip

# Atau izinkan per mime type secara umum:
# AddOutputFilterByType DEFLATE text/* application/*`,
      explain: [
        'mod_deflate bekerja <b>saat mengirim</b>, sehingga file di disk tetap utuh — tidak ada langkah build tambahan.',
        'Kompresi tipe yang salah (jpg, zip) membuang CPU untuk nol byte penghematan; daftar hitam/putih di atas mencegahnya.',
        'Untuk file besar, kompresi membutuhkan memori tambahan per koneksi — pada MPM event dengan ribuan koneksi, pertimbangkan juga <code>DeflateCompressionLevel</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Cache browser dengan mod_expires',
      lang: 'apache',
      output: false,
      code: `# httpd.conf / vhost
LoadModule expires_module modules/mod_expires.so

ExpiresActive On
# Semua response mendapat Expires & Cache-Control
ExpiresByType text/css             "access plus 30 days"
ExpiresByType application/javascript "access plus 30 days"
ExpiresByType image/*              "access plus 6 months"
ExpiresByType text/html            "access plus 0 seconds"   # selalu cek

# Lab memakai pola per-Directory untuk /assets/*
#   <Directory ".../htdocs/assets">
#       ExpiresActive On
#       ExpiresByType text/css "access plus 30 days"
#   </Directory>`,
      explain: [
        '<code>access plus 30 days</code> dihitung dari waktu akses — Apache menulis <code>Expires</code> (tanggal absolut) dan <code>Cache-Control: max-age</code> (detik) sekaligus.',
        'HTML sebaiknya <code>max-age=0</code> atau sangat pendek: ia adalah peta yang menunjuk aset berversi. Yang lama berhari-hari adalah aset ber-hash nama filenya.',
        'Kunci keamanan praktik ini: nama file aset diberi versi/hash (<code>style.a1b2c3.css</code>) saat kamu memanggil ulang file — sehingga mengubah isi file selalu aman walau cache-nya lama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>MPM: menyetel kapasitas</h3><p>Parameter yang benar-benar menentukan batas keras Apache ada di MPM. Formula dasar: <b>MaxRequestWorkers = jumlah koneksi serentak yang mau kamu layani</b>, dan memori yang dibutuhkan ≈ jumlah proses × berat tiap proses.</p><table><thead><tr><th>Parameter (event/worker)</th><th>Peran</th></tr></thead><tbody><tr><td><code>StartServers</code></td><td>Jumlah proses anak saat start</td></tr><tr><td><code>ThreadsPerChild</code></td><td>Thread per proses anak — naikkan untuk koneksi keep-alive ringan</td></tr><tr><td><code>Min/MaxSpareThreads</code></td><td>Cadangan thread agar tidak bolak-balik membuat/membubarkan proses</td></tr><tr><td><code>MaxRequestWorkers</code></td><td>Total thread yang melayani request serentak — <b>angka paling penting</b></td></tr><tr><td><code>ServerLimit</code></td><td>Batas atas jumlah proses; harus ≥ StartServers dan mendukung MaxRequestWorkers</td></tr></tbody></table><p>Gejala salah setel: log berisi <code>AH00039: Timeout for pid</code>/permintaan menumpuk → <code>MaxRequestWorkers</code> terlalu kecil (minta ditolak/ditunda); memori membengkak → prefork dengan ribuan proses. Lab memakai bawaan <code>mpm_event</code> yang cocok untuk trafik umum.</p>'
    },
    {
      type: 'example',
      title: 'Membaca tekanan dari /server-status',
      lang: 'bash',
      output: true,
      code: `# Tampilan ringkas (cocok untuk dipantau berkala)
curl -s 'http://localhost:8080/server-status?auto'
# Total Accesses: 1284
# Total kBytes: 5120
# CPULoad: .046
# Uptime: 731
# ReqPerSec: 1.75650
# BytesPerSec: 7184.00
# BusyWorkers: 2
# IdleWorkers: 46
# Scoreboard: ____W_W________........

# Beban serentak: kirim 20 request paralel lalu lihat BusyWorkers naik
seq 20 | xargs -P 20 -I{} curl -s -o /dev/null http://localhost:8080/api/
curl -s 'http://localhost:8080/server-status?auto' | grep -E 'Busy|Idle'`,
      explain: [
        '<b>ReqPerSec</b> dan <b>BytesPerSec</b> adalah dua angka yang paling berguna untuk melihat tren beban tanpa alat tambahan.',
        '<b>BusyWorkers</b> mendekati total scoreboard = server saturasi; di situlah <code>MaxRequestWorkers</code> benar-benar diuji.',
        'Tampilan HTML <code>/server-status</code> memperbarui tiap detik — berguna saat mengamati perilaku real-time selama eksperimen.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Keep-alive: kecepatan vs kapasitas</h3><p>HTTP keep-alive membiarkan satu koneksi TCP melayani banyak request — sangat menguntungkan untuk halaman berisi puluhan file. Tapi koneksi yang diam tetap menghuni worker:</p><pre><code>KeepAlive On\nMaxKeepAliveRequests 100      # batas request per koneksi\nKeepAliveTimeout 5           # detik menunggu request berikutnya</code></pre><p>Petunjuk penyetelan: trafik ramai dengan klien cepat → timeout pendek (2–5 detik) agar worker segera bebas; trafik dengan browser lama/koneksi lambat → timeout sedikit lebih panjang. Kunci pengembaliannya ada di <b>IdleWorkers</b>: bila selalu 0 padahal beban tidak tinggi, koneksi idle menghabiskan worker — turunkan timeout.</p>'
    },
    {
      type: 'tip',
      title: 'Caching server: kapan masuk akal',
      text: '<p>Bila <code>/server-status</code> menunjukkan request berulang untuk konten yang sama (API baca, aset besar, halaman dokumentasi), pertimbangkan <code>mod_cache</code> dengan <code>CacheIgnoreNoLastMod</code> dsb — tapi berhati-hatilah: cache di level gateway harus memperhatikan <code>Vary</code>, cookie, dan status yang boleh di-cache. Alternatif yang lebih aman dan umum adalah menyimpan aset statis yang tidak berubah (font, gambar hasil build) di direktori terpisah dengan <code>Cache-Control: immutable</code>, dan membiarkan aplikasi di belakang yang mengatur cache API-nya.</p>'
    },
    {
      type: 'warn',
      title: 'Optimasi yang sering justru merugikan',
      text: '<p>(1) <b>Kompresi level maksimum</b> pada MPM penuh → CPU jenuh, latensi naik. (2) <b>KeepAliveTimeout panjang</b> di server ber-beban tinggi → worker terkunci koneksi idle. (3) <b>Cache-Control panjang</b> pada HTML tanpa versioning → pengunjung terjebak halaman lama. (4) <b>Menaikkan MaxRequestWorkers tanpa menambah RAM</b> → proses anak OOM-kill, server tiba-tiba mati. Selalu ukur lagi setelah perubahan — angka, bukan feeling.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['mod_deflate', 'Kompresi gzip response teks saat dikirim.'],
        ['mod_expires', 'Menulis Expires & Cache-Control otomatis berdasarkan tipe konten.'],
        ['Cache-Control: max-age', 'Berapa detik klien boleh memakai salinan tanpa meminta ulang.'],
        ['KeepAlive', 'Menggunakan satu koneksi TCP untuk banyak request.'],
        ['MaxRequestWorkers', 'Batas jumlah request yang dilayani serentak (dulunya MaxClients).'],
        ['Scoreboard', 'Papan status worker yang ditampilkan /server-status.'],
        ['ReqPerSec / BytesPerSec', 'Laju request dan byte dari /server-status?auto.'],
        ['immutable', 'Nilai Cache-Control: aset tidak akan berubah selama max-age — aman untuk file ber-hash.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Ukur ukuran transfer <code>/</code> dengan <code>Accept-Encoding: identity</code> vs <code>gzip</code>, hitung persentase penghematannya, lalu kompresi juga <code>/assets/style.css</code> — mana yang lebih besar penghematannya dan kenapa?</li><li>Perpanjang cache <code>/assets/style.css</code> ke 60 hari, buktikan perubahan header setelah <code>graceful</code>, lalu jelaskan mengapa halaman utama tidak boleh ikut diperpanjang.</li><li>Kirim 20 request paralel sambil membuka <code>?auto</code> — catat angka <code>BusyWorkers</code> puncakmu, lalu bandingkan dengan total worker. Apakah lab ini sudah jenuh?</li><li>Matikan <code>KeepAlive</code> (<code>KeepAlive Off</code>), uji waktu muat halaman dengan <code>curl</code> multi-file (atau browser devtools), dan bandingkan jumlah koneksi yang dibuka sebelum &amp; sesudah.</li></ol>'
    }
  ],
  recap: [
    'Urutan optimasi: ukur → kompresi (mod_deflate) → cache browser (mod_expires) → keep-alive/MPM → yang lebih berat.',
    '<code>AddOutputFilterByType DEFLATE</code> cukup untuk teks; jangan kompresi jpg/zip. <code>ExpiresByType</code> menulis Expires + Cache-Control; HTML tetap pendek, aset ber-hash boleh lama.',
    '<code>MaxRequestWorkers</code> adalah batas kapasitas utama; formula sederhananya = koneksi serentak × memori per proses.',
    'Baca tekanan nyata dari <code>/server-status?auto</code>: ReqPerSec, BytesPerSec, Busy vs Idle — semua perubahan diukur ulang dengan <code>curl -w</code>.'
  ]
});
