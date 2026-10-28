import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import type { AppContext, Product } from '@tokomicro/contracts';
import { productSchema } from '@tokomicro/contracts';
import { Badge, Button, Card } from '@tokomicro/ui-kit';
import { addItem, emitAddToCart, rupiah } from '@tokomicro/shared';
import './products.css';

/* URL relatif: saat berjalan di halaman shell, origin-nya adalah origin shell. */
const API_URL = '/api/products';

interface Props {
  ctx: AppContext;
}

type Status = 'loading' | 'ready' | 'error';

function useProducts(ctx: AppContext) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');

    (async () => {
      try {
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { products?: unknown };
        const parsed = productSchema.array().safeParse(data.products);
        if (!parsed.success) throw new Error('Bentuk data produk tidak sesuai kontrak.');
        setProducts(parsed.data);
        setStatus('ready');
      } catch (cause) {
        if (controller.signal.aborted) return;
        const message = cause instanceof Error ? cause.message : 'Galat tidak dikenal';
        setError(message);
        setStatus('error');
        ctx.telemetry.error(cause, { remote: 'products', endpoint: API_URL });
      }
    })();

    return () => controller.abort();
  }, [ctx, reloadKey]);

  return {
    products,
    status,
    error,
    retry: () => setReloadKey((value) => value + 1)
  };
}

function ProductList({
  ctx,
  products,
  status,
  error,
  retry
}: Props & {
  products: Product[];
  status: Status;
  error: string;
  retry: () => void;
}) {
  const [category, setCategory] = useState('Semua');

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(products.map((item) => item.category)))],
    [products]
  );

  const visible =
    category === 'Semua' ? products : products.filter((item) => item.category === category);

  function handleAdd(product: Product) {
    addItem(product);
    emitAddToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      at: new Date().toISOString()
    });
    ctx.toast(ctx.t('products.added', { name: product.name }), 'success');
    ctx.telemetry.event('add_to_cart', { productId: product.id, price: product.price });
  }

  return (
    <section className="pf-view">
      <header className="pf-head">
        <h1>{ctx.t('products.title')}</h1>
        <p>
          {ctx.t('products.lead')} <code>{API_URL}</code>
        </p>
      </header>

      {status === 'loading' ? <p className="pf-note">{ctx.t('common.loading')}</p> : null}

      {status === 'error' ? (
        <div className="pf-error" role="alert">
          <p>{ctx.t('products.error', { message: error })}</p>
          <Button variant="primary" onClick={retry}>
            {ctx.t('common.retry')}
          </Button>
        </div>
      ) : null}

      {status === 'ready' ? (
        <>
          <div className="pf-filter" role="group" aria-label="Filter kategori">
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                className={`pf-chip${name === category ? ' is-active' : ''}`}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="pf-note">{ctx.t('common.empty')}</p>
          ) : (
            <div className="pf-grid">
              {visible.map((product) => (
                <Card
                  key={product.id}
                  className="pf-card"
                  title={
                    <span className="pf-card__title">
                      <span aria-hidden="true">{product.emoji ?? '📦'}</span>
                      {product.name}
                    </span>
                  }
                  footer={
                    <div className="pf-card__actions">
                      <strong>{rupiah(product.price)}</strong>
                      <Button size="sm" variant="primary" onClick={() => handleAdd(product)}>
                        {ctx.t('products.add')}
                      </Button>
                    </div>
                  }
                >
                  <div className="pf-card__meta">
                    <Badge>{product.category}</Badge>
                    <Link to={`detail/${product.id}`}>{ctx.t('products.detail')}</Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function ProductDetail({
  ctx,
  products,
  status
}: Props & { products: Product[]; status: Status }) {
  const { id } = useParams<{ id: string }>();
  const product = products.find((item) => item.id === id);

  if (status === 'loading') {
    return (
      <section className="pf-view">
        <p className="pf-note">{ctx.t('common.loading')}</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="pf-view">
        <h1>{ctx.t('products.detail')}</h1>
        <p className="pf-note">Produk “{id}” tidak ditemukan.</p>
        <Link to="..">{ctx.t('products.back')}</Link>
      </section>
    );
  }

  return (
    <section className="pf-view">
      <p className="pf-breadcrumb">
        <Link to="..">{ctx.t('products.back')}</Link>
      </p>
      <Card
        title={
          <span className="pf-card__title">
            <span aria-hidden="true">{product.emoji ?? '📦'}</span>
            {product.name}
          </span>
        }
        footer={
          <div className="pf-card__actions">
            <strong>{rupiah(product.price)}</strong>
            <Button
              variant="primary"
              onClick={() => {
                addItem(product);
                emitAddToCart({
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  qty: 1,
                  at: new Date().toISOString()
                });
                ctx.toast(ctx.t('products.added', { name: product.name }), 'success');
              }}
            >
              {ctx.t('products.add')}
            </Button>
          </div>
        }
      >
        <p>
          Kategori: <Badge>{product.category}</Badge>
        </p>
        <p className="pf-note">
          Rute detail ini hidup di dalam remote katalog. Shell hanya tahu prefix{' '}
          <code>/katalog/*</code>; sisa URL dikelola remote.
        </p>
        <p className="pf-note">
          ID produk: <code>{product.id}</code>
        </p>
      </Card>
    </section>
  );
}

/**
 * Remote katalog.
 *
 * - Mengambil datanya sendiri (bukan lewat remote lain).
 * - Request dibatalkan dengan AbortController saat remote dibongkar.
 * - Menulis ke keranjang lewat modul bersama dan mengumumkan event.
 */
export default function Products({ ctx }: Props) {
  const { products, status, error, retry } = useProducts(ctx);

  return (
    <Routes>
      <Route
        index
        element={
          <ProductList
            ctx={ctx}
            products={products}
            status={status}
            error={error}
            retry={retry}
          />
        }
      />
      <Route
        path="detail/:id"
        element={<ProductDetail ctx={ctx} products={products} status={status} />}
      />
      <Route
        path="*"
        element={
          <section className="pf-view">
            <p className="pf-note">Rute katalog tidak dikenal.</p>
            <Link to=".">{ctx.t('products.back')}</Link>
          </section>
        }
      />
    </Routes>
  );
}
