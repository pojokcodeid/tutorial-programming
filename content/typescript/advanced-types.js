/* ============================================================
   Pelajaran TypeScript — Bab 4: Tipe Lanjutan
   (topik info.md: "utility types", "mapped types")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 12: Utility Types ---------- */
window.TS_LESSONS.push({
  id: 'utility-types',
  title: 'Utility Types',
  chapter: 'Tipe Lanjutan',
  duration: '12 menit',
  intro: [
    'TypeScript menyediakan <b>tipe utilitas</b> siap pakai — fungsi yang mengubah tipe lain menjadi tipe baru.',
    'Pelajaran ini membahas yang paling sering dipakai: Partial, Required, Readonly, Pick, Omit, dan Record.'
  ],
  objectives: [
    'Memakai Partial, Required, dan Readonly',
    'Memakai Pick dan Omit',
    'Memakai Record untuk kamus data',
    'Memahami ReturnType dan Parameters'
  ],
  sections: [
    {
      type: 'example',
      title: 'Partial, Required, Readonly',
      lang: 'typescript',
      output: false,
      code: `type Pengguna = {
  id: number;
  nama: string;
  email: string;
};

// Semua properti jadi OPSIONAL
type Perbarui = Partial<Pengguna>;

const ubah1: Perbarui = { email: "baru@mail.com" };  // ✓ cukup satu

// Semua properti jadi WAJIB
type Lengkap = Required<Pengguna>;

// Semua properti jadi READONLY
type Beku = Readonly<Pengguna>;
const beku: Beku = { id: 1, nama: "A", email: "a@mail.com" };
// beku.nama = "B";   // ✗ Error: readonly`,
      explain: [
        '<code>Partial&lt;T&gt;</code> membuat semua properti opsional — cocok untuk formulir "perbaruan".',
        '<code>Required&lt;T&gt;</code> sebaliknya: semua properti wajib diisi.',
        '<code>Readonly&lt;T&gt;</code> melarang pengubahan properti.'
      ]
    },
    {
      type: 'example',
      title: 'Pick dan Omit',
      lang: 'typescript',
      output: false,
      code: `type Produk = {
  id: number;
  nama: string;
  harga: number;
  stok: number;
  deskripsi: string;
};

// Ambil HANYA properti tertentu
type KartuProduk = Pick<Produk, "id" | "nama" | "harga">;

const kartu: KartuProduk = { id: 1, nama: "Buku", harga: 45000 };

// Buang properti tertentu
type TanpaDeskripsi = Omit<Produk, "deskripsi">;`,
      explain: [
        '<code>Pick&lt;T, "a" | "b"&gt;</code> membentuk tipe baru dari <b>properti pilihan</b>.',
        '<code>Omit&lt;T, "x"&gt;</code> membentuk tipe baru <b>tanpa</b> properti tertentu.',
        'Keduanya sangat lazim untuk "tampilan" data yang berbeda-beda (daftar vs detail).'
      ]
    },
    {
      type: 'example',
      title: 'Record — kamus data',
      lang: 'typescript',
      output: false,
      code: `// Record<K, V> = objek dengan kunci bertipe K, nilai bertipe V
type Level = "admin" | "editor" | "viewer";
type Hak = { baca: boolean; tulis: boolean };

const hakAkses: Record<Level, Hak> = {
  admin:  { baca: true, tulis: true },
  editor: { baca: true, tulis: true },
  viewer: { baca: true, tulis: false }
};

// Record untuk kamus string biasa
type Kamus = Record<string, string>;
const terjemah: Kamus = { hello: "halo", bye: "sampai jumpa" };`,
      explain: [
        '<code>Record&lt;K, V&gt;</code> adalah cara rapi membuat <b>objek berbentuk kamus</b>.',
        'Contoh pertama: kunci dibatasi ke tiga level; setiap level <b>harus ada</b> dalam objek.',
        'Contoh kedua: kunci bebas berupa string, nilai berupa string.'
      ]
    },
    {
      type: 'example',
      title: 'ReturnType dan Parameters',
      lang: 'typescript',
      output: false,
      code: `function buatId(awalan: string, angka: number): string {
  return awalan + "-" + angka;
}

// Ambil tipe kembalian fungsi
type HasilBuatId = ReturnType<typeof buatId>;  // string

// Ambil tipe parameter fungsi (sebagai tuple)
type ParamBuatId = Parameters<typeof buatId>;
// [string, number]

const balasan: HasilBuatId = "X-1";   // ✓ string
const args: ParamBuatId = ["Y", 2];   // ✓ [string, number]`,
      explain: [
        '<code>ReturnType&lt;typeof f&gt;</code> mengekstrak <b>tipe kembalian</b> fungsi.',
        '<code>Parameters&lt;typeof f&gt;</code> mengekstrak <b>daftar parameter</b> sebagai tuple.',
        '<code>typeof</code> di sini berarti "ambil tipe dari fungsi ini".'
      ]
    },
    {
      type: 'tip',
      title: 'Kenapa disebut "utility"?',
      text: 'Karena mereka <b>menghemat penulisan</b>: alih-alih menduplikasi tipe dengan perubahan kecil, cukup transformasi tipe yang sudah ada. Nama tipe pun tetap sinkron — ubah <code>Produk</code>, dan <code>KartuProduk</code> otomatis mengikuti.'
    },
    {
      type: 'vocab',
      items: [
        ['Utility type', 'Tipe bawaan yang mentransformasi tipe lain.'],
        ['Partial<T>', 'Semua properti menjadi opsional.'],
        ['Required<T>', 'Semua properti menjadi wajib.'],
        ['Readonly<T>', 'Semua properti menjadi readonly.'],
        ['Pick / Omit', 'Memilih / membuang properti tertentu.'],
        ['Record<K, V>', 'Tipe objek dengan kunci K dan nilai V.'],
        ['ReturnType', 'Tipe kembalian sebuah fungsi.'],
        ['Parameters', 'Tuple tipe parameter sebuah fungsi.'],
        ['typeof', 'Operator untuk mengambil tipe sebuah nilai.']
      ]
    }
  ],
  recap: [
    'Utility types mentransformasi tipe yang sudah ada.',
    'Partial/Required/Readonly mengubah kewajiban dan sifat properti.',
    'Pick memilih properti; Omit membuang properti.',
    'Record membuat kamus data bertipe.',
    'ReturnType dan Parameters mengekstrak bagian fungsi.'
  ]
});

