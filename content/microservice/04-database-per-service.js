/* ============================================================
   Pelajaran Microservices — Bab 4: Database per Service
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'database-per-service',
  title: 'Database per Service: PostgreSQL, Transaksi, dan Repository',
  chapter: 'Membangun Service',
  duration: '15–17 menit',
  intro: [
    'Sampai di sini catalog-service kita masih mengingat data di memori; sekali proses dihentikan, semua produk lenyap. Bab ini menyambungkannya ke PostgreSQL sekaligus menegakkan prinsip paling menentukan bentuk sebuah microservices: <b>database per service</b>. Setiap service memiliki database miliknya sendiri, tidak ada yang boleh membaca atau menulis database service lain secara langsung, dan tidak ada sama sekali join lintas service — kalau order-service butuh data produk, ia bertanya lewat API catalog-service. Secara teknis kita membahas koneksi database/sql dengan driver pgx, connection pooling, parameterized query, transaksi Commit dan Rollback, schema migration dengan golang-migrate, repository pattern, pagination, unique constraint untuk idempotency dasar, query timeout, serta integration test singkat.'
  ],
  objectives: [
    'Menjelaskan prinsip database per service beserta harga yang harus dibayar',
    'Membuka koneksi PostgreSQL dengan database/sql dan pgx stdlib serta mengatur pooling',
    'Menerapkan parameterized query, transaksi, dan query timeout dengan context',
    'Mengelola skema database dengan golang-migrate dan membangun repository pattern'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Database Dipisah per Service</h3><p>Database bersama terdengar hemat, tetapi ia diam-diam mengikat seluruh tim. Begitu <code>order_service</code> melakukan join dengan tabel <code>products</code>, perubahan skema katalog langsung mematahkan pesanan dan deploy dua service harus selalu berpasangan — persis gejala distributed monolith dari Bab 1. Dengan database terpisah: <b>kepemilikan jelas</b> (hanya catalog-service yang menyentuh <code>catalog_db</code>), <b>deploy bebas</b> (migrasi skema terjadi di dalam satu service), <b>skala sesuai kebutuhan</b>, dan <b>kegagalan terisolasi</b> (habisnya koneksi di katalog tidak ikut mengeringkan pesanan). Harganya: kamu kehilangan join antar domain, diganti dengan panggilan API atau event, dan konsistensi antar service menjadi <i>eventual</i> — berubah di waktu, tidak seketika. Pertukaran yang perlu kamu sadari sejak awal.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Skema Database catalog_db dan order_db',
      lang: 'sql',
      output: false,
      code: `CREATE TABLE products (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL,
    price      BIGINT      NOT NULL CHECK (price > 0),   -- rupiah bulat
    stock      INT         NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_created_at ON products (created_at DESC);
-- order_service memakai database TERPISAH: tanpa foreign key ke products
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT        NOT NULL UNIQUE,           -- penangkal pesan kembar
    product_id      UUID        NOT NULL,                  -- referensi biasa, bukan relasi
    quantity        INT         NOT NULL CHECK (quantity > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      explain: [
        '<code>gen_random_uuid()</code> tersedia bawaan di PostgreSQL 13+, jadi tidak perlu ekstensi tambahan; UUID cocok untuk id yang dibuat klien maupun server dan menyulitkan penembak menebak data.',
        'Perhatikan <b>tidak ada</b> foreign key dari <code>orders.product_id</code> ke <code>products.id</code>: keduanya berada di database berbeda dan tidak boleh di-join. Referensi silang antar service disimpan sebagai data biasa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Koneksi, Pooling, dan Parameterized Query</h3><p>Go memakai <code>database/sql</code> sebagai antarmuka standar, dengan driver PostgreSQL dari <b>pgx</b> yang didaftarkan lewat import kosong <code>_ "github.com/jackc/pgx/v5/stdlib"</code>. Satu hal wajib dipahami: <code>sql.DB</code> bukan satu koneksi, melainkan <b>pool</b> — setiap <code>QueryContext</code> meminjam satu koneksi lalu mengembalikannya. Karena itu ukuran pool harus diatur: terlalu kecil membuat antrean, terlalu besar membuat PostgreSQL menolak koneksi. <code>sql.Open</code> juga tidak memastikan database hidup; hanya <code>PingContext</code> yang membuktikannya, sehingga service gagal cepat saat startup, bukan melayani request lalu penuh error.</p><p>Untuk kueri, PostgreSQL menandai parameter dengan <code>$1</code>, <code>$2</code>, dan seterusnya; nilainya dikirim <b>terpisah</b> dari teks query oleh driver. Inilah penangkal utama <b>SQL injection</b>. Jangan pernah menulis <code>"... WHERE name = \'" + in.Name + "\'"</code> — nama yang berisi kutipan dan perintah SQL akan mengubah struktur kueri. Selalu <code>QueryRowContext(ctx, "SELECT ... WHERE id = $1", id)</code>.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Membuka Koneksi dan Mengatur Pool',
      lang: 'go',
      output: false,
      code: `import (
    "context"
    "database/sql"
    "time"
    _ "github.com/jackc/pgx/v5/stdlib" // mendaftarkan driver "pgx"
)

func OpenDB(dsn string) (*sql.DB, error) {
    db, err := sql.Open("pgx", dsn) // belum membuka koneksi, hanya menyiapkan pool
    if err != nil {
        return nil, fmt.Errorf("buka koneksi: %w", err)
    }
    db.SetMaxOpenConns(20)                  // batas koneksi aktif ke PostgreSQL
    db.SetMaxIdleConns(10)                  // koneksi disiapkan agar murah saat lonjakan
    db.SetConnMaxLifetime(30 * time.Minute) // koneksi berganti secara berkala
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    if err := db.PingContext(ctx); err != nil { // buktikan database benar-benar hidup
        return nil, fmt.Errorf("ping database: %w", err)
    }
    return db, nil
}`,
      explain: [
        'DSN dibaca dari environment variable, bukan ditulis di kode — mengikuti prinsip config pada 12-Factor; untuk lokal cukup <code>postgres://oms:oms@localhost:5432/catalog_db?sslmode=disable</code>.',
        'Angka <code>MaxOpenConns</code> harus dihitung: 20 koneksi dikali 10 replica service sama dengan 200 koneksi; bila batas PostgreSQL 100, ada yang akan menunggu atau ditolak.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Transaksi Begin, Commit, Rollback',
      lang: 'go',
      output: false,
      code: `// Kurangi stok dan catat pesanan harus terjadi bersama atau tidak sama sekali
func (r *pgOrderRepo) Create(ctx context.Context, key, productID string, qty int) (string, error) {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return "", fmt.Errorf("mulai transaksi: %w", err)
    }
    defer tx.Rollback() // aman dipanggil dua kali; tidak berpengaruh setelah Commit
    res, err := tx.ExecContext(ctx,
        "UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1", qty, productID)
    if err != nil {
        return "", fmt.Errorf("kurangi stok: %w", err)
    }
    if n, _ := res.RowsAffected(); n == 0 {
        return "", ErrStokTidakCukup // stok kurang atau id tidak ada
    }
    var orderID string
    if err := tx.QueryRowContext(ctx,
        "INSERT INTO orders (idempotency_key, product_id, quantity) VALUES ($1, $2, $3) RETURNING id",
        key, productID, qty).Scan(&orderID); err != nil {
        return "", fmt.Errorf("simpan pesanan: %w", err)
    }
    if err := tx.Commit(); err != nil { return "", fmt.Errorf("commit transaksi: %w", err) }
    return orderID, nil
}`,
      explain: [
        '<code>defer tx.Rollback()</code> adalah pola idiomatik: bila fungsi keluar karena error sebelum Commit, rollback berjalan otomatis; bila sudah Commit, panggilan rollback berikutnya tidak berpengaruh.',
        'Kondisi <code>stock &gt;= $1</code> pada WHERE membuat validasi stok berjalan atomik di database — dua pesanan bersamaan tidak bisa membuat stok minus.',
        'Catatan arsitektur: potongan stok berada di dalam <code>catalog_db</code>, jadi pada sistem nyata perintah ini dijalankan catalog-service (dipanggil order-service lewat API), bukan dibaca langsung dari order-service.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Schema Migration dengan golang-migrate</h3><p>Skema database harus dikelola sebagai kode: setiap perubahan berupa sepasang berkas SQL bernomor — <code>...up.sql</code> untuk menerapkan dan <code>...down.sql</code> untuk mengurungkan. Alat <b>golang-migrate</b> menyimpan versi terakhir yang sudah diterapkan di tabel <code>schema_migrations</code>, sehingga migrasi tidak pernah dijalankan dua kali dan bisa ditarik mundur saat rollback. Migrasi berjalan sebagai langkah terpisah sebelum service memulai versi barunya; pastikan juga <code>migrate down</code> benar-benar diuji, bukan sekadar ditulis.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Menjalankan PostgreSQL dan Migrasi via Docker',
      lang: 'bash',
      output: false,
      code: `docker run -d --name oms-catalog-db -e POSTGRES_USER=oms -e POSTGRES_PASSWORD=oms \\
  -e POSTGRES_DB=catalog_db -p 5432:5432 -v oms-catalog-data:/var/lib/postgresql/data postgres:16
migrate -path services/catalog/migrations \\
  -database "postgres://oms:oms@localhost:5432/catalog_db?sslmode=disable" up
docker exec -it oms-catalog-db psql -U oms -d catalog_db -c '\\dt'
docker exec -it oms-catalog-db psql -U oms -d catalog_db -c "SELECT * FROM products;"`,
      explain: [
        'Named volume <code>oms-catalog-data</code> membuat data tetap ada walau container dihapus; tanpa itu seluruh produk lenyap setiap kali database dijalankan ulang.',
        'Flag <code>-path</code> menunjuk folder migrasi milik service itu sendiri — bukti nyata database adalah milik per service.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Repository Pattern dan Record yang Tidak Ditemukan</h3><p><b>Repository</b> mengisolasi SQL dari logika bisnis: handler hanya bicara dengan interface, sementara detail query ada di implementasi PostgreSQL. Setiap method menerima <code>ctx</code> agar bisa diberi timeout, dan error khas database (<code>sql.ErrNoRows</code>) diterjemahkan menjadi error sentinel milik service — <code>ErrRecordNotFound</code>. Error mentah database sering memuat nama tabel, teks query, sampai alamat host; jangan pernah meneruskannya ke klien. Terjemahkan di lapisan repository menjadi error domain, lalu balut menjadi pesan generik di handler — detailnya dicatat di log server.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Interface ProductRepository dan Implementasi pgx',
      lang: 'go',
      output: false,
      code: `var ErrRecordNotFound = errors.New("produk tidak ditemukan")

type ProductRepository interface {
    FindByID(ctx context.Context, id string) (Product, error)
    List(ctx context.Context, limit, offset int) ([]Product, error)
}
type pgProductRepo struct{ db *sql.DB }

func (r *pgProductRepo) FindByID(ctx context.Context, id string) (Product, error) {
    var p Product
    err := r.db.QueryRowContext(ctx, // $1 = parameter terpisah, aman dari SQL injection
        "SELECT id, name, price, stock, created_at FROM products WHERE id = $1", id,
    ).Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.CreatedAt)
    if errors.Is(err, sql.ErrNoRows) {
        return Product{}, ErrRecordNotFound // "tidak ada", bukan kegagalan teknis
    }
    if err != nil {
        return Product{}, fmt.Errorf("cari produk %s: %w", id, err)
    }
    return p, nil
}
func (r *pgProductRepo) List(ctx context.Context, limit, offset int) ([]Product, error) {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second) // query tidak boleh menggantung
    defer cancel()
    rows, err := r.db.QueryContext(ctx,
        "SELECT id, name, price, stock, created_at FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        limit, offset)
    if err != nil {
        return nil, fmt.Errorf("daftar produk: %w", err)
    }
    defer rows.Close() // WAJIB: kembalikan koneksi ke pool
    out := make([]Product, 0, limit)
    for rows.Next() {
        var p Product
        if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.CreatedAt); err != nil {
            return nil, fmt.Errorf("baca baris produk: %w", err)
        }
        out = append(out, p)
    }
    return out, rows.Err()
}`,
      explain: [
        'Urutan <code>Scan</code> harus persis mengikuti urutan kolom SELECT — kesalahan urutan adalah bug paling sering di lapisan ini; <code>rows.Close()</code> dengan defer menutup rows walau terjadi error di tengah.',
        'Pagination memakai <code>LIMIT</code> dan <code>OFFSET</code>; untuk data yang terus bertambah dan butuh halaman stabil, kelak gunakan pagination berbasis <code>keyset</code> (cursor) agar baris tidak melompat. Timeout dibuat dari ctx agar kueri lambat tidak menggantung selamanya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Unique Constraint sebagai Idempotency Dasar</h3><p>Satu keunggulan yang jarang disadari: database sudah punya alat idempotency bawaan. Kolom <code>idempotency_key</code> dengan constraint <code>UNIQUE</code> membuat request ulang dengan kunci yang sama otomatis ditolak, lengkap dengan <code>ON CONFLICT ... DO NOTHING</code>. Order-service cukup mengirim kunci dari header <code>Idempotency-Key</code>; bila <code>RETURNING id</code> tidak mengembalikan apa pun, berarti pesanan dengan kunci itu sudah pernah dibuat dan respons lama tinggal dikirim ulang.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Integration Test yang Aman Dijalankan di Mana Saja',
      lang: 'go',
      output: false,
      code: `func TestProductRepo_FindByID(t *testing.T) {
    dsn := os.Getenv("TEST_DATABASE_URL")
    if dsn == "" {
        t.Skip("TEST_DATABASE_URL kosong, lewati integration test")
    }
    db, err := OpenDB(dsn)
    if err != nil {
        t.Fatalf("buka koneksi: %v", err)
    }
    defer db.Close()
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    repo := &pgProductRepo{db: db}
    // jalankan migrasi ke database uji dulu; jangan pernah menunjuk database produksi
    if _, err := repo.FindByID(ctx, "00000000-0000-0000-0000-000000000000"); !errors.Is(err, ErrRecordNotFound) {
        t.Errorf("cari id tak dikenal: err = %v, want ErrRecordNotFound", err)
    }
}`,
      explain: [
        'Pola <b>skip</b> membuat test ini tetap bisa dijalankan siapa pun: tanpa database uji ia melewati dirinya sendiri, di CI ia berjalan penuh dengan <code>TEST_DATABASE_URL</code> yang disuntikkan lewat environment.',
        'Test ini menyentuh PostgreSQL sungguhan — menemukan masalah yang tidak mungkin terlihat dari mock, misal perilaku constraint CHECK dan zona waktu TIMESTAMPTZ.'
      ]
    },
    {
      type: 'tip',
      title: 'Latihan Mandiri',
      text: 'Rangkai semuanya pada catalog-service. (1) Jalankan PostgreSQL lewat docker run, buat migrasi products dengan golang-migrate, lalu buktikan <code>migrate down</code> berfungsi. (2) Ganti seluruh penyimpanan in-memory Bab 3 dengan pgProductRepo dan sesuaikan handler agar menjawab 404 ketika ErrRecordNotFound. (3) Uji SQL injection sungguhan: kirim nama produk yang berisi teks SQL berbahaya dan pastikan ia tersimpan sebagai nama biasa. (4) Tambahkan endpoint pagination <code>GET /products?limit=10&amp;offset=20</code> beserta header <code>X-Total-Count</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Database per service', 'Setiap service memiliki database sendiri dan tidak ada yang boleh mengaksesnya secara langsung.'],
        ['database/sql', 'Standar library Go untuk antarmuka koneksi dan pooling database.'],
        ['pgx', 'Driver PostgreSQL modern untuk Go; dipakai lewat adapter stdlib dengan nama driver pgx.'],
        ['Connection pooling', 'Mengelola sekumpulan koneksi yang dipakai ulang; diatur dengan SetMaxOpenConns dan SetConnMaxLifetime.'],
        ['Parameterized query', 'Query dengan placeholder ($1) yang nilainya dikirim terpisah sehingga aman dari SQL injection.'],
        ['Transaksi', 'Kumpulan operasi yang berjalan atomik: Commit untuk menyimpan, Rollback untuk membatalkan.'],
        ['Schema migration', 'Perubahan skema database berupa berkas SQL bernomor yang dikelola dan dicatat versinya.'],
        ['Repository pattern', 'Lapisan yang mengisolasi akses database di balik interface sehingga logika bisnis bebas dari SQL.'],
        ['ErrRecordNotFound', 'Error sentinel yang menggantikan sql.ErrNoRows agar tidak bocor ke lapisan luar.'],
        ['Idempotency', 'Sifat operasi yang hasilnya sama meski diulang; dasarnya bisa berupa unique constraint di database.']
      ]
    }
  ],
  recap: [
    'Database per service berarti kepemilikannya jelas dan deploy merdeka; imbalannya, join antar domain diganti panggilan API dan konsistensi menjadi eventual.',
    'sql.DB adalah connection pool, bukan satu koneksi; ukur MaxOpenConns sesuai batas PostgreSQL dan aktifkan PingContext saat startup.',
    'PostgreSQL memakai placeholder $1; kirim nilai terpisah lewat parameterized query agar aman dari SQL injection.',
    'Transaksi dibangun dengan BeginTx, Commit, dan defer Rollback; validasi stok diletakkan di dalam WHERE agar atomik.',
    'Skema dikelola golang-migrate, repository menyembunyikan SQL di balik interface, dan ErrRecordNotFound menggantikan sql.ErrNoRows.',
    'Unique constraint plus ON CONFLICT memberi idempotency dasar, dan query selalu dibatasi timeout lewat context.'
  ]
});
