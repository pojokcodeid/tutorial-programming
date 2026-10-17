/* ============================================================
   Pelajaran Lucee CFML — Bab 19: Testing & Code Quality (TestBox & CFLint) (L19)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-testing-quality',
  title: 'Testing & Code Quality (TestBox & CFLint)',
  chapter: 'Operasi & Profesional',
  duration: '13 menit',
  intro: [
    'Aplikasi toko online yang tidak punya test sama seperti jalan di tali: berjalan selama tidak ada yang menyalah, dan jatuh begitu ada perubahan kecil. <b>TestBox</b> — framework testing CFML open source dari Ortus — memberimu kerangka menulis test yang terbaca seperti cerita, sekaligus integrasi ke CI supaya regresi tertangkap sebelum sampai ke pengguna.',
    'Di sisi lain, banyak masalah yang tidak perlu dijalankan untuk ditemukan: variabel terlupakan, query tanpa parameter, struktur yang salah kapitalisasi. Di sinilah <b>CFLint</b> bekerja sebagai pemeriksa statis (linter), membaca kode kamu tanpa mengeksekusinya. Pelajaran ini menutup materi Lucee dengan menggabungkan ketiganya: test, linter, dan logging yang rapi.'
  ],
  objectives: [
    'Menulis spesifikasi BDD dengan describe, it, dan expect pada TestBox',
    'Menjalankan suite test lewat CommandBox dan runner web',
    'Mengganti dependensi dengan mock sederhana pada unit test',
    'Mengelola database test terpisah beserta seeding dan pembersihan data',
    'Menjalankan CFLint dan menafsirkan temuannya di CI',
    'Menangani exception terpusat lewat onError dan mencatatnya ke log'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua Jenis Test, Dua Tujuan</h3><p><b>Unit test</b> menguji satu fungsi/layanan secara terisolasi — cepat, tanpa browser, tanpa database sungguhan. <b>Integration test</b> menguji beberapa komponen bekerja sama — misalnya repository yang benar-benar bicara ke MariaDB test. TestBox menangani keduanya dalam satu framework; perbedaannya hanya di kedalaman dependensi yang kamu biarkan hidup.</p><p>Tujuan akhirnya pragmatis: kamu bisa refactor dengan tenang karena test langsung memberi tahu bila perilaku aplikasi berubah.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 170" width="760" role="img" aria-label="Pipeline kualitas: dari commit sampai deploy dengan linter, test, dan log">
        <defs><marker id="mk-l19-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="20" y="40" width="130" height="56" rx="8" class="u-box"/>
        <text x="85" y="64" class="u-title" text-anchor="middle">git commit</text>
        <text x="85" y="85" class="u-lbl" text-anchor="middle">pre-commit hook</text>
        <line x1="150" y1="68" x2="196" y2="68" class="u-line" marker-end="url(#mk-l19-1)"/>
        <rect x="200" y="40" width="130" height="56" rx="8" class="u-hd"/>
        <text x="265" y="64" class="u-title" text-anchor="middle">CFLint</text>
        <text x="265" y="85" class="u-lbl" text-anchor="middle">static analysis</text>
        <line x1="330" y1="68" x2="376" y2="68" class="u-line" marker-end="url(#mk-l19-1)"/>
        <rect x="380" y="40" width="130" height="56" rx="8" class="u-hd"/>
        <text x="445" y="64" class="u-title" text-anchor="middle">TestBox</text>
        <text x="445" y="85" class="u-lbl" text-anchor="middle">unit + integration</text>
        <line x1="510" y1="68" x2="556" y2="68" class="u-line" marker-end="url(#mk-l19-1)"/>
        <rect x="560" y="40" width="180" height="56" rx="8" class="u-box"/>
        <text x="650" y="64" class="u-title" text-anchor="middle">Deploy produksi</text>
        <text x="650" y="85" class="u-lbl" text-anchor="middle">hanya bila semua hijau</text>
        <text x="380" y="140" class="u-lbl" text-anchor="middle">Gagal di CFLint/TestBox = commit ditolak; produksi hanya menerima kode yang sudah lulus</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 19.1</b> — Gerbang kualitas: linter dan test menjadi syarat sebelum kode naik</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>TestBox: Spesifikasi dengan Gaya BDD</h3><p>TestBox memakai gaya <b>BDD</b> (Behavior Driven Development): kamu menuliskan perilaku yang diharapkan memakai <code>describe()</code> untuk kelompok dan <code>it()</code> untuk satu kasus, lalu menyatakan harapan dengan <code>expect()</code> plus matcher seperti <code>toBe</code>, <code>toBeEmpty</code>, <code>toContain</code>, dan <code>toThrow()</code>. Spesifikasi ditulis di dalam CFC yang mewarisi <code>BaseSpec</code>.</p>'
    },
    {
      type: 'example',
      title: 'Spesifikasi TestBox untuk layanan keranjang',
      lang: 'cfml',
      output: false,
      code: `component extends="testbox.system.BaseSpec" {

  function run() {
    describe( "KeranjangService", function() {

      it( "menambahkan item baru ke keranjang", function() {
        var keranjang = new models.KeranjangService();
        keranjang.tambah( productId: 1024, qty: 2 );
        expect( keranjang.daftar() ).toBeArray();
        expect( keranjang.daftar() ).toHaveLength( 1 );
        expect( keranjang.total() ).toBe( 190000 );
      } );

      it( "menolak qty negatif", function() {
        var keranjang = new models.KeranjangService();
        expect( function() {
          keranjang.tambah( productId: 1024, qty: -1 );
        } ).toThrow( type = "ValidationException" );
      } );

      it( "menghasilkan keranjang kosong di awal", function() {
        expect( new models.KeranjangService().daftar() ).toBeEmpty();
      } );
    } );
  }
}`,
      explain: [
        '<code>run()</code> adalah satu-satunya method wajib — di dalamnya seluruh describe/it ditulis.',
        'Matcher <code>toBe</code> membandingkan nilai, <code>toBeEmpty</code> memeriksa string/array/struct kosong, dan <code>toThrow</code> memastikan exception dilempar.',
        'Bungkus pemanggilan dalam closure <code>function() { … }</code> saat memakai toThrow, lalu sebutkan tipe exception yang diharapkan.',
        'Baca nama test sebagai kalimat: "menolak qty negatif" — inilah nilai BDD: test sekaligus dokumentasi.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan test via CommandBox & browser',
      lang: 'bash',
      output: false,
      code: `# Sekali di awal proyek: pasang TestBox + CLI tools-nya
box install testbox testbox-cli

# Jalankan seluruh suite dari terminal (exit code 1 bila ada test gagal)
box testbox run

# Saring hanya folder tertentu, misalnya saat mengembangkan satu fitur
# (pakai dot notation, bukan garis miring)
box testbox run directory=tests.specs.unit

# Di browser: buka runner bawaan TestBox, misalnya
# http://localhost:8080/tests/runner.cfm`,
      explain: [
        'CommandBox membaca <code>box testbox run</code> sebagai perintah menjalankan suite lewat HTTP ke server yang sedang berjalan.',
        'Exit code non-nol saat test gagal membuatnya langsung bisa dipakai sebagai gerbang di CI.',
        'Runner web berguna saat ingin melihat detail interaktif atau membandingkan hasil antar suite.'
      ]
    },
    {
      type: 'tip',
      title: 'Mock: uji satu komponen tanpa menyeret semuanya',
      text: 'Saat unit test, dependensi berat (database, API ongkir) sebaiknya dimock. TestBox membawa <b>MockBox</b>: <code>createMock( "models.OngkirService" )</code> menghasilkan tiruan, dan <code>mock.$( "cekTarif" ).returns( 15000 )</code> menyetel balasannya. Uji logika keranjang dengan tarif ongkir tetap, tanpa menyentuh jaringan.'
    },
    {
      type: 'example',
      title: 'Mock dependensi dalam integration test',
      lang: 'cfml',
      output: false,
      code: `component extends="testbox.system.BaseSpec" {

  function run() {
    it( "menghitung ongkir gratis di atas Rp 500.000", function() {
      var ongkir = createMock( "models.OngkirService" );
      ongkir.$( "cekTarif" ).returns( 15000 );
      var checkout = new models.CheckoutService( ongkirService = ongkir );

      expect( checkout.ongkir( subtotal: 600000 ) ).toBe( 0 );
      expect( checkout.ongkir( subtotal: 100000 ) ).toBe( 15000 );
      // Metode asli tidak pernah dipanggil — perilaku ongkir sepenuhnya dikendalikan test
      expect( ongkir.$once( "cekTarif" ) ).toBeTrue();
    } );
  }
}`,
      explain: [
        '<code>createMock()</code> mengembalikan tiruan komponen; method yang tidak distub tetap berjalan normal.',
        '<code>$( "method" ).returns( nilai )</code> menyetel balasan tiruan sehingga hasil perhitungan bisa dipastikan.',
        '<code>$once()</code> memverifikasi method dipanggil tepat satu kali — memastikan ongkir tidak dihitung ganda.',
        'Dengan begini integration test tetap cepat dan tidak bergantung pada tarif API eksternal yang berubah-ubah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Database Test Terpisah, Data Terkontrol</h3><p>Integration test yang menyentuh database wajib memakai <b>datasource test terpisah</b> (misalnya <code>appDB_test</code>) supaya data produksi tidak pernah tersentuh. Kuncinya ada dua: <b>seeding</b> data yang dibutuhkan sebelum tiap test, dan <b>pembersihan</b> setelahnya, sehingga test tidak saling menggantung dan bisa dijalankan berulang kali dengan hasil sama.</p>'
    },
    {
      type: 'example',
      title: 'Seeding & pembersihan dengan beforeEach/afterEach',
      lang: 'cfml',
      output: false,
      code: `component extends="testbox.system.BaseSpec" {

  function run() {
    describe( "ProdukRepository (integration)", function() {

      beforeEach( function() {
        queryExecute( "INSERT INTO produk ( id, nama, harga ) VALUES ( 9001, 'Kopi Test', 10000 )",
                      [], { datasource: "appDB_test" } );
      } );

      afterEach( function() {
        queryExecute( "DELETE FROM produk WHERE id = 9001",
                      [], { datasource: "appDB_test" } );
      } );

      it( "menemukan produk berdasarkan id", function() {
        var repo = new models.ProdukRepository( dsn: "appDB_test" );
        var produk = repo.cariById( 9001 );
        expect( produk.nama ).toContain( "Kopi" );
      } );
    } );
  }
}`,
      explain: [
        '<code>beforeEach()</code> berjalan sebelum tiap it, <code>afterEach()</code> setelahnya — data test selalu bersih dan seragam.',
        'Datasource <code>appDB_test</code> didefinisikan terpisah; pada proyek nyata sering berupa MySQL/MariaDB khusus test atau schema berbeda.',
        'ID tetap (9001) dipakai agar test deterministik — hindari ID hasil auto-increment yang berganti tiap run.',
        'Pastikan kredensial database test berbeda dan lebih longgar dari produksi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>CFLint: Membaca Kode Tanpa Menjalan</h3><p><b>CFLint</b> adalah static code analysis (linter) CFML: ia mem-parse kode dan menandai masalah yang sering berujung bug — variabel tidak dideklarasikan dengan <code>var</code>, variabel lokal terlupakan, query tanpa <code>cfqueryparam</code>, fungsi terlalu kompleks, atau pengecekan boolean yang tidak perlu eksplisit. Instalasi paling praktis lewat modul CommandBox <code>commandbox-cflint</code>, lalu jalankan perintah <code>box cflint</code>.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan CFLint & mengatur aturannya',
      lang: 'bash',
      output: false,
      code: `# Pasang modul linter sekali
box install commandbox-cflint

# Scan seluruh komponen & halaman
box cflint **.cfc,**.cfm

# Hanya tampilkan WARNING ke atas, atau hasilkan laporan CI
box cflint **.cfc,**.cfm reportLevel=WARNING
box cflint **.cfc,**.cfm --junit
box cflint models/**.cfc --html`,
      explain: [
        'Output konsol menunjukkan file, baris, kode temuan, dan tingkat keparahannya (INFO/WARNING/ERROR).',
        'Parameter <code>reportLevel=WARNING</code> menyaring INFO agar laporan lebih fokus pada masalah berarti.',
        'Flag <code>--junit</code> menghasilkan XML yang bisa langsung dibaca panel CI seperti GitLab CI atau Jenkins.',
        'Dengan pola seperti <code>models/**.cfc</code>, kamu bisa memeriksa hanya bagian proyek yang sedang disentuh.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi CFLint (.cflintrc JSON)',
      lang: 'json',
      output: false,
      code: `{
  "includes": [ { "code": "MISSING_VAR" }, { "code": "CFQUERYPARAM_REQ" } ],
  "excludes": [ { "code": "ARG_HINT_MISSING" } ],
  "parameters": {
    "SimpleComplexityChecker.maximum": "12",
    "VariableNameChecker.minLength": "3"
  },
  "inheritParent": true
}`,
      explain: [
        'CFLint membaca konfigurasi JSON (berkas <code>.cflintrc</code> per folder, atau file kustom seperti CFLint.json) — aturan bisa berbeda per bagian proyek.',
        'Kode temuan seperti <code>MISSING_VAR</code> (variabel tanpa var), <code>CFQUERYPARAM_REQ</code> (query tanpa parameter), dan <code>FUNCTION_TOO_COMPLEX</code> bisa dimatikan bila memang tidak relevan.',
        'Parameter <code>SimpleComplexityChecker.maximum</code> mengatur ambang kompleksitas fungsi sebelum diberi peringatan.',
        '<code>inheritParent</code> membuat konfigurasi folder induk ikut berlaku ke folder anak.'
      ]
    },
    {
      type: 'warn',
      title: 'Test hanya jalur bahagia itu ilusi',
      text: 'Test yang hanya memeriksa "kalau benar maka benar" memberi rasa aman palsu. Selalu tambahkan kasus ruas batas (qty 0, produk habis, string kosong), kasus gagal (token kedaluwarsa, database timeout), dan kasus aneh (karakter khusus di nama produk). Test yang paling berharga justru yang pernah menangkap bug nyata — rawat dan tambahkan kasus regresinya.'
    },
    {
      type: 'text',
      html: '<h3>Logging &amp; Penanganan Error Terpusat</h3><p>Test mengurangi bug, tapi produksi tetap akan memunculkan sesuatu yang tak terduga. Lalu <b>log</b> yang benar membuat insiden bisa ditelusuri: fungsi <code>writeLog()</code> (atau tag <code>&lt;cflog&gt;</code>) menulis ke berkas log di folder <code>lucee-server/context/logs</code>, dengan nama berkas sesuai parameter <code>file</code>. Untuk aplikasi besar, framework logging seperti <b>LogBox</b> menambah level, appender, dan rotasi berkas; untuk visibilitas global, kirim error ke layanan monitoring seperti <b>Sentry</b>.</p>'
    },
    {
      type: 'example',
      title: 'onError terpusat & alur rethrow',
      lang: 'cfml',
      output: false,
      code: `// Application.cfc — satu pintu penanganan error request
function onError( required any exception, required string eventName ) {
  writeLog( file = "toko-error", type = "error",
            text = "#exception.type# | #exception.message# | #eventName#" );

  // Kirim ke monitoring global (Sentry) supaya tidak terlewat
  // sentryService.capture( exception );

  include "/views/errors/terjadi-kesalahan.cfm";   // halaman ramah, tanpa stacktrace
}

// Di kode bisnis: catat dulu, biarkan onError yang menampilkan halaman
try {
  pesananService.proses( form );
} catch ( any e ) {
  writeLog( file = "toko-error", type = "error", text = e.message );
  rethrow;
}`,
      explain: [
        '<code>onError()</code> di Application.cfc menangkap semua exception yang tidak tertangani di request berjalan.',
        '<code>rethrow</code> meneruskan exception setelah dicatat, sehingga penanganan tampilan tetap terpusat di satu tempat.',
        'Halaman error produksi menampilkan pesan ramah tanpa stacktrace — detail teknis hanya ada di log.',
        'Log dipisah per topik (toko-error) agar mudah dipantau; pada instalasi Lucee berkasnya berada di folder logs konteks server.'
      ]
    },
    {
      type: 'tip',
      title: 'Jadikan test & linter gerbang otomatis',
      text: 'Kualitas bertahan bila dijalankan otomatis: pasang <code>box testbox run</code> dan <code>box cflint</code> di pipeline CI supaya setiap push diverifikasi, dan bila timmu memakai git hooks, jalankan linter cepat pada pre-commit. Anggap temuan INFO sebagai pekerjaan rumah mingguan, sementara ERROR harus beres sebelum commit diterima.'
    },
    {
      type: 'vocab',
      items: [
        ['TestBox', 'Framework testing CFML open source (Ortus) dengan gaya BDD/TDD.'],
        ['BDD', 'Behavior Driven Development — menulis test sebagai kalimat perilaku: describe, it, expect.'],
        ['Matcher', 'Metode pembanding pada expect(), misalnya toBe, toBeEmpty, toContain, toThrow.'],
        ['Mock / MockBox', 'Tiruan komponen untuk mengganti dependensi berat saat unit test.'],
        ['CFLint', 'Static code analysis/linter CFML yang menandai potensi bug tanpa menjalankan kode.'],
        ['Seeding', 'Penyiapan data test secara terprogram sebelum test dijalankan.'],
        ['rethrow', 'Kata kunci meneruskan exception setelah dicatat ke log.']
      ]
    }
  ],
  recap: [
    'TestBox menulis spesifikasi BDD: describe/it dengan expect() plus matcher seperti toBe, toBeEmpty, toContain, toThrow.',
    'Suite dijalankan lewat box testbox run (exit code non-nol saat gagal) atau runner web untuk analisis interaktif.',
    'MockBox (createMock + $().returns()) mengganti dependensi berat sehingga unit test cepat dan deterministik.',
    'Integration test memakai datasource test terpisah dengan seeding di beforeEach dan pembersihan di afterEach.',
    'CFLint menandai masalah statis (MISSING_VAR, CFQUERYPARAM_REQ, kompleksitas) dan hasilnya bisa disaring CI lewat format JUnit.',
    'onError() sebagai pintu tunggal penanganan error: catat ke log, tampilkan halaman ramah tanpa stacktrace, rethrow bila perlu.'
  ]
});
