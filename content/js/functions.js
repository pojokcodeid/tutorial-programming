/* ============================================================
   Pelajaran JavaScript — Bab 6: Function
   (topik info.md: "function di javascript")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

window.JS_LESSONS.push({
  id: 'function-javascript',
  title: 'Function di JavaScript',
  chapter: 'Fungsi',
  duration: '13 menit',
  intro: [
    '<b>Fungsi</b> adalah blok kode bernama yang bisa <b>dipanggil berulang</b> — tulis sekali, pakai berkali-kali. Fungsi juga bisa <b>menerima input</b> (parameter) dan <b>mengembalikan hasil</b> (return).',
    'Fungsi adalah batu bata penyusun program: setiap fitur aplikasi pada dasarnya kumpulan fungsi.'
  ],
  objectives: [
    'Membuat dan memanggil fungsi',
    'Memakai parameter dan return',
    'Memahami parameter default dan rest',
    'Membedakan fungsi deklarasi, ekspresi, dan arrow function'
  ],
  sections: [
    {
      type: 'example',
      title: 'Fungsi pertama',
      lang: 'javascript',
      output: false,
      code: `// cara 1: deklarasi fungsi
function sapa(nama) {
  return "Halo, " + nama + "!";
}

sapa("Andi");   // "Halo, Andi!"
sapa("Sari");   // "Halo, Sari!"

// cara 2: tanpa return (hanya melakukan aksi)
function tampilkan(teks) {
  console.log(teks);
}`,
      explain: [
        '<code>function nama(parameter) { ... }</code> membuat fungsi.',
        '<b>Parameter</b> adalah "lubang input" — terisi saat fungsi dipanggil.',
        '<code>return</code> mengirim <b>nilai keluar</b> dan <b>mengakhiri</b> fungsi.',
        'Tanpa return, fungsi mengembalikan <code>undefined</code>.'
      ]
    },
    {
      type: 'example',
      title: 'return dan parameter ganda',
      lang: 'javascript',
      output: false,
      code: `function hitungTotal(harga, jumlah) {
  return harga * jumlah;
}

const bayar = hitungTotal(12000, 3);
console.log(bayar);   // 36000

// default parameter — dipakai bila argumen kosong
function sapa(nama = "Teman") {
  return "Halo, " + nama;
}

sapa();          // "Halo, Teman"
sapa("Andi");    // "Halo, Andi"`,
      explain: [
        'Nilai <code>return</code> bisa langsung disimpan ke variabel atau dipakai dalam ekspresi.',
        'Fungsi boleh punya <b>banyak parameter</b>, dipisah koma.',
        '<b>Default parameter</b> (<code>nama = "Teman"</code>) membuat argumen opsional.',
        'Kode setelah <code>return</code> tidak pernah dijalankan.'
      ]
    },
    {
      type: 'example',
      title: 'Arrow function',
      lang: 'javascript',
      output: false,
      code: `// fungsi biasa
function kuadrat(x) {
  return x * x;
}

// arrow function — sama, lebih ringkas
const kuadrat2 = (x) => {
  return x * x;
};

// satu baris: return otomatis
const kuadrat3 = x => x * x;

kuadrat3(5);   // 25`,
      explain: [
        '<b>Arrow function</b> <code>(x) => ...</code> adalah sintaks ringkas sejak ES6.',
        'Satu parameter boleh tanpa kurung: <code>x => x * x</code>.',
        'Satu ekspresi tanpa kurung kurawal: nilainya <b>otomatis dikembalikan</b>.',
        'Arrow function sangat lazim di metode array: <code>angka.map(x => x * 2)</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Rest parameter',
      lang: 'javascript',
      output: false,
      code: `function jumlahkan(...angka) {
  let total = 0;
  for (const a of angka) {
    total += a;
  }
  return total;
}

jumlahkan(1, 2);       // 3
jumlahkan(1, 2, 3, 4); // 10

// fungsi sebagai nilai
const operasi = {
  kali: (a, b) => a * b
};
operasi.kali(3, 4);    // 12`,
      explain: [
        '<code>...</code> (rest) mengumpulkan <b>semua sisa argumen</b> menjadi array.',
        'Fungsi bisa disimpan di variabel dan di properti objek — karena fungsi juga <b>nilai</b>.',
        'Pola ini memungkinkan fungsi dipanggil sebagai <b>callback</b> (dibahas di pelajaran Promises).'
      ]
    },
    {
      type: 'example',
      title: 'Fungsi dalam praktik',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Konverter Suhu</title>
</head>
<body>
  <h2>Konverter Celcius → Fahrenheit</h2>
  <p id="out">Coba angka lain di kode!</p>

  <script>
    function celciusKeFahrenheit(c) {
      return c * 9 / 5 + 32;
    }

    const suhu = 30;
    document.getElementById("out").textContent =
      suhu + "°C = " + celciusKeFahrenheit(suhu) + "°F";
  <\/script>
</body>
</html>`,
      explain: [
        'Logika perhitungan terkandung dalam fungsi — bisa dipakai ulang berkali-kali.',
        'Mengubah rumus cukup di satu tempat.',
        'Membagi program jadi fungsi-fungsi kecil membuatnya mudah diuji dan dibaca.'
      ]
    },
    {
      type: 'tip',
      title: 'Scope: tempat variabel hidup',
      text: 'Variabel yang dibuat <b>di dalam fungsi</b> hanya hidup di sana (<i>local scope</i>). Variabel di luar bisa dibaca dari dalam, tetapi sebaliknya tidak. Variabel <code>let</code>/<code>const</code> juga terbatas pada blok <code>{ }</code> tempat mereka dibuat.'
    },
    {
      type: 'warn',
      title: 'return vs console.log',
      text: '<code>console.log</code> hanya <b>menampilkan</b> — nilainya hilang. <code>return</code> <b>mengirim nilai</b> keluar agar bisa dipakai. Kebiasaan buruk: menulis <code>return console.log(x)</code> — yang dikembalikan adalah <code>undefined</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Fungsi', 'Blok kode bernama yang bisa dipanggil berulang kali.'],
        ['Parameter', 'Nama input di definisi fungsi.'],
        ['Argumen', 'Nilai aktual yang dikirim saat fungsi dipanggil.'],
        ['return', 'Mengirim nilai keluar dari fungsi dan mengakhirinya.'],
        ['Arrow function', 'Sintaks ringkas (x) => ... untuk fungsi.'],
        ['Rest parameter', '...nama mengumpulkan sisa argumen jadi array.'],
        ['Default parameter', 'Nilai awal parameter bila argumen tidak diberikan.'],
        ['Scope', 'Wilayah tempat variabel dapat diakses.'],
        ['Callback', 'Fungsi yang dikirim sebagai argumen untuk dijalankan nanti.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: fungsi diskon',
      lang: 'html',
      hint: 'Buat fungsi hitungDiskon(harga, persen) yang mengembalikan harga setelah diskon, lalu tampilkan hasilnya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Diskon</title>
</head>
<body>
  <h2>Kalkulator Diskon</h2>
  <p id="out">Isi fungsinya di kode!</p>

  <script>
    // Tulis fungsi di sini:
    function hitungDiskon(harga, persen) {
      return harga - (harga * persen / 100);
    }

    const hargaAsli = 150000;
    const diskon = 20;

    document.getElementById("out").textContent =
      "Harga setelah diskon " + diskon + "%: Rp " +
      hitungDiskon(hargaAsli, diskon);
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Fungsi: tulis sekali, pakai berkali-kali.',
    'Parameter adalah input; return mengirim nilai keluar.',
    'Default parameter membuat argumen opsional.',
    'Arrow function: sintaks ringkas, lazim di metode array.',
    'Rest parameter (...) mengumpulkan sisa argumen jadi array.',
    'Variabel dalam fungsi bersifat lokal (scope).',
  ]
});
