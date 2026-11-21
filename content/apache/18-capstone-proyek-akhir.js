/* ============================================================
   Pelajaran Apache — 18: Capstone / Proyek Akhir
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'capstone-proyek-akhir',
  title: 'Proyek Akhir: Arsitektur Apache Production-like',
  chapter: 'Proyek Akhir',
  duration: '15 menit',
  intro: [
    'Seluruh bab ini berujung ke satu kemampuan: <b>merancang dan membuktikan</b> arsitektur Apache yang lengkap — website statis, banyak domain, HTTPS, reverse proxy, tiga backend dengan failover, keamanan, dan monitoring — dalam satu instalasi yang benar-benar berjalan.',
    'Proyek akhir ini memakai lab yang sudah kamu pakai sepanjang bab sebagai fondasi, lalu menambahkan lapisan yang belum ada: halaman admin dengan Basic Auth, pengukuran performa, dan audit penuh memakai checklist. Di akhir, kamu akan menyelesaikan peta 12 simulasi Podman dari roadmap — dari container tunggal sampai arsitektur produksi — sebagai bukti seluruh kompetensi Level 0–12.'
  ],
  objectives: [
    'Menyusun arsitektur production-like Apache dari kebutuhan, bukan menyalin konfigurasi',
    'Melengkapi lab dengan lapisan admin (Basic Auth) dan membuktikannya',
    'Menjalankan uji performa sederhana dan membaca hasilnya',
    'Menjalankan audit akhir memakai checklist kompetensi (Beginner → Expert)',
    'Memetakan 12 simulasi Podman roadmap ke bukti yang sudah kamu hasilkan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Arsitektur target</h3><pre><code>                         Klien / Internet\n                                |\n                                v\n                    Apache HTTP Server :8080 / :8443\n                    (vhost, TLS, rewrite, hardening)\n                                |\n              +-----------------+------------------+\n              |                                    |\n              v                                    v\n        Website statis                      API Gateway\n     (DocumentRoot, Alias,                 (ProxyPass + balancer)\n      cache, fallback SPA)                         |\n              |                 +-----------------+-----------------+\n              |                 |                 |                 |\n              v                 v                 v                 v\n          browser          backend-1          backend-2        backend-3\n                           (nginx:alpine)     (nginx:alpine)    (nginx:alpine)\n\n   :8081  --> redirect permanen ke HTTPS :8443\n   /server-status --> mod_status (dibatasi Require ip)</code></pre><p>Semua komponen ini <b>sudah ada</b> di <code>examples/apache-lab/</code>. Tugas proyek bukan membangun dari nol, melainkan: memahami tiap lapisan, melengkapi yang kurang, dan membuktikan seluruhnya dengan pengujian — persis cara kerja tim operasional sungguhan yang mewarisi sistem orang lain.</p>'
    },
    {
      type: 'example',
      title: 'Fase 1 — Fondasi &amp; verifikasi',
      lang: 'bash',
      output: false,
      code: `cd examples/apache-lab
bash scripts/gen-certs.sh          # sekali saja
podman compose up -d

# Verifikasi fondasi (semua harus lolos)
podman exec apache-lab httpd -t                 # Syntax OK
podman exec apache-lab httpd -S                 # vhost & default vhost
podman exec apache-lab httpd -M | wc -l         # daftar modul aktif
bash scripts/test-routing.sh                    # PASS=35 FAIL=0
bash scripts/test-proxy.sh                      # PASS=25 FAIL=0`,
      explain: [
        'Fase ini melatih kebiasaan paling penting: <b>bukti dulu, lalu lanjut</b>. Bila dasarnya belum lulus, perbaiki sebelum menambah lapisan — debug bertumpuk adalah pembunuh waktu nomor satu.',
        '<code>httpd -S</code> adalah peta arsitekturmu yang sebenarnya — cocokkan dengan diagram di atas, jangan dengan asumsimu.'
      ]
    },
    {
      type: 'example',
      title: 'Fase 2 — Lapisan baru: admin dengan Basic Auth',
      lang: 'apache',
      output: false,
      code: `# apache/extra/app.conf — di dalam vhost app.local (port 8080 & 8443)
Alias "/admin/" "/usr/local/apache2/htdocs/admin/"

<Directory "/usr/local/apache2/htdocs/admin">
    Options -Indexes
    AllowOverride None
    AuthType Basic
    AuthName "Admin Area"
    AuthUserFile "/usr/local/apache2/conf/.htpasswd"
    Require valid-user
</Directory>

# Buat pengguna & uji:
#   podman exec apache-lab /usr/local/apache2/bin/htpasswd -cB \\
#     /usr/local/apache2/conf/.htpasswd admin
#   curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/admin/   -> 401
#   curl -s -u admin:PASSWORD http://localhost:8080/admin/                   -> 200`,
      explain: [
        'Tiga syarat yang sering terlupa: modul auth sudah dimuat (bawaan image), <code>Options -Indexes</code>, dan file <code>.htpasswd</code> berada <b>di luar</b> DocumentRoot.',
        '401 (belum autentikasi) vs 403 (otentikasi ada tapi ditolak) — keduanya harus kamu buktikan untuk memahami perbedaannya.',
        'Di produksi, halaman admin ini hanya boleh dijangkau lewat HTTPS; pertimbangkan membatasinya juga dengan <code>Require ip</code> jaringan internal.'
      ]
    },
    {
      type: 'example',
      title: 'Fase 3 — Uji performa sederhana',
      lang: 'bash',
      output: false,
      code: `# Beban paralel ringan ke rute statis dan proxy (100 request, 10 serentak)
seq 100 | xargs -P 10 -I{} curl -s -o /dev/null -w '%{http_code}\\n' \\
  http://localhost:8080/ > /tmp/hasil-statis.txt
sort /tmp/hasil-statis.txt | uniq -c          # harus hampir semuanya 200

seq 100 | xargs -P 10 -I{} curl -s -o /dev/null -w '%{http_code}\\n' \\
  http://localhost:8080/api/ > /tmp/hasil-api.txt
sort /tmp/hasil-api.txt | uniq -c

# Selama beban berjalan, pantau:
curl -s 'http://localhost:8080/server-status?auto' | grep -E 'ReqPerSec|BusyWorkers|IdleWorkers'`,
      explain: [
        'Dua tujuan sekaligus: memastikan tidak ada error 5xx di bawah tekanan, dan melihat apakah <b>BusyWorkers</b> mendekati batas — tanda MPM perlu disetel (Pelajaran 13).',
        'Angka <code>ReqPerSec</code> selama beban adalah baseline-performamu: ukur lagi setiap perubahan MPM/kompresi/cache dan bandingkan.',
        'Untuk beban yang lebih nyata (distribusi latensi, pik), gunakan alat khusus seperti <code>hey</code> atau <code>ab</code> — pola pengukurannya tetap sama.'
      ]
    },
    {
      type: 'example',
      title: 'Fase 4 — Uji kegagalan &amp; pemulihan',
      lang: 'bash',
      output: false,
      code: `# Satu backend mati -> layanan tetap
podman stop backend-1
for i in $(seq 1 8); do curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/; done
# (mungkin ada 1 kegagalan pertama, sisanya 200 — lihat Pelajaran 15)

# Semua backend mati -> 5xx hanya di rute proxy, statis tetap 200
podman stop backend-2 backend-3
curl -s -o /dev/null -w 'proxy=%{http_code}\\n' http://localhost:8080/api/
curl -s -o /dev/null -w 'statis=%{http_code}\\n' http://localhost:8080/

# Pulihkan & kembalikan ke keadaan normal
podman start backend-1 backend-2 backend-3
podman exec apache-lab httpd -k graceful
bash scripts/test-proxy.sh`,
      explain: [
        'Pola "rute proxy gagal, statis tetap jalan" adalah inti pemahamanmu bahwa Apache dan backend adalah dua lapisan gagal yang terpisah.',
        'Setelah pemulihan, jalankan ulang skrip uji — <b>ini</b> yang membedakan "kelihatannya sudah pulih" dengan "terbukti pulih".'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checklist kompetensi akhir</h3><p>Cocokkan buktimu dengan checklist roadmap — centang hanya yang <b>pernah kamu buktikan sendiri</b>:</p><table><thead><tr><th>Tingkat</th><th>Indikator (bukti)</th></tr></thead><tbody><tr><td><b>Beginner</b></td><td>HTTP/HTTPS dipahami (Pelajaran 01), container berjalan + port/DocumentRoot diubah (03), <code>httpd -t</code> lancar</td></tr><tr><td><b>Intermediate</b></td><td>3 vhost lewat <code>curl -H Host</code> (05), modul dimatikan/diaktifkan terbukti (06), rewrite internal + fallback SPA (08), HTTPS + redirect (11), proxy + header terbaca di backend (09)</td></tr><tr><td><b>Advanced</b></td><td>Balancer 3 backend + failover (15), MPM &amp; kompresi/cache terukur (13), hardening lolos uji negatif (12), log/error code dipakai diagnosis (14)</td></tr><tr><td><b>Expert</b></td><td>Arsitektur dirancang &amp; didokumentasikan (17), uji performa &amp; audit keamanan dijalankan (proyek ini), WAF &amp; ekspresi dipahami (16)</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Peta 12 simulasi Podman → buktimu</h3><p>Roadmap memuat 12 simulasi bertahap; semuanya sudah tercakup oleh lab bab ini. Gunakan tabel ini sebagai audit akhir:</p><table><thead><tr><th>#</th><th>Simulasi</th><th>Bukti di lab</th></tr></thead><tbody><tr><td>1</td><td>Apache container</td><td><code>podman run httpd:2.4</code> + <code>curl</code> (Pelajaran 02)</td></tr><tr><td>2</td><td>Custom HTML / DocumentRoot</td><td><code>web/</code> di-mount ke htdocs; isi diubah langsung (03, 07)</td></tr><tr><td>3</td><td>Multiple virtual hosts</td><td><code>app.local</code>, <code>api.local</code>, <code>docs.local</code> (05)</td></tr><tr><td>4</td><td>Custom hostname / DNS</td><td><code>curl -H Host</code> + simulasi <code>/etc/hosts</code> (05)</td></tr><tr><td>5</td><td>URL rewrite</td><td>Fallback SPA <code>/halaman/tentang</code> (08)</td></tr><tr><td>6</td><td>Apache + backend</td><td><code>/api/</code>, <code>/app/</code> + uji header (09)</td></tr><tr><td>7</td><td>Apache + HTTPS</td><td><code>gen-certs.sh</code> + vhost <code>:8443</code> + redirect <code>:8081</code> (11)</td></tr><tr><td>8</td><td>Security testing</td><td>403 private, 413, header, ServerTokens (12)</td></tr><tr><td>9</td><td>Load balancing 3 backend</td><td>Round-robin 12 request (15)</td></tr><tr><td>10</td><td>Backend failure / failover</td><td><code>podman stop backend-1</code> (15, fase 4)</td></tr><tr><td>11</td><td>Load testing</td><td>100 request paralel + <code>server-status?auto</code> (fase 3)</td></tr><tr><td>12</td><td>Production architecture</td><td>Fase 2 + audit checklist (proyek ini)</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Fase 5 — Audit akhir &amp; penyerahan',
      lang: 'bash',
      output: false,
      code: `# 1. Seluruh uji otomatis lulus
bash scripts/test-routing.sh && bash scripts/test-proxy.sh

# 2. Audit konfigurasi (hasil dicatat sebagai lampiran proyek)
podman exec apache-lab httpd -t
podman exec apache-lab httpd -S
podman exec apache-lab httpd -M | sort

# 3. Uji negatif tambahan milikmu sendiri (minimal 5), misal:
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/admin/        # 401
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/private/      # 403
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:8080/assets/hilang.css  # 404
curl -s -o /dev/null -w '%{http_code}\\n' -X TRACE http://localhost:8080/     # 405/200 tergantung

# 4. Arsip kebersihan
podman compose down`,
      explain: [
        'Lampiran proyek yang baik berisi: diagram arsitektur, daftar konfigurasi, hasil kedua skrip uji, daftar uji negatif, dan catatan keputusan (timeout, cache, HSTS) beserta alasannya.',
        'Uji negatif buatan sendiri adalah nilai tambah terbesar — menunjukkan kamu tidak hanya menjalankan skrip orang lain, tapi memikirkan apa yang harusnya <b>ditolak</b>.'
      ]
    },
    {
      type: 'tip',
      title: 'Apa yang dikerjakan selanjutnya setelah proyek ini',
      text: '<p>Jalankan lab dalam kondisi "kotor": biarkan beberapa hari tanpa dibuka, lalu coba ulang dari <code>podman compose down</code> sampai audit lengkap tanpa membuka catatan. Kecepatanmu mengulang adalah ukuran penguasaan yang jujur. Setelah itu, langkah natural: menerapkan pola yang sama pada instalasi Apache sungguhan (server uji milikmu), menambahkan <b>ModSecurity/CRS</b> dalam mode DetectionOnly, lalu mengganti sertifikat self-signed dengan <b>Let\'s Encrypt</b> nyata lewat <code>certbot</code> atau <code>mod_md</code> — tiga hal yang langsung terasa nilainya di dunia kerja.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Proyek akhir', 'Bukti terintegrasi: arsitektur lengkap + pengujian + dokumentasi keputusan.'],
        ['Uji negatif', 'Bukti bahwa akses yang seharusnya ditolak memang ditolak (401/403/404/413).'],
        ['Audit', 'Pemeriksaan sistematis memakai checklist terdokumentasi.'],
        ['Baseline performa', 'Angka pengukuran awal sebagai pembanding setiap perubahan.'],
        ['Rollback', 'Rencana kembali ke versi sebelumnya bila rilis bermasalah.'],
        ['DetectionOnly', 'Mode WAF amati sebelum mode blokir.'],
        ['Let\'s Encrypt', 'CA publik gratis dengan otomasi penerbitan (ACME).'],
        ['mod_md', 'Modul Apache untuk manajemen sertifikat ACME otomatis.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan (proyek)</h3><ol><li>Jalankan Fase 1–5 secara berurutan dan simpan seluruh output ke satu berkas <code>laporan-proyek.md</code> — itulah lampiran penyerahanmu.</li><li>Tambahkan minimal tiga uji negatif milikmu sendiri di luar yang tertera (ide: blokir metode DELETE, tolak path <code>/\\.git</code>, batasi <code>/server-status</code> ke IP tertentu) dan buktikan semuanya menolak.</li><li>Tulis paragraf "catatan keputusan" untuk tiga nilai yang kamu pilih di lab: timeout proxy, durasi cache, dan max-age HSTS — beserta alasan dan apa yang akan kamu ubah bila trafiknya berubah.</li><li>Petakan ulang 12 simulasi roadmap ke lingkungan milikmu sendiri (nama domain sendiri, backend milikmu, port sesuai kebutuhan) dan jalankan minimal enam di antaranya dari nol tanpa menyalin konfigurasi lab.</li></ol>'
    }
  ],
  recap: [
    'Proyek akhir = fondasi terverifikasi → lapisan baru (admin + auth) → uji performa → uji kegagalan &amp; pemulihan → audit checklist.',
    'Checklist kompetensi (Beginner → Expert) hanya centang yang <b>pernah dibuktikan</b>; peta 12 simulasi Podman semuanya tercakup oleh lab bab ini.',
    'Bukti tertulis (output uji, daftar uji negatif, catatan keputusan) yang membedakan "sudah coba" dengan "dikuasai".',
    'Kelanjutan alaminya: uji ulang berkala dari nol, ModSecurity mode DetectionOnly, dan sertifikat nyata (Let\'s Encrypt/mod_md) di lingkunganmu sendiri.'
  ]
});
