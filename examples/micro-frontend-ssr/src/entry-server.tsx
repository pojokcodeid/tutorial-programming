import { renderToString } from 'react-dom/server';
import App from './App';
import type { AppProps } from './types';

/**
 * Entry SSR murni: tidak ada Express di sini supaya bisa diuji tanpa server.
 * server.mjs mengimpor fungsi ini lewat Vite (dev) atau hasil build (produksi).
 */
export function render(props: AppProps): string {
  return renderToString(<App {...props} />);
}

export default render;
