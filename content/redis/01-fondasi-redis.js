/* ============================================================
   Pelajaran Redis — Bab 1: Memahami Fondasi Redis
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'fondasi-redis',
  title: 'Memahami Fondasi Redis',
  chapter: 'Fondasi',
  duration: '10–12 menit',
  intro: [
    'Bayangkan sebuah warung kopi yang selalu ramai. Baristanya tidak membuka buku besar arsip di gudang setiap kali ada yang pesan; ia cukup menempel daftar menu dan antrean pesanan yang sedang berjalan tepat di depan matanya, sehingga semuanya bisa dijawab dalam sekejap. <b>Redis</b> bekerja persis seperti daftar depan itu — sebuah basis data yang menaruh seluruh datanya di <i>RAM</i>, sehingga pertanyaan paling sering muncul dijawab tanpa perlu menyeret-nyeret piringan keras.',
    'Konsepnya sederhana: data disimpan sebagai pasangan <b>key</b> (kunci) dan <b>value</b> (nilai), tetapi nilai di Redis bukan cuma teks biasa — bisa daftar, himpunan, hash, bahkan peringkat berurutan. Karena semua berada di memori dan dilayani satu proses tunggal yang bergiliran melayani ribuan koneksi, Redis mampu melayani ratusan ribu operasi per detik dengan latensi mikrodetik. Harganya jelas: kapasitas RAM terbatas dan data bisa ikut hilang saat server mati mendadak, sehingga Redis dirancang sebagai <b>lapisan akses cepat</b> — bukan satu-satunya tempat data hidup.',
    'Bab ini adalah <b>Tahap 0</b> dari peta belajar Redis. Kita mulai dari pertanyaan paling mendasar: apa itu Redis dan mengapa ia bisa secepat itu; bagaimana servernya bekerja dengan <i>event loop</i> non-blocking; bagaimana arsitektur client-server-nya di port 6379; lalu perbandingan tegas dengan MariaDB/PostgreSQL dan Memcached, peta use case nyata, kapan Redis cocok — dan yang paling penting — kapan ia <i>tidak</i> boleh dipakai.'
  ],
  objectives: [
    'Menjelaskan apa itu Redis dan alasan basis data in-memory bisa melayani operasi dalam hitungan mikrodetik',
    'Menguraikan cara kerja server Redis: event loop single-threaded dengan non-blocking I/O dan multiplexing',
    'Membandingkan Redis dengan MariaDB/PostgreSQL maupun Memcached untuk memilih alat yang tepat',
    'Menentukan data apa yang layak masuk Redis dan data apa yang wajib tetap di database utama'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa Itu Redis?</h3><p><b>Redis</b> adalah kependekan dari <i>REmote DIctionary Server</i> — proyek sumber terbuka yang ditulis pertama kali oleh Salvatore Sanfilippo (dikenal dengan alias antirez) pada 2009, dan kini menjadi salah satu basis data paling banyak dipakai di dunia. Secara teknis Redis adalah <b>penyimpan berbasis key-value yang bekerja di memori utama</b> (in-memory), namun dengan keunggulan yang tidak dimiliki cache sederhana: ia menyediakan delapan struktur data — string, list, set, sorted set, hash, bitmap, HyperLogLog, dan geospatial — lengkap dengan operasi khusus yang cerdas untuk masing-masing.</p><p>Analoginya sebuah kamus yang selalu terbuka di halaman depan: kamu tidak perlu membolak-balik lembar, cukup menunjuk kunci lalu membaca nilainya. Dalam praktiknya Redis dipakai sebagai lapisan <b>cache</b> di depan database relasional, penyimpan <b>sesi pengguna</b>, penghitung kunjungan, penjaga <b>rate limiter</b>, sampai pengatur <b>distributed lock</b> antar banyak server.</p>'
    },
    {
      type: 'text',
      html: '<h3>In-Memory: Mengapa Redis Bisa Secepat Kilat</h3><p>Perbedaan utama Redis terletak pada tempat data disimpan. Agar terasa nyata, bandingkan latensi baca kasar per akses: RAM sekitar <b>0,0001 milidetik</b>, SSD sekitar <b>0,1 milidetik</b>, sedangkan piringan keras (HDD) sekitar <b>10 milidetik</b>. Artinya membaca dari RAM bisa <b>100 kali lebih cepat</b> daripada SSD dan puluhan ribu kali lebih cepat daripada HDD. Ditambah lagi, operasi Redis memakai struktur hash berkompleksitas rata-rata <b>O(1)</b> — waktu eksekusi tidak ikut memanjang walau data sudah jutaan entri.</p><p>Hasilnya: Redis sanggup melayani ratusan ribu bahkan jutaan operasi per detik pada mesin modern. Konsekuensinya juga harus dipahami sejak awal: ukuran data dibatasi kapasitas RAM yang harganya jauh lebih mahal per gigabanya daripada disk, dan bila proses Redis mati mendadak, isi memori ikut lenyap kecuali Redis menyimpan <b>snapshot RDB</b> atau <b>log AOF</b> ke disk. Karena itu pola yang lazim adalah data tetap hidup di database utama, sementara Redis menyalin (dan menyalin lagi) bagian yang paling sering dibaca.</p>'
    },
    {
      type: 'text',
      html: '<h3>Key-Value Store: Model Data Paling Sederhana</h3><p>Semua akses di Redis berangkat dari satu pertanyaan: <i>key apa yang kamu cari?</i> Model ini sangat sederhana namun justru menjadi sumber kecepatannya.</p><ul><li><b>Key bersifat unik</b> — di dalam satu logical database, satu key hanya boleh punya satu nilai; menulis key yang sama berarti menimpa nilai lama.</li><li><b>Key berupa string biner</b> — bebas berisi teks apa pun selama tidak kosong; format penamaan seperti <code>user:1234:profile</code> murni kesepakatan tim, bukan aturan Redis.</li><li><b>Value punya tipe</b> — nilai bisa berupa string, list, set, sorted set, hash, bitmap, HyperLogLog, atau geospatial, dan tipe ini menentukan perintah apa yang boleh dipakai.</li><li><b>Tanpa JOIN dan tanpa kueri lintas-tabel</b> — Redis hanya mengambil data lewat kunci; analisis rumit tetap urusan database relasional.</li></ul><p>Sifat sederhana inilah yang membuat Redis bebas dari pekerjaan berat yang dialami database relasional: tidak ada perencana kueri, tidak ada kunci asing, tidak ada rekonsiliasi transaksi banyak baris.</p>'
    },
    {
      type: 'text',
      html: '<h3>Cara Kerja Server: Satu Thread, Ribuan Koneksi</h3><p>Mendengar "satu thread" sering kali membuat orang ragu: bukankah seharusnya satu thread justru lambat? Pada kasus Redis justru sebaliknya. Servernya memakai pola <b>event loop dengan non-blocking I/O</b> (multiplexing memakai <code>epoll</code> di Linux atau <code>kqueue</code> di macOS/BSD): satu proses utama bergiliran membaca permintaan dari ribuan koneksi, mengeksekusinya, lalu menulis balasan — semuanya dalam satu putaran tanpa berpindah-pindah konteks.</p><ul><li><b>Tanpa ganti konteks</b> — tidak ada thread yang berebut CPU, tidak ada <i>lock</i> untuk data yang sama.</li><li><b>Operasi atomik secara alami</b> — karena eksekusi satu per satu, perintah seperti <code>INCR</code> tidak perlu mekanisme kunci tambahan.</li><li><b>Kapan melambat?</b> — command yang menelusuri banyak data (<code>KEYS *</code>, <i>range</i> panjang), koleksi berukuran jutaan, atau script Lua panjang akan menahan seluruh antrean koneksi lain.</li></ul><p>Sejak Redis 6 ada <i>I/O threads</i> untuk membaca dan menulis jaringan secara paralel, tetapi <b>eksekusi command tetap berjalan di satu thread</b> — itulah alasan Redis selalu menekankan: jangan mengeksekusi perintah berat di produksi.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Arsitektur aplikasi dengan Redis sebagai lapisan cache di depan MariaDB sebagai sumber kebenaran">
        <rect x="30" y="55" width="180" height="80" rx="10" class="u-box"/>
        <text x="120" y="85" class="u-title" text-anchor="middle">Aplikasi</text>
        <text x="120" y="110" class="u-lbl" text-anchor="middle">web / API / worker</text>

        <line x1="218" y1="85" x2="286" y2="85" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="252" y="72" class="u-lbl" text-anchor="middle">1 · GET</text>

        <rect x="290" y="55" width="180" height="80" rx="10" class="u-hl"/>
        <text x="380" y="85" class="u-title" text-anchor="middle">Redis (cache)</text>
        <text x="380" y="110" class="u-lbl" text-anchor="middle">data di RAM, milidetik</text>

        <line x1="478" y1="85" x2="556" y2="85" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="517" y="72" class="u-lbl" text-anchor="middle">2 · cache miss</text>

        <rect x="560" y="55" width="170" height="80" rx="10" class="u-box"/>
        <text x="645" y="85" class="u-title" text-anchor="middle">MariaDB</text>
        <text x="645" y="110" class="u-lbl" text-anchor="middle">sumber kebenaran</text>

        <path d="M 645 135 L 645 175 L 380 175 L 380 140" class="u-dash" fill="none" marker-end="url(#u-arrow)"/>
        <text x="512" y="166" class="u-lbl" text-anchor="middle">3 · tulis hasil ke cache (write-through / read-through)</text>

        <rect x="30" y="215" width="700" height="60" rx="10" class="u-box"/>
        <text x="380" y="240" class="u-title" text-anchor="middle">Alur yang terjadi</text>
        <line x1="46" y1="250" x2="714" y2="250" class="u-line"/>
        <text x="380" y="266" class="u-lbl" text-anchor="middle">cache hit: jawaban dari RAM · cache miss: sekali baca ke disk, sesudahnya dari RAM</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Redis menempel di depan MariaDB sebagai lapisan cache: MariaDB tetap sumber kebenaran, Redis hanya mempercepat akses</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Arsitektur Client-Server: Port 6379</h3><p>Redis berjalan sebagai proses tunggal <code>redis-server</code> yang mendengarkan port TCP <b>6379</b>. Klien mana pun — <code>redis-cli</code> dari terminal, <code>go-redis</code> di Go, <code>ioredis</code> di Node.js, <code>Jedis</code> di Java, <code>redis-py</code> di Python — berbicara lewat protokol ringan bernama <b>RESP</b> (<i>REdis Serialization Protocol</i>) yang berbasis baris teks, sehingga mudah dibaca manusia maupun cepat diparse mesin.</p><ul><li><b>Satu koneksi, banyak permintaan</b> — klien bisa mengirim beberapa perintah berturut-turut sebelum membaca balasan (<i>pipelining</i>) untuk memangkas bolak-balik jaringan.</li><li><b>Koneksi latensi tinggi butuh perhatian</b> — semakin jauh klien dari server, semakin besar manfaat pipelining dan koneksi yang dipakai ulang (pooling).</li><li><b>Redis adalah pelengkap</b> — arsitektur yang sehat menempatkan database relasional sebagai sumber kebenaran dan Redis di depannya untuk mempercepat, seperti terlihat pada Gambar 1.1.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Perbandingan: Redis vs MariaDB/PostgreSQL vs Memcached</h3><p>Ketiganya menyimpan data, tetapi dirancang untuk pekerjaan yang sangat berbeda. Tabel berikut menjadi panduan cepat sebelum kamu memutuskan memakai yang mana:</p><table><thead><tr><th>Aspek</th><th>Redis</th><th>MariaDB / PostgreSQL</th><th>Memcached</th></tr></thead><tbody><tr><td><b>Model data</b></td><td>Key-value multi-struktur di memori</td><td>Relasional: baris, kolom, relasi</td><td>Key-value polos di memori</td></tr><tr><td><b>Kecepatan akses</b></td><td>Mikrodetik, ratusan ribu operasi/detik</td><td>Milidetik, ribuan kueri/detik</td><td>Mikrodetik, sangat khusus untuk cache</td></tr><tr><td><b>Persistence</b></td><td>Opsional (snapshot RDB &amp; log AOF)</td><td>Wajib dan andal: WAL, transaksi ACID</td><td>Tidak ada — hilang saat restart</td></tr><tr><td><b>Struktur data</b></td><td>String, list, set, zset, hash, bitmap, HLL, geo</td><td>Tabel dengan JOIN, indeks, view, transaksi</td><td>Hanya string tunggal (maksimal 1 MB)</td></tr><tr><td><b>Cara bertanya</b></td><td>Lewat kunci; tidak ada SQL dan JOIN</td><td>SQL penuh, laporan, agregasi rumit</td><td>Hanya GET/SET/DELETE</td></tr><tr><td><b>Use case utama</b></td><td>Cache, sesi, counter, leaderboard, lock</td><td>Data transaksional, sumber kebenaran</td><td>Cache objek sederhana berskala besar</td></tr><tr><td><b>Batas memori</b></td><td>Ya, seluruh data di RAM</td><td>Bergantung kapasitas disk</td><td>Ya, seluruh data di RAM</td></tr></tbody></table><p>Kesimpulan singkatnya: <b>MariaDB/PostgreSQL untuk data yang harus benar dan lengkap, Redis untuk data yang harus cepat, Memcached untuk cache paling sederhana</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kelebihan dan Kekurangan Redis</h3><p>Tidak ada alat yang sempurna. Catat keduanya agar keputusanmu jujur:</p><ul><li><b>Kelebihan:</b> latensi sangat rendah; struktur data kaya sehingga banyak kasus bisa diselesaikan tanpa membuka database; operasi atomik bawaan (<code>INCR</code>, <code>SETNX</code>, <code>HINCRBY</code>); fitur bawaan seperti expiry, pub/sub, Lua script, dan stream; ekosistem klien lengkap di hampir semua bahasa.</li><li><b>Kekurangan:</b> seluruh data membutuhkan RAM sehingga kapasitasnya terbatas dan mahal; persistence bukan jaminan mutu transaksi; tanpa skema dan tanpa SQL, audit data jadi lebih sulit; ukuran proses tunggal membatasi penulisan (menulis 1 juta data per detik tetap dibatasi satu thread); bila data salah ditangani, pemulihannya jauh lebih merepotkan daripada database berbasis disk.</li></ul>'
    },
    {
      type: 'example',
      title: 'Perintah Pertama: Rasakan Redis dari Terminal',
      lang: 'redis',
      output: false,
      code: `SET nama "Budi"
GET nama
EXISTS nama
INCR kunjungan
INCR kunjungan
GET kunjungan
DEL nama
EXISTS nama`,
      explain: [
        '<code>SET</code> lalu <code>GET</code> adalah inti dari key-value: tulis satu kunci, baca lagi kuncinya. Nilai yang sama ditimpa bila ditulis ulang.',
        '<code>INCR</code> menaikkan angka secara atomik — inilah yang membuat Redis andal sebagai penghitung kunjungan atau pembatas laju request tanpa takut balapan antar server.',
        '<code>EXISTS</code> dan <code>DEL</code> menguji keberadaan serta menghapus kunci; setelah <code>DEL</code>, kunci benar-benar hilang dan <code>GET</code> akan menghasilkan nilai kosong.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Peta Use Case Redis</h3><p>Berikut tujuh peran yang paling sering diemban Redis di aplikasi nyata, beserta alasannya:</p><ul><li><b>Cache</b> — menyalin hasil kueri yang sering diminta agar database tidak dibanjiri permintaan identik.</li><li><b>Session store</b> — menyimpan sesi login pengguna yang butuh dibaca cepat oleh banyak server sekaligus.</li><li><b>Counter &amp; rate limiter</b> — menghitung kunjungan, OTP, atau laju request per IP dengan operasi atomik plus batas waktu.</li><li><b>Pub/sub sederhana</b> — menyebarkan notifikasi ringan antar proses tanpa memasang broker berat.</li><li><b>Job queue</b> — menumpuk tugas ringan lewat list atau stream sebagai antrean pekerjaan sederhana.</li><li><b>Leaderboard</b> — peringkat pemain dan top seller dengan sorted set yang selalu terurut.</li><li><b>Distributed lock</b> — memastikan hanya satu server yang mengerjakan satu pekerjaan pada satu waktu.</li></ul>'
    },
    {
      type: 'example',
      title: 'Peta Keputusan: Data Ini ke Redis atau ke Database Utama?',
      lang: 'text',
      output: false,
      code: `DATA APLIKASI                     TEMPAT YANG BENAR        ALASAN
---------------------------------  ------------------------  --------------------------
Profil, alamat, riwayat belanja    MariaDB / PostgreSQL      transaksional, butuh laporan
Saldo, tagihan, faktur             database utama            wajib ACID, tidak boleh hilang
Halaman produk yang sering dilihat Redis (cache)             dibaca berkali-kali, boleh
                                                             dimuat ulang saat cache miss
Sesi login pengguna                Redis (dengan TTL)        cepat, sementara, ada expiry
Laju request per IP (rate limit)   Redis (counter + TTL)     atomik, cukup disimpan harian
Peringkat top skor                 Redis (sorted set)        butuh urutan, update sering
Antrean tugas ringan               Redis list / stream       boleh hilang, tahan kehilangan`,
      explain: [
        'Baris pertama dan kedua adalah garis merah: data transaksional tetap hidup di database utama; Redis hanya boleh menyalinnya untuk keperluan baca cepat.',
        'Baris tengah adalah wilayah emas Redis — data yang <i>boleh hilang</i> dan <i>boleh dibuat ulang</i>, namun sangat sering dibaca atau sangat sering diperbarui.',
        'Pola ini disebut <b>cache-aside</b>: aplikasi membaca Redis lebih dulu; bila tidak ada, ia membaca database lalu menulis hasilnya ke Redis untuk permintaan berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Redis Cocok dan Kapan Tidak</h3><p><b>Cocok</b> bila memenuhi setidaknya satu syarat berikut:</p><ul><li>Data <b>sangat sering dibaca</b> dan boleh direkonstruksi dari sumber lain.</li><li>Data <b>sangat sering diperbarui</b> dan butuh operasi atomik seperti penghitungan atau batas waktu.</li><li>Aplikasi membutuhkan jawaban <b>sub-milidetik</b> untuk jutaan pengguna serentak.</li><li>Banyak server perlu melihat data yang sama secara bersama (sesi, lock, leaderboard).</li></ul><p><b>Tidak cocok</b> bila:</p><ul><li>Data harus <b>bertahan selamanya dengan jaminan mutu transaksi</b> — itulah pekerjaan database utama.</li><li>Butuh kueri kompleks: JOIN lintas tabel, laporan agregat, filter fleksibel, atau relasi yang berubah.</li><li>Ukuran data jauh melampaui anggaran RAM (arsip, riwayat bertahun-tahun, berkas besar).</li></ul><p><b>Anti-pattern yang paling sering salah paham:</b> menjadikan Redis <i>satu-satunya</i> rumah data transaksional. Redis tanpa persistence yang benar bisa kehilangan seluruh isi memori saat proses crash; dengan AOF sekalipun, ia tidak menawarkan model transaksi multi-tabel seperti ACID penuh yang diandalkan database relasional. Bila saldo dan faktur hanya hidup di Redis, satu kali insiden sudah cukup untuk membuat bisnis berhenti berhitung.</p>'
    },
    {
      type: 'text',
      html: '<h3>Latihan Praktik: Petakan Data Aplikasimu</h3><p>Sebelum menyentuh perintah apa pun, lakukan latihan pemetaan ini — 15 menit yang jauh lebih berharga daripada menghafal ratusan perintah.</p><ol><li>Tulis daftar <b>lima data paling sering dibaca</b> oleh aplikasimu (misalnya profil pengguna, konfigurasi, produk populer).</li><li>Untuk tiap data, jawab tiga pertanyaan: <i>seberapa sering dibaca?</i>, <i>berapa lama data ini tetap berguna?</i>, dan <i>apa yang terjadi bila data ini hilang?</i></li><li>Kelompokkan: bila jawaban ketiga adalah "harus dimuat ulang dari database" → layak masuk Redis; bila "tidak boleh hilang sama sekali" → tetap di database utama.</li><li>Tandai data mana yang butuh <b>batas waktu</b> (TTL), karena hampir semua use case Redis yang sehat punya masa berlaku.</li></ol><p>Hasil latihan ini menjadi bahan langsung untuk Bab 4, di mana kita membahas <i>expiration</i> dan cara menamai key dengan rapi.</p>'
    },
    {
      type: 'tip',
      title: 'Ukur Dulu, Cache Kemudian',
      text: 'Jangan memindahkan data ke Redis hanya karena "katanya cepat". Ukur titik lambatnya terlebih dahulu: catat latensi kueri asli, pasang Redis pada <b>satu</b> endpoint yang paling menyakitkan, lalu bandingkan lagi. Cache yang dipasang tanpa pengukuran sering kali menambah kerumitan tanpa memberi dampak nyata — dan kerumitan itu tetap harus dirawat.'
    },
    {
      type: 'warn',
      title: 'Redis Bukan Pengganti Database Utama',
      text: 'Redis adalah <b>lapisan akses cepat</b>, bukan sumber kebenaran tunggal untuk data transaksional. Data di memori bisa hilang saat proses crash, persistence hanyalah mekanisme pemulihan terbaik-bukan-jaminan, dan Redis tidak memiliki model transaksi relasional yang lengkap. Simpan saldo, faktur, dan data wajib-akurat di database utama; gunakan Redis untuk <b>mempercepat</b> dan <b>menyimpan sementara</b>.'
    },
    {
      type: 'vocab',
      items: [
        ['Redis', 'Kependekan dari REmote DIctionary Server; data store key-value berbasis memori dengan delapan struktur data utama.'],
        ['In-memory database', 'Basis data yang menaruh seluruh (atau hampir seluruh) data di RAM agar aksesnya berada di kisaran mikrodetik.'],
        ['Key-value store', 'Model penyimpanan paling sederhana: satu kunci unik menunjuk ke satu nilai; tanpa tabel, relasi, maupun JOIN.'],
        ['RESP', 'REdis Serialization Protocol — protokol ringan berbasis baris teks yang dipakai klien dan server Redis untuk bertukar perintah.'],
        ['Event loop', 'Pola kerja satu proses yang bergiliran menyelesaikan semua koneksi yang siap, tanpa membuat thread baru per koneksi.'],
        ['Non-blocking I/O', 'Pembacaan dan penulisan jaringan yang tidak menahan proses; server dapat menunggu banyak koneksi sekaligus dalam satu thread.'],
        ['Multiplexing', 'Pemetaan banyak koneksi jaringan ke satu event loop (epoll/kqueue) sehingga ribuan klien dilayani oleh satu thread.'],
        ['RDB & AOF', 'Dua mekanisme persistensi Redis: RDB adalah snapshot berkala, AOF adalah log operasi yang bisa direplay untuk memulihkan data.'],
        ['Cache-aside', 'Pola di mana aplikasi membaca cache lebih dulu; bila kosong, aplikasi membaca database lalu mengisi cache untuk permintaan berikutnya.']
      ]
    }
  ],
  recap: [
    'Redis adalah data store key-value in-memory dengan delapan struktur data, dirancang untuk akses super cepat sebagai pelengkap — bukan pengganti — database relasional.',
    'Kecepatan Redis lahir dari dua hal: seluruh data berada di RAM, dan satu thread event loop dengan non-blocking I/O melayani ribuan koneksi tanpa beban konteks dan kunci.',
    'Dibanding MariaDB/PostgreSQL, Redis unggul pada latensi tetapi tanpa SQL dan transaksi relasional; dibanding Memcached, Redis jauh lebih kaya struktur data dan fiturnya.',
    'Use case yang layak: cache, sesi, counter, rate limiter, pub/sub, job queue, leaderboard, dan distributed lock — sementara data transaksional wajib tetap di database utama.'
  ]
});
