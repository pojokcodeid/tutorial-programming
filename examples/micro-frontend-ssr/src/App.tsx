import { useEffect, useState } from 'react';
import type { AppProps, Mode, Product, ServerTiming } from './types';

type LoadState = 'loading' | 'ready' | 'error';

interface ClientMetrics {
  firstPaintMs: number | null;
  hydrationMs: number | null;
  initialHtmlBytes: number | null;
  initialHtmlPreview: string;
}

function formatRupiah(value: number): string {
  return `Rp ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function formatMs(value?: number): string {
  if (value == null) return '—';
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ms`;
}

function formatBytes(value?: number | null): string {
  if (value == null) return '—';
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <div className="card__top">
        <span className="card__emoji" aria-hidden="true">
          {product.emoji}
        </span>
        <span className="badge">{product.category}</span>
      </div>
      <h3>{product.name}</h3>
      <p className="card__description">{product.description}</p>
      <div className="card__bottom">
        <strong>{formatRupiah(product.price)}</strong>
        <span className={product.stock > 0 ? 'stock' : 'stock stock--out'}>
          {product.stock > 0 ? `Stok ${product.stock}` : 'Habis'}
        </span>
      </div>
    </article>
  );
}

function HydrationProbe() {
  // Sengaja berbeda antara server dan client. Hanya dipakai saat ?mismatch=1.
  const side = typeof window === 'undefined' ? 'SERVER' : 'CLIENT';

  return (
    <div className="probe" role="note">
      <strong>Uji mismatch aktif.</strong> Nilai ini dirender oleh{' '}
      <code data-side={side}>{side}</code>. Server menulis <code>SERVER</code>,
      browser menulis <code>CLIENT</code>, sehingga React harus memperbaiki DOM
      saat hydration.
    </div>
  );
}

interface ComparisonProps {
  mode: Mode;
  timing?: ServerTiming;
  metrics: ClientMetrics | null;
  hydrationErrors: string[];
  catalogReadyMs: number | null;
}

function Comparison({
  mode,
  timing,
  metrics,
  hydrationErrors,
  catalogReadyMs,
}: ComparisonProps) {
  const isSSR = mode === 'ssr';

  return (
    <section className="panel" aria-labelledby="perbandingan-title">
      <div className="panel__head">
        <div>
          <p className="eyebrow">Perbandingan langsung</p>
          <h2 id="perbandingan-title">Apa yang terjadi di halaman ini?</h2>
        </div>
        <span className={isSSR ? 'pill pill--ssr' : 'pill pill--csr'}>
          {isSSR ? 'SSR' : 'CSR'}
        </span>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>HTML awal</span>
          <strong>{isSSR ? 'Ada — dikirim server' : 'Tidak — root kosong'}</strong>
          <small>
            {isSSR
              ? `${formatBytes(timing?.htmlBytes)} HTML produk`
              : 'HTML awal hanya berisi <div id="root">'}
          </small>
        </div>
        <div className="metric">
          <span>First paint (FCP)</span>
          <strong>
            {metrics?.firstPaintMs != null
              ? `${Math.round(metrics.firstPaintMs)} ms`
              : 'mengukur…'}
          </strong>
          <small>FCP dari Performance API browser</small>
        </div>
        <div className="metric">
          <span>Hydration</span>
          <strong>
            {isSSR
              ? metrics?.hydrationMs != null
                ? `Ya — ${Math.round(metrics.hydrationMs)} ms`
                : 'mengukur…'
              : 'Tidak — createRoot'}
          </strong>
          <small>
            {isSSR
              ? 'React memakai HTML server; waktu ≈ frame pertama'
              : 'React membangun DOM dari nol'}
          </small>
        </div>
        <div className="metric">
          <span>Hydration mismatch</span>
          <strong className={hydrationErrors.length > 0 ? 'text-bad' : 'text-good'}>
            {hydrationErrors.length > 0
              ? `${hydrationErrors.length} peringatan`
              : 'Tidak terdeteksi'}
          </strong>
          <small>
            {hydrationErrors.length > 0
              ? 'Lihat detail di panel diagnosis'
              : isSSR
                ? 'HTML server cocok dengan render client'
                : 'Tidak ada hydration di mode CSR'}
          </small>
        </div>
      </div>

      <table className="compare">
        <thead>
          <tr>
            <th>Aspek</th>
            <th>SSR</th>
            <th>CSR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTML pertama</td>
            <td>Berisi katalog</td>
            <td>Kosong</td>
          </tr>
          <tr>
            <td>Data produk</td>
            <td>Diambil saat request</td>
            <td>Di-fetch setelah JS</td>
          </tr>
          <tr>
            <td>Waktu interaktif</td>
            <td>Setelah hydration</td>
            <td>Setelah bundle dieksekusi</td>
          </tr>
          <tr>
            <td>Beban server</td>
            <td>Render per request</td>
            <td>Hanya file statis</td>
          </tr>
        </tbody>
      </table>

      <p className="hint hint--note">
        Catatan: first paint SSR bisa lebih lambat karena server menunggu API.
        Bedanya, paint SSR sudah berisi katalog, sedangkan paint CSR masih
        skeleton kosong. Lihat baris “katalog” di bawah.
      </p>

      <p className="timing-line">
        <span>{isSSR ? 'Server timing' : 'CSR timing'}</span>
        <span>
          fetch data <strong>{isSSR ? formatMs(timing?.dataMs) : 'setelah mount'}</strong>
        </span>
        <span>
          render <strong>{isSSR ? formatMs(timing?.renderMs) : 'di browser'}</strong>
        </span>
        <span>
          katalog{' '}
          <strong>
            {isSSR
              ? 'sejak HTML pertama'
              : catalogReadyMs != null
                ? `${Math.round(catalogReadyMs)} ms`
                : 'menunggu…'}
          </strong>
        </span>
        <span>
          total server{' '}
          <strong>{isSSR ? formatMs(timing?.totalMs) : 'file statis'}</strong>
        </span>
      </p>
    </section>
  );
}

interface DiagnosticsProps {
  mode: Mode;
  mismatch: boolean;
  hydrationErrors: string[];
  metrics: ClientMetrics | null;
}

function Diagnostics({ mode, mismatch, hydrationErrors, metrics }: DiagnosticsProps) {
  const isSSR = mode === 'ssr';
  const hasErrors = hydrationErrors.length > 0;

  return (
    <section className="panel diagnostics" aria-labelledby="diagnostics-title">
      <div className="panel__head">
        <div>
          <p className="eyebrow">Panel diagnosis</p>
          <h2 id="diagnostics-title">HTML awal &amp; hydration</h2>
        </div>
        <span className="pill pill--muted">{mode.toUpperCase()}</span>
      </div>

      <div className={hasErrors ? 'alert alert--bad' : 'alert alert--good'}>
        {hasErrors ? (
          <>
            <strong>⚠ Hydration mismatch terdeteksi ({hydrationErrors.length}).</strong>
            <p>
              React menemukan HTML server berbeda dari hasil render client. Di
              production, React membuang bagian DOM yang tidak cocok lalu
              merender ulang bagian tersebut.
            </p>
            <ul>
              {hydrationErrors.map((error, index) => (
                <li key={`${index}-${error.slice(0, 24)}`}>
                  <code>{error}</code>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <strong>✓ Tidak ada peringatan hydration mismatch.</strong>
            <p>
              {isSSR
                ? 'HTML server dan render client cocok. React bisa melanjutkan dengan hydration.'
                : 'Mode CSR tidak melakukan hydration, jadi mismatch tidak mungkin terjadi. React memakai createRoot.'}
            </p>
          </>
        )}
      </div>

      {mismatch && isSSR && (
        <p className="hint">
          Uji mismatch sedang aktif. Buka Console browser untuk melihat
          peringatan asli dari React. Matikan lewat tombol di atas.
        </p>
      )}

      <div className="html-preview">
        <div className="html-preview__head">
          <span>HTML di #root sebelum hydration</span>
          <span>{formatBytes(metrics?.initialHtmlBytes)}</span>
        </div>
        <pre>
          {metrics?.initialHtmlPreview ||
            (isSSR
              ? 'Menunggu pengukuran di browser…'
              : '<div id="root"></div>  ← kosong')}
        </pre>
      </div>

      <p className="hint">
        First paint dan hydration diukur di browser. Nilai server (fetch/render)
        dikirim lewat <code>window.__INITIAL_DATA__.timing</code>. Di build
        production, pesan mismatch dari React diminifikasi; jalankan{' '}
        <code>npm run dev</code> untuk pesan yang lebih terbaca.
      </p>
    </section>
  );
}

export default function App({
  mode,
  products: initialProducts,
  mismatch = false,
  serverTiming,
}: AppProps) {
  const [products, setProducts] = useState<Product[] | null>(initialProducts ?? null);
  const [loadState, setLoadState] = useState<LoadState>(
    initialProducts ? 'ready' : 'loading'
  );
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [hydrationErrors, setHydrationErrors] = useState<string[]>([]);
  const [fullTiming, setFullTiming] = useState<ServerTiming | null>(null);
  const [catalogReadyMs, setCatalogReadyMs] = useState<number | null>(null);

  useEffect(() => {
    if (initialProducts) return;

    let cancelled = false;
    setLoadState('loading');

    fetch('/api/products')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return (await response.json()) as { products: Product[] };
      })
      .then((payload) => {
        if (cancelled) return;
        setProducts(payload.products);
        setLoadState('ready');
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
        setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [initialProducts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readMetrics = () => {
      const meta = window.__HYDRATION_META__;
      const paint = performance.getEntriesByName('first-contentful-paint')[0];

      setMetrics({
        firstPaintMs: paint?.startTime ?? performance.now(),
        hydrationMs:
          meta?.hydratedAt != null ? Math.max(0, meta.hydratedAt - meta.bootAt) : null,
        initialHtmlBytes: meta?.initialHtmlBytes ?? null,
        initialHtmlPreview: meta?.initialHtmlPreview ?? '',
      });
    };

    readMetrics();
    const timeout = window.setTimeout(readMetrics, 250);
    window.addEventListener('app-hydrated', readMetrics);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('app-hydrated', readMetrics);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncErrors = () => {
      const next = [...(window.__HYDRATION_ERRORS__ ?? [])];
      setHydrationErrors((current) =>
        current.length === next.length &&
        current.every((value, index) => value === next[index])
          ? current
          : next
      );
    };

    syncErrors();
    const interval = window.setInterval(syncErrors, 100);
    const stop = window.setTimeout(() => window.clearInterval(interval), 3000);
    window.addEventListener('hydration-error', syncErrors);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
      window.removeEventListener('hydration-error', syncErrors);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__INITIAL_DATA__?.timing) {
      setFullTiming(window.__INITIAL_DATA__.timing);
    }
  }, []);

  useEffect(() => {
    if (loadState !== 'ready' || catalogReadyMs != null) return;
    setCatalogReadyMs(performance.now());
  }, [loadState, catalogReadyMs]);

  const timing = fullTiming ?? serverTiming;
  const isSSR = mode === 'ssr';
  const basePath = isSSR ? '/ssr' : '/csr';
  const mismatchHref = `${basePath}?mismatch=${mismatch ? '0' : '1'}`;

  return (
    <div className="app" data-mode={mode}>
      <header className="topbar">
        <a className="brand" href="/ssr">
          <span className="brand__mark" aria-hidden="true">
            ◇
          </span>
          <span>SSR Lab</span>
        </a>
        <nav className="switch" aria-label="Pilih mode render">
          <a
            className={isSSR ? 'switch__item is-active' : 'switch__item'}
            href="/ssr"
            aria-current={isSSR ? 'page' : undefined}
          >
            SSR
          </a>
          <a
            className={!isSSR ? 'switch__item is-active' : 'switch__item'}
            href="/csr"
            aria-current={!isSSR ? 'page' : undefined}
          >
            CSR
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">Lab micro-frontend · React 18 + Vite + Express</p>
            <h1>Katalog produk, dua cara render.</h1>
            <p className="lede">
              Bandingkan halaman yang dikirim sebagai HTML utuh (SSR) dengan
              halaman kosong yang dirakit di browser (CSR). Perhatikan kapan
              katalog muncul, berapa lama first paint, dan bagaimana React
              melakukan hydration.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="/ssr">
                Lihat SSR
              </a>
              <a className="button" href="/csr">
                Lihat CSR
              </a>
              <a className="button button--ghost" href={mismatchHref}>
                {mismatch ? 'Matikan uji mismatch' : 'Uji hydration mismatch'}
              </a>
            </div>
          </div>
          <div className="hero__note">
            <span className="hero__note-label">Mode sekarang</span>
            <strong>{isSSR ? 'Server-Side Rendering' : 'Client-Side Rendering'}</strong>
            <p>
              {isSSR
                ? 'HTML katalog sudah ada di response pertama. Bundle client datang setelahnya untuk hydration.'
                : 'Response pertama hanya shell kosong. Katalog baru muncul setelah bundle client dieksekusi dan API dipanggil.'}
            </p>
          </div>
        </section>

        <Comparison
          mode={mode}
          timing={timing}
          metrics={metrics}
          hydrationErrors={hydrationErrors}
          catalogReadyMs={catalogReadyMs}
        />

        {mismatch && <HydrationProbe />}

        <section className="catalog" aria-labelledby="katalog-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">/api/products</p>
              <h2 id="katalog-title">Katalog</h2>
            </div>
            <span className="section-meta">
              {products ? `${products.length} produk` : 'menunggu data'}
            </span>
          </div>

          {loadState === 'loading' && (
            <>
              <p className="hint">
                Mode CSR: HTML awal kosong. JavaScript sedang mengambil data dari{' '}
                <code>/api/products</code>.
              </p>
              <div className="grid" aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <div className="card card--skeleton" key={item}>
                    <div className="skeleton-line skeleton-line--short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-line--medium" />
                  </div>
                ))}
              </div>
            </>
          )}

          {loadState === 'error' && (
            <div className="alert alert--bad">
              <strong>Gagal memuat /api/products.</strong>
              <p>{error}</p>
            </div>
          )}

          {loadState === 'ready' && products && (
            <div className="grid">
              {products.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          )}
        </section>

        <Diagnostics
          mode={mode}
          mismatch={mismatch}
          hydrationErrors={hydrationErrors}
          metrics={metrics}
        />
      </main>

      <footer className="footer">
        <span>Lab SSR + hydration · bukan integrasi SSR ke Module Federation</span>
        <span>
          <a href="/ssr?mismatch=1">Demo mismatch</a> · <a href="/api/products">API</a>
        </span>
      </footer>
    </div>
  );
}
