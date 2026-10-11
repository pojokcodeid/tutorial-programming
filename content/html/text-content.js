/* ============================================================
   Pelajaran HTML — Bab 2: Konten Teks (L5–L8)
   ============================================================ */
'use strict';

window.HTML_LESSONS = window.HTML_LESSONS || [];

window.HTML_LESSONS.push({
  id: 'format-teks',
  title: 'Memformat Teks',
  chapter: 'Konten Teks',
  duration: '7 menit',
  intro: [
    'Tidak semua teks di halaman web itu rata dan polos. HTML menyediakan tag untuk menekankan kata, menandai, mencoret, dan bahkan menulis rumus kimia.'
  ],
  objectives: [
    'Menebalkan dan memiringkan teks dengan cara yang benar',
    'Mengenal tag format lainnya: mark, small, del, ins, sub, sup',
    'Membedakan &lt;strong&gt;/&lt;b&gt; dan &lt;em&gt;/&lt;i&gt;'
  ],
  sections: [
    {
      type: 'example',
      title: 'Tag-tag format teks',
      lang: 'html',
      output: true,
      code: `<p><strong>Teks tebal</strong> untuk hal penting.</p>
<p><em>Teks miring</em> untuk penekanan.</p>
<p><u>Garis bawah</u> dan <mark>teks disorot</mark>.</p>
<p><small>Teks kecil</small> untuk catatan kaki.</p>
<p>Harga lama <del>Rp50.000</del> jadi <ins>Rp40.000</ins>.</p>
<p>Rumus air: H<sub>2</sub>O. Luas: 10<sup>2</sup> m&sup2;.</p>
<p>Pakai <code>code</code> untuk menulis kode.</p>`,
      explain: [
        '<b>&lt;strong&gt;</b> = penting (tebal). <b>&lt;b&gt;</b> = sekadar tebal tanpa makna — utamakan strong.',
        '<b>&lt;em&gt;</b> = penekanan (miring). <b>&lt;i&gt;</b> = sekadar miring (mis. istilah asing).',
        '<b>&lt;mark&gt;</b> menyorot teks seperti stabilo; <b>&lt;small&gt;</b> membuat teks kecil.',
        '<b>&lt;del&gt;</b> = dicoret (teks dihapus), <b>&lt;ins&gt;</b> = disisipkan (garis bawah).',
        '<b>&lt;sub&gt;</b> = subscript (di bawah), <b>&lt;sup&gt;</b> = superscript (di atas).',
        '<b>&lt;code&gt;</b> menampilkan kode dengan huruf monospace.'
      ]
    },
    {
      type: 'tip',
      title: 'Makna itu penting',
      text: 'Pilih tag berdasarkan <b>makna</b>, bukan sekadar tampilan. &lt;strong&gt; menandakan kepentingan (dibaca dengan nada tegas oleh pembaca layar), sedangkan &lt;b&gt; hanya tampilan. Kalau kamu hanya ingin tampilan, nanti CSS yang mengurusnya.'
    },
    {
      type: 'live',
      title: 'Coba: format paragraf favoritmu',
      lang: 'html',
      hint: 'Kombinasikan strong, em, mark, dan code dalam satu paragraf.',
      initial: `<p>Hari ini saya belajar <strong>HTML</strong> dengan <em>sangat menyenangkan</em>.</p>
<p>Jangan lupa, tag <code>&lt;br&gt;</code> itu untuk pindah baris.</p>`
    }
  ],
  recap: [
    '&lt;strong&gt; (penting) dan &lt;em&gt; (penekanan) membawa makna; &lt;b&gt; dan &lt;i&gt; hanya tampilan.',
    '&lt;mark&gt;, &lt;small&gt;, &lt;del&gt;, &lt;ins&gt;, &lt;sub&gt;, &lt;sup&gt;, &lt;code&gt; melengkapi format teks.',
    'Gunakan tag berdasarkan makna, biarkan tampilan diurus CSS.'
  ]
});

