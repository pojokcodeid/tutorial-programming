/* ============================================================
   Pelajaran Go — Bab 15: Logging & Observability
   (topik info.md:
    - "Package log: Print/Println/Printf, Fatal/Panic, flag,
       prefix, dan log.New (multi-writer)"
    - "Structured logging dengan log/slog (Go 1.21+):
       TextHandler, JSONHandler, level, dan Group"
    - "Logger pihak ketiga (Zap & ZeroLog), rotasi berkas,
       level via environment, serta praktik logging produksi")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 31: Logging Dasar dengan Package log ---------- */
window.GO_LESSONS.push({
  id: 'log-dasar',
  title: 'Logging Dasar dengan Package log',
  chapter: 'Logging & Observability',
  duration: '12 menit',
  intro: [
    'Log adalah catatan yang ditinggalkan program tentang apa yang terjadi di dalamnya. Beda dari <code>fmt.Println</code> yang ditujukan ke pengguna, log ditujukan untuk <b>pengembang dan operator</b> — terutama saat mencari tahu penyebab masalah di lingkungan nyata.',
    'Go menyediakan package <b>log</b> yang ringan namun lengkap: stempel waktu otomatis, flag format, prefix per komponen, hingga penulisan ke berkas dan banyak tujuan sekaligus — tanpa dependensi tambahan.'
  ],
  objectives: [
    'Membedakan fmt.Print dan log untuk kebutuhan yang tepat',
    'Mengatur format log dengan flag dan prefix',
    'Membuat logger khusus dengan log.New',
    'Mengarahkan log ke berkas dan beberapa tujuan sekaligus'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Package <b>log</b> menulis ke <b>stderr</b>, sedangkan <code>fmt.Print</code> menulis ke <b>stdout</b>. Pemisahan ini penting: keluaran program (yang mungkin dipipet proses lain) tetap bersih, sementara catatan diagnostik mengalir ke jalur berbeda. Logger bawaan juga otomatis menambahkan tanggal dan waktu.</p>'
    },
    {
      type: 'example',
      title: 'Dasar package log: Print, Printf, Fatal',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "log"
    "os"
)

func main() {
    // Logger bawaan: otomatis menambah tanggal & waktu
    log.Println("server dimulai")
    log.Printf("port=%d, mode=%s\\n", 8080, "dev")

    // Fatal: mencetak lalu keluar dari program (os.Exit(1)).
    // Cocok untuk kegagalan awal, mis. konfigurasi hilang.
    if _, err := os.Open("konfigurasi.json"); err != nil {
        log.Fatalln("gagal membuka konfigurasi:", err)
    }

    // Panic: mencetak lalu memicu panic (bisa ditangkap recover)
    // log.Panicln("kondisi tak terduga")

    fmt.Println("pesan ini untuk pengguna")
}`,
      explain: [
        '<code>log.Println</code> dan <code>log.Printf</code> bekerja seperti fmt, tetapi menambah stempel waktu dan menulis ke stderr.',
        '<code>log.Fatalln</code> mencetak pesan lalu menghentikan program dengan status keluar 1 — fungsi <code>defer</code> tidak sempat dijalankan.',
        '<code>log.Panicln</code> memicu panic sehingga bisa ditangani dengan <code>recover</code>.',
        'Pisahkan keluaran pengguna (fmt ke stdout) dan diagnostik (log ke stderr).'
      ]
    },
    {
      type: 'text',
      html: '<p>Format log diatur lewat <b>flag</b> — kombinasi konstanta yang bisa disusun dengan operator <code>|</code>. Selain itu, <code>SetPrefix</code> memberi label di awal setiap baris agar terlihat dari mana asalnya.</p><table class="vocab"><tr><th>Flag</th><th>Fungsi</th></tr><tr><td><code>LstdFlags</code></td><td>Tanggal + waktu (bawaan)</td></tr><tr><td><code>Lshortfile</code></td><td>Nama berkas &amp; baris pemanggil</td></tr><tr><td><code>Lmicroseconds</code></td><td>Waktu dengan presisi mikrodetik</td></tr><tr><td><code>LUTC</code></td><td>Waktu dalam zona UTC</td></tr><tr><td><code>Lmsgprefix</code></td><td>Prefix diletakkan sebelum pesan</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Mengatur flag dan prefix',
      lang: 'go',
      output: false,
      code: `package main

import "log"

func main() {
    // Susun flag sesuai kebutuhan
    log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile | log.LUTC)
    log.SetPrefix("[api] ")
    log.Println("handler dipanggil")

    // Nonaktifkan dekorasi (mis. saat ingin baris polos)
    log.SetFlags(0)
    log.SetPrefix("")
    log.Println("baris tanpa stempel waktu")
}`,
      explain: [
        '<code>SetFlags</code> dan <code>SetPrefix</code> memengaruhi logger bawaan; pemanggilan berikutnya langsung memakai format baru.',
        '<code>Lshortfile</code> menambahkan berkas dan nomor baris — sangat membantu menemukan sumber pesan.',
        '<code>LUTC</code> membuat waktu seragam antar server di beberapa zona waktu.',
        'Flag <code>0</code> mematikan seluruh dekorasi, berguna bila log nantinya diolah mesin.'
      ]
    },
    {
      type: 'text',
      html: '<p>Dalam program nyata biasanya ada banyak sumber log: akses HTTP, error database, audit. <code>log.New(w, prefix, flags)</code> membuat <b>logger independen</b> dengan tujuan dan formatnya sendiri, sehingga tiap komponen bisa dibedakan.</p>'
    },
    {
      type: 'example',
      title: 'Logger khusus, berkas log, dan MultiWriter',
      lang: 'go',
      output: false,
      code: `package main

import (
    "io"
    "log"
    "os"
)

func main() {
    berkas, err := os.OpenFile("aplikasi.log",
        os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
    if err != nil {
        log.Fatalln("gagal membuka berkas log:", err)
    }
    defer berkas.Close()

    // Bawaan: tampil di layar DAN tersimpan di berkas
    log.SetOutput(io.MultiWriter(os.Stdout, berkas))

    // Logger khusus per komponen
    akses := log.New(io.MultiWriter(os.Stdout, berkas),
        "AKSES ", log.LstdFlags|log.Lshortfile)
    galat := log.New(berkas, "GALAT ", log.LUTC|log.Lmicroseconds)

    akses.Println("GET /products 200")
    galat.Println("gagal koneksi database")
}`,
      explain: [
        '<code>os.OpenFile</code> dengan <code>O_APPEND</code> menambah ke berkas lama; <code>O_CREATE</code> membuatnya bila belum ada.',
        '<code>io.MultiWriter</code> meneruskan tulisan ke semua penulisnya — satu panggilan, dua tujuan.',
        '<code>log.New</code> menghasilkan logger terpisah: mengubahnya tidak mengganggu logger lain.',
        'Prefix seperti <code>AKSES</code>/<code>GALAT</code> adalah level log sederhana sebelum memakai structured logging.'
      ]
    },
    {
      type: 'tip',
      title: 'Fatal hanya untuk kegagalan awal',
      text: 'Pakai <code>log.Fatal</code> bila program memang tidak bisa berjalan sama sekali (konfigurasi tidak valid, port terpakai). Untuk error saat berjalan, kembalikan <code>error</code> agar bisa dicatat, ditangani, dan tidak mematikan proses.'
    },
    {
      type: 'warn',
      title: 'Jangan bocorkan rahasia ke log',
      text: 'Log sering disalin ke sistem terpusat dan dibanyak orang. Jangan pernah mencetak sandi, token, atau nomor kartu. Selain itu, jangan mencampur keluaran program (stdout) dengan log diagnostik (stderr).'
    },
    {
      type: 'vocab',
      items: [
        ['log', 'Package logging bawaan Go yang menulis ke stderr.'],
        ['Logger', 'Objek yang menulis log; logger bawaan dipakai lewat log.Println.'],
        ['Flag', 'Konstanta penentu format (Ldate, Lshortfile, LUTC, dst.).'],
        ['Prefix', 'Teks di awal baris log untuk menandai sumber.'],
        ['log.New', 'Membuat logger baru dengan tujuan, prefix, dan flag sendiri.'],
        ['io.MultiWriter', 'Menulis ke beberapa tujuan (stdout + berkas) sekaligus.'],
        ['Fatal vs Panic', 'Fatal keluar dari program; Panic memicu panic yang bisa recover.']
      ]
    }
  ],
  recap: [
    'fmt menulis ke stdout untuk pengguna; log menulis ke stderr untuk diagnostik.',
    'Flag mengatur format (tanggal, waktu, baris sumber) dan prefix menandai sumber pesan.',
    'log.New membuat logger per komponen dengan tujuan dan format sendiri.',
    'io.MultiWriter menggabungkan beberapa tujuan: layar sekaligus berkas.',
    'log.Fatal hanya untuk kegagalan awal; error saat berjalan sebaiknya dikembalikan.'
  ]
});

/* ---------- Pelajaran 32: Structured Logging dengan log/slog ---------- */
window.GO_LESSONS.push({
  id: 'slog-structured',
  title: 'Structured Logging dengan log/slog',
  chapter: 'Logging & Observability',
  duration: '13 menit',
  intro: [
    'Log teks bebas seperti <code>login gagal untuk user 42 dari 10.0.0.1</code> sulit dicari saat volume besar: mesin tidak tahu mana "user" dan mana "IP". <b>Structured logging</b> menulis kejadian sebagai data berpasangan kunci-nilai sehingga mudah difilter dan diindeks.',
    'Sejak Go 1.21, standar library menyediakan <b>log/slog</b>: log terstruktur yang cepat, tanpa dependensi tambahan, dengan pilihan keluaran teks maupun JSON.'
  ],
  objectives: [
    'Menulis log terstruktur dengan slog.Info dan atribut bertipe',
    'Memilih TextHandler dan JSONHandler serta mengatur level',
    'Mengelompokkan atribut dengan slog.Group dan logger turunan',
    'Menerapkan logging pada HTTP middleware'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Perbedaan mendasar: <b>log biasa</b> menghasilkan satu kalimat yang enak dibaca manusia, sedangkan <b>log terstruktur</b> menghasilkan satu objek per kejadian. Sistem seperti Loki, ELK, atau Datadog bisa langsung mencari <code>status=500</code> tanpa menebak-nebak format kalimat.</p>'
    },
    {
      type: 'example',
      title: 'slog: level dan atribut kunci-nilai',
      lang: 'go',
      output: false,
      code: `package main

import (
    "log/slog"
    "time"
)

func main() {
    // Level bawaan Info — baris Debug tidak tampil
    slog.Info("pengguna login", "user_id", 42, "ip", "10.0.0.1")
    slog.Warn("kredensial menipis", "sisa", 3)
    slog.Error("gagal simpan", "error", "koneksi database ditutup")
    slog.Debug("baris ini tersembunyi pada level bawaan")

    // Atribut bertipe membuat data tetap akurat
    slog.Info("permintaan selesai",
        "path", "/products",
        "durasi", 150*time.Millisecond,
        "status", 200,
    )
}`,
      explain: [
        'Setiap atribut ditulis berpasangan: <code>"kunci", nilai</code> — urutannya wajib bergantian.',
        'Empat level: <code>Debug</code>, <code>Info</code> (bawaan), <code>Warn</code>, <code>Error</code>.',
        'Nilai bertipe seperti <code>time.Duration</code> dirender sesuai jenisnya, bukan string mentah.',
        'Panggilan <code>slog.*</code> memakai logger bawaan — bisa diganti lewat <code>slog.SetDefault</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Tempat log dikirim ditentukan oleh <b>Handler</b>. <code>TextHandler</code> menghasilkan baris kunci=nilai yang mudah dibaca, sementara <code>JSONHandler</code> menghasilkan objek JSON per baris — pilihan standar untuk produksi. <code>HandlerOptions</code> mengatur level minimum dan penambahan sumber kode.</p>'
    },
    {
      type: 'example',
      title: 'JSONHandler, level, dan AddSource',
      lang: 'go',
      output: false,
      code: `package main

import (
    "log/slog"
    "os"
)

func main() {
    opsi := &slog.HandlerOptions{
        Level:     slog.LevelDebug,
        AddSource: true, // menyertakan berkas & baris pemanggil
    }

    logger := slog.New(slog.NewJSONHandler(os.Stdout, opsi))

    logger.Info("server siap",
        slog.String("port", ":8080"),
        slog.Bool("tls", false),
    )
    logger.Debug("cache diisi", slog.Int("entri", 120))

    // Jadikan bawaan agar semua panggilan slog.* memakai JSON
    slog.SetDefault(logger)
}`,
      explain: [
        '<code>slog.NewJSONHandler(w, ops)</code> menulis satu objek JSON per baris ke penulis <code>w</code>.',
        '<code>HandlerOptions.Level</code> membatasi level minimum; naikkan ke <code>LevelInfo</code> di produksi bila log debug terlalu ramai.',
        '<code>AddSource</code> menambahkan lokasi kode, pengganti <code>Lshortfile</code> pada log biasa.',
        'Atribut boleh ditulis sebagai pasangan biasa atau helper bertipe: <code>slog.String</code>, <code>slog.Int</code>, <code>slog.Bool</code>, <code>slog.Duration</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Logger turunan dan Group',
      lang: 'go',
      output: false,
      code: `package main

import (
    "log/slog"
    "os"
)

func main() {
    dasar := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // Logger turunan: atribut ini melekat pada setiap barisnya
    layanan := dasar.With(
        slog.String("service", "order"),
        slog.String("env", "production"),
    )
    layanan.Info("pesanan dibuat",
        slog.Group("pesanan",
            slog.String("id", "ORD-9"),
            slog.Int("items", 3),
            slog.Float64("total", 175000),
        ),
    )
}`,
      explain: [
        '<code>With</code> membuat logger turunan yang membawa atribut tetap (service, env) tanpa menulisnya berulang.',
        '<code>Group</code> mengelompokkan atribut menjadi objek bersarang — mis. seluruh data pesanan dalam satu kunci.',
        'Kelompokkan data yang berelasi; atribut datar sulit dibaca saat jumlahnya puluhan.',
        'Satu kejadian sebaiknya cukup satu baris log, lalu diperkaya atribut, bukan dipecah menjadi banyak baris.'
      ]
    },
    {
      type: 'example',
      title: 'Logging pada HTTP middleware',
      lang: 'go',
      output: false,
      code: `package main

import (
    "log/slog"
    "net/http"
    "time"
)

func Logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        mulai := time.Now()
        next.ServeHTTP(w, r)
        slog.Info("http",
            "method", r.Method,
            "path", r.URL.Path,
            "durasi", time.Since(mulai),
        )
    })
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/products", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })
    http.ListenAndServe(":8080", Logging(mux))
}`,
      explain: [
        'Middleware membungkus handler: mencatat setiap permintaan tanpa menyentuh logika bisnis.',
        'Attribut <code>method</code>, <code>path</code>, dan <code>durasi</code> cukup untuk memantau trafik dan latensi.',
        'Tingkatkan lagi dengan menyimpan status HTTP dan request ID agar bisa dikorelasikan antar layanan.',
        'Pola ini dipakai kembali pada bab Web & REST API serta Microservices.'
      ]
    },
    {
      type: 'tip',
      title: 'Konsistensi nama kunci',
      text: 'Gunakan gaya penamaan kunci yang sama di seluruh aplikasi (mis. <code>user_id</code>, <code>order_id</code> dengan gaya snake_case). Kunci yang berantakan membuat query di sistem log terpusat tidak bisa diandalkan.'
    },
    {
      type: 'warn',
      title: 'Atribut bukan tempat data pribadi',
      text: 'Jangan menaruh sandi, nomor kartu, atau data pribadi lain sebagai atribut log. Log terstruktur justru membuat data sensitif lebih mudah ditemukan — dan itu berita buruk bila berkas log bocor.'
    },
    {
      type: 'vocab',
      items: [
        ['Structured logging', 'Menulis log sebagai data kunci-nilai, bukan kalimat bebas.'],
        ['log/slog', 'Package structured logging bawaan Go sejak 1.21.'],
        ['Handler', 'Komponen yang menentukan tujuan dan format log.'],
        ['TextHandler', 'Handler dengan keluaran kunci=nilai yang mudah dibaca.'],
        ['JSONHandler', 'Handler dengan keluaran JSON per baris, standar produksi.'],
        ['Level', 'Tingkat keparahan: Debug, Info, Warn, Error.'],
        ['Group', 'Mengelompokkan atribut menjadi objek JSON bersarang.'],
        ['Logger turunan', 'Logger dari With yang membawa atribut tetap.']
      ]
    }
  ],
  recap: [
    'Structured logging menulis kunci-nilai agar log mudah dicari mesin.',
    'log/slog tersedia di standar library Go sejak 1.21, tanpa dependensi.',
    'TextHandler untuk dibaca manusia; JSONHandler untuk produksi dan sistem terpusat.',
    'With membuat logger turunan; Group mengelompokkan atribut bersarang.',
    'HTTP middleware bisa mencatat method, path, dan durasi tiap permintaan.'
  ]
});

/* ---------- Pelajaran 33: Zap, ZeroLog & Praktik Logging Produksi ---------- */
window.GO_LESSONS.push({
  id: 'zap-zerolog',
  title: 'Zap, ZeroLog & Praktik Logging Produksi',
  chapter: 'Logging & Observability',
  duration: '13 menit',
  intro: [
    '<code>log/slog</code> sudah memadai untuk sebagian besar proyek. Namun pada layanan dengan trafik sangat tinggi, logging bisa menjadi beban nyata: setiap baris berarti alokasi memori. Di titik itulah library pihak ketiga seperti <b>Zap</b> (Uber) dan <b>ZeroLog</b> berperan.',
    'Pelajaran ini menunjukkan cara memakai keduanya, lalu menutup dengan praktik logging produksi: rotasi berkas, level lewat environment variable, dan kebiasaan menulis log yang aman.'
  ],
  objectives: [
    'Membandingkan slog, Zap, dan ZeroLog',
    'Menulis log terstruktur dengan Zap (production & development)',
    'Menulis log terstruktur dengan ZeroLog',
    'Menerapkan rotasi berkas dan level dinamis di produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Ketiganya menghasilkan log terstruktur; perbedaannya ada pada kinerja dan kenyamanan. Zap dan ZeroLog dirancang <b>zero-allocation</b> — pesan tidak membangun string baru di heap sehingga sangat cepat pada volume besar.</p><table class="vocab"><tr><th>Library</th><th>Sumber</th><th>Karakter</th></tr><tr><td><code>log/slog</code></td><td>Standar library</td><td>Cukup untuk kebanyakan aplikasi, tanpa dependensi</td></tr><tr><td>Zap</td><td>go.uber.org/zap</td><td>Sangat cepat, banyak fitur, API berisi &amp; sugar</td></tr><tr><td>ZeroLog</td><td>rs/zerolog</td><td>Cepat, API ringkas, JSON hemat</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Zap: production, development, dan SugaredLogger',
      lang: 'go',
      output: false,
      code: `package main

