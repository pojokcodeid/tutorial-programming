/* ============================================================
   Soal kuis Dasar RESTful API — 40 soal (restful01–restful40)
   ============================================================ */
'use strict';

window.RESTFULAPI_QUIZ_POOL = window.RESTFULAPI_QUIZ_POOL || [];

window.RESTFULAPI_QUIZ_POOL.push(
  {
    id: 'restful01',
    q: 'Dalam kehidupan sehari-hari, apa arti API?',
    options: [
      'Bahasa pemrograman khusus untuk membuat website',
      'Aplikasi perbankan yang dibuka lewat HP',
      'Perantara resmi yang membuat dua program bisa saling bertukar data',
      'Nama merek server yang sedang populer'
    ],
    answer: 2,
    explain: 'API (Application Programming Interface) bukan program dan bukan bahasa, melainkan aturan main yang disepakati agar dua program bisa bicara — seperti pelayan restoran yang menjadi perantara antara kamu dan dapur.'
  },
  {
    id: 'restful02',
    q: 'Apa perbedaan utama website dan API?',
    options: [
      'Website disajikan untuk manusia berupa halaman, API disajikan untuk program berupa data terstruktur',
      'Website hanya bisa dibuka di laptop, API hanya di HP',
      'Website memakai HTTPS, API tidak boleh memakai HTTPS',
      'Website selalu gratis, API selalu berbayar'
    ],
    answer: 0,
    explain: 'Satu server bisa melayani keduanya: website menyajikan halaman HTML untuk mata, sedangkan API menyajikan data (biasanya JSON) untuk dibaca program seperti aplikasi Android, iPhone, atau smartwatch.'
  },
  {
    id: 'restful03',
    q: 'Pada analogi restoran, pihak yang disebut "server" adalah…',
    options: [
      'Kamu sebagai tamu yang memesan',
      'Pelayan yang meneruskan pesanan',
      'Menu yang mencatat pilihan makanan',
      'Dapur yang menyimpan dan mengolah makanan'
    ],
    answer: 3,
    explain: 'Server adalah pihak yang menyimpan dan mengolah data, ibarat dapur. Kamu adalah klien, dan API adalah pelayan yang meneruskan pesananmu — kamu tidak pernah masuk ke dapur.'
  },
  {
    id: 'restful04',
    q: 'Saat kamu membayar tagihan lewat aplikasi e-wallet, pihak yang berperan sebagai klien (client) adalah…',
    options: [
      'Aplikasi e-wallet di HP-mu yang mengirim permintaan pembayaran',
      'Bank yang menerima dana',
      'Server penyedia e-wallet',
      'Karyawan bank yang memeriksa transaksi'
    ],
    answer: 0,
    explain: 'Klien adalah pihak yang mengirim permintaan (request). Aplikasi e-wallet-mu meminta server memproses pembayaran, lalu server menjawab dengan response berisi hasil transaksinya.'
  },
  {
    id: 'restful05',
    q: 'Pada URL https://toko.com/api/v1/products?category=sepatu, bagian manakah yang disebut query parameter?',
    options: [
      'https://toko.com',
      '?category=sepatu',
      '/api/v1/products',
      'toko.com/api'
    ],
    answer: 1,
    explain: 'Query dimulai dengan tanda ? berisi kunci=nilai. Bagian category=sepatu adalah instruksi tambahan untuk menyaring data, bukan alamat resource-nya — alamatnya tetap /api/v1/products.'
  },
  {
    id: 'restful06',
    q: 'Apa yang dimaksud dengan endpoint?',
    options: [
      'Tempat menyimpan data di dalam server',
      'Halaman dokumentasi sebuah API',
      'Kombinasi alamat URL dan method yang dipanggil untuk mengakses satu resource',
      'Nama file pada server'
    ],
    answer: 2,
    explain: 'Endpoint = alamat resource yang bisa dipanggil API. Satu endpoint lengkap ditentukan oleh URL plus method, misalnya GET /products untuk membaca daftar produk.'
  },
  {
    id: 'restful07',
    q: 'Mengapa endpoint sebaiknya memakai kata benda seperti /products, bukan kata kerja seperti /getProducts?',
    options: [
      'Karena method HTTP sudah menentukan aksi, sedangkan path menentukan resource yang diaksi',
      'Karena kata kerja dilarang digunakan oleh browser',
      'Karena URL tidak boleh lebih dari 10 karakter',
      'Karena kata benda diproses server lebih cepat'
    ],
    answer: 0,
    explain: 'Aturan mainnya sederhana: method menentukan AKSI (baca, tambah, hapus), path menentukan SIAPA yang diaksi. Jadi GET /products sudah jelas tanpa perlu kata "get" di dalam path.'
  },
  {
    id: 'restful08',
    q: 'Apa saja bagian yang dikirim server dalam satu response?',
    options: [
      'Method, URL, dan cookie saja',
      'Status code, header, dan body',
      'Path, query, dan parameter',
      'Username, password, dan token'
    ],
    answer: 1,
    explain: 'Response terdiri dari status code (hasil permintaan), header (keterangan tambahan), dan body (isi data, biasanya JSON). Seperti surat: tanda terima, amplop, dan isi suratnya.'
  },
  {
    id: 'restful09',
    q: 'Method HTTP apa yang tepat untuk membaca daftar produk pada endpoint /products?',
    options: [
      'GET',
      'POST',
      'DELETE',
      'PATCH'
    ],
    answer: 0,
    explain: 'GET dipakai membaca data tanpa mengubah apa pun, sehingga aman dipanggil berulang. POST untuk membuat, PATCH untuk memperbarui sebagian, dan DELETE untuk menghapus.'
  },
  {
    id: 'restful10',
    q: 'Kamu ingin menambahkan satu produk baru ke /products. Method apa yang tepat?',
    options: [
      'GET',
      'PUT',
      'POST',
      'HEAD'
    ],
    answer: 2,
    explain: 'POST dipakai membuat resource baru: data dikirim lewat body, lalu server biasanya membalas 201 Created beserta id produk yang baru dibuat.'
  },
  {
    id: 'restful11',
    q: 'Apa perbedaan utama PUT dan PATCH?',
    options: [
      'PUT dan PATCH selalu mengirim isi body yang sama persis',
      'PUT mengganti seluruh data resource, PATCH hanya memperbarui sebagian field',
      'PUT hanya untuk membaca, PATCH untuk menghapus',
      'PATCH selalu dijawab dengan status 404'
    ],
    answer: 1,
    explain: 'PUT = mengganti seluruh data, jadi kamu mengirim data lengkap. PATCH = memperbarui sebagian, cukup kirim field yang berubah, misalnya hanya harga.'
  },
  {
    id: 'restful12',
    q: 'Method yang tepat untuk menghapus pesanan bernomor 7 pada endpoint /orders/7 adalah…',
    options: [
      'GET',
      'POST',
      'PUT',
      'DELETE'
    ],
    answer: 3,
    explain: 'DELETE dipakai menghapus resource yang ditunjuk path. Menghapus resource yang sama berkali-kali memberi hasil akhir yang sama (pesanan tetap tidak ada), jadi DELETE bersifat idempotent.'
  },
  {
    id: 'restful13',
    q: 'Untuk mengubah harga satu produk pada /products/42, kombinasi method dan endpoint yang tepat adalah…',
    options: [
      'GET /products/42',
      'DELETE /products/42',
      'PATCH /products/42',
      'POST /products'
    ],
    answer: 2,
    explain: 'Mengubah sebagian data (hanya harga) = PATCH, dan targetnya produk 42 lewat path /products/42. Bila kamu mengganti SELURUH isi produk, gunakan PUT pada path yang sama.'
  },
  {
    id: 'restful14',
    q: 'Manakah method yang meminta server menjawab hanya dengan header respons, tanpa isi body?',
    options: [
      'GET',
      'HEAD',
      'PUT',
      'DELETE'
    ],
    answer: 1,
    explain: 'HEAD hampir seperti GET, tetapi server hanya mengirim header (misalnya untuk mengecek jenis atau ukuran data) tanpa body. Pakai GET bila kamu memang butuh isinya.'
  },
  {
    id: 'restful15',
    q: 'Status code apa yang tepat saat server berhasil membuat data baru?',
    options: [
      '200 OK',
      '404 Not Found',
      '201 Created',
      '204 No Content'
    ],
    answer: 2,
    explain: '201 Created dipakai khusus ketika resource baru berhasil dibuat. 200 untuk sukses umum, 204 untuk sukses tanpa isi respons.'
  },
  {
    id: 'restful16',
    q: 'Server berhasil memperbarui data tetapi tidak perlu mengirim isi balasan. Status code yang tepat adalah…',
    options: [
      '204 No Content',
      '200 OK',
      '400 Bad Request',
      '500 Internal Server Error'
    ],
    answer: 0,
    explain: '204 No Content berarti sukses tetapi tanpa body respons. Cocok ketika klien cukup tahu permintaannya berhasil dan tidak butuh data apa pun kembali.'
  },
  {
    id: 'restful17',
    q: 'Kamu meminta GET /products/999, tetapi produk itu tidak ada. Server seharusnya membalas…',
    options: [
      '200 OK',
      '404 Not Found',
      '301 Moved Permanently',
      '503 Service Unavailable'
    ],
    answer: 1,
    explain: '404 Not Found artinya alamat benar tetapi resource tidak ditemukan. Membalas 200 dengan data kosong justru menyesatkan klien program yang mengira data berhasil dibaca.'
  },
  {
    id: 'restful18',
    q: 'Klien mengirim body JSON yang rusak (tanda kutip tidak ditutup) sehingga tidak bisa dibaca. Status code yang tepat adalah…',
    options: [
      '404 Not Found',
      '401 Unauthorized',
      '500 Internal Server Error',
      '400 Bad Request'
    ],
    answer: 3,
    explain: '400 Bad Request berarti server menolak permintaan karena isinya tidak benar — di sini karena JSON-nya rusak. Kesalahan ada di sisi pengirim (klien), bukan di server.'
  },
  {
    id: 'restful19',
    q: 'Apa perbedaan 401 Unauthorized dan 403 Forbidden?',
    options: [
      '401 = identitas belum terbukti (belum/tidak berhasil login); 403 = sudah dikenal tetapi tidak berhak',
      '401 dipakai klien, 403 dipakai server',
      'Keduanya sama saja dan boleh dipakai bergantian',
      '401 berarti server error, 403 berarti data tidak ditemukan'
    ],
    answer: 0,
    explain: '401 menjawab "siapa kamu? login dulu", sedangkan 403 menjawab "kamu sudah dikenal, tapi akses ini bukan milikmu". Keduanya sering tertukar padahal bedanya jelas.'
  },
  {
    id: 'restful20',
    q: 'User biasa yang sudah login mencoba membuka endpoint khusus admin. Status code yang tepat adalah…',
    options: [
      '401 Unauthorized',
      '403 Forbidden',
      '404 Not Found',
      '200 OK'
    ],
    answer: 1,
    explain: 'Karena identitasnya sudah terbukti (login) tetapi ia tidak berhak, jawabannya 403 Forbidden. 401 hanya untuk yang belum berhasil membuktikan identitasnya.'
  },
  {
    id: 'restful21',
    q: 'Database tiba-tiba error saat memproses permintaan yang sah. Status code yang menunjukkan server bermasalah adalah…',
    options: [
      '400 Bad Request',
      '404 Not Found',
      '500 Internal Server Error',
      '201 Created'
    ],
    answer: 2,
    explain: 'Kategori 5xx berarti kesalahan ada di sisi server. 500 Internal Server Error dipakai ketika server gagal memproses permintaan yang sebenarnya benar.'
  },
  {
    id: 'restful22',
    q: 'Pada status code 404, angka 4 pada posisi pertama menandakan apa?',
    options: [
      'Permintaan berhasil',
      'Perpindahan halaman',
      'Kesalahan pada server',
      'Kesalahan yang berasal dari sisi klien (pengirim request)'
    ],
    answer: 3,
    explain: 'Angka pertama menentukan kategori: 2 = sukses, 3 = pindah, 4 = salah di sisi klien, 5 = salah di server. Jadi 404 = klien meminta resource yang memang tidak ada.'
  },
  {
    id: 'restful23',
    q: 'Manakah aturan penulisan JSON yang benar?',
    options: [
      'Kunci (nama field) wajib ditulis dengan tanda kutip ganda',
      'Kunci boleh ditulis tanpa tanda kutip',
      'Setiap baris wajib diakhiri tanda koma, termasuk elemen terakhir',
      'Nilai teks boleh memakai tanda kutip tunggal'
    ],
    answer: 0,
    explain: 'Di JSON, kunci wajib memakai tanda kutip ganda, begitu pula nilai bertipe teks. Koma hanya sebagai pemisah antar elemen, jadi tidak boleh mengikuti elemen terakhir.'
  },
  {
    id: 'restful24',
    q: 'Tanda kurung siku [] pada JSON dipakai untuk menyimpan…',
    options: [
      'Objek (kumpulan kunci dan nilai)',
      'Daftar nilai yang berurutan (array)',
      'Komentar penjelas untuk pembaca',
      'Judul file data'
    ],
    answer: 1,
    explain: '[] adalah array (daftar), sedangkan {} adalah objek (kumpulan kunci dan nilai). Daftar produk memakai [], satu produk lengkap memakai {}.'
  },
  {
    id: 'restful25',
    q: 'Mengapa hampir semua API modern memakai JSON?',
    options: [
      'Karena JSON hanya bisa dibaca oleh satu server tertentu',
      'Karena JSON wajib dipakai oleh semua bahasa pemrograman',
      'Karena formatnya ringkas, mudah dibaca manusia, dan mudah dipahami program',
      'Karena JSON tidak pernah mengalami kesalahan'
    ],
    answer: 2,
    explain: 'JSON ringan, mudah dibaca saat kamu membaca hasil debug, dan tersedia pembacanya di hampir semua bahasa. Itulah sebabnya JSON menjadi penerus praktis format lama seperti XML.'
  },
  {
    id: 'restful26',
    q: 'Dari JSON {"user":{"name":"Dian","address":{"city":"Bandung"}}}, data yang benar adalah…',
    options: [
      'Dian — Bandung',
      'Dian — Jakarta',
      'User — Dian',
      'City — Dian'
    ],
    answer: 0,
    explain: 'Data bersarang dibaca bertingkat: objek user berisi name = Dian, lalu user → address → city = Bandung. Kunci terakhir setelah tanda titik adalah nilai yang kamu ambil.'
  },
  {
    id: 'restful27',
    q: 'Manakah JSON yang valid?',
    options: [
      '{ nama: "Budi" }',
      '{ "nama": "Budi", "umur": 25 }',
      "{ 'nama': 'Budi' }",
      '{ "nama": "Budi"; }'
    ],
    answer: 1,
    explain: 'JSON yang benar memakai tanda kutip ganda pada kunci dan nilai teks, koma sebagai pemisah, tanpa koma di akhir. Pilihan lain salah: kunci tanpa kutip, memakai kutip tunggal, atau memakai titik-koma.'
  },
  {
    id: 'restful28',
    q: 'Di mana sebaiknya id resource diletakkan ketika ingin menunjuk produk nomor 42?',
    options: [
      'Di path, menjadi /products/42',
      'Di body request, meski method-nya GET',
      'Di header khusus bernama X-Id',
      'Di bagian fragment URL, menjadi /products#42'
    ],
    answer: 0,
    explain: 'Path parameter menunjuk SIAPA resource yang dimaksud. Dengan /products/42, tujuannya sudah jelas tanpa perlu membuka isi body.'
  },
  {
    id: 'restful29',
    q: 'Tempat yang tepat untuk kata kunci pencarian dan nomor halaman adalah…',
    options: [
      'Di path, menjadi /sepatu/2/products',
      'Di body request berformat JSON',
      'Di query, menjadi /products?q=sepatu&page=2',
      'Di status code respons'
    ],
    answer: 2,
    explain: 'Query parameter mengatur CARA membaca data (filter, pencarian, halaman), bukan menentukan resource-nya. Jadi polanya /products?q=sepatu&page=2.'
  },
  {
    id: 'restful30',
    q: 'Data pendaftaran lengkap (nama, email, password) saat membuat akun baru sebaiknya dikirim…',
    options: [
      'Lewat query string agar mudah dilihat',
      'Lewat body request berformat JSON',
      'Lewat path, menjadi /users/nama-email-password',
      'Tidak usah dikirim, server akan menebak sendiri'
    ],
    answer: 1,
    explain: 'Body dipakai untuk isi data yang dibutuhkan saat membuat atau mengubah resource. Kirim dengan POST /users dan body JSON — bukan lewat path yang kepanjangan.'
  },
  {
    id: 'restful31',
    q: 'Mengapa password tidak boleh diletakkan di query parameter?',
    options: [
      'Karena query hanya menerima angka',
      'Karena query tidak pernah dikirim ke server',
      'Karena query membuat respons menjadi lambat',
      'Karena isinya tercatat di riwayat URL dan log server sehingga mudah bocor'
    ],
    answer: 3,
    explain: 'URL lengkap beserta query sering tersimpan di riwayat browser, log server, dan perantara. Rahasia seperti password seharusnya dikirim lewat body, bukan terpampang di alamat.'
  },
  {
    id: 'restful32',
    q: 'Apa arti header Content-Type: application/json pada sebuah request?',
    options: [
      'Server diminta mengembalikan data berformat JSON',
      'Isi body request tersebut berupa JSON',
      'Token pengirim berbentuk JSON',
      'File yang dikirimkan adalah JSON'
    ],
    answer: 1,
    explain: 'Content-Type menceritakan ISI yang sedang kamu kirim; lawannya adalah Accept yang menyatakan isi apa yang kamu mau diterima. Jadi application/json di sini berarti "body-ku JSON".'
  },
  {
    id: 'restful33',
    q: 'Apa arti REST dalam RESTful API?',
    options: [
      'Nama database yang dipakai menyimpan data',
      'Bahasa pemrograman khusus untuk membuat API',
      'Gaya merancang API berupa kumpulan aturan agar API konsisten dan mudah ditebak',
      'Nama aplikasi untuk menguji API'
    ],
    answer: 2,
    explain: 'REST (Representational State Transfer) bukan program, protokol, maupun bahasa — ia kumpulan aturan perancangan. API yang taat pada aturan itu disebut RESTful.'
  },
  {
    id: 'restful34',
    q: 'Apa maksud prinsip REST "stateless"?',
    options: [
      'Server tidak boleh menyimpan data sama sekali',
      'Server tidak mengingat percakapan sebelumnya, jadi setiap request harus membawa identitasnya sendiri',
      'Klien tidak boleh menyimpan apa pun di browser',
      'Respons server harus selalu kosong'
    ],
    answer: 1,
    explain: 'Analoginya ke bank: setiap kali datang kamu membawa KTP, bukan mengandalkan satpam yang mengingatmu. Begitu pula tiap request membawa identitasnya sendiri, misalnya lewat header Authorization.'
  },
  {
    id: 'restful35',
    q: 'Manakah penulisan endpoint yang benar untuk daftar pesanan pengguna?',
    options: [
      '/getUserOrders',
      '/Orders/ListAll',
      '/GET/orders',
      '/orders'
    ],
    answer: 3,
    explain: 'Endpoint yang baik memakai kata benda jamak, huruf kecil, tanpa kata kerja: /orders. Aksinya sudah dibawa oleh method, misalnya GET /orders untuk membacanya.'
  },
  {
    id: 'restful36',
    q: 'Mengapa URL API sering memuat versi seperti /api/v1/products?',
    options: [
      'Agar perubahan besar tidak langsung merusak aplikasi lama yang masih memakai versi sebelumnya',
      'Agar URL terlihat lebih panjang dan profesional',
      'Agar server tidak perlu memvalidasi request',
      'Agar ada tempat menyimpan password'
    ],
    answer: 0,
    explain: 'Saat aturan main berubah drastis, kamu merilis /v2. Aplikasi lama tetap jalan di /v1 sampai siap pindah — itulah gunanya penomoran versi.'
  },
  {
    id: 'restful37',
    q: 'Mengapa GET termasuk method yang aman dipanggil berkali-kali?',
    options: [
      'Karena GET selalu lebih cepat daripada method lain',
      'Karena GET hanya membaca dan tidak mengubah data di server',
      'Karena GET tidak membutuhkan URL',
      'Karena GET otomatis menghapus duplikat data'
    ],
    answer: 1,
    explain: 'Safe berarti tidak mengubah keadaan server. Karena GET hanya membaca, memanggilnya sepuluh kali memberi hasil yang sama dan tidak ada data yang berubah.'
  },
  {
    id: 'restful38',
    q: 'Jika DELETE /orders/7 dipanggil dua kali, bagaimana hasil akhirnya?',
    options: [
      'Hasil akhirnya tetap sama: pesanan 7 memang sudah tidak ada (idempotent)',
      'Pesanan jadi "terhapus dua kali" sehingga data server rusak',
      'Server membalas 201 Created pada panggilan kedua',
      'Kedua request justru membuat pesanan baru'
    ],
    answer: 0,
    explain: 'Idempotent berarti mengulang memberi hasil akhir yang sama. Panggilan kedua boleh jadi membalas 404 karena datanya sudah hilang, tetapi keadaan akhir sang data tidak berubah.'
  },
  {
    id: 'restful39',
    q: 'Kamu menekan tombol "buat pesanan" di aplikasi GoFood dua kali dengan cepat. Apa risikonya?',
    options: [
      'Server otomatis menggabungkan jadi satu pesanan',
      'Tidak ada risiko apa pun, POST selalu idempotent',
      'Pesanan dibuat dua kali, karena POST tidak idempotent',
      'Pesanan pertama dibatalkan otomatis oleh server'
    ],
    answer: 2,
    explain: 'POST dipakai membuat data baru, sehingga setiap pemanggilan menghasilkan data baru. Itulah sebabnya tombol kirim sebaiknya dinonaktifkan setelah sekali tekan.'
  },
  {
    id: 'restful40',
    q: 'Saat memanggil API dari kode JavaScript dengan fetch, apa yang sebaiknya diperiksa lebih dulu sebelum memproses data?',
    options: [
      'Panjang URL yang dipanggil',
      'Jumlah header yang diterima',
      'Nama file JavaScript yang dipakai',
      'Status code respons (misalnya lewat res.ok) untuk memastikan permintaan berhasil'
    ],
    answer: 3,
    explain: 'Server bisa menjawab 404 atau 500 sambil tetap mengirim isi respons. Dengan mengecek status lebih dulu — di Postman juga kelihatan di panel status — kamu bisa menampilkan pesan error yang ramah, bukan data rusak.'
  }
);
