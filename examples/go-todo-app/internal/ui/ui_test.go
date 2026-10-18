package ui

import (
	"context"
	"strings"
	"testing"

	"fyne.io/fyne/v2/test"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
	"example.com/go-todo-app/internal/repository/memory"
	"example.com/go-todo-app/internal/service"
)

// siapkan membangun App di atas repository in-memory dengan data contoh.
// Pakai fyne.io/fyne/v2/test sehingga seluruh UI bisa diuji TANPA membuka
// jendela sungguhan — fyne.Do pada driver tes langsung dieksekusi.
func siapkan(t *testing.T, judul ...string) *App {
	t.Helper()
	app := test.NewApp()
	repo := memory.New()
	svc := service.New(repo)

	for _, j := range judul {
		if _, err := svc.Add(context.Background(), model.TodoInput{Title: j}); err != nil {
			t.Fatalf("menyiapkan data %q: %v", j, err)
		}
	}
	return newApp(app, svc)
}

func TestBangunJendelaTanpaKesalahan(t *testing.T) {
	a := siapkan(t, "Satu", "Dua")
	a.win.SetContent(a.buildUI())

	harusAda := map[string]any{
		"daftar todo":   a.list,
		"kolom judul":   a.titleEntry,
		"tombol tambah": a.addBtn,
		"filter":        a.filterSel,
		"pencarian":     a.searchEntry,
		"hitungan":      a.statsLabel,
		"status":        a.statusLabel,
	}
	for nama, w := range harusAda {
		if w == nil {
			t.Errorf("%s belum terbentuk saat membangun UI", nama)
		}
	}
}

func TestMuatDataDariRepository(t *testing.T) {
	a := siapkan(t, "Satu", "Dua", "Tiga")
	a.win.SetContent(a.buildUI())

	// muat() membaca repository lalu menerapkan hasilnya lewat fyne.Do —
	// pada driver tes, fyne.Do berjalan langsung sehingga hasilnya deterministik.
	a.muat(repository.Query{Filter: repository.FilterAll})

	if len(a.data) != 3 {
		t.Fatalf("data tersimpan = %d, diharapkan 3", len(a.data))
	}
	if a.list.Length() != 3 {
		t.Errorf("Length() list = %d, diharapkan 3", a.list.Length())
	}
	if a.statusLabel.Text != "3 todo ditampilkan." {
		t.Errorf("status = %q", a.statusLabel.Text)
	}

	// setelah muat, widget pesan-kosong harus tersembunyi
	if a.emptyBox.Visible() {
		t.Error("pesan 'belum ada todo' seharusnya tersembunyi saat ada data")
	}
}

func TestUpdateRowMenampilkanTodo(t *testing.T) {
	a := siapkan(t, "Belajar Fyne")
	a.win.SetContent(a.buildUI())
	a.muat(repository.Query{})

	row := a.createRow() // kerangka baris, persis seperti yang dipakai widget.List
	a.updateRow(0, row)

	rw := a.rows[row]
	if rw == nil {
		t.Fatal("baris tidak terdaftar di a.rows")
	}
	if rw.title.Text != "Belajar Fyne" {
		t.Errorf("judul baris = %q", rw.title.Text)
	}
	if rw.check.Checked {
		t.Error("todo baru seharusnya belum dicentang")
	}
	if rw.meta.Text == "" {
		t.Error("baris kategori/prioritas kosong")
	}

	// Tandai selesai → judul diberi tanda ✔ dan dicentang.
	if _, err := a.svc.Toggle(context.Background(), a.data[0].ID); err != nil {
		t.Fatalf("Toggle() error = %v", err)
	}
	a.muat(repository.Query{})
	a.updateRow(0, row)

	if !rw.check.Checked {
		t.Error("todo yang sudah selesai harus tercentang")
	}
	if !strings.HasPrefix(rw.title.Text, "✔ ") {
		t.Errorf("todo selesai seharusnya berawal tanda ✔, dapat %q", rw.title.Text)
	}
}

func TestInputKosongDitolakSebelumDisimpan(t *testing.T) {
	a := siapkan(t)
	a.win.SetContent(a.buildUI())
	a.titleEntry.SetText("     ") // hanya spasi

	a.addTodo()

	st, err := a.svc.Stats(context.Background())
	if err != nil {
		t.Fatalf("Stats() error = %v", err)
	}
	if st.Total != 0 {
		t.Errorf("input kosong tidak boleh masuk database, ada %d baris", st.Total)
	}
	if len(a.win.Canvas().Overlays().List()) == 0 {
		t.Error("dialog 'input belum valid' tidak muncul")
	}
}
