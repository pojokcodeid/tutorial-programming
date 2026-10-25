/* ============================================================
   Kumpulan soal kuis Go — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.GO_QUIZ_POOL = [
  {
    id: 'g01',
    q: 'Go (Golang) dirilis ke publik oleh Google pada tahun…',
    options: ['2009', '2005', '2012', '2016'],
    answer: 0,
    explain: 'Go dirilis ke publik pada 2009. Penciptanya adalah Robert Griesemer, Rob Pike, dan Ken Thompson.'
  },
  {
    id: 'g02',
    q: 'Perintah untuk mengompilasi dan langsung menjalankan berkas Go tanpa menyimpan biner adalah…',
    options: ['go run main.go', 'go build main.go', 'go exec main.go', 'go start main.go'],
    answer: 0,
    explain: 'go run mengompilasi di memori lalu menjalankannya. go build menghasilkan berkas biner permanen.'
  },
  {
    id: 'g03',
    q: 'Environment variable yang menunjukkan lokasi instalasi Go adalah…',
    options: ['GOROOT', 'GOPATH', 'GOBIN', 'GOHOME'],
    answer: 0,
    explain: 'GOROOT menunjuk folder tempat Go dipasang. GOPATH adalah folder kerja pengguna.'
  },
  {
    id: 'g04',
    q: 'Perintah untuk membuat berkas go.mod pada proyek baru adalah…',
    options: ['go mod init nama-module', 'go init module', 'go new mod', 'go mod create'],
    answer: 0,
    explain: 'go mod init membuat go.mod berisi nama module dan versi Go.'
  },
  {
    id: 'g05',
    q: 'Perintah untuk merapikan daftar dependency agar sesuai isi kode adalah…',
    options: ['go mod tidy', 'go tidy mod', 'go clean deps', 'go fix mod'],
    answer: 0,
    explain: 'go mod tidy menambah dependensi yang kurang dan membuang yang tidak terpakai.'
  },
  {
    id: 'g06',
    q: 'Mengapa berkas go.sum tidak boleh diedit manual?',
    options: ['Karena berisi checksum untuk memverifikasi dependency', 'Karena berkas itu terenkripsi', 'Karena ukurannya terlalu besar', 'Karena hanya bisa dibaca mesin'],
    answer: 0,
    explain: 'go.sum menyimpan checksum agar dependency tidak diubah diam-diam; biarkan Go yang mengurusnya.'
  },
  {
    id: 'g07',
    q: 'Package di dalam folder internal/ hanya boleh diimpor oleh…',
    options: ['Kode di dalam module yang sama', 'Semua orang di internet', 'Hanya module bernama main', 'Hanya package main'],
    answer: 0,
    explain: 'Folder internal/ membatasi impor hanya untuk kode dalam module yang sama.'
  },
  {
    id: 'g08',
    q: 'Short variable declaration (:=) hanya boleh dipakai…',
    options: ['Di dalam fungsi', 'Di luar fungsi saja', 'Pada level package', 'Hanya untuk konstanta'],
    answer: 0,
    explain: ':= hanya valid di dalam fungsi. Di level package gunakan var atau const.'
  },
  {
    id: 'g09',
    q: 'Zero value untuk tipe int di Go adalah…',
    options: ['0', 'nil', 'kosong', 'tidak terdefinisi'],
    answer: 0,
    explain: 'Setiap tipe punya zero value: int = 0, string = "", bool = false, pointer/slice/map = nil.'
  },
  {
    id: 'g10',
    q: 'Zero value untuk tipe bool adalah…',
    options: ['false', 'true', '0', 'nil'],
    answer: 0,
    explain: 'Zero value bool adalah false, sedangkan untuk pointer, slice, map, interface, dan error adalah nil.'
  },
  {
    id: 'g11',
    q: 'Hasil dari int(3.9) pada konversi tipe Go adalah…',
    options: ['3', '4', '3.9', 'error'],
    answer: 0,
    explain: 'Konversi float ke int memotong (truncate) bagian desimal, bukan membulatkan.'
  },
  {
    id: 'g12',
    q: 'Operator % pada Go (modulo) hanya bisa dipakai untuk tipe…',
    options: ['Bilangan bulat (integer)', 'Bilangan pecahan (float)', 'String', 'Boolean'],
    answer: 0,
    explain: 'Operasi % hanya untuk tipe integer; float tidak mendukung modulo.'
  },
  {
    id: 'g13',
    q: 'Ciri khas perulangan di Go adalah…',
    options: ['Hanya ada satu kata kunci: for', 'Memakai while dan do-while', 'Tidak bisa dihentikan di tengah', 'Hanya bisa untuk angka'],
    answer: 0,
    explain: 'Go hanya memiliki perulangan for. While dan do-while ditulis memakai bentuk for.'
  },
  {
    id: 'g14',
    q: 'Kata kunci fallthrough di dalam switch berfungsi untuk…',
    options: ['Melanjutkan eksekusi ke case berikutnya', 'Menghentikan switch', 'Keluar dari perulangan', 'Mengulang case'],
    answer: 0,
    explain: 'fallthrough memaksa switch melanjutkan ke case berikutnya. Tanpa itu, switch berhenti otomatis.'
  },
  {
    id: 'g15',
    q: 'Pada array [3]int dan [4]int, keduanya…',
    options: ['Memiliki tipe berbeda', 'Bertipe sama', 'Tidak bisa diindeks', 'Otomatis menjadi slice'],
    answer: 0,
    explain: 'Ukuran array adalah bagian dari tipenya, jadi [3]int dan [4]int adalah tipe yang berbeda.'
  },
  {
    id: 'g16',
    q: 'Fungsi len() pada slice mengembalikan…',
    options: ['Jumlah elemen yang ada saat ini', 'Kapasitas total', 'Alamat memori', 'Ukuran tipe elemen'],
    answer: 0,
    explain: 'len() = jumlah elemen saat ini, cap() = kapasitas total sebelum slice perlu tumbuh.'
  },
  {
    id: 'g17',
    q: 'Fungsi append() pada slice berguna untuk…',
    options: ['Menambahkan elemen di akhir', 'Menghapus elemen pertama', 'Mengurutkan elemen', 'Membalik urutan'],
    answer: 0,
    explain: 'append menambahkan elemen di akhir; bila kapasitas habis, slice akan dialokasikan ulang.'
  },
  {
    id: 'g18',
    q: 'Fungsi copy() pada slice berguna untuk…',
    options: ['Menyalin elemen ke slice tujuan', 'Menghapus seluruh elemen', 'Menggandakan kapasitas', 'Mengurutkan elemen'],
    answer: 0,
    explain: 'copy(dst, src) menyalin elemen dan mengembalikan jumlah elemen yang tersalin.'
  },
  {
    id: 'g19',
    q: 'Cara memeriksa keberadaan sebuah key di map yang benar adalah…',
    options: ['v, ok := m[key]', 'if m.has(key)', 'm.contains(key)', 'key in m'],
    answer: 0,
    explain: 'Idiom dua nilai v, ok := m[key] memberi tahu apakah key ada. ok bernilai true bila key ditemukan.'
  },
  {
    id: 'g20',
    q: 'Iterasi for range pada map memiliki urutan yang…',
    options: ['Tidak dijamin (acak)', 'Selalu menaik', 'Selalu menurun', 'Sesuai panjang key'],
    answer: 0,
    explain: 'Go sengaja mengacak urutan iterasi map agar program tidak bergantung pada urutan tertentu.'
  },
  {
    id: 'g21',
    q: 'Fungsi Go yang mengembalikan lebih dari satu nilai disebut…',
    options: ['Multiple return values', 'Overloading', 'Generics', 'Pointer return'],
    answer: 0,
    explain: 'Go mendukung multiple return values, mis. func bagi(a, b int) (int, error).'
  },
  {
    id: 'g22',
    q: 'Keuntungan named return values adalah…',
    options: ['Nama variabel hasil sudah tersedia dan bisa dipakai di defer', 'Membuat fungsi lebih cepat', 'Menghilangkan perlu return', 'Mengubah tipe hasil'],
    answer: 0,
    explain: 'Named return memberi nama pada nilai hasil sehingga bisa langsung dipakai dan dimodifikasi lewat defer.'
  },
  {
    id: 'g23',
    q: 'Pada fungsi variadic func jumlah(angka ...int), di dalam fungsi angka bertipe…',
    options: ['[]int (slice)', '[N]int (array)', 'int', 'interface{}'],
    answer: 0,
    explain: 'Parameter variadic dikumpulkan menjadi slice, sehingga bisa diiterasi dengan for range.'
  },
  {
    id: 'g24',
    q: 'Closure adalah…',
    options: ['Fungsi anonim yang menangkap variabel dari lingkungannya', 'Fungsi yang tidak bisa dipanggil', 'Tipe data khusus', 'Cara menutup goroutine'],
    answer: 0,
    explain: 'Closure "mengingat" variabel dari cakupan tempat ia dibuat, meskipun fungsi induknya sudah selesai.'
  },
  {
    id: 'g25',
    q: 'Simbol & dan * dalam konteks pointer masing-masing berarti…',
    options: ['Mengambil alamat dan melakukan dereference', 'Dereference dan mengambil alamat', 'Perkalian dan pembagian', 'Dua-duanya dereference'],
    answer: 0,
    explain: '&x mengambil alamat memori x; *p mengakses nilai pada alamat yang ditunjuk p.'
  },
  {
    id: 'g26',
    q: 'Saat memanggil fungsi biasa di Go (tanpa pointer), argumen dikirim secara…',
    options: ['Pass by value (salinan)', 'Pass by reference (langsung)', 'Pass by name', 'Pass by channel'],
    answer: 0,
    explain: 'Go selalu pass by value. Untuk mengubah nilai asli, kirim pointer-nya.'
  },
  {
    id: 'g27',
    q: 'Method dengan pointer receiver (&) dipakai bila…',
    options: ['Ingin mengubah nilai struct aslinya', 'Ingin menyalin struct', 'Fungsi tidak mengembalikan nilai', 'Struct tidak punya field'],
    answer: 0,
    explain: 'Pointer receiver memungkinkan method mengubah field struct asli. Value receiver bekerja pada salinan.'
  },
  {
    id: 'g28',
    q: '"Implicit interface" di Go berarti…',
    options: ['Tipe otomatis memenuhi interface bila punya semua methodnya', 'Interface harus dideklarasikan eksplisit', 'Interface tidak boleh punya method', 'Interface hanya untuk struct'],
    answer: 0,
    explain: 'Go memakai interface implisit: cukup memiliki method yang disyaratkan, tanpa kata kunci implements.'
  },
  {
    id: 'g29',
    q: 'Empty interface (interface{} atau any) dapat menampung…',
    options: ['Nilai dari tipe apa pun', 'Hanya string', 'Hanya angka', 'Hanya struct'],
    answer: 0,
    explain: 'Karena tidak punya method, semua tipe memenuhi empty interface.'
  },
  {
    id: 'g30',
    q: 'Bentuk aman type assertion adalah…',
    options: ['v, ok := x.(int)', 'v := x.(int) selalu aman', 'v := int(x)', 'v, _ := x.(type)'],
    answer: 0,
    explain: 'Bentuk dua nilai (v, ok) tidak panic bila tipe tidak cocok; bentuk satu nilai akan panic.'
  },
  {
    id: 'g31',
    q: 'Interface error di standard library memiliki satu method, yaitu…',
    options: ['Error() string', 'String() string', 'Message() string', 'Err() error'],
    answer: 0,
    explain: 'Tipe apa pun yang punya method Error() string otomatis memenuhi interface error.'
  },
  {
    id: 'g32',
    q: 'Cara membuat custom error yang baik adalah…',
    options: ['Membuat tipe dengan method Error() string', 'Memanggil panic setiap kali gagal', 'Mengembalikan string kosong', 'Mengabaikan error'],
    answer: 0,
    explain: 'Custom error dibuat sebagai tipe (sering struct) yang mengimplementasikan interface error.'
  },
  {
    id: 'g33',
    q: 'Untuk membungkus error agar bisa diperiksa dengan errors.Is, gunakan format…',
    options: ['fmt.Errorf("konteks: %w", err)', 'fmt.Errorf("konteks: %s", err)', 'fmt.Sprintf("%v", err)', 'errors.New(err.Error())'],
    answer: 0,
    explain: 'Verb %w membungkus error sehingga rantainya bisa diperiksa dengan errors.Is/errors.As.'
  },
  {
    id: 'g34',
    q: 'Pernyataan defer pada Go dijalankan…',
    options: ['Saat fungsi selesai, dengan urutan LIFO', 'Segera setelah ditulis', 'Hanya bila terjadi error', 'Sebelum fungsi mulai'],
    answer: 0,
    explain: 'defer menunda eksekusi sampai fungsi selesai; beberapa defer dijalankan terbalik (LIFO).'
  },
  {
    id: 'g35',
    q: 'Pernyataan yang benar tentang panic dan recover adalah…',
    options: ['panic menghentikan alur normal; recover bisa menangkapnya di defer', 'recover menghentikan program selamanya', 'panic hanya untuk error ringan', 'Keduanya harus selalu dipakai'],
    answer: 0,
    explain: 'panic menghentikan alur dan menaikkan stack; recover, dipanggil di dalam defer, dapat menghentikannya.'
  },
  {
    id: 'g36',
    q: 'Identifier yang diekspor (bisa dipakai package lain) selalu diawali…',
    options: ['Huruf kapital', 'Huruf kecil', 'Garis bawah', 'Angka'],
    answer: 0,
    explain: 'Di Go, huruf kapital di awal nama berarti exported (publik); huruf kecil berarti unexported (privat package).'
  },
  {
    id: 'g37',
    q: 'Menjalankan fungsi secara concurrent (goroutine) dilakukan dengan kata kunci…',
    options: ['go async()', 'go func()', 'thread func()', 'async func()'],
    answer: 0,
    explain: 'Menuliskan go di depan pemanggilan fungsi menjalankannya sebagai goroutine.'
  },
  {
    id: 'g38',
    q: 'Unbuffered channel akan memblokir pengirim sampai…',
    options: ['Ada penerima yang siap menerima', 'Program selesai', 'Waktu habis', 'Channel ditutup'],
    answer: 0,
    explain: 'Channel tanpa buffer melakukan sinkronisasi: kirim menunggu sampai ada yang menerima, dan sebaliknya.'
  },
  {
    id: 'g39',
    q: 'Channel dengan buffer berkapasitas 3 artinya…',
    options: ['Bisa menampung 3 nilai sebelum pengiriman memblokir', 'Hanya bisa dikirim 3 kali total', 'Mengirim 3 goroutine sekaligus', 'Tidak pernah memblokir'],
    answer: 0,
    explain: 'Buffer menampung sejumlah nilai; pengirim baru memblokir bila buffer sudah penuh.'
  },
  {
    id: 'g40',
    q: 'Statement select pada Go berguna untuk…',
    options: ['Menunggu beberapa operasi channel sekaligus', 'Memilih tipe data', 'Mengurutkan data', 'Membuat keputusan if-else'],
    answer: 0,
    explain: 'select mirip switch untuk channel: ia menjalankan case pertama yang siap di antara beberapa channel.'
  },
  {
    id: 'g41',
    q: 'sync.WaitGroup dipakai untuk…',
    options: ['Menunggu sekumpulan goroutine selesai', 'Mengunci akses data', 'Menjalankan goroutine', 'Membatalkan konteks'],
    answer: 0,
    explain: 'Pola WaitGroup: Add sebelum menjalankan goroutine, Done di akhir goroutine, Wait untuk menunggu semuanya.'
  },
  {
    id: 'g42',
    q: 'sync.Mutex dan sync.RWMutex dipakai untuk…',
    options: ['Mencegah race condition pada akses data bersama', 'Mempercepat goroutine', 'Menghentikan program', 'Mengelola memori'],
    answer: 0,
    explain: 'Mutex memastikan hanya satu goroutine mengakses data kritis pada satu waktu, sehingga mencegah race condition.'
  },
  {
    id: 'g43',
    q: 'sync.Once memastikan sebuah aksi…',
    options: ['Hanya dijalankan satu kali', 'Dijalankan berulang', 'Berjalan di goroutine baru', 'Tidak pernah dijalankan'],
    answer: 0,
    explain: 'sync.Once secara umum dipakai untuk inisialisasi yang hanya boleh sekali, mis. membuka koneksi atau memuat konfigurasi.'
  },
  {
    id: 'g44',
    q: 'Alat untuk mendeteksi race condition saat menjalankan program atau tes adalah…',
    options: ['go run -race / go test -race', 'go fmt', 'go mod tidy', 'go doc'],
    answer: 0,
    explain: 'Flag -race mengaktifkan race detector yang melaporkan akses memori bersamaan yang tidak aman.'
  },
  {
    id: 'g45',
    q: 'Package context dipakai untuk…',
    options: ['Timeout, pembatalan, dan membawa nilai lintas pemanggilan', 'Mengurutkan channel', 'Mengunci mutex', 'Mengformat angka'],
    answer: 0,
    explain: 'context menyebarkan sinyal pembatalan dan tenggat waktu ke goroutine serta pemanggilan jaringan/database.'
  },
  {
    id: 'g46',
    q: 'Berkas pengujian Go harus diberi nama berakhiran…',
    options: ['_test.go', '.test.go', '.spec', '_spec.go'],
    answer: 0,
    explain: 'Fungsi tes ditulis di berkas *_test.go dengan nama fungsi berawalan Test, dan dijalankan lewat go test.'
  },
  {
    id: 'g47',
    q: 'Table-driven test adalah pola…',
    options: ['Menulis kasus uji dalam slice, lalu diiterasi', 'Menulis tes di tabel HTML', 'Tes yang mengubah tabel database', 'Tes tanpa kasus'],
    answer: 0,
    explain: 'Table-driven test mengumpulkan banyak kasus dalam slice/struct lalu menjalankannya berulang — ringkas dan mudah diperluas.'
  },
  {
    id: 'g48',
    q: 'Pada benchmark testing.B, variabel b.N menunjukkan…',
    options: ['Jumlah iterasi yang ditentukan framework', 'Nama benchmark', 'Jumlah error', 'Ukuran memori'],
    answer: 0,
    explain: 'Framework menjalankan fungsi benchmark sebanyak b.N kali untuk mengukur kinerja secara stabil.'
  },
  {
    id: 'g49',
    q: 'Untuk melihat persentase cakupan pengujian, jalankan…',
    options: ['go test -cover', 'go test -race', 'go test -v', 'go test -bench'],
    answer: 0,
    explain: 'go test -cover menunjukkan code coverage, dan -coverprofile menyimpan data untuk dianalisis lebih lanjut.'
  },
  {
    id: 'g50',
    q: 'json.Unmarshal pada Go memerlukan argumen kedua berupa…',
    options: ['Pointer ke variabel tujuan', 'Nilai biasa (salinan)', 'String kosong', 'Channel'],
    answer: 0,
    explain: 'Unmarshal perlu pointer (&v) agar bisa mengisi data hasil parsing ke variabel tujuan.'
  },
  {
    id: 'g51',
    q: 'Untuk merangkai string di dalam loop secara efisien, sebaiknya pakai…',
    options: ['strings.Builder', 'operator + berulang', 'fmt.Sprintf berulang', 'salinan slice'],
    answer: 0,
    explain: 'strings.Builder menghindari banyak alokasi string baru yang terjadi bila memakai + berulang.'
  },
  {
    id: 'g52',
    q: 'Middleware pada net/http biasanya berupa…',
    options: ['Fungsi yang membungkus http.Handler', 'Tabel database', 'Tipe channel', 'Goroutine khusus'],
    answer: 0,
    explain: 'Middleware adalah handler yang menerima handler lain, menjalankan logika tambahan (auth, log, CORS), lalu meneruskan.'
  },
  {
    id: 'g53',
    q: 'Bahasa kontrak pada gRPC adalah…',
    options: ['Protocol Buffers (protobuf)', 'JSON', 'XML', 'YAML'],
    answer: 0,
    explain: 'gRPC memakai HTTP/2 dan Protocol Buffers; kontrak .proto menghasilkan kode klien & server.'
  },
  {
    id: 'g54',
    q: 'Message broker yang paling cocok untuk event streaming bervolume sangat tinggi adalah…',
    options: ['Apache Kafka', 'RabbitMQ', 'Email SMTP', 'Redis Cache'],
    answer: 0,
    explain: 'Kafka adalah log terdistribusi dengan throughput sangat tinggi, cocok untuk event streaming.'
  },
  {
    id: 'g55',
    q: 'Standar terbuka untuk distributed tracing, metrics, dan logs adalah…',
    options: ['OpenTelemetry', 'JSON-RPC', 'OAuth2', 'WebSocket'],
    answer: 0,
    explain: 'OpenTelemetry menyediakan API, SDK, dan alat untuk mengumpulkan trace, metrics, serta logs.'
  },
  {
    id: 'g56',
    q: 'reflect.TypeOf(x) mengembalikan…',
    options: ['Informasi tipe dari nilai x', 'Nilai x', 'Alamat memori x', 'Panjang x'],
    answer: 0,
    explain: 'reflect.TypeOf memberi objek reflect.Type (nama & kind), sedangkan reflect.ValueOf memberi nilainya.'
  },
  {
    id: 'g57',
    q: 'Package unsafe sebaiknya dipakai…',
    options: ['Hanya bila benar-benar perlu dan sudah diukur', 'Di setiap fungsi', 'Untuk semua tipe data', 'Sebagai pengganti pointer'],
    answer: 0,
    explain: 'unsafe melewati jaminan keamanan compiler; gunakan hanya untuk kasus langka dengan alasan jelas.'
  },
  {
    id: 'g58',
    q: 'Perbedaan alokasi stack dan heap ditentukan oleh…',
    options: ['Escape analysis compiler', 'Programmer secara manual', 'Sistem operasi saat runtime', 'Environment variable'],
    answer: 0,
    explain: 'Bila nilai tidak keluar dari fungsi, biasanya di stack; bila escape, compiler menaruhnya di heap.'
  },
  {
    id: 'g59',
    q: 'Default nilai GOGC adalah 100, yang berarti GC berjalan ketika heap…',
    options: ['Tumbuh dua kali lipat sejak pembersihan terakhir', 'Penuh total', 'Mencapai 100 MB', 'Kosong'],
    answer: 0,
    explain: 'GOGC=100 (default) memicu GC saat ukuran heap mencapai dua kali lipat ukuran setelah GC terakhir.'
  },
  {
    id: 'g60',
    q: 'GOMEMLIMIT adalah…',
    options: ['Batas memori lunak agar GC lebih agresif saat mendekati batas', 'Jumlah maksimum goroutine', 'Batas ukuran biner', 'Nama lain GOGC'],
    answer: 0,
    explain: 'GOMEMLIMIT menetapkan batas memori "soft" sehingga GC mengencang ketika penggunaan memori mendekati batas.'
  },
  {
    id: 'g61',
    q: 'Perkakas bawaan Go untuk profiling CPU dan memori adalah…',
    options: ['pprof', 'gofmt', 'go doc', 'go vet'],
    answer: 0,
    explain: 'pprof mengambil sampel CPU/memori; akses lewat go tool pprof atau endpoint /debug/pprof/.'
  },
  {
    id: 'g62',
    q: 'Kegunaan utama go tool trace adalah…',
    options: ['Melihat timeline eksekusi: goroutine, GC, blocking', 'Mengurutkan kode', 'Mengunduh dependency', 'Membuat dokumentasi'],
    answer: 0,
    explain: 'trace memperlihatkan perilaku runtime secara visual, membantu memahami penjadwalan goroutine dan hambatan.'
  },
  {
    id: 'g63',
    q: 'Fungsi generik pada Go ditandai dengan…',
    options: ['Type parameter dalam kurung siku, mis. [T any]', 'Kata kunci generic', 'Tanda bintang', 'Nama fungsi harus diawali G'],
    answer: 0,
    explain: 'Sejak Go 1.18, generics memakai type parameter dalam kurung siku, mis. func Cetak[T any](v T).'
  },
  {
    id: 'g64',
    q: 'Pada constraint interface Angka { ~int | ~float64 }, tanda ~ berarti…',
    options: ['Termasuk tipe yang underlying-nya int/float64', 'Hanya tipe bawaan persis', 'Bukan tipe angka', 'Operator bitwise'],
    answer: 0,
    explain: '~ mencakup tipe turunan, mis. type Suhu float64, tidak hanya tipe bawaan yang persis.'
  },
  {
    id: 'g65',
    q: 'Constraint bawaan untuk tipe yang mendukung operator == dan != adalah…',
    options: ['comparable', 'ordered', 'numeric', 'any'],
    answer: 0,
    explain: 'comparable menjamin tipe mendukung perbandingan kesamaan, sehingga aman dipakai sebagai key map.'
  },
  {
    id: 'g66',
    q: 'Teknik Docker multi-stage build bertujuan untuk…',
    options: ['Menghasilkan image akhir yang kecil dengan hanya menyalin biner', 'Menjalankan banyak kontainer', 'Menambah ukuran image', 'Mengganti sintaks Go'],
    answer: 0,
    explain: 'Tahap build memakai image Go lengkap; tahap akhir hanya menyalin biner ke image ringan.'
  },
  {
    id: 'g67',
    q: 'CGO_ENABLED=0 saat membangun biner Go bertujuan…',
    options: ['Menghasilkan biner statis tanpa ketergantungan pustaka C', 'Menonaktifkan concurrency', 'Menghapus komentar', 'Mengaktifkan debug'],
    answer: 0,
    explain: 'Biner statis lebih mudah dipindahkan ke image minimal seperti distroless atau alpine.'
  },
  {
    id: 'g68',
    q: 'Image dasar "distroless" dipilih karena…',
    options: ['Sangat minimal sehingga permukaan serang lebih kecil', 'Paling besar ukurannya', 'Wajib untuk semua bahasa', 'Menyertakan compiler Go'],
    answer: 0,
    explain: 'Distroless tidak menyertakan shell/paket tak perlu, memperkecil ukuran dan risiko keamanan.'
  },
  {
    id: 'g69',
    q: 'Cara mencegah SQL Injection di Go adalah…',
    options: ['Memakai prepared statement dengan placeholder (?)', 'Merangkai string kueri langsung', 'Mematikan database', 'Mengenkripsi nama kolom'],
    answer: 0,
    explain: 'Placeholder memisahkan kode SQL dari data; driver mengurus escaping sehingga input tidak dieksekusi sebagai perintah.'
  },
  {
    id: 'g70',
    q: 'Header CORS yang membatasi domain mana yang boleh mengakses API adalah…',
    options: ['Access-Control-Allow-Origin', 'Content-Type', 'Cache-Control', 'Authorization'],
    answer: 0,
    explain: 'Access-Control-Allow-Origin menetapkan domain yang diizinkan; hindari nilai * untuk endpoint berautentikasi.'
  },
  {
    id: 'g71',
    q: 'Saat memverifikasi JWT, hal penting yang harus dicek selain keabsahan token adalah…',
    options: ['Algoritma tanda tangan, audience, dan issuer sesuai harapan', 'Warna tombol', 'Ukuran berkas', 'Nama pengguna di URL'],
    answer: 0,
    explain: 'Memeriksa algoritma mencegah serangan seperti "alg: none"; audience & issuer memastikan token untuk aplikasi yang benar.'
  },
  {
    id: 'g72',
    q: 'Bentuk komentar yang dikenal di Go adalah…',
    options: ['// dan /* */', '# dan """', '// dan """', '<!-- dan -->'],
    answer: 0,
    explain: 'Go hanya mengenal komentar baris // dan komentar blok /* */. Tanda # (Python) dan <!-- --> (HTML) tidak dipakai.'
  },
  {
    id: 'g73',
    q: 'Apa yang terjadi jika komentar blok /* */ bersarang di Go?',
    options: ['Boleh saja, selama tidak berantakan', 'Blok berakhir di */ pertama sehingga sisanya dianggap kode', 'Compiler langsung menghapus berkas', 'Harus ditutup dengan **/'],
    answer: 1,
    explain: 'Komentar blok Go tidak boleh bersarang: blok berakhir di tanda */ yang paling awal, sehingga sisa teks dianggap kode nyata dan memicu error kompilasi.'
  },
  {
    id: 'g74',
    q: 'Komentar yang menjadi dokumentasi resmi package dan tampil di go doc disebut…',
    options: ['Doc comment, diletakkan tepat di atas deklarasi', 'Inline comment, diletakkan di akhir baris', 'Komentar blok wajib berlisensi', 'Komentar //TODO yang wajib di setiap fungsi'],
    answer: 0,
    explain: 'Doc comment diletakkan tepat di atas package/fungsi/tipe tanpa baris kosong. go doc dan pkg.go.dev menampilkannya sebagai dokumentasi.'
  },
  {
    id: 'g75',
    q: 'Pada penulisan _, err := simpan(data), tanda _ disebut…',
    options: ['Blank identifier, tempat membuang nilai yang tidak dipakai', 'Pointer kosong', 'Zero value', 'Wildcard untuk semua tipe'],
    answer: 0,
    explain: 'Blank identifier (_) menampung nilai yang tidak dibutuhkan agar kompilasi tidak protes "declared and not used". Ia tidak pernah bisa dibaca atau dicetak.'
  },
  {
    id: 'g76',
    q: 'Apa yang dikembalikan oleh new(Pengguna) bila Pengguna adalah struct?',
    options: ['Pointer ke struct berisi zero value (*Pengguna)', 'Struct yang sudah terisi nama', 'Slice siap pakai', 'Nilai int 0'],
    answer: 0,
    explain: 'new(T) mengalokasikan memori untuk tipe apa saja lalu mengembalikan pointer *T ke zero value-nya. Bentuk yang lebih lazim di Go adalah &T{...}.'
  },
  {
    id: 'g77',
    q: 'Kata kunci make() hanya boleh dipakai untuk tipe…',
    options: ['slice, map, dan channel', 'struct dan interface', 'int, float, dan string', 'semua tipe data'],
    answer: 0,
    explain: 'make menginisialisasi struktur internal (len, cap, buffer) yang hanya dimiliki slice, map, dan channel, dan mengembalikan tipe itu sendiri, bukan pointer. Untuk struct gunakan var atau &T{...}.'
  },
  {
    id: 'g78',
    q: 'Fungsi bawaan untuk mengambil nilai terbesar dari beberapa argumen sejak Go 1.21 adalah…',
    options: ['max(a, b, ...)', 'largest(a, b)', 'big(a, b)', 'top(a, b)'],
    answer: 0,
    explain: 'Go 1.21 menambah dua fungsi bawaan: min() dan max(). Keduanya menerima dua argumen atau lebih bertipe sama dan tidak perlu di-import.'
  },
  {
    id: 'g79',
    q: 'Apa yang terjadi bila menulis min(1, 2.5) di Go?',
    options: ['Error kompilasi karena int dan float64 bercampur', 'Hasilnya selalu 1', 'Hasilnya 2.5', 'Go mengonversi otomatis ke float64'],
    answer: 0,
    explain: 'Semua argumen min()/max() harus bertipe sama. Karena Go tidak melakukan konversi otomatis, tulis float64(1) agar keduanya float64.'
  },
  {
    id: 'g80',
    q: 'Fungsi yang menghasilkan string sesuai format TANPA mencetaknya ke layar adalah…',
    options: ['fmt.Sprintf', 'fmt.Printf', 'fmt.Println', 'fmt.Print'],
    answer: 0,
    explain: 'Sprintf mengembalikan string, sehingga hasilnya bisa disimpan dulu (pesan error, URL, label). Printf menulis langsung ke stdout.'
  },
  {
    id: 'g81',
    q: 'Pada fmt.Scan(&nama), tanda & di depan nama berfungsi untuk…',
    options: ['Mengirim alamat variabel agar bisa diisi oleh fungsi', 'Menandai variabel sebagai konstanta', 'Membaca nilai secara copy', 'Menghapus nilai lama'],
    answer: 0,
    explain: 'Fungsi Scan mengisi variabel lewat pointer, jadi wajib ditulis &nama. Tanpa &, nilai tidak akan sampai ke variabel Anda.'
  },
  {
    id: 'g82',
    q: 'Bila harus membaca satu baris utuh berisi spasi (mis. nama lengkap "Budi Santoso"), cara yang tepat adalah…',
    options: ['bufio.NewReader(os.Stdin).ReadString(\'\\n\') atau bufio.Scanner', 'fmt.Scan(&s)', 'fmt.Printf("%s", &s)', 'fmt.Println(&s)'],
    answer: 0,
    explain: 'fmt.Scan hanya mengambil satu kata karena memisah token dengan spasi. bufio membaca seluruh baris sehingga spasi di dalamnya tetap utuh.'
  },
  {
    id: 'g83',
    q: 'Tujuan utama package log dibanding fmt.Println adalah…',
    options: ['Menulis catatan diagnostik berstempel waktu ke stderr', 'Menampilkan output ke pengguna di stdout', 'Membaca input dari keyboard', 'Mengubah tipe data otomatis'],
    answer: 0,
    explain: 'fmt.Print menulis ke stdout untuk pengguna, sedangkan log menulis ke stderr untuk diagnostik dan otomatis menambahkan tanggal & waktu.'
  },
  {
    id: 'g84',
    q: 'Flag yang membuat log menyertakan nama berkas dan baris pemanggil adalah…',
    options: ['log.Lshortfile', 'log.Ldate', 'log.Lmsgprefix', 'log.Lmicroseconds'],
    answer: 0,
    explain: 'Lshortfile menambahkan nama berkas dan nomor baris sumber pesan, sangat membantu menemukan lokasi kejadian. Ldate hanya menambah tanggal.'
  },
  {
    id: 'g85',
    q: 'Perbedaan log.Fatal dan log.Panic adalah…',
    options: ['Fatal keluar dari program (os.Exit), Panic memicu panic yang bisa ditangkap recover', 'Fatal mencetak ke file, Panic mencetak ke layar', 'Keduanya sama persis', 'Fatal berhenti di fungsi saja, Panic menghentikan seluruh program'],
    answer: 0,
    explain: 'log.Fatal mengakhiri program dengan status keluar 1 (defer tidak jalan), sedangkan log.Panic memicu panic sehingga masih bisa ditangani recover.'
  },
  {
    id: 'g86',
    q: 'Untuk membuat logger khusus dengan prefix dan tujuan sendiri dipakai…',
    options: ['log.New(w, prefix, flags)', 'log.SetNew(prefix)', 'log.Create(prefix)', 'log.Custom(prefix)'],
    answer: 0,
    explain: 'log.New menghasilkan logger independen yang menerima io.Writer, prefix, dan flag, sehingga tiap komponen bisa dibedakan.'
  },
  {
    id: 'g87',
    q: 'Agar satu panggilan log tertulis ke layar sekaligus ke berkas, gunakan…',
    options: ['io.MultiWriter(os.Stdout, berkas)', 'io.Copy(os.Stdout, berkas)', 'bytes.Join', 'log.Combine'],
    answer: 0,
    explain: 'io.MultiWriter meneruskan setiap tulisan ke semua penulisnya, sehingga log tampil di stdout dan tersimpan di berkas sekaligus.'
  },
  {
    id: 'g88',
    q: 'Package structured logging bawaan Go (sejak Go 1.21) adalah…',
    options: ['log/slog', 'log/json', 'log/trace', 'log/format'],
    answer: 0,
    explain: 'log/slog adalah package structured logging di standard library: log berupa kunci-nilai sehingga mudah dicari dan diindeks mesin.'
  },
  {
    id: 'g89',
    q: 'Pada slog.Info("login", "user_id", 42, "ip", "10.0.0.1"), bentuk argumennya adalah…',
    options: ['Pasangan kunci-nilai bergantian', 'Satu string format dengan %d', 'Slice of string', 'Struct tanpa tag'],
    answer: 0,
    explain: 'slog menerima argumen berpasangan: kunci lalu nilai, kunci lalu nilai. Urutan ini wajib bergantian agar atribut tidak berantakan.'
  },
  {
    id: 'g90',
    q: 'Handler yang menghasilkan JSON per baris — standar untuk produksi — adalah…',
    options: ['slog.NewJSONHandler', 'slog.TextHandler', 'slog.ConsoleHandler', 'slog.DebugHandler'],
    answer: 0,
    explain: 'JSONHandler menulis satu objek JSON per kejadian, cocok untuk dikonsumsi sistem log terpusat. TextHandler untuk dibaca manusia.'
  },
  {
    id: 'g91',
    q: 'Cara membuat logger yang membawa atribut tetap (mis. service dan env) pada setiap barisnya adalah…',
    options: ['dasar.With(slog.String("service", "order"))', 'dasar.Append(...)', 'dasar.Merge(...)', 'dasar.Set(...)'],
    answer: 0,
    explain: 'With membuat logger turunan dengan atribut tetap, sehingga kunci service/env tidak perlu ditulis ulang di setiap panggilan.'
  },
  {
    id: 'g92',
    q: 'Logger terstruktur yang dibuat oleh Uber dan terkenal sangat cepat adalah…',
    options: ['Zap', 'Logrus', 'Zerolog', 'BeeGo Log'],
    answer: 0,
    explain: 'Zap (go.uber.org/zap) dirancang zero-allocation sehingga sangat cepat. Zerolog juga cepat tetapi dibuat oleh rs, bukan Uber.'
  },
  {
    id: 'g93',
    q: 'Dalam praktik 12-factor, sebaiknya aplikasi menulis log ke…',
    options: ['stdout, lalu diurus oleh pengumpul log container', 'berkas tanpa batas ukuran', 'database', 'email admin'],
    answer: 0,
    explain: 'Aplikasi menulis log ke stdout; fluentbit/Loki/Datadog yang mengumpulkan dan menyimpannya. Rotasi berkas tetap perlu bila juga menulis ke disk.'
  },
  {
    id: 'g94',
    q: 'Bahaya log yang tidak dirotasi adalah…',
    options: ['Berkas tumbuh tanpa batas hingga disk penuh dan service mati', 'Log menjadi tidak terstruktur', 'Program menjadi lebih lambat dari awal', 'Prefix tidak tercetak'],
    answer: 0,
    explain: 'Tanpa kebijakan retensi (batas ukuran, jumlah cadangan, lama simpan), log akan menghabiskan disk. Library seperti lumberjack mengatur rotasinya.'
  }
];
