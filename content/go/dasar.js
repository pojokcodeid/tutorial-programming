/* ============================================================
   Pelajaran Go — Bab 2: Dasar-Dasar Bahasa Go
   (topik info.md:
    - "Variables & Constants: var, const, short variable declaration (:=)"
    - "Tipe Data Dasar: int, float, string, bool"
    - "Zero Values di Go"
    - "Type Conversion (Konversi tipe data)"
    - "Operator: Aritmatika, Perbandingan, dan Logika")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 3: Variabel & Konstanta ---------- */
window.GO_LESSONS.push({
  id: 'variabel-konstanta',
  title: 'Variabel & Konstanta',
  chapter: 'Dasar Bahasa Go',
  duration: '10 menit',
  intro: [
    'Setiap program butuh tempat menyimpan nilai: umur pengguna, harga barang, atau status login. Di Go, tempat penyimpanan itu disebut <b>variabel</b> dan <b>konstanta</b>.',
    'Pelajaran ini membahas tiga cara mendeklarasikan variabel (<code>var</code>, <code>:=</code>, dan bentuk berkelompok), serta kapan sebaiknya memakai <code>const</code>.'
  ],
  objectives: [
    'Mendeklarasikan variabel dengan var dan short declaration (:=)',
    'Memahami perbedaan var, :=, dan const',
    'Mendeklarasikan banyak variabel sekaligus',
    'Mengetahui aturan penamaan identifier di Go'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Ada dua kata kunci untuk variabel. <b>var</b> menyatakan variabel secara eksplisit, sedangkan <b>:=</b> adalah singkatan yang menebak tipe dari nilai di sebelah kanan. Varian <code>:=</code> hanya boleh dipakai di dalam fungsi.</p>'
    },
    {
      type: 'example',
      title: 'Tiga cara membuat variabel',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // 1) var dengan tipe eksplisit
    var nama string = "Andi"

    // 2) var dengan tipe ditebak (tanpa nilai => zero value)
    var umur int
    umur = 27

    // 3) short variable declaration (paling sering dipakai)
    kota := "Bandung"

    fmt.Println(nama, umur, kota)
}`,
      explain: [
        '<code>var nama string = "Andi"</code> menuliskan tipe secara jelas.',
        '<code>var umur int</code> membuat variabel dengan nilai nol (untuk int adalah 0), lalu diisi kemudian.',
        '<code>kota := "Bandung"</code> adalah cara paling ringkas; tipe ditentukan otomatis (string).',
        '<code>:=</code> tidak bisa dipakai di luar fungsi — di level package harus memakai <code>var</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Go memaksa setiap variabel yang dibuat <b>benar-benar dipakai</b>. Jika kamu mendeklarasikan variabel tetapi tidak pernah memakainya, kompilasi akan gagal dengan pesan <code>declared and not used</code>. Aturan ini terdengar menyebalkan, tetapi membuat kode selalu bersih.</p>'
    },
    {
      type: 'example',
      title: 'Mendeklarasikan banyak variabel sekaligus',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Beberapa variabel satu baris
    var panjang, lebar int = 10, 5

    // Bentuk blok, cocok untuk variabel terkait
    var (
        namaDepan  = "Budi"
        namaBelakang = "Santoso"
        aktif      = true
    )

    // += dan penugasan berantai
    total := 0
    total += panjang * lebar

    fmt.Println(namaDepan, namaBelakang, aktif, total)
}`,
      explain: [
        'Beberapa variabel bertipe sama bisa ditulis satu <code>var</code>.',
        'Blok <code>var ( ... )</code> mengelompokkan deklarasi agar rapi.',
        '<code>total += panjang * lebar</code> menyingkat <code>total = total + panjang*lebar</code>.',
        'Nilai-nilai yang tidak pernah dipakai (<code>namaDepan</code> dipakai di Println) tetap dihitung agar lolos kompilasi.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sebuah <b>konstanta</b> (<code>const</code>) adalah nilai yang tidak boleh berubah setelah ditetapkan. Konstanta harus diisi langsung saat dideklarasikan dan tidak bisa diubah kemudian. Gunakan konstanta untuk nilai tetap seperti tarif pajak atau nama aplikasi.</p>'
    },
    {
      type: 'example',
      title: 'Konstanta dan iota',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

const PPN = 0.11           // konstanta sederhana
const NamaAplikasi = "TokoKu"

// iota membuat penghitung otomatis
const (
    StatusBaru = iota      // 0
    StatusDiproses         // 1
    StatusSelesai          // 2
    StatusBatal            // 3
)

func main() {
    const hariPerMinggu = 7
    fmt.Println(NamaAplikasi, PPN, hariPerMinggu)
    fmt.Println(StatusBaru, StatusSelesai)
}`,
      explain: [
        '<code>const PPN = 0.11</code> tidak bisa diubah nilainya di baris lain.',
        '<b>iota</b> adalah penghitung yang bertambah otomatis di dalam blok <code>const</code> — sangat berguna untuk membuat enumerasi (daftar status).',
        'Konstanta harus berupa nilai yang bisa dihitung saat kompilasi (angka atau teks tetap).',
        'Konstanta boleh juga dideklarasikan di dalam fungsi seperti <code>hariPerMinggu</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Aturan penamaan (<b>identifier</b>) di Go sederhana:</p><ul><li>Boleh huruf, angka, dan garis bawah (<code>_</code>), tetapi tidak boleh diawali angka.</li><li>Bersifat <b>case-sensitive</b>: <code>nama</code> dan <code>Nama</code> berbeda.</li><li>Nama yang <b>diawali huruf kapital</b> bersifat <b>exproted</b> (bisa diakses dari package lain); yang diawali huruf kecil bersifat privat bagi package.</li><li>Konvensi Go memakai <b>camelCase</b> (<code>namaLengkap</code>), bukan snake_case.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Tanda garis bawah _',
      text: 'Identifier <code>_</code> adalah "blank identifier" — tempat membuang nilai yang tidak dipakai. Contoh: <code>_, err := doSomething()</code> berarti kita mengabaikan hasil pertama dan hanya peduli pada error.'
    },
    {
      type: 'warn',
      title: 'const bukan var',
      text: 'Konstanta tidak boleh diisi dengan hasil pemanggilan fungsi, karena nilainya harus diketahui saat kompilasi. Baris seperti <code>const sekarang = time.Now()</code> akan gagal; gunakan <code>var</code> untuk kasus itu.'
    },
    {
      type: 'vocab',
      items: [
        ['Variabel', 'Tempat menyimpan nilai yang bisa berubah.'],
        ['var', 'Kata kunci untuk mendeklarasikan variabel.'],
        [':=', 'Short variable declaration; tipe ditebak dari nilai.'],
        ['const', 'Nilai tetap yang tidak boleh berubah setelah dideklarasikan.'],
        ['iota', 'Penghitung otomatis di dalam blok const.'],
        ['Blank identifier _', 'Penanda untuk membuang nilai yang tidak dipakai.'],
        ['Exported identifier', 'Nama yang diawali huruf kapital, dapat diakses dari package lain.']
      ]
    }
  ],
  recap: [
    'var untuk deklarasi eksplisit; := untuk ringkas di dalam fungsi; const untuk nilai tetap.',
    'Go menolak variabel yang tidak terpakai.',
    'Banyak variabel bisa dideklarasikan sekaligus, termasuk lewat blok var ( ... ).',
    'iota membuat enumerasi otomatis di dalam blok const.',
    'Nama berawalan huruf kapital bersifat exported; konvensi memakai camelCase.'
  ]
});

/* ---------- Pelajaran 4: Tipe Data Dasar & Zero Values ---------- */
window.GO_LESSONS.push({
  id: 'tipe-data-zero',
  title: 'Tipe Data Dasar & Zero Values',
  chapter: 'Dasar Bahasa Go',
  duration: '10 menit',
  intro: [
    'Go adalah bahasa <b>bertipe statis</b> (statically typed): setiap nilai punya tipe yang ditentukan saat kompilasi. Tipe menentukan nilai apa yang boleh disimpan dan operasi apa yang boleh dilakukan.',
    'Pelajaran ini membahas tipe dasar — <b>int</b>, <b>float</b>, <b>string</b>, <b>bool</b> — serta konsep khas Go: <b>zero value</b>.'
  ],
  objectives: [
    'Mengenal tipe data dasar Go',
    'Memilih tipe bilangan yang sesuai',
    'Memahami zero value setiap tipe',
    'Mengetahui tipe byte, rune, dan tipe turunan'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tipe dasar Go terbagi menjadi empat keluarga besar:</p><table class="vocab"><tr><th>Kelompok</th><th>Tipe</th><th>Contoh</th></tr><tr><td>Bilangan bulat</td><td>int, int8, int16, int32, int64, uint</td><td>42, -7</td></tr><tr><td>Bilangan pecahan</td><td>float32, float64</td><td>3.14, -0.5</td></tr><tr><td>Teks</td><td>string</td><td>"halo"</td></tr><tr><td>Logika</td><td>bool</td><td>true, false</td></tr></table><p><code>int</code> dan <code>uint</code> ukurannya mengikuti arsitektur komputer (umumnya 64-bit di mesin modern). Untuk pemula, gunakan <code>int</code> dan <code>float64</code> sebagai default.</p>'
    },
    {
      type: 'example',
      title: 'Tipe dasar dalam praktik',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    var umur int = 27
    var tinggi float64 = 172.5
    var nama string = "Citra"
    var menikah bool = false

    // %T mencetak TIPE data, %v mencetak NILAI
    fmt.Printf("%v bertipe %T\n", umur, umur)
    fmt.Printf("%v bertipe %T\n", tinggi, tinggi)
    fmt.Printf("%v bertipe %T\n", nama, nama)
    fmt.Printf("%v bertipe %T\n", menikah, menikah)
}`,
      explain: [
        '<code>int</code> untuk bilangan bulat, <code>float64</code> untuk pecahan berpresisi tinggi.',
        '<code>string</code> untuk teks, ditulis dengan tanda kutip ganda.',
        '<code>bool</code> hanya bernilai <code>true</code> atau <code>false</code>.',
        'Kata format <code>%T</code> menampilkan tipe variabel — berguna saat belajar atau mendebug.'
      ]
    },
    {
      type: 'text',
      html: '<p>Keunikan Go: setiap variabel yang dideklarasikan tanpa nilai otomatis diberi <b>zero value</b> (nilai nol) yang sesuai tipe-nya. Go tidak punya nilai <code>undefined</code> ataupun <code>null</code> untuk tipe dasar. Inilah zero value tiap tipe:</p><table class="vocab"><tr><th>Tipe</th><th>Zero Value</th></tr><tr><td>int, int64, uint</td><td><code>0</code></td></tr><tr><td>float32, float64</td><td><code>0</code></td></tr><tr><td>string</td><td><code>""</code> (teks kosong)</td></tr><tr><td>bool</td><td><code>false</code></td></tr><tr><td>pointer, slice, map, channel, interface</td><td><code>nil</code></td></tr></table>'
    },
    {
      type: 'example',
      title: 'Melihat zero value',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    var a int
    var b float64
    var c string
    var d bool
    var e []int      // slice
    var f map[string]int

    fmt.Printf("int    : %v\n", a)   // 0
    fmt.Printf("float64: %v\n", b)   // 0
    fmt.Printf("string : %q\n", c)   // ""
    fmt.Printf("bool   : %v\n", d)   // false
    fmt.Printf("slice  : %v (nil? %v)\n", e, e == nil) // [] (nil? true)
    fmt.Printf("map    : %v (nil? %v)\n", f, f == nil) // map[] (nil? true)
}`,
      explain: [
        'Karena zero value selalu terdefinisi, kode Go tidak pernah menemui "variabel belum diisi".',
        'String kosong <code>""</code> berbeda dari <code>nil</code>; string selalu punya nilai.',
        'Slice dan map bertipe referensi, jadi zero value-nya <code>nil</code> — harus dibuat dengan <code>make</code> sebelum dipakai.',
        '<code>%q</code> mencetak string dalam tanda kutip agar mudah melihat teks kosong.'
      ]
    },
    {
      type: 'text',
      html: '<p>Dua tipe khusus yang sering membingungkan pemula: <b>byte</b> dan <b>rune</b>. Keduanya sebenarnya nama lain dari bilangan bulat.</p><ul><li><b>byte</b> = alias dari <code>uint8</code> (0–255). Dipakai untuk data biner dan karakter ASCII.</li><li><b>rune</b> = alias dari <code>int32</code>. Dipakai untuk mewakili satu <b>karakter Unicode</b>, sehingga aman untuk huruf beraksen maupun emoji.</li></ul>'
    },
    {
      type: 'example',
      title: 'string, byte, dan rune',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    s := "Go🎉"

    fmt.Println("jumlah byte :", len(s))      // 6 (emoji memakai 4 byte)

    // Iterasi per rune (karakter Unicode)
    for i, r := range s {
        fmt.Printf("posisi %d: %c (kode %d)\n", i, r, r)
    }
}`,
      explain: [
        '<code>len(s)</code> menghitung jumlah <b>byte</b>, bukan jumlah karakter. Emoji memakan 4 byte.',
        'Perulangan <code>range</code> atas string menghasilkan posisi byte dan <b>rune</b> (karakter).',
        '<code>%c</code> mencetak karakter; <code>%d</code> mencetak kode bilangannya.'
      ]
    },
    {
      type: 'tip',
      title: 'Default: int dan float64',
      text: 'Bila tidak ada alasan khusus, pakai <code>int</code> untuk bilangan bulat dan <code>float64</code> untuk pecahan. Ukuran <code>int</code> mengikuti mesin, sehingga operasinya paling cepat. Tipe berukuran tetap (int32, int64) dipakai saat butuh ukuran pasti, misalnya format data biner.'
    },
    {
      type: 'warn',
      title: 'Nol bukan berarti kosong',
      text: 'Karena zero value <code>int</code> adalah <code>0</code>, kita tidak bisa membedakan antara "belum diisi" dan "bernilai nol" hanya dari tipe dasar. Bila perbedaan itu penting, gunakan pointer (<code>*int</code>) atau tipe <code>sql.NullInt64</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Statically typed', 'Tipe setiap nilai ditentukan saat kompilasi, bukan saat program berjalan.'],
        ['int / uint', 'Bilangan bulat bertanda / tak bertanda.'],
        ['float64', 'Bilangan pecahan presisi ganda (default Go).'],
        ['string', 'Deretan byte yang mewakili teks (UTF-8).'],
        ['bool', 'Tipe logika bernilai true atau false.'],
        ['Zero value', 'Nilai bawaan sebuah tipe saat tidak diberi nilai.'],
        ['byte', 'Alias uint8, untuk data biner / ASCII.'],
        ['rune', 'Alias int32, untuk satu karakter Unicode.']
      ]
    }
  ],
  recap: [
    'Go bertipe statis: setiap nilai punya tipe tetap.',
    'Tipe dasar utama: int, float64, string, bool.',
    'Setiap tipe punya zero value (0, "", false, atau nil untuk referensi).',
    'byte = uint8 untuk ASCII/biner; rune = int32 untuk karakter Unicode.',
    'Default aman untuk pemula: int dan float64.'
  ]
});

