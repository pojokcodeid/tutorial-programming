/* ============================================================
   Pelajaran SQL — Bab 2: Query Dasar
   (topik info.md:
    - "query dasar (SELECT, FROM)"
    - "penyaringan dan pengurutan data (WHERE, ORDER BY, DISTINCT)"
    - "pembatasan data (LIMIT, OFFSET)"
    - "fungsi agregasi dasar (COUNT, SUM, AVG, MIN, MAX)")
   Semua contoh memakai data contoh yang sama:
   tabel departemen (3 baris) & karyawan (7 baris).
   ============================================================ */
'use strict';

window.SQL_LESSONS = window.SQL_LESSONS || [];

/* ---------- Pelajaran 2: SELECT & FROM ---------- */
window.SQL_LESSONS.push({
  id: 'query-dasar-select',
  title: 'Query Dasar: SELECT dan FROM',
  chapter: 'Query Dasar',
  duration: '9 menit',
  intro: [
    '<b>SELECT</b> adalah perintah yang paling sering kamu pakai seumur hidup berinteraksi dengan database. Hampir semua pekerjaan dimulai dengan mengambil data.',
    'Pelajaran ini membahas cara memilih kolom, memberi nama alias, dan memakai data contoh yang akan kita pakai sampai akhir materi.'
  ],
  objectives: [
    'Mengambil semua kolom dan kolom tertentu dengan SELECT',
    'Menggunakan alias kolom dengan AS',
    'Menulis komentar di dalam SQL',
    'Mengenal data contoh yang dipakai sepanjang tutorial'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sepanjang tutorial ini kita akan memakai dua tabel sederhana: <code>departemen</code> dan <code>karyawan</code>. Berikut isinya:</p>'
    },
    {
      type: 'example',
      title: 'Data contoh karyawan & departemen',
      lang: 'text',
      output: false,
      code: `Tabel: departemen
id | nama
---+-----------
 1 | Teknologi
 2 | Pemasaran
 3 | Keuangan

Tabel: karyawan
id | nama  | jabatan | gaji    | departemen_id | tanggal_masuk
---+-------+---------+---------+---------------+--------------
 1 | Andi  | Teknisi | 5000000 |       1       | 2021-03-01
 2 | Budi  | Manajer | 9000000 |       1       | 2020-01-15
 3 | Citra | Staf    | 4000000 |       2       | 2022-06-10
 4 | Dewi  | Staf    | 4500000 |       2       | 2021-11-20
 5 | Eka   | Manajer | 9500000 |       3       | 2019-08-05
 6 | Fajar | Teknisi | 5200000 |       1       | 2023-02-01
 7 | Gita  | Staf    | 3800000 |    NULL       | 2023-05-15`,
      explain: [
        'Anggap tabel ini sudah ada di database kita.',
        'Kolom <code>departemen_id</code> pada karyawan menunjuk ke <code>departemen.id</code>.',
        '<code>NULL</code> berarti nilainya kosong / belum diisi (Gita belum punya departemen).'
      ]
    },
    {
      type: 'text',
      html: '<p>Struktur dasar perintah SELECT:</p><pre><code>SELECT kolom_yang_diinginkan FROM nama_tabel;</code></pre><p>Bagian <code>SELECT</code> menentukan <b>kolom apa</b> yang diambil, dan <code>FROM</code> menentukan <b>dari tabel mana</b>.</p>'
    },
    {
      type: 'example',
      title: 'Mengambil kolom tertentu',
      lang: 'sql',
      output: false,
      code: `SELECT nama, jabatan
FROM karyawan;

-- Hasil:
-- nama  | jabatan
-- Andi  | Teknisi
-- Budi  | Manajer
-- Citra | Staf
-- Dewi  | Staf
-- Eka   | Manajer
-- Fajar | Teknisi
-- Gita  | Staf`,
      explain: [
        'Hanya kolom <code>nama</code> dan <code>jabatan</code> yang ditampilkan, sesuai urutan penulisan.',
        'Urutan baris belum dijamin — kita akan belajar mengurutkannya dengan ORDER BY nanti.',
        'Tulis besar-kecil huruf (kapital) untuk kata kunci SQL agar mudah dibaca; SQL sendiri umumnya tidak peka huruf besar/kecil.'
      ]
    },
    {
      type: 'example',
      title: 'Semua kolom dengan tanda bintang',
      lang: 'sql',
      output: false,
      code: `SELECT * FROM karyawan;

-- Setara dengan:
SELECT id, nama, jabatan, gaji, departemen_id, tanggal_masuk
FROM karyawan;`,
      explain: [
        '<code>*</code> adalah singkatan "semua kolom".',
        'Praktis saat mencoba-coba, tetapi untuk aplikasi sebaiknya sebutkan kolom yang diperlukan saja agar lebih cepat dan jelas.'
      ]
    },
    {
      type: 'example',
      title: 'Alias kolom dengan AS',
      lang: 'sql',
      output: false,
      code: `SELECT
  nama       AS nama_karyawan,
  jabatan    AS posisi,
  gaji       AS gaji_bulanan
FROM karyawan;

-- Kolom hasil akan berjudul: nama_karyawan, posisi, gaji_bulanan`,
      explain: [
        '<code>AS</code> memberi <b>nama lain</b> pada kolom di hasil query.',
        'Alias tidak mengubah nama kolom asli di tabel — hanya tampilan hasil.',
        '<code>AS</code> boleh dihilangkan (<code>nama nama_karyawan</code>), tetapi menulisnya membuat kode lebih rapi.'
      ]
    },
    {
      type: 'example',
      title: 'Menyisipkan komentar',
      lang: 'sql',
      output: false,
      code: `-- Komentar satu baris dimulai dengan dua tanda minus
SELECT nama FROM karyawan; -- bisa juga di akhir baris

/* Komentar beberapa baris
   ditulis di antara /* ... */ */
SELECT gaji FROM karyawan;`,
      explain: [
        '<code>--</code> membuat sisa baris menjadi komentar.',
        '<code>/* ... */</code> untuk komentar panjang yang menutupi beberapa baris.',
        'Komentar berguna untuk menjelaskan maksud query kepada diri sendiri dan rekan kerja.'
      ]
    },
    {
      type: 'tip',
      title: 'Biasakan menulis rapi',
      text: 'Tulis <b>kata kunci SQL dengan huruf kapital</b> (SELECT, FROM, WHERE) dan nama tabel/kolom dengan huruf kecil. Ini memudahkan mata menemukan struktur query, terutama saat query-nya panjang.'
    },
    {
      type: 'vocab',
      items: [
        ['SELECT', 'Perintah untuk mengambil/memilih data.'],
        ['FROM', 'Menentukan tabel sumber data.'],
        ['Alias', 'Nama alternatif untuk kolom atau tabel, dibuat dengan AS.'],
        ['*', 'Simbol yang berarti seluruh kolom.'],
        ['Komentar', 'Tulisan yang diabaikan database, diawali -- atau dibungkus /* ... */.']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan lupa tanda titik koma',
      text: 'Sebagian besar database mengharuskan setiap perintah diakhiri tanda titik koma (<code>;</code>). Walau sebagian alat toleran, biasakan menutup perintah dengan <code>;</code> agar tidak bingung saat menulis banyak perintah sekaligus.'
    }
  ],
  recap: [
    'SELECT menentukan kolom, FROM menentukan tabel.',
    'Tanda * mengambil semua kolom; menyebut kolom satu per satu lebih baik untuk produksi.',
    'AS memberi nama alias pada kolom.',
    'Komentar ditulis dengan -- (satu baris) atau /* ... */ (banyak baris).'
  ]
});

