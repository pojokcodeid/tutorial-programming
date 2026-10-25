/* ============================================================
   Pelajaran Go — Bab 10: Concurrency
   (topik info.md:
    Dasar:
    - "Konsep Asynchronous & Parallelism"
    - "Goroutines: Menjalankan fungsi secara eksekusi concurrent (go keyword)"
    - "Channels: Send, receive, buffered vs unbuffered channel"
    - "Select Statement: Menerima data dari banyak channel"
    Lanjutan & Sync Package:
    - "sync.WaitGroup untuk sinkronisasi Goroutine"
    - "sync.Mutex & sync.RWMutex untuk mencegah Race Condition"
    - "sync.Once & sync.Map"
    - "Menggunakan tools detector: go run -race"
    - "Context Package (context): Timeout, Cancellation, dan Passing Values")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 23: Goroutines ---------- */
window.GO_LESSONS.push({
  id: 'goroutines',
  title: 'Concurrency & Goroutines',
  chapter: 'Concurrency',
  duration: '11 menit',
  intro: [
    'Salah satu keunggulan terbesar Go adalah menjalankan banyak tugas <b>bersamaan</b> dengan mudah. Alat utamanya adalah <b>goroutine</b> — fungsi ringan yang berjalan secara <i>concurrent</i>.',
    'Pelajaran ini menjelaskan perbedaan concurrency dan parallelism, cara membuat goroutine dengan kata kunci <code>go</code>, serta bahaya yang harus diwaspadai.'
  ],
  objectives: [
    'Membedakan concurrency dan parallelism',
    'Menjalankan fungsi sebagai goroutine dengan go',
    'Memahami mengapa program bisa selesai sebelum goroutine usai',
    'Mengenal bahaya race condition pada goroutine'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Dua istilah ini sering tertukar:</p><ul><li><b>Concurrency</b> — <i>menangani</i> banyak tugas dengan mengatur giliran agar semuanya berjalan. Seperti satu koki yang memasak beberapa hidangan dengan cerdas: menumis sambil merebus.</li><li><b>Parallelism</b> — <i>menjalankan</i> beberapa tugas benar-benar pada saat yang sama. Seperti beberapa koki bekerja serentak.</li></ul><p>Go dirancang untuk concurrency yang elegan, dan otomatis memanfaatkan banyak inti CPU (parallelism) bila tersedia.</p>'
    },
    {
      type: 'example',
      title: 'Goroutine pertama',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "time"
)

func tugas(nama string) {
    for i := 1; i <= 3; i++ {
        fmt.Println(nama, "-> langkah", i)
        time.Sleep(100 * time.Millisecond)
    }
}

func main() {
    // Jalankan sebagai goroutine dengan kata kunci "go"
    go tugas("A")
    go tugas("B")

    // Beri waktu agar goroutine menyelesaikan pekerjaannya.
    // Nanti kita ganti dengan sync.WaitGroup yang lebih rapi.
    time.Sleep(time.Second)
    fmt.Println("selesai")
}`,
      explain: [
        'Kata kunci <code>go</code> menjalankan fungsi <b>tanpa menunggu</b> — program lanjut ke baris berikutnya.',
        'Tugas A dan B berjalan bergantian (concurrent), terlihat dari keluarannya yang berselang-seling.',
        '<code>time.Sleep</code> memberi jeda agar main tidak langsung berakhir sebelum goroutine selesai.',
        'Setiap goroutine sangat ringan — bisa membuat ribuan tanpa masalah.'
      ]
    },
    {
      type: 'text',
      html: '<p>Masalah penting: ketika <code>main()</code> selesai, <b>seluruh program berhenti</b> — termasuk goroutine yang belum selesai. Karena itu kita butuh cara menunggu goroutine, yang akan dibahas pada <code>sync.WaitGroup</code> dan channel.</p>'
    },
    {
      type: 'example',
      title: 'Bahaya race condition',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "sync"
)

func main() {
    counter := 0
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++   // RACE CONDITION: 1000 goroutine menulis bersamaan!
        }()
    }
    wg.Wait()
    fmt.Println("counter =", counter)   // hasilnya tidak pasti, sering < 1000
}`,
      explain: [
        '<b>Race condition</b> terjadi ketika beberapa goroutine mengakses data yang sama tanpa sinkronisasi.',
        '<code>counter++</code> sebenarnya tiga langkah (baca, tambah, tulis) yang bisa saling menimpa.',
        'Hasilnya tidak dapat diprediksi dan berbeda-beda setiap dijalankan.',
        'Solusinya adalah Mutex atau channel — dibahas di pelajaran berikutnya.'
      ]
    },
    {
      type: 'tip',
      title: 'Goroutine bukan thread',
      text: 'Goroutine jauh lebih ringan daripada thread sistem operasi. Ratusan ribu goroutine bisa hidup di satu program, sedangkan thread biasanya hanya ribuan. Go mengelola goroutine di atas sejumlah kecil thread lewat <i>scheduler</i>-nya.'
    },
    {
      type: 'warn',
      title: 'Akses data bersama perlu sinkronisasi',
      text: 'Aturan emas: bila dua goroutine mengakses variabel yang sama dan minimal satu menulis, kamu <b>wajib</b> menyinkronisasi aksesnya. Abaikan ini dan kamu mendapat bug misterius yang sulit ditemukan.'
    },
    {
      type: 'vocab',
      items: [
        ['Concurrency', 'Menangani banyak tugas dengan mengatur giliran.'],
        ['Parallelism', 'Menjalankan banyak tugas benar-benar serentak di beberapa inti CPU.'],
        ['Goroutine', 'Fungsi ringan yang berjalan concurrent, dibuat dengan kata kunci go.'],
        ['Race condition', 'Bug akibat akses data bersama tanpa sinkronisasi.'],
        ['Scheduler', 'Komponen runtime Go yang membagi goroutine ke thread.'],
        ['time.Sleep', 'Menjeda eksekusi; sering dipakai contoh, bukan sinkronisasi sebenarnya.']
      ]
    }
  ],
  recap: [
    'Concurrency menangani banyak tugas bergiliran; parallelism menjalankannya serentak.',
    'Goroutine dibuat dengan kata kunci go dan sangat ringan.',
    'Bila main selesai, semua goroutine dihentikan paksa.',
    'Akses data bersama tanpa sinkronisasi menyebabkan race condition.',
    'Gunakan WaitGroup atau channel untuk menunggu dan menyinkronkan goroutine.'
  ]
});