/* ---------- Pelajaran 5: Konversi Tipe & Operator ---------- */
window.GO_LESSONS.push({
  id: 'konversi-operator',
  title: 'Konversi Tipe & Operator',
  chapter: 'Dasar Bahasa Go',
  duration: '11 menit',
  intro: [
    'Go <b>tidak melakukan konversi tipe otomatis</b>. Menjumlahkan <code>int</code> dengan <code>float64</code> adalah error; kita harus mengonversi secara eksplisit. Aturan ini terasa kaku, tetapi mencegah banyak bug diam-diam.',
    'Pelajaran ini membahas cara mengonversi tipe dengan <code>T(nilai)</code> serta semua operator: aritmatika, perbandingan, dan logika.'
  ],
  objectives: [
    'Melakukan konversi tipe secara eksplisit',
    'Mengenal risiko kehilangan presisi saat konversi',
    'Memakai operator aritmatika, perbandingan, dan logika',
    'Mengetahui operator bitwise dan penugasan majemuk'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bentuk konversi di Go adalah <code>T(nilai)</code> dengan T adalah tipe tujuan. Contoh <code>float64(5)</code> mengubah bilangan bulat 5 menjadi pecahan 5.0. Konversi ini eksplisit — tidak ada penebakan tipe diam-diam seperti di JavaScript.</p>'
    },
    {
      type: 'example',
      title: 'Konversi antar tipe dasar',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    var bulat int = 42
    var pecahan float64 = float64(bulat)   // int -> float64
    var lagi int = int(3.99)               // float64 -> int (dipotong!)

    fmt.Println(pecahan)   // 42
    fmt.Println(lagi)      // 3  (bukan 4 — pembulatan ke bawah)

    // string <-> angka
    angka := 7
    teks := fmt.Sprintf("%d", angka)       // int -> string
    fmt.Println("teks:", teks)

    var nilai int
    fmt.Sscanf("123", "%d", &nilai)
    fmt.Println("nilai:", nilai)
}`,
      explain: [
        '<code>float64(bulat)</code> mengubah int ke float64 tanpa kehilangan nilai.',
        '<code>int(3.99)</code> memotong bagian pecahan menjadi 3 — konversi bukan pembulatan.',
        '<code>fmt.Sprintf</code> mengubah nilai menjadi string berformat.',
        '<code>fmt.Sscanf</code> membaca angka dari string; tanda <code>&</code> mengisi variabel lewat pointer.'
      ]
    },
    {
      type: 'example',
      title: 'Antara string dan potongan byte/rune',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // string -> []byte dan sebaliknya
    b := []byte("Halo")
    fmt.Println(b)              // [72 97 108 111]
    fmt.Println(string(b))      // Halo

    // int -> string menghasilkan KARAKTER (kode Unicode)
    fmt.Println(string(65))     // A
    fmt.Println(string(rune(66))) // B

    // string -> []rune (aman untuk karakter non-ASCII)
    r := []rune("Hai👋")
    fmt.Println(len(r))         // 4 karakter
}`,
      explain: [
        '<code>[]byte("Halo")</code> mengubah teks menjadi deretan angka byte.',
        '<code>string(65)</code> bukan "65", melainkan karakter dengan kode 65 yaitu <code>A</code>.',
        'Untuk mengubah angka menjadi teks angka, gunakan <code>strconv.Itoa</code> atau <code>fmt.Sprintf</code>.',
        '<code>[]rune</code> menghitung per karakter Unicode, bukan per byte.'
      ]
    },
    {
      type: 'text',
      html: '<p>Operator aritmatika di Go sama seperti bahasa lain, dengan satu catatan penting: <b>operator modulus <code>%</code> hanya berlaku untuk bilangan bulat</b>.</p><table class="vocab"><tr><th>Operator</th><th>Arti</th><th>Contoh (a=7, b=3)</th></tr><tr><td>+</td><td>penjumlahan</td><td>a + b = 10</td></tr><tr><td>-</td><td>pengurangan</td><td>a - b = 4</td></tr><tr><td>*</td><td>perkalian</td><td>a * b = 21</td></tr><tr><td>/</td><td>pembagian</td><td>a / b = 2 (int!)</td></tr><tr><td>%</td><td>sisa bagi</td><td>a % b = 1</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Aritmatika & pembagian bilangan bulat',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    a, b := 7, 3

    fmt.Println(a / b)          // 2  (bagian pecahan dibuang)
    fmt.Println(float64(a) / float64(b)) // 2.3333...

    // Penugasan majemuk
    n := 10
    n += 5   // 15
    n -= 3   // 12
    n *= 2   // 24
    n /= 4   // 6
    n++      // 7  (tidak ada ++n di Go)
    fmt.Println(n)
}`,
      explain: [
        'Pembagian dua bilangan bulat selalu menghasilkan bilangan bulat.',
        'Untuk hasil pecahan, konversi dulu salah satu operand ke float64.',
        'Go punya <code>n++</code> sebagai pernyataan, tetapi <b>tidak</b> memiliki <code>++n</code> dan tidak mengembalikan nilai.'
      ]
    },
    {
      type: 'example',
      title: 'Perbandingan & logika',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    x, y := 5, 8

    fmt.Println(x == y)   // false
    fmt.Println(x != y)   // true
    fmt.Println(x < y)    // true
    fmt.Println(x >= y)   // false

    // Logika: && (dan), || (atau), ! (tidak)
    umur := 20
    punyaKTP := true
    bolehMemilih := umur >= 17 && punyaKTP
    fmt.Println("boleh memilih:", bolehMemilih)

    fmt.Println(!false)   // true
}`,
      explain: [
        'Operator perbandingan selalu menghasilkan <code>bool</code>.',
        '<code>&&</code> butuh kedua sisi benar; <code>||</code> butuh salah satu benar.',
        'Short-circuit: pada <code>a && b</code>, bila <code>a</code> salah, <code>b</code> tidak dievaluasi.'
      ]
    },
    {
      type: 'example',
      title: 'Operator bitwise',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    a, b := 6, 3   // 110 dan 011 dalam biner

    fmt.Println(a & b)   // 2  (AND  -> 010)
    fmt.Println(a | b)   // 7  (OR   -> 111)
    fmt.Println(a ^ b)   // 5  (XOR  -> 101)
    fmt.Println(a << 1)  // 12 (geser kiri)
    fmt.Println(a >> 1)  // 3  (geser kanan)
}`,
      explain: [
        'Operator bitwise bekerja pada representasi biner bilangan.',
        '<code>&</code>, <code>|</code>, <code>^</code> berguna untuk operasi bendera (flag) atau protokol.',
        '<code><<</code> dan <code>>></code> menggeser bit — setara mengali/membagi dengan pangkat dua.'
      ]
    },
    {
      type: 'tip',
      title: 'strconv untuk konversi string-angka',
      text: 'Untuk konversi sederhana antara string dan angka, package <code>strconv</code> lebih cepat daripada fmt: <code>strconv.Itoa(42)</code> (int ke string) dan <code>strconv.Atoi("42")</code> (string ke int). Padanan <code>Atoi</code> mengembalikan error yang wajib diperiksa.'
    },
    {
      type: 'warn',
      title: 'Hati-hati kehilangan data',
      text: 'Mengonversi <code>float64</code> ke <code>int</code> memotong pecahan, dan mengonversi <code>int64</code> besar ke <code>int32</code> bisa meluap (overflow). Selalu pastikan rentang nilai aman sebelum mengonversi.'
    },
    {
      type: 'vocab',
      items: [
        ['Konversi tipe', 'Mengubah nilai dari satu tipe ke tipe lain dengan T(nilai).'],
        ['Truncation', 'Pemotongan bagian pecahan saat float dikonversi ke int.'],
        ['Overflow', 'Nilai melebihi kapasitas tipe tujuan sehingga hasilnya kacau.'],
        ['Modulus %', 'Operator sisa bagi, hanya untuk bilangan bulat.'],
        ['Bitwise', 'Operator yang bekerja pada bit: & | ^ << >>.'],
        ['Short-circuit', 'Evaluasi logika yang berhenti lebih awal bila hasilnya sudah pasti.']
      ]
    }
  ],
  recap: [
    'Go menuntut konversi tipe eksplisit dengan T(nilai).',
    'Konversi float ke int memotong pecahan; int64 ke int32 bisa meluap.',
    'Operator aritmatika: + - * / %, dengan % hanya untuk bilangan bulat.',
    'Perbandingan menghasilkan bool; logika memakai &&, ||, dan !.',
    'Operator bitwise & | ^ << >> berguna untuk bendera dan protokol.'
  ]
});
