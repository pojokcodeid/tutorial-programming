/*
Package store — akses data pesanan ke MariaDB (order_db).

Keunikan di sini: kolom idempotency_key bertanda UNIQUE. Kunci ini datang
dari frontend; bila klien mengirim ulang request yang sama (misal karena
timeout), pesanan TIDAK tercatat dua kali — permintaan ulang dijawab dengan
pesanan yang sudah ada.
*/
package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/go-sql-driver/mysql"
)

// Order adalah satu baris pesanan beserta snapshot harga produk saat dibeli.
type Order struct {
	ID        int64     `json:"id"`
	ProductID int64     `json:"product_id"`
	Product   string    `json:"product"`
	Qty       int       `json:"qty"`
	UnitPrice int       `json:"unit_price"`
	Total     int       `json:"total"`
	Customer  string    `json:"customer"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

var ErrNotFound = errors.New("pesanan tidak ditemukan")

// ErrDupKey dikenali dari kode galat MySQL 1062 (UNIQUE violation).
// Dipakai handler untuk menjawab "request ini sudah pernah diproses".
type DupKeyError struct{ Existing Order }

func (e *DupKeyError) Error() string { return "idempotency key sudah dipakai" }

type Store struct{ db *sql.DB }

func New(db *sql.DB) *Store { return &Store{db: db} }

const kolom = "id, product_id, product_name, qty, unit_price, total, customer, status, created_at"

// Create menyimpan pesanan baru. Bila idempotency_key bentrok dengan pesanan
// lama, ia mengembalikan pesanan lama itu lewat *DupKeyError.
func (s *Store) Create(ctx context.Context, o Order, idemKey string) (Order, error) {
	res, err := s.db.ExecContext(ctx,
		`INSERT INTO orders (idempotency_key, product_id, product_name, qty, unit_price, total, customer, status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
	id, err := res.LastInsertId()
	if err != nil {
		return Order{}, err
	}
	o.ID = id
	// Isi waktu buat agar respons POST (dan event yang terbit) tidak
	// menampilkan waktu nol; kolom DB memakai CURRENT_TIMESTAMP UTC.
	o.CreatedAt = time.Now().UTC()
	return o, nil
}

// GetByKey mencari pesanan berdasar kunci idempotensi milik klien.
func (s *Store) GetByKey(ctx context.Context, key string) (Order, error) {
	var o Order
	err := s.db.QueryRowContext(ctx,
		"SELECT "+kolom+" FROM orders WHERE idempotency_key = ?", key).
		Scan(&o.ID, &o.ProductID, &o.Product, &o.Qty, &o.UnitPrice, &o.Total, &o.Customer, &o.Status, &o.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Order{}, ErrNotFound
	}
	return o, err
}

// List mengembalikan pesanan terbaru dahulu.
func (s *Store) List(ctx context.Context) ([]Order, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT "+kolom+" FROM orders ORDER BY id DESC LIMIT 100")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Order
	for rows.Next() {
		var o Order
		if err := rows.Scan(&o.ID, &o.ProductID, &o.Product, &o.Qty, &o.UnitPrice, &o.Total, &o.Customer, &o.Status, &o.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

// isDup memeriksa apakah galat berasal dari pelanggaran UNIQUE (MySQL 1062).
func isDup(err error) bool {
	var me *mysql.MySQLError
	return errors.As(err, &me) && me.Number == 1062
}
