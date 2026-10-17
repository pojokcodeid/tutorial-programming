/* ============================================================
   Pelajaran Lucee CFML — Bab 12: Lifecycle Application.cfc (L12)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-lifecycle-appcfc',
  title: 'Konfigurasi & Lifecycle Application.cfc',
  chapter: 'Data & Menengah',
  duration: '12 menit',
  intro: [
    'Setiap aplikasi Lucee punya satu "otak" konfigurasi bernama <b>Application.cfc</b>. File ini menyimpan pengaturan aplikasi (nama, timeout, datasource, mapping) sekaligus daftar fungsi yang dipanggil engine pada momen-momen penting: saat aplikasi baru hidup, saat sesi pengunjung dimulai, sebelum dan sesesudah tiap request, sampai aplikasi dimatikan.',
    'Momen-momen itu disebut <b>lifecycle</b> (siklus hidup). Memahami urutannya membuat kontrol login, cache global, penanganan error, dan cleanup jadi terpusat — bukan diulang di puluhan halaman.',
    'Pelajaran ini membahas property penting Application.cfc, urutan lifecycle lengkap, session management beserta cookie-nya, serta performa dan cara me-restart aplikasi.'
  ],
  objectives: [
    'Mengonfigurasi property penting Application.cfc: name, timeout, datasources, mappings',
    'Menjelaskan urutan lifecycle dari onApplicationStart sampai onApplicationEnd',
    'Menyimpan data global yang aman di application scope',
    'Mengatur session management, cookie sesi, dan scriptProtect',
    'Menangani error terpusat dengan onError dan onMissingTemplate'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa Itu Application.cfc?</h3><p><b>Application.cfc</b> adalah komponen khusus yang diletakkan di web root aplikasi. Isinya dua kelompok: property berawalan <code>this.</code> untuk konfigurasi, dan fungsi-fungsi lifecycle yang dipanggil otomatis oleh Lucee. Berbeda dengan Application.cfm (lama), Application.cfc tidak menghasilkan output — ia murni konfigurasi dan logika.</p>'
    },
    {
      type: 'example',
      title: 'Application.cfc lengkap untuk toko online',
      lang: 'cfml',
      output: false,
      code: `component {
  // identitas & manajemen sesi
  this.name              = "TokoKopiIndonesia";
  this.sessionManagement = true;
  this.sessionTimeout     = createTimeSpan(0, 0, 30, 0);    // 30 menit tanpa aktivitas
  this.applicationTimeout = createTimeSpan(1, 0, 0, 0);     // aplikasi hidup 1 hari

  // batas waktu request & cookie
  this.requestTimeout     = 30;
  this.setClientCookies   = true;
  this.clientManagement   = false;

  // proteksi input yang tersalin otomatis ke variabel lain
  this.scriptProtect = "form,url";

  // mapping path virtual
  this.mappings = { "/modul": expandPath("/customtags/modul") };

  // datasource: koneksi database dipakai semua halaman
  this.datasources["appDB"] = {
    class: "com.mysql.cj.jdbc.Driver",
    connectionString: "jdbc:mysql://localhost:3306/toko?characterEncoding=UTF-8",
    username: "root",
    password: "rahasia",
    connectionLimit: 20
  };

  // this.ormEnabled = true;  // nyalakan bila memakai ORM bawaan (Hibernate)
}`,
      explain: [
        '<code>this.name</code> harus unik per aplikasi — inilah kunci yang dipakai engine mengenali application scope.',
        '<code>sessionTimeout</code> dan <code>applicationTimeout</code> memakai createTimeSpan(hari, jam, menit, detik).',
        '<code>this.datasources</code> mendefinisikan koneksi database; cukup tulis <code>datasource: "appDB"</code> di queryExecute.',
        '<code>scriptProtect</code> menyaring tag HTML dari input form/URL yang otomatis tersalin ke variabel lain.',
        'Satu berkas ini menggantikan seluruh konfigurasi admin untuk aplikasi kamu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Urutan Lifecycle: Dari Aplikasi Sampai Request</h3><p>Lucee memanggil fungsi lifecycle secara berurutan. <b>onApplicationStart</b> berjalan sekali saat application scope dibuat. <b>onSessionStart</b> berjalan tiap ada pengunjung baru. <b>onRequestStart</b> dan <b>onRequestEnd</b> membungkus tiap request — termasuk request yang berakhir error atau 404. <b>onSessionEnd</b> dan <b>onApplicationEnd</b> dipanggil tepat sebelum scope-nya dihapus, saat waktunya habis atau aplikasi di-reinit.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 260" width="760" role="img" aria-label="Urutan handler lifecycle Application.cfc">
        <defs><marker id="mk-l12-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="30" y="50" width="155" height="64" rx="8" class="u-hd"/>
        <text x="107" y="76" class="u-title" text-anchor="middle">onApplicationStart</text>
        <text x="107" y="98" class="u-lbl" text-anchor="middle">sekali — aplikasi dibuat</text>
        <line x1="188" y1="82" x2="212" y2="82" class="u-line" marker-end="url(#mk-l12-1)"/>
        <rect x="215" y="50" width="155" height="64" rx="8" class="u-box"/>
        <text x="292" y="76" class="u-title" text-anchor="middle">onSessionStart</text>
        <text x="292" y="98" class="u-lbl" text-anchor="middle">tiap sesi baru</text>
        <line x1="373" y1="82" x2="397" y2="82" class="u-line" marker-end="url(#mk-l12-1)"/>
        <rect x="400" y="50" width="155" height="64" rx="8" class="u-box"/>
        <text x="477" y="76" class="u-title" text-anchor="middle">onRequestStart</text>
        <text x="477" y="98" class="u-lbl" text-anchor="middle">tiap request masuk</text>
        <line x1="558" y1="82" x2="582" y2="82" class="u-line" marker-end="url(#mk-l12-1)"/>
        <rect x="585" y="50" width="155" height="64" rx="8" class="u-box"/>
        <text x="662" y="76" class="u-title" text-anchor="middle">Halaman .cfm</text>
        <text x="662" y="98" class="u-lbl" text-anchor="middle">diproses</text>
        <line x1="662" y1="117" x2="662" y2="172" class="u-dash" marker-end="url(#mk-l12-1)"/>
        <rect x="585" y="180" width="155" height="56" rx="8" class="u-box"/>
        <text x="662" y="203" class="u-title" text-anchor="middle">onRequestEnd</text>
        <text x="662" y="222" class="u-lbl" text-anchor="middle">request selesai</text>
        <line x1="582" y1="208" x2="560" y2="208" class="u-line" marker-end="url(#mk-l12-1)"/>
        <rect x="400" y="180" width="155" height="56" rx="8" class="u-box"/>
        <text x="477" y="203" class="u-title" text-anchor="middle">onSessionEnd</text>
        <text x="477" y="222" class="u-lbl" text-anchor="middle">sesi kedaluwarsa</text>
        <line x1="397" y1="208" x2="375" y2="208" class="u-line" marker-end="url(#mk-l12-1)"/>
        <rect x="215" y="180" width="155" height="56" rx="8" class="u-box"/>
        <text x="292" y="203" class="u-title" text-anchor="middle">onApplicationEnd</text>
        <text x="292" y="222" class="u-lbl" text-anchor="middle">reinit / timeout</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — Handler dipanggil berurutan; tiga di kiri bawah hanya saat sesi/app berakhir</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Handler lifecycle yang paling sering dipakai',
      lang: 'cfml',
      output: false,
      code: `component {
  // this.* property seperti di atas ...

  function onApplicationStart() {
    application.startedAt = now();
    application.discount  = { "VIP": 10, "RETAIL": 0 };
    return true;   // false = batal start, request dihentikan
  }

  function onSessionStart() {
    session.createdAt = now();
    session.cart      = [];
  }

  function onRequestStart(required string targetPage) {
    // jaga halaman admin: belum login? lempar ke halaman login
    if ( listFindNoCase("/admin/", arguments.targetPage)
         && !structKeyExists(session, "user") ) {
      location(url="/login.cfm", addToken="false");
    }
    return true;
  }

  function onRequestEnd() {
    // mis. catat durasi request / bersihkan resource request-scoped
  }
}`,
      explain: [
        'onApplicationStart mengisi application scope dengan data yang dipakai semua request.',
        'onRequestStart menerima path halaman yang akan dieksekusi — tempat ideal untuk penjagaan akses terpusat.',
        'Mengembalikan false di onRequestStart membatalkan request; gunakan location() untuk redirect.',
        'onRequestEnd tetap dipanggil walau halaman error — pasang pekerjaan bersih-bersih di sini.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>application scope</b> dibuat saat onApplicationStart selesai dan hidup selama tidak ada aktivitas melewati applicationTimeout — atau sampai aplikasi di-reinit. <b>session scope</b> dibuat saat onSessionStart dan dihapus ketika tidak ada aktivitas selama sessionTimeout. Tepat sebelum keduanya dihapus, engine memanggil onSessionEnd dan onApplicationEnd — kesempatan terakhir menutup koneksi, mengosongkan cache, atau menulis log.</p>'
    },
    {
      type: 'example',
      title: 'Menyimpan data login di application scope',
      lang: 'cfml',
      output: false,
      code: `<!-- prologin.cfm — setelah autentikasi berhasil -->
<cflock scope="application" type="exclusive" timeout="5">
  <cfset application.loginCount = val(application.loginCount) + 1>
</cflock>
<cfset session.user = { id: 17, nama: "Siti Aminah", role: "admin" }>

<!-- dashboard.cfm — data global yang sama untuk semua pengunjung -->
<cfoutput>
Selamat datang #session.user.nama#. Pengguna login saat ini: #application.loginCount#
</cfoutput>

<!-- logout.cfm -->
<cfset structDelete(session, "user")>
<cflock scope="application" type="exclusive" timeout="5">
  <cfset application.loginCount = val(application.loginCount) - 1>
</cflock>`,
      explain: [
        'Data per pengunjung (nama, role, keranjang) hidup di <b>session</b> — terpisah tiap orang.',
        'Data global (penghitung, cache kategori, konfigurasi) hidup di <b>application</b> — dibagi semua pengunjung.',
        'Perubahan counter di application scope dibungkus <b>lock</b> karena Lucee memproses banyak request secara bersamaan.',
        'Logout cukup menghapus kunci di session scope; jangan menyimpan password apa pun di sana.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Sesi, Cookie, dan Keamanan</h3><p>Saat sessionManagement aktif, Lucee membuat cookie sesi berisi <b>CFID</b> dan <b>CFSESSION</b> di browser pengunjung — dua nilai acak yang menunjuk ke sesi di server. Ini berbeda dengan mode <b>J2EE session</b> yang menyerahkan sesi ke servlet container (Tomcat) dengan cookie JSESSIONID — berguna bila aplikasi berjalan di belakang clustering, karena sesi ikut dikelola container.</p><p>Beberapa kontrol penting: <code>setClientCookies = false</code> mencegah Lucee mengirim cookie sesi (langkah awal memakai sesi J2EE); <code>clientManagement</code> mengaktifkan client scope lama yang menyimpan data di cookie/klien — sebaiknya tetap mati; dan <code>scriptProtect</code> menyaring tag berbahaya dari input form/URL yang tersalin otomatis antar variabel, sebagai lapisan anti-XSS.</p><p>Aturan emas: <b>cookie hanya untuk identitas sesi</b>. Jangan pernah menaruh data sensitif (nama lengkap, nomor kartu, token) di cookie — nilainya terbaca mudah oleh pemilik browser dan bisa dipalsukan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Error Terpusat: onError &amp; onMissingTemplate</h3><p>Tanpa handler, error CFML tampil sebagai halaman teknis yang membocorkan detail. <b>onError</b> menangkap semua exception di aplikasi dan menggantinya dengan halaman ramah plus log server. <b>onMissingTemplate</b> menangkap request ke file yang tidak ada, sehingga kamu bisa membuat 404 yang seragam.</p>'
    },
    {
      type: 'example',
      title: 'Handler error terpusat',
      lang: 'cfml',
      output: false,
      code: `component {
  function onError(required any exception, required string eventName) {
    writeLog(
      text  : exception.message & " | " & exception.stackTrace,
      type  : "error",
      file  : "aplikasi"
    );
    include "/includes/errorPage.cfm";   // halaman ramah untuk pengguna
  }

  function onMissingTemplate(required string targetPage) {
    writeLog(text: "404: " & arguments.targetPage, type: "warning", file: "aplikasi");
    include "/includes/404.cfm";
    return true;
  }
}`,
      explain: [
        'onError menerima objek exception berisi pesan dan stackTrace — log ke file, tampilkan halaman generik ke pengguna.',
        'Detail error hanya untuk log server; pengguna cukup pesan "terjadi kesalahan, silakan coba lagi".',
        'onMissingTemplate menangkap URL menuju file yang tidak ada sebelum error 404 bawaan muncul.',
        'Keduanya membuat pengalaman error konsisten di seluruh aplikasi.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan kerja berat di onRequestStart',
      text: 'onRequestStart berjalan di <b>setiap</b> request — termasuk request gambar, CSS, dan halaman 404. Query database berat, sinkronisasi API, atau membaca banyak file di sini melambatkan seluruh aplikasi. Simpan pekerjaan berat di onApplicationStart (sekali) atau lakukan on-demand di halaman yang benar-benar membutuhkan.'
    },
    {
      type: 'text',
      html: '<h3>Performa &amp; Restart Aplikasi</h3><p>Karena onApplicationStart hanya dipanggil saat application scope dibuat, kode di dalamnya (mis. cache kategori, konfigurasi) tidak dihitung ulang tiap request. Sebaliknya, kesalahan di onApplicationStart baru ketahuan saat aplikasi diinisialisasi ulang — jadi penting tahu cara me-restart.</p>'
    },
    {
      type: 'example',
      title: 'Restart dari terminal dengan CommandBox',
      lang: 'bash',
      output: false,
      code: `box server list              # lihat server yang berjalan
box server restart           # hentikan lalu jalankan lagi
box server stop              # hentikan server
box server start port=8080   # jalankan dengan port tertentu`,
      explain: [
        'box server restart mematikan dan menyalakan kembali server beserta aplikasinya.',
        'Ini berguna setelah mengubah konfigurasi besar, mis. datasource atau ekstensi.',
        'Untuk perubahan kode biasa, Lucee memuat ulang file .cfm/.cfc otomatis — tanpa restart.'
      ]
    },
    {
      type: 'tip',
      title: 'Restart aplikasi tanpa menyentuh server',
      text: 'Cara tercepat memicu inisialisasi ulang: ubah nilai <code>this.name</code> sedikit lalu kembalikan, atau cukup simpan ulang Application.cfc — Lucee mendeteksinya dan menjalankan onApplicationStart lagi pada request berikutnya. Praktis saat kamu mengubah kode cache atau konfigurasi di dalam onApplicationStart.'
    },
    {
      type: 'vocab',
      items: [
        ['Application.cfc', 'Komponen konfigurasi & lifecycle di web root; berisi property this.* dan handler event.'],
        ['Lifecycle', 'Urutan event yang dipanggil engine: start aplikasi, sesi, request, sampai penutupan.'],
        ['application scope', 'Penyimpanan global satu aplikasi; dibuat di onApplicationStart, dihapus saat timeout/reinit.'],
        ['session scope', 'Penyimpanan per pengunjung; dibuat di onSessionStart, dihapus saat sessionTimeout habis.'],
        ['sessionTimeout', 'Durasi tanpa aktivitas sebelum sesi dihapus (default 20 menit di Lucee).'],
        ['CFID & CFSESSION', 'Sepasang cookie acak penanda sesi buatan Lucee di browser pengunjung.'],
        ['scriptProtect', 'Pengatur yang menyaring tag HTML dari input form/URL yang tersalin otomatis antar variabel.']
      ]
    }
  ],
  recap: [
    'Application.cfc menyimpan konfigurasi (this.name, timeout, datasources, mappings) dan handler lifecycle.',
    'Urutan: onApplicationStart → onSessionStart → onRequestStart → halaman → onRequestEnd → onSessionEnd → onApplicationEnd.',
    'application scope hidup selama aplikasi; session scope hidup selama sessionTimeout tanpa aktivitas — data per pengunjung di session, data global di application, dan perubahan data global wajib dikunci.',
    'Cookie sesi CFID/CFSESSION dibuat Lucee; jangan pernah menyimpan data sensitif di cookie.',
    'onError dan onMissingTemplate mengubah error teknis jadi halaman ramah plus log.',
    'Jangan kerja berat di onRequestStart; picu inisialisasi ulang dengan mengubah this.name atau box server restart.'
  ]
});
