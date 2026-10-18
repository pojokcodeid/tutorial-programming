// Package memory menyimpan todo di RAM — tanpa file dan tanpa server.
//
// Dua kegunaan:
//  1. Unit test: cepat, deterministik, tidak menyentuh file nyata.
//  2. Mode demo: TODO_DB_DRIVER=memory
//
// Karena ia memenuhi interface repository.Repository yang sama,
// UI dan service tidak menyadari sedang memakai "database" palsu.
package memory

import (
	"context"
	"sort"
	"sync"
	"time"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
)

var _ repository.Repository = (*Store)(nil)

type Store struct {
	mu    sync.RWMutex
	next  int64
	items map[int64]model.Todo
}

// New membuat store kosong (ID mulai dari 1).
func New() *Store {
	return &Store{next: 1, items: map[int64]model.Todo{}}
}

func (s *Store) List(ctx context.Context, q repository.Query) ([]model.Todo, error) {
	q = repository.NormalizeQuery(q)

	s.mu.RLock()
	defer s.mu.RUnlock()

	hasil := make([]model.Todo, 0, len(s.items))
	for _, t := range s.items {
		switch q.Filter {
		case repository.FilterActive:
			if t.Done {
				continue
			}
		case repository.FilterDone:
			if !t.Done {
				continue
			}
		}
		if !t.MatchesSearch(q.Search) {
			continue
		}
		hasil = append(hasil, t)
	}

	// Meniru urutan SQL: belum selesai dulu → prioritas tinggi → id terbaru.
	sort.Slice(hasil, func(i, j int) bool {
		if hasil[i].Done != hasil[j].Done {
			return !hasil[i].Done
		}
		ri, rj := model.PriorityRank(hasil[i].Priority), model.PriorityRank(hasil[j].Priority)
		if ri != rj {
			return ri < rj
		}
		return hasil[i].ID > hasil[j].ID
	})
	return hasil, nil
}

func (s *Store) Get(ctx context.Context, id int64) (model.Todo, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	t, ok := s.items[id]
	if !ok {
		return model.Todo{}, repository.ErrNotFound
	}
	return t, nil
}

func (s *Store) Add(ctx context.Context, t model.Todo) (model.Todo, error) {
	now := time.Now().UTC()

	s.mu.Lock()
	defer s.mu.Unlock()

	if t.CreatedAt.IsZero() {
		t.CreatedAt = now
	}
	t.UpdatedAt = now
	t.ID = s.next
	s.next++
	s.items[t.ID] = t
	return t, nil
}

func (s *Store) Update(ctx context.Context, t model.Todo) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.items[t.ID]; !ok {
		return repository.ErrNotFound
	}
	t.UpdatedAt = time.Now().UTC()
	s.items[t.ID] = t
	return nil
}

func (s *Store) ToggleDone(ctx context.Context, id int64) (model.Todo, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	t, ok := s.items[id]
	if !ok {
		return model.Todo{}, repository.ErrNotFound
	}
	t.Done = !t.Done
	t.UpdatedAt = time.Now().UTC()
	s.items[id] = t
	return t, nil
}

func (s *Store) Delete(ctx context.Context, id int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.items[id]; !ok {
		return repository.ErrNotFound
	}
	delete(s.items, id)
	return nil
}

func (s *Store) Stats(ctx context.Context) (repository.Stats, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var st repository.Stats
	for _, t := range s.items {
		st.Total++
		if t.Done {
			st.Done++
		} else {
			st.Active++
		}
	}
	return st, nil
}

// Close tidak melakukan apa-apa — tidak ada resource yang harus ditutup.
func (s *Store) Close() error { return nil }
