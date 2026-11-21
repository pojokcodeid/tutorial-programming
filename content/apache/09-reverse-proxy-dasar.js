/* ============================================================
   Pelajaran Apache — 09: Reverse Proxy Dasar
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'reverse-proxy-dasar',
  title: 'Reverse Proxy Dasar: ProxyPass, ProxyPassReverse & Header',
  chapter: 'Reverse Proxy',
  duration: '10 menit',
  intro: [
    'Aplikasi modern hampir selalu berdiri di belakang gateway: Apache yang meneruskan <code>/api</code> ke layanan Go, <code>/app</code> ke frontend Node, dan <code>/auth</code> ke service login — semua lewat satu pintu HTTPS. Inilah peran yang paling sering diemban Apache di produksi hari ini.',
    'Pelajaran ini membangun reverse proxy dari nol: membedakannya dari forward proxy, memahami semantik <code>ProxyPass</code> (termasuk jebakan trailing slash), melengkapi header yang dibutuhkan backend, lalu membuktikannya lewat endpoint pemantul header di lab.'
  ],
  objectives: [
    'Menjelaskan perbedaan forward proxy dan reverse proxy beserta konfigurasi yang menyalakannya',
    'Menulis <code>ProxyPass</code> dan <code>ProxyPassReverse</code> serta memprediksi path yang diterima backend',
    'Mengatur <code>ProxyPreserveHost</code> dan header <code>X-Forwarded-*</code>',
    'Menguji header yang benar-benar sampai ke backend memakai endpoint <code>/api/headers/</code>',
    'Menjelaskan kenapa <code>ProxyRequests Off</code> wajib untuk keamanan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Arah yang membedakan</h3><table><thead><tr><th></th><th>Forward proxy</th><th>Reverse proxy</th></tr></thead><tbody><tr><td>Mewakili</td><td><b>Klien</b> saat berbicara ke internet</td><td><b>Server</b> saat melayani klien</td></tr><tr><td>Klien tahu?</td><td>Klien tahu ia memakai proxy (di-set di browser/OS)</td><td>Klien tidak tahu — ia hanya melihat satu server</td></tr><tr><td>Konfigurasi Apache</td><td><code>ProxyRequests On</code> (harus dibatasi ketat!)</td><td><code>ProxyRequests Off</code> + <code>ProxyPass</code></td></tr><tr><td>Risiko</td><td>Jadi proxy terbuka untuk penyalahgunaan</td><td>Rendah bila dikonfigurasi benar</td></tr></tbody></table><p>Lab selalu memakai <code>ProxyRequests Off</code> — dan <code>scripts/test-proxy.sh</code> membuktikannya: request absolut gaya forward proxy (<code>http://example.com/</code>) tetap dilayani dari DocumentRoot lokal, bukan diteruskan ke internet.</p>'
    },
    {
      type: 'example',
      title: 'Dua baris inti: ProxyPass dan ProxyPassReverse',
      lang: 'apache',
      output: false,
      code: `ProxyPass        "/api/" "http://backend-1:80/"
ProxyPassReverse "/api/" "http://backend-1:80/"

# Alur request:
#   klien    GET /api/headers/
#   Apache   GET http://backend-1:80/headers/     <- /api/ digantikan "/"
#   backend  membalas, lalu
#   Apache   menulis ulang header Location/Content-Location
#            agar klien tetap melihat /api/...`,
      explain: [
        'Kedua argumen diakhiri <b>satu garis miring</b>: bagian <code>/api/</code> digantikan <code>/</code> pada tujuan. Tanpa trailing slash di keduanya, <code>/api/headers/</code> diteruskan utuh sebagai <code>/api/headers/</code>.',
        '<code>ProxyPassReverse</code> tidak mempengaruhi request — ia hanya <b>menulis ulang</b> respons (terutama header <code>Location</code> dan <code>Content-Location</code>) supaya redirect dari backend tidak membocorkan alamat internal.',
        '<code>ProxyPass</code> boleh ditulis di konteks server/vhost/location; di lokasi yang lebih panjang harus ditulis <b>sebelum</b> yang lebih pendek karena dievaliasi berurutan.'
      ]
    },
    {
      type: 'example',
      title: 'Menyalakan proxy di lab dan membuktikannya',
      lang: 'bash',
      output: true,
      code: `# Konfigurasi lab (apache/snippets/proxy-routes.conf):
#   ProxyPass        "/api/" "balancer://app_backend/"
#   ProxyPassReverse "/api/" "balancer://app_backend/"

curl -s http://localhost:8080/api/ | grep -o 'backend-[0-9]'
# -> backend-1 (atau 2/3) — konten datang dari container backend

curl -s http://localhost:8080/api/headers/
# server=apache-lab
# host=localhost:8080
# x-real-ip=10.89.2.5
# x-forwarded-for=10.89.2.5
# x-forwarded-proto=http`,
      explain: [
        'Endpoint <code>/headers/</code> dimiliki ketiga backend (lihat <code>backends/backend.conf</code>) dan memantulkan request yang diterima — alat bukti paling langsung untuk memeriksa header.',
        '<code>host=localhost:8080</code> menunjukkan <code>ProxyPreserveHost On</code> bekerja: backend menerima Host asli, bukan <code>backend-1:80</code>.',
        '<code>x-forwarded-for</code> diisi otomatis oleh mod_proxy (IP klien); <code>x-real-ip</code> dan <code>x-forwarded-proto</code> kita setel sendiri lewat <code>RequestHeader</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Header yang wajib diteruskan</h3><p>Tanpa header ini, backend kehilangan konteks: log hanya menampilkan IP gateway, aplikasi salah membangun URL absolut, dan deteksi HTTPS tidak bekerja.</p><table><thead><tr><th>Header</th><th>Diisi oleh</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>Host</code></td><td><code>ProxyPreserveHost On</code></td><td>Nama asli untuk aplikasi multi-domain</td></tr><tr><td><code>X-Forwarded-For</code></td><td>mod_proxy (otomatis)</td><td>IP klien asli (ditambahkan, bukan ditimpa)</td></tr><tr><td><code>X-Real-IP</code></td><td><code>RequestHeader set ...</code></td><td>IP klien versi ringkas, umum dipakai framework</td></tr><tr><td><code>X-Forwarded-Proto</code></td><td><code>RequestHeader set ...</code></td><td><code>http</code>/<code>https</code> — kunci penentu cookie secure &amp; URL absolut</td></tr><tr><td><code>X-Forwarded-Host</code></td><td>mod_proxy</td><td>Host asli bila ada beberapa lapis proxy</td></tr></tbody></table><pre><code>ProxyPreserveHost On\nRequestHeader set X-Real-IP         "%{REMOTE_ADDR}s"\nRequestHeader set X-Forwarded-Proto "expr=%{REQUEST_SCHEME}"</code></pre>'
    },
    {
      type: 'example',
      title: 'Bukti X-Forwarded-Proto berubah sesuai pintu masuk',
      lang: 'bash',
      output: false,
      code: `# Lewat HTTP :8080
curl -s http://localhost:8080/api/headers/ | grep x-forwarded-proto
# x-forwarded-proto=http

# Lewat HTTPS :8443 — nilai yang sama otomatis jadi https
curl -sk https://localhost:8443/api/headers/ | grep x-forwarded-proto
# x-forwarded-proto=https

# Header Host yang dipertahankan
curl -s -H "Host: api.local" http://localhost:8080/api/headers/ | grep '^host='
# host=api.local`,
      explain: [
        '<code>%{REQUEST_SCHEME}</code> adalah variabel request yang bernilai <code>http</code>/<code>https</code> sesuai enkripsi di hop pertama.',
        'Nilai ini yang membuat aplikasi menghasilkan URL absolut <code>https://...</code> dan cookie <code>Secure</code> dengan benar — salah satu penyebab "redirect balik ke http terus" adalah header ini tidak di-set.',
        'Di lab, uji yang sama diulang oleh <code>test-proxy.sh</code> untuk kedua pintu masuk, sehingga regresi pada konfigurasi header langsung ketahuan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aturan praktis penulisan ProxyPass</h3><ol><li><b>Tulis path terpanjang lebih dulu</b>: <code>/api/v2/</code> sebelum <code>/api/</code>.</li><li><b>Kunci pasangan dua-duanya</b>: mengubah slash di satu sisi tanpa sisi lain mengubah hasil pemetaan secara diam-diam.</li><li><b><code>ProxyRequests Off</code></b> selalu, di konfigurasi mana pun — kecuali memang sengaja membuat forward proxy yang dibatasi <code>&lt;Proxy&gt;</code> ketat.</li><li><b>Jangan campur</b> <code>ProxyPass</code> dan <code>RewriteRule ... [P]</code> untuk path yang sama; pilih salah satu agar urutan evaluasi jelas.</li><li><b>Path internal backend</b> harus konsisten: kalau aplikasi berada di sub-path (<code>/api/</code>), sesuaikan konfigurasinya juga, jangan mengandalkan potong-potong path.</li></ol><p>Contoh multi-layanan pada satu vhost:</p><pre><code>ProxyPass        "/auth/"  "http://auth-service:8081/"\nProxyPass        "/api/"   "http://api-service:9000/"\nProxyPass        "/"       "http://frontend:3000/"\nProxyPassReverse "/auth/"  "http://auth-service:8081/"\nProxyPassReverse "/api/"   "http://api-service:9000/"\nProxyPassReverse "/"       "http://frontend:3000/"</code></pre>'
    },
    {
      type: 'warn',
      title: 'Proxy yang mengembalikan 502: cek dua hal ini',
      text: '<p>Ketika <code>/api/</code> membalas 502/503/500 sementara halaman statis normal, masalahnya hampir selalu di sisi upstream: (1) <b>backend tidak berjalan / port salah</b> — lihat pesan <code>AH00957 attempt to connect ... failed</code> di error log; (2) <b>nama host gagal di-resolve</b> — <code>AH00898 DNS lookup failure</code>, umum terjadi ketika container backend dihentikan. Periksa dengan <code>podman ps</code>, <code>podman logs backend-1</code>, dan <code>podman exec apache-lab httpd -t</code> sebelum menyentuh konfigurasi lain.</p>'
    },
    {
      type: 'tip',
      title: 'Uji header selalu sebelum percaya aplikasi',
      text: '<p>Jangan menguji "apakah halaman tampil" — halaman bisa tampil meski header salah. Uji <b>konteks yang diterima backend</b>: endpoint <code>/headers/</code>, log sisi backend, atau <code>tcpdump</code> bila perlu. Sembilan dari sepuluh bug integrasi backend (cookie tidak tersimpan, URL salah, login loop, rate limit keliru) berpangkal pada satu header yang tidak diteruskan atau justru ditimpa dua kali oleh dua lapis proxy.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Reverse proxy', 'Server yang mewakili backend saat melayani klien.'],
        ['Forward proxy', 'Server yang mewakili klien saat mengakses internet; butuh <code>ProxyRequests On</code>.'],
        ['ProxyPass', 'Memetakan path lokal ke URL backend (diterapkan pada request).'],
        ['ProxyPassReverse', 'Menulis ulang header redirect respons agar URL internal tidak bocor.'],
        ['ProxyPreserveHost', 'Meneruskan Host asli klien ke backend.'],
        ['X-Forwarded-For', 'Daftar IP klien melalui rantai proxy (ditambahkan tiap hop).'],
        ['X-Forwarded-Proto', 'Skema asli (http/https) sebelum melewati proxy.'],
        ['balancer://', 'Skema tujuan kumpulan backend — dibahas pada Pelajaran 14.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan lab, lalu buktikan <code>ProxyPass</code> bekerja dengan <code>curl -s http://localhost:8080/api/</code> dan <code>/app/</code> — catat nama backend yang menjawab.</li><li>Bandingkan isi <code>/api/headers/</code> antara <code>:8080</code> dan <code>:8443</code>, khususnya baris <code>x-forwarded-proto</code> — jelaskan siapa yang menentukan nilainya.</li><li>Hapus sengaja <code>ProxyPreserveHost On</code> dari snippet, jalankan <code>httpd -t</code> + <code>graceful</code>, lalu amati perubahan pada <code>host=</code> di endpoint headers — pulihkan kembali.</li><li>Tulis pasangan <code>ProxyPass</code> untuk <code>/auth/</code> ke service yang tidak ada (mis. <code>http://localhost:9999/</code>), amati status dan pesan errornya di log, lalu hapus. Ini simulasi diagnosis 502/503.</li></ol>'
    }
  ],
  recap: [
    'Reverse proxy mewakili <b>server</b> ke klien dan selalu memakai <code>ProxyRequests Off</code> + <code>ProxyPass</code>; forward proxy mewakili klien dan berisiko jadi proxy terbuka.',
    '<code>ProxyPass</code> meneruskan request (perhatikan trailing slash); <code>ProxyPassReverse</code> menulis ulang header redirect respons.',
    '<code>ProxyPreserveHost On</code> + <code>X-Forwarded-For/Real-IP/Proto</code> menjaga konteks klien tetap sampai ke backend.',
    'Bukti integrasi = isi endpoint <code>/headers/</code>, bukan sekadar halaman tampil; 502/503/500 pada rute proxy hampir selalu backend tak terjangkau atau DNS gagal.'
  ]
});
