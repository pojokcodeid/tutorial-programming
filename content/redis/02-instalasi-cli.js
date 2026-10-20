/* ============================================================
   Pelajaran Redis — Bab 2: Instalasi Redis & Mengenal Redis CLI
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'instalasi-cli',
  title: 'Instalasi Redis & Mengenal Redis CLI',
  chapter: 'Fondasi',
  duration: '10–12 menit',
  intro: [
    'Sebelum belajar berenang, tentu kamu lebih dulu memasuki kolam yang airnya dangkal dan tenang. Untuk Redis, kolam itu adalah <b>lingkungan lokal di laptop sendiri</b>: satu container kecil yang bisa kamu nyalakan, dimatikan, dan dihancurkan tanpa rasa takut — tempat aman untuk mencoba perintah apa pun, termasuk yang salah.',
    'Bab ini menyiapkan segalanya: menjalankan Redis 7 lewat Docker dengan satu perintah, membuka <code>redis-cli</code> sebagai jendela percakapan ke server, memahami koneksi standar <b>127.0.0.1:6379</b> beserta opsi <code>-h</code>, <code>-p</code>, dan <code>-a</code>, lalu mempraktikkan perintah dasar dari <code>PING</code> sampai <code>INFO memory</code>. Kita juga menyentuh logical database 0–15, konfigurasi ringkas, dan perintah bantuan yang sering dilupakan.',
    'Setelah bab ini, kamu akan punya "otot tangan" untuk Redis: tahu cara menyalakan server, mengecek kesehatannya, menulis dan membaca data, serta mengenali perintah yang sebaiknya <i>tidak</i> pernah dijalankan sembarangan. Perintah-perintah itulah yang akan dipakai berulang di seluruh sisa materi.'
  ],
  objectives: [
    'Menjalankan server Redis 7 di Docker dan membukanya lewat redis-cli',
    'Menjelaskan koneksi standar 127.0.0.1:6379 serta penggunaan opsi -h, -p, dan -a',
    'Menjalankan perintah dasar: PING, SET, GET, EXISTS, TYPE, DEL, INFO, dan DBSIZE',
    'Menjelaskan logical database 0–15, konfigurasi dasar, serta perintah yang berbahaya di produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Menjalankan Redis dengan Docker</h3><p>Cara tercepat dan terbersih untuk memulai adalah memakai image resmi Redis. Dengan satu perintah, kamu mendapatkan server Redis 7 yang siap dipakai dan tidak meninggalkan bekas di sistem operasimu:</p><ul><li><code>docker run -d --name redis-tutorial -p 6379:6379 redis:7-alpine</code> — jalankan container bernama <code>redis-tutorial</code> di belakang layar, petakan port container 6379 ke port mesin 6379, pakai image <code>redis:7-alpine</code> yang ringan (ukurannya belasan MB).</li><li><code>docker exec -it redis-tutorial redis-cli</code> — masuk ke dalam container dan buka <code>redis-cli</code>; sekarang kamu "bicara" langsung ke server Redis.</li><li><code>docker logs -f redis-tutorial</code> — pantau log server; baris <code>Ready to accept connections</code> berarti server sudah siap melayani.</li></ul><p>Kenapa Docker? Karena versi Redis di macOS, Windows, atau distribusi Linux berbeda-beda dan terkadang sudah usang. Dengan container, semua orang di kelas ini memakai versi yang persis sama: Redis 7.x.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur dari terminal dan docker exec menuju redis-cli lalu redis-server pada port 6379 beserta logical database 0 sampai 15">
        <rect x="30" y="35" width="200" height="65" rx="10" class="u-box"/>
        <text x="130" y="60" class="u-title" text-anchor="middle">Terminal</text>
        <text x="130" y="84" class="u-lbl" text-anchor="middle">docker exec -it redis-tutorial</text>

        <line x1="238" y1="67" x2="288" y2="67" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="263" y="55" class="u-lbl" text-anchor="middle">buka</text>

        <rect x="292" y="35" width="170" height="65" rx="10" class="u-hd"/>
        <text x="377" y="62" class="u-title" text-anchor="middle">redis-cli</text>
        <text x="377" y="84" class="u-lbl" text-anchor="middle">klien REPL</text>

        <line x1="470" y1="67" x2="520" y2="67" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="495" y="55" class="u-lbl" text-anchor="middle">RESP</text>

        <rect x="524" y="35" width="206" height="65" rx="10" class="u-hl"/>
        <text x="627" y="62" class="u-title" text-anchor="middle">redis-server :6379</text>
        <text x="627" y="84" class="u-lbl" text-anchor="middle">127.0.0.1 · TCP</text>

        <line x1="627" y1="100" x2="627" y2="135" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="640" y="124" class="u-lbl" text-anchor="start">SELECT 0..15</text>

        <rect x="30" y="140" width="700" height="115" rx="10" class="u-box"/>
        <text x="380" y="164" class="u-title" text-anchor="middle">Logical database di dalam satu server</text>
        <line x1="46" y1="174" x2="714" y2="174" class="u-line"/>

        <rect x="46" y="192" width="38" height="40" rx="6" class="u-hd"/>
        <text x="65" y="217" class="u-lbl" text-anchor="middle">0</text>
        <rect x="89" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="108" y="217" class="u-lbl" text-anchor="middle">1</text>
        <rect x="132" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="151" y="217" class="u-lbl" text-anchor="middle">2</text>
        <rect x="175" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="194" y="217" class="u-lbl" text-anchor="middle">3</text>
        <rect x="218" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="237" y="217" class="u-lbl" text-anchor="middle">4</text>
        <rect x="261" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="280" y="217" class="u-lbl" text-anchor="middle">5</text>
        <rect x="304" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="323" y="217" class="u-lbl" text-anchor="middle">6</text>
        <rect x="347" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="366" y="217" class="u-lbl" text-anchor="middle">7</text>
        <rect x="390" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="409" y="217" class="u-lbl" text-anchor="middle">8</text>
        <rect x="433" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="452" y="217" class="u-lbl" text-anchor="middle">9</text>
        <rect x="476" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="495" y="217" class="u-lbl" text-anchor="middle">10</text>
        <rect x="519" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="538" y="217" class="u-lbl" text-anchor="middle">11</text>
        <rect x="562" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="581" y="217" class="u-lbl" text-anchor="middle">12</text>
        <rect x="605" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="624" y="217" class="u-lbl" text-anchor="middle">13</text>
        <rect x="648" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="667" y="217" class="u-lbl" text-anchor="middle">14</text>
        <rect x="691" y="192" width="38" height="40" rx="6" class="u-box"/>
        <text x="710" y="217" class="u-lbl" text-anchor="middle">15</text>

        <text x="380" y="247" class="u-lbl" text-anchor="middle">database 0 dipakai secara default · isi tiap database terpisah penuh</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Alur dari terminal (docker exec) ke redis-cli, lalu ke redis-server pada port 6379 yang berisi logical database 0 sampai 15</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menyalakan Redis dan Membuka CLI',
      lang: 'bash',
      output: false,
      code: `# 1. Jalankan server Redis 7 di belakang layar
docker run -d --name redis-tutorial -p 6379:6379 redis:7-alpine

# 2. Pastikan container sudah berjalan
docker ps --filter name=redis-tutorial

# 3. Masuk ke redis-cli di dalam container
docker exec -it redis-tutorial redis-cli

# 4. Uji koneksi dari dalam CLI (balasan yang diharapkan: PONG)
PING`,
      explain: [
        'Nama container <code>redis-tutorial</code> dibuat khusus agar mudah dikelola; bila ingin memulai dari awal, hancurkan dulu dengan <code>docker rm -f redis-tutorial</code>.',
        'Penulisan <code>-p 6379:6379</code> berarti <code>-p &lt;port-mesin&gt;:&lt;port-container&gt;</code>. Karena keduanya sama, klien mana pun bisa memakai alamat default <code>127.0.0.1:6379</code>.',
        '<code>PING</code> adalah paling dasar dari semua perintah: bila balasannya <code>PONG</code>, berarti jalur klien → server sehat dan server memang merespons.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menghubungkan: Host, Port, dan Kata Sandi</h3><p>Secara default <code>redis-cli</code> selalu menuju <code>127.0.0.1</code> (mesin sendiri) pada port <code>6379</code> tanpa kata sandi. Untuk situasi lain, tiga opsi ini yang paling sering dipakai:</p><ul><li><code>-h</code> — menentukan host; contoh <code>redis-cli -h 10.0.0.5</code> untuk server di mesin lain.</li><li><code>-p</code> — menentukan port; contoh <code>redis-cli -p 6380</code> bila server memakai port non-standar.</li><li><code>-a</code> — menentukan kata sandi; contoh <code>redis-cli -a rahasia123</code>. Redis juga mengenali lingkungan <code>REDISCLI_AUTH</code> agar sandi tidak tercatat di riwayat terminal.</li></ul><p>Satu kebiasaan baik sejak awal: jalankan <code>AUTH rahasia123</code> setelah terhubung bila server meminta autentikasi, dan jangan pernah menulis kata sandi di baris perintah pada mesin bersama — riwayat shell (<code>~/.bash_history</code>) menyimpan semuanya.</p>'
    },
    {
      type: 'example',
      title: 'Perintah Dasar Redis: Menulis dan Membaca Data',
      lang: 'redis',
      output: false,
      code: `PING
SET nama "Budi"
GET nama
SET kunjungan 10
INCR kunjungan
EXISTS nama
TYPE kunjungan
DEL nama
GET nama
DBSIZE`,
      explain: [
        '<code>SET nama "Budi"</code> membuat kunci <code>nama</code> berisi teks, lalu <code>GET nama</code> membacanya kembali; menulis ulang kunci yang sama berarti menimpa nilai lama.',
        '<code>EXISTS</code> mengembalikan 1 bila kunci ada dan 0 bila tidak, sementara <code>TYPE</code> memberi tahu tipe nilai tersimpan (misalnya <code>string</code>) — dua perintah wajib saat men-debug.',
        '<code>DEL nama</code> menghapus kunci selamanya sehingga <code>GET</code> berikutnya menghasilkan nilai kosong; <code>DBSIZE</code> menghitung jumlah kunci yang tersisa di database aktif.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memeriksa Kesehatan Server: INFO dan DBSIZE</h3><p>Saat aplikasi terasa lambat, pertanyaan pertama bukan "perintah apa yang salah" melainkan "seperti apa kondisi server". Tiga perintah berikut adalah stetoskop dasarnya:</p><ul><li><code>INFO server</code> — identitas dan versi Redis, waktu server berjalan, mode persistensi yang aktif.</li><li><code>INFO memory</code> — berapa RAM terpakai, berapa yang dialokasikan, status fragmentasi, serta batas <code>maxmemory</code>.</li><li><code>INFO keyspace</code> — jumlah kunci dan sisa hidup (TTL) per logical database.</li><li><code>DBSIZE</code> — angka cepat jumlah kunci pada database yang sedang aktif.</li></ul><p>Gunakan juga <code>INFO clients</code> untuk melihat berapa banyak koneksi yang terhubung, dan <code>INFO stats</code> untuk melihat total perintah yang telah dieksekusi. Semua keluaran <code>INFO</code> berupa pasangan <code>key:value</code> sehingga mudah diparse oleh sistem monitoring.</p>'
    },
    {
      type: 'example',
      title: 'Membaca Vital Signs Redis',
      lang: 'redis',
      output: false,
      code: `INFO server
INFO memory
DBSIZE
CONFIG get maxmemory
CONFIG get requirepass`,
      explain: [
        'Bagian <code>redis_version</code> pada <code>INFO server</code> memastikan kamu memang berbicara dengan Redis 7.x, bukan versi lama yang berbeda perilaku.',
        '<code>INFO memory</code> menampilkan <code>used_memory_human</code>; angka ini yang harus kamu pantau terus-menerus karena Redis dibatasi oleh kapasitas RAM.',
        '<code>CONFIG get</code> adalah cara aman membaca konfigurasi yang sedang berlaku tanpa membuka file <code>redis.conf</code> di server.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Logical Database 0–15</h3><p>Satu proses <code>redis-server</code> menyediakan <b>16 logical database</b> bernomor 0 sampai 15. Database 0 selalu dipakai secara diam-diam bila kamu tidak memberi perintah apa pun; ganti dengan <code>SELECT 3</code> untuk pindah ke database nomor 3. Tiap database memiliki ruang kunci yang <b>terpisah penuh</b>: kunci <code>nama</code> di database 0 tidak ada hubungannya dengan <code>nama</code> di database 1.</p><p>Kapan 16 database ini berguna? Umumnya hanya untuk <b>pengembangan dan pengujian</b> — misalnya database 0 untuk data aplikasi, database 1 untuk uji coba. Namun pada produksi, kebiasaan mengandalkan nomor database justru sering berujung buruk:</p><ul><li><b>Scalability terbatas</b> — Redis Cluster hanya memakai database 0; memakai database lain membuat migrasi ke cluster jauh lebih menyakitkan.</li><li><b>Kesadaran tooling rendah</b> — banyak alat monitoring, backup, dan klien hanya terhubung ke database 0.</li><li><b>Bukan pemisah keamanan</b> — logical database tidak memisahkan izin; satu kunci yang salah tetap bisa dihapus dari database mana pun.</li></ul><p>Saran praktis: di produksi, pakai <b>database 0 saja</b> dan pisahkan data lewat pola penamaan key (dibahas di Bab 4).</p>'
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi Dasar Redis</h3><p>Redis dikonfigurasi lewat file <code>redis.conf</code> yang dimuat saat server dinyalakan, dan sebagian besar pengaturan tetap bisa diubah saat server berjalan lewat <code>CONFIG SET</code>. Dua pengaturan paling penting untuk pemula:</p><ul><li><b>Kata sandi</b> — <code>requirepass rahasia123</code> pada file, atau <code>--requirepass rahasia123</code> bila Redis dijalankan langsung dari baris perintah.</li><li><b>Batas memori</b> — <code>maxmemory 256mb</code> agar Redis berhenti memakan seluruh RAM dan mulai menerapkan <i>eviction policy</i> (misalnya <code>allkeys-lru</code>).</li></ul><p>Lewat Docker, keduanya bisa diberikan sebagai argumen tambahan: <code>docker run -d --name redis-tutorial -p 6379:6379 redis:7-alpine redis-server --requirepass rahasia123 --maxmemory 256mb</code>. Perintah <code>CONFIG GET</code> dan <code>CONFIG SET</code> memungkinkan kamu meninjau dan mengubah pengaturan tersebut selagi server berjalan tanpa perlu restart.</p>'
    },
    {
      type: 'text',
      html: '<h3>Perintah Bantuan dan Pilihan Alat</h3><p>Redis CLI punya bantuan bawaan yang sering dilupakan pemula:</p><ul><li><code>HELP</code> — menampilkan ringkasan sintaks perintah yang sedang kamu ketik.</li><li><code>COMMAND DOCS set</code> — dokumentasi lengkap satu perintah, termasuk seluruh opsi dan argumennya.</li><li><code>CLEAR</code> — membersihkan layar terminal dari tumpukan balasan; alternatifnya Ctrl+L.</li><li><code>COMMAND COUNT</code> dan <code>COMMAND LIST</code> — menghitung serta menyebut semua perintah yang tersedia pada servermu.</li></ul><p>Selain <code>redis-cli</code>, ada beberapa alat bantu; tabel berikut membandingkannya agar kamu tahu kapan memakai yang mana:</p><table><thead><tr><th>Alat</th><th>Bentuk</th><th>Kekuatan</th><th>Kekurangan</th></tr></thead><tbody><tr><td><b>redis-cli</b></td><td>Terminal, bawaan server</td><td>Cepat, ringan, selalu ada, mendukung <code>--raw</code> untuk skrip</td><td>Manual, tanpa visualisasi memori</td></tr><tr><td><b>RedisInsight</b></td><td>Aplikasi GUI resmi Redis</td><td>Monitoring memori, browser key, analisis slow log</td><td>Lebih berat, perlu dipasang terpisah</td></tr><tr><td><b>redli</b></td><td>Alternatif klien interaktif</td><td>Autocomplete, riwayat, tampilan lebih rapi</td><td>Belum tentu tersedia di setiap sistem</td></tr></tbody></table><p>Untuk belajar, <code>redis-cli</code> sudah lebih dari cukup; pindah ke GUI ketika kamu mulai menyelidiki masalah memori atau pola key dalam jumlah besar.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern: Tiga Kebiasaan Berbahaya di Lingkungan Redis</h3><p>Lingkungan lokal memang tempat aman untuk mencoba segalanya — tetapi kebiasaan yang terbawa ke produksi bisa berujung bencana. Tiga di antaranya:</p><ul><li><b>Menjalankan Redis terbuka di jaringan publik tanpa kata sandi.</b> Redis tanpa <code>requirepass</code> yang terexpos ke internet sudah berulang kali diserbotan dalam hitungan menit; selalu batasi ke <code>127.0.0.1</code> atau jaringan privat, dan nyalakan autentikasi.</li><li><b>Menyalin konfigurasi default tanpa membatasi memori.</b> Tanpa <code>maxmemory</code>, Redis akan terus tumbuh sampai menghabiskan RAM server dan memaksa proses lain (bahkan container itu sendiri) mati.</li><li><b>Menganggap CLI produksi seperti kotak pasir.</b> Perintah yang terlihat sepele di terminal lokal bisa menghapus data jutaan pengguna bila terminal itu ternyata terhubung ke server produksi. Selalu periksa <code>INFO server</code> dan nama host sebelum menekan Enter.</li></ul>'
    },
    {
      type: 'example',
      title: 'Membiasakan Diri dengan Bantuan CLI',
      lang: 'redis',
      output: false,
      code: `HELP
COMMAND DOCS set
COMMAND COUNT
CLEAR
SELECT 0
SELECT 15
SELECT 0`,
      explain: [
        '<code>COMMAND DOCS set</code> menampilkan seluruh opsi <code>SET</code>, termasuk <code>EX</code>, <code>NX</code>, dan <code>KEEPTTL</code> yang akan dipakai pada Bab 4.',
        '<code>SELECT 0</code> sampai <code>SELECT 15</code> memindahkanmu antar logical database; perhatikan bahwa <code>DBSIZE</code> berubah mengikuti database yang sedang aktif.',
        '<code>CLEAR</code> hanya membersihkan layar — tidak menghapus satu pun data; justru itulah perbedaan mendasarnya dengan <code>FLUSHDB</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Berlatihlah di Lingkungan Lokal yang Bisa Dihancurkan',
      text: 'Buat kebiasaan menghancurkan dan membuat ulang container ketika belajar: <code>docker rm -f redis-tutorial</code> lalu jalankan lagi perintah <code>docker run</code>-nya. Dengan pola ini kamu bebas mencoba <code>FLUSHALL</code>, mengubah konfigurasi, atau memenuhi memori tanpa rasa takut — karena tidak ada satu pun data berharga di dalamnya.'
    },
    {
      type: 'warn',
      title: 'Dua Perintah yang Menghapus Semuanya',
      text: '<code>FLUSHDB</code> menghapus <b>seluruh kunci pada database yang sedang aktif</b>, sedangkan <code>FLUSHALL</code> menghapus seluruh 16 logical database sekaligus — keduanya tidak bisa dibatalkan dan tidak menampilkan konfirmasi apa pun. Di lingkungan produksi, jalankan hanya bila kamu benar-benar paham dampaknya. Perintah lain yang wajib dijaga adalah <code>MONITOR</code>: ia menyiarkan setiap perintah yang masuk secara real-time, membanjiri layar, dan menambah beban server — jangan dibiarkan menyala di terminal yang ditinggal.'
    },
    {
      type: 'vocab',
      items: [
        ['redis-server', 'Proses server Redis yang mendengarkan port TCP 6379 dan mengeksekusi seluruh perintah klien.'],
        ['redis-cli', 'Klien baris perintah bawaan Redis; berfungsi sebagai REPL interaktif untuk mencoba dan men-debug perintah.'],
        ['RESP', 'Protokol ringan berbasis baris teks yang dipakai antara klien dan server Redis.'],
        ['Logical database', 'Ruang kunci terpisah di dalam satu server Redis, bernomor 0–15; hanya database 0 yang dipakai oleh Redis Cluster.'],
        ['redis.conf', 'File konfigurasi utama Redis yang dimuat saat server dinyalakan; sebagian isinya bisa diubah saat jalan lewat CONFIG SET.'],
        ['requirepass', 'Pengaturan kata sandi pada Redis; bila diaktifkan, setiap koneksi wajib memanggil AUTH terlebih dahulu.'],
        ['maxmemory', 'Batas memori Redis; setelah tercapai, Redis menerapkan kebijakan eviction untuk memilih data yang dibuang.'],
        ['Slow log', 'Catatan perintah yang lambat; bisa dilihat lewat SLOWLOG GET untuk menemukan perintah bermasalah.']
      ]
    }
  ],
  recap: [
    'Redis paling mudah dicoba lewat Docker: docker run -d --name redis-tutorial -p 6379:6379 redis:7-alpine, lalu masuk dengan docker exec -it redis-tutorial redis-cli.',
    'Koneksi default menuju 127.0.0.1:6379; opsi -h, -p, dan -a dipakai untuk host, port, serta kata sandi yang berbeda.',
    'Perintah dasar mencakup PING, SET, GET, EXISTS, TYPE, DEL, INFO server, INFO memory, dan DBSIZE untuk menulis, membaca, serta mengecek kesehatan server.',
    'Satu server punya logical database 0–15, namun produksi sebaiknya hanya memakai database 0; FLUSHDB, FLUSHALL, dan MONITOR adalah perintah yang berbahaya bila dipakai sembarangan.'
  ]
});
