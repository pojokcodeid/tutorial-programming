/* ============================================================
   Pelajaran Lucee CFML — Bab 13: OOP di CFML (L13)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-oop',
  title: 'OOP di CFML',
  chapter: 'Arsitektur Modern',
  duration: '12 menit',
  intro: [
    '<b>OOP</b> (Object-Oriented Programming, pemrograman berorientasi objek) memecah masalah besar menjadi objek-objek kecil yang punya data sendiri dan perilaku sendiri. Di CFML, wadahnya adalah <b>CFC</b>: satu file .cfc merepresentasikan satu kelas, dan kamu membuat instance-nya sesuai kebutuhan — misalnya kelas Pegawai untuk HRD, kelas Tabungan untuk modul simpanan.',
    'Empat pilar yang wajib dikuasai: <b>encapsulation</b> (menyembunyikan detail di dalam objek), <b>inheritance</b> (mewariskan perilaku), <b>polymorphism</b> (satu kontrak, banyak perilaku), dan <b>interface</b> (kontrak tegas antar kelas).',
    'Pelajaran ini memakai contoh nyata — Pegawai, Akun/Tabungan, dan strategi diskon toko online — plus anti-pattern yang harus kamu hindari sejak awal.'
  ],
  objectives: [
    'Menulis CFC dengan enkapsulasi yang benar: variables vs this dan accessor',
    'Mewariskan perilaku dengan extends dan memanggil method induk',
    'Menerapkan abstract dan final untuk mengendalikan pewarisan',
    'Mendefinisikan interface dan memakainya sebagai kontrak',
    'Mengenali manfaat OOP untuk pengujian dan anti-pattern yang harus dihindari'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Objek: Class dan Instance</h3><p>Kelas adalah cetakannya; instance adalah hasil cetaknya. File <code>models/Pegawai.cfc</code> mendefinisikan class Pegawai — berapa gaji, bagaimana menghitung bonus. Setiap karyawan memerlukan satu instance dengan data masing-masing. Data disimpan di dalam objek, perilaku ditulis sebagai function di dalam component — dekat dengan data yang ia kelola.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 260" width="760" role="img" aria-label="Pewarisan kelas Akun dan kontrak interface IDiskon">
        <defs><marker id="mk-l13-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <text x="180" y="30" class="u-sub" text-anchor="middle">Pewarisan (extends)</text>
        <rect x="110" y="50" width="140" height="50" rx="8" class="u-hd"/>
        <text x="180" y="80" class="u-title" text-anchor="middle">Akun</text>
        <line x1="150" y1="103" x2="105" y2="155" class="u-line" marker-end="url(#mk-l13-1)"/>
        <line x1="210" y1="103" x2="255" y2="155" class="u-line" marker-end="url(#mk-l13-1)"/>
        <rect x="20" y="160" width="130" height="50" rx="8" class="u-box"/>
        <text x="85" y="190" class="u-title" text-anchor="middle">Tabungan</text>
        <rect x="210" y="160" width="130" height="50" rx="8" class="u-box"/>
        <text x="275" y="190" class="u-title" text-anchor="middle">Giro</text>
        <text x="180" y="240" class="u-lbl" text-anchor="middle">Tabungan "is-a" Akun — mewarisi init() dan saldo</text>
        <text x="560" y="30" class="u-sub" text-anchor="middle">Kontrak (interface)</text>
        <rect x="480" y="50" width="160" height="50" rx="8" class="u-box"/>
        <text x="560" y="80" class="u-title" text-anchor="middle">IDiskon</text>
        <line x1="530" y1="103" x2="465" y2="155" class="u-dash" marker-end="url(#mk-l13-1)"/>
        <line x1="590" y1="103" x2="655" y2="155" class="u-dash" marker-end="url(#mk-l13-1)"/>
        <rect x="375" y="160" width="140" height="50" rx="8" class="u-box"/>
        <text x="445" y="190" class="u-title" text-anchor="middle">DiskonMember</text>
        <rect x="605" y="160" width="140" height="50" rx="8" class="u-box"/>
        <text x="675" y="190" class="u-title" text-anchor="middle">DiskonRamadan</text>
        <text x="560" y="240" class="u-lbl" text-anchor="middle">Dua kelas beda aturan, satu method yang sama</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 13.1</b> — Pewarisan menggabungkan; interface mengikat pada kontrak</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Class Pegawai dengan enkapsulasi',
      lang: 'cfml',
      output: false,
      code: `<!-- models/Pegawai.cfc -->
component accessors="true" {

  property name="id"   type="numeric";
  property name="nama" type="string";
  property name="gaji" type="numeric";

  function init(required numeric id, required string nama, numeric gaji=0) {
    variables.id   = arguments.id;     // private: hanya objek ini yang boleh tahu
    variables.nama = arguments.nama;
    variables.gaji = arguments.gaji;
    return this;
  }

  function hitungBonus() {
    return variables.gaji * 0.05;      // bonus 5% dari gaji
  }
}

<cfscript>
peg = new models.Pegawai(17, "Siti Aminah", 8500000);
writeOutput( peg.getNama() );          // accessor otomatis dari accessors="true"
writeOutput( peg.hitungBonus() );      // 425000
</cfscript>`,
      explain: [
        '<code>variables.</code> bersifat private — di luar objek tidak bisa membacanya langsung.',
        '<code>accessors="true"</code> membuat getter/setter otomatis: getNama(), setGaji(), getId().',
        'init() adalah konstruktor; ia dijalankan saat instance dibuat dan wajib mengembalikan this.',
        'Pengendalian akses membuat gaji tidak bisa diubah sembarangan — lewat setter, validasi bisa dipasang di satu tempat.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Encapsulation</b> berarti menjaga detail di dalam objek. Property yang didefinisikan dengan <code>property</code> plus <code>accessors="true"</code> memperoleh getter/setter tanpa menulisnya sendiri, sedangkan isi method tetap memakai <code>variables.</code>. Jangan sekali-kali menempelkan data ke <code>this.</code> (mis. <code>this.gaji = 0</code>) hanya agar cepat terbaca dari luar — begitu penamaan internal berubah, semua pemanggil ikut rusak. Simpan yang publik hanya untuk kontrak objek; sisanya private di variables.</p>'
    },
    {
      type: 'text',
      html: '<h3>Pewarisan dengan extends</h3><p>Banyak kelas punya kesamaan. AkunTabungan dan Giro sama-sama punya pemilik, saldo, dan cara setor — bedanya aturan bunganya. Daripada menyalin kode, <b>kelas induk</b> <code>Akun</code> menyimpan yang umum, lalu <code>Tabungan</code> mewariskannya dengan <code>extends</code>.</p>'
    },
    {
      type: 'example',
      title: 'extends + super: mewarisi tanpa menyalin kode',
      lang: 'cfml',
      output: false,
      code: `// models/Akun.cfc — kelas induk
component {
  function init(required string pemilik) {
    variables.pemilik = arguments.pemilik;
    variables.saldo   = 0;
    return this;
  }
  function getSaldo() { return variables.saldo; }
}

// models/Tabungan.cfc — kelas anak
component extends="Akun" {
  property name="bunga" type="numeric";

  function init(required string pemilik) {
    super.init( arguments.pemilik );   // WAJIB diteruskan ke induk
    variables.bunga = 2.5;
    return this;
  }

  function setor(required numeric jumlah) {
    variables.saldo += arguments.jumlah;
  }

  function saldoAkhir() {
    return variables.saldo + (variables.saldo * variables.bunga / 100);
  }
}

<cfscript>
t = new models.Tabungan("Budi Santoso");
t.setor(1000000);
writeOutput( t.saldoAkhir() );   // memakai saldo milik induk + bunga milik anak
</cfscript>`,
      explain: [
        'extends membuat Tabungan memperoleh semua method publik Akun, termasuk getSaldo().',
        'Kalau kelas anak menulis init() sendiri, ia <b>wajib</b> memanggil <code>super.init()</code> — kalau tidak, data induk (pemilik, saldo) tidak pernah terisi.',
        'Di gaya tag penulisannya sama: <code>&lt;cfset super.init(arguments.pemilik)&gt;</code> (bentuk lama <code>super::init()</code> masih kamu temui di kode CFML lawas).',
        'Method baru (setor, saldoAkhir) menambah perilaku tanpa mengubah induk — turunan lain seperti Giro tidak ikut terdampak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Abstract &amp; Final</h3><p><b>abstract</b> menandai kelas dasar yang hanya boleh diwariskan, tidak boleh dibuat instance-nya: <code>component abstract="true"</code> cocok untuk Akun yang "setor"-nya tiap anak mendefinisikan sendiri. <b>final</b> kebalikannya: menutup kelas agar tidak boleh diturunkan lagi (<code>component final="true"</code>), dan pada method menutup method agar tidak boleh ditimpa anak. Keduanya mengubah galat di masa depan jadi galat yang cepat ketahuan.</p>'
    },
    {
      type: 'example',
      title: 'abstract untuk kelas dasar, final untuk kelas siap pakai',
      lang: 'cfml',
      output: false,
      code: `// models/Akun.cfc — dasar, tidak boleh di-new langsung
component abstract="true" {
  function init(required string pemilik) {
    variables.pemilik = arguments.pemilik;
    variables.saldo   = 0;
    return this;
  }
}

// models/Tabungan.cfc — kelas final: berhenti di sini
component extends="Akun" final="true" {
  function init(required string pemilik) {
    super.init( arguments.pemilik );
    return this;
  }
  function setor(required numeric jumlah) {
    variables.saldo += arguments.jumlah;
  }
}

<cfscript>
// new models.Akun("x")   --> ERROR: kelas abstract tidak bisa diinstansiasi
// new models.Emas(...)   --> ERROR: Tabungan final tidak bisa diturunkan
</cfscript>`,
      explain: [
        'abstract="true" mencegah kelas dasar dipakai langsung — hanya hasil turunan yang sah.',
        'final="true" pada kelas mencegah turunan baru; pada method (atribut final di cffunction) mencegah anak menimpanya.',
        'Kombinasi abstract + final menutup celah: kelas dasar wajib diwariskan, kelas akhir wajib berhenti.',
        'Menandai abstract/final sejak awal mengubah kesalahan desain di masa depan jadi galat yang cepat ketahuan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Interface &amp; Polymorphism</h3><p><b>Interface</b> adalah kontrak tanpa isi: ia hanya menyebutkan method yang harus dimiliki siapa pun yang mengimplementasinya. Kalau DiskonMember dan DiskonRamadan sama-sama <code>implements="IDiskon"</code>, keduanya dijamin punya hitungDiskon(). <b>Polymorphism</b> lalu bekerja: satu fungsi yang menerima IDiskon bisa memanggil method yang sama, dengan perilaku berbeda tergantung objek yang dikirim.</p>'
    },
    {
      type: 'example',
      title: 'Satu kontrak, dua implementasi (polymorphism)',
      lang: 'cfml',
      output: false,
      code: `// models/IDiskon.cfc — kontrak: wajib ada hitungDiskon()
interface IDiskon {
  numeric function hitungDiskon(required numeric subtotal);
}

// models/DiskonMember.cfc
component implements="IDiskon" {
  function init(required numeric persen=10) {
    variables.persen = arguments.persen;
    return this;
  }
  function hitungDiskon(required numeric subtotal) {
    return arguments.subtotal * variables.persen / 100;
  }
}

// models/DiskonRamadan.cfc — kebijakan lain, kontrak sama
component implements="IDiskon" {
  function hitungDiskon(required numeric subtotal) {
    return arguments.subtotal > 100000 ? arguments.subtotal * 0.15 : 0;
  }
}

// pemakaian: satu fungsi, banyak implementasi
function bayar(required numeric subtotal, required IDiskon strategi) {
  return arguments.subtotal - arguments.strategi.hitungDiskon(arguments.subtotal);
}

bayar(200000, new models.DiskonMember(10));   // 180000 — diskon member 10%
bayar(200000, new models.DiskonRamadan());    // 170000 — diskon Ramadan 15%`,
      explain: [
        'interface hanya mendeklarasikan method — tidak ada badan kode di dalamnya.',
        'Kelas yang <code>implements</code> sebuah interface wajib mengisi semua method-nya; kalau tidak, error saat kompilasi kelas.',
        'Fungsi bayar tidak tahu kelas mana yang masuk — cukup tahu kontrak IDiskon (polymorphism).',
        'Menambah diskon baru cukup satu class baru; fungsi bayar tidak disentuh (prinsip open-closed).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Uji dan Ganti Komponen dengan Mudah</h3><p>Karena perilaku terkunci di class dengan kontrak jelas, kamu bisa menguji tanpa aplikasi penuh: instance Tabungan murni bisa diuji hitungBungunya tanpa database atau browser. Untuk mengganti komponen — mis. SmtpMailer jadi pengirim berbasis API — cukup buat class baru yang memenuhi kontrak yang sama; pemanggil tidak berubah. Ini sekaligus menjadi bekal ke bab berikutnya: dependency injection justru mudah bila kelas-kelasmu sudah berbasis kontrak.</p>'
    },
    {
      type: 'tip',
      title: 'Satu class, satu tanggung jawab',
      text: 'Uji sederhananya: kalau satu class mengurus query database sekaligus kirim email sekaligus render PDF, ia sudah terlalu besar. Pecah menjadi kelas yang lebih kecil dengan nama yang jelas (PesananService, Mailer, FakturPDF) — masing-masing bisa diuji dan diganti sendiri-sendiri.'
    },
    {
      type: 'warn',
      title: 'Class raksasa & pewarisan dangkal',
      text: '<b>Class raksasa</b> (god class) seperti PesananService 2000 baris melahirkan tempat semua orang menaruh kode — bug di mana-mana dan sulit diuji. <b>Pewarisan dangkal</b> seperti <code>Tabungan extends Karyawan</code> karena "sama-sama punya saldo" adalah hubungan is-a yang palsu. Gunakan pewarisan hanya untuk hubungan sejati; selain itu, pilih <b>komposisi</b> — objek punya objek lain — daripada pewarisan.'
    },
    {
      type: 'vocab',
      items: [
        ['CFC', 'Component (.cfc): wadah class di CFML; dipanggil dengan new atau createObject().'],
        ['Enkapsulasi', 'Menyembunyikan data di dalam objek (variables) dan membuka hanya kontrak publiknya.'],
        ['Pewarisan (inheritance)', 'Kelas anak memperoleh method dan property induk lewat atribut extends.'],
        ['Polimorfisme', 'Satu kontrak dipanggil banyak kelas dengan perilaku masing-masing.'],
        ['Interface', 'Kontrak tanpa isi yang mewajibkan method tertentu pada kelas yang mengimplementasinya.'],
        ['abstract / final', 'Atribut yang mewajibkan pewarisan / melarang pewarisan lebih lanjut.'],
        ['super', 'Pemanggilan method induk dari dalam kelas anak, mis. super.init().']
      ]
    }
  ],
  recap: [
    'CFC adalah class CFML; simpan data private di variables, buka hanya lewat accessor — hindari this sebagai tempat penyimpanan.',
    'extends mewariskan perilaku; kelas anak yang menulis init() wajib meneruskan ke induk dengan super.init().',
    'abstract menutup pembuatan instance, final menutup pewarisan — keduanya memperketat kontrak sejak awal.',
    'interface + implements menghasilkan kontrak tegas, dan polymorphism membuat satu fungsi menerima banyak implementasi.',
    'Kontrak yang jelas membuat kelas mudah diuji murni dan mudah diganti tanpa menyentuh pemanggilnya.',
    'Hindari class raksasa dan pewarisan dangkal; untuk hubungan yang bukan is-a, pakai komposisi.'
  ]
});
