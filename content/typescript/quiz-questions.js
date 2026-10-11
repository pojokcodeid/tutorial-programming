/* ============================================================
   Kumpulan soal kuis TypeScript — diacak setiap hari oleh mesin kuis
   (teks q & options ditulis apa adanya; dirender dengan escaping)
   ============================================================ */
'use strict';

window.TS_QUIZ_POOL = [
  {
    id: 'q01',
    q: 'Apa itu TypeScript?',
    options: ['JavaScript plus sistem tipe statis, buatan Microsoft', 'Bahasa pemrograman baru yang menggantikan JavaScript', 'Versi ringkas dari Java', 'Pustaka untuk membuat animasi web'],
    answer: 0,
    explain: 'TypeScript adalah superset JavaScript yang menambahkan sistem tipe statis. Dibuat oleh Microsoft pada 2012.'
  },
  {
    id: 'q02',
    q: 'Hubungan TypeScript dan JavaScript adalah…',
    options: ['Semua kode JavaScript valid juga valid sebagai TypeScript', 'TypeScript tidak boleh memakai kode JavaScript', 'JavaScript adalah versi terbaru dari TypeScript', 'Keduanya tidak ada hubungannya'],
    answer: 0,
    explain: 'TypeScript adalah superset JavaScript, jadi kode JS valid otomatis merupakan kode TS valid.'
  },
  {
    id: 'q03',
    q: 'Kode TypeScript dijalankan di browser setelah…',
    options: ['Dikompilasi menjadi JavaScript terlebih dahulu', 'Diterjemahkan oleh ekstensi browser', 'Diubah menjadi HTML', 'Langsung dijalankan tanpa proses'],
    answer: 0,
    explain: 'Browser tidak mengerti TypeScript. Kode .ts harus dikompilasi (tsc) menjadi .js dulu.'
  },
  {
    id: 'q04',
    q: 'Perintah untuk memasang kompilator TypeScript secara global adalah…',
    options: ['npm install -g typescript', 'npm install typescript.ts', 'node install typescript', 'tsc install --global'],
    answer: 0,
    explain: 'npm install -g typescript memasang kompilator tsc secara global di komputer.'
  },
  {
    id: 'q05',
    q: 'Berkas pengaturan kompilator TypeScript bernama…',
    options: ['tsconfig.json', 'typescript.conf', 'ts.config.js', 'package.ts'],
    answer: 0,
    explain: 'tsconfig.json berisi opsi kompilasi seperti target, strict, outDir, dan include.'
  },
  {
    id: 'q06',
    q: 'Perintah membuat tsconfig.json adalah…',
    options: ['npx tsc --init', 'tsc create config', 'npm init typescript', 'tsc --new'],
    answer: 0,
    explain: 'npx tsc --init menghasilkan berkas tsconfig.json di folder proyek.'
  },
  {
    id: 'q07',
    q: 'Opsi tsconfig yang mengaktifkan semua pemeriksaan ketat adalah…',
    options: ['strict: true', 'check: all', 'safe: true', 'typecheck: strict'],
    answer: 0,
    explain: 'strict: true mengaktifkan seluruh pemeriksaan ketat TypeScript (null, implicit any, dll).'
  },
  {
    id: 'q08',
    q: 'Tipe data untuk angka di TypeScript adalah…',
    options: ['number', 'int', 'float', 'num'],
    answer: 0,
    explain: 'TypeScript hanya punya satu tipe number untuk semua angka, tanpa int/float terpisah.'
  },
  {
    id: 'q09',
    q: 'Tipe kembalian fungsi yang tidak mengembalikan apa pun adalah…',
    options: ['void', 'null', 'never', 'undefined'],
    answer: 0,
    explain: 'void menandakan fungsi tidak mengembalikan nilai; never untuk fungsi yang tidak pernah kembali.'
  },
  {
    id: 'q10',
    q: 'Tipe yang sebaiknya dipakai sebagai pengganti any adalah…',
    options: ['unknown', 'object', 'void', 'never'],
    answer: 0,
    explain: 'unknown mengharuskan nilai diperiksa (type guard) sebelum dipakai, sedangkan any mematikan pemeriksaan.'
  },
  {
    id: 'q11',
    q: 'Sintaks type assertion yang direkomendasikan adalah…',
    options: ['nilai as Tipe', 'convert(nilai, Tipe)', '(Tipe)nilai', 'nilai::Tipe'],
    answer: 0,
    explain: 'Sintaks "nilai as Tipe" adalah cara modern; bentuk <Tipe>nilai sudah kuno dan tidak cocok untuk .tsx.'
  },
  {
    id: 'q12',
    q: 'Type assertion mengubah nilai saat program dijalankan…',
    options: ['Salah — assertion hanya berbicara ke kompilator', 'Benar — assertion mengonversi data', 'Benar, hanya untuk string', 'Salah — assertion menghapus nilai'],
    answer: 0,
    explain: 'Assertion tidak mengubah runtime; ia hanya memberitahu kompilator tipe yang kita yakini.'
  },
  {
    id: 'q13',
    q: 'Cara membuat type alias yang benar adalah…',
    options: ['type Status = "aktif" | "nonaktif";', 'alias Status = aktif, nonaktif;', 'define Status = "aktif";', 'typealias Status: string;'],
    answer: 0,
    explain: 'Kata kunci type diikuti nama dan tanda sama dengan, misalnya type Status = "aktif" | "nonaktif";'
  },
  {
    id: 'q14',
    q: 'Literal type memungkinkan…',
    options: ['Variabel dibatasi hanya pada nilai-nilai tertentu', 'Variabel menyimpan literal teks saja', 'Tipe data diubah menjadi string', 'Membuat angka menjadi konstan'],
    answer: 0,
    explain: 'Literal type membatasi variabel pada daftar nilai tertentu, misalnya "kiri" | "kanan".'
  },
  {
    id: 'q15',
    q: 'Kata kunci untuk membuat union type adalah…',
    options: ['|', '&', '||', '+'],
    answer: 0,
    explain: 'Tanda | (pipe) membuat union type: number | string berarti "number atau string".'
  },
  {
    id: 'q16',
    q: 'Intersection type ditulis dengan…',
    options: ['&', '|', '&&', 'intersect()'],
    answer: 0,
    explain: 'Tanda & membuat intersection: A & B berarti "harus punya semua anggota A dan B".'
  },
  {
    id: 'q17',
    q: 'Type guard berfungsi untuk…',
    options: ['Menyempitkan tipe union di dalam cabang kode', 'Mengubah tipe data secara permanen', 'Menghapus tipe dari variabel', 'Menyembunyikan error kompilasi'],
    answer: 0,
    explain: 'Type guard (typeof, in, instanceof) membuat TypeScript tahu jenis nilai di cabang tertentu (narrowing).'
  },
  {
    id: 'q18',
    q: 'Discriminated union ditandai oleh…',
    options: ['Properti bersama berupa literal type di tiap anggota', 'Semua anggota punya properti yang sama', 'Penggunaan kata kunci enum', 'Tidak adanya tipe data'],
    answer: 0,
    explain: 'Discriminated union punya properti penanda (discriminant) seperti kind atau status yang berbeda di tiap anggota.'
  },
  {
    id: 'q19',
    q: 'Utility type yang menjadikan semua properti opsional adalah…',
    options: ['Partial<T>', 'Required<T>', 'Readonly<T>', 'Pick<T>'],
    answer: 0,
    explain: 'Partial<T> membuat semua properti menjadi opsional — cocok untuk formulir perbaruan.'
  },
  {
    id: 'q20',
    q: 'Utility type untuk memilih beberapa properti saja adalah…',
    options: ['Pick<T, "a" | "b">', 'Select<T, "a">', 'Only<T>', 'Choose<T>'],
    answer: 0,
    explain: 'Pick<T, K> membentuk tipe baru hanya dari properti yang disebutkan.'
  },
  {
    id: 'q21',
    q: 'Mapped type dinyatakan dengan sintaks…',
    options: ['{ [K in keyof T]: T[K] }', '{ K: T }', 'map<T, K>', '{ for K of T }'],
    answer: 0,
    explain: 'Sintaks [K in keyof T] mengulangi setiap properti T untuk membentuk tipe baru.'
  },
  {
    id: 'q22',
    q: 'Operator ?? (nullish coalescing) mengganti nilai kiri bila…',
    options: ['Kiri bernilai null atau undefined', 'Kiri bernilai 0 atau string kosong', 'Kiri bernilai false', 'Kiri bertipe string'],
    answer: 0,
    explain: '?? hanya mengganti null/undefined; berbeda dengan || yang juga mengganti 0 dan "".'
  },
  {
    id: 'q23',
    q: 'Perulangan yang paling disarankan untuk mengunjungi nilai array adalah…',
    options: ['for...of', 'for...in', 'while...do', 'loop...each'],
    answer: 0,
    explain: 'for...of mengiterasi nilai array; for...in mengiterasi nama properti (kunci), bukan nilai.'
  },
  {
    id: 'q24',
    q: 'Tipe untuk array yang elemennya berupa string adalah…',
    options: ['string[]', 'array<string>', '[string]', 'strings'],
    answer: 0,
    explain: 'string[] adalah sintaks ringkas untuk array bertipe string; Array<string> sama artinya.'
  },
  {
    id: 'q25',
    q: 'Tuple berbeda dari array biasa karena…',
    options: ['Jumlah dan tipe tiap elemen sudah ditentukan', 'Hanya boleh berisi angka', 'Tidak bisa diubah', 'Ukurannya selalu 3'],
    answer: 0,
    explain: 'Tuple seperti [number, string] menetapkan tipe dan urutan tiap posisinya.'
  },
  {
    id: 'q26',
    q: 'Kelemahan enum dibanding union literal adalah…',
    options: ['Menghasilkan kode runtime lebih besar dan perilaku indeks angka yang aneh', 'Tidak bisa dipakai di switch', 'Hanya mendukung teks', 'Tidak didukung TypeScript'],
    answer: 0,
    explain: 'Union literal ("A" | "B") menghasilkan kode lebih kecil dan lebih mudah diserialisasi daripada enum.'
  },
  {
    id: 'q27',
    q: 'Rest parameter dinyatakan dengan…',
    options: ['...args: T[]', 'args...: T', 'rest args: T[]', 'args: ...T'],
    answer: 0,
    explain: 'Titik tiga sebelum nama parameter mengumpulkan argumen tersisa menjadi array.'
  },
  {
    id: 'q28',
    q: 'Cara memperluas interface agar mewarisi interface lain adalah…',
    options: ['extends', 'implements', 'inherits', '&'],
    answer: 0,
    explain: 'Interface Anak extends InterfaceInduk mewarisi semua anggota induknya.'
  },
  {
    id: 'q29',
    q: 'Pengubah akses yang hanya mengizinkan akses dari dalam class sendiri adalah…',
    options: ['private', 'protected', 'public', 'readonly'],
    answer: 0,
    explain: 'private membatasi akses ke class itu sendiri; protected juga mengizinkan kelas turunan.'
  },
  {
    id: 'q30',
    q: 'Abstract class tidak boleh…',
    options: ['Diinstansiasi langsung dengan new', 'Memiliki metode biasa', 'Memiliki field/atribut', 'Diperluas dengan extends'],
    answer: 0,
    explain: 'Abstract class hanya berfungsi sebagai induk; new AbstractClass() menghasilkan error kompilasi.'
  },
  {
    id: 'q31',
    q: 'Fungsi generik dideklarasikan dengan…',
    options: ['function nama<T>(...)', 'function nama(generic T)', 'generic function nama<T>', 'function <T> nama(...)'],
    answer: 0,
    explain: 'Parameter tipe <T> ditulis setelah nama fungsi: function pertama<T>(arr: T[]): T.'
  },
  {
    id: 'q32',
    q: 'Batasan (constraint) pada generik ditulis dengan…',
    options: ['T extends { length: number }', 'T limit { length }', 'T where length', 'constraint T: number'],
    answer: 0,
    explain: 'T extends ... membatasi T pada tipe yang memiliki properti tertentu.'
  },
  {
    id: 'q33',
    q: 'Cara mengimpor hanya sebuah tipe dari modul adalah…',
    options: ['import type { Tipe } from "./mod";', 'import only type { Tipe };', 'type import { Tipe } from;', 'import { type Tipe } from;'],
    answer: 0,
    explain: 'import type mengimpor tipe semata; kode hasil kompilasi tidak menyertakannya.'
  },
  {
    id: 'q34',
    q: 'Namespaces di TypeScript modern sebaiknya digantikan oleh…',
    options: ['Modul (import/export)', 'Class', 'Enum', 'Type alias'],
    answer: 0,
    explain: 'Modul ES adalah standar modern; namespace masih dipakai untuk kode lama atau deklarasi global.'
  },
  {
    id: 'q35',
    q: 'Decorator ditulis dengan sintaks…',
    options: ['@nama tepat di atas deklarasi', 'decorate(nama) sebelum class', '#nama di depan class', 'with nama { }'],
    answer: 0,
    explain: 'Decorator menggunakan @ diikuti nama fungsi, ditempelkan di atas class, metode, atau properti.'
  }
];
