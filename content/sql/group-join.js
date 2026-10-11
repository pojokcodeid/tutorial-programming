/* ============================================================
   Pelajaran SQL — Bab 4: Pengelompokan & Penggabungan
   (topik info.md:
    - "pengelompokan data (GROUP BY & HAVING)"
    - "penggabungan tabel / JOINs (INNER JOIN, LEFT JOIN,
       RIGHT JOIN, FULL OUTER JOIN)")
   ============================================================ */
'use strict';

window.SQL_LESSONS = window.SQL_LESSONS || [];

/* ---------- Pelajaran 8: GROUP BY & HAVING ---------- */
window.SQL_LESSONS.push({
  id: 'group-by-having',
  title: 'Mengelompokkan Data: GROUP BY & HAVING',
  chapter: 'Pengelompokan & Relasi',
  duration: '10 menit',
  intro: [
    'Fungsi agregasi tadi meringkas <b>seluruh</b> tabel menjadi satu angka. Bagaimana kalau kita ingin ringkasan <b>per kelompok</b> — misalnya rata-rata gaji per departemen?',
    'Di sinilah <b>GROUP BY</b> berperan. Dan ketika ingin menyaring hasil kelompok, kita memakai <b>HAVING</b>.'
  ],
  objectives: [
    'Mengelompokkan baris dengan GROUP BY',
    'Menghitung agregat per kelompok',
    'Menyaring hasil kelompok dengan HAVING',
    'Membedakan WHERE dan HAVING'
  ],
  sections: [
    {
      type: 'example',
      title: 'Menghitung jumlah karyawan per departemen',
      lang: 'sql',
      output: false,
      code: `SELECT departemen_id, COUNT(*) AS jumlah_karyawan
FROM karyawan
GROUP BY departemen_id;

-- Hasil:
-- departemen_id | jumlah_karyawan
--      1        |       3
--      2        |       2
--      3        |       1
--    NULL       |       1`,
      explain: [
        '<code>GROUP BY departemen_id</code> mengumpulkan baris dengan departemen_id sama.',
        'COUNT(*) menghitung banyak baris dalam tiap kelompok.',
        'Baris dengan departemen NULL tetap menjadi kelompok tersendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Beberapa agregat sekaligus',
      lang: 'sql',
      output: false,
      code: `SELECT
  departemen_id,
  COUNT(*)      AS jumlah,
  SUM(gaji)     AS total_gaji,
  AVG(gaji)     AS rata_gaji,
  MIN(gaji)     AS terkecil,
  MAX(gaji)     AS terbesar
FROM karyawan
GROUP BY departemen_id;`,
      explain: [
        'Satu query bisa menghitung banyak agregat sekaligus untuk tiap kelompok.',
        'Semua kolom di SELECT yang bukan agregat <b>harus</b> ada di GROUP BY.'
      ]
    },
    {
      type: 'example',
      title: 'Menyaring kelompok dengan HAVING',
      lang: 'sql',
      output: false,
      code: `-- Departemen yang punya lebih dari 1 karyawan
SELECT departemen_id, COUNT(*) AS jumlah
FROM karyawan
GROUP BY departemen_id
HAVING COUNT(*) > 1;

-- Hasil: departemen 1 (3 orang), departemen 2 (2 orang)`,
      explain: [
        'HAVING menyaring berdasarkan <b>hasil agregat</b>.',
        'WHERE tidak bisa memakai fungsi agregat seperti COUNT(*).',
        'Diperlukan HAVING karena penyaringan terjadi <b>setelah</b> pengelompokan.'
      ]
    },
    {
      type: 'example',
      title: 'WHERE dan HAVING bersama',
      lang: 'sql',
      output: false,
      code: `-- Rata-rata gaji per departemen, hanya untuk karyawan bergaji >= 4 juta,
-- dan hanya departemen dengan rata-rata > 5 juta
SELECT departemen_id, AVG(gaji) AS rata
FROM karyawan
WHERE gaji >= 4000000            -- saring BARIS dulu
GROUP BY departemen_id
HAVING AVG(gaji) > 5000000       -- saring KELOMPOK setelahnya
ORDER BY rata DESC;`,
      explain: [
        '<code>WHERE</code> menyaring baris sebelum dikelompokkan.',
        '<code>HAVING</code> menyaring kelompok setelah agregasi dihitung.',
        'Urutannya: WHERE → GROUP BY → HAVING → ORDER BY.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan klausa SQL',
      text: 'Hafalkan urutan tetap ini: <b>SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT</b>. Database selalu mengeksekusi dengan urutan logika tersebut, sehingga menulis klausa di luar urutan akan menimbulkan error.'
    },
    {
      type: 'vocab',
      items: [
        ['GROUP BY', 'Mengelompokkan baris berdasarkan nilai kolom tertentu.'],
        ['HAVING', 'Menyaring kelompok setelah agregasi.'],
        ['Kelompok (group)', 'Kumpulan baris yang memiliki nilai kolom yang sama.'],
        ['Agregat', 'Nilai ringkasan hasil fungsi seperti COUNT atau AVG.']
      ]
    },
    {
      type: 'warn',
      title: 'Kolom SELECT harus ada di GROUP BY',
      text: 'Pada <code>SELECT departemen_id, nama FROM karyawan GROUP BY departemen_id</code>, kolom <code>nama</code> membingungkan: satu kelompok berisi banyak nama, mana yang ditampilkan? Aturannya: kolom non-agregat di SELECT <b>wajib</b> muncul di GROUP BY.'
    }
  ],
  recap: [
    'GROUP BY meringkas data per kelompok.',
    'Fungsi agregasi dihitung untuk setiap kelompok.',
    'HAVING menyaring hasil kelompok; WHERE menyaring baris mentah.',
    'Urutan klausa: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.'
  ]
});

/* ---------- Pelajaran 9: JOINs ---------- */
window.SQL_LESSONS.push({
  id: 'joins',
  title: 'Menggabungkan Tabel: JOINs',
  chapter: 'Pengelompokan & Relasi',
  duration: '14 menit',
  intro: [
    'Kekuatan database relasional bukan pada satu tabel, melainkan pada kemampuannya <b>menghubungkan</b> tabel. Kita menyimpan data di tabel terpisah, lalu menyatukannya saat dibutuhkan.',
    'Perintah untuk itu disebut <b>JOIN</b>. Ada beberapa jenis JOIN, dan masing-masing menjawab kebutuhan yang berbeda.'
  ],
  objectives: [
    'Memahami cara kerja JOIN dan kunci penghubung (ON)',
    'Membedakan INNER, LEFT, RIGHT, dan FULL OUTER JOIN',
    'Menggunakan alias tabel',
    'Menggabungkan lebih dari dua tabel'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Ingat tabel <code>karyawan</code> menyimpan <code>departemen_id</code>, bukan nama departemen. Untuk menampilkan nama departemen, kita harus <b>menggabungkan</b> tabel karyawan dengan tabel departemen memakai kolom penghubung:</p>'
    },
    {
      type: 'example',
      title: 'INNER JOIN: hanya yang cocok di kedua tabel',
      lang: 'sql',
      output: false,
      code: `SELECT k.nama, d.nama AS departemen
FROM karyawan AS k
INNER JOIN departemen AS d
  ON k.departemen_id = d.id;

-- Hasil (Gita tidak muncul karena departemennya NULL):
-- Andi  | Teknologi
-- Budi  | Teknologi
-- Fajar | Teknologi
-- Citra | Pemasaran
-- Dewi  | Pemasaran
-- Eka   | Keuangan`,
      explain: [
        '<code>ON k.departemen_id = d.id</code> adalah syarat penghubung antar tabel.',
        '<b>INNER JOIN</b> hanya menampilkan baris yang punya pasangan di kedua tabel.',
        'Alias <code>k</code> dan <code>d</code> mempersingkat penulisan nama tabel.'
      ]
    },
    {
      type: 'example',
      title: 'LEFT JOIN: semua baris tabel kiri',
      lang: 'sql',
      output: false,
      code: `SELECT k.nama, d.nama AS departemen
FROM karyawan AS k
LEFT JOIN departemen AS d
  ON k.departemen_id = d.id;

-- Gita ikut muncul walau departemennya NULL:
-- ...
-- Gita  | NULL`,
      explain: [
        '<b>LEFT JOIN</b> menampilkan <b>semua</b> baris tabel kiri (karyawan), walau tidak ada pasangannya.',
        'Kolom dari tabel kanan yang tidak cocok berisi NULL.',
        'Berguna untuk mencari "yang belum lengkap datanya" — mis. karyawan tanpa departemen.'
      ]
    },
    {
      type: 'example',
      title: 'Menemukan data yang tidak punya pasangan',
      lang: 'sql',
      output: false,
      code: `-- Karyawan yang belum terdaftar di departemen mana pun
SELECT k.nama
FROM karyawan AS k
LEFT JOIN departemen AS d
  ON k.departemen_id = d.id
WHERE d.id IS NULL;
-- Hasil: Gita`,
      explain: [
        'Trik klasik: LEFT JOIN lalu saring kolom tabel kanan yang NULL.',
        'Menghasilkan baris yang <b>hanya ada di tabel kiri</b>.'
      ]
    },
    {
      type: 'example',
      title: 'RIGHT dan FULL OUTER JOIN',
      lang: 'sql',
      output: false,
      code: `-- RIGHT JOIN: semua baris tabel kanan
SELECT k.nama, d.nama AS departemen
FROM karyawan AS k
RIGHT JOIN departemen AS d
  ON k.departemen_id = d.id;
-- Departemen yang belum punya karyawan tetap muncul.

-- FULL OUTER JOIN: semua baris dari kedua tabel
SELECT k.nama, d.nama AS departemen
FROM karyawan AS k
FULL OUTER JOIN departemen AS d
  ON k.departemen_id = d.id;`,
      explain: [
        '<b>RIGHT JOIN</b> kebalikan LEFT JOIN: semua baris tabel kanan yang dipertahankan.',
        '<b>FULL OUTER JOIN</b> menampilkan semua baris dari kedua tabel, yang tidak cocok diisi NULL.',
        'SQLite versi lama tidak mendukung RIGHT/FULL OUTER JOIN — periksa versi database kamu.'
      ]
    },
    {
      type: 'example',
      title: 'Menggabungkan lebih dari dua tabel',
      lang: 'sql',
      output: false,
      code: `-- Misalkan ada tabel proyek(id, nama, departemen_id)
SELECT k.nama AS karyawan, d.nama AS departemen, p.nama AS proyek
FROM karyawan k
JOIN departemen d ON k.departemen_id = d.id
JOIN proyek     p ON p.departemen_id  = d.id
ORDER BY d.nama, k.nama;`,
      explain: [
        'Kita bisa merantai beberapa JOIN sekaligus.',
        'Setiap JOIN punya klausa ON sendiri.',
        'Pastikan kolom penghubung benar agar hasilnya tidak menggandakan baris.'
      ]
    },
    {
      type: 'tip',
      title: 'JOIN vs koma',
      text: 'Menulis <code>FROM a, b WHERE a.id = b.id</code> sebenarnya juga sebuah inner join. Namun penulisan <code>JOIN ... ON ...</code> lebih dianjurkan karena memisahkan syarat penghubung dari syarat penyaringan, sehingga query lebih mudah dibaca.'
    },
    {
      type: 'vocab',
      items: [
        ['JOIN', 'Menggabungkan baris dari dua tabel atau lebih.'],
        ['ON', 'Syarat penghubung antar tabel.'],
        ['INNER JOIN', 'Hanya baris yang punya pasangan di kedua tabel.'],
        ['LEFT JOIN', 'Semua baris tabel kiri + pasangannya bila ada.'],
        ['RIGHT JOIN', 'Semua baris tabel kanan + pasangannya bila ada.'],
        ['FULL OUTER JOIN', 'Semua baris dari kedua tabel.']
      ]
    },
    {
      type: 'warn',
      title: 'JOIN bisa melipatgandakan baris',
      text: 'Bila syarat <code>ON</code> tidak unik (satu baris cocok dengan banyak baris di tabel lain), hasilnya bisa lebih banyak daripada tabel aslinya. Selalu uji jumlah baris dan pastikan kolom penghubung tepat.'
    }
  ],
  recap: [
    'JOIN menyatukan data dari beberapa tabel lewat kolom penghubung dengan ON.',
    'INNER JOIN hanya baris yang cocok; LEFT/RIGHT JOIN mempertahankan seluruh baris salah satu sisi.',
    'FULL OUTER JOIN mempertahankan semua baris dari kedua tabel.',
    'LEFT JOIN + WHERE ... IS NULL menemukan data yang tidak punya pasangan.'
  ]
});
