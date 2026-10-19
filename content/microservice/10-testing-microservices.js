/* ============================================================
   Pelajaran Microservices — Bab 10: Testing Microservices
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'testing-microservices',
  title: 'Testing Microservices: Unit sampai End-to-End',
  chapter: 'Keamanan & Pengujian',
  duration: '13–15 menit',
  intro: [
    'Microservices mengubah satu aplikasi menjadi banyak proses yang saling memanggil lewat jaringan. Satu perubahan di catalog-service bisa membuat order-service gagal membuat pesanan — dan kamu baru mengetahuinya saat pelanggan melapor. Pengujian otomatis adalah satu-satunya cara mempertahankan kepercayaan itu di ratusan deploy per minggu.',
    'Kuncinya bukan menulis tes sebanyak mungkin, tetapi menempatkan jenis tes yang tepat pada lapisan yang tepat. Bab ini mempraktikkan semuanya dengan Go dan OMS: table-driven tests, net/http/httptest, integration test yang bisa dilewat, contract test, jalur end-to-end dengan Docker Compose, fuzz testing, sampai perintah wajib pipeline seperti go test -race dan govulncheck.'
  ],
  objectives: [
    'Menyusun piramida pengujian dan memilih jenis tes untuk tiap lapisan',
    'Menulis table-driven test dengan subtests t.Run untuk fungsi validasi',
    'Menguji handler HTTP memakai net/http/httptest dan fake repository',
    'Menulis integration test yang dilewat otomatis bila TEST_DATABASE_URL kosong',
    'Menerapkan fuzz testing, race detector, dan static analysis di pipeline'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Piramida Pengujian</h3><p>Setiap lapisan menjawab pertanyaan berbeda, dengan biaya berbanding terbalik dengan jumlahnya:</p><ul><li><b>Unit</b> (paling banyak, milidetik) — logika murni tanpa jaringan dan database: validasi produk, perhitungan total order.</li><li><b>Integration</b> (sedang, detik) — satu komponen nyata: repository terhadap PostgreSQL sungguhan, consumer terhadap RabbitMQ.</li><li><b>Contract</b> (sedikit) — bentuk pesan antar-service sesuai kesepakatan OpenAPI.</li><li><b>End-to-end</b> (paling sedikit, paling mahal) — seluruh stack OMS hidup di Compose, request dilewatkan dari HTTP masuk sampai event keluar.</li></ul><p>Aturan praktis: perbaiki bug dengan menambah tes pada lapisan <b>serendah mungkin</b>. Bug validasi yang baru ditemukan melahirkan unit test, bukan skenario e2e baru yang lambat dan rapuh.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Table-Driven Test untuk Validasi Produk',
      lang: 'go',
      output: false,
      code: `func TestValidasiProduk(t *testing.T) {
    tests := []struct {
        name    string
        in      model.Product
        wantErr bool
    }{
        {"produk valid", model.Product{Name: "Keyboard", Price: 750000}, false},
        {"nama kosong", model.Product{Name: "", Price: 750000}, true},
        {"harga negatif", model.Product{Name: "Mouse", Price: -1}, true},
        {"nama terlalu panjang", model.Product{Name: strings.Repeat("a", 301), Price: 1000}, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) { // subtest bernama per kasus
            err := catalog.ValidasiProduk(tt.in)
            if (err != nil) != tt.wantErr {
                t.Fatalf("error = %v, wantErr = %v", err, tt.wantErr)
            }
        })
    }
}`,
      explain: [
        'Table-driven test adalah gaya baku Go: satu fungsi tes, banyak kasus dalam slice; menambah kasus cukup menambah baris. Dengan t.Run, kamu bisa menjalankan tepat satu kasus lewat -run TestValidasiProduk/harga_negatif dan kegagalan menampilkan nama kasusnya.',
        'Pola <code>(err != nil) != tt.wantErr</code> memeriksa keberadaan error apa pun; bila perlu, tambahkan kolom pesan error untuk memastikan pesan yang spesifik.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menguji Handler dengan net/http/httptest</h3><p>Package <code>net/http/httptest</code> memanggil handler langsung tanpa membuka port: <code>httptest.NewRequest</code> menyusun request dalam memori, <code>httptest.NewRecorder</code> merekam respons, lalu <code>mux.ServeHTTP(rec, req)</code> menjalankan rantai middleware dan handler. Hasilnya tes handler dalam milidetik yang bisa menilai status code, header, dan isi body JSON sekaligus. Agar tidak menyentuh database, kita memakai <b>fake repository</b> — implementasi kontrak repository yang disimpan di memori, bukan mock yang hanya mengembalikan jawaban yang diharapkan.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Uji Handler createProduct — Happy Path dan Input Tidak Valid',
      lang: 'go',
      output: false,
      code: `// fakeProductRepo adalah repository in-memory untuk tes.
type fakeProductRepo struct {
    items map[int64]model.Product
    next  int64
}
func (f *fakeProductRepo) Create(_ context.Context, p *model.Product) error {
    f.next++
    p.ID = f.next
    f.items[p.ID] = *p
    return nil
}

func TestCreateProduct(t *testing.T) {
    newMux := func() http.Handler {
        repo := &fakeProductRepo{items: map[int64]model.Product{}}
        mux := http.NewServeMux()
        mux.Handle("POST /products", catalog.CreateProduct(catalog.NewService(repo)))
        return mux
    }
    post := func(h http.Handler, body string) *httptest.ResponseRecorder {
        req := httptest.NewRequest(http.MethodPost, "/products", strings.NewReader(body))
        req.Header.Set("Content-Type", "application/json")
        rec := httptest.NewRecorder()
        h.ServeHTTP(rec, req)
        return rec
    }

    t.Run("happy path mengembalikan 201 dan body produk", func(t *testing.T) {
        rec := post(newMux(), \`{"name":"Keyboard Mekanik","price":750000}\`)
        if rec.Code != http.StatusCreated {
            t.Fatalf("status = %d, want 201; body = %s", rec.Code, rec.Body.String())
        }
        var got model.Product
        if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
            t.Fatalf("decode body: %v", err)
        }
        if got.Name != "Keyboard Mekanik" {
            t.Errorf("name = %q, want %q", got.Name, "Keyboard Mekanik")
        }
    })

    t.Run("input tidak valid mengembalikan 400", func(t *testing.T) {
        rec := post(newMux(), \`{"name":"","price":-5000}\`)
        if rec.Code != http.StatusBadRequest {
            t.Fatalf("status = %d, want 400; body = %s", rec.Code, rec.Body.String())
        }
    })
}`,
      explain: [
        'Pabrik <code>newMux</code> membuat fake repository dan mux baru per subtest — dua kasus tidak pernah berbagi state, sehingga urutan eksekusi tidak memengaruhi hasil.',
        'Happy path memeriksa status 201 sekaligus isi body yang benar-benar tersimpan; kasus tidak valid memastikan input buruk ditolak dengan 400, bukannya lolos ke database atau memicu panic 500.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Integration Test yang Bisa Dilewat</h3><p>Unit test dengan fake membuktikan logika; ia tidak membuktikan SQL-nya benar. Integration test berjalan terhadap PostgreSQL sungguhan dari <code>TEST_DATABASE_URL</code> (misalnya hasil <code>docker compose up -d catalog-db</code>), dengan dua pengaman agar tidak menggagalkan <code>go test ./...</code> di mesin mana pun: <b>build tag</b> <code>//go:build integration</code> yang hanya mengompilasi file tes bila diminta eksplisit dengan <code>-tags=integration</code>, dan <b>skip runtime</b> lewat <code>t.Skip</code> ketika variabelnya kosong.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Integration Test Repository Terhadap PostgreSQL',
      lang: 'go',
      output: false,
      code: `//go:build integration

package repository_test

import (
    "context"
    "database/sql"
    "os"
    "testing"

    _ "github.com/jackc/pgx/v5/stdlib"
    "example.com/oms/internal/model"
    "example.com/oms/internal/repository"
)

func TestProductRepositoryCRUD(t *testing.T) {
    dsn := os.Getenv("TEST_DATABASE_URL")
    if dsn == "" {
        t.Skip("TEST_DATABASE_URL kosong — integration test dilewati")
    }
    db, err := sql.Open("pgx", dsn)
    if err != nil {
        t.Fatalf("buka koneksi: %v", err)
    }
    t.Cleanup(func() { db.Close() })

    repo := repository.NewProductRepository(db)
    ctx := context.Background()
    p := model.Product{Name: "Keyboard", Price: 750000}
    if err := repo.Create(ctx, &p); err != nil {
        t.Fatalf("create: %v", err)
    }
    got, err := repo.FindByID(ctx, p.ID)
    if err != nil {
        t.Fatalf("FindByID: %v", err)
    }
    if got.Name != p.Name {
        t.Errorf("name = %q, want %q", got.Name, p.Name)
    }
}`,
      explain: [
        'Baris <code>//go:build integration</code> wajib berada sebelum blok package dan ditemani baris kosong; tanpa tag itu, file tes tidak ikut dikompilasi saat <code>go test ./...</code> biasa.',
        '<code>t.Cleanup</code> menutup koneksi setiap tes selesai, termasuk bila tes gagal di tengah. Karena tes ini menyentuh database nyata, siapkan database khusus tes dan bersihkan datanya agar hasilnya deterministik.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Contract Testing</h3><p>Integration test membuktikan satu service benar; contract test menjaga <b>janji antar-service</b>. Kontrak catalog-service menyatakan bahwa <code>GET /products/{id}</code> selalu mengembalikan <code>id</code>, <code>name</code>, dan <code>price</code> yang dipercayai order-service. Bila suatu hari <code>price</code> diubah menjadi <code>amount</code>, perubahan itu harus gagal di pipeline — bukan di produksi. Praktiknya: validasi skema OpenAPI di CI (misalnya dengan <code>kin-openapi</code>), ditambah pembanding kontrak seperti <code>oasdiff</code> yang menggagalkan build bila ada breaking change terhadap versi rilis:</p><pre><code>oasdiff breaking \\\n  services/catalog/openapi.yaml \\\n  main/services/catalog/openapi.yaml</code></pre><p>Pendekatan consumer-driven (misalnya Pact) menambah satu langkah: order-service menuliskan ekspektasinya, dan catalog-service wajib memenuhi ekspektasi itu sebelum merge.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Jalur End-to-End dengan Docker Compose',
      lang: 'bash',
      output: false,
      code: `# 1. Naikkan seluruh stack OMS; --wait sampai semua healthcheck hijau
docker compose -f deploy/compose.yaml -f deploy/compose.e2e.yaml \\
  up -d --build --wait

# 2. Jalankan tes end-to-end (dipisahkan dari tes reguler lewat tag)
go test ./tests/e2e/... -tags=e2e -count=1 -timeout 5m

# 3. Bawa turun stack beserta volumenya agar bersih untuk run berikutnya
docker compose -f deploy/compose.yaml -f deploy/compose.e2e.yaml down -v`,
      explain: [
        'Skrip e2e menguji alur nyata OMS: membuat produk di catalog-service, membuat order yang memvalidasi produk tersebut, sampai memastikan event OrderCreated diterima notification-service. Flag <code>--wait</code> menunggu healthcheck hijau — inilah gunanya endpoint <code>/readyz</code>.',
        'Karena paling lambat dan paling rapuh, e2e dijalankan di CI setelah unit dan integration test hijau, bukan di setiap commit.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Race Detector, Static Analysis, Timeout, dan Retry</h3><p>Empat pengaman ini layak ada di setiap pipeline GitHub Actions kamu:</p><pre><code>go test -race -timeout 3m ./...\ngo vet ./...\ngolangci-lint run ./...</code></pre><p><b>-race</b> menambahkan instrumen deteksi data race pada goroutine; temuannya adalah bug nyata, bukan dugaan — jangan diabaikan. <b>-timeout 3m</b> mematikan tes yang menggantung (lupa menutup rows, menunggu channel tanpa select timeout) sehingga pipeline tidak pernah menggantung selamanya. <b>go vet</b> dan <b>golangci-lint</b> menangkap pola berbahaya tanpa menjalankan tes. Untuk tes yang gagal sesekali (flaky), perbaiki penyebabnya; retry boleh dipakai sebagai jaring pengaman sesaat, bukan sebagai penutup borok.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Fuzz Testing untuk Validasi Produk',
      lang: 'go',
      output: false,
      code: `func FuzzValidasiProduk(f *testing.F) {
    f.Add("Keyboard", 750000) // seed kasus yang sudah diketahui
    f.Add("", 1000)
    f.Add("Mouse", -1)
    f.Fuzz(func(t *testing.T, nama string, harga int) {
        err := catalog.ValidasiProduk(model.Product{Name: nama, Price: harga})
        // Invarian: harga <= 0 harus SELALU ditolak, apa pun inputnya
        if harga <= 0 && err == nil {
            t.Fatalf("harga %d diterima, seharusnya ditolak", harga)
        }
    })
}`,
      explain: [
        'Setelah seed, fuzzer mengombinasikan dan memutar-mutar input ribuan kali per detik — karakter aneh, angka ekstrem, string kosong — lalu menyimpan temuan sebagai seed baru sehingga bug yang ditemukan tidak pernah kembali.',
        'Kekuatan fuzz terletak pada <b>invarian</b>: kamu tidak menebak output, tetapi menegakkan aturan yang tidak boleh dilanggar apa pun inputnya. Jalankan singkat dengan go test -fuzz=FuzzValidasiProduk -fuzztime=30s.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mocking Selektif dan Fake yang Lebih Baik</h3><p>Ada godaan mem-mock semuanya: repository, HTTP client, jam, logger. Hasilnya tes cepat yang meniru implementasi — ia lulus bahkan ketika implementasi aslinya rusak. Pilihannya: <b>fake repository in-memory</b> untuk komponen milikmu sendiri (jujur, benar-benar menyimpan data), <b>mock</b> hanya pada batas yang tidak bisa dikendalikan (klien HTTP catalog-service untuk skenario timeout dan 503, atau jam untuk menguji kedaluwarsa token), dan <b>testcontainer</b> untuk RabbitMQ atau PostgreSQL sungguhan. Aturannya sederhana: tiru sesedikit mungkin, dan hanya yang mustahil ditiru dengan cara lain.</p>'
    },
    {
      type: 'tip',
      title: 'Latihan',
      text: 'Tambahkan tiga hal ke OMS: (1) subtests tambahan pada TestValidasiProduk untuk nama yang hanya berisi spasi, (2) integration test operasi delete yang memastikan record benar-benar hilang dari PostgreSQL, dan (3) kasus e2e yang membuat order dua kali dengan Idempotency-Key sama lalu memastikan hanya ada satu order tersimpan. Jalankan go test -race ./... dan pastikan semua hijau.'
    },
    {
      type: 'vocab',
      items: [
        ['Table-driven test', 'Gaya tes Go: banyak kasus dalam slice tabel, masing-masing dijalankan sebagai subtests t.Run.'],
        ['httptest', 'Package bawaan Go untuk memanggil handler HTTP dalam memori tanpa membuka port.'],
        ['Fake repository', 'Implementasi kontrak repository in-memory; lebih jujur daripada mock berat untuk unit test.'],
        ['Integration test', 'Tes terhadap komponen nyata (database, broker); dilindungi build tag dan skip saat env kosong.'],
        ['Contract test', 'Tes yang menjaga bentuk pesan antar-service tetap sesuai kesepakatan OpenAPI/Pact.'],
        ['Fuzz testing', 'Pengujian input acak berbasis seed untuk menemukan kasus tak terduga yang melanggar invarian.']
      ]
    }
  ],
  recap: [
    'Piramida pengujian: unit paling banyak dan cepat, lalu integration, contract, dan end-to-end yang paling mahal — perbaiki bug di lapisan serendah mungkin.',
    'Table-driven test dengan t.Run adalah gaya baku Go; httptest menguji handler tanpa server nyata, didukung fake repository in-memory untuk komponen milik sendiri.',
    'Integration test dilindungi build tag dan t.Skip saat TEST_DATABASE_URL kosong; contract test menggagalkan perubahan breaking lewat validasi OpenAPI dan oasdiff.',
    'Jalur e2e dengan docker compose up --wait memverifikasi alur nyata OMS dari HTTP sampai event; jalankan setelah tes yang lebih cepat hijau.',
    'go test -race, go vet, golangci-lint, timeout, dan fuzz testing wajib ada di pipeline; mocking dipakai selektif, retry bukan penutup borok.'
  ]
});
