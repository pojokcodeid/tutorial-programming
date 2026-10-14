/* ============================================================
   Pelajaran UML — Bab: Diagram Perilaku (Diagram Interaksi)
   (topik info.md:
    - "Sequence Diagram"
    - "Communications Diagram"
    - "Interaction Overview Diagram"
    - "Timing Diagram")

   KONVENSI (ikuti file lain, lihat 01-pendahuluan.js):
   - Setiap pelajaran di-push ke window.UML_LESSONS.
   - Diagram ditulis sebagai SVG inline di dalam <figure class="uml-fig">,
     memakai kelas u-box / u-hd / u-title / u-text / u-lbl / u-line / u-dash
     (CSS-nya di css/style.css sehingga otomatis mengikuti tema).
   - Ujung garis memakai marker global: url(#u-arrow), url(#u-arrow-open),
     url(#u-diamond-fill), url(#u-diamond-open), url(#u-triangle), url(#u-circle).
   Domain contoh berjalan: Sistem Perpustakaan.
   ============================================================ */
'use strict';

window.UML_LESSONS = window.UML_LESSONS || [];

/* ---------- Pelajaran 1: Sequence Diagram ---------- */
window.UML_LESSONS.push({
  id: 'sequence-diagram',
  title: 'Sequence Diagram: Pesan menurut Waktu',
  chapter: 'Diagram Perilaku',
  duration: '15 menit',
  intro: [
    'Saat beberapa objek bekerja sama, yang penting bukan hanya <b>siapa saja</b> yang terlibat, tetapi juga <b>urutan pesan</b> di antara mereka. <b>Sequence diagram</b> menangkap urutan itu secara harfiah: waktu mengalir dari atas ke bawah.',
    'Pelajaran ini membahas anatomi sequence diagram secara lengkap — lifeline, activation bar, aneka jenis pesan, guard, dan fragment alt/opt/loop — lalu mempraktikkannya lewat skenario peminjaman buku di Sistem Perpustakaan.'
  ],
  objectives: [
    'Membaca sequence diagram dari atas ke bawah sebagai garis waktu',
    'Mengenali kotak peserta, lifeline, dan activation bar',
    'Membedakan pesan sinkron, balasan (reply), self-message, create, dan destroy',
    'Memahami guard serta fragment alt, opt, dan loop',
    'Menyusun sequence diagram sederhana untuk satu skenario'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Sequence diagram</b> (diagram urutan) menggambarkan bagaimana objek-objek saling bertukar pesan, <b>diurutkan menurut waktu</b>. Kalau diagram kelas menjawab "siapa punya apa", sequence diagram menjawab "<b>siapa memanggil siapa, dan kapan</b>".</p><p>Aturan bacanya cuma satu, tapi harus dipegang teguh: <b>baca dari atas ke bawah</b>. Pesan yang paling atas terjadi paling awal, pesan yang paling bawah terjadi paling akhir. Sumbu tegak lurus = sumbu waktu.</p>'
    },
    {
      type: 'text',
      html: '<p>Secara visual, satu sequence diagram tersusun atas empat bagian utama: <b>kotak peserta</b> di atas, <b>lifeline</b> (garis putus) yang turun dari tiap kotak, <b>activation bar</b> (kotak tipis) di sepanjang lifeline, dan <b>garis pesan</b> yang melintang antar lifeline:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 310" width="760" role="img" aria-label="Anatomi sequence diagram: kotak objek, lifeline, activation bar, pesan, dan arah waktu">
        <text x="140" y="20" class="u-lbl" text-anchor="middle">kotak objek (nama : Kelas)</text>
        <rect x="60" y="30" width="160" height="44" rx="6" class="u-hd"/>
        <text x="140" y="57" class="u-title">sistem : Sistem</text>
        <rect x="360" y="30" width="160" height="44" rx="6" class="u-hd"/>
        <text x="440" y="57" class="u-title">repo : RepoBuku</text>
        <line x1="140" y1="74" x2="140" y2="272" class="u-dash"/>
        <line x1="440" y1="74" x2="440" y2="272" class="u-dash"/>
        <rect x="134" y="104" width="12" height="112" class="u-box"/>
        <rect x="434" y="140" width="12" height="44" class="u-box"/>
        <line x1="152" y1="140" x2="434" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="293" y="131" class="u-text" text-anchor="middle">1: pinjam(bukuId)</text>
        <line x1="434" y1="176" x2="152" y2="176" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="293" y="167" class="u-text" text-anchor="middle">2: buku : Buku</text>
        <text x="156" y="116" class="u-lbl">activation bar</text>
        <text x="140" y="292" class="u-lbl" text-anchor="middle">lifeline = garis putus, waktu mengalir ke bawah</text>
        <line x1="560" y1="80" x2="560" y2="262" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="578" y="171" class="u-lbl" text-anchor="middle" transform="rotate(90 578 171)">waktu</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 1.1</b> — Anatomi sequence diagram: kotak peserta, lifeline, activation bar, pesan, dan arah waktu</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>Kotak peserta</b> di barisan atas bisa berisi beberapa macam:</p><ul><li><b>Objek anonim</b> — hanya menulis kelasnya saja, misalnya <code>:RepoBuku</code>. Dipakai kalau nama instannya tidak penting.</li><li><b>Objek bernama</b> — <code>repo : RepoBuku</code>, yaitu instan bernama <code>repo</code> dari kelas <code>RepoBuku</code>.</li><li><b>Aktor / pengguna luar</b> — manusia atau sistem lain yang memulai skenario (dalam contoh kita: <code>:Anggota</code>).</li><li><b>Subsistem</b> — bagian besar sistem yang dianggap satu kotak, misalnya <code>:ModulPembayaran</code>.</li></ul><p>Yang penting: setiap peserta yang <b>menerima atau mengirim pesan</b> harus punya lifeline sendiri, supaya garis waktunya jelas.</p>'
    },
    {
      type: 'text',
      html: '<p><b>Lifeline</b> adalah garis putus yang turun dari kotak peserta. Ia menandai keberadaan objek itu <b>sepanjang waktu</b> berjalannya skenario. Sumbu waktu dibaca dari atas (mulai) ke bawah (selesai).</p><p><b>Activation bar</b> (kotak tipis di atas lifeline) menandai objek itu <b>sedang aktif</b> — yaitu sedang mengerjakan permintaan, dari saat pesan masuk sampai ia selesai (atau mengirim balasan). Activation bar yang bertumpuk menunjukkan <b>pemanggilan bersarang</b>: A memanggil B, dan selama B bekerja ia bisa memanggil C.</p>'
    },
    {
      type: 'tip',
      title: 'Cara cepat membaca activation bar',
      text: 'Activation bar <b>dimulai</b> saat objek menerima pesan dan <b>berakhir</b> setelah ia mengirim balasan (atau selesai bekerja). Bar yang panjang berarti objek itu sibuk lama; bar yang bertumpuk berarti ada panggilan bersarang (nested call).'
    },
    {
      type: 'text',
      html: '<p>Pesan adalah "jantung" diagram ini. UML membedakan beberapa jenis pesan lewat <b>bentuk garis</b> dan <b>bentuk panahnya</b>:</p><table class="vocab"><tr><th>Jenis pesan</th><th>Garis</th><th>Panah</th><th>Kapan dipakai</th></tr><tr><td>Pesan sinkron (panggilan)</td><td>Penuh</td><td>Penuh (segitiga rapat)</td><td>Pengirim <b>menunggu</b> jawaban — seperti memanggil fungsi.</td></tr><tr><td>Pesan balasan (reply / return)</td><td>Putus</td><td>Terbuka (huruf V)</td><td>Mengembalikan hasil ke pemanggil; selalu dijawab dari bawah ke atas.</td></tr><tr><td>Pesan asinkron</td><td>Penuh</td><td>Terbuka</td><td>Pengirim <b>tidak menunggu</b> (mis. kirim notifikasi).</td></tr><tr><td>Self-message</td><td>Kotak kecil berbalik</td><td>Penuh</td><td>Objek memanggil metodenya sendiri.</td></tr><tr><td>Pesan create</td><td>Putus + stereotype</td><td>Penuh</td><td>Objek <b>dibuat</b> pada titik waktu itu.</td></tr><tr><td>Pesan destroy</td><td>Putus berujung X</td><td>Tanpa panah</td><td>Objek <b>dihancurkan</b> (pemanggilan free/delete).</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p>Dua aturan yang sering membuat bingung pemula:</p><ol><li><b>Pesan balasan berjalan ke arah berlawanan</b> dari panggilannya. Kalau <code>A → B</code> memakai garis penuh, maka balasannya <code>B --&gt; A</code> memakai garis putus dengan panah terbuka.</li><li><b>Self-message</b> digambar sebagai garis yang keluar dari lifeline, berbelok ke kanan, lalu kembali lagi ke lifeline yang sama — persis seperti "memanggil diri sendiri".</li></ol><p>Sedangkan <b>create</b> dan <b>destroy</b> dipakai kalau umur objeknya terbatas: misalnya objek <code>:Struk</code> dibuat (create) setelah peminjaman dicatat, lalu dihancurkan (destroy, ditandai silang) setelah dicetak. Dengan begitu lifeline-nya memang baru mulai atau berakhir di titik itu.</p>'
    },
    {
      type: 'text',
      html: '<p>Skenario yang tidak selalu terjadi tidak bisa digambar sebagai satu garis lurus. Di sinilah <b>fragment</b> masuk: sebuah <b>kotak frame</b> yang di dalamnya berisi sebagian pesan, lengkap dengan label dan <b>guard</b> (kondisi dalam kurung siku <code>[...]</code>).</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 200" width="760" role="img" aria-label="Notasi fragment alt, opt, dan loop">
        <rect x="20" y="40" width="220" height="116" rx="8" class="u-line"/>
        <rect x="20" y="40" width="52" height="26" class="u-hd"/>
        <text x="46" y="58" class="u-text" text-anchor="middle">[alt]</text>
        <text x="80" y="58" class="u-lbl">pilih satu cabang</text>
        <text x="32" y="80" class="u-lbl">[kondisi] -&gt; aksi utama</text>
        <line x1="30" y1="98" x2="230" y2="98" class="u-line"/>
        <text x="32" y="120" class="u-lbl">[else] -&gt; aksi lain</text>
        <text x="130" y="180" class="u-lbl" text-anchor="middle">alternatif (cabang)</text>

        <rect x="270" y="40" width="220" height="116" rx="8" class="u-line"/>
        <rect x="270" y="40" width="54" height="26" class="u-hd"/>
        <text x="297" y="58" class="u-text" text-anchor="middle">[opt]</text>
        <text x="332" y="58" class="u-lbl">sekali / nol kali</text>
        <text x="282" y="80" class="u-lbl">[kondisi]</text>
        <line x1="280" y1="98" x2="480" y2="98" class="u-line"/>
        <text x="282" y="120" class="u-lbl">aksi dijalankan bila benar</text>
        <text x="380" y="180" class="u-lbl" text-anchor="middle">opsional</text>

        <rect x="520" y="40" width="220" height="116" rx="8" class="u-line"/>
        <rect x="520" y="40" width="54" height="26" class="u-hd"/>
        <text x="547" y="58" class="u-text" text-anchor="middle">[loop]</text>
        <text x="584" y="58" class="u-lbl">berulang</text>
        <text x="522" y="80" class="u-lbl">[i = 1..n]</text>
        <line x1="530" y1="98" x2="730" y2="98" class="u-line"/>
        <text x="522" y="120" class="u-lbl">isi frame diulang</text>
        <text x="630" y="180" class="u-lbl" text-anchor="middle">pengulangan</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 1.2</b> — Notasi fragment: alt (alternatif), opt (opsional), dan loop (pengulangan)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Guard adalah <b>syarat yang harus benar</b> agar isi fragment dijalankan, ditulis di dalam kurung siku, misalnya <code>[buku.tersedia]</code>. Fragment yang paling sering muncul:</p><table class="vocab"><tr><th>Fragment</th><th>Fungsi</th><th>Contoh guard</th></tr><tr><td>alt (alternative)</td><td>Dua atau lebih cabang; hanya SATU yang dijalankan. Cabang terakhir memakai <code>[else]</code>.</td><td><code>[tersedia]</code>, <code>[else]</code></td></tr><tr><td>opt (optional)</td><td>Isi dijalankan sekali <i>atau tidak sama sekali</i>.</td><td><code>[ada diskon]</code></td></tr><tr><td>loop</td><td>Isi frame diulang-ulang sampai syarat berhenti.</td><td><code>[i = 1..n]</code></td></tr><tr><td>par (parallel)</td><td>Beberapa cabang berjalan bersamaan.</td><td><code>[thread 1]</code></td></tr><tr><td>ref</td><td>Interaksi lain dirujuk, tidak digambar ulang.</td><td><code>[ref: Login]</code></td></tr></table>'
    },
    {
      type: 'warn',
      title: 'Kesalahan yang paling sering muncul',
      text: 'Jangan menaruh pesan <b>tanpa urutan yang jelas</b>, jangan lupa balasan untuk panggilan sinkron, dan jangan membuat lifeline terlalu banyak (usahakan maksimal 5–7). Satu diagram sebaiknya menceritakan <b>satu skenario</b>: kalau ada banyak cabang cerita, pecah menjadi beberapa diagram.'
    },
    {
      type: 'text',
      html: '<p>Sekarang kita praktikkan ke skenario peminjaman buku. Alurnya: <b>Anggota</b> meminta peminjaman ke <b>Sistem</b>, Sistem memeriksa status anggota lewat <b>CekAnggota</b>, lalu memproses buku lewat <b>RepoBuku</b> — dengan percabangan alt: buku tersedia atau tidak.</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 800 540" width="800" role="img" aria-label="Sequence diagram peminjaman buku dengan fragment alt">
        <rect x="15" y="16" width="150" height="46" rx="6" class="u-hd"/>
        <text x="90" y="44" class="u-title">:Anggota</text>
        <rect x="195" y="16" width="150" height="46" rx="6" class="u-hd"/>
        <text x="270" y="44" class="u-title">:Sistem</text>
        <rect x="375" y="16" width="150" height="46" rx="6" class="u-hd"/>
        <text x="450" y="44" class="u-title">:CekAnggota</text>
        <rect x="555" y="16" width="150" height="46" rx="6" class="u-hd"/>
        <text x="630" y="44" class="u-title">:RepoBuku</text>

        <line x1="90" y1="62" x2="90" y2="520" class="u-dash"/>
        <line x1="270" y1="62" x2="270" y2="520" class="u-dash"/>
        <line x1="450" y1="62" x2="450" y2="520" class="u-dash"/>
        <line x1="630" y1="62" x2="630" y2="520" class="u-dash"/>

        <rect x="84" y="94" width="12" height="406" class="u-box"/>
        <rect x="264" y="100" width="12" height="400" class="u-box"/>
        <rect x="444" y="150" width="12" height="46" class="u-box"/>
        <rect x="624" y="266" width="12" height="34" class="u-box"/>
        <rect x="624" y="330" width="12" height="30" class="u-box"/>

        <line x1="96" y1="100" x2="264" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="180" y="91" class="u-text" text-anchor="middle">pinjam(bukuId)</text>

        <line x1="276" y1="150" x2="444" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="360" y="141" class="u-text" text-anchor="middle">cekStatus(nim)</text>

        <line x1="444" y1="196" x2="276" y2="196" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="360" y="187" class="u-text" text-anchor="middle">status: OK</text>

        <rect x="30" y="222" width="716" height="234" rx="8" class="u-line"/>
        <rect x="30" y="222" width="56" height="26" class="u-hd"/>
        <text x="58" y="240" class="u-text" text-anchor="middle">[alt]</text>
        <text x="112" y="240" class="u-lbl">[tersedia]</text>

        <line x1="276" y1="266" x2="624" y2="266" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="284" y="258" class="u-text">ambilBuku(bukuId)</text>

        <line x1="624" y1="300" x2="276" y2="300" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="284" y="292" class="u-text">buku : Buku</text>

        <line x1="276" y1="330" x2="624" y2="330" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="284" y="322" class="u-text">catatPeminjaman(buku)</text>

        <line x1="624" y1="360" x2="276" y2="360" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="284" y="352" class="u-text">struk : Peminjaman</text>

        <line x1="30" y1="380" x2="746" y2="380" class="u-line"/>
        <text x="112" y="400" class="u-lbl">[else] tidak tersedia</text>

        <text x="284" y="416" class="u-text">tampilkanError()</text>
        <polyline points="276,424 320,424 320,440 276,440" class="u-line" marker-end="url(#u-arrow)"/>

        <line x1="264" y1="500" x2="96" y2="500" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="180" y="491" class="u-text" text-anchor="middle">return: hasil</text>

        <line x1="772" y1="80" x2="772" y2="506" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="784" y="290" class="u-lbl" text-anchor="middle" transform="rotate(90 784 290)">waktu</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 1.3</b> — Sequence diagram peminjaman buku: pesan sinkron, balasan, self-message, dan fragment alt</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Ikuti diagram di atas dari atas ke bawah, begini urutan kejadiannya:</p><ol><li><code>:Anggota</code> mengirim pesan sinkron <code>pinjam(bukuId)</code> ke <code>:Sistem</code>. Sejak itu activation bar <code>:Sistem</code> mulai (ia bekerja).</li><li><code>:Sistem</code> memanggil <code>cekStatus(nim)</code> ke <code>:CekAnggota</code>.</li><li><code>:CekAnggota</code> membalas <code>status: OK</code> dengan garis putus dan panah terbuka — activation bar-nya selesai di sini.</li><li>Masuk <b>fragment alt</b>. Kalau guard <code>[tersedia]</code> benar: <code>:Sistem</code> memanggil <code>ambilBuku(bukuId)</code>, dibalas <code>buku : Buku</code>, lalu memanggil <code>catatPeminjaman(buku)</code> yang dibalas <code>struk : Peminjaman</code>.</li><li>Kalau guard <code>[else]</code> (buku tidak tersedia): hanya ada <b>self-message</b> <code>tampilkanError()</code> — tidak ada pemanggilan ke RepoBuku sama sekali.</li><li>Setelah fragmen selesai, <code>:Sistem</code> membalas ke <code>:Anggota</code> dengan <code>return: hasil</code>; activation bar keduanya berakhir.</li><li>Garis panah di kanan mengingatkan: arah baca = <b>waktu ke bawah</b>.</li></ol>'
    },
    {
      type: 'tip',
      title: 'Satu diagram, satu cerita',
      text: 'Gambarlah satu <b>skenario utama (happy path)</b> terlebih dahulu, lalu buat diagram terpisah untuk skenario alternatif yang penting (misalnya "anggota menunggak"). Hindari memadukan puluhan cabang dalam satu diagram — diagram justru jadi sulit dibaca.'
    },
    {
      type: 'example',
      title: 'Sequence diagram peminjaman dalam notasi PlantUML',
      lang: 'plantuml',
      code: '@startuml\n' +
        'actor Anggota\n' +
        'participant ":Sistem" as S\n' +
        'participant ":CekAnggota" as C\n' +
        'participant ":RepoBuku" as R\n\n' +
        'Anggota -> S : pinjam(bukuId)\n' +
        'activate S\n' +
        'S -> C : cekStatus(nim)\n' +
        'activate C\n' +
        'C --> S : status: OK\n' +
        'deactivate C\n\n' +
        'alt buku tersedia\n' +
        '  S -> R : ambilBuku(bukuId)\n' +
        '  activate R\n' +
        '  R --> S : buku : Buku\n' +
        '  deactivate R\n' +
        '  S -> R : catatPeminjaman(buku)\n' +
        '  R --> S : struk : Peminjaman\n' +
        'else tidak tersedia\n' +
        '  S -> S : tampilkanError()\n' +
        'end\n\n' +
        'S --> Anggota : return: hasil\n' +
        'deactivate S\n' +
        '@enduml',
      explain: [
        '<code>participant</code> membuat kotak peserta beserta lifeline-nya; <code>as S</code> memberi nama singkat untuk dipakai di baris berikutnya.',
        '<code>-&gt;</code> menghasilkan pesan sinkron (garis penuh + panah penuh), sedangkan <code>--&gt;</code> menghasilkan balasan (garis putus + panah terbuka).',
        '<code>activate</code> / <code>deactivate</code> menggambar activation bar; blok <code>alt ... else ... end</code> menggambar fragment alt lengkap dengan guard.',
        'Cara termudah belajar sequence diagram: tulis potongan PlantUML di atas, lalu render dan cocokkan dengan Gambar 1.3.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Lifeline', 'Garis putus turun dari kotak peserta; sumbu waktu satu objek.'],
        ['Activation bar', 'Kotak tipis di lifeline yang menandai objek sedang aktif memproses permintaan.'],
        ['Pesan sinkron', 'Panggilan berpanah penuh; pengirim menunggu balasan.'],
        ['Reply / return', 'Balasan berupa garis putus + panah terbuka, berjalan ke arah berlawanan dari panggilannya.'],
        ['Guard', 'Syarat tertulis dalam kurung siku, mis. [tersedia], yang menentukan cabang dijalankan.'],
        ['Fragment', 'Kotak frame berisi sebagian pesan; jenisnya alt, opt, loop, par, ref, dst.'],
        ['Self-message', 'Pesan yang dikirim objek kepada dirinya sendiri, digambar sebagai garis berbalik.']
      ]
    },
    {
      type: 'text',
      html: '<p>Menyusun sequence diagram dari nol itu mudah kalau diikuti berurutan:</p><ol><li>Tulis skenario dalam satu kalimat (mis. "Anggota meminjam buku").</li><li>Daftar siapa saja yang terlibat (2–7 peserta), lalu gambar kotak + lifeline-nya.</li><li>Tulis daftar pesan <b>menurut urutan waktu</b> dulu di kertas, baru digambar.</li><li>Tambahkan balasan untuk setiap panggilan sinkron.</li><li>Masukkan fragment hanya bila memang ada percabangan/pengulangan.</li><li>Tandai activation bar, lalu periksa: apakah semua panah masuk akal dan tidak ada pesan yang "melayang" tanpa lifeline pengirim.</li></ol>'
    }
  ],
  recap: [
    'Sequence diagram menggambarkan pesan antar objek <b>menurut urutan waktu</b>; baca selalu dari atas ke bawah.',
    'Anatomi utama: kotak peserta, lifeline (garis putus), activation bar (kotak tipis), dan garis pesan.',
    'Pesan sinkron memakai garis penuh + panah penuh; balasan memakai garis putus + panah terbuka.',
    'Self-message adalah pemanggilan ke diri sendiri; create/destroy menandai kelahiran &amp; kematian objek.',
    'Fragment (alt, opt, loop) membungkus pesan bersyarat; syaratnya ditulis sebagai guard dalam kurung siku.'
  ]
});

