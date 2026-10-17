/* ============================================================
   Pelajaran Lucee CFML — Bab 14: Dependency Injection & IoC (L14)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-di-wirebox',
  title: 'Dependency Injection & IoC (WireBox)',
  chapter: 'Arsitektur Modern',
  duration: '12 menit',
  intro: [
    'Kode CFML yang tumbuh cepat biasanya penuh <code>createObject()</code> dan <code>new</code> yang tersebar: controller membuat service, service membuat gateway, gateway membuat koneksi. Setiap kelas tahu persis kelas lain yang dipakainya — istilahnya <b>tight coupling</b>. Akibatnya, mengganti satu komponen berarti mengubah banyak file, dan menguji satu kelas harus menyiapkan database serta layanan luar sungguhan.',
    '<b>IoC</b> (Inversion of Control, pembalikan kendali) membalik kebiasaan itu: objek tidak membuat dependensinya sendiri, melainkan <b>container</b> yang membuat lalu menyambungkannya — proses yang disebut <b>Dependency Injection</b>.',
    'Di ekosistem CFML, container DI yang paling mapan adalah <b>WireBox</b> dari keluarga ColdBox/Ortus (open source). Pelajaran ini memulainya dari pola manual, lalu masuk ke WireBox, dan menutup dengan pola desain dasar: DAO, Gateway, Factory, Singleton, dan Repository.'
  ],
  objectives: [
    'Mengenali tight coupling akibat createObject yang tersebar',
    'Menerapkan dependency injection bergaya constructor dan setter',
    'Mengonfigurasi mapping dan injeksi dengan WireBox',
    'Mengenali pola DAO, Gateway, Factory, Singleton, dan Repository',
    'Menilai kapan pola besar justru menjadi over-engineering'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Masalah: Objek yang Dibuat di Mana-mana</h3><p>Lihat potongan toko online berikut. Kelas <code>PesananService</code> menerima gateway dan mailer yang dibuatkan oleh halaman pemanggil — dan halaman mana pun yang ingin memakai service ini wajib mengulang pekerjaan yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Tanpa DI: dependensi dijahit di kode bisnis',
      lang: 'cfml',
      output: false,
      code: `<!-- beli.cfm — satu dari 12 halaman yang menulis pola sama -->
<cfscript>
produkGateway = createObject("component", "models.ProdukGateway").init("appDB");
mailer        = createObject("component", "services.SmtpMailer").init("smtp.kopi.id");

service = new models.PesananService(produkGateway, mailer);
service.buatPesanan(form);
</cfscript>`,
      explain: [
        'Halaman tahu persis nama class gateway dan mailer — detail teknis bocor ke lapisan halaman.',
        'Bila SmtpMailer diganti layanan berbasis API, semua halaman pemanggil harus dibuka dan diubah.',
        'Menguji PesananService berarti ikut membuat gateway database dan koneksi SMTP sungguhan.',
        'Duplikasi init() di banyak halaman = tempat lahirnya salah ketik dan konfigurasi berbeda-beda.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dependency Injection: Constructor vs Setter</h3><p><b>DI constructor</b> mengirim dependensi saat instance dibuat — kelas tidak pernah hidup dalam keadaan setengah siap. <b>DI setter</b> memasang dependensi lewat method set…(), berguna untuk ketergantungan opsional atau saat ingin menyambung ulang objek saat pengujian. Pola apa pun yang dipakai, kuncinya sama: kelas <b>menerima</b> objek, bukan <b>membuatnya</b>.</p>'
    },
    {
      type: 'example',
      title: 'Constructor DI vs setter DI',
      lang: 'cfml',
      output: false,
      code: `// models/PesananService.cfc — gaya constructor DI
component {
  function init(required any produkGateway, required any mailer) {
    variables.produkGateway = arguments.produkGateway;
    variables.mailer        = arguments.mailer;
    return this;
  }

  function buatPesanan(required struct data) {
    var produk = variables.produkGateway.cariByID( arguments.data.produkId );
    variables.mailer.kirim( produk.emailPenjual, "Pesanan baru: " & produk.nama );
    return true;
  }
}

// gaya setter DI — dependensi bisa dipasang belakangan
function setMailer(required any mailer) {
  variables.mailer = arguments.mailer;
}`,
      explain: [
        'Parameter init() hanya menyebut <code>any</code> — kelas tidak peduli class apa yang masuk, yang penting bisa dipanggil.',
        'Constructor DI memaksa dependensi lengkap sejak baris pertama: salah kirim langsung gagal, bukan gagal di tengah jalan.',
        'Setter DI cocok untuk dependensi opsional, dan memudahkan pengujian: ganti mailer dengan mock lewat setMailer().',
        'Kelas kini bebas tahu asal-usul objeknya — persiapan untuk container DI.'
      ]
    },
    {
      type: 'text',
      html: '<h3>WireBox: Container DI untuk CFML</h3><p><b>WireBox</b> adalah container DI open source dari ekosistem ColdBox/Ortus yang berjalan di atas Lucee. Ia bekerja dalam dua langkah: kamu <b>memetakan</b> nama → class lewat binder, lalu meminta instance lewat <code>wirebox.getInstance("Nama")</code> atau mendeklarasikannya dengan <code>property ... inject</code>. WireBox yang membuat objek, memanggil init(), lalu mengisi semua dependensinya. Pasang bersama ColdBox lewat CommandBox dengan <code>box install coldbox</code>, atau gunakan WireBox sebagai bagian modul proyek kamu.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 250" width="760" role="img" aria-label="Alur IoC: container WireBox membuat dan menyambungkan objek">
        <defs><marker id="mk-l14-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="30" y="95" width="160" height="60" rx="8" class="u-box"/>
        <text x="110" y="120" class="u-title" text-anchor="middle">Halaman / Controller</text>
        <text x="110" y="142" class="u-lbl" text-anchor="middle">tidak perlu createObject</text>
        <line x1="193" y1="125" x2="245" y2="125" class="u-line" marker-end="url(#mk-l14-1)"/>
        <text x="219" y="115" class="u-lbl" text-anchor="middle">getInstance()</text>
        <rect x="250" y="55" width="220" height="140" rx="10" class="u-hd"/>
        <text x="360" y="85" class="u-title" text-anchor="middle">WireBox</text>
        <text x="360" y="107" class="u-lbl" text-anchor="middle">IoC container</text>
        <text x="360" y="127" class="u-lbl" text-anchor="middle">binder: nama → class</text>
        <line x1="300" y1="145" x2="420" y2="145" class="u-line"/>
        <text x="360" y="170" class="u-lbl" text-anchor="middle">.map("UserService").to("models.UserService")</text>
        <line x1="473" y1="90" x2="535" y2="90" class="u-line" marker-end="url(#mk-l14-1)"/>
        <text x="504" y="80" class="u-lbl" text-anchor="middle">injeksi</text>
        <rect x="540" y="60" width="185" height="60" rx="8" class="u-box"/>
        <text x="632" y="85" class="u-title" text-anchor="middle">UserService</text>
        <text x="632" y="107" class="u-lbl" text-anchor="middle">property inject terisi</text>
        <line x1="632" y1="123" x2="632" y2="168" class="u-dash" marker-end="url(#mk-l14-1)"/>
        <rect x="540" y="173" width="185" height="55" rx="8" class="u-box"/>
        <text x="632" y="197" class="u-title" text-anchor="middle">ProdukGateway</text>
        <text x="632" y="216" class="u-lbl" text-anchor="middle">dependensi kelas</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Container membuat &amp; menyambungkan; kelas tidak perlu tahu asal objeknya</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Mapping binder + injeksi property',
      lang: 'cfml',
      output: false,
      code: `// Application.cfc — onApplicationStart: daftarkan sekali saat aplikasi mulai
function onApplicationStart() {
  wirebox.getBinder()
    .map("UserService")
    .to("models.UserService");

  wirebox.getBinder()
    .map("PesananGateway")
    .to("models.PesananGateway");

  return true;
}

// models/PesananService.cfc — dependensi datang dari container
component {
  property name="produkGateway" inject="ProdukGateway";
  property name="mailer"        inject="SmtpMailer";

  function buatPesanan(required struct data) {
    var produk = variables.produkGateway.cariByID( arguments.data.produkId );
    variables.mailer.kirim( produk.emailPenjual, "Pesanan baru!" );
    return true;
  }
}`,
      explain: [
        '<code>wirebox.getBinder().map("UserService").to("models.UserService")</code> mengikat nama pendek ke path class.',
        'Deklarasi <code>property ... inject="ProdukGateway"</code> meminta WireBox mengisi field itu setiap instance dibuat.',
        'Pemetaan terpusat di satu tempat — mengganti implementasi cukup mengubah satu baris .to(...).',
        'OnApplicationStart memuat pemetaan sekali, bukan tiap request.'
      ]
    },
    {
      type: 'example',
      title: 'Memakai getInstance dari halaman mana pun',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
// satu baris, tanpa createObject dan tanpa urutan init() manual
user = wirebox.getInstance("UserService");

writeOutput( user.namaLengkap() );

// WireBox membuat instance models.UserService,
// menjalankan init() bila ada, lalu mengisi semua property inject.
</cfscript>`,
      explain: [
        'getInstance menerima nama yang sudah dipetakan pada binder.',
        'Rantai pembuatan objek (service → gateway → koneksi) diselesaikan otomatis oleh container.',
        'Halaman cukup tahu nama layanan, tidak tahu-menahu struktur di baliknya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Manfaat terbesar muncul saat pengujian dan penggantian. Untuk menguji <code>PesananService</code>, kamu cukup memasang <b>mock</b> (objek palsu yang mencatat panggilan) lewat inject: gateway mock tidak menyentuh database, mailer mock tidak mengirim email apa pun. Untuk mengganti SmtpMailer dengan layanan API, ubah pemetaan binder — nol perubahan di kelas service. Inilah inti IoC: <b>keputusan "pakai class apa" diambil di konfigurasi, bukan di dalam kode bisnis</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Pola Desain Dasar CFML</h3><p>DI biasanya berjalan bersama beberapa pola berulang berikut. <b>DAO</b> (Data Access Object) mengisolasi SQL — satu-satunya tempat yang boleh tahu nama tabel. <b>Gateway</b> mengemas operasi bisnis di atas DAO. <b>Factory</b> membuat objek yang tepat berdasarkan kondisi (mis. tipe pembayaran). <b>Singleton</b> menjamin satu instance tunggal yang dipakai bersama lewat application scope. <b>Repository</b> menghadirkan koleksi objek seolah itu koleksi dalam memori (findAll(), simpan()) dan menyembunyikan asal data.</p>'
    },
    {
      type: 'example',
      title: 'DAO + Gateway: SQL terisolasi, bisnis di atasnya',
      lang: 'cfml',
      output: false,
      code: `// models/ProdukDAO.cfc — satu-satunya tempat yang boleh tahu SQL
component {
  function init(required string ds) { variables.ds = arguments.ds; return this; }

  function semua() {
    return queryExecute(
      "SELECT id, nama, harga, stok FROM produk ORDER BY nama",
      {}, { datasource: variables.ds }
    );
  }

  function cariByID(required numeric id) {
    return queryExecute(
      "SELECT id, nama, harga, stok FROM produk WHERE id = :id",
      { id: arguments.id }, { datasource: variables.ds }
    );
  }
}

// models/ProdukGateway.cfc — keputusan bisnis di atas DAO
component {
  function init(required any dao) { variables.dao = arguments.dao; return this; }

  function produkTersedia() {
    var hasil = [];
    var q = variables.dao.semua();
    loop query=q {
      if ( q.stok > 0 ) {
        arrayAppend(hasil, { id: q.id, nama: q.nama, harga: q.harga });
      }
    }
    return hasil;
  }
}`,
      explain: [
        'DAO hanya mengembalikan data mentah: query, tanpa logika harga atau stok.',
        'Gateway menambah aturan bisnis (stok &gt; 0 = tersedia) tanpa menulis ulang SQL.',
        'Bila tabel berubah struktur, cukup perbaiki DAO — gateway dan halaman tidak ikut tersentuh.',
        'Keduanya sama-sama siap dipasang sebagai mapping WireBox lalu di-inject ke service.'
      ]
    },
    {
      type: 'warn',
      title: 'Singleton di application scope: hati-hati thread',
      text: 'Lucee memproses banyak request secara bersamaan di thread berbeda. Bila objek singleton di application scope menyimpan state yang diubah (counter, cache yang ditulis), dua request bisa menulis bersamaan dan datanya rusak. Aturannya: singleton sebaiknya <b>immutable</b> (tidak berubah); bila harus mengubah state, bungkus dengan <code>&lt;cflock scope="application"&gt;</code> dan simpan blok sesingkat mungkin.'
    },
    {
      type: 'text',
      html: '<h3>Kapan Pola Besar Justru Merugikan</h3><p>Setiap pola punya biaya: kelas bertambah, lompatan kode makin jauh, dan developer baru butuh waktu mengikuti alurnya. Untuk aplikasi kecil — CRUD sederhana dengan beberapa halaman — cukup struktur rapi dari bab modularisasi plus queryExecute langsung. Pola mulai terbayar saat muncul tanda nyata: SQL yang menyebar ke puluhan tempat (saatnya DAO), kelas yang mulai saling menyuapi (saatnya DI), atau kebutuhan menguji logika bisnis tanpa database (saatnya kontrak + mock).</p>'
    },
    {
      type: 'tip',
      title: 'Tambah lapisan saat mulai terasa sakit, bukan saat mulai menulis',
      text: 'Mulailah dari satu folder models/ yang berisi CFC sederhana. Pecah menjadi DAO/Gateway ketika memang ada duplikasi, pasang WireBox ketika pembuatan objek sudah lebih dari dua tempat. Arsitektur yang ditulis sejak baris pertama untuk aplikasi kecil biasanya berakhir sebagai abstraksi kosong yang hanya memperlambat.'
    },
    {
      type: 'vocab',
      items: [
        ['IoC', 'Inversion of Control — pembalikan kendali: objek dibuat & disambungkan container, bukan kelasnya sendiri.'],
        ['Dependency Injection', 'Teknik memberi (meng-inject) dependensi dari luar, lewat constructor atau setter.'],
        ['WireBox', 'Container DI open source dari ekosistem ColdBox/Ortus untuk CFML.'],
        ['DAO', 'Data Access Object — lapisan yang mengisolasi semua akses SQL ke tabel.'],
        ['Gateway', 'Lapisan operasi bisnis di atas DAO; mengembalikan hasil dalam istilah domain.'],
        ['Singleton', 'Pola satu instance tunggal; di CFML biasanya disimpan di application scope.'],
        ['Repository', 'Abstraksi koleksi objek: menyembunyikan apakah datanya dari database, cache, atau API.']
      ]
    }
  ],
  recap: [
    'createObject tersebar membuat tight coupling; IoC membaliknya — container yang membuat dan menyambungkan objek.',
    'DI constructor mengirim dependensi saat init(); DI setter memasangnya lewat method set… untuk kebutuhan opsional.',
    'WireBox memetakan nama ke class dengan wirebox.getBinder().map(...).to(...), lalu mengisi property inject atau lewat getInstance().',
    'DI membuat pengujian mudah (pasang mock) dan penggantian implementasi cukup mengubah satu pemetaan.',
    'Pola dasar CFML: DAO (isolasi SQL), Gateway (operasi bisnis), Factory, Singleton (application scope + lock), Repository.',
    'Untuk proyek kecil, pola besar adalah over-engineering — tambahkan lapisan saat rasa sakitnya sudah nyata.'
  ]
});
