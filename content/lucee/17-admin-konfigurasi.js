/* ============================================================
   Pelajaran Lucee CFML — Bab 17: Lucee Admin, Konfigurasi & Cache (L17)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-admin-konfigurasi',
  title: 'Lucee Admin, Konfigurasi & Cache',
  chapter: 'Operasi & Profesional',
  duration: '14 menit',
  intro: [
    'Selama belajar, kamu mungkin terbiasa mengklik Lucee Admin untuk menambah datasource atau memasang ekstensi. Caranya memang mudah, tapi <b>tidak bisa diulang otomatis</b>: server produksi baru harus diklik ulang dari nol, dan pengaturan yang tidak tercatat mudah berbeda antar lingkungan.',
    'Pelajaran ini membahas dua hal yang membedakan proyek hobi dan aplikasi yang siap operasi: mengelola <b>Lucee Admin</b> (Server Admin vs Web Admin) dan mengubah kebiasaan klik menjadi <b>konfigurasi berbasis kode</b>, termasuk pengaturan <b>cache</b> yang menentukan apakah toko onlinemu sanggup melayani ribuan pengunjung.'
  ],
  objectives: [
    'Membedakan cakupan Lucee Server Admin dan Lucee Web Admin',
    'Memindahkan konfigurasi dari klik admin ke Application.cfc dan berkas konfigurasi',
    'Mengelola pengaturan Lucee lewat CFConfig dan CommandBox',
    'Mengunci Lucee Admin pada lingkungan produksi',
    'Mengatur cache template, query, dan aplikasi beserta strategi invalidasinya',
    'Memantau performa dan menangani log error dengan benar'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Server Admin vs Web Admin</h3><p>Secara historis Lucee menyediakan dua admin: <b>Lucee Server Admin</b> (<code>/lucee/admin/server</code>) mengatur hal yang berlaku global untuk satu instalasi Lucee — datasource global, ekstensi, cache engine, JVM, dan logging. <b>Lucee Web Admin</b> (<code>/lucee/admin/web</code>) mengatur satu <b>konteks web</b> — mapping, datasource web, charset, dan aturan keamanan per situs. Dulu (Lucee 5 ke bawah) keduanya disimpan di dua berkas XML berbeda, sehingga pengaturan sering "kabur" ke tempat yang salah.</p><p>Sejak Lucee 6, konfigurasi berpindah ke JSON dan <b>single mode</b> menjadi default — dan satu-satunya pilihan di Lucee 7. Artinya satu admin, satu pengaturan global, tanpa lagi membingungkan server context vs web context. Bedanya tetap perlu kamu pahami ketika membaca dokumentasi lama atau memelihara aplikasi warisan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 290" width="760" role="img" aria-label="Aliran konfigurasi Lucee dari kode ke berkas config lalu ke admin UI">
        <defs><marker id="mk-l17-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="170" y="20" width="420" height="56" rx="8" class="u-box"/>
        <text x="380" y="44" class="u-title" text-anchor="middle">Sumber kebenaran: kode &amp; environment</text>
        <text x="380" y="65" class="u-lbl" text-anchor="middle">Application.cfc · .CFConfig.json · env var</text>
        <line x1="380" y1="76" x2="380" y2="112" class="u-line" marker-end="url(#mk-l17-1)"/>
        <text x="398" y="98" class="u-lbl">dibaca saat server start</text>
        <rect x="170" y="116" width="420" height="56" rx="8" class="u-hd"/>
        <text x="380" y="140" class="u-title" text-anchor="middle">Berkas konfigurasi Lucee</text>
        <text x="380" y="161" class="u-lbl" text-anchor="middle">.CFConfig.json (Lucee 6/7) · lucee-server.xml / lucee-web.xml (Lucee 5)</text>
        <line x1="250" y1="172" x2="250" y2="212" class="u-line" marker-end="url(#mk-l17-1)"/>
        <line x1="510" y1="172" x2="510" y2="212" class="u-line" marker-end="url(#mk-l17-1)"/>
        <rect x="140" y="216" width="220" height="52" rx="8" class="u-box"/>
        <text x="250" y="238" class="u-title" text-anchor="middle">Server Admin</text>
        <text x="250" y="258" class="u-lbl" text-anchor="middle">global: ekstensi, cache, JVM</text>
        <rect x="400" y="216" width="220" height="52" rx="8" class="u-box"/>
        <text x="510" y="238" class="u-title" text-anchor="middle">Web Admin</text>
        <text x="510" y="258" class="u-lbl" text-anchor="middle">per konteks: mapping, charset</text>
        <text x="380" y="285" class="u-lbl" text-anchor="middle">Admin UI hanyalah tampilan dari berkas yang sama — klik di sana mengubah berkas itu</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 17.1</b> — Konfigurasi mengalir dari kode ke berkas; admin UI bukan sumber kebenaran</figcaption></figure>`
    },
    {
      type: 'warn',
      title: 'Kunci Lucee Admin sebelum online',
      text: 'Admin Lucee yang terbuka = kendali penuh atas server (datasource, ekstensi, file). Di produksi: set password kuat (misalnya lewat <code>adminPassword</code> di konfigurasi), batasi akses admin ke IP internal saja, dan bila memang tidak perlu — <b>nonaktifkan/hapus admin</b> sepenuhnya. Jangan pernah membiarkan password bawaan atau kosong.'
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi Berbasis Kode, Bukan Klik Manual</h3><p>Prinsipnya: <b>semua pengaturan penting harus ada di repositori git</b>. Tiga lapis yang umum dipakai:</p><ul><li><b>Application.cfc</b> — pengaturan milik aplikasi: datasource, session, mapping, javaSettings. Ikut ter-deploy ke mana pun kodenya pergi.</li><li><b>.CFConfig.json</b> — pengaturan level engine yang biasanya diklik di admin (password admin, timeout, cache, ekstensi). Dibaca otomatis saat server start.</li><li><b>Environment variable</b> — tempat rahasia (password DB, secret) dan nilai yang berbeda tiap lingkungan.</li></ul>'
    },
    {
      type: 'example',
      title: 'Application.cfc: konfigurasi yang ikut ter-deploy',
      lang: 'cfml',
      output: false,
      code: `component {
  this.name             = "TokoOnline";
  this.sessionManagement = true;
  this.sessionTimeout    = createTimeSpan( 0, 0, 30, 0 );   // 30 menit

  // Datasource didefinisikan sebagai kode — bukan klik di admin
  this.datasources["appDB"] = {
    class            : "com.mysql.cj.jdbc.Driver",
    connectionString : "jdbc:mysql://db:3306/toko?characterEncoding=UTF-8",
    username         : "toko_app",
    password         : createObject( "java", "java.lang.System" ).getenv( "DB_PASSWORD" ),
    connectionLimit  : 20
  };

  function onApplicationStart() {
    application.kategoriCache = {};
    return true;
  }
}`,
      explain: [
        'Password datasource dibaca dari environment variable <code>DB_PASSWORD</code> — tidak tertinggal di git.',
        'Server baru yang menjalankan kode ini otomatis memperoleh datasource yang sama, tanpa membuka admin.',
        '<code>this.sessionTimeout</code> dan <code>this.name</code> juga diatur di sini agar seragam antar lingkungan.'
      ]
    },
    {
      type: 'example',
      title: '.CFConfig.json: pengaturan engine Lucee',
      lang: 'json',
      output: false,
      code: `{
  "adminPassword": "{env:LUCEE_ADMIN_PASSWORD}",
  "locale": "id_ID",
  "requestTimeout": "0,0,5,0",
  "templateCacheSize": 500,
  "extensions": [
    { "id": "7E673D15-D87C-41A6-8B5F1956528C605F", "name": "MySQL", "version": "9.0.0" }
  ]
}`,
      explain: [
        'Placeholder <code>{env:…}</code> mengisi nilai dari environment variable / system property saat server mulai.',
        '<code>requestTimeout</code> memakai format timespan <code>hari,jam,menit,detik</code> — di sini 5 menit.',
        'Daftar <code>extensions</code> membuat ekstensi terpasang otomatis, tanpa klik di admin.',
        'Berkas ini boleh diletakkan di root proyek (dipakai CFConfig) atau di <code>WEB-INF/lucee-server/context/</code> untuk konfigurasi native Lucee.'
      ]
    },
    {
      type: 'example',
      title: 'Mengelola konfigurasi dari CommandBox',
      lang: 'bash',
      output: false,
      code: `# Pasang modul CFConfig sekali
box install commandbox-cfconfig

# Set pengaturan tanpa membuka browser
box cfconfig set adminPassword=$LUCEE_ADMIN_PASSWORD to=toko
box cfconfig set requestTimeout="0,0,5,0" to=toko
box cfconfig set templateCacheSize=500 to=toko

# Nilai tertentu bisa ditimpa lewat environment variable saat runtime
export cfconfig_adminPassword="ganti-dengan-secret"
box server start name=toko cfengine=lucee@6.2.x port=8080`,
      explain: [
        '<code>to=toko</code> menunjuk nama server CommandBox yang pengaturannya mau diubah.',
        'Override env var memakai pola <code>cfconfig_&lt;namaPengaturan&gt;</code> — nilainya menimpa isi berkas JSON.',
        'Perintah ini sama persis dengan yang bisa dijalankan di CI/CD, sehingga konfigurasi produksi bisa dibuat otomatis.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Di Mana Berkasnya, dan Kapan Disentuh</h3><p>Pada Lucee lama (sebelum single mode) pengaturan tersimpan di dua berkas XML di dalam <code>WEB-INF</code>: <code>lucee-server/config/lucee-server.xml</code> untuk Server Admin dan <code>lucee-web/lucee-web.xml</code> untuk tiap Web Admin. Di CommandBox, folder <code>WEB-INF</code> berada di dalam <code>serverHomeDirectory</code> milik tiap server. Lucee 6/7 menyatukannya ke JSON: <code>WEB-INF/lucee-server/context/.CFConfig.json</code>.</p><p>Aturan mainnya: <b>berkas XML/JSON disentuh lewat CFConfig atau Admin, bukan editor teks saat server menyala</b>. Perubahan config dimuat ulang saat server start; pada Lucee versi tertentu kamu bisa menjatuhkan berkas baru ke folder <code>lucee-server/deploy</code> agar diproses ulang tanpa restart penuh.</p>'
    },
    {
      type: 'text',
      html: '<h3>Cache: Template, Query, dan Fungsi</h3><p>Lucee menyimpan <b>template cache</b> (hasil kompilasi CFML), <b>query cache</b> (hasil query database), dan <b>function/object cache</b> (hasil perhitungan mahal). Untuk aplikasi toko online, query katalog yang sama bisa dilayani dari memori ribuan kali — database hanya perlu bekerja saat cache habis masa berlakunya.</p>'
    },
    {
      type: 'example',
      title: 'Cache aplikasi dan cache query',
      lang: 'cfml',
      output: false,
      code: `// 1) Cache aplikasi: hasil layanan disimpan 10 menit di cache engine aktif
var cacheKey = "kategori:populer";
var data = cacheGet( cacheKey );
if ( !isStruct( data ) ) {                 // miss → hitung ulang lalu simpan
  data = kategoriService.ambilSemua();
  cachePut( cacheKey, data, createTimeSpan( 0, 0, 10, 0 ) );
}
// 2) Cache query: hasil query disimpan engine — request berikut tak sentuh DB
<cfquery name="qryProduk" datasource="appDB" cachedwithin="#createTimeSpan(0,0,10,0)#">
  SELECT id, nama, harga FROM produk
  WHERE status = <cfqueryparam value="aktif" cfsqltype="cf_sql_varchar">
</cfquery>`,
      explain: [
        '<code>cacheGet()</code> mengembalikan nilai kosong saat miss, sehingga blok if di atas mengecek dengan <code>isStruct()</code>.',
        '<code>cachePut( key, value, ttl )</code> menyimpan hasil beserta masa berlakunya.',
        'Atribut <code>cachedwithin</code> membuat engine memakai hasil cache selama timespan yang diberikan, tanpa mengubah kode pemanggil.',
        'Backend cache bawaan adalah RAM; ganti dengan Ehcache, Redis, atau Memcached lewat pengaturan cache engine.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Strategi Cache: Apa yang Layak, Kapan Dibuang</h3><p>Cache paling berdampak pada data yang <b>sering dibaca, jarang berubah</b>: kategori produk, konfigurasi toko, laporan periodik. Sebaliknya, jangan cache data per pengguna (keranjang, saldo) karena bisa menyajikan data yang salah antar sesi.</p><ul><li><b>TTL (time to live)</b> — pilih sesuai kesegaran data: 5–10 menit untuk katalog, 1 jam untuk laporan.</li><li><b>Invalidasi eksplisit</b> — saat admin mengubah produk, panggil <code>cacheDelete( key )</code> terkait; jangan menunggu TTL bila data berubah sering.</li><li><b>Kunci yang deskriptif</b> — pola <code>kategori:populer</code>, <code>produk:1024</code> membuat invalidasi dan debugging jauh lebih mudah.</li></ul>'
    },
    {
      type: 'example',
      title: 'Cache engine & tuning lewat CFConfig',
      lang: 'bash',
      output: false,
      code: `# Daftarkan cache engine berbasis Ehcache (pasang dulu sebagai ekstensi)
box cfconfig cache save name=tokoCache type=EHCache to=toko

# Kapasitas template cache & batas waktu request
box cfconfig set templateCacheSize=500 to=toko
box cfconfig set requestTimeout="0,0,1,0" to=toko

# Thread & heap JVM diatur dari CommandBox
box server set JVM_ARGS="-Xms512m -Xmx2g -XX:+UseG1GC" name=toko
box server restart name=toko`,
      explain: [
        'Pada Lucee 7, Ehcache tidak lagi dibundel — pasang sebagai ekstensi terlebih dahulu (lihat daftar extensions di .CFConfig.json).',
        'Redis dan Memcached dipakai dengan cara yang sama: pasang ekstensi penyedia cache, lalu daftarkan sebagai cache engine.',
        '<code>templateCacheSize</code> mengatur kapasitas template cache; <code>requestTimeout</code> membatasi lama satu request.',
        'Pengaturan cache dan JVM ikut hidup di repositori sehingga seluruh tim memakai nilai yang sama.'
      ]
    },
    {
      type: 'tip',
      title: 'dump() hanya untuk pengembangan',
      text: '<code>dump()</code>/<code>cfdump</code> luar biasa membantu saat debugging, tapi <b>tidak boleh sampai ke produksi</b>: selain tampilan yang rusak, output dump bisa membocorkan isi variabel sensitif (password, token, isi datasource). Gunakan <code>writeLog()</code> untuk mencatat, dan bila perlu pasang pengaman ekstra dengan CFLint rule <code>AVOID_USING_WRITEDUMP</code> yang menolak kode ber-dump masuk ke repositori.'
    },
    {
      type: 'text',
      html: '<h3>Memantau Performa &amp; Log Error</h3><p>Konfigurasi yang rapi baru berguna bila kamu memantaunya. Lucee menulis log ke folder logs pada direktori konteks (misalnya <code>lucee-server/context/logs</code> di instalasi Lucee) — di CommandBox biasanya di dalam <code>serverHomeDirectory/WEB-INF/lucee-server/context/logs</code>. Lakukan tiga kebiasaan: pantau log error setiap pagi, ukur halaman paling lambat (kandidat utama caching), dan periksa datasource usage (koneksi yang terus naik biasanya berarti connection leak).</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Lucee Server Admin', 'Admin global per instalasi Lucee: ekstensi, cache engine, JVM, logging.'],
        ['Lucee Web Admin', 'Admin per konteks web: mapping, datasource web, charset, aturan keamanan.'],
        ['Single mode', 'Mode Lucee 6+ (wajib di Lucee 7) dengan satu admin dan satu pengaturan global.'],
        ['CFConfig', 'Modul CommandBox untuk membaca/menulis konfigurasi CF engine lewat CLI dan JSON.'],
        ['.CFConfig.json', 'Berkas konfigurasi native Lucee 6+ yang dibaca otomatis saat server start.'],
        ['Template cache', 'Cache hasil kompilasi CFML agar template tidak dikompilasi ulang tiap request.'],
        ['TTL (time to live)', 'Masa berlaku sebuah entri cache sebelum dianggap kedaluwarsa.']
      ]
    }
  ],
  recap: [
    'Server Admin bersifat global per instalasi, Web Admin per konteks web; Lucee 6+ (wajib di 7) menyatukannya dalam single mode.',
    'Jadikan Application.cfc, .CFConfig.json, dan environment variable sebagai satu-satunya sumber kebenaran konfigurasi.',
    'CFConfig (box cfconfig set) mengubah pengaturan engine tanpa membuka browser — dan bisa dipakai di CI.',
    'Cache bawaan RAM bisa diganti Ehcache/Redis/Memcached sebagai ekstensi; atur TTL dan invalidasi eksplisit.',
    'Kunci admin Lucee dengan password kuat dan batasi aksesnya; di produksi admin sebaiknya dinonaktifkan.',
    'dump() hanya untuk pengembangan; di produksi pakai writeLog() dan pantau log error secara rutin.'
  ]
});
