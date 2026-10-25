/* ============================================================
   Pelajaran Go — Bab 2: Dasar-Dasar Bahasa Go
   (topik info.md:
    - "Komentar: komentar baris (//), komentar blok, dan doc comment (godoc)"
    - "Input & Output: fmt.Print, Println, Printf, Sprint, Sprintf, Fprintf"
    - "Format verb (%d %s %v %T %q %f) & membaca masukan (Scan, Scanln, Scanf, bufio)"
    - "Variables & Constants: var, const, short variable declaration (:=)"
    - "Blank identifier (_): membuang nilai yang tidak dipakai"
    - "Keyword new (pointer ke zero value) & make (slice, map, channel)"
    - "Tipe Data Dasar: int, float, string, bool"
    - "Zero Values di Go"
    - "Type Conversion (Konversi tipe data)"
    - "Operator: Aritmatika, Perbandingan, dan Logika"
    - "Fungsi bawaan min() dan max() (sejak Go 1.21)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 3: Input & Output: Print, Scan, dan fmt ---------- */
window.GO_LESSONS.push({
  id: 'input-output',
  title: 'Input & Output: Print, Scan, dan fmt',
  chapter: 'Dasar Bahasa Go',
  duration: '14 menit',
  intro: [
    'Program berbicara dengan dunia luar lewat dua pintu: <b>stdout</b> untuk mencetak keluaran dan <b>stdin</b> untuk membaca masukan. Di Go hampir semuanya ditangani oleh package <b>fmt</b> (format).',
    'Pelajaran ini membahas cara mencetak nilai — <code>Print</code>, <code>Println</code>, <code>Printf</code>, <code>Sprintf</code>, <code>Fprintf</code> — beserta format verb-nya, lalu cara membaca masukan dengan <code>Scan</code>, <code>Scanln</code>, <code>Scanf</code>, dan <code>bufio</code>.'
  ],
  objectives: [
    'Mencetak nilai dengan Print, Println, dan Printf',
    'Menguasai format verb Printf (%d, %s, %v, %T, %q, %f)',
    'Membentuk string dengan Sprintf tanpa mencetak',
    'Membaca masukan dari stdin dengan Scan, Scanln, dan Scanf',
    'Membaca banyak baris dengan bufio.Scanner',
    'Membedakan fungsi bawaan print/println dengan package fmt'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Go tidak punya pernyataan <code>print</code> ala bahasa lain. Mencetak adalah <b>pemanggilan fungsi</b>, dan hampir semuanya ada di package <code>fmt</code>. Package ini punya tiga kelompok dengan pola penamaan yang sama sekali konsisten:</p><table class="vocab"><tr><th>Pola</th><th>Bekerja pada</th><th>Contoh</th></tr><tr><td>Tanpa awalan</td><td><b>stdin</b> dan <b>stdout</b></td><td><code>fmt.Println</code>, <code>fmt.Scan</code></td></tr><tr><td>Berawalan <b>F</b></td><td><b>io.Writer</b> / <b>io.Reader</b> (berkas, buffer, HTTP)</td><td><code>fmt.Fprintf</code>, <code>fmt.Fscan</code></td></tr><tr><td>Berawalan <b>S</b></td><td><b>string</b></td><td><code>fmt.Sprintf</code>, <code>fmt.Sscanf</code></td></tr></table><p>Sekali hafal pola ini, Anda bisa menebak nama fungsi <code>fmt</code> mana pun. Ada juga fungsi <b>bawaan</b> <code>print()</code> dan <code>println()</code> (tanpa package) — menulis ke <b>stderr</b> dengan format yang tidak dijanjikan, disediakan hanya untuk debugging compiler, jangan dipakai di kode produksi.</p>'
    },
    {
      type: 'example',
      title: 'Print dan Println',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Print TIDAK menambah newline sendiri
    fmt.Print("Halo")
    fmt.Println(" dunia") // menyambung di baris yang sama

    // Println: spasi antar argumen + newline di akhir
    fmt.Println("umur:", 27, "aktif:", true)

    // Perbedaan aturan spasi pada Print
    fmt.Print("a", "b") // ab   dua string -> tanpa spasi
    fmt.Println()
    fmt.Print("a", 1)   // a1   ada string -> tanpa spasi
    fmt.Println()
    fmt.Print(1, 2)     // 1 2  dua angka  -> diberi spasi
    fmt.Println()
}`,
      explain: [
        '<code>fmt.Print</code> <b>tidak</b> menambah baris baru — cocok untuk progress dot atau menyambung keluaran.',
        '<code>fmt.Println</code> selalu menutup dengan <code>\\n</code> dan menaruh spasi antar argumen.',
        'Aturan spasi <code>Print</code>: spasi ditambahkan hanya bila <b>kedua</b> argumen bukan string.',
        'Tiga fungsi ini menulis ke <b>stdout</b>; keluaran bisa dialihkan dengan <code>&gt;</code> atau <code>|</code> seperti program lain.'
      ]
    },
    {
      type: 'text',
      html: '<p>Ringkasan fungsi cetak yang paling sering dipakai:</p><table class="vocab"><tr><th>Fungsi</th><th>Hasil ditulis ke</th><th>Akhir baris</th><th>Catatan</th></tr><tr><td><code>fmt.Print(a, b)</code></td><td>stdout</td><td>tidak</td><td>spasi hanya bila bukan string</td></tr><tr><td><code>fmt.Println(a, b)</code></td><td>stdout</td><td>ya</td><td>spasi selalu ditambahkan</td></tr><tr><td><code>fmt.Printf(format, ...)</code></td><td>stdout</td><td>sesuai <code>\\n</code> di format</td><td>format verb: %d, %s, %v, dst.</td></tr><tr><td><code>fmt.Sprint</code> / <code>Sprintln</code></td><td>string</td><td>tidak / ya</td><td>hasil dikembalikan, bukan dicetak</td></tr><tr><td><code>fmt.Sprintf(format, ...)</code></td><td>string</td><td>tidak</td><td>paling sering dipakai untuk merangkai pesan</td></tr><tr><td><code>fmt.Fprint</code> / <code>Fprintln</code> / <code>Fprintf</code></td><td>io.Writer</td><td>tergantung fungsi</td><td>berkas, buffer, <code>http.ResponseWriter</code></td></tr></table>'
    },
    {
      type: 'example',
      title: 'Printf dan format verb',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Produk struct {
    Nama  string
    Harga int
}

func main() {
    p := Produk{Nama: "Kopi", Harga: 25000}

    fmt.Printf("int    : %d\\n", p.Harga)
    fmt.Printf("string : %s | teks kutip: %q\\n", p.Nama, p.Nama)
    fmt.Printf("bool   : %t | float: %.2f | hex: %x\\n", true, 3.14159, 255)
    fmt.Printf("default: %v\\n", p)
    fmt.Printf("rinci  : %+v\\n", p)
    fmt.Printf("tipe    : %T | persen literal: 100%%\\n", p)
    fmt.Printf("lebar   : [%5d] [%-5d]\\n", 42, 42)
}`,
      explain: [
        '<code>Printf</code> tidak menambah newline otomatis — tulis sendiri <code>\\n</code> di akhir format.',
        '<code>%v</code> menampilkan nilai apa adanya, <code>%+v</code> menyertakan nama field struct.',
        '<code>%T</code> menampilkan tipe data, sangat membantu saat debugging.',
        '<code>%5d</code> melebarkan ke kanan, <code>%-5d</code> rata kiri, <code>%%</code> untuk tanda persen itu sendiri.'
      ]
    },
    {
      type: 'text',
      html: '<p>Daftar verb yang paling sering dipakai dalam <code>Printf</code>:</p><table class="vocab"><tr><th>Verb</th><th>Untuk</th><th>Contoh hasil</th></tr><tr><td><code>%d</code></td><td>bilangan bulat</td><td>42</td></tr><tr><td><code>%b %o %x</code></td><td>biner, oktal, heksadesimal</td><td>101010, 52, 2a</td></tr><tr><td><code>%f</code> / <code>%.2f</code></td><td>pecahan (default 6 desimal)</td><td>3.141593 / 3.14</td></tr><tr><td><code>%s</code></td><td>teks</td><td>Kopi</td></tr><tr><td><code>%q</code></td><td>teks bersarang tanda kutip</td><td>"Kopi"</td></tr><tr><td><code>%t</code></td><td>boolean</td><td>true</td></tr><tr><td><code>%v</code></td><td>nilai secara default</td><td>{Kopi 25000}</td></tr><tr><td><code>%+v</code></td><td>struct lengkap dengan nama field</td><td>{Nama:Kopi Harga:25000}</td></tr><tr><td><code>%T</code></td><td>tipe data</td><td>main.Produk</td></tr><tr><td><code>%p</code></td><td>alamat pointer</td><td>0xc000014080</td></tr><tr><td><code>%%</code></td><td>tanda persen</td><td>%</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Sprintf: merangkai string tanpa mencetak',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    nama := "Andi"
    umur := 27

    // Sprintf mengembalikan string — belum ada yang tampil di layar
    s := fmt.Sprintf("%s berumur %d tahun", nama, umur)
    fmt.Println(s)            // hanya baris ini yang mencetak
    fmt.Println("panjang:", len(s))

    // Sprintln menambah \\n pada hasilnya
    eks := fmt.Sprintln("nilai", 42)
    fmt.Printf("%q\\n", eks)   // "nilai 42\\n"

    // Salah kaprah yang sering terjadi:
    // pesan := "umur: " + umur  // ERROR: string + int tidak boleh
    // pesan := fmt.Sprintf("umur: %d", umur)  // cara yang benar
}`,
      explain: [
        '<code>Sprintf</code> dipakai saat kita butuh <b>string</b>-nya dulu: pesan error, URL, nama berkas, label, atau log.',
        'String tidak bisa digabung dengan angka memakai <code>+</code> — Go menolak pencampuran tipe.',
        '<code>Sprintln</code> menambahkan newline di akhir hasil, <code>Sprint</code> tidak.',
        'Butuh lebih dari satu kata dan angka? <code>Sprintf</code> biasanya lebih rapi daripada <code>Sprint(a, b, c)</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Fprintf: menulis ke io.Writer',
      lang: 'go',
      output: false,
      code: `package main

import (
    "bytes"
    "fmt"
    "os"
)

func main() {
    var buf bytes.Buffer

    // Fprintf menulis ke objek yang mengimplementasi io.Writer
    fmt.Fprintf(&buf, "User #%d: %s\\n", 1, "Budi")

    // stdout hanyalah salah satu io.Writer
    fmt.Fprintf(os.Stdout, "isi buffer: %s", buf.String())
}`,
      explain: [
        'Di balik layar, <code>fmt.Println</code> sama dengan <code>fmt.Fprintln(os.Stdout, ...)</code>.',
        '<code>bytes.Buffer</code> adalah <code>io.Writer</code> di memori — berguna untuk menguji kode tanpa menyentuh berkas.',
        'Saat menulis respons HTTP, yang dipakai adalah <code>fmt.Fprintf(w, ...)</code> dengan <code>w http.ResponseWriter</code>.',
        'Kebalikannya ada: <code>fmt.Fscan(r, ...)</code> membaca dari <code>io.Reader</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'log untuk keluaran bermeter waktu',
      text: 'Bila butuh keluaran yang menyimpan waktu (log server, CLI yang dipantau), pakai package <code>log</code>: <code>log.Println("gagal:", err)</code> otomatis menulis tanggal dan waktu ke <b>stderr</b>. Untuk keluaran biasa yang harus bisa diparse program lain, tetap pakai <code>fmt</code>.'
    },
    {
      type: 'warn',
      title: 'Dua kesalahan cetak yang sering terjadi',
      text: 'Pertama, jangan memakai fungsi bawaan <code>print()</code>/<code>println()</code> — hasilnya ke stderr, bentuknya tidak dijamin antar versi Go, dan tidak mendukung format. Kedua, <code>fmt.Println("umur: " + umur)</code> gagal kompilasi karena <code>int</code> tidak boleh digabung dengan <code>string</code>; gunakan <code>Printf</code> atau <code>Sprintf</code>.'
    },
    {
      type: 'text',
      html: '<p>Untuk <b>membaca masukan</b>, package <code>fmt</code> menyediakan fungsi kembar dari fungsi cetaknya: <code>Scan</code>, <code>Scanln</code>, dan <code>Scanf</code>. Ketiganya mengisi variabel lewat <b>pointer</b>, sehingga wajib ditulis <code>&amp;nama</code>, bukan <code>nama</code>.</p><table class="vocab"><tr><th>Fungsi</th><th>Cara kerja</th><th>Cocok untuk</th></tr><tr><td><code>fmt.Scan(&amp;a, &amp;b)</code></td><td>memisah masukan dengan spasi, tab, atau newline; terus sampai habis</td><td>input sederhana dan cepat</td></tr><tr><td><code>fmt.Scanln(&amp;a, &amp;b)</code></td><td>sama, tetapi berhenti di akhir baris — sisa isi baris menjadi error</td><td>memastikan satu baris = satu jawaban</td></tr><tr><td><code>fmt.Scanf("%s %f", &amp;a, &amp;b)</code></td><td>pola baca mengikuti format yang kita tulis</td><td>masukan berformat tetap</td></tr><tr><td><code>bufio.NewReader(os.Stdin).ReadString(\'\\n\')</code></td><td>mengambil satu baris utuh, termasuk spasi di dalamnya</td><td>nama lengkap, kalimat</td></tr><tr><td><code>bufio.NewScanner(os.Stdin)</code></td><td>menelusuri masukan baris demi baris</td><td>membaca banyak baris</td></tr></table><p>Ketiga fungsi <code>Scan*</code> mengembalikan <b>dua nilai</b>: jumlah item yang berhasil dibaca dan <code>error</code> (termasuk <code>io.EOF</code> bila masukan habis). Selalu periksa keduanya.</p>'
    },
    {
      type: 'example',
      title: 'Membaca masukan dengan Scan, Scanf, dan Scanln',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Masukan (diketik di terminal atau lewat pipe):
    // Budi 30
    // Jakarta 99.5
    // 10 20

    var nama string
    var umur int
    n, err := fmt.Scan(&nama, &umur)             // token dipisah spasi
    fmt.Printf("Scan   : %d nilai, err=%v -> %s/%d\\n", n, err, nama, umur)

    var kota string
    var skor float64
    n2, err2 := fmt.Scanf("%s %f", &kota, &skor) // pola dari kita
    fmt.Printf("Scanf  : %d nilai, err=%v -> %s/%.1f\\n", n2, err2, kota, skor)

    var a, b int
    n3, err3 := fmt.Scanln(&a, &b)               // berhenti di akhir baris
    fmt.Printf("Scanln : %d nilai, err=%v -> %d/%d\\n", n3, err3, a, b)
}`,
      explain: [
        '<code>Scan</code> melewati semua whitespace, jadi spasi, tab, maupun newline dianggap pemisah token.',
        '<code>Scanf</code> membaca sesuai format; <code>%f</code> mengisi <code>float64</code>, <code>%d</code> mengisi <code>int</code>.',
        '<code>Scanln</code> berhenti di newline — bila masih ada sisa di baris, ia mengembalikan error <code>expected newline</code>.',
        'Selalu sediakan <b>alamat</b> variabel (<code>&amp;a</code>): fungsi ini mengisi nilai lewat pointer, seperti <code>fmt.Sscanf</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'Scan hanya mengambil satu kata',
      text: 'Karena <code>Scan</code> memisah token dengan spasi, masukan <code>Budi Santoso</code> akan terbaca menjadi <code>"Budi"</code> saja dan sisanya dianggap masukan berikutnya. Untuk membaca satu baris utuh (nama lengkap, alamat, kalimat), pakai <code>bufio</code>.'
    },
    {
      type: 'example',
      title: 'Membaca banyak baris dengan bufio.Scanner',
      lang: 'go',
      output: false,
      code: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    // Membaca seluruh baris dari stdin sampai EOF
    sc := bufio.NewScanner(os.Stdin)
    no := 0

    for sc.Scan() {
        no++
        fmt.Printf("%d. %s\\n", no, sc.Text())
    }

    if err := sc.Err(); err != nil {
        fmt.Println("gagal membaca:", err)
    }
    fmt.Println("total baris:", no)
}`,
      explain: [
        '<code>sc.Scan()</code> mengembalikan <code>true</code> selama masih ada baris; <code>sc.Text()</code> mengambil isinya <b>tanpa</b> newline.',
        'Spasi di dalam baris tetap utuh — inilah perbedaannya dengan <code>fmt.Scan</code>.',
        '<code>sc.Err()</code> menangkap error I/O yang terjadi di tengah pembacaan.',
        'Untuk hanya satu baris, cara singkatnya: <code>baris, err := bufio.NewReader(os.Stdin).ReadString(\'\\n\')</code> (hasilnya masih menyertakan <code>\\n</code>).'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['stdout / stdin', 'Pintu keluaran dan masukan standar program.'],
        ['fmt.Print / Println', 'Mencetak ke stdout tanpa format / dengan spasi dan baris baru.'],
        ['fmt.Printf', 'Mencetak ke stdout dengan format verb (%d, %s, %v, %T, %q).'],
        ['fmt.Sprintf', 'Menghasilkan string sesuai format tanpa mencetaknya.'],
        ['fmt.Fprintf', 'Menulis hasil format ke objek io.Writer apa pun.'],
        ['Format verb', 'Kode % yang menentukan cara sebuah nilai ditampilkan.'],
        ['fmt.Scan / Scanln / Scanf', 'Membaca masukan dari stdin ke variabel lewat pointer.'],
        ['bufio.Scanner', 'Membaca masukan baris demi baris, spasi tetap utuh.']
      ]
    }
  ],
  recap: [
    'Keluaran lewat package fmt: Print (tanpa baris baru), Println (dengan baris baru), Printf (dengan format).',
    'Printf memakai verb seperti %d, %s, %v, %+v, %T, %q, %t, %.2f, dan %% untuk persen.',
    'Sprintf menghasilkan string tanpa mencetak; dipakai untuk pesan, URL, dan label.',
    'Fprintf/Fprintln menulis ke io.Writer — stdout, berkas, buffer, maupun http.ResponseWriter.',
    'Fungsi bawaan print/println hanya untuk debugging dan menulis ke stderr.',
    'Masukan dibaca dengan Scan (per token), Scanln (per baris), Scanf (per format), dan bufio (baris utuh); semua Scan menerima pointer & variabel.'
  ]
});

/* ---------- Pelajaran 4: Komentar & Dokumentasi Kode ---------- */
window.GO_LESSONS.push({
  id: 'komentar',
  title: 'Komentar & Dokumentasi Kode',
  chapter: 'Dasar Bahasa Go',
  duration: '8 menit',
  intro: [
    '<b>Komentar</b> adalah teks yang dibaca manusia tetapi <b>diabaikan oleh compiler</b>. Fungsinya menjelaskan <b>mengapa</b> sebuah kode ditulis, bukan mengulang apa yang sudah jelas terbaca di kode.',
    'Go punya dua bentuk komentar biasa (<code>//</code> dan <code>/* */</code>) serta satu istimewa: <b>doc comment</b> — komentar yang otomatis menjadi dokumentasi package dan bisa dibaca lewat <code>go doc</code> dan situs pkg.go.dev.'
  ],
  objectives: [
    'Menulis komentar satu baris dengan //',
    'Menulis komentar blok dengan /* */',
    'Memahami aturan komentar blok yang tidak boleh bersarang',
    'Menulis doc comment yang terbaca oleh go doc'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Go hanya mengenal <b>dua bentuk komentar</b> — tidak ada tanda pagar (<code>#</code>) ala Python, apalagi tanda kutip ganda ala JavaScript. Karena kompilator Go mengabaikan komentar, kamu bebas menuliskan apa saja di sana.</p>'
    },
    {
      type: 'example',
      title: 'Komentar satu baris dengan //',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Fungsi sapa mencetak sapaan untuk nama yang diberikan.
func sapa(nama string) {
    fmt.Println("Halo,", nama) // komentar di akhir baris
}

func main() {
    // Komentar di atas baris berikutnya:
    sapa("Andi")

    sapa("Budi") // komentar pendek di akhir pemanggilan
}`,
      explain: [
        '<code>//</code> mengomentari <b>satu baris saja</b> — sisanya di baris itu ikut terkomentari.',
        'Komentar boleh berdiri sendiri di baris kosong, maupun menempel di akhir kode (<code>sapa("Andi") // catatan</code>).',
        'Karena tidak dieksekusi, menambah atau menghapus komentar tidak mengubah hasil program sama sekali.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk teks panjang yang butuh beberapa baris — seperti header lisensi berkas atau penjelasan algoritma — pakai komentar blok <code>/* ... */</code>.</p>'
    },
    {
      type: 'example',
      title: 'Komentar blok dengan /* */',
      lang: 'go',
      output: false,
      code: `/*
   Proyek my-go-project
   Latihan dasar bahasa Go.
   Lisensi: belajar saja, jangan dipakai untuk tugas kampus orang lain.
*/

package main

import "fmt"

func main() {
    /*fmt.Println("Baris ini sedang dimatikan sementara")
    fmt.Println("Karena berada di dalam komentar blok")*/

    fmt.Println("Baris ini tetap dijalankan")
}`,
      explain: [
        '<code>/* ... */</code> berlaku untuk <b>semua baris</b> di dalamnya — praktis untuk menonaktifkan sebagian kode sekaligus.',
        'Blok komentar sering dipakai sebagai header lisensi di awal berkas.',
        'Hasil program tetap sama: hanya <code>fmt.Println("Baris ini tetap dijalankan")</code> yang dijalankan.'
      ]
    },
    {
      type: 'warn',
      title: 'Komentar blok tidak boleh bersarang',
      text: 'Berbeda dengan C atau JavaScript, komentar blok di Go <b>tidak bisa bersarang</b>. Jika di dalam blok <code>/* ... </code> kamu menulis <code>/* ... */</code> lagi, blok pertama justru berakhir di tanda <code>*/</code> yang paling awal — sisanya dianggap kode nyata dan membuat error kompilasi. Solusinya: pakai <code>//</code> untuk catatan di dalam blok.'
    },
    {
      type: 'text',
      html: '<p>Sekarang bagian yang paling khas dari Go: <b>doc comment</b>. Bila komentar diletakkan <b>tepat di atas</b> deklarasi package, fungsi, tipe, metode, atau variabel — tanpa baris kosong di antaranya — Go menganggapnya sebagai dokumentasi resmi.</p>'
    },
    {
      type: 'example',
      title: 'Menulis doc comment yang benar',
      lang: 'go',
      output: false,
      code: `// Package main berisi contoh pelajaran komentar.
package main

import "fmt"

// Hitung menambahkan dua bilangan bulat dan mengembalikan hasilnya.
// Contoh: Hitung(2, 3) menghasilkan 5.
func Hitung(a, b int) int {
    return a + b
}

// Pengguna menyimpan data satu orang.
// Nama yang diawali huruf kapital berarti exported (bisa dipakai package lain).
type Pengguna struct {
    Nama string // nama lengkap pengguna
    Umur int    // umur dalam tahun
}

func main() {
    total := Hitung(2, 3)
    p := Pengguna{Nama: "Andi", Umur: 27}
    fmt.Println(total, p.Nama)
}`,
      explain: [
        'Doc comment dimulai dengan <b>nama yang dikomentari</b>: <code>// Hitung menambahkan ...</code>, bukan langsung <code>// fungsi ini ...</code>. Konvensi ini membuat dokumentasi enak dibaca di <code>go doc</code>.',
        'Satu baris pertama sebaiknya berdiri sendiri sebagai ringkasan; lanjutkan di baris berikutnya bila perlu penjelasan tambahan.',
        'Komentar di sebelah kanan field struct (<code>Nama string // nama lengkap</code>) juga didokumentasikan.',
        'Jangan sisipkan <b>baris kosong</b> antara komentar dan deklarasinya — doc comment-nya akan lepas dan tidak terbaca.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca doc comment dengan go doc',
      lang: 'bash',
      output: false,
      code: `# Dokumentasi package saat ini:
go doc

# Dokumentasi satu fungsi/tipe:
go doc Hitung
go doc Pengguna

# Semua isi package, lengkap dengan doc comment:
go doc -all`,
      explain: [
        '<code>go doc</code> menampilkan komentar yang kamu tulis di atas deklarasi — dokumentasi selalu ikut bersama kodenya.',
        'Situs resmi <b>pkg.go.dev</b> menampilkan doc comment yang sama untuk package yang dipublikasikan ke publik.',
        'Karena dokumentasi dibaca orang lain (bahkan timbulmu sendiri beberapa bulan ke depan), sempatkan menulis doc comment pada fungsi dan tipe yang bersifat exported.'
      ]
    },
    {
      type: 'tip',
      title: 'Komentar khusus yang dimengerti alat Go',
      text: 'Sebagian komentar dibaca bukan manusia melainkan alat. Contoh: <code>//go:generate stringer -type=Status</code> dijalankan oleh <code>go generate</code>, dan <code>//go:build linux</code> menentukan kapan sebuah berkas ikut dikompilasi. Cirinya: teks langsung menempel setelah <code>//</code> tanpa spasi. Untuk komentar biasa, selalu sisakan spasi: <code>// penjelasan</code>.'
    },
    {
      type: 'warn',
      title: 'Komentar yang menyesatkan lebih buruk dari tidak ada komentar',
      text: 'Kode yang disalin lalu komentarnya tidak diperbarui akan menyesatkan pembaca berikutnya. Saat mengubah sebuah fungsi, perbarui pula komentarnya. Untuk kode lama yang sudah tidak dipakai, hapus saja — git menyimpan riwayatnya, tidak perlu disembunyikan dengan komentar blok dalam waktu lama.'
    },
    {
      type: 'vocab',
      items: [
        ['Komentar', 'Teks yang diabaikan compiler, hanya dibaca manusia.'],
        ['// (komentar baris)', 'Komentar satu baris; bisa berdiri sendiri atau di akhir kode.'],
        ['/* */ (komentar blok)', 'Komentar multi-baris; tidak boleh bersarang di Go.'],
        ['Doc comment', 'Komentar tepat di atas deklarasi yang menjadi dokumentasi resmi.'],
        ['go doc', 'Perintah menampilkan doc comment package/fungsi dari terminal.'],
        ['pkg.go.dev', 'Situs dokumentasi package Go yang menampilkan doc comment.'],
        ['Direktif //go:...', 'Komentar khusus yang dipahami alat Go, mis. //go:build dan //go:generate.']
      ]
    }
  ],
  recap: [
    'Go mengenal dua komentar: // untuk satu baris dan /* */ untuk blok.',
    'Komentar blok di Go tidak boleh bersarang.',
    'Doc comment diletakkan tepat di atas deklarasi tanpa baris kosong.',
    'go doc dan pkg.go.dev menampilkan doc comment sebagai dokumentasi package.',
    'Komentar harus menjelaskan "mengapa", bukan mengulang kode; perbarui saat kode berubah.'
  ]
});

