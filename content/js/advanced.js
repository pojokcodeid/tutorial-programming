/* ============================================================
   Pelajaran JavaScript — Bab 8: Topik Lanjutan
   (topik info.md: "promises dan async await",
    "javascript modules", "javascript error handling",
    "javascript es6")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran 14: Promises dan Async Await ---------- */
window.JS_LESSONS.push({
  id: 'promises-dan-async-await',
  title: 'Promises dan Async Await',
  chapter: 'Topik Lanjutan',
  duration: '14 menit',
  intro: [
    'Beberapa pekerjaan butuh <b>waktu</b>: memuat data dari server, membaca berkas, menunggu penekanan tombol. JavaScript tidak <b>menunggu diam</b> — ia tetap jalan dan memberi tahu kamu nanti. Ini disebut <b>asinkron</b>.',
    '<b>Promise</b> adalah janji "hasilnya nanti ada"; <b>async/await</b> adalah cara menulis kode asinkron yang <b>terlihat seperti biasa</b>.'
  ],
  objectives: [
    'Memahami perbedaan sinkron dan asinkron',
    'Memakai Promise dengan then/catch/finally',
    'Menulis async/await',
    'Menangani kegagalan dengan catch dan try/catch'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Kode <b>sinkron</b> jalan berurutan, baris demi baris. Kode <b>asinkron</b> memulai pekerjaan, lalu <b>melanjutkan</b> — hasilnya diambil lewat <b>callback</b>, <b>Promise</b>, atau <b>async/await</b>.</p><p>Bayangkan memesan kopi: kamu tidak berdiri membekukan kasir; kamu lanjut membalas pesan, lalu <b>diberi tahu</b> kopimu siap. Itulah model asinkron.</p>'
    },
    {
      type: 'example',
      title: 'Promise pertama',
      lang: 'javascript',
      output: false,
      code: `function ambilData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const berhasil = true;
      if (berhasil) {
        resolve("Data berhasil dimuat!");
      } else {
        reject("Gagal memuat data.");
      }
    }, 1000);   // tunda 1 detik
  });
}

// konsumsi dengan then/catch
ambilData()
  .then(hasil => console.log(hasil))
  .catch(gagal => console.error(gagal));`,
      explain: [
        '<code>new Promise((resolve, reject) => ...)</code> membuat janji.',
        '<code>resolve(nilai)</code> dipanggil saat <b>berhasil</b>; <code>reject(alasan)</code> saat <b>gagal</b>.',
        '<code>then()</code> jalan setelah resolve; <code>catch()</code> jalan setelah reject.',
        '<code>setTimeout</code> meniru jeda waktu (di sini 1000 ms = 1 detik).'
      ]
    },
    {
      type: 'example',
      title: 'then, catch, finally',
      lang: 'javascript',
      output: false,
      code: `ambilData()
  .then(hasil => {
    console.log("Langkah 1:", hasil);
    return hasil.toUpperCase();   // teruskan ke then berikutnya
  })
  .then(teks => console.log("Langkah 2:", teks))
  .catch(err => console.error("Ada masalah:", err))
  .finally(() => console.log("Selesai, apa pun hasilnya."));`,
      explain: [
        '<code>then</code> bisa <b>dirangkai</b>: nilai yang dikembalikan mengalir ke then berikutnya.',
        '<code>catch</code> menangkap kegagalan dari <b>rangkaian di atasnya</b>.',
        '<code>finally</code> selalu jalan — cocok untuk menutup loading.',
        'Urutan: <code>then → then → catch → finally</code>.'
      ]
    },
    {
      type: 'example',
      title: 'async/await — lebih mudah dibaca',
      lang: 'javascript',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Async Await</title>
</head>
<body>
  <p id="log">Menunggu...</p>

  <script>
    function lambat(teks) {
      return new Promise(res =>
        setTimeout(() => res(teks), 800)
      );
    }

    async function jalankan() {
      const a = await lambat("Langkah satu");
      const b = await lambat("Langkah dua");
      return a + " lalu " + b;
    }

    jalankan().then(hasil => {
      document.getElementById("log").textContent = hasil;
    });
  <\/script>
</body>
</html>`,
      explain: [
        '<code>async</code> di depan fungsi menandakan ia <b>mengandung await</b> dan selalu mengembalikan <b>Promise</b>.',
        '<code>await</code> <b>menunggu</b> Promise selesai, tanpa membekukan halaman.',
        'Kode asinkron kini terbaca <b>dari atas ke bawah</b> seperti biasa.',
        'Kesalahan di async bisa ditangkap dengan <code>try/catch</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Async dengan penanganan error',
      lang: 'javascript',
      output: false,
      code: `async function proses() {
  try {
    const data = await ambilData();
    console.log(data);
  } catch (err) {
    console.error("Gagal:", err);   // jalan bila ada reject
  } finally {
    console.log("Selesai mencoba.");
  }
}`,
      explain: [
        '<code>try/catch/finally</code> bekerja sama seperti pada kode sinkron.',
        'Bila <code>await</code> mendapat <b>rejected</b> Promise, ia melempar error yang ditangkap <code>catch</code>.',
        'Ini cara paling disarankan menulis kode asinkron modern.'
      ]
    },
    {
      type: 'warn',
      title: 'Lupa await adalah bug umum',
      text: 'Memanggil <code>jalankan()</code> tanpa <code>await</code> mengembalikan <b>Promise</b>, bukan hasilnya — jadi <code>const x = jalankan()</code> membuat <code>x</code> berisi objek Promise. Ingat: setiap pemanggilan fungsi async perlu await (atau .then()).'
    },
    {
      type: 'vocab',
      items: [
        ['Asinkron', 'Eksekusi yang tidak menunggu hasil; melanjutkan lalu diberi tahu.'],
        ['Promise', 'Objek yang mewakili hasil yang akan tersedia nanti.'],
        ['resolve', 'Memenuhi promise dengan nilai (berhasil).'],
        ['reject', 'Membatalkan promise dengan alasan (gagal).'],
        ['then/catch/finally', 'Metode untuk menangani hasil, kegagalan, dan akhir.'],
        ['async', 'Kata kunci yang membuat fungsi mengembalikan Promise.'],
        ['await', 'Menunggu Promise selesai di dalam fungsi async.'],
        ['setTimeout()', 'Menjalankan fungsi setelah jeda waktu (ms).'],
        ['fetch()', 'Fungsi browser untuk meminta data dari server (mengembalikan Promise).']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: urutan dengan jeda',
      lang: 'html',
      hint: 'Jalankan dan perhatikan pesan muncul bergantian dengan jeda. Tambahkan satu langkah lagi dengan await!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Jeda</title>
</head>
<body>
  <p id="log">...</p>

  <script>
    const log = document.getElementById("log");

    function jeda(ms) {
      return new Promise(res => setTimeout(res, ms));
    }

    async function main() {
      log.textContent = "Mulai...";
      await jeda(600);
      log.textContent = "Setengah jalan...";
      await jeda(600);
      log.textContent = "Selesai!";
    }

    main();
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Kode asinkron tidak menunggu — hasilnya diambil nanti.',
    'Promise punya tiga wujud: pending, fulfilled (resolve), rejected.',
    'then menangani hasil, catch menangani kegagalan, finally selalu jalan.',
    'async/await membuat kode asinkron terbaca seperti sinkron.',
    'Gunakan try/catch di sekitar await untuk menangani error.',
    'Jangan lupa await saat memanggil fungsi async.',
  ]
});

/* ---------- Pelajaran 15: JavaScript Modules ---------- */
window.JS_LESSONS.push({
  id: 'javascript-modules',
  title: 'JavaScript Modules',
  chapter: 'Topik Lanjutan',
  duration: '10 menit',
  intro: [
    'Proyek besar tidak mungkin muat dalam satu berkas. <b>Modul</b> membagi kode ke <b>berkas-berkas kecil</b> yang saling berbagi: satu berkas <b>mengekspor</b> fungsi, berkas lain <b>mengimpor</b>-nya.',
    'Modul ES6 adalah standar modern JavaScript — di browser maupun Node.js.'
  ],
  objectives: [
    'Memahami manfaat modul',
    'Membuat export bernama dan export default',
    'Mengimpor modul dengan import',
    'Memakai type="module" di HTML'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tanpa modul, semua kode berada di <b>ruang nama global</b> — rawan tabrakan nama dan sulit dipelihara. Modul membungkus kode dalam <b>ruang sendiri</b>: hanya apa yang diekspor yang bisa dipakai luar.</p><p>Manfaat utama:</p><ul><li><b>Organisasi</b> — tiap berkas punya satu tanggung jawab</li><li><b>Dipakai ulang</b> — modul utilitas dipakai banyak proyek</li><li><b>Tidak bentrok</b> — nama variabel terlindungi</li><li><b>Mudah diuji</b> — modul bisa diuji sendiri</li></ul>'
    },
    {
      type: 'example',
      title: 'Export — berbagi dari modul',
      lang: 'javascript',
      output: false,
      code: `// berkas: util.js

// export bernama (boleh lebih dari satu)
export function tambah(a, b) {
  return a + b;
}

export const PI = 3.14159;

// export default (satu per berkas)
export default function sapa(nama) {
  return "Halo, " + nama;
}`,
      explain: [
        '<code>export</code> menandai fungsi/const yang <b>boleh dipakai</b> berkas lain.',
        '<b>Named export</b> boleh beberapa per berkas, nama eksplisit.',
        '<b>Default export</b> hanya satu per berkas — nama bebas saat mengimpor.',
        'Tanpa export, isi berkas <b>tidak terlihat</b> dari luar.'
      ]
    },
    {
      type: 'example',
      title: 'Import — memakai modul',
      lang: 'javascript',
      output: false,
      code: `// berkas: main.js

// impor bernama — nama harus sama
import { tambah, PI } from "./util.js";

// impor default — nama bebas
import sapa from "./util.js";

// impor semua sebagai satu objek
import * as Util from "./util.js";

tambah(2, 3);        // 5
sapa("Andi");         // "Halo, Andi"
Util.PI;             // 3.14159`,
      explain: [
        '<code>import { ... } from "..."</code> mengambil <b>named export</b>.',
        'Default export diimpor <b>tanpa kurung kurawal</b>.',
        '<code>import * as</code> mengumpulkan semuanya jadi satu objek.',
        'Alamat berkas relatif: <code>./util.js</code> berarti satu folder.'
      ]
    },
    {
      type: 'example',
      title: 'Modul di HTML',
      lang: 'html',
      output: false,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Modul</title>
</head>
<body>
  <p id="out"></p>

  <!-- type="module" mengaktifkan import/export -->
  <script type="module">
    import { tambah } from "./util.js";

    document.getElementById("out").textContent =
      "2 + 3 = " + tambah(2, 3);
  <\/script>
</body>
</html>`,
      explain: [
        'Modul diaktifkan dengan <code>&lt;script type="module"&gt;</code>.',
        'Modul otomatis berjalan <b>setelah HTML siap</b> (seperti defer).',
        'Variabel di modul bersifat <b>lokal</b>, bukan global.',
        'Untuk latihan offline, buat berkas <code>util.js</code> berisi export-nya di folder yang sama.'
      ]
    },
    {
      type: 'warn',
      title: 'Modul butuh server (atau server lokal)',
      text: 'Browser melarang modul <b>diakses lewat file://</b> karena aturan keamanan (CORS). Saat membuka halaman langsung dari folder, impor modul akan gagal. Solusinya: jalankan aplikasi lewat server lokal (<code>node server.js</code> atau Live Server di editor).'
    },
    {
      type: 'vocab',
      items: [
        ['Modul', 'Berkas JS mandiri yang bisa mengekspor dan mengimpor.'],
        ['export', 'Menandai nilai/fungsi yang boleh dipakai modul lain.'],
        ['Named export', 'Export bernama; boleh beberapa per berkas.'],
        ['Default export', 'Export utama; satu per berkas, nama bebas saat impor.'],
        ['import', 'Membawa keluaran modul ke berkas lain.'],
        ['type="module"', 'Atribut script yang mengaktifkan sintaks modul.'],
        ['CORS', 'Aturan keamanan browser tentang berkas lintas asal.'],
        ['Ruang nama', 'Wilayah nama yang mencegah tabrakan variabel.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: modul inline',
      lang: 'html',
      hint: 'Modul inline (tanpa berkas terpisah) jalan di pratinjau. Klik Jalankan — perhatikan bahwa variabel rahasia tidak terlihat dari luar.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Modul Inline</title>
</head>
<body>
  <p id="out"></p>

  <!-- Modul inline: kode terkurung, bukan global -->
  <script type="module">
    const rahasia = "nilai tersembunyi";

    export function hitung(a, b) {
      return a * b;
    }

    // hanya yang diekspor yang bisa dipakai modul lain
    document.getElementById("out").textContent =
      "7 × 8 = " + hitung(7, 8);
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Modul membagi kode ke berkas-berkas kecil yang saling berbagi.',
    'export bernama (boleh banyak) dan export default (satu per berkas).',
    'import { ... } dari "./berkas.js"; default tanpa kurung kurawal.',
    'Aktifkan modul dengan &lt;script type="module"&gt;.',
    'Modul butuh server lokal; file:// diblokir browser.',
  ]
});

/* ---------- Pelajaran 16: JavaScript Error Handling ---------- */
window.JS_LESSONS.push({
  id: 'javascript-error-handling',
  title: 'Error Handling di JavaScript',
  chapter: 'Topik Lanjutan',
  duration: '11 menit',
  intro: [
    'Kode tidak selalu berjalan mulus: input aneh, jaringan putus, variabel salah ketik. <b>Error handling</b> adalah seni <b>memprediksi</b> dan <b>menangani</b> kegagalan agar program tidak ambruk.',
    'JavaScript menyediakan <code>try / catch / finally</code> dan perintah <code>throw</code>.'
  ],
  objectives: [
    'Mengenal jenis-jenis error JavaScript',
    'Memakai try, catch, dan finally',
    'Melempar error sendiri dengan throw',
    'Membuat pesan error yang informatif'
  ],
  sections: [
    {
      type: 'example',
      title: 'Jenis-jenis error',
      lang: 'javascript',
      output: false,
      code: `// ReferenceError: variabel belum dideklarasikan
console.log(belumAda);   // ❌ ReferenceError

// TypeError: operasi pada tipe yang salah
const x = undefined;
x.nama;                  // ❌ TypeError

// SyntaxError: salah tulis saat parsing
const y = ;              // ❌ SyntaxError

// RangeError: angka di luar jangkauan
[1].length = -1;         // ❌ RangeError`,
      explain: [
        '<b>ReferenceError</b>: mengakses variabel yang belum pernah dibuat.',
        '<b>TypeError</b>: memanggil sesuatu yang bukan fungsi, atau membaca properti dari <code>undefined</code>/<code>null</code>.',
        '<b>SyntaxError</b>: kode tidak sesuai aturan bahasa — terdeteksi sebelum jalan.',
        '<b>RangeError</b>: nilai di luar jangkauan yang diizinkan.',
        'Baca jejak error (<i>stack trace</i>) di konsol — ia menunjuk baris penyebabnya.'
      ]
    },
    {
      type: 'example',
      title: 'try / catch / finally',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Try Catch</title>
</head>
<body>
  <p id="log"></p>

  <script>
    const log = document.getElementById("log");

    function cobaParse(teks) {
      try {
        const data = JSON.parse(teks);
        log.textContent = "Berhasil: " + data.nama;
      } catch (err) {
        // tangkap error, program tetap jalan
        log.textContent = "Gagal: " + err.message;
      } finally {
        console.log("Blok try selesai.");  // selalu jalan
      }
    }

    cobaParse('{"nama":"Andi"}');   // valid
    cobaParse('bukan json');          // error, tapi tertangani
  <\/script>
</body>
</html>`,
      explain: [
        '<code>try</code> berisi kode <b>yang dicurigai</b> bisa gagal.',
        '<code>catch (err)</code> menangkap error — <code>err.message</code> berisi penjelasannya.',
        '<code>finally</code> selalu jalan — cocok untuk membersihkan atau menutup loading.',
        'Tanpa try/catch, error akan <b>menghentikan</b> seluruh skrip.'
      ]
    },
    {
      type: 'example',
      title: 'throw — lempar error sendiri',
      lang: 'javascript',
      output: false,
      code: `function bagi(a, b) {
  if (typeof a !== "number" || typeof b !== "number") {
    throw new TypeError("Argumen harus angka!");
  }
  if (b === 0) {
    throw new RangeError("Tidak bisa dibagi nol.");
  }
  return a / b;
}

try {
  bagi(10, 0);
} catch (err) {
  console.error(err.name + ": " + err.message);
  // "RangeError: Tidak bisa dibagi nol."
}`,
      explain: [
        '<code>throw</code> <b>melempar</b> error — bisa berupa <code>new Error("pesan")</code> atau jenis lebih spesifik.',
        'Error dengan nama yang tepat (<code>TypeError</code>, <code>RangeError</code>) membantu menemukan penyebabnya.',
        'Pesan yang jelas menghemat waktu debugging berjam-jam.',
        'Kombinasi throw + try/catch adalah pola standar penanganan error.'
      ]
    },
    {
      type: 'tip',
      title: 'Jangan telan error',
      text: '<code>catch (err) {}</code> kosong membuat bug <b>diam-diam</b> menghilang. Minimal catat: <code>catch (err) { console.error(err); }</code>. Tangkap hanya error yang <b>bisa kamu tangani</b> — yang lain biarkan muncul.'
    },
    {
      type: 'vocab',
      items: [
        ['Error', 'Kondisi tak terduga yang mengganggu alur program.'],
        ['try/catch/finally', 'Blok untuk mencoba, menangkap, dan membersihkan.'],
        ['throw', 'Melempar error secara sengaja.'],
        ['ReferenceError', 'Variabel belum dideklarasikan.'],
        ['TypeError', 'Operasi pada tipe data yang salah.'],
        ['SyntaxError', 'Kode tidak sesuai aturan bahasa.'],
        ['RangeError', 'Nilai di luar jangkauan yang diizinkan.'],
        ['Stack trace', 'Daftar jejak pemanggilan saat error terjadi.'],
        ['err.message', 'Teks penjelasan dari error.'],
        ['Error', 'Objek dasar untuk membuat error sendiri.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: validasi aman',
      lang: 'html',
      hint: 'Kode mengubah input menjadi angka. Coba masukkan teks biasa, lalu tangani error-nya agar tampil pesan ramah.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Error Handling</title>
</head>
<body>
  <p id="log">Klik Jalankan.</p>

  <script>
    function keAngka(teks) {
      const angka = Number(teks);
      if (Number.isNaN(angka)) {
        throw new Error('"' + teks + '" bukan angka!');
      }
      return angka;
    }

    const log = document.getElementById("log");

    for (const input of ["12", "abc"]) {
      try {
        log.textContent = "Hasil: " + keAngka(input);
      } catch (err) {
        log.textContent = "Masalah: " + err.message;
      }
    }
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Empat error umum: ReferenceError, TypeError, SyntaxError, RangeError.',
    'try/catch/finally: coba, tangkap, dan selalu bersihkan.',
    'throw melempar error sendiri; new Error("pesan") membuat objek error.',
    'Jangan biarkan catch kosong — catat errornya.',
    'Baca stack trace di konsol untuk menemukan sumber masalah.',
  ]
});

/* ---------- Pelajaran 17: JavaScript ES6 ---------- */
window.JS_LESSONS.push({
  id: 'javascript-es6',
  title: 'JavaScript ES6 (Modern)',
  chapter: 'Topik Lanjutan',
  duration: '15 menit',
  intro: [
    '<b>ES6</b> (ECMAScript 2015) adalah pembaruan besar JavaScript yang mengubah cara kita menulis kode. Banyak fitur yang sudah dibahas — <code>let</code>/<code>const</code>, arrow function, template literal, kelas, modul — semuanya lahir dari ES6.',
    'Pelajaran ini merangkum fitur-fitur ES6+ yang paling sering dipakai, plus beberapa yang lebih baru.'
  ],
  objectives: [
    'Menyebutkan fitur utama ES6',
    'Memakai template literal dan destructuring',
    'Memakai spread dan rest',
    'Memahami kelas dan fitur modern lainnya'
  ],
  sections: [
    {
      type: 'example',
      title: 'Template literal',
      lang: 'javascript',
      output: false,
      code: `const nama = "Andi";
const umur = 25;

// penggabungan biasa
const sapa1 = "Halo " + nama + ", umur " + umur + " tahun.";

// template literal — lebih rapi
const sapa2 = \`Halo \${nama}, umur \${umur} tahun.\`;

// bisa multi-baris dan berisi ekspresi
const laporan = \`
  \${nama.toUpperCase()}
  \${umur >= 18 ? "dewasa" : "anak-anak"}
\`;`,
      explain: [
        'Dibungkus <b>backtick</b> <code>...</code>, bukan tanda kutip biasa.',
        'Menyisipkan nilai dengan <code>\${...}</code> — isinya bisa ekspresi apa pun.',
        'Boleh memuat <b>baris baru</b> langsung tanpa <code>\\n</code>.',
        'Fitur ini sangat mengurangi kekacauan tanda <code>+</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Destructuring',
      lang: 'javascript',
      output: false,
      code: `// dari array
const warna = ["merah", "hijau", "biru"];
const [pertama, kedua] = warna;
// pertama = "merah", kedua = "hijau"

// dari objek
const user = { nama: "Andi", umur: 25 };
const { nama, umur } = user;

// digabung nilai default
const { kota = "Bandung" } = user;   // kota tidak ada → "Bandung"

// di parameter fungsi
function profil({ nama, umur }) {
  console.log(nama, umur);
}`,
      explain: [
        '<b>Destructuring</b> memecah array/objek ke variabel dalam satu baris.',
        'Untuk objek, nama variabel <b>harus sama</b> dengan nama propertinya (atau beri alias).',
        '<code>= "Bandung"</code> memberi <b>nilai default</b> bila properti tidak ada.',
        'Sangat lazim di parameter fungsi — memanggil <code>profil(user)</code> tanpa mendaftar argumen.'
      ]
    },
    {
      type: 'example',
      title: 'Spread & rest',
      lang: 'javascript',
      output: false,
      code: `const a = [1, 2];
const b = [3, 4];

// spread: sebarkan isi
const gabung = [...a, ...b];      // [1, 2, 3, 4]
const salin = [...a];              // salinan array

const ori = { x: 1 };
const tambah = { ...ori, y: 2 };  // { x: 1, y: 2 }

// rest: kumpulkan sisa
function f(...sisanya) {
  console.log(sisanya);   // array dari semua argumen
}
f(1, 2, 3);   // [1, 2, 3]`,
      explain: [
        'Kedua-duanya memakai <code>...</code> — namanya bergantung <b>posisi</b>: <b>spread</b> menyebarkan, <b>rest</b> mengumpulkan.',
        'Spread membuat <b>salinan dangkal</b> array/objek — cara modern menggabungkan data.',
        'Rest di parameter mengumpulkan sisa argumen jadi array.',
        'Spread di <code>Math.max(...angka)</code> mengubah array jadi daftar argumen.'
      ]
    },
    {
      type: 'example',
      title: 'Kelas (class)',
      lang: 'javascript',
      output: false,
      code: `class Kucing {
  constructor(nama) {
    this.nama = nama;
  }
  bersuara() {
    return this.nama + ": meong!";
  }
}

// pewarisan
class KucingPersia extends Kucing {
  bersuara() {
    return super.bersuara() + " (lembut)";
  }
}

const mimi = new KucingPersia("Mimi");
mimi.bersuara();   // "Mimi: meong! (lembut)"`,
      explain: [
        '<code>class</code> menyediakan sintaks berorientasi objek yang familiar.',
        '<code>constructor</code> menginisialisasi objek baru.',
        '<code>extends</code> mewarisi dari kelas lain; <code>super</code> memanggil induk.',
        'Di balik layar, kelas tetap berbasis <b>prototipe</b> — ES6 hanya menyediakan "gula sintaksis".'
      ]
    },
    {
      type: 'example',
      title: 'Fitur modern lainnya',
      lang: 'javascript',
      output: false,
      code: `// Optional chaining (?.) — akses aman
const user = {};
user?.alamat?.kota;     // undefined, bukan error

// Nullish coalescing (??)
const nama = null ?? "Tamu";    // "Tamu"
const jumlah = 0 ?? 10;         // 0  (?? hanya untuk null/undefined)

// Set — himpunan tanpa duplikat
const unik = new Set([1, 1, 2]);   // Set {1, 2}

// Map — kunci bebas tipe
const nilai = new Map();
nilai.set("a", 90);
nilai.get("a");   // 90

// shorthand properti & metode
const n = "Andi";
const user2 = { n, makan() { return "makan"; } };`,
      explain: [
        '<code>?.</code> mengakses properti <b>tanpa takut error</b> bila jalannya kosong.',
        '<code>??</code> mengembalikan kanan bila kiri <b>null/undefined</b> — lebih tepat daripada <code>||</code>.',
        '<code>Set</code> menyimpan nilai <b>unik</b>; <code>Map</code> menyimpan pasangan kunci-nilai.',
        '<code>{ n }</code> sama dengan <code>{ n: n }</code> — penulisan singkat.',
        'Semua fitur ini sudah didukung browser modern.'
      ]
    },
    {
      type: 'example',
      title: 'ES6 dalam praktik',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>ES6 Mini</title>
</head>
<body>
  <ul id="daftar"></ul>

  <script>
    const karyawan = [
      { nama: "Andi", divisi: "Web" },
      { nama: "Sari", divisi: "Desain" }
    ];

    // destructuring di parameter + template literal + map
    const baris = karyawan.map(({ nama, divisi }) =>
      \`<li>\${nama} — \${divisi}</li>\`
    );

    document.getElementById("daftar").innerHTML = baris.join("");
  <\/script>
</body>
</html>`,
      explain: [
        'Satu baris <code>map</code> memakai <b>destructuring</b> di parameter dan <b>template literal</b> di badannya.',
        'Ini gaya kode modern yang akan sering kamu jumpai di proyek sungguhan.',
        'Gabungan fitur ES6 membuat kode lebih pendek tanpa kehilangan keterbacaan.'
      ]
    },
    {
      type: 'tip',
      title: 'ES apa lagi setelah ES6?',
      text: 'ECMAScript diperbarui <b>tiap tahun</b>: ES2016, ES2017, ... ES2024. Orang sering menyebut semuanya "ES6+" atau "modern JS". Fitur baru seperti <code>?.</code>, <code>??</code>, dan <code>Array.at()</code> sudah aman dipakai di browser terkini.'
    },
    {
      type: 'vocab',
      items: [
        ['ES6 / ES2015', 'Pembaruan besar JavaScript tahun 2015 (let, const, class, modul, dll).'],
        ['Template literal', 'String dengan backtick yang menyisipkan ${...}.'],
        ['Destructuring', 'Memecah array/objek ke variabel sekaligus.'],
        ['Spread (...', 'Menyebarkan isi array/objek ke tempat lain.'],
        ['Rest (...', 'Mengumpulkan sisa elemen/argumen jadi array.'],
        ['Class', 'Sintaks berorientasi objek: constructor, extends, super.'],
        ['Optional chaining (?.)', 'Akses properti yang aman dari null/undefined.'],
        ['Nullish coalescing (??)', 'Nilai cadangan hanya untuk null/undefined.'],
        ['Set', 'Koleksi nilai unik tanpa duplikat.'],
        ['Map', 'Koleksi pasangan kunci-nilai dengan kunci bebas tipe.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: gaya ES6',
      lang: 'html',
      hint: 'Tambahkan satu objek ke array users, ubah template literal-nya, dan jalankan lagi.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>ES6</title>
</head>
<body>
  <ul id="out"></ul>

  <script>
    const users = [
      { nama: "Rina", poin: 120 },
      { nama: "Bayu", poin: 80 }
    ];

    // spread: salin + tambah satu user baru
    const semua = [...users, { nama: "Citra", poin: 95 }];

    // filter + map + template literal
    const html = semua
      .filter(u => u.poin >= 90)
      .map(u => \`<li>\${u.nama} — \${u.poin} poin</li>\`);

    document.getElementById("out").innerHTML = html.join("");
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'ES6 (2015) membawa let/const, arrow function, template literal, kelas, modul.',
    'Template literal: backtick + ${...} untuk penyisipan nilai.',
    'Destructuring memecah array/objek ke variabel sekaligus.',
    'Spread (...) menyebarkan; rest (...) mengumpulkan.',
    'Kelas menyediakan constructor, extends, dan super.',
    'Fitur modern: ?. (akses aman), ?? (nilai cadangan), Set, Map.',
  ]
});