/* ---------- Pelajaran 13: Mapped Types ---------- */
window.TS_LESSONS.push({
  id: 'mapped-types',
  title: 'Mapped Types',
  chapter: 'Tipe Lanjutan',
  duration: '11 menit',
  intro: [
    '<b>Mapped type</b> adalah cara <b>membuat tipe baru dengan mengulangi</b> setiap properti tipe lain — seperti <code>map()</code> pada array, tetapi untuk tipe.',
    'Pelajaran ini membahas sintaksnya dan cara menulis versi sendiri dari Readonly.'
  ],
  objectives: [
    'Membaca sintaks mapped type { [K in keyof T]: ... }',
    'Membuat mapped type pertama',
    'Menulis ulang Readonly secara manual',
    'Memahami keyof dan modifikasi +readonly / -?'
  ],
  sections: [
    {
      type: 'example',
      title: 'Sintaks dasar',
      lang: 'typescript',
      output: false,
      code: `type Profil = { nama: string; umur: number; kota: string };

// Untuk setiap properti K di Profil,
// buat properti K dengan tipe yang sama
type ProfilBacaSaja = {
  [K in keyof Profil]: Profil[K];
};

const p: ProfilBacaSaja = {
  nama: "Rina", umur: 28, kota: "Yogyakarta"
};`,
      explain: [
        '<code>[K in keyof Profil]</code> berarti: <b>untuk setiap kunci K</b> yang ada di <code>Profil</code>.',
        '<code>keyof Profil</code> = gabungan nama propertinya: <code>"nama" | "umur" | "kota"</code>.',
        '<code>Profil[K]</code> = tipe properti <code>K</code> pada <code>Profil</code>.',
        'Ini bentuk paling sederhana dari <b>mapped type</b>.'
      ]
    },
    {
      type: 'example',
      title: 'Menulis Readonly sendiri',
      lang: 'typescript',
      output: false,
      code: `// Versi kita sendiri dari Readonly<T>
type BacaSaja<T> = {
  readonly [K in keyof T]: T[K];
};

type Produk = { nama: string; harga: number };
const produk: BacaSaja<Produk> = { nama: "Pensil", harga: 3000 };
// produk.harga = 4000;   // ✗ Error: readonly`,
      explain: [
        'Menambahkan <code>readonly</code> di depan <code>[K in ...]</code> menjadikan <b>setiap properti</b> hasilnya readonly.',
        'Inilah cara <code>Readonly&lt;T&gt;</code> bekerja di balik layar.',
        'Mapped type menjadikan transformasi massal mungkin — tanpa menulis properti satu per satu.'
      ]
    },
    {
      type: 'example',
      title: 'Memodifikasi: +readonly dan -?',
      lang: 'typescript',
      output: false,
      code: `// Hapus tanda opsional dari semua properti
type Wajib<T> = {
  [K in keyof T]-?: T[K];
};

type Data = { a?: string; b?: number };
type DataWajib = Wajib<Data>;
// { a: string; b: number }

// Tambahkan opsional ke semua properti
type Opsional<T> = {
  [K in keyof T]+?: T[K];
};`,
      explain: [
        '<code>-?</code> <b>menghapus</b> opsionalitas; <code>+?</code> <b>menambahkannya</b>.',
        '<code>+readonly</code> / <code>-readonly</code> serupa untuk properti readonly.',
        'Tanda <code>+</code> boleh dikosongkan karena itu nilai bawaan.'
      ]
    },
    {
      type: 'example',
      title: 'Mengubah tipe tiap properti',
      lang: 'typescript',
      output: false,
      code: `// Setiap nilai jadi fungsi getter
type Getter<T> = {
  [K in keyof T]: () => T[K];
};

type Orang = { nama: string; umur: number };
type OrangGetter = Getter<Orang>;
// { nama: () => string; umur: () => number }

const ambil: OrangGetter = {
  nama: () => "Andi",
  umur: () => 25
};

console.log(ambil.nama());   // Andi`,
      explain: [
        'Sisi kanan mapped type boleh <b>ekspresi tipe apa pun</b>: <code>() => T[K]</code> membungkus tiap tipe jadi fungsi.',
        'Pola ini mirip pustaka seperti Vue (<code>UnwrapRef</code>) dan React (props bertipe).'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan butuh mapped type',
      text: 'Saat kamu perlu <b>mengubah semua properti</b> sekaligus: menjadikan readonly, opsional, berubah tipe, atau menambahkan pembungkus. Untuk satu dua properti, tulis saja manual; untuk tipe dengan belasan properti, mapped type adalah juaranya.'
    },
    {
      type: 'warn',
      title: 'Bukan untuk runtime',
      text: 'Mapped type, seperti semua tipe TypeScript, <b>lenyap saat kompilasi</b>. Ia hanya alat untuk pemeriksaan dan dokumentasi — tidak ada kode yang "mengulangi" properti saat program jalan.'
    },
    {
      type: 'vocab',
      items: [
        ['Mapped type', 'Tipe baru dibentuk dengan mengulangi properti tipe lain.'],
        ['keyof T', 'Gabungan nama properti dari tipe T.'],
        ['T[K]', 'Tipe properti K pada tipe T.'],
        ['[K in keyof T]', 'Klausa "untuk setiap kunci K di T".'],
        ['-? / +?', 'Menghapus / menambah opsionalitas properti.'],
        ['+readonly / -readonly', 'Menambah / menghapus sifat readonly.']
      ]
    }
  ],
  recap: [
    'Mapped type mengulangi properti tipe lain untuk membentuk tipe baru.',
    'Sintaks: { [K in keyof T]: T[K] } dengan modifikasi opsional.',
    'readonly [K in keyof T] meniru Readonly<T>.',
    '-? dan +? mengubah opsionalitas massal.',
    'Mapped type adalah fondasi banyak pustaka TypeScript.'
  ]
});
