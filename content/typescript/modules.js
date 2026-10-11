/* ============================================================
   Pelajaran TypeScript — Bab 11: Modularisasi
   (topik info.md: "modules", "namespaces")
   ============================================================ */
'use strict';

window.TS_LESSONS = window.TS_LESSONS || [];

/* ---------- Pelajaran 24: Modules ---------- */
window.TS_LESSONS.push({
  id: 'modules-typescript',
  title: 'Modules',
  chapter: 'Modul',
  duration: '12 menit',
  intro: [
    '<b>Modul</b> membagi program menjadi berkas-berkas terpisah: setiap berkas hanya menampilkan apa yang <b>diekspor</b>, dan memakai apa yang <b>diimpor</b>.',
    'Pelajaran ini membahas export/import di TypeScript.'
  ],
  objectives: [
    'Mengekspor dan mengimpor anggota',
    'Membedakan named export dan default export',
    'Mengimpor hanya tipe (type-only import)',
    'Memahami re-export dan penamaan ulang'
  ],
  sections: [
    {
      type: 'example',
      title: 'Named export & import',
      lang: 'typescript',
      output: false,
      code: `// util.ts
export const PI = 3.14;

export function keliling(r: number): number {
  return 2 * PI * r;
}

export type Lingkaran = {
  jari: number;
  warna: string;
};

// main.ts
import { PI, keliling, Lingkaran } from "./util";

const l: Lingkaran = { jari: 5, warna: "merah" };
console.log(keliling(l.jari));   // 31.4`,
      explain: [
        '<code>export</code> menjadikan anggota <b>terlihat</b> di luar berkas.',
        '<code>import { ... } from "./util"</code> mengambil anggota bernama.',
        'Tipe pun bisa diekspor: <code>export type Lingkaran</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Default export',
      lang: 'typescript',
      output: false,
      code: `// kalkulator.ts
export default function kalkulator(a: number, b: number): number {
  return a + b;
}

// main.ts — nama bebas saat mengimpor
import kalk from "./kalkulator";

console.log(kalk(2, 3));   // 5`,
      explain: [
        '<b>Default export</b>: satu per berkas, nama <b>bebas</b> saat impor.',
        'Cocok untuk "hal utama" berkas: satu kelas, satu fungsi, satu komponen.',
        'Named export lebih disarankan untuk alat — refactoring lebih aman.'
      ]
    },
    {
      type: 'example',
      title: 'Impor tipe saja & penamaan ulang',
      lang: 'typescript',
      output: false,
      code: `// Impor hanya tipe (dihapus saat kompilasi)
import type { Lingkaran } from "./util";

// Penamaan ulang saat impor
import { keliling as kelilingLingkaran } from "./util";

// Re-export: teruskan ke luar
export { keliling, PI } from "./util";

// Impor semuanya sebagai objek
import * as util from "./util";
console.log(util.PI);`,
      explain: [
        '<code>import type</code> mengimpor <b>hanya tipe</b> — kode hasil kompilasi tidak menyertakannya.',
        '<code>as</code> mengubah nama anggota saat impor.',
        '<code>export ... from</code> meneruskan anggota (<b>re-export</b>).',
        '<code>import * as</code> mengumpulkan semua anggota jadi satu objek.'
      ]
    },
    {
      type: 'example',
      title: 'Modul di tsconfig',
      lang: 'json',
      output: false,
      code: `{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020"
  }
}

// Untuk Node.js murni, sering dipakai:
// "module": "NodeNext"
// dan berkas .mts / .cts bila perlu`,
      explain: [
        '<code>module</code> menentukan <b>format</b> modul hasil kompilasi (ESNext, CommonJS, NodeNext).',
        '<code>moduleResolution</code> menentukan cara TypeScript <b>mencari</b> berkas yang diimpor.',
        'Proyek modern umumnya memakai ESNext + bundler (Vite, esbuild, webpack).'
      ]
    },
    {
      type: 'tip',
      title: 'Path module',
      text: 'Impor relatif memakai <code>./</code> (folder ini) dan <code>../</code> (folder induk). Impor paket memakai nama (<code>"lodash"</code>). TypeScript juga mendukung <code>paths</code> di tsconfig untuk alias impor seperti <code>@/util</code>.'
    },
    {
      type: 'warn',
      title: 'Setiap berkas adalah modul',
      text: 'Berkas tanpa <code>import</code>/<code>export</code> adalah <b>skrip</b> global — variabelnya bocor ke ruang global. Selalu tambahkan minimal satu <code>export</code> agar berkas menjadi modul yang terisolasi.'
    },
    {
      type: 'vocab',
      items: [
        ['Module', 'Berkas dengan import/export yang terisolasi.'],
        ['Named export', 'Anggota diekspor dengan nama.'],
        ['Default export', 'Satu ekspor utama per berkas.'],
        ['import type', 'Impor yang hanya membawa tipe.'],
        ['Re-export', 'Meneruskan anggota dari modul lain.'],
        ['moduleResolution', 'Cara TS mencari berkas impor.'],
        ['ESNext / NodeNext', 'Format modul modern.'],
        ['Skrip', 'Berkas tanpa export; variabel global.']
      ]
    }
  ],
  recap: [
    'export membuat anggota terlihat; import mengambilnya.',
    'Named export banyak; default export satu per berkas.',
    'import type hanya membawa tipe.',
    'as mengubah nama; export ... from meneruskan.',
    'tsconfig mengatur format modul (module, moduleResolution).'
  ]
});

/* ---------- Pelajaran 25: Namespaces ---------- */
window.TS_LESSONS.push({
  id: 'namespaces-typescript',
  title: 'Namespaces',
  chapter: 'Modul',
  duration: '8 menit',
  intro: [
    '<b>Namespace</b> adalah cara <b>mengelompokkan</b> kode dalam satu berkas — "ruang nama" yang mencegah bentrok nama.',
    'Pelajaran ini membahasnya, sekaligus mengapa modul biasanya lebih disukai.'
  ],
  objectives: [
    'Membuat namespace dengan kata kunci namespace',
    'Mengekspor anggota namespace',
    'Memahami nested namespace',
    'Memilih antara namespace dan modul'
  ],
  sections: [
    {
      type: 'example',
      title: 'Namespace dasar',
      lang: 'typescript',
      output: false,
      code: `namespace Geometri {
  export const PI = 3.14;

  export function luasPersegi(sisi: number): number {
    return sisi * sisi;
  }

  // Tidak diekspor: hanya dipakai di dalam
  function rahasia(): void {
    console.log("internal");
  }
}

console.log(Geometri.PI);                // 3.14
console.log(Geometri.luasPersegi(4));  // 16
// Geometri.rahasia();                    // ✗ Error: tidak terlihat`,
      explain: [
        '<code>namespace</code> membungkus anggota dalam satu <b>ruang nama</b>.',
        'Anggota harus <code>export</code> untuk terlihat dari luar.',
        'Anggota tanpa export bersifat <b>pribadi</b> untuk namespace itu.'
      ]
    },
    {
      type: 'example',
      title: 'Namespace bersarang',
      lang: 'typescript',
      output: false,
      code: `namespace Toko {
  export namespace Barang {
    export type Produk = {
      id: number;
      nama: string;
    };

    export function buat(id: number, nama: string): Produk {
      return { id, nama };
    }
  }

  export namespace Keranjang {
    export function total(items: Barang.Produk[]): number {
      return items.length;   // (contoh sederhana)
    }
  }
}

const p = Toko.Barang.buat(1, "Pensil");
console.log(p.nama);   // "Pensil"`,
      explain: [
        'Namespace boleh <b>bersarang</b>: <code>Toko.Barang</code>, <code>Toko.Keranjang</code>.',
        'Pengelompokan hierarkis ini dulu populer sebelum modul ES6 ada.',
        'Akses anggota memakai <b>titik</b> seperti objek.'
      ]
    },
    {
      type: 'warn',
      title: 'Namespace di era modul',
      text: 'Dulu (sebelum ES2015), namespace adalah cara utama mengorganisasi kode. Kini <b>modul</b> sudah menjadi standar: setiap berkas adalah modul dengan export/import. Namespace masih berguna untuk <b>kode lama</b>, <b>deklarasi global</b> (mis. memperluas <code>globalThis</code>), dan beberapa pustaka lawas — tetapi untuk kode baru, <b>gunakan modul</b>.'
    },
    {
      type: 'tip',
      title: 'Kapan namespace masih masuk akal',
      text: '1) Menambahkan tipe ke lingkup global. 2) Mengelompokkan tipe deklarasi (.d.ts). 3) Migrasi proyek JavaScript lama. Selain itu, modul lebih fleksibel: bisa diregabung oleh <b>tree-shaker</b>, mendukung <b>pemuatan malas</b>, dan bekerja dengan bundler modern.'
    },
    {
      type: 'vocab',
      items: [
        ['Namespace', 'Pengelompokan kode dalam satu ruang nama.'],
        ['Nested namespace', 'Namespace di dalam namespace.'],
        ['Anggota ekspor', 'Anggota yang terlihat dari luar namespace.'],
        ['Modul', 'Berkas dengan import/export (pendekatan modern).'],
        ['globalThis', 'Objek global lintas lingkungan.'],
        ['.d.ts', 'Berkas deklarasi tipe tanpa kode runtime.']
      ]
    }
  ],
  recap: [
    'Namespace mengelompokkan kode dalam ruang nama.',
    'Anggota harus export untuk terlihat; sisanya pribadi.',
    'Namespace boleh bersarang.',
    'Modul adalah cara modern; namespace untuk kode lama/global.',
    'Untuk proyek baru: pilih modul.'
  ]
});
