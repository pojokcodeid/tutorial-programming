/**
 * Modul bersama TokoMicro — state keranjang + utilitas format.
 *
 * Dua keputusan penting:
 *
 * 1. Tidak ada import React. Remote boleh pindah framework (React, Vue, atau
 *    DOM biasa) tanpa menyentuh modul ini.
 * 2. Seluruh state disimpan di `globalThis`. Tiap remote tetap menggandakan
 *    berkas ini ke dalam bundelnya sendiri, namun karena sumber kebenarannya
 *    satu (objek global), badge header dan halaman keranjang selalu sepakat.
 *    Alternatifnya adalah mendaftarkan paket ini di `shared` Module
 *    Federation dengan `singleton: true` — pola yang sama, dibantu bundler.
 */

const NS = (globalThis.__TOKOMICRO__ ??= {});

/* Satu instance state, siapa pun yang membuka berkas ini duluan yang membuat. */
if (!NS.cart) NS.cart = { items: [], listeners: new Set() };
const cart = NS.cart;

function emit() {
  /* Satu listener yang rusak tidak boleh mematikan listener lain. */
  for (const listener of [...cart.listeners]) {
    try {
      listener();
    } catch (err) {
      console.error('[shared] penangan perubahan keranjang gagal:', err);
    }
  }
}

/** Langganan perubahan keranjang. Wajib dipanggil kembali (cleanup) saat unmount. */
export function subscribe(listener) {
  cart.listeners.add(listener);
  return () => {
    cart.listeners.delete(listener);
  };
}

/** Snapshot untuk useSyncExternalStore — identitas berubah hanya saat isi berubah. */
export function getSnapshot() {
  return cart.items;
}

export function addItem(product) {
  const exists = cart.items.some((item) => item.id === product.id);
  cart.items = exists
    ? cart.items.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      )
    : [...cart.items, { ...product, qty: 1 }];
  emit();
}

export function changeQty(id, delta) {
  const item = cart.items.find((entry) => entry.id === id);
  if (!item) return;
  if (item.qty + delta <= 0) return removeItem(id);
  cart.items = cart.items.map((entry) =>
    entry.id === id ? { ...entry, qty: entry.qty + delta } : entry
  );
  emit();
}

export function removeItem(id) {
  cart.items = cart.items.filter((entry) => entry.id !== id);
  emit();
}

export function clearCart() {
  cart.items = [];
  emit();
}

/** Hitung jumlah item dan total belanja. */
export function cartSummary(items = getSnapshot()) {
  const qty = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { qty, total };
}

/** Format rupiah ala Indonesia. */
export function rupiah(value) {
  return 'Rp' + value.toLocaleString('id-ID');
}
