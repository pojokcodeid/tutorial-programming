// Package model berisi entitas inti aplikasi beserta aturan validasinya.
// Package ini tidak tahu soal GUI maupun database — murni data + aturan.
package model

import (
	"errors"
	"strings"
	"time"
)

// Nilai prioritas yang didukung aplikasi.
const (
	PriorityLow    = "rendah"
	PriorityMedium = "sedang"
	PriorityHigh   = "tinggi"
)

// Categories adalah pilihan kategori yang tampil pada widget Select.
var Categories = []string{"Umum", "Kerja", "Pribadi", "Belanja"}

// Priorities adalah pilihan prioritas (urutan = urutan tampil di UI).
var Priorities = []string{PriorityHigh, PriorityMedium, PriorityLow}

// Batas ukuran input.
const (
	MaxTitle    = 120
	MaxNote     = 500
	MaxCategory = 40
)

// Aturan validasi — dipakai service, form, dan unit test.
var (
	ErrTitleRequired   = errors.New("judul wajib diisi")
	ErrTitleTooLong    = errors.New("judul maksimal 120 karakter")
	ErrNoteTooLong     = errors.New("catatan maksimal 500 karakter")
	ErrCategoryLong    = errors.New("kategori maksimal 40 karakter")
	ErrPriorityUnknown = errors.New("prioritas harus rendah, sedang, atau tinggi")
)

// Todo adalah satu baris pekerjaan yang disimpan aplikasi.
type Todo struct {
	ID        int64
	Title     string
	Note      string
	Category  string
	Priority  string
	Done      bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TodoInput adalah data yang dikirim lapisan UI ke service.
// Belum memuat ID dan waktu — keduanya ditentukan oleh database.
type TodoInput struct {
	Title    string
	Note     string
	Category string
	Priority string
}

// Validate membersihkan input (trim + default) lalu memvalidasinya.
// Mengembalikan salinan yang sudah bersih agar hasilnya bisa langsung dipakai.
func (in TodoInput) Validate() (TodoInput, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.Note = strings.TrimSpace(in.Note)
	in.Category = strings.TrimSpace(in.Category)
	in.Priority = strings.TrimSpace(in.Priority)

	switch {
	case in.Title == "":
		return in, ErrTitleRequired
	case runeLen(in.Title) > MaxTitle:
		return in, ErrTitleTooLong
	case runeLen(in.Note) > MaxNote:
		return in, ErrNoteTooLong
	case runeLen(in.Category) > MaxCategory:
		return in, ErrCategoryLong
	}

	if in.Category == "" {
		in.Category = "Umum"
	}
	if in.Priority == "" {
		in.Priority = PriorityMedium
	}
	switch in.Priority {
	case PriorityLow, PriorityMedium, PriorityHigh:
	default:
		return in, ErrPriorityUnknown
	}
	return in, nil
}

// PriorityRank mengembalikan urutan prioritas untuk pengurutan (0 = teratas).
func PriorityRank(p string) int {
	switch p {
	case PriorityHigh:
		return 0
	case PriorityMedium:
		return 1
	default:
		return 2
	}
}

// IsEmpty membedakan todo yang belum selesai / sudah selesai (untuk filter).
func (t Todo) MatchesSearch(q string) bool {
	q = strings.ToLower(strings.TrimSpace(q))
	if q == "" {
		return true
	}
	hay := strings.ToLower(t.Title + " " + t.Note + " " + t.Category)
	return strings.Contains(hay, q)
}

func runeLen(s string) int { return len([]rune(s)) }
