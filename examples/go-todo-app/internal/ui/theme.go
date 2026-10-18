// Package ui berisi seluruh tampilan desktop aplikasi (berbasis Fyne).
package ui

import (
	"image/color"

	"fyne.io/fyne/v2"
	ftheme "fyne.io/fyne/v2/theme"
)

// warnaAksen adalah warna identitas aplikasi (biru tua kehijauan).
var warnaAksen = color.NRGBA{R: 0x0E, G: 0x74, B: 0x90, A: 0xFF}

// accentTheme adalah tema bawaan Fyne yang hanya warna aksennya diganti.
// Struct ini "menempel" (embed) interface fyne.Theme sehingga tinggal
// menimpa satu method — font, ikon, dan ukuran tetap mengikuti default.
type accentTheme struct{ fyne.Theme }

// Color mengganti warna primer (tombol utama, fokus, aksen) di semua varian.
func (t *accentTheme) Color(name fyne.ThemeColorName, variant fyne.ThemeVariant) color.Color {
	if name == ftheme.ColorNamePrimary {
		return warnaAksen
	}
	return t.Theme.Color(name, variant)
}

// AccentTheme membuat tema kustom. Dipasang di main dengan:
//
//	a.Settings().SetTheme(ui.AccentTheme())
func AccentTheme() fyne.Theme {
	return &accentTheme{Theme: ftheme.DefaultTheme()}
}
