/* ============================================================
   Pelajaran CSS — Bab 1: Pengenalan & Cara Menambahkan CSS
   (topik info.md: "pengenalan dan cara menambahkan css")
   ============================================================ */
'use strict';

window.CSS_LESSONS = window.CSS_LESSONS || [];

window.CSS_LESSONS.push({
  id: 'pengenalan-cara-menambahkan-css',
  title: 'Apa itu CSS & Cara Menambahkannya',
  chapter: 'Pendahuluan',
  duration: '8 menit',
  intro: [
    'Di pelajaran HTML, <b>HTML</b> adalah kerangka rumah — dinding, pintu, dan jendelanya. <b>CSS</b> (kependekan dari <b>Cascading Style Sheets</b>) adalah cat, wallpaper, dan dekorasinya: CSS menentukan <b>bagaimana</b> halaman itu terlihat.',
    'CSS dipisah dari HTML agar struktur dan tampilan tidak bercampur. Satu berkas CSS bisa dipakai oleh banyak halaman — ubah sekali, seluruh situs berubah.'
  ],
  objectives: [
    'Memahami apa itu CSS dan perannya di web',
    'Menyebutkan 3 cara menambahkan CSS ke halaman',
    'Membaca dan menulis aturan CSS pertama kamu',
    'Membedakan selektor, properti, dan nilai'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Satu aturan CSS selalu terdiri dari tiga bagian:</p><ol><li><b>Selektor</b> — elemen mana yang diatur, misalnya <code>h1</code>.</li><li><b>Properti</b> — hal apa yang diatur, misalnya <code>color</code> (warna).</li><li><b>Nilai</b> — isi pengaturnya, misalnya <code>navy</code>.</li></ol><p>Digabungkan jadi satu <i>deklarasi</i>: <code>h1 { color: navy; }</code>. Artinya: "semua elemen <b>&lt;h1&gt;</b> berwarna navy".</p>'
    },
    {
      type: 'example',
      title: 'Cara 2 paling umum: stylesheet internal di &lt;style&gt;',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Halaman Pertamaku</title>
  <style>
    h1 {
      color: navy;
      font-family: Georgia, serif;
    }
    p {
      color: #444;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <h1>Halo, CSS!</h1>
  <p>Paragraf ini diatur lewat CSS, bukan atribut HTML.</p>
</body>
</html>`,
      explain: [
        'Tag <b>&lt;style&gt;</b> diletakkan di dalam <b>&lt;head&gt;</b> — pengaturan tampilan, bukan konten.',
        'Aturan <code>h1 { ... }</code> mengatur <b>semua</b> elemen <code>&lt;h1&gt;</code> di halaman.',
        'Tulis tiap deklarasi di baris sendiri dan diakhiri titik koma (<code>;</code>) — kode jadi mudah dibaca.',
        'Warna bisa ditulis dengan nama (<code>navy</code>) atau kode heksa (<code>#444</code>).'
      ]
    },
    {
      type: 'example',
      title: 'Sintaks aturan CSS (murni)',
      lang: 'css',
      output: false,
      code: `/* komentar: dicadangkan untuk manusia, browser mengabaikannya */

p {
  color: #333;        /* properti: nilai */
  font-size: 16px;
  line-height: 1.6;
}

a {
  color: #1572B6;
  text-decoration: none;   /* hilangkan garis bawah tautan */
}`,
      explain: [
        'Satu blok <code>{ }</code> berisi satu atau beberapa deklarasi <code>properti: nilai;</code>.',
        '<code>/* ... */</code> adalah komentar CSS — wajib ada saat menulis kode panjang.',
        'Spasi/indentasi tidak mengubah hasil, tapi membuat kode jauh lebih rapi.',
        'CSS tidak keberatan dengan huruf besar/kecil: <code>COLOR</code> sama dengan <code>color</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Cara 1: inline style (cepat, tapi terbatas)',
      lang: 'css',
      output: true,
      code: `color: #E34F26;
font-size: 28px;
text-align: center;`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Inline style</title>
</head>
<body>
  <h1 style="__CODE__">Judul di tengah</h1>
  <p>Aturan di samping disuntikkan ke atribut style pada tag h1.</p>
</body>
</html>`,
      explain: [
        '<b>Inline style</b> ditulis sebagai atribut <code>style="..."</code> pada satu tag saja.',
        'Isinya adalah daftar <b>deklarasi</b> saja — tanpa selektor dan tanpa kurung kurawal.',
        'Penanda <code>__CODE__</code> pada dokumen di atas disisipi kode CSS, sehingga pratinjau menggunakan aturan yang sama persis.',
        'Inline style hanya untuk coba-coba cepat. Untuk produksi, pakai <code>&lt;style&gt;</code> atau berkas CSS terpisah.'
      ]
    },
    {
      type: 'tip',
      title: 'Cara 3: berkas CSS terpisah (yang dipakai situs sungguhan)',
      text: 'Simpan aturanmu di <code>styles.css</code>, lalu panggil dari &lt;head&gt; dengan <code>&lt;link rel="stylesheet" href="styles.css"&gt;</code>. Semua halaman yang memakai berkas itu ikut berubah sekaligus. Ini cara paling rapi dan paling direkomendasikan.'
    },
    {
      type: 'warn',
      title: 'Hindari atribut tampilan lama',
      text: 'Jangan pakai &lt;font color="..."&gt;, &lt;center&gt;, atau atribut <code>bgcolor</code> — sudah usang (deprecated) dan tidak fleksibel. Atur semua tampilan lewat CSS saja.'
    },
    {
      type: 'vocab',
      items: [
        ['CSS', 'Cascading Style Sheets — bahasa untuk mengatur tampilan halaman web.'],
        ['Selektor', 'Bagian awal aturan yang memilih elemen yang diatur, misalnya <code>h1</code>.'],
        ['Properti', 'Ciri visual yang diatur, misalnya <code>color</code>, <code>font-size</code>.'],
        ['Nilai', 'Isi dari properti, misalnya <code>navy</code>, <code>16px</code>.'],
        ['Deklarasi', 'Pasangan properti dan nilai yang diakhiri titik koma.'],
        ['Stylesheet', 'Kumpulan aturan CSS, baik di &lt;style&gt; maupun di berkas .css.'],
        ['Cascading', 'Aturan "berjenjang": aturan yang lebih spesifik menang atas yang umum.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: bersenang-senang dengan warna!',
      lang: 'html',
      hint: 'Ubah nilai color dan font-size di dalam &lt;style&gt;, tambahkan aturan untuk p, atau ganti warna latar dengan background-color. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latihan CSS Pertama</title>
  <style>
    h1 {
      color: #1572B6;
      font-size: 26px;
    }
  </style>
</head>
<body>
  <h1>Ini judulku</h1>
  <p>Ini paragrafku. Tambahkan aturan untuk paragraf ini!</p>
</body>
</html>`
    }
  ],
  recap: [
    'CSS = Cascading Style Sheets, bahasa untuk mengatur tampilan halaman.',
    'Satu aturan = selektor { properti: nilai; }.',
    'Tiga cara menambahkan CSS: inline style, &lt;style&gt; di &lt;head&gt;, dan berkas .css lewat &lt;link&gt;.',
    'Berkas CSS terpisah adalah cara yang paling rapi dan dapat dipakai ulang.',
    'Jangan pakai atribut tampilan lama seperti &lt;font&gt; atau &lt;center&gt;.'
  ]
});