import (
    "errors"
    "time"

    "go.uber.org/zap"
)

func main() {
    // Production: JSON, level Info, hemat alokasi
    prod, _ := zap.NewProduction()
    defer prod.Sync()

    prod.Info("pesanan dibuat",
        zap.String("order_id", "ORD-9"),
        zap.Int("items", 3),
        zap.Duration("durasi", 87*time.Millisecond),
    )
    prod.Error("gagal kirim notifikasi",
        zap.String("channel", "email"),
        zap.Error(errors.New("SMTP 550")),
    )

    // Development: teks mudah dibaca, level Debug
    dev, _ := zap.NewDevelopment()
    defer dev.Sync()
    dev.Debug("cache diisi", zap.Int("entri", 120))

    // SugaredLogger: gaya mirip fmt.Sprintf tetap cepat
    prod.Sugared().Infof("produk %s terjual %d kali", "KOPI-1", 7)
}`,
      explain: [
        '<code>zap.NewProduction()</code> menghasilkan JSON untuk konsumsi mesin; <code>NewDevelopment()</code> menghasilkan teks berwarna untuk layar.',
        'Field bertipe (<code>zap.String</code>, <code>zap.Int</code>, <code>zap.Duration</code>) menghindari format ulang string — inilah sumber kecepatannya.',
        '<code>zap.Error(err)</code> membungkus error menjadi field <code>error</code> yang terstruktur.',
        '<code>SugaredLogger</code> menawarkan <code>Infof</code>/<code>Printf</code> bergaya fmt, masih jauh lebih cepat dari fmt biasa.',
        'Selalu panggil <code>Sync()</code> saat selesai agar buffered log tidak hilang.'
      ]
    },
    {
      type: 'example',
      title: 'ZeroLog: API ringkas dan output console',
      lang: 'go',
      output: false,
      code: `package main