/* ---------- Pelajaran 3: WHERE, ORDER BY, DISTINCT ---------- */
window.SQL_LESSONS.push({
  id: 'where-order-distinct',
  title: 'Menyaring dan Mengurutkan Data',
  chapter: 'Query Dasar',
  duration: '12 menit',
  intro: [
    'Mengambil seluruh isi tabel jarang cukup. Biasanya kita ingin <b>baris tertentu saja</b> (menyaring) dan ingin hasilnya <b>terurut</b>.',
    'Pelajaran ini membahas <b>WHERE</b> untuk menyaring, <b>ORDER BY</b> untuk mengurutkan, dan <b>DISTINCT</b> untuk menghilangkan duplikat.'
  ],
  objectives: [
    'Menyaring baris dengan WHERE dan beragam operator',
    'Menggabungkan syarat dengan AND, OR, dan NOT',
    'Menggunakan BETWEEN, IN, LIKE, dan IS NULL',
    'Mengurutkan hasil dengan ORDER BY',
    'Menghilangkan nilai duplikat dengan DISTINCT'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>WHERE</b> menyaring baris: hanya baris yang memenuhi syarat yang ditampilkan. Bentuknya: <code>SELECT kolom FROM tabel WHERE syarat;</code></p>'
    },
    {
      type: 'example',
      title: 'Operator perbandingan dasar',
      lang: 'sql',
      output: false,
      code: `-- Karyawan dengan jabatan "Manajer"
SELECT nama, jabatan
FROM karyawan
WHERE jabatan = 'Manajer';
-- Hasil: Budi, Eka

-- Karyawan dengan gaji di atas 5 juta
SELECT nama, gaji
FROM karyawan
WHERE gaji > 5000000;
-- Hasil: Budi, Eka, Fajar

-- Karyawan yang BUKAN Staf
SELECT nama, jabatan
FROM karyawan
WHERE jabatan <> 'Staf';   -- bisa juga ditulis !=`,
      explain: [
        '<code>=</code> berarti sama dengan, <code>&gt;</code> lebih besar, <code>&lt;</code> lebih kecil.',
        '<code>&lt;&gt;</code> atau <code>!=</code> berarti tidak sama dengan.',
        'Teks dan tanggal selalu diapit tanda kutip tunggal, mis. <code>&#39;Manajer&#39;</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Menggabungkan syarat: AND, OR, NOT',
      lang: 'sql',
      output: false,
      code: `-- Teknisi DAN bergaji di bawah 5,5 juta
SELECT nama, jabatan, gaji FROM karyawan
WHERE jabatan = 'Teknisi' AND gaji < 5500000;
-- Hasil: Andi, Fajar

-- Staf ATAU Manajer
SELECT nama, jabatan FROM karyawan
WHERE jabatan = 'Staf' OR jabatan = 'Manajer';

-- Bukan departemen 2
SELECT nama FROM karyawan
WHERE NOT departemen_id = 2;`,
      explain: [
        '<code>AND</code> menuntut <b>semua</b> syarat terpenuhi.',
        '<code>OR</code> cukup salah <b>satu</b> syarat terpenuhi.',
        '<code>NOT</code> membalik hasil syarat.'
      ]
    },
    {
      type: 'tip',
      title: 'Kurung kuadratkan logika',
      text: 'Saat menggabungkan AND dan OR, gunakan tanda kurung agar maksudmu jelas: <code>WHERE (kota = \'Bandung\' OR kota = \'Bogor\') AND aktif = 1</code>. Tanpa kurung, database punya urutan prioritas sendiri (AND didahulukan) yang sering mengejutkan.'
    },
    {
      type: 'example',
      title: 'BETWEEN, IN, dan LIKE',
      lang: 'sql',
      output: false,
      code: `-- RENTANG gaji 4 juta sampai 6 juta (ujung ikut dihitung)
SELECT nama, gaji FROM karyawan
WHERE gaji BETWEEN 4000000 AND 6000000;

-- Sama dengan salah satu daftar
SELECT nama, jabatan FROM karyawan
WHERE jabatan IN ('Staf', 'Teknisi');

-- Pola teks: awalan, akhiran, mengandung
SELECT nama FROM karyawan WHERE nama LIKE 'A%';   -- diawali A
SELECT nama FROM karyawan WHERE nama LIKE '%a';   -- diakhiri a
SELECT nama FROM karyawan WHERE nama LIKE '%ar%'; -- mengandung "ar" (Fajar)`,
      explain: [
        '<code>BETWEEN a AND b</code> mencakup kedua ujung nilai.',
        '<code>IN (...)</code> memeriksa apakah nilai ada dalam daftar.',
        '<code>LIKE</code> memakai <code>%</code> sebagai pengganti "apa saja". Tanda <code>_</code> menggantikan tepat satu karakter.'
      ]
    },
    {
      type: 'example',
      title: 'Menangani nilai kosong: IS NULL',
      lang: 'sql',
      output: false,
      code: `-- Karyawan yang belum punya departemen
SELECT nama, departemen_id FROM karyawan
WHERE departemen_id IS NULL;
-- Hasil: Gita

-- Kebalikannya
SELECT nama FROM karyawan
WHERE departemen_id IS NOT NULL;`,
      explain: [
        'Nilai kosong tidak bisa dibandingkan dengan <code>=</code>. <code>departemen_id = NULL</code> <b>tidak pernah benar</b>.',
        'Gunakan <code>IS NULL</code> dan <code>IS NOT NULL</code>.',
        'Kosong (<code>NULL</code>) berbeda dengan teks kosong atau angka nol.'
      ]
    },
    {
      type: 'example',
      title: 'Mengurutkan dengan ORDER BY',
      lang: 'sql',
      output: false,
      code: `-- Termurah ke termahal (naik / ASC)
SELECT nama, gaji FROM karyawan
ORDER BY gaji ASC;

-- Termahal ke termurah (turun / DESC)
SELECT nama, gaji FROM karyawan
ORDER BY gaji DESC;

-- Urutkan berdasarkan banyak kolom:
-- departemen dulu (kecil ke besar), lalu gaji (besar ke kecil)
SELECT nama, departemen_id, gaji FROM karyawan
ORDER BY departemen_id ASC, gaji DESC;`,
      explain: [
        '<code>ORDER BY kolom ASC</code> mengurutkan menaik; <code>DESC</code> menurun.',
        'Tanpa ASC/DESC, urutan bawaan adalah menaik (ASC).',
        'Urutkan dengan beberapa kolom: kolom pertama jadi prioritas utama, kolom berikutnya memecah nilai yang seri.'
      ]
    },
    {
      type: 'example',
      title: 'Menghilangkan duplikat dengan DISTINCT',
      lang: 'sql',
      output: false,
      code: `-- Jabatan apa saja yang ada? (tanpa duplikat)
SELECT DISTINCT jabatan FROM karyawan;
-- Hasil: Teknisi, Manajer, Staf

-- Kombinasi unik departemen + jabatan
SELECT DISTINCT departemen_id, jabatan FROM karyawan;`,
      explain: [
        '<code>DISTINCT</code> membuang baris yang isinya sama persis.',
        'Bila dipakai pada beberapa kolom, DISTINCT membuang kombinasi yang sama, bukan per kolom.'
      ]
    },
    {
      type: 'example',
      title: 'WHERE + ORDER BY dipakai bersama',
      lang: 'sql',
      output: false,
      code: `SELECT nama, gaji FROM karyawan
WHERE departemen_id = 1
ORDER BY gaji DESC;

-- Hasil (departemen Teknologi, gaji tertinggi dulu):
-- Budi  | 9000000
-- Fajar | 5200000
-- Andi  | 5000000`,
      explain: [
        'Urutan penulisan klausa harus: <code>SELECT → FROM → WHERE → ORDER BY</code>.',
        'WHERE menyaring lebih dulu, baru ORDER BY mengurutkan hasilnya.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['WHERE', 'Klausa penyaring baris.'],
        ['AND / OR / NOT', 'Operator logika penggabung syarat.'],
        ['BETWEEN', 'Memeriksa apakah nilai berada dalam rentang.'],
        ['IN', 'Memeriksa apakah nilai termasuk dalam daftar.'],
        ['LIKE', 'Mencocokkan pola teks memakai % dan _.'],
        ['IS NULL', 'Operator khusus untuk memeriksa nilai kosong.'],
        ['ORDER BY', 'Mengurutkan hasil query.'],
        ['DISTINCT', 'Membuang baris duplikat.']
      ]
    },
    {
      type: 'warn',
      title: 'LIKE dan huruf besar/kecil',
      text: 'Di sebagian database (mis. MySQL dengan pengaturan bawaan) <code>LIKE \'a%\'</code> juga cocok dengan "Andi". Di database lain (PostgreSQL) justru peka huruf besar/kecil. Jangan andalkan perilaku ini; bila perlu, gunakan fungsi <code>LOWER()</code> agar aman.'
    }
  ],
  recap: [
    'WHERE menyaring baris; gabungkan syarat dengan AND/OR/NOT.',
    'BETWEEN untuk rentang, IN untuk daftar, LIKE untuk pola teks, IS NULL untuk nilai kosong.',
    'ORDER BY ASC/DESC mengurutkan; bisa memakai beberapa kolom.',
    'DISTINCT membuang baris dengan nilai yang sama.'
  ]
});

