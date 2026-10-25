/* ============================================================
   Pelajaran Go — Bab 8: Error Handling & Control Structures Khusus
   (topik info.md:
    - "Pengelolaan error menggunakan interface error"
    - "Membuat Custom Error"
    - "Penggunaan defer untuk cleanup resource"
    - "Penggunaan panic dan recover (kapan harus digunakan dan dihindari)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 19: Error Handling & Custom Error ---------- */
window.GO_LESSONS.push({
  id: 'error-handling',
  title: 'Error Handling & Custom Error',
  chapter: 'Error Handling',
  duration: '11 menit',
  intro: [
    'Go tidak memakai <code>try/catch</code>. Sebagai gantinya, error adalah <b>nilai biasa</b> yang dikembalikan fungsi dan wajib diperiksa. Gaya ini membuat alur program jujur dan eksplisit: setiap titik yang bisa gagal terlihat jelas di kode.',
    'Pelajaran ini membahas interface <code>error</code>, membuat error dengan <code>errors.New</code> dan <code>fmt.Errorf</code>, serta <b>custom error</b> untuk menyimpan informasi tambahan.'
  ],
  objectives: [
    'Memahami interface error di Go',
    'Membuat error dengan errors.New dan fmt.Errorf',
    'Membungkus error dengan %w dan memeriksanya dengan errors.Is/As',
    'Membuat tipe error kustom'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Interface <code>error</code> sangat sederhana — hanya satu method: <code>Error() string</code>. Tipe apa pun yang punya method itu adalah error. Nilai <code>nil</code> berarti "tidak ada error".</p>'
    },
    {
      type: 'example',
      title: 'Membuat dan memeriksa error',
      lang: 'go',
      output: false,
      code: `package main

import (
    "errors"
    "fmt"
)

func bagi(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("pembagi tidak boleh nol")
    }
    return a / b, nil
}

func main() {
    hasil, err := bagi(10, 0)
    if err != nil {
        fmt.Println("gagal:", err)     // gagal: pembagi tidak boleh nol
        return
    }
    fmt.Println("hasil:", hasil)

    // fmt.Errorf untuk pesan berformat
    nama := "budi"
    err2 := fmt.Errorf("pengguna %q tidak ditemukan", nama)
    fmt.Println(err2)
}`,
      explain: [
        '<code>errors.New("...")</code> membuat error sederhana dengan pesan tetap.',
        '<code>fmt.Errorf("...%q...", x)</code> membuat error dengan pesan berformat.',
        'Fungsi yang berhasil mengembalikan <code>nil</code> sebagai error.',
        'Selalu periksa <code>if err != nil</code> sebelum memakai hasil.'
      ]
    },
    {
      type: 'example',
      title: 'Membungkus error dengan %w',
      lang: 'go',
      output: false,
      code: `package main

import (
    "errors"
    "fmt"
)

// Error sentinel: error yang bisa dibandingkan
var ErrTidakDitemukan = errors.New("data tidak ditemukan")

func cari(id int) (string, error) {
    if id != 1 {
        // %w membungkus error asli agar bisa dilacak
        return "", fmt.Errorf("gagal cari id %d: %w", id, ErrTidakDitemukan)
    }
    return "Andi", nil
}

func main() {
    _, err := cari(99)
    if err != nil {
        fmt.Println(err)

        // errors.Is memeriksa apakah rantai error memuat target
        if errors.Is(err, ErrTidakDitemukan) {
            fmt.Println("-> memang error 'tidak ditemukan'")
        }
    }
}`,
      explain: [
        '<code>%w</code> (bukan <code>%v</code>) membungkus error sehingga rantainya tetap bisa ditelusuri.',
        '<b>Sentinel error</b> seperti <code>ErrTidakDitemukan</code> dideklarasikan di level package untuk dibandingkan.',
        '<code>errors.Is(err, target)</code> memeriksa apakah err atau error yang dibungkusnya sama dengan target.',
        'Pola ini penting agar pemanggil bisa bereaksi berbeda sesuai jenis error.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Custom error</b> dipakai saat kita perlu menyimpan informasi lebih dari sekadar pesan — misalnya kode kesalahan, field yang gagal, atau batas waktu. Caranya: buat struct yang memiliki method <code>Error() string</code>.</p>'
    },
    {
      type: 'example',
      title: 'Custom error bertipe struct',
      lang: 'go',
      output: false,
      code: `package main

import (
    "errors"
    "fmt"
)

// Struct error kustom dengan informasi tambahan
type ValidationError struct {
    Field string
    Pesan string
}

// Implementasi interface error
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validasi gagal pada %q: %s", e.Field, e.Pesan)
}

func validasiUmur(umur int) error {
    if umur < 0 {
        return &ValidationError{Field: "umur", Pesan: "tidak boleh negatif"}
    }
    if umur > 150 {
        return &ValidationError{Field: "umur", Pesan: "tidak realistis"}
    }
    return nil
}

func main() {
    err := validasiUmur(-5)
    if err != nil {
        fmt.Println(err)

        // errors.As mengambil error bertipe tertentu dari rantai
        var ve *ValidationError
        if errors.As(err, &ve) {
            fmt.Println("field bermasalah:", ve.Field)
        }
    }
}`,
      explain: [
        '<code>ValidationError</code> mengimplementasikan <code>Error() string</code> sehingga memenuhi interface error.',
        '<code>errors.As</code> menelusuri rantai error dan mengisi variabel bertipe tertentu.',
        'Dengan custom error, pemanggil bisa mengambil detail (mis. nama field) untuk membentuk respons yang tepat.',
        'Gunakan pointer receiver (<code>*ValidationError</code>) agar konsisten dan sesuai konvensi.'
      ]
    },
    {
      type: 'text',
      html: '<p>Ringkasan tiga cara memeriksa error:</p><table class="vocab"><tr><th>Fungsi</th><th>Kegunaan</th></tr><tr><td><code>errors.Is(err, target)</code></td><td>Memeriksa apakah error (atau yang dibungkusnya) <b>sama</b> dengan target.</td></tr><tr><td><code>errors.As(err, &target)</code></td><td>Mengambil error bertipe <b>tertentu</b> dari rantai ke variabel.</td></tr><tr><td><code>err != nil</code></td><td>Pemeriksaan paling dasar: ada error atau tidak.</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Bungkus error, jangan telan',
      text: 'Saat meneruskan error ke atas, tambahkan konteks dengan <code>fmt.Errorf("...: %w", err)</code>. Jangan menulis <code>if err != nil { }</code> tanpa menangani atau meneruskan error — itu "menelan" error dan menyulitkan penelusuran.'
    },
    {
      type: 'warn',
      title: 'Jangan bandingkan error dengan == sembarangan',
      text: 'Setelah error dibungkus <code>%w</code>, perbandingan <code>==</code> tidak lagi bekerja. Gunakan <code>errors.Is</code> untuk membandingkan "jenis" dan <code>errors.As</code> untuk mengambil tipe konkretnya.'
    },
    {
      type: 'vocab',
      items: [
        ['error', 'Interface bawaan dengan satu method: Error() string.'],
        ['errors.New', 'Membuat error sederhana berisi pesan.'],
        ['fmt.Errorf', 'Membuat error berformat; %w untuk membungkus.'],
        ['Sentinel error', 'Error paket-level yang dipakai sebagai penanda, mis. ErrNotFound.'],
        ['errors.Is', 'Memeriksa apakah error adalah atau membungkus target.'],
        ['errors.As', 'Mengambil error bertipe tertentu dari rantai.'],
        ['Custom error', 'Tipe buatan sendiri yang mengimplementasikan error.']
      ]
    }
  ],
  recap: [
    'Go memakai error sebagai nilai, bukan try/catch.',
    'errors.New dan fmt.Errorf membuat error; nil berarti tidak ada error.',
    '%w membungkus error agar bisa dilacak dengan errors.Is/As.',
    'Custom error (struct dengan method Error) menyimpan informasi tambahan.',
    'Selalu tangani atau teruskan error dengan konteks — jangan ditelan.'
  ]
});

