package ui

import (
	"fmt"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
)

// rowWidgets memuat widget pembentuk satu baris daftar.
// Disimpan dalam map berbasis identitas objek supaya updateRow cukup
// melakukan type-assert ke struct, bukan menebak urutan anak container.
type rowWidgets struct {
	check *widget.Check
	title *widget.Label
	meta  *widget.Label
	edit  *widget.Button
	del   *widget.Button
}

// createRow dipanggil Fyne untuk membuat SATU kerangka baris.
// Isinya masih kosong — pewarnaan & data diisi oleh updateRow.
func (a *App) createRow() fyne.CanvasObject {
	row := &rowWidgets{
		check: widget.NewCheck("", nil),
		title: widget.NewLabel("…"),
		meta:  widget.NewLabel(""),
		edit:  widget.NewButtonWithIcon("", theme.MailComposeIcon(), nil), // MailCompose = ikon pensil (Fyne tak punya ikon Edit)
		del:   widget.NewButtonWithIcon("", theme.DeleteIcon(), nil),
	}
	row.meta.Importance = widget.LowImportance

	inner := container.NewVBox(row.title, row.meta)
	// Border: checkbox di kiri, dua tombol aksi di kanan, teks mengisi tengah.
	obj := container.NewBorder(nil, nil,
		row.check,
		container.NewHBox(row.edit, row.del),
		inner)
	a.rows[obj] = row
	return obj
}

// updateRow mengisi baris ke-i dengan data terbaru.
// Objek yang dipanggil selalu yang sama (Fyne mendaur ulang baris),
// jadi cukup timpa isinya.
func (a *App) updateRow(id int, obj fyne.CanvasObject) {
	if id < 0 || id >= len(a.data) {
		return
	}
	row, ok := a.rows[obj]
	if !ok {
		return
	}
	t := a.data[id] // salinan lokal: aman dipakai oleh closure tombol

	// Cabut handler lama dulu: SetChecked akan memanggil OnChanged,
	// dan kita tidak ingin klik baris sebelumnya ikut terpicu.
	row.check.OnChanged = nil
	row.check.SetChecked(t.Done)
	row.check.OnChanged = func(bool) { a.toggleTodo(t.ID) }

	if t.Done {
		row.title.SetText("✔ " + t.Title)
		row.title.Importance = widget.LowImportance
	} else {
		row.title.SetText(t.Title)
		row.title.Importance = widget.MediumImportance
	}
	row.title.Refresh()

	row.meta.SetText(fmt.Sprintf("%s · prioritas %s", t.Category, t.Priority))

	row.edit.OnTapped = func() { a.showEditDialog(t) }
	row.del.OnTapped = func() { a.confirmDelete(t) }
}
