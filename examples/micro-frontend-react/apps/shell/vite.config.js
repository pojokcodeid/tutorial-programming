import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

/**
 * URL remote diambil dari environment variable supaya alamatnya bisa berubah
 * antar staging/produksi tanpa mengubah kode. Nilai bawaan = contoh lokal:
 * tiap remote dilayani pada port sendiri, persis seperti deployment terpisah.
 */
const remoteUrl = (name, port) =>
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
        cart: remoteUrl('cart', 4176)
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' }
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: false
  }
});
