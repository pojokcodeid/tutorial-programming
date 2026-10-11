/* ============================================================
   Pelajaran TypeScript — Bab 10: Generik
   (topik info.md: "generics")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 23: Generics ---------- */
window.TS_LESSONS.push({
  id: 'generics-typescript',
  title: 'Generics',
  chapter: 'Generik',
  duration: '13 menit',
  intro: [
    '<b>Generics</b> adalah <b>tipe yang menjadi parameter</b>: sebuah fungsi atau tipe yang bekerja untuk <b>berbagai tipe</b> tanpa kehilangan pemeriksaan.',
    'Pelajaran ini membahas fungsi generik, batasan (constraints), dan tipe generik.'
  ],
  objectives: [
    'Memahami masalah yang dipecahkan generics',
    'Menulis fungsi generik <T>',
    'Memakai batasan generik (extends)',
    'Membuat interface dan tipe generik'
  ],
  sections: [
    {
      type: 'example',
      title: 'Masalah: tanpa generics',
      lang: 'typescript',
      output: false,
      code: `// Jelek 1: any — pemeriksaan hilang
function pertamaAny(arr: any): any {
  return arr[0];
}
const a = pertamaAny([1, 2, 3]);
// a: any — TypeScript tidak tahu ini number

// Jelek 2: overload — terbatas
function pertama(arr: number[]): number;
function pertama(arr: string[]): string;
function pertama(arr: any): any {
  return arr[0];
}`,
      explain: [
        '<code>any</code> membuat kompilator <b>lupa</b> tipe — hasilnya bebas dipakai salah.',
        'Overload hanya menangani tipe yang <b>didaftarkan</b> — tidak fleksibel.',
        'Generics adalah jalan ketiga: <b>tetap bertipe, tapi umum</b>.'
      ]
    },
    {
      type: 'example',
      title: 'Fungsi generik',
      lang: 'typescript',
      output: false,
      code: `function pertama<T>(arr: T[]): T {
  return arr[0];
}

const a = pertama([1, 2, 3]);         // a: number
const b = pertama(["a", "b"]);         // b: string
const c = pertama([true, false]);      // c: boolean

console.log(a.toFixed(2));   // ✓ number
// console.log(a.toUpperCase());  // ✗ Error: number

// Tipe boleh dinyatakan eksplisit:
const d = pertama<string>(["x", "y"]);`,
      explain: [
        '<code>&lt;T&gt;</code> setelah nama fungsi mendeklarasikan <b>parameter tipe</b>.',
        '<code>arr: T[]</code> berarti "array dari T"; kembalian <code>T</code> berarti "satu elemen bertipe T".',
        'Saat dipanggil, TypeScript <b>menebak</b> T dari argumen — <code>pertama([1,2,3])</code> membuat <code>T = number</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Dua parameter tipe',
      lang: 'typescript',
      output: false,
      code: `function pasangan<K, V>(k: K, v: V): [K, V] {
  return [k, v];
}

const p1 = pasangan("nama", 25);
// p1: [string, number]

const p2 = pasangan(1, true);
// p2: [number, boolean]

console.log(p1[0].toUpperCase());   // ✓ string
console.log(p1[1].toFixed(0));       // ✓ number`,
      explain: [
        'Sebuah fungsi boleh punya <b>beberapa parameter tipe</b>: <code>&lt;K, V&gt;</code>.',
        'Kembalian <code>[K, V]</code> adalah <b>tuple</b> yang tipenya mengikuti argumen.',
        'Konvensi: <code>T</code> untuk tipe umum, <code>K</code>/<code>V</code> untuk kunci/nilai.'
      ]
    },
    {
      type: 'example',
      title: 'Batasan generik (constraint)',
      lang: 'typescript',
      output: false,
      code: `// T harus punya properti length
function cetakPanjang<T extends { length: number }>(x: T): number {
  return x.length;
}

console.log(cetakPanjang("TypeScript"));   // 10
console.log(cetakPanjang([1, 2, 3]));       // 3
// cetakPanjang(42);                        // ✗ Error

// Alternatif: batasi ke tipe tertentu
function max<T extends number>(a: T, b: T): T {
  return a > b ? a : b;
}`,
      explain: [
        '<code>T extends ...</code> membatasi T pada tipe yang <b>memiliki</b> properti tertentu.',
        'String dan array sama-sama punya <code>length</code> — keduanya diterima.',
        'Angka <code>42</code> tidak punya <code>length</code> — ditolak saat kompilasi.'
      ]
    },
    {
      type: 'example',
      title: 'Interface dan tipe generik',
      lang: 'typescript',
      output: false,
      code: `// Interface generik
interface Kotak<T> {
  isi: T;
  ambil(): T;
}

const k1: Kotak<string> = {
  isi: "berlian",
  ambil: () => "berlian"
};

// Alias tipe generik
type Daftar<T> = {
  data: T[];
  tambah(item: T): void;
};

// Alias yang langsung menghasilkan bentuk final:
type StringKotak = Kotak<string>;`,
      explain: [
        '<code>Kotak&lt;T&gt;</code> adalah <b>cetak biru</b>; <code>Kotak&lt;string&gt;</code> adalah <b>bentuk final</b>.',
        'Alias generik berguna untuk struktur data berulang: <code>Daftar&lt;Produk&gt;</code>, <code>Daftar&lt;Pengguna&gt;</code>.',
        'Prinsipnya sama dengan fungsi generik — parameter tipenya saja yang berbeda.'
      ]
    },
    {
      type: 'tip',
      title: 'Konvensi nama parameter tipe',
      text: '<code>T</code> — Tipe utama. <code>K</code>, <code>V</code> — Kunci, Nilai. <code>E</code> — Elemen. <code>U</code>, <code>W</code> — Tipe kedua. Gunakan nama bermakna bila lebih jelas: <code>&lt;TProduk&gt;</code>'
    },
    {
      type: 'warn',
      title: 'Jangan generik berlebihan',
      text: 'Generics untuk kode yang <b>dipakai ulang lintas tipe</b>. Untuk satu fungsi yang hanya menangani <code>number</code>, tulis saja <code>number</code> — lebih sederhana dan error lebih jelas. Kegunaan utama generics: pustaka, struktur data, dan fungsi utilitas.'
    },
    {
      type: 'vocab',
      items: [
        ['Generics', 'Tipe yang menjadi parameter fungsi/tipe.'],
        ['Parameter tipe', 'T di <T> — jenis yang ditentukan pemanggil.'],
        ['Inferensi generik', 'TypeScript menebak T dari argumen.'],
        ['Constraint', 'Batasan T extends ... .'],
        ['Kotak<T>', 'Interface generik.'],
        ['Tuple', 'Array dengan tipe elemen tetap.'],
        ['K/V', 'Konvensi kunci dan nilai.']
      ]
    }
  ],
  recap: [
    'Generics membuat fungsi/tipe yang tetap bertipe namun umum.',
    'Fungsi generik: function nama<T>(...): T.',
    'T ditebak dari argumen atau dinyatakan: pertama<string>(...).',
    'Batasan: T extends { length: number } membatasi anggota.',
    'Interface dan type alias juga bisa generik: Kotak<T>.'
  ]
});
