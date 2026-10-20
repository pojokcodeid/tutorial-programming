/* ============================================================
   Pelajaran Redis — Bab 3: Struktur Data Redis
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'struktur-data',
  title: 'Struktur Data Redis',
  chapter: 'Struktur Data',
  duration: '12–14 menit',
  intro: [
    'Bayangkan sebuah bengkel rapi: obeng ada di rak obeng, kunci pas di lacinya sendiri, dan lem lem di lemari kimia. Bila semua alat dicampur dalam satu kotak besar, setiap kali butuh satu alat kamu harus mengaduk seluruh isinya. Redis mengikuti logika yang sama — hanya saja "raknya" berupa <b>delapan jenis wadah data</b>, masing-masing dirancang untuk satu jenis pekerjaan.',
    'Kesalahan paling umum bagi pemula adalah memasukkan semuanya ke dalam satu wadah: objek pengguna disimpan sebagai satu teks JSON raksasa, antrean dibuat dari teks yang dipisah koma, dan peringkat disusun manual. Cara itu <i>bisa</i> berjalan, tetapi memaksa aplikasimu menghitung sendiri hal yang seharusnya diselesaikan oleh struktur data — dan justru itulah letak kecepatan Redis.',
    'Bab ini memetakan seluruh rak: <b>String, List, Set, Sorted Set, Hash</b> beserta empat struktur khusus <b>Bitmap, HyperLogLog, Geospatial, dan Stream</b>, lengkap dengan perintah inti masing-masing. Kita tutup dengan tabel pemetaan tipe → perintah → kasus → kapan dipakai, sehingga kamu selalu bisa memilih wadah yang tepat berdasarkan pola akses, bukan kebiasaan.'
  ],
  objectives: [
    'Mengidentifikasi delapan struktur data utama Redis beserta perintah kuncinya',
    'Memilih tipe data Redis berdasarkan pola akses, bukan sekadar kebiasaan menulis data',
    'Menerapkan Hash dan Sorted Set untuk kasus nyata seperti profil pengguna dan leaderboard',
    'Mengenali anti-pattern penyimpanan data di Redis beserta alternatif yang lebih tepat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Filosofi Dasar: Pilih Wadah Sesuai Pekerjaan</h3><p>Setiap tipe data di Redis datang dengan <b>operasi khusus</b> yang sudah optimal di dalam C. Ketika kamu memakai <code>HGET</code> untuk mengambil satu field dari hash, Redis membaca hanya field itu; tetapi bila kamu menyimpan hash sebagai JSON dalam String, aplikasimu harus mengambil seluruh dokumen, memparse-nya, lalu memilih sendiri bagiannya — boros di sisi jaringan maupun memori.</p><p>Rumus sederhana yang akan kita pakai sepanjang bab ini: <b>lihat dulu bagaimana data itu diakses, baru tentukan tipenya.</b> Ditampilkan berulang kali? Perlu urutan? Perlu menghitung anggota unik? Perlu peringkat? — jawabannya sudah menentukan struktur yang benar.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Rak delapan tipe data Redis: String, List, Set, Sorted Set, Hash, Bitmap, HyperLogLog, dan Geospatial beserta contoh isinya">
        <rect x="20" y="24" width="720" height="292" rx="12" class="u-box"/>
        <text x="380" y="50" class="u-title" text-anchor="middle">Rak Struktur Data Redis</text>
        <line x1="36" y1="58" x2="724" y2="58" class="u-line"/>

        <rect x="36" y="68" width="160" height="72" rx="8" class="u-hl"/>
        <text x="116" y="92" class="u-title" text-anchor="middle">String</text>
        <text x="116" y="114" class="u-lbl" text-anchor="middle">SET nama "Budi"</text>
        <text x="116" y="132" class="u-lbl" text-anchor="middle">GET kunjungan</text>

        <rect x="212" y="68" width="160" height="72" rx="8" class="u-box"/>
        <text x="292" y="92" class="u-title" text-anchor="middle">List</text>
        <text x="292" y="114" class="u-lbl" text-anchor="middle">LPUSH antrean a</text>
        <text x="292" y="132" class="u-lbl" text-anchor="middle">LRANGE 0 -1</text>

        <rect x="388" y="68" width="160" height="72" rx="8" class="u-box"/>
        <text x="468" y="92" class="u-title" text-anchor="middle">Set</text>
        <text x="468" y="114" class="u-lbl" text-anchor="middle">SADD online budi</text>
        <text x="468" y="132" class="u-lbl" text-anchor="middle">SISMEMBER?</text>

        <rect x="564" y="68" width="160" height="72" rx="8" class="u-box"/>
        <text x="644" y="92" class="u-title" text-anchor="middle">Sorted Set</text>
        <text x="644" y="114" class="u-lbl" text-anchor="middle">ZADD board 120</text>
        <text x="644" y="132" class="u-lbl" text-anchor="middle">budi 95 ani</text>

        <rect x="36" y="156" width="160" height="72" rx="8" class="u-box"/>
        <text x="116" y="180" class="u-title" text-anchor="middle">Hash</text>
        <text x="116" y="202" class="u-lbl" text-anchor="middle">HSET user:1 nama</text>
        <text x="116" y="220" class="u-lbl" text-anchor="middle">HINCRBY login 1</text>

        <rect x="212" y="156" width="160" height="72" rx="8" class="u-box"/>
        <text x="292" y="180" class="u-title" text-anchor="middle">Bitmap</text>
        <text x="292" y="202" class="u-lbl" text-anchor="middle">SETBIT laporan 8 1</text>
        <text x="292" y="220" class="u-lbl" text-anchor="middle">BITCOUNT laporan</text>

        <rect x="388" y="156" width="160" height="72" rx="8" class="u-box"/>
        <text x="468" y="180" class="u-title" text-anchor="middle">HyperLogLog</text>
        <text x="468" y="202" class="u-lbl" text-anchor="middle">PFADD pengunjung</text>
        <text x="468" y="220" class="u-lbl" text-anchor="middle">PFCOUNT (±0,81%)</text>

        <rect x="564" y="156" width="160" height="72" rx="8" class="u-box"/>
        <text x="644" y="180" class="u-title" text-anchor="middle">Geospatial</text>
        <text x="644" y="202" class="u-lbl" text-anchor="middle">GEOADD toko</text>
        <text x="644" y="220" class="u-lbl" text-anchor="middle">GEODIST ... km</text>

        <text x="380" y="256" class="u-lbl" text-anchor="middle">Tambahan: Stream (XADD / XRANGE) — log event berantai dengan ID waktu</text>

        <text x="185" y="298" class="u-lbl" text-anchor="middle">pola akses aplikasi</text>
        <line x1="300" y1="293" x2="440" y2="293" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="575" y="298" class="u-lbl" text-anchor="middle">tipe data yang dipilih</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Rak delapan tipe data Redis beserta contoh isinya; masing-masing wadah punya perintah khusus yang optimal untuk pola akses tertentu</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>String: Tipe Paling Dasar, Paling Sering Dipakai</h3><p>String adalah tipe default: satu kunci menunjuk ke satu nilai teks atau angka (maksimal 512 MB per nilai). Meski namanya "string", ia bisa berisi bilangan bulat yang bisa dihitung langsung oleh server.</p><table><thead><tr><th>Perintah</th><th>Fungsi</th><th>Contoh</th></tr></thead><tbody><tr><td><code>SET</code> / <code>GET</code></td><td>Tulis dan baca nilai</td><td><code>SET kurs "Rp 15.500"</code></td></tr><tr><td><code>MSET</code> / <code>MGET</code></td><td>Tulis-baca banyak kunci sekaligus (hemat bolak-balik)</td><td><code>MSET a 1 b 2</code></td></tr><tr><td><code>INCR</code> / <code>INCRBY</code></td><td>Penambahan atomik</td><td><code>INCRBY kunjungan 5</code></td></tr><tr><td><code>APPEND</code> / <code>STRLEN</code></td><td>Menambahkan dan mengukur panjang teks</td><td><code>APPEND pesan " lagi"</code></td></tr><tr><td><code>SETNX</code></td><td>Tulis hanya bila kunci belum ada — dasar distributed lock</td><td><code>SETNX lock:job 1</code></td></tr></tbody></table><p>Catatan penting: <code>INCR</code> dieksekusi sebagai satu langkah atomik di server, sehingga ratusan server boleh menaikkan penghitung yang sama tanpa kehilangan satu hit pun.</p>'
    },
    {
      type: 'text',
      html: '<h3>List: Antrean dan Riwayat yang Berurutan</h3><p>List adalah deretan nilai yang <b>menjaga urutan pemasukan</b> dan memungkinkan akses di kedua ujung — ideal untuk antrean tugas (masuk di satu ujung, keluar di ujung lain) maupun riwayat aktivitas.</p><ul><li><code>LPUSH</code> / <code>RPUSH</code> — menambah elemen di kiri atau kanan.</li><li><code>LRANGE antrean 0 -1</code> — membaca seluruh isi (indeks <code>0</code> sampai <code>-1</code>, tanda minus dihitung dari akhir).</li><li><code>LPOP</code> / <code>RPOP</code> — mengambil dan menghapus dari ujung; pasangan <code>LPUSH</code> + <code>RPOP</code> menghasilkan antrean FIFO.</li><li><code>LLEN</code>, <code>LINDEX</code>, <code>LTRIM</code> — panjang, akses per posisi, dan memotong agar list tidak tumbuh tanpa batas.</li></ul><p>Contoh nyata: <code>LPUSH tugas:render</code> pada saat pengguna mengunggah foto, lalu worker memanggil <code>RPOP tugas:render</code> untuk mengambil pekerjaan berikutnya. Untuk kasus yang butuh jaminan lebih kuat (bila worker mati, tugas tidak boleh hilang), Redis menyediakan <code>BLPOP</code> yang menunggu, dan kelak pada materi antrian akan muncul opsi yang lebih tangguh lagi.</p>'
    },
    {
      type: 'text',
      html: '<h3>Set dan Sorted Set: Himpunan dan Peringkat</h3><p><b>Set</b> adalah himpunan anggota yang <b>unik dan tidak berurutan</b>. Ia sempurna untuk relasi sederhana seperti "siapa yang sedang daring", "tag apa saja pada artikel ini", atau "pengguna mana yang mengikuti siapa".</p><ul><li><code>SADD online:senin budi ani citra</code> — menambah anggota; penambahan ganda otomatis diabaikan.</li><li><code>SMEMBERS online:senin</code> — membaca semua anggota.</li><li><code>SISMEMBER online:senin budi</code> — cek keanggotaan dengan O(1).</li><li><code>SINTER online:senin online:selasa</code> — irisan dua himpunan, misalnya untuk menemukan pengguna yang aktif di kedua hari.</li></ul><p><b>Sorted Set (zset)</b> adalah Set yang tiap anggotanya punya <b>skor</b>, sehingga ia selalu tertata rapi dari skor terendah ke tertinggi. Struktur inilah mesin di balik <b>leaderboard</b> dan <b>rate limiter berbasis waktu</b>:</p><ul><li><code>ZADD leaderboard 120 budi 95 ani</code> — tulis anggota beserta skornya.</li><li><code>ZRANGE leaderboard 0 -1 WITHSCORES</code> — daftar peringkat lengkap dengan skor.</li><li><code>ZRANK leaderboard budi</code> — posisi (peringkat) seorang anggota, dihitung dari nol.</li><li><code>ZSCORE leaderboard budi</code> — skor milik satu anggota.</li></ul><p>Karena anggota disimpan unik, memperbarui skor pemain cukup dengan <code>ZADD</code> ulang — skor lama otomatis diganti dan urutan langsung dirapikan oleh Redis.</p>'
    },
    {
      type: 'text',
      html: '<h3>Hash: Objek dengan Banyak Field</h3><p>Hash adalah "kunci di dalam kunci": satu kunci induk berisi banyak field beserta nilainya. Struktur ini paling pas untuk objek yang <b>sebagian sering diubah</b> — profil pengguna, konfigurasi produk, atribut sesi.</p><ul><li><code>HSET user:1234 nama "Budi" kota "Bandung"</code> — mengisi beberapa field sekaligus.</li><li><code>HGET user:1234 nama</code> — mengambil satu field saja; field lain tidak ikut terbaca.</li><li><code>HGETALL user:1234</code> — mengambil seluruh isi ketika memang dibutuhkan.</li><li><code>HINCRBY user:1234 login 1</code> — menghitung satu field secara atomik.</li></ul><p>Perbandingan penting: bila pengguna mengubah hanya kotanya, dengan Hash kamu menulis satu field kecil; dengan String JSON kamu harus menulis ulang seluruh objek dan memparse JSON di sisi aplikasi setiap membaca. Inilah alasan Hash menjadi tipe yang paling sering dipakai untuk data berbentuk objek.</p>'
    },
    {
      type: 'text',
      html: '<h3>Empat Struktur Khusus: Bitmap, HyperLogLog, Geospatial, Stream</h3><p>Empat tipe berikut bukan untuk data sehari-hari, melainkan untuk masalah spesifik yang kalau dikerjakan dengan cara biasa akan sangat boros:</p><ul><li><b>Bitmap</b> — deretan bit dalam satu kunci; pasangan <code>SETBIT</code> dan <code>BITCOUNT</code> menjawab pertanyaan seperti "siapa saja yang membaca laporan hari ini?" dengan memori ratusan byte. <code>BITCOUNT laporan:2026-10-20</code> menghitung jumlah bit bernilai 1.</li><li><b>HyperLogLog</b> — penghitung <b>pengunjung unik</b> yang hanya memakai sekitar 12 KB berapa pun jumlah datanya, dengan galat sekitar 0,81%. <code>PFADD pengunjung budi ani</code> lalu <code>PFCOUNT pengunjung</code>. Ia memberi <i>estimasi</i>, bukan daftar anggota.</li><li><b>Geospatial</b> — <code>GEOADD toko -6.9175 107.6191 "Kafe A"</code> menyimpan posisi bujur-lintang, lalu <code>GEODIST</code> menghitung jarak dan <code>GEOSEARCH</code> mencari titik terdekat — dasar fitur "toko terdekat".</li><li><b>Stream</b> — log event berantai dengan ID waktu: <code>XADD events * jenis "order.created"</code> lalu <code>XRANGE events - +</code> untuk membacanya kembali. Berbeda dengan pub/sub, isi stream tetap tersimpan dan bisa dibaca ulang.</li></ul>'
    },
    {
      type: 'example',
      title: 'String dan Hash dalam Aksi',
      lang: 'redis',
      output: false,
      code: `SET kunjungan 10
INCR kunjungan
MSET kota "Bandung" cuaca "cerah"
MGET kota cuaca
HSET user:1234 nama "Budi" kota "Bandung" login 0
HGET user:1234 nama
HINCRBY user:1234 login 1
HGETALL user:1234
APPEND catatan " tambahan"
STRLEN catatan`,
      explain: [
        '<code>INCR</code> bekerja di server sehingga angka kunjungan tetap akurat walau ditambahkan dari banyak proses sekaligus; <code>MSET</code>/<code>MGET</code> memangkas bolak-balik jaringan ketika beberapa kunci dibaca bersamaan.',
        '<code>HSET</code> bisa mengisi beberapa field sekaligus, dan <code>HINCRBY</code> menghitung satu field tanpa membaca seluruh isi hash terlebih dahulu.',
        '<code>APPEND</code> dan <code>STRLEN</code> menunjukkan bahwa String punya operasi teks bawaan — cocok untuk catatan singkat, bukan untuk objek kompleks yang sering diubah sebagian.'
      ]
    },
    {
      type: 'example',
      title: 'Antrean List dan Leaderboard Sorted Set',
      lang: 'redis',
      output: false,
      code: `LPUSH tugas:render "foto-1.jpg"
LPUSH tugas:render "foto-2.jpg"
RPUSH tugas:render "foto-3.jpg"
LRANGE tugas:render 0 -1
RPOP tugas:render
LRANGE tugas:render 0 -1
SADD online:senin budi ani citra
SISMEMBER online:senin budi
ZADD leaderboard 120 budi 95 ani 140 citra
ZRANGE leaderboard 0 -1 WITHSCORES
ZRANK leaderboard budi`,
      explain: [
        'Perhatikan urutan pada List: <code>LPUSH</code> menambah di kiri, <code>RPUSH</code> di kanan, dan <code>RPOP</code> mengambil dari kanan — pola ini menghasilkan antrean FIFO yang adil bagi semua pekerja.',
        '<code>SISMEMBER</code> menjawab pertanyaan keanggotaan dengan O(1); untuk himpunan besar, inilah alasan memakai Set ketimbang String berisi daftar dipisah koma.',
        '<code>ZRANGE ... WITHSCORES</code> mengeluarkan peringkat yang sudah terurut otomatis, dan <code>ZRANK</code> memberi posisi tepat sebuah pemain tanpa aplikasi perlu mengurutkan apa pun.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tabel Pemetaan: Tipe Data → Perintah → Kasus</h3><p>Simpan tabel berikut sebagai peta cepat saat kamu ragu memilih wadah:</p><table><thead><tr><th>Tipe data</th><th>Perintah kunci</th><th>Contoh kasus</th><th>Kapan dipakai</th></tr></thead><tbody><tr><td><b>String</b></td><td><code>SET</code>, <code>GET</code>, <code>INCR</code>, <code>SETNX</code></td><td>Konfigurasi, token, penghitung, kunci lock</td><td>Satu nilai per kunci, jarang dibaca sebagian</td></tr><tr><td><b>List</b></td><td><code>LPUSH</code>, <code>RPUSH</code>, <code>LRANGE</code>, <code>LPOP</code></td><td>Antrean tugas, log aktivitas terbaru</td><td>Data berurutan yang ditambah dan diambil dari ujung</td></tr><tr><td><b>Set</b></td><td><code>SADD</code>, <code>SMEMBERS</code>, <code>SISMEMBER</code>, <code>SINTER</code></td><td>Pengguna daring, tag, relasi ikut-mengikuti</td><td>Anggota unik tanpa urutan, butuh irisan/union</td></tr><tr><td><b>Sorted Set</b></td><td><code>ZADD</code>, <code>ZRANGE</code>, <code>ZRANK</code>, <code>ZSCORE</code></td><td>Leaderboard, rate limiter waktu, antrian prioritas</td><td>Butuh urutan berdasarkan skor yang sering berubah</td></tr><tr><td><b>Hash</b></td><td><code>HSET</code>, <code>HGET</code>, <code>HGETALL</code>, <code>HINCRBY</code></td><td>Profil user, atribut produk, sesi</td><td>Objek dengan field yang diubah sebagian</td></tr><tr><td><b>Bitmap</b></td><td><code>SETBIT</code>, <code>BITCOUNT</code></td><td>Status baca harian, flag fitur per pengguna</td><td>Ratusan ribu flag hemat memori dan dihitung cepat</td></tr><tr><td><b>HyperLogLog</b></td><td><code>PFADD</code>, <code>PFCOUNT</code></td><td>Pengunjung unik harian</td><td>Perkiraan jumlah unik besar dengan memori tetap 12 KB</td></tr><tr><td><b>Geospatial</b></td><td><code>GEOADD</code>, <code>GEODIST</code>, <code>GEOSEARCH</code></td><td>Toko terdekat, kurir terdekat</td><td>Pencarian jarak dan radius pada titik koordinat</td></tr><tr><td><b>Stream</b></td><td><code>XADD</code>, <code>XRANGE</code>, <code>XREAD</code></td><td>Log event, riwayat pesan, audit trail ringan</td><td>Event yang harus tersimpan dan bisa dibaca ulang</td></tr></tbody></table><p><b>Catatan pemilihan tipe:</b> mulailah dari pertanyaan "apa yang paling sering dilakukan pada data ini?". Dibaca berkali-kali sebagai bagian kecil → Hash; diambil berurutan → List; dicari keanggotaannya → Set; diurutkan berdasarkan skor → Sorted Set; hanya dihitung → Bitmap atau HyperLogLog. Bila ragu, pilih yang paling sederhana lalu ukur ulang — struktur bisa diubah, kebiasaan menyimpan sembarangan yang mahal.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern: Mengepaskan Semua Data ke Satu String</h3><p>Ini kesalahan paling mahal yang saya temui berulang kali pada aplikasi nyata. Sebuah aplikasi belanja menyimpan seluruh keranjang sebagai satu String JSON besar, lalu setiap kali pengguna menambah satu barang, aplikasi membaca seluruh JSON, memparse, mengubah, dan menulisnya kembali. Masalahnya bertumpuk:</p><ul><li><b>Boros baca-tulis</b> — menambah satu item berarti memindahkan seluruh dokumen lewat jaringan, termasuk puluhan item lain yang tidak berubah.</li><li><b>Tidak atomik</b> — dua permintaan bersamaan bisa saling menimpa (<i>lost update</i>), sementara <code>HINCRBY</code> dan operasi hash selesai dalam satu langkah di server.</li><li><b>Parse JSON di mana-mana</b> — setiap bahasa dan setiap endpoint harus mengulang pekerjaan mem-parse dokumen yang sama.</li><li><b>Tidak bisa bertanya</b> — Redis tidak bisa mencari satu field di dalam String JSON; harus menarik semuanya dulu.</li></ul><p>Perbaikannya: ubah objek menjadi <b>Hash</b> (satu field per atribut), dan bila data memang harus berupa dokumen utuh, pastikan ia memang jarang diubah sebagian. Anti-pattern terkait lainnya: memakai <b>Set</b> untuk data yang butuh urutan (pakai List/sorted set), memakai <b>HyperLogLog</b> ketika kamu butuh daftar anggota persis (ia hanya memberi perkiraan), serta membiarkan List dan Set tumbuh tanpa <code>LTRIM</code> atau <code>SPOP</code> sehingga memori membengkak diam-diam.</p>'
    },
    {
      type: 'tip',
      title: 'Rasakan Dulu Tipe Datanya di CLI',
      text: 'Sebelum menulis kode, coba setiap tipe langsung di <code>redis-cli</code>: tulis beberapa nilai, baca dengan perintah yang berbeda, lalu jalankan <code>TYPE kunci</code> untuk melihat tipe yang tersimpan. Percobaan dua menit ini jauh lebih melekat daripada menghafal tabel — dan ketika kamu salah memakai perintah, Redis akan langsung menolaknya dengan pesan <code>WRONGTYPE</code> yang jelas.'
    },
    {
      type: 'warn',
      title: 'Perhatikan Ukuran dan Jumlah Anggota',
      text: 'Beberapa operasi bisa memblokir server bila dilakukan pada struktur berukuran jauh: <code>SMEMBERS</code> pada himpunan jutaan anggota, <code>LRANGE 0 -1</code> pada list panjang, atau <code>HGETALL</code> pada hash berisi ratusan field. Gunakan varian aman seperti <code>SSCAN</code>, <code>LPOP</code> dengan jumlah, atau <code>HSCAN</code>, dan pantau ukuran dengan <code>MEMORY USAGE kunci</code>. Ingat: satu thread melayani semua koneksi, sehingga perintah yang menahan server akan terasa oleh seluruh pengguna.'
    },
    {
      type: 'vocab',
      items: [
        ['String', 'Tipe dasar berisi satu nilai teks atau angka per kunci; mendukung operasi atomik seperti INCR dan SETNX.'],
        ['List', 'Deretan nilai terurut yang bisa ditambah dan diambil dari kedua ujung; dasar antrean dan riwayat.'],
        ['Set', 'Himpunan anggota unik tanpa urutan; mendukung irisan, gabungan, dan selisih antar himpunan.'],
        ['Sorted Set (zset)', 'Set dengan skor per anggota sehingga isi kunci selalu terurut; mesin leaderboard dan rate limiter.'],
        ['Hash', 'Kumpulan field-nilai di dalam satu kunci; ideal untuk objek yang field-nya diubah sebagian.'],
        ['Bitmap', 'Deretan bit dalam satu String; sangat hemat memori untuk status biner berjumlah besar.'],
        ['HyperLogLog', 'Struktur penghitung unik berukuran tetap sekitar 12 KB dengan galat kira-kira 0,81%.'],
        ['Geospatial', 'Sorted set khusus yang menyimpan koordinat bujur-lintang untuk pencarian jarak dan radius.'],
        ['Stream', 'Log event berantai dengan ID berbasis waktu yang tetap tersimpan dan bisa dibaca ulang.']
      ]
    }
  ],
  recap: [
    'Redis menyediakan delapan tipe data utama — String, List, Set, Sorted Set, Hash, Bitmap, HyperLogLog, Geospatial — ditambah Stream untuk log event.',
    'Pemilihan tipe didasarkan pola akses: objek yang diubah sebagian memakai Hash, data berurutan memakai List, peringkat memakai Sorted Set, hitungan unik memakai HyperLogLog.',
    'Sorted Set dengan ZADD/ZRANGE/ZRANK menjadi fondasi leaderboard dan rate limiter, sementara Hash dengan HINCRBY menangani penghitungan per field secara atomik.',
    'Anti-pattern terbesarnya adalah menjejalkan objek besar ke satu String JSON; ubah menjadi Hash, dan hindari perintah pembaca seluruh isi pada struktur berukuran besar.'
  ]
});
