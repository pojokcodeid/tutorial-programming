/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 5: Database Bebas: Repository Pattern & SQLite
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-database',
  title: 'Database Bebas: Repository Pattern & SQLite',
  chapter: 'Database',
  duration: '15 menit',
  intro: [
    'Janji proyek ini adalah <b>database bebas</b>: SQLite, MySQL, atau bahkan data di RAM, tanpa mengubah satu baris pun kode jendela. Janji itu dibayar dengan satu konsep bernama <b>repository pattern</b> — sebuah interface yang duduk di antara logika bisnis dan driver database.',
    'Pelajaran ini membongkar isi <code>internal/repository</code>: kontrak CRUD, tipe pendukungnya, skema SQL, cara membuka koneksi, cara menyusun query filter + pencarian, dan terakhir cara memilih database lewat <b>environment variable</b>.'
  ],
  objectives: [
    'Menjelaskan mengapa akses data dipisahkan dari widget UI',
    'Membandingkan SQLite, MySQL/PostgreSQL, dan file JSON/CSV',
    'Membaca interface Repository beserta seluruh method dan tipenya',
    'Membedakan driver modernc (tanpa CGO) dan mattn (butuh CGO)',
    'Menjalankan aplikasi dengan SQLite lalu berpindah ke MySQL lewat env'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa SQL tidak boleh menempel di tombol?</h3><p>Aturan pertama arsitektur ini sudah muncul di pelajaran 1, dan sekarang saatnya dijalankan: <b>UI tidak menulis SQL</b>. Widget hanya mengumpulkan input dan menampilkan hasil; urusan query diserahkan kepada repository.</p><p>Coba bayangkan kebalikannya. Kalau <code>widget.NewButton("Tambah")</code> langsung menulis <code>INSERT INTO todos ...</code> di dalam callback-nya, maka perubahan database berarti <b>menulis ulang seluruh jendela</b>: pindah ke MySQL mengubah kode tombol, mengubah kolom berarti menyentuh form, dan mengubah urutan tampil berarti menyusun ulang daftar. Satu keputusan penyimpanan merambat ke semua widget.</p>'
    },
    {
      type: 'text',
      html: '<p>Dengan interface di tengah, perubahan itu terhenti di satu lapisan. Lihat kotak <code>interface Repository</code> pada gambar — di situ berhenti semua detail database, dan di bawahnya bebas tiga implementasi berdiri sejajar.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 440" width="760" role="img" aria-label="Diagram aliran data: UI Fyne memanggil service, service memanggil interface repository, yang diwujudkan driver sqlite, mysql, dan memory dengan target file todo.db, server MySQL, dan RAM">
        <rect x="180" y="14" width="400" height="54" rx="8" class="u-hd"/>
        <text x="380" y="38" class="u-title" text-anchor="middle">UI Fyne — internal/ui</text>
        <text x="380" y="57" class="u-lbl" text-anchor="middle">Entry · Select · List · Dialog</text>
        <line x1="380" y1="70" x2="380" y2="102" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="395" y="90" class="u-lbl" text-anchor="start">tanpa satu pun SQL</text>
        <rect x="180" y="106" width="400" height="54" rx="8" class="u-box"/>
        <text x="380" y="130" class="u-title" text-anchor="middle">Service — internal/service</text>
        <text x="380" y="149" class="u-lbl" text-anchor="middle">validasi · aturan bisnis · orkestrasi</text>
        <line x1="380" y1="162" x2="380" y2="194" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="395" y="182" class="u-lbl" text-anchor="start">hanya tahu interface</text>
        <rect x="180" y="198" width="400" height="54" rx="8" class="u-box"/>
        <text x="380" y="222" class="u-title" text-anchor="middle">interface Repository — repository.go</text>
        <text x="380" y="241" class="u-lbl" text-anchor="middle">List · Get · Add · Update · ToggleDone · Delete · Stats</text>
        <line x1="200" y1="254" x2="128" y2="294" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="254" x2="380" y2="294" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="560" y1="254" x2="632" y2="294" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="44" y="298" width="168" height="52" rx="8" class="u-box"/>
        <text x="128" y="320" class="u-title" text-anchor="middle">sqlite (default)</text>
        <text x="128" y="339" class="u-lbl" text-anchor="middle">modernc · tanpa CGO</text>
        <rect x="296" y="298" width="168" height="52" rx="8" class="u-box"/>
        <text x="380" y="320" class="u-title" text-anchor="middle">mysql / mariadb</text>
        <text x="380" y="339" class="u-lbl" text-anchor="middle">go-sql-driver · pool</text>
        <rect x="548" y="298" width="168" height="52" rx="8" class="u-box"/>
        <text x="632" y="320" class="u-title" text-anchor="middle">memory</text>
        <text x="632" y="339" class="u-lbl" text-anchor="middle">slice + map · untuk test</text>
        <line x1="128" y1="352" x2="128" y2="382" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="352" x2="380" y2="382" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="632" y1="352" x2="632" y2="382" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="44" y="386" width="168" height="42" rx="8" class="u-box"/>
        <text x="128" y="412" class="u-lbl" text-anchor="middle">file todo.db</text>
        <rect x="296" y="386" width="168" height="42" rx="8" class="u-box"/>
        <text x="380" y="412" class="u-lbl" text-anchor="middle">server MySQL (jaringan)</text>
        <rect x="548" y="386" width="168" height="42" rx="8" class="u-box"/>
        <text x="632" y="412" class="u-lbl" text-anchor="middle">RAM (hilang saat tutup)</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Satu interface, tiga driver: UI dan service tidak pernah tahu apakah data hidup di file, di server, atau hanya di memori</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Pilihan database: inilah arti bebas</h3><p>Kata "bebas" bukan berarti semua database sama. Setiap pilihan punya harga dan waktu penggunaannya sendiri:</p><table><tr><th>Database</th><th>Cara kerja</th><th>Kapan memakai</th></tr><tr><td><b>SQLite</b><br><code>modernc.org/sqlite</code></td><td>Embedded: satu file <code>todo.db</code>, tanpa server, driver murni Go</td><td>Aplikasi desktop per pengguna, jalan offline — default proyek ini</td></tr><tr><td><b>MySQL / MariaDB</b><br>dan PostgreSQL</td><td>Server terpisah, diakses lewat jaringan</td><td>Beberapa perangkat berbagi data yang sama</td></tr><tr><td><b>File JSON / CSV</b></td><td>Tulis-baca file langsung, tanpa query dan tanpa index</td><td>Data sangat kecil dan jarang berubah; rawan tabrakan bila dua proses menulis bersamaan</td></tr></table><p>Karena semua baris di atas di balik interface yang sama, keputusan itu <b>bisa ditunda</b> sampai aplikasi jalan, bahkan diubah per komputer lewat environment variable.</p>'
    },
    {
      type: 'example',
      title: 'Kontrak lengkap: interface Repository',
      lang: 'go',
      output: false,
      code: `// internal/repository/repository.go — seluruh kontrak akses data
package repository

import (
	"context"
	"errors"

	"example.com/go-todo-app/internal/model"
)

// ErrNotFound dipakai ketika ID yang diminta tidak ada di database.
var ErrNotFound = errors.New("todo tidak ditemukan")

// Repository adalah kontrak CRUD yang harus dipenuhi tiap driver database.
type Repository interface {
	List(ctx context.Context, q Query) ([]model.Todo, error)
	Get(ctx context.Context, id int64) (model.Todo, error)
	Add(ctx context.Context, t model.Todo) (model.Todo, error)
	Update(ctx context.Context, t model.Todo) error
	ToggleDone(ctx context.Context, id int64) (model.Todo, error)
	Delete(ctx context.Context, id int64) error
	Stats(ctx context.Context) (Stats, error)
	Close() error
}`,
      explain: [
        'Delapan method ini adalah <b>seluruh</b> yang boleh diketahui service dan UI — tidak ada nama tabel, kolom, atau sintaks SQL yang bocor ke sana.',
        'Setiap method menerima <code>context.Context</code> di posisi pertama sehingga operasi panjang bisa dibatalkan, persis pola database di materi REST API.',
        'Error dibuat dengan <code>errors.New</code> lalu diekspor sebagai <code>ErrNotFound</code> — jangan bandingkan pesan teks, nanti dipakai <code>errors.Is</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tugas tiap method</h3><ul><li><code>List</code> — membaca banyak baris sesuai <b>Query</b> (filter + kata pencarian), dipakai widget.List.</li><li><code>Get</code> — membaca satu baris berdasarkan ID, mengembalikan <code>ErrNotFound</code> bila tidak ada.</li><li><code>Add</code> — menyimpan todo baru; ID dan waktu dibuat database, lalu dikembalikan utuh.</li><li><code>Update</code> — menimpa judul, catatan, kategori, prioritas, dan status pada baris yang sudah ada.</li><li><code>ToggleDone</code> — membalik status selesai dan mengembalikan baris terbarunya.</li><li><code>Delete</code> — menghapus satu baris, mengembalikan <code>ErrNotFound</code> bila ID sudah tidak ada.</li><li><code>Stats</code> — menghitung total, aktif, dan selesai dalam satu query untuk label statistik.</li><li><code>Close</code> — menutup koneksi; dipanggil <code>defer repo.Close()</code> di <code>main</code>.</li></ul>'
    },
    {
      type: 'example',
      title: 'Tipe pendukung & helper query',
      lang: 'go',
      output: false,
      code: `type Filter string

const (
	FilterAll    Filter = "semua"   // semua data
	FilterActive Filter = "aktif"   // belum selesai
	FilterDone   Filter = "selesai" // sudah selesai
)

// Query memuat kriteria baca: tombol filter + kata pencarian bebas.
type Query struct {
	Filter Filter
	Search string
}

// Stats dipakai label hitungan di header UI.
type Stats struct {
	Total  int
	Active int
	Done   int
}

// ValidFilters dipakai widget.Select di UI.
func ValidFilters() []string {
	return []string{string(FilterAll), string(FilterActive), string(FilterDone)}
}

// NormalizeQuery memberi nilai default sehingga tiap driver tidak perlu
// mengurus kasus "belum diisi".
func NormalizeQuery(q Query) Query {
	if q.Filter == "" || q.Filter == FilterAll {
		q.Filter = FilterAll
	}
	q.Search = strings.TrimSpace(q.Search)
	return q
}

// LikePattern membungkus kata pencarian untuk operator LIKE (%kata%).
func LikePattern(q string) string {
	return "%" + strings.TrimSpace(q) + "%"
}

// FilterWhere mengembalikan potongan klausa WHERE sesuai filter
// (tanpa kata pencarian). Klausa disusun dengan tanda tanya (? parameter).
func FilterWhere(q Query) (clause string, args []any) {
	switch NormalizeQuery(q).Filter {
	case FilterActive:
		return "done = 0", nil
	case FilterDone:
		return "done = 1", nil
	default:
		return "1 = 1", nil
	}
}`,
      explain: [
        'Helper dipisah di package <code>repository</code> karena ketiga driver memakainya — SQLite, MySQL, dan memory tidak boleh punya versi WHERE yang berbeda-beda.',
        '<code>FilterWhere</code> mengembalikan klausa <b>dan</b> daftar argumennya berpasangan; driver tinggal menambah potongan <code>AND (title LIKE ? ...)</code> tanpa menyusun ulang.',
        'Nilai default <code>"1 = 1"</code> membuat filter "semua" tetap punya klausa WHERE sehingga penggabungan string di driver tidak perlu menangani kasus kosong.'
      ]
    },
    {
      type: 'example',
      title: 'Tiga driver, tiga import — hanya namanya yang beda',
      lang: 'go',
      output: false,
      code: `// internal/repository/sqlite/sqlite.go
// Driver modernc: implementasi murni Go, TIDAK butuh CGO.
// Perintah blank import mendaftarkan driver dengan nama "sqlite".
import _ "modernc.org/sqlite"

// Pembanding: github.com/mattn/go-sqlite3 — populer, tapi butuh CGO
// sehingga build harus punya compiler C dan waktu compile lebih lama.

// internal/repository/mysql/mysql.go
// go-sql-driver mendaftarkan driver dengan nama "mysql".
import _ "github.com/go-sql-driver/mysql"

// Baris penjaga di tiap driver — bila satu method belum diimplementasikan,
// kompilasi langsung gagal:
var _ repository.Repository = (*Store)(nil)`,
      explain: [
        'Nama string di <code>sql.Open</code> ("sqlite", "mysql") harus <b>persis</b> sama dengan nama yang didaftarkan blank import — kalau beda, aplikasi langsung error driver tidak dikenal.',
        'Driver <b>modernc</b> adalah pilihan proyek ini karena SQLite-nya murni Go: build lintas platform tidak lagi bergantung pada compiler C untuk bagian database.',
        'Baris <code>var _ repository.Repository = (*Store)(nil)</code> adalah compile-time check; kontrak dipantau oleh kompilator, bukan oleh review manual.'
      ]
    },
    {
      type: 'example',
      title: 'Skema database (migrations/sqlite.sql)',
      lang: 'sql',
      output: false,
      code: `-- Skema SQLite untuk aplikasi Todo App (referensi).
-- Salinan yang sama dieksekusi otomatis oleh internal/repository/sqlite
-- saat aplikasi dibuka, sehingga file ini murni dokumentasi/riwayat migrasi.

CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    note       TEXT    NOT NULL DEFAULT '',
    category   TEXT    NOT NULL DEFAULT 'Umum',
    priority   TEXT    NOT NULL DEFAULT 'sedang',
    done       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL,
    updated_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done);`,
      explain: [
        'Kolom <code>done</code> bertipe INTEGER berisi <b>0 atau 1</b> — SQLite tidak punya tipe khusus boolean, dan angka ini yang membuat <code>CASE WHEN done = 0</code> bisa dihitung cepat lewat index.',
        '<code>created_at</code> dan <code>updated_at</code> disimpan sebagai <b>teks RFC3339</b> (mis. <code>2026-10-18T09:30:00Z</code>) sehingga format identik di SQLite, MySQL, maupun memory.',
        '<code>IF NOT EXISTS</code> membuat migrasi <b>idempoten</b>: membuka aplikasi ke-100 kali tetap aman karena tabel yang sudah ada tidak lagi dibuat ulang.'
      ]
    },
    {
      type: 'example',
      title: 'Membuka database: sql.Open, batas koneksi, Ping, migrasi',
      lang: 'go',
      output: false,
      code: `// internal/repository/sqlite/sqlite.go
// skemaSQL dijalankan otomatis saat aplikasi pertama kali dibuka.
var skemaSQL = []string{
	"CREATE TABLE IF NOT EXISTS todos (" +
		"id INTEGER PRIMARY KEY AUTOINCREMENT, " +
		"title TEXT NOT NULL, " +
		"note TEXT NOT NULL DEFAULT '', " +
		"category TEXT NOT NULL DEFAULT 'Umum', " +
		"priority TEXT NOT NULL DEFAULT 'sedang', " +
		"done INTEGER NOT NULL DEFAULT 0, " +
		"created_at TEXT NOT NULL, " +
		"updated_at TEXT NOT NULL)",
	"CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done)",
}

func Open(dsn string) (*Store, error) {
	if dsn == "" {
		dsn = "todo.db"
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("buka sqlite: %w", err)
	}
	// SQLite hanya mengizinkan SATU proses menulis. Batasi pool agar koneksi
	// tidak berebut kunci dan memicu pesan "database is locked".
	db.SetMaxOpenConns(1)

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("koneksi sqlite: %w", err)
	}
	for _, stmt := range skemaSQL {
		if _, err := db.Exec(stmt); err != nil {
			db.Close()
			return nil, fmt.Errorf("migrasi skema: %w", err)
		}
	}
	return &Store{db: db}, nil
}`,
      explain: [
        '<code>sql.Open</code> sebenarnya belum membuka koneksi apa pun — koneksi baru terjadi saat <code>Ping()</code>; karena itu Ping dipakai untuk memastikan file benar-benar bisa diakses sebelum jendela muncul.',
        '<code>SetMaxOpenConns(1)</code> wajib untuk file SQLite: dengan lebih dari satu koneksi penulis, dua goroutine berebut lock dan kamu akan melihat pesan <code>database is locked</code>.',
        'Tiap kegagalan <code>Close()</code> dulu sebelum mengembalikan error — tidak menyimpan koneksi setengah jalan. Semua error dibungkus <code>fmt.Errorf("%w")</code> agar rantai error tetap terbaca.'
      ]
    },
    {
      type: 'example',
      title: 'List(): menyusun WHERE, LIKE, dan urutan prioritas',
      lang: 'go',
      output: false,
      code: `func (s *Store) List(ctx context.Context, q repository.Query) ([]model.Todo, error) {
	where, args := repository.FilterWhere(q)
	if q.Search != "" {
		where += " AND (title LIKE ? OR note LIKE ? OR category LIKE ?)"
		like := repository.LikePattern(q.Search)
		args = append(args, like, like, like)
	}
	// Urutan: belum selesai di atas, lalu prioritas tinggi, lalu yang terbaru.
	query := "SELECT " + kolomSelect + " FROM todos WHERE " + where +
		" ORDER BY done ASC," +
		" CASE priority WHEN 'tinggi' THEN 0 WHEN 'sedang' THEN 1 ELSE 2 END ASC," +
		" id DESC"

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("baca daftar todo: %w", err)
	}
	defer rows.Close()

	var hasil []model.Todo
	for rows.Next() {
		t, err := scanTodo(rows)
		if err != nil {
			return nil, err
		}
		hasil = append(hasil, t)
	}
	return hasil, rows.Err()
}`,
      explain: [
        'Klausa dibangun bertahap: <code>FilterWhere</code> memberi potongan filter, lalu pencarian menempel <code>AND (title LIKE ? ...)</code> — semuanya memakai tanda tanya, nilainya lewat <code>args</code>.',
        '<code>CASE priority WHEN ... END</code> mengubah teks prioritas menjadi angka 0/1/2 sehingga "tinggi" selalu naik ke atas tanpa mengurutkan di memori Go.',
        'Setelah loop, <code>rows.Err()</code> tetap diperiksa — kesalahan yang terjadi di tengah pembacaan baris tidak muncul dari <code>rows.Next()</code> yang berhenti.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memilih database lewat environment variable</h3><p>Semua keputusan itu dikumpulkan di satu file: <code>internal/storage/storage.go</code>. Package ini adalah <b>satu-satunya</b> tempat yang mengimpor ketiga driver.</p><table><tr><th>Variabel</th><th>Default</th><th>Keterangan</th></tr><tr><td><code>TODO_DB_DRIVER</code></td><td><code>sqlite</code></td><td>Pilihan: <code>sqlite</code>, <code>mysql</code>, <code>memory</code></td></tr><tr><td><code>TODO_DB_DSN</code></td><td><code>todo.db</code></td><td>Tergantung driver: nama file untuk SQLite, string koneksi untuk MySQL, diabaikan untuk memory</td></tr></table>'
    },
    {
      type: 'example',
      title: 'storage.FromEnv() — jalur tunggal pemilihan database',
      lang: 'go',
      output: false,
      code: `// internal/storage/storage.go
func FromEnv() (repository.Repository, error) {
	driver := env("TODO_DB_DRIVER", "sqlite")
	return Open(driver, env("TODO_DB_DSN", defaultDSN(driver)))
}

// Open membangun repository berdasarkan nama driver.
func Open(driver, dsn string) (repository.Repository, error) {
	switch driver {
	case "sqlite":
		return sqlite.Open(dsn)
	case "mysql":
		return mysql.Open(dsn)
	case "memory":
		// Tidak memakai DSN — datanya murni di RAM.
		return memory.New(), nil
	default:
		return nil, fmt.Errorf("driver %q tidak dikenal (pilihan: sqlite, mysql, memory)", driver)
	}
}

func defaultDSN(driver string) string {
	if driver == "mysql" {
		return "todo:rahasia@tcp(127.0.0.1:3306)/todo_app?charset=utf8mb4&parseTime=false&loc=UTC"
	}
	return "todo.db"
}`,
      explain: [
        'Hasil fungsi ini bertipe <code>repository.Repository</code> — <code>main</code> meneruskannya ke <code>service.New</code> tanpa pernah tahu driver mana yang dipilih.',
        'Nilai default ditangani di satu tempat (<code>env</code> dan <code>defaultDSN</code>), sehingga aplikasi tetap jalan walau kedua variabel tidak di-set sama sekali.',
        'Pesan error pada <code>default</code> menyebutkan pilihan yang sah — pengguna salah ketik langsung tahu apa yang harus diperbaiki.'
      ]
    },
    {
      type: 'example',
      title: 'Mencoba MySQL dalam tiga perintah',
      lang: 'bash',
      output: false,
      code: `# 1. Buat database & user terlebih dahulu (sekali saja, lewat mysql CLI)
mysql -u root -p <<'SQL'
CREATE DATABASE todo_app CHARACTER SET utf8mb4;
CREATE USER 'todo'@'localhost' IDENTIFIED BY 'rahasia';
GRANT ALL ON todo_app.* TO 'todo'@'localhost';
FLUSH PRIVILEGES;
SQL

# 2. Jalankan aplikasi di atas MySQL — skema dibuat otomatis saat pertama buka
TODO_DB_DRIVER=mysql \\
TODO_DB_DSN="todo:rahasia@tcp(127.0.0.1:3306)/todo_app?charset=utf8mb4&parseTime=false&loc=UTC" \\
go run ./cmd/todo

# 3. Kembali ke SQLite: cukup jalankan tanpa kedua variabel itu
go run ./cmd/todo`,
      explain: [
        'Variabel diletakkan di depan perintah sehingga hanya berlaku untuk satu kali <code>go run</code> — pengaturan shell-mu tidak berubah.',
        'Baris <code>\\</code> (backslash) memecah satu perintah menjadi beberapa baris agar DSN yang panjang tetap terbaca.',
        'Table <code>todos</code> di MySQL dibuat oleh loop migrasi di <code>mysql.Open</code>; kamu tidak perlu menjalankan <code>migrations/mysql.sql</code> secara manual.'
      ]
    },
    {
      type: 'warn',
      title: 'Dua aturan yang tidak boleh dilanggar',
      text: '<b>(1) Semua SQL berada di package repository.</b> Jangan pernah menulis <code>SELECT</code>/<code>INSERT</code> di dalam widget, closure tombol, maupun service — begitu query masuk ke kode UI, janji "database bebas" hangus dan mengganti driver berarti menulis ulang jendela. <b>(2) SetMaxOpenConns(1) wajib untuk SQLite file</b>, sedangkan MySQL justru memakai pool: driver <code>mysql</code> disetel <code>SetMaxOpenConns(10)</code> dan <code>SetConnMaxLifetime(time.Hour)</code> karena server jarak jauh justru diuntungkan banyak koneksi yang dipakai bersama. Menyalin angka satu ke yang lain = <code>database is locked</code> di SQLite, atau koneksi terbuang sia-sia di MySQL.'
    },
    {
      type: 'vocab',
      items: [
        ['Repository pattern', 'Pola menempatkan seluruh akses data di balik interface; lapisan atas hanya mengenal kontrak, bukan driver.'],
        ['DSN', 'Data Source Name — string yang menjelaskan cara menghubungkan database, misalnya nama file <code>todo.db</code> atau <code>user:pass@tcp(host:port)/db</code>.'],
        ['Driver database', 'Package yang mendaftarkan nama ke <code>database/sql</code> lewat blank import, misalnya <code>modernc.org/sqlite</code> dengan nama "sqlite".'],
        ['CGO', 'Kemampuan Go memanggil kode C. Dibutuhkan driver mattn/go-sqlite3, tetapi tidak oleh modernc.'],
        ['Migrasi idempoten', 'Skema yang aman dijalankan berulang kali; pada proyek ini dicapai dengan <code>CREATE TABLE IF NOT EXISTS</code>.'],
        ['Pool koneksi', 'Kumpulan koneksi yang dikelola <code>database/sql</code>; dibatasi lewat <code>SetMaxOpenConns</code>.'],
        ['RFC3339', 'Format waktu teks standar (2026-10-18T09:30:00Z) yang dipakai kolom created_at dan updated_at.'],
        ['Prepared statement', 'Query yang parameter nilainya diisi lewat tanda tanya (?), dipisahkan dari perintah SQL sehingga aman dari injeksi.']
      ]
    }
  ],
  recap: [
    '<b>UI tidak menulis SQL</b>: query menempel di widget membuat setiap perubahan database berarti menulis ulang jendela.',
    '<b>interface Repository</b> (List, Get, Add, Update, ToggleDone, Delete, Stats, Close) adalah satu-satunya yang dikenal service dan UI.',
    'Tiga driver — <b>sqlite</b> (modernc, tanpa CGO), <b>mysql</b> (go-sql-driver), dan <b>memory</b> — memenuhi kontrak yang sama.',
    'Skema dibuat otomatis saat aplikasi dibuka dengan <code>CREATE TABLE IF NOT EXISTS</code> sehingga migrasi idempoten; <code>done</code> disimpan 0/1 dan waktu dalam format RFC3339.',
    'SQLite file wajib <code>SetMaxOpenConns(1)</code> agar tidak muncul <code>database is locked</code>; MySQL justru memakai pool koneksi.',
    'Pemilihan database terjadi di <code>storage.FromEnv()</code> lewat <code>TODO_DB_DRIVER</code> dan <code>TODO_DB_DSN</code> — tanpa menyentuh kode UI.'
  ]
});
