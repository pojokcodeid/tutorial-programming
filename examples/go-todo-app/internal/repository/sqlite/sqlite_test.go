package sqlite_test

import (
	"context"
	"errors"
	"path/filepath"
	"testing"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
	"example.com/go-todo-app/internal/repository/sqlite"
)

// bukaMemory membuat repository SQLite di RAM — skema tetap dibuat oleh Open.
func bukaMemory(t *testing.T) repository.Repository {
	t.Helper()
	repo, err := sqlite.Open(":memory:")
	if err != nil {
		t.Fatalf("buka sqlite :memory:: %v", err)
	}
	t.Cleanup(func() { _ = repo.Close() })
	return repo
}

func TestCRUDSiklusPenuh(t *testing.T) {
	ctx := context.Background()
	repo := bukaMemory(t)

	// --- CREATE ---
	a, err := repo.Add(ctx, model.Todo{
		Title: "Tugas A", Category: "Kerja", Priority: model.PriorityHigh,
	})
	if err != nil {
		t.Fatalf("Add(A) error = %v", err)
	}
	if a.ID == 0 || a.CreatedAt.IsZero() {
		t.Fatalf("Add(A) belum mengisi id/waktu: %+v", a)
	}
	b, _ := repo.Add(ctx, model.Todo{Title: "Tugas B", Category: "Pribadi", Priority: model.PriorityLow})
	c, _ := repo.Add(ctx, model.Todo{Title: "Tugas C", Category: "Kerja", Priority: model.PriorityMedium})

	// --- READ: urutan prioritas tinggi dulu ---
	list, err := repo.List(ctx, repository.Query{})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(list) != 3 {
		t.Fatalf("List() mengembalikan %d baris, diharapkan 3", len(list))
	}
	if list[0].ID != a.ID || list[2].ID != b.ID {
		t.Errorf("urutan = [%d %d %d], diharapkan [%d %d %d] (tinggi → sedang → rendah)",
			list[0].ID, list[1].ID, list[2].ID, a.ID, c.ID, b.ID)
	}

	// --- STATS ---
	st, err := repo.Stats(ctx)
	if err != nil {
		t.Fatalf("Stats() error = %v", err)
	}
	if st.Total != 3 || st.Active != 3 || st.Done != 0 {
		t.Errorf("Stats() = %+v, diharapkan total 3 / aktif 3", st)
	}

	// --- UPDATE STATUS (toggle) ---
	selesai, err := repo.ToggleDone(ctx, b.ID)
	if err != nil {
		t.Fatalf("ToggleDone() error = %v", err)
	}
	if !selesai.Done || selesai.ID != b.ID {
		t.Errorf("ToggleDone() = %+v", selesai)
	}
	aktif, _ := repo.List(ctx, repository.Query{Filter: repository.FilterActive})
	if len(aktif) != 2 {
		t.Errorf("filter aktif = %d baris, diharapkan 2", len(aktif))
	}
	selesaiList, _ := repo.List(ctx, repository.Query{Filter: repository.FilterDone})
	if len(selesaiList) != 1 || selesaiList[0].ID != b.ID {
		t.Errorf("filter selesai = %+v", selesaiList)
	}

	// --- PENCARIAN (LIKE) ---
	ketemu, err := repo.List(ctx, repository.Query{Search: "tugas c"})
	if err != nil {
		t.Fatalf("List(search) error = %v", err)
	}
	if len(ketemu) != 1 || idPertama(ketemu) != c.ID {
		t.Errorf("pencarian 'tugas c' = %+v", ketemu)
	}

	// --- UPDATE isi ---
	selesai.Title = "Tugas B revisi"
	if err := repo.Update(ctx, selesai); err != nil {
		t.Fatalf("Update() error = %v", err)
	}
	ulang, err := repo.Get(ctx, b.ID)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if ulang.Title != "Tugas B revisi" || !ulang.Done {
		t.Errorf("hasil update = %+v", ulang)
	}

	// --- DELETE ---
	if err := repo.Delete(ctx, c.ID); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
	if _, err := repo.Get(ctx, c.ID); !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("Get(id terhapus) = %v, diharapkan ErrNotFound", err)
	}
	if err := repo.Delete(ctx, c.ID); !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("Delete(id terhapus) = %v, diharapkan ErrNotFound", err)
	}
	if _, err := repo.ToggleDone(ctx, 424242); !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("ToggleDone(id hilang) = %v, diharapkan ErrNotFound", err)
	}
}

// TestPersistensiFile membuktikan data benar-benar tertulis di file:
// tutup aplikasi (tutup koneksi), buka lagi — datanya masih ada.
func TestPersistensiFile(t *testing.T) {
	ctx := context.Background()
	dsn := filepath.Join(t.TempDir(), "todo.db")

	pertama, err := sqlite.Open(dsn)
	if err != nil {
		t.Fatalf("buka sqlite file: %v", err)
	}
	if _, err := pertama.Add(ctx, model.Todo{
		Title: "Harus bertahan", Category: "Pribadi", Priority: model.PriorityMedium,
	}); err != nil {
		t.Fatalf("Add() error = %v", err)
	}
	if err := pertama.Close(); err != nil {
		t.Fatalf("Close() error = %v", err)
	}

	kedua, err := sqlite.Open(dsn)
	if err != nil {
		t.Fatalf("buka ulang sqlite file: %v", err)
	}
	defer kedua.Close()

	list, err := kedua.List(ctx, repository.Query{})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(list) != 1 || list[0].Title != "Harus bertahan" {
		t.Errorf("data setelah buka ulang = %+v, diharapkan 1 todo 'Harus bertahan'", list)
	}
}

func idPertama(list []model.Todo) int64 {
	if len(list) == 0 {
		return 0
	}
	return list[0].ID
}
