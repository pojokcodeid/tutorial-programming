/* ============================================================
   Pelajaran Go — Bab 11: Testing & Benchmarking
   (topik info.md:
    - "Unit Testing dasar dengan package testing (go test)"
    - "Table-Driven Tests"
    - "Mocking & Interface Stubbing"
    - "Benchmark Testing (testing.B) & Code Coverage analysis")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 26: Unit Testing, Table-Driven, Mocking, Benchmark ---------- */
window.GO_LESSONS.push({
  id: 'testing',
  title: 'Unit Testing, Mocking & Benchmark',
  chapter: 'Testing & Benchmarking',
  duration: '13 menit',
  intro: [
    'Go menyertakan alat pengujian langsung di dalam toolchain-nya. Tidak perlu framework tambahan — cukup package <b>testing</b> dan perintah <code>go test</code>.',
    'Pelajaran ini membahas unit test dasar, <b>table-driven test</b> (gaya favorit komunitas Go), <b>mocking</b> lewat interface, hingga <b>benchmark</b> dan analisis <b>code coverage</b>.'
  ],
  objectives: [
    'Menulis dan menjalankan unit test dengan go test',
    'Membuat table-driven test',
    'Membuat mock sederhana memakai interface',
    'Menulis benchmark dan melihat code coverage'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Berkas uji diberi akhiran <code>_test.go</code> dan berada di package yang sama dengan kode yang diuji. Fungsi uji diawali <code>Test</code> dan menerima parameter <code>*testing.T</code>. Jalankan dengan <code>go test</code>.</p>'
    },
    {
      type: 'example',
      title: 'Unit test pertama',
      lang: 'go',
      output: false,
      code: `// Berkas: matematika.go
package matematika

func Tambah(a, b int) int {
    return a + b
}

// Berkas: matematika_test.go
package matematika

import "testing"

func TestTambah(t *testing.T) {
    hasil := Tambah(2, 3)
    if hasil != 5 {
        // t.Errorf menandai gagal tetapi tes lanjut
        t.Errorf("Tambah(2,3) = %d; mau 5", hasil)
    }
}`,
      explain: [
        'Berkas uji selalu berakhiran <code>_test.go</code>.',
        'Fungsi uji bernama <code>TestXxx</code> dan menerima <code>*testing.T</code>.',
        '<code>t.Errorf</code> mencatat kegagalan; <code>t.Fatalf</code> menghentikan tes saat itu juga.',
        'Jalankan dengan <code>go test</code> di folder tersebut.'
      ]
    },
    {
      type: 'example',
      title: 'Perintah go test yang sering dipakai',
      lang: 'bash',
      output: false,
      code: `# Jalankan semua tes di package saat ini
go test

# Tampilkan detail (verbose)
go test -v

# Jalankan semua tes di seluruh module
go test ./...

# Hanya tes tertentu (regex pada nama)
go test -run TestTambah

# Sertakan deteksi race condition
go test -race ./...`,
      explain: [
        '<code>go test</code> mengompilasi dan menjalankan tes secara otomatis.',
        '<code>-v</code> menampilkan hasil tiap tes, bukan hanya ringkasan.',
        '<code>./...</code> menjalankan tes di semua package di bawah folder saat ini.',
        '<code>-race</code> mendeteksi race condition sekaligus saat menguji.'
      ]
    },
    {
      type: 'text', html: '<p><b>Table-driven test</b> adalah pola paling populer di Go: daftar kasus uji disimpan dalam slice, lalu dijalankan berulang dalam satu perulangan. Menambah kasus baru cukup menambah satu baris.</p>'
    },
    {
      type: 'example',
      title: 'Table-driven test + subtest',
      lang: 'go',
      output: false,
      code: `package matematika

import "testing"

func Bagi(a, b int) (int, error) {
    if b == 0 {
        return 0, errBagiNol
    }
    return a / b, nil
}

func TestBagi(t *testing.T) {
    kasus := []struct {
        nama      string
        a, b      int
        mau       int
        mauError  bool
    }{
        {"normal", 10, 2, 5, false},
        {"pecahan dipotong", 7, 2, 3, false},
        {"bagi nol", 5, 0, 0, true},
    }

    for _, k := range kasus {
        // t.Run membuat subtest bernama
        t.Run(k.nama, func(t *testing.T) {
            hasil, err := Bagi(k.a, k.b)
            if k.mauError {
                if err == nil {
                    t.Fatalf("harusnya error")
                }
                return
            }
            if err != nil {
                t.Fatalf("tidak mau error, dapat: %v", err)
            }
            if hasil != k.mau {
                t.Errorf("dapat %d, mau %d", hasil, k.mau)
            }
        })
    }
}`,
      explain: [
        'Setiap kasus menyimpan input, hasil yang diharapkan, dan perilaku error.',
        '<code>t.Run(nama, ...)</code> membuat subtest yang namanya muncul di keluaran.',
        'Pola ini membuat penambahan kasus sangat mudah dan terstruktur.',
        'Gunakan <code>t.Errorf</code> untuk lanjut ke kasus berikutnya, <code>t.Fatalf</code> untuk berhenti.'
      ]
    },
    {
      type: 'text', // mocking
      html: '<p>Karena Go menganut interface implisit, <b>mocking</b> menjadi mudah: cukup buat tipe tiruan yang memenuhi interface yang sama. Kode yang diuji tidak perlu tahu apakah ia memakai implementasi nyata atau tiruan.</p>'
    },
    {
      type: 'example',
      title: 'Mock lewat interface',
      lang: 'go',
      output: false,
      code: `package pengguna

import "testing"

// Interface yang dipakai service
type Penyimpanan interface {
    Ambil(id int) (string, error)
}

// Service bergantung pada interface, bukan implementasi konkret
type Service struct{ repo Penyimpanan }

func (s Service) NamaPertama(id int) string {
    nama, err := s.repo.Ambil(id)
    if err != nil {
        return "Tamu"
    }
    return nama
}

// Mock: implementasi palsu untuk pengujian
type mockRepo struct{}

func (mockRepo) Ambil(id int) (string, error) {
    return "Andi", nil
}

// Simulasi error
type mockError struct{}

func (mockError) Ambil(id int) (string, error) {
    return "", errGagal
}

func TestNamaPertama(t *testing.T) {
    s := Service{repo: mockRepo{}}
    if got := s.NamaPertama(1); got != "Andi" {
        t.Errorf("dapat %q, mau Andal", got)
    }

    sErr := Service{repo: mockError{}}
    if got := sErr.NamaPertama(1); got != "Tamu" {
        t.Errorf("saat error harus 'Tamu', dapat %q", got)
    }
}`,
      explain: [
        'Service hanya bergantung pada interface <code>Penyimpanan</code>.',
        'Mock membuat pengujian cepat dan tidak membutuhkan database nyata.',
        'Kita bisa membuat beberapa mock untuk mensimulasikan sukses dan gagal.',
        'Inilah alasan idiom Go menyarankan "accept interfaces, return structs".'
      ]
    },
    {
      type: 'text', // benchmark
      html: '<p><b>Benchmark</b> mengukur kinerja sebuah fungsi. Fungsi benchmark diawali <code>Benchmark</code> dan menerima <code>*testing.B</code>. Go otomatis menentukan berapa kali fungsi dijalankan agar hasilnya stabil.</p>'
    },
    {
      type: 'example',
      title: 'Benchmark & coverage',
      lang: 'go',
      output: false,
      code: `package matematika

import "testing"

// Fungsi benchmark
func BenchmarkTambah(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = Tambah(100, 200)
    }
}

// Perintah menjalankannya:
//   go test -bench=.
// Contoh keluaran:
//   BenchmarkTambah-8   1000000000   0.29 ns/op

// Melihat code coverage:
//   go test -cover
//   go test -coverprofile=cover.out
//   go tool cover -html=cover.out`,
      explain: [
        'Loop <code>for i := 0; i < b.N; i++</code> menjalankan kode yang diukur sebanyak N kali.',
        'Go menyesuaikan N agar pengukuran akurat.',
        'Hasilnya berupa waktu per operasi (ns/op) — makin kecil makin cepat.',
        '<code>-cover</code> dan <code>go tool cover</code> menampilkan persentase baris kode yang teruji.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai dari kasus yang paling penting',
      text: 'Tidak perlu mengejar 100% coverage. Fokuslah menguji logika inti dan kasus batas (input kosong, nol, negatif, error). Tes yang bermakna lebih berguna daripada banyak tes dangkal.'
    },
    {
      type: 'warn',
      title: 'Mock berlebihan membuat tes rapuh',
      text: 'Terlalu banyak mock bisa membuat tes sulit dirawat dan tidak lagi menguji perilaku nyata. Prioritaskan pengujian pada logika bisnis, dan batasi mock pada batas sistem (database, jaringan, waktu).'
    },
    {
      type: 'vocab',
      items: [
        ['go test', 'Perintah menjalankan pengujian.'],
        ['_test.go', 'Akhiran berkas berisi kode pengujian.'],
        ['testing.T', 'Parameter fungsi uji untuk mencatat kegagalan.'],
        ['Table-driven test', 'Pola menyimpan banyak kasus uji dalam slice.'],
        ['Mock', 'Implementasi tiruan yang memenuhi interface.'],
        ['testing.B', 'Parameter fungsi benchmark.'],
        ['Code coverage', 'Persentase kode yang dijalankan oleh pengujian.']
      ]
    }
  ],
  recap: [
    'Go punya testing bawaan: berkas _test.go dan perintah go test.',
    'testing.T untuk uji; t.Errorf lanjut, t.Fatalf berhenti.',
    'Table-driven test menyimpan kasus uji dalam slice dan menjalankannya berulang.',
    'Mock dibuat dengan mengimplementasikan interface.',
    'testing.B untuk benchmark; -cover untuk analisis cakupan.'
  ]
});
