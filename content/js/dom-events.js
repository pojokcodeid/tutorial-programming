/* ============================================================
   Pelajaran JavaScript — Bab 7: DOM & Event
   (topik info.md: "mengenal dan menggunakan dom"
    dan "memahami event di javascript")
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran 12: Mengenal dan Menggunakan DOM ---------- */
window.JS_LESSONS.push({
  id: 'mengenal-dan-menggunakan-dom',
  title: 'Mengenal dan Menggunakan DOM',
  chapter: 'DOM & Event',
  duration: '13 menit',
  intro: [
    'Ketika browser memuat halaman, ia membangun <b>pohon</b> dari seluruh elemen — itulah <b>DOM</b> (<i>Document Object Model</i>). JavaScript bisa <b>mencari, mengubah, menambah, dan menghapus</b> elemen di pohon itu — halaman pun menjadi hidup.',
    'Pelajaran ini membahas cara memilih dan mengubah elemen.'
  ],
  objectives: [
    'Memahami apa itu DOM',
    'Memilih elemen dengan querySelector dan getElementById',
    'Mengubah teks, atribut, dan kelas elemen',
    'Membuat dan menambahkan elemen baru'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>DOM</b> adalah representasi halaman sebagai <b>pohon objek</b>: setiap tag, teks, dan komentar jadi <i>node</i> yang punya induk dan anak.</p><p>JavaScript memakai <b>API DOM</b> untuk menjelajahi dan mengubah pohon itu. Contoh:</p><ul><li><code>document.querySelector(".menu")</code> — cari elemen pertama berkelas <code>menu</code></li><li><code>elemen.textContent = "...</code> — ubah teksnya</li><li><code>document.createElement("div")</code> — buat elemen baru</li></ul>'
    },
    {
      type: 'example',
      title: 'Memilih elemen',
      lang: 'javascript',
      output: false,
      code: `// paling umum: selektor CSS apa pun
const judul = document.querySelector("h1");
const pertama = document.querySelector(".kartu");

// khusus id
const form = document.getElementById("masuk");

// semua elemen yang cocok (koleksi)
const semua = document.querySelectorAll(".item");
semua.length;     // berapa banyak
semua[0];          // elemen pertama

// cara lama (masih dipakai)
document.getElementsByTagName("p");`,
      explain: [
        '<code>querySelector</code> menerima <b>selektor CSS apa pun</b> dan mengembalikan elemen <b>pertama</b> yang cocok.',
        '<code>querySelectorAll</code> mengembalikan <b>semua</b> elemen yang cocok.',
        '<code>getElementById</code> sedikit lebih cepat untuk id tunggal.',
        'Hasil <code>null</code> bila tidak ditemukan — selalu periksa!'
      ]
    },
    {
      type: 'example',
      title: 'Mengubah elemen',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Ubah Elemen</title>
  <style>
    .tegas { font-weight: bold; color: #B23A48; }
  </style>
</head>
<body>
  <h1 id="judul">Judul Lama</h1>
  <p id="info">Teks awal.</p>

  <script>
    const judul = document.getElementById("judul");
    const info = document.getElementById("info");

    // ubah teks
    judul.textContent = "Judul Baru!";

    // ubah atribut
    info.setAttribute("data-status", "aktif");

    // ubah kelas
    info.classList.add("tegas");

    // baca isi
    console.log(info.getAttribute("data-status"));
  <\/script>
</body>
</html>`,
      explain: [
        '<code>textContent</code> mengubah <b>teks</b> elemen secara aman.',
        '<code>setAttribute/getAttribute</code> membaca dan menulis <b>atribut</b>.',
        '<code>classList</code> punya <code>add</code>, <code>remove</code>, <code>toggle</code>, dan <code>contains</code>.',
        '<code>innerHTML</code> juga bisa mengubah isi — tetapi berhati-hatilah dengan konten dari pengguna (lihat peringatan).'
      ]
    },
    {
      type: 'example',
      title: 'Membuat & menghapus elemen',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tambah Elemen</title>
</head>
<body>
  <ul id="daftar">
    <li>Item pertama</li>
  </ul>

  <script>
    const daftar = document.getElementById("daftar");

    // buat elemen baru
    const baru = document.createElement("li");
    baru.textContent = "Item kedua (dibuat JS)";

    // tambahkan ke akhir daftar
    daftar.appendChild(baru);

    // contoh menghapus elemen pertama
    daftar.removeChild(daftar.firstElementChild);
  <\/script>
</body>
</html>`,
      explain: [
        '<code>createElement("li")</code> membuat elemen <b>di memori</b> — belum tampil di halaman.',
        '<code>appendChild(baru)</code> memasangkannya ke induk — barulah ia terlihat.',
        '<code>removeChild(el)</code> mengeluarkan elemen dari induknya.',
        'Elemen juga bisa dibuat dari HTML: <code>baru.insertAdjacentHTML("beforeend", "<li>...</li>")</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'innerHTML dan keamanan (XSS)',
      text: '<code>innerHTML</code> menafsirkan tag HTML — berbahaya bila isinya dari <b>input pengunjung</b>: kode jahat bisa disisipkan (<i>cross-site scripting</i>). Untuk teks dari pengguna, selalu pakai <code>textContent</code>.'
    },
    {
      type: 'tip',
      title: 'Perbarui CSS dari JS',
      text: 'Untuk gaya langsung: <code>elemen.style.color = "navy"</code> (nama properti jadi camelCase: <code>background-color</code> → <code>backgroundColor</code>). Untuk perubahan besar, lebih rapi menambah/menghapus <b>kelas</b> lewat <code>classList</code> dan biarkan CSS bekerja.'
    },
    {
      type: 'vocab',
      items: [
        ['DOM', 'Document Object Model — pohon objek yang merepresentasikan halaman.'],
        ['Node', 'Setiap elemen/teks/komentar dalam pohon DOM.'],
        ['querySelector()', 'Memilih elemen pertama yang cocok dengan selektor CSS.'],
        ['querySelectorAll()', 'Memilih semua elemen yang cocok.'],
        ['textContent', 'Teks di dalam elemen (aman dari XSS).'],
        ['classList', 'Daftar kelas elemen: add, remove, toggle, contains.'],
        ['createElement()', 'Membuat elemen baru di memori.'],
        ['appendChild()', 'Memasang elemen sebagai anak terakhir induk.'],
        ['XSS', 'Cross-site scripting — serangan menyisipkan kode via input.'],
        ['API', 'Antarmuka yang disediakan browser untuk dipakai program.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: daftar tugas (tanpa tombol dulu)',
      lang: 'html',
      hint: 'Kode ini menambah item otomatis. Coba ganti teksnya, atau tambahkan satu createElement lagi untuk item ketiga!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Daftar Tugas</title>
</head>
<body>
  <h2>Daftar Tugas</h2>
  <ul id="tugas">
    <li>Belajar DOM</li>
  </ul>

  <script>
    const daftar = document.getElementById("tugas");

    function tambahTugas(teks) {
      const li = document.createElement("li");
      li.textContent = teks;
      daftar.appendChild(li);
    }

    tambahTugas("Latihan querySelector");
    tambahTugas("Buat elemen sendiri");
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'DOM adalah pohon objek dari halaman; JS bisa mengubahnya.',
    'querySelector/querySelectorAll memilih elemen dengan selektor CSS.',
    'textContent untuk teks; setAttribute untuk atribut; classList untuk kelas.',
    'createElement + appendChild menambah elemen baru.',
    'Hindari innerHTML untuk konten dari pengguna (XSS).',
  ]
});

/* ---------- Pelajaran 13: Memahami Event di JavaScript ---------- */
window.JS_LESSONS.push({
  id: 'memahami-event-javascript',
  title: 'Memahami Event di JavaScript',
  chapter: 'DOM & Event',
  duration: '13 menit',
  intro: [
    '<b>Event</b> adalah segala hal yang <b>terjadi</b> di halaman: klik, penekanan tombol, pengisian form, halaman selesai dimuat. JavaScript bisa <b>mendengarkan</b> event dan menjalankan kode sebagai respons — inilah inti interaktivitas web.',
    'Pelajaran ini membahas addEventListener, objek event, dan form.'
  ],
  objectives: [
    'Menambahkan penangan event dengan addEventListener',
    'Mengenal event umum: click, input, submit, keydown',
    'Memakai objek event dan preventDefault',
    'Memahami penghapusan penangan event'
  ],
  sections: [
    {
      type: 'example',
      title: 'addEventListener — cara modern',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Klik</title>
</head>
<body>
  <button id="tombol">Klik aku!</button>
  <p id="hitung">Klik: 0 kali</p>

  <script>
    const tombol = document.getElementById("tombol");
    const hitung = document.getElementById("hitung");
    let jumlah = 0;

    tombol.addEventListener("click", function () {
      jumlah = jumlah + 1;
      hitung.textContent = "Klik: " + jumlah + " kali";
    });
  <\/script>
</body>
</html>`,
      explain: [
        '<code>addEventListener("click", fungsi)</code> mendaftarkan fungsi yang jalan saat event terjadi.',
        'Satu elemen boleh punya <b>banyak penangan</b> untuk event yang sama.',
        'Fungsi penangan bisa berupa <code>function () { ... }</code> atau <b>arrow function</b> <code>() => { ... }</code>.',
        'Event umum lain: <code>mouseover</code>, <code>keydown</code>, <code>change</code>, <code>submit</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Event input — merespons pengetikan',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Input Langsung</title>
</head>
<body>
  <input type="text" id="nama" placeholder="Ketik nama...">
  <p id="sapa">Halo, ?</p>

  <script>
    const input = document.getElementById("nama");
    const sapa = document.getElementById("sapa");

    input.addEventListener("input", function () {
      sapa.textContent = "Halo, " + input.value + "!";
    });
  <\/script>
</body>
</html>`,
      explain: [
        'Event <code>input</code> terjadi <b>setiap kali</b> isi kolom berubah.',
        '<code>input.value</code> membaca teks yang sedang diketik.',
        'Pola ini dipakai untuk validasi langsung, pencarian instan, dan preview.',
        'Untuk elemen <code>&lt;select&gt;</code> dan checkbox, event yang tepat adalah <code>change</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Form submit & preventDefault',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Form</title>
</head>
<body>
  <form id="form">
    <input type="text" name="kota" placeholder="Kota kamu">
    <button type="submit">Simpan</button>
  </form>
  <p id="hasil"></p>

  <script>
    const form = document.getElementById("form");

    form.addEventListener("submit", function (event) {
      event.preventDefault();  // batalkan muat ulang halaman

      const kota = form.kota.value;
      document.getElementById("hasil").textContent =
        "Kota tersimpan: " + kota;
    });
  <\/script>
</body>
</html>`,
      explain: [
        'Tanpa <code>preventDefault()</code>, menekan submit <b>memuat ulang halaman</b> — perilaku bawaan form.',
        '<code>event</code> adalah objek berisi info event; <code>preventDefault()</code> membatalkan aksi bawaannya.',
        '<code>form.kota.value</code> membaca input lewat nama field-nya.',
        'Pola ini adalah dasar <b>form tanpa memuat ulang</b> (AJAX/fetch).'
      ]
    },
    {
      type: 'example',
      title: 'Objek event & menghapus penangan',
      lang: 'javascript',
      output: false,
      code: `// objek event punya banyak informasi
tombol.addEventListener("click", (e) => {
  console.log("Elemen:", e.target);      // elemen yang diklik
  console.log("Tipe:", e.type);          // "click"
});

// penangan bernama agar bisa dihapus
function penangan() {
  console.log("sekali saja");
  tombol.removeEventListener("click", penangan);
}
tombol.addEventListener("click", penangan);`,
      explain: [
        '<code>e.target</code> adalah elemen <b>yang memicu</b> event — berguna untuk elemen yang dibuat dinamis.',
        '<code>e.type</code> memberi nama event.',
        'Untuk <code>removeEventListener</code>, penangan harus <b>fungsi bernama</b> (bukan fungsi anonim).',
        'Bisa juga pakai opsi <code>{ once: true }</code> agar penangan otomatis dihapus setelah sekali jalan.'
      ]
    },
    {
      type: 'tip',
      title: 'Event delegation',
      text: 'Daripada memasang penangan ke <b>setiap</b> item daftar, pasang satu penangan di <b>induknya</b> dan periksa <code>e.target</code>. Lebih hemat memori, dan otomatis berlaku untuk item yang ditambahkan kemudian.'
    },
    {
      type: 'warn',
      title: 'Jangan pakai atribut onclick',
      text: 'Menulis <code>onclick="..."</code> di HTML mencampur kode dengan struktur dan hanya mengizinkan satu penangan. <code>addEventListener</code> lebih fleksibel, lebih rapi, dan memisahkan JS dari HTML.'
    },
    {
      type: 'vocab',
      items: [
        ['Event', 'Kejadian di halaman: klik, input, submit, dan lainnya.'],
        ['addEventListener()', 'Mendaftarkan fungsi penangan untuk suatu event.'],
        ['Penangan event', 'Fungsi yang dijalankan saat event terjadi.'],
        ['Objek event', 'Objek berisi info event (target, type, dan lainnya).'],
        ['preventDefault()', 'Membatalkan aksi bawaan browser untuk event itu.'],
        ['target', 'Properti objek event yang menunjuk elemen pemicu.'],
        ['Event delegation', 'Satu penangan di induk untuk menangani event anak-anaknya.'],
        ['removeEventListener()', 'Menghapus penangan event yang sudah terdaftar.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: tombol ajaib',
      lang: 'html',
      hint: 'Jalankan lalu klik tombolnya. Tambahkan event "mouseover" untuk mengubah teks saat kursor berada di atas tombol.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Tombol Ajaib</title>
  <style>
    body { font-family: system-ui, sans-serif; }
    button { font-size: 18px; padding: 8px 16px; }
  </style>
</head>
<body>
  <button id="ajaib">Klik aku!</button>
  <p id="pesan">Belum ada aksi.</p>

  <script>
    const tombol = document.getElementById("ajaib");
    const pesan = document.getElementById("pesan");
    let hitung = 0;

    tombol.addEventListener("click", () => {
      hitung++;
      pesan.textContent = "Tombol diklik " + hitung + " kali!";
    });
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Event adalah kejadian di halaman; addEventListener mendengarkannya.',
    'Event umum: click, input, change, submit, keydown.',
    'Objek event memberi info seperti e.target dan e.type.',
    'preventDefault() membatalkan aksi bawaan (mis. muat ulang form).',
    'Penangan bernama bisa dihapus dengan removeEventListener.',
    'addEventListener lebih baik daripada atribut onclick.',
  ]
});
