/* ============================================================
   Pelajaran Go Web Examples — Bab 4: Middleware & Sesi
   (materi dari https://gowebexamples.com/)
    - "Middleware (Basic)"
    - "Middleware (Advanced)"
    - "Sessions"
   ============================================================ */
'use strict';

window.GOWEB_LESSONS = window.GOWEB_LESSONS || [];

/* ---------- Pelajaran 7: Middleware Dasar ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-middleware-basic',
  title: 'Middleware Dasar (Logging)',
  chapter: 'Middleware & Sesi',
  duration: '8 menit',
  intro: [
    '<b>Middleware</b> adalah lapisan yang membungkus handler: ia menambahkan pekerjaan sebelum atau sesudah handler asli dijalankan. Contoh paling umum adalah <b>logging</b> — mencatat setiap permintaan yang masuk.',
    'Pelajaran ini membuat middleware logging sederhana yang membungkus handler foo dan bar.'
  ],
  objectives: [
    'Memahami konsep middleware',
    'Membuat middleware yang membungkus http.HandlerFunc',
    'Memakai middleware pada beberapa route',
    'Menjalankan kode sebelum handler asli'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Middleware sederhana menerima sebuah <code>http.HandlerFunc</code> sebagai parameter, membungkusnya, lalu mengembalikan <code>http.HandlerFunc</code> baru untuk dipanggil server. Di dalam pembungkus itulah kita menyisipkan logika tambahan.</p>'
    },
    {
      type: 'example',
      title: 'Middleware logging',
      lang: 'go',
      output: false,
      code: `func logging(f http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Kerjakan sesuatu sebelum handler asli...
        log.Println(r.URL.Path)

        // ...lalu teruskan ke handler asli.
        f(w, r)
    }
}`,
      explain: [
        'Middleware menerima handler <code>f</code> sebagai argumen.',
        'Ia mengembalikan fungsi baru yang mencatat path lalu memanggil <code>f(w, r)</code>.',
        'Pola "menerima fungsi, mengembalikan fungsi" inilah inti middleware Go.',
        'Kita bisa menambahkan logika baik sebelum maupun sesudah <code>f(w, r)</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Memakai middleware pada route',
      lang: 'go',
      output: false,
      code: `http.HandleFunc("/foo", logging(foo))
http.HandleFunc("/bar", logging(bar))`,
      explain: [
        'Setiap handler dibungkus: <code>logging(foo)</code> mengembalikan handler baru.',
        'Server memanggil hasil bungkusan, bukan foo secara langsung.',
        'Middleware yang sama bisa dipakai berulang di banyak route.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap middleware dasar',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "log"
    "net/http"
)

func logging(f http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        log.Println(r.URL.Path)
        f(w, r)
    }
}

func foo(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "foo")
}

func bar(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "bar")
}

func main() {
    http.HandleFunc("/foo", logging(foo))
    http.HandleFunc("/bar", logging(bar))
    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Setiap permintaan ke /foo atau /bar tercatat di terminal.',
        'Balasan tetap dari handler asli — middleware hanya "menempel".',
        'Jalankan <code>curl http://localhost:8080/foo</code> dan lihat log di terminal.',
        'Middleware menjaga kode lintas-potong (logging, autentikasi) terpisah dari logika bisnis.'
      ]
    },
    {
      type: 'tip',
      title: 'Middleware menjaga kode tetap bersih',
      text: 'Logging, autentikasi, CORS, kompresi, dan pengukuran waktu adalah tugas lintas-potong. Menaruhnya di middleware mencegah pengulangan di setiap handler.'
    },
    {
      type: 'warn',
      title: 'Jangan lupa memanggil handler berikutnya',
      text: 'Bila middleware tidak memanggil <code>f(w, r)</code>, permintaan akan "berhenti" di situ dan klien tidak mendapat balasan yang benar. Pastikan pemanggilan dilakukan — kecuali memang sengaja menghentikan (mis. menolak akses).'
    },
    {
      type: 'vocab',
      items: [
        ['Middleware', 'Lapisan pembungkus handler untuk tugas lintas-potong.'],
        ['HandlerFunc', 'Tipe fungsi handler di net/http.'],
        ['Wrapping', 'Membungkus handler lama dengan handler baru.'],
        ['Cross-cutting concern', 'Kebutuhan yang menyentuh banyak bagian (log, auth, CORS).'],
        ['log.Println', 'Menulis catatan ke logger standar.']
      ]
    }
  ],
  recap: [
    'Middleware membungkus handler dan menyisipkan logika tambahan.',
    'Ia menerima http.HandlerFunc dan mengembalikan http.HandlerFunc baru.',
    'Middleware dipakai dengan membungkus: logging(foo).',
    'Selalu panggil handler berikutnya kecuali sengaja menghentikan.',
    'Tugas lintas-potong sebaiknya ditaruh di middleware.'
  ]
});

/* ---------- Pelajaran 8: Middleware Lanjutan & Chaining ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-middleware-advanced',
  title: 'Middleware Lanjutan & Chaining',
  chapter: 'Middleware & Sesi',
  duration: '11 menit',
  intro: [
    'Saat middleware bertambah banyak, membungkusnya satu per satu menjadi tidak praktis. Kita butuh cara <b>merangkai (chain)</b> beberapa middleware sekaligus.',
    'Pelajaran ini mendefinisikan tipe <code>Middleware</code>, membuat middleware logging & pembatas method, lalu menggabungkannya dengan fungsi <code>Chain</code>.'
  ],
  objectives: [
    'Membuat tipe Middleware sendiri',
    'Menulis middleware dengan akses ke http.HandlerFunc',
    'Merangkai beberapa middleware dengan Chain',
    'Membatasi HTTP method lewat middleware'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Dengan mendefinisikan tipe <code>Middleware</code>, kode menjadi lebih rapi dan mudah dirangkai. Sebuah middleware pada dasarnya tetap fungsi yang menerima <code>http.HandlerFunc</code> dan mengembalikan <code>http.HandlerFunc</code> baru.</p>'
    },
    {
      type: 'example',
      title: 'Kerangka sebuah middleware',
      lang: 'go',
      output: false,
      code: `func buatMiddleware() Middleware {
    middleware := func(next http.HandlerFunc) http.HandlerFunc {
        handler := func(w http.ResponseWriter, r *http.Request) {
            // ... lakukan hal middleware ...

            // Teruskan ke middleware/handler berikutnya
            next(w, r)
        }
        return handler
    }
    return middleware
}`,
      explain: [
        'Ada dua lapis fungsi: pembuat middleware dan handler yang dikembalikan.',
        'Parameter <code>next</code> adalah handler berikutnya dalam rantai.',
        'Memanggil <code>next(w, r)</code> meneruskan permintaan.',
        'Pola berlapis ini memudahkan menyusun pipeline.'
      ]
    },
    {
      type: 'example',
      title: 'Tipe Middleware & dua contoh',
      lang: 'go',
      output: false,
      code: `type Middleware func(http.HandlerFunc) http.HandlerFunc

// Logging: mencatat path dan durasi proses.
func Logging() Middleware {
    return func(f http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            defer func() { log.Println(r.URL.Path, time.Since(start)) }()
            f(w, r)
        }
    }
}

// Method: hanya mengizinkan method HTTP tertentu.
func Method(m string) Middleware {
    return func(f http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            if r.Method != m {
                http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
                return
            }
            f(w, r)
        }
    }
}`,
      explain: [
        '<code>Logging()</code> memakai <code>defer</code> agar durasi tercatat setelah handler selesai.',
        '<code>time.Since(start)</code> mengukur waktu proses.',
        '<code>Method("GET")</code> menolak permintaan selain GET dengan status 400.',
        'Perhatikan: ketika menolak, middleware <b>tidak</b> memanggil <code>f</code>.'
      ]
    },
    {
      type: 'text', // chain
      html: '<p>Fungsi <code>Chain</code> menerapkan middleware satu demi satu pada sebuah handler. Urutan middleware menentukan urutan pembungkusan: middleware terakhir di argumen menjadi lapisan paling dalam (paling dekat handler).</p>'
    },
    {
      type: 'example',
      title: 'Fungsi Chain',
      lang: 'go',
      output: false,
      code: `func Chain(f http.HandlerFunc, middlewares ...Middleware) http.HandlerFunc {
    for _, m := range middlewares {
        f = m(f)
    }
    return f
}`,
      explain: [
        'Setiap middleware membungkus hasil sebelumnya, membentuk rantai.',
        '<code>...</code> membuat fungsi menerima jumlah middleware tak terbatas.',
        'Hasil akhirnya adalah satu http.HandlerFunc siap didaftarkan.'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap middleware lanjutan',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

type Middleware func(http.HandlerFunc) http.HandlerFunc

func Logging() Middleware {
    return func(f http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            defer func() { log.Println(r.URL.Path, time.Since(start)) }()
            f(w, r)
        }
    }
}

func Method(m string) Middleware {
    return func(f http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            if r.Method != m {
                http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
                return
            }
            f(w, r)
        }
    }
}

func Chain(f http.HandlerFunc, middlewares ...Middleware) http.HandlerFunc {
    for _, m := range middlewares {
        f = m(f)
    }
    return f
}

func Hello(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "hello world")
}

func main() {
    http.HandleFunc("/", Chain(Hello, Method("GET"), Logging()))
    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Route <code>/</code> hanya menerima GET dan setiap permintaan dicatat.',
        'Mengunjungi dengan POST akan menghasilkan "Bad Request".',
        'Contoh keluaran log: <code>/ 0s</code>.',
        'Pola Chain ini menjadi dasar framework web Go yang lebih besar.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan middleware berpengaruh',
      text: 'Middleware yang menolak lebih awal (mis. autentikasi) sebaiknya ditempatkan paling luar agar pekerjaan berat di dalam tidak dijalankan untuk permintaan yang pastinya ditolak. Pahami urutan: <code>Chain(handler, luar, ..., dalam)</code>.'
    },
    {
      type: 'warn',
      title: 'Middleware yang sama jangan dipasang dua kali',
      text: 'Merangkai middleware yang sama berulang membuat pekerjaan ganda dan log ganda. Susun daftar middleware secara rapi, misalnya di satu tempat saat konfigurasi router.'
    },
    {
      type: 'vocab',
      items: [
        ['Tipe Middleware', 'Alias untuk func(http.HandlerFunc) http.HandlerFunc.'],
        ['Chaining', 'Merangkai beberapa middleware menjadi satu handler.'],
        ['defer', 'Menjalankan kode saat fungsi selesai — dipakai mengukur durasi.'],
        ['http.Error', 'Menulis kode status & pesan error ke klien.'],
        ['Variadic', 'Parameter dengan tanda ... yang menerima banyak argumen.']
      ]
    }
  ],
  recap: [
    'Tipe Middleware membuat kode rantai lebih rapi.',
    'Setiap middleware menerima handler berikutnya (next).',
    'Fungsi Chain merangkai middleware secara berurutan.',
    'Method middleware menolak method HTTP yang tidak diizinkan.',
    'Urutan middleware memengaruhi perilaku dan kinerja.'
  ]
});

/* ---------- Pelajaran 9: Sesi & Cookie ---------- */
window.GOWEB_LESSONS.push({
  id: 'web-sessions',
  title: 'Sesi & Cookie dengan gorilla/sessions',
  chapter: 'Middleware & Sesi',
  duration: '11 menit',
  intro: [
    'HTTP tidak menyimpan siapa pengguna di antara permintaan. Untuk mengingat bahwa seseorang sudah login, kita memakai <b>cookie sesi</b> — potongan data kecil yang disimpan di browser dan dikirim setiap permintaan.',
    'Pelajaran ini memakai package <b>gorilla/sessions</b> untuk membangun halaman rahasia yang hanya bisa dilihat pengguna yang sudah login.'
  ],
  objectives: [
    'Memahami cara kerja cookie sesi',
    'Membuat cookie store dengan gorilla/sessions',
    'Menyimpan & membaca status login',
    'Melindungi halaman dengan pemeriksaan sesi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Cookie adalah data kecil yang disimpan browser dan otomatis dikirim ke server pada setiap permintaan. Di dalamnya kita bisa menandai apakah pengguna sudah login. Package gorilla/sessions mengurus tanda tangan (agar cookie tidak bisa dipalsukan) dan penyimpanannya.</p>'
    },
    {
      type: 'example',
      title: 'Membuat cookie store',
      lang: 'go',
      output: false,
      code: `import "github.com/gorilla/sessions"

var (
    // Panjang key harus 16, 24, atau 32 byte (AES-128/192/256).
    key   = []byte("super-secret-key")
    store = sessions.NewCookieStore(key)
)`,
      explain: [
        'Panjang key harus 16, 24, atau 32 byte sesuai standar AES.',
        'Key dipakai untuk menandatangani cookie agar tidak bisa dipalsukan.',
        'Di produksi, ambil key dari environment variable — jangan ditulis di kode.'
      ]
    },
    {
      type: 'example',
      title: 'Login & logout',
      lang: 'go',
      output: false,
      code: `func login(w http.ResponseWriter, r *http.Request) {
    session, _ := store.Get(r, "cookie-name")

    // Proses autentikasi (cek username & password) ada di sini.

    session.Values["authenticated"] = true
    session.Save(r, w)
}

func logout(w http.ResponseWriter, r *http.Request) {
    session, _ := store.Get(r, "cookie-name")
    session.Values["authenticated"] = false
    session.Save(r, w)
}`,
      explain: [
        '<code>store.Get</code> mengambil sesi berdasarkan nama cookie.',
        'Nilai disimpan di map <code>session.Values</code>.',
        '<code>session.Save</code> menulis cookie ke respons pengguna.',
        'Logout cukup menandai <code>authenticated</code> menjadi false.'
      ]
    },
    {
      type: 'example',
      title: 'Melindungi halaman rahasia',
      lang: 'go',
      output: false,
      code: `func secret(w http.ResponseWriter, r *http.Request) {
    session, _ := store.Get(r, "cookie-name")

    // Periksa apakah pengguna sudah login.
    if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

    fmt.Fprintln(w, "The cake is a lie!")
}`,
      explain: [
        'Nilai pada <code>session.Values</code> bertipe <code>interface{}</code>, jadi perlu type assertion <code>.(bool)</code>.',
        'Bila key tidak ada atau bernilai false, akses ditolak dengan status 403.',
        'Bila sudah login, pesan rahasia ditampilkan.',
        'Pemeriksaan ini adalahinti dari pola "middleware autentikasi".'
      ]
    },
    {
      type: 'example',
      title: 'Kode lengkap sesi',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"

    "github.com/gorilla/sessions"
)

var (
    key   = []byte("super-secret-key")
    store = sessions.NewCookieStore(key)
)

func secret(w http.ResponseWriter, r *http.Request) {
    session, _ := store.Get(r, "cookie-name")
    if auth, ok := session.Values["authenticated"].(bool); !ok || !auth {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }
    fmt.Fprintln(w, "The cake is a lie!")
}

func login(w http.ResponseWriter, r *http.Request) {
    session, _ := store.Get(r, "cookie-name")
    session.Values["authenticated"] = true
    session.Save(r, w)
}

func logout(w http.ResponseWriter, r *http.Request) {
    session, _ := store.Get(r, "cookie-name")
    session.Values["authenticated"] = false
    session.Save(r, w)
}

func main() {
    http.HandleFunc("/secret", secret)
    http.HandleFunc("/login", login)
    http.HandleFunc("/logout", logout)
    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Tiga route: /secret (dilindungi), /login, dan /logout.',
        'Mengakses /secret sebelum login memberi "Forbidden".',
        'Setelah /login, cookie dikirim dan /secret bisa diakses.',
        'Perhatikan: contoh ini melewatkan autentikasi sebenarnya demi kesederhanaan.'
      ]
    },
    {
      type: 'tip',
      title: 'Setel opsi cookie yang aman di produksi',
      text: 'Gunakan <code>session.Options</code> untuk mengatur <code>HttpOnly: true</code> (mencegah akses JavaScript), <code>Secure: true</code> (hanya lewat HTTPS), dan <code>SameSite</code> (membatasi pengiriman lintas situs).'
    },
    {
      type: 'warn',
      title: 'Jangan simpan data sensitif di cookie',
      text: 'Cookie dikirim bolak-balik dan disimpan di browser. Meski ditandatangani, jangan menaruh kata sandi atau data rahasia di dalamnya. Simpan hanya penanda seperti ID sesi atau status login.'
    },
    {
      type: 'vocab',
      items: [
        ['Cookie', 'Data kecil yang disimpan browser dan dikirim tiap permintaan.'],
        ['Sesi', 'Kumpulan data terkait satu pengguna lintas permintaan.'],
        ['Cookie store', 'Wadah yang mengelola pembuatan & penandatanganan cookie.'],
        ['session.Values', 'Map tempat menyimpan nilai sesi.'],
        ['Type assertion', 'Mengambil tipe asli dari nilai interface{}, mis. .(bool).'],
        ['HttpOnly / Secure', 'Atribut cookie untuk keamanan.']
      ]
    }
  ],
  recap: [
    'Cookie menyimpan penanda login di browser pengguna.',
    'gorilla/sessions mengelola cookie store dan menandatanganinya.',
    'session.Values menyimpan data; session.Save menulis cookie.',
    'Halaman dilindungi dengan memeriksa session.Values["authenticated"].',
    'Gunakan opsi cookie aman (HttpOnly, Secure, SameSite) di produksi.'
  ]
});
