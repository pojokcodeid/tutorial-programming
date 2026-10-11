/* ============================================================
   Pelajaran TypeScript — Bab 8: Kontrak Tipe
   (topik info.md: "interface dan type alias")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 20: Interface dan Type Alias ---------- */
window.TS_LESSONS.push({
  id: 'interface-type-alias',
  title: 'Interface dan Type Alias',
  chapter: 'Kontrak Tipe',
  duration: '13 menit',
  intro: [
    '<b>Interface</b> adalah cara utama TypeScript mendeskripsikan <b>kontrak objek</b>: properti apa yang harus ada dan bertipe apa.',
    'Pelajaran ini membahas interface secara mendalam dan perbandingannya dengan type alias.'
  ],
  objectives: [
    'Membuat interface dasar',
    'Memakai properti opsional dan readonly',
    'Memperluas interface dengan extends',
    'Memilih antara interface dan type'
  ],
  sections: [
    {
      type: 'example',
      title: 'Interface dasar',
      lang: 'typescript',
      output: false,
      code: `interface Pengguna {
  id: number;
  nama: string;
  email: string;
}

// Objek HARUS memenuhi kontrak:
const u: Pengguna = {
  id: 1,
  nama: "Andi",
  email: "andi@mail.com"
};

// const salah: Pengguna = { id: 1, nama: "Andi" };
// ✗ Error: properti 'email' hilang

console.log(u.email);   // "andi@mail.com"`,
      explain: [
        '<code>interface</code> mendeskripsikan <b>bentuk objek</b> — properti dan tipenya.',
        'Objek yang ditujukan sebagai <code>Pengguna</code> harus memiliki <b>semua</b> properti.',
        'Interface hanya ada saat kompilasi — tidak ada kode runtime.'
      ]
    },
    {
      type: 'example',
      title: 'Opsional, readonly, dan index signature',
      lang: 'typescript',
      output: false,
      code: `interface Produk {
  readonly id: number;     // tidak boleh diubah
  nama: string;
  deskripsi?: string;       // opsional
  [kunci: string]: unknown; // boleh punya properti lain
}

const p: Produk = {
  id: 101,
  nama: "Pensil",
  warna: "hitam"        // ✓ diperbolehkan oleh index signature
};

console.log(p.deskripsi);   // undefined
// p.id = 102;                // ✗ Error: readonly`,
      explain: [
        '<code>readonly</code> melarang pengubahan; <code>?</code> membuat properti opsional.',
        '<code>[kunci: string]: unknown</code> adalah <b>index signature</b>: objek boleh punya properti tambahan dengan tipe tertentu.',
        'Index signature berguna untuk data yang bentuknya fleksibel.'
      ]
    },
    {
      type: 'example',
      title: 'extends — memperluas interface',
      lang: 'typescript',
      output: false,
      code: `interface Hewan {
  nama: string;
  umur: number;
}

interface Kucing extends Hewan {
  warnaBulu: string;
  dengkur(): void;
}

const kucing: Kucing = {
  nama: "Mimi",
  umur: 2,
  warnaBulu: "putih",
  dengkur: () => console.log("purr...")
};

kucing.dengkur();   // purr...
console.log(kucing.nama);   // "Mimi"`,
      explain: [
        '<code>extends</code> mewarisi semua anggota interface lain, lalu menambah properti baru.',
        '<code>Kucing</code> wajib punya properti <code>Hewan</code> <b>dan</b> <code>Kucing</code>.',
        'Interface juga boleh <code>extends</code> beberapa interface sekaligus.'
      ]
    },
    {
      type: 'example',
      title: 'Interface vs type alias',
      lang: 'typescript',
      output: false,
      code: `// KEDUA bentuk ini setara untuk objek:
type TitikA = { x: number; y: number };
interface TitikB { x: number; y: number }

// Interface bisa DIGABUNG otomatis:
interface Jendela { judul: string; }
interface Jendela { lebar: number; }
// Jendela sekarang: { judul: string; lebar: number }

// Type alias TIDAK bisa digabung, tapi bisa:
// - union: type A = X | Y
// - tuple:  type B = [number, string]
// - mapped: type C = { [K in keyof X]: ... }`,
      explain: [
        'Untuk kontrak objek, keduanya sering bisa dipakai bergantian.',
        '<b>Interface</b> bisa <b>digabung</b> (declaration merging) dan <b>diperluas</b> — cocok untuk pustaka dan plugin.',
        '<b>type</b> lebih fleksibel: union, tuple, mapped type, dan kondisional.',
        'Aturan praktis: objek → interface; gabungan/transformasi → type.'
      ]
    },
    {
      type: 'tip',
      title: 'Interface untuk API publik',
      text: 'Ketika menulis <b>pustaka</b> atau <b>API</b>, interface adalah pilihan utama: pembaca bisa memperluasnya lewat <code>extends</code> dan penggabungan deklarasi. Type alias lebih baik untuk tipe yang <b>tidak akan diperluas</b> pengguna.'
    },
    {
      type: 'warn',
      title: 'Excess property check lagi',
      text: 'Ingat: objek literal langsung yang ditujukan ke interface <b>tidak boleh</b> membawa properti di luar kontrak — kecuali ada index signature. Salah ketik <code>nma</code> akan langsung ditolak. Ini fitur, bukan gangguan.'
    },
    {
      type: 'vocab',
      items: [
        ['Interface', 'Kontrak bentuk objek: properti dan tipenya.'],
        ['extends', 'Mewarisi anggota interface lain.'],
        ['Index signature', '[kunci: string]: T — properti tambahan.'],
        ['readonly property', 'Properti yang tidak boleh diubah.'],
        ['Optional property', 'Properti bertanda ?.'],
        ['Declaration merging', 'Penggabungan interface bernama sama.'],
        ['Excess property check', 'Larangan properti tak dideklarasikan.']
      ]
    }
  ],
  recap: [
    'Interface mendeskripsikan kontrak objek.',
    'Properti opsional (?), readonly, dan index signature.',
    'extends mewarisi dan memperluas interface.',
    'Interface bisa digabung; type alias bisa union/tuple/mapped.',
    'Untuk objek: interface; untuk transformasi tipe: type.'
  ]
});
