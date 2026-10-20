/* ============================================================
   Pelajaran Redis — Bab 4: Expiration, TTL & Key Design
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'expiration-ttl-keydesign',
  title: 'Expiration, TTL & Key Design',
  chapter: 'Struktur Data',
  duration: '10–12 menit',
  intro: [
    'Bayangkan laci di meja kasir restoran: nota hari ini berguna sepanjang hari, tetapi kalau dibiarkan menumpuk selama setahun, laci tidak akan bisa ditutup dan kasir pun kehilangan tempat bekerja. Kulkas pun begitu — makanan punya tanggal kedaluwarsa, dan siapa pun yang membiarkannya akan menemukan bau tak sedap dua minggu kemudian. <b>Redis bekerja persis seperti laci itu</b>: setiap data punya ruang, dan ruang hanya berharga bila isinya masih dipakai.',
    'Untuk itu Redis menyediakan mekanisme <b>expiration</b>: setiap kunci boleh diberi umur hidup lewat perintah <code>EXPIRE</code> atau opsi <code>EX</code> saat menulis. Begitu waktunya habis, kunci itu dianggap kedaluwarsa dan ruangnya dilepas kembali. Bagian yang menarik adalah <i>bagaimana</i> Redis membersihkannya — ada dua jalur sekaligus, yakni pemeriksaan saat dibaca (<i>lazy</i>) dan pembersihan berkala oleh server (<i>active cycle</i>), yang keduanya tetap perlu dibarengi batas memori yang jelas.',
    'Bab ini membahas tiga hal yang selalu datang bersamaan: <b>TTL dan expire</b> beserta opsi modernnya di Redis 7, <b>siklus hidup kunci</b> dari dibuat sampai dibersihkan, dan <b>key design</b> — seni menamai serta membatasi kunci agar memori tetap terkendali. Kita tutup dengan <code>SCAN</code> sebagai pengganti <code>KEYS *</code> yang berbahaya, serta tiga anti-pattern paling merugikan yang bisa kamu hindari hari ini juga.'
  ],
  objectives: [
    'Memberi dan memeriksa masa berlaku kunci dengan EXPIRE, TTL, PERSIST, serta opsi EX/PX pada SET',
    'Menjelaskan mekanisme lazy expiration dan active expiration cycle beserta batasannya',
    'Merancang pola penamaan dan batas kunci yang rapi, mudah dipindai, serta hemat memori',
    'Mengganti kebiasaan berbahaya seperti KEYS * dengan SCAN dan mengenali anti-pattern key design'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Data di Redis Perlu Batas Waktu</h3><p>Redis disimpan seluruhnya di RAM — sumber daya yang jauh lebih mahal dan jauh lebih terbatas daripada disk. Tanpa batas waktu, data sementara seperti halaman produk yang baru dilihat, token yang sudah dipakai, atau penghitung kunjungan harian akan menumpuk selamanya dan perlahan menghabiski memori server. Ketika memori penuh, justru data penting yang bisa ikut terdorong keluar.</p><p>Karena itu hampir setiap data di Redis yang sehat punya <b>masa berlaku</b> yang jelas: sesi login kedaluwarsa dalam beberapa jam, kode OTP dalam hitungan menit, laporan statistik harian dibersihkan setelah satu hari. Konsep <b>TTL</b> (<i>Time To Live</i>) — sisa hidup sebuah kunci dalam detik — adalah alat utama untuk mewujudkannya, dan ia bekerja di sisi server sehingga tidak ada satu pun kode aplikasi yang perlu berjalan keliling menghapus data.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Siklus hidup kunci Redis dari dibuat, dipakai, kedaluarsa, hingga dibersihkan secara lazy atau aktif">
        <rect x="25" y="55" width="155" height="80" rx="10" class="u-box"/>
        <text x="102" y="83" class="u-title" text-anchor="middle">1 · Dibuat</text>
        <text x="102" y="107" class="u-lbl" text-anchor="middle">SET session:abc</text>
        <text x="102" y="125" class="u-lbl" text-anchor="middle">EX 3600</text>

        <line x1="186" y1="95" x2="206" y2="95" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="210" y="55" width="155" height="80" rx="10" class="u-box"/>
        <text x="287" y="83" class="u-title" text-anchor="middle">2 · Dipakai</text>
        <text x="287" y="107" class="u-lbl" text-anchor="middle">GET / perintah lain</text>
        <text x="287" y="125" class="u-lbl" text-anchor="middle">TTL terus berjalan</text>

        <line x1="371" y1="95" x2="391" y2="95" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="395" y="55" width="155" height="80" rx="10" class="u-hl"/>
        <text x="472" y="83" class="u-title" text-anchor="middle">3 · Kedaluarsa</text>
        <text x="472" y="107" class="u-lbl" text-anchor="middle">TTL menuju 0</text>
        <text x="472" y="125" class="u-lbl" text-anchor="middle">dianggap sudah tidak ada</text>

        <line x1="556" y1="95" x2="576" y2="95" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="580" y="55" width="155" height="80" rx="10" class="u-box"/>
        <text x="657" y="83" class="u-title" text-anchor="middle">4 · Dibersihkan</text>
        <text x="657" y="107" class="u-lbl" text-anchor="middle">lazy: saat dibaca</text>
        <text x="657" y="125" class="u-lbl" text-anchor="middle">active: siklus server</text>

        <path d="M 657 135 L 657 175 L 102 175 L 102 140" class="u-dash" fill="none" marker-end="url(#u-arrow)"/>
        <text x="380" y="166" class="u-lbl" text-anchor="middle">ruang yang dilepas kembali siap diisi kunci baru</text>

        <rect x="25" y="215" width="710" height="60" rx="10" class="u-box"/>
        <text x="380" y="239" class="u-title" text-anchor="middle">Yang perlu diingat</text>
        <line x1="41" y1="248" x2="719" y2="248" class="u-line"/>
        <text x="380" y="266" class="u-lbl" text-anchor="middle">pembersihan tidak selalu instan — tetap atur maxmemory dan eviction policy agar memori terkendali</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Siklus hidup kunci Redis: dibuat, dipakai, kedaluarsa oleh TTL, lalu dibersihkan melalui pemeriksaan lazy atau siklus pembersihan aktif</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>EXPIRE, TTL, dan PERSIST</h3><p>Tiga perintah inti membentuk dasar pengelolaan masa berlaku:</p><ul><li><code>EXPIRE sesi 3600</code> — menetapkan kunci <code>sesi</code> hidup 3.600 detik ke depan. Varian <code>PEXPIRE</code> memakai milidetik untuk masa hidup yang jauh lebih pendek.</li><li><code>TTL sesi</code> — mengembalikan sisa waktu dalam detik: angka positif berarti masih hidup, <code>-1</code> berarti kunci ada tetapi <b>tanpa</b> masa berlaku, dan <code>-2</code> berarti kunci sudah tidak ada. Varian <code>PTTL</code> mengembalikan sisa milidetik.</li><li><code>PERSIST sesi</code> — mencabut masa berlaku sehingga kunci menjadi permanen lagi; jawaban <code>0</code> berarti kunci itu memang tidak punya TTL untuk dicabut.</li></ul><p>Perhatikan bahwa <code>EXPIRE</code> pada kunci yang sudah ada akan <b>menimpa</b> masa berlaku lama. Untuk situasi yang butuh syarat, Redis 7 menyediakan opsi tambahan yang dibahas di bagian berikutnya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Menulis Sekaligus Kadaluarsa: Opsi SET dan EXPIRE Redis 7</h3><p>Cara paling efisien memberi masa berlaku adalah menetapkannya <b>bersamaan saat menulis</b>, sehingga tidak ada jeda antara data tersimpan dan masa berlakunya terpasang:</p><ul><li><code>SET session:abc "token" EX 3600</code> — tulis kunci yang langsung hidup satu jam.</li><li><code>SET limit:ip 1 PX 500</code> — masa berlaku dalam milidetik, cocok untuk penjaga laju request.</li><li><code>SET lock:job 1 NX EX 30</code> — tulis hanya bila kunci belum ada <b>dan</b> beri masa berlaku sekaligus; ini resep distributed lock yang aman karena lock tidak akan menggantung selamanya bila pemiliknya mati.</li></ul><p>Sementara itu, perintah <code>EXPIRE</code> di Redis 7 dilengkapi opsi syarat yang menghilangkan perlombaan (<i>race</i>) saat memperbarui TTL:</p><table><thead><tr><th>Opsi (Redis 7)</th><th>Arti</th><th>Penggunaan lazim</th></tr></thead><tbody><tr><td><code>EXPIRE kunci 60 NX</code></td><td>Atur TTL hanya bila kunci belum punya masa berlaku</td><td>Menetapkan umur saat pertama kali disentuh</td></tr><tr><td><code>EXPIRE kunci 60 XX</code></td><td>Atur TTL hanya bila kunci sudah punya masa berlaku</td><td>Memperpanjang data yang memang sementara</td></tr><tr><td><code>EXPIRE kunci 60 GT</code></td><td>Menang hanya bila TTL baru lebih panjang</td><td>Memperpanjang tanpa pernah memendekkan</td></tr><tr><td><code>EXPIRE kunci 60 LT</code></td><td>Menang hanya bila TTL baru lebih pendek</td><td>Mengencangkan batas keamanan</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Bagaimana Redis Menghapus Kunci yang Kedaluwarsa</h3><p>Kedaluwarsa bukan berarti server langsung menghapusnya saat detik berakhir juga. Redis memakai dua jalur pembersihan yang saling melengkapi:</p><ul><li><b>Lazy expiration</b> — ketika sebuah kunci diakses, server memeriksa dulu apakah ia sudah kedaluwarsa; bila ya, kunci dihapus saat itu juga dan permintaan dijawab seolah kunci tidak pernah ada. Jalur ini sangat murah karena sekali jalan per akses.</li><li><b>Active expiration cycle</b> — untuk kunci yang tidak pernah disentuh siapa pun, server membersihkannya secara berkala: <b>dua siklus per detik</b>, tiap siklus mengambil sampel hingga 20 kunci yang masa berlakunya sudah lewat, dan bila lebih dari 25% sampel kedaluarsa, siklus mengambil sampel tambahan.</li></ul><p>Di sinilah batasannya perlu dipahami: pembersihan aktif hanya mengambil <b>sampel</b>, bukan seluruh kunci sekaligus. Bila tiba-tiba jutaan kunci kedaluwarsa pada saat yang sama (misalnya semuanya diberi TTL identik), pekerjaan pembersihan tertinggal dan memori tetap penuh untuk sementara waktu. Karena itu tiga kebiasaan ini tetap wajib: <b>(1)</b> beri <code>maxmemory</code> beserta eviction policy, <b>(2)</b> sebarkan TTL dalam rentang wajar, dan <b>(3)</b> pantau pemakaian memori secara rutin.</p>'
    },
    {
      type: 'example',
      title: 'Mencoba TTL, EXPIRE, dan PERSIST Langsung',
      lang: 'redis',
      output: false,
      code: `SET session:abc "token-rahasia" EX 3600
TTL session:abc
SET kunjungan 0 EX 10
TTL kunjungan
PEXPIRE kunjungan 5000
PTTL kunjungan
PERSIST kunjungan
TTL kunjungan
SET limit:ip 1 NX EX 5
SET limit:ip 2 NX EX 5
EXPIRE session:abc 60 XX
EXPIRE session:abc 120 GT
DEL session:abc limit:ip`,
      explain: [
        '<code>TTL</code> yang mengembalikan angka positif menandakan kunci masih hidup beserta sisa waktunya; setelah <code>PERSIST</code>, nilainya berubah menjadi <code>-1</code> yang berarti permanen.',
        'Percobaan <code>SET limit:ip 1 NX EX 5</code> diulang dengan nilai berbeda: perintah kedua mengembalikan balasan kosong karena kunci sudah ada — inilah perilaku <i>set-if-not-exists</i> yang menjadi dasar kunci terkunci (<i>lock</i>).',
        'Opsi <code>XX</code> dan <code>GT</code> memastikan masa berlaku hanya diubah sesuai syaratnya; dengan begitu dua server yang memperbarui TTL bersamaan tidak saling menimpa secara diam-diam.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Key Design: Menamai Kunci dengan Sengaja</h3><p>Redis tidak memaksa format penamaan apa pun, sehingga kerapian sepenuhnya ada di tanganmu. Sayangnya, kebebasan ini sering berujung pada kumpulan kunci seperti <code>a1</code>, <code>userdata2</code>, dan <code>TEMP_x_2024_new</code> yang membuat siapa pun tersesat. Berikut konvensi yang terbukti praktis:</p><ul><li><b>Pakai pemisah titik dua</b> dan urutan dari umum ke khusus: <code>user:1234:profile</code>, <code>product:881:stock</code>.</li><li><b>Ikuti pola waktu untuk data temporal</b>: <code>cart:2026-10-20:abdul</code> memudahkan pencarian dan pembersihan per hari.</li><li><b>Huruf kecil dan tanpa spasi</b> — jauh lebih mudah diketik, di-debug, dan dicocokkan dengan pola <code>MATCH</code>.</li><li><b>Jaga agar tetap pendek</b> — setiap kunci memakan tambahan memori untuk penyimpanan strukturnya sendiri; key pendek berarti lebih banyak ruang untuk datanya.</li><li><b>Sertakan "zona sampah"</b> — awalan seperti <code>tmp:</code> atau <code>cache:</code> memudahkan penghapusan massal yang terarah tanpa menyentuh data produksi.</li></ul><p>Yang tak kalah penting: perhatikan <b>cardinality</b>, yaitu berapa banyak kunci berbeda yang akan tercipta. Satu kunci unik per detik per pengguna bisa menghasilkan 86.400 kunci baru per pengguna per hari — jumlah yang sangat mudah melonjak tanpa disadari.</p><table><thead><tr><th>Kasus</th><th>Pola kunci</th><th>Contoh</th><th>TTL lazim</th></tr></thead><tbody><tr><td>Profil pengguna</td><td><code>user:id:bagian</code></td><td><code>user:1234:profile</code></td><td>Tanpa TTL (salinan database)</td></tr><tr><td>Sesi login</td><td><code>sess:token</code></td><td><code>sess:a1b9f3</code></td><td>Jam, diperpanjang saat aktif</td></tr><tr><td>Keranjang harian</td><td><code>cart:tanggal:pengguna</code></td><td><code>cart:2026-10-20:abdul</code></td><td>1–7 hari</td></tr><tr><td>Rate limiter</td><td><code>rl:layanan:subjek</code></td><td><code>rl:login:ip-10-0-5-8</code></td><td>Detik–menit</td></tr><tr><td>Cache halaman</td><td><code>cache:entitas:id</code></td><td><code>cache:product:881</code></td><td>Menit, plus acak ±10%</td></tr><tr><td>Kunci sementara</td><td><code>tmp:tujuan:hash</code></td><td><code>tmp:export:9f2c</code></td><td>Menit</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>SCAN, Bukan KEYS: Menjelajah Kunci dengan Aman</h3><p>Saat kamu perlu mencari kunci berdasarkan pola — misalnya membersihkan semua <code>tmp:</code> — godaan pertama adalah <code>KEYS tmp:*</code>. Perintah itu harus dihindari di produksi karena bersifat <b>blokir</b>: ia menelusuri seluruh ruang kunci di satu thread, dan selama penelusuran berlangsung <b>tidak ada klien lain yang bisa melayani permintaan apa pun</b>.</p><p>Penggantinya adalah <code>SCAN</code>, yang bekerja per langkah memakai kursor:</p><ul><li><code>SCAN 0 MATCH tmp:* COUNT 100</code> — mulai dari kursor <code>0</code>, ambil sekitar 100 kunci per langkah, hanya yang cocok pola.</li><li>Kembalian berisi kursor berikutnya; ulangi perintah dengan kursor itu sampai nilainya <code>0</code>, yang berarti penelusuran selesai.</li><li>Kunci yang muncul boleh terulang antar langkah, oleh karena itu penelusuran tidak menjamin hasil unik — sedangkan kunci yang ada sepanjang waktu dijamin minimal sekali muncul.</li><li>Untuk koleksi bertipe khusus ada <code>SSCAN</code>, <code>HSCAN</code>, dan <code>ZSCAN</code>; <code>redis-cli</code> juga menyediakan mode <code>--scan</code> yang menulis kursor secara otomatis.</li></ul><p>Untuk mengecek berapa memori yang dipakai satu kunci, gunakan <code>MEMORY USAGE kunci</code> — angka inilah yang membantumu menemukan kunci pemboros sebelum memori server menjerit.</p>'
    },
    {
      type: 'example',
      title: 'Menjelajah Kunci dengan SCAN dan MEMORY USAGE',
      lang: 'redis',
      output: false,
      code: `SET tmp:export:1 "antre"
SET tmp:export:2 "selesai"
SET tmp:report:9 "draf"
SET user:1234:profile "Budi"
SCAN 0 MATCH tmp:* COUNT 100
SCAN 5 MATCH tmp:* COUNT 100
MEMORY USAGE tmp:export:1
MEMORY USAGE user:1234:profile
UNLINK tmp:export:1 tmp:export:2
DBSIZE`,
      explain: [
        'Perintah <code>SCAN</code> pertama mengembalikan pasangan kursor berikutnya dan daftar kunci; kursor itulah yang dikirimkan pada pemanggilan berikutnya sampai muncul angka <code>0</code> sebagai tanda selesai.',
        '<code>MATCH</code> hanya menyaring hasil, bukan mempercepat penelusuran — sebab server tetap melewati seluruh kunci. <code>COUNT</code> mengatur besar langkah, bukan jumlah akhir hasil.',
        '<code>UNLINK</code> adalah versi aman dari <code>DEL</code> untuk kunci besar: proses penghapusan di latar belakang, sehingga thread eksekusi tidak tertahan memindahkan data raksasa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tiga Anti-Pattern Key Design yang Paling Merugikan</h3><p>Kerusakan akibat kebiasaan buruk berikut jarang terlihat langsung; ia muncul sebagai lonjakan memori atau jeda layanan beberapa minggu kemudian.</p><ul><li><b><code>KEYS *</code> di produksi.</b> Perintah ini memblokir seluruh server selama penelusuran — pada database berisi jutaan kunci, henti-henti ini bisa terasa beberapa detik hingga lebih, dan semua pengguna ikut menunggu. Selalu ganti dengan <code>SCAN</code>.</li><li><b>Kunci tanpa batas waktu yang menumpuk.</b> Setiap entri sementara yang tidak diberi TTL menjadi <i>zombie</i> yang menghuni memori selamanya. Bila data memang wajib permanen, pastikan ia benar-benar berasal dari database utama, bukan salinan yang lupa dibersihkan.</li><li><b>Kunci sangat panjang dan cardinalitas liar.</b> Nama seperti <code>application:user-preferences:locale:language:timezone:2026-10-20T10:45:00:device:mobile</code> menghabiskan memori untuk menyimpan namanya sendiri, ditambah satu kunci unik per milidetik yang bisa menciptakan jutaan entri dalam hitungan menit. Padatkan nama, gabungkan ke Hash, dan pergunakan rentang waktu yang lebih kasar.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Beri Sedikit Keraguan pada TTL dengan Acakan',
      text: 'Saat menyetel masa berlaku pada cache yang sangat populer, tambahkan sedikit acakan — misalnya <code>EX 3600</code> ditambah durasi acak 0–10%. Tanpa acakan, ribuan kunci yang dibuat bersamaan akan <b>kedaluwarsa serempak</b> dan menimbulkan gelombang pembacaan ulang ke database (<i>thundering herd</i>) di detik yang sama. Sedikit keraguan waktu ternyata cukup untuk meratakan beban.'
    },
    {
      type: 'warn',
      title: 'Jalankan KEYS Hanya di Lingkungan Lokal',
      text: '<code>KEYS *</code> aman dipakai saat belajar di laptop, tetapi di server produksi ia menahan seluruh antrian permintaan selama penelusuran berlangsung — insiden serupa pernah membuat layanan terasa "mati total" padahal servernya hidup. Gunakan <code>SCAN</code> dengan <code>MATCH</code> dan <code>COUNT</code>, jalankan penelusuran secara bertahap, dan lakukan penyaringan akhir di sisi aplikasi. Perintah berbahaya lain yang sebaiknya dihindari: <code>FLUSHALL</code> untuk membersihkan data dan <code>SORT</code> pada daftar besar tanpa <code>BY</code>/<code>GET</code> yang terbatas.'
    },
    {
      type: 'vocab',
      items: [
        ['TTL (Time To Live)', 'Sisa waktu hidup sebuah kunci dalam detik; hasil -1 berarti permanen dan -2 berarti kunci sudah tidak ada.'],
        ['EXPIRE', 'Perintah memberi masa berlaku pada kunci; varian PEXPIRE memakai milidetik dan Redis 7 menambah opsi NX, XX, GT, LT.'],
        ['PERSIST', 'Perintah mencabut masa berlaku sehingga kunci kembali permanen.'],
        ['Lazy expiration', 'Penghapusan kunci kedaluwarsa yang dilakukan ketika kunci itu diakses oleh klien.'],
        ['Active expiration cycle', 'Siklus pembersihan internal yang mengambil sampel kunci kedaluwarsa secara berkala, dua kali per detik.'],
        ['Key design', 'Kesepakatan penamaan, pemisah, panjang, dan batas kunci agar mudah dikelola serta hemat memori.'],
        ['Cardinality', 'Jumlah kunci berbeda yang bisa tercipta dari sebuah pola penamaan; semakin tinggi, semakin besar tekanan memori.'],
        ['SCAN', 'Penjelajah kursor yang tidak memblokir server; pengganti aman untuk KEYS.'],
        ['UNLINK', 'Penghapusan non-blocking: penandaan kunci segera, pembersihan memori dikerjakan di latar belakang.']
      ]
    }
  ],
  recap: [
    'Masa berlaku kunci diatur dengan EXPIRE/PEXPIRE atau opsi EX/PX saat SET, diperiksa lewat TTL/PTTL, dan dicabut dengan PERSIST; Redis 7 menambah opsi NX, XX, GT, LT.',
    'Redis membersihkan kunci kedaluwarsa melalui dua jalur: pemeriksaan lazy saat kunci diakses serta active expiration cycle dua kali per detik yang bekerja berbasis sampel.',
    'Key design yang baik memakai pemisah titik dua, huruf kecil, nama pendek, pola berbasis waktu, serta memperhatikan cardinalitas agar memori tetap terkendali.',
    'KEYS * memblokir server dan hanya untuk lingkungan lokal; pergunakan SCAN dengan MATCH dan COUNT, MEMORY USAGE untuk mengukur, dan UNLINK untuk kunci besar.'
  ]
});
