/* ============================================================
   Pelajaran Lucee CFML — Bab 4: Fondasi & Dasar (L4)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-kontrol-perulangan',
  title: 'Percabangan & Perulangan',
  chapter: 'Fondasi & Dasar',
  duration: '12 menit',
  intro: [
    'Aplikasi toko online harus bisa memutus: apakah pembeli berhak diskon, apakah stok cukup, kapan pesanan dianggap terlambat. Semua keputusan itu ditulis dengan <b>percabangan</b>, sedangkan pekerjaan berulang (mencetak ratusan baris nota, menghitung total keranjang) ditulis dengan <b>perulangan</b>.',
    'Pelajaran ini membahas keduanya dalam dua gaya — tag dan cfscript — plus operator perbandingan khas CFML, loop atas query/array/struct, serta perangkap loop tak berujung.'
  ],
  objectives: [
    'Menulis percabangan dengan cfif dan if/else if/else',
    'Memakai operator perbandingan word dan simbol dengan tepat',
    'Menggunakan cfswitch untuk percabangan satu nilai',
    'Menulis perulangan for, while, dan for...in',
    'Mengulang isi array, struct, dan query',
    'Menggunakan break/continue dan menghindari loop tak berujung'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Percabangan dengan cfif</h3><p>Tag <code>&lt;cfif&gt;</code> mengecek satu kondisi, lalu menjalankan blok di dalamnya bila kondisi bernilai benar. Cabang lanjutan ditulis dengan <code>&lt;cfelseif&gt;</code> dan penutup <code>&lt;cfelse&gt;</code>. Di cfscript bentuknya persis JavaScript: <code>if</code>, <code>else if</code>, <code>else</code>.</p>'
    },
    {
      type: 'example',
      title: 'Diskon member: gaya tag',
      lang: 'cfml',
      output: false,
      code: `<cfset totalBelanja = 250000>
<cfset tipeMember = "gold">
<cfif totalBelanja gte 500000>
    <cfset diskon = 0.15>
<cfelseif totalBelanja gte 200000>
    <cfset diskon = 0.1>
<cfelse>
    <cfset diskon = 0>
</cfif>
<cfif tipeMember eq "gold">
    <cfset bonusPoin = 500>
</cfif>
<cfoutput>
    <p>Diskon #(diskon * 100)#%, poin #bonusPoin#</p>
</cfoutput>`,
      explain: [
        'Urutan cabang diperiksa dari atas; begitu ada yang benar, sisanya dilewati.',
        'Karena 250.000 memenuhi <code>gte 200000</code>, <code>diskon</code> menjadi 0.1 (10%).',
        'Kurung <code>#(diskon * 100)#</code> dipakai agar ekspresi matematika dibaca utuh.',
        'Percabangan kedua berdiri sendiri — <code>bonusPoin</code> tidak terpengaruh nilai <code>diskon</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Logika yang sama dengan cfscript',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
totalBelanja = 250000;
tipeMember = "gold";
if (totalBelanja >= 500000) {
    diskon = 0.15;
} else if (totalBelanja >= 200000) {
    diskon = 0.1;
} else {
    diskon = 0;
}
bonusPoin = (tipeMember == "gold") ? 500 : 100;
</cfscript>`,
      explain: [
        'Perhatikan titik-koma dan kurung kurawal — gaya ini dipakai di seluruh berkas <code>.cfc</code>.',
        'Operator <code>&gt;=</code> setara <code>gte</code>; keduanya sah di cfscript.',
        'Baris terakhir memakai ternary <code>? :</code> untuk percabangan satu baris yang ringkas.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Operator Perbandingan CFML</h3><p>CFML punya operator berbahasa Inggris (<i>word operator</i>) yang sudah ada sejak dulu, plus simbol yang akrab bagi pem JavaScript. Keduanya bekerja sama; pilih yang membuat kode paling mudah dibaca tim kamu.</p>'
    },
    {
      type: 'example',
      title: 'Peta operator perbandingan',
      lang: 'text',
      output: false,
      code: `Tulisan CFML   Simbol    Keterangan
-------------  --------  ------------------------------
eq             ==        sama dengan
neq            !=        tidak sama dengan
gt             >         lebih besar dari
gte            >=        lebih besar atau sama dengan
lt             <         lebih kecil dari
lte            <=        lebih kecil atau sama dengan
and            &&        dan — dua-duanya harus benar
or             ||        atau — salah satu cukup benar
not            !         menyangkal kondisi`,
      explain: [
        'Contoh: <code>total gte 200000 and tipeMember eq "gold"</code> memakai gaya word.',
        'Contoh setara: <code>total &gt;= 200000 and tipeMember == "gold"</code> memakai simbol.',
        'Operator gabungan seperti <code>and</code>, <code>or</code>, dan <code>not</code> berlaku di kedua gaya.'
      ]
    },
    {
      type: 'warn',
      title: 'eq membandingkan sebagai angka bila keduanya terbaca numerik',
      text: 'String yang tampak seperti angka diperlakukan sebagai angka: <code>"10" lt "9"</code> bernilai <b>false</b> karena dibaca 10 &lt; 9. Untuk perbandingan string eksak (kode pos, SKU), pakai <code>compare()</code>. Sebaliknya, simbol <code>&lt;</code> bisa bentrok dengan parser di tengah template HTML — di dalam tag, tulisan <code>lt</code>/<code>gt</code> selalu aman.'
    },
    {
      type: 'text',
      html: '<h3>Percabangan switch</h3><p>Ketika satu nilai dibandingkan dengan banyak kemungkinan status, <code>&lt;cfswitch&gt;</code> lebih rapi daripada rantai cfif. Tiap kemungkinan ditulis <code>&lt;cfcase&gt;</code>, dan <code>&lt;cfdefaultcase&gt;</code> menangkap sisanya. Di cfscript bentuknya <code>switch</code>/<code>case</code>/<code>default</code> yang selalu ditutup <code>break</code>.</p>'
    },
    {
      type: 'example',
      title: 'Status pesanan dengan cfswitch',
      lang: 'cfml',
      output: false,
      code: `<cfset status = "dikirim">
<cfswitch value="#status#">
    <cfcase value="baru">
        <cfset ket = "Menunggu pembayaran">
    </cfcase>
    <cfcase value="dikirim">
        <cfset ket = "Barang dalam perjalanan">
    </cfcase>
    <cfcase value="selesai">
        <cfset ket = "Barang sudah diterima">
    </cfcase>
    <cfdefaultcase>
        <cfset ket = "Status tidak dikenal">
    </cfdefaultcase>
</cfswitch>
<cfoutput><p>Status: #ket#</p></cfoutput>`,
      explain: [
        '<code>value</code> adalah nilai yang dibandingkan; tiap <code>cfcase</code> menyimpan satu kemungkinan.',
        'Nilai "dikirim" cocok pada cabang kedua sehingga <code>ket</code> diisi dari sana.',
        '<code>cfdefaultcase</code> penting agar status tak dikenal tidak berujung variabel kosong.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Perulangan</h3><p><code>&lt;cfloop&gt;</code> adalah satu-satunya tag perulangan, tapi mendukung banyak gaya: rentang angka (<code>from</code>/<code>to</code>/<code>step</code>), kondisi (<code>condition</code>), serta iterasi atas array, struct, dan query. Di cfscript kamu punya <code>for</code>, <code>while</code>, dan <code>for...in</code> yang familier.</p>'
    },
    {
      type: 'example',
      title: 'Loop angka dengan cfloop',
      lang: 'cfml',
      output: false,
      code: `<cfloop from="1" to="5" index="i">
    <cfoutput><p>Baris ke-#i#</p></cfoutput>
</cfloop>
<cfloop from="10" to="20" step="5" index="n">
    <cfoutput><p>Nilai: #n#</p></cfoutput>
</cfloop>
<cfset total = 0>
<cfloop condition="total lt 100">
    <cfset total = total + 10>
</cfloop>`,
      explain: [
        '<code>index</code> menampung nomor iterasi; tanpa <code>step</code> ia naik 1 per 1.',
        'Loop kedua menghasilkan 10, 15, dan 20 karena langkahnya 5.',
        '<code>condition</code> membuat cfloop bekerja seperti while: diulang selama kondisi benar.'
      ]
    },
    {
      type: 'example',
      title: 'for, while, dan for...in di cfscript',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
// for klasik: awal, kondisi, penambahan
for (var i = 1; i <= 5; i++) {
    writeOutput("Baris ke-" & i & "<br>");
}
// while: berhenti begitu kondisi tidak terpenuhi
var sisaCicilan = 175000;
while (sisaCicilan > 0) {
    sisaCicilan = sisaCicilan - 50000;
}
// for...in: array memberi nilai, struct memberi kuncinya
var produk = ["Kopi", "Teh", "Susu"];
for (var p in produk) { writeOutput(p & "<br>"); }
var ongkir = { "Jakarta": 5000, "Bandung": 8000 };
for (var kota in ongkir) { writeOutput(kota & ": " & ongkir[kota] & "<br>"); }
</cfscript>`,
      explain: [
        '<code>for (var i = 1; i &lt;= 5; i++)</code> menghasilkan 1 sampai 5, sama dengan cfloop di contoh sebelumnya.',
        'Di dalam while, pastikan <code>sisaCicilan</code> benar-benar berkurang tiap iterasi.',
        '<code>for...in</code> di atas array memberi <b>nilai</b> tiap elemen; di atas struct memberi <b>kuncinya</b>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Loop atas Data &amp; Keluar dari Loop</h3><p>Data di aplikasi nyata berbentuk array produk, struct konfigurasi, atau query hasil database. Ketiganya bisa di-loop langsung. Untuk mengendalikan alur di tengah loop, cfscript memakai <code>break</code> dan <code>continue</code>, sedangkan gaya tag memakai tag <code>&lt;cfbreak&gt;</code> dan <code>&lt;cfcontinue&gt;</code>.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 370" width="760" role="img" aria-label="Diagram alur break dan continue di dalam perulangan">
        <defs><marker id="mk-l04-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="280" y="30" width="200" height="50" rx="8" class="u-box"/><text x="380" y="60" class="u-title" text-anchor="middle">Iterasi ke-i</text>
        <line x1="380" y1="80" x2="380" y2="110" class="u-line" marker-end="url(#mk-l04-1)"/>
        <rect x="280" y="110" width="200" height="50" rx="8" class="u-hd"/><text x="380" y="140" class="u-title" text-anchor="middle">Ada break?</text>
        <line x1="480" y1="135" x2="556" y2="135" class="u-line" marker-end="url(#mk-l04-1)"/><text x="518" y="126" class="u-lbl" text-anchor="middle">ya</text>
        <rect x="560" y="113" width="160" height="44" rx="8" class="u-box"/><text x="640" y="140" class="u-title" text-anchor="middle">Keluar loop</text>
        <line x1="380" y1="160" x2="380" y2="195" class="u-line" marker-end="url(#mk-l04-1)"/><text x="395" y="183" class="u-lbl">tidak</text>
        <rect x="280" y="195" width="200" height="50" rx="8" class="u-hd"/><text x="380" y="225" class="u-title" text-anchor="middle">Ada continue?</text>
        <line x1="480" y1="220" x2="556" y2="220" class="u-line" marker-end="url(#mk-l04-1)"/><text x="518" y="211" class="u-lbl" text-anchor="middle">ya</text>
        <rect x="560" y="198" width="160" height="44" rx="8" class="u-box"/><text x="640" y="225" class="u-title" text-anchor="middle">Lewati sisa blok</text>
        <line x1="380" y1="245" x2="380" y2="280" class="u-line" marker-end="url(#mk-l04-1)"/><text x="395" y="268" class="u-lbl">tidak</text>
        <rect x="280" y="280" width="200" height="50" rx="8" class="u-box"/><text x="380" y="310" class="u-title" text-anchor="middle">Jalankan blok loop</text>
        <path d="M280 305 H190 V55 H276" class="u-dash" fill="none" marker-end="url(#mk-l04-1)"/><text x="112" y="185" class="u-lbl" text-anchor="middle">iterasi berikutnya</text>
        <text x="380" y="358" class="u-lbl" text-anchor="middle">break menghentikan seluruh loop; continue hanya melewati sisa blok iterasi berjalan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Alur sebuah iterasi ketika bertemu break atau continue</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Loop array, struct, query + break/continue',
      lang: 'cfml',
      output: false,
      code: `<cfset keranjang = ["Kopi", "Teh", "Susu"]>
<cfset ongkir = { "Jakarta": 5000, "Bandung": 8000 }>
<cfloop array="#keranjang#" index="item">
    <cfoutput><li>#item#</li></cfoutput>
</cfloop>
<cfloop struct="#ongkir#" key="kota">
    <cfoutput><li>#kota#: Rp #ongkir[kota]#</li></cfoutput>
</cfloop>
<cfloop query="qProduk">
    <cfoutput>#currentRow#. #nama# — Rp #harga#</cfoutput>
</cfloop>
<cfloop from="1" to="10" index="i">
    <cfif i eq 3><cfcontinue></cfif>
    <cfif i gte 8><cfbreak></cfif>
    <cfoutput>#i# </cfoutput>
</cfloop>`,
      explain: [
        'Loop struct menghasilkan pasangan kunci-nilai tanpa perlu membaca panjang data.',
        'Di dalam <code>cfloop query</code>, kolom seperti <code>nama</code> otomatis mengikuti baris aktif, dan <code>currentRow</code> menunjukkan nomor barisnya.',
        'Loop terakhir mencetak "1 2 4 5 6 7": iterasi 3 dilewati <code>cfcontinue</code>, iterasi 8 menghentikan loop lewat <code>cfbreak</code>.',
        'Padanan cfscript: <code>break;</code> dan <code>continue;</code> di dalam for/while.'
      ]
    },
    {
      type: 'warn',
      title: 'Perulangan tak berujung membekukan server',
      text: 'Satu <code>while</code> yang kondisinya tak pernah berubah membuat satu request memakan CPU tanpa henti sampai server terasa macet. Pastikan selalu ada variabel yang bergerak menuju kondisi berhenti, dan pasang pengaman ekstra bila bergantung pada data eksternal — misalnya hitung mundur maksimal 1000 iterasi sebelum memutus.'
    },
    {
      type: 'tip',
      title: 'Pilih loop sesuai datanya',
      text: 'Bila jumlah iterasi sudah diketahui, pakai <code>for</code>/<code>cfloop from</code>. Bila berhentinya bergantung pada kondisi, pakai <code>while</code>/<code>condition</code>. Untuk koleksi, langsung loop array, struct, atau query — jangan loop angka 1 sampai <code>arrayLen()</code> kecuali kamu memang butuh nomor iterasinya.'
    },
    {
      type: 'live',
      title: 'Coba sendiri: hasil perulangan',
      lang: 'html',
      hint: 'Simulasi di browser — pola logikanya sama dengan cfloop/for di CFML; kode CFML aslinya hanya bisa dijalankan di server. Ubah batas atau nilai break, lalu tekan Jalankan.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Simulasi Perulangan</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 18px; color: #1e293b; }
  h2 { font-size: 18px; }
  .blok { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
  b { font-size: 14px; } pre { margin: 6px 0 0; font-size: 13px; line-height: 1.5; }
</style>
</head>
<body>
<h2>Simulasi perulangan (padanan cfloop / for)</h2>
<div class="blok"><b>1. break &amp; continue</b><pre id="out1">Klik Jalankan.</pre></div>
<div class="blok"><b>2. from / to / step</b><pre id="out2">-</pre></div>
<div class="blok"><b>3. condition (while)</b><pre id="out3">-</pre></div>

<script>
// 1. setara: cfloop from=1 to=10 index=i + cfcontinue di 3 + cfbreak di 8
var hasil = [];
for (var i = 1; i <= 10; i++) {
  if (i === 3) continue;   // melompati sisa blok iterasi ini
  if (i === 8) break;      // menghentikan seluruh loop
  hasil.push(i);
}
document.getElementById("out1").textContent =
  "i = 1..10, continue di 3, break di 8  ->  " + hasil.join(", ");

// 2. setara: cfloop from=1 to=20 step=5 index=n
var bertahap = [];
for (var n = 1; n <= 20; n += 5) { bertahap.push(n); }
document.getElementById("out2").textContent =
  "from=1 to=20 step=5  ->  " + bertahap.join(", ");

// 3. setara: cfloop condition="sisa gt 0"
var sisa = 175000, angsuran = 0;
while (sisa > 0) { sisa = sisa - 50000; angsuran = angsuran + 1; }
document.getElementById("out3").textContent =
  "cicil 175000 langkah 50000  ->  " + angsuran + " angsuran, sisa " + sisa;
<\/script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['cfif / cfelseif / cfelse', 'Tag percabangan berjenjang, setara if / else if / else.'],
        ['cfswitch / cfcase', 'Percabangan berdasarkan kesamaan satu nilai, lengkapi cfdefaultcase.'],
        ['Word operator', 'Operator berbahasa Inggris: eq, neq, gt, gte, lt, lte, and, or, not.'],
        ['cfloop', 'Tag perulangan: from/to/step, condition, array, struct, dan query.'],
        ['for...in', 'Perulangan cfscript atas isi array (nilai) atau struct (kunci).'],
        ['cfbreak / cfcontinue', 'Tag keluar dari loop / melompati sisa blok iterasi berjalan.'],
        ['Loop tak berujung', 'Perulangan yang kondisinya tak pernah berubah sehingga tak pernah berhenti.']
      ]
    }
  ],
  recap: [
    'Percabangan ditulis cfif/cfelseif/cfelse atau if/else if/else; switch dipakai untuk satu nilai banyak kemungkinan.',
    'CFML menyediakan word operator (eq, neq, gt, gte, lt, lte, and, or, not) dan simbol (==, !=, &gt;, &gt;=, &lt;, &lt;=, &amp;&amp;, ||, !).',
    'eq/neq membandingkan string numerik sebagai angka; simbol &lt; lebih baik dihindari di tengah template HTML.',
    'cfloop menangani rentang angka, kondisi, array, struct, dan query; cfscript memakai for, while, dan for...in.',
    'break (atau cfbreak) menghentikan seluruh loop; continue (atau cfcontinue) hanya melewati sisa blok iterasi berjalan.',
    'Selalu pastikan kondisi loop pasti berhenti agar tidak membekukan server.'
  ]
});
