package ui

import (
	"context"
	"fmt"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"

	"example.com/go-todo-app/internal/model"
	"example.com/go-todo-app/internal/repository"
	"example.com/go-todo-app/internal/service"
)

// App mengemas state dan widget jendela utama.
// Seluruh perubahan state hanya terjadi di thread UI; goroutine database
// bekerja di atas SALINAN state, lalu hasilnya dibawa kembali lewat fyne.Do.
type App struct {
	win   fyne.Window
	svc   *service.Service
	prefs fyne.Preferences

	filter repository.Filter // tombol filter yang sedang aktif
	search string            // kata pencarian pada toolbar
	data   []model.Todo      // data yang sedang ditampilkan oleh list

	list        *widget.List
	rows        map[fyne.CanvasObject]*rowWidgets
	emptyBox    fyne.CanvasObject
	statsLabel  *widget.Label
	statusLabel *widget.Label
	titleEntry  *widget.Entry
	categorySel *widget.Select
	prioritySel *widget.Select
	addBtn      *widget.Button
	searchEntry *widget.Entry
	filterSel   *widget.Select
}

// NewWindow membangun jendela utama, memulihkan filter terakhir,
// lalu memuat data pertama dari repository.
func NewWindow(app fyne.App, svc *service.Service) fyne.Window {
	a := newApp(app, svc)
	a.win.SetContent(a.buildUI())
	a.win.Resize(fyne.NewSize(820, 620))
	a.refresh()
	return a.win
}

// newApp menyiapkan state aplikasi (dipakai NewWindow dan unit test).
func newApp(app fyne.App, svc *service.Service) *App {
	a := &App{
		win:    app.NewWindow("Todo App — Go + Fyne"),
		svc:    svc,
		prefs:  app.Preferences(),
		filter: repository.FilterAll,
		rows:   map[fyne.CanvasObject]*rowWidgets{},
	}
	if f := repository.Filter(a.prefs.String("filter")); filterValid(f) {
		a.filter = f
	}
	return a
}

func filterValid(f repository.Filter) bool {
	return f == repository.FilterAll || f == repository.FilterActive || f == repository.FilterDone
}

/* ---------- Susunan jendela ---------- */

func (a *App) buildUI() fyne.CanvasObject {
	// Daftar todo dibuat lebih dulu — callback apa pun (mis. OnChanged select)
	// bisa memicu refresh(), dan refresh tidak boleh menemui daftar yang kosong.
	a.list = widget.NewList(a.listLength, a.createRow, a.updateRow)
	a.emptyBox = container.NewCenter(widget.NewLabel(
		"Belum ada todo di sini.\nTambahkan yang pertama lewat kolom di atas."))
	a.emptyBox.Hide()

	// Baris kepala: judul di kiri, hitungan di kanan.
	a.statsLabel = widget.NewLabel("…")
	head := container.NewBorder(nil, nil,
		widget.NewLabelWithStyle("✔ Todo App", fyne.TextAlignLeading, fyne.TextStyle{Bold: true}),
		a.statsLabel)

	// Baris 1: input judul + tombol Tambah (tombol menempel di kanan).
	a.titleEntry = widget.NewEntry()
	a.titleEntry.SetPlaceHolder("Apa yang harus dikerjakan?")
	a.titleEntry.OnSubmitted = func(string) { a.addTodo() }

	a.addBtn = widget.NewButtonWithIcon("Tambah", theme.ContentAddIcon(), a.addTodo)
	inputRow := container.NewBorder(nil, nil, nil, a.addBtn, a.titleEntry)

	// Baris 2: pilihan kategori & prioritas.
	a.categorySel = widget.NewSelect(model.Categories, nil)
	a.categorySel.SetSelected("Umum")
	a.prioritySel = widget.NewSelect(model.Priorities, nil)
	a.prioritySel.SetSelected(model.PriorityMedium)
	choiceRow := container.NewHBox(a.categorySel, a.prioritySel)

	// Baris 3: pencarian + tombol filter.
	a.searchEntry = widget.NewEntry()
	a.searchEntry.SetPlaceHolder("Cari judul / catatan / kategori…")
	a.searchEntry.OnChanged = func(s string) {
		a.search = s
		a.refresh()
	}

	a.filterSel = widget.NewSelect(repository.ValidFilters(), nil)
	a.filterSel.SetSelected(string(a.filter)) // nilai awal tanpa efek samping
	a.filterSel.OnChanged = func(s string) {
		a.filter = repository.Filter(s)
		a.prefs.SetString("filter", s) // ingat pilihan terakhir
		a.refresh()
	}
	// Border: label di kiri, pilihan filter di kanan, kolom cari mengisi tengah.
	searchRow := container.NewBorder(nil, nil,
		widget.NewLabel("Cari"), a.filterSel, a.searchEntry)

	// Kaki jendela: satu baris status.
	a.statusLabel = widget.NewLabel("Menyiapkan…")

	center := container.NewStack(a.list, a.emptyBox)
	body := container.NewBorder(
		container.NewVBox(head, inputRow, choiceRow, searchRow),
		container.NewPadded(a.statusLabel),
		nil, nil, center)
	return container.NewPadded(body)
}