window.HTML_LESSONS.push({
  id: 'link',
  title: 'Link (Tautan)',
  chapter: 'Konten Teks',
  duration: '7 menit',
  intro: [
    'Tautan adalah jantung dunia web — tanpa tautan, halaman-halaman tidak pernah saling terhubung. Di HTML, tautan dibuat dengan tag <b>&lt;a&gt;</b> (anchor).'
  ],
  objectives: [
    'Membuat tautan ke situs lain dan ke halaman sendiri',
    'Mengenal target="_blank" agar terbuka di tab baru',
    'Menggunakan tautan khusus (email, telepon, bagian halaman)'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tautan memakai atribut <b>href</b> yang diisi alamat tujuan. Teks di antara tag pembuka dan penutup adalah "teks klik".</p><p>Aturan praktis: <b>teks tautan harus menjelaskan tujuannya</b>. Tulisan seperti "Klik di sini" membuat pengguna dan pembaca layar bingung — lebih baik "Kunjungi halaman resep kami".</p>'
    },
    {
      type: 'example',
      title: 'Berbagai jenis tautan',
      lang: 'html',
      output: true,
      code: `<p>
  <a href="https://developer.mozilla.org/id/docs/Web/HTML">
    Dokumentasi HTML di MDN
  </a> — tautan ke situs luar.
</p>
<p>
  <a href="index.html" title="Buka halaman utama aplikasi ini">
    Ke halaman utama
  </a> — tautan relatif ke file lokal.
</p>
<p>
  <a href="mailto:halo@contoh.com">Kirim email ke kami</a> — membuka aplikasi email.
</p>
<p>
  <a href="#resep" >Lompat ke bagian resep</a> — tautan ke bagian halaman yang sama.
</p>
<h3 id="resep">Bagian Resep</h3>
<p>Kamu tadi melompat ke sini lewat tautan <code>#resep</code>. 🎯</p>`,
      explain: [
        '<b>https://…</b> = tautan absolut (alamat lengkap di internet).',
        '<b>index.html</b> = tautan relatif (file di folder yang sama).',
        '<b>mailto:</b> membuka aplikasi email dengan penerima terisi.',
        '<b>#nama</b> melompat ke elemen dengan id="nama" di halaman yang sama.',
        'Atribut <b>title</b> memberi keterangan saat kursor diarahkan.'
      ]
    },
    {
      type: 'warn',
      title: 'Tab baru & keamanan',
      text: 'Kalau tautan terbuka di tab baru (target="_blank"), tambahkan rel="noopener" agar halaman tujuan tidak bisa mengendalikan halamanmu lewat window.opener. Di HTML5, sebagian besar browser sudah aman secara bawaan, tetapi menuliskannya tetap merupakan kebiasaan yang baik.'
    },
    {
      type: 'live',
      title: 'Latihan: buat menu tautan',
      lang: 'html',
      hint: 'Buat daftar tiga tautan: satu ke situs favoritmu, satu email, dan satu bertarget _blank.',
      initial: `<h2>Menu Tautan</h2>
<ul>
  <li><a href="https://www.w3schools.com/html/">Belajar di W3Schools</a></li>
  <li><a href="mailto:saya@contoh.com">Hubungi saya</a></li>
</ul>`
    }
  ],
  recap: [
    'Tautan = &lt;a href="tujuan"&gt;teks&lt;/a&gt;.',
    'Gunakan &lt;base href&gt; tidak wajib; yang penting: relatif vs absolut sudah benar.',
    'Tulis teks tautan yang deskriptif — bukan "klik di sini".',
    'target="_blank" membuka di tab baru; pakai rel="noopener" bila perlu.'
  ]
});

window.HTML_LESSONS.push({
  id: 'gambar',
  title: 'Menampilkan Gambar',
  chapter: 'Konten Teks',
  duration: '6 menit',
  intro: [
    'Gambar membuat halaman menarik. Di HTML, gambar disisipkan dengan tag <b>&lt;img&gt;</b> — sebuah elemen kosong yang memakai atribut <b>src</b> untuk lokasi file dan <b>alt</b> untuk deskripsinya.'
  ],
  objectives: [
    'Menyisipkan gambar dari file lokal dan internet',
    'Memakai atribut alt, width, dan height dengan benar',
    'Memahami aksesibilitas gambar'
  ],
  sections: [
    {
      type: 'example',
      title: 'Menyisipkan gambar lokal',
      lang: 'html',
      output: true,
      code: `<img src="assets/sample.svg"
     alt="Ilustrasi belajar HTML"
     width="320" height="180">`,
      explain: [
        '<b>src</b> menunjuk ke file <code>assets/sample.svg</code> — coba cek, file ini ada di folder aplikasi dan tampil walau tanpa internet.',
        '<b>alt</b> menjelaskan isi gambar. Ia tampil saat gambar gagal dimuat dan dibacakan pembaca layar.',
        '<b>width/height</b> menentukan ukuran piksel; halaman tidak "melompat" saat gambar baru selesai dimuat bila ukurannya sudah ditentukan.'
      ]
    },
    {
      type: 'example',
      title: 'Gambar dari internet + tautan gambar',
      lang: 'html',
      output: true,
      code: `<p>Gambar dari URL (butuh internet):</p>
<img src="https://www.w3.org/assets/logos/w3c/w3c-logo-web.svg"
     alt="Logo W3C" width="120" height="64">

<p>Gambar di dalam tautan — klik untuk membuka aslinya:</p>
<a href="assets/sample.svg" title="Buka gambar asli">
  <img src="assets/sample.svg" alt="Ilustrasi HTML" width="160" height="90">
</a>`,
      explain: [
        'Gambar bisa diambil dari URL mana pun, tetapi <b>butuh koneksi internet</b>.',
        'Membungkus &lt;img&gt; dengan &lt;a&gt; membuat gambar bisa diklik.',
        'Tetap tulis alt meski gambar dibungkus tautan — deskripsinya membantu pembaca layar.'
      ]
    },
    {
      type: 'tip',
      title: 'Aksesibilitas itu bagian dari kualitas',
      text: 'Atribut alt bukan sekadar formalitas. Pengguna tunanetra mengandalkan pembaca layar yang membacakan alt. Kalau gambar murni dekoratif, cukup kosongkan alt="" agar pembaca layar melewatinya.'
    },
    {
      type: 'live',
      title: 'Latihan: galeri mini',
      lang: 'html',
      hint: 'Tampilkan gambar sample.svg dua kali dengan ukuran berbeda, dan beri salah satunya alt yang deskriptif.',
      initial: `<h2>Galeri Mini</h2>
<img src="assets/sample.svg" alt="Ilustrasi belajar HTML" width="200" height="112">`
    }
  ],
  recap: [
    '&lt;img src="lokasi" alt="deskripsi"&gt; — elemen kosong tanpa tag penutup.',
    'Sertakan alt untuk aksesibilitas; kosongkan (alt="") untuk gambar dekoratif.',
    'Tentukan width/height agar tata letak stabil saat gambar dimuat.'
  ]
});

