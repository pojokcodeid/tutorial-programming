/* ============================================================
   Pelajaran UML — Bab 2 (dasar): Diagram Struktural
   (topik info.md:
    - "Class Diagram"
    - "Object Diagram"
    - "Package Diagram")
   ============================================================ */
'use strict';

window.UML_LESSONS = window.UML_LESSONS || [];

/* ---------- Pelajaran 1: Class Diagram ---------- */
window.UML_LESSONS.push({
  id: 'class-diagram',
  title: 'Class Diagram: Fondasi Model Struktural',
  chapter: 'Diagram Struktural',
  duration: '20 menit',
  intro: [
    '<b>Class Diagram</b> adalah tulang punggung UML struktural. Ia menggambarkan <b>kelas, atribut, operasi,</b> dan <b>relasi antar kelas</b> — "foto diam" struktur data sistemmu.',
    'Ini diagram yang paling sering dipakai dan paling penting untuk dipahami developer. Pelajaran ini membahasnya dari anatomi dasar hingga seluruh jenis relasi.'
  ],
  objectives: [
    'Membaca notasi 3 kompartemen sebuah kelas',
    'Memahami visibilitas, atribut, dan operasi',
    'Membedakan anggota static dan abstract',
    'Mengenali seluruh jenis relasi: asosiasi, agregasi, komposisi, pewarisan, realization, dependensi',
    'Membaca multiplicity pada relasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Secara klasik, sebuah kelas digambar sebagai kotak dengan <b>tiga kompartemen</b> (bagian) yang dipisah garis:</p><ol><li><b>Nama kelas</b> (wajib) — ditengah, tebal. Bila kelas abstract, namanya dimiringkan.</li><li><b>Atribut</b> (opsional) — data yang disimpan kelas, mis. <code>judul : String</code>.</li><li><b>Operasi / method</b> (opsional) — perilaku kelas, mis. <code>pinjam() : void</code>.</li></ol>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 640 260" width="640" role="img" aria-label="Anatomi kelas tiga kompartemen">
        <rect x="180" y="30" width="280" height="200" rx="4" class="u-box"/>
        <rect x="180" y="30" width="280" height="46" rx="4" class="u-hd"/>
        <line x1="180" y1="76" x2="460" y2="76" class="u-line"/>
        <line x1="180" y1="160" x2="460" y2="160" class="u-line"/>
        <text x="320" y="60" class="u-title" font-size="15">Buku</text>
        <text x="196" y="102" class="u-text">- judul : String</text>
        <text x="196" y="124" class="u-text">- isbn : String</text>
        <text x="196" y="146" class="u-text">- tersedia : Boolean</text>
        <text x="196" y="188" class="u-text">+ pinjam() : void</text>
        <text x="196" y="210" class="u-text">+ kembalikan() : void</text>
        <!-- label penunjuk -->
        <line x1="470" y1="53" x2="540" y2="53" class="u-dash"/>
        <text x="545" y="50" class="u-lbl">1. Nama</text>
        <text x="545" y="64" class="u-lbl">(tebal)</text>
        <line x1="460" y1="120" x2="530" y2="120" class="u-dash"/>
        <text x="535" y="117" class="u-lbl">2. Atribut</text>
        <text x="535" y="131" class="u-lbl">tipeData</text>
        <line x1="460" y1="198" x2="530" y2="198" class="u-dash"/>
        <text x="535" y="195" class="u-lbl">3. Operasi</text>
        <text x="535" y="209" class="u-lbl">(param) : tipe</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 5.1</b> — Anatomi notasi kelas: nama, atribut, dan operasi</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Setiap atribut dan operasi diawali <b>penanda visibilitas</b> (akses):</p>'
    },
    {
      type: 'text',
      html: '<table class="vocab"><tr><th>Tanda</th><th>Visibilitas</th><th>Arti</th></tr><tr><td>+</td><td>public</td><td>Bisa diakses dari mana saja.</td></tr><tr><td>-</td><td>private</td><td>Hanya bisa diakses dari dalam kelas itu sendiri.</td></tr><tr><td>#</td><td>protected</td><td>Bisa diakses kelas itu sendiri dan kelas turunannya.</td></tr><tr><td>~</td><td>package</td><td>Bisa diakses sesama anggota paket yang sama.</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p>Dua penanda penting lain pada anggota kelas:</p><ul><li><b>Static</b> (dimiliki kelas, bukan objek) — ditulis dengan <b>garis bawah</b>.</li><li><b>Abstract</b> (belum diimplementasikan, hanya cetakan) — ditulis <b>miring (italic)</b>. Kelas abstract juga namanya miring.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 660 210" width="660" role="img" aria-label="Static dan abstract pada kelas">
        <rect x="30" y="30" width="270" height="150" rx="4" class="u-box"/>
        <rect x="30" y="30" width="270" height="38" rx="4" class="u-hd"/>
        <line x1="30" y1="68" x2="300" y2="68" class="u-line"/>
        <line x1="30" y1="118" x2="300" y2="118" class="u-line"/>
        <text x="165" y="56" class="u-title" font-size="13">Perpus</text>
        <text x="44" y="92" class="u-text">- jumlahAnggota : int</text>
        <text x="44" y="110" class="u-text" style="text-decoration:underline">- totalBuku : int</text>
        <text x="44" y="142" class="u-text">+ tambahBuku()</text>
        <text x="44" y="162" class="u-text" style="text-decoration:underline">+ hitungTotal() : int</text>
        <text x="165" y="200" class="u-lbl" text-anchor="middle">garis bawah = static</text>
        <!-- kelas abstract -->
        <rect x="360" y="30" width="270" height="120" rx="4" class="u-box"/>
        <rect x="360" y="30" width="270" height="38" rx="4" class="u-hd"/>
        <line x1="360" y1="68" x2="630" y2="68" class="u-line"/>
        <text x="495" y="56" class="u-title" font-size="13" style="font-style:italic">Pengguna</text>
        <text x="374" y="92" class="u-text">+ nama : String</text>
        <line x1="360" y1="104" x2="630" y2="104" class="u-line"/>
        <text x="374" y="130" class="u-text" style="font-style:italic">+ login() : void</text>
        <text x="495" y="172" class="u-lbl" text-anchor="middle">miring = abstract</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 5.2</b> — Anggota static (garis bawah) dan abstract (miring)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Bagian paling kaya dari class diagram adalah <b>relasi</b> antar kelas. Ada enam jenis yang perlu kamu kuasai. Berikut urutannya dari hubungan paling lemah ke paling kuat:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 700 220" width="700" role="img" aria-label="Relasi asosiasi dengan navigabilitas dan multiplicity">
        <rect x="30" y="50" width="150" height="70" rx="4" class="u-box"/>
        <text x="105" y="90" class="u-title" font-size="13">Anggota</text>
        <rect x="470" y="50" width="160" height="70" rx="4" class="u-box"/>
        <text x="550" y="90" class="u-title" font-size="13">Peminjaman</text>
        <line x1="180" y1="85" x2="470" y2="85" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="325" y="74" class="u-lbl" text-anchor="middle">melakukan</text>
        <text x="195" y="105" class="u-text" font-size="11">1</text>
        <text x="440" y="105" class="u-text" font-size="11">0..*</text>
        <text x="325" y="180" class="u-lbl" text-anchor="middle">Garis = asosiasi · panah = arah navigasi · angka = multiplicity</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 5.3</b> — Asosiasi: satu Anggota melakukan nol/lebih Peminjaman</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>Multiplicity</b> (kardinalitas) menjelaskan "berapa banyak" di tiap ujung relasi:</p>'
    },
    {
      type: 'text',
      html: '<table class="vocab"><tr><th>Notasi</th><th>Arti</th></tr><tr><td>1</td><td>Tepat satu.</td></tr><tr><td>0..1</td><td>Nol atau satu.</td></tr><tr><td>*</td><td>Banyak (tanpa batas).</td></tr><tr><td>0..*</td><td>Nol atau banyak.</td></tr><tr><td>1..*</td><td>Satu atau banyak.</td></tr><tr><td>3..5</td><td>Antara tiga sampai lima.</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p><b>Agregasi</b> dan <b>Komposisi</b> adalah bentuk khusus asosiasi yang menyatakan hubungan <b>"bagian-dari"</b> (whole-part). Perbedaannya pada kekuatan ikatan:</p><ul><li><b>Agregasi</b> (wajik terbuka) — hubungan <b>lemah</b>: bagian masih bisa berdiri sendiri di luar induknya.</li><li><b>Komposisi</b> (wajik penuh) — hubungan <b>kuat</b>: bagian hidup dan mati bersama induknya.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 250" width="760" role="img" aria-label="Agregasi vs komposisi">
        <!-- Agregasi -->
        <rect x="30" y="40" width="150" height="60" rx="4" class="u-box"/>
        <text x="105" y="76" class="u-title" font-size="12">Perpustakaan</text>
        <rect x="330" y="40" width="140" height="60" rx="4" class="u-box"/>
        <text x="400" y="76" class="u-title" font-size="12">Buku</text>
        <line x1="330" y1="70" x2="180" y2="70" class="u-line" marker-start="url(#u-diamond-open)"/>
        <text x="255" y="60" class="u-lbl" text-anchor="middle">mengoleksi</text>
        <text x="105" y="125" class="u-lbl" text-anchor="middle">AGREGASI (wajik terbuka)</text>
        <text x="255" y="125" class="u-lbl" text-anchor="middle">Buku tetap ada walau tak di perpus</text>
        <!-- Komposisi -->
        <rect x="30" y="165" width="150" height="60" rx="4" class="u-box"/>
        <text x="105" y="201" class="u-title" font-size="12">Peminjaman</text>
        <rect x="330" y="165" width="140" height="60" rx="4" class="u-box"/>
        <text x="400" y="201" class="u-title" font-size="12">DetailPinjam</text>
        <line x1="330" y1="195" x2="180" y2="195" class="u-line" marker-start="url(#u-diamond-fill)"/>
        <text x="255" y="185" class="u-lbl" text-anchor="middle">berisi</text>
        <text x="105" y="245" class="u-lbl" text-anchor="middle">KOMPOSISI (wajik penuh)</text>
        <text x="255" y="245" class="u-lbl" text-anchor="middle">Detail ikut hilang bila Peminjaman dihapus</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 5.4</b> — Agregasi (lemah, wajik terbuka) vs Komposisi (kuat, wajik penuh)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>Pewarisan (Generalization)</b> menyatakan hubungan "is-a": kelas anak mewarisi kelas induk. Ditulis garis dengan <b>segitiga terbuka</b> yang menunjuk ke induk. <b>Realization</b> adalah pewarisan terhadap <b>interface</b>, digambar dengan garis <b>putus-panah</b> + segitiga:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 230" width="760" role="img" aria-label="Pewarisan dan realization">
        <!-- inheritance -->
        <rect x="300" y="25" width="160" height="55" rx="4" class="u-box"/>
        <text x="380" y="58" class="u-title" font-size="12" style="font-style:italic">Pengguna</text>
        <rect x="300" y="155" width="160" height="55" rx="4" class="u-box"/>
        <text x="380" y="188" class="u-title" font-size="12">Anggota</text>
        <line x1="380" y1="155" x2="380" y2="82" class="u-line" marker-end="url(#u-triangle)"/>
        <text x="392" y="125" class="u-lbl">generalization (is-a)</text>
        <!-- realization -->
        <rect x="560" y="25" width="170" height="55" rx="4" class="u-hd"/>
        <text x="645" y="49" class="u-title" font-size="11">«interface»</text>
        <text x="645" y="68" class="u-title" font-size="12">IPinjam</text>
        <rect x="560" y="155" width="170" height="55" rx="4" class="u-box"/>
        <text x="645" y="188" class="u-title" font-size="12">LayananPinjam</text>
        <line x1="645" y1="155" x2="645" y2="82" class="u-dash" marker-end="url(#u-triangle)"/>
        <text x="657" y="125" class="u-lbl">realization</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 5.5</b> — Generalization (garis penuh + segitiga) vs Realization (garis putus + segitiga)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>Dependensi (Dependency)</b> adalah hubungan paling lemah: kelas A "memakai" kelas B sementara (mis. sebagai parameter method). Ditulis garis <b>putus-panah</b>. Bila garis itu sekaligus menandai kepemilikan method, disebut <b>usage</b>:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 640 140" width="640" role="img" aria-label="Relasi dependensi">
        <rect x="30" y="40" width="160" height="60" rx="4" class="u-box"/>
        <text x="110" y="76" class="u-title" font-size="12">Peminjaman</text>
        <rect x="430" y="40" width="170" height="60" rx="4" class="u-box"/>
        <text x="515" y="76" class="u-title" font-size="12">LaporanDenda</text>
        <line x1="190" y1="70" x2="430" y2="70" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="310" y="60" class="u-lbl" text-anchor="middle">«use» membuatLaporan()</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 5.6</b> — Dependensi: Peminjaman sementara memakai LaporanDenda</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Akhirnya, kita satukan semuanya dalam <b>satu class diagram utuh</b> Sistem Perpustakaan, memakai berbagai relasi sekaligus:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 880 540" width="880" role="img" aria-label="Class diagram utuh Sistem Perpustakaan">
        <!-- Pengguna (abstract) -->
        <rect x="340" y="25" width="200" height="86" rx="4" class="u-box"/>
        <rect x="340" y="25" width="200" height="34" rx="4" class="u-hd"/>
        <text x="440" y="48" class="u-title" font-size="12" style="font-style:italic">Pengguna</text>
        <line x1="340" y1="59" x2="540" y2="59" class="u-line"/>
        <text x="352" y="80" class="u-text" font-size="11">+ nama : String</text>
        <text x="352" y="100" class="u-text" font-size="11" style="font-style:italic">+ login()</text>
        <!-- Anggota -->
        <rect x="50" y="210" width="175" height="120" rx="4" class="u-box"/>
        <rect x="50" y="210" width="175" height="30" rx="4" class="u-hd"/>
        <text x="137" y="231" class="u-title" font-size="12">Anggota</text>
        <line x1="50" y1="240" x2="225" y2="240" class="u-line"/>
        <text x="60" y="260" class="u-text" font-size="10">+ idAnggota : String</text>
        <text x="60" y="278" class="u-text" font-size="10">+ aktif : Boolean</text>
        <line x1="50" y1="288" x2="225" y2="288" class="u-line"/>
        <text x="60" y="308" class="u-text" font-size="10">+ pinjam(b : Buku)</text>
        <text x="60" y="324" class="u-text" font-size="10">+ kembalikan()</text>
        <!-- Petugas -->
        <rect x="655" y="210" width="175" height="110" rx="4" class="u-box"/>
        <rect x="655" y="210" width="175" height="30" rx="4" class="u-hd"/>
        <text x="742" y="231" class="u-title" font-size="12">Petugas</text>
        <line x1="655" y1="240" x2="830" y2="240" class="u-line"/>
        <text x="665" y="260" class="u-text" font-size="10">+ nip : String</text>
        <line x1="655" y1="272" x2="830" y2="272" class="u-line"/>
        <text x="665" y="292" class="u-text" font-size="10">+ verifikasi()</text>
        <!-- Peminjaman -->
        <rect x="350" y="210" width="180" height="120" rx="4" class="u-box"/>
        <rect x="350" y="210" width="180" height="30" rx="4" class="u-hd"/>
        <text x="440" y="231" class="u-title" font-size="12">Peminjaman</text>
        <line x1="350" y1="240" x2="530" y2="240" class="u-line"/>
        <text x="360" y="260" class="u-text" font-size="10">+ tglPinjam : Date</text>
        <text x="360" y="278" class="u-text" font-size="10">+ tglKembali : Date</text>
        <line x1="350" y1="288" x2="530" y2="288" class="u-line"/>
        <text x="360" y="308" class="u-text" font-size="10">+ hitungDenda()</text>
        <!-- Buku -->
        <rect x="170" y="395" width="175" height="125" rx="4" class="u-box"/>
        <rect x="170" y="395" width="175" height="30" rx="4" class="u-hd"/>
        <text x="257" y="416" class="u-title" font-size="12">Buku</text>
        <line x1="170" y1="425" x2="345" y2="425" class="u-line"/>
        <text x="180" y="445" class="u-text" font-size="10">+ isbn : String</text>
        <text x="180" y="463" class="u-text" font-size="10">+ judul : String</text>
        <text x="180" y="481" class="u-text" font-size="10">+ tersedia : Boolean</text>
        <line x1="170" y1="491" x2="345" y2="491" class="u-line"/>
        <text x="180" y="511" class="u-text" font-size="10">+ pinjam()</text>
        <!-- Kategori -->
        <rect x="520" y="395" width="160" height="95" rx="4" class="u-box"/>
        <rect x="520" y="395" width="160" height="30" rx="4" class="u-hd"/>
        <text x="600" y="416" class="u-title" font-size="12">Kategori</text>
        <line x1="520" y1="425" x2="680" y2="425" class="u-line"/>
        <text x="530" y="445" class="u-text" font-size="10">+ nama : String</text>
        <text x="530" y="463" class="u-text" font-size="10">+ kode : String</text>
        <!-- pewarisan Pengguna <- Anggota, Petugas -->
        <line x1="137" y1="210" x2="418" y2="113" class="u-line" marker-end="url(#u-triangle)"/>
        <line x1="742" y1="210" x2="462" y2="113" class="u-line" marker-end="url(#u-triangle)"/>
        <!-- asosiasi Anggota - Peminjaman -->
        <line x1="225" y1="268" x2="350" y2="268" class="u-line"/>
        <text x="287" y="258" class="u-lbl" text-anchor="middle">melakukan</text>
        <text x="235" y="286" class="u-text" font-size="10">1</text>
        <text x="322" y="286" class="u-text" font-size="10">0..*</text>
        <!-- komposisi Peminjaman - Buku -->
        <line x1="440" y1="330" x2="257" y2="395" class="u-line" marker-start="url(#u-diamond-fill)"/>
        <text x="315" y="352" class="u-lbl" text-anchor="middle">berisi</text>
        <text x="428" y="352" class="u-text" font-size="10">1</text>
        <text x="268" y="380" class="u-text" font-size="10">1..*</text>
        <!-- asosiasi Buku - Kategori -->
        <line x1="345" y1="455" x2="520" y2="455" class="u-line"/>
        <text x="432" y="445" class="u-lbl" text-anchor="middle">berkategori</text>
        <text x="355" y="473" class="u-text" font-size="10">*</text>
        <text x="500" y="473" class="u-text" font-size="10">1</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 5.7</b> — Class diagram utuh Sistem Perpustakaan: pewarisan, asosiasi, dan komposisi</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Membaca diagram utuh (Gambar 5.7)',
      text: 'Anggota dan Petugas <b>mewarisi</b> Pengguna (segitiga). Satu Anggota melakukan 0..* Peminjaman (asosiasi). Satu Peminjaman <b>memiliki</b> 1..* Buku secara <b>kuat</b> (wajik penuh = komposisi). Satu Buku berkategori (asosiasi banyak-ke-satu). Perhatikan bagaimana multiplicity membaca alur relasinya.'
    },
    {
      type: 'warn',
      title: 'Jangan terlalu detail sekaligus',
      text: 'Class diagram lengkap bisa sangat ramai. Untuk diskusi tingkat tinggi, gambar hanya nama kelas + relasi tanpa atribut. Tambahkan detail (atribut, method) hanya saat tim butuh. Pisahkan per modul bila terlalu lebar.'
    },
    {
      type: 'vocab',
      items: [
        ['Kompartemen', 'Bagian kotak kelas: nama, atribut, operasi.'],
        ['Visibilitas', 'Penanda akses: + (public), - (private), # (protected), ~ (package).'],
        ['Static', 'Anggota milik kelas (garis bawah), bukan tiap objek.'],
        ['Abstract', 'Cetakan belum diimplementasikan (miring).'],
        ['Multiplicity', 'Jumlah di tiap ujung relasi: 1, 0..1, *, 1..*, dst.'],
        ['Komposisi', 'Bagian-dari kuat (wajik penuh); bagian ikut hidup/mati.'],
        ['Agregasi', 'Bagian-dari lemah (wajik terbuka); bagian bisa sendiri.']
      ]
    }
  ],
  recap: [
    'Class diagram = kotak 3 kompartemen (nama, atribut, operasi) + relasi antar kelas.',
    'Visibilitas: + public, - private, # protected, ~ package; static = garis bawah; abstract = miring.',
    'Enam relasi: asosiasi, agregasi (wajik terbuka), komposisi (wajik penuh), generalization (segitiga), realization (segitiga + garis putus), dependensi (garis putus-panah).',
    'Multiplicity membaca "berapa banyak" di tiap ujung relasi.',
    'Class diagram adalah fondasi; jaga tetap ringkas sesuai kebutuhan audiens.'
  ]
});