/* ---------- Pelajaran 2: Communications Diagram ---------- */
window.UML_LESSONS.push({
  id: 'communications-diagram',
  title: 'Communications Diagram: Pesan menurut Struktur',
  chapter: 'Diagram Perilaku',
  duration: '11 menit',
  intro: [
    '<b>Communications diagram</b> menyampaikan <b>informasi yang sama</b> dengan sequence diagram — objek dan pesan di antara mereka — tetapi menonjolkan hal yang berbeda: bukan urutan waktu, melainkan <b>struktur kolaborasi</b> antar objek.',
    'Pelajaran ini membahas notasi objek, link (garis penghubung), pesan bernomor (1, 1.1, 1.2), serta kapan diagram ini lebih tepat dipakai daripada sequence diagram.'
  ],
  objectives: [
    'Mengenali notasi objek, link, dan pesan bernomor',
    'Memahami aturan penomoran pesan (1, 1.1, 1.2, ...)',
    'Membandingkan sequence diagram dan communications diagram',
    'Memilih diagram yang tepat sesuai kebutuhan cerita'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Communications diagram</b> (dahulu disebut <i>collaboration diagram</i>) menggambarkan objek-objek yang berkolaborasi beserta pesan yang mereka kirim, <b>diurutkan menurut nomor pesan</b>, bukan menurut posisi vertikal.</p><p>Bentuknya menyerupai diagram kelas yang "diaktifkan": ada <b>kotak objek</b>, ada <b>garis asosiasi (link)</b> yang menghubungkan objek yang saling berhubungan, dan di sepanjang garis itulah <b>pesan-pesan bernomor</b> ditulis.</p>'
    },
    {
      type: 'text',
      html: '<p>Perhatikan Gambar 2.1: skenario peminjaman buku yang sama dengan pelajaran sebelumnya, kini digambar sebagai struktur kolaborasi.</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 600 400" width="600" role="img" aria-label="Communications diagram peminjaman buku">
        <rect x="330" y="40" width="170" height="44" rx="6" class="u-hd"/>
        <text x="415" y="68" class="u-title">cek : CekAnggota</text>

        <rect x="30" y="186" width="150" height="44" rx="6" class="u-hd"/>
        <text x="105" y="214" class="u-title">anggota : Anggota</text>

        <rect x="330" y="186" width="170" height="44" rx="6" class="u-hd"/>
        <text x="415" y="214" class="u-title">sistem : Sistem</text>

        <rect x="330" y="320" width="170" height="44" rx="6" class="u-hd"/>
        <text x="415" y="348" class="u-title">repo : RepoBuku</text>

        <line x1="180" y1="200" x2="330" y2="200" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="255" y="191" class="u-text" text-anchor="middle">1: pinjam(bukuId)</text>
        <line x1="330" y1="216" x2="180" y2="216" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="255" y="236" class="u-text" text-anchor="middle">1.6: hasil : String</text>

        <line x1="409" y1="186" x2="409" y2="84" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="400" y="140" class="u-text" text-anchor="end">1.1: cekStatus(nim)</text>
        <line x1="421" y1="84" x2="421" y2="186" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="432" y="140" class="u-text">1.2: status : OK</text>

        <line x1="409" y1="230" x2="409" y2="320" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="389" y="256" class="u-text" text-anchor="end">1.3: ambil(bukuId)</text>
        <line x1="421" y1="320" x2="421" y2="230" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="432" y="278" class="u-text">1.4: buku : Buku</text>
        <line x1="397" y1="230" x2="397" y2="320" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="389" y="300" class="u-text" text-anchor="end">1.5: catat(peminjaman)</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 2.1</b> — Communications diagram skenario peminjaman: objek terhubung link, pesan bernomor di sepanjang garis</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Setiap elemen punya makna tetap:</p><table class="vocab"><tr><th>Elemen</th><th>Makna</th></tr><tr><td>Kotak objek</td><td>Objek yang berkolaborasi, ditulis <code>nama : Kelas</code> (nama instan boleh dihilangkan).</td></tr><tr><td>Garis antar kotak</td><td>Link — hubungan asosiasi yang membuat objek bisa saling mengirim pesan.</td></tr><tr><td>Pesan bernomor</td><td>Urutan eksekusi, ditulis di depan nama pesan: <code>1: pinjam(bukuId)</code>.</td></tr><tr><td>Nomor bertingkat</td><td><code>1.1</code>, <code>1.2</code>, dst. adalah pesan yang terjadi <i>di dalam</i> pesan bernomor <code>1</code>.</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p><b>Aturan penomoran</b> adalah kunci membaca diagram ini. Angkanya dibaca seperti daftar berjenjang (outline):</p><ul><li><code>1</code> adalah pesan <b>tingkat atas</b> — pemicu seluruh kolaborasi (Anggota memanggil Sistem).</li><li><code>1.1</code> adalah pesan pertama yang dikirim <b>di dalam</b> eksekusi pesan <code>1</code>; <code>1.2</code> berikutnya, dan seterusnya.</li><li>Kalau <code>Sistem</code> memanggil <code>RepoBuku</code> yang kemudian memanggil <code>IndexBuku</code>, pesannya menjadi <code>1.3.1</code> — tingkat menunjukkan <b>sarang pemanggilan</b>.</li><li>Nomor yang berbeda di awal (misalnya <code>2:</code>) dipakai untuk skenario/urutan terpisah dalam diagram yang sama.</li></ul><p>Jadi meski tidak ada sumbu waktu, <b>urutan kejadian tetap bisa ditelusuri</b> dari angkanya.</p>'
    },
    {
      type: 'tip',
      title: 'Sama isinya, beda penekanan',
      text: 'Sequence diagram dan communications diagram adalah dua wajah dari <b>interaksi yang sama</b>. Sequence menonjolkan <b>kapan</b> (urutan waktu, activation bar, fragment), communications menonjolkan <b>dengan siapa</b> (siapa terhubung ke siapa, berapa banyak partner kolaborasi).'
    },
    {
      type: 'text',
      html: '<p>Perbandingan singkat agar kamu tidak salah pilih:</p><table class="vocab"><tr><th>Sisi</th><th>Sequence</th><th>Communications</th></tr><tr><td>Penekanan</td><td>Waktu / urutan pesan</td><td>Struktur kolaborasi</td></tr><tr><td>Sumbu baca</td><td>Vertikal, atas ke bawah</td><td>Nomor pesan (1, 1.1, 1.2)</td></tr><tr><td>Lifeline</td><td>Ada (turun ke bawah)</td><td>Tidak ada (kotak saja)</td></tr><tr><td>Activation bar</td><td>Ada</td><td>Tidak ada</td></tr><tr><td>Fragment alt/loop</td><td>Mudah digambar</td><td>Sulit / kurang jelas</td></tr><tr><td>Kekuatan</td><td>Jejak langkah demi langkah</td><td>Peta siapa berkolaborasi dengan siapa</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p><b>Kapan memakai communications diagram?</b></p><ul><li>Saat kamu ingin menunjukkan <b>struktur kerja sama</b> sebuah skenario: objek mana saja yang saling kenal dan saling memanggil.</li><li>Saat <b>urutan waktunya sederhana</b> (sedikit cabang, tanpa loop rumit), sehingga nomor sudah cukup untuk menceritakan alur.</li><li>Saat ingin melihat cepat <b>siapa pusat kolaborasi</b> (objek dengan pesan terbanyak biasanya kandidat kelas "god class").</li><li>Saat materi dokumentasi harus ringkas: satu halaman berisi struktur + urutan sekaligus.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Kapan communications diagram justru tidak cocok',
      text: 'Untuk skenario dengan <b>banyak percabangan, loop, atau pesan bersarang dalam</b>, communications diagram cepat berantakan — garis saling melintang dan nomor bertingkat sulit diikuti. Untuk kasus itu, pilih sequence diagram; kekuatannya justru di sana.'
    },
    {
      type: 'example',
      title: 'Skenario peminjaman dengan nomor pesan yang sama',
      lang: 'javascript',
      code: '// 1: Anggota -> Sistem : pinjam(bukuId)\n' +
        'function pinjam(nim, bukuId) {\n' +
        '  const status = cek.cekStatus(nim);        // 1.1: Sistem -> CekAnggota\n' +
        '  if (status !== "OK") return "ditolak";    // 1.2: CekAnggota -> Sistem\n\n' +
        '  const buku = repo.ambil(bukuId);          // 1.3: Sistem -> RepoBuku\n' +
        '  if (!buku.tersedia) {                     // 1.4: RepoBuku -> Sistem\n' +
        '    return "Buku tidak tersedia";\n' +
        '  }\n\n' +
        '  repo.catat(peminjaman(buku, nim));        // 1.5: Sistem -> RepoBuku\n' +
        '  return "Pinjam berhasil";                 // 1.6: Sistem -> Anggota\n' +
        '}',
      explain: [
        'Komentar di sebelah kanan adalah <b>nomor pesan</b> persis seperti pada Gambar 2.1 — inilah yang membuat kode mudah dicocokkan dengan diagram.',
        'Pesan <code>1.1</code> sampai <code>1.6</code> semuanya terjadi <b>di dalam</b> eksekusi pesan <code>1</code>, sehingga semuanya memakai prefiks <code>1.</code>.',
        'Kalau <code>repo.catat()</code> di dalamnya memanggil objek lain, pesannya akan menjadi <code>1.5.1</code>, <code>1.5.2</code>, dan seterusnya.',
        'Nomor bertingkat membuat communications diagram tetap bisa menceritakan urutan tanpa sumbu waktu.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Menerjemahkan sequence ke communications</b> sangat mudah, karena keduanya mewakili interaksi yang sama:</p><ol><li>Salin semua peserta sequence menjadi kotak objek.</li><li>Hubungkan objek yang pernah saling kirim pesan dengan garis (link).</li><li>Beri nomor pada tiap pesan sesuai urutan waktu pada sequence: pesan pertama = <code>1</code>, lalu <code>1.1</code>, <code>1.2</code>, ...</li><li>Hapus lifeline dan activation bar — di communications diagram semuanya tidak dipakai.</li></ol>'
    },
    {
      type: 'vocab',
      items: [
        ['Communications diagram', 'Diagram interaksi yang menampilkan objek, link, dan pesan bernomor menurut struktur kolaborasi.'],
        ['Link', 'Garis asosiasi antara dua objek yang memungkinkan mereka saling mengirim pesan.'],
        ['Nomor pesan', 'Penanda urutan eksekusi seperti 1, 1.1, 1.2; titik menunjukkan pemanggilan bersarang.'],
        ['Collaboration', 'Istilah lama untuk communications diagram; kolaborasi antar objek untuk satu skenario.'],
        ['Happy path', 'Skenario utama yang berjalan lancar tanpa kegagalan; biasanya yang pertama digambar.']
      ]
    }
  ],
  recap: [
    'Communications diagram menampilkan objek, link, dan pesan bernomor — penekanannya pada <b>struktur</b>, bukan waktu.',
    'Nomor pesan dibaca berjenjang: 1 adalah pemicu, 1.1/1.2 adalah pesan yang terjadi di dalamnya.',
    'Isi informasinya setara dengan sequence diagram; bedanya pada penekanan dan tidak adanya lifeline/activation bar.',
    'Pakai communications diagram untuk skenario sederhana yang ingin menonjolkan kolaborasi; pakai sequence untuk alur rumit berisi cabang dan loop.'
  ]
});

