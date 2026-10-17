/* ============================================================
   Pelajaran Lucee CFML — Bab 6: Koneksi Database & Datasource (L6)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-koneksi-database',
  title: 'Koneksi Database & Datasource',
  chapter: 'Data & Menengah',
  duration: '12 menit',
  intro: [
    '<b>Datasource</b> (sumber data) adalah sekumpulan konfigurasi koneksi ke database yang diberi nama: alamat, driver <b>JDBC</b>, username, password, dan batas koneksi. Query CFML cukup menyebut nama datasource, misalnya <code>appDB</code>, tanpa mengulang detail koneksi di banyak berkas.',
    'Lucee mengenal dua cara membuatnya: mengklik di Lucee Administrator atau mendefinisikannya langsung di <code>Application.cfc</code>. Pelajaran ini memakai cara kedua sebagai utama karena lebih portabel, lalu membahas kredensial dari environment variable CommandBox, multi-datasource, dan <b>connection pool</b>.',
    'Semua contoh memakai proyek toko online dengan database <code>toko</code> di MySQL yang dijalankan lewat CommandBox.'
  ],
  objectives: [
    'Menjelaskan konsep datasource dan peran driver JDBC',
    'Membuat datasource lewat Lucee Web Admin',
    'Mendefinisikan datasource di Application.cfc dengan this.datasources',
    'Membaca kredensial dari environment variable CommandBox',
    'Membedakan Server Admin, Web Admin, dan mengatur defaultDatasource',
    'Menjelaskan dampak connection limit terhadap performa aplikasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Datasource?</h3><p><b>Datasource</b> adalah konfigurasi koneksi database yang diberi nama. Di dalamnya tersimpan alamat (host, port, nama database), driver <b>JDBC</b> (Java Database Connectivity, pustaka Java penghubung ke database), username, password, dan opsi koneksi seperti batas koneksi. Karena konfigurasi terkumpul di satu tempat, mengganti database dari localhost ke server produksi cukup mengubah satu berkas — bukan puluhan query.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 250" width="760" role="img" aria-label="Alur konfigurasi datasource dari admin atau Application.cfc ke Lucee, lalu connection pool dan database">
        <defs><marker id="mk-l06-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="20" y="40" width="180" height="64" rx="8" class="u-box"/>
        <text x="110" y="66" class="u-title" text-anchor="middle">Web Admin</text>
        <text x="110" y="88" class="u-lbl" text-anchor="middle">/lucee/admin/web.cfm</text>
        <rect x="20" y="150" width="180" height="64" rx="8" class="u-box"/>
        <text x="110" y="176" class="u-title" text-anchor="middle">Application.cfc</text>
        <text x="110" y="198" class="u-lbl" text-anchor="middle">this.datasources</text>
        <line x1="200" y1="72" x2="262" y2="110" class="u-line" marker-end="url(#mk-l06-1)"/>
        <line x1="200" y1="182" x2="262" y2="144" class="u-line" marker-end="url(#mk-l06-1)"/>
        <rect x="266" y="95" width="150" height="64" rx="8" class="u-hd"/>
        <text x="341" y="120" class="u-title" text-anchor="middle">Lucee</text>
        <text x="341" y="142" class="u-lbl" text-anchor="middle">daftar datasource</text>
        <line x1="416" y1="127" x2="470" y2="127" class="u-line" marker-end="url(#mk-l06-1)"/>
        <text x="443" y="115" class="u-lbl" text-anchor="middle">pinjam</text>
        <rect x="474" y="95" width="150" height="64" rx="8" class="u-box"/>
        <text x="549" y="120" class="u-title" text-anchor="middle">Connection Pool</text>
        <text x="549" y="142" class="u-lbl" text-anchor="middle">koneksi JDBC siap pakai</text>
        <line x1="624" y1="127" x2="658" y2="127" class="u-line" marker-end="url(#mk-l06-1)"/>
        <rect x="662" y="95" width="78" height="64" rx="8" class="u-hd"/>
        <text x="701" y="122" class="u-title" text-anchor="middle">MySQL</text>
        <text x="701" y="142" class="u-lbl" text-anchor="middle">toko</text>
        <text x="380" y="228" class="u-lbl" text-anchor="middle">Satu konfigurasi, banyak query — koneksi tidak dibuka dan ditutup tiap halaman</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Sumber konfigurasi (admin atau kode) mengalir ke Lucee, lalu lewat pool ke database</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Dua Cara Membuat Datasource: Admin vs Kode</h3><p>Web Admin bisa dibuka lewat <code>/lucee/admin/web.cfm</code> dan Server Admin lewat <code>/lucee/admin/server.cfm</code>. Web Admin mengatur satu <b>web context</b> (satu situs), sedangkan Server Admin berlaku untuk seluruh proses JVM; setelan web menimpa setelan server. Instalasi Lucee 6 yang baru umumnya memakai <b>Single Mode</b> (hanya satu admin), dan Lucee 7 sepenuhnya Single Mode — perbedaan Server vs Web Admin hanya muncul di mode lama (Multi Mode, lazim pada Lucee 5).</p><p>Keduanya pada akhirnya menulis berkas konfigurasi yang sama, tetapi hasil klik-klik tidak ikut terbawa saat proyek di-clone developer lain atau dipindah ke server produksi. Karena itu definisikan datasource di <code>Application.cfc</code>: pindah mesin cukup dengan <code>box server start</code>.</p>'
    },
    {
      type: 'tip',
      title: 'Admin untuk bereksperimen, kode untuk produksi',
      text: 'Lucee Web Admin berguna untuk menguji driver dan koneksi dengan cepat. Setelah kredensial diketahui, salin konfigurasinya ke <code>this.datasources</code> di <code>Application.cfc</code> lalu masukkan ke git. Dengan begitu seluruh tim memakai konfigurasi yang sama dan bisa direproduksi.'
    },
    {
      type: 'example',
      title: 'Dua jalur membuat datasource',
      lang: 'text',
      output: false,
      code: `Cara 1 — Web Admin (klik-klik)
  buka /lucee/admin/web.cfm -> masuk -> menu Datasource -> Add
  isi nama, class driver, connectionString, username, password
  uji koneksi lalu simpan
  Cocok: uji cepat, server satu situs

Cara 2 — Application.cfc (kode)
  this.datasources["appDB"] = { ... }
  Cocok: proyek git, banyak environment, deploy otomatis`,
      explain: [
        'Kedua cara menghasilkan datasource bernama yang dipakai dengan <code>datasource="appDB"</code>.',
        'Hasil klik admin tersimpan di konfigurasi server, tidak terlihat saat orang lain meng-clone repositori.',
        'Kode di Application.cfc ikut berpindah bersama proyek dan bisa berbeda per environment lewat variabel.'
      ]
    },
    {
      type: 'example',
      title: 'Mendefinisikan datasource di Application.cfc',
      lang: 'cfml',
      output: false,
      code: `component {
    this.name = "TokoOnline";

    this.datasources["appDB"] = {
        class: "com.mysql.cj.jdbc.Driver",
        bundleName: "com.mysql.cj",
        bundleVersion: "8.4.0",
        connectionString: "jdbc:mysql://localhost:3306/toko?characterEncoding=UTF-8",
        username: "toko_app",
        password: "rahasia",
        // optional
        connectionLimit: 20,
        validate: true
    };
}`,
      explain: [
        '<code>class</code> adalah nama class driver JDBC, sedangkan <code>bundleName</code> dan <code>bundleVersion</code> menunjuk berkas JAR (bundle OSGi) penyedia driver — wajib bila driver dipasang langsung dari Maven, tidak diisi bila driver datang dari ekstensi Lucee.',
        '<code>connectionString</code> memakai pola <code>jdbc:mysql://host:port/namaDatabase?parameter</code>.',
        '<code>connectionLimit: 20</code> membatasi 20 koneksi serentak; nilai <code>-1</code> (bawaan) berarti tanpa batas.',
        '<code>validate: true</code> membuat Lucee menguji koneksi dari pool sebelum dipakai sehingga kegagalan terdeteksi lebih awal.'
      ]
    },
    {
      type: 'warn',
      title: 'Password yang di-hardcode ikut bocor lewat git',
      text: 'Password yang ditulis langsung di berkas yang di-commit akan terbaca siapa pun yang punya akses repositori, dan tetap tercatat di riwayat git meski sudah dihapus. Simpan kredensial di <code>.env</code> yang masuk <code>.gitignore</code>, atau ambil dari environment variable. Export dari admin juga bisa berupa nilai <code>encrypted:...</code> agar tidak telanjang.'
    },
    {
      type: 'text',
      html: '<h3>Kredensial dari Environment Variable</h3><p><b>CommandBox</b> menyediakan modul <code>commandbox-dotenv</code> yang membaca berkas <code>.env</code> di root proyek lalu memasukkannya sebagai system property milik server. Dalam CFML, nilai itu terbaca lewat <code>server.system.properties</code> (dan environment variable sistem lewat <code>server.system.environment</code>). Kuncinya peka huruf besar-kecil, sehingga <code>DB_USER</code> berbeda dengan <code>db_user</code>.</p>'
    },
    {
      type: 'example',
      title: 'Berkas .env di root proyek',
      lang: 'ini',
      output: false,
      code: `# file .env di root proyek — masukkan ke .gitignore
DB_HOST=localhost
DB_PORT=3306
DB_NAME=toko
DB_USER=toko_app
DB_PASS=rahasia123`,
      explain: [
        'Setiap baris berupa <code>KUNCI=nilai</code> tanpa spasi dan tanpa tanda kutip.',
        'Komentar diawali tanda <code>#</code>.',
        'Berkas ini berbeda tiap mesin: developer lokal, staging, dan produksi memakai isi berbeda tanpa mengubah kode.'
      ]
    },
    {
      type: 'example',
      title: 'Memasang modul dan menjalankan server',
      lang: 'bash',
      output: false,
      code: `# 1. pasang modul sekali di mesin CommandBox
box install commandbox-dotenv

# 2. jalankan server seperti biasa dari root proyek (tempat .env berada)
box server start port=8080

# 3. pastikan server hidup
box server list`,
      explain: [
        'Modul ini mencari <code>.env</code> pada webroot server yang akan dijalankan.',
        'Nilai dari <code>.env</code> menjadi system property sehingga terbaca dari CFML.',
        'Untuk produksi tanpa CommandBox, isi variabel yang sama lewat environment variable sistem/container.'
      ]
    },
    {
      type: 'example',
      title: 'Application.cfc yang membaca environment',
      lang: 'cfml',
      output: false,
      code: `component {
    this.name = "TokoOnline";

    // 1. baca konfigurasi dari environment (file .env)
    dbHost = server.system.properties["DB_HOST"] ?: "localhost";
    dbPort = server.system.properties["DB_PORT"] ?: "3306";
    dbName = server.system.properties["DB_NAME"] ?: "toko";
    dbUser = server.system.properties["DB_USER"] ?: "root";
    dbPass = server.system.properties["DB_PASS"] ?: "";

    // 2. bangun datasource dari konfigurasi itu
    this.datasources["appDB"] = {
        class: "com.mysql.cj.jdbc.Driver",
        connectionString: "jdbc:mysql://#dbHost#:#dbPort#/#dbName#?characterEncoding=UTF-8",
        username: dbUser,
        password: dbPass,
        connectionLimit: 20,
        validate: true
    };
}`,
      explain: [
        '<code>server.system.properties</code> adalah struct berisi isi berkas <code>.env</code>.',
        'Operator <code>?:</code> menyediakan nilai cadangan sehingga aplikasi tetap jalan walau <code>.env</code> belum dibuat.',
        'Satu-satunya berkas yang berubah antar environment adalah <code>.env</code>; <code>Application.cfc</code> tetap sama.',
        '<code>validate: true</code> menangkap kesalahan koneksi lebih awal daripada query pertama yang gagal.'
      ]
    },
    {
      type: 'tip',
      title: 'Berkas .env jangan sampai masuk git',
      text: 'Tambahkan baris <code>.env</code> ke <code>.gitignore</code> sejak menit pertama proyek. Sediakan <code>.env.example</code> berisi kunci-kunci kosong sebagai dokumentasi agar developer baru tahu variabel apa yang harus diisi.'
    },
    {
      type: 'text',
      html: '<h3>Multi-Datasource dan Datasource Bawaan</h3><p>Aplikasi boleh memakai lebih dari satu database sekaligus, misalnya <code>appDB</code> untuk transaksi dan <code>logDB</code> untuk log aplikasi. Setiap query yang tidak menyebut datasource akan memakai <b>defaultDatasource</b>; Lucee juga mengenali <code>this.datasource</code> sebagai singkatan dari setelan itu. Query yang menuju database lain menyebutnya sendiri lewat atribut <code>datasource</code> atau opsi <code>datasource</code> pada <code>queryExecute()</code>.</p>'
    },
    {
      type: 'example',
      title: 'Dua datasource dengan defaultDatasource',
      lang: 'cfml',
      output: false,
      code: `component {
    this.datasources["appDB"] = { /* seperti contoh sebelumnya */ };
    this.datasources["logDB"] = { /* ... */ };

    // query tanpa atribut datasource memakai appDB
    this.defaultDatasource = "appDB";

    function simpanLog(required string pesan) {
        queryExecute(
            "INSERT INTO log (pesan, waktu) VALUES (:pesan, :waktu)",
            {
                pesan: { value: arguments.pesan, cfsqltype: "cf_sql_varchar", maxlength: 200 },
                waktu: { value: now(), cfsqltype: "cf_sql_timestamp" }
            },
            { datasource: "logDB" }
        );
    }
}`,
      explain: [
        'Nama datasource dipakai sebagai kunci struct <code>this.datasources</code>.',
        '<code>this.defaultDatasource</code> menentukan datasource bawaan untuk query yang tidak menyebut apa pun.',
        'Opsi ketiga <code>queryExecute()</code> menerima atribut <code>&lt;cfquery&gt;</code>, termasuk <code>datasource</code>.',
        'Konfigurasi di Application.cfc hanya terlihat oleh aplikasi itu — bukan oleh situs lain di server yang sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Connection Pool dan Dampaknya</h3><p>Membuka koneksi database mahal: handshake TCP, autentikasi, lalu penyiapan sesi. Karena itu Lucee tidak membuka-menutup koneksi tiap query, melainkan menyimpan kumpulan koneksi yang siap dipakai — disebut <b>connection pool</b>. Query meminjam koneksi dari pool, memakainya, lalu mengembalikannya. Dampaknya langsung terasa: halaman yang ratusan query-nya tetap cepat karena biaya koneksi hanya dibayar sekali.</p>'
    },
    {
      type: 'example',
      title: 'Analogi connection pool',
      lang: 'text',
      output: false,
      code: `Tanpa pool : tiap query buka-tutup koneksi (handshake + login) -> lambat
