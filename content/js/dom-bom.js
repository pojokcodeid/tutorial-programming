/* ============================================================
   Pelajaran JavaScript — Bab 9: DOM & BOM
   (topik info.md: "javascript dom" lanjutan
    dan "javascript bom")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran: DOM — Node & Traversing ---------- */
window.JS_LESSONS.push({
  id: 'dom-node-dan-traversing',
  title: 'DOM: Node & Traversing',
  chapter: 'DOM & BOM',
  duration: '12 menit',
  intro: [
    'Pelajaran DOM sebelumnya membahas cara <b>memilih</b> dan <b>mengubah</b> elemen. Sekarang kita selami lebih dalam: DOM adalah <b>pohon</b>, dan setiap elemen punya hubungan keluarga — <b>induk</b>, <b>anak</b>, dan <b>saudara</b>.',
    'Pelajaran ini membahas cara menelusuri pohon DOM (<i>traversing</i>), membuat node baru, menyisipkannya di posisi mana pun, serta menghapus, mengganti, dan menggandakan node.'
  ],
  objectives: [
    'Menelusuri DOM: induk, anak, dan saudara',
    'Membuat dan menyisipkan node di posisi tertentu',
    'Menghapus, mengganti, dan menggandakan node',
    'Membaca dan menulis atribut data-* lewat dataset'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Setiap elemen di DOM punya <b>hubungan keluarga</b>:</p><ul><li><b>Induk</b> (<i>parent</i>) — elemen yang membungkusnya</li><li><b>Anak</b> (<i>child</i>) — elemen di dalamnya</li><li><b>Saudara</b> (<i>sibling</i>) — elemen sejajar dengannya</li></ul><p>Browser menyediakan properti untuk menjelajahi hubungan itu tanpa harus menulis query selector setiap kali.</p>'
    },
    {
      type: 'example',
      title: 'Menelusuri pohon DOM',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Traversing</title>
</head>
<body>
  <ul id="menu">
    <li class="item">Home</li>
    <li class="item">Produk</li>
    <li class="item">Kontak</li>
  </ul>
  <p id="log"></p>

  <script>
    const menu = document.getElementById("menu");
    const produk = menu.children[1];

    const info = [
      "Induk: " + produk.parentElement.tagName,
      "Jumlah anak: " + menu.children.length,
      "Anak pertama: " + menu.firstElementChild.textContent,
      "Saudara sebelumnya: " + produk.previousElementSibling.textContent,
      "Saudara berikutnya: " + produk.nextElementSibling.textContent
    ];

    document.getElementById("log").textContent = info.join(" | ");
  <\/script>
</body>
</html>`,
      explain: [
        '<code>parentElement</code> / <code>parentNode</code> — elemen induk.',
        '<code>children</code> — koleksi <b>elemen</b> anak; <code>childNodes</code> menyertakan <b>node teks</b> (spasi dan baris baru) juga.',
        '<code>firstElementChild</code> dan <code>lastElementChild</code> — anak pertama dan terakhir.',
        '<code>nextElementSibling</code> / <code>previousElementSibling</code> — saudara sesudah dan sebelumnya.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat & menyisipkan node',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Sisip Node</title>
</head>
<body>
  <ul id="daftar">
    <li>Jeruk</li>
    <li>Apel</li>
  </ul>

  <script>
    const daftar = document.getElementById("daftar");

    // tambah di AKHIR
    const mangga = document.createElement("li");
    mangga.textContent = "Mangga";
    daftar.append(mangga);

    // tambah di AWAL
    const nanas = document.createElement("li");
    nanas.textContent = "Nanas";
    daftar.prepend(nanas);

    // sisip SEBELUM elemen tertentu
    const anggur = document.createElement("li");
    anggur.textContent = "Anggur";
    daftar.insertBefore(anggur, daftar.children[1]);
  <\/script>
</body>
</html>`,
      explain: [
        '<code>createElement("li")</code> membuat node di memori — belum tampil.',
        '<code>append(node)</code> memasang di akhir; <code>prepend(node)</code> di awal.',
        '<code>insertBefore(baru, acuan)</code> menyisipkan <b>sebelum</b> elemen acuan.',
        'Ada juga <code>before()</code> dan <code>after()</code> untuk menyisipkan relatif terhadap elemen itu sendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Menghapus, mengganti & menggandakan',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Hapus, Ganti, Gandakan</title>
</head>
<body>
  <ul id="a">
    <li id="hapus">Item yang dihapus</li>
    <li>Item tetap</li>
  </ul>
  <ul id="b"></ul>

  <script>
    const a = document.getElementById("a");

    // hapus elemen
    document.getElementById("hapus").remove();

    // ganti elemen
    const baru = document.createElement("li");
    baru.textContent = "Item pengganti";
    a.children[0].replaceWith(baru);

    // gandakan (true = termasuk seluruh isi)
    const salin = baru.cloneNode(true);
    document.getElementById("b").append(salin);
  <\/script>
</body>
</html>`,
      explain: [
        '<code>remove()</code> menghapus elemen dari pohon DOM.',
        '<code>replaceWith(node)</code> mengganti elemen dengan node baru (saudara tuanya: <code>replaceChild</code>).',
        '<code>cloneNode(true)</code> menggandakan — <code>true</code> berarti <b>rekursif</b>, termasuk semua anak dan teksnya.',
        '<code>cloneNode(false)</code> hanya menggandakan elemennya saja, tanpa isi.'
      ]
    },
    {
      type: 'example',
      title: 'Atribut data-* dan dataset',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>data-* & dataset</title>
</head>
<body>
  <button id="kartu" data-id="42" data-kategori="premium">Kartu</button>
  <p id="info"></p>

  <script>
    const kartu = document.getElementById("kartu");

    // baca atribut data-* lewat dataset
    document.getElementById("info").textContent =
      "ID: " + kartu.dataset.id + " | Kategori: " + kartu.dataset.kategori;

    // tulis nilai baru (muncul sebagai data-stok)
    kartu.dataset.stok = "12";
  <\/script>
</body>
</html>`,
      explain: [
        'Atribut <code>data-*</code> menyimpan <b>data ekstra</b> pada elemen tanpa mengubah tampilan.',
        '<code>dataset</code> membaca dan menulisnya dengan nama <b>camelCase</b>: <code>data-kategori</code> → <code>dataset.kategori</code>.',
        'Nama dengan strip berubah jadi huruf kapital: <code>data-harga-satuan</code> → <code>dataset.hargaSatuan</code>.',
        'Cara alternatif: <code>getAttribute("data-id")</code> dan <code>setAttribute("data-id", "42")</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'closest() — naik ke atas mencari induk',
      text: 'Mirip <code>querySelector</code>, tetapi <b>menelusuri ke atas</b>: <code>e.target.closest(".kartu")</code> mengembalikan elemen terdekat berkelas <code>kartu</code> dari elemen tersebut hingga ke akar. Sangat berguna dalam <b>event delegation</b>.'
    },
    {
      type: 'warn',
      title: 'children vs childNodes',
      text: '<code>childNodes</code> menyertakan <b>node teks</b> — spasi dan baris baru antar tag ikut terhitung! Untuk hampir semua kasus, pakai <code>children</code>, <code>firstElementChild</code>, dan <code>nextElementSibling</code> yang hanya menghitung <b>elemen</b>.'
    },
    {
      type: 'vocab',
      items: [
        ['Node', 'Unit terkecil di pohon DOM: elemen, teks, atau komentar.'],
        ['Element', 'Node yang merupakan elemen HTML (punya tag).'],
        ['Traversing', 'Menelusuri pohon DOM: ke induk, anak, atau saudara.'],
        ['children', 'Koleksi elemen anak langsung (tanpa node teks).'],
        ['insertBefore()', 'Menyisipkan node sebelum elemen acuan.'],
        ['replaceWith()', 'Mengganti elemen dengan node baru.'],
        ['cloneNode()', 'Menggandakan node; true berarti termasuk seluruh isinya.'],
        ['dataset', 'Akses atribut data-* dengan notasi camelCase.'],
        ['closest()', 'Mencari induk terdekat yang cocok dengan selektor.'],
        ['Event delegation', 'Satu penangan di induk untuk menangani event anak-anaknya.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: susun pohon dari nol',
      lang: 'html',
      hint: 'Kode ini menyusun judul dan daftar sepenuhnya lewat JS. Tambahkan satu <li> lagi, atau gandakan daftar dengan cloneNode!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Susun Pohon</title>
</head>
<body>
  <div id="kotak"></div>

  <script>
    const kotak = document.getElementById("kotak");

    // susun: div > h2 + ul > 3 li
    const judul = document.createElement("h2");
    judul.textContent = "Daftar Buahan";
    kotak.append(judul);

    const ul = document.createElement("ul");
    for (const nama of ["Mangga", "Jeruk", "Apel"]) {
      const li = document.createElement("li");
      li.textContent = nama;
      ul.append(li);
    }
    kotak.append(ul);

    // telusuri: induk dari judul adalah?
    console.log("Induk judul: #" + judul.parentElement.id);
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'DOM adalah pohon: setiap elemen punya induk, anak, dan saudara.',
    'parentElement, children, firstElementChild, nextElementSibling untuk traversing.',
    'append/prepend/insertBefore untuk menyisipkan node.',
    'remove() menghapus; replaceWith() mengganti; cloneNode(true) menggandakan.',
    'dataset membaca dan menulis atribut data-* secara praktis.',
    'children hanya menghitung elemen; childNodes juga menghitung node teks.',
  ]
});

/* ---------- Pelajaran: BOM — Window, Location, History & Penyimpanan ---------- */
window.JS_LESSONS.push({
  id: 'bom-javascript',
  title: 'BOM: Window, Location, History & Penyimpanan',
  chapter: 'DOM & BOM',
  duration: '13 menit',
  intro: [
    'Kalau <b>DOM</b> memodelkan isi halaman, <b>BOM</b> (<b>Browser Object Model</b>) memodelkan <b>browser itu sendiri</b>: jendela, alamat URL, riwayat navigasi, dan penyimpanan lokal.',
    'Objek <code>window</code> adalah akar dari semuanya — ia juga menjadi objek global di JavaScript browser.'
  ],
  objectives: [
    'Memahami BOM dan peran objek window',
    'Membaca bagian-bagian URL dengan location',
    'Memakai history, navigator, dan screen',
    'Menyimpan data dengan localStorage dan sessionStorage',
    'Mengatur waktu dengan setTimeout dan setInterval'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>BOM</b> adalah kumpulan objek yang disediakan browser untuk berinteraksi dengan <b>lingkungan di luar halaman</b>. Berbeda dengan DOM (standar W3C), BOM tidak punya standar tunggal — tetapi objek-objek utamanya didukung semua browser modern:</p><ul><li><b>window</b> — jendela browser, objek global</li><li><b>location</b> — URL halaman saat ini</li><li><b>history</b> — riwayat navigasi</li><li><b>navigator</b> — info browser dan pengguna</li><li><b>screen</b> — ukuran layar</li><li><b>localStorage / sessionStorage</b> — penyimpanan data</li></ul>'
    },
    {
      type: 'example',
      title: 'Objek window',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Objek Window</title>
</head>
<body>
  <ul id="info"></ul>

  <script>
    const info = [
      "Lebar viewport: " + window.innerWidth + "px",
      "Tinggi viewport: " + window.innerHeight + "px",
      "Posisi gulir: " + window.scrollY + "px",
      "Judul halaman: " + document.title
    ];

    document.getElementById("info").innerHTML =
      info.map(x => "<li>" + x + "</li>").join("");
  <\/script>
</body>
</html>`,
      explain: [
        '<code>window</code> adalah objek <b>global</b> — <code>alert()</code> sebenarnya <code>window.alert()</code>, <code>document</code> adalah <code>window.document</code>.',
        '<code>innerWidth</code>/<code>innerHeight</code> — ukuran area tampilan (viewport).',
        '<code>scrollX</code>/<code>scrollY</code> — posisi gulir saat ini.',
        'Di pratinjau terkotak, angka-angka ini adalah ukuran <b>iframe</b>, bukan jendela browser.'
      ]
    },
    {
      type: 'example',
      title: 'location — bagian-bagian URL',
      lang: 'javascript',
      output: false,
      code: `// Baca URL saat ini (mis. https://contoh.com/belajar/modul?id=7#pengantar)
location.href;      // URL lengkap
location.protocol;  // "https:"
location.hostname;  // "contoh.com"
location.pathname;  // "/belajar/modul"
location.search;    // "?id=7"
location.hash;      // "#pengantar"

// Pindah atau muat ulang (tidak jalan di pratinjau terkotak)
location.assign("https://contoh.com/beranda");
location.replace("https://contoh.com/beranda");  // tanpa jejak riwayat
location.reload();`,
      explain: [
        'Semua properti <code>location</code> bisa <b>dibaca</b> kapan saja.',
        '<code>assign(url)</code> pindah halaman dan menambah <b>riwayat</b> (tombol kembali bisa dipakai).',
        '<code>replace(url)</code> pindah <b>tanpa</b> menambah riwayat.',
        'Navigasi <b>diblokir</b> di pratinjau terkotak — coba di tab browser sungguhan.'
      ]
    },
    {
      type: 'example',
      title: 'history, navigator & screen',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>BOM Lainnya</title>
</head>
<body>
  <ul id="info"></ul>

  <script>
    const info = [
      "Entri riwayat: " + history.length,
      "Bahasa browser: " + navigator.language,
      "Koneksi aktif: " + navigator.onLine,
      "Ukuran layar: " + screen.width + " x " + screen.height
    ];

    document.getElementById("info").innerHTML =
      info.map(x => "<li>" + x + "</li>").join("");

    // berpindah di riwayat (diblokir di pratinjau terkotak)
    // history.back();      // satu langkah ke belakang
    // history.forward();   // satu langkah ke depan
    // history.go(-2);      // dua langkah ke belakang
  <\/script>
</body>
</html>`,
      explain: [
        '<code>history.length</code> — jumlah entri riwayat sesi ini.',
        '<code>history.back()</code> / <code>forward()</code> / <code>go(n)</code> — bergerak di riwayat seperti tombol browser.',
        '<code>navigator.language</code> dan <code>navigator.onLine</code> — info browser dan status jaringan.',
        '<code>screen.width</code>/<code>screen.height</code> — resolusi layar fisik.'
      ]
    },
    {
      type: 'example',
      title: 'localStorage & sessionStorage',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Penyimpanan</title>
</head>
<body>
  <p id="out"></p>

  <script>
    let pesan;
    try {
      localStorage.setItem("nama", "Andi");
      localStorage.setItem("kunjungan", "3");
      pesan = "Halo, " + localStorage.getItem("nama")
            + " (kunjungan ke-" + localStorage.getItem("kunjungan") + ")";
    } catch (err) {
      pesan = "Penyimpanan diblokir di pratinjau terkotak — coba di tab sungguhan.";
    }

    document.getElementById("out").textContent = pesan;
  <\/script>
</body>
</html>`,
      explain: [
        '<code>setItem(kunci, nilai)</code> menyimpan; <code>getItem(kunci)</code> membaca; <code>removeItem(kunci)</code> menghapus.',
        'Nilai <b>selalu string</b> — simpan objek dengan <code>JSON.stringify()</code>, baca kembali dengan <code>JSON.parse()</code>.',
        'Di pratinjau terkotak, storage <b>melempar error</b> (origin tidak transparan) — karena itu kode memakai <code>try/catch</code>.',
        '<code>sessionStorage</code> API-nya sama, tetapi cakupannya berbeda (lihat tips).'
      ]
    },
    {
      type: 'example',
      title: 'Timer: setTimeout & setInterval',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Timer</title>
</head>
<body>
  <p id="log">Menunggu...</p>

  <script>
    const log = document.getElementById("log");

    // jalan SATU KALI setelah 1 detik
    setTimeout(() => {
      log.textContent = "setTimeout: jalan sekali setelah 1 detik";
    }, 1000);

    // jalan BERULANG tiap 500 ms, berhenti setelah 3 kali
    let hitung = 0;
    const timer = setInterval(() => {
      hitung++;
      console.log("setInterval ke-" + hitung);
      if (hitung >= 3) clearInterval(timer);
    }, 500);
  <\/script>
</body>
</html>`,
      explain: [
        '<code>setTimeout(fungsi, ms)</code> menjalankan fungsi <b>satu kali</b> setelah jeda.',
        '<code>setInterval(fungsi, ms)</code> menjalankan fungsi <b>berulang</b> — simpan id-nya untuk dihentikan.',
        '<code>clearInterval(id)</code> dan <code>clearTimeout(id)</code> membatalkan timer.',
        'Waktu dalam <b>milidetik</b>: 1000 ms = 1 detik.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan lupa clearInterval',
      text: 'Interval yang tidak pernah dihentikan akan <b>terus berjalan</b> meski sudah tidak diperlukan — memboroskan memori dan CPU. Selalu simpan id kembalian <code>setInterval</code> dan panggil <code>clearInterval</code> saat selesai (mis. saat elemen dihapus atau halaman berpindah).'
    },
    {
      type: 'tip',
      title: 'localStorage vs sessionStorage',
      text: '<code>localStorage</code> bertahan <b>setelah browser ditutup</b> — cocok untuk preferensi pengguna. <code>sessionStorage</code> hilang saat <b>tab ditutup</b> — cocok untuk data sementara per sesi. Keduanya terbatas sekitar 5 MB dan hanya untuk string.'
    },
    {
      type: 'vocab',
      items: [
        ['BOM', 'Browser Object Model — objek untuk berinteraksi dengan browser.'],
        ['window', 'Objek jendela browser; sekaligus objek global di JS browser.'],
        ['location', 'Objek berisi URL saat ini dan fungsi navigasi.'],
        ['history', 'Objek riwayat navigasi: back(), forward(), go().'],
        ['navigator', 'Info tentang browser: bahasa, status online, user agent.'],
        ['screen', 'Info layar: width, height, warna.'],
        ['localStorage', 'Penyimpanan string yang bertahan setelah browser ditutup.'],
        ['sessionStorage', 'Penyimpanan string yang hilang saat tab ditutup.'],
        ['setTimeout / setInterval', 'Timer sekali dan berulang (milidetik).'],
        ['clearTimeout / clearInterval', 'Membatalkan timer.'],
        ['viewport', 'Area tampilan halaman di jendela browser.'],
        ['Origin', 'Asal (protokol+domain+port) yang menentukan izin penyimpanan.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: penghitung detik',
      lang: 'html',
      hint: 'Kode menghitung detik tiap detik. Ubah jeda setInterval, atau hentikan otomatis setelah 10 detik dengan clearInterval!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Penghitung</title>
</head>
<body>
  <p id="detik">Detik ke-0</p>

  <script>
    let n = 0;
    const el = document.getElementById("detik");

    const timer = setInterval(() => {
      n++;
      el.textContent = "Detik ke-" + n;
    }, 1000);

    // berhenti sendiri setelah 10 detik:
    setTimeout(() => {
      clearInterval(timer);
      el.textContent += " — selesai!";
    }, 10000);
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'BOM memodelkan browser: window, location, history, navigator, screen, storage.',
    'window adalah objek global — alert, document, dan lainnya adalah propertinya.',
    'location membaca bagian URL; assign/replace/reload untuk navigasi.',
    'history.back/forward/go berpindah di riwayat; navigator dan screen memberi info browser dan layar.',
    'localStorage bertahan; sessionStorage per tab; keduanya hanya menyimpan string.',
    'setTimeout sekali jalan; setInterval berulang — jangan lupa clearInterval.',
  ]
});
