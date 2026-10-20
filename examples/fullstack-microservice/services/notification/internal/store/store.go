/*
Package store — akses data notifikasi ke MariaDB (notification_db).

Kolom event_id UNIQUE adalah jaring pengaman idempotensi: ketika RabbitMQ
mengirim ulang event yang sama (wajar setelah reconnect), penyimpanan kedua
ditolak database dan dikenali sebagai ErrDuplicate — bukan data ganda.
*/
package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/go-sql-driver/mysql"
)

type Notification struct {
	ID        int64     `json:"id"`
	OrderID   int64     `json:"order_id"`
	Customer  string    `json:"customer"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// ErrDuplicate berarti event yang sama sudah pernah diproses.
var ErrDuplicate = errors.New("event sudah pernah diproses")

type Store struct{ db *sql.DB }

func New(db *sql.DB) *Store { return &Store{db: db} }

// Save menyimpan satu notifikasi; idempoten terhadap event_id.
func (s *Store) Save(ctx context.Context, eventID string, orderID int64, customer, message string) error {
	_, err := s.db.ExecContext(ctx,
		"INSERT INTO notifications (event_id, order_id, customer, message) VALUES (?, ?, ?, ?)",
		eventID, orderID, customer, message)
	if err != nil {
		var me *mysql.MySQLError
		if errors.As(err, &me) && me.Number == 1062 {
			return ErrDuplicate
		}
		return err
	}
	return nil
}

// List mengembalikan notifikasi terbaru dahulu (untuk panel frontend).
func (s *Store) List(ctx context.Context) ([]Notification, error) {
	rows, err := s.db.QueryContext(ctx,
		"SELECT id, order_id, customer, message, is_read, created_at FROM notifications ORDER BY id DESC LIMIT 100")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.OrderID, &n.Customer, &n.Message, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

// MarkRead menandai satu notifikasi sudah dibaca.
func (s *Store) MarkRead(ctx context.Context, id int64) error {
	res, err := s.db.ExecContext(ctx, "UPDATE notifications SET is_read = 1 WHERE id = ?", id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// UnreadCount dipakai badge "lonceng" di header frontend.
func (s *Store) UnreadCount(ctx context.Context) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM notifications WHERE is_read = 0").Scan(&n)
	return n, err
}
