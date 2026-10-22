/* ============================================================
   remote: header — "chrome" aplikasi (logo, navigasi, badge).

   Dimount oleh shell. Tidak tahu-menahu soal isi halaman lain;
   ia hanya membaca shared store dan mendengarkan event.
   ============================================================ */

import { on } from '/shared/bus.js';
import { cartSummary } from '/shared/store.js';

const CSS_URL = '/remotes/header/header.css';
let root = null;
const disposers = [];

function ensureStyles() {
  if (document.querySelector(`link[href="${CSS_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

export function mount(container, ctx) {
  ensureStyles();

  root = document.createElement('header');
  root.className = 'hd';
  root.innerHTML = `
    <div class="hd-inner">
      <a class="hd-brand" href="#/katalog">🛍️ TokoMicro</a>
      <nav class="hd-nav" aria-label="Navigasi utama">
        <a href="#/katalog"   data-nav="katalog">Katalog</a>
        <a href="#/keranjang" data-nav="keranjang">Keranjang <span class="hd-badge" data-badge hidden>0</span></a>
      </nav>
    </div>`;
  container.appendChild(root);

  const paintBadge = () => {
    const { qty } = cartSummary();
    const badge = root.querySelector('[data-badge]');
    badge.textContent = qty;
    badge.hidden = qty === 0;
  };

  const paintActive = (name) => {
    root.querySelectorAll('[data-nav]').forEach((a) => {
      a.classList.toggle('is-active', a.dataset.nav === name);
    });
  };

  paintBadge();
  paintActive(ctx.route);

  /* Reaktif: badge & menu aktif ikut berubah tanpa remote lain
     perlu tahu keberadaan header. */
  disposers.push(on('cart:change', paintBadge));
  disposers.push(on('route:change', (e) => paintActive(e.name)));

}

export function unmount() {
  disposers.splice(0).forEach((dispose) => dispose());
  root?.remove();
  root = null;
}
