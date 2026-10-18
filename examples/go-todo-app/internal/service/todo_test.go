package service_test

import (
	"context"
	"errors"
	"strings"
	"testing"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
	"example.com/go-todo-app/internal/repository/memory"
	"example.com/go-todo-app/internal/service"
)

// newService membuat service di atas repository in-memory (tanpa file/DB).
func newService() *service.Service { return service.New(memory.New()) }

// TestAddInputInvalid memastikan setiap aturan validasi tercapai.
// Pola table-driven: satu daftar kasus, satu loop, sub-test per kasus.
func TestAddInputInvalid(t *testing.T) {
	kasus := []struct {
		name string
		in   model.TodoInput
		want error
	}{
		{
			name: "judul kosong",
			in:   model.TodoInput{Title: "   "},
			want: model.ErrTitleRequired,
		},
		{
			name: "judul terlalu panjang",
			in:   model.TodoInput{Title: strings.Repeat("a", model.MaxTitle+1)},
			want: model.ErrTitleTooLong,
		},
		{
			name: "catatan terlalu panjang",
			in:   model.TodoInput{Title: "Rapi", Note: strings.Repeat("n", model.MaxNote+1)},
			want: model.ErrNoteTooLong,
		},
		{
			name: "kategori terlalu panjang",
			in:   model.TodoInput{Title: "Rapi", Category: strings.Repeat("k", model.MaxCategory+1)},
			want: model.ErrCategoryLong,
		},
		{
			name: "prioritas tidak dikenal",
			in:   model.TodoInput{Title: "Rapi", Priority: "mendesak"},
			want: model.ErrPriorityUnknown,
		},
	}

	for _, k := range kasus {
		t.Run(k.name, func(t *testing.T) {
			_, err := newService().Add(context.Background(), k.in)
			if !errors.Is(err, k.want) {
				t.Fatalf("Add() error = %v, diharapkan %v", err, k.want)
			}
		})
	}
}

func TestAddValidMenerapkanDefault(t *testing.T) {
	got, err := newService().Add(context.Background(), model.TodoInput{Title: "  Beli beras  "})
	if err != nil {
		t.Fatalf("Add() error = %v", err)
	}
	if got.ID == 0 {
		t.Error("ID belum terisi oleh repository")
	}
	if got.Title != "Beli beras" {
		t.Errorf("judul belum di-trim: %q", got.Title)
	}
	if got.Category != "Umum" {
		t.Errorf("kategori default = %q, diharapkan %q", got.Category, "Umum")
	}
	if got.Priority != model.PriorityMedium {
		t.Errorf("prioritas default = %q, diharapkan %q", got.Priority, model.PriorityMedium)
	}
	if got.Done {
		t.Error("todo baru seharusnya belum selesai")
	}
	if got.CreatedAt.IsZero() || got.UpdatedAt.IsZero() {
		t.Error("waktu pembuatan/pembaruan belum diisi repository")
	}
}

func TestToggleDanStats(t *testing.T) {
	ctx := context.Background()
	svc := newService()

	created, err := svc.Add(ctx, model.TodoInput{Title: "Tugas A"})
	if err != nil {
		t.Fatalf("Add() error = %v", err)
	}

	st, _ := svc.Stats(ctx)
	if st.Total != 1 || st.Active != 1 || st.Done != 0 {
		t.Fatalf("stats sebelum toggle = %+v", st)
	}

	toggled, err := svc.Toggle(ctx, created.ID)
	if err != nil {
		t.Fatalf("Toggle() error = %v", err)
	}
	if !toggled.Done {
		t.Error("status belum berubah menjadi selesai")
	}

	st, _ = svc.Stats(ctx)
	if st.Active != 0 || st.Done != 1 {
		t.Errorf("stats setelah toggle = %+v, diharapkan 0 aktif / 1 selesai", st)
	}
}

func TestEditIDInvalidDanTidakAda(t *testing.T) {
	ctx := context.Background()
	svc := newService()

	if _, err := svc.Edit(ctx, 0, model.TodoInput{Title: "x"}); !errors.Is(err, service.ErrInvalidID) {
		t.Errorf("Edit(id=0) = %v, diharapkan ErrInvalidID", err)
	}
	if _, err := svc.Edit(ctx, 999, model.TodoInput{Title: "x"}); !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("Edit(id hilang) = %v, diharapkan ErrNotFound", err)
	}
	if err := svc.Delete(ctx, -5); !errors.Is(err, service.ErrInvalidID) {
		t.Errorf("Delete(id<0) = %v, diharapkan ErrInvalidID", err)
	}
}

func TestEditMempertahankanStatus(t *testing.T) {
	ctx := context.Background()
	svc := newService()

	created, _ := svc.Add(ctx, model.TodoInput{Title: "Selesai dulu", Priority: model.PriorityHigh})
	if _, err := svc.Toggle(ctx, created.ID); err != nil {
		t.Fatalf("Toggle() error = %v", err)
	}

	edited, err := svc.Edit(ctx, created.ID, model.TodoInput{Title: "Judul baru", Priority: model.PriorityLow})
	if err != nil {
		t.Fatalf("Edit() error = %v", err)
	}
	if !edited.Done {
		t.Error("Edit tidak boleh mereset status selesai")
	}
	if edited.Title != "Judul baru" || edited.Priority != model.PriorityLow {
		t.Errorf("hasil edit = %+v", edited)
	}
	if !edited.CreatedAt.Equal(created.CreatedAt) {
		t.Error("waktu pembuatan tidak boleh berubah saat edit")
	}
}

func TestListFilterDanPencarian(t *testing.T) {
	ctx := context.Background()
	svc := newService()

	a, _ := svc.Add(ctx, model.TodoInput{Title: "Bayar listrik", Category: "Rumah", Priority: model.PriorityHigh})
	b, _ := svc.Add(ctx, model.TodoInput{Title: "Belajar Fyne", Category: "Kerja"})
	_, _ = svc.Add(ctx, model.TodoInput{Title: "Beli sayur", Category: "Belanja"})
	if _, err := svc.Toggle(ctx, b.ID); err != nil {
		t.Fatalf("Toggle() error = %v", err)
	}

	aktif, err := svc.List(ctx, repository.Query{Filter: repository.FilterActive})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(aktif) != 2 {
		t.Fatalf("filter aktif mengembalikan %d baris, diharapkan 2", len(aktif))
	}
	// Urutan: belum selesai dulu, lalu prioritas tinggi di atas.
	if aktif[0].ID != a.ID {
		t.Errorf("baris pertama = %q (id %d), diharapkan todo prioritas tinggi", aktif[0].Title, aktif[0].ID)
	}

	selesai, _ := svc.List(ctx, repository.Query{Filter: repository.FilterDone})
	if len(selesai) != 1 || selesai[0].ID != b.ID {
		t.Errorf("filter selesai = %+v", selesai)
	}

	cari, _ := svc.List(ctx, repository.Query{Search: "fyne"})
	if len(cari) != 1 || cari[0].ID != b.ID {
		t.Errorf("pencarian 'fyne' = %+v", cari)
	}
}
