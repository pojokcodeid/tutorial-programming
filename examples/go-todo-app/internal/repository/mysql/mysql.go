// Package mysql menyimpan todo pada server MySQL / MariaDB.
//
// Ini adalah bukti bahwa repository interface benar-benar bebas database:
// kodenya berdiri sejajar dengan package sqlite, memenuhi kontrak yang sama,
// dan dipilih hanya lewat satu switch di cmd/todo/main.go.
//
// Catatan perbedaan SQLite vs MySQL:
//   - nama driver: "mysql"
//   - skema: AUTO_INCREMENT vs INTEGER PRIMARY KEY AUTOINCREMENT
//   - default koneksi: SQLite memakai 1 koneksi, MySQL memakai pool
package mysql

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql" // mendaftarkan driver dengan nama "mysql"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
)

// Store merealisasikan repository.Repository di atas server MySQL/MariaDB.
var _ repository.Repository = (*Store)(nil)

var skemaSQL = []string{
	`CREATE TABLE IF NOT EXISTS todos (
		id         INT AUTO_INCREMENT PRIMARY KEY,
		title      VARCHAR(120) NOT NULL,
		note       TEXT         NOT NULL,
		category   VARCHAR(40)  NOT NULL DEFAULT 'Umum',
		priority   VARCHAR(10)  NOT NULL DEFAULT 'sedang',
		done       TINYINT(1)   NOT NULL DEFAULT 0,
		created_at TEXT         NOT NULL,
		updated_at TEXT         NOT NULL,
		KEY idx_todos_done (done)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
}

const kolomSelect = `id, title, note, category, priority, done, created_at, updated_at`

type Store struct{ db *sql.DB }

// Open menerima DSN standar go-sql-driver, contoh:
//
//	"todo:rahasia@tcp(127.0.0.1:3306)/todo_app?charset=utf8mb4&parseTime=false&loc=UTC"
func Open(dsn string) (*Store, error) {
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("buka mysql: %w", err)
	}
	// MySQL justru suka koneksi bersama; batasi agar tidak membanjiri server.
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("koneksi mysql: %w", err)
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
	return satuBaris(res, repository.ErrNotFound, "ubah todo")
}

func (s *Store) ToggleDone(ctx context.Context, id int64) (model.Todo, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	res, err := s.db.ExecContext(ctx,
		`UPDATE todos SET done = 1 - done, updated_at = ? WHERE id = ?`, now, id)
	if err != nil {
		return model.Todo{}, fmt.Errorf("ubah status todo: %w", err)
	}
	if err := satuBaris(res, repository.ErrNotFound, "ubah status todo"); err != nil {
		return model.Todo{}, err
	}
	return s.Get(ctx, id)
}

func (s *Store) Delete(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM todos WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("hapus todo: %w", err)
	}
	return satuBaris(res, repository.ErrNotFound, "hapus todo")
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

func satuBaris(res sql.Result, notFound error, kegiatan string) error {
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
