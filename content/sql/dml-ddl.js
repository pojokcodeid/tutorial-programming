/* ============================================================
   Pelajaran SQL — Bab 3: Manipulasi & Definisi Data
   (topik info.md:
    - "manipulasi data / DML (INSERT, UPDATE, DELETE)"
    - "definisi data / DDL (CREATE, ALTER, DROP, TRUNCATE)")
   ============================================================ */
'use strict';

window.SQL_LESSONS = window.SQL_LESSONS || [];

/* ---------- Pelajaran 6: DML ---------- */
window.SQL_LESSONS.push({
  id: 'dml-insert-update-delete',
  title: 'Manipulasi Data (DML): INSERT, UPDATE, DELETE',
  chapter: 'Manipulasi Data',
  duration: '11 menit',
  intro: [
    'Sampai sekarang kita hanya <b>membaca</b> data. Dunia nyata tentu butuh menambah, mengubah, dan menghapus data — misalnya saat ada pelanggan baru atau produk yang sudah tidak dijual.',
    'Tiga perintah itu adalah <b>INSERT</b>, <b>UPDATE</b>, dan <b>DELETE</b>, yang bersama-sama disebut DML.'
  ],
  objectives: [
    'Menambah baris baru dengan INSERT',
    'Mengubah data dengan UPDATE',
    'Menghapus data dengan DELETE',
    'Memahami bahaya lupa WHERE pada UPDATE dan DELETE'
  ],
  sections: [
    {
      type: 'example',
      title: 'Menambah satu baris dengan INSERT',
      lang: 'sql',
      output: false,
      code: `INSERT INTO karyawan (id, nama, jabatan, gaji, departemen_id, tanggal_masuk)
VALUES (8, 'Hana', 'Staf', 4200000, 2, '2024-01-10');

-- Setelah perintah ini, tabel bertambah satu baris:
-- 8 | Hana | Staf | 4200000 | 2 | 2024-01-10`,
      explain: [
        'Daftar kolom ditulis dalam tanda kurung setelah nama tabel.',
        '<code>VALUES</code> berisi nilai untuk tiap kolom, urutannya harus sama dengan daftar kolom.',
        'Teks dan tanggal diapit tanda kutip tunggal, angka tidak perlu.'
      ]
    },
    {
      type: 'example',
      title: 'Menambah beberapa baris sekaligus',
      lang: 'sql',
      output: false,
      code: `INSERT INTO departemen (id, nama)
VALUES
  (4, 'Gudang'),
  (5, 'Riset'),
  (6, 'Hukum');`,
      explain: [
        'Cukup satu <code>INSERT</code> dengan beberapa kelompok <code>VALUES</code> yang dipisah koma.',
        'Jauh lebih cepat daripada menulis tiga perintah INSERT terpisah.'
      ]
    },
    {
      type: 'example',
      title: 'Mengubah data dengan UPDATE',
      lang: 'sql',
      output: false,
      code: `-- Naikkan gaji Andi menjadi 6.000.000
UPDATE karyawan
SET gaji = 6000000
WHERE id = 1;

-- Ubah dua kolom sekaligus untuk manajer
UPDATE karyawan
SET jabatan = 'Manajer Senior', gaji = gaji + 500000
WHERE jabatan = 'Manajer';`,
      explain: [
        '<code>SET</code> menentukan kolom mana yang diubah dan nilai barunya.',
        'Bisa memakai perhitungan, mis. <code>gaji = gaji + 500000</code>.',
        '<b>WHERE</b> menentukan baris mana yang diubah. Ini bagian paling penting.'
      ]
    },
    {
      type: 'example',
      title: 'Menghapus data dengan DELETE',
      lang: 'sql',
      output: false,
      code: `-- Hapus satu karyawan
DELETE FROM karyawan
WHERE id = 8;

-- Hapus semua karyawan tanpa departemen
DELETE FROM karyawan
WHERE departemen_id IS NULL;`,
      explain: [
        '<code>DELETE FROM tabel</code> menghapus baris.',
        'Selalu tulis <code>WHERE</code> agar tidak menghapus seluruh isi tabel.',
        'Struktur tabel tetap ada; hanya barisnya hilang.'
      ]
    },
    {
      type: 'warn',
      title: 'UPDATE / DELETE tanpa WHERE = bencana',
      text: '<code>UPDATE karyawan SET gaji = 0;</code> akan mengubah <b>seluruh</b> karyawan. <code>DELETE FROM karyawan;</code> akan mengosongkan seluruh tabel. Kebiasaan aman: tulis dulu <code>SELECT</code> dengan WHERE yang sama untuk memastikan barisnya benar, baru ganti menjadi UPDATE/DELETE.'
    },
    {
      type: 'example',
      title: 'Cara aman mengubah data',
      lang: 'sql',
      output: false,
      code: `-- Langkah 1: cek dulu baris yang akan terdampak
SELECT * FROM karyawan WHERE jabatan = 'Manajer';

-- Langkah 2: setelah yakin, baru jalankan perubahan
UPDATE karyawan SET gaji = 10000000 WHERE jabatan = 'Manajer';`,
      explain: [
        'Uji syarat dengan SELECT lebih dulu.',
        'Jika hasil SELECT sudah sesuai harapan, barulah ubah menjadi perintah UPDATE atau DELETE.',
        'Kebiasaan ini menyelamatkan banyak data (dan karier programmer).'
      ]
    },
    {
      type: 'tip',
      title: 'Mengambil nilai yang baru ditambahkan',
      text: 'Sebagian database menyediakan <code>RETURNING *</code> di akhir <code>INSERT</code>/<code>UPDATE</code>/<code>DELETE</code> (PostgreSQL, SQLite 3.35+), atau <code>LAST_INSERT_ID()</code> (MySQL) untuk mengetahui id yang baru dibuat.'
    },
    {
      type: 'vocab',
      items: [
        ['INSERT', 'Menambah baris baru ke tabel.'],
        ['UPDATE', 'Mengubah nilai pada baris yang sudah ada.'],
        ['DELETE', 'Menghapus baris dari tabel.'],
        ['VALUES', 'Daftar nilai yang akan dimasukkan.'],
        ['DML', 'Data Manipulation Language — perintah yang mengubah isi data.']
      ]
    }
  ],
  recap: [
    'INSERT menambah, UPDATE mengubah, DELETE menghapus baris.',
    'INSERT bisa menambah banyak baris sekaligus.',
    'UPDATE memakai SET dan (sebaiknya) selalu disertai WHERE.',
    'Selalu uji syarat WHERE dengan SELECT sebelum UPDATE/DELETE.'
  ]
});

