/* ============================================================
   Pelajaran Microservices — Bab 2: Go untuk Backend
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'golang-untuk-backend',
  title: 'Go untuk Backend: Tipe, Error, Concurrency, dan Context',
  chapter: 'Fondasi Backend',
  duration: '12–14 menit',
  intro: [
    'Go dipilih untuk materi microservices ini bukan karena sedang populer, melainkan karena bahasanya terasa lahir untuk pekerjaan itu: satu bahasa untuk compiler, formatter, tester, dan dependency manager; binary hasil build langsung berjalan tanpa perlu memasang runtime besar di container.',
    'Materi Go tersendiri di aplikasi ini sudah membahas variabel, slice, map, pointer, method, dan encoding JSON secara penuh. Bab ini berbeda sudut pandangnya: kita hanya mengambil bagian yang benar-benar dipakai sehari-hari saat membangun microservices — struct, interface kecil, error wrapping, goroutine dan channel, context dengan timeout, serta unit test table-driven. Contoh sepanjang bab memakai tatanan sistem OMS: <code>catalog-service</code> menyimpan produk, sementara <code>order-service</code> memanggilnya lewat HTTP untuk memvalidasi produk sebelum pesanan dibuat.'
  ],
  objectives: [
    'Menjelaskan alasan Go cocok untuk microservices: binary statis, startup cepat, goroutine murah',
    'Menulis struct dan interface kecil yang idiomatik di Go',
    'Menangani dan membungkus error dengan %w, errors.Is, dan errors.As',
    'Menggunakan goroutine, channel, dan sync.WaitGroup tanpa memicu race maupun kebocoran',
    'Menerapkan context cancellation dan timeout pada panggilan ke service lain',
    'Menulis unit test table-driven dan menjalankan gofmt serta go vet'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Go untuk Microservices</h3><ul><li><b>Binary statis</b> — hasil <code>go build</code> adalah satu berkas executable; container image bisa distempel dari <code>scratch</code> atau <code>distroless</code>, jadi jauh lebih kecil dan minim celah keamanan.</li><li><b>Startup cepat</b> — proses siap menerima trafik dalam puluhan milidetik; penting untuk autoscaling, rolling update, dan graceful shutdown.</li><li><b>Goroutine murah</b> — ribuan goroutine berjalan dengan tumpukan awal hanya 2 KB, sehingga menangani banyak koneksi I/O tidak menuntut desain event-loop yang rumit.</li><li><b>Toolchain lengkap</b> — compiler ketat, formatter seragam (<code>gofmt</code>), penganalisis statis (<code>go vet</code>), dan pengujian bawaan, semuanya tanpa konfigurasi.</li><li><b>Bahasa yang kecil</b> — tim baru cepat produktif dan gaya kode antar tim relatif seragam.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Struct Produk dan Dua Interface Kecil',
      lang: 'go',
      output: false,
      code: `type Product struct {
    ID    string \`json:"id"\`
    Name  string \`json:"name"\`
    Price int64  \`json:"price"\` // rupiah bulat, tanpa koma desimal
    Stock int    \`json:"stock"\`
}
// Cukup dua method. Interface besar justru menyulitkan implementasi pengganti.
type ProductStore interface {
    FindByID(ctx context.Context, id string) (Product, error)
    Insert(ctx context.Context, p *Product) error
}
type ProductValidator interface {
    Validate(ctx context.Context, productID string, qty int) error
}`,
      explain: [
        'Struct adalah wadah data; tag <code>json:"..."</code> menentukan nama field saat di-encode menjadi JSON — inilah kontrak bentuk respons API kamu. Interface di Go bersifat implisit: sebuah tipe memenuhi interface hanya dengan mengimplementasikan method-methodnya.',
        'Interface satu-dua method lebih mudah dipenuhi repository palsu saat unit test, dibanding interface raksasa berisi dua puluh method; Go menganut prinsip accept interfaces, return structs.',
        'Semua method menerima <code>ctx context.Context</code> sebagai parameter pertama — konvensi wajib di Go, dibahas pada bagian context.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Error Handling — Bungkus dengan Konteks, Jangan Ditelan',
      lang: 'go',
      output: false,
      code: `var ErrProductNotFound = errors.New("produk tidak ditemukan")
// Lapisan repository/service: bungkus dengan konteks, jaga error asli tetap terjangkau
func (s *Service) Get(ctx context.Context, id string) (Product, error) {
    p, err := s.store.FindByID(ctx, id)
    if errors.Is(err, ErrProductNotFound) {
        return Product{}, ErrProductNotFound // diterjemahkan ke 404 di handler
    }
    if err != nil {
        return Product{}, fmt.Errorf("catalog: ambil produk %s: %w", id, err)
    }
    return p, nil
}
// errors.As untuk menelusuri tipe error spesifik, misal saat handler ingin menjawab 422
type ValidationError struct{ Field string }

func (e *ValidationError) Error() string { return "field " + e.Field + " tidak valid" }

var verr *ValidationError
if errors.As(err, &verr) { log.Printf("field bermasalah: %s", verr.Field) }`,
      explain: [
        'Go memperlakukan error sebagai nilai biasa; aturan emasnya: bungkus setiap error dengan konteks memakai <code>fmt.Errorf("...: %w", err)</code> sampai ke titik di mana ia bisa ditangani bermakna. Error yang ditelan tanpa jejak membuat insiden produksi mustahil ditelusuri.',
        '<code>errors.Is</code> membandingkan rantai error terhadap error sentinel; <code>errors.As</code> menyalin error bertipe tertentu ke variabel pointer sehingga field-nya bisa dibaca.',
        'Perhatikan alurnya: error diterjemahkan ke kondisi domain di batas lapisan, tetapi error tak terduga tetap dibungkus dan diteruskan ke atas.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Goroutine, Channel, dan WaitGroup</h3><p><b>Goroutine</b> adalah fungsi yang berjalan terpisah dengan murah; <b>channel</b> adalah saluran aman untuk meneruskan data antar goroutine; <b>sync.WaitGroup</b> menunggu sekelompok goroutine selesai. Pola paling berguna untuk service: <b>worker pool</b> — sejumlah pekerja tetap memproses antrean tugas, agar lonjakan trafik tidak melahirkan ribuan goroutine sekaligus.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Mini Worker Pool',
      lang: 'go',
      output: false,
      code: `type Job struct{ OrderID string }
func RunWorkers(ctx context.Context, jobs []Job, n int,
    handle func(context.Context, Job) error,
) error {
    jobCh := make(chan Job)
    errCh := make(chan error, 1)
    var wg sync.WaitGroup
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() { // pekerja
            defer wg.Done()
            for j := range jobCh {
                if err := handle(ctx, j); err != nil {
                    select { // error pertama disimpan, sisanya dilewati
                    case errCh <- fmt.Errorf("job %s: %w", j.OrderID, err):
                    default:
                    }
                }
            }
        }()
    }
    go func() { // pengirim tugas, berhenti bila ctx dibatalkan
        defer close(jobCh)
        for _, j := range jobs {
            select {
            case jobCh <- j:
            case <-ctx.Done():
                return
            }
        }
    }()
    wg.Wait()
    close(errCh)
    for err := range errCh {
        return err
    }
    return ctx.Err()
}`,
      explain: [
        'Jumlah pekerja tetap (parameter <code>n</code>); tugas menumpuk di channel, bukan di goroutine baru — inilah yang membuat beban tetap terkendali.',
        '<code>select</code> pada <code>ctx.Done()</code> memastikan pengirim tugas berhenti begitu konteks dibatalkan, sehingga worker tidak menunggu selamanya.',
        '<code>errCh</code> dibuat berkapasitas 1 supaya menulis error tidak pernah memblokir pekerja; pesan berikutnya cukup dilewati.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Context: CancellationToken Wajib di Microservices</h3><p><code>context.Context</code> membawa dua hal: <b>batas waktu (deadline)</b> dan <b>sinyal pembatalan (cancel)</b>. Dalam sistem terdistribusi, konteks adalah cara satu request membawa "sisa waktu" miliknya ke service lain. Tanpa itu, satu service downstream yang macet membuat antrean request di upstream ikut menggantung dan akhirnya habis seluruh resource — kegagalan kecil berubah menjadi gangguan luas.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Memanggil catalog-service dengan Timeout',
      lang: 'go',
      output: false,
      code: `func (c *CatalogClient) GetProduct(ctx context.Context, id string) (Product, error) {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second) // batas tegas 2 detik
    defer cancel() // mencegah kebocoran timer bila fungsi selesai lebih awal
    req, err := http.NewRequestWithContext(ctx, http.MethodGet,
        "http://catalog-service:8081/products/"+id, nil)
    if err != nil {
        return Product{}, fmt.Errorf("buat request catalog: %w", err)
    }
    res, err := c.httpClient.Do(req)
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            return Product{}, ErrCatalogTimeout // handler bisa menjawab 504
        }
        return Product{}, fmt.Errorf("panggil catalog-service: %w", err)
    }
    defer res.Body.Close()
    if res.StatusCode == http.StatusNotFound {
        return Product{}, ErrProductNotFound
    }
    if res.StatusCode != http.StatusOK {
        return Product{}, fmt.Errorf("catalog-service menjawab %d", res.StatusCode)
    }
    var p Product
    if err := json.NewDecoder(res.Body).Decode(&p); err != nil {
        return Product{}, fmt.Errorf("decode respons catalog: %w", err)
    }
    return p, nil
}`,
      explain: [
        'Timeout dibuat dari <code>ctx</code> milik request handler, sehingga bila pengguna menutup halaman atau server upstream membatalkan, seluruh rantai ikut berhenti — disebut <b>context propagation</b>.',
        '<code>http.NewRequestWithContext</code> mengikat request ke konteks; tanpa itu, membatalkan konteks tidak membatalkan pemanggilan HTTP.',
        '<code>errors.Is(err, context.DeadlineExceeded)</code> membedakan timeout dengan error jaringan biasa, supaya keputusan (jawab 504, coba lagi, atau catat sebagai insiden) bisa tepat.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Unit Test Table-Driven untuk Validasi Input',
      lang: 'go',
      output: false,
      code: `func TestCreateProductInput_Validate(t *testing.T) {
    tests := []struct {
        name    string
        in      CreateProductInput
        wantErr bool
    }{
        {"nama kosong", CreateProductInput{Name: "", Price: 24000, Stock: 5}, true},
        {"harga negatif", CreateProductInput{Name: "Kopi", Price: -1, Stock: 5}, true},
        {"stok negatif", CreateProductInput{Name: "Kopi", Price: 24000, Stock: -1}, true},
        {"semua valid", CreateProductInput{Name: "Kopi", Price: 24000, Stock: 5}, false},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if gotErr := tt.in.Validate() != nil; gotErr != tt.wantErr {
                t.Fatalf("Validate() error = %v, wantErr %v", gotErr, tt.wantErr)
            }
        })
    }
}`,
      explain: [
        'Gaya khas Go: satu fungsi test berisi daftar kasus berupa struct anonim, lalu dijalankan satu per satu lewat <code>t.Run</code>; menambah kasus cukup menambah satu baris daftar.',
        'Setiap kasus punya nama yang menjelaskan maksudnya — ketika gagal, kamu langsung tahu skenario mana yang rusak; jalankan satu kasus saja dengan <code>go test -run TestCreateProductInput_Validate/semua_valid ./...</code>.',
        'Untuk hasil lebih kaya, ganti <code>wantErr bool</code> dengan <code>wantErr error</code> lalu bandingkan memakai <code>errors.Is</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Menjaga Kualitas Kode Setiap Hari',
      lang: 'bash',
      output: false,
      code: `gofmt -l .                                  # daftar berkas yang belum terformat
gofmt -w .                                  # format ulang di tempat
go vet ./...                                # analisis statis: bug mencurigakan
go test ./...                               # seluruh unit test
go test -race ./...                         # deteksi akses memori bersamaan
go test -cover ./services/catalog/...       # rasio cakupan test catalog-service`,
      explain: [
        '<code>gofmt</code> membuat seluruh tim menulis gaya kode identik — tanpa debat format, review fokus ke logika; <code>go vet</code> menangkap kesalahan yang lolos compiler tetapi berbahaya, seperti Printf dengan argumen salah tipe.',
        '<code>-race</code> wajib bila kodenya memakai goroutine bersama; ia menemukan race condition yang tidak selalu muncul saat tes biasa.'
      ]
    },
    {
      type: 'warn',
      title: 'Perhatian: Kebocoran Goroutine',
      text: 'Goroutine yang tidak pernah selesai akan hidup sampai proses mati. Pola paling sering bocor: goroutine menunggu <code>range</code> pada channel yang tidak pernah ditutup, atau memanggil service lain tanpa timeout sehingga menunggu selamanya. Biasakan dua kebiasaan: selalu sediakan cara menghentikan goroutine lewat <code>ctx.Done()</code>, dan selalu tutup channel dari sisi pengirim.'
    },
    {
      type: 'tip',
      title: 'Latihan Mandiri',
      text: 'Bangun pemahamanmu dengan tugas kecil. (1) Tulis worker pool yang memproses sepuluh tugas fiktif dengan empat pekerja dan cetak hasilnya, lalu jalankan dengan <code>go test -race</code>. (2) Buat fungsi validasi input pesanan lengkap dengan unit test table-driven berisi minimal enam kasus. (3) Ubah fungsi GetProduct agar menerima timeout 500 milidetik dan buktikan ia mengembalikan ErrCatalogTimeout dengan memanggil alamat yang tidak ada. Untuk dasar Go yang lebih lengkap — variabel, pointer, slice, map, dan JSON encoding — lanjutkan lewat materi Go yang tersedia pada aplikasi ini.'
    },
    {
      type: 'vocab',
      items: [
        ['Binary statis', 'Hasil kompilasi berupa satu berkas executable yang berjalan tanpa dependensi runtime tambahan.'],
        ['Goroutine', 'Unit eksekusi ringan di Go, berjalan asynchronous dengan tumpukan memori awal yang kecil.'],
        ['Channel', 'Saluran aman untuk bertukar data antar goroutine; wajib ditutup oleh pengirim.'],
        ['sync.WaitGroup', 'Alat menunggu sekelompok goroutine selesai sebelum lanjut.'],
        ['context.Context', 'Pembawa deadline dan sinyal pembatalan yang mengalir dari pemanggil ke seluruh rantai panggilan.'],
        ['Context propagation', 'Meneruskan konteks request ke panggilan berikutnya agar pembatalan dan timeout berlaku menyeluruh.'],
        ['Error wrapping', 'Membungkus error dengan konteks memakai %w agar pesan makin jelas tetapi error asli tetap terjangkau.'],
        ['errors.Is / errors.As', 'Fungsi menelusuri rantai error: membandingkan dengan sentinel atau menyalin ke tipe tertentu.'],
        ['Table-driven test', 'Gaya pengujian Go: daftar kasus dalam struct anonim, dijalankan satu per satu dengan t.Run.']
      ]
    }
  ],
  recap: [
    'Go cocok untuk microservices karena binary statis, startup cepat, goroutine murah, dan toolchain bawaan yang lengkap.',
    'Interface kecil yang implisit membuat repository palsu mudah dibuat untuk test; terima interface, kembalikan struct.',
    'Bungkus error dengan %w beserta konteks; cek dengan errors.Is untuk sentinel dan errors.As untuk tipe error spesifik.',
    'Worker pool menjaga jumlah goroutine tetap wajar, dan select pada ctx.Done() membuatnya bisa dihentikan.',
    'Context.WithTimeout pada panggilan downstream mencegah satu service yang macet menggantungkan seluruh request upstream.',
    'Unit test table-driven, gofmt, go vet, dan go test -race adalah kebiasaan harian yang menjaga kualitas kode service.'
  ]
});
