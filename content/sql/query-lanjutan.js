/* ============================================================
   Pelajaran SQL — Bab 5: Query Lanjutan
   (topik info.md:
    - "subquery (query bersarang)"
    - "common table expressions (CTE / klausa WITH)"
    - "window functions (ROW_NUMBER(), RANK(), DENSE_RANK(),
       LAG(), LEAD(), OVER())")
   ============================================================ */
'use strict';

window.SQL_LESSONS = window.SQL_LESSONS || [];

/* ---------- Pelajaran 10: Subquery ---------- */
window.SQL_LESSONS.push({
  id: 'subquery',
  title: 'Subquery (Query Bersarang)',
  chapter: 'Query Lanjutan',
  duration: '11 menit',
  intro: [
    'Kadang jawaban sebuah pertanyaan butuh hasil dari pertanyaan lain lebih dulu. Misalnya: "Siapa karyawan yang gajinya di atas rata-rata?" Kita perlu tahu rata-ratanya dulu, baru membandingkan.',
    '<b>Subquery</b> adalah query yang ditulis di dalam query lain untuk keperluan seperti itu.'
  ],
  objectives: [
    'Menulis subquery di dalam WHERE',
    'Memakai subquery skalar, IN, dan EXISTS',
    'Mengenal subquery berkorelasi',
    'Menempatkan subquery di FROM',
    'Mengenal EXISTS vs IN'
  ],
  sections: [
    {
      type: 'example',
      title: 'Subquery skalar di dalam WHERE',
      lang: 'sql',
      output: false,
      code: `-- Karyawan dengan gaji di atas rata-rata perusahaan
SELECT nama, gaji
FROM karyawan
WHERE gaji > (SELECT AVG(gaji) FROM karyawan);

-- Subquery (SELECT AVG(gaji) ...) menghasilkan satu nilai,
-- lalu dibandingkan dengan tiap baris karyawan.`,
      explain: [
        'Query di dalam tanda kurung dijalankan lebih dulu.',
        'Hasilnya satu nilai (skalar) yang dipakai oleh query luar.',
        'Ini disebut subquery <b>skalar</b> karena menghasilkan tepat satu nilai.'
      ]
    },
    {
      type: 'example',
      title: 'Subquery dengan IN',
      lang: 'sql',
      output: false,
      code: `-- Karyawan yang bekerja di departemen "Teknologi"
SELECT nama
FROM karyawan
WHERE departemen_id IN (
  SELECT id FROM departemen WHERE nama = 'Teknologi'
);

-- Alternatif dengan JOIN:
SELECT k.nama
FROM karyawan k
JOIN departemen d ON k.departemen_id = d.id
WHERE d.nama = 'Teknologi';`,
      explain: [
        'Subquery mengembalikan daftar id, lalu dipakai oleh <code>IN</code>.',
        'Untuk kasus ini JOIN biasanya lebih cepat, tetapi subquery lebih mudah dibaca bagi pemula.'
      ]
    },
    {
      type: 'example',
      title: 'Subquery berkorelasi dengan EXISTS',
      lang: 'sql',
      output: false,
      code: `-- Departemen yang memiliki minimal satu karyawan bergaji > 8 juta
SELECT d.nama
FROM departemen d
WHERE EXISTS (
  SELECT 1 FROM karyawan k
  WHERE k.departemen_id = d.id AND k.gaji > 8000000
);
-- Hasil: Teknologi, Keuangan`,
      explain: [
        'Subquery "berkorelasi" karena memakai nilai <code>d.id</code> dari query luar.',
        '<code>EXISTS</code> bernilai benar bila subquery mengembalikan minimal satu baris.',
        '<code>SELECT 1</code> hanya penanda; isinya tidak penting karena EXISTS cukup tahu ada/tidaknya baris.'
      ]
    },
    {
      type: 'example',
      title: 'Subquery di FROM (derived table)',
      lang: 'sql',
      output: false,
      code: `-- Rata-rata jumlah karyawan per departemen
SELECT AVG(jml) AS rata_jumlah
FROM (
  SELECT departemen_id, COUNT(*) AS jml
  FROM karyawan
  GROUP BY departemen_id
) AS per_departemen;`,
      explain: [
        'Subquery di <code>FROM</code> menghasilkan tabel sementara (derived table).',
        'Tabel sementara itu wajib diberi alias, di sini <code>per_departemen</code>.',
        'Query luar memperlakukannya layaknya tabel biasa.'
      ]
    },
    {
      type: 'tip',
      title: 'EXISTS vs IN',
      text: 'Gunakan <code>EXISTS</code> bila subquery bisa mengembalikan banyak baris atau saat ingin menghentikan pencarian begitu menemukan satu kecocokan (lebih efisien). Gunakan <code>IN</code> bila daftar nilainya pendek dan mudah dibaca.'
    },
    {
      type: 'vocab',
      items: [
        ['Subquery', 'Query yang diletakkan di dalam query lain.'],
        ['Subquery skalar', 'Subquery yang menghasilkan tepat satu nilai.'],
        ['Subquery berkorelasi', 'Subquery yang memakai nilai dari query luar.'],
        ['EXISTS', 'Operator yang bernilai benar bila subquery menghasilkan baris.'],
        ['Derived table', 'Tabel sementara hasil subquery di klausa FROM.']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan terlalu dalam',
      text: 'Subquery yang bersarang berkali-kali sulit dibaca dan sering tidak efisien. Bila merasa mulai rumit, biasanya itu tanda siap beralih ke <b>CTE</b> (pelajaran berikutnya) yang jauh lebih rapi.'
    }
  ],
  recap: [
    'Subquery adalah query di dalam query.',
    'Subquery skalar menghasilkan satu nilai; dipakai untuk perbandingan.',
    'IN dan EXISTS memeriksa keberadaan nilai di subquery.',
    'Subquery di FROM menjadi tabel sementara (derived table) dan wajib diberi alias.'
  ]
});

/* ---------- Pelajaran 11: CTE ---------- */
window.SQL_LESSONS.push({
  id: 'cte-with',
  title: 'Common Table Expressions (CTE / WITH)',
  chapter: 'Query Lanjutan',
  duration: '10 menit',
  intro: [
    'Bayangkan query panjang yang menyimpan tabel sementara di dalam tabel sementara. Hasilnya berhasil, tapi membacanya seperti mengurai benang kusut.',
    '<b>CTE</b> (Common Table Expression) memakai kata kunci <b>WITH</b> untuk menamai tabel sementara di awal query sehingga alurnya tersusun dari atas ke bawah seperti membaca cerita.'
  ],
  objectives: [
    'Membuat CTE dengan klausa WITH',
    'Membagi query kompleks menjadi langkah-langkah',
    'Memakai beberapa CTE dalam satu query',
    'Mengenal CTE rekursif'
  ],
  sections: [
    {
      type: 'example',
      title: 'CTE dasar',
      lang: 'sql',
      output: false,
      code: `WITH rata_gaji AS (
  SELECT AVG(gaji) AS rata FROM karyawan
)
SELECT nama, gaji
FROM karyawan, rata_gaji
WHERE gaji > rata_gaji.rata;

-- sama hasilnya dengan subquery, tapi lebih jelas.`,
      explain: [
        '<code>WITH nama_cte AS ( ... )</code> mendefinisikan tabel sementara bernama <code>rata_gaji</code>.',
        'CTE dipakai di query utama seolah tabel biasa.',
        'Query utama jadi lebih pendek dan mudah dibaca.'
      ]
    },
    {
      type: 'example',
      title: 'Beberapa CTE berurutan',
      lang: 'sql',
      output: false,
      code: `WITH
total_per_departemen AS (
  SELECT departemen_id, SUM(gaji) AS total
  FROM karyawan
  GROUP BY departemen_id
),
nama_departemen AS (
  SELECT id, nama FROM departemen
)
SELECT nd.nama AS departemen, t.total
FROM total_per_departemen t
JOIN nama_departemen nd ON nd.id = t.departemen_id
ORDER BY t.total DESC;`,
      explain: [
        'CTE kedua dipisah dengan koma setelah CTE pertama.',
        'Setiap CTE menyelesaikan satu langkah kecil, sehingga logika lebih mudah diuji satu per satu.',
        'Ini pola yang sangat umum di laporan dan analisis data.'
      ]
    },
    {
      type: 'example',
      title: 'CTE rekursif: struktur berjenjang',
      lang: 'sql',
      output: false,
      code: `-- Misalkan tabel bawahan(id, nama, atasan_id) membentuk hierarki.
WITH RECURSIVE hierarki AS (
  SELECT id, nama, 1 AS level        -- titik awal (level 1)
  FROM bawahan WHERE atasan_id IS NULL
  UNION ALL
  SELECT b.id, b.nama, h.level + 1   -- langkah berulang
  FROM bawahan b
  JOIN hierarki h ON b.atasan_id = h.id
)
SELECT level, nama FROM hierarki ORDER BY level, nama;`,
      explain: [
        '<code>RECURSIVE</code> memungkinkan CTE memanggil dirinya sendiri.',
        'Bagian pertama adalah kondisi awal; bagian setelah <code>UNION ALL</code> mengulang ke jenjang berikutnya.',
        'Cocok untuk struktur pohon: organisasi, kategori produk, komentar bersarang.'
      ]
    },
    {
      type: 'tip',
      title: 'CTE = query yang boleh dibaca manusia',
      text: 'Kebiasaan baik: beri nama CTE sesuai maksudnya (<code>total_per_departemen</code>, bukan <code>t1</code>). Nama yang jelas membuat query panjang tetap bisa dipahami orang lain — termasuk dirimu enam bulan dari sekarang.'
    },
    {
      type: 'warn',
      title: 'Jangan lupa UNION ALL pada CTE rekursif',
      text: 'CTE rekursif <b>wajib</b> punya kondisi berhenti, kalau tidak query akan berjalan tanpa henti. Pastikan setiap langkah mendekati kondisi dasar, dan uji dengan data kecil lebih dulu.'
    }
  ],
  recap: [
    'CTE didefinisikan dengan WITH nama AS ( ... ) dan dipakai seperti tabel.',
    'Beberapa CTE dapat ditulis berurutan dipisah koma.',
    'CTE membuat query kompleks tersusun rapi dari langkah kecil.',
    'RECURSIVE menangani data berjenjang/bertingkat.'
  ]
});

/* ---------- Pelajaran 12: Window Functions ---------- */
window.SQL_LESSONS.push({
  id: 'window-functions',
  title: 'Window Functions',
  chapter: 'Query Lanjutan',
  duration: '13 menit',
  intro: [
    'GROUP BY meringkas banyak baris menjadi satu. Tapi adakalanya kita ingin tetap melihat <b>setiap baris</b>, sambil menambahkan informasi ringkasan di sampingnya — misalnya peringkat gaji dalam departemen.',
    '<b>Window functions</b> melakukan tepat itu: menghitung sambil "mengintip" kelompok baris di sekitarnya tanpa menghilangkan barisnya.'
  ],
  objectives: [
    'Memahami klausa OVER dan PARTITION BY',
    'Memberi nomor urut dengan ROW_NUMBER',
    'Memberi peringkat dengan RANK dan DENSE_RANK',
    'Melihat nilai sebelum/sesudah dengan LAG dan LEAD',
    'Menghitung total berjalan (running total)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Kata kunci utamanya adalah <code>OVER (...)</code>. Di dalamnya kita bisa menulis <code>PARTITION BY</code> (membagi data menjadi kelompok) dan <code>ORDER BY</code> (menentukan urutan di dalam kelompok).</p>'
    },
    {
      type: 'example',
      title: 'ROW_NUMBER: memberi nomor urut',
      lang: 'sql',
      output: false,
      code: `SELECT
  nama,
  departemen_id,
  gaji,
  ROW_NUMBER() OVER (PARTITION BY departemen_id ORDER BY gaji DESC) AS peringkat
FROM karyawan;

-- Hasil (peringkat dihitung ulang untuk tiap departemen):
-- Budi  | 1 | 9000000 | 1
-- Fajar | 1 | 5200000 | 2
-- Andi  | 1 | 5000000 | 3
-- Dewi  | 2 | 4500000 | 1
-- Citra | 2 | 4000000 | 2`,
      explain: [
        '<code>PARTITION BY departemen_id</code> memulai penomoran ulang untuk tiap departemen.',
        '<code>ORDER BY gaji DESC</code> menentukan siapa yang mendapat nomor 1 (gaji terbesar).',
        'Baris asli tetap ditampilkan — tidak diringkas.'
      ]
    },
    {
      type: 'example',
      title: 'RANK & DENSE_RANK: peringkat saat ada nilai seri',
      lang: 'sql',
      output: false,
      code: `SELECT
  nama,
  gaji,
  ROW_NUMBER() OVER (ORDER BY gaji DESC) AS row_num,
  RANK()       OVER (ORDER BY gaji DESC) AS rank,
  DENSE_RANK() OVER (ORDER BY gaji DESC) AS dense
FROM karyawan;

-- Bila dua nilai sama (seri) di posisi 2:
-- ROW_NUMBER : 1, 2, 3, 4   (selalu unik)
-- RANK       : 1, 2, 2, 4   (melompati nomor)
-- DENSE_RANK : 1, 2, 2, 3   (tidak melompat)`,
      explain: [
        '<code>ROW_NUMBER</code> selalu memberi nomor berbeda, walau nilainya sama.',
        '<code>RANK</code> memberi nomor sama untuk nilai seri, lalu nomor berikutnya melompat.',
        '<code>DENSE_RANK</code> memberi nomor sama untuk nilai seri tanpa melompati nomor.'
      ]
    },
    {
      type: 'example',
      title: 'LAG & LEAD: melihat baris sebelumnya/berikutnya',
      lang: 'sql',
      output: false,
      code: `SELECT
  nama,
  gaji,
  LAG(gaji)  OVER (ORDER BY gaji) AS gaji_sebelumnya,
  LEAD(gaji) OVER (ORDER BY gaji) AS gaji_berikutnya
FROM karyawan;

-- Berguna untuk melihat selisih antar baris.`,
      explain: [
        '<code>LAG(kolom)</code> mengambil nilai dari baris <b>sebelumnya</b>.',
        '<code>LEAD(kolom)</code> mengambil nilai dari baris <b>sesudahnya</b>.',
        'Baris pertama tidak punya "sebelumnya", sehingga hasilnya NULL.'
      ]
    },
    {
      type: 'example',
      title: 'Running total',
      lang: 'sql',
      output: false,
      code: `SELECT
  nama,
  tanggal_masuk,
  gaji,
  SUM(gaji) OVER (ORDER BY tanggal_masuk) AS total_berjalan
FROM karyawan
ORDER BY tanggal_masuk;

-- total_berjalan menjumlahkan gaji kumulatif dari karyawan paling lama
-- sampai karyawan pada baris itu.`,
      explain: [
        'Dengan <code>ORDER BY</code> di dalam <code>OVER</code>, <code>SUM</code> berubah menjadi total berjalan.',
        'Fitur ini tidak bisa ditiru mudah oleh GROUP BY biasa.',
        'Sangat berguna untuk laporan keuangan dan tren dari waktu ke waktu.'
      ]
    },
    {
      type: 'tip',
      title: 'Window function vs GROUP BY',
      text: 'Aturan singkat: kalau ingin <b>mengurangi</b> jumlah baris menjadi ringkasan, pakai GROUP BY. Kalau ingin <b>mempertahankan</b> setiap baris tetapi menambah informasi peringkat/total, pakai window function.'
    },
    {
      type: 'vocab',
      items: [
        ['OVER()', 'Penanda bahwa fungsi dihitung sebagai window function.'],
        ['PARTITION BY', 'Membagi data menjadi kelompok untuk perhitungan window.'],
        ['ROW_NUMBER', 'Memberi nomor urut unik dalam tiap kelompok.'],
        ['RANK / DENSE_RANK', 'Memberi peringkat; beda cara menangani nilai seri.'],
        ['LAG / LEAD', 'Mengambil nilai baris sebelumnya/berikutnya.'],
        ['Running total', 'Jumlah kumulatif sampai baris tertentu.']
      ]
    },
    {
      type: 'warn',
      title: 'Tidak semua database sama',
      text: 'Window functions didukung MySQL 8+, PostgreSQL, SQL Server, Oracle, dan SQLite 3.25+. Bila memakai versi lama, fitur ini belum ada. Periksa versi database sebelum bergantung padanya.'
    }
  ],
  recap: [
    'Window function menghitung tanpa menghilangkan baris, memakai OVER().',
    'PARTITION BY membentuk kelompok; ORDER BY menentukan urutan hitung.',
    'ROW_NUMBER vs RANK vs DENSE_RANK berbeda saat ada nilai seri.',
    'LAG/LEAD melihat baris tetangga; SUM OVER() membuat running total.'
  ]
});
