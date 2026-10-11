/* ============================================================
   Kumpulan soal kuis JavaScript — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.JS_QUIZ_POOL = [
  {
    id: 'q01',
    q: 'Apa itu JavaScript?',
    options: ['Bahasa pemrograman yang membuat halaman web interaktif', 'Bahasa markah untuk struktur halaman', 'Bahasa untuk mengatur tampilan halaman', 'Program untuk membuat website tanpa kode'],
    answer: 0,
    explain: 'JavaScript adalah bahasa pemrograman yang berjalan di browser dan memberi perilaku/interaksi pada halaman web.'
  },
  {
    id: 'q02',
    q: 'JavaScript pertama kali dibuat oleh…',
    options: ['Brendan Eich pada tahun 1995', 'Tim Berners-Lee pada tahun 1991', 'Microsoft pada tahun 2000', 'Sun Microsystems pada tahun 1996'],
    answer: 0,
    explain: 'JavaScript dibuat oleh Brendan Eich di Netscape pada 1995, awalnya bernama Mocha lalu LiveScript.'
  },
  {
    id: 'q03',
    q: 'Hubungan JavaScript dan Java adalah…',
    options: ['Dua bahasa yang berbeda dan hampir tidak ada hubungannya', 'JavaScript adalah versi ringkas dari Java', 'JavaScript adalah bagian dari Java', 'Java dibuat dari JavaScript'],
    answer: 0,
    explain: 'Nama mirip karena alasan pemasaran tahun 1990-an, tetapi keduanya bahasa yang sangat berbeda.'
  },
  {
    id: 'q04',
    q: 'Tag yang dipakai untuk menyisipkan JavaScript ke halaman HTML adalah…',
    options: ['<script>', '<javascript>', '<js>', '<code>'],
    answer: 0,
    explain: 'Kode JavaScript ditulis di dalam tag &lt;script&gt;, baik di &lt;head&gt; maupun &lt;body&gt;.'
  },
  {
    id: 'q05',
    q: 'Cara paling direkomendasikan untuk proyek sungguhan adalah…',
    options: ['Berkas .js terpisah yang dipanggil dengan <script src="...">', 'Menulis semua kode di atribut onclick', 'Menyalin kode ke tiap halaman tanpa berkas', 'Menaruh kode di atribut href'],
    answer: 0,
    explain: 'Berkas JS terpisah menjaga HTML tetap rapi dan kode bisa dipakai ulang oleh banyak halaman.'
  },
  {
    id: 'q06',
    q: 'Fungsi console.log() adalah…',
    options: ['Menulis pesan ke konsol developer tools', 'Menampilkan popup di layar', 'Menulis teks ke halaman web', 'Menyimpan data ke database'],
    answer: 0,
    explain: 'console.log() menulis ke konsol (buka dengan F12, tab Console) — alat utama untuk memeriksa kode.'
  },
  {
    id: 'q07',
    q: 'Pintasan keyboard untuk membuka developer tools di kebanyakan browser adalah…',
    options: ['F12', 'Ctrl+S', 'Alt+F4', 'F5'],
    answer: 0,
    explain: 'F12 (atau Ctrl+Shift+I) membuka developer tools tempat konsol JavaScript berada.'
  },
  {
    id: 'q08',
    q: 'Kata kunci untuk membuat variabel yang nilainya tidak boleh diubah adalah…',
    options: ['const', 'var', 'let', 'static'],
    answer: 0,
    explain: 'const membuat konstanta: sekali diberi nilai, tidak bisa diisi ulang. let untuk variabel yang bisa berubah.'
  },
  {
    id: 'q09',
    q: 'Tipe data dari nilai "42" (dengan tanda kutip) adalah…',
    options: ['String', 'Number', 'Boolean', 'Integer'],
    answer: 0,
    explain: 'Nilai bertanda kutip adalah string. Tanpa kutip, 42 adalah number.'
  },
  {
    id: 'q10',
    q: 'Hasil dari typeof "halo" adalah…',
    options: ['"string"', '"text"', '"char"', '"word"'],
    answer: 0,
    explain: 'Operator typeof mengembalikan nama tipe data: "string", "number", "boolean", "object", dan sebagainya.'
  },
  {
    id: 'q11',
    q: 'Fungsi prompt() mengembalikan…',
    options: ['Teks yang diketik pengunjung, atau null jika dibatalkan', 'Selalu string kosong', 'Angka yang diketik pengunjung', 'true atau false'],
    answer: 0,
    explain: 'prompt() membuka dialog input dan mengembalikan teks (string) atau null saat tombol batal ditekan.'
  },
  {
    id: 'q12',
    q: 'Fungsi confirm() mengembalikan…',
    options: ['true jika OK ditekan, false jika Batal', 'Teks yang diketik pengunjung', 'Selalu true', 'Angka 1 atau 0 saja'],
    answer: 0,
    explain: 'confirm() menampilkan dialog dengan tombol OK dan Batal, lalu mengembalikan nilai boolean.'
  },
  {
    id: 'q13',
    q: 'Operator % (modulus) menghasilkan…',
    options: ['Sisa hasil bagi', 'Persen dari dua angka', 'Hasil kali dua angka', 'Pembulatan angka'],
    answer: 0,
    explain: '7 % 3 hasilnya 1 karena 7 dibagi 3 menyisakan 1. Sering dipakai untuk cek bilangan genap/ganjil.'
  },
  {
    id: 'q14',
    q: 'Hasil dari "2" + 2 adalah…',
    options: ['"22" (string)', '4', 'NaN', 'Error'],
    answer: 0,
    explain: 'Tanda + dengan salah satu operand string akan menggabungkan: "2" + 2 menjadi "22".'
  },
  {
    id: 'q15',
    q: 'Perbedaan == dan === adalah…',
    options: ['=== juga membandingkan tipe data, == hanya nilainya saja', '== lebih cepat dari ===', '=== hanya untuk angka', 'Keduanya persis sama'],
    answer: 0,
    explain: '"5" == 5 bernilai true (konversi dulu), tetapi "5" === 5 bernilai false karena tipenya beda.'
  },
  {
    id: 'q16',
    q: 'Hasil dari !true adalah…',
    options: ['false', 'true', 'undefined', 'NaN'],
    answer: 0,
    explain: 'Operator ! membalik nilai boolean: !true → false dan !false → true.'
  },
  {
    id: 'q17',
    q: 'Bentuk singkat dari if (x > 5) { a = 1 } else { a = 0 } adalah…',
    options: ['a = x > 5 ? 1 : 0', 'a = x > 5 : 1 ? 0', 'a ? x > 5 = 1 : 0', 'if x > 5 then a = 1'],
    answer: 0,
    explain: 'Operator ternary: kondisi ? nilaiJikaBenar : nilaiJikaSalah.'
  },
  {
    id: 'q18',
    q: 'Perulangan yang paling pas bila jumlah iterasi sudah diketahui adalah…',
    options: ['for', 'while', 'do...while', 'if'],
    answer: 0,
    explain: 'for dirancang untuk pengulangan dengan hitungan jelas: for (let i = 0; i < 10; i++).'
  },
  {
    id: 'q19',
    q: 'Perbedaan while dan do...while adalah…',
    options: ['do...while menjalankan badan minimal sekali sebelum mengecek kondisi', 'while menjalankan badan minimal sekali', 'Keduanya tidak ada perbedaan', 'do...while tidak bisa berhenti'],
    answer: 0,
    explain: 'while mengecek kondisi dulu; do...while menjalankan badan dulu, baru mengecek kondisi.'
  },
  {
    id: 'q20',
    q: 'Fungsi break di dalam perulangan adalah…',
    options: ['Menghentikan perulangan seketika', 'Melewati satu iterasi dan lanjut', 'Menunda perulangan 1 detik', 'Memulai perulangan dari awal'],
    answer: 0,
    explain: 'break keluar dari perulangan; continue hanya melewati sisa iterasi berjalan.'
  },
  {
    id: 'q21',
    q: 'Elemen pertama dalam array diakses dengan indeks…',
    options: ['0', '1', '-1', 'A'],
    answer: 0,
    explain: 'Indeks array dimulai dari 0: buah[0] adalah elemen pertama.'
  },
  {
    id: 'q22',
    q: 'Metode untuk menambah elemen di akhir array adalah…',
    options: ['push()', 'pop()', 'shift()', 'join()'],
    answer: 0,
    explain: 'push() menambah di akhir; pop() mengambil dari akhir; shift() mengambil dari awal.'
  },
  {
    id: 'q23',
    q: 'Metode array yang mengubah setiap elemen menjadi array baru adalah…',
    options: ['map()', 'push()', 'indexOf()', 'sort()'],
    answer: 0,
    explain: 'map() memanggil fungsi untuk tiap elemen dan mengembalikan array baru berisi hasilnya.'
  },
  {
    id: 'q24',
    q: 'Cara mengakses properti "nama" dari objek user adalah…',
    options: ['user.nama atau user["nama"]', 'user->nama', 'nama.user', 'user(nama)'],
    answer: 0,
    explain: 'Ada dua cara: notasi titik (user.nama) dan notasi kurung siku (user["nama"]).'
  },
  {
    id: 'q25',
    q: 'Kata kunci untuk mengembalikan nilai dari fungsi adalah…',
    options: ['return', 'output', 'send', 'yield'],
    answer: 0,
    explain: 'return mengirim nilai keluar dari fungsi dan mengakhiri eksekusinya.'
  },
  {
    id: 'q26',
    q: 'Bentuk arrow function yang benar adalah…',
    options: ['(x) => x * 2', 'x -> x * 2', 'def(x) { x * 2 }', 'function(x) => x * 2'],
    answer: 0,
    explain: 'Arrow function: (parameter) => ekspresi. Sintaks ringkas yang populer sejak ES6.'
  },
  {
    id: 'q27',
    q: 'DOM adalah kependekan dari…',
    options: ['Document Object Model', 'Data Object Management', 'Display Object Method', 'Document Orientation Mode'],
    answer: 0,
    explain: 'DOM adalah representasi pohon dari halaman yang bisa diakses dan diubah lewat JavaScript.'
  },
  {
    id: 'q28',
    q: 'Cara memilih elemen dengan id "judul" adalah…',
    options: ['document.getElementById("judul")', 'document.select("judul")', 'findElement("#judul")', 'document.get("#judul")'],
    answer: 0,
    explain: 'getElementById mengambil satu elemen berdasarkan id. querySelector("#judul") juga bisa.'
  },
  {
    id: 'q29',
    q: 'Cara menambahkan penangan klik pada tombol adalah…',
    options: ['btn.addEventListener("click", fungsi)', 'btn.onClick(fungsi)', 'btn.click(fungsi)', 'listen(btn, "klik")'],
    answer: 0,
    explain: 'addEventListener("click", ...) adalah cara modern: boleh beberapa penangan untuk satu elemen.'
  },
  {
    id: 'q30',
    q: 'Fungsi event.preventDefault() adalah…',
    options: ['Mencegah aksi bawaan browser (mis. submit memuat ulang halaman)', 'Menghentikan semua event di halaman', 'Menghapus elemen dari DOM', 'Menonaktifkan tombol selamanya'],
    answer: 0,
    explain: 'preventDefault() membatalkan perilaku standar event, misalnya agar form tidak memuat ulang halaman.'
  },
  {
    id: 'q31',
    q: 'Cara mengakses elemen induk dari suatu elemen adalah…',
    options: ['parentNode atau parentElement', 'childNode', 'nextSibling', 'upElement()'],
    answer: 0,
    explain: 'parentNode dan parentElement mengembalikan elemen induk; children dan nextSibling justru ke bawah dan ke samping.'
  },
  {
    id: 'q32',
    q: 'Metode untuk menambah node sebagai anak terakhir adalah…',
    options: ['append() atau appendChild()', 'insertBefore()', 'prepend()', 'replaceWith()'],
    answer: 0,
    explain: 'append/appendChild menambah di akhir; prepend di awal; insertBefore sebelum elemen acuan.'
  },
  {
    id: 'q33',
    q: 'Fungsi cloneNode(true) menggandakan…',
    options: ['Elemen beserta seluruh isinya secara rekursif', 'Hanya elemen kosong tanpa isi', 'Hanya teks di dalam elemen', 'Salinan dokumen seluruh halaman'],
    answer: 0,
    explain: 'Parameter true membuat penggandaan rekursif — semua anak dan teks ikut digandakan.'
  },
  {
    id: 'q34',
    q: 'Atribut data-id="42" dibaca di JavaScript lewat…',
    options: ['element.dataset.id', 'element.data.id', 'element.attr("data-id")', 'element.data-id'],
    answer: 0,
    explain: 'Properti dataset memetakan atribut data-* ke nama camelCase: data-id menjadi dataset.id.'
  },
  {
    id: 'q35',
    q: 'BOM adalah kependekan dari…',
    options: ['Browser Object Model', 'Basic Object Method', 'Browser Operation Mode', 'Back End Object Model'],
    answer: 0,
    explain: 'BOM = Browser Object Model, kumpulan objek untuk berinteraksi dengan browser (window, location, history, dsb).'
  },
  {
    id: 'q36',
    q: 'Perbedaan localStorage dan sessionStorage adalah…',
    options: ['localStorage bertahan setelah browser ditutup, sessionStorage hilang saat tab ditutup', 'Keduanya sama saja', 'sessionStorage lebih besar kapasitasnya', 'localStorage hanya untuk angka'],
    answer: 0,
    explain: 'localStorage bersifat persisten; sessionStorage terbatas pada sesi tab dan hilang saat tab ditutup.'
  },
  {
    id: 'q37',
    q: 'Fungsi setTimeout(fungsi, 1000) akan…',
    options: ['Menjalankan fungsi sekali setelah 1 detik', 'Menjalankan fungsi tiap 1 detik', 'Menghentikan fungsi setelah 1 detik', 'Menunda seluruh halaman selama 1 detik'],
    answer: 0,
    explain: 'setTimeout menjalankan fungsi satu kali setelah jeda (dalam milidetik). Yang berulang adalah setInterval.'
  },
  {
    id: 'q38',
    q: 'Bagian path dari URL saat ini diakses lewat…',
    options: ['location.pathname', 'location.hostname', 'window.path', 'navigator.url'],
    answer: 0,
    explain: 'location.pathname berisi path URL (mis. /belajar/modul); hostname berisi nama domain.'
  },
  {
    id: 'q39',
    q: 'Empat pilar OOP adalah…',
    options: ['Enkapsulasi, abstraksi, pewarisan, polimorfisme', 'Kelas, objek, metode, properti', 'Warisan, bentuk, data, perilaku', 'Public, private, protected, static'],
    answer: 0,
    explain: 'Empat pilar OOP: enkapsulasi, abstraksi, pewarisan, dan polimorfisme.'
  },
  {
    id: 'q40',
    q: 'Enkapsulasi berarti…',
    options: ['Menggabungkan data dan perilaku serta melindungi data dari akses luar', 'Menyembunyikan nama variabel', 'Membuat banyak kelas sekaligus', 'Mewarisi metode dari kelas lain'],
    answer: 0,
    explain: 'Enkapsulasi menggabungkan properti dan metode dalam kelas, serta membatasi akses langsung ke data.'
  },
  {
    id: 'q41',
    q: 'Field privat sejati di JavaScript ditulis dengan awalan…',
    options: ['# (contoh: #saldo)', '_ (contoh: _saldo)', '@ (contoh: @saldo)', 'private (contoh: private saldo)'],
    answer: 0,
    explain: 'Tanda # membuat field privat sejati. Garis bawah (_) hanya konvensi, bukan privasi.'
  },
  {
    id: 'q42',
    q: 'Abstraksi dalam OOP adalah…',
    options: ['Menyembunyikan detail rumit dan menampilkan antarmuka sederhana', 'Membuat kelas tanpa metode', 'Mengubah semua metode menjadi privat', 'Memanggil metode induk'],
    answer: 0,
    explain: 'Abstraksi menyembunyikan bagaimana cara kerja, pengguna hanya perlu tahu apa yang bisa dipakai.'
  },
  {
    id: 'q43',
    q: 'Keyword untuk membuat kelas anak dari kelas induk adalah…',
    options: ['extends', 'inherits', 'super', 'parent'],
    answer: 0,
    explain: 'class Kucing extends Hewan membuat Kucing mewarisi Hewan.'
  },
  {
    id: 'q44',
    q: 'Fungsi super() di constructor kelas anak adalah…',
    options: ['Memanggil constructor kelas induk', 'Membuat objek baru', 'Menimpa metode induk', 'Mengakhiri kelas'],
    answer: 0,
    explain: 'super(...argumen) wajib dipanggil sebelum memakai this di constructor kelas anak.'
  },
  {
    id: 'q45',
    q: 'Polimorfisme berarti…',
    options: ['Satu antarmuka dengan banyak bentuk perilaku', 'Satu kelas dengan banyak constructor', 'Banyak kelas dengan nama sama', 'Metode yang tidak bisa ditimpa'],
    answer: 0,
    explain: 'Polimorfisme: pemanggilan metode yang sama menghasilkan perilaku berbeda sesuai tipe objeknya.'
  },
  {
    id: 'q46',
    q: 'Operator untuk memeriksa apakah objek berasal dari kelas tertentu adalah…',
    options: ['instanceof', 'typeof', 'isclass', 'extends'],
    answer: 0,
    explain: 'obj instanceof Kelas mengembalikan true bila obj dibuat dari Kelas atau kelas turunannya.'
  }
];
