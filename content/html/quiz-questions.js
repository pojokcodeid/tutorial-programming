/* ============================================================
   Kumpulan soal kuis HTML — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.HTML_QUIZ_POOL = [
  {
    id: 'q01',
    q: 'Apa kepanjangan dari HTML?',
    options: ['HyperText Markup Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'HighText Machine Language'],
    answer: 0,
    explain: 'HTML = HyperText Markup Language, yaitu bahasa markah untuk menyusun struktur halaman web.'
  },
  {
    id: 'q02',
    q: 'HTML termasuk jenis bahasa apa?',
    options: ['Bahasa markah (markup language)', 'Bahasa pemrograman tingkat tinggi', 'Bahasa query database', 'Bahasa assembly'],
    answer: 0,
    explain: 'HTML adalah bahasa markah: ia mendeskripsikan struktur konten, bukan logika/kondisi seperti bahasa pemrograman.'
  },
  {
    id: 'q03',
    q: 'Apa fungsi dari baris <!DOCTYPE html> di awal dokumen?',
    options: ['Memberi tahu browser bahwa ini dokumen HTML5', 'Membuat halaman berbahasa Indonesia', 'Menyimpan halaman secara offline', 'Menjalankan JavaScript'],
    answer: 0,
    explain: 'Doctype memberi tahu browser standar HTML yang dipakai. HTML5 cukup ditulis <!DOCTYPE html>.'
  },
  {
    id: 'q04',
    q: 'Di bagian elemen mana konten yang terlihat oleh pengunjung diletakkan?',
    options: ['Di dalam elemen <body>', 'Di dalam elemen <head>', 'Di dalam elemen <title>', 'Di luar elemen <html>'],
    answer: 0,
    explain: 'Semua konten yang terlihat (teks, gambar, tombol) diletakkan di dalam <body>. <head> berisi pengaturan, bukan konten tampilan.'
  },
  {
    id: 'q05',
    q: 'Elemen berikut yang TIDAK memerlukan tag penutup adalah…',
    options: ['<img>', '<p>', '<strong>', '<a>'],
    answer: 0,
    explain: '<img> adalah elemen kosong (void element) — ia ditulis sendiri tanpa tag penutup, sama seperti <br>, <hr>, dan <input>.'
  },
  {
    id: 'q06',
    q: 'Berapa jumlah elemen <h1> yang disarankan dalam satu halaman?',
    options: ['Satu', 'Dua', 'Tidak ada batasan', 'Sepuluh'],
    answer: 0,
    explain: 'Sebaiknya hanya satu <h1> per halaman sebagai judul utama; sisanya gunakan h2–h6 agar struktur rapi dan ramah mesin pencari.'
  },
  {
    id: 'q07',
    q: 'Pasangan tag heading yang ukurannya PALING KECIL adalah…',
    options: ['<h6>', '<h1>', '<h5>', '<h3>'],
    answer: 0,
    explain: 'Urutan dari yang terbesar: h1, h2, h3, h4, h5, h6. Semakin besar angkanya, semakin kecil ukuran teksnya.'
  },
  {
    id: 'q08',
    q: 'Atribut yang dipakai pada tag <a> untuk menentukan tujuan tautan adalah…',
    options: ['href', 'src', 'link', 'url'],
    answer: 0,
    explain: 'Atribut href diisi alamat tujuan, misalnya <a href="https://example.com">. Atribut src khusus untuk menyisipkan berkas seperti gambar.'
  },
  {
    id: 'q09',
    q: 'Tag yang digunakan untuk pindah ke baris baru di dalam paragraf adalah…',
    options: ['<br>', '<hr>', '<line>', '<new>'],
    answer: 0,
    explain: '<br> (line break) memindahkan teks ke baris berikutnya. <hr> membuat garis pemisah horizontal.'
  },
  {
    id: 'q10',
    q: 'Apa fungsi atribut alt pada tag <img>?',
    options: ['Teks alternatif bila gambar gagal tampil & untuk pembaca layar', 'Mengatur ukuran gambar', 'Mengatur format gambar', 'Menentukan nama file gambar'],
    answer: 0,
    explain: 'alt mendeskripsikan isi gambar. Ia muncul saat gambar gagal dimuat dan dibacakan oleh pembaca layar (aksesibilitas).'
  },
  {
    id: 'q11',
    q: 'Tag yang tepat untuk membuat daftar dengan penomoran otomatis adalah…',
    options: ['<ol>', '<ul>', '<dl>', '<num>'],
    answer: 0,
    explain: '<ol> (ordered list) menghasilkan daftar bernomor. Setiap item ditulis dengan <li>.'
  },
  {
    id: 'q12',
    q: 'Tag untuk membuat daftar dengan penanda titik (bullet) adalah…',
    options: ['<ul>', '<ol>', '<bullet>', '<li>'],
    answer: 0,
    explain: '<ul> (unordered list) menghasilkan daftar berbullet. Ingat: <li> hanya item, bukan pembungkus daftar.'
  },
  {
    id: 'q13',
    q: 'Tag yang mewakili satu baris pada tabel adalah…',
    options: ['<tr>', '<td>', '<table>', '<row>'],
    answer: 0,
    explain: '<tr> (table row) = satu baris tabel. Di dalamnya baru ada <th> (kepala) atau <td> (data).'
  },
  {
    id: 'q14',
    q: 'Agar satu sel header tabel membentang dua kolom, gunakan atribut…',
    options: ['colspan="2"', 'rowspan="2"', 'width="2"', 'span="2"'],
    answer: 0,
    explain: 'colspan menggabungkan sel secara horizontal (antar kolom), sedangkan rowspan menggabungkan secara vertikal (antar baris).'
  },
  {
    id: 'q15',
    q: 'Elemen yang menghubungkan keterangan teks dengan isian formulir adalah…',
    options: ['<label>', '<span>', '<p>', '<name>'],
    answer: 0,
    explain: '<label for="id-input"> dihubungkan dengan atribut id pada input. Klik pada label akan menfokuskan input terkait.'
  },
  {
    id: 'q16',
    q: 'Atribut agar isian formulir wajib diisi sebelum dikirim adalah…',
    options: ['required', 'mandatory', 'must', 'validate'],
    answer: 0,
    explain: 'Atribut required membuat browser menolak pengiriman formulir bila isian itu masih kosong.'
  },
  {
    id: 'q17',
    q: 'Cara membuat input kata sandi (karakter tersembunyi) adalah…',
    options: ['<input type="password">', '<input type="secret">', '<input type="text">', '<input type="key">'],
    answer: 0,
    explain: 'type="password" menyembunyikan karakter yang diketik. Jangan pernah menampilkan kata sandi sebagai type="text".'
  },
  {
    id: 'q18',
    q: 'Elemen berikut yang bersifat SEMANTIK (memiliki makna) adalah…',
    options: ['<article>', '<div>', '<span>', '<b>'],
    answer: 0,
    explain: '<article>, <header>, <nav>, <section>, <footer> adalah elemen semantik. <div> dan <span> hanyalah pembungkus netral.'
  },
  {
    id: 'q19',
    q: 'Elemen yang tepat untuk membuat menu navigasi antar halaman adalah…',
    options: ['<nav>', '<footer>', '<head>', '<menu>'],
    answer: 0,
    explain: '<nav> menandai kumpulan tautan navigasi utama. <footer> adalah bagian penutup halaman.'
  },
  {
    id: 'q20',
    q: 'Atribut pada tag <audio> yang menunjuk ke lokasi file suara adalah…',
    options: ['src', 'href', 'link', 'file'],
    answer: 0,
    explain: 'Sama seperti gambar, media audio dan video memakai atribut src untuk lokasi berkasnya.'
  },
  {
    id: 'q21',
    q: 'Apa fungsi dari <meta charset="UTF-8">?',
    options: ['Memastikan karakter & huruf (termasuk Indonesia) tampil benar', 'Mempercepat loading halaman', 'Menyembunyikan halaman dari pencarian', 'Mengatur ukuran font'],
    answer: 0,
    explain: 'UTF-8 mendukung hampir semua karakter dunia — termasuk tanda petik, emoji, dan huruf khusus — sehingga tidak tampak kacau.'
  },
  {
    id: 'q22',
    q: 'Tag <meta name="viewport"> digunakan untuk…',
    options: ['Halaman tampil proporsional di layar HP', 'Menguatkan kata sandi', 'Menyimpan data pengguna', 'Menyambungkan database'],
    answer: 0,
    explain: 'Viewport memberi tahu browser cara menyesuaikan lebar halaman dengan lebar layar perangkat, penting untuk desain responsif.'
  },
  {
    id: 'q23',
    q: 'Bahasa yang bertugas mengatur tampilan/gaya (warna, ukuran, tata letak) halaman HTML adalah…',
    options: ['CSS', 'HTML', 'SQL', 'Python'],
    answer: 0,
    explain: 'HTML menyusun struktur, CSS (Cascading Style Sheets) mengatur tampilan, dan JavaScript menangani interaksi.'
  },
  {
    id: 'q24',
    q: 'Apa yang berisiko terjadi bila tag penutup seperti </p> atau </b> dilupakan?',
    options: ['Struktur halaman bisa rusak / tampilan jadi tidak terduga', 'Halaman tidak bisa dibuka sama sekali', 'File otomatis terhapus', 'Tidak ada efek apa pun'],
    answer: 0,
    explain: 'Browser akan mencoba menebak sendiri di mana tag ditutup — hasilnya sering kali tidak sesuai yang kamu inginkan. Selalu tutup tag dengan rapi.'
  }
];