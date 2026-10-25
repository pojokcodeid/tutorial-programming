/* ============================================================
   Pelajaran Go — Bab 5: Fungsi (Functions)
   (topik info.md:
    - "Deklarasi fungsi dan parameter"
    - "Multiple Return Values"
    - "Named Return Values"
    - "Variadic Functions (parameter tak terbatas)"
    - "Anonymous Functions & Closures")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 14: Fungsi, Multiple & Named Return ---------- */
window.GO_LESSONS.push({
  id: 'fungsi-dasar',
  title: 'Fungsi, Multiple & Named Return',
  chapter: 'Fungsi',
  duration: '10 menit',
  intro: [
    'Fungsi adalah blok kode bernama yang bisa dipanggil berulang kali. Di Go, fungsi adalah warga kelas satu (first-class): ia bisa disimpan dalam variabel, dikirim sebagai argumen, bahkan dikembalikan dari fungsi lain.',
    'Pelajaran ini membahas deklarasi fungsi, parameter, serta keunggulan Go: mengembalikan <b>banyak nilai</b> sekaligus dan memberi <b>nama</b> pada nilai kembalian.'
  ],
  objectives: [
    'Mendeklarasikan fungsi dengan parameter dan nilai kembalian',
    'Mengembalikan beberapa nilai sekaligus',
    'Memakai named return values',
    'Memahami fungsi tanpa nilai kembalian'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bentuk umum: <code>func nama(parameter) tipeKembalian { ... }</code>. Tipe parameter ditulis setelah nama parameter, dan bila beberapa parameter bertipe sama, tipenya cukup ditulis sekali di akhir.</p>'
    },
    {
      type: 'example',
      title: 'Fungsi dasar',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Satu nilai kembalian
func tambah(a int, b int) int {
    return a + b
}

// Parameter bertipe sama boleh disingkat
func kali(a, b int) int {
    return a * b
}

// Tanpa nilai kembalian sama sekali
func sapa(nama string) {
    fmt.Println("Halo,", nama)
}

func main() {
    fmt.Println(tambah(3, 4))   // 7
    fmt.Println(kali(3, 4))     // 12
    sapa("Andi")
}`,
      explain: [
        'Tipe parameter ditulis setelah namanya: <code>a int</code>.',
        'Parameter sejenis bisa digabung: <code>a, b int</code>.',
        'Fungsi tanpa nilai kembalian tidak perlu menyebut tipe setelah tanda kurung.',
        '<code>return</code> mengakhiri fungsi dan mengembalikan nilai.'
      ]
    },
    {
      type: 'text',
      html: '<p>Salah satu keunggulan Go adalah <b>multiple return values</b>. Fitur ini dipakai hampir di mana-mana — terutama untuk mengembalikan hasil sekaligus error.</p>'
    },
    {
      type: 'example',
      title: 'Mengembalikan beberapa nilai',
      lang: 'go',
      output: false,
      code: `package main

import (
    "errors"
    "fmt"
)

func bagi(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("tidak bisa membagi dengan nol")
    }
    return a / b, nil
}

// Mengembalikan tiga nilai: min, max, rata-rata
func statistik(data []int) (int, int, float64) {
    total := 0
    min, max := data[0], data[0]
    for _, v := range data {
        total += v
        if v < min {
            min = v
        }
        if v > max {
            max = v
        }
    }
    return min, max, float64(total) / float64(len(data))
}

func main() {
    hasil, err := bagi(10, 2)
    if err != nil {
        fmt.Println("error:", err)
    } else {
        fmt.Println("hasil:", hasil)
    }

    lo, hi, avg := statistik([]int{5, 2, 9, 1})
    fmt.Println(lo, hi, avg)   // 1 9 4.25
}`,
      explain: [
        'Tipe kembalian ganda ditulis dalam tanda kurung: <code>(float64, error)</code>.',
        'Konvensi Go: <b>error selalu menjadi nilai terakhir</b>.',
        'Pemanggil menangkap semua nilai: <code>hasil, err := bagi(...)</code>.',
        'Nilai yang tidak dipakai bisa dibuang dengan <code>_</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Named return values</b> memberi nama pada nilai kembalian. Variabel ini otomatis dibuat pada awal fungsi dan bisa dipakai langsung. Bila <code>return</code> ditulis tanpa nilai (bare return), nilai yang dikembalikan adalah nilai variabel bernama itu saat itu.</p>'
    },
    {
      type: 'example',
      title: 'Named return values',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Nama hasil & err sudah "terdeklarasi" di tanda tangan.
func bagi(a, b float64) (hasil float64, err error) {
    if b == 0 {
        err = fmt.Errorf("pembagi nol")
        return              // bare return -> mengembalikan hasil & err
    }
    hasil = a / b
    return                  // bare return
}

// Kadang lebih jelas bila memakai return eksplisit
func panjangDanLebar() (p int, l int) {
    p = 10
    l = 5
    return p, l
}

func main() {
    h, err := bagi(8, 2)
    fmt.Println(h, err)     // 4 <nil>
    fmt.Println(panjangDanLebar())
}`,
      explain: [
        'Named return membuat tanda tangan fungsi lebih deskriptif.',
        'Setelah <code>return</code> tanpa nilai, Go mengembalikan variabel bernama apa adanya.',
        'Gunakan secara hemat: named return sangat berguna pada fungsi pendek, tetapi pada fungsi panjang bisa membingungkan.',
        'Tetap boleh memakai <code>return</code> dengan nilai eksplisit walau sudah diberi nama.'
      ]
    },
    {
      type: 'tip',
      title: 'Fungsi bisa jadi argumen dan nilai kembalian',
      text: 'Di Go, fungsi adalah nilai. Kamu bisa menyimpannya dalam variabel (<code>f := tambah</code>), mengirimnya ke fungsi lain, atau mengembalikannya. Kemampuan ini adalah dasar dari <b>closure</b> dan pola seperti middleware.'
    },
    {
      type: 'warn',
      title: 'Bare return bisa menyulitkan pembacaan',
      text: 'Pada fungsi dengan banyak baris, <code>return</code> tanpa nilai membuat kita harus menggulir ke atas untuk tahu apa yang dikembalikan. Untuk fungsi panjang, lebih baik gunakan return eksplisit.'
    },
    {
      type: 'vocab',
      items: [
        ['Fungsi', 'Blok kode bernama yang bisa dipanggil berulang.'],
        ['Parameter', 'Variabel masukan sebuah fungsi.'],
        ['Return value', 'Nilai yang dikembalikan fungsi.'],
        ['Multiple return', 'Mengembalikan lebih dari satu nilai sekaligus.'],
        ['Named return', 'Nilai kembalian yang diberi nama di tanda tangan fungsi.'],
        ['Bare return', 'Pernyataan return tanpa nilai, memakai named return.']
      ]
    }
  ],
  recap: [
    'Fungsi ditulis dengan func nama(parameter) tipeKembalian.',
    'Go mendukung multiple return; error selalu jadi nilai terakhir.',
    'Named return memberi nama pada nilai kembalian dan memungkinkan bare return.',
    'Nilai yang tidak dipakai dibuang dengan _.',
    'Fungsi adalah nilai: bisa disimpan, dioper, dan dikembalikan.'
  ]
});

