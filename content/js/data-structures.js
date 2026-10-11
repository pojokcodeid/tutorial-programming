/* ============================================================
   Pelajaran JavaScript — Bab 5: Struktur Data
   (topik info.md: "struktur data array" dan
    "objek di javascript")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran 9: Struktur Data Array ---------- */
window.JS_LESSONS.push({
  id: 'struktur-data-array',
  title: 'Struktur Data Array',
  chapter: 'Struktur Data',
  duration: '12 menit',
  intro: [
    '<b>Array</b> adalah <b>daftar terurut</b>: satu variabel yang menampung banyak nilai sekaligus, masing-masing bisa diakses lewat <b>indeks</b>.',
    'Hampir semua data di web adalah daftar — daftar berita, keranjang belanja, daftar pengguna. Array adalah cara JS menampungnya.'
  ],
  objectives: [
    'Membuat array dan mengakses elemennya',
    'Menambah dan menghapus elemen',
    'Menelusuri array dengan for...of',
    'Memakai map dan filter'
  ],
  sections: [
    {
      type: 'example',
      title: 'Membuat & mengakses array',
      lang: 'javascript',
      output: false,
      code: `const buah = ["mangga", "jeruk", "apel"];

buah[0];      // "mangga"   ← indeks dimulai dari 0!
buah[2];      // "apel"
buah.length;  // 3           ← jumlah elemen

// mengubah elemen
buah[1] = "semangka";
// buah = ["mangga", "semangka", "apel"]`,
      explain: [
        'Elemen diapit <code>[ ]</code> dan dipisah <b>koma</b>.',
        'Indeks dimulai dari <b>0</b>: elemen pertama adalah <code>buah[0]</code>.',
        '<code>length</code> memberi jumlah elemen — indeks terakhir = <code>length - 1</code>.',
        'Elemen boleh diubah (walau dideklarasikan <code>const</code>) — yang tidak bisa diganti adalah <b>variabelnya</b>.'
      ]
    },
    {
      type: 'example',
      title: 'Menambah & menghapus elemen',
      lang: 'javascript',
      output: false,
      code: `const angka = [1, 2];

angka.push(3);      // [1, 2, 3]   ← tambah di AKHIR
angka.unshift(0);   // [0, 1, 2, 3] ← tambah di AWAL

angka.pop();        // [0, 1, 2]    ← ambil dari AKHIR
angka.shift();      // [1, 2]       ← ambil dari AWAL

angka.indexOf(2);   // 0            ← posisi elemen
angka.includes(5);  // false        ← ada atau tidak?
[1, 2].concat([3]); // [1, 2, 3]    ← gabung dua array`,
      explain: [
        '<b>push/pop</b> bekerja di ujung belakang; <b>unshift/shift</b> di ujung depan.',
        '<code>pop()</code> dan <code>shift()</code> <b>mengembalikan</b> elemen yang diambil.',
        '<code>indexOf</code> mengembalikan <code>-1</code> bila tidak ditemukan.',
        'Array boleh berisi <b>tipe campuran</b>: <code>[1, "dua", true]</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Menelusuri & mentransformasi',
      lang: 'javascript',
      output: false,
      code: `const harga = [10000, 25000, 7500];

// cara klasik
for (const h of harga) {
  console.log("Rp " + h);
}

// map: ubah tiap elemen → array baru
const plusPpn = harga.map(h => h * 1.11);

// filter: ambil yang memenuhi syarat
const mahal = harga.filter(h => h > 9000);

// find: cari elemen pertama yang cocok
const ketemu = harga.find(h => h === 25000);

// join: jadikan string
harga.join(" - ");  // "10000 - 25000 - 7500"`,
      explain: [
        '<code>map()</code> mengembalikan <b>array baru</b> hasil perubahan tiap elemen — array asli tidak berubah.',
        '<code>filter()</code> mengembalikan elemen yang <b>lolos uji</b>.',
        '<code>find()</code> mengembalikan elemen <b>pertama</b> yang cocok (atau <code>undefined</code>).',
        'Metode ini memakai <b>arrow function</b> — dibahas di pelajaran Function.'
      ]
    },
    {
      type: 'example',
      title: 'Array dalam praktik',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Daftar Belanja</title>
</head>
<body>
  <h2>Daftar Belanja</h2>
  <ul id="daftar"></ul>
  <p id="total"></p>

  <script>
    const belanja = [
      { nama: "Nasi", harga: 12000 },
      { nama: "Telur", harga: 24000 },
      { nama: "Air", harga: 6000 }
    ];

    const baris = belanja.map(item =>
      "<li>" + item.nama + " — Rp " + item.harga + "</li>"
    );
    document.getElementById("daftar").innerHTML = baris.join("");

    const total = belanja.reduce(
      (jumlah, item) => jumlah + item.harga, 0
    );
    document.getElementById("total").textContent =
      "Total: Rp " + total;
  <\/script>
</body>
</html>`,
      explain: [
        'Array boleh berisi <b>objek</b> — cara umum merepresentasikan data.',
        '<code>map()</code> menyusun baris &lt;li&gt; dari tiap item.',
        '<code>reduce()</code> menggabungkan semua elemen jadi <b>satu nilai</b> (di sini total harga), dimulai dari <code>0</code>.',
        'Perhatikan bagaimana HTML terbentuk tanpa menulis satu per satu.'
      ]
    },
    {
      type: 'tip',
      title: 'Memecah array (destructuring)',
      text: 'Ambil beberapa elemen sekaligus: <code>const [pertama, kedua] = [1, 2, 3];</code> — <code>pertama</code> bernilai 1 dan <code>kedua</code> bernilai 2. Bisa juga melewatkan: <code>const [, kedua] = [1, 2];</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Array', 'Daftar terurut dari nilai-nilai, diapit tanda [ ].'],
        ['Indeks', 'Posisi elemen dalam array — dimulai dari 0.'],
        ['length', 'Jumlah elemen dalam array.'],
        ['push/pop', 'Menambah/mengambil elemen di ujung belakang.'],
        ['unshift/shift', 'Menambah/mengambil elemen di ujung depan.'],
        ['map()', 'Mengubah tiap elemen menjadi array baru.'],
        ['filter()', 'Mengambil elemen yang lolos uji.'],
        ['reduce()', 'Menggabungkan elemen menjadi satu nilai.'],
        ['Destructuring', 'Memecah array/objek ke variabel sekaligus.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: keranjang belanja',
      lang: 'html',
      hint: 'Tambahkan satu item ke array dengan push, lalu jalankan lagi. Coba filter hanya barang di atas Rp 10.000.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Keranjang</title>
</head>
<body>
  <h2>Keranjang Belanja</h2>
  <ul id="list"></ul>

  <script>
    const keranjang = ["Pensil", "Buku", "Penghapus"];

    // tambahkan item baru di sini:
    keranjang.push("Rautan");

    const baris = keranjang.map((item, i) =>
      "<li>" + (i + 1) + ". " + item + "</li>"
    );
    document.getElementById("list").innerHTML = baris.join("");
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Array menampung daftar terurut; indeks dimulai dari 0.',
    'push/pop untuk ujung belakang, unshift/shift untuk ujung depan.',
    'map mengubah, filter menyaring, find mencari, reduce menggabungkan.',
    'Array bisa berisi objek — pola umum data web.',
    'length memberi jumlah elemen; indeks terakhir = length - 1.',
  ]
});

/* ---------- Pelajaran 10: Objek di JavaScript ---------- */
window.JS_LESSONS.push({
  id: 'objek-di-javascript',
  title: 'Objek di JavaScript',
  chapter: 'Struktur Data',
  duration: '12 menit',
  intro: [
    'Kalau array adalah <b>daftar bernomor</b>, <b>objek</b> adalah <b>daftar bernama</b>: setiap nilai punya <b>kunci</b> (nama properti). Data pengguna, produk, pengaturan — semuanya cocok jadi objek.',
    'Pelajaran ini membahas objek literal, properti, metode, dan JSON.'
  ],
  objectives: [
    'Membuat objek dengan literal { }',
    'Mengakses properti dengan titik dan kurung siku',
    'Menambahkan metode (fungsi) ke objek',
    'Mengubah objek ke JSON dan sebaliknya'
  ],
  sections: [
    {
      type: 'example',
      title: 'Objek literal',
      lang: 'javascript',
      output: false,
      code: `const user = {
  nama: "Andi",
  umur: 25,
  aktif: true,
  alamat: {                       // objek bersarang
    kota: "Bandung",
    kodePos: "40111"
  }
};

user.nama;            // "Andi"
user["umur"];          // 25
user.alamat.kota;      // "Bandung"
user.telepon = "0812"; // tambah properti baru`,
      explain: [
        'Properti ditulis <code>nama: nilai</code>, dipisah <b>koma</b>.',
        'Akses dengan <b>titik</b> (<code>user.nama</code>) atau <b>kurung siku</b> (<code>user["umur"]</code>).',
        'Kurung siku wajib bila nama properti mengandung spasi atau berupa variabel.',
        'Properti bisa ditambah kapan saja; objek bersarang diakses berlapis.'
      ]
    },
    {
      type: 'example',
      title: 'Metode dan this',
      lang: 'javascript',
      output: false,
      code: `const kalkulator = {
  angka: 10,
  tambah: function(x) {
    this.angka = this.angka + x;  // this = objek ini
    return this.angka;
  }
};

kalkulator.tambah(5);  // 15
kalkulator.tambah(5);  // 20`,
      explain: [
        '<b>Metode</b> adalah properti yang berisi fungsi.',
        '<code>this</code> merujuk ke <b>objek yang memanggil</b> metode tersebut.',
        'Metode bisa membaca dan mengubah properti objeknya sendiri.',
        'Sintaks ringkas modern: <code>tambah(x) { ... }</code> tanpa kata <code>function</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Objek & JSON',
      lang: 'javascript',
      output: false,
      code: `const user = { nama: "Andi", umur: 25 };

// objek → string JSON
const json = JSON.stringify(user);
// '{"nama":"Andi","umur":25}'

// string JSON → objek
const kembali = JSON.parse(json);
kembali.nama;   // "Andi"

// mengambil semua kunci / nilai
Object.keys(user);    // ["nama", "umur"]
Object.values(user);  // ["Andi", 25]`,
      explain: [
        '<b>JSON</b> (JavaScript Object Notation) adalah format teks untuk bertukar data — kuncinya <b>harus</b> memakai tanda kutip ganda.',
        '<code>JSON.stringify()</code> mengubah objek jadi string; <code>JSON.parse()</code> sebaliknya.',
        '<code>Object.keys()</code> dan <code>Object.values()</code> mendaftar kunci dan nilai.',
        'JSON-lah yang diterima server web — hampir semua API memakainya.'
      ]
    },
    {
      type: 'example',
      title: 'Objek dalam praktik',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Profil</title>
</head>
<body>
  <div id="kartu"></div>

  <script>
    const profil = {
      nama: "Sari",
      peran: "Desainer",
      kota: "Yogyakarta"
    };

    document.getElementById("kartu").innerHTML =
      "<h2>" + profil.nama + "</h2>" +
      "<p>" + profil.peran + " · " + profil.kota + "</p>";
  <\/script>
</body>
</html>`,
      explain: [
        'Data dalam objek dipisah dari cara menampilkannya — kode jadi lebih rapi.',
        'Properti objek disambung ke string HTML seperti biasa.',
        'Pola ini (data objek + render ke HTML) adalah inti dari hampir semua aplikasi web modern.'
      ]
    },
    {
      type: 'tip',
      title: 'Destructuring objek',
      text: 'Ambil properti ke variabel sekaligus: <code>const { nama, umur } = user;</code> — langsung ada variabel <code>nama</code> dan <code>umur</code>. Bisa juga ganti nama: <code>const { nama: namaLengkap } = user;</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Objek', 'Kumpulan pasangan kunci-nilai, ditulis dengan { }.'],
        ['Properti', 'Pasangan nama dan nilai dalam objek.'],
        ['Metode', 'Properti yang nilainya fungsi.'],
        ['this', 'Merujuk ke objek yang sedang menjalankan metode.'],
        ['JSON', 'Format teks standar untuk bertukar data (kunci wajib berkutip).'],
        ['Object.keys()', 'Mengembalikan daftar nama properti.'],
        ['Destructuring', 'Memecah objek ke variabel terpisah sekaligus.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: katalog produk',
      lang: 'html',
      hint: 'Ubah properti objek, tambah properti baru (mis. stok), dan tampilkan juga di HTML.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Produk</title>
</head>
<body>
  <div id="produk"></div>

  <script>
    const produk = {
      nama: "Headphone",
      harga: 250000,
      stok: 12
    };

    // tambahkan satu properti lagi di atas,
    // lalu tampilkan di sini:
    document.getElementById("produk").innerHTML =
      "<h2>" + produk.nama + "</h2>" +
      "<p>Rp " + produk.harga + " · stok " + produk.stok + "</p>";
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Objek menyimpan data bernama: nama properti dan nilainya.',
    'Akses properti dengan titik atau kurung siku.',
    'Metode adalah fungsi di dalam objek; this merujuk ke objek itu.',
    'JSON.stringify/JSON.parse mengubah objek ↔ string.',
    'Object.keys dan Object.values mendaftar isi objek.',
    'Destructuring memecah objek ke variabel sekaligus.',
  ]
});
