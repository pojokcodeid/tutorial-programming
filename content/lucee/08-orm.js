/* ============================================================
   Pelajaran Lucee CFML — Bab 8: Dasar ORM Lucee (Hibernate) (L8)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-orm',
  title: 'Dasar ORM Lucee (Hibernate)',
  chapter: 'Data & Menengah',
  duration: '13 menit',
  intro: [
    'Menulis SQL untuk setiap operasi cepat atau lambat menjadi berat ketika aplikasi tumbuh: puluhan tabel, relasi bertingkat, dan logika yang berulang di mana-mana. <b>ORM</b> (Object-Relational Mapping) menjawab masalah itu dengan memetakan tabel menjadi objek sehingga kamu bekerja dengan objek, bukan baris SQL.',
    'Lucee memakai <b>Hibernate 5.6</b> sebagai mesin ORM-nya. CFC yang ditandai <code>persistent="true"</code> menjadi entity, property-nya menjadi kolom, dan fungsi bawaan seperti <code>entityLoad()</code> serta <code>entitySave()</code> mengurus SQL di balik layar.',
    'Pelajaran ini mengaktifkan ORM untuk aplikasi toko online, membuat entity <code>Produk</code>, lalu menjalankan CRUD, relasi, dan menimbang kapan ORM lebih cocok daripada <code>queryExecute()</code>.'
  ],
  objectives: [
    'Menjelaskan konsep ORM dan manfaatnya',
    'Mengaktifkan ORM melalui Application.cfc',
    'Membuat entity CFC dengan primary key dan tipe data',
    'Menjalankan CRUD dengan entityNew, entitySave, entityLoad, dan entityDelete',
    'Mendeklarasikan relasi one-to-many dan many-to-many',
    'Memilih antara ORM dan queryExecute untuk tiap kebutuhan'
  ],
  sections: [
      {
        type: "text",
        html: "<h3>Apa Itu ORM dan Kenapa Memakainya</h3><p>ORM (Object-Relational Mapping) memetakan baris tabel database ke objek CFML, dan sebaliknya. Alih-alih menulis <code>INSERT</code>/<code>SELECT</code> manual untuk setiap operasi, kamu bekerja dengan entitas seperti <code>produk</code> lalu membiarkan Lucee yang menerjemahkan ke SQL.</p><p>Lucee memakai Hibernate sebagai mesin ORM di belakang layar. Kamu mendefinisikan entity sebagai komponen CFML (file <code>.cfc</code>) dengan metadata pemetaan, lalu memakai fungsi bawaan seperti <code>entityNew</code>, <code>entitySave</code>, <code>entityLoad</code>, dan <code>ormFlush</code>.</p><p>ORM cocok untuk aplikasi dengan pola CRUD standar dan relasi antar tabel. Untuk laporan kompleks dengan banyak gabungan dan agregasi, <code>queryExecute</code> biasanya tetap lebih ringkas.</p>"
      },
      {
        type: "text",
        html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 200" width="760" role="img" aria-label="Diagram bab 08">
          <defs><marker id="mk-l08-1" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8"/></marker></defs>
          <rect class="u-box" x="20" y="54" width="200" height="70" rx="8"/><text class="u-hd" x="120" y="40" text-anchor="middle">Lapisan Aplikasi</text><text class="u-title" x="120" y="80" text-anchor="middle">Produk.cfc</text><text class="u-sub" x="120" y="102" text-anchor="middle">objek CFML: this.nama, this.harga</text>
          <rect class="u-box" x="280" y="54" width="200" height="70" rx="8"/><text class="u-hd" x="380" y="40" text-anchor="middle">Mesin ORM (Hibernate)</text><text class="u-title" x="380" y="80" text-anchor="middle">Pemetaan</text><text class="u-sub" x="380" y="102" text-anchor="middle">tabel, kolom, relasi, tipe data</text>
          <rect class="u-box" x="540" y="54" width="200" height="70" rx="8"/><text class="u-hd" x="640" y="40" text-anchor="middle">Basis Data</text><text class="u-title" x="640" y="80" text-anchor="middle">Tabel produk</text><text class="u-sub" x="640" y="102" text-anchor="middle">baris: 101, Blender, 250000 ...</text>
          <line class="u-line" x1="220" y1="89" x2="274" y2="89" marker-end="url(#mk-l08-1)"/>
          <line class="u-line" x1="480" y1="89" x2="534" y2="89" marker-end="url(#mk-l08-1)"/>
          <line class="u-dash" x1="120" y1="124" x2="120" y2="160"/><line class="u-dash" x1="640" y1="124" x2="640" y2="160"/><text class="u-lbl" x="380" y="182" text-anchor="middle">Satu sumber kebenaran: definisi entity dipakai untuk SQL dan objek sekaligus</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> Pemetaan entity CFML ke tabel database oleh mesin ORM Lucee.</figcaption></figure>`
      },
      {
        type: "example",
        title: "Mengaktifkan ORM di Application.cfc",
        lang: "cfml",
        output: false,
        code: `<cfcomponent>
    <!--- Aktifkan ORM untuk aplikasi ini --->
    <cfset this.ormEnabled = true>

    <cfset this.ormSettings = {
        datasource  = "appDB",
        dbcreate    = "update",
        logSQL      = true,
        cfclocation = ["models"]
    }>
</cfcomponent>`,
        explain: [
          "<code>this.ormEnabled = true</code> membuat Lucee menginisialisasi sesi ORM saat aplikasi dimulai.",
          "<code>datasource</code> di <code>ormSettings</code> menentukan koneksi yang dipakai mesin ORM.",
          "<code>dbcreate</code> mengontrol pembuatan skema: <code>none</code>, <code>update</code>, atau <code>dropcreate</code>.",
          "<code>cfclocation</code> menunjuk folder berisi file entity agar bisa ditemukan otomatis."
        ]
      },
      {
        type: "example",
        title: "Entity Produk sebagai Komponen CFML",
        lang: "cfml",
        output: false,
        code: `<!--- models/Produk.cfc --->
<cfcomponent table="produk" persistent="true">

    <cfproperty name="id" fieldtype="id" generator="increment" />
    <cfproperty name="nama" column="nama" sqltype="varchar" length="100" />
    <cfproperty name="kategori" column="kategori" sqltype="varchar" length="50" />
    <cfproperty name="harga" column="harga" sqltype="decimal" />
    <cfproperty name="stok" column="stok" sqltype="integer" />

</cfcomponent>`,
        explain: [
          "<code>table=\"produk\"</code> mengikat komponen ke tabel bernama <code>produk</code>.",
          "<code>persistent=\"true\"</code> menandai komponen ini sebagai entity ORM, bukan komponen biasa.",
          "<code>fieldtype=\"id\" generator=\"increment\"</code> menandai primary key yang diisi otomatis (max+1).",
          "Setiap <code>cfproperty</code> memetakan satu atribut objek ke satu kolom beserta tipenya."
        ]
      },
      {
        type: "text",
        html: "<h3>CRUD dengan Fungsi Entity</h3><p>Empat fungsi inti menutupi hampir semua kebutuhan harian: <code>entityNew</code> membuat objek baru, <code>entitySave</code> menandainya untuk disimpan, <code>entityLoad</code> membaca, dan <code>entityDelete</code> menghapus. Perubahan tidak langsung terjadi di database sampai di-<code>ormFlush</code>, karena Lucee menumpuk perubahan dalam satu sesi.</p><p>Model flush di akhir request (default) membuat beberapa operasi hemat satu koneksi, tapi juga berarti kamu harus memahami kapan data benar-benar tertulis.</p>"
      },
      {
        type: "example",
        title: "Membaca dan Menyimpan Entity",
        lang: "cfml",
        output: false,
        code: `<!--- Tambah baru: objek kosong, diisi, lalu disimpan --->
<cfset baru = entityNew("Produk")>
<cfset baru.nama = "Blender Biji Kopi">
<cfset baru.kategori = "dapur">
<cfset baru.harga = 350000>
<cfset baru.stok = 12>
<cfset entitySave(baru)>
<cfset ormFlush()>

<!--- Baca satu entitas berdasarkan primary key --->
<cfset produk = entityLoadByPK("Produk", 101)>
<cfoutput>#produk.nama# - Rp #produk.harga#</cfoutput>`,
        explain: [
          "<code>entityNew(\"Produk\")</code> membuat instance kosong dari entity bernama <code>Produk</code>.",
          "<code>entitySave</code> menandai objek untuk disimpan, <code>ormFlush</code> memastikan perubahan ditulis ke database.",
          "<code>entityLoadByPK(\"Produk\", 101)</code> mengambil satu entitas dari primary key 101; <code>entityLoad(\"Produk\", 101)</code> tanpa argumen unik justru mengembalikan array berisi satu entitas.",
          "Setelah flush, properti <code>id</code> terisi nilai kunci yang dihasilkan database."
        ]
      },
      {
        type: "text",
        html: "<h3>Membaca Data: Kriteria, Urutan, dan Batasan</h3><p><code>entityLoad</code> jauh lebih fleksibel daripada sekadar mengambil by ID. Argumen keduanya bisa berupa struct kriteria WHERE, argumen ketiga menentukan urutan, dan argumen keempat membawa opsi seperti <code>maxresults</code> dan <code>offset</code> untuk paginasi. Untuk kasus yang tidak tercakup kriteria sederhana, HQL memberi kebebasan penuh sambil tetap bekerja pada nama entity.</p>"
      },
      {
        type: "example",
        title: "Menyaring, Mengurutkan, dan Membatasi Hasil",
        lang: "cfml",
        output: false,
        code: `<!--- Struct kriteria menjadi klausa WHERE otomatis --->
<cfset murah = entityLoad("Produk", { kategori = "dapur" }, "harga ASC")>

<!--- Opsi tambahan: batasi jumlah dan geser posisi awal --->
<cfset lima = entityLoad("Produk", {}, "id DESC", {
    maxresults = 5,
    offset     = 0
})>

<cfoutput>Ada #arrayLen(murah)# entitas dapur.</cfoutput>`,
        explain: [
          "Argumen kedua <code>entityLoad</code> berupa struct menjadi klausa WHERE (misalnya kategori dapur).",
          "Argumen ketiga adalah urutan, misalnya <code>harga ASC</code> atau <code>id DESC</code>.",
          "Argumen keempat berupa options menerima kunci <code>maxresults</code> dan <code>offset</code> untuk paginasi.",
          "<code>arrayLen</code> menghitung jumlah entitas yang dikembalikan (berupa array)."
        ]
      },
      {
        type: "example",
        title: "HQL: Query Objek dengan Sintaks SQL",
        lang: "cfml",
        output: false,
        code: `<!--- returntype="query" membuat hasil berupa objek query, bukan array entity --->
<cfquery name="laris" dbtype="hql" returntype="query">
    SELECT p
    FROM Produk p
    WHERE p.stok > 0
    ORDER BY p.harga DESC
</cfquery>

<cfoutput query="laris">#nama# - #harga#<br></cfoutput>`,
        explain: [
          "<code>dbtype=\"hql\"</code> memberi tahu Lucee bahwa ini Hibernate Query Language, bukan SQL mentah.",
          "FROM memakai nama entity (<code>Produk</code>) dan atributnya (<code>p.stok</code>), bukan tabel dan kolom.",
          "Hasil HQL berupa array entity; dengan <code>returntype=\"query\"</code> hasilnya diubah menjadi objek query sehingga bisa dipakai <code>cfoutput query</code> seperti biasa.",
          "HQL berguna saat filter kompleks lebih nyaman ditulis sebagai query daripada struct kriteria."
        ]
      },
      {
        type: "text",
        html: "<h3>Relasi Antar Entity</h3><p>Tabel yang saling berhubungan dipetakan lewat property bertipe relasi. <code>one-to-many</code> dipakai untuk satu kategori berisi banyak produk, sedangkan <code>many-to-many</code> membutuhkan tabel penghubung seperti <code>produk_tag</code>. Setelah relasi terdeklarasi, kamu menelusuri objeknya langsung tanpa menulis JOIN.</p>"
      },
      {
        type: "example",
        title: "Relasi One-to-Many dan Many-to-Many",
        lang: "cfml",
        output: false,
        code: `<!--- Di entity Kategori: satu kategori, banyak produk --->
<cfproperty name="produkList" fieldtype="one-to-many"
            cfc="Produk" fkcolumn="kategori_id" type="array" />

<!--- Di entity Produk: sisi balik relasinya, memakai kolom kategori_id --->
<cfproperty name="kategori" fieldtype="many-to-one"
            cfc="Kategori" column="kategori_id" fkcolumn="id" />

<!--- Banyak ke banyak lewat tabel penghubung --->
<cfproperty name="tags" fieldtype="many-to-many"
            cfc="Tag" linktable="produk_tag"
            fkcolumn="produk_id" inversejoincolumn="tag_id" />`,
        explain: [
          "<code>fieldtype=\"one-to-many\"</code> menghubungkan satu induk ke banyak anak melalui <code>fkcolumn</code>.",
          "<code>type=\"array\"</code> membuat relasi berupa array objek anak; sisi baliknya memakai <code>many-to-one</code> pada kolom yang sama.",
          "Relasi ini memakai kolom <code>kategori_id</code>, jadi tabel produk perlu kolom itu — property <code>kategori</code> bertipe varchar di pelajaran sebelumnya diganti bila sudah berelasi.",
          "<code>many-to-many</code> membutuhkan <code>linktable</code> serta dua kolom: <code>fkcolumn</code> dan <code>inversejoincolumn</code>.",
          "Setelah relasi didefinisikan, akses seperti <code>kategori.produkList</code> tanpa menulis JOIN manual."
        ]
      },
      {
        type: "tip",
        title: "Generator increment vs native",
        text: "<b>Generator increment vs native.</b> <code>generator=\"increment\"</code> membuat Hibernate menghitung <code>MAX(id)+1</code> di memori sebelum insert; sederhana tapi bisa bentrok bila ada penulis dari luar ORM. Untuk produksi multi-penulis, <code>generator=\"native\"</code> (membiarkan database menghasilkan kunci, misalnya AUTO_INCREMENT) lebih aman."
      },
      {
        type: "warn",
        title: "dbcreate dropcreate di produksi",
        text: "<b>Jangan pakai <code>dbcreate=\"dropcreate\"</code> di produksi.</b> Mode itu <b>menghapus seluruh tabel</b> lalu membuatnya ulang setiap aplikasi dimulai. Untuk pengembangan, <code>update</code> hanya menambah tabel/kolom yang belum ada (tidak menghapus kolom lama). Di produksi, pakai <code>none</code> dan kelola skema lewat migration."
      },
      {
        type: "vocab",
        items: [
          ["Entity", "Komponen CFML yang dipetakan ke satu tabel oleh ORM."],
          ["Persistent", "Sifat komponen yang dikelola ORM (<code>persistent=\"true\"</code>)."],
          ["HQL", "Bahasa query objek mirip SQL yang bekerja pada entity, bukan tabel."],
          ["Flush", "Proses menulis perubahan objek ke database (<code>ormFlush</code>)."],
          ["Sesi ORM", "Penyimpanan objek aktif yang melacak perubahan sebelum flush."],
          ["<code>dbcreate</code>", "Pengaturan pembuatan skema: none, update, atau dropcreate."],
          ["Linktable", "Tabel penghubung untuk relasi many-to-many."]
        ]
      }
    ],
    recap: [
      "ORM memetakan tabel ke objek CFML sehingga operasi CRUD tidak perlu menulis SQL manual.",
      "ORM diaktifkan lewat <code>this.ormEnabled</code> dan <code>this.ormSettings</code> di Application.cfc.",
      "Entity adalah komponen persistent dengan <code>cfproperty</code> sebagai metadata pemetaan.",
      "CRUD memakai <code>entityNew</code>, <code>entitySave</code>, <code>entityLoad</code>, <code>entityDelete</code>, dan <code>ormFlush</code>.",
      "<code>entityLoad</code> menerima kriteria struct, urutan, serta opsi seperti <code>maxresults</code> dan <code>offset</code>.",
      "Untuk query kompleks, HQL lewat <code>dbtype=\"hql\"</code> mempertahankan bahasa berbasis entity."
    ]
  });
