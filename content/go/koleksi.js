/* ============================================================
   Pelajaran Go — Bab 4: Tipe Data Koleksi & Komposisi
   (topik info.md:
    - "Array: Definisi, inisialisasi, dan keterbatasannya"
    - "Slice: Konsep underlying array, len(), cap(), append(), dan copy()"
    - "Map: Tipe key-value, manipulasi data map, dan pengecekan keberadaan key"
    - "Iterasi: Menggunakan for range pada Slice dan Map")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 9: Array ---------- */
window.GO_LESSONS.push({
  id: 'array',
  title: 'Array: Ukuran Tetap',
  chapter: 'Koleksi Data',
  duration: '8 menit',
  intro: [
    'Untuk menyimpan banyak nilai, Go menyediakan <b>array</b>. Array adalah deretan elemen bertipe sama dengan <b>panjang tetap</b> yang ditentukan saat deklarasi dan tidak bisa berubah.',
    'Karena kaku, array jarang dipakai langsung di aplikasi sehari-hari — tetapi ia adalah fondasi dari <b>slice</b>, tipe koleksi yang jauh lebih populer.'
  ],
  objectives: [
    'Mendeklarasikan dan menginisialisasi array',
    'Mengakses dan mengubah elemen array',
    'Memahami panjang tetap sebagai keterbatasan array',
    'Mengetahui kapan array lebih tepat daripada slice'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Panjang array adalah bagian dari <b>tipe</b>-nya. <code>[3]int</code> dan <code>[5]int</code> adalah dua tipe berbeda dan tidak bisa saling ditukar. Panjang inilah yang membuat array kaku, tetapi juga membuatnya bisa disalin utuh dengan cepat.</p>'
    },
    {
      type: 'example',
      title: 'Membuat dan mengisi array',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Deklarasi lalu isi satu-satu
    var nilai [3]int
    nilai[0] = 10
    nilai[1] = 20
    nilai[2] = 30

    // Langsung berisi nilai
    warna := [3]string{"merah", "hijau", "biru"}

    // Panjang disimpulkan dari jumlah elemen dengan [...]
    prima := [...]int{2, 3, 5, 7, 11}

    fmt.Println(nilai)          // [10 20 30]
    fmt.Println(warna[1])       // hijau
    fmt.Println(len(prima))     // 5
}`,
      explain: [
        'Array yang tidak diisi otomatis bernilai zero value (0 untuk int).',
        '<code>[...]</code> membuat Go menghitung panjangnya dari jumlah elemen.',
        '<code>len(arr)</code> mengembalikan panjang array.',
        'Indeks dimulai dari 0: elemen pertama adalah <code>arr[0]</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Array bersifat nilai (disalin utuh)',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    a := [3]int{1, 2, 3}
    b := a          // b adalah SALINAN, bukan rujukan

    b[0] = 99

    fmt.Println("a =", a)   // [1 2 3]  tidak berubah
    fmt.Println("b =", b)   // [99 2 3]

    // panjang array adalah bagian dari tipe:
    var c [3]int = a        // OK
    // var d [4]int = a     // ERROR: tipe berbeda
    _ = c
}`,
      explain: [
        'Mengisi <code>b := a</code> menyalin seluruh isi array — mengubah b tidak memengaruhi a.',
        'Perilaku ini berbeda dari slice yang berbagi data di belakang layar.',
        'Karena panjang adalah bagian tipe, array dengan panjang berbeda tidak kompatibel.'
      ]
    },
    {
      type: 'example',
      title: 'Array multidimensi & for range',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Array 2 dimensi: 2 baris x 3 kolom
    papan := [2][3]int{
        {1, 2, 3},
        {4, 5, 6},
    }

    for i, baris := range papan {
        for j, sel := range baris {
            fmt.Printf("papan[%d][%d] = %d\n", i, j, sel)
        }
    }
}`,
      explain: [
        'Array 2 dimensi ditulis <code>[baris][kolom]T</code>.',
        'Perulangan bersarang dipakai untuk menjelajahi setiap sel.',
        '<code>range</code> mengembalikan indeks dan nilai pada tiap level.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan memakai array?',
      text: 'Gunakan array bila panjangnya memang tetap dan diketahui, misalnya: tabel warna RGB <code>[3]uint8</code>, matriks kecil, atau kunci hash berukuran tetap. Untuk daftar yang bisa bertambah, pakai <b>slice</b>.'
    },
    {
      type: 'warn',
      title: 'Indeks di luar batas = panic',
      text: 'Mengakses indeks yang tidak ada (mis. <code>arr[5]</code> pada array berukuran 3) menyebabkan <b>panic</b> saat program berjalan. Selalu pastikan indeks berada dalam rentang <code>0</code> sampai <code>len(arr)-1</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Array', 'Deretan elemen bertipe sama dengan panjang tetap.'],
        ['Panjang (length)', 'Jumlah elemen array; bagian dari tipe.'],
        ['Indeks', 'Nomor posisi elemen, mulai dari 0.'],
        ['Zero value', 'Nilai bawaan elemen array yang belum diisi.'],
        ['Value type', 'Tipe yang disalin saat ditugaskan (seperti array).']
      ]
    }
  ],
  recap: [
    'Array punya panjang tetap yang merupakan bagian dari tipe.',
    'Array dapat dibuat dengan var, literal { ... }, atau [...] untuk menghitung panjang.',
    'Menugaskan array menyalin seluruh isinya (value type).',
    'For range memudahkan iterasi, termasuk array multidimensi.',
    'Akses indeks di luar batas menyebabkan panic.'
  ]
});

/* ---------- Pelajaran 10: Slice ---------- */
window.GO_LESSONS.push({
  id: 'slice',
  title: 'Slice: Koleksi Fleksibel',
  chapter: 'Koleksi Data',
  duration: '11 menit',
  intro: [
    '<b>Slice</b> adalah tipe koleksi yang paling sering dipakai di Go. Ia seperti array, tetapi <b>panjangnya bisa berubah</b> — bisa ditambah kapan saja.',
    'Di balik layar, slice sebenarnya menunjuk ke sebuah array yang tersembunyi (<b>underlying array</b>). Memahami konsep ini penting agar kamu tidak tertipu saat menyalin atau memotong slice.'
  ],
  objectives: [
    'Membuat slice dengan literal dan make',
    'Memahami len, cap, dan underlying array',
    'Menambah elemen dengan append',
    'Menyalin slice dengan copy dan memotong dengan slicing'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Slice tidak menyimpan datanya sendiri. Ia terdiri dari tiga hal: <b>pointer</b> ke elemen pertama di array dasar, <b>panjang</b> (len), dan <b>kapasitas</b> (cap). Panjang adalah jumlah elemen yang dipakai; kapasitas adalah seberapa banyak yang muat sebelum array dasar perlu dialokasi ulang.</p>'
    },
    {
      type: 'example',
      title: 'Membuat slice',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // 1) Literal (tanpa panjang) -> slice
    buah := []string{"apel", "jeruk", "mangga"}

    // 2) Dengan make: panjang dan kapasitas
    angka := make([]int, 3, 5)   // len=3, cap=5, isi 0

    // 3) Slice kosong (nil)
    var kosong []int

    fmt.Println(buah, len(buah), cap(buah))
    fmt.Println(angka, len(angka), cap(angka))
    fmt.Println(kosong, len(kosong), kosong == nil) // [] 0 true
}`,
      explain: [
        '<code>[]string{...}</code> (tanpa angka di dalam kurung siku) membuat slice.',
        '<code>make([]int, 3, 5)</code> membuat slice panjang 3 dengan kapasitas 5.',
        'Slice nol bernilai <code>nil</code>; tetap bisa di-append.',
        '<code>cap</code> menunjukkan kapasitas array dasar.'
      ]
    },
    {
      type: 'example',
      title: 'append dan perilaku kapasitas',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    s := make([]int, 0, 2)
    fmt.Println(len(s), cap(s))   // 0 2

    s = append(s, 10)
    fmt.Println(len(s), cap(s))   // 1 2

    s = append(s, 20)
    fmt.Println(len(s), cap(s))   // 2 2

    // Kapasitas penuh -> Go mengalokasi array baru
    s = append(s, 30)
    fmt.Println(len(s), cap(s))   // 3 4  (cap biasanya berlipat)
    fmt.Println(s)                // [10 20 30]

    // append beberapa sekaligus dengan ...
    s = append(s, 40, 50)
    fmt.Println(s)
}`,
      explain: [
        '<code>append</code> menambah elemen dan mengembalikan slice (selalu ditugaskan kembali).',
        'Selama kapasitas cukup, append memakai array dasar yang sama.',
        'Saat kapasitas penuh, Go membuat array baru yang lebih besar — alamat memori berubah.',
        'Tanda <code>...</code> menyebar elemen dari slice lain.'
      ]
    },
    {
      type: 'example',
      title: 'Slicing, len, dan cap',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    asli := []int{0, 1, 2, 3, 4, 5}

    potong := asli[1:4]         // indeks 1 sampai 3 (4 tidak termasuk)
    fmt.Println(potong)         // [1 2 3]
    fmt.Println(len(potong), cap(potong)) // 3 5

    // potongan berbagi array dasar dengan asli!
    potong[0] = 99
    fmt.Println(asli)           // [0 99 2 3 4 5]

    // salinan sebenarnya -> pakai copy
    salinan := make([]int, len(potong))
    copy(salinan, potong)
    salinan[0] = 7
    fmt.Println(potong, salinan) // [99 2 3] [7 2 3]
}`,
      explain: [
        '<code>asli[1:4]</code> mengambil elemen indeks 1, 2, 3 (indeks akhir tidak ikut).',
        'Slice hasil potongan <b>berbagi</b> array dasar — mengubah potongan ikut mengubah asli.',
        '<code>copy(dst, src)</code> menyalin isi; mengubah salinan tidak memengaruhi asal.',
        'Kosongkan indeks berarti dari awal atau sampai akhir: <code>s[:2]</code> atau <code>s[2:]</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Menghapus elemen dari slice',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    s := []int{10, 20, 30, 40, 50}

    // Hapus elemen indeks 2 (nilai 30)
    i := 2
    s = append(s[:i], s[i+1:]...)
    fmt.Println(s)   // [10 20 40 50]

    // Menyalin variabel slice juga berbagi array dasar -> berhati-hatilah
    a := []int{1, 2, 3}
    b := a
    b[0] = 100
    fmt.Println(a)   // [100 2 3]
}`,
      explain: [
        'Pola menghapus: gabungkan bagian sebelum dan sesudah indeks target.',
        'Menugaskan slice ke variabel lain <b>tidak</b> menyalin data — keduanya menunjuk array dasar yang sama.',
        'Untuk salinan mandiri, selalu gunakan <code>copy</code> atau <code>append([]T(nil), s...)</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Sering-sering gunakan make dengan kapasitas',
      text: 'Bila sudah memperkirakan jumlah elemen, buat slice dengan kapasitas awal: <code>make([]int, 0, 1000)</code>. Ini mengurangi alokasi ulang saat append sehingga program lebih cepat.'
    },
    {
      type: 'warn',
      title: 'Slice menunjuk ke data yang sama',
      text: 'Ini sumber bug paling umum bagi pemula Go. Dua slice hasil pemotongan bisa saling memengaruhi. Selalu sadari apakah kamu butuh <b>berbagi</b> atau <b>salinan mandiri</b>.'
    },
    {
      type: 'vocab',
      items: [
        ['Slice', 'Tampilan fleksibel atas array dasar; panjangnya bisa berubah.'],
        ['Underlying array', 'Array di belakang layar yang ditunjuk beberapa slice.'],
        ['len', 'Jumlah elemen yang sedang dipakai.'],
        ['cap', 'Kapasitas maksimum sebelum array dasar dialokasi ulang.'],
        ['append', 'Menambah elemen di akhir slice.'],
        ['copy', 'Menyalin isi slice secara mandiri.']
      ]
    }
  ],
  recap: [
    'Slice lebih fleksibel daripada array karena panjangnya bisa berubah.',
    'Slice memiliki panjang (len) dan kapasitas (cap) di atas array dasar.',
    'append menambah elemen dan mengembalikan slice baru; assign ulang hasilnya.',
    'Pemotongan slice berbagi array dasar; copy membuat salinan mandiri.',
    'Gunakan make dengan kapasitas yang cukup untuk efisiensi.'
  ]
});

/* ---------- Pelajaran 11: Map & Iterasi for range ---------- */
window.GO_LESSONS.push({
  id: 'map-iterasi',
  title: 'Map & Iterasi for range',
  chapter: 'Koleksi Data',
  duration: '10 menit',
  intro: [
    '<b>Map</b> adalah struktur <b>key-value</b>: kita menyimpan nilai dan mengambilnya kembali lewat kunci, tanpa perlu tahu posisinya. Ini seperti kamus: cari kata (key), dapat artinya (value).',
    'Pelajaran ini juga membahas <b>for range</b> — cara idiomatik menjelajahi slice dan map.'
  ],
  objectives: [
    'Membuat dan mengisi map',
    'Menambah, mengubah, dan menghapus entri map',
    'Memeriksa keberadaan key dengan idiom comma-ok',
    'Mengiterasi slice dan map dengan for range'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Map harus dibuat dengan <code>make</code> sebelum bisa dipakai. Map tidak berurutan — urutan iterasi bisa berubah setiap kali program dijalankan, jadi jangan mengandalkan urutan.</p>'
    },
    {
      type: 'example',
      title: 'Membuat dan mengubah map',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Membuat map kosong
    umur := make(map[string]int)

    // Menambah / mengubah entri
    umur["Andi"] = 27
    umur["Budi"] = 31
    umur["Andi"] = 28          // menimpa nilai lama

    // Map dengan literal
    stok := map[string]int{
        "beras": 50,
        "gula":  20,
    }

    // Menghapus entri
    delete(stok, "gula")

    fmt.Println(umur)          // map[Andi:28 Budi:31]
    fmt.Println(stok["beras"]) // 50
    fmt.Println(len(stok))     // 1
}`,
      explain: [
        '<code>make(map[string]int)</code> membuat map dengan key string dan value int.',
        'Menugaskan ke key yang sudah ada akan menimpa nilainya.',
        '<code>delete(map, key)</code> menghapus satu entri.',
        '<code>len(map)</code> mengembalikan jumlah entri.'
      ]
    },
    {
      type: 'text',
      html: '<p>Mengambil nilai key yang tidak ada <b>tidak</b> error — Go mengembalikan zero value. Karena itu dibutuhkan idiom <b>comma-ok</b> untuk membedakan "key tidak ada" dari "nilai kebetulan nol".</p>'
    },
    {
      type: 'example',
      title: 'Pengecekan keberadaan key (comma-ok)',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    nilai := map[string]int{"matematika": 90}

    // Tanpa comma-ok: tidak bisa membedakan key kosong vs nilai 0
    fmt.Println(nilai["fisika"])   // 0 (key tidak ada!)

    // Dengan comma-ok: "ada" bernilai bool
    skor, ada := nilai["fisika"]
    if ada {
        fmt.Println("Fisika:", skor)
    } else {
        fmt.Println("Fisika belum ada")
    }

    // Sering dipakai satu baris:
    if skor, ada := nilai["matematika"]; ada {
        fmt.Println("Matematika:", skor)
    }
}`,
      explain: [
        '<code>nilai[key]</code> mengembalikan zero value bila key tidak ada.',
        '<code>skor, ada := nilai[key]</code> mengembalikan nilai dan boolean keberadaan.',
        'Idiom comma-ok juga dipakai pada type assertion dan pembacaan channel.'
      ]
    },
    {
      type: 'example',
      title: 'Iterasi slice dan map dengan for range',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Slice: i = indeks, v = nilai
    warna := []string{"merah", "hijau", "biru"}
    for i, w := range warna {
        fmt.Println(i, w)
    }

    // Map: k = key, v = value (urutan TIDAK dijamin)
    umur := map[string]int{"Andi": 27, "Budi": 31}
    for nama, u := range umur {
        fmt.Println(nama, "berumur", u)
    }

    // Abaikan salah satu dengan _
    for _, u := range umur {
        fmt.Println("umur:", u)
    }
}`,
      explain: [
        'for range pada slice memberi indeks dan nilai berurutan.',
        'for range pada map memberi key dan value dalam urutan acak.',
        'Tanda <code>_</code> membuang nilai yang tidak dipakai (mis. indeks).',
        'Perhatikan: pada map, urutan iterasi tidak dijamin konsisten.'
      ]
    },
    {
      type: 'example',
      title: 'Map dengan nilai berupa slice (agregasi)',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Kelompokkan nama berdasarkan kota
    kota := map[string][]string{}
    kota["Bandung"] = append(kota["Bandung"], "Andi")
    kota["Bandung"] = append(kota["Bandung"], "Citra")
    kota["Surabaya"] = append(kota["Surabaya"], "Budi")

    for nama, orang := range kota {
        fmt.Printf("%s (%d orang): %v\n", nama, len(orang), orang)
    }
}`,
      explain: [
        'Nilai map boleh berupa tipe apa pun, termasuk slice.',
        '<code>append(kota["Bandung"], "Andi")</code> bekerja karena key baru mengembalikan slice nil yang valid untuk append.',
        'Pola ini umum untuk mengelompokkan data.'
      ]
    },
    {
      type: 'tip',
      title: 'Map untuk mencari cepat',
      text: 'Map menyimpan data dengan pencarian sangat cepat (rata-rata O(1)). Bila kamu sering mengecek "apakah data ini sudah ada?" pada kumpulan besar, map jauh lebih cepat daripada menjelajahi slice satu per satu.'
    },
    {
      type: 'warn',
      title: 'Map tidak aman untuk akses bersamaan',
      text: 'Menulis ke map yang sama dari beberapa goroutine secara bersamaan menyebabkan program crash. Untuk situasi itu, gunakan <code>sync.Mutex</code> atau <code>sync.Map</code> (dibahas di bab concurrency).'
    },
    {
      type: 'vocab',
      items: [
        ['Map', 'Struktur key-value dengan pencarian cepat.'],
        ['Key', 'Kunci unik untuk mengambil nilai.'],
        ['Value', 'Nilai yang disimpan untuk sebuah key.'],
        ['make(map[K]V)', 'Cara membuat map kosong yang siap dipakai.'],
        ['delete', 'Menghapus entri map berdasarkan key.'],
        ['comma-ok', 'Idiom nilai, ada := m[key] untuk memeriksa keberadaan key.'],
        ['for range', 'Perulangan khusus untuk menjelajahi koleksi.']
      ]
    }
  ],
  recap: [
    'Map menyimpan pasangan key-value dan harus dibuat dengan make.',
    'Menugaskan ke key yang ada akan menimpa nilainya; delete menghapus entri.',
    'Comma-ok (v, ok := m[k]) membedakan key ada/tidak.',
    'for range menjelajahi slice dengan indeks-nilai dan map dengan key-value.',
    'Urutan iterasi map tidak dijamin; map tidak aman untuk akses paralel.'
  ]
});
