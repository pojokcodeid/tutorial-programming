/* ============================================================
   Kumpulan soal kuis Go Web Examples — diacak setiap hari
   (topik dari https://gowebexamples.com/)
   ============================================================ */
'use strict';

window.GOWEB_QUIZ_POOL = [
  {
    id: 'gw01',
    q: 'Package standard library Go yang menyediakan web server lengkap adalah…',
    options: ['net/http', 'net/url', 'os/http', 'web/server'],
    answer: 0,
    explain: 'Package net/http berisi semua kebutuhan protokol HTTP, termasuk klien dan server.'
  },
  {
    id: 'gw02',
    q: 'Signature sebuah handler HTTP di Go adalah…',
    options: ['func(w http.ResponseWriter, r *http.Request)', 'func(r http.Request) string', 'func(w http.ResponseWriter) error', 'func(r *http.Request) []byte'],
    answer: 0,
    explain: 'Handler menerima ResponseWriter dan *http.Request. Bentuk inilah yang wajib dipenuhi.'
  },
  {
    id: 'gw03',
    q: 'Parameter pertama sebuah handler, http.ResponseWriter, berfungsi untuk…',
    options: ['Menulis balasan ke klien', 'Membaca body permintaan', 'Menyimpan sesi', 'Membuka koneksi database'],
    answer: 0,
    explain: 'ResponseWriter adalah tempat kita menulis teks/HTML/data yang akan dikirim ke klien.'
  },
  {
    id: 'gw04',
    q: 'Fungsi untuk mendaftarkan handler pada router default Go adalah…',
    options: ['http.HandleFunc', 'http.ListenAndServe', 'http.ServeFile', 'http.Get'],
    answer: 0,
    explain: 'http.HandleFunc(path, handler) mendaftarkan handler ke router default net/http.'
  },
  {
    id: 'gw05',
    q: 'Pada http.ListenAndServe(":80", nil), nilai nil berarti…',
    options: ['Memakai router default net/http', 'Tidak ada server yang dijalankan', 'Tidak ada handler sama sekali', 'Memakai port acak'],
    answer: 0,
    explain: 'Parameter kedua adalah router. Bila nil, Go memakai DefaultServeMux.'
  },
  {
    id: 'gw06',
    q: 'Cara membaca parameter GET ?token=abc123 adalah…',
    options: ['r.URL.Query().Get("token")', 'r.GET["token"]', 'r.Param("token")', 'r.Header.Get("token")'],
    answer: 0,
    explain: 'r.URL.Query() mengembalikan parameter URL; Get mengambil nilainya berdasarkan nama.'
  },
  {
    id: 'gw07',
    q: 'r.FormValue("email") dipakai untuk…',
    options: ['Mengambil nilai field form bernama email', 'Mengirim email', 'Membaca header email', 'Menghapus session'],
    answer: 0,
    explain: 'FormValue mengambil nilai dari form (GET atau POST) berdasarkan atribut name.'
  },
  {
    id: 'gw08',
    q: 'Fungsi http.StripPrefix pada penyajian berkas statis berguna untuk…',
    options: ['Membuang awalan URL sebelum berkas dicari', 'Menambahkan header keamanan', 'Mengganti nama berkas', 'Menutup koneksi'],
    answer: 0,
    explain: 'Tanpa StripPrefix, awalan seperti /static/ ikut dianggap bagian dari path berkas sehingga pencarian gagal.'
  },
  {
    id: 'gw09',
    q: 'Package populer untuk routing lanjutan (parameter URL, method, subrouter) adalah…',
    options: ['gorilla/mux', 'net/router', 'gin/http', 'go/routes'],
    answer: 0,
    explain: 'gorilla/mux menyediakan parameter bernama, batasan method/host/skema, dan subrouter.'
  },
  {
    id: 'gw10',
    q: 'Placeholder parameter URL pada gorilla/mux ditulis dengan…',
    options: ['Kurung kurawal, mis. /books/{title}', 'Tanda kurung, mis. /books/(title)', 'Titik dua, mis. /books/:title', 'Tanda kurung siku, mis. /books/[title]'],
    answer: 0,
    explain: 'gorilla/mux memakai {nama} untuk segmen dinamis.'
  },
  {
    id: 'gw11',
    q: 'Untuk mengambil nilai parameter URL pada gorilla/mux, dipakai…',
    options: ['mux.Vars(r)', 'r.Params', 'mux.Get(r, "title")', 'r.URL.Params()'],
    answer: 0,
    explain: 'mux.Vars(r) mengembalikan map nama-parameter ke nilainya.'
  },
  {
    id: 'gw12',
    q: 'Agar sebuah route hanya menerima method POST, tulis…',
    options: ['r.HandleFunc("/x", h).Methods("POST")', 'r.HandleFunc("/x", h).POST()', 'r.PostFunc("/x", h)', 'r.HandleFunc("/x", h).Allow("POST")'],
    answer: 0,
    explain: 'Router gorilla/mux menyediakan .Methods(...) untuk membatasi method HTTP.'
  },
  {
    id: 'gw13',
    q: 'Saat menangani form, alasan membedakan r.Method == http.MethodPost adalah…',
    options: ['GET untuk menampilkan form, POST untuk memproses kiriman', 'GET lebih aman untuk mengirim data', 'POST tidak bisa mengirim body', 'Tidak ada alasan khusus'],
    answer: 0,
    explain: 'Pola umum: GET menampilkan halaman, POST memproses data yang dikirim pengguna.'
  },
  {
    id: 'gw14',
    q: 'Package template yang aman untuk HTML karena meng-escape data adalah…',
    options: ['html/template', 'text/template', 'template/safe', 'net/template'],
    answer: 0,
    explain: 'html/template meng-escape nilai sesuai konteks HTML sehingga membantu mencegah XSS.'
  },
  {
    id: 'gw15',
    q: 'Pada template Go, {{.}} disebut…',
    options: ['Pipeline yang menunjuk data saat ini', 'Komentar', 'Fungsi bawaan', 'Header HTTP'],
    answer: 0,
    explain: 'Titik di dalam {{ }} adalah pipeline, yaitu elemen data yang sedang diproses.'
  },
  {
    id: 'gw16',
    q: 'Struktur template untuk mengulang setiap elemen slice adalah…',
    options: ['{{range .Todos}} ... {{end}}', '{{for .Todos}} ... {{end}}', '{{loop .Todos}}', '{{each .Todos}}'],
    answer: 0,
    explain: '{{range}} mengulang; di dalamnya {{.}} menunjuk elemen saat itu.'
  },
  {
    id: 'gw17',
    q: 'Fungsi template.Must(template.ParseFiles("layout.html")) berguna untuk…',
    options: ['Menghentikan program lebih awal bila template rusak', 'Mempercepat render', 'Menyimpan template ke database', 'Menghapus template'],
    answer: 0,
    explain: 'template.Must memanggil panic bila parsing gagal, sehingga kesalahan ketahuan saat start.'
  },
  {
    id: 'gw18',
    q: 'Saat tmpl.Execute(w, data) menulis ke http.ResponseWriter, header yang diisi otomatis adalah…',
    options: ['Content-Type: text/html; charset=utf-8', 'Content-Type: application/json', 'Content-Length: 0', 'Set-Cookie'],
    answer: 0,
    explain: 'html/template mengisi Content-Type HTML secara otomatis saat menulis ke ResponseWriter.'
  },
  {
    id: 'gw19',
    q: 'Handler http.FileServer(http.Dir("assets/")) berfungsi untuk…',
    options: ['Menyajikan berkas dari folder assets/', 'Mengunggah berkas ke assets/', 'Menghapus folder assets/', 'Mengompres berkas'],
    answer: 0,
    explain: 'FileServer menyajikan isi folder yang ditunjuk http.Dir.'
  },
  {
    id: 'gw20',
    q: 'Sebuah middleware pada dasarnya adalah…',
    options: ['Fungsi yang membungkus handler dan mengembalikan handler baru', 'Tabel database', 'Tipe channel khusus', 'Library eksternal wajib'],
    answer: 0,
    explain: 'Middleware menerima http.HandlerFunc, menambahkan logika, lalu mengembalikan http.HandlerFunc baru.'
  },
  {
    id: 'gw21',
    q: 'Dalam sebuah middleware, memanggil next(w, r) berarti…',
    options: ['Meneruskan permintaan ke handler berikutnya', 'Menutup koneksi', 'Mengulang middleware', 'Menyimpan log'],
    answer: 0,
    explain: 'next adalah handler berikutnya dalam rantai; memanggilnya meneruskan permintaan.'
  },
  {
    id: 'gw22',
    q: 'Fungsi Chain pada contoh middleware lanjutan berguna untuk…',
    options: ['Merangkai beberapa middleware menjadi satu handler', 'Mengenkripsi data', 'Membuka database', 'Membuat route baru'],
    answer: 0,
    explain: 'Chain menerapkan middleware satu per satu sehingga terbentuk rantai pembungkusan.'
  },
  {
    id: 'gw23',
    q: 'Untuk mengukur durasi pemrosesan di middleware, idiom yang dipakai adalah…',
    options: ['start := time.Now(); defer log.Println(time.Since(start))', 'time.Sleep(1)', 'os.Exit(0)', 'defer close(done)'],
    answer: 0,
    explain: 'time.Now mencatat awal, dan time.Since menghitung selisih saat defer dijalankan.'
  },
  {
    id: 'gw24',
    q: 'Cookie sesi pada dasarnya adalah…',
    options: ['Data kecil yang disimpan browser dan dikirim tiap permintaan', 'Berkas di server', 'Tabel database otomatis', 'Nama lain dari JWT'],
    answer: 0,
    explain: 'Cookie disimpan di browser dan otomatis disertakan pada setiap permintaan ke server.'
  },
  {
    id: 'gw25',
    q: 'Pada gorilla/sessions, untuk mengambil sesi dipakai…',
    options: ['store.Get(r, "cookie-name")', 'store.Load("cookie-name")', 'r.Session()', 'sessions.Read(r)'],
    answer: 0,
    explain: 'store.Get mengambil objek sesi berdasarkan nama cookie.'
  },
  {
    id: 'gw26',
    q: 'Mengapa nilai session.Values["authenticated"].(bool) memakai type assertion?',
    options: ['Karena nilai map bertipe interface{} dan perlu dikembalikan ke bool', 'Karena bool tidak didukung Go', 'Karena sesi selalu string', 'Karena itu wajib di semua map'],
    answer: 0,
    explain: 'session.Values menyimpan interface{}, jadi perlu assertion .(bool) untuk membaca nilai bool dengan aman.'
  },
  {
    id: 'gw27',
    q: 'Atribut cookie HttpOnly berguna untuk…',
    options: ['Mencegah cookie diakses oleh JavaScript', 'Mempercepat halaman', 'Menyimpan kata sandi', 'Mengaktifkan HTTPS otomatis'],
    answer: 0,
    explain: 'HttpOnly mencegah skrip sisi klien membaca cookie, sehingga mengurangi risiko pencurian sesi via XSS.'
  },
  {
    id: 'gw28',
    q: 'Package Go yang menyediakan API umum untuk berbagai SQL database adalah…',
    options: ['database/sql', 'sql/driver', 'sqlx/core', 'net/sql'],
    answer: 0,
    explain: 'database/sql menyeragamkan akses; driver khusus menyediakan detail database tertentu.'
  },
  {
    id: 'gw29',
    q: 'Mengapa driver diimpor dengan garis bawah, mis. _ "github.com/go-sql-driver/mysql"?',
    options: ['Karena hanya butuh efek samping pendaftarannya', 'Karena namanya terlalu panjang', 'Karena tidak boleh dipakai', 'Karena itu aturan untuk semua import'],
    answer: 0,
    explain: 'Import _ menjalankan fungsi init driver untuk mendaftarkan dirinya, tanpa memakai nama paket di kode.'
  },
  {
    id: 'gw30',
    q: 'Fungsi db.Ping() dipakai untuk…',
    options: ['Memastikan koneksi database benar-benar bisa dibuat', 'Menghapus tabel', 'Menghitung baris', 'Membuat database baru'],
    answer: 0,
    explain: 'sql.Open hanya menyiapkan pool; db.Ping memverifikasi koneksi ke database.'
  },
  {
    id: 'gw31',
    q: 'Metode yang tepat untuk menjalankan perintah INSERT/UPDATE/DELETE adalah…',
    options: ['db.Exec', 'db.QueryRow', 'db.Query', 'db.Scan'],
    answer: 0,
    explain: 'Exec menjalankan perintah tanpa hasil baris; kembali sql.Result.'
  },
  {
    id: 'gw32',
    q: 'Untuk mengambil tepat satu baris hasil query, dipakai…',
    options: ['db.QueryRow(...).Scan(...)', 'db.Query(...).Next()', 'db.Exec(...).LastInsertId()', 'db.Get(...)'],
    answer: 0,
    explain: 'QueryRow mengambil satu baris, lalu Scan menyalin kolom ke variabel lewat pointer.'
  },
  {
    id: 'gw33',
    q: 'Mengapa harus memanggil defer rows.Close() setelah db.Query?',
    options: ['Agar koneksi dikembalikan ke pool dan tidak bocor', 'Agar query berjalan lebih cepat', 'Agar data terhapus', 'Agar tabel terkunci'],
    answer: 0,
    explain: 'Menutup rows penting supaya koneksi database dilepas kembali ke pool.'
  },
  {
    id: 'gw34',
    q: 'Tanda tanya (?) pada kueri database Go berfungsi sebagai…',
    options: ['Placeholder prepared statement yang aman', 'Komentar SQL', 'Tanda wajib dalam string', 'Operator perbandingan'],
    answer: 0,
    explain: 'Placeholder memisahkan kode SQL dari data sehingga mencegah SQL Injection.'
  },
  {
    id: 'gw35',
    q: 'Struct tag json:"age" pada field Go berguna untuk…',
    options: ['Menentukan nama field di JSON', 'Mengurutkan field', 'Mengubah tipe data', 'Menyembunyikan field dari program'],
    answer: 0,
    explain: 'Tag mengatur nama key JSON; ,omitempty melewati field kosong dan json:"-" menyembunyikannya.'
  },
  {
    id: 'gw36',
    q: 'Cara membaca JSON dari body request menjadi struct adalah…',
    options: ['json.NewDecoder(r.Body).Decode(&user)', 'json.Unmarshal(r.Body, user)', 'json.Parse(r.Body)', 'json.Decode(r.Body, user)'],
    answer: 0,
    explain: 'NewDecoder membaca aliran body; Decode mengisi struct dan butuh pointer (&user).'
  },
  {
    id: 'gw37',
    q: 'Cara menulis JSON sebagai respons HTTP adalah…',
    options: ['json.NewEncoder(w).Encode(data)', 'json.Marshal(w, data)', 'json.Write(w, data)', 'fmt.Println(data)'],
    answer: 0,
    explain: 'NewEncoder menulis JSON langsung ke ResponseWriter; sebaiknya set Content-Type application/json.'
  },
  {
    id: 'gw38',
    q: 'WebSocket berbeda dari HTTP biasa karena…',
    options: ['Membuka koneksi persisten dua arah', 'Lebih lambat', 'Hanya bisa satu arah', 'Tidak butuh server'],
    answer: 0,
    explain: 'WebSocket menjaga satu koneksi terbuka sehingga server dan klien bisa saling mengirim pesan kapan saja.'
  },
  {
    id: 'gw39',
    q: 'Pada gorilla/websocket, upgrader.Upgrade(w, r, nil) berfungsi untuk…',
    options: ['Mengubah koneksi HTTP menjadi WebSocket', 'Mendownload berkas', 'Mengirim email', 'Menutup server'],
    answer: 0,
    explain: 'Upgrade melakukan handshake dan mengembalikan objek koneksi WebSocket.'
  },
  {
    id: 'gw40',
    q: 'Skema URL WebSocket yang aman (lewat TLS) adalah…',
    options: ['wss://', 'ws://', 'http://', 'socket://'],
    answer: 0,
    explain: 'wss:// adalah WebSocket aman di atas TLS, analog dengan https://.'
  },
  {
    id: 'gw41',
    q: 'Mengapa kata sandi tidak boleh disimpan dalam bentuk asli?',
    options: ['Bila database bocor, semua akun langsung terancam', 'Karena terlalu panjang', 'Karena Go melarangnya', 'Karena tidak bisa dicari'],
    answer: 0,
    explain: 'Menyimpan plain text berarti kebocoran database langsung mengekspos semua kata sandi pengguna.'
  },
  {
    id: 'gw42',
    q: 'Algoritma hashing kata sandi yang disarankan pada contoh tersebut adalah…',
    options: ['bcrypt', 'MD5', 'SHA-1', 'Base64'],
    answer: 0,
    explain: 'bcrypt dirancang lambat dan menambahkan salt otomatis; MD5/SHA-1 terlalu cepat untuk kata sandi.'
  },
  {
    id: 'gw43',
    q: 'Fungsi bcrypt.GenerateFromPassword mengembalikan…',
    options: ['Hash beserta salt yang tertanam di dalamnya', 'Kata sandi asli', 'Kunci AES saja', 'Token JWT'],
    answer: 0,
    explain: 'Hash bcrypt menyertakan salt dan parameter cost, sehingga aman disimpan apa adanya.'
  },
  {
    id: 'gw44',
    q: 'Untuk memverifikasi kata sandi terhadap hash, dipakai…',
    options: ['bcrypt.CompareHashAndPassword', 'bcrypt.Decrypt', 'bcrypt.HashAgain', 'bcrypt.Equal'],
    answer: 0,
    explain: 'CompareHashAndPassword mengembalikan nil bila kata sandi cocok dengan hash.'
  },
  {
    id: 'gw45',
    q: 'Angka cost pada bcrypt.GenerateFromPassword mengatur…',
    options: ['Tingkat kesulitan (dan waktu) hashing', 'Panjang kata sandi', 'Jumlah pengguna', 'Nama cookie'],
    answer: 0,
    explain: 'Cost lebih tinggi berarti hashing lebih lambat dan lebih aman, tetapi juga lebih membebani server.'
  }
];
