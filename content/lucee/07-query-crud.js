/* ============================================================
   Pelajaran Lucee CFML — Bab 7: Query Aman & Operasi CRUD (L7)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-query-crud',
  title: 'Query Aman & Operasi CRUD',
  chapter: 'Data & Menengah',
  duration: '14 menit',
  intro: [
    'Semua aplikasi toko online berputar pada empat operasi database: Create, Read, Update, Delete (CRUD). Di CFML operasi itu ditulis dengan tag <code>&lt;cfquery&gt;</code> atau fungsi <code>queryExecute()</code> — keduanya memakai mesin yang sama.',
    'Pelajaran ini menekankan satu hal yang tidak boleh ditawar: <b>nilai dari pengguna tidak pernah digabung ke teks SQL</b>. Kamu akan belajar SQL Injection, parameter dengan <code>&lt;cfqueryparam&gt;</code>, membaca metadata hasil query, pagination, penanganan error, dan transaksi.',
    'Contoh memakai tabel <code>produk</code> pada datasource <code>appDB</code> yang sudah diatur sebagai defaultDatasource di pelajaran sebelumnya.'
  ],
  objectives: [
    'Menulis query SELECT dengan cfquery dan queryExecute',
    'Mencegah SQL Injection memakai parameter',
    'Melakukan operasi CRUD lengkap pada tabel produk',
    'Membaca metadata hasil query seperti generatedKey dan recordcount',
    'Menerapkan pagination LIMIT dan OFFSET',
    'Menangani error query dan menyusun transaksi dasar'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Membaca Data dengan cfquery dan queryExecute()</h3><p><code>&lt;cfquery&gt;</code> adalah tag klasik: hasil SELECT tersimpan di variabel bernama atribut <code>name</code>, lalu ditampilkan dengan <code>&lt;cfoutput query="..."&gt;</code>. <code>queryExecute()</code> adalah versi fungsi yang mengembalikan objek query langsung sehingga lebih pas untuk gaya script modern. Bedanya hanya sintaks — keamanan dan performanya sama.</p>'
    },
    {
      type: 'example',
      title: 'SELECT dengan queryExecute',
      lang: 'cfml',
      output: false,
      code: `qProduk = queryExecute(
    "SELECT id, nama, kategori, harga, stok
       FROM produk
      WHERE stok > 0
   ORDER BY nama"
);

writeOutput("Jumlah produk: " & qProduk.recordCount & "<br>");

for (row in qProduk) {
    writeOutput(row.nama & " — Rp " & row.harga & "<br>");
}`,
      explain: [
        'Tanpa opsi tambahan, queryExecute() hanya butuh teks SQL dan mengembalikan objek query.',
        'recordCount menyimpan jumlah baris hasil; kolom dibaca lewat nama kolom pada tiap baris.',
        'for-in di atas objek query mengulang semua baris, tiap baris berupa struct nama kolom dan nilainya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>SQL Injection dan cfqueryparam</h3><p><b>SQL Injection</b> terjadi ketika nilai dari pengguna digabung langsung ke teks SQL. Penyerang menyisipkan potongan SQL — misalnya menutup tanda kutip lalu menambah klausa — sehingga struktur perintah berubah. Pencegahannya cuma satu: kirim nilai lewat <b>parameter</b>, bukan lewat penggabungan string. Database lalu memperlakukan nilai itu sebagai data, seaman apa pun isinya.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Perbandingan query gabungan-string berbahaya dengan query berparameter">
        <defs><marker id="mk-l07-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <text x="380" y="14" class="u-sub" text-anchor="middle">1. Nilai digabung ke teks SQL — membahayakan</text>
        <rect x="15" y="28" width="175" height="56" rx="8" class="u-hd"/>
        <text x="102" y="50" class="u-title" text-anchor="middle">Input pengguna</text>
        <text x="102" y="70" class="u-lbl" text-anchor="middle">Kopi' OR '1'='1</text>
        <line x1="190" y1="56" x2="206" y2="56" class="u-line" marker-end="url(#mk-l07-1)"/>
        <rect x="210" y="28" width="175" height="56" rx="8" class="u-box"/>
        <text x="297" y="50" class="u-title" text-anchor="middle">Digabung ke string</text>
        <text x="297" y="70" class="u-lbl" text-anchor="middle">WHERE nama = '#form.nama#'</text>
        <line x1="385" y1="56" x2="401" y2="56" class="u-line" marker-end="url(#mk-l07-1)"/>
        <rect x="405" y="28" width="190" height="56" rx="8" class="u-box"/>
        <text x="500" y="50" class="u-title" text-anchor="middle">SQL yang dieksekusi</text>
        <text x="500" y="70" class="u-lbl" text-anchor="middle">WHERE nama = ' OR '1'='1</text>
        <line x1="595" y1="56" x2="606" y2="56" class="u-line" marker-end="url(#mk-l07-1)"/>
        <rect x="610" y="28" width="135" height="56" rx="8" class="u-hd"/>
        <text x="677" y="50" class="u-title" text-anchor="middle">Hasil</text>
        <text x="677" y="70" class="u-lbl" text-anchor="middle">semua baris bocor</text>
        <text x="380" y="108" class="u-lbl" text-anchor="middle">Syarat WHERE tidak berlaku lagi — penyerang mengubah struktur perintah</text>
        <text x="380" y="140" class="u-sub" text-anchor="middle">2. Nilai dikirim sebagai parameter — aman</text>
        <rect x="15" y="154" width="175" height="56" rx="8" class="u-box"/>
        <text x="102" y="176" class="u-title" text-anchor="middle">Input pengguna</text>
        <text x="102" y="196" class="u-lbl" text-anchor="middle">nilai apa pun isinya</text>
        <line x1="190" y1="182" x2="206" y2="182" class="u-line" marker-end="url(#mk-l07-1)"/>
        <rect x="210" y="154" width="175" height="56" rx="8" class="u-hd"/>
        <text x="297" y="176" class="u-title" text-anchor="middle">Lewat parameter</text>
        <text x="297" y="196" class="u-lbl" text-anchor="middle">WHERE nama = :nama</text>
        <line x1="385" y1="182" x2="401" y2="182" class="u-line" marker-end="url(#mk-l07-1)"/>
        <rect x="405" y="154" width="190" height="56" rx="8" class="u-box"/>
        <text x="500" y="176" class="u-title" text-anchor="middle">Prepared statement</text>
        <text x="500" y="196" class="u-lbl" text-anchor="middle">nilai terpisah dari teks SQL</text>
        <line x1="595" y1="182" x2="606" y2="182" class="u-line" marker-end="url(#mk-l07-1)"/>
        <rect x="610" y="154" width="135" height="56" rx="8" class="u-hd"/>
        <text x="677" y="176" class="u-title" text-anchor="middle">Hasil</text>
        <text x="677" y="196" class="u-lbl" text-anchor="middle">hanya baris cocok</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Parameter memisahkan struktur SQL dari nilai sehingga input tidak bisa mengubah perintah</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'SQL Injection: membahayakan vs aman',
      lang: 'cfml',
      output: false,
      code: `// MEMBAHAYAKAN — nilai digabung ke teks SQL
// bila form.nama berisi  Kopi' OR '1'='1   maka seluruh produk bocor
q = queryExecute("SELECT * FROM produk WHERE nama = '#form.nama#'");

// AMAN — nilai dikirim sebagai parameter bernama
q = queryExecute(
    "SELECT * FROM produk WHERE nama = :nama",
    { nama: { value: form.nama, cfsqltype: "cf_sql_varchar" } }
);

// AMAN — gaya tag dengan cfqueryparam
// <cfquery name="q" datasource="appDB">
//     SELECT * FROM produk
//      WHERE nama = <cfqueryparam value="#form.nama#" cfsqltype="cf_sql_varchar">
// </cfquery>`,
      explain: [
        'Versi pertama menghasilkan SQL menjadi <code>WHERE nama = \' OR \'1\'=\'1</code> — syarat tidak berlaku dan semua baris terbaca.',
        'Kunci parameter berisi <code>value</code> (nilai) dan <code>cfsqltype</code> (tipe SQL) sehingga database menyiapkan tipe kolom yang tepat.',
        'Gaya tag memakai <code>&lt;cfqueryparam&gt;</code> pada posisi nilai; hasil dan keamanannya identik.',
        'Selain keamanan, parameter juga membuat database bisa memakai prepared statement yang query plan-nya dipakai ulang.'
      ]
    },
    {
      type: 'warn',
      title: 'Validasi input bukan pengganti parameter',
      text: 'Melarang tanda kutip atau menolak teks yang terlihat aneh bukan pertahanan — daftar karakter yang "aman" selalu bocor di suatu tempat. Validasi input tetap perlu untuk aturan bisnis (harga harus angka, nama maksimal 100 huruf), tetapi keamanan SQL datang sepenuhnya dari parameter.'
    },
    {
      type: 'text',
      html: '<h3>Operasi CRUD pada Tabel Produk</h3><p>Contoh berikut memakai tabel <code>produk</code> dengan kolom <code>id</code> auto-increment. Buat dulu tabelnya lewat klien SQL atau file migrasi, lalu jalankan operasi Create, Read, Update, dan Delete dari CFML.</p>'
    },
    {
      type: 'example',
      title: 'Struktur tabel produk',
      lang: 'sql',
      output: false,
      code: `CREATE TABLE produk (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nama        VARCHAR(100) NOT NULL,
    kategori    VARCHAR(50)  NOT NULL DEFAULT 'umum',
    harga       INT          NOT NULL DEFAULT 0,
    stok        INT          NOT NULL DEFAULT 0,
    dibuat_pada TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      explain: [
        '<code>AUTO_INCREMENT</code> membuat database mengisi kolom <code>id</code> sendiri — nilainya nanti terbaca lewat generatedKey.',
        'DEFAULT pada kolom memungkinkan INSERT menyebut sebagian kolom saja.',
        'CHARSET=utf8mb4 menampung emoji dan karakter ekstra dengan aman.'
      ]
    },
    {
      type: 'example',
      title: 'CREATE — menyisipkan produk baru',
      lang: 'cfml',
      output: false,
      code: `queryExecute(
    "INSERT INTO produk (nama, kategori, harga, stok)
     VALUES (:nama, :kategori, :harga, :stok)",
    {
        nama:     { value: "Kopi Arabika", cfsqltype: "cf_sql_varchar", maxlength: 100 },
        kategori: { value: "Minuman",      cfsqltype: "cf_sql_varchar", maxlength: 50 },
        harga:    { value: 85000,         cfsqltype: "cf_sql_integer" },
        stok:     { value: 12,            cfsqltype: "cf_sql_integer" }
    },
    { result: "hasil" }
);

idBaru = hasil.generatedKey;
writeOutput("Produk tersimpan dengan id " & idBaru);`,
      explain: [
        'Opsi ketiga <code>{ result: "hasil" }</code> membuat struct metadata bernama <code>hasil</code>.',
        '<code>hasil.generatedKey</code> berisi id auto-increment milik baris yang baru disisipkan.',
        '<code>maxlength</code> membatasi panjang teks sekaligus memberi petunjuk tipe pada database.',
        'Semua nilai memakai placeholder <code>:nama</code> — tidak ada teks SQL yang dibentuk dari input.'
      ]
    },
    {
      type: 'example',
      title: 'UPDATE dan DELETE',
      lang: 'cfml',
      output: false,
      code: `// UPDATE
queryExecute(
    "UPDATE produk SET harga = :harga, stok = :stok WHERE id = :id",
    {
        harga: { value: 90000, cfsqltype: "cf_sql_integer" },
        stok:  { value: 25,    cfsqltype: "cf_sql_integer" },
        id:    { value: idBaru, cfsqltype: "cf_sql_integer" }
    },
    { result: "hasil" }
);
// hasil.recordcount = jumlah baris yang berubah

// DELETE
queryExecute(
    "DELETE FROM produk WHERE id = :id",
    { id: { value: idBaru, cfsqltype: "cf_sql_integer" } },
    { result: "hasil" }
);
// bila id tidak ada, hasil.recordcount = 0 — bukan error`,
      explain: [
        'Selalu sertakan klausa <code>WHERE</code> pada UPDATE dan DELETE; tanpa WHERE, seluruh tabel ikut berubah atau terhapus.',
        '<code>hasil.recordcount</code> untuk INSERT/UPDATE/DELETE berisi jumlah baris terpengaruh, bukan baris hasil.',
        'Periksa recordcount sebelum menganggap operasi berhasil — id yang salah menghasilkan 0 baris tanpa error.'
      ]
    },
    {
      type: 'text',
      html: '<p>Struct <code>result</code> bisa diminta lewat <code>&lt;cfquery result="hasil"&gt;</code> maupun opsi <code>result</code> pada <code>queryExecute()</code>. Isinya metadata eksekusi: <code>hasil.sql</code> (perintah yang dijalankan), <code>hasil.recordcount</code>, <code>hasil.columnList</code>, <code>hasil.executionTime</code>, <code>hasil.sqlParameters</code>, dan <code>hasil.generatedKey</code> untuk INSERT dengan kolom auto-increment. Di Lucee tidak ada kunci bernama <code>affectedRows</code> — nama itu lazim dipakai driver database lain, sementara di Lucee jumlah baris terpengaruh dibaca dari <code>recordcount</code>. Pada API gaya lama <code>new Query().execute()</code>, metadata yang sama dibungkus dalam properti <code>prefix</code>, jadi kunci lain diakses lewat <code>execute().getPrefix()</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Pagination, Error, dan Transaksi</h3><p>Menampilkan ribuan baris sekaligus membuat halaman lambat dan boros memori. Sisipkan <code>LIMIT</code> dan <code>OFFSET</code> agar aplikasi mengirim satu halaman penuh saja. Sementara itu, query yang gagal (koneksi putus, sintaks salah, pelanggaran unique) harus ditangkap dengan <code>try/catch</code> supaya pesan yang sampai ke pengguna tetap wajar.</p>'
    },
    {
      type: 'example',
      title: 'Pagination LIMIT dan OFFSET',
      lang: 'cfml',
      output: false,
      code: `halaman   = val(url.halaman ?: 1);
if (halaman < 1) halaman = 1;
perHalaman = 20;
awal       = (halaman - 1) * perHalaman;

qProduk = queryExecute(
    "SELECT id, nama, kategori, harga, stok
       FROM produk
   ORDER BY nama
      LIMIT #perHalaman# OFFSET #awal#"
);`,
      explain: [
        '<code>LIMIT</code> membatasi jumlah baris, <code>OFFSET</code> melewati baris sebelumnya — rumus baris awal = (halaman − 1) × perHalaman.',
        '<code>val()</code> memaksa nilai menjadi angka; halaman yang tidak valid otomatis menjadi 0 lalu dikoreksi menjadi 1.',
        'Angka yang disisipkan aman karena sudah dinumerikkan terlebih dahulu — bukan teks mentah dari pengguna.',
        'ORDER BY membuat urutan halaman stabil tanpa pengurutan acak antar permintaan.'
      ]
    },
    {
      type: 'example',
      title: 'try/catch dan throw pada query',
      lang: 'cfml',
      output: false,
      code: `try {
    queryExecute(
        "UPDATE produk SET stok = stok - :jumlah
          WHERE id = :id AND stok >= :jumlah",
        {
            jumlah: { value: 5,  cfsqltype: "cf_sql_integer" },
            id:    { value: 7,  cfsqltype: "cf_sql_integer" }
        },
        { result: "hasil" }
    );

    if (hasil.recordcount == 0) {
        throw(message="Stok tidak mencukupi atau produk tidak ditemukan", type="TokoError");
    }
} catch (any e) {
    if (e.type == "TokoError") {
        writeOutput("Gagal: " & e.message);
    } else {
        throw(message="Kesalahan saat memperbarui stok", type="TokoError", detail=e.message);
    }
}`,
      explain: [
        '<code>try</code> menangkap segala jenis kesalahan query, mulai dari koneksi putus sampai pelanggaran batas unik.',
        '<code>throw</code> mengangkat error buatan dengan <code>message</code> dan <code>type</code> yang bisa diperiksa di blok catch.',
        'Syarat <code>stok &gt;= jumlah</code> di SQL membuat pengurangan stok tidak pernah minus walau dua pembeli bersamaan.',
        'Detail error mentah cocok untuk log, tetapi jangan ditampilkan apa adanya ke pengguna.'
      ]
    },
    {
      type: 'example',
      title: 'Transaksi dengan cftransaction',
      lang: 'cfml',
      output: false,
      code: `<cftransaction>
    <cfquery datasource="appDB">
        UPDATE produk
           SET stok = stok - <cfqueryparam value="#form.jumlah#" cfsqltype="cf_sql_integer">
         WHERE id = <cfqueryparam value="#form.idProduk#" cfsqltype="cf_sql_integer">
    </cfquery>

    <cfquery datasource="appDB">
        INSERT INTO pesanan (produk_id, jumlah) VALUES (
            <cfqueryparam value="#form.idProduk#" cfsqltype="cf_sql_integer">,
            <cfqueryparam value="#form.jumlah#"  cfsqltype="cf_sql_integer">
        )
    </cfquery>
</cftransaction>`,
      explain: [
        'Semua query di dalam <code>&lt;cftransaction&gt;</code> menjadi satu unit: tag penutup melakukan commit sekaligus.',
        'Bila terjadi error di dalam blok, Lucee melakukan rollback otomatis lalu meneruskan error ke luar.',
        'Tanpa transaksi, kegagalan pada query kedua meninggalkan query pertama terlanjur tersimpan — stok berkurang tanpa ada pesanan.',
        'Untuk kontrol manual tersedia <code>action="begin|commit|rollback"</code> dan <code>isolation</code> seperti <code>read_committed</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Praktik Menulis Query yang Rapi</h3><p>Query adalah kode yang paling sering dibaca ulang: muncul di log, di alat debugging, dan di rapat analisis performa. Tulis SQL agar enak dipindai dan aman dikembangkan orang lain.</p>'
    },
    {
      type: 'tip',
      title: 'Gaya menulis query yang mudah dirawat',
      text: 'Tulis kata kunci SQL dengan huruf kapital (SELECT, FROM, WHERE, ORDER BY), satu klausa per baris beraturan, dan parameter bernama (<code>:nama</code>, <code>:harga</code>) alih-alih tanda tanya yang harus dihitung urut. Sebut kolom secara eksplisit, bukan <code>SELECT *</code>, supaya perubahan skema tidak merusak kode diam-diam.'
    },
    {
      type: 'vocab',
      items: [
        ['CRUD', 'Create, Read, Update, Delete — empat operasi dasar pada data.'],
        ['SQL Injection', 'Serangan menyisipkan potongan SQL lewat input yang digabung ke teks query.'],
        ['cfqueryparam', 'Tag penanda nilai parameter pada cfquery; di queryExecute berupa struct params.'],
        ['Prepared statement', 'Mekanisme database: struktur SQL disiapkan lebih dulu, nilai diisi belakangan.'],
        ['generatedKey', 'Kunci pada struct result yang berisi id auto-increment hasil INSERT.'],
        ['Struct result', 'Metadata eksekusi query: sql, recordcount, columnList, executionTime, sqlParameters.'],
        ['Transaksi', 'Kumpulan query yang harus bersama-sama berhasil atau sama-sama batal.']
      ]
    }
  ],
  recap: [
    'cfquery dan queryExecute() memakai mesin yang sama; keduanya mendukung parameter.',
    'Nilai dari pengguna tidak pernah digabung ke teks SQL — cegah SQL Injection dengan parameter bernama dan cfqueryparam.',
    'Opsi result memberi struct metadata: generatedKey untuk INSERT dan recordcount untuk jumlah baris terpengaruh.',
    'Pagination memakai LIMIT dan OFFSET dengan angka yang sudah divalidasi lewat val().',
    'try/catch dan throw menangani kegagalan query; cftransaction menggabungkan beberapa query jadi satu unit.',
    'Tulis SQL dengan kapital, satu klausa per baris, kolom eksplisit, dan parameter bernama.'
  ]
});
