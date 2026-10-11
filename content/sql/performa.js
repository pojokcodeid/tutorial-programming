/* ============================================================
   Pelajaran SQL — Bab 6: Performa & Otomatisasi
   (topik info.md:
    - "indexing dan optimasi performa query (EXPLAIN PLAN,
       CREATE INDEX)"
    - "stored procedures dan functions")
   ============================================================ */
'use strict';

window.SQL_LESSONS = window.SQL_LESSONS || [];

/* ---------- Pelajaran 13: Indexing & Optimasi ---------- */
window.SQL_LESSONS.push({
  id: 'indexing-optimasi',
  title: 'Indexing & Optimasi Performa Query',
  chapter: 'Performa & Otomatisasi',
  duration: '12 menit',
  intro: [
    'Selama data masih ratusan baris, semua query terasa instan. Tapi ketika tabel berisi jutaan baris, query yang sama bisa memakan waktu lama.',
    '<b>Index</b> adalah salah satu senjata utama untuk mempercepat pencarian, dan <b>EXPLAIN</b> membantu kita memahami apa yang sebenarnya dilakukan database.'
  ],
  objectives: [
    'Memahami cara kerja index',
    'Membuat index dengan CREATE INDEX',
    'Mengenal unique index, composite index, dan index otomatis',
    'Membaca rencana eksekusi dengan EXPLAIN',
    'Mengetahui kapan index justru memperlambat'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bayangkan buku tebal tanpa indeks. Untuk menemukan satu istilah, kamu harus membaca halaman demi halaman. <b>Index database</b> bekerja seperti indeks buku: database membuat daftar terurut yang memetakan nilai kolom ke lokasi barisnya, sehingga pencarian bisa melompat langsung ke data yang dicari.</p>'
    },
    {
      type: 'example',
      title: 'Membuat index',
      lang: 'sql',
      output: false,
      code: `-- Index biasa pada kolom yang sering dicari
CREATE INDEX idx_karyawan_nama ON karyawan (nama);

-- Index unik (nilai tidak boleh kembar)
CREATE UNIQUE INDEX idx_produk_kode ON produk (kode);

-- Composite index: gabungan dua kolom
CREATE INDEX idx_karyawan_dept_gaji ON karyawan (departemen_id, gaji);

-- Menghapus index
DROP INDEX idx_karyawan_nama;`,
      explain: [
        '<code>CREATE INDEX</code> mempercepat pencarian pada kolom yang dipakai di WHERE, JOIN, atau ORDER BY.',
        '<b>Composite index</b> berguna bila query sering menyaring dua kolom sekaligus.',
        '<b>Unique index</b> menjamin keunikan sekaligus mempercepat pencarian.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kamu <b>tidak perlu</b> membuat index untuk primary key dan kolom UNIQUE — database membuatnya otomatis. Namun foreign key dan kolom yang sering muncul di WHERE tidak otomatis ber-index di semua database, jadi sering kali perlu ditambahkan manual.</p>'
    },
    {
      type: 'example',
      title: 'Melihat rencana eksekusi dengan EXPLAIN',
      lang: 'sql',
      output: false,
      code: `EXPLAIN
SELECT nama FROM karyawan WHERE departemen_id = 1;

-- Contoh keluaran ringkas:
-- SEARCH karyawan USING INDEX idx_karyawan_dept_gaji (departemen_id=?)
--
-- Kata "SEARCH ... USING INDEX" menandakan index dipakai.
-- Bila muncul "SCAN karyawan", artinya database membaca seluruh tabel.`,
      explain: [
        '<code>EXPLAIN</code> menampilkan rencana database menjalankan query tanpa benar-benar menjalankannya.',
        'Cari petunjuk apakah database memakai <b>index</b> (cepat) atau <b>full scan</b> (lambat pada tabel besar).',
        'Isi keluaran EXPLAIN berbeda-beda antar RDBMS.'
      ]
    },
    {
      type: 'example',
      title: 'Sebelum & sesudah index',
      lang: 'text',
      output: false,
      code: `-- Query yang sering dijalankan:
SELECT * FROM pesanan WHERE pelanggan_id = 12345;

-- Tanpa index:
--   SCAN pesanan  → membaca 5.000.000 baris  (~2 detik)

-- Setelah index:
CREATE INDEX idx_pesanan_pelanggan ON pesanan (pelanggan_id);
--   SEARCH USING INDEX → langsung ke baris terkait (~1 ms)`,
      explain: [
        'Perbedaan waktu bisa ribuan kali pada tabel besar.',
        'Index memberi manfaat paling besar pada kolom dengan banyak nilai berbeda (mis. id pelanggan).',
        'Kolom dengan sedikit nilai berbeda (mis. jenis_kelamin) kurang cocok diberi index tunggal.'
      ]
    },
    {
      type: 'tip',
      title: 'Optimasi tanpa index',
      text: 'Beberapa trik mudah: (1) sebut hanya kolom yang dibutuhkan ketimbang <code>SELECT *</code>; (2) hindari membungkus kolom yang di-index dengan fungsi, mis. <code>WHERE YEAR(tanggal) = 2024</code> — tulis rentang tanggal agar index terpakai; (3) saring sebanyak mungkin lebih awal.'
    },
    {
      type: 'vocab',
      items: [
        ['Index', 'Struktur bantu yang mempercepat pencarian data.'],
        ['CREATE INDEX', 'Perintah membuat index.'],
        ['Unique index', 'Index yang sekaligus menjamin nilai unik.'],
        ['Composite index', 'Index atas dua kolom atau lebih.'],
        ['EXPLAIN', 'Perintah untuk melihat rencana eksekusi query.'],
        ['Full scan', 'Database membaca seluruh tabel tanpa index.']
      ]
    },
    {
      type: 'warn',
      title: 'Index ada harganya',
      text: 'Index mempercepat pembacaan, tetapi memperlambat <b>penulisan</b> (INSERT/UPDATE/DELETE) dan memakan ruang penyimpanan, karena setiap perubahan data harus memperbarui index juga. Jangan membuat index untuk semua kolom — cukup yang sering dipakai di WHERE, JOIN, dan ORDER BY.'
    }
  ],
  recap: [
    'Index mempercepat pencarian seperti indeks buku.',
    'CREATE INDEX membuat index; unique index menjamin keunikan.',
    'EXPLAIN menunjukkan apakah database memakai index atau full scan.',
    'Index mempercepat baca tetapi memperlambat tulis dan memakan ruang.'
  ]
});

