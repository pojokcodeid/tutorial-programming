/* ============================================================
   Pelajaran Micro-Frontend — Bab 7: State Bersama dan Event Bus Bertipe
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-state-event',
  title: 'State Bersama dan Event Bus Bertipe',
  chapter: 'Kontrak & Data',
  duration: '18 menit',
  intro: [
    'Header perlu menampilkan jumlah item keranjang, remote cart perlu mengubah jumlah, dan halaman checkout perlu membaca total. Bila masing-masing menyimpan salinannya sendiri, badge dan total akan berbeda. Di TokoMicro React, state seperti ini tinggal di <b>satu shared module</b> yang dipakai semua remote.',
    'Namun tidak semua komunikasi cocok memakai state bersama. Kabar seperti "checkout selesai" atau "produk masuk wishlist" lebih tepat dikirim sebagai <b>event</b>. Event tidak menyimpan nilai dan tidak mengembalikan jawaban; ia hanya mengumumkan bahwa sesuatu terjadi.',
    'Bab ini membangun keduanya dengan disiplin: satu instance di <code>globalThis</code>, snapshot stabil untuk <code>useSyncExternalStore</code>, event <code>CustomEvent</code> yang divalidasi Zod, dan <code>BroadcastChannel</code> agar dua tab browser tetap sinkron. Kamu juga akan belajar kapan sebaiknya berhenti memakai keduanya dan bertanya ke backend.'
  ],
  objectives: [
    'Membuat shared module yang hanya memiliki satu instance di seluruh remote',
    'Memakai useSyncExternalStore dengan snapshot yang stabil dan aman untuk React StrictMode',
    'Mendefinisikan event bertipe dengan CustomEvent dan skema Zod',
    'Menyinkronkan state antar-tab memakai BroadcastChannel tanpa membuat loop event',
    'Memilih antara shared module, event bus, dan backend berdasarkan kebutuhan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu Instance, Bukan Satu Salinan per Remote</h3><p>Module Federation dapat memuat berkas shared dari beberapa jalur. Bila setiap jalur mengeksekusi <code>createCartStore()</code> sendiri, header dan cart akan memegang array item yang berbeda. Karena itu store disimpan pada kunci global yang sama: <code>globalThis[Symbol.for("tokomicro.shared.cart")]</code>.</p><p><code>Symbol.for</code> memakai registry global, sehingga kunci yang sama menghasilkan simbol yang sama di semua bundel. Ini bukan pengganti kontrak; ia hanya memastikan satu store untuk satu halaman. Data tetap tidak boleh disimpan di <code>window</code> sebagai properti sembarangan karena mudah bentrok dan sulit dilacak.</p><p>API yang dipublikasikan sengaja kecil: <code>addItem</code>, <code>changeQty</code>, <code>removeItem</code>, <code>clearCart</code>, <code>cartSummary</code>, dan <code>rupiah</code>. Remote tidak boleh mengubah array <code>items</code> secara langsung.</p>'
    },
    {
      type: 'example',
      title: 'Store keranjang tunggal dan hook React',
      lang: 'js',
      output: false,
      code: `// packages/shared/src/index.ts
import { useSyncExternalStore } from 'react';

const KEY = Symbol.for('tokomicro.shared.cart');
function createCartStore() {
  let items = [];
  let snapshot = { items, qty: 0, total: 0 };
  const listeners = new Set();
  function publish(next) {
    items = next;
    snapshot = {
      items,
      qty: items.reduce((sum, item) => sum + item.qty, 0),
      total: items.reduce((sum, item) => sum + item.price * item.qty, 0)
    };
    listeners.forEach((listener) => listener());
  }
  function addItem(product, qty = 1) {
    const found = items.find((item) => item.id === product.id);
    if (found) {
      publish(items.map((item) => item.id === product.id ? { ...item, qty: item.qty + qty } : item));
      return;
    }
    publish([...items, { id: product.id, name: product.name, price: product.price, qty }]);
  }
  function changeQty(id, qty) {
    if (qty <= 0) { removeItem(id); return; }
    publish(items.map((item) => item.id === id ? { ...item, qty } : item));
  }
  function removeItem(id) { publish(items.filter((item) => item.id !== id)); }
  function clearCart() { publish([]); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function getSnapshot() { return snapshot; }
  return { subscribe, getSnapshot, addItem, changeQty, removeItem, clearCart };
}
export const { subscribe, getSnapshot, addItem, changeQty, removeItem, clearCart } =
  globalThis[KEY] ?? (globalThis[KEY] = createCartStore());
export function cartSummary(snapshot = getSnapshot()) {
  return { qty: snapshot.qty, total: snapshot.total };
}
export function rupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(value);
}
export const useCart = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);`,
      explain: [
        '<code>publish</code> selalu membuat array dan objek snapshot baru. Remote tidak pernah memutasi state lama, sehingga React dapat membandingkan referensi dengan benar.',
        '<code>getSnapshot</code> mengembalikan objek yang sama sampai ada perubahan. Ini wajib; bila ia membuat objek baru setiap dipanggil, React akan berhenti dengan galat "getSnapshot should be cached".',
        '<code>globalThis[KEY]</code> memastikan header dan cart memakai store yang sama meskipun bundel dimuat dari remoteEntry yang berbeda.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Snapshot Stabil dan StrictMode</h3><p><code>useSyncExternalStore</code> memanggil <code>getSnapshot</code> berkali-kali, termasuk saat React memeriksa apakah render perlu diulang. Snapshot harus <b>stabil</b>: objek yang sama selama state belum berubah. Menghitung <code>{ items: [...items] }</code> di dalam <code>getSnapshot</code> akan menghasilkan referensi baru terus-menerus dan memicu loop render.</p><p>React 18 StrictMode memasang, melepas, lalu memasang ulang effect di mode pengembangan. Karena itu <code>subscribe</code> harus mengembalikan fungsi <i>cleanup</i> yang benar. Jangan menambahkan listener tanpa menyimpannya, dan jangan memakai array global yang tidak pernah dibersihkan.</p><p><code>cartSummary</code> adalah fungsi turunan, bukan state kedua. Menyimpan total di dua tempat membuka peluang keduanya berbeda. Hitung dari snapshot yang sama setiap kali dibutuhkan.</p>'
    },
    {
      type: 'example',
      title: 'Event bus dengan CustomEvent dan Zod',
      lang: 'js',
      output: false,
      code: `// packages/shared/src/events.ts
import { z } from 'zod';
export const EVENTS = Object.freeze({
  ADD_TO_CART: 'tokomicro:add-to-cart',
  CART_UPDATED: 'tokomicro:cart-updated',
  CHECKOUT_COMPLETED: 'tokomicro:checkout-completed'
});
const schemas = {
  [EVENTS.ADD_TO_CART]: z.object({ productId: z.string().min(1), qty: z.number().int().positive().max(99) }),
  [EVENTS.CART_UPDATED]: z.object({ qty: z.number().int().nonnegative(), total: z.number().nonnegative() }),
  [EVENTS.CHECKOUT_COMPLETED]: z.object({ orderId: z.string().min(1), total: z.number().nonnegative() })
};
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('tokomicro') : null;
function dispatchLocal(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function emit(name, detail) {
  const schema = schemas[name];
  if (!schema) throw new Error('Event tidak terdaftar: ' + name);
  const parsed = schema.safeParse(detail);
  if (!parsed.success) {
    console.warn('[events] payload ditolak', name, parsed.error.issues);
    return false;
  }
  dispatchLocal(name, parsed.data);
  channel?.postMessage({ name, detail: parsed.data });
  return true;
}

export function on(name, handler) {
  const schema = schemas[name];
  if (!schema) throw new Error('Event tidak terdaftar: ' + name);
  const listener = (event) => {
    const parsed = schema.safeParse(event.detail);
    if (parsed.success) handler(parsed.data);
    else console.warn('[events] payload diabaikan', name);
  };
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

channel?.addEventListener('message', (event) => {
  const { name, detail } = event.data ?? {};
  if (!schemas[name]) return;
  const parsed = schemas[name].safeParse(detail);
  if (parsed.success) dispatchLocal(name, parsed.data);
});`,
      explain: [
        'Nama event memakai prefix <code>tokomicro:</code> agar tidak bentrok dengan event browser atau pustaka lain. Konstanta mencegah salah ketik.',
        '<code>safeParse</code> memvalidasi payload sebelum dikirim dan sesudah diterima. Remote versi lama yang mengirim bentuk berbeda tidak akan merusak UI.',
        '<code>BroadcastChannel</code> meneruskan event ke tab lain pada origin yang sama. Tab penerima hanya mengirim <code>CustomEvent</code> lokal, tidak mem-posting ulang, sehingga tidak terjadi loop.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Shared, Event, atau Backend?</h3><table class="vocab"><tr><th>Kebutuhan</th><th>Pilihan</th><th>Alasan</th></tr><tr><td>Badge keranjang harus sama di header dan cart</td><td>Shared module</td><td>Semua pihak perlu membaca nilai yang sama saat ini juga.</td></tr><tr><td>Mengumumkan checkout selesai</td><td>Event</td><td>Tidak butuh jawaban; pengirim tidak peduli siapa yang mendengarkan.</td></tr><tr><td>Stok, harga, dan status pesanan</td><td>Backend</td><td>Sumber kebenaran harus tahan refresh, multi-perangkat, dan audit.</td></tr><tr><td>Meminta data produk dari remote cart</td><td>Backend/BFF</td><td>Event bukan RPC; jangan menunggu balasan lewat event.</td></tr><tr><td>Preferensi tema dan locale</td><td>Shared module</td><td>Nilai kecil, sering dibaca, dan harus langsung terlihat.</td></tr></table><p>Aturan praktisnya: butuh <b>nilai saat ini</b> gunakan shared; butuh <b>mengumumkan kejadian</b> gunakan event; butuh <b>kebenaran yang tahan lama</b> gunakan backend. Jangan menyimpan data pesanan hanya di event karena event yang tidak didengarkan akan hilang selamanya.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: event wishlist-added dan toast',
      lang: 'jsx',
      output: false,
      code: `// 1. packages/shared/src/events.ts — tambahkan event dan skema
export const EVENTS = Object.freeze({
  /* ...event lama... */
  WISHLIST_ADDED: 'tokomicro:wishlist-added'
});