/* ---------- Pelajaran 24: Channels & Select ---------- */
window.GO_LESSONS.push({
  id: 'channels-select',
  title: 'Channels & Select Statement',
  chapter: 'Concurrency',
  duration: '13 menit',
  intro: [
    'Goroutine saling berkomunikasi lewat <b>channel</b> — saluran tempat mengirim dan menerima nilai. Filsafat Go berbunyi: "jangan berkomunikasi dengan berbagi memori; berbagilah memori dengan berkomunikasi."',
    'Pelajaran ini membahas channel tanpa buffer dan ber-buffer, arah pengiriman/penerimaan, menutup channel, serta <b>select</b> untuk menunggu banyak channel sekaligus.'
  ],
  objectives: [
    'Membuat channel dan mengirim/menerima nilai',
    'Membedakan unbuffered dan buffered channel',
    'Menutup channel dan mengiterasinya',
    'Memakai select untuk menangani banyak channel'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Channel dibuat dengan <code>make(chan Tipe)</code>. Operator <code><-</code> dipakai untuk mengirim dan menerima: <code>ch <- nilai</code> (kirim) dan <code>nilai := <-ch</code> (terima). Channel bersifat <b>blocking</b> — pengiriman menunggu sampai ada yang menerima, dan sebaliknya.</p>'
    },
    {
      type: 'example',
      title: 'Channel sederhana',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func kirimPesan(ch chan string) {
    ch <- "halo dari goroutine"   // kirim
}

func main() {
    ch := make(chan string)

    go kirimPesan(ch)

    pesan := <-ch                 // terima (menunggu sampai ada isi)
    fmt.Println(pesan)

    // Channel juga bisa dipakai mengumpulkan hasil
    hasil := make(chan int)
    go func() { hasil <- 21 * 2 }()
    fmt.Println("hasil:", <-hasil)
}`,
      explain: [
        '<code>make(chan string)</code> membuat channel untuk tipe string.',
        '<code>ch <- "..."</code> mengirim nilai; <code><-ch</code> menerimanya.',
        'Pengiriman memblokir sampai ada penerima; inilah yang menyinkronkan goroutine.',
        'Channel adalah cara idiomatik bertukar data antargoroutine.'
      ]
    },
    {
      type: 'example',
      title: 'Unbuffered vs buffered channel',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

func main() {
    // Unbuffered: pengiriman menunggu penerima
    takBuffered := make(chan int)
    go func() { takBuffered <- 1 }()
    fmt.Println(<-takBuffered)   // 1

    // Buffered: bisa menyimpan nilai tanpa penerima langsung
    buffered := make(chan int, 3)
    buffered <- 10
    buffered <- 20
    buffered <- 30
    // buffered <- 40   // akan BLOK bila kapasitas penuh
    close(buffered)

    for v := range buffered {
        fmt.Println("buffered:", v)
    }
}`,
      explain: [
        '<b>Unbuffered</b> (tanpa kapasitas) menyinkronkan pengirim dan penerima secara ketat.',
        '<b>Buffered</b> <code>make(chan int, 3)</code> menyimpan hingga 3 nilai sebelum pengiriman memblok.',
        '<code>close(ch)</code> menandakan tidak ada lagi nilai yang akan dikirim.',
        '<code>for v := range ch</code> menerima sampai channel ditutup.'
      ]
    },
    {
      type: 'example',
      title: 'Arah channel (send-only / receive-only)',
      lang: 'go',
      output: false,
      code: `package main

import "fmt"

// ch hanya boleh DIKIRIM di dalam fungsi ini
func hanyaKirim(ch chan<- int) {
    for i := 1; i <= 3; i++ {
        ch <- i * 10
    }
    close(ch)
}

// ch hanya boleh DITERIMA di dalam fungsi ini
func hanyaTerima(ch <-chan int) {
    for v := range ch {
        fmt.Println("terima:", v)
    }
}

func main() {
    ch := make(chan int)
    go hanyaKirim(ch)
    hanyaTerima(ch)
}`,
      explain: [
        '<code>chan<- int</code> artinya channel hanya untuk mengirim.',
        '<code><-chan int</code> artinya channel hanya untuk menerima.',
        'Batasan arah ini mencegah kesalahan dan mendokumentasikan maksud fungsi.',
        'Fungsi yang mengirim biasanya yang menutup channel (<code>close</code>).'
      ]
    },
    {
      type: 'text', // select
      html: '<p><b>select</b> mirip <code>switch</code>, tetapi untuk channel. Ia menunggu beberapa operasi channel dan menjalankan <b>case pertama yang siap</b>. Bila tidak ada yang siap dan ada <code>default</code>, blok default dijalankan — berguna untuk polling tanpa memblokir.</p>'
    },
    {
      type: 'example',
      title: 'Select dengan banyak channel',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "time"
)

func main() {
    cepat := make(chan string)
    lambat := make(chan string)

    go func() {
        time.Sleep(100 * time.Millisecond)
        cepat <- "data cepat"
    }()
    go func() {
        time.Sleep(300 * time.Millisecond)
        lambat <- "data lambat"
    }()

    for i := 0; i < 2; i++ {
        select {
        case msg := <-cepat:
            fmt.Println("diterima:", msg)
        case msg := <-lambat:
            fmt.Println("diterima:", msg)
        }
    }
}`,
      explain: [
        'select menunggu case mana pun yang siap lebih dulu.',
        'Contoh di atas mencetak "data cepat" lalu "data lambat" sesuai waktu kedatangan.',
        'select sangat berguna untuk timeout dan pembatalan.',
        'Bila ada beberapa case siap sekaligus, salah satunya dipilih secara acak.'
      ]
    },
    {
      type: 'example',
      title: 'Select untuk timeout',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "time"
)

func main() {
    hasil := make(chan string)

    go func() {
        time.Sleep(2 * time.Second)
        hasil <- "selesai dihitung"
    }()

    select {
    case v := <-hasil:
        fmt.Println("sukses:", v)
    case <-time.After(1 * time.Second):
        fmt.Println("timeout! operasi terlalu lama")
    }
}`,
      explain: [
        '<code>time.After(d)</code> menghasilkan channel yang mengirim setelah durasi d.',
        'Bila hasil datang lebih dulu, case pertama menang; bila tidak, timeout berjalan.',
        'Pola ini adalah cara standar memberi batas waktu pada operasi.',
        'Context (pelajaran berikutnya) menyederhanakan pola timeout & pembatalan.'
      ]
    },
    {
      type: 'tip',
      title: 'Jangan kirim ke channel yang sudah ditutup',
      text: 'Mengirim ke channel yang sudah ditutup menyebabkan panic. Hanya <b>pengirim</b> yang boleh menutup channel. Sebagai penerima, gunakan bentuk <code>v, ok := <-ch</code> — <code>ok</code> bernilai false bila channel sudah ditutup dan kosong.'
    },
    {
      type: 'warn',
      title: 'Deadlock',
      text: 'Deadlock terjadi ketika semua goroutine saling menunggu dan tidak ada yang bisa maju — mis. mengirim ke unbuffered channel tanpa penerima, atau menunggu channel yang tak pernah diisi. Pesan error Go akan berbunyi <i>all goroutines are asleep - deadlock!</i>.'
    },
    {
      type: 'vocab',
      items: [
        ['Channel', 'Saluran komunikasi antargoroutine untuk mengirim/menerima nilai.'],
        ['Unbuffered', 'Channel tanpa kapasitas; pengirim menunggu penerima.'],
        ['Buffered', 'Channel dengan kapasitas penyimpanan sementara.'],
        ['close', 'Menutup channel; menandakan tidak ada pengiriman lagi.'],
        ['select', 'Memilih case channel yang siap dijalankan.'],
        ['Deadlock', 'Kondisi semua goroutine saling menunggu tanpa kemajuan.'],
        ['time.After', 'Channel yang mengirim setelah durasi tertentu (untuk timeout).']
      ]
    }
  ],
  recap: [
    'Channel adalah cara aman bertukar data antargoroutine.',
    'Channel tanpa buffer menyinkronkan pengirim & penerima; buffered menyimpan sementara.',
    'close menandakan akhir pengiriman; hanya pengirim yang menutup channel.',
    'select memilih case channel yang siap, termasuk timeout via time.After.',
    'Deadlock terjadi bila goroutine saling menunggu tanpa kemajuan.'
  ]
});

