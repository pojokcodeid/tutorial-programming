import { useEffect, useMemo, useState } from 'react';
import { addItem, rupiah } from '@tokomicro/shared';
import './products.css';

/* URL relatif: saat berjalan di halaman shell, origin-nya adalah origin shell. */
const API_URL = '/api/products';

/**
 * Remote katalog.
 *
 * - Mengambil datanya sendiri (bukan lewat remote lain).
 * - Request dibatalkan dengan AbortController saat remote dibongkar.
 * - Menulis ke keranjang lewat modul bersama, bukan lewat HTTP ke remote cart.
 */
export default function Products({ ctx }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Semua');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    (async () => {
      try {
        const res = await fetch(API_URL, { signal: controller.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        setProducts(await res.json());
        setStatus('ready');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setStatus('error');
      }
    })();

    return () => controller.abort();
  }, [reload]);

  const categories = useMemo(
    () => ['Semua', ...new Set(products.map((product) => product.category))],
    [products]
  );

  const visible =
    category === 'Semua'
      ? products
      : products.filter((product) => product.category === category);

  return (
    <section className="pf">
      <div className="pf-head">
        <h1>Katalog Produk</h1>
        <p>
          Data diambil dari <code>{API_URL}</code> oleh remote ini secara
          mandiri, lalu keranjang ditulis lewat <code>@tokomicro/shared</code>.
        </p>
        <div className="pf-filter">
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              className={`pf-chip${category === value ? ' is-active' : ''}`}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && <p className="pf-note">Memuat produk…</p>}

      {status === 'error' && (
        <div className="pf-error" role="alert">
          <p>Gagal memuat produk: {error}</p>
          <button
            type="button"
            className="pf-btn"
            onClick={() => setReload((value) => value + 1)}
          >
            Coba lagi
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="pf-grid">
          {visible.map((product) => (
            <article key={product.id} className="pf-card">
              <div className="pf-emoji" aria-hidden="true">
                {product.emoji}
              </div>
              <span className="pf-cat">{product.category}</span>
              <h3 className="pf-name">{product.name}</h3>
              <p className="pf-price">{rupiah(product.price)}</p>
              <button
                type="button"
                className="pf-btn"
                onClick={() => {
                  addItem(product);
                  ctx.toast(`${product.name} masuk keranjang`, 'success');
                }}
              >
                Tambah ke keranjang
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
