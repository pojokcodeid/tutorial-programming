/*
============================================================

	Package repository — akses data ke MariaDB.
	Interface dipisah dari implementasi supaya lapisan service
	bisa di-unit-test dengan mock (tanpa database).
	============================================================
*/
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/go-sql-driver/mysql"

	"example.com/go-restapi/internal/model"
)

// Error sentinel yang dipahami lintas lapisan.
var (
	ErrNotFound  = errors.New("data tidak ditemukan")
	ErrDuplicate = errors.New("data duplikat (username/email sudah dipakai)")
)

// UserRepository adalah kontrak akses data user.
type UserRepository interface {
	Create(ctx context.Context, u *model.User) error
	FindByUsername(ctx context.Context, username string) (*model.User, error)
	FindByID(ctx context.Context, id int64) (*model.User, error)
}

// mysqlUserRepository adalah implementasi UserRepository di MariaDB.
type mysqlUserRepository struct {
	db *sql.DB
}

// NewUserRepository membuat UserRepository yang siap dipakai.
func NewUserRepository(db *sql.DB) UserRepository {
	return &mysqlUserRepository{db: db}
}

// Create menyisipkan user baru dan mengisi kembali ID hasil insert.
func (r *mysqlUserRepository) Create(ctx context.Context, u *model.User) error {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
		u.Username, u.Email, u.PasswordHash, u.Role,
	)
	if err != nil {
		// Error 1062 = MySQL duplicate entry (unique constraint)
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return ErrDuplicate
		}
		return fmt.Errorf("insert user: %w", err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return fmt.Errorf("membaca id hasil insert: %w", err)
	}
	u.ID = id
	return nil
}

// FindByUsername mencari user berdasarkan username.
func (r *mysqlUserRepository) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = ?`,
		username,
	)
	return scanUser(row)
}

// FindByID mencari user berdasarkan ID.
func (r *mysqlUserRepository) FindByID(ctx context.Context, id int64) (*model.User, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = ?`,
		id,
	)
	return scanUser(row)
}

// scanUser mengisi struct User dari satu baris hasil query.
func scanUser(row *sql.Row) (*model.User, error) {
	var u model.User
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan user: %w", err)
	}
	return &u, nil
}
