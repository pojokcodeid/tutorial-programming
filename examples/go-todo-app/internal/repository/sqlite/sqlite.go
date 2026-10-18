// Package sqlite menyimpan data pada file SQLite lokal.
//
// Driver yang dipakai: modernc.org/sqlite — implementasi murni Go,
// sehingga TIDAK membutuhkan CGO/penerjemah C. Bedakan dengan driver
// github.com/mattn/go-sqlite3 yang butuh CGO.
package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	_ "modernc.org/sqlite" // mendaftarkan driver dengan nama "sqlite"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
)

// Store merealisasikan repository.Repository di atas file SQLite.
var _ repository.Repository = (*Store)(nil)

// skemaSQL dijalankan otomatis saat aplikasi pertama kali dibuka
// (idempoten — "IF NOT EXISTS" membuatnya aman dijalankan berulang).
// Salinan SQL yang sama juga tersedia di folder migrations/.
var skemaSQL = []string{
	`CREATE TABLE IF NOT EXISTS todos (
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		title      TEXT    NOT NULL,
		note       TEXT    NOT NULL DEFAULT '',
		category   TEXT    NOT NULL DEFAULT 'Umum',
		priority   TEXT    NOT NULL DEFAULT 'sedang',
		done       INTEGER NOT NULL DEFAULT 0,
		created_at TEXT    NOT NULL,
		updated_at TEXT    NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done)`,
}

const kolomSelect = `id, title, note, category, priority, done, created_at, updated_at`

type Store struct{ db *sql.DB }

// Open membuka (dan bila perlu membuat) file SQLite, lalu memastikan skema siap.
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
}

func (s *Store) List(ctx context.Context, q repository.Query) ([]model.Todo, error) {
	where, args := repository.FilterWhere(q)
	if q.Search != "" {
		where += ` AND (title LIKE ? OR note LIKE ? OR category LIKE ?)`
		like := repository.LikePattern(q.Search)
		args = append(args, like, like, like)
	}
	// Urutan: belum selesai di atas, lalu prioritas tinggi, lalu yang terbaru.
	query := `SELECT ` + kolomSelect + ` FROM todos WHERE ` + where + `
		ORDER BY done ASC,
		         CASE priority WHEN 'tinggi' THEN 0 WHEN 'sedang' THEN 1 ELSE 2 END ASC,
		         id DESC`

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
}

func (s *Store) Get(ctx context.Context, id int64) (model.Todo, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT `+kolomSelect+` FROM todos WHERE id = ?`, id)
	t, err := scanTodo(row)
	if errors.Is(err, sql.ErrNoRows) {
		return model.Todo{}, repository.ErrNotFound
	}
	return t, err
}

func (s *Store) Add(ctx context.Context, t model.Todo) (model.Todo, error) {
	now := time.Now().UTC()
	if t.CreatedAt.IsZero() {
		t.CreatedAt = now
	}
	t.UpdatedAt = now

	res, err := s.db.ExecContext(ctx, `
		INSERT INTO todos (title, note, category, priority, done, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		t.Title, t.Note, t.Category, t.Priority, boolToInt(t.Done),
		t.CreatedAt.Format(time.RFC3339Nano), t.UpdatedAt.Format(time.RFC3339Nano))
	if err != nil {
		return model.Todo{}, fmt.Errorf("simpan todo: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return model.Todo{}, fmt.Errorf("baca id hasil insert: %w", err)
	}
	t.ID = id
	return t, nil
}

func (s *Store) Update(ctx context.Context, t model.Todo) error {
	t.UpdatedAt = time.Now().UTC()
	res, err := s.db.ExecContext(ctx, `
		UPDATE todos SET title = ?, note = ?, category = ?, priority = ?,
		                 done = ?, updated_at = ?
		WHERE id = ?`,
		t.Title, t.Note, t.Category, t.Priority, boolToInt(t.Done),
		t.UpdatedAt.Format(time.RFC3339Nano), t.ID)
	if err != nil {
		return fmt.Errorf("ubah todo: %w", err)
	}
	return hanyaSatuBaris(res, repository.ErrNotFound, "ubah todo")
}

func (s *Store) ToggleDone(ctx context.Context, id int64) (model.Todo, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	res, err := s.db.ExecContext(ctx,
		`UPDATE todos SET done = 1 - done, updated_at = ? WHERE id = ?`, now, id)
	if err != nil {
		return model.Todo{}, fmt.Errorf("ubah status todo: %w", err)
	}
	if err := hanyaSatuBaris(res, repository.ErrNotFound, "ubah status todo"); err != nil {
		return model.Todo{}, err
	}
	return s.Get(ctx, id)
}

func (s *Store) Delete(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM todos WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("hapus todo: %w", err)
	}
	return hanyaSatuBaris(res, repository.ErrNotFound, "hapus todo")
}

func (s *Store) Stats(ctx context.Context) (repository.Stats, error) {
	var total, aktif int
	err := s.db.QueryRowContext(ctx, `
		SELECT COUNT(*),
		       COALESCE(SUM(CASE WHEN done = 0 THEN 1 ELSE 0 END), 0)
		FROM todos`).Scan(&total, &aktif)
	if err != nil {
		return repository.Stats{}, fmt.Errorf("hitung statistik: %w", err)
	}
	return repository.Stats{Total: total, Active: aktif, Done: total - aktif}, nil
}

func (s *Store) Close() error { return s.db.Close() }

// scanTodo memetakan satu baris hasil query ke struct model.
// Waktu disimpan sebagai teks RFC3339 agar formatnya identik di semua driver.
func scanTodo(scanner interface{ Scan(...any) error }) (model.Todo, error) {
	var (
		t                    model.Todo
		done                 int
		createdAt, updatedAt string
	)
	err := scanner.Scan(&t.ID, &t.Title, &t.Note, &t.Category, &t.Priority,
		&done, &createdAt, &updatedAt)
	if err != nil {
		return model.Todo{}, err
	}
	t.Done = done != 0
	if t.CreatedAt, err = time.Parse(time.RFC3339Nano, createdAt); err != nil {
		return model.Todo{}, fmt.Errorf("baca created_at: %w", err)
	}
	if t.UpdatedAt, err = time.Parse(time.RFC3339Nano, updatedAt); err != nil {
		return model.Todo{}, fmt.Errorf("baca updated_at: %w", err)
	}
	return t, nil
}

func hanyaSatuBaris(res sql.Result, notFound error, kegiatan string) error {
	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s: %w", kegiatan, err)
	}
	if n == 0 {
		return notFound
	}
	return nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
