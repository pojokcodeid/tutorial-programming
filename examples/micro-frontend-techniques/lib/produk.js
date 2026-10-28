/* ============================================================
   Data contoh + fungsi murni.

   Fungsi di sini sengaja tidak menyentuh DOM atau jaringan supaya
   mudah diuji dengan `node --test test.mjs`. Server memakai data
   yang sama untuk endpoint /api/produk.
   ============================================================ */

export const PRODUK = Object.freeze([
  Object.freeze({ id: 'p1', nama: 'Keyboard Mekanik', kategori: 'Aksesori', harga: 750000, stok: 12, emoji: '⌨️' }),
  Object.freeze({ id: 'p2', nama: 'Mouse Nirkabel', kategori: 'Aksesori', harga: 320000, stok: 24, emoji: '🖱️' }),
  Object.freeze({ id: 'p3', nama: 'Layar 27 Inci', kategori: 'Monitor', harga: 2450000, stok: 5, emoji: '🖥️' }),
  Object.freeze({ id: 'p4', nama: 'Kursi Ergonomis', kategori: 'Furnitur', harga: 1890000, stok: 3, emoji: '🪑' }),
  Object.freeze({ id: 'p5', nama: 'Lampu Meja LED', kategori: 'Furnitur', harga: 210000, stok: 18, emoji: '💡' }),
  Object.freeze({ id: 'p6', nama: 'Headset Stereo', kategori: 'Aksesori', harga: 540000, stok: 0, emoji: '🎧' })
]);

/**
 * Format angka menjadi rupiah tanpa bergantung pada locale ICU.
 * Contoh: 750000 -> "Rp 750.000"
 */
export function formatRupiah(nilai) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return 'Rp 0';

  const bulat = Math.round(angka);
  const negatif = bulat < 0;
  const digit = String(Math.abs(bulat)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${negatif ? '-' : ''}Rp ${digit}`;
}

export function normalisasiKataKunci(kataKunci) {
  return String(kataKunci ?? '').trim().toLowerCase();
}

/**
 * Cari produk berdasarkan nama atau kategori (tidak peka huruf besar/kecil).
 * Kata kunci kosong mengembalikan salinan seluruh daftar.
 */
export function cariProduk(daftar = PRODUK, kataKunci = '') {
  const kunci = normalisasiKataKunci(kataKunci);
  if (!kunci) return [...daftar];

  return daftar.filter((produk) => {
    const teks = `${produk.nama} ${produk.kategori}`.toLowerCase();
    return teks.includes(kunci);
  });
}

/**
 * Hitung total keranjang. Item yang tidak valid dilewati, bukan
 * membuat seluruh perhitungan menjadi NaN.
 */
export function hitungTotal(items = []) {
  if (!Array.isArray(items)) return 0;

  return items.reduce((total, item) => {
    const harga = Number(item?.harga);
    const jumlah = Number(item?.jumlah ?? 1);

    if (!Number.isFinite(harga) || !Number.isFinite(jumlah) || jumlah <= 0) {
      return total;
    }

    return total + harga * jumlah;
  }, 0);
}
