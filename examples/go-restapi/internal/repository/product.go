/*
============================================================

	Package repository (lanjutan) — akses data Product.
	============================================================
*/
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"example.com/go-restapi/internal/model"
)

// ProductRepository adalah kontrak akses data produk.
type ProductRepository interface {
	Create(ctx context.Context, p *model.Product) error
	FindByID(ctx context.Context, id int64) (*model.Product, error)
	List(ctx context.Context, limit, offset int) ([]model.Product, error)
	Count(ctx context.Context) (int64, error)
	Update(ctx context.Context, p *model.Product) error
	Delete(ctx context.Context, id int64) error
}

// mysqlProductRepository adalah implementasi ProductRepository di MariaDB.
type mysqlProductRepository struct {
	db *sql.DB
}

// NewProductRepository membuat ProductRepository yang siap dipakai.
func NewProductRepository(db *sql.DB) ProductRepository {
	return &mysqlProductRepository{db: db}
}

func (r *mysqlProductRepository) Create(ctx context.Context, p *model.Product) error {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO products (name, description, price, stock, created_by) VALUES (?, ?, ?, ?, ?)`,
		p.Name, p.Description, p.Price, p.Stock, p.CreatedBy,
	)
	if err != nil {
		return fmt.Errorf("insert product: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return fmt.Errorf("membaca id hasil insert: %w", err)
	}
	p.ID = id
	return nil
}

func (r *mysqlProductRepository) FindByID(ctx context.Context, id int64) (*model.Product, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, name, description, price, stock, created_by, created_at, updated_at
		 FROM products WHERE id = ?`, id,
	)
	return scanProduct(row)
}

// List mengambil produk dengan pagination (LIMIT & OFFSET).
func (r *mysqlProductRepository) List(ctx context.Context, limit, offset int) ([]model.Product, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, name, description, price, stock, created_by, created_at, updated_at
		 FROM products ORDER BY id DESC LIMIT ? OFFSET ?`, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("query products: %w", err)
	}
	defer rows.Close() // WAJIB: tutup rows untuk melepas koneksi ke pool

	var products []model.Product
	for rows.Next() {
		var p model.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock,
			&p.CreatedBy, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan product: %w", err)
		}
		products = append(products, p)
	}
	// rows.Err() menangkap error yang terjadi saat iterasi
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterasi products: %w", err)
	}
	return products, nil
}

// Count menghitung total produk untuk informasi pagination.
func (r *mysqlProductRepository) Count(ctx context.Context) (int64, error) {
	var total int64
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM products`).Scan(&total); err != nil {
		return 0, fmt.Errorf("count products: %w", err)
	}
	return total, nil
}

func (r *mysqlProductRepository) Update(ctx context.Context, p *model.Product) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?`,
		p.Name, p.Description, p.Price, p.Stock, p.ID,
	)
	if err != nil {
		return fmt.Errorf("update product: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("membaca rows affected: %w", err)
	}
	if affected == 0 {
		return ErrNotFound // ID tidak ada di tabel
	}
	return nil
}

func (r *mysqlProductRepository) Delete(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM products WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete product: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("membaca rows affected: %w", err)
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
}

func scanProduct(row *sql.Row) (*model.Product, error) {
	var p model.Product
	err := row.Scan(&p.ID, &p.Name, &p.Description, &p.Price, &p.Stock,
		&p.CreatedBy, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("scan product: %w", err)
	}
	return &p, nil
}
