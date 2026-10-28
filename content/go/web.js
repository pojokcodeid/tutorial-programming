/* ============================================================
   Pelajaran Go — Bab 16: Web Development & REST API
   (topik info.md:
    - "HTTP Server dasar menggunakan net/http"
    - "Routing / Multiplexer (Standard Library vs Framework seperti Gin, Echo, atau Fiber)"
    - "Middleware pattern"
    - "Integrasi Database (SQL dengan database/sql, ORM seperti GORM
       atau SQL Builder seperti sqlx / sqlc)"
    - "Validasi request payload")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 34: HTTP Server & Routing ---------- */
window.GO_LESSONS.push({
  id: 'http-server',
  title: 'HTTP Server & Routing dengan net/http',
  chapter: 'Web & REST API',
  duration: '12 menit',
  intro: [
    'Salah satu alasan Go sangat populer adalah kemampuan membuat server web langsung dari <b>standard library</b>. Package <code>net/http</code> sudah cukup untuk membangun API yang siap produksi.',
    'Pelajaran ini membahas server HTTP dasar, handler, routing modern, serta kapan sebaiknya beralih ke framework seperti Gin, Echo, atau Fiber.'
  ],
  objectives: [
    'Membuat HTTP server dengan net/http',
    'Menulis handler dan mengirim respons',
    'Mengenal routing dengan ServeMux modern',
    'Mengetahui kapan memakai framework'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Server HTTP Go dibangun dari <b>handler</b>. Sebuah handler adalah fungsi dengan tanda tangan <code>func(w http.ResponseWriter, r *http.Request)</code>. <code>ResponseWriter</code> dipakai untuk menulis respons, <code>Request</code> memuat detail permintaan.</p>'
    },
    {
      type: 'example',
      title: 'Server HTTP pertama',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"
)

func beranda(w http.ResponseWriter, r *http.Request) {
    // Header & isi respons
    w.Header().Set("Content-Type", "text/plain; charset=utf-8")
    fmt.Fprintln(w, "Selamat datang di server Go!")
}

func main() {
    // Daftarkan handler pada jalur
    http.HandleFunc("/", beranda)

    // Jalankan server di port 8080
    fmt.Println("Server jalan di http://localhost:8080")
    err := http.ListenAndServe(":8080", nil)
    if err != nil {
        fmt.Println("server berhenti:", err)
    }
}`,
      explain: [
        '<code>http.HandleFunc</code> mendaftarkan fungsi sebagai handler untuk sebuah jalur.',
        '<code>http.ListenAndServe(":8080", nil)</code> menjalankan server dan memblok selamanya.',
        '<code>w</code> adalah tempat menulis respons; <code>r</code> memuat method, URL, header, dan body.',
        'Buka <code>http://localhost:8080</code> di browser untuk mencoba.'
      ]
    },
    {
      type: 'example',
      title: 'API JSON sederhana',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "net/http"
)

type Pengguna struct {
    ID   int    ` + "`" + `json:"id"` + "`" + `
    Nama string ` + "`" + `json:"nama"` + "`" + `
}

func daftar(w http.ResponseWriter, r *http.Request) {
    data := []Pengguna{
        {ID: 1, Nama: "Andi"},
        {ID: 2, Nama: "Budi"},
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(data)
}

func main() {
    http.HandleFunc("/pengguna", daftar)
    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Header <code>Content-Type: application/json</code> memberi tahu klien format respons.',
        '<code>json.NewEncoder(w).Encode(...)</code> mengubah struct menjadi JSON langsung ke respons.',
        'Pola ini adalah fondasi REST API.',
        'Untuk menambah pengguna, nanti kita bedakan method dengan <code>r.Method</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca body JSON dari klien',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

type BuatPengguna struct {
    Nama string ` + "`" + `json:"nama"` + "`" + `
    Umur int    ` + "`" + `json:"umur"` + "`" + `
}

func simpanPengguna(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "method tidak diizinkan", http.StatusMethodNotAllowed)
        return
    }

    var input BuatPengguna
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "body JSON tidak valid", http.StatusBadRequest)
        return
    }
    defer r.Body.Close()

    // ... simpan input ...
    w.WriteHeader(http.StatusCreated)
    fmt.Fprintf(w, "pengguna %s (%d tahun) disimpan", input.Nama, input.Umur)
}

func main() {
    http.HandleFunc("/pengguna", simpanPengguna)
    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Periksa <code>r.Method</code> untuk membatasi HTTP method yang diterima.',
        '<code>json.NewDecoder(r.Body).Decode(&input)</code> membaca body JSON ke struct.',
        '<code>http.Error</code> mengirim respons error dengan status code yang tepat.',
        '<code>w.WriteHeader(201)</code> menetapkan status Created.'
      ]
    },
    {
      type: 'example',
      title: 'Routing modern dengan ServeMux',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // Sejak Go 1.22, method & path variable didukung langsung.
    mux.HandleFunc("GET /pengguna/{id}", func(w http.ResponseWriter, r *http.Request) {
        id := r.PathValue("id")
        fmt.Fprintf(w, "mengambil pengguna id=%s", id)
    })

    mux.HandleFunc("POST /pengguna", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "membuat pengguna baru")
    })

    http.ListenAndServe(":8080", mux)
}`,
      explain: [
        '<code>http.NewServeMux()</code> membuat router yang lebih eksplisit.',
        'Sejak Go 1.22, pola seperti <code>"GET /pengguna/{id}"</code> didukung tanpa framework.',
        '<code>r.PathValue("id")</code> mengambil bagian dinamis dari URL.',
        'Untuk proyek sederhana, ServeMux bawaan sudah sangat memadai.'
      ]
    },
    {
      type: 'text', // framework
      html: '<p>Standard library kuat, tetapi framework menawarkan kemudahan tambahan seperti pengelompokan rute, binding otomatis, dan middleware bawaan. Berikut perbandingan singkat:</p><table class="vocab"><tr><th>Pilihan</th><th>Karakter</th><th>Cocok untuk</th></tr><tr><td>net/http + ServeMux</td><td>Tanpa dependensi, ringan</td><td>API kecil-menengah, kontrol penuh</td></tr><tr><td>Gin</td><td>Populer, cepat, banyak fitur</td><td>REST API produktif</td></tr><tr><td>Echo</td><td>API bersih, ekosistem baik</td><td>API menengah-besar</td></tr><tr><td>Fiber</td><td>Terinspirasi Express.js</td><td>Yang datang dari Node.js</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Sekilas Gin',
      lang: 'go',
      output: false,
      code: `package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()

    r.GET("/pengguna/:id", func(c *gin.Context) {
        id := c.Param("id")
        c.JSON(200, gin.H{"id": id})
    })

    r.POST("/pengguna", func(c *gin.Context) {
        c.JSON(201, gin.H{"pesan": "dibuat"})
    })

    r.Run(":8080")
}`,
      explain: [
        'Gin menyediakan <code>c.Param</code>, <code>c.JSON</code>, dan pengelompokan rute.',
        'Perlu <code>go get github.com/gin-gonic/gin</code> sebelum dipakai.',
        'Echo dan Fiber serupa; pilih salah satu dan kuasai.',
        'Mulailah dari net/http agar paham dasar sebelum memakai framework.'
      ]
    },
    {
      type: 'tip',
      title: 'Gunakan http.Server untuk kontrol lebih',
      text: 'Untuk produksi, gunakan <code>http.Server{}</code> dengan <code>ReadTimeout</code>, <code>WriteTimeout</code>, dan <code>IdleTimeout</code> agar server terlindung dari koneksi lambat atau jahat. Ini penting untuk keandalan.'
    },
    {
      type: 'warn',
      title: 'Jangan abaikan error',
      text: 'Setiap operasi I/O (menulis respons, membaca body, encode JSON) bisa gagal. Abaikan error dan kamu bisa mendapat respons kosong atau data tidak lengkap yang sulit dilacak.'
    },
    {
      type: 'vocab',
      items: [
        ['Handler', 'Fungsi yang menangani satu permintaan HTTP.'],
        ['http.ResponseWriter', 'Tempat menulis respons ke klien.'],
        ['http.Request', 'Informasi permintaan yang masuk.'],
        ['ServeMux', 'Router bawaan net/http.'],
        ['Path value', 'Bagian dinamis URL, diambil dengan r.PathValue(nama).'],
        ['Status code', 'Kode hasil HTTP seperti 200, 201, 404, 500.'],
        ['Framework', 'Pustaka seperti Gin/Echo/Fiber yang menyederhanakan pembuatan API.']
      ]
    }
  ],
  recap: [
    'net/http cukup untuk membangun server dan API tanpa dependensi.',
    'Handler berfungsi dengan tanda tangan (w, r) dan didaftarkan ke jalur.',
    'JSON dikirim dengan json.NewEncoder(w).Encode dan dibaca dengan Decoder.',
    'Sejak Go 1.22 ServeMux mendukung method dan path variable.',
    'Framework (Gin/Echo/Fiber) membantu produktivitas; net/http cocok untuk kontrol penuh.'
  ]
});

