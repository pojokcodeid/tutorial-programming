/* ============================================================
   Kumpulan soal kuis UML — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.UML_QUIZ_POOL = [
  {
    id: 'u01',
    q: 'Apa kepanjangan dari UML?',
    options: ['Unified Modeling Language', 'Universal Model Language', 'Unified Markup Language', 'User Modeling Language'],
    answer: 0,
    explain: 'UML adalah Unified Modeling Language — bahasa terpadu untuk memodelkan sistem perangkat lunak secara visual.'
  },
  {
    id: 'u02',
    q: 'UML dikembangkan oleh tokoh dari Rational Corporation, kecuali…',
    options: ['Linus Torvalds', 'Grady Booch', 'James Rumbaugh', 'Ivar Jacobson'],
    answer: 0,
    explain: 'UML dibuat oleh "tiga amigos": Grady Booch, James Rumbaugh, dan Ivar Jacobson. Linus Torvalds adalah pencipta kernel Linux (bukan UML).'
  },
  {
    id: 'u03',
    q: 'Pernyataan yang BENAR tentang UML adalah…',
    options: ['UML adalah bahasa (notasi + semantik), bukan metodologi pengembangan', 'UML adalah bahasa pemrograman', 'UML adalah metodologi pengembangan wajib', 'UML hanya dipakai untuk database'],
    answer: 0,
    explain: 'UML hanya menyediakan notasi (cara menggambar) dan semantik (makna). UML bukan proses/ metodologi — bisa dipakai dengan metodologi apa pun.'
  },
  {
    id: 'u04',
    q: 'Kata "Unified" pada UML berarti UML menyatukan…',
    options: ['Metode lama, tahapan, domain, bahasa, dan platform menjadi satu', 'Hanya dua metode lama', 'Seluruh database dunia', 'Hanya bahasa pemrograman Java'],
    answer: 0,
    explain: '"Unified" = menyatukan metode lama (Booch, OMT, Objectory), tahapan siklus hidup, domain aplikasi, bahasa/platform, dan konsep internal.'
  },
  {
    id: 'u05',
    q: 'Organisasi yang mengakui UML sebagai standar pada tahun 1997 adalah…',
    options: ['OMG (Object Management Group)', 'ISO', 'W3C', 'IEEE'],
    answer: 0,
    explain: 'OMG mengakui UML sebagai standar pada 1997; kemudian ISO mengakuinya pada 2000.'
  },
  {
    id: 'u06',
    q: 'Pembeda utama tahap ANALISIS dan DESAIN adalah…',
    options: ['Analisis menjawab APA (netral teknologi), desain menjawab BAGAIMANA (memilih teknologi)', 'Analisis lebih sulit daripada desain', 'Desain dilakukan sebelum analisis', 'Keduanya sama persis'],
    answer: 0,
    explain: 'Analisis fokus APA yang dibutuhkan dari sudut domain masalah (netral teknologi); desain fokus BAGAIMANA membangunnya dengan teknologi konkret.'
  },
  {
    id: 'u07',
    q: 'Diagram yang umumnya lahir pada tahap ANALISIS adalah…',
    options: ['Use Case Diagram', 'Deployment Diagram', 'Component Diagram', 'Diagram kelas teknis detail'],
    answer: 0,
    explain: 'Use Case (kebutuhan pengguna) dan model kelas domain awal lahir di analisis. Class detail, Component, dan Deployment lahir di desain.'
  },
  {
    id: 'u08',
    q: 'Dalam OOAD, "kelas" adalah…',
    options: ['Cetakan/blueprint yang mendefinisikan atribut dan operasi', 'Objek nyata di memori', 'Jenis database', 'Nama program'],
    answer: 0,
    explain: 'Kelas adalah cetakan (blueprint); objek adalah instance nyata yang dibuat dari kelas tersebut.'
  },
  {
    id: 'u09',
    q: 'Empat pilar OOP adalah…',
    options: ['Abstraksi, enkapsulasi, pewarisan, polimorfisme', 'Input, proses, output, storage', 'Model, view, controller, router', 'Class, object, method, variable'],
    answer: 0,
    explain: 'Empat pilar OOP: abstraksi, enkapsulasi, pewarisan (inheritance), dan polimorfisme.'
  },
  {
    id: 'u10',
    q: 'Secara umum, diagram UML 2.0 dibagi menjadi dua keluarga besar…',
    options: ['Struktural (statis) dan Perilaku (dinamis)', 'Klasis dan Sketsa', 'Model dan View', 'Lokal dan Remote'],
    answer: 0,
    explain: 'UML 2.0 punya 14 diagram: 7 struktural (foto/statis) dan 7 perilaku (video/dinamis).'
  },
  {
    id: 'u11',
    q: 'Berapa jumlah total diagram dalam UML 2.0?',
    options: ['14', '9', '7', '20'],
    answer: 0,
    explain: 'UML 2.0 memiliki 14 diagram: 7 struktural dan 7 perilaku (4 di antaranya diagram interaksi).'
  },
  {
    id: 'u12',
    q: 'Diagram berikut yang termasuk kelompok STRUKTURAL adalah…',
    options: ['Component Diagram', 'Sequence Diagram', 'Activity Diagram', 'State Machine Diagram'],
    answer: 0,
    explain: 'Component, Class, Object, Package, Deployment, Composite Structure, dan Profile adalah diagram struktural. Sequence, Activity, State Machine adalah perilaku.'
  },
  {
    id: 'u13',
    q: 'Diagram yang menunjukkan struktur kelas beserta atribut, operasi, dan relasinya adalah…',
    options: ['Class Diagram', 'Use Case Diagram', 'Timing Diagram', 'Activity Diagram'],
    answer: 0,
    explain: 'Class Diagram adalah fondasi model struktural: mendeskripsikan kelas, atribut, operasi, dan relasi antar kelas.'
  },
  {
    id: 'u14',
    q: 'Pada notasi kelas, visibilitas "+ private" (tanda #) berarti…',
    options: ['Protected — bisa diakses kelas itu sendiri dan kelas turunannya', 'Public — terbuka untuk semua', 'Private — hanya kelas itu sendiri', 'Static'],
    answer: 0,
    explain: 'Tanda # = protected (diakses kelas sendiri & turunan). + = public, - = private.'
  },
  {
    id: 'u15',
    q: 'Relasi "is-a" (warisan) antar kelas digambarkan dengan…',
    options: ['Garis dengan segitiga terbuka (generalization)', 'Garis dengan wajik penuh', 'Garis putus-panah', 'Garis polos'],
    answer: 0,
    explain: 'Generalization/inheritance pakai garis dengan segitiga terbuka yang menunjuk ke kelas induk. Composition = wajik penuh; dependency = garis putus.'
  },
  {
    id: 'u16',
    q: 'Perbedaan Aggregation dan Composition adalah…',
    options: ['Composition (wajik penuh) = bagian tak bisa lepas dari induk; Aggregation (wajik terbuka) = bagian bisa berdiri sendiri', 'Keduanya sama saja', 'Aggregation selalu lebih kuat', 'Composition tidak pakai wajik'],
    answer: 0,
    explain: 'Composition (wajik penuh) hubungan kuat — bagian hidup/mati bersama induk (Buku–Halaman). Aggregation (wajik terbuka) lemah — bagian bisa exist sendiri (Perpustakaan–Buku).'
  },
  {
    id: 'u17',
    q: 'Diagram yang menampilkan instance objek pada satu saat tertentu (snapshot) adalah…',
    options: ['Object Diagram', 'Class Diagram', 'Package Diagram', 'Profile Diagram'],
    answer: 0,
    explain: 'Object Diagram menampilkan instance (namaObjek : Kelas dengan nilai atribut) sebagai snapshot pada satu waktu — berguna menguji class diagram.'
  },
  {
    id: 'u18',
    q: 'Notasi objek pada object diagram ditulis…',
    options: ['namaObjek : Kelas (digarisbawahi)', 'Kelas() { }', '«object» Kelas', '@namaObjek'],
    answer: 0,
    explain: 'Object ditulis "namaObjek : Kelas" dan digarisbawahi, sering dengan nilai atribut terisi (mis. buku1 : Buku).'
  },
  {
    id: 'u19',
    q: 'Diagram yang dipakai untuk mengelompokkan elemen dan menunjukkan ketergantungan antar paket adalah…',
    options: ['Package Diagram', 'Component Diagram', 'Use Case Diagram', 'Timing Diagram'],
    answer: 0,
    explain: 'Package Diagram memakai notasi "folder" untuk mengelompokkan elemen dan garis dependensi antar paket — berguna untuk aritektur besar.'
  },
  {
    id: 'u20',
    q: 'Diagram yang menggambarkan komponen (modul) beserta antarmuka port-nya adalah…',
    options: ['Component Diagram', 'Deployment Diagram', 'Object Diagram', 'Activity Diagram'],
    answer: 0,
    explain: 'Component Diagram menampilkan komponen, interface penyedia (ball) & dibutuhkan (socket), serta assembly connector.'
  },
  {
    id: 'u21',
    q: 'Deployment Diagram menampilkan…',
    options: ['Penempatan artefak pada node fisik (server, device)', 'Alur kerja pengguna', 'Siklus hidup objek', 'Relasi antar kelas'],
    answer: 0,
    explain: 'Deployment Diagram memetakan infrastruktur fisik: node («device»/«execution environment»), artefak (mis. app.war), dan jalur komunikasi.'
  },
  {
    id: 'u22',
    q: 'Diagram yang menampilkan struktur internal, bagian (part), dan port di dalam sebuah kelas/komponen adalah…',
    options: ['Composite Structure Diagram', 'Class Diagram biasa', 'Package Diagram', 'Use Case Diagram'],
    answer: 0,
    explain: 'Composite Structure Diagram menggambarkan part, port, connector, dan assembly di dalam sebuah struktur berlapis.'
  },
  {
    id: 'u23',
    q: 'Profile Diagram dipakai untuk…',
    options: ['Memperluas UML dengan stereotype/tagged value untuk domain khusus', 'Menggambar alur kerja', 'Menampilkan pesan antar objek', 'Menggambarkan server'],
    answer: 0,
    explain: 'Profile Diagram memperluas UML: mendefinisikan stereotype (mis. «digital») dan tagged value yang menyesuaikan UML untuk domain tertentu.'
  },
  {
    id: 'u24',
    q: 'Diagram yang menggambarkan fungsi/layanan yang diberikan sistem kepada aktor (pengguna) adalah…',
    options: ['Use Case Diagram', 'Sequence Diagram', 'State Machine Diagram', 'Component Diagram'],
    answer: 0,
    explain: 'Use Case Diagram menampilkan aktor (orang) dan use case (oval) beserta interaksinya — jawaban atas APA yang dilakukan pengguna.'
  },
  {
    id: 'u25',
    q: 'Relasi «include» pada use case berarti…',
    options: ['Use case itu selalu memanggil/memakai use case lain (langkah wajib)', 'Use case opsional bila kondisi terpenuhi', 'Keduanya aktor saling terkait', 'Use case diwarisi'],
    answer: 0,
    explain: '«include» = langkah wajib yang selalu disertakan (Pinjam → selalu CekKelayakan). «extend» = opsional bersyarat.'
  },
  {
    id: 'u26',
    q: 'Relasi «extend» pada use case berarti…',
    options: ['Use case tambahan yang OPSIONAL terjadi bila kondisi tertentu terpenuhi', 'Langkah wajib yang selalu terjadi', 'Pewarisan antar aktor', 'Penghapusan use case'],
    answer: 0,
    explain: '«extend» = use case tambahan/opsional dengan guard (Kembalikan → HitungDenda hanya bila terlambat).'
  },
  {
    id: 'u27',
    q: 'Aktor pada use case diagram adalah…',
    options: ['Pihak luar yang berinteraksi dengan sistem (bisa orang, sistem lain, atau perangkat)', 'Bagian dalam database', 'Nama kelas', 'Jenis server'],
    answer: 0,
    explain: 'Aktor = entitas luar yang berinteraksi dengan sistem: pengguna (Anggota, Petugas), sistem lain, atau perangkat keras.'
  },
  {
    id: 'u28',
    q: 'Diagram yang memetakan alur kerja/proses dari awal sampai akhir, lengkap dengan keputusan dan paralelisme adalah…',
    options: ['Activity Diagram', 'Sequence Diagram', 'Class Diagram', 'Package Diagram'],
    answer: 0,
    explain: 'Activity Diagram menggambarkan alur/proses bisnis: initial & final node, action, decision (belah ketupat), fork/join (paralel), dan swimlane peran.'
  },
  {
    id: 'u29',
    q: 'Fork dan join pada activity diagram (batang tebal) menunjukkan…',
    options: ['Proses PARALEL — beberapa alur berjalan bersamaan', 'Keputusan', 'Perulangan', 'Akhir proses'],
    answer: 0,
    explain: 'Fork membagi alur menjadi beberapa cabang paralel; join menyatukannya kembali setelah semuanya selesai.'
  },
  {
    id: 'u30',
    q: 'Decision node pada activity diagram (belah ketupat) biasanya diberi label berupa…',
    options: ['Guard, mis. [ya] / [tidak]', 'Nama kelas', 'Nomor urut', 'Jenis database'],
    answer: 0,
    explain: 'Decision node memilih satu cabang berdasarkan guard bersyarat, mis. [tersedia] atau [telat].'
  },
  {
    id: 'u31',
    q: 'State Machine Diagram menggambarkan…',
    options: ['Siklus hidup satu objek: status (state) dan perubahannya', 'Urutan pesan antar objek', 'Struktur kelas', 'Arsitektur jaringan'],
    answer: 0,
    explain: 'State Machine Diagram menampilkan state, transisi (dengan event [guard]/action), initial & final — siklus hidup satu objek (mis. status Buku).'
  },
  {
    id: 'u32',
    q: 'Pada transisi state machine, penulisan "event [guard] / action" berarti…',
    options: ['Transisi terjadi saat event, bila guard terpenuhi, lalu menjalankan action', 'Nama state', 'Tipe data', 'Nama metode saja'],
    answer: 0,
    explain: 'Notasi transisi: event memicu perpindahan, [guard] adalah syarat, / action dijalankan saat transisi (mis. kembali [terlambat] / hitungDenda).'
  },
  {
    id: 'u33',
    q: 'Diagram interaksi yang menampilkan pesan antar objek menurut URUTAN WAKTU adalah…',
    options: ['Sequence Diagram', 'Communications Diagram', 'Component Diagram', 'Profile Diagram'],
    answer: 0,
    explain: 'Sequence Diagram memakai lifeline vertikal (waktu ke bawah) dan pesan horizontal — penekanan pada urutan waktu.'
  },
  {
    id: 'u34',
    q: 'Sequence Diagram dan Communications Diagram…',
    options: ['Menampilkan informasi yang sama, hanya penekanannya berbeda (waktu vs struktur)', 'Sama sekali berbeda isinya', 'Tidak berkaitan', 'Hanya dipakai untuk database'],
    answer: 0,
    explain: 'Keduanya diagram interaksi yang setara: Sequence menonjolkan urutan waktu, Communications menonjolkan struktur hubungan objek dengan pesan bernomor.'
  },
  {
    id: 'u35',
    q: 'Pesan balasan (reply/return) pada sequence diagram digambar dengan…',
    options: ['Garis putus dengan panah terbuka', 'Garis penuh dengan panah penuh', 'Kotak tebal', 'Belah ketupat'],
    answer: 0,
    explain: 'Message sinkron (memanggil) = garis penuh + panah penuh; balasan (reply) = garis putus + panah terbuka (V).'
  },
  {
    id: 'u36',
    q: 'Fragmen [alt] pada sequence diagram berarti…',
    options: ['Pilihan percabangan seperti if/else — jalur alternatif sesuai guard', 'Perulangan', 'Proses paralel', 'Pembuatan objek baru'],
    answer: 0,
    explain: '[alt] = alternatif (if/else) dengan beberapa operand bersyarat; [loop] = perulangan; [opt] = opsional; [par] = paralel.'
  },
  {
    id: 'u37',
    q: 'Pada Communications Diagram, pesan diberi nomor (mis. 1, 1.1, 1.2) untuk menunjukkan…',
    options: ['Urutan dan tingkat (hierarki) pesan', 'Jumlah objek', 'Nama kelas', 'Ukuran data'],
    answer: 0,
    explain: 'Nomor pesan menunjukkan urutan eksekusi dan hubungan induk-anak antar pesan (1 → 1.1, 1.2) di sepanjang garis asosiasi.'
  },
  {
    id: 'u38',
    q: 'Interaction Overview Diagram adalah…',
    options: ['Mirip activity diagram, tetapi node-nya adalah fragmen/skenario interaksi (sequence dsb)', 'Diagram untuk mengukur waktu server', 'Grafik data statistik', 'Diagram class terperinci'],
    answer: 0,
    explain: 'Interaction Overview Diagram memakai gaya activity diagram, tetapi node-nya merujuk skenario interaksi (sequence) — memberi gambaran besar banyak interaksi.'
  },
  {
    id: 'u39',
    q: 'Timing Diagram menampilkan…',
    options: ['Perubahan status objek seiring WAKTU (sumbu waktu) dengan batas durasi', 'Struktur kelas', 'Peta server', 'Relasi paket'],
    answer: 0,
    explain: 'Timing Diagram menampilkan status objek sebagai segmen pada sumbu waktu beserta constraint durasi — berguna untuk sistem real-time/protokol.'
  },
  {
    id: 'u40',
    q: 'Notasi stereotype pada UML ditulis dengan…',
    options: ['«nama» (dengan tanda kutip kembar)', '@nama', '#nama()', '[nama]'],
    answer: 0,
    explain: 'Stereotype ditulis di antara « dan » (guillemets), mis. «device», «include», «class» — memperluas makna sebuah elemen.'
  },
  {
    id: 'u41',
    q: 'Pada class diagram, garis bawah pada nama atribut/metode menunjukkan…',
    options: ['Static (milik kelas, bukan instance)', 'Abstract', 'Private', 'Konstanta'],
    answer: 0,
    explain: 'Garis bawah = static. Huruf miring (italic) = abstract. Tidak ada penanda = biasa (instance).'
  },
  {
    id: 'u42',
    q: 'Multiplicities "1..*" pada ujung relasi berarti…',
    options: ['Satu atau banyak', 'Hanya satu', 'Nol atau satu', 'Nol atau banyak'],
    answer: 0,
    explain: '1..* = satu sampai banyak; 0..1 = nol atau satu; * (atau 0..*) = banyak; 1 = tepat satu.'
  },
  {
    id: 'u43',
    q: 'Diagram yang TIDAK termasuk diagram interaksi dalam UML 2.0 adalah…',
    options: ['Profile Diagram', 'Sequence Diagram', 'Communications Diagram', 'Timing Diagram'],
    answer: 0,
    explain: 'Diagram interaksi: Sequence, Communications, Interaction Overview, dan Timing. Profile adalah diagram struktural.'
  },
  {
    id: 'u44',
    q: 'Dalam studi kasus, kebutuhan "urutan kolaborasi objek saat meminjam buku" paling tepat digambarkan dengan…',
    options: ['Sequence Diagram', 'Package Diagram', 'Profile Diagram', 'Object Diagram saja'],
    answer: 0,
    explain: 'Kolaborasi/urutan pesan antar objek = Sequence Diagram (didukung Communications Diagram bila ingin menonjolkan struktur).'
  },
  {
    id: 'u45',
    q: 'Praktik terbaik menyusun UML adalah…',
    options: ['Satu diagram satu pesan, konsisten, dan dipilih seperlunya sesuai kebutuhan audiens', 'Menggambar semua 14 diagram untuk sistem kecil', 'Membuat detail teknis sebelum kebutuhan jelas', 'Mengabaikan multiplicity'],
    answer: 0,
    explain: 'Best practices: jaga kesederhanaan, konsistensi, ikuti alur analisis→desain, dan pilih diagram seperlunya untuk audiens yang tepat.'
  }
];
