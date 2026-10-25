/* ============================================================
   Pelajaran Go — Bab 3: Alur Kontrol
   (topik info.md:
    - "Branching: if, else if, else"
    - "Switch Case: Standard switch, type switch, dan fallthrough"
    - "Looping: for loop (Go hanya memiliki satu jenis perulangan: for)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 7: Percabangan if, else if, else ---------- */
window.GO_LESSONS.push({
  id: 'percabangan',
  title: 'Percabangan: if, else if, else',
  chapter: 'Alur Kontrol',
  duration: '9 menit',
  intro: [
    'Program harus bisa mengambil keputusan: bila saldo cukup, lanjutkan transaksi; bila tidak, tampilkan peringatan. Alat dasar untuk itu adalah <b>if</b>.',
    'Go memiliki fitur unik pada <code>if</code>: kita bisa menyisipkan pernyataan pendek sebelum kondisi, sehingga variabel bantu hanya hidup di dalam blok itu.'
  ],
  objectives: [
    'Menulis percabangan dengan if, else if, dan else',
    'Memakai pernyataan inisialisasi di dalam if',
    'Menerapkan if untuk menangani error',
    'Menghindari percabangan bersarang yang berlebihan'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bentuk paling sederhana: <code>if kondisi { ... }</code>. Kondisi harus bertipe <code>bool</code> — Go <b>tidak</b> mengizinkan angka atau string diperlakukan sebagai kebenaran seperti di JavaScript atau Python.</p>'
    },
    {
      type: 'example',
      title: 'if, else if, dan else',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    nilai := 78

    if nilai >= 85 {
        fmt.Println("Nilai: A")
    } else if nilai >= 70 {
        fmt.Println("Nilai: B")
    } else if nilai >= 60 {
        fmt.Println("Nilai: C")
    } else {
        fmt.Println("Nilai: D")
    }
}`,
      explain: [
        'Kondisi diperiksa berurutan dari atas; blok pertama yang benar dijalankan.',
        '<b>Kurung buka { wajib berada di baris yang sama</b> dengan if/else — ini aturan gaya Go.',
        'Blok <code>else</code> menangkap semua kasus yang tersisa.'
      ]
    },
    {
      type: 'text',
      html: '<p>Fitur khas Go adalah <b>if dengan pernyataan inisialisasi</b>: bentuk <code>if init; kondisi { ... }</code>. Variabel yang dibuat pada bagian init hanya bisa dipakai di dalam if/else tersebut. Pola ini paling sering dipakai untuk memeriksa error dari sebuah fungsi.</p>'
    },
    {
      type: 'example',
      title: 'if dengan pernyataan inisialisasi',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "strconv"
)

func main() {
    // Variabel "angka" hanya hidup di dalam blok if/else ini.
    if angka, err := strconv.Atoi("123"); err == nil {
        fmt.Println("Berhasil dikonversi:", angka)
    } else {
        fmt.Println("Gagal konversi:", err)
    }
    // fmt.Println(angka) // ERROR: angka tidak dikenal di sini

    // Sama tanpa error, memakai pembatas lebar:
    if n := 15; n%2 == 0 {
        fmt.Println(n, "genap")
    } else {
        fmt.Println(n, "ganjil")
    }
}`,
      explain: [
        'Bagian sebelum titik koma adalah pernyataan pendek yang dijalankan dulu.',
        'Variabel hasil init <b>tidak bocor</b> ke luar blok — mengurangi polusi nama.',
        'Pola <code>if err := f(); err != nil { ... }</code> adalah gaya idiomatik Go dalam menangani error.'
      ]
    },
    {
      type: 'example',
      title: 'Menangani error ala Go',
      lang: 'go',
      output: false,
      code: `package main

import (
    "errors"
    "fmt"
)

func ambilStok(produk string) (int, error) {
    if produk == "" {
        return 0, errors.New("nama produk kosong")
    }
    return 42, nil
}

func main() {
    stok, err := ambilStok("")
    if err != nil {
        fmt.Println("Terjadi error:", err)
        return
    }
    fmt.Println("Stok:", stok)
}`,
      explain: [
        'Fungsi Go lazim mengembalikan nilai <b>dan</b> error sebagai hasil terakhir.',
        'Pola <code>if err != nil { return }</code> memisahkan jalur sukses dari jalur gagal.',
        '<code>return</code> di dalam main menghentikan program lebih awal.'
      ]
    },
    {
      type: 'tip',
      title: 'Kurangi sarang, jaga jalur bahagia di kiri',
      text: 'Alih-alih menyarangkan banyak if, kembalikan lebih awal saat ada error atau kondisi tidak valid. Gaya ini disebut <b>early return</b> dan membuat jalur "bahagia" (kondisi normal) tetap rata di sebelah kiri.'
    },
    {
      type: 'warn',
      title: 'Kondisi harus bool',
      text: 'Di Go, <code>if 1 { }</code> adalah error. Tidak ada konsep "truthy/falsy". Selalu tulis perbandingan eksplisit seperti <code>if jumlah > 0</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['if', 'Percabangan yang menjalankan blok bila kondisi benar.'],
        ['else if / else', 'Cabang alternatif bila kondisi sebelumnya salah.'],
        ['Pernyataan init', 'Pernyataan pendek sebelum kondisi if, mis. if x := f(); x != nil.'],
        ['Early return', 'Keluar lebih awal dari fungsi untuk mengurangi sarang percabangan.'],
        ['Idiomatik', 'Gaya penulisan yang lazim dan disepakati komunitas Go.']
      ]
    }
  ],
  recap: [
    'if memeriksa kondisi bertipe bool; kurung buka harus di baris yang sama.',
    'if dengan pernyataan init membatasi umur variabel bantu di dalam blok.',
    'Pola if err != nil { return } sangat khas dalam kode Go.',
    'Gunakan early return agar kode tidak bersarang terlalu dalam.',
    'Go tidak mengenal nilai truthy/falsy — kondisi harus benar-benar bool.'
  ]
});