/* ---------- Pelajaran 5: Variabel & Konstanta ---------- */
window.GO_LESSONS.push({
  id: 'variabel-konstanta',
  title: 'Variabel & Konstanta',
  chapter: 'Dasar Bahasa Go',
  duration: '14 menit',
  intro: [
    'Setiap program butuh tempat menyimpan nilai: umur pengguna, harga barang, atau status login. Di Go, tempat penyimpanan itu disebut <b>variabel</b> dan <b>konstanta</b>.',
    'Pelajaran ini membahas tiga cara mendeklarasikan variabel (<code>var</code>, <code>:=</code>, dan bentuk berkelompok), kapan sebaiknya memakai <code>const</code>, identifier kosong <b>blank identifier</b> (<code>_</code>), serta dua kata kunci pembuat nilai baru: <code>new</code> dan <code>make</code>.'
  ],
  objectives: [
    'Mendeklarasikan variabel dengan var dan short declaration (:=)',
    'Memahami perbedaan var, :=, dan const',
    'Mendeklarasikan banyak variabel sekaligus',
    'Memakai blank identifier (_) untuk membuang nilai yang tidak dipakai',
    'Membedakan keyword new dan make untuk membuat nilai baru',
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
      html: '<p>Aturan penamaan (<b>identifier</b>) di Go sederhana:</p><ul><li>Boleh huruf, angka, dan garis bawah (<code>_</code>), tetapi tidak boleh diawali angka.</li><li>Bersifat <b>case-sensitive</b>: <code>nama</code> dan <code>Nama</code> berbeda.</li><li>Nama yang <b>diawali huruf kapital</b> bersifat <b>exported</b> (bisa diakses dari package lain); yang diawali huruf kecil bersifat privat bagi package.</li><li>Konvensi Go memakai <b>camelCase</b> (<code>namaLengkap</code>), bukan snake_case.</li></ul>'
    },
    {
      type: 'text',
      html: '<p>Di antara semua identifier, satu yang istimewa: <b>garis bawah</b> (<code>_</code>) yang disebut <b>blank identifier</b>. Ia bukan variabel yang bisa dibaca — hanya <b>tempat membuang nilai</b> yang tidak kita butuhkan. Go mewajibkan setiap variabel dipakai, tetapi kadang kita hanya butuh <b>sebagian</b> hasil. Di sinilah <code>_</code> bekerja.</p><p>Tiga situasi paling sering:</p><ul><li><code>_, err := simpan(data)</code> — membuang hasil pertama, hanya error yang dipakai.</li><li><code>for _, v := range data</code> — membuang index, hanya nilai yang diolah.</li><li><code>import _ "github.com/lib/pq"</code> — mengimpor package hanya untuk efek sampingnya (side-effect import).</li></ul>'
    },
    {
      type: 'example',
      title: 'Blank identifier (_) dalam praktik',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    _ "image/png" // diimpor hanya untuk efek sampingnya
)

// Fungsi dengan dua hasil
func ambilData() (string, int) {
    return "Andi", 27
}

// Parameter kedua sengaja dibuang: tidak dipakai
func sapa(nama string, _ int) {
    fmt.Println("Halo,", nama)
}

func main() {
    // 1) Membuang hasil pertama, hanya umur yang dipakai
    _, umur := ambilData()
    fmt.Println("Umur:", umur)

    // 2) Membuang salah satu nilai pada penugasan berantai
    x, _ := 10, 20 // hanya x yang disimpan, 20 dibuang
    fmt.Println("x =", x)

    // 3) Membuang index saat iterasi
    buah := []string{"apel", "mangga"}
    for _, b := range buah {
        fmt.Println(b)
    }

    // 4) Argumen yang tidak dipakai oleh fungsi
    sapa("Budi", 30)
}`,
      explain: [
        '<code>_, umur := ambilData()</code> menyimpan umur saja; nilai "Andi" dibuang tanpa memicu error.',
        '<code>for _, b := range ...</code> dipakai bila index tidak diperlukan — tulis <code>for i := range data</code> bila sebaliknya nilai yang tidak dipakai.',
        '<code>func sapa(nama string, _ int)</code> menandai parameter yang memang tidak dibutuhkan fungsi itu.',
        '<code>import _ "image/png"</code> mengimpor package demi efek sampingnya saja — pola yang lazim untuk driver database seperti <code>import _ "github.com/lib/pq"</code>.',
        'Karena <code>_</code> bukan variabel, ia tidak dihitung sebagai nama baru dalam short declaration.'
      ]
    },
    {
      type: 'tip',
      title: 'Aturan blank identifier _',
      text: 'Blank identifier tidak pernah bisa dibaca: <code>_ = 5</code> atau <code>fmt.Println(_)</code> langsung gagal kompilasi. Karena itu pula <code>_ , err := ...</code> yang ditulis dua kali berturut-turut akan error — minimal satu nama di sebelah kiri <code>:=</code> harus benar-benar nama baru, dan <code>_</code> tidak dihitung.'
    },
    {
      type: 'text',
      html: '<p>Selain <code>var</code> dan <code>:=</code>, Go punya dua kata kunci lagi yang sering membingungkan pemula: <b>new</b> dan <b>make</b>. Keduanya sama-sama "membuat nilai baru", tetapi ruang lingkupnya berbeda jauh. <b>new</b> bekerja untuk <b>tipe apa saja</b> dan selalu mengembalikan <b>pointer</b> (<code>*T</code>) ke nilai kosong (zero value) tipe itu. Ia setara dengan membuat variabel lokal lalu mengambil alamatnya dengan <code>&amp;</code>.</p>'
    },
    {
      type: 'example',
      title: 'Keyword new: pointer ke zero value',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

type Pengguna struct {
    Nama string
    Umur int
}

func main() {
    // new mengembalikan *Pengguna yang isinya zero value
    p := new(Pengguna)
    fmt.Printf("tipe: %T, isi: %v\\n", p, p) // *main.Pengguna &{ 0}

    // karena sudah pointer, field bisa langsung diisi
    p.Nama = "Andi"
    p.Umur = 27
    fmt.Println(*p) // {Andi 27}

    // ekuivalen tanpa new: var biasa + operator &
    q := &Pengguna{Nama: "Budi", Umur: 30}
    fmt.Println(*q) // {Budi 30}
}`,
      explain: [
        '<code>new(Pengguna)</code> menghasilkan pointer <code>*Pengguna</code>, bukan nilai <code>Pengguna</code>.',
        'Isinya pasti zero value: <code>Nama</code> = <code>""</code>, <code>Umur</code> = <code>0</code>.',
        'Menulis <code>var p Pengguna</code> lalu <code>&amp;p</code> menghasilkan hal yang sama; itulah sebabnya <code>new</code> jarang dipakai.',
        'Bentuk yang lebih lazim di Go: <code>q := &amp;Pengguna{Nama: "Budi", Umur: 30}</code> — pointer sekaligus terisi.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>make</b> juga mengalokasikan memori, tetapi hanya untuk <b>tiga tipe</b> internal Go: <b>slice</b>, <b>map</b>, dan <b>channel</b>. Ketiganya punya "struktur tersembunyi" berupa panjang (len), kapasitas (cap), tabel hash, atau buffer — yang tidak bisa sekadar diisi nol, karena itu dibuat fungsi khusus. <code>make</code> mengembalikan <b>tipe itu sendiri</b> (bukan pointer) dan hasilnya langsung siap dipakai.</p>'
    },
    {
      type: 'example',
      title: 'Keyword make: slice, map, dan channel',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Slice: make(tipe, panjang) atau make(tipe, panjang, kapasitas)
    angka := make([]int, 3)     // len=3, cap=3, isinya 0 0 0
    kapas := make([]int, 3, 10) // len=3, cap=10, siap di-append

    // Map: langsung siap ditulis
    umur := make(map[string]int)
    umur["Andi"] = 27

    // Channel: dengan buffer berkapasitas 2
    ch := make(chan int, 2)
    ch <- 10

    angka[0] = 100
    fmt.Println(angka, kapas, umur["Andi"], <-ch)
}`,
      explain: [
        '<code>make([]int, 3, 10)</code> membuat slice panjang 3 dengan kapasitas 10.',
        '<code>make(map[string]int)</code> membuat map yang boleh langsung diisi — <code>var m map[string]int</code> masih <code>nil</code> dan akan panic bila ditulis.',
        '<code>make(chan int, 2)</code> membuat channel buffered berkapasitas 2.',
        'Untuk struct, gunakan <code>&amp;T{...}</code> atau <code>var t T</code> — bukan <code>make</code>, karena <code>make</code> menolak tipe selain slice, map, dan channel.'
      ]
    },
    {
      type: 'text',
      html: '<p>Ringkasan perbedaan <code>new</code> dan <code>make</code>:</p><table class="vocab"><tr><th>Sisi</th><th>new(T)</th><th>make(T, ...)</th></tr><tr><td>Tipe yang boleh</td><td>Tipe apa saja (struct, int, dst.)</td><td>Hanya slice, map, dan channel</td></tr><tr><td>Nilai kembalian</td><td>Pointer (<code>*T</code>)</td><td>Tipe itu sendiri (<code>T</code>)</td></tr><tr><td>Isi hasil</td><td>Zero value, internal belum dibuat</td><td>Sudah diinisialisasi (len, cap, buffer)</td></tr><tr><td>Paling sering dipakai untuk</td><td>Objek buatan sendiri</td><td>Slice, map, channel</td></tr></table><p>Aturan praktisnya: <code>var s []int</code> membuat slice kosong (<i>nil slice</i>) yang masih boleh di-<code>append</code>, sedangkan <code>s := make([]int, 0, n)</code> membuat slice yang sudah menyiapkan ruang <code>n</code> elemen.</p>'
    },
    {
      type: 'warn',
      title: 'new bukan pengganti make',
      text: '<code>m := new(map[string]int)</code> hanya menghasilkan <b>pointer ke map yang masih nil</b>; mengisinya lewat <code>(*m)["k"] = "v"</code> tetap panic. Untuk slice, map, dan channel gunakan <code>make</code> — <code>new</code> dipakai untuk tipe yang tidak punya "isi internal", seperti struct.'
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
        ['Blank identifier _', 'Penanda untuk membuang nilai yang tidak dipakai; tidak pernah bisa dibaca.'],
        ['new', 'Mengalokasikan memori untuk tipe apa saja dan mengembalikan pointer *T ke zero value.'],
        ['make', 'Membuat slice, map, atau channel yang langsung siap dipakai; mengembalikan T, bukan pointer.'],
        ['Exported identifier', 'Nama yang diawali huruf kapital, dapat diakses dari package lain.']
      ]
    }
  ],
  recap: [
    'var untuk deklarasi eksplisit; := untuk ringkas di dalam fungsi; const untuk nilai tetap.',
    'Go menolak variabel yang tidak terpakai.',
    'Banyak variabel bisa dideklarasikan sekaligus, termasuk lewat blok var ( ... ).',
    'Blank identifier _ membuang nilai yang tidak dipakai (hasil ke-2, index range, case, import).',
    'new mengembalikan pointer *T untuk tipe apa saja; make khusus slice, map, dan channel dan mengembalikan T.',
    'iota membuat enumerasi otomatis di dalam blok const.',
    'Nama berawalan huruf kapital bersifat exported; konvensi memakai camelCase.'
  ]
});

/* ---------- Pelajaran 6: Tipe Data Dasar & Zero Values ---------- */
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

/* ---------- Pelajaran 7: Konversi Tipe & Operator ---------- */
window.GO_LESSONS.push({
  id: 'konversi-operator',
  title: 'Konversi Tipe & Operator',
  chapter: 'Dasar Bahasa Go',
  duration: '13 menit',
  intro: [
    'Go <b>tidak melakukan konversi tipe otomatis</b>. Menjumlahkan <code>int</code> dengan <code>float64</code> adalah error; kita harus mengonversi secara eksplisit. Aturan ini terasa kaku, tetapi mencegah banyak bug diam-diam.',
    'Pelajaran ini membahas cara mengonversi tipe dengan <code>T(nilai)</code>, semua operator (aritmatika, perbandingan, logika, bitwise), serta fungsi bawaan <code>min()</code> dan <code>max()</code>.'
  ],
  objectives: [
    'Melakukan konversi tipe secara eksplisit',
    'Mengenal risiko kehilangan presisi saat konversi',
    'Memakai operator aritmatika, perbandingan, dan logika',
    'Mencari nilai terkecil/terbesar dengan fungsi bawaan min() dan max()',
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

    // float -> int memotong pecahan (harus lewat variabel, bukan konstanta)
    var desimal float64 = 3.99
    var lagi int = int(desimal)

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
        '<code>int(desimal)</code> memotong bagian pecahan menjadi 3 — konversi bukan pembulatan.',
        'Konstanta pecahan langsung seperti <code>int(3.99)</code> dilarang karena 3.99 tidak "ada" sebagai int; simpan dulu ke variabel <code>float64</code>.',
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
      type: 'text',
      html: '<p>Menentukan nilai terkecil atau terbesar sejak <b>Go 1.21</b> tidak lagi perlu menulis perbandingan manual. Ada dua <b>fungsi bawaan</b> (built-in function) baru: <code>min()</code> dan <code>max()</code>. Bentuknya mirip operator, tetapi ditulis sebagai fungsi dan menerima <b>dua argumen atau lebih</b> dengan tipe yang sama.</p><table class="vocab"><tr><th>Fungsi</th><th>Artinya</th><th>Contoh</th></tr><tr><td><code>min(a, b, ...)</code></td><td>nilai paling kecil di antara semua argumen</td><td><code>min(7, 3, 10)</code> = 3</td></tr><tr><td><code>max(a, b, ...)</code></td><td>nilai paling besar di antara semua argumen</td><td><code>max(7, 3, 10)</code> = 10</td></tr></table><p>Keduanya bekerja pada tipe yang punya urutan (<b>ordered</b>): angka (<code>int</code>, <code>float</code>, <code>uint</code>) dan teks (<code>string</code>, diurutkan alfabetis). Untuk mencari nilai ekstrem di dalam <b>slice</b>, pakai package <code>slices</code> (<code>slices.Min(s)</code> / <code>slices.Max(s)</code>). Sebelum Go 1.21, <code>float64</code> harus lewat <code>math.Min</code>/<code>math.Max</code>, sedangkan <code>int</code> terpaksa menulis <code>if a &lt; b { ... }</code> berulang.</p>'
    },
    {
      type: 'example',
      title: 'Fungsi bawaan min() dan max()',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "slices"
)

func main() {
    a, b, c := 7, 3, 10

    // Dua argumen
    fmt.Println(min(a, b))    // 3
    fmt.Println(max(a, b))    // 7

    // Boleh lebih dari dua argumen
    fmt.Println(min(a, b, c)) // 3
    fmt.Println(max(a, b, c)) // 10

    // Berlaku juga untuk float64 dan string (urutan alfabet)
    fmt.Println(min(2.5, 1.5))       // 1.5
    fmt.Println(max("budi", "andi")) // budi

    // Untuk slice memakai package slices (min(s...) dilarang)
    nilai := []int{90, 45, 78, 60}
    fmt.Println(slices.Min(nilai), slices.Max(nilai)) // 45 90

    // Pola praktis: membatasi (clamp) nilai dalam rentang 0..100
    skor := 120
    skor = min(max(skor, 0), 100)
    fmt.Println("skor:", skor) // 100
}`,
      explain: [
        '<code>min(a, b)</code> dan <code>max(a, b)</code> adalah fungsi bawaan — tidak perlu <code>import</code> apa pun.',
        'Argumennya boleh lebih dari dua: <code>min(a, b, c)</code>, dan semua argumen harus bertipe sama.',
        'Fungsi bawaan ini menolak pola <code>min(s...)</code>; untuk slice pakai <code>slices.Min(s)</code> dan <code>slices.Max(s)</code> dari package <code>slices</code>.',
        '<code>min(max(skor, 0), 100)</code> adalah trik <i>clamp</i>: memaksa nilai tetap di dalam rentang yang diizinkan.'
      ]
    },
    {
      type: 'warn',
      title: 'Sekat pemakaian min() dan max()',
      text: 'Semua argumen harus bertipe sama — <code>min(1, 2.5)</code> error karena <code>int</code> dan <code>float64</code> bercampur (konversi dulu dengan <code>float64(1)</code>). Untuk <code>float</code>, bila salah satu argumen bernilai <b>NaN</b>, hasilnya juga NaN. Bentuk <code>min(s...)</code> <b>dilarang</b> untuk fungsi bawaan ini — untuk slice pakai <code>slices.Min(s)</code>, dan untuk pointer baca dulu isinya dengan <code>*p</code>.'
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
        ['min() / max()', 'Fungsi bawaan (Go 1.21) untuk nilai terkecil/terbesar dari dua argumen atau lebih; untuk slice pakai slices.Min/Max.'],
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
    'min() dan max() adalah fungsi bawaan Go 1.21 untuk nilai terkecil/terbesar; semua argumen harus bertipe sama, dan untuk slice pakai slices.Min/slices.Max.',
    'Operator bitwise & | ^ << >> berguna untuk bendera dan protokol.'
  ]
});
