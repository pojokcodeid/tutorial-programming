/* ============================================================
   Pelajaran UML — Bab 4: Studi Kasus
   Penerapan nyata seluruh diagram UML pada satu sistem:
   "Sistem Perpustakaan Terpadu".
   (melengkapi permintaan: contoh case study di bagian akhir)
   ============================================================ */
'use strict';

window.UML_LESSONS = window.UML_LESSONS || [];

/* ---------- Pelajaran 1: Analisis Kebutuhan ---------- */
window.UML_LESSONS.push({
  id: 'studi-kasus-analisis',
  title: 'Studi Kasus (1): Analisis Kebutuhan Sistem Perpustakaan',
  chapter: 'Studi Kasus',
  duration: '15 menit',
  intro: [
    'Sekarang kita terapkan seluruh materi pada satu sistem nyata: <b>Sistem Perpustakaan Terpadu</b>. Prosesnya mengikuti alur sungguhan: <b>analisis → desain → dokumentasi</b>.',
    'Di pelajaran ini kita menganalisis kebutuhan: mengidentifikasi aktor, use case, dan model kelas awal (tahap ANALISIS — menjawab "APA").'
  ],
  objectives: [
    'Menerapkan Use Case Diagram pada kasus nyata',
    'Membangun model kelas awal dari domain masalah',
    'Melihat bagaimana analisis menjadi dasar desain'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Kasus:</b> Perpustakaan kampus masih mencatat peminjaman buku secara manual di buku tamu. Akibatnya: sulit mencari judul yang tersedia, sering telat mengingatkan pengembalian, dan denda sulit dihitung. Dibutuhkan sistem digital untuk mengelola <b>pencarian, peminjaman, pengembalian,</b> dan <b>denda</b>.</p><p>Pertama, kita kenali para <b>aktor</b> (pihak yang berinteraksi dengan sistem) dan <b>use case</b> (layanan yang diberikan sistem).</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 470" width="760" role="img" aria-label="Use case Sistem Perpustakaan">
        <rect x="20" y="20" width="720" height="430" rx="10" class="u-box"/>
        <text x="380" y="48" class="u-title">Sistem Perpustakaan Terpadu</text>
        <line x1="20" y1="60" x2="740" y2="60" class="u-line"/>
        <!-- Aktor Anggota -->
        <circle cx="70" cy="150" r="14" class="u-box"/>
        <line x1="70" y1="164" x2="70" y2="200" class="u-line"/>
        <line x1="48" y1="176" x2="92" y2="176" class="u-line"/>
        <line x1="70" y1="200" x2="52" y2="228" class="u-line"/>
        <line x1="70" y1="200" x2="88" y2="228" class="u-line"/>
        <text x="70" y="250" class="u-title" font-size="12">Anggota</text>
        <!-- Use cases kolom kiri -->
        <ellipse cx="300" cy="120" rx="95" ry="26" class="u-hd"/>
        <text x="300" y="125" class="u-title" font-size="12">Cari Buku</text>
        <ellipse cx="300" cy="200" rx="95" ry="26" class="u-hd"/>
        <text x="300" y="205" class="u-title" font-size="12">Pinjam Buku</text>
        <ellipse cx="300" cy="280" rx="95" ry="26" class="u-hd"/>
        <text x="300" y="285" class="u-title" font-size="12">Kembalikan Buku</text>
        <!-- relasi aktor -->
        <line x1="84" y1="160" x2="205" y2="125" class="u-line"/>
        <line x1="84" y1="180" x2="205" y2="200" class="u-line"/>
        <line x1="84" y1="205" x2="205" y2="275" class="u-line"/>
        <!-- include -->
        <line x1="300" y1="226" x2="300" y2="254" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="360" y="245" class="u-lbl">«include»</text>
        <!-- Aktor Petugas -->
        <circle cx="690" cy="150" r="14" class="u-box"/>
        <line x1="690" y1="164" x2="690" y2="200" class="u-line"/>
        <line x1="668" y1="176" x2="712" y2="176" class="u-line"/>
        <line x1="690" y1="200" x2="672" y2="228" class="u-line"/>
        <line x1="690" y1="200" x2="708" y2="228" class="u-line"/>
        <text x="690" y="250" class="u-title" font-size="12">Petugas</text>
        <!-- Use cases kolom kanan -->
        <ellipse cx="470" cy="140" rx="95" ry="26" class="u-hd"/>
        <text x="470" y="145" class="u-title" font-size="12">Kelola Anggota</text>
        <ellipse cx="470" cy="220" rx="95" ry="26" class="u-hd"/>
        <text x="470" y="225" class="u-title" font-size="12">Kelola Katalog</text>
        <ellipse cx="470" cy="330" rx="95" ry="26" class="u-hd"/>
        <text x="470" y="335" class="u-title" font-size="12">Hitung Denda</text>
        <line x1="676" y1="160" x2="565" y2="145" class="u-line"/>
        <line x1="676" y1="180" x2="565" y2="215" class="u-line"/>
        <line x1="676" y1="215" x2="565" y2="320" class="u-line"/>
        <!-- extend -->
        <line x1="470" y1="304" x2="470" y2="246" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="540" y="280" class="u-lbl">«extend»</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar CS.1</b> — Use Case Diagram Sistem Perpustakaan dengan include &amp; extend</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Dari use case di atas kita ekstrak <b>konsep domain</b> menjadi kelas. Ini <b>model kelas analisis</b> — masih sederhana, netral teknologi:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 780 260" width="780" role="img" aria-label="Kelas domain analisis">
        <rect x="20" y="40" width="150" height="170" rx="6" class="u-box"/>
        <rect x="20" y="40" width="150" height="30" rx="6" class="u-hd"/>
        <text x="95" y="61" class="u-title" font-size="12">Anggota</text>
        <line x1="20" y1="70" x2="170" y2="70" class="u-line"/>
        <text x="30" y="92" class="u-text">idAnggota</text>
        <text x="30" y="110" class="u-text">nama</text>
        <line x1="20" y1="124" x2="170" y2="124" class="u-line"/>
        <text x="30" y="146" class="u-text">daftar()</text>
        <text x="30" y="164" class="u-text">pinjam()</text>
        <rect x="315" y="40" width="150" height="170" rx="6" class="u-box"/>
        <rect x="315" y="40" width="150" height="30" rx="6" class="u-hd"/>
        <text x="390" y="61" class="u-title" font-size="12">Buku</text>
        <line x1="315" y1="70" x2="465" y2="70" class="u-line"/>
        <text x="325" y="92" class="u-text">isbn</text>
        <text x="325" y="110" class="u-text">judul</text>
        <text x="325" y="128" class="u-text">tersedia</text>
        <line x1="315" y1="142" x2="465" y2="142" class="u-line"/>
        <text x="325" y="164" class="u-text">pinjam()</text>
        <rect x="610" y="40" width="150" height="170" rx="6" class="u-box"/>
        <rect x="610" y="40" width="150" height="30" rx="6" class="u-hd"/>
        <text x="685" y="61" class="u-title" font-size="12">Peminjaman</text>
        <line x1="610" y1="70" x2="760" y2="70" class="u-line"/>
        <text x="620" y="92" class="u-text">tanggalPinjam</text>
        <text x="620" y="110" class="u-text">tanggalKembali</text>
        <line x1="610" y1="124" x2="760" y2="124" class="u-line"/>
        <text x="620" y="146" class="u-text">hitungDenda()</text>
        <!-- relasi -->
        <line x1="170" y1="125" x2="315" y2="125" class="u-line"/>
        <text x="242" y="115" class="u-lbl">melakukan</text>
        <line x1="465" y1="125" x2="610" y2="125" class="u-line" marker-end="url(#u-diamond-fill)" style="fill:var(--text-2)"/>
        <text x="537" y="115" class="u-lbl">berisi</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar CS.2</b> — Model kelas awal (tahap analisis): Anggota–Buku–Peminjaman</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Hasil tahap analisis',
      text: 'Use Case (Gambar CS.1) menjawab <b>APA</b> yang dilakukan pengguna; kelas domain (Gambar CS.2) menangkap <b>benda-benda penting</b> beserta relasinya. Keduanya masih netral teknologi — siap dikembangkan menjadi desain.'
    },
    {
      type: 'vocab',
      items: [
        ['Aktor', 'Pihak luar yang berinteraksi sistem: Anggota (mahasiswa/dosen) dan Petugas.'],
        ['«include»', 'Use case wajib memakai sub-awalan (Pinjam → selalu CekKelayakan).'],
        ['«extend»', 'Opsional/tambahan bila kondisi terpenuhi (Kembalikan → HitungDenda bila terlambat).'],
        ['Kelas domain', 'Konsep bisnis nyata hasil identifikasi OOA (Anggota, Buku, Peminjaman).']
      ]
    }
  ],
  recap: [
    'Analisis diawali mengidentifikasi aktor dan use case → Use Case Diagram.',
    'Konsep domain diekstrak menjadi model kelas awal yang netral teknologi.',
    'Gunakan «include» untuk langkah wajib dan «extend» untuk langkah opsional bersyarat.',
    'Hasil analisis menjadi input utama tahap desain berikutnya.'
  ]
});

