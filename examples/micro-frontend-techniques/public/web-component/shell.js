/* ============================================================
   Shell demo Web Component.

   Shell membuat elemen <tokomicro-product-card>, mengisi atribut,
   dan mendengarkan event add-to-cart. Shell tidak mengetahui
   markup atau CSS di dalam Shadow DOM.
   ============================================================ */

const daftarProduk = document.querySelector('#daftar-produk');
const statusProduk = document.querySelector('#status-produk');
const keranjangEl = document.querySelector('#keranjang');
const totalEl = document.querySelector('#total');
const jumlahItemEl = document.querySelector('#jumlah-item');
const tombolKosongkan = document.querySelector('#kosongkan');
const tombolSerang = document.querySelector('#serang');
const indikatorSerangan = document.querySelector('#indikator-serangan');
const statusKeranjang = document.querySelector('#status-keranjang');
const kartuBiasa = document.querySelector('.kartu-biasa');

const keranjang = [];

function formatRupiah(nilai) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return 'Rp 0';

  const bulat = Math.round(angka);
  const negatif = bulat < 0;
  const digit = String(Math.abs(bulat)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negatif ? '-' : ''}Rp ${digit}`;
}

function totalKeranjang() {
  return keranjang.reduce((total, item) => total + item.harga * item.jumlah, 0);
}

function jumlahItem() {
  return keranjang.reduce((total, item) => total + item.jumlah, 0);
}

function renderKeranjang() {
  keranjangEl.replaceChildren();

  if (keranjang.length === 0) {
    const kosong = document.createElement('li');
    kosong.className = 'kosong';
    kosong.textContent = 'Keranjang masih kosong. Tambahkan produk dari kartu di samping.';
    keranjangEl.append(kosong);
  } else {
    keranjang.forEach((item, indeks) => {
      const baris = document.createElement('li');

      const info = document.createElement('div');
      info.className = 'keranjang__info';

      const nama = document.createElement('span');
      nama.className = 'keranjang__nama';
      nama.textContent = `${item.jumlah}× ${item.nama}`;

      const harga = document.createElement('span');
      harga.className = 'keranjang__harga';
      harga.textContent = formatRupiah(item.harga * item.jumlah);

      info.append(nama, harga);

      const hapus = document.createElement('button');
      hapus.type = 'button';
      hapus.className = 'keranjang__hapus';
      hapus.textContent = 'Hapus';
      hapus.setAttribute('aria-label', `Hapus ${item.nama} dari keranjang`);
      hapus.addEventListener('click', () => {
        keranjang.splice(indeks, 1);
        renderKeranjang();
      });

      baris.append(info, hapus);
      keranjangEl.append(baris);
    });
  }

  const total = totalKeranjang();
  const jumlah = jumlahItem();

  totalEl.textContent = formatRupiah(total);
  jumlahItemEl.textContent = `${jumlah} item`;
  tombolKosongkan.disabled = keranjang.length === 0;
  statusKeranjang.textContent = keranjang.length === 0
    ? 'Keranjang kosong.'
    : `${jumlah} item di keranjang, total ${formatRupiah(total)}.`;
}

function tambahKeKeranjang(item) {
  const nama = String(item?.nama || '').trim();
  const harga = Number(item?.harga);

  if (!nama || !Number.isFinite(harga) || harga < 0) return;

  const sudahAda = keranjang.find((baris) => baris.nama === nama);

  if (sudahAda) {
    sudahAda.jumlah += 1;
  } else {
    keranjang.push({ nama, harga, jumlah: 1 });
  }

  renderKeranjang();
}

async function muatProduk() {
  statusProduk.className = 'status status--memuat';
  statusProduk.textContent = 'Memuat…';

  try {
    const respons = await fetch('/api/produk', { headers: { Accept: 'application/json' } });
    if (!respons.ok) throw new Error(`HTTP ${respons.status}`);

    const hasil = await respons.json();
    if (!Array.isArray(hasil.data)) throw new Error('Bentuk data API tidak dikenal.');

    await customElements.whenDefined('tokomicro-product-card');

    const fragmen = document.createDocumentFragment();

    for (const produk of hasil.data) {
      const kartu = document.createElement('tokomicro-product-card');
      kartu.setAttribute('nama', produk.nama);
      kartu.setAttribute('harga', String(produk.harga));
      kartu.setAttribute('stok', String(produk.stok));
      kartu.setAttribute('kategori', produk.kategori);
      kartu.setAttribute('emoji', produk.emoji);
      fragmen.append(kartu);
    }

    daftarProduk.replaceChildren(fragmen);
    statusProduk.className = 'status status--siap';
    statusProduk.textContent = `${hasil.total} produk`;
  } catch (err) {
    statusProduk.className = 'status status--gagal';
    statusProduk.textContent = 'Gagal memuat';
    daftarProduk.replaceChildren();

    const pesan = document.createElement('p');
    pesan.className = 'kecil';
    pesan.textContent = `Katalog tidak bisa dimuat: ${err.message}`;
    daftarProduk.append(pesan);
  }
}

document.addEventListener('add-to-cart', (event) => {
  tambahKeKeranjang(event.detail);
});

kartuBiasa.querySelector('button').addEventListener('click', () => {
  tambahKeKeranjang({
    nama: kartuBiasa.dataset.nama,
    harga: Number(kartuBiasa.dataset.harga)
  });
});

tombolKosongkan.addEventListener('click', () => {
  keranjang.length = 0;
  renderKeranjang();
});

tombolSerang.addEventListener('click', () => {
  const aktif = document.body.classList.toggle('serangan-gaya');

  tombolSerang.setAttribute('aria-pressed', String(aktif));
  tombolSerang.textContent = aktif ? 'Matikan serangan gaya' : 'Nyalakan serangan gaya';
  indikatorSerangan.textContent = aktif
    ? 'CSS global: agresif. Kartu biasa berubah; Shadow DOM tetap.'
    : 'CSS global: normal';
});

renderKeranjang();
muatProduk();
