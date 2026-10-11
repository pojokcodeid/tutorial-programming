/* ============================================================
   Pelajaran TypeScript — Bab 3: Tipe Majemuk
   (topik info.md: "type unions and intersections",
    "type guards", "discriminated unions")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 9: Union dan Intersection Types ---------- */
window.TS_LESSONS.push({
  id: 'union-intersection',
  title: 'Union dan Intersection Types',
  chapter: 'Tipe Majemuk',
  duration: '11 menit',
  intro: [
    'Dua cara menggabungkan tipe: <b>union</b> (<code>|</code>) berarti "<b>salah satu dari</b>", dan <b>intersection</b> (<code>&</code>) berarti "<b>sekaligus semua</b>".',
    'Pelajaran ini membahas keduanya dengan contoh sehari-hari.'
  ],
  objectives: [
    'Membuat union type dengan |',
    'Membuat intersection type dengan &',
    'Membedakan keduanya dengan analogi dunia nyata',
    'Menangani union di dalam fungsi'
  ],
  sections: [
    {
      type: 'example',
      title: 'Union type — "salah satu dari"',
      lang: 'typescript',
      output: false,
      code: `type AngkaAtauTeks = number | string;

const a: AngkaAtauTeks = 42;
const b: AngkaAtauTeks = "empat puluh dua";
// const c: AngkaAtauTeks = true;  // ✗ boolean tidak ada di daftar

// Union untuk parameter fleksibel
function cetak(id: number | string): void {
  console.log("ID: " + id);
}

cetak(1001);
cetak("A-202");`,
      explain: [
        '<code>number | string</code> berarti variabel boleh <b>number</b> atau <b>string</b>.',
        'Union berguna untuk API yang menerima beberapa bentuk input (ID bisa angka atau kode).',
        'Yang <b>bukan</b> anggota union langsung ditolak oleh kompilator.'
      ]
    },
    {
      type: 'example',
      title: 'Intersection type — "sekaligus"',
      lang: 'typescript',
      output: false,
      code: `type PunyaNama = { nama: string };
type PunyaUmur = { umur: number };

// Gabungan: punya nama DAN umur
type Karyawan = PunyaNama & PunyaUmur;

const k: Karyawan = { nama: "Dewi", umur: 30 };
// const salah: Karyawan = { nama: "Dewi" };
// ✗ Error: properti 'umur' hilang`,
      explain: [
        '<code>PunyaNama & PunyaUmur</code> menghasilkan tipe yang <b>memiliki semua properti</b> dari kedua tipe.',
        'Bayangkan: union = "kamu boleh jadi A atau B"; intersection = "kamu harus jadi A sekaligus B".',
        'Intersection sering dipakai mencampur <b>kemampuan</b>: <code>Karyawan & Manajer</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Analogi yang membantu',
      text: '<b>Union (|)</b> seperti mesin "atau": tiket "dewasa | anak" berarti salah satu kategori. <b>Intersection (&)</b> seperti mesin "dan": "karyawan & manajer" harus memenuhi kedua syarat sekaligus.'
    },
    {
      type: 'warn',
      title: 'Union tidak bisa dipakai sembarangan',
      text: 'Di dalam fungsi, anggota union <b>belum diketahui jenisnya</b>, jadi hanya operasi yang aman untuk <b>semua</b> anggota yang diizinkan. <code>a + b</code> pada <code>number | string</code> akan ditolak karena <code>+</code> berbeda arti untuk keduanya. Solusinya: <b>type guard</b> (pelajaran berikutnya).'
    },
    {
      type: 'example',
      title: 'Intersection pada fungsi (mixin)',
      lang: 'typescript',
      output: false,
      code: `type BisaJalan = { jalan: () => void };
type BisaTerbang = { terbang: () => void };

type Superhero = BisaJalan & BisaTerbang;

function aksi(h: Superhero) {
  h.jalan();
  h.terbang();
}

// Objek harus punya DUA metode itu:
aksi({
  jalan: () => console.log("berjalan..."),
  terbang: () => console.log("terbang...")
});`,
      explain: [
        'Intersection membuat tipe <b>komposit</b>: <code>Superhero</code> wajib punya kedua metode.',
        'Pola ini dikenal sebagai <b>mixin</b> — menyusun objek dari potongan kemampuan kecil.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Union type', 'Tipe gabungan: nilai boleh salah satu anggotanya (|).'],
        ['Intersection type', 'Tipe gabungan: nilai harus punya semua anggotanya (&).'],
        ['Mixin', 'Menyusun tipe/objek dari potongan kemampuan kecil.'],
        ['Narrowing', 'Penyemputan tipe setelah pemeriksaan (type guard).'],
        ['Operator aman', 'Operasi yang sah untuk semua anggota union.']
      ]
    }
  ],
  recap: [
    'Union (|): nilai boleh salah satu dari beberapa tipe.',
    'Intersection (&): nilai harus memenuhi semua tipe sekaligus.',
    'Union cocok untuk input fleksibel; intersection untuk menyusun kemampuan.',
    'Di dalam fungsi, anggota union perlu diperiksa dulu (type guard).',
    'Union dibatasi operator yang aman untuk semua anggotanya.'
  ]
});