/* ---------- Pelajaran 2: Desain Detail ---------- */
window.UML_LESSONS.push({
  id: 'studi-kasus-desain',
  title: 'Studi Kasus (2): Desain Detail &amp; Arsitektur',
  chapter: 'Studi Kasus',
  duration: '18 menit',
  intro: [
    'Dari hasil analisis, sekarang kita masuk tahap <b>DESAIN</b> (menjawab "BAGAIMANA"): merinci interaksi antar objek, alur kerja, siklus hidup status, serta arsitektur dan infrastruktur.',
    'Kita menghasilkan Sequence, Activity, State Machine, Component, dan Deployment diagram untuk sistem yang sama.'
  ],
  objectives: [
    'Merancang interaksi objek dengan Sequence Diagram',
    'Memetakan alur bisnis dengan Activity Diagram',
    'Menggambarkan siklus status dengan State Machine Diagram',
    'Menyusun arsitektur komponen dan peta deployment'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>1. Sequence Diagram</b> — bagaimana objek bertukar pesan saat Anggota meminjam buku, lengkap dengan fragment alternatif (buku tersedia / tidak) dan pesan balasan:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 780 420" width="780" role="img" aria-label="Sequence peminjaman buku">
        <!-- lifeline headers -->
        <rect x="20" y="20" width="110" height="34" rx="6" class="u-hd"/>
        <text x="75" y="42" class="u-title" font-size="11">:Anggota</text>
        <rect x="170" y="20" width="120" height="34" rx="6" class="u-hd"/>
        <text x="230" y="42" class="u-title" font-size="11">:Sistem</text>
        <rect x="330" y="20" width="120" height="34" rx="6" class="u-hd"/>
        <text x="390" y="42" class="u-title" font-size="11">:Buku</text>
        <rect x="490" y="20" width="130" height="34" rx="6" class="u-hd"/>
        <text x="555" y="42" class="u-title" font-size="11">:Peminjaman</text>
        <!-- lifelines -->
        <line x1="75" y1="54" x2="75" y2="400" class="u-dash"/>
        <line x1="230" y1="54" x2="230" y2="400" class="u-dash"/>
        <line x1="390" y1="54" x2="390" y2="400" class="u-dash"/>
        <line x1="555" y1="54" x2="555" y2="400" class="u-dash"/>
        <!-- activation -->
        <rect x="226" y="90" width="8" height="230" class="u-box"/>
        <rect x="386" y="150" width="8" height="60" class="u-box"/>
        <rect x="551" y="230" width="8" height="60" class="u-box"/>
        <!-- messages -->
        <line x1="75" y1="100" x2="226" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="150" y="92" class="u-text" font-size="11">1: pinjam(isbn)</text>
        <line x1="230" y1="160" x2="386" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="308" y="152" class="u-text" font-size="11">2: cekTersedia()</text>
        <line x1="390" y1="190" x2="230" y2="190" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="308" y="205" class="u-text" font-size="11">3: true</text>
        <line x1="230" y1="250" x2="551" y2="250" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="388" y="242" class="u-text" font-size="11">4: buatPeminjaman()</text>
        <line x1="555" y1="285" x2="230" y2="285" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="388" y="300" class="u-text" font-size="11">5: struk()</text>
        <line x1="230" y1="330" x2="75" y2="330" class="u-dash" marker-end="url(#u-arrow-open)"/>
        <text x="150" y="345" class="u-text" font-size="11">6: konfirmasi</text>
        <!-- alt frame -->
        <rect x="20" y="360" width="740" height="46" rx="4" class="u-dash"/>
        <text x="26" y="374" class="u-lbl">[alt] buku tersedia</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar CS.3</b> — Sequence Diagram alur peminjaman buku</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>2. Activity Diagram</b> — alur bisnis peminjaman dengan keputusan dan pembagian peran (swimlane):</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Activity peminjaman">
        <line x1="250" y1="20" x2="250" y2="320" class="u-line" opacity="0.4"/>
        <line x1="500" y1="20" x2="500" y2="320" class="u-line" opacity="0.4"/>
        <text x="125" y="40" class="u-title" font-size="12">Anggota</text>
        <text x="375" y="40" class="u-title" font-size="12">Sistem</text>
        <text x="630" y="40" class="u-title" font-size="12">Petugas</text>
        <!-- start -->
        <circle cx="125" cy="80" r="10" class="u-arw-fill"/>
        <line x1="125" y1="90" x2="125" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="55" y="112" width="140" height="34" rx="17" class="u-box"/>
        <text x="125" y="133" class="u-title" font-size="11">Ajukan Pinjam</text>
        <line x1="195" y1="129" x2="310" y2="129" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="310" y="112" width="140" height="34" rx="17" class="u-box"/>
        <text x="380" y="133" class="u-title" font-size="11">Cek Kelayakan</text>
        <!-- decision -->
        <polygon points="380,160 410,185 380,210 350,185" class="u-hd"/>
        <line x1="380" y1="146" x2="380" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="420" y="178" class="u-lbl">[layak]</text>
        <line x1="410" y1="185" x2="600" y2="185" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="560" y="168" width="140" height="34" rx="17" class="u-box"/>
        <text x="630" y="189" class="u-title" font-size="11">Proses Pinjam</text>
        <line x1="350" y1="185" x2="230" y2="185" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="250" y="178" class="u-lbl">[tidak]</text>
        <rect x="90" y="168" width="140" height="34" rx="17" class="u-box"/>
        <text x="160" y="189" class="u-title" font-size="11">Tolak / Pesan</text>
        <!-- join ke final -->
        <line x1="630" y1="202" x2="630" y2="250" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="160" y1="202" x2="160" y2="250" class="u-line" marker-end="url(#u-arrow)"/>
        <circle cx="380" cy="262" r="12" class="u-box"/>
        <circle cx="380" cy="262" r="6" class="u-arw-fill"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar CS.4</b> — Activity Diagram peminjaman dengan decision node &amp; swimlane</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>3. State Machine Diagram</b> — siklus hidup sebuah Buku dari tersedia sampai dipinjam/terlambat/hilang:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="State machine buku">
        <circle cx="40" cy="120" r="10" class="u-arw-fill"/>
        <line x1="50" y1="120" x2="120" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="120" y="98" width="120" height="44" rx="8" class="u-hd"/>
        <text x="180" y="125" class="u-title" font-size="12">Tersedia</text>
        <line x1="240" y1="120" x2="330" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="285" y="110" class="u-lbl" text-anchor="middle">pinjam</text>
        <rect x="330" y="98" width="120" height="44" rx="8" class="u-box"/>
        <text x="390" y="125" class="u-title" font-size="12">Dipinjam</text>
        <line x1="450" y1="120" x2="540" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="495" y="110" class="u-lbl" text-anchor="middle">telat</text>
        <rect x="540" y="98" width="120" height="44" rx="8" class="u-box" style="fill:var(--red-soft);stroke:var(--red)"/>
        <text x="600" y="125" class="u-title" font-size="12">Terlambat</text>
        <line x1="540" y1="140" x2="180" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="360" y="155" class="u-lbl" text-anchor="middle">kembali / denda lunas</text>
        <line x1="600" y1="98" x2="600" y2="70" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="640" y="80" class="u-lbl">[hilang]</text>
        <rect x="540" y="30" width="120" height="34" rx="8" class="u-box"/>
        <text x="600" y="52" class="u-title" font-size="11">Hilang</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar CS.5</b> — State Machine Diagram siklus hidup Buku dengan guard</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>4. Component &amp; Deployment Diagram</b> — arsitektur modul dan penempatan fisik sistem:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Component arsitektur">
        <rect x="30" y="60" width="150" height="80" rx="4" class="u-box"/>
        <rect x="30" y="60" width="18" height="14" class="u-hd"/><rect x="30" y="90" width="18" height="14" class="u-hd"/>
        <text x="112" y="105" class="u-title" font-size="11">Antarmuka Web</text>
        <rect x="240" y="60" width="160" height="80" rx="4" class="u-box"/>
        <rect x="240" y="60" width="18" height="14" class="u-hd"/><rect x="240" y="90" width="18" height="14" class="u-hd"/>
        <text x="325" y="105" class="u-title" font-size="11">Layanan Peminjaman</text>
        <rect x="470" y="60" width="150" height="80" rx="4" class="u-box"/>
        <rect x="470" y="60" width="18" height="14" class="u-hd"/><rect x="470" y="90" width="18" height="14" class="u-hd"/>
        <text x="552" y="105" class="u-title" font-size="11">Repositori Buku</text>
        <line x1="180" y1="100" x2="240" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="400" y1="100" x2="470" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <circle cx="640" cy="90" r="12" class="u-box"/><text x="640" y="94" class="u-lbl" text-anchor="middle">≡</text>
        <line x1="620" y1="100" x2="640" y2="100" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar CS.6</b> — Component Diagram arsitektur aplikasi</figcaption></figure>`
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 220" width="760" role="img" aria-label="Deployment">
        <!-- client -->
        <rect x="30" y="60" width="140" height="90" rx="6" class="u-box"/>
        <text x="100" y="85" class="u-title" font-size="11">«device»</text>
        <text x="100" y="105" class="u-title" font-size="11">Browser</text>
        <text x="100" y="128" class="u-lbl" text-anchor="middle">client</text>
        <line x1="170" y1="105" x2="300" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <!-- web server -->
        <rect x="300" y="50" width="150" height="110" rx="6" class="u-box"/>
        <text x="375" y="75" class="u-title" font-size="11">«device»</text>
        <text x="375" y="95" class="u-title" font-size="11">Web Server</text>
        <rect x="315" y="110" width="120" height="34" rx="3" class="u-hd"/>
        <text x="375" y="131" class="u-title" font-size="10">app.war</text>
        <line x1="450" y1="105" x2="580" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <!-- db -->
        <rect x="580" y="50" width="150" height="110" rx="6" class="u-box"/>
        <text x="655" y="75" class="u-title" font-size="11">«device»</text>
        <text x="655" y="95" class="u-title" font-size="11">DB Server</text>
        <rect x="595" y="110" width="120" height="34" rx="3" class="u-hd"/>
        <text x="655" y="131" class="u-title" font-size="10">perpus.db</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar CS.7</b> — Deployment Diagram infrastruktur Sistem Perpustakaan</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Ringkasan desain',
      text: 'Sequence → interaksi objek; Activity → alur bisnis; State Machine → siklus status; Component → arsitektur modul; Deployment → infrastruktur fisik. Kelima diagram menjawab "BAGAIMANA" sistem dibangun.'
    }
  ],
  recap: [
    'Sequence Diagram memetakan pesan antar objek menurut urutan waktu.',
    'Activity Diagram memetakan alur bisnis dengan keputusan dan pembagian peran.',
    'State Machine Diagram menggambarkan siklus hidup status sebuah objek.',
    'Component &amp; Deployment Diagram mendokumentasikan arsitektur dan infrastruktur.'
  ]
});

/* ---------- Pelajaran 3: Ringkasan &amp; Best Practices ---------- */
window.UML_LESSONS.push({
  id: 'studi-kasus-ringkasan',
  title: 'Studi Kasus (3): Ringkasan Penerapan &amp; Best Practices',
  chapter: 'Studi Kasus',
  duration: '10 menit',
  intro: [
    'Kita telah menelusuri satu sistem dari analisis sampai desain. Pelajaran penutup ini merangkum <b>diagram mana dipakai kapan</b>, serta praktik terbaik menyusun UML yang berguna (bukan sekadar rapi).'
  ],
  objectives: [
    'Merangkum pemetaan kebutuhan → diagram',
    'Memahami praktik terbaik menulis UML',
    'Mengetahui kesalahan umum yang harus dihindari'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Berikut pemetaan cepat dari kebutuhan ke diagram yang tepat, berdasarkan studi kasus tadi:</p><table class="vocab"><tr><th>Kebutuhan</th><th>Diagram yang dipakai</th></tr><tr><td>Gambaran umum layanan</td><td>Use Case Diagram</td></tr><tr><td>Struktur data &amp; relasi</td><td>Class + Object Diagram</td></tr><tr><td>Urutan kolaborasi objek</td><td>Sequence / Communications</td></tr><tr><td>Alur proses bisnis</td><td>Activity Diagram</td></tr><tr><td>Siklus status objek</td><td>State Machine Diagram</td></tr><tr><td>Arsitektur modul</td><td>Component Diagram</td></tr><tr><td>Infrastruktur fisik</td><td>Deployment Diagram</td></tr><tr><td>Pengelompokan besar</td><td>Package Diagram</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p><b>Best practices</b> menyusun UML yang bermanfaat:</p><ol><li><b>Gambar untuk audiens</b> — use case untuk klien, sequence untuk developer, deployment untuk tim ops.</li><li><b>Jaga kesederhanaan</b> — satu diagram, satu pesan; jangan penuhi dengan detail kecil.</li><li><b>Konsisten</b> — pakai nama &amp; notasi sama di seluruh diagram (Buku = "Buku" di mana pun).</li><li><b>Ikuti alur analisis→desain</b> — jangan langsung detail teknis sebelum kebutuhan jelas.</li><li><b>Ulangi (iterasi)</b> — UML hidup bersama kode; perbarui saat desain berubah.</li><li><b>Pilih seperlunya</b> — 2–3 diagram tepat lebih baik daripada 14 diagram asal jadi.</li></ol>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum yang harus dihindari',
      text: 'Menggambar semua 14 diagram untuk sistem kecil; mengabaikan multiplicity di relasi; mencampur istilah antar diagram; membuat class diagram terlalu detail di tahap analisis; serta menganggap UML sekadar formalitas yang tak pernah dibaca orang. UML harus <b>dipakai untuk berkomunikasi</b>, bukan sekadar disimpan.'
    },
    {
      type: 'tip',
      title: 'Selamat!',
      text: 'Kamu telah menuntaskan materi UML dari dasar hingga studi kasus lengkap. Langkah berikutnya: praktik menggambar UML untuk sistem buatanmu sendiri (mis. toko online, catatan tugas, atau aplikasi absensi), lalu uji pemahamanmu lewat <b>Ujian Akhir</b>.'
    }
  ],
  recap: [
    'Setiap kebutuhan punya diagram yang paling tepat (lihat tabel pemetaan).',
    'Best practices: untuk audiens, sederhana, konsisten, berurutan, iteratif, seperlunya.',
    'Hindari: over-modeling, multiplicity terlewat, istilah tak konsisten, detail prematur.',
    'UML adalah alat berkomunikasi — gambar yang dipakai lebih berharga daripada gambar yang sempurna tapi diabaikan.'
  ]
});
