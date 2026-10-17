/* ============================================================
   Pelajaran Lucee CFML — Bab 11: Modularisasi (L11)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-modularisasi',
  title: 'Modularisasi: cfinclude & cfmodule',
  chapter: 'Data & Menengah',
  duration: '10 menit',
  intro: [
    'Halaman web nyata — misalnya toko online — hampir selalu membagi bagian yang sama di banyak halaman: header berisi logo dan menu, footer berisi copyright, kadang juga sidebar dan kotak notifikasi. Menyalin potongan yang sama ke puluhan file .cfm membuat satu perubahan kecil berubah jadi pekerjaan berulang dan rawan salah.',
    'CFML menyediakan dua alat modularisasi: <b>cfinclude</b> untuk menyisipkan potongan halaman, dan <b>cfmodule</b> untuk memanggil modul yang bisa dipakai ulang di banyak proyek. Keduanya mengeksekusi kode file lain tepat di tengah halaman yang sedang berjalan.',
    'Pelajaran ini membahas cara memakai keduanya, mengatur nilai default dengan cfparam, mengatur path dan mapping, serta jebakan scope dan performa yang sering tidak disadari.'
  ],
  objectives: [
    'Memecah halaman besar menjadi potongan yang bisa dipakai ulang dengan cfinclude',
    'Memberi nilai default variabel memakai cfparam dan param',
    'Membuat modul portabel dengan cfmodule dan scope attributes',
    'Mengatur path absolut serta this.mappings agar include tidak mudah patah',
    'Mengenali perangkap scope dan dampak performa include berulang'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Halaman Perlu Dipecah?</h3><p>Bayangkan aplikasi toko kamu punya 30 halaman, dan menu "Beranda, Katalog, Keranjang, Kontak" muncul di semuanya. Kalau kamu menyalinnya 30 kali, satu perubahan nama menu berarti membuka 30 file. Dengan modularisasi, menu hanya ditulis sekali di file terpisah lalu <b>disisipkan</b> (include) ke setiap halaman.</p><p>Prinsipnya sederhana: potongan yang berulang keluar dari halaman utama, halaman utama tinggal memanggilnya. Selama request berjalan, file yang di-include dieksekusi <b>tepat di posisi pemanggilan</b> — seolah kodenya memang ada di situ.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 230" width="760" role="img" aria-label="Alur include header dan footer dari halaman produk.cfm">
        <defs><marker id="mk-l11-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="30" y="70" width="200" height="80" rx="8" class="u-hd"/>
        <text x="130" y="102" class="u-title" text-anchor="middle">produk.cfm</text>
        <text x="130" y="124" class="u-lbl" text-anchor="middle">halaman katalog</text>
        <line x1="235" y1="95" x2="330" y2="55" class="u-line" marker-end="url(#mk-l11-1)"/>
        <text x="285" y="72" class="u-lbl" text-anchor="middle">include awal</text>
        <line x1="235" y1="125" x2="330" y2="165" class="u-line" marker-end="url(#mk-l11-1)"/>
        <text x="285" y="160" class="u-lbl" text-anchor="middle">include akhir</text>
        <rect x="335" y="25" width="210" height="60" rx="8" class="u-box"/>
        <text x="440" y="50" class="u-title" text-anchor="middle">includes/header.cfm</text>
        <text x="440" y="70" class="u-lbl" text-anchor="middle">logo, menu, CSS</text>
        <rect x="335" y="135" width="210" height="60" rx="8" class="u-box"/>
        <text x="440" y="160" class="u-title" text-anchor="middle">includes/footer.cfm</text>
        <text x="440" y="180" class="u-lbl" text-anchor="middle">copyright, JS bawah</text>
        <text x="575" y="105" class="u-lbl">Kedua file dieksekusi</text>
        <text x="575" y="122" class="u-lbl">tepat di posisi</text>
        <text x="575" y="139" class="u-lbl">pemanggilan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 11.1</b> — Satu halaman menyusun dirinya dari beberapa file lewat cfinclude</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menyisipkan header & footer dengan cfinclude',
      lang: 'cfml',
      output: false,
      code: `<!-- gaya tag: produk.cfm -->
<cfinclude template="/includes/header.cfm">

  <h1>Katalog Produk</h1>
  <!-- konten halaman tampil di sini -->

<cfinclude template="/includes/footer.cfm">

<!-- gaya script: hasilnya identik -->
<cfscript>
include "/includes/header.cfm";
writeOutput("<h1>Katalog Produk</h1>");
include "/includes/footer.cfm";
</cfscript>`,
      explain: [
        'Path yang diawali garis miring dianggap absolut terhadap web root aplikasi.',
        'Versi script memakai pernyataan <code>include "path"</code> — ekuivalen penuh dengan tag cfinclude.',
        'Semua output file include bercampur dengan output halaman di posisi pemanggilan.',
        'Karena berjalan di request yang sama, file include bisa membaca variabel yang sudah ada di halaman.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Meneruskan Nilai Default dengan cfparam</h3><p>File <code>header.cfm</code> butuh variabel judul halaman. Kalau halaman induk lupa menyetelnya, header akan gagal dengan error "variabel tidak ditemukan". <b>cfparam</b> mencegah itu: ia memberi nilai default <b>hanya bila variabel belum terdefinisi</b>, dan tidak pernah menimpa nilai yang sudah ada.</p>'
    },
    {
      type: 'example',
      title: 'Nilai default dengan cfparam / param',
      lang: 'cfml',
      output: false,
      code: `<!-- includes/header.cfm -->
<cfparam name="variables.judulHalaman" default="Toko Kopi Nusantara">
<cfparam name="variables.menuAktif" default="beranda">

<!DOCTYPE html>
<html lang="id">
<head>
  <title><cfoutput>#variables.judulHalaman#</cfoutput></title>
</head>
<body>
  <nav>
    <b>Kopi Nusantara</b> &middot; Katalog &middot; Keranjang &middot; Kontak
  </nav>

<!-- gaya script — bekerja sama persis -->
<cfscript>
param name="variables.judulHalaman" default="Toko Kopi Nusantara";
param name="variables.menuAktif"    default="beranda";
</cfscript>`,
      explain: [
        'Nama pada atribut <code>name</code> harus lengkap sampai scope, mis. <code>variables.judulHalaman</code>.',
        'Bila halaman induk sudah menyetel judulHalaman, nilai default ini dilewati.',
        'Pernyataan <code>param</code> adalah versi script dari cfparam.',
        'cfparam juga bisa membatasi tipe data, mis. <code>type="numeric"</code>, agar salah kirim nilai cepat ketahuan.'
      ]
    },
    {
      type: 'tip',
      title: 'Atur nilai di halaman induk, bukan di file include',
      text: 'Tentukan judul tiap halaman <b>sebelum</b> tag include, mis. <code>&lt;cfset variables.judulHalaman = "Katalog — Toko Kopi"&gt;</code>. cfparam di header.cfm kemudian hanya berperan sebagai jaring pengaman saat kamu lupa mengaturnya.'
    },
    {
      type: 'text',
      html: '<h3>Modul Portabel dengan cfmodule</h3><p>cfinclude selalu menunjuk file tertentu. Kalau kamu ingin kartu produk yang bisa dipakai di banyak proyek — dan dipasang berkali-kali dalam satu halaman dengan parameter berbeda — pakai <b>cfmodule</b>. Modul menerima parameter lewat atribut, lalu membacanya dari scope <b>attributes</b>.</p><p>Dua cara memanggil: atribut <code>template</code> menunjuk path file langsung; atribut <code>name</code> memakai notasi titik yang dicari pada jalur custom tag — proyek lain cukup menyalin folder modul tanpa mengubah kode halaman.</p>'
    },
    {
      type: 'example',
      title: 'Kartu produk sebagai modul cfmodule',
      lang: 'cfml',
      output: false,
      code: `<!-- pemakaian: dua kartu dengan parameter berbeda -->
<cfmodule template="/layouts/modul/kartuProduk.cfm"
          nama="Kopi Gayo" harga="85000" stok="12">
<cfmodule template="/layouts/modul/kartuProduk.cfm"
          nama="Kopi Toraja" harga="92000" stok="0">

<!-- versi name — path dicari dengan notasi titik di jalur custom tag -->
<cfmodule name="modul.kartuProduk" nama="Kopi Kintamani" harga="78000" stok="5">

<!-- layouts/modul/kartuProduk.cfm — isi modul -->
<div class="kartu">
  <h3><cfoutput>#attributes.nama#</cfoutput></h3>
  <p>Rp <cfoutput>#numberFormat(attributes.harga, ",")#</cfoutput></p>
  <cfif attributes.stok GT 0>
    <span>Tersedia (<cfoutput>#attributes.stok#</cfoutput>)</span>
  <cfelse>
    <span>Habis</span>
  </cfif>
</div>`,
      explain: [
        'Setiap pemanggilan cfmodule membuat salinan <b>attributes</b> sendiri — dua kartu tidak saling menimpa.',
        'Kode modul tidak tahu-menahu siapa yang memanggil; ia hanya membaca atribut yang diberikan.',
        'Memakai <code>name</code> membuat modul mudah dipindah antar proyek: cukup salin folder custom tag.',
        'Modul yang sama bisa dipasang berkali-kali dalam satu halaman.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Relative, Absolute, dan this.mappings</h3><p>Path include yang menunjuk folder fisik membuat kode rapuh: pindah folder, patah semua. <b>this.mappings</b> di Application.cfc menerjemahkan path virtual ke folder fisik — halaman cukup tahu nama virtualnya, lokasi fisik diatur di satu tempat.</p>'
    },
    {
      type: 'example',
      title: 'Mapping path virtual di Application.cfc',
      lang: 'cfml',
      output: false,
      code: `<!-- Application.cfc — konfigurasi sekali di sini -->
component {
  this.name = "TokoKopi";
  this.mappings = {
    "/layouts": expandPath("/layouts"),
    "/modul"   : expandPath("/customtags/modul")
  };
}

<!-- pemakaian — path virtual di atas dipakai di mana saja -->
<cfinclude template="/layouts/header.cfm">
<cfmodule template="/modul/kartuProduk.cfm" nama="Kopi Gayo" harga="85000" stok="12">`,
      explain: [
        '<code>expandPath("/layouts")</code> menerjemahkan path virtual menjadi lokasi folder fisik di disk.',
        'Mapping dipakai di cfinclude, cfmodule, bahkan createObject — satu definisi untuk banyak keperluan.',
        'Struktur folder boleh berubah, cukup perbarui satu baris mapping.',
        'Mapping lain yang umum: menunjuk folder komponen agar <code>new models.Pegawai()</code> tidak perlu path panjang.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan bermain dengan path relatif',
      text: 'Menulis <code>cfinclude template="header.cfm"</code> tanpa garis miring di depan membuat path diselesaikan relatif terhadap lokasi file pemanggil. Saat halaman dipindah ke subfolder, include yang dulu lancar mendadak gagal. Tulis selalu path absolut dari web root, atau lewat <code>this.mappings</code>.'
    },
    {
      type: 'text',
      html: '<h3>Struktur Folder &amp; Pertimbangan Performa</h3><p>Tempatkan file sesuai perannya, bukan menumpuk semua di root. Pola yang lazim di proyek CFML:</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder yang disarankan',
      lang: 'text',
      output: false,
      code: `/app
├── Application.cfc        konfigurasi & lifecycle (bab berikutnya)
├── index.cfm              halaman utama
├── produk.cfm             halaman katalog
├── includes/              potongan halaman: cfinclude
│   ├── header.cfm
│   └── footer.cfm
├── customtags/            modul portabel: cfmodule (notasi titik)
│   └── modul/
│       └── kartuProduk.cfm
├── layouts/               kerangka halaman utuh
│   └── dashboard.cfm
└── components/            CFC bisnis & data (bab OOP)`,
      explain: [
        '<b>includes/</b> untuk potongan kecil yang dipanggil cfinclude pada halaman tertentu.',
        '<b>customtags/</b> untuk modul cfmodule yang bersifat portabel antar proyek.',
        '<b>layouts/</b> untuk kerangka halaman utuh (mis. tata letak dashboard).',
        'Pisahkan components/ sejak awal — CFC tidak boleh ikut ter-expose sebagai halaman.'
      ]
    },
    {
      type: 'warn',
      title: 'Scope yang sama: include bisa menabrak variabel',
      text: 'File include berjalan di scope yang sama dengan halaman induk. Variabel bernama <code>total</code> yang dibuat di header.cfm langsung terlihat di footer.cfm — dan bisa tanpa sengaja menimpa variabel halaman. Beri prefix pada variabel include (mis. <code>inc_total</code>), atau simpan data include di satu variabel struct khusus agar tidak bocor.'
    },
    {
      type: 'tip',
      title: 'Seberapa mahal include?',
      text: 'Include header/footer berkali-kali tiap request sangat murah — hanya mengeksekusi file kecil. Yang boros: include berantai (include memanggil include yang memanggil include) dan include file besar berulang. Bila potongan benar-benar statis, simpan hasilnya sekali di application scope lalu tuliskan dari sana.'
    },
    {
      type: 'vocab',
      items: [
        ['cfinclude', 'Tag/script untuk menyisipkan dan mengeksekusi file CFML lain di posisi pemanggilan.'],
        ['cfmodule', 'Memanggil modul lewat atribut template (path) atau name (notasi titik), dengan parameter di scope attributes.'],
        ['scope attributes', 'Tempat parameter cfmodule dibaca di dalam modul.'],
        ['cfparam / param', 'Memberi nilai default pada variabel yang belum terdefinisi.'],
        ['this.mappings', 'Property Application.cfc yang menerjemahkan path virtual ke folder fisik.'],
        ['Kebocoran scope', 'Variabel dari file include yang tidak sengaja menimpa variabel halaman induk.'],
        ['Custom tag path', 'Jalur folder tempat cfmodule mencari modul berdasar notasi titik.']
      ]
    }
  ],
  recap: [
    'cfinclude menyisipkan file di posisi pemanggilan; tulis path absolut agar tidak mudah patah.',
    'cfparam / param memberi nilai default — pasang di file include sebagai jaring pengaman.',
    'cfmodule + scope attributes untuk modul portabel; name memakai notasi titik di jalur custom tag.',
    'this.mappings menerjemahkan path virtual sehingga struktur folder bisa berubah tanpa menyentuh halaman.',
    'Include berjalan di scope yang sama dengan halaman induk — beri nama variabel hati-hati agar tidak bocor.',
    'Include kecil berulang murah; hindari include berantai dan potongan statis yang sama berulang-ulang.'
  ]
});