/* ---------- Pelajaran 4: LIMIT & OFFSET ---------- */
window.SQL_LESSONS.push({
  id: 'limit-offset',
  title: 'Membatasi Jumlah Data: LIMIT & OFFSET',
  chapter: 'Query Dasar',
  duration: '7 menit',
  intro: [
    'Terkadang kita tidak butuh semua baris. Misalnya menampilkan 10 data teratas, atau mengambil halaman ke-3 pada daftar produk.',
    '<b>LIMIT</b> membatasi jumlah baris, sedangkan <b>OFFSET</b> melompati sejumlah baris di awal. Keduanya adalah dasar dari teknik <b>pagination</b>.'
  ],
  objectives: [
    'Membatasi jumlah baris hasil dengan LIMIT',
    'Melewati baris awal dengan OFFSET',
    'Membuat pagination (halaman demi halaman)',
    'Mengenal padanan LIMIT di database lain'
  ],
  sections: [
    {
      type: 'example',
      title: 'Mengambil sejumlah baris',
      lang: 'sql',
      output: false,
      code: `-- Ambil 3 baris pertama
SELECT nama, gaji FROM karyawan
ORDER BY gaji DESC
LIMIT 3;

-- Hasil: Eka (9500000), Budi (9000000), Fajar (5200000)`,
      explain: [
        '<code>LIMIT 3</code> hanya mengembalikan 3 baris.',
        'Selalu pasangkan LIMIT dengan ORDER BY, karena tanpa urutan tetap 3 baris mana yang muncul bisa berbeda-beda.'
      ]
    },
    {
      type: 'example',
      title: 'Melompati baris dengan OFFSET',
      lang: 'sql',
      output: false,
      code: `-- Lewati 3 baris, lalu ambil 3 baris
SELECT nama, gaji FROM karyawan
ORDER BY gaji DESC
LIMIT 3 OFFSET 3;

-- Hasil (dari urutan gaji tertinggi):
-- Andi  | 5000000
-- Dewi  | 4500000
-- Citra | 4000000`,
      explain: [
        '<code>OFFSET 3</code> membuang 3 baris pertama sebelum mulai mengambil.',
        'Kombinasi LIMIT + OFFSET memecah data menjadi halaman-halaman.'
      ]
    },
    {
      type: 'example',
      title: 'Pola pagination',
      lang: 'sql',
      output: false,
      code: `-- Rumus: OFFSET = (halaman - 1) * jumlah_per_halaman
-- 10 data per halaman:

-- Halaman 1
SELECT * FROM karyawan ORDER BY id LIMIT 10 OFFSET 0;
-- Halaman 2
SELECT * FROM karyawan ORDER BY id LIMIT 10 OFFSET 10;
-- Halaman 3
SELECT * FROM karyawan ORDER BY id LIMIT 10 OFFSET 20;`,
      explain: [
        'Halaman 1 mulai dari offset 0.',
        'Halaman 2 melewati 10 data pertama.',
        'Pola ini dipakai situs toko, berita, dan hampir semua daftar berhalaman.'
      ]
    },
    {
      type: 'tip',
      title: 'Penulisan singkat',
      text: 'Sebagian database mengizinkan <code>LIMIT 10, 20</code> yang berarti "lewati 20, ambil 10" — perhatikan urutannya <b>terbalik</b> dari <code>LIMIT 10 OFFSET 20</code>. Karena mudah tertukar, penulisan <code>LIMIT ... OFFSET ...</code> lebih dianjurkan.'
    },
    {
      type: 'warn',
      title: 'Beda dialek, beda kata kunci',
      text: 'SQLite, MySQL, dan PostgreSQL memakai <code>LIMIT</code>. Microsoft SQL Server memakai <code>SELECT TOP 10 ...</code> atau <code>OFFSET ... FETCH NEXT ...</code>. Oracle modern memakai <code>FETCH FIRST 10 ROWS ONLY</code>. Konsepnya sama, hanya penulisannya berbeda.'
    }
  ],
  recap: [
    'LIMIT membatasi jumlah baris yang dikembalikan.',
    'OFFSET melewati sejumlah baris di awal.',
    'LIMIT + OFFSET adalah dasar pagination: OFFSET = (halaman - 1) x jumlah per halaman.',
    'Selalu sertakan ORDER BY agar hasilnya konsisten.'
  ]
});

