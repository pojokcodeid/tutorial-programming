/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 8: Arsitektur & Testing
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-testing',
  title: 'Arsitektur Berlapis & Tiga Jenis Testing',
  chapter: 'Arsitektur & Testing',
  duration: '14 menit',
  intro: [
    'Arsitektur berlapis yang kamu lihat di pelajaran 1 bukan hiasan: ia yang membuat aplikasi GUI ini <b>bisa diuji otomatis</b>. Karena UI, logika, dan database berada di package terpisah, kita bisa menguji masing-masing lapisan dengan cara yang paling murah — mulai dari <b>unit test</b> milidetik di RAM, <b>integration test</b> ke file SQLite, sampai <b>UI test</b> yang merakit jendela tanpa membukanya.',
    'Pelajaran ini merekap tanggung jawab tiap package, lalu membongkar tiga jenis test pada proyek contoh beserta satu kisah bug nyata yang hanya diketahui berkat test.'
  ],
  objectives: [
    'Memetakan tanggung jawab tiap package dan aturan dependensi satu arah',
    'Menulis unit test table-driven dengan sub-test dan error sentinel',
    'Menguji driver SQLite lewat database :memory: dan file sementara t.TempDir()',
    'Menguji widget Fyne dengan package fyne.io/fyne/v2/test tanpa jendela nyata',
    'Menjalankan rangkaian perintah kualitas: gofmt, go vet, go test, dan -race'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tanggung jawab tiap package</h3><p>Arsitektur yang baik dimulai dari pertanyaan sederhana: <b>apa yang menjadi tanggung jawab package ini, dan apa yang tidak?</b> Bila satu package menjawab dua pertanyaan sekaligus, ia akan sulit diuji dan sulit diubah. Berikut pembagian kerja pada proyek contoh.</p>'
    },
    {
      type: 'example',
      title: 'Peta tanggung jawab package proyek contoh',
      lang: 'text',
      output: false,
      code: `Package                   Tanggung jawab                  Boleh tahu soal
────────────────────────  ──────────────────────────────  ─────────────────────
internal/model            struct Todo, TodoInput,          tidak ada hal lain
                          aturan validasi & konstanta
internal/repository       kontrak CRUD: interface         model saja
                          Repository, Filter, Query, Stats
internal/repository/*     driver nyata yang memenuhi      model + kontrak
                          kontrak: sqlite, mysql, memory
internal/service          logika bisnis, validasi ulang,  model + kontrak
                          orkestrasi repository
internal/storage          SATU tempat pemilihan driver    semua driver
                          dari TODO_DB_DRIVER
internal/ui               widget, jendela, dialog, tema   model + service
                          (tidak pernah menyentuh SQL)
cmd/todo, cmd/seed        merangkai semuanya menjadi      semuanya (titik
                          executable yang bisa dijalankan  masuk saja boleh)`,
      explain: [
        'Baris <b>Boleh tahu soal</b> adalah batasnya: <code>internal/ui</code> hanya boleh mengenal <code>service</code>, tidak boleh tahu driver mana yang dipakai.',
        'Seandainya <code>model</code> mengimpor <code>ui</code>, arsitektur ini langsung rusak — dan <code>go vet</code> tidak akan menegurnya, hanya kebiasaanmu yang bisa.',
        'Dua executable berbagi seluruh package internal; <code>cmd/seed</code> hanya memanggil <code>service</code> tanpa membuat satu widget pun.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aturan dependensi satu arah</h3><p>Setiap panah pada diagram hanya boleh berjalan <b>satu arah ke bawah</b>: <b>UI → service → repository → driver database</b>. Kebalikannya dilarang. Service tidak boleh mengimpor <code>fyne.io/fyne/v2</code>, repository tidak boleh mengimpor <code>internal/ui</code>, dan model tidak boleh mengimpor apa pun selain standard library.</p><p>Aturan inilah yang membuat tiga jenis test di bawah mungkin: begitu dependensi mengalir satu arah, setiap lapisan bisa diuji dengan menyetorkan lapisan di bawahnya — atau dengan palsu yang ringan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Diagram tiga jenis test berjenjang: unit test di atas, integration test di tengah, UI test di bawah, masing-masing disertai apa yang diuji dan alatnya">
        <rect x="170" y="10" width="420" height="70" rx="8" class="u-hd"/>
        <text x="380" y="34" class="u-title" text-anchor="middle">Unit test — logika bisnis</text>
        <text x="380" y="56" class="u-lbl" text-anchor="middle">diuji: validasi, aturan edit, filter, statistik</text>
        <text x="380" y="74" class="u-lbl" text-anchor="middle">alat: package testing + repository memory (RAM)</text>
        <line x1="380" y1="84" x2="380" y2="112" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="170" y="116" width="420" height="70" rx="8" class="u-box"/>
        <text x="380" y="140" class="u-title" text-anchor="middle">Integration test — driver database</text>
        <text x="380" y="162" class="u-lbl" text-anchor="middle">diuji: query SQL, skema, persistensi file</text>
        <text x="380" y="180" class="u-lbl" text-anchor="middle">alat: sqlite :memory: dan file di t.TempDir()</text>
        <line x1="380" y1="190" x2="380" y2="218" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="170" y="222" width="420" height="70" rx="8" class="u-box"/>
        <text x="380" y="246" class="u-title" text-anchor="middle">UI test — widget &amp; alur jendela</text>
        <text x="380" y="268" class="u-lbl" text-anchor="middle">diuji: widget terbentuk, data terpasang, aksi tombol</text>
        <text x="380" y="286" class="u-lbl" text-anchor="middle">alat: package fyne.io/fyne/v2/test (tanpa jendela nyata)</text>
        <text x="605" y="48" class="u-lbl" text-anchor="start">paling sering · ± milidetik</text>
        <text x="605" y="156" class="u-lbl" text-anchor="start">tiap perubahan · ratusan ms</text>
        <text x="605" y="262" class="u-lbl" text-anchor="start">sebelum rilis · paling berat</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Tiga jenis test proyek contoh: makin ke bawah makin mendekati kenyataan, makin lambat jalannya; ketiganya tetap berjalan tanpa membuka satu jendela pun</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Jenis 1 — Unit test logika bisnis</h3><p>Lapisan pertama diuji adalah <code>internal/service</code> beserta <code>internal/model</code>: tempat seluruh aturan berada. Test-nya memakai <b>repository in-memory</b> (<code>memory.New()</code>) sehingga berjalan di RAM — cepat, tanpa file, dan hasilnya selalu sama. Pola yang dipakai adalah <b>table-driven test</b>: daftar kasus dalam satu slice, diulang dengan loop, tiap kasus menjadi sub-test bernama.</p>'
    },
    {
      type: 'example',
      title: 'TestAddInputInvalid — satu test, lima aturan validasi',
      lang: 'go',
      output: false,
      code: `// newService membuat service di atas repository in-memory (tanpa file/DB).
func newService() *service.Service { return service.New(memory.New()) }

// TestAddInputInvalid memastikan setiap aturan validasi tercapai.
// Pola table-driven: satu daftar kasus, satu loop, sub-test per kasus.
func TestAddInputInvalid(t *testing.T) {
	kasus := []struct {
		name string
		in   model.TodoInput
		want error
	}{
		{
			name: "judul kosong",
			in:   model.TodoInput{Title: "   "},
			want: model.ErrTitleRequired,
		},
		{
			name: "judul terlalu panjang",
			in:   model.TodoInput{Title: strings.Repeat("a", model.MaxTitle+1)},
			want: model.ErrTitleTooLong,
		},
		{
			name: "catatan terlalu panjang",
			in:   model.TodoInput{Title: "Rapi", Note: strings.Repeat("n", model.MaxNote+1)},
			want: model.ErrNoteTooLong,
		},
		{
			name: "kategori terlalu panjang",
			in:   model.TodoInput{Title: "Rapi", Category: strings.Repeat("k", model.MaxCategory+1)},
			want: model.ErrCategoryLong,
		},
		{
			name: "prioritas tidak dikenal",
			in:   model.TodoInput{Title: "Rapi", Priority: "mendesak"},
			want: model.ErrPriorityUnknown,
		},
	}

	for _, k := range kasus {
		t.Run(k.name, func(t *testing.T) {
			_, err := newService().Add(context.Background(), k.in)
			if !errors.Is(err, k.want) {
				t.Fatalf("Add() error = %v, diharapkan %v", err, k.want)
			}
		})
	}
}`,
      explain: [
        'Slice <code>kasus</code> berisi struct anonim berisi tiga field: nama, input, dan error yang diharapkan — menambah aturan validasi baru cukup menambah satu blok.',
        '<code>t.Run(k.name, ...)</code> mengubah tiap kasus menjadi <b>sub-test</b> bernama, sehingga kegagalan langsung menunjuk kasus mana: <code>TestAddInputInvalid/prioritas_tidak_dikenal</code>.',
        '<code>errors.Is</code> dipakai karena error boleh sudah dibungkus <code>fmt.Errorf("%w", ...)</code> di lapisan mana pun — yang diperiksa adalah identitas errornya, bukan teks pesannya.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji aturan bisnis: edit tidak boleh mereset status',
      lang: 'go',
      output: false,
      code: `func TestEditMempertahankanStatus(t *testing.T) {
	ctx := context.Background()
	svc := newService()

	created, _ := svc.Add(ctx, model.TodoInput{Title: "Selesai dulu", Priority: model.PriorityHigh})
	if _, err := svc.Toggle(ctx, created.ID); err != nil {
		t.Fatalf("Toggle() error = %v", err)
	}

	edited, err := svc.Edit(ctx, created.ID, model.TodoInput{Title: "Judul baru", Priority: model.PriorityLow})
	if err != nil {
		t.Fatalf("Edit() error = %v", err)
	}
	if !edited.Done {
		t.Error("Edit tidak boleh mereset status selesai")
	}
	if edited.Title != "Judul baru" || edited.Priority != model.PriorityLow {
		t.Errorf("hasil edit = %+v", edited)
	}
	if !edited.CreatedAt.Equal(created.CreatedAt) {
		t.Error("waktu pembuatan tidak boleh berubah saat edit")
	}
}`,
      explain: [
        'Test ini mengunci <b>aturan bisnis</b>, bukan implementasi: mengubah judul sebuah todo yang sudah selesai tidak boleh mengembalikannya ke status "belum selesai".',
        'Perbaikannya ada di <code>service.Edit</code>: ia mengambil data lama dengan <code>repo.Get</code>, menimpa hanya empat field isi, lalu memanggil <code>repo.Update</code> — status dan waktu sengaja tidak disentuh.',
        'Ketiga pemeriksaan melindungi tiga jenis regresi: status ter-reset, isi tidak tersimpan, dan waktu pembuatan ikut berubah (yang akan mengacaukan urutan "terbaru di atas").'
      ]
    },
    {
      type: 'text',
      html: '<h3>Jenis 2 — Integration test ke database sungguhan</h3><p>Unit test membuktikan logikanya; <b>integration test</b> membuktikan driver SQLite benar-benar bekerja: query-nya valid, skema tercipta, dan data bertahan di file. Proyek memakai dua bentuk: database <code>:memory:</code> untuk siklus CRUD cepat, serta file di <code>t.TempDir()</code> untuk membuktikan persistensi.</p>'
    },
    {
      type: 'example',
      title: 'bukaMemory + TestPersistensiFile',
      lang: 'go',
      output: false,
      code: `// bukaMemory membuat repository SQLite di RAM — skema tetap dibuat oleh Open.
func bukaMemory(t *testing.T) repository.Repository {
	t.Helper()
	repo, err := sqlite.Open(":memory:")
	if err != nil {
		t.Fatalf("buka sqlite :memory:: %v", err)
	}
	t.Cleanup(func() { _ = repo.Close() })
	return repo
}

// TestPersistensiFile membuktikan data benar-benar tertulis di file:
// tutup aplikasi (tutup koneksi), buka lagi — datanya masih ada.
func TestPersistensiFile(t *testing.T) {
	ctx := context.Background()
	dsn := filepath.Join(t.TempDir(), "todo.db")

	pertama, err := sqlite.Open(dsn)
	if err != nil {
		t.Fatalf("buka sqlite file: %v", err)
	}
	if _, err := pertama.Add(ctx, model.Todo{
		Title: "Harus bertahan", Category: "Pribadi", Priority: model.PriorityMedium,
	}); err != nil {
		t.Fatalf("Add() error = %v", err)
	}
	if err := pertama.Close(); err != nil {
		t.Fatalf("Close() error = %v", err)
	}
	kedua, err := sqlite.Open(dsn)
	if err != nil {
		t.Fatalf("buka ulang sqlite file: %v", err)
	}
	defer kedua.Close()
	list, err := kedua.List(ctx, repository.Query{})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(list) != 1 || list[0].Title != "Harus bertahan" {
		t.Errorf("data setelah buka ulang = %+v, diharapkan 1 todo", list)
	}
}`,
      explain: [
        '<code>":memory:"</code> membuat SQLite murni di RAM, tetapi <b>skema tetap dibuat</b> — fungsi <code>sqlite.Open</code> selalu mengeksekusi perintah CREATE TABLE setelah koneksi siap, apa pun DSN-nya. Karena itu test bisa langsung menulis data.',
        '<code>t.TempDir()</code> memberi folder unik per test yang otomatis dihapus Go setelah test selesai — file <code>todo.db</code> tidak pernah menyisa dan tidak pernah bentrok antar test.',
        '<code>t.Helper()</code> membuat laporan kegagalan menunjuk baris pemanggil, bukan baris di dalam helper. <code>t.Cleanup</code> menutup koneksi walau test gagal di tengah jalan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Jenis 3 — UI test tanpa jendela nyata</h3><p>Package <code>fyne.io/fyne/v2/test</code> menyediakan <code>test.NewApp()</code>: aplikasi Fyne palsu dengan driver tes. Seluruh widget tetap dibuat sungguhan, tetapi tidak ada jendela yang terbuka di layar. Kuncinya: pada driver tes, <code>fyne.Do</code> <b>langsung dieksekusi</b> di tempat (lihat komentar pada helper <code>siapkan</code>), sehingga <code>a.muat(q)</code> selesai dalam satu napas — tanpa sleep, tanpa polling, tanpa menunggu goroutine.</p>'
    },
    {
      type: 'example',
      title: 'Potongan internal/ui/ui_test.go',
      lang: 'go',
      output: false,
      code: `// siapkan membangun App di atas repository in-memory dengan data contoh.
// Pakai fyne.io/fyne/v2/test sehingga seluruh UI bisa diuji TANPA membuka
// jendela sungguhan — fyne.Do pada driver tes langsung dieksekusi.
func siapkan(t *testing.T, judul ...string) *App {
	t.Helper()
	app := test.NewApp()
	repo := memory.New()
	svc := service.New(repo)
	for _, j := range judul {
		if _, err := svc.Add(context.Background(), model.TodoInput{Title: j}); err != nil {
			t.Fatalf("menyiapkan data %q: %v", j, err)
		}
	}
	return newApp(app, svc)
}

func TestMuatDataDariRepository(t *testing.T) {
	a := siapkan(t, "Satu", "Dua", "Tiga")
	a.win.SetContent(a.buildUI())

	// muat() membaca repository lalu menerapkan hasilnya lewat fyne.Do —
	// pada driver tes, fyne.Do berjalan langsung sehingga hasilnya deterministik.
	a.muat(repository.Query{Filter: repository.FilterAll})

	if len(a.data) != 3 {
		t.Fatalf("data tersimpan = %d, diharapkan 3", len(a.data))
	}
	if a.list.Length() != 3 {
		t.Errorf("Length() list = %d, diharapkan 3", a.list.Length())
	}
}`,
      explain: [
        'Empat jenis pemeriksaan di test UI proyek ini: widget terbentuk saat <code>buildUI</code>, data terpasang setelah <code>muat</code>, baris menampilkan judul via <code>updateRow</code>, dan input kosong ditolak <b>sebelum</b> masuk database.',
        'Karena <code>fyne.Do</code> berjalan langsung pada driver tes, tidak ada satu pun baris <code>time.Sleep</code> — test UI secepat test biasa dan tidak pernah flaky.',
        'Test masih memakai <code>memory.New()</code>: yang diuji adalah perilaku widget dan alur UI, bukan kembali ke SQLite yang sudah diuji lapisan sebelumnya.'
      ]
    },
    {
      type: 'warn',
      title: 'Test tidak boleh menyentuh database contoh milik aplikasi',
      text: 'Integration test dan UI test yang menulis data <b>wajib memakai database terpisah</b>: file di <code>t.TempDir()</code> (dihapus otomatis oleh Go) atau SQLite <code>:memory:</code>. Jangan pernah menunjuk <code>todo.db</code> di folder kerja — test bisa menghapus data pengguna sungguhan, dan hasilnya menjadi tidak menentu karena tergantung isi database orang lain. Prinsipnya sama dengan unit test: <b>test harus aman dijalankan berkali-kali dengan hasil yang sama</b>.'
    },
    {
      type: 'text',
      html: '<h3>Kisah bug nyata: SetSelected yang memicu panic</h3><p>Saat membangun form tambah, satu baris kode membuat aplikasi crash di detik pertama. Pemicunya: <code>widget.Select.SetSelected</code> <b>langsung memanggil <code>OnChanged</code></b> begitu nilai dipasang — bukan hanya saat pengguna mengklik.</p><p>Akibatnya, saat <code>buildUI</code> memasang nilai awal filter, rantai <code>OnChanged</code> → <code>refresh()</code> → <code>terapkanList()</code> → <code>a.list.Refresh()</code> terpanggil <b>sebelum <code>a.list</code> dibuat</b>, dan aplikasi berhenti dengan panic nil pointer.</p><p>Perbaikannya dua langkah dan keduanya kini tercatat di kode: (1) buat widget paling penting — <code>a.list</code> — <b>lebih dulu</b> di awal <code>buildUI</code>; (2) pasang <code>OnChanged</code> <b>setelah</b> <code>SetSelected</code>, sehingga nilai awal tidak memicu callback.</p><p>Yang penting bukan triknya, melainkan urutan kejadiannya: bug ini <b>ketahuan oleh test</b> <code>TestBangunJendelaTanpaKesalahan</code> — tanpa satu orang pun perlu membuka jendela aplikasi.</p>'
    },
    {
      type: 'example',
      title: 'Rangkaian perintah kualitas sebelum commit',
      lang: 'bash',
      output: false,
      code: `# 1. format — file yang tercetak di sini wajib diperbaiki (harus kosong)
gofmt -l .
# 2. pemeriksaan statis Go (import tak terpakai, salah pakai API, dst.)
go vet ./...
# 3. seluruh test: unit + integration + UI
go test ./...
# 4. deteksi data race — lebih lambat, tetap wajib sebelum rilis
go test -race ./...
# 5. satu fungsi test saja, verbose      6. cakupan seluruh kode
go test ./internal/service/ -run TestAdd -v
go test ./... -cover`,
      explain: [
        '<code>gofmt -l .</code> tidak memperbaiki apa pun — ia hanya mendaftar; perbaiki dengan <code>gofmt -w &lt;file&gt;</code> atau <code>gofmt -w .</code>.',
        '<code>go test -race</code> mengompilasi kode dengan instrumen deteksi tabrakan goroutine; jalur yang membaca <code>a.data</code> dari dua thread akan ketahuan di sini, bukan di produksi.',
        'Jalankan keenam perintah berurutan dalam satu sesi; begitu salah satu merah, perbaiki dulu sebelum menulis kode baru.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan mengerjakan test saat menulis fitur baru',
      text: 'Mulai dari yang paling murah: tulis <b>unit test</b> dulu selama aturan bisnis masih bisa dipastikan di RAM, baru <b>integration test</b> bila query SQL-nya baru, dan <b>UI test</b> terakhir untuk alur yang melibatkan widget. Bila suatu saat harus memangkas test karena kehabisan waktu, potong dari jenis paling bawah — tiga lapis test ini punya biaya berbeda tetapi nilai yang berbeda pula.'
    },
    {
      type: 'live',
      title: 'Latihan: simulasi table-driven test',
      lang: 'html',
      hint: 'Klik salah satu kasus untuk menjalankan sub-testnya sendiri, atau tekan tombol untuk menjalankan seluruh tabel. Amati format pesan RUN/PASS/FAIL — persis seperti keluaran go test -v.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi TestAddInputInvalid</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #f4f6f8; }
    .card { background: #fff; border-radius: 10px; padding: 16px; max-width: 720px; }
    h3 { margin: 0 0 6px; color: #0e7490; font-family: ui-monospace, monospace; }
    .kasus { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
    .kasus button { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
    .kasus button.on { background: #0e7490; color: #fff; border-color: #0e7490; }
    #run { background: #0e7490; color: #fff; border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
    pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; font-size: 12.5px; line-height: 1.55; min-height: 90px; }
    .pass { color: #4ade80; } .fail { color: #f87171; } .hint { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h3>TestAddInputInvalid (simulasi)</h3>
    <div class="kasus" id="kasus"></div>
    <button id="run">Jalankan semua kasus</button>
    <pre id="out">Keluaran go test -v muncul di sini…</pre>
    <p class="hint">Klik satu kasus untuk menjalankan sub-testnya sendiri. Perintah asli: go test ./internal/service/ -run TestAddInputInvalid -v</p>
  </div>
  <script>
    var kasus = [
      { name: 'judul kosong', judul: '   ', note: '', kategori: '', prioritas: '' },
      { name: 'judul terlalu panjang', judul: new Array(122).join('a'), note: '', kategori: '', prioritas: '' },
      { name: 'catatan terlalu panjang', judul: 'Rapi', note: new Array(502).join('n'), kategori: '', prioritas: '' },
      { name: 'kategori terlalu panjang', judul: 'Rapi', note: '', kategori: new Array(42).join('k'), prioritas: '' },
      { name: 'prioritas tidak dikenal', judul: 'Rapi', note: '', kategori: '', prioritas: 'mendesak' },
      { name: 'semua valid', judul: '  Belajar Fyne  ', note: '', kategori: '', prioritas: '' }
    ];
    // meniru model.TodoInput.Validate — inilah logika yang diuji unit test
    function validate(k) {
      var t = k.judul.trim(), n = k.note.trim(), kat = k.kategori.trim(), p = k.prioritas.trim();
      if (!t) return 'model.ErrTitleRequired';
      if (t.length > 120) return 'model.ErrTitleTooLong';
      if (n.length > 500) return 'model.ErrNoteTooLong';
      if (kat.length > 40) return 'model.ErrCategoryLong';
      if (p && ['rendah', 'sedang', 'tinggi'].indexOf(p) < 0) return 'model.ErrPriorityUnknown';
      return null;
    }
    function jalankan(indeks) {
      var b = [];
      indeks.forEach(function (i) {
        var k = kasus[i], slug = k.name.split(' ').join('_'), err = validate(k);
        var harus = i < kasus.length - 1, lolos = harus ? err !== null : err === null; // kasus terakhir harus lolos
        b.push('=== RUN   TestAddInputInvalid/' + slug);
        b.push(lolos
          ? '<span class="pass">--- PASS: TestAddInputInvalid/' + slug + ' (0.00s)</span>'
          : '<span class="fail">--- FAIL: TestAddInputInvalid/' + slug + ' (0.00s)</span> error = ' + err + '   diharapkan = ' + (harus ? 'error' : 'nil, disimpan'));
      });
      b.push('ok  example.com/go-todo-app/internal/service   0.006s');
      document.getElementById('out').innerHTML = b.join('<br>');
    }
    var kotak = document.getElementById('kasus');
    kasus.forEach(function (k, i) {
      var el = document.createElement('button');
      el.textContent = k.name;
      el.onclick = function () {
        document.querySelectorAll('.kasus button').forEach(function (x, j) { x.classList.toggle('on', j === i); });
        jalankan([i]);
      };
      kotak.appendChild(el);
    });
    document.getElementById('run').onclick = function () {
      document.querySelectorAll('.kasus button').forEach(function (x) { x.classList.remove('on'); });
      jalankan(kasus.map(function (_, i) { return i; }));
    };
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Unit test', 'Test yang menguji satu unit kode secara terisolasi; pada proyek ini berupa logika service + model di atas repository in-memory.'],
        ['Integration test', 'Test yang menguji beberapa bagian bekerja sama sungguhan — di sini driver SQLite beserta query, skema, dan filenya.'],
        ['UI test', 'Test yang merakit widget dan alur jendela memakai package <code>fyne.io/fyne/v2/test</code>, tanpa membuka jendela di layar.'],
        ['Table-driven test', 'Pola menyimpan banyak kasus dalam satu slice struct lalu mengulangnya dengan loop sehingga menambah kasus hanya menambah baris.'],
        ['Sub-test', 'Test di dalam test lewat <code>t.Run(name, ...)</code>; punya nama, hasil, dan filter <code>-run</code> sendiri.'],
        ['Error sentinel', 'Error bernama tetap seperti <code>repository.ErrNotFound</code> yang diperiksa dengan <code>errors.Is</code> meski sudah dibungkus ulang.'],
        ['t.TempDir()', 'Folder sementara unik per test yang dibuat dan dihapus otomatis oleh Go — tempat yang tepat untuk file database test.'],
        ['t.Cleanup', 'Fungsi yang dijalankan Go setelah test selesai, apa pun hasilnya; dipakai menutup koneksi database.'],
        ['Data race', 'Dua goroutine mengakses memori yang sama tanpa sinkronisasi; dideteksi oleh <code>go test -race</code>, bukan oleh mata.']
      ]
    }
  ],
  recap: [
    'Arsitektur berlapis berarti tiap package punya <b>satu tanggung jawab</b>, dan dependensi hanya mengalir satu arah: UI → service → repository → driver.',
    'Ada <b>tiga jenis test</b>: unit test (logika di RAM), integration test (driver SQLite + file), dan UI test (widget lewat package test Fyne).',
    'Unit test memakai pola <b>table-driven</b> dengan <code>t.Run</code> dan <code>errors.Is</code>; integration test memakai <code>:memory:</code> serta <code>t.TempDir()</code> untuk membuktikan data bertahan setelah koneksi ditutup.',
    'UI test memakai <code>test.NewApp()</code>; karena <code>fyne.Do</code> berjalan langsung pada driver tes, hasilnya deterministik tanpa sleep.',
    'Kisah panic <code>SetSelected</code> membuktikan gunanya test: bug ketahuan tanpa membuka aplikasi, dan perbaikannya tercatat di <code>buildUI</code>.',
    'Rangkaian kualitas wajib: <code>gofmt -l .</code>, <code>go vet ./...</code>, <code>go test ./...</code>, dan <code>go test -race ./...</code>.'
  ]
});
