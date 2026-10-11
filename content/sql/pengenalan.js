/* ============================================================
   Pelajaran SQL — Bab 1: Pengenalan
   (topik info.md:
    - "pengenalan RDBMS dan konsep database relasional")
   ============================================================ */
'use strict';

window.SQL_LESSONS = window.SQL_LESSONS || [];

/* ---------- Pelajaran 1: RDBMS & Database Relasional ---------- */
window.SQL_LESSONS.push({
  id: 'pengenalan-rdbms',
  title: 'Pengenalan RDBMS & Database Relasional',
  chapter: 'Pendahuluan',
  duration: '10 menit',
  intro: [
    'Bayangkan buku catatan toko yang isinya daftar barang, daftar pelanggan, dan daftar penjualan. Kalau datanya sedikit, catatan biasa sudah cukup. Tapi begitu jumlahnya ribuan dan saling berhubungan, kita butuh alat yang rapi: <b>database</b>.',
    'Pelajaran ini menjelaskan apa itu database, apa itu <b>RDBMS</b>, dan konsep dasar <b>database relasional</b> yang menjadi fondasi seluruh materi SQL berikutnya.'
  ],
  objectives: [
    'Memahami apa itu database dan RDBMS',
    'Mengenal istilah tabel, baris, kolom, primary key, dan foreign key',
    'Memahami bagaimana tabel saling berhubungan (relasi)',
    'Mengenal kelompok perintah SQL: DDL, DML, DQL, dan DCL'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Database</b> adalah kumpulan data yang terorganisir dan tersimpan secara elektronik sehingga mudah dicari, diubah, dan diolah. <b>RDBMS</b> (Relational Database Management System) adalah perangkat lunak yang mengelola database relasional — ia yang menerima perintah SQL lalu mengambil atau mengubah data di dalamnya.</p><p>Contoh RDBMS populer: <b>SQLite</b>, <b>MySQL</b>, <b>PostgreSQL</b>, <b>Microsoft SQL Server</b>, dan <b>Oracle</b>. Aplikasi tutorial ini sendiri menyimpan datanya di SQLite.</p>'
    },
    {
      type: 'text',
      html: '<p>Kata <b>relasional</b> berarti data disimpan dalam bentuk <b>tabel</b> yang bisa saling berhubungan. Sebuah database biasanya terdiri dari beberapa tabel. Setiap tabel mirip lembar kerja (spreadsheet) dengan struktur yang tetap:</p><table class="vocab"><tr><th>Istilah</th><th>Padanan di Spreadsheet</th></tr><tr><td><b>Tabel</b> (table)</td><td>Satu lembar kerja</td></tr><tr><td><b>Kolom</b> (column/field)</td><td>Judul kolom (mis. Nama, Gaji)</td></tr><tr><td><b>Baris</b> (row/record)</td><td>Satu baris data, mis. satu karyawan</td></tr><tr><td><b>Tipe data</b></td><td>Jenis isi kolom: angka, teks, tanggal</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Contoh tabel karyawan',
      lang: 'text',
      output: false,
      code: `Tabel: karyawan
+----+-------+-----------+----------+
| id | nama  | jabatan   | gaji     |
+----+-------+-----------+----------+
|  1 | Andi  | Teknisi   |  5000000 |
|  2 | Budi  | Manajer   |  9000000 |
|  3 | Citra | Staf      |  4000000 |
+----+-------+-----------+----------+

Kolom : id, nama, jabatan, gaji
Baris : (1, Andi, Teknisi, 5000000), dst.`,
      explain: [
        'Tabel bernama <code>karyawan</code> punya 4 kolom dan 3 baris data.',
        'Setiap kolom menyimpan satu jenis informasi yang sejenis.',
        'Satu baris mewakili satu objek nyata — di sini, satu karyawan.'
      ]
    },
    {
      type: 'text',
      html: '<p>Supaya tiap baris bisa dibedakan dan dihubungkan, kita memakai dua jenis kunci:</p><ul><li><b>Primary Key</b> (kunci utama) — kolom yang nilainya <b>unik</b> untuk setiap baris dan tidak boleh kosong. Kolom <code>id</code> di atas adalah primary key.</li><li><b>Foreign Key</b> (kunci asing) — kolom yang menunjuk ke primary key di <b>tabel lain</b>, sehingga terbentuk hubungan antar tabel.</li></ul>'
    },
    {
      type: 'example',
      title: 'Dua tabel yang saling berhubungan',
      lang: 'text',
      output: false,
      code: `Tabel: departemen                 Tabel: karyawan
+----+------------+              +----+-------+-------------+
| id | nama       |              | id | nama  | departemen_id|
+----+------------+              +----+-------+-------------+
|  1 | Teknologi  |              |  1 | Andi  |       1      |
|  2 | Pemasaran  |              |  3 | Citra |       2      |
+----+------------+              +----+-------+-------------+

karyawan.departemen_id  ->  departemen.id   (foreign key)`,
      explain: [
        '<code>departemen.id</code> adalah primary key tabel departemen.',
        '<code>karyawan.departemen_id</code> adalah foreign key yang menunjuk ke sana.',
        'Dari sini kita tahu Andi bekerja di departemen Teknologi, Citra di Pemasaran — tanpa menulis nama departemen berulang-ulang.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenapa tabel dipisah-pisah?',
      text: 'Kalau nama departemen ditulis ulang di setiap baris karyawan, kata "Teknologi" bisa salah ketik jadi "Teknlogi" dan data menjadi tidak konsisten. Dengan memisahkan tabel dan menghubungkannya lewat kunci, setiap fakta hanya disimpan <b>sekali</b>. Prinsip ini disebut <b>normalisasi</b>.'
    },
    {
      type: 'text',
      html: '<p>Perintah SQL yang akan kita pelajari sepanjang tutorial ini terbagi menjadi beberapa kelompok:</p><table class="vocab"><tr><th>Kelompok</th><th>Kepanjangan</th><th>Contoh Perintah</th></tr><tr><td><b>DDL</b></td><td>Data Definition Language</td><td>CREATE, ALTER, DROP, TRUNCATE</td></tr><tr><td><b>DML</b></td><td>Data Manipulation Language</td><td>INSERT, UPDATE, DELETE</td></tr><tr><td><b>DQL</b></td><td>Data Query Language</td><td>SELECT</td></tr><tr><td><b>DCL</b></td><td>Data Control Language</td><td>GRANT, REVOKE</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Membaca data pertama dengan SQL',
      lang: 'sql',
      output: false,
      code: `-- Ambil semua kolom dari tabel karyawan
SELECT * FROM karyawan;

-- Hasil:
-- id | nama  | jabatan | gaji
--  1 | Andi  | Teknisi | 5000000
--  2 | Budi  | Manajer | 9000000
--  3 | Citra | Staf    | 4000000`,
      explain: [
        '<code>SELECT</code> artinya "ambil data", tanda <code>*</code> berarti "semua kolom".',
        '<code>FROM karyawan</code> memberi tahu tabel mana yang dibaca.',
        'Tanda <code>--</code> di awal baris adalah komentar: diabaikan oleh database.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Database', 'Kumpulan data terorganisir yang tersimpan secara elektronik.'],
        ['RDBMS', 'Perangkat lunak pengelola database relasional, mis. MySQL, PostgreSQL, SQLite.'],
        ['Tabel', 'Struktur penyimpanan data berbentuk baris dan kolom.'],
        ['Baris (row)', 'Satu catatan/data dalam tabel.'],
        ['Kolom (column)', 'Satu jenis informasi dalam tabel, mis. nama.'],
        ['Primary Key', 'Kolom penanda unik tiap baris.'],
        ['Foreign Key', 'Kolom yang menunjuk ke primary key tabel lain.'],
        ['SQL', 'Structured Query Language — bahasa untuk berbicara dengan database.']
      ]
    },
    {
      type: 'warn',
      title: 'SQL bukan nama database',
      text: 'SQL adalah <b>bahasa</b>, bukan merek. MySQL, PostgreSQL, dan SQLite adalah <b>RDBMS</b> yang sama-sama bisa memahami SQL, meski ada sedikit perbedaan dialek. Jadi belajar SQL berarti belajar bahasa yang berlaku di banyak database sekaligus.'
    }
  ],
  recap: [
    'Database adalah kumpulan data terorganisir; RDBMS adalah perangkat lunak yang mengelolanya.',
    'Data relasional disimpan dalam tabel berisi baris dan kolom.',
    'Primary key menandai baris secara unik; foreign key menghubungkan antar tabel.',
    'Perintah SQL dikelompokkan menjadi DDL, DML, DQL, dan DCL.'
  ]
});
