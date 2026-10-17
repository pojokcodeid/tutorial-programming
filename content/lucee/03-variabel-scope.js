/* ============================================================
   Pelajaran Lucee CFML — Bab 3: Fondasi & Dasar (L3)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-variabel-tipe-scope',
  title: 'Variabel, Tipe Data & Scope',
  chapter: 'Fondasi & Dasar',
  duration: '12 menit',
  intro: [
    'Setiap aplikasi toko online pada dasarnya mengolah data: nama produk, harga, tanggal pesanan, status pembayaran. Di CFML, data disimpan di <b>variabel</b> yang punya tipe, umur, dan wilayah akses sendiri.',
    'Pelajaran ini mengurainya dari deklarasi variabel, empat tipe data utama beserta cara konversinya, lalu <b>scope</b> — konsep paling penting di CFML yang sering bikin bingung pemula baru.'
  ],
  objectives: [
    'Mendeklarasikan variabel dengan benar di kedua gaya sintaks',
    'Mengenali tipe data String, Numeric, Boolean, dan Date',
    'Memakai fungsi pemeriksaan dan konversi tipe',
    'Membedakan scope variables, arguments, local, session, application, request, url, form, cgi, dan server',
    'Menulis variabel secara eksplisit agar bebas dari tebakan scope',
    'Membaca dan menampilkan waktu server dengan format yang tepat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Deklarasi Variabel</h3><p>Di CFML kamu tidak perlu mendeklarasikan tipe: cukup tulis nama lalu isi nilainya dengan <code>&lt;cfset&gt;</code> (tag) atau <code>=</code> (cfscript). Satu hal yang perlu diingat, <b>penulisan huruf besar-kecil tidak berpengaruh</b> — <code>totalHarga</code> dan <code>TOTALHARGA</code> adalah variabel yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Membuat dan menimpa variabel',
      lang: 'cfml',
      output: false,
      code: `<cfset namaToko = "Toko Berkah">
<cfset jumlahItem = 3>
<cfset tersedia = true>
<cfset tanggalDaftar = now()>
<cfset namaToko = namaToko & " (Cabang Utara)">   <!--- boleh ditimpa --->

<cfscript>
function hitungSubtotal(qty, harga) {
    var subtotal = qty * harga;   // var: hanya hidup di dalam fungsi
    return subtotal;
}
</cfscript>`,
      explain: [
        'Nilai bebas bertukar tipe: <code>namaToko</code> bisa saja diisi angka nanti, tapi hindari kebiasaan itu.',
        'Perintah <code>var</code> membuat variabel lokal fungsi — tanpa <code>var</code>, ia bocor ke scope <code>variables</code>.',
        'Operator <code>&amp;</code> menggabungkan string, bukan <code>+</code>.',
        'Nama variabel disarankan <i>camelCase</i>: <code>totalHarga</code>, <code>tglPesan</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tipe Data Utama &amp; Konversi</h3><p>CFML hanya punya empat tipe dasar yang perlu kamu kuasai: <b>String</b> (teks dalam tanda kutip), <b>Numeric</b> (integer maupun desimal), <b>Boolean</b> (<code>true</code>/<code>false</code>, juga menerima "yes"/"no"), dan <b>Date</b> (tanggal, jam, atau keduanya). Karena CFML dinamis, kamu sering perlu memeriksa dan mengonversi tipe sebelum dipakai.</p>'
    },
    {
      type: 'example',
      title: 'Empat tipe dasar, pemeriksaan & konversi',
      lang: 'cfml',
      output: false,
      code: `<cfset produk = "Kopi Arabika">   <!--- String -->
<cfset harga = 85000.5>           <!--- Numeric -->
<cfset tersedia = true>           <!--- Boolean -->
<cfset rilis = now()>             <!--- Date -->

<cfscript>
// Pemeriksaan tipe
isNumeric("85000.5");   // true
isBoolean("yes");       // true — "yes"/"no" diterima sebagai boolean
isDate("2026-06-17");   // true

// Konversi
angka = val("12px");            // 12 — angka di awal dibaca, sisanya dibuang
teks = "Rp " & angka;           // "Rp 12"
ketat = javaCast("int", "42");  // Integer sungguhan di level JVM
</cfscript>`,
      explain: [
        '<code>val()</code> membaca angka dari awal string; <code>val("Rp 85000")</code> menghasilkan <b>0</b> karena tidak ada angka di depan.',
        'Selalu validasi input pengguna dengan <code>isNumeric()</code> sebelum memakai <code>val()</code>.',
        '<code>javaCast("int", ...)</code> dipakai bila berinteraksi langsung dengan objek Java yang menuntut tipe pasti.',
        'Tipe Date menyimpan tanggal sekaligus jam; pemisahannya terjadi saat formatting.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Scope: Wilayah Hidup Variabel</h3><p><b>Scope</b> menentukan di mana sebuah variabel hidup, siapa yang bisa membacanya, dan sampai kapan ia bertahan. Memahami scope membuat kode kamu bebas konflik dan aman dari manipulasi pengunjung.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Daftar scope CFML beserta isi dan umurnya">
        <text x="125" y="30" class="u-sub" text-anchor="middle">Scope</text>
        <text x="350" y="30" class="u-sub" text-anchor="middle">Isi</text>
        <text x="645" y="30" class="u-sub" text-anchor="middle">Umur</text>
        <rect x="30" y="46" width="190" height="36" rx="6" class="u-box"/>
        <text x="125" y="69" class="u-title" text-anchor="middle">server</text>
        <text x="240" y="69" class="u-lbl">objek &amp; konfigurasi bersama</text>
        <text x="555" y="69" class="u-lbl">selama proses server hidup</text>
        <rect x="30" y="88" width="190" height="36" rx="6" class="u-box"/>
        <text x="125" y="111" class="u-title" text-anchor="middle">application</text>
        <text x="240" y="111" class="u-lbl">data bersama semua pengunjung</text>
        <text x="555" y="111" class="u-lbl">selama aplikasi hidup</text>
        <rect x="30" y="130" width="190" height="36" rx="6" class="u-hd"/>
        <text x="125" y="153" class="u-title" text-anchor="middle">session</text>
        <text x="240" y="153" class="u-lbl">data per pengunjung (keranjang)</text>
        <text x="555" y="153" class="u-lbl">sampai sesi habis</text>
        <rect x="30" y="172" width="190" height="36" rx="6" class="u-box"/>
        <text x="125" y="195" class="u-title" text-anchor="middle">request</text>
        <text x="240" y="195" class="u-lbl">data satu request halaman</text>
        <text x="555" y="195" class="u-lbl">sampai respons terkirim</text>
        <rect x="30" y="214" width="190" height="36" rx="6" class="u-box"/>
        <text x="125" y="237" class="u-title" text-anchor="middle">variables</text>
        <text x="240" y="237" class="u-lbl">variabel halaman &amp; komponen</text>
        <text x="555" y="237" class="u-lbl">selama file diproses</text>
        <rect x="30" y="256" width="190" height="36" rx="6" class="u-box"/>
        <text x="125" y="279" class="u-title" text-anchor="middle">arguments + local</text>
        <text x="240" y="279" class="u-lbl">parameter &amp; variabel kerja fungsi</text>
        <text x="555" y="279" class="u-lbl">selama fungsi berjalan</text>
        <text x="380" y="318" class="u-lbl" text-anchor="middle">scope khusus per request: url, form, cgi — dan catatan: file .cfm juga mengisi scope variables</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Peta scope CFML: makin ke bawah, umur variabel makin pendek</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Peta scope untuk kasus toko online',
      lang: 'text',
      output: false,
      code: `scope         isi yang lazim disimpan              umur
------------  -----------------------------------  ------------------------
server        setting engine, objek bersama        selama proses server
application   katalog produk cache, counter hit    selama aplikasi hidup
session       keranjang belanja, id pengguna       sampai sesi habis
request       pesan error form, data template      sampai respons terkirim
variables     konstanta ongkir, helper komponen    selama file diproses
arguments     parameter fungsi hitungOngkir()      selama fungsi berjalan
local         variabel kerja perhitungan           selama fungsi berjalan
url           id produk dari ?id=12                per request
form          isi form pemesanan (POST)            per request
cgi           ip pengunjung, user agent            per request`,
      explain: [
        'Scope <code>session</code> adalah tempat keranjang belanja disimpan agar bertahan antar halaman.',
        'Scope <code>application</code> cocok untuk cache katalog yang dibaca semua pengunjung.',
        'Scope <code>url</code> dan <code>form</code> datang dari pengunjung — jangan pernah langsung dipercaya.',
        'Scope <code>cgi</code> memuat info request mentah seperti IP dan header peramban.'
      ]
    },
    {
      type: 'example',
      title: 'Variabel eksplisit di dalam fungsi',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
function hitungOngkir(berat, kota) {
    var tarifPerKg = 8000;
    local.ongkir = tarifPerKg * berat;

    if (kota == "Jakarta") {
        local.ongkir = local.ongkir + 5000;
    }
    return local.ongkir;
}
</cfscript>`,
      explain: [
        '<code>berat</code> dan <code>kota</code> hidup di scope <code>arguments</code>.',
        '<code>var tarifPerKg</code> dan <code>local.ongkir</code> keduanya berada di scope <code>local</code> — tidak terlihat dari luar fungsi.',
        'Menulis <code>local.x</code> secara eksplisit membuat kode terbaca jelas dari mana asal variabelnya.',
        'Variabel fungsi tanpa <code>var</code> ikut ke scope <code>variables</code> dan menumpuk antar pemanggilan.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan biarkan Lucee menebak scope',
      text: 'Saat nama variabel ditulis tanpa awalan scope, Lucee mencari di beberapa scope sampai ketemu — hasilnya bisa mengejutkan bila ada nama sama di <code>form</code>, <code>url</code>, atau <code>variables</code>. Selain salah baca, ini membuka celah: pengirim request bisa menimpa variabel internal lewat parameter. Tulis selalu <code>local.ongkir</code>, <code>variables.total</code>, atau <code>form.nama</code> secara eksplisit.'
    },
    {
      type: 'text',
      html: '<h3>Waktu Server vs Waktu Klien</h3><p>Fungsi <code>now()</code> mengembalikan tanggal dan jam menurut <b>waktu server</b>, lengkap dengan zona waktunya. Nilai ini berupa objek Date; untuk menampilkannya kamu memakai <code>dateFormat()</code>, <code>timeFormat()</code>, atau <code>dateTimeFormat()</code> dengan masker seperti <code>yyyy</code> (tahun), <code>mm</code> (bulan), <code>dd</code> (tanggal), <code>HH</code> (jam 24), <code>nn</code> (<b>menit</b>), dan <code>ss</code> (detik).</p>'
    },
    {
      type: 'example',
      title: 'Membaca &amp; memformat waktu server',
      lang: 'cfml',
      output: false,
      code: `<cfset sekarang = now()>

<cfoutput>
    <p>Waktu server: #dateTimeFormat(sekarang, "yyyy-mm-dd HH:nn:ss")#</p>
    <p>Tanggal pendek: #dateFormat(sekarang, "dd mmm yyyy")#</p>
</cfoutput>

<cfscript>
// "nn" = menit dan "mm" = bulan — paling sering tertukar!
writeOutput(timeFormat(sekarang, "HH:nn:ss"));
</cfscript>`,
      explain: [
        '<code>dateTimeFormat()</code> menggabungkan tanggal dan jam dalam satu masker.',
        'Masker <code>nn</code> untuk menit; <code>mm</code> selalu bulan. Kesalahan ini membuat "menit" tampil 1–12.',
        'Hasil <code>now()</code> bisa langsung disimpan ke database sebagai kolom tanggal.'
      ]
    },
    {
      type: 'warn',
      title: 'now() bukan waktu pengunjung',
      text: '<code>now()</code> mengikuti jam komputer server lengkap dengan zonanya. Kalau server di WIB dan pengunjung di Makassar, tampilan "sekarang" akan meleset. Simpan tanggal dalam standar ISO (misal <code>2026-06-17T09:30:00Z</code>) dan lakukan formatting hanya saat menampilkan; untuk jam yang benar-benar milik pengunjung, serahkan perhitungannya ke JavaScript di browser.'
    },
    {
      type: 'text',
      html: '<h3>Operasi String Dasar</h3><p>Teks adalah tipe paling sering kamu pegang — nama produk, alamat, deskripsi. CFML menyediakan fungsi bawaan yang ringkas untuk memotong, mengganti, mengukur, dan mengamankan teks.</p>'
    },
    {
      type: 'example',
      title: 'Memotong, mengganti & mengamankan teks',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
nama = "  Toko Berkah  ";
bersih   = trim(nama);                    // "Toko Berkah"
panjang  = len(bersih);                   // 11
besar    = uCase(bersih);                 // "TOKO BERKAH"
awal     = left(bersih, 4);               // "Toko"
akhir    = right(bersih, 6);              // "Berkah"
diganti  = replace(bersih, " ", "-");     // "Toko-Berkah"
daftar   = listToArray("kopi,teh,susu");  // array 3 elemen
aman     = encodeForHTML("<b>promo</b>"); // teks aman untuk HTML
</cfscript>`,
      explain: [
        '<code>trim()</code> membuang spasi di awal dan akhir — wajib saat membersihkan input form.',
        '<code>len()</code> menghitung karakter, termasuk spasi di dalam teks.',
        'String CFML berbasis karakter tunggal (Unicode), bukan byte.',
        '<code>encodeForHTML()</code> meng-escape karakter seperti &lt; dan &gt; — pertahanan pertama dari XSS.'
      ]
    },
    {
      type: 'tip',
      title: 'Tiga kebiasaan yang menghemat bug',
      text: 'Satu: tulis awalan scope eksplisit (<code>local.</code>, <code>variables.</code>, <code>form.</code>) di mana pun. Dua: awali setiap variabel fungsi dengan <code>var</code>. Tiga: validasi dan bersihkan data dari luar (<code>trim</code>, <code>isNumeric</code>, <code>encodeForHTML</code>) sebelum masuk ke logika inti aplikasi.'
    },
    {
      type: 'vocab',
      items: [
        ['Variabel', 'Nama penyimpan nilai; penulisan huruf besar-kecil tidak berpengaruh di CFML.'],
        ['Scope', 'Wilayah hidup sebuah variabel: variables, local, session, application, dan lainnya.'],
        ['local', 'Scope isi fungsi; hilang segera setelah fungsi selesai berjalan.'],
        ['arguments', 'Scope parameter masuk sebuah fungsi.'],
        ['session', 'Data per pengunjung yang bertahan antar halaman selama sesi aktif.'],
        ['now()', 'Fungsi mengambil tanggal &amp; jam menurut waktu server.'],
        ['Masker format', 'Kode penanda formatting tanggal: yyyy, mm (bulan), dd, HH, nn (menit), ss.']
      ]
    }
  ],
  recap: [
    'CFML dinamis: deklarasi cukup cfset atau =, dan nama variabel tidak memedulikan huruf besar-kecil.',
    'Empat tipe dasar: String, Numeric, Boolean, dan Date — periksa dengan isNumeric/isBoolean/isDate, konversi dengan val() dan javaCast().',
    'Scope menentukan umur variabel: local &amp; arguments (per fungsi), variables (per file), session (per pengunjung), application (bersama).',
    'Tulis awalan scope secara eksplisit agar Lucee tidak menebak dan pengunjung tidak bisa menimpa variabel internal.',
    'now() mengikuti waktu server; formatting memakai masker dateTimeFormat() dengan nn untuk menit.',
    'Bersihkan dan amankan teks masuk dengan trim(), isNumeric(), dan encodeForHTML().'
  ]
});
