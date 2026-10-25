/* ============================================================
   Pelajaran Go — Bab 6: Pointer & Struct
   (topik info.md:
    - "Pointer: Mengerti alamat memori (&) dan dereferencing (*)"
    - "Pass by Value vs Pass by Reference"
    - "Struct: Definisi, nested struct, dan anonymous struct"
    - "Struct Method: Value Receiver vs Pointer Receiver")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 16: Pointer & Pass by Value/Reference ---------- */
window.GO_LESSONS.push({
  id: 'pointer',
  title: 'Pointer & Pass by Value/Reference',
  chapter: 'Pointer & Struct',
  duration: '11 menit',
  intro: [
    'Setiap nilai di program hidup di suatu <b>alamat memori</b>. <b>Pointer</b> adalah variabel yang menyimpan alamat itu, bukan nilainya langsung.',
    'Pelajaran ini menjelaskan cara mengambil alamat dengan <code>&</code>, membaca isi alamat dengan <code>*</code>, serta mengapa hal ini penting untuk memahami cara Go mengirim data ke fungsi.'
  ],
  objectives: [
    'Memahami apa itu alamat memori dan pointer',
    'Mengambil alamat dengan & dan membaca nilai dengan *',
    'Membedakan pass by value dan pass by reference',
    'Mengetahui kapan sebaiknya memakai pointer'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bayangkan variabel seperti <b>rumah</b> dan nilainya seperti isi rumah. Pointer adalah <b>catatan alamat rumah</b>. Dengan catatan itu, kamu bisa menemukan rumah dan mengubah isinya dari jauh tanpa perlu menyalin seluruh rumah.</p><ul><li><code>&x</code> → ambil alamat variabel x (operator address-of).</li><li><code>*p</code> → baca/tulis nilai di alamat p (operator dereference).</li><li>Tipe <code>*int</code> berarti "pointer ke int".</li></ul>'
    },
    {
      type: 'example',
      title: 'Dasar pointer',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    x := 42

    // p menyimpan ALAMAT dari x
    var p *int = &x

    fmt.Println("nilai x  :", x)       // 42
    fmt.Println("alamat x :", p)       // mis. 0xc000012345
    fmt.Println("isi alamat:", *p)     // 42 (nilai di alamat p)

    // Mengubah x lewat pointer
    *p = 100
    fmt.Println("x sekarang:", x)      // 100
}`,
      explain: [
        '<code>&x</code> menghasilkan alamat memori variabel x.',
        '<code>*int</code> menyatakan pointer ke bilangan bulat.',
        '<code>*p</code> membaca nilai yang ditunjuk pointer; menugaskannya mengubah x asli.',
        'Output alamat memori bisa berbeda di setiap komputer dan saat program dijalankan.'
      ]
    },
    {
      type: 'text',
      html: '<p>Secara default, Go mengirim argumen fungsi secara <b>pass by value</b> — fungsi menerima <b>salinan</b>. Mengubah salinan tidak mengubah variabel asli. Dengan pointer, fungsi bisa mengubah nilai asli karena yang dikirim adalah <b>alamatnya</b>.</p>'
    },
    {
      type: 'example',
      title: 'Pass by value vs pass by pointer',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Menerima SALINAN -> tidak mengubah nilai asli
func gandakanSalah(n int) {
    n = n * 2
}

// Menerima POINTER -> mengubah nilai asli
func gandakanBenar(n *int) {
    *n = *n * 2
}

func main() {
    angka := 10

    gandakanSalah(angka)
    fmt.Println(angka)     // 10 (tidak berubah)

    gandakanBenar(&angka)
    fmt.Println(angka)     // 20 (berubah!)
}`,
      explain: [
        'Go selalu menyalin nilai saat memanggil fungsi.',
        'Untuk mengubah variabel pemanggil, kirim alamatnya dengan <code>&</code>.',
        'Parameter fungsi lalu menerima <code>*int</code> dan diubah dengan <code>*n = ...</code>.',
        'Pola ini dipakai luas, mis. fungsi yang mengisi hasil ke variabel luar.'
      ]
    },
    {
      type: 'example',
      title: 'Pointer nil & pointer ke struct',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Titik struct {
    X, Y int
}

// Pointer ke struct bisa diubah field-nya tanpa dereference eksplisit
func geser(t *Titik, dx, dy int) {
    t.X += dx     // otomatis dianggap (*t).X
    t.Y += dy
}

func main() {
    var p *int            // pointer nol
    fmt.Println(p)        // <nil>
    if p == nil {
        fmt.Println("pointer belum menunjuk ke mana pun")
    }

    titik := &Titik{X: 1, Y: 2}   // &Titik{...} membuat pointer ke struct
    geser(titik, 10, 20)
    fmt.Println(*titik)   // {11 22}
}`,
      explain: [
        'Pointer yang belum diisi bernilai <code>nil</code>; membaca <code>*p</code> saat nil menyebabkan panic.',
        '<code>&Titik{...}</code> membuat struct lalu mengembalikan pointernya.',
        'Pada pointer struct, Go otomatis menganggap <code>t.X</code> sebagai <code>(*t).X</code> — tidak perlu bintang.',
        'Mengirim pointer struct menghindari penyalinan struct besar.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan memakai pointer?',
      text: 'Pakai pointer bila: (1) fungsi perlu <b>mengubah</b> nilai pemanggil, (2) ingin menghindari <b>salinan</b> data besar, atau (3) membedakan "belum diisi" (nil) dari "bernilai nol". Untuk nilai kecil yang hanya dibaca, cukup kirim salinannya.'
    },
    {
      type: 'warn',
      title: 'Dereference pointer nil = panic',
      text: 'Selalu pastikan pointer tidak nil sebelum memakai <code>*p</code>. Program Go yang membaca pointer nil akan crash dengan <code>nil pointer dereference</code>. Periksa dengan <code>if p != nil { ... }</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Pointer', 'Variabel yang menyimpan alamat memori.'],
        ['Alamat (&)', 'Operator untuk mengambil alamat sebuah variabel.'],
        ['Dereference (*)', 'Operator untuk membaca/menulis nilai di alamat pointer.'],
        ['Pass by value', 'Fungsi menerima salinan nilai.'],
        ['Pass by reference', 'Fungsi menerima alamat sehingga bisa mengubah nilai asli.'],
        ['nil', 'Pointer yang belum menunjuk ke alamat mana pun.']
      ]
    }
  ],
  recap: [
    'Pointer menyimpan alamat memori, bukan nilainya langsung.',
    '& mengambil alamat; * membaca atau menulis nilai di alamat itu.',
    'Go mengirim argumen seby value; gunakan pointer untuk mengubah nilai asli.',
    'Pada pointer struct, akses field otomatis didereference.',
    'Dereference pointer nil menyebabkan panic — selalu cek nil.'
  ]
});

/* ---------- Pelajaran 17: Struct & Method ---------- */
window.GO_LESSONS.push({
  id: 'struct-method',
  title: 'Struct & Method (Value vs Pointer Receiver)',
  chapter: 'Pointer & Struct',
  duration: '12 menit',
  intro: [
    'Go tidak punya <i>class</i> seperti Java atau Python. Sebagai gantinya, Go memakai <b>struct</b> — kumpulan field bernama — lalu menambahkan perilaku lewat <b>method</b>.',
    'Pelajaran ini membahas cara membuat struct (termasuk nested dan anonymous), serta perbedaan penting antara <b>value receiver</b> dan <b>pointer receiver</b>.'
  ],
  objectives: [
    'Mendefinisikan dan menginisialisasi struct',
    'Membuat nested struct dan anonymous struct',
    'Menambahkan method pada struct',
    'Memahami perbedaan value receiver dan pointer receiver'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Struct</b> adalah tipe data gabungan: sekelompok field dengan nama dan tipe masing-masing. Ia seperti kartu identitas yang menyatukan banyak informasi tentang satu hal.</p>'
    },
    {
      type: 'example',
      title: 'Mendefinisikan dan memakai struct',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Pengguna struct {
    Nama  string
    Umur  int
    Aktif bool
}

func main() {
    // 1) Dengan nama field (paling jelas)
    u1 := Pengguna{Nama: "Andi", Umur: 27, Aktif: true}

    // 2) Berurutan sesuai urutan field
    u2 := Pengguna{"Budi", 31, false}

    // 3) Deklarasi lalu isi field
    var u3 Pengguna
    u3.Nama = "Citra"
    u3.Umur = 24

    fmt.Println(u1)
    fmt.Println(u2.Nama, u2.Umur)
    fmt.Println(u3)

    // Field yang kosong otomatis zero value
    fmt.Println(u3.Aktif)   // false
}`,
      explain: [
        'Field ditulis <code>Nama string</code> — nama dulu, tipe kemudian.',
        'Inisialisasi dengan nama field lebih aman karena tidak bergantung urutan.',
        'Field yang tidak diisi bernilai zero value.',
        'Akses dan ubah field dengan tanda titik: <code>u1.Nama</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Nested struct & anonymous struct',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Alamat struct {
    Jalan string
    Kota  string
}

// Nested struct: struct di dalam struct
type Karyawan struct {
    Nama   string
    Alamat Alamat
}

func main() {
    k := Karyawan{
        Nama: "Dewi",
        Alamat: Alamat{
            Jalan: "Jl. Merdeka 10",
            Kota:  "Bandung",
        },
    }
    fmt.Println(k.Nama, "tinggal di", k.Alamat.Kota)

    // Anonymous struct: struct tanpa nama tipe, cocok untuk data sekali pakai
    titik := struct {
        X, Y int
    }{X: 3, Y: 5}
    fmt.Println(titik)   // {3 5}
}`,
      explain: [
        'Nested struct menyimpan struct lain sebagai field (<code>Alamat Alamat</code>).',
        'Akses berantai: <code>k.Alamat.Kota</code>.',
        'Anonymous struct tidak punya nama tipe dan berguna untuk struktur sementara, mis. data JSON.',
        'Untuk menggabungkan field secara otomatis (embedding), kamu bisa menuliskan tipe tanpa nama field.'
      ]
    },
    {
      type: 'example',
      title: 'Embedding (struct di dalam struct tanpa nama)',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Hewan struct {
    Nama string
}

func (h Hewan) Suara() string {
    return h.Nama + " bersuara..."
}

type Kucing struct {
    Hewan        // embedded: field tanpa nama
    Jenis string
}

func main() {
    k := Kucing{Hewan: Hewan{Nama: "Milo"}, Jenis: "Persia"}
    // Method & field dari Hewan "dipromosikan" ke Kucing
    fmt.Println(k.Suara())   // Milo bersuara...
    fmt.Println(k.Nama)      // Milo
}`,
      explain: [
        '<b>Embedding</b> menuliskan tipe tanpa nama field sehingga field & method-nya dipromosikan.',
        'Ini cara Go mencapai komposisi tanpa pewarisan (inheritance).',
        '<code>k.Suara()</code> sebenarnya memanggil <code>k.Hewan.Suara()</code>.',
        'Embedding adalah alternatif Go yang lebih aman daripada pewarisan class.'
      ]
    },
    {
      type: 'text', // method
      html: '<p><b>Method</b> adalah fungsi yang "menempel" pada sebuah tipe. Bedanya dengan fungsi biasa hanyalah adanya <b>receiver</b> sebelum nama method: <code>func (r Tipe) NamaMethod()</code>. Receiver bisa berupa <b>value</b> (salinan) atau <b>pointer</b> (rujukan ke asli).</p>'
    },
    {
      type: 'example',
      title: 'Value receiver vs pointer receiver',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Counter struct {
    Nilai int
}

// Value receiver -> menerima SALINAN (tidak mengubah asli)
func (c Counter) Tampilkan() {
    fmt.Println("nilai:", c.Nilai)
}

// Pointer receiver -> bisa mengubah struct asli
func (c *Counter) Tambah(n int) {
    c.Nilai += n
}

func main() {
    c := Counter{Nilai: 10}

    c.Tampilkan()     // 10
    c.Tambah(5)       // Go otomatis mengirim &c
    c.Tampilkan()     // 15

    p := &Counter{Nilai: 100}
    p.Tambah(1)       // juga bisa dari pointer
    p.Tampilkan()     // 101
}`,
      explain: [
        'Value receiver (<code>c Counter</code>) bekerja pada salinan — perubahan tidak memengaruhi asli.',
        'Pointer receiver (<code>c *Counter</code>) bekerja pada struct asli sehingga bisa mengubahnya.',
        'Go otomatis mengambil alamat saat memanggil method pointer pada variabel biasa.',
        'Aturan praktis: bila ada satu method pointer receiver, buat semuanya pointer receiver agar konsisten.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan pakai value vs pointer receiver?',
      text: 'Pakai <b>pointer receiver</b> bila method perlu mengubah struct, struct berukuran besar, atau struct memuat pointer/mutex. Pakai <b>value receiver</b> untuk tipe kecil dan method yang hanya membaca (tidak mengubah). Konsisten dalam satu tipe membuat kode lebih mudah dipahami.'
    },
    {
      type: 'warn',
      title: 'Method value receiver tidak mengubah asli',
      text: 'Kesalahan pemula yang umum: membuat method dengan value receiver, lalu heran mengapa perubahan field tidak tersimpan. Sesuaikan receiver dengan kebutuhanmu.'
    },
    {
      type: 'vocab',
      items: [
        ['Struct', 'Tipe gabungan berisi beberapa field bernama.'],
        ['Field', 'Anggota data di dalam struct.'],
        ['Nested struct', 'Struct yang menjadi field struct lain.'],
        ['Anonymous struct', 'Struct tanpa nama tipe, untuk data sekali pakai.'],
        ['Embedding', 'Menempatkan tipe tanpa nama field untuk promosi field/method.'],
        ['Method', 'Fungsi yang memiliki receiver (menempel pada tipe).'],
        ['Value receiver', 'Receiver yang menerima salinan nilai.'],
        ['Pointer receiver', 'Receiver yang menerima pointer sehingga bisa mengubah asli.']
      ]
    }
  ],
  recap: [
    'Struct adalah tipe gabungan berisi field bernama; field kosong bernilai zero value.',
    'Nested struct menyimpan struct lain; anonymous struct untuk data sekali pakai.',
    'Embedding mempromosikan field & method tanpa pewarisan.',
    'Method adalah fungsi dengan receiver; value receiver menerima salinan.',
    'Pointer receiver diperlukan untuk mengubah struct asli.'
  ]
});
