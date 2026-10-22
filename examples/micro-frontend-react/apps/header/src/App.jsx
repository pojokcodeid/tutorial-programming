import { useSyncExternalStore } from 'react';
import { cartSummary, getSnapshot, subscribe } from '@tokomicro/shared';
import './header.css';

/**
 * Remote header (chrome aplikasi).
 *
 * - Badge keranjang dibaca dari modul bersama lewat useSyncExternalStore,
 *   sehingga selalu sinkron dengan remote produk & keranjang.
 * - Navigasi memakai href="#/…" biasa: URL adalah media komunikasi
 *   paling sederhana antar remote (Tahap 4).
 */
export default function Header({ ctx }) {
  const items = useSyncExternalStore(subscribe, getSnapshot);
  const { qty } = cartSummary(items);

  const links = [
    ['katalog', 'Katalog'],
    ['keranjang', 'Keranjang']
  ];

  return (
    <header className="hd">
      <div className="hd-inner">
        <a className="hd-brand" href="#/katalog">
          🛍️ TokoMicro
        </a>
        <nav className="hd-nav" aria-label="Navigasi utama">
          {links.map(([key, label]) => (
            <a
              key={key}
              href={`#/${key}`}
              className={ctx.route === key ? 'is-active' : undefined}
            >
              {label}
              {key === 'keranjang' && qty > 0 && (
                <span className="hd-badge">{qty}</span>
              )}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
