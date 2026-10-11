/* ============================================================
   Pelajaran JavaScript — Bab 10: OOP
   (topik info.md: "object oriented programming" —
    enkapsulasi, abstraksi, pewarisan, polimorfisme)
   ============================================================ */
'use strict';

window.JS_LESSONS = window.JS_LESSONS || [];

/* ---------- Pelajaran: OOP — Kelas, Enkapsulasi & Abstraksi ---------- */
window.JS_LESSONS.push({
  id: 'oop-kelas-enkapsulasi-abstraksi',
  title: 'OOP: Kelas, Enkapsulasi & Abstraksi',
  chapter: 'OOP',
  duration: '14 menit',
  intro: [
    '<b>OOP</b> (<b>Object-Oriented Programming</b>) adalah cara memodelkan program sebagai <b>objek</b> — benda-benda dunia nyata yang punya <b>data</b> (properti) dan <b>perilaku</b> (metode).',
    'OOP berdiri di atas empat pilar: <b>enkapsulasi</b>, <b>abstraksi</b>, <b>pewarisan</b>, dan <b>polimorfisme</b>. Pelajaran ini membahas kelas plus dua pilar pertama.'
  ],
  objectives: [
    'Memahami kelas dan objek di JavaScript',
    'Menerapkan enkapsulasi dengan field privat dan getter/setter',
    'Menerapkan abstraksi: menyembunyikan detail, menampilkan antarmuka sederhana',
    'Menyebutkan empat pilar OOP'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Empat pilar OOP yang akan kita bahas:</p><ol><li><b>Enkapsulasi</b> — menggabungkan data dan perilaku, serta melindungi data dari akses sembarangan</li><li><b>Abstraksi</b> — menyembunyikan detail rumit, menampilkan antarmuka yang sederhana</li><li><b>Pewarisan</b> — membuat kelas baru dari kelas yang sudah ada (pelajaran berikutnya)</li><li><b>Polimorfisme</b> — satu antarmuka, banyak bentuk (pelajaran berikutnya)</li></ol><p>Di JavaScript, kelas dibuat dengan kata kunci <code>class</code>, dan objek dibuat dengan <code>new</code>.</p>'
    },
    {
      type: 'example',
      title: 'Kelas dan objek pertama',
      lang: 'javascript',
      output: false,
      code: `class Buku {
  constructor(judul, penulis) {   // dijalankan saat new
    this.judul = judul;           // properti (data)
    this.penulis = penulis;
  }

  info() {                        // metode (perilaku)
    return this.judul + " — " + this.penulis;
  }
}

const b1 = new Buku("Laskar Pelangi", "Andrea Hirata");
const b2 = new Buku("Bumi", "Tere Liye");

b1.info();   // "Laskar Pelangi — Andrea Hirata"
b2.info();   // "Bumi — Tere Liye"`,
      explain: [
        '<code>class</code> adalah cetak biru; <code>new</code> menciptakan <b>objek</b> (instansi) dari cetak biru itu.',
        '<code>constructor()</code> berjalan otomatis saat objek dibuat — menginisialisasi properti.',
        '<code>this</code> merujuk ke objek yang sedang dikerjakan.',
        'Metode <code>info()</code> adalah perilaku yang bisa dipanggil di setiap objek.'
      ]
    },
    {
      type: 'example',
      title: 'Enkapsulasi: field privat (#)',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Enkapsulasi</title>
</head>
<body>
  <p id="out"></p>

  <script>
    class Rekening {
      #saldo;                    // PRIVAT — hanya di dalam kelas

      constructor(pemilik, saldoAwal) {
        this.pemilik = pemilik;  // publik
        this.#saldo = saldoAwal; // privat
      }

      setor(jumlah) {
        if (jumlah > 0) this.#saldo += jumlah;
      }

      get saldo() {              // getter: jalan keluar terkontrol
        return this.#saldo;
      }
    }

    const r = new Rekening("Andi", 100000);
    r.setor(50000);

    document.getElementById("out").textContent =
      r.pemilik + " — saldo: Rp " + r.saldo;
    // r.#saldo = 999999999;     // ❌ SyntaxError: tidak bisa dari luar
  <\/script>
</body>
</html>`,
      explain: [
        '<b>Enkapsulasi</b> = data dan perilaku digabung dalam kelas, dan data <b>dilindungi</b>.',
        'Tanda <code>#</code> membuat field <b>privat</b> — hanya bisa diakses dari dalam kelas.',
        'Dari luar, saldo hanya bisa dibaca lewat <code>get saldo()</code> dan diubah lewat metode <code>setor()</code> yang sudah divalidasi.',
        'Tanpa enkapsulasi, siapa saja bisa menulis <code>r.saldo = -999999</code> dan merusak aturan bisnis.'
      ]
    },
    {
      type: 'example',
      title: 'Setter: jalan masuk terkontrol',
      lang: 'javascript',
      output: false,
      code: `class Suhu {
  #celsius = 0;

  get celsius() {
    return this.#celsius;
  }

  set celsius(nilai) {           // setter: validasi dulu
    if (nilai < -273.15) {
      throw new Error("Di bawah nol mutlak!");
    }
    this.#celsius = nilai;
  }
}

const t = new Suhu();
t.celsius = 25;      // jalan lewat setter
console.log(t.celsius);   // 25
// t.celsius = -300;      // ❌ melempar error`,
      explain: [
        '<b>Getter</b> dan <b>setter</b> terlihat seperti properti biasa, tetapi kodenya bisa <b>memvalidasi</b>.',
        'Pola ini menjaga <b>integritas data</b>: aturan tinggal di satu tempat.',
        'Ini inti enkapsulasi: luar hanya melihat antarmuka, tidak melihat penyimpanan dalam.'
      ]
    },
    {
      type: 'example',
      title: 'Abstraksi: antarmuka sederhana',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Abstraksi</title>
</head>
<body>
  <p id="out"></p>

  <script>
    class MesinKopi {
      // detail rumit disembunyikan (privat)
      #panaskanAir() { return "air panas 90°C"; }
      #gilingBiji() { return "bubuk kopi halus"; }

      // antarmuka sederhana untuk dunia luar
      buatKopi() {
        return "Kopi siap (" + this.#panaskanAir()
             + " + " + this.#gilingBiji() + ")";
      }
    }

    const mesin = new MesinKopi();

    // Pengguna hanya perlu tahu satu perintah:
    document.getElementById("out").textContent =
      mesin.buatKopi();
  <\/script>
</body>
</html>`,
      explain: [
        '<b>Abstraksi</b> = menyembunyikan <b>bagaimana</b> cara kerja, menampilkan <b>apa</b> yang bisa dipakai.',
        'Metode privat <code>#panaskanAir()</code> dan <code>#gilingBiji()</code> tidak terlihat dari luar.',
        'Pengguna kelas cukup memanggil <code>buatKopi()</code> — detail teknis tidak membebani mereka.',
        'Abstraksi membuat kode <b>lebih mudah dipakai dan diubah</b>: cara bikin kopi boleh berubah, nama metodenya tetap.'
      ]
    },
    {
      type: 'tip',
      title: 'Getter/setter vs metode biasa',
      text: 'Pakai <b>getter/setter</b> bila konsepnya memang "properti" (mis. <code>rekening.saldo</code>). Pakai <b>metode biasa</b> bila konsepnya "tindakan" (mis. <code>rekening.setor()</code>). Keduanya sah — pilih yang paling mudah dibaca.'
    },
    {
      type: 'warn',
      title: 'Privat sejati butuh tanda #',
      text: 'Konvensi lama menulis <code>_saldo</code> dengan garis bawah — itu hanya <b>janji sosial</b>, bukan privasi sesungguhnya: kode luar tetap bisa menulis <code>r._saldo</code>. Field privat sejati di JavaScript wajib pakai tanda <code>#</code> (didukung semua browser modern).'
    },
    {
      type: 'vocab',
      items: [
        ['OOP', 'Object-Oriented Programming — paradigma berbasis objek.'],
        ['Kelas', 'Cetak biru untuk membuat objek.'],
        ['Objek / Instansi', 'Benda nyata yang dibuat dari kelas dengan new.'],
        ['constructor()', 'Metode khusus yang menginisialisasi objek baru.'],
        ['Enkapsulasi', 'Menggabungkan data + perilaku dan melindungi data dari akses luar.'],
        ['Field privat (#)', 'Properti yang hanya bisa diakses dari dalam kelas.'],
        ['Getter / Setter', 'Metode khusus untuk membaca/menulis properti secara terkontrol.'],
        ['Abstraksi', 'Menyembunyikan detail rumit; menampilkan antarmuka sederhana.'],
        ['Antarmuka', 'Kumpulan metode publik yang bisa dipakai dari luar kelas.']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: rekening tabungan',
      lang: 'html',
      hint: 'Kode membuat rekening dengan saldo privat. Tambahkan metode tarik(jumlah) yang menolak bila saldo kurang!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rekening</title>
</head>
<body>
  <p id="out"></p>

  <script>
    class Tabungan {
      #saldo;

      constructor(pemilik) {
        this.pemilik = pemilik;
        this.#saldo = 0;
      }

      setor(jumlah) {
        if (jumlah > 0) this.#saldo += jumlah;
      }

      get saldo() {
        return this.#saldo;
      }
    }

    const tabungan = new Tabungan("Sari");
    tabungan.setor(250000);
    tabungan.setor(100000);

    document.getElementById("out").textContent =
      tabungan.pemilik + " — Rp " + tabungan.saldo;
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'OOP memodelkan program sebagai objek: data (properti) + perilaku (metode).',
    'Empat pilar: enkapsulasi, abstraksi, pewarisan, polimorfisme.',
    'Enkapsulasi: gabungkan data dan perilaku; lindungi data dengan field privat (#).',
    'Getter/setter memberi akses terkontrol ke data privat.',
    'Abstraksi: sembunyikan detail rumit, tampilkan antarmuka sederhana.',
    'Field privat sejati pakai # — bukan konvensi _garis_bawah.',
  ]
});

/* ---------- Pelajaran: OOP — Pewarisan & Polimorfisme ---------- */
window.JS_LESSONS.push({
  id: 'oop-pewarisan-polimorfisme',
  title: 'OOP: Pewarisan & Polimorfisme',
  chapter: 'OOP',
  duration: '13 menit',
  intro: [
    '<b>Pewarisan</b> memungkinkan kelas baru <b>mewarisi</b> properti dan metode dari kelas induk — tanpa menulis ulang kode yang sama. <b>Polimorfisme</b> melangkah lebih jauh: satu nama metode, <b>bentuk berbeda</b> di setiap kelas anak.',
    'Kedua pilar ini melengkapi empat pilar OOP bersama enkapsulasi dan abstraksi.'
  ],
  objectives: [
    'Membuat kelas anak dengan extends',
    'Memanggil constructor induk dengan super()',
    'Menimpa metode induk (overriding)',
    'Memanfaatkan polimorfisme dan operator instanceof'
  ],
  sections: [
    {
      type: 'example',
      title: 'Pewarisan dengan extends & super',
      lang: 'javascript',
      output: false,
      code: `class Hewan {
  constructor(nama) {
    this.nama = nama;
  }
  kenalan() {
    return "Hewan bernama " + this.nama;
  }
}

class Kucing extends Hewan {       // Kucing mewarisi Hewan
  constructor(nama, jenis) {
    super(nama);                   // panggil constructor induk
    this.jenis = jenis;            // tambahan khusus anak
  }
  kenalan() {                      // menimpa metode induk
    return super.kenalan() + " (kucing " + this.jenis + ")";
  }
}

const m = new Kucing("Mimi", "Persia");
m.kenalan();   // "Hewan bernama Mimi (kucing Persia)"`,
      explain: [
        '<code>extends</code> membuat kelas <b>anak</b> yang mewarisi semua anggota kelas <b>induk</b>.',
        '<code>super(nama)</code> memanggil <b>constructor induk</b> — wajib sebelum memakai <code>this</code> di constructor anak.',
        '<code>super.kenalan()</code> memanggil <b>metode induk</b> dari versi yang ditimpa.',
        'Kelas anak boleh menambah properti dan metode baru.'
      ]
    },
    {
      type: 'example',
      title: 'Overriding: menimpa metode',
      lang: 'html',
      output: true,
      code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Overriding</title>
</head>
<body>
  <ul id="out"></ul>

  <script>
    class Kendaraan {
      constructor(merk) {
        this.merk = merk;
      }
      jalan() {
        return this.merk + " melaju";
      }
    }

    class Mobil extends Kendaraan {
      jalan() {                    // menimpa metode induk
        return this.merk + " melaju di jalan raya";
      }
    }

    class Perahu extends Kendaraan {
      jalan() {                    // bentuk berbeda lagi
        return this.merk + " melaju di air";
      }
    }

    const daftar = [
      new Kendaraan("Kendaraan umum"),
      new Mobil("Toyota"),
      new Perahu("Pinisi")
    ];

    document.getElementById("out").innerHTML =
      daftar.map(k => "<li>" + k.jalan() + "</li>").join("");
  <\/script>
</body>
</html>`,
      explain: [
        '<b>Overriding</b>: kelas anak menulis ulang metode induk dengan perilaku sendiri.',
        'Objek <b>kelas anak</b> tetap bisa dipakai di mana objek kelas induk diharapkan.',
        'Memanggil <code>k.jalan()</code> menghasilkan <b>kalimat berbeda</b> sesuai jenis objeknya — itulah polimorfisme.'
      ]
    },
    {
      type: 'example',
      title: 'Polimorfisme dalam praktik',
      lang: 'javascript',
      output: false,
      code: `class Burung {
  constructor(nama) { this.nama = nama; }
  terbang() { return this.nama + " terbang"; }
}

class Bebek extends Burung {
  terbang() { return this.nama + " terbang rendah"; }   // bentuk lain
}

class Penguin extends Burung {
  terbang() { return this.nama + " tidak bisa terbang"; } // bentuk lain
}

// Satu antarmuka, banyak bentuk:
const kawanan = [new Burung("Elang"), new Bebek("Bebek"), new Penguin("Pingu")];

for (const b of kawanan) {
  console.log(b.terbang());
}
// Elang terbang
// Bebek terbang rendah
// Pingu tidak bisa terbang

console.log(bawanan = kawanan[1] instanceof Bebek);   // true
console.log(kawanan[1] instanceof Burung);            // true (juga induknya)`,
      explain: [
        '<b>Polimorfisme</b>: kode yang <b>sama</b> (<code>b.terbang()</code>) berperilaku <b>berbeda</b> sesuai tipe objek.',
        'Kode pemroses (perulangan) tidak perlu tahu jenis pasti objek — ia hanya memanggil antarmuka bersama.',
        '<code>instanceof</code> memeriksa apakah objek berasal dari kelas tertentu (atau kelas induknya).',
        'Menambah jenis burung baru tidak perlu mengubah kode perulangan — inilah kekuatan polimorfisme.'
      ]
    },
    {
      type: 'tip',
      title: 'Komposisi sering lebih baik',
      text: 'Pewarisan bisa rumit bila bertingkat dalam ("kelas A ← B ← C ← ..."). Bila hanya butuh <b>memakai</b> perilaku, lebih rapi menyusun objek dari objek lain (<b>komposisi</b>): <code>class Mobil { constructor() { this.mesin = new Mesin(); } }</code>. Aturan praktis: <b>"lebih suka komposisi daripada pewarisan"</b>.'
    },
    {
      type: 'warn',
      title: 'Jangan lupa super() di constructor anak',
      text: 'Di <code>constructor</code> kelas anak, <code>this</code> <b>tidak boleh</b> dipakai sebelum <code>super()</code> — browser akan melempar <code>ReferenceError</code>. Panggil <code>super(...argumen)</code> lebih dulu, lalu baru tambahkan inisialisasi kelas anak.'
    },
    {
      type: 'vocab',
      items: [
        ['Pewarisan', 'Kelas baru mewarisi properti dan metode dari kelas induk.'],
        ['extends', 'Kata kunci untuk membuat kelas anak dari kelas induk.'],
        ['super()', 'Memanggil constructor induk (di constructor anak).'],
        ['super.metode()', 'Memanggil versi metode dari kelas induk.'],
        ['Overriding', 'Menimpa metode induk dengan implementasi sendiri di kelas anak.'],
        ['Polimorfisme', 'Satu antarmuka, banyak bentuk — perilaku disesuaikan tipe objek.'],
        ['instanceof', 'Operator untuk memeriksa kelas asal suatu objek.'],
        ['Komposisi', 'Menyusun kelas dari objek lain (alternatif pewarisan).'],
        ['Kelas induk', 'Kelas yang diwarisi (superclass / base class).'],
        ['Kelas anak', 'Kelas yang mewarisi (subclass).']
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: bangun bentuk',
      lang: 'html',
      hint: 'Kode memakai polimorfisme: Persegi dan Lingkaran sama-sama punya luas(). Tambahkan class Segitiga extends Bentuk!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bentuk</title>
</head>
<body>
  <ul id="out"></ul>

  <script>
    class Bentuk {
      constructor(nama) { this.nama = nama; }
      luas() { return 0; }
      info() {
        return this.nama + ": luas " + this.luas().toFixed(1);
      }
    }

    class Persegi extends Bentuk {
      constructor(sisi) {
        super("Persegi");
        this.sisi = sisi;
      }
      luas() { return this.sisi * this.sisi; }
    }

    class Lingkaran extends Bentuk {
      constructor(jari) {
        super("Lingkaran");
        this.jari = jari;
      }
      luas() { return Math.PI * this.jari * this.jari; }
    }

    const daftar = [new Persegi(5), new Lingkaran(3)];

    document.getElementById("out").innerHTML =
      daftar.map(b => "<li>" + b.info() + "</li>").join("");
  <\/script>
</body>
</html>`
    }
  ],
  recap: [
    'Pewarisan: extends membuat kelas anak dari kelas induk.',
    'super() wajib dipanggil sebelum this di constructor anak.',
    'Overriding: kelas anak menimpa metode induk dengan perilaku sendiri.',
    'Polimorfisme: satu antarmuka (nama metode), banyak bentuk (perilaku).',
    'instanceof memeriksa kelas asal objek.',
    'Bila ragu, lebih suka komposisi daripada pewarisan.',
  ]
});
