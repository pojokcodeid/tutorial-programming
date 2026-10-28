import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import type { AppContext, Order } from '@tokomicro/contracts';
import { orderSchema } from '@tokomicro/contracts';
import { Badge, Button, Card } from '@tokomicro/ui-kit';
import { rupiah } from '@tokomicro/shared';
import './account.css';

interface Props {
  ctx: AppContext;
}

function LoginFirst({ ctx }: Props) {
  return (
    <section className="ac-view">
      <h1>{ctx.t('account.title')}</h1>
      <div className="ac-empty">
        <p>{ctx.t('account.loginFirst')}</p>
        <Button variant="primary" onClick={() => ctx.navigate('/masuk?next=%2Fakun')}>
          {ctx.t('nav.login')}
        </Button>
      </div>
    </section>
  );
}

function Profile({ ctx }: Props) {
  const user = ctx.user;
  if (!user) return <LoginFirst ctx={ctx} />;

  return (
    <section className="ac-view">
      <h1>{ctx.t('account.profile')}</h1>
      <p className="ac-lead">
        Remote akun memakai <code>ctx.user</code> dari shell — tidak ada request login
        kedua dan tidak ada salinan sesi di remote ini.
      </p>

      <Card title={user.name}>
        <dl className="ac-list">
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>{ctx.t('account.role')}</dt>
            <dd>
              <Badge tone={user.role === 'admin' ? 'solid' : 'success'}>{user.role}</Badge>
            </dd>
          </div>
          <div>
            <dt>Bahasa</dt>
            <dd>{ctx.locale}</dd>
          </div>
          <div>
            <dt>Tema</dt>
            <dd>{ctx.theme}</dd>
          </div>
          <div>
            <dt>Feature flag</dt>
            <dd>{Object.keys(ctx.flags).filter((key) => ctx.flags[key]).join(', ') || '—'}</dd>
          </div>
        </dl>
      </Card>

      <p className="ac-links">
        <Link to="pesanan">{ctx.t('account.orders')} →</Link>
      </p>
    </section>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Card
      title={
        <span className="ac-order-head">
          {order.id}
          <Badge tone="success">{order.items.length} produk</Badge>
        </span>
      }
      footer={
        <span className="ac-order-foot">
          <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
          <strong>{rupiah(order.total)}</strong>
        </span>
      }
    >
      <ul className="ac-order-items">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>
              {item.emoji ?? '📦'} {item.name} × {item.qty}
            </span>
            <span>{rupiah(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Orders({ ctx }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ctx.user) return;
    const controller = new AbortController();

    (async () => {
      setStatus('loading');
      setError('');
      try {
        const token = await ctx.getToken();
        if (!token) throw new Error('Sesi tidak tersedia. Silakan masuk kembali.');

        const response = await fetch('/api/orders', {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as { orders?: unknown };
        const parsed = orderSchema.array().safeParse(data.orders);
        if (!parsed.success) throw new Error('Bentuk data pesanan tidak sesuai kontrak.');

        setOrders(parsed.data);
        setStatus('ready');
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Galat tidak dikenal');
        setStatus('error');
        ctx.telemetry.error(cause, { remote: 'account', endpoint: '/api/orders' });
      }
    })();

    return () => controller.abort();
  }, [ctx, reloadKey]);

  if (!ctx.user) return <LoginFirst ctx={ctx} />;

  return (
    <section className="ac-view">
      <h1>{ctx.t('account.orders')}</h1>
      <p className="ac-lead">
        Daftar ini diambil langsung oleh remote akun dengan token dari shell.
      </p>

      {status === 'loading' ? <p className="ac-note">{ctx.t('common.loading')}</p> : null}

      {status === 'error' ? (
        <div className="ac-error" role="alert">
          <p>{error}</p>
          <Button variant="primary" onClick={() => setReloadKey((value) => value + 1)}>
            {ctx.t('common.retry')}
          </Button>
        </div>
      ) : null}

      {status === 'ready' && orders.length === 0 ? (
        <p className="ac-note">{ctx.t('account.noOrders')}</p>
      ) : null}

      {status === 'ready' && orders.length > 0 ? (
        <ul className="ac-orders">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      ) : null}

      <p className="ac-links">
        <Link to="..">← {ctx.t('account.profile')}</Link>
      </p>
    </section>
  );
}

function Admin({ ctx }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setStatus('loading');
      setError('');
      try {
        const token = await ctx.getToken();
        if (!token) throw new Error('Sesi tidak tersedia. Silakan masuk kembali.');

        const response = await fetch('/api/orders?scope=all', {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` }
        });

        /* Server tetap memeriksa peran; guard klien hanya untuk pengalaman pengguna. */
        if (response.status === 403) {
          setStatus('denied');
          return;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as { orders?: unknown };
        const parsed = orderSchema.array().safeParse(data.orders);
        if (!parsed.success) throw new Error('Bentuk data pesanan tidak sesuai kontrak.');

        setOrders(parsed.data);
        setStatus('ready');
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Galat tidak dikenal');
        setStatus('error');
        ctx.telemetry.error(cause, { remote: 'account', endpoint: '/api/orders?scope=all' });
      }
    })();

    return () => controller.abort();
  }, [ctx, reloadKey]);

  return (
    <section className="ac-view">
      <h1>Semua pesanan (admin)</h1>
      <p className="ac-lead">
        Endpoint <code>/api/orders?scope=all</code> menolak customer dengan <b>403</b>,
        meskipun permintaan dikirim langsung lewat curl.
      </p>

      {status === 'loading' ? <p className="ac-note">{ctx.t('common.loading')}</p> : null}

      {status === 'denied' ? (
        <div className="ac-error" role="alert">
          <p>Akses ditolak: halaman ini hanya untuk admin.</p>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="ac-error" role="alert">
          <p>{error}</p>
          <Button variant="primary" onClick={() => setReloadKey((value) => value + 1)}>
            {ctx.t('common.retry')}
          </Button>
        </div>
      ) : null}

      {status === 'ready' && orders.length === 0 ? (
        <p className="ac-note">Belum ada pesanan.</p>
      ) : null}

      {status === 'ready' && orders.length > 0 ? (
        <ul className="ac-orders">
          {orders.map((order) => (
            <li key={order.id}>
              <p className="ac-note">
                Pemilik: <strong>{order.user.username}</strong> ({order.user.role})
              </p>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      ) : null}

      <p className="ac-links">
        <Link to="..">← {ctx.t('account.profile')}</Link>
      </p>
    </section>
  );
}

/**
 * Remote akun.
 *
 * Tidak menyimpan token sendiri. Setiap request meminta token segar lewat
 * `ctx.getToken()`, sehingga refresh dan logout tetap dipegang shell.
 */
export default function Account({ ctx }: Props) {
  return (
    <section className="ac-shell">
      <nav className="ac-tabs" aria-label="Navigasi akun">
        <NavLink to="." end className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
          {ctx.t('account.profile')}
        </NavLink>
        <NavLink
          to="pesanan"
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
        >
          {ctx.t('account.orders')}
        </NavLink>
        {ctx.user?.role === 'admin' ? (
          <NavLink
            to="admin"
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          >
            Admin
          </NavLink>
        ) : null}
      </nav>

      <Routes>
        <Route index element={<Profile ctx={ctx} />} />
        <Route path="pesanan" element={<Orders ctx={ctx} />} />
        <Route path="admin" element={<Admin ctx={ctx} />} />
        <Route
          path="*"
          element={
            <section className="ac-view">
              <p className="ac-note">Rute akun tidak dikenal.</p>
              <Link to=".">{ctx.t('account.profile')}</Link>
            </section>
          }
        />
      </Routes>
    </section>
  );
}
