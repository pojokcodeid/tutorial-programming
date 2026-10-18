// Program todo adalah aplikasi desktop Todo App: Go + Fyne + database bebas.
//
// Pilih database lewat environment variable (bila kosong memakai nilai default):
//
//	TODO_DB_DRIVER   sqlite (default) | mysql | memory
//	TODO_DB_DSN      file sqlite / DSN mysql — lihat internal/storage
package main

import (
	"log"

	"fyne.io/fyne/v2/app"

	"example.com/go-todo-app/internal/service"
	"example.com/go-todo-app/internal/storage"
	"example.com/go-todo-app/internal/ui"
)

func main() {
	// 1) Database dulu — bila gagal, berhenti sebelum jendela muncul.
	repo, err := storage.FromEnv()
	if err != nil {
		log.Fatalf("gagal menyiapkan database: %v", err)
	}
	defer repo.Close()

	// 2) Aplikasi Fyne dengan ID stabil (dipakai penyimpanan preferensi).
	a := app.NewWithID("id.pojokcodeid.todo")
	a.Settings().SetTheme(ui.AccentTheme())

	// 3) Rakit: repository → service → UI, lalu jalankan jendela.
	w := ui.NewWindow(a, service.New(repo))
	w.ShowAndRun() // memblokir sampai pengguna menutup jendela
}
