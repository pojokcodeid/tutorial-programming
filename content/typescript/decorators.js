/* ============================================================
   Pelajaran TypeScript — Bab 12: Fitur Lanjutan
   (topik info.md: "decorators")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 26: Decorators ---------- */
window.TS_LESSONS.push({
  id: 'decorators-typescript',
  title: 'Decorators',
  chapter: 'Fitur Lanjutan',
  duration: '12 menit',
  intro: [
    '<b>Decorator</b> adalah fungsi istimewa yang <b>menghias</b> class, metode, properti, atau parameter — mengubah atau menambah perilaku tanpa mengubah kode aslinya.',
    'Pelajaran ini membahas decorator class dan metode.'
  ],
  objectives: [
    'Memahami konsep decorator',
    'Membuat class decorator',
    'Membuat method decorator',
    'Menjelaskan status decorator di TypeScript'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Bayangkan decorator sebagai <b>stiker</b> yang ditempel di depan deklarasi:</p><p><code>@sealed<br>class Motor { ... }</code></p><p>Stiker itu memanggil fungsi yang menerima <b>target</b> (class atau prototipe) dan <b>informasi</b> lain, lalu boleh mengubahnya. Pola ini terkenal dari pustaka seperti <b>Angular</b> dan <b>NestJS</b>.</p>'
    },
    {
      type: 'example',
      title: 'Class decorator',
      lang: 'typescript',
      output: false,
      code: `// Decorator: fungsi yang menerima target
function disegel(target: Function): void {
  Object.seal(target);
  Object.seal(target.prototype);
}

function tambahVersi(target: Function): void {
  (target as any).versi = "1.0";
}

@disegel
@tambahVersi
class Motor {
  nyalakan(): string {
    return "vroom!";
  }
}

const m = new Motor();
console.log(m.nyalakan());   // "vroom!"`,
      explain: [
        'Decorator ditulis <code>@nama</code> tepat <b>di atas</b> deklarasi.',
        'Decorator class menerima <b>konstruktor</b> sebagai argumen.',
        'Beberapa decorator ditumpuk — dievaluasi dari <b>bawah ke atas</b>.',
        'Contoh ini "menyegel" class agar tidak bisa ditambah anggota baru.'
      ]
    },
    {
      type: 'example',
      title: 'Method decorator',
      lang: 'typescript',
      output: false,
      code: `function catatWaktu(
  target: any,
  nama: string,
  deskriptor: PropertyDescriptor
): PropertyDescriptor {
  const asli = deskriptor.value;

  deskriptor.value = function (...args: any[]) {
    const mulai = performance.now();
    const hasil = asli.apply(this, args);
    const selesai = performance.now();
    console.log(nama + " selesai dalam " +
      (selesai - mulai).toFixed(2) + " ms");
    return hasil;
  };

  return deskriptor;
}

class Kalkulator {
  @catatWaktu
  faktorial(n: number): number {
    return n <= 1 ? 1 : n * this.faktorial(n - 1);
  }
}

const k = new Kalkulator();
console.log(k.faktorial(10));   // 3628800
// Konsol: "faktorial selesai dalam 0.12 ms"`,
      explain: [
        'Decorator metode menerima <b>prototipe</b>, <b>nama metode</b>, dan <b>deskriptor properti</b>.',
        'Dengan membungkus <code>deskriptor.value</code>, kita menambah perilaku <b>tanpa menyentuh</b> metode asli.',
        'Ini contoh klasik: pencatatan waktu, caching, validasi, dan logging.'
      ]
    },
    {
      type: 'example',
      title: 'Decorator properti dan parameter',
      lang: 'typescript',
      output: false,
      code: `// Decorator properti
function defaultNilai(nilai: any) {
  return function (target: any, kunci: string) {
    target[kunci] = nilai;
  };
}

class Pengaturan {
  @defaultNilai("id-ID")
  bahasa: string;
}

// Decorator parameter (disederhanakan)
function wajib(
  target: any,
  nama: string,
  indeks: number
): void {
  console.log("Parameter #" + indeks +
    " dari " + nama + " wajib diisi");
}

class Layanan {
  proses(@wajib input: string): void {
    console.log("Memproses " + input);
  }
}`,
      explain: [
        '<b>Properti</b>: decorator menerima target dan nama kunci.',
        '<b>Parameter</b>: decorator menerima target, nama metode, dan <b>indeks</b> parameter.',
        'Decorator sering dipakai sebagai <b>pabrik</b>: fungsi yang mengembalikan decorator (<code>@defaultNilai("...")</code>).'
      ]
    },
    {
      type: 'warn',
      title: 'Status: eksperimental/standar baru',
      text: 'Decorator adalah <b>fitur tahap lanjut</b> JavaScript/TypeScript. TypeScript mendukungnya bila <code>experimentalDecorators</code> diaktifkan di tsconfig (atau pada versi baru dengan dekorator standar). Artinya: sintaks bisa <b>berubah</b>, dan tidak semua runtime mendukung tanpa kompilasi. Di proyek baru, periksa dulu dokumentasi versi TypeScript-mu.'
    },
    {
      type: 'tip',
      title: 'Di mana decorator dipakai',
      text: '<b>Angular</b> (<code>@Component</code>), <b>NestJS</b> (<code>@Get</code>, <code>@Injectable</code>), <b>TypeORM</b> (<code>@Entity</code>). Belajar decorator membuka pintu ke ekosistem tersebut — tetapi dasar TypeScript (tipe, interface, generics) jauh lebih mendesak untuk dikuasai.'
    },
    {
      type: 'vocab',
      items: [
        ['Decorator', 'Fungsi yang menghias deklarasi class/metode/properti.'],
        ['@nama', 'Sintaks decorator di atas deklarasi.'],
        ['Target', 'Objek yang dihias (class/prototipe).'],
        ['PropertyDescriptor', 'Informasi metode: value, writable, dll.'],
        ['Decorator factory', 'Fungsi yang mengembalikan decorator.'],
        ['experimentalDecorators', 'Opsi tsconfig untuk decorator lama.']
      ]
    }
  ],
  recap: [
    'Decorator menghias class, metode, properti, dan parameter.',
    'Class decorator menerima konstruktor; metode menerima prototipe + deskriptor.',
    'Membungkus deskriptor.value menambah perilaku tanpa ubah kode asli.',
    'Decorator populer di Angular dan NestJS.',
    'Fitur ini masih berkembang — periksa dukungan versi TypeScript-mu.'
  ]
});
