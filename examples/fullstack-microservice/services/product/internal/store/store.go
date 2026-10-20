/*
Package store — akses data produk ke MariaDB (product_db).

Lapisan ini satu-satunya yang boleh menyentuh tabel products:
setiap service menjaga database-nya sendiri (database-per-service).
*/
package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// Product adalah model produk sekaligus "kontrak" JSON untuk frontend.
type Product struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Price     int       `json:"price"`
	Stock     int       `json:"stock"`
	CreatedAt time.Time `json:"created_at"`
}

// ErrNotFound dipakai handler untuk membedakan "data tidak ada" (404)
// dari "database rusak" (500).
var ErrNotFound = errors.New("produk tidak ditemukan")

type Store struct {
	db *sql.DB
}

func New(db *sql.DB) *Store { return &Store{db: db} }

const kolom = "id, name, category, price, stock, created_at"

// List mengembalikan seluruh produk termurah dulu (untuk dropdown & tabel).
func (s *Store) List(ctx context.Context) ([]Product, error) {
	rows, err := s.db.QueryContext(ctx,
		"SELECT "+kolom+" FROM products ORDER BY id")
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
}

// Create menyimpan produk baru dan mengembalikan ID hasil insert.
func (s *Store) Create(ctx context.Context, p Product) (int64, error) {
	res, err := s.db.ExecContext(ctx,
		"INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)",
		p.Name, p.Category, p.Price, p.Stock)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
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
}
