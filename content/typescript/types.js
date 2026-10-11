/* ============================================================
   Pelajaran TypeScript — Bab 2: Tipe Data
   (topik info.md: "type data dan variable",
    "type assertions", "type aliases", "literal type")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 5: Tipe Data dan Variabel ---------- */
window.TS_LESSONS.push({
  id: 'tipe-data-variabel',
  title: 'Tipe Data dan Variabel',
  chapter: 'Tipe Data',
  duration: '12 menit',
  intro: [
    'Inti TypeScript adalah <b>tipe data</b>: setiap nilai punya jenis, dan TypeScript memastikan nilai dipakai sesuai jenisnya.',
    'Pelajaran ini membahas tipe dasar, cara menulis tipe di variabel, dan bahaya <code>any</code>.'
  ],
  objectives: [
    'Menyebutkan tipe data dasar TypeScript',
    'Menulis deklarasi variabel bertipe dengan let dan const',
    'Memahami inferensi tipe',
    'Menjelaskan mengapa any sebaiknya dihindari'
  ],
  sections: [
    {
      type: 'example',
      title: 'Tipe data dasar',
      lang: 'typescript',
      output: false,
      code: `let nama: string = "Andi";      // teks
let usia: number = 21;          // angka (bulat & desimal sama)
let tinggi: number = 1.75;      // number, bukan tipe desimal terpisah
let aktif: boolean = true;      // benar / salah

let apel: bigint = 10n;         // bilangan bulat sangat besar
let id: symbol = Symbol("id");  // nilai unik

let kosong: null = null;
let belum: undefined = undefined;`,
      explain: [
        "<code>string</code> memakai tanda kutip <code>\"...\"</code>, <code>'...'</code>, atau <code>`...`</code>.",
        '<code>number</code> mencakup <b>semua angka</b> — bulat, desimal, positif, negatif. Tidak ada <code>int</code> atau <code>float</code> terpisah seperti bahasa lain.',
        '<code>boolean</code> hanya punya dua nilai: <code>true</code> dan <code>false</code>.'
      ]
    },
    {
      type: 'example',
      title: 'let vs const',
      lang: 'typescript',
      output: false,
      code: `let skor: number = 0;   // bisa diubah
skor = 10;                // ✓ diperbolehkan

const pi: number = 3.14;  // tetap, tidak boleh diisi ulang
// pi = 3.15;             // ✗ Error: cannot assign to 'pi'`,
      explain: [
        '<code>let</code> untuk variabel yang isinya bisa berubah; <code>const</code> untuk konstanta.',
        'Aturannya sama persis dengan JavaScript — TypeScript hanya menambahkan tanda tipe.',
        'Dengan <code>const</code>, TypeScript biasanya bisa menebak tipe sendiri: <code>const pi = 3.14</code> otomatis bertipe <code>number</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Inferensi tipe — seringkali cukup',
      text: 'TypeScript <b>menebak tipe otomatis</b> dari nilai awal: <code>let kota = "Bandung"</code> sudah bertipe <code>string</code>. Jadi tulis tipe eksplisit hanya saat diperlukan: variabel tanpa nilai awal, parameter fungsi, atau agar maksud lebih jelas.'
    },
    {
      type: 'example',
      title: 'any dan unknown',
      lang: 'typescript',
      output: false,
      code: `// any: mematikan pemeriksaan — hindari!
let apaSaja: any = 5;
apaSaja = "teks";       // ✓ lolos
apaSaja();              // ✗ baru error saat runtime

// unknown: aman — harus diperiksa dulu
let misterius: unknown = "hai";
// misterius.toUpperCase();              // ✗ error
if (typeof misterius === "string") {
  misterius.toUpperCase();              // ✓ boleh setelah diperiksa
}`,
      explain: [
        '<code>any</code> menonaktifkan pemeriksaan tipe untuk variabel itu — sama saja kembali ke JavaScript.',
        '<code>unknown</code> adalah alternatif <b>aman</b>: nilai harus diperiksa (<b>type guard</b>) sebelum dipakai.',
        'Aturan praktis: pakai <code>unknown</code>, bukan <code>any</code>.'
      ]
    },
    {
      type: 'example',
      title: 'void dan never',
      lang: 'typescript',
      output: false,
      code: `// void: fungsi yang tidak mengembalikan apa pun
function tutup(): void {
  console.log("Tutup.");
}

// never: fungsi yang tidak pernah selesai "biasa"
function gagal(pesan: string): never {
  throw new Error(pesan);
}`,
      explain: [
        '<code>void</code> = "tidak ada nilai kembalian" — dipakai untuk fungsi yang hanya melakukan aksi.',
        '<code>never</code> = fungsi selalu melempar error atau berlooping selamanya; tidak pernah kembali.',
        'Keduanya kebanyakan muncul di tanda tangan fungsi, bukan variabel harian.'
      ]
    },
    {
      type: 'warn',
      title: 'Kapan tipe eksplisit wajib?',
      text: 'Variabel yang <b>belum punya nilai</b> butuh tipe: <code>let nanti: string;</code>. Tanpa tipe, TypeScript menganggapnya <code>any</code> (dan dengan <code>strict</code> aktif, variabel tersebut hanya boleh diisi setelah diperiksa). Parameter fungsi juga tidak bisa ditebak — selalu beri tipe.'
    },
    {
      type: 'vocab',
      items: [
        ['string', 'Tipe teks, ditulis dengan tanda kutip.'],
        ['number', 'Tipe semua angka (bulat, desimal, negatif).'],
        ['boolean', 'Tipe true atau false.'],
        ['bigint', 'Tipe bilangan bulat sangat besar (akhiran n).'],
        ['symbol', 'Tipe nilai unik yang tak bisa disamakan.'],
        ['null / undefined', 'Tanda "kosong" dan "belum diisi".'],
        ['any', 'Tipe tanpa pemeriksaan; hindari bila bisa.'],
        ['unknown', 'Tipe aman: harus diperiksa sebelum dipakai.'],
        ['void', 'Tipe kembalian fungsi tanpa nilai kembali.'],
        ['never', 'Tipe fungsi yang tidak pernah kembali.'],
        ['Inferensi tipe', 'TypeScript menebak tipe dari nilai awal.']
      ]
    }
  ],
  recap: [
    'Tipe dasar: string, number, boolean, bigint, symbol, null, undefined.',
    'number mencakup semua angka; tidak ada int/float terpisah.',
    'let untuk variabel berubah-ubah, const untuk tetap.',
    'TypeScript menebak tipe dari nilai awal (inferensi).',
    'Hindari any; gunakan unknown untuk nilai yang belum diketahui tipe.'
  ]
});

/* ---------- Pelajaran 6: Type Assertions ---------- */
window.TS_LESSONS.push({
  id: 'type-assertions',
  title: 'Type Assertions',
  chapter: 'Tipe Data',
  duration: '9 menit',
  intro: [
    'Kadang kamu <b>tahu lebih banyak</b> tentang sebuah nilai daripada TypeScript. <b>Type assertion</b> adalah cara berkata: "percayai saya, nilai ini sebenarnya bertipe X".',
    'Pelajaran ini membahas dua sintaks dan aturan mainnya.'
  ],
  objectives: [
    'Menulis assertion dengan kata kunci as',
    'Mengetui sintaks sudut (<T>) dan kapan tidak dipakai',
    'Memahami bahwa assertion tidak mengubah runtime',
    'Mengenali kasus pemakaian yang wajar'
  ],
  sections: [
    {
      type: 'example',
      title: 'Sintaks as — cara modern',
      lang: 'typescript',
      output: false,
      code: `const panjangTeks = "123";

// TypeScript melihat string, kita tahu ini angka:
const angka = panjangTeks as unknown as number;

// Contoh sehari-hari di browser:
const input = document.getElementById("usia") as HTMLInputElement;
console.log(input.value);   // .value ada karena input bertipe HTMLInputElement`,
      explain: [
        '<code>nilai as Tipe</code> memberi tahu kompilator bahwa nilai itu <b>sebenarnya</b> bertipe <code>Tipe</code>.',
        'Contoh <code>document.getElementById(...)</code> mengembalikan <code>HTMLElement | null</code>; dengan <code>as HTMLInputElement</code>, properti <code>.value</code> bisa diakses.',
        'Sintaks <code>as</code> adalah cara yang disarankan dan bekerja di semua berkas .ts.'
      ]
    },
    {
      type: 'example',
      title: 'Sintaks sudut <T> — cara lama',
      lang: 'typescript',
      output: false,
      code: `const angka = <number>"123";
// Sama artinya dengan: "123" as number

// TAPI sintaks ini DILARANG di berkas .tsx (React),
// karena <T> menyerupai tag JSX.`,
      explain: [
        'Bentuk <code>&lt;Tipe&gt;nilai</code> adalah gaya lama yang masih berfungsi di berkas <code>.ts</code>.',
        'Di <code>.tsx</code> (React) bentuk ini bentrok dengan JSX — maka gunakan <code>as</code> saja.'
      ]
    },
    {
      type: 'warn',
      title: 'Assertion tidak mengubah apa pun saat jalan',
      text: 'Type assertion <b>hanya bicara ke kompilator</b>. Tidak ada konversi data, tidak ada pengecekan saat runtime. <code>"123" as number</code> tetap berisi teks "123" — kalau dipakai sebagai angka, program tetap bisa error. Assertion seperti mengatakan "percaya aku", bukan "jadikan aku".'
    },
    {
      type: 'tip',
      title: 'Kapan memakai assertion',
      text: 'Pemakaian wajar: elemen DOM (<code>as HTMLInputElement</code>), membaca data dari <code>JSON.parse()</code> yang bentuknya sudah diketahui, atau menyempurnakan tipe dari pustaka lama. Hindari assertion untuk <b>membodohi</b> kompilator — kalau sering melakukannya, perbaiki tipe datanya.'
    },
    {
      type: 'example',
      title: 'Assertion vs konversi',
      lang: 'typescript',
      output: false,
      code: `const teks = "123";

// Assertion — isi tetap string!
const a = teks as unknown as number;

// Konversi sungguhan — benar-benar jadi angka
const b = Number(teks);
const c = parseInt(teks, 10);

console.log(typeof a);   // "string"  (tipu daya)
console.log(typeof b);   // "number"  (asli)`,
      explain: [
        'Hanya <code>Number()</code> / <code>parseInt()</code> yang <b>benar-benar mengubah</b> string menjadi angka.',
        'Assertion <code>as</code> hanya mengubah <b>cara kompilator melihat</b> nilai tersebut.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Type assertion', 'Perintah ke kompilator untuk memperlakukan nilai sebagai tipe tertentu.'],
        ['as', 'Kata kunci assertion modern: nilai as Tipe.'],
        ['Sintaks sudut', 'Bentuk lama <Tipe>nilai; tidak untuk berkas .tsx.'],
        ['Konversi (casting data)', 'Mengubah nilai sungguhan, mis. Number("123").'],
        ['HTMLInputElement', 'Tipe DOM untuk elemen <input>; punya properti .value.'],
        ['JSON.parse()', 'Mengubah teks JSON jadi objek; hasilnya sering perlu assertion.']
      ]
    }
  ],
  recap: [
    'Type assertion memberi tahu kompilator tipe sebenarnya dari sebuah nilai.',
    'Sintaks modern: nilai as Tipe. Sintaks lama <Tipe>nilai (hindari di .tsx).',
    'Assertion tidak mengubah data saat runtime dan tidak melakukan konversi.',
    'Cocok untuk elemen DOM dan data dari JSON; jangan dipakai untuk membohongi tipe.',
    'Untuk konversi nyata, pakai Number(), String(), parseInt(), dst.'
  ]
});

