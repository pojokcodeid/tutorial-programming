/* ============================================================
   Remote demo import map.

   Modul ESM biasa. Shell memanggil mount(slot, opsi), lalu
   modul ini mengembalikan objek dengan method unmount().

   Catatan: CSS di bawah disuntikkan ke <head> dokumen yang sama.
   Tidak ada isolasi gaya seperti Shadow DOM.
   ============================================================ */

const GAYA_ID = 'gaya-remote-import-map';

const GAYA = `
  .im-remote {
    --im-aksen: #a78bfa;
    --im-aksen-tua: #7c3aed;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1rem;
    border: 1px solid #312e81;
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(30, 27, 75, 0.55), rgba(15, 23, 42, 0.7));
    color: #e8eefb;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }

  .im-remote * {
    box-sizing: border-box;
  }

  .im-remote__kepala {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .im-remote__kepala h2 {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: -0.02em;
  }

  .im-remote__sub {
    margin: 0.2rem 0 0;
    color: #a5b4fc;
    font-size: 0.74rem;
  }

  .im-remote__status {
    flex: 0 0 auto;
    padding: 0.18rem 0.5rem;
    border: 1px solid #4c1d95;
    border-radius: 999px;
    background: rgba(76, 29, 149, 0.3);
    color: #ddd6fe;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .im-remote__status--siap {
    border-color: #065f46;
    background: rgba(6, 95, 70, 0.35);
    color: #a7f3d0;
  }

  .im-remote__status--gagal {
    border-color: #9f1239;
    background: rgba(159, 18, 57, 0.3);
    color: #fecdd3;
  }

  .im-remote__daftar {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 0.65rem;
  }

  .im-remote__kartu {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    border: 1px solid #312e81;
    border-radius: 10px;
    background: #0b1324;
  }

  .im-remote__emoji {
    font-size: 1.35rem;
    line-height: 1;
  }

  .im-remote__kategori {
    color: #a5b4fc;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .im-remote__nama {
    margin: 0;
    font-size: 0.86rem;
    line-height: 1.25;
  }

  .im-remote__harga {
    margin-top: auto;
    padding-top: 0.25rem;
    color: #ddd6fe;
    font-size: 0.92rem;
    font-weight: 800;
  }

  .im-remote__stok {
    color: #94a3b8;
    font-size: 0.66rem;
  }

  .im-remote__tombol {
    width: 100%;
    margin-top: 0.35rem;
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--im-aksen);
    border-radius: 7px;
    background: var(--im-aksen);
    color: #1e1b4b;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 800;
    cursor: pointer;
  }

  .im-remote__tombol:hover:not(:disabled) {
    background: var(--im-aksen-tua);
    color: #fff;
  }

  .im-remote__tombol:focus-visible {
    outline: 3px solid rgba(167, 139, 250, 0.4);
    outline-offset: 2px;
  }

  .im-remote__tombol:disabled {
    border-color: #334155;
    background: #1e293b;
    color: #64748b;
    cursor: not-allowed;
  }

  .im-remote__error {
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid #9f1239;
    border-radius: 10px;
    background: rgba(159, 18, 57, 0.14);
    color: #fecdd3;
    font-size: 0.78rem;
  }

  .im-remote__error p {
    margin: 0;
  }

  .im-remote__coba {
    justify-self: start;
    padding: 0.4rem 0.6rem;
    border: 1px solid #fb7185;
    border-radius: 6px;
    background: transparent;
    color: #fecdd3;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
  }

  .im-remote__catatan {
    margin: 0;
    color: #94a3b8;
    font-size: 0.7rem;
    line-height: 1.5;
  }
`;

function pastikanGaya() {
  if (document.getElementById(GAYA_ID)) return;

  const gaya = document.createElement('style');
  gaya.id = GAYA_ID;
  gaya.textContent = GAYA;
  document.head.append(gaya);
}

