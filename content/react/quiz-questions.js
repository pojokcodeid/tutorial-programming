/* ============================================================
   Kumpulan soal kuis React — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.REACT_QUIZ_POOL = [
  {
    id: 'r01',
    q: 'React adalah…',
    options: ['Library JavaScript untuk membangun antarmuka pengguna', 'Bahasa pemrograman baru pengganti JavaScript', 'Sistem manajemen database', 'Program desain grafis'],
    answer: 0,
    explain: 'React adalah library JavaScript untuk membangun UI berbasis komponen, dibuat oleh tim Facebook (Meta) dan dirilis pada 2013.'
  },
  {
    id: 'r02',
    q: 'SPA (Single Page Application) berarti…',
    options: ['Hanya memuat satu dokumen HTML lalu menukar kontennya tanpa reload', 'Aplikasi yang hanya boleh punya satu halaman', 'Situs yang tidak bisa dibuka di ponsel', 'Aplikasi tanpa JavaScript'],
    answer: 0,
    explain: 'Pada SPA, browser memuat satu dokumen lalu JavaScript mengganti komponen yang tampil sehingga terasa cepat tanpa memuat ulang halaman.'
  },
  {
    id: 'r03',
    q: 'Fungsi utama Virtual DOM adalah…',
    options: ['Menghitung perbedaan dan memperbarui hanya bagian DOM yang berubah', 'Menggantikan HTML sepenuhnya', 'Menyimpan data di server', 'Mempercepat koneksi internet'],
    answer: 0,
    explain: 'React membuat tiruan DOM di memori (Virtual DOM), membandingkannya (diffing), lalu hanya menulis perbedaannya ke DOM asli agar pembaruan efisien.'
  },
  {
    id: 'r04',
    q: 'Pendekatan "deklaratif" pada React berarti…',
    options: ['Kita mendeskripsikan tampilan yang diinginkan, React mengurus perubahan DOM', 'Kita menuliskan setiap langkah manipulasi DOM secara manual', 'Kita mendeklarasikan variabel global', 'Kita menulis HTML tanpa JavaScript'],
    answer: 0,
    explain: 'React bersifat deklaratif: kita cukup mendeskripsikan tampilan untuk suatu kondisi data, lalu React yang mengurus cara memperbarui DOM.'
  },
  {
    id: 'r05',
    q: 'Apa itu JSX?',
    options: ['Sintaks mirip HTML di dalam JavaScript untuk mendeskripsikan tampilan', 'Berkas gaya CSS khusus React', 'Bahasa query database', 'Nama lain dari JSON'],
    answer: 0,
    explain: 'JSX adalah sintaks mirip HTML di dalam JavaScript. Saat build, ia diubah menjadi pemanggilan React.createElement.'
  },
  {
    id: 'r06',
    q: 'Atribut class pada HTML harus ditulis bagaimana di JSX?',
    options: ['className', 'class', 'cssClass', 'styleName'],
    answer: 0,
    explain: 'Karena "class" adalah kata kunci di JavaScript, JSX memakai className. Begitu pula "for" menjadi htmlFor.'
  },
  {
    id: 'r07',
    q: 'Untuk membungkus beberapa elemen JSX tanpa menambah elemen ke DOM, kita memakai…',
    options: ['Fragment <>...</>', 'Elemen <div> wajib', 'Tag <body>', 'Komentar HTML'],
    answer: 0,
    explain: 'Satu return JSX hanya boleh punya satu elemen induk. Fragment <>...</> membungkus tanpa menambah elemen nyata ke DOM.'
  },
  {
    id: 'r08',
    q: 'Bagaimana menyisipkan nilai variabel JavaScript ke dalam JSX?',
    options: ['Dengan kurawal { }', 'Dengan tanda kurung siku [ ]', 'Dengan dua titik dua ::', 'Dengan tanda persen %'],
    answer: 0,
    explain: 'Ekspresi JavaScript disisipkan dengan kurawal, mis. <h1>Halo, {nama}!</h1>.'
  },
  {
    id: 'r09',
    q: 'Mengapa nama komponen React harus diawali huruf kapital?',
    options: ['Agar React membedakannya dari tag HTML biasa', 'Supaya kode berjalan lebih cepat', 'Karena JavaScript mewajibkannya', 'Agar bisa diekspor'],
    answer: 0,
    explain: 'React menganggap nama berhuruf kapital sebagai komponen (dipanggil sebagai function), sedangkan huruf kecil dianggap tag HTML asli.'
  },
  {
    id: 'r10',
    q: 'Pernyataan yang benar tentang props adalah…',
    options: ['Props hanya-baca dan mengalir satu arah dari induk ke anak', 'Props boleh diubah langsung oleh komponen anak', 'Props hanya untuk menyimpan angka', 'Props dikirim dari anak ke induk'],
    answer: 0,
    explain: 'Props bersifat read-only dan mengalir satu arah (one-way data flow) dari komponen induk ke anak. Untuk mengubah data, anak memanggil function yang dikirim sebagai props.'
  },
  {
    id: 'r11',
    q: 'Props spesial "children" berisi…',
    options: ['Isi yang berada di antara tag pembuka dan penutup komponen', 'Daftar komponen saudara', 'State lokal komponen', 'Nilai default props'],
    answer: 0,
    explain: 'Segala sesuatu di antara <Komponen> dan </Komponen> dikirim sebagai props.children, berguna untuk membuat komponen pembungkus.'
  },
  {
    id: 'r12',
    q: 'Pada function Kartu({ judul, warna = "biru" }), bagian warna = "biru" adalah…',
    options: ['Nilai bawaan (default) bila props warna tidak dikirim', 'Tipe data props', 'Nama alias', 'Validasi props'],
    answer: 0,
    explain: 'warna = "biru" memberi nilai bawaan. Bila props warna tidak dikirim, komponen memakai "biru".'
  },
  {
    id: 'r13',
    q: 'Dalam inline style React, background-color ditulis…',
    options: ['backgroundColor', 'background-color', 'background_color', 'bgColor()'],
    answer: 0,
    explain: 'Inline style React ditulis sebagai objek JavaScript dengan nama properti camelCase, mis. backgroundColor, fontSize, borderRadius.'
  },
  {
    id: 'r14',
    q: 'Apa kelebihan CSS Modules?',
    options: ['Nama kelasnya unik per komponen sehingga tidak bentrok', 'Membuat halaman otomatis lebih cepat', 'Menghapus kebutuhan JavaScript', 'Menggantikan props'],
    answer: 0,
    explain: 'CSS Modules (*.module.css) mengubah nama kelas menjadi unik sehingga gaya satu komponen tidak bocor ke komponen lain.'
  },
  {
    id: 'r15',
    q: 'Pendekatan Tailwind CSS menyusun tampilan dengan…',
    options: ['Kelas utilitas kecil yang digabung di className', 'Satu berkas CSS besar per halaman', 'Kode JavaScript untuk setiap gaya', 'Gambar saja'],
    answer: 0,
    explain: 'Tailwind adalah framework utility-first: gaya disusun dari kelas-kelas kecil seperti bg-indigo-50, rounded-xl, dan p-4.'
  },
  {
    id: 'r16',
    q: 'Hook untuk menambahkan state pada functional component adalah…',
    options: ['useState', 'useEffect', 'useRef', 'useMemo'],
    answer: 0,
    explain: 'useState mengembalikan pasangan [nilai, setter] dan membuat komponen menyimpan data yang bisa berubah.'
  },
  {
    id: 'r17',
    q: 'Mengapa setNilai(n => n + 1) lebih aman daripada setNilai(nilai + 1) saat beberapa pembaruan beruntun?',
    options: ['Functional update selalu memakai nilai state paling baru', 'Karena lebih pendek', 'Karena wajib di React', 'Karena menghapus state lama'],
    answer: 0,
    explain: 'Functional update menerima nilai state terbaru, sehingga beberapa pemanggilan beruntun tidak saling menimpa dengan nilai yang basi.'
  },
  {
    id: 'r18',
    q: 'Cara benar memperbarui state berupa objek adalah…',
    options: ['Membuat salinan baru: setUser({ ...user, poin: user.poin + 1 })', 'Mengubah langsung: user.poin++', 'Menghapus objek lalu membuat ulang', 'Menyimpan objek di localStorage saja'],
    answer: 0,
    explain: 'State tidak boleh diubah langsung. Untuk objek/array, buat salinan baru (mis. dengan spread) agar React mendeteksi perubahan.'
  },
  {
    id: 'r19',
    q: 'Penulisan event klik yang benar di React adalah…',
    options: ['onClick={tanganiKlik}', 'onclick="tanganiKlik()"', 'onClick="tanganiKlik"', 'click=tanganiKlik'],
    answer: 0,
    explain: 'Event React memakai camelCase (onClick, onChange) dan nilainya sebuah function, bukan string.'
  },
  {
    id: 'r20',
    q: 'Untuk menyimpan isi input ke state saat pengguna mengetik, dipakai…',
    options: ['onChange={(e) => setNama(e.target.value)}', 'onClick={(e) => setNama(e)}', 'onSubmit={(e) => setNama(e)}', 'onLoad={(e) => setNama(e)}'],
    answer: 0,
    explain: 'onChange dipicu setiap isi input berubah; e.target.value berisi teks yang diketik.'
  },
  {
    id: 'r21',
    q: 'Operator yang tepat untuk memilih satu dari dua tampilan di JSX adalah…',
    options: ['Ternary: kondisi ? A : B', 'kondisi & A & B', 'kondisi >> A >> B', 'kondisi :: A :: B'],
    answer: 0,
    explain: 'Ternary kondisi ? nilaiBenar : nilaiSalah dipakai untuk memilih satu dari dua tampilan dalam JSX.'
  },
  {
    id: 'r22',
    q: 'Mengapa sebaiknya menulis {jumlah > 0 && <p>...</p>} alih-alih {jumlah && <p>...</p>}?',
    options: ['Karena angka 0 akan ikut tampil bila memakai {jumlah && ...}', 'Karena operator > lebih cepat', 'Karena && tidak boleh di JSX', 'Karena 0 bukan angka'],
    answer: 0,
    explain: 'Bila jumlah bernilai 0, {jumlah && ...} menampilkan angka 0 di layar. Gunakan pembanding eksplisit seperti jumlah > 0.'
  },
  {
    id: 'r23',
    q: 'Props yang wajib ada pada setiap elemen daftar hasil .map() adalah…',
    options: ['key', 'id', 'index', 'ref'],
    answer: 0,
    explain: 'Setiap elemen hasil .map() harus punya props key yang unik & stabil agar React melacak perubahan item dengan tepat.'
  },
  {
    id: 'r24',
    q: 'Mengapa index kurang ideal sebagai key pada daftar yang bisa berubah urutannya?',
    options: ['Karena identitas item bisa tersambung ke item yang salah saat urutan berubah', 'Karena index selalu duplikat', 'Karena index bukan angka', 'Karena React membenci angka'],
    answer: 0,
    explain: 'Bila item ditambah/dihapus/diurutkan, key berbasis index bisa membuat React salah mencocokkan item, sehingga state tersambung ke item yang keliru. Utamakan id unik.'
  },
  {
    id: 'r25',
    q: 'useEffect(() => { ... }, []) dijalankan…',
    options: ['Sekali saja, setelah render pertama', 'Setiap kali komponen render', 'Hanya saat state berubah', 'Sebelum render pertama'],
    answer: 0,
    explain: 'Array dependensi kosong [] berarti efek dijalankan sekali setelah render pertama (mirip componentDidMount).'
  },
  {
    id: 'r26',
    q: 'Apa fungsi "cleanup" pada useEffect?',
    options: ['Membersihkan efek seperti timer/listener sebelum efek dijalankan ulang atau saat komponen dilepas', 'Menghapus seluruh state komponen', 'Merender ulang komponen', 'Menghapus berkas proyek'],
    answer: 0,
    explain: 'Efek dapat mengembalikan function cleanup untuk menghentikan timer, melepas event listener, atau membatalkan permintaan sebelum efek berikutnya.'
  },
  {
    id: 'r27',
    q: 'Efek tanpa array dependensi yang memanggil setState dapat menyebabkan…',
    options: ['Loop render tak berujung', 'Komponen otomatis terhapus', 'State menjadi permanen', 'Kode berjalan lebih cepat'],
    answer: 0,
    explain: 'Efek tanpa dependensi berjalan setiap render; bila memanggil setState, terjadi render → efek → setState berulang tanpa henti.'
  },
  {
    id: 'r28',
    q: 'Di mana Hook boleh dipanggil?',
    options: ['Hanya di level teratas komponen atau Custom Hook', 'Di dalam if dan loop apa pun', 'Hanya di dalam event handler', 'Di mana saja asalkan di dalam function'],
    answer: 0,
    explain: 'Hook harus dipanggil di level teratas komponen/Custom Hook, tidak di dalam if, loop, atau function bersarang, agar urutannya konsisten.'
  },
  {
    id: 'r29',
    q: 'useRef terutama dipakai untuk…',
    options: ['Mengakses elemen DOM langsung dan menyimpan nilai tanpa render ulang', 'Menyimpan state yang berubah tampilan', 'Mengambil data dari API', 'Membagi state antar komponen'],
    answer: 0,
    explain: 'useRef mengembalikan { current } untuk merujuk elemen DOM (mis. memfokuskan input) atau menyimpan nilai internal tanpa memicu render ulang.'
  },
  {
    id: 'r30',
    q: 'Mengapa nilai yang harus terlihat di layar tidak boleh disimpan di useRef?',
    options: ['Karena mengubah ref.current tidak memicu render ulang', 'Karena ref tidak bisa menyimpan angka', 'Karena ref hanya untuk teks', 'Karena ref dihapus setiap render'],
    answer: 0,
    explain: 'Ref hanyalah "kotak" biasa. Mengubahnya tidak memicu render ulang, jadi tampilan tidak ikut berubah. Untuk nilai yang tampil, gunakan state.'
  },
  {
    id: 'r31',
    q: 'useMemo berguna untuk…',
    options: ['Mengingat hasil perhitungan agar tidak dihitung ulang bila dependensi tak berubah', 'Menyimpan state global', 'Mengambil data dari server', 'Merender daftar'],
    answer: 0,
    explain: 'useMemo menyimpan (memoize) hasil perhitungan dan menghitung ulang hanya bila nilai pada array dependensi berubah.'
  },
  {
    id: 'r32',
    q: 'useCallback paling bermanfaat saat…',
    options: ['Function dikirim ke komponen anak yang dibungkus React.memo', 'Kita ingin mengubah DOM langsung', 'Kita ingin mengambil data API', 'Kita ingin membuat state baru'],
    answer: 0,
    explain: 'useCallback menjaga identitas function tetap stabil. Tanpa itu, React.memo pada anak selalu menganggap props function berubah sehingga render ulang tetap terjadi.'
  },
  {
    id: 'r33',
    q: 'Perbedaan controlled dan uncontrolled component adalah…',
    options: ['Controlled nilainya dikendalikan state React; uncontrolled disimpan DOM (ref/FormData)', 'Controlled hanya untuk angka', 'Uncontrolled tidak bisa di-submit', 'Keduanya sama persis'],
    answer: 0,
    explain: 'Controlled memakai value + onChange dengan state React. Uncontrolled membiarkan DOM menyimpan nilai, dibaca lewat ref atau FormData.'
  },
  {
    id: 'r34',
    q: 'Apa fungsi e.preventDefault() pada handler submit form?',
    options: ['Mencegah form memuat ulang halaman', 'Menghapus isi form', 'Mengirim data ke server', 'Memvalidasi email'],
    answer: 0,
    explain: 'Perilaku bawaan submit form adalah memuat ulang halaman. e.preventDefault() mencegahnya agar kita bisa memproses data dengan JavaScript.'
  },
  {
    id: 'r35',
    q: 'Kombinasi library populer untuk menangani form kompleks adalah…',
    options: ['React Hook Form + Zod', 'Bootstrap + jQuery', 'Express + SQLite', 'Webpack + Babel'],
    answer: 0,
    explain: 'React Hook Form mengelola state & error form, sedangkan Zod mendefinisikan skema validasinya melalui zodResolver.'
  },
  {
    id: 'r36',
    q: 'Untuk berpindah halaman di React Router tanpa memuat ulang, gunakan…',
    options: ['<Link to="/tentang">, bukan <a href="/tentang">', '<a href="/tentang">', '<form action="/tentang">', 'window.location = "/tentang"'],
    answer: 0,
    explain: 'Link (dan NavLink) menavigasi lewat router tanpa reload, sedangkan <a href> memaksa browser memuat ulang seluruh halaman.'
  },
  {
    id: 'r37',
    q: 'Hook untuk membaca parameter dinamis seperti /produk/:id adalah…',
    options: ['useParams', 'useNavigate', 'useState', 'useRef'],
    answer: 0,
    explain: 'useParams mengembalikan objek parameter dari URL, mis. { id: "kopi" } untuk rute /produk/:id.'
  },
  {
    id: 'r38',
    q: 'useNavigate dipakai untuk…',
    options: ['Berpindah halaman lewat kode, misalnya setelah login berhasil', 'Membaca parameter URL', 'Menampilkan daftar rute', 'Membuat rute baru'],
    answer: 0,
    explain: 'useNavigate memberi function untuk berpindah halaman dari dalam kode. navigate(-1) kembali, replace:true menggantikan entri riwayat.'
  },
  {
    id: 'r39',
    q: 'Komponen <Outlet /> pada React Router berfungsi untuk…',
    options: ['Menandai tempat rute anak dirender di dalam rute induk', 'Menutup halaman', 'Mengubah URL', 'Menghapus rute'],
    answer: 0,
    explain: 'Dengan rute bersarang, rute induk (layout) selalu tampil dan anaknya dirender pada posisi <Outlet />.'
  },
  {
    id: 'r40',
    q: 'Masalah "prop drilling" diselesaikan dengan…',
    options: ['Context API', 'useState', 'useEffect', 'useRef'],
    answer: 0,
    explain: 'Context API membagikan data langsung ke komponen mana pun, tanpa harus meneruskan props melewati banyak komponen perantara.'
  },
  {
    id: 'r41',
    q: 'Urutan pemakaian Context yang benar adalah…',
    options: ['createContext → Provider (value) → useContext', 'useContext → Provider → createContext', 'Provider → useContext → createContext', 'createContext → useContext → Provider'],
    answer: 0,
    explain: 'Buat context, sediakan nilainya lewat Provider, lalu komponen membacanya dengan useContext.'
  },
  {
    id: 'r42',
    q: 'Library state global yang dikenal ringan dan tanpa Provider adalah…',
    options: ['Zustand', 'Redux Toolkit', 'TanStack Query', 'React Router'],
    answer: 0,
    explain: 'Zustand sangat ringkas: satu store berisi state dan aksinya, dan tidak memerlukan pembungkus Provider.'
  },
  {
    id: 'r43',
    q: 'Redux Toolkit pada dasarnya memudahkan pembuatan…',
    options: ['Store global dengan slice berisi state, reducer, dan action', 'Komponen styling', 'Rute halaman', 'Form validation'],
    answer: 0,
    explain: 'createSlice menyatukan state, reducer, dan action. Redux Toolkit cocok untuk state kompleks berskala besar dan punya DevTools.'
  },
  {
    id: 'r44',
    q: 'TanStack Query paling tepat dipakai untuk…',
    options: ['Mengelola server state: fetch data, caching, dan refetch', 'Memberi gaya pada komponen', 'Membuat rute halaman', 'Mengelola tema aplikasi'],
    answer: 0,
    explain: 'TanStack Query khusus menangani data dari server: caching, sinkronisasi, status loading/error, dan refetch otomatis.'
  },
  {
    id: 'r45',
    q: 'Pasangan React.lazy + Suspense berguna untuk…',
    options: ['Code splitting: memuat komponen hanya saat dibutuhkan', 'Menyimpan data ke database', 'Membuat animasi CSS', 'Memvalidasi form'],
    answer: 0,
    explain: 'React.lazy memuat komponen secara dinamis, dan Suspense menampilkan fallback selama berkasnya diunduh. Bundel awal jadi lebih kecil.'
  },
  {
    id: 'r46',
    q: 'React.memo pada komponen berfungsi untuk…',
    options: ['Melewati render ulang bila props tidak berubah', 'Menyimpan hasil perhitungan', 'Mengambil data API', 'Memberi gaya komponen'],
    answer: 0,
    explain: 'React.memo membungkus komponen agar hanya render ulang bila props-nya benar-benar berubah (secara referensi).'
  },
  {
    id: 'r47',
    q: 'Aturan pemberian nama Custom Hook adalah…',
    options: ['Harus diawali kata "use" dan boleh memanggil Hook lain', 'Boleh nama apa saja', 'Harus diawali huruf kapital', 'Harus berakhiran "Hook"'],
    answer: 0,
    explain: 'Custom Hook wajib diawali "use" agar React & ESLint memperlakukannya sebagai Hook, dan ia boleh memanggil Hook bawaan di dalamnya.'
  },
  {
    id: 'r48',
    q: 'Dua komponen yang memakai Custom Hook yang sama akan…',
    options: ['Mendapat state masing-masing; Hook berbagi logika, bukan state', 'Berbagi satu state yang sama', 'Selalu menampilkan nilai identik', 'Kehilangan state-nya'],
    answer: 0,
    explain: 'Custom Hook memakai ulang logika, bukan state. Setiap pemanggilan Hook menciptakan state sendiri. Untuk berbagi state, gunakan Context atau state global.'
  },
  {
    id: 'r49',
    q: 'Kombinasi tool populer untuk menguji komponen React adalah…',
    options: ['Jest + React Testing Library', 'Figma + Sketch', 'Git + GitHub', 'Nginx + Apache'],
    answer: 0,
    explain: 'Jest menjalankan test, sedangkan React Testing Library menguji komponen dari sudut pandang pengguna. Bila memakai Vite, alternatifnya adalah Vitest.'
  },
  {
    id: 'r50',
    q: 'Kapan sebaiknya memakai findByText alih-alih getByText?',
    options: ['Saat elemen muncul secara asynchronous, mis. setelah data selesai dimuat', 'Saat mencari elemen yang pasti ada', 'Saat menguji CSS', 'Saat ingin mempercepat tes'],
    answer: 0,
    explain: 'findByText mengembalikan Promise dan menunggu elemen muncul, cocok untuk hasil async seperti setelah fetch data.'
  },
  {
    id: 'r51',
    q: 'Cara memberi tipe pada props di React + TypeScript adalah…',
    options: ['Mendefinisikan interface/type lalu memakainya, mis. function Kartu(props: KartuProps)', 'Menambahkan komentar // tipe', 'Menulis props: any', 'Memberi nama props dengan huruf kapital'],
    answer: 0,
    explain: 'Bentuk props didefinisikan dengan interface/type lalu dipasang pada parameter komponen sehingga TypeScript memeriksa kecocokannya.'
  },
  {
    id: 'r52',
    q: 'Penulisan useRef untuk elemen input di TypeScript adalah…',
    options: ['useRef<HTMLInputElement>(null)', 'useRef(null) tanpa tipe', 'useRef<number>(0)', 'useState<HTMLInputElement>()'],
    answer: 0,
    explain: 'useRef<HTMLInputElement>(null) memberi tahu TypeScript elemen apa yang dirujuk, sehingga properti seperti focus() bisa dipakai dengan aman.'
  },
  {
    id: 'r53',
    q: 'Keunggulan Next.js dibanding React murni (CSR) untuk situs publik adalah…',
    options: ['HTML dibuat di server (SSR/SSG) sehingga cepat tampil dan ramah SEO', 'Tidak memerlukan JavaScript', 'Lebih mudah dipasang tanpa Node.js', 'Tidak bisa memakai komponen React'],
    answer: 0,
    explain: 'Next.js mendukung SSR/SSG/ISR. Server mengirim HTML yang sudah berisi konten, sehingga halaman tampil cepat dan mudah dibaca mesin pencari.'
  },
  {
    id: 'r54',
    q: 'Pada App Router Next.js, routing ditentukan oleh…',
    options: ['Struktur folder di dalam app/, dengan page.tsx sebagai halaman', 'Berkas konfigurasi routes.json', 'Atribut pada komponen Link', 'Nama variabel global'],
    answer: 0,
    explain: 'Setiap folder pada app/ menjadi satu segmen URL, dan berkas page.tsx di dalamnya menjadi halaman. Segmen dinamis memakai nama dalam kurung siku, mis. [id].'
  },
  {
    id: 'r55',
    q: 'Mengapa komponen Server Component tidak bisa memakai useState?',
    options: ['Karena ia berjalan di server dan tidak punya state interaktif di klien', 'Karena useState sudah dihapus', 'Karena server tidak punya memori', 'Karena useState hanya untuk CSS'],
    answer: 0,
    explain: 'Server Component dirender di server dan tidak boleh memakai Hook interaktif. Bila butuh interaktivitas, tambahkan "use client" di baris paling atas berkas.'
  },
  {
    id: 'r56',
    q: 'Cara menjalankan aplikasi React hasil Vite di server pengembangan adalah…',
    options: ['npm run dev', 'npm start --server', 'node index.html', 'react run'],
    answer: 0,
    explain: 'npm run dev menyalakan server pengembangan Vite dengan hot reload, biasanya di http://localhost:5173.'
  }
];
