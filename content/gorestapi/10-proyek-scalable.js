/* ============================================================
   Pelajaran Go REST API — Bab 10: Proyek Modular & Scalable
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-proyek-scalable',
  title: 'Merangkai Semuanya: Proyek Modular & Scalable',
  chapter: 'Penutup',
  duration: '12 menit',
  intro: [
    'Semua komponen sudah siap: config, database, repository, service, handler, middleware, dan test. Pelajaran terakhir merangkainya di <code>main.go</code> dengan <b>dependency injection manual</b>, menambahkan <b>graceful shutdown</b> dan <b>batas waktu server</b> — sentuhan yang membedakan aplikasi demo dan aplikasi siap produksi.',
    'Kita tutup dengan ringkasan arsitektur dan langkah lanjutan untuk proyek yang terus tumbuh.'
  ],
  objectives: [
    'Merangkai semua lapisan dengan dependency injection manual',
    'Menerapkan graceful shutdown dengan signal.NotifyContext',
    'Mengatur batas waktu server (Read/Write/Idle timeout)',
    'Menjalankan & menguji aplikasi end-to-end',
    'Mengetahui langkah lanjutan untuk skala produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Wiring di main.go</h3><p><b>main.go</b> adalah satu-satunya tempat yang tahu tentang SEMUA package. Ia merangkai dependensi dari bawah ke atas: config → database → repository → service → router. Pola menyusun dependensi secara eksplisit seperti ini disebut <b>dependency injection manual</b> — tanpa framework, mudah dibaca, dan mudah dilacak.</p>'
    },
    {
      type: 'example',
      title: 'Alur wiring lengkap',
      lang: 'go',
      output: false,
      code: `func main() {
    // 1) Konfigurasi dari environment / .env
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("konfigurasi gagal: %v", err)
    }

    // 2) Koneksi database + connection pool
    db, err := database.Open(cfg)
    if err != nil {
        log.Fatalf("database gagal: %v", err)
    }
    defer db.Close()
    log.Println("terhubung ke MariaDB")

    // 3) Wiring: repository → service → router
    authSvc := service.NewAuthService(
        repository.NewUserRepository(db), cfg.JWTSecret, cfg.JWTExpiry)
    prodSvc := service.NewProductService(repository.NewProductRepository(db))
    mux := router.New(authSvc, prodSvc)
    ...
}`,
      explain: [
        '<code>log.Fatalf</code> menghentikan program jika prasyarat (config/db) gagal — tidak ada gunanya melanjutkan.',
        'Pendekatan "new" berantai menunjukkan alur dependensi dengan sangat jelas.',
        'Setiap package tidak tahu-menahu tentang yang lain di bawahnya — hanya menerima interface.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Batas Waktu Server</h3><p>Server tanpa batas waktu bisa digantung oleh request lambat atau koneksi nakal. Standard library menyediakan empat pengaturan penting yang wajib di-set untuk produksi:</p>'
    },
    {
      type: 'example',
      title: 'Mengamankan http.Server',
      lang: 'go',
      output: false,
      code: `srv := &http.Server{
    Addr:              ":" + cfg.Port,
    Handler:           mux,
    ReadHeaderTimeout: 5 * time.Second,  // baca header
    ReadTimeout:       10 * time.Second, // baca seluruh request
    WriteTimeout:      15 * time.Second, // tulis respons
    IdleTimeout:       60 * time.Second, // koneksi keep-alive menganggur
}`,
      explain: [
        'Tanpa pengaturan ini, server Go bisa menjadi sasaran serangan <b>Slowloris</b> (koneksi digantung lama).',
        'ReadTimeout melindungi dari body request raksasa yang memblokir.',
        'Nilai ideal bergantung pada pola aplikasi — sesuaikan, jangan asal salin.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Graceful Shutdown</h3><p>Ketika server dimatikan (mis. <code>Ctrl+C</code> atau deployment), request yang sedang berjalan sebaiknya <b>diselesaikan dulu</b>, bukan diputus paksa — inilah <b>graceful shutdown</b>. Go menyediakannya secara elegan dengan <code>signal.NotifyContext</code> dan <code>srv.Shutdown</code>.</p>'
    },
    {
      type: 'example',
      title: 'Menangkap sinyal & mematikan dengan bersih',
      lang: 'go',
      output: false,
      code: `// 5) Server dijalankan di goroutine agar main bisa menunggu sinyal
go func() {
    log.Printf("server berjalan di http://localhost:%s", cfg.Port)
    if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
        log.Fatalf("server gagal: %v", err)
    }
}()

// 6) signal.NotifyContext menangani SIGINT (Ctrl+C) & SIGTERM
ctx, stop := signal.NotifyContext(context.Background(),
    syscall.SIGINT, syscall.SIGTERM)
defer stop()
<-ctx.Done() // block di sini sampai sinyal diterima

log.Println("menerima sinyal berhenti, mematikan server dengan aman...")
shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
if err := srv.Shutdown(shutdownCtx); err != nil {
    log.Printf("gagal shutdown dengan bersih: %v", err)
}
log.Println("server berhenti")`,
      explain: [
        '<code>&lt;-ctx.Done()</code> menahan main berjalan sampai sinyal berhenti diterima.',
        '<code>srv.Shutdown</code> berhenti menerima koneksi baru dan menunggu yang berjalan selesai.',
        'Timeout 10 detik mencegah shutdown menggantung selamanya bila ada request yang tidak selesai-selesai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menjalankan & Menguji Aplikasi</h3><p>Saatnya membuktikan seluruh rangkaian bekerja. Berikut alur uji lengkap dari tanam admin sampai penghapusan produk:</p>'
    },
    {
      type: 'example',
      title: 'Alur uji end-to-end',
      lang: 'bash',
      output: false,
      code: `# Siapkan database & tanam admin
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS gorestapi_app"
mysql -uroot -proot gorestapi_app < migrations/001_init.sql
go run ./cmd/seed

# Jalankan server
go run ./cmd/server

# Di terminal lain:
curl -X POST localhost:8080/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username":"budi","email":"budi@mail.com","password":"rahasia123"}'

TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin12345"}' | jq -r .token)

# Uji kebijakan akses
curl -X POST localhost:8080/api/v1/products \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Laptop Gaming","price":15000000,"stock":3}'`,
      explain: [
        'Register user biasa → login admin → coba endpoint admin dengan token admin.',
        'Uji juga skenario GAGAL: tanpa token (401), token user biasa (403), input tidak valid (400).',
        'Jalankan unit + integration test untuk memastikan seluruh lapisan utuh.'
      ]
    },
    {
      type: 'example',
      title: 'Ringkasan arsitektur yang sudah dibangun',
      lang: 'text',
      output: false,
      code: `cmd/server        → wiring & graceful shutdown
internal/
  config          → env / .env
  database        → sql.Open, pool, migrasi
  model           → struct + validasi
  repository      → SQL (interface + MariaDB)
  service         → logika bisnis (bcrypt, JWT)
  handler         → HTTP (JSON, status code)
  middleware      → logging, Authenticate, RequireRole
  router          → semua route + proteksi

Testing:
  *_test.go (unit)          → go test ./...
  integration_test.go       → go test -tags=integration ./...`,
      explain: [
        'Setiap file punya SATU tanggung jawab — inilah inti "modular".',
        'Menambah fitur baru (mis. kategori produk) = menambah file di tiap lapisan tanpa mengubah yang lama.',
        'Struktur ini dipakai luas di proyek Go nyata dan berbagai framework.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah Lanjutan</h3><p>Untuk membawa API ini ke produksi sungguhan, berikut peningkatan yang lazim ditambahkan secara bertahap:</p><ul><li><b>Refresh token</b> — memperpanjang sesi tanpa meminta login ulang.</li><li><b>Rate limiting</b> — membatasi jumlah request per periode untuk mencegah penyalahgunaan.</li><li><b>Logging terstruktur</b> — memakai library seperti zap/zerolog (JSON log) agar mudah dicari.</li><li><b>Containerisasi</b> — Docker multi-stage build menghasilkan image kecil & reproducible.</li><li><b>CI/CD</b> — menjalankan go vet, unit test, dan integration test otomatis di setiap push.</li><li><b>OpenAPI/Swagger</b> — mendokumentasikan endpoint agar mudah dipakai tim lain.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Cara belajar terbaik selanjutnya',
      text: 'Coba tambahkan resource baru sendiri — mis. <code>/categories</code> atau <code>/orders</code>. Ulangi pola yang sama: model → repository → service → handler → route → test. Pengulangan pola ini mengukuhkan pemahaman arsitektur layered.'
    },
    {
      type: 'vocab',
      items: [
        ['Dependency injection', 'Menyusun/menyetorkan dependensi secara eksplisit, biasanya di main.'],
        ['Wiring', 'Proses merangkai antar-lapisan: repository → service → handler → router.'],
        ['Graceful shutdown', 'Mematikan server dengan menyelesaikan request berjalan terlebih dahulu.'],
        ['Read/Write timeout', 'Batas waktu server membaca request / menulis respons.'],
        ['Slowloris', 'Serangan menggantung banyak koneksi lambat; dicegah dengan timeout.'],
        ['signal.NotifyContext', 'API Go untuk menangani sinyal OS (SIGINT/SIGTERM) via context.'],
        ['Stateless', 'Server tidak menyimpan sesi — modal utama API JWT untuk di-scale.']
      ]
    }
  ],
  recap: [
    'main.go merangkai semua lapisan dengan dependency injection manual.',
    'Selalu set Read/Write/Idle timeout pada http.Server untuk produksi.',
    'Graceful shutdown = signal.NotifyContext + srv.Shutdown dengan batas waktu.',
    'Buktikan aplikasi end-to-end: siapkan DB, jalankan server, uji alur curl + test.',
    'Langkah lanjutan: refresh token, rate limiting, logging terstruktur, Docker, CI/CD.'
  ]
});
