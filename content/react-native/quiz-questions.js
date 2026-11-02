/* ============================================================
   Kuis React Native — 60 Soal Pilihan Ganda (3 per bab)
   ============================================================ */
'use strict';

window.REACTNATIVE_QUIZ_POOL = window.REACTNATIVE_QUIZ_POOL || [];

window.REACTNATIVE_QUIZ_POOL.push(
  /* ---------------- Bab 1 — Fondasi ---------------- */
  {
    id: 'rn01',
    q: 'Apa perbedaan utama antara arsitektur bridge lama dan New Architecture pada React Native?',
    options: [
      'Bridge lama tidak mendukung TypeScript, sedangkan New Architecture mewajibkan TypeScript',
      'New Architecture memakai JSI, Fabric, dan TurboModules sehingga komunikasi native lebih langsung dan rendering ditangani renderer baru',
      'New Architecture menghapus JavaScript dan menggantinya dengan Kotlin/Swift',
      'Bridge lama hanya berjalan di iOS, sedangkan New Architecture hanya di Android'
    ],
    answer: 1,
    explain: 'New Architecture menggantikan antrean bridge dengan JSI untuk pemanggilan native, Fabric sebagai renderer, dan TurboModules untuk modul native yang dimuat lazy. JavaScript tetap menjadi bahasa logika aplikasi; yang berubah adalah cara ia berkomunikasi dengan sisi native.'
  },
  {
    id: 'rn02',
    q: 'Kapan React Native Community CLI (bare workflow) lebih masuk akal daripada Expo?',
    options: [
      'Saat baru belajar dan ingin setup paling cepat',
      'Saat membutuhkan kontrol penuh atas folder android/ios atau integrasi native yang tidak tersedia di ekosistem Expo',
      'Saat ingin memakai TypeScript',
      'Saat ingin aplikasi berjalan di Android dan iOS'
    ],
    answer: 1,
    explain: 'Expo mempercepat setup dan menyediakan banyak modul siap pakai. Bare workflow dipilih ketika proyek benar-benar membutuhkan konfigurasi native khusus, SDK pihak ketiga yang tidak kompatibel, atau kontrol penuh atas build system. Menggunakan TypeScript atau menargetkan dua platform bukan alasan untuk menghindari Expo.'
  },
  {
    id: 'rn03',
    q: 'Mengapa model domain Expense sebaiknya dipisahkan dari ExpenseDto?',
    options: [
      'Agar jumlah berkas bertambah dan proyek terlihat besar',
      'Karena DTO tidak boleh memakai TypeScript',
      'Karena DTO mengikuti bentuk mentah API yang bisa berubah, sedangkan domain adalah bentuk bersih yang dipakai UI dan aturan bisnis',
      'Karena React Native tidak bisa membaca JSON'
    ],
    answer: 2,
    explain: 'API bisa mengirim amount sebagai string, field null, atau kategori baru. DTO memetakan kenyataan itu; fungsi seperti toExpense menormalisasi ke model domain yang stabil. Pemisahan ini memusatkan validasi di batas sistem dan mencegah perubahan API merusak seluruh komponen.'
  },

  /* ---------------- Bab 2 — Setup ---------------- */
  {
    id: 'rn04',
    q: 'Apa keuntungan utama memakai template default create-expo-app untuk proyek baru?',
    options: [
      'Template default tidak membutuhkan Node.js',
      'Template default sudah menyertakan Expo Router dan TypeScript sehingga struktur navigasi dasar siap dipakai',
      'Template default otomatis mengunggah aplikasi ke Play Store',
      'Template default menghilangkan kebutuhan pengujian di perangkat'
    ],
    answer: 1,
    explain: 'Template default Expo menyiapkan Expo Router, TypeScript, dan struktur app/ yang langsung bisa dijalankan. Ini mengurangi pekerjaan awal, tetapi tetap membutuhkan Node.js, pengujian perangkat, dan konfigurasi rilis.'
  },
  {
    id: 'rn05',
    q: 'Kamu menambahkan modul native kustom. Mengapa aplikasi tidak bisa diuji hanya dengan Expo Go?',
    options: [
      'Expo Go hanya mendukung Android',
      'Expo Go tidak memuat modul native kustom karena aplikasi kliennya sudah dibangun tanpa modul tersebut',
      'Expo Go tidak bisa menampilkan teks',
      'Expo Go menghapus TypeScript saat runtime'
    ],
    answer: 1,
    explain: 'Expo Go adalah aplikasi klien umum yang sudah berisi modul tertentu. Modul native kustom memerlukan development build yang dibangun dengan modul tersebut. Setelah build terpasang, perubahan JavaScript tetap bisa dimuat dari Metro.'
  },
  {
    id: 'rn06',
    q: 'Apa fungsi scheme seperti "kantong" pada app.json?',
    options: [
      'Menentukan warna ikon aplikasi',
      'Menjadi protokol deep link agar tautan seperti kantong://expense/123 dapat membuka aplikasi',
      'Mengatur ukuran bundel JavaScript',
      'Menentukan versi Android SDK'
    ],
    answer: 1,
    explain: 'Scheme mendaftarkan protokol kustom di sistem operasi. Deep link, notifikasi, dan tautan dari browser dapat membuka rute tertentu di aplikasi. Tanpa scheme, sistem tidak tahu aplikasi mana yang harus menangani tautan tersebut.'
  },

  /* ---------------- Bab 3 — Core Components ---------------- */
  {
    id: 'rn07',
    q: 'Mengapa <View>Halo</View> gagal dirender di React Native?',
    options: [
      'Karena View tidak bisa memiliki anak',
      'Karena semua teks harus berada di dalam komponen Text',
      'Karena huruf kapital pada View tidak diperbolehkan',
      'Karena React Native tidak mendukung teks'
    ],
    answer: 1,
    explain: 'View adalah wadah layout dan tidak menampilkan teks langsung. React Native mewajibkan teks berada di dalam Text. Aturan ini juga berlaku untuk spasi dan tanda baca yang ditulis di antara komponen.'
  },
  {
    id: 'rn08',
    q: 'Mengapa menaruh FlatList di dalam ScrollView dengan arah gulir yang sama merupakan masalah?',
    options: [
      'FlatList akan berubah menjadi SectionList',
      'Virtualisasi FlatList rusak karena ScrollView merender seluruh konten dan menangani gulir, sehingga performa dan perilaku daftar tidak benar',
      'ScrollView tidak mendukung anak komponen',
      'FlatList hanya bisa dipakai di iOS'
    ],
    answer: 1,
    explain: 'ScrollView merender semua anak dan mengelola gulirnya sendiri. FlatList di dalamnya kehilangan kontrol virtualisasi dan dapat memunculkan peringatan. Jika perlu header yang ikut menggulir, gunakan ListHeaderComponent pada FlatList.'
  },
  {
    id: 'rn09',
    q: 'Mengapa keyExtractor sebaiknya memakai ID stabil, bukan indeks array?',
    options: [
      'Karena indeks array selalu berupa string',
      'Karena ID stabil menjaga identitas item saat data berubah, sehingga animasi, fokus, dan state baris tidak tertukar',
      'Karena FlatList tidak menerima angka',
      'Karena ID membuat daftar otomatis tersortir'
    ],
    answer: 1,
    explain: 'Indeks berubah ketika item ditambah, dihapus, atau diurutkan ulang. React dapat menganggap baris yang berbeda sebagai item yang sama, menyebabkan state atau animasi salah. ID domain yang unik dan stabil mencegah masalah ini.'
  },

  /* ---------------- Bab 4 — Styling ---------------- */
  {
    id: 'rn10',
    q: 'Apa nilai default flexDirection pada React Native?',
    options: ['row', 'column', 'row-reverse', 'column-reverse'],
    answer: 1,
    explain: 'Berbeda dari web, React Native default-nya column. justifyContent mengatur distribusi vertikal dan alignItems horizontal sampai flexDirection diubah. Memahami default ini mencegah layout yang terasa "terbalik".'
  },
  {
    id: 'rn11',
    q: 'Cara paling tepat membuat layout yang berubah saat perangkat dirotasi adalah…',
    options: [
      'Menyimpan Dimensions.get("window") di variabel global saat modul dimuat',
      'Memakai useWindowDimensions agar komponen menerima ukuran terbaru saat layar berubah',
      'Menambahkan marginLeft tetap sebesar 200',
      'Mematikan rotasi di semua perangkat'
    ],
    answer: 1,
    explain: 'useWindowDimensions memperbarui nilai saat rotasi atau ukuran jendela berubah, termasuk split screen di tablet. Dimensions yang dibaca sekali saat modul dimuat tidak bereaksi terhadap perubahan.'
  },
  {
    id: 'rn12',
    q: 'Mengapa paddingTop: 44 untuk status bar dianggap praktik buruk?',
    options: [
      'Karena angka 44 tidak didukung React Native',
      'Karena tinggi status bar dan safe area berbeda antar perangkat; gunakan inset sistem seperti useSafeAreaInsets',
      'Karena status bar hanya ada di Android',
      'Karena paddingTop tidak boleh dipakai di iOS'
    ],
    answer: 1,
    explain: 'Angka hardcode hanya cocok untuk satu model atau orientasi. Notch, dynamic island, dan gesture bar membuat inset berbeda. SafeAreaProvider/useSafeAreaInsets memberi nilai yang benar untuk perangkat saat ini.'
  },

  /* ---------------- Bab 5 — Platform & A11y ---------------- */
  {
    id: 'rn13',
    q: 'Kapan berkas DatePickerField.ios.tsx dan DatePickerField.android.tsx sebaiknya dipakai?',
    options: [
      'Untuk semua komponen agar setiap platform punya berkas sendiri',
      'Ketika implementasi UI/perilaku benar-benar berbeda dan tidak bisa dirapikan dengan Platform.select',
      'Hanya ketika aplikasi tidak memakai TypeScript',
      'Ketika ingin Metro mengabaikan salah satu platform'
    ],
    answer: 1,
    explain: 'Berkas khusus platform berguna untuk perbedaan implementasi yang signifikan, misalnya dialog tanggal native. Untuk perbedaan kecil seperti padding atau shadow, Platform.select lebih sederhana dan tidak menduplikasi logika.'
  },
  {
    id: 'rn14',
    q: 'Tombol ikon "+" tanpa teks sebaiknya diberi…',
    options: [
      'accessibilityRole="button" dan accessibilityLabel yang menjelaskan aksinya',
      'warna yang lebih terang saja',
      'ukuran 10×10 agar tidak memenuhi layar',
      'onTouchStart sebagai pengganti onPress'
    ],
    answer: 0,
    explain: 'Pembaca layar tidak tahu arti ikon tanpa label. Peran button memberi tahu bahwa elemen dapat ditekan, sedangkan label menjelaskan hasilnya. Area sentuh juga harus cukup besar, minimal sekitar 44–48 poin.'
  },
  {
    id: 'rn15',
    q: 'Apa manfaat AppState untuk aplikasi seperti Kantong?',
    options: [
      'Mengubah ukuran font secara otomatis',
      'Mendeteksi saat aplikasi masuk ke latar belakang sehingga draf bisa disimpan dan timer dihentikan',
      'Menghapus kebutuhan database lokal',
      'Menambahkan izin kamera secara otomatis'
    ],
    answer: 1,
    explain: 'AppState memberi transisi active, inactive, dan background. Aplikasi dapat menyimpan draf atau menghentikan pekerjaan saat pengguna meninggalkan aplikasi. Jangan mengandalkan satu-satunya penyimpanan pada momen aplikasi ditutup, karena sistem bisa menghentikan proses tanpa peringatan.'
  },

  /* ---------------- Bab 6 — Navigasi ---------------- */
  {
    id: 'rn16',
    q: 'Apa fungsi route group seperti (auth) dan (tabs) di Expo Router?',
    options: [
      'Menambahkan tanda kurung ke URL',
      'Mengelompokkan rute dan layout tanpa menampilkan nama grup di URL',
      'Membuat rute hanya bisa diakses di web',
      'Menghapus riwayat navigasi'
    ],
    answer: 1,
    explain: 'Tanda kurung membuat folder tidak muncul sebagai segmen URL. Grup memungkinkan layout terpisah untuk autentikasi dan tab utama sambil menjaga URL tetap bersih, misalnya /login dan /expenses.'
  },
  {
    id: 'rn17',
    q: 'Parameter dari useLocalSearchParams<{ id: string }> sebaiknya…',
    options: [
      'Langsung dipakai sebagai angka tanpa pengecekan',
      'Divalidasi karena nilainya berasal dari URL dan bisa kosong, salah format, atau dimanipulasi',
      'Diabaikan karena selalu berupa angka',
      'Disimpan ke variabel global agar tidak berubah'
    ],
    answer: 1,
    explain: 'Parameter rute selalu berupa string dan dapat datang dari deep link yang tidak tepercaya. Validasi format dan keberadaannya sebelum memakai ID untuk query database atau API. Tipe generik TypeScript tidak melakukan validasi runtime.'
  },
  {
    id: 'rn18',
    q: 'Mengapa guard autentikasi harus menunggu status sesi selesai dimuat?',
    options: [
      'Agar splash screen tidak pernah hilang',
      'Karena jika langsung mengalihkan saat status masih loading, pengguna yang sudah login bisa terlempar ke halaman login setiap aplikasi dibuka',
      'Karena router tidak mendukung replace',
      'Karena token tidak boleh dibaca dari penyimpanan'
    ],
    answer: 1,
    explain: 'Status awal biasanya loading saat refresh token dibaca. Mengalihkan pada kondisi itu menciptakan redirect loop atau logout palsu. Tampilkan splash sampai status diketahui, lalu lakukan replace sesuai kondisi.'
  },

  /* ---------------- Bab 7 — Networking ---------------- */
  {
    id: 'rn19',
    q: 'Apa yang terjadi ketika fetch menerima response HTTP 500?',
    options: [
      'fetch otomatis melempar error dan menghentikan aplikasi',
      'fetch tetap resolve; response.ok bernilai false sehingga kode harus memeriksa status dan melempar error sendiri',
      'fetch mengulang request tiga kali',
      'fetch mengubah response menjadi null'
    ],
    answer: 1,
    explain: 'fetch hanya reject pada kegagalan jaringan, bukan status 4xx/5xx. Selalu periksa response.ok atau response.status, lalu ubah menjadi error terstruktur agar UI dapat membedakan jenis kegagalan.'
  },
  {
    id: 'rn20',
    q: 'Cara yang tepat menambahkan timeout pada fetch di React Native adalah…',
    options: [
      'Mengandalkan fetch untuk timeout otomatis',
      'Memakai AbortController dengan setTimeout, lalu memanggil abort dan membersihkan timer',
      'Menambahkan parameter timeout pada URL',
      'Membungkus fetch dengan while loop'
    ],
    answer: 1,
    explain: 'fetch tidak memiliki timeout bawaan yang seragam. AbortController memungkinkan permintaan dibatalkan setelah batas waktu atau saat pengguna meninggalkan layar. Selalu clearTimeout di finally agar tidak ada timer menggantung.'
  },
  {
    id: 'rn21',
    q: 'Mengapa API secret tidak boleh disimpan di variabel EXPO_PUBLIC_?',
    options: [
      'Karena EXPO_PUBLIC_ hanya bisa dibaca di iOS',
      'Karena semua nilai EXPO_PUBLIC_ tertanam di bundel JavaScript dan dapat dibaca siapa pun yang memiliki aplikasi',
      'Karena variabel tersebut tidak mendukung huruf besar',
      'Karena Expo menghapusnya saat build'
    ],
    answer: 1,
    explain: 'Aplikasi mobile adalah klien publik. Bundel dapat diekstrak dan dibaca. EXPO_PUBLIC_ hanya cocok untuk URL atau konfigurasi non-rahasia. Rahasia harus berada di server atau backend-for-frontend.'
  },

  /* ---------------- Bab 8 — TanStack Query ---------------- */
  {
    id: 'rn22',
    q: 'Manakah yang merupakan server state, bukan client state?',
    options: [
      'Tab aktif di layar pengaturan',
      'Teks yang sedang diketik di input pencarian',
      'Daftar pengeluaran yang dimiliki server dan disalin ke aplikasi',
      'Apakah modal tambah pengeluaran terbuka'
    ],
    answer: 2,
    explain: 'Server state adalah data yang sumber kebenarannya di server, seperti daftar pengeluaran atau profil. Tab aktif, teks input, dan modal adalah client state. TanStack Query mengelola cache dan sinkronisasi server state.'
  },
  {
    id: 'rn23',
    q: 'Mengapa query key harus menyertakan semua parameter yang memengaruhi hasil?',
    options: [
      'Agar URL menjadi lebih panjang',
      'Karena cache memakai query key sebagai identitas; parameter yang tidak disertakan dapat menampilkan data dari filter yang salah',
      'Karena TanStack Query hanya mendukung satu query',
      'Agar request tidak perlu autentikasi'
    ],
    answer: 1,
    explain: 'Query key adalah identitas cache. Jika daftar bulan November dan Desember memakai key yang sama, pengguna bisa melihat data bulan yang salah dari cache. Sertakan filter, halaman, dan parameter relevan secara deterministik.'
  },
  {
    id: 'rn24',
    q: 'Apa yang wajib dilakukan saat optimistic update gagal?',
    options: [
      'Membiarkan UI seolah berhasil agar pengguna tidak kecewa',
      'Mengembalikan snapshot cache sebelumnya dan menampilkan error yang sesuai',
      'Menghapus seluruh database lokal',
      'Mematikan jaringan agar tidak ada error'
    ],
    answer: 1,
    explain: 'Optimistic update mengubah UI sebelum server mengonfirmasi. Jika gagal, perubahan harus di-rollback ke snapshot yang disimpan di onMutate, lalu pengguna diberi tahu. Setelah itu, invalidasi atau refetch untuk memastikan data server menjadi sumber kebenaran.'
  },

  /* ---------------- Bab 9 — Client State ---------------- */
  {
    id: 'rn25',
    q: 'State untuk teks yang sedang diketik di satu layar sebaiknya disimpan di…',
    options: [
      'Zustand global agar semua layar tahu',
      'useState lokal karena hanya dipakai komponen tersebut',
      'Database SQLite',
      'Query key TanStack Query'
    ],
    answer: 1,
    explain: 'State yang hanya dipakai satu komponen tidak perlu diangkat ke store global. useState lebih sederhana, tidak menambah dependensi, dan tidak memicu render di layar lain.'
  },
  {
    id: 'rn26',
    q: 'Mengapa selector Zustand yang mengembalikan objek baru setiap render bermasalah?',
    options: [
      'Karena Zustand tidak mendukung objek',
      'Karena perbandingan referensi menganggapnya selalu berubah sehingga komponen render ulang terus-menerus',
      'Karena objek tidak bisa disimpan di memori',
      'Karena selector hanya boleh mengembalikan angka'
    ],
    answer: 1,
    explain: 'Zustand membandingkan hasil selector dengan Object.is. Objek baru selalu dianggap berbeda. Gunakan selector per field atau useShallow untuk membandingkan isi objek secara dangkal.'
  },
  {
    id: 'rn27',
    q: 'Apa yang harus dilakukan pada state klien saat logout?',
    options: [
      'Dibiarkan agar pengguna berikutnya tidak perlu mengatur ulang',
      'Direset, termasuk cache query dan data pribadi, agar tidak bocor ke pengguna berikutnya',
      'Disimpan ke SecureStore',
      'Diubah menjadi server state'
    ],
    answer: 1,
    explain: 'Logout harus membersihkan token, cache query, store yang berisi data pribadi, dan preferensi sensitif. Jika tidak, pengguna berikutnya di perangkat yang sama dapat melihat sisa data. Preferensi non-sensitif boleh dipertahankan bila disengaja.'
  },

  /* ---------------- Bab 10 — Autentikasi ---------------- */
  {
    id: 'rn28',
    q: 'Di mana access token dan refresh token sebaiknya disimpan?',
    options: [
      'Keduanya di AsyncStorage agar mudah dibaca',
      'Access token di memori, refresh token di SecureStore',
      'Keduanya di file teks biasa',
      'Keduanya di query parameter URL'
    ],
    answer: 1,
    explain: 'Access token berumur pendek dan cukup di memori; ia hilang saat aplikasi ditutup dan diperbarui lewat refresh. Refresh token berumur panjang dan harus dilindungi SecureStore (Keychain/Keystore). AsyncStorage tidak terenkripsi.'
  },
  {
    id: 'rn29',
    q: 'Mengapa refresh token harus single-flight?',
    options: [
      'Agar refresh token bisa dipakai berkali-kali tanpa rotasi',
      'Agar beberapa request yang gagal 401 hanya memicu satu refresh, sehingga token tidak saling menimpa',
      'Agar aplikasi tidak perlu jaringan',
      'Agar access token tidak pernah kedaluwarsa'
    ],
    answer: 1,
    explain: 'Jika sepuluh request mendapat 401 bersamaan dan masing-masing melakukan refresh, server menerima sepuluh refresh dan token bisa saling menimpa. Satu promise refresh yang dibagi ke semua pemanggil mencegahnya. Setelah selesai, promise direset.'
  },
  {
    id: 'rn30',
    q: 'Response 403 setelah token diperbarui sebaiknya…',
    options: [
      'Memicu refresh token berulang tanpa batas',
      'Tidak diulang dengan refresh karena pengguna sudah dikenali tetapi tidak berhak; tampilkan pesan izin',
      'Dianggap sebagai logout otomatis',
      'Diabaikan dan data tetap ditampilkan'
    ],
    answer: 1,
    explain: '401 berarti autentikasi gagal, sedangkan 403 berarti autentikasi berhasil tetapi otorisasi ditolak. Refresh tidak mengubah hak akses. Tampilkan pesan yang sesuai dan jangan membuat loop refresh.'
  },

  /* ---------------- Bab 11 — Offline & SQLite ---------------- */
  {
    id: 'rn31',
    q: 'Data pengeluaran yang perlu difilter, diurutkan, dan di-query sebaiknya disimpan di…',
    options: [
      'AsyncStorage sebagai satu string JSON',
      'SQLite dengan tabel, indeks, dan query',
      'SecureStore',
      'Variabel global di memori'
    ],
    answer: 1,
    explain: 'SQLite cocok untuk data terstruktur yang perlu query, transaksi, dan indeks. AsyncStorage lebih cocok untuk preferensi kecil. Menyimpan ribuan pengeluaran sebagai JSON lalu memfilternya di JavaScript membuang memori dan waktu.'
  },
  {
    id: 'rn32',
    q: 'Mengapa insert data dan insert outbox harus berada dalam satu transaksi?',
    options: [
      'Agar database lebih besar',
      'Agar tidak ada data tersimpan tanpa antrean sinkronisasi ketika salah satu operasi gagal',
      'Agar SQLite berjalan di UI thread',
      'Agar data otomatis terkirim ke server'
    ],
    answer: 1,
    explain: 'Transaksi memastikan keduanya berhasil atau keduanya dibatalkan. Tanpa transaksi, aplikasi bisa menyimpan pengeluaran tetapi gagal mencatat outbox, sehingga data tidak pernah tersinkronisasi.'
  },
  {
    id: 'rn33',
    q: 'Apa fungsi idempotency key pada sinkronisasi?',
    options: [
      'Mempercepat koneksi internet',
      'Mencegah operasi yang sama diproses dua kali ketika response hilang dan klien mencoba ulang',
      'Mengenkripsi database lokal',
      'Menghapus kebutuhan autentikasi'
    ],
    answer: 1,
    explain: 'Jika server menyimpan data tetapi response hilang, klien akan mencoba lagi. Tanpa idempotency key, server dapat membuat duplikat. Key unik per operasi memungkinkan server mengenali percobaan ulang dan mengembalikan hasil yang sama.'
  },

  /* ---------------- Bab 12 — Form ---------------- */
  {
    id: 'rn34',
    q: 'Apa keuntungan memakai React Hook Form + Zod?',
    options: [
      'Menghilangkan kebutuhan validasi server',
      'Mengurangi render ulang dan menjaga aturan validasi serta tipe TypeScript tetap sinkron',
      'Membuat form otomatis terkirim',
      'Menggantikan database lokal'
    ],
    answer: 1,
    explain: 'React Hook Form mengelola input dengan efisien, sedangkan Zod mendefinisikan skema yang menghasilkan tipe. Validasi server tetap wajib karena klien tidak tepercaya. Keduanya tidak menghilangkan kebutuhan menangani keyboard atau error UI.'
  },
  {
    id: 'rn35',
    q: 'Pada skema Zod yang mentransformasi amount string menjadi number, z.input dan z.output berbeda karena…',
    options: [
      'z.input selalu any',
      'z.input adalah bentuk sebelum transformasi (string dari input), z.output adalah hasil akhir setelah validasi (number)',
      'z.output hanya untuk server',
      'Tidak ada perbedaan sama sekali'
    ],
    answer: 1,
    explain: 'Form memberikan string dari TextInput. Skema mengubahnya menjadi number dan memvalidasi hasilnya. z.input memodelkan nilai awal, z.output memodelkan nilai yang dikirim setelah validasi. React Hook Form memakai keduanya untuk tipe yang akurat.'
  },
  {
    id: 'rn36',
    q: 'Saat mengunggah FormData di React Native, mengapa Content-Type tidak boleh diset manual menjadi multipart/form-data?',
    options: [
      'Karena FormData tidak mendukung upload',
      'Karena boundary harus dibuat otomatis; menyetel header manual tanpa boundary membuat server gagal mem-parsing body',
      'Karena React Native hanya mendukung JSON',
      'Karena Content-Type tidak pernah dipakai'
    ],
    answer: 1,
    explain: 'Body multipart membutuhkan boundary yang cocok dengan header. fetch membuat boundary otomatis jika header tidak disetel manual. Menyetel header tanpa boundary menghasilkan request yang tidak valid.'
  },

  /* ---------------- Bab 13 — Fitur Native ---------------- */
  {
    id: 'rn37',
    q: 'Kapan waktu terbaik meminta izin kamera atau lokasi?',
    options: [
      'Saat aplikasi pertama kali dibuka, bersama semua izin lain',
      'Tepat sebelum fitur yang membutuhkan izin dipakai, dengan penjelasan manfaatnya',
      'Setelah pengguna menekan tombol batal',
      'Hanya saat aplikasi di latar belakang'
    ],
    answer: 1,
    explain: 'Meminta izin saat fitur dipakai memberi konteks dan meningkatkan kemungkinan diterima. Meminta semuanya di awal terasa mencurigakan. Jelaskan alasan, tangani penolakan, dan tetap sediakan jalan tanpa fitur tersebut.'
  },
  {
    id: 'rn38',
    q: 'Apa perbedaan notifikasi lokal dan push notification?',
    options: [
      'Keduanya selalu dikirim server',
      'Notifikasi lokal dijadwalkan perangkat; push notification dikirim server melalui layanan platform dan membutuhkan token perangkat',
      'Notifikasi lokal hanya untuk Android',
      'Push notification tidak membutuhkan izin'
    ],
    answer: 1,
    explain: 'Notifikasi lokal dijadwalkan aplikasi di perangkat, misalnya pengingat harian. Push notification berasal dari server dan membutuhkan token perangkat serta layanan platform. Keduanya membutuhkan izin dan konfigurasi channel di Android.'
  },
  {
    id: 'rn39',
    q: 'Jika pengguna menolak izin lokasi, perilaku aplikasi yang benar adalah…',
    options: [
      'Crash agar pengguna tahu kesalahannya',
      'Tetap mengizinkan penyimpanan pengeluaran tanpa koordinat dan menampilkan penjelasan yang sopan',
      'Meminta izin berulang kali tanpa henti',
      'Mengaktifkan GPS diam-diam'
    ],
    answer: 1,
    explain: 'Lokasi adalah fitur opsional. Penolakan izin tidak boleh menghalangi alur utama. Jelaskan bahwa lokasi tidak ditambahkan, dan arahkan ke pengaturan bila pengguna ingin mengaktifkannya nanti.'
  },

  /* ---------------- Bab 14 — UI/UX ---------------- */
  {
    id: 'rn40',
    q: 'Berapa ukuran area sentuh minimum yang disarankan untuk tombol mobile?',
    options: [
      '10×10 poin',
      'Sekitar 44×44 poin (iOS) atau 48×48 dp (Android)',
      '200×200 poin untuk semua tombol',
      'Tidak ada batasan'
    ],
    answer: 1,
    explain: 'Pedoman umum menyarankan sekitar 44 poin di iOS dan 48 dp di Android. Ikon boleh terlihat kecil, tetapi area sentuh efektif harus cukup besar, misalnya dengan padding atau hitSlop.'
  },
  {
    id: 'rn41',
    q: 'Mengapa komponen Button sebaiknya memiliki varian (primary, secondary, danger)?',
    options: [
      'Agar kode lebih panjang',
      'Agar setiap layar memakai bahasa visual yang konsisten dan tidak membuat tombol sendiri-sendiri',
      'Agar tombol otomatis dapat diakses',
      'Agar ukuran aplikasi bertambah'
    ],
    answer: 1,
    explain: 'Varian membatasi pilihan dan menjaga konsistensi. Tanpa itu, setiap layar menciptakan warna, radius, dan padding sendiri. Varian tetap perlu diuji kontras dan aksesibilitasnya.'
  },
  {
    id: 'rn42',
    q: 'Apa perbedaan empty state dan error state?',
    options: [
      'Keduanya sama dan bisa memakai pesan yang sama',
      'Empty state menjelaskan tidak ada data dan menawarkan aksi; error state menjelaskan kegagalan dan menawarkan coba lagi',
      'Empty state hanya untuk iOS',
      'Error state tidak boleh memiliki tombol'
    ],
    answer: 1,
    explain: 'Kosong karena belum ada data berbeda dari gagal memuat. Pesan dan aksi harus sesuai konteks: "Tambah pengeluaran" untuk kosong, "Coba lagi" untuk error, dan "Hapus filter" untuk hasil pencarian kosong.'
  },

  /* ---------------- Bab 15 — Animasi ---------------- */
  {
    id: 'rn43',
    q: 'Apa itu worklet pada React Native Reanimated?',
    options: [
      'Fungsi yang hanya berjalan saat aplikasi ditutup',
      'Fungsi yang dapat dieksekusi di UI thread sehingga animasi tetap halus meski JS thread sibuk',
      'Komponen pengganti View',
      'Berkas konfigurasi build'
    ],
    answer: 1,
    explain: 'Worklet memungkinkan perhitungan animasi dan gesture berjalan di UI thread. Callback useAnimatedStyle dan gesture otomatis berupa worklet. Logika bisnis tetap di JS; gunakan runOnJS untuk memanggil fungsi JS dari worklet.'
  },
  {
    id: 'rn44',
    q: 'Mengapa Gesture.Pan pada baris daftar perlu activeOffsetX dan failOffsetY?',
    options: [
      'Agar gesture bisa dipakai tanpa menyentuh layar',
      'Agar pan horizontal tidak mengalahkan scroll vertikal dan gesture baru aktif setelah arahnya jelas',
      'Agar animasi berjalan di JS thread',
      'Agar baris tidak bisa dihapus'
    ],
    answer: 1,
    explain: 'Tanpa offset, setiap gerakan kecil bisa dianggap pan dan bentrok dengan scroll. activeOffsetX menunda aktivasi sampai geseran horizontal cukup, sedangkan failOffsetY membatalkan pan jika pengguna menggeser vertikal.'
  },
  {
    id: 'rn45',
    q: 'Bagaimana aplikasi sebaiknya merespons preferensi reduce motion?',
    options: [
      'Mengabaikannya karena animasi selalu penting',
      'Mengurangi atau menonaktifkan animasi dekoratif, tetapi tetap memberi umpan balik perubahan state',
      'Menghapus semua tombol',
      'Memaksa animasi lebih cepat dan lebih besar'
    ],
    answer: 1,
    explain: 'Reduce motion membantu pengguna dengan gangguan vestibular. Animasi dekoratif bisa dimatikan, sedangkan perubahan penting tetap ditampilkan secara instan atau dengan fade singkat. Uji dengan pengaturan sistem, bukan flag manual.'
  },

  /* ---------------- Bab 16 — Performa & Realtime ---------------- */
  {
    id: 'rn46',
    q: 'Langkah pertama sebelum mengoptimalkan performa adalah…',
    options: [
      'Menambahkan React.memo ke semua komponen',
      'Mengukur dengan profiler dan release build untuk menemukan bottleneck nyata',
      'Menghapus semua animasi',
      'Mengganti FlatList dengan ScrollView'
    ],
    answer: 1,
    explain: 'Optimasi tanpa pengukuran sering menambah kompleksitas tanpa manfaat. Profiler menunjukkan komponen yang mahal, Performance Monitor menunjukkan frame drop, dan release build memberi gambaran mendekati produksi.'
  },
  {
    id: 'rn47',
    q: 'React.memo pada baris daftar tidak efektif jika…',
    options: [
      'Baris memiliki teks',
      'Props fungsi dibuat ulang setiap render induk sehingga referensinya selalu berubah',
      'Baris memakai StyleSheet',
      'Daftar memiliki lebih dari 10 item'
    ],
    answer: 1,
    explain: 'React.memo membandingkan props secara dangkal. Fungsi baru setiap render membuat props selalu berbeda. Stabilkan dengan useCallback di induk atau definisikan handler di tempat yang tepat, lalu ukur dampaknya.'
  },
  {
    id: 'rn48',
    q: 'Apa yang harus dilakukan saat komponen WebSocket dilepas?',
    options: [
      'Membiarkan koneksi terbuka agar cepat saat dibuka lagi',
      'Menutup koneksi dan menghapus listener agar tidak ada koneksi ganda atau memory leak',
      'Membuka koneksi baru setiap render',
      'Menghapus database'
    ],
    answer: 1,
    explain: 'Cleanup harus menutup socket dan menghapus listener. Tanpa itu, setiap render atau navigasi dapat meninggalkan koneksi terbuka. Gunakan flag untuk membedakan penutupan sengaja dari putus jaringan agar tidak memicu reconnect yang tidak perlu.'
  },

  /* ---------------- Bab 17 — Arsitektur & Native ---------------- */
  {
    id: 'rn49',
    q: 'Dalam feature-based architecture, lapisan domain sebaiknya…',
    options: [
      'Mengimpor komponen React Native dan database',
      'Berisi tipe dan aturan bisnis yang tidak bergantung pada UI atau penyimpanan',
      'Hanya berisi style',
      'Menjadi tempat semua komponen UI'
    ],
    answer: 1,
    explain: 'Domain adalah inti aturan bisnis dan tipe. Ia tidak boleh bergantung pada React Native, SQLite, atau HTTP agar mudah diuji dan dipakai ulang. Data dan presentasi boleh bergantung pada domain, bukan sebaliknya.'
  },
  {
    id: 'rn50',
    q: 'Komponen New Architecture yang bertanggung jawab atas rendering UI adalah…',
    options: ['JSI', 'Fabric', 'TurboModules', 'Codegen'],
    answer: 1,
    explain: 'Fabric adalah renderer UI baru. JSI adalah antarmuka JavaScript-native, TurboModules adalah modul native lazy, dan Codegen menghasilkan kode penghubung dari spesifikasi tipe.'
  },
  {
    id: 'rn51',
    q: 'Kapan sebaiknya kamu menulis native module sendiri?',
    options: [
      'Setiap kali membutuhkan kamera atau lokasi',
      'Hanya ketika kebutuhan tidak bisa dipenuhi modul Expo/community dan manfaatnya lebih besar daripada biaya perawatan dua platform',
      'Saat ingin aplikasi terlihat lebih canggih',
      'Saat TypeScript menghasilkan error'
    ],
    answer: 1,
    explain: 'Modul native menambah beban Kotlin/Swift, build system, dan pengujian dua platform. Cari modul yang sudah ada terlebih dahulu. Tulis sendiri hanya untuk kebutuhan nyata, lalu dokumentasikan alasan dan pemiliknya.'
  },

  /* ---------------- Bab 18 — Testing & Debugging ---------------- */
  {
    id: 'rn52',
    q: 'Mengapa E2E test sebaiknya hanya mencakup sedikit alur?',
    options: [
      'Karena E2E tidak bisa mendeteksi bug',
      'Karena E2E lambat dan rapuh; fokuskan pada alur kritis, sedangkan detail diuji dengan unit/component test',
      'Karena E2E hanya berjalan di iOS',
      'Karena E2E tidak membutuhkan aplikasi'
    ],
    answer: 1,
    explain: 'Piramida pengujian menempatkan banyak unit test cepat di bawah dan sedikit E2E di atas. E2E memberi kepercayaan pada alur nyata, tetapi mahal dan rentan terhadap perubahan UI. Uji detail di level yang lebih rendah.'
  },
  {
    id: 'rn53',
    q: 'Cara paling baik mencari tombol pada React Native Testing Library adalah…',
    options: [
      'Berdasarkan urutan render internal',
      'Berdasarkan peran dan label yang dilihat pengguna, misalnya getByRole("button", { name: "Simpan" })',
      'Berdasarkan nama berkas komponen',
      'Berdasarkan jumlah state di komponen'
    ],
    answer: 1,
    explain: 'Query berbasis peran dan label meniru cara pengguna dan pembaca layar menemukan elemen. Test menjadi lebih tahan refactor dan sekaligus memeriksa aksesibilitas dasar. Hindari ketergantungan pada struktur internal.'
  },
  {
    id: 'rn54',
    q: 'Apa fungsi clearState: true pada alur Maestro?',
    options: [
      'Menghapus kode aplikasi',
      'Memastikan test dimulai dari kondisi aplikasi bersih, tanpa data atau sesi dari test sebelumnya',
      'Menghapus semua screenshot',
      'Mematikan jaringan'
    ],
    answer: 1,
    explain: 'Test E2E harus mandiri. clearState menghapus data aplikasi sebelum test sehingga hasilnya tidak bergantung pada urutan atau sisa test sebelumnya. Ini membuat kegagalan lebih mudah direproduksi.'
  },

  /* ---------------- Bab 19 — Build & Produksi ---------------- */
  {
    id: 'rn55',
    q: 'Apa perbedaan build development dan production?',
    options: [
      'Development build untuk pengguna toko, production untuk developer',
      'Development build memuat Metro dan debug menu untuk pengembangan; production dioptimalkan, ditandatangani, dan didistribusikan ke pengguna',
      'Keduanya identik',
      'Production build tidak bisa memakai modul native'
    ],
    answer: 1,
    explain: 'Development build memudahkan iterasi dengan Metro dan modul native proyek. Production build di-minify, memakai environment produksi, signing produksi, dan tidak memiliki debug menu. Jangan mengirim build development ke toko.'
  },
  {
    id: 'rn56',
    q: 'Apa batasan utama EAS Update (OTA)?',
    options: [
      'Tidak bisa mengubah teks',
      'Hanya dapat memperbarui JavaScript dan aset; perubahan kode native, izin, atau library native memerlukan build baru',
      'Hanya berjalan di Android',
      'Tidak membutuhkan runtime version'
    ],
    answer: 1,
    explain: 'OTA mengirim bundel JS dan aset ke build yang kompatibel. Ia tidak mengubah binary native. Perubahan yang membutuhkan build baru harus melalui toko. runtimeVersion memastikan update hanya dikirim ke build yang cocok.'
  },
  {
    id: 'rn57',
    q: 'Bagaimana cara aman menyimpan EXPO_TOKEN di GitHub Actions?',
    options: [
      'Menuliskannya langsung di file workflow',
      'Menyimpannya sebagai secret repositori dan merujuknya dengan ${{ secrets.EXPO_TOKEN }}',
      'Mengirimnya lewat URL publik',
      'Menaruhnya di README'
    ],
    answer: 1,
    explain: 'Secret repositori tidak muncul di log dan tidak ikut ter-commit. Nilai di workflow hanya berupa referensi. Jika token bocor, segera cabut dan buat yang baru; menghapus dari riwayat Git saja tidak cukup.'
  },

  /* ---------------- Bab 20 — Proyek Akhir ---------------- */
  {
    id: 'rn58',
    q: 'Mengapa lingkup MVP perlu menuliskan fitur yang sengaja ditunda?',
    options: [
      'Agar proyek terlihat kurang ambisius',
      'Agar kamu tidak tergoda menambah fitur di tengah jalan dan bisa menyelesaikan alur inti terlebih dahulu',
      'Agar tidak perlu menulis dokumentasi',
      'Agar pengguna tidak tahu fitur apa pun'
    ],
    answer: 1,
    explain: 'Scope creep adalah penyebab umum proyek tidak selesai. Menuliskan fitur di luar lingkup membuat keputusan eksplisit dan melindungi fokus. Fitur yang ditunda bisa masuk versi berikutnya setelah alur inti stabil.'
  },
  {
    id: 'rn59',
    q: 'Kriteria penerimaan proyek sebaiknya berupa…',
    options: [
      'Daftar teknologi yang dipakai',
      'Perilaku yang bisa dibuktikan, misalnya "data bertahan setelah restart" dan "tidak ada duplikat setelah retry"',
      'Jumlah baris kode',
      'Jumlah komponen yang dibuat'
    ],
    answer: 1,
    explain: 'Kriteria penerimaan harus dapat diuji dan berorientasi hasil. "Memakai SQLite" bukan bukti bahwa data bertahan. "Data bertahan setelah aplikasi ditutup paksa" adalah perilaku yang bisa diverifikasi.'
  },
  {
    id: 'rn60',
    q: 'Apa yang membuat portofolio aplikasi mobile meyakinkan?',
    options: [
      'Hanya daftar library terbaru',
      'Kode yang bisa dijalankan, demo/screenshot, dokumentasi keputusan, dan bukti pengujian serta build',
      'Jumlah folder yang banyak',
      'Nama aplikasi yang mirip produk terkenal'
    ],
    answer: 1,
    explain: 'Perekrut dan pengguna ingin melihat bukti: aplikasi berjalan, README yang jelas, demo, dan alasan di balik keputusan arsitektur. Daftar teknologi tanpa konteks tidak menunjukkan kemampuan menyelesaikan masalah.'
  }
);
