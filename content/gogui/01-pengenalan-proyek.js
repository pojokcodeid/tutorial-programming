/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 1: Pengenalan Proyek & Fyne
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-pengenalan',
  title: 'Pengenalan Proyek: Todo App Desktop dengan Fyne',
  chapter: 'Pengenalan',
  duration: '14 menit',
  intro: [
    'Selama materi Go kamu sudah mempelajari bahasa, struct, interface, dan bahkan REST API. Kali ini kita <b>memanfaatkannya untuk sesuatu yang bisa dilihat mata</b>: sebuah <b>aplikasi desktop</b>. Kita akan membangun <b>Todo App</b> — aplikasi daftar pekerjaan — memakai <b>Fyne</b> (https://fyne.io/) sebagai toolkit GUI dan database yang <b>bebas kamu pilih</b>.',
    'Pelajaran ini menyiapkan fondasinya: apa saja yang akan dibuat, mengapa arsitektur proyeknya dibelah menjadi lapisan-lapisan, folder mana yang berisi apa, dan toolchain apa yang wajib terpasang sebelum baris kode pertama ditulis.'
  ],
  objectives: [
    'Membedakan aplikasi desktop dan web, serta memilih toolkit GUI Go yang tepat',
    'Mengetahui daftar fitur Todo App dan pelajaran tempat fitur itu dibangun',
    'Memahami arsitektur berlapis: UI → service → repository → database',
    'Menyiapkan toolchain: Go, compiler C untuk CGO, dan dependensi Fyne',
    'Menyusun struktur folder proyek Go yang rapi dan mudah dikembangkan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang akan kita bangun?</h3><p><b>Todo App</b> adalah aplikasi catatan pekerjaan: kamu menulis tugas, mencentang yang selesai, menghapus yang tidak perlu, lalu mencari tugas lewat kata kunci. Sederhana, tetapi di dalamnya ada hampir semua yang dibutuhkan aplikasi nyata: <b>antarmuka, validasi input, akses database, penanganan error, testing, dan packaging</b>.</p><p>Data disimpan di database pilihanmu — tutorial ini memakai <b>SQLite</b> sebagai default karena berjalan tanpa server, namun seluruh kode dirancang agar bisa berpindah ke <b>MySQL</b> atau <b>PostgreSQL</b> hanya dengan mengganti satu blok konfigurasi.</p>'
    },
    {
      type: 'example',
      title: 'Daftar fitur proyek dan peta materinya',
      lang: 'text',
      output: false,
      code: `Antarmuka
  Jendela utama         header + statistik, form tambah, toolbar cari & filter
  Daftar todo           widget.List: centang selesai, tombol ubah & hapus
  Dialog                form ubah todo, konfirmasi hapus, pesan error
  Tema kustom           warna aksen aplikasi mengganti warna primer bawaan

Logika & data
  Validasi input        judul wajib, panjang maksimal, prioritas valid
  CRUD                  tambah, baca, ubah, hapus, toggle "sudah selesai"
  Filter & pencarian    semua / belum selesai / selesai + pencarian teks (LIKE)
  Statistik             hitungan aktif · selesai · total

Pilihan database (bebas)
  SQLite (default)      satu file lokal, tanpa server, driver murni Go
  MySQL / MariaDB       server terpisah — tinggal ganti TODO_DB_DRIVER
  In-memory             data di RAM untuk unit test & mode demo

Pelajaran tempat fiturnya dibangun
  2 jendela & widget   → 3 daftar & list   → 4 form & validasi
  5 database           → 6 CRUD & dialog   → 7 filter & statistik
  8 arsitektur & test  → 9 tugas latar     → 10 build & rilis`,
      explain: [
        'Setiap baris pada blok <b>Pelajaran</b> menunjuk ke satu pelajaran berikutnya — tidak ada fitur yang tiba-tiba muncul tanpa dijelaskan lebih dulu.',
        'Pemilihan database diperlakukan sebagai <b>fitur</b>, bukan keputusan permanen: itulah gunanya lapisan repository di pelajaran 5.',
        'Bagian "Antarmuka" dibangun pelan-pelan: jendela dulu (pelajaran 2), lalu daftar (3), baru form (4).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kenapa desktop, dan kenapa Fyne?</h3><p>Aplikasi web berjalan di browser dan bergantung pada koneksi serta aturan sandbox browser. Aplikasi <b>desktop</b> berjalan sebagai program lokal: jendela miliknya sendiri, akses file dan database lokal secara langsung, serta bisa dipasang di komputer pengguna tanpa server.</p><p>Go sendiri tidak memiliki toolkit GUI bawaan. Beberapa pilihan populer:</p>'
    },
    {
      type: 'example',
      title: 'Perbandingan singkat toolkit GUI Go',
      lang: 'text',
      output: false,
      code: `Fyne      cross-platform (Win/macOS/Linux), API modern, tema & widget siap pakai
          butuh CGO + OpenGL; tampilan mengikuti tema Fyne, bukan OS asli
Gio       rendah-level, sangat cepat, gaya "immediate mode"
          cocok untuk UI khusus; widget sedikit, kurva belajar curam
Wails     HTML/CSS/JS di depan, Go di belakang (mirip Electron ringan)
          bagus bila kamu betah di web; dua dunia teknologi sekaligus
andlabs   widget asli tiap OS (set.go), tampilan native
          proyek kurang aktif, dokumentasi terbatas

Pilihan tutorial ini: FYNE — API-nya paling mudah dibaca untuk pemula Go,
  dokumentasi dan contohnya lengkap, dan satu kode untuk tiga sistem operasi.`,
      explain: [
        '<b>Fyne</b> memakai OpenGL untuk menggambar, sehingga tampilannya konsisten di semua OS — bukan widget asli Windows/Mac.',
        'Konsekuensinya ada di <b>CGO</b>: build aplikasi membutuhkan compiler C (Xcode Command Line Tools di macOS, gcc di Linux, MinGW di Windows).',
        'Karena satu basis kode untuk tiga OS, kamu cukup belajar satu API untuk bisa merilis di Windows, macOS, dan Linux.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Arsitektur: memisahkan UI, logika, dan data</h3><p>Kegagalan klasik aplikasi GUI adalah "semua ada di satu file": tombol langsung menulis SQL, validasi menempel di tombol, dan ketika database diganti, seluruh jendela ikut ditulis ulang. Proyek ini menghindarinya dengan <b>memisah tanggung jawab menjadi lapisan</b>, persis seperti materi REST API — hanya kata "HTTP" diganti "widget".</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 400" width="760" role="img" aria-label="Diagram arsitektur berlapis: UI Fyne memanggil service, service memanggil interface repository, yang diwujudkan oleh sqlite, mysql, atau memory">
        <defs><marker id="mk-gui-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="180" y="18" width="400" height="56" rx="8" class="u-hd"/>
        <text x="380" y="42" class="u-title" text-anchor="middle">UI Fyne — internal/ui</text>
        <text x="380" y="62" class="u-lbl" text-anchor="middle">widget.List · Entry · Select · Dialog · fyne.Do</text>
        <line x1="380" y1="76" x2="380" y2="112" class="u-line" marker-end="url(#mk-gui-1)"/>
        <text x="395" y="98" class="u-lbl" text-anchor="start">panggil method service (dari goroutine)</text>
        <rect x="180" y="116" width="400" height="56" rx="8" class="u-box"/>
        <text x="380" y="140" class="u-title" text-anchor="middle">Service — internal/service</text>
        <text x="380" y="160" class="u-lbl" text-anchor="middle">validasi · aturan bisnis · orkestrasi repository</text>
        <line x1="380" y1="174" x2="380" y2="210" class="u-line" marker-end="url(#mk-gui-1)"/>
        <text x="395" y="196" class="u-lbl" text-anchor="start">interface Repository (repository.go)</text>
        <rect x="180" y="214" width="400" height="56" rx="8" class="u-box"/>
        <text x="380" y="238" class="u-title" text-anchor="middle">Repository — kontrak CRUD</text>
        <text x="380" y="258" class="u-lbl" text-anchor="middle">List · Get · Add · Update · ToggleDone · Delete · Stats</text>
        <line x1="196" y1="270" x2="120" y2="310" class="u-line" marker-end="url(#mk-gui-1)"/>
        <line x1="380" y1="270" x2="380" y2="310" class="u-line" marker-end="url(#mk-gui-1)"/>
        <line x1="564" y1="270" x2="640" y2="310" class="u-line" marker-end="url(#mk-gui-1)"/>
        <rect x="40" y="314" width="170" height="52" rx="8" class="u-box"/>
        <text x="125" y="336" class="u-title" text-anchor="middle">sqlite (default)</text>
        <text x="125" y="356" class="u-lbl" text-anchor="middle">file todo.db · murni Go</text>
        <rect x="295" y="314" width="170" height="52" rx="8" class="u-box"/>
        <text x="380" y="336" class="u-title" text-anchor="middle">mysql / mariadb</text>
        <text x="380" y="356" class="u-lbl" text-anchor="middle">server · ganti via env</text>
        <rect x="545" y="314" width="170" height="52" rx="8" class="u-box"/>
        <text x="630" y="336" class="u-title" text-anchor="middle">memory</text>
        <text x="630" y="356" class="u-lbl" text-anchor="middle">RAM · untuk unit test</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Arsitektur Todo App: UI bicara dengan service, service bicara dengan interface repository, dan interface itu diwujudkan oleh driver database apa pun yang kamu pilih</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Aturan mainnya sederhana, tetapi wajib dipegang sejak baris pertama:</p><ul><li><b>UI tidak menulis SQL.</b> Widget hanya mengumpulkan input dan menampilkan hasil — urusan database diserahkan ke repository.</li><li><b>Service tidak tahu soal widget.</b> Ia menerima data mentah, memvalidasi, lalu memanggil repository. Karena itu service bisa diuji tanpa jendela.</li><li><b>Repository tidak tahu soal aturan bisnis.</b> Ia hanya mengeksekusi query untuk satu driver database.</li><li><b>Interface di tengah adalah jaminan bebas database.</b> Selama tiga implementasi memenuhi kontrak yang sama, aplikasi tidak peduli database mana yang aktif.</li></ul>'
    },
    {
      type: 'example',
      title: 'Struktur folder proyek',
      lang: 'text',
      output: false,
      code: `go-todo-app/
├── cmd/
│   ├── todo/main.go          # titik masuk: pilih DB → tema → jendela → ShowAndRun
│   └── seed/main.go          # menanam 5 todo contoh (aman dijalankan berulang)
├── internal/
│   ├── model/todo.go         # struct Todo, TodoInput + aturan validasi
│   ├── repository/
│   │   ├── repository.go     # interface Repository, Filter, Query, Stats
│   │   ├── sqlite/sqlite.go  # implementasi SQLite (modernc.org/sqlite)
│   │   ├── mysql/mysql.go    # implementasi MySQL (go-sql-driver)
│   │   └── memory/memory.go  # implementasi RAM untuk test & demo
│   ├── service/
│   │   ├── todo.go           # logika bisnis (tambah, ubah, toggle, hapus)
│   │   └── todo_test.go      # unit test table-driven + repository palsu
│   ├── storage/storage.go    # pemilihan driver dari environment variable
│   └── ui/
│       ├── app.go            # state jendela, buildUI, refresh, addTodo
│       ├── list.go           # createRow & updateRow untuk widget.List
│       ├── dialogs.go        # dialog ubah dan konfirmasi hapus
│       ├── theme.go          # AccentTheme (mengganti warna primer)
│       └── ui_test.go        # uji UI tanpa membuka jendela (package test Fyne)
├── migrations/
│   ├── sqlite.sql            # salinan skema SQLite (dijalankan otomatis)
│   └── mysql.sql             # salinan skema MySQL
├── go.mod / go.sum
├── .gitignore                # abaikan binary & file *.db
└── README.md`,
      explain: [
        'Folder <code>internal/</code> bersifat privat: package di luar module ini tidak bisa mengimpornya, sehingga detail implementasi tetap tersembunyi.',
        '<code>cmd/todo</code> dan <code>cmd/seed</code> adalah dua executable berbeda dari satu codebase — pola yang sama dipakai proyek Go REST API.',
        'File <code>migrations/*.sql</code> disimpan sebagai riwayat, walau skema sebenarnya dibuat otomatis saat aplikasi pertama kali dibuka.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 1 — Siapkan toolchain</h3><p>Tiga hal yang harus siap sebelum melangkah: <b>Go</b>, <b>compiler C</b> (untuk CGO yang dipakai Fyne), dan <b>dependensi proyek</b>. Cek dulu lingkunganmu:</p>'
    },
    {
      type: 'example',
      title: 'Cek lingkungan & membuat proyek',
      lang: 'bash',
      output: false,
      code: `# 1. Pastikan Go terpasang (butuh Go 1.21 atau lebih baru)
go version

# 2. Pastikan compiler C tersedia (CGO wajib untuk Fyne)
#    macOS : xcode-select --install        (sudah pernah? abaikan)
#    Linux : sudo apt install gcc libc6-dev pkg-config libgl1-mesa-dev
#    Windows: pasang MinGW-w64 (TDM-GCC atau MSYS2)

# 3. Buat folder proyek dan init modul
mkdir go-todo-app && cd go-todo-app
go mod init example.com/go-todo-app

# 4. Ambil dependensi (Fyne + driver database)
go get fyne.io/fyne/v2@latest
go get modernc.org/sqlite github.com/go-sql-driver/mysql

# 5. Pastikan CGO aktif (nilai default biasanya sudah 1)
go env CGO_ENABLED        # diharapkan: 1`,
      explain: [
        '<code>go mod init example.com/go-todo-app</code> membuat <code>go.mod</code> — nama module sebaiknya mengikuti alamat repo bila nanti dipublikasikan.',
        'Perintah <code>go get</code> menulis dependensi ke <code>go.mod</code> dan mengunci versinya persis di <code>go.sum</code> — build di komputer lain akan memakai versi yang sama.',
        '<code>CGO_ENABLED=1</code> berarti Go boleh memanggil compiler C. Fyne butuh ini untuk membaca OpenGL; SQLite modernc justru <b>tidak</b> membutuhkannya.'
      ]
    },
    {
      type: 'warn',
      title: 'Dua hal yang paling sering membuat build Fyne gagal',
      text: '<b>1. Compiler C tidak ada.</b> Gejalanya pesan seperti <code>cgo: C compiler "gcc" not found</code> — perbaiki dengan memasang toolchain sesuai sistem operasimu (lihat langkah 2 di atas). <b>2. CGO dinonaktifkan.</b> Jika <code>go env CGO_ENABLED</code> menampilkan <code>0</code>, jalankan <code>CGO_ENABLED=1 go run ./cmd/todo</code>. Driver database justru kebalikannya: SQLite modernc bisa build tanpa CGO, sehingga pengujian <code>go test ./...</code> tetap ringan.'
    },
    {
      type: 'example',
      title: 'Isi go.mod setelah dependensi terpasang',
      lang: 'go',
      output: false,
      code: `module example.com/go-todo-app

go 1.26.0

require (
	github.com/go-sql-driver/mysql v1.10.1
	fyne.io/fyne/v2 v2.8.2
	modernc.org/sqlite v1.60.1
)`,
      explain: [
        'Tiga baris <code>require</code> itulah seluruh dependensi luar proyek: satu toolkit GUI dan dua driver database.',
        'Versi Fyne <b>v2.8.2</b> yang dipakai tutorial ini sudah memiliki <code>fyne.Do</code> — fungsi penting untuk pembaruan UI dari goroutine yang dibahas di pelajaran 9.',
        'Baris <code>go 1.26.0</code> menetapkan versi minimum bahasa; Go versi lebih lama akan menolak build dan menyarankan peningkatan.'
      ]
    },
    {
      type: 'tip',
      title: 'Belajar sambil membuka code asli',
      text: 'Seluruh kode proyek ini tersedia di folder <code>examples/go-todo-app/</code> pada repository tutorial. Buka file yang sedang dibahas di editor samping materi — pelajaran ini berjalan berurutan mengikuti struktur folder tersebut. Jika ingin memulai dari nol, buat folder kosong dan ketik ulang tiap potongan; mengetik ulang adalah cara tercepat menghafal pola API Fyne.'
    },
    {
      type: 'live',
      title: 'Latihan: telusuri struktur proyek',
      lang: 'html',
      hint: 'Klik setiap nama folder/berkas di kiri untuk melihat tugasnya, lalu tulis catatanmu sendiri pada kolom di bawah untuk berkas yang masih terasa asing.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Telusuri Struktur Proyek Go Todo</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 18px; background: #f4f6f8; }
    .wrap { display: flex; gap: 14px; }
    .tree { background: #fff; border-radius: 10px; padding: 10px; min-width: 250px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .node { padding: 5px 8px; border-radius: 6px; cursor: pointer; font-family: ui-monospace, monospace; font-size: 13px; }
    .node:hover { background: #e6f3f7; }
    .node.on { background: #0e7490; color: #fff; }
    .panel { background: #fff; border-radius: 10px; padding: 16px; flex: 1; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    h3 { margin: 0 0 8px; color: #0e7490; font-family: ui-monospace, monospace; font-size: 16px; }
    p { margin: 0 0 12px; line-height: 1.6; }
    textarea { width: 100%; box-sizing: border-box; min-height: 70px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; font: 13px/1.5 system-ui, sans-serif; }
    .hint { color: #94a3b8; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="tree" id="tree"></div>
    <div class="panel">
      <h3 id="nama">go-todo-app/</h3>
      <p id="jelas">Klik salah satu berkas di kiri untuk melihat tugasnya.</p>
      <textarea id="catatan" placeholder="Catatanmu untuk berkas ini..."></textarea>
      <div class="hint">Catatan tersimpan otomatis selama berkas yang sama dipilih.</div>
    </div>
  </div>
  <script>
    const info = {
      'go-todo-app/': 'Root proyek: go.mod, README, dan dua executable (cmd/todo, cmd/seed).',
      'cmd/todo/main.go': 'Titik masuk aplikasi: buka repository, pasang tema, rakit UI, lalu ShowAndRun().',
      'cmd/seed/main.go': 'Program bantu: menanam 5 todo contoh, berhenti bila database sudah berisi.',
      'internal/model/todo.go': 'Entitas Todo + TodoInput beserta aturan validasi (judul wajib, panjang, prioritas).',
      'internal/repository/repository.go': 'KONTRAK: interface Repository + Filter + Query + Stats. Satu-satunya yang diketahui service & UI.',
      'internal/repository/sqlite/sqlite.go': 'Implementasi SQLite: buka file, migrasi skema, query dengan tanda tanya (?).',
      'internal/repository/mysql/mysql.go': 'Implementasi MySQL: skema AUTO_INCREMENT, pool koneksi yang lebih besar.',
      'internal/repository/memory/memory.go': 'Implementasi RAM: dipakai unit test agar cepat dan tanpa file.',
      'internal/service/todo.go': 'Logika bisnis: memvalidasi input, aturan ID, lalu meneruskan ke repository.',
      'internal/service/todo_test.go': 'Unit test table-driven untuk seluruh aturan validasi dan statistik.',
      'internal/storage/storage.go': 'SATU tempat pemilihan database: switch driver dari TODO_DB_DRIVER.',
      'internal/ui/app.go': 'State jendela + buildUI() + refresh() yang membaca database di goroutine.',
      'internal/ui/list.go': 'createRow() membuat kerangka baris, updateRow() mengisinya dengan data terbaru.',
      'internal/ui/dialogs.go': 'Dialog ubah (NewForm) dan konfirmasi hapus (NewConfirm).',
      'internal/ui/theme.go': 'AccentTheme: menempel pada tema default lalu menimpa warna primer.',
      'migrations/sqlite.sql': 'Salinan skema SQL sebagai riwayat migrasi (dijalankan otomatis oleh kode).'
    };
    const daftar = Object.keys(info);
    const tree = document.getElementById('tree');
    const nama = document.getElementById('nama');
    const jelas = document.getElementById('jelas');
    const catatan = document.getElementById('catatan');
    let aktif = daftar[0];

    function tampilkan(n) {
      aktif = n;
      document.querySelectorAll('.node').forEach(el => el.classList.toggle('on', el.textContent === n));
      nama.textContent = n;
      jelas.textContent = info[n];
      catatan.value = localStorage.getItem('cat:' + n) || '';
    }
    daftar.forEach((n, i) => {
      const d = document.createElement('div');
      d.className = 'node' + (i === 0 ? ' on' : '');
      d.textContent = n;
      d.onclick = () => tampilkan(n);
      tree.appendChild(d);
    });
    catatan.oninput = () => localStorage.setItem('cat:' + aktif, catatan.value);
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Fyne', 'Toolkit GUI cross-platform untuk Go (https://fyne.io/): widget, layout, tema, dan dialog siap pakai untuk Windows, macOS, dan Linux.'],
        ['CGO', 'Fitur Go yang memungkinkan kode Go memanggil library C. Wajib aktif untuk Fyne, tetapi tidak untuk driver SQLite modernc.'],
        ['Widget', 'Komponen antarmuka siap pakai seperti Label, Entry (kolom isian), Button, Select (daftar pilihan), Check (kotak centang), dan List.'],
        ['Layout', 'Aturan penataan anak widget: VBox (vertikal), HBox (horizontal), Border (kiri-kanan-atas-bawah), Stack (tumpukan).'],
        ['interface Repository', 'Kontrak CRUD yang dipenuhi setiap driver database — jembatan agar aplikasi bebas mengganti database.'],
        ['internal/', 'Folder package privat di Go: hanya bisa diimpor dari dalam module yang sama, sehingga detail implementasi tidak bocor ke luar.'],
        ['module', 'Satuan pengelolaan kode dan dependensi Go yang dibuat oleh <code>go mod init</code>, tercatat pada file <code>go.mod</code>.']
      ]
    }
  ],
  recap: [
    'Proyek ini membangun <b>Todo App desktop</b> dengan Fyne: tambah, ubah, hapus, centang selesai, filter, pencarian, statistik, dan tema kustom.',
    'Arsitektur dibagi menjadi <b>UI → service → repository → database</b>; UI tidak pernah menyentuh SQL dan service tidak pernah menyentuh widget.',
    'Kebebasan database datang dari <b>interface repository</b>: SQLite (default), MySQL, atau in-memory semuanya memenuhi kontrak yang sama.',
    'Struktur folder memakai pola <code>cmd/</code> untuk executable dan <code>internal/</code> untuk kode privat yang tidak boleh diimpor luar.',
    'Prasyarat build Fyne: Go terbaru, <b>compiler C</b>, dan <code>CGO_ENABLED=1</code> — tiga hal ini penyebab kegagalan build paling umum.',
    'Seluruh kode contoh ada di <code>examples/go-todo-app/</code>; materi berikutnya dibaca berurutan mengikuti struktur folder tersebut.'
  ]
});
