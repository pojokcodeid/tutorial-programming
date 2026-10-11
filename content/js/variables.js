/* ============================================================
   Pelajaran JavaScript — Bab 2: Variabel & Dialog
   (topik info.md: "variable dan type data",
    "jendela dialog untuk input")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran 4: Variabel dan Tipe Data ---------- */
window.JS_LESSONS.push({
  id: 'variabel-dan-tipe-data',
  title: 'Variabel dan Tipe Data',
  chapter: 'Variabel & Dialog',
  duration: '11 menit',
  intro: [
    '<b>Variabel</b> adalah kotak bertuliskan nama untuk menyimpan nilai: angka, teks, atau ya/tidak. Isinya bisa berubah — karena itu namanya <i>variabel</i>.',
    'JavaScript mengenal beberapa <b>tipe data</b> dasar. Memahaminya mencegah banyak bug, misalnya kejutan saat "5" + 5 ternyata bukan 10.'
  ],
  objectives: [
    'Membuat variabel dengan let dan const',
    'Membedakan var, let, dan const',
    'Menyebutkan tipe data utama JavaScript',
    'Memeriksa tipe data dengan typeof'
  ],
  sections: [
    {
      type: 'example',
      title: 'Deklarasi variabel',
      lang: 'javascript',
      output: false,
      code: `let nama = "Andi";   // string (teks)
let umur = 17;        // number (angka)
let lulus = true;     // boolean (ya/tidak)

const kota = "Bandung";  // konstanta: nilai tetap
// kota = "Jakarta";      // ❌ error! const tidak bisa diisi ulang

let belumAda;          // nilainya undefined (belum diisi)
let kosong = null;     // sengaja kosong`,
      explain: [
        '<code>let</code> membuat variabel yang <b>bisa diisi ulang</b>; <code>const</code> untuk nilai yang <b>tetap</b>.',
        'Tidak perlu menyebut tipe data — JS menebaknya otomatis (<i>dynamic typing</i>).',
        'Nama variabel: huruf, angka, <code>_</code>, dan <code>$</code>; tidak boleh diawali angka.',
        'Kosongkan dengan <code>undefined</code> (belum diisi) atau <code>null</code> (sengaja kosong).'
      ]
    },
    {
      type: 'example',
      title: 'Tipe data utama',
      lang: 'javascript',
      output: false,
      code: `let a = "halo";        // string   → teks
let b = 42;            // number   → angka (bulat & desimal sama)
let c = true;          // boolean  → true / false
let d;                 // undefined → belum diberi nilai
let e = null;          // null     → sengaja kosong
let f = { nama: "Andi" }; // object → kumpulan data
let g = [1, 2, 3];     // object (array) → daftar terurut

console.log(typeof a);  // "string"
console.log(typeof b);  // "number"
console.log(typeof f);  // "object"`,
      explain: [
        '<b>string</b> dibungkus tanda kutip tunggal <code>&apos;</code> atau ganda <code>"</code>.',
        '<b>number</b> mencakup bulat dan desimal — tidak ada tipe int/float terpisah.',
        '<b>boolean</b> hanya punya dua nilai: <code>true</code> dan <code>false</code>.',
        'Array dan objek sebenarnya bertipe <code>object</code> — dibahas di pelajaran tersendiri.',
        '<code>typeof</code> mengembalikan nama tipe sebagai string.'
      ]
    },
    {
      type: 'example',
      title: 'let vs const vs var',
      lang: 'javascript',
      output: false,
      code: `// ✅ const: pilih ini bila nilai tidak berubah
const PESEN = 10000;

// ✅ let: bila nilai akan diubah
let saldo = 10000;
saldo = saldo - 2000;   // oke

// ⚠️ var: cara LAMA, jangkauan tidak ketat
var lama = "hindari";   // masih jalan, tapi tidak disarankan`,
      explain: [
        '<code>var</code> adalah cara lama sebelum ES6 — <b>jangkauannya longgar</b> dan bisa dideklarasikan ulang, rawan bug.',
        'Aturan praktis: <b>const dulu</b>; ganti ke <code>let</code> hanya kalau nilainya memang harus berubah.',
        'Konstanta sering ditulis <b>HURUF_BESAR</b> agar mudah dikenali.'
      ]
    },
    {
      type: 'tip',
      title: 'Mengubah tipe secara sengaja',
      text: 'JS kadang mengubah tipe otomatis (<i>coercion</i>): <code>"5" + 5</code> → <code>"55"</code>, tetapi <code>"5" - 5</code> → <code>0</code>. Bila butuh konversi pasti, pakai <code>Number(teks)</code>, <code>String(angka)</code>, atau <code>Boolean(nilai)</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Variabel', 'Wadah bernama untuk menyimpan nilai yang bisa berubah.'],
        ['let', 'Kata kunci untuk variabel yang bisa diisi ulang.'],
        ['const', 'Kata kunci untuk konstanta — nilainya tidak bisa diubah.'],
        ['var', 'Kata kunci lama; masih jalan tapi tidak disarankan.'],
        ['Tipe data', 'Jenis nilai: string, number, boolean, undefined, null, object.'],
        ['typeof', 'Operator yang mengembalikan nama tipe data suatu nilai.'],
        ['undefined', 'Nilai variabel yang sudah dibuat tapi belum diisi.'],
        ['null', 'Nilai "sengaja kosong" yang ditetapkan sendiri.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: eksperimen variabel',
      lang: 'html',
      hint: 'Tambahkan variabel ketiga, hitung totalnya, lalu tampilkan dengan innerHTML. Coba ganti let menjadi const pada variabel yang diisi ulang dan lihat pesannya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Variabel Latihan</title>
</head>
<body>
  <h2>Kasir Sederhana</h2>
  <p id="hasil">Belum dihitung...</p>

  <script>
    const harga = 12000;      // harga tetap
    let jumlah = 3;           // bisa berubah
    jumlah = 5;               // diisi ulang

    const total = harga * jumlah;
    document.getElementById("hasil").textContent =
      "Total: Rp " + total;
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Variabel menyimpan nilai; dibuat dengan let (bisa berubah) atau const (tetap).',
    'var sudah usang — gunakan let dan const.',
    'Tipe data utama: string, number, boolean, undefined, null, object.',
    'typeof memeriksa tipe data suatu nilai.',
    'JavaScript menebak tipe otomatis — waspadai konversi tak terduga.'
  ]
});

/* ---------- Pelajaran 5: Jendela Dialog untuk Input ---------- */
window.JS_LESSONS.push({
  id: 'dialog-input-javascript',
  title: 'Jendela Dialog untuk Input',
  chapter: 'Variabel & Dialog',
  duration: '8 menit',
  intro: [
    'Selain menampilkan keluaran, JavaScript bisa <b>bertanya</b> kepada pengunjung lewat <b>jendela dialog</b>: <code>prompt()</code> untuk meminta teks, dan <code>confirm()</code> untuk pertanyaan ya/tidak.',
    'Dialog ini adalah cara paling cepat mendapat input — meski di aplikasi sungguhan biasanya digantikan oleh form HTML.'
  ],
  objectives: [
    'Menggunakan prompt() untuk meminta teks',
    'Menggunakan confirm() untuk pertanyaan ya/tidak',
    'Mengolah hasil input yang dikembalikan dialog',
    'Mengetahui keterbatasan dialog di browser modern'
  ],
  sections: [
    {
      type: 'example',
      title: 'prompt() — meminta teks',
      lang: 'javascript',
      output: false,
      code: `let nama = prompt("Siapa namamu?", "Tamu");
// Pengunjung mengetik, lalu OK atau Batal

if (nama !== null) {
  console.log("Halo, " + nama + "!");
} else {
  console.log("Pengunjung membatalkan.");
}`,
      explain: [
        '<code>prompt("teks", "nilai awal")</code> membuka dialog dengan kolom teks.',
        'Hasilnya selalu <b>string</b> — meski pengunjung mengetik angka.',
        'Jika tombol <b>Batal</b> ditekan, hasilnya <code>null</code> — selalu periksa ini!',
        'Argumen kedua adalah nilai awal di kolom (opsional).'
      ]
    },
    {
      type: 'example',
      title: 'confirm() — pertanyaan ya/tidak',
      lang: 'javascript',
      output: false,
      code: `let yakin = confirm("Yakin ingin menghapus data?");

if (yakin) {
  console.log("Data dihapus.");   // OK  → true
} else {
  console.log("Dibatalkan.");      // Batal → false
}`,
      explain: [
        '<code>confirm()</code> menampilkan dialog dengan dua tombol: <b>OK</b> dan <b>Batal</b>.',
        'Mengembalikan <code>true</code> (OK) atau <code>false</code> (Batal) — tepat untuk keputusan sederhana.',
        'Seperti alert, confirm <b>menghentikan</b> halaman sampai pengunjung menjawab.'
      ]
    },
    {
      type: 'warn',
      title: 'Dialog diblokir di pratinjau terkotak',
      text: 'Browser melarang <code>alert</code>, <code>prompt</code>, dan <code>confirm</code> di dalam iframe terkotak (sandbox) seperti pratinjau materi ini. Saat kamu menjalankan contoh, dialog <b>tidak muncul</b> dan <code>prompt()</code> langsung mengembalikan <code>null</code>. Coba buka halaman sungguhan di tab browser biasa untuk merasakannya — atau lihat latihan di bawah yang menangani kasus itu.'
    },
    {
      type: 'tip',
      title: 'Mengolah input angka',
      text: 'Karena prompt selalu mengembalikan string, ubah dulu bila butuh angka: <code>let umur = Number(prompt("Umur kamu?"));</code>. Kalau hasilnya bukan angka, <code>Number()</code> mengembalikan <code>NaN</code> ("Not a Number") — periksa dengan <code>isNaN(umur)</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['prompt()', 'Dialog untuk meminta teks; mengembalikan string atau null.'],
        ['confirm()', 'Dialog ya/tidak; mengembalikan true atau false.'],
        ['alert()', 'Dialog pemberitahuan dengan satu tombol OK.'],
        ['Modal', 'Jendela yang menghentikan interaksi sampai ditutup.'],
        ['NaN', '"Not a Number" — hasil konversi teks yang bukan angka.'],
        ['isNaN()', 'Fungsi untuk memeriksa apakah suatu nilai adalah NaN.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: kalkulator dialog',
      lang: 'html',
      hint: 'Jalankan di tab sungguhan agar dialog muncul (di pratinjau, prompt diblokir dan dianggap dibatalkan). Perhatikan bagaimana null ditangani dengan nilai cadangan.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dialog Input</title>
</head>
<body>
  <h2>Sapaan</h2>
  <p id="sapa">Klik "Jalankan" untuk memulai.</p>

  <script>
    // Di pratinjau, prompt diblokir → null → pakai nama cadangan
    let nama = prompt("Siapa namamu?", "Teman");
    if (nama === null || nama === "") {
      nama = "Teman";
    }

    document.getElementById("sapa").textContent =
      "Halo, " + nama + "! Selamat belajar.";
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'prompt() meminta teks; mengembalikan string atau null (jika dibatalkan).',
    'confirm() untuk pertanyaan ya/tidak; mengembalikan true/false.',
    'Hasil prompt selalu string — konversi dengan Number() bila butuh angka.',
    'Dialog bersifat modal: menghentikan halaman sebentar.',
    'Dialog diblokir di iframe terkotak; uji di tab browser sungguhan.',
  ]
});