/* ---------- Pelajaran 8: Switch, Type Switch & fallthrough ---------- */
window.GO_LESSONS.push({
  id: 'switch',
  title: 'Switch, Type Switch & fallthrough',
  chapter: 'Alur Kontrol',
  duration: '10 menit',
  intro: [
    'Ketika banyak kemungkinan harus diperiksa, rangkaian <code>if/else if</code> yang panjang menjadi tidak enak dibaca. <b>Switch</b> hadir untuk menyederhanakannya.',
    'Go punya dua bentuk switch: <b>switch nilai</b> (untuk membandingkan nilai) dan <b>switch tipe</b> (untuk memeriksa tipe sebuah interface). Keduanya dibahas di pelajaran ini.'
  ],
  objectives: [
    'Menulis switch pada nilai biasa',
    'Mengenal switch tanpa ekspresi (pengganti if-else panjang)',
    'Memahami fallthrough di Go',
    'Menulis switch tipe (type switch)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Berbeda dari bahasa C atau Java, di Go <b>tidak ada fallthrough otomatis</b>. Setelah satu <b>case</b> cocok dan dijalankan, switch berhenti dengan sendirinya. Jadi kita tidak perlu menulis <code>break</code> di setiap case.</p>'
    },
    {
      type: 'example',
      title: 'Switch pada nilai',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    hari := 6

    switch hari {
    case 1, 2, 3, 4, 5:
        fmt.Println("Hari kerja")
    case 6, 7:
        fmt.Println("Akhir pekan 🎉")
    default:
        fmt.Println("Hari tidak valid")
    }

    // case bisa punya banyak nilai sekaligus (dipisah koma)
    // default dipakai bila tidak ada yang cocok
}`,
      explain: [
        '<code>case 1, 2, 3, 4, 5</code> menggabungkan beberapa nilai dalam satu case.',
        'Setelah case cocok, switch otomatis berhenti — tidak perlu <code>break</code>.',
        '<code>default</code> bersifat opsional dan dijalankan bila tak ada case yang cocok.'
      ]
    },
    {
      type: 'example',
      title: 'Switch tanpa ekspresi dan dengan inisialisasi',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    nilai := 78

    // Switch tanpa ekspresi: setiap case adalah kondisi bool
    switch {
    case nilai >= 85:
        fmt.Println("A")
    case nilai >= 70:
        fmt.Println("B")
    default:
        fmt.Println("C atau kurang")
    }

    // Switch dengan pernyataan init, mirip if
    switch n := 4; n {
    case 0:
        fmt.Println("nol")
    default:
        fmt.Println("bukan nol:", n)
    }
}`,
      explain: [
        'Switch tanpa nilai (switch { }) bekerja seperti if/else if yang lebih rapi.',
        'Setiap <code>case</code> boleh berupa ekspresi bool lengkap.',
        'Bagian init (<code>n := 4;</code>) dijalankan sekali sebelum switch mengevaluasi.'
      ]
    },
    {
      type: 'example',
      title: 'fallthrough — lanjut ke case berikutnya',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    langkah := 2

    switch langkah {
    case 1:
        fmt.Println("Persiapan bahan")
        fallthrough
    case 2:
        fmt.Println("Panaskan minyak")
        fallthrough
    case 3:
        fmt.Println("Masak")
    case 4:
        fmt.Println("Sajikan")
    }
    // Keluaran: Panaskan minyak, lalu Masak
}`,
      explain: [
        '<code>fallthrough</code> memaksa eksekusi <b>lanjut ke case di bawahnya</b> tanpa memeriksa kondisinya.',
        'Go tidak memakai fallthrough otomatis — hanya bekerja bila ditulis eksplisit.',
        'Gunakan fallthrough dengan hati-hati karena mengurangi keterbacaan.'
      ]
    },
    {
      type: 'text',
      html: '<p>Bentuk kedua adalah <b>switch tipe</b> (type switch). Ia memeriksa <b>tipe dinamis</b> dari sebuah nilai <code>interface{}</code>. Bentuk tulisannya <code>switch v := x.(type)</code>, dan di setiap case <code>v</code> otomatis bertipe sesuai case tersebut.</p>'
    },
    {
      type: 'example',
      title: 'Switch tipe (type switch)',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func jelaskan(x interface{}) {
    switch v := x.(type) {
    case int:
        fmt.Println("Ini bilangan bulat:", v+1)
    case string:
        fmt.Println("Ini teks dengan panjang:", len(v))
    case bool:
        fmt.Println("Ini boolean:", v)
    case []int:
        fmt.Println("Ini slice int berisi", len(v), "elemen")
    default:
        fmt.Printf("Tipe tak dikenal: %T\n", v)
    }
}

func main() {
    jelaskan(42)
    jelaskan("halo")
    jelaskan(true)
    jelaskan([]int{1, 2, 3})
    jelaskan(3.14)
}`,
      explain: [
        '<code>x.(type)</code> hanya boleh dipakai di dalam switch tipe.',
        'Di tiap case, variabel <code>v</code> sudah bertipe konkret (mis. int pada <code>case int</code>).',
        '<code>case []int</code> menunjukkan tipe kompleks juga bisa diperiksa.',
        'Type switch adalah cara Go "mempercayai" tipe tanpa error seperti di bahasa dinamis.'
      ]
    },
    {
      type: 'tip',
      title: 'Switch Go lebih kuat dari yang terlihat',
      text: 'Karena case bisa berisi kondisi apa pun, switch tanpa ekspresi sering menggantikan rantai if/else yang panjang. Banyak programmer Go lebih suka gaya ini karena lebih rata dan mudah dibaca.'
    },
    {
      type: 'warn',
      title: 'fallthrough di case terakhir itu error',
      text: 'Bila <code>fallthrough</code> berada di case paling akhir (tidak ada case sesudahnya), kompilasi akan gagal. Pastikan selalu ada case tujuan di bawahnya.'
    },
    {
      type: 'vocab',
      items: [
        ['switch', 'Percabangan banyak kemungkinan yang diperiksa berurutan.'],
        ['case', 'Satu kemungkinan nilai atau kondisi dalam switch.'],
        ['default', 'Cabang yang dijalankan bila tidak ada case yang cocok.'],
        ['fallthrough', 'Lanjut ke case berikutnya tanpa memeriksa kondisinya.'],
        ['Type switch', 'Switch yang memeriksa tipe dinamis sebuah interface.'],
        ['interface{}', 'Tipe kosong yang bisa menampung nilai apa pun (alias any).']
      ]
    }
  ],
  recap: [
    'Switch tidak memerlukan break; tiap case berhenti sendiri.',
    'Switch tanpa ekspresi berperan seperti rantai if/else yang lebih rapi.',
    'fallthrough melanjutkan ke case berikutnya secara paksa.',
    'Type switch (switch v := x.(type)) memeriksa tipe dinamis.',
    'Selalu sediakan default untuk menangani kasus tak terduga.'
  ]
});

