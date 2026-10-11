/* ============================================================
   Kumpulan soal kuis SQL — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.SQL_QUIZ_POOL = [
  {
    id: 's01',
    q: 'Apa kepanjangan dari RDBMS?',
    options: ['Relational Database Management System', 'Random Data Backup Management System', 'Relational Data Basic Memory Storage', 'Report Database Mapping Software'],
    answer: 0,
    explain: 'RDBMS adalah Relational Database Management System — perangkat lunak yang mengelola database relasional, mis. MySQL, PostgreSQL, SQLite, SQL Server, dan Oracle.'
  },
  {
    id: 's02',
    q: 'Apa arti sifat "relasional" pada database relasional?',
    options: ['Data disimpan dalam tabel yang dapat saling berhubungan', 'Data hanya boleh berupa angka', 'Data disimpan di internet', 'Data tidak boleh diubah'],
    answer: 0,
    explain: 'Pada database relasional, data disimpan dalam tabel dan antar tabel dapat dihubungkan lewat primary key dan foreign key.'
  },
  {
    id: 's03',
    q: 'Kolom yang nilainya unik dan menjadi penanda setiap baris disebut…',
    options: ['Primary key', 'Foreign key', 'Index', 'View'],
    answer: 0,
    explain: 'Primary key menandai setiap baris secara unik dan tidak boleh kosong. Foreign key adalah kolom yang menunjuk ke primary key tabel lain.'
  },
  {
    id: 's04',
    q: 'Foreign key berfungsi untuk…',
    options: ['Menghubungkan tabel dengan menunjuk ke primary key tabel lain', 'Mengurutkan data secara otomatis', 'Menghapus data duplikat', 'Mengenkripsi kolom'],
    answer: 0,
    explain: 'Foreign key adalah kolom yang menunjuk ke primary key di tabel lain sehingga terbentuk hubungan antar tabel.'
  },
  {
    id: 's05',
    q: 'Perintah yang termasuk kelompok DQL (Data Query Language) adalah…',
    options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    answer: 0,
    explain: 'SELECT termasuk DQL karena hanya membaca data. INSERT, UPDATE, dan DELETE termasuk DML karena mengubah data.'
  },
  {
    id: 's06',
    q: 'Perintah SQL untuk mengambil data dari tabel adalah…',
    options: ['SELECT', 'FETCH', 'GET', 'OPEN'],
    answer: 0,
    explain: 'SELECT dipakai untuk mengambil data. Klausa FROM menyebutkan tabel sumbernya.'
  },
  {
    id: 's07',
    q: 'Tanda bintang (*) pada SELECT * FROM karyawan berarti…',
    options: ['Semua kolom', 'Semua tabel', 'Semua baris diurutkan', 'Satu kolom bernama bintang'],
    answer: 0,
    explain: 'Tanda * berarti mengambil seluruh kolom dari tabel yang disebut setelah FROM.'
  },
  {
    id: 's08',
    q: 'Kegunaan kata kunci AS pada SELECT nama AS pelanggan adalah…',
    options: ['Memberi nama alias pada kolom hasil query', 'Menghapus kolom nama', 'Mengurutkan berdasarkan nama', 'Menggabungkan dua tabel'],
    answer: 0,
    explain: 'AS memberi alias (nama lain) pada kolom di hasil query tanpa mengubah nama kolom asli di tabel.'
  },
  {
    id: 's09',
    q: 'Klausa untuk menyaring baris berdasarkan syarat tertentu adalah…',
    options: ['WHERE', 'ORDER BY', 'GROUP BY', 'LIMIT'],
    answer: 0,
    explain: 'WHERE menyaring baris: hanya baris yang memenuhi syarat yang ditampilkan.'
  },
  {
    id: 's10',
    q: 'Operator untuk memeriksa apakah nilai berada dalam rentang adalah…',
    options: ['BETWEEN', 'IN', 'LIKE', 'EXISTS'],
    answer: 0,
    explain: 'BETWEEN a AND b memeriksa apakah nilai berada dalam rentang, dan kedua ujungnya ikut dihitung.'
  },
  {
    id: 's11',
    q: 'Operator yang memakai tanda % sebagai pengganti beberapa karakter adalah…',
    options: ['LIKE', 'IN', 'BETWEEN', 'IS NULL'],
    answer: 0,
    explain: 'LIKE mencocokkan pola teks; % mewakili nol atau lebih karakter, mis. nama LIKE \'A%\' mencari nama yang diawali A.'
  },
  {
    id: 's12',
    q: 'Cara benar memeriksa kolom yang bernilai kosong (NULL) adalah…',
    options: ['WHERE kolom IS NULL', 'WHERE kolom = NULL', 'WHERE kolom == NULL', 'WHERE kolom LIKE NULL'],
    answer: 0,
    explain: 'Nilai NULL tidak bisa dibandingkan dengan tanda sama dengan. Gunakan IS NULL atau IS NOT NULL.'
  },
  {
    id: 's13',
    q: 'ORDER BY gaji DESC berarti…',
    options: ['Mengurutkan gaji dari besar ke kecil', 'Mengurutkan gaji dari kecil ke besar', 'Menghapus kolom gaji', 'Menghitung rata-rata gaji'],
    answer: 0,
    explain: 'DESC (descending) mengurutkan menurun, yaitu dari nilai terbesar ke terkecil. ASC mengurutkan menaik.'
  },
  {
    id: 's14',
    q: 'DISTINCT dipakai untuk…',
    options: ['Menghilangkan baris yang nilainya duplikat', 'Mengurutkan data', 'Membatasi jumlah baris', 'Menggabungkan tabel'],
    answer: 0,
    explain: 'DISTINCT membuang baris yang isinya sama persis sehingga yang tampil hanya nilai unik.'
  },
  {
    id: 's15',
    q: 'Perintah LIMIT 5 berfungsi untuk…',
    options: ['Menampilkan paling banyak 5 baris', 'Menghapus 5 baris', 'Mengurutkan 5 baris', 'Menampilkan baris ke-5 saja'],
    answer: 0,
    explain: 'LIMIT membatasi jumlah baris yang dikembalikan. Selalu pasangkan dengan ORDER BY agar hasilnya konsisten.'
  },
  {
    id: 's16',
    q: 'OFFSET dipakai untuk…',
    options: ['Melewati sejumlah baris sebelum mulai mengambil data', 'Menggeser kolom ke kanan', 'Menghapus kolom', 'Menambah baris'],
    answer: 0,
    explain: 'OFFSET melompati sejumlah baris di awal. Kombinasi LIMIT + OFFSET adalah dasar pagination.'
  },
  {
    id: 's17',
    q: 'Rumus OFFSET untuk halaman ke-N pada pagination (10 data per halaman) adalah…',
    options: ['(N - 1) x 10', 'N x 10', 'N + 10', '10 x 10'],
    answer: 0,
    explain: 'Halaman 1 offset 0, halaman 2 offset 10, halaman 3 offset 20 — jadi OFFSET = (halaman - 1) x jumlah per halaman.'
  },
  {
    id: 's18',
    q: 'Fungsi agregasi untuk menghitung jumlah baris adalah…',
    options: ['COUNT', 'SUM', 'AVG', 'MAX'],
    answer: 0,
    explain: 'COUNT menghitung jumlah baris. COUNT(*) menghitung semua baris, COUNT(kolom) hanya baris yang tidak NULL.'
  },
  {
    id: 's19',
    q: 'Perbedaan COUNT(*) dan COUNT(kolom) adalah…',
    options: ['COUNT(*) menghitung semua baris, COUNT(kolom) hanya baris yang nilainya tidak NULL', 'Keduanya selalu sama', 'COUNT(kolom) menghitung semua baris', 'COUNT(*) hanya untuk kolom angka'],
    answer: 0,
    explain: 'COUNT(*) menghitung seluruh baris termasuk yang NULL, sedangkan COUNT(kolom) mengabaikan baris yang nilainya NULL.'
  },
  {
    id: 's20',
    q: 'Fungsi agregasi SUM, AVG, MIN, dan MAX terhadap nilai NULL…',
    options: ['Mengabaikannya (tidak dihitung)', 'Menghitungnya sebagai nol', 'Menghasilkan error', 'Mengubahnya menjadi satu'],
    answer: 0,
    explain: 'Fungsi agregasi mengabaikan nilai NULL. Karena itu AVG membagi total dengan jumlah nilai yang ada, bukan seluruh baris.'
  },
  {
    id: 's21',
    q: 'Perintah untuk menambahkan baris baru ke tabel adalah…',
    options: ['INSERT', 'UPDATE', 'CREATE', 'APPEND'],
    answer: 0,
    explain: 'INSERT INTO tabel (kolom) VALUES (nilai) menambahkan satu atau beberapa baris baru.'
  },
  {
    id: 's22',
    q: 'Perintah untuk mengubah data yang sudah ada adalah…',
    options: ['UPDATE', 'INSERT', 'ALTER', 'MODIFY'],
    answer: 0,
    explain: 'UPDATE tabel SET kolom = nilai WHERE syarat. Klausa SET menentukan nilai baru.'
  },
  {
    id: 's23',
    q: 'Apa yang terjadi bila menjalankan DELETE FROM karyawan tanpa WHERE?',
    options: ['Seluruh baris pada tabel terhapus', 'Tidak terjadi apa-apa', 'Hanya baris pertama terhapus', 'Tabel ikut terhapus'],
    answer: 0,
    explain: 'Tanpa WHERE, DELETE menghapus semua baris. Struktur tabel tetap ada, tetapi seluruh isinya hilang.'
  },
  {
    id: 's24',
    q: 'Perintah DDL untuk membuat tabel baru adalah…',
    options: ['CREATE TABLE', 'MAKE TABLE', 'ADD TABLE', 'NEW TABLE'],
    answer: 0,
    explain: 'CREATE TABLE membuat tabel baru dengan menentukan kolom, tipe data, dan aturan (constraint).'
  },
  {
    id: 's25',
    q: 'Aturan (constraint) yang mencegah kolom berisi nilai kosong adalah…',
    options: ['NOT NULL', 'UNIQUE', 'DEFAULT', 'CHECK'],
    answer: 0,
    explain: 'NOT NULL memaksa kolom harus diisi. UNIQUE menjamin tidak ada nilai kembar, DEFAULT memberi nilai bawaan.'
  },
  {
    id: 's26',
    q: 'Perintah untuk mengubah struktur tabel yang sudah ada adalah…',
    options: ['ALTER TABLE', 'UPDATE TABLE', 'MODIFY TABLE', 'CHANGE TABLE'],
    answer: 0,
    explain: 'ALTER TABLE bisa menambah kolom (ADD COLUMN), mengubah tipe kolom, atau menghapus kolom (DROP COLUMN).'
  },
  {
    id: 's27',
    q: 'Perbedaan TRUNCATE dan DROP TABLE adalah…',
    options: ['TRUNCATE mengosongkan isi tetapi tabelnya tetap ada, DROP menghapus tabel beserta strukturnya', 'TRUNCATE menghapus tabel, DROP hanya mengosongkan', 'Keduanya identik', 'TRUNCATE hanya menghapus satu kolom'],
    answer: 0,
    explain: 'TRUNCATE mengosongkan seluruh baris tanpa menghapus struktur tabel. DROP TABLE menghapus tabel sekaligus struktur dan datanya.'
  },
  {
    id: 's28',
    q: 'GROUP BY departemen_id pada SELECT departemen_id, COUNT(*) berfungsi untuk…',
    options: ['Menghitung jumlah baris untuk setiap departemen', 'Mengurutkan departemen', 'Menghapus departemen duplikat', 'Menggabungkan tabel departemen'],
    answer: 0,
    explain: 'GROUP BY mengelompokkan baris berdasarkan nilai kolom, lalu fungsi agregasi dihitung untuk setiap kelompok.'
  },
  {
    id: 's29',
    q: 'Klausa untuk menyaring hasil kelompok setelah agregasi dihitung adalah…',
    options: ['HAVING', 'WHERE', 'ORDER BY', 'GROUP BY'],
    answer: 0,
    explain: 'HAVING menyaring kelompok setelah agregasi, mis. HAVING COUNT(*) > 1. WHERE menyaring baris mentah sebelum pengelompokan.'
  },
  {
    id: 's30',
    q: 'Urutan klausa SQL yang benar adalah…',
    options: ['SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT', 'SELECT → WHERE → FROM → ORDER BY → GROUP BY', 'FROM → SELECT → HAVING → WHERE', 'SELECT → GROUP BY → WHERE → HAVING'],
    answer: 0,
    explain: 'Urutan logika eksekusi SQL: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, lalu LIMIT.'
  },
  {
    id: 's31',
    q: 'INNER JOIN menampilkan…',
    options: ['Hanya baris yang punya pasangan di kedua tabel', 'Semua baris tabel kiri', 'Semua baris kedua tabel', 'Baris yang tidak punya pasangan'],
    answer: 0,
    explain: 'INNER JOIN hanya mengembalikan baris yang syarat ON-nya cocok di kedua tabel.'
  },
  {
    id: 's32',
    q: 'LEFT JOIN pada FROM karyawan LEFT JOIN departemen akan…',
    options: ['Menampilkan semua karyawan, walau departemennya tidak ada (diisi NULL)', 'Menampilkan hanya karyawan yang punya departemen', 'Menampilkan hanya departemen', 'Menghapus karyawan tanpa departemen'],
    answer: 0,
    explain: 'LEFT JOIN mempertahankan semua baris tabel kiri; kolom dari tabel kanan yang tidak cocok berisi NULL.'
  },
  {
    id: 's33',
    q: 'FULL OUTER JOIN menghasilkan…',
    options: ['Semua baris dari kedua tabel, yang tidak cocok diisi NULL', 'Hanya baris yang cocok', 'Hanya baris tabel kiri', 'Hanya baris tabel kanan'],
    answer: 0,
    explain: 'FULL OUTER JOIN menggabungkan semua baris kedua tabel; baris yang tidak punya pasangan tetap muncul dengan NULL di sisi lainnya.'
  },
  {
    id: 's34',
    q: 'Subquery adalah…',
    options: ['Query yang ditulis di dalam query lain', 'Query yang dijalankan di server lain', 'Tabel sementara yang permanen', 'Perintah untuk menyalin tabel'],
    answer: 0,
    explain: 'Subquery (query bersarang) adalah SELECT yang berada di dalam SELECT lain, mis. dipakai di WHERE, FROM, atau dengan EXISTS.'
  },
  {
    id: 's35',
    q: 'Operator EXISTS bernilai benar bila…',
    options: ['Subquery menghasilkan minimal satu baris', 'Subquery menghasilkan nol baris', 'Tabel kosong', 'Kolom bernilai NULL'],
    answer: 0,
    explain: 'EXISTS bernilai benar apabila subquery mengembalikan setidaknya satu baris, dan berhenti mencari begitu ditemukan.'
  },
  {
    id: 's36',
    q: 'CTE (Common Table Expression) didefinisikan dengan kata kunci…',
    options: ['WITH', 'LET', 'TEMP', 'DEFINE'],
    answer: 0,
    explain: 'CTE ditulis sebagai WITH nama_cte AS ( ... ) lalu dipakai di query utama seperti tabel biasa.'
  },
  {
    id: 's37',
    q: 'Kegunaan utama CTE adalah…',
    options: ['Memecah query kompleks menjadi langkah-langkah bernama yang mudah dibaca', 'Mempercepat internet', 'Mengenkripsi data', 'Menghapus duplikat otomatis'],
    answer: 0,
    explain: 'CTE membuat query panjang lebih terstruktur dengan menamai tabel-tabel sementara, sehingga alurnya mudah diikuti.'
  },
  {
    id: 's38',
    q: 'Apa perbedaan RANK dan DENSE_RANK saat ada nilai seri?',
    options: ['RANK melompati nomor setelah seri, DENSE_RANK tidak melompat', 'DENSE_RANK selalu memberi nomor berbeda', 'Keduanya selalu sama', 'RANK hanya untuk teks'],
    answer: 0,
    explain: 'Misal nilai seri di posisi 2: RANK memberi 1,2,2,4 (melompat), DENSE_RANK memberi 1,2,2,3 (tidak melompat). ROW_NUMBER selalu unik: 1,2,3,4.'
  },
  {
    id: 's39',
    q: 'Fungsi window LAG(gaji) OVER (ORDER BY gaji) berfungsi untuk…',
    options: ['Mengambil nilai gaji dari baris sebelumnya', 'Mengambil nilai gaji dari baris berikutnya', 'Menjumlahkan seluruh gaji', 'Menghapus baris ganda'],
    answer: 0,
    explain: 'LAG mengambil nilai dari baris sebelumnya, LEAD dari baris berikutnya. Baris paling awal tidak punya "sebelumnya" sehingga menghasilkan NULL.'
  },
  {
    id: 's40',
    q: 'Perintah untuk membuat index adalah…',
    options: ['CREATE INDEX', 'ADD INDEX', 'MAKE INDEX', 'NEW INDEX'],
    answer: 0,
    explain: 'CREATE INDEX membuat struktur bantu yang mempercepat pencarian pada kolom yang sering dipakai di WHERE, JOIN, atau ORDER BY.'
  },
  {
    id: 's41',
    q: 'Dampak samping membuat terlalu banyak index adalah…',
    options: ['Memperlambat INSERT/UPDATE/DELETE dan memakan ruang penyimpanan', 'Membuat SELECT selalu gagal', 'Menghapus data otomatis', 'Menonaktifkan primary key'],
    answer: 0,
    explain: 'Setiap index harus diperbarui saat data berubah. Terlalu banyak index memperlambat penulisan dan memakan ruang, jadi cukup buat index yang benar-benar perlu.'
  },
  {
    id: 's42',
    q: 'EXPLAIN pada query dipakai untuk…',
    options: ['Melihat rencana eksekusi query, termasuk apakah index dipakai', 'Mendokumentasikan query ke file', 'Menjalankan query berulang', 'Menghapus query dari cache'],
    answer: 0,
    explain: 'EXPLAIN memperlihatkan bagaimana database akan menjalankan query: memakai index (cepat/SEARCH) atau membaca seluruh tabel (SCAN).'
  },
  {
    id: 's43',
    q: 'Perbedaan stored procedure dan stored function adalah…',
    options: ['Procedure dipanggil dengan CALL dan boleh tidak mengembalikan nilai; function wajib mengembalikan nilai dan bisa dipakai di SELECT', 'Keduanya sama persis', 'Function dipanggil dengan CALL saja', 'Procedure hanya bisa membaca data'],
    answer: 0,
    explain: 'Stored function wajib punya RETURNS dan dapat dipakai di dalam SELECT. Procedure dipanggil dengan CALL dan boleh punya parameter IN/OUT.'
  },
  {
    id: 's44',
    q: 'Trigger database dijalankan…',
    options: ['Otomatis saat terjadi peristiwa tertentu seperti INSERT, UPDATE, atau DELETE pada tabel', 'Hanya saat aplikasi ditutup', 'Secara manual dengan perintah RUN', 'Sekali sehari oleh sistem operasi'],
    answer: 0,
    explain: 'Trigger menempel pada tabel dan dipicu otomatis oleh peristiwa INSERT/UPDATE/DELETE, pada waktu BEFORE atau AFTER.'
  },
  {
    id: 's45',
    q: 'Pada trigger, kata OLD dan NEW berisi…',
    options: ['Nilai baris sebelum dan sesudah perubahan', 'Nama tabel lama dan baru', 'Pengguna lama dan baru', 'Waktu sebelum dan sesudah'],
    answer: 0,
    explain: 'OLD berisi nilai sebelum perubahan dan NEW nilai setelah perubahan, dipakai mis. untuk mencatat riwayat perubahan gaji.'
  },
  {
    id: 's46',
    q: 'Kepanjangan dari ACID adalah…',
    options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Data', 'Add, Commit, Insert, Delete', 'Atomic, Clear, Index, Durable'],
    answer: 0,
    explain: 'ACID adalah empat sifat transaksi: Atomicity, Consistency, Isolation, dan Durability.'
  },
  {
    id: 's47',
    q: 'Perintah untuk menyimpan semua perubahan transaksi secara permanen adalah…',
    options: ['COMMIT', 'ROLLBACK', 'SAVEPOINT', 'BEGIN'],
    answer: 0,
    explain: 'COMMIT menyimpan semua perubahan dalam transaksi secara permanen ke database.'
  },
  {
    id: 's48',
    q: 'Perintah ROLLBACK berfungsi untuk…',
    options: ['Membatalkan seluruh perubahan dalam transaksi', 'Menyimpan perubahan permanen', 'Membuat transaksi baru', 'Mengunci tabel'],
    answer: 0,
    explain: 'ROLLBACK membatalkan semua perubahan sejak BEGIN, seolah tidak pernah terjadi. Berguna saat salah satu langkah transaksi gagal.'
  },
  {
    id: 's49',
    q: 'SAVEPOINT berguna untuk…',
    options: ['Membatalkan sebagian transaksi tanpa membatalkan seluruhnya', 'Menyimpan seluruh transaksi', 'Menghapus transaksi dari memori', 'Mengunci baris'],
    answer: 0,
    explain: 'SAVEPOINT membuat titik penanda; ROLLBACK TO SAVEPOINT membatalkan hanya bagian setelah titik itu, sementara transaksi tetap aktif.'
  },
  {
    id: 's50',
    q: 'Sifat transaksi "Isolation" berarti…',
    options: ['Transaksi yang berjalan bersamaan tidak saling mengganggu', 'Data selalu dienkripsi', 'Semua transaksi harus dijalankan satu per satu selamanya', 'Perubahan langsung terhapus'],
    answer: 0,
    explain: 'Isolation memastikan transaksi yang berjalan bersamaan tidak saling merusak hasil, dibantu mekanisme locking.'
  }
];
