/* ============================================================
   Pelajaran Lucee CFML — Bab 2: Fondasi & Dasar (L2)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-sintaks-dasar',
  title: 'Sintaks Dasar: Tag-based vs CFScript',
  chapter: 'Fondasi & Dasar',
  duration: '10 menit',
  intro: [
    'CFML punya dua gaya penulisan yang isinya setara: <b>tag-based</b> yang terasa seperti HTML, dan <b>CFScript</b> yang terasa seperti JavaScript/Java. Keduanya diproses Lucee dengan hasil akhir sama persis.',
    'Pelajaran ini mengajak kamu mengenali kedua gaya, cara berkomentar, cara mengeluarkan output, serta aturan atribut tag — bekal sebelum masuk ke variabel dan perulangan.'
  ],
  objectives: [
    'Membedakan penulisan tag-based dan CFScript',
    'Menulis komentar pada kedua gaya sintaks',
    'Mengeluarkan output dengan #expression# dan writeOutput()',
    'Memahami cara kerja atribut tag dan padanannya di cfscript',
    'Memilih gaya penulisan yang tepat sesuai situasi',
    'Menerapkan konvensi penulisan kode CFML'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua Gaya, Satu Bahasa</h3><p><b>Tag-based</b> memakai pasangan tag seperti <code>&lt;cfset&gt;</code> dan <code>&lt;cfif&gt;</code> yang tertanam di antara HTML. <b>CFScript</b> memakai pernyataan bersimbol seperti <code>=</code>, <code>if (...) { }</code>, dan dipisah titik-koma — dibungkus blok <code>&lt;cfscript&gt;</code> bila berada di dalam halaman <code>.cfm</code>.</p><p>Kabar baiknya: kamu tidak perlu memilih salah satu selamanya. Banyak proyek memakai cfscript untuk logika dan tag untuk bagian yang penuh HTML.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 280" width="760" role="img" aria-label="Perbandingan gaya tag-based dan cfscript">
        <defs><marker id="mk-l02-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="280" y="30" width="200" height="52" rx="8" class="u-box"/>
        <text x="380" y="52" class="u-title" text-anchor="middle">Halaman .cfm</text>
        <text x="380" y="72" class="u-lbl" text-anchor="middle">satu file, dua gaya</text>
        <line x1="330" y1="84" x2="240" y2="126" class="u-line" marker-end="url(#mk-l02-1)"/>
        <line x1="430" y1="84" x2="520" y2="126" class="u-line" marker-end="url(#mk-l02-1)"/>
        <rect x="60" y="130" width="280" height="96" rx="8" class="u-hd"/>
        <text x="200" y="154" class="u-title" text-anchor="middle">Tag-based</text>
        <text x="80" y="180" class="u-lbl">&lt;cfset total = 150000&gt;</text>
        <text x="80" y="202" class="u-lbl">&lt;cfif total gte 100000&gt;</text>
        <rect x="420" y="130" width="280" height="96" rx="8" class="u-hd"/>
        <text x="560" y="154" class="u-title" text-anchor="middle">CFScript</text>
        <text x="440" y="180" class="u-lbl">total = 150000;</text>
        <text x="440" y="202" class="u-lbl">if (total &gt;= 100000) {</text>
        <text x="380" y="258" class="u-lbl" text-anchor="middle">kedua gaya menghasilkan HTML yang sama — pilih mengikuti gaya tim kamu</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Satu logika yang sama ditulis dengan dua gaya sintaks CFML</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Gaya tag-based: diskon toko',
      lang: 'cfml',
      output: false,
      code: `<cfset namaToko = "Toko Berkah">
<cfset total = 150000>

<cfif total gte 100000>
    <cfset diskon = total * 0.1>
<cfelse>
    <cfset diskon = 0>
</cfif>

<cfoutput>
    <p>#namaToko# — total #total#, diskon #diskon#</p>
</cfoutput>`,
      explain: [
        '<code>&lt;cfset&gt;</code> menaruh nilai ke variabel, setara tanda <code>=</code> di bahasa skrip.',
        '<code>&lt;cfif&gt;</code> selalu ditutup <code>&lt;/cfif&gt;</code>; percabangan lanjutan memakai <code>&lt;cfelseif&gt;</code> dan <code>&lt;cfelse&gt;</code>.',
        'Isi tag <code>cfoutput</code> adalah tempat ekspresi <code>#...#</code> diganti nilainya.',
        'Spasi dan baris kosong di template bebas — Lucee hanya mengirim teks biasa ke browser.'
      ]
    },
    {
      type: 'example',
      title: 'Gaya cfscript: logika yang sama',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
namaToko = "Toko Berkah";
total = 150000;

if (total >= 100000) {
    diskon = total * 0.1;
} else {
    diskon = 0;
}

writeOutput("<p>" & namaToko & " — total " & total & ", diskon " & diskon & "</p>");
</cfscript>`,
      explain: [
        'Seluruh isi ditulis di dalam satu blok <code>&lt;cfscript&gt; ... &lt;/cfscript&gt;</code>.',
        'Pernyataan diakhiri titik-koma <code>;</code> — wajib, bukan sekadar pajangan.',
        'Operator penggabung teks di CFML adalah <code>&amp;</code>, bukan <code>+</code>.',
        'Komponen <code>.cfc</code> berisi cfscript murni tanpa perlu tag pembungkus.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Komentar</h3><p>Komentar tidak dievaluasi dan tidak pernah terkirim ke browser. Tag-based memakai <code>&lt;!--- ---&gt;</code> (tiga tanda hubung, bukan dua seperti komentar HTML), sedangkan cfscript memakai <code>//</code> untuk satu baris dan <code>/* */</code> untuk blok.</p>'
    },
    {
      type: 'example',
      title: 'Bentuk komentar di kedua gaya',
      lang: 'cfml',
      output: false,
      code: `<!--- Komentar tag-based: aman, tidak tampil di browser --->
<cfoutput>
    <!--- #produk# tidak dievaluasi karena berada di komentar --->
    <p>Baris ini tetap terlihat</p>
</cfoutput>

<cfscript>
// Komentar satu baris
/* Komentar
   multi baris */
total = 100000; // komentar di akhir baris
</cfscript>`,
      explain: [
        'Perhatikan tiga tanda hubung <code>&lt;!--- ---&gt;</code> — komentar HTML biasa <code>&lt;!-- --&gt;</code> juga valid, tapi gaya CFML memakai tiga.',
        'Isi <code>#...#</code> di dalam komentar CFML tidak dievaluasi, jadi aman untuk catatan debug.',
        'Komentar cfscript persis seperti JavaScript, sehingga mudah dipindahkan ke berkas .cfc.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengeluarkan Output</h3><p>Ada dua cara utama. Pertama, tulis ekspresi <code>#expression#</code> di dalam <code>&lt;cfoutput&gt;</code>; Lucee akan menggantinya dengan nilainya. Kedua, panggil <code>writeOutput()</code> dari cfscript. Keduanya menghasilkan teks yang sama di halaman.</p>'
    },
    {
      type: 'example',
      title: 'Dua cara mengeluarkan output',
      lang: 'cfml',
      output: false,
      code: `<cfset produk = "Kopi Arabika">
<cfset harga = 85000>

<cfoutput>
    <p>Produk: #produk# — Rp #harga#</p>
</cfoutput>

<cfscript>
writeOutput("<p>Harga per kilo: Rp " & harga & "</p>");
</cfscript>`,
      explain: [
        'Nilai variabel <code>produk</code> dan <code>harga</code> disuntikkan langsung ke dalam HTML.',
        'Di luar <code>cfoutput</code>, blok berisi <code>#...#</code> tidak menampilkan hasilnya dengan benar.',
        '<code>writeOutput()</code> berguna saat logika cfscript perlu menyisipkan potongan HTML kecil.'
      ]
    },
    {
      type: 'warn',
      title: 'Tanda # adalah karakter spesial',
      text: 'Pasangan <code>#...#</code> selalu dievaluasi Lucee sebagai ekspresi. Pasangan yang tidak lengkap membuat Lucee mencoba membaca "variabel" ngawur sampai memunculkan error aneh. Untuk menampilkan tanda # apa adanya (misalnya hashtag), tulis <code>##</code> — Lucee akan mengubahnya menjadi satu karakter #.'
    },
    {
      type: 'text',
      html: '<h3>Atribut Tag</h3><p>Setiap tag CFML menerima <b>atribut</b>: pasangan nama dan nilai di dalam tanda kutip, mirip atribut HTML. Di cfscript tidak ada atribut — informasi yang sama disampaikan lewat parameter fungsi atau pernyataan khusus seperti <code>param</code> dan <code>include</code>.</p>'
    },
    {
      type: 'example',
      title: 'Atribut tag dan padanan cfscript',
      lang: 'cfml',
      output: false,
      code: `<!--- Gaya tag: informasi lewat atribut --->
<cfparam name="url.id" default="0">
<cfinclude template="header.cfm">
<cfquery name="qProduk" datasource="appDB" maxrows="10">
    SELECT id, nama FROM produk ORDER BY nama
</cfquery>

<cfscript>
// Padanan cfscript: pernyataan dan pemanggilan fungsi
param name = "url.id" default = "0";
include "header.cfm";
qProduk = queryExecute(
    "SELECT id, nama FROM produk ORDER BY nama",
    {},
    { datasource = "appDB", maxrows = 10 }
);
</cfscript>`,
      explain: [
        '<code>name</code>, <code>default</code>, <code>template</code>, dan <code>datasource</code> semuanya adalah atribut tag.',
        'Hasil query disimpan ke variabel bernama <code>qProduk</code> lewat atribut <code>name</code>.',
        '<code>queryExecute(sql, params, options)</code> memakai struct sebagai wadah options — <code>{ datasource = "appDB" }</code> setara atribut <code>datasource</code>.',
        'Pernyataan <code>param name = ... default = ...;</code> di cfscript adalah padanan persis <code>&lt;cfparam&gt;</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Memilih Satu Gaya?</h3><ul><li><b>Tag-based</b> — saat isi halaman didominasi HTML: template cetak, email notifikasi, halaman laporan.</li><li><b>CFScript</b> — saat logika mendominasi: fungsi, komponen <code>.cfc</code>, perhitungan, dan manipulasi data.</li><li><b>Jangan campur aduk dalam satu blok kecil</b> — pilih satu gaya per blok agar mudah dibaca; dua gaya dalam satu file tetap wajar.</li></ul><p>Untuk konvensi penulisan, ikuti aturan tim. Bila belum ada, pakai pola umum di bawah.</p>'
    },
    {
      type: 'tip',
      title: 'Konvensi penulisan yang lazim',
      text: 'Indentasi 4 spasi (bukan tab). Variabel dan fungsi memakai <i>camelCase</i> (<code>totalHarga</code>), komponen <code>.cfc</code> memakai <i>PascalCase</i> (<code>Keranjang.cfc</code>), nama berkas huruf kecil (<code>daftar.cfm</code>). Di dalam fungsi, awali deklarasi dengan <code>var</code> atau tulis <code>local.</code> agar variabel tidak bocor ke scope global.'
    },
    {
      type: 'vocab',
      items: [
        ['Tag-based', 'Gaya menulis CFML dengan sintaks mirip HTML, misal &lt;cfset&gt; dan &lt;cfif&gt;.'],
        ['CFScript', 'Gaya skrip mirip JavaScript/Java; dibungkus &lt;cfscript&gt; bila berada di halaman .cfm.'],
        ['cfoutput', 'Tag penanda blok tempat ekspresi #...# dievaluasi dan ditampilkan.'],
        ['Atribut', 'Pasangan nama=nilai di dalam tag, misal datasource="appDB".'],
        ['Komentar', 'Catatan pengembang yang tidak dievaluasi: &lt;!--- ---&gt;, //, dan /* */.'],
        ['writeOutput()', 'Fungsi cfscript untuk mengeluarkan teks, setara ekspresi #...#.'],
        ['cfparam', 'Tag penyiap nilai default bila sebuah variabel belum ada.']
      ]
    }
  ],
  recap: [
    'CFML punya dua gaya setara: tag-based (mirip HTML) dan CFScript (mirip JavaScript).',
    'Blok cfscript memakai titik-koma dan operator &amp; untuk menggabungkan teks.',
    'Komentar CFML memakai &lt;!--- ---&gt; di template, // dan /* */ di cfscript.',
    'Output dihasilkan lewat #expression# di dalam cfoutput atau writeOutput().',
    'Atribut tag hanya ada di gaya tag; cfscript memakai parameter fungsi dan options struct.',
    'Pilih gaya per blok, jangan campur dalam satu blok, dan konsisten mengikuti konvensi tim.'
  ]
});
