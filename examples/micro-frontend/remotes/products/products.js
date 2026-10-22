/* ============================================================
   remote: products — katalog produk.

   Mengambil data dari API milik shell (bukan dari remote lain),
   lalu menulis ke shared store ketika pengguna menekan "Tambah".
   ============================================================ */

import { addItem, rupiah } from '/shared/store.js';

const CSS_URL = '/remotes/products/products.css';
const API_URL = '/api/products';

let root = null;
let controller = null;

function ensureStyles() {
  if (document.querySelector(`link[href="${CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

function card(p) {
  return `
    <article class="pf-card">
      <div class="pf-emoji" aria-hidden="true">${p.emoji}</div>
      <span class="pf-cat">${p.category}</span>
      <h3 class="pf-name">${p.name}</h3>
      <p class="pf-price">${rupiah(p.price)}</p>
      <button class="btn btn-primary pf-add" data-id="${p.id}">Tambah ke keranjang</button>
    </article>`;
}

export async function mount(container, ctx) {
  ensureStyles();

  root = document.createElement('section');
  root.className = 'pf';
  root.innerHTML = `
    <div class="pf-head">
      <h1>Katalog Produk</h1>
      <p>Data diambil dari <code>${API_URL}</code> oleh remote ini secara mandiri.</p>
      <div class="pf-filter" data-filter></div>
    </div>
    <div class="pf-grid" data-grid>Memuat produk…</div>`;
  container.appendChild(root);

  /* AbortController: ketika shell membongkar remote saat pengguna
     berpindah halaman, request yang menggantung ikut dibatalkan. */
  controller = new AbortController();

  let products = [];
  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    products = await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return;
    root.querySelector('[data-grid]').innerHTML =
      `<p class="pf-error">Gagal memuat produk: ${err.message}</p>`;
    return;
  }

  /* Saring per kategori (tanpa framework — manipulasi DOM biasa). */
  const categories = ['Semua', ...new Set(products.map((p) => p.category))];
  const filterBox = root.querySelector('[data-filter]');
  filterBox.innerHTML = categories
    .map((c, i) => `<button class="pf-chip${i === 0 ? ' is-active' : ''}" data-cat="${c}">${c}</button>`)
    .join('');

  const grid = root.querySelector('[data-grid]');
  const paint = (cat) => {
    const list = cat === 'Semua' ? products : products.filter((p) => p.category === cat);
    grid.innerHTML = list.map(card).join('');
  };
  paint('Semua');

  filterBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    filterBox.querySelectorAll('.pf-chip').forEach((c) => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    paint(btn.dataset.cat);
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;
    const product = products.find((p) => p.id === btn.dataset.id);
    if (!product) return;
    addItem(product);                       // → memicu event cart:change
    ctx.toast(`${product.name} masuk keranjang`, 'success');
  });
}

export function unmount() {
  controller?.abort();                      // batalkan request yang menggantung
  controller = null;
  root?.remove();
  root = null;
}
