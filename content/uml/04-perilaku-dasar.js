/* ============================================================
   Pelajaran UML — Bab 3: Diagram Perilaku (Dasar)
   (topik info.md:
    - "Use Case Diagram"
    - "Activity Diagram"
    - "State Machine Diagram")
   ============================================================ */
'use strict';

window.UML_LESSONS = window.UML_LESSONS || [];

/* ---------- Pelajaran 1: Use Case Diagram ---------- */
window.UML_LESSONS.push({
  id: 'use-case-diagram',
  title: 'Use Case Diagram: Menerjemahkan Kebutuhan',
  chapter: 'Diagram Perilaku',
  duration: '15 menit',
  intro: [
    'Sebelum merancang struktur, kita perlu tahu <b>APA yang dilakukan pengguna</b> terhadap sistem. <b>Use Case Diagram</b> adalah alatnya: cara paling cepat menangkap kebutuhan sistem dari sudut pandang pengguna.',
    'Pelajaran ini menjelaskan aktor, use case, batas sistem, dan seluruh relasinya (asosiasi, «include», «extend», generalization) lengkap dengan contoh.'
  ],
  objectives: [
    'Memahami aktor, use case, dan batas sistem',
    'Membedakan relasi asosiasi, «include», dan «extend»',
    'Menggambar Use Case Diagram yang baik',
    'Menulis use case yang bermakna'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Use Case Diagram menjawab pertanyaan sederhana namun penting: <b>siapa</b> yang memakai sistem, dan <b>apa saja</b> yang bisa mereka lakukan dengannya? Tiga elemen utamanya:</p><ul><li><b>Aktor</b> — pihak luar yang berinteraksi dengan sistem (digambar figur orang). Bisa manusia, sistem lain, atau perangkat.</li><li><b>Use case</b> — satu fungsi/layanan yang diberikan sistem (digambar oval), mis. "Pinjam Buku".</li><li><b>Batas sistem</b> — kotak yang membatasi cakupan sistem (apa yang DI dalam dan DI luar sistem).</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 720 380" width="720" role="img" aria-label="Use case dasar Sistem Perpustakaan">
        <rect x="180" y="20" width="400" height="340" rx="10" class="u-box"/>
        <text x="380" y="48" class="u-title">Sistem Perpustakaan</text>
        <line x1="180" y1="60" x2="580" y2="60" class="u-line"/>
        <!-- aktor kiri -->
        <circle cx="80" cy="150" r="14" class="u-box"/>
        <line x1="80" y1="164" x2="80" y2="200" class="u-line"/>
        <line x1="58" y1="176" x2="102" y2="176" class="u-line"/>
        <line x1="80" y1="200" x2="62" y2="230" class="u-line"/>
        <line x1="80" y1="200" x2="98" y2="230" class="u-line"/>
        <text x="80" y="252" class="u-title" font-size="12">Anggota</text>
        <!-- use cases -->
        <ellipse cx="360" cy="120" rx="100" ry="28" class="u-hd"/>
        <text x="360" y="126" class="u-title" font-size="12">Cari Buku</text>
        <ellipse cx="360" cy="200" rx="100" ry="28" class="u-hd"/>
        <text x="360" y="206" class="u-title" font-size="12">Pinjam Buku</text>
        <ellipse cx="360" cy="285" rx="100" ry="28" class="u-hd"/>
        <text x="360" y="291" class="u-title" font-size="12">Kembalikan Buku</text>
        <!-- asosiasi -->
        <line x1="94" y1="165" x2="262" y2="126" class="u-line"/>
        <line x1="94" y1="182" x2="262" y2="200" class="u-line"/>
        <line x1="94" y1="205" x2="262" y2="282" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 12.1</b> — Use case dasar: aktor Anggota berinteraksi dengan tiga layanan sistem</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Yang membuat use case powerful adalah <b>relasi</b> antar use case dan antar aktor. Ada empat jenis:</p><table class="vocab"><tr><th>Relasi</th><th>Simbol</th><th>Makna</th></tr><tr><td>Asosiasi</td><td>Garis lurus</td><td>Aktor memakai use case.</td></tr><tr><td>«include»</td><td>Garis putus + panah</td><td>Use case <b>wajib</b> memanggil use case lain (langkah pasti terjadi).</td></tr><tr><td>«extend»</td><td>Garis putus + panah</td><td>Use case <b>opsional</b> menambah use case lain bila syarat terpenuhi.</td></tr><tr><td>Generalization</td><td>Garis + segitiga</td><td>Pewarisan: aktor/use case anak mewarisi induk.</td></tr></table>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 760 440" width="760" role="img" aria-label="Use case dengan include dan extend">
        <rect x="180" y="20" width="430" height="400" rx="10" class="u-box"/>
        <text x="395" y="48" class="u-title">Sistem Perpustakaan</text>
        <line x1="180" y1="60" x2="610" y2="60" class="u-line"/>
        <circle cx="80" cy="140" r="13" class="u-box"/>
        <line x1="80" y1="153" x2="80" y2="185" class="u-line"/>
        <line x1="60" y1="164" x2="100" y2="164" class="u-line"/>
        <line x1="80" y1="185" x2="64" y2="212" class="u-line"/>
        <line x1="80" y1="185" x2="96" y2="212" class="u-line"/>
        <text x="80" y="232" class="u-title" font-size="12">Anggota</text>
        <ellipse cx="380" cy="150" rx="105" ry="28" class="u-hd"/>
        <text x="380" y="156" class="u-title" font-size="12">Pinjam Buku</text>
        <ellipse cx="380" cy="250" rx="105" ry="28" class="u-box"/>
        <text x="380" y="256" class="u-title" font-size="12">Cek Kelayakan</text>
        <ellipse cx="380" cy="350" rx="105" ry="28" class="u-box"/>
        <text x="380" y="356" class="u-title" font-size="12">Hitung Denda</text>
        <line x1="93" y1="150" x2="275" y2="150" class="u-line"/>
        <!-- include -->
        <line x1="380" y1="178" x2="380" y2="222" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="470" y="205" class="u-lbl">«include»</text>
        <!-- extend -->
        <line x1="380" y1="322" x2="380" y2="278" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="470" y="305" class="u-lbl">«extend»</text>
        <text x="380" y="392" class="u-lbl" text-anchor="middle">syarat: terlambat</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 12.2</b> — «include» (wajib: Cek Kelayakan) vs «extend» (opsional: Hitung Denda)</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Kapan «include» vs «extend»?',
      text: 'Tanyakan: <b>langkah ini SELALU terjadi?</b> Kalau ya → «include» (setiap pinjam pasti cek kelayakan). <b>Hanya kadang terjadi?</b> Kalau ya → «extend» (denda hanya bila terlambat). «extend» hampir selalu punya <b>guard</b> (syarat).'
    },
    {
      type: 'text',
      html: '<p><b>Generalization</b> memungkinkan aktor/use case khusus mewarisi umum. Contoh: Mahasiswa dan Dosen adalah bentuk khusus dari Anggota; atau "Pinjam Fisik" mewarisi "Pinjam":</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 620 320" width="620" role="img" aria-label="Generalization aktor dan use case">
        <!-- aktor induk & anak -->
        <circle cx="60" cy="90" r="12" class="u-box"/>
        <line x1="60" y1="102" x2="60" y2="128" class="u-line"/>
        <line x1="42" y1="110" x2="78" y2="110" class="u-line"/>
        <text x="60" y="146" class="u-title" font-size="11">Anggota</text>
        <circle cx="60" cy="190" r="12" class="u-box"/>
        <line x1="60" y1="202" x2="60" y2="226" class="u-line"/>
        <line x1="42" y1="210" x2="78" y2="210" class="u-line"/>
        <text x="60" y="244" class="u-title" font-size="11">Mahasiswa</text>
        <line x1="60" y1="158" x2="60" y2="178" class="u-line" marker-end="url(#u-triangle)"/>
        <rect x="220" y="60" width="360" height="220" rx="10" class="u-box"/>
        <text x="400" y="86" class="u-title" font-size="12">Sistem Perpustakaan</text>
        <ellipse cx="400" cy="140" rx="100" ry="26" class="u-hd"/>
        <text x="400" y="146" class="u-title" font-size="11">Pinjam (umum)</text>
        <ellipse cx="400" cy="230" rx="100" ry="26" class="u-box"/>
        <text x="400" y="236" class="u-title" font-size="11">Pinjam Fisik</text>
        <line x1="400" y1="166" x2="400" y2="204" class="u-line" marker-end="url(#u-triangle)"/>
        <line x1="72" y1="100" x2="298" y2="140" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 12.3</b> — Generalization pada aktor (Mahasiswa → Anggota) dan use case (Pinjam Fisik → Pinjam)</figcaption></figure>`
    },
    {
      type: 'vocab',
      items: [
        ['Aktor', 'Pihak luar (orang/sistem/perangkat) yang berinteraksi dengan sistem.'],
        ['Use case', 'Satu fungsi/layanan bernilai yang diberikan sistem kepada aktor.'],
        ['Batas sistem', 'Kotak yang memisahkan apa yang diurus sistem dari lingkungan luar.'],
        ['«include»', 'Relasi wajib: use case memanggil use case lain yang pasti terjadi.'],
        ['«extend»', 'Relasi opsional: use case menambah use case lain bila guard terpenuhi.']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan terjebak detail',
      text: 'Use case adalah <b>tujuan pengguna yang bernilai</b>, bukan langkah klik kecil. "Pinjam Buku" bagus; "Klik Tombol Submit" tidak. Batasi aktor &amp; use case agar diagram tetap terbaca — detail teknis disimpan di diagram lain (sequence, activity).'
    }
  ],
  recap: [
    'Use Case Diagram = aktor + use case + batas sistem; menjawab APA yang dilakukan pengguna.',
    'Asosiasi = garis lurus; generalization = segitiga (pewarisan).',
    '«include» = langkah wajib; «extend» = langkah opsional bersyarat (guard).',
    'Tulis use case sebagai tujuan bernilai pengguna, bukan langkah klik kecil.'
  ]
});

/* ---------- Pelajaran 2: Activity Diagram ---------- */
window.UML_LESSONS.push({
  id: 'activity-diagram',
  title: 'Activity Diagram: Memetakan Alur Kerja',
  chapter: 'Diagram Perilaku',
  duration: '14 menit',
  intro: [
    'Untuk menggambarkan <b>bagaimana sebuah proses berjalan</b> dari awal sampai akhir — lengkap dengan keputusan dan pekerjaan paralel — kita memakai <b>Activity Diagram</b>.',
    'Mirip flowchart, tapi lebih powerful: mendukung paralelisme (fork/join), pembagian peran (swarm lane), dan guard. Cocok untuk memetakan proses bisnis.'
  ],
  objectives: [
    'Mengenali elemen activity diagram (initial, action, decision, final)',
    'Membedakan decision, merge, fork, dan join',
    'Menggunakan swimlane untuk membagi peran',
    'Menerjemahkan proses bisnis menjadi activity diagram'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Activity Diagram dimulai dari <b>initial node</b> (lingkaran hitam), mengalir melalui <b>action</b> (oval memanjang), bisa bercabang di <b>decision node</b> (belah ketupat dengan guard), dan berakhir di <b>activity final node</b> (lingkaran berlapis).</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 640 420" width="640" role="img" aria-label="Activity diagram peminjaman">
        <circle cx="300" cy="40" r="12" class="u-arw-fill"/>
        <line x1="300" y1="52" x2="300" y2="80" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="200" y="82" width="200" height="44" rx="22" class="u-box"/>
        <text x="300" y="110" class="u-title" font-size="12">Ajukan Peminjaman</text>
        <line x1="300" y1="126" x2="300" y2="158" class="u-line" marker-end="url(#u-arrow)"/>
        <polygon points="300,160 340,200 300,240 260,200" class="u-hd"/>
        <text x="352" y="196" class="u-lbl">[kelayakan ok]</text>
        <text x="252" y="196" class="u-lbl" text-anchor="end">[tidak]</text>
        <!-- cabang kiri: tolak -->
        <line x1="260" y1="200" x2="150" y2="200" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="40" y="178" width="110" height="44" rx="22" class="u-box"/>
        <text x="95" y="206" class="u-title" font-size="11">Tolak</text>
        <!-- cabang bawah: proses -->
        <line x1="300" y1="240" x2="300" y2="280" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="200" y="282" width="200" height="44" rx="22" class="u-box"/>
        <text x="300" y="310" class="u-title" font-size="12">Catat Peminjaman</text>
        <line x1="300" y1="326" x2="300" y2="360" class="u-line" marker-end="url(#u-arrow)"/>
        <!-- merge -->
        <polygon points="300,360 322,382 300,404 278,382" class="u-box"/>
        <line x1="95" y1="222" x2="278" y2="380" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 13.1</b> — Activity Diagram: decision node dengan guard [kelayakan ok]/[tidak] dan merge</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Empat elemen pengendali alur yang perlu kamu kuasai:</p><table class="vocab"><tr><th>Elemen</th><th>Simbol</th><th>Fungsi</th></tr><tr><td>Decision</td><td>Belah ketupat (1 masuk, banyak keluar)</td><td>Membagi alur berdasarkan guard [syarat].</td></tr><tr><td>Merge</td><td>Belah ketupat (banyak masuk, 1 keluar)</td><td>Menyatukan kembali alur yang tercabang.</td></tr><tr><td>Fork</td><td>Bilah tebal (1 masuk, banyak keluar)</td><td>Memulai <b>paralelisme</b> — beberapa alur berjalan bersamaan.</td></tr><tr><td>Join</td><td>Bilah tebal (banyak masuk, 1 keluar)</td><td>Menunggu semua alur paralel selesai.</td></tr></table>'
    },
    {
      type: 'text',
      html: '<p><b>Swimlane</b> (kolom/baris) membagi aksi menurut <b>siapa yang bertanggung jawab</b>. Ini membuat jelas peran tiap aktor dalam satu proses:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 720 360" width="720" role="img" aria-label="Activity dengan swimlane">
        <rect x="20" y="20" width="680" height="320" rx="8" class="u-box"/>
        <line x1="360" y1="20" x2="360" y2="340" class="u-line"/>
        <text x="190" y="48" class="u-title" font-size="12">Anggota</text>
        <text x="540" y="48" class="u-title" font-size="12">Petugas</text>
        <line x1="20" y1="60" x2="700" y2="60" class="u-line"/>
        <circle cx="190" cy="90" r="10" class="u-arw-fill"/>
        <line x1="190" y1="100" x2="190" y2="122" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="105" y="124" width="170" height="40" rx="20" class="u-box"/>
        <text x="190" y="149" class="u-title" font-size="11">Isi Formulir</text>
        <line x1="190" y1="164" x2="190" y2="196" class="u-line"/>
        <line x1="190" y1="196" x2="470" y2="196" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="450" y="176" width="180" height="40" rx="20" class="u-box"/>
        <text x="540" y="201" class="u-title" font-size="11">Verifikasi &amp; Setujui</text>
        <line x1="540" y1="216" x2="540" y2="250" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="450" y="252" width="180" height="40" rx="20" class="u-box"/>
        <text x="540" y="277" class="u-title" font-size="11">Proses Pinjam</text>
      </svg></div><figcaption class="uml-cap"><b>Gambar 13.2</b> — Swimlane membagi tanggung jawab antara Anggota dan Petugas</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p><b>Fork &amp; Join</b> menggambarkan pekerjaan paralel. Contoh: saat mendaftar, sistem bisa mengirim email <b>dan</b> membuat kartu secara bersamaan, lalu menunggu keduanya selesai:</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 560 320" width="560" role="img" aria-label="Fork dan join paralel">
        <circle cx="280" cy="30" r="10" class="u-arw-fill"/>
        <line x1="280" y1="40" x2="280" y2="72" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="190" y="74" width="180" height="38" rx="19" class="u-box"/>
        <text x="280" y="98" class="u-title" font-size="11">Daftar Anggota</text>
        <!-- fork -->
        <rect x="120" y="132" width="320" height="10" rx="3" class="u-arw-fill"/>
        <line x1="280" y1="112" x2="280" y2="132" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="180" y1="142" x2="180" y2="170" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="142" x2="380" y2="170" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="110" y="172" width="140" height="38" rx="19" class="u-box"/>
        <text x="180" y="196" class="u-title" font-size="11">Kirim Email</text>
        <rect x="310" y="172" width="140" height="38" rx="19" class="u-box"/>
        <text x="380" y="196" class="u-title" font-size="11">Cetak Kartu</text>
        <line x1="180" y1="210" x2="180" y2="238" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="210" x2="380" y2="238" class="u-line" marker-end="url(#u-arrow)"/>
        <!-- join -->
        <rect x="120" y="240" width="320" height="10" rx="3" class="u-arw-fill"/>
        <line x1="280" y1="250" x2="280" y2="278" class="u-line" marker-end="url(#u-arrow)"/>
        <circle cx="280" cy="292" r="12" class="u-box"/>
        <circle cx="280" cy="292" r="6" class="u-arw-fill"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 13.3</b> — Fork (memulai paralel) &amp; Join (menunggu semua selesai)</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Activity vs Flowchart',
      text: 'Secara visual mirip, tetapi activity diagram UML mendukung <b>paralelisme (fork/join)</b>, <b>swimlane peran</b>, dan <b>action pin</b> — hal yang flowchart klasik tidak punya. Untuk memetakan proses bisnis, activity diagram lebih ekspresif.'
    },
    {
      type: 'vocab',
      items: [
        ['Initial node', 'Lingkaran hitam penuh — titik mulai alur.'],
        ['Action', 'Satu langkah kerja (oval memanjang), mis. "Catat Peminjaman".'],
        ['Decision / Merge', 'Belah ketupat: decision membagi (guard), merge menyatukan.'],
        ['Fork / Join', 'Bilah tebal: fork memulai paralel, join menunggu semua cabang.'],
        ['Swarm lane', 'Kolom peran yang membagi siapa bertanggung jawab atas aksi.']
      ]
    }
  ],
  recap: [
    'Activity Diagram memetakan alur kerja/proses dari awal sampai akhir.',
    'Decision (belah ketupat + guard) membagi alur; merge menyatukannya.',
    'Fork &amp; join (bilah tebal) mengatur pekerjaan paralel.',
    'Swarm lane membagi aksi menurut peran yang bertanggung jawab.'
  ]
});

/* ---------- Pelajaran 3: State Machine Diagram ---------- */
window.UML_LESSONS.push({
  id: 'state-machine-diagram',
  title: 'State Machine Diagram: Siklus Hidup Objek',
  chapter: 'Diagram Perilaku',
  duration: '13 menit',
  intro: [
    'Aktivitas menggambarkan alur <b>proses</b>; <b>State Machine Diagram</b> (diagram mesin status) menggambarkan <b>siklus hidup satu objek</b>: status apa saja yang bisa ia tempati dan apa yang menyebabkan perpindahan.',
    'Cocok untuk objek yang melewati banyak status, mis. pesanan (dibayar → dikirim → sampai) atau buku (tersedia → dipinjam → terlambat).'
  ],
  objectives: [
    'Memahami konsep state, event, dan transisi',
    'Menggunakan guard dan action pada transisi',
    'Menggambar initial dan final state',
    'Menerapkan state machine pada objek nyata'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tiga konsep inti:</p><ul><li><b>State (status)</b> — kondisi objek di mana ia menunjukkan perilaku berbeda (kotak membulat).</li><li><b>Event</b> — pemicu yang menyebabkan perpindahan status (ditulis di garis panah).</li><li><b>Transisi</b> — panah penghubung antar state, bisa punya <b>guard</b> [syarat] dan <b>action</b> /tindakan.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 720 260" width="720" role="img" aria-label="State machine buku">
        <circle cx="30" cy="120" r="11" class="u-arw-fill"/>
        <line x1="41" y1="120" x2="98" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="100" y="95" width="130" height="50" rx="10" class="u-hd"/>
        <text x="165" y="125" class="u-title" font-size="12">Tersedia</text>
        <line x1="230" y1="120" x2="320" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="275" y="110" class="u-lbl" text-anchor="middle">pinjam</text>
        <rect x="322" y="95" width="130" height="50" rx="10" class="u-box"/>
        <text x="387" y="125" class="u-title" font-size="12">Dipinjam</text>
        <line x1="452" y1="120" x2="540" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="496" y="110" class="u-lbl" text-anchor="middle">kembali</text>
        <rect x="542" y="95" width="130" height="50" rx="10" class="u-hd"/>
        <text x="607" y="125" class="u-title" font-size="12">Arsip</text>
        <!-- transisi balik -->
        <path d="M387 145 Q387 200 165 200 Q165 160 165 145" class="u-dash" marker-end="url(#u-arrow)" fill="none"/>
        <text x="275" y="215" class="u-lbl" text-anchor="middle">kembali [telat] / hitungDenda</text>
        <!-- final -->
        <circle cx="690" cy="120" r="11" class="u-box"/>
        <circle cx="690" cy="120" r="5" class="u-arw-fill"/>
        <line x1="672" y1="120" x2="678" y2="120" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 14.1</b> — State Machine siklus hidup Buku dengan event, guard [telat], dan action /hitungDenda</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<p>Struktur lengkap sebuah transisi: <code>event [guard] / action</code>. Contoh: <code>kembali [telat] / hitungDenda</code> dibaca: "saat event <b>kembali</b> terjadi, <b>jika</b> telat, <b>maka</b> jalankan hitungDenda". Selain itu ada <b>initial state</b> (titik hitam) dan <b>final state</b> (bullseye).</p>'
    },
    {
      type: 'text',
      html: '<p><b>Nested (state bersarang)</b> memungkinkan satu state berisi sub-state. Contoh: status "Dipinjam" bisa bersarang menjadi "Normal" atau "Terlambat":</p>'
    },
    {
      type: 'text',
      html: `<figure class="uml-fig"><div class="uml-scroll"><svg viewBox="0 0 640 300" width="640" role="img" aria-label="Composite state bersarang">
        <rect x="280" y="30" width="320" height="230" rx="12" class="u-box"/>
        <text x="440" y="58" class="u-title" font-size="13">Dipinjam (state induk)</text>
        <line x1="280" y1="70" x2="600" y2="70" class="u-line"/>
        <circle cx="310" cy="110" r="8" class="u-arw-fill"/>
        <line x1="318" y1="110" x2="348" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="350" y="88" width="110" height="44" rx="8" class="u-hd"/>
        <text x="405" y="115" class="u-title" font-size="11">Normal</text>
        <line x1="460" y1="110" x2="500" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="480" y="100" class="u-lbl" text-anchor="middle">telat</text>
        <rect x="502" y="88" width="80" height="44" rx="8" class="u-box" style="fill:var(--red-soft);stroke:var(--red)"/>
        <text x="542" y="115" class="u-title" font-size="11">Telat</text>
        <!-- initial luar -->
        <circle cx="60" cy="120" r="10" class="u-arw-fill"/>
        <line x1="70" y1="120" x2="278" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="170" y="108" class="u-lbl" text-anchor="middle">pinjam</text>
        <!-- keluar -->
        <line x1="600" y1="120" x2="620" y2="120" class="u-line"/>
      </svg></div><figcaption class="uml-cap"><b>Gambar 14.2</b> — Composite state: "Dipinjam" bersarang menjadi sub-state Normal / Telat</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Activity vs State Machine',
      text: 'Mudah tertukar. <b>Activity</b> = alur <b>proses/kegiatan</b> (langkah kerja, bisa paralel). <b>State Machine</b> = siklus hidup <b>satu objek</b> (status yang berubah karena event). Bila yang kamu pikirkan "status/keadaan", pakai state machine; bila "proses/urutan kerja", pakai activity.'
    },
    {
      type: 'vocab',
      items: [
        ['State', 'Kondisi objek saat menunjukkan perilaku tertentu (kotak membulat).'],
        ['Event', 'Pemicu perpindahan status (mis. pinjam, kembali).'],
        ['Transisi', 'Penghubung antar state: event [guard] / action.'],
        ['Guard', 'Syarat bersyarat dalam kurung siku [ ] yang harus terpenuhi.'],
        ['Initial / Final', 'Titik hitam (mulai) dan bullseye (selesai) siklus hidup.']
      ]
    },
    {
      type: 'warn',
      title: 'Satu objek, banyak status',
      text: 'State machine menggambarkan <b>satu jenis objek</b> (mis. satu Buku atau satu Peminjaman), bukan keseluruhan sistem. Untuk melihat banyak objek saling berkolaborasi, gunakan Sequence Diagram.'
    }
  ],
  recap: [
    'State Machine Diagram menggambarkan siklus hidup satu objek: state, event, transisi.',
    'Transisi ditulis event [guard] / action.',
    'Initial state = titik hitam; final state = bullseye; state bisa bersarang (composite).',
    'Bedakan dari activity: state machine = status objek; activity = alur proses.'
  ]
});
