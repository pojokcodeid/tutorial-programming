/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 2: Setup Podman & Podman Compose
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-podman',
  title: 'Setup Podman & Podman Compose',
  chapter: 'Fondasi',
  duration: '13 menit',
  intro: [
    'Sebelum menulis kode satu baris pun, seluruh infrastruktur TokoKita harus bisa dinyalakan dengan satu perintah. Bab ini menyiapkan <b>Podman</b> — pengganti Docker yang berjalan tanpa daemon, aman untuk pengguna biasa (rootless), dan menjadi pilihan di seluruh materi container di situs ini.',
    'Kita akan memasang Podman beserta mesin virtualnya (khusus macOS/Windows), memahami perbedaan mendasar Podman dari Docker, memasang Podman Compose untuk menjalankan banyak container sekaligus, lalu memahami tiga konsep yang akan dipakai berulang di komposer TokoKita: <b>image, container, dan volume</b>.',
    'Di akhir bab kamu akan mampu menyalakan, memeriksa, dan mematikan satu container mandiri — keterampilan yang dipakai terus di bab-bab berikutnya ketika tiba waktunya menyusun seluruh stack dalam satu berkas <code>compose.yaml</code>.'
  ],
  objectives: [
    'Memasang Podman dan mesin Podman di macOS, Windows, maupun Linux',
    'Menjelaskan perbedaan Podman dari Docker: rootless, tanpa daemon, dan fork-friendly',
    'Memasang Podman Compose serta mengetahui dua pilihan penyedia compose',
    'Menjalankan, memeriksa, dan membersihkan container dengan perintah inti Podman',
    'Memahami peran image, container, volume, dan network dalam konteks TokoKita'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Memasang Podman</h3><p>Podman (Pod Manager) adalah proyek open source dari Red Hat yang mengelola container, image, dan pod tanpa memerlukan daemon berjalan sebagai root. Pemasangannya berbeda tiap sistem operasi, tetapi semuanya ringkas.</p>'
    },
    {
      type: 'example',
      title: 'Memasang Podman di tiga sistem operasi',
      lang: 'bash',
      output: false,
      code: `# macOS (Homebrew)
brew install podman

# Linux (Debian/Ubuntu)
sudo apt-get update
sudo apt-get install -y podman

# Windows (winget — memakai WSL2 di latar belakang)
winget install RedHat.Podman

# ----- khusus macOS & Windows: mesin virtual -----
# Linux tidak memerlukan langkah ini karena container berjalan langsung
# di kernel host.
podman machine init        # buat mesin (sekali saja)
podman machine start       # nyalakan mesin
podman machine list        # pastikan status "Currently running"

# ----- uji kesehatan instalasi -----
podman version
podman run quay.io/podman/hello`,
      explain: [
        'Perintah <code>podman machine</code> hanya ada di macOS dan Windows. Di Linux, Podman berbicara langsung ke kernel sehingga tidak butuh lapisan tambahan.',
        'Uji akhir memakai image resmi <code>quay.io/podman/hello</code> yang sangat kecil — bila pesan selamat datang muncul, instalasimu sudah siap kerja.',
        'Bila <code>podman run</code> gagal dengan pesan "machine not running", jalankan <code>podman machine start</code> — ini keluhan paling umum pengguna macOS.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Podman bekerja lewat podman machine: perintah CLI dari host dikirim ke VM Linux yang berisi image, container, dan volume">
        <defs><marker id="mk-fs02-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="15" y="40" width="300" height="200" rx="10" class="u-box"/>
        <text x="165" y="70" class="u-title">Host — terminal kamu</text>
        <rect x="35" y="88" width="260" height="40" rx="6" class="u-hd"/>
        <text x="165" y="113" class="u-title">podman &amp; podman-compose</text>
        <text x="165" y="155" class="u-lbl" text-anchor="middle">tanpa daemon — perintah lewat API socket</text>
        <text x="165" y="178" class="u-lbl" text-anchor="middle">berkas: compose.yaml, kode, migrations</text>
        <text x="165" y="201" class="u-lbl" text-anchor="middle">podman-compose up -d</text>
        <line x1="315" y1="140" x2="412" y2="140" class="u-line" marker-end="url(#mk-fs02-1)"/>
        <text x="363" y="128" class="u-lbl" text-anchor="middle">socket API</text>
        <rect x="420" y="40" width="325" height="235" rx="10" class="u-box"/>
        <text x="582" y="68" class="u-title">podman machine (VM Linux, rootless)</text>
        <rect x="440" y="84" width="285" height="52" rx="6" class="u-hl"/>
        <text x="582" y="105" class="u-title">images</text>
        <text x="582" y="125" class="u-lbl" text-anchor="middle">mariadb:11.4 · redis:7 · rabbitmq:3.13 · golang</text>
        <rect x="440" y="146" width="285" height="52" rx="6" class="u-hl"/>
        <text x="582" y="167" class="u-title">containers</text>
        <text x="582" y="187" class="u-lbl" text-anchor="middle">product :8081 · order :8082 · notif :8083 · frontend :8080</text>
        <rect x="440" y="208" width="285" height="52" rx="6" class="u-hl"/>
        <text x="582" y="229" class="u-title">volumes</text>
        <text x="582" y="249" class="u-lbl" text-anchor="middle">db-data · redis-data · mq-data (data bertahan)</text>
        <text x="380" y="292" class="u-lbl" text-anchor="middle">rootless: "root" di dalam container adalah akunmu sendiri di host</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Podman CLI di host mengendalikan podman machine: image, container, dan volume hidup di dalam VM</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Perbedaan Podman dari Docker</h3><p>Bagi kamu yang terbiasa Docker, hampir semua perintah inti berpindah tempat dengan nama yang sama: <code>run</code>, <code>build</code>, <code>images</code>, <code>ps</code>, <code>exec</code>, <code>logs</code>. Namun tiga perbedaan berikut layak dipahami sejak awal karena memengaruhi cara kamu menulis komposer nanti.</p>'
    },
    {
      type: 'example',
      title: 'Tiga perbedaan penting Podman vs Docker',
      lang: 'text',
      output: false,
      code: `1. TANPA DAEMON
   Docker: satu proses dockerd root mengelola semua container.
   Podman:  setiap container adalah proses mandiri milik user-mu.
            Tidak ada "dockerd" yang bisa jadi titik gagal tunggal.

2. ROOTLESS SEBAGAI BAWAAN
   Container berjalan sebagai user biasa — kebocoran dari dalam
   container jauh lebih sulit menjangkau host.

3. DEKLARATIF VS IMPERATIF
   Docker: "docker compose up" memakai compose sebagai lapisan tambahan.
   Podman : "podman compose" mendelegasikan ke penyedia compose
            (podman-compose atau docker-compose); alternatif lain
            memakai "podman generate kube" untuk manifest Kubernetes.`,
      explain: [
        'Karena tanpa daemon, <code>sudo</code> tidak diperlukan pada Linux untuk operasi container sehari-hari — perintahmu berjalan dengan hak akses user biasa.',
        'Model "satu container satu proses" membuat <code>podman ps</code> di host menampilkan proses nyata yang bisa diperiksa dengan <code>ps</code> biasa; ini sangat membantu ketika debugging.',
        'Perintah <code>podman compose</code> membutuhkan penyedia compose yang terpasang — inilah yang akan kita siapkan di bagian berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Podman Compose: Menyusun Banyak Container</h3><p>TokoKita butuh tujuh container berjalan serentak: MariaDB, Redis, RabbitMQ, tiga service Go, dan frontend. Menjalankan semuanya dengan tujuh perintah <code>podman run</code> adalah pekerjaan membosankan yang rawan salah ketik. <b>Podman Compose</b> menyelesaikannya dengan satu berkas deklaratif bernama <code>compose.yaml</code>.</p><p>Kata "compose" di Podman punya dua penyedia yang perlu kamu ketahui. Keduanya membaca berkas <code>compose.yaml</code> yang sama — pilihanmu hanya menentukan alat mana yang mengeksekusi.</p>'
    },
    {
      type: 'example',
      title: 'Dua penyedia compose untuk Podman',
      lang: 'bash',
      output: false,
      code: `# Pilihan A — podman-compose (klasik, Python)
#   Dibuat khusus untuk Podman; dukungan fitur compose v2 masih menyusul.
brew install podman-compose            # macOS
pip3 install podman-compose            # Linux
podman-compose up -d

# Pilihan B — docker-compose sebagai provider podman compose
#   Memakai implementasi compose resmi, dikendalikan lewat socket Podman.
brew install docker-compose
export DOCKER_HOST="unix://\$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
podman compose up -d

# Periksa penyedia yang terdeteksi
podman compose version`,
      explain: [
        'Keduanya membaca berkas <code>compose.yaml</code> yang sama persis; perbedaannya hanya pada alat yang mengeksekusi — tidak ada perubahan isi berkas.',
        'Untuk TokoKita, cukup salah satu dari keduanya yang terpasang. Bila ragu, mulailah dari <code>podman-compose</code> yang paling ringkas dipasang.',
        'Variabel <code>DOCKER_HOST</code> tidak berarti kamu memakai Docker — ia hanya memberi tahu docker-compose ke mana harus menyambung, yaitu socket milik Podman.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Praktik: Satu Container Mandiri</h3><p>Sebelum menyusun seluruh stack, biasakan diri dengan siklus hidup satu container. Kita pakai MariaDB — container yang akan menjadi tulang punggung TokoKita di bab berikutnya.</p>'
    },
    {
      type: 'example',
      title: 'Siklus hidup container MariaDB',
      lang: 'bash',
      output: false,
      code: `# Jalankan MariaDB di latar belakang dengan nama & variabel yang jelas
podman run -d \\
  --name tokokita-db \\
  -p 3306:3306 \\
  -e MARIADB_ROOT_PASSWORD=root-local \\
  docker.io/library/mariadb:11.4

# Periksa container berjalan
podman ps

# Lihat log sampai muncul pesan siap menerima koneksi
podman logs -f tokokita-db        # Ctrl+C untuk berhenti mengikuti log

# Masuk ke dalam container dan bicara dengan mariadb client
podman exec -it tokokita-db mariadb -uroot -proot-local

# Di dalam client, coba perintah sederhana:
#   SELECT VERSION();
#   SHOW DATABASES;
#   EXIT;

# Hentikan dan hapus container (image tetap tersimpan)
podman stop tokokita-db
podman rm tokokita-db`,
      explain: [
        'Flag <code>-d</code> menjalankan container terpisah dari terminal (detached); <code>--name</code> memberi nama agar perintah berikutnya tidak perlu menyalin ID panjang.',
        'Port dipetakan dengan pola <code>-p HOST:CONTAINER</code>: 3306 di dalam container menjadi 3306 di komputermu — karena itu aplikasi lokal bisa menyambung ke <code>localhost:3306</code>.',
        'Perintah <code>exec -it</code> membuka sesi interaktif DI DALAM container; perubahan yang kamu buat di sana hilang bersama container saat dihapus (stateless principle).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Image, Container, Volume, dan Network</h3><p>Empat kata ini akan muncul di setiap pelajaran berikutnya. Pahami hubungan mereka sekarang agar komposer di bab 3 terasa sebagai satu bahasa yang utuh, bukan tumpukan kutipan asing.</p>'
    },
    {
      type: 'example',
      title: 'Hubungan empat konsep inti Podman',
      lang: 'text',
      output: false,
      code: `IMAGE        cetak biru hanya-baca (mis. mariadb:11.4)
   │  podman build / podman pull
   ▼
CONTAINER    keadaan berjalan yang lahir dari image
   │  podman run
   ▼  punya: proses, filesystem sementara, network stack
   │
VOLUME       disk persisten yang TETAP ADA walau container dihapus
   │  -v db-data:/var/lib/mysql
   ▼  dipakai MariaDB, Redis, RabbitMQ untuk data sungguhan

NETWORK      jembatan virtual antar container di dalam podman
   default "podman" membuat container saling menemukan
   lewat NAMA SERVICE (mariadb, redis, rabbitmq) tanpa IP statis`,
      explain: [
        'Pembagian ini menjawab pertanyaan "kenapa data hilang setelah container dihapus?" — karena tanpa volume, seluruh tulisan menempel pada lapisan sementara container.',
        'Di komposer TokoKita kita memakai tiga volume bernama (<code>db-data</code>, <code>redis-data</code>, <code>mq-data</code>) agar data bertahan walau <code>podman compose down</code> dijalankan (tanpa flag <code>-v</code>).',
        'Pemakaian nama service sebagai hostname adalah fitur bawaan compose: <code>mariadb</code>, <code>redis</code>, dan <code>rabbitmq</code> akan dipakai langsung sebagai alamat di DSN dan URL aplikasi Go.'
      ]
    },
    {
      type: 'tip',
      title: 'Simpanlah Log Container Saat Pertama Kali Gagal',
      text: 'Ketika stack tidak menyala seperti harapan, <code>podman compose logs -f &lt;nama-service&gt;</code> adalah dokter pertamamu. Pada TokoKita, tiga penyebab paling umum: mesin podman belum <code>start</code>, port sudah dipakai container lama (periksa dengan <code>podman ps -a</code>), atau migrasi database belum selesai saat service mencoba menyambung (lihat pesan "database belum siap" di log service).'
    },
    {
      type: 'warn',
      title: 'Image Resmi, Bukan Tag Sembarangan',
      text: 'Selalu tarik image dari sumber resmi dengan tag versi penuh: <code>docker.io/library/mariadb:11.4</code>, bukan <code>mariadb</code> saja. Tag kosong menunjuk <code>latest</code> yang isinya berubah tanpa pemberitahuan — hari ini aplikasimu jalan, besok build gagal tanpa ada satu baris kode pun yang kamu ubah. Di <code>compose.yaml</code> TokoKita, semua image memakai tag versi tetap.'
    },
    {
      type: 'vocab',
      items: [
        ['Podman', 'Manajer container rootless tanpa daemon dari Red Hat; mengelola image, container, pod, dan volume dengan perintah serupa Docker.'],
        ['Podman machine', 'Mesin virtual kecil (Linux) yang menampung container di macOS dan Windows; wajib dijalankan sebelum memakai Podman di kedua sistem tersebut.'],
        ['Rootless', 'Mode bawaan Podman di mana container berjalan dengan hak akses user biasa, bukan root — mengurangi risiko kebocoran ke host.'],
        ['Compose', 'Format berkas deklaratif (compose.yaml) yang mendeskripsikan banyak service sekaligus; dieksekusi oleh podman-compose atau docker-compose.'],
        ['Image', 'Cetak biru hanya-baca berisi sistem berkas dan metadata; menjadi dasar pembuatan container.'],
        ['Container', 'Keadaan berjalan yang lahir dari image, lengkap dengan proses, lapisan tulis sementara, dan network stack sendiri.'],
        ['Volume', 'Penyimpanan persisten di luar container; dipakai agar data database, cache, dan pesan tetap ada setelah container dihapus.'],
        ['Network compose', 'Jaringan virtual bersama di mana tiap service bisa saling menemukan lewat nama service, bukan alamat IP yang berubah-ubah.']
      ]
    }
  ],
  recap: [
    'Podman berjalan rootless tanpa daemon; di macOS/Windows ia membutuhkan <code>podman machine</code> yang harus <code>start</code> sebelum dipakai.',
    'Hampir semua perintah Docker berpindah dengan nama sama; perbedaan utamanya: tanpa daemon, rootless sebagai bawaan, dan <code>podman compose</code> mendelegasikan ke penyedia compose.',
    'Podman Compose membaca satu berkas <code>compose.yaml</code>; pilihannya antara podman-compose (klasik) atau docker-compose sebagai provider.',
    'Siklus hidup container dikuasai lewat <code>run</code>, <code>ps</code>, <code>logs</code>, <code>exec</code>, <code>stop</code>, dan <code>rm</code> — tanpa menyentuh image yang menjadi cetak birunya.',
    'Image adalah cetak biru, container keadaan berjalan, volume disk persisten, dan network jembatan antar container — keempatnya akan dipakai langsung di compose.yaml TokoKita.'
  ]
});
