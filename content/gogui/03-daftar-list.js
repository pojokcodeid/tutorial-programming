/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 3: Menampilkan Daftar: struct Todo & widget.List
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-list',
  title: 'Menampilkan Daftar: struct Todo & widget.List',
  chapter: 'Data & List',
  duration: '13 menit',
  intro: [
    'Jendela sudah berdiri, tetapi isinya masih kosong. Pelajaran ini memasang bahan utamanya: <b>model data</b> yang menggambarkan satu todo, lalu <b><code>widget.List</code></b> yang menampilkan ratusan baris dengan tetap ringan.',
    'Kuncinya ada pada satu kebiasaan: <b>UI tidak pernah membaca database saat menggambar</b>. Yang dibaca daftar hanyalah slice <code>data</code> di memori, sehingga fungsi gambar selalu cepat dan bebas error koneksi. Kita juga membahas cara kerja <b>daur ulang baris</b> pada Fyne — sumber bug paling umum pada daftar panjang.'
  ],
  objectives: [
    'Membaca struktur <code>model.Todo</code> dan <code>model.TodoInput</code> beserta tujuan tiap field',
    'Menjelaskan penyimpanan waktu sebagai teks RFC3339 dan perannya pada pertukaran data',
    'Memahami tiga callback <code>widget.List</code>: Length, CreateItem, dan UpdateItem',
    'Menulis <code>createRow()</code> dan <code>updateRow()</code> dengan peta widget per baris',
    'Memperbarui tampilan lewat <code>a.data</code> + <code>Refresh()</code> serta pesan daftar kosong'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Model data: Todo dan TodoInput</h3><p>Semua isi jendela pada akhirnya lahir dari satu struct. <b><code>model.Todo</code></b> adalah satu baris yang tersimpan di database, sedangkan <b><code>model.TodoInput</code></b> adalah kiriman mentah dari form ke service — sengaja lebih kecil karena ID dan waktu bukan urusan pengguna.</p>'
    },
    {
      type: 'example',
      title: 'Isi internal/model/todo.go',
      lang: 'go',
      output: false,
      code: `// Todo adalah satu baris pekerjaan yang disimpan aplikasi.
type Todo struct {
	ID        int64
	Title     string
	Note      string
	Category  string
	Priority  string
	Done      bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TodoInput adalah data yang dikirim lapisan UI ke service.
// Belum memuat ID dan waktu — keduanya ditentukan oleh database.
type TodoInput struct {
	Title    string
	Note     string
	Category string
	Priority string
}`,
      explain: [
        'Pemisahan <code>Todo</code> dan <code>TodoInput</code> adalah bentuk kecil dari pertahanan data: pengguna tidak bisa mengirim ID atau waktu buatan sendiri, karena field itu memang tidak ada pada <code>TodoInput</code>.',
        'Package <code>model</code> tidak mengimpor widget maupun paket database — hanya <code>time</code>, <code>strings</code>, dan <code>errors</code>. Karena itu struct yang sama dipakai oleh UI, service, tiga driver database, dan unit test.',
        'Field <code>ID</code> bertipe <code>int64</code>: SQLite menyimpan INTEGER dalam 64 bit, sedangkan kolom <code>INT</code> MySQL cukup dipindahkan oleh <code>database/sql</code> ke tipe yang sama — ruang nomor tidak akan pernah habis.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Field satu per satu, dan kenapa waktunya teks</h3><ul><li><b><code>ID</code></b> — nomor unik dari database; dipakai tombol ubah, hapus, dan centang selesai.</li><li><b><code>Title</code></b> — judul wajib diisi, maksimal 120 karakter.</li><li><b><code>Note</code></b> — catatan panjang opsional, maksimal 500 karakter; jarang tampil di daftar, tetapi ikut dicari.</li><li><b><code>Category</code></b> dan <b><code>Priority</code></b> — teks bebas yang dibatasi aturan validasi; prioritas hanya boleh <code>rendah</code>, <code>sedang</code>, atau <code>tinggi</code>.</li><li><b><code>Done</code></b> — penanda selesai; di SQLite disimpan sebagai 0/1, di MySQL sebagai TINYINT, lalu dibaca kembali menjadi <code>bool</code>.</li><li><b><code>CreatedAt</code> / <code>UpdatedAt</code></b> — dibuat database, bukan UI.</li></ul><p>Di Go kedua waktu bertipe <code>time.Time</code>, tetapi <b>di database disimpan sebagai teks RFC3339</b> (contoh <code>2026-10-18T09:30:00Z</code>, lengkap hingga nano). Alasannya format itu <b>identik di semua driver</b>: SQLite tidak punya tipe waktu khusus, sedangkan MySQL punya <code>DATETIME</code> yang perilakunya berbeda-beda. Itu sebabnya satu format teks dipakai bersama: hasil baca SQLite dan MySQL jadi identik tidak peduli driver mana yang aktif, dan repository tinggal menukar teks itu dengan <code>time.Format</code> / <code>time.Parse</code> — repository in-memory sendiri cukup langsung memegang <code>time.Time</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Satu-satunya sumber tampilan: slice <code>data</code></h3><p><code>App</code> menyimpan <b><code>data []model.Todo</code></b> pada struct-nya. Inilah yang dibaca <code>widget.List</code> setiap menggambar — <b>tidak ada satu pun fungsi rendering yang membuka koneksi database</b>. Database hanya disentuh oleh <code>refresh()</code> yang berjalan di goroutine lain, dan hasilnya baru ditulis ke <code>a.data</code> lewat <code>fyne.Do</code>. Konsekuensinya: menggambar cepat, tidak pernah error koneksi, dan UI bisa diuji tanpa database sungguhan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Cara kerja widget.NewList</h3><p><code>widget.NewList</code> menerima tiga fungsi, dan ketiganya dipanggil Fyne berulang-ulang:</p><ul><li><b><code>length()</code></b> — melaporkan panjang data; pada kita cukup <code>len(a.data)</code>.</li><li><b><code>createItem()</code></b> — membuat <b>satu kerangka baris</b> yang belum terisi apa pun: label kosong, checkbox mati, tombol tanpa aksi.</li><li><b><code>updateItem(i, obj)</code></b> — mengisi baris ke-<code>i</code> dengan data terbaru; <code>obj</code> adalah kerangka hasil <code>createItem</code>.</li></ul><p>Triknya: Fyne <b>mendaur ulang (recycle) baris</b>. Untuk daftar 1.000 todo, Fyne hanya membuat baris sebanyak yang muat di layar (misalnya 12) dan memanggil <code>updateItem</code> untuk mengganti isinya saat pengguliran. Karena objek yang sama dipakai untuk indeks yang berbeda, <b><code>updateItem</code> wajib menimpa SELURUH isi baris</b> — sisa isi lama akan terbawa ke todo berikutnya.</p>'
    },
    {
      type: 'example',
      title: 'Memasang widget.List pada buildUI()',
      lang: 'go',
      output: false,
      code: `func (a *App) buildUI() fyne.CanvasObject {
	// Daftar dibuat lebih dulu — callback apa pun (mis. OnChanged select)
	// bisa memicu refresh(), dan refresh tidak boleh menemui daftar kosong.
	a.list = widget.NewList(a.listLength, a.createRow, a.updateRow)
	a.emptyBox = container.NewCenter(widget.NewLabel(
		"Belum ada todo di sini.\\nTambahkan yang pertama lewat kolom di atas."))
	a.emptyBox.Hide()
	// ... baris kepala, form, toolbar, dan kaki jendela menyusul ...
}

// length cukup melaporkan panjang — tanpa query, tanpa error.
func (a *App) listLength() int { return len(a.data) }`,
      explain: [
        'Urutan di dalam <code>buildUI()</code> disengaja: <b>daftar dibuat paling atas</b> supaya bila <code>SetSelected</code> pada salah satu Select memicu <code>refresh()</code> lebih awal, <code>a.list</code> sudah ada dan tidak menyebabkan panic.',
        '<code>length()</code> tidak pernah menjalankan query — karena itu tampilan tidak pernah macet menunggu database; yang membuat menunggu adalah <code>refresh()</code> di goroutine terpisah.',
        '<code>emptyBox</code> disimpan pada field karena harus ditampilkan/disembunyikan oleh <code>terapkanList</code> ketika daftar kosong — tidak bisa dilakukan dari dalam callback List.'
      ]
    },
    {
      type: 'example',
      title: 'createRow(): kerangka satu baris',
      lang: 'go',
      output: false,
      code: `// rowWidgets memuat widget pembentuk satu baris daftar.
// Disimpan dalam map berbasis identitas objek supaya updateRow cukup
// melakukan type-assert ke struct, bukan menebak urutan anak container.
type rowWidgets struct {
	check *widget.Check
	title *widget.Label
	meta  *widget.Label
	edit  *widget.Button
	del   *widget.Button
}

func (a *App) createRow() fyne.CanvasObject {
	row := &rowWidgets{
		check: widget.NewCheck("", nil),
		title: widget.NewLabel("…"),
		meta:  widget.NewLabel(""),
		edit:  widget.NewButtonWithIcon("", theme.MailComposeIcon(), nil),
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
}`,
      explain: [
        'Mengapa perlu <b><code>map[fyne.CanvasObject]*rowWidgets</code></b>? Karena <code>updateItem</code> hanya menerima objek hasil <code>createItem</code>. Tanpa map, kamu harus menebak bahwa anak ke-0 adalah checkbox dan anak ke-3 adalah label — satu perubahan susunan container akan membuat seluruh teks berpindah tempat. Dengan map, cukup <code>row, ok := a.rows[obj]</code> dan type-assert langsung aman.',
        'Seluruh widget dibuat dengan callback <b><code>nil</code></b>: <code>widget.NewCheck(&quot;&quot;, nil)</code>, tombol tanpa aksi. Aksi dipasang nanti oleh <code>updateRow</code>, di mana data todo sudah dikenal.',
        'Kerangka baris ini dibuat Fyne <b>sekali</b> per baris lalu dipakai ulang — karena itu biaya membuat daftar 1.000 todo tetap hanya belasan objek widget.'
      ]
    },
    {
      type: 'example',
      title: 'updateRow(): mengisi baris ke-i',
      lang: 'go',
      output: false,
      code: `func (a *App) updateRow(id int, obj fyne.CanvasObject) {
	if id < 0 || id >= len(a.data) {
		return // jaring pengaman bila data dan Length tidak sinkron
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
}`,
      explain: [
        '<b><code>row.check.OnChanged = nil</code> dulu, baru <code>SetChecked</code>.</b> Sama seperti pelajaran 2: <code>SetChecked</code> langsung menembak handler bila sudah terpasang. Tanpa cabut-memasang ini, mengisi baris hasil daur ulang akan ikut men-toggle todo yang sebelumnya tampil di posisi itu.',
        '<b><code>t := a.data[id]</code> mengambil salinan.</b> Closure tombol menangkap <code>t</code>, bukan indeks — jadi walau slice berubah beberapa milidetik kemudian, tombol Hapus tetap menunjuk todo yang benar di layar saat itu.',
        'Setiap field ditimpa penuh: teks, pentingnya warna, dan handler tombol. Tidak ada cabang yang menyisakan nilai lama — inilah syarat utama fungsi update terhadap baris hasil daur ulang.'
      ]
    },
    {
      type: 'example',
      title: 'Memperbarui tampilan setelah data berubah',
      lang: 'go',
      output: false,
      code: `// terapkanList menulis hasil baca ke widget — hanya dipanggil di thread UI.
func (a *App) terapkanList(list []model.Todo, err error) {
	if err != nil {
		a.showError(err)
		return
	}
	a.data = list       // 1) ganti sumber tampilan
	a.list.Refresh()    // 2) minta Fyne menggambar ulang baris yang terlihat

	if len(list) == 0 {
		a.emptyBox.Show()   // pesan "belum ada todo" menutupi daftar
	} else {
		a.emptyBox.Hide()
	}
	a.setStatus(fmt.Sprintf("%d todo ditampilkan.", len(list)))
}`,
      explain: [
        'Dua baris pertama adalah seluruh mekanisme pembaruan: menaruh slice baru, lalu <b><code>Refresh()</code></b>. Fyne akan bertanya ulang <code>length()</code> dan memanggil <code>updateItem</code> untuk baris terlihat — tidak ada baris yang ditambah atau dihapus manual.',
        '<code>emptyBox</code> dan <code>a.list</code> berada dalam <b><code>container.NewStack</code></b>, sehingga keduanya menempel di area yang sama. Saat daftar kosong, pesan tampil menutupi daftar yang tidak berisi apa-apa.',
        'Baris ini berada di thread UI. Perpindahan dari goroutine database ke sini dilakukan <code>fyne.Do</code> — mekanisme lengkapnya dibahas pada pelajaran goroutine.'
      ]
    },
    {
      type: 'warn',
      title: 'Dua syarat agar daftar tidak pernah menampilkan data usang',
      text: '<b>1. Jangan mengubah isi slice dari goroutine lain</b> saat daftar sedang merender — misalnya menambah atau menghapus elemen <code>a.data</code> dari goroutine database tanpa <code>fyne.Do</code>. Render terjadi di thread UI, sehingga perubahan bersamaan membuat daftar membaca indeks yang sudah tidak ada (panic) atau menampilkan baris setengah lama. Goroutine cukup menyiapkan hasil baca, lalu menyerahkannya lewat <code>fyne.Do</code>. <b>2. <code>Length()</code> harus selalu sepanjang isi slice.</b> Jika <code>length()</code> melaporkan 10 tetapi <code>data</code> berisi 8, Fyne memanggil <code>updateItem</code> untuk indeks 8 dan 9 yang kosong — baris terakhir bisa menampilkan data todo lama. Itulah sebabnya penjaga <code>if id &lt; 0 || id &gt;= len(a.data) { return }</code> ditulis di awal <code>updateRow</code>: pelindung terakhir, bukan alasan untuk melanggar aturan.'
    },
    {
      type: 'live',
      title: 'Latihan: tiru CreateItem dan UpdateItem',
      lang: 'html',
      hint: 'Modifikasi fungsi render() agar menampilkan kategori dengan huruf tebal, atau ubah createItem() agar baris punya kolom lain. Jalankan lagi untuk melihat daftar berubah.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi widget.List</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #eef2f6; }
    .card { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 4px 14px rgba(0,0,0,.1); }
    h4 { margin: 0 0 4px; color: #0e7490; }
    .hint { color: #64748b; font-size: 13px; margin-bottom: 12px; }
    .bar { display: flex; gap: 8px; margin-bottom: 10px; }
    .bar input { flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 8px; }
    .bar button { border: 0; background: #0e7490; color: #fff; border-radius: 8px; padding: 0 14px; cursor: pointer; font-weight: 600; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; gap: 10px; align-items: center; padding: 9px 6px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    li span.meta { color: #64748b; font-size: 12px; }
    li button.hapus { margin-left: auto; border: 1px solid #fecaca; background: #fff2f2; color: #b91c1c; border-radius: 6px; padding: 3px 9px; cursor: pointer; }
    li.done .t { text-decoration: line-through; color: #94a3b8; }
    .foot { margin-top: 10px; font-size: 13px; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <h4>widget.List versi mini</h4>
    <div class="hint">pool[] berperan seperti baris hasil daur ulang Fyne.</div>
    <div class="bar">
      <input id="judul" placeholder="Judul todo baru">
      <button id="tambah">Tambah</button>
    </div>
    <ul id="daftar"></ul>
    <div class="foot" id="foot"></div>
  </div>
  <script>
    var data = [
      { title: 'Belajar widget.List', cat: 'Kerja', pri: 'sedang', done: false },
      { title: 'Rapat tim produk', cat: 'Kerja', pri: 'tinggi', done: true },
      { title: 'Beli beras', cat: 'Belanja', pri: 'rendah', done: false }
    ];
    var daftar = document.getElementById('daftar');
    var pool = [];

    // CREATE: membuat SATU kerangka baris yang belum terisi.
    function createItem() {
      var li = document.createElement('li');
      li.innerHTML = '<input type="checkbox"><span class="t"></span>' +
                     '<span class="meta"></span><button class="hapus">Hapus</button>';
      return li;
    }

    // UPDATE: mengisi baris ke-i — timpa SELURUH isi, jangan setengah-setengah.
    function updateItem(i, el, t) {
      el.className = t.done ? 'done' : '';
      el.querySelector('input').checked = t.done;
      el.querySelector('.t').textContent = t.title;
      el.querySelector('.meta').textContent = t.cat + ' · ' + t.pri;
      el.querySelector('.hapus').onclick = function () { data.splice(i, 1); render(); };
    }

    // RENDER: tanya length(), pakai ulang baris yang sudah ada, lalu update.
    function render() {
      while (daftar.children.length < data.length) {
        var li = createItem();
        daftar.appendChild(li);
        pool.push(li);
      }
      while (daftar.children.length > data.length) {
        daftar.removeChild(daftar.lastChild);
        pool.pop();
      }
      for (var i = 0; i < data.length; i++) {
        updateItem(i, daftar.children[i], data[i]);
      }
      var selesai = data.filter(function (t) { return t.done; }).length;
      document.getElementById('foot').textContent =
        data.length + ' todo · ' + selesai + ' selesai · ' + pool.length + ' baris dibuat';
    }

    document.getElementById('tambah').onclick = function () {
      var j = document.getElementById('judul').value.trim();
      if (!j) { j = 'Tugas baru'; }
      data.push({ title: j, cat: 'Umum', pri: 'sedang', done: false });
      document.getElementById('judul').value = '';
      render();
    };

    daftar.addEventListener('change', function (e) {
      if (e.target.type !== 'checkbox') { return; }
      var i = Array.prototype.indexOf.call(daftar.children, e.target.parentNode);
      data[i].done = e.target.checked;
      render();
    });

    render();
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['struct Todo', 'Representasi satu baris pekerjaan: ID, judul, catatan, kategori, prioritas, status selesai, dan dua waktu.'],
        ['struct TodoInput', 'Kiriman form ke service yang sengaja tidak memuat ID dan waktu — keduanya ditentukan oleh database.'],
        ['RFC3339', 'Format waktu teks standar seperti <code>2026-10-18T09:30:00Z</code>; dipakai sebagai format simpan di SQLite dan MySQL supaya isi kedua database identik.'],
        ['slice data', 'Field <code>a.data []model.Todo</code> — satu-satunya sumber yang dibaca <code>widget.List</code> saat menggambar.'],
        ['Length / CreateItem / UpdateItem', 'Tiga callback <code>widget.NewList</code>: melaporkan panjang, membuat kerangka baris, dan mengisi baris ke-i.'],
        ['Daur ulang baris (recycle)', 'Fyne memakai ulang objek baris yang tidak terlihat untuk indeks lain; karena itu UpdateItem harus menimpa seluruh isi baris.'],
        ['rowWidgets', 'Struct kecil berisi widget satu baris, disimpan pada <code>map[fyne.CanvasObject]*rowWidgets</code> agar pengambilan widget bebas tebak-tebakan.'],
        ['Refresh()', 'Perintah menggambar ulang satu widget atau daftar setelah isinya berubah; tidak menambah data, hanya memaksa ulang tampilan.']
      ]
    }
  ],
  recap: [
    '<b><code>model.Todo</code></b> untuk data tersimpan dan <b><code>model.TodoInput</code></b> untuk kiriman form; ID serta waktu sengaja tidak ada pada input pengguna.',
    'Waktu disimpan sebagai <b>teks RFC3339</b> agar formatnya sama tidak peduli driver database yang aktif — repository tinggal menukar teks itu dengan <code>time.Time</code>.',
    'UI hanya membaca <b>slice <code>a.data</code></b>; database baru disentuh oleh <code>refresh()</code> di goroutine lain dan hasilnya masuk lewat <code>fyne.Do</code>.',
    '<code>widget.List</code> = <b>Length</b> + <b>CreateItem</b> (kerangka) + <b>UpdateItem</b> (isi baris ke-i); Fyne <b>mendaur ulang</b> baris sehingga update harus menimpa seluruh isi.',
    'Widget per baris disimpan pada <b><code>map[CanvasObject]*rowWidgets</code></b>, <b><code>OnChanged</code> dicabut sebelum <code>SetChecked</code></b>, dan closure tombol menangkap salinan <code>t := a.data[id]</code>.',
    'Pembaruan tampilan hanya dua langkah: <b><code>a.data = list</code></b> lalu <b><code>a.list.Refresh()</code></b>, plus menampilkan <code>emptyBox</code> ketika daftar kosong.'
  ]
});
