/* ============================================================
   Pelajaran JavaScript — Bab 3: Operator
   (topik info.md: "operator")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

window.JS_LESSONS.push({
  id: 'operator-javascript',
  title: 'Operator di JavaScript',
  chapter: 'Operator',
  duration: '12 menit',
  intro: [
    '<b>Operator</b> adalah simbol yang melakukan aksi terhadap nilai: menjumlahkan, membandingkan, menggabungkan, atau membalik. Semua program — dari kalkulator sampai game — dibangun dari operator.',
    'Pelajaran ini membahas enam kelompok operator yang dipakai sehari-hari.'
  ],
  objectives: [
    'Memakai operator aritmatika dan penugasan',
    'Membedakan perbandingan == dan ===',
    'Menggabungkan kondisi dengan &&, ||, dan !',
    'Memakai operator ternary secara ringkas'
  ],
  sections: [
    {
      type: 'example',
      title: 'Operator aritmatika & penugasan',
      lang: 'javascript',
      output: false,
      code: `let a = 10, b = 3;

a + b;   // 13    → penjumlahan
a - b;   // 7     → pengurangan
a * b;   // 30    → perkalian
a / b;   // 3.333 → pembagian
a % b;   // 1     → sisa bagi (modulus)
a ** b;  // 1000  → pangkat

let total = 0;
total += 5;   // sama dengan: total = total + 5
total++;      // sama dengan: total = total + 1`,
      explain: [
        '<code>%</code> (modulus) memberi <b>sisa bagi</b>: <code>7 % 2</code> = 1 — sering dipakai cek bilangan genap.',
        '<code>**</code> adalah pangkat: <code>2 ** 10</code> = 1024.',
        '<code>+=</code>, <code>-=</code>, <code>*=</code> mempersingkat penugasan.',
        '<code>++</code> dan <code>--</code> menambah/mengurangi satu.'
      ]
    },
    {
      type: 'example',
      title: 'Penggabungan string',
      lang: 'javascript',
      output: false,
      code: `let nama = "Andi";
let kota = "Bandung";

nama + " dari " + kota;   // "Andi dari Bandung"
nama += "!";               // nama jadi "Andi!"

// Template literal — lebih rapi
let sapa = \`Halo \${nama}, kamu dari \${kota}.\`;`,
      explain: [
        '<code>+</code> menggabungkan string seperti menyambung tali.',
        '<b>Template literal</b> (backtick <code>...</code>) menyisipkan variabel dengan <code>${...}</code> — lebih mudah dibaca daripada banyak tanda <code>+</code>.',
        '<code>+=</code> juga berlaku untuk string: menambah di akhir.'
      ]
    },
    {
      type: 'example',
      title: 'Perbandingan & logika',
      lang: 'javascript',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Perbandingan</title>
</head>
<body>
  <ul id="daftar"></ul>
  <script>
    let umur = 17;
    let punyaKtp = false;

    const uji = [
      umur > 18,            // false
      umur >= 17,           // true
      umur === 17,          // true (nilai DAN tipe sama)
      "5" == 5,             // true (tipe diubah dulu)
      "5" === 5,            // false (tipe beda)
      umur > 15 && punyaKtp, // false — keduanya harus true
      umur > 15 || punyaKtp, // true — salah satu cukup
      !punyaKtp              // true — dibalik
    ];

    document.getElementById("daftar").innerHTML =
      uji.map(x => "<li>" + x + "</li>").join("");
  <\/script>
</body>
</html>`,
      explain: [
        '<code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code> membandingkan angka.',
        '<code>==</code> membandingkan <b>setelah mengubah tipe</b>; <code>===</code> menuntut <b>tipe sama</b> — lebih aman dan disarankan.',
        '<code>&amp;&amp;</code> (DAN) benar bila <b>keduanya</b> benar; <code>||</code> (ATAU) benar bila <b>salah satu</b> benar.',
        '<code>!</code> (NOT) membalik nilai boolean.'
      ]
    },
    {
      type: 'warn',
      title: 'Bahaya == (longgar)',
      text: '<code>"" == 0</code> bernilai <code>true</code>, dan <code>null == undefined</code> juga <code>true</code> — hasil yang sering mengejutkan. Kecuali ada alasan khusus, pakai <code>===</code> dan <code>!==</code> saja. Aturan sederhana: <b>selalu ketat</b>.'
    },
    {
      type: 'example',
      title: 'Operator ternary',
      lang: 'javascript',
      output: false,
      code: `let umur = 20;

// if-else panjang:
let status;
if (umur >= 18) {
  status = "dewasa";
} else {
  status = "anak-anak";
}

// ternary — satu baris:
let status2 = umur >= 18 ? "dewasa" : "anak-anak";`,
      explain: [
        'Bentuk: <code>kondisi ? nilaiJikaBenar : nilaiJikaSalah</code>.',
        'Ternary cocok untuk keputusan <b>sangat sederhana</b> — bila terlalu panjang, pakai if-else biasa.',
        'Bisa dirangkai, tapi jangan lebih dari dua tingkat agar tetap terbaca.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan operator string jadi jebakan?',
      text: 'Input dari <code>prompt()</code> selalu string, jadi <code>prompt("Angka?") + 1</code> menghasilkan <em>penggabungan</em>, bukan penjumlahan. Solusinya: konversi dulu dengan <code>Number()</code> sebelum dihitung.'
    },
    {
      type: 'vocab',
      items: [
        ['Operator', 'Simbol yang melakukan aksi pada nilai, mis. +, -, ===.'],
        ['Modulus (%)', 'Sisa hasil bagi: 7 % 2 = 1.'],
        ['Penugasan (=, +=)', 'Memberi nilai, atau menambah lalu memberi.'],
        ['Strict equality (===)', 'Perbandingan yang menuntut nilai dan tipe sama.'],
        ['Ternary', 'Operator ?: untuk keputusan ringkas dalam satu baris.'],
        ['Coercion', 'Konversi tipe otomatis yang dilakukan JS saat beroperasi.'],
        ['NaN', 'Hasil perhitungan yang bukan angka ("Not a Number").']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: kalkulator kecil',
      lang: 'html',
      hint: 'Jalankan, lalu ubah nilai a dan b atau operatornya. Coba hitung keliling dan luas persegi panjang!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kalkulator</title>
</head>
<body>
  <h2>Kalkulator Mini</h2>
  <p id="out">Hitung di sini...</p>

  <script>
    const a = 12;
    const b = 5;

    const jumlah  = a + b;
    const sisa    = a % b;      // sisa bagi 12 : 5
    const pangkat = a ** 2;     // 12 kuadrat
    const genap   = a % 2 === 0; // true kalau genap

    document.getElementById("out").textContent =
      jumlah + " | " + sisa + " | " + pangkat + " | genap? " + genap;
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Operator aritmatika: +, -, *, /, % (sisa bagi), ** (pangkat).',
    'Penugasan: =, +=, -=, ++, --.',
    'Perbandingan: <, >, <=, >=, ==, ===, !=, !== — gunakan ===.',
    'Logika: && (DAN), || (ATAU), ! (NOT).',
    'Ternary: kondisi ? benar : salah — ringkas untuk keputusan sederhana.',
    'String digabung dengan +; waspadai konversi otomatis.'
  ]
});