import (
    "os"
    "time"

    "github.com/rs/zerolog"
)

func main() {
    zerolog.TimeFieldFormat = time.RFC3339

    // Produksi: JSON ke stdout
    logger := zerolog.New(os.Stdout).Level(zerolog.InfoLevel)
    layanan := logger.With().Str("service", "product").Logger()

    layanan.Info().
        Str("sku", "KOPI-1").
        Int("stok", 12).
        Msg("stok diperbarui")

    layanan.Error().Str("error", "koneksi database ditutup").Msg("gagal simpan")

    // Pengembangan: tulisan ringkas berwarna di layar
    konsol := zerolog.New(zerolog.ConsoleWriter{
        Out: os.Stdout, TimeFormat: time.RFC3339,
    })
    konsol.Info().Msg("hanya terlihat di console")
}`,
      explain: [
        '<code>zerolog.New(w)</code> membuat logger bertujuan <code>w</code>; <code>Level()</code> menyetel level minimum.',
        '<code>With().Str(...).Logger()</code> menambahkan atribut tetap, setara <code>slog.With</code>.',
        'Field disusun berantai (<code>Str</code>, <code>Int</code>, lalu <code>Msg</code>) sehingga API terasa ringkas.',
        '<code>ConsoleWriter</code> mengubah JSON menjadi baris ringkas untuk dikembangkan; di produksi hasil JSON dipertahankan.'
      ]
    },
    {
      type: 'text',
      html: '<p>Di luar pemilihan library, keberhasilan logging di produksi ditentukan hal-hal mendasar: <b>log tidak boleh membuat program mati atau disk penuh</b>. Dua pengaman utama: <b>rotasi berkas</b> (berkas lama dikompresi/dibuang) dan <b>level dinamis</b> lewat environment variable sehingga bisa diubah tanpa redeploy.</p>'
    },
    {
      type: 'example',
      title: 'Rotasi berkas dan level dari environment',
      lang: 'go',
      output: false,
      code: `package main

