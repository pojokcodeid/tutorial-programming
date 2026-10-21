/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 7: Order Service
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-order-service',
  title: 'Order Service: HTTP Antar Service & Idempotensi',
  chapter: 'Komunikasi & Event',
  duration: '16 menit',
  intro: [
    'Sampai di sini, ketiga bagian sistem belum pernah bicara satu sama lain: product-service menjual katalog, frontend menampilkan halaman, RabbitMQ berdiri menunggu. Bab ini menyambungkan sisi pertama: <b>order-service memanggil product-service lewat HTTP</b> — komunikasi sinkron, tempat satu service benar-benar menunggu jawaban service lain sebelum melangkah.',
    'Tiga persoalan nyata akan kita hadapi: bagaimana memanggil service lain <b>dengan timeout yang benar</b> agar tidak menggantung, bagaimana menjaga pesanan tetap sah <b>tanpa JOIN lintas database</b> (ingat: order-service tidak boleh menyentuh product_db), dan bagaimana mencegah pesanan ganda ketika klien mengulang request yang sama — lewat <b>kunci idempotensi</b> yang disimpan sebagai UNIQUE di database.',
    'Di akhir bab alur pembuatan pesanan sudah tersambung sampai penyimpanan: validasi katalog → hitung total → simpan pesanan. Langkah terakhirnya — menerbitkan event ke RabbitMQ — kodenya baru ditulis di bab berikutnya; di sini kita hanya menyiapkan tempatnya (field publisher pada API) sambil frontend tetap menunggu satu balasan.'
  ],
  objectives: [
    'Memanggil endpoint service lain dengan http.Client berbatas waktu dan penanganan galat bertingkat',
    'Menjelaskan mengapa order-service menyimpan snapshot nama dan harga, bukan hanya product_id',
    'Mengimplementasikan idempotency key dengan UNIQUE constraint di MariaDB dan penanganan duplikat',
    'Memilih kode status 422 vs 502 vs 500 untuk situasi kegagalan lintas service',
    'Menyusun alur create pesanan: validasi body → panggil katalog → hitung total → simpan, termasuk keputusan kode status tiap cabangnya',
    'Menyiapkan titik penerbitan event (field publisher) yang diwujudkan penuh pada bab 8'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Pesanan Membutuhkan Katalog?</h3><p>Klien frontend bisa mengirim <code>product_id=1, qty=5</code>, tetapi order-service tidak boleh mempercayai harga atau nama yang ikut dikirim klien — harga bisa basi, nama bisa dimanipulasi. Satu-satunya sumber harga yang sah adalah product-service. Karena itu langkah pertama setiap pembuatan pesanan adalah <b>bertanya ke katalog</b>: apakah produknya ada, berapa harga kini, dan apakah stoknya mencukupi.</p><p>Keputusan ini juga yang menentukan sifat komunikasinya: order-service harus <b>menunggu</b> jawaban sebelum menyimpan pesanan — maka ini komunikasi sinkron (HTTP), bukan event. Ingat aturan bab 1: tanpa jawaban lawan bicara, keputusanmu menjadi salah.</p>'
    },
    {
      type: 'example',
      title: 'Alur create pesanan: lima langkah',
      lang: 'text',
      output: false,
      code: `POST /orders  {product_id: 1, qty: 2, customer: "Budi"}
  │
  ├─ 1. Validasi body      → qty > 0, customer terisi   (422 bila gagal)
  │
  ├─ 2. GET product-service /products/1   ← KOMUNIKASI SINKRON, timeout 2 dtk
  │      produk tidak ada    → 422 "produk tidak ditemukan di katalog"
  │      katalog tak tersedia→ 502 "katalog produk tidak tersedia"
  │      stok < qty          → 422 "stok produk tidak mencukupi"
  │
  ├─ 3. Hitung total: price × qty  (di server, bukan dipercaya dari klien)
  │
  ├─ 4. INSERT ke order_db + kunci idempotensi
  │      bentrok UNIQUE      → balas pesanan LAMA dengan 200 (bukan buat baru)
  │
  └─ 5. Terbitkan event order.created ke RabbitMQ
         gagal penerbitan    → CATAT di log, pesanan TETAP 201
         (notifikasi boleh tertunda, pesanan tidak boleh gagal)`,
      explain: [
        'Langkah 2 adalah satu-satunya titik order-service bergantung pada service lain; karena itu ia diberi timeout ketat dan kode status khusus (502 Bad Gateway) yang secara harfiah berarti "lawan bicara di belakangku yang bermasalah".',
        'Perhitungan total di server (langkah 3) bukan sekadar hemat bandwidth: klien jahat yang mengirim total 1 rupiah untuk qty 1000 tidak akan pernah diterima.',
        'Langkah 5 yang kegagalannya tidak menggagalkan pesanan adalah cerminan langsung dari desain asinkron di bab 1 — konsistensi antara rencana dan kode.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Alur membuat pesanan: frontend mengirim POST, order-service bertanya katalog ke product-service, menghitung total, menyimpan ke order_db, lalu menerbitkan event ke RabbitMQ">
        <defs><marker id="mk-fs07-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="275" y="15" width="210" height="42" rx="8" class="u-hd"/>
        <text x="380" y="41" class="u-title">POST /orders (+ Idempotency-Key)</text>
        <line x1="345" y1="57" x2="345" y2="73" class="u-line" marker-end="url(#mk-fs07-1)"/>
        <text x="338" y="69" class="u-lbl" text-anchor="end">POST</text>
        <line x1="415" y1="73" x2="415" y2="57" class="u-line" marker-end="url(#mk-fs07-1)"/>
        <text x="424" y="69" class="u-lbl">201 + pesanan</text>
        <rect x="180" y="73" width="400" height="180" rx="10" class="u-box"/>
        <text x="380" y="100" class="u-title">order-service :8082</text>
        <text x="380" y="126" class="u-lbl" text-anchor="middle">1. validasi body (qty, pelanggan)</text>
        <text x="380" y="146" class="u-lbl" text-anchor="middle">2. GET katalog — timeout 2 detik</text>
        <text x="380" y="166" class="u-lbl" text-anchor="middle">3. total = harga × qty (di server)</text>
        <text x="380" y="186" class="u-lbl" text-anchor="middle">4. INSERT + Idempotency-Key UNIQUE</text>
        <text x="380" y="206" class="u-lbl" text-anchor="middle">5. publish order.created (gagal → log)</text>
        <text x="380" y="226" class="u-lbl" text-anchor="middle">6. balas 201 Created</text>
        <rect x="15" y="95" width="145" height="58" rx="8" class="u-hl"/>
        <text x="87" y="118" class="u-title">product-service</text>
        <text x="87" y="140" class="u-lbl" text-anchor="middle">:8081 — harga &amp; stok</text>
        <line x1="180" y1="124" x2="164" y2="124" class="u-line" marker-end="url(#mk-fs07-1)"/>
        <text x="178" y="116" class="u-lbl" text-anchor="end">2 dtk</text>
        <rect x="595" y="95" width="150" height="58" rx="8" class="u-hl"/>
        <text x="670" y="118" class="u-title">RabbitMQ</text>
        <text x="670" y="140" class="u-lbl" text-anchor="middle">order.created</text>
        <line x1="580" y1="124" x2="592" y2="124" class="u-line" marker-end="url(#mk-fs07-1)"/>
        <line x1="380" y1="253" x2="380" y2="280" class="u-line" marker-end="url(#mk-fs07-1)"/>
        <text x="392" y="270" class="u-lbl">INSERT</text>
        <rect x="250" y="284" width="260" height="50" rx="8" class="u-hl"/>
        <text x="380" y="306" class="u-title">order_db</text>
        <text x="380" y="325" class="u-lbl" text-anchor="middle">snapshot produk + kunci idempotensi</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Enam langkah pembuatan pesanan: sinkron ke katalog, transaksi ke database, asinkron ke broker</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>HTTP Client dengan Timeout yang Benar</h3><p>Kesalahan paling berbahaya dalam komunikasi antar service bukan timeout yang terlalu pendek — melainkan <b>timeout yang tidak ada sama sekali</b>. Tanpa timeout, satu product-service yang sedang hang akan menahan seluruh antrean permintaan order-service di belakangnya, sampai akhirnya pesanan di dunia nyata ikut hang bersama. Karena itu timeout dipasang pada <code>http.Client</code> — mencakup waktu koneksi <b>dan</b> membaca seluruh respons.</p>'
    },
    {
      type: 'example',
      title: 'HTTP client berbatas waktu',
      lang: 'go',
      output: false,
      code: `func New(s *store.Store, catalogURL string, pub *publisher.Publisher,
	log *slog.Logger) *API {
	return &API{
		store:      s,
		catalogURL: strings.TrimRight(catalogURL, "/"),
		// timeout terpasang di sini, bukan per-request —
		// mencakup dial + kirim + tunggu + baca seluruh body
		catalogHTTP: &http.Client{Timeout: 2 * time.Second},
		publisher:   pub,
		log:         log, // logger disuntikkan dari main(), bukan variabel global
	}
}

// ambilProduk memanggil GET product-service /products/{id}.
func (a *API) ambilProduk(ctx context.Context, id int64) (produk, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		fmt.Sprintf("%s/products/%d", a.catalogURL, id), nil)
	if err != nil {
		return produk{}, err
	}
	res, err := a.catalogHTTP.Do(req)
	if err != nil {
		return produk{}, err // timeout / koneksi ditolak → ditangani pemanggil
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		return produk{}, errProdukTidakAda // dibedakan dari kegagalan jaringan!
	}
	if res.StatusCode != http.StatusOK {
		return produk{}, fmt.Errorf("katalog membalas %d", res.StatusCode)
	}
	// Batasi ukuran body agar respons nakal tidak menghabiskan memori.
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return produk{}, err
	}
	var p produk
	if err := json.Unmarshal(body, &p); err != nil {
		return produk{}, err
	}
	return p, nil
}`,
      explain: [
        'Tiga kondisi gagal dipisahkan dengan jelas: <b>produk tidak ada</b> (404 dari katalog → keputusan bisnis: 422), <b>service tidak terjangkau</b> (timeout/refused → 502), dan <b>respons tidak berbentuk JSON</b> (→ 502 juga). Menggabungkan ketiganya membuat pesan galat menyesatkan.',
        '<code>io.LimitReader</code> membatasi body 1 MB: proteksi kecil terhadap service yang salah konfigurasi (misal membalas halaman HTML raksasa) — semacam pertahanan diri paling dasar.',
        '<code>http.NewRequestWithContext</code> mengikat pemanggilan pada context request asli: bila klien browser menutup tab, panggilan ikut batal — pekerjaan lintas service tidak dibuang percuma.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Snapshots: Data yang Mandiri</h3><p>Begitu produk terbaca dari katalog, order-service menyalin nama dan harga ke struct pesanan — dan kolom-kolom itulah yang akan disimpan ke <code>order_db</code>. Ingat kembali pembatasan database-per-service dari bab 3: ketika riwayat pesanan dibuka kemudian hari, tidak ada satu pun panggilan balik ke product-service yang dilakukan. Riwayat dibaca sepenuhnya dari satu baris pesanan.</p>'
    },
    {
      type: 'example',
      title: 'Struct pesanan lengkap dengan snapshot',
      lang: 'go',
      output: false,
      code: `// store — satu baris pesanan, lengkap dengan snapshot saat transaksi.
type Order struct {
	ID        int64     \`json:"id"\`
	ProductID int64     \`json:"product_id"\`
	Product   string    \`json:"product"\`     // SNAPSHOT nama saat transaksi
	Qty       int       \`json:"qty"\`
	UnitPrice int       \`json:"unit_price"\`  // SNAPSHOT harga saat transaksi
	Total     int       \`json:"total"\`
	Customer  string    \`json:"customer"\`
	Status    string    \`json:"status"\`
	CreatedAt time.Time \`json:"created_at"\`
}

order := store.Order{
	ProductID: prod.ID,        // rujukan — untuk telusur ke katalog bila perlu
	Product:   prod.Name,      // SNAPSHOT nama saat transaksi
	Qty:       req.Qty,
	UnitPrice: prod.Price,     // SNAPSHOT harga saat transaksi
	Total:     prod.Price * req.Qty, // hasil perhitungan ikut disimpan
	Customer:  strings.TrimSpace(req.Customer),
	Status:    "confirmed",
}`,
      explain: [
        'Nama kolom tabel memakai <code>product_name</code> dan <code>unit_price</code>, sedangkan JSON memakai <code>product</code>/<code>unit_price</code> — perbedaan itu sengaja: nama kolom dibaca manusia lewat SQL, nama field dibaca frontend. Tag <code>json</code> adalah jembatannya.',
        'Empat kolom snapshot (product_name, unit_price, total) membuat riwayat pesanan tidak pernah berubah setelah terjadi — persis seperti nota belanja fisik yang tetap sama walau harga di rak naik.',
        'Pertimbangkan skenario nyata: bulan depan harga Kopi naik dari 85.000 ke 95.000. Tanpa snapshot, laporan pendapatan Januari ikut "berubah" — laporan keuangan jadi tidak bisa dipercaya.',
        'Nilai <code>ProductID</code> tetap disimpan (meski tidak wajib untuk tampilan) agar pesanan bisa disilangkan dengan katalog ketika dibutuhkan oleh fitur mendatang — memakai API, bukan JOIN.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Idempotensi: Request Uang Bukan Data Ganda</h3><p>Jaringan selalu bisa berbuat aneh: klien mengirim POST pesanan, server memprosesnya, tetapi balasan hilang di tengah jalan. Klien mengira gagal dan mengirim ulang. Tanpa pengaman, TokoKita kini punya dua pesanan identik dari satu niat beli.</p><p>Penawarnya adalah <b>kunci idempotensi</b>: klien membuat pengenal acak unik per niat kirim, disertakan sebagai header, dan database memberi sanksi atas duplikatnya lewat UNIQUE constraint. Percobaan kedua berakhir dengan jawabannya sendiri, bukan pesanan baru.</p>'
    },
    {
      type: 'example',
      title: 'Sisi server: menangkap duplikat sebagai jalan normal',
      lang: 'go',
      output: false,
      code: `// Create menyimpan pesanan. Bila idempotency_key bentrok dengan pesanan
// lama, ia mengembalikan pesanan lama itu lewat *DupKeyError.
func (s *Store) Create(ctx context.Context, o Order, idemKey string) (Order, error) {
	res, err := s.db.ExecContext(ctx,
		"INSERT INTO orders (idempotency_key, product_id, product_name, "+
			"qty, unit_price, total, customer, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		idemKey, o.ProductID, o.Product, o.Qty, o.UnitPrice, o.Total, o.Customer, o.Status)
	if err != nil {
		// MySQL 1062 = duplicate key → kemungkinan besar request ulang dari klien.
		if isDup(err) {
			if existing, gerr := s.GetByKey(ctx, idemKey); gerr == nil {
				return existing, &DupKeyError{Existing: existing}
			}
		}
		return Order{}, err
	}
	id, _ := res.LastInsertId()
	o.ID = id
	return o, nil
}

// isDup memeriksa apakah galat berasal dari pelanggaran UNIQUE (MySQL 1062).
func isDup(err error) bool {
	var me *mysql.MySQLError
	return errors.As(err, &me) && me.Number == 1062
}`,
      explain: [
        'Pelanggaran UNIQUE bukan lagi kegagalan yang disembunyikan — ia JALAN NORMAL yang ditangani dengan anggun: ambil pesanan lama, kembalikan lewat tipe error khusus.',
        'Pengecekan <code>mysql.MySQLError</code> dengan nomor 1062 adalah cara spesifik driver MySQL melaporkan duplikat; memakai <code>errors.As</code> membuatnya tetap benar walau error dibungkus lapisan bawah.',
        'Bila pesanan lama gagal diambil (misal baru dihapus), kode jatuh ke error umum — keputusan sadar: lebih baik galat 500 yang jujur daripada balasan yang tidak lengkap.'
      ]
    },
    {
      type: 'example',
      title: 'Sisi handler: duplikat dijawab 200, bukan 409',
      lang: 'go',
      output: false,
      code: `saved, err := a.store.Create(r.Context(), order, idemKey)
var dup *store.DupKeyError
if errors.As(err, &dup) {
	// Request ulang: balas dengan pesanan lama, bukan membuat baru.
	// Kejadian ini dicatat karena pola retry klien yang berulang-lalu
	// sering menjadi petunjuk pertama saat ada masalah di jaringan.
	a.log.Info("pesanan ulang — idempotensi aktif",
		"order_id", dup.Existing.ID, "kunci", idemKey)
	writeJSON(w, http.StatusOK, dup.Existing)
	return
}
if err != nil {
	a.log.Error("gagal menyimpan pesanan", "kunci", idemKey, "galat", err)
	writeError(w, http.StatusInternalServerError, "gagal menyimpan pesanan")
	return
}
a.log.Info("pesanan dibuat",
	"order_id", saved.ID, "produk", saved.Product,
	"qty", saved.Qty, "total", saved.Total)

/*  Sisi klien (frontend):

    function buatPesanan(data) {
      const idemKey = crypto.randomUUID();   // ← dibuat SEKALI per niat kirim
      return api.post('/orders', data, {
        headers: { 'Idempotency-Key': idemKey }
      });
    }

    Bila request timeout lalu RETRY memakai key yang sama,
    server mengenali dan membalas pesanan lama → tidak ada duplikat.   */`,
      explain: [
        'Duplikat dijawab 200 (bukan 201 Created) karena pesanan TIDAK baru dibuat — kode status menceritakan apa yang sebenarnya terjadi pada resource.',
        'Dua kejadian bisnis ikut dicatat sebagai log JSON: <code>pesanan dibuat</code> (dengan order_id, qty, total) dan <code>pesanan ulang — idempotensi aktif</code>. Ketika pengguna berkata "pesanan saya hilang", baris inilah tempat pertama mencarinya.',
        'Kunci dibuat di klien sebelum kirim, artinya satu "tekan tombol" = satu kunci = boleh diulang sepuasnya tanpa dampak. Ini persis definisi idempotensi.',
        'Pola ini dipakai luas di produksi: gateway pembayaran (Stripe) menjadikan Idempotency-Key sebagai bagian resmi API-nya — bukan sekadar trik tutorial.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memilih Kode Status untuk Kegagalan Lintas Service</h3><p>Kegagalan komunikasi antar service menghadirkan pilihan yang tidak ada pada aplikasi monolit: bukan hanya "server error", tetapi <b>siapa</b> yang bermasalah. Pemilihan yang tepat membantu penyelidikan masalah berikutnya — dan kesalahan memilihnya menyebarkan kebingungan ke monitoring maupun klien.</p>'
    },
    {
      type: 'example',
      title: 'Tabel keputusan kode status order-service',
      lang: 'text',
      output: false,
      code: `SITUASI                                     KODE   MAKNA BAGI PEMANGGIL
────────────────────────────────────────────────────────────────────────
Body tidak bisa diparsing JSON               400    "perbaiki permintaanmu"
qty <= 0 atau customer kosong                422    "permintaanmu tidak sah
                                                    secara bisnis"
Produk tidak ada di katalog (404 dari sana)  422    "pilihanmu tidak valid"
Stok tidak mencukupi                         422    "pilihanmu tidak valid"
Koneksi/timeout ke product-service           502    "layanan belakangku yang
                                                    sedang bermasalah —
                                                    coba lagi nanti"
INSERT ke order_db gagal (error MySQL)       500    "aku yang rusak — laporkan
                                                    ke operator"
Berhasil dibuat                              201    "pesanan baru tersimpan"
Request ulang dengan kunci sama              200    "ini pesananmu yang lama"

Aturan pemilihan:
  4xx → kesalahan KLIEN   (perbaikan: ubah permintaan)
  502 → kesalahan UPSTREAM (perbaikan: periksa service lain)
  500 → kesalahan KITA     (perbaikan: periksa log order-service)`,
      explain: [
        'Perhatikan 422 dipakai untuk dua situasi berbeda tetapi satu makna: "permintaan terbaca, tetapi ditolak aturan bisnis" — klien cukup mengubah pilihannya.',
        '502 Bad Gateway dipilih di atas 500 karena ia menjelaskan POSISI kegagalan: sudah dipastikan bukan order-service yang rusak, melainkan pihak yang ia hubungi.',
        'Menyusun tabel seperti ini sebelum menulis handler menghemat waktu debugging nanti — keputusan dibuat sekali di atas kertas, bukan berkali-kali di tengah kode.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji alur lengkap dengan curl',
      lang: 'bash',
      output: false,
      code: `# Prasyarat: seluruh stack berjalan (podman compose up -d --build)
# Perintah memakai NAMA SERVICE, jadi sama persis di podman compose
# maupun podman-compose — tanpa perlu menghafal nama container.

# 1) Buat pesanan normal
curl -si -X POST localhost:8082/orders \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: uji-abc-123' \\
  -d '{"product_id":1,"qty":2,"customer":"Budi Santoso"}'
# → 201 Created, body berisi total 170000 (85000 × 2)

# 2) ULANGI dengan kunci yang sama — buat pesanan BARU juga di sini
curl -si -X POST localhost:8082/orders \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: uji-abc-123' \\
  -d '{"product_id":1,"qty":2,"customer":"Budi Santoso"}'
# → 200 OK dengan id yang SAMA (bukan 201, bukan id baru)

# 3) Kunci berbeda → pesanan baru sungguhan
curl -si -X POST localhost:8082/orders \\
  -H 'Idempotency-Key: uji-def-456' -H 'Content-Type: application/json' \\
  -d '{"product_id":2,"qty":1,"customer":"Siti"}'

# 4) Produk tidak ada → 422
curl -si -X POST localhost:8082/orders -H 'Content-Type: application/json' \\
  -d '{"product_id":9999,"qty":1,"customer":"X"}'

# 5) product-service dimatikan → 502 (uji timeout lintas service!)
podman compose stop product-service
curl -si -X POST localhost:8082/orders -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: uji-mati' \\
  -d '{"product_id":1,"qty":1,"customer":"X"}'
# → 502 "katalog produk tidak tersedia" dalam ±2 detik (bukan menggantung!)
podman compose start product-service

# 6) Pastikan tidak ada pesanan ganda
curl -s localhost:8082/orders | grep -c '"customer":"Budi Santoso"'   # → 1`,
      explain: [
        'Uji 5 adalah yang paling penting secara edukatif: ia membuktikan timeout bekerja — respon 502 datang dalam hitungan detik, bukan menggantung selamanya menunggu lawan yang mati. Perintah <code>compose stop/start product-service</code> memakai nama service sehingga berlaku sama pada podman compose maupun podman-compose.',
        'Uji 6 mengonfirmasi klaim utama idempotensi dengan angka: satu pelanggan, dua kirim, tetap satu baris di database.',
        'Bila dikerjakan tanpa komposer penuh, pastikan mariadb, rabbitmq, product-service, dan order-service semuanya hidup (<code>go run ./cmd</code> di dua folder service); 422 pada uji 4 membutuhkan katalog hidup, sedangkan 502 pada uji 5 membutuhkannya mati.',
        'Simpan seluruh rangkaian ini sebagai skenario regresi; ketika kamu kelak menambah lapisan (misal otentikasi), jalankan ulang semuanya untuk memastikan tidak ada yang terpecah.'
      ]
    },
    {
      type: 'tip',
      title: 'Batas Waktu yang Sehat untuk Komunikasi Antar Service',
      text: 'Aturan praktis: timeout satu service ke service lain sebaiknya <b>lebih pendek daripada timeout kliennya</b>, sehingga pesan galat selalu datang dari tempat yang paling dekat dengan pengguna. Urutan umum: browser → nginx (10 dtk) → order-service ke katalog (2 dtk). Dengan begini klien SELALU menerima jawaban dari order-service, meski katalog mati — dan pesan galatnya jauh lebih informatif daripada "gateway timeout".'
    },
    {
      type: 'warn',
      title: 'Timeout Tanpa Retry Bisa Jadi Dua Kali Lipat Masalah',
      text: 'Timeout yang memicu retry otomatis berarti satu kegagalan bisa berubah menjadi tiga percobaan — melipatgandakan beban pada service yang sedang sekaratan. Di TokoKita, <b>tidak ada retry otomatis</b> pada pemanggilan katalog: sekali gagal, jawab 502, biarkan klien memutuskan kapan mencoba lagi. Bila kamu menambahkan retry, pasang jumlah maksimal (1–2 kali) dan jeda — jangan pernah tanpa batas.'
    },
    {
      type: 'vocab',
      items: [
        ['Komunikasi sinkron', 'Pola tanya-jawab di mana pengirim menunggu balasan sebelum lanjut; dipakai order-service → product-service karena keputusan bisnis bergantung jawaban.'],
        ['Timeout', 'Batas waktu tunggu suatu operasi jaringan; dipasang pada http.Client sehingga mencakup koneksi sekaligus membaca seluruh respons.'],
        ['502 Bad Gateway', 'Kode status yang berarti server sebagai perantara menerima respons cacat/gagal dari upstream — penanda kegagalan lintas service.'],
        ['Snapshot', 'Penyalinan data asli (nama, harga) ke catatan transaksi agar riwayat mandiri dari perubahan data sumber.'],
        ['Idempotency key', 'Pengenal unik per niat kirim yang membuat pengulangan request sama menghasilkan efek sama — didukung UNIQUE constraint di database.'],
        ['UNIQUE constraint', 'Batas kolom yang melarang dua baris memiliki nilai sama; menjadi penegak idempotensi di level database (galat MySQL 1062).'],
        ['Error domain', 'Tipe error aplikasi (mis. DupKeyError, ErrNotFound) yang membawa makna bisnis, dipisahkan dari error teknis lapisan bawah.'],
        ['Trust boundary', 'Batas kepercayaan: data dari klien tidak pernah dipercaya untuk nilai krusial (harga, total) — selalu diverifikasi ulang ke sumber sah.']
      ]
    }
  ],
  recap: [
    'order-service memanggil product-service secara sinkron dengan http.Client timeout 2 detik karena harga dan stok harus divalidasi sebelum pesanan sah.',
    'Tiga kegagalan dipisahkan: produk tidak ada (422), katalog tak terjangkau/timeout (502), server gagal simpan (500) — masing-masing menunjuk pihak yang perlu diperiksa.',
    'Snapshot nama, harga, dan total ikut tersimpan di tabel pesanan sehingga riwayat tetap akurat walau katalog berubah — konsekuensi langsung database-per-service.',
    'Idempotency key + UNIQUE constraint (MySQL 1062) membuat request ulang dijawab dengan pesanan lama (200) alih-alih membuat duplikat (201).',
    'Keputusan penerbitan event: kegagalannya hanya dicatat di log, pesanan tetap 201 — notifikasi boleh tertunda, pesanan tidak boleh gagal (kodenya menyusul di bab 8).'
  ]
});