Dengan pool: ada 20 koneksi siap (connectionLimit)
  query meminjam koneksi -> selesai -> dikembalikan ke pool
  koneksi menganggur dibuang setelah liveTimeout (menit)`,
      explain: [
        '<code>connectionLimit</code> = jumlah maksimal koneksi yang boleh dipegang datasource.',
        'Koneksi yang tidak dipakai tetap hangat di pool sehingga query berikutnya langsung jalan.',
        '<code>liveTimeout</code> me-refresh koneksi lama yang putus diam-diam oleh firewall atau load balancer.'
      ]
    },
    {
      type: 'warn',
      title: 'Connection limit terlalu kecil bikin antre',
      text: 'Bila permintaan ramai melebihi <code>connectionLimit</code>, query berikutnya menunggu koneksi kosong sampai <code>connectionTimeout</code> (menit) lalu gagal. Sebaliknya, limit raksasa membuat database menolak koneksi baru (<i>too many connections</i>). Aturlah berdasarkan beban nyata — permintaan serentak dikalikan jumlah proses aplikasi — bukan sekadar angka besar.'
    },
    {
      type: 'vocab',
      items: [
        ['Datasource', 'Konfigurasi koneksi database yang diberi nama; dipakai query lewat atribut datasource.'],
        ['JDBC', 'Java Database Connectivity — antarmuka Java standar untuk mengakses database.'],
        ['Driver JDBC', 'Berkas JAR berisi implementasi JDBC untuk database tertentu (mis. com.mysql.cj.jdbc.Driver).'],
        ['OSGi bundle', 'Paket modul Java yang dikelola Lucee; disebut lewat bundleName dan bundleVersion.'],
        ['Connection pool', 'Kumpulan koneksi terbuka yang dipakai ulang, bukan dibuka-tutup tiap query.'],
        ['connectionLimit', 'Batas jumlah koneksi satu datasource; -1 berarti tanpa batas.'],
        ['Environment variable', 'Variabel dari sistem atau berkas .env yang dibaca aplikasi tanpa ditulis di kode.']
      ]
    }
  ],
  recap: [
    'Datasource adalah konfigurasi koneksi bernama; query cukup menyebut namanya.',
    'this.datasources di Application.cfc (class, connectionString, username, password, connectionLimit, validate) lebih portabel daripada klik admin.',
    'Driver JDBC dirujuk lewat class serta bundleName dan bundleVersion bila diambil langsung dari Maven.',
    'Kredensial dibaca dari .env lewat server.system.properties, bukan di-hardcode di kode.',
    'this.defaultDatasource menentukan datasource bawaan; query lain menyebut datasource sendiri.',
    'Connection pool menghemat biaya koneksi; atur connectionLimit sesuai beban nyata.'
  ]
});
