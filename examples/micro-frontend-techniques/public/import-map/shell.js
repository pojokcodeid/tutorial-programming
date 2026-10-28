/* ============================================================
   Shell demo import map.

   Shell tidak mengimpor remote secara statis. Nama @lab/remote
   dipetakan oleh import map, lalu dimuat saat dibutuhkan dengan
   import() dinamis.
   ============================================================ */

const SPEC = '@lab/remote';
const SPEC_RUSAK = '@lab/remote-rusak';

const slot = document.querySelector('#slot');
const statusEl = document.querySelector('#status');
const statusTeks = document.querySelector('#status-teks');
const logEl = document.querySelector('#log');
const tombolMuat = document.querySelector('#muat');
const tombolBongkar = document.querySelector('#bongkar');
const tombolRusak = document.querySelector('#rusak');
const keranjangEl = document.querySelector('#keranjang');
const totalEl = document.querySelector('#total');
const jumlahItemEl = document.querySelector('#jumlah-item');
const statusKeranjang = document.querySelector('#status-keranjang');

const keranjang = [];

let instance = null;
let sedangMemuat = false;

const importMapDidukung = typeof HTMLScriptElement.supports === 'function'
  ? HTMLScriptElement.supports('importmap')
  : true;

function formatRupiah(nilai) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return 'Rp 0';

  const bulat = Math.round(angka);
  const negatif = bulat < 0;
  const digit = String(Math.abs(bulat)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negatif ? '-' : ''}Rp ${digit}`;
}

function waktu() {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
}

function catat(teks, jenis = 'sistem') {
  const baris = document.createElement('div');
  baris.className = 'log-baris';

  const label = document.createElement('span');
  label.className = `log-arah log-arah--${jenis}`;
  label.textContent = jenis === 'galat' ? 'galat' : 'info';

  const isi = document.createElement('div');
  isi.className = 'log-isi';
  isi.textContent = `${waktu()} · ${teks}`;

  baris.append(label, isi);
  logEl.prepend(baris);

  while (logEl.childElementCount > 30) {
    logEl.lastElementChild.remove();
  }
}

function setStatus(jenis, teks) {
  statusEl.className = `status status--${jenis}`;
  statusEl.textContent = jenis;

  statusTeks.className = 'status-teks';
  if (jenis === 'siap') statusTeks.classList.add('status-teks--siap');
  if (jenis === 'gagal') statusTeks.classList.add('status-teks--gagal');
  statusTeks.textContent = teks;
}

function pesanKosong(teks) {
  const kotak = document.createElement('div');
  kotak.className = 'im-kosong';

  const pesan = document.createElement('p');
  pesan.textContent = teks;

  kotak.append(pesan);
  return kotak;
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
    kosong.textContent = 'Keranjang masih kosong. Muat remote lalu tambahkan produk.';
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
  statusKeranjang.textContent = keranjang.length === 0
    ? 'Keranjang kosong.'
    : `${jumlah} item di keranjang, total ${formatRupiah(total)}.`;
}

function tambahKeKeranjang(produk) {
  const nama = String(produk?.nama || '').trim();
  const harga = Number(produk?.harga);

  if (!nama || !Number.isFinite(harga) || harga < 0) return;

  const sudahAda = keranjang.find((item) => item.nama === nama);

  if (sudahAda) {
    sudahAda.jumlah += 1;
  } else {
    keranjang.push({ nama, harga, jumlah: 1 });
  }

  renderKeranjang();
}

function bongkar({ diam = false } = {}) {
  if (instance && typeof instance.unmount === 'function') {
    try {
      instance.unmount();
    } catch (err) {
      catat(`unmount() melempar error: ${err.message}`, 'galat');
    }
  }

  instance = null;
  slot.replaceChildren(pesanKosong('Remote belum dipasang. Klik “Muat remote”.'));
  tombolBongkar.disabled = true;

  if (!diam) {
    setStatus('idle', 'Remote dibongkar. Shell tetap berjalan.');
    catat('unmount() dipanggil dan slot dibersihkan.');
  }
}

async function muat() {
  if (sedangMemuat || !importMapDidukung) return;

  sedangMemuat = true;
  tombolMuat.disabled = true;
  tombolRusak.disabled = true;
  bongkar({ diam: true });

  setStatus('memuat', `Mengimpor ${SPEC}…`);
  catat(`import('${SPEC}') dimulai.`);

  const mulai = performance.now();

  try {
    const modul = await import('@lab/remote');

    if (typeof modul.mount !== 'function') {
      throw new TypeError('Modul tidak mengekspor fungsi mount().');
    }

    instance = modul.mount(slot, { onTambah: tambahKeKeranjang });

    const durasi = Math.round(performance.now() - mulai);
    setStatus('siap', `Remote siap dalam ${durasi} ms. Modul: ${SPEC}`);
    catat(`import('${SPEC}') berhasil dalam ${durasi} ms.`);
    tombolBongkar.disabled = false;
  } catch (err) {
    const durasi = Math.round(performance.now() - mulai);
    setStatus('gagal', `Gagal memuat remote: ${err.message}`);
    catat(`import('${SPEC}') gagal setelah ${durasi} ms: ${err.message}`, 'galat');
    slot.replaceChildren(pesanKosong('Remote gagal dimuat, tetapi shell tetap berjalan.'));
  } finally {
    sedangMemuat = false;
    tombolMuat.disabled = false;
    tombolRusak.disabled = false;
  }
}

async function cobaModulRusak() {
  if (sedangMemuat || !importMapDidukung) return;

  sedangMemuat = true;
  tombolMuat.disabled = true;
  tombolRusak.disabled = true;

  setStatus('memuat', `Mengimpor ${SPEC_RUSAK}…`);
  catat(`import('${SPEC_RUSAK}') dimulai.`);

  const mulai = performance.now();

  try {
    await import('@lab/remote-rusak');
    setStatus('gagal', 'Modul rusak ternyata berhasil dimuat. Periksa kembali berkasnya.');
    catat('Modul rusak tidak melempar error seperti yang diharapkan.', 'galat');
  } catch (err) {
    const durasi = Math.round(performance.now() - mulai);
    setStatus('gagal', `Gagal sesuai rencana: ${err.message}`);
    catat(
      `import('${SPEC_RUSAK}') ditolak setelah ${durasi} ms: ${err.message}`,
      'galat'
    );

    if (instance) {
      catat('Remote yang sudah terpasang tetap hidup. Shell tidak ikut gagal.');
    }
  } finally {
    sedangMemuat = false;
    tombolMuat.disabled = false;
    tombolRusak.disabled = false;
  }
}

tombolMuat.addEventListener('click', muat);
tombolBongkar.addEventListener('click', () => bongkar());
tombolRusak.addEventListener('click', cobaModulRusak);

renderKeranjang();
catat('Shell siap. Import map aktif.');

if (!importMapDidukung) {
  setStatus(
    'gagal',
    'Browser ini belum mendukung import map. Gunakan Chrome, Edge, Firefox, atau Safari versi terbaru.'
  );
  tombolMuat.disabled = true;
  tombolRusak.disabled = true;
  catat('HTMLScriptElement.supports("importmap") bernilai false.', 'galat');
}
