/**
 * Modul bersama TokoMicro — state keranjang + utilitas format.
 *
 * Dua keputusan penting:
 *
 * 1. Tidak ada import React. Remote boleh pindah framework tanpa menyentuh
 *    modul ini.
 * 2. Seluruh state disimpan di `globalThis`. Tiap remote menggandakan berkas
 *    ini ke bundelnya sendiri, tetapi sumber kebenarannya tetap satu objek
 *    global. Alternatifnya adalah mendaftarkannya di `shared` Module
 *    Federation dengan `singleton: true`.
 */
import type { CartItem, Product } from '@tokomicro/contracts';

interface CartState {
  items: CartItem[];
  listeners: Set<() => void>;
}

const globalScope = globalThis as typeof globalThis & {
  __TOKOMICRO__?: { cart?: CartState };
};

const namespace = (globalScope.__TOKOMICRO__ ??= {});
if (!namespace.cart) {
  namespace.cart = { items: [], listeners: new Set() };
}
const cart = namespace.cart;

function emit(): void {
  for (const listener of [...cart.listeners]) {
    try {
      listener();
    } catch (error) {
      console.error('[shared] penangan perubahan keranjang gagal:', error);
    }
  }
}

/** Langganan perubahan keranjang. Wajib dipanggil kembali saat unmount. */
export function subscribe(listener: () => void): () => void {
  cart.listeners.add(listener);
  return () => {
    cart.listeners.delete(listener);
  };
}

/** Snapshot stabil untuk useSyncExternalStore. */
export function getSnapshot(): CartItem[] {
  return cart.items;
}

export type CartInput = Product | Omit<CartItem, 'qty'>;

export function addItem(product: CartInput): void {
  const exists = cart.items.some((item) => item.id === product.id);
  cart.items = exists
    ? cart.items.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      )
    : [...cart.items, { ...product, qty: 1 }];
  emit();
}

export function changeQty(id: string, delta: number): void {
  const item = cart.items.find((entry) => entry.id === id);
  if (!item) return;
  if (item.qty + delta <= 0) {
    removeItem(id);
    return;
  }
  cart.items = cart.items.map((entry) =>
    entry.id === id ? { ...entry, qty: entry.qty + delta } : entry
  );
  emit();
}

export function removeItem(id: string): void {
  cart.items = cart.items.filter((entry) => entry.id !== id);
  emit();
}

export function clearCart(): void {
  cart.items = [];
  emit();
}

/** Hitung jumlah item dan total belanja. */
export function cartSummary(items: CartItem[] = getSnapshot()): {
  qty: number;
  total: number;
} {
  const qty = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { qty, total };
}

/** Format rupiah ala Indonesia. */
export function rupiah(value: number): string {
  return 'Rp' + value.toLocaleString('id-ID');
}

export * from './events';
