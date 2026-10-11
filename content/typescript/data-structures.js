/* ============================================================
   Pelajaran TypeScript — Bab 6: Struktur Data
   (topik info.md: "struktur data typescript (array, tuple,
    enum, object, dll)", "enum dan tuple")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 17: Array dan Object ---------- */
window.TS_LESSONS.push({
  id: 'array-object-typescript',
  title: 'Array dan Object',
  chapter: 'Struktur Data',
  duration: '12 menit',
  intro: [
    'Dua struktur data paling sering dipakai adalah <b>array</b> (daftar berurutan) dan <b>objek</b> (kumpulan properti).',
    'TypeScript membuat keduanya <b>lebih aman</b>: isi array dan bentuk objek diperiksa sejak dini.'
  ],
  objectives: [
    'Menulis array bertipe dengan dua sintaks',
    'Mendeskripsikan objek dengan tipe inline dan alias',
    'Menggunakan array kosong dengan benar',
    'Memakai method array dengan aman'
  ],
  sections: [
    {
      type: 'example',
      title: 'Array bertipe',
      lang: 'typescript',
      output: false,
      code: `// Dua sintaks yang sama artinya:
let angka: number[] = [1, 2, 3];
let nama: Array<string> = ["Andi", "Budi"];

// Array gabungan
let campuran: (string | number)[] = ["a", 1, "b", 2];

// Membaca dan menambah
console.log(angka[0]);     // 1
angka.push(4);
// angka.push("teks");     // ✗ Error: bukan number

// Array kosong: tipe WAJIB dinyatakan
let daftar: string[] = [];
daftar.push("first");`,
      explain: [
        '<code>number[]</code> dan <code>Array&lt;number&gt;</code> identik; yang pertama lebih umum dipakai.',
        'Array gabungan memakai tanda kurung: <code>(string | number)[]</code>.',
        'Array kosong <code>[]</code> tidak bisa ditebak — beri tipe eksplisit atau TypeScript menganggapnya <code>any[]</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Objek bertipe',
      lang: 'typescript',
      output: false,
      code: `// Inline (langsung di variabel)
const produk: { id: number; nama: string; harga: number } = {
  id: 101,
  nama: "Buku",
  harga: 45000
};

// Lebih rapi: type alias
type Buku = {
  id: number;
  judul: string;
  penulis: string;
  tahun: number;
};

const b1: Buku = {
  id: 1, judul: "Belajar TS", penulis: "Asep", tahun: 2026
};

console.log(b1.judul);        // "Belajar TS"
console.log(produk.nama);     // "Buku"`,
      explain: [
        'Tipe objek boleh ditulis <b>inline</b> atau lewat <b>alias</b> — alias lebih rapi dan dipakai ulang.',
        'Properti yang tidak dideklarasikan akan ditolak: objek <b>tidak boleh</b> punya properti tambahan (excess property check).',
        'Akses properti <b>titik</b> adalah cara standar.'
      ]
    },
    {
      type: 'example',
      title: 'Properti opsional dan readonly',
      lang: 'typescript',
      output: false,
      code: `type Karyawan = {
  id: number;
  nama: string;
  email?: string;        // opsional
  readonly id: number;   // (contoh lain) lihat di bawah
};

type Pegawai = {
  readonly id: number;
  nama: string;
  email?: string;
};

const p: Pegawai = { id: 7, nama: "Rina" };
console.log(p.email);      // undefined (tidak diisi)

// p.id = 8;               // ✗ Error: readonly
// p.nama = "";            // ✓ boleh`,
      explain: [
        '<code>?</code> menandai properti <b>opsional</b> — tipe sebenarnya menjadi <code>string | undefined</code> (dengan <code>strict</code>).',
        '<code>readonly</code> melarang pengubahan setelah objek dibuat.',
        'Membaca properti opsional boleh menghasilkan <code>undefined</code> — karena itu sering dipakai <code>?.</code> dan <code>??</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Method array yang aman',
      lang: 'typescript',
      output: false,
      code: `const skor: number[] = [88, 92, 75, 60];

const tertinggi = Math.max(...skor);   // 92
const rataRata = skor.reduce((j, n) => j + n, 0) / skor.length;

// map/filter menjaga tipe elemen
const naik: number[] = skor.map(n => n + 5);
const lulus: number[] = skor.filter(n => n >= 70);

console.log(rataRata.toFixed(1));
console.log(lulus);   // [88, 92, 75]`,
      explain: [
        '<code>...</code> (spread) menjabarkan array menjadi argumen.',
        '<code>map</code> dan <code>filter</code> mengembalikan array <b>bertipe sama</b> — hasilnya <code>number[]</code>.',
        'TypeScript memeriksa fungsi callback: parameter <code>n</code> otomatis <code>number</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'Excess property check',
      text: 'Objek literal yang dikirim langsung ke variabel bertipe <b>tidak boleh</b> memiliki properti di luar tipe. Kode <code>const p: Pegawai = { id: 1, nama: "X", umur: 30 }</code> menghasilkan error. Aturan ini menangkap salah ketik nama properti — salah satu fitur paling berguna di TypeScript.'
    },
    {
      type: 'vocab',
      items: [
        ['Array<T>', 'Daftar elemen bertipe T.'],
        ['T[]', 'Sintaks ringkas untuk array bertipe T.'],
        ['Excess property', 'Properti di luar tipe yang dideklarasikan.'],
        ['Optional property', 'Properti bertanda ? yang boleh kosong.'],
        ['readonly property', 'Properti yang tidak boleh diubah.'],
        ['Spread (...)', 'Menjabarkan array/objek menjadi elemen.'],
        ['map / filter / reduce', 'Metode array untuk transformasi dan agregasi.']
      ]
    }
  ],
  recap: [
    'Array bertipe: number[] atau Array<number>.',
    'Array gabungan: (string | number)[].',
    'Array kosong perlu tipe eksplisit.',
    'Objek dideskripsikan inline atau dengan type alias.',
    'Excess property check menangkap salah ketik properti.'
  ]
});

/* ---------- Pelajaran 18: Tuple dan Enum ---------- */
window.TS_LESSONS.push({
  id: 'tuple-enum-typescript',
  title: 'Tuple dan Enum',
  chapter: 'Struktur Data',
  duration: '11 menit',
  intro: [
    '<b>Tuple</b> adalah array dengan <b>jumlah dan tipe elemen tetap</b>. <b>Enum</b> adalah daftar <b>konstanta bernama</b>.',
    'Keduanya sering dipakai berpasangan: misalnya, tuple <code>[nama, nilai]</code> dan enum untuk status.'
  ],
  objectives: [
    'Membuat tuple bertipe',
    'Memahami tuple readonly dan destructuring',
    'Membuat enum numerik dan string',
    'Menjelaskan kapan enum sebaiknya tidak dipakai'
  ],
  sections: [
    {
      type: 'example',
      title: 'Tuple dasar',
      lang: 'typescript',
      output: false,
      code: `// Tuple: tipe tiap posisi sudah ditentukan
type Titik = [number, number];
type Respon = [number, string];

const asal: Titik = [0, 0];
const hasil: Respon = [200, "OK"];

// ✗ Error: jumlah dan urutan tipe harus pas
// const salah: Titik = [1, "dua"];
// const kurang: Titik = [1];

console.log(hasil[0]);   // 200
console.log(hasil[1]);   // "OK"`,
      explain: [
        '<code>[number, number]</code> berarti array <b>tepat dua elemen</b>, keduanya number.',
        'Tuple memeriksa <b>jumlah</b> dan <b>urutan</b> elemen.',
        'Cocok untuk pasangan data tetap: koordinat, kode-status + pesan, dan sebagainya.'
      ]
    },
    {
      type: 'example',
      title: 'Tuple: readonly & destructuring',
      lang: 'typescript',
      output: false,
      code: `type Rentang = readonly [number, number];

const r: Rentang = [10, 20];
// r[0] = 5;   // ✗ Error: readonly

// Destructuring: bongkar tuple menjadi variabel
const [awal, akhir] = r;
console.log(awal, akhir);   // 10 20

// Elemen opsional di akhir
type Pasangan = [string, number?];
const p1: Pasangan = ["a"];
const p2: Pasangan = ["b", 2];`,
      explain: [
        '<code>readonly [number, number]</code> melarang pengubahan elemen.',
        '<b>Destructuring</b> membongkar tuple ke variabel sekaligus — urutan menentukan.',
        'Elemen <code>?</code> membuat elemen terakhir opsional, tapi hanya di <b>ujung</b> tuple.'
      ]
    },
    {
      type: 'example',
      title: 'Enum numerik',
      lang: 'typescript',
      output: false,
      code: `enum Arah {
  Utara,    // 0
  Selatan,  // 1
  Timur,    // 2
  Barat     // 3
}

function lalui(d: Arah): string {
  return "Menuju arah #" + d;
}

console.log(lalui(Arah.Utara));   // "Menuju arah #0"
console.log(Arah.Timur);            // 2`,
      explain: [
        '<code>enum</code> membuat daftar konstanta; nilai otomatis dimulai dari <b>0</b> dan naik satu per satu.',
        'Anggota diakses dengan <code>Arah.Utara</code>.',
        'Nilai bisa ditentukan sendiri: <code>enum Arah { Utara = 1, ... }</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Enum string & const enum',
      lang: 'typescript',
      output: false,
      code: `enum StatusPesanan {
  Pending = "PENDING",
  Dikirim = "DIKIRIM",
  Selesai = "SELESAI"
}

const pesanan: StatusPesanan = StatusPesanan.Dikirim;
console.log(pesanan);   // "DIKIRIM"

// const enum: dihapus saat kompilasi (lebih hemat)
const enum Warna { Merah, Hijau, Biru }
console.log(Warna.Biru);   // 2`,
      explain: [
        'Enum string memakai <b>teks eksplisit</b> — lebih jelas saat dibaca di konsol atau disimpan ke database.',
        '<code>const enum</code> "dihapus" saat kompilasi: tidak ada objek runtime, kode lebih ringkas.',
        'Catatan: <code>const enum</code> punya batasan bila dipakai lintas paket; hati-hati di proyek besar.'
      ]
    },
    {
      type: 'warn',
      title: 'Enum kontroversial — alternatifnya',
      text: 'Banyak pengembang TypeScript kini lebih suka <b>union literal</b> daripada enum:<br><code>type Status = "PENDING" | "DIKIRIM" | "SELESAI";</code><br>Union literal menghasilkan kode lebih kecil, lebih mudah diserialisasi, dan tidak punya keanehan enum (misal <code>enum</code> bisa diindeks angka). Enum masih berguna saat butuh <b>nilai numerik otomatis</b> atau migrasi dari kode lama.'
    },
    {
      type: 'vocab',
      items: [
        ['Tuple', 'Array dengan jumlah dan tipe elemen tetap.'],
        ['readonly tuple', 'Tuple yang elemen-elemennya tidak boleh diubah.'],
        ['Destructuring', 'Membongkar array/objek menjadi variabel.'],
        ['enum', 'Daftar konstanta bernama.'],
        ['const enum', 'Enum yang dihilangkan saat kompilasi.'],
        ['Union literal', 'Alternatif enum: gabungan nilai tetap.'],
        ['Excess property check', 'Larangan properti tak dideklarasikan.']
      ]
    }
  ],
  recap: [
    'Tuple: array dengan jumlah dan tipe elemen tetap.',
    'Tuple bisa readonly dan mendukung destructuring.',
    'Enum membuat konstanta bernama; numerik atau string.',
    'const enum menghilang saat kompilasi.',
    'Untuk kode baru, union literal sering lebih disukai daripada enum.'
  ]
});