/* ---------- Pelajaran 7: Type Aliases ---------- */
window.TS_LESSONS.push({
  id: 'type-aliases',
  title: 'Type Aliases',
  chapter: 'Tipe Data',
  duration: '10 menit',
  intro: [
    'Menuliskan tipe panjang berulang kali merepotkan dan rawan salah ketik. <b>Type alias</b> memberi <b>nama</b> pada sebuah tipe agar bisa dipakai ulang.',
    'Pelajaran ini membahas pembuatan alias mulai dari yang sederhana hingga kompleks.'
  ],
  objectives: [
    'Membuat type alias dengan kata kunci type',
    'Memakai alias untuk tipe primitif, gabungan, dan objek',
    'Memahami aturan penamaan (PascalCase)',
    'Membedakan alias dan interface (ikhtisar)'
  ],
  sections: [
    {
      type: 'example',
      title: 'Alias pertama',
      lang: 'typescript',
      output: false,
      code: `type Nama = string;
type Nilai = number;

const siswa: Nama = "Budi";
const skor: Nilai = 95;

// Alias untuk gabungan tipe
type Status = "aktif" | "nonaktif" | "banned";

let akun: Status = "aktif";
// akun = "tidur";   // ✗ Error: tidak ada di daftar`,
      explain: [
        '<code>type Nama = string</code> membuat <b>nama lain</b> untuk <code>string</code>.',
        'Alias boleh berisi <b>gabungan (union)</b> — <code>Status</code> hanya menerima tiga nilai tertentu.',
        'Sekali didefinisikan, alias dipakai seperti tipe biasa: <code>let akun: Status</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Alias untuk objek',
      lang: 'typescript',
      output: false,
      code: `type Pengguna = {
  id: number;
  nama: string;
  email?: string;        // opsional
  readonly dibuatPada: Date;
};

const u: Pengguna = {
  id: 1,
  nama: "Sari",
  dibuatPada: new Date()
};

console.log(u.nama);      // "Sari"
console.log(u.email);     // undefined — opsional`,
      explain: [
        'Alias dapat mendeskripsikan <b>bentuk objek</b>: properti apa saja dan bertipe apa.',
        'Tanda <code>?</code> menandai properti <b>opsional</b> (<code>email</code> boleh tidak diisi).',
        '<code>readonly</code> melarang pengubahan setelah objek dibuat.'
      ]
    },
    {
      type: 'example',
      title: 'Alias boleh memakai alias lain',
      lang: 'typescript',
      output: false,
      code: `type ID = number | string;
type Produk = {
  id: ID;
  nama: string;
  harga: number;
};

const p1: Produk = { id: 101, nama: "Buku", harga: 45000 };
const p2: Produk = { id: "A-202", nama: "Pensil", harga: 3000 };`,
      explain: [
        'Alias bisa <b>disusun</b>: <code>Produk</code> memakai <code>ID</code> di dalamnya.',
        'Karena <code>ID = number | string</code>, kedua produk di atas sah — satu pakai angka, satu pakai kode teks.'
      ]
    },
    {
      type: 'tip',
      title: 'Aturan penamaan',
      text: 'Nama alias ditulis <b>PascalCase</b> (huruf besar di awal tiap kata): <code>Pengguna</code>, <code>ItemKeranjang</code>. Konvensi ini membedakan tipe dari variabel (camelCase) dan dipakai luas di ekosistem TypeScript.'
    },
    {
      type: 'example',
      title: 'Alias vs interface (sekilas)',
      lang: 'typescript',
      output: false,
      code: `// type alias
type Titik = { x: number; y: number };

// interface — hampir sama untuk kasus ini
interface Titik2 { x: number; y: number }

// Perbedaan utama:
// - type bisa membuat union, tuple, mapped types
// - interface bisa "diperluas" lewat extends dan digabung otomatis`,
      explain: [
        'Untuk mendeskripsikan objek, keduanya sering bisa dipakai secara bergantian.',
        '<code>type</code> lebih fleksibel (union, mapped types, dll).',
        '<code>interface</code> bisa <b>diperluas</b> dan <b>digabung</b> (declaration merging) — dibahas di pelajaran Interface nanti.',
        'Bila ragu, mulai dengan <code>interface</code> untuk objek, <code>type</code> untuk gabungan tipe.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Type alias', 'Nama baru untuk sebuah tipe, dibuat dengan type.'],
        ['PascalCase', 'Gaya penulisan nama tipe: TiapKataDiawalHurufBesar.'],
        ['Union type', 'Tipe gabungan dengan |, mis. number | string.'],
        ['readonly', 'Properti yang tidak boleh diubah setelah inisialisasi.'],
        ['? (opsional)', 'Tanda properti yang boleh tidak diisi.'],
        ['Declaration merging', 'Kemampuan interface bernama sama untuk digabung otomatis.']
      ]
    }
  ],
  recap: [
    'type alias memberi nama pada tipe agar dipakai ulang.',
    'Alias bisa untuk primitif, gabungan tipe, dan bentuk objek.',
    'Properti opsional ditandai ? dan properti tetap ditandai readonly.',
    'Nama alias ditulis PascalCase.',
    'type fleksibel untuk union/mapped type; interface cocok untuk kontrak objek.'
  ]
});