/* ---------- Pelajaran 10: Type Guards ---------- */
window.TS_LESSONS.push({
  id: 'type-guards',
  title: 'Type Guards',
  chapter: 'Tipe Majemuk',
  duration: '11 menit',
  intro: [
    '<b>Type guard</b> adalah pemeriksaan yang <b>menyempitkan</b> tipe union di dalam cabang kode, sehingga TypeScript tahu persis jenis nilai di tiap cabang.',
    'Pelajaran ini membahas empat jenis guard: typeof, in, instanceof, dan guard buatan sendiri.'
  ],
  objectives: [
    'Memakai typeof sebagai type guard',
    'Memakai operator in dan instanceof',
    'Membuat type guard sendiri dengan is',
    'Memahami konsep narrowing'
  ],
  sections: [
    {
      type: 'example',
      title: 'typeof guard',
      lang: 'typescript',
      output: false,
      code: `function luasPersegi(sisi: number | string): number {
  if (typeof sisi === "number") {
    // Di sini TypeScript TAHU sisi adalah number
    return sisi * sisi;
  }
  // Di sini sisi pasti string — konversi dulu
  return Number(sisi) * Number(sisi);
}

console.log(luasPersegi(5));      // 25
console.log(luasPersegi("4"));    // 16`,
      explain: [
        '<code>typeof sisi === "number"</code> adalah <b>guard</b>: di dalam if, tipe menyempit ke <code>number</code>.',
        'Di luar if (setelah return), TypeScript menyimpulkan sisa kemungkinan — <code>string</code>.',
        'Inilah yang disebut <b>narrowing</b>: tipe menyempit sesuai alur kode.'
      ]
    },
    {
      type: 'example',
      title: 'in guard dan instanceof guard',
      lang: 'typescript',
      output: false,
      code: `type Burung = { terbang: () => void };
type Ikan = { berenang: () => void };

function gerakkan(x: Burung | Ikan) {
  if ("terbang" in x) {
    x.terbang();      // TypeScript tahu x adalah Burung
  } else {
    x.berenang();     // dan di sini x adalah Ikan
  }
}

// instanceof — untuk objek dari kelas
function prosesTanggal(x: Date | string) {
  if (x instanceof Date) {
    console.log(x.getFullYear());
  } else {
    console.log(x.toUpperCase());
  }
}`,
      explain: [
        '<code>"properti" in objek</code> memeriksa keberadaan properti — cocok untuk union objek.',
        '<code>instanceof</code> memeriksa apakah objek dibuat oleh <b>konstruktor/kelas</b> tertentu.',
        'Keduanya menyempitkan tipe seperti halnya typeof.'
      ]
    },
    {
      type: 'example',
      title: 'Type guard buatan sendiri',
      lang: 'typescript',
      output: false,
      code: `type Kucing = { jenis: "kucing"; suara: () => string };
type Anjing = { jenis: "anjing"; suara: () => string };

function adalahKucing(x: Kucing | Anjing): x is Kucing {
  return x.jenis === "kucing";
}

function bersuara(x: Kucing | Anjing) {
  if (adalahKucing(x)) {
    // x menyempit menjadi Kucing
    console.log("Kucing: " + x.suara());
  } else {
    console.log("Anjing: " + x.suara());
  }
}

bersuara({ jenis: "kucing", suara: () => "meong" });
bersuara({ jenis: "anjing", suara: () => "guk" });`,
      explain: [
        'Guard buatan sendiri: fungsi yang <b>mengembalikan boolean</b> dengan tanda <code>x is Tipe</code>.',
        'Bila fungsi mengembalikan <code>true</code>, TypeScript <b>mempercayai</b> bahwa <code>x</code> bertipe <code>Tipe</code> di cabang itu.',
        'Pola ini rapi untuk pemeriksaan rumit yang dipakai di banyak tempat.'
      ]
    },
    {
      type: 'tip',
      title: 'Pilih guard yang paling sederhana',
      text: 'Urutan pilihan: <b>typeof</b> untuk primitif, <b>in</b> untuk objek biasa, <b>instanceof</b> untuk kelas, dan <b>guard kustom</b> bila pemeriksaannya dipakai ulang atau rumit.'
    },
    {
      type: 'warn',
      title: 'Guard kustom harus jujur',
      text: 'Tanda <code>x is Kucing</code> adalah <b>janji</b>. Bila fungsi mengembalikan <code>true</code> untuk nilai yang sebenarnya bukan <code>Kucing</code>, TypeScript akan menyetujui kode yang salah — dan bug muncul saat runtime. Pastikan logika guard benar-benar memeriksa tipe.'
    },
    {
      type: 'vocab',
      items: [
        ['Type guard', 'Pemeriksaan yang menyempitkan tipe union di cabang kode.'],
        ['typeof', 'Operator yang mengembalikan nama tipe dasar nilai.'],
        ['in', 'Operator untuk memeriksa keberadaan properti pada objek.'],
        ['instanceof', 'Operator untuk memeriksa asal kelas sebuah objek.'],
        ['x is Tipe', 'Tanda kembalian fungsi guard kustom.'],
        ['Narrowing', 'Penyempitan tipe berdasarkan alur kendali kode.']
      ]
    }
  ],
  recap: [
    'Type guard menyempitkan tipe union di dalam cabang kode.',
    'typeof untuk primitif, in untuk objek, instanceof untuk kelas.',
    'Guard kustom: fungsi yang mengembalikan x is Tipe.',
    'Narrowing terjadi otomatis setelah guard berhasil.',
    'Guard kustom harus ditulis jujur agar janjinya benar.'
  ]
});