/* ---------- Pelajaran 9: Perulangan for ---------- */
window.GO_LESSONS.push({
  id: 'perulangan-for',
  title: 'Perulangan: Hanya Ada for',
  chapter: 'Alur Kontrol',
  duration: '10 menit',
  intro: [
    'Go hanya punya <b>satu</b> kata kunci perulangan: <code>for</code>. Tidak ada <code>while</code> atau <code>do-while</code>. Meski begitu, <code>for</code> bisa ditulis dalam beberapa gaya untuk menggantikan semuanya.',
    'Pelajaran ini membahas for klasik, for sebagai while, for tanpa henti, serta kontrol <b>break</b> dan <b>continue</b>.'
  ],
  objectives: [
    'Menulis for klasik dengan inisialisasi, kondisi, dan langkah',
    'Memakai for sebagai while',
    'Membuat perulangan tak terbatas dengan kontrol break',
    'Menggunakan continue untuk melewati iterasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bentuk klasik <code>for</code> terdiri dari tiga bagian dipisah titik koma: inisialisasi, kondisi, dan langkah. Ketiganya opsional.</p>'
    },
    {
      type: 'example',
      title: 'For klasik',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    for i := 0; i < 5; i++ {
        fmt.Println("iterasi", i)
    }

    // penjumlahan 1 sampai 10
    total := 0
    for i := 1; i <= 10; i++ {
        total += i
    }
    fmt.Println("total:", total) // 55
}`,
      explain: [
        '<code>i := 0</code> dijalankan sekali di awal.',
        '<code>i < 5</code> diperiksa sebelum setiap iterasi.',
        '<code>i++</code> dijalankan di akhir setiap iterasi.',
        '<code>i</code> hanya berlaku di dalam blok for.'
      ]
    },
    {
      type: 'example',
      title: 'For sebagai while',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Hanya kondisi -> seperti while
    n := 5
    for n > 0 {
        fmt.Println(n)
        n--
    }

    // loop tak terbatas + break
    hitung := 0
    for {
        hitung++
        if hitung == 3 {
            break   // keluar dari loop
        }
    }
    fmt.Println("berhenti di", hitung)
}`,
      explain: [
        '<code>for n > 0</code> berperilaku persis seperti while.',
        '<code>for { ... }</code> tanpa bagian apa pun adalah loop tak terbatas.',
        '<code>break</code> menghentikan perulangan seketika.'
      ]
    },
    {
      type: 'example',
      title: 'continue dan label',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // continue melewati iterasi saat ini
    for i := 1; i <= 6; i++ {
        if i%2 == 0 {
            continue   // lewati bilangan genap
        }
        fmt.Println("ganjil:", i)
    }

    // label untuk keluar dari loop bersarang
    luar:
    for i := 0; i < 3; i++ {
        for j := 0; j < 3; j++ {
            if i*j == 4 {
                break luar   // keluar dari KEDUA loop
            }
            fmt.Println(i, j)
        }
    }
}`,
      explain: [
        '<code>continue</code> melompat ke iterasi berikutnya, melewati sisa blok.',
        'Label seperti <code>luar:</code> memberi nama sebuah loop.',
        '<code>break luar</code> keluar dari loop berlabel, bukan hanya yang terdalam.'
      ]
    },
    {
      type: 'example',
      title: 'For range singkat',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    angka := []int{10, 20, 30}

    // i = indeks, v = nilai
    for i, v := range angka {
        fmt.Println(i, v)
    }

    // kita bisa mengabaikan indeks dengan _
    for _, v := range angka {
        fmt.Println(v * 2)
    }
}`,
      explain: [
        '<code>range</code> memudahkan iterasi atas slice, map, string, dan channel.',
        'Secara default range mengembalikan indeks dan nilai.',
        '<b>for range</b> dibahas lebih dalam di bab koleksi data.'
      ]
    },
    {
      type: 'tip',
      title: 'for range vs for klasik',
      text: 'Gunakan <code>for range</code> saat hanya perlu membaca isi koleksi — lebih ringkas dan aman dari kesalahan indeks. Gunakan for klasik bila butuh indeks yang dihitung (mis. melompati elemen atau iterasi mundur).'
    },
    {
      type: 'warn',
      title: 'Jangan lupa batas berhenti',
      text: 'Loop tak terbatas tanpa <code>break</code> akan membekukan program. Selalu pastikan ada kondisi yang menghentikannya, baik lewat kondisi, break, maupun return.'
    },
    {
      type: 'vocab',
      items: [
        ['for', 'Satu-satunya perulangan di Go.'],
        ['Inisialisasi', 'Bagian pertama for: membuat variabel penghitung.'],
        ['Kondisi', 'Bagian kedua for: diperiksa sebelum tiap iterasi.'],
        ['Langkah (post)', 'Bagian ketiga for: dijalankan di akhir tiap iterasi.'],
        ['break', 'Menghentikan perulangan.'],
        ['continue', 'Melewati sisa iterasi saat ini.'],
        ['Label', 'Nama pada loop untuk break/continue lintas level.']
      ]
    }
  ],
  recap: [
    'Go hanya punya for, tetapi bisa meniru for, while, dan loop tak terbatas.',
    'Bagian inisialisasi, kondisi, dan langkah semuanya opsional.',
    'break menghentikan loop; continue melewati satu iterasi.',
    'Label memungkinkan break/continue dari loop bersarang.',
    'for range adalah cara ringkas mengiterasi koleksi.'
  ]
});
