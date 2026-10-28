import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import '@tokomicro/ui-kit/tokens.css';
import { createTranslator } from '@tokomicro/i18n';
import { createTelemetry } from '@tokomicro/telemetry';
import type { AppContext } from '@tokomicro/contracts';
import App from './App';
import './header.css';

/**
 * Mode mandiri remote header.
 *
 * Shell asli menyediakan BrowserRouter. Di sini MemoryRouter dipakai supaya
 * remote tetap bisa dibuka dan diuji tanpa shell, tanpa menabrak URL host.
 */
const ctx: AppContext = {
  route: 'katalog',
  params: new URLSearchParams(),
  href: (path) => path,
  navigate: (path) => {
    console.info('[header:mandiri] navigasi ke', path);
  },
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
  telemetry: createTelemetry({ app: 'header', enabled: false }),
  theme: 'light',
  toggleTheme: () => undefined
};

createRoot(document.getElementById('remote-root')!).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={['/katalog']}>
      <App ctx={ctx} />
    </MemoryRouter>
  </React.StrictMode>
);
