/* ============================================================
   Pelajaran HAProxy — 06: ACL, Routing, dan Manajemen Traffic
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'acl-routing',
  title: 'ACL, Routing, dan Manajemen Traffic',
  chapter: 'Routing',
  duration: '15 menit',
  intro: [
    'Bayangkan stasiun kereta dengan satu pintu masuk, tapi di lobi ada petugas yang memeriksa setiap penumpang: tujuan kota, jenis kereta, jam keberangkatan. Penumpang dengan tujuan Timur diarahkan ke peron 1, kereta cepat ke peron 3, dan sisanya ke peron umum. Satu pintu, banyak jalur, semua keputusan diambil dari hasil pemeriksaan.',
    'Di HAProxy, &quot;pintu&quot; itu adalah <b>frontend</b>, daftar pemeriksaannya disebut <b>ACL</b>, dan keputusan jalurnya ditulis dengan <b>use_backend ... if</b>. Satu instance HAProxy bisa melayani banyak aplikasi sekaligus: lewat hostname (<code>app1.local</code>, <code>app2.local</code>), path (<code>/api</code>, <code>/admin</code>), sampai isi header request.',
    'Pelajaran ini melatih kamu menulis ACL yang benar, menolak atau me-<i>redirect</i> request, memanipulasi header request/response, lalu membuktikan semuanya dari terminal dengan <code>curl</code> — modal penting sebelum masuk ke TLS dan observabilitas.'
  ],
  objectives: [
    'Menyusun ACL dengan fetch yang tepat (host, path, method, header) dan membaca urutan evaluasinya',
    'Mengarahkan traffic ke backend berbeda berdasarkan hostname, path, dan header memakai <code>use_backend ... if</code>',
    'Menerapkan <code>http-request deny</code>, <code>http-request redirect</code>, serta manipulasi header <code>set/add/del-header</code>',
    'Menguji aturan routing multi-application dari terminal dengan <code>curl</code> dan memeriksanya lewat log HAProxy'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>ACL: nama, fetch, dan kondisi</h3><p><b>ACL</b> adalah label bernama yang berisi satu pertanyaan tentang request: &quot;hostname-nya app1.local?&quot;, &quot;path-nya diawali /api?&quot;. Sintaksnya selalu sama: <code>acl &lt;nama&gt; &lt;fetch&gt; [operator] [nilai]</code>. Fetch adalah &quot;bagian request yang dibaca&quot;; tanpa operator, HAProxy mencocokkan nilai secara persis.</p><table><thead><tr><th>Kebutuhan</th><th>Contoh ACL</th><th>Catatan</th></tr></thead><tbody><tr><td>Routing hostname</td><td><code>acl host_app1 hdr(host) -i app1.local</code></td><td><code>-i</code> membuat pencocokan tanpa memedulikan huruf besar/kecil</td></tr><tr><td>Routing path</td><td><code>acl path_api path_beg /api</code></td><td><code>path_beg</code> = diawali; tersedia juga <code>path_end</code>, <code>path_reg</code></td></tr><tr><td>Routing header</td><td><code>acl mobile hdr_sub(User-Agent) -i mobile</code></td><td><code>hdr_sub</code> mencocokkan substring, bukan seluruh nilai</td></tr><tr><td>Blokir method</td><td><code>acl is_post method POST</code></td><td>Sering dipakai bersama <code>http-request deny if is_post</code></td></tr></tbody></table><p>ACL sendiri <b>belum melakukan apa-apa</b> — ia hanya mendefinisikan label. Aksinya muncul di baris lain yang memakai label itu: <code>use_backend X if nama_acl</code>, <code>http-request deny if ...</code>, <code>http-request redirect ... if ...</code>, bahkan <code>http-response set-header ... if ...</code>. Prinsip evaluasinya: <b>baris dievaluasi dari atas ke bawah, kecocokan pertama menang</b>, dan <code>default_backend</code> menangkap request yang tidak kena aturan apa pun — jadi selalu sediakan <code>default_backend</code> agar tidak ada request yang berakhir tanpa tujuan.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur routing HAProxy: client masuk ke frontend http_front yang memeriksa tiga ACL lalu mengarahkan request ke app1_servers, api_servers, atau web_servers">\n        <text x="20" y="30" class="u-title" text-anchor="start">Satu frontend, banyak backend</text>\n        <rect x="20" y="118" width="140" height="72" rx="8" class="u-hd"/>\n        <text x="90" y="146" class="u-title" text-anchor="middle">Client</text>\n        <text x="90" y="172" class="u-lbl" text-anchor="middle">Host: app1.local</text>\n        <line x1="166" y1="154" x2="194" y2="154" class="u-line" marker-end="url(#u-arrow)"/>\n        <rect x="200" y="30" width="230" height="250" rx="10" class="u-box"/>\n        <text x="315" y="54" class="u-title" text-anchor="middle">frontend http_front</text>\n        <rect x="214" y="66" width="202" height="44" rx="6" class="u-hd"/>\n        <text x="315" y="93" class="u-lbl" text-anchor="middle">acl host_app1 hdr(host)</text>\n        <rect x="214" y="146" width="202" height="44" rx="6" class="u-box"/>\n        <text x="315" y="173" class="u-lbl" text-anchor="middle">acl path_api path_beg /api</text>\n        <rect x="214" y="226" width="202" height="44" rx="6" class="u-box"/>\n        <text x="315" y="253" class="u-lbl" text-anchor="middle">acl mobile hdr_sub(UA)</text>\n        <line x1="436" y1="88" x2="514" y2="88" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="475" y="80" class="u-lbl" text-anchor="middle">if host_app1</text>\n        <line x1="436" y1="168" x2="514" y2="168" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="475" y="160" class="u-lbl" text-anchor="middle">if path_api</text>\n        <line x1="436" y1="248" x2="514" y2="248" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="475" y="240" class="u-lbl" text-anchor="middle">else</text>\n        <rect x="520" y="66" width="220" height="44" rx="6" class="u-hd"/>\n        <text x="630" y="93" class="u-lbl" text-anchor="middle">app1_servers</text>\n        <rect x="520" y="146" width="220" height="44" rx="6" class="u-hd"/>\n        <text x="630" y="173" class="u-lbl" text-anchor="middle">api_servers</text>\n        <rect x="520" y="226" width="220" height="44" rx="6" class="u-hd"/>\n        <text x="630" y="253" class="u-lbl" text-anchor="middle">web_servers (default)</text>\n        <text x="380" y="308" class="u-lbl" text-anchor="middle">use_backend dievaluasi berurutan: kecocokan pertama menang</text>\n      </svg></div><figcaption>Frontend memeriksa ACL satu per satu; kecocokan menentukan <code>use_backend</code>, dan <code>default_backend</code> menangkap request yang tidak kena aturan.</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Routing hostname dan path (multi-application)',
      lang: 'cfg',
      output: false,
      code: `frontend http_front
    bind :80

    acl host_app1 hdr(host) -i app1.local
    acl host_app2 hdr(host) -i app2.local
    acl path_api  path_beg /api
    acl path_admin path_beg /admin

    use_backend app1_servers  if host_app1
    use_backend app2_servers  if host_app2
    use_backend api_servers   if path_api
    use_backend admin_servers if path_admin

    default_backend web_servers`,
      explain: [
        'Empat ACL didefinisikan dulu, semua masih pasif — belum ada aksi sampai baris <code>use_backend</code> memakainya.',
        'Dua baris pertama memakai <code>hdr(host)</code> dengan <code>-i</code> agar <code>APP1.local</code> tetap cocok; <code>-i</code> juga melindungi dari client yang mengirim hostname dalam huruf kecil.',
        'Pertimbangkan urutan: bila satu request bisa kena dua aturan (hostname <code>app1.local</code> dengan path <code>/api</code>), <b>baris yang lebih atas menang</b> — di sini <code>app1_servers</code> yang dipilih.',
        '<code>default_backend web_servers</code> menangkap semua sisanya, misal request ke <code>localhost:8080</code> tanpa Host yang cocok.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menolak, me-redirect, dan memanipulasi header</h3><p>ACL tidak hanya memilih backend. Tiga aksi berikut bekerja di <b>sisi request</b> dan sangat sering dipakai bersamaan:</p><ul><li><b><code>http-request deny</code></b> — menolak request sebelum sampai backend. Sering dipakai untuk menyembunyikan endpoint sensitif: <code>http-request deny if { path_beg /admin } !allowed</code>.</li><li><b><code>http-request redirect</code></b> — menjawab client dengan status 3xx. Pola paling umum memaksa HTTPS: <code>http-request redirect scheme https code 301 if !{ ssl_fc }</code>.</li><li><b><code>http-request set-header / add-header / del-header</code></b> — <code>set-header</code> mengganti header bila sudah ada dan membuatnya bila belum; <code>add-header</code> selalu menambahkan (bisa dobel); <code>del-header</code> menghapus, misal header <code>Server</code> yang membocorkan versi backend.</li></ul><p>Sedangkan <b><code>http-response</code></b> berjalan pada arah sebaliknya — dari backend ke client — sehingga tempatnya untuk menambahkan security header seperti <code>X-Frame-Options</code> atau <code>Strict-Transport-Security</code>. Ingat pola ini: <b>atur request sebelum routing, atur response setelah backend menjawab.</b></p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Tanda kurung kurawal</b> seperti <code>{ path_beg /admin }</code> memaksa ACL dibaca sebagai kondisi utuh — dipakai saat kamu menggabungkannya dengan operator <code>!</code> (not) atau <code>&amp;&amp;</code>.</blockquote>'
    },
    {
      type: 'example',
      title: 'Deny, redirect, dan manipulasi header dalam satu frontend',
      lang: 'cfg',
      output: false,
      code: `frontend http_front
    bind :80

    acl trusted src 192.168.56.0/24
    acl is_admin path_beg /admin

    # 1. paksa HTTPS (dipakai setelah ada bind :443 ssl)
    http-request redirect scheme https code 301 if !{ ssl_fc }

    # 2. tutup /admin untuk jaringan luar
    http-request deny deny_status 403 if is_admin !trusted

    # 3. bersihkan & lengkapi header ke backend
    http-request del-header Server
    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Forwarded-Proto http  unless { ssl_fc }
    http-request add-header X-Request-ID %[uuid()]

    # 4. security header untuk response
    http-response set-header X-Frame-Options "SAMEORIGIN"
    http-response del-header X-Powered-By`,
      explain: [
        '<code>http-request redirect scheme https code 301</code> mengubah <code>http://</code> menjadi <code>https://</code> pada hostname dan path yang sama; syaratnya frontend sudah punya <code>bind :443 ssl crt ...</code> (dibahas di pelajaran TLS).',
        '<code>deny deny_status 403</code> menjawab Forbidden ketika kondisi <code>is_admin !trusted</code> terpenuhi — ACL <code>trusted</code> membatasi ke jaringan lab <code>192.168.56.0/24</code>.',
        '<code>set-header</code> membuat <code>X-Forwarded-Proto</code> bila belum ada dan menimpanya bila sudah — dua baris dengan <code>if</code>/<code>unless</code> memastikan nilainya selalu benar dan tidak dobel.',
        'Baris <code>http-response</code> berjalan sesudah backend menjawab: <code>X-Frame-Options</code> ditambahkan, <code>X-Powered-By</code> (jejak versi framework) dibuang sebelum sampai ke browser.'
      ]
    },
    {
      type: 'example',
      title: 'Uji routing dari terminal dengan curl',
      lang: 'bash',
      output: false,
      code: `# hostname routing: kirim Host header buatan sendiri
curl -s -H "Host: app1.local" http://localhost:8080/
curl -s -H "Host: app2.local" http://localhost:8080/

# path routing
curl -si http://localhost:8080/api/health | head -n 1
curl -si http://localhost:8080/admin       | head -n 1

# buktikan aturan deny (dari luar jaringan trusted)
curl -si -H "Host: app1.local" http://localhost:8080/admin | head -n 1

# pantau keputusan routing di log container
podman logs haproxy | tail -n 5`,
      explain: [
        '<code>-H "Host: app1.local"</code> menyamar sebagai client yang membuka <code>app1.local</code> — tanpa DNS apa pun, cukup ubah header untuk menguji <code>acl hdr(host)</code>.',
        'Baris <code>curl -si ... | head -n 1</code> menampilkan baris status saja: <code>HTTP/1.1 200 OK</code> untuk route yang hidup, <code>HTTP/1.1 403 Forbidden</code> bila aturan <code>deny</code> menangkap request-mu.',
        'Format log memuat <code>frontend/backend/server</code> — kalau <code>app1.local</code> kamu arahkan ke <code>app1_servers</code> tapi log menulis backend lain, urutan <code>use_backend</code>-mu yang perlu diperiksa.',
        'Ulangi perintah yang sama setelah <code>podman stop web1</code> untuk melihat kombinasi ACL yang cocok tapi backend sehatnya kosong — kejadiannya berbeda dari salah routing.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum saat menulis routing',
      text: '<ul><li><b>Lupa <code>default_backend</code></b> — bila tidak ada <code>use_backend</code> yang cocok, request berakhir tanpa tujuan dan client menerima error. Selalu tutup dengan <code>default_backend</code>.</li><li><b>Urutan aturan tertukar</b> — aturan pertama yang cocok menang, jadi aturan spesifik (<code>/admin</code>) harus berada <b>di atas</b> aturan umum (<code>path_beg /</code>).</li><li><b><code>path_beg /api</code> ikut menangkap <code>/apix</code></b> — tambahkan kondisi <code>{ path_beg /api/ }</code> atau <code>{ path -m end /api }</code> bila kamu ingin batas yang tegas.</li><li><b>Header <code>Host</code> membawa port</b> — client bisa mengirim <code>app1.local:8080</code>, sehingga <code>hdr(host) app1.local</code> tidak cocok. Gunakan fetch <code>hdr(host) -m beg</code> atau cocokkan tanpa port bila lab kamu memakai port non-standar.</li><li><b><code>add-header</code> dipakai untuk header yang harus unik</b> — karena selalu menambah, bisa terbentuk dua header. Pakai <code>set-header</code> untuk nilai yang wajib tunggal.</li><li><b>Menyalin aturan deny tanpa ACL sumber</b> — kondisi yang salah bisa menutup akses semua orang, termasuk dirimu sendiri saat testing.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Debugging ACL: buktikan sebelum percaya',
      text: '<p>Setiap kali menambah aturan, jalankan dua langkah ini: (1) validasi konfigurasi dengan <code>podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg</code> supaya typo tertangkap sebelum reload, lalu (2) kirim satu request uji dan baca field <code>backend</code> pada <code>podman logs haproxy</code>. Kalau hasilnya tidak sesuai harapan, cek dulu apakah ACL-nya memang cocok (uji manual dengan <code>curl -H &quot;Host: ...&quot;</code>) sebelum menyalahi <code>use_backend</code> — masalah routing hampir selalu ada di nilai yang tidak pernah cocok, bukan di baris pemilihnya.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['ACL', 'Access Control List — label bernama berisi kondisi tentang request, didefinisikan dengan <code>acl nama fetch ...</code>.'],
        ['Fetch', 'Sumber nilai yang dibaca HAProxy, misal <code>hdr(host)</code>, <code>path_beg</code>, <code>method</code>, <code>src</code>.'],
        ['use_backend', 'Directive yang memilih backend bila kondisi ACL terpenuhi; dievaluasi berurutan, kecocokan pertama menang.'],
        ['default_backend', 'Backend tujuan untuk request yang tidak kena <code>use_backend</code> mana pun.'],
        ['http-request', 'Aksi pada request dari client sebelum diteruskan ke backend: <code>deny</code>, <code>redirect</code>, <code>set-header</code>, dll.'],
        ['http-response', 'Aksi pada response dari backend sebelum dikirim ke client, misal menambah security header.'],
        ['Content switching', 'Istilah resmi HAProxy untuk routing: satu frontend memilih backend berdasarkan isi request.'],
        ['X-Forwarded-Proto', 'Header yang diberi nilai <code>http</code>/<code>https</code> agar backend tahu skema asli permintaan client.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Salin konfigurasi routing pertama, lalu <b>tukar urutan</b> <code>use_backend ... if path_api</code> ke atas <code>use_backend ... if host_app1</code>. Uji dengan <code>curl -H &quot;Host: app1.local&quot; http://localhost:8080/api/x</code> dan jelaskan backend mana yang dipilih serta kenapa.</li><li>Buat aturan <code>http-request deny</code> untuk path <code>/secret</code> yang hanya boleh diakses dari <code>127.0.0.1</code>, lalu buktikan status <code>403</code> dari luar dan <code>200</code> dari lab.</li><li>Tambahkan <code>http-response set-header X-Content-Type-Options &quot;nosniff&quot;</code>, reload HAProxy, lalu periksa kehadirannya dengan <code>curl -si http://localhost:8080/</code>.</li><li><b>Checkpoint:</b> mampu menjelaskan dan menguji routing multi-application berdasarkan hostname, path, dan header — termasuk membaca log untuk memastikan request mendarat di backend yang benar.</li></ol>'
    }
  ],
  recap: [
    '<b>ACL hanya label</b> — aksinya muncul pada <code>use_backend</code>, <code>http-request deny/redirect/set-header</code>, dan <code>http-response</code> yang memakainya.',
    'Aturan <code>use_backend</code> dievaluasi <b>berurutan dan kecocokan pertama menang</b>; <code>default_backend</code> wajib ada untuk menangkap sisanya.',
    'Routing multi-application memakai tiga sumbu: <b>hostname</b> (<code>hdr(host)</code>), <b>path</b> (<code>path_beg</code>), dan <b>header</b> (<code>hdr_sub(User-Agent)</code>).',
    '<b><code>set-header</code> menimpa, <code>add-header</code> menambah, <code>del-header</code> menghapus</b> — selalu buktikan hasilnya dengan <code>curl</code> dan <code>podman logs haproxy</code>.'
  ]
});