/* ---------- Pelajaran 35: Middleware & Validasi Request ---------- */
window.GO_LESSONS.push({
  id: 'middleware-validasi',
  title: 'Middleware & Validasi Request',
  chapter: 'Web & REST API',
  duration: '12 menit',
  intro: [
    'Saat API tumbuh, banyak kebutuhan berulang muncul: mencatat log, memeriksa autentikasi, menangani panic, memberi CORS, dan memvalidasi input. Semua itu ditangani rapi lewat <b>middleware</b>.',
    'Pelajaran ini membahas pola middleware di Go serta cara memvalidasi payload permintaan agar data tetap bersih dan aman.'
  ],
  objectives: [
    'Memahami pola middleware di Go',
    'Membuat middleware logging, recovery, dan autentikasi sederhana',
    'Memvalidasi request payload',
    'Mengetahui praktik keamanan dasar API'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Middleware</b> adalah fungsi yang membungkus handler lain: ia bisa menjalankan sesuatu <i>sebelum</i> dan <i>sesudah</i> handler dipanggil. Karena handler Go hanyalah fungsi, middleware juga cukup sebuah fungsi yang menerima dan mengembalikan <code>http.Handler</code>.</p>'
    },
    {
      type: 'example',
      title: 'Middleware logging',
      lang: 'go',
      output: false,
      code: `package main

import (
    "log"
    "net/http"
    "time"
)

// Middleware menerima handler, mengembalikan handler baru.
func logMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        mulai := time.Now()
        next.ServeHTTP(w, r)   // panggil handler berikutnya
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(mulai))
    })
}

func beranda(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("halo"))
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", beranda)

    // Bungkus mux dengan middleware
    http.ListenAndServe(":8080", logMiddleware(mux))
}`,
      explain: [
        'Middleware menerima <code>http.Handler</code> dan mengembalikan <code>http.Handler</code> baru.',
        '<code>next.ServeHTTP(w, r)</code> memanggil handler berikutnya dalam rantai.',
        'Kode sebelum pemanggilan berjalan sebagai "sebelum", sesudahnya sebagai "sesudah".',
        'Middleware bisa ditumpuk untuk membentuk rantai pemrosesan.'
      ]
    },
    {
      type: 'example',
      title: 'Middleware recovery & autentikasi',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "net/http"
)

func recoverMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                http.Error(w, "kesalahan internal", http.StatusInternalServerError)
                fmt.Println("panic:", rec)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token != "Bearer rahasia" {
            http.Error(w, "tidak berwenang", http.StatusUnauthorized)
            return   // hentikan rantai
        }
        next.ServeHTTP(w, r)
    })
}

