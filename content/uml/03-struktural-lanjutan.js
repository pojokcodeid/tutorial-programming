/* ============================================================
   Pelajaran UML — Bab 2 (lanjutan): Diagram Struktural
   (topik info.md:
    - "Component Diagram"
    - "Deployment Diagram"
    - "Composite Structure Diagram"
    - "Profile Diagram")
   ============================================================ */
'use strict';

window.UML_LESSONS = window.UML_LESSONS || [];

/* ---------- Component Diagram ---------- */
window.UML_LESSONS.push({
  id: 'component-diagram',
  title: 'Component Diagram: Arsitektur Komponen',
  chapter: 'Diagram Struktural',
  duration: '12 menit',
  intro: [
    'Setelah kelas, level berikutnya adalah <b>komponen</b>: modul besar yang bisa dipasang ulang dan punya <b>antarmuka</b> sendiri. <b>Component Diagram</b> memetakan bagaimana komponen-komponen itu saling terhubung.',
    'Ini bahasa "arsitektur" — bagaimana sistem dipecah menjadi potongan yang bekerja sama lewat antarmuka.'
  ],
  objectives: [
    'Memahami notasi komponen dan antarmuka (provided/required)',
    'Membedakan assembly connector dan dependency',
    'Menggambar arsitektur komponen sebuah sistem'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Komponen</b> adalah bagian sistem yang bisa di-deploy secara mandiri (mis. modul, layanan, pustaka). Notasinya kotak dengan <b>tab</b> di sisi kiri (ikon "dua kotak kecil"). Setiap komponen punya antarmuka:</p><ul><li><b>Provided interface</b> (ball / lingkaran) — layanan yang DITAWARKAN komponen ke luar.</li><li><b>Required interface</b> (socket / setengah lingkaran) — layanan yang DIBUTUHKAN komponen dari pihak lain.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Component diagram arsitektur">
        <!-- komponen 1 -->
        <rect x="40" y="100" width="160" height="90" rx="4" class="u-box"/>
        <rect x="40" y="100" width="20" height="16" class="u-hd"/><rect x="40" y="130" width="20" height="16" class="u-hd"/>
        <text x="130" y="150" class="u-title" font-size="12">Antarmuka Web</text>
        <!-- komponen 2 -->
        <rect x="300" y="100" width="170" height="90" rx="4" class="u-box"/>
        <rect x="300" y="100" width="20" height="16" class="u-hd"/><rect x="300" y="130" width="20" height="16" class="u-hd"/>
        <text x="395" y="150" class="u-title" font-size="12">Layanan Peminjaman</text>
        <!-- komponen 3 -->
        <rect x="560" y="100" width="160" height="90" rx="4" class="u-box"/>
        <rect x="560" y="100" width="20" height="16" class="u-hd"/><rect x="560" y="130" width="20" height="16" class="u-hd"/>
        <text x="650" y="150" class="u-title" font-size="12">Repositori Buku</text>
        <!-- provided interface (ball) di web -->
        <circle cx="215" cy="120" r="12" class="u-box"/><text x="215" y="124" class="u-lbl" text-anchor="middle">o</text>
        <line x1="200" y1="120" x2="203" y2="120" class="u-line"/>
        <!-- socket di layanan -->
        <path d="M292 108 a12 12 0 0 0 0 24 z" class="u-box"/>
        <line x1="290" y1="120" x2="300" y2="120" class="u-line"/>
        <!-- assembly -->
        <line x1="215" y1="120" x2="288" y2="120" class="u-line"/>
        <text x="252" y="108" class="u-lbl" text-anchor="middle">«assembly»</text>
        <!-- required interface di layanan kanan -->
        <path d="M482 108 a12 12 0 0 1 0 24 z" class="u-box"/>
        <line x1="470" y1="120" x2="480" y2="120" class="u-line"/>
        <circle cx="548" cy="120" r="12" class="u-box"/><text x="548" y="124" class="u-lbl" text-anchor="middle">o</text>
        <line x1="494" y1="120" x2="536" y2="120" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 8.1</b> — Component Diagram: komponen terhubung via provided (ball) &amp; required (socket) interface</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>Assembly connector</b> menyambung provided interface ke required interface yang cocok (mis. Layanan menyediakan API yang dibutuhkan Antarmuka Web). Bila ketergantungannya satu arah dan lebih longgar, dipakai <b>dependency</b> (garis putus-panah).</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Komponen', 'Modul yang bisa di-deploy mandiri; notasi kotak + tab.'],
        ['Provided interface (ball)', 'Layanan yang ditawarkan komponen kepada pihak lain.'],
        ['Required interface (socket)', 'Layanan yang dibutuhkan komponen dari luar.'],
        ['Assembly connector', 'Penghubung provided ↔ required yang cocok.'],
        ['Dependency', 'Ketergantungan satu arah (garis putus-panah).']
      ]
    },
    {
      type: 'tip',
      title: 'Kapan dipakai?',
      text: 'Saat sistem mulai besar dan perlu dipecah jadi modul/layanan yang dikelola tim berbeda, component diagram membantu melihat <b>batas dan ketergantungan</b> antar bagian — dasar arsitektur yang rapi.'
    }
  ],
  recap: [
    'Component Diagram memetakan modul (komponen) beserta antarmuka dan ketergantungannya.',
    'Provided interface = ball (ditawarkan); required interface = socket (dibutuhkan).',
    'Assembly connector menyambung interface yang cocok; dependency = ketergantungan satu arah.'
  ]
});

