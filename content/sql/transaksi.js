/* ============================================================
   Pelajaran SQL — Bab 7: Trigger & Transaksi
   (topik info.md:
    - "database triggers"
    - "manajemen transaksi (ACID, COMMIT, ROLLBACK, LOCKING)")
   ============================================================ */
'use strict';

window.SQL_LESSONS = window.SQL_LESSONS || [];

/* ---------- Pelajaran 15: Trigger ---------- */
window.SQL_LESSONS.push({
  id: 'database-triggers',
  title: 'Database Triggers',
  chapter: 'Transaksi & Trigger',
  duration: '10 menit',
  intro: [
    'Beberapa pekerjaan sebaiknya terjadi otomatis: setiap kali ada karyawan baru, catat di tabel riwayat; setiap kali stok berkurang, periksa apakah masih cukup.',
    '<b>Trigger</b> adalah blok kode yang dijalankan <b>otomatis</b> oleh database saat terjadi peristiwa tertentu pada sebuah tabel.'
  ],
  objectives: [
    'Memahami apa itu trigger dan kapan dijalankan',
    'Mengenal BEFORE vs AFTER, serta INSERT/UPDATE/DELETE',
    'Membuat trigger sederhana',
    'Mengetahui kapan sebaiknya trigger dihindari'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Trigger</b> menempel pada sebuah tabel dan dipicu oleh tiga hal: <b>peristiwa</b> (INSERT, UPDATE, DELETE), <b>waktu</b> (BEFORE atau AFTER), dan <b>baris</b> (untuk tiap baris yang berubah). Trigger dipakai untuk menjaga aturan otomatis, mencatat riwayat, atau menyinkronkan tabel.</p>'
    },
    {
      type: 'example',
      title: 'Trigger mencatat riwayat perubahan gaji',
      lang: 'sql',
      output: false,
      code: `-- Tabel khusus untuk menyimpan jejak perubahan
CREATE TABLE riwayat_gaji (
  id           INTEGER PRIMARY KEY,
  karyawan_id  INTEGER,
  gaji_lama    DECIMAL(12,2),
  gaji_baru    DECIMAL(12,2),
  waktu        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger: setiap gaji diubah, catat sebelum & sesudahnya
CREATE TRIGGER trg_riwayat_gaji
AFTER UPDATE OF gaji ON karyawan
FOR EACH ROW
BEGIN
  INSERT INTO riwayat_gaji (karyawan_id, gaji_lama, gaji_baru)
  VALUES (OLD.id, OLD.gaji, NEW.gaji);
END;`,
      explain: [
        '<code>AFTER UPDATE OF gaji</code> berarti dipicu setelah kolom gaji diubah.',
        '<code>OLD</code> berisi nilai sebelum perubahan, <code>NEW</code> nilai setelah perubahan.',
        '<code>FOR EACH ROW</code> menjalankan trigger untuk setiap baris yang terpengaruh.'
      ]
    },
    {
      type: 'example',
      title: 'Trigger memvalidasi data',
      lang: 'sql',
      output: false,
      code: `-- Tolak gaji negatif sebelum baris disimpan
CREATE TRIGGER trg_cek_gaji
BEFORE INSERT ON karyawan
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.gaji < 0 THEN RAISE(ABORT, 'Gaji tidak boleh negatif')
  END;
END;`,
      explain: [
        'Trigger <code>BEFORE</code> berjalan sebelum data ditulis, sehingga bisa mencegah penyimpanan.',
        'Contoh memakai SQLite; database lain memakai mekanisme berbeda (mis. <code>SIGNAL</code> di MySQL).',
        'Ini semacam "penjaga" yang bekerja walau aplikasi lupa memvalidasi.'
      ]
    },
    {
      type: 'example',
      title: 'Melihat dan menghapus trigger',
      lang: 'sql',
      output: false,
      code: `-- Hapus trigger
DROP TRIGGER trg_riwayat_gaji;

-- Sebagian database menyediakan daftar trigger:
SELECT name FROM sqlite_master WHERE type = 'trigger';`,
      explain: [
        '<code>DROP TRIGGER</code> menghapus trigger tanpa menghapus tabelnya.',
        'Cara melihat daftar trigger berbeda-beda antar database.'
      ]
    },
    {
      type: 'tip',
      title: 'Trigger untuk audit',
      text: 'Pemakaian trigger yang paling aman dan berguna adalah <b>audit log</b>: mencatat siapa mengubah apa dan kapan. Karena berjalan di database, catatan ini tetap lengkap meski perubahan dilakukan dari aplikasi berbeda.'
    },
    {
      type: 'vocab',
      items: [
        ['Trigger', 'Kode yang otomatis dijalankan saat ada peristiwa pada tabel.'],
        ['BEFORE / AFTER', 'Waktu trigger berjalan — sebelum atau sesudah perubahan.'],
        ['OLD / NEW', 'Nilai baris sebelum dan sesudah perubahan.'],
        ['FOR EACH ROW', 'Menjalankan trigger untuk tiap baris yang terpengaruh.'],
        ['Audit log', 'Catatan riwayat perubahan untuk keperluan pengawasan.']
      ]
    },
    {
      type: 'warn',
      title: 'Trigger bisa menyulitkan',
      text: 'Logika yang tersembunyi di trigger sering membuat bug sulit dilacak: data berubah "sendiri" tanpa terlihat di kode aplikasi. Trigger juga bisa saling memicu (trigger A mengubah tabel yang memicu trigger B). Gunakan seperlunya, dan dokumentasikan dengan jelas.'
    }
  ],
  recap: [
    'Trigger berjalan otomatis saat ada INSERT, UPDATE, atau DELETE pada tabel.',
    'BEFORE berjalan sebelum perubahan, AFTER sesudahnya.',
    'OLD dan NEW memberi akses nilai sebelum dan sesudah perubahan.',
    'Gunakan trigger untuk audit atau aturan wajib, tapi hati-hati efek tersembunyinya.'
  ]
});

