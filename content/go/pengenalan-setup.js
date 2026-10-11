/* ============================================================
   Pelajaran Go — Bab 1: Pendahuluan
   (topik info.md:
    - "Pengenalan & Setup Lingkungan Kerja"
    - "Apa itu Go? (Kelebihan, kasus penggunaan, dan filosofi Go)"
    - "Instalasi Go & Konfigurasi Environment Variables (GOROOT, GOPATH)"
    - "Mengenal Go Modules (go mod init, go mod tidy)"
    - "Memahami struktur folder dan file .go"
    - "Program pertama: Hello World & perintah go run, go build")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 1: Pengenalan Go, Instalasi & Lingkungan ---------- */
window.GO_LESSONS.push({
  id: 'pengenalan-setup',
  title: 'Pengenalan Go, Instalasi & Lingkungan',
  chapter: 'Pendahuluan',
  duration: '12 menit',
  intro: [
    '<b>Go</b> (sering disebut <b>Golang</b>) adalah bahasa pemrograman yang dibuat oleh <b>Google</b> dan dirilis ke publik pada <b>2009</b>. Penciptanya adalah <b>Robert Griesemer</b>, <b>Rob Pike</b>, dan <b>Ken Thompson</b> — nama terakhir bahkan ikut menciptakan sistem operasi Unix dan bahasa C.',
    'Pelajaran ini menjelaskan apa itu Go, mengapa banyak perusahaan memakainya, serta memandu memasang Go dan mengenal variabel lingkungan (environment variables) penting seperti <b>GOROOT</b> dan <b>GOPATH</b>.'
  ],
  objectives: [
    'Memahami apa itu Go beserta kelebihan dan filosofinya',
    'Mengenal kasus penggunaan Go di dunia nyata',
    'Memasang Go di macOS, Linux, dan Windows',
    'Memahami GOROOT, GOPATH, dan PATH',
    'Menjalankan program Go pertama'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Go</b> adalah bahasa yang dirancang untuk <b>sederhana</b>, <b>cepat</b>, dan <b>mudah dirawat</b>. Ia menggabungkan tiga hal yang jarang menyatu: kemudahan bahasa dinamis seperti Python, kecepatan bahasa terkompilasi seperti C, dan dukungan <b>concurrency</b> (menjalankan banyak tugas bersamaan) yang sangat praktis.</p><p>Go dikompilasi menjadi satu berkas biner tunggal yang bisa langsung dijalankan — tanpa mesin virtual dan tanpa banyak berkas pendukung. Inilah mengapa Go sangat disukai untuk membuat layanan server dan alat command-line.</p>'
    },
    {
      type: 'text',
      html: '<p>Filosofi Go bisa dirangkum dalam beberapa moto yang terkenal di komunitasnya:</p><ul><li><b>"Simplicity is complicated"</b> — Go sengaja menolak banyak fitur demi kesederhanaan. Tidak ada class, tidak ada warisan (inheritance), tidak ada operator overloading.</li><li><b>"Clear is better than clever"</b> — kode harus mudah dibaca, bukan sekadar pintar.</li><li><b>"Do not communicate by sharing memory; share memory by communicating"</b> — cara Go mengajarkan concurrency lewat channel, bukan kunci global.</li><li><b>Format satu gaya</b> — alat <code>gofmt</code> memaksa satu gaya penulisan, sehingga tidak perlu berdebat soal spasi.</li></ul>'
    },
    {
      type: 'example',
      title: 'Kelebihan utama Go',
      lang: 'text',
      output: false,
      code: `1. Kompilasi sangat cepat   -> dari kode ke biner dalam hitungan detik
2. Biner tunggal, tanpa dependensi runtime
   -> cukup salin satu file untuk menyebarkan aplikasi
3. Concurrency bawaan (goroutine & channel)
   -> melayani ribuan permintaan sekaligus dengan mudah
4. Manajemen memori otomatis (garbage collector)
5. Standard library lengkap (HTTP server, JSON, kriptografi)
6. Cocok untuk lintas platform (cross-compile)
   -> bangun untuk Linux dari Mac sekali perintah`,
      explain: [
        'Popularitas Go meledak karena <b>Docker</b>, <b>Kubernetes</b>, dan <b>Terraform</b> — alat-alat infrastruktur paling penting saat ini — semuanya ditulis dengan Go.',
        'Perusahaan besar seperti Google, Uber, Dropbox, dan bahkan sebagian layanan Netflix memakai Go untuk sistem berkinerja tinggi.',
        'Go bukan pilihan pertama untuk aplikasi mobile atau analisis data ilmiah; di situ Python dan JavaScript lebih unggul.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kasus penggunaan Go yang paling umum:</p><table class="vocab"><tr><th>Bidang</th><th>Contoh Nyata</th></tr><tr><td>Layanan web &amp; API</td><td>REST API, microservices</td></tr><tr><td>Perkakas CLI</td><td>Docker, kubectl, terraform</td></tr><tr><td>Infrastruktur &amp; DevOps</td><td>Kubernetes, Prometheus</td></tr><tr><td>Pemrosesan jaringan</td><td>Proxy, load balancer, server gRPC</td></tr><tr><td>Sistem terdistribusi</td><td>Message broker, penyimpanan data</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p>Sebelum mulai menulis kode, kita perlu memasang <b>toolchain</b> Go. Cara termudah di setiap sistem operasi berbeda-beda. Setelah terpasang, perintah <code>go</code> akan tersedia di terminal.</p>'
    },
    {
      type: 'example',
      title: 'Memasang Go di tiap sistem operasi',
      lang: 'bash',
      output: false,
      code: `# macOS (paling mudah dengan Homebrew):
brew install go

# Linux (unduh berkas resmi lalu ekstrak ke /usr/local):
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz

# Windows:
# Unduh installer .msi dari https://go.dev/dl/ lalu jalankan.

# Cek apakah berhasil:
go version
# contoh keluaran: go version go1.22.5 darwin/arm64`,
      explain: [
        'Selalu unduh Go dari situs resmi <code>https://go.dev/dl/</code> — hindari sumber tidak jelas.',
        'Paket <code>.msi</code> di Windows dan <code>brew</code> di macOS otomatis mengatur PATH.',
        'Perintah <code>go version</code> adalah cek cepat apakah Go sudah siap dipakai.'
      ]
    },
    {
      type: 'text',
      html: '<p>Go memakai beberapa <b>environment variable</b> (variabel lingkungan). Yang paling penting untuk dipahami pemula adalah <b>GOROOT</b> dan <b>GOPATH</b>:</p><table class="vocab"><tr><th>Variabel</th><th>Artinya</th></tr><tr><td><b>GOROOT</b></td><td>Lokasi Go dipasang (mis. <code>/usr/local/go</code>). Biasanya diatur otomatis oleh installer.</td></tr><tr><td><b>GOPATH</b></td><td>Folder kerja pengguna. Sejak Go 1.11+ perannya berkurang karena ada Go Modules, tetapi masih dipakai untuk menyimpan cache &amp; biner.</td></tr><tr><td><b>PATH</b></td><td>Harus memuat <code>$GOROOT/bin</code> agar perintah <code>go</code> bisa dipanggil di mana saja.</td></tr><tr><td><b>GOBIN</b></td><td>Folder tempat hasil <code>go install</code> diletakkan (opsional).</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Melihat konfigurasi lingkungan Go',
      lang: 'bash',
      output: false,
      code: `# Tampilkan semua pengaturan lingkungan Go:
go env

# Lihat nilai tertentu saja:
go env GOROOT
go env GOPATH
go env GOOS GOARCH

# Mengubah pengaturan secara permanen:
go env -w GOPROXY=direct
go env -w GOFLAGS=-mod=mod`,
      explain: [
        '<code>go env</code> menampilkan seluruh pengaturan; ini cara tercepat mencari nilai GOROOT dan GOPATH.',
        '<code>GOOS</code> dan <code>GOARCH</code> menunjukkan sistem operasi dan arsitektur prosesor target.',
        '<code>go env -w</code> menyimpan pengaturan ke berkas konfigurasi agar berlaku untuk semua proyek.'
      ]
    },
    {
      type: 'example',
      title: 'Program Go pertama: Hello World',
      lang: 'go',
      output: false,
      code: `// Berkas: main.go
package main

import "fmt"

func main() {
    fmt.Println("Halo, Dunia! 👋")
}`,
      explain: [
        '<code>package main</code> menandai ini program yang bisa dijalankan (bukan library).',
        '<code>import "fmt"</code> memakai package <b>fmt</b> (format) dari standard library untuk mencetak teks.',
        '<code>func main()</code> adalah fungsi utama — titik mulai program. Go selalu memulainya dari sini.',
        '<code>fmt.Println</code> mencetak teks lalu pindah baris.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan & membangun program',
      lang: 'bash',
      output: false,
      code: `# Jalankan langsung (dikompilasi di memori, lalu dieksekusi):
go run main.go
# keluaran: Halo, Dunia! 👋

# Bangun menjadi biner (hasilnya file bernama "hello"):
go build -o hello main.go
./hello

# Cek format kode (Go sangat ketat soal gaya):
gofmt -w main.go`,
      explain: [
        '<b>go run</b> cocok untuk mencoba cepat — hasil kompilasi tidak disimpan.',
        '<b>go build</b> menghasilkan berkas biner yang bisa dibagikan tanpa perlu memasang Go di komputer tujuan.',
        '<b>gofmt</b> merapikan indentasi dan tata letak secara otomatis — biasakan menjalankannya.'
      ]
    },
    {
      type: 'tip',
      title: 'Coba Go tanpa memasang apa pun',
      text: 'Ingin mencoba tanpa instalasi? Buka <b>Go Playground</b> di https://go.dev/play/ — kamu bisa menulis dan menjalankan kode Go langsung di browser. Namun untuk proyek sungguhan, tetap pasang Go di komputermu.'
    },
    {
      type: 'warn',
      title: 'Satu fungsi main per package main',
      text: 'Program Go hanya boleh memiliki <b>satu</b> fungsi <code>main()</code> di dalam package <code>main</code>. Jika kamu menaruh dua fungsi main dalam satu folder, kompilasi akan gagal.'
    },
    {
      type: 'vocab',
      items: [
        ['Go / Golang', 'Bahasa pemrograman terkompilasi buatan Google, rilis 2009.'],
        ['Toolchain', 'Kumpulan alat (compiler, gofmt, go test) yang dipasang bersama Go.'],
        ['GOROOT', 'Folder tempat Go dipasang.'],
        ['GOPATH', 'Folder kerja pengguna; kini dipakai untuk cache dan biner hasil go install.'],
        ['Biner (binary)', 'Berkas hasil kompilasi yang bisa langsung dijalankan sistem operasi.'],
        ['gofmt', 'Alat perapi kode Go yang menyeragamkan gaya penulisan.'],
        ['Standard library', 'Kumpulan package bawaan Go tanpa perlu unduh tambahan.']
      ]
    }
  ],
  recap: [
    'Go adalah bahasa terkompilasi yang cepat, sederhana, dan punya concurrency bawaan.',
    'Go menghasilkan satu biner tunggal sehingga mudah didistribusikan.',
    'GOROOT adalah lokasi instalasi Go; GOPATH adalah folder kerja pengguna.',
    'Program Go dimulai dari fungsi main() di package main.',
    'Gunakan go run untuk mencoba cepat dan go build untuk menghasilkan biner.'
  ]
});

/* ---------- Pelajaran 2: Go Modules, Struktur Proyek & Hello World ---------- */
window.GO_LESSONS.push({
  id: 'modules-struktur',
  title: 'Go Modules, Struktur Proyek & Hello World',
  chapter: 'Pendahuluan',
  duration: '11 menit',
  intro: [
    'Setelah Go terpasang, langkah berikutnya adalah <b>menata proyek</b>. Go memiliki cara khas untuk mengelola dependensi (pustaka pihak ketiga) yang disebut <b>Go Modules</b>.',
    'Pelajaran ini memandu membuat modul baru, mengenal struktur folder proyek Go, serta memahami anatomi sebuah berkas <code>.go</code>.'
  ],
  objectives: [
    'Membuat modul Go dengan go mod init',
    'Merapikan dependensi dengan go mod tidy',
    'Memahami struktur folder proyek Go yang rapi',
    'Mengenal bagian-bagian berkas .go (package, import, func)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Go Modules</b> adalah sistem manajemen dependensi resmi Go (sejak versi 1.11). Sebuah <b>module</b> adalah kumpulan package yang dirilis dan dikelola bersama, ditandai oleh berkas <b>go.mod</b> di akar proyek. Berkas ini mencatat nama module dan daftar pustaka yang dipakai beserta versinya.</p>'
    },
    {
      type: 'example',
      title: 'Membuat module baru',
      lang: 'bash',
      output: false,
      code: `# Buat folder proyek lalu masuk ke dalamnya:
mkdir hello-go && cd hello-go

# Inisialisasi module. Nama module sebaiknya berupa
# alamat repositori (mis. github.com/namamu/hello-go):
go mod init github.com/namamu/hello-go
# keluaran: go: creating new go.mod: module github.com/namamu/hello-go

# Setelah menambah dependency di kode, rapikan go.mod & go.sum:
go mod tidy`,
      explain: [
        '<code>go mod init</code> membuat berkas <code>go.mod</code> berisi nama module dan versi Go.',
        '<code>go mod tidy</code> menambah dependensi yang kurang dan membuang yang tidak terpakai.',
        'Nama module berperan sebagai <b>alamat paket</b> saat kode ini diimpor proyek lain.'
      ]
    },
    {
      type: 'example',
      title: 'Isi berkas go.mod',
      lang: 'go',
      output: false,
      code: `module github.com/namamu/hello-go

go 1.22

require (
    github.com/google/uuid v1.6.0
    github.com/gorilla/mux v1.8.1
)`,
      explain: [
        'Baris <code>module</code> menetapkan identitas module.',
        '<code>go 1.22</code> menandakan versi bahasa Go minimum yang dibutuhkan.',
        'Blok <code>require</code> mendaftar pustaka pihak ketiga beserta versinya.',
        'Berkas <b>go.sum</b> yang menyertainya menyimpan checksum untuk keamanan — jangan diedit manual.'
      ]
    },
    {
      type: 'text',
      html: '<p>Berikut struktur folder proyek Go yang umum dipakai. Tidak ada aturan mutlak, tetapi pola ini membantumu menata kode agar mudah dibaca dan dirawat.</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder proyek Go yang rapi',
      lang: 'text',
      output: false,
      code: `hello-go/
├── go.mod              # identitas module & daftar dependency
├── go.sum              # checksum dependency (dibuat otomatis)
├── main.go             # titik masuk (package main)
├── internal/           # kode yang tidak boleh diimpor proyek luar
│   └── user/
│       └── user.go
├── pkg/                # kode yang boleh dipakai ulang proyek lain
│   └── email/
│       └── email.go
└── cmd/                # jika punya lebih dari satu program
    └── server/
        └── main.go`,
      explain: [
        'Folder <b>internal/</b> khusus: package di dalamnya hanya bisa diimpor oleh kode di module yang sama.',
        'Folder <b>pkg/</b> menampung kode yang memang ingin dibagikan ke proyek lain.',
        'Folder <b>cmd/</b> dipakai bila satu module menghasilkan beberapa biner terpisah.',
        'Untuk proyek kecil, cukup <code>main.go</code> dan <code>go.mod</code> saja.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sekarang mari bedah sebuah berkas <code>.go</code> dari atas ke bawah. Setiap berkas Go selalu dimulai dengan deklarasi <b>package</b>, lalu <b>import</b>, lalu deklarasi fungsi, tipe, dan variabel.</p>'
    },
    {
      type: 'example',
      title: 'Anatomi berkas main.go',
      lang: 'go',
      output: false,
      code: `// 1) Deklarasi package — wajib ada di baris awal.
package main

// 2) Blok import — daftar package lain yang dipakai.
import (
    "fmt"
    "strings"
)

// 3) Fungsi main — titik mulai program yang bisa dijalankan.
func main() {
    nama := "  Dunia  "
    pesan := "Halo, " + strings.TrimSpace(nama) + "!"
    fmt.Println(pesan)
}`,
      explain: [
        'Baris komentar diawali <code>//</code> (satu baris) atau dibungkus <code>/* ... */</code> (banyak baris).',
        'Package <code>main</code> berarti berkas ini bagian dari program yang dijalankan.',
        '<code>strings.TrimSpace</code> adalah contoh memakai package dari standard library.',
        'Kode Go tidak memerlukan tanda titik koma di akhir baris — compiler menambahkannya otomatis.'
      ]
    },
    {
      type: 'example',
      title: 'Menambah dependency pihak ketiga',
      lang: 'bash',
      output: false,
      code: `# Unduh & tambahkan sebuah package:
go get github.com/google/uuid

# Unduh versi tertentu:
go get github.com/google/uuid@v1.6.0

# Perbarui semua dependency ke versi terbaru yang kompatibel:
go get -u ./...

# Bersihkan yang tidak terpakai:
go mod tidy`,
      explain: [
        '<code>go get</code> mengunduh package dan mencatatnya di <code>go.mod</code>.',
        '<code>@v1.6.0</code> mengunci versi tertentu agar hasil konsisten.',
        'Selalu jalankan <code>go mod tidy</code> sebelum commit agar daftar dependency tetap bersih.'
      ]
    },
    {
      type: 'tip',
      title: 'Cache module ada di komputer',
      text: 'Package yang diunduh disimpan di <code>GOPATH/pkg/mod</code>. Karena itu mengunduh package yang sama untuk proyek kedua hampir instan. Untuk membersihkan cache, jalankan <code>go clean -modcache</code>.'
    },
    {
      type: 'warn',
      title: 'Jangan edit go.sum dengan tangan',
      text: 'Berkas <code>go.sum</code> berisi checksum untuk memastikan dependency tidak diubah diam-diam. Menyuntingnya manual bisa merusak verifikasi. Biarkan Go yang mengurusnya lewat <code>go mod tidy</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Module', 'Kumpulan package yang dikelola bersama, ditandai berkas go.mod.'],
        ['go.mod', 'Berkas identitas module: nama module, versi Go, dan daftar dependency.'],
        ['go.sum', 'Berkas checksum dependency untuk keamanan.'],
        ['package', 'Deklarasi awal setiap berkas .go yang mengelompokkan kode.'],
        ['import', 'Mekanisme memakai kode dari package lain.'],
        ['go get', 'Perintah menambah/memperbarui dependency.'],
        ['go mod tidy', 'Merapikan daftar dependency agar sesuai isi kode.']
      ]
    }
  ],
  recap: [
    'Go Modules menandai proyek dengan berkas go.mod dan mengelola dependency lewat go.sum.',
    'go mod init membuat module, go mod tidy merapikan dependency.',
    'Struktur folder umum: main.go, internal/, pkg/, dan cmd/.',
    'Setiap berkas .go dimulai dengan package, lalu import, lalu deklarasi.',
    'Package main dengan fungsi main() adalah program yang bisa dijalankan.'
  ]
});
