import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode
} from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';
import type {
  AppContext,
  Locale,
  RemoteManifest,
  RemoteName,
  ToastType,
  User
} from '@tokomicro/contracts';
import { createTranslator, detectLocale } from '@tokomicro/i18n';
import { createTelemetry } from '@tokomicro/telemetry';
import { Button, useTheme } from '@tokomicro/ui-kit';
import ErrorBoundary from './ErrorBoundary';
import { LoginView } from './LoginView';
import { StatusView } from './StatusView';
import { LegacyView } from './LegacyView';
import { createRemoteComponent, type RemoteLoadInfo } from './remoteLoader';
import { createDefaultManifest, fetchFlags, fetchManifest } from './manifest';
import {
  isTokenFresh,
  loginRequest,
  logoutRequest,
  refreshSession,
  type Session
} from './auth';

const DEFAULT_FLAGS: Record<string, boolean> = {
  newCheckout: true,
  accountRemote: true,
  legacyCatalog: true
};

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function RemoteError({
  label,
  onRetry
}: {
  label: string;
  onRetry: () => void;
}) {
  return (
    <div className="error-box" role="alert">
      <h2>Modul {label} tidak dapat dimuat</h2>
      <p>
        Kerusakan terisolasi di satu micro-frontend — shell dan modul lain tetap
        berfungsi penuh.
      </p>
      <Button variant="primary" onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  );
}

interface RemoteSlotProps {
  name: RemoteName;
  label: string;
  ctx: AppContext;
  manifestRef: MutableRefObject<RemoteManifest | null>;
  attempt: number;
  onRetry: () => void;
  onLoaded: (info: RemoteLoadInfo) => void;
}

function RemoteSlot({
  name,
  label,
  ctx,
  manifestRef,
  attempt,
  onRetry,
  onLoaded
}: RemoteSlotProps) {
  const Remote = useMemo(
    () => createRemoteComponent(name, label, manifestRef, onLoaded),
    [name, label, manifestRef, onLoaded, attempt]
  );

  return (
    <ErrorBoundary
      name={name}
      key={`${name}:${attempt}`}
      onError={(error) => ctx.telemetry.error(error, { remote: name })}
      fallback={<RemoteError label={label} onRetry={onRetry} />}
    >
      <Suspense fallback={<Skeleton />}>
        <Remote ctx={ctx} />
      </Suspense>
    </ErrorBoundary>
  );
}

function ProtectedRoute({ ctx, children }: { ctx: AppContext; children: ReactNode }) {
  const location = useLocation();
  if (!ctx.user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/masuk?next=${next}`} replace />;
  }
  return <>{children}</>;
}

function RequireRole({
  ctx,
  role,
  whenPath,
  children
}: {
  ctx: AppContext;
  role: 'admin';
  whenPath?: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const active = !whenPath || pathname === whenPath;
  if (active && ctx.user?.role !== role) {
    return (
      <div className="notice-box" role="alert">
        <h2>Akses ditolak</h2>
        <p>Halaman ini hanya untuk akun dengan peran {role}. Guard klien ini bukan batas keamanan; server juga menolak permintaan tanpa peran yang sesuai.</p>
        <a className="btn btn-primary" href="/akun">
          Kembali ke profil
        </a>
      </div>
    );
  }
  return <>{children}</>;
}

function LegacyRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/katalog${search}`} replace />;
}

function NotFound({ route }: { route: string }) {
  return (
    <div className="notice-box" role="alert">
      <h2>Rute “{route}” tidak dikenal</h2>
      <p>Shell menampilkan halaman 404 tanpa membongkar remote mana pun.</p>
      <a className="btn btn-primary" href="/katalog">
        Kembali ke katalog
      </a>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const telemetry = useMemo(() => createTelemetry({ app: 'shell' }), []);

  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem('tokomicro.locale');
    return stored === 'en' || stored === 'id' ? stored : detectLocale();
  });
  const t = useMemo(() => createTranslator(locale), [locale]);

  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [manifest, setManifest] = useState<RemoteManifest | null>(null);
  const manifestRef = useRef<RemoteManifest | null>(null);
  const [flags, setFlags] = useState<Record<string, boolean>>(DEFAULT_FLAGS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [attempt, setAttempt] = useState(0);
  const viewRef = useRef<HTMLElement>(null);

  const applySession = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (isTokenFresh(current)) return current?.token ?? null;

    const next = await refreshSession();
    if (!next) {
      applySession(null);
      return null;
    }
    applySession(next);
    return next.token;
  }, [applySession]);

  const login = useCallback(
    async (username: string, password: string): Promise<User> => {
      const next = await loginRequest(username, password);
      applySession(next);
      telemetry.event('login', { role: next.user.role });
      return next.user;
    },
    [applySession, telemetry]
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    applySession(null);
    telemetry.event('logout');
    navigate('/katalog', { replace: true });
  }, [applySession, navigate, telemetry]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((list) => [...list, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem('tokomicro.locale', next);
    } catch {
      /* Mode privat bisa memblokir localStorage. */
    }
  }, []);

  const onRemoteLoaded = useCallback(
    (info: RemoteLoadInfo) => {
      telemetry.metric('remote_load_ms', info.ms, { remote: info.name });
    },
    [telemetry]
  );

  /* Boot: manifest, feature flags, dan pemulihan sesi lewat cookie httpOnly. */
  useEffect(() => {
    let alive = true;

    (async () => {
      const started = performance.now();
      const [manifestResult, flagsResult, sessionResult] = await Promise.allSettled([
        fetchManifest(),
        fetchFlags(),
        refreshSession()
      ]);

      if (!alive) return;

      const nextManifest =
        manifestResult.status === 'fulfilled' ? manifestResult.value : createDefaultManifest();
      manifestRef.current = nextManifest;
      setManifest(nextManifest);

      if (flagsResult.status === 'fulfilled') setFlags(flagsResult.value);
      if (sessionResult.status === 'fulfilled' && sessionResult.value) {
        applySession(sessionResult.value);
      }

      telemetry.metric('boot_ms', performance.now() - started);
    })();

    return () => {
      alive = false;
    };
  }, [applySession, telemetry]);

  /* Web Vitals: LCP, CLS, dan INP dikirim sebagai metrik, bukan sekadar log. */
  useEffect(() => {
    const report = (metric: Metric) => {
      telemetry.metric(metric.name, metric.value, {
        id: metric.id,
        rating: metric.rating
      });
    };
    onCLS(report);
    onINP(report);
    onLCP(report);
  }, [telemetry]);

  const route = location.pathname.split('/').filter(Boolean)[0] ?? 'katalog';
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const ctx = useMemo<AppContext>(
    () => ({
      route,
      params,
      href: (path) => (path.startsWith('/') ? path : `/${path}`),
      navigate: (path, options) => {
        navigate(path.startsWith('/') ? path : `/${path}`, options);
      },
      toast,
      user: session?.user ?? null,
      getToken: ensureToken,
      login,
      logout,
      locale,
      setLocale,
      t,
      flags,
      telemetry,
      theme,
      toggleTheme
    }),
    [
      route,
      params,
      toast,
      session,
      ensureToken,
      login,
      logout,
      locale,
      setLocale,
      t,
      flags,
      telemetry,
      theme,
      toggleTheme,
      navigate
    ]
  );

  useEffect(() => {
    viewRef.current?.focus({ preventScroll: true });
    telemetry.event('page_view', { path: location.pathname });
    document.title = `TokoMicro — ${route}`;
  }, [location.pathname, route, telemetry, attempt]);

  const Header = useMemo(
    () => createRemoteComponent('header', 'Header', manifestRef, onRemoteLoaded),
    [manifestRef, onRemoteLoaded]
  );

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (!manifest) {
    return (
      <div className="shell-boot">
        <div className="shell-boot__bar" />
        <Skeleton rows={4} />
        <p>Menyiapkan manifest dan sesi…</p>
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary
        name="header"
        onError={(error) => telemetry.error(error, { remote: 'header' })}
        fallback={
          <div className="hd-fallback">
            <a href="/katalog">🛍️ TokoMicro</a>
          </div>
        }
      >
        <Suspense fallback={<div className="skeleton skeleton-hd" aria-hidden="true" />}>
          <Header ctx={ctx} />
        </Suspense>
      </ErrorBoundary>

      <main className="view" ref={viewRef} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Navigate to="/katalog" replace />} />
          <Route
            path="/katalog/*"
            element={
              <RemoteSlot
                name="products"
                label="Katalog"
                ctx={ctx}
                manifestRef={manifestRef}
                attempt={attempt}
                onRetry={retry}
                onLoaded={onRemoteLoaded}
              />
            }
          />
          <Route
            path="/keranjang/*"
            element={
              <RemoteSlot
                name="cart"
                label="Keranjang"
                ctx={ctx}
                manifestRef={manifestRef}
                attempt={attempt}
                onRetry={retry}
                onLoaded={onRemoteLoaded}
              />
            }
          />
          <Route
            path="/akun/*"
            element={
              <ProtectedRoute ctx={ctx}>
                <RequireRole ctx={ctx} role="admin" whenPath="/akun/admin">
                  <RemoteSlot
                    name="account"
                    label="Akun"
                    ctx={ctx}
                    manifestRef={manifestRef}
                    attempt={attempt}
                    onRetry={retry}
                    onLoaded={onRemoteLoaded}
                  />
                </RequireRole>
              </ProtectedRoute>
            }
          />
          <Route path="/masuk" element={<LoginView ctx={ctx} />} />
          <Route path="/status" element={<StatusView manifest={manifest} ctx={ctx} />} />
          <Route
            path="/katalog-lama"
            element={
              ctx.flags.legacyCatalog ? (
                <LegacyView ctx={ctx} />
              ) : (
                <LegacyRedirect />
              )
            }
          />
          <Route path="*" element={<NotFound route={route} />} />
        </Routes>
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