/* ---------- Deployment Diagram ---------- */
window.UML_LESSONS.push({
  id: 'deployment-diagram',
  title: 'Deployment Diagram: Peta Infrastruktur',
  chapter: 'Diagram Struktural',
  duration: '12 menit',
  intro: [
    'Komponen harus <b>berjalan di sesuatu yang nyata</b>: server, browser, database, perangkat. <b>Deployment Diagram</b> memetakan penempatan artefak (hasil build) di atas <b>node</b> fisik.',
    'Ini diagram "hardware" — bagaimana software ditempatkan di infrastruktur.'
  ],
  objectives: [
    'Memahami node, artefak, dan communication path',
    'Mengenali stereotype «device» dan «execution environment»',
    'Menggambar deployment sederhana sebuah sistem web'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Dua elemen utama:</p><ul><li><b>Node</b> — sumber daya komputasi fisik/virtual (server, PC, HP). Digambar kotak bersudut 3D (paralelogram). Beri stereotype «device» (perangkat keras) atau «execution environment» (perangkat lunak tempat berjalan, mis. DB server).</li><li><b>Artifact</b> — hasil build yang dideploy (file .war, .jar, skrip). Digambar dokumen dengan lipatan sudut.</li></ul><p><b>Communication path</b> (garis) menunjukkan node saling terhubung (jaringan).</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 780 300" width="780" role="img" aria-label="Deployment diagram web app">
        <!-- client -->
        <path d="M30 90 l20 -18 h150 l-20 18 z" class="u-box"/>
        <rect x="30" y="90" width="150" height="100" class="u-box"/>
        <path d="M30 190 l20 -18 h150 l-20 18 z" class="u-box" opacity="0"/>
        <text x="105" y="125" class="u-title" font-size="11">«device»</text>
        <text x="105" y="145" class="u-title" font-size="12">Browser</text>
        <path d="M70 158 h14 v16 h-14 z" class="u-hd"/><text x="120" y="170" class="u-text" font-size="10">index.html</text>
        <!-- web server -->
        <path d="M270 70 l20 -18 h160 l-20 18 z" class="u-box"/>
        <rect x="270" y="70" width="160" height="110" class="u-box"/>
        <text x="350" y="105" class="u-title" font-size="11">«device»</text>
        <text x="350" y="125" class="u-title" font-size="12">Web Server</text>
        <path d="M300 140 h16 v18 h-16 z" class="u-hd"/><text x="350" y="155" class="u-text" font-size="10">app.war</text>
        <!-- db server -->
        <path d="M550 70 l20 -18 h160 l-20 18 z" class="u-box"/>
        <rect x="550" y="70" width="160" height="110" class="u-box"/>
        <text x="630" y="105" class="u-title" font-size="11">«execution env»</text>
        <text x="630" y="125" class="u-title" font-size="12">DB Server</text>
        <path d="M580 140 h16 v18 h-16 z" class="u-hd"/><text x="630" y="155" class="u-text" font-size="10">perpus.db</text>
        <!-- paths -->
        <line x1="180" y1="140" x2="270" y2="125" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="430" y1="125" x2="550" y2="125" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="300" y="115" class="u-lbl">HTTP</text>
        <text x="470" y="115" class="u-lbl">TCP/IP</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 9.1</b> — Deployment Diagram: browser → web server → DB server dengan artefak di tiap node</figcaption></figure>`
    },
    {
      type: 'vocab',
      items: [
        ['Node', 'Sumber daya komputasi (server, perangkat); kotak bersudut 3D.'],
        ['«device»', 'Perangkat keras nyata (browser, PC, smartphone, server).'],
        ['«execution environment»', 'Lingkungan tempat software berjalan (OS, DB server, app server).'],
        ['Artifact', 'Hasil build yang dideploy (app.war, .jar, skrip); dokumen bersudut lipat.'],
        ['Communication path', 'Garis penghubung antar node (jaringan).']
      ]
    },
    {
      type: 'warn',
      title: 'Bukan diagram jaringan biasa',
      text: 'Deployment diagram fokus pada <b>di mana software ditempatkan dan berjalan</b>, bukan sekadar topologi jaringan. Menampilkan node, artefak, dan teknologi eksekusi — bukan hanya IP dan kabel.'
    }
  ],
  recap: [
    'Deployment Diagram memetakan artefak (software hasil build) di atas node fisik.',
    'Node = kotak 3D; beri stereotype «device» atau «execution environment».',
    'Artifact = dokumen bersudut lipat (app.war, dsb); communication path = garis jaringan antar node.'
  ]
});

/* ---------- Composite Structure Diagram ---------- */
window.UML_LESSONS.push({
  id: 'composite-structure-diagram',
  title: 'Composite Structure Diagram: Struktur Internal',
  chapter: 'Diagram Struktural',
  duration: '10 menit',
  intro: [
    'Class diagram menunjukkan kelas dari <b>luar</b>. <b>Composite Structure Diagram</b> membuka kelas/komponen itu dan menunjukkan <b>struktur internalnya</b>: bagian-bagian (part), port, dan bagaimana bagian itu saling terhubung.',
    'Cocok untuk kelas atau komponen yang rumit dan berisi banyak bagian di dalamnya.'
  ],
  objectives: [
    'Memahami konsep part, role, dan port',
    'Membedakan composite structure dari class diagram biasa',
    'Menggambar struktur internal sebuah komponen'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tiga elemen kunci:</p><ul><li><b>Part</b> — bagian di dalam struktur, diberi <b>peran (role)</b> dan tipe kelasnya. Notasi: <code>peran : TipeKelas</code>.</li><li><b>Port</b> — titik interaksi di tepi struktur (kotak kecil) tempat bagian luar terhubung.</li><li><b>Connector</b> — penghubung antar port / antar part di dalam struktur.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 700 320" width="700" role="img" aria-label="Composite structure internal">
        <!-- boundary kelas -->
        <rect x="120" y="40" width="440" height="230" rx="8" class="u-box"/>
        <text x="340" y="68" class="u-title" font-size="13">«class» Mesin Peminjaman</text>
        <line x1="120" y1="82" x2="560" y2="82" class="u-line"/>
        <!-- port kiri -->
        <rect x="110" y="140" width="20" height="24" class="u-hd"/>
        <text x="150" y="130" class="u-lbl">port «peminjam»</text>
        <!-- port kanan -->
        <rect x="550" y="140" width="20" height="24" class="u-hd"/>
        <text x="520" y="130" class="u-lbl" text-anchor="end">port «katalog»</text>
        <!-- parts -->
        <rect x="180" y="110" width="150" height="60" rx="6" class="u-box"/>
        <text x="255" y="135" class="u-text" font-size="11">logika : AturanPinjam</text>
        <text x="255" y="155" class="u-lbl" text-anchor="middle">(part)</text>
        <rect x="380" y="110" width="150" height="60" rx="6" class="u-box"/>
        <text x="455" y="135" class="u-text" font-size="11">penyimpanan : RepoBuku</text>
        <text x="455" y="155" class="u-lbl" text-anchor="middle">(part)</text>
        <!-- connector internal -->
        <line x1="330" y1="140" x2="380" y2="140" class="u-line"/>
        <line x1="130" y1="152" x2="180" y2="152" class="u-line"/>
        <line x1="530" y1="152" x2="550" y2="152" class="u-line"/>
        <text x="340" y="250" class="u-lbl" text-anchor="middle">part (bagian) + port (titik interaksi) + connector</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 10.1</b> — Composite Structure: membuka isi kelas menjadi part, port, dan connector</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Kapan dipakai?',
      text: 'Saat satu kelas/komponen ternyata <b>memiliki struktur internal yang kompleks</b> dan perlu dijelaskan bagian-bagiannya (mis. mesin dengan modul logika, penyimpanan, dan antarmuka). Untuk kelas sederhana, class diagram biasa sudah cukup.'
    },
    {
      type: 'vocab',
      items: [
        ['Part', 'Bagian di dalam struktur; notasi peran : TipeKelas.'],
        ['Role (peran)', 'Nama fungsional sebuah part dalam struktur.'],
        ['Port', 'Titik interaksi di tepi struktur (kotak kecil).'],
        ['Connector', 'Penghubung antar port atau antar part.']
      ]
    }
  ],
  recap: [
    'Composite Structure Diagram menampilkan isi internal kelas/komponen: part, port, connector.',
    'Part ditulis peran : TipeKelas; port adalah titik interaksi di tepi.',
    'Dipakai untuk struktur internal yang kompleks; kelas sederhana cukup class diagram.'
  ]
});

/* ---------- Profile Diagram ---------- */
window.UML_LESSONS.push({
  id: 'profile-diagram',
  title: 'Profile Diagram: Memperluas UML',
  chapter: 'Diagram Struktural',
  duration: '10 menit',
  intro: [
    'UML bersifat umum. Untuk domain khusus (mis. perpustakaan, kesehatan, e-commerce) kita sering butuh <b>istilah tambahan</b>. <b>Profile Diagram</b> memungkinkanmu memperluas UML dengan <b>stereotype</b>, <b>tagged value</b>, dan <b>specialization</b> tanpa mengubah inti UML.',
    'Ini "UML yang disesuaikan" untuk bahasa domainmu sendiri.'
  ],
  objectives: [
    'Memahami konsep profile dan stereotype',
    'Menggunakan tagged value untuk metadata tambahan',
    'Menerapkan profile untuk domain tertentu'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Profile</b> adalah mekanisme UML untuk menyesuaikan UML ke domain khusus. Tiga alat utamanya:</p><ul><li><b>Stereotype</b> — "sub-tipe" elemen UML, ditulis <code>«nama»</code>, memperluas makna elemen (mis. «digital» memperluas kelas Buku).</li><li><b>Tagged value</b> — pasangan <code>kunci = nilai</code> yang menambah metadata (mis. <code>format = EPUB</code>).</li><li><b>Specialization</b> — hubungan pewarisan antar stereotype.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 700 260" width="700" role="img" aria-label="Profile diagram domain perpustakaan">
        <!-- profile package -->
        <path d="M40 40 h150 v22 h180 v160 h-330 z" class="u-box"/>
        <text x="115" y="57" class="u-title" font-size="11">«profile» PerpusProfile</text>
        <!-- stereotype -->
        <rect x="70" y="90" width="140" height="50" rx="6" class="u-hd"/>
        <text x="140" y="112" class="u-title" font-size="10">«stereotype»</text>
        <text x="140" y="128" class="u-text" font-size="11">BukuDigital</text>
        <rect x="70" y="160" width="140" height="44" rx="6" class="u-box"/>
        <text x="140" y="180" class="u-title" font-size="10">«stereotype»</text>
        <text x="140" y="196" class="u-text" font-size="11">BukuFisik</text>
        <!-- extends metaclass -->
        <line x1="210" y1="115" x2="360" y2="115" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="285" y="105" class="u-lbl" text-anchor="middle">«extend»</text>
        <rect x="362" y="90" width="150" height="50" rx="6" class="u-box"/>
        <text x="437" y="112" class="u-title" font-size="10">«metaclass»</text>
        <text x="437" y="128" class="u-text" font-size="11">Kelas (Buku)</text>
        <!-- tagged value -->
        <rect x="540" y="90" width="140" height="70" rx="6" class="u-box"/>
        <text x="610" y="112" class="u-title" font-size="10">Tagged value</text>
        <text x="610" y="132" class="u-text" font-size="10">format = EPUB</text>
        <text x="610" y="148" class="u-text" font-size="10">ukuran = 5MB</text>
        <line x1="500" y1="115" x2="540" y2="115" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 11.1</b> — Profile: stereotype «BukuDigital»/«BukuFisik» memperluas kelas Buku + tagged value</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Dengan profile, diagram biasa bisa memakai istilah domain. Sebuah kelas Buku bisa diberi stereotype sehingga jelas ini buku digital atau fisik, lengkap dengan metadata tambahan — tanpa mengubah notasi UML inti:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 420 140" width="420" role="img" aria-label="Penggunaan stereotype pada kelas">
        <rect x="90" y="20" width="240" height="100" rx="8" class="u-box"/>
        <text x="210" y="46" class="u-title" font-size="11">«digital»</text>
        <text x="210" y="66" class="u-title" font-size="13">Buku</text>
        <line x1="90" y1="80" x2="330" y2="80" class="u-line"/>
        <text x="105" y="102" class="u-text" font-size="10">{format = EPUB}</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 11.2</b> — Kelas Buku dengan stereotype «digital» dan tagged value {format = EPUB}</figcaption></figure>`
    },
    {
      type: 'vocab',
      items: [
        ['Profile', 'Mekanisme menyesuaikan UML untuk domain khusus (sebuah paket «profile»).'],
        ['Stereotype', 'Perluas makna elemen UML; ditulis «nama» (mis. «digital»).'],
        ['Tagged value', 'Metadata tambahan kunci = nilai (mis. {format = EPUB}).'],
        ['Metaclass', 'Elemen UML yang diperluas oleh stereotype (mis. kelas Buku).']
      ]
    },
    {
      type: 'tip',
      title: 'Kapan dipakai?',
      text: 'Saat tim/domain punya <b>istilah khusus</b> yang berulang (mis. "buku digital", "transaksi kredit") dan ingin tercantum jelas di semua diagram tanpa mengubah standar UML. Untuk proyek biasa, profile jarang diperlukan.'
    }
  ],
  recap: [
    'Profile Diagram memperluas UML untuk domain khusus tanpa mengubah intinya.',
    'Stereotype «nama» memperluas makna; tagged value {kunci = nilai} menambah metadata.',
    'Didefinisikan dalam paket «profile» yang meregangkan metaclass UML.'
  ]
});
