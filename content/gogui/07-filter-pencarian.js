/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 7: Filter, Pencarian & Statistik
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-filter',
  title: 'Filter, Pencarian & Statistik',
  chapter: 'Filter & Statistik',
  duration: '12 menit',
  intro: [
    'Daftar todo terasa hidup ketika ada tiga hal: <b>filter</b> (semua / belum selesai / selesai), <b>pencarian teks</b> lewat operator LIKE, dan <b>statistik</b> yang selalu up to date di header jendela.',
    'Ketiganya punya satu pola kerja yang sama: widget menyimpan kata kunci ke <b>state</b> aplikasi, satu baris menyalin state itu menjadi <code>repository.Query</code>, goroutine membaca database, dan hasilnya kembali ke thread UI lewat <code>fyne.Do</code>. Pelajaran ini juga menutup dengan fitur kecil yang sangat terasa: <b>preferensi</b>, agar pilihan filter terakhir teringat saat aplikasi dibuka lagi.'
  ],
  objectives: [
    'Membangun baris toolbar pencarian dengan container.NewBorder',
    'Menyalin state UI menjadi Query sebelum goroutine berangkat',
    'Menyusun klausa LIKE berparameter dan urutan CASE prioritas',
    'Menampilkan statistik aktif · selesai · total dari satu query COUNT',
    'Menyimpan dan memulihkan preferensi lewat fyne.Preferences'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Toolbar: satu baris untuk cari dan filter</h3><p>Widget pencarian dibuat dari tiga bagian yang disatukan <code>container.NewBorder</code>: <b>label di kiri</b>, <b>pilihan filter di kanan</b>, dan <b>kolom pencarian yang mengisi tengah</b>. Dengan Border, kolom cari otomatis melebar saat jendela diperbesar — tanpa menghitung piksel sedikit pun.</p><p>Cukup satu callback untuk masing-masing: begitu teks berubah, state diperbarui lalu <code>refresh()</code> dipanggil. Tidak ada tombol "Cari" yang perlu ditekan.</p>'
    },
    {
      type: 'example',
      title: 'searchRow: Entry + Select dalam satu Border',
      lang: 'go',
      output: false,
      code: `// internal/ui/app.go — buildUI()
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
	widget.NewLabel("Cari"), a.filterSel, a.searchEntry)`,
      explain: [
        'Urutan parameternya adalah <code>NewBorder(atas, bawah, kiri, kanan, isi)</code> — dua argumen pertama dibiarkan nil karena baris ini hanya punya kiri, kanan, dan tengah.',
        '<code>SetSelected</code> dipanggil SEBELUM <code>OnChanged</code> dipasang supaya penyetelan nilai awal tidak memicu refresh yang tidak perlu.',
        'Daftar pilihan diambil dari <code>repository.ValidFilters()</code> sehingga label filter tidak pernah menyimpang dari nilai yang dikenal service.'
      ]
    },
    {
      type: 'text',
      html: '<h3>State disalin, bukan dipinjam</h3><p>Perhatikan isi <code>refresh()</code>: ia tidak membaca <code>a.filter</code> dan <code>a.search</code> dari dalam goroutine, melainkan <b>menyalinnya lebih dulu</b> ke sebuah variabel <code>repository.Query</code> yang lalu dibawa pergi. Alasannya: goroutine berjalan bersamaan dengan thread UI. Sementara query sedang berjalan, pengguna bisa mengetik huruf lain atau mengganti filter — state berubah di tengah jalan dan goroutine akan membaca nilai campuran yang tidak pernah bermakna (disebut <b>data race</b>).</p>'
    },
    {
      type: 'example',
      title: 'refresh(), muat(), dan terapkanList()',
      lang: 'go',
      output: false,
      code: `// refresh menyalin filter & pencarian lalu membaca database di goroutine lain.
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
        'Parameter <code>q repository.Query</code> pada <code>muat</code> adalah SALINAN struct — goroutine tidak pernah menyentuh field UI sama sekali, sehingga aman dari data race.',
        'Karena pencarian per keystroke memanggil <code>refresh()</code>, bisa ada beberapa <code>muat</code> yang berjalan bersamaan. Yang tampil terakhir tidak harus yang terakhir berangkat, tetapi semua hasil valid dan tidak saling merusak — cukup untuk SQLite skala kecil.',
        'Statistik dimuat terpisah setelah daftar; bila membaca daftar gagal, statistik bahkan tidak dihitung (lihat blok <code>if err != nil</code>).'
      ]
    },
    {
      type: 'example',
      title: 'Kueri pencarian: LIKE berparameter & urutan prioritas',
      lang: 'go',
      output: false,
      code: `// internal/repository/sqlite/sqlite.go — List()
where, args := repository.FilterWhere(q)
if q.Search != "" {
	where += " AND (title LIKE ? OR note LIKE ? OR category LIKE ?)"
	like := repository.LikePattern(q.Search)
	args = append(args, like, like, like)
}
query := "SELECT " + kolomSelect + " FROM todos WHERE " + where +
	" ORDER BY done ASC," +
	" CASE priority WHEN 'tinggi' THEN 0 WHEN 'sedang' THEN 1 ELSE 2 END ASC," +
	" id DESC"

rows, err := s.db.QueryContext(ctx, query, args...)`,
      explain: [
        '<code>LikePattern</code> membungkus kata kunci menjadi <code>%kata%</code> — tanda persen di kiri-kanan membuatnya cocok di posisi mana pun, seperti <code>strings.Contains</code> di Go.',
        'Nilai pencarian TIDAK pernah disisipkan ke teks query: ia dikirim lewat <code>args</code> sebagai <b>prepared statement</b>. Mengetik <code>or 1=1</code> di kolom cari tidak akan melakukan apa pun selain mencari teks itu.',
        'Klausa <code>CASE priority</code> mengubah teks menjadi angka pengurut; hasilnya todo prioritas tinggi selalu naik ke atas pada kelompoknya, tanpa sorting tambahan di memori.'
      ]
    },
    {
      type: 'tip',
      title: 'Pencarian per keystroke: aman, tapi ada batasnya',
      text: 'Memanggil <code>refresh()</code> dari <code>OnChanged</code> berarti satu query per huruf yang diketik. Untuk SQLite dengan ratusan baris ini tidak terasa; begitu datanya mencapai puluhan ribu baris, tambahkan <b>debounce</b>: jadwalkan refresh lewat <code>time.AfterFunc</code> dan batalkan jadwal sebelumnya setiap kali huruf baru datang, sehingga query hanya berjalan setelah pengguna berhenti mengetik sejenak.'
    },
    {
      type: 'example',
      title: 'Statistik: satu query COUNT untuk seluruh header',
      lang: 'go',
      output: false,
      code: `// internal/repository/sqlite/sqlite.go
func (s *Store) Stats(ctx context.Context) (repository.Stats, error) {
	var total, aktif int
	err := s.db.QueryRowContext(ctx,
		"SELECT COUNT(*),"+
			" COALESCE(SUM(CASE WHEN done = 0 THEN 1 ELSE 0 END), 0)"+
			" FROM todos").Scan(&total, &aktif)
	if err != nil {
		return repository.Stats{}, fmt.Errorf("hitung statistik: %w", err)
	}
	return repository.Stats{Total: total, Active: aktif, Done: total - aktif}, nil
}

// internal/ui/app.go — dipanggil dari fyne.Do
func (a *App) updateStats(st repository.Stats, err error) {
	if err != nil {
		a.statsLabel.SetText("statistik tidak tersedia")
		return
	}
	a.statsLabel.SetText(fmt.Sprintf("%d aktif · %d selesai · %d total", st.Active, st.Done, st.Total))
}`,
      explain: [
        '<code>SUM(CASE WHEN done = 0 THEN 1 ELSE 0 END)</code> menghitung baris belum selesai dalam satu pass; jumlah selesai cukup dikurangkan, jadi tidak perlu query kedua.',
        '<code>COALESCE(..., 0)</code> menjaga hasil tetap angka ketika tabel kosong — <code>SUM</code> atas nol baris menghasilkan NULL, dan NULL tidak bisa di-<code>Scan</code> ke int.',
        'Label statistik memakai hitungan <b>seluruh</b> data, bukan yang sedang tampil — pengguna tetap tahu ada 3 todo tersembunyi di balik filter.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Preferensi: filter terakhir yang teringat</h3><p>Fyne menyediakan penyimpanan key-value kecil per aplikasi lewat <code>app.Preferences()</code>. Karena aplikasi dibuat dengan <code>app.NewWithID</code>, preferensi tersimpan pada lokasi standar sistem operasi dan bertahan antar sesi — pilihan "selesai" yang kamu pakai tadi malam langsung aktif saat aplikasi dibuka lagi.</p>'
    },
    {
      type: 'example',
      title: 'Menyimpan dan memulihkan pilihan filter',
      lang: 'go',
      output: false,
      code: `// cmd/todo/main.go — ID stabil = kunci preferensi
a := app.NewWithID("id.pojokcodeid.todo")

// internal/ui/app.go — newApp() memulihkan filter terakhir
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

// Lalu di OnChanged select filter:
//	a.prefs.SetString("filter", s)   menyimpan
//	a.prefs.String("filter")          membaca`,
      explain: [
        '<code>SetString</code> menulis begitu nilai berubah, sedangkan pembacaan hanya terjadi sekali saat startup — menulis tidak mahal, membaca tidak perlu berulang.',
        'Nilai hasil baca <b>wajib divalidasi</b> dengan <code>filterValid</code>: file preferensi bisa saja diedit tangan atau berisi nilai lama yang sudah tidak sah.',
        'Tanpa <code>NewWithID</code>, Fyne memakai ID sementara dan preferensi hilang setiap kali binary diganti — gejalanya filter selalu kembali ke "semua".'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan pernah membaca field UI dari dalam goroutine',
      text: 'Godaan terbesar adalah menulis <code>go a.muat()</code> lalu membiarkan <code>muat</code> membaca <code>a.filter</code> dan <code>a.search</code> langsung. Saat thread UI menulis nilai itu (pengguna mengetik) bersamaan dengan goroutine membacanya, hasilnya data race: bisa nilai setengah jalan, urutan acak, sampai crash pada mesin dengan race detector. Pola yang benar persis seperti <code>refresh()</code>: <b>salin state menjadi variabel lokal, bawa sebagai parameter</b>, dan kembalikan hasil hanya lewat <code>fyne.Do</code>. Jalankan <code>go test -race ./...</code> untuk memastikan tidak ada yang lolos.'
    },
    {
      type: 'live',
      title: 'Latihan: tiru filter + pencarian ala SQL LIKE',
      lang: 'html',
      hint: 'Tombol filter dan kolom pencarian bekerja persis seperti aplikasi: perubahan langsung memanggil terapkan(). Tugasnya satu — tambahkan opsi filter "prioritas tinggi" dengan membuat tombol baru lalu melengkapi kasus yang ditandai TODO di dalam fungsi terapkan().',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Filter & Pencarian Todo</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 18px; background: #f4f6f8; }
    .card { background: #fff; border-radius: 10px; padding: 14px; max-width: 640px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    h3 { margin: 0 0 10px; color: #0e7490; font-size: 16px; }
    .bar { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
    .fbtn { border: 1px solid #cbd5e1; background: #fff; border-radius: 16px; padding: 5px 12px; cursor: pointer; font-size: 13px; }
    .fbtn.on { background: #0e7490; color: #fff; border-color: #0e7490; }
    input { flex: 1; min-width: 180px; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box; }
    .row { display: flex; align-items: center; gap: 8px; padding: 7px 2px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .row span { flex: 1; } .done { color: #94a3b8; text-decoration: line-through; }
    .pri { font-size: 12px; padding: 2px 8px; border-radius: 10px; background: #e2e8f0; }
    .pri.tinggi { background: #fecaca; } .pri.sedang { background: #fde68a; } .pri.rendah { background: #bbf7d0; }
    .kosong { padding: 16px; color: #94a3b8; font-size: 13px; text-align: center; }
    .stat { margin-top: 10px; font-size: 13px; color: #334155; }
    .hint { color: #94a3b8; font-size: 12px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h3>WHERE done ... AND (title LIKE ?) ORDER BY prioritas</h3>
    <div class="bar">
      <button id="f-semua" class="fbtn on" onclick="pilih('semua')">Semua</button>
      <button id="f-belum" class="fbtn" onclick="pilih('belum')">Belum selesai</button>
      <button id="f-selesai" class="fbtn" onclick="pilih('selesai')">Selesai</button>
      <input id="cari" placeholder="Cari judul / kategori…" oninput="cari = this.value; terapkan()">
    </div>
    <div id="list"></div>
    <div class="stat" id="stat"></div>
    <div class="hint">Latihan: tambahkan tombol "Prioritas tinggi" dan lengkapi kasus TODO di fungsi terapkan().</div>
  </div>
  <script>
    var data = [
      { judul: "Rapat tim", kat: "Kerja", pri: "tinggi", done: false },
      { judul: "Beli beras", kat: "Belanja", pri: "rendah", done: false },
      { judul: "Bayar tagihan", kat: "Pribadi", pri: "sedang", done: true },
      { judul: "Kirim laporan kuarta", kat: "Kerja", pri: "tinggi", done: false },
      { judul: "Olahraga pagi", kat: "Pribadi", pri: "rendah", done: true },
      { judul: "Survei harga laptop", kat: "Belanja", pri: "sedang", done: false }
    ];
    var filter = "semua";
    var cari = "";
    var urutan = { tinggi: 0, sedang: 1, rendah: 2 };

    function like(q, t) { // meniru LIKE %kata% pada title dan category
      if (!q) { return true; }
      var hay = (t.judul + " " + t.kat).toLowerCase();
      return hay.includes(q.toLowerCase());
    }

    function terapkan() {
      var hasil = data.filter(function (t) {
        if (filter === "belum" && t.done) { return false; }
        if (filter === "selesai" && !t.done) { return false; }
        // TODO latihan: tambahkan kasus filter === "tinggi" → hanya t.pri === "tinggi"
        return like(cari, t);
      });
      hasil.sort(function (a, b) {
        if (a.done !== b.done) { return a.done ? 1 : -1; }
        return urutan[a.pri] - urutan[b.pri];
      });
      var w = document.getElementById("list");
      if (!hasil.length) {
        w.innerHTML = "<div class='kosong'>Tidak ada todo yang cocok.</div>";
      } else {
        w.innerHTML = "";
        hasil.forEach(function (t) {
          var r = document.createElement("div");
          r.className = "row";
          var s = document.createElement("span");
          s.textContent = (t.done ? "✔ " : "") + t.judul + " · " + t.kat;
          if (t.done) { s.className = "done"; }
          var p = document.createElement("span");
          p.className = "pri " + t.pri;
          p.textContent = "prioritas " + t.pri;
          r.appendChild(s); r.appendChild(p);
          w.appendChild(r);
        });
      }
      var aktif = data.filter(function (t) { return !t.done; }).length;
      var selesai = data.length - aktif;
      document.getElementById("stat").textContent =
        hasil.length + " ditampilkan · " + aktif + " aktif · " + selesai +
        " selesai · " + data.length + " total";
    }

    function pilih(f) {
      filter = f;
      var b = document.querySelectorAll(".fbtn");
      for (var i = 0; i < b.length; i++) {
        b[i].className = b[i].id === "f-" + f ? "fbtn on" : "fbtn";
      }
      terapkan();
    }

    terapkan();
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Query', 'Struct berisi Filter dan Search yang dibawa goroutine; dibentuk di refresh() sebagai salinan state UI.'],
        ['LIKE', 'Operator SQL untuk pencarian pola; memakai % sebagai wildcard sehingga %kata% cocok di posisi mana pun.'],
        ['Prepared statement', 'Query yang parameter nilainya dikirim terpisah lewat tanda tanya (?); membuat pencarian bebas SQL injection.'],
        ['COALESCE', 'Fungsi SQL yang mengembalikan nilai pertama yang bukan NULL, dipakai agar SUM tabel kosong tetap 0.'],
        ['CASE WHEN', 'Ekspresi bersyarat SQL; di proyek ini dipakai untuk mengurutkan prioritas dan menghitung aktif dalam satu query.'],
        ['Data race', 'Kondisi dua goroutine mengakses memori yang sama tanpa sinkronisasi; dicegah dengan menyalin state menjadi parameter.'],
        ['fyne.Preferences', 'Penyimpanan key-value per aplikasi (SetString/String) yang bertahan antar sesi bila aplikasi dibuat dengan NewWithID.'],
        ['Debounce', 'Menunda aksi sampai pengguna berhenti sejenak; pengembangan wajar bila pencarian per keystroke mulai terasa berat.']
      ]
    }
  ],
  recap: [
    'Toolbar pencarian adalah <code>container.NewBorder</code>: label di kiri, <code>filterSel</code> di kanan, <code>searchEntry</code> yang melebar di tengah.',
    'State harus <b>disalin</b> menjadi <code>repository.Query</code> sebelum goroutine berangkat — membaca field UI dari goroutine adalah data race.',
    'Pencarian memakai <code>LikePattern</code> (%kata%) dan parameter <code>?</code>, sehingga aman dari SQL injection walau ditekan tiap keystroke.',
    'Statistik dihitung satu query <code>COUNT + COALESCE(SUM CASE)</code> lalu ditulis sebagai "N aktif · N selesai · N total".',
    'Urutan tampil = <code>done ASC</code>, lalu <code>CASE priority</code>, lalu <code>id DESC</code> — filter apa pun urutannya tetap konsisten.',
    '<code>app.NewWithID</code> + <code>prefs.SetString("filter", s)</code> membuat pilihan filter terakhir teringat saat aplikasi dibuka lagi.'
  ]
});
