/* ============================================================
   <tokomicro-product-card>

   Custom element dengan Shadow DOM. Semua gaya di dalamnya
   terlindungi dari CSS global halaman shell.

   Atribut : nama, harga, stok, kategori, emoji
   Event   : add-to-cart (bubbles, composed)
   ============================================================ */

const GAYA = `
  :host {
    display: block;
    --wc-latar: #f8fafc;
    --wc-teks: #0f172a;
    --wc-lembut: #64748b;
    --wc-aksen: #0f766e;
    --wc-aksen-tua: #115e59;
    --wc-garis: #cbd5e1;
    color: var(--wc-teks);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    contain: layout style;
  }

  * {
    box-sizing: border-box;
  }

  .kartu {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    height: 100%;
    padding: 1.05rem;
    border: 1px solid var(--wc-garis);
    border-radius: 18px;
    background: var(--wc-latar);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .kepala {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .emoji {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 12px;
    background: #e2e8f0;
    font-size: 1.35rem;
  }

  .judul {
    min-width: 0;
  }

  .kategori {
    display: block;
    margin-bottom: 0.1rem;
    color: var(--wc-lembut);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .nama {
    margin: 0;
    color: var(--wc-teks);
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }

  .harga {
    margin: 0;
    color: var(--wc-aksen);
    font-size: 1.2rem;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  .stok {
    margin: 0;
    color: var(--wc-lembut);
    font-size: 0.76rem;
  }

  .tombol {
    width: 100%;
    margin-top: auto;
    padding: 0.65rem 0.8rem;
    border: 0;
    border-radius: 10px;
    background: var(--wc-aksen);
    color: #fff;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 800;
    cursor: pointer;
  }

  .tombol:hover:not(:disabled) {
    background: var(--wc-aksen-tua);
  }

  .tombol:focus-visible {
    outline: 3px solid rgba(15, 118, 110, 0.35);
    outline-offset: 2px;
  }

  .tombol:disabled {
    background: #cbd5e1;
    color: #475569;
    cursor: not-allowed;
  }

  :host([stok="0"]) .kartu {
    opacity: 0.72;
  }

  @media (prefers-reduced-motion: no-preference) {
    .kartu {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .kartu:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 34px rgba(15, 23, 42, 0.14);
    }
  }
`;

function formatRupiah(nilai) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return 'Rp 0';

  const bulat = Math.round(angka);
  const negatif = bulat < 0;
  const digit = String(Math.abs(bulat)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negatif ? '-' : ''}Rp ${digit}`;
}

class TokoMicroProductCard extends HTMLElement {
  static get observedAttributes() {
    return ['nama', 'harga', 'stok', 'kategori', 'emoji'];
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>${GAYA}</style>
      <article class="kartu" part="kartu" aria-labelledby="nama-produk">
        <div class="kepala">
          <span class="emoji" part="emoji" aria-hidden="true">📦</span>
          <div class="judul">
            <span class="kategori" part="kategori">Umum</span>
            <h3 class="nama" id="nama-produk" part="nama">Produk</h3>
          </div>
        </div>
        <p class="harga" part="harga">Rp 0</p>
        <p class="stok" part="stok">Stok tersedia</p>
        <button class="tombol" part="tombol" type="button">Tambah ke keranjang</button>
      </article>
    `;

    this._emoji = shadow.querySelector('.emoji');
    this._kategori = shadow.querySelector('.kategori');
    this._nama = shadow.querySelector('.nama');
    this._harga = shadow.querySelector('.harga');
    this._stok = shadow.querySelector('.stok');
    this._tombol = shadow.querySelector('.tombol');

    this._tombol.addEventListener('click', () => this._kirimKeKeranjang());
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _nilaiStok() {
    const atribut = this.getAttribute('stok');
    if (atribut === null || atribut.trim() === '') return null;

    const angka = Number(atribut);
    return Number.isFinite(angka) ? angka : null;
  }

  _render() {
    if (!this._nama) return;

    const nama = this.getAttribute('nama') || 'Produk tanpa nama';
    const harga = Number(this.getAttribute('harga')) || 0;
    const kategori = this.getAttribute('kategori') || 'Umum';
    const emoji = this.getAttribute('emoji') || '📦';
    const stok = this._nilaiStok();
    const habis = stok !== null && stok <= 0;

    this._emoji.textContent = emoji;
    this._kategori.textContent = kategori;
    this._nama.textContent = nama;
    this._harga.textContent = formatRupiah(harga);
    this._stok.textContent = stok === null ? 'Stok tersedia' : habis ? 'Stok habis' : `Stok: ${stok}`;

    this._tombol.disabled = habis;
    this._tombol.textContent = habis ? 'Stok habis' : 'Tambah ke keranjang';
    this._tombol.setAttribute('aria-label', `Tambah ${nama} ke keranjang`);
  }

  _kirimKeKeranjang() {
    const stok = this._nilaiStok();
    if (stok !== null && stok <= 0) return;

    const nama = this.getAttribute('nama') || 'Produk tanpa nama';
    const harga = Number(this.getAttribute('harga')) || 0;
    const kategori = this.getAttribute('kategori') || 'Umum';
    const emoji = this.getAttribute('emoji') || '📦';

    this.dispatchEvent(
      new CustomEvent('add-to-cart', {
        bubbles: true,
        composed: true,
        detail: { nama, harga, kategori, emoji, stok }
      })
    );
  }
}

if (!customElements.get('tokomicro-product-card')) {
  customElements.define('tokomicro-product-card', TokoMicroProductCard);
}
