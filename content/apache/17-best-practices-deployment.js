/* ============================================================
   Pelajaran Apache — 17: Best Practices & Deployment
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'best-practices-deployment',
  title: 'Best Practices & Deployment: Container, CDN, DNS, Otomasi',
  chapter: 'Advanced',
  duration: '12 menit',
  intro: [
    'Konfigurasi yang benar di laptop belum tentu bertahan di produksi. Yang membedakannya adalah hal-hal sepele yang terlihat belakangan: file konfigurasi yang tidak bisa direproduksi, sertifikat yang kedaluwarsa tanpa siapa pun tahu, deploy manual yang membuat satu orang paham segalanya, dan Apache berdiri sendiri tanpa rencana ketika mati.',
    'Pelajaran ini merangkum praktik terbaik bab Apache dari sisi <b>pengiriman ke produksi</b>: menyusun konfigurasi modular &amp; ter-versioning, menjalankan Apache di container secara benar, memosisikan Apache di depan CDN dan DNS, mengotomasi pengujian, serta checklist audit sebelum rilis. Inilah bekal terakhir sebelum proyek akhir.'
  ],
  objectives: [
    'Menyusun konfigurasi Apache yang terstruktur, ter-versioning, dan dapat direproduksi',
    'Menjalankan Apache di container dengan praktik terbaik (config test, healthcheck, log stdout)',
    'Menjelaskan posisi Apache relatif terhadap CDN, DNS, dan load balancer eksternal',
    'Mengotomasi validasi konfigurasi & pengujian pada alur deploy',
    'Memakai checklist audit konfigurasi sebelum rilis ke produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Konfigurasi yang bisa dirawat bersama</h3><p>Konfigurasi produksi adalah kode: ia ditinjau orang lain, diubah banyak orang, dan harus bisa direproduksi di mesin mana pun. Prinsip yang dipakai sepanjang bab ini:</p><ul><li><b>Modular per fungsi</b> — vhost per file, snippet dipakai ulang (proxy, header), file utama berisi hanya Listen/modul/log global.</li><li><b>Keadaan di Git</b> — <code>httpd.conf</code> dan potongannya masuk version control; yang <b>tidak</b> masuk: sertifikat, key, file <code>.htpasswd</code>, dan isi situs yang dibangun.</li><li><b>Parameter lewat environment/template</b> — perbedaan staging/produksi (domain, path, port) dihasilkan template (envsubst, ansible template), bukan cabang file yang jauh berbeda.</li><li><b>Selalu validasi di CI</b> — <code>httpd -t</code> + skrip uji dijalankan sebelum konfigurasi boleh digabung.</li></ul><pre><code># Pola yang terbukti pada lab ini — tambahkan ke alur deploy:\npodman run --rm -v "$PWD/apache:/usr/local/apache2/conf:ro" httpd:2.4 httpd -t\nbash scripts/test-routing.sh && bash scripts/test-proxy.sh</code></pre>'
    },
    {
      type: 'example',
      title: 'Apache di container: daftar praktik terbaik',
      lang: 'text',
      output: false,
      code: `1. Log ke stdout/stderr  ->  CustomLog/ErrorLog /proc/self/fd/1|2
2. Config test sebelum start  ->  compose: command dengan "httpd -t && httpd -DFOREGROUND"
                                  atau healthcheck: httpd -t
3. Config di-mount read-only  ->  :ro pada volume konfigurasi
4. Image minimal & tidak berubah  ->  ganti konfigurasi lewat mount, JANGAN docker commit
5. Graceful saat deploy  ->  podman exec httpd -k graceful (bukan restart bila hanya config)
6. Konten & config terpisah  ->  volume berbeda untuk htdocs vs conf
7. Port non-privileged  ->  8080/8443 di host, container tetap bebas di dalam`,
      explain: [
        'Healthcheck <code>httpd -t</code> menangkap konfigurasi rusak di awal — container gagal start jelas terlihat, bukan diam-diam melayani dengan konfigurasi lama.',
        'Volume <code>:ro</code> mencegah proses (atau penyerang yang sudah masuk) mengubah konfigurasi berjalan di dalam container.',
        'Pola log stdout membuat satu container tidak menyimpan file log yang tumbuh tanpa batas — rotasi diserahkan ke driver log container.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Posisi Apache di antara CDN dan DNS</h3><p>Arsitektur modern jarang menempatkan Apache sebagai satu-satunya lapisan. Posisi wajarnya:</p><pre><code>        pengguna\n           |\n        [DNS]  ----A record----&gt;  IP gateway / LB\n           |\n        [CDN]  &lt;---cache aset statis--- Apache\n           |\n      [Apache]  &lt;---edge: TLS, redirect, WAF, routing\n           |\n   +-------+--------+\n   |       |        |\nfrontend api     auth/etc</code></pre><ul><li><b>DNS</b> — TTL menentukan seberapa cepat perpindahan IP saat failover; Apache tidak mengatur DNS, tapi <code>ServerName</code>/<code>ServerAlias</code> harus <b>selaras</b> dengan record yang ada agar pemilihan vhost benar.</li><li><b>CDN</b> — aset statis disimpan CDN berdasarkan <code>Cache-Control</code> hasil <code>mod_expires</code>; karena itu aturan cache yang konsisten (Pelajaran 13) menentukan efisiensi CDN. Untuk HTML, CDN biasanya di-bypass (TTL kecil).</li><li><b>Di belakang load balancer lain</b> — bila ada LB managed (cloud), <code>mod_remoteip</code> diperlukan agar IP asli klien terbaca dari header tepercaya; tanpa itu log dan <code>Require ip</code> hanya melihat IP LB.</li><li><b>Apache di dua AZ</b> — HA antar-mesin memakai keepalived/VRRP atau DNS round-robin; balancer internal (Pelajaran 15) menangani backend, bukan ketersediaan dirinya sendiri.</li></ul>'
    },
    {
      type: 'example',
      title: 'Membaca IP asli di belakang LB dengan mod_remoteip',
      lang: 'apache',
      output: false,
      code: `LoadModule remoteip_module modules/mod_remoteip.so

# Hanya percaya header dari jaringan LB-mu sendiri!
RemoteIPInternalProxy 10.0.0.0/8 172.16.0.0/12

# X-Forwarded-For kini ditafsir ulang menjadi IP asli klien
LogFormat "%a %t \\"%r\\" %>s %b" combined-proxy
CustomLog /proc/self/fd/1 combined-proxy`,
      explain: [
        '<b>Harus dibatasi</b> ke proxy tepercaya: bila <code>RemoteIPInternalProxy</code> mencakup semua, klien mana pun bisa memalsukan <code>X-Forwarded-For</code> dan lolos dari <code>Require ip</code> — keamanan justru berbalik arah.',
        'Setelah <code>%a</code> menunjuk IP asli, log akses kembali berguna untuk audit dan pembatasan berbasis IP.',
        'Ini klasik kasus "posisi dalam arsitektur menentukan konfigurasi" — konfigurasi yang sama bisa benar di satu topologi dan berbahaya di topologi lain.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Otomasi pengujian &amp; deploy</h3><p>Yang membuat deploy berani adalah bukti otomatis. Skrip uji lab (35 + 25 pemeriksaan) adalah contohnya; di produksi polanya sama:</p><ol><li><b>Validasi statis</b> — <code>httpd -t</code> pada container fresh dengan konfigurasi calon rilis.</li><li><b>Smoke test</b> — endpoint kunci: halaman utama, satu rute proxy, satu endpoint HTTPS.</li><li><b>Uji negatif</b> — path yang <i>harus</i> ditolak (403 private, 404 aset hilang, 413 upload besar). Inilah yang sering terlupa dan justru paling mahal saat bocor.</li><li><b>Uji kegagalan</b> — matikan satu backend, pastikan layanan tetap berjalan (seperti <code>test-proxy.sh</code>).</li><li><b>Canary/graceful</b> — terapkan ke satu instance dulu, <code>graceful</code>, pantau log/error rate, baru lanjutkan.</li></ol><pre><code># Kerangka pipeline sederhana\nbuild-config:\n  podman run --rm -v ./apache:/conf:ro httpd:2.4 httpd -t -f /conf/httpd.conf\ntest:\n  bash scripts/test-routing.sh && bash scripts/test-proxy.sh\ndeploy:\n  podman compose up -d --no-deps apache-lab\n  podman exec apache-lab httpd -k graceful\n  bash scripts/test-routing.sh    # uji ulang setelah terapkan</code></pre>'
    },
    {
      type: 'example',
      title: 'Checklist audit sebelum rilis',
      lang: 'text',
      output: false,
      code: `KONFIGURASI
[ ] httpd -t lolos di container bersih (bisa direproduksi dari Git)
[ ] httpd -S menampilkan vhost yang diharapkan; default vhost benar
[ ] httpd -M: hanya modul terpakai yang dimuat
[ ] ServerTokens Prod, ServerSignature Off

KEAMANAN
[ ] Options -Indexes di semua direktori publik
[ ] Security header terkirim (uji curl -sI)
[ ] File .env/.bak/.git tertutup; .htaccess tak bisa diunduh
[ ] LimitRequestBody pada endpoint upload
[ ] Basic auth (bila ada) hanya lewat HTTPS; .htpasswd di luar DocumentRoot
[ ] /server-status & /server-info dibatasi Require ip

TLS & DNS
[ ] Sertifikat valid (tanggal & SAN benar), chain lengkap
[ ] Redirect HTTP->HTTPS satu langkah, HSTS sesuai rencana
[ ] ServerName/ServerAlias selaris record DNS

PROXY & BACKEND
[ ] ProxyRequests Off
[ ] Header X-Forwarded-* terbaca di backend (endpoint headers)
[ ] Timeout/connectiontimeout disetel per rute
[ ] Failover diuji: satu backend mati -> layanan tetap jalan

OPERASIONAL
[ ] Log ke stdout; rotasi/retensi terdefinisi
[ ] Uji skrip lulus semua; rollback diketahui cara menjalankannya
[ ] Graceful deploy tanpa 000 pada loop curl`,
      explain: [
        'Daftar ini sebaiknya menjadi skrip — teks yang tidak dieksekusi pelan-pelan usang. Mulailah dari menyalin bagian yang relevan ke <code>scripts/pre-release.sh</code>.',
        'Perhatikan proporsinya: separuh adalah hal yang <b>harus ditolak</b> (uji negatif), bukan hal yang harus tampil — persis pola Pelajaran 12.'
      ]
    },
    {
      type: 'warn',
      title: 'Tiga kebiasaan yang membuat deploy berbahaya',
      text: '<p>(1) <b>Edit langsung di server</b> — perubahan tidak ter-versioning, tidak bisa direproduksi, dan hilang di container berikutnya; selalu edit di Git lalu deploy. (2) <b>Restart tanpa config test</b> — satu typo mengubah restart menjadi outage total. (3) <b>Tanpa uji negatif</b> — deploy "sukses" karena halaman utama tampil, padahal direktori <code>/private/</code> kini terbuka. Ketiganya ditutup oleh alur: edit → <code>httpd -t</code> → skrip uji → deploy → uji ulang.</p>'
    },
    {
      type: 'tip',
      title: 'Dokumentasikan keputusan, bukan hanya konfigurasi',
      text: '<p>Komentar yang paling berharga menjawab <i>kenapa</i>: "timeout=3 karena p95 backend 800ms", "HSTS max-age rendah dulu karena subdomain belum siap", "Require ip ini sementara selama migrasi". Konfigurasi memberi tahu apa yang dilakukan; dokumentasi keputusan mencegah orang berikutnya (termasuk kamu 6 bulan lagi) menghapusnya karena mengira itu tidak perlu.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['IaC (Infra as Code)', 'Konfigurasi infrastruktur disimpan di Git dan diterapkan otomatis.'],
        ['Smoke test', 'Pengujian singkat bahwa komponen utama berfungsi setelah deploy.'],
        ['Uji negatif', 'Menguji bahwa sesuatu ditolak seharusnya (403/404/413), bukan hanya yang berhasil.'],
        ['Canary', 'Menerapkan perubahan ke sebagian instance dulu sebelum seluruhnya.'],
        ['mod_remoteip', 'Membaca IP klien asli dari header tepercaya di belakang load balancer.'],
        ['CDN', 'Jaringan cache edge; memanfaatkan Cache-Control hasil mod_expires.'],
        ['Rollback', 'Kembali ke versi konfigurasi sebelumnya setelah rilis bermasalah.'],
        ['Healthcheck', 'Pemeriksaan otomatis kesehatan container/service (mis. httpd -t).']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Susun struktur folder konfigurasimu sendiri (vhosts/, snippets/, conf.d/) berdasarkan pola lab, tuliskan fungsi tiap file dalam README, dan pastikan <code>httpd -t</code> lolos dari container bersih yang hanya membaca folder itu.</li><li>Tambahkan healthcheck <code>httpd -t</code> pada <code>compose.yaml</code> lab, lalu sengaja rusak konfigurasi dan amati container dinyatakan tidak sehat.</li><li>Tulis skrip <code>pre-release.sh</code> yang menjalankan <code>httpd -t</code> + kedua skrip uji lab + lima pemeriksaan checklist pilihanmu, dan buktikan skripnya gagal (exit non-nol) ketika kamu merusak satu syarat.</li><li>Berdasarkan arsitektur CDN/DNS di atas, gambar dengan bahasamu sendiri di mana Apache berada pada aplikasi yang kamu kenal, dan sebutkan tiga konfigurasi yang harus berubah bila ada LB managed di depannya (mod_remoteip, forwarded header, trusted proxy).</li></ol>'
    }
  ],
  recap: [
    'Konfigurasi produksi = kode: modular, ter-versioning, template per environment, divalidasi <code>httpd -t</code> + skrip uji di CI sebelum digabung.',
    'Container: log stdout, config test/healthcheck, mount <code>:ro</code>, graceful untuk perubahan konfigurasi, port non-privileged.',
    'Posisi menentukan konfigurasi: DNS harus selaris ServerName, CDN memanfaatkan Cache-Control, dan di belakang LB wajib <code>mod_remoteip</code> yang dibatasi proxy tepercaya.',
    'Deploy aman = otomasi: validasi → smoke test → <b>uji negatif</b> → uji kegagalan → canary/graceful → uji ulang; didokumentasikan kenangannya, bukan hanya hasilnya.'
  ]
});
