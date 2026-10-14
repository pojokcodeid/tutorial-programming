/* ============================================================
   Pelajaran UML — Bab 1: Pendahuluan
   (topik info.md:
    - "Pengenalan UML"
    - "Analisis dan Design"
    - "Object Oriented Analisis dan Design"
    - "Overview of the main Diagrams in UML 2.0")

   KONVENSI (ikuti file lain):
   - Setiap pelajaran di-push ke window.UML_LESSONS.
   - Diagram ditulis sebagai SVG inline di dalam <figure class="uml-fig">,
     memakai kelas u-box / u-hd / u-title / u-text / u-lbl / u-line / u-dash
     (CSS-nya di css/style.css sehingga otomatis mengikuti tema).
   - Ujung garis memakai marker global: url(#u-arrow), url(#u-arrow-open),
     url(#u-diamond-fill), url(#u-diamond-open), url(#u-triangle), url(#u-circle).
   ============================================================ */
'use strict';

window.UML_LESSONS = window.UML_LESSONS || [];

/* ---------- Pelajaran 1: Pengenalan UML ---------- */
window.UML_LESSONS.push({
  id: 'pengenalan-uml',
  title: 'Pengenalan UML: Bahasa Visual untuk Merancang Sistem',
  chapter: 'Pendahuluan',
  duration: '10 menit',
  intro: [
    'Sebelum memprogram, seorang developer harus <b>berpikir dan berkomunikasi</b> tentang bentuk sistemnya. UML lahir untuk keperluan itu: sebuah <b>bahasa visual</b> untuk memodelkan sistem perangkat lunak.',
    'Pelajaran ini menjelaskan apa itu model, mengapa pemodelan penting, apa itu UML, sejarahnya, serta makna kata "Unified" (Terpadu) di dalamnya.'
  ],
  objectives: [
    'Memahami apa itu model dan tujuan pemodelan',
    'Memahami definisi UML dan siapa yang menciptakannya',
    'Mengetahui sejarah singkat perkembangan UML',
    'Memahami makna "Unified" pada Unified Modeling Language'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Model</b> adalah <b>representasi sederhana</b> dari sebuah benda. Model menangkap aspek-aspek <b>penting</b> dan membuang detail yang tidak perlu. Patung mini mobil, denah rumah, dan peta jalur kereta adalah model — masing-masing menonjolkan hal tertentu dan menyembunyikan hal lain.</p><p>Dalam konteks perangkat lunak, model dipakai untuk <b>menggambarkan sistem</b> sebelum (atau selama) dibuat. Model berisi <b>semantik</b> (makna) dan <b>notasi</b> (gambaran visual), sehingga lebih mudah dipelajari daripada sistem final yang sebenarnya.</p>'
    },
    {
      type: 'text',
      html: '<p>Karenanya, sistem perangkat lunak tidak pernah berdiri sendiri. Ia selalu berpasangan dengan elemen lain di sekitarnya:</p>',
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 720 240" width="720" role="img" aria-label="Sistem perangkat lunak terdiri dari perangkat lunak dan elemen lain">
        <rect x="20" y="20" width="680" height="200" rx="14" class="u-box"/>
        <text x="360" y="52" class="u-title">Sistem Perangkat Lunak</text>
        <line x1="20" y1="70" x2="700" y2="70" class="u-line"/>
        <rect x="50" y="95" width="280" height="100" rx="10" class="u-hd"/>
        <text x="190" y="128" class="u-title">Perangkat Lunak</text>
        <text x="190" y="152" class="u-lbl" text-anchor="middle">kumpulan program / kode</text>
        <text x="190" y="172" class="u-lbl" text-anchor="middle">yang kita rancang &amp; tulis</text>
        <rect x="390" y="95" width="280" height="100" rx="10" class="u-box"/>
        <text x="530" y="128" class="u-title">Elemen Lain</text>
        <text x="530" y="152" class="u-lbl" text-anchor="middle">pengguna, proses bisnis,</text>
        <text x="530" y="172" class="u-lbl" text-anchor="middle">perangkat keras, data, jaringan</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 1.1</b> — Sistem perangkat lunak = program + elemen non-perangkat-lunak di sekitarnya</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Karena sistem itu luas, kita butuh <b>model</b> agar bisa berpikir jernih. Pemodelan dipakai untuk:</p><ol><li><b>Menangkap kebutuhan</b> dengan tepat agar semua pihak (klien, pengembang, pengguna) sepaham.</li><li><b>Berpikir tentang desain</b> sistem sebelum coding.</li><li><b>Mencatat keputusan desain</b> dalam bentuk yang bisa diubah, terpisah dari kebutuhan.</li><li><b>Menghasilkan produk kerja</b> yang bisa dipakai (diagram → kode).</li><li><b>Mengorganisasi informasi</b> sistem besar agar mudah dicari dan ditinjau.</li><li><b>Menjajaki beberapa solusi</b> dengan murah (cukup gambar, belum coding).</li><li><b>Menguasai kompleksitas</b> sistem yang terlalu besar untuk diingat sekaligus.</li></ol>'
    },
    {
      type: 'text',
      html: '<p><b>UML (Unified Modeling Language)</b> adalah bahasa untuk <b>menviualkan, menetapkan spesifikasi, membangun, dan mendokumentasikan</b> artefak sistem perangkat lunak. Singkatnya: UML adalah bahasa untuk memodelkan sistem perangkat lunak.</p><p>UML dikembangkan oleh tiga tokoh dari Rational Corporation: <b>Grady Booch</b>, <b>James Rumbaugh</b>, dan <b>Ivar Jacobson</b> — sering dijuluki "tiga amigos".</p>'
    },
    {
      type: 'tip',
      title: 'UML itu bahasa, bukan metodologi',
      text: 'UML hanya menyediakan <b>notasi (cara menggambar)</b> dan <b>semantik (makna)</b>. UML <b>bukan</b> proses/tahapan pengembangan. Kamu bisa memakai UML dengan metodologi apa pun (Agile, Waterfall, RUP), karena UML tidak memaksa satu cara kerja tertentu.'
    },
    {
      type: 'text',
      html: '<p>Berikut garis waktu singkat lahir dan berkembangnya UML:</p>',
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 170" width="760" role="img" aria-label="Timeline sejarah UML">
        <line x1="40" y1="90" x2="720" y2="90" class="u-line" marker-end="url(#u-arrow)"/>
        <g>
          <circle cx="70" cy="90" r="5" class="u-arw-fill"/>
          <text x="70" y="70" class="u-title" font-size="12">1993</text>
          <text x="70" y="118" class="u-lbl" text-anchor="middle">Booch di</text>
          <text x="70" y="134" class="u-lbl" text-anchor="middle">Rational</text>
        </g>
        <g>
          <circle cx="185" cy="90" r="5" class="u-arw-fill"/>
          <text x="185" y="70" class="u-title" font-size="12">1994</text>
          <text x="185" y="118" class="u-lbl" text-anchor="middle">Rumbaugh</text>
          <text x="185" y="134" class="u-lbl" text-anchor="middle">gabung</text>
        </g>
        <g>
          <circle cx="300" cy="90" r="5" class="u-arw-fill"/>
          <text x="300" y="70" class="u-title" font-size="12">1995</text>
          <text x="300" y="118" class="u-lbl" text-anchor="middle">Jacobson gabung;</text>
          <text x="300" y="134" class="u-lbl" text-anchor="middle">lahir "UML"</text>
        </g>
        <g>
          <circle cx="430" cy="90" r="5" class="u-arw-fill"/>
          <text x="430" y="70" class="u-title" font-size="12">1997</text>
          <text x="430" y="118" class="u-lbl" text-anchor="middle">Diakui OMG</text>
          <text x="430" y="134" class="u-lbl" text-anchor="middle">sebagai standar</text>
        </g>
        <g>
          <circle cx="555" cy="90" r="5" class="u-arw-fill"/>
          <text x="555" y="70" class="u-title" font-size="12">2000</text>
          <text x="555" y="118" class="u-lbl" text-anchor="middle">Diakui ISO</text>
          <text x="555" y="134" class="u-lbl" text-anchor="middle">(UML 1.0)</text>
        </g>
        <g>
          <circle cx="675" cy="90" r="5" class="u-arw-fill"/>
          <text x="675" y="70" class="u-title" font-size="12">2004</text>
          <text x="675" y="118" class="u-lbl" text-anchor="middle">UML 2.0 —</text>
          <text x="675" y="134" class="u-lbl" text-anchor="middle">generasi sekarang</text>
        </g>
      </svg></div><figcaption class="uml-cap"><b>Gambar 1.2</b> — Garis waktu sejarah UML (1993–2004)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Kata <b>"Unified" (Terpadu)</b> dipilih karena UML memadukan banyak hal menjadi satu:</p><table class="vocab"><tr><th>Disatukan lintas…</th><th>Artinya</th></tr><tr><td>Metode &amp; notasi lama</td><td>Booch, OMT, dan Objectory digabung menjadi satu notasi.</td></tr><tr><td>Tahap siklus hidup</td><td>Dipakai dari analisis, desain, hingga implementasi.</td></tr><tr><td>Domain aplikasi</td><td>Bisa dipakai untuk perbankan, e-commerce, game, dsb.</td></tr><tr><td>Bahasa &amp; platform</td><td>Netral — berlaku untuk Java, Python, Go, dsb.</td></tr><tr><td>Konsep internal</td><td>Menyediakan konsep dasar yang konsisten antar diagram.</td></tr></table>'
    },
    {
      type: 'vocab',
      items: [
        ['Model', 'Representasi sederhana dari suatu benda/ sistem, menangkap sisi pentingnya.'],
        ['Notasi', 'Aturan cara menggambar elemen model (simbol visual).'],
        ['Semantik', 'Makna di balik sebuah notasi/simbol.'],
        ['UML', 'Unified Modeling Language — bahasa visual untuk memodelkan sistem perangkat lunak.'],
        ['Stakeholder', 'Semua pihak yang berkepentingan: klien, pengguna, pengembang, tester.']
      ]
    },
    {
      type: 'warn',
      title: 'UML bukan bahasa pemrograman',
      text: 'Kamu <b>bisa</b> membuat sistem lengkap tanpa UML, tetapi untuk sistem besar, tanpa model tim akan kesulitan sepaham. UML <b>bukan wajib</b>, tetapi <b>sangat membantu</b> saat berkomunikasi dan merancang.'
    }
  ],
  recap: [
    'Model adalah representasi sederhana yang menonjolkan sisi penting suatu benda.',
    'UML adalah bahasa visual untuk memvisualkan, menetapkan spesifikasi, membangun, dan mendokumentasikan sistem perangkat lunak.',
    'UML dibuat Grady Booch, James Rumbaugh, dan Ivar Jacobson; diakui OMG (1997) dan ISO (2000).',
    '"Unified" berarti UML memadukan metode lama, tahapan, domain, bahasa, dan platform menjadi satu.',
    'UML adalah bahasa (notasi + semantik), bukan metodologi pengembangan.'
  ]
});

