/* ============================================================
   Pelajaran Docker — Bab 9: Docker Networking Dasar (L9)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'docker-networking-dasar',
  title: 'Docker Networking – Bridge, User-defined Network',
  chapter: 'Networking',
  duration: '7–9 menit',
  intro: [
    'Secara bawaan, Docker sudah menyediakan jaringan untuk setiap container yang kamu buat. Pada bab ini kamu akan mempelajari jaringan dasar Docker: perbedaan antara bridge bawaan (default) dan bridge buatan sendiri (user-defined), serta bagaimana cara container bisa saling berkomunikasi.'
  ],
  objectives: [
    'Memahami konsep jaringan di Docker',
    'Mengenal network driver: bridge, host, none (pengantar)',
    'Membuat user-defined bridge network',
    'Menghubungkan container ke network & test koneksi',
    'Membedakan default bridge vs user-defined bridge'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dasar Jaringan Docker (Network Basics)</h3><p>Docker menyediakan jaringan secara otomatis bagi setiap container. Ketika sebuah container dibuat tanpa opsi <code>--network</code>, container tersebut akan masuk ke <b>jaringan bridge bawaan</b> (bernama <code>bridge</code>).</p><p>Berikut beberapa driver jaringan yang umum dipakai:</p><ul><li><b>bridge</b> – paling umum dipakai, berupa jaringan privat internal Docker (ini bawaan).</li><li><b>host</b> – container memakai susunan jaringan (network stack) milik host secara langsung sehingga kurang terisolasi.</li><li><b>none</b> – container tanpa jaringan sama sekali.</li><li><b>overlay</b> – dipakai untuk komunikasi antar beberapa host (dalam konteks Swarm atau Kubernetes).</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Melihat Jaringan yang Tersedia</h3><p>Kamu dapat melihat daftar jaringan beserta detail konfigurasinya dengan perintah berikut.</p>'
    },
    {
      type: 'example',
      title: 'docker network ls',
      lang: 'bash',
      output: false,
      code: `docker network ls

# Lihat detail sebuah network
docker network inspect bridge`,
      explain: [
        'Secara bawaan tersedia jaringan: <code>bridge</code>, <code>host</code>, dan <code>none</code>.',
        'Perintah <code>inspect</code> menampilkan container yang terhubung, rentang IP, dan konfigurasi lainnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Default Bridge vs User-defined Bridge</h3><p>Pada <b>bridge bawaan (default bridge)</b>:</p><ul><li>Container hanya dapat saling dijangkau melalui alamat IP, bukan nama container.</li><li>Tidak ada resolusi DNS otomatis antar container berdasarkan nama, sehingga kamu harus mengetahui IP-nya terlebih dahulu.</li><li>Kurang ideal untuk aplikasi yang terdiri dari banyak container.</li></ul><p>Pada <b>bridge buatan (user-defined bridge)</b>:</p><ul><li>Container dapat saling dijangkau menggunakan <b>nama container</b> sebagai hostname, berkat adanya DNS internal.</li><li>Isolasi lebih baik karena aplikasi kamu terpisah dari bridge bawaan.</li><li>Lebih aman dan nyaman untuk pengembangan maupun produksi.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Membuat User-defined Bridge Network</h3>'
    },
    {
      type: 'example',
      title: 'Buat network',
      lang: 'bash',
      output: false,
      code: `# Buat network custom
docker network create myapp-net

# Verifikasi
docker network ls

# Inspect
docker network inspect myapp-net`,
      explain: ['Nama network bebas, asal unik dalam host Docker.']
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Container di Network Buatan</h3><p>Sebagai latihan, kita jalankan dua container: <code>web</code> (nginx) dan <code>tester</code> (alpine). Keduanya dimasukkan ke dalam <code>myapp-net</code>, lalu kita uji koneksi di antara keduanya memakai <b>nama container</b>.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Dua container dalam user-defined bridge network dengan akses dari host">
        <rect x="40" y="130" width="680" height="180" rx="10" class="u-hd"/>
        <text x="380" y="160" class="u-title">myapp-net (user-defined bridge)</text>
        <rect x="60" y="30" width="240" height="60" rx="8" class="u-box"/>
        <text x="180" y="58" class="u-title">Browser di host</text>
        <text x="180" y="80" class="u-lbl" text-anchor="middle">localhost:8080</text>
        <line x1="180" y1="94" x2="180" y2="191" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="172" y="116" class="u-lbl" text-anchor="end">publish -p 8080:80</text>
        <rect x="90" y="195" width="230" height="90" rx="8" class="u-box"/>
        <text x="205" y="225" class="u-title">web</text>
        <text x="205" y="250" class="u-lbl" text-anchor="middle">nginx:alpine</text>
        <text x="205" y="272" class="u-lbl" text-anchor="middle">nama container = hostname</text>
        <rect x="440" y="195" width="230" height="90" rx="8" class="u-box"/>
        <text x="555" y="225" class="u-title">tester</text>
        <text x="555" y="250" class="u-lbl" text-anchor="middle">alpine (shell -it)</text>
        <text x="555" y="272" class="u-lbl" text-anchor="middle">ping web / wget http://web</text>
        <line x1="324" y1="240" x2="436" y2="240" class="u-line" marker-start="url(#u-arrow)" marker-end="url(#u-arrow)"/>
        <text x="380" y="226" class="u-lbl" text-anchor="middle">DNS nama → IP</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — Satu network berisi banyak container; host masuk lewat port yang dipublish</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Jalankan container & attach ke network',
      lang: 'bash',
      output: false,
      code: `# Jalankan web (nginx)
docker run -d --name web --network myapp-net nginx:alpine

# Jalankan tester (alpine)
docker run -it --rm --name tester --network myapp-net alpine sh`,
      explain: [
        'Keduanya sama-sama memakai <code>--network myapp-net</code> sehingga berada dalam jaringan yang sama.',
        'Setelah perintah kedua, kamu akan berada di dalam shell container <code>tester</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Uji koneksi antar container (dari tester)',
      lang: 'bash',
      output: false,
      code: `# Dari dalam container tester
ping -c 3 web
# atau
wget -O- http://web`,
      explain: [
        'Nama <code>web</code> dapat diterjemahkan menjadi IP container nginx karena bridge buatan memiliki <b>DNS internal</b> bawaan.',
        'Coba bandingkan bila keduanya hanya berada di bridge bawaan — di sana kamu harus memakai alamat IP secara langsung.'
      ]
    },
    {
      type: 'tip',
      title: 'Memeriksa IP container',
      text: 'Dari host, jalankan <code>docker inspect --format "{{.NetworkSettings.Networks.myapp-net.IPAddress}}" web</code>. Alternatif lain, masuk ke dalam container lalu jalankan <code>ip addr</code>.'
    },
    {
      type: 'text',
      html: '<h3>Menambah/Memutus Container dari Network</h3><p>Container yang sudah berjalan tetap dapat ditambahkan ke jaringan lain atau dilepas dari jaringannya.</p>'
    },
    {
      type: 'example',
      title: 'Connect &amp; disconnect',
      lang: 'bash',
      output: false,
      code: `# Hubungkan container yang sudah ada ke network lain
docker network connect myapp-net existing-container

# Putuskan dari network
docker network disconnect myapp-net existing-container`,
      explain: ['Satu container dapat terhubung ke beberapa jaringan sekaligus (multi-network).']
    },
    {
      type: 'text',
      html: '<h3>Menghapus Network</h3><p>Sebuah network tidak dapat dihapus selama masih ada container yang terhubung ke dalamnya. Karena itu, lepaskan atau hapus container terlebih dahulu.</p>'
    },
    {
      type: 'example',
      title: 'Menghapus network',
      lang: 'bash',
      output: false,
      code: `# Hapus container terlebih dahulu
docker stop web tester 2>/dev/null; docker rm web tester 2>/dev/null

# Baru hapus network
docker network rm myapp-net

# Atau bersihkan seluruh network yang tidak terpakai
docker network prune`,
      explain: ['Perintah <code>network prune</code> aman dijalankan asalkan kamu yakin bahwa jaringan tersebut memang tidak terpakai.']
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Hindari memakai <code>--network host</code> untuk aplikasi yang membuka (mempublish) port, karena bisa menyebabkan bentrok port. Untuk sebagian besar keperluan pengembangan, bridge bawaan atau bridge buatan sudah memadai.'
    },
    {
      type: 'vocab',
      items: [
        ['Bridge network', 'Jaringan virtual privat untuk komunikasi antar container (bawaan Docker).'],
        ['User-defined bridge', 'Bridge yang dibuat manual, lebih nyaman karena mendukung DNS berbasis nama.'],
        ['DNS resolution', 'Kemampuan menerjemahkan nama container menjadi alamat IP.'],
        ['connect', 'Menambahkan container ke sebuah jaringan.'],
        ['disconnect', 'Melepas container dari sebuah jaringan.'],
        ['network inspect', 'Menampilkan detail konfigurasi sebuah jaringan.']
      ]
    }
  ],
  recap: [
    'Bridge bawaan berkomunikasi melalui IP, tanpa dukungan DNS berdasarkan nama.',
    'Bridge buatan berkomunikasi melalui <b>nama container</b> sehingga jauh lebih praktis.',
    'Membuat: <code>docker network create nama</code>, memakai: <code>--network nama</code>.',
    'Menguji koneksi antar container: <code>curl http://nama-container</code> atau <code>ping nama-container</code>.',
    'Sebelum menghapus jaringan, stop lalu hapus container-nya terlebih dahulu, baru <code>network rm</code>.'
  ]
});