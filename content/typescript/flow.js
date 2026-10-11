/* ============================================================
   Pelajaran TypeScript — Bab 5: Alur Kendali
   (topik info.md: "operators", "controll flow", "perulangan")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 14: Operator ---------- */
window.TS_LESSONS.push({
  id: 'operators-typescript',
  title: 'Operator di TypeScript',
  chapter: 'Alur Kendali',
  duration: '10 menit',
  intro: [
    'Operator TypeScript <b>hampir seluruhnya sama</b> dengan JavaScript — perbedaannya, TypeScript memeriksa bahwa operand punya <b>tipe yang cocok</b>.',
    'Pelajaran ini mengulang operator sekaligus menunjukkan pemeriksaan tipe di dalamnya.'
  ],
  objectives: [
    'Memakai operator aritmatika dan perbandingan',
    'Memakai operator logika dan ternary',
    'Memakai ?? dan ?. (operator modern)',
    'Memahami pemeriksaan tipe pada operator'
  ],
  sections: [
    {
      type: 'example',
      title: 'Operator aritmatika & perbandingan',
      lang: 'typescript',
      output: false,
      code: `let a: number = 10;
let b: number = 3;

console.log(a + b);   // 13
console.log(a - b);   // 7
console.log(a * b);   // 30
console.log(a / b);   // 3.333...
console.log(a % b);   // 1  (sisa bagi)
console.log(a ** b);  // 1000 (pangkat)

console.log(a > b);   // true
console.log(a === b); // false
console.log(a !== b); // true`,
      explain: [
        'Semua operator aritmatika JavaScript ada di TypeScript: <code>+ - * / % **</code>.',
        'Perbandingan menghasilkan <code>boolean</code>; <code>===</code> dan <code>!==</code> memeriksa <b>nilai dan tipe</b>.',
        'TypeScript menolak <code>"teks" - 5</code> karena pengurangan teks tidak masuk akal.'
      ]
    },
    {
      type: 'example',
      title: 'Operator string & logika',
      lang: 'typescript',
      output: false,
      code: `const nama: string = "TypeScript";
const versi: number = 5;

// + menggabungkan string
console.log(nama + " " + versi);  // "TypeScript 5"

// && , || , !
const aktif: boolean = true;
const admin: boolean = false;

console.log(aktif && admin);  // false
console.log(aktif || admin);  // true
console.log(!aktif);          // false

// Ternary
const status = aktif ? "AKTIF" : "NONAKTIF";`,
      explain: [
        '<code>+</code> menggabungkan teks; <code>&amp;&amp;</code> (dan), <code>||</code> (atau), <code>!</code> (tidak).',
        'Ternary <code>kondisi ? a : b</code> adalah if-else satu baris.',
        'Karena TypeScript tahu <code>aktif</code> boolean, kondisi ternary dipastikan sah.'
      ]
    },
    {
      type: 'example',
      title: '?? dan ?. — operator modern',
      lang: 'typescript',
      output: false,
      code: `type Profil = { nama: string; alamat?: { kota?: string } };

const p: Profil = { nama: "Sari" };

// Nullish coalescing: pakai nilai kanan
// hanya bila kiri null/undefined
const kota = p.alamat?.kota ?? "Belum diisi";
console.log(kota);   // "Belum diisi"

// Optional chaining: akses properti dengan aman
console.log(p.alamat?.kota);   // undefined, bukan error

// Bandingkan: || juga bekerja, tetapi
// menganggap "" dan 0 sebagai "kosong"
console.log(0 || 10);    // 10  (0 dianggap salah)
console.log(0 ?? 10);    // 0   (0 bukan null/undefined)`,
      explain: [
        '<code>?.</code> mengakses properti <b>tanpa takut error</b> bila ada langkah yang null/undefined.',
        '<code>??</code> memberikan <b>nilai cadangan</b> hanya untuk null/undefined — berbeda dengan <code>||</code> yang ikut menangkap 0 dan string kosong.',
        'Kombinasi <code>?... ?? ...</code> adalah idiom paling umum untuk data opsional.'
      ]
    },
    {
      type: 'warn',
      title: 'TypeScript memeriksa operator',
      text: 'Kode berikut ditolak saat kompilasi: <code>"teks" * 2</code> (perkalian string), <code>true + 1</code> (penjumlahan boolean), <code>"a" &amp;&amp; "b"</code> pun diperbolehkan tetapi sering tidak bermakna. Jika sering muncul error operator, periksa kembali tipe variabelnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Aritmatika', 'Operator +, -, *, /, % (sisa bagi), ** (pangkat).'],
        ['Perbandingan', 'Operator >, <, >=, <=, ===, !==.'],
        ['Logika', '&& (dan), || (atau), ! (bukan).'],
        ['Ternary', 'kondisi ? nilaiA : nilaiB.'],
        ['??', 'Nullish coalescing — nilai cadangan untuk null/undefined.'],
        ['?.', 'Optional chaining — akses aman properti bersarang.'],
        ['Nullish', 'Istilah untuk nilai null atau undefined.']
      ]
    }
  ],
  recap: [
    'Operator TypeScript sama dengan JavaScript, tetapi dicheck tipenya.',
    '=== memeriksa nilai dan tipe; !== kebalikannya.',
    '?? hanya mengganti null/undefined; || juga mengganti 0 dan "".',
    '?. mengakses properti bersarang tanpa error.',
    'Kombinasi ?. dan ?? adalah idiom untuk data opsional.'
  ]
});

