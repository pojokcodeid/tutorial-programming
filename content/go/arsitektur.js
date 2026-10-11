/* ============================================================
   Pelajaran Go — Bab 14: Software Architecture & Best Practices
   (topik info.md:
    - "Clean Architecture / Hexagonal Architecture di Go"
    - "Dependency Injection (menggunakan library seperti google/wire
       atau manual)"
    - "Design Patterns populer di Go")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 30: Arsitektur, DI & Design Patterns ---------- */
window.GO_LESSONS.push({
  id: 'arsitektur',
  title: 'Clean Architecture, DI & Design Patterns',
  chapter: 'Arsitektur & Best Practices',
  duration: '13 menit',
  intro: [
    'Menulis kode yang jalan itu satu hal; menulis kode yang mudah dirawat, diuji, dan dikembangkan itu lain hal. Untuk itu kita butuh <b>arsitektur</b>.',
    'Pelajaran ini membahas <b>Clean/Hexagonal Architecture</b>, <b>dependency injection</b> (manual dan dengan Wire), serta beberapa <b>design pattern</b> populer dalam kode Go.'
  ],
  objectives: [
    'Memahami lapisan Clean Architecture',
    'Menata dependency agar mengarah ke dalam (menuju domain)',
    'Menerapkan dependency injection secara manual dan dengan Wire',
    'Mengenal design pattern yang umum di Go'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Clean Architecture</b> (dan sepupunya, <b>Hexagonal Architecture</b>) membagi kode ke lapisan-lapisan dengan aturan ketat: <b>dependency selalu mengarah ke dalam</b>. Lapisan dalam (domain) tidak tahu apa-apa tentang database, HTTP, atau framework. Lapisan luar bergantung pada lapisan dalam, bukan sebaliknya.</p>'
    },
    {
      type: 'example',
      title: 'Lapisan khas Clean Architecture di Go',
      lang: 'text',
      output: false,
      code: `internal/
├── domain/          <- ENTITAS & aturan bisnis inti (tak bergantung apa pun)
│   └── pengguna.go
├── usecase/         <- USE CASE / aplikasi: orkestrasi aturan bisnis
│   └── daftar_pengguna.go
├── repository/      <- INTERFACE penyimpanan (didefinisikan di dalam)
│   └── pengguna_repo.go
└── delivery/        <- HTTP/gRPC handler, CLI (lapisan terluar)
    └── http/
        └── pengguna_handler.go

infrastructure/      <- IMPLEMENTASI: database, email, dsb (lapisan terluar)
└── mysql/
    └── pengguna_repo_mysql.go

Aturan: panah dependency HANYA boleh menunjuk ke dalam.`,
      explain: [
        '<b>domain</b> berisi entitas & aturan bisnis murni — tanpa import database atau HTTP.',
        '<b>usecase</b> mengatur alur aplikasi dan hanya bergantung pada interface repository.',
        '<b>delivery</b> menghubungkan dunia luar (HTTP) ke usecase.',
        '<b>infrastructure</b> mengimplementasikan detail teknis (MySQL, Redis, dll).'
      ]
    },
    {
      type: 'example',
      title: 'Interface sebagai batas lapisan',
      lang: 'go',
      output: false,
      code: `// internal/domain/pengguna.go
package domain

type Pengguna struct {
    ID   int
    Nama string
}

// internal/repository/pengguna_repo.go
package repository

import "app/internal/domain"

// Interface DIDEKLARASIKAN di sini (dalam), diimplementasikan di luar.
type PenggunaRepo interface {
    Simpan(p domain.Pengguna) error
    CariID(id int) (domain.Pengguna, error)
}

// internal/usecase/daftar.go
package usecase

import (
    "app/internal/domain"
    "app/internal/repository"
)

type DaftarUseCase struct {
    repo repository.PenggunaRepo   // bergantung pada ABSTRAKSI
}

func (u DaftarUseCase) Daftarkan(nama string) error {
    if nama == "" {
        return errNamaKosong
    }
    return u.repo.Simpan(domain.Pengguna{Nama: nama})
}`,
      explain: [
        'Usecase tidak tahu bahwa penyimpanannya MySQL — ia hanya tahu interface.',
        'Implementasi konkret dibuat di lapisan infrastructure.',
        'Dengan cara ini, mengganti database tidak menyentuh logika bisnis sama sekali.',
        'Pola ini adalah inti dari <b>dependency inversion</b>.'
      ]
    },
    {
      type: 'text', // DI
      html: '<p><b>Dependency Injection (DI)</b> adalah teknik menyuplai dependency dari luar, bukan membuatnya di dalam. Alih-alih <code>usecase</code> memanggil <code>mysql.NewRepo()</code> sendiri, kita menyuntikkannya saat pembuatan. Ini membuat kode dapat diuji (bisa diberi mock) dan diganti implementasinya.</p>'
    },
    {
      type: 'example',
      title: 'Dependency injection manual',
      lang: 'go',
      output: false,
      code: `package main

import (
    "app/internal/repository"
    "app/internal/usecase"
    "app/infrastructure/mysql"
)

func main() {
    // 1. Buat implementasi konkret
    db := mysql.Connect("...")
    var repo repository.PenggunaRepo = mysql.NewPenggunaRepo(db)

    // 2. Suntikkan ke usecase
    uc := usecase.DaftarUseCase{Repo: repo}

    // 3. Suntikkan usecase ke handler HTTP
    handler := NewPenggunaHandler(uc)

    // 4. Jalankan server
    JalankanServer(handler)
}`,
      explain: [
        'Semua dependency dirakit di satu tempat: <code>main</code>.',
        'Cara ini disebut <b>manual DI</b> — sederhana dan jelas untuk proyek kecil.',
        'Saat menguji, cukup ganti <code>mysql.NewPenggunaRepo</code> dengan mock.',
        'Untuk proyek besar, perakitan manual bisa panjang sehingga butuh alat bantu.'
      ]
    },
    {
      type: 'example',
      title: 'Dependency injection dengan google/wire',
      lang: 'go',
      output: false,
      code: `// wire.go — file provider (dengan build tag untuk kode generator)
//go:build wireinject
// +build wireinject

package main

import "github.com/google/wire"

func InitApp() (*App, error) {
    wire.Build(
        mysql.Connect,
        mysql.NewPenggunaRepo,
        usecase.NewDaftarUseCase,
        NewPenggunaHandler,
        NewApp,
    )
    return nil, nil
}

// Lalu jalankan:  wire ./...
// Wire menghasilkan file wire_gen.go berisi perakitan otomatis.`,
      explain: [
        'Wire adalah alat <b>compile-time</b>: ia menghasilkan kode perakitan Go biasa.',
        'Kita hanya mendeklarasikan "bahan-bahan" (provider); Wire menyusun urutannya.',
        'Tidak ada refleksi saat runtime — cepat dan mudah dilacak.',
        'Alternatif: <b>uber-go/fx</b> yang menyuntikkan dependency saat runtime.'
      ]
    },
    {
      type: 'text', html: '<p>Beberapa <b>design pattern</b> yang paling sering muncul dalam kode Go:</p><table class="vocab"><tr><th>Pattern</th><th>Ide</th><th>Contoh di Go</th></tr><tr><td>Functional Options</td><td>Konfigurasi objek lewat fungsi pilihan</td><td><code>NewServer(WithPort(8080))</code></td></tr><tr><td>Option / Config struct</td><td>Mengelompokkan parameter</td><td><code>Config{Timeout: 5*time.Second}</code></td></tr><tr><td>Middleware</td><td>Membungkus handler</td><td>logging, auth, recovery</td></tr><tr><td>Factory</td><td>Fungsi yang membuat objek</td><td><code>NewPengguna(...)</code></td></tr><tr><td>Strategy</td><td>Menukar algoritma lewat interface</td><td>berbagai <code>Pengirim.Notifikasi</code></td></tr><tr><td>Singleton</td><td>Satu instance global</td><td><code>sync.Once</code> + variabel paket</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Functional options pattern',
      lang: 'go',
      output: false,
      code: `package main

import "time"

type Server struct {
    port    int
    timeout time.Duration
}

// Opsi adalah fungsi yang mengubah Server.
type Option func(*Server)

func DenganPort(p int) Option {
    return func(s *Server) { s.port = p }
}

func DenganTimeout(t time.Duration) Option {
    return func(s *Server) { s.timeout = t }
}

func NewServer(opsi ...Option) *Server {
    s := &Server{port: 8080, timeout: 30 * time.Second} // default
    for _, o := range opsi {
        o(s)
    }
    return s
}

func main() {
    s := NewServer(DenganPort(9090), DenganTimeout(5*time.Second))
    _ = s
}`,
      explain: [
        'Functional options memberi nilai default sekaligus fleksibilitas.',
        'Menambah opsi baru tidak mengubah tanda tangan <code>NewServer</code>.',
        'Pattern ini sangat umum di library Go (mis. gRPC, HTTP client).',
        'Bersih, mudah dibaca, dan tetap kompatibel ke belakang.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai sederhana, tambah lapisan bila perlu',
      text: 'Clean Architecture sangat berguna untuk proyek besar yang berumur panjang. Untuk proyek kecil, terlalu banyak lapisan justru merepotkan. Mulailah dari struktur sederhana, lalu pisahkan lapisan begitu kompleksitasnya benar-benar tumbuh.'
    },
    {
      type: 'warn',
      title: 'Jangan over-engineering',
      text: 'Membuat interface untuk segalanya, lapisan berlapis-lapis, dan abstraksi berlebih bisa memperlambat pengembangan. Idiom Go menekankan kesederhanaan — tambahkan struktur hanya ketika ia menyelesaikan masalah nyata.'
    },
    {
      type: 'vocab',
      items: [
        ['Clean Architecture', 'Pemisahan lapisan kode dengan aturan dependency mengarah ke dalam.'],
        ['Hexagonal Architecture', 'Pendekatan serupa yang menekankan port (interface) & adapter.'],
        ['Use case', 'Lapisan yang mengorkestrasi aturan bisnis aplikasi.'],
        ['Dependency injection', 'Menyuplai dependency dari luar alih-alih membuatnya di dalam.'],
        ['google/wire', 'Alat DI compile-time untuk Go.'],
        ['Functional options', 'Pattern konfigurasi lewat fungsi pilihan.'],
        ['Adapter', 'Komponen yang menghubungkan port interface ke teknologi nyata.']
      ]
    }
  ],
  recap: [
    'Clean/Hexagonal Architecture memisahkan domain, usecase, dan delivery.',
    'Aturan utama: dependency mengarah ke dalam; domain tidak tahu teknologi luar.',
    'Interface didefinisikan di lapisan dalam, diimplementasikan di luar.',
    'Dependency injection membuat kode mudah diuji dan diganti; Wire mengotomatiskannya.',
    'Design pattern umum: functional options, factory, strategy, middleware, singleton.'
  ]
});
