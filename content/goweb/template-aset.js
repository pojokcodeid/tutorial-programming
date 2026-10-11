/* ============================================================
   Pelajaran Go Web Examples — Bab 3: Template & Aset
   (materi dari https://gowebexamples.com/)
    - "Templates"
    - "Assets and Files"
   ============================================================ */
'use strict';

window.GOWEB_LESSONS = window.GOWEB_LESSONS || [];

/* ---------- Pelajaran 5: Template HTML (html/template) ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-templates',
  title: 'Template HTML dengan html/template',
  chapter: 'Template & Aset',
  duration: '11 menit',
  intro: [
    'Menulis HTML langsung di dalam kode Go membuat program sulit dirawat. Package <b>html/template</b> memisahkan tampilan dari logika: HTML ditulis di berkas terpisah, lalu diisi data secara terstruktur.',
    'Keunggulan besarnya: template <b>otomatis meng-escape</b> data sehingga membantu mencegah serangan XSS.'
  ],
  objectives: [
    'Memahami sintaks template Go',
    'Mengenal pipeline {{.}} dan struktur kontrol',
    'Mengurai template dari berkas',
    'Merender template di dalam handler'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Template dijalankan dengan data apa pun: string, angka, atau struktur bersarang. Untuk mengakses data, kita memakai tanda kurung kurawal ganda <code>{{.}}</code>. Titik di dalamnya disebut <b>pipeline</b> yang menunjuk elemen data saat ini.</p>'
    },
    {
      type: 'example',
      title: 'Menyiapkan data untuk template',
      lang: 'go',
      output: false,
      code: `data := TodoPageData{
    PageTitle: "Daftar Tugas Saya",
    Todos: []Todo{
        {Title: "Tugas 1", Done: false},
        {Title: "Tugas 2", Done: true},
        {Title: "Tugas 3", Done: true},
    },
}`,
      explain: [
        'Data bisa berupa struct apa pun, termasuk slice di dalamnya.',
        'Field yang ingin diakses dari template harus diawali huruf kapital (exported).',
        '<code>Todos</code> akan diulang di template dengan <code>{{range}}</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Template dengan kontrol',
      lang: 'html',
      output: false,
      code: `<h1>{{.PageTitle}}</h1>
<ul>
    {{range .Todos}}
        {{if .Done}}
            <li class="selesai">{{.Title}}</li>
        {{else}}
            <li>{{.Title}}</li>
        {{end}}
    {{end}}
</ul>`,
      explain: [
        '<code>{{.PageTitle}}</code> menampilkan field PageTitle.',
        '<code>{{range .Todos}}</code> mengulang setiap elemen slice.',
        'Di dalam range, <code>{{.}}</code> menunjuk elemen saat itu (sebuah Todo).',
        '<code>{{if .Done}} ... {{else}} ... {{end}}</code> memilih tampilan berdasarkan nilai bool.'
      ]
    },
    {
      type: 'text', // control structures table
      html: '<p>Berikut struktur kontrol yang paling sering dipakai di template Go:</p><table class="vocab"><tr><th>Struktur</th><th>Artinya</th></tr><tr><td><code>{{/* komentar */}}</code></td><td>Komentar, tidak dirender.</td></tr><tr><td><code>{{.}}</code></td><td>Menampilkan elemen akar data.</td></tr><tr><td><code>{{.Title}}</code></td><td>Menampilkan field Title.</td></tr><tr><td><code>{{if .Done}} {{else}} {{end}}</code></td><td>Percabangan.</td></tr><tr><td><code>{{range .Todos}} {{.}} {{end}}</code></td><td>Perulangan.</td></tr><tr><td><code>{{block "content" .}} {{end}}</code></td><td>Blok bernama untuk pewarisan layout.</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p>Template dapat dibuat dari string atau, lebih umum, dari berkas di disk. Fungsi <code>template.ParseFiles</code> membaca berkas; <code>template.Must</code> membungkusnya agar program berhenti lebih awal bila ada kesalahan sintaks.</p>'
    },
    {
      type: 'example',
      title: 'Mengurai template dari berkas',
      lang: 'go',
      output: false,
      code: `// Mengurai satu berkas template
tmpl, err := template.ParseFiles("layout.html")
if err != nil {
    log.Fatal(err)
}

// Cara ringkas: berhenti otomatis bila template rusak
tmpl := template.Must(template.ParseFiles("layout.html"))`,
      explain: [
        '<code>ParseFiles</code> bisa menerima banyak berkas sekaligus sebagai satu set template.',
        '<code>template.Must</code> memanggil panic bila terjadi error — praktis untuk template yang wajib benar.',
        'Biasanya template diurai sekali saat program mulai, bukan tiap permintaan.'
      ]
    },
    {
      type: 'example',
      title: 'Merender template di handler',
      lang: 'go',
      output: false,
      code: `func(w http.ResponseWriter, r *http.Request) {
    // Execute menulis ke w dan menerima data apa pun.
    tmpl.Execute(w, "data goes here")
}`,
      explain: [
        '<code>Execute</code> menerima <code>io.Writer</code> (di sini ResponseWriter) dan data.',
        'Saat menulis ke ResponseWriter, header <code>Content-Type: text/html; charset=utf-8</code> diisi otomatis.',
        'Karena itu template tampil sebagai halaman HTML, bukan teks biasa.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap template TODO',
      lang: 'go',
      output: false,
      code: `package main

import (
    "html/template"
    "net/http"
)

type Todo struct {
    Title string
    Done  bool
}

type TodoPageData struct {
    PageTitle string
    Todos     []Todo
}

func main() {
    tmpl := template.Must(template.ParseFiles("layout.html"))

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        data := TodoPageData{
            PageTitle: "Daftar Tugas Saya",
            Todos: []Todo{
                {Title: "Tugas 1", Done: false},
                {Title: "Tugas 2", Done: true},
            },
        }
        tmpl.Execute(w, data)
    })

    http.ListenAndServe(":80", nil)
}`,
      explain: [
        'Struktur data didefinisikan di Go, tampilan di berkas HTML.',
        'Data yang dikirim ke template bisa apa saja selama field-nya exported.',
        'Semua nilai yang dirender otomatis di-escape sesuai konteks HTML.'
      ]
    },
    {
      type: 'tip',
      title: 'Pakai `text/template` untuk teks non-HTML',
      text: 'Ada dua package template: <code>html/template</code> (meng-escape untuk HTML, aman dari XSS) dan <code>text/template</code> (tanpa escaping, untuk teks biasa seperti email atau konfigurasi). Untuk halaman web, selalu pilih <code>html/template</code>.'
    },
    {
      type: 'warn',
      title: 'Escaping otomatis bukan jaminan mutlak',
      text: 'Meski <code>html/template</code> meng-escape dengan aman, jangan pernah menonaktifkannya dengan menyuntikkan <code>template.HTML</code> dari input pengguna. Itu membuka kembali celah XSS.'
    },
    {
      type: 'vocab',
      items: [
        ['html/template', 'Package template yang aman untuk HTML.'],
        ['Pipeline {{.}}', 'Elemen data saat ini di dalam template.'],
        ['Action', 'Perintah di dalam {{ }}, mis. if, range, block.'],
        ['range', 'Mengulang template untuk setiap elemen.'],
        ['ParseFiles', 'Mengurai template dari berkas di disk.'],
        ['Execute', 'Merender template dengan data ke sebuah writer.'],
        ['Escaping', 'Mengubah karakter berbahaya agar aman ditampilkan.']
      ]
    }
  ],
  recap: [
    'html/template memisahkan tampilan HTML dari logika Go.',
    'Gunakan {{.}} untuk data, {{if}} untuk percabangan, {{range}} untuk perulangan.',
    'Template diurai dari berkas dengan ParseFiles/template.Must.',
    'Execute merender template ke ResponseWriter dan mengisi header HTML.',
    'Escaping otomatis melindungi dari XSS — jangan dinonaktifkan untuk input pengguna.'
  ]
});

