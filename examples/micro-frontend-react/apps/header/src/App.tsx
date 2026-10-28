import { useSyncExternalStore } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { AppContext } from '@tokomicro/contracts';
import { Badge, Button } from '@tokomicro/ui-kit';
import { cartSummary, getSnapshot, subscribe } from '@tokomicro/shared';
import './header.css';

interface Props {
  ctx: AppContext;
}

/**
 * Remote header (chrome aplikasi).
 *
 * - Badge keranjang dibaca dari modul bersama lewat useSyncExternalStore,
 *   sehingga selalu sinkron dengan remote produk & keranjang.
 * - Navigasi memakai react-router: shell pemilik BrowserRouter, remote hanya
 *   merender tautan. Saat berdiri sendiri, remote memakai MemoryRouter.
 */
export default function Header({ ctx }: Props) {
  const items = useSyncExternalStore(subscribe, getSnapshot);
  const { qty } = cartSummary(items);

  const links: Array<{ to: string; label: string }> = [
    { to: '/katalog', label: ctx.t('nav.catalog') },
    { to: '/keranjang', label: ctx.t('nav.cart') },
    { to: '/akun', label: ctx.t('nav.account') }
  ];

  return (
    <header className="hd">
      <div className="hd-inner">
        <Link className="hd-brand" to="/katalog">
          🛍️ TokoMicro
        </Link>

        <nav className="hd-nav" aria-label="Navigasi utama">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {link.label}
              {link.to === '/keranjang' && qty > 0 ? (
                <Badge tone="solid" label={`${qty} item di keranjang`}>
                  {qty}
                </Badge>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="hd-tools">
          <button
            type="button"
            className="hd-icon"
            onClick={ctx.toggleTheme}
            aria-label={ctx.theme === 'light' ? 'Aktifkan tema gelap' : 'Aktifkan tema terang'}
            title={ctx.theme === 'light' ? 'Tema gelap' : 'Tema terang'}
          >
            {ctx.theme === 'light' ? '🌙' : '☀️'}
          </button>

          <select
            className="hd-locale"
            value={ctx.locale}
            onChange={(event) => ctx.setLocale(event.target.value === 'en' ? 'en' : 'id')}
            aria-label="Bahasa"
          >
            <option value="id">ID</option>
            <option value="en">EN</option>
          </select>

          {ctx.user ? (
            <div className="hd-user">
              <span className="hd-user__name">
                {ctx.t('header.hello', { name: ctx.user.name })}
              </span>
              <Button size="sm" variant="ghost" onClick={ctx.logout}>
                {ctx.t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={() => ctx.navigate('/masuk')}>
              {ctx.t('nav.login')}
            </Button>
          )}
        </div>
      </div>

      <div className="hd-sub">
        <Link to="/status">{ctx.t('nav.status')}</Link>
        <Link to="/katalog-lama">{ctx.t('nav.legacy')}</Link>
      </div>
    </header>
  );
}
