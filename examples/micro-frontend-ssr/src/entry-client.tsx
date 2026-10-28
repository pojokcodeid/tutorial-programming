import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import type { AppProps } from './types';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemen #root tidak ditemukan di index.html');
}

const initialData = window.__INITIAL_DATA__;
const params = new URLSearchParams(window.location.search);
const mode = window.location.pathname.startsWith('/csr') ? 'csr' : 'ssr';
const props: AppProps = initialData?.props ?? {
  mode,
  mismatch: params.get('mismatch') === '1',
};

const initialHtml = rootElement.innerHTML;
const bootAt = performance.now();
const hydrationErrors: string[] = [];

window.__HYDRATION_ERRORS__ = hydrationErrors;
window.__HYDRATION_META__ = {
  bootAt,
  hydratedAt: null,
  initialHtml,
  initialHtmlBytes: new TextEncoder().encode(initialHtml).length,
  initialHtmlPreview: initialHtml,
};

function recordHydrationError(message: string) {
  const clean = message.trim();
  if (!clean || hydrationErrors.includes(clean)) return;

  hydrationErrors.push(clean);
  window.dispatchEvent(new Event('hydration-error'));
}

// React 18 memanggil onRecoverableError untuk mismatch. Di mode dev, React juga
// mencetak peringatan detail lewat console.error; kita tangkap supaya bisa
// ditampilkan di panel diagnosis tanpa harus membuka DevTools.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args
    .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
    .join(' ');

  if (/hydrat|did not match|server rendered|client/i.test(message)) {
    recordHydrationError(message.slice(0, 500));
  }

  originalConsoleError.apply(console, args);
};

const onRecoverableError = (error: unknown) => {
  recordHydrationError(error instanceof Error ? error.message : String(error));
};

if (initialData) {
  hydrateRoot(rootElement, <App {...props} />, { onRecoverableError });
} else {
  createRoot(rootElement).render(<App {...props} />);
}

// hydratedAt diukur setelah frame pertama; App membaca nilai ini lewat
// window.__HYDRATION_META__ dan event app-hydrated.
requestAnimationFrame(() => {
  if (window.__HYDRATION_META__) {
    window.__HYDRATION_META__.hydratedAt = performance.now();
  }
  window.dispatchEvent(new Event('app-hydrated'));
});
