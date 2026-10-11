/* ============================================================
   Pelajaran TypeScript — Bab 1: Pengenalan & Persiapan
   (topik info.md: "pengenalan dan instalasi",
    "setup project typescript",
    "typescript hello world dan kenapa typescript?")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 1: Mengenal TypeScript ---------- */
window.TS_LESSONS.push({
  id: 'mengenal-typescript',
  title: 'Mengenal TypeScript',
  chapter: 'Pendahuluan',
  duration: '7 menit',
  intro: [
    'Kamu sudah tahu bahwa JavaScript bersifat <b>longgar</b>: variabel bisa berubah tipe, dan banyak kesalahan baru terlihat saat program dijalankan. <b>TypeScript</b> hadir untuk mengatasi kelemahan itu.',
    'Pelajaran ini membahas apa itu TypeScript, siapa pembuatnya, dan hubungannya dengan JavaScript.'
  ],
  objectives: [
    'Memahami apa itu TypeScript',
    'Menjelaskan hubungan TypeScript dan JavaScript',
    'Menyebutkan manfaat utama memakai TypeScript',
    'Mengetahui kapan TypeScript cocok dipakai'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>TypeScript</b> (sering disingkat <b>TS</b>) adalah bahasa buatan <b>Microsoft</b> yang dirilis tahun <b>2012</b>, dipimpin oleh <b>Anders Hejlsberg</b> (perancang C# dan Turbo Pascal). TypeScript adalah <b>superset</b> JavaScript — artinya <b>semua kode JavaScript yang valid juga merupakan kode TypeScript yang valid</b>, ditambah TypeScript menambahkan fitur baru di atasnya.</p><p>Fitur tambahan yang paling terkenal adalah <b>sistem tipe statis</b> (static typing): kamu bisa menuliskan tipe data di setiap variabel dan fungsi, lalu sebuah <b>kompilator</b> memeriksanya sebelum kode dijalankan.</p>'
    },
    {
      type: 'example',
      title: 'JavaScript vs TypeScript',
      lang: 'typescript',
      output: false,
      code: `// ---------- JavaScript ----------
function luas(panjang, lebar) {
  return panjang * lebar;
}
luas(10, 5);      // 50 ✓
luas("10", "5");  // "105" — hasil aneh, tapi tidak ada error!

// ---------- TypeScript ----------
function luas(panjang: number, lebar: number): number {
  return panjang * lebar;
}
luas(10, 5);      // 50 ✓
luas("10", "5");  // Error saat kompilasi:
                  // Argument of type 'string' is not
                  // assignable to parameter of type 'number'.`,
      explain: [
        'Versi JavaScript menerima teks di parameter angka — bug baru muncul saat program jalan.',
        'Versi TypeScript menuliskan tipe <code>number</code> di parameter dan <code>: number</code> setelah kurung tutup (tipe kembalian).',
        'Kesalahan seperti itu <b>ditangkap sebelum program dijalankan</b> — itulah inti dari TypeScript.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenapa disebut "superset"?',
      text: 'Superset = himpunan yang lebih besar. JavaScript "masuk" ke dalam TypeScript. Berkas <code>.js</code> lama bisa langsung diubah namanya menjadi <code>.ts</code> dan biasanya tetap jalan setelah dikompilasi.'
    },
    {
      type: 'warn',
      title: 'TypeScript tidak menggantikan JavaScript',
      text: 'Browser <b>tidak mengerti</b> TypeScript. Kode TS harus <b>dikompilasi menjadi JavaScript</b> dulu (dengan <code>tsc</code> atau alat lain) sebelum dijalankan di browser atau Node.js. TypeScript adalah alat bantu penulisan, bukan bahasa runtime baru.'
    },
    {
      type: 'vocab',
      items: [
        ['TypeScript', 'Bahasa buatan Microsoft: JavaScript + sistem tipe statis dan fitur tambahan.'],
        ['Superset', 'Bahasa yang memuat seluruh fitur bahasa lain ditambah fitur baru.'],
        ['Static typing', 'Tipe data diketahui/dideklarasikan sebelum program dijalankan.'],
        ['Compiler (tsc)', 'Program yang mengubah kode TypeScript menjadi JavaScript biasa.'],
        ['Anders Hejlsberg', 'Perancang utama TypeScript, juga perancang C# dan Turbo Pascal.'],
        ['Inferensi tipe', 'Kemampuan TypeScript menebak tipe data tanpa ditulis eksplisit.']
      ]
    },
    {
      type: 'text',
      html: '<p><b>Manfaat utama TypeScript:</b></p><ul><li><b>Menangkap bug lebih awal</b> — salah tipe, salah nama properti, atau lupa parameter terdeteksi saat menulis kode.</li><li><b>Dokumentasi hidup</b> — tipe data berfungsi sebagai penjelasan otomatis untuk setiap fungsi.</li><li><b>Refactoring aman</b> — mengubah nama fungsi atau properti bisa dilakukan dengan percaya diri.</li><li><b>Otomatisasi editor</b> — editor seperti VS Code bisa menyarankan isi objek dan parameter secara akurat (autocomplete).</li></ul>'
    }
  ],
  recap: [
    'TypeScript adalah JavaScript + sistem tipe statis, dibuat Microsoft pada 2012.',
    'TypeScript adalah superset JavaScript: kode JS valid adalah kode TS valid.',
    'Browser tidak mengerti TypeScript — harus dikompilasi ke JavaScript dulu.',
    'Manfaat terbesar: error terdeteksi saat menulis kode, bukan saat program jalan.',
    'TypeScript cocok untuk proyek besar dan tim; proyek kecil pun tetap diuntungkan.'
  ]
});

/* ---------- Pelajaran 2: Instalasi TypeScript ---------- */
window.TS_LESSONS.push({
  id: 'instalasi-typescript',
  title: 'Instalasi TypeScript',
  chapter: 'Pendahuluan',
  duration: '8 menit',
  intro: [
    'Untuk menulis TypeScript kamu butuh dua hal: <b>Node.js</b> (yang membawa <b>npm</b>) dan <b>kompilator TypeScript</b> (<code>tsc</code>). Untungnya, proses instalasinya singkat.',
    'Pelajaran ini memandu instalasi langkah demi langkah, termasuk cara memeriksa bahwa semuanya beres.'
  ],
  objectives: [
    'Menginstal Node.js dan npm',
    'Menginstal kompilator TypeScript (tsc)',
    'Memverifikasi instalasi dengan tsc --version',
    'Menyiapkan editor kode (VS Code)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Langkah 1 — siapkan Node.js.</b> Kunjungi <b>nodejs.org</b> dan unduh versi <b>LTS</b> (Long Term Support). Node.js sudah menyertakan <b>npm</b> (Node Package Manager), alat untuk memasang program seperti kompilator TypeScript. Setelah terinstal, buka <b>terminal</b> (macOS/Linux) atau <b>Command Prompt / PowerShell</b> (Windows) dan periksa:</p>'
    },
    {
      type: 'example',
      title: 'Periksa Node.js dan npm',
      lang: 'bash',
      output: false,
      code: `node --version
# v20.11.1   (atau versi LTS terbaru)

npm --version
# 10.2.4     (atau versi terbaru)`,
      explain: [
        'Kedua perintah harus menampilkan nomor versi, bukan error.',
        'Kalau muncul <code>command not found</code>, tutup dan buka kembali terminal, atau ulangi instalasi Node.js.'
      ]
    },
    {
      type: 'example',
      title: 'Pasang kompilator TypeScript',
      lang: 'bash',
      output: false,
      code: `npm install -g typescript

# Periksa:
tsc --version
# Version 5.x.x`,
      explain: [
        '<code>npm install -g typescript</code> memasang <b>TypeScript secara global</b> (flag <code>-g</code>) sehingga perintah <code>tsc</code> bisa dipakai di mana saja.',
        'Perintah <code>tsc</code> adalah <b>TypeScript Compiler</b> — alat yang mengubah <code>.ts</code> menjadi <code>.js</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Lebih baik: instal per proyek',
      text: 'Untuk proyek nyata, pasang TypeScript <b>secara lokal</b> di folder proyek: <code>npm install --save-dev typescript</code>. Setiap proyek lalu bisa memakai versi TypeScript sendiri tanpa bentrok antar proyek.'
    },
    {
      type: 'tip',
      title: 'Editor: VS Code sangat direkomendasikan',
      text: '<b>Visual Studio Code</b> dibuat oleh Microsoft dan memahami TypeScript secara bawaan. Cukup buka berkas <code>.ts</code> — editor langsung menampilkan error dengan garis bermerah, autocomplete tipe, dan dokumentasi saat kursor di atas fungsi. Ekstensi yang dibutuhkan: tidak ada.'
    },
    {
      type: 'warn',
      title: 'Hati-hati dengan TypeScript di browser',
      text: 'Jangan tergoda situs yang menjanjikan "TypeScript langsung jalan di browser". Kompilator asli TypeScript butuh Node.js. Untuk eksperimen cepat, gunakan <b>TypeScript Playground</b> resmi (typescriptlang.org/play) — tetapi untuk belajar serius, instal <code>tsc</code> seperti langkah di atas.'
    },
    {
      type: 'vocab',
      items: [
        ['Node.js', 'Runtime JavaScript di luar browser; dipakai untuk menjalankan alat seperti tsc.'],
        ['npm', 'Node Package Manager — alat memasang paket/perpustakaan JavaScript.'],
        ['tsc', 'TypeScript Compiler — mengubah .ts menjadi .js.'],
        ['-g (global)', 'Flag npm agar paket terpasang di seluruh komputer, bukan di satu proyek.'],
        ['--save-dev', 'Flag npm agar paket dicatat sebagai dependensi pengembangan proyek.'],
        ['Terminal', 'Program untuk mengetik perintah teks (Command Prompt, PowerShell, zsh, Bash).']
      ]
    }
  ],
  recap: [
    'Instal Node.js LTS dari nodejs.org — npm ikut terpasang bersamanya.',
    'Pasang kompilator dengan: npm install -g typescript.',
    'Periksa keberhasilan dengan: tsc --version.',
    'VS Code memahami TypeScript tanpa ekstensi tambahan.',
    'Proyek nyata sebaiknya memasang TypeScript secara lokal per proyek.'
  ]
});

/* ---------- Pelajaran 3: Setup Project TypeScript ---------- */
window.TS_LESSONS.push({
  id: 'setup-project-typescript',
  title: 'Setup Project TypeScript',
  chapter: 'Pendahuluan',
  duration: '10 menit',
  intro: [
    'Setelah kompilator terpasang, langkah berikutnya adalah menyiapkan <b>folder proyek</b> yang rapi: ada tempat kode sumber, tempat hasil kompilasi, dan satu berkas pengaturan bernama <code>tsconfig.json</code>.',
    'Pelajaran ini membahas struktur proyek standar dan arti setiap pengaturan penting.'
  ],
  objectives: [
    'Membuat struktur folder proyek TypeScript',
    'Membuat tsconfig.json dengan tsc --init',
    'Memahami opsi target, strict, outDir, dan include',
    'Mengompilasi seluruh proyek sekaligus'
  ],
  sections: [
    {
      type: 'example',
      title: 'Buat folder proyek',
      lang: 'bash',
      output: false,
      code: `mkdir proyek-pertamaku
cd proyek-pertamaku

npm init -y
npm install --save-dev typescript

npx tsc --init`,
      explain: [
        '<code>npm init -y</code> membuat <code>package.json</code> secara otomatis (berisi data proyek).',
        '<code>npx tsc --init</code> menjalankan kompilator TypeScript milik proyek dan membuat berkas <code>tsconfig.json</code>.',
        '<code>npx</code> menjalankan paket yang terpasang lokal tanpa harus memasangnya secara global.'
      ]
    },
    {
      type: 'example',
      title: 'Isi tsconfig.json (versi ringkas)',
      lang: 'json',
      output: false,
      code: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "include": ["src/**/*"]
  }
}`,
      explain: [
        '<code>target</code> — versi JavaScript hasil kompilasi (ES2020 aman untuk browser modern).',
        '<code>strict: true</code> — <b>mengaktifkan semua pemeriksaan ketat</b>; selalu nyalakan opsi ini.',
        '<code>rootDir</code> — folder kode sumber (<code>src</code>); <code>outDir</code> — folder hasil (<code>dist</code>).',
        '<code>include</code> — berkas mana saja yang dikompilasi (<code>src/**/*</code> = semua di dalam src).'
      ]
    },
    {
      type: 'example',
      title: 'Kompilasi seluruh proyek',
      lang: 'bash',
      output: false,
      code: `npx tsc

# Hasil: semua .ts di src/ diterjemahkan
# menjadi .js di dist/

# Mode pantau (otomatis mengompilasi ulang
# setiap kali berkas disimpan):
npx tsc --watch`,
      explain: [
        '<code>npx tsc</code> tanpa argumen membaca <code>tsconfig.json</code> dan mengompilasi semua berkas yang disebutkan di <code>include</code>.',
        '<code>--watch</code> sangat praktis saat belajar: simpan berkas, dan hasilnya di <code>dist</code> langsung diperbarui.'
      ]
    },
    {
      type: 'tip',
      title: 'Struktur folder yang lazim',
      text: 'Proyek TypeScript khas berbentuk:<br><code>proyek/</code> ├─ <code>src/</code> (kode .ts) ├─ <code>dist/</code> (hasil .js) ├─ <code>node_modules/</code> (paket) ├─ <code>package.json</code> └─ <code>tsconfig.json</code>. Folder <code>dist</code> biasanya tidak disimpan di Git (tambahkan ke <code>.gitignore</code>).'
    },
    {
      type: 'warn',
      title: 'Jangan biarkan strict: false',
      text: 'Berkas <code>tsconfig.json</code> bawaan menonaktifkan banyak pemeriksaan (<code>// strict: true</code> dikomentari). Matikan komentar itu! Tanpa <code>strict</code>, TypeScript membiarkan <code>null</code>, <code>undefined</code>, dan tipe longgar lain lolos — kehilangan separuh manfaat utamanya.'
    },
    {
      type: 'vocab',
      items: [
        ['tsconfig.json', 'Berkas pengaturan kompilator TypeScript untuk sebuah proyek.'],
        ['target', 'Versi JavaScript hasil kompilasi (mis. ES2020, ES2022).'],
        ['strict', 'Kumpulan pemeriksaan ketat; hampir selalu diaktifkan.'],
        ['outDir / rootDir', 'Folder hasil kompilasi dan folder kode sumber.'],
        ['npx', 'Alat npm untuk menjalankan paket lokal tanpa instal global.'],
        ['--watch', 'Mode kompilasi ulang otomatis setiap berkas berubah.'],
        ['dist', 'Singkatan "distribution": folder berisi hasil build yang siap dipakai.']
      ]
    }
  ],
  recap: [
    'Proyek TypeScript punya folder src (sumber) dan dist (hasil), plus package.json dan tsconfig.json.',
    'tsconfig.json dibuat dengan: npx tsc --init.',
    'Opsi penting: target, strict (aktifkan!), outDir, rootDir, include.',
    'Kompilasi proyek dengan npx tsc; pantau perubahan dengan npx tsc --watch.',
    'Selalu aktifkan strict: true agar pemeriksaan tipe maksimal.'
  ]
});

/* ---------- Pelajaran 4: Hello World & Kenapa TypeScript ---------- */
window.TS_LESSONS.push({
  id: 'hello-world-typescript',
  title: 'Hello World & Kenapa TypeScript',
  chapter: 'Pendahuluan',
  duration: '9 menit',
  intro: [
    'Saatnya menulis program TypeScript pertama dan melihat proses kompilasinya. Kita juga membahas alasan paling kuat memakai TypeScript: <b>menangkap kesalahan sebelum program dijalankan</b>.',
    'Pelajaran ini adalah versi TypeScript dari "Hello, World!" klasik.'
  ],
  objectives: [
    'Menulis dan mengompilasi program Hello World TypeScript',
    'Membedakan berkas .ts (sumber) dan .js (hasil kompilasi)',
    'Menjelaskan kenapa TypeScript berguna dengan contoh error',
    'Melihat perbedaan perilaku JavaScript murni vs TypeScript'
  ],
  sections: [
    {
      type: 'example',
      title: 'hello.ts — kode sumber TypeScript',
      lang: 'typescript',
      output: false,
      code: `// hello.ts
const nama: string = "Dunia";
const tahun: number = 2026;

function sapa(target: string): string {
  return "Halo, " + target + "!";
}

console.log(sapa(nama));        // Halo, Dunia!
console.log("Tahun ini " + tahun);`,
      explain: [
        '<code>const nama: string</code> — variabel <code>nama</code> dinyatakan bertipe <b>string</b>.',
        'Fungsi <code>sapa</code> menerima parameter <code>target: string</code> dan <b>mengembalikan string</b> (<code>: string</code> setelah kurung tutup).',
        'Titik koma opsional di TypeScript, tetapi memakainya membuat kode lebih tegas.'
      ]
    },
    {
      type: 'example',
      title: 'Kompilasi dan jalankan',
      lang: 'bash',
      output: false,
      code: `npx tsc hello.ts
# → menghasilkan hello.js

node hello.js
# Halo, Dunia!
# Tahun ini 2026`,
      explain: [
        '<code>npx tsc hello.ts</code> mengompilasi satu berkas menjadi <code>hello.js</code>.',
        'Yang dijalankan di Node.js (atau browser) adalah <b>JavaScript hasil kompilasi</b>, bukan berkas .ts.',
        'Berkas <code>hello.js</code> berisi kode yang sama tetapi <b>tanpa tanda tipe</b> — tipe hanya dipakai saat kompilasi.'
      ]
    },
    {
      type: 'example',
      title: 'Hasil kompilasi: hello.js',
      lang: 'javascript',
      output: false,
      code: `"use strict";
// hello.ts
const nama = "Dunia";
const tahun = 2026;
function sapa(target) {
  return "Halo, " + target + "!";
}
console.log(sapa(nama));
console.log("Tahun ini " + tahun);`,
      explain: [
        'Perhatikan: semua <code>: string</code> dan <code>: number</code> <b>hilang</b> setelah kompilasi.',
        'Tipe data TypeScript <b>tidak ada saat program jalan</b> — mereka hanya "pembantu" saat penulisan.',
        'Inilah sebabnya TypeScript tidak bisa melindungi dari kesalahan <b>logika</b> (misal rumus yang salah) — hanya dari kesalahan tipe dan struktur.'
      ]
    },
    {
      type: 'example',
      title: 'Error yang ditangkap TypeScript',
      lang: 'typescript',
      output: false,
      code: `const usia: number = 21;

// TypeScript langsung menandai baris ini:
console.log(usia.toUpperCase());
// Error: Property 'toUpperCase' does not
// exist on type 'number'.`,
      explain: [
        '<code>toUpperCase()</code> adalah metode <b>string</b>, bukan <b>number</b>.',
        'JavaScript murni baru akan menampilkan <code>TypeError</code> <b>saat program dijalankan</b>; TypeScript menangkapnya <b>di editor, sebelum kode pernah jalan</b>.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: lihat error saat runtime',
      lang: 'html',
      hint: 'Klik Jalankan untuk melihat error JavaScript murni. Inilah jenis bug yang TypeScript tangkap jauh sebelumnya — di editor, sebelum kode dijalankan.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Error saat runtime</title>
</head>
<body>
  <h1>Demo: JavaScript murni tanpa tipe</h1>
  <p>Buka konsol (F12) dan perhatikan errornya.</p>
  <script>
    const usia = 21;          // number
    // Baris berikut menyebabkan TypeError saat runtime:
    // (komentari dulu untuk melihat halaman normal)
    try {
      usia.toUpperCase();
    } catch (err) {
      document.body.insertAdjacentHTML(
        "beforeend",
        "<p style='color:#c62828'>TypeError: " + err.message + "</p>"
      );
    }
  <\/script>
</body>
</html>`
    },
    {
      type: 'tip',
      title: 'Kenapa TypeScript? Ringkasannya',
      text: '<b>1)</b> Error tipe ketahuan sebelum jalan. <b>2)</b> Editor memberi autocomplete yang akurat. <b>3)</b> Kode besar lebih mudah dibaca dan diubah. <b>4)</b> Ekosistem besar (React, Angular, NestJS, VS Code sendiri ditulis dalam TypeScript).'
    },
    {
      type: 'vocab',
      items: [
        ['Kompilasi', 'Proses mengubah kode TypeScript menjadi JavaScript murni.'],
        ['.ts', 'Ekstensi berkas sumber TypeScript.'],
        ['.js', 'Ekstensi berkas JavaScript — hasil kompilasi yang dijalankan browser/Node.'],
        ['Runtime error', 'Error yang muncul saat program dijalankan (bukan saat ditulis).'],
        ['toUpperCase()', 'Metode string untuk mengubah teks jadi huruf besar.'],
        ['tsc (tanpa argumen)', 'Mengompilasi sesuai tsconfig.json; dengan nama berkas, hanya berkas itu.']
      ]
    }
  ],
  recap: [
    'Program TypeScript pertama: tulis .ts, kompilasi dengan tsc, jalankan .js-nya.',
    'Berkas .js hasil kompilasi tidak lagi memuat tanda tipe.',
    'TypeScript menangkap error tipe di editor, sebelum kode dijalankan.',
    'TypeScript tidak melindungi dari kesalahan logika bisnis.',
    'Kesimpulan: TypeScript = JavaScript + pemeriksaan tipe saat menulis kode.'
  ]
});
