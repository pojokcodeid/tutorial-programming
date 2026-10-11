/* ============================================================
   Pelajaran Go Web Examples — Bab 2: Routing & Form
   (materi dari https://gowebexamples.com/)
    - "Routing (using gorilla/mux)"
    - "Forms"
   ============================================================ */
'use strict';

window.GOWEB_LESSONS = window.GOWEB_LESSONS || [];

/* ---------- Pelajaran 3: Routing dengan gorilla/mux ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-routing-mux',
  title: 'Routing dengan gorilla/mux',
  chapter: 'Routing & Form',
  duration: '11 menit',
  intro: [
    'Router bawaan <b>net/http</b> bagus untuk hal sederhana, tetapi kurang nyaman untuk URL ber-parameter. Package populer <b>gorilla/mux</b> melengkapi kebutuhan itu: parameter bernama, batasan method, host, skema, hingga subrouter.',
    'gorilla/mux tetap memakai signature handler Go standar, sehingga mudah digabung dengan kode dan middleware yang ada.'
  ],
  objectives: [
    'Memasang package gorilla/mux',
    'Membuat router dan mendaftarkan handler',
    'Mengambil parameter URL dengan mux.Vars',
    'Membatasi route berdasarkan method, host, dan subrouter'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Router adalah pusat aplikasi web: ia menerima semua koneksi HTTP lalu meneruskannya ke handler yang cocok. gorilla/mux mengikuti signature handler net/http (<code>func(w, r)</code>) sehingga bisa dicampur dengan library lain. Pasang dengan <code>go get</code>.</p>'
    },
    {
      type: 'example',
      title: 'Memasang gorilla/mux',
      lang: 'bash',
      output: false,
      code: `go get -u github.com/gorilla/mux`,
      explain: [
        '<code>go get</code> mengunduh package dan mencatatnya di go.mod.',
        'Setelah terpasang, package bisa diimpor di kode mana pun dalam module.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat router & mendaftarkan handler',
      lang: 'go',
      output: false,
      code: `import "github.com/gorilla/mux"

// Buat router baru (bukan lagi memakai router default).
r := mux.NewRouter()

// Daftarkan handler di router, bukan di http.HandleFunc.
r.HandleFunc("/buku", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "Daftar buku")
})

// Pakai router kita sebagai parameter kedua ListenAndServe.
http.ListenAndServe(":80", r)`,
      explain: [
        '<code>nil</code> pada <code>ListenAndServe(":80", nil)</code> berarti router default. Ganti dengan <code>r</code> memakai router kita.',
        'Cara mendaftarkan handler sama seperti biasa, hanya objeknya router.',
        'gorilla/mux cocok dipadukan dengan handler net/http yang sudah ada.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kekuatan utama gorilla/mux adalah <b>parameter URL</b>. Sebuah alamat seperti <code>/books/go-programming-blueprint/page/10</code> memiliki dua segmen dinamis: judul buku dan nomor halaman. Kita menggantinya dengan placeholder di dalam tanda kurung kurawal.</p>'
    },
    {
      type: 'example',
      title: 'Mengambil parameter URL',
      lang: 'go',
      output: false,
      code: `r.HandleFunc("/books/{title}/page/{page}", func(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    title := vars["title"] // "go-programming-blueprint"
    page := vars["page"]   // "10"

    fmt.Fprintf(w, "Buku: %s, halaman %s\\n", title, page)
})`,
      explain: [
        '<code>{title}</code> dan <code>{page}</code> adalah placeholder segmen dinamis.',
        '<code>mux.Vars(r)</code> mengembalikan map nama-parameter ke nilainya.',
        'Nilai selalu berupa string; konversi sendiri bila butuh angka.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap routing',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"

    "github.com/gorilla/mux"
)

func main() {
    r := mux.NewRouter()

    r.HandleFunc("/books/{title}/page/{page}", func(w http.ResponseWriter, r *http.Request) {
        vars := mux.Vars(r)
        fmt.Fprintf(w, "Kamu meminta buku: %s di halaman %s\\n", vars["title"], vars["page"])
    })

    http.ListenAndServe(":80", r)
}`,
      explain: [
        'Router dibuat sekali di <code>main</code> lalu diisi semua route.',
        'Semua parameter tersedia lewat <code>mux.Vars(r)</code> di dalam handler.',
        'Klien cukup membuka <code>/books/belajar-go/page/3</code>.'
      ]
    },
    {
      type: 'text', // features
      html: '<p>gorilla/mux menyediakan banyak fitur tambahan untuk mengendalikan route. Berikut yang paling sering dipakai:</p><table class="vocab"><tr><th>Fitur</th><th>Fungsi</th></tr><tr><td><b>Methods</b></td><td>Batasi handler ke method HTTP tertentu (GET/POST/PUT/DELETE).</td></tr><tr><td><b>Host</b></td><td>Batasi ke hostname/subdomain tertentu.</td></tr><tr><td><b>Schemes</b></td><td>Batasi ke http atau https.</td></tr><tr><td><b>PathPrefix / Subrouter</b></td><td>Kelompokkan route berdasarkan awalan path.</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Method, host, skema & subrouter',
      lang: 'go',
      output: false,
      code: `// 1) Batasi berdasarkan method HTTP
r.HandleFunc("/books/{title}", CreateBook).Methods("POST")
r.HandleFunc("/books/{title}", ReadBook).Methods("GET")

// 2) Batasi berdasarkan host / subdomain
r.HandleFunc("/books/{title}", BookHandler).Host("www.tokobuku.com")

// 3) Batasi berdasarkan skema
r.HandleFunc("/aman", SecureHandler).Schemes("https")

// 4) Subrouter: kelompokkan route dengan awalan path
buku := r.PathPrefix("/books").Subrouter()
buku.HandleFunc("/", SemuaBuku)
buku.HandleFunc("/{title}", SatuBuku)`,
      explain: [
        'Satu path yang sama bisa punya handler berbeda untuk tiap method.',
        '<code>.Host(...)</code> berguna bila satu aplikasi melayani beberapa domain.',
        '<code>.Schemes(...)</code> memaksa route hanya lewat https.',
        'Subrouter menyederhanakan penulisan awalan path yang berulang.'
      ]
    },
    {
      type: 'tip',
      title: 'Standard library kini juga punya pola path',
      text: 'Sejak Go 1.22, <code>net/http</code> mendukung pola seperti <code>GET /books/{title}</code> secara bawaan. Namun gorilla/mux tetap berguna untuk fitur lanjutan seperti subrouter, host, dan skema. Pilih sesuai kebutuhan.'
    },
    {
      type: 'warn',
      title: 'Urutan & kekhususan route itu penting',
      text: 'Router mencocoki route berdasarkan pola. Route yang terlalu umum (mis. <code>/{apa-saja}</code> di depan) bisa "mencuri" permintaan dari route yang lebih spesifik. Daftarkan route paling spesifik lebih dahulu.'
    },
    {
      type: 'vocab',
      items: [
        ['Router', 'Objek yang meneruskan permintaan ke handler yang cocok.'],
        ['gorilla/mux', 'Package routing populer untuk Go.'],
        ['Parameter URL', 'Segmen dinamis pada path, mis. {title}.'],
        ['mux.Vars', 'Mengambil map parameter dari sebuah request.'],
        ['Subrouter', 'Router turunan dengan awalan path tertentu.'],
        ['Method', 'Kata kerja HTTP: GET, POST, PUT, DELETE, dst.']
      ]
    }
  ],
  recap: [
    'gorilla/mux melengkapi router net/http dengan banyak fitur.',
    'mux.NewRouter membuat router; teruskan ke http.ListenAndServe.',
    'Parameter URL ditulis {nama} dan dibaca dengan mux.Vars(r).',
    'Method, Host, Schemes, dan Subrouter membatasi pencocokan route.',
    'Daftarkan route paling spesifik lebih dulu.'
  ]
});

/* ---------- Pelajaran 4: Form & Parsing Data ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-forms',
  title: 'Form & Parsing Data menjadi Struct',
  chapter: 'Routing & Form',
  duration: '9 menit',
  intro: [
    'Form adalah cara paling umum pengguna mengirim data ke server: formulir kontak, pendaftaran, login, dan lain-lain. Go memudahkan membacanya lalu menaruhnya ke dalam sebuah <b>struct</b>.',
    'Pelajaran ini membuat formulir kontak sederhana: menampilkan form, memproses kiriman POST, lalu membalas ucapan terima kasih.'
  ],
  objectives: [
    'Membedakan permintaan GET dan POST',
    'Membaca nilai form menjadi struct',
    'Merender template untuk menampilkan form',
    'Mengirim data hasil ke template'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Handler kita menerima dua jenis kunjungan: pertama saat pengguna membuka halaman (method <b>GET</b>), dan kedua saat mengirim form (method <b>POST</b>). Kita bedakan dengan <code>r.Method</code>, lalu untuk POST kita baca setiap field dengan <code>r.FormValue</code>.</p>'
    },
    {
      type: 'example',
      title: 'Struct penerima data form',
      lang: 'go',
      output: false,
      code: `type ContactDetails struct {
    Email   string
    Subject string
    Message string
}`,
      explain: [
        'Setiap field mewakili satu input pada form.',
        'Struct membuat data terkumpul rapi dan mudah diteruskan ke fungsi lain.',
        'Nama field diawali huruf kapital agar bisa diakses template.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca form menjadi struct',
      lang: 'go',
      output: false,
      code: `http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    // Jika bukan POST, tampilkan form kosong.
    if r.Method != http.MethodPost {
        tmpl.Execute(w, nil)
        return
    }

    // Isi struct dari nilai-nilai form.
    details := ContactDetails{
        Email:   r.FormValue("email"),
        Subject: r.FormValue("subject"),
        Message: r.FormValue("message"),
    }

    _ = details // di sini data diproses: simpan / kirim email

    // Tampilkan halaman sukses.
    tmpl.Execute(w, struct{ Success bool }{true})
})`,
      explain: [
        '<code>r.Method</code> memeriksa kata kerja HTTP yang dipakai.',
        '<code>r.FormValue("email")</code> mencocoki atribut <code>name="email"</code> pada input.',
        '<code>struct{ Success bool }{true}</code> adalah struct anonim untuk mengirim penanda ke template.',
        'Selalu validasi & bersihkan data form sebelum dipakai (lihat bab keamanan).'
      ]
    },
    {
      type: 'text', // template
      html: '<p>Berikut template <code>forms.html</code> yang menampilkan form, dan menampilkan pesan terima kasih setelah data terkirim. Perhatikan penggunaan <code>{{if .Success}}</code>.</p>'
    },
    {
      type: 'example',
      title: 'Template form (forms.html)',
      lang: 'html',
      output: false,
      code: `{{if .Success}}
    <h1>Terima kasih atas pesanmu!</h1>
{{else}}
    <h1>Kontak</h1>
    <form method="POST">
        <label>Email:</label><br />
        <input type="text" name="email"><br />
        <label>Subjek:</label><br />
        <input type="text" name="subject"><br />
        <label>Pesan:</label><br />
        <textarea name="message"></textarea><br />
        <input type="submit">
    </form>
{{end}}`,
      explain: [
        '<code>{{if .Success}}</code> memilih tampilan berdasarkan data yang dikirim handler.',
        'Atribut <code>name</code> pada input harus sama dengan nama yang dibaca <code>r.FormValue</code>.',
        '<code>method="POST"</code> membuat data terkirim di body permintaan.',
        'Template akan otomatis meng-escape nilai agar aman dari XSS.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap form',
      lang: 'go',
      output: false,
      code: `package main

import (
    "html/template"
    "net/http"
)

type ContactDetails struct {
    Email   string
    Subject string
    Message string
}

func main() {
    tmpl := template.Must(template.ParseFiles("forms.html"))

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            tmpl.Execute(w, nil)
            return
        }

        details := ContactDetails{
            Email:   r.FormValue("email"),
            Subject: r.FormValue("subject"),
            Message: r.FormValue("message"),
        }
        _ = details

        tmpl.Execute(w, struct{ Success bool }{true})
    })

    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        '<code>template.Must</code> memastikan template valid atau program berhenti saat start.',
        'Handler yang sama melayani tampilan form (GET) dan pengiriman (POST).',
        'Jalankan dengan <code>go run forms.go</code> lalu buka <code>http://localhost:8080/</code>.',
        'Karena form memakai method POST, tidak ada data yang bocor di URL.'
      ]
    },
    {
      type: 'tip',
      title: 'Selalu validasi di sisi server',
      text: 'Pemeriksaan di sisi klien (JavaScript/atribut HTML) bisa dilewati penyerang. Validasi yang menentukan adalah yang dilakukan di server: periksa field wajib, panjang, dan format email sebelum diproses.'
    },
    {
      type: 'warn',
      title: 'Jangan percaya data dari luar',
      text: 'Nilai dari <code>r.FormValue</code> adalah data mentah dari pengguna. Jangan menyisipkannya langsung ke query SQL, perintah shell, atau HTML tanpa pemrosesan yang aman.'
    },
    {
      type: 'vocab',
      items: [
        ['GET', 'Method untuk mengambil halaman/data.'],
        ['POST', 'Method untuk mengirim data ke server.'],
        ['r.FormValue', 'Mengambil nilai field form berdasarkan name.'],
        ['Struct', 'Wadah bernama untuk mengelompokkan data.'],
        ['Struct anonim', 'Struct tanpa nama tipe, ditulis saat itu juga.'],
        ['Validasi server', 'Pemeriksaan data di server yang tidak bisa dilewati klien.']
      ]
    }
  ],
  recap: [
    'Handler membedakan GET (tampilkan form) dan POST (proses data).',
    'r.FormValue membaca nilai form; kelompokkan ke dalam struct.',
    'Template menampilkan form dan pesan sukses berdasarkan data.',
    'Atribut name pada input harus cocok dengan yang dibaca handler.',
    'Validasi selalu dilakukan di sisi server.'
  ]
});
