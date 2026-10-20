/* ============================================================
   Pelajaran Redis — Bab 8: Pub/Sub, Streams & Distributed Locking
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'pubsub-streams-lock',
  title: 'Pub/Sub, Streams & Distributed Locking',
  chapter: 'Fitur Lanjutan',
  duration: '12–14 menit',
  intro: [
    'Di ruang kantor, pengumuman lewat pengeras suara terdengar oleh siapa saja yang sedang berada di ruangan — tetapi pegawai yang sedang cuti tidak pernah tahu isinya, dan tidak ada arsip yang bisa dibuka ulang. <b>Redis Pub/Sub</b> bekerja persis seperti pengeras suara itu: pesan dilepaskan begitu saja dan hanya berarti bagi yang sedang mendengar.',
    'Ketika pekerjaannya tidak boleh hilang — pesanan yang harus diproses, tugas yang harus dikerjakan ulang bila gagal — kamu butuh sesuatu yang menyimpan pesan dan mencatat siapa yang sudah membacanya. Di sinilah <b>Redis Streams</b> masuk: sebuah log yang hanya bertambah, dengan <i>consumer group</i> yang mencatat posisi baca tiap anggota dan daftar pesan belum di-ACK. Fitur ketiga, <b>distributed lock</b>, menjawab pertanyaan berbeda lagi: bagaimana memastikan hanya satu proses dari sekian banyak yang mengerjakan satu pekerjaan.',
    'Bab ini mengurutkan ketiganya dari yang paling ringan ke yang paling menuntut jaminan. Kamu akan mencoba SUBSCRIBE/PUBLISH di redis-cli lalu versi Go-nya, membangun consumer group pada Streams (XADD, XREADGROUP, XACK, XAUTOCLAIM), membandingkan Streams dengan RabbitMQ dan Kafka lewat tabel singkat, dan menutup dengan kunci terdistribusi: SET dengan NX dan PX, pelepasan aman memakai Lua, perpanjangan otomatis, serta pertanyaan kapan lock justru tidak perlu.'
  ],
  objectives: [
    'Menjalankan SUBSCRIBE, PSUBSCRIBE, dan PUBLISH di redis-cli serta mengenali sifat kirim-lepasnya',
    'Berlangganan channel dari go-redis dengan channel pesan dan pembatalan konteks',
    'Membentuk consumer group pada Redis Streams dengan XADD, XREADGROUP, XACK, dan XAUTOCLAIM',
    'Menerapkan distributed lock yang aman beserta kapan lock dibutuhkan dan kapan desain idempoten lebih baik'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Redis Pub/Sub: Kirim dan Lupa</h3><p><b>Pub/Sub</b> (publish/subscribe) memungkinkan satu penulis (publisher) mengirim pesan ke seluruh pihak yang sedang mendengarkan channel tertentu (subscriber). Redis menyediakan <code>PUBLISH</code>, <code>SUBSCRIBE</code> untuk satu channel persis, dan <code>PSUBSCRIBE</code> untuk pola seperti <code>notify:*</code> — satu subscriber bisa mendengar banyak channel sekaligus.</p><p>Sifatnya yang paling penting: <b>kirim-lepas (fire and forget)</b>. Redis tidak menyimpan pesan untuk subscriber yang belum terhubung, tidak menyimpan ulang ketika subscriber putus sebentar, dan tidak menunggu konfirmasi apa pun. Bila tidak ada satu pun subscriber saat <code>PUBLISH</code> dijalankan, pesan hilang begitu saja dan balasannya hanya <code>0</code>.</p><p>Karena itu Pub/Sub sangat cocok untuk <b>notifikasi ringan yang bersifat seketika</b>: memberi tahu beberapa instance aplikasi bahwa konfigurasi berubah, mengirim update skor ke klien yang sedang terbuka, atau menyebarkan perintah refresh. Untuk tugas yang tidak boleh terlewat — pembayaran, pengiriman email, pemrosesan pesanan — gunakan antrean yang menyimpan pesan: RabbitMQ, Kafka, atau Redis Streams di bagian berikutnya.</p>'
    },
    {
      type: 'example',
      title: 'SUBSCRIBE, PSUBSCRIBE, dan PUBLISH di redis-cli',
      lang: 'redis',
      output: false,
      code: '# Terminal 1 — dengarkan satu channel (perintah ini berjalan terus)\n127.0.0.1:6379> SUBSCRIBE orders:created\nReading messages... (press Ctrl-C to quit)\n1) "subscribe"\n2) "orders:created"\n3) (integer) 1\n1) "message"\n2) "orders:created"\n3) "order-1024"\n\n# Terminal 2 — kirim satu pesan\n127.0.0.1:6379> PUBLISH orders:created "order-1024"\n(integer) 1\n\n# Pola: satu subscriber mendengar banyak channel sekaligus\n127.0.0.1:6379> PSUBSCRIBE notify:*\n1) "psubscribe"\n2) "notify:*"\n3) (integer) 1\n\n# Tidak ada subscriber? Pesan hilang tanpa jejak\n127.0.0.1:6379> PUBLISH notify:absen "ada yang mendengar?"\n(integer) 0',
      explain: [
        'Balasan pertama <code>SUBSCRIBE</code> adalah tanda bahwa langganan sudah aktif; sesudah itu perintah berubah menjadi penampil pesan masuk sampai kamu menekan Ctrl-C.',
        '<code>PUBLISH</code> membalas angka jumlah subscriber yang menerima pesan — angka <code>0</code> adalah peringatan keras bahwa pesan tadi tidak sampai ke siapa pun.',
        'Balasan <code>PSUBSCRIBE</code> menampilkan pola <code>notify:*</code>; kecocokan pola dilakukan di server sehingga satu langganan menangani banyak channel.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Subscribe dari go-redis</h3><p>Di go-redis, <code>rdb.Subscribe(ctx, "channel")</code> mengembalikan objek <code>*redis.PubSub</code>. Metode paling nyaman adalah <code>Channel()</code> yang mengembalikan <code>&lt;-chan *redis.Message</code> — pola klasik Go: goroutine membaca dari channel sampai channel ditutup.</p><p>Tiga hal yang perlu diperhatikan:</p><ul><li><b>Jaga agar tetap tersambung</b> — go-redis menangani reconnect secara internal; selama koneksi terputus, pesan yang lewat <b>tidak</b> dikompensasi (memang sifat Pub/Sub).</li><li><b>Tutup dengan rapi</b> — <code>defer pubsub.Close()</code> menutup langganan dan menghentikan pengiriman pesan; channel dari <code>Channel()</code> ikut tertutup dan perulangan berakhir.</li><li><b>Ikat ke konteks</b> — bila konteks dibatalkan, seluruh koneksi di dalamnya ikut berhenti, sehingga program tidak meninggalkan goroutine yang menggantung saat shutdown.</li></ul>'
    },
    {
      type: 'example',
      title: 'Subscriber ringan dengan go-redis',
      lang: 'go',
      output: false,
      code: 'package main\n\nimport (\n  "context"\n  "fmt"\n  "log"\n  "time"\n\n  "github.com/redis/go-redis/v9"\n)\n\nfunc main() {\n  rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})\n  defer rdb.Close()\n\n  ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)\n  defer cancel()\n\n  pubsub := rdb.Subscribe(ctx, "orders:created")\n  defer pubsub.Close()\n\n  // Pastikan langganan benar-benar terjalin sebelum menunggu\n  if _, err := pubsub.Receive(ctx); err != nil {\n    log.Fatal("gagal subscribe:", err)\n  }\n  fmt.Println("menunggu pesan pada orders:created ...")\n\n  // Proses lain cukup memanggil rdb.Publish(ctx, "orders:created", "order-1024")\n  for msg := range pubsub.Channel() {\n    fmt.Println("channel:", msg.Channel, "| payload:", msg.Payload)\n  }\n}',
      explain: [
        '<code>pubsub.Channel()</code> mengembalikan channel Go berisi pesan masuk; perulangan berhenti dengan sendirinya ketika <code>Close()</code> dipanggil atau konteks dibatalkan.',
        '<code>pubsub.Receive(ctx)</code> dipakai sebagai langkah pengesahan: error koneksi langsung terlihat di sini, bukan setelah program menunggu lama tanpa pesan masuk.',
        'Proses penerbit cukup memanggil <code>rdb.Publish</code> dengan channel dan isi yang sama — tidak ada daftar consumer yang perlu dideklarasikan lebih dulu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Redis Streams: Log yang Menyimpan dan Mencatat Siapa yang Sudah Baca</h3><p><b>Streams</b> adalah struktur data Redis berupa log yang hanya bertambah. Setiap entri diberi <b>ID otomatis berbasis waktu</b> (format milidetik-urutan, misalnya <code>1730000000000-0</code>) beserta daftar pasangan field-value bebas. Karena idnya terurut waktu, kamu bisa membaca rentang dengan <code>XRANGE</code>, menghitung panjang dengan <code>XLEN</code>, dan membaca ulang dari titik mana pun.</p><p>Yang membuatnya layak disebut antrean adalah <b>consumer group</b>. Satu group dibuat di atas satu stream; setiap consumer di dalamnya menerima porsi pesan yang berbeda, sehingga beban terbagi tanpa saling berebut. Tiga mekanisme yang menyertainya:</p><ul><li><b>XREADGROUP</b> dengan penanda <code>&gt;</code> mengambil pesan yang belum pernah diserahkan ke group (dan menandainya sebagai milik consumer tersebut).</li><li><b>PEL (pending entries list)</b> — daftar pesan yang sudah diserahkan tetapi <b>belum di-ACK</b>. Selama ada di daftar ini, pesan tidak hilang.</li><li><b>XACK</b> menghapus pesan dari PEL; bila consumer mati sebelum meng-ACK, <b>XAUTOCLAIM</b> mengambil alihnya untuk consumer lain setelah jeda tertentu.</li></ul><p>Konsekuensinya, lag bisa dipantau: selisih antara <code>XINFO GROUPS</code> (posisi terakhir diserahkan) dan panjang stream memberi tahu berapa banyak pekerjaan yang masih menumpuk.</p>'
    },
    {
      type: 'example',
      title: 'Alur lengkap Streams: menulis, bergabung ke group, dan meng-ACK',
      lang: 'redis',
      output: false,
      code: '# Producer menulis satu entri; ID digenerate otomatis\n127.0.0.1:6379> XADD orders * order-id 1024 status baru\n"1730000000000-0"\n127.0.0.1:6379> XLEN orders\n(integer) 1\n127.0.0.1:6379> XRANGE orders - +\n1) 1) "1730000000000-0"\n   2) 1) "order-id"\n      2) "1024"\n      3) "status"\n      4) "baru"\n\n# Bentuk consumer group mulai dari awal stream (0), buat stream bila belum ada\n127.0.0.1:6379> XGROUP CREATE orders workers 0 MKSTREAM\nOK\n\n# Consumer A membaca pesan yang belum pernah diserahkan (penanda >)\n127.0.0.1:6379> XREADGROUP GROUP workers consumer-a COUNT 1 BLOCK 2000 STREAMS orders >\n1) 1) "orders"\n   2) 1) 1) "1730000000000-0"\n         2) 1) "order-id"\n            2) "1024"\n            3) "status"\n            4) "baru"\n\n# Pesan masih tertunda sampai di-ACK\n127.0.0.1:6379> XPENDING orders workers\n1) "1730000000000-0"\n2) "1730000000000-0"\n3) (integer) 1\n4) 1) 1) "consumer-a"\n      2) "1"\n\n# Selesai diproses\n127.0.0.1:6379> XACK orders workers 1730000000000-0\n(integer) 1\n\n# Consumer A mati: ambil alih pesan yang lewat jeda 60 detik\n127.0.0.1:6379> XAUTOCLAIM orders workers consumer-b 60000 0-0 COUNT 10\n1) "1730000000001-0"\n2) 1) 1) "1730000000000-0"\n      2) 1) "order-id"\n         2) "1024"\n         3) "status"\n         4) "baru"\n3) (empty array)',
      explain: [
        '<code>XADD ... *</code> membiarkan Redis membuat ID berbasis waktu, sehingga urutan entri tidak perlu diatur oleh aplikasi; field-nya bebas dan bisa berbeda antar entri.',
        'Setelah <code>XREADGROUP</code>, pesan masuk PEL — terlihat dari <code>XPENDING</code> — dan hanya <code>XACK</code> yang mengangkatnya selesai.',
        '<code>XAUTOCLAIM</code> adalah penyelamat saat consumer tiba-tiba mati: pesan yang belum di-ACK diambil alih consumer lain, bukan ditinggalkan selamanya.',
        'Perhatikan dua penanda pada XREADGROUP: <code>&gt;</code> berarti "yang belum pernah diserahkan", sedangkan ID tertentu berarti "baca ulang dari titik itu" — keduanya dipakai untuk dua tujuan berbeda.'
      ]
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Consumer group pada Redis Streams: producer menulis ke stream, group menyalurkan ke consumer A dan B dengan daftar pending"><rect x="20" y="35" width="140" height="55" rx="8" class="u-box"/><text x="90" y="59" class="u-title" text-anchor="middle">Producer</text><text x="90" y="79" class="u-lbl" text-anchor="middle">XADD orders *</text><line x1="160" y1="63" x2="214" y2="63" class="u-line" marker-end="url(#u-arrow)"/><text x="187" y="53" class="u-lbl" text-anchor="middle">tulis</text><rect x="220" y="35" width="190" height="55" rx="8" class="u-hl"/><text x="315" y="59" class="u-title" text-anchor="middle">Stream: orders</text><text x="315" y="79" class="u-lbl" text-anchor="middle">log terurut per ID</text><line x1="410" y1="63" x2="444" y2="63" class="u-line" marker-end="url(#u-arrow)"/><text x="427" y="53" class="u-lbl" text-anchor="middle">baca</text><rect x="450" y="30" width="290" height="65" rx="8" class="u-box"/><text x="595" y="54" class="u-title" text-anchor="middle">Consumer Group: workers</text><text x="595" y="76" class="u-lbl" text-anchor="middle">last-delivered-id + PEL</text><line x1="510" y1="95" x2="510" y2="130" class="u-line"/><line x1="510" y1="130" x2="355" y2="130" class="u-line"/><line x1="355" y1="130" x2="355" y2="168" class="u-line" marker-end="url(#u-arrow)"/><text x="432" y="122" class="u-lbl" text-anchor="middle">XREADGROUP</text><line x1="660" y1="95" x2="660" y2="168" class="u-line" marker-end="url(#u-arrow)"/><text x="704" y="135" class="u-lbl" text-anchor="start">COUNT 100</text><rect x="265" y="175" width="180" height="55" rx="8" class="u-hl"/><text x="355" y="199" class="u-title" text-anchor="middle">Consumer A</text><text x="355" y="219" class="u-lbl" text-anchor="middle">proses lalu XACK</text><rect x="570" y="175" width="170" height="55" rx="8" class="u-box"/><text x="655" y="199" class="u-title" text-anchor="middle">Consumer B</text><text x="655" y="219" class="u-lbl" text-anchor="middle">porsi berbeda</text><rect x="30" y="175" width="180" height="55" rx="8" class="u-box"/><text x="120" y="199" class="u-title" text-anchor="middle">PEL (pending)</text><text x="120" y="219" class="u-lbl" text-anchor="middle">belum di-ACK</text><line x1="261" y1="203" x2="216" y2="203" class="u-dash" marker-end="url(#u-arrow)"/><text x="238" y="194" class="u-lbl" text-anchor="middle">gagal</text><line x1="120" y1="230" x2="120" y2="262" class="u-dash"/><line x1="120" y1="262" x2="595" y2="262" class="u-dash"/><line x1="595" y1="262" x2="595" y2="97" class="u-dash" marker-end="url(#u-arrow)"/><text x="360" y="285" class="u-lbl" text-anchor="middle">XAUTOCLAIM mengambil alih pesan dari consumer yang mati</text></svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Consumer group pada Redis Streams: producer menulis ke stream, group membagi bacaan ke consumer A dan B, sementara pesan belum di-ACK tercatat di PEL</figcaption></figure>'
    },
    {
      type: 'text',
      html: '<h3>Redis Streams vs RabbitMQ vs Kafka</h3><p>Ketiganya bisa dipakai untuk mengalirkan pesan, tetapi dibangun di atas filosofi yang berbeda. Bila timmu sudah memakai Redis, Streams adalah langkah alami; bila butuh routing dan penanganan gagal yang kaya, RabbitMQ; bila butuh throughput log raksasa dengan riwayat panjang, Kafka.</p><table><thead><tr><th></th><th>Redis Streams</th><th>RabbitMQ</th><th>Apache Kafka</th></tr></thead><tbody><tr><td><b>Ketahanan data</b></td><td>Tersimpan di Redis (RDB/AOF), bisa dibaca ulang per ID</td><td>Tersimpan di queue sampai di-ACK, ada dead letter exchange</td><td>Log terdistribusi dengan replikasi dan retensi yang diatur</td></tr><tr><td><b>Routing</b></td><td>Sederhana: satu stream, tanpa aturan rumit</td><td>Paling kaya: exchange, binding, pola routing</td><td>Berdasarkan topik dan partisi, urutan terjaga per partisi</td></tr><tr><td><b>Kelompok konsumen</b></td><td>Bawaan lewat XREADGROUP, PEL, dan XACK</td><td>Beberapa consumer pada satu queue dengan prefetch</td><td>Consumer group dengan offset commit</td></tr><tr><td><b>Kekuatan utama</b></td><td>Ringan, satu server, satu teknologi dengan cache</td><td>Kontrol atas gagalnya pengiriman dan routing</td><td>Skala besar dan riwayat yang bisa diputar ulang</td></tr></tbody></table><p>Praktik yang lazim: pakai <b>Streams</b> ketika volumenya moderat, latensi harus super rendah, dan tim sudah akrab dengan Redis; bila pesan wajib bertahan lama, perlu routing kompleks, atau butuh pengamatan matang (dashboard, retry policy bawaan), pindahlah ke RabbitMQ atau Kafka sejak dini — bukan setelah data penting terlanjur hilang.</p>'
    },
    {
      type: 'text',
      html: '<h3>Distributed Lock: Satu Pemenang dari Banyak Proses</h3><p>Ketika beberapa instance aplikasi berjalan di banyak mesin, kadang ada pekerjaan yang hanya boleh dikerjakan <b>sekali</b>: menjadwalkan laporan, menghapus file basi, atau mengambil satu baris dari antrean. <b>Distributed lock</b> memberi satu pemenang lewat satu kunci di Redis.</p><p>Resep dasarnya adalah kombinasi <code>SET</code> dengan dua opsi sekaligus:</p><ul><li><b>NX</b> (<i>only if not exists</i>) — kunci hanya dibuat bila belum ada; inilah sisi atomik yang membuat dua proses tidak pernah sama-sama menang.</li><li><b>PX 30000</b> — kunci kedaluwarsa otomatis dalam 30 detik, sehingga proses yang crash di tengah jalan tidak mengunci sistem selamanya.</li></ul><p>Pemenang juga menyimpan <b>token unik miliknya sendiri</b> (misalnya UUID). Saat selesai, ia tidak boleh sekadar <code>DEL</code> — karena bila kerjanya molor melewati batas PX, kunci sudah kedaluwarsa dan dimiliki proses lain; <code>DEL</code> sembarangan akan merampas kunci orang lain. Pelepasan yang aman dilakukan memakai skrip kecil: baca dulu, bandingkan token, baru hapus.</p>'
    },
    {
      type: 'example',
      title: 'Membuat, mempertahankan, dan melepas kunci dengan aman',
      lang: 'redis',
      output: false,
      code: '# 1) Rebut kunci: NX menolak bila sudah ada, PX memberi batas 30 detik\n127.0.0.1:6379> SET lock:laporan token-abc-77 NX PX 30000\nOK\n\n# 2) Proses lain mencoba di detik yang sama — kalah\n127.0.0.1:6379> SET lock:laporan token-lain-99 NX PX 30000\n(nil)\n\n# 3) Pelepasan aman: hapus hanya bila token masih milik kita\n127.0.0.1:6379> EVAL "if redis.call(\'GET\', KEYS[1]) == ARGV[1] then return redis.call(\'DEL\', KEYS[1]) else return 0 end" 1 lock:laporan token-abc-77\n(integer) 1\n\n# 4) Bahaya tanpa verifikasi token: kunci sudah kedaluwarsa dan diambil orang lain\n127.0.0.1:6379> SET lock:laporan token-baru-11 NX PX 30000\nOK\n127.0.0.1:6379> DEL lock:laporan\n(integer) 1   # proses lama menghapus kunci milik proses baru!\n\n# 5) Periksa sisa masa berlaku kunci yang sedang dipegang\n127.0.0.1:6379> PTTL lock:laporan\n(integer) -2',
      explain: [
        'Balasan <code>OK</code> berarti proses itu memenangkan kunci; balasan <code>(nil)</code> berarti sudah ada pemenang lain dan proses ini harus mundur atau mencoba lagi nanti.',
        'Skrip pada langkah ketiga adalah satu-satunya cara pelepasan yang aman: bila token tidak cocok, ia tidak menyentuh kunci — persis seperti yang ditunjukkan langkah keempat.',
        'Langkah keempat disengaja ditampilkan sebagai anti-pattern: <code>DEL</code> tanpa verifikasi membuat dua proses merasa sama-sama memegang lock.',
        '<code>PTTL</code> mengembalikan sisa waktu milidetik; nilai <code>-2</code> menandakan kunci sudah tidak ada lagi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Perpanjangan Otomatis, Redlock, dan Kapan Lock Tidak Perlu</h3><p>Kerja yang lebih lama dari TTL membuat lock kedaluwarsa di tengah jalan. Solusinya adalah <b>auto-renewal</b>: selama pekerjaan berlangsung, pemegang lock memperpanjang TTL berkala (misalnya tiap 10 detik untuk TTL 30 detik) memakai skrip verifikasi token yang sama. Begitu pekerjaan selesai (atau prosesnya mati), perpanjangan berhenti dan kunci lepas sendiri.</p><p>Untuk sistem dengan banyak node Redis, algoritma <b>Redlock</b> menawarkan lock dengan meminta kunci pada mayoritas dari lima instance sekaligus, sehingga kegagalan satu mesin tidak merampas lock. Namun perdebatannya panjang — butuh sinkronisasi jam yang ketat dan tetap tidak menjamin keabsahan logika di sisi aplikasi. Praktik yang lebih sering terbukti: <b>pastikan pekerjaanmu idempoten</b> lalu pakai lock tunggal pada Redis yang memang menjadi satu-satunya sumber kebenaran.</p><p>Panduan keputusan singkat:</p><ul><li><b>Lock perlu</b> ketika pekerjaannya mahal dan menghasilkan efek ganda bila dijalankan dua kali (menjalankan migrasi, mengirim surel massal, menjadwalkan tugas terjadwal).</li><li><b>Desain idempoten lebih baik</b> ketika operasinya sudah bisa ditulis ulang dengan aman: beri ID unik pada setiap permintaan lalu abaikan yang sudah pernah diproses. Cara ini jauh lebih tahan banting daripada kunci yang bisa saja lepas.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern yang Sering Muncul</h3><ul><li><b>Memakai Pub/Sub untuk tugas kritis.</b> Subscriber yang sedang restart, atau antrian dalam prosesnya yang penuh, membuat pesan hilang tanpa jejak — pembayaran yang tidak terproses bukanlah hal yang bisa ditoleransi.</li><li><b>Lock tanpa TTL.</b> Proses pemenang crash di tengah jalan dan kunci tidak pernah terbuka; seluruh instance berhenti selamanya menunggu. Selalu pasang <code>PX</code>.</li><li><b>Melepas lock dengan DEL polos.</b> Tanpa perbandingan token, proses yang lewat waktu menghapus kunci milik proses lain (lihat contoh langkah 4).</li><li><b>TTL lebih pendek daripada durasi kerja tanpa perpanjangan.</b> Dua proses merasa memegang lock pada saat bersamaan — persis masalah yang ingin dihindari, tapi kini terjadi diam-diam.</li><li><b>Mengabaikan PEL pada Streams.</b> Pesan yang belum di-ACK dibiarkan menumpuk tanpa pemantauan; bila consumer mati, tidak ada yang mengambil alih dan lag naik tanpa disadari.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Tiga Alat, Tiga Pertanyaan',
      text: 'Sebelum memilih, tanyakan: (1) "Apakah pesan ini boleh hilang?" — bila tidak, Pub/Sub gugur; (2) "Apakah penerimanya boleh melihat pesan yang sama dua kali?" — bila ya, kerjakan dengan idempoten dan kamu tidak butuh lock sama sekali; (3) "Apakah ini hanya notifikasi sesaat untuk klien yang sedang terbuka?" — bila ya, Pub/Sub sudah lebih dari cukup dan paling murah di antara ketiganya.'
    },
    {
      type: 'warn',
      title: 'Kunci Bukan Pengganti Desain yang Benar',
      text: 'Distributed lock hanya menunda masalah, bukan menghilangkannya: lock bisa lepas di tengah jalan, jaringan bisa terputus sebelum DEL terkirim, dan Redlock tetap berdebat soal jam yang sinkron. Selalu rancang pekerjaan agar <b>aman dijalankan dua kali</b> (idempoten), baru jadikan lock sebagai lapisan penghemat — bukan satu-satunya pengaman.'
    },
    {
      type: 'vocab',
      items: [
        ['Pub/Sub', 'Model kirim-lepas: publisher mengirim pesan ke channel, subscriber yang sedang terhubung menerimanya tanpa penyimpanan.'],
        ['Fire and forget', 'Sifat pesan yang dilepaskan tanpa jaminan pengiriman; bila tidak ada subscriber, pesan hilang begitu saja.'],
        ['PSUBSCRIBE', 'Berlangganan banyak channel sekaligus lewat pola bintang, misalnya notify:*.'],
        ['Redis Streams', 'Struktur log yang hanya bertambah, diberi ID otomatis berbasis waktu, dan bisa dibaca ulang dari titik mana pun.'],
        ['Consumer group', 'Kelompok pembaca pada satu stream yang membagi pesan di antara anggotanya serta mencatat posisi baca bersama.'],
        ['PEL (pending entries list)', 'Daftar pesan yang sudah diserahkan ke consumer tetapi belum di-ACK; di sinilah pesan yang berisiko tinggal terpantau.'],
        ['XAUTOCLAIM', 'Perintah mengambil alih pesan dari consumer yang dianggap mati setelah jeda waktu tertentu.'],
        ['Distributed lock', 'Mekanisme agar hanya satu proses dari banyak mesin yang mengerjakan satu pekerjaan, umumnya memakai SET dengan NX dan PX.'],
        ['Idempoten', 'Sifat operasi yang tetap menghasilkan hasil sama walau dijalankan berulang kali; pengganti terbaik untuk mengandalkan lock.']
      ]
    }
  ],
  recap: [
    'Redis Pub/Sub bersifat kirim-lepas: cocok untuk notifikasi ringan, tetapi pesan hilang ketika subscriber sedang tidak terhubung.',
    'Redis Streams menyimpan pesan dalam log terurut; consumer group membagi bacaan, PEL mencatat yang belum di-ACK, dan XAUTOCLAIM menyelamatkan pesan dari consumer yang mati.',
    'Dibandingkan RabbitMQ dan Kafka, Streams unggul pada kesederhanaan dan integrasi dengan Redis, sedangkan dua lainnya unggul pada routing kaya dan skala log besar.',
    'Distributed lock memakai SET dengan NX dan PX plus token unik; pelepasan wajib memakai Lua, perpanjangan otomatis menjaga kerja panjang, dan desain idempoten tetap lebih baik daripada mengandalkan lock sepenuhnya.'
  ]
});