/* ---------- Pelajaran 7: DDL ---------- */
window.SQL_LESSONS.push({
  id: 'ddl-create-alter-drop',
  title: 'Definisi Data (DDL): CREATE, ALTER, DROP, TRUNCATE',
  chapter: 'Manipulasi Data',
  duration: '12 menit',
  intro: [
    'Sebelum ada data, harus ada wadahnya dulu: tabel. Perintah yang mengurus <b>struktur</b> database disebut <b>DDL</b> (Data Definition Language).',
    'Pelajaran ini membahas membuat tabel (<b>CREATE</b>), mengubah strukturnya (<b>ALTER</b>), serta menghapus tabel (<b>DROP</b>) dan isinya (<b>TRUNCATE</b>).'
  ],
  objectives: [
    'Membuat tabel dengan CREATE TABLE',
    'Mengenal tipe data umum',
    'Menambahkan aturan kolom (constraints)',
    'Mengubah struktur tabel dengan ALTER TABLE',
    'Membedakan DROP dan TRUNCATE'
  ],
  sections: [
    {
      type: 'example',
      title: 'Membuat tabel dengan CREATE TABLE',
      lang: 'sql',
      output: false,
      code: `CREATE TABLE departemen (
  id   INTEGER PRIMARY KEY,
  nama VARCHAR(50) NOT NULL
);

CREATE TABLE karyawan (
  id            INTEGER PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  jabatan       VARCHAR(50),
  gaji          DECIMAL(12,2) DEFAULT 0,
  departemen_id INTEGER,
  tanggal_masuk DATE,
  FOREIGN KEY (departemen_id) REFERENCES departemen(id)
);`,
      explain: [
        'Setiap kolom ditulis dengan nama, tipe data, lalu aturan tambahan.',
        '<code>PRIMARY KEY</code> menandai kolom sebagai kunci utama.',
        '<code>FOREIGN KEY ... REFERENCES</code> menghubungkan kolom ke tabel lain.'
      ]
    },
    {
      type: 'text',
      html: '<p>Berikut tipe data yang paling sering dipakai. Nama tipe bisa sedikit berbeda antar database.</p><table class="vocab"><tr><th>Tipe</th><th>Isi</th><th>Contoh Nilai</th></tr><tr><td><b>INTEGER / INT</b></td><td>Bilangan bulat</td><td>1, 42, -7</td></tr><tr><td><b>DECIMAL / NUMERIC</b></td><td>Bilangan desimal presisi</td><td>5000000.50</td></tr><tr><td><b>REAL / FLOAT</b></td><td>Bilangan pecahan</td><td>3.14</td></tr><tr><td><b>VARCHAR(n)</b></td><td>Teks maksimal n karakter</td><td>Andi, Teknisi</td></tr><tr><td><b>TEXT</b></td><td>Teks panjang</td><td>Deskripsi produk</td></tr><tr><td><b>DATE / TIMESTAMP</b></td><td>Tanggal / tanggal + jam</td><td>2024-01-10</td></tr><tr><td><b>BOOLEAN</b></td><td>Benar/salah</td><td>true, false</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Aturan kolom (constraints)',
      lang: 'sql',
      output: false,
      code: `CREATE TABLE produk (
  id      INTEGER PRIMARY KEY,
  kode    VARCHAR(20) UNIQUE NOT NULL,     -- tidak boleh kosong & unik
  nama    VARCHAR(100) NOT NULL,
  harga   DECIMAL(12,2) CHECK (harga >= 0),-- tidak boleh negatif
  stok    INTEGER DEFAULT 0,               -- nilai bawaan 0
  aktif   BOOLEAN DEFAULT 1
);`,
      explain: [
        '<code>NOT NULL</code> memaksa kolom harus diisi.',
        '<code>UNIQUE</code> memastikan nilainya tidak ada yang sama.',
        '<code>DEFAULT</code> memberi nilai otomatis bila tidak diisi.',
        '<code>CHECK (...)</code> membatasi nilai, mis. harga tidak boleh negatif.'
      ]
    },
    {
      type: 'example',
      title: 'Mengubah struktur dengan ALTER TABLE',
      lang: 'sql',
      output: false,
      code: `-- Tambah kolom baru
ALTER TABLE karyawan ADD COLUMN email VARCHAR(100);

-- Ubah tipe data sebuah kolom (dialek berbeda-beda)
ALTER TABLE karyawan ALTER COLUMN gaji DECIMAL(14,2);

-- Hapus kolom
ALTER TABLE karyawan DROP COLUMN email;

-- Ganti nama tabel
ALTER TABLE karyawan RENAME TO pegawai;`,
      explain: [
        '<code>ADD COLUMN</code> menambahkan kolom tanpa menghapus data lama.',
        '<code>ALTER COLUMN</code> / <code>MODIFY COLUMN</code> mengubah definisi kolom.',
        '<code>DROP COLUMN</code> menghapus kolom beserta datanya.',
        'Penulisan ALTER berbeda antar database — cek dokumentasi RDBMS yang dipakai.'
      ]
    },
    {
      type: 'example',
      title: 'DROP vs TRUNCATE',
      lang: 'sql',
      output: false,
      code: `-- Menghapus SELURUH data, struktur tabel tetap
TRUNCATE TABLE karyawan;

-- Menghapus data + struktur tabel sekaligus
DROP TABLE karyawan;

-- Hapus seluruh database
DROP DATABASE nama_database;`,
      explain: [
        '<code>TRUNCATE</code> mengosongkan tabel dengan cepat, tetapi tabel & kolomnya masih ada.',
        '<code>DROP TABLE</code> menghapus tabel sekaligus strukturnya — tidak bisa dipulihkan tanpa backup.',
        '<code>DROP DATABASE</code> menghapus semuanya. Berhati-hatilah.'
      ]
    },
    {
      type: 'warn',
      title: 'DDL biasanya tidak bisa dibatalkan',
      text: 'Di banyak database, perintah DDL langsung mengubah struktur secara permanen dan tidak bisa di-<i>rollback</i> seperti DML. Sebelum <code>DROP</code> atau <code>TRUNCATE</code>, pastikan data sudah dicadangkan.'
    },
    {
      type: 'tip',
      title: 'CREATE IF NOT EXISTS',
      text: 'Sebagian database mendukung <code>CREATE TABLE IF NOT EXISTS nama_tabel (...)</code> sehingga perintah aman dijalankan berulang: tabel hanya dibuat jika belum ada. Praktis untuk skrip pembuatan database otomatis.'
    },
    {
      type: 'vocab',
      items: [
        ['DDL', 'Data Definition Language — perintah yang mengatur struktur database.'],
        ['CREATE TABLE', 'Membuat tabel baru.'],
        ['ALTER TABLE', 'Mengubah struktur tabel yang sudah ada.'],
        ['DROP', 'Menghapus objek (tabel/database) beserta strukturnya.'],
        ['TRUNCATE', 'Mengosongkan isi tabel tanpa menghapus strukturnya.'],
        ['Constraint', 'Aturan pada kolom, mis. NOT NULL, UNIQUE, CHECK, FOREIGN KEY.']
      ]
    }
  ],
  recap: [
    'CREATE TABLE membuat tabel; sebutkan nama kolom, tipe data, dan aturannya.',
    'Constraints menjaga kualitas data: NOT NULL, UNIQUE, DEFAULT, CHECK, FOREIGN KEY.',
    'ALTER TABLE mengubah struktur; DROP COLUMN menghapus kolom.',
    'TRUNCATE mengosongkan isi, DROP menghapus tabel sekaligus.'
  ]
});
