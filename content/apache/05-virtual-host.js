/* ============================================================
   Pelajaran Apache — 05: Virtual Host & Multiple Website
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'virtual-host',
  title: 'Virtual Host: Melayani Banyak Website dalam Satu Apache',
  chapter: 'Virtual Host',
  duration: '10 menit',
  intro: [
    'Dulu satu website berarti satu proses server di satu mesin. Hari ini wajar bila satu instance Apache melayani <b>puluhan domain</b>: situs perusahaan, microsite kampanye, panel admin, dan dokumentasi internal — semuanya dari port dan proses yang sama.',
    'Kuncinya hanya satu baris: <b>header <code>Host</code></b>. Pelajaran ini membedah tiga gaya virtual host (name-based, port-based, IP-based), aturan pemilihan default vhost, simulasi DNS lokal, lalu membuktikan semuanya lewat <code>curl -H "Host: ..."</code> pada lab.'
  ],
  objectives: [
    'Menulis blok <code>&lt;VirtualHost&gt;</code> lengkap dengan ServerName, DocumentRoot, dan blok Directory-nya',
    'Membedakan virtual host berbasis nama, port, dan IP',
    'Menentukan default vhost dan menjelaskan apa yang terjadi pada Host yang tidak dikenal',
    'Menambahkan ServerAlias dan mengujinya tanpa mengubah DNS asli',
    'Memeriksa seluruh vhost lewat <code>httpd -S</code>'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga cara membagi website</h3><table><thead><tr><th>Gaya</th><th>Dipilih dari</th><th>Kapan dipakai</th></tr></thead><tbody><tr><td><b>Name-based</b> (paling umum)</td><td>Header <code>Host</code></td><td>Banyak domain pada satu IP &amp; port — butuh satu cert/SNI yang sesuai</td></tr><tr><td><b>Port-based</b></td><td>Port tujuan</td><td>Layanan terpisah (8080 web, 9090 panel) tanpa domain</td></tr><tr><td><b>IP-based</b></td><td>Alamat IP yang menerima</td><td>Domain lama yang harus memakai IP sendiri; jarang hari ini</td></tr></tbody></table><p>Karena name-based paling dominan, materi ini fokus ke sana. Perhatikan urutan: Apache menerima request → memecah header <code>Host</code> → mencari kecocokan <code>ServerName</code>/<code>ServerAlias</code> di IP:port yang sama → kalau tidak ada, memakai <b>default vhost</b>.</p>'
    },
    {
      type: 'example',
      title: 'Dua website pada port yang sama',
      lang: 'apache',
      output: false,
      code: `# Urutan blok menentukan mana default vhost untuk port ini
<VirtualHost *:8080>
    ServerName app.local
    ServerAdmin admin@app.local
    DocumentRoot "/usr/local/apache2/htdocs"

    <Directory "/usr/local/apache2/htdocs">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog  /proc/self/fd/2
    CustomLog /proc/self/fd/1 main
</VirtualHost>

<VirtualHost *:8080>
    ServerName api.local
    ServerAlias api.test www.api.local
    DocumentRoot "/usr/local/apache2/api"

    <Directory "/usr/local/apache2/api">
        Options -Indexes
        Require all granted
    </Directory>
</VirtualHost>`,
      explain: [
        'Keduanya <code>*:8080</code> — port sama, pembeda hanya header <code>Host</code>. Tidak ada <code>Listen</code> tambahan yang dibutuhkan.',
        '<b>Blok pertama adalah default vhost</b> untuk 8080: request dengan Host yang tidak cocok apa pun (mis. <code>localhost:8080</code> atau IP) jatuh ke sini — persis perilaku <code>default_server</code> pada Nginx.',
        '<code>ServerAlias</code> menambah nama lain untuk vhost yang sama (varian <code>www</code>, nama internal, atau domain cadangan).'
      ]
    },
    {
      type: 'example',
      title: 'Menguji virtual host tanpa mengubah DNS',
      lang: 'bash',
      output: true,
      code: `cd examples/apache-lab

# Dua baris pertama memakai Host bawaan; baris ketiga memaksa Host tertentu
curl -s http://localhost:8080/ | grep -o '<h1>[^<]*'
curl -s -H "Host: api.local" http://localhost:8080/ | grep -o '<h1>[^<]*'
curl -s -H "Host: docs.local" http://localhost:8080/ | grep -o '<h1>[^<]*'

# Inspeksi seluruh vhost + default vhost-nya
podman exec apache-lab httpd -S`,
      explain: [
        'Mengirim <code>-H "Host: ..."</code> membuat browser/terminal kamu "seolah" membuka domain itu — teknik paling cepat menguji vhost sebelum DNS tersambung.',
        '<code>httpd -S</code> mencetak pasangan <code>ip:port → vhost → file:baris</code>, termasuk penanda <code>default vhost</code>.',
        'Di lab, <code>Host: app.local</code> (atau tanpa override) menampilkan halaman utama; <code>api.local</code> menampilkan halaman API; <code>docs.local</code> menampilkan dokumentasi — bukti satu port melayani tiga website.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Simulasi DNS dengan /etc/hosts</h3><p>Agar kamu bisa menulis <code>http://app.local</code> tanpa domain sungguhan, beri tahu mesin client ke mana nama itu mengarah. Ini latihan, bukan solusi produksi:</p><pre><code># /etc/hosts pada mesin client (Linux/macOS)\n127.0.0.1   app.local api.local docs.local</code></pre><p>Setelah itu <code>curl http://app.local:8080/</code> langsung mengirim <code>Host: app.local:8080</code>. Beberapa catatan yang sering menjebak:</p><ul><li>Di produksi yang benar adalah <b>DNS sungguhan</b> (A/AAAA record) mengarah ke IP gateway.</li><li><code>.local</code> rawan bentrok dengan mDNS/Bonjour — untuk demam lokal masih aman, jangan dipakai di jaringan produksi.</li><li>Kalau tidak mau mengedit hosts, <code>curl -H</code> seperti di lab sudah cukup untuk semua pengujian.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Perilaku default vhost &amp; Host yang tidak dikenal</h3><p>Ini sumber bug paling sering saat menambah website baru:</p><table><thead><tr><th>Situasi</th><th>Yang dilayani</th></tr></thead><tbody><tr><td>Host cocok <code>ServerName</code></td><td>Vhost tersebut</td></tr><tr><td>Host cocok <code>ServerAlias</code></td><td>Vhost tersebut</td></tr><tr><td>Host tidak dikenal / kosong / pakai IP</td><td><b>Default vhost</b> (blok pertama pada IP:port itu)</td></tr><tr><td>Ada <code>&lt;VirtualHost&gt;</code> lain di port berbeda</td><td>Tidak relevan — pencocokan hanya di port penerima</td></tr></tbody></table><p>Akibatnya: typo <code>ServerName</code> tidak menghasilkan error 404, melainkan <b>halaman website yang salah</b> — yang jauh lebih membingungkan. Selalu cek dengan <code>httpd -S</code> dan curl Host.</p>'
    },
    {
      type: 'warn',
      title: 'Setiap vhost wajib membawa blok Directory-nya',
      text: '<p><code>&lt;Directory&gt;</code> <b>tidak</b> diwariskan antar VirtualHost. Vhost baru dengan DocumentRoot baru tanpa <code>Require all granted</code> akan mewarisi penolakan global <code>&lt;Directory /&gt;</code> dan membalas <b>403</b> pada semua file — termasuk index.html yang jelas-jelas ada. Gejala klasik: "file sudah benar, kok 403?" → periksa blok Directory di vhost itu.</p>'
    },
    {
      type: 'tip',
      title: 'Satu log per vhost membuat analisis 10× lebih mudah',
      text: '<p><code>ErrorLog</code> dan <code>CustomLog</code> boleh (dan sebaiknya) ditulis per vhost. Ketika satu website bermasalah, kamu tinggal membaca filenya tanpa menyaring ribuan baris milik website lain. Pada lab semuanya diarahkan ke stdout container agar terlihat lewat <code>podman logs apache-lab</code>; di produksi, arahkan ke file terpisah dan serahkan rotasi ke <code>logrotate</code>.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['VirtualHost', 'Satu blok konfigurasi mewakili satu website dalam satu proses Apache.'],
        ['Name-based', 'Vhost dipilih lewat header Host — butuh satu IP untuk banyak domain.'],
        ['Port-based / IP-based', 'Vhost dipilih dari port atau alamat IP tujuan.'],
        ['ServerName', 'Nama utama yang mewakili vhost.'],
        ['ServerAlias', 'Nama tambahan yang juga dilayani vhost yang sama.'],
        ['Default vhost', 'Blok pertama pada suatu IP:port; penerima Host yang tidak cocok.'],
        ['/etc/hosts', 'Tabel lokal pemetaan nama → IP untuk simulasi DNS.'],
        ['httpd -S', 'Perintah inspeksi seluruh vhost beserta default-nya.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tambahkan vhost ketiga di lab (mis. <code>blog.local</code>) dengan DocumentRoot sendiri, lengkap dengan blok <code>&lt;Directory&gt;</code>-nya, lalu uji dengan <code>curl -H "Host: blog.local"</code>.</li><li>Tukar urutan blok <code>app.conf</code> dan <code>api.conf</code>, jalankan <code>httpd -t</code> + <code>graceful</code>, lalu amati bagaimana <code>curl http://localhost:8080/</code> (tanpa Host) berubah — kembalikan urutan semula.</li><li>Hapus sengaja blok <code>&lt;Directory&gt;</code> pada vhost api, buktikan responsnya berubah menjadi 403, lalu pulihkan.</li><li>Tulis <code>ServerAlias www.app.local</code> dan buktikan <code>curl -H "Host: www.app.local:8080"</code> menampilkan halaman yang sama.</li></ol>'
    }
  ],
  recap: [
    'Virtual host dipilih dari header <code>Host</code> (name-based), port, atau IP; name-based paling umum karena satu IP melayani banyak domain.',
    'Blok <code>&lt;VirtualHost&gt;</code> pertama pada suatu port adalah <b>default vhost</b> — penerima Host yang tidak dikenal, bukan error 404.',
    'Tiap vhost wajib menulis sendiri <code>DocumentRoot</code> + blok <code>&lt;Directory&gt;</code> (tidak diwariskan antar vhost) beserta log-nya.',
    'Alat bukti: <code>curl -H "Host: ..."</code> untuk pengujian cepat, <code>httpd -S</code> untuk peta seluruh vhost, <code>/etc/hosts</code> bila ingin menulis nama domain langsung.'
  ]
});
