/* ============================================================
   Pelajaran TypeScript — Bab 7: Fungsi
   (topik info.md: "function dan parameter")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 19: Function dan Parameter ---------- */
window.TS_LESSONS.push({
  id: 'function-parameter-typescript',
  title: 'Function dan Parameter',
  chapter: 'Fungsi',
  duration: '13 menit',
  intro: [
    'Fungsi adalah blok kode bernama. TypeScript memeriksa <b>parameter</b> dan <b>nilai kembalian</b> fungsi — inilah salah satu tempat paling berharga dari tipe statis.',
    'Pelajaran ini membahas penulisan tipe fungsi secara lengkap.'
  ],
  objectives: [
    'Menulis fungsi dengan tipe parameter dan kembalian',
    'Memakai parameter opsional dan default',
    'Memakai rest parameter',
    'Menulis overload fungsi'
  ],
  sections: [
    {
      type: 'example',
      title: 'Fungsi bertipe lengkap',
      lang: 'typescript',
      output: false,
      code: `function tambah(a: number, b: number): number {
  return a + b;
}

function sapa(nama: string): string {
  return "Halo, " + nama;
}

function cetak(pesan: string): void {
  console.log(pesan);
}

console.log(tambah(2, 3));      // 5
console.log(sapa("Andi"));      // "Halo, Andi"
cetak("Pesan");                  // menulis ke konsol

// tambah("2", "3");   // ✗ Error: parameter harus number`,
      explain: [
        'Setiap parameter diberi tipe setelah titik dua: <code>a: number</code>.',
        'Tipe kembalian ditulis setelah kurung tutup: <code>: number</code>, <code>: string</code>, atau <code>: void</code>.',
        'Pemanggilan dengan argumen salah tipe <b>ditolak saat kompilasi</b>.'
      ]
    },
    {
      type: 'example',
      title: 'Parameter opsional dan default',
      lang: 'typescript',
      output: false,
      code: `// Opsional (?): boleh tidak diisi (tipe jadi string | undefined)
function sambut(nama: string, gelar?: string): string {
  if (gelar) {
    return "Halo, " + gelar + " " + nama;
  }
  return "Halo, " + nama;
}

sambut("Sari");                    // "Halo, Sari"
sambut("Sari", "Dr.");             // "Halo, Dr. Sari"

// Default: nilai otomatis bila tidak diisi
function pangkat(x: number, p: number = 2): number {
  return x ** p;
}

console.log(pangkat(3));     // 9
console.log(pangkat(3, 3));  // 27`,
      explain: [
        '<code>gelar?: string</code> menandai parameter <b>opsional</b> — nilainya bisa <code>undefined</code>.',
        '<code>p: number = 2</code> memberi <b>nilai default</b>; tipe tidak perlu <code>?</code> karena selalu ada.',
        'Parameter opsional/default harus berada <b>setelah</b> parameter wajib.'
      ]
    },
    {
      type: 'example',
      title: 'Rest parameter',
      lang: 'typescript',
      output: false,
      code: `function jumlahkan(...angka: number[]): number {
  let total = 0;
  for (const n of angka) total += n;
  return total;
}

console.log(jumlahkan(1, 2));            // 3
console.log(jumlahkan(1, 2, 3, 4));      // 10

// Rest juga bisa bertipe union
function tag(format: string, ...nilai: (string | number)[]): string {
  return format + ": " + nilai.join(", ");
}

console.log(tag("item", "buku", 3));`,
      explain: [
        '<code>...angka: number[]</code> mengumpulkan <b>semua argumen tersisa</b> menjadi array.',
        'Rest parameter ditempatkan di <b>akhir</b> daftar parameter.',
        'Di dalam fungsi, <code>angka</code> adalah array biasa — bisa diiterasi.'
      ]
    },
    {
      type: 'example',
      title: 'Ekspresi fungsi & arrow function',
      lang: 'typescript',
      output: false,
      code: `// Ekspresi fungsi bertipe
const kali = function (a: number, b: number): number {
  return a * b;
};

// Arrow function (paling umum)
const bagi = (a: number, b: number): number => {
  if (b === 0) throw new Error("Pembagi nol");
  return a / b;
};

// Arrow satu ekspresi: tipe kembalian ditebak
const kurangi = (a: number, b: number) => a - b;

console.log(kali(4, 5));    // 20
console.log(bagi(10, 2));     // 5
console.log(kurangi(9, 4));    // 5`,
      explain: [
        'Arrow function <code>(a, b) => ...</code> ringkas dan tidak punya <code>this</code> sendiri.',
        'Satu ekspresi boleh tanpa kurung kurawal dan <code>return</code> — kembalian <b>ditebak otomatis</b>.',
        'Tipe parameter tetap ditulis; hanya tipe kembalian yang bisa ditebak.'
      ]
    },
    {
      type: 'example',
      title: 'Overload fungsi',
      lang: 'typescript',
      output: false,
      code: `// Tiga tanda tangan (signature) yang mungkin:
function balik(input: string): string;
function balik<T>(input: T[]): T[];
function balik(input: any): any {
  if (typeof input === "string") {
    return input.split("").reverse().join("");
  }
  return input.slice().reverse();
}

console.log(balik("TS"));        // "ST"
console.log(balik([1, 2, 3]));   // [3, 2, 1]`,
      explain: [
        '<b>Overload</b> memungkinkan satu nama fungsi dengan <b>beberapa tanda tangan</b>.',
        'Daftar signature ditulis dulu; implementasi terakhir memakai <code>any</code>.',
        'Pemanggil mendapat pemeriksaan tipe yang tepat per bentuk argumen.'
      ]
    },
    {
      type: 'warn',
      title: 'void ≠ undefined',
      text: '<code>void</code> berarti "tidak ada nilai kembalian". Fungsi <code>void</code> tidak boleh <b>dibaca nilainya</b>. Bila fungsi mengembalikan <code>undefined</code> secara eksplisit (misal <code>return;</code>), itu tetap <code>void</code>. Jangan beri <code>: undefined</code> kecuali memang bermaksud demikian.'
    },
    {
      type: 'tip',
      title: 'Tipe kembalian sebaiknya ditulis',
      text: 'TypeScript bisa menebak kembalian, tetapi menulisnya secara eksplisit <b>mencegah perubahan tak sengaja</b> (misal menambahkan return lain) dan membuat error lebih jelas. Kebiasaan ini sangat membantu di proyek tim.'
    },
    {
      type: 'vocab',
      items: [
        ['Signature', 'Tanda tangan fungsi: parameter dan tipe kembalian.'],
        ['Parameter opsional', 'Parameter bertanda ? (boleh tidak diisi).'],
        ['Parameter default', 'Parameter dengan nilai cadangan.'],
        ['Rest parameter', '...args mengumpulkan argumen tersisa jadi array.'],
        ['Arrow function', 'Bentuk ringkas (a, b) => ... .'],
        ['Overload', 'Satu nama fungsi, beberapa tanda tangan.'],
        ['void', 'Tipe kembalian tanpa nilai.'],
        ['T[]', 'Array bertipe T, dipakai rest parameter.']
      ]
    }
  ],
  recap: [
    'Parameter dan tipe kembalian ditulis dengan :Tipe.',
    'Parameter opsional (?); default (=nilai); rest (...args).',
    'Arrow function ringkas; kembalian satu ekspresi ditebak.',
    'Overload memberi beberapa tanda tangan pada satu fungsi.',
    'Tulis tipe kembalian secara eksplisit untuk keamanan.'
  ]
});
