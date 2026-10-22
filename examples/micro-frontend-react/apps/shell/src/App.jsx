import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * Pabrik komponen lazy untuk satu remote.
 *
 * Fungsi ini dipanggil ulang saat pengguna menekan "Coba lagi": React.lazy
 * yang sudah gagal tidak pernah dicoba kembali, jadi satu-satunya cara
 * memuat ulang remote yang rusak adalah membuat komponen lazy yang baru.
 */
function remoteComponent(label, loader) {
  return lazy(() => {
    const started = performance.now();
    return loader().then((mod) => {
      console.info(
        `[shell] remote "${label}" siap dalam ${(performance.now() - started).toFixed(0)} ms`
      );
      return mod;
    });
  });
}

/* Peta rute → remote. Di produksi daftar ini datang dari build manifest. */
const ROUTES = {
  katalog: { label: 'Katalog', load: () => import('products/App') },
  keranjang: { label: 'Keranjang', load: () => import('cart/App') }
};
const HEADER = { label: 'Header', load: () => import('header/App') };

function readRoute() {
  const raw = location.hash.replace(/^#\/?/, '').split('/')[0];
  return raw || 'katalog';
}

function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  const [toasts, setToasts] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const viewRef = useRef(null);

  /* Kontrak ctx: satu-satunya cara remote meminta navigasi & notifikasi. */
  const ctx = useMemo(
    () => ({
      route,
      navigate: (to) => {
        location.hash = to;
      },
      toast: (message, type = 'info') => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((list) => [...list, { id, message, type }]);
        setTimeout(() => {
          setToasts((list) => list.filter((item) => item.id !== id));
        }, 2600);
      }
    }),
    [route]
  );

  useEffect(() => {
    viewRef.current?.focus({ preventScroll: true });
  }, [route, attempt]);

  const entry = ROUTES[route];

  /* Komponen lazy dibuat sekali — membuatnya di setiap render akan
     memaksa Suspense memuat ulang remote terus-menerus. */
  const Header = useMemo(() => remoteComponent(HEADER.label, HEADER.load), []);
  const Remote = useMemo(
    () => (entry ? remoteComponent(entry.label, entry.load) : null),
    [entry, attempt]
  );

  return (
    <>
      <ErrorBoundary
        name="header"
        fallback={
          <div className="hd-fallback">
            <a href="#/katalog">🛍️ TokoMicro</a>
          </div>
        }
      >
        <Suspense fallback={<div className="skeleton skeleton-hd" aria-hidden="true" />}>
          <Header ctx={ctx} />
        </Suspense>
      </ErrorBoundary>

      <main className="view" ref={viewRef} tabIndex={-1}>
        {!entry ? (
          <div className="notice-box" role="alert">
            <h2>Rute “{route}” tidak dikenal</h2>
            <p>Shell menampilkan halaman 404 tanpa membongkar remote mana pun.</p>
            <a className="btn btn-primary" href="#/katalog">
              Kembali ke katalog
            </a>
          </div>
        ) : (
          <ErrorBoundary
            name={entry.label}
            key={`${route}:${attempt}`}
            fallback={
              <div className="error-box" role="alert">
                <h2>Modul {entry.label} tidak dapat dimuat</h2>
                <p>
                  Kerusakan terisolasi di satu micro-frontend — shell dan modul
                  lain tetap berfungsi penuh.
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Coba lagi
                </button>
              </div>
            }
          >
            <Suspense fallback={<Skeleton />}>
              <Remote ctx={ctx} />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      <div className="toast-root" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast-${item.type}`}>
            {item.message}
          </div>
        ))}
      </div>
    </>
  );
}
