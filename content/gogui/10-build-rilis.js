/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 10: Rilis
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-rilis',
  title: 'Build, Uji Kualitas & Rilis Aplikasi',
  chapter: 'Rilis',
  duration: '13 menit',
  intro: [
    'Fitur sudah lengkap, test hijau, tampilan rapi. Tinggal satu tahap yang sering diremehkan: <b>membangun dan mengemas</b> aplikasi sampai orang lain bisa menginstalnya tanpa memasang Go, tanpa membuka terminal, dan tanpa merusak data milikmu.',
    'Pelajaran ini menutup proyek dengan satu rangkaian checklist kualitas, perintah <b>build binary</b> dan <b>CLI Fyne</b> untuk mengemas aplikasi, penempatan <b>data pengguna</b> yang aman, sesi demo manual, serta daftar langkah lanjutan bila kamu ingin melanjutkan.'
  ],
  objectives: [
    'Menjalankan checklist kualitas berurutan sebelum membangun aplikasi',
    'Membangun binary mandiri dengan CGO dan memahami batas cross-compile',
    'Mengemas aplikasi memakai CLI fyne untuk macOS, Windows, dan Linux',
    'Menempatkan database di folder konfigurasi pengguna dan menjaganya dari repo',
    'Mendemonstrasikan aplikasi dengan data seed dan mencoba driver MySQL'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Checklist sebelum rilis</h3><p>Satu aturan sederhana: <b>jangan membangun binary yang belum lolos rangkaian ini</b>. Lima perintah berikut berjalan dalam hitungan detik dan menangkap kesalahan format, kesalahan statis, test gagal, serta data race sebelum menjadi masalah pengguna.</p>'
    },
    {
      type: 'example',
      title: 'Rangkaian kualitas berurutan',
      lang: 'bash',
      output: false,
      code: `# 1. format — daftar file yang belum sesuai gofmt harus KOSONG
gofmt -l .

# 2. pemeriksaan statis Go
go vet ./...

# 3. seluruh test, lalu ulangi dengan detektor data race
go test ./... && go test -race ./...

# 4. pastikan semua package berhasil dikompilasi
go build ./...`,
      explain: [
        'Perintah dijalankan <b>berurutan dalam satu sesi</b>: begitu <code>gofmt -l .</code> mencetak file atau <code>go vet</code> mengeluh, hentikan dan perbaiki sebelum lanjut ke langkah berikutnya.',
        '<code>go test ./... &amp;&amp; go test -race ./...</code> menggabungkan dua pemeriksaan dalam satu langkah — yang kedua berjalan hanya bila yang pertama hijau, sehingga kegagalan test cepat ketahuan.',
        '<code>go build ./...</code> tanpa opsi -o tidak menghasilkan file; ia hanya memastikan seluruh package (termasuk <code>cmd/todo</code> dan <code>cmd/seed</code>) masih bisa dikompilasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membangun binary mandiri</h3><p>Hasil build Go adalah <b>program tunggal yang sudah mandiri</b>: pengguna tidak perlu memasang Go, tidak ada runtime yang dimuat, dan tidak ada folder dependensi yang harus dibawa. Karena Fyne memakai OpenGL lewat CGO, pastikan <code>CGO_ENABLED=1</code> sebelum build.</p>'
    },
    {
      type: 'example',
      title: 'Build dua executable proyek',
      lang: 'bash',
      output: false,
      code: `# CGO wajib untuk Fyne (nilai default biasanya sudah 1)
CGO_ENABLED=1 go build -o todo ./cmd/todo
CGO_ENABLED=1 go build -o seed ./cmd/seed

# ukur hasilnya — dua file yang langsung bisa dijalankan
ls -lh todo seed`,
      explain: [
        '<code>-o todo</code> menentukan nama hasil; tanpa opsi itu, Go menamai binary dari nama package (menjadi <code>todo</code> dan <code>seed</code> — sama saja di sini).',
        'Ukuran binary puluhan megabait itu wajar: driver database, jendela, font, dan OpenGL ikut tertaut di dalamnya, sehingga satu file sudah cukup untuk menjalankan aplikasi.',
        'Satu binary hanya berlaku untuk <b>satu kombinasi OS dan arsitektur</b> — binary hasil build di macOS tidak bisa dijalankan di Windows.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Cross-compile bukan pilihan mudah untuk Fyne</h3><p>Go terkenal mudah lintas platform dengan <code>GOOS</code> dan <code>GOARCH</code>, misal <code>GOOS=windows GOARCH=amd64 go build</code>. Untuk aplikasi GUI ber-<b>CGO</b> seperti Fyne, perintah itu <b>umumnya gagal</b> — komputer kamu tidak punya kompiler C milik OS target.</p><p>Pilihannya hanya dua: <b>build di OS target</b> (atau mesin virtual/PC Windows bila ingin paket .exe), atau pakai <b>CI lintas OS</b> seperti GitHub Actions dengan tiga runner berbeda (ubuntu, windows, macos) yang masing-masing membangun paketnya sendiri.</p>'
    },
    {
      type: 'text',
      html: '<h3>CLI Fyne: mengemas jadi paket instalasi</h3><p>Binary mentah bisa dijalankan, tetapi aplikasi desktop yang baik punya <b>ikon di taskbar/dock</b> dan tampil sebagai program sungguhan. Untuk itu Fyne menyediakan perintah <code>fyne package</code>. Pasang CLI-nya sekali, siapkan ikon PNG, lalu kemas.</p>'
    },
    {
      type: 'example',
      title: 'Pasang CLI Fyne dan kemas untuk tiap sistem operasi',
      lang: 'bash',
      output: false,
      code: `# pasang CLI sekali (di luar folder proyek juga boleh)
go install fyne.io/fyne/v2/cmd/fyne@latest
fyne version

# siapkan ikon: PNG persegi 512x512, beri nama icon.png
# macOS — menghasilkan katalog Todo.app
fyne package -os darwin -icon icon.png -appID id.pojokcodeid.todo

# Windows — butuh MinGW-w64 (gcc) karena build tetap lewat CGO
fyne package -os windows -icon icon.png -appID id.pojokcodeid.todo

# Linux
fyne package -os linux -icon icon.png -appID id.pojokcodeid.todo

# alternatif: langsung pasang ke sistem (tanpa arsip)
fyne install -os darwin -icon icon.png -appID id.pojokcodeid.todo`,
      explain: [
        '<code>-appID</code> memakai gaya reverse-DNS dan harus <b>unik, minimal satu titik, tanpa tanda hubung</b> — misal <code>id.pojokcodeid.todo</code>; ID ini juga yang dipakai <code>app.NewWithID</code> di <code>cmd/todo/main.go</code> untuk menyimpan preferensi.',
        '<code>-icon</code> menunjuk PNG <b>persegi</b> berukuran minimal 512x512; ikon tidak persegi akan dipotong/diberi bingkai oleh tool, sehingga hasilnya jelek di beberapa OS.',
        'Jalankan perintah packaging di <b>OS target</b>: karena bahan dasarnya adalah binary hasil build CGO, mengemas paket Windows dari macOS (atau sebaliknya) akan ikut gagal.'
      ]
    },
    {
      type: 'text',
      html: '<p>Hasil paketnya berbeda tiap OS: di macOS lahir katalog <b><code>Todo.app</code></b> yang bisa diseret ke folder Aplikasi; di Windows lahir berkas <b><code>Todo.exe</code></b> dengan ikon dan versi yang sudah disematkan; di Linux dihasilkan <b>paket arsip</b> berisi binary, ikon, dan entry desktop untuk dipasang ke sistem. Perintah <code>fyne install</code> adalah jalur cepat yang melewati langkah arsip dan langsung menaruh aplikasi di lokasi bawaan sistem.</p>'
    },
    {
      type: 'text',
      html: '<h3>Di mana data pengguna disimpan?</h3><p>Selama masa pengembangan, proyek contoh memakai <code>todo.db</code> di <b>folder kerja</b> — sederhana dan mudah dilihat. Untuk rilis, file itu sebaiknya pindah ke <b>folder konfigurasi pengguna</b> milik sistem operasi, supaya data tidak ikut terhapus saat aplikasi di-upgrade, tidak bercampur dengan file program, dan tetap ada walau aplikasi dijalankan dari folder mana pun.</p>'
    },
    {
      type: 'example',
      title: 'Menempatkan database di folder konfigurasi pengguna',
      lang: 'go',
      output: false,
      code: `import (
	"log"
	"os"
	"path/filepath"
)

dir, err := os.UserConfigDir()
if err != nil {
	log.Fatalf("menentukan folder konfigurasi: %v", err)
}
dir = filepath.Join(dir, "id.pojokcodeid.todo")
if err := os.MkdirAll(dir, 0o755); err != nil {
	log.Fatalf("membuat folder data: %v", err)
}
dsn := filepath.Join(dir, "todo.db") // diteruskan ke storage.Open("sqlite", dsn)`,
      explain: [
        '<code>os.UserConfigDir()</code> mengembalikan lokasi bawaan per OS: macOS <code>~/Library/Application Support</code>, Windows <code>%AppData%</code>, Linux <code>~/.config</code> — cukup satu baris kode untuk ketiganya.',
        '<code>os.MkdirAll</code> membuat folder beserta induknya bila belum ada dan tidak mengeluh bila sudah ada; <code>0o755</code> adalah izin khas direktori di Unix.',
        'Perubahan ini hanya menyentuh satu tempat karena seluruh aplikasi membuka database lewat <code>storage.Open</code> — arsitektur berlapis kembali terbayar.'
      ]
    },
    {
      type: 'example',
      title: 'Isi .gitignore proyek contoh',
      lang: 'text',
      output: false,
      code: `# hasil build
/todo
/seed

# database lokal
*.db
*.db-journal
*.db-wal
*.db-shm

# artefak sistem
.DS_Store
._*`,
      explain: [
        'Garis miring di depan (<code>/todo</code>) membatasi pola pada root proyek sehingga folder mana pun bernama todo tidak ikut terabaikan.',
        '<code>*.db-journal</code>, <code>*.db-wal</code>, dan <code>*.db-shm</code> adalah berkas pendamping SQLite yang ikut muncul saat aplikasi menulis — kalau tidak diabaikan, berkas ini bermunculan sebagai perubahan misterius.',
        'Baris terakhir menyangkut artefak macOS; di Windows, tambahkan folder <code>bin/</code> bila kamu memilih menyimpan hasil build di sana.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan kirim binary dan data pengguna ke repository',
      text: 'Hasil build (<code>/todo</code>, <code>/seed</code>, berkas <code>.app</code>/<code>.exe</code>) berukuran besar dan berbeda tiap OS — biarkan <code>.gitignore</code> menahannya. Lebih penting lagi: <b>jangan pernah mengirim file database berisi data pengguna ke repo</b>. <code>todo.db</code> bersifat lokal dan pribadi; yang dibagikan hanyalah kode, skema di <code>migrations/</code>, dan file kosong bila memang diperlukan.'
    },
    {
      type: 'text',
      html: '<h3>Demo &amp; pengujian manual</h3><p>Test otomatis membuktikan kode benar, tetapi hanya menjalankan aplikasinya sendiri yang membuktikan <b>pengalaman</b> pengguna: tombol bisa diklik, dialog muncul di tempat yang benar, dan data benar-benar tersimpan. Program <code>cmd/seed</code> disiapkan persis untuk ini.</p>'
    },
    {
      type: 'example',
      title: 'Sesi demo: seed, aplikasi, lalu coba MySQL',
      lang: 'bash',
      output: false,
      code: `# 1. tanam 5 todo contoh — idempoten: berhenti bila database sudah berisi
go run ./cmd/seed

# 2. jalankan aplikasi (SQLite: file todo.db di folder kerja)
go run ./cmd/todo

# 3. siapkan MySQL sekali lewat mysql client
#    CREATE DATABASE todo_app CHARACTER SET utf8mb4;
#    CREATE USER 'todo'@'127.0.0.1' IDENTIFIED BY 'rahasia';
#    GRANT ALL ON todo_app.* TO 'todo'@'127.0.0.1';

# 4. jalankan aplikasi yang sama di atas MySQL
TODO_DB_DRIVER=mysql TODO_DB_DSN="todo:rahasia@tcp(127.0.0.1:3306)/todo_app?charset=utf8mb4" go run ./cmd/todo`,
      explain: [
        '<code>go run ./cmd/seed</code> aman dijalankan berulang: ia mengecek <code>svc.Stats</code> lebih dulu dan berhenti bila total todo sudah di atas nol, sehingga demo tidak pernah menggandakan data.',
        'Pada langkah 4 tidak ada satu baris kode aplikasi pun yang berubah — hanya dua environment variable. Skema MySQL bahkan dibuat otomatis oleh repository saat koneksi pertama dibuka.',
        'Tandai satu todo sebagai selesai lewat centang, tutup aplikasi, jalankan lagi: bila statusnya bertahan, jalur persistensi benar-benar bekerja.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah lanjutan</h3><p>Bila proyek ini ingin dikembangkan lebih jauh, berikut pekerjaan yang paling logis berikutnya — semuanya tidak memerlukan perubahan arsitektur:</p><ul><li><b>Driver PostgreSQL sendiri</b> — interface sudah siap, cukup buat package baru; ingat placeholder-nya memakai <code>$1</code>, <code>$2</code>, bukan <code>?</code> seperti SQLite/MySQL.</li><li><b>Kategori kustom &amp; CRUD kategori</b> — tabel kategori baru plus dialog tambah/ubah/hapus, daftar <code>model.Categories</code> berubah dari konstanta menjadi data.</li><li><b>Pencarian debounce</b> — tunda <code>a.refresh()</code> beberapa ratus milidetik setelah ketikan terakhir agar query tidak berlari tiap huruf.</li><li><b>Multi-window</b> — <code>a.NewWindow</code> boleh dipanggil lebih dari satu kali, misal jendela statistik terpisah yang membaca service yang sama.</li><li><b>Pintasan papan ketik</b> — daftarkan lewat <code>w.Canvas().AddShortcut(shortcut, handler)</code> untuk simpan/hapus cepat.</li><li><b>Penjadwalan &amp; notifikasi</b> — goroutine penghitung tenggat waktu plus notifikasi sistem bila tugas jatuh tempo.</li><li><b>Tema gelap-terang otomatis</b> — terima <code>fyne.ThemeVariant</code> lalu pilih warna dari <code>theme.VariantLight</code> atau <code>theme.VariantDark</code>.</li><li><b>CI build lintas OS</b> — GitHub Actions dengan tiga runner (ubuntu, windows, macos) agar paket tiap OS dibangun di OS-nya sendiri.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Backup cukup menyalin satu berkas',
      text: 'Karena SQLite menyimpan seluruh database di satu file, backup berarti <b>menyalin <code>todo.db</code></b> (idealnya saat aplikasi ditutup, atau pakai perintah <code>sqlite3 todo.db ".backup salinan.db"</code> untuk versi yang konsisten). Untuk MySQL, gunakan <code>mysqldump</code> untuk menghasilkan file SQL. Uji backup-mu sekali — backup yang belum pernah dipulihkan bukan backup.'
    },
    {
      type: 'live',
      title: 'Latihan: checklist rilis yang bisa dicentang',
      lang: 'html',
      hint: 'Centang langkah yang sudah kamu selesaikan. Pilihan tersimpan otomatis di browser sehingga checklist bisa dilanjutkan lain waktu.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Checklist Rilis</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #f4f6f8; }
    .card { background: #fff; border-radius: 10px; padding: 16px; max-width: 720px; }
    h3 { margin: 0 0 6px; color: #0e7490; font-family: ui-monospace, monospace; }
    .bar { height: 10px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin: 8px 0; }
    .bar div { height: 100%; width: 0; background: #16a34a; transition: width .2s; }
    .hint { color: #94a3b8; font-size: 12.5px; margin: 6px 0; }
    li { margin: 7px 0; line-height: 1.5; cursor: pointer; font-size: 14px; }
    li.done { color: #94a3b8; text-decoration: line-through; }
    code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; }
    button { background: #0e7490; color: #fff; border: 0; border-radius: 8px; padding: 7px 12px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h3>Checklist rilis Todo App</h3>
    <div class="bar"><div id="isi"></div></div>
    <p class="hint" id="skor">0 dari 8 langkah selesai</p>
    <ul id="daftar"></ul>
    <button id="reset">Mulai dari awal</button>
  </div>
  <script>
    var daftar = [
      '<code>gofmt -l .</code> tidak mengembalikan file apa pun',
      '<code>go vet ./...</code> bersih',
      '<code>go test ./...</code> dan <code>go test -race ./...</code> hijau',
      '<code>go build ./...</code> sukses dengan CGO_ENABLED=1',
      'binary hasil build dan file *.db tidak masuk ke repository',
      'ikon PNG persegi 512x512 serta appID sudah disiapkan',
      '<code>fyne package -os darwin</code> menghasilkan paket yang bisa dibuka',
      'backup todo.db / dump MySQL sudah dicoba dipulihkan'
    ];
    var KEY = 'gui-rilis-checklist';
    var isi = [];
    try { isi = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { isi = []; }

    function gambar() {
      var kotak = document.getElementById('daftar');
      kotak.innerHTML = '';
      var selesai = 0;
      daftar.forEach(function (t, i) {
        var li = document.createElement('li');
        li.innerHTML = (isi[i] ? '[x] ' : '[ ] ') + t;
        if (isi[i]) { li.className = 'done'; selesai++; }
        li.onclick = function () {
          isi[i] = !isi[i];
          try { localStorage.setItem(KEY, JSON.stringify(isi)); } catch (e) {}
          gambar();
        };
        kotak.appendChild(li);
      });
      document.getElementById('isi').style.width = (selesai / daftar.length * 100) + '%';
      document.getElementById('skor').textContent = selesai + ' dari ' + daftar.length + ' langkah selesai';
    }
    document.getElementById('reset').onclick = function () {
      isi = [];
      try { localStorage.removeItem(KEY); } catch (e) {}
      gambar();
    };
    gambar();
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Build', 'Proses mengubah kode sumber menjadi program siap jalankan; di Go: <code>go build</code>.'],
        ['CGO_ENABLED', 'Environment variable yang mengizinkan pemanggilan kode C; wajib bernilai 1 untuk membangun Fyne.'],
        ['GOOS / GOARCH', 'Environment variable penentu sistem operasi dan arsitektur target build; biasanya gagal untuk aplikasi CGO.'],
        ['fyne package', 'Perintah CLI Fyne untuk mengemas aplikasi menjadi paket khas OS: .app, .exe, atau paket Linux.'],
        ['appID', 'Identitas aplikasi gaya reverse-DNS (mis. id.pojokcodeid.todo) yang unik dan dipakai OS serta penyimpanan preferensi.'],
        ['Ikon aplikasi', 'PNG persegi minimal 512x512 yang disematkan ke paket agar aplikasi tampil benar di dock, taskbar, dan menu.'],
        ['os.UserConfigDir()', 'Fungsi standard library yang mengembalikan folder konfigurasi pengguna sesuai OS.'],
        ['Preferensi', 'Penyimpanan kecil bawaan Fyne (lihat pelajaran 9) yang rumahnya ditentukan oleh appID.'],
        ['Backup', 'Salinan data untuk berjaga; SQLite cukup disalin satu file, MySQL memakai mysqldump.']
      ]
    }
  ],
  recap: [
    'Sebelum build, jalankan checklist: <code>gofmt -l .</code> → <code>go vet ./...</code> → <code>go test ./... &amp;&amp; go test -race ./...</code> → <code>go build ./...</code>.',
    'Hasil <code>go build -o todo ./cmd/todo</code> adalah <b>binary mandiri</b> tanpa runtime, tetapi berlaku hanya untuk OS dan arsitektur tempat ia dibangun.',
    'Karena Fyne membutuhkan CGO, lintas platform lewat <code>GOOS</code>/<code>GOARCH</code> umumnya gagal — build di OS target atau pakai CI tiga runner.',
    'CLI <code>fyne package</code> menghasilkan <code>.app</code> di macOS, <code>.exe</code> di Windows, dan paket Linux; syaratnya ikon PNG persegi 512x512 dan appID bertitik yang unik.',
    'Untuk rilis, database sebaiknya berada di <code>os.UserConfigDir()</code>, dan binary serta file <code>*.db</code> tidak boleh masuk ke repository.',
    'Demo manual memakai <code>go run ./cmd/seed</code> (idempoten) lalu <code>go run ./cmd/todo</code>; beralih ke MySQL cukup dengan mengganti <code>TODO_DB_DRIVER</code> dan <code>TODO_DB_DSN</code>.'
  ]
});
