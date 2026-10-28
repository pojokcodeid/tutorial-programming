import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * URL remote diambil dari environment variable supaya alamatnya bisa berubah
 * antar staging/produksi tanpa mengubah kode. Nilai bawaan = contoh lokal.
 *
 * Saat runtime, shell juga membaca manifest dari `/api/remotes`. Manifest
 * memungkinkan rilis per remote dan rollback tanpa build ulang shell.
 */
const remoteUrl = (name: string, port: number) =>
  process.env[`${name.toUpperCase()}_REMOTE`] ??
  `http://localhost:${port}/assets/remoteEntry.js`;

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        header: remoteUrl('header', 4174),
        products: remoteUrl('products', 4175),
        cart: remoteUrl('cart', 4176),
        account: remoteUrl('account', 4177)
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' }
      } as any
    }),
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'dist/bundle-report.html',
            gzipSize: true,
            template: 'treemap'
          })
        ]
      : [])
  ],
  server: { port: 4173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    target: 'esnext',
    minify: false,
    sourcemap: true
  }
});
