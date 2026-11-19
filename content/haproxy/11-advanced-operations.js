/* ============================================================
   Pelajaran HAProxy — 11: Konfigurasi Lanjutan dan Operasional Harian
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'advanced-operations',
  title: 'Konfigurasi Lanjutan dan Operasional Harian',
  chapter: 'Operasional',
  duration: '16 menit',
  intro: [
    'Kalau pelajaran sebelumnya mengajarkan kamu mengemudi di jalan lurus, pelajaran ini menyetirnya ke persimpangan ramai: jalan bertanda, jalur khusus, dan rambu yang harus dibaca cepat. <b>Routing lanjutan, persistence, rate limiting, dan Runtime API</b> adalah persimpangan itu — semua mengubah ke mana request pergi dan siapa yang berhak lewat.',
    'Kamu akan memakai ACL dengan metode pencocokan (<code>-m beg</code>, <code>-m end</code>, <code>-m reg</code>), map file untuk routing ratusan host tanpa menumpuk konfigurasi, memahami kapan persistence diperlukan dan harganya terhadap distribusi, memasang rate limit berbasis stick-table, serta mengoperasikan HAProxy lewat Runtime API tanpa restart.',
    'Bagian terakhir menutup pelajaran ini dengan disiplin operasional: validasi konfigurasi sebelum reload, graceful reload, version control, rollback, dan change management — kebiasaan yang membedakan lab rapi dengan produksi yang tenang.'
  ],
  objectives: [
    'Menulis ACL lanjutan memakai <code>-m beg</code>/<code>-m end</code>/<code>-m reg</code>, fungsi <code>regsub()</code>, dan map file untuk routing multi-host',
    'Menjelaskan tiga mekanisme persistence (cookie, stick-table, source) beserta konsekuensinya terhadap distribusi load',
    'Memasang rate limiting berbasis stick-table dengan <code>track-sc</code> dan membedakannya dari rate limit di aplikasi',
    'Mengoperasikan HAProxy lewat Runtime API, memvalidasi konfigurasi, dan menjalankan graceful reload serta strategi deployment yang aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>ACL lanjutan, regex, dan map file</h3><p>ACL dasar sudah kamu pakai di pelajaran Routing. Di level lanjutan, kuncinya adalah <b>metode pencocokan</b> yang ditulis setelah fetch (<code>-m</code>):</p><table><thead><tr><th>Metode</th><th>Arti</th><th>Contoh pemakaian</th></tr></thead><tbody><tr><td><code>-m beg</code></td><td>Cocok di awal string (prefix)</td><td><code>path -m beg /api/</code></td></tr><tr><td><code>-m end</code></td><td>Cocok di akhir string (suffix)</td><td><code>hdr(host) -m end .lab.local</code></td></tr><tr><td><code>-m reg</code></td><td>Cocok dengan regular expression</td><td><code>path -m reg ^/v[0-9]+/</code></td></tr><tr><td><code>-m sub / dom / str</code></td><td>Substring, domain, dan string persis</td><td><code>hdr(user-agent) -m sub Mobile</code></td></tr></tbody></table><p>Untuk menyederhanakan pola panjang, HAProxy menyediakan kata kunci pendek <code>path_beg</code>, <code>path_end</code>, dan <code>hdr</code>. Untuk <b>transformasi</b> nilai (bukan sekadar pencocokan) ada sample fetch <code>regsub()</code>, misalnya <code>%[path,regsub(^/legacy/,/api/v1)]</code> yang mengganti prefix tanpa memicu redirect.</p><p>Bila daftar aturannya panjang (puluhan host), jangan menumpuk <code>use_backend</code> — pindahkan ke <b>map file</b>: satu baris <code>kunci nilai</code> per file yang bisa diedit tanpa menyentuh <code>haproxy.cfg</code>.</p>'
    },
    {
      type: 'example',
      title: 'ACL kompleks, regsub, dan map file',
      lang: 'cfg',
      output: false,
      code: `frontend fe_http
  bind :8080
  acl is_api   path -m beg /api/
  acl is_slug  path -m reg ^/[a-z]+-[0-9]{3,}/
  acl is_admin path_beg /admin/
  http-request set-header X-Normalized %[path,regsub(^/legacy/,/api/v1)]
  use_backend api_pool   if is_api
  use_backend api_pool   if is_slug
  use_backend admin_pool if is_admin
  default_backend web_pool

frontend fe_hosts
  bind :8081
  use_backend %[req.hdr(host),map_dom(/etc/haproxy/hosts.map)]
  default_backend web_pool

# isi /etc/haproxy/hosts.map (satu baris: kunci lalu nama backend)
# web.lab.local    web_pool
# api.lab.local    api_pool
# admin.lab.local  admin_pool`,
      explain: [
        '<code>path -m beg /api/</code> mencocokkan prefix, sedangkan <code>path -m reg ^/[a-z]+-[0-9]{3,}/</code> memakai regex untuk pola yang tidak bisa diwakili prefix — pola <code>{3,}</code> berarti tiga digit atau lebih.',
        '<code>path_beg /admin/</code> adalah bentuk pendek dari <code>path -m beg</code>; HAProxy mengevaluasi ACL secara berurutan dan <code>use_backend ... if</code> hanya aktif bila kondisinya terpenuhi.',
        '<code>http-request set-header X-Normalized %[path,regsub(...)]</code> menunjukkan regsub bekerja sebagai <b>converter</b>: mengubah nilai path lalu menaruhnya di header, bukan memilih backend.',
        'Baris <code>use_backend %[req.hdr(host),map_dom(...)]</code> membaca map file: kunci host dicocokkan dengan metode domain, hasilnya jadi nama backend. Bila tidak ada yang cocok, ekspresi kosong dan <code>default_backend</code> menangkapnya — inilah pengaman terakhir agar tidak ada request yang menggantung.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 290" width="760" role="img" aria-label="Tiga mekanisme persistence di HAProxy: cookie, stick-table, dan balance source yang membuat distribusi request ke web1 dan web2 menjadi timpang">
        <text x="20" y="30" class="u-title" text-anchor="start">Persistence menjaga sesi, tetapi membuat distribusi timpang</text>
        <rect x="20" y="70" width="130" height="50" rx="8" class="u-hd"/>
        <text x="85" y="101" class="u-lbl" text-anchor="middle">Client A</text>
        <rect x="20" y="150" width="130" height="50" rx="8" class="u-hd"/>
        <text x="85" y="181" class="u-lbl" text-anchor="middle">Client B</text>
        <line x1="156" y1="95" x2="194" y2="95" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="156" y1="175" x2="194" y2="175" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="200" y="50" width="250" height="180" rx="10" class="u-box"/>
        <text x="325" y="74" class="u-title" text-anchor="middle">HAProxy + persistence</text>
        <rect x="214" y="88" width="222" height="36" rx="6" class="u-hd"/>
        <text x="325" y="112" class="u-lbl" text-anchor="middle">cookie SRV insert (per sesi)</text>
        <rect x="214" y="132" width="222" height="36" rx="6" class="u-box"/>
        <text x="325" y="156" class="u-lbl" text-anchor="middle">stick-table src (per IP)</text>
        <rect x="214" y="176" width="222" height="36" rx="6" class="u-box"/>
        <text x="325" y="200" class="u-lbl" text-anchor="middle">balance source (hash IP)</text>
        <line x1="456" y1="95" x2="494" y2="95" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="456" y1="175" x2="494" y2="175" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="500" y="70" width="240" height="56" rx="8" class="u-hd"/>
        <text x="620" y="104" class="u-lbl" text-anchor="middle">web1 melayani 80% request</text>
        <rect x="500" y="155" width="240" height="56" rx="8" class="u-box"/>
        <text x="620" y="189" class="u-lbl" text-anchor="middle">web2 melayani 20% request</text>
        <text x="380" y="268" class="u-lbl" text-anchor="middle">Pantau kolom Session di stats page — distribusi yang timpang sering tak disadari</text>
      </svg></div><figcaption>Ketiga bentuk persistence mengunci klien ke backend tertentu: sesi aman, tetapi beban menjadi tidak merata dan harus dipantau.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Persistence: kapan perlu dan apa harganya</h3><p><b>Persistence (sticky session)</b> membuat klien yang sama selalu berakhir di backend yang sama. Tiga bentuk utama:</p><ul><li><b>Cookie-based</b> — di backend tulis <code>cookie SRV insert indirect nocache</code> dan tiap server diberi <code>cookie S1</code>. HAProxy menanam cookie ke browser klien; paling umum untuk aplikasi yang menyimpan sesi di memori satu proses.</li><li><b>Stick-table</b> — <code>stick-table type ip size 100k expire 30m</code> plus <code>stick on src</code> menyimpan keputusan per IP untuk waktu tertentu, tanpa perubahan apa pun di aplikasi atau cookie klien.</li><li><b>Source-based</b> — <code>balance source</code> meng-hash IP klien ke server. Paling sederhana, tetapi paling kasar bila banyak klien lewat NAT atau CGNAT dengan IP yang sama.</li></ul><p><b>Kapan diperlukan?</b> Hanya bila aplikasi benar-benar stateful (sesi di memori, keranjang belanja yang belum di-DB, upload besar yang belum selesai). Bila state sudah disimpan di database atau token, aplikasi <b>stateless</b> dan kamu bebas memakai roundrobin penuh.</p><p><b>Konsekuensinya</b>: distribusi jadi timpang (lihat gambar), server cepat kelebihan beban sementara yang lambat sepi, dan failover terasa oleh klien yang kehilangan stickynya. Selalu pantau kolom <b>Session</b> dan <b>Load</b> di stats page; bila selisihnya besar, pertimbangkan menurunkan kekuatan persistence.</p>'
    },
    {
      type: 'text',
      html: '<h3>Rate limiting di proxy vs di aplikasi</h3><p><b>Rate limiting</b> membatasi seberapa banyak request yang diizinkan dari satu sumber dalam periode tertentu. Di HAProxy, alat utamanya adalah <b>stick-table</b>: satu tabel di memori yang menyimpan pengukuran per IP, lalu dibaca lewat <code>track-sc</code> (track counter) dan dievaluasi oleh ACL.</p><table><thead><tr><th>Aspek</th><th>Di HAProxy (proxy)</th><th>Di aplikasi</th></tr></thead><tbody><tr><td><b>Yang dibatasi</b></td><td>Per IP/koneksi: <code>conn_rate</code>, <code>http_req_rate</code></td><td>Per user/token/API key, per kuota bisnis</td></tr><tr><td><b>Biaya</b></td><td>Sangat murah, request berhenti sebelum menyentuh backend</td><td>Butuh proses aplikasi &amp; sering kali query database</td></tr><tr><td><b>Kelemahan</b></td><td>IP di balik NAT dihitung sebagai satu; IP bisa berubah/berspoofing</td><td>Telat menangkap — beban sudah masuk lebih dulu</td></tr><tr><td><b>Peran</b></td><td>Pagar pertama: redam flood &amp; scanner</td><td>Otoritas akhir: kuota per pengguna dan aturan bisnis</td></tr></tbody></table><p>Praktik terbaik: pasang pagar di proxy (menolak dengan <code>429 Too Many Requests</code>), lalu tetap pasang kuota di aplikasi untuk keadilan antarpengguna.</p>'
    },
    {
      type: 'example',
      title: 'Rate limiting berbasis stick-table',
      lang: 'cfg',
      output: false,
      code: `frontend fe_http
  bind :8080
  stick-table type ip size 100k expire 10s store conn_rate(10s),http_req_rate(10s)
  tcp-request connection track-sc0 src
  acl flood  src_conn_rate(10s) gt 80
  acl hammer src_http_req_rate(10s) gt 300
  http-request deny status 429 if flood
  http-request deny status 429 if hammer
  default_backend web_pool`,
      explain: [
        '<code>stick-table type ip size 100k expire 10s store conn_rate(10s),http_req_rate(10s)</code> membuat tabel berisi 100 ribu entri IP yang kedaluwarsa tiap 10 detik, masing-masing menyimpan dua pengukuran: rata-rata koneksi dan rata-rata request pada jendela 10 detik.',
        '<code>tcp-request connection track-sc0 src</code> mengisi counter slot 0 (sc0) dengan alamat sumber begitu koneksi diterima — pengukuran terjadi di lapisan koneksi, jadi jauh lebih murah daripada menunggu request HTTP utuh.',
        '<code>src_conn_rate(10s) gt 80</code> dan <code>src_http_req_rate(10s) gt 300</code> adalah ACL yang membaca hasil pengukuran itu: pelanggar pertama membuka koneksi terlalu cepat, pelanggar kedua mengirim request terlalu rapat.',
        '<code>http-request deny status 429 if ...</code> menolak dengan kode 429 (Too Many Requests) sebelum request mencapai backend — inilah keunggulan rate limit di proxy: beban tidak pernah sampai ke aplikasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Protokol dan routing tingkat lanjut</h3><p>Di atas routing berbasis host/path, HAProxy modern mengurus protokol dan trafik non-HTTP. Ini ringkasannya:</p><table><thead><tr><th>Fitur</th><th>Cara kerja &amp; hal yang wajib diingat</th></tr></thead><tbody><tr><td><b>Multiple frontend/backend</b></td><td>Satu proses melayani banyak listener terpisah (<code>fe_http</code>, <code>fe_https</code>, <code>fe_sni</code>) yang berbagi pool backend yang sama.</td></tr><tr><td><b>TCP content inspection</b></td><td><code>mode tcp</code> + <code>tcp-request inspect-delay 5s</code> + <code>tcp-request content accept ...</code> agar HAProxy membaca isi stream (misalnya hello TLS) sebelum memilih backend.</td></tr><tr><td><b>SNI routing</b></td><td>Dengan <code>acl sni_api req.ssl_sni -m end api.lab.local</code>, satu port 443 dipecah ke pool berbeda tanpa membuka TLS (TLS passthrough).</td></tr><tr><td><b>HTTP/2</b></td><td>Aktifkan dengan <code>alpn h2,http/1.1</code> pada baris <code>bind ... ssl</code>; klien lama otomatis jatuh ke HTTP/1.1.</td></tr><tr><td><b>WebSocket</b></td><td>Setelah upgrade, trafik memakai koneksi tunnel — wajib <code>timeout tunnel 1h</code> supaya tidak diputus timeout HTTP biasa.</td></tr><tr><td><b>gRPC</b></td><td>Butuh HTTP/2 (<code>alpn h2</code>), tanpa buffering respons, dan <code>timeout tunnel</code> yang memadai; dukungan mengikuti versi HAProxy.</td></tr><tr><td><b>IPv4 / IPv6</b></td><td>Bind dua alamat (<code>bind :80</code> dan <code>bind :::80</code>) atau <code>v4v6</code> untuk melayani kedua tumpukan sekaligus.</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Runtime API, validasi konfigurasi, dan graceful reload',
      lang: 'bash',
      output: false,
      code: `# 1) WAJIB sebelum reload: validasi konfigurasi di dalam container
podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

# 2) perintah Runtime API lewat stats socket (level admin)
podman exec -i haproxy sh -c 'echo "show info" | socat stdio /var/run/haproxy.sock'
podman exec -i haproxy sh -c 'echo "show stat" | socat stdio /var/run/haproxy.sock'
podman exec -i haproxy sh -c 'echo "show servers state" | socat stdio /var/run/haproxy.sock'

# 3) drain dan kembalikan satu backend tanpa restart
podman exec -i haproxy sh -c 'echo "disable server web_pool/web2" | socat stdio /var/run/haproxy.sock'
podman exec -i haproxy sh -c 'echo "enable server web_pool/web2" | socat stdio /var/run/haproxy.sock'

# 4) graceful reload: proses lama menyelesaikan request lalu berhenti
podman kill -s HUP haproxy`,
      explain: [
        '<code>haproxy -c -f ...</code> memeriksa sintaks dan referensi (file cert, map, ACL) tanpa menjalankan apa pun — bila ada error, ia mencetak baris bermasalah dan proses reload tidak boleh dilanjutkan.',
        '<code>stats socket /var/run/haproxy.sock</code> dideklarasikan di <code>global</code>; perintah <code>show info</code>, <code>show stat</code>, dan <code>show servers state</code> membaca status proses, tabel statistik per backend/server, dan state mentah server yang berguna untuk debugging.',
        '<code>disable server web_pool/web2</code> mengeluarkan server dari rotasi secara <b>halus</b> (drain) — koneksi yang sedang berjalan tetap selesai, dan <code>enable server</code> mengembalikannya. Ini jauh lebih baik daripada mematikan container saat maintenance.',
        '<code>podman kill -s HUP haproxy</code> memicu graceful reload: proses baru membaca konfigurasi, lalu proses lama diminta berhenti setelah request yang sedang berjalan tuntas (soft-stop). Koneksi baru langsung dilayani proses baru tanpa jeda.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Strategi deployment konfigurasi</h3><p>Konfigurasi HAProxy adalah kode produksi; perlakukan seperti kode aplikasi:</p><table><thead><tr><th>Praktik</th><th>Pelaksanaan di lab maupun tim</th></tr></thead><tbody><tr><td><b>Version control</b></td><td>Semua <code>haproxy.cfg</code>, map file, dan compose berada di Git; setiap perubahan lewat commit + review.</td></tr><tr><td><b>Environment separation</b></td><td>Folder/branch terpisah untuk dev, staging, produksi — bedanya hanya nilai (maxconn, server, cert), bukan struktur.</td></tr><tr><td><b>Template config</b></td><td>Satu template + envsubst/render untuk menghasilkan konfigurasi per lingkungan tanpa duplikasi.</td></tr><tr><td><b>Secret management</b></td><td>Key dan password diberikan lewat file mount dengan permission ketat (mode 600), tidak pernah di-commit ke Git.</td></tr><tr><td><b>Rolling update</b></td><td>Ulangi per node satu per satu: validasi → reload → verifikasi stats → lanjut node berikutnya.</td></tr><tr><td><b>Rollback</b></td><td>Simpan versi sebelumnya (<code>git revert</code> atau file <code>.bak</code>) dan pastikan perintah rollback pernah diuji.</td></tr><tr><td><b>Backup</b></td><td>Cadangkan konfigurasi, map, dan sertifikat secara berkala ke lokasi di luar mesin produksi.</td></tr><tr><td><b>Change management</b></td><td>Catat siapa, kapan, apa yang berubah, dan mengapa; jadwalkan perubahan besar di luar jam sibuk.</td></tr></tbody></table>'
    },
    {
      type: 'warn',
      title: 'Kesalahan operasional yang paling sering terjadi',
      text: '<ul><li><b>Reload tanpa validasi</b> — satu typo membuat proses lama mati dan yang baru gagal start; selalu jalankan <code>haproxy -c -f</code> lebih dulu.</li><li><b>Rate limit memakan diri sendiri</b> — di balik NAT/CGNAT semua pengguna berbagi satu IP, sehingga batas 80 koneksi/detik bisa memblokir seluruh kantor.</li><li><b>Stats socket level admin tanpa batas</b> — siapa pun yang bisa menulis ke socket bisa mematikan server; jaga permission file dan jangan exposesocket ke jaringan.</li><li><b>Persistence permanen tanpa pemantauan</b> — satu klien besar bisa menarik seluruh trafik ke satu backend selama berjam-jam.</li><li><b>WebSocket/gRPC tanpa <code>timeout tunnel</code></b> — koneksi panjang terputus oleh timeout HTTP biasa dan muncul sebagai &quot;koneksi sering putus&quot; yang membingungkan.</li><li><b>Lupa <code>default_backend</code></b> — request yang tidak cocok ACL berakhir 503 karena tidak ada tujuan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Urutan kerja yang aman untuk setiap perubahan',
      text: '<p>Jadikan urutan ini kebiasaan: <b>(1)</b> ubah konfigurasi di branch Git, <b>(2)</b> jalankan <code>podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg</code>, <b>(3)</b> reload dengan <code>podman kill -s HUP haproxy</code>, <b>(4)</b> verifikasi lewat <code>show stat</code> dan satu <code>curl</code> nyata, <b>(5)</b> bila ada yang aneh, rollback ke commit sebelumnya lalu reload lagi. Lima langkah ini hanya butuh satu menit, dan menyingkirkan 90% insiden produksi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['ACL lanjutan', 'Access list dengan metode pencocokan eksplisit: <code>-m beg</code>, <code>-m end</code>, <code>-m reg</code>, <code>-m sub</code>, <code>-m dom</code>.'],
        ['Map file', 'File teks berisi pasangan kunci-nilai yang dibaca converter <code>map()</code>/<code>map_dom()</code> sehingga routing bisa diedit tanpa menyentuh konfigurasi utama.'],
        ['regsub()', 'Sample fetch converter yang mengganti bagian string memakai regex, misalnya mengubah prefix path lama ke path baru.'],
        ['Persistence', 'Mekanisme agar klien yang sama kembali ke backend yang sama (cookie, stick-table, atau hash source).'],
        ['Stick-table', 'Tabel di memori HAProxy yang menyimpan pengukuran per sumber (IP, header) dengan masa berlaku tertentu.'],
        ['track-sc', 'Perintah pengisian counter stick-table (sc0/sc1/sc2) yang kemudian dibaca ACL seperti <code>src_http_req_rate</code>.'],
        ['SNI routing', 'Pemilihan backend berdasarkan nama host pada handshake TLS, memungkinkan satu port 443 melayani banyak layanan tanpa membuka TLS.'],
        ['Runtime API', 'Antarmuka perintah lewat stats socket (<code>show info</code>, <code>show stat</code>, <code>disable server</code>) untuk mengoperasikan HAProxy tanpa restart.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis ACL yang mengarahkan <code>/api/</code>, host <code>api.lab.local</code>, dan path regex <code>^/v2/</code> ke <code>api_pool</code> dengan <code>default_backend</code> sebagai pengaman; uji dengan <code>curl -H &quot;Host: api.lab.local&quot;</code>.</li><li>Buat map file berisi tiga host lab dan pindahkan ketiga aturan <code>use_backend</code> ke sana; buktikan routing tetap sama sebelum dan sesudah.</li><li>Pasang rate limit 429 pada stick-table, lalu buktikan dengan <code>hey -n 500 -c 200</code> bahwa sebagian request ditolak sebelum menyentuh backend — catat juga dampaknya ke klien di NAT.</li><li><b>Checkpoint:</b> mampu menjalankan workflow perubahan konfigurasi yang aman dan dapat di-rollback: validasi <code>haproxy -c -f</code>, graceful reload, verifikasi Runtime API, lalu rollback bila perlu.</li></ol>'
    }
  ],
  recap: [
    'ACL lanjutan memakai <b><code>-m beg</code>/<code>-m end</code>/<code>-m reg</code></b>, converter <code>regsub()</code>, dan <b>map file</b> untuk routing massal dengan <code>default_backend</code> sebagai pengaman.',
    'Persistence (cookie, stick-table, source) hanya untuk aplikasi stateful; <b>harganya distribusi yang timpang</b> yang harus dipantau di stats page.',
    'Rate limit proxy memakai <b>stick-table + <code>track-sc</code> + ACL</b> untuk menolak dengan 429 sebelum beban mencapai aplikasi — pelengkap, bukan pengganti, kuota di aplikasi.',
    'Operasional harian: <b>validasi <code>haproxy -c -f</code> → graceful reload (HUP) → verifikasi Runtime API</b>, semuanya berada dalam alur version control, backup, dan rollback.'
  ]
});
