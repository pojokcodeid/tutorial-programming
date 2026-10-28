/* ============================================================
   Pelajaran Go — Bab 12: Unit Testing
   (topik info.md:
    - "Siklus hidup tes: TestMain, t.TempDir, t.Cleanup, t.Skip, t.Parallel"
    - "Subtest, filter -run, t.Helper, dan golden file (testdata)"
    - "Code coverage mendalam: coverprofile, cover -func, coverpkg"
    - "Unit test HTTP handler dengan net/http/httptest"
    - "Test doubles: stub, fake, mock & spy berbasis interface"
    - "Dependency injection untuk menguji service, plus testify")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 27: Unit Test yang Rapi: Subtest, Helper & Coverage ---------- */
window.GO_LESSONS.push({
  id: 'unit-testing',
  title: 'Unit Test yang Rapi: Subtest, Helper & Coverage',
  chapter: 'Unit Testing',
  duration: '14 menit',
  intro: [
    'Pelajaran sebelumnya membahas dasar <code>go test</code>. Bab ini memperdalam cara menulis unit test yang <b>cepat, terisolasi, dan mudah dirawat</b> — tiga syarat agar tes tetap dipercaya tim.',
    'Kita bahas siklus hidup tes (TestMain, TempDir, Cleanup), subtest paralel, helper assertion, golden file, hingga membaca hasil <b>code coverage</b> dengan benar.'
  ],
  objectives: [
    'Mengatur persiapan & pembersihan tes dengan TestMain dan t.Cleanup',
    'Menulis subtest paralel dan memfilternya dengan -run',
    'Membuat helper assertion dengan t.Helper',
    'Menguji keluaran teks/JSON memakai golden file di testdata',
    'Membaca laporan coverage per fungsi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Unit test</b> menguji satu unit kecil (satu fungsi/method) secara terisolasi: tanpa jaringan, tanpa database, tanpa jam tidur. Tiga sifat yang harus dijaga:</p><table class="vocab"><tr><th>Sifat</th><th>Arti</th><th>Lawannya</th></tr><tr><td><b>Cepat</b></td><td>Ribuan tes selesai dalam hitungan detik</td><td>Menunggu API luar</td></tr><tr><td><b>Terisolasi</b></td><td>Tidak membaca/tulis keadaan bersama</td><td>Urutan eksekusi menentukan hasil</td></tr><tr><td><b>Deterministik</b></td><td>Selalu sama hasilnya untuk input yang sama</td><td>Waktu, acak, dan flaky test</td></tr></table><p>Bila sebuah tes butuh jaringan atau database, ia bukan lagi unit test — tempatkan sebagai <i>integration test</i>.</p>'
    },
    {
      type: 'example',
      title: 'Siklus hidup tes: TestMain, t.TempDir & t.Cleanup',
      lang: 'go',
      output: false,
      code: `package konfigurasi

import (
    "os"
    "path/filepath"
    "testing"
)

// TestMain dijalankan SEKALI untuk seluruh package ini.
// Persiapan di atas m.Run(), pembersihan sesudahnya.
func TestMain(m *testing.M) {
    os.Setenv("APP_ENV", "test") // lingkungan khusus pengujian
    kode := m.Run()              // jalankan semua TestXxx di package
    os.Unsetenv("APP_ENV")       // bereskan sebelum keluar
    os.Exit(kode)                // wajib: tanpa ini tes dianggap lulus terus
}

func TestBacaFile(t *testing.T) {
    // Folder unik per tes, otomatis dihapus setelah tes selesai
    dir := t.TempDir()

    nama := filepath.Join(dir, "app.conf")
    if err := os.WriteFile(nama, []byte("port=8080"), 0o644); err != nil {
        t.Fatalf("gagal menulis fixture: %v", err) // persiapan gagal = tes gagal
    }

    // Cleanup dijalankan meskipun tes gagal atau panic.
    // Bisa didaftarkan banyak kali; diurutkan LIFO (yang terakhir dicoret duluan).
    t.Cleanup(func() { t.Log("selesai memakai", nama) })

    isi, err := os.ReadFile(nama)
    if err != nil {
        t.Fatalf("baca: %v", err)
    }
    if string(isi) != "port=8080" {
        t.Errorf("isi = %q, mau port=8080", isi)
    }
}`,
      explain: [
        '<code>TestMain</code> hanya boleh satu per package; di dalamnya <code>m.Run()</code> mengeksekusi seluruh fungsi tes.',
        '<code>os.Exit(kode)</code> wajib dipanggil di akhir — tanpanya proses tes dianggap selalu berhasil.',
        '<code>t.TempDir()</code> memberi folder bersih yang unik dan otomatis dibersihkan, sehingga tes saling mengisolasi.',
        '<code>t.Cleanup</code> cocok untuk pelepasan sumber daya; pembersihan tetap berjalan saat tes gagal.',
        'Persiapan yang gagal sebaiknya memakai <code>t.Fatalf</code> — tidak ada gunanya melanjutkan tes dengan fixture rusak.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Subtest</b> dibuat dengan <code>t.Run(nama, ...)</code> di dalam fungsi tes induk. Selain membuat keluaran lebih terbaca, subtest juga bisa dijalankan <b>paralel</b> dan <b>disaring</b> lewat flag <code>-run</code>.</p>'
    },
    {
      type: 'example',
      title: 'Subtest paralel & filter dengan -run',
      lang: 'go',
      output: false,
      code: `package akun

import "testing"

func TestTerimaSetoran(t *testing.T) {
    kasus := []struct {
        nama    string
        setoran int
        mau     int
    }{
        {"setoran_kecil", 1_000, 1_000},
        {"setoran_besar", 500_000, 500_000},
        {"tanpa_setoran", 0, 0},
    }

    for _, k := range kasus {
        k := k // salin variabel loop (wajib sebelum Go 1.22)
        t.Run(k.nama, func(t *testing.T) {
            t.Parallel() // subtest ini boleh berjalan bersamaan
            if saldo := Terima(k.setoran); saldo != k.mau {
                t.Errorf("saldo = %d, mau %d", saldo, k.mau)
            }
        })
    }
}

/* Perintah yang berguna:
   go test -v                                   # lihat nama tiap subtest
   go test -run 'TestTerimaSetoran/setoran_besar'
   go test -run 'TestTerimaSetoran/.*kecil' -v   # pola regex
   go test -race ./...                           # sambil mendeteksi race  */`,
      explain: [
        'Nama subtest dipakai sebagai <b>regex</b> pada <code>-run</code>; susunan <code>Induk/Sub</code> dipisah garis miring.',
        'Sebutan <code>k := k</code> diperlukan sebelum Go 1.22 agar closure tidak menangkap variabel loop yang sama — sejak Go 1.22 perilakunya sudah aman tanpa salinan.',
        '<code>t.Parallel()</code> menunda subtest sampai tes induk selesai memanggilnya, lalu menjalankannya bersamaan (maksimal <code>GOMAXPROCS</code>).',
        'Subtest paralel aman hanya bila tiap kasus benar-benar terisolasi — tidak berbagi variabel package.'
      ]
    },
    {
      type: 'text',
      html: '<p>Pesan kesalahan yang bagus menjelaskan <b>apa yang diuji</b>, <b>apa yang diharapkan</b>, dan <b>apa yang didapat</b>. Supaya lokasinya menunjuk ke baris pemanggil, bukan ke helper, gunakan <code>t.Helper()</code>.</p>'
    },
    {
      type: 'example',
      title: 'Helper assertion dengan t.Helper',
      lang: 'go',
      output: false,
      code: `package akun

import "testing"

// assertInt adalah helper milik package tes ini.
func assertInt(t *testing.T, nama string, mau, dapat int) {
    t.Helper() // laporkan kegagalan pada baris pemanggil helper
    if mau != dapat {
        t.Errorf("%s: dapat %d, mau %d", nama, dapat, mau)
    }
}

func TestSaldoAkhir(t *testing.T) {
    assertInt(t, "Terima(100,50)", 150, Terima(100, 50))
    // Bila gagal, baris yang ditandai adalah baris pemanggil di atas,
    // bukan baris t.Errorf di dalam helper — jauh lebih mudah dilacak.

    // Helper lain yang sering dipakai:
    //   t.Skip("butuh database")   -- lewati tes ini (mis. build tag tidak cocok)
    //   t.Skipf("tidak didukung di %s", runtime.GOOS)
    //   t.Fatal vs t.Error          -- Fatal berhenti, Error lanjut
}`,
      explain: [
        '<code>t.Helper()</code> menyembunyikan helper dari laporan sehingga file dan baris yang ditampilkan adalah milik pemanggil.',
        'Buat helper sesingkat mungkin; satu helper untuk satu jenis pembanding (int, string, error, slice).',
        '<code>t.Skip</code> berguna untuk tes yang bergantung lingkungan, agar tidak dihitung sebagai kegagalan.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk keluaran yang panjang (laporan, template, encoder), menulis ekspektasi baris demi baris merepotkan. Pola <b>golden file</b> menyimpan hasil yang benar di folder <code>testdata/</code> lalu membandingkannya. Berkas <code>testdata</code> otomatis diabaikan Go sebagai package.</p>'
    },
    {
      type: 'example',
      title: 'Golden file di testdata (dengan flag -update)',
      lang: 'go',
      output: false,
      code: `package laporan

import (
    "flag"
    "os"
    "path/filepath"
    "testing"
)

// Flag milik biner tes. Jalankan: go test -run TestRender -update
var update = flag.Bool("update", false, "tulis ulang golden file")

func TestRenderRingkasan(t *testing.T) {
    got := RenderRingkasan([]Baris{{Nama: "Andi", Jumlah: 3}})

    nama := filepath.Join("testdata", "ringkasan.txt")
    if *update {
        _ = os.MkdirAll("testdata", 0o755)
        if err := os.WriteFile(nama, []byte(got), 0o644); err != nil {
            t.Fatalf("tulis golden file: %v", err)
        }
        t.Log("golden file diperbarui:", nama)
    }

    mau, err := os.ReadFile(nama)
    if err != nil {
        t.Fatalf("golden file hilang -- jalankan: go test -run TestRender -update (%v)", err)
    }
    if got != string(mau) {
        t.Errorf("keluaran berbeda.\\n--- dapat ---\\n%s\\n--- mau ---\\n%s", got, mau)
    }
}`,
      explain: [
        'Folder <code>testdata/</code> berada di samping kode tes dan sengaja tidak dikompilasi Go.',
        'Flag <code>-update</code> menulis ulang ekspektasi ketika perilaku yang berubah memang disengaja — jangan dijalankan otomatis di CI.',
        'Perbarui golden file hanya setelah memeriksa perbedaannya (mis. lewat <code>git diff testdata/</code>).',
        'Pola ini sangat cocok untuk laporan, HTML, CSV, dan pesan error yang formatnya penting.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Code coverage</b> memberi gambaran baris mana yang belum pernah dijalankan tes. Ia bukan target, melainkan <b>alat menemukan celah</b> — angka 100% tanpa mutu tes tetap menyesatkan.</p>'
    },
    {
      type: 'example',
      title: 'Coverage: profil, laporan per fungsi, dan HTML',
      lang: 'bash',
      output: false,
      code: `# 1. Jalankan seluruh tes sambil merekam cakupan
go test -coverprofile=cover.out ./...

# 2. Lihat persentase per fungsi (paling berguna untuk review)
go tool cover -func=cover.out
# total: (statements) 87.5% dari seluruh package

# 3. Laporan HTML: hijau = teruji, merah = belum tersentuh
go tool cover -html=cover.out -o cover.html
open cover.html

# 4. Menghitung cakupan package lain dari tes package ini
#    (mis. tes di package service ikut menutup package domain)
go test -coverpkg=./... -coverprofile=cover.out ./...`,
      explain: [
        '<code>-coverprofile</code> menyimpan data mentah; <code>-func</code> merangkumnya per fungsi sehingga cepat dibaca reviewer.',
        'Coverage menghitung <b>pernyataan (statements)</b>, bukan cabang — kasus <code>else</code> bisa terlewat walau persentasenya tampak tinggi.',
        'Bandingkan coverage sebelum dan sesudah menulis tes, bukan mengejar angka absolut.',
        'Berkas <code>cover.out</code> sebaiknya dimasukkan ke <code>.gitignore</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Tes yang cepat akan terus dijalankan',
      text: 'Bila satu putaran tes butuh semenit, pengembang akan menjalankannya sesekali saja. Jaga agar unit test selesai dalam hitungan detik: tanpa jaringan, tanpa sleep panjang, dan dengan data minimum. Kecepatan tes adalah bagian dari kualitas tim.'
    },
    {
      type: 'warn',
      title: 'Hindari t.Sleep untuk "menunggu" hasil',
      text: 'Perintah time.Sleep membuat tes lambat sekaligus flaky (kadang lulus, kadang gagal). Untuk operasi asinkron, uji lewat channel, WaitGroup, atau callback yang bisa ditunggu — bukan dengan menebak waktu.'
    },
    {
      type: 'vocab',
      items: [
        ['TestMain', 'Fungsi khusus yang mengatur seluruh proses tes satu package.'],
        ['t.TempDir()', 'Folder unik per tes, otomatis dibersihkan.'],
        ['t.Cleanup', 'Mendaftarkan pembersihan yang dijalankan setelah tes selesai.'],
        ['t.Helper', 'Menandai fungsi helper agar lokasi error menunjuk pemanggil.'],
        ['Subtest', 'Tes di dalam tes lewat t.Run(nama, ...).'],
        ['Golden file', 'Berkas ekspektasi di folder testdata untuk membandingkan keluaran.'],
        ['Cover profile', 'Berkas hasil go test -coverprofile yang dianalisis go tool cover.']
      ]
    }
  ],
  recap: [
    'TestMain mengatur persiapan & pembersihan satu package; m.Run() lalu os.Exit(kode).',
    't.TempDir() dan t.Cleanup membuat tes terisolasi dan aman saat gagal.',
    't.Run membuat subtest yang bisa dijalankan paralel dan disaring dengan -run.',
    't.Helper membuat pesan kesalahan menunjuk ke baris pemanggil.',
    'Golden file di testdata cocok untuk keluaran panjang; -update memperbaruinya.',
    'Coverage adalah alat menemukan celah, bukan angka yang harus dikejar.'
  ]
});

/* ---------- Pelajaran 28: Unit Test Handler HTTP & Test Doubles ---------- */
window.GO_LESSONS.push({
  id: 'unit-testing-http',
  title: 'Unit Test Handler HTTP & Test Doubles',
  chapter: 'Unit Testing',
  duration: '14 menit',
  intro: [
    'Komponen yang paling sering diuji di proyek web adalah <b>handler HTTP</b> dan <b>service</b> yang bergantung pada database. Keduanya bisa diuji sebagai unit test asalkan dependensinya ditiru.',
    'Go menyediakan package <b>net/http/httptest</b> untuk menguji handler tanpa membuka port, dan interface bawaan Go membuat peniruan dependensi (test doubles) terasa alami.'
  ],
  objectives: [
    'Menguji handler dengan httptest.NewRequest dan httptest.NewRecorder',
    'Menguji client HTTP dengan httptest.NewServer',
    'Membedakan stub, fake, mock, dan spy',
    'Menulis fake repository berbasis interface',
    'Menggunakan testify untuk assertion yang ringkas'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>httptest</b> bekerja pada dua level. <code>httptest.NewRequest</code> + <code>httptest.NewRecorder</code> memanggil handler <b>langsung sebagai fungsi biasa</b> — tidak ada koneksi sama sekali. <code>httptest.NewServer</code> menjalankan server HTTP sungguhan pada port sementara untuk menguji client.</p>'
    },
    {
      type: 'example',
      title: 'Unit test handler dengan NewRecorder',
      lang: 'go',
      output: false,
      code: `package handler

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestTambahPengguna(t *testing.T) {
    // 1. Siapkan permintaan palsu (tanpa jaringan, tanpa port)
    body := strings.NewReader("{\\"nama\\":\\"Andi\\"}")
    req := httptest.NewRequest(http.MethodPost, "/pengguna", body)
    req.Header.Set("Content-Type", "application/json")

    // 2. Recorder menampung status, header, dan body respons
    rec := httptest.NewRecorder()

    // 3. Panggil handler seperti fungsi biasa
    TambahPengguna(rec, req)

    // 4. Periksa status
    if rec.Code != http.StatusCreated {
        t.Fatalf("status = %d, mau %d", rec.Code, http.StatusCreated)
    }

    // 5. Periksa isi body JSON
    var got map[string]any
    if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
        t.Fatalf("decode respons: %v", err)
    }
    if got["nama"] != "Andi" {
        t.Errorf("nama = %v, mau Andi", got["nama"])
    }
}

// Kasus negatif: badan JSON rusak harus dibalas 400.
func TestTambahPengguna_BadanInvalid(t *testing.T) {
    req := httptest.NewRequest(http.MethodPost, "/pengguna", strings.NewReader("{"))
    rec := httptest.NewRecorder()

    TambahPengguna(rec, req)

    if rec.Code != http.StatusBadRequest {
        t.Errorf("status = %d, mau %d", rec.Code, http.StatusBadRequest)
    }
}`,
      explain: [
        '<code>httptest.NewRequest</code> membuat <code>*http.Request</code> lengkap dengan metode, URL, dan header.',
        '<code>httptest.NewRecorder</code> merekam status (<code>rec.Code</code>), header, dan body respons.',
        'Karena handler dipanggil langsung, tes ini super cepat dan tidak pernah port-nya bentrok.',
        'Uji minimal tiga hal pada handler: status, isi respons, dan perilaku saat input tidak valid.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji client dengan httptest.NewServer',
      lang: 'go',
      output: false,
      code: `package klien

import (
    "io"
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestAmbilPengguna(t *testing.T) {
    // Server tiruan: membalas JSON yang sudah ditentukan
    srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path != "/pengguna/1" {
            t.Errorf("path = %s, mau /pengguna/1", r.URL.Path)
        }
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        _, _ = w.Write([]byte("{\\"id\\":1,\\"nama\\":\\"Andi\\"}"))
    }))
    defer srv.Close() // port sementara otomatis ditutup

    // Klien nyata mengarah ke server tiruan
    res, err := http.Get(srv.URL + "/pengguna/1")
    if err != nil {
        t.Fatalf("request: %v", err)
    }
    defer res.Body.Close()

    isi, _ := io.ReadAll(res.Body)
    if res.StatusCode != http.StatusOK {
        t.Errorf("status = %d", res.StatusCode)
    }
    if len(isi) == 0 {
        t.Error("body kosong")
    }
}`,
      explain: [
        '<code>httptest.NewServer</code> menjalankan server pada port acak dan menutupnya otomatis lewat <code>Close()</code>.',
        'Cocok untuk menguji <b>client</b>, handler kompleks lintas rute, atau alur request penuh tanpa aplikasi berjalan.',
        'Anda juga bisa memeriksa <b>permintaan yang diterima</b> server tiruan — berguna memastikan client mengirim path, method, dan header yang benar.',
        'Untuk tes unit murni, utamakan <code>NewRecorder</code>; gunakan <code>NewServer</code> bila memang perlu siklus request/response lengkap.'
      ]
    },
    {
      type: 'text',
      html: '<p>Istilah <b>test doubles</b> merujuk pada pengganti komponen asli saat tes. Pemakaannya berbeda-beda, dan memilih yang tepat membuat tes lebih sederhana serta tidak rapuh.</p><table class="vocab"><tr><th>Jenis</th><th>Fungsi</th><th>Contoh</th></tr><tr><td><b>Stub</b></td><td>Membalas nilai tetap, tidak memeriksa apa pun</td><td>Repo selalu mengembalikan user Andi</td></tr><tr><td><b>Fake</b></td><td>Implementasi nyata versi sederhana (biasanya di memori)</td><td>Repository map tanpa SQL</td></tr><tr><td><b>Mock</b></td><td>Memeriksa <i>harapan</i>: metode mana dipanggil dengan argumen apa</td><td>Notifikasi harus dikirim tepat sekali</td></tr><tr><td><b>Spy</b></td><td>Mencatat pemanggilan untuk diperiksa setelah tes</td><td>Menghitung berapa kali Simpan dipanggil</td></tr></table><p>Praktik yang disarankan: pakai <b>fake</b> untuk menguji perilaku, dan <b>mock/spy</b> hanya pada interaksi yang benar-benar wajib terjadi.</p>'
    },
    {
      type: 'example',
      title: 'Fake repository berbasis interface',
      lang: 'go',
      output: false,
      code: `package akun

import "testing"

// Interface dimiliki konsumen (service), bukan penyedia (database).
// Bisa diletakkan di berkas terpisah dari berkas tesnya.

type Pengguna struct {
    ID   int
    Nama string
}

type Repo interface {
    ByID(id int) (Pengguna, error)
    Simpan(p Pengguna) error
}

// FAKE: implementasi "nyata" versi memori.
type RepoPalsu struct {
    data         map[int]Pengguna
    jumlahSimpan int // dipakai seperti spy
}

func NewRepoPalsu() *RepoPalsu {
    return &RepoPalsu{data: map[int]Pengguna{}}
}

func (r *RepoPalsu) ByID(id int) (Pengguna, error) {
    p, ok := r.data[id]
    if !ok {
        return Pengguna{}, errTidakAda
    }
    return p, nil
}

func (r *RepoPalsu) Simpan(p Pengguna) error {
    r.jumlahSimpan++
    r.data[p.ID] = p
    return nil
}

// ---- pemakaian di tes ----
func TestServiceDaftar(t *testing.T) {
    repo := NewRepoPalsu()
    svc := NewService(repo)

    if err := svc.Daftar("Andi"); err != nil {
        t.Fatalf("Daftar: %v", err)
    }

    // Verifikasi PERILAKU, bukan detail implementasi
    if repo.jumlahSimpan != 1 {
        t.Errorf("Simpan dipanggil %d kali, mau 1", repo.jumlahSimpan)
    }
    p, err := repo.ByID(1)
    if err != nil {
        t.Fatalf("ByID: %v", err)
    }
    if p.Nama != "Andi" {
        t.Errorf("nama = %q, mau Andi", p.Nama)
    }
}`,
      explain: [
        'Service hanya mengenal interface <code>Repo</code>, sehingga produksi memakai repository SQL dan tes memakai versi memori.',
        'Fake membuat tes tetap masuk akal: data benar-benar tersimpan dan bisa dibaca kembali.',
        '<code>jumlahSimpan</code> berperan sebagai spy — memverifikasi bahwa sebuah interaksi benar-benar terjadi.',
        'Struktur data fake (map) berada di memori, sehingga setiap kali tes dijalankan keadaannya kembali bersih.',
        'Bila ternyata ada kesalahan penulisan pada blok tes, Anda akan menemukannya saat mengompilasi: itulah keuntungan tes terkompilasi.'
      ]
    },
    {
      type: 'example',
      title: 'Dependency injection: satu jalur produksi, satu jalur tes',
      lang: 'go',
      output: false,
      code: `package notifikasi

import "time"

// Interface kecil yang mudah ditiru: jam dan pengirim pesan.
type Jam interface {
    Sekarang() time.Time
}

type Pengirim interface {
    Kirim(ke, pesan string) error
}

type Service struct {
    repo    Repo
    jam     Jam
    kirim   Pengirim
}

// Konstruksi memakai implementasi nyata.
func Baru(repo Repo, jam Jam, kirim Pengirim) *Service {
    return &Service{repo: repo, jam: jam, kirim: kirim}
}

func (s *Service) SapaHariIni(ke string) error {
    switch s.jam.Sekarang().Weekday() {
    case time.Saturday, time.Sunday:
        return nil // akhir pekan tidak mengirim
    }
    return s.kirim.Kirim(ke, "Selamat bekerja!")
}

// Di tes: jam dan pengirim diganti tiruan, repo memakai fake.
func TestSapaHariIni_AkhirPekan(t *testing.T) {
    kirim := &pengirimSpy{}
    svc := Baru(NewRepoPalsu(), jamTetap(time.Saturday), kirim)

    if err := svc.SapaHariIni("andi@mail.test"); err != nil {
        t.Fatalf("SapaHariIni: %v", err)
    }

    // pengirimSpy mencatat setiap pesan; pastikan tidak ada yang terkirim
    if len(kirim.terkirim) != 0 {
        t.Errorf("akhir pekan seharusnya tidak mengirim pesan, terkirim %d", len(kirim.terkirim))
    }
}`,
      explain: [
        'Dependensi disuntikkan lewat konstruktor sehingga tes bisa mengganti satu per satu tanpa mengubah kode produksi.',
        'Fake repo dipakai persis seperti implementasi nyata — tidak ada cabang <code>if testing</code> di dalam kode produksi.',
        'Interface kecil (1-2 metode) lebih baik daripada interface besar; inilah pola <i>accept interfaces, return structs</i>.',
        'Waktu adalah dependensi paling sering bikin tes flaky — bungkus dengan interface <code>Jam</code> alih-alih memanggil <code>time.Now()</code> langsung.',
        'Alternatif penulisan dependensi: gunakan variabel package sebagai titik ganti (mis. <code>var now = time.Now</code>), namun konstruktor lebih rapi untuk service besar.'
      ]
    },
    {
      type: 'text',
      html: '<p>Assertion manual membuat tes panjang. Library <b>testify</b> (kumunitas paling populer) menyediakan <code>assert</code> (lanjut saat gagal) dan <code>require</code> (berhenti saat gagal).</p>'
    },
    {
      type: 'example',
      title: 'Assertion ringkas dengan testify',
      lang: 'bash',
      output: false,
      code: `# Tambahkan ke proyek
go get github.com/stretchr/testify@latest`,
      explain: [
        'Testify adalah modul pihak ketiga; Go menyimpannya di <code>go.mod</code> seperti dependensi lain.'
      ]
    },
    {
      type: 'example',
      title: 'Pemakaian assert & require',
      lang: 'go',
      output: false,
      code: `package matematika

import (
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestBagi(t *testing.T) {
    // assert: kegagalan dicatat, tes LANJUT ke assertion berikutnya
    got, err := Bagi(10, 2)
    assert.NoError(t, err)
    assert.Equal(t, 5, got, "harusnya 5")
    assert.NotEmpty(t, "hasil")

    // require: kegagalan mengHENTIKAN tes (untuk prasyarat/wajib)
    hasil, err := Bagi(9, 3)
    require.NoError(t, err, "prasyarat gagal, tes tidak berguna")
    assert.Equal(t, 3, hasil)

    // Bentuk lain yang sering dipakai:
    //   assert.Contains(t, pesan, "gagal")
    //   assert.Len(t, daftar, 3)
    //   assert.ErrorIs(t, err, ErrNol)
    //   assert.InDelta(t, 1.5, nilai, 0.001)  -- untuk float
}`,
      explain: [
        '<code>assert</code> untuk pemeriksaan yang boleh dilanjutkan; <code>require</code> untuk syarat tanpa mana tes tidak bermakna.',
        '<code>ErrorIs</code> memeriksa rantai error, penting bila layanan Anda membungkus error dengan <code>%w</code>.',
        'Untuk float selalu gunakan toleransi (<code>InDelta</code>) — perbandingan persis sering salah.',
        'Testify bersifat opsional; banyak proyek tetap memakai assertion bawaan agar nol dependensi.'
      ]
    },
    {
      type: 'tip',
      title: 'Uji perilaku, bukan detail implementasi',
      text: 'Tes seharusnya tetap lulus walau Anda mengganti isi fungsi selama hasilnya sama. Hindari memeriksa variabel internal, urutan pemanggilan privat, atau struktur data yang bisa berubah. Bila sebuah tes ikut rusak saat refaktor tanpa perubahan perilaku, tes itu terlalu dekat dengan implementasi.'
    },
    {
      type: 'warn',
      title: 'Mock berlebihan membuat tes rapuh',
      text: 'Terlalu banyak ekspektasi mock membuat tes sulit dirawat dan menggambarkan cara kerja, bukan hasil. Gunakan fake untuk alur yang wajar, dan batasi mock pada interaksi wajib di batas sistem — seperti pengiriman pesan, pembayaran, atau penulisan log kritis.'
    },
    {
      type: 'vocab',
      items: [
        ['httptest.NewRecorder', 'Perekam respons untuk dipanggil langsung pada handler.'],
        ['httptest.NewRequest', 'Membuat permintaan HTTP palsu tanpa jaringan.'],
        ['httptest.NewServer', 'Server HTTP sementara untuk menguji client.'],
        ['Stub', 'Tiruan yang hanya mengembalikan nilai tetap.'],
        ['Fake', 'Implementasi nyata versi sederhana, umumnya di memori.'],
        ['Mock', 'Tiruan yang memeriksa ekspektasi pemanggilan.'],
        ['Spy', 'Tiruan yang mencatat pemanggilan untuk diperiksa sesudahnya.'],
        ['testify', 'Library assertion populer: assert (lanjut) dan require (berhenti).']
      ]
    }
  ],
  recap: [
    'httptest.NewRequest + NewRecorder menguji handler tanpa port dan jaringan.',
    'httptest.NewServer menguji client dengan server tiruan yang portnya acak.',
    'Stub, fake, mock, dan spy punya peran berbeda; fake untuk perilaku, mock untuk interaksi wajib.',
    'Interface milik konsumen membuat dependensi mudah ditiru lewat dependency injection.',
    'Bungkus waktu dengan interface Jam agar tes tidak pernah flaky.',
    'testify mempersingkat assertion: assert melanjutkan, require menghentikan.'
  ]
});
