/* ============================================================
   Pelajaran Lucee CFML — Bab 9: User Defined Functions (UDF) (L9)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-udf',
  title: 'User Defined Functions (UDF)',
  chapter: 'Data & Menengah',
  duration: '12 menit',
  intro: [
    'Kode CFML yang berulang adalah tanda bahwa sudah waktunya membuat fungsi. <b>UDF</b> (User Defined Function) adalah fungsi yang kamu tulis sendiri, dipanggil sama persis seperti fungsi bawaan seperti <code>len()</code> atau <code>encodeForHTML()</code>.',
    'Lucee mendukung dua gaya deklarasi: sintaks tag <code>cffunction</code>/<code>cfargument</code> yang eksplisit, dan sintaks script <code>function namaFungsi() {}</code> yang lebih ringkas. Keduanya menghasilkan perilaku yang sama, termasuk sistem tipe, nilai default, dan area <code>arguments</code>.',
    'Pelajaran ini menyusun fungsi-fungsi utilitas untuk aplikasi toko online — format rupiah, validasi input, perhitungan ongkir — sekaligus membahas jebakan klasik seperti ruang lingkup variabel, kondisi race condition, dan batasan CFML terhadap overloading.'
  ],
  objectives: [
    'Mendeklarasikan fungsi dengan sintaks tag dan sintaks script',
    'Mengatur parameter required, tipe data, dan nilai default',
    'Memilih returntype yang tepat termasuk void dan any',
    'Membedakan scope local dan variables serta dampaknya',
    'Membuat fungsi anonim dan closure',
    'Menentukan kapan UDF dipakai dan kapan cukup sekadar blok kode'
  ],
  sections: [
    {
      type: "text",
      html: "<h3>Deklarasi Fungsi: Tag dan Script</h3><p>Fungsi adalah blok kode bernama yang menerima input lewat argumen dan menghasilkan output lewat <code>cfreturn</code> (atau <code>return</code> di script). Dengan begitu, logika seperti format rupiah atau validasi stok cukup ditulis sekali lalu dipakai di mana saja.</p><p>Lucee mengenali dua sintaks. Gaya tag memakai <code>cffunction</code> dengan atribut <code>name</code> dan <code>returntype</code>, sedangkan gaya script memakai kata kunci <code>function</code>. Pilih salah satu dan konsisten dalam satu proyek.</p>"
    },
    {
      type: "example",
      title: "Fungsi dengan Sintaks Tag",
      lang: "cfml",
      output: false,
      code: `<cffunction name="formatRupiah" access="public" returntype="string">
    <cfargument name="nilai" type="numeric" required="true">

    <cfset var hasil = "Rp " & numberFormat(arguments.nilai, ",,.")>
    <cfreturn hasil>
</cffunction>

<cfoutput>#formatRupiah(250000)#</cfoutput>`,
      explain: [
        "<code>cffunction</code> mendefinisikan fungsi bernama <code>formatRupiah</code> dengan akses publik.",
        "<code>cfargument</code> mendeklarasikan parameter <code>nilai</code> bertipe numeric dan wajib diisi (required).",
        "<code>var hasil</code> membuat variabel lokal yang hanya hidup selama fungsi berjalan.",
        "<code>cfreturn</code> mengirimkan nilai kembali ke pemanggil; tanpanya fungsi mengembalikan void."
      ]
    },
    {
      type: "example",
      title: "Fungsi dengan Sintaks Script",
      lang: "cfml",
      output: false,
      code: `function formatRupiah(numeric nilai) {
    return "Rp " & numberFormat(nilai, ",,.");
}

function hitungOngkir(numeric berat, string kota) {
    var tarif = berat * 8000;
    if (kota != "Jakarta") {
        tarif = tarif + 15000;
    }
    return tarif;
}

writeOutput(formatRupiah(250000));`,
      explain: [
        "Sintaks script menulis tipe data langsung di depan nama parameter: <code>numeric nilai</code>.",
        "<code>var tarif</code> mendeklarasikan variabel lokal; tanpa <code>var</code>, variabel menjadi bagian dari <code>variables</code> scope.",
        "Nilai kembalian ditulis dengan kata kunci <code>return</code>, ekuivalen dengan <code>cfreturn</code>.",
        "Fungsi bisa dipanggil tanpa tanda kurung argumen bila semua parameter punya nilai default atau bersifat opsional."
      ]
    },
    {
      type: "example",
      title: "Parameter Default, Required, dan Returntype",
      lang: "cfml",
      output: false,
      code: `function tambahPajak(numeric subtotal, numeric pajak = 0.11) {
    return subtotal + (subtotal * pajak);
}

function prosesBayar(required struct pesanan) {
    // void: tidak mengembalikan nilai, hanya menjalankan aksi
    writeOutput("Memproses #pesanan.id#...");
}

writeOutput(tambahPajak(100000));      // 111000, pajak memakai default
writeOutput(tambahPajak(100000, 0.05)); // 105000, pajak ditimpa`,
      explain: [
        "Parameter dengan nilai default menjadi opsional; pemanggil boleh mengirim nilai sendiri atau tidak.",
        "Keyword <code>required</code> pada tipe parameter menandai argumen wajib, sama dengan <code>required=\"true\"</code> pada cfargument.",
        "<code>returntype=\"void\"</code> dipakai untuk fungsi yang hanya menjalankan aksi tanpa nilai kembalian.",
        "Lucee memvalidasi tipe saat fungsi dipanggil; ketidakcocokan menghasilkan error yang jelas."
      ]
    },
    {
      type: "text",
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 210" width="760" role="img" aria-label="Diagram bab 09">
        <defs><marker id="mk-l09-1" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8"/></marker></defs>
        <rect class="u-box" x="20" y="56" width="170" height="70" rx="8"/><text class="u-hd" x="105" y="42" text-anchor="middle">Pemanggil</text><text class="u-title" x="105" y="84" text-anchor="middle">formatRupiah(</text><text class="u-sub" x="105" y="106" text-anchor="middle">250000)</text>
        <rect class="u-box" x="220" y="56" width="180" height="70" rx="8"/><text class="u-hd" x="310" y="42" text-anchor="middle">Argumen</text><text class="u-title" x="310" y="84" text-anchor="middle">nilai = 250000</text><text class="u-sub" x="310" y="106" text-anchor="middle">tipe numeric, required</text>
        <rect class="u-box" x="430" y="56" width="150" height="70" rx="8"/><text class="u-hd" x="505" y="42" text-anchor="middle">Isi Fungsi</text><text class="u-title" x="505" y="84" text-anchor="middle">numberFormat()</text><text class="u-sub" x="505" y="106" text-anchor="middle">var hasil = ...</text>
        <rect class="u-box" x="610" y="56" width="130" height="70" rx="8"/><text class="u-hd" x="675" y="42" text-anchor="middle">cfreturn</text><text class="u-title" x="675" y="84" text-anchor="middle">Rp 250.000</text><text class="u-sub" x="675" y="106" text-anchor="middle">returntype string</text>
        <line class="u-line" x1="190" y1="91" x2="214" y2="91" marker-end="url(#mk-l09-1)"/>
        <line class="u-line" x1="400" y1="91" x2="424" y2="91" marker-end="url(#mk-l09-1)"/>
        <line class="u-line" x1="580" y1="91" x2="604" y2="91" marker-end="url(#mk-l09-1)"/>
        <line class="u-dash" x1="675" y1="126" x2="675" y2="158"/><line class="u-dash" x1="105" y1="126" x2="105" y2="158"/><line class="u-dash" x1="105" y1="158" x2="675" y2="158"/><text class="u-lbl" x="390" y="184" text-anchor="middle">Nilai kembalian mengalir balik ke baris pemanggil</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> Alur pemanggilan UDF: dari argumen masuk, pemrosesan, sampai nilai kembalian.</figcaption></figure>`
    },
    {
      type: "text",
      html: "<h3>Nilai Kembalian dan Bentuk Data</h3><p>Fungsi berguna ketika menghasilkan data yang bisa dipakai ulang. Selain string dan angka, <code>returntype</code> mengizinkan fungsi mengembalikan struct berisi banyak kunci, objek query untuk tabel, atau array untuk daftar. Bila tipe yang dikembalikan tidak sesuai deklarasi, Lucee melemparkan error sejak awal — jauh lebih mudah didebug daripada nilai salah yang menyebar ke UI.</p>"
    },
    {
      type: "example",
      title: "Mengembalikan Struct dan Query",
      lang: "cfml",
      output: false,
      code: `function ringkasanProduk(array daftar) {
    var total = 0;
    var termurah = 0;

    for (var p in daftar) {
        total = total + p.harga;
        if (termurah == 0 || p.harga < termurah) {
            termurah = p.harga;
        }
    }

    return {
        jumlah   : arrayLen(daftar),
        total    : total,
        rataRata : (arrayLen(daftar) ? total / arrayLen(daftar) : 0),
        termurah : termurah
    };
}

var hasil = ringkasanProduk(produkList);
writeDump(hasil);`,
      explain: [
        "<code>returntype=\"struct\"</code> (atau <code>any</code> bila isinya campuran) memungkinkan fungsi mengirim banyak nilai sekaligus.",
        "Perulangan <code>for (var p in daftar)</code> memakai <code>var</code> agar variabel iterasi tidak bocor ke <code>variables</code>.",
        "Operator ternary memilih rata-rata aman saat array kosong, menghindari pembagian dengan nol.",
        "Fungsi yang mengembalikan struct sering dipakai sebagai service ringkas sebelum data dirender."
      ]
    },
    {
      type: "text",
      html: "<h3>Ruang Lingkup Variabel: local vs variables</h3><p>Setiap pemanggilan fungsi punya dua tempat menyimpan variabel: <code>local</code> (hanya hidup selama fungsi berjalan) dan <code>variables</code> (dibagikan ke seluruh komponen). Menggunakan <code>variables</code> tanpa sadar untuk variabel sementara adalah sumber bug tersulit di CFML: dua request yang berjalan bersamaan bisa saling menimpa.</p>"
    },
    {
      type: "tip",
      title: "Deklarasi variabel lokal dengan var",
      text: "<b>Perlakukan setiap fungsi seolah dipanggil dua request sekaligus.</b> Selalu deklarasikan variabel sementara dengan <code>var</code> (sintaks tag/script) atau tulis <code>local.x</code>. Hindari menulis ulang argumen <code>arguments</code> sebagai tempat kerja; salin ke variabel lokal bila nilainya perlu dimodifikasi."
    },
    {
      type: "warn",
      title: "Race condition pada variables scope",
      text: "<b>Race condition pada <code>variables</code> scope.</b> Bayangkan fungsi <code>hitungOngkir</code> menyimpan hasilnya di <code>variables.ongkir</code> tanpa <code>var</code>. Request A menghitung 15000, lalu request B menimpanya dengan 23000 sebelum A sempat membaca — hasil A menjadi salah. Variabel bersama hanya aman untuk data benar-benar konstanta seperti konfigurasi aplikasi."
    },
    {
      type: "text",
      html: "<h3>Fungsi Anonim dan Pemrograman Fungsional</h3><p>Tidak semua fungsi perlu diberi nama. Lucee mendukung fungsi anonim yang disimpan dalam variabel, termasuk <i>closure</i> yang menangkap variabel dari lingkup sekitarnya. Pola ini makin sering muncul saat memakai metode array seperti <code>map</code>, <code>filter</code>, dan <code>reduce</code> untuk memproses daftar tanpa perulangan <code>for</code> eksplisit.</p>"
    },
    {
      type: "example",
      title: "Fungsi Anonim dan Closure",
      lang: "cfml",
      output: false,
      code: `// Fungsi anonim langsung disimpan dalam variabel
var formatLabel = function(numeric h) {
    return "Rp " & numberFormat(h, ",,.");
};

writeOutput(formatLabel(99000));

// Closure: membawa variabel luar yang ikut terpakai
var diskonMember = function(numeric h) {
    return h - (h * local.persen);
};
local.persen = 0.1;

// Fungsi tingkat tinggi: memproses tiap elemen array
var hargaSetelahDiskon = daftar.map(function(item) {
    return item.harga * 0.9;
});`,
      explain: [
        "Fungsi anonim ditulis tanpa nama dan dapat disimpan dalam variabel lalu dipanggil seperti fungsi biasa.",
        "Closure menangkap variabel dari lingkup sekitarnya sehingga tetap tersedia saat fungsi dipanggil nanti.",
        "Method array seperti <code>map</code> menerima fungsi sebagai argumen untuk memproses tiap elemen.",
        "Pendekatan ini menghindari pembuatan banyak fungsi bernama hanya untuk satu kali pakai."
      ]
    },
    {
      type: "example",
      title: "UDF vs Method: Menempatkan Fungsi di Tempat yang Tepat",
      lang: "cfml",
      output: false,
      code: `<!--- UDF di Application.cfc: utilitas global --->
<cffunction name="formatRupiah" access="public" returntype="string">
    <cfargument name="nilai" type="numeric" required="true">
    <cfreturn "Rp " & numberFormat(arguments.nilai, ",,.")>
</cffunction>

<!--- Method di CFC service: logika bisnis terikat objek --->
<cfcomponent displayname="Keranjang">
    <cffunction name="total" access="public" returntype="numeric">
        <cfreturn variables.subtotal + variables.ongkir>
    </cffunction>
</cfcomponent>`,
      explain: [
        "Fungsi utilitas murni (format, konversi, validasi format) cocok sebagai UDF global di Application.cfc.",
        "Logika yang membutuhkan state atau data objek lebih tepat sebagai method di dalam CFC.",
        "CFML tidak mendukung overloading: satu nama fungsi hanya boleh didefinisikan sekali dengan variasi parameter berbeda.",
        "Untuk beberapa perilaku terkait, gunakan parameter opsional atau nama fungsi yang berbeda."
      ]
    },
    {
      type: "vocab",
      items: [
        ["UDF", "User Defined Function; fungsi yang dibuat pengguna, dipanggil seperti fungsi bawaan."],
        ["<code>cfargument</code>", "Deklarasi parameter fungsi pada sintaks tag, lengkap dengan tipe dan required."],
        ["<code>returntype</code>", "Tipe nilai kembalian: string, numeric, struct, query, array, boolean, atau void."],
        ["Scope <code>local</code>", "Ruang variabel yang hanya hidup selama satu pemanggilan fungsi."],
        ["Scope <code>variables</code>", "Ruang variabel bersama sepanjang umur komponen."],
        ["Closure", "Fungsi anonim yang menangkap variabel dari lingkup sekitarnya."],
        ["Race condition", "Bug saat beberapa request saling menimpa variabel bersama."]
      ]
    }
  ],
  recap: [
    "UDF dibuat dengan sintaks tag <code>cffunction</code>/<code>cfargument</code> atau sintaks script <code>function</code>; pilih satu gaya dan konsisten.",
    "Parameter bisa diberi tipe, sifat required, dan nilai default sehingga menjadi opsional.",
    "<code>returntype</code> menentukan bentuk nilai kembalian, dari string dan numeric sampai struct, query, array, hingga void.",
    "Variabel sementara wajib memakai <code>var</code> atau scope <code>local</code> agar tidak bocor dan memicu race condition.",
    "Fungsi anonim dan closure berguna untuk logika sekali pakai serta fungsi tingkat tinggi seperti <code>map</code>.",
    "CFML tidak mendukung overloading; pisahkan utilitas global (UDF) dan logika bisnis (method CFC) sesuai tempatnya."
  ]
});
