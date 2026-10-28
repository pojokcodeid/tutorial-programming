import { useState, version as reactVersion } from 'react';
import './styles.css';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
  stock: string;
};

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Keyboard Mekanik',
    category: 'Aksesori',
    price: 750_000,
    emoji: '⌨️',
    stock: 'Stok 12',
  },
  {
    id: 'p2',
    name: 'Mouse Nirkabel',
    category: 'Aksesori',
    price: 320_000,
    emoji: '🖱️',
    stock: 'Stok 34',
  },
  {
    id: 'p3',
    name: 'Layar 27 inci',
    category: 'Monitor',
    price: 2_450_000,
    emoji: '🖥️',
    stock: 'Stok 5',
  },
];

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

/**
 * Kontrak remote: default export berupa komponen React tanpa props wajib.
 * Host memuatnya lewat React.lazy, jadi bentuk default export ini penting.
 */
export default function RemoteApp() {
  const [added, setAdded] = useState<string[]>([]);

  function toggleProduct(id: string) {
    setAdded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <section className="remote-app" aria-labelledby="remote-title">
      <header className="remote-app__header">
        <div>
          <p className="remote-app__eyebrow">remote/App · port 4182</p>
          <h2 id="remote-title">Katalog Produk</h2>
          <p className="remote-app__lede">
            Komponen ini diekspos oleh <code>apps/remote</code> dan dirender host
            lewat Module Federation.
          </p>
        </div>
        <span className="remote-app__badge">React {reactVersion}</span>
      </header>

      <div className="remote-app__grid">
        {PRODUCTS.map((product) => {
          const isAdded = added.includes(product.id);

          return (
            <article className="product-card" key={product.id}>
              <div className="product-card__media" aria-hidden="true">
                {product.emoji}
              </div>
              <div className="product-card__body">
                <span className="product-card__category">{product.category}</span>
                <h3>{product.name}</h3>
                <p className="product-card__price">{rupiah.format(product.price)}</p>
                <div className="product-card__footer">
                  <span>{product.stock}</span>
                  <button
                    type="button"
                    className={isAdded ? 'is-added' : undefined}
                    aria-pressed={isAdded}
                    onClick={() => toggleProduct(product.id)}
                  >
                    {isAdded ? 'Ditambahkan' : 'Tambah'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="remote-app__note">
        State tombol hanya hidup di remote; host tidak mengelola state ini.
      </p>
    </section>
  );
}
