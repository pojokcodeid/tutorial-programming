/* ============================================================
   Pelajaran Go — Bab 19: Advanced Go Internal & Optimization
   (topik info.md:
    - "Reflection (reflect package) & Unsafe Pointer"
    - "Memory Management: Garbage Collection (GC) tuning,
       Stack vs Heap allocation"
    - "Profiling & Performance Tuning: Menggunakan pprof dan trace"
    - "Generic programming (Generics di Go 1.18+)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 39: Reflection & Unsafe Pointer ---------- */
window.GO_LESSONS.push({
  id: 'reflection-unsafe',
  title: 'Reflection (reflect) & Unsafe Pointer',
  chapter: 'Advanced Go Internal & Optimization',
  duration: '12 menit',
  intro: [
    '<b>Reflection</b> memungkinkan program memeriksa -dan memanipulasi- tipe dan nilai variabel <i>saat berjalan</i> (runtime), bukan saat kompilasi. Inilah rahasia di balik <code>encoding/json</code>, ORM, dan library validasi.',
    'Pelajaran ini juga mengenalkan package <b>unsafe</b> yang membuka pintu ke level memori paling rendah. Keduanya sangat kuat, tetapi harus dipakai dengan sangat hati-hati.'
  ],
  objectives: [
    'Memahami kapan reflection dibutuhkan',
    'Menggunakan reflect.TypeOf & reflect.ValueOf',
    'Membaca struct tag dengan reflection',
    'Memahami risiko unsafe.Pointer'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Package <b>reflect</b> memberi dua fungsi utama: <code>reflect.TypeOf(x)</code> mengembalikan <b>tipe</b> sebuah nilai, dan <code>reflect.ValueOf(x)</code> mengembalikan <b>nilai</b>-nya. Dari keduanya kita bisa mengetahui nama tipe, <i>kind</i>, dan seluruh field pada sebuah struct — semuanya saat program berjalan.</p>'
    },
    {
      type: 'example',
      title: 'Dasar reflection: mengenal tipe saat runtime',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "reflect"
)

func main() {
    var x interface{} = 42

    t := reflect.TypeOf(x)
    v := reflect.ValueOf(x)

    fmt.Println("tipe :", t)       // int
    fmt.Println("kind :", t.Kind()) // int
    fmt.Println("nilai:", v.Int())  // 42
}`,
      explain: [
        '<code>reflect.TypeOf</code> mengembalikan <code>reflect.Type</code>, mis. <code>int</code> atau <code>main.Pengguna</code>.',
        '<b>Kind</b> adalah kategori tipe dasar (Int, String, Struct, Slice, Ptr, dan seterusnya).',
        '<code>v.Int()</code> mengambil nilai sebagai <code>int64</code>; gunakan <code>Float()</code>, <code>String()</code>, <code>Bool()</code> untuk tipe lain.',
        'Salah memanggil method (mis. <code>Int()</code> pada string) akan membuat program <i>panic</i>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kegunaan reflection yang paling sering terlihat adalah membaca <b>struct tag</b> — teks metadata yang ditulis setelah field. Contoh nyata: tag <code>json:"nama"</code> yang dibaca <code>encoding/json</code> untuk menentukan nama field di JSON. Mari kita tiru cara kerjanya secara sederhana.</p>'
    },
    {
      type: 'example',
      title: 'Membaca struct tag dengan reflection',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "reflect"
)

type Pengguna struct {
    Nama  string ` + "`" + `json:"nama" validasi:"wajib"` + "`" + `
    Umur  int    ` + "`" + `json:"umur"` + "`" + `
    Email string ` + "`" + `json:"email,omitempty"` + "`" + `
}

func main() {
    t := reflect.TypeOf(Pengguna{})

    for i := 0; i < t.NumField(); i++ {
        f := t.Field(i)
        fmt.Printf("%-6s -> json:%q\n", f.Name, f.Tag.Get("json"))
    }
}`,
      explain: [
        '<code>t.NumField()</code> menghitung jumlah field; <code>t.Field(i)</code> mengambil field ke-i.',
        '<code>f.Tag.Get("json")</code> membaca nilai tag bernama <code>json</code>.',
        'Pola inilah yang membuat <code>encoding/json</code> tahu bahwa field <code>Nama</code> harus menjadi key <code>"nama"</code>.',
        'Reflection juga bisa <b>mengubah</b> nilai, tetapi field harus <i>addressable</i> (lewati pointer dan panggil <code>Elem()</code>).'
      ]
    },
    {
      type: 'text',
      html: '<p>Package <b>unsafe</b> memberi akses langsung ke representasi memori: ukuran tipe (<code>unsafe.Sizeof</code>), jarak antar-field (<code>unsafe.Offsetof</code>), dan konversi antar-tipe pointer tanpa pemeriksaan (<code>unsafe.Pointer</code>). Ini tool untuk kasus langka: interop dengan C, manipulasi biner berkinerja tinggi, atau implementasi tipe internal.</p>'
    },
    {
      type: 'example',
      title: 'Melihat tata letak memori',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "unsafe"
)

type Header struct {
    A byte  // 1 byte
    B int64 // 8 byte
    C byte  // 1 byte
}

func main() {
    var h Header
    fmt.Println("ukuran struct :", unsafe.Sizeof(h))          // 24 (padding!)
    fmt.Println("offset A      :", unsafe.Offsetof(h.A))
    fmt.Println("offset B      :", unsafe.Offsetof(h.B))
    fmt.Println("offset C      :", unsafe.Offsetof(h.C))
}`,
      explain: [
        '<b>Padding</b> ditambahkan compiler agar field sejajar (alignment) — itu sebabnya struct bisa lebih besar dari jumlah fieldnya.',
        'Mengurutkan field dari besar ke kecil bisa memangkas ukuran struct.',
        '<code>unsafe.Pointer</code> membolehkan konversi antar-tipe pointer yang biasanya dilarang compiler.',
        'Kode bertanda <code>unsafe</code> tidak dijamin aman antarversi Go maupun arsitektur — pakai hanya bila benar-benar perlu.'
      ]
    },
    {
      type: 'tip',
      title: 'Reflection itu lambat — ukur dulu',
      text: 'Setiap pemanggilan reflection jauh lebih lambat daripada pemanggilan langsung. Hindari reflection di jalur panas (hot path) seperti loop per-request. Solusi umum: lakukan reflection sekali saat inisialisasi, lalu simpan hasilnya (caching).'
    },
    {
      type: 'warn',
      title: 'unsafe melewati keamanan compiler',
      text: 'Dengan <code>unsafe</code> kamu bisa merusak memori, menyebabkan <i>crash</i> yang sulit dilacak, atau menciptakan bug yang bergantung arsitektur. Aturan praktisnya: jangan pakai <code>unsafe</code> kecuali ada alasan kinerja nyata dan sudah terukur.'
    },
    {
      type: 'vocab',
      items: [
        ['Reflection', 'Kemampuan program memeriksa tipe & nilai saat runtime.'],
        ['reflect.TypeOf', 'Mengambil informasi tipe sebuah nilai.'],
        ['reflect.ValueOf', 'Mengambil nilai konkret sebuah variabel.'],
        ['Kind', 'Kategori tipe dasar (Int, Struct, Slice, Ptr, ...).'],
        ['Struct tag', 'Metadata teks pada field struct, mis. json:"nama".'],
        ['unsafe', 'Package untuk operasi level memori di luar jaminan compiler.'],
        ['Padding', 'Celah memori yang disisipkan compiler agar field sejajar.']
      ]
    }
  ],
  recap: [
    'Reflection memungkinkan inspeksi tipe & nilai saat runtime.',
    'reflect.TypeOf dan reflect.ValueOf adalah pintu masuknya.',
    'Struct tag dibaca lewat reflection — dasar kerja encoding/json.',
    'unsafe memberi akses memori langsung dengan risiko besar.',
    'Hindari reflection di jalur panas; ukur sebelum mengoptimalkan.'
  ]
});

/* ---------- Pelajaran 40: Manajemen Memori & Garbage Collector ---------- */
window.GO_LESSONS.push({
  id: 'memory-gc',
  title: 'Manajemen Memori & Garbage Collector',
  chapter: 'Advanced Go Internal & Optimization',
  duration: '12 menit',
  intro: [
    'Go mengelola memori secara otomatis lewat <b>Garbage Collector (GC)</b>. Kita tidak perlu memanggil <code>free()</code>, tetapi tetap perlu memahami <b>di mana</b> data disimpan: <b>stack</b> yang cepat atau <b>heap</b> yang dikelola GC.',
    'Pelajaran ini menjelaskan perbedaan stack vs heap (<i>escape analysis</i>), cara kerja GC, serta trik menekan jumlah alokasi agar program lebih cepat.'
  ],
  objectives: [
    'Memahami perbedaan alokasi stack dan heap',
    'Mengenal escape analysis',
    'Memahami dasar kerja garbage collector',
    'Menekan alokasi dengan strings.Builder, preallocate & sync.Pool'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Variabel lokal yang tidak "kabur" keluar fungsi akan diletakkan di <b>stack</b> — area memori yang dialokasikan & dibebaskan hampir gratis saat fungsi dipanggil dan selesai. Bila sebuah nilai mungkin dipakai setelah fungsinya berakhir (mis. dikembalikan sebagai pointer, atau dimasukkan ke slice global), nilai itu harus dialokasikan di <b>heap</b> dan diserahkan ke GC.</p>'
    },
    {
      type: 'text',
      html: '<p>Keputusan stack vs heap dilakukan compiler lewat <b>escape analysis</b>. Kita bisa melihat hasilnya dengan flag <code>-gcflags=-m</code>. Baris <code>escapes to heap</code> menandakan nilai dipindahkan ke heap.</p>'
    },
    {
      type: 'example',
      title: 'Melihat escape analysis',
      lang: 'bash',
      output: false,
      code: `# Tunjukkan keputusan alokasi saat kompilasi
go build -gcflags="-m" ./...

# Contoh keluaran:
#   ./main.go:10:2: x escapes to heap
#   ./main.go:12:2: y does not escape

# Jalankan ulang agar compiler tidak memakai cache:
go build -gcflags="-m -l" .`,
      explain: [
        '<code>-m</code> meminta compiler melaporkan keputusan escape analysis.',
        '<code>-l</code> mematikan inlining agar laporan lebih jelas.',
        'Mengembalikan pointer ke variabel lokal menyebabkan nilai itu <i>escape</i> ke heap.',
        'Semakin sedikit yang escape, semakin ringan kerja GC.'
      ]
    },
    {
      type: 'example',
      title: 'Kapan nilai naik ke heap',
      lang: 'go',
      output: false,
      code: `package main

type Pengguna struct{ Nama string }

// Mengembalikan nilai (bukan pointer): biasanya tetap di stack.
func buatNilai() Pengguna {
    return Pengguna{Nama: "Andi"}
}

// Mengembalikan pointer ke variabel lokal: nilainya escape ke heap.
func buatPointer() *Pengguna {
    p := Pengguna{Nama: "Budi"}
    return &p // &p harus tetap hidup setelah fungsi selesai
}

func main() {
    _ = buatNilai()
    _ = buatPointer()
}`,
      explain: [
        'Nilai yang dikembalikan sebagai salinan bisa tetap di stack.',
        'Nilai yang alamatnya (<code>&p</code>) keluar dari fungsi harus diletakkan di heap.',
        'Ini bukan aturan kaku — compiler yang memutuskan lewat escape analysis.',
        'Menghindari pointer yang tidak perlu bisa mengurangi tekanan pada GC.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Garbage Collector</b> Go bekerja secara <i>concurrent</i> dan <i>tri-color mark &amp; sweep</i>: GC menandai objek yang masih dijangkau (reachable), lalu membersihkan sisanya. Kita dapat mengaturnya lewat environment variable <b>GOGC</b> (seberapa sering GC berjalan) dan <b>GOMEMLIMIT</b> (batas memori lunak).</p><table class="vocab"><tr><th>Pengaturan</th><th>Arti</th></tr><tr><td><b>GOGC</b></td><td>Target pertumbuhan heap sebelum GC berjalan. Default 100 = GC saat heap dua kali lipat setelah pembersihan terakhir.</td></tr><tr><td><b>GOMEMLIMIT</b></td><td>Batas memori total (soft limit). Bila mendekat, GC dipercepat.</td></tr><tr><td><b>debug.SetGCPercent</b></td><td>Mengubah GOGC saat program berjalan.</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Menyetel GC',
      lang: 'go',
      output: false,
      code: `package main

import (
    "runtime"
    "runtime/debug"
)

func main() {
    // Naikkan ambang GC (GC lebih jarang, memori lebih banyak)
    debug.SetGCPercent(200)

    // Batasi memori total ke 512 MiB (soft limit)
    debug.SetMemoryLimit(512 << 20)

    // Paksa GC sekali (jarang perlu dipakai manual)
    runtime.GC()
}`,
      explain: [
        '<code>SetGCPercent(200)</code> membuat GC berjalan lebih jarang — throughput naik, memori ikut naik.',
        '<code>SetMemoryLimit</code> cocok untuk container agar tidak melewati batas memori.',
        '<code>runtime.GC()</code> memaksa siklus GC penuh; jangan dipakai rutin.',
        'Atur lewat environment (<code>GOGC</code>, <code>GOMEMLIMIT</code>) biasanya lebih mudah daripada di kode.'
      ]
    },
    {
      type: 'text',
      html: '<p>Cara terbaik mengurangi beban GC adalah <b>mengurangi jumlah alokasi</b>, bukan mengutak-atik GC. Beberapa kebiasaan penting: alokasikan slice dengan kapasitas awal (<code>make([]T, 0, n)</code>), gunakan <code>strings.Builder</code> untuk merangkai string, dan pakai <code>sync.Pool</code> untuk objek yang sering dibuat lalu dibuang.</p>'
    },
    {
      type: 'example',
      title: 'Menekan alokasi',
      lang: 'go',
      output: false,
      code: `package main

import (
    "strings"
    "sync"
)

// 1) Preallocate: hindari tumbuh berulang.
func preallocate(n int) []int {
    data := make([]int, 0, n) // kapasitas awal n
    for i := 0; i < n; i++ {
        data = append(data, i)
    }
    return data
}

// 2) strings.Builder: merangkai string tanpa banyak alokasi.
func gabung(kata []string) string {
    var b strings.Builder
    for _, k := range kata {
        b.WriteString(k)
        b.WriteByte(' ')
    }
    return b.String()
}

// 3) sync.Pool: daur ulang buffer sementara.
var bufPool = sync.Pool{
    New: func() any { return make([]byte, 0, 1024) },
}

func pakaiPool() []byte {
    buf := bufPool.Get().([]byte)
    buf = append(buf, "halo"...)
    bufPool.Put(buf[:0]) // kembalikan dengan panjang nol
    return buf
}

func main() {
    _ = preallocate(10)
    _ = gabung([]string{"Go", "itu", "cepat"})
    _ = pakaiPool()
}`,
      explain: [
        '<code>make([]int, 0, n)</code> menyiapkan ruang sekali, sehingga <code>append</code> tidak perlu menyalin berulang.',
        '<code>strings.Builder</code> jauh lebih efisien daripada <code>+</code> berulang di dalam loop.',
        '<code>sync.Pool</code> berguna untuk objek sementara berukuran besar yang sering dipakai-buang.',
        'Sebelum mengoptimalkan, ukur dulu dengan benchmark dan profil memori (bab berikutnya).'
      ]
    },
    {
      type: 'tip',
      title: 'Ukur sebelum menyetel',
      text: 'Jangan menaikkan GOGC atau menambah <code>sync.Pool</code> tanpa data. Ukur dulu dengan <code>go test -bench</code> dan <code>pprof</code>. Optimasi berdasarkan tebakan sering justru memperumit kode.'
    },
    {
      type: 'warn',
      title: 'Jangan simpan pointer ke memori pool',
      text: 'Objek dari <code>sync.Pool</code> boleh "hilang" kapan saja (mis. saat GC). Jangan menyimpan referensi yang bertahan lama ke objek hasil <code>Pool.Get</code>, dan selalu kosongkan isinya sebelum <code>Put</code> agar tidak membocorkan data.'
    },
    {
      type: 'vocab',
      items: [
        ['Stack', 'Area memori cepat untuk data lokal yang tidak keluar fungsi.'],
        ['Heap', 'Area memori yang dikelola garbage collector.'],
        ['Escape analysis', 'Analisis compiler yang menentukan stack vs heap.'],
        ['Garbage Collector', 'Pembersih memori otomatis untuk objek yang tidak lagi dijangkau.'],
        ['GOGC', 'Persentase pertumbuhan heap pemicu GC (default 100).'],
        ['GOMEMLIMIT', 'Batas memori lunak agar GC lebih agresif saat mendekati batas.'],
        ['sync.Pool', 'Wadah daur ulang objek sementara untuk menekan alokasi.']
      ]
    }
  ],
  recap: [
    'Data lokal yang tidak escape disimpan di stack yang cepat.',
    'Nilai yang alamatnya keluar dari fungsi naik ke heap.',
    'GC Go bekerja concurrent dengan algoritma mark & sweep.',
    'Atur GC lewat GOGC dan GOMEMLIMIT bila perlu.',
    'Menekan alokasi (preallocate, strings.Builder, sync.Pool) lebih baik daripada menyetel GC.'
  ]
});

/* ---------- Pelajaran 41: Profiling & Performance Tuning ---------- */
window.GO_LESSONS.push({
  id: 'profiling',
  title: 'Profiling & Performance Tuning (pprof & trace)',
  chapter: 'Advanced Go Internal & Optimization',
  duration: '11 menit',
  intro: [
    'Sebelum mempercepat program, kita harus tahu <b>bagian mana yang lambat</b>. Menebak biasanya salah. Go menyediakan perkakas profiling bawaan yang sangat lengkap lewat package <b>pprof</b> dan <b>runtime/trace</b>.',
    'Pelajaran ini memandu mengambil profil CPU & memori, membacanya, serta mengukur kinerja dengan benchmark.'
  ],
  objectives: [
    'Mengaktifkan pprof pada program Go',
    'Mengambil profil CPU dan memori',
    'Membaca hasil profil dan menemukan hambatan',
    'Menggunakan benchmark dan trace untuk analisis'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>pprof</b> mengambil <i>sampling</i> dari program yang berjalan. Dengan meng-import <code>net/http/pprof</code>, setiap aplikasi HTTP otomatis menyediakan endpoint <code>/debug/pprof/</code> yang bisa diakses browser maupun alat <code>go tool pprof</code>.</p>'
    },
    {
      type: 'example',
      title: 'Menambahkan endpoint pprof ke server',
      lang: 'go',
      output: false,
      code: `package main

import (
    "log"
    "net/http"

    _ "net/http/pprof" // cukup import kosong: mendaftarkan handler otomatis
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("halo"))
    })

    // pprof tersedia di http://localhost:6060/debug/pprof/
    log.Println("server jalan di :6060")
    log.Fatal(http.ListenAndServe(":6060", nil))
}`,
      explain: [
        'Import kosong (<code>_</code>) menjalankan efek samping package: mendaftarkan handler pprof ke DefaultServeMux.',
        'Buka <code>http://localhost:6060/debug/pprof/</code> untuk daftar profil yang tersedia.',
        'Jangan pernah membuka port pprof ke internet publik — itu bisa membocorkan informasi internal.',
        'Untuk layanan produksi, taruh pprof di port internal atau lindungi dengan autentikasi.'
      ]
    },
    {
      type: 'example',
      title: 'Mengambil & membaca profil',
      lang: 'bash',
      output: false,
      code: `# Profil CPU selama 30 detik:
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Profil memori (heap):
go tool pprof http://localhost:6060/debug/pprof/heap