/* ---------- Pelajaran 15: Control Flow ---------- */
window.TS_LESSONS.push({
  id: 'control-flow-typescript',
  title: 'Control Flow (Percabangan)',
  chapter: 'Alur Kendali',
  duration: '10 menit',
  intro: [
    '<b>Control flow</b> mengatur urutan eksekusi: kode mana yang jalan, kapan, dan berapa kali.',
    'Di TypeScript, percabangan punya bonus: <b>narrowing tipe otomatis</b> di tiap cabang.'
  ],
  objectives: [
    'Menulis if / else if / else',
    'Menulis switch dengan break',
    'Memakai ternary untuk cabang singkat',
    'Memahami narrowing saat percabangan'
  ],
  sections: [
    {
      type: 'example',
      title: 'if / else if / else',
      lang: 'typescript',
      output: false,
      code: `function kategoriUsia(usia: number): string {
  if (usia < 0) {
    return "usia tidak valid";
  } else if (usia < 13) {
    return "anak-anak";
  } else if (usia < 18) {
    return "remaja";
  } else {
    return "dewasa";
  }
}

console.log(kategoriUsia(8));    // anak-anak
console.log(kategoriUsia(16));   // remaja
console.log(kategoriUsia(30));   // dewasa`,
      explain: [
        'Cabang dievaluasi <b>dari atas</b>; begitu satu kondisi benar, sisanya dilewati.',
        'Parameter <code>usia: number</code> menjamin perbandingan dengan angka sah — bandingkan dengan JavaScript yang menerima apa pun.',
        'Setiap <code>return</code> mengakhiri fungsi, jadi blok lain tidak perlu dieksekusi.'
      ]
    },
    {
      type: 'example',
      title: 'switch',
      lang: 'typescript',
      output: false,
      code: `function hari(id: number): string {
  switch (id) {
    case 1: return "Senin";
    case 2: return "Selasa";
    case 3: return "Rabu";
    case 4: return "Kamis";
    case 5: return "Jumat";
    default: return "Akhir pekan";
  }
}

console.log(hari(1));   // Senin
console.log(hari(6));   // Akhir pekan`,
      explain: [
        '<code>switch</code> membandingkan nilai dengan setiap <code>case</code>.',
        'Dalam contoh ini tiap case <b>return</b> langsung sehingga <code>break</code> tidak diperlukan.',
        'Ingat: tanpa return/break, eksekusi akan "merembes" ke case berikutnya (fall-through).'
      ]
    },
    {
      type: 'example',
      title: 'Narrowing: hadiah TypeScript',
      lang: 'typescript',
      output: false,
      code: `function panjang(x: string | number): number {
  if (typeof x === "string") {
    return x.length;      // ✓ x menyempit jadi string
  }
  return Math.abs(x);     // ✓ dan di sini x adalah number
}

console.log(panjang("TypeScript"));  // 10
console.log(panjang(-25));           // 25`,
      explain: [
        'Di dalam <code>if</code>, TypeScript <b>menyempitkan</b> <code>x</code> menjadi <code>string</code> — akses <code>.length</code> sah.',
        'Setelah if, sisa kemungkinan hanya <code>number</code> — <code>Math.abs(x)</code> sah.',
        'Di JavaScript murni, <code>x.length</code> pada angka baru error saat jalan.'
      ]
    },
    {
      type: 'tip',
      title: 'Ternary untuk cabang pendek',
      text: 'Bila cabang hanya berupa <b>satu ekspresi</b>, ternary lebih ringkas: <code>const label = aktif ? "Aktif" : "Nonaktif";</code>. Untuk logika panjang, tetap pakai if — keterbacaan lebih penting.'
    },
    {
      type: 'warn',
      title: 'Waspadai fall-through',
      text: 'Lupa <code>break</code> atau <code>return</code> di <code>case</code> membuat eksekusi berlanjut ke case berikutnya. TypeScript tidak mengubah perilaku ini — tetap aturan JavaScript. Tanda tangan fungsi yang ketat justru membantu: setiap <code>case</code> sebaiknya mengembalikan nilai.'
    },
    {
      type: 'vocab',
      items: [
        ['Control flow', 'Urutan eksekusi pernyataan dalam program.'],
        ['Percabangan', 'Memilih salah satu jalur berdasarkan kondisi.'],
        ['switch', 'Pernyataan pembanding dengan beberapa case.'],
        ['fall-through', 'Eksekusi lanjut ke case berikutnya karena tanpa break.'],
        ['default', 'Case yang jalan bila tak ada case cocok.'],
        ['Narrowing', 'Penyempitan tipe otomatis di cabang.']
      ]
    }
  ],
  recap: [
    'if/else if/else memilih satu jalur dari beberapa kondisi.',
    'switch membandingkan nilai dengan case; jangan lupa return/break.',
    'TypeScript menyempitkan tipe di tiap cabang (narrowing).',
    'Ternary cocok untuk cabang satu ekspresi.',
    'Fall-through masih berlaku: kembalikan nilai di tiap case.'
  ]
});

