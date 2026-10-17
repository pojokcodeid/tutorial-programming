/* ============================================================
   Pelajaran Lucee CFML — Bab 5: Fondasi & Dasar (L5)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-struktur-data',
  title: 'Struktur Data: Array, Struct & Query',
  chapter: 'Fondasi & Dasar',
  duration: '13 menit',
  intro: [
    'Satu variabel hanya menyimpan satu nilai. Aplikasi nyata butuh kumpulan: daftar produk di keranjang, data satu pengguna, ratusan baris hasil query. Di CFML ada tiga wadah utama — <b>array</b> (berurutan), <b>struct</b> (berlabel), dan <b>query</b> (baris dan kolom).',
    'Pelajaran ini memakai contoh kasus toko online: mengisi dan memanipulasi ketiganya, membaca hasil query baris demi baris, lalu mengonversinya ke JSON untuk dikirim ke aplikasi.'
  ],
  objectives: [
    'Membuat array dan mengelolanya dengan fungsi bawaan',
    'Menyimpan data berlabel dalam struct dan struktur bersarang',
    'Membaca baris query dengan queryGetRow dan cfloop query',
    'Membedakan kapan memakai array, struct, atau query',
    'Mengonversi query menjadi array of struct dan JSON',
    'Memilih struktur data yang tepat untuk kasus aplikasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Array: Kumpulan Berurutan</h3><p><b>Array</b> adalah daftar nilai bernomor tempat urutan itu penting — cocok untuk keranjang belanja, daftar kategori, atau hasil pencarian. Dibuat dengan literal <code>[ ]</code> atau <code>arrayNew()</code>. Satu kekhasan CFML yang wajib diingat: <b>indeks dimulai dari 1</b>, bukan 0.</p>'
    },
    {
      type: 'example',
      title: 'Membuat &amp; mengakses array',
      lang: 'cfml',
      output: false,
      code: `<cfset keranjang = []>
<cfset daftarKategori = arrayNew(1)>   <!--- array 1 dimensi --->
<cfset produk = ["Kopi Arabika", "Teh Melati", "Susu UHT"]>

<cfset arrayAppend(keranjang, "Kopi Arabika")>
<cfset arrayAppend(keranjang, "Teh Melati")>

<cfoutput>
    <p>Elemen pertama: #produk[1]#</p>
    <p>Isi keranjang: #arrayLen(keranjang)# item</p>
</cfoutput>`,
      explain: [
        '<code>[]</code> membuat array kosong; <code>arrayNew(1)</code> membuat array dengan 1 dimensi.',
        '<code>arrayAppend()</code> menambahkan satu elemen di posisi paling akhir.',
        '<code>arrayLen()</code> mengembalikan jumlah elemen, dipakai sebagai batas aman saat mengakses.',
        'Elemen terakhir <code>produk</code> adalah <code>produk[3]</code> — mengakses <code>produk[4]</code> memunculkan error.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Fungsi Array untuk Kerja Harian</h3><p>Sebagian besar pekerjaan array di CFML selesai dengan fungsi bawaan tanpa perlu menulis loop manual: memotong (<code>arraySlice</code>), memetakan (<code>arrayMap</code>), menyaring (<code>arrayFilter</code>), mengurutkan (<code>arraySort</code>), dan menjalankan aksi tiap elemen (<code>arrayEach</code>).</p>'
    },
    {
      type: 'example',
      title: 'Slice, filter, map, sort, each',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
harga = [85000, 45000, 12000, 150000, 60000];

tigaPertama = arraySlice(harga, 1, 3);        // [85000, 45000, 12000]
mahal  = arrayFilter(harga, function(h) {      // ambil yang >= 50000
    return h >= 50000;
});
denganLabel = arrayMap(harga, function(h) {    // ubah tiap elemen
    return "Rp " & h;
});
arraySort(harga, "numeric", "desc");           // urut di tempat, terbesar dulu

arrayEach(mahal, function(h, idx) {
    writeOutput("Item ke-" & idx & ": Rp " & h & "<br>");
});
</cfscript>`,
      explain: [
        '<code>arraySlice(array, mulai, jumlah)</code> mengambil potongan tanpa mengubah array asli.',
        '<code>arrayFilter</code> dan <code>arrayMap</code> menghasilkan array baru; fungsi callback menerima elemen (dan opsional nomor urut).',
        '<code>arraySort</code> mengurutkan sekaligus mengubah isi array; tipe "numeric" memastikan angka diurutkan sebagai angka.',
        '<code>arrayEach</code> cocok untuk aksi tanpa hasil balik, misal mencetak atau mengirim notifikasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Struct: Kumpulan Berlabel</h3><p><b>Struct</b> menyimpan pasangan kunci–nilai seperti kamus: setiap nilai punya nama. Cocok untuk data satu entitas — satu produk, satu pengguna, satu konfigurasi. Dibuat dengan literal <code>{ }</code> atau <code>structNew()</code>, dan nilai bisa dibaca lewat <code>data["kunci"]</code> maupun <code>data.kunci</code>.</p>'
    },
    {
      type: 'example',
      title: 'Struct bersarang &amp; array of struct',
      lang: 'cfml',
      output: false,
      code: `<cfset produk = { "nama": "Kopi Arabika", "harga": 85000, "tersedia": true }>
<cfset produk.alamat = { "kota": "Bandung", "kodePos": "40111" }>

<cfscript>
pengguna = structNew();
pengguna["nama"] = "Budi";              // akses pakai kurung siku
pengguna.email = "budi@tokoku.id";      // akses dot juga sah

adaEmail = structKeyExists(pengguna, "email");   // true
jumlah   = structCount(pengguna);                // 2
structDelete(pengguna, "email");                 // hapus satu kunci

// array of struct: daftar entitas, gaya paling lazim
produkList = [
    { "nama": "Kopi Arabika", "harga": 85000 },
    { "nama": "Teh Melati",   "harga": 45000 }
];
writeOutput(produkList[1].nama);         // "Kopi Arabika"
</cfscript>`,
      explain: [
        'Nilai struct bisa berupa struct lain — <code>produk.alamat.kota</code> menghasilkan "Bandung".',
        '<code>structKeyExists()</code> mengecek kunci sebelum dibaca, mencegah error pada data tak lengkap.',
        '<code>structCount()</code> menghitung jumlah kunci, bukan jumlah karakter nilai.',
        '<b>Array of struct</b> menggabungkan keunggulan keduanya: bernomor sekaligus berlabel — format standar untuk data JSON.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Query: Struktur Data Khas CFML</h3><p><b>Query</b> adalah struktur data bawaan CFML: kumpulan baris dan kolom seperti tabel database di memori. Hasil <code>&lt;cfquery&gt;</code> atau <code>queryExecute()</code> berupa query, dan ia bisa pula dibuat tanpa database lewat <code>queryNew()</code> — berguna untuk data contoh atau laporan.</p>'
    },
    {
      type: 'example',
      title: 'Membaca query baris demi baris',
      lang: 'cfml',
      output: false,
      code: `<cfset qProduk = queryNew("id,nama,harga", "integer,varchar,numeric", [
    [1, "Kopi Arabika", 85000],
    [2, "Teh Melati",   45000],
    [3, "Susu UHT",     12000]
])>

<cfoutput query="qProduk">
    <li>#currentRow#. #nama# — Rp #harga#</li>
</cfoutput>

<cfscript>
// dari database sungguhan
q = queryExecute(
    "SELECT id, nama FROM produk WHERE harga > :harga",
    { harga = 50000 },
    { datasource = "appDB" }
);
writeOutput("Jumlah baris: " & q.recordCount & "<br>");

for (var i = 1; i <= q.recordCount; i++) {
    baris = queryGetRow(q, i);        // satu baris berbentuk struct
    writeOutput(baris.nama & "<br>");
}
</cfscript>`,
      explain: [
        '<code>queryNew(kolom, tipe, data)</code> menerima data berupa array of array — satu array per baris.',
        '<code>&lt;cfoutput query="qProduk"&gt;</code> mengulang otomatis tiap baris; kolom langsung bisa dipakai.',
        'Properti <code>recordCount</code> (di Lucee juga <code>rowCount</code>) menyimpan jumlah baris, dan <code>currentRow</code> nomor baris aktif.',
        '<code>queryGetRow(q, i)</code> mengubah satu baris menjadi struct, memudahkan akses bernama kolom.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memilih &amp; Mengonversi Struktur Data</h3><p>Aturan praktisnya: butuh posisi dan urutan → <b>array</b>; butuh nama kunci → <b>struct</b>; hasil tabel SQL yang dibaca baris demi baris → <b>query</b>. Ketiganya saling mengonversi, dan format antarmuka modern (JSON) paling nyaman menerima array of struct.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Tiga struktur data CFML beserta karakteristiknya">
        <text x="140" y="40" class="u-sub" text-anchor="middle">Array — urutan penting</text>
        <rect x="30" y="56" width="220" height="104" rx="8" class="u-box"/>
        <text x="140" y="86" class="u-title" text-anchor="middle">["Kopi", "Teh"]</text>
        <text x="140" y="112" class="u-lbl" text-anchor="middle">akses: data[1] — indeks 1-based</text>
        <text x="140" y="136" class="u-lbl" text-anchor="middle">arrayLen · arrayAppend · arrayMap</text>
        <text x="380" y="40" class="u-sub" text-anchor="middle">Struct — kunci penting</text>
        <rect x="270" y="56" width="220" height="104" rx="8" class="u-hd"/>
        <text x="380" y="86" class="u-title" text-anchor="middle">{ "nama": "Kopi" }</text>
        <text x="380" y="112" class="u-lbl" text-anchor="middle">akses: data.nama / data["nama"]</text>
        <text x="380" y="136" class="u-lbl" text-anchor="middle">structKeyExists · structCount · structDelete</text>
        <text x="620" y="40" class="u-sub" text-anchor="middle">Query — baris &amp; kolom</text>
        <rect x="510" y="56" width="220" height="104" rx="8" class="u-box"/>
        <text x="620" y="86" class="u-title" text-anchor="middle">id | nama | harga</text>
        <text x="620" y="112" class="u-lbl" text-anchor="middle">akses: q.nama · recordCount</text>
        <text x="620" y="136" class="u-lbl" text-anchor="middle">queryGetRow · cfloop query</text>
        <text x="380" y="200" class="u-lbl" text-anchor="middle">query → array of struct → serializeJson() adalah jalur paling umum saat menyiapkan data API</text>
        <text x="380" y="224" class="u-lbl" text-anchor="middle">array of struct menggabungkan keduanya: bernomor sekaligus berlabel</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Tiga struktur data utama CFML dan peran masing-masing</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Query → array of struct → JSON',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
// 1. Query menjadi array of struct
rows = [];
for (var i = 1; i <= qProduk.recordCount; i++) {
    arrayAppend(rows, queryGetRow(qProduk, i));
}

// 2. Array menjadi JSON untuk dikirim ke aplikasi
json = serializeJson(rows);
writeOutput(json & "<br>");

// 3. JSON kembali menjadi array of struct
ulang = deserializeJson(json);
writeOutput(ulang[1].nama);          // "Kopi Arabika"
</cfscript>`,
      explain: [
        'Membaca query dengan loop dan <code>queryGetRow</code> menghasilkan array of struct tanpa menyentuh database.',
        '<code>serializeJson()</code> mengubah array/struct menjadi string JSON siap kirim lewat REST API.',
        '<code>deserializeJson()</code> mengembalikan strukturnya — periksa ulang isi sebelum dipakai, data JSON datang dari luar.',
        'Struktur hasil dijaga: <code>ulang[1].nama</code> tetap bekerja karena urutan dan kunci tersimpan.'
      ]
    },
    {
      type: 'warn',
      title: 'Indeks array CFML dimulai dari 1',
      text: 'Elemen pertama array adalah <code>data[1]</code>, bukan <code>data[0]</code>. Kebiasaan dari JavaScript membuatmu melewatkan elemen pertama, dan mengakses posisi setelah <code>arrayLen()</code> memunculkan error <i>index out of bounds</i>. Selalu ukur panjang dengan <code>arrayLen()</code> sebelum mengakses posisi tertentu.'
    },
    {
      type: 'tip',
      title: 'Struktur yang siap JSON',
      text: 'Untuk data yang akan dikirim ke aplikasi atau REST API, biasakan <b>array of struct</b>: tiap elemen adalah satu entitas berlabel sehingga <code>serializeJson()</code> langsung menghasilkan JSON yang enak dikonsumsi. Simpan query sebagai query hanya selama masih diolah di server.'
    },
    {
      type: 'live',
      title: 'Coba sendiri: array & struct',
      lang: 'html',
      hint: 'Simulasi di browser — pola logikanya sama dengan operasi array dan struct di CFML (arrayAppend, structKeyExists, structDelete); kode CFML aslinya hanya bisa dijalankan di server.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Simulasi Array &amp; Struct</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 18px; color: #1e293b; }
  h2 { font-size: 18px; }
  .blok { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
  b { font-size: 14px; }
  pre { margin: 6px 0 0; font-size: 13px; line-height: 1.5; }
</style>
</head>
<body>
<h2>Simulasi array &amp; struct (padanan CFML)</h2>

<div class="blok">
  <b>1. Array: append &amp; baca</b>
  <pre id="out1">Klik Jalankan.</pre>
</div>

<div class="blok">
  <b>2. Struct: baca kunci &amp; hapus kunci</b>
  <pre id="out2">-</pre>
</div>

<div class="blok">
  <b>3. Array of struct</b>
  <pre id="out3">-</pre>
</div>

<script>
// 1. setara: arrayAppend() dan arrayLen() — di CFML indeksnya mulai 1
var keranjang = [];
keranjang.push("Kopi Arabika");
keranjang.push("Teh Melati");
keranjang.push("Susu UHT");
document.getElementById("out1").textContent =
  "isi: [" + keranjang.join(", ") + "]  |  jumlah elemen = " + keranjang.length;

// 2. setara: akses .kunci, structKeyExists(), structDelete(), structCount()
var produk = { nama: "Kopi Arabika", harga: 85000, tersedia: true };
var adaHarga = "harga" in produk;        // structKeyExists(produk, "harga")
delete produk.tersedia;                  // structDelete(produk, "tersedia")
var sisaKunci = Object.keys(produk).length;
document.getElementById("out2").textContent =
  "nama = " + produk.nama + "  |  ada kunci 'harga'? " + adaHarga +
  "  |  sisa kunci = " + sisaKunci;

// 3. array of struct — pola paling lazim untuk data siap JSON
var daftar = [
  { nama: "Kopi Arabika", harga: 85000 },
  { nama: "Teh Melati", harga: 45000 }
];
var baris = [];
for (var i = 0; i < daftar.length; i++) {
  baris.push((i + 1) + ". " + daftar[i].nama + " - Rp " + daftar[i].harga);
}
document.getElementById("out3").innerHTML = baris.join("<br>");
<\/script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Array', 'Kumpulan nilai bernomor; indeks CFML dimulai dari 1.'],
        ['Struct', 'Kumpulan pasangan kunci–nilai, mirip objek atau dictionary.'],
        ['Query', 'Struktur data bawaan CFML berisi baris &amp; kolom hasil SQL.'],
        ['arrayAppend / arrayLen', 'Menambah satu elemen / menghitung jumlah elemen array.'],
        ['arrayMap / arrayFilter', 'Membuat array baru hasil pemetaan / penyaringan elemen.'],
        ['structKeyExists / structDelete', 'Memeriksa keberadaan kunci / menghapus satu kunci struct.'],
        ['queryGetRow', 'Membaca satu baris query sebagai struct lengkap dengan kolomnya.']
      ]
    }
  ],
  recap: [
    'Array berurutan dengan indeks 1-based; dikelola arrayAppend, arrayLen, arraySlice, arrayMap, arrayFilter, arraySort, dan arrayEach.',
    'Struct menyimpan kunci–nilai; akses dengan data.nama atau data["nama"], plus structKeyExists, structDelete, dan structCount.',
    'Query adalah tabel di memori: baca dengan cfloop query, queryGetRow, recordCount, dan currentRow.',
    'Array of struct menggabungkan nomor dan label — format paling lazim untuk data JSON.',
    'Konversi besar: query → array of struct → serializeJson(); kembali lagi dengan deserializeJson().',
    'Pilih array untuk urutan, struct untuk nama kunci, dan query untuk data tabular dari SQL.'
  ]
});
