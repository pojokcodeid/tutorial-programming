/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 4: Fondasi Backend Go
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-go-fondasi',
  title: 'Fondasi Backend Go: Konfigurasi, Koneksi & Shutdown',
  chapter: 'Backend Go',
  duration: '15 menit',
  intro: [
    'Setiap microservice TokoKita mempunyai satu berkas <code>cmd/main.go</code> yang bertugas sebagai <b>pemasang rakit</b> (wiring): membaca konfigurasi, membuka koneksi ke infrastruktur, menyusun lapisan-lapisan aplikasi, menjalankan server HTTP, lalu mematikan semuanya dengan rapi ketika menerima sinyal berhenti.',
    'Pola yang sama dipakai ketiga service — product, order, dan notification. Karena itu memahami satu main.go berarti memahami ketiganya. Kita telusuri tiap bagian: konfigurasi 12-factor dari variabel lingkungan, fungsi <code>waitForDB</code> yang sabar menunggu database siap, deklarasi channel AMQP, hingga graceful shutdown yang memberi waktu request yang sedang berjalan.',
    'Di akhir bab kamu akan memahami mengapa service tidak boleh langsung menyerah ketika database belum siap, bagaimana degradasi terkendali diterapkan ketika Redis mati, dan bagaimana urutan pembersihan aset dibalik dari urutan pembuatannya.'
  ],
  objectives: [
    'Menyusun main.go service dengan pola wiring: config → koneksi → lapisan → server → shutdown',
    'Membaca konfigurasi dari variabel lingkungan dengan nilai bawaan yang aman',
    'Menerapkan pola tunggu-ulang (retry with backoff) untuk database dan broker yang belum siap',
    'Mengimplementasikan graceful shutdown dengan os/signal dan context berbatas waktu',
    'Memutuskan kapan sebuah kegagalan infrastruktur layak diteruskan (fatal) dan kapan cukup dicatat (degradasi)'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta main.go: Lima Tahap</h3><p>Walau tiap service punya kebutuhan berbeda, urutan tahap di main.go selalu sama. Posisi yang konsisten ini membuat kamu cepat menemukan titik yang perlu diubah ketika menambah koneksi baru — misalnya ketika di bab berikutnya product-service perlu menyambung Redis.</p>'
    },
    {
      type: 'example',
      title: 'Lima tahap wiring pada product-service',
      lang: 'go',
      output: false,
      code: `func main() {
	// 1) Konfigurasi — semua nilai dari environment, tanpa hard-coded
	port := env("PORT", "8081")
	dsn := env("DB_DSN", "product_svc:...@tcp(localhost:3306)/product_db?...")
	redisAddr := env("REDIS_ADDR", "localhost:6379")

	// 2) Koneksi infrastruktur — tunggu sampai benar-benar siap
	db, err := waitForDB(dsn, 30, 2*time.Second)
	if err != nil {
		log.Fatalf("database tidak pernah siap: %v", err)
	}
	defer db.Close()

	// 3) Wiring lapisan aplikasi (dependency injection manual)
	api := httpapi.New(store.New(db), cache.New(rdb), cacheTTL)

	// 4) Server HTTP + goroutine terpisah
	srv := &http.Server{Addr: ":" + port, Handler: api.Router()}
	go srv.ListenAndServe()

	// 5) Graceful shutdown — tunggu sinyal, lalu tutup dengan sopan
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	srv.Shutdown(shutdownCtx)
}`,
      explain: [
        'Urutan ini disalin hampir identik di order-service dan notification-service — perbedaannya hanya pada tahap 2 (order/notif juga menunggu RabbitMQ) dan tahap 3 (order memasang publisher, notification memasang konsumer).',
        'Tidak ada framework dependency injection: Go lebih menyukai pemasangan eksplisit di mana setiap fungsi <code>New(...)</code> menerima dependensinya sebagai argumen — mudah dilacak oleh pencari bug.',
        'Tahap 4 berjalan di goroutine terpisah agar alur utama langsung sampai ke tahap 5 (menunggu sinyal) tanpa terblokir oleh server yang tidak pernah berhenti sendiri.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 185" width="760" role="img" aria-label="Lima tahap wiring main.go berurutan: konfigurasi, koneksi, wiring, server HTTP, lalu graceful shutdown">
        <defs><marker id="mk-fs04-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <text x="380" y="28" class="u-lbl" text-anchor="middle">urutan yang sama di product-, order-, dan notification-service</text>
        <rect x="10" y="45" width="135" height="75" rx="8" class="u-box"/>
        <text x="77" y="70" class="u-title">1 Konfigurasi</text>
        <text x="77" y="92" class="u-lbl" text-anchor="middle">env()</text>
        <text x="77" y="110" class="u-lbl" text-anchor="middle">12-factor</text>
        <rect x="157" y="45" width="135" height="75" rx="8" class="u-box"/>
        <text x="224" y="70" class="u-title">2 Koneksi</text>
        <text x="224" y="92" class="u-lbl" text-anchor="middle">waitForDB</text>
        <text x="224" y="110" class="u-lbl" text-anchor="middle">retry 30 × 2 dtk</text>
        <rect x="304" y="45" width="135" height="75" rx="8" class="u-box"/>
        <text x="371" y="70" class="u-title">3 Wiring</text>
        <text x="371" y="92" class="u-lbl" text-anchor="middle">New(store, cache)</text>
        <text x="371" y="110" class="u-lbl" text-anchor="middle">DI manual</text>
        <rect x="451" y="45" width="135" height="75" rx="8" class="u-box"/>
        <text x="518" y="70" class="u-title">4 Server</text>
        <text x="518" y="92" class="u-lbl" text-anchor="middle">go ListenAndServe</text>
        <text x="518" y="110" class="u-lbl" text-anchor="middle">goroutine</text>
        <rect x="598" y="45" width="135" height="75" rx="8" class="u-box"/>
        <text x="665" y="70" class="u-title">5 Shutdown</text>
        <text x="665" y="92" class="u-lbl" text-anchor="middle">signal + defer</text>
        <text x="665" y="110" class="u-lbl" text-anchor="middle">LIFO</text>
        <line x1="145" y1="82" x2="155" y2="82" class="u-line" marker-end="url(#mk-fs04-1)"/>
        <line x1="292" y1="82" x2="302" y2="82" class="u-line" marker-end="url(#mk-fs04-1)"/>
        <line x1="439" y1="82" x2="449" y2="82" class="u-line" marker-end="url(#mk-fs04-1)"/>
        <line x1="586" y1="82" x2="596" y2="82" class="u-line" marker-end="url(#mk-fs04-1)"/>
        <text x="380" y="158" class="u-lbl" text-anchor="middle">gagal di tahap 2 = fatal; Redis gagal = tetap jalan (degradasi terkendali)</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Lima tahap wiring main.go yang diulang identik di ketiga service</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi 12-Factor</h3><p>Aturan sederhana: <b>tidak ada nilai konfigurasi yang ditulis mati di kode</b>. Semua dibaca dari variabel lingkungan lewat pembungkus kecil yang selalu menyediakan nilai bawaan. Dengan begini, konfigurasi yang sama bisa dipakai di komposer (container) maupun mode pengembangan lokal (shell) tanpa mengubah satu baris kode pun.</p>'
    },
    {
      type: 'example',
      title: 'Fungsi env: baca environment dengan bawaan aman',
      lang: 'go',
      output: false,
      code: `// env membaca variabel lingkungan dengan nilai bawaan — konfigurasi tidak
// pernah ditulis mati di kode (praktik 12-factor).
func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}`,
      explain: [
        'Nilai bawaan ditulis agar service tetap bisa dijalankan langsung dari host saat pengembangan (<code>go run ./cmd</code>) tanpa menyiapkan environment apa pun.',
        'Perhatian pada detail <code>v != ""</code>: variabel yang ter-set tetapi kosong dianggap tidak diisi, sehingga tidak menghasilkan DSN rusak yang gagal di tengah jalan.',
        'Untuk proyek yang lebih besar, pola ini dikembangkan menjadi <code>joho/godotenv</code> atau <code>caarlos0/env</code> — konsep dasarnya tetap sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menunggu Database yang Belum Siap</h3><p>Ketika <code>podman compose up</code> dijalankan, ketiga service Go boleh mulai lebih dulu daripada MariaDB — container database butuh waktu menyiapkan direktori data dan menjalankan migrasi sebelum siap menerima koneksi. Bila service langsung menyerah pada percobaan pertama, kamu akan menyaksikan <b>boot loop</b>: service mati, compose menyalakannya lagi, mati lagi.</p><p>Solusinya adalah fungsi <code>waitForDB</code>: mencoba koneksi berulang dengan jeda tetap sampai batas percobaan habis. Pola ini dipakai identik di ketiga service, dan juga dipakai untuk menunggu RabbitMQ di order- dan notification-service.</p>'
    },
    {
      type: 'example',
      title: 'waitForDB: retry dengan batas yang jelas',
      lang: 'go',
      output: false,
      code: `func waitForDB(dsn string, attempts int, delay time.Duration) (*sql.DB, error) {
	var db *sql.DB
	var err error
	for i := 0; i < attempts; i++ {
		db, err = sql.Open("mysql", dsn)
		if err == nil {
			pingCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			err = db.PingContext(pingCtx)
			cancel()
			if err == nil {
				// Koneksi pool disetel SEKALI saat berhasil
				db.SetMaxOpenConns(20)
				db.SetMaxIdleConns(5)
				db.SetConnMaxLifetime(30 * time.Minute)
				return db, nil
			}
		}
		log.Printf("database belum siap (percobaan %d/%d): %v", i+1, attempts, err)
		time.Sleep(delay)
	}
	return nil, err // 30 percobaan × 2 detik = 60 detik sebelum menyerah
}`,
      explain: [
        '<code>sql.Open</code> tidak membuka koneksi sungguhan — ia hanya memvalidasi DSN. Koneksi pertama baru terjadi saat <code>PingContext</code> dipanggil; tanpa Ping, kesalahan DSN baru ketahuan di tengah-tengah request pengguna.',
        '<code>PingContext</code> dibatasi timeout 2 detik agar percobaan terhadap host yang tidak merespons tidak menggantung selamanya dan memakan jatah percobaan berikutnya.',
        'Batas percobaan (30 × 2 detik) membuat kegagalan permanen tetap terdeteksi sebagai fatal error — retry tanpa batas hanyalah bug yang berpakaian rapi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memutuskan: Fatal atau Cukup Peringatan?</h3><p>Ada satu keputusan desain yang membedakan bagaimana ketiga service memperlakukan infrastruktur, dan ini sangat layak dipahami: <b>bukan setiap kegagalan berarti service harus mati.</b></p><ul><li><b>Database tidak bisa dihubungi</b> → <code>log.Fatalf</code>. Order-service tanpa database tidak bisa menyimpan pesanan apa pun; menyalakan server yang pasti akan menolak semua permintaan hanya memperpanjang penderitaan.</li><li><b>RabbitMQ tidak bisa dihubungi</b> (order-service) → juga fatal, karena tanpa penerbit event, bagian notifikasi sistem tidak akan pernah bekerja dan pesanan akan tersimpan tanpa efek samping apa pun.</li><li><b>Redis tidak bisa dihubungi</b> → <b>peringatan saja, service tetap jalan</b>. Cache bersifat pelengkap: tanpa Redis, product-service tetap melayani semua request dengan lebih lambat karena membaca langsung MariaDB. Inilah yang disebut <b>degradasi terkendali</b>.</li></ul>'
    },
    {
      type: 'example',
      title: 'Degradasi terkendali pada Redis',
      lang: 'go',
      output: false,
      code: `// Redis untuk cache. Bila gagal, service TETAP jalan tanpa cache
// (degradasi terkendali) — cache bukan syarat hidup aplikasi.
rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()
if err := rdb.Ping(ctx).Err(); err != nil {
	log.Printf("PERINGATAN: Redis tidak tersedia (%v) — berjalan tanpa cache", err)
} else {
	log.Println("terhubung ke Redis")
}
defer rdb.Close()`,
      explain: [
        'Setiap metode pada lapisan cache dirancang menangani kegagalan sebagai <code>miss</code> — jadi bila Redis mati SETELAH startup pun, product-service tetap memberi jawaban benar dari MariaDB.',
        'Perhatikan perbedaan bahasa: <code>Fatalf</code> untuk syarat hidup, <code>PERINGATAN</code> untuk pelengkap. Keputusan ini dibuat per komponen, bukan per service.',
        'Timeout 3 detik pada Ping mencegah startup tertahan lama hanya karena host Redis salah ketik di konfigurasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Graceful Shutdown: Menutup Dengan Sopan</h3><p>Ketika kamu menekan Ctrl+C pada komposer, container menerima sinyal <code>SIGTERM</code>. Tanpa penanganan khusus, server Go langsung mematikan diri dan request yang sedang berjalan (misal INSERT yang setengah jalan) ikut terpotong. <b>Graceful shutdown</b> memberi waktu yang cukup: berhenti menerima koneksi baru, tunggu yang sedang berjalan selesai, lalu tutup aset-aset lain berdasarkan urutan pembuatannya.</p>'
    },
    {
      type: 'example',
      title: 'Urutan shutdown yang benar',
      lang: 'go',
      output: false,
      code: `quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit // blokir sampai sinyal datang

shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
if err := srv.Shutdown(shutdownCtx); err != nil {
	log.Printf("gagal shutdown bersih: %v", err)
}
log.Println("product-service berhenti")

// Eset lain ditutup oleh defer yang sudah terdaftar di awal main():
//   defer db.Close()     → database
//   defer rdb.Close()    → Redis / koneksi AMQP
// urutan defer di Go: LIFO — yang terakhir dibuat ditutup pertama`,
      explain: [
        '<code>srv.Shutdown</code> berhenti menerima koneksi baru tetapi MENUNGGU request yang masih berjalan — dibatasi context 10 detik agar shutdown tidak pernah menggantung.',
        'Pola <code>defer</code> membalik urutan penutupan secara otomatis (LIFO): handler yang memakai database ditutup SEBELUM database-nya ditutup — persis urutan yang diinginkan.',
        'Tanda Ctrl+C kedua biasanya dipakai untuk memaksa berhenti seketika; di TokoKita cukup satu, karena 10 detik batas atas waktunya.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan satu service langsung dari host',
      lang: 'bash',
      output: false,
      code: `# Jalankan dulu infrastruktur saja
podman-compose up -d mariadb redis rabbitmq

# Lalu jalankan product-service dari host (bawaan: localhost:8081)
cd services/product
DB_DSN='product_svc:product-local@tcp(localhost:3306)/product_db?parseTime=true&charset=utf8mb4' \\
REDIS_ADDR='localhost:6379' \\
go run ./cmd

# Uji cepat
curl -s localhost:8081/healthz          # {"status":"ok"}
curl -si localhost:8081/products | head -5   # perhatikan header X-Cache

# Ctrl+C — perhatikan log "product-service berhenti" muncul setelah sinyal`,
      explain: [
        'Mode pengembangan begini jauh lebih cepat daripada rebuild image tiap perubahan: edit-simpan-langsung mencoba dalam hitungan detik.',
        'Nama host berubah dari <code>mariadb</code> (di dalam compose) menjadi <code>localhost</code> (dari host) — perbedaan tersendiri yang sering menjadi sumber kebingungan pertama.',
        'Log shutdown yang rapi adalah tanda bahwa penanganan sinyalmu bekerja; bila container langsung mati tanpa pesan "berhenti", ada yang salah di registrasi sinyal.'
      ]
    },
    {
      type: 'tip',
      title: 'Satu Pola, Tiga Service — Gunakan Itu Sebagai Peta',
      text: 'Ketika nanti kamu tersesat di salah satu service, cukup tanyakan: tahap mana dari lima tahap wiring ini yang sedang kupegang? Bila menambah koneksi baru, ia masuk tahap 2; menambah endpoint, tahap 3; menambah perilaku saat sinyal berhenti, tahap 5. Posisi yang konsisten antar service inilah yang membuat kode baru terasa familiar sejak menit pertama.'
    },
    {
      type: 'warn',
      title: 'Jangan Pernah Retry Tanpa Batas Waktu',
      text: 'Retry selamanya terdengar gigih, tapi dampaknya buruk: kegagalan konfigurasi (DSN salah ketik) berubah dari "mati seketika dengan pesan jelas" menjadi "log berputar tanpa henti sambil memakan CPU". Selalu pasang batas — entah jumlah percobaan (30×2 detik) atau context berbatas waktu — dan <b>catat setiap kegagalan di log</b> supaya penyebabnya tetap terlihat.'
    },
    {
      type: 'vocab',
      items: [
        ['Wiring', 'Proses memasang komponen-komponen aplikasi (config, koneksi, handler) menjadi satu kesatuan yang siap dijalankan; dilakukan di main.go.'],
        ['12-factor config', 'Prinsip konfigurasi dari environment: nilai bacaan berubah antar deployment tanpa mengubah kode.'],
        ['Retry with backoff', 'Pola mencoba ulang operasi yang gagal dengan jeda yang umumnya meningkat; di TokoKita dipakai untuk menunggu DB dan broker siap.'],
        ['Graceful shutdown', 'Penutupan server yang berhenti menerima koneksi baru tetapi menunggu request berjalan selesai, sebelum mematikan proses.'],
        ['Degradasi terkendali', 'Keadaan di mana komponen pelengkap (mis. cache) gagal, tetapi aplikasi tetap memberi jawaban benar dengan kinerja lebih rendah.'],
        ['Connection pool', 'Kumpulan koneksi database yang dipakai ulang; diatur dengan SetMaxOpenConns/SetMaxIdleConns/SetConnMaxLifetime.'],
        ['os/signal', 'Paket standar Go untuk menangkap sinyal proses (SIGINT, SIGTERM) dan mengubahnya menjadi event di channel.'],
        ['Context berbatas waktu', 'context.WithTimeout yang memastikan suatu operasi (ping database, shutdown) tidak pernah berjalan melewati tenggat yang ditentukan.']
      ]
    }
  ],
  recap: [
    'main.go ketiga service memakai lima tahap yang sama: konfigurasi → koneksi infrastruktur (dengan retry) → wiring lapisan → server HTTP → graceful shutdown.',
    'Konfigurasi dibaca dari variabel lingkungan lewat fungsi env() dengan nilai bawaan agar service tetap berjalan langsung dari host saat pengembangan.',
    'waitForDB mencoba koneksi berulang (30×2 detik) karena database sering siap setelah service; tanpa pola ini compose menghasilkan boot loop.',
    'Keputusan fatal-vs-peringatan dibuat per komponen: database dan RabbitMQ = fatal, Redis = cukup peringatan karena cache adalah pelengkap.',
    'Graceful shutdown memakai os/signal + srv.Shutdown dengan context 10 detik, sedangkan aset lain ditutup oleh defer yang menutup berbalik urutan (LIFO).'
  ]
});