/* ---------- Pelajaran 15: Variadic, Anonymous & Closures ---------- */
window.GO_LESSONS.push({
  id: 'variadic-closure',
  title: 'Variadic, Anonymous Functions & Closures',
  chapter: 'Fungsi',
  duration: '10 menit',
  intro: [
    'Fungsi di Go bisa menerima jumlah argumen yang <b>tidak tetap</b> lewat parameter <b>variadic</b>. Selain itu, Go juga mendukung fungsi tanpa nama (<b>anonymous</b>) dan <b>closure</b> — fungsi yang "mengingat" variabel di sekelilingnya.',
    'Ketiganya adalah alat penting untuk menulis kode yang ringkas dan lentur.'
  ],
  objectives: [
    'Membuat fungsi variadic',
    'Memahami cara kerja parameter ...T',
    'Menulis fungsi anonim dan memanggilnya langsung',
    'Membuat dan memahami closure'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Parameter <b>variadic</b> ditulis dengan tiga titik sebelum tipe: <code>...int</code>. Di dalam fungsi, parameter itu berupa <b>slice</b>, sehingga bisa di-iterasi seperti biasa.</p>'
    },
    {
      type: 'example',
      title: 'Fungsi variadic',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func jumlah(angka ...int) int {
    total := 0
    for _, n := range angka {
        total += n
    }
    return total
}

func sapaSemua(sapaan string, nama ...string) {
    for _, n := range nama {
        fmt.Println(sapaan + ", " + n)
    }
}

func main() {
    fmt.Println(jumlah(1, 2, 3))       // 6
    fmt.Println(jumlah())              // 0 (tidak ada argumen)
    fmt.Println(jumlah(5, 5, 5, 5))    // 20

    sapaSemua("Halo", "Andi", "Budi", "Citra")

    // Mengirim slice sebagai argumen variadic -> pakai ...
    data := []int{10, 20, 30}
    fmt.Println(jumlah(data...))       // 60
}`,
      explain: [
        '<code>angka ...int</code> membuat fungsi menerima berapa pun argumen int.',
        'Di dalam fungsi, <code>angka</code> bertipe <code>[]int</code>.',
        'Variadic harus menjadi parameter terakhir.',
        'Mengirim slice ke parameter variadic memerlukan tanda <code>...</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Fungsi anonim',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Fungsi anonim disimpan dalam variabel
    sapa := func(nama string) string {
        return "Halo, " + nama
    }
    fmt.Println(sapa("Andi"))

    // Langsung dipanggil (IIFE)
    func() {
        fmt.Println("Fungsi anonim langsung jalan")
    }()

    // Dikirim sebagai argumen
    jalankan(3, 4, func(a, b int) int {
        return a * b
    })
}

func jalankan(a, b int, operasi func(int, int) int) {
    fmt.Println("hasil:", operasi(a, b))
}`,
      explain: [
        'Fungsi anonim tidak punya nama dan sering disimpan dalam variabel.',
        'Dengan menambahkan <code>()</code> di akhir, fungsi langsung dijalankan (IIFE).',
        'Parameter bertipe fungsi ditulis <code>func(int, int) int</code>.',
        'Pola ini adalah dasar <i>callback</i> dan <i>higher-order function</i>.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Closure</b> adalah fungsi yang menangkap (mengingat) variabel dari lingkungan tempat ia dibuat. Ia bisa membaca — bahkan mengubah — variabel itu walau fungsi induknya sudah selesai dijalankan.</p>'
    },
    {
      type: 'example',
      title: 'Closure dengan pencacah',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// hitung() mengembalikan fungsi yang mengingat variabel "n".
func hitung() func() int {
    n := 0
    return func() int {
        n++          // mengubah variabel dari scope luar
        return n
    }
}

func main() {
    berikutnya := hitung()
    fmt.Println(berikutnya())   // 1
    fmt.Println(berikutnya())   // 2
    fmt.Println(berikutnya())   // 3

    // Setiap pemanggilan hitung() membuat variabel n yang baru
    lain := hitung()
    fmt.Println(lain())         // 1
}`,
      explain: [
        'Closure menangkap variabel <code>n</code> walaupun fungsi <code>hitung</code> sudah selesai.',
        'State <code>n</code> hidup selama closure masih dipakai.',
        'Pemanggilan <code>hitung()</code> kedua menghasilkan closure dengan <code>n</code> yang terpisah.',
        'Closure berguna untuk membuat generator, penghitung, atau fungsi berkonfigurasi.'
      ]
    },
    {
      type: 'example',
      title: 'Variadic + closure untuk perkakas fleksibel',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Membuat fungsi penjumlah dengan nilai awal tertentu
func penjumlah(awal int) func(...int) int {
    total := awal
    return func(angka ...int) int {
        for _, n := range angka {
            total += n
        }
        return total
    }
}

func main() {
    p := penjumlah(100)
    fmt.Println(p(1, 2, 3))   // 106
    fmt.Println(p(10))        // 116 (state tersimpan)
}`,
      explain: [
        'Fungsi mengembalikan closure variadic — kombinasi dua konsep.',
        'State <code>total</code> terus bertambah di tiap pemanggilan.',
        'Pola ini sering muncul pada API berbasis konfigurasi.'
      ]
    },
    {
      type: 'tip',
      title: 'Closure mengingat referensi, bukan salinan',
      text: 'Closure menangkap <b>variabel</b>, bukan nilainya pada saat itu. Kalau variabel berubah setelah closure dibuat, closure akan melihat nilai terbaru. Ini penting saat closure dipakai di dalam perulangan.'
    },
    {
      type: 'warn',
      title: 'Waspada closure di dalam for',
      text: 'Sebelum Go 1.22, variabel loop dipakai ulang di tiap iterasi sehingga closure bisa "menangkap" nilai yang sama. Cara aman: salin variabel ke variabel lokal di dalam loop (<code>v := v</code>). Mulai Go 1.22 variabel loop unik per iterasi, tetapi tetap waspada bila memakai versi lama.'
    },
    {
      type: 'vocab',
      items: [
        ['Variadic', 'Parameter yang menerima jumlah argumen tak terbatas (...T).'],
        ['Fungsi anonim', 'Fungsi tanpa nama yang biasanya disimpan dalam variabel.'],
        ['IIFE', 'Fungsi anonim yang langsung dipanggil saat dibuat.'],
        ['Higher-order function', 'Fungsi yang menerima atau mengembalikan fungsi lain.'],
        ['Closure', 'Fungsi yang menangkap variabel dari lingkungan pembuatnya.']
      ]
    }
  ],
  recap: [
    'Parameter variadic (...T) menerima jumlah argumen berapa pun dan bertipe slice.',
    'Slice dikirim ke parameter variadic dengan tanda ...',
    'Fungsi anonim tidak bernama dan bisa langsung dipanggil (IIFE).',
    'Fungsi dapat menjadi argumen maupun nilai kembalian.',
    'Closure mengingat dan bisa mengubah variabel dari lingkungannya.'
  ]
});