/* ---------- Pelajaran 14: Stored Procedures & Functions ---------- */
window.SQL_LESSONS.push({
  id: 'stored-procedures-functions',
  title: 'Stored Procedures & Functions',
  chapter: 'Performa & Otomatisasi',
  duration: '12 menit',
  intro: [
    'Kalau sebuah urutan perintah SQL dipakai berulang-ulang oleh banyak aplikasi, menuliskannya di setiap tempat membuatnya rawan berbeda dan sulit dirawat.',
    '<b>Stored procedure</b> dan <b>function</b> memungkinkan kita menyimpan logika SQL di dalam database, lalu memanggilnya kapan saja.'
  ],
  objectives: [
    'Memahami apa itu stored procedure',
    'Membuat dan memanggil procedure',
    'Memahami apa itu stored function dan bedanya dengan procedure',
    'Mengenal parameter dan nilai kembalian'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Stored procedure</b> adalah kumpulan perintah SQL yang disimpan di database dengan sebuah nama. Aplikasi tinggal memanggil nama itu tanpa mengirim ulang seluruh perintah. Manfaatnya: <b>dipakai bersama</b> oleh banyak aplikasi, <b>konsisten</b>, dan bisa mengurangi lalu lintas data antara aplikasi dan database.</p>'
    },
    {
      type: 'example',
      title: 'Membuat stored procedure',
      lang: 'sql',
      output: false,
      code: `CREATE PROCEDURE naikkan_gaji_dept (
  IN p_departemen_id INTEGER,
  IN p_persen        DECIMAL(5,2)
)
BEGIN
  UPDATE karyawan
  SET gaji = gaji + (gaji * p_persen / 100)
  WHERE departemen_id = p_departemen_id;
END;

-- Memanggil procedure dengan parameter
CALL naikkan_gaji_dept(1, 10);  -- naikkan gaji dept 1 sebesar 10%`,
      explain: [
        '<code>IN p_departemen_id</code> adalah parameter masukan.',
        'Isi procedure dibungkus <code>BEGIN ... END</code>.',
        '<code>CALL</code> menjalankan procedure beserta nilai parameternya.',
        'Penulisan persisnya berbeda antar database (mis. ada yang butuh <code>DELIMITER</code>).'
      ]
    },
    {
      type: 'example',
      title: 'Procedure dengan keluaran (OUT)',
      lang: 'sql',
      output: false,
      code: `CREATE PROCEDURE hitung_karyawan_dept (
  IN  p_departemen_id INTEGER,
  OUT p_jumlah        INTEGER
)
BEGIN
  SELECT COUNT(*) INTO p_jumlah
  FROM karyawan
  WHERE departemen_id = p_departemen_id;
END;

CALL hitung_karyawan_dept(1, @total);
SELECT @total;   -- 3`,
      explain: [
        'Parameter <code>OUT</code> dipakai untuk mengembalikan nilai lewat variabel.',
        '<code>INTO p_jumlah</code> menyimpan hasil SELECT ke parameter keluaran.',
        'Aplikasi bisa membaca <code>@total</code> setelah procedure selesai.'
      ]
    },
    {
      type: 'example',
      title: 'Stored function',
      lang: 'sql',
      output: false,
      code: `CREATE FUNCTION gaji_setelah_pajak (gaji DECIMAL(12,2))
RETURNS DECIMAL(12,2)
BEGIN
  RETURN gaji * 0.95;   -- potong pajak 5%
END;

-- Function dipakai langsung di dalam SELECT
SELECT nama, gaji, gaji_setelah_pajak(gaji) AS gaji_bersih
FROM karyawan;`,
      explain: [
        '<b>Function</b> <i>wajib</i> mengembalikan nilai (<code>RETURNS ...</code>), sedangkan procedure tidak harus.',
        'Function bisa dipanggil di dalam query SELECT.',
        'Procedure dipanggil dengan <code>CALL</code>, tidak bisa disisipkan ke dalam SELECT.'
      ]
    },
    {
      type: 'text',
      html: '<p>Ringkasnya perbedaan keduanya:</p><table class="vocab"><tr><th>Stored Procedure</th><th>Stored Function</th></tr><tr><td>Dipanggil dengan CALL</td><td>Dipakai di dalam query SELECT</td></tr><tr><td>Boleh tidak mengembalikan nilai</td><td>Wajib mengembalikan satu nilai</td></tr><tr><td>Boleh mengubah data (INSERT/UPDATE/DELETE)</td><td>Umumnya hanya membaca, tidak mengubah data</td></tr><tr><td>Bisa punya parameter IN/OUT</td><td>Umumnya hanya parameter masukan</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Kapan memakai procedure?',
      text: 'Cocok untuk proses yang melibatkan banyak langkah SQL dan dipakai dari beberapa aplikasi, mis. perhitungan laporan bulanan atau proses impor data. Untuk logika bisnis yang kompleks dan sering berubah, banyak tim justru memilih menaruhnya di aplikasi agar lebih mudah diuji.'
    },
    {
      type: 'warn',
      title: 'Perbedaan antar database cukup besar',
      text: 'Sintaks stored procedure paling beragam di antara fitur SQL. MySQL, PostgreSQL (PL/pgSQL), SQL Server (T-SQL), dan Oracle (PL/SQL) punya aturan berbeda. Di SQLite, procedure tidak tersedia seperti di database server. Selalu sesuaikan dengan RDBMS yang kamu pakai.'
    }
  ],
  recap: [
    'Stored procedure menyimpan banyak perintah SQL di database dan dipanggil dengan CALL.',
    'Procedure bisa punya parameter IN dan OUT.',
    'Stored function wajib mengembalikan nilai dan bisa dipakai di dalam SELECT.',
    'Sintaks procedure berbeda-beda antar database.'
  ]
});