/* ---------- Pelajaran 16: Manajemen Transaksi ---------- */
window.SQL_LESSONS.push({
  id: 'manajemen-transaksi',
  title: 'Manajemen Transaksi: ACID, COMMIT, ROLLBACK',
  chapter: 'Transaksi & Trigger',
  duration: '13 menit',
  intro: [
    'Bayangkan transfer uang: saldo A berkurang, lalu saldo B bertambah. Kalau aplikasi mati di tengah proses, uang bisa "hilang". Database harus menjamin dua langkah itu berhasil bersama atau gagal bersama.',
    'Jaminan itulah yang diberikan oleh <b>transaksi</b>, dengan sifat <b>ACID</b> dan perintah <b>COMMIT</b>, <b>ROLLBACK</b>, serta <b>LOCKING</b>.'
  ],
  objectives: [
    'Memahami konsep transaksi dan sifat ACID',
    'Memakai BEGIN, COMMIT, dan ROLLBACK',
    'Menggunakan SAVEPOINT untuk membatalkan sebagian',
    'Memahami dasar locking dan konflik antar transaksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Transaksi</b> adalah satu paket pekerjaan yang diperlakukan sebagai <b>satu kesatuan</b>: entah semuanya berhasil, entah semuanya dibatalkan. Jaminan ini dijelaskan oleh empat sifat <b>ACID</b>.</p>'
    },
    {
      type: 'text',
      html: '<table class="vocab"><tr><th>Sifat</th><th>Arti</th><th>Contoh</th></tr><tr><td><b>A</b>tomicity</td><td>Semua langkah berhasil atau semua dibatalkan</td><td>Transfer: potong & tambah harus bersama</td></tr><tr><td><b>C</b>onsistency</td><td>Data selalu memenuhi aturan/constraint</td><td>Total saldo tidak berkurang walau aplikasi error</td></tr><tr><td><b>I</b>solation</td><td>Transaksi berjalan tidak saling mengganggu</td><td>Dua transfer bersamaan tidak saling menimpa</td></tr><tr><td><b>D</b>urability</td><td>Perubahan yang sudah commit bertahan permanen</td><td>Setelah commit, mati listrik pun data tetap ada</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Alur transaksi: BEGIN, COMMIT, ROLLBACK',
      lang: 'sql',
      output: false,
      code: `-- Memulai transaksi
BEGIN TRANSACTION;

-- Langkah 1: potong saldo pengirim
UPDATE rekening
SET saldo = saldo - 1000000
WHERE id = 1;

-- Langkah 2: tambah saldo penerima
UPDATE rekening
SET saldo = saldo + 1000000
WHERE id = 2;

-- Kalau kedua langkah sukses, simpan permanen:
COMMIT;

-- Kalau ada langkah gagal, batalkan SEMUA perubahan:
-- ROLLBACK;`,
      explain: [
        '<code>BEGIN TRANSACTION</code> menandai awal paket.',
        '<code>COMMIT</code> menyimpan semua perubahan secara permanen.',
        '<code>ROLLBACK</code> membatalkan seluruh perubahan dalam transaksi — seolah tidak pernah terjadi.'
      ]
    },
    {
      type: 'example',
      title: 'Membatalkan sebagian dengan SAVEPOINT',
      lang: 'sql',
      output: false,
      code: `BEGIN TRANSACTION;

INSERT INTO pesanan (id, pelanggan_id, total) VALUES (101, 7, 250000);
SAVEPOINT setelah_pesanan;

-- Ternyata stok tidak cukup, batalkan hanya langkah berikut:
UPDATE stok SET jumlah = jumlah - 1 WHERE produk_id = 5;
ROLLBACK TO SAVEPOINT setelah_pesanan;  -- langkah UPDATE dibatalkan

-- Pesanan tetap bisa dilanjutkan / disimpan
COMMIT;`,
      explain: [
        '<code>SAVEPOINT nama</code> membuat titik penanda di tengah transaksi.',
        '<code>ROLLBACK TO SAVEPOINT nama</code> membatalkan hanya bagian setelah titik itu.',
        'Transaksi tetap aktif dan bisa diteruskan sampai COMMIT.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh gagal: batalkan semua',
      lang: 'sql',
      output: false,
      code: `BEGIN TRANSACTION;

UPDATE rekening SET saldo = saldo - 1000000 WHERE id = 1;
-- Langkah berikutnya ternyata error (mis. akun tujuan tidak ada)

ROLLBACK;   -- saldo pengirim kembali seperti semula

-- Bila tanpa transaksi: saldo sudah terpotong padahal uang tak sampai.`,
      explain: [
        'Tanpa transaksi, perubahan yang sudah terjadi tetap tersimpan walau langkah lain gagal.',
        'ROLLBACK "mengembalikan waktu" ke keadaan sebelum BEGIN.',
        'Inilah sebabnya operasi keuangan selalu dibungkus transaksi.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Locking</b> adalah mekanisme penguncian agar dua transaksi tidak mengubah baris yang sama secara bersamaan dan saling merusak. Sementara satu transaksi mengunci sebuah baris, transaksi lain harus menunggu sampai transaksi pertama selesai (commit/rollback).</p>'
    },
    {
      type: 'tip',
      title: 'Aturan transaksi singkat',
      text: 'Buat transaksi sesingkat mungkin: buka <code>BEGIN</code>, kerjakan perubahannya, lalu segera <code>COMMIT</code>. Transaksi yang dibiarkan terbuka lama akan menahan lock dan menghambat transaksi lain.'
    },
    {
      type: 'vocab',
      items: [
        ['Transaksi', 'Sekumpulan operasi yang diperlakukan sebagai satu kesatuan.'],
        ['ACID', 'Atomicity, Consistency, Isolation, Durability — sifat transaksi.'],
        ['COMMIT', 'Menyimpan semua perubahan transaksi secara permanen.'],
        ['ROLLBACK', 'Membatalkan seluruh perubahan transaksi.'],
        ['SAVEPOINT', 'Titik penanda untuk membatalkan sebagian transaksi.'],
        ['Locking', 'Penguncian baris/tabel agar transaksi tidak saling bentrok.']
      ]
    },
    {
      type: 'warn',
      title: 'Perubahan tergantung autocommit',
      text: 'Banyak RDBMS berjalan dalam mode <b>autocommit</b>: setiap perintah langsung tersimpan tanpa perlu COMMIT. Begitu kamu menulis <code>BEGIN</code>, mode itu berhenti sementara sampai kamu COMMIT atau ROLLBACK. Jadi jangan lupa menutup transaksi!'
    }
  ],
  recap: [
    'Transaksi memperlakukan banyak perintah sebagai satu kesatuan: semua berhasil atau semua batal.',
    'Sifat ACID: Atomicity, Consistency, Isolation, Durability.',
    'COMMIT menyimpan permanen; ROLLBACK membatalkan seluruh transaksi.',
    'SAVEPOINT memungkinkan pembatalan sebagian; LOCKING mencegah bentrok antar transaksi.'
  ]
});
