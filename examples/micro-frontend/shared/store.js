/* ============================================================
   shared/store.js — "shared module": state keranjang.

   Dipakai oleh dua remote berbeda:
     - header  → menampilkan jumlah item (badge)
     - cart    → menampilkan daftar item & total

   Prinsipnya sama dengan shared dependencies pada Module
   Federation: satu instance modul dipakai bersama, sehingga
   state tetap satu walaupun remote dimuat terpisah.
   ============================================================ */

import { emit } from './bus.js';

const state = { items: [] };

export function getCart() {
  return state.items;
}

export function addItem(product) {
  const found = state.items.find((i) => i.id === product.id);
  if (found) found.qty += 1;
  else state.items.push({ ...product, qty: 1 });
  emit('cart:change', getCart());
}

export function changeQty(id, delta) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeItem(id);
  emit('cart:change', getCart());
}

export function removeItem(id) {
  const index = state.items.findIndex((i) => i.id === id);
  if (index === -1) return;
  state.items.splice(index, 1);
  emit('cart:change', getCart());
}

export function clearCart() {
  state.items = [];
  emit('cart:change', getCart());
}

/** Ringkasan untuk badge dan perhitungan total. */
export function cartSummary() {
  const qty = state.items.reduce((sum, i) => sum + i.qty, 0);
  const total = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { qty, total };
}

/** Format rupiah tanpa dependensi eksternal. */
export function rupiah(n) {
  return 'Rp' + n.toLocaleString('id-ID');
}