/* ---------- Pelajaran 3: Interaction Overview Diagram ---------- */
window.UML_LESSONS.push({
  id: 'interaction-overview-diagram',
  title: 'Interaction Overview Diagram: Alur Antar Skenario',
  chapter: 'Diagram Perilaku',
  duration: '10 menit',
  intro: [
    'Ketika satu aplikasi punya banyak skenario interaksi, menggambar semuanya dalam satu diagram menjadi mustahil. <b>Interaction overview diagram</b> menyelesaikannya: ia mirip <b>activity diagram</b>, tetapi tiap node-nya adalah <b>satu interaksi</b> (misalnya satu sequence diagram) atau rujukan ke interaksi lain.',
    'Pelajaran ini menjelaskan notasi node interaksi, initial/final, decision, serta cara membaca alur antar skenario lewat contoh Sistem Perpustakaan.'
  ],
  objectives: [
    'Memahami ide dasar interaction overview diagram',
    'Mengenali node interaksi, ref, initial, final, dan decision',
    'Membaca alur antar skenario dari atas-kiri ke bawah-kanan',
    'Menentukan kapan diagram ini layak dipakai'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sequence diagram sangat detail untuk <b>satu</b> skenario. Tetapi aplikasi nyata punya banyak skenario: login, pencarian, peminjaman, pengembalian, denda... Bagaimana kalau kita ingin melihat <b>gambaran besar</b> — bagaimana skenario-skenario itu saling terhubung?</p><p>Jawabannya: <b>interaction overview diagram</b>. Strukturnya seperti activity diagram (alur, percabangan, titik mulai/akhir), tetapi kotak aktivitasnya diganti menjadi <b>node interaksi</b>: satu sequence diagram (atau diagram interaksi lain) yang mewakili satu langkah besar.</p>'
    },
    {
      type: 'text',
      html: '<p>Berikut notasi yang akan kamu temui:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 160" width="760" role="img" aria-label="Notasi interaction overview diagram">
        <circle cx="70" cy="66" r="10" class="u-arw-fill"/>
        <text x="70" y="112" class="u-lbl" text-anchor="middle">initial (mulai)</text>

        <circle cx="200" cy="66" r="14" class="u-box"/>
        <circle cx="200" cy="66" r="7" class="u-arw-fill"/>
        <text x="200" y="112" class="u-lbl" text-anchor="middle">final (selesai)</text>

        <polygon points="305,66 330,44 355,66 330,88" class="u-box"/>
        <text x="330" y="112" class="u-lbl" text-anchor="middle">decision (cabang)</text>

        <rect x="410" y="44" width="100" height="44" rx="6" class="u-box"/>
        <text x="460" y="64" class="u-title">Login</text>
        <text x="460" y="82" class="u-lbl" text-anchor="middle">interaksi</text>
        <text x="460" y="112" class="u-lbl" text-anchor="middle">node interaksi</text>

        <rect x="540" y="44" width="100" height="44" rx="6" class="u-hd"/>
        <text x="590" y="64" class="u-title">ref</text>
        <text x="590" y="82" class="u-lbl" text-anchor="middle">Peminjaman</text>
        <text x="590" y="112" class="u-lbl" text-anchor="middle">rujukan interaksi</text>

        <line x1="665" y1="66" x2="735" y2="66" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="700" y="112" class="u-lbl" text-anchor="middle">alur / transisi</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 3.1</b> — Notasi interaction overview: initial, final, decision, node interaksi, dan ref</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Dua istilah yang perlu dijelaskan lebih lanjut:</p><ul><li><b>Node interaksi</b> — kotak yang mewakili satu interaksi utuh. Di dalamnya bisa ditulis nama skenario (mis. <code>Login</code>), atau bahkan <b>fragmen sequence diagram mini</b> bila memang perlu. Intinya: kotak itu adalah "pintu" ke satu diagram lain.</li><li><b>Ref (reference)</b> — node bertanda <code>ref</code> yang merujuk ke interaksi bernama; pembaca tinggal buka diagram tersebut untuk detailnya. Ini membuat overview tetap ringkas.</li></ul><p>Sisanya identik dengan activity diagram: <b>initial</b> (titik hitam = mulai), <b>final</b> (lingkaran berisi titik = selesai), <b>decision</b> (wajik = percabangan dengan guard), serta garis panah sebagai alurnya.</p>'
    },
    {
      type: 'text',
      html: '<p>Sekarang lihat contohnya. Skenario Sistem Perpustakaan dipecah menjadi tiga interaksi utama: <b>Login</b>, <b>Pencarian</b>, dan <b>Peminjaman</b> — masing-masing adalah satu sequence diagram tersendiri:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 440 510" width="440" role="img" aria-label="Interaction overview: alur login, pencarian, dan peminjaman">
        <circle cx="140" cy="34" r="9" class="u-arw-fill"/>
        <line x1="140" y1="43" x2="140" y2="66" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="60" y="70" width="160" height="48" rx="6" class="u-hd"/>
        <text x="140" y="90" class="u-title">Login</text>
        <text x="140" y="108" class="u-lbl" text-anchor="middle">ref ke sequence</text>

        <line x1="140" y1="118" x2="140" y2="143" class="u-line" marker-end="url(#u-arrow)"/>

        <polygon points="105,170 140,143 175,170 140,197" class="u-box"/>
        <text x="140" y="174" class="u-lbl" text-anchor="middle">OK?</text>

        <line x1="140" y1="197" x2="140" y2="230" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="152" y="217" class="u-lbl">ya</text>

        <polyline points="175,170 270,170 270,94 222,94" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="187" y="162" class="u-lbl">tidak</text>

        <rect x="60" y="230" width="160" height="48" rx="6" class="u-hd"/>
        <text x="140" y="250" class="u-title">Pencarian Buku</text>
        <text x="140" y="268" class="u-lbl" text-anchor="middle">ref ke sequence</text>

        <line x1="140" y1="278" x2="140" y2="303" class="u-line" marker-end="url(#u-arrow)"/>

        <polygon points="105,330 140,303 175,330 140,357" class="u-box"/>
        <text x="140" y="334" class="u-lbl" text-anchor="middle">ditemukan?</text>

        <line x1="140" y1="357" x2="140" y2="390" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="152" y="377" class="u-lbl">ya</text>

        <polyline points="175,330 360,330 360,254 222,254" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="187" y="322" class="u-lbl">tidak</text>

        <rect x="60" y="390" width="160" height="48" rx="6" class="u-hd"/>
        <text x="140" y="410" class="u-title">Peminjaman Buku</text>
        <text x="140" y="428" class="u-lbl" text-anchor="middle">ref ke sequence</text>

        <line x1="140" y1="438" x2="140" y2="456" class="u-line" marker-end="url(#u-arrow)"/>
        <circle cx="140" cy="470" r="14" class="u-box"/>
        <circle cx="140" cy="470" r="7" class="u-arw-fill"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 3.2</b> — Interaction overview Sistem Perpustakaan: alur Login → Pencarian → Peminjaman</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Cara membacanya sama seperti activity diagram:</p><ol><li>Mulai dari <b>titik hitam</b> (initial), lalu ikuti panah ke kotak <b>Login</b> — satu sequence diagram untuk proses masuk.</li><li>Mencapai <b>decision</b> <code>OK?</code>: bila <code>[ya]</code> lanjut ke <b>Pencarian Buku</b>; bila <code>[tidak]</code> alur berputar kembali ke <b>Login</b> (percobaan login ulang).</li><li>Setelah pencarian, decision <code>ditemukan?</code>: <code>[ya]</code> → lanjut ke <b>Peminjaman Buku</b>; <code>[tidak]</code> → kembali ke <b>Pencarian Buku</b> (pengguna mencari kata kunci lain).</li><li>Setelah peminjaman selesai, alur menuju <b>final</b> (lingkaran berisi titik).</li></ol><p>Perhatikan: tiap kotak berisi <b>satu skenario lengkap</b>. Kalau dibuka, di dalamnya ada sequence diagram sendiri-sendiri — itulah gunanya tulisan <code>ref ke sequence</code>.</p>'
    },
    {
      type: 'tip',
      title: 'Kapan memakai interaction overview diagram?',
      text: 'Pakai saat kamu butuh <b>peta besar</b>: banyak skenario interaksi yang harus ditunjukkan hubungannya dalam satu halaman. Ini cocok untuk dokumentasi arsitektur, penjelasan ke tim, atau <b>peta navigasi</b> sebelum pembaca memilih sequence diagram mana yang ingin dibuka.'
    },
    {
      type: 'warn',
      title: 'Jangan mendetailkan isi node di sini',
      text: 'Interaction overview bukan tempat menggambar pesan antar objek — itu tugas sequence diagram. Jika satu kotak berisi puluhan pesan, kamu sebenarnya sedang membuat sequence diagram; pecahlah: overview untuk alurnya, sequence untuk detailnya.'
    },
    {
      type: 'text',
      html: '<p>Ringkasnya, hierarki diagram interaksi bekerja seperti buku:</p><table class="vocab"><tr><th>Tingkat</th><th>Diagram</th><th>Yang ditampilkan</th></tr><tr><td>Peta besar</td><td>Interaction overview</td><td>Alur antar skenario (bab-bab)</td></tr><tr><td>Satu skenario</td><td>Sequence / Communications</td><td>Pesan antar objek (isi bab)</td></tr><tr><td>Satu objek</td><td>Timing / State machine</td><td>Perubahan status objek itu (halaman detail)</td></tr></table>'
    },
    {
      type: 'vocab',
      items: [
        ['Interaction overview', 'Diagram perilaku berbentuk activity diagram yang node-nya adalah interaksi (sequence dsb.) atau rujukan interaksi.'],
        ['Node interaksi', 'Kotak yang mewakili satu interaksi utuh; dapat memuat fragmen sequence mini atau nama skenario.'],
        ['Ref (reference)', 'Node yang merujuk ke interaksi bernama lain, agar diagram overview tetap ringkas.'],
        ['Initial / Final', 'Titik hitam = mulai alur; lingkaran berisi titik = akhir alur.'],
        ['Decision', 'Wajik percabangan dengan guard dalam kurung siku, mis. [ya] dan [tidak].']
      ]
    }
  ],
  recap: [
    'Interaction overview diagram mirip activity diagram, tetapi tiap node-nya adalah satu interaksi (mis. sequence diagram).',
    'Notasinya: initial, final, decision, node interaksi, dan ref — lengkap dengan panah alur.',
    'Contoh Sistem Perpustakaan: Login → decision → Pencarian → decision → Peminjaman → final.',
    'Pakai saat butuh gambaran besar banyak skenario; detail pesan tetap diserahkan ke sequence diagram.'
  ]
});

