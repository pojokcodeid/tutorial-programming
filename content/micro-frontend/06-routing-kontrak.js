/* ============================================================
   Pelajaran Micro-Frontend — Bab 6: Routing Bersarang dan Kontrak Remote
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-routing-kontrak',
  title: 'Routing Bersarang dan Kontrak Remote',
  chapter: 'Shell & Remote',
  duration: '18 menit',
  intro: [
    'Satu aplikasi micro-frontend tetap hanya boleh punya <b>satu pemilik URL</b>. Di TokoMicro React, pemilik itu adalah shell yang memasang <code>BrowserRouter</code>. Remote tidak membuat router sendiri; ia hanya menyediakan <code>Routes</code> bersarang yang dipasang shell pada rute seperti <code>/katalog/*</code>, <code>/keranjang/*</code>, dan <code>/akun/*</code>.',
    'Pembagian ini menjaga tombol kembali, refresh halaman, deep link, dan berbagi tautan tetap bekerja seperti aplikasi biasa. Pengguna melihat <code>http://localhost:4173/katalog/detail/kb-01</code>, bukan URL dengan tanda pagar yang aneh dan tidak bisa diindeks mesin pencari.',
    'Bab ini merapikan routing sekaligus menegaskan <b>kontrak</b> antara shell dan remote: objek <code>AppContext</code>, deklarasi tipe <code>declare module</code>, aturan 404, dan redirect. Setelah selesai, kamu bisa menambah halaman detail produk tanpa menyentuh router shell.'
  ],
  objectives: [
    'Menjelaskan mengapa hanya shell yang boleh memiliki BrowserRouter',
    'Memasang remote pada rute bersarang dengan pola /katalog/*, /keranjang/*, dan /akun/*',
    'Menggunakan seluruh field AppContext secara konsisten di dalam remote',
    'Menulis deklarasi TypeScript untuk modul federasi agar kontrak diperiksa saat typecheck',
    'Menambahkan rute detail, 404 remote, dan memverifikasi URL serta tombol kembali'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu URL, Satu Pemilik</h3><p>Pada arsitektur ini, shell memiliki tiga hal yang tidak boleh diduplikasi: <b>BrowserRouter</b>, <b>layout</b>, dan <b>sesi pengguna</b>. Remote cukup mengisi slot konten. Shell memetakan path ke remote, lalu remote memecah path sisanya menjadi halaman internalnya.</p><p>Perhatikan pola bintang: <code>/katalog/*</code> berarti shell menyerahkan seluruh path setelah <code>/katalog</code> kepada remote products. Remote lalu mencocokkan <code>index</code> untuk katalog, <code>detail/:id</code> untuk detail, dan <code>*</code> untuk halaman 404 miliknya sendiri.</p><p>Remote tetap bisa berdiri sendiri untuk pengembangan. Saat berdiri sendiri ia memakai <code>MemoryRouter</code>; saat berada di shell ia memakai router milik shell. Komponen <code>Routes</code>-nya sama, sehingga perilaku rute tidak bercabang.</p>'
    },
    {
      type: 'example',
      title: 'Peta rute shell dengan BrowserRouter',
      lang: 'jsx',
      output: false,
      code: `// apps/shell/src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from 'header/App';
import { AppProvider, useApp } from './AppContext';
import RemoteSlot from './RemoteSlot';
import NotFound from './NotFound';
const Products = lazy(() => import('products/App'));
const Cart = lazy(() => import('cart/App'));
const Account = lazy(() => import('account/App'));
function ShellRoutes() {
  const ctx = useApp();
  return (
    <>
      <Header ctx={ctx} />
      <main id="konten" tabIndex={-1}>
        <Suspense fallback={<p role="status">Memuat halaman…</p>}>
          <Routes>
            <Route path="/" element={<Navigate to="/katalog" replace />} />
            <Route path="/katalog/*" element={<RemoteSlot name="products"><Products ctx={ctx} /></RemoteSlot>} />
            <Route path="/keranjang/*" element={<RemoteSlot name="cart"><Cart ctx={ctx} /></RemoteSlot>} />
            <Route path="/akun/*" element={<RemoteSlot name="account"><Account ctx={ctx} /></RemoteSlot>} />
            <Route path="/masuk" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ShellRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}`,
      explain: [
        'Hanya shell yang memasang <code>BrowserRouter</code>. Remote tidak boleh membungkus dirinya dengan router lain karena dua router akan berebut URL dan konteks navigasi.',
        'Pola <code>/*</code> wajib agar shell tidak menelan path internal remote. Tanpa bintang, <code>/katalog/detail/kb-01</code> jatuh ke 404 shell.',
        'Redirect <code>/</code> ke <code>/katalog</code> adalah keputusan shell. Remote tidak perlu tahu bahwa halaman awal toko adalah katalog.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kontrak AppContext</h3><p><code>AppContext</code> adalah satu-satunya jembatan resmi dari shell ke remote. Ia sengaja kecil dan stabil. Remote tidak boleh mengimpor store internal shell, membaca <code>window.location</code> sendiri, atau memanggil API milik remote lain.</p><table class="vocab"><tr><th>Field</th><th>Arti</th></tr><tr><td><code>route</code></td><td>Pathname aktif, misalnya <code>/katalog/detail/kb-01</code>; dipakai untuk menandai menu aktif.</td></tr><tr><td><code>params</code></td><td><code>URLSearchParams</code> dari query string, misalnya <code>?q=kopi&amp;page=2</code>.</td></tr><tr><td><code>href(to)</code></td><td>Membentuk URL absolut yang benar untuk tautan biasa.</td></tr><tr><td><code>navigate(to, opts)</code></td><td>Meminta shell berpindah rute, termasuk opsi <code>replace</code>.</td></tr><tr><td><code>toast(msg, type)</code></td><td>Notifikasi global milik shell.</td></tr><tr><td><code>user</code></td><td>Pengguna aktif atau <code>null</code>.</td></tr><tr><td><code>getToken()</code></td><td>Token akses yang masih berlaku; diperbarui diam-diam bila perlu.</td></tr><tr><td><code>login()</code>, <code>logout()</code></td><td>Fungsi sesi yang hanya dimiliki shell.</td></tr><tr><td><code>locale</code>, <code>t()</code></td><td>Bahasa aktif dan penerjemah dari paket i18n.</td></tr><tr><td><code>flags</code></td><td>Feature flag dari <code>/api/flags</code>.</td></tr><tr><td><code>telemetry</code></td><td><code>event()</code>, <code>error()</code>, dan <code>metric()</code> untuk observability.</td></tr><tr><td><code>theme</code>, <code>toggleTheme()</code></td><td>Tema terang/gelap yang dibagikan ke semua remote.</td></tr></table><p>Menambah field berarti mengubah kontrak. Tulis di changelog, beri versi, dan jangan menghapus field lama tanpa masa transisi.</p>'
    },
    {
      type: 'example',
      title: 'Remote products memakai Routes bersarang',
      lang: 'jsx',
      output: false,
      code: `// apps/products/src/App.tsx
import { Route, Routes } from 'react-router-dom';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import RemoteNotFound from './pages/RemoteNotFound';
export default function ProductsApp({ ctx }) {
  return (
    <Routes>
      <Route index element={<Catalog ctx={ctx} />} />
      <Route path="detail/:id" element={<ProductDetail ctx={ctx} />} />
      <Route path="*" element={<RemoteNotFound ctx={ctx} />} />
    </Routes>
  );
}
// apps/products/src/main.tsx
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import type { AppContext } from '@tokomicro/contracts';
import App from './App';
const ctx: AppContext = {
  route: 'katalog', params: new URLSearchParams(),
  href: (path) => path, navigate: (path) => console.info(path),
  toast: () => undefined, user: null, getToken: async () => null,
  login: async () => { throw new Error('Login hanya di shell'); },
  logout: () => undefined, locale: 'id', setLocale: () => undefined,
  t: (key) => key, flags: {}, theme: 'light', toggleTheme: () => undefined,
  telemetry: { event: () => undefined, error: () => undefined, metric: () => undefined }
};
createRoot(document.getElementById('remote-root')!).render(
  <MemoryRouter initialEntries={['/']}>
    <App ctx={ctx} />
  </MemoryRouter>
);`,
      explain: [
        'Saat di shell, <code>Routes</code> ini otomatis relatif terhadap <code>/katalog</code>. Saat mandiri, <code>MemoryRouter</code> memberi konteks rute tanpa mengubah URL browser.',
        '<code>index</code> menangani <code>/katalog</code>; <code>detail/:id</code> menangani <code>/katalog/detail/kb-01</code>.',
        'Wildcard <code>*</code> di dalam remote membuat 404 katalog tetap berada di dalam layout katalog, bukan menjatuhkan seluruh shell.'
      ]
    },
    {
      type: 'example',
      title: 'Deklarasi tipe modul federasi',
      lang: 'ts',
      output: false,
      code: `// packages/contracts/src/index.ts
export type Role = 'customer' | 'admin';
export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}
export interface AppContext {
  route: string;
  params: URLSearchParams;
  href: (to: string) => string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  toast: (message: string, type?: 'info' | 'success' | 'error') => void;
  user: AppUser | null;
  getToken: () => Promise<string | null>;
  login: (username: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  locale: 'id' | 'en';
  t: (key: string, vars?: Record<string, string | number>) => string;
  flags: Record<string, boolean>;
  telemetry: {
    event: (name: string, data?: Record<string, unknown>) => void;
    error: (error: unknown, meta?: Record<string, unknown>) => void;
    metric: (name: string, value: number, meta?: Record<string, unknown>) => void;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
// apps/shell/src/remotes.d.ts
type RemoteApp = import('react').ComponentType<{
  ctx: import('@tokomicro/contracts').AppContext;
}>;
declare module 'header/App' { const App: RemoteApp; export default App; }
declare module 'products/App' { const App: RemoteApp; export default App; }
declare module 'cart/App' { const App: RemoteApp; export default App; }
declare module 'account/App' { const App: RemoteApp; export default App; }`,
      explain: [
        'Module Federation tidak menghasilkan tipe otomatis untuk import lintas aplikasi. Tanpa deklarasi ini, TypeScript menganggap <code>header/App</code> bertipe <code>any</code> dan kontrak tidak pernah diperiksa.',
        'Semua remote memakai tipe <code>RemoteApp</code> yang sama, sehingga perubahan bentuk <code>AppContext</code> langsung terlihat di <code>npm run typecheck</code>.',
        'Build Vite biasanya hanya transpile. Jadikan <code>npm run typecheck</code> bagian dari CI agar kesalahan kontrak tidak lolos ke produksi.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: rute detail produk dan 404 remote',
      lang: 'bash',
      output: false,
      code: `# 1. Tambahkan rute detail/:id dan wildcard 404 di apps/products/src/App.tsx
# 2. ProductDetail memakai useParams dan ctx.href('/katalog'), bukan window
# 3. Build remote saja; shell tidak berubah
npm run build -w @tokomicro/products
npm start
# 4. Buka alamat berikut
#    http://localhost:4173/katalog/detail/kb-01

# 5. Periksa tipe dan uji
npm run typecheck
npm test`,
      explain: [
        'Detail produk tidak membutuhkan rute baru di shell. Shell sudah menyerahkan seluruh <code>/katalog/*</code> kepada remote products.',
        'Gunakan <code>useParams</code> untuk parameter path dan <code>ctx.params</code> untuk query string. Jangan membaca <code>window.location.pathname</code> langsung karena remote juga harus berjalan di <code>MemoryRouter</code>.',
        'Tautan kembali memakai <code>ctx.href</code> agar tetap benar bila shell dipasang pada base path lain.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Memakai Hash atau Router Kedua',
      text: 'Jangan memakai <code>window.location.hash</code>, jangan memasang <code>BrowserRouter</code> di remote, dan jangan menambahkan listener <code>popstate</code> sendiri. Shell adalah satu-satunya pemilik riwayat browser. Selain itu, <code>react-router-dom</code> harus masuk daftar <code>shared</code> dengan <code>singleton: true</code>; bila tidak, remote dan shell memakai instance router berbeda dan <code>Link</code> di dalam remote akan gagal menemukan konteks. Untuk deployment, server harus mengembalikan <code>index.html</code> untuk semua path, bukan hanya <code>/</code>.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: URL, Refresh, dan Tombol Kembali</h3><p>Sebelum lanjut, uji lima hal ini di <code>http://localhost:4173</code>:</p><ol><li>Buka <code>/katalog/detail/kb-01</code> langsung di tab baru. Halaman detail harus tampil, bukan 404 shell.</li><li>Tekan refresh. URL dan halaman harus tetap sama.</li><li>Dari katalog, klik detail lalu tekan tombol kembali browser. Kamu harus kembali ke katalog, bukan keluar dari aplikasi.</li><li>Buka <code>/katalog/tidak-ada</code>. 404 remote tampil di dalam layout katalog dan tautan kembali bekerja.</li><li>Buka <code>/tidak-ada</code>. 404 shell tampil, header tetap hidup, dan tidak ada error boundary yang jatuh.</li></ol><p>Periksa juga bahwa tidak ada tanda <code>#</code> pada URL dan bahwa menu header menandai rute aktif berdasarkan <code>ctx.route</code>. Bila salah satu gagal, periksa pola bintang di shell, urutan rute, dan konfigurasi fallback server sebelum menyalahkan remote.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['BrowserRouter', 'Router React yang memakai History API dan URL path asli, bukan hash.'],
        ['Nested route', 'Rute anak yang dipasang di dalam rute induk; remote memakai pola ini untuk halaman internalnya.'],
        ['Splat route', 'Rute dengan pola /* yang menyerahkan sisa path kepada remote.'],
        ['AppContext', 'Objek kontrak dari shell ke remote: rute, navigasi, pengguna, token, i18n, flag, telemetri, dan tema.'],
        ['declare module', 'Deklarasi TypeScript untuk memberi tipe pada modul yang diimpor lintas aplikasi.'],
        ['Deep link', 'Membuka URL halaman tertentu secara langsung, termasuk saat refresh.'],
        ['Fallback SPA', 'Aturan server yang mengembalikan index.html untuk path yang tidak cocok dengan berkas statis.'],
        ['MemoryRouter', 'Router tanpa URL browser, dipakai remote saat dijalankan mandiri atau diuji.']
      ]
    }
  ],
  recap: [
    'Shell memiliki satu BrowserRouter; remote hanya menyediakan Routes bersarang dan tidak membuat router sendiri.',
    'Pola /katalog/*, /keranjang/*, dan /akun/* menyerahkan path internal kepada remote yang tepat.',
    'AppContext adalah kontrak resmi; remote membaca route, params, href, navigate, dan field lain dari sana.',
    'Deklarasi declare module membuat kontrak diperiksa TypeScript, bukan sekadar dianggap any.',
    'Detail produk, 404 remote, refresh, dan tombol kembali harus diuji sebagai bagian dari routing.'
  ]
});
