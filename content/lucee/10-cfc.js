/* ============================================================
   Pelajaran Lucee CFML — Bab 10: ColdFusion Components (CFC) (L10)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-cfc',
  title: 'ColdFusion Components (CFC)',
  chapter: 'Data & Menengah',
  duration: '14 menit',
  intro: [
    'Komponen adalah cara CFML menerapkan konsep berorientasi objek: data dan perilaku dikemas dalam satu file <code>.cfc</code>, lalu dipakai ulang lewat objek. Dari sinilah pola <i>service</i>, <i>repository</i>, dan <i>model</i> yang rapi muncul di aplikasi CFML.',
    'CFC bisa ditulis dengan sintaks tag (<code>cfcomponent</code>, <code>cffunction</code>) maupun script (<code>component</code>, <code>function</code>). Objek dibuat dengan <code>createObject("component", …)</code> atau langsung dengan <code>new NamaCfc()</code> — pada gaya kedua, Lucee otomatis memanggil <code>init()</code> bila metode itu ada.',
    'Pelajaran ini membangun komponen <code>Keranjang</code> dan <code>ProdukService</code>, membahas konstruktor <code>init()</code> yang wajib mengembalikan <code>this</code>, modifier akses (termasuk bahaya <code>access="remote"</code>), pewarisan dengan <code>extends</code>, serta kapan CFC lebih tepat daripada sekadar UDF.'
  ],
  objectives: [
    'Menulis komponen dengan sintaks tag dan sintaks script',
    'Membuat objek melalui createObject, cfobject, dan new',
    'Menggunakan init() sebagai konstruktor dan mengembalikan this',
    'Menerapkan property, modifier akses, dan atribut output/hint',
    'Mewarisi komponen lain dengan extends dan super',
    'Menyusun CFC service yang membungkus akses database'
  ],
  sections: [
    {
      type: "text",
      html: "<h3>Anatomi Sebuah Komponen</h3><p>Satu file <code>.cfc</code> berisi deklarasi komponen, properti, metode, dan state internal. Saat diinstansiasi, ia menjadi objek dengan properti pada scope <code>this</code> (terlihat dari luar) dan variabel pada <code>variables</code> (tertutup, hanya bisa diakses metode dalam komponen).</p><p>Pembeda utama dengan UDF: komponen bisa menyimpan state. Itulah alasan keranjang belanja, konfigurasi, dan layanan database dipecah menjadi CFC, bukan kumpulan fungsi lepas.</p>"
    },
    {
      type: "text",
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 205" width="760" role="img" aria-label="Diagram bab 10">
        <defs><marker id="mk-l10-1" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8"/></marker></defs>
        <rect class="u-box" x="40" y="50" width="680" height="110" rx="8"/><text class="u-hd" x="380" y="38" text-anchor="middle">Keranjang.cfc</text>
        <rect class="u-box" x="70" y="78" width="290" height="64" rx="6"/><text class="u-title" x="215" y="102" text-anchor="middle">scope this (publik)</text><text class="u-sub" x="215" y="124" text-anchor="middle">this.tambahItem, getSubtotal()</text>
        <rect class="u-box" x="400" y="78" width="290" height="64" rx="6"/><text class="u-title" x="545" y="102" text-anchor="middle">scope variables (internal)</text><text class="u-sub" x="545" y="124" text-anchor="middle">variables.items, subtotal</text>
        <line class="u-line" x1="360" y1="110" x2="394" y2="110" marker-end="url(#mk-l10-1)"/>
        <text class="u-lbl" x="380" y="186" text-anchor="middle">Publik dipanggil dari luar; internal hanya dari dalam komponen</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> Struktur CFC: scope this untuk publik, variables untuk internal, dan init sebagai konstruktor.</figcaption></figure>`
    },
    {
      type: "example",
      title: "Komponen dengan Sintaks Tag",
      lang: "cfml",
      output: false,
      code: `<!--- models/Keranjang.cfc --->
<cfcomponent displayname="Keranjang" hint="Mengelola item belanja">

    <cfproperty name="items" type="array" />
    <cfproperty name="subtotal" type="numeric" />

    <cffunction name="init" access="public" returntype="Keranjang">
        <cfset variables.items = []>
        <cfset variables.subtotal = 0>
        <cfreturn this>
    </cffunction>

    <cffunction name="tambahItem" access="public" returntype="void">
        <cfargument name="nama" type="string" required="true">
        <cfargument name="harga" type="numeric" required="true">
        <cfset arrayAppend(variables.items, {
            nama = arguments.nama, harga = arguments.harga
        })>
        <cfset variables.subtotal = variables.subtotal + arguments.harga>
    </cffunction>

    <cffunction name="getSubtotal" access="public" returntype="numeric">
        <cfreturn variables.subtotal>
    </cffunction>

</cfcomponent>`,
      explain: [
        "<code>cfcomponent</code> mendeklarasikan komponen; <code>displayname</code> dan <code>hint</code> menjelaskan peran serta tampil di dokumentasi otomatis.",
        "<code>cfproperty</code> mendeklarasikan properti beserta tipenya; nilai awal diatur di <code>init()</code>.",
        "Variabel pada <code>variables</code> scope bersifat privat: <code>tambahItem</code> bisa menulisnya, skrip luar tidak bisa.",
        "Metode <code>getSubtotal</code> menjadi jendela publik untuk membaca nilai internal yang terenkapsulasi."
      ]
    },
    {
      type: "example",
      title: "Membuat Objek: createObject, cfobject, dan new",
      lang: "cfml",
      output: false,
      code: `// Tiga cara menghasilkan objek yang sama
k1 = createObject("component", "models.Keranjang").init();

<cfobject component="models.Keranjang" name="k2">
<cfset k2.init()>

// Operator new: Lucee memanggil init() secara otomatis
k3 = new models.Keranjang();

k3.tambahItem("Blender", 350000);
writeDump(k3.getSubtotal());`,
      explain: [
        "<code>createObject(\"component\", path)</code> membuat instance; <code>.init()</code> harus dipanggil manual.",
        "<code>cfobject</code> adalah padanan tag dengan atribut <code>name</code> untuk menyimpan objek.",
        "Gaya <code>new models.Keranjang()</code> otomatis memanggil <code>init()</code> bila metode itu tersedia.",
        "Nama CFC memakai titik sebagai pemisah path paket, misalnya <code>models.Keranjang</code> untuk <code>models/Keranjang.cfc</code>."
      ]
    },
    {
      type: "tip",
      title: "Kontrak init yang benar",
      text: "<b>Kontrak <code>init()</code> yang benar.</b> Di Lucee, metode <code>init()</code> wajib mengakhiri eksekusi dengan <code>return this</code> agar pemanggilan berantai seperti <code>createObject(...).init()</code> menghasilkan objek, bukan void. Simpan semua konfigurasi wajib (datasource, dependensi) di sini supaya objek selalu lahir dalam keadaan siap pakai."
    },
    {
      type: "text",
      html: "<h3>Modifier Akses dan Kontrol Keluaran</h3><p>Setiap metode punya tingkat akses: <code>public</code> (default), <code>private</code>, <code>package</code>, dan <code>remote</code>. Dua yang paling sering dipakai adalah public untuk API komponen dan private untuk langkah internal yang tidak boleh disentuh dari luar.</p><p>Atribut lain seperti <code>output</code> mengontrol apakah teks yang tidak tertangkap <code>cfoutput</code>/<code>writeOutput</code> ikut tercetak, dan <code>hint</code> memberi dokumentasi singkat yang muncul di halaman dokumentasi CFC otomatis Lucee.</p>"
    },
    {
      type: "example",
      title: "Akses private dan public dalam Satu Komponen",
      lang: "cfml",
      output: false,
      code: `<cfcomponent output="false">

    <cffunction name="hitungOngkir" access="public" returntype="numeric">
        <cfargument name="berat" type="numeric" required="true">
        <cfargument name="kota" type="string" required="true">
        <cfreturn tarifDasar(arguments.berat) + biayaZona(arguments.kota)>
    </cffunction>

    <cffunction name="tarifDasar" access="private" returntype="numeric">
        <cfargument name="berat" type="numeric" required="true">
        <cfreturn arguments.berat * 8000>
    </cffunction>

    <cffunction name="biayaZona" access="private" returntype="numeric">
        <cfargument name="kota" type="string" required="true">
        <cfreturn (arguments.kota == "Jakarta") ? 0 : 15000>
    </cffunction>

</cfcomponent>`,
      explain: [
        "Publik hanya dua metode: <code>hitungOngkir</code> menjadi API, sisanya disembunyikan.",
        "<code>access=\"private\"</code> memastikan <code>tarifDasar</code> tidak bisa dipanggil dari skrip luar.",
        "<code>output=\"false\"</code> pada komponen menekan keluaran liar agar hanya <code>writeOutput</code> eksplisit yang tampil.",
        "Dengan aturan akses ini, perubahan rumus internal tidak mengganggu pemanggil."
      ]
    },
    {
      type: "warn",
      title: "Bahaya access remote",
      text: "<b>Bahaya <code>access=\"remote\"</code>.</b> Metode remote dapat dipanggil langsung dari browser lewat URL dengan parameter query string (misalnya <code>k.cfc?method=hapusItem&id=9</code>). Itu membuka jalur serangan bila tidak divalidasi. Batasi remote hanya untuk endpoint yang memang harus diakses eksternal, lengkapi dengan autentikasi, dan sisanya pakai <code>public</code>."
    },
    {
      type: "text",
      html: "<h3>Pewarisan dan Konstruktor</h3><p>Seperti bahasa berorientasi objek lainnya, CFC boleh mewarisi komponen lain lewat <code>extends</code>. Komponen anak mendapat seluruh metode publik induk dan dapat menambah atau menggantikannya. Kuncinya ada pada konstruktor: <code>init()</code> yang tertulis baik membuat objek lahir sudah terisi, bukan setengah kosong.</p>"
    },
    {
      type: "example",
      title: "Pewarisan dengan extends dan super",
      lang: "cfml",
      output: false,
      code: `<!--- Induk --->
<cfcomponent displayname="Dasar" output="false">
    <cffunction name="init" access="public" returntype="Dasar">
        <cfset variables.dibuatPada = now()>
        <cfreturn this>
    </cffunction>
</cfcomponent>

<!--- Anak: memakai extends dan memanggil super.init() --->
<cfcomponent extends="Dasar" displayname="Keranjang">
    <cffunction name="init" access="public" returntype="Keranjang">
        <cfset super.init()>
        <cfset variables.items = []>
        <cfreturn this>
    </cffunction>
</cfcomponent>`,
      explain: [
        "<code>extends=\"Dasar\"</code> membuat komponen mewarisi semua properti dan metode publik induk.",
        "<code>super.init()</code> menjalankan logika inisialisasi induk sebelum menyiapkan milik anak.",
        "Urutan penting: <code>super.init()</code> dahulu, lalu inisialisasi tambahan, baru <code>return this</code>.",
        "Pewarisan cocok untuk hierarki nyata; bila hanya butuh komposisi, lebih baik injeksi objek lewat <code>init()</code>."
      ]
    },
    {
      type: "text",
      html: "<h3>CFC sebagai Service Layer</h3><p>Bentuk paling umum CFC di aplikasi produksi adalah <i>service</i>: komponen yang membungkus akses data dan logika bisnis sehingga halaman hanya memanggil <code>produkService.cari()</code> tanpa tahu isi SQL-nya. Dengan begitu, halaman tipis, logika teruji, dan penggantian sumber data cukup terjadi di satu berkas.</p>"
    },
    {
      type: "example",
      title: "ProdukService: Membungkus queryExecute",
      lang: "cfml",
      output: false,
      code: `<cfcomponent displayname="ProdukService">

    <cffunction name="init" access="public" returntype="ProdukService">
        <cfargument name="datasource" type="string" required="true">
        <cfset variables.dsn = arguments.datasource>
        <cfreturn this>
    </cffunction>

    <cffunction name="cari" access="public" returntype="query">
        <cfargument name="keyword" type="string" required="true">
        <cfset var q = queryExecute(
            "SELECT id, nama, harga, stok FROM produk WHERE nama LIKE :kw",
            [ kw = { value = '%' & arguments.keyword & '%', cfsqltype = 'cf_sql_varchar' } ],
            [ datasource = variables.dsn ]
        )>
        <cfreturn q>
    </cffunction>

</cfcomponent>

<cfset svc = new ProdukService('appDB')>
<cfoutput query="#svc.cari('blender')#">#nama# — #harga#<br></cfoutput>`,
      explain: [
        "<code>init()</code> menerima dependensi (datasource) sehingga objek tidak menyimpan konfigurasi rahasia di dalam kode metode.",
        "Parameter query memakai <i>named parameter</i> <code>:kw</code> dengan <code>cfsqltype</code>, sehingga tetap aman dari SQL injection.",
        "<code>queryExecute</code> dijalankan memakai datasource yang disimpan di <code>variables.dsn</code>.",
        "Halaman cukup membuat satu objek service lalu memanggil <code>cari()</code>; detail SQL hilang dari lapisan tampilan."
      ]
    },
    {
      type: "example",
      title: "Men-debug Komponen dengan dump",
      lang: "cfml",
      output: false,
      code: `<cfset keranjang = new models.Keranjang()>
<cfset keranjang.tambahItem('Blender', 350000)>
<cfset keranjang.tambahItem('Gelas', 45000)>

<!--- dump menampilkan isi objek: properti publik dan tipe datanya --->
<cfdump var="#keranjang#" label="Isi Keranjang">`,
      explain: [
        "<code>dump()</code> / <code>cfdump</code> memetakan isi objek beserta tipe datanya untuk inspeksi cepat.",
        "Label membantu membedakan beberapa dump saat debugging halaman panjang.",
        "Gunakan <code>label</code> dan <code>top</code> agar output tetap terbaca, terutama untuk objek besar.",
        "Debug dengan dump di pengembangan, lalu hilangkan sebelum produksi karena bisa membocorkan struktur data."
      ]
    },
    {
      type: "vocab",
      items: [
        ["CFC", "ColdFusion Component; file .cfc berisi data dan perilaku yang dipakai sebagai objek."],
        ["<code>this</code> scope", "Kumpulan properti dan metode publik yang terlihat dari luar komponen."],
        ["<code>variables</code> scope", "Ruang internal komponen yang tidak bisa diakses dari skrip luar."],
        ["<code>init()</code>", "Konstruktor komponen; harus mengembalikan <code>this</code> di Lucee."],
        ["<code>extends</code>", "Atribut untuk mewarisi komponen lain; dipakai bersama <code>super</code>."],
        ["<code>access=\"remote\"</code>", "Akses metode yang bisa dipanggil langsung lewat URL."],
        ["Service layer", "CFC yang membungkus logika bisnis dan akses data agar halaman tetap tipis."]
      ]
    }
  ],
  recap: [
    "CFC mengemas data dan perilaku; properti publik berada di <code>this</code>, variabel internal di <code>variables</code>.",
    "Objek dibuat dengan <code>createObject</code>, <code>cfobject</code>, atau <code>new</code> yang memanggil <code>init()</code> otomatis.",
    "<code>init()</code> wajib <code>return this</code> agar rantai pemanggilan menghasilkan objek yang siap pakai.",
    "Modifier akses membatasi keluaran API komponen; hindari <code>access=\"remote\"</code> kecuali memang untuk endpoint eksternal.",
    "<code>extends</code> dan <code>super.init()</code> menyusun hierarki komponen yang diturunkan.",
    "Bentuk produksi paling umum adalah CFC service yang membungkus <code>queryExecute</code> dengan parameter aman."
  ]
});
