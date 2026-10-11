/* ============================================================
   Pelajaran TypeScript — Bab 9: OOP
   (topik info.md: "class dan object oriented
    programming (oop)", "abstract classes")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 21: Class dan OOP ---------- */
window.TS_LESSONS.push({
  id: 'class-oop-typescript',
  title: 'Class dan OOP',
  chapter: 'OOP',
  duration: '14 menit',
  intro: [
    '<b>Class</b> adalah cetak biru objek: properti dan metode yang dimiliki bersama.',
    'TypeScript menambahkan <b>tipe</b> dan <b>pengubah akses</b> pada class JavaScript — membuat OOP lebih aman dan jelas.'
  ],
  objectives: [
    'Membuat class dengan constructor',
    'Memahami properti dan metode',
    'Mewarisi class dengan extends dan super',
    'Memakai public, private, protected, dan getter/setter'
  ],
  sections: [
    {
      type: 'example',
      title: 'Class pertama',
      lang: 'typescript',
      output: false,
      code: `class Mahasiswa {
  nama: string;
  npm: number;

  constructor(nama: string, npm: number) {
    this.nama = nama;
    this.npm = npm;
  }

  perkenalan(): string {
    return "Halo, saya " + this.nama + " (" + this.npm + ")";
  }
}

const m = new Mahasiswa("Budi", 2301);
console.log(m.perkenalan());
// "Halo, saya Budi (2301)"`,
      explain: [
        'Properti dideklarasikan di badan class dengan tipe: <code>nama: string</code>.',
        '<code>constructor</code> berjalan saat <code>new</code> — menginisialisasi objek.',
        '<code>this</code> merujuk ke objek itu sendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Parameter properties — sintaks ringkas',
      lang: 'typescript',
      output: false,
      code: `class Mahasiswa {
  constructor(
    public nama: string,
    public npm: number
  ) {}

  perkenalan(): string {
    return "Halo, saya " + this.nama;
  }
}

const m = new Mahasiswa("Budi", 2301);
console.log(m.nama);   // "Budi"`,
      explain: [
        'Menulis <code>public nama: string</code> di <b>constructor</b> otomatis membuat dan mengisi properti.',
        'Ini cara singkat yang khas TypeScript — hemat banyak baris.',
        'Ganti <code>public</code> dengan <code>private</code>/<code>protected</code> sesuai kebutuhan.'
      ]
    },
    {
      type: 'example',
      title: 'Inheritance: extends & super',
      lang: 'typescript',
      output: false,
      code: `class Orang {
  constructor(public nama: string) {}

  sapa(): string {
    return "Halo, " + this.nama;
  }
}

class Dosen extends Orang {
  constructor(
    nama: string,
    public matkul: string
  ) {
    super(nama);   // panggil constructor Orang
  }

  // menimpa metode induk
  sapa(): string {
    return super.sapa() + " — Dosen " + this.matkul;
  }
}

const d = new Dosen("Pak Toni", "Algoritma");
console.log(d.sapa());
// "Halo, Pak Toni — Dosen Algoritma"`,
      explain: [
        '<code>extends</code> mewarisi semua anggota class induk.',
        '<code>super(nama)</code> memanggil constructor induk.',
        '<code>super.sapa()</code> memanggil metode induk — dasar penimpaan (override).'
      ]
    },
    {
      type: 'example',
      title: 'Pengubah akses',
      lang: 'typescript',
      output: false,
      code: `class Rekening {
  constructor(
    public pemilik: string,
    private saldo: number,
    protected pin: string
  ) {}

  lihatSaldo(): number {
    return this.saldo;      // ✓ di dalam class
  }
}

const r = new Rekening("Andi", 5000000, "1234");
console.log(r.pemilik);       // "Andi"
console.log(r.lihatSaldo());  // 5000000
// console.log(r.saldo);       // ✗ Error: private
// console.log(r.pin);          // ✗ Error: protected`,
      explain: [
        '<code>public</code> — bisa diakses dari mana saja (bawaan).',
        '<code>private</code> — hanya di dalam class itu sendiri.',
        '<code>protected</code> — di class itu dan kelas turunannya.',
        'Pengubah akses diperiksa <b>saat kompilasi</b>, bukan saat runtime.'
      ]
    },
    {
      type: 'example',
      title: 'Getter dan setter',
      lang: 'typescript',
      output: false,
      code: `class Termometer {
  private _celsius: number = 0;

  get celsius(): number {
    return this._celsius;
  }

  set celsius(n: number) {
    if (n < -273.15) {
      throw new Error("Suhu tidak valid");
    }
    this._celsius = n;
  }

  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }
}

const t = new Termometer();
t.celsius = 25;            // memanggil setter
console.log(t.celsius);       // 25
console.log(t.fahrenheit);     // 77
// t.celsius = -300;           // ✗ Error saat runtime`,
      explain: [
        '<code>get</code> membaca nilai seperti properti, <code>set</code> mengisinya — tapi keduanya <b>metode</b>.',
        'Setter adalah tempat <b>validasi</b>: nilai tidak sah ditolak.',
        '<code>fahrenheit</code> adalah properti <b>turunan</b> yang dihitung otomatis.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan OOP masuk akal',
      text: 'Class cocok bila ada <b>data + perilaku</b> yang melekat: entitas (Pengguna, Produk), layanan (Pembayaran), dan komponen. Untuk data tanpa perilaku, <b>type/interface</b> sering lebih tepat. TypeScript tidak memaksa OOP — fungsi biasa tetap idiomatik.'
    },
    {
      type: 'vocab',
      items: [
        ['Class', 'Cetak biru objek: properti + metode.'],
        ['constructor', 'Metode inisialisasi saat new.'],
        ['this', 'Referensi ke objek itu sendiri.'],
        ['extends', 'Mewarisi dari class lain.'],
        ['super', 'Memanggil constructor/metode induk.'],
        ['Override', 'Menimpa metode induk di kelas turunan.'],
        ['public / private / protected', 'Pengubah akses.'],
        ['getter / setter', 'Metode pembaca/penulis seperti properti.'],
        ['Parameter property', 'Deklarasi properti lewat constructor.']
      ]
    }
  ],
  recap: [
    'Class: cetak biru dengan properti bertipe dan metode.',
    'constructor menginisialisasi; this merujuk ke objek.',
    'extends mewarisi; super memanggil induk.',
    'public, private, protected mengatur akses.',
    'getter/setter membungkus properti dengan validasi.'
  ]
});

/* ---------- Pelajaran 22: Abstract Classes ---------- */
window.TS_LESSONS.push({
  id: 'abstract-classes-typescript',
  title: 'Abstract Classes',
  chapter: 'OOP',
  duration: '11 menit',
  intro: [
    '<b>Abstract class</b> adalah class <b>tidak lengkap</b> yang tidak boleh dibuat instansinya — ia hanya berfungsi sebagai <b>induk</b>.',
    'Kelas turunan wajib mengisi metode yang ditinggalkan abstrak.'
  ],
  objectives: [
    'Membuat abstract class dan abstract method',
    'Memahami larangan instansiasi',
    'Mengimplementasikan metode abstrak di turunan',
    'Membandingkan abstract class dan interface'
  ],
  sections: [
    {
      type: 'example',
      title: 'Abstract class dasar',
      lang: 'typescript',
      output: false,
      code: `abstract class Bangun {
  abstract luas(): number;

  // Metode biasa tetap boleh ada
  info(): string {
    return "Sebuah bangun";
  }
}

class Persegi extends Bangun {
  constructor(public sisi: number) {
    super();
  }

  // WAJIB diimplementasikan
  luas(): number {
    return this.sisi * this.sisi;
  }
}

const p = new Persegi(5);
console.log(p.luas());   // 25
console.log(p.info());   // "Sebuah bangun"

// const b = new Bangun();   // ✗ Error: abstract`,
      explain: [
        '<code>abstract class</code> tidak boleh dibuat instansinya (<code>new Bangun()</code> error).',
        '<code>abstract luas(): number</code> adalah <b>kontrak</b> tanpa isi.',
        'Turunan <b>wajib</b> mengisi metode abstrak — atau turunan itu juga harus abstrak.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh nyata: hewan',
      lang: 'typescript',
      output: false,
      code: `abstract Hewan {
  constructor(public nama: string) {}

  abstract suara(): string;

  perkenalan(): string {
    return this.nama + " berkata " + this.suara();
  }
}

class Kucing extends Hewan {
  suara(): string {
    return "meong";
  }
}

class Anjing extends Hewan {
  suara(): string {
    return "guk";
  }
}

const kucing = new Kucing("Mimi");
const anjing = new Anjing("Rex");

console.log(kucing.perkenalan());   // "Mimi berkata meong"
console.log(anjing.perkenalan());     // "Rex berkata guk"`,
      explain: [
        'Induk abstrak punya <b>perilaku bersama</b> (<code>perkenalan</code>) dan <b>kontrak</b> (<code>suara</code>).',
        'Setiap turunan menentukan <b>cara sendiri</b> untuk <code>suara()</code>.',
        'Kode pemanggil tidak peduli jenisnya — semua <code>Hewan</code> punya <code>perkenalan()</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'Abstract ≠ kosong',
      text: 'Abstract class boleh berisi <b>field, constructor, dan metode biasa</b> — hanya metodenya yang <code>abstract</code> yang tidak punya isi. Perbedaan dengan interface: abstract class bisa menyimpan <b>implementasi bersama</b> dan <b>state</b> (data).'
    },
    {
      type: 'example',
      title: 'Abstract class vs interface',
      lang: 'typescript',
      output: false,
      code: `// INTERFACE: kontrak murni, tanpa isi
interface DapatTerbang {
  terbang(): void;
}

// ABSTRACT CLASS: kontrak + isi bersama
abstract class Kendaraan {
  abstract nyalakan(): void;

  // Isi bersama untuk semua turunan
  matikan(): void {
    console.log("Mesin mati.");
  }
}

// Sebuah class boleh implements banyak interface,
// tetapi hanya extends satu class.`,
      explain: [
        '<b>Interface</b> = kontrak murni; sebuah class bisa <code>implements</code> banyak interface.',
        '<b>Abstract class</b> = kontrak + implementasi bersama; class hanya bisa <code>extends</code> <b>satu</b> class.',
        'Pilih abstract class bila ada <b>logika bersama</b>; pilih interface bila hanya <b>kesepakatan bentuk</b>.'
      ]
    },
    {
      type: 'tip',
      title: 'Pola template method',
      text: 'Abstract class mengusung pola <b>template method</b>: metode di induk menentukan <b>kerangka alur</b> dan memanggil metode abstrak yang diisi turunan. Cocok untuk proses berjenjang: validasi → proses → laporkan.'
    },
    {
      type: 'vocab',
      items: [
        ['Abstract class', 'Class tidak lengkap yang tidak boleh diinstansiasi.'],
        ['Abstract method', 'Metode tanpa isi; wajib diisi turunan.'],
        ['Instansiasi', 'Membuat objek dengan new.'],
        ['implements', 'Menyatakan bahwa class memenuhi interface.'],
        ['Template method', 'Pola: kerangka di induk, detail di turunan.'],
        ['State', 'Data yang disimpan objek.']
      ]
    }
  ],
  recap: [
    'Abstract class tidak boleh diinstansiasi.',
    'Metode abstract wajib diimplementasikan turunan.',
    'Abstract class boleh punya field dan metode biasa.',
    'Interface = kontrak murni; abstract class = kontrak + isi.',
    'Sebuah class hanya extends satu class, tetapi implements banyak interface.'
  ]
});
