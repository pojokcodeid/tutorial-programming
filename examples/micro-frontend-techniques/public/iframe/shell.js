/* ============================================================
   Shell demo iframe.

   Shell hanya berkomunikasi lewat postMessage. Tidak ada import
   modul remote dan tidak ada akses DOM ke dalam iframe.
   ============================================================ */

const iframe = document.querySelector('#remote');
const log = document.querySelector('#log');
const input = document.querySelector('#pesan');
const tombolKirim = document.querySelector('#kirim');
const tombolBersihkan = document.querySelector('#bersihkan');

const LABEL = {
  keluar: 'keluar',
  masuk: 'masuk',
  sistem: 'sistem',
  galat: 'galat'
};

const BATAS_LOG = 30;

function waktu() {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
}

function tambahLog(arah, teks, meta = '') {
  const baris = document.createElement('div');
  baris.className = 'log-baris';

  const label = document.createElement('span');
  label.className = `log-arah log-arah--${arah}`;
  label.textContent = LABEL[arah] || arah;

  const isi = document.createElement('div');
  isi.className = 'log-isi';

  const pesan = document.createElement('div');
  pesan.textContent = `${waktu()} · ${teks}`;
  isi.append(pesan);

  if (meta) {
    const detail = document.createElement('div');
    detail.className = 'log-meta';
    detail.textContent = meta;
    isi.append(detail);
  }

  baris.append(label, isi);
  log.prepend(baris);

  while (log.childElementCount > BATAS_LOG) {
    log.lastElementChild.remove();
  }
}

function kirimPesan() {
  const teks = input.value.trim();

  if (!teks) {
    tambahLog('galat', 'Pesan kosong tidak dikirim.');
    input.focus();
    return;
  }

  if (!iframe.contentWindow) {
    tambahLog('galat', 'Iframe belum siap. Tunggu sebentar lalu coba lagi.');
    return;
  }

  iframe.contentWindow.postMessage(
    { tipe: 'sapa', teks, dikirim: new Date().toISOString() },
    '*'
  );

  tambahLog('keluar', teks, "postMessage(..., '*')");
  input.focus();
}

window.addEventListener('message', (event) => {
  // Hanya terima pesan dari iframe yang kita buat.
  if (event.source !== iframe.contentWindow) return;

  const data = event.data;
  if (!data || typeof data !== 'object' || typeof data.teks !== 'string') return;

  if (data.tipe === 'siap' || data.tipe === 'balasan') {
    tambahLog('masuk', data.teks, `origin: ${event.origin}`);
  }
});

iframe.addEventListener('load', () => {
  tambahLog('sistem', 'Iframe selesai dimuat. Menunggu pesan dari remote.');
});

tombolKirim.addEventListener('click', kirimPesan);
tombolBersihkan.addEventListener('click', () => log.replaceChildren());

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    kirimPesan();
  }
});

tambahLog('sistem', 'Shell siap. Remote berjalan di dokumen terpisah.');