/* ---------- Membaca ulang data dari repository ---------- */

// refresh menyalin filter & pencarian lalu membaca database di goroutine lain.
// Hasilnya baru menyentuh widget di dalam fyne.Do (thread UI).
func (a *App) refresh() {
	q := repository.Query{Filter: a.filter, Search: a.search} // salinan untuk goroutine
	go a.muat(q)
}

// muat membaca database — dijalankan dari goroutine, bukan thread UI.
func (a *App) muat(q repository.Query) {
	list, err := a.svc.List(context.Background(), q)
	fyne.Do(func() { a.terapkanList(list, err) })

	if err != nil {
		return
	}
	st, statsErr := a.svc.Stats(context.Background())
	fyne.Do(func() { a.updateStats(st, statsErr) })
}

// terapkanList menulis hasil baca ke widget — hanya dipanggil di thread UI.
func (a *App) terapkanList(list []model.Todo, err error) {
	if err != nil {
		a.showError(err)
		return
	}
	a.data = list
	a.list.Refresh()

	if len(list) == 0 {
		a.emptyBox.Show()
	} else {
		a.emptyBox.Hide()
	}
	a.setStatus(fmt.Sprintf("%d todo ditampilkan.", len(list)))
}

/* ---------- Aksi dari widget ---------- */

func (a *App) addTodo() {
	in := model.TodoInput{
		Title:    a.titleEntry.Text,
		Category: a.categorySel.Selected,
		Priority: a.prioritySel.Selected,
	}
	clean, err := in.Validate()
	if err != nil {
		dialog.ShowInformation("Input belum valid", err.Error(), a.win)
		return
	}
	in = clean

	a.addBtn.Disable()
	a.setStatus("Menyimpan…")

	go func() {
		_, err := a.svc.Add(context.Background(), in)
		fyne.Do(func() {
			a.addBtn.Enable()
			if err != nil {
				a.showError(err)
				return
			}
			a.titleEntry.SetText("")
			a.setStatus("Todo berhasil ditambahkan.")
			a.refresh()
		})
	}()
}

func (a *App) toggleTodo(id int64) {
	a.setStatus("Menyimpan status…")
	go func() {
		_, err := a.svc.Toggle(context.Background(), id)
		fyne.Do(func() {
			if err != nil {
				a.showError(err)
				a.refresh()
				return
			}
			a.setStatus("Status todo diperbarui.")
			a.refresh()
		})
	}()
}

/* ---------- Bantuan tampilan ---------- */

func (a *App) listLength() int { return len(a.data) }

func (a *App) updateStats(st repository.Stats, err error) {
	if err != nil {
		a.statsLabel.SetText("statistik tidak tersedia")
		return
	}
	a.statsLabel.SetText(fmt.Sprintf("%d aktif · %d selesai · %d total", st.Active, st.Done, st.Total))
}

func (a *App) setStatus(msg string) { a.statusLabel.SetText(msg) }

func (a *App) showError(err error) {
	a.setStatus("Terjadi kesalahan.")
	dialog.ShowError(err, a.win)
}