/* ---------- Pelajaran 20: defer, panic & recover ---------- */
window.GO_LESSONS.push({
  id: 'defer-panic-recover',
  title: 'defer, panic & recover',
  chapter: 'Error Handling',
  duration: '10 menit',
  intro: [
    'Selain mengembalikan error, Go punya tiga kata kunci khusus untuk mengatur pembersihan sumber daya dan situasi darurat: <b>defer</b>, <b>panic</b>, dan <b>recover</b>.',
    'Menggunakannya dengan tepat membuat program selalu merapikan diri (menutup file, koneksi) dan tidak mudah hancur total.'
  ],
  objectives: [
    'Menunda eksekusi dengan defer untuk cleanup',
    'Memahami urutan eksekusi defer (LIFO)',
    'Mengetahui kapan panic pantas digunakan',
    'Memulihkan program dengan recover'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>defer</b> menunda sebuah pemanggilan fungsi sampai <b>fungsi tempat ia ditulis selesai</b> (baik selesai normal maupun karena error). Ia sangat cocok untuk pembersihan sumber daya: menutup file, koneksi database, atau meng-unlock mutex.</p>'
    },
    {
      type: 'example',
      title: 'defer untuk membersihkan sumber daya',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "os"
)

func bacaBerkas(nama string) {
    // Buka berkas lalu langsung jadwalkan penutupannya.
    f, err := os.Open(nama)
    if err != nil {
        fmt.Println("gagal membuka:", err)
        return
    }
    defer f.Close()   // dijalankan otomatis saat fungsi selesai

    // ... proses membaca berkas ...
    fmt.Println("berkas dibuka:", f.Name())
}

func main() {
    bacaBerkas("contoh.txt")
}`,
      explain: [
        '<code>defer f.Close()</code> memastikan berkas selalu ditutup, apa pun yang terjadi setelahnya.',
        'Tanpa defer, kita harus menulis <code>f.Close()</code> di setiap jalur keluar — mudah terlupa.',
        'defer dieksekusi saat fungsi <b>kembali</b>, bukan saat baris defer ditulis.'
      ]
    },
    {
      type: 'example',
      title: 'Urutan defer (LIFO) dan nilai argumen',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // defer dijalankan terbalik (last in, first out)
    defer fmt.Println("ketiga")
    defer fmt.Println("kedua")
    defer fmt.Println("pertama")
    fmt.Println("badan fungsi")

    // Nilai argumen defer dibekukan saat defer ditulis
    n := 10
    defer fmt.Println("nilai n saat defer:", n)
    n = 99
    fmt.Println("n sekarang:", n)
}
// Keluaran:
// badan fungsi
// n sekarang: 99
// nilai n saat defer: 10
// pertama
// kedua
// ketiga`,
      explain: [
        'Beberapa defer dijalankan dalam urutan terbalik (LIFO).',
        'Argumen defer <b>dievaluasi saat baris defer dijalankan</b>, bukan saat eksekusi tertunda. Karena itu tercetak 10, bukan 99.',
        'Agar membaca nilai terbaru, gunakan closure: <code>defer func(){ fmt.Println(n) }()</code>.'
      ]
    },
    {
      type: 'text', // panic
      html: '<p><b>panic</b> menghentikan alur normal dan mulai membongkar tumpukan panggilan. Ia dipakai untuk situasi yang <b>tidak bisa dipulihkan</b>, seperti konfigurasi wajib yang hilang saat program dimulai. Untuk kesalahan yang bisa ditangani, tetap gunakan <code>error</code>.</p>'
    },
    {
      type: 'example',
      title: 'panic dan recover',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// recover hanya bekerja di dalam defer
func amanJalankan() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("pulih dari panic:", r)
        }
    }()

    fmt.Println("mulai")
    panic("ada yang salah fatal")
    // fmt.Println("baris ini tidak akan jalan")
}

