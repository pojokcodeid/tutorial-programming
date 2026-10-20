import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Saat pengembangan lokal (npm run dev), /api diteruskan ke tiga service Go
   di localhost. Di produksi (container) proxy yang sama ditangani nginx —
   lihat frontend/nginx.conf. Aplikasi React tidak pernah tahu perbedaannya. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Yang dihapus hanya awalan /api; sisa jalur (/products, /orders, ...)
      // diteruskan persis ke service tujuan — sama seperti nginx di produksi.
      '/api/products': { target: 'http://localhost:8081', rewrite: (p) => p.replace(/^\/api/, '') },
      '/api/orders': { target: 'http://localhost:8082', rewrite: (p) => p.replace(/^\/api/, '') },
      '/api/notifications': { target: 'http://localhost:8083', rewrite: (p) => p.replace(/^\/api/, '') }
    }
  }
});