func rahasia(w http.ResponseWriter, r *http.Request) {
    w.Write([]byte("data rahasia"))
}

func main() {
    mux := http.NewServeMux()
    mux.Handle("/rahasia", authMiddleware(http.HandlerFunc(rahasia)))
    http.ListenAndServe(":8080", recoverMiddleware(mux))
}`,
      explain: [
        'Middleware recovery menangkap panic agar server tidak mati.',
        'Middleware autentikasi memeriksa header; bila gagal ia berhenti tanpa memanggil handler.',
        'Middleware bisa dipasang per-rute atau global ke seluruh server.',
        'Urutan penumpukan penting: biasanya recovery paling luar, lalu logging, lalu auth.'
      ]
    },
    {
      type: 'text', // validasi
      html: '<p>Data dari klien <b>tidak boleh dipercaya</b>. Validasi setiap payload: periksa field wajib, panjang teks, rentang angka, dan format. Validasi dini mencegah data kotor masuk ke database.</p>'
    },
    {
      type: 'example',
      title: 'Validasi request payload',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "net/http"
    "strings"
)

type DaftarInput struct {
    Nama  string ` + "`" + `json:"nama"` + "`" + `
    Email string ` + "`" + `json:"email"` + "`" + `
    Umur  int    ` + "`" + `json:"umur"` + "`" + `
}

// Validasi menghasilkan pesan error pertama yang ditemukan.
func (d DaftarInput) Validasi() string {
    if strings.TrimSpace(d.Nama) == "" {
        return "nama wajib diisi"
    }
    if !strings.Contains(d.Email, "@") {
        return "email tidak valid"
    }
    if d.Umur < 0 || d.Umur > 150 {
        return "umur tidak wajar"
    }
    return ""
}

func daftar(w http.ResponseWriter, r *http.Request) {
    var in DaftarInput
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        http.Error(w, "JSON tidak valid", http.StatusBadRequest)
        return
    }
    if pesan := in.Validasi(); pesan != "" {
        http.Error(w, pesan, http.StatusUnprocessableEntity)
        return
    }
    w.WriteHeader(http.StatusCreated)
    w.Write([]byte("berhasil didaftarkan"))
}

func main() {
    http.HandleFunc("/daftar", daftar)
    http.ListenAndServe(":8080", nil)
}`,
      explain: [
        'Validasi dilakukan setelah decode body, sebelum data dipakai.',
        'Gunakan status <code>422 Unprocessable Entity</code> (atau 400) untuk input tidak valid.',
        'Kembalikan pesan yang jelas namun tidak membocorkan detail internal.',
        'Untuk kebutuhan kompleks, pakai library validator seperti <code>go-playground/validator</code>.'
      ]
    },
    {
      type: 'example',
      title: 'CORS sederhana',
      lang: 'go',
      output: false,
      code: `package main

import "net/http"

func cors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        // Permintaan preflight tidak perlu diteruskan
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })
    http.ListenAndServe(":8080", cors(mux))
}`,
      explain: [
        'CORS mengizinkan browser dari domain lain mengakses API.',
        '<code>Access-Control-Allow-Origin</code> menentukan domain yang diizinkan (hindari <code>*</code> di produksi bila ada data sensitif).',
        'Permintaan <code>OPTIONS</code> (preflight) dijawab tanpa meneruskan ke handler.',
        'Gunakan <code>github.com/rs/cors</code> bila butuh konfigurasi lebih lengkap.'
      ]
    },
    {
      type: 'tip',
      title: 'Susun middleware dalam satu rantai',
      text: 'Buat fungsi bantu seperti <code>Rantai(handler, m1, m2, m3)</code> yang membungkus handler dengan beberapa middleware sekaligus. Ini menjaga kode main tetap ringkas dan urutan middleware jelas.'
    },
    {
      type: 'warn',
      title: 'Validasi juga di sisi database',
      text: 'Validasi di aplikasi saja tidak cukup. Terapkan juga batasan di database (NOT NULL, UNIQUE, foreign key) sebagai pertahanan berlapis terhadap data tidak valid.'
    },
    {
      type: 'vocab',
      items: [
        ['Middleware', 'Fungsi yang membungkus handler untuk tugas sebelum/sesudah.'],
        ['Recovery', 'Menangkap panic agar server tetap hidup.'],
        ['Autentikasi', 'Memverifikasi identitas pemanggil (mis. token).'],
        ['Validasi', 'Memeriksa kebenaran data masukan.'],
        ['CORS', 'Mekanisme keamanan browser untuk akses lintas domain.'],
        ['Preflight', 'Permintaan OPTIONS yang dikirim browser sebelum permintaan sebenarnya.']
      ]
    }
  ],
  recap: [
    'Middleware membungkus handler dan bisa menumpuk membentuk rantai.',
    'Recovery mencegah panic menjatuhkan server; auth membatasi akses.',
    'Validasi payload mencegah data kotor masuk ke sistem.',
    'CORS mengatur akses lintas domain dari browser.',
    'Terapkan validasi berlapis: aplikasi dan database.'
  ]
});