/* ---------- Pelajaran 2: Object Diagram ---------- */
window.UML_LESSONS.push({
  id: 'object-diagram',
  title: 'Object Diagram: Snapshot Instance',
  chapter: 'Diagram Struktural',
  duration: '10 menit',
  intro: [
    'Bila class diagram adalah <b>cetakan</b>, <b>Object Diagram</b> adalah <b>foto objek nyata</b> pada satu saat. Ia menampilkan <b>instance</b> kelas beserta nilai atributnya yang sudah terisi.',
    'Object diagram berguna untuk menguji class diagram dan memberi contoh data yang mudah dipahami.'
  ],
  objectives: [
    'Membedakan object diagram dari class diagram',
    'Menulis notasi objek (namaObjek : Kelas, digarisbawahi)',
    'Menggunakan object diagram untuk menguji model'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Perbedaan inti: class diagram menunjukkan <b>jenis</b> (tipe), object diagram menunjukkan <b>contoh nyata</b> (instance). Notasi objek ditulis <code>namaObjek : Kelas</code> dan <b>digarisbawahi</b>, sering dengan nilai atribut terisi (mis. <code>judul = "Pemrograman Go"</code>).</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Class vs object diagram">
        <!-- class -->
        <rect x="30" y="40" width="180" height="120" rx="4" class="u-box"/>
        <rect x="30" y="40" width="180" height="32" rx="4" class="u-hd"/>
        <line x1="30" y1="72" x2="210" y2="72" class="u-line"/>
        <text x="120" y="62" class="u-title" font-size="12">Buku</text>
        <text x="42" y="96" class="u-text" font-size="10">+ judul : String</text>
        <text x="42" y="116" class="u-text" font-size="10">+ tersedia : Boolean</text>
        <text x="120" y="185" class="u-lbl" text-anchor="middle">CLASS (cetakan/tipe)</text>
        <!-- object -->
        <rect x="400" y="40" width="300" height="120" rx="4" class="u-box"/>
        <rect x="400" y="40" width="300" height="32" rx="4" class="u-hd" style="fill:var(--green-soft);stroke:var(--green)"/>
        <line x1="400" y1="72" x2="700" y2="72" class="u-line"/>
        <text x="550" y="62" class="u-title" font-size="12" style="text-decoration:underline">buku1 : Buku</text>
        <text x="412" y="96" class="u-text" font-size="10">judul = "Pemrograman Go"</text>
        <text x="412" y="116" class="u-text" font-size="10">tersedia = true</text>
        <text x="550" y="185" class="u-lbl" text-anchor="middle">OBJECT (instance/nilai nyata)</text>
        <line x1="215" y1="100" x2="395" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="305" y="90" class="u-lbl" text-anchor="middle">instance</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 6.1</b> — Class (tipe) vs Object (instance dengan nilai nyata)</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Object diagram paling berguna untuk <b>mengecek</b> apakah class diagram masuk akal. Contoh berikut menampilkan beberapa objek yang saling terhubung — sebuah "snapshot" peminjaman yang sedang berjalan:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 820 260" width="820" role="img" aria-label="Object diagram peminjaman">
        <rect x="30" y="50" width="190" height="90" rx="4" class="u-box"/>
        <rect x="30" y="50" width="190" height="28" rx="4" class="u-hd"/>
        <line x1="30" y1="78" x2="220" y2="78" class="u-line"/>
        <text x="125" y="70" class="u-title" font-size="11" style="text-decoration:underline">andi : Anggota</text>
        <text x="42" y="100" class="u-text" font-size="10">idAnggota = "A-001"</text>
        <text x="42" y="120" class="u-text" font-size="10">nama = "Andi"</text>
        <rect x="320" y="50" width="200" height="90" rx="4" class="u-box"/>
        <rect x="320" y="50" width="200" height="28" rx="4" class="u-hd"/>
        <line x1="320" y1="78" x2="520" y2="78" class="u-line"/>
        <text x="420" y="70" class="u-title" font-size="11" style="text-decoration:underline">pjm9 : Peminjaman</text>
        <text x="332" y="100" class="u-text" font-size="10">tglPinjam = 12 Mei</text>
        <text x="332" y="120" class="u-text" font-size="10">tglKembali = 26 Mei</text>
        <rect x="610" y="50" width="190" height="90" rx="4" class="u-box"/>
        <rect x="610" y="50" width="190" height="28" rx="4" class="u-hd"/>
        <line x1="610" y1="78" x2="800" y2="78" class="u-line"/>
        <text x="705" y="70" class="u-title" font-size="11" style="text-decoration:underline">buku7 : Buku</text>
        <text x="622" y="100" class="u-text" font-size="10">isbn = "978-1"</text>
        <text x="622" y="120" class="u-text" font-size="10">tersedia = false</text>
        <line x1="220" y1="95" x2="320" y2="95" class="u-line"/>
        <text x="270" y="85" class="u-lbl" text-anchor="middle">melakukan</text>
        <line x1="520" y1="95" x2="610" y2="95" class="u-line"/>
        <text x="565" y="85" class="u-lbl" text-anchor="middle">berisi</text>
        <text x="125" y="180" class="u-lbl" text-anchor="middle">Instance nyata saling terhubung pada satu saat</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 6.2</b> — Object diagram: snapshot satu skenario peminjaman dengan nilai atribut terisi</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Kapan dipakai?',
      text: 'Saat kamu ingin <b>mengetes</b> apakah relasi dan multiplicity di class diagram benar (dengan "memerankan" beberapa objek), atau saat <b>menjelaskan</b> data contoh kepada tim/klien agar model terasa nyata. Untuk dokumentasi produksi, object diagram lebih jarang dipakai dibanding class diagram.'
    },
    {
      type: 'vocab',
      items: [
        ['Instance', 'Objek nyata hasil pembuatan dari sebuah kelas.'],
        ['Snapshot', 'Kondisi objek pada satu titik waktu tertentu.'],
        ['Nama objek', 'Ditulis namaObjek : Kelas dan digarisbawahi.'],
        ['Nilai atribut', 'Isi data nyata per atribut (mis. judul = "Pemrograman Go").']
      ]
    }
  ],
  recap: [
    'Object diagram = foto instance objek pada satu saat; class diagram = cetakan/tipe.',
    'Notasi objek: namaObjek : Kelas, digarisbawahi, dengan nilai atribut terisi.',
    'Berguna untuk menguji class diagram dan menjelaskan data contoh.'
  ]
});