const schemas = {
  /* ...skema lama... */
  [EVENTS.WISHLIST_ADDED]: z.object({ productId: z.string().min(1), name: z.string().min(1), at: z.number().int().positive() })
};

// 2. products: kirim setelah wishlist berhasil disimpan
emit(EVENTS.WISHLIST_ADDED, { productId: product.id, name: product.name, at: Date.now() });

// 3. header: tampilkan toast dan catat telemetri
useEffect(() => on(EVENTS.WISHLIST_ADDED, (payload) => {
  ctx.toast(payload.name + ' masuk wishlist', 'success');
  ctx.telemetry.event('wishlist_added', { productId: payload.productId });
}), [ctx]);

// 4. jalankan, lalu uji payload rusak dari konsol browser
npm run build && npm start
window.dispatchEvent(new CustomEvent('tokomicro:wishlist-added', { detail: { productId: 42 } }));`,
      explain: [
        'Payload rusak tidak menghasilkan toast karena <code>on</code> memanggil <code>safeParse</code> sebelum meneruskan ke handler. Konsol hanya menampilkan peringatan.',
        'Kirim event setelah operasi berhasil, bukan sebelum. Toast "masuk wishlist" tidak boleh muncul saat request gagal.',
        'Buka dua tab, tambahkan wishlist di salah satunya, dan pastikan toast muncul di keduanya berkat <code>BroadcastChannel</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Memakai Event sebagai API',
      text: 'Event tidak memiliki nilai balik, tidak menjamin ada pendengar, dan tidak menyimpan riwayat. Jangan mengirim <code>get-products</code> lalu menunggu <code>products-loaded</code>; itu adalah RPC yang menyamar sebagai event dan akan gagal saat remote lain belum dimuat. Jangan pula memutasi objek <code>detail</code> setelah <code>emit</code>, karena <code>BroadcastChannel</code> memakai structured clone. Selalu bersihkan listener di cleanup, validasi payload di kedua sisi, dan jangan pernah menaruh token atau data pribadi di event yang disiarkan lintas tab.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: Satu State, Dua Tab, Nol Payload Rusak</h3><ol><li>Tambahkan satu produk dari katalog. Badge header dan total di cart harus berubah bersamaan tanpa refresh.</li><li>Buka TokoMicro di dua tab, tambahkan item di tab A, lalu lihat tab B. Keduanya harus sinkron dalam hitungan detik.</li><li>Ubah jumlah menjadi 0. Item harus hilang, bukan tetap tampil dengan jumlah nol.</li><li>Jalankan perintah payload rusak di atas. Tidak boleh ada toast, dan konsol menampilkan <code>payload diabaikan</code>.</li><li>Buka React DevTools, aktifkan StrictMode, lalu pindah rute bolak-balik. Jumlah listener tidak boleh bertambah terus.</li></ol><p>Bila badge berubah dua kali lipat, curigai dua instance store. Bila React berhenti dengan galat snapshot, periksa <code>getSnapshot</code>. Bila event tidak sampai ke tab lain, periksa origin dan dukungan <code>BroadcastChannel</code>.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Shared module', 'Kode yang dimuat bersama oleh beberapa remote, misalnya store keranjang dan format rupiah.'],
        ['Singleton', 'Satu instance untuk seluruh halaman, bukan satu instance per remote.'],
        ['useSyncExternalStore', 'Hook React untuk membaca store eksternal dengan snapshot yang stabil.'],
        ['Snapshot', 'Nilai state pada satu waktu; harus mempertahankan referensi selama belum berubah.'],
        ['Event bus', 'Saluran pengumuman kejadian tanpa nilai balik, di sini berbasis CustomEvent.'],
        ['CustomEvent', 'Event browser yang membawa payload pada properti detail.'],
        ['Zod', 'Pustaka validasi skema untuk memastikan bentuk data sesuai kontrak.'],
        ['BroadcastChannel', 'API browser untuk bertukar pesan antar-tab pada origin yang sama.'],
        ['Structured clone', 'Cara browser menyalin objek untuk dikirim antar-konteks; fungsi dan DOM tidak bisa disalin.'],
        ['Distributed monolith', 'Sistem yang terlihat terpisah tetapi tetap harus rilis dan gagal bersamaan.']
      ]
    }
  ],
  recap: [
    'State yang harus sama di banyak remote disimpan pada satu shared module dengan kunci globalThis.',
    'useSyncExternalStore membutuhkan subscribe yang bersih dan getSnapshot yang mengembalikan referensi stabil.',
    'Event bus dipakai untuk mengumumkan kejadian, bukan untuk meminta data atau menunggu jawaban.',
    'CustomEvent divalidasi dengan Zod, dan BroadcastChannel menyinkronkan event lintas tab tanpa loop.',
    'Data yang harus tahan lama dan diaudit tetap milik backend; shared dan event hanya untuk kebutuhan UI.'
  ]
});