/* ---------- Pelajaran 2: Analisis dan Desain ---------- */
window.UML_LESSONS.push({
  id: 'analisis-dan-desain',
  title: 'Analisis dan Desain: Dari Masalah ke Solusi',
  chapter: 'Pendahuluan',
  duration: '8 menit',
  intro: [
    'Dua kata yang sering tertukar: <b>analisis</b> dan <b>desain</b>. Keduanya adalah dua fase berbeda yang saling melengkapi dalam membangun sistem.',
    'Pelajaran ini membedakan apa itu analisis vs desain, dan di mana UML dipakai di masing-masing fase.'
  ],
  objectives: [
    'Membedakan tahap analisis dan tahap desain',
    'Memahami fokus pertanyaan di tiap tahap',
    'Menempatkan peran UML dalam analisis dan desain'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tahap <b>Analisis</b> menjawab pertanyaan <b>"APA" yang dibutuhkan sistem</b> — dari sudut pandang masalah/domain bisnis, tanpa peduli teknologi. Tahap <b>Desain</b> menjawab pertanyaan <b>BAGAIMANA sistem itu dibangun</b> — dengan teknologi dan komponen konkret.</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 720 210" width="720" role="img" aria-label="Analisis menuju Desain">
        <rect x="30" y="40" width="260" height="130" rx="12" class="u-hd"/>
        <text x="160" y="72" class="u-title">ANALISIS (APA)</text>
        <text x="160" y="102" class="u-lbl" text-anchor="middle">• Kebutuhan fungsional</text>
        <text x="160" y="122" class="u-lbl" text-anchor="middle">• Aturan bisnis</text>
        <text x="160" y="142" class="u-lbl" text-anchor="middle">• Istilah domain</text>
        <text x="160" y="162" class="u-lbl" text-anchor="middle">• Netral teknologi</text>
        <line x1="300" y1="105" x2="420" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="360" y="92" class="u-lbl" text-anchor="middle">ditransformasi</text>
        <rect x="430" y="40" width="260" height="130" rx="12" class="u-box"/>
        <text x="560" y="72" class="u-title">DESAIN (BAGAIMANA)</text>
        <text x="560" y="102" class="u-lbl" text-anchor="middle">• Arsitektur &amp; komponen</text>
        <text x="560" y="122" class="u-lbl" text-anchor="middle">• Pemilihan teknologi</text>
        <text x="560" y="142" class="u-lbl" text-anchor="middle">• Struktur data &amp; antarmuka</text>
        <text x="560" y="162" class="u-lbl" text-anchor="middle">• Siap diimplementasikan</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 2.1</b> — Analisis (domain masalah) ditransformasi menjadi Desain (solusi teknis)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Perbedaan paling penting terletak pada <b>fokus</b> dan <b>audiens</b>nya:</p><table class="vocab"><tr><th>Sisi</th><th>Analisis</th><th>Desain</th></tr><tr><td>Pertanyaan</td><td>APA yang dibutuhkan?</td><td>BAGAIMANA membangunnya?</td></tr><tr><td>Domain</td><td>Masalah / bisnis</td><td>Solusi / teknik</td></tr><tr><td>Bahasa</td><td>Istilah pengguna &amp; domain</td><td>Istilah teknis &amp; komponen</td></tr><tr><td>Netral teknologi</td><td>Ya</td><td>Tidak (sudah memilih teknologi)</td></tr><tr><td>Contoh diagram</td><td>Use Case, kelas domain awal</td><td>Class, Sequence, Component, Deployment</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'UML dipakai di keduanya',
      text: 'Diagram <b>Use Case</b> dan model kelas awal umumnya lahir saat <b>analisis</b> (menggambarkan kebutuhan domain). Diagram <b>Class lanjutan, Sequence, Component,</b> dan <b>Deployment</b> umumnya lahir saat <b>desain</b> (memilih bentuk solusi).'
    },
    {
      type: 'vocab',
      items: [
        ['Analisis', 'Tahap memahami &amp; menetapkan APA yang dibutuhkan sistem, dari sudut pandang masalah.'],
        ['Desain', 'Tahap merancang BAGAIMANA sistem dibangun: arsitektur, komponen, teknologi.'],
        ['Domain', 'Lingkup bisnis/masalah yang menjadi cakupan sistem (mis. perpustakaan, perbankan).'],
        ['Netral teknologi', 'Belum terikat bahasa/ platform tertentu (khas tahap analisis).']
      ]
    }
  ],
  recap: [
    'Analisis = APA (kebutuhan, domain masalah, netral teknologi).',
    'Desain = BAGAIMANA (arsitektur, komponen, teknologi konkret).',
    'UML dipakai di keduanya: use case &amp; kelas domain di analisis; class/sequence/component/deployment di desain.'
  ]
});