/* ---------- Pelajaran 4: Timing Diagram ---------- */
window.UML_LESSONS.push({
  id: 'timing-diagram',
  title: 'Timing Diagram: Status vs Waktu',
  chapter: 'Diagram Perilaku',
  duration: '10 menit',
  intro: [
    'Sequence diagram menunjukkan <i>kapan pesan dikirim</i>; <b>timing diagram</b> menunjukkan <i>kapan sebuah objek berstatus apa</i>. Diagram ini memplot <b>status objek terhadap waktu</b> — sangat tepat untuk sistem yang punya <b>batas waktu</b>, protokol komunikasi, atau perilaku real-time.',
    'Pelajaran ini membahas sumbu waktu, state segment, constraint durasi (mis. <code>{durasi ≤ 2 hari}</code>), dan contoh perubahan status Buku serta Peminjaman di Sistem Perpustakaan.'
  ],
  objectives: [
    'Memahami ide dasar timing diagram (status vs waktu)',
    'Membaca lifeline/lane, state segment, dan scale waktu',
    'Memahami constraint durasi dan titik perubahan status',
    'Menentukan kapan timing diagram lebih tepat daripada diagram lain'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Timing diagram</b> adalah diagram interaksi yang menampilkan <b>state (status) sebuah objek sebagai blok-blok mendatar</b> yang membentang di sepanjang <b>sumbu waktu horizontal</b>. Ketika status berubah, blok itu berganti pada titik waktu tertentu.</p><p>Bayangkan grafik Gantt yang sangat sederhana: satu lajur (lane) untuk tiap objek, kolom kiri berisi nama objek, dan ke arah kanan kita melihat statusnya berganti-ganti seiring waktu berjalan.</p>'
    },
    {
      type: 'text',
      html: '<p>Empat komponen yang perlu kamu kenali:</p><ul><li><b>Sumbu waktu (scale)</b> — sumbu horizontal di bawah dengan satuan yang jelas (detik, jam, hari).</li><li><b>Lane / lifeline objek</b> — satu baris mendatar untuk tiap objek yang statusnya dipantau.</li><li><b>State segment</b> — blok mendatar berisi nama status; batas antar blok = <b>titik perubahan status</b>.</li><li><b>Constraint</b> — batasan dalam kurung kurawal, mis. <code>{durasi ≤ 2 hari}</code>, yang menandai syarat waktu yang harus dipenuhi.</li></ul>'
    },
    {
      type: 'text',
      html: '<p>Berikut contoh lengkapnya: status sebuah buku dan peminjamannya selama tiga hari.</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 780 380" width="780" role="img" aria-label="Timing diagram status buku dan peminjaman terhadap waktu">
        <text x="14" y="114" class="u-text">buku : Buku</text>
        <text x="14" y="210" class="u-text">peminjaman</text>
        <text x="14" y="228" class="u-text">: Peminjaman</text>

        <line x1="10" y1="76" x2="750" y2="76" class="u-line"/>
        <line x1="10" y1="184" x2="750" y2="184" class="u-line"/>

        <line x1="310" y1="62" x2="310" y2="320" class="u-dash"/>
        <line x1="610" y1="76" x2="610" y2="320" class="u-dash"/>
        <line x1="710" y1="62" x2="710" y2="320" class="u-dash"/>

        <rect x="110" y="88" width="200" height="44" class="u-box"/>
        <text x="210" y="115" class="u-title">Tersedia</text>
        <rect x="310" y="88" width="300" height="44" class="u-box" style="fill:var(--green-soft);stroke:var(--green)"/>
        <text x="460" y="115" class="u-title">Dipinjam</text>
        <rect x="610" y="88" width="135" height="44" class="u-box"/>
        <text x="677" y="115" class="u-title">Tersedia</text>

        <line x1="112" y1="222" x2="308" y2="222" class="u-dash"/>
        <text x="210" y="214" class="u-lbl" text-anchor="middle">objek belum dibuat</text>
        <rect x="310" y="196" width="300" height="44" class="u-hd"/>
        <text x="460" y="223" class="u-title">Aktif (berjalan)</text>
        <rect x="610" y="196" width="135" height="44" class="u-box"/>
        <text x="677" y="223" class="u-title">Selesai</text>

        <line x1="310" y1="56" x2="710" y2="56" class="u-line"/>
        <line x1="310" y1="50" x2="310" y2="62" class="u-line"/>
        <line x1="710" y1="50" x2="710" y2="62" class="u-line"/>
        <text x="510" y="42" class="u-text" text-anchor="middle">{durasi ≤ 2 hari}</text>

        <line x1="110" y1="320" x2="750" y2="320" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="110" y1="314" x2="110" y2="326" class="u-line"/>
        <line x1="310" y1="314" x2="310" y2="326" class="u-line"/>
        <line x1="510" y1="314" x2="510" y2="326" class="u-line"/>
        <line x1="710" y1="314" x2="710" y2="326" class="u-line"/>
        <text x="110" y="346" class="u-lbl" text-anchor="middle">0</text>
        <text x="310" y="346" class="u-lbl" text-anchor="middle">1 hari</text>
        <text x="510" y="346" class="u-lbl" text-anchor="middle">2 hari</text>
        <text x="710" y="346" class="u-lbl" text-anchor="middle">3 hari</text>

        <text x="310" y="368" class="u-text" text-anchor="middle">dipinjam</text>
        <text x="610" y="368" class="u-text" text-anchor="middle">dikembalikan</text>
        <text x="710" y="368" class="u-text" text-anchor="middle">jatuh tempo</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 4.1</b> — Timing diagram: status buku dan peminjaman terhadap waktu, lengkap dengan constraint durasi</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Cara membaca Gambar 4.1, dari kiri ke kanan:</p><ol><li>Sumbu bawah adalah <b>waktu</b>, dengan skala 0, 1 hari, 2 hari, dan 3 hari.</li><li>Pada <b>t = 0</b>, buku berstatus <code>Tersedia</code>, sedangkan objek <code>:Peminjaman</code> belum ada (digambar garis putus berlabel "objek belum dibuat").</li><li>Pada <b>hari ke-1</b> (garis penanda putus pertama) terjadi peristiwa <i>dipinjam</i>: buku berpindah status menjadi <code>Dipinjam</code>, dan objek <code>:Peminjaman</code> dibuat dengan status <code>Aktif (berjalan)</code>.</li><li>Di atas diagram terdapat <b>constraint</b> <code>{durasi ≤ 2 hari}</code> yang membentang dari hari ke-1 sampai hari ke-3 — itulah <b>batas waktu pinjam</b>.</li><li>Pada <b>hari ke-2,5</b> terjadi <i>dikembalikan</i>: buku kembali <code>Tersedia</code> dan peminjaman menjadi <code>Selesai</code>. Karena sebelum jatuh tempo, tidak ada denda.</li><li><b>Jatuh tempo</b> pada hari ke-3 hanya penanda batas; kalau status masih <code>Dipinjam</code> melewati garis itu, aturan terlanggar.</li></ol>'
    },
    {
      type: 'text',
      html: '<p>Notasi ringkasnya:</p><table class="vocab"><tr><th>Elemen</th><th>Simbol / cara tulis</th><th>Fungsi</th></tr><tr><td>Lane objek</td><td>Nama objek di kolom kiri, satu baris mendatar</td><td>Objek yang statusnya dipantau.</td></tr><tr><td>State segment</td><td>Blok mendatar berisi nama status</td><td>Status objek selama rentang waktu tertentu.</td></tr><tr><td>Titik perubahan</td><td>Garis batas antar blok (+ garis putus penanda peristiwa)</td><td>Momen status berubah.</td></tr><tr><td>Scale waktu</td><td>Sumbu horizontal berlabel satuan</td><td>Menentukan kapan sesuatu terjadi.</td></tr><tr><td>Constraint</td><td>Kurung kurawal, mis. <code>{durasi ≤ 2 hari}</code></td><td>Batasan durasi yang harus dipenuhi.</td></tr><tr><td>Garis kejadian</td><td>Garis putus vertikal</td><td>Menghubungkan peristiwa dengan sumbu waktu.</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Kapan memakai timing diagram?',
      text: 'Pakai untuk sistem <b>real-time</b>, <b>protokol komunikasi</b>, atau kasus yang menyangkut <b>batas waktu</b>: SLA respons server, jadwal sensor, tenggat pinjam/mohon, animasi antarmuka, atau aturan "harus merespons dalam 500 ms". Singkatnya: kalau pertanyaannya "<b>berapa lama</b>" dan "<b>kapan persisnya</b>", timing diagram jawabannya.'
    },
    {
      type: 'warn',
      title: 'Timing diagram bukan pengganti sequence diagram',
      text: 'Timing diagram <b>tidak menunjukkan siapa memanggil siapa</b> — ia hanya status vs waktu. Untuk melihat pesan antar objek, tetap pakai sequence diagram. Dalam UML, keempat diagram interaksi saling melengkapi, bukan bersaing.'
    },
    {
      type: 'text',
      html: '<p>Agar timing diagram mudah dipahami pembaca lain, ikuti empat kebiasaan baik ini:</p><ol><li>Gunakan <b>satuan waktu yang konsisten</b> pada sumbu (semua jam, atau semua hari).</li><li>Tulis status dengan <b>kata yang singkat dan selalu sama</b> untuk objek sejenis (jangan "Dipinjam" di satu tempat dan "Sedang Dipinjam" di tempat lain).</li><li>Tandai setiap <b>peristiwa penting</b> dengan garis putus vertikal, seperti "dipinjam" dan "dikembalikan".</li><li>Tulis constraint apa adanya, mis. <code>{durasi ≤ 2 hari}</code>, supaya aturan bisnisnya ikut terdokumentasi.</li></ol>'
    },
    {
      type: 'vocab',
      items: [
        ['Timing diagram', 'Diagram interaksi yang memplot state objek terhadap sumbu waktu horizontal.'],
        ['Lane', 'Satu baris mendatar untuk satu objek yang statusnya dipantau.'],
        ['State segment', 'Blok mendatar berisi nama status objek selama rentang waktu tertentu.'],
        ['Constraint', 'Batasan waktu dalam kurung kurawal, mis. {durasi ≤ 2 hari}.'],
        ['Scale', 'Skala waktu pada sumbu horizontal (detik, jam, hari).'],
        ['Peristiwa (event)', 'Momen yang menyebabkan perubahan status, ditandai garis putus vertikal.']
      ]
    }
  ],
  recap: [
    'Timing diagram menampilkan <b>status objek vs waktu</b>: lajur per objek, sumbu horizontal = waktu.',
    'State segment adalah blok mendatar berisi status; batas antar blok adalah titik perubahan status.',
    'Constraint seperti {durasi ≤ 2 hari} menuliskan batas waktu langsung di dalam diagram.',
    'Contoh Sistem Perpustakaan: Buku Tersedia → Dipinjam (hari 1) → Tersedia lagi (hari 2,5), dengan jatuh tempo hari ke-3.',
    'Pakai untuk sistem real-time, protokol, dan batas waktu; untuk pesan antar objek tetap pakai sequence diagram.'
  ]
});
