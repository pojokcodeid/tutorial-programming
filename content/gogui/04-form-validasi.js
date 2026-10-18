/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 4: Form Input & Validasi Sebelum Menyimpan
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-form',
  title: 'Form Input & Validasi Sebelum Menyimpan',
  chapter: 'Form Input',
  duration: '12 menit',
  intro: [
    'Daftar sudah tampil, sekarang kita mengisi isinya. Pelajaran ini merangkai <b>form tambah todo</b>: satu kolom isian dengan tombol, dua daftar pilihan, dan pintu masuk <b>Enter</b> lewat <code>OnSubmitted</code> — lalu menjaga supaya data yang sampai ke database selalu lolos aturan.',
    'Validasi dibahas dari dua sisi: <b>di UI</b> agar pengguna langsung diberi tahu lewat dialog, dan <b>di service</b> agar data tetap terlindungi walau ada pintu masuk lain. Keduanya memanggil fungsi yang sama, <code>model.TodoInput.Validate()</code>.'
  ],
  objectives: [
    'Merangkai baris input dan baris pilihan dengan container <code>Border</code> dan <code>HBox</code>',
    'Menghubungkan Enter pada kolom isian ke aksi tombol lewat <code>OnSubmitted</code>',
    'Hafal aturan validasi todo beserta contoh input yang diterima dan ditolak',
    'Membaca kode <code>Validate()</code> dan menjelaskan peran trim, default, serta hitungan karakter berbasis rune',
    'Mengikuti alur <code>addTodo()</code> dari klik tombol sampai daftar ter-refresh'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua baris pertama form</h3><p>Form tambah ada di bagian atas jendela dan tersusun dari dua baris. <b>Baris input</b> memakai <code>container.NewBorder</code> dengan <code>Entry</code> sebagai <i>center</i> (mengisi ruang) dan tombol <b>Tambah</b> sebagai <i>right</i> (berukuran isi, menempel di kanan). <b>Baris pilihan</b> memakai <code>container.NewHBox</code> berisi dua <code>widget.Select</code>: kategori dan prioritas. Berikut potongan aslinya dari <code>buildUI()</code> pada <code>internal/ui/app.go</code>:</p>'
    },
    {
      type: 'example',
      title: 'inputRow & choiceRow pada buildUI()',
      lang: 'go',
      output: false,
      code: `// Baris 1: input judul + tombol Tambah (tombol menempel di kanan).
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
choiceRow := container.NewHBox(a.categorySel, a.prioritySel)`,
      explain: [
        'Pada <code>NewBorder(top, bottom, left, right, center)</code> keempat posisi tepi diisi <code>nil</code> — hanya <code>right</code> (tombol) dan <code>center</code> (Entry) yang dipakai. Hasilnya kolom isian melebar mengikuti jendela, tombol tetap pas di kanan.',
        '<b><code>OnSubmitted</code></b> menerima <code>func(string)</code> dan dipanggil saat Enter ditekan. Isinya cukup <code>a.addTodo()</code> — <b>satu aksi, dua pintu masuk</b>, sehingga perilaku Enter dan klik tombol tidak pernah berbeda.',
        'Kedua <code>Select</code> dibuat dengan callback <code>nil</code> lalu <code>SetSelected</code> dijalankan lebih dulu — persis aturan pelajaran 2, supaya nilai awal tidak memicu apa pun.'
      ]
    },
    {
      type: 'example',
      title: 'Aturan validasi model.TodoInput.Validate()',
      lang: 'text',
      output: false,
      code: `FIELD        ATURAN                              CONTOH DITOLAK
-----------  ----------------------------------  ------------------------------
judul        wajib setelah trim                  "     " (hanya spasi)
             maksimal 120 karakter               judul 121 karakter
catatan      maksimal 500 karakter               catatan 501 karakter
kategori     maksimal 40 karakter                kategori 41 karakter
             kosong -> diisi "Umum"              (otomatis diperbaiki)
prioritas    hanya rendah | sedang | tinggi      "penting"
             kosong -> diisi "sedang"            (otomatis diperbaiki)

DITERIMA (langsung disimpan ke database)
  "Belajar Fyne"            judul bersih; kategori "Umum", prioritas "sedang"
  "  Rapat sprint  "        dipotong jadi "Rapat sprint" berkat trim
  "Bayar listrik"           kategori "Pribadi", prioritas "tinggi"
  "Lapor rocket"            panjang dihitung per huruf, bukan per byte

DITOLAK (muncul dialog "Input belum valid")
  "     "                   judul wajib diisi
  judul 121 karakter         judul maksimal 120 karakter
  catatan 501 karakter       catatan maksimal 500 karakter
  prioritas "penting"        prioritas harus rendah, sedang, atau tinggi`,
      explain: [
        'Urutan pemeriksaan tidak acak: <b>judul kosong dulu</b>, baru panjang. Kalau urutannya dibalik, pengguna yang mengetik spasi akan menerima pesan &quot;terlalu panjang&quot; yang membingungkan untuk input yang sebenarnya kosong.',
        '<b>Default dipasang SETELAH pemeriksaan panjang</b>, sehingga kategori dan prioritas yang kosong langsung diisi &quot;Umum&quot; dan &quot;sedang&quot; — nilai default selalu lolos, tidak mungkin gagal validasi.',
        'Setiap kegagalan dikembalikan sebagai error bernama (<code>ErrTitleRequired</code>, <code>ErrPriorityUnknown</code>, dsb.) sehingga dialog bisa menampilkan pesan Indonesia dan unit test cukup membandingkan error yang sama.'
      ]
    },
    {
      type: 'example',
      title: 'Kode Validate() dan penghitung karakternya',
      lang: 'go',
      output: false,
      code: `// Validate membersihkan input (trim + default) lalu memvalidasinya.
// Mengembalikan salinan yang sudah bersih agar hasilnya bisa langsung dipakai.
func (in TodoInput) Validate() (TodoInput, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.Note = strings.TrimSpace(in.Note)
	in.Category = strings.TrimSpace(in.Category)
	in.Priority = strings.TrimSpace(in.Priority)

	switch {
	case in.Title == "":
		return in, ErrTitleRequired
	case runeLen(in.Title) > MaxTitle:
		return in, ErrTitleTooLong
	case runeLen(in.Note) > MaxNote:
		return in, ErrNoteTooLong
	case runeLen(in.Category) > MaxCategory:
		return in, ErrCategoryLong
	}

	if in.Category == "" {
		in.Category = "Umum"
	}
	if in.Priority == "" {
		in.Priority = PriorityMedium
	}
	switch in.Priority {
	case PriorityLow, PriorityMedium, PriorityHigh:
	default:
		return in, ErrPriorityUnknown
	}
	return in, nil
}

func runeLen(s string) int { return len([]rune(s)) }`,
      explain: [
        'Method ini bertipe <b>nilai</b>, bukan pointer, dan mengembalikan salinan yang sudah bersih — pemanggil cukup menulis <code>clean, err := in.Validate()</code> lalu memakai <code>clean</code> tanpa khawatir memodifikasi data asli.',
        '<b><code>len([]rune(s))</code> menghitung karakter</b>, bukan byte. <code>len(s)</code> biasa menghitung byte UTF-8: huruf &quot;Á&quot; bernilai 2 dan emoji bisa 4, sehingga batas 120 akan terasa ketat tidak wajar bagi teks Indonesia ber-emoji.',
        '<b>Trim lebih dulu</b> supaya judul yang isinya cuma spasi dianggap kosong — tanpa trim, <code>&quot;   &quot;</code> lolos sebagai judul terisi lalu tampil hampir kosong di daftar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alur addTodo(): dari klik sampai daftar ter-refresh</h3><p>Semua pintu (klik tombol maupun Enter) bermuara pada satu fungsi <code>a.addTodo()</code>. Urutannya:</p><ul><li><b>1. Kumpulkan input</b> — baca <code>titleEntry.Text</code> dan kedua <code>Selected</code>, masukkan ke struct <code>model.TodoInput</code>.</li><li><b>2. Validasi</b> — bila gagal, tampilkan <code>dialog.ShowInformation</code> berisi pesan error dan <b>berhenti</b>.</li><li><b>3. Kunci tombol</b> — <code>a.addBtn.Disable()</code> mencegah klik ganda, status diganti &quot;Menyimpan…&quot;.</li><li><b>4. Kerja berat di goroutine</b> — <code>go func()</code> memanggil <code>a.svc.Add(...)</code> yang membaca database.</li><li><b>5. Kembali ke thread UI</b> — <code>fyne.Do</code> menjalankan: aktifkan kembali tombol, kosongkan kolom, tulis status sukses, lalu <code>a.refresh()</code>.</li><li><b>6. Bila gagal</b> — tombol diaktifkan dan <code>showError</code> menampilkan dialog error, kolom tidak dikosongkan agar isian tidak hilang.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 480" width="760" role="img" aria-label="Alur addTodo: klik atau Enter, membangun TodoInput, validasi, penguncian tombol, goroutine service, kembali lewat fyne.Do, lalu refresh daftar">
        <rect x="40" y="16" width="340" height="40" rx="8" class="u-hd"/>
        <text x="210" y="41" class="u-title" text-anchor="middle">① Klik Tambah / Enter</text>
        <line x1="210" y1="56" x2="210" y2="84" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="40" y="84" width="340" height="40" rx="8" class="u-box"/>
        <text x="210" y="109" class="u-title" text-anchor="middle">② Bangun model.TodoInput</text>
        <line x1="210" y1="124" x2="210" y2="152" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="40" y="152" width="340" height="40" rx="8" class="u-box"/>
        <text x="210" y="177" class="u-title" text-anchor="middle">③ in.Validate()</text>
        <line x1="380" y1="172" x2="430" y2="172" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="405" y="164" class="u-lbl" text-anchor="middle">gagal</text>
        <rect x="436" y="152" width="290" height="40" rx="8" class="u-hd"/>
        <text x="581" y="177" class="u-lbl" text-anchor="middle">dialog.ShowInformation — berhenti</text>
        <line x1="210" y1="192" x2="210" y2="220" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="220" y="212" class="u-lbl" text-anchor="start">lolos</text>

        <rect x="40" y="220" width="340" height="40" rx="8" class="u-box"/>
        <text x="210" y="245" class="u-title" text-anchor="middle">④ Disable() · status Menyimpan…</text>
        <line x1="210" y1="260" x2="210" y2="288" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="40" y="288" width="340" height="40" rx="8" class="u-box"/>
        <text x="210" y="313" class="u-title" text-anchor="middle">⑤ goroutine: svc.Add()</text>
        <line x1="210" y1="328" x2="210" y2="356" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="220" y="348" class="u-lbl" text-anchor="start">selesai</text>

        <rect x="40" y="356" width="340" height="40" rx="8" class="u-hd"/>
        <text x="210" y="381" class="u-title" text-anchor="middle">⑥ fyne.Do: Enable · kosongkan</text>
        <line x1="210" y1="396" x2="210" y2="424" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="40" y="424" width="340" height="40" rx="8" class="u-box"/>
        <text x="210" y="449" class="u-title" text-anchor="middle">⑦ refresh() → daftar ter-update</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Alur <code>addTodo()</code>: langkah ①–④ di thread UI, langkah ⑤ di goroutine database, dan ⑥–⑦ kembali ke thread UI lewat <code>fyne.Do</code></figcaption></figure>`
    },
    {
      type: 'example',
      title: 'addTodo() pada internal/ui/app.go',
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
        '<b><code>Disable()</code> / <code>Enable()</code></b> adalah pengaman klik ganda: selama database bekerja, tombol Tambah mati sehingga satu klik hanya menghasilkan satu todo. Tanpa ini, pengguna sabar bisa menanam lima baris identik.',
        'Perhatikan <b>tidak ada widget yang disentuh setelah <code>go func()</code></b> kecuali di dalam <code>fyne.Do</code>. Detail mengapa pembaruan UI wajib lewat <code>fyne.Do</code> — termasuk antrian dan urutan eksekusinya — dibahas tuntas pada pelajaran goroutine.',
        'Kolom hanya dikosongkan pada <b>kesuksesan</b>. Kalau penyimpanan gagal, isian tetap ada sehingga pengguna cukup memperbaiki masalahnya dan mencoba lagi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kenapa divalidasi di dua tempat?</h3><p><b>Di UI</b> validasi bertujuan <b>umpan balik cepat</b>: pengguna diberi tahu dalam hitungan milidetik lewat dialog, tanpa menunggu goroutine dan tanpa membuang koneksi database. <b>Di service</b> validasi bertujuan <b>keamanan data</b>: service tidak tahu siapa pemanggilnya. Ia bisa dipanggil oleh unit test, oleh <code>cmd/seed</code>, atau oleh pintu masuk lain di masa depan — semuanya harus tunduk pada aturan yang sama. Karena itu <code>service.Add</code> tetap memanggil <code>in.Validate()</code> <b>walau UI sudah memvalidasinya</b>:</p>'
    },
    {
      type: 'example',
      title: 'Pemeriksaan kedua di service.Add',
      lang: 'go',
      output: false,
      code: `// Add memvalidasi input lalu menyimpannya lewat repository.
// ID dan waktu dibuat oleh database, bukan oleh UI.
func (s *Service) Add(ctx context.Context, in model.TodoInput) (model.Todo, error) {
	clean, err := in.Validate()
	if err != nil {
		return model.Todo{}, err
	}
	return s.repo.Add(ctx, model.Todo{
		Title:    clean.Title,
		Note:     clean.Note,
		Category: clean.Category,
		Priority: clean.Priority,
	})
}`,
      explain: [
        'Pemeriksaan kedua ini <b>bukan pengulangan pekerjaan</b>: pemeriksaan pertama menolak input jelek lebih awal (cepat, murah), pemeriksaan kedua menolak input jelek <i>apa pun jalannya</i> (aman). Biayanya satu pemanggilan fungsi murni tanpa query.',
        'Karena aturan hanya ada di satu fungsi <code>Validate()</code>, memperbatas judul menjadi 100 karakter cukup mengubah satu konstanta <code>MaxTitle</code> — UI, service, dan unit test langsung mengikuti.',
        'Unit test tidak perlu membuka jendela: cukup memanggil <code>model.TodoInput{...}.Validate()</code> dan membandingkan errornya, sehingga seluruh tabel aturan di atas teruji otomatis.'
      ]
    },
    {
      type: 'warn',
      title: 'Salin nilai input sebelum masuk goroutine',
      text: 'Kolom isian hanya boleh dibaca di <b>thread UI</b>. Itulah sebabnya <code>addTodo()</code> membentuk struct <code>in</code> dari <code>a.titleEntry.Text</code> dan kedua <code>Selected</code> <b>sebelum</b> <code>go func()</code> dimulai, lalu menutupnya dengan <code>in = clean</code> hasil validasi. Bila kamu memindahkan pembacaan <code>Entry</code> ke dalam goroutine, pengguna bisa mengetik lagi saat proses berjalan dan data yang terbaca menjadi campuran dua waktu — belum lagi aturan bahwa widget tidak boleh disentuh di luar thread UI.'
    },
    {
      type: 'tip',
      title: 'Satu aksi untuk semua pintu masuk',
      text: 'Tombol <b>Tambah</b> dan tombol <b>Enter</b> sama-sama memanggil <code>a.addTodo()</code>, dan validasi ada di baris pertama fungsi itu. Dengan pola ini menambah pintu baru (misalnya shortcut Ctrl+N) cukup memanggil fungsi yang sama — aturan validasi, penguncian tombol, dan penyimpanan tidak pernah terlewat. Hindari menyalin blok validasi ke tiap pintu; duplikasi aturan adalah awal mula aturan yang berbeda-beda.'
    },
    {
      type: 'vocab',
      items: [
        ['Validate()', 'Method pada <code>model.TodoInput</code> yang membersihkan (trim + default) lalu memvalidasi; mengembalikan salinan bersih plus error.'],
        ['TrimSpace', 'Fungsi <code>strings</code> yang membuang spasi di awal dan akhir teks; dipasang lebih dulu agar judul kosong tertangkap.'],
        ['Rune', 'Satu karakter teks; <code>len([]rune(s))</code> menghitung jumlahnya sehingga emoji dan huruf beraksen dihitung satu.'],
        ['Default value', 'Nilai pengganti bila input kosong: kategori &quot;Umum&quot; dan prioritas &quot;sedang&quot;, dipasang setelah pemeriksaan panjang.'],
        ['OnSubmitted', 'Callback <code>Entry</code> yang dipanggil saat Enter ditekan; pada proyek ini mengarah ke aksi yang sama dengan tombol Tambah.'],
        ['Dialog', 'Jendela kecil <code>dialog.ShowInformation</code> / <code>dialog.ShowError</code> untuk umpan balik singkat kepada pengguna.'],
        ['Disable / Enable', 'Kunci tombol selama penyimpanan berlangsung; mencegah satu pengguna mengirim data yang sama berkali-kali.'],
        ['Validasi berlapis', 'Pemeriksaan di dua lapis: UI untuk kecepatan umpan balik, service untuk keamanan data yang tidak bergantung pada siapa pemanggil.']
      ]
    }
  ],
  recap: [
    'Baris input memakai <b><code>NewBorder</code></b> (Entry di center, tombol Tambah di right) dan baris pilihan memakai <b><code>NewHBox</code></b> berisi dua <code>Select</code>.',
    '<b><code>OnSubmitted</code></b> membuat Enter menjalankan <code>addTodo()</code> yang sama dengan klik tombol — satu aksi, semua pintu masuk.',
    'Aturan validasi: judul wajib setelah trim, judul maks 120, catatan maks 500, kategori maks 40, prioritas hanya rendah/sedang/tinggi, plus default <b>Umum</b> dan <b>sedang</b>.',
    '<code>Validate()</code> melakukan <b>trim lebih dulu</b>, memasang <b>default belakangan</b>, dan menghitung panjang dengan <b><code>len([]rune(...))</code></b> agar karakter Indonesia dan emoji adil.',
    'Alur <code>addTodo()</code>: kumpulkan → validasi → <code>Disable()</code> → goroutine memanggil service → <b><code>fyne.Do</code></b> mengembalikan kendali ke thread UI → kosongkan kolom, status sukses, <code>refresh()</code>.',
    'Validasi berada di <b>dua tempat dengan satu sumber aturan</b>: UI untuk umpan balik cepat, service untuk keamanan — keduanya memanggil fungsi <code>Validate()</code> yang sama.'
  ]
});
