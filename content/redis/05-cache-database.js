/* ============================================================
   Pelajaran Redis — Bab 5: Pola Cache & Integrasi dengan Database
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'cache-database',
  title: 'Pola Cache & Integrasi dengan Database',
  chapter: 'Pola Penggunaan',
  duration: '12–14 menit',
  intro: [
    'Bayangkan toko bangunan yang sudah berjualan puluhan tahun. Setiap ada pembeli bertanya harga cat, penjaga harus berlari ke gudang paling belakang, membongkar kardus, lalu kembali — lima menit hanya untuk satu pertanyaan. Suatu hari pemilik meletakkan <b>rak depan</b> berisi barang yang paling sering ditanyakan. Pertanyaan berikutnya terjawab dalam hitungan detik, sementara gudang tetap menjadi satu-satunya tempat stok dicatat. Redis di depan MariaDB bekerja persis seperti rak depan itu.',
    'Konsep teknisnya sederhana, tetapi konsekuensinya luas: data yang sering dibaca disimpan di memori Redis selama beberapa menit, aplikasi mengecek cache lebih dulu, dan baru menembus MariaDB ketika data belum ada. Bagian yang sulit bukan menyimpan, melainkan <b>menjaga kecocokan antara dua tempat</b> — kapan cache diisi, kapan harus dihapus, dan bagaimana mencegah jutaan permintaan menyerbu database bersamaan begitu cache kosong.',
    'Bab ini dimulai dari peran Redis di depan MariaDB, lalu empat pola cache (cache-aside, read-through, write-through, write-behind) beserta tabel perbandingannya. Setelah itu kita telusuri alur baca dan tulis cache-aside beserta tiga strategi invalidasi, empat masalah klasik — stampede, avalanche, penetration, dan hot key — sebelum menutup dengan contoh alur aplikasi Go, Redis, dan MariaDB pada endpoint <code>GET /products/{id}</code>, serta situasi di mana cache justru tidak perlu dipakai.'
  ],
  objectives: [
    'Menjelaskan peran Redis sebagai lapisan cache di depan MariaDB dan alasan latensi baca menurun drastis',
    'Membedakan empat pola cache: cache-aside, read-through, write-through, dan write-behind',
    'Menerapkan alur baca dan tulis cache-aside beserta strategi invalidasi yang tepat',
    'Mengenali dan menangani empat masalah klasik cache: stampede, avalanche, penetration, dan hot key'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peran Redis di Depan MariaDB</h3><p>MariaDB adalah sumber kebenaran: data lengkap, relasi, indeks, dan jaminan transaksi ada di sana. Namun setiap baris yang dibaca membawa biaya tersembunyi — parser menganalisis kueri, optimizer memilih rencana eksekusi, storage engine membaca page dari disk (atau setidaknya dari buffer pool), dan bila ada kunci yang dikunci, pembaca ikut menunggu. Untuk kueri sederhana saja angkanya sudah puluhan milidetik; untuk kueri dengan join dan filter yang belum terindeks, bisa ratusan milidetik.</p><p>Redis menyimpan seluruh datanya di RAM, sehingga satu <code>GET</code> pada key tunggal selesai dalam <b>sub-milidetik</b> — seringkali di kisaran 0,2–0,5 ms dari mesin yang sama. Angka kecil ini berubah drastis ketika dikalikan trafik. Sebuah toko daring dengan 2 juta permintaan katalog per jam, bila 95 persennya terjawab dari cache, hanya menyisakan 100 ribu query ke MariaDB — beban yang sangat manusiawi untuk satu instance database.</p><p>Pola paling umum menyebutnya <b>cache di depan database</b>: aplikasi tetap meminta data lewat satu interface logis, tetapi lapisan cache berdiri di antara aplikasi dan database. Perhatikan dua prinsip penting sejak awal:</p><ul><li><b>Cache adalah salinan, bukan tempat asal.</b> Salinan boleh hilang kapan saja; yang hilang harus selalu bisa dibangun ulang dari MariaDB.</li><li><b>Cache hanya membantu bila ada pola akses yang berulang.</b> Data yang dibaca sekali lalu tidak pernah disentuh lagi justru membebani aplikasi dengan pekerjaan menulis yang sia-sia.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Empat Pola Cache yang Perlu Kamu Kenali</h3><p>Istilah cache sering dipakai seolah hanya ada satu cara kerja. Padahal setidaknya ada empat pola yang berbeda tempat keputusan mengisi dan menulis cache berada. Pahami perbedaannya lewat tiga pertanyaan: <b>siapa yang memuat</b>, <b>kapan database ditulis</b>, dan <b>risiko apa yang ditanggung</b>.</p><table><thead><tr><th>Pola</th><th>Siapa memuat cache</th><th>Kapan menulis database</th><th>Risiko utama</th></tr></thead><tbody><tr><td><b>Cache-aside</b> (lazy loading)</td><td>Aplikasi, ketika terjadi miss</td><td>Aplikasi menulis database lebih dulu, lalu menghapus cache</td><td>Data lama tertinggal bila invalidasi terlewat</td></tr><tr><td><b>Read-through</b></td><td>Lapisan cache itu sendiri saat miss, aplikasi hanya meminta data</td><td>Otomatis oleh cache saat miss, sebelum data dikembalikan</td><td>Logika pemuatan terkunci di satu komponen</td></tr><tr><td><b>Write-through</b></td><td>Cache diisi pada saat yang sama dengan penulisan</td><td>Sinkron ke database sebelum permintaan dianggap sukses</td><td>Tulis menjadi lebih lambat; TTL tetap wajib</td></tr><tr><td><b>Write-behind</b></td><td>Cache diisi lebih dulu, database menyusul</td><td>Ditunda dan di-batch di latar belakang</td><td>Data bisa hilang bila proses gagal sebelum tersalin</td></tr></tbody></table><p><b>Cache-aside</b> adalah raja di dunia nyata karena paling sederhana: aplikasi yang memegang kendali penuh, tidak butuh library khusus, dan polanya mudah ditebak saat dibaca orang lain. <b>Read-through</b> mirip, hanya saja logika pindah ke komponen cache. <b>Write-through</b> memberi cache yang selalu segar dengan harga penulisan lebih lambat, sedangkan <b>write-behind</b> paling cepat untuk penulisan massal tetapi paling berisiko kehilangan data — pernah dipakai untuk log analitik, bukan untuk saldo rekening.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 270" width="760" role="img" aria-label="Alur pola cache-aside: aplikasi mengecek Redis, pada miss membaca MariaDB lalu menulis ulang cache dengan TTL"><rect x="30" y="35" width="160" height="60" rx="8" class="u-box"/><text x="110" y="60" class="u-title" text-anchor="middle">Aplikasi</text><text x="110" y="82" class="u-lbl" text-anchor="middle">GET /products/42</text><line x1="190" y1="65" x2="254" y2="65" class="u-line" marker-end="url(#u-arrow)"/><text x="222" y="55" class="u-lbl" text-anchor="middle">1. cek</text><rect x="260" y="35" width="170" height="60" rx="8" class="u-hl"/><text x="345" y="60" class="u-title" text-anchor="middle">Redis</text><text x="345" y="82" class="u-lbl" text-anchor="middle">GET product:42</text><line x1="430" y1="65" x2="494" y2="65" class="u-line" marker-end="url(#u-arrow)"/><text x="462" y="55" class="u-lbl" text-anchor="middle">2. miss</text><rect x="500" y="35" width="180" height="60" rx="8" class="u-box"/><text x="590" y="60" class="u-title" text-anchor="middle">MariaDB</text><text x="590" y="82" class="u-lbl" text-anchor="middle">SELECT ... WHERE id = 42</text><line x1="590" y1="95" x2="590" y2="125" class="u-line"/><line x1="590" y1="125" x2="110" y2="125" class="u-line"/><line x1="110" y1="125" x2="110" y2="97" class="u-line" marker-end="url(#u-arrow)"/><text x="350" y="148" class="u-lbl" text-anchor="middle">3. baris data dari database kembali ke aplikasi</text><rect x="30" y="175" width="700" height="70" rx="8" class="u-box"/><text x="380" y="200" class="u-title" text-anchor="middle">4. isi cache: SET product:42 &lt;json&gt; EX 300</text><line x1="46" y1="210" x2="714" y2="210" class="u-line"/><text x="380" y="232" class="u-lbl" text-anchor="middle">permintaan berikutnya terjawab dari Redis — MariaDB tidak tersentuh (HIT)</text></svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Alur cache-aside: cek cache, pada miss baca MariaDB, lalu simpan kembali ke Redis beserta TTL</figcaption></figure>'
    },
    {
      type: 'text',
      html: '<h3>Alur Baca, Alur Tulis, dan Strategi Invalidasi</h3><p><b>Alur baca (cache-aside)</b> berjalan dalam empat langkah berurutan:</p><ol><li>Cek Redis dengan <code>GET key</code>. Bila ada (HIT), kembalikan nilainya — perjalanan selesai di sini.</li><li>Bila tidak ada (MISS), jalankan kueri ke MariaDB seperti biasa.</li><li>Masukkan hasilnya ke Redis dengan <code>SET key nilai EX detik</code> agar ikut kedaluwarsa otomatis.</li><li>Kembalikan hasil kepada pengguna. Langkah ketiga boleh gagal tanpa menggagalkan permintaan — yang penting baca tetap berhasil.</li></ol><p><b>Alur tulis</b> justru sering salah kaprah. Urutan yang aman adalah: tulis perubahan ke MariaDB lebih dulu, lalu <b>hapus</b> cache — bukan menimpanya. Menimpa cache dengan nilai baru saat database belum tentu berubah (atau sebaliknya) membuka celah di mana dua proses bersamaan saling menimpa dan meninggalkan data lama. Banyak tim memakai strategi <i>double delete</i>: hapus cache sebelum menulis database dan hapus lagi beberapa milidetik sesudahnya, untuk menutup celah pembaca yang kebetulan mengisi cache dengan data lama tepat di sela-sela penulisan.</p><p><b>Tiga strategi invalidasi</b> yang lazim dipakai, sering kali kombinasi ketiganya:</p><ul><li><b>TTL (Time To Live)</b> — setiap key diberi umur, misalnya 5 menit. Paling sederhana dan selalu menjadi jaring pengaman, tetapi data boleh basi selama rentang TTL.</li><li><b>Hapus saat menulis</b> — setiap update di MariaDB disertai <code>DEL</code> pada key terkait. Segar seketika, tetapi gampang terlupa bila penulisan tersebar di banyak tempat.</li><li><b>Event-driven</b> — perubahan database memancarkan event (binlog, message broker, atau Pub/Sub) dan peladen cache menyimaknya untuk menghapus key. Paling rapi untuk sistem berbanyak layanan, tetapi menambah komponen yang harus dirawat.</li></ul>'
    },
    {
      type: 'example',
      title: 'Simulasi Alur Cache-Aside dengan redis-cli',
      lang: 'redis',
      output: false,
      code: '# --- Permintaan pertama: cache masih kosong ---\n> GET product:42\n(nil)\n\n# Aplikasi membaca MariaDB, lalu menaruh hasilnya selama 5 menit\n> SET product:42 \'{\"id\":42,\"name\":\"Sepatu Lari\",\"price\":799000}\' EX 300\nOK\n> TTL product:42\n(integer) 297\n\n# --- Permintaan berikutnya terjawab dari cache (HIT) ---\n> GET product:42\n"{\\"id\\":42,\\"name\\":\\"Sepatu Lari\\",\\"price\\":799000}"\n\n# --- Produk diperbarui di MariaDB: cache wajib dihapus ---\n> DEL product:42\n(integer) 1\n> EXISTS product:42\n(integer) 0\n\n# --- Data yang memang tidak ada disimpan singkat agar tidak ditanya berulang ---\n> SET product:999999 none EX 30\nOK',
      explain: [
        'Balasan <code>(nil)</code> pada GET adalah tanda miss; aplikasi kemudian mengambil data dari MariaDB sebelum menulisnya kembali ke Redis.',
        'Perintah <code>EX 300</code> menempelkan TTL langsung pada saat penulisan — inilah jaring pengaman yang membuat cache membersihkan dirinya sendiri walaupun ada kode yang lupa menghapus.',
        'Urutan yang benar pada penulisan adalah <b>update database dulu, hapus cache kemudian</b>. Membalik urutannya membuat pembaca lain berisiko mengisi cache dengan data lama.',
        'Key <code>product:999999</code> yang tidak ada di database tetap disimpan singkat (nilai penanda) dengan TTL pendek, untuk meredam cache penetration pada poin selanjutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Empat Masalah Klasik Cache dan Penanganannya</h3><p>Cache membuat sistem cepat, tetapi juga memperkenalkan kegagalan yang tidak ada bila semua orang langsung ke database. Empat masalah berikut wajib dikenal sebelum memasang cache di produksi.</p><ul><li><b>Cache stampede (thundering herd)</b> — sebuah key populer kedaluwarsa tepat saat ribuan permintaan menanyakan hal yang sama. Semuanya miss bersamaan dan menyerbu MariaDB. Penanganan: tambahkan <b>acak pada TTL</b> (<code>EX 300</code> + nilai acak 0–60 detik) agar key tidak pernah habis serentak, dan kunci tunggal berbasis <code>SET key token NX PX 5000</code> agar hanya satu proses yang mengisi ulang sementara yang lain menunggu sebentar.</li><li><b>Cache avalanche</b> — bukan satu key, melainkan <b>banyak key sekaligus</b> kedaluwarsa di detik yang sama, biasanya karena diisi bersamaan dengan TTL identik. Penanganan: <b>TTL berjenjang</b> — setiap key diberi umur dasar ditambah angka acak, sehingga waktu kedaluwarsa menyebar merata.</li><li><b>Cache penetration</b> — permintaan untuk key yang <b>memang tidak pernah ada</b> (ID negatif, parameter rusak, bot memindai). Karena selalu miss, database kebanjiran kueri yang hasilnya kosong. Penanganan: simpan hasil kosong singkat (<code>EX 30</code>) dan <b>validasi input</b> sebelum menyentuh cache maupun database.</li><li><b>Hot key</b> — satu key (misalnya halaman produk artis atau flash sale) menanggung jutaan GET sehingga satu proses Redis menjadi titik sesak. Penanganan: duplikasi key (<code>product:42:1</code>, <code>product:42:2</code>) lalu dibaca secara acak, atau bawa data panas ke aplikasi dengan lapisan cache lokal.</li></ul><p>Keempatnya berbagi satu akar masalah: <b>cache adalah sistem yang punya keadaan sendiri</b>, dan keadaan itu bisa berubah serentak ketika trafik sedang ramai.</p>'
    },
    {
      type: 'example',
      title: 'Alur Lengkap GET /products/{id} di Go: Redis di depan MariaDB',
      lang: 'go',
      output: false,
      code: 'package main\n\nimport (\n  "context"\n  "database/sql"\n  "encoding/json"\n  "errors"\n  "log"\n  "net/http"\n  "strings"\n  "time"\n\n  "github.com/redis/go-redis/v9"\n)\n\ntype Product struct {\n  ID    int\n  Name  string\n  Price int64\n}\n\nvar rdb = redis.NewClient(&redis.Options{Addr: "localhost:6379"})\n\nfunc getProduct(w http.ResponseWriter, r *http.Request) {\n  id := strings.TrimPrefix(r.URL.Path, "/products/")\n  ctx, cancel := context.WithTimeout(r.Context(), time.Second)\n  defer cancel()\n\n  key := "product:" + id\n\n  // 1) cek cache lebih dulu\n  raw, err := rdb.Get(ctx, key).Result()\n  if err == nil {\n    w.Header().Set("X-Cache", "hit")\n    _, _ = w.Write([]byte(raw))\n    return\n  }\n  if !errors.Is(err, redis.Nil) {\n    // Redis bermasalah bukan alasan untuk menjatuhkan request\n    log.Printf("redis error, fallback ke MariaDB: %v", err)\n  }\n\n  // 2) miss: query MariaDB\n  p, err := queryProduct(ctx, id)\n  if errors.Is(err, sql.ErrNoRows) {\n    http.NotFound(w, r)\n    return\n  }\n  if err != nil {\n    http.Error(w, "database error", http.StatusInternalServerError)\n    return\n  }\n\n  // 3) isi cache + TTL; kegagalan menulis tidak membatalkan baca\n  body, _ := json.Marshal(p)\n  if err := rdb.Set(ctx, key, body, 2*time.Minute).Err(); err != nil {\n    log.Printf("gagal mengisi cache: %v", err)\n  }\n\n  w.Header().Set("X-Cache", "miss")\n  _, _ = w.Write(body)\n}',
      explain: [
        'Handler mengikuti tiga langkah cache-aside persis seperti diagram: <code>GET</code> ke Redis, baru kemudian <code>queryProduct</code> ke MariaDB ketika terjadi miss.',
        '<code>redis.Nil</code> adalah kondisi miss, bukan kegagalan; kondisi itu ditangani terpisah dari error Redis yang sesungguhnya sehingga cache yang sedang down tetap membuat aplikasi berfungsi (pola <i>graceful degradation</i>).',
        'TTL 2 menit dipasang pada saat penulisan, sehingga walaupun tidak ada kode yang menghapus key, data lama tetap habis dengan sendirinya.',
        'Header <code>X-Cache</code> memudahkan pengujian: dari sisi klien kamu bisa langsung tahu apakah permintaan dijawab cache atau database.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Cache Tidak Perlu</h3><p>Menambahkan cache berarti menambah satu jaringan, satu format serialisasi, satu aturan invalidasi, dan satu sumber bug baru. Karena itu tanyakan dulu sebelum memasangnya:</p><ul><li><b>Data dibaca sekali lalu ditinggalkan</b> — laporan bulanan atau ekspor data satu kali tidak pernah menikmati cache; kamu hanya menambah pekerjaan menulis.</li><li><b>Trafik rendah dan query sudah cepat</b> — bila MariaDB menjawab dalam 2 ms dan kamu hanya melayani 50 permintaan per detik, cache memperoleh manfaat nyaris nol.</li><li><b>Data wajib selalu segar</b> — sisa tiket, kursi pesawat, atau saldo yang baru saja ditransfer tidak boleh ditampilkan dari salinan yang berumur 5 menit.</li><li><b>Ukuran objek sangat besar dan unik</b> — satu objek 50 MB yang hanya diminta satu orang membuat cache penuh oleh barang yang tidak berguna bagi siapa pun.</li></ul><p>Alternatif yang lebih murah sering terlewat dulu: <b>indeks yang tepat</b> di MariaDB, <b>query plan</b> yang benar, atau <b>read replica</b>. Perbaiki jalur aslinya sebelum memasang rak depan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern yang Sering Muncul</h3><p>Empat kekeliruan berikut bertanggung jawab atas sebagian besar insiden cache di lapangan:</p><ul><li><b>Menulis database lalu menimpa cache dengan nilai baru.</b> Dua pembaca bersamaan bisa saling menimpa dan meninggalkan nilai lama yang tidak pernah habis sampai TTL-nya sendiri. Hapus, jangan timpa — atau pakai <i>double delete</i>.</li><li><b>TTL tanpa batas</b> (<code>SET key value</code> tanpa <code>EX</code>). Key menumpuk selamanya, memori penuh, dan eviction mulai mengusir key yang justru penting. Setiap key wajib punya umur, kecuali memang data konstan yang jarang berubah.</li><li><b>Meng-cache apa saja tanpa memandang frekuensi.</b> Cache bekerja karena <b>hot set</b> kecil: sebagian kecil data menerima sebagian besar permintaan. Menyimpan 500 ribu produk yang masing-masing diminta sekali per bulan membuat hit rate rendah dan memori terbuang.</li><li><b>Mengabaikan error Redis tanpa catatan.</b> Saat Redis restart tengah malam, semua request menjadi miss dan menyerbu MariaDB tanpa ada yang tahu penyebabnya. Selalu catat error, dan pasang batas (circuit breaker) agar beban database tetap terkendali.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Ukur Hit Rate Sebelum dan Sesudah',
      text: 'Cache tanpa pengukuran hanya tebakan. Jalankan <code>redis-cli INFO stats</code> dan lihat <code>keyspace_hits</code> versus <code>keyspace_misses</code>. Sebagai acuan kasar, hit rate di bawah 80 persen untuk data baca biasa layak dipertanyakan: periksa TTL yang terlalu pendek, pola key yang tidak konsisten, atau data yang memang jarang diakses ulang. Satu angka ini lebih berguna daripada sekadar merasa aplikasi terasa lebih cepat.'
    },
    {
      type: 'warn',
      title: 'Cache Bukanlah Sumber Kebenaran',
      text: 'Redis bisa kehabisan memori, di-restart, atau mengusir key kapan saja (eviction). Karena itu <b>jangan pernah menyimpan satu-satunya salinan data</b> di cache — termasuk hasil hitung saldo, token yang belum tercatat di database, atau unggahan pengguna. Selalu pastikan ada jalur pemulihan ke MariaDB, dan perlakukan cache sebagai salinan yang boleh hilang tanpa peringatan.'
    },
    {
      type: 'vocab',
      items: [
        ['Cache-aside (lazy loading)', 'Pola di mana aplikasi mengecek cache sendiri; data baru dimuat ke cache hanya ketika diminta dan terjadi miss.'],
        ['TTL (Time to Live)', 'Umur sebuah key di Redis; setelah lewat, key kedaluwarsa dan dihapus otomatis oleh server.'],
        ['Hit rate', 'Rasio permintaan yang terjawab dari cache terhadap seluruh permintaan; indikator utama keberhasilan sebuah cache.'],
        ['Invalidasi', 'Penghapusan atau penandaan basi data cache ketika data asli di database berubah.'],
        ['Read-through', 'Pola di mana lapisan cache sendiri yang memuat data dari database ketika terjadi miss.'],
        ['Write-behind', 'Pola tulis yang menempatkan perubahan ke cache lebih dulu lalu menyalinnya ke database secara tertunda atau berkelompok.'],
        ['Cache stampede', 'Lonjakan menyerbu database ketika satu key populer kedaluwarsa dan banyak permintaan miss pada saat bersamaan.'],
        ['Cache penetration', 'Lonjakan kueri akibat permintaan berulang untuk key yang memang tidak pernah ada di database.']
      ]
    }
  ],
  recap: [
    'Redis berdiri di depan MariaDB sebagai salinan di memori: HIT menjawab dalam sub-milidetik, MISS tetap jatuh ke database dan hasilnya diisi ulang.',
    'Empat pola cache dibedakan oleh siapa yang memuat dan kapan database ditulis; cache-aside paling umum karena sederhana dan aplikasi memegang kendali penuh.',
    'Alur tulis yang aman adalah update database lalu hapus cache, ditopang tiga strategi invalidasi: TTL, hapus saat menulis, dan event-driven.',
    'Empat masalah klasik — stampede, avalanche, penetration, dan hot key — ditangani dengan jitter TTL, kunci tunggal, penyimpanan hasil kosong singkat, validasi input, dan pembagian key populer.'
  ]
});