/* ---------- Pelajaran 16: Perulangan ---------- */
window.TS_LESSONS.push({
  id: 'perulangan-typescript',
  title: 'Perulangan',
  chapter: 'Alur Kendali',
  duration: '10 menit',
  intro: [
    'Perulangan mengulang blok kode. TypeScript mendukung semua perulangan JavaScript, dengan bonus <b>pengetikan elemen</b> yang otomatis.',
    'Pelajaran ini membahas for, for...of, for...in, while, dan do...while.'
  ],
  objectives: [
    'Menulis for biasa dan for...of',
    'Membedakan for...of dan for...in',
    'Menulis while dan do...while',
    'Memakai break dan continue'
  ],
  sections: [
    {
      type: 'example',
      title: 'for biasa dan for...of',
      lang: 'typescript',
      output: false,
      code: `const angka: number[] = [10, 20, 30];

// for biasa — kontrol penuh
for (let i = 0; i < angka.length; i++) {
  console.log("indeks " + i + " = " + angka[i]);
}

// for...of — iterasi nilai (paling umum)
for (const n of angka) {
  console.log("nilai " + n);
}

// for...of pada teks
for (const huruf of "TS") {
  console.log(huruf);   // "T" lalu "S"
}`,
      explain: [
        '<code>for</code> klasik: inisialisasi, kondisi, langkah — cocok saat butuh <b>indeks</b>.',
        '<code>for...of</code> mengunjungi <b>setiap nilai</b> langsung — cara paling disarankan untuk array.',
        'Elemen array <code>number[]</code> otomatis bertipe <code>number</code> — <code>n</code> tidak mungkin teks.'
      ]
    },
    {
      type: 'warn',
      title: 'for...in ≠ for...of',
      text: '<code>for...in</code> mengiterasi <b>kunci/nama properti</b> (hasilnya string), sedangkan <code>for...of</code> mengiterasi <b>nilai</b>. Untuk array, hampir selalu pakai <code>for...of</code>. <code>for...in</code> lebih cocok untuk objek biasa.'
    },
    {
      type: 'example',
      title: 'while dan do...while',
      lang: 'typescript',
      output: false,
      code: `// while — periksa dulu, baru jalan
let c: number = 3;
while (c > 0) {
  console.log("c = " + c);
  c = c - 1;
}

// do...while — jalan sekali, baru periksa
let tebakan: number = 0;
do {
  tebakan = Math.floor(Math.random() * 6) + 1;
  console.log("tebakan: " + tebakan);
} while (tebakan !== 6);

console.log("Berhasil menebak 6!");`,
      explain: [
        '<code>while</code> memeriksa kondisi <b>sebelum</b> tiap iterasi; bisa jadi nol kali jalan.',
        '<code>do...while</code> menjalankan blok <b>minimal sekali</b> baru memeriksa kondisi.',
        'Pastikan ada kode yang mengubah variabel kondisi, atau perulangan tak berujung (dengan <code>never</code> sebagai tipe hasilnya).'
      ]
    },
    {
      type: 'example',
      title: 'break dan continue',
      lang: 'typescript',
      output: false,
      code: `const data: number[] = [1, 2, 3, 4, 5, 6];

// continue: lewati iterasi ini
for (const n of data) {
  if (n % 2 === 0) continue;    // lewati genap
  console.log("ganjil: " + n);  // 1, 3, 5
}

// break: hentikan perulangan
for (const n of data) {
  if (n === 4) break;           // berhenti di 4
  console.log("sebelum 4: " + n);   // 1, 2, 3
}`,
      explain: [
        '<code>continue</code> melompat ke iterasi berikutnya.',
        '<code>break</code> menghentikan perulangan seketika.',
        'Kedua kata kunci bekerja sama di semua jenis perulangan.'
      ]
    },
    {
      type: 'tip',
      title: 'Cara modern: forEach dan map',
      text: 'Untuk array, sering lebih rapi memakai <code>arr.forEach(x => ...)</code>, <code>arr.map(x => x * 2)</code>, atau <code>arr.filter(x => x > 0)</code>. Metode ini tidak bisa di-break, tetapi ekspresif dan bebas efek samping. Perulangan klasik tetap pilihan untuk alur rumit.'
    },
    {
      type: 'vocab',
      items: [
        ['for', 'Perulangan dengan inisialisasi, kondisi, dan langkah.'],
        ['for...of', 'Mengiterasi nilai dari array/string/iterable.'],
        ['for...in', 'Mengiterasi nama properti (kunci) objek.'],
        ['while', 'Perulangan dengan pengecekan awal.'],
        ['do...while', 'Perulangan dengan pengecekan akhir.'],
        ['break', 'Menghentikan perulangan seketika.'],
        ['continue', 'Melompat ke iterasi berikutnya.'],
        ['forEach/map/filter', 'Metode array untuk iterasi bergaya fungsional.']
      ]
    }
  ],
  recap: [
    'for klasik memberi kontrol penuh; for...of mengiterasi nilai.',
    'for...of untuk nilai, for...in untuk kunci.',
    'while memeriksa dulu; do...while jalan minimal sekali.',
    'break menghentikan; continue melompat ke iterasi berikutnya.',
    'Untuk array, forEach/map/filter sering lebih ekspresif.'
  ]
});
