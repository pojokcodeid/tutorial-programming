/* ============================================================
   Pelajaran Redis — Bab 6: Integrasi Redis dengan Go
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'integrasi-go',
  title: 'Integrasi Redis dengan Go',
  chapter: 'Integrasi Go',
  duration: '12–14 menit',
  intro: [
    'Seorang kurir yang berhenti di tiap rumah untuk mengambil peta baru setiap kali berangkat akan menghabiskan setengah harinya di jalan. Aplikasi Go yang membuka koneksi Redis baru untuk setiap permintaan menghadapi nasib serupa: <b>handshake TCP, autentikasi, lalu menutup lagi</b> — pekerjaan yang sama sekali tidak menghasilkan data. Pustaka <b>go-redis v9</b> menyelesaikannya dengan kumpulan koneksi (pool) yang dipakai ulang, sehingga permintaan berikutnya tinggal mengambil koneksi yang sudah hangat.',
    'Bab ini membedah cara memakai go-redis sehari-hari: membuat klien sekali di seluruh program, mengirim perintah <code>SET</code>/<code>GET</code>/<code>EXPIRE</code>/<code>DEL</code> dengan <code>context.Context</code> dan batas waktu, membedakan kondisi <code>redis.Nil</code> (key tidak ada) dari error sungguhan, serta mengatur ukuran pool agar tidak membanjiri maupun melaparkan server Redis.',
    'Kamu juga akan belajar dua teknik percepat: <b>pipeline</b> untuk mengirim banyak perintah dalam satu perjalanan jaringan, dan <b>serialisasi struct ke JSON</b> untuk menyimpan objek sebagai String maupun Hash. Bab ini ditutup dengan contoh repository cache produk memakai pola cache-aside, daftar anti-pattern yang paling sering muncul, serta catatan singkat tentang klien alternatif <code>rueidis</code>.'
  ],
  objectives: [
    'Memasang go-redis v9 dan membuat klien Redis dengan konfigurasi koneksi yang tepat',
    'Menjalankan perintah SET, GET, EXPIRE, dan DEL dengan context.Context serta penanganan error redis.Nil',
    'Menjelaskan cara kerja connection pool dan memilih PoolSize, MinIdleConns, dan DialTimeout',
    'Menggunakan pipeline serta menyimpan struct Go sebagai JSON pada pola cache-aside'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Memasang go-redis dan Menyiapkan Modul</h3><p>Pastikan Redis sudah berjalan di mesinmu (contoh materi ini memakai port 6379) dan Go versi 1.21 atau lebih baru terpasang. Satu perintah sudah cukup untuk menarik pustaka beserta dependensinya.</p><p>Struktur proyek yang dipakai sepanjang bab ini sengaja dibuat kecil: satu berkas untuk klien dan perintah dasar, satu berkas lagi untuk repository cache. Tujuannya agar kamu melihat bahwa integrasi Redis tidak butuh framework — cukup satu klien yang dibagikan ke seluruh program.</p>'
    },
    {
      type: 'example',
      title: 'Membuat modul Go dan memasang go-redis v9',
      lang: 'bash',
      output: false,
      code: '# Buat folder proyek dan inisialisasi modul\nmkdir redis-go && cd redis-go\ngo mod init redis-go\n\n# Pasang pustaka resmi Redis untuk Go\ngo get github.com/redis/go-redis/v9\n\n# Pastikan server Redis hidup dan menjawab\nredis-cli ping\n# PONG\n\n# Lihat dependensi yang tercatat di go.mod\ngrep redis go.mod\n# github.com/redis/go-redis/v9 v9.x.x',
      explain: [
        '<code>go get github.com/redis/go-redis/v9</code> menambahkan pustaka ke go.mod dan go.sum; jalur v9 adalah versi yang dirancang untuk Redis 7.x dan memakai <code>context.Context</code> pada hampir seluruh fungsi.',
        '<code>redis-cli ping</code> yang membalas <code>PONG</code> memastikan server benar-benar aktif sebelum program mencoba koneksi — kegagalan koneksi Go jauh lebih mudah dicari bila kamu sudah tahu servernya hidup.',
        'Catat versi di go.mod: perilaku antar versi bisa berbeda (misalnya nama opsi pool), sehingga dokumentasi selalu paling akurat diikuti sesuai versi yang terpasang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membuat Klien Sekali, Memakai context di Setiap Perintah</h3><p><code>redis.NewClient(&amp;redis.Options{...})</code> membuat satu objek klien yang wajib <b>dibuat sekali dan dibagikan</b> ke seluruh aplikasi. Objek ini sudah membawa kumpulan koneksi di dalamnya; membuatnya berulang tiap request justru membuang manfaat pool.</p><p>Setiap perintah menerima <code>context.Context</code>. Pola yang benar adalah membuat konteks berbatas waktu untuk tiap operasi, misalnya satu detik:</p><ul><li><b>Kenapa perlu timeout?</b> Tanpa batas waktu, satu Redis yang melambat akan membuat goroutine handler menumpuk tanpa batas sampai layanan ikut mati.</li><li><b>Kenapa memakai konteks request?</b> Dengan <code>r.Context()</code>, bila klien HTTP membatalkan permintaan, kueri Redis yang sedang berjalan ikut dibatalkan — tidak ada pekerjaan yang dikerjakan untuk permintaan yang sudah ditinggal.</li><li><b>Memisahkan dua jenis kegagalan:</b> <code>redis.Nil</code> berarti key tidak ada (kondisi normal, biasanya berarti miss), sedangkan error lain berarti koneksi bermasalah dan perlu dicatat atau ditangani.</li></ul>'
    },
    {
      type: 'example',
      title: 'Klien go-redis dengan SET, GET, EXPIRE, dan DEL',
      lang: 'go',
      output: false,
      code: 'package main\n\nimport (\n  "context"\n  "errors"\n  "fmt"\n  "time"\n\n  "github.com/redis/go-redis/v9"\n)\n\nfunc main() {\n  rdb := redis.NewClient(&redis.Options{\n    Addr:     "localhost:6379",\n    Password: "", // kosong bila Redis tanpa kata sandi\n    DB:       0,\n  })\n  defer rdb.Close()\n\n  ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)\n  defer cancel()\n\n  // SET dengan masa berlaku 10 menit\n  if err := rdb.Set(ctx, "session:abc", "andi", 10*time.Minute).Err(); err != nil {\n    panic(err)\n  }\n\n  // GET: bedakan key tidak ada (redis.Nil) dan koneksi gagal\n  val, err := rdb.Get(ctx, "session:abc").Result()\n  switch {\n  case errors.Is(err, redis.Nil):\n    fmt.Println("key tidak ditemukan (miss)")\n  case err != nil:\n    panic(err)\n  default:\n    fmt.Println("nilai:", val)\n  }\n\n  // EXPIRE memperpanjang umur, TTL mengecek sisa, DEL menghapus\n  fmt.Println("sisa TTL:", rdb.TTL(ctx, "session:abc").Val())\n  rdb.Expire(ctx, "session:abc", 30*time.Minute)\n  fmt.Println("jumlah key terhapus:", rdb.Del(ctx, "session:abc").Val())\n}',
      explain: [
        'Klien dibuat satu kali di <code>main</code> lalu dipakai ulang; <code>defer rdb.Close()</code> menutup seluruh koneksi di dalam pool ketika program selesai.',
        'Pola <code>errors.Is(err, redis.Nil)</code> adalah cara idiomatik membedakan miss dari kegagalan sungguhan — jangan pernah memperlakukan keduanya sebagai satu jenis error yang sama.',
        '<code>TTL</code>, <code>Expire</code>, dan <code>Del</code> masing-masing mengembalikan objek perintah; metode <code>.Val()</code> mengambil nilainya bila kamu tidak peduli error, sedangkan <code>.Err()</code> mengambil errornya saja.',
        'Timeout dibatasi dua detik lewat <code>context.WithTimeout</code>: bila Redis tidak menjawab dalam rentang itu, perintah dibatalkan dan handler bebas melanjutkan jalur lain.'
      ]
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 310" width="760" role="img" aria-label="Alur permintaan HTTP ke handler Go lalu ke pool koneksi go-redis yang mengarah ke Redis dan MariaDB"><rect x="20" y="35" width="170" height="60" rx="8" class="u-box"/><text x="105" y="60" class="u-title" text-anchor="middle">Request HTTP</text><text x="105" y="82" class="u-lbl" text-anchor="middle">GET /products/42</text><line x1="190" y1="65" x2="234" y2="65" class="u-line" marker-end="url(#u-arrow)"/><text x="212" y="55" class="u-lbl" text-anchor="middle">net/http</text><rect x="240" y="35" width="175" height="60" rx="8" class="u-box"/><text x="327" y="60" class="u-title" text-anchor="middle">Handler Go</text><text x="327" y="82" class="u-lbl" text-anchor="middle">ctx + timeout 800 ms</text><line x1="415" y1="65" x2="454" y2="65" class="u-line" marker-end="url(#u-arrow)"/><text x="434" y="55" class="u-lbl" text-anchor="middle">rdb.Get</text><rect x="460" y="35" width="200" height="60" rx="8" class="u-hl"/><text x="560" y="60" class="u-title" text-anchor="middle">Pool koneksi go-redis</text><text x="560" y="82" class="u-lbl" text-anchor="middle">PoolSize 10 · MinIdle 2</text><line x1="520" y1="95" x2="520" y2="130" class="u-line"/><line x1="520" y1="130" x2="390" y2="130" class="u-line"/><line x1="390" y1="130" x2="390" y2="168" class="u-line" marker-end="url(#u-arrow)"/><text x="455" y="122" class="u-lbl" text-anchor="middle">selalu dicoba</text><line x1="600" y1="95" x2="600" y2="168" class="u-line" marker-end="url(#u-arrow)"/><text x="676" y="140" class="u-lbl" text-anchor="middle">miss saja</text><rect x="300" y="175" width="180" height="60" rx="8" class="u-hl"/><text x="390" y="200" class="u-title" text-anchor="middle">Redis</text><text x="390" y="222" class="u-lbl" text-anchor="middle">GET product:42</text><rect x="510" y="175" width="180" height="60" rx="8" class="u-box"/><text x="600" y="200" class="u-title" text-anchor="middle">MariaDB</text><text x="600" y="222" class="u-lbl" text-anchor="middle">SELECT ... WHERE id</text><rect x="20" y="255" width="720" height="45" rx="8" class="u-box"/><text x="380" y="283" class="u-lbl" text-anchor="middle">satu koneksi TCP dipakai ulang oleh banyak request — tanpa handshake baru tiap permintaan</text></svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Permintaan HTTP melewati handler Go lalu pool koneksi go-redis menuju Redis; MariaDB hanya dituju saat terjadi miss</figcaption></figure>'
    },
    {
      type: 'text',
      html: '<h3>Connection Pool: Mengapa Koneksi Dipakai Ulang</h3><p>Membuka satu koneksi ke Redis bukan hal murah: <b>handshake TCP</b> tiga arah, bila memakai TLS ditambah negosiasi sertifikat, lalu <code>AUTH</code> dan pemilihan database. Bila tiap request menempuh jalur itu, latensi koneksi justru bisa lebih besar daripada waktu membaca datanya sendiri. Pool menyelesaikannya dengan menyimpan koneksi terbuka dan meminjamkannya sesingkat mungkin.</p><p>Empat pengaturan yang paling sering disentuh di <code>redis.Options</code>:</p><ul><li><b>PoolSize</b> — jumlah maksimum koneksi yang boleh dipakai bersamaan. Angka terlalu besar membuat Redis kewalahan (Redis melayani klien pada satu proses utama untuk kebanyakan perintah), terlalu kecil membuat antrean menunggu. Titik awal wajar: 10 kali jumlah CPU yang dipakai.</li><li><b>MinIdleConns</b> — koneksi yang dijaga tetap siap. Tanpa ini, saat trafik datang mendadak pool harus membangun koneksi lagi dari nol.</li><li><b>DialTimeout</b> — batas waktu membuka koneksi baru; jangan biarkan melebihi timeout permintaanmu.</li><li><b>ReadTimeout / WriteTimeout</b> — batas menunggu balasan perintah; inilah pelindung terakhir bila server berhenti menjawab.</li></ul><p>Satu klien untuk seluruh proses adalah aturan mainnya: dibagikan lewat variabel global, dependency injection, atau singleton — bukan dibuat di dalam handler.</p>'
    },
    {
      type: 'text',
      html: '<h3>Pipeline: Banyak Perintah dalam Satu Perjalanan</h3><p>Tanpa pipeline, membaca 100 key berarti 100 perjalanan pulang-pergi ke server. Dengan pipeline, go-redis menumpuk perintah dalam memori lalu mengirim dan menerima semuanya dalam <b>satu round-trip</b>. Bila jaringanmu berlatensi 1 ms, penghematannya langsung terasa: 100 ms menjadi sekitar 1 ms.</p><p>Penting untuk tidak mencampur tiga konsep berikut:</p><table><thead><tr><th></th><th>Perintah biasa</th><th>Pipeline (Pipeliner)</th><th>Transaksi (TxPipeliner)</th></tr></thead><tbody><tr><td><b>Round-trip</b></td><td>Satu perintah, satu perjalanan</td><td>Ribuan perintah, satu perjalanan</td><td>Satu perjalanan untuk seluruh batch</td></tr><tr><td><b>Jaminan</b></td><td>Urutan per klien terjamin</td><td>Urutan terjamin, tetapi bukan kesatuan</td><td>Dijalankan di dalam MULTI/EXEC</td></tr><tr><td><b>Kegagalan</b></td><td>Hanya perintah itu</td><td>Bisa gagal di tengah, sebagian berhasil</td><td>Semua berhasil atau semua batal</td></tr><tr><td><b>Cocok untuk</b></td><td>Operasi sesekali</td><td>Baca/tulis banyak key sekaligus</td><td>Operasi yang harus berbarengan</td></tr></tbody></table><p>Perhatikan kata <b>batas</b>: pipeline mempercepat pengiriman, tetapi tidak menjadikan urutan itu transaksional. Untuk kesatuan, gunakan <code>TxPipeliner</code>; untuk deteksi konflik, gunakan <code>WATCH</code> — keduanya dibahas di bab Transaksi &amp; Operasi Atomik.</p>'
    },
    {
      type: 'text',
      html: '<h3>Menyimpan Struct sebagai JSON</h3><p>Redis tidak tahu struktur objek Go; ia hanya memahami String, Hash, List, Set, dan sebagainya. Jadi setiap objek harus <b>diseragamkan</b> (serialisasi) terlebih dahulu. Pilihan paling umum adalah <code>encoding/json</code>:</p><ul><li><b>Sebagai satu String</b> — <code>json.Marshal</code> lalu <code>SET key nilai</code>. Kunci utuh sebagai satu nilai, sehingga dibaca dan dihapus dengan satu langkah. Inilah pilihan utama untuk cache-aside.</li><li><b>Sebagai Hash</b> — <code>HSET key field1 value1 field2 value2</code>. Cocok bila hanya satu bagian yang sering berubah (misalnya mengubah <code>stock</code> tanpa menulis ulang seluruh objek).</li></ul><p>Dua hal praktis yang sering dilewatkan: pertama, tambahkan <b>tag json</b> pada struct agar kunci JSON tidak bergantung pada nama field Go dan tetap stabil walau nama field diubah; kedua, perhatikan <b>ukuran</b> — objek 1 MB yang dibaca ribuan kali per detik menghabiskan memori dan bandwidth, sedangkan cache lebih efisien untuk objek kecil-padat.</p>'
    },
    {
      type: 'example',
      title: 'Repository produk dengan pola cache-aside',
      lang: 'go',
      output: false,
      code: 'package main\n\nimport (\n  "context"\n  "database/sql"\n  "encoding/json"\n  "errors"\n  "fmt"\n  "time"\n\n  "github.com/redis/go-redis/v9"\n)\n\ntype Product struct {\n  ID    int\n  Name  string\n  Price int64\n  Stock int\n}\n\ntype ProductRepo struct {\n  db  *sql.DB\n  rdb *redis.Client\n  ttl time.Duration\n}\n\nfunc NewProductRepo(db *sql.DB, rdb *redis.Client) *ProductRepo {\n  return &ProductRepo{db: db, rdb: rdb, ttl: 5 * time.Minute}\n}\n\nfunc (r *ProductRepo) GetProduct(ctx context.Context, id int) (*Product, error) {\n  key := fmt.Sprintf("product:%d", id)\n\n  // 1) coba cache\n  raw, err := r.rdb.Get(ctx, key).Result()\n  if err == nil {\n    var p Product\n    if uErr := json.Unmarshal([]byte(raw), &p); uErr == nil {\n      return &p, nil // HIT\n    }\n    // nilai cache rusak: buang dan muat ulang dari database\n  } else if !errors.Is(err, redis.Nil) {\n    fmt.Println("peringatan redis:", err) // lanjut ke database\n  }\n\n  // 2) MISS: baca MariaDB\n  var p Product\n  err = r.db.QueryRowContext(ctx,\n    "SELECT id, name, price, stock FROM products WHERE id = ?", id).\n    Scan(&p.ID, &p.Name, &p.Price, &p.Stock)\n  if errors.Is(err, sql.ErrNoRows) {\n    return nil, nil // produk memang tidak ada\n  }\n  if err != nil {\n    return nil, err\n  }\n\n  // 3) isi ulang cache; kegagalan menulis tidak menggagalkan pembacaan\n  if body, mErr := json.Marshal(p); mErr == nil {\n    r.rdb.Set(ctx, key, body, r.ttl)\n  }\n  return &p, nil\n}',
      explain: [
        'Struktur metodenya identik dengan alur gambar 5.1: <code>Get</code> ke Redis, lalu bila miss baru <code>QueryRowContext</code> ke MariaDB, dan terakhir mengisi ulang cache dengan TTL lima menit.',
        'Tiga jenis hasil ditangani berbeda: <code>redis.Nil</code> (miss, normal), nilai cache tidak bisa di-unmarshal (rusak, buang lalu muat ulang), dan error koneksi Redis (catatkan, tetap lanjut ke database).',
        'Klien dan database disimpan sebagai milik struct, bukan dibuat di dalam metode — ini yang membuat pool koneksi benar-benar dipakai ulang antar permintaan.',
        'Tanpa tag json, kunci hasil marshal mengikuti nama field Go (<code>ID</code>, <code>Name</code>). Tambahkan tag json agar skema JSON tetap stabil sekalipun nama field berubah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alternatif Klien: rueidis</h3><p><code>go-redis</code> adalah pilihan default: populer, dokumentasinya lengkap, dan mendukung hampir semua perintah Redis. Bila profil menunjukkan komunikasi klien jadi titik sesak, ada alternatif bernama <b>rueidis</b> yang dirancang lebih agresif: mengutamakan <b>pipeline RESP3</b>, mendukung <b>client-side caching</b> (Redis menahan klien bila nilai di-cache lokalnya basi), dan API-nya lebih rendah ke lantai. Perkiraan sederhananya: mulai dari go-redis karena jalur belajarnya paling ramah, pertimbangkan rueidis ketika ukuran, jumlah klien, atau latensi ujung-ke-ujung benar-benar jadi masalah yang terukur — bukan karena sekadar terdengar lebih cepat.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern Integrasi Redis di Go</h3><ul><li><b>Membuat klien di dalam handler.</b> <code>redis.NewClient</code> pada setiap permintaan berarti membangun dan membuang pool baru tiap request; kinerja anjlok dan koneksi menumpuk. Buat sekali, bagikan.</li><li><b>Lupa context timeout.</b> Satu perintah tanpa batas waktu membuat goroutine menunggu selamanya ketika Redis hang; antrean goroutine tumbuh tanpa terkendali sampai layanan kehabisan memori.</li><li><b>Menelan error tanpa catatan.</b> Mengabaikan <code>err</code> membuat kegagalan cache terlihat sebagai "lambat saja" padahal setiap permintaan sedang jatuh ke database.</li><li><b>Menaruh nama key secara acak.</b> Tanpa pola seperti <code>product:{id}</code> atau prefiks <code>app:</code>, penghapusan manual dan pemantauan menjadi mustahil saat data ratusan ribu key.</li><li><b>Memindahkan objek besar ke Redis tiap baca.</b> Serialisasi ulang JSON berukuran ratusan kilobyte menghabiskan CPU dan bandwidth; kadang lebih baik cache pada ringkasan yang ringan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Ukur Dulu, Optimalkan Kemudian',
      text: 'Sebelum menambah pipeline atau membesarkan pool, lihat angkanya: <code>redis-cli --latency</code> untuk latensi dasar, <code>redis-cli INFO commandstats</code> untuk perintah mana yang paling sering dijalankan, dan <code>INFO clients</code> untuk jumlah koneksi yang terbuka. Kebanyakan masalah performa Go + Redis ternyata berasal dari kueri database di bawahnya atau serialisasi yang kelewat besar, bukan dari Redis-nya sendiri.'
    },
    {
      type: 'warn',
      title: 'Satu Klien untuk Seluruh Proses',
      text: 'Jangan membuat <code>redis.NewClient</code> di dalam handler, di dalam fungsi repository, atau di dalam setiap goroutine. Setiap klien membawa pool koneksi sendiri; program yang membuatnya ratusan kali akan membuka ratusan koneksi, lalu server Redis yang sering memakai konfigurasi <code>maxclients</code> dan <code>maxmemory</code> terbatas akan mulai menolak koneksi. Simpan satu klien di tingkat aplikasi dan injeksikan ke mana pun dibutuhkan.'
    },
    {
      type: 'vocab',
      items: [
        ['go-redis v9', 'Pustaka Go resmi untuk Redis pada jalur github.com/redis/go-redis/v9; hampir seluruh metodenya menerima context.Context.'],
        ['redis.Nil', 'Nilai error khusus yang menandakan key tidak ditemukan; dibedakan dari error koneksi maupun error perintah.'],
        ['Connection pool', 'Kumpulan koneksi terbuka yang dipinjamkan sesingkat mungkin, agar handshake TCP tidak terulang tiap permintaan.'],
        ['PoolSize', 'Batas jumlah koneksi yang boleh dipakai bersamaan oleh aplikasi terhadap server Redis.'],
        ['MinIdleConns', 'Jumlah koneksi yang dijaga tetap siap di dalam pool agar trafik datang mendadak tidak perlu membangun koneksi dari nol.'],
        ['Pipeline', 'Teknik mengirim banyak perintah dalam satu perjalanan jaringan; mempercepat, tetapi tidak membuatnya menjadi transaksi.'],
        ['Serialisasi JSON', 'Pengubahan struct Go menjadi teks JSON dengan encoding/json sebelum disimpan sebagai String atau Hash di Redis.'],
        ['rueidis', 'Klien Redis alternatif untuk Go yang menekankan RESP3, pipeline, dan client-side caching.']
      ]
    }
  ],
  recap: [
    'Pasang go-redis dengan go get github.com/redis/go-redis/v9, lalu buat satu klien redis.NewClient yang dibagikan ke seluruh program.',
    'Setiap perintah dibungkus context.Context dengan batas waktu; redis.Nil ditangani sebagai miss, error lain sebagai kegagalan yang perlu dicatat.',
    'Connection pool menghindari handshake ulang: atur PoolSize, MinIdleConns, dan DialTimeout sesuai beban, jangan membuat klien per request.',
    'Pipeline menghemat round-trip untuk banyak perintah, sementara objek Go disimpan sebagai JSON pada String (utuh) atau Hash (per bagian) sesuai pola aksesnya.'
  ]
});