/* ---------- Pelajaran 36: Integrasi Database ---------- */
window.GO_LESSONS.push({
  id: 'database',
  title: 'Integrasi Database',
  chapter: 'Web & REST API',
  duration: '13 menit',
  intro: [
    'API hampir selalu butuh menyimpan data. Go menyediakan package <b>database/sql</b> sebagai lapisan umum, sementara driver dan ORM/SQL builder melengkapinya.',
    'Pelajaran ini membahas pola dasar dengan database/sql, penggunaan <b>GORM</b> (ORM), serta <b>sqlx</b>/<b>sqlc</b> (alternatif SQL builder), lengkap dengan pencegahan SQL Injection.'
  ],
  objectives: [
    'Membuka koneksi database dengan database/sql',
    'Melakukan query SELECT, INSERT, dan prepared statement',
    'Mengenal GORM sebagai ORM',
    'Mengenal sqlx & sqlc, serta mencegah SQL Injection'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Package <b>database/sql</b> menyediakan antarmuka umum untuk berbagai database. Kita butuh <b>driver</b> spesifik (mis. PostgreSQL, MySQL, atau SQLite). Setelah driver diimpor (secara blank), kita buka koneksi dan gunakan.</p>'
    },
    {
      type: 'example',
      title: 'Membuka koneksi & query dasar',
      lang: 'go',
      output: false,
      code: `package main

import (
    "database/sql"
    "fmt"

    _ "github.com/go-sql-driver/mysql"   // driver MySQL
)

type Pengguna struct {
    ID   int
    Nama string
    Umur int
}

func main() {
    // Format DSN: user:pass@tcp(host:port)/namadb
    db, err := sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/latihan")
    if err != nil {
        panic(err)
    }
    defer db.Close()

    // Uji koneksi
    if err := db.Ping(); err != nil {
        panic(err)
    }

    // SELECT banyak baris
    rows, err := db.Query("SELECT id, nama, umur FROM pengguna")
    if err != nil {
        panic(err)
    }
    defer rows.Close()

    var hasil []Pengguna
    for rows.Next() {
        var p Pengguna
        if err := rows.Scan(&p.ID, &p.Nama, &p.Umur); err != nil {
            panic(err)
        }
        hasil = append(hasil, p)
    }
    fmt.Println(hasil)
}`,
      explain: [
        'Driver diimpor dengan <code>_</code> karena hanya didaftarkan, tidak dipakai langsung.',
        '<code>sql.Open</code> belum benar-benar terhubung; <code>db.Ping()</code> yang memastikan.',
        '<code>rows.Scan</code> mengisi variabel dari kolom secara berurutan.',
        'Selalu <code>defer rows.Close()</code> dan periksa <code>rows.Err()</code> setelah loop.'
      ]
    },
    {
      type: 'example',
      title: 'INSERT aman dengan prepared statement',
      lang: 'go',
      output: false,
      code: `package main

import (
    "database/sql"
    "fmt"
)

func simpan(db *sql.DB, nama string, umur int) (int64, error) {
    // Tanda ? mencegah SQL Injection — nilai dikirim terpisah dari query.
    hasil, err := db.Exec(
        "INSERT INTO pengguna (nama, umur) VALUES (?, ?)",
        nama, umur,
    )
    if err != nil {
        return 0, err
    }
    id, _ := hasil.LastInsertId()
    return id, nil
}

func cariSatu(db *sql.DB, id int) (string, error) {
    var nama string
    // QueryRow untuk satu baris
    err := db.QueryRow("SELECT nama FROM pengguna WHERE id = ?", id).Scan(&nama)
    if err != nil {
        return "", err
    }
    return nama, nil
}

func main() {
    db, _ := sql.Open("mysql", "root:@tcp(127.0.0.1)/latihan")
    defer db.Close()
    id, err := simpan(db, "Andi", 27)
    fmt.Println(id, err)
}`,
      explain: [
        'Selalu pakai <code>?</code> (placeholder) dan kirim nilai terpisah — jangan menyusun query dengan penyambungan string.',
        '<code>db.Exec</code> untuk perintah yang tidak mengembalikan baris (INSERT/UPDATE/DELETE).',
        '<code>db.QueryRow</code> untuk mengambil tepat satu baris.',
        'Ini pertahanan utama terhadap <b>SQL Injection</b>.'
      ]
    },
    {
      type: 'text', // ORM / builder
      html: '<p>Menulis SQL mentah untuk setiap operasi bisa melelahkan. Ada dua keluarga alternatif:</p><ul><li><b>ORM</b> (Object-Relational Mapping) seperti <b>GORM</b> — memetakan struct ke tabel, menyembunyikan banyak SQL.</li><li><b>SQL builder</b> seperti <b>sqlx</b> (memperluas database/sql dengan pemetaan struct) dan <b>sqlc</b> (menghasilkan kode Go dari file SQL).</li></ul>'
    },
    {
      type: 'example',
      title: 'Sekilas GORM',
      lang: 'go',
      output: false,
      code: `package main

import (
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

type Pengguna struct {
    ID   uint
    Nama string
    Umur int
}

func main() {
    db, err := gorm.Open(sqlite.Open("latihan.db"), &gorm.Config{})
    if err != nil {
        panic(err)
    }

    // Membuat/menyesuaikan tabel otomatis (auto-migrate)
    db.AutoMigrate(&Pengguna{})

    // Create
    db.Create(&Pengguna{Nama: "Andi", Umur: 27})

    // Read
    var p Pengguna
    db.First(&p, "nama = ?", "Andi")

    // Update
    db.Model(&p).Update("umur", 28)

    // Delete
    db.Delete(&p)
}`,
      explain: [
        'GORM memetakan struct ke tabel; <code>AutoMigrate</code> membuat skema otomatis.',
        'Perintah <code>Create/First/Update/Delete</code> menggantikan SQL manual.',
        'GORM cepat untuk produktivitas, tetapi menyembunyikan query yang dijalankan.',
        'Untuk kontrol penuh, banyak tim lebih memilih sqlx atau sqlc.'
      ]
    },
    {
      type: 'example',
      title: 'Sekilas sqlx (Select ke struct)',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"

    "github.com/jmoiron/sqlx"
    _ "github.com/go-sql-driver/mysql"
)

type Pengguna struct {
    ID   int    ` + "`" + `db:"id"` + "`" + `
    Nama string ` + "`" + `db:"nama"` + "`" + `
    Umur int    ` + "`" + `db:"umur"` + "`" + `
}

func main() {
    db, _ := sqlx.Connect("mysql", "root:@tcp(127.0.0.1)/latihan")
    defer db.Close()

    // Select langsung memetakan kolom ke field struct (via tag db)
    var hasil []Pengguna
    err := db.Select(&hasil, "SELECT id, nama, umur FROM pengguna")
    if err != nil {
        fmt.Println(err)
        return
    }
    fmt.Println(hasil)
}`,
      explain: [
        'sqlx memperluas database/sql tanpa menyembunyikan SQL.',
        '<code>db.Select</code> memetakan baris ke slice struct otomatis.',
        'Tag <code>db:"nama"</code> menghubungkan kolom dengan field.',
        'Cocok bila kamu ingin tetap menulis SQL tetapi mengurangi kode boilerplate.'
      ]
    },
    {
      type: 'tip',
      title: 'Kelola koneksi dengan pool',
      text: 'database/sql sudah memiliki connection pool. Atur dengan <code>db.SetMaxOpenConns</code>, <code>db.SetMaxIdleConns</code>, dan <code>db.SetConnMaxLifetime</code> agar koneksi tidak bocor atau menumpuk. Selalu <code>defer db.Close()</code>.'
    },
    {
      type: 'warn',
      title: 'Jangan pernah menyusun query dengan string',
      text: 'Kode seperti <code>"SELECT * FROM users WHERE nama = \'" + input + "\'"</code> membuka celah SQL Injection. Gunakan selalu placeholder (<code>?</code> atau <code>$1</code>) dan kirim nilai sebagai parameter.'
    },
    {
      type: 'vocab',
      items: [
        ['database/sql', 'Lapisan umum untuk mengakses database SQL.'],
        ['Driver', 'Penghubung spesifik ke database (mis. MySQL, PostgreSQL).'],
        ['DSN', 'Data Source Name — string konfigurasi koneksi.'],
        ['QueryRow / Query', 'Mengambil satu baris / banyak baris.'],
        ['Prepared statement', 'Query dengan placeholder yang aman dari injection.'],
        ['ORM', 'Memetakan objek/struct ke tabel (mis. GORM).'],
        ['sqlx / sqlc', 'SQL builder/penghasil kode sebagai alternatif ORM.']
      ]
    }
  ],
  recap: [
    'database/sql adalah lapisan umum; butuh driver spesifik.',
    'Gunakan Ping untuk memastikan koneksi dan atur connection pool.',
    'QueryRow dan Query mengambil data; Scan mengisinya ke variabel.',
    'Selalu pakai placeholder untuk mencegah SQL Injection.',
    'GORM (ORM) dan sqlx/sqlc (SQL builder) adalah alternatif produktif.'
  ]
});