window.HTML_LESSONS.push({
  id: 'list',
  title: 'Daftar (List)',
  chapter: 'Konten Teks',
  duration: '7 menit',
  intro: [
    'Daftar ada di mana-mana: menu, langkah resep, artikel, dan fitur produk. HTML menyediakan tiga jenis daftar: <b>tidak berurutan</b> (&lt;ul&gt;), <b>berurutan</b> (&lt;ol&gt;), dan <b>deskripsi</b> (&lt;dl&gt;).'
  ],
  objectives: [
    'Membuat daftar bullet (&lt;ul&gt;) dan bernomor (&lt;ol&gt;)',
    'Membuat daftar bersarang (list di dalam list)',
    'Menggunakan daftar deskripsi (&lt;dl&gt;)'
  ],
  sections: [
    {
      type: 'example',
      title: 'Daftar bullet dan bernomor',
      lang: 'html',
      output: true,
      code: `<h3>Alat belajar (bullet)</h3>
<ul>
  <li>Text editor (VS Code, Notepad, dll)</li>
  <li>Browser (Chrome, Firefox, Safari)</li>
  <li>Semangat! 💪</li>
</ul>

<h3>Langkah (bernomor)</h3>
<ol>
  <li>Buka editor kamu.</li>
  <li>Buat file bernama index.html.</li>
  <li>Tulis kerangka HTML dasar.</li>
  <li>Simpan dan buka di browser.</li>
</ol>`,
      explain: [
        '<b>&lt;ul&gt;</b> (unordered) memberi penanda titik; <b>&lt;ol&gt;</b> (ordered) memberi nomor otomatis.',
        'Setiap item ditulis dengan <b>&lt;li&gt;</b> (list item).',
        'Nomor pada &lt;ol&gt; dihitung otomatis — menambah/menghapus item tidak mengacaukan urutan.'
      ]
    },
    {
      type: 'example',
      title: 'Daftar bersarang',
      lang: 'html',
      output: true,
      code: `<ul>
  <li>HTML
    <ul>
      <li>Struktur halaman</li>
      <li>Elemen semantik</li>
    </ul>
  </li>
  <li>CSS
    <ul>
      <li>Warna dan font</li>
      <li>Tata letak (flexbox, grid)</li>
    </ul>
  </li>
</ul>`,
      explain: [
        'List boleh berada di dalam list (bersarang/nested) untuk membuat kelompok bertingkat.',
        'Item induk ("HTML", "CSS") memuat daftar anak di dalamnya.'
      ]
    },
    {
      type: 'example',
      title: 'Daftar deskripsi (istilah + definisi)',
      lang: 'html',
      output: true,
      code: `<dl>
  <dt>HTML</dt>
  <dd>Bahasa markah untuk menyusun struktur halaman web.</dd>
  <dt>CSS</dt>
  <dd>Bahasa untuk mengatur tampilan halaman web.</dd>
</dl>`,
      explain: [
        '<b>&lt;dl&gt;</b> (description list) cocok untuk kamus/istilah.',
        '<b>&lt;dt&gt;</b> = istilah, <b>&lt;dd&gt;</b> = definisinya.'
      ]
    },
    {
      type: 'live',
      title: 'Latihan: daftar rencana belajarmu',
      lang: 'html',
      hint: 'Buat ol dengan 3 langkah belajar hari ini, lalu ul bersarang untuk topik favoritmu.',
      initial: `<h2>Rencana Belajar</h2>
<ol>
  <li>Menyelesaikan materi HTML</li>
</ol>`
    }
  ],
  recap: [
    '&lt;ul&gt; = daftar bullet, &lt;ol&gt; = daftar bernomor, &lt;li&gt; = item.',
    'Daftar bisa bersarang (list dalam list) untuk struktur bertingkat.',
    '&lt;dl&gt; + &lt;dt&gt; + &lt;dd&gt; untuk pasangan istilah–definisi.'
  ]
});