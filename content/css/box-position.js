/* ============================================================
   Pelajaran CSS — Bab: Struktur & Tata Letak
   (topik info.md: "box model", "display dan visibilitas",
    "position (static, relative, absolute, fixed)", dan
    "z-index dan layering")
   ============================================================ */
'use strict';

window.CSS_LESSONS = window.CSS_LESSONS || [];

/* ------------------------------------------------------------
   Pelajaran 1: Box Model
   ------------------------------------------------------------ */
window.CSS_LESSONS.push({
  id: 'box-model',
  title: 'Box Model',
  chapter: 'Struktur & Tata Letak',
  duration: '7 menit',
  intro: [
    'Pernahkah kamu bertanya-tanya mengapa setiap elemen di halaman punya "ruang" di sekelilingnya? Setiap elemen HTML — dari paragraf sampai gambar — sebenarnya adalah <b>kotak berbentuk persegi panjang</b>. CSS menyebutnya <b>box model</b>.',
    'Memahami box model adalah kunci mengatur ukuran dan jarak: isi (content), bantalan (padding), bingkai (border), dan ruang luar (margin). Ibarat paket hadiah: isi hadiah dibungkus bubble wrap, dimasukkan ke kardus, lalu ditaruh di meja dengan jarak dari paket lain.'
  ],
  objectives: [
    'Menyebutkan 4 lapisan box model: content, padding, border, margin',
    'Memahami bahwa width/height hanya mengatur isi secara default',
    'Membedakan content-box dan border-box, serta mengapa border-box direkomendasikan',
    'Mengukur box model langsung dengan devtools browser'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Box model punya empat lapisan, dari dalam ke luar:</p><ol><li><b>Content</b> — isi sesungguhnya: teks, gambar, atau video.</li><li><b>Padding</b> — bantalan di dalam border; bisa diwarnai.</li><li><b>Border</b> — garis bingkai yang mengelilingi padding.</li><li><b>Margin</b> — ruang kosong di luar border; selalu transparan.</li></ol><p>Bayangkan kotak sepatu: sepatu adalah content, kertas pembungkus adalah padding, kotaknya adalah border, dan jarak kotak dengan kotak lain di rak adalah margin.</p>'
    },
    {
      type: 'example',
      title: 'Anatomi box model dalam aksi',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Anatomi Box Model</title>
  <style>
    .kartu {
      width: 200px;
      padding: 24px;
      border: 5px solid #1572B6;
      margin: 20px;
      background: #EAF3FB;
      font-family: Georgia, serif;
    }
  </style>
</head>
<body>
  <div class="kartu">Aku kotak: isi 200px + padding 24px + border 5px + margin 20px</div>
</body>
</html>`,
      explain: [
        '<code>width: 200px</code> hanya mengatur <b>isi</b> (content). Lebar total di layar = 200 + (24 &times; 2) + (5 &times; 2) = <b>258px</b>, belum termasuk margin.',
        'Padding membuat isi menjauh dari border, border mengelilingi padding, dan margin mendorong elemen lain menjauh.',
        'Margin selalu transparan — kamu bisa mengaturnya, tapi tidak bisa mewarnainya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Secara default, <code>width</code> dan <code>height</code> hanya mengatur <b>content</b> — ini disebut <code>box-sizing: content-box</code>. Jadi lebar total di layar adalah: <code>margin + border + padding + width</code>.</p><p>Contoh: <code>width: 200px</code> + <code>padding: 24px</code> + <code>border: 5px</code> = <b>258px</b> lebar total. Menjengkelkan, kan? Di sinilah <code>box-sizing: border-box</code> hadir: lebar 200px sudah termasuk padding dan border, sehingga ukuran total persis seperti yang kamu tulis. Karena itu <b>border-box direkomendasikan</b> — tata letak jadi mudah diprediksi dan tidak perlu kalkulasi manual.</p>'
    },
    {
      type: 'example',
      title: 'content-box vs border-box',
      lang: 'css',
      output: true,
      code: `.kotak-a {
  box-sizing: content-box; /* default */
  width: 200px;
  padding: 24px;
  border: 5px solid #E34F26;
  background: #E34F26;
  color: #fff;
}
.kotak-b {
  box-sizing: border-box;
  width: 200px;
  padding: 24px;
  border: 5px solid #1572B6;
  background: #1572B6;
  color: #fff;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>content-box vs border-box</title>
  <style>
    __CODE__
    body { font-family: Georgia, serif; padding: 16px; }
    .kotak-a, .kotak-b { margin-bottom: 14px; }
  </style>
</head>
<body>
  <div class="kotak-a">content-box: lebar total = 258px</div>
  <div class="kotak-b">border-box: lebar total = 200px</div>
</body>
</html>`,
      explain: [
        'Kotak merah memakai content-box (default): lebar isi 200px, ditambah padding 24&times;2 dan border 5&times;2, jadi <b>258px</b> di layar.',
        'Kotak biru memakai border-box: lebar total persis <b>200px</b> karena padding dan border "menyusut ke dalam".',
        'Dengan border-box, menambah padding tidak lagi mengubah lebar total — tata letak jadi mudah diprediksi.'
      ]
    },
    {
      type: 'text',
      html: '<p>Daripada menghitung manual, kamu bisa <b>mengukur box model langsung dengan devtools</b>: klik kanan elemen di halaman, lalu pilih <b>Periksa / Inspect</b>. Di panel Elements, Chrome menampilkan diagram warna — <b>biru</b> untuk content, <b>hijau</b> untuk padding, <b>kuning</b> untuk border, dan <b>oranye</b> untuk margin — lengkap dengan angka pikselnya. Firefox punya tampilan serupa. Cobalah pada beberapa elemen sampai kamu terbiasa membaca diagram ini.</p>'
    },
    {
      type: 'tip',
      title: 'Terapkan border-box sejak awal',
      text: 'Tambahkan <code>* { box-sizing: border-box; }</code> di awal stylesheet (atau di CSS reset). Semua elemen langsung pakai border-box, sehingga menambah padding tidak lagi membuat elemen melebar. Ini kebiasaan standar di proyek CSS sungguhan.'
    },
    {
      type: 'warn',
      title: 'width: 100% + padding = overflow',
      text: 'Dengan content-box, elemen ber-<code>width: 100%</code> ditambah padding akan <b>melebihi</b> lebar wadahnya dan menimbulkan scroll horizontal yang tak diinginkan. Gunakan border-box, atau kurangi lebarnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Content', 'Isi elemen — teks, gambar, atau anak elemen lain.'],
        ['Padding', 'Jarak antara content dan border; termasuk area yang bisa diwarnai.'],
        ['Border', 'Garis bingkai di sekeliling padding; bisa diatur tebal, warna, dan gayanya.'],
        ['Margin', 'Ruang di luar border; selalu transparan dan mendorong elemen lain.'],
        ['Box-sizing', 'Properti yang menentukan apakah width mencakup padding dan border (border-box) atau tidak (content-box).']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: ukur kotakmu!',
      lang: 'html',
      hint: 'Ubah nilai width, padding, border, dan margin satu per satu. Lalu tambahkan box-sizing: border-box dan bandingkan lebar totalnya. Klik "Jalankan".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latih Box Model</title>
  <style>
    .bingkai {
      width: 240px;
      padding: 16px;
      border: 6px solid #1572B6;
      margin: 12px;
      background: #EAF3FB;
    }
  </style>
</head>
<body>
  <div class="bingkai">Ubah angka-angka di sini, lalu klik Jalankan.</div>
  <p>Perhatikan: lebar isi 240px — tapi berapa lebar totalnya?</p>
</body>
</html>`
    }
  ],
  recap: [
    'Setiap elemen adalah kotak: content, padding, border, margin.',
    'Default (content-box): width hanya mengatur isi; total = margin + border + padding + width.',
    'border-box: width sudah termasuk padding dan border — lebih mudah diprediksi, jadi direkomendasikan.',
    'Ukur dengan devtools: klik kanan lalu Inspect, baca diagram warna biru-hijau-kuning-oranye.'
  ]
});

/* ------------------------------------------------------------
   Pelajaran 2: Display & Visibilitas
   ------------------------------------------------------------ */
window.CSS_LESSONS.push({
  id: 'display-dan-visibilitas',
  title: 'Display & Visibilitas',
  chapter: 'Struktur & Tata Letak',
  duration: '6 menit',
  intro: [
    'CSS punya saklar bernama <b>display</b> yang mengatur bagaimana sebuah elemen "berperilaku" di halaman: apakah ia memenuhi satu baris penuh, mengalir di dalam kalimat, atau menghilang sama sekali.',
    'Pelajaran ini membahas empat nilai paling umum — block, inline, inline-block, dan none — plus <b>visibility</b>, sepupu display yang menyembunyikan elemen tanpa merobohkan tata letak.'
  ],
  objectives: [
    'Membedakan display: block, inline, inline-block, dan none',
    'Menjelaskan perbedaan display:none dan visibility:hidden',
    'Menyebut elemen bawaan yang termasuk block dan yang termasuk inline'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Dua perilaku bawaan paling penting:</p><ul><li><b>Block</b> — memenuhi lebar wadah dan selalu pindah baris. Contoh bawaan: <code>&lt;div&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;h1&gt;</code> sampai <code>&lt;h6&gt;</code>.</li><li><b>Inline</b> — mengalir sejajar dalam satu baris dan hanya selebar isinya. Contoh bawaan: <code>&lt;span&gt;</code>, <code>&lt;a&gt;</code>, <code>&lt;strong&gt;</code>.</li></ul><p>Analogi: block seperti rak buku yang memanjang satu dinding, inline seperti kata-kata dalam sebuah kalimat.</p>'
    },
    {
      type: 'example',
      title: 'Block, inline, dan inline-block berdampingan',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Block vs Inline</title>
  <style>
    .blok { background: #1572B6; color: #fff; padding: 10px; margin: 6px 0; }
    .inline { background: #F2C14E; padding: 6px; }
    .ib { display: inline-block; width: 110px; background: #2E9E5B; color: #fff; padding: 10px; margin: 4px; }
  </style>
</head>
<body>
  <div class="blok">Saya block: selalu pindah baris</div>
  <div class="blok">Saya block: selalu pindah baris</div>
  <p>Kalimat ini punya kata <span class="inline">inline</span> yang <span class="inline">mengalir</span> sejajar.</p>
  <span class="ib">inline-block 1</span> <span class="ib">inline-block 2</span>
</body>
</html>`,
      explain: [
        '<code>&lt;div&gt;</code> bersifat block: tiap kartu memenuhi barisnya sendiri meskipun lebarnya tidak diatur.',
        '<code>&lt;span&gt;</code> bersifat inline: kata-kata tetap berjajar seperti teks biasa.',
        '<code>display: inline-block</code> menggabungkan keduanya: bisa berjajar, tapi <code>width</code> dan <code>height</code> bisa diatur.'
      ]
    },
    {
      type: 'text',
      html: '<p><code>display: none</code> membuat elemen <b>lenyap total</b> — beserta ruang yang ditempatinya. Elemen lain langsung mengisi kekosongan, seolah elemen itu tidak pernah ada.</p><p>Sebaliknya, <code>visibility: hidden</code> hanya membuat elemen <b>tak terlihat</b>: ruangnya tetap disimpan, sehingga tata letak tidak bergeser. Pilih visibility saat kamu tidak ingin halaman "melompat".</p>'
    },
    {
      type: 'example',
      title: 'display:none vs visibility:hidden',
      lang: 'css',
      output: true,
      code: `.hilang {
  display: none; /* elemen & ruangnya lenyap */
}
.samar {
  visibility: hidden; /* elemen tak terlihat, ruang tetap ada */
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>display:none vs visibility:hidden</title>
  <style>
    __CODE__
    .baris { width: 140px; padding: 10px; margin: 8px 0; color: #fff; }
    .merah { background: #E34F26; }
    .biru { background: #1572B6; }
  </style>
</head>
<body>
  <div class="baris merah hilang">display: none</div>
  <div class="baris biru">Saya biru — naik ke atas</div>
  <div class="baris merah samar">visibility: hidden</div>
  <div class="baris biru">Saya biru — diam di tempat</div>
</body>
</html>`,
      explain: [
        'Kotak merah atas pakai <code>display: none</code> — ruangnya hilang, jadi kotak biru langsung naik ke atas.',
        'Kotak merah bawah pakai <code>visibility: hidden</code> — tak terlihat, tapi ruangnya tetap, sehingga kotak biru di bawahnya diam di tempat.',
        'Gunakan <code>visibility: hidden</code> saat ruang harus dijaga, misalnya menyiapkan tempat untuk konten yang muncul nanti.'
      ]
    },
    {
      type: 'tip',
      title: 'Sembunyi-sembunyi interaktif',
      text: 'Untuk menu atau tab, siapkan dua keadaan di CSS lalu tukar class-nya lewat JavaScript. <code>display: none</code> cocok untuk kondisi "mati total", sedangkan <code>visibility</code> cocok saat tata letak tidak boleh bergeser.'
    },
    {
      type: 'warn',
      title: 'Konten tersembunyi tetap ada (atau tidak sama sekali)',
      text: '<code>display: none</code> membuat elemen tidak bisa diklik dan dilewati pembaca layar — jangan pakai ini untuk menyembunyikan konten penting secara permanen. Jika tujuannya hanya "tidak terlihat" tapi ruangnya tetap ada, pakai <code>visibility: hidden</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['display', 'Properti yang mengatur bagaimana elemen berpartisipasi dalam tata letak.'],
        ['block', 'Elemen level blok: pindah baris dan memenuhi lebar wadah.'],
        ['inline', 'Elemen sejajar: mengalir dalam baris, hanya selebar isi.'],
        ['inline-block', 'Campuran keduanya: sejajar seperti inline, tapi bisa diberi ukuran seperti block.'],
        ['visibility', 'Properti untuk menyembunyikan elemen tanpa menghapus ruangnya.'],
        ['none', 'Nilai display yang menghapus elemen beserta ruangnya dari tata letak.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: sembunyi-sembunyi!',
      lang: 'html',
      hint: 'Tambahkan .kartu { display: none; } pada salah satu kartu, lalu ganti menjadi visibility: hidden. Perhatikan: kartu di bawahnya ikut naik atau diam di tempat?',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latih Display & Visibilitas</title>
  <style>
    .kartu {
      width: 150px;
      padding: 12px;
      margin: 8px 0;
      background: #1572B6;
      color: #fff;
    }
    .kuning { background: #F2C14E; color: #333; }
  </style>
</head>
<body>
  <div class="kartu">Kartu biru</div>
  <div class="kartu kuning">Kartu kuning</div>
  <p>Sembunyikan salah satu kartu dan amati perbedaannya!</p>
</body>
</html>`
    }
  ],
  recap: [
    'block: pindah baris, lebar penuh. inline: sejajar, selebar isi. inline-block: sejajar tapi bisa diatur ukurannya.',
    'display:none menghapus elemen beserta ruangnya; visibility:hidden hanya menyembunyikan, ruang tetap ada.',
    'Elemen bawaan block: div, p, h1. Bawaan inline: span, a, strong.',
    'Simpan ruang dengan visibility jika tata letak tidak boleh bergeser.'
  ]
});

/* ------------------------------------------------------------
   Pelajaran 3: Position
   ------------------------------------------------------------ */
window.CSS_LESSONS.push({
  id: 'position',
  title: 'Position: Static, Relative, Absolute, Fixed',
  chapter: 'Struktur & Tata Letak',
  duration: '8 menit',
  intro: [
    'Kalau box model mengatur <b>ukuran</b>, properti <b>position</b> mengatur <b>cara elemen menempel</b> di halaman. Seperti note tempel: bisa dibiarkan mengalir, digeser sedikit, ditempel bebas di atas kertas, atau ditempel di kaca jendela.',
    'Properti <code>top</code>, <code>right</code>, <code>bottom</code>, dan <code>left</code> baru berpengaruh setelah kamu memilih tipe position — kecuali static, yang memakainya tidak mengubah apa pun.'
  ],
  objectives: [
    'Membedakan position: static, relative, absolute, fixed, dan sticky',
    'Memakai top, right, bottom, dan left untuk menggeser elemen',
    'Memilih tipe position yang tepat untuk kasus umum'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>static</b> adalah nilai default — elemen mengikuti alur biasa dan <code>top</code>/<code>left</code> diabaikan.</p><p><b>relative</b> menggeser elemen dari posisi asalnya, tetapi <b>ruang asalnya tetap ditempati</b>: seperti memajukan kursi beberapa sentimeter dari posisi semula, sementara bekasnya masih tercetak. Elemen lain tidak ikut bergeser. Karena itu relative sering dipakai sebagai "penyangga" bagi anak yang ber-position absolute.</p>'
    },
    {
      type: 'example',
      title: 'relative: geser tanpa meninggalkan ruang',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Relative: geser tanpa meninggalkan ruang</title>
  <style>
    .kartu {
      width: 220px;
      padding: 14px;
      margin: 10px 0;
      background: #EAF3FB;
      border: 3px solid #1572B6;
      font-family: Georgia, serif;
    }
    .geser {
      position: relative;
      top: 20px;
      left: 40px;
      background: #F2C14E;
      border-color: #C9930A;
    }
  </style>
</head>
<body>
  <div class="kartu">Kartu 1 — diam di tempat</div>
  <div class="kartu geser">Kartu 2 — digeser 20px ke bawah, 40px ke kanan</div>
  <div class="kartu">Kartu 3 — ruang kartu 2 tetap disimpan, jadi tidak naik</div>
</body>
</html>`,
      explain: [
        'Kartu kuning digeser 20px ke bawah dan 40px ke kanan lewat <code>top</code> dan <code>left</code>, tapi ruang asalnya tetap disimpan.',
        'Kartu ketiga tidak naik — pembuktian bahwa <code>position: relative</code> tidak meninggalkan alur.',
        'Biasanya relative dipakai sebagai acuan (containing block) untuk elemen absolute di dalamnya.'
      ]
    },
    {
      type: 'example',
      title: 'absolute: badge melayang di atas gambar',
      lang: 'css',
      output: true,
      code: `.gambar {
  position: relative; /* jadi sandaran badge */
}
.badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #E34F26;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: bold;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Badge melayang di atas gambar</title>
  <style>
    __CODE__
    .gambar {
      width: 260px;
      background: linear-gradient(135deg, #1572B6, #2E9E5B);
      color: #fff;
      text-align: center;
      padding: 48px 20px;
      border-radius: 10px;
      font-family: Georgia, serif;
    }
  </style>
</head>
<body>
  <div class="gambar">
    Gunung Pagi
    <span class="badge">BARU</span>
  </div>
</body>
</html>`,
      explain: [
        'Badge ber-position <code>absolute</code> terhadap induknya (<code>.gambar</code>) karena induk punya <code>position: relative</code> — bukan terhadap halaman.',
        '<code>top: 12px; right: 12px</code> menempelkan badge ke sudut kanan atas kartu.',
        'Elemen absolute keluar dari alur normal, jadi tidak memakan ruang di dalam induknya.'
      ]
    },
    {
      type: 'example',
      title: 'fixed: menempel di layar',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Fixed: menempel di layar</title>
  <style>
    .melayang {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: #E34F26;
      color: #fff;
      padding: 10px 16px;
      border-radius: 20px;
      border: none;
      font-size: 16px;
    }
    .konten { height: 320px; padding: 12px; background: #f4f4f4; }
  </style>
</head>
<body>
  <div class="konten">Gulir area ini — tombol merah tidak ikut bergerak karena menempel ke viewport.</div>
  <button class="melayang">Chat</button>
</body>
</html>`,
      explain: [
        '<code>position: fixed</code> menempel ke <b>viewport</b> (area terlihat browser), jadi tombol tetap di sudut walau halaman digulir.',
        '<code>bottom</code> dan <code>right</code> bernilai jarak dari sudut viewport — cocok untuk tombol chat, banner, atau header.',
        'Elemen fixed juga keluar dari alur; sisakan padding pada body agar konten tidak tertutup.'
      ]
    },
    {
      type: 'text',
      html: '<p>Bonus: <b>sticky</b> adalah kombinasi relative dan fixed — elemen bergerak biasa sampai menyentuh batas (misalnya <code>top: 0</code>), lalu menempel seperti fixed. Cocok untuk judul bagian yang ikut digulir lalu berhenti di atas.</p><p>Ringkasnya: <b>static</b> untuk kebanyakan elemen, <b>relative</b> untuk penyangga atau geser halus, <b>absolute</b> untuk badge dan tooltip, <b>fixed</b> untuk elemen yang selalu terlihat, dan <b>sticky</b> untuk header yang menempel saat scroll.</p>'
    },
    {
      type: 'warn',
      title: 'Absolute tanpa penyangga',
      text: 'Elemen absolute mencari ancestor ber-position terdekat; kalau tidak ada, ia menempel ke awal halaman dan bisa berpindah-pindah saat konten bertambah. Selalu beri <code>position: relative</code> pada wadahnya. Hati-hati juga: elemen absolute dan fixed bisa menutupi konten lain.'
    },
    {
      type: 'vocab',
      items: [
        ['static', 'Position default: elemen mengikuti alur biasa; top/left diabaikan.'],
        ['relative', 'Elemen bisa digeser, tetapi ruang asalnya tetap disimpan.'],
        ['absolute', 'Elemen menempel ke ancestor ber-position terdekat dan keluar dari alur.'],
        ['fixed', 'Elemen menempel ke viewport dan tetap terlihat saat digulir.'],
        ['sticky', 'Elemen bergerak biasa sampai menyentuh batas, lalu menempel.'],
        ['viewport', 'Area terlihat dari halaman di browser.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: pindahkan bintang!',
      lang: 'html',
      hint: 'Ubah nilai top dan left pada .bintang untuk memindahkannya di dalam panggung. Lalu ganti position: absolute menjadi relative dan lihat bagaimana bintang kembali mengikuti alur.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latih Position</title>
  <style>
    .panggung {
      position: relative;
      width: 280px;
      height: 160px;
      background: #EAF3FB;
      border: 3px dashed #1572B6;
      padding: 12px;
    }
    .bintang {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #F2C14E;
      padding: 8px 12px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="panggung">
    <span class="bintang">&#9733;</span>
    Pindahkan bintang: ubah nilai top dan left!
  </div>
  <p>Coba ganti position: absolute menjadi relative, perhatikan apa yang berubah.</p>
</body>
</html>`
    }
  ],
  recap: [
    'static: default, mengikuti alur. relative: digeser tanpa meninggalkan ruang.',
    'absolute: terhadap ancestor ber-position terdekat. fixed: terhadap viewport.',
    'top, right, bottom, dan left menentukan jarak geser atau tempat menempel.',
    'Sticky: bergerak biasa sampai batas, lalu menempel.',
    'Beri position: relative pada wadah sebelum menaruh elemen absolute di dalamnya.'
  ]
});

/* ------------------------------------------------------------
   Pelajaran 4: Z-Index & Layering
   ------------------------------------------------------------ */
window.CSS_LESSONS.push({
  id: 'z-index-dan-layering',
  title: 'Z-Index & Layering',
  chapter: 'Struktur & Tata Letak',
  duration: '7 menit',
  intro: [
    'Kadang dua elemen ingin menempati tempat yang sama — misalnya badge di atas gambar atau modal di atas seluruh halaman. CSS mengatur siapa yang menang lewat <b>urutan tumpukan</b> (stacking order).',
    'Secara default, elemen yang muncul <b>kemudian</b> dalam HTML berada di atas. Untuk mengaturnya secara eksplisit, gunakan properti <b>z-index</b> — sumbu "kedalaman" yang tegak lurus layar.'
  ],
  objectives: [
    'Memahami urutan tumpukan default',
    'Memakai z-index pada elemen ber-position',
    'Menjelaskan stacking context secara sederhana',
    'Mengatasi elemen yang "hilang" di belakang'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Tanpa z-index, browser menyusun elemen menurut urutan: elemen biasa lebih dulu, elemen ber-position kemudian, dan yang terakhir dalam dokumen menang bila bertumpuk. Bayangkan menumpuk kartu remi — kartu yang diletakkan terakhir ada di atas.</p><p>z-index hanya butuh angka bulat: nilai <b>lebih besar</b> berarti <b>lebih atas</b>. Nilai default-nya <code>auto</code> (setara 0 untuk elemen ber-position).</p>'
    },
    {
      type: 'text',
      html: '<p>Aturan penting: <b>z-index hanya berlaku pada elemen ber-position</b> — yaitu <code>position: relative</code>, <code>absolute</code>, <code>fixed</code>, atau <code>sticky</code>. Menulis <code>z-index: 999</code> pada elemen static tidak mengubah apa pun, sekeras apa pun kamu berdoa.</p>'
    },
    {
      type: 'example',
      title: 'Kartu bertumpuk dengan z-index',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu bertumpuk</title>
  <style>
    .tumpukan { position: relative; width: 280px; height: 190px; }
    .kartu {
      position: absolute;
      width: 180px;
      padding: 14px;
      color: #fff;
      border-radius: 8px;
      font-family: Georgia, serif;
    }
    .a { top: 0; left: 0; background: #1572B6; z-index: 1; }
    .b { top: 40px; left: 40px; background: #2E9E5B; z-index: 2; }
    .c { top: 80px; left: 80px; background: #E34F26; z-index: 3; }
  </style>
</head>
<body>
  <div class="tumpukan">
    <div class="kartu a">Biru — z-index: 1</div>
    <div class="kartu b">Hijau — z-index: 2</div>
    <div class="kartu c">Merah — z-index: 3</div>
  </div>
</body>
</html>`,
      explain: [
        'Ketiga kartu ber-position absolute; <code>z-index</code> menentukan urutan: merah (3) paling atas, biru (1) paling bawah.',
        'Tanpa z-index, kartu terakhir dalam HTML (merah) tetap menang — z-index hanya untuk mengubah urutan default.',
        'Nilai z-index bisa berupa angka positif maupun negatif.'
      ]
    },
    {
      type: 'example',
      title: 'Z-index negatif: tenggelam ke bawah',
      lang: 'css',
      output: true,
      code: `.latar {
  position: absolute;
  z-index: -1; /* turun ke lapisan paling bawah */
  width: 220px;
  height: 120px;
  background: #F2C14E;
  border-radius: 12px;
}
.depan {
  position: relative;
  width: 200px;
  margin-top: 40px;
  background: #1572B6;
  color: #fff;
  padding: 16px;
  border-radius: 12px;
}`,
      doc: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Z-index negatif</title>
  <style>
    __CODE__
    body { font-family: Georgia, serif; padding: 24px; }
  </style>
</head>
<body>
  <div class="latar"></div>
  <div class="depan">Teks biru di atas, kotak kuning di belakang (z-index: -1).</div>
</body>
</html>`,
      explain: [
        'Kotak kuning punya <code>z-index: -1</code> sehingga tenggelam ke lapisan paling bawah dan terlihat dari balik kotak biru.',
        'Elemen ber-position tanpa z-index (kotak biru, nilai auto) tetap berada di atas elemen z-index negatif.',
        'Hindari z-index negatif pada elemen yang harus bisa diklik — ia bisa tertutup latar halaman.'
      ]
    },
    {
      type: 'text',
      html: '<p>Elemen ber-position dengan z-index tertentu membentuk <b>stacking context</b> — "dunia tumpukan" sendiri. Anak-anaknya tidak bisa menembus ke atas melewati dunia induknya, sebesar apa pun z-index anak itu.</p><p>Ibarat lapisan Photoshop: gambar di lapisan 2 tidak bisa menembus lapisan 5, meski kamu menggesernya ke atas. Karena itu elemen dengan <code>z-index: 9999</code> kadang tetap berada di bawah — periksa z-index <b>induknya</b>.</p>'
    },
    {
      type: 'warn',
      title: 'Elemen "hilang" di belakang',
      text: 'Jika elemen tidak kelihatan padahal sudah diberi z-index besar, cek tiga hal: (1) apakah elemen sudah ber-position? (2) apakah salah satu induknya punya z-index rendah atau membentuk stacking context? (3) apakah ada overflow: hidden yang memotongnya? Urutan pemeriksaan ini menghemat banyak waktu.'
    },
    {
      type: 'tip',
      title: 'overflow: hidden sebagai pembersih',
      text: 'Wadah yang seluruh anaknya ber-float bisa runtuh — tingginya menjadi 0. Tambahkan <code>overflow: hidden</code> pada wadahnya: browser memaksa wadah membungkus anak-anaknya. Ini alternatif cepat untuk membersihkan float tanpa elemen clearfix tambahan.'
    },
    {
      type: 'vocab',
      items: [
        ['Urutan tumpukan', 'Aturan mana yang dilukis lebih dulu dan mana yang muncul di atas.'],
        ['z-index', 'Angka yang mengatur posisi elemen ber-position dalam tumpukan.'],
        ['Stacking context', 'Dunia tumpukan terisolasi yang dibentuk oleh elemen ber-position ber-z-index.'],
        ['Positioned element', 'Elemen dengan position selain static.'],
        ['overflow: hidden', 'Memotong isi yang melebihi wadah; juga bisa membersihkan float.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: atur lapisanmu!',
      lang: 'html',
      hint: 'Tukar angka z-index ketiga lapisan sehingga kartu biru berada paling atas. Lalu beri salah satu kartu z-index: -1 dan amati apa yang terjadi.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Latih Z-Index</title>
  <style>
    .panggung { position: relative; width: 280px; height: 190px; }
    .lapis {
      position: absolute;
      width: 170px;
      padding: 14px;
      color: #fff;
      border-radius: 10px;
      font-family: Georgia, serif;
    }
    .satu { top: 0; left: 0; background: #1572B6; z-index: 1; }
    .dua { top: 50px; left: 50px; background: #2E9E5B; z-index: 2; }
    .tiga { top: 100px; left: 100px; background: #E34F26; z-index: 3; }
  </style>
</head>
<body>
  <div class="panggung">
    <div class="lapis satu">Biru — z-index 1</div>
    <div class="lapis dua">Hijau — z-index 2</div>
    <div class="lapis tiga">Merah — z-index 3</div>
  </div>
  <p>Tukar angka z-index agar BIRU yang paling atas!</p>
</body>
</html>`
    }
  ],
  recap: [
    'Default: elemen yang muncul kemudian dalam HTML berada di atas.',
    'z-index hanya bekerja pada elemen ber-position (relative, absolute, fixed, sticky).',
    'Nilai positif naik, negatif turun; stacking context bisa membatasi jangkauannya.',
    'Elemen hilang di belakang? Cek position, z-index induk, dan overflow.',
    'overflow: hidden bisa membersihkan wadah yang berisi float.'
  ]
});
