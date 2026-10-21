/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 5: Product Service CRUD
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-product-crud',
  title: 'Product Service: REST API CRUD dengan net/http',
  chapter: 'Backend Go',
  duration: '18 menit',
  intro: [
    'Sekarang kita membangun tulang punggung katalog: <b>product-service</b> — REST API penuh (Create, Read, Update, Delete) dengan pola lapisan yang rapi: <code>httpapi</code> (handler) → <code>store</code> (akses MariaDB) → <code>cache</code> (Redis, dibahas di bab berikutnya). Semuanya memakai <code>net/http</code> standar Go 1.22+ yang sudah mendukung pola method + path tanpa framework tambahan.',
    'Kita akan menyusun model produk sebagai kontrak JSON, menulis repository dengan parameterized query (menentang SQL injection), membangun handler dengan kode status HTTP yang tepat, sampai validasi input dan middleware logging terstruktur (satu baris JSON per permintaan). Setiap keputusan kecil — kenapa 404, kenapa 422, kenapa selalu balas array kosong <code>[]</code> — dibahas alasannya, bukan sekadar ditulis.',
    'Di akhir bab product-service sudah bisa diuji langsung dengan curl: membuat, membaca, mengubah, dan menghapus produk, lengkap dengan header <code>X-Cache</code> yang akan menyala di bab 6.'
  ],
  objectives: [
    'Menerapkan pola method + path routing net/http Go 1.22+ tanpa framework pihak ketiga',
    'Menulis lapisan store dengan parameterized query dan pemetaan sql.ErrNoRows ke domain error',
    'Mengembalikan kode status HTTP yang tepat (200/201/204/400/404/422/500) untuk setiap situasi',
    'Menulis validasi input di lapisan handler sebelum menyentuh database',
    'Menyusun respons JSON yang konsisten sehingga frontend hanya perlu satu pola penanganan galat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta Endpoint</h3><p>Sebelum menulis kode, tetapkan kontraknya lebih dulu. Lima endpoint ini adalah antarmuka publik product-service — frontend, order-service, dan konsumen lain hanya boleh tahu lima baris ini, bukan detail database di baliknya.</p>'
    },
    {
      type: 'example',
      title: 'Kontrak REST product-service (:8081)',
      lang: 'text',
      output: false,
      code: `GET    /healthz              → 200 {"status":"ok"}         (untuk compose healthcheck)
GET    /products             → 200 [ ...daftar produk... ]   + header X-Cache: HIT|MISS
POST   /products             → 201 produk yang baru dibuat
                               422 bila validasi gagal
GET    /products/{id}        → 200 satu produk | 404 tidak ada
                               400 bila id bukan angka
PUT    /products/{id}        → 200 produk hasil ubahan | 404 | 422
DELETE /products/{id}        → 204 tanpa isi | 404

Kontrak respons galat (SATU pola untuk seluruh endpoint):
    {"message": "pesan yang bisa ditampilkan ke pengguna"}`,
      explain: [
        'Endpoint <code>/healthz</code> bukan kemewahan: compose memakainya sebagai healthcheck, dan ia juga menjadi syarat kesehatan service di orkestrator mana pun.',
        'Respons galat selalu berbentuk <code>{"message": ...}</code> — kontrak tunggal ini membuat frontend cukup memanggil satu fungsi <code>pesanGalat(err, fallback)</code> untuk SEMUA service.',
        'Memisahkan kontrak dari implementasi sejak awal membuat pembagian tugas jelas: bab ini mewujudkan kontrak, bab berikutnya menambahkan lapisan cache tanpa mengubah kontrak sama sekali.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Model dan Konstruktor: Asal-Usul Segala Sesuatu yang Dipakai Handler</h3><p>Handler menyebut <code>store.Product</code>, <code>a.store</code>, <code>a.cache</code>, dan <code>a.log</code> — empat nama yang kini harus dinyatakan lebih dulu. Dua catatan penting: model sekaligus kontrak JSON ditulis di lapisan <code>store</code> (bukan di handler), dan <b>logger tidak pernah dibuat di dalam handler</b> — ia dibuat sekali di <code>cmd/main.go</code> lalu diteruskan lewat konstruktor, supaya ketergantungan tiap lapisan terlihat eksplisit dan mudah diganti saat pengujian.</p>'
    },
    {
      type: 'example',
      title: 'Model produk, konstruktor lapisan, dan asal logger',
      lang: 'go',
      output: false,
      code: `// store — kontrak JSON sekaligus representasi baris tabel products.
type Product struct {
	ID        int64     \`json:"id"\`
	Name      string    \`json:"name"\`
	Category  string    \`json:"category"\`
	Price     int       \`json:"price"\`
	Stock     int       \`json:"stock"\`
	CreatedAt time.Time \`json:"created_at"\`
}

type Store struct{ db *sql.DB }

func New(db *sql.DB) *Store { return &Store{db: db} }

// httpapi — seluruh dependensi disuntikkan lewat konstruktor.
type API struct {
	store    *store.Store
	cache    *cache.Cache
	cacheTTL time.Duration
	log      *slog.Logger
}

func New(s *store.Store, c *cache.Cache, ttl time.Duration, log *slog.Logger) *API {
	return &API{store: s, cache: c, cacheTTL: ttl, log: log}
}

// cmd/main.go — logger dibuat SEKALI lalu diteruskan, bukan variabel global.
log := logx.New("product-service")
api := httpapi.New(store.New(db), cache.New(rdb), cacheTTL, log)`,
      explain: [
        'Tag <code>json:"..."</code> menentukan nama field pada respons — tanpanya frontend akan menerima <code>CreatedAt</code> (huruf besar) dan harus menyesuaikan diri. Satu sumber kebenaran untuk kontrak: model.',
        'Setiap <code>New(...)</code> menerima dependensinya sebagai argumen — pola ini diulang di order- dan notification-service, dan menjadi alasan logger bisa diteruskan sampai ke lapisan paling dalam tanpa variabel global.',
        '<code>logx.New("product-service")</code> menempelkan atribut <code>service</code> pada semua baris berikutnya, sehingga ketiga service bercampur dalam satu <code>podman compose logs -f</code> pun tetap mudah dipisah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Routing net/http Gaya Baru</h3><p>Sejak Go 1.22, <code>net/http</code> memahami pola <code>METHOD /path/{parameter}</code>. Ini menghapus kebutuhan framework routing ringan untuk proyek seukuran TokoKita: pencocokan metode (405 otomatis), parameter path dengan <code>r.PathValue()</code>, semuanya bawaan.</p>'
    },
    {
      type: 'example',
      title: 'Router seluruh endpoint product-service',
      lang: 'go',
      output: false,
      code: `// Router memakai pola method + path dari net/http Go 1.22+ —
// tanpa framework routing tambahan.
func (a *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", a.healthz)
	mux.HandleFunc("GET /products", a.list)
	mux.HandleFunc("POST /products", a.create)
	mux.HandleFunc("GET /products/{id}", a.get)
	mux.HandleFunc("PUT /products/{id}", a.update)
	mux.HandleFunc("DELETE /products/{id}", a.delete)
	return logx.Middleware(a.log, "/healthz")(mux)
}

func (a *API) healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}`,
      explain: [
        'Pola <code>"DELETE /products/{id}"</code> membatasi metode otomatis: mengirim POST ke /products/{id} akan dijawab 405 Method Not Allowed tanpa kode pengecekan apa pun di handler.',
        '<code>r.PathValue("id")</code> mengambil isi parameter {id} dari URL — menggantikan pemotongan string manual yang rawan salah.',
        'Router dibungkus <code>logx.Middleware(a.log, "/healthz")</code> agar setiap permintaan tercatat satu baris JSON (metode, path, status, durasi). Path <code>/healthz</code> dilewati karena dipantau compose tiap beberapa detik — kalau ikut dicatat, log dibanjiri baris mati.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 305" width="760" role="img" aria-label="Alur permintaan REST product-service: klien ke router, handler, store, lalu MariaDB, dengan pilihan kode status di handler">
        <defs><marker id="mk-fs05-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="15" y="40" width="140" height="70" rx="8" class="u-box"/>
        <text x="85" y="64" class="u-title">Klien</text>
        <text x="85" y="84" class="u-lbl" text-anchor="middle">curl / browser</text>
        <text x="85" y="102" class="u-lbl" text-anchor="middle">GET /products/1</text>
        <rect x="200" y="40" width="145" height="70" rx="8" class="u-box"/>
        <text x="272" y="64" class="u-title">Router net/http</text>
        <text x="272" y="84" class="u-lbl" text-anchor="middle">METHOD + path</text>
        <text x="272" y="102" class="u-lbl" text-anchor="middle">PathValue("id")</text>
        <rect x="390" y="40" width="145" height="70" rx="8" class="u-box"/>
        <text x="462" y="64" class="u-title">Handler</text>
        <text x="462" y="84" class="u-lbl" text-anchor="middle">parse · validasi</text>
        <text x="462" y="102" class="u-lbl" text-anchor="middle">pilih kode status</text>
        <rect x="580" y="40" width="165" height="70" rx="8" class="u-box"/>
        <text x="662" y="64" class="u-title">Store</text>
        <text x="662" y="84" class="u-lbl" text-anchor="middle">SQL berparameter ?</text>
        <text x="662" y="102" class="u-lbl" text-anchor="middle">ErrNoRows → 404</text>
        <line x1="155" y1="75" x2="196" y2="75" class="u-line" marker-end="url(#mk-fs05-1)"/>
        <line x1="345" y1="75" x2="386" y2="75" class="u-line" marker-end="url(#mk-fs05-1)"/>
        <line x1="535" y1="75" x2="576" y2="75" class="u-line" marker-end="url(#mk-fs05-1)"/>
        <line x1="662" y1="110" x2="662" y2="150" class="u-line" marker-end="url(#mk-fs05-1)"/>
        <rect x="545" y="155" width="205" height="55" rx="8" class="u-hl"/>
        <text x="647" y="178" class="u-title">MariaDB product_db</text>
        <text x="647" y="198" class="u-lbl" text-anchor="middle">SELECT ... WHERE id = ?</text>
        <rect x="15" y="230" width="730" height="62" rx="8" class="u-hd"/>
        <text x="380" y="255" class="u-title">Kode status yang dipilih handler</text>
        <text x="380" y="278" class="u-lbl" text-anchor="middle">201 create · 204 delete · 400 body rusak · 422 validasi gagal · 404 tak ada · 500 server</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Alur satu permintaan REST product-service dan pilihan kode status yang dihasilkan handler</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Lapisan Store: Query Berparameter</h3><p>Lapisan <code>store</code> adalah satu-satunya tempat yang boleh menyentuh SQL. Dua aturan keras di sini: <b>selalu memakai parameter (<code>?</code>), bukan penyusunan string</b> — inilah pertahanan utama melawan SQL injection — dan <b>memetakan <code>sql.ErrNoRows</code> menjadi error domain</code></b> sehingga handler tidak perlu tahu detail driver database.'
    },
    {
      type: 'example',
      title: 'Membaca satu produk + pemetaan galat ke domain',
      lang: 'go',
      output: false,
      code: `// ErrNotFound dipakai handler untuk membedakan "data tidak ada" (404)
// dari "database rusak" (500).
var ErrNotFound = errors.New("produk tidak ditemukan")

const kolom = "id, name, category, price, stock, created_at"

// Get mengambil satu produk berdasar ID.
func (s *Store) Get(ctx context.Context, id int64) (Product, error) {
	var p Product
	err := s.db.QueryRowContext(ctx,
		"SELECT "+kolom+" FROM products WHERE id = ?", id).
		Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Stock, &p.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Product{}, ErrNotFound
	}
	return p, err
}`,
      explain: [
        '<code>id = ?</code> dengan argumen <code>id</code> terpisah membuat driver mengirim nilai dan perintahnya secara berbeda — nilai tidak pernah bisa berubah menjadi potongan SQL.',
        'Pemetaan ke <code>ErrNotFound</code> memindahkan keputusan status HTTP ke handler, sementara store tetap bebas tahu-tahu soal HTTP: batas lapisan yang bersih.',
        'Memakai <code>errors.Is</code> (bukan ==) agar pemetaan tetap benar walau error dibungkus ulang oleh lapisan lain di tengah jalan.'
      ]
    },
    {
      type: 'example',
      title: 'Insert dengan pengembalian ID hasil',
      lang: 'go',
      output: false,
      code: `// Create menyimpan produk baru dan mengembalikan ID hasil insert.
func (s *Store) Create(ctx context.Context, p Product) (int64, error) {
	res, err := s.db.ExecContext(ctx,
		"INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)",
		p.Name, p.Category, p.Price, p.Stock)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}`,
      explain: [
        '<code>ExecContext</code> dipakai untuk tulis (INSERT/UPDATE/DELETE), <code>QueryRowContext</code> untuk baca — memilih yang tepat mencegah kesalahan umum seperti membuka kursor yang tidak pernah ditutup.',
        '<code>LastInsertId()</code> mengembalikan AUTO_INCREMENT hasil insert; ID itu ikut disimpan ke struct sehingga respons 201 langsung berisi ID lengkap.',
        'Context ikut diteruskan ke setiap query sehingga permintaan yang dibatalkan klien (misal tab browser ditutup) ikut membatalkan pekerjaan database.'
      ]
    },
    {
      type: 'example',
      title: 'Store: daftar, ubah, dan hapus',
      lang: 'go',
      output: false,
      code: `// List mengembalikan seluruh produk (urut ID) untuk tabel & dropdown.
func (s *Store) List(ctx context.Context) ([]Product, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT "+kolom+" FROM products ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Price, &p.Stock, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// Update menimpa data produk; RowsAffected 0 berarti produk tidak ada.
func (s *Store) Update(ctx context.Context, p Product) error {
	res, err := s.db.ExecContext(ctx,
		"UPDATE products SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?",
		p.Name, p.Category, p.Price, p.Stock, p.ID)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// Delete menghapus produk.
func (s *Store) Delete(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx, "DELETE FROM products WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}`,
      explain: [
        'UPDATE dan DELETE tidak pernah menghasilkan <code>sql.ErrNoRows</code> — mereka sukses walau nol baris tersentuh. <code>RowsAffected()</code> adalah satu-satunya cara mengetahui bahwa ID yang diminta tidak ada, sehingga keputusan 404 tetap bisa diambil.',
        '<code>defer rows.Close()</code> menutup kursor begitu fungsi selesai; lupa satu baris ini membuat koneksi pool terkuras pelan-pelan ketika halaman tabel dibuka seratus kali.',
        '<code>rows.Err()</code> diperiksa SETELAH loop: galat yang terjadi di tengah iterasi (misal koneksi putus) tidak muncul sebagai error pada QueryContext, melainkan di sini.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Handler: Menerjemahkan HTTP ke Store dan Kembali</h3><p>Handler memegang tiga tanggung jawab: mem-parsing permintaan, memvalidasi, lalu memilih kode status yang jujur. Bagian terakhir ini yang paling sering diremehkan — frontend dan order-service mengambil keputusan berdasarkan kode status yang kamu kirim, jadi keliru memilihnya berarti menyebarkan kekeliruan ke seluruh sistem.</p>'
    },
    {
      type: 'example',
      title: 'Handler create: dari body JSON sampai 201',
      lang: 'go',
      output: false,
      code: `func (a *API) create(w http.ResponseWriter, r *http.Request) {
	var p store.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid")
		return
	}
	if msg := validasi(p); msg != "" {
		writeError(w, http.StatusUnprocessableEntity, msg)
		return
	}
	id, err := a.store.Create(r.Context(), p)
	if err != nil {
		// Galat database dicatat BERSAMA pesan untuk klien: klien hanya
		// melihat "gagal menyimpan produk", penyebab sebenarnya ada di log.
		a.log.Error("gagal menyimpan produk", "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal menyimpan produk")
		return
	}
	p.ID = id
	a.cache.Invalidate(r.Context(), id) // buang cache basi
	a.log.Info("cache diinvalidasi", "kunci", "product:"+strconv.FormatInt(id, 10), "produk_id", id)
	writeJSON(w, http.StatusCreated, p)
}`,
      explain: [
        'Empat cabang galat dengan empat kode berbeda: 400 (permintaan tidak bisa dibaca), 422 (terbaca tetapi isinya ditolak), 500 (server bermasalah), 201 (berhasil membuat). Setiap kasus memberi tahu klien jenis masalah yang berbeda.',
        'Pesan ke klien sengaja umum, tetapi <b>penyebabnya tetap tercatat</b> lewat <code>a.log.Error(..., "galat", err)</code> — respons HTTP jujur kepada pengguna, log jujur kepada operator. Tanpa baris ini, 500 hanya mengatakan "ada yang salah" tanpa pernah menjelaskan apa.',
        'Panggilan <code>a.cache.Invalidate</code> sudah terpasang sejak awal — di bab 6 kita lihat apa yang terjadi tanpanya; kejadiannya dicatat agar pembuktian lewat log bisa dilakukan.',
        '<code>r.Context()</code> dipakai agar operasi database ikut batal ketika koneksi klien putus; tanpa itu, database tetap mengerjakan tulisan yang sudah tidak ada yang menunggunya.'
      ]
    },
    {
      type: 'example',
      title: 'Validasi: galat pertama yang ditemukan, pesan yang manusiawi',
      lang: 'go',
      output: false,
      code: `// validasi mengembalikan pesan galat pertama yang ditemukan ("" = sah).
func validasi(p store.Product) string {
	if strings.TrimSpace(p.Name) == "" {
		return "nama produk wajib diisi"
	}
	if p.Price < 0 {
		return "harga tidak boleh negatif"
	}
	if p.Stock < 0 {
		return "stok tidak boleh negatif"
	}
	return ""
}`,
      explain: [
        'Pesan galat ditulis untuk MANUSIA ("nama produk wajib diisi") karena ia akan tampil apa adanya di notifikasi Ant Design — bukan "validation failed on field name".',
        'Mengembalikan string pertama (bukan daftar semua galat) menjaga format sederhana; pola ini cukup untuk kebutuhan TokoKita dan mudah ditingkatkan bila nanti perlu.',
        'Memakai <code>TrimSpace</code> agar nama berisi spasi saja tetap ditolak — celah validasi klasik yang sering terlewat.'
      ]
    },
    {
      type: 'example',
      title: 'Handler baca, ubah, dan hapus: 200, 404, 204',
      lang: 'go',
      output: false,
      code: `func (a *API) get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	if p, ok := a.cache.GetProduk(r.Context(), id); ok {
		w.Header().Set("X-Cache", "HIT") // isi cache bab berikutnya
		writeJSON(w, http.StatusOK, p)
		return
	}
	p, err := a.store.Get(r.Context(), id)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "produk tidak ditemukan")
		return
	}
	if err != nil {
		a.log.Error("gagal membaca produk", "produk_id", id, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal membaca produk")
		return
	}
	a.cache.SetProduk(r.Context(), p, a.cacheTTL)
	w.Header().Set("X-Cache", "MISS")
	writeJSON(w, http.StatusOK, p)
}

func (a *API) update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	var p store.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid")
		return
	}
	p.ID = id
	if msg := validasi(p); msg != "" {
		writeError(w, http.StatusUnprocessableEntity, msg)
		return
	}
	if err := a.store.Update(r.Context(), p); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "produk tidak ditemukan")
		return
	} else if err != nil {
		a.log.Error("gagal mengubah produk", "produk_id", id, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal mengubah produk")
		return
	}
	a.cache.Invalidate(r.Context(), id)
	a.log.Info("cache diinvalidasi", "kunci", "product:"+strconv.FormatInt(id, 10),
		"produk_id", id, "aksi", "ubah")
	writeJSON(w, http.StatusOK, p)
}

func (a *API) delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	if err := a.store.Delete(r.Context(), id); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "produk tidak ditemukan")
		return
	} else if err != nil {
		a.log.Error("gagal menghapus produk", "produk_id", id, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal menghapus produk")
		return
	}
	a.cache.Invalidate(r.Context(), id)
	a.log.Info("cache diinvalidasi", "kunci", "product:"+strconv.FormatInt(id, 10),
		"produk_id", id, "aksi", "hapus")
	w.WriteHeader(http.StatusNoContent)
}`,
      explain: [
        'Urutan cabang di update/delete sama: 400 (id bukan angka) → 422 (isi body melanggar aturan) → 404 (baris tidak ada) → 500 (galat nyata) → 200/204. Cabang memakai <code>errors.Is</code> karena store sudah menerjemahkan "baris tidak ada" menjadi <code>ErrNotFound</code>.',
        'Galat 500 selalu disertai <code>a.log.Error(..., "galat", err)</code>: pengguna cukup melihat pesan umum, operator mendapat penyebab lengkapnya di log — inilah konsekuensi langsung dari warn "jangan bocorkan detail internal".',
        'Panggilan cache pada handler get (HIT/MISS) dan invalidate (setelah tulis) baru dijelaskan mekanismenya di bab 6; di sini ia sudah terpasang supaya kontrak header <code>X-Cache</code> tidak berubah-ubah antar bab.',
        'Delete membalas <b>204 tanpa body</b>: tidak ada yang perlu dikembalikan, dan frontend cukup menghapus barisnya dari tabel. Menyematkan <code>{"message":"ok"}</code> justru memaksa klien mengurai JSON yang tidak pernah dibacanya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pembungkus JSON: Konsistensi dalam 15 Baris</h3><p>Setiap handler menulis JSON dengan cara yang sama. Alih-alih mengulang tiga baris yang sama belasan kali (dan berisiko lupa satu), kita bungkus dalam dua fungsi kecil. Konsistensi di sini bukan selera — ini kontrak yang diandalkan frontend.</p>'
    },
    {
      type: 'example',
      title: 'writeJSON, writeError, dan middleware logging JSON',
      lang: 'go',
      output: false,
      code: `func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"message": msg})
}

// internal/logx — satu baris JSON per permintaan. Path yang masuk daftar
// skip (mis. /healthz, dipantau compose tiap 10 detik) tetap dilayani
// tetapi TIDAK dicatat, agar log tidak dibanjiri baris yang tidak memberi
// informasi baru.
func Middleware(log *slog.Logger, skip ...string) func(http.Handler) http.Handler {
	lewat := make(map[string]bool, len(skip))
	for _, p := range skip {
		lewat[p] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if lewat[r.URL.Path] {
				next.ServeHTTP(w, r)
				return
			}
			start := time.Now()
			sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(sw, r)

			// Header khusus (mis. X-Cache HIT/MISS) ikut disalin ke log
			// supaya riwayat cache terbaca dari SATU baris tanpa menebak.
			args := []any{
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", sw.status),
				slog.Float64("durasi_ms", float64(time.Since(start).Microseconds())/1000),
				slog.String("remote", r.RemoteAddr),
			}
			if c := sw.Header().Get("X-Cache"); c != "" {
				args = append(args, slog.String("x_cache", c))
			}
			log.Info("http_request", args...)
		})
	}
}

// statusWriter mengingat kode status yang ditulis handler (tulisan pertama
// yang menang) agar middleware ikut bisa mencatatnya.
type statusWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (w *statusWriter) WriteHeader(status int) {
	if !w.wroteHeader {
		w.status = status
		w.wroteHeader = true
	}
	w.ResponseWriter.WriteHeader(status)
}`,
      explain: [
        '<b>Header harus ditulis SEBELUM WriteHeader</b> — itulah urutan yang dipakai writeJSON; membaliknya membuat Content-Type terlewat diam-diam dan peringatan bawaan muncul di log.',
        'Middleware hanyalah fungsi yang menerima handler berikutnya dan mengembalikan handler baru — pola ini dipakai ulang untuk logging, CORS, maupun otentikasi bila kamu menambahkannya. <code>skip ...string</code> membuatnya tetap generik: cukup sebutkan path yang tidak ingin dicatat.',
        'Logger memakai <code>log/slog</code> bawaan Go dalam format JSON, jadi setiap baris berdiri sendiri dan bisa dicari dengan atribut bernama: <code>{"level":"INFO","msg":"http_request","service":"product-service","method":"GET","path":"/products/1","status":200,"durasi_ms":1.234}</code>.',
        '<code>statusWriter</code> dibutuhkan agar kode status yang ditulis handler tetap bisa dicatat (tulisan pertama yang menang) — tanpanya semua baris log akan berstatus 200 palsu, termasuk kegagalan 500 yang justru paling dicari.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji seluruh endpoint dengan curl',
      lang: 'bash',
      output: false,
      code: `# Prasyarat: MariaDB + Redis sudah jalan dan product-service dijalankan
# (podman compose up -d mariadb redis, lalu go run ./cmd — lihat bab 4)
# Bila memakai komposer penuh, portnya sama: localhost:8081

# 1) Daftar produk (pertama MISS, ulangi untuk HIT — inti bab berikutnya)
curl -si localhost:8081/products | grep -E 'HTTP|X-Cache'
curl -si localhost:8081/products | grep X-Cache        # → X-Cache: HIT

# 2) Buat produk baru
curl -si -X POST localhost:8081/products \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Susu Kotak Cokelat","category":"minuman","price":12000,"stock":60}'
# → HTTP/1.1 201 Created  + body berisi id baru

# 3) Ambil satu produk
curl -s localhost:8081/products/1

# 4) Ubah harga
curl -si -X PUT localhost:8081/products/1 \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Kopi Arabika Gayo","category":"minuman","price":90000,"stock":40}'

# 5) Uji validasi — harus 422 dengan pesan jelas
curl -si -X POST localhost:8081/products \\
  -H 'Content-Type: application/json' -d '{"name":"  ","price":-1}'

# 6) Galat tak dikenal — harus 404
curl -si localhost:8081/products/9999

# 7) Hapus — harus 204 tanpa body
curl -si -X DELETE localhost:8081/products/2`,
      explain: [
        'Flag <code>-i</code> menampilkan header — tanpanya kamu tidak akan pernah melihat kode status maupun X-Cache, dan setengah dari pembelajaran hilang.',
        'Uji langkah 5 sengaja menggabungkan dua pelanggaran sekaligus (nama kosong DAN harga negatif) untuk memastikan validasi berhenti pada galat PERTAMA sesuai desainnya.',
        'Simpan kumpulan perintah ini sebagai rutin verifikasi setiap kali mengubah handler — namanya behavioural check, dan harganya jauh lebih murah daripada debugging di frontend.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan Pengujian yang Efisien',
      text: 'Uji dalam urutan <b>galat dulu, baru jalur bahagia</b>: mulai dari validasi 422 dan 404, baru ke create-read-update-delete. Alasannya, jalur galat sering mengungkap kesalahan parsing atau pemetaan error yang membuat seluruh hasil pengujian berikutnya menyesatkan — jauh lebih cepat memperbaikinya di awal.'
    },
    {
      type: 'warn',
      title: 'Jangan Bocorkan Detail Internal ke Respons Galat',
      text: 'Pesan <code>gagal menyimpan produk</code> sengaja tidak menyertakan teks galat MySQL. Pesan database bisa memuat nama tabel, nama kolom, bahkan potongan query — informasi yang membantu penyerang, bukan pengguna. Detail lengkap tetap dicatat di <b>log server</b> tempat hanya operator yang boleh membacanya; respons HTTP cukup pesan umum yang tetap sopan.'
    },
    {
      type: 'vocab',
      items: [
        ['CRUD', 'Empat operasi dasar data: Create, Read, Update, Delete — dipetakan ke POST, GET, PUT/DELETE pada REST.'],
        ['Parameterized query', 'SQL dengan nilai diganti tanda tanya (?) dan dikirim terpisah — mencegah SQL injection karena nilai tak pernah menjadi bagian perintah SQL.'],
        ['sql.ErrNoRows', 'Galat bawaan database/sql ketika QueryRow tidak menemukan baris; dipetakan ke error domain ErrNotFound.'],
        ['Kode status HTTP', 'Angka tiga digit (200, 201, 404, 422, 500) yang mewakili hasil permintaan; dijadikan keputusan oleh klien otomatis seperti frontend dan service lain.'],
        ['422 Unprocessable Entity', 'Permintaan terbaca dengan benar tetapi isinya gagal validasi bisnis — dibedakan dari 400 yang berarti permintaan tidak bisa diparsing sama sekali.'],
        ['Middleware', 'Fungsi pembungkus handler yang menambahkan perilaku umum (logging, autentikasi) tanpa menyentuh logika tiap endpoint.'],
        ['Contract API', 'Perjanjian bentuk endpoint, kode status, dan format respons antara penyedia data dan pemakainya.'],
        ['Idempotent read', 'Sifat GET yang boleh diulang tanpa mengubah keadaan — menjadi alasan GET aman diberi cache maupun retry otomatis.']
      ]
    }
  ],
  recap: [
    'product-service memakai net/http Go 1.22+ dengan pola "METHOD /path/{id}" dan PathValue() — tanpa framework routing tambahan.',
    'Lapisan store menjadi satu-satunya pemegang SQL, selalu memakai parameter (?) dan memetakan sql.ErrNoRows ke ErrNotFound.',
    'Kode status dipilih per situasi: 201 untuk create, 204 untuk delete, 400 untuk body tak terbaca, 422 untuk validasi gagal, 404 untuk data tak ada, 500 untuk kegagalan server.',
    'Respons galat selalu berbentuk {"message": ...} sehingga frontend cukup satu fungsi penanganan galat untuk semua service.',
    'Validasi berjalan SEBELUM database dengan pesan yang manusiawi; detail teknis galat hanya masuk log, tidak pernah ke respons.'
  ]
});
