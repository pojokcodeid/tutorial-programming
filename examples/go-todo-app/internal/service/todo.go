// Package service memuat logika bisnis: memvalidasi input, menerapkan aturan,
// dan mengorkestrasi repository. Package ini TIDAK tahu soal widget Fyne
// maupun driver database mana yang dipakai.
package service

import (
	"context"
	"errors"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
)

// ErrInvalidID dipakai ketika ID tidak masuk akal (mis. 0 atau negatif).
var ErrInvalidID = errors.New("id todo tidak valid")

// Service adalah satu-satunya pintu yang dipanggil lapisan UI.
type Service struct {
	repo repository.Repository
}

// New membuat service di atas repository mana pun
// (sqlite, mysql, memory — semua memenuhi interface yang sama).
func New(repo repository.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, q repository.Query) ([]model.Todo, error) {
	return s.repo.List(ctx, repository.NormalizeQuery(q))
}

func (s *Service) Get(ctx context.Context, id int64) (model.Todo, error) {
	if id <= 0 {
		return model.Todo{}, ErrInvalidID
	}
	return s.repo.Get(ctx, id)
}

// Add memvalidasi input lalu menyimpannya lewat repository.
// ID dan waktu dibuat oleh database, bukan oleh UI.
func (s *Service) Add(ctx context.Context, in model.TodoInput) (model.Todo, error) {
	clean, err := in.Validate()
	if err != nil {
		return model.Todo{}, err
	}
	return s.repo.Add(ctx, model.Todo{
		Title:    clean.Title,
		Note:     clean.Note,
		Category: clean.Category,
		Priority: clean.Priority,
	})
}

// Edit memperbarui isi todo. Status "selesai" dan waktu pembuatan TIDAK
// diubah — keduanya diambil dari data yang sudah ada.
func (s *Service) Edit(ctx context.Context, id int64, in model.TodoInput) (model.Todo, error) {
	if id <= 0 {
		return model.Todo{}, ErrInvalidID
	}
	clean, err := in.Validate()
	if err != nil {
		return model.Todo{}, err
	}
	current, err := s.repo.Get(ctx, id)
	if err != nil {
		return model.Todo{}, err
	}
	current.Title = clean.Title
	current.Note = clean.Note
	current.Category = clean.Category
	current.Priority = clean.Priority

	if err := s.repo.Update(ctx, current); err != nil {
		return model.Todo{}, err
	}
	return current, nil
}

// Toggle membalik status selesai/belum selesai.
func (s *Service) Toggle(ctx context.Context, id int64) (model.Todo, error) {
	if id <= 0 {
		return model.Todo{}, ErrInvalidID
	}
	return s.repo.ToggleDone(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidID
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) Stats(ctx context.Context) (repository.Stats, error) {
	return s.repo.Stats(ctx)
}
