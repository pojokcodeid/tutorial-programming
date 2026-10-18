/* ============================================================
   Pelajaran Contoh Project Go GUI — Bab 2: Jendela Pertama: Aplikasi, Layout & Widget Dasar
   ============================================================ */
'use strict';

window.GOGUI_LESSONS = window.GOGUI_LESSONS || [];

window.GOGUI_LESSONS.push({
  id: 'gui-window',
  title: 'Jendela Pertama: Aplikasi, Layout & Widget Dasar',
  chapter: 'Dasar UI',
  duration: '13 menit',
  intro: [
    'Pelajaran 1 menggambar proyek dari atas: folder, lapisan, dan pilihan database. Kali ini kita turun ke layar — kamu akan <b>membuka jendela pertama</b>, memahami urutan pemanggilan yang membuatnya hidup, lalu mengenal dua alat yang dipakai setiap saat: <b>layout</b> (aturan menata anak widget) dan <b>widget dasar</b> (label, kolom isian, tombol, pilihan, kotak centang).',
    'Di akhir pelajaran kamu akan membaca ulang fungsi <code>buildUI()</code> pada <code>internal/ui/app.go</code> dan memahami mengapa barisannya sedemikian rupa — termasuk satu jebakan urutan callback yang pernah membuat aplikasi contoh panic saat jendela terbuka.'
  ],
  objectives: [
    'Menjalankan siklus hidup aplikasi Fyne dari <code>app.NewWithID</code> sampai <code>w.ShowAndRun()</code>',
    'Menjelaskan peran <code>ShowAndRun</code> yang memblokir proses dan <code>NewWithID</code> yang menyediakan penyimpanan preferensi',
    'Membedakan aturan ukuran <code>VBox</code>, <code>HBox</code>, <code>Border</code>, <code>Stack</code>, dan <code>Padded</code>',
    'Memakai widget dasar: Label, Entry, ButtonWithIcon, Select, dan Check beserta callback-nya',
    'Membaca susunan jendela Todo App pada <code>buildUI()</code> baris demi baris'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Siklus hidup jendela Fyne</h3><p>Setiap aplikasi Fyne berjalan pada urutan yang sama: lima langkah berurutan. Langkah 1–4 hanya menyusun objek di memori; langkah 5 menyerahkan kendali ke Fyne sampai pengguna menutup jendela.</p><ul><li><b><code>app.NewWithID(&quot;id.pojokcodeid.todo&quot;)</code></b> — membuat objek aplikasi dengan identitas stabil.</li><li><b><code>a.NewWindow(judul)</code></b> — membuat jendela; belum ada yang tampil di layar.</li><li><b><code>w.SetContent(...)</code></b> — memasang satu objek isi utama ke jendela.</li><li><b><code>w.Resize(fyne.NewSize(820, 620))</code></b> — menentukan ukuran awal dalam pixel, ditulis (lebar, tinggi).</li><li><b><code>w.ShowAndRun()</code></b> — menampilkan jendela, lalu memblokir proses.</li></ul>'
    },
    {
      type: 'example',
      title: 'Siklus hidup pada cmd/todo/main.go',
      lang: 'go',
      output: false,
      code: `func main() {
	// 1) Database dulu — bila gagal, berhenti sebelum jendela muncul.
	repo, err := storage.FromEnv()
	if err != nil {
		log.Fatalf("gagal menyiapkan database: %v", err)
	}
	defer repo.Close()

	// 2) Aplikasi Fyne dengan ID stabil (dipakai penyimpanan preferensi).
	a := app.NewWithID("id.pojokcodeid.todo")
	a.Settings().SetTheme(ui.AccentTheme())

	// 3) Rakit: repository -> service -> UI, lalu jalankan jendela.
	w := ui.NewWindow(a, service.New(repo))
	w.ShowAndRun() // memblokir sampai pengguna menutup jendela
}`,
      explain: [
        '<b><code>ShowAndRun</code> memblokir</b>: baris apa pun setelahnya baru dijalankan setelah jendela ditutup. Karena itu <code>defer repo.Close()</code> baru aktif ketika pengguna menutup aplikasi — koneksi database tidak pernah ditutup di tengah jendela terbuka.',
        '<b><code>NewWithID</code> memberi identitas stabil</b> untuk folder penyimpanan preferensi tiap sistem operasi. Dengan ID ini aplikasi bisa mengingat hal seperti filter terakhir (<code>app.Preferences()</code> dengan kunci <code>filter</code>), dan ID itu sendiri harus unik antar aplikasi.',
        'Database disiapkan <b>sebelum</b> jendela dibuat supaya kegagalan koneksi berhenti sebagai pesan di terminal, bukan sebagai jendela kosong yang tidak bisa melakukan apa-apa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Program mini: jendela pertama</h3><p>Sebelum menyentuh proyek, tulis satu program utuh yang isinya hanya <b>satu label dan satu tombol</b>. Tujuannya merasakan urutan lengkapnya: buat aplikasi, buat jendela, isi kontennya, ukurkan, jalankan. Simpan sebagai <code>main.go</code> di folder baru.</p>'
    },
    {
      type: 'example',
      title: 'Jendela pertama: label + tombol penutup',
      lang: 'go',
      output: false,
      code: `package main

import (
	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/widget"
)

func main() {
	a := app.NewWithID("id.pojokcodeid.belajar")
	w := a.NewWindow("Jendela Pertama")

	teks := widget.NewLabel("Halo dari Fyne!")
	keluar := widget.NewButton("Tutup jendela", func() {
		w.Close()
	})

	w.SetContent(container.NewVBox(teks, keluar))
	w.Resize(fyne.NewSize(360, 200))
	w.ShowAndRun()
}`,
      explain: [
        'Argumen kedua <code>widget.NewButton</code> adalah <b>callback</b> <code>func()</code> yang dipanggil Fyne setiap tombol diketuk — di dalamnya <code>w.Close()</code> mengakhiri <code>ShowAndRun</code> dan program selesai.',
        '<b><code>SetContent</code> dipanggil minimal sekali</b>; jendela tanpa konten akan tampil kosong. Jendela hanya menerima satu objek utama, jadi susunan yang kompleks dibangun dari container (lihat langkah berikutnya).',
        '<b><code>Resize</code> hanya ukuran awal.</b> Pengguna tetap boleh memperbesar, tetapi Fyne tidak memperkecil jendela di bawah <b>MinSize</b> gabungan seluruh isinya — widget punya ukuran minimum sendiri-sendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan program mini',
      lang: 'bash',
      output: false,
      code: `mkdir belajar && cd belajar
go mod init belajar
go get fyne.io/fyne/v2@latest
go run .        # kompile sebentar, lalu jendela "Jendela Pertama" terbuka`,
      explain: [
        'Titik pada <code>go run .</code> berarti "package di folder ini" — cocok untuk proyek satu berkas; proyek proyek memakai <code>go run ./cmd/todo</code> karena foldernya berlapis.',
        'Jalankan pertama kali terasa agak lama karena Go mengompilasi seluruh Fyne dan menyalakan konteks OpenGL; build berikutnya jauh lebih cepat karena artefaknya di-cache.',
        'Jendela yang muncul identik di Windows, macOS, dan Linux karena Fyne menggambar widget sendiri — bukan memakai tampilan asli sistem operasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Layout: aturan menata anak widget</h3><p>Jendela hanya menerima satu objek isi, sehingga seluruh susunan dibangun dari <b>container</b>. Tiap container punya aturan ukuran yang berbeda — hafalkan lima ini karena semuanya dipakai oleh proyek Todo App:</p><ul><li><b><code>container.NewVBox(a, b, ...)</code></b> — menumpuk vertikal; <b>tiap anak mendapat lebar penuh</b> dan tinggi mengikuti isinya.</li><li><b><code>container.NewHBox(a, b, ...)</code></b> — menyusun horizontal; lebar tiap anak <b>mengikuti ukuran minimum (MinSize)</b>, sehingga tombol tidak melebar sia-sia.</li><li><b><code>container.NewBorder(top, bottom, left, right, center)</code></b> — lima posisi; <b>left/right/top/bottom berukuran MinSize</b>, sedangkan <b>center mengisi seluruh sisa ruang</b>. Posisi yang diisi <code>nil</code> dibiarkan kosong.</li><li><b><code>container.NewStack(a, b, ...)</code></b> — menumpuk anak-anak di titik yang sama dengan ukuran sama besar; dipakai untuk menindih kotak &quot;kosong&quot; di atas daftar.</li><li><b><code>container.NewPadded(x)</code></b> — memberi jarak di sekeliling <code>x</code>, dipakai untuk kaki jendela agar status tidak menempel di tepi.</li></ul>'
    },
    {
      type: 'example',
      title: 'Lima layout dalam satu potongan',
      lang: 'go',
      output: false,
      code: `// VBox: anak mendapat LEBAR PENUH, disusun ke bawah.
atas := container.NewVBox(
	widget.NewLabel("Baris 1"),
	widget.NewLabel("Baris 2"),
)

// HBox: lebar anak mengikuti isi — tombol tidak ikut melebar.
bawah := container.NewHBox(widget.NewLabel("Kiri"), widget.NewLabel("Kanan"))

// Border(top, bottom, left, right, center):
// left & right berukuran MinSize, center mengisi sisa ruang.
tengah := container.NewEntry()
baris := container.NewBorder(
	widget.NewLabel("atas"),      // top
	widget.NewLabel("bawah"),     // bottom
	widget.NewLabel("kiri"),      // left
	widget.NewLabel("kanan"),     // right
	tengah,                       // center: mengisi sisa ruang
)

// Stack: dua anak menempel di titik yang sama.
tumpukan := container.NewStack(widget.NewLabel("di belakang"), widget.NewLabel("di depan"))

// Padded: jarak di sekeliling isi.
kaki := container.NewPadded(widget.NewLabel("Menyiapkan…"))`,
      explain: [
        'Aturan <b>center mengisi sisa ruang</b> pada Border adalah kunci tampilan Todo App: kolom cari melebar mengikuti jendela, sementara label &quot;Cari&quot; dan tombol filter tetap pas di sisinya.',
        'Anak VBox selalu lebar penuh — bila kamu ingin dua tombol berdampingan tanpa melebar, bungkus dengan <b>HBox</b> dulu, baru masukkan ke VBox.',
        'Container bisa bersarang: VBox berisi baris-baris Border, dan seluruhnya dibungkus Border lagi untuk menempelkan kaki jendela di bawah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Widget dasar yang dipakai hampir setiap aplikasi</h3><ul><li><b><code>widget.NewLabel(teks)</code></b> — teks biasa; <b><code>widget.NewLabelWithStyle(teks, fyne.TextAlignLeading, fyne.TextStyle{Bold: true})</code></b> untuk teks tebal/rata kiri.</li><li><b><code>Importance</code></b> pada label (Low/Medium/High) mengatur kekuatan warnanya; setelah diubah, panggil <b><code>Refresh()</code></b> agar tampilan ikut berubah.</li><li><b><code>widget.NewButtonWithIcon(teks, ikon, aksi)</code></b> — tombol berikon dari <code>theme.*</code>, misalnya <code>theme.ContentAddIcon()</code>.</li><li><b><code>widget.NewEntry()</code></b> — kolom isian: <code>SetPlaceHolder</code> untuk teks petunjuk, <code>Text</code> untuk membaca isinya, dan <b><code>OnSubmitted</code></b> yang dipanggil saat Enter ditekan.</li><li><b><code>widget.NewSelect(options, onUbah)</code></b> — daftar pilihan: <code>Options</code>, <code>SetSelected</code> untuk nilai awal, <b><code>OnChanged</code></b> saat pengguna memilih.</li><li><b><code>widget.NewCheck(teks, onUbah)</code></b> — kotak centang: <code>SetChecked</code> untuk nilai awal, <b><code>OnChanged</code></b> saat status berubah.</li></ul>'
    },
    {
      type: 'example',
      title: 'Widget dasar dalam kode',
      lang: 'go',
      output: false,
      code: `// Label tebal rata kiri (dipakai sebagai judul header).
judul := widget.NewLabelWithStyle("✔ Todo App",
	fyne.TextAlignLeading, fyne.TextStyle{Bold: true})

// Label biasa dengan penting-nya bisa diubah, lalu diperbarui.
status := widget.NewLabel("Menyiapkan…")
status.Importance = widget.LowImportance
status.Refresh() // wajib dipanggil setelah teks/penting diubah saat runtime

// Tombol berikon — ikon disediakan paket theme bawaan Fyne.
tambah := widget.NewButtonWithIcon("Tambah", theme.ContentAddIcon(), func() {
	// aksi tombol
})

// Kolom isian teks.
input := widget.NewEntry()
input.SetPlaceHolder("Apa yang harus dikerjakan?")
input.OnSubmitted = func(string) { // dipanggil saat Enter ditekan
	println(input.Text)
}

// Daftar pilihan tetap — nilai awal dipasang lebih dulu.
kategori := widget.NewSelect([]string{"Umum", "Kerja", "Pribadi", "Belanja"}, nil)
kategori.SetSelected("Umum")

// Kotak centang.
selesai := widget.NewCheck("Tandai selesai", func(on bool) {
	// dipanggil setiap status centang berubah
})
selesai.SetChecked(false)`,
      explain: [
        '<b><code>Text</code></b> pada Entry adalah properti, bukan fungsi: tulis <code>input.Text</code> untuk membaca dan <code>input.SetText(&quot;...&quot;)</code> untuk menulis — keduanya memicu pembaruan tampilan otomatis.',
        '<b><code>OnSubmitted</code></b> membebaskan pengguna dari mouse: Enter pada kolom judul langsung memanggil aksi yang sama dengan tombol Tambah, seperti pada proyek kita.',
        'Callback boleh dipasang <code>nil</code> saat pembuatan lalu ditulis ulang kapan pun — pola ini dipakai berkali-kali pada baris daftar, dan akan kamu lihat di pelajaran 3.'
      ]
    },
    {
      type: 'warn',
      title: 'SetSelected pada Select langsung menembak OnChanged',
      text: '<b><code>SetSelected()</code> bukan sekadar menetapkan nilai</b> — kalau <code>OnChanged</code> sudah terpasang, callback itu langsung dipanggil saat itu juga. Urutannya wajib: <b>pasang nilai awal dulu, baru pasang <code>OnChanged</code></b>. Di proyek contoh, kecerobohan ini pernah membuat <code>refresh()</code> terpanggil sebelum <code>widget.List</code> dibuat, dan aplikasi panic (<b>nil pointer</b>) tepat saat jendela terbuka. Lihat <code>buildUI()</code>: <code>a.filterSel.SetSelected(string(a.filter))</code> ditulis lebih dulu dengan komentar &quot;nilai awal tanpa efek samping&quot;, baru <code>a.filterSel.OnChanged = func(s string) { ... }</code> menyusul. <code>SetChecked</code> pada Check dan pemilihan nilai awal lain juga mengikuti aturan yang sama.'
    },
    {
      type: 'text',
      html: '<h3>Susunan jendela aplikasi kita</h3><p>Sekarang semua bahan tersedia. Fungsi <code>buildUI()</code> pada <code>internal/ui/app.go</code> merangkainya dari atas ke bawah: baris kepala, form tambah, pilihan kategori &amp; prioritas, toolbar cari &amp; filter, daftar di tengah, dan label status di kaki. Perhatikan container mana yang dipakai tiap baris:</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 900 430" width="900" role="img" aria-label="Susunan jendela Todo App dari atas ke bawah: baris kepala, input judul dengan tombol Tambah, dua pilihan, toolbar cari dan filter, widget.List di tengah, serta label status di kaki">
        <rect x="30" y="16" width="560" height="396" rx="12" class="u-hd"/>
        <text x="310" y="38" class="u-title" text-anchor="middle">Todo App — Go + Fyne</text>

        <rect x="44" y="60" width="532" height="40" rx="8" class="u-box"/>
        <text x="56" y="85" class="u-title" text-anchor="start">✔ Todo App</text>
        <text x="564" y="85" class="u-lbl" text-anchor="end">3 aktif · 1 selesai · 4 total</text>

        <rect x="44" y="108" width="418" height="44" rx="8" class="u-box"/>
        <text x="56" y="135" class="u-lbl" text-anchor="start">Apa yang harus dikerjakan?</text>
        <rect x="472" y="108" width="104" height="44" rx="8" class="u-hd"/>
        <text x="524" y="135" class="u-title" text-anchor="middle">+ Tambah</text>

        <rect x="44" y="160" width="170" height="36" rx="8" class="u-box"/>
        <text x="129" y="183" class="u-lbl" text-anchor="middle">Kategori: Umum ▾</text>
        <rect x="224" y="160" width="170" height="36" rx="8" class="u-box"/>
        <text x="309" y="183" class="u-lbl" text-anchor="middle">Prioritas: sedang ▾</text>

        <rect x="44" y="204" width="70" height="40" rx="8" class="u-box"/>
        <text x="79" y="229" class="u-lbl" text-anchor="middle">Cari</text>
        <rect x="124" y="210" width="300" height="28" rx="8" class="u-box"/>
        <text x="136" y="229" class="u-lbl" text-anchor="start">Cari judul / catatan / kategori…</text>
        <rect x="434" y="210" width="142" height="28" rx="8" class="u-box"/>
        <text x="505" y="229" class="u-lbl" text-anchor="middle">Filter: semua ▾</text>

        <rect x="44" y="252" width="532" height="120" rx="8" class="u-box"/>
        <text x="60" y="280" class="u-lbl" text-anchor="start">☐ Belajar widget Fyne</text>
        <line x1="56" y1="292" x2="564" y2="292" class="u-line"/>
        <text x="60" y="316" class="u-lbl" text-anchor="start">☐ Rapat tim produk</text>
        <line x1="56" y1="328" x2="564" y2="328" class="u-line"/>
        <text x="60" y="352" class="u-lbl" text-anchor="start">✔ Beli beras</text>

        <rect x="44" y="380" width="532" height="24" rx="6" class="u-box"/>
        <text x="56" y="397" class="u-lbl" text-anchor="start">4 todo ditampilkan.</text>

        <line x1="598" y1="80" x2="640" y2="80" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="650" y="84" class="u-lbl" text-anchor="start">head: NewBorder — judul kiri, hitungan kanan</text>
        <line x1="598" y1="130" x2="640" y2="130" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="650" y="134" class="u-lbl" text-anchor="start">inputRow: Entry di center, tombol di right</text>
        <line x1="598" y1="178" x2="640" y2="178" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="650" y="182" class="u-lbl" text-anchor="start">choiceRow: NewHBox — kategori, prioritas</text>
        <line x1="598" y1="224" x2="640" y2="224" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="650" y="228" class="u-lbl" text-anchor="start">searchRow: label kiri, entry tengah, filter kanan</text>
        <line x1="598" y1="312" x2="640" y2="312" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="650" y="316" class="u-lbl" text-anchor="start">center: NewStack(widget.List, emptyBox)</text>
        <line x1="598" y1="392" x2="640" y2="392" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="650" y="396" class="u-lbl" text-anchor="start">kaki: NewPadded(statusLabel)</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Susunan jendela Todo App: enam baris dari atas ke bawah, masing-masing ditata oleh container yang berbeda</figcaption></figure>`
    },
    {
      type: 'live',
      title: 'Latihan: simulasi tata letak jendela',
      lang: 'html',
      hint: 'Ubah teks placeholder pada panel atas, lalu tekan Tambah (atau Enter) untuk menambah baris daftar dan melihat hitungan ikut berubah.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Simulasi Jendela Todo App</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; background: #eef2f6; }
    .panel { max-width: 640px; margin: 0 auto 14px; background: #fff; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); font-size: 13px; color: #475569; }
    .panel input { width: 62%; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; }
    .win { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.15); }
    .head { display: flex; justify-content: space-between; padding: 10px 14px; background: #0e7490; color: #fff; font-weight: 600; }
    .body { padding: 12px 14px; }
    .row { display: flex; gap: 8px; }
    .row input, .row select { flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #fff; }
    .row button { border: 0; background: #0e7490; color: #fff; border-radius: 8px; padding: 0 16px; cursor: pointer; font-weight: 600; }
    .choices { margin-top: 8px; }
    ul { list-style: none; margin: 12px 0 0; padding: 0; }
    li { display: flex; gap: 10px; align-items: center; padding: 8px 6px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    li .cat { margin-left: auto; color: #64748b; font-size: 12px; }
    .foot { padding: 9px 14px; background: #f1f5f9; color: #475569; font-size: 13px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="panel">
    Placeholder kolom judul: <input id="ph" value="Apa yang harus dikerjakan?">
  </div>
  <div class="win">
    <div class="head"><span>✔ Todo App</span><span id="hitung">3 todo · 1 selesai</span></div>
    <div class="body">
      <div class="row">
        <input id="judul" placeholder="Apa yang harus dikerjakan?">
        <button id="tambah">Tambah</button>
      </div>
      <div class="row choices">
        <select id="kategori"><option>Umum</option><option>Kerja</option><option>Pribadi</option><option>Belanja</option></select>
        <select id="prioritas"><option>tinggi</option><option>sedang</option><option>rendah</option></select>
      </div>
      <ul id="daftar">
        <li>☐ Belajar widget Fyne <span class="cat">Kerja · sedang</span></li>
        <li class="selesai">☑ Rapat tim produk <span class="cat">Kerja · tinggi</span></li>
        <li>☐ Beli beras <span class="cat">Belanja · rendah</span></li>
      </ul>
    </div>
    <div class="foot" id="status">3 todo ditampilkan.</div>
  </div>
  <script>
    var judul = document.getElementById('judul');
    var daftar = document.getElementById('daftar');
    var hitung = document.getElementById('hitung');
    var status = document.getElementById('status');
    var ph = document.getElementById('ph');

    ph.oninput = function () { judul.placeholder = ph.value; };

    function hitungBaris() {
      var semua = daftar.children.length;
      var selesai = daftar.querySelectorAll('.selesai').length;
      hitung.textContent = semua + ' todo · ' + selesai + ' selesai';
      status.textContent = semua + ' todo ditampilkan.';
    }

    document.getElementById('tambah').onclick = function () {
      var t = judul.value.trim() || 'Tugas baru';
      var li = document.createElement('li');
      li.textContent = t + ' ';
      var cat = document.createElement('span');
      cat.className = 'cat';
      cat.textContent = document.getElementById('kategori').value + ' · ' + document.getElementById('prioritas').value;
      li.appendChild(cat);
      daftar.appendChild(li);
      judul.value = '';
      hitungBaris();
    };

    judul.onkeydown = function (e) {
      if (e.key === 'Enter') document.getElementById('tambah').click();
    };

    hitungBaris();
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['ShowAndRun', 'Metode jendela yang menampilkan tampilan lalu memblokir fungsi main sampai pengguna menutup jendela.'],
        ['NewWithID', 'Pembuat objek aplikasi Fyne dengan identitas tetap; identitas itu menjadi kunci folder penyimpanan preferensi.'],
        ['Preferences', 'Penyimpanan key-value kecil milik aplikasi (misalnya kunci <code>filter</code>) yang bertahan antar kali jalankan.'],
        ['MinSize', 'Ukuran minimum sebuah widget/container; anak Border pada posisi kiri/kanan berukuran ini, bukan mengisi ruang.'],
        ['Container / layout', 'Objek penata anak: <code>VBox</code>, <code>HBox</code>, <code>Border</code>, <code>Stack</code>, dan <code>Padded</code>.'],
        ['Entry', 'Kolom isian teks dengan <code>Text</code>, <code>SetPlaceHolder</code>, <code>OnChanged</code>, dan <code>OnSubmitted</code> (Enter).'],
        ['Select', 'Daftar pilihan turun; nilai awal diatur <code>SetSelected</code> dan perubahan pengguna tampil di <code>OnChanged</code>.'],
        ['Importance', 'Tingkat penekanan warna label (Low/Medium/High); setelah diubah, panggil <code>Refresh()</code> agar tampilan ikut berubah.']
      ]
    }
  ],
  recap: [
    'Siklus hidup Fyne selalu berurutan: <b><code>NewWithID</code> → <code>NewWindow</code> → <code>SetContent</code> → <code>Resize</code> → <code>ShowAndRun</code>.',
    '<b><code>ShowAndRun</code> memblokir proses</b> sampai jendela ditutup, sedangkan <b><code>NewWithID</code></b> menyediakan identitas stabil untuk menyimpan preferensi seperti filter terakhir.',
    'Aturan ukuran: anak <b>VBox</b> mendapat lebar penuh, anak <b>HBox</b> mengikuti isi, posisi <b>Border</b> kiri/atas/bawah/kanan berukuran MinSize, dan <b>center</b> mengisi sisa ruang.',
    'Widget dasar Fyne: Label (+<code>Importance</code>/<code>Refresh</code>), ButtonWithIcon, Entry, Select, dan Check — semuanya bekerja lewat callback.',
    '<b><code>SetSelected</code> langsung memanggil <code>OnChanged</code></b>: pasang nilai awal dulu, baru pasang callback — jika tidak, <code>refresh()</code> bisa berjalan sebelum daftar dibuat dan aplikasi panic.',
    'Jendela Todo App disusun dari enam baris pada <code>buildUI()</code>: kepala, input+tombol, kategori &amp; prioritas, cari &amp; filter, <code>widget.List</code> di tengah, dan status di kaki.'
  ]
});
