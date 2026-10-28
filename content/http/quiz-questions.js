/* ============================================================
   Soal kuis HTTP — 40 soal (http01–http40)
   ============================================================ */
'use strict';

window.HTTP_QUIZ_POOL = window.HTTP_QUIZ_POOL || [];

window.HTTP_QUIZ_POOL.push(
  {
    id: 'http01',
    q: 'Apa arti HTTP bersifat stateless?',
    options: [
      'Server tidak menyimpan konteks percakapan antar-request secara otomatis',
      'Server tidak boleh menyimpan data ke database',
      'Client tidak boleh mengirim cookie',
      'Setiap request wajib memakai HTTPS'
    ],
    answer: 0,
    explain: 'Stateless berarti server tidak mengingat request sebelumnya secara otomatis. State aplikasi seperti login harus dibawa lewat cookie, session, atau token.'
  },
  {
    id: 'http02',
    q: 'Bagaimana perlakuan fragment (#bagian) pada URL?',
    options: [
      'Dikirim sebagai query string',
      'Dikirim di body request',
      'Tidak dikirim ke server; diproses browser',
      'Dikirim melalui header Host'
    ],
    answer: 2,
    explain: 'Fragment hanya dipakai browser untuk menavigasi bagian dokumen. Bagian itu tidak menjadi bagian request target yang dikirim ke server.'
  },
  {
    id: 'http03',
    q: 'Parameter filter dan pagination paling tepat diletakkan di mana?',
    options: [
      'Body JSON',
      'Header Authorization',
      'Fragment URL',
      'Query string'
    ],
    answer: 3,
    explain: 'Query string cocok untuk parameter yang mengubah cara resource dibaca, seperti filter, sorting, dan pagination.'
  },
  {
    id: 'http04',
    q: 'Method manakah yang termasuk safe karena tidak dimaksudkan mengubah state server?',
    options: ['POST', 'PATCH', 'GET', 'DELETE'],
    answer: 2,
    explain: 'GET (dan HEAD) bersifat safe: tujuannya membaca, bukan mengubah state. POST, PATCH, dan DELETE mengubah state.'
  },
  {
    id: 'http05',
    q: 'Apa makna idempotent pada HTTP?',
    options: [
      'Response harus identik byte demi byte setiap kali diulang',
      'Request tidak boleh disimpan cache',
      'Pengulangan request memberi efek yang setara dengan satu kali eksekusi',
      'Method harus selalu GET'
    ],
    answer: 2,
    explain: 'Idempotensi berbicara tentang efek akhir, bukan kesamaan response. Response pengulangan boleh berbeda selama keadaan akhirnya setara.'
  },
  {
    id: 'http06',
    q: 'Apa perbedaan utama PUT dan PATCH?',
    options: [
      'PUT untuk perubahan parsial, PATCH untuk mengganti seluruh resource',
      'PUT mengganti seluruh representasi, PATCH menerapkan perubahan parsial',
      'Keduanya selalu identik',
      'PATCH hanya boleh dipakai untuk file'
    ],
    answer: 1,
    explain: 'PUT mengirim representasi lengkap pengganti, sedangkan PATCH hanya mengirim bagian yang berubah.'
  },
  {
    id: 'http07',
    q: 'Status apa yang tepat untuk DELETE yang berhasil dan tidak mengembalikan body?',
    options: ['200 OK', '201 Created', '302 Found', '204 No Content'],
    answer: 3,
    explain: '204 No Content berarti request berhasil tetapi tidak ada representasi response yang perlu dikirim.'
  },
  {
    id: 'http08',
    q: 'Apa perbedaan 401 dan 403?',
    options: [
      '401 berarti identitas belum valid; 403 berarti identitas valid tetapi izin kurang',
      '401 berarti izin kurang; 403 berarti belum login',
      'Keduanya sama saja',
      '401 adalah error server; 403 adalah error client'
    ],
    answer: 0,
    explain: '401 menandakan kredensial tidak ada atau tidak valid. 403 menandakan identitas sudah dikenali, tetapi tindakannya tidak diizinkan.'
  },
  {
    id: 'http09',
    q: 'JSON valid tetapi berisi harga negatif. Status yang paling tepat adalah...',
    options: ['400 Bad Request', '401 Unauthorized', '500 Internal Server Error', '422 Unprocessable Content'],
    answer: 3,
    explain: 'Bentuk JSON valid, tetapi data gagal aturan bisnis. 422 lebih tepat daripada 400 yang biasanya untuk kesalahan sintaks atau bentuk request.'
  },
  {
    id: 'http10',
    q: 'Respons sukses pembuatan resource baru sebaiknya memakai status dan header apa?',
    options: [
      '200 OK tanpa header tambahan',
      '201 Created dengan Location',
      '204 No Content dengan ETag',
      '302 Found dengan Retry-After'
    ],
    answer: 1,
    explain: '201 Created menunjukkan resource baru dibuat. Header Location memberi tahu URI resource tersebut.'
  },
  {
    id: 'http11',
    q: 'Apa perbedaan Content-Type dan Accept?',
    options: [
      'Content-Type untuk respons; Accept untuk body request',
      'Content-Type menjelaskan format body yang dikirim; Accept menyatakan format respons yang diinginkan',
      'Keduanya mengatur kompresi',
      'Accept dipakai untuk autentikasi'
    ],
    answer: 1,
    explain: 'Content-Type menjelaskan representasi yang dikirim. Accept menyatakan preferensi format respons dari client.'
  },
  {
    id: 'http12',
    q: 'Apa fungsi header Vary?',
    options: [
      'Menentukan versi API',
      'Menentukan status redirect',
      'Memberi tahu cache bahwa isi respons bergantung pada header tertentu',
      'Mengompresi body response'
    ],
    answer: 2,
    explain: 'Vary memasukkan header tertentu ke kunci cache. Contohnya Vary: Accept mencegah cache menyajikan HTML kepada client yang meminta JSON.'
  },
  {
    id: 'http13',
    q: 'Apa yang terjadi bila If-None-Match cocok dengan ETag resource?',
    options: ['200 dengan body penuh', '401 Unauthorized', '500 Internal Server Error', '304 Not Modified tanpa body'],
    answer: 3,
    explain: 'Jika ETag masih cocok, server membalas 304 dan client memakai salinan cache yang dimilikinya.'
  },
  {
    id: 'http14',
    q: 'Apa perbedaan no-cache dan no-store?',
    options: [
      'no-cache melarang penyimpanan; no-store mewajibkan validasi',
      'no-cache boleh menyimpan tetapi wajib validasi; no-store melarang penyimpanan',
      'Keduanya sama persis',
      'no-store hanya berlaku untuk HTTPS'
    ],
    answer: 1,
    explain: 'no-cache masih mengizinkan cache menyimpan respons asalkan divalidasi ulang. no-store melarang penyimpanan sama sekali.'
  },
  {
    id: 'http15',
    q: 'Apa fungsi atribut HttpOnly pada cookie?',
    options: [
      'Cookie hanya dikirim melalui HTTPS',
      'Cookie hanya berlaku untuk satu path',
      'Cookie tidak dapat dibaca oleh JavaScript',
      'Cookie otomatis kedaluwarsa saat logout'
    ],
    answer: 2,
    explain: 'HttpOnly mencegah JavaScript membaca cookie, sehingga mengurangi dampak pencurian sesi melalui XSS. Atribut ini bukan pengganti HTTPS.'
  },
  {
    id: 'http16',
    q: 'Atribut SameSite pada cookie mengatur apa?',
    options: [
      'Pengiriman cookie pada request lintas situs',
      'Enkripsi nilai cookie',
      'Penghapusan cookie saat logout',
      'Path yang boleh menerima cookie'
    ],
    answer: 0,
    explain: 'SameSite membatasi pengiriman cookie pada konteks lintas situs, misalnya Strict, Lax, atau None. Ini salah satu lapisan pertahanan terhadap CSRF.'
  },
  {
    id: 'http17',
    q: 'Apa perbedaan session berbasis server dan token yang dibawa client?',
    options: [
      'Session tidak bisa dicabut',
      'Token selalu lebih aman dalam segala situasi',
      'Session menyimpan state di server; token membawa bukti identitas di client',
      'Session tidak memerlukan identifier'
    ],
    answer: 2,
    explain: 'Session menyimpan data di server dan browser hanya memegang identifier. Token dibawa client dan diverifikasi pada setiap request, dengan trade-off pencabutan yang berbeda.'
  },
  {
    id: 'http18',
    q: 'Pernyataan yang benar tentang JWT adalah...',
    options: [
      'Isi JWT selalu terenkripsi sehingga aman menyimpan password',
      'Klaim JWT dapat dibaca; jangan menaruh rahasia dan selalu verifikasi signature serta exp',
      'JWT tidak memiliki masa berlaku',
      'JWT hanya bisa disimpan di cookie'
    ],
    answer: 1,
    explain: 'JWT yang ditandatangani tidak otomatis terenkripsi. Siapa pun yang memegang token dapat membaca klaimnya, jadi jangan menyimpan data rahasia di dalamnya.'
  },
  {
    id: 'http19',
    q: 'Method apa yang dipakai browser untuk CORS preflight?',
    options: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    answer: 3,
    explain: 'Preflight adalah request OPTIONS yang menanyakan method dan header apa yang diizinkan sebelum request sebenarnya dikirim.'
  },
  {
    id: 'http20',
    q: 'Konfigurasi CORS yang benar untuk request dengan credentials adalah...',
    options: [
      'Access-Control-Allow-Origin: * dan Allow-Credentials: true',
      'Origin spesifik dan Access-Control-Allow-Credentials: true',
      'Tidak perlu header apa pun',
      'Cukup Access-Control-Allow-Methods'
    ],
    answer: 1,
    explain: 'Wildcard tidak boleh dipakai bersama credentials. Server harus menyebut origin spesifik dan mengirim Vary: Origin agar cache tidak salah menyajikan izin.'
  },
  {
    id: 'http21',
    q: 'Pernyataan yang tepat tentang CORS adalah...',
    options: [
      'CORS membatasi akses browser dan bukan pengganti otorisasi server',
      'CORS melindungi API dari pemanggilan curl',
      'CORS adalah mekanisme autentikasi pengguna',
      'CORS menggantikan CSRF token'
    ],
    answer: 0,
    explain: 'CORS diberlakukan browser. Client non-browser seperti curl tidak tunduk padanya, sehingga autentikasi dan otorisasi tetap wajib di server.'
  },
  {
    id: 'http22',
    q: 'Kombinasi mitigasi CSRF yang tepat adalah...',
    options: [
      'SameSite, CSRF token, dan verifikasi Origin',
      'Menyimpan token di URL',
      'Mematikan HTTPS',
      'Cukup memakai CORS wildcard'
    ],
    answer: 0,
    explain: 'CSRF dicegah berlapis dengan SameSite, token anti-CSRF, dan pemeriksaan Origin/Referer. Jangan mengubah state melalui GET.'
  },
  {
    id: 'http23',
    q: 'Mitigasi dasar untuk XSS adalah...',
    options: [
      'Escape output, CSP, dan hindari innerHTML dengan input mentah',
      'Hanya memakai HTTPS',
      'Menonaktifkan semua cookie',
      'Memperpanjang masa berlaku token'
    ],
    answer: 0,
    explain: 'XSS adalah eksekusi skrip di halaman tepercaya. Escape output, Content-Security-Policy, dan penghindaran penyisipan HTML mentah adalah pertahanan utama.'
  },
  {
    id: 'http24',
    q: 'Apa yang diberikan TLS pada koneksi HTTPS?',
    options: [
      'Jaminan aplikasi bebas bug',
      'Pengganti otorisasi pengguna',
      'Kerahasiaan, integritas, dan autentikasi server',
      'Penyembunyian seluruh metadata jaringan'
    ],
    answer: 2,
    explain: 'TLS melindungi isi komunikasi, mendeteksi perubahan, dan mengautentikasi server melalui sertifikat. TLS tidak menggantikan keamanan aplikasi.'
  },
  {
    id: 'http25',
    q: 'Apa fungsi header Strict-Transport-Security (HSTS)?',
    options: [
      'Mengompresi response',
      'Menolak semua cookie',
      'Mengatur kebijakan cache',
      'Memerintahkan browser memakai HTTPS untuk host tertentu'
    ],
    answer: 3,
    explain: 'HSTS membuat browser selalu memakai HTTPS untuk host tersebut selama masa berlaku yang ditentukan, sehingga mengurangi risiko downgrade.'
  },
  {
    id: 'http26',
    q: 'Sertifikat self-signed pada latihan HTTPS...',
    options: [
      'Otomatis dipercaya semua browser',
      'Cocok untuk latihan, tetapi client harus memberi pengecualian verifikasi secara sadar',
      'Wajib dipakai di produksi',
      'Menggantikan kebutuhan certificate authority'
    ],
    answer: 1,
    explain: 'Sertifikat self-signed tidak ditandatangani CA tepercaya. Client akan menolaknya kecuali trust store atau pengecualian khusus ditambahkan untuk latihan.'
  },
  {
    id: 'http27',
    q: 'Apa keunggulan utama multiplexing pada HTTP/2?',
    options: [
      'Banyak request dapat berjalan paralel dalam satu koneksi',
      'Setiap request memakai koneksi baru',
      'HTTP/2 hanya berjalan di atas UDP',
      'HTTP/2 menghapus semua header'
    ],
    answer: 0,
    explain: 'HTTP/2 memecah pesan menjadi frame dan menjalankan banyak stream dalam satu koneksi, sehingga mengurangi kebutuhan koneksi paralel.'
  },
  {
    id: 'http28',
    q: 'HPACK pada HTTP/2 digunakan untuk...',
    options: [
      'Mengautentikasi pengguna',
      'Menentukan status code',
      'Mengompresi header',
      'Mengatur cache response'
    ],
    answer: 2,
    explain: 'HPACK mengompresi header dengan tabel statis dan dinamis, mengurangi overhead header yang berulang.'
  },
  {
    id: 'http29',
    q: 'HTTP/3 berjalan di atas transport apa?',
    options: [
      'TCP dengan TLS 1.2',
      'UDP tanpa enkripsi',
      'SCTP',
      'QUIC di atas UDP dengan TLS 1.3'
    ],
    answer: 3,
    explain: 'HTTP/3 memakai QUIC, yang berjalan di atas UDP dan mengintegrasikan TLS 1.3 serta stream independen.'
  },
  {
    id: 'http30',
    q: 'Apa ciri persistent connection pada HTTP/1.1?',
    options: [
      'Koneksi dipakai ulang untuk beberapa request berurutan',
      'Setiap request wajib membuka koneksi baru',
      'Pipelining selalu diaktifkan',
      'Keep-alive tidak didukung'
    ],
    answer: 0,
    explain: 'HTTP/1.1 memakai koneksi persisten secara default sehingga beberapa request dapat memakai koneksi TCP yang sama secara berurutan.'
  },
  {
    id: 'http31',
    q: 'Apa arti status 502 Bad Gateway?',
    options: [
      'Backend berhasil memproses request',
      'Client salah memasukkan password',
      'Gateway gagal memperoleh respons yang valid dari upstream',
      'Response diambil dari cache'
    ],
    answer: 2,
    explain: '502 menandakan masalah di antara gateway/proxy dan upstream, misalnya upstream mati atau mengirim respons tidak valid.'
  },
  {
    id: 'http32',
    q: 'Status 504 Gateway Timeout biasanya muncul ketika...',
    options: [
      'Resource tidak ditemukan',
      'Validasi bisnis gagal',
      'Method tidak didukung',
      'Gateway kehabisan waktu menunggu upstream'
    ],
    answer: 3,
    explain: '504 berarti proxy atau gateway menunggu upstream terlalu lama. Backend bisa jadi masih memproses, tetapi gateway sudah menyerah.'
  },
  {
    id: 'http33',
    q: 'Bagaimana sikap yang benar terhadap header X-Forwarded-For?',
    options: [
      'Selalu percaya dari client mana pun',
      'Hanya percaya dari proxy tepercaya dan pastikan nilainya dibersihkan atau ditimpa dengan benar',
      'Gunakan sebagai pengganti Authorization',
      'Gunakan sebagai header cache'
    ],
    answer: 1,
    explain: 'Header forwarded dapat dipalsukan jika backend dapat diakses langsung. Batasi akses backend ke proxy tepercaya dan tangani rantai header dengan benar.'
  },
  {
    id: 'http34',
    q: 'Strategi retry yang aman adalah...',
    options: [
      'Mengulang semua POST tanpa idempotency key',
      'Exponential backoff dengan jitter, hanya untuk operasi yang aman atau idempotent',
      'Mengulang secepat mungkin tanpa batas',
      'Tidak pernah melakukan retry dalam kondisi apa pun'
    ],
    answer: 1,
    explain: 'Backoff mencegah badai request, jitter menyebarkan waktu percobaan, dan retry hanya boleh untuk operasi yang aman diulang.'
  },
  {
    id: 'http35',
    q: 'URI mana yang paling sesuai dengan desain resource-oriented?',
    options: [
      'GET /getProducts?id=4',
      'POST /deleteProduct',
      'GET /products/delete/4',
      'GET /products/4'
    ],
    answer: 3,
    explain: 'Resource sebaiknya berupa kata benda dan aksi dinyatakan oleh method. GET /products/4 menunjuk produk tertentu dengan cara yang konsisten.'
  },
  {
    id: 'http36',
    q: 'Apa keunggulan cursor pagination dibanding offset pagination?',
    options: [
      'Lebih stabil ketika data berubah saat client berpindah halaman',
      'Selalu memungkinkan lompat ke halaman mana pun',
      'Tidak memerlukan query string',
      'Hanya dapat dipakai untuk file'
    ],
    answer: 0,
    explain: 'Cursor menandai posisi data, sehingga penambahan atau penghapusan data tidak mudah menyebabkan item terlewat atau terduplikasi seperti pada offset.'
  },
  {
    id: 'http37',
    q: 'Apa fungsi Idempotency-Key pada operasi POST?',
    options: [
      'Membuat token JWT',
      'Mengenkripsi body request',
      'Menggantikan status 201',
      'Mencegah operasi yang sama dieksekusi berulang saat request diulang'
    ],
    answer: 3,
    explain: 'Server menyimpan hasil untuk key tertentu. Request ulang dengan key yang sama mengembalikan hasil yang sama tanpa membuat duplikat.'
  },
  {
    id: 'http38',
    q: 'Apa perbedaan utama SSE dan WebSocket?',
    options: [
      'SSE satu arah server ke client; WebSocket mendukung komunikasi dua arah',
      'SSE dua arah; WebSocket hanya satu arah',
      'Keduanya identik',
      'WebSocket hanya dipakai untuk mengunduh file'
    ],
    answer: 0,
    explain: 'SSE memakai HTTP untuk stream satu arah dari server. WebSocket menyediakan saluran dua arah dengan manajemen koneksi tersendiri.'
  },
  {
    id: 'http39',
    q: 'Opsi curl mana yang membuat curl mengikuti redirect?',
    options: ['-i', '-c', '-L', '-k'],
    answer: 2,
    explain: 'Tanpa -L, curl berhenti pada respons 3xx dan menampilkan header Location. Opsi -L membuatnya mengikuti redirect sampai tujuan akhir.'
  },
  {
    id: 'http40',
    q: 'Jika time_starttransfer (TTFB) tinggi tetapi transfer body cepat, penyebab yang paling mungkin adalah...',
    options: [
      'DNS gagal menerjemahkan nama host',
      'Server lambat memproses sebelum mengirim byte pertama',
      'Ukuran body terlalu kecil',
      'Sertifikat TLS kedaluwarsa'
    ],
    answer: 1,
    explain: 'TTFB mengukur waktu sampai byte pertama response. Jika transfer setelahnya cepat, latensi besar kemungkinan berasal dari pemrosesan server atau dependency, bukan bandwidth.'
  }
);
