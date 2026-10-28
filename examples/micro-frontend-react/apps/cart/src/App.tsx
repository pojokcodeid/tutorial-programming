import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import type { AppContext, Order } from '@tokomicro/contracts';
import { orderSchema } from '@tokomicro/contracts';
import { Badge, Button, Card } from '@tokomicro/ui-kit';
import {
  cartSummary,
  changeQty,
  clearCart,
  emitCartUpdated,
  emitCheckoutCompleted,
  getSnapshot,
  onAddToCart,
  removeItem,
  rupiah,
  subscribe
} from '@tokomicro/shared';
import './cart.css';

const API_URL = '/api/orders';

interface Props {
  ctx: AppContext;
}

function CartList({ ctx }: Props) {
  const items = useSyncExternalStore(subscribe, getSnapshot);
  const { qty, total } = useMemo(() => cartSummary(items), [items]);

  return (
    <section className="ct-view">
      <header className="ct-head">
        <h1>{ctx.t('cart.title')}</h1>
        <p>
          {ctx.t('cart.lead')} <code>@tokomicro/shared</code>
        </p>
      </header>

      {items.length === 0 ? (
        <div className="ct-empty">
          <p>{ctx.t('cart.empty')}</p>
          <Link to="/katalog">{ctx.t('products.back')}</Link>
        </div>
      ) : (
        <>
          <ul className="ct-list">
            {items.map((item) => (
              <li className="ct-item" key={item.id}>
                <span className="ct-emoji" aria-hidden="true">
                  {item.emoji ?? '📦'}
                </span>
                <span className="ct-info">
                  <strong>{item.name}</strong>
                  <span>
                    {rupiah(item.price)} × {item.qty}
                  </span>
                </span>
                <span className="ct-qty">
                  <button
                    type="button"
                    className="ct-step"
                    aria-label={`Kurangi ${item.name}`}
                    onClick={() => changeQty(item.id, -1)}
                  >
                    −
                  </button>
                  {item.qty}
                  <button
                    type="button"
                    className="ct-step"
                    aria-label={`Tambah ${item.name}`}
                    onClick={() => changeQty(item.id, 1)}
                  >
                    +
                  </button>
                </span>
                <strong className="ct-line">{rupiah(item.price * item.qty)}</strong>
                <button
                  type="button"
                  className="ct-remove"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Hapus ${item.name}`}
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>

          <footer className="ct-foot">
            <span>
              {ctx.t('cart.total', { qty })}: <strong>{rupiah(total)}</strong>
            </span>
            <Button variant="primary" onClick={() => ctx.navigate('/keranjang/checkout')}>
              {ctx.t('cart.checkout')}
            </Button>
          </footer>
        </>
      )}
    </section>
  );
}

function Checkout({ ctx }: Props) {
  const navigate = useNavigate();
  const items = useSyncExternalStore(subscribe, getSnapshot);
  const { qty, total } = useMemo(() => cartSummary(items), [items]);
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function placeOrder() {
    if (items.length === 0 || busy) return;
    setBusy(true);
    setError('');

    try {
      /* Autentikasi milik shell: remote tidak punya halaman login sendiri. */
      const token = await ctx.getToken();
      if (!token) {
        ctx.toast(ctx.t('cart.loginFirst'), 'error');
        ctx.navigate('/masuk?next=%2Fkeranjang%2Fcheckout');
        return;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items.map(({ id, qty: count }) => ({ id, qty: count }))
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        order?: unknown;
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);

      const parsed = orderSchema.parse(data.order);
      setOrder(parsed);
      clearCart();
      emitCheckoutCompleted({ orderId: parsed.id, total: parsed.total });
      ctx.toast(ctx.t('cart.success', { id: parsed.id }), 'success');
      ctx.telemetry.event('checkout_completed', { orderId: parsed.id, total: parsed.total });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Galat tidak dikenal';
      setError(ctx.t('cart.failed', { message }));
      ctx.telemetry.error(cause, { remote: 'cart', step: 'checkout' });
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <section className="ct-view">
        <Card
          title={ctx.t('cart.orderDone', { id: order.id })}
          footer={
            <Button variant="primary" onClick={() => navigate('/katalog')}>
              {ctx.t('cart.shopAgain')}
            </Button>
          }
        >
          <dl className="ct-summary">
            <div>
              <dt>Total</dt>
              <dd>{rupiah(order.total)}</dd>
            </div>
            <div>
              <dt>Item</dt>
              <dd>{order.items.reduce((sum, item) => sum + item.qty, 0)}</dd>
            </div>
            <div>
              <dt>Pemesan</dt>
              <dd>{order.user.name}</dd>
            </div>
            <div>
              <dt>Waktu</dt>
              <dd>{new Date(order.createdAt).toLocaleString('id-ID')}</dd>
            </div>
          </dl>
        </Card>
      </section>
    );
  }

  return (
    <section className="ct-view">
      <p className="ct-breadcrumb">
        <Link to="..">← {ctx.t('cart.title')}</Link>
      </p>
      <h1>{ctx.t('cart.checkout')}</h1>

      {items.length === 0 ? (
        <p className="ct-note">{ctx.t('cart.pick')}</p>
      ) : (
        <Card
          title={`${qty} item`}
          footer={
            <div className="ct-checkout-actions">
              <strong>{rupiah(total)}</strong>
              <Button variant="primary" loading={busy} onClick={placeOrder}>
                {busy ? ctx.t('cart.sending') : ctx.t('cart.checkout')}
              </Button>
            </div>
          }
        >
          <ul className="ct-mini">
            {items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.emoji ?? '📦'} {item.name} × {item.qty}
                </span>
                <strong>{rupiah(item.price * item.qty)}</strong>
              </li>
            ))}
          </ul>

          {ctx.user ? (
            <p className="ct-note">
              Pesanan akan dibuat untuk <strong>{ctx.user.name}</strong> (
              <Badge tone="success">{ctx.user.role}</Badge>).
            </p>
          ) : (
            <p className="ct-note">{ctx.t('cart.loginFirst')}</p>
          )}

          {error ? (
            <p className="ct-error" role="alert">
              {error}
            </p>
          ) : null}
        </Card>
      )}
    </section>
  );
}

/**
 * Remote keranjang.
 *
 * Isinya dibaca dari modul bersama yang sama dengan remote header — satu
 * sumber kebenaran untuk dua remote yang dibangun oleh tim berbeda.
 */
export default function Cart({ ctx }: Props) {
  const items = useSyncExternalStore(subscribe, getSnapshot);

  /* Reaksi terhadap event dari remote lain — tanpa impor kode remote produk. */
  useEffect(
    () =>
      onAddToCart((payload) => {
        ctx.telemetry.event('cart_saw_add_to_cart', {
          productId: payload.productId,
          qty: payload.qty
        });
      }),
    [ctx]
  );

  useEffect(() => {
    const { qty, total } = cartSummary(items);
    emitCartUpdated({ qty, total });
  }, [items]);

  return (
    <Routes>
      <Route index element={<CartList ctx={ctx} />} />
      <Route path="checkout" element={<Checkout ctx={ctx} />} />
      <Route
        path="*"
        element={
          <section className="ct-view">
            <p className="ct-note">Rute keranjang tidak dikenal.</p>
            <Link to=".">{ctx.t('cart.title')}</Link>
          </section>
        }
      />
    </Routes>
  );
}
