/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 3: Database MariaDB
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-mariadb',
  title: 'Database MariaDB & Database-per-Service',
  chapter: 'Fondasi',
  duration: '14 menit',
  intro: [
    'Mikroservice hanya sebaik pemisahan datanya. Bab ini membangun fondasi penyimpanan TokoKita: <b>satu instance MariaDB</b> yang menampung <b>tiga database terpisah</b> — <code>product_db</code>, <code>order_db</code>, dan <code>notification_db</code> — lengkap dengan pengguna database khusus tiap service agar batas kepemilikan itu dipertegas oleh izin, bukan hanya oleh kesepakatan.',
    'Kita akan menulis berkas migrasi SQL yang dijalankan otomatis oleh container MariaDB saat pertama boot, memahami persis mengapa skema pesanan menyimpan salinan nama dan harga produk, lalu menguji koneksi dari dalam container memakai DSN yang nantinya dipakai ketiga service Go.',
    'Di akhir bab, seluruh data TokoKita sudah siap menyambut aplikasi: tabel terbentuk, data contoh tertanam, dan tiap service memegang kredensial yang <b>hanya berlaku untuk database miliknya sendiri</b>.'
  ],
  objectives: [
    'Menulis migrasi SQL yang membuat database, pengguna khusus, tabel, dan data awal dalam satu berkas',
    'Menjalankan migrasi otomatis lewat mount docker-entrypoint-initdb.d pada container MariaDB',
    'Menjelaskan konsekuensi database-per-service: hilangnya JOIN lintas database dan munculnya snapshot transaksi',
    'Menyusun DSN koneksi yang benar untuk dipakai service Go',
    'Mengakses dan memeriksa isi tiap database dari terminal dengan mariadb client'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Tiga Database, Bukan Satu?</h3><p>Container MariaDB di TokoKita hanya satu, tetapi di dalamnya ada tiga database yang berdiri sendiri. Tiap service memegang pengguna database yang <b>hanya diberi izin atas satu database</b> — product-service tidak bisa membaca <code>order_db</code> meski teknisnya berada pada mesin yang sama.</p><p>Inilah penerapan paling jujur dari database-per-service dalam ukuran proyek belajar: kamu mendapat pembatasan kepemilikan sungguhan tanpa perlu menyiapkan tiga server database sekaligus. Ketika nanti satu service layak digeser ke instance terpisah, yang berubah hanya nilai DSN-nya — relasi antar service tidak pernah dirancang melalui jalur database.</p>'
    },
    {
      type: 'example',
      title: 'Peta kepemilikan data TokoKita',
      lang: 'text',
      output: false,
      code: `Instance MariaDB :3306 (satu wadah, tiga penghuni)
│
├── product_db         milik product-service
│   └── products          (id, name, category, price, stock, ...)
│
├── order_db           milik order-service
│   └── orders            (id, idempotency_key, product_id,
│                          product_name, unit_price, qty, total, ...)
│
└── notification_db    milik notification-service
    └── notifications     (id, event_id, order_id, customer, message, ...)

Pengguna database (izin per database):
  product_svc     → GRANT ALL ON product_db.*
  order_svc       → GRANT ALL ON order_db.*
  notification_svc→ GRANT ALL ON notification_db.*`,
      explain: [
        'Tiap berkas migrasi membuat SATU database dan SATU pengguna yang hanya berhak atas database itu — kombinasi keduanya membuat pelanggaran batas gagal di level MySQL, bukan cuma di review kode.',
        'Nama pengguna (<code>product_svc</code>, <code>order_svc</code>, <code>notification_svc</code>) sengaja memakai akhiran <code>_svc</code> agar mudah dikenali di daftar proses dan log koneksi ketika di produksi.',
        'Tabel <code>orders</code> menyimpan <code>product_name</code> dan <code>unit_price</code> — inilah bentuk nyata keputusan snapshot yang dibahas di bab 1.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 335" width="760" role="img" aria-label="Satu instance MariaDB berisi tiga database terpisah, masing-masing diakses oleh pengguna khusus milik service-nya lewat GRANT">
        <defs><marker id="mk-fs03-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="30" y="30" width="170" height="50" rx="8" class="u-box"/>
        <text x="115" y="52" class="u-title">product-service</text>
        <text x="115" y="71" class="u-lbl" text-anchor="middle">:8081</text>
        <rect x="295" y="30" width="170" height="50" rx="8" class="u-box"/>
        <text x="380" y="52" class="u-title">order-service</text>
        <text x="380" y="71" class="u-lbl" text-anchor="middle">:8082</text>
        <rect x="560" y="30" width="170" height="50" rx="8" class="u-box"/>
        <text x="645" y="52" class="u-title">notification-service</text>
        <text x="645" y="71" class="u-lbl" text-anchor="middle">:8083</text>
        <line x1="115" y1="80" x2="115" y2="141" class="u-line" marker-end="url(#mk-fs03-1)"/>
        <text x="123" y="115" class="u-lbl">product_svc</text>
        <line x1="380" y1="80" x2="380" y2="141" class="u-line" marker-end="url(#mk-fs03-1)"/>
        <text x="388" y="115" class="u-lbl">order_svc</text>
        <line x1="645" y1="80" x2="645" y2="141" class="u-line" marker-end="url(#mk-fs03-1)"/>
        <text x="653" y="115" class="u-lbl">notification_svc</text>
        <rect x="20" y="145" width="720" height="155" rx="10" class="u-box"/>
        <text x="380" y="175" class="u-title">Satu instance MariaDB :3306 (tiga penghuni)</text>
        <rect x="40" y="192" width="210" height="90" rx="6" class="u-hl"/>
        <text x="145" y="218" class="u-title">product_db</text>
        <text x="145" y="240" class="u-lbl" text-anchor="middle">GRANT product_svc.*</text>
        <text x="145" y="262" class="u-lbl" text-anchor="middle">tabel products</text>
        <rect x="275" y="192" width="210" height="90" rx="6" class="u-hl"/>
        <text x="380" y="218" class="u-title">order_db</text>
        <text x="380" y="240" class="u-lbl" text-anchor="middle">GRANT order_svc.*</text>
        <text x="380" y="262" class="u-lbl" text-anchor="middle">orders (snapshot + idem)</text>
        <rect x="510" y="192" width="210" height="90" rx="6" class="u-hl"/>
        <text x="615" y="218" class="u-title">notification_db</text>
        <text x="615" y="240" class="u-lbl" text-anchor="middle">GRANT notification_svc.*</text>
        <text x="615" y="262" class="u-lbl" text-anchor="middle">notifications (event_id UNIQUE)</text>
        <text x="380" y="325" class="u-lbl" text-anchor="middle">database-per-service: order_svc DILARANG membaca product_db — izin MySQL yang menegakkannya</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Satu instance MariaDB, tiga database terpisah, tiga pengguna dengan GRANT masing-masing</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Migrasi yang Dijalankan Otomatis</h3><p>Container resmi MariaDB memiliki kebiasaan yang sangat berguna: setiap berkas <code>.sql</code> di folder <code>/docker-entrypoint-initdb.d</code> akan dieksekusi <b>hanya sekali</b>, saat database kosong untuk pertama kali. Kita memanfaatkannya sebagai sistem migrasi paling sederhana yang mungkin ada — tanpa tool tambahan, tanpa langkah manual yang bisa dilupakan.</p>'
    },
    {
      type: 'example',
      title: 'Migrasi 001_product.sql (lengkap)',
      lang: 'sql',
      output: false,
      code: `-- Dijalankan otomatis saat MariaDB boot pertama kali
CREATE DATABASE IF NOT EXISTS product_db;
CREATE USER IF NOT EXISTS 'product_svc'@'%' IDENTIFIED BY 'product-local';
GRANT ALL PRIVILEGES ON product_db.* TO 'product_svc'@'%';

USE product_db;

CREATE TABLE IF NOT EXISTS products (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(120)    NOT NULL,
    category    VARCHAR(60)     NOT NULL DEFAULT 'umum',
    price       INT UNSIGNED    NOT NULL,
    stock       INT UNSIGNED    NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data awal supaya tampilan langsung terisi saat pertama dijalankan
INSERT INTO products (name, category, price, stock) VALUES
    ('Kopi Arabika Gayo', 'minuman', 85000, 40),
    ('Teh Melati Premium', 'minuman', 32000, 75),
    ('Keripik Singkong Balado', 'makanan', 18000, 120),
    ('Cokelat Batang 70%', 'makanan', 45000, 30),
    ('Air Mineral 600ml', 'minuman', 4000, 500);`,
      explain: [
        '<code>IF NOT EXISTS</code> pada database, user, dan tabel membuat migrasi <b>idempoten</b> — dijalankan dua kali tidak menimbulkan galat, penting saat kamu mengulang setup.',
        '<code>GRANT ALL ... TO \'product_svc\'@\'%\'</code> memberi izin penuh HANYA pada product_db; sufiks <code>@\'%\'</code> berarti host mana pun (termasuk container service) boleh menghubungi.',
        'Kolom <code>updated_at ... ON UPDATE CURRENT_TIMESTAMP</code> menstempel sendiri setiap kali baris berubah — penghematan kode pada setiap handler UPDATE.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengapa Pesanan Menyimpan Salinan Nama & Harga?</h3><p>Karena product-service tidak boleh menyentuh <code>order_db</code>, dan sebaliknya order-service tidak boleh menyentuh <code>product_db</code>, order-service tidak bisa menulis <code>JOIN products</code> untuk menampilkan riwayat pesanan. Kalau tabel pesanan hanya menyimpan <code>product_id</code>, maka:</p><ul><li>Harga per hari pemesanan tidak akan pernah bisa ditampilkan ulang setelah harga produk berubah (yang sering terjadi saat promo).</li><li>Riwayat pesanan produk yang sudah dihapus dari katalog akan menampilkan nama kosong.</li><li>Setiap pembacaan riwayat membutuhkan satu panggilan HTTP tambahan ke product-service — menambah titik gagal.</li></ul><p>Solusinya adalah <b>snapshot</b>: saat pesanan dibuat, nama dan harga yang saat itu berlaku ikut disalin ke tabel pesanan. Data transaksi menjadi mandiri dan historis — persis seperti nota belanja fisik yang tetap terbaca walau toko sudah mengganti harga.</p>'
    },
    {
      type: 'example',
      title: 'Migrasi 002_order.sql — tabel dengan idempotency key',
      lang: 'sql',
      output: false,
      code: `CREATE DATABASE IF NOT EXISTS order_db;
CREATE USER IF NOT EXISTS 'order_svc'@'%' IDENTIFIED BY 'order-local';
GRANT ALL PRIVILEGES ON order_db.* TO 'order_svc'@'%';

USE order_db;

CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    idempotency_key VARCHAR(64)     NOT NULL,
    product_id      BIGINT UNSIGNED NOT NULL,   -- rujukan (cross-service)
    product_name    VARCHAR(120)    NOT NULL,   -- snapshot
    unit_price      INT UNSIGNED    NOT NULL,   -- snapshot harga saat beli
    qty             INT UNSIGNED    NOT NULL,
    total           INT UNSIGNED    NOT NULL,
    customer        VARCHAR(120)    NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'confirmed',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_idempotency (idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      explain: [
        '<code>UNIQUE KEY uq_orders_idempotency</code> adalah penjaga utama TokoKita: ketika klien mengirim ulang request yang sama, INSERT kedua ditolak database dengan galat 1062, dan order-service menjawabnya dengan pesanan LAMA — bukan membuat duplikat.',
        'Empat kolom snapshot berdampingan dengan <code>product_id</code>: ID dipakai untuk telusur ke katalog, salinan dipakai untuk riwayat — keduanya punya tugas berbeda.',
        'Kolom <code>total</code> ikut disimpan meski bisa dihitung dari <code>unit_price * qty</code>: hasil perhitungan disimpan (materialisasi) agar laporan keuangan tidak bergantung pada logika yang bisa berubah.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan seluruh migrasi lewat komposer',
      lang: 'bash',
      output: false,
      code: `# compose.yaml memasang folder ./migrations ke lokasi init MariaDB
#   volumes:
#     - ./migrations:/docker-entrypoint-initdb.d:ro

podman-compose up -d mariadb

# Tunggu sampai sehat, lalu periksa hasilnya
podman exec -it <container-mariadb> \\
  mariadb -uroot -proot-local -e "SHOW DATABASES;"

# Harus muncul: product_db, order_db, notification_db (+ db bawaan)
# Periksa tabel & data contoh
podman exec -it <container-mariadb> \\
  mariadb -uroot -proot-local product_db \\
  -e "SELECT id, name, price, stock FROM products;"`,
      explain: [
        'Mount memakai <code>:ro</code> (read-only): container MariaDB hanya membaca migrasi, tidak pernah mengubah berkas di host — kebersihan yang layak dibiasakan.',
        'Folder init hanya diproses saat data diri-simpan masih kosong. Setelah perubahan migrasi, kamu perlu <code>down -v</code> (menghapus volume) agar migrasi dijalankan ulang dari nol.',
        'Perintah <code>-e</code> pada mariadb client mengeksekusi query langsung dari terminal — memeriksa isi database tanpa memasang tool GUI tambahan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>DSN: Cara Service Go Menyambung Database</h3><p>Setiap service menerima <code>DB_DSN</code> sebagai variabel lingkungan. Format DSN MySQL adalah <code>user:password@tcp(host:port)/database?parameter</code>. Parameter <code>parseTime=true</code> wajib ada agar kolom <code>TIMESTAMP</code> ter-scan menjadi <code>time.Time</code> Go, dan <code>charset=utf8mb4</code> memastikan teks Indonesia (dengan aksennya) tersimpan aman.</p>'
    },
    {
      type: 'example',
      title: 'Tiga DSN TokoKita (nilai yang dipasang di compose.yaml)',
      lang: 'text',
      output: false,
      code: `# product-service
DB_DSN=product_svc:product-local@tcp(mariadb:3306)/product_db?parseTime=true&charset=utf8mb4

# order-service
DB_DSN=order_svc:order-local@tcp(mariadb:3306)/order_db?parseTime=true&charset=utf8mb4

# notification-service
DB_DSN=notification_svc:notification-local@tcp(mariadb:3306)/notification_db?parseTime=true&charset=utf8mb4

  └── bagian       makna
       product_svc  pengguna MySQL (izin hanya di product_db)
       product-local kata sandinya
       mariadb      NAMA SERVICE di network compose (bukan localhost!)
       3306         port bawaan MariaDB
       product_db   database tujuan
       parseTime=true  wajib: kolom TIMESTAMP → time.Time Go`,
      explain: [
        'Bagian host memakai <code>mariadb</code> — nama service dalam komposer — karena service berjalan di container berbeda. Nilai <code>localhost</code> hanya tepat ketika menjalankan service langsung dari host (mode pengembangan).',
        'Host di pengguna adalah <code>%</code> (semua host) sehingga koneksi dari container service mana pun diterima; bila perlu dipersempit, ubah menjadi nama container service tertentu.',
        'Setiap service memakai pengguna berbeda — bila product-service bocor ke order_db, galat izin akan langsung terlihat di log sebagai bukti batas kepemilikan bekerja.'
      ]
    },
    {
      type: 'example',
      title: 'Memeriksa ketiga database dari terminal',
      lang: 'bash',
      output: false,
      code: `# Masuk sebagai root untuk pemeriksaan (di produksi: hindari root!)
podman exec -it <container-mariadb> \\
  mariadb -uroot -proot-local

-- dalam mariadb client:
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User LIKE '%_svc';
SHOW GRANTS FOR 'order_svc'@'%';

-- buktikan order_svc TIDAK bisa membaca product_db:
EXIT;

podman exec -it <container-mariadb> \\
  mariadb -uorder_svc -porder-local product_db \\
  -e "SELECT COUNT(*) FROM products;"
-- → ERROR 1044: Access denied (bukan miliknya!)`,
      explain: [
        '<code>SHOW GRANTS</code> menampilkan izin nyata sebuah pengguna — cara tercepat memverifikasi bahwa pemisahan database benar-benar aktif, bukan cuma tersirat di berkas migrasi.',
        'Uji terakhir sengaja membuat order_svc membaca product_db: <b>galat akses yang muncul adalah keberhasilan</b>, bukan kegagalan — itulah pembatas kepemilikan yang bekerja.',
        'Simpan perintah ini sebagai bagian checklist verifikasi setelah mengubah migrasi apa pun.'
      ]
    },
    {
      type: 'tip',
      title: 'Satu Instance MariaDB, Tiga Langkah Backup',
      text: 'Karena ketiga database berada pada satu instance, backup harian cukup satu perintah: <code>podman exec &lt;container&gt; mariadb-dump -uroot -p... --all-databases</code>. Namun ingat konsekuensinya: backup terpadu juga berarti <b>kegagalan instance mengenai ketiga service sekaligus</b> — di produksi nyata, itulah alasan utama akhirnya tiap service digeser ke instance terpisah.'
    },
    {
      type: 'warn',
      title: 'Migrasi yang Sudah Berjalan Tidak Dijalankan Ulang',
      text: 'Berkas di folder init hanya dieksekusi ketika direktori data MariaDB masih kosong. Begitu kamu mengedit migrasi, perubahan tidak akan terbawa — kecuali kamu menjalankan <code>podman-compose down -v</code> untuk menghapus volume lalu boot ulang. <b>Flag -v menghapus data sungguhan</b>; jalankan hanya saat kamu benar-benar siap memulai dari nol, bukan sebagai kebiasaan.'
    },
    {
      type: 'vocab',
      items: [
        ['Migrasi (migration)', 'Berkas SQL berurutan yang menerapkan perubahan skema database; di TokoKita dijalankan otomatis oleh entrypoint MariaDB saat boot pertama.'],
        ['Idempoten', 'Sifat suatu operasi yang boleh dijalankan berulang tanpa mengubah hasil akhir — dicapai lewat IF NOT EXISTS pada migrasi.'],
        ['Snapshot transaksi', 'Penyalinan data asli (nama, harga) ke dalam catatan transaksi saat kejadian, agar riwayat tetap akurat walau data asli berubah.'],
        ['GRANT', 'Perintah MySQL untuk memberi izin spesifik sebuah pengguna atas database tertentu — dasar penerapan database-per-service.'],
        ['DSN', 'Data Source Name: string satu baris berisi host, port, pengguna, kata sandi, database, dan opsi koneksi untuk driver database.'],
        ['parseTime', 'Opsi DSN go-sql-driver/mysql yang membuat kolom DATE/TIMESTAMP ter-scan menjadi time.Time Go, bukan []byte.'],
        ['Updatable timestamp', 'Kolom yang diperbarui otomatis oleh database (ON UPDATE CURRENT_TIMESTAMP) setiap kali barisnya berubah.'],
        ['Volume container', 'Disk persisten di luar container; folder init MariaDB dipasang read-only, sementara /var/lib/mysql ditampung volume agar data bertahan.']
      ]
    }
  ],
  recap: [
    'Satu instance MariaDB menampung tiga database terpisah (product_db, order_db, notification_db), masing-masing dengan pengguna yang izinnya hanya mencakup satu database.',
    'Migrasi berupa berkas .sql di folder /docker-entrypoint-initdb.d yang dieksekusi otomatis hanya saat database masih kosong; perubahan migrasi membutuhkan volume dihapus (down -v).',
    'Tabel pesanan menyimpan snapshot nama dan harga produk karena database-per-service melarang JOIN lintas database — riwayat tetap akurat walau produk berubah atau dihapus.',
    'Kunci UNIQUE pada idempotency_key membuat pengulangan request tidak pernah menghasilkan pesanan ganda.',
    'DSN memakai nama service compose sebagai host, parseTime=true agar kolom TIMESTAMP ter-scan menjadi time.Time Go, dan tiap service memakai pengguna database yang berbeda.'
  ]
});