/* ---------- Pelajaran 25: Sinkronisasi, Race Detector & Context ---------- */
window.GO_LESSONS.push({
  id: 'sync-context',
  title: 'sync Package, Race Detector & Context',
  chapter: 'Concurrency',
  duration: '13 menit',
  intro: [
    'Selain channel, Go menyediakan package <b>sync</b> untuk sinkronisasi: menunggu goroutine selesai, melindungi data bersama, dan menjalankan sesuatu sekali saja.',
    'Pelajaran ini juga membahas alat pendeteksi race condition serta package <b>context</b> untuk timeout, pembatalan, dan meneruskan nilai.'
  ],
  objectives: [
    'Menunggu goroutine dengan sync.WaitGroup',
    'Melindungi data dengan sync.Mutex dan RWMutex',
    'Memakai sync.Once dan sync.Map',
    'Menjalankan race detector dan memakai context'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>sync.WaitGroup</b> adalah cara rapi menunggu sekumpulan goroutine selesai. Polanya: panggil <code>Add(1)</code> sebelum memulai goroutine, <code>Done()</code> di akhir goroutine, dan <code>Wait()</code> untuk menunggu semua selesai.</p>'
    },
    {
      type: 'example',
      title: 'sync.WaitGroup',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "sync"
)

func main() {
    var wg sync.WaitGroup

    for i := 1; i <= 3; i++ {
        wg.Add(1)             // naikkan hitungan SEBELUM goroutine
        go func(n int) {
            defer wg.Done()   // turunkan saat selesai
            fmt.Println("pekerja", n, "selesai")
        }(i)
    }

    wg.Wait()                 // tunggu sampai hitungan kembali 0
    fmt.Println("semua selesai")
}`,
      explain: [
        '<code>wg.Add(1)</code> memberi tahu ada satu goroutine yang harus ditunggu.',
        '<code>defer wg.Done()</code> mengurangi hitungan walau terjadi error/panic.',
        '<code>wg.Wait()</code> memblok sampai semua Done dipanggil.',
        'Perhatikan: nilai <code>i</code> dikirim sebagai argumen agar tiap goroutine mendapat nilainya sendiri.'
      ]
    },
    {
      type: 'text', // mutex
      html: '<p><b>sync.Mutex</b> (mutual exclusion) menjaga agar hanya satu goroutine mengakses data kritis pada satu waktu. Kunci sebelum mengakses, buka setelah selesai. <b>sync.RWMutex</b> lebih longgar: banyak pembaca boleh bersamaan, tetapi penulis tetap eksklusif.</p>'
    },
    {
      type: 'example',
      title: 'Mutex memperbaiki race condition',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "sync"
)

type Counter struct {
    mu    sync.Mutex
    nilai int
}

func (c *Counter) Tambah() {
    c.mu.Lock()         // kunci
    defer c.mu.Unlock() // pastikan selalu dibuka
    c.nilai++
}

func (c *Counter) Nilai() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.nilai
}

func main() {
    c := &Counter{}
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            c.Tambah()
        }()
    }
    wg.Wait()
    fmt.Println("counter =", c.Nilai())   // 1000 (benar!)
}`,
      explain: [
        '<code>Lock()</code> dan <code>Unlock()</code> membungkus akses ke <code>nilai</code>.',
        '<code>defer c.mu.Unlock()</code> memastikan kunci selalu dibuka.',
        'Sekarang 1000 goroutine menambah dengan aman — hasilnya pasti 1000.',
        'Mutex sebaiknya menjadi bagian dari struct (bukan variabel global) agar terkait erat dengan data yang dilindungi.'
      ]
    },
    {
      type: 'example',
      title: 'sync.RWMutex untuk banyak pembaca',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "sync"
)

type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Set(k, v string) {
    c.mu.Lock()          // penulis: eksklusif
    defer c.mu.Unlock()
    c.data[k] = v
}

func (c *Cache) Get(k string) string {
    c.mu.RLock()         // pembaca: boleh bersamaan
    defer c.mu.RUnlock()
    return c.data[k]
}

func main() {
    c := &Cache{data: map[string]string{}}
    c.Set("nama", "Andi")
    fmt.Println(c.Get("nama"))
}`,
      explain: [
        '<code>Lock/Unlock</code> untuk operasi tulis.',
        '<code>RLock/RUnlock</code> untuk operasi baca — banyak pembaca boleh masuk sekaligus.',
        'RWMutex cocok bila pembacaan jauh lebih sering daripada penulisan.',
        'Jangan campur Lock dengan RUnlock — pasangkan dengan benar.'
      ]
    },
    {
      type: 'example',
      title: 'sync.Once & sync.Map',
      lang: 'go',
      output: false,
      code: `package main

import (
    "fmt"
    "sync"
)

var (
    sekali sync.Once
    m      sync.Map
)

func inisialisasi() {
    fmt.Println("inisialisasi dijalankan sekali saja")
}

func main() {
    // sync.Once memastikan fungsi hanya dijalankan sekali
    for i := 0; i < 3; i++ {
        sekali.Do(inisialisasi)
    }

    // sync.Map aman dipakai dari banyak goroutine
    m.Store("nama", "Andi")
    m.Store("kota", "Bandung")
    if v, ok := m.Load("nama"); ok {
        fmt.Println("nama:", v)
    }
    m.Range(func(k, v any) bool {
        fmt.Println(k, "=", v)
        return true
    })
}`,
      explain: [
        '<code>sync.Once.Do(f)</code> menjalankan <code>f</code> tepat sekali, walau dipanggil berkali-kali atau dari banyak goroutine.',
        'Berguna untuk inisialisasi singleton (mis. koneksi database).',
        '<code>sync.Map</code> menyediakan Store/Load/Range yang aman untuk akses bersamaan.',
        'Untuk sebagian besar kebutuhan, peta biasa + Mutex sudah cukup; sync.Map khusus untuk pola akses tertentu.'
      ]
    },
    {
      type: 'text', // race detector & context
      html: '<p><b>Race detector</b> adalah alat untuk menemukan race condition. Jalankan program atau uji dengan tanda <code>-race</code>. Selain itu, package <b>context</b> membawa sinyal pembatalan, batas waktu, dan nilai antar-goroutine.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan race detector',
      lang: 'bash',
      output: false,
      code: `# Jalankan program dengan pendeteksi race
go run -race main.go

# Jalankan tes dengan pendeteksi race
go test -race ./...

# Bila ditemukan race, Go akan mencetak lokasi
# baca & tulis yang bentrok beserta goroutine-nya.`,
      explain: [
        '<code>-race</code> menambahkan pelacakan yang mendeteksi akses data tak tersinkronisasi.',
        'Bila ada race, Go menampilkan dua lokasi yang saling bertentangan (satu baca, satu tulis).',
        'Biasakan menjalankan tes dengan <code>-race</code> sebelum merilis kode.',
        'Program dengan -race berjalan lebih lambat — ini normal, hanya untuk pengujian.'
      ]
    },
    {
      type: 'example',
      title: 'Context: timeout & pembatalan',
      lang: 'go',
      output: false,
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

func kerjaLama(ctx context.Context) (string, error) {
    select {
    case <-time.After(3 * time.Second):
        return "selesai", nil
    case <-ctx.Done():          // dibatalkan / timeout
        return "", ctx.Err()
    }
}

func main() {
    // Batas waktu 1 detik
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()              // selalu panggil cancel agar sumber daya bebas

    hasil, err := kerjaLama(ctx)
    if err != nil {
        fmt.Println("gagal:", err)   // context deadline exceeded
        return
    }
    fmt.Println(hasil)
}`,
      explain: [
        '<code>context.WithTimeout</code> membuat context yang otomatis membatalkan setelah durasi.',
        '<code>ctx.Done()</code> adalah channel yang tertutup saat context dibatalkan.',
        '<code>ctx.Err()</code> memberi tahu penyebabnya (timeout atau cancel).',
        '<code>defer cancel()</code> wajib dipanggil agar tidak terjadi kebocoran sumber daya.'
      ]
    },
    {
      type: 'tip',
      title: 'Context juga untuk meneruskan nilai',
      text: 'Selain pembatalan, context bisa membawa nilai dengan <code>context.WithValue</code> (mis. ID permintaan atau token pengguna). Gunakan hanya untuk data yang benar-benar melewati batas API/goroutine — jangan jadikan keranjang semua variabel.'
    },
    {
      type: 'warn',
      title: 'Jangan simpan context di dalam struct',
      text: 'Context sebaiknya diteruskan sebagai parameter pertama fungsi (<code>func F(ctx context.Context, ...)</code>), bukan disimpan dalam field struct. Konvensi ini memudahkan pelacakan dan pengujian.'
    },
    {
      type: 'vocab',
      items: [
        ['sync.WaitGroup', 'Menunggu sekumpulan goroutine selesai.'],
        ['sync.Mutex', 'Mengunci akses data agar hanya satu goroutine pada satu waktu.'],
        ['sync.RWMutex', 'Mutex yang membolehkan banyak pembaca bersamaan.'],
        ['sync.Once', 'Menjalankan fungsi tepat satu kali.'],
        ['sync.Map', 'Map yang aman dipakai dari banyak goroutine.'],
        ['Race detector', 'Alat (go run -race) untuk menemukan race condition.'],
        ['context.Context', 'Membawa pembatalan, batas waktu, dan nilai antar-goroutine.']
      ]
    }
  ],
  recap: [
    'WaitGroup menunggu goroutine: Add sebelum, Done di akhir, Wait untuk menunggu.',
    'Mutex melindungi data bersama; RWMutex mengizinkan banyak pembaca.',
    'sync.Once menjalankan inisialisasi sekali; sync.Map aman untuk goroutine.',
    'Jalankan go run -race / go test -race untuk menemukan race condition.',
    'Context menangani timeout & pembatalan; teruskan sebagai parameter, bukan field struct.'
  ]
});
