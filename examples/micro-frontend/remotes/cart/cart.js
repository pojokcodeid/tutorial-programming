/* ============================================================
   remote: cart — keranjang belanja & checkout.

   Membaca shared store (bukan meniru data), lalu mengirim pesanan
   ke API shell. Remote ini tidak tahu cara kerja remote products.
   ============================================================ */

import { on } from '/shared/bus.js';
import { getCart, changeQty, removeItem, clearCart, cartSummary, rupiah } from '/shared/store.js';

const CSS_URL = '/remotes/cart/cart.css';
const API_URL = '/api/orders';

let root = null;
let controller = null;
const disposers = [];

function ensureStyles() {
  if (document.querySelector(`link[href="${CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

function emptyState() {
  return `
    <div class="ct-empty">
      <p>🧺 Keranjang masih kosong.</p>
      <a class="btn btn-primary" href="#/katalog">Pilih produk dulu</a>
    </div>`;
}

function listHtml() {
  const items = getCart();
  if (items.length === 0) return emptyState();

  const rows = items.map((i) => `
    <li class="ct-item">
      <span class="ct-emoji" aria-hidden="true">${i.emoji}</span>
      <div class="ct-info">
        <b>${i.name}</b>
        <span>${rupiah(i.price)} / item</span>
      </div>
      <div class="ct-qty">
        <button class="ct-btn" data-dec="${i.id}" aria-label="Kurangi">−</button>
        <span>${i.qty}</span>
        <button class="ct-btn" data-inc="${i.id}" aria-label="Tambah">+</button>
      </div>
      <b class="ct-sub">${rupiah(i.price * i.qty)}</b>
      <button class="ct-remove" data-del="${i.id}" aria-label="Hapus ${i.name}">✕</button>
    </li>`).join('');

  const { total } = cartSummary();
  return `
    <ul class="ct-list">${rows}</ul>
    <div class="ct-summary">
      <span>Total</span><b>${rupiah(total)}</b>
    </div>
    <button class="btn btn-primary ct-checkout" data-checkout>Buat pesanan</button>`;
}

export function mount(container, ctx) {
  ensureStyles();

  root = document.createElement('section');
  root.className = 'ct';
  root.innerHTML = `
    <div class="ct-head">
      <h1>Keranjang</h1>
      <p>State keranjang berasal dari <code>shared/store.js</code> — satu sumber untuk semua remote.</p>
    </div>
    <div data-body></div>`;
  container.appendChild(root);

  const body = root.querySelector('[data-body]');
  const paint = () => { body.innerHTML = listHtml(); };
  paint();
  disposers.push(on('cart:change', paint));

  controller = new AbortController();

  body.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.matches('[data-inc]')) return changeQty(t.dataset.inc, 1);
    if (t.matches('[data-dec]')) return changeQty(t.dataset.dec, -1);
    if (t.matches('[data-del]')) {
      removeItem(t.dataset.del);
      return ctx.toast('Item dihapus dari keranjang.', 'info');
    }
    if (!t.matches('[data-checkout]')) return;

    const items = getCart();
    const button = t;
    button.disabled = true;
    button.textContent = 'Mengirim…';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        signal: controller.signal
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);

      clearCart();
      body.innerHTML = `
        <div class="ct-done">
          <h2>✅ Pesanan ${data.id} diterima</h2>
          <p>Total ${rupiah(data.total)} · ${items.length} jenis produk</p>
          <a class="btn btn-primary" href="#/katalog">Belanja lagi</a>
        </div>`;
      ctx.toast(`Pesanan ${data.id} berhasil dibuat`, 'success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      button.disabled = false;
      button.textContent = 'Buat pesanan';
      ctx.toast('Gagal membuat pesanan: ' + err.message, 'error');
    }
  });
}

export function unmount() {
  disposers.splice(0).forEach((dispose) => dispose());
  controller?.abort();
  controller = null;
  root?.remove();
  root = null;
}