/* ---------- Pelajaran 5: Fungsi Agregasi Dasar ---------- */
window.SQL_LESSONS.push({
  id: 'agregasi-dasar',
  title: 'Fungsi Agregasi: COUNT, SUM, AVG, MIN, MAX',
  chapter: 'Query Dasar',
  duration: '9 menit',
  intro: [
    'Data tidak selalu ingin kita lihat satu per satu. Sering kita hanya butuh rangkuman: berapa jumlahnya, berapa totalnya, berapa rata-ratanya.',
    '<b>Fungsi agregasi</b> meringkas banyak baris menjadi satu nilai. Di sinilah SQL mulai terasa bertenaga.'
  ],
  objectives: [
    'Menghitung jumlah baris dengan COUNT',
    'Menjumlahkan dan merata-ratakan dengan SUM dan AVG',
    'Mencari nilai terkecil dan terbesar dengan MIN dan MAX',
    'Memahami pengaruh nilai NULL pada agregasi'
  ],
  sections: [
    {
      type: 'example',
      title: 'COUNT: menghitung baris',
      lang: 'sql',
      output: false,
      code: `-- Berapa jumlah karyawan seluruhnya?
SELECT COUNT(*) FROM karyawan;               -- 7

-- Berapa yang sudah punya departemen?
SELECT COUNT(departemen_id) FROM karyawan;   -- 6

-- Berapa jabatan berbeda yang ada?
SELECT COUNT(DISTINCT jabatan) FROM karyawan; -- 3`,
      explain: [
        '<code>COUNT(*)</code> menghitung <b>semua</b> baris.',
        '<code>COUNT(kolom)</code> hanya menghitung baris yang nilainya <b>tidak NULL</b>.',
        '<code>COUNT(DISTINCT kolom)</code> menghitung nilai unik yang tidak NULL.'
      ]
    },
    {
      type: 'example',
      title: 'SUM, AVG, MIN, MAX',
      lang: 'sql',
      output: false,
      code: `SELECT
  SUM(gaji) AS total_gaji,   -- 37000000
  AVG(gaji) AS rata_gaji,    -- 5285714.28...
  MIN(gaji) AS gaji_terkecil,-- 3800000
  MAX(gaji) AS gaji_terbesar -- 9500000
FROM karyawan;`,
      explain: [
        '<code>SUM</code> menjumlahkan seluruh nilai kolom.',
        '<code>AVG</code> menghitung rata-rata (SUM dibagi jumlah baris).',
        '<code>MIN</code> dan <code>MAX</code> mengambil nilai terkecil dan terbesar, baik untuk angka maupun tanggal.'
      ]
    },
    {
      type: 'example',
      title: 'Menggabungkan dengan WHERE',
      lang: 'sql',
      output: false,
      code: `-- Rata-rata gaji khusus departemen Teknologi (id 1)
SELECT COUNT(*) AS jumlah, AVG(gaji) AS rata
FROM karyawan
WHERE departemen_id = 1;

-- Hasil:
-- jumlah | rata
--      3 | 6400000`,
      explain: [
        'WHERE menyaring baris <b>sebelum</b> agregasi dihitung.',
        'Jadi AVG di atas hanya dari 3 karyawan departemen Teknologi.'
      ]
    },
    {
      type: 'example',
      title: 'Memberi alias agar hasil terbaca',
      lang: 'sql',
      output: false,
      code: `SELECT
  COUNT(*)   AS jumlah_karyawan,
  MAX(gaji)  AS gaji_tertinggi,
  MIN(tanggal_masuk) AS karyawan_terlama
FROM karyawan;`,
      explain: [
        'Kolom hasil agregasi otomatis diberi nama seperti fungsi (mis. <code>AVG(gaji)</code>) yang sulit dibaca.',
        'Gunakan <code>AS</code> untuk memberi nama yang jelas.'
      ]
    },
    {
      type: 'tip',
      title: 'MIN dan MAX untuk tanggal',
      text: 'Selain angka, <code>MIN</code> dan <code>MAX</code> berguna untuk tanggal. <code>MIN(tanggal_masuk)</code> memberi karyawan paling lama, <code>MAX(tanggal_masuk)</code> memberi yang paling baru.'
    },
    {
      type: 'vocab',
      items: [
        ['COUNT', 'Menghitung jumlah baris/nilai.'],
        ['SUM', 'Menjumlahkan seluruh nilai pada kolom angka.'],
        ['AVG', 'Menghitung nilai rata-rata.'],
        ['MIN', 'Mengambil nilai terkecil.'],
        ['MAX', 'Mengambil nilai terbesar.'],
        ['Agregasi', 'Proses meringkas banyak baris menjadi satu nilai.']
      ]
    },
    {
      type: 'warn',
      title: 'NULL diabaikan agregasi',
      text: 'Fungsi <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, dan <code>MAX</code> <b>mengabaikan</b> nilai NULL. Jadi <code>AVG(gaji)</code> membagi total gaji dengan jumlah baris yang punya nilai gaji, bukan seluruh baris. Ini sering membuat rata-rata terasa "meleset" bila banyak yang kosong.'
    }
  ],
  recap: [
    'COUNT menghitung baris; COUNT(*) vs COUNT(kolom) menghasilkan angka berbeda bila ada NULL.',
    'SUM, AVG, MIN, dan MAX meringkas kolom menjadi satu nilai.',
    'WHERE menyaring baris sebelum agregasi.',
    'Fungsi agregasi mengabaikan nilai NULL.'
  ]
});