/* ---------- Pelajaran 3: Object Oriented Analysis & Design ---------- */
window.UML_LESSONS.push({
  id: 'oOAD',
  title: 'Object Oriented Analysis &amp; Design (OOAD)',
  chapter: 'Pendahuluan',
  duration: '9 menit',
  intro: [
    '<b>OOAD</b> adalah pendekatan menganalisis dan merancang sistem dengan cara memandang dunia sebagai kumpulan <b>objek</b> yang saling berinteraksi.',
    'Pelajaran ini menjelaskan konsep objek, kelas, empat pilar OOP, serta bagaimana OOAD memandang sebuah sistem.'
  ],
  objectives: [
    'Memahami konsep objek dan kelas dalam konteks OOAD',
    'Mengenali empat pilar OOP (abstraksi, enkapsulasi, pewarisan, polimorfisme)',
    'Memahami peran OOAD dalam pengembangan perangkat lunak'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Dalam pandangan <b>berorientasi objek</b>, sebuah sistem dibayangkan sebagai kumpulan <b>objek</b>. Setiap objek adalah entitas yang memiliki <b>state (status)</b>, <b>behavior (perilaku)</b>, dan <b>identity (identitas)</b>.</p><p><b>Kelas</b> adalah <b>cetakan/blueprint</b> untuk membuat objek. Kelas mendefinisikan atribut (state) dan operasi (behavior); objek adalah实例 (instance) nyata dari kelas itu.</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 720 230" width="720" role="img" aria-label="Kelas sebagai cetakan dan objek sebagai instance">
        <rect x="40" y="30" width="220" height="150" rx="8" class="u-box"/>
        <rect x="40" y="30" width="220" height="34" rx="8" class="u-hd"/>
        <text x="150" y="53" class="u-title">«class» Buku</text>
        <line x1="40" y1="64" x2="260" y2="64" class="u-line"/>
        <text x="52" y="90" class="u-text">+ judul : String</text>
        <text x="52" y="110" class="u-text">+ tersedia : Boolean</text>
        <line x1="40" y1="124" x2="260" y2="124" class="u-line"/>
        <text x="52" y="148" class="u-text">+ pinjam()</text>
        <text x="52" y="168" class="u-text">+ kembalikan()</text>
        <text x="150" y="205" class="u-lbl" text-anchor="middle">cetakan (blueprint)</text>
        <line x1="290" y1="105" x2="410" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="350" y="92" class="u-lbl" text-anchor="middle">membuat instance</text>
        <rect x="440" y="30" width="230" height="150" rx="8" class="u-hd" style="fill:var(--green-soft);stroke:var(--green)"/>
        <rect x="440" y="30" width="230" height="34" rx="8" class="u-hd" style="fill:var(--green-soft);stroke:var(--green)"/>
        <text x="555" y="53" class="u-title">buku1 : Buku</text>
        <line x1="440" y1="64" x2="670" y2="64" class="u-line"/>
        <text x="452" y="90" class="u-text">judul = "Pemrograman Go"</text>
        <text x="452" y="110" class="u-text">tersedia = true</text>
        <line x1="440" y1="124" x2="670" y2="124" class="u-line"/>
        <text x="452" y="152" class="u-text">(objek nyata di memori)</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 3.1</b> — Kelas sebagai cetakan; objek sebagai instance yang nyata</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>OOP bertumpu pada <b>empat pilar</b> yang akan muncul berulang di diagram kelas:</p><table class="vocab"><tr><th>Pilar</th><th>Arti singkat</th></tr><tr><td>Abstraksi</td><td>Menonjolkan yang penting, menyembunyikan detail.</td></tr><tr><td>Enkapsulasi</td><td>Membungkus data + perilaku dalam satu objek, menyembunyikan isi.</td></tr><tr><td>Pewarisan</td><td>Kelas anak memakai/mewarisi sifat kelas induk.</td></tr><tr><td>Polimorfisme</td><td>Satu nama perilaku, banyak bentuk implementasi.</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p><b>OOAD</b> menerapkan cara pandang itu ke analisis &amp; desain:</p><ul><li><b>OOA (Analysis)</b> — mengidentifikasi objek, kelas, dan relasi dari domain masalah (mis. Buku, Anggota, Peminjaman).</li><li><b>OOD (Design)</b> — memperinci kelas itu: menambahkan detail teknis, interface, pola, dan arsitektur agar siap diprogram.</li></ul><p>Hasil utama OOAD yang divisualkan dengan UML adalah <b>diagram kelas</b> dan <b>diagram interaksi</b>.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Objek', 'Instance nyata dari sebuah kelas; punya state, behavior, dan identity.'],
        ['Kelas', 'Cetakan/blueprint yang mendefinisikan atribut dan operasi untuk objek.'],
        ['Atribut', 'Property/state yang dimiliki sebuah kelas (mis. judul : String).'],
        ['Operasi (method)', 'Perilaku/fungsi yang bisa dilakukan objek (mis. pinjam()).'],
        ['Instance', 'Objek nyata yang dibuat dari sebuah kelas.']
      ]
    },
    {
      type: 'tip',
      title: 'Hubungan dengan UML',
      text: 'UML adalah bahasa visual yang dipakai untuk <b>mengekspresikan model OOAD</b>. Jadi OOAD adalah cara berpikirnya, UML adalah alat menggambarnya.'
    }
  ],
  recap: [
    'OOAD memandang sistem sebagai kumpulan objek yang berinteraksi.',
    'Objek punya state, behavior, identity; kelas adalah cetakannya.',
    'Empat pilar OOP: abstraksi, enkapsulasi, pewarisan, polimorfisme.',
    'OOA menganalisis objek domain; OOD merinci solusi teknisnya; keduanya divisualkan dengan UML.'
  ]
});