function formatRupiah(nilai) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return 'Rp 0';

  const bulat = Math.round(angka);
  const negatif = bulat < 0;
  const digit = String(Math.abs(bulat)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negatif ? '-' : ''}Rp ${digit}`;
}

export const nama = 'Katalog Remote';
export const versi = '1.0.0';

export function mount(wadah, opsi = {}) {
  pastikanGaya();

  const akar = document.createElement('div');
  akar.className = 'im-remote';
  akar.innerHTML = `
    <div class="im-remote__kepala">
      <div>
        <h2>Katalog Remote</h2>
        <p class="im-remote__sub">Dimuat lewat import('@lab/remote')</p>
      </div>
      <span class="im-remote__status" data-status>memuat</span>
    </div>
    <div class="im-remote__daftar" data-daftar aria-live="polite"></div>
    <p class="im-remote__catatan">
      CSS modul ini disuntikkan ke dokumen yang sama. Semua kelas memakai awalan
      <code>.im-remote</code> agar tidak bentrok, tetapi ini bukan isolasi gaya.
    </p>
  `;

  wadah.replaceChildren(akar);

  const status = akar.querySelector('[data-status]');
  const daftar = akar.querySelector('[data-daftar]');

  let dibatalkan = false;

  function setStatus(jenis, teks) {
    status.className = 'im-remote__status';
    if (jenis === 'siap') status.classList.add('im-remote__status--siap');
    if (jenis === 'gagal') status.classList.add('im-remote__status--gagal');
    status.textContent = teks;
  }

  function buatKartu(produk) {
    const kartu = document.createElement('article');
    kartu.className = 'im-remote__kartu';

    const emoji = document.createElement('span');
    emoji.className = 'im-remote__emoji';
    emoji.textContent = produk.emoji || '📦';
    emoji.setAttribute('aria-hidden', 'true');

    const kategori = document.createElement('span');
    kategori.className = 'im-remote__kategori';
    kategori.textContent = produk.kategori;

    const namaProduk = document.createElement('h3');
    namaProduk.className = 'im-remote__nama';
    namaProduk.textContent = produk.nama;

    const harga = document.createElement('span');
    harga.className = 'im-remote__harga';
    harga.textContent = formatRupiah(produk.harga);

    const stok = document.createElement('span');
    stok.className = 'im-remote__stok';
    stok.textContent = produk.stok > 0 ? `Stok ${produk.stok}` : 'Stok habis';

    const tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'im-remote__tombol';
    tombol.textContent = produk.stok > 0 ? 'Tambah ke keranjang' : 'Stok habis';
    tombol.disabled = !(produk.stok > 0);
    tombol.setAttribute('aria-label', `Tambah ${produk.nama} ke keranjang`);
    tombol.addEventListener('click', () => {
      if (typeof opsi.onTambah === 'function') opsi.onTambah(produk);
    });

    kartu.append(emoji, kategori, namaProduk, harga, stok, tombol);
    return kartu;
  }

  function tampilkanError(pesan) {
    daftar.replaceChildren();

    const kotak = document.createElement('div');
    kotak.className = 'im-remote__error';

    const teks = document.createElement('p');
    teks.textContent = pesan;

    const coba = document.createElement('button');
    coba.type = 'button';
    coba.className = 'im-remote__coba';
    coba.textContent = 'Coba lagi';
    coba.addEventListener('click', muatProduk);

    kotak.append(teks, coba);
    daftar.append(kotak);
  }

  async function muatProduk() {
    setStatus('memuat', 'memuat');
    daftar.replaceChildren();

    try {
      const respons = await fetch('/api/produk', { headers: { Accept: 'application/json' } });
      if (!respons.ok) throw new Error(`HTTP ${respons.status}`);

      const hasil = await respons.json();
      if (dibatalkan) return;
      if (!Array.isArray(hasil.data)) throw new Error('Bentuk data API tidak dikenal.');

      daftar.replaceChildren(...hasil.data.map(buatKartu));
      setStatus('siap', `${hasil.total} produk`);
    } catch (err) {
      if (dibatalkan) return;
      setStatus('gagal', 'gagal');
      tampilkanError(`Katalog gagal dimuat: ${err.message}`);
    }
  }

  muatProduk();

  return {
    unmount() {
      dibatalkan = true;
      wadah.replaceChildren();

      const gaya = document.getElementById(GAYA_ID);
      if (gaya) gaya.remove();
    }
  };
}
