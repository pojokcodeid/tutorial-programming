/* ============================================================
   Pelajaran Lucee CFML — Bab 16: JSON/XML & Otentikasi API (JWT) (L16)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-json-jwt',
  title: 'JSON/XML & Otentikasi API (JWT)',
  chapter: 'Arsitektur Modern',
  duration: '15 menit',
  intro: [
    'API modern bertukar data dalam format <b>JSON</b>, tetapi tidak sedikit layanan lama — feed blog, gateway pembayaran, sampai sistem pemerintah — yang masih membalas <b>XML</b>. Untungnya Lucee memperlakukan keduanya sebagai data CFML biasa, asal kamu paham cara mengonversinya dan tahu jebakan yang membuat data berubah bentuk diam-diam.',
    'Setelah format beres, muncul pertanyaan kedua: bagaimana server tahu siapa yang mengirim request? Pelajaran ini menutup bab Arsitektur Modern dengan alur <b>otentikasi berbasis token</b> — login sekali, menerima <b>JWT</b>, lalu menyertakannya di header <code>Authorization: Bearer …</code> pada request berikutnya.'
  ],
  objectives: [
    'Mengonversi struktur CFML ke JSON dan sebaliknya dengan serializeJson dan deserializeJson',
    'Mendeteksi JSON yang valid dengan isJSON sebelum diproses',
    'Melindungi output dari XSS memakai encodeForHTML dan encodeForHTMLAttribute',
    'Membaca respons XML dari API luar dengan xmlParse, xmlSearch, dan xmlTransform',
    'Membuat dan memverifikasi token JWT serta membedakan respons 401 dan 403',
    'Menyimpan secret di environment variable dan password dengan hash bcrypt'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>JSON: Dua Arah, Dua Tipe Data</h3><p><code>serializeJson()</code> mengubah data CFML (struct, array, query, skalar) menjadi teks JSON. <code>deserializeJson()</code> melakukan kebalikannya: objek JSON menjadi <b>struct</b>, dan daftar JSON menjadi <b>array</b> CFML. Aturan besinya hanya dua — struct setara objek, array setara daftar — tapi di lapangan ada beberapa kasus yang membuat data "berubah bentuk" tanpa peringatan.</p>'
    },
    {
      type: 'example',
      title: 'Struct produk toko online ↔ JSON',
      lang: 'cfml',
      output: false,
      code: `// Struct toko online → JSON (siap dikirim ke klien)
var produk = { id: 1024, nama: "Kopi Gayo", harga: 95000, stok: 12 };
var json   = serializeJson( produk );
// {"id":1024,"nama":"Kopi Gayo","harga":95000,"stok":12}
// Balasan API → CFML, tapi validasi dulu sebelum diparse
var mentah = '{"id":1024,"nama":"Kopi Gayo"}';
if ( isJSON( mentah ) ) {
  var data = deserializeJson( mentah );
  writeOutput( data.nama );   // Kopi Gayo
}
// Query pun bisa diserialkan untuk endpoint daftar produk
var daftar = queryExecute( "SELECT id, nama, harga FROM produk", {}, { datasource: "appDB" } );
var semua = serializeJson( daftar );`,
      explain: [
        'Struct CFML menjadi objek JSON, array CFML menjadi array JSON.',
        '<code>isJSON()</code> mengembalikan true hanya untuk teks yang benar-benar JSON valid — pakai sebagai gerbang sebelum parse.',
        '<code>deserializeJson()</code> menghasilkan struct untuk objek dan array untuk daftar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Perangkap: Array yang Berubah Jadi Objek</h3><p>JSON tidak punya cara menuliskan "lubang" di tengah daftar. Akibatnya, array CFML yang indeksnya berantakan bisa keluar sebagai objek berisi kunci angka. Kebalikannya juga sering terjadi: JSON objek dengan kunci numerik (misalnya API yang mengindeks produk dengan ID) dibaca kembali sebagai <b>struct</b>, bukan array — lalu <code>arrayMap()</code>/<code>arrayFilter()</code> langsung gagal.</p>'
    },
    {
      type: 'example',
      title: 'Array rapat, bukan berlubang',
      lang: 'cfml',
      output: false,
      code: `// Jebakan 1: array berlubang bisa keluar sebagai objek
var belanja = [];
belanja[ 1 ] = "kopi";
belanja[ 5 ] = "gula";            // indeks 2 sampai 4 kosong
writeOutput( serializeJson( belanja ) );
// sering berakhir sebagai objek {"1":"kopi","5":"gula"}
// Jebakan 2: objek berkunci angka dibaca kembali sebagai struct
var dariApi = deserializeJson( '{"1024":"Kopi Gayo","1025":"Teh Melati"}' );
writeOutput( isArray( dariApi ) );   // false — ini struct
// Cara aman: bangun array rapat & berurutan, lalu periksa hasil parse
var aman = [];
arrayAppend( aman, "kopi" );
arrayAppend( aman, "gula" );
writeOutput( isArray( aman ) );      // true`,
      explain: [
        'Array berlubang tidak bisa diwakili JSON dengan setia, sehingga hasilnya bisa berupa objek berkunci angka.',
        'Setelah <code>deserializeJson()</code>, selalu periksa <code>isArray()</code> atau <code>isStruct()</code> sebelum memakai fungsi array.',
        '<code>arrayAppend()</code> menjaga indeks tetap rapat 1..n sehingga serialisasi selalu menghasilkan array.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan langsung percaya data JSON masuk',
      text: 'Validasi dengan <code>isJSON()</code> sebelum <code>deserializeJson()</code>, lalu periksa bentuk hasilnya. Balasan API luar bisa berubah sewaktu-waktu (ada field yang hilang, ada nilai yang menjadi null di tengah objek yang kamu harapkan daftar). Membiarkan parse gagal berarti membiarkan error 500 tampil di pengguna.'
    },
    {
      type: 'text',
      html: '<h3>Cegah XSS dengan encodeForHTML</h3><p><b>XSS</b> (Cross-Site Scripting) terjadi ketika teks dari pengguna — nama pembeli, ulasan produk, komentar — ditampilkan mentah-mentah sehingga browser mengeksekusi skrip di dalamnya. Aturannya cuma satu: <b>encode tepat sebelum output dicetak</b>. Fungsi utamanya adalah <code>encodeForHTML()</code> untuk isi elemen dan <code>encodeForHTMLAttribute()</code> untuk nilai atribut.</p>'
    },
    {
      type: 'example',
      title: 'Mengamankan ulasan pembeli',
      lang: 'cfml',
      output: false,
      code: `// Ulasan berisi payload XSS yang dicoba menanam gambar berbahaya
var ulasan = "<img src=x onerror=alert(document.cookie)>";
// 1. Sebagai isi elemen HTML
writeOutput( "<p class=\\"ulasan\\">" & encodeForHTML( ulasan ) & "</p>" );
// seluruh tag di-escape menjadi teks — browser tidak mengeksekusinya
// 2. Sebagai nilai atribut HTML
var judul = '" onmouseover="alert(1)';
writeOutput( '<img src="/img/kopi.jpg" alt="' & encodeForHTMLAttribute( judul ) & '">' );
// tanda kutip di-escape, atribut tidak bisa "ditutup" oleh penyerang`,
      explain: [
        '<code>encodeForHTML()</code> mengubah &lt;, &gt;, &amp;, dan tanda kutip menjadi entitas HTML.',
        '<code>encodeForHTMLAttribute()</code> memakai set karakter yang aman untuk konteks atribut.',
        'Encoding di konteks yang salah justru merusak makna — jangan meng-escape JSON atau URL memakai encodeForHTML.'
      ]
    },
    {
      type: 'text',
      html: '<h3>XML di Lucee: xmlParse, xmlSearch, xmlTransform</h3><p>Untuk API XML, mulai dengan <code>xmlParse()</code> yang mengubah teks menjadi objek XML yang bisa ditelusuri. <code>xmlSearch()</code> memakai <b>XPath</b> (bahasa query khusus XML) dan mengembalikan array node. Bila kamu perlu mengubah bentuknya (misalnya XML feed menjadi HTML), <code>xmlTransform()</code> menjalankan transformasi <b>XSLT</b>.</p>'
    },
    {
      type: 'example',
      title: 'Membaca feed RSS dari API luar',
      lang: 'cfml',
      output: false,
      code: `<cfhttp url="https://blog.toko.example/feed.xml" method="get" result="resp" timeout="10">
<cfset doc = xmlParse( resp.fileContent )>
<cfset entri = xmlSearch( doc, "//item" )>
<cfoutput><h2>Artikel terbaru (#arrayLen( entri )#)</h2>
<ul><cfloop array="#entri#" index="e"><li>#encodeForHTML( e.title.xmlText )#</li></cfloop></ul></cfoutput>`,
      explain: [
        '<code>timeout="10"</code> membatasi waktu tunggu — API luar yang lambat tidak boleh menggantung request kamu.',
        '<code>xmlParse()</code> menghasilkan objek XML; <code>resp.fileContent</code> adalah teks mentah balasannya.',
        '<code>xmlSearch( doc, "//item" )</code> mengambil semua elemen item sebagai array; <code>xmlText</code> mengambil isi teks sebuah node.'
      ]
    },
    {
      type: 'example',
      title: 'Mengubah XML jadi HTML dengan XSLT',
      lang: 'cfml',
      output: false,
      code: `var xsl = '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <ul>
      <xsl:for-each select="//item">
        <li><xsl:value-of select="title"/></li>
      </xsl:for-each>
    </ul>
  </xsl:template>
</xsl:stylesheet>';
var doc = xmlParse( resp.fileContent );
writeOutput( xmlTransform( doc, xsl ) );   // menghasilkan teks HTML`,
      explain: [
        '<code>xmlTransform( xml, xsl )</code> mengembalikan string hasil transformasi, siap dicetak.',
        'XSLT cocok untuk konversi format berulang (RSS/Atom ke HTML, XML laporan ke tabel) tanpa menulis parser manual.',
        'Styling XSLT yang kompleks lebih mudah dirawat di berkas .xsl terpisah daripada string panjang di dalam kode.'
      ]
    },
    {
      type: 'tip',
      title: 'Risiko XML yang jarang dibahas',
      text: 'XML dari sumber tak dikenal bisa membawa <b>entitas eksternal</b> (XXE) yang membuat server membaca berkas lokal atau melakukan request internal. Jangan parse XML sembarangan, jangan menerima XSLT dari input pengguna, dan perhatikan juga namespace: feed Atom memakai namespace bawaan sehingga XPath <code>//item</code> tidak menemukan apa-apa — pakai <code>//*[local-name()="entry"]</code>.'
    },
    {
      type: 'text',
      html: '<h3>JSON vs XML untuk REST</h3><p>Keduanya mampu memenuhi kebutuhan API, tapi praktiknya JSON menang telak untuk API baru:</p><ul><li><b>Ukuran &amp; kecepatan</b> — JSON jauh lebih ringan; parser-nya juga lebih murah di JVM.</li><li><b>Kemudahan klien</b> — JavaScript memakai JSON secara alami; XML butuh parser tambahan.</li><li><b>Ekspresivitas</b> — XML unggul bila butuh atribut, namespace, atau validasi skema ketat (XSD).</li><li><b>Kompatibilitas</b> — banyak layanan legacy (SOAP, feed, dokumen pemerintah) hanya paham XML; siapkan <code>xmlParse()</code> untuk kasus seperti ini.</li></ul><p>Singkatnya: <b>JSON sebagai default</b>, XML hanya ketika lawan bicara memintanya.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 250" width="760" role="img" aria-label="Alur autentikasi token: login, terbitkan JWT, lalu kirim token di header">
        <defs><marker id="mk-l16-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="30" y="30" width="150" height="60" rx="8" class="u-box"/>
        <text x="105" y="55" class="u-title" text-anchor="middle">Klien</text>
        <text x="105" y="76" class="u-lbl" text-anchor="middle">aplikasi / browser</text>
        <line x1="180" y1="60" x2="248" y2="60" class="u-line" marker-end="url(#mk-l16-1)"/>
        <text x="214" y="48" class="u-lbl" text-anchor="middle">1 · login</text>
        <rect x="252" y="30" width="180" height="60" rx="8" class="u-box"/>
        <text x="342" y="55" class="u-title" text-anchor="middle">POST /login</text>
        <text x="342" y="76" class="u-lbl" text-anchor="middle">email + password</text>
        <line x1="432" y1="60" x2="500" y2="60" class="u-line" marker-end="url(#mk-l16-1)"/>
        <text x="466" y="48" class="u-lbl" text-anchor="middle">2 · verifikasi bcrypt</text>
        <rect x="504" y="30" width="226" height="60" rx="8" class="u-box"/>
        <text x="617" y="55" class="u-title" text-anchor="middle">Server Lucee</text>
        <text x="617" y="76" class="u-lbl" text-anchor="middle">cocokkan hash → terbitkan JWT</text>
        <line x1="617" y1="90" x2="617" y2="140" class="u-line" marker-end="url(#mk-l16-1)"/>
        <text x="640" y="118" class="u-lbl">3 · token</text>
        <rect x="504" y="144" width="226" height="56" rx="8" class="u-hd"/>
        <text x="617" y="167" class="u-title" text-anchor="middle">JWT (exp 15 menit)</text>
        <text x="617" y="188" class="u-lbl" text-anchor="middle">header.payload.signature</text>
        <line x1="500" y1="172" x2="336" y2="172" class="u-line" marker-end="url(#mk-l16-1)"/>
        <text x="418" y="160" class="u-lbl" text-anchor="middle">4 · dipakai lagi di request</text>
        <rect x="30" y="144" width="300" height="56" rx="8" class="u-box"/>
        <text x="180" y="167" class="u-title" text-anchor="middle">GET /api/produk</text>
        <text x="180" y="188" class="u-lbl" text-anchor="middle">Authorization: Bearer &lt;token&gt;</text>
        <text x="180" y="230" class="u-lbl" text-anchor="middle">5 · server memverifikasi tanda tangan &amp; exp → 200 OK atau 401</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 16.1</b> — Alur token: login sekali, pakai JWT di header pada request berikutnya</figcaption></figure>`
    },
    {
      type: 'text',
      html: `<h3>Autentikasi Berbasis Token (JWT)</h3><p><b>JWT</b> (JSON Web Token) adalah string tiga bagian yang dipisahkan titik: <code>header.payload.signature</code>. Bagian payload berisi <b>klaim</b> (data) seperti pemilik token, peran, dan waktu kedaluwarsa; bagian terakhir adalah tanda tangan kriptografis yang membuat payload tidak bisa diubah pihak lain. Di Lucee kamu bisa memakai module CFML JWT (misalnya <b>cfjwt</b>) atau pustaka Java populer <b>JJWT</b> (io.jsonwebtoken) lewat <code>createObject("java", …)</code>.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 170" width="760" role="img" aria-label="Struktur JWT: header, payload, dan signature">
        <rect x="40" y="40" width="200" height="60" rx="8" class="u-box"/>
        <text x="140" y="65" class="u-title" text-anchor="middle">Header</text>
        <text x="140" y="86" class="u-lbl" text-anchor="middle">alg: HS256 · typ: JWT</text>
        <text x="255" y="75" class="u-title">.</text>
        <rect x="275" y="40" width="220" height="60" rx="8" class="u-hd"/>
        <text x="385" y="65" class="u-title" text-anchor="middle">Payload (klaim)</text>
        <text x="385" y="86" class="u-lbl" text-anchor="middle">sub · role · iat · exp</text>
        <text x="510" y="75" class="u-title">.</text>
        <rect x="530" y="40" width="190" height="60" rx="8" class="u-box"/>
        <text x="625" y="65" class="u-title" text-anchor="middle">Signature</text>
        <text x="625" y="86" class="u-lbl" text-anchor="middle">HMAC-SHA256(secret)</text>
        <text x="380" y="140" class="u-lbl" text-anchor="middle">Payload hanya di-encode, bukan dienkripsi — siapa pun bisa membacanya</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 16.2</b> — Tiga bagian JWT; tanda tangan mengunci isi payload</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menerbitkan token setelah login berhasil',
      lang: 'cfml',
      output: false,
      code: `// Secret diambil dari environment variable — TIDAK ditulis di kode
var secret = createObject( "java", "java.lang.System" ).getenv( "JWT_SECRET" );
if ( len( secret ) < 32 ) {
  throw( message = "JWT_SECRET belum di-set atau terlalu pendek" );
}
// Kunci HMAC dari secret (pustaka Java: io.jsonwebtoken / JJWT)
var kunci = createObject( "java", "io.jsonwebtoken.security.Keys" )
  .hmacShaKeyFor( secret.getBytes( "UTF-8" ) );
var sekarang    = createObject( "java", "java.util.Date" ).init();
var kedaluwarsa = createObject( "java", "java.util.Date" )
  .init( javaCast( "long", sekarang.getTime() + 15 * 60 * 1000 ) );   // +15 menit
var token = createObject( "java", "io.jsonwebtoken.Jwts" )
  .builder()
  .subject( toString( user.id ) )
  .claim( "role", user.role )
  .issuedAt( sekarang )
  .expiration( kedaluwarsa )
  .signWith( kunci )
  .compact();`,
      explain: [
        'Secret dibaca dari environment variable <code>JWT_SECRET</code> — kode tetap bisa dibuka publik tanpa membocorkan kunci.',
        '<code>Keys.hmacShaKeyFor()</code> mengubah secret mentah menjadi kunci HMAC siap pakai.',
        '<code>exp</code> dibuat pendek (15 menit) agar jendela penyalahgunaan token sempit.',
        'Contoh memakai JJWT 0.12; alternatifnya gunakan module cfjwt yang API-nya murni CFML.'
      ]
    },
    {
      type: 'example',
      title: 'Memverifikasi token di setiap request',
      lang: 'cfml',
      output: false,
      code: `function verifikasiToken( required string header ) {
  // Format yang benar: "Bearer <token>"
  if ( listFirst( arguments.header, " " ) != "Bearer" ) {
    throw( type = "AuthException", message = "Token tidak disertakan" );
  }
  var raw = listRest( arguments.header );
  try {
    var hasil = createObject( "java", "io.jsonwebtoken.Jwts" )
      .parser()
      .verifyWith( variables.kunciJWT )     // kunci yang sama dengan saat menandatangani
      .build()
      .parseSignedClaims( raw );
    return { userId: hasil.getPayload().getSubject(), role: hasil.getPayload().get( "role" ) };
  } catch ( any e ) {
    // kedaluwarsa, salah secret, atau tanda tangan dipalsukan → tolak
    throw( type = "AuthException", message = "Token tidak valid atau kedaluwarsa" );
  }
}`,
      explain: [
        'Token dibaca dari header <code>Authorization</code> yang dikirim klien pada setiap request.',
        '<code>verifyWith()</code> sekaligus memeriksa tanda tangan, algoritma, dan masa berlaku.',
        'Kegagalan diverifikasi menjadi <code>AuthException</code> — pemanggil tinggal memetakannya ke HTTP 401.',
        'Token valid tapi perannya kurang harus dipetakan ke 403, bukan 401.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>401 vs 403 dan rotasi secret</b> adalah dua hal yang sering tertukar dan berdampak pada perilaku klien:</p><ul><li><b>401 Unauthorized</b> — token tidak ada, kedaluwarsa, atau tidak valid. Klien harus login ulang / menyegarkan token.</li><li><b>403 Forbidden</b> — token valid, tapi peran tidak cukup (misalnya pembeli mengakses <code>/admin/laporan</code>). Klien tidak perlu login ulang.</li></ul><p>Untuk <b>rotasi secret</b>, isi header JWT dengan <code>kid</code> (key id) dan simpan beberapa secret aktif di environment variable. Saat ganti secret, terbitkan token baru dengan kid baru sambil tetap menerima kid lama sampai token lama kedaluwarsa — baru secret lama dicabut. Tidak ada pengguna yang tiba-tiba ter-logout massal.</p>'
    },
    {
      type: 'warn',
      title: 'Payload JWT bukan tempat rahasia',
      text: 'Payload hanya di-encode base64, bukan dienkripsi — siapa pun bisa membacanya dengan dekoder online. Jangan menaruh data sensitif (password, nomor kartu, alamat) di dalam klaim; cukup id pemilik, peran, dan waktu. JWT melindungi <b>integritas</b> (tidak bisa diubah), bukan <b>kerahasiaan</b>.'
    },
    {
      type: 'example',
      title: 'Hash password dengan bcrypt (jangan pernah plaintext)',
      lang: 'cfml',
      output: false,
      code: `// Pustaka jBCrypt (org.mindrot) dipakai lewat createObject Java
var bcrypt = createObject( "java", "org.mindrot.jbcrypt.BCrypt" );
// Saat registrasi: simpan HASH-nya saja, bukan password mentah
var hash = bcrypt.hashpw( form.password, bcrypt.gensalt() );   // gensalt = garam acak
queryExecute( "INSERT INTO pengguna ( email, password_hash ) VALUES ( ?, ? )",
  [ form.email, hash ], { datasource: "appDB" } );
// Saat login: bandingkan password mentah dengan hash tersimpan
var user = penggunaService.cariByEmail( form.email );
if ( isStruct( user ) && bcrypt.checkpw( form.password, user.password_hash ) ) {
  var token = terbitkanToken( user );      // lanjut ke alur JWT di atas
}`,
      explain: [
        '<code>gensalt()</code> menambahkan garam acak, sehingga dua password sama menghasilkan hash berbeda.',
        '<code>checkpw()</code> menghitung ulang hash dari password masuk lalu membandingkannya.',
        'Password mentah tidak pernah disimpan, tidak pernah di-log, dan tidak pernah dikirim balik ke klien.'
      ]
    },
    {
      type: 'tip',
      title: 'httpOnly cookie vs Authorization header',
      text: 'Token di <b>cookie httpOnly</b> otomatis dikirim dan tidak bisa dibaca JavaScript (aman dari XSS), tapi ikut terkirim lintas situs sehingga rawan <b>CSRF</b> — pasangkan dengan SameSite=Lax/Strict. Token di <b>header Authorization</b> tahan CSRF karena dikirim manual, tapi JavaScript harus menyimpannya; jangan simpan di localStorage (rentan dicuri XSS), lebih aman simpan di memori dan segarkan saat aplikasi dimuat ulang.'
    },
    {
      type: 'vocab',
      items: [
        ['JSON', 'Format teks ringkas objek + daftar; standar de facto data REST modern.'],
        ['serializeJson / deserializeJson', 'Konversi dua arah antara data CFML dan teks JSON.'],
        ['XSS', 'Cross-Site Scripting — skrip penyerang menyusup lewat input pengguna yang ditampilkan mentah.'],
        ['encodeForHTML', 'Escape teks menjadi entitas HTML aman sebelum dicetak ke halaman.'],
        ['JWT', 'JSON Web Token — token string header.payload.signature yang ditandatangani server.'],
        ['Klaim (claim)', 'Pasangan key-value di payload JWT, misalnya sub, role, exp, kid.'],
        ['bcrypt', 'Algoritma hash password berat dengan garam acak; tahan brute-force.']
      ]
    }
  ],
  recap: [
    'serializeJson/deserializeJson memetakan struct ↔ objek dan array ↔ daftar; selalu cek isJSON() dan isArray()/isStruct().',
    'Array berlubang bisa keluar sebagai objek, dan objek berkunci angka kembali menjadi struct — jaga array tetap rapat.',
    'Setiap output buatan pengguna melewati encodeForHTML (isi) atau encodeForHTMLAttribute (atribut) untuk mencegah XSS.',
    'XML luar ditangani xmlParse + xmlSearch (XPath); xmlTransform/XSLT mengubahnya menjadi format lain.',
    'JWT = header.payload.signature; secret disimpan di environment variable, password disimpan sebagai hash bcrypt.',
    '401 berarti token tidak sah (login ulang), 403 berarti token sah tapi tidak berhak (tolak akses).'
  ]
});
