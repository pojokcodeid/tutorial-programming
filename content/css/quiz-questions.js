/* ============================================================
   Kumpulan soal kuis CSS — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.CSS_QUIZ_POOL = [
  {
    id: 'q01',
    q: 'Apa kepanjangan dari CSS?',
    options: ['Cascading Style Sheets', 'Computer Style System', 'Cascading Script Styles', 'Colorful Style Sheets'],
    answer: 0,
    explain: 'CSS = Cascading Style Sheets, bahasa untuk mengatur tampilan halaman web.'
  },
  {
    id: 'q02',
    q: 'Stylesheet internal (internal stylesheet) diletakkan di mana?',
    options: ['Di dalam tag <style> pada bagian <head>', 'Di dalam tag <body> sebelum konten', 'Di atribut style pada tag <html>', 'Di berkas terpisah yang wajib bernama index.css'],
    answer: 0,
    explain: 'Stylesheet internal ditulis di dalam <style> yang diletakkan di <head> — pengaturan tampilan, bukan konten.'
  },
  {
    id: 'q03',
    q: 'Cara paling direkomendasikan untuk memakai CSS di situs dengan banyak halaman adalah…',
    options: ['Satu berkas .css yang dipanggil dengan <link> di tiap halaman', 'Menyalin aturan yang sama ke <style> tiap halaman', 'Inline style di setiap elemen', 'Menulis CSS di dalam atribut alt'],
    answer: 0,
    explain: 'Berkas .css terpisah dipakai bersama oleh semua halaman — ubah sekali, seluruh situs berubah.'
  },
  {
    id: 'q04',
    q: 'Manakah sintaks aturan CSS yang benar?',
    options: ['p { color: navy; }', 'p: color = navy;', 'color: navy; p {}', 'p { color navy }'],
    answer: 0,
    explain: 'Pola aturan: selektor { properti: nilai; } — titik dua memisahkan properti dan nilai, titik koma mengakhiri deklarasi.'
  },
  {
    id: 'q05',
    q: 'Selektor untuk semua elemen yang punya kelas "kartu" adalah…',
    options: ['.kartu', '#kartu', 'kartu', '*kartu'],
    answer: 0,
    explain: 'Titik (.) di depan nama kelas. Tanda pagar (#) dipakai untuk id, bukan kelas.'
  },
  {
    id: 'q06',
    q: 'Selektor untuk elemen dengan id "judul" adalah…',
    options: ['#judul', '.judul', '*judul', 'id=judul'],
    answer: 0,
    explain: 'Tanda pagar (#) memilih id. Id sebaiknya unik dalam satu halaman.'
  },
  {
    id: 'q07',
    q: 'Selektor "nav > a" memilih…',
    options: ['Elemen <a> yang menjadi anak langsung dari <nav>', 'Semua elemen <a> di mana pun dalam halaman', 'Elemen <nav> di dalam elemen <a>', 'Elemen <a> yang berada setelah <nav>'],
    answer: 0,
    explain: 'Kombinator anak (>) hanya memilih turunan langsung, berbeda dengan selektor turunan (spasi) yang memilih semua keturunan.'
  },
  {
    id: 'q08',
    q: 'Perbedaan padding dan margin adalah…',
    options: ['Padding di dalam border, margin di luar border', 'Padding di luar border, margin di dalam border', 'Keduanya sama, hanya beda nama', 'Padding untuk teks, margin untuk gambar'],
    answer: 0,
    explain: 'Padding = jarak antara konten dan border (di dalam); margin = jarak antara border dan elemen lain (di luar).'
  },
  {
    id: 'q09',
    q: 'Apa akibat dari "box-sizing: border-box"?',
    options: ['Lebar (width) sudah termasuk padding dan border', 'Border tidak digambar sama sekali', 'Elemen selalu berukuran 100% layar', 'Padding menjadi dua kali lipat'],
    answer: 0,
    explain: 'Dengan border-box, width yang kamu tulis adalah ukuran total tampilan — membuat tata letak jauh lebih mudah dihitung.'
  },
  {
    id: 'q10',
    q: 'Urutan komponen box model dari yang paling dalam ke paling luar adalah…',
    options: ['Konten → padding → border → margin', 'Margin → border → padding → konten', 'Konten → margin → border → padding', 'Border → konten → padding → margin'],
    answer: 0,
    explain: 'Di dalam ada konten, lalu padding, lalu border, dan paling luar margin.'
  },
  {
    id: 'q11',
    q: 'Perbedaan "display: none" dan "visibility: hidden" adalah…',
    options: ['display:none menghilangkan elemen beserta ruangnya; visibility:hidden menyembunyikan tapi ruangnya tetap ada', 'Keduanya persis sama', 'visibility:hidden menghapus elemen dari HTML', 'display:none hanya menyembunyikan sementara'],
    answer: 0,
    explain: 'display:none membuat elemen tak ada dalam tata letak (seperti tak pernah ada); visibility:hidden membuatnya tak terlihat tetapi tetap memesan ruang.'
  },
  {
    id: 'q12',
    q: 'Nilai position yang membuat elemen selalu menempel di sudut layar meski halaman digulir adalah…',
    options: ['fixed', 'absolute', 'relative', 'static'],
    answer: 0,
    explain: 'fixed menempel pada viewport (layar), jadi elemen ikut "melayang" saat digulir — cocok untuk tombol kembali ke atas.'
  },
  {
    id: 'q13',
    q: 'Properti z-index hanya berpengaruh pada elemen yang…',
    options: ['Di-position (position: relative/absolute/fixed/sticky)', 'Berwarna merah', 'Berada di dalam <table>', 'Punya atribut id'],
    answer: 0,
    explain: 'z-index mengatur urutan tumpukan elemen ber-position; pada elemen static, z-index diabaikan.'
  },
  {
    id: 'q14',
    q: 'Pada flexbox, justify-content mengatur…',
    options: ['Jarak & perataan item sepanjang sumbu utama', 'Warna latar container', 'Perataan item pada sumbu lintang', 'Ukuran font item'],
    answer: 0,
    explain: 'justify-content bekerja pada sumbu utama (misal horizontal jika flex-direction: row) — mulai, tengah, akhir, atau di antara item.'
  },
  {
    id: 'q15',
    q: 'Pada flexbox, align-items mengatur…',
    options: ['Perataan item pada sumbu lintang (tegak lurus sumbu utama)', 'Jarak antar baris teks', 'Urutan tampilan item', 'Batas maksimum lebar container'],
    answer: 0,
    explain: 'align-items meratakan item pada sumbu silang, misal membuat semua kartu sejajar atas atau tengah.'
  },
  {
    id: 'q16',
    q: 'Properti "gap" pada flexbox dan grid berfungsi untuk…',
    options: ['Memberi jarak antar item tanpa memakai margin', 'Menutup celah di tepi container', 'Menyembunyikan item kosong', 'Mengubah arah alur item'],
    answer: 0,
    explain: 'gap (row-gap/column-gap) memberi jarak antar item secara merata dan tidak menambah jarak di tepi container.'
  },
  {
    id: 'q17',
    q: 'Unit "fr" pada CSS Grid artinya…',
    options: ['Porsi (fraction) dari ruang yang tersedia di container', 'Font-relative, seperti em', 'Fixed radius dalam piksel', 'Frame rate animasi'],
    answer: 0,
    explain: 'fr membagi ruang yang tersisa menurut porsinya — 1fr 2fr berarti kolom kedua dua kali lebih lebar dari kolom pertama.'
  },
  {
    id: 'q18',
    q: '"grid-template-columns: repeat(3, 1fr)" sama artinya dengan…',
    options: ['grid-template-columns: 1fr 1fr 1fr', 'grid-template-columns: 3fr', 'grid-template-columns: 3px 1fr', 'grid-template-columns: 1fr 3fr'],
    answer: 0,
    explain: 'repeat(3, 1fr) mengulang pola "1fr" sebanyak tiga kali — cara ringkas untuk kolom berjumlah banyak.'
  },
  {
    id: 'q19',
    q: 'Media query yang tepat untuk aturan khusus layar selebar maksimal 600px adalah…',
    options: ['@media (max-width: 600px) { … }', '@media (min-width: 600px) { … }', '@media screen = 600px { … }', '@media width(600px) { … }'],
    answer: 0,
    explain: 'max-width membatasi aturan hanya untuk viewport yang lebarnya sampai 600px — cocok untuk gaya HP.'
  },
  {
    id: 'q20',
    q: 'Tag meta apa yang wajib ada agar halaman responsif di ponsel?',
    options: ['<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="mobile" content="true">', '<meta charset="UTF-8">', '<meta name="responsive" content="yes">'],
    answer: 0,
    explain: 'Viewport meta memberi tahu browser untuk memakai lebar perangkat — tanpa ini, halaman tampil seolah layar desktop di HP.'
  },
  {
    id: 'q21',
    q: ':hover adalah contoh dari…',
    options: ['Pseudo-class', 'Pseudo-element', 'Selektor atribut', 'Variabel CSS'],
    answer: 0,
    explain: 'Pseudo-class (satu titik dua) menyasar keadaan elemen: hover, focus, active, visited, nth-child, dan sebagainya.'
  },
  {
    id: 'q22',
    q: '::before adalah contoh dari…',
    options: ['Pseudo-element', 'Pseudo-class', 'Properti animasi', 'Selektor universal'],
    answer: 0,
    explain: 'Pseudo-element (dua titik dua) menyisipkan atau menyasar bagian virtual elemen, misal ::before, ::after, ::first-line.'
  },
  {
    id: 'q23',
    q: 'Apa arti dari "transition: color 0.3s ease"?',
    options: ['Perubahan warna berlangsung 0,3 detik dengan peralihan mulus', 'Warna berubah setiap 0,3 detik terus-menerus', 'Elemen menghilang setelah 0,3 detik', 'Font membesar 0,3 kali'],
    answer: 0,
    explain: 'transition menghaluskan perubahan properti: nama properti, durasi, lalu fungsi waktu (ease, linear, ease-in-out).'
  },
  {
    id: 'q24',
    q: '@keyframes dipakai untuk…',
    options: ['Mendefinisikan tahapan sebuah animasi', 'Mengatur jeda antar frame video', 'Membuat bingkai gambar', 'Menyembunyikan frame elemen'],
    answer: 0,
    explain: '@keyframes menuliskan keadaan di tiap titik waktu (0%, 50%, 100%), lalu dipakai lewat properti animation.'
  },
  {
    id: 'q25',
    q: 'Pada "box-shadow: 2px 4px 8px rgba(0,0,0,0.25)", angka 8 adalah…',
    options: ['Jari-jari blur (kelembutan bayangan)', 'Jarak bayangan ke kanan', 'Lebar elemen dalam piksel', 'Tingkat kegelapan permanen'],
    answer: 0,
    explain: 'Urutannya: offset-x, offset-y, blur (semakin besar semakin lembut), lalu opsional spread dan warna.'
  },
  {
    id: 'q26',
    q: 'Cara mendeklarasikan variabel CSS yang benar adalah…',
    options: ['--warna: navy;', 'var warna = navy;', 'warna: --navy;', '$warna: navy;'],
    answer: 0,
    explain: 'Variabel CSS (custom property) diawali dua tanda minus dan ditulis seperti deklarasi biasa, biasanya di :root.'
  },
  {
    id: 'q27',
    q: 'Cara memakai variabel CSS "--warna" adalah…',
    options: ['var(--warna)', '--var(warna)', 'use(--warna)', 'getVar("warna")'],
    answer: 0,
    explain: 'Fungsi var() mengambil nilai variabel; boleh ditambah nilai cadangan: var(--warna, navy).'
  },
  {
    id: 'q28',
    q: 'Mengapa "rem" lebih disarankan daripada "px" untuk ukuran huruf?',
    options: ['Ukurannya mengikuti pengaturan font akar (root), jadi menghormati preferensi pengguna', 'rem selalu lebih besar dari px', 'rem membuat halaman dimuat lebih cepat', 'rem hanya boleh dipakai untuk border'],
    answer: 0,
    explain: '1rem = ukuran font elemen <html>; pengguna yang memperbesar font bawaan browser tetap terbaca dengan baik.'
  },
  {
    id: 'q29',
    q: 'Kenapa penggunaan "!important" sebaiknya dihindari?',
    options: ['Mematikan aturan spesifisitas normal sehingga gaya susah dilacak dan dipelihara', 'Membuat halaman tidak bisa dimuat', 'Hanya berfungsi di Internet Explorer', 'Memaksa elemen selalu tampil di atas segalanya'],
    answer: 0,
    explain: '!important mengalahkan semua aturan lain; bila dipakai di banyak tempat, konflik gaya jadi sangat sulit dicari. Perbaiki spesifisitas selektor saja.'
  },
  {
    id: 'q30',
    q: 'Perbedaan CSS reset dan normalize adalah…',
    options: ['Reset mengosongkan gaya bawaan; normalize memperbaiki ketidakkonsistenan tanpa mengosongkan semuanya', 'Keduanya identik', 'Reset menambah animasi, normalize menghapusnya', 'Normalize hanya untuk tabel'],
    answer: 0,
    explain: 'Reset (misal margin: 0 untuk semua elemen) mengosongkan gaya bawaan browser; normalize merapikan perbedaan antar-browser namun tetap mempertahankan gaya yang berguna.'
  }
];
