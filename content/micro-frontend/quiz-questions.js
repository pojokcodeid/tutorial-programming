/* ============================================================
   Kuis Micro-Frontend — 60 Soal Pilihan Ganda (3 per bab)
   Digabung dari quiz-part-1..4; setiap bab punya 3 soal.
   ============================================================ */
'use strict';

window.MICROFRONTEND_QUIZ_POOL = window.MICROFRONTEND_QUIZ_POOL || [];

window.MICROFRONTEND_QUIZ_POOL.push(
/* ---------------- Bab 1 — Konsep ---------------- */
  {
    id: 'mf01',
    q: 'Apa yang paling tepat membedakan micro-frontend dari modular monolith?',
    options: [
      'Micro-frontend selalu memecah kode menjadi berkas yang lebih kecil agar bundel turun',
      'Modular monolith memiliki batas modul tetapi tetap satu build dan satu runtime; micro-frontend menggabungkan aplikasi milik tim berbeda saat runtime',
      'Modular monolith tidak memiliki kepemilikan tim, sedangkan micro-frontend selalu memakai iframe',
      'Micro-frontend tidak membutuhkan shell karena setiap remote memiliki URL sendiri'
    ],
    answer: 1,
    explain: 'Modular monolith sudah memisahkan tanggung jawab ke dalam modul, tetapi semuanya masih dibangun dan dirilis sebagai satu aplikasi. Micro-frontend menambahkan komposisi runtime serta kemandirian rilis per bagian. Karena itu micro-frontend menyelesaikan masalah organisasi, bukan sekadar masalah ukuran berkas.'
  },
  {
    id: 'mf02',
    q: 'Tim kamu hanya dua orang, aplikasi masih CRUD sederhana, dan belum ada CI/CD otomatis. Keputusan paling masuk akal adalah…',
    options: [
      'Tetap memakai modular monolith dan menunda micro-frontend sampai masalah organisasinya nyata',
      'Langsung memecah setiap halaman menjadi remote agar siap ketika tim bertambah',
      'Memakai iframe untuk semua halaman supaya isolasi CSS maksimal',
      'Membuat empat remote dan satu shell agar setiap pengembang punya aplikasi sendiri'
    ],
    answer: 0,
    explain: 'Micro-frontend membeli kecepatan rilis dengan biaya kontrak, CORS, manifest, build terpisah, dan pengujian lintas aplikasi. Pada tim yang sangat kecil, biaya orkestrasi itu belum tentu terbayar. Modular monolith dengan batas modul yang jelas biasanya lebih murah dan tetap bisa dipecah nanti.'
  },
  {
    id: 'mf03',
    q: 'Saat menulis ADR untuk TokoMicro, manakah yang merupakan konsekuensi negatif yang jujur?',
    options: [
      'Tidak ada konsekuensi negatif karena micro-frontend selalu lebih sederhana',
      'Lisensi React harus dibayar terpisah untuk setiap remote',
      'Muncul kebutuhan kontrak, CORS, manifest versi, build terpisah, dan pengujian lintas remote',
      'Semua remote wajib memakai bahasa pemrograman yang berbeda'
    ],
    answer: 2,
    explain: 'ADR yang baik mencatat biaya keputusan, bukan hanya manfaatnya. Pada micro-frontend, biaya itu meliputi kontrak antar tim, pengaturan origin dan CORS, manifest versi, pipeline per remote, serta pengujian komposisi. Menyembunyikan biaya ini membuat keputusan sulit dievaluasi ulang.'
  },

  /* ---------------- Bab 2 — Anatomi & Komposisi ---------------- */
  {
    id: 'mf04',
    q: 'Manakah pembagian tanggung jawab yang benar antara shell dan remote?',
    options: [
      'Shell memanggil semua API bisnis remote, sedangkan remote hanya menampilkan HTML',
      'Shell memiliki URL, layout, login, dan error boundary; remote memiliki rute internal serta API fiturnya sendiri',
      'Remote memiliki BrowserRouter sendiri dan shell hanya menyediakan CSS',
      'Shell mengimpor komponen internal setiap remote agar tampilannya seragam'
    ],
    answer: 1,
    explain: 'Shell adalah pemilik halaman: URL, layout, sesi, dan isolasi kegagalan. Remote bertanggung jawab atas fitur dan datanya sendiri, lalu berkomunikasi lewat kontrak ctx. Shell yang memanggil API bisnis remote atau mengimpor berkas internalnya akan menghapus batas kepemilikan yang justru ingin dibangun.'
  },
  {
    id: 'mf05',
    q: 'Sebuah aplikasi legacy berbasis jQuery akan dipertahankan enam bulan lagi. Isolasi CSS dan JavaScript harus mutlak, sementara SEO halaman itu tidak penting. Teknik komposisi paling tepat adalah…',
    options: [
      'Module Federation dengan shared React singleton',
      'Paket monorepo yang di-bundle ulang bersama shell',
      'iframe karena memberi isolasi dokumen dan origin paling kuat',
      'Import map tanpa bundler agar jQuery dapat dimuat sebagai ESM'
    ],
    answer: 2,
    explain: 'Iframe menjalankan dokumen terpisah sehingga CSS dan JavaScript legacy tidak dapat menjangkau shell. Harganya adalah pengaturan ukuran, navigasi yang terasa terpisah, serta SEO dan aksesibilitas yang lebih sulit. Untuk aplikasi asing yang akan segera dihapus, biaya itu masih wajar dibanding memaksakan integrasi React.'
  },
  {
    id: 'mf06',
    q: 'Mengapa remote produk memakai <Routes> bersarang saat di dalam shell, tetapi MemoryRouter saat mandiri?',
    options: [
      'Karena BrowserRouter tidak boleh dipasang dua kali; shell menyediakan BrowserRouter, sedangkan mode mandiri memakai MemoryRouter agar URL host tidak terganggu',
      'Karena MemoryRouter lebih cepat dan harus dipakai di produksi',
      'Karena remote tidak boleh memiliki rute sama sekali',
      'Karena Module Federation hanya mendukung MemoryRouter'
    ],
    answer: 0,
    explain: 'Di dalam shell, sudah ada satu BrowserRouter yang mengendalikan URL. Remote cukup merender Routes bersarang di bawah rute seperti /katalog/*. Saat berdiri sendiri, MemoryRouter memberi konteks routing tanpa mengubah URL halaman uji, sehingga remote tetap bisa dikembangkan dan diuji tanpa shell.'
  },

  /* ---------------- Bab 3 — Monorepo ---------------- */
  {
    id: 'mf07',
    q: 'Apa fungsi perintah npm run typecheck --workspaces --if-present di root monorepo?',
    options: [
      'Menjalankan typecheck hanya pada paket yang namanya diawali @tokomicro',
      'Menjalankan script typecheck di semua workspace yang memilikinya, lalu melewati workspace yang tidak memilikinya',
      'Mengubah semua berkas TypeScript menjadi JavaScript sebelum build',
      'Memasang TypeScript di setiap workspace secara otomatis'
    ],
    answer: 1,
    explain: 'Flag --workspaces membuat npm menjalankan script di seluruh workspace, sedangkan --if-present mencegah kegagalan pada paket yang belum mendefinisikan script tersebut. Dengan begitu root dapat menjadi satu pintu pemeriksaan tanpa memaksa setiap paket memiliki script yang sama. Hasil akhirnya harus exit code 0 dan tanpa error tipe.'
  },
  {
    id: 'mf08',
    q: 'Setelah monorepo disiapkan, remote menampilkan Invalid hook call. Pemeriksaan paling tepat adalah…',
    options: [
      'Menghapus semua hook dari komponen remote',
      'Mengganti BrowserRouter dengan MemoryRouter di shell',
      'Memeriksa npm ls react dan menyamakan versi React serta ReactDOM di semua workspace',
      'Menambahkan port baru untuk setiap remote'
    ],
    answer: 2,
    explain: 'Invalid hook call sering muncul ketika dua salinan React aktif di halaman yang sama, misalnya karena versi berbeda antar workspace. Periksa dengan npm ls react, samakan versi, lalu pastikan Module Federation memakai shared singleton untuk React dan ReactDOM. Menghapus hook hanya menutupi gejala, bukan penyebabnya.'
  },
  {
    id: 'mf09',
    q: 'Pernyataan mana yang benar tentang monorepo TokoMicro?',
    options: [
      'Semua aplikasi harus dibangun menjadi satu bundel agar bisa berbagi kode',
      'Monorepo menghapus kebutuhan rilis mandiri karena semua workspace selalu naik versi bersamaan',
      'Setiap aplikasi tetap punya package.json dan build sendiri; monorepo hanya menyatukan repositori, instalasi, dan konfigurasi dasar',
      'Monorepo mewajibkan semua remote memakai port yang sama'
    ],
    answer: 2,
    explain: 'Monorepo adalah keputusan tentang tempat kode dan pengelolaan dependensi, bukan tentang cara aplikasi dirilis. apps/header dan apps/products tetap menghasilkan build masing-masing dan dapat diunggah sendiri. Yang dibagi adalah repositori, satu npm install, tsconfig.base, dan orkestrasi Turbo.'
  },

  /* ---------------- Bab 4 — Shell React ---------------- */
  {
    id: 'mf10',
    q: 'Mengapa BrowserRouter hanya dipasang di shell dan tidak di setiap remote?',
    options: [
      'Karena BrowserRouter tidak mendukung TypeScript',
      'Karena satu halaman hanya boleh memiliki satu pengendali URL; remote cukup memakai Routes bersarang agar navigasi tidak berebut kendali',
      'Karena BrowserRouter membuat remote tidak bisa di-lazy-load',
      'Karena BrowserRouter hanya bekerja pada port 4173'
    ],
    answer: 1,
    explain: 'BrowserRouter mengendalikan History API dan URL halaman. Jika setiap remote memasang router sendiri, beberapa pihak akan berebut navigasi dan URL dapat berubah tidak konsisten. Shell memasang satu BrowserRouter, sedangkan remote merender Routes bersarang di bawah rute yang disediakan shell.'
  },
  {
    id: 'mf11',
    q: 'Mengapa boot shell memakai Promise.allSettled untuk manifest, feature flags, dan sesi?',
    options: [
      'Agar ketiga permintaan dijalankan secara berurutan dan tidak paralel',
      'Agar semua permintaan otomatis diulang tanpa batas ketika gagal',
      'Agar kegagalan satu permintaan tidak membatalkan hasil permintaan lain, sehingga shell masih bisa memakai manifest cadangan atau sesi yang berhasil',
      'Agar token akses tersimpan permanen di localStorage'
    ],
    answer: 2,
    explain: 'Promise.allSettled menunggu semua permintaan selesai dan melaporkan status masing-masing, baik berhasil maupun gagal. Shell dapat memakai manifest cadangan bila /api/remotes gagal, sambil tetap memulihkan sesi dari cookie httpOnly. Pendekatan ini membuat boot lebih tahan terhadap kegagalan sebagian.'
  },
  {
    id: 'mf12',
    q: 'Di mana token akses dan refresh token sebaiknya disimpan pada TokoMicro?',
    options: [
      'Keduanya di localStorage agar bertahan setelah tab ditutup',
      'Keduanya di URL agar mudah dibagikan antar remote',
      'Token akses di cookie biasa dan refresh token di sessionStorage',
      'Token akses di memori, refresh token di cookie httpOnly yang tidak dapat dibaca JavaScript'
    ],
    answer: 3,
    explain: 'Token akses disimpan di state memori sehingga hilang saat halaman ditutup dan tidak dapat dibaca skrip lain. Refresh token berada di cookie httpOnly yang dikirim browser hanya ke endpoint refresh. Dengan cara ini, shell dapat memperbarui token tanpa mengekspos refresh token ke JavaScript.'
  },

  /* ---------------- Bab 5 — Module Federation ---------------- */
  {
    id: 'mf13',
    q: 'Remote header mengekspos { "./App": "./src/App.tsx" } dan shell mendaftarkannya sebagai remotes.header. Bagaimana shell mengimpor komponen tersebut?',
    options: [
      'import Header from "header/App"',
      'import Header from "../../header/src/App"',
      'import Header from "remoteEntry/App"',
      'import Header from "http://localhost:4174/src/App.tsx"'
    ],
    answer: 0,
    explain: 'Module Federation memetakan nama remote dan nama ekspos menjadi specifier header/App. Shell tidak mengimpor jalur berkas internal remote karena itu akan melanggar batas kepemilikan. Nama pada konfigurasi remotes harus sama dengan name di vite.config.ts remote.'
  },
  {
    id: 'mf14',
    q: 'Mengapa react, react-dom, dan react-router-dom didaftarkan sebagai shared singleton?',
    options: [
      'Agar ketiga pustaka tidak perlu diunduh sama sekali dari jaringan',
      'Agar setiap remote bebas memakai versi React yang berbeda tanpa risiko',
      'Agar shell dan semua remote memakai satu instans pustaka, sehingga hook, context, dan router bekerja konsisten',
      'Agar React dapat dijalankan tanpa bundler'
    ],
    answer: 2,
    explain: 'Singleton memastikan hanya satu salinan React dan react-router-dom yang aktif di halaman. Dua instans React dapat memicu Invalid hook call dan context yang tidak terbaca, sedangkan dua router dapat berebut navigasi. Semua pihak tetap perlu menyepakati rentang versi yang kompatibel.'
  },
  {
    id: 'mf15',
    q: 'remoteEntry.js mengembalikan 200 dan tidak ada error CORS, tetapi area remote tampil kosong tanpa pesan. Apa yang paling perlu diperiksa lebih dulu?',
    options: [
      'Apakah port shell sudah diganti menjadi 4174',
      'Apakah semua CSS remote memakai !important',
      'Apakah browser sudah dimuat ulang tiga kali',
      'Apakah nama ekspos dan default export komponen sesuai kontrak, misalnya ./App mengekspor default App'
    ],
    answer: 3,
    explain: 'Jika remoteEntry berhasil dimuat dan CORS benar, kegagalan biasanya berpindah ke lapisan kontrak: nama ekspos tidak cocok, komponen tidak memiliki default export, atau shell meminta modul yang berbeda. Periksa juga apakah chunk App benar-benar diminta di Network. Setelah kontrak benar, baru telusuri masalah render di dalam komponen.'
  },

/* ---------------- Bab 6 — Routing & Kontrak ---------------- */
  {
    id: 'mf16',
    q: 'Di TokoMicro React, siapa yang seharusnya memiliki BrowserRouter?',
    options: [
      'Shell, karena shell adalah satu-satunya pemilik URL dan riwayat browser',
      'Setiap remote, agar remote bisa berjalan tanpa shell',
      'Remote header, karena header menampilkan menu navigasi',
      'Browser, karena BrowserRouter dipasang otomatis oleh History API'
    ],
    answer: 0,
    explain: 'Shell memiliki URL, layout, dan sesi, sehingga hanya shell yang boleh memasang BrowserRouter. Remote menyediakan Routes bersarang yang dipasang shell pada rute seperti /katalog/*. Bila setiap remote memasang router sendiri, beberapa pihak akan berebut riwayat dan navigasi menjadi tidak konsisten.'
  },
  {
    id: 'mf17',
    q: 'Remote products dipasang shell pada rute /katalog/*. Bagaimana cara remote menampilkan halaman /katalog/detail/kb-01?',
    options: [
      'Remote memasang listener hashchange lalu membaca window.location.hash',
      'Remote memakai Routes bersarang dengan rute detail/:id di dalam App-nya',
      'Remote membuat BrowserRouter baru dengan basename /katalog',
      'Shell harus menambahkan rute terpisah /detail/:id untuk setiap produk'
    ],
    answer: 1,
    explain: 'Pola /katalog/* menyerahkan seluruh path setelah /katalog kepada remote products. Remote cukup mendefinisikan Routes dengan index untuk katalog dan detail/:id untuk detail. Shell tidak perlu tahu halaman internal remote, dan remote tetap dapat memakai MemoryRouter saat berdiri sendiri.'
  },
  {
    id: 'mf18',
    q: 'Apa fungsi deklarasi declare module \'header/App\' di shell?',
    options: [
      'Mengaktifkan Module Federation saat build',
      'Memberi TypeScript tipe default export dan props ctx untuk modul federasi',
      'Mengisolasi CSS remote header dari shell',
      'Membuat React dan react-router-dom menjadi singleton'
    ],
    answer: 1,
    explain: 'Import lintas aplikasi seperti header/App tidak memiliki tipe otomatis, sehingga TypeScript dapat menganggapnya any. Deklarasi module memberi tahu TypeScript bahwa default export adalah komponen yang menerima { ctx: AppContext }. Dengan begitu npm run typecheck dapat menangkap perubahan kontrak sebelum rilis.'
  },

  /* ---------------- Bab 7 — State & Event ---------------- */
  {
    id: 'mf19',
    q: 'Mengapa store keranjang disimpan pada globalThis[Symbol.for(\'tokomicro.shared.cart\')]?',
    options: [
      'Agar state otomatis tersimpan di localStorage dan bertahan setelah browser ditutup',
      'Agar hanya ada satu instance store meskipun modul dimuat dari beberapa bundel remote',
      'Agar React tidak perlu dibagikan sebagai singleton',
      'Agar setiap remote mendapat salinan state sendiri yang terisolasi'
    ],
    answer: 1,
    explain: 'Module Federation dapat memuat berkas shared melalui beberapa jalur, sehingga createCartStore() bisa dieksekusi lebih dari sekali. Kunci Symbol.for pada globalThis memastikan semua remote memakai store yang sama. Ini adalah singleton runtime, bukan pengganti penyimpanan permanen atau backend.'
  },
  {
    id: 'mf20',
    q: 'Apa akibatnya bila getSnapshot mengembalikan objek baru setiap kali dipanggil?',
    options: [
      'React dapat masuk loop render karena menganggap state terus berubah',
      'Store keranjang otomatis kosong setiap render',
      'BroadcastChannel berhenti mengirim event',
      'Zod menolak snapshot karena bukan JSON'
    ],
    answer: 0,
    explain: 'useSyncExternalStore membandingkan referensi snapshot untuk menentukan apakah render perlu diulang. Objek baru pada setiap panggilan membuat React melihat perubahan terus-menerus dan dapat memicu loop atau galat getSnapshot should be cached. Simpan snapshot dan ganti hanya ketika state benar-benar berubah.'
  },
  {
    id: 'mf21',
    q: 'Kapan event bus lebih tepat daripada shared module?',
    options: [
      'Saat badge keranjang harus menunjukkan angka yang sama di semua remote',
      'Saat mengumumkan checkout selesai tanpa mengharapkan nilai balik',
      'Saat menyimpan status pesanan yang harus tahan refresh dan audit',
      'Saat meminta daftar produk dari remote cart dan menunggu jawabannya'
    ],
    answer: 1,
    explain: 'Event cocok untuk mengumumkan bahwa sesuatu terjadi, misalnya checkout selesai atau wishlist ditambahkan. Pengirim tidak membutuhkan jawaban dan tidak peduli siapa yang mendengarkan. Nilai yang harus selalu sama sebaiknya memakai shared module, sedangkan data yang harus tahan lama dan diaudit tetap disimpan di backend.'
  },

  /* ---------------- Bab 8 — Design System ---------------- */
  {
    id: 'mf22',
    q: 'Bagaimana cara yang benar menerapkan tema gelap ke seluruh remote?',
    options: [
      'Setiap remote menetapkan warna gelapnya sendiri di :root',
      'Shell memasang data-theme="dark" pada html dan semua remote memakai token --tm-*',
      'Setiap remote menambahkan kelas .dark pada komponen akarnya',
      'Shell menulis inline style gelap pada setiap elemen tombol'
    ],
    answer: 1,
    explain: 'Token semantik --tm-* didefinisikan sekali untuk tema terang dan gelap. Shell mengubah data-theme pada elemen html, sehingga seluruh remote yang memakai token ikut berubah. Remote tidak boleh mendefinisikan ulang token global karena akan mengubah tampilan remote lain.'
  },
  {
    id: 'mf23',
    q: 'Mengapa CSS remote sebaiknya memakai prefix kelas seperti .pr- atau .ct-?',
    options: [
      'Agar aturan CSS remote tidak menimpa shell atau remote lain',
      'Agar ukuran bundel JavaScript remote menjadi lebih kecil',
      'Agar React tidak perlu memakai CSS Modules',
      'Agar halaman remote otomatis terindeks mesin pencari'
    ],
    answer: 0,
    explain: 'Semua remote berbagi satu dokumen HTML, sehingga selector global seperti button atau .card dapat saling menimpa. Prefix seperti .pr- untuk products dan .ct- untuk cart menandai kepemilikan aturan. Isolasi ini melengkapi token bersama dan CSS Modules untuk komponen internal.'
  },
  {
    id: 'mf24',
    q: 'Di mana Storybook sebaiknya dijalankan dalam proyek TokoMicro React?',
    options: [
      'Di setiap remote, karena setiap remote punya komponen sendiri',
      'Hanya untuk packages/ui-kit sebagai katalog komponen dasar',
      'Hanya di shell, karena shell memuat semua remote',
      'Di backend, agar story dapat diuji bersama API'
    ],
    answer: 1,
    explain: 'Storybook adalah katalog komponen dasar, bukan alat integrasi seluruh halaman. Menjalankan Storybook di setiap remote menggandakan konfigurasi dan membuat komponen bersama cepat berbeda. Komposisi halaman remote lebih tepat diuji dengan e2e di shell.'
  },

  /* ---------------- Bab 9 — Data & API ---------------- */
  {
    id: 'mf25',
    q: 'Apa fungsi AbortController pada fetch di remote products?',
    options: [
      'Membatalkan request lama saat filter berubah atau remote dibongkar agar tidak menulis state basi',
      'Memvalidasi bentuk JSON sebelum data dipakai',
      'Menyimpan respons ke cache browser secara otomatis',
      'Mengubah access token menjadi refresh token'
    ],
    answer: 0,
    explain: 'Setiap effect membuat AbortController dan memanggil abort() pada cleanup. Request yang sudah tidak relevan tidak boleh menimpa hasil filter baru atau menulis state setelah komponen hilang. Validasi JSON adalah tugas Zod, bukan AbortController.'
  },
  {
    id: 'mf26',
    q: 'Respons /api/products berhasil diterima, tetapi bentuknya tidak sesuai kontrak. Apa tindakan yang benar?',
    options: [
      'Memakai as Product[] agar TypeScript berhenti mengeluh',
      'Memvalidasi dengan Zod safeParse dan menampilkan error terkendali tanpa merender data rusak',
      'Mengabaikan respons dan menganggap katalog kosong',
      'Menyimpan respons mentah ke localStorage lalu mencoba lagi nanti'
    ],
    answer: 1,
    explain: 'Respons dari jaringan harus dianggap unknown sampai divalidasi. safeParse memeriksa bentuk data dan mengembalikan hasil yang bisa ditangani tanpa melempar exception. Remote kemudian menampilkan status error dan tombol coba lagi, bukan layar putih atau data yang salah render.'
  },
  {
    id: 'mf27',
    q: 'Mengapa remote cart tidak boleh memanggil API products secara langsung?',
    options: [
      'Karena browser selalu memblokir semua request lintas origin',
      'Karena itu menciptakan distributed monolith dan mengikat siklus rilis kedua tim',
      'Karena React tidak mengizinkan fetch di dalam remote',
      'Karena token hanya boleh dikirim melalui query string'
    ],
    answer: 1,
    explain: 'Panggilan HTTP antar-remote membuat cart bergantung pada kontrak, ketersediaan, dan jadwal rilis products. Kedua tim kembali harus rilis dan gagal bersamaan, meskipun secara fisik aplikasinya terpisah. Solusinya adalah backend/BFF sebagai satu sumber data, atau event untuk sekadar mengumumkan kejadian.'
  },

  /* ---------------- Bab 10 — Auth & Otorisasi ---------------- */
  {
    id: 'mf28',
    q: 'Di mana access token sebaiknya disimpan?',
    options: [
      'Di localStorage agar bertahan setelah browser ditutup',
      'Di query string URL agar mudah dibaca saat debugging',
      'Di variabel memori milik shell, lalu dibagikan lewat ctx.getToken()',
      'Di cookie non-httpOnly agar JavaScript remote dapat membacanya'
    ],
    answer: 2,
    explain: 'Access token berumur pendek disimpan di memori shell dan hilang saat reload. Remote meminta token melalui ctx.getToken() tanpa menyimpan salinannya sendiri. Refresh token berada di cookie httpOnly yang tidak dapat dibaca JavaScript, sehingga halaman dapat memulihkan sesi tanpa mengekspos token panjang.'
  },
  {
    id: 'mf29',
    q: 'Server mengembalikan 403 saat customer membuka /akun/admin. Apa arti dan tindakan yang tepat?',
    options: [
      'Belum login, jadi shell harus menghapus sesi dan mengarahkan ke halaman masuk',
      'Sudah terautentikasi tetapi tidak berwenang; tampilkan akses ditolak tanpa logout atau retry',
      'Access token kedaluwarsa, jadi ulangi refresh berkali-kali',
      'Server sedang down, jadi kirim ulang request tanpa batas'
    ],
    answer: 1,
    explain: '401 berarti belum terautentikasi atau token tidak valid, sehingga perlu refresh atau login. 403 berarti identitas sudah dikenali tetapi perannya tidak cukup. Tindakannya adalah menampilkan pesan akses ditolak; logout dan retry justru membingungkan pengguna dan tidak mengubah izin.'
  },
  {
    id: 'mf30',
    q: 'Setelah reload, bagaimana sesi admin dapat bertahan tanpa access token di localStorage?',
    options: [
      'Shell memanggil /api/refresh dengan cookie httpOnly, mendapat access token baru, lalu memanggil /api/me',
      'Browser menyimpan access token otomatis di sessionStorage',
      'Remote admin membaca refresh token dari document.cookie lalu mengirimnya sendiri',
      'Pengguna harus login ulang setiap kali halaman di-refresh'
    ],
    answer: 0,
    explain: 'Access token di memori hilang saat reload, tetapi refresh token tetap berada di cookie httpOnly. Shell memanggil /api/refresh dengan credentials include untuk mendapat access token baru, lalu memulihkan profil dari /api/me. Karena cookie tidak dapat dibaca JavaScript, token panjang tidak pernah terekspos ke kode remote.'
  },

/* ---------------- Bab 11 — Manifest & Feature Flag ---------------- */
  {
    id: 'mf31',
    q: 'Apa yang membuat URL remote bisa berubah tanpa build ulang shell?',
    options: [
      'Shell menyimpan seluruh artefak remote di dalam folder dist-nya',
      'Setiap remote diimpor langsung sebagai komponen React di dalam shell',
      'Shell membaca pointer versi dan URL dari manifest saat runtime',
      'Browser meng-cache remoteEntry.js selamanya sehingga URL lama dipakai'
    ],
    answer: 2,
    explain: 'Shell memanggil /api/remotes saat boot, lalu memakai URL dari manifest untuk memuat remoteEntry.js. Ketika scripts/release.mjs menyalin build ke cdn/<remote>/<versi> dan memperbarui cdn/manifest.json, alamat yang dibaca shell ikut berubah. Karena itu tidak ada build shell yang diperlukan selama kontrak ctx tidak berubah.'
  },
  {
    id: 'mf32',
    q: 'Dalam remoteLoader.ts, apa fungsi __federation_method_setRemote dari virtual:__federation__?',
    options: [
      'Mendaftarkan komponen remote ke dalam design system',
      'Mengganti URL remote saat runtime sebelum modul ./App diambil',
      'Mengubah konfigurasi shared singleton di bundel remote',
      'Menghapus cache browser untuk semua aset remote'
    ],
    answer: 1,
    explain: 'virtual:__federation__ adalah API runtime dari plugin federasi. setRemote menerima nama remote beserta URL yang berasal dari manifest, lalu getRemote mengambil ekspos ./App dari alamat tersebut. Fallback build-time tetap disediakan untuk keadaan ketika manifest tidak tersedia.'
  },
  {
    id: 'mf33',
    q: 'Kapan feature flag seperti accountRemote lebih tepat daripada merilis versi baru?',
    options: [
      'Saat ingin mengubah bentuk kontrak ctx secara permanen',
      'Saat ingin menghapus artefak versi lama dari CDN',
      'Saat ingin menaikkan versi React di semua remote',
      'Saat remote akun bermasalah dan perlu dimatikan sementara tanpa build'
    ],
    answer: 3,
    explain: 'Feature flag adalah saklar runtime untuk perilaku, bukan pengganti versioning. accountRemote dapat mematikan pemasangan remote akun dan menampilkan pesan pemeliharaan tanpa menunggu pipeline rilis. Perubahan kontrak ctx atau naik versi React tetap memerlukan rilis dan koordinasi antar tim.'
  },

  /* ---------------- Bab 12 — Ketahanan ---------------- */
  {
    id: 'mf34',
    q: 'Mengapa error boundary dipasang per remote, bukan satu di akar aplikasi?',
    options: [
      'Agar kegagalan satu remote tidak mengganti seluruh halaman termasuk header',
      'Agar React tidak perlu memakai Suspense',
      'Agar semua error otomatis hilang tanpa fallback',
      'Agar remote dapat mengimpor state shell secara langsung'
    ],
    answer: 0,
    explain: 'Error boundary di akar aplikasi membuat satu galat keranjang mengganti seluruh halaman, termasuk header dan navigasi. Boundary per slot membatasi blast radius: hanya bagian yang gagal yang diganti fallback. Ini adalah inti dari isolasi kegagalan micro-frontend.'
  },
  {
    id: 'mf35',
    q: 'Apa tujuan key={name + ":" + attempt} pada error boundary?',
    options: [
      'Memberi nama unik pada berkas remoteEntry.js',
      'Menghapus remote dari manifest setelah gagal',
      'Memaksa React memasang ulang boundary dan lazy component saat retry',
      'Mengubah versi remote secara otomatis'
    ],
    answer: 2,
    explain: 'React mempertahankan state boundary selama key tidak berubah. Dengan mengganti key saat attempt bertambah, boundary dan lazy component dipasang ulang sehingga state galat lama dibuang. Tanpa itu, menekan Coba lagi bisa tetap menampilkan fallback yang sama.'
  },
  {
    id: 'mf36',
    q: 'Mengapa pemuatan remote perlu timeout dan batas retry?',
    options: [
      'Agar remote selalu berhasil dimuat dalam percobaan pertama',
      'Agar skeleton tidak tampil selamanya dan retry tidak membanjiri origin yang mati',
      'Agar shell tidak perlu memakai Suspense',
      'Agar ukuran bundel remote otomatis mengecil'
    ],
    answer: 1,
    explain: 'Suspense hanya menampilkan fallback; ia tidak tahu bahwa promise tidak akan pernah selesai. Timeout mengubah pemuatan yang menggantung menjadi galat yang bisa ditangani. Batas retry mencegah tombol Coba lagi menghasilkan badai permintaan ke origin yang sedang bermasalah.'
  },

  /* ---------------- Bab 13 — Pengujian ---------------- */
  {
    id: 'mf37',
    q: 'Apa yang seharusnya diuji oleh contract test?',
    options: [
      'Nama kelas CSS internal komponen remote',
      'Urutan render setiap komponen di dalam remote',
      'Isi state privat milik tim lain',
      'Bentuk data, event, dan manifest sesuai skema yang disepakati'
    ],
    answer: 3,
    explain: 'Contract test memastikan produsen dan konsumen sepakat tentang bentuk data, misalnya event checkout atau manifest remote. Ia tidak memeriksa tampilan atau detail internal. Dengan begitu, kedua tim bisa berubah tanpa saling merusak selama kontraknya tetap.'
  },
  {
    id: 'mf38',
    q: 'Mengapa shell tidak boleh mengimpor berkas internal remote dalam pengujian?',
    options: [
      'Karena itu menciptakan ketergantungan pada detail privat yang bisa berubah tanpa melanggar kontrak',
      'Karena Vitest tidak bisa mengimpor berkas TypeScript',
      'Karena shell tidak boleh memiliki unit test sama sekali',
      'Karena remote tidak boleh diuji oleh timnya sendiri'
    ],
    answer: 0,
    explain: 'Shell hanya boleh bergantung pada nama ekspos ./App, bentuk ctx, dan event. Mengimpor komponen internal cart membuat setiap refactor cart merusak pipeline shell meskipun kontraknya tidak berubah. Pengujian internal adalah tanggung jawab tim pemilik remote.'
  },
  {
    id: 'mf39',
    q: 'Apa bukti yang diberikan skenario E2E yang memblokir http://localhost:4176/**?',
    options: [
      'Bahwa remote cart selalu berhasil dimuat',
      'Bahwa manifest otomatis di-rollback',
      'Bahwa kegagalan cart terisolasi dan header tetap hidup',
      'Bahwa semua unit test otomatis diperbaiki'
    ],
    answer: 2,
    explain: 'Memblokir seluruh origin cart mensimulasikan tim transaksi yang mati. E2E memeriksa bahwa fallback muncul di slot keranjang, sementara header dan navigasi tetap terlihat. Ini membuktikan isolasi kegagalan yang menjadi alasan utama arsitektur micro-frontend.'
  },

  /* ---------------- Bab 14 — Observability ---------------- */
  {
    id: 'mf40',
    q: 'Sinyal telemetri mana yang paling tepat untuk mencatat remote_load_ms?',
    options: [
      'event, karena setiap pemuatan remote adalah kejadian pengguna',
      'metric, karena nilainya berupa durasi yang bisa dibandingkan',
      'error, karena pemuatan yang lambat dianggap galat',
      'manifest, karena versi remote berubah'
    ],
    answer: 1,
    explain: 'remote_load_ms adalah angka durasi yang perlu dibandingkan antar waktu dan antar remote, sehingga tepat dikirim sebagai metric. Payload dapat memuat nama remote agar angkanya bisa dipecah. Event lebih cocok untuk kejadian seperti add_to_cart, sedangkan error untuk kegagalan.'
  },
  {
    id: 'mf41',
    q: 'Mengapa telemetry memakai sendBeacon dengan fallback fetch keepalive?',
    options: [
      'Agar payload telemetri selalu lebih kecil dari 1 kB',
      'Agar telemetri otomatis terenkripsi di browser',
      'Agar telemetri bisa mengubah manifest saat halaman ditutup',
      'Agar data tetap terkirim saat navigasi tanpa menahan perpindahan halaman'
    ],
    answer: 3,
    explain: 'sendBeacon dirancang untuk mengirim data kecil saat halaman akan ditinggalkan tanpa menahan navigasi. Bila API itu diblokir atau gagal, fetch dengan keepalive menjadi cadangan. Telemetri tidak boleh menjatuhkan aplikasi, sehingga kegagalan pengiriman ditelan dengan sengaja.'
  },
  {
    id: 'mf42',
    q: 'Praktik observability yang benar adalah...',
    options: [
      'Mengirim nama event, durasi, remote, dan versi tanpa token atau data pribadi',
      'Mengirim access token agar error bisa dipetakan ke pengguna',
      'Memberi alert untuk setiap error tunggal di semua remote',
      'Menjadikan pengiriman telemetri syarat agar halaman bisa dipakai'
    ],
    answer: 0,
    explain: 'Telemetri yang berguna memuat konteks teknis secukupnya: app, remote, versi, nama event, dan durasi. Token, kata sandi, email lengkap, serta isi formulir tidak boleh dikirim. Alert sebaiknya berbasis ambang dan dampak, bukan setiap error tunggal, dan kegagalan telemetri tidak boleh memblokir aplikasi.'
  },

  /* ---------------- Bab 15 — Performa ---------------- */
  {
    id: 'mf43',
    q: 'Apa akibat tidak memakai shared singleton untuk React?',
    options: [
      'Setiap remote otomatis memakai React versi terbaru',
      'React tidak bisa dipakai di dalam remote',
      'Setiap remote membawa salinan React sendiri sehingga bundel membengkak dan context bisa terpisah',
      'Shell tidak bisa memakai lazy loading'
    ],
    answer: 2,
    explain: 'Tanpa singleton, setiap remote mengunduh React dan React DOM sendiri. Selain memperbesar transfer, dua instans React dapat membuat hook dan context tidak saling mengenali. Karena itu semua pihak menyepakati singleton dan requiredVersion yang sama.'
  },
  {
    id: 'mf44',
    q: 'Berapa budget bundel yang dipakai scripts/perf-report.mjs?',
    options: [
      'Shell 140 kB dan setiap remote 320 kB gzip',
      'Shell 320 kB dan setiap remote 140 kB gzip',
      'Semua aplikasi 500 kB tanpa pembedaan',
      'Hanya ukuran mentah yang dibatasi, bukan gzip'
    ],
    answer: 1,
    explain: 'Laporan menetapkan budget 320 kB gzip untuk shell dan 140 kB gzip untuk setiap remote. Angka dihitung dari hasil gzip berkas JavaScript dan CSS di folder dist. Bila salah satu melewati batas, npm run perf keluar dengan kode gagal.'
  },
  {
    id: 'mf45',
    q: 'Mengapa rute berat sebaiknya memakai lazy() dan preload berbasis niat?',
    options: [
      'Agar semua remote diunduh saat boot supaya navigasi selalu instan',
      'Agar ukuran mentah bertambah tetapi gzip mengecil',
      'Agar shared singleton tidak diperlukan lagi',
      'Agar bundel awal tetap kecil, sementara remote mulai diunduh saat pengguna menunjukkan niat'
    ],
    answer: 3,
    explain: 'Lazy route menunda unduhan sampai rute benar-benar dibuka, sehingga bundel awal hanya berisi yang dibutuhkan. Preload pada onMouseEnter atau onFocus memulai unduhan saat niat pengguna terlihat, tanpa membebani semua pengunjung. Ini menjaga keseimbangan antara ukuran awal dan kecepatan navigasi.'
  },

/* ---------------- Bab 16 — Rilis dan Rollback ---------------- */
  {
    id: 'mf46',
    q: 'Mengapa artefak rilis disimpan di cdn/<remote>/<versi> dan tidak menimpa folder yang sama?',
    options: [
      'Agar setiap versi punya URL tetap yang bisa di-cache lama dan menjadi target rollback',
      'Agar browser selalu mengunduh ulang semua remote setiap kali halaman dibuka',
      'Agar shell harus dibangun ulang setiap kali remote berubah',
      'Agar manifest tidak perlu diperbarui lagi'
    ],
    answer: 0,
    explain: 'Folder per versi memberi setiap artefak URL permanen. URL yang permanen aman di-cache sebagai immutable, dan versi lama tetap tersedia saat rollback. Menimpa folder yang sama menghancurkan kedua jaminan itu.'
  },
  {
    id: 'mf47',
    q: 'Kombinasi header cache yang tepat untuk manifest dan remoteEntry berversi adalah...',
    options: [
      'Keduanya immutable selama satu tahun',
      'Manifest no-store; remoteEntry di /v/<versi>/ immutable',
      'Keduanya no-store',
      'Manifest immutable; remoteEntry no-store'
    ],
    answer: 1,
    explain: 'Manifest adalah pointer yang harus selalu segar, jadi tidak boleh disimpan lama. Sebaliknya, remoteEntry di path /v/1.0.1/ menunjuk versi tetap, sehingga aman diberi cache immutable. Mencampur keduanya membuat rollback tampak berhasil di server tetapi gagal di browser.'
  },
  {
    id: 'mf48',
    q: 'Kontrak ctx berubah dan shell perlu mengirim field baru, tetapi remote lama belum diperbarui. Urutan rilis paling aman adalah...',
    options: [
      'Rilis shell dan semua remote serentak',
      'Hapus field lama lebih dulu, lalu rilis remote',
      'Rilis shell yang menerima bentuk lama dan baru, rilis remote satu per satu, lalu hapus dukungan lama',
      'Rollback semua remote ke 1.0.0 dan hentikan rilis'
    ],
    answer: 2,
    explain: 'Pola expand-contract memungkinkan shell dan remote hidup dengan versi kontrak berbeda selama masa transisi. Setelah semua remote memakai bentuk baru, dukungan lama baru boleh dihapus. Rilis serentak menghilangkan jalan kembali dan memperbesar risiko.'
  },

  /* ---------------- Bab 17 — CI/CD dan Kepemilikan ---------------- */
  {
    id: 'mf49',
    q: 'Apa fungsi paths: ["apps/products/**", "packages/shared/**"] pada workflow CI?',
    options: [
      'Membatasi pipeline agar hanya berjalan saat remote produk atau paket shared berubah',
      'Mengizinkan pipeline menulis ke folder tersebut',
      'Menjalankan pipeline hanya pada hari kerja',
      'Mengabaikan semua perubahan di folder tersebut'
    ],
    answer: 0,
    explain: 'Filter paths membuat pipeline bereaksi pada perubahan yang relevan, sehingga tim lain tidak menunggu CI yang tidak berhubungan. Paket shared harus ikut disertakan karena perubahannya memengaruhi banyak remote. Filter yang terlalu sempit bisa meloloskan regresi kontrak.'
  },
  {
    id: 'mf50',
    q: 'Mengapa workflow rilis memakai workflow_dispatch, bukan hanya push ke main?',
    options: [
      'Karena workflow_dispatch selalu lebih cepat daripada push',
      'Karena rilis produksi membutuhkan input remote/versi dan keputusan manusia, bukan otomatis setiap commit',
      'Karena push ke main tidak bisa menjalankan GitHub Actions',
      'Karena workflow_dispatch menghapus kebutuhan pengujian'
    ],
    answer: 1,
    explain: 'Rilis produksi adalah keputusan sadar: tim memilih remote, versi, dan apakah canary. workflow_dispatch menyediakan input tersebut dan dapat dikaitkan dengan environment yang membutuhkan persetujuan. Push ke main tetap menjalankan CI, tetapi tidak otomatis merilis ke pengguna.'
  },
  {
    id: 'mf51',
    q: 'Apa efek branch protection dengan required status check dan CODEOWNERS?',
    options: [
      'Semua orang boleh merge asal pipeline pernah hijau sekali',
      'Remote otomatis dirilis setiap kali PR dibuka',
      'CODEOWNERS menggantikan unit test',
      'PR harus lulus check yang diwajibkan dan mendapat review pemilik folder sebelum merge'
    ],
    answer: 3,
    explain: 'Branch protection mengunci merge sampai check yang diwajibkan hijau, sedangkan CODEOWNERS menentukan reviewer yang memahami folder tersebut. Keduanya melindungi main dari perubahan yang belum diuji atau belum ditinjau. Keduanya tidak menghapus kebutuhan pengujian.'
  },

  /* ---------------- Bab 18 — Migrasi Legacy ---------------- */
  {
    id: 'mf52',
    q: 'Inti pola strangler fig dalam migrasi legacy adalah...',
    options: [
      'Menulis ulang seluruh aplikasi dalam satu rilis besar',
      'Memindahkan rute atau bagian satu per satu ke aplikasi baru sambil yang lama tetap melayani',
      'Membungkus semua halaman lama dengan iframe lalu menghapus router',
      'Menghapus aplikasi lama lebih dulu agar tim terpaksa migrasi'
    ],
    answer: 1,
    explain: 'Strangler fig mengganti bagian lama secara bertahap, sehingga pengguna tetap terlayani selama migrasi. Setiap langkah punya jalan kembali dan dapat diukur. Penulisan ulang serentak menghilangkan umpan balik bertahap dan menambah risiko.'
  },
  {
    id: 'mf53',
    q: 'Trade-off utama memakai iframe untuk memuat katalog lama adalah...',
    options: [
      'Isolasi gaya dan JavaScript kuat, tetapi state, routing, auth, dan SEO sulit disatukan',
      'Iframe selalu lebih cepat dan lebih aksesibel daripada remote React',
      'Iframe menghilangkan kebutuhan autentikasi',
      'Iframe membuat semua tautan lama otomatis menjadi redirect 301'
    ],
    answer: 0,
    explain: 'Iframe memisahkan dokumen, CSS, dan JavaScript, sehingga konflik gaya sangat kecil. Namun shell dan iframe tidak berbagi state, router, token, atau metadata halaman. Karena itu iframe cocok sebagai jembatan sementara, bukan tujuan akhir.'
  },
  {
    id: 'mf54',
    q: 'Setelah rute /katalog-lama dipindahkan ke remote produk, apa yang harus dilakukan agar tautan lama tetap bekerja?',
    options: [
      'Langsung hapus origin legacy dan semua tautan lama',
      'Alihkan URL lama dengan redirect yang mempertahankan path/query, dan pertahankan dual-run sampai metrik aman',
      'Minta pengguna mengetik ulang URL baru',
      'Kembalikan semua halaman ke iframe selamanya'
    ],
    answer: 1,
    explain: 'Redirect map menjaga bookmark, tautan kampanye, dan hasil pencarian tetap sampai ke halaman baru. Mempertahankan query penting agar filter dan konteks tidak hilang. Dual-run memberi jalan kembali bila metrik memburuk.'
  },

  /* ---------------- Bab 19 — Keamanan dan Tata Kelola ---------------- */
  {
    id: 'mf55',
    q: 'CSP yang sehat untuk shell micro-frontend sebaiknya...',
    options: [
      'Mengizinkan script dari semua origin agar remote apa pun bisa dimuat',
      'Membatasi script-src ke origin shell dan origin remote yang disetujui, serta memakai nonce/hash bila memungkinkan',
      'Hanya mengatur style-src dan mengabaikan script-src',
      'Mematikan HTTPS agar tidak ada mixed content'
    ],
    answer: 1,
    explain: 'CSP membatasi sumber kode yang boleh dieksekusi browser. Daftar origin yang eksplisit mencegah remote tak dikenal dimuat meskipun manifest dimanipulasi. Nonce atau hash memperkuat kontrol untuk script inline; wildcard melemahkan seluruh kebijakan.'
  },
  {
    id: 'mf56',
    q: 'Praktik token yang benar di TokoMicro adalah...',
    options: [
      'Access token di localStorage agar bisa dibaca semua remote',
      'Token di query string iframe agar legacy mudah membacanya',
      'Refresh token di localStorage dan access token di cookie non-httpOnly',
      'Access token di memori shell, refresh token di cookie httpOnly, dan remote meminta lewat ctx.getToken()'
    ],
    answer: 3,
    explain: 'Access token di memori tidak bertahan setelah reload dan tidak mudah dibaca dari penyimpanan permanen. Refresh token di cookie httpOnly tidak dapat diakses JavaScript, sehingga lebih sulit dicuri lewat XSS. Remote meminta token segar lewat kontrak ctx, bukan menyimpan sesi sendiri.'
  },
  {
    id: 'mf57',
    q: 'Siapa yang bertanggung jawab atas fokus, heading, dan judul halaman saat remote berganti?',
    options: [
      'Masing-masing remote bebas membuat h1 dan mengatur fokus tanpa koordinasi',
      'Browser otomatis menangani semuanya',
      'Hanya tim QA yang bertanggung jawab saat rilis',
      'Shell mengelola judul dokumen, fokus setelah navigasi, dan landmark; remote menjaga heading serta aksesibilitas di dalam slotnya'
    ],
    answer: 3,
    explain: 'Pengguna merasakan satu dokumen, jadi tanggung jawabnya dibagi. Shell memiliki konteks halaman: title, fokus setelah rute berubah, skip link, dan landmark utama. Remote memiliki isi slot: urutan heading, label, kontras, dan interaksi yang dapat diakses.'
  },

  /* ---------------- Bab 20 — Proyek Akhir ---------------- */
  {
    id: 'mf58',
    q: 'Apa bukti paling kuat bahwa rilis produk 1.1.0 benar-benar mandiri?',
    options: [
      'Folder apps/shell/dist ikut berubah dan dibangun ulang',
      'Semua remote lain juga naik versi',
      'Artefak produk ada di cdn/products/1.1.0, manifest menunjuk /v/1.1.0, dan shell tidak dibangun ulang',
      'Halaman status menampilkan jumlah remote yang lebih banyak'
    ],
    answer: 2,
    explain: 'Rilis mandiri berarti hanya artefak remote yang berubah dan pointer manifest yang diperbarui. Shell membaca manifest saat runtime, sehingga tidak perlu build ulang. Bila shell ikut berubah, manfaat utama arsitektur belum tercapai.'
  },
  {
    id: 'mf59',
    q: 'Kapan SSR paling masuk akal untuk dipertimbangkan?',
    options: [
      'Saat SEO dan first paint kritis, dan tim siap menanggung server serta hydration',
      'Saat semua halaman sudah cukup cepat dengan CSR dan tidak ada kebutuhan SEO',
      'Saat ingin menghindari pengujian dan observability',
      'Saat ingin setiap remote memiliki server sendiri tanpa alasan'
    ],
    answer: 0,
    explain: 'SSR membantu mengirim HTML awal yang bermakna untuk mesin pencari dan first paint. Harganya adalah server, proses hydration, risiko mismatch, dan kompleksitas tambahan saat remote ikut dirender. Tanpa kebutuhan yang terukur, CSR yang cepat lebih sederhana.'
  },
  {
    id: 'mf60',
    q: 'Apa pertimbangan utama memilih Rspack atau Module Federation 2.0?',
    options: [
      'Keduanya menggantikan kebutuhan kontrak dan pengujian',
      'Keduanya hanya untuk aplikasi tanpa React',
      'Keduanya menghapus kebutuhan rollback',
      'Rspack masuk akal bila build Webpack terasa lambat dan kompatibilitas plugin teruji; MF 2.0 bila butuh orkestrasi runtime, manifest, dan tipe lintas remote'
    ],
    answer: 3,
    explain: 'Rspack menjawab masalah kecepatan build dengan kompatibilitas Webpack yang perlu diuji. Module Federation 2.0 menjawab kebutuhan orkestrasi runtime yang lebih kaya, seperti manifest dan tipe lintas remote. Keduanya menambah kompleksitas, jadi pilih berdasarkan masalah yang benar-benar diukur.'
  }
);