/* ---------- Pelajaran 6: Menyajikan Aset & Berkas Statis ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-static-files',
  title: 'Menyajikan Aset & Berkas Statis',
  chapter: 'Template & Aset',
  duration: '7 menit',
  intro: [
    'Halaman web butuh berkas pendukung: CSS untuk gaya, JavaScript untuk interaksi, dan gambar. Berkas seperti ini <b>tidak berubah</b> dan disebut <b>aset statis</b>.',
    'Pelajaran ini menunjukkan cara menyajikannya dari sebuah folder memakai <code>http.FileServer</code>.'
  ],
  objectives: [
    'Menyajikan folder berkas statis',
    'Memetakan URL /static/ ke folder aset',
    'Memahami peran http.StripPrefix',
    'Menguji aset dengan curl'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Ide dasarnya sederhana: tunjuk sebuah folder, lalu petakan sebuah awalan URL ke folder itu. Folder <code>assets/</code> berisi aset, dan awalan <code>/static/</code> menjadi alamat publiknya.</p>'
    },
    {
      type: 'example',
      title: 'Menyajikan berkas statis',
      lang: 'go',
      output: false,
      code: `package main

import "net/http"

func main() {
    // File server menunjuk folder "assets/"
    fs := http.FileServer(http.Dir("assets/"))

    // URL /static/...  ->  berkas di dalam assets/...
    http.Handle("/static/", http.StripPrefix("/static/", fs))

    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        '<code>http.Dir("assets/")</code> adalah folder sumber aset.',
        '<code>http.StripPrefix("/static/", fs)</code> membuang <code>/static/</code> sebelum mencari berkas.',
        'Permintaan ke <code>/static/css/styles.css</code> akan menampilkan <code>assets/css/styles.css</code>.',
        'Andaikan tanpa StripPrefix, server mencari <code>assets/static/css/...</code> dan gagal.'
      ]
    },
    {
      type: 'example',
      title: 'Struktur folder & mencoba',
      lang: 'bash',
      output: false,
      code: `# Struktur folder:
# assets/
# └── css
#     └── styles.css

$ go run static-files.go

$ curl -s http://localhost:8080/static/css/styles.css
body {
    background-color: black;
}`,
      explain: [
        'File server menyajikan berkas dengan tipe konten (Content-Type) yang benar.',
        '<code>curl</code> memudahkan memeriksa hasil tanpa membuka browser.',
        'Setiap berkas di dalam folder aset bisa diakses sesuai path-nya.'
      ]
    },
    {
      type: 'tip',
      title: 'Pisahkan aset ke folder khusus',
      text: 'Simpan aset di folder seperti <code>assets/</code>, <code>static/</code>, atau <code>public/</code>. Jangan pernah menyajikan folder akar proyek — berkas kode dan konfigurasi bisa ikut terbuka.'
    },
    {
      type: 'warn',
      title: 'Perhatikan penamaan dan cache',
      text: 'Berkas statis di-cache keras oleh browser. Bila aset berubah tetapi nama file tetap sama, pengguna mungkin masih melihat versi lama. Siasati dengan menambahkan versi pada nama (<code>app.2f3a.js</code>).'
    },
    {
      type: 'vocab',
      items: [
        ['Aset statis', 'Berkas tetap seperti CSS, JS, dan gambar.'],
        ['http.FileServer', 'Handler yang menyajikan isi sebuah folder.'],
        ['http.Dir', 'Menunjuk folder sumber berkas.'],
        ['StripPrefix', 'Membuang awalan URL sebelum mencari berkas.'],
        ['Content-Type', 'Header yang memberi tahu jenis berkas kepada browser.']
      ]
    }
  ],
  recap: [
    'Aset statis disajikan dengan http.FileServer + http.Dir.',
    'Petakan awalan URL seperti /static/ ke folder aset.',
    'StripPrefix membuang awalan URL agar berkas ditemukan.',
    'Uji dengan curl atau browser.',
    'Jangan menyajikan folder yang berisi berkas rahasia.'
  ]
});
