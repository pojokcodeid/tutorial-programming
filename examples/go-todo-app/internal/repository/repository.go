// Package repository menyimpan kontrak akses data.
//
// Seluruh aplikasi (service & UI) hanya mengenal interface Repository di sini.
// Karena itu mengganti database (SQLite → MySQL → PostgreSQL, dsb.) cukup
// dengan mengganti implementasi — tanpa mengubah satu baris pun logika bisnis
// maupun kode GUI.
package repository

import (
	"context"
	"errors"
	"strings"

	"example.com/go-todo-app/internal/model"
)

// ErrNotFound dipakai ketika ID yang diminta tidak ada di database.
var ErrNotFound = errors.New("todo tidak ditemukan")

// Filter menentukan subset todo yang dibaca dari database.
type Filter string

const (
	FilterAll    Filter = "semua"   // semua data
	FilterActive Filter = "aktif"   // belum selesai
	FilterDone   Filter = "selesai" // sudah selesai
)

// ValidFilters dipakai widget Select di UI.
func ValidFilters() []string {
	return []string{string(FilterAll), string(FilterActive), string(FilterDone)}
}

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
}