/* ---------- Pelajaran 3: Package Diagram ---------- */
window.UML_LESSONS.push({
  id: 'package-diagram',
  title: 'Package Diagram: Mengelompokkan Elemen',
  chapter: 'Diagram Struktural',
  duration: '10 menit',
  intro: [
    'Saat sistem besar, ratusan kelas akan berantakan dalam satu diagram. <b>Package Diagram</b> membantu dengan <b>mengelompokkan</b> elemen ke dalam "folder" (paket) dan menunjukkan ketergantungan antar paket.',
    'Ini alat untuk berpikir pada level <b>arsitektur</b>, bukan detail kelas.'
  ],
  objectives: [
    'Memahami notasi paket (folder)',
    'Membaca dependensi antar paket',
    'Mengelompokkan kelas menjadi paket yang logis'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Paket (package)</b> adalah wadah pengelompok elemen UML (kelas, diagram, dsb). Notasinya seperti <b>folder</b>: kotak dengan tab kecil di atas. Di dalamnya bisa tertulis nama kelas-kelas anggotanya.</p><p>Hubungan antar paket yang paling umum adalah <b>dependency</b> (garis putus-panah): "paket ini memakai/menggantung pada paket itu".</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Package diagram dependensi">
        <!-- paket domain -->
        <path d="M40 60 h60 v20 h180 v140 h-240 z" class="u-box"/>
        <text x="70" y="76" class="u-title" font-size="11">domain</text>
        <line x1="40" y1="88" x2="280" y2="88" class="u-line"/>
        <text x="55" y="112" class="u-text" font-size="10">Buku</text>
        <text x="55" y="132" class="u-text" font-size="10">Anggota</text>
        <text x="55" y="152" class="u-text" font-size="10">Peminjaman</text>
        <!-- paket service -->
        <path d="M360 60 h80 v20 h200 v140 h-280 z" class="u-box"/>
        <text x="392" y="76" class="u-title" font-size="11">service</text>
        <line x1="360" y1="88" x2="640" y2="88" class="u-line"/>
        <text x="375" y="112" class="u-text" font-size="10">LayananPinjam</text>
        <text x="375" y="132" class="u-text" font-size="10">LayananCari</text>
        <!-- paket ui -->
        <path d="M40 235 h50 v18 h150 v45 h-200 z" class="u-box"/>
        <text x="62" y="250" class="u-title" font-size="11">ui</text>
        <line x1="40" y1="258" x2="240" y2="258" class="u-line"/>
        <text x="52" y="276" class="u-text" font-size="10">HalamanPinjam</text>
        <!-- dependensi -->
        <line x1="240" y1="130" x2="360" y2="130" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="300" y="120" class="u-lbl" text-anchor="middle">«use»</text>
        <line x1="140" y1="233" x2="140" y2="205" class="u-dash" marker-end="url(#u-arrow)"/>
        <line x1="140" y1="205" x2="500" y2="205" class="u-dash"/>
        <line x1="500" y1="205" x2="500" y2="203" class="u-dash" marker-end="url(#u-arrow)"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 7.1</b> — Package diagram: paket ui → service → domain dengan relasi «use»</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Dua relasi paket yang sering muncul:</p><ul><li><b>Dependency («use»)</b> — garis putus-panah; paket sumber memakai isi paket tujuan.</li><li><b>Merge package</b> — paket menggabungkan definisi dari paket lain (banyak dipakai di profil &amp; tool).</li></ul><p>Prinsip arsitektur yang baik: arah ketergantungan sebaiknya menuju ke <b>pola dasar</b> (domain), bukan sebaliknya — agar domain tidak "tahu" tentang UI/infrastruktur.</p>'
    },
    {
      type: 'tip',
      title: 'Kapan dipakai?',
      text: 'Saat proyek mulai besar dan perlu dipecah jadi modul (mis. domain, service, ui, persistence, dsb), atau saat ingin memperlihatkan <b>peta arsitektur</b> sistem kepada tim tanpa menampilkan ratusan kelas sekaligus.'
    },
    {
      type: 'vocab',
      items: [
        ['Paket (package)', 'Wadah pengelompok elemen; notasi folder dengan tab.'],
        ['Dependency «use»', 'Paket sumber memakai isi paket tujuan (garis putus-panah).'],
        ['Merge package', 'Paket menggabungkan definisi dari paket lain.'],
        ['Arah ketergantungan', 'Sebaiknya menuju paket dasar (domain) agar arsitektur bersih.']
      ]
    }
  ],
  recap: [
    'Package Diagram mengelompokkan elemen ke "folder" (paket) dan menunjukkan ketergantungannya.',
    'Relasi utama: dependency «use» (garis putus-panah); ada pula merge package.',
    'Arah ketergantungan yang baik menuju paket dasar (domain), bukan sebaliknya.',
    'Dipakai untuk berpikir pada level arsitektur sistem besar.'
  ]
});