/* ---------- Pelajaran 8: Literal Types ---------- */
window.TS_LESSONS.push({
  id: 'literal-types',
  title: 'Literal Types',
  chapter: 'Tipe Data',
  duration: '9 menit',
  intro: [
    'Alih-alih membiarkan string atau angka <b>bebas</b>, TypeScript bisa membatasi variabel hanya pada <b>nilai-nilai tertentu</b>. Itulah <b>literal type</b>.',
    'Pelajaran ini membahas literal string, angka, boolean, dan kata kunci as const.'
  ],
  objectives: [
    'Membuat literal type dari string, number, boolean',
    'Menggabungkan literal type dengan type alias',
    'Memakai as const agar nilai menjadi tetap',
    'Menjelaskan manfaat literal type untuk kode yang aman'
  ],
  sections: [
    {
      type: 'example',
      title: 'Literal type dasar',
      lang: 'typescript',
      output: false,
      code: `let arah: "kiri" | "kanan" = "kiri";
arah = "kanan";       // ✓ ada dalam daftar
// arah = "atas";     // ✗ Error: "atas" tidak diperbolehkan

let level: 1 | 2 | 3 = 1;
let nyala: true = true;

// Bandingkan: tanpa literal, semua string diterima
let bebas: string = "apa saja";`,
      explain: [
        '<code>let arah: "kiri" | "kanan"</code> berarti variabel <b>hanya boleh berisi</b> teks "kiri" atau "kanan".',
        'Literal type bekerja untuk <b>teks</b> ("kiri"), <b>angka</b> (1, 2, 3), dan <b>boolean</b> (true atau false saja).',
        'Kesalahan nilai langsung ketahuan — sangat berguna untuk opsi menu, status, level, dan sebagainya.'
      ]
    },
    {
      type: 'example',
      title: 'Literal type + type alias',
      lang: 'typescript',
      output: false,
      code: `type Warna = "merah" | "hijau" | "biru";
type Operator = "tambah" | "kurang" | "kali" | "bagi";

function hitung(a: number, b: number, op: Operator): number {
  switch (op) {
    case "tambah": return a + b;
    case "kurang": return a - b;
    case "kali":   return a * b;
    case "bagi":   return a / b;
  }
}

console.log(hitung(10, 5, "kali"));  // 50
// hitung(10, 5, "pangkat");         // ✗ Error`,
      explain: [
        'Alias <code>Operator</code> membatasi parameter <code>op</code> ke empat nilai saja.',
        'Di dalam <code>switch</code>, TypeScript <b>tahu</b> <code>op</code> hanya mungkin empat nilai tersebut — dan bisa memeriksa apakah semua cabang sudah ditangani.',
        'Ini pola yang sangat umum: parameter "mode" atau "perintah" yang terbatas.'
      ]
    },
    {
      type: 'example',
      title: 'as const — nilai jadi "beku"',
      lang: 'typescript',
      output: false,
      code: `// Tanpa as const: string biasa
let s1 = "merah";
s1 = "biru";            // ✓ string bisa diubah

// Dengan as const: literal yang tidak bisa berubah
const s2 = "merah" as const;
// s2 = "biru";         // ✗ Error

const konfig = {
  warna: "merah",
  jumlah: 5,
} as const;

// konfig.warna = "biru";  // ✗ Error: readonly`,
      explain: [
        '<code>as const</code> memberi tahu TypeScript bahwa nilai <b>harus diperlakukan sebagai literal tepatnya</b>, bukan tipe umum.',
        'Pada objek, <code>as const</code> menjadikan <b>semua properti readonly</b> dan nilainya literal.',
        'Berguna untuk data konfigurasi tetap, daftar opsi, atau mengirim prop ke komponen.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan literal type bersinar',
      text: 'Pakai literal type saat sebuah variabel punya <b>daftar nilai terbatas yang diketahui</b>: status pesanan ("pending" | "dikirim" | "selesai"), peran pengguna ("admin" | "user"), posisi ("kiri" | "tengah" | "kanan"). Daripada memvalidasi di runtime, biarkan kompilator menjaga daftar itu.'
    },
    {
      type: 'warn',
      title: 'Hati-hati dengan let dan inferensi',
      text: 'TypeScript hanya <b>meluas</b> literal menjadi <code>string</code>/<code>number</code> bila variabel bisa diubah (<code>let</code>). Pada <code>const</code>, literal tetap literal. Karena itu, fungsi yang mengharapkan literal sering menolak variabel <code>let</code> — solusinya: beri tipe eksplisit atau gunakan <code>as const</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Literal type', 'Tipe yang hanya berisi satu atau beberapa nilai tertentu.'],
        ['as const', 'Menandai nilai sebagai literal readonly.'],
        ['Narrowing', 'Penyempitan tipe di dalam cabang kode (if/switch).'],
        ['Union of literals', 'Gabungan beberapa literal dengan tanda |.'],
        ['Konfigurasi tetap', 'Data yang tidak berubah saat program jalan.']
      ]
    }
  ],
  recap: [
    'Literal type membatasi nilai ke daftar tertentu (teks, angka, boolean).',
    'Digabungkan dengan type alias untuk parameter "mode" yang rapi.',
    'as const membekukan nilai menjadi literal readonly.',
    'Literal type mengubah bug "nilai salah" menjadi error saat kompilasi.',
    'let meluaskan literal ke tipe umum; const mempertahankannya.'
  ]
});
