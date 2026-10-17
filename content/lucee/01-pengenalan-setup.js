/* ============================================================
   Pelajaran Lucee CFML — Bab 1: Fondasi & Dasar (L1)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-pengenalan-setup',
  title: 'Pengenalan Ecosystem & Setup Environment',
  chapter: 'Fondasi & Dasar',
  duration: '11 menit',
  intro: [
    '<b>CFML</b> (ColdFusion Markup Language) adalah bahasa skrip server-side untuk membangun aplikasi web bisnis: toko online, sistem karyawan, sampai portal artikel. Kodenya bercampur dengan HTML, sehingga kamu bisa menaruh query database dan logika aplikasi tepat di dalam halaman.',
    '<b>Lucee</b> adalah mesin CFML modern yang open source dan berjalan di atas JVM. Di pelajaran ini kamu mengenal ekosistemnya, memasang server lokal memakai CommandBox, lalu menulis program pertama: halaman <b>Hello World</b> <code>index.cfm</code>.'
  ],
  objectives: [
    'Menjelaskan apa itu CFML dan posisi Lucee di dalamnya',
    'Memasang CommandBox dan menjalankan server Lucee lokal',
    'Memahami alur pemrosesan CFML dari source ke bytecode Java',
    'Membedakan peran file .cfm, .cfc, dan Application.cfc',
    'Menyiapkan editor VS Code atau Neovim dengan dukungan CFML',
    'Menulis dan menjalankan program pertama index.cfm'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu CFML?</h3><p><b>CFML</b> adalah kependekan dari <i>ColdFusion Markup Language</i>, bahasa yang lahir bersama ColdFusion 1.0 pada tahun 1995. Mesin yang menjalankannya ada dua kubu: Adobe ColdFusion (komersial) dan <b>Lucee</b> (open source). Ciri khasnya, kamu menulis tag seperti <code>&lt;cfset&gt;</code>, <code>&lt;cfoutput&gt;</code>, dan <code>&lt;cfquery&gt;</code> di antara baris HTML biasa.</p><p>Semua kode diproses di <b>server</b>; browser hanya menerima HTML jadi. Karena itu kamu tidak akan pernah bisa membaca kode CFML asli dari sebuah situs — sama seperti PHP atau ASP.NET.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kenapa Lucee?</h3><ul><li><b>Open source</b> — memakai lisensi LGPL v2.1, bebas dipakai, dimodifikasi, dan didistribusikan tanpa biaya lisensi.</li><li><b>Performa tinggi</b> — kode dikompilasi menjadi bytecode Java, bukan ditafsirkan ulang dari nol tiap request.</li><li><b>Komunitas hidup</b> — dokumentasi resmi di docs.lucee.org, forum pengembang, dan rilis rutin.</li><li><b>Syntax kompatibel</b> — mayoritas kode ColdFusion berjalan apa adanya di Lucee.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 210" width="760" role="img" aria-label="Alur pemrosesan CFML dari source ke HTML">
        <defs><marker id="mk-l01-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="30" y="60" width="120" height="64" rx="8" class="u-box"/>
        <text x="90" y="86" class="u-title" text-anchor="middle">index.cfm</text>
        <text x="90" y="106" class="u-lbl" text-anchor="middle">source CFML</text>
        <line x1="152" y1="92" x2="171" y2="92" class="u-line" marker-end="url(#mk-l01-1)"/>
        <rect x="175" y="60" width="120" height="64" rx="8" class="u-hd"/>
        <text x="235" y="86" class="u-title" text-anchor="middle">Lucee</text>
        <text x="235" y="106" class="u-lbl" text-anchor="middle">parser + compiler</text>
        <line x1="297" y1="92" x2="316" y2="92" class="u-line" marker-end="url(#mk-l01-1)"/>
        <rect x="320" y="60" width="120" height="64" rx="8" class="u-box"/>
        <text x="380" y="86" class="u-title" text-anchor="middle">.class</text>
        <text x="380" y="106" class="u-lbl" text-anchor="middle">bytecode Java</text>
        <line x1="442" y1="92" x2="461" y2="92" class="u-line" marker-end="url(#mk-l01-1)"/>
        <rect x="465" y="60" width="120" height="64" rx="8" class="u-box"/>
        <text x="525" y="86" class="u-title" text-anchor="middle">JVM</text>
        <text x="525" y="106" class="u-lbl" text-anchor="middle">+ Tomcat</text>
        <line x1="587" y1="92" x2="606" y2="92" class="u-line" marker-end="url(#mk-l01-1)"/>
        <rect x="610" y="60" width="120" height="64" rx="8" class="u-box"/>
        <text x="670" y="86" class="u-title" text-anchor="middle">HTML</text>
        <text x="670" y="106" class="u-lbl" text-anchor="middle">ke browser</text>
        <text x="380" y="165" class="u-lbl" text-anchor="middle">source dikompilasi sekali — request berikutnya tinggal menjalankan bytecode yang sama</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Alur pemrosesan CFML di Lucee: source → bytecode Java → JVM/Tomcat</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Instalasi &amp; Menjalankan Server</h3><p>Cara tercepat menjalankan Lucee lokal adalah lewat <b>CommandBox</b>, terminal khusus dari Ortus Solutions yang mengelola server CFML. Setelah memasang CommandBox, cukup berdiri di folder proyek lalu jalankan perintah di bawah ini.</p>'
    },
    {
      type: 'example',
      title: 'Perintah CommandBox sehari-hari',
      lang: 'bash',
      output: false,
      code: `# server start: nyalakan Lucee di http://127.0.0.1:8080
box server start
box server list                     # daftar server yang sedang berjalan
box server open                     # buka aplikasi di browser default
box server restart                  # jalankan ulang setelah ubah konfigurasi
box server stop                     # matikan server

# opsi yang sering dipakai
box server start port=8080          # ganti port
box server start cfengine=lucee@7.0.5   # kunci versi Lucee
box install commandbox-dotenv       # baca konfigurasi dari file .env`,
      explain: [
        'CommandBox membaca <code>.box.json</code> di folder kerja untuk tahu engine CFML yang dipakai.',
        '<code>box server start</code> mengunduh engine bila belum ada, lalu menyalakan server proses di latar belakang.',
        'Seluruh perintah di atas dijalankan di terminal — tidak ada instalasi Tomcat manual yang rumit.',
        'File di folder proyek langsung disajikan; <code>index.cfm</code> menjadi halaman awal.'
      ]
    },
    {
      type: 'warn',
      title: 'Lucee 7 berbeda dengan Lucee 6',
      text: 'Lucee 6.2 masih berbasis <b>Java EE (javax)</b>. Lucee 7 (rilis stabil 7.0.x, Juni 2026) hanya berjalan dalam <b>Single Mode</b>, beralih ke <b>Jakarta EE</b>, dan menuntut <b>Tomcat 10.1+</b>. Di Lucee 7, <b>Java 8 tidak lagi didukung</b> dan <b>Java 21 disarankan</b>. Ekstensi lama bertipe javax tidak kompatibel — pastikan ekstensi kamu sudah versi Jakarta sebelum naik versi.'
    },
    {
      type: 'text',
      html: '<h3>Struktur File .cfm dan .cfc</h3><p>Lucee mengenal tiga ekstensi utama: <code>.cfm</code> untuk halaman web (memiliki URL), <code>.cfc</code> untuk komponen (berisi fungsi, tidak diakses langsung seperti halaman), dan <code>.cfml</code> untuk berkas sumber biasa. Di akar proyek selalu ada <code>Application.cfc</code>, berkas konfigurasi yang dibaca Lucee sekali saat aplikasi dimuat.</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder proyek toko online',
      lang: 'text',
      output: false,
      code: `toko-online/
├── Application.cfc     # konfigurasi: nama app, session, datasource
├── index.cfm           # halaman utama
├── produk/
│   ├── daftar.cfm      # daftar produk
│   └── detail.cfm      # detail satu produk
├── komponen/
│   └── Keranjang.cfc   # komponen berisi fungsi keranjang belanja
└── assets/
    └── style.css`,
      explain: [
        'Halaman .cfm punya URL sendiri, contoh <code>/produk/daftar.cfm</code>.',
        'Komponen .cfc dipanggil lewat <code>createObject("component", "komponen.Keranjang")</code> atau tag <code>&lt;cfobject&gt;</code>.',
        'Berkas CSS/Gambar disajikan apa adanya oleh server tanpa diproses Lucee.'
      ]
    },
    {
      type: 'example',
      title: 'Isi minimal Application.cfc',
      lang: 'cfml',
      output: false,
      code: `component {

    this.name = "TokoOnline";
    this.sessionManagement = true;
    this.sessionTimeout = createTimeSpan(0, 0, 30, 0);

    // Koneksi database lewat JDBC (gaya Lucee)
    this.datasources["appDB"] = {
        class: "com.mysql.cj.jdbc.Driver",
        connectionString: "jdbc:mysql://localhost:3306/toko?characterEncoding=UTF-8",
        username: "root",
        password: "rahasia",
        connectionLimit: 20
    };

    // Dijalankan sekali saat aplikasi pertama dimuat
    function onApplicationStart() {
        application.tglRilis = now();
        return true;
    }
}`,
      explain: [
        '<code>this.name</code> harus unik — namanya dipakai sebagai prefix scope <code>application</code> dan identitas sesi.',
        '<code>datasources</code> didefinisikan di sini, bukan di panel admin, sehingga konfigurasi ikut ter-version control.',
        '<code>sessionTimeout</code> memakai <code>createTimeSpan(hari, jam, menit, detik)</code>; contoh di atas: 30 menit.',
        'Fungsi event seperti <code>onApplicationStart</code> mengembalikan <code>true</code> agar aplikasi dinyatakan siap.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyiapkan Editor</h3><p>CFML bukan bahasa yang di-support editor bawaan, jadi pasang tambahan agar penyorotan sintaks, penyelesaian tag, dan pemeriksaan error bekerja. Di <b>VS Code</b>, pasang ekstensi bertema CFML (penyorot tag/fungsi) plus penganalisis <b>CFLint</b> untuk menangkap typo sebelum dijalankan. Di <b>Neovim</b>, parser <i>tree-sitter</i> untuk CFML memberi efek serupa. Aktifkan juga format &amp; lint dari terminal bila proyekmu memakai CommandBox.</p>'
    },
    {
      type: 'example',
      title: 'Program pertama: index.cfm',
      lang: 'cfml',
      output: false,
      code: `<cfparam name="url.nama" default="Tamu">

<!DOCTYPE html>
<html lang="id">
<head>
    <title>Hello Lucee</title>
</head>
<body>
    <cfoutput>
        <h1>Halo, #encodeForHTML(url.nama)#!</h1>
        <p>Waktu server: #dateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#</p>
    </cfoutput>
</body>
</html>`,
      explain: [
        '<code>&lt;cfparam&gt;</code> menyiapkan nilai awal: bila <code>?nama=Budi</code> tidak dikirim, dipakai "Tamu".',
        '<code>#expression#</code> di dalam <code>&lt;cfoutput&gt;</code> akan diganti nilainya oleh Lucee sebelum halaman dikirim.',
        '<code>encodeForHTML()</code> meng-escape karakter berbahaya — perlindungan dasar dari XSS.',
        'Simpan sebagai <code>index.cfm</code>, jalankan <code>box server start</code>, lalu buka <code>http://127.0.0.1:8080/</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Satu terminal, satu folder proyek',
      text: 'Selalu jalankan <code>box server start</code> dari folder tempat <code>Application.cfc</code> berada — CommandBox menjadikan folder itu sebagai web root. Untuk konfigurasi yang tidak boleh bocor (kredensial database), pasang <code>box install commandbox-dotenv</code> dan simpan rahasia di berkas <code>.env</code> yang tidak ikut di-commit.'
    },
    {
      type: 'vocab',
      items: [
        ['CFML', 'ColdFusion Markup Language — bahasa server-side berbasis tag seperti &lt;cfset&gt; dan &lt;cfquery&gt;.'],
        ['Lucee', 'Mesin CFML open source (LGPL v2.1) yang berjalan di atas JVM.'],
        ['CommandBox', 'CLI &amp; server dev dari Ortus untuk menjalankan aplikasi CFML secara lokal.'],
        ['.cfm / .cfc', 'Ekstensi halaman web / komponen CFML; .cfml untuk berkas sumber biasa.'],
        ['Bytecode', 'Hasil kompilasi source CFML ke format yang dimengerti JVM.'],
        ['JVM', 'Java Virtual Machine — mesin tempat bytecode Lucee dieksekusi.'],
        ['Application.cfc', 'Berkas konfigurasi aplikasi: nama app, session, datasource, event awal.']
      ]
    }
  ],
  recap: [
    'CFML adalah bahasa server-side berbasis tag; browser hanya menerima HTML hasil render.',
    'Lucee open source (LGPL) dan mengompilasi source .cfm menjadi bytecode Java di atas JVM/Tomcat.',
    'CommandBox memberi perintah ringkas: box server start, list, open, restart, dan stop.',
    '.cfm untuk halaman, .cfc untuk komponen, dan Application.cfc untuk konfigurasi aplikasi.',
    'Lucee 7 pindah ke Jakarta EE + Tomcat 10.1+ dan mewajibkan Java 21 (Java 8 tidak didukung).',
    'Siapkan editor dengan ekstensi CFML dan linter CFLint sebelum menulis kode lebih serius.'
  ]
});
