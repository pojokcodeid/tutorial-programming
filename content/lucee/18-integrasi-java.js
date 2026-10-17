/* ============================================================
   Pelajaran Lucee CFML — Bab 18: Integrasi Java & Sistem Eksternal (L18)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-integrasi-java',
  title: 'Integrasi Java & Sistem Eksternal',
  chapter: 'Operasi & Profesional',
  duration: '14 menit',
  intro: [
    'Kartu as Lucee: mesin CFML ini berjalan di atas <b>JVM</b> (Java Virtual Machine), sehingga seluruh ekosistem Java — pustaka PDF, Excel, kriptografi, pemrosesan gambar — bisa dipanggil langsung dari kode CFML tanpa membangun jembatan khusus.',
    'Pelajaran ini membahas empat sekaligus: memanggil objek dan pustaka Java, menjalankan pekerjaan berat secara <b>asinkron</b> (thread, penjadwalan tugas, event gateway), mengelola file dan dokumen (PDF/Excel/upload), serta memanggil API luar lewat <code>cfhttp</code> — semuanya dengan catatan keamanan yang harus kamu baca sampai akhir.'
  ],
  objectives: [
    'Memanggil class Java dan memuat pustaka JAR dari CFML',
    'Mengonversi nilai CFML ke Java dengan javaCast',
    'Menjalankan pekerjaan asinkron dengan cfthread dan menunggunya dengan action join',
    'Menjadwalkan tugas berkala dengan cfschedule',
    'Menghasilkan PDF/Excel dan mengunggah file dengan aman',
    'Memanggil API luar dengan cfhttp dan memverifikasi hasilnya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa CFML Bisa Memanggil Java</h3><p>Lucee ditulis sebagian besar dalam Java dan berjalan di JVM yang sama dengan kode CFML-mu. Itu sebabnya fungsi <code>createObject( "java", "nama.class.Lengkap" )</code> bisa mengembalikan objek Java apa pun yang ada di classpath, lengkap dengan method dan propertinya. Contoh paling sederhana memakai <code>java.util.ArrayList</code> — daftar Java yang punya kemampuan (misalnya sorting kompleks) yang tidak dimiliki array CFML biasa.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 280" width="760" role="img" aria-label="Lucee di atas JVM: CFML memanggil Java, thread, scheduler, dan sistem eksternal">
        <defs><marker id="mk-l18-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="200" y="20" width="360" height="52" rx="8" class="u-box"/>
        <text x="380" y="42" class="u-title" text-anchor="middle">Kode CFML aplikasi</text>
        <text x="380" y="62" class="u-lbl" text-anchor="middle">createObject("java") · javaCast() · cfthread</text>
        <line x1="380" y1="72" x2="380" y2="104" class="u-line" marker-end="url(#mk-l18-1)"/>
        <rect x="200" y="108" width="360" height="52" rx="8" class="u-hd"/>
        <text x="380" y="130" class="u-title" text-anchor="middle">Lucee Runtime (mesin CFML)</text>
        <text x="380" y="150" class="u-lbl" text-anchor="middle">menerjemahkan CFML ke pemanggilan JVM</text>
        <line x1="150" y1="160" x2="150" y2="194" class="u-line" marker-end="url(#mk-l18-1)"/>
        <line x1="610" y1="160" x2="610" y2="194" class="u-line" marker-end="url(#mk-l18-1)"/>
        <rect x="40" y="198" width="220" height="58" rx="8" class="u-box"/>
        <text x="150" y="220" class="u-title" text-anchor="middle">Pustaka Java (classpath)</text>
        <text x="150" y="240" class="u-lbl" text-anchor="middle">JAR: POI, PDFBox, JJWT …</text>
        <rect x="270" y="198" width="220" height="58" rx="8" class="u-box"/>
        <text x="380" y="220" class="u-title" text-anchor="middle">Thread &amp; Scheduler</text>
        <text x="380" y="240" class="u-lbl" text-anchor="middle">cfthread · cfschedule (Quartz)</text>
        <rect x="500" y="198" width="220" height="58" rx="8" class="u-box"/>
        <text x="610" y="220" class="u-title" text-anchor="middle">Sistem eksternal</text>
        <text x="610" y="240" class="u-lbl" text-anchor="middle">cfhttp · Event Gateway · file</text>
        <text x="380" y="274" class="u-lbl" text-anchor="middle">Semua berjalan dalam satu JVM yang sama — tanpa proses jembatan tambahan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 18.1</b> — Lucee adalah jembatan CFML ↔ JVM; pustaka, thread, dan sistem eksternal berada satu rumah</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Objek Java & konversi tipe CFML ↔ Java',
      lang: 'cfml',
      output: false,
      code: `// Objek Java dipakai persis seperti dari bahasa Java
var daftar = createObject( "java", "java.util.ArrayList" ).init();
daftar.add( "Kopi Gayo" );
daftar.add( "Teh Melati" );
daftar.sort( true );                        // method bawaan Java

// javaCast menjamin tipe yang diterima method Java yang ketat
var jumlah  = javaCast( "int",    form.jumlah );
var aktif   = javaCast( "boolean", form.aktif );
var berat   = javaCast( "double",  form.berat );
var tanggal = javaCast( "date",    now() );

// Java → CFML: konversi manual agar aman dipakai fungsi array CFML
var hasil = listToArray( daftar.toString() );
writeOutput( arrayLen( hasil ) );`,
      explain: [
        '<code>.init()</code> memanggil konstruktor Java; tanpa itu kamu hanya punya "kelas kosong".',
        '<code>javaCast()</code> mencegah kegagalan method overload yang menerima tipe spesifik (int, double, boolean, String, Date).',
        'Nilai Date CFML dan java.util.Date kompatibel, tapi angka CFML bisa terbaca BigDecimal di Java — perlakukan bila perlu.',
        'Objek Java yang kompleks lebih baik dibungkus CFC daripada disebar ke seluruh aplikasi.'
      ]
    },
    {
      type: 'warn',
      title: 'Akses Java tidak punya pagar otomatis',
      text: 'Dari CFML kamu bisa memanggil <b>class Java apa pun</b> di JVM — termasuk <code>Runtime.exec()</code> yang menjalankan perintah sistem. Artinya: jangan pernah mengevaluasi CFML/Java dari input pengguna, dan perlakukan setiap pemakaian <code>createObject("java", …)</code> sebagai kode sensitif yang wajib direview saat code review.'
    },
    {
      type: 'text',
      html: '<h3>Memuat Pustaka Java Eksternal (JAR)</h3><p>Class bawaan JVM terbatas; untuk pustaka pihak ketiga (Apache POI, iText, pustaka kriptografi) siapkan berkas <code>.jar</code> lalu daftarkan lewat <code>this.javaSettings</code> di Application.cfc. Cara ini disukai karena konfigurasinya ikut ter-deploy bersama kode. Alternatifnya, daftarkan lewat berkas <code>.CFConfig.json</code> (kunci <code>javaSettings</code>) agar bisa diatur terpusat tanpa menyentuh kode aplikasi.</p>'
    },
    {
      type: 'example',
      title: 'Mendaftarkan JAR lewat Application.cfc',
      lang: 'cfml',
      output: false,
      code: `component {
  this.name = "TokoOnline";

  // Muat pustaka Java saat server mulai — bukan tiap request
  this.javaSettings = {
    loadPaths       : [ expandPath( "/lib" ) ],   // semua .jar di folder ini
    mappings        : { "/lib" : expandPath( "/lib" ) },
    useJavaAsLoader : false
  };

  function onApplicationStart() {
    // Sekarang class dari JAR bisa dipakai langsung
    variables.pdfBox = createObject( "java", "org.apache.pdfbox.pdmodel.PDDocument" );
    return true;
  }
}`,
      explain: [
        '<code>loadPaths</code> menerima berkas .jar atau folder berisi banyak .jar.',
        'Pustaka yang sama juga bisa didaftarkan lewat <code>javaSettings</code> pada <code>.CFConfig.json</code> — pilih salah satu, jangan bertabrakan.',
        'Objek berat sebaiknya dibuat sekali di onApplicationStart, bukan dibuat ulang di tiap request.',
        'Perhatikan konflik versi: JVM hanya bisa memuat satu versi per class —usahakan kompatibel.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Operasi Asinkron dengan cfthread</h3><p>Ada pekerjaan yang tidak perlu membuat pengguna menunggu: mengirim email notifikasi, mencatat audit trail, memproses gambar. Tag <code>&lt;cfthread&gt;</code> menjalankannya di <b>thread terpisah</b> sehingga request utama bisa langsung merespons. Setiap thread punya salinan scope-nya sendiri, dan data yang kamu kirim masuk lewat atribut <code>data</code>.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan & menunggu thread',
      lang: 'cfml',
      output: false,
      code: `<!--- Jalankan notifikasi email tanpa memblokir response --->
<cfthread name="thNotifikasi" action="run" data="#form.email#,#form.pesananId#">
  <cfset info = listToArray( attributes.data )>
  <cfset mailService.kirimNota( info[ 1 ], val( info[ 2 ] ) )>
</cfthread>

<!--- Lanjut melayani pengguna — response tidak menunggu email --->
<cfoutput>Pesanan ##form.pesananId## diterima.</cfoutput>

<!--- Bila ada bagian yang WAJIB selesai sebelum keluar (mis. tulis log), join: --->
<cfthread action="join" name="thNotifikasi" timeout="5" />
<cfif cfthread[ "thNotifikasi" ].status eq "completed">
  <cflog file="toko" text="Notifikasi selesai dikirim">
<cfelse>
  <cflog file="toko" type="error" text="Notifikasi gagal atau timeout">
</cfif>`,
      explain: [
        '<code>action="run"</code> memulai thread dan langsung melanjutkan halaman; <code>action="join"</code> menunggu sampai selesai (atau timeout) dengan satuan detik.',
        'Data yang dikirim lewat atribut <code>data</code> dibaca di dalam thread lewat scope <code>attributes</code>.',
        'Status dan pesan error thread dibaca dari scope <code>cfthread</code> — nama thread menjadi kuncinya.',
        'Scope <code>application</code>, <code>session</code>, dan <code>request</code> tidak tersedia di dalam thread; jangan mengandalkannya.'
      ]
    },
    {
      type: 'tip',
      title: 'Thread-safety: kenapa scope thread dipisah',
      text: 'Setiap thread punya dunia variabelnya sendiri — itulah gunanya. Sebaliknya, struktur bersama seperti <code>application</code> bisa ditulis banyak thread sekaligus dan menyebabkan data rusak. Bila harus menulis ke scope bersama, bungkus dengan <code>&lt;cflock&gt;</code>, dan utamakan memakai struktur thread-safe bawaan seperti <code>ConcurrentHashMap</code> dari Java.'
    },
    {
      type: 'text',
      html: '<h3>Penjadwalan Tugas &amp; Event Gateway</h3><p>Untuk pekerjaan berulang — laporan penjualan jam 2 pagi, pembersihan token kedaluwarsa — pakai <code>&lt;cfschedule&gt;</code>. Di Lucee 7 penjadwalan pindah ke <b>ekstensi Scheduler</b> berbasis Quartz, jadi pasang dulu ekstensinya sebelum memakai tag ini. Untuk kejadian yang datang dari luar secara terus-menerus (pesanan dari message broker), Lucee menyediakan <b>Event Gateway</b>: AMQP, MQTT, dan WebSocket bisa memicu kode CFML begitu pesan tiba, tanpa polling.</p>'
    },
    {
      type: 'example',
      title: 'Menjadwalkan laporan harian',
      lang: 'cfml',
      output: false,
      code: `<!--- Dijalankan tiap hari pukul 02:00; action="run" bisa dipakai untuk uji coba --->
<cfschedule task="laporanPenjualan"
            url="/scheduled/laporan-penjualan.cfm"
            operation="HTTPRequest"
            startDate="2026-10-18"
            startTime="02:00:00"
            interval="daily"
            action="update">

<!--- laporan-penjualan.cfm: pekerjaan berat tanpa pengguna menunggu --->
<cfset ringkas = queryExecute(
  "SELECT kategori, SUM(total) AS omzet FROM pesanan GROUP BY kategori",
  {}, { datasource: "appDB", cachedwithin: createTimeSpan( 0, 0, 30, 0 ) } )>
<cfmail to="owner@toko.example" from="laporan@toko.example"
        subject="Laporan harian" type="HTML">
  <cfoutput>#serializeJson( ringkas )#</cfoutput>
</cfmail>`,
      explain: [
        '<code>action="update"</code> membuat/memperbarui tugas; <code>action="run"</code> langsung mengeksekusinya sekali (berguna untuk pengujian).',
        '<code>operation="HTTPRequest"</code> berarti Lucee akan memanggil URL-nya seperti browser — file itu yang berisi pekerjaan sebenarnya.',
        'Di Lucee 7, pastikan ekstensi Scheduler (Quartz) sudah terpasang sebelum memakai cfschedule.',
        'Hasil query dipakai cachedwithin agar laporan tidak membebani database pada jam sibuk.'
      ]
    },
    {
      type: 'text',
      html: '<h3>File, Dokumen &amp; Panggilan API Luar</h3><p>Terakhir, tiga kemampuan yang hampir selalu dibutuhkan aplikasi bisnis: menghasilkan <b>PDF</b> (nota, laporan) dengan <code>&lt;cfdocument&gt;</code>, menghasilkan <b>Excel</b> dengan <code>&lt;cfspreadsheet&gt;</code> (di atas Apache POI), dan memproses file unggahan dengan <code>&lt;cffile action="upload"&gt;</code>. Untuk berinteraksi dengan layanan lain, <code>&lt;cfhttp&gt;</code> mengirim request HTTP lengkap dengan body JSON dan timeout.</p>'
    },
    {
      type: 'example',
      title: 'PDF nota & laporan Excel',
      lang: 'cfml',
      output: false,
      code: `<!--- PDF: nota pembelian --->
<cfdocument format="PDF" filename="#expandPath('/files/nota-1024.pdf')#" overwrite="true">
  <h1>Nota Pesanan 1024</h1>
  <p>Atas nama: Budi Santoso</p>
  <p>Total: Rp 285.000</p>
</cfdocument>

<!--- Excel: rekap penjualan bulanan --->
<cfquery name="qryRekap" datasource="appDB">
  SELECT kategori, COUNT(*) AS jumlah, SUM(total) AS omzet
  FROM pesanan GROUP BY kategori
</cfquery>
<cfspreadsheet action="write"
               filename="#expandPath('/files/rekap-penjualan.xlsx')#"
               query="qryRekap"
               sheet="Rekap"
               overwrite="true">`,
      explain: [
        '<code>filename</code> + <code>overwrite</code> menulis hasil langsung ke berkas, bukan mengirimnya ke browser.',
        '<code>cfspreadsheet</code> membaca atau menulis Excel memakai Apache POI di balik layar.',
        'Nama kolom hasil query menjadi judul kolom otomatis pada file Excel.',
        'Simpan hasil di folder yang bisa ditulis aplikasi tapi tidak bisa diunduh publik.'
      ]
    },
    {
      type: 'example',
      title: 'Upload file yang aman',
      lang: 'cfml',
      output: false,
      code: `<cffile action="upload"
        destination="#expandPath('../uploads')#"
        nameconflict="makeunique"
        result="up"
        acceptedfileextensions=".jpg,.png,.webp"
        mimetype="image/jpeg,image/png,image/webp">

<!--- Validasi kedua: ukuran wajar (maks 2 MB) --->
<cfif up.fileSize gt 2 * 1024 * 1024>
  <cffile action="delete" file="#up.serverDirectory#/#up.serverFile#">
  <cfthrow message="File terlalu besar">
</cfif>`,
      explain: [
        'Tujuan upload berada di <b>luar webroot</b> sehingga berkas tidak bisa diunduh langsung lewat URL.',
        '<code>mimetype</code> dan <code>acceptedfileextensions</code> menyaring tipe berkas — periksa juga hasilnya, jangan percaya satu filter saja.',
        '<code>nameconflict="makeunique"</code> memberi nama unik sehingga file pengguna lain tidak tertimpa.',
        'Validasi ukuran dilakukan terpisah agar berkas besar tidak sempat memakan disk.'
      ]
    },
    {
      type: 'example',
      title: 'Memanggil API luar dengan cfhttp',
      lang: 'cfml',
      output: false,
      code: `<cfhttp url="https://api.ongkir.example/v1/cek" method="post" result="resp" timeout="15">
  <cfhttpparam type="header" name="Authorization" value="Bearer #secret#">
  <cfhttpparam type="header" name="Content-Type" value="application/json">
  <cfhttpparam type="body" value="#serializeJson( { asal: 'SBY', tujuan: 'DKN' } )#">
</cfhttp>

<cfif listFirst( resp.statusCode, " " ) eq 200>
  <cfset ongkir = deserializeJson( resp.fileContent )>
<cfelse>
  <cflog file="toko" type="error" text="API ongkir gagal: #resp.statusCode#">
  <cfset ongkir = { error: true }>
</cfif>`,
      explain: [
        '<code>method="post"</code> plus <code>cfhttpparam type="body"</code> mengirim payload JSON ke API luar.',
        '<code>timeout="15"</code> membatasi waktu tunggu — layanan lain yang lambat tidak boleh menggantung request kamu.',
        '<code>resp.statusCode</code> berisi "200 OK"; ambil kode angkanya saja dengan listFirst karena angka bukan angka murni.',
        'Selalu siapkan cabang gagal: API luar bisa downtime kapan saja.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['JVM', 'Java Virtual Machine — tempat Lucee dan kode CFML-mu berjalan.'],
        ['createObject("java", …)', 'Fungsi CFML yang mengembalikan objek class Java dari classpath.'],
        ['javaCast', 'Memaksa tipe data CFML menjadi tipe Java tertentu (int, double, boolean, String).'],
        ['javaSettings', 'Pengaturan Application.cfc untuk memuat JAR pustaka Java (loadPaths).'],
        ['cfthread', 'Tag untuk menjalankan kode di thread terpisah (asinkron).'],
        ['cfschedule', 'Penjadwal tugas berkala; di Lucee 7 berbasis ekstensi Scheduler/Quartz.'],
        ['Event Gateway', 'Pintu masuk pesan eksternal (AMQP/MQTT/WebSocket) yang memicu kode CFML.']
      ]
    }
  ],
  recap: [
    'Berada di JVM membuat Lucee bisa memanggil class Java apa pun lewat createObject("java", …).',
    'javaCast menjamin tipe yang diterima method Java yang ketat; muat JAR pihak ketiga lewat this.javaSettings.',
    'cfthread menjalankan pekerjaan asinkron; action="join" + scope cfthread dipakai untuk menunggu dan memeriksa hasilnya.',
    'cfschedule menjadwalkan tugas berkala (ekstensi Scheduler di Lucee 7); Event Gateway memproses pesan AMQP/MQTT/WebSocket.',
    'cfdocument menghasilkan PDF, cfspreadsheet menghasilkan Excel, dan cffile menangani upload — simpan upload di luar webroot.',
    'cfhttp memanggil API luar; selalu set timeout dan siapkan penanganan bila layanan itu gagal.'
  ]
});
