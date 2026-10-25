/* ============================================================
   Pelajaran Go — Bab 9: Package & Module Management
   (topik info.md:
    - "Membuat dan mengorganisir kustom package
       (Public vs Private / Exported vs Unexported identifier)"
    - "Mengelola dependency dengan go.mod dan go.sum"
    - "Mengunduh package pihak ketiga (go get)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 22: Package Kustom & Manajemen Dependensi ---------- */
window.GO_LESSONS.push({
  id: 'package-module',
  title: 'Package Kustom & Manajemen Dependensi',
  chapter: 'Package & Module',
  duration: '12 menit',
  intro: [
    'Seiring proyek tumbuh, menaruh semua kode dalam satu berkas menjadi kacau. Go mengelompokkan kode ke dalam <b>package</b> — satu folder biasanya satu package.',
    'Pelajaran ini membahas membuat package sendiri, aturan <b>exported</b> vs <b>unexported</b>, serta mengelola dependensi lewat <code>go.mod</code>, <code>go.sum</code>, dan <code>go get</code>.'
  ],
  objectives: [
    'Membuat dan memakai package sendiri',
    'Memahami aturan exported vs unexported',
    'Mengimpor package lokal dengan nama module',
    'Mengelola dependency: go.mod, go.sum, dan go get'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebuah <b>package</b> adalah kumpulan berkas <code>.go</code> dalam satu folder yang dideklarasikan dengan nama package yang sama. Package <code>main</code> istimewa: ia menghasilkan program yang bisa dijalankan. Package lain adalah <b>library</b> yang dipakai package lain.</p>'
    },
    {
      type: 'example',
      title: 'Struktur dua package',
      lang: 'text',
      output: false,
      code: `hello-go/
├── go.mod                       (module hello-go)
├── main.go                      (package main)
└── matematika/
    └── matematika.go            (package matematika)`,
      explain: [
        'Folder <code>matematika/</code> berisi package <code>matematika</code>.',
        'Di dalamnya kita letakkan fungsi-fungsi yang bisa dipakai package lain.',
        'Nama folder dan nama package sebaiknya sama agar mudah dicari.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat package matematika',
      lang: 'go',
      output: false,
      code: `// Berkas: matematika/matematika.go
package matematika

// Tambah diekspor (huruf kapital) -> bisa dipakai dari luar
func Tambah(a, b int) int {
    return a + b
}

// kali disembunyikan (huruf kecil) -> hanya untuk package ini
func kali(a, b int) int {
    return a * b
}

// KaliDua memakai fungsi privat "kali" di dalamnya
func KaliDua(a int) int {
    return kali(a, 2)
}`,
      explain: [
        'Identifier diawali <b>huruf kapital</b> (<code>Tambah</code>) bersifat <b>exported</b> — dapat diakses package lain.',
        'Identifier diawali <b>huruf kecil</b> (<code>kali</code>) bersifat <b>unexported</b> — privat bagi package ini.',
        'Ini cara Go menerapkan enkapsulasi tanpa kata kunci public/private.',
        'Package lain cukup tahu fungsi exported; detail internal tersembunyi.'
      ]
    },
    {
      type: 'example',
      title: 'Mengimpor package lokal',
      lang: 'go',
      output: false,
      code: `// Berkas: main.go
package main

import (
    "fmt"

    "hello-go/matematika"    // <-- nama module + /folder
)

func main() {
    hasil := matematika.Tambah(3, 4)
    fmt.Println("3 + 4 =", hasil)

    // matematika.kali(3, 4)  // ERROR: kali tidak diekspor
    fmt.Println("KaliDua(5) =", matematika.KaliDua(5))
}`,
      explain: [
        'Import package lokal memakai <b>nama module</b> (dari go.mod) diikuti jalur folder.',
        'Memanggil fungsi exported dengan <code>namaPackage.Fungsi</code>.',
        'Fungsi unexported tidak bisa diakses dari package lain — ini fitur, bukan batasan.',
        'Awali import dengan huruf kapital/kecil sesuai kesepakatan; gofmt akan mengelompokkannya.'
      ]
    },
    {
      type: 'example',
      title: 'Alias dan blank import',
      lang: 'go',
      output: false,
      code: `package main

import (
    // Alias: memakai nama pendek
    mtk "hello-go/matematika"

    // Blank import: hanya menjalankan init(), tidak memakai nama
    _ "net/http/pprof"

    // Titik: membawa identifier langsung ke scope (hindari!)
    // . "hello-go/matematika"
)

func main() {
    _ = mtk.KaliDua(10)
}`,
      explain: [
        'Alias <code>mtk</code> membuat pemanggilan lebih pendek.',
        'Blank import (<code>_</code>) menjalankan efek samping (biasanya <code>init()</code>) tanpa memakai package secara langsung.',
        'Import titik (<code>.</code>) membawa semua identifier ke scope saat ini — jarang dipakai karena mengaburkan asal nama.',
        'Hindari import yang tidak dipakai; Go akan menolak mengompilasi.'
      ]
    },
    {
      type: 'text', // dependency
      html: '<p>Untuk memakai pustaka pihak ketiga (mis. framework web atau driver database), gunakan <code>go get</code>. Perintah ini mengunduh package dan mencatatnya di <code>go.mod</code> (versi) dan <code>go.sum</code> (checksum).</p>'
    },
    {
      type: 'example',
      title: 'Mengelola dependency',
      lang: 'bash',
      output: false,
      code: `# Unduh dan tambahkan dependency
go get github.com/go-sql-driver/mysql

# Versi tertentu
go get github.com/go-sql-driver/mysql@v1.8.1

# Perbarui semua dependency ke versi kompatibel terbaru
go get -u ./...

# Rapikan go.mod & go.sum (hapus yang tak terpakai)
go mod tidy

# Unduh semua dependency tanpa mengubah go.mod (untuk CI)
go mod download

# Lihat daftar module yang dipakai
go list -m all`,
      explain: [
        '<code>go get</code> mengunduh dan mencatat dependency dalam satu langkah.',
        '<code>@v1.8.1</code> mengunci versi agar build konsisten di semua komputer.',
        '<code>go mod tidy</code> menjaga go.mod tetap akurat sesuai kode.',
        '<code>go mod download</code> berguna di server CI yang memulai dari repo bersih.'
      ]
    },
    {
      type: 'example',
      title: 'Isi go.mod setelah menambah dependency',
      lang: 'go',
      output: false,
      code: `module hello-go

go 1.22

require github.com/go-sql-driver/mysql v1.8.1

require (
    filippo.io/edwards25519 v1.1.0 // indirect
)`,
      explain: [
        'Dependency yang kita impor langsung ditulis pada require utama.',
        'Tanda <code>// indirect</code> menandai dependency yang hanya dibutuhkan secara tidak langsung.',
        'go.sum yang terpisah menyimpan hash untuk verifikasi keamanan.',
        'Jangan mengubah go.mod/go.sum manual bila bisa dihindari — biarkan perintah go yang mengurus.'
      ]
    },
    {
      type: 'tip',
      title: 'Gunakan GOPROXY',
      text: 'Go mengunduh module dari proxy yang dikonfigurasi (default: proxy.golang.org). Bila jaringanmu bermasalah, atur <code>go env -w GOPROXY=direct</code> untuk mengambil langsung dari sumber, atau gunakan proxy lokal perusahaan.'
    },
    {
      type: 'warn',
      title: 'Package main tidak bisa diimpor',
      text: 'Package <code>main</code> hanya untuk program yang dijalankan dan tidak bisa diimpor package lain. Pindahkan kode yang ingin dipakai ulang ke package lain dengan nama berbeda (mis. <code>app</code> atau <code>internal/...</code>).'
    },
    {
      type: 'vocab',
      items: [
        ['Package', 'Kumpulan berkas .go dalam satu folder dengan nama package sama.'],
        ['Exported', 'Identifier berawalan huruf kapital; dapat diakses package lain.'],
        ['Unexported', 'Identifier berawalan huruf kecil; privat bagi package.'],
        ['Dependency', 'Pustaka lain yang dibutuhkan proyekmu.'],
        ['go.mod', 'Berkas catatan module dan daftar dependency.'],
        ['go.sum', 'Berkas checksum dependency.'],
        ['GOPROXY', 'Sumber tempat Go mengunduh module.']
      ]
    }
  ],
  recap: [
    'Satu folder biasanya satu package; package main menghasilkan program.',
    'Huruf kapital = exported; huruf kecil = unexported (privat).',
    'Package lokal diimpor memakai nama module + jalur folder.',
    'go get menambah dependency; go mod tidy merapikannya.',
    'go.mod mencatat versi dan go.sum menyimpan checksum untuk keamanan.'
  ]
});
