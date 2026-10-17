/* ============================================================
   Pelajaran Go REST API — Bab 3: Koneksi MariaDB
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-koneksi-mariadb',
  title: 'Koneksi MariaDB dengan database/sql',
  chapter: 'Database',
  duration: '11 menit',
  intro: [
    'Go menyediakan interface <b>database/sql</b> di standard library untuk bekerja dengan database SQL. Interface ini bersifat generik — driver spesifik MariaDB/MySQL dihubungkan lewat registrasi driver.',
    'Pelajaran ini membangun package <code>database</code> yang membuka koneksi, mengatur <b>connection pool</b>, menguji koneksi, dan menjalankan migrasi skema.'
  ],
  objectives: [
    'Memahami DSN (Data Source Name) untuk MariaDB',
    'Membuka koneksi dengan sql.Open dan menjalankan Ping',
    'Mengatur connection pool (MaxOpenConns, MaxIdleConns, ConnMaxLifetime)',
    'Menjalankan file migrasi SQL dari kode Go'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Driver dan Interface</h3><p><code>database/sql</code> adalah interface; konkret-nya ada di driver. Kita memakai <code>go-sql-driver/mysql</code> yang kompatibel dengan MariaDB. Cukup impor dengan <b>blank identifier</b> <code>_</code> — driver otomatis mendaftarkan dirinya sendiri ke interface saat program dimulai.</p>'
    },
    {
      type: 'example',
      title: 'Menghubungkan driver ke database/sql',
      lang: 'go',
      output: false,
      code: `package database

import (
    "database/sql"

    _ "github.com/go-sql-driver/mysql" // registrasi diri ke database/sql
)`,
      explain: [
        'Pola <code>_ "path/package"</code> berarti: impor untuk efek sampingnya saja (registrasi driver), tidak memakai identifier-nya.',
        'Nama driver yang didaftarkan adalah <code>"mysql"</code> — dipakai di <code>sql.Open</code>.',
        'Interface tetap sama walau ganti database → kode lapisan repository tidak berubah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>DSN: Alamat Koneksi</h3><p>Koneksi diawali dengan string <b>DSN</b> (Data Source Name) yang memuat host, port, user, password, nama database, dan parameter tambahan:</p>'
    },
    {
      type: 'example',
      title: 'Rumus DSN MariaDB',
      lang: 'go',
      output: false,
      code: `dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
    cfg.DBUser,  // root
    cfg.DBPass,  // root
    cfg.DBHost,  // localhost
    cfg.DBPort,  // 3306
    cfg.DBName,  // gorestapi_app
)
// hasil: root:root@tcp(localhost:3306)/gorestapi_app?parseTime=true&charset=utf8mb4`,
      explain: [
        'Format umum: <code>user:pass@tcp(host:port)/dbname?params</code>.',
        '<code>parseTime=true</code> WAJIB agar kolom TIMESTAMP/DATETIME terbaca sebagai <code>time.Time</code> (bukan []byte).',
        '<code>charset=utf8mb4</code> mendukung emoji & karakter ekstra.'
      ]
    },
    {
      type: 'text',
      html: '<h3>sql.Open & Ping</h3><p>Penting dipahami: <code>sql.Open</code> <b>TIDAK</b> benar-benar membuka koneksi. Ia hanya menyiapkan pool dan memvalidasi parameter DSN. Koneksi nyata baru dibuat saat ada query pertama. Karena itu, untuk memastikan database benar-benar bisa dijangkau, jalankan <b>Ping</b>.</p>'
    },
    {
      type: 'example',
      title: 'Membuka koneksi & menguji dengan Ping',
      lang: 'go',
      output: false,
      code: `func Open(cfg *config.Config) (*sql.DB, error) {
    dsn := ... // seperti di atas

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return nil, fmt.Errorf("gagal membuka koneksi: %w", err)
    }

    // --- Connection pool ---
    db.SetMaxOpenConns(25)                 // maksimal koneksi terbuka
    db.SetMaxIdleConns(10)                 // koneksi yang disimpan untuk dipakai ulang
    db.SetConnMaxLifetime(5 * time.Minute) // umur maksimal satu koneksi

    // --- Uji koneksi sungguhan ---
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := db.PingContext(ctx); err != nil {
        return nil, fmt.Errorf("gagal ping database: %w", err)
    }
    return db, nil
}`,
      explain: [
        'Pool membuat koneksi dibuat-dipakai-dikembalikan secara otomatis — kamu tidak perlu mengelola koneksi satu per satu.',
        '<code>SetMaxOpenConns</code> mencegah aplikasi menambah koneksi tanpa batas saat ramai.',
        '<code>ctx + timeout</code> memastikan ping tidak menggantung selamanya bila database mati.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Apa itu Connection Pool?</h3><p>Membuka koneksi ke database itu <b>mahal</b> (handshake TCP + autentikasi). Alih-alih membuka-tutup koneksi tiap request, <code>database/sql</code> menyimpan beberapa koneksi yang siap dipakai — inilah <b>pool</b>. Ketika sebuah fungsi selesai memakai koneksi, koneksi itu <b>dikembalikan</b> ke pool (bukan ditutup), sehingga bisa dipakai request berikutnya.</p>'
    },
    {
      type: 'example',
      title: 'Analogi connection pool',
      lang: 'text',
      output: false,
      code: `Tanpa pool : buka toko tiap ada pembeli → lama & mahal
Dengan pool: toko selalu buka, ada 10 kasir (MaxOpenConns)
             kasir nganggur tetap standby (MaxIdleConns)
             kasir lama dipensiunkan (ConnMaxLifetime)`,
      explain: [
        'MaxOpenConns membatasi jumlah kasir aktif agar tidak berebut meja kasir (koneksi database).',
        'MaxIdleConns menjaga sebagian koneksi tetap siap agar request berikutnya cepat.',
        'ConnMaxLifetime me-refresh koneksi lama agar tidak putus diam-diam oleh firewall/load balancer.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Migrasi</h3><p>Skema database (tabel) disimpan sebagai file SQL di folder <code>migrations/</code> — bukan dibuat manual lewat klien SQL. Dengan begini, skema bisa direproduksi di mana saja. Catatan penting: driver MySQL hanya menerima <b>satu statement per eksekusi</b>, jadi file dipecah per <code>;</code> dulu.</p>'
    },
    {
      type: 'example',
      title: 'Mengeksekusi file migrasi dari Go',
      lang: 'go',
      output: false,
      code: `func Migrate(db *sql.DB, path string) error {
    data, err := os.ReadFile(path)
    if err != nil {
        return fmt.Errorf("baca file migrasi: %w", err)
    }
    for _, stmt := range strings.Split(string(data), ";") {
        stmt = strings.TrimSpace(stmt)
        if stmt == "" || strings.HasPrefix(stmt, "--") {
            continue // lewati baris kosong & komentar
        }
        if _, err := db.Exec(stmt); err != nil {
            return fmt.Errorf("eksekusi migrasi: %w", err)
        }
    }
    return nil
}`,
      explain: [
        'Migrasi memakai <code>CREATE TABLE IF NOT EXISTS</code> sehingga aman dijalankan berulang.',
        'Memecah per ";" menghindari error sintaks karena driver menolak banyak statement sekaligus.',
        'Di proyek nyata, tool migrasi seperti golang-migrate bisa dipakai untuk versi skema yang lebih terkontrol.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh file migrasi (migrations/001_init.sql)',
      lang: 'sql',
      output: false,
      code: `CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      explain: [
        '<code>UNIQUE KEY</code> membuat database menolak duplikasi — dibaca sebagai error 1062 di Go.',
        '<code>TIMESTAMP DEFAULT CURRENT_TIMESTAMP</code> mengisi waktu saat insert tanpa kode aplikasi.',
        'Skema di-commit ke git = satu sumber kebenaran untuk semua pengembang.'
      ]
    },
    {
      type: 'warn',
      title: 'Tutup db saat program selesai',
      text: 'Panggil <code>defer db.Close()</code> setelah koneksi berhasil dibuka. Koneksi yang tidak ditutup membuat aplikasi "bocor" dan program bisa tidak berhenti dengan bersih.'
    },
    {
      type: 'vocab',
      items: [
        ['database/sql', 'Interface standard library Go untuk akses database SQL.'],
        ['Driver', 'Package konkret yang mengimplementasi interface database/sql untuk DB tertentu.'],
        ['DSN', 'Data Source Name — string alamat koneksi (user:pass@tcp(host:port)/db).'],
        ['Connection pool', 'Kumpulan koneksi siap pakai yang dikelola otomatis oleh database/sql.'],
        ['Ping', 'Mengirim perintah ringan untuk memastikan database benar-benar terjangkau.'],
        ['Migrasi', 'Skema database berupa file SQL yang dieksekusi program untuk membuat/mengubah tabel.']
      ]
    }
  ],
  recap: [
    'database/sql adalah interface; driver go-sql-driver/mysql mendaftar via blank import.',
    'sql.Open hanya menyiapkan pool — wajib Ping untuk memastikan koneksi nyata.',
    'Connection pool diatur dengan SetMaxOpenConns, SetMaxIdleConns, SetConnMaxLifetime.',
    'Migrasi dijalankan dari file SQL, dipecah per statement karena keterbatasan driver.'
  ]
});
