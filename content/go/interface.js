/* ============================================================
   Pelajaran Go — Bab 7: Interface & Type System
   (topik info.md:
    - "Konsep Implicit Interface di Go"
    - "Empty Interface (interface{} / any)"
    - "Type Assertion & Type Switches")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 18: Interface Implicit & Empty Interface ---------- */
window.GO_LESSONS.push({
  id: 'interface',
  title: 'Interface Implicit & Empty Interface',
  chapter: 'Interface & Type System',
  duration: '11 menit',
  intro: [
    '<b>Interface</b> adalah kumpulan tanda tangan method. Tipe apa pun yang memiliki semua method itu otomatis dianggap memenuhi interface tersebut — <b>tanpa</b> perlu mendeklarasikan "implements" seperti bahasa lain.',
    'Konsep inilah yang membuat Go sangat fleksibel: perilaku didefinisikan oleh apa yang bisa dilakukan sebuah nilai, bukan oleh jenisnya.'
  ],
  objectives: [
    'Memahami apa itu interface',
    'Memahami konsep implicit interface (duck typing) di Go',
    'Memakai interface{} / any',
    'Menerapkan interface untuk polimorfisme sederhana'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bayangkan kamu mencolokkan perangkat apa pun ke stopkontak. Asal colokannya sesuai, perangkat itu "boleh" dipakai — tak peduli mereknya. Interface bekerja seperti stopkontak: ia mendefinisikan <b>bentuk</b> yang harus dipenuhi, bukan identitas pembuatnya.</p>'
    },
    {
      type: 'example',
      title: 'Interface pertama',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "math"
)

// Interface: kumpulan method yang harus dimiliki.
type BangunDatar interface {
    Luas() float64
    Keliling() float64
}

type Persegi struct{ Sisi float64 }
type Lingkaran struct{ R float64 }

// Persegi memiliki Luas & Keliling -> otomatis memenuhi BangunDatar
func (p Persegi) Luas() float64     { return p.Sisi * p.Sisi }
func (p Persegi) Keliling() float64 { return 4 * p.Sisi }

// Lingkaran juga memenuhi BangunDatar
func (l Lingkaran) Luas() float64     { return math.Pi * l.R * l.R }
func (l Lingkaran) Keliling() float64 { return 2 * math.Pi * l.R }

func cetak(b BangunDatar) {
    fmt.Printf("Luas=%.2f Keliling=%.2f\n", b.Luas(), b.Keliling())
}

func main() {
    cetak(Persegi{Sisi: 4})     // Luas=16.00 Keliling=16.00
    cetak(Lingkaran{R: 7})      // Luas=153.94 Keliling=43.98
}`,
      explain: [
        'Interface <code>BangunDatar</code> hanya berisi daftar method (tanpa kode).',
        '<b>Tidak ada</b> kata kunci implements — cukup memiliki method yang sama.',
        'Fungsi <code>cetak</code> menerima <b>jenis apa pun</b> yang memenuhi interface ini.',
        'Inilah polimorfisme ala Go.'
      ]
    },
    {
      type: 'text', // implicit
      html: '<p>Karena interface bersifat <b>implicit</b>, sebuah package bisa menghasilkan tipe yang memenuhi interface yang didefinisikan di package lain — tanpa saling tahu. Ini membuat komponen mudah diganti, misalnya implementasi penyimpanan (database, memori, file) yang semuanya memenuhi interface <code>Penyimpanan</code> yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: penyimpanan yang bisa diganti',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Penyimpanan interface {
    Simpan(kunci, nilai string)
    Ambil(kunci string) string
}

// Implementasi memori
type Memori map[string]string

func (m Memori) Simpan(k, v string) { m[k] = v }
func (m Memori) Ambil(k string) string { return m[k] }

// Implementasi "palsu" yang hanya mencatat ke layar
type LogPenyimpanan struct{}

func (LogPenyimpanan) Simpan(k, v string) {
    fmt.Println("[LOG] menyimpan", k, "=", v)
}
func (LogPenyimpanan) Ambil(k string) string {
    fmt.Println("[LOG] mengambil", k)
    return ""
}

// Fungsi ini tidak peduli implementasi mana yang dipakai.
func pakai(s Penyimpanan) {
    s.Simpan("nama", "Andi")
    fmt.Println("hasil:", s.Ambil("nama"))
}

func main() {
    pakai(Memori{})
    pakai(LogPenyimpanan{})
}`,
      explain: [
        'Dua tipe berbeda (<code>Memori</code> dan <code>LogPenyimpanan</code>) memenuhi interface yang sama.',
        'Fungsi <code>pakai</code> bisa menerima keduanya tanpa perubahan.',
        'Pola ini disebut <b>dependency inversion</b> dan sangat berguna saat pengujian (bisa diganti mock).',
        'Pemakaian interface untuk abstraksi ini membuat kode longgar ikatan (loosely coupled).'
      ]
    },
    {
      type: 'text', // empty interface
      html: '<p><b>Empty interface</b> ditulis <code>interface{}</code> (atau alias modernnya <code>any</code> sejak Go 1.18). Ia tidak menuntut method apa pun, sehingga <b>semua tipe</b> memenuhinya. Inilah cara Go menampung nilai yang tipenya belum diketahui.</p>'
    },
    {
      type: 'example',
      title: 'Empty interface (any)',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Menerima nilai tipe apa pun
func tampilkan(x any) {
    fmt.Printf("nilai=%v tipe=%T\n", x, x)
}

func main() {
    tampilkan(42)
    tampilkan("halo")
    tampilkan(true)
    tampilkan([]int{1, 2, 3})
    tampilkan(map[string]int{"a": 1})

    // Slice campuran
    data := []any{1, "dua", 3.0, false}
    for _, d := range data {
        fmt.Println(d)
    }
}`,
      explain: [
        '<code>any</code> adalah alias dari <code>interface{}</code>.',
        'Fungsi yang menerima <code>any</code> bisa diberi nilai apa pun.',
        'Namun begitu disimpan sebagai <code>any</code>, tipe aslinya "tersembunyi" — perlu type assertion untuk memakainya kembali.',
        'Gunakan <code>any</code> dengan hati-hati; mendefinisikan interface yang spesifik lebih aman dan jelas.'
      ]
    },
    {
      type: 'tip',
      title: 'Interface kecil lebih baik',
      text: 'Di Go, interface terbaik berisi sedikit method — sering hanya satu. Contoh dari standard library: <code>io.Writer</code> (hanya menulis), <code>fmt.Stringer</code> (hanya String), <code>error</code> (hanya Error). Interface kecil lebih mudah dipenuhi dan dipakai ulang.'
    },
    {
      type: 'warn',
      title: 'Jangan bikin interface sebelum perlu',
      text: 'Pemula sering membuat interface untuk setiap tipe. Padahal idiom Go adalah: <b>definisikan interface di tempat pemakaian</b>, bukan di tempat implementasi, dan hanya bila benar-benar butuh abstraksi. Mulailah dari tipe konkret.'
    },
    {
      type: 'vocab',
      items: [
        ['Interface', 'Kumpulan tanda tangan method yang harus dipenuhi sebuah tipe.'],
        ['Implicit interface', 'Tipe memenuhi interface dengan sendirinya tanpa deklarasi.'],
        ['Polimorfisme', 'Kemampuan memperlakukan banyak tipe lewat satu antarmuka.'],
        ['interface{} / any', 'Interface kosong yang dipenuhi semua tipe.'],
        ['Dependency inversion', 'Bergantung pada abstraksi (interface), bukan implementasi konkret.'],
        ['io.Writer', 'Interface standard library dengan satu method Write.']
      ]
    }
  ],
  recap: [
    'Interface adalah daftar method; tipe memenuhinya secara implisit.',
    'Tidak ada kata kunci implements — cukup memiliki method yang sesuai.',
    'Interface memungkinkan polimorfisme dan mengganti implementasi (mis. saat pengujian).',
    'interface{} / any menampung semua tipe tetapi menyembunyikan tipe aslinya.',
    'Interface kecil lebih baik; definisikan di sisi pemakaian.'
  ]
});

/* ---------- Pelajaran 19: Type Assertion & Type Switch ---------- */
window.GO_LESSONS.push({
  id: 'type-assertion',
  title: 'Type Assertion & Type Switch',
  chapter: 'Interface & Type System',
  duration: '9 menit',
  intro: [
    'Ketika nilai disimpan sebagai interface, kita kadang perlu "membuka" kembali tipe aslinya. Di sinilah <b>type assertion</b> berperan.',
    'Pelajaran ini membahas cara aman mengambil tipe konkret dari sebuah interface, serta <b>type switch</b> untuk menangani banyak kemungkinan sekaligus.'
  ],
  objectives: [
    'Melakukan type assertion dengan aman (comma-ok)',
    'Memahami risiko panic tanpa comma-ok',
    'Memakai type switch untuk menangani banyak tipe',
    'Menerapkan pola ini pada data dari luar (mis. JSON)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bentuk dasar type assertion: <code>nilai, ok := x.(Tipe)</code>. Bila <code>x</code> memang bertipe <code>Tipe</code>, <code>ok</code> bernilai <code>true</code> dan <code>nilai</code> berisi hasilnya. Bila tidak, <code>ok</code> bernilai <code>false</code> dan <code>nilai</code> berisi zero value.</p>'
    },
    {
      type: 'example',
      title: 'Type assertion dengan comma-ok',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    var x any = "halo"

    // Cara AMAN: comma-ok
    s, ok := x.(string)
    if ok {
        fmt.Println("ini string:", s, "panjang:", len(s))
    }

    // Gagal -> ok=false, s berisi zero value
    n, ok := x.(int)
    fmt.Println(n, ok)   // 0 false

    // Cara TIDAK AMAN: langsung assertion
    // y := x.(int)  // panic: interface conversion
    _ = n
}`,
      explain: [
        '<code>x.(string)</code> mencoba mengubah x menjadi string.',
        'Dengan bentuk dua nilai (<code>s, ok</code>), kegagalan tidak menyebabkan panic.',
        'Bentuk satu nilai (<code>x.(int)</code>) akan <b>panic</b> bila tipenya tidak cocok.',
        'Untuk data dari luar (JSON, API), selalu pakai bentuk comma-ok.'
      ]
    },
    {
      type: 'text', // type switch recap
      html: '<p>Bila ada banyak tipe yang mungkin, type assertion berulang menjadi tidak praktis. Gunakan <b>type switch</b> (<code>switch v := x.(type)</code>) yang sudah kita singgung di bab alur kontrol.</p>'
    },
    {
      type: 'example',
      title: 'Type switch untuk banyak tipe',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Menjumlahkan elemen apa pun yang bisa dianggap angka
func total(data []any) float64 {
    var hasil float64
    for _, v := range data {
        switch n := v.(type) {
        case int:
            hasil += float64(n)
        case float64:
            hasil += n
        case string:
            // coba ubah string menjadi angka? di sini kita abaikan
            fmt.Println("melewati string:", n)
        default:
            fmt.Printf("tipe tidak didukung: %T\n", n)
        }
    }
    return hasil
}

func main() {
    data := []any{10, 2.5, "tiga", true}
    fmt.Println("total:", total(data))
}`,
      explain: [
        '<code>v.(type)</code> hanya boleh dipakai di dalam switch tipe.',
        'Setiap case menangani satu tipe konkret.',
        '<code>default</code> menangkap tipe yang tidak ditangani.',
        'Pola ini umum saat memproses data dinamis hasil <code>encoding/json</code> (yang menghasilkan map[string]any).'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: membaca data JSON dinamis',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    teks := ` + "`" + `{"nama":"Andi","umur":27,"hobi":["baca","lari"]}` + "`" + `

    var data map[string]any
    if err := json.Unmarshal([]byte(teks), &data); err != nil {
        fmt.Println("error:", err)
        return
    }

    for kunci, nilai := range data {
        switch v := nilai.(type) {
        case string:
            fmt.Println(kunci, "-> teks:", v)
        case float64:       // angka JSON jadi float64
            fmt.Println(kunci, "-> angka:", v)
        case []any:
            fmt.Println(kunci, "-> daftar berisi", len(v), "item")
        default:
            fmt.Printf("%s -> tipe lain: %T\n", kunci, v)
        }
    }
}`,
      explain: [
        'JSON dinamis di-<i>unmarshal</i> ke <code>map[string]any</code>.',
        'Angka dalam JSON selalu menjadi <code>float64</code> kecuali didekode ke struct.',
        'Type switch memudahkan menangani tiap bentuk nilai.',
        'Untuk bentuk yang sudah pasti, lebih baik mendekode ke struct agar tidak perlu assertion.'
      ]
    },
    {
      type: 'tip',
      title: 'Lebih baik pakai struct bila tahu bentuknya',
      text: 'Type assertion dan type switch kuat, tetapi mengorbankan keamanan tipe. Bila struktur data sudah diketahui, definisikan <b>struct</b> dan unmarshal ke sana. Simpan <code>any</code> + assertion untuk data yang benar-benar dinamis.'
    },
    {
      type: 'warn',
      title: 'Bentuk satu nilai bisa panic',
      text: '<code>v := x.(int)</code> tanpa comma-ok akan membuat program crash bila <code>x</code> bukan int. Gunakan bentuk dua nilai, atau pastikan dulu tipenya lewat type switch.'
    },
    {
      type: 'vocab',
      items: [
        ['Type assertion', 'Mengambil tipe konkret dari sebuah interface nilai.'],
        ['comma-ok', 'Bentuk aman: nilai, ok := x.(T).'],
        ['panic', 'Penghentian program mendadak akibat kesalahan saat berjalan.'],
        ['Type switch', 'switch yang mencocokkan tipe dinamis sebuah interface.'],
        ['encoding/json', 'Package standard library untuk membaca/menulis JSON.'],
        ['map[string]any', 'Struktur hasil unmarshal JSON dinamis.']
      ]
    }
  ],
  recap: [
    'Type assertion mengubah interface menjadi tipe konkret.',
    'Selalu pakai bentuk comma-ok (v, ok := x.(T)) agar tidak panic.',
    'Type switch menangani banyak tipe sekaligus dengan rapi.',
    'Angka JSON selalu menjadi float64 pada map[string]any.',
    'Bila bentuk data diketahui, gunakan struct daripada any + assertion.'
  ]
});
