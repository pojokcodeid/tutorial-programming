/* ============================================================
   Pelajaran Go REST API — Bab 9: Integration Testing
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-integration-testing',
  title: 'Integration Testing dengan Database Sungguhan',
  chapter: 'Testing',
  duration: '12 menit',
  intro: [
    'Unit test memastikan logika benar dengan asumsi tertentu. <b>Integration test</b> memastikan lapisan-lapisan itu benar-benar bekerja bersama — termasuk query SQL sungguhan, tipe data, dan constraint database.',
    'Pelajaran ini menguji repository terhadap MariaDB nyata, memisahkannya dengan <b>build tag</b> agar tidak ikut dijalankan saat test biasa, serta menyiapkan data test yang bersih dan deterministik.'
  ],
  objectives: [
    'Memahami perbedaan unit vs integration test',
    'Memisahkan integration test dengan build tag',
    'Menyiapkan database test terpisah + migrasi otomatis',
    'Membersihkan data agar test deterministik',
    'Menjalankan integration test dengan -tags=integration'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Perlu Integration Test?</h3><p>Repository bisa "lolos" unit test dengan mock, tapi tetap salah dalam kenyataan — misalnya urutan kolom <code>Scan</code> tidak sesuai SELECT, kolom TIMESTAMP gagal dibaca, atau constraint unique tidak tertangani. Integration test menangkap semua ini dengan menjalankan kode terhadap database sungguhan.</p>'
    },
    {
      type: 'example',
      title: 'Perbandingan dua jenis test',
      lang: 'text',
      output: false,
      code: `Unit test          : service ← mock repository (memori)
                     ✔ cepat · deterministik · tanpa DB
                     ✘ tidak menguji SQL asli

Integration test   : repository ← MariaDB sungguhan
                     ✔ menguji query, tipe data, constraint
                     ✔ butuh database · sedikit lebih lambat`,
      explain: [
        'Keduanya melengkapi, bukan menggantikan — idealnya keduanya berjalan di CI.',
        'Integration test fokus di lapisan repository (satu-satunya yang bersentuhan SQL).',
        'Lapisan service tetap diuji unit test karena logikanya tidak butuh database.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Build Tag: Memisahkan Integration Test</h3><p>Integration test tidak boleh ikut saat <code>go test ./...</code> biasa (mis. di lingkungan tanpa database). Caranya dengan <b>build tag</b>: baris komentar khusus di paling atas file yang menentukan kapan file ikut dikompilasi.</p>'
    },
    {
      type: 'example',
      title: 'Dua baris wajib di paling atas file',
      lang: 'go',
      output: false,
      code: `//go:build integration

package repository

// ... isi test ...`,
      explain: [
        '<code>//go:build integration</code> harus berada di ATAS blok package, dipisah baris kosong.',
        'Tanpa flag <code>-tags=integration</code>, file ini diabaikan sepenuhnya oleh kompilator.',
        'Berkat ini, <code>go test ./...</code> tetap aman dijalankan di mana pun.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan dua mode test',
      lang: 'bash',
      output: false,
      code: `# Test biasa — integration test TIDAK ikut
go test ./...
# ok  example.com/go-restapi/internal/repository [no test files]

# Integration test — dengan tag
go test -tags=integration ./internal/repository/ -v`,
      explain: [
        'Pesan <code>[no test files]</code> menandakan semua file test di package itu ber-tag integration.',
        'Flag <code>-tags</code> menambahkan tag yang diperlukan agar file ikut dikompilasi.',
        'Di CI, kedua perintah bisa dijalankan pada job terpisah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Database Test Terpisah</h3><p>Integration test <b>tidak boleh</b> memakai database aplikasi — data produksi bisa terhapus! Sediakan database khusus test (mis. <code>gorestapi_test</code>) dengan kredensial dari environment variable, sehingga aman dijalankan di mana pun.</p>'
    },
    {
      type: 'example',
      title: 'Membuka koneksi test dari environment',
      lang: 'go',
      output: false,
      code: `func openTestDB(t *testing.T) *sql.DB {
    t.Helper() // menandai fungsi ini sebagai pembantu test

    host := envOr("DB_TEST_HOST", "localhost")
    user := envOr("DB_TEST_USER", "root")
    pass := envOr("DB_TEST_PASS", "root")
    name := envOr("DB_TEST_NAME", "gorestapi_test") // DB KHUSUS test

    dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?parseTime=true",
        user, pass, host, name)
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        t.Fatalf("gagal membuka koneksi test: %v", err)
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := db.PingContext(ctx); err != nil {
        t.Skipf("MariaDB tidak tersedia, lewati: %v", err)
    }

    applyMigrations(t, db) // pastikan tabel ada
    return db
}`,
      explain: [
        '<code>t.Skipf</code> MELEWATI test (bukan gagal) jika database tidak tersedia — berguna di mesin tanpa MariaDB.',
        'Kredensial test dibaca dari env <code>DB_TEST_*</code>, terpisah dari env aplikasi.',
        '<code>t.Helper()</code> membuat lokasi error menunjuk ke pemanggil, bukan ke helper.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Data Test yang Bersih & Deterministik</h3><p>Agar hasil test tidak saling memengaruhi, setiap test memulai dari keadaan yang diketahui. Caranya: <b>bersihkan tabel</b> di awal test, dan tanam data awal (seeding) bila dibutuhkan — mis. user sebagai pemilik produk karena ada foreign key.</p>'
    },
    {
      type: 'example',
      title: 'Membersihkan & menanam data test',
      lang: 'go',
      output: false,
      code: `func cleanProducts(t *testing.T, db *sql.DB) {
    t.Helper()
    if _, err := db.Exec(\`DELETE FROM products\`); err != nil {
        t.Fatalf("gagal membersihkan products: %v", err)
    }
}

func seedUser(t *testing.T, db *sql.DB, username string) int64 {
    t.Helper()
    // ON DUPLICATE KEY UPDATE id = id → idempoten (aman diulang)
    _, err := db.Exec(
        \`INSERT INTO users (username, email, password_hash, role)
         VALUES (?, ?, ?, 'user')
         ON DUPLICATE KEY UPDATE id = id\`,
        username, username+"@mail.com", "$2a$10$fake",
    )
    if err != nil {
        t.Fatalf("gagal menanam user: %v", err)
    }
    var id int64
    db.QueryRow(\`SELECT id FROM users WHERE username = ?\`, username).Scan(&id)
    return id
}`,
      explain: [
        'Foreign key <code>created_by</code> mewajibkan user pemilik ada sebelum produk dibuat.',
        '<code>ON DUPLICATE KEY UPDATE id = id</code> membuat seeding aman dijalankan berkali-kali.',
        'Pembersihan di awal test membuat urutan eksekusi test tidak berpengaruh.'
      ]
    },
    {
      type: 'example',
      title: 'Test CRUD lengkap terhadap MariaDB',
      lang: 'go',
      output: false,
      code: `func TestIntegration_ProductCRUD(t *testing.T) {
    db := openTestDB(t)
    defer db.Close()
    cleanProducts(t, db)

    repo := NewProductRepository(db)
    ctx := context.Background()
    ownerID := seedUser(t, db, "pemilik")

    // CREATE
    p := &model.Product{Name: "Laptop", Price: 9_500_000,
        Stock: 4, CreatedBy: ownerID}
    if err := repo.Create(ctx, p); err != nil {
        t.Fatalf("Create() error = %v", err)
    }
    if p.ID == 0 {
        t.Fatal("ID produk tidak terisi setelah insert")
    }

    // FIND — buktikan SQL SELECT & Scan bekerja sungguhan
    got, err := repo.FindByID(ctx, p.ID)
    if err != nil {
        t.Fatalf("FindByID() error = %v", err)
    }
    if got.Name != "Laptop" || got.CreatedBy != ownerID {
        t.Errorf("FindByID() = %+v", got)
    }

    // UPDATE → baca ulang untuk memastikan tersimpan
    got.Name = "Laptop Gaming"
    if err := repo.Update(ctx, got); err != nil {
        t.Fatalf("Update() error = %v", err)
    }
    again, _ := repo.FindByID(ctx, p.ID)
    if again.Name != "Laptop Gaming" {
        t.Errorf("setelah update = %+v", again)
    }

    // DELETE → pastikan benar-benar hilang
    if err := repo.Delete(ctx, p.ID); err != nil {
        t.Fatalf("Delete() error = %v", err)
    }
    if _, err := repo.FindByID(ctx, p.ID); !errors.Is(err, ErrNotFound) {
        t.Errorf("setelah delete error = %v, want ErrNotFound", err)
    }
}`,
      explain: [
        'Setiap operasi diverifikasi dengan MEMBACA ULANG data — bukan hanya memeriksa error nil.',
        'Inilah gunanya database sungguhan: membuktikan query, urutan kolom, dan tipe data benar.',
        'Alur test mengikuti siklus hidup data: create → read → update → delete.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji constraint database (duplikat unique)',
      lang: 'go',
      output: false,
      code: `func TestIntegration_UserCreateDuplikat(t *testing.T) {
    db := openTestDB(t)
    defer db.Close()

    repo := NewUserRepository(db)
    ctx := context.Background()

    u := &model.User{Username: "penduplikat",
        Email: "a@mail.com", PasswordHash: "x", Role: model.RoleUser}
    if err := repo.Create(ctx, u); err != nil {
        t.Fatalf("Create() pertama error = %v", err)
    }

    // Username sama → database menolak (unique) → ErrDuplicate
    err := repo.Create(ctx, &model.User{Username: "penduplikat",
        Email: "b@mail.com", PasswordHash: "x", Role: model.RoleUser})
    if !errors.Is(err, ErrDuplicate) {
        t.Errorf("error = %v, want ErrDuplicate", err)
    }
}`,
      explain: [
        'Ini mustahil diuji dengan mock — hanya database asli yang punya constraint unique.',
        'Test memastikan error 1062 benar-benar diterjemahkan menjadi ErrDuplicate.',
        'Bersihkan data test setelahnya agar test ini idempoten (aman diulang).'
      ]
    },
    {
      type: 'tip',
      title: 'Praktik tambahan untuk skala besar',
      text: 'Untuk proyek lebih besar, pertimbangkan: transaksi per test (rollback di akhir) agar tidak perlu membersihkan data, parallel test dengan database per test, atau containerisasi database (Docker) agar CI selalu punya MariaDB yang bersih.'
    },
    {
      type: 'warn',
      title: 'Jangan pernah pakai database produksi untuk test',
      text: 'Integration test menghapus dan menulis data seenaknya. Selalu arahkan ke database test yang terpisah (<code>gorestapi_test</code>) dan pastikan kredensialnya berbeda dari produksi. Kecelakaan menghapus data produksi oleh test adalah insiden nyata yang sering terjadi.'
    },
    {
      type: 'vocab',
      items: [
        ['Integration test', 'Pengujian beberapa komponen bekerja bersama, termasuk dependensi nyata.'],
        ['Build tag', 'Komentar //go:build yang menentukan kapan file ikut dikompilasi.'],
        ['t.Skipf', 'Menandai test dilewati (bukan gagal) — mis. database tidak tersedia.'],
        ['t.Helper', 'Menandai fungsi pembantu agar lokasi error menunjuk pemanggil.'],
        ['Seeding', 'Menanam data awal yang dibutuhkan test (mis. user pemilik produk).'],
        ['Deterministik', 'Hasil test sama setiap kali dijalankan, tidak tergantung keadaan.'],
        ['Idempoten', 'Aman dijalankan berkali-kali dengan hasil yang tetap sama.']
      ]
    }
  ],
  recap: [
    'Integration test membuktikan query SQL, tipe data, dan constraint bekerja sungguhan.',
    'Build tag //go:build integration memisahkannya dari go test ./... biasa.',
    'Pakai database test terpisah (DB_TEST_*) — jangan pernah database produksi.',
    'Bersihkan & tanam data agar test deterministik; lewati dengan Skipf bila DB absen.',
    'Jalankan dengan: go test -tags=integration ./internal/repository/ -v'
  ]
});
