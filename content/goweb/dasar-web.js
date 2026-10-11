/* ============================================================
   Pelajaran Go Web Examples — Bab 1: Dasar Web
   (materi dari https://gowebexamples.com/)
    - "Hello World"
    - "HTTP Server"
   ============================================================ */
'use strict';

window.GOWEB_LESSONS = window.GOWEB_LESSONS || [];

/* ---------- Pelajaran 1: Hello World & Handler Pertama ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-hello-world',
  title: 'Hello World & Handler Pertama',
  chapter: 'Dasar Web',
  duration: '9 menit',
  intro: [
    'Go disebut bahasa "baterai sudah termasuk" karena <b>web server sudah ada di dalamnya</b>. Package <b>net/http</b> dari standard library menyediakan semua fungsi protokol HTTP — mulai dari klien hingga server.',
    'Di pelajaran ini kita membuat server web pertama: menerima permintaan dari browser lalu membalasnya dengan sebuah pesan.'
  ],
  objectives: [
    'Memahami fungsi handler pada net/http',
    'Mendaftarkan handler dengan http.HandleFunc',
    'Menjalankan server dengan http.ListenAndServe',
    'Membaca informasi permintaan dari *http.Request'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebuah <b>handler</b> adalah fungsi yang menerima setiap koneksi HTTP yang masuk dari browser atau klien API. Di Go, handler memiliki bentuk yang khas — dua parameter dan tanpa nilai kembali:</p>'
    },
    {
      type: 'example',
      title: 'Signature sebuah handler',
      lang: 'go',
      output: false,
      code: `func (w http.ResponseWriter, r *http.Request)`,
      explain: [
        '<code>http.ResponseWriter</code> adalah "pulpen" tempat kita menulis balasan (teks/HTML) ke klien.',
        '<code>*http.Request</code> memuat seluruh informasi permintaan: URL, header, method, body, dan sebagainya.',
        'Karena bentuknya selalu sama, handler mudah dibungkus middleware (dibahas nanti).'
      ]
    },
    {
      type: 'text',
      html: '<p>Mendaftarkan handler ke server default semudah memanggil <code>http.HandleFunc(path, fungsi)</code>. Fungsi anonim sering dipakai supaya ringkas.</p>'
    },
    {
      type: 'example',
      title: 'Mendaftarkan handler',
      lang: 'go',
      output: false,
      code: `http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Halo, kamu meminta: %s\\n", r.URL.Path)
})`,
      explain: [
        'Argumen pertama adalah pola path; <code>"/"</code> cocok untuk semua path.',
        '<code>fmt.Fprintf(w, ...)</code> menulis teks terformat ke ResponseWriter.',
        '<code>r.URL.Path</code> berisi path yang diminta pengunjung.',
        '<code>%s</code> adalah placeholder untuk string di dalam format.'
      ]
    },
    {
      type: 'text',
      html: '<p>Handler saja belum bisa menerima koneksi. Server harus <b>mendengarkan (listen)</b> sebuah port. Kode berikut menyalakan server default Go pada port 80, lalu kita bisa membuka <code>http://localhost/</code> di browser.</p>'
    },
    {
      type: 'example',
      title: 'Menyalakan server — kode lengkap',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Halo, kamu meminta: %s\\n", r.URL.Path)
    })

    // Salurkan koneksi ke handler di atas.
    http.ListenAndServe(":80", nil)
}`,
      explain: [
        'Baris kedua <code>nil</code> pada <code>ListenAndServe</code> berarti memakai router default net/http.',
        '<code>http.ListenAndServe</code> memblokir program selama server hidup.',
        'Buka <code>http://localhost/</code> dan server akan menjawab setiap path yang kamu minta.',
        'Setiap permintaan baru dijalankan di <b>goroutine</b> tersendiri, jadi server melayani banyak pengunjung sekaligus.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan server',
      lang: 'bash',
      output: false,
      code: `go run main.go
# lalu buka http://localhost/ di browser

# Jika ingin port lain (mis. 8080) ubah menjadi:
# http.ListenAndServe(":8080", nil)`,
      explain: [
        'Port 80 adalah port standar HTTP, tetapi sering butuh hak akses administrator.',
        'Untuk pengembangan, pakai port tinggi seperti 8080 untuk menghindari konflik izin.',
        'Hentikan server dengan Ctrl+C.'
      ]
    },
    {
      type: 'tip',
      title: 'Pakai `:8080` saat mengembangkan',
      text: 'Menjalankan server di port 80 (<code>:80</code>) membutuhkan hak root/admin di banyak sistem. Selama belajar, gunakan <code>:8080</code> lalu akses <code>http://localhost:8080/</code>.'
    },
    {
      type: 'warn',
      title: 'Jangan mengabaikan error di kode sungguhan',
      text: 'Contoh di situs menulis <code>http.ListenAndServe(":80", nil)</code> tanpa memeriksa error agar ringkas. Di aplikasi nyata, selalu periksa: <code>log.Fatal(http.ListenAndServe(":80", nil))</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Handler', 'Fungsi penerima permintaan HTTP dengan signature (w, r).'],
        ['ResponseWriter', 'Objek untuk menulis balasan ke klien.'],
        ['*http.Request', 'Objek berisi seluruh informasi permintaan.'],
        ['http.HandleFunc', 'Mendaftarkan handler ke router default.'],
        ['http.ListenAndServe', 'Menyalakan server pada alamat/port tertentu.'],
        ['Goroutine', 'Eksekusi ringan yang membuat server melayani banyak permintaan bersamaan.']
      ]
    }
  ],
  recap: [
    'Package net/http sudah menyediakan web server lengkap.',
    'Handler Go selalu berbentuk func(w http.ResponseWriter, r *http.Request).',
    'http.HandleFunc mendaftarkan handler pada sebuah path.',
    'http.ListenAndServe menyalakan server; parameter kedua nil berarti router default.',
    'Setiap permintaan dilayani goroutine terpisah sehingga server konkuren.'
  ]
});

/* ---------- Pelajaran 2: HTTP Server & Berkas Statis ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-http-server',
  title: 'HTTP Server: Permintaan Dinamis & Aset',
  chapter: 'Dasar Web',
  duration: '10 menit',
  intro: [
    'Sebuah server web dasar punya tiga tugas: <b>memproses permintaan dinamis</b>, <b>menyajikan aset statis</b> (CSS, JavaScript, gambar), dan <b>menerima koneksi</b> pada sebuah port.',
    'Pelajaran ini membangun ketiganya memakai net/http, termasuk membaca parameter dari URL dan form.'
  ],
  objectives: [
    'Memproses permintaan dinamis dengan http.HandleFunc',
    'Membaca parameter GET dan nilai form',
    'Menyajikan berkas statis dengan http.FileServer',
    'Memahami fungsi http.StripPrefix'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Permintaan dinamis</b> adalah permintaan yang jawabannya dibuat saat itu juga: pengguna membuka situs, masuk ke akun, atau mengirim data. Package net/http menyediakan semua alatnya, dan kita cukup mendaftarkan handler.</p>'
    },
    {
      type: 'example',
      title: 'Menangani permintaan dinamis',
      lang: 'go',
      output: false,
      code: `http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "Selamat datang di situs saya!")
})`,
      explain: [
        '<code>fmt.Fprint</code> menulis tanpa format tambahan (bandingkan <code>Fprintf</code>).',
        'Handler dipanggil setiap kali ada pengunjung mencocoki path <code>"/"</code>.',
        'Isi balasan bisa berupa teks biasa, HTML, atau data lain sesuai keinginan.'
      ]
    },
    {
      type: 'text',
      html: '<p>Karena HTTP bersifat "tanpa keadaan", data dari pengguna dikirim lewat URL maupun body. Objek <code>*http.Request</code> memuat keduanya.</p>'
    },
    {
      type: 'example',
      title: 'Membaca parameter GET dan form',
      lang: 'go',
      output: false,
      code: `// ?token=abc123  ->  "abc123"
token := r.URL.Query().Get("token")

// <input name="email"> dari form  ->  nilainya
email := r.FormValue("email")`,
      explain: [
        '<code>r.URL.Query()</code> mengembalikan semua parameter query di URL.',
        '<code>Get("token")</code> mengambil satu nilai berdasarkan nama.',
        '<code>r.FormValue("email")</code> bekerja untuk data form (GET maupun POST).'
      ]
    },
    {
      type: 'text', // static assets
      html: '<p>Untuk <b>menyajikan aset statis</b> (CSS, JS, gambar) kita memakai <code>http.FileServer</code> yang diarahkan ke sebuah folder. Kita juga perlu memberi tahu folder mana yang menjadi sumbernya.</p>'
    },
    {
      type: 'example',
      title: 'Menyiapkan file server',
      lang: 'go',
      output: false,
      code: `// Sajikan berkas dari folder "static/"
fs := http.FileServer(http.Dir("static/"))

// Petakan URL /static/ ke file server, tetapi buang awalan "/static/"
// agar berkas ditemukan dengan benar relatif terhadap folder.
http.Handle("/static/", http.StripPrefix("/static/", fs))`,
      explain: [
        '<code>http.Dir("static/")</code> menunjuk folder sumber berkas.',
        '<code>http.StripPrefix</code> membuang awalan <code>/static/</code> sebelum mencari berkas.',
        'Tanpa StripPrefix, server akan mencari <code>static/static/...</code> dan gagal.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap HTTP server',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Selamat datang di situs saya!")
    })

    // Aset statis di folder ./static, diakses lewat /static/...
    fs := http.FileServer(http.Dir("static/"))
    http.Handle("/static/", http.StripPrefix("/static/", fs))

    http.ListenAndServe(":80", nil)
}`,
      explain: [
        'Satu server dapat menangani permintaan dinamis dan statis sekaligus.',
        'Struktur folder: <code>static/css/styles.css</code>, <code>static/js/app.js</code>, dan seterusnya.',
        'Akses aset lewat <code>http://localhost/static/css/styles.css</code>.',
        'Urutan pendaftaran tidak masalah — router net/http mencocoki pola paling spesifik.'
      ]
    },
    {
      type: 'tip',
      title: 'Folder statis umum: `static/`, `public/`, atau `assets/`',
      text: 'Tidak ada nama baku. Pilih satu dan konsisten. Yang penting, jangan tempatkan berkas rahasia (mis. <code>.env</code>) di folder yang disajikan.' 
    },
    {
      type: 'warn',
      title: 'File server menyajikan isi folder apa adanya',
      text: 'Jangan arahkan <code>http.FileServer</code> ke folder root proyek. Batasi ke folder aset khusus agar berkode sumber, konfigurasi, atau berkas rahasia tidak bisa diunduh pengunjung.'
    },
    {
      type: 'vocab',
      items: [
        ['Statis', 'Aset yang isinya tetap: CSS, JS, gambar.'],
        ['Dinamis', 'Balasan yang dibuat saat permintaan datang.'],
        ['http.FileServer', 'Handler bawaan untuk menyajikan berkas dari folder.'],
        ['http.Dir', 'Tipe yang menunjuk direktori sumber berkas.'],
        ['http.StripPrefix', 'Membuang awalan URL sebelum berkas dicari.'],
        ['r.FormValue', 'Mengambil nilai dari parameter form/query.']
      ]
    }
  ],
  recap: [
    'Server web dasar menangani permintaan dinamis, aset statis, dan koneksi masuk.',
    'r.URL.Query().Get dan r.FormValue membaca data dari pengguna.',
    'http.FileServer + http.Dir menyajikan berkas statis.',
    'http.StripPrefix membuang awalan URL agar berkas ditemukan.',
    'Jangan pernah menyajikan folder yang memuat berkas rahasia.'
  ]
});