# Di dalam shell pprof:
(pprof) top        # fungsi paling banyak memakai CPU
(pprof) list NamaFungsi   # rincian per baris kode
(pprof) web        # buka grafik di browser (butuh Graphviz)

# Menyimpan ke berkas untuk analisis belakangan:
go tool pprof -http=:8080 cpu.prof`,
      explain: [
        '<code>top</code> menampilkan fungsi dengan konsumsi CPU/memori terbesar.',
        '<code>list</code> menunjukkan baris kode mana yang menghabiskan waktu.',
        'Flag <code>-http</code> membuka antarmuka web lengkap dengan graf & flame graph.',
        'Fokuskan usaha pada fungsi teratas — di situlah perbaikan berdampak besar.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk kode library, cara termudah mengukur kinerja adalah melalui <b>benchmark</b> (<code>go test -bench</code>). Untuk memahami perilaku <i>eksekusi</i> — seperti goroutine yang menunggu, GC, atau penguncian — gunakan <b>runtime/trace</b>.</p>'
    },
    {
      type: 'example',
      title: 'Benchmark dan trace',
      lang: 'go',
      output: false,
      code: `package matematika

import "testing"

// Benchmark: nama fungsi wajib diawali "Benchmark".
// testing.B menjalankan fungsi ini berkali-kali untuk mengukur.
func BenchmarkTambah(b *testing.B) {
    for i := 0; i < b.N; i++ {
        _ = i + i
    }
}`,
      explain: [
        'Setiap <code>BenchmarkXxx(b *testing.B)</code> diukur otomatis oleh framework testing.',
        '<code>b.N</code> adalah jumlah iterasi yang ditentukan framework agar pengukuran stabil.',
        'Jalankan dengan <code>go test -bench=. -benchmem</code> untuk melihat alokasi memori.',
        'Gunakan <code>-benchtime=3s</code> agar pengukuran lebih akurat.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan benchmark & trace',
      lang: 'bash',
      output: false,
      code: `# Jalankan semua benchmark + statistik alokasi:
go test -bench=. -benchmem ./...

# Bandingkan versi sebelum & sesudah optimasi:
go test -bench=. -count=5 > sesudah.txt
go test -bench=. -count=5 -o lama.test -benchmem   # contoh alur

# Analisis trace (lihat goroutine, GC, blocking):
go test -trace trace.out
go tool trace trace.out     # membuka UI di browser

# Profil CPU dari sebuah benchmark:
go test -bench=. -cpuprofile=cpu.prof
go tool pprof -http=:8080 cpu.prof`,
      explain: [
        '<code>-benchmem</code> menampilkan jumlah alokasi (allocs/op) dan byte per operasi — indikator penting.',
        'Gunakan alat seperti <code>benchstat</code> untuk membandingkan dua hasil benchmark secara statistik.',
        '<b>go tool trace</b> memperlihatkan timeline eksekusi: kapan goroutine berjalan, menunggu, atau di-GC.',
        'Profiling mengubah rencana optimasi dari tebakan menjadi keputusan berbasis data.'
      ]
    },
    {
      type: 'tip',
      title: 'Profiling dari test dan contoh kecil',
      text: 'Kamu tidak butuh server untuk memakai pprof. Cukup panggil <code>pprof.StartCPUProfile</code> lalu <code>pprof.StopCPUProfile</code> di dalam <code>TestMain</code>, atau gunakan flag <code>-cpuprofile</code> / <code>-memprofile</code> pada <code>go test</code>.'
    },
    {
      type: 'warn',
      title: 'Jangan optimalkan tanpa pengukuran',
      text: 'Aturan emas: <b>ukur - perbaiki - ukur lagi</b>. Optimasi yang tidak terukur sering menambah kerumitan tanpa manfaat, dan bisa memperlambat bagian lain. Pastikan ada benchmark yang mengunci perbaikanmu.'
    },
    {
      type: 'vocab',
      items: [
        ['pprof', 'Perkakas profiling bawaan Go untuk CPU & memori.'],
        ['CPU profile', 'Sampel penggunaan prosesor untuk menemukan fungsi tersibuk.'],
        ['Heap profile', 'Profil alokasi memori yang masih hidup.'],
        ['Benchmark', 'Fungsi testing.B pengukur kinerja berulang.'],
        ['-benchmem', 'Flag menampilkan statistik alokasi saat benchmark.'],
        ['trace', 'Timeline eksekusi untuk melihat goroutine, GC, dan blocking.'],
        ['Flame graph', 'Visualisasi hirarki pemanggilan berdasarkan konsumsi sumber daya.']
      ]
    }
  ],
  recap: [
    'pprof mengukur CPU dan memori lewat sampling.',
    'Import net/http/pprof menyediakan endpoint /debug/pprof/ pada server HTTP.',
    'go tool pprof top/list/web membantu menemukan dan membaca hambatan.',
    'Benchmark (testing.B) dan -benchmem mengukur kinerja serta alokasi.',
    'go tool trace memperlihatkan perilaku runtime: goroutine, GC, blocking.',
    'Selalu ukur sebelum dan sesudah optimasi.'
  ]
});

/* ---------- Pelajaran 42: Generics di Go ---------- */
window.GO_LESSONS.push({
  id: 'generics',
  title: 'Generics (Go 1.18+)',
  chapter: 'Advanced Go Internal & Optimization',
  duration: '12 menit',
  intro: [
    'Sebelum Go 1.18, menulis fungsi yang bekerja untuk banyak tipe berarti menyalin kode atau memakai <code>interface{}</code> plus type assertion. Sejak <b>Go 1.18</b>, kita punya <b>generics</b>: tipe parameter yang membuat satu fungsi/tipe bekerja untuk berbagai tipe secara aman.',
    'Pelajaran ini mengenalkan sintaks generics, constraint, dan kapan sebaiknya dipakai -atau justru dihindari.'
  ],
  objectives: [
    'Memahami type parameter & parameter tipe',
    'Menulis fungsi generik sederhana',
    'Mengenal constraint: comparable, ordered, tilde (~)',
    'Membuat tipe generik seperti stack'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Fungsi generik menambahkan <b>type parameter</b> di dalam tanda kurung siku setelah nama fungsi. Type parameter itu bisa dipakai sebagai tipe argumen maupun nilai kembali. Ditulis <code>[T any]</code> yang berarti "untuk sembarang tipe T".</p>'
    },
    {
      type: 'example',
      title: 'Fungsi generik pertama',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// [T any] = parameter tipe bernama T yang menerima tipe apa pun.
func Cetak[T any](nilai T) {
    fmt.Printf("%v (%T)\n", nilai, nilai)
}

// Mengembalikan dua nilai dalam urutan terbalik, untuk tipe apa pun.
func Tukar[A, B any](a A, b B) (B, A) {
    return b, a
}

func main() {
    Cetak(42)          // int
    Cetak("halo")      // string
    Cetak(true)        // bool

    x, y := Tukar(1, "satu")
    fmt.Println(x, y)  // satu 1
}`,
      explain: [
        '<code>[T any]</code> mendeklarasikan satu type parameter bernama <code>T</code>.',
        'Saat dipanggil, compiler menyimpulkan tipe (type inference) sehingga kita tak perlu menulis <code>Cetak[int](42)</code>.',
        'Bisa ada lebih dari satu type parameter: <code>[A, B any]</code>.',
        '<code>any</code> adalah alias <code>interface{}</code> — batasan paling longgar.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Constraint</b> membatasi tipe apa saja yang boleh dipakai pada type parameter. <code>any</code> menerima semua tipe, tetapi bila fungsi perlu membandingkan (<code><</code>, <code>></code>) atau menjumlahkan, kita butuh constraint lebih ketat. Standard library menyediakan <code>constraints</code> (dulu di <code>golang.org/x/exp/constraints</code>) dan kita bisa menulis sendiri lewat <b>interface union</b>.</p>'
    },
    {
      type: 'example',
      title: 'Constraint & operator',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// Tanda ~ berarti "tipe dasar apa pun yang underlying-nya int atau float64".
// Ini membuat tipe buatan sendiri seperti type Suhu float64 ikut diterima.
type Angka interface {
    ~int | ~int64 | ~float64
}

func Jumlah[T Angka](data []T) T {
    var total T
    for _, v := range data {
        total += v
    }
    return total
}

func Maks[T Angka](a, b T) T {
    if a > b {
        return a
    }
    return b
}

func main() {
    fmt.Println(Jumlah([]int{1, 2, 3}))       // 6
    fmt.Println(Jumlah([]float64{1.5, 2.5}))  // 4
    fmt.Println(Maks(10, 7))                  // 10

    type Suhu float64
    fmt.Println(Jumlah([]Suhu{20.5, 21.5}))   // 42 (tanpa ~ tidak diizinkan)
}`,
      explain: [
        'Constraint ditulis sebagai interface dengan daftar tipe dipisah tanda <code>|</code>.',
        '<code>~int</code> memasukkan semua tipe yang <i>underlying</i>-nya int.',
        'Constraint menentukan operator apa yang boleh dipakai: <code>Angka</code> mengizinkan <code>+=</code> dan <code>></code>.',
        '<code>comparable</code> adalah constraint bawaan untuk tipe yang bisa dibandingkan <code>==</code> / <code>!=</code>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Type parameter juga bisa dipakai pada <b>tipe</b>, bukan hanya fungsi. Ini memungkinkan struktur data generik seperti stack, queue, atau himpunan yang aman tipe tanpa menulis ulang untuk setiap elemen.</p>'
    },
    {
      type: 'example',
      title: 'Tipe generik: Stack',
      lang: 'go',
      output: false,
      code: `package main

import (
    "errors"
    "fmt"
)

type Stack[T any] struct {
    data []T
}

func (s *Stack[T]) Push(v T) {
    s.data = append(s.data, v)
}

func (s *Stack[T]) Pop() (T, error) {
    var kosong T
    if len(s.data) == 0 {
        return kosong, errors.New("stack kosong")
    }
    v := s.data[len(s.data)-1]
    s.data = s.data[:len(s.data)-1]
    return v, nil
}

func main() {
    angka := Stack[int]{}
    angka.Push(1)
    angka.Push(2)

    v, _ := angka.Pop()
    fmt.Println(v) // 2

    teks := Stack[string]{} // tipe berbeda, kode sama
    teks.Push("halo")
}`,
      explain: [
        '<code>Stack[T any]</code> mendefinisikan tipe generik dengan satu parameter.',
        'Setter-method memakai receiver <code>*Stack[T]</code> agar tipe parameter tetap terbawa.',
        'Pengguna memilih tipe konkret saat membuat: <code>Stack[int]{}</code>, <code>Stack[string]{}</code>.',
        'Tipe generik memberi keamanan tipe yang tidak dimiliki pendekatan <code>[]interface{}</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai dari yang sederhana',
      text: 'Generics bukan pengganti antarmuka (interface). Bila tipe-tipe berbagi <i>perilaku</i> (method), pakai interface. Pakai generics saat kode benar-benar sama untuk banyak tipe dan kamu ingin menghindari duplikasi atau type assertion.'
    },
    {
      type: 'warn',
      title: 'Jangan memaksakan generics ke mana-mana',
      text: 'Generics menambah kerumitan dan bisa memperlambat kompilasi. Bila fungsimu hanya dipakai satu tipe, tulis saja versi konkret. Utamakan keterbacaan: kode generik yang sulit dibaca bukanlah perbaikan.'
    },
    {
      type: 'vocab',
      items: [
        ['Generics', 'Kemampuan menulis kode yang bekerja untuk banyak tipe (Go 1.18+).'],
        ['Type parameter', 'Parameter yang mewakili sebuah tipe, mis. [T any].'],
        ['Type inference', 'Compiler menyimpulkan tipe parameter dari argumen.'],
        ['Constraint', 'Batasan tipe yang boleh dipakai pada type parameter.'],
        ['comparable', 'Constraint untuk tipe yang mendukung == dan !=.'],
        ['Tilde (~)', 'Menandakan semua tipe dengan underlying type tertentu.'],
        ['Instansiasi', 'Menentukan tipe konkret, mis. Stack[int]{}.'],
        ['Antarmuka (interface)', 'Kontrak perilaku — alternatif generics saat tipe berbagi method.']
      ]
    }
  ],
  recap: [
    'Generics memungkinkan satu kode bekerja untuk banyak tipe dengan aman.',
    'Type parameter ditulis dalam kurung siku: [T any].',
    'Constraint membatasi tipe dan menentukan operator yang boleh dipakai.',
    '~ mencakup tipe dengan underlying type tertentu; comparable untuk ==.',
    'Tipe generik (mis. Stack[T]) memberi struktur data yang aman tipe.',
    'Pakai generics saat perlu; pilih interface bila fokusnya perilaku.'
  ]
});
