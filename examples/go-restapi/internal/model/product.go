/*
============================================================

	Package model (lanjutan) — entitas Product + validasi input.
	============================================================
*/
package model

import (
	"errors"
	"strings"
	"time"
)

// Product merepresentasikan baris pada tabel `products`.
type Product struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       int64     `json:"price"` // Rupiah, bilangan bulat
	Stock       int       `json:"stock"`
	CreatedBy   int64     `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ProductInput adalah payload JSON yang diterima dari klien
// untuk membuat / meng-update produk.
type ProductInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int64  `json:"price"`
	Stock       int    `json:"stock"`
}

// Validate memvalidasi input dan mengembalikan satu error
// yang sudah memuat daftar semua masalah (bisa ditampilkan ke klien).
func (in ProductInput) Validate() error {
	var errs []string

	if name := strings.TrimSpace(in.Name); len(name) < 3 || len(name) > 100 {
		errs = append(errs, "nama harus 3–100 karakter")
	}
	if in.Price < 0 {
		errs = append(errs, "harga tidak boleh negatif")
	}
	if in.Stock < 0 {
		errs = append(errs, "stok tidak boleh negatif")
	}

	if len(errs) > 0 {
		return errors.New(strings.Join(errs, "; "))
	}
	return nil
}