func main() {
    amanJalankan()
    fmt.Println("program tetap berlanjut")
}`,
      explain: [
        '<code>panic("...")</code> menghentikan fungsi dan membawa pesannya ke atas.',
        '<code>recover()</code> menangkap nilai panic — tetapi <b>hanya</b> bila dipanggil di dalam fungsi <code>defer</code>.',
        'Setelah dipulihkan, program lanjut setelah pemanggilan fungsi yang panic.',
        'Nilai yang dikembalikan recover adalah argumen panic.'
      ]
    },
    {
      type: 'text', // when to use
      html: '<p>Kapan memakai apa? Gunakan <b>error</b> untuk hampir semua kegagalan yang bisa diperkirakan: berkas tidak ada, input tidak valid, jaringan putus. Gunakan <b>panic</b> hanya untuk kesalahan programmer (bug) atau kondisi mustahil, mis. mengakses slice di luar batas. <b>recover</b> dipakai secukupnya, mis. di middleware server agar satu permintaan bermasalah tidak menjatuhkan seluruh aplikasi.</p>'
    },
    {
      type: 'example',
      title: 'Contoh wajar: recover di layer HTTP',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"
)

func amanHandler(fn http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                http.Error(w, "terjadi kesalahan internal", http.StatusInternalServerError)
                fmt.Println("panic ditangkap:", rec)
            }
        }()
        fn(w, r)
    }
}

func main() {
    http.HandleFunc("/", amanHandler(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "halo")
    }))
    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Middleware <code>amanHandler</code> membungkus handler lain.',
        'Bila handler di dalamnya panic, recover mencegah server mati total.',
        'Pola ini umum di framework web Go.',
        'Namun jangan jadikan recover pengganti penanganan error yang benar.'
      ]
    },
    {
      type: 'tip',
      title: 'defer untuk mengubah nilai kembalian?',
      text: 'defer bisa dipakai untuk mengubah named return value, mis. menutup file sekaligus menambahkan error penutupan. Fitur ini kuat tetapi mudah disalahgunakan — gunakan hanya bila membuat kode lebih jelas.'
    },
    {
      type: 'warn',
      title: 'Jangan pakai panic untuk alur normal',
      text: 'panic bukan pengganti error. Menggunakan panic untuk hal yang biasa (mis. input pengguna salah) membuat program sulit diuji dan dirawat. Simpan panic untuk kondisi benar-benar tidak terduga.'
    },
    {
      type: 'vocab',
      items: [
        ['defer', 'Menunda pemanggilan sampai fungsi selesai; dipakai untuk cleanup.'],
        ['LIFO', 'Last In First Out — urutan eksekusi defer.'],
        ['panic', 'Menghentikan program karena kesalahan fatal.'],
        ['recover', 'Menangkap panic, hanya bekerja di dalam defer.'],
        ['Cleanup', 'Pembersihan sumber daya (menutup file/koneksi).'],
        ['Stack unwinding', 'Proses membongkar tumpukan panggilan saat panic.']
      ]
    }
  ],
  recap: [
    'defer menunda pemanggilan sampai fungsi selesai — ideal untuk cleanup.',
    'Beberapa defer dieksekusi terbalik (LIFO); argumennya dibekukan saat ditulis.',
    'panic dipakai hanya untuk kesalahan fatal, bukan alur normal.',
    'recover menangkap panic dan hanya bekerja di dalam defer.',
    'Pakai error untuk kegagalan yang bisa ditangani; panic untuk bug.'
  ]
});
