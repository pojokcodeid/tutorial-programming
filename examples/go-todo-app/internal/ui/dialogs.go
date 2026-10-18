package ui

import (
	"context"
	"fmt"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"

	"example.com/go-todo-app/internal/model"
)

// showEditDialog membuka dialog berisi form 4 field untuk mengubah satu todo.
func (a *App) showEditDialog(t model.Todo) {
	title := widget.NewEntry()
	title.SetText(t.Title)

	note := widget.NewMultiLineEntry()
	note.SetText(t.Note)
	note.SetPlaceHolder("Catatan (opsional)")

	category := widget.NewSelect(model.Categories, nil)
	category.SetSelected(t.Category)

	priority := widget.NewSelect(model.Priorities, nil)
	priority.SetSelected(t.Priority)

	items := []*widget.FormItem{
		widget.NewFormItem("Judul", title),
		widget.NewFormItem("Catatan", note),
		widget.NewFormItem("Kategori", category),
		widget.NewFormItem("Prioritas", priority),
	}

	d := dialog.NewForm("Ubah Todo", "Simpan", "Batal", items, func(ok bool) {
		if !ok {
			return // pengguna membatalkan — tidak ada yang dikirim ke database
		}
		a.saveEdit(t.ID, model.TodoInput{
			Title:    title.Text,
			Note:     note.Text,
			Category: category.Selected,
			Priority: priority.Selected,
		})
	}, a.win)
	d.Resize(fyne.NewSize(440, 340))
	d.Show()
}

// saveEdit memvalidasi lalu menyimpan perubahan di latar belakang.
func (a *App) saveEdit(id int64, in model.TodoInput) {
	if _, err := in.Validate(); err != nil {
		dialog.ShowInformation("Input belum valid", err.Error(), a.win)
		return
	}

	a.setStatus("Menyimpan perubahan…")
	go func() {
		_, err := a.svc.Edit(context.Background(), id, in)
		fyne.Do(func() {
			if err != nil {
				a.showError(err)
				a.refresh()
				return
			}
			a.setStatus("Perubahan tersimpan.")
			a.refresh()
		})
	}()
}

// confirmDelete meminta konfirmasi sebelum menghapus todo.
func (a *App) confirmDelete(t model.Todo) {
	pesan := fmt.Sprintf("Hapus “%s”?\nTindakan ini tidak bisa dibatalkan.", t.Title)

	dialog.NewConfirm("Hapus Todo", pesan, func(ok bool) {
		if !ok {
			return
		}
		a.setStatus("Menghapus…")
		go func() {
			err := a.svc.Delete(context.Background(), t.ID)
			fyne.Do(func() {
				if err != nil {
					a.showError(err)
					a.refresh()
					return
				}
				a.setStatus("Todo dihapus.")
				a.refresh()
			})
		}()
	}, a.win).Show()
}
