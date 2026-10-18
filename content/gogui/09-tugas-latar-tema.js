/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 9: Ketahanan Aplikasi
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-latar',
  title: 'Tugas Latar, Thread UI, Error & Tema',
  chapter: 'Ketahanan Aplikasi',
  duration: '13 menit',
  intro: [
    'Aplikasi yang bagus bukan yang tidak pernah gagal, melainkan yang <b>tidak pernah membeku</b> dan <b>tahu cara melaporkan kegagalannya</b>. Di Fyne, jendela digambar oleh satu thread khusus — bila thread itu disuruh membaca database, layar berhenti merespons sampai query selesai.',
    'Pelajaran ini menyiapkan tiga kebiasaan wajib: menaruh pekerjaan berat di <b>goroutine</b> dan mengembalikan kendali lewat <code>fyne.Do</code>, meneruskan <b>error berlapis</b> sampai ke dialog pengguna, serta mempercantik aplikasi dengan <b>tema kustom</b> dan menyimpan preferensi.'
  ],
  objectives: [
    'Menjelaskan kenapa database tidak boleh dijalankan di thread UI',
    'Membedakan fyne.Do dan fyne.DoAndWait serta kapan masing-masing dipakai',
    'Menerapkan pola refresh → muat → terapkanList untuk membaca data dengan aman',
    'Menghindari data race dengan menyalin state sebelum goroutine dimulai',
    'Memasang tema kustom dan menyimpan preferensi lewat fyne.Preferences'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa database tidak boleh di thread UI</h3><p>Fyne menggambar jendela lewat satu <b>thread UI</b> (main thread) yang bekerja terus-menerus: membaca posisi mouse, merakit layout, lalu menggambar. Selama thread ini bekerja, jendela <b>tidak merespons</b> apa pun.</p><p>Membaca file atau men-query database bisa memakan puluhan hingga ratusan milidetik. Bila itu dilakukan di thread UI, gejalanya jelas: jendela <b>membeku</b>, tombol tidak bisa diklik, dan pada sistem tertentu OS menandai aplikasi sebagai <i>not responding</i>. Solusinya selalu sama — <b>kirim pekerjaan berat ke goroutine, lalu kembalikan kendali lewat <code>fyne.Do</code></b> begitu hasilnya siap.</p>'
    },
    {
      type: 'text',
      html: '<h3>Dua jembatan: fyne.Do dan fyne.DoAndWait</h3><p>Sejak Fyne <b>v2.6</b>, standard library Fyne menyediakan dua fungsi resmi untuk menjangkau thread UI dari goroutine. Keduanya menerima satu fungsi tanpa parameter, tetapi bedanya menentukan apakah goroutine boleh langsung lanjut.</p>'
    },
    {
      type: 'example',
      title: 'Ringkasan thread.go — dua fungsi jembatan',
      lang: 'go',
      output: false,
      code: `// Sumber: fyne.io/fyne/v2@v2.8.2/thread.go (ringkasan komentar dokumentasi)
//
// DoAndWait mengeksekusi fungsi di main thread Fyne dan MENUNGGU sampai selesai.
// Dipakai bila goroutine membutuhkan hasil dari widget.
//   Sejak: 2.6
func DoAndWait(fn func()) {
	CurrentApp().Driver().DoFromGoroutine(fn, true)
}

// Do mengeksekusi fungsi di main thread TANPA menunggu.
// Cukup dipakai bila goroutine hanya perlu memicu pembaruan tampilan.
//   Sejak: 2.6
func Do(fn func()) {
	CurrentApp().Driver().DoFromGoroutine(fn, false)
}`,
      explain: [
        'Keduanya hanya boleh dipanggil <b>dari dalam goroutine yang kamu buat sendiri</b> — itu bunyi peringatan di komentar dokumentasinya.',
        '<code>fyne.Do</code> bersifat lepas-pesan: goroutine langsung lanjut sementara pembaruan UI diantre. Inilah yang dipakai hampir semua aksi di proyek contoh karena tidak ada yang perlu menunggu hasil widget.',
        '<code>fyne.DoAndWait</code> menunggu fungsi selesai di thread UI baru goroutine melanjutkan; pakai hanya bila goroutine benar-benar membutuhkan balikan dari widget.',
        'Aturan keras proyek ini: <b>setiap</b> pemanggilan API widget dari goroutine wajib dibungkus <code>fyne.Do</code> — tanpa kecuali.'
      ]
    },
    {
      type: 'warn',
      title: 'Satu pelanggaran, dua gejala aneh',
      text: 'Jangan pernah memanggil method widget dari goroutine tanpa <code>fyne.Do</code>: pada Fyne 2.6 ke atas gejalanya adalah tampilan berubah tanpa rasa (render aneh) atau panic yang tidak jelas pemicunya. Jangan juga menulis <code>a.data</code> dari goroutine — field itu milik thread UI; goroutine hanya boleh bekerja di atas <b>salinan</b> state, lalu menyerahkan hasilnya lewat <code>fyne.Do</code>.'
    },
    {
      type: 'text',
      html: '<h3>Pemisahan tiga fungsi: refresh, muat, terapkanList</h3><p>Pada <code>internal/ui/app.go</code>, pembacaan data dipecah menjadi tiga fungsi dengan satu tugas masing-masing. Pemisahan ini bukan gaya — ia yang membuat kode aman dari race sekaligus <b>bisa diuji secara deterministik</b>.</p><ul><li><b><code>refresh()</code></b> — berjalan di thread UI: menyalin filter dan pencarian ke variabel lokal, lalu memanggil goroutine.</li><li><b><code>muat(q)</code></b> — berjalan di goroutine: hanya membaca database, tidak menyentuh widget sedikit pun.</li><li><b><code>terapkanList()</code></b> — satu-satunya tempat menulis <code>a.data</code> dan widget; selalu dipanggil dari dalam <code>fyne.Do</code>.</li></ul>'
    },
    {
      type: 'example',
      title: 'refresh → muat → terapkanList di internal/ui/app.go',
      lang: 'go',
      output: false,
      code: `// refresh menyalin filter & pencarian lalu membaca database di goroutine lain.
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
}`,
      explain: [
        '<code>refresh()</code> bekerja di thread UI, sehingga membaca <code>a.filter</code> dan <code>a.search</code> di sini aman; yang dikirim ke goroutine adalah <b>salinan</b> <code>q</code>, bukan referensinya.',
        '<code>muat(q)</code> tidak pernah menyentuh widget — ia hanya mengumpulkan hasil lalu menyerahkannya lewat dua bungkus <code>fyne.Do</code>.',
        'Pemisahan ini menyelamatkan test: pada driver tes <code>fyne.Do</code> langsung dieksekusi, jadi <code>a.muat(q)</code> selesai dalam satu panggilan dan <code>TestMuatDataDariRepository</code> boleh memeriksa hasilnya tanpa tidur sejenak pun.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Bebas data race: salin dulu, baru goroutine</h3><p>Lihat lagi baris <code>q := repository.Query{Filter: a.filter, Search: a.search}</code>: pembuatan salinan terjadi <b>sebelum</b> <code>go a.muat(q)</code>, artinya di thread UI. Seandainya <code>a.filter</code> dibaca di dalam goroutine, bisa saja pengguna mengganti filter di tengah jalan — dua goroutine menyentuh field yang sama bersamaan dan <code>go test -race</code> akan menandainya sebagai <b>data race</b>.</p><p>Pada proyek contoh, <code>go test -race ./...</code> berjalan <b>bersih</b> untuk seluruh package, termasuk test UI yang memanggil <code>a.muat(q)</code> langsung dari thread test. Itulah bukti aturan ini dipegang di setiap aksi: <code>addTodo</code>, <code>toggleTodo</code>, <code>saveEdit</code>, sampai <code>confirmDelete</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Resep aksi lengkap: addTodo()</h3><p>Setiap tombol di aplikasi ini mengikuti urutan yang sama. Hafalkan polanya, karena <code>toggleTodo</code>, <code>saveEdit</code>, dan <code>confirmDelete</code> hanyalah versi yang lebih pendek dari resep ini.</p>'
    },
    {
      type: 'example',
      title: 'addTodo — validasi sampai refresh dalam satu pola',
      lang: 'go',
      output: false,
      code: `func (a *App) addTodo() {
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
}`,
      explain: [
        'Urutannya tetap: <b>validasi → nonaktifkan tombol → goroutine → fyne.Do → pulihkan tombol → perbarui status → refresh</b>. Tombol dinonaktifkan agar pengguna tidak mengklik dua kali dan menanam data kembar.',
        'Seluruh bacaan widget (<code>a.titleEntry.Text</code>, <code>a.categorySel.Selected</code>) terjadi sebelum <code>go func()</code> — goroutine menerima data siap pakai lewat variabel <code>in</code>.',
        'Balikan ditutup dalam satu <code>fyne.Do</code>: tombol dipulihkan lebih dulu agar aplikasi tidak pernah terkunci, bahkan ketika terjadi error.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Error berlapis sampai ke dialog</h3><p>Kesalahan database mengembara dari lapisan terbawah ke atas, dan tiap lapisan menambahkan satu hal: <b>repository</b> membungkus dengan konteks memakai <code>fmt.Errorf("…: %w", err)</code>, <b>service</b> meneruskan tanpa menghapus jejak, dan <b>UI</b> menampilkannya ke pengguna. Selama bungkususan memakai <code>%w</code>, error sentinel di lapisan mana pun tetap bisa diperiksa dengan <code>errors.Is</code>.</p>'
    },
    {
      type: 'example',
      title: 'Empat lapis perjalanan satu error',
      lang: 'go',
      output: false,
      code: `// (1) repository — bungkus dengan konteks, error asli tetap tersimpan di %w
if err != nil {
	return model.Todo{}, fmt.Errorf("simpan todo: %w", err)
}

// (2) service — meneruskan apa adanya; aturan sendiri memakai error sentinel
if id <= 0 {
	return model.Todo{}, ErrInvalidID
}
return s.repo.Get(ctx, id)

// (3) test — errors.Is menembus bungkusan %w di lapisan mana pun
if _, err := svc.Edit(ctx, 999, model.TodoInput{Title: "x"}); !errors.Is(err, repository.ErrNotFound) {
	t.Errorf("Edit(id hilang) = %v, diharapkan ErrNotFound", err)
}

// (4) UI — satu pintu menampilkan kesalahan, lalu daftar dimuat ulang
func (a *App) showError(err error) {
	a.setStatus("Terjadi kesalahan.")
	dialog.ShowError(err, a.win)
}`,
      explain: [
        'Bungkusan <code>%w</code> membuat pesan lebih informatif ("baca daftar todo: database is locked") tanpa kehilangan identitas error aslinya.',
        'Pengguna cukup tahu bahwa terjadi kesalahan dan membaca satu dialog; detail teknis tetap tersedia di log bila <code>err</code> dicetak.',
        'Setelah dialog ditutup, aksi selalu memanggil <code>a.refresh()</code> agar daftar menampilkan keadaan database yang sebenarnya, bukan state lama yang mungkin sudah basi.'
      ]
    },
    {
      type: 'example',
      title: 'Tema kustom: internal/ui/theme.go',
      lang: 'go',
      output: false,
      code: `import (
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

// cmd/todo/main.go — dipasang SEBELUM jendela dibuat
a.Settings().SetTheme(ui.AccentTheme())`,
      explain: [
        'Embedded field <code>fyne.Theme</code> diisi <code>ftheme.DefaultTheme()</code>, sehingga <code>accentTheme</code> otomatis memiliki seluruh method tema — kita hanya menimpa <code>Color</code>.',
        'Method yang tidak kita kenal diteruskan ke <code>t.Theme.Color(...)</code>: itulah gunanya menempel pada tema default, bukan menulis tema dari nol yang harus menyediakan puluhan warna, ikon, dan font.',
        '<code>color.NRGBA</code> memakai urutan merah-hijau-biru-alfa (0x0E7490) — alpha 0xFF berarti sepenuhnya opaque, bukan transparan.'
      ]
    },
    {
      type: 'example',
      title: 'Preferensi: mengingat pilihan pengguna antarjalankan',
      lang: 'go',
      output: false,
      code: `// cmd/todo/main.go — ID stabil membuat preferensi punya rumah tetap
a := app.NewWithID("id.pojokcodeid.todo")

// internal/ui/app.go — memulihkan filter terakhir saat aplikasi dibuka
if f := repository.Filter(a.prefs.String("filter")); filterValid(f) {
	a.filter = f
}

// internal/ui/app.go — menyimpan setiap kali pengguna mengganti filter
a.filterSel.OnChanged = func(s string) {
	a.filter = repository.Filter(s)
	a.prefs.SetString("filter", s) // ingat pilihan terakhir
	a.refresh()
}`,
      explain: [
        '<code>Preferences</code> menyediakan API sederhana per tipe data: <code>String</code>, <code>SetString</code>, <code>Bool</code>, <code>SetBool</code>, <code>Int</code>, dan <code>SetInt</code> — Fyne yang menyimpannya di folder data aplikasi.',
        'Nilai yang dibaca dikembalikan lewat <code>filterValid(f)</code> dulu: bila di file preferensi ada nilai aneh, aplikasi tetap jatuh ke filter "semua" alih-alih panic atau menampilkan daftar kosong misterius.',
        'Simpan hanya pengaturan kecil (filter, tampilan, ukuran jendela). Data todo tetap milik database — jangan menyalinnya ke preferensi.'
      ]
    },
    {
      type: 'tip',
      title: 'Berapa banyak fyne.Do yang wajar?',
      text: 'Satu bungkus per langkah sudah cukup. Hindari menumpuk <code>fyne.Do</code> berlapis-lapis di dalam satu goroutine tanpa perlu; bila sebuah goroutine menghasilkan beberapa pembaruan (misal daftar dan statistik), kumpulkan hasilnya lalu tampilkan dalam satu bungkus agar pembaruan terlihat bersamaan. Sebaliknya, untuk dua sumber data berbeda seperti <code>muat()</code>, dua bungkus terpisah justru membuat aplikasi terasa lebih responsif.'
    },
    {
      type: 'live',
      title: 'Latihan: jendela membeku atau tetap bergerak?',
      lang: 'html',
      hint: 'Tekan kedua tombol dan bandingkan penghitung tik layar. Pada mode blokir, penghitung berhenti selama query berjalan — persis seperti jendela Fyne yang membeku karena kehilangan thread UI.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Thread UI</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #f4f6f8; }
    .card { background: #fff; border-radius: 10px; padding: 16px; max-width: 720px; }
    h3 { margin: 0 0 6px; color: #0e7490; font-family: ui-monospace, monospace; }
    .bar { height: 10px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin: 10px 0; }
    .bar div { height: 100%; width: 0; background: #0e7490; }
    .stat { font-family: ui-monospace, monospace; font-size: 13px; color: #334155; }
    button { background: #0e7490; color: #fff; border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; margin: 4px 8px 4px 0; }
    pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; font-size: 12.5px; line-height: 1.55; min-height: 66px; }
    .hint { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h3>Jendela membeku atau tetap bergerak?</h3>
    <div class="bar"><div id="isi"></div></div>
    <p class="stat">Tik layar: <span id="tik">0</span> · status: <span id="status">siap</span></p>
    <button id="blok">Langsung di thread UI</button>
    <button id="latar">Goroutine + fyne.Do</button>
    <pre id="out">Kedua tombol menyelesaikan query 1,2 detik. Bedanya: apakah thread UI ikut menunggu.</pre>
    <p class="hint">Amati penghitung tik: berhenti selama query memblokir — itulah jendela yang membeku.</p>
  </div>
  <script>
    var tik = 0;
    function denyut() {
      tik++;
      document.getElementById('tik').textContent = tik;
      document.getElementById('isi').style.width = (tik % 40) * 2.5 + '%';
      requestAnimationFrame(denyut);
    }
    requestAnimationFrame(denyut);

    // meniru baca database yang memakan 1,2 detik
    function query(cb) {
      var t0 = Date.now();
      while (Date.now() - t0 < 1200) { /* sibuk membaca todo.db */ }
      cb('3 todo dimuat dari todo.db');
    }

    document.getElementById('blok').onclick = function () {
      document.getElementById('status').textContent = 'query di thread UI…';
      var sebelum = tik, t0 = Date.now();
      query(function (r) { // berjalan di thread UI → denyut ikut berhenti
        document.getElementById('out').textContent =
          'Thread UI: ' + r + ' dalam ' + (Date.now() - t0) + ' ms — tik berhenti dari ' +
          sebelum + ' menjadi ' + tik + '. Jendela membeku.';
        document.getElementById('status').textContent = 'selesai (jendela sempat membeku)';
      });
    };

    document.getElementById('latar').onclick = function () {
      document.getElementById('status').textContent = 'query di goroutine…';
      var sebelum = tik, t0 = Date.now();
      setTimeout(function () { // goroutine selesai → kembali ke thread UI lewat fyne.Do
        document.getElementById('out').textContent =
          'Goroutine + fyne.Do: 3 todo dimuat dalam ' + (Date.now() - t0) + ' ms — tik terus berjalan dari ' +
          sebelum + ' menjadi ' + tik + '. Jendela tetap responsif.';
        document.getElementById('status').textContent = 'selesai (jendela tetap hidup)';
      }, 1200);
    };
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Thread UI', 'Satu thread yang menggambar jendela di Fyne; selama ia sibuk, aplikasi tidak merespons apa pun.'],
        ['fyne.Do', 'Fungsi sejak Fyne v2.6 untuk menjalankan fungsi di thread UI tanpa menunggu — wajib dibungkus di setiap aksi widget dari goroutine.'],
        ['fyne.DoAndWait', 'Varian yang menunggu fungsi selesai di thread UI; dipakai hanya bila goroutine membutuhkan balikan dari widget.'],
        ['Goroutine', 'Anak proses ringan Go yang dipakai memindahkan pekerjaan berat (query database) keluar dari thread UI.'],
        ['Data race', 'Kondisi dua goroutine mengakses memori yang sama tanpa sinkronisasi; dideteksi oleh <code>go test -race</code>.'],
        ['Salinan state', 'Menyalin filter/pencarian ke variabel lokal sebelum goroutine dimulai sehingga goroutine tidak membaca field UI.'],
        ['dialog.ShowError', 'Dialog bawaan Fyne untuk menampilkan pesan kesalahan ke pengguna, dipakai oleh helper <code>showError</code>.'],
        ['fyne.Theme', 'Interface tema Fyne; dipenuhi oleh embed <code>theme.DefaultTheme()</code> sehingga hanya warna aksen yang ditimpa.'],
        ['Preferences', 'Penyimpanan kecil bawaan Fyne per aplikasi (String/Bool/Int) untuk pengaturan seperti filter terakhir.']
      ]
    }
  ],
  recap: [
    'Thread UI hanya untuk menggambar; baca database harus di <b>goroutine</b> agar jendela tidak membeku.',
    '<code>fyne.Do</code> tidak menunggu, <code>fyne.DoAndWait</code> menunggu — keduanya sejak Fyne v2.6 dan hanya dipanggil dari goroutine buatan sendiri.',
    'Pola <b>refresh → muat → terapkanList</b> memisahkan penyalinan state, baca database, dan sentuhan widget; <code>repository.Query</code> dibuat <b>sebelum</b> <code>go</code> karena membaca <code>a.filter</code> di dalam goroutine memicu data race yang ketahuan <code>go test -race ./...</code>.',
    'Resep aksi: validasi → nonaktifkan tombol → goroutine → <code>fyne.Do</code> → pulihkan tombol → status → refresh.',
    'Error berlapis memakai <code>fmt.Errorf("%w", ...)</code> di repository, diteruskan service, lalu tampil di <code>dialog.ShowError</code>; sentinel dicek dengan <code>errors.Is</code>.',
    'Tema kustom cukup menimpa <code>Color</code> pada embed <code>fyne.Theme</code>, dan preferensi disimpan lewat <code>app.NewWithID</code> plus <code>SetString</code>.'
  ]
});