/* ---------- Pelajaran 4: Overview Diagram UML 2.0 ---------- */
window.UML_LESSONS.push({
  id: 'overview-diagram-uml',
  title: 'Overview 14 Diagram UML 2.0',
  chapter: 'Pendahuluan',
  duration: '12 menit',
  intro: [
    'UML 2.0 memiliki <b>14 diagram</b> yang dibagi menjadi dua keluarga besar: <b>diagram struktural</b> (tampak diam / statis) dan <b>diagram perilaku</b> (tampak bergerak / dinamis).',
    'Pelajaran ini memberi peta seluruh diagram UML 2.0 dan panduan memilih diagram yang tepat.'
  ],
  objectives: [
    'Mengelompokkan 14 diagram UML 2.0 ke dalam struktural dan perilaku',
    'Menyebutkan fungsi singkat tiap diagram',
    'Memilih diagram yang tepat untuk kebutuhan tertentu'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Pembagian besar UML 2.0 mudah diingat: <b>struktural = "tampak diam"</b> (foto sistem), <b>perilaku = "tampak bergerak"</b> (video sistem). Keluarga perilaku juga memiliki sub-kelompok <b>interaksi</b> (bagaimana objek saling bicara).</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 820 540" width="820" role="img" aria-label="Pohon 14 diagram UML 2.0">
        <rect x="330" y="15" width="160" height="44" rx="10" class="u-hd"/>
        <text x="410" y="43" class="u-title">UML 2.0</text>
        <line x1="410" y1="59" x2="410" y2="82" class="u-line"/>
        <line x1="200" y1="82" x2="620" y2="82" class="u-line"/>
        <line x1="200" y1="82" x2="200" y2="104" class="u-line"/>
        <line x1="620" y1="82" x2="620" y2="104" class="u-line"/>
        <rect x="90" y="104" width="220" height="38" rx="8" class="u-box"/>
        <text x="200" y="129" class="u-title">Struktural (7) — statis</text>
        <rect x="510" y="104" width="220" height="38" rx="8" class="u-box"/>
        <text x="620" y="129" class="u-title">Perilaku (7) — dinamis</text>
        <line x1="200" y1="142" x2="200" y2="164" class="u-line"/>
        <g>
          <rect x="60" y="164" width="130" height="30" rx="6" class="u-box"/>
          <text x="125" y="184" class="u-title" font-size="11">Class</text>
          <rect x="200" y="164" width="130" height="30" rx="6" class="u-box"/>
          <text x="265" y="184" class="u-title" font-size="11">Object</text>
          <rect x="60" y="202" width="130" height="30" rx="6" class="u-box"/>
          <text x="125" y="222" class="u-title" font-size="11">Package</text>
          <rect x="200" y="202" width="130" height="30" rx="6" class="u-box"/>
          <text x="265" y="222" class="u-title" font-size="11">Component</text>
          <rect x="60" y="240" width="130" height="30" rx="6" class="u-box"/>
          <text x="125" y="260" class="u-title" font-size="11">Deployment</text>
          <rect x="200" y="240" width="130" height="30" rx="6" class="u-box"/>
          <text x="265" y="260" class="u-title" font-size="11">Composite Structure</text>
          <rect x="60" y="278" width="130" height="30" rx="6" class="u-box"/>
          <text x="125" y="298" class="u-title" font-size="11">Profile</text>
        </g>
        <line x1="620" y1="142" x2="620" y2="164" class="u-line"/>
        <g>
          <rect x="500" y="164" width="115" height="30" rx="6" class="u-box"/>
          <text x="557" y="184" class="u-title" font-size="11">Use Case</text>
          <rect x="625" y="164" width="115" height="30" rx="6" class="u-box"/>
          <text x="682" y="184" class="u-title" font-size="11">Activity</text>
          <rect x="500" y="202" width="115" height="30" rx="6" class="u-box"/>
          <text x="557" y="222" class="u-title" font-size="11">State Machine</text>
          <rect x="625" y="202" width="115" height="30" rx="6" class="u-box" style="fill:var(--blue-soft);stroke:var(--blue)"/>
          <text x="682" y="222" class="u-title" font-size="11">Interaksi (4)</text>
        </g>
        <line x1="682" y1="232" x2="682" y2="254" class="u-line"/>
        <rect x="600" y="254" width="165" height="30" rx="6" class="u-box"/>
        <text x="682" y="274" class="u-title" font-size="11">Sequence</text>
        <rect x="600" y="292" width="165" height="30" rx="6" class="u-box"/>
        <text x="682" y="312" class="u-title" font-size="11">Communications</text>
        <rect x="600" y="330" width="165" height="30" rx="6" class="u-box"/>
        <text x="682" y="350" class="u-title" font-size="11">Interaction Overview</text>
        <rect x="600" y="368" width="165" height="30" rx="6" class="u-box"/>
        <text x="682" y="388" class="u-title" font-size="11">Timing</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 4.1</b> — Pohon 14 diagram UML 2.0: 7 struktural &amp; 7 perilaku (4 di antaranya diagram interaksi)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Secara singkat, berikut peran ke-14 diagram (pelajaran berikutnya akan membahasnya satu per satu):</p><table class="vocab"><tr><th>Diagram</th><th>Fungsi singkat</th></tr><tr><td>Class</td><td>Struktur kelas: atribut, operasi, dan relasi antar kelas.</td></tr><tr><td>Object</td><td>Snapshot instance objek pada satu saat.</td></tr><tr><td>Package</td><td>Mengelompokkan elemen &amp; menunjukkan ketergantungan antar paket.</td></tr><tr><td>Component</td><td>Komponen (modul) beserta antarmuka port-nya.</td></tr><tr><td>Deployment</td><td>Penempatan artefak di node fisik (server, device).</td></tr><tr><td>Composite Structure</td><td>Struktur internal &amp; bagian-bagian di dalam sebuah kelas.</td></tr><tr><td>Profile</td><td>Memperluas UML dengan stereotype untuk domain khusus.</td></tr><tr><td>Use Case</td><td>Fungsi/layanan yang diberikan sistem kepada aktor (pengguna).</td></tr><tr><td>Activity</td><td>Alur kerja / proses bisnis dari awal sampai akhir.</td></tr><tr><td>State Machine</td><td>Siklus hidup satu objek: status &amp; perubahannya.</td></tr><tr><td>Sequence</td><td>Pesan antar objek menurut urutan waktu.</td></tr><tr><td>Communications</td><td>Pesan antar objek menurut struktur (hubungan).</td></tr><tr><td>Interaction Overview</td><td>Alur antar berbagai skenario interaksi.</td></tr><tr><td>Timing</td><td>Perubahan status objek seiring waktu (diagram waktu).</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Bagaimana memilih diagram?',
      text: 'Tanyakan pada dirimu: <b>Butuh foto atau video?</b> Butuh gambar <b>struktur data</b> → struktural (Class, Component). Butuh gambar <b>alur/urutan kejadian</b> → perilaku (Sequence, Activity, State Machine). Butuh <b>kebutuhan pengguna</b> → Use Case. Butuh <b>infrastruktur</b> → Deployment.'
    },
    {
      type: 'warn',
      title: 'Tidak semua diagram wajib',
      text: 'Untuk proyek kecil, 2–3 diagram (mis. Use Case, Class, Sequence) sudah cukup. UML memberi <b>pilihan</b>, bukan kewajiban menggambar semua 14 diagram.'
    }
  ],
  recap: [
    'UML 2.0 punya 14 diagram: 7 struktural (statis) dan 7 perilaku (dinamis).',
    'Diagram struktural: Class, Object, Package, Component, Deployment, Composite Structure, Profile.',
    'Diagram perilaku: Use Case, Activity, State Machine, serta 4 interaksi (Sequence, Communications, Interaction Overview, Timing).',
    'Pilih berdasarkan kebutuhan: struktur → struktural; alur/urutan → perilaku; kebutuhan → use case; infrastruktur → deployment.'
  ]
});
