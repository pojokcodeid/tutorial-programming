/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 6: CRUD Lengkap: Ubah, Centang, Hapus dengan Dialog
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-crud',
  title: 'CRUD Lengkap: Ubah, Centang, Hapus dengan Dialog',
  chapter: 'CRUD & Dialog',
  duration: '13 menit',
  intro: [
    'Tombol <b>Tambah</b> sudah beres di pelajaran 4. Pelajaran ini menyelesaikan tiga aksi yang tersisa: <b>mengubah todo lewat dialog form</b>, <b>mencentang status selesai</b> langsung dari baris, dan <b>menghapus dengan konfirmasi</b>.',
    'Pola kerjanya selalu sama dan akan kamu pakai terus di proyek GUI mana pun: baca input di thread UI, jalankan database di <b>goroutine</b>, bawa hasilnya kembali lewat <code>fyne.Do</code>, lalu <code>refresh()</code> agar daftar mencerminkan data terbaru.'
  ],
  objectives: [
    'Memetakan alur aksi dari tombol list sampai refresh',
    'Membangun dialog form dengan widget.NewEntry, NewMultiLineEntry, dan NewSelect',
    'Menangani callback dialog berdasarkan nilai ok, bukan urutan event',
    'Menjalankan mutasi di goroutine dan kembali ke UI lewat fyne.Do',
    'Memetakan ErrNotFound, ErrInvalidID, error validasi, dan error database ke pesan pengguna'
  ],
  sections: [
    {
      type: 'example',
      title: 'Peta alur satu aksi: dari tombol sampai daftar berubah',
      lang: 'text',
      output: false,
      code: `tombol ubah (pensil) pada baris ke-i
  └─ OnTapped — closure di updateRow, membawa salinan t (model.Todo)
       └─ App.showEditDialog(t)            membangun form dari data lama
            └─ dialog.NewForm → tombol "Simpan" → callback(ok = true)
                 └─ App.saveEdit(t.ID, input)
                      └─ goroutine:  svc.Edit(...) → repo.Update(...) → database
                           └─ fyne.Do(func(){ ... })   kembali ke thread UI
                                └─ refresh() → repo.List → list.Refresh()

tombol centang (Check) pada baris yang sama
  └─ check.OnChanged → App.toggleTodo(id) → goroutine → svc.Toggle
       → repo: UPDATE todos SET done = 1 - done → fyne.Do → refresh()`,
      explain: [
        'Dua peristiwa UI berbeda (klik tombol dan klik checkbox) berakhir di tujuan yang sama: satu mutasi di goroutine lalu <code>refresh()</code>. Pola ini berulang di seluruh aplikasi.',
        'Closure memegang <b>salinan</b> <code>t</code>, bukan indeks baris — kalau daftar berubah di tengah jalan, tombol tetap menunjuk ke todo yang benar.',
        'Setiap anak panah di atas adalah satu titik di mana error bisa muncul; itulah sebabnya pesan error dibahas terpisah di bagian akhir pelajaran.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dialog form untuk mengubah todo</h3><p>Dialog ubah dibangun dari empat widget isian, lalu dibungkus <code>dialog.NewForm</code>. Kuncinya bukan tampilannya, melainkan <b>callback yang hanya membaca nilai saat <code>ok == true</code></b> — ketika pengguna menekan Batal, tidak ada satu pun teks yang dikirim ke database.</p>'
    },
    {
      type: 'example',
      title: 'showEditDialog() — internal/ui/dialogs.go',
      lang: 'go',
      output: false,
      code: `func (a *App) showEditDialog(t model.Todo) {
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
}`,
      explain: [
        'Setiap <code>widget.FormItem</code> memasangkan label teks dengan satu widget — <code>NewForm</code> menyusunnya jadi baris form rapi tanpa layout manual.',
        '<code>SetSelected</code> mengisi nilai lama SEBELIKANYA callback dibuat, sehingga pengguna melihat isi todo yang akan diubah, bukan form kosong.',
        '<code>d.Resize(fyne.NewSize(440, 340))</code> menentukan ukuran dialog; tanpa baris ini dialog menyusut mengikuti isi form yang bisa terlalu kecil.'
      ]
    },
    {
      type: 'example',
      title: 'saveEdit() dan confirmDelete()',
      lang: 'go',
      output: false,
      code: `// saveEdit memvalidasi lalu menyimpan perubahan di latar belakang.
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
	pesan := fmt.Sprintf("Hapus “%s”?\\nTindakan ini tidak bisa dibatalkan.", t.Title)

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
}`,
      explain: [
        'Validasi dijalankan <b>dua lapis</b>: cepat di UI (biar pengguna langsung tahu) dan sungguhan di service — lapisan UI tidak pernah dipercaya sebagai penjaga aturan.',
        'Pesan konfirmasi dibuat dengan <code>fmt.Sprintf</code> dan memuat judul todo di antara tanda kutip Unicode “ ” supaya batas teks jelas walau judulnya panjang.',
        'Callback <code>fyne.Do</code> adalah satu-satunya tempat yang boleh menyentuh widget; di dalamnya error memicu <code>showError</code> + <code>refresh()</code>, dan sukses memicu <code>refresh()</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Konfirmasi hapus yang informatif, dan refresh setelah setiap mutasi',
      text: 'Dialog <code>NewConfirm</code> yang hanya bertanya "Hapus data ini?" membuat pengguna ragu. Selalu tanamkan identitasnya, misalnya <code>Hapus “Rapat tim”?</code> — tanda kutip Unicode “ ” dipilih agar tidak bentrok dengan tanda kutip string Go. Satu aturan lagi: <b>setiap mutasi (tambah, simpan, toggle, hapus) wajib diakhiri refresh()</b>. Tanpa refresh, data di database sudah berubah tetapi widget masih menampilkan foto lama, dan aksi berikutnya bisa menyasar baris yang salah.'
    },
    {
      type: 'example',
      title: 'Toggle selesai: dari checkbox baris ke UPDATE di database',
      lang: 'go',
      output: false,
      code: `// internal/ui/list.go — updateRow mengisi baris ke-i dengan data terbaru
t := a.data[id] // salinan lokal: aman dipakai oleh closure tombol

// Cabut handler lama dulu: SetChecked akan memanggil OnChanged,
// dan kita tidak ingin klik baris sebelumnya ikut terpicu.
row.check.OnChanged = nil
row.check.SetChecked(t.Done)
row.check.OnChanged = func(bool) { a.toggleTodo(t.ID) }

row.edit.OnTapped = func() { a.showEditDialog(t) }
row.del.OnTapped = func() { a.confirmDelete(t) }

// internal/ui/app.go
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
}`,
      explain: [
        'Baris <code>OnChanged = nil</code> sebelum <code>SetChecked</code> mencegah program memicu toggle saat sekadar menampilkan data — handler dipasang setelah nilai disetel.',
        '<code>done = 1 - done</code> membalik nilai di database: 0 menjadi 1 dan 1 menjadi 0, tanpa perlu membaca nilai lama dulu (menghindari baca-tulis yang tidak atomik).',
        'Setelah toggle, daftar di-refresh karena <b>urutannya ikut berubah</b>: baris yang tadinya di atas (belum selesai) turun ke bawah sesuai <code>ORDER BY done ASC</code>, dan statistik di header ikut menyesuaikan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Apa yang terjadi bila …</h3><p>Empat skenario kegagalan, empat sumber error berbeda — semuanya berakhir di satu tempat yang sama: dialog pesan plus status bar. Tabel ini peta debug-mu saat aplikasi berperilaku aneh:</p><table><tr><th>Situasi</th><th>Error Go</th><th>Dipantau di</th><th>Yang tampil</th></tr><tr><td>ID sudah tidak ada (dihapus proses lain)</td><td><code>repository.ErrNotFound</code></td><td>repository: sql.ErrNoRows / baris 0 terpengaruh</td><td><code>dialog.ShowError</code> — "todo tidak ditemukan"</td></tr><tr><td>ID tidak masuk akal (0 / negatif)</td><td><code>service.ErrInvalidID</code></td><td>service, sebelum menyentuh database</td><td><code>dialog.ShowError</code></td></tr><tr><td>Validasi gagal (judul kosong, kepanjangan)</td><td><code>model.ErrTitleRequired</code>, <code>ErrTitleTooLong</code>, <code>ErrPriorityUnknown</code></td><td><code>in.Validate()</code> di saveEdit dan service</td><td><code>dialog.ShowInformation</code> "Input belum valid"</td></tr><tr><td>Database gagal (file terkunci, disk penuh)</td><td>error driver dibungkus <code>fmt.Errorf("%w")</code></td><td><code>db.Exec</code> / <code>db.Query</code></td><td><code>dialog.ShowError</code> berisi pesan database apa adanya</td></tr></table><p>Semua error dibungkus dengan <code>%w</code>, sehingga <code>errors.Is(err, repository.ErrNotFound)</code> tetap berhasil meski sudah melewati dua lapis pembungkus.</p>'
    },
    {
      type: 'example',
      title: 'Kenapa Edit mengambil data lama terlebih dulu',
      lang: 'go',
      output: false,
      code: `// internal/service/todo.go
func (s *Service) Edit(ctx context.Context, id int64, in model.TodoInput) (model.Todo, error) {
	if id <= 0 {
		return model.Todo{}, ErrInvalidID
	}
	clean, err := in.Validate()
	if err != nil {
		return model.Todo{}, err
	}
	current, err := s.repo.Get(ctx, id) // ← data lama dibaca dulu
	if err != nil {
		return model.Todo{}, err
	}
	current.Title = clean.Title     // hanya empat field ini yang ditimpa
	current.Note = clean.Note
	current.Category = clean.Category
	current.Priority = clean.Priority

	if err := s.repo.Update(ctx, current); err != nil {
		return model.Todo{}, err
	}
	return current, nil
}`,
      explain: [
        'Form ubah hanya berisi empat field, sedangkan baris di database punya delapan — tanpa <code>repo.Get</code> lebih dulu, field yang tidak ditampilkan akan tertimpa nilai kosong.',
        'Alasan terbesarnya: <b>status selesai</b> dan <b>created_at</b>. Bayangkan todo yang sudah dicentang tiba-tiba kembali "belum selesai" hanya karena judulnya diubah.',
        'Urutan pemeriksaannya juga penting: ID divalidasi, input divalidasi, baru data lama diambil — sehingga ID salah tidak pernah memicu query pemboros.'
      ]
    },
    {
      type: 'live',
      title: 'Latihan: simulasikan alur aksi & jenis errornya',
      lang: 'html',
      hint: 'Pilih satu skenario error pada dropdown, lalu tekan Ubah, Centang, atau Hapus pada baris mana pun — amati dialog mana yang muncul dan bagaimana refresh() tetap dipanggil. Setelah bebas, pilih "normal (sukses)" untuk melihat alur mulus.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Alur CRUD Todo</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 18px; background: #f4f6f8; }
    .card { background: #fff; border-radius: 10px; padding: 14px; max-width: 660px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    h3 { margin: 0 0 10px; color: #0e7490; font-size: 16px; }
    .row { display: flex; align-items: center; gap: 8px; padding: 7px 2px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .row span { flex: 1; } .done { color: #94a3b8; text-decoration: line-through; } .status { font-size: 12px; color: #64748b; }
    button { border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; padding: 5px 10px; cursor: pointer; font-size: 13px; }
    button.p { background: #0e7490; color: #fff; border-color: #0e7490; }
    .bar { margin: 12px 0 6px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: 13px; }
    select { padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; }
    .log { margin-top: 10px; background: #0f172a; color: #a7f3d0; font-family: ui-monospace, monospace; font-size: 12px; padding: 10px; border-radius: 8px; min-height: 60px; white-space: pre-wrap; }
    .ovl { position: fixed; inset: 0; background: rgba(15,23,42,.55); display: none; align-items: center; justify-content: center; }
    .dlg { background: #fff; border-radius: 10px; padding: 16px; width: 320px; box-shadow: 0 8px 30px rgba(0,0,0,.25); }
    .dlg h4 { margin: 0 0 8px; color: #0e7490; font-size: 15px; } .dlg p { margin: 0 0 14px; font-size: 14px; line-height: 1.55; }
    .acts { text-align: right; } .acts button { margin-left: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h3>tombol → goroutine → repository → fyne.Do → refresh()</h3>
    <div id="list"></div>
    <div class="bar">
      <label>Skenario:</label>
      <select id="skn">
        <option value="">normal (sukses)</option>
        <option value="notfound">ID tidak ada → ErrNotFound</option>
        <option value="invalid">ID tidak valid → ErrInvalidID</option>
        <option value="validasi">judul kosong → ErrTitleRequired</option>
        <option value="db">database gagal → fmt.Errorf %w</option>
      </select>
      <button class="p" onclick="tambah()">Tambah</button>
      <span class="status" id="st">Menyiapkan…</span>
    </div>
    <div class="log" id="log">log thread UI muncul di sini — setiap aksi selalu diakhiri refresh(), termasuk saat gagal</div>
  </div>
  <div class="ovl" id="ovl">
    <div class="dlg">
      <h4 id="dJudul">Konfirmasi</h4>
      <p id="dIsi"></p>
      <div class="acts"><button onclick="tutup()">Batal</button><button class="p" id="dOk">Ya</button></div>
    </div>
  </div>
  <script>
    var data = [
      { id: 1, judul: "Rapat tim", kat: "Kerja", pri: "tinggi", done: false },
      { id: 2, judul: "Beli beras", kat: "Belanja", pri: "rendah", done: false },
      { id: 3, judul: "Bayar tagihan", kat: "Pribadi", pri: "sedang", done: true },
      { id: 4, judul: "Kirim laporan", kat: "Kerja", pri: "tinggi", done: false },
      { id: 5, judul: "Olahraga pagi", kat: "Pribadi", pri: "rendah", done: false },
      { id: 6, judul: "Survei harga", kat: "Belanja", pri: "sedang", done: false }
    ];
    var urut = { tinggi: 0, sedang: 1, rendah: 2 };
    var aksi = null;
    function log(p) { var el = document.getElementById("log"); el.textContent = "> " + p + "\\n" + el.textContent; }
    function setStatus(m) { document.getElementById("st").textContent = m; }
    function render() {
      var w = document.getElementById("list");
      w.innerHTML = "";
      data.forEach(function (t) {
        var r = document.createElement("div");
        r.className = "row";
        var c = document.createElement("input");
        c.type = "checkbox"; c.checked = t.done;
        c.onchange = function () { toggle(t.id); };
        var s = document.createElement("span");
        s.textContent = (t.done ? "✔ " : "") + t.judul + " · " + t.kat + " · prioritas " + t.pri;
        if (t.done) { s.className = "done"; }
        var b1 = document.createElement("button");
        b1.textContent = "Ubah"; b1.onclick = function () { ubah(t.id); };
        var b2 = document.createElement("button");
        b2.textContent = "Hapus"; b2.onclick = function () { hapus(t.id); };
        r.appendChild(c); r.appendChild(s); r.appendChild(b1); r.appendChild(b2);
        w.appendChild(r);
      });
    }
    function errorSkenario() {
      var v = document.getElementById("skn").value;
      if (v === "notfound") { return "todo tidak ditemukan (repository.ErrNotFound)"; }
      if (v === "invalid") { return "id todo tidak valid (service.ErrInvalidID)"; }
      if (v === "validasi") { return "judul wajib diisi (model.ErrTitleRequired)"; }
      if (v === "db") { return "baca daftar todo: database is locked"; }
      return "";
    }
    function buka(judul, isi, label, fn) {
      document.getElementById("dJudul").textContent = judul;
      document.getElementById("dIsi").textContent = isi;
      document.getElementById("dOk").textContent = label;
      aksi = fn;
      document.getElementById("ovl").style.display = "flex";
    }
    function tutup() { document.getElementById("ovl").style.display = "none"; aksi = null; }
    document.getElementById("dOk").onclick = function () { var f = aksi; tutup(); if (f) { f(); } };
    function gagal(pesan, widget) {
      setStatus("Terjadi kesalahan.");
      buka("Terjadi kesalahan", pesan + "\\nwidget: " + widget, "Tutup", function () {
        log("refresh() tetap dipanggil — daftar dibaca ulang");
        render();
      });
    }
    function tambah() {
      var err = errorSkenario();
      if (err) { return gagal(err, "dialog.ShowError"); }
      data.push({ id: Date.now(), judul: "Tugas baru " + (data.length + 1), kat: "Umum", pri: "sedang", done: false });
      setStatus("Todo berhasil ditambahkan.");
      log("svc.Add → repo.Add → fyne.Do → refresh()");
      render();
    }
    function ubah(id) {
      var err = errorSkenario();
      if (err) { return gagal(err, "dialog.ShowError"); }
      var t = data.find(function (x) { return x.id === id; });
      buka("Ubah Todo", "Form dialog: judul, catatan, kategori, prioritas — untuk " + t.judul, "Simpan", function () {
        t.judul = t.judul + " (diubah)";
        setStatus("Perubahan tersimpan.");
        log("saveEdit → svc.Edit → repo.Get dulu → repo.Update → refresh()");
        render();
      });
    }
    function hapus(id) {
      var t = data.find(function (x) { return x.id === id; });
      buka("Hapus Todo", "Hapus “" + t.judul + "”?\\nTindakan ini tidak bisa dibatalkan.", "Hapus", function () {
        var err = errorSkenario();
        data = data.filter(function (x) { return x.id !== id; });
        if (err) { return gagal(err, "svc.Delete"); }
        setStatus("Todo dihapus.");
        log("confirmDelete → svc.Delete → repo.Delete → refresh()");
        render();
      });
    }
    function toggle(id) {
      var err = errorSkenario();
      if (err) { return gagal(err, "widget.Check"); }
      var t = data.find(function (x) { return x.id === id; });
      t.done = !t.done;
      data.sort(function (a, b) {
        if (a.done !== b.done) { return a.done ? 1 : -1; }
        var d = urut[a.pri] - urut[b.pri];
        return d !== 0 ? d : b.id - a.id;
      });
      setStatus("Status todo diperbarui.");
      log("check.OnChanged → svc.Toggle → UPDATE done = 1 - done → refresh()");
      render();
    }
    render();
  </script>
</body>
</html>`
    },
    {
      type: 'warn',
      title: 'Widget hanya boleh disentuh di thread UI',
      text: 'Jangan pernah memanggil <code>SetText</code>, <code>Refresh</code>, <code>dialog.Show*</code>, maupun <code>Disable/Enable</code> dari dalam goroutine yang menjalankan query — gejalanya jendela membeku, crash acak, atau tampilan yang tidak pernah berubah walau database sudah berisi. Alurnya selalu: goroutine bekerja di latar belakang, lalu <b>seluruh</b> penyentuhan widget dibungkus <code>fyne.Do(func(){ ... })</code>. Nilai state pun harus disalin sebelum goroutine berangkat (pelajaran 7).'
    },
    {
      type: 'vocab',
      items: [
        ['dialog.NewForm', 'Dialog berisi form bertombol konfirmasi; parameternya judul, label tombol simpan/batal, daftar FormItem, callback, dan parent window.'],
        ['FormItem', 'Pasangan label + widget isian yang dibentuk widget.NewFormItem, disusun otomatis oleh dialog form.'],
        ['dialog.NewConfirm', 'Dialog dua tombol (Ya/Batal) untuk tindakan merusak seperti menghapus; callback menerima boolean ok.'],
        ['Callback ok', 'Parameter boolean pada dialog: true berarti tombol konfirmasi ditekan, false berarti dibatalkan.'],
        ['Closure', 'Fungsi anonim yang membawa variabel dari lingkup sekitarnya; dipakai tombol baris untuk memegang salinan todo.'],
        ['fyne.Do', 'Fungsi Fyne v2.8 untuk menjalankan kode di thread UI dengan aman dari goroutine mana pun.'],
        ['Data race', 'Dua goroutine mengakses memori yang sama tanpa sinkronisasi; dicegah dengan menyalin state dan memakai fyne.Do.']
      ]
    }
  ],
  recap: [
    'Alur aksi selalu sama: <b>closure tombol → method App → goroutine → service → repository → fyne.Do → refresh()</b>.',
    'Dialog ubah dibangun dari <code>NewEntry</code>, <code>NewMultiLineEntry</code>, dan <code>NewSelect</code>, dibungkus <code>dialog.NewForm</code> lalu di-<code>Resize</code>.',
    'Callback dialog hanya membaca nilai saat <code>ok == true</code>; Batal benar-benar tidak menyentuh database.',
    'Toggle memakai <code>done = 1 - done</code> dan wajib memicu refresh karena urutan <code>ORDER BY done ASC</code> serta statistik ikut berubah.',
    'Empat jenis kegagalan punya sumber berbeda: <code>ErrNotFound</code>, <code>ErrInvalidID</code>, error validasi model, dan error database berbungkus <code>%w</code>.',
    'Edit mengambil data lama lewat <code>repo.Get</code> agar status selesai dan waktu pembuatan tidak hilang saat form disimpan.'
  ]
});
