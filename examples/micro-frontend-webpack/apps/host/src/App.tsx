import * as React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Host tidak mengimpor berkas remote secara langsung. `import('remote/App')`
 * diterjemahkan ModuleFederationPlugin menjadi permintaan runtime ke
 * http://localhost:4182/remoteEntry.js.
 *
 * React.lazy membutuhkan module dengan export default — dan itulah kontrak
 * yang disediakan remote (`exposes: { './App': './src/App.tsx' }`).
 */
const RemoteApp = React.lazy(() => import('remote/App'));

const NAVIGATION = ['Beranda', 'Katalog', 'Tentang'];

export default function App() {
  return (
    <div className="host-shell">
      <header className="host-header">
        <a className="host-brand" href="/">
          <span className="host-brand__mark" aria-hidden="true">
            TM
          </span>
          <span className="host-brand__text">
            <strong>TokoMicro</strong>
            <small>Host · Webpack 5 Module Federation</small>
          </span>
        </a>

        <nav className="host-nav" aria-label="Navigasi utama">
          {NAVIGATION.map((item, index) => (
            <a key={item} className={index === 0 ? 'is-active' : undefined} href="#">
              {item}
            </a>
          ))}
        </nav>

        <span className="host-pill">host :4181</span>
      </header>

      <main className="host-main">
        <section className="host-hero">
          <p className="host-eyebrow">Micro-frontend · runtime composition</p>
          <h1>Host merakit halaman, remote mengirim komponen.</h1>
          <p className="host-lede">
            Header dan layout ini milik <code>apps/host</code>. Katalog di bawah
            dimuat dari <code>remote/App</code> di port 4182 lewat{' '}
            <code>React.lazy</code> + <code>Suspense</code>.
          </p>
          <div className="host-meta">
            <span>React {React.version}</span>
            <span>Webpack 5</span>
            <span>shared: singleton</span>
          </div>
        </section>

        <ErrorBoundary>
          <React.Suspense
            fallback={
              <div className="remote-loading" role="status">
                <span className="remote-loading__spinner" aria-hidden="true" />
                Memuat katalog dari remote :4182…
              </div>
            }
          >
            <RemoteApp />
          </React.Suspense>
        </ErrorBoundary>
      </main>

      <footer className="host-footer">
        <span>Lab Module Federation · React 18 + TypeScript</span>
        <span>
          Remote entry: <code>http://localhost:4182/remoteEntry.js</code>
        </span>
      </footer>
    </div>
  );
}