import (
    "io"
    "log/slog"
    "os"

    "gopkg.in/natefinch/lumberjack.v2"
)

func main() {
    // Rotasi otomatis: berkas dibatasi, lama dikompresi & dibuang
    pemutar := &lumberjack.Logger{
        Filename:   "aplikasi.log",
        MaxSize:    10, // megabyte per berkas
        MaxBackups: 7,  // jumlah berkas cadangan
        MaxAge:     30, // hari penyimpanan
        Compress:   true,
    }
    defer pemutar.Close()

    // Level mengikuti environment — bisa diubah tanpa redeploy
    level := slog.LevelInfo
    if os.Getenv("APP_ENV") == "development" {
        level = slog.LevelDebug
    }

    logger := slog.New(slog.NewJSONHandler(
        io.MultiWriter(os.Stdout, pemutar),
        &slog.HandlerOptions{Level: level},
    ))
    slog.SetDefault(logger)

    slog.Info("logger siap", "env", os.Getenv("APP_ENV"))
}`,
      explain: [
        '<b>lumberjack</b> menggantikan <code>os.File</code>: begitu berkas mencapai batas, ia membuat berkas baru dan membuang yang terlalu tua.',
        '<code>io.MultiWriter</code> menggabungkan dua kebutuhan: log tetap tampil di stdout (wajib untuk container) dan tersimpan di berkas.',
        'Level dibaca dari <code>os.Getenv</code> sehingga tim operasional bisa menaikkan debug sementara tanpa membangun ulang program.',
        'Praktik 12-factor: aplikasi <b>menulis log ke stdout</b>, pengumpulan log (fluentbit, Loki, dsb.) yang mengurus penyimpanannya.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai dari slog, naikkan bila perlu',
      text: 'Profil dulu sebelum mengganti library. Bila logging bukan bottleneck, <code>log/slog</code> sudah lebih dari cukup dan bebas dependensi. Struktur kunci yang konsisten membuat migrasi ke Zap/ZeroLog kelak mudah — hanya penukar API, bukan ulang seluruh log.'
    },
    {
      type: 'warn',
      title: 'Tanpa kebijakan retensi, log menghabiskan disk',
      text: 'Berkas log yang tidak dirotasi akan tumbuh tanpa batas dan suatu hari membuat service mati karena disk penuh. Tetapkan batas ukuran, jumlah cadangan, dan lama simpan — sekaligus siapa yang boleh mengaksesnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Zap', 'Library logging cepat buatan Uber dengan mode production & development.'],
        ['Zero-alloc logging', 'Menulis log tanpa alokasi memori tambahan di heap.'],
        ['SugaredLogger', 'Varian Zap bergaya fmt.Sprintf (Infof, Printf).'],
        ['ZeroLog', 'Library logging ringkas dengan API berantai milik rs.'],
        ['ConsoleWriter', 'Penulis ZeroLog agar JSON tampil sebagai teks ringkas.'],
        ['Rotasi log', 'Membatasi ukuran & jumlah berkas log secara otomatis.'],
        ['lumberjack', 'Library populer untuk rotasi dan kompresi berkas log.'],
        ['Retensi', 'Kebijakan berapa lama log disimpan sebelum dibuang.']
      ]
    }
  ],
  recap: [
    'slog cukup untuk kebanyakan proyek; Zap dan ZeroLog untuk volume besar yang menuntut kinerja.',
    'Zap punya dua gaya: API berisi bertipe dan SugaredLogger bergaya fmt.',
    'ZeroLog memakai API berantai dan mudah dialihkan antara JSON dan console.',
    'Rotasi dengan lumberjack mencegah berkas log menghabiskan disk.',
    'Level dari environment variable dan log ke stdout adalah praktik produksi standar.'
  ]
});
