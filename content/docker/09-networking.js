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
    'Secara default, container bisa saling komunikasi? Tergantung network-nya. Di sini kamu belajar network dasar Docker: bridge default vs user-defined bridge, plus cara container saling "ngobrol".'
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
      html: '<h3>Docker Network Basics</h3><p>Docker otomatis menyediakan jaringan untuk container. Saat container dibuat tanpa <code>--network</code>, ia masuk ke <b>bridge network</b> default (<code>bridge</code>).</p><p>Beberapa driver umum:</p><ul><li><b>bridge</b> – paling umum, private network internal Docker (default)</li><li><b>host</b> – share network stack host (kurang terisolasi)</li><li><b>none</b> – tanpa jaringan</li><li><b>overlay</b> – untuk multi-host (Swarm/K8s context)</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Melihat Network yang Ada</h3>'
    },
    {
      type: 'example',
      title: 'docker network ls',
      lang: 'bash',
      output: false,
      code: `docker network ls

# Lihat detail network
docker network inspect bridge`,
      explain: [
        'Secara default ada: <code>bridge</code>, <code>host</code>, <code>none</code>.',
        '<code>inspect</code> menunjukkan container yang terhubung, IP range, dll.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Default Bridge vs User-defined Bridge</h3><p>Pada <b>default bridge</b>:</p><ul><li>Container cuma bisa saling reach pakai IP (bukan nama container)</li><li>DNS resolution antar container terbatas</li><li>Kurang ideal untuk multi-container app</li></ul><p>Pada <b>user-defined bridge</b>:</p><ul><li>Container bisa saling reach pakai <b>nama container</b> sebagai hostname</li><li>Isolasi lebih baik (app terpisah dari default bridge)</li><li>Lebih aman & nyaman untuk development</li></ul>'
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
      html: '<h3>Menjalankan Container di Network Custom</h3><p>Kita coba 2 container: <code>web</code> (nginx) dan <code>tester</code> (alpine). Kedua masuk ke <code>myapp-net</code>. Lalu test ping/curl via <b>nama container</b>.</p>'
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
        'Keduanya pakai <code>--network myapp-net</code>.',
        'Kamu sekarang ada di shell <code>tester</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Test koneksi antar container (dari tester)',
      lang: 'bash',
      output: false,
      code: `# Dari dalam container tester
ping -c 3 web
# atau
wget -O- http://web`,
      explain: [
        '<code>web</code> bisa di-resolve jadi IP container nginx karena user-defined bridge punya <b>internal DNS</b>.',
        'Coba bandingin kalau keduanya cuma di default bridge → harus pakai IP.'
      ]
    },
    {
      type: 'tip',
      title: 'Cek IP container',
      text: 'Dari host: <code>docker inspect --format "{{.NetworkSettings.Networks.myapp-net.IPAddress}}" web</code>. Atau masuk container & <code>ip addr</code>.'
    },
    {
      type: 'text',
      html: '<h3>Attach/Detach Container ke Network</h3><p>Container yang sudah berjalan bisa dipindah/ditambah ke network lain.</p>'
    },
    {
      type: 'example',
      title: 'Attach & detach',
      lang: 'bash',
      output: false,
      code: `# Hubungkan container yang sudah ada ke network lain
docker network connect myapp-net existing-container

# Putuskan dari network
docker network disconnect myapp-net existing-container`,
      explain: ['Satu container bisa terhubung ke beberapa network (multi-network).']
    },
    {
      type: 'text',
      html: '<h3>Menghapus Network</h3><p>Network tidak bisa dihapus kalau masih ada container terhubung.</p>'
    },
    {
      type: 'example',
      title: 'Remove network',
      lang: 'bash',
      output: false,
      code: `# Hapus container dulu
docker stop web tester 2>/dev/null; docker rm web tester 2>/dev/null

# Hapus network
docker network rm myapp-net

# Atau bersihin network unused
docker network prune`,
      explain: ['<code>network prune</code> aman asal kamu yakin network unused.']
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pakai <code>--network host</code> untuk app yang expose port (bisa bentrok). Cukup bridge/user-defined bridge untuk kebanyakan kasus dev.'
    },
    {
      type: 'vocab',
      items: [
        ['Bridge network', 'Jaringan virtual private antar container (default).'],
        ['User-defined bridge', 'Bridge buatan manual, lebih nyaman (DNS by name).'],
        ['DNS resolution', 'Kemampuan resolve nama container → IP address.'],
        ['connect', 'Menambahkan container ke network tambahan.'],
        ['disconnect', 'Melepas container dari network.'],
        ['network inspect', 'Lihat detail konfigurasi network.']
      ]
    }
  ],
  recap: [
    'Default bridge: komunikasi via IP, DNS by name terbatas.',
    'User-defined bridge: komunikasi via <b>nama container</b> (praktis).',
    'Buat: <code>docker network create nama</code>, pakai: <code>--network nama</code>.',
    'Test antar container: <code>curl http://nama-container</code> atau <code>ping nama-container</code>.',
    'Bersihin: stop/rm container dulu baru <code>network rm</code>.'
  ]
});