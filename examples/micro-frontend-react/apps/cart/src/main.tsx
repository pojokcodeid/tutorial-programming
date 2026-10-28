import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import '@tokomicro/ui-kit/tokens.css';
import { createTranslator } from '@tokomicro/i18n';
import { createTelemetry } from '@tokomicro/telemetry';
import type { AppContext } from '@tokomicro/contracts';
import App from './App';
import './cart.css';

/* Mode mandiri: MemoryRouter supaya remote bisa diuji tanpa shell. */
const ctx: AppContext = {
  route: 'keranjang',
  params: new URLSearchParams(),
  href: (path) => path,
  navigate: (path) => console.info('[cart:mandiri] navigasi ke', path),
  toast: (message, type = 'info') => console.info(`[toast:${type}]`, message),
  user: null,
  getToken: async () => null,
  login: async () => {
    throw new Error('Login hanya tersedia di shell.');
  },
  logout: () => undefined,
  locale: 'id',
  setLocale: () => undefined,
  t: createTranslator('id'),
  flags: {},
  telemetry: createTelemetry({ app: 'cart', enabled: false }),
  theme: 'light',
  toggleTheme: () => undefined
};

createRoot(document.getElementById('remote-root')!).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={['/']}>
      <App ctx={ctx} />
    </MemoryRouter>
  </React.StrictMode>
);