/* ---------- Pelajaran 11: Discriminated Unions ---------- */
window.TS_LESSONS.push({
  id: 'discriminated-unions',
  title: 'Discriminated Unions',
  chapter: 'Tipe Majemuk',
  duration: '10 menit',
  intro: [
    '<b>Discriminated union</b> adalah pola andalan TypeScript: gabungan tipe yang masing-masing punya <b>penanda bersama</b> (properti <b>discriminant</b>), biasanya berupa <b>literal type</b>.',
    'Pola ini membuat <code>switch</code> menjadi alat pemeriksa tipe yang sangat kuat.'
  ],
  objectives: [
    'Memahami properti discriminant',
    'Membuat discriminated union',
    'Menyempitkan tipe dengan switch',
    'Menjelaskan mengapa pola ini populer di aplikasi nyata'
  ],
  sections: [
    {
      type: 'example',
      title: 'Bentuk dasar',
      lang: 'typescript',
      output: false,
      code: `type Persegi = {
  kind: "persegi";   // discriminant
  sisi: number;
};

type PersegiPanjang = {
  kind: "persegi-panjang";
  panjang: number;
  lebar: number;
};

type Lingkaran = {
  kind: "lingkaran";
  jari: number;
};

type Bangun = Persegi | PersegiPanjang | Lingkaran;`,
      explain: [
        'Setiap anggota union punya properti <code>kind</code> berisi <b>literal type</b> yang unik.',
        'Properti <code>kind</code> inilah yang disebut <b>discriminant</b> — pembeda.',
        '<code>Bangun</code> adalah <b>discriminated union</b>: gabungan tipe berpenanda.'
      ]
    },
    {
      type: 'example',
      title: 'switch sebagai penyempit tipe',
      lang: 'typescript',
      output: false,
      code: `function luas(b: Bangun): number {
  switch (b.kind) {
    case "persegi":
      return b.sisi * b.sisi;          // b: Persegi
    case "persegi-panjang":
      return b.panjang * b.lebar;      // b: PersegiPanjang
    case "lingkaran":
      return Math.PI * b.jari * b.jari; // b: Lingkaran
  }
}

console.log(luas({ kind: "persegi", sisi: 4 }));
// 16
console.log(luas({ kind: "lingkaran", jari: 2 }));
// ≈ 12.57`,
      explain: [
        'Setelah <code>case "persegi"</code>, TypeScript <b>tahu</b> <code>b</code> adalah <code>Persegi</code> — akses <code>b.sisi</code> sah.',
        'Tanpa discriminant, properti tiap anggota harus diperiksa satu per satu; dengan discriminant, <b>satu switch</b> cukup.',
        'TypeScript juga memeriksa apakah <b>semua kemungkinan sudah ditangani</b> (bila strict).'
      ]
    },
    {
      type: 'tip',
      title: 'Di mana pola ini dipakai',
      text: 'Discriminated union ada di mana-mana: pesan dari server ({"status": "sukses", "data": ...} | {"status": "gagal", "error": ...}), aksi pada state manager (Redux/Zustand), hasil panggilan API, dan perintah pengguna. Pola ini adalah cara idiomatik TypeScript menggambarkan "salah satu dari beberapa bentuk".'
    },
    {
      type: 'example',
      title: 'Contoh nyata: hasil panggilan API',
      lang: 'typescript',
      output: false,
      code: `type Sukses = { status: "sukses"; data: string[] };
type Gagal = { status: "gagal"; pesan: string };
type SedangMuat = { status: "sedang-muat" };

type Hasil = Sukses | Gagal | SedangMuat;

function tampilkan(h: Hasil): string {
  switch (h.status) {
    case "sedang-muat": return "Memuat data...";
    case "gagal":       return "Error: " + h.pesan;
    case "sukses":      return "Ditemukan " + h.data.length + " item";
  }
}

console.log(tampilkan({ status: "sukses", data: ["a", "b"] }));
// Ditemukan 2 item`,
      explain: [
        'Setiap status membawa <b>data berbeda</b> — <code>data</code> hanya ada saat sukses, <code>pesan</code> hanya saat gagal.',
        'Pola ini mencegah kesalahan klasik: membaca <code>data</code> padahal panggilan gagal.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan lupa memberinya penanda',
      text: 'Union tanpa discriminant (<code>{ nama: string } | { nama: string; umur: number }</code>) <b>bukan</b> discriminated union dan jauh lebih sulit disempitkan. Selalu sediakan satu properti literal yang unik untuk tiap anggota.'
    },
    {
      type: 'vocab',
      items: [
        ['Discriminated union', 'Union yang tiap anggotanya punya penanda unik.'],
        ['Discriminant', 'Properti pembeda (biasanya literal type).'],
        ['Exhaustive check', 'Pemeriksaan bahwa semua kemungkinan ditangani.'],
        ['switch narrowing', 'Penyempitan tipe otomatis di tiap case.'],
        ['Idiomatik', 'Cara penulisan yang lazim dan direkomendasikan.']
      ]
    }
  ],
  recap: [
    'Discriminated union = gabungan tipe dengan penanda unik di tiap anggota.',
    'Penanda (discriminant) biasanya literal type seperti kind atau status.',
    'switch pada penanda menyempitkan tipe otomatis di tiap case.',
    'Pola ini umum untuk hasil API, aksi, dan pesan.',
    'Selalu beri penanda unik agar union mudah disempitkan.'
  ]
});
