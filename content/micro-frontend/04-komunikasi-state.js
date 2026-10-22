/* ============================================================
   Pelajaran Micro-Frontend — Bab 4: Komunikasi & Shared State
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-komunikasi-state',
  title: 'Event Bus & Shared State',
  chapter: 'Membangun',
  duration: '14 menit',
  intro: [
    'Ketika header harus menampilkan jumlah keranjang, sedangkan keranjang dimiliki tim lain, muncul pertanyaan paling penting dalam micro-frontend: <b>bagaimana remote berkomunikasi tanpa saling mengimpor kode?</b> Jawabannya lewat dua hal: <b>event bus</b> (kabar) dan <b>shared store</b> (keadaan bersama).',
    'Bab ini membangun keduanya dari nol — <code>bus.on()</code>, <code>bus.emit()</code>, beserta aturan penulisan handler yang aman — lalu menyusun sebuah store keranjang kecil yang dipakai bersama. Prinsip yang dipegang: remote hanya tahu kontrak, tidak pernah tahu siapa di seberang.',
    'Di bagian praktik kamu akan memasang event bus sederhana dan melihat langsung bagaimana dua bagian yang tidak saling kenal bisa bekerja sama.'
  ],
  objectives: [
    'Menulis event bus sendiri lengkap dengan langganan dan pembatalan',
    'Menerapkan pola shared store untuk state bersama beberapa remote',
    'Membungkus handler dengan try/catch agar kegagalan terisolasi',
    'Menghindari listener leak dengan disposer di unmount',
    'Menyepakati kontrak nama event dan bentuk payload'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Tidak Boleh Saling Impor?</h3><p>Cara termudah membuat header tahu isi keranjang adalah mengimpor modul keranjang langsung: <code>import { cart } from \'../cart/state.js\'</code>. Cara ini bekerja — sampai tim keranjang mengubah bentuk datanya, dan header ikut rusak tanpa pernah diuji ulang. Ketergantungan seperti itu memaksa keduanya rilis bersamaan, dan itulah persis definisi <i>distributed monolith</i>.</p><p>Event bus membalik arahnya: pengirim menyebarkan kabar tanpa tahu siapa yang menerima, penerima menangkap kabar tanpa tahu siapa yang mengirim. Keduanya hanya perlu sepakat pada <b>nama event</b> dan <b>bentuk payload</b>.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 220" width="760" role="img" aria-label="Header dan cart tidak saling mengimpor, keduanya berbicara lewat event bus di tengah"><rect x="40" y="70" width="180" height="64" rx="8" class="u-box"/><text x="130" y="98" class="u-title" text-anchor="middle">remote: header</text><text x="130" y="118" class="u-lbl" text-anchor="middle">Tim A · badge jumlah item</text><rect x="540" y="70" width="180" height="64" rx="8" class="u-box"/><text x="630" y="98" class="u-title" text-anchor="middle">remote: cart</text><text x="630" y="118" class="u-lbl" text-anchor="middle">Tim C · tambah, ubah jumlah</text><rect x="285" y="60" width="190" height="84" rx="8" class="u-hl"/><text x="380" y="92" class="u-title" text-anchor="middle">EVENT BUS</text><text x="380" y="112" class="u-lbl" text-anchor="middle">cart:change { items, count }</text><text x="380" y="130" class="u-lbl" text-anchor="middle">on() · emit() · bersifat longgar</text><line x1="220" y1="102" x2="283" y2="102" class="u-line" marker-end="url(#u-arrow)"/><text x="252" y="92" class="u-lbl" text-anchor="middle">on()</text><line x1="283" y1="122" x2="220" y2="122" class="u-line" marker-end="url(#u-arrow)"/><text x="252" y="140" class="u-lbl" text-anchor="middle">emit()</text><line x1="477" y1="102" x2="538" y2="102" class="u-line" marker-end="url(#u-arrow)"/><text x="508" y="92" class="u-lbl" text-anchor="middle">emit()</text><line x1="538" y1="122" x2="477" y2="122" class="u-line" marker-end="url(#u-arrow)"/><text x="508" y="140" class="u-lbl" text-anchor="middle">on()</text><text x="380" y="195" class="u-lbl" text-anchor="middle">tidak ada garis penghubung antara header dan cart — keduanya tidak saling tahu-menahu</text></svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Komunikasi longgar: kabar mengalir lewat bus, ketergantungan tetap nol</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Membangun event bus sendiri',
      lang: 'js',
      output: false,
      code: `// shared/bus.js — event bus TokoMicro
const listeners = new Map();   // nama event -> Set<fn>

export const bus = {
  on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);

    // kembalikan disposer — dipanggil unmount() agar tidak bocor
    return () => listeners.get(name).delete(fn);
  },

  emit(name, payload) {
    const set = listeners.get(name);
    if (!set) return;

    for (const fn of [...set]) {     // salinan: aman bila ada yang berhenti
      try {
        fn(payload);                 // satu gagal bukan berarti semua gagal
      } catch (err) {
        console.error('[bus] handler ' + name + ' error:', err);
      }
    }
  }
};`,
      explain: [
        '<code>on()</code> <b>mengembalikan fungsi pembatal</b> (disposer) — inilah yang membuat unmount remote bisa membersihkan langganannya dengan satu baris.',
        'Salinan <code>[...set]</code> saat emit melindungi dari iterasi yang berubah di tengah jalan, misal ketika sebuah handler mencabut langganan dirinya sendiri.',
        'try/catch di dalam loop memastikan satu handler yang rusak tidak menghentikan penerima berikutnya — remote satu tidak boleh berkuasa atas remote lain.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Shared Store: Keadaan yang Dipakai Bersama</h3><p>Event bus menangani <b>kabar</b> (\"keranjang berubah!\"), sedangkan <b>isi</b> keranjang itu sendiri disimpan di <b>shared store</b> — satu sumber kebenaran yang bisa dibaca siapa pun dan hanya boleh diubah lewat fungsi yang disepakati. Bedanya dengan variabel biasa: store menyediakan antarmuka <b>fungsi</b> (<code>addItem</code>, <code>changeQty</code>), bukan membiarkan siapa pun menulis properti sembarangan.</p>'
    },
    {
      type: 'example',
      title: 'Shared store keranjang TokoMicro',
      lang: 'js',
      output: false,
      code: `// shared/store.js — satu sumber kebenaran untuk keranjang
import { bus } from './bus.js';

const state = { items: [] };

export const store = {
  cart() { return state.items.slice(); },   // salinan, jangan ekspos isi asli

  addItem(p) {
    const found = state.items.find(i => i.id === p.id);
    if (found) found.qty += 1;
    else state.items.push({ id: p.id, name: p.name, price: p.price, qty: 1 });

    bus.emit('cart:change', this.cart());    // kabarkan perubahan
  },

  changeQty(id, qty) {
    const it = state.items.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, qty);
    bus.emit('cart:change', this.cart());
  },

  removeItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    bus.emit('cart:change', this.cart());
  },

  summary() {
    return {
      count: state.items.reduce((n, i) => n + i.qty, 0),
      total: state.items.reduce((n, i) => n + i.qty * i.price, 0)
    };
  }
};`,
      explain: [
        'Setiap perubahan state otomatis mengumumkan dirinya lewat <code>bus.emit(\'cart:change\')</code> — pengubah tidak perlu tahu siapa yang perlu diberi tahu.',
        '<code>cart()</code> mengembalikan salinan, bukan array aslinya; kalau remote bisa menyuntik objek langsung, satu tim bisa mengubah data tim lain tanpa terdeteksi.',
        'Remote tidak pernah menulis <code>state.items</code> secara langsung — semua lewat fungsi yang memvalidasi dan mengumumkan perubahan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memakai Keduanya di Remote</h3><p>Remote menerima <code>ctx.bus</code> dan <code>ctx.store</code> saat dipanggil <code>mount()</code>. Di sanalah ia mendaftarkan langganan dan menyimpan disposer-nya untuk dipanggil kembali saat <code>unmount()</code>.</p>'
    },
    {
      type: 'example',
      title: 'Pola pemasangan yang benar di remote header',
      lang: 'js',
      output: false,
      code: `// remotes/header/entry.js
let root = null;
let offs = [];

export function mount(container, ctx) {
  root = container;
  root.innerHTML = '<div class="hd-badge" hidden></div>';
  const badge = root.querySelector('.hd-badge');

  const paint = (items) => {
    const n = items.reduce((a, i) => a + i.qty, 0);
    badge.textContent = n;
    badge.hidden = n === 0;          // sembunyikan bila kosong
  };

  paint(ctx.store.cart());           // sinkronkan saat pertama kali tampil
  offs.push(ctx.bus.on('cart:change', paint));   // dengarkan perubahan
}

export function unmount() {
  offs.forEach(off => off());        // lepas SEMUA langganan
  offs = [];
  if (root) root.innerHTML = '';
  root = null;
}`,
      explain: [
        'Saat mount, badge disinkronkan dulu dengan isi store saat ini — karena bisa jadi keranjang sudah terisi sebelum header dipasang (urutan mount tidak dijamin).',
        'Disposer dari <code>bus.on</code> disimpan ke array <code>offs</code> lalu dipanggil semua di unmount — inilah obat untuk <i>listener leak</i>.',
        'Header tidak tahu ada remote cart; ia hanya mendengar <code>cart:change</code> yang datang dari shared module.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: event bus dua arah',
      lang: 'html',
      hint: 'Jalankan lalu klik tombol di dua panel. Coba lepas satu langganan (hapus tanda centang) lalu ubah angka lagi — hanya panel yang masih berlangganan yang bergerak.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Event Bus</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; }
    .panel { border: 1px solid #c7d2fe; border-radius: 10px; padding: 12px; flex: 1; min-width: 200px; }
    button { padding: 6px 12px; cursor: pointer; }
    label { font-size: 13px; display: block; margin-top: 8px; }
  </style>
</head>
<body>
  <h3>Event Bus</h3>
  <div class="row">
    <div class="panel">
      <b>remote: products</b><br>
      <button id="tambah">Tambah item (emit)</button>
    </div>
    <div class="panel">
      <b>remote: header</b> <span id="jml">0</span><br>
      <label><input type="checkbox" id="langganan" checked> masih berlangganan</label>
    </div>
  </div>

  <script>
    // --- bus kecil, sama dengan shared/bus.js ---
    const listeners = new Map();
    const bus = {
      on(name, fn) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(fn);
        return function () { listeners.get(name).delete(fn); };
      },
      emit(name, payload) {
        (listeners.get(name) || []).forEach(function (fn) {
          try { fn(payload); } catch (e) { console.error('handler error', e); }
        });
      }
    };

    let count = 0;

    // remote: header berlangganan pada cart:change
    const off = bus.on('cart:change', function (n) {
      document.getElementById('jml').textContent = n;
    });

    document.getElementById('tambah').addEventListener('click', function () {
      count += 1;
      bus.emit('cart:change', count);   // pengirim tidak tahu siapa penerimanya
    });

    // simulasi unmount(): lepas langganan bila centang dihapus
    document.getElementById('langganan').addEventListener('change', function (e) {
      if (e.target.checked) bus.on('cart:change', function (n) {
        document.getElementById('jml').textContent = n;
      });
      else off();
    });
  </script>
</body>
</html>`
    },
    {
      type: 'warn',
      title: 'Dua Jebakan Paling Sering: Leak dan Salinan Payload',
      text: 'Jebakan pertama adalah <b>listener leak</b>: langganan yang tidak dilepas di unmount tetap hidup di memori dan masih bereaksi terhadap event berikutnya — memanggil fungsi pada elemen yang sudah dihapus. Jebakan kedua adalah <b>payload berupa salinan</b>: sebaiknya event membawa data ringkas (daftar item, jumlah) alih-alih objek state asli, karena penerima yang menyuntik perubahan ke payload justru mengubah keadaan tanpa melewati fungsi store — dan perubahan itu tidak pernah diumumkan.'
    },
    {
      type: 'tip',
      title: 'Sepakati Kontrak Event Sekali, Dokumentasikan Selamanya',
      text: 'Buat satu berkas kontrak sederhana yang mencatat nama event dan bentuk payload: <code>cart:change → { id, name, price, qty }[]</code>, <code>session:login → { user }</code>, <code>theme:change → \'light\' | \'dark\'</code>. Kontrak ini yang dibaca tim baru dan yang diuji pada pengujian integrasi. Tanpa dokumentasi seperti ini, nama event berubah diam-diam dan kegagalannya baru terasa beberapa minggu kemudian di produksi.'
    },
    {
      type: 'vocab',
      items: [
        ['Event bus', 'Kanal komunikasi longgar: pengirim menyebarkan kejadian tanpa tahu penerimanya, penerima menangkap tanpa tahu pengirimnya.'],
        ['Shared store', 'Satu sumber kebenaran state bersama yang diubah hanya lewat fungsi yang disepakati.'],
        ['Disposer', 'Fungsi pembatal yang dikembalikan bus.on() dan dipanggil unmount() untuk melepas langganan.'],
        ['Listener leak', 'Langganan yang tidak pernah dilepas sehingga tetap hidup di memori setelah remote dibongkar.'],
        ['Kontrak event', 'Perjanjian bentuk data: nama event dan struktur payload yang dipakai bersama.'],
        ['Longar (loose) coupling', 'Sifat ketergantungan yang kecil: satu pihak bisa berubah tanpa mengubah pihak lain.'],
        ['Satu sumber kebenaran', 'Prinsip bahwa setiap data hanya punya satu tempat penyimpanan resmi agar nilainya tidak berbeda-beda.'],
        ['Emit', 'Menyebarkan sebuah kejadian ke semua penerimanya pada event bus.']
      ]
    }
  ],
  recap: [
    'Remote tidak boleh saling mengimpor kode; komunikasi lewat event bus (kabar) dan shared store (keadaan bersama).',
    'Event bus ditulis dengan Map berisi Set listener: on() mengembalikan disposer, emit() memanggil handler dengan try/catch dan salinan iterasi.',
    'Shared store menyediakan fungsi seperti addItem/changeQty dan mengumumkan perubahan lewat bus — penerima tidak pernah menulis state langsung.',
    'Setiap langganan wajib disimpan disposer-nya lalu dipanggil di unmount() agar tidak terjadi listener leak.',
    'Kontrak nama event dan bentuk payload harus didokumentasikan agar tetap menjadi kesepakatan bersama.'
  ]
});
