import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  cartSummary,
  changeQty,
  clearCart,
  getSnapshot,
  removeItem,
  rupiah,
  subscribe
} from '@tokomicro/shared';
import './cart.css';

/* URL relatif: saat berjalan di halaman shell, origin-nya adalah origin shell. */
const API_URL = '/api/orders';

/**
 * Remote keranjang.
 *
 * Isinya dibaca dari modul bersama yang sama dengan remote header — satu
 * sumber kebenaran untuk dua remote yang dibangun oleh tim berbeda.
 */
export default function Cart({ ctx }) {
  const items = useSyncExternalStore(subscribe, getSnapshot);
  const { qty, total } = useMemo(() => cartSummary(items), [items]);
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  async function checkout() {
    if (items.length === 0 || busy) return;
    setBusy(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);

      clearCart();
      setOrder(data);
      ctx.toast(`Pesanan ${data.id} berhasil dibuat`, 'success');
    } catch (err) {
      ctx.toast('Gagal membuat pesanan: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <section className="ct">
        <div className="ct-done">
          <h2>✅ Pesanan {order.id} diterima</h2>
          <p>
            Total {rupiah(order.total)} · {order.items.length} jenis produk
          </p>
          <a className="ct-btn-primary" href="#/katalog">
            Belanja lagi
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="ct">
      <div className="ct-head">
        <h1>Keranjang</h1>
        <p>
          Isi keranjang berasal dari <code>@tokomicro/shared</code> — satu
          instance yang dipakai bersama oleh header, produk, dan remote ini.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="ct-empty">
          <p>🧺 Keranjang masih kosong.</p>
          <a className="ct-btn-primary" href="#/katalog">
            Pilih produk dulu
          </a>
        </div>
      ) : (
        <>
          <ul className="ct-list">
            {items.map((item) => (
              <li key={item.id} className="ct-item">
                <span className="ct-emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                <div className="ct-info">
                  <b>{item.name}</b>
                  <span>{rupiah(item.price)} / item</span>
                </div>
                <div className="ct-qty">
                  <button
                    type="button"
                    className="ct-step"
                    aria-label={`Kurangi ${item.name}`}
                    onClick={() => changeQty(item.id, -1)}
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    className="ct-step"
                    aria-label={`Tambah ${item.name}`}
                    onClick={() => changeQty(item.id, 1)}
                  >
                    +
                  </button>
                </div>
                <b className="ct-sub">{rupiah(item.price * item.qty)}</b>
                <button
                  type="button"
                  className="ct-remove"
                  aria-label={`Hapus ${item.name}`}
                  onClick={() => {
                    removeItem(item.id);
                    ctx.toast('Item dihapus dari keranjang.', 'info');
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="ct-summary">
            <span>
              Total ({qty} item)
            </span>
            <b>{rupiah(total)}</b>
          </div>

          <button
            type="button"
            className="ct-btn-primary ct-checkout"
            disabled={busy}
            onClick={checkout}
          >
            {busy ? 'Mengirim…' : 'Buat pesanan'}
          </button>
        </>
      )}
    </section>
  );
}
