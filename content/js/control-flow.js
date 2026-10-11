/* ============================================================
   Pelajaran JavaScript — Bab 4: Alur Kendali
   (topik info.md: "percabangan" dan "perulangan")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran 7: Percabangan ---------- */
window.JS_LESSONS.push({
  id: 'percabangan-javascript',
  title: 'Percabangan di JavaScript',
  chapter: 'Alur Kendali',
  duration: '10 menit',
  intro: [
    '<b>Percabangan</b> membuat program bisa <b>memilih</b>: "jika hujan, bawa payung; kalau tidak, pakai topi". Tanpa percabangan, program hanya bisa berjalan lurus.',
    'JavaScript menyediakan <code>if / else if / else</code> dan <code>switch</code>.'
  ],
  objectives: [
    'Menulis if, else if, dan else',
    'Membuat percabangan bersarang',
    'Memakai switch untuk banyak pilihan',
    'Memilih antara if-else dan switch'
  ],
  sections: [
    {
      type: 'example',
      title: 'if, else if, else',
      lang: 'javascript',
      output: false,
      code: `let nilai = 78;

if (nilai >= 90) {
  console.log("Predikat: A");
} else if (nilai >= 75) {
  console.log("Predikat: B");   // ← jalan untuk 78
} else if (nilai >= 60) {
  console.log("Predikat: C");
} else {
  console.log("Predikat: D");
}`,
      explain: [
        'Kondisi di <code>()</code> harus bernilai <b>boolean</b>.',
        'Kondisi diperiksa <b>dari atas</b>; begitu ada yang benar, sisanya dilewati.',
        '<code>else</code> adalah jalan terakhir — selalu dijalankan bila semua kondisi salah.',
        'Kurung kurawal <code>{ }</code> wajib ada meski badan hanya satu baris — kebiasaan baik.'
      ]
    },
    {
      type: 'example',
      title: 'Percabangan bersarang & ternary',
      lang: 'javascript',
      output: false,
      code: `let umur = 17;
let punyaKtp = false;

// bersarang: if di dalam if
if (umur >= 17) {
  if (punyaKtp) {
    console.log("Boleh masuk.");
  } else {
    console.log("Belum punya KTP.");
  }
} else {
  console.log("Terlalu muda.");
}

// keputusan kecil bisa pakai ternary
let status = umur >= 17 ? "dewasa" : "anak-anak";`,
      explain: [
        'Percabangan bisa <b>bersarang</b> — tetapi jangan lebih dari 2–3 tingkat.',
        'Terlalu dalam = sulit dibaca; pertimbangkan menggabungkan kondisi dengan <code>&amp;&amp;</code>.',
        'Ternary menggantikan if-else untuk penugasan satu baris.'
      ]
    },
    {
      type: 'example',
      title: 'switch — pilihan banyak',
      lang: 'javascript',
      output: false,
      code: `let hari = "Jum";

switch (hari) {
  case "Sen":
    console.log("Awal minggu.");
    break;
  case "Jum":
    console.log("Akhir pekan sebentar lagi!");  // ← jalan
    break;
  case "Sab":
  case "Min":
    console.log("Libur.");
    break;
  default:
    console.log("Hari biasa.");
}`,
      explain: [
        '<code>switch</code> membandingkan satu nilai dengan banyak <code>case</code>.',
        '<code>break</code> menghentikan percabangan — <b>jangan lupa</b>, atau case berikutnya ikut jalan (<i>fall-through</i>)!',
        'Dua <code>case</code> bertumpuk berarti "nilai yang sama untuk keduanya".',
        '<code>default</code> jalan bila tak ada case yang cocok — posisinya bebas, tapi biasanya di akhir.'
      ]
    },
    {
      type: 'tip',
      title: 'if-else atau switch?',
      text: 'Pakai <b>switch</b> bila membandingkan <b>satu nilai</b> dengan banyak kemungkinan (mis. hari, perintah menu). Pakai <b>if-else</b> bila kondisinya <b>bervariasi</b> (rentang angka, beberapa variabel, kondisi gabungan).'
    },
    {
      type: 'warn',
      title: 'Jebakan fall-through',
      text: 'Tanpa <code>break</code>, eksekusi "terusan" ke case berikutnya meski tidak cocok. Itu disengaja dalam beberapa pola, tapi 90% kasus itu adalah <b>bug</b>. Selalu tulis <code>break</code> kecuali memang bermaksud fall-through.'
    },
    {
      type: 'vocab',
      items: [
        ['Percabangan', 'Struktur untuk memilih jalur berdasarkan kondisi.'],
        ['if / else if / else', 'Percabangan berjenjang dari kondisi paling atas.'],
        ['switch / case', 'Percabangan berdasarkan kesamaan satu nilai.'],
        ['break', 'Keluar dari switch (atau perulangan) seketika.'],
        ['default', 'Case yang jalan bila tak ada case cocok.'],
        ['Fall-through', 'Eksekusi "terusan" ke case berikutnya karena tanpa break.'],
        ['Ternary', 'Operator ?: sebagai pengganti if-else ringkas.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: mesin predikat',
      lang: 'html',
      hint: 'Ubah nilai variabel nilai, lalu jalankan. Tambahkan case "A+" di switch untuk nilai 100!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Predikat Nilai</title>
</head>
<body>
  <h2>Mesin Predikat</h2>
  <p id="out">Klik Jalankan.</p>

  <script>
    const nilai = 82;
    let predikat;

    if (nilai >= 90) {
      predikat = "A";
    } else if (nilai >= 75) {
      predikat = "B";
    } else if (nilai >= 60) {
      predikat = "C";
    } else {
      predikat = "D";
    }

    document.getElementById("out").textContent =
      "Nilai " + nilai + " → predikat " + predikat;
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'if menjalankan kode bila kondisi benar; else kalau tidak.',
    'else if merangkai beberapa kondisi bertingkat.',
    'switch membandingkan satu nilai dengan banyak case; jangan lupa break.',
    'Ternary untuk keputusan ringkas dalam satu baris.',
    'Hindari percabangan bersarang terlalu dalam.',
  ]
});

/* ---------- Pelajaran 8: Perulangan ---------- */
window.JS_LESSONS.push({
  id: 'perulangan-javascript',
  title: 'Perulangan di JavaScript',
  chapter: 'Alur Kendali',
  duration: '11 menit',
  intro: [
    'Bayangkan menulis <code>console.log("halo")</code> seribu kali. <b>Perulangan</b> mengulang blok kode tanpa menulisnya berulang — cukup tiga baris.',
    'Ada empat bentuk: <code>for</code>, <code>while</code>, <code>do...while</code>, dan <code>for...of</code>.'
  ],
  objectives: [
    'Menulis perulangan for dengan penghitung',
    'Membedakan while dan do...while',
    'Memakai for...of untuk menelusuri array',
    'Menggunakan break dan continue'
  ],
  sections: [
    {
      type: 'example',
      title: 'for — pengulangan berhitung',
      lang: 'javascript',
      output: false,
      code: `for (let i = 1; i <= 5; i++) {
  console.log("Perulangan ke-" + i);
}
// 1. i mulai dari 1   (awal)
// 2. ulangi selama i <= 5   (kondisi)
// 3. tambah 1 setiap selesai   (langkah)`,
      explain: [
        'Tiga bagian dipisah titik koma: <b>awal</b>, <b>kondisi</b>, <b>langkah</b>.',
        '<code>i</code> adalah penghitung — nama bebas, tapi <code>i</code> adalah konvensi umum.',
        'Hati-hati: kondisi yang selalu benar menciptakan <b>perulangan tak hingga</b>.'
      ]
    },
    {
      type: 'example',
      title: 'while & do...while',
      lang: 'javascript',
      output: false,
      code: `// while: cek kondisi DULU
let x = 1;
while (x <= 3) {
  console.log(x);
  x++;
}

// do...while: badan jalan minimal SEKALI
let y = 10;
do {
  console.log("tetap jalan sekali");
} while (y < 5);`,
      explain: [
        '<code>while</code> cocok bila jumlah pengulangan <b>tidak diketahui</b> di awal.',
        '<code>do...while</code> menjalankan badan <b>sekali dulu</b>, baru memeriksa kondisi.',
        'Selalu ada sesuatu yang mengubah kondisi di dalam badan — atau perulangan tidak pernah berhenti.'
      ]
    },
    {
      type: 'example',
      title: 'for...of — menelusuri array',
      lang: 'javascript',
      output: false,
      code: `const buah = ["mangga", "jeruk", "apel"];

for (const item of buah) {
  console.log("Buah: " + item);
}`,
      explain: [
        '<code>for...of</code> mengambil <b>satu elemen per putaran</b> — tidak perlu penghitung.',
        'Bentuk modern dan paling sering dipakai untuk menelusuri daftar.',
        'Saudaranya, <code>for...in</code>, menelusuri <b>kunci/nama properti</b> objek.'
      ]
    },
    {
      type: 'example',
      title: 'break & continue',
      lang: 'javascript',
      output: false,
      code: `// break: berhenti total
for (let i = 1; i <= 100; i++) {
  if (i === 5) break;       // berhenti saat i = 5
  console.log(i);           // 1, 2, 3, 4
}

// continue: lewati putaran ini
for (let i = 1; i <= 5; i++) {
  if (i === 3) continue;    // lewati angka 3
  console.log(i);           // 1, 2, 4, 5
}`,
      explain: [
        '<code>break</code> <b>keluar</b> dari perulangan seketika.',
        '<code>continue</code> <b>melewati</b> sisa putaran berjalan, lalu lanjut ke putaran berikutnya.',
        'Keduanya hanya memengaruhi perulangan terdalam tempat mereka berada.'
      ]
    },
    {
      type: 'warn',
      title: 'Perulangan tak hingga',
      text: 'Lupa menambah penghitung (<code>i++</code>) atau salah arah kondisi (<code>i >= 0</code> yang terus bertambah) membuat browser <b>hang</b>. Tab akan menawarkan menghentikan halaman — itu tanda perulanganmu tidak pernah berhenti.'
    },
    {
      type: 'vocab',
      items: [
        ['for', 'Perulangan dengan penghitung: awal, kondisi, langkah.'],
        ['while', 'Perulangan yang memeriksa kondisi di awal.'],
        ['do...while', 'Perulangan yang mengeksekusi badan minimal sekali.'],
        ['for...of', 'Menelusuri elemen array satu per satu.'],
        ['break', 'Menghentikan perulangan seketika.'],
        ['continue', 'Melewati sisa putaran dan lanjut ke berikutnya.'],
        ['Iterasi', 'Satu kali putaran perulangan.'],
        ['Infinite loop', 'Perulangan yang tidak pernah berhenti.'],
        ['Penghitung', 'Variabel yang mengatur jumlah iterasi (biasanya i).']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: tabel perkalian',
      lang: 'html',
      hint: 'Jalankan, lalu ubah batas bawah/atas untuk membuat tabel 1–10. Tambahkan continue agar kelipatan 5 dilewati.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tabel Perkalian</title>
</head>
<body>
  <h2>Tabel Perkalian 3</h2>
  <ul id="list"></ul>

  <script>
    const baris = [];
    for (let i = 1; i <= 5; i++) {
      baris.push("3 × " + i + " = " + (3 * i));
    }
    document.getElementById("list").innerHTML =
      baris.map(t => "<li>" + t + "</li>").join("");
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'for: pengulangan berhitung — awal, kondisi, langkah.',
    'while: kondisi diperiksa dulu; do...while: badan jalan minimal sekali.',
    'for...of: cara modern menelusuri array.',
    'break menghentikan; continue melewati putaran berjalan.',
    'Pastikan kondisi perulangan bisa menjadi salah — hindari infinite loop.',
  ]
});
