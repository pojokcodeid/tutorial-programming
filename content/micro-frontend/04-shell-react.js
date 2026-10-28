/* ============================================================
   Pelajaran Micro-Frontend — Bab 4: Shell React TypeScript
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-shell-react',
  title: 'Membangun Shell React TypeScript',
  chapter: 'Shell & Remote',
  duration: '22 menit',
  intro: [
    'Shell adalah wajah produk sekaligus pemilik halaman. Ia menentukan URL mana yang ada, remote mana yang tampil di setiap rute, bagaimana sesi login dipulihkan, dan apa yang terjadi ketika sebuah remote gagal dimuat. Tanpa shell, pengguna akan melihat empat aplikasi terpisah.',
    'Prinsipnya satu: <b>shell mengatur, remote melayani</b>. Kamu akan memakai <code>BrowserRouter</code> untuk URL asli, <code>React.lazy</code> dan <code>Suspense</code> untuk memuat remote, <code>ErrorBoundary</code> untuk mengisolasi kegagalan, serta satu objek <code>AppContext</code> sebagai kontrak.',
    'Bab ini membangun shell TokoMicro langkah demi langkah: boot manifest dan sesi, peta rute, lazy remote, toast, halaman 404, dan protected route. Di akhir, kamu menambahkan rute <code>/bantuan</code> dan memverifikasinya lewat URL langsung.'
  ],
  objectives: [
    'Menjelaskan tanggung jawab shell dan batasannya terhadap remote',
    'Memasang BrowserRouter serta layout shell yang mendukung deep link',
    'Memulihkan sesi dan manifest saat boot tanpa memblokir seluruh halaman',
    'Memuat remote secara lazy dengan Suspense dan ErrorBoundary',
    'Menambahkan protected route, toast, 404, dan rute baru yang terverifikasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tanggung Jawab Shell</h3><p>Shell memiliki empat hal yang tidak bisa diwakilkan: <b>routing</b> (URL ke remote), <b>layout</b> (slot konten), <b>gaya dasar</b> (reset dan token <code>--tm-*</code>), dan <b>autentikasi global</b> (login, token, protected route). Ditambah dua tugas operasional: memuat remote secara malas dan menangani kegagalan.</p><p>Yang <b>tidak</b> boleh dilakukan shell: memanggil API bisnis milik remote, menyimpan data katalog atau keranjang, atau mengimpor berkas internal remote. Shell hanya tahu nama remote, URL <code>remoteEntry.js</code>, dan kontrak <code>AppContext</code>.</p><p>Karena memakai <code>BrowserRouter</code>, URL seperti <code>http://localhost:4173/katalog</code> harus bisa dibuka langsung. Server shell wajib memiliki SPA fallback yang mengembalikan <code>index.html</code> untuk rute yang tidak menunjuk berkas statis.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 270" width="760" role="img" aria-label="Alur shell dari URL sampai remote tampil, termasuk boot manifest, sesi, lazy load, dan error boundary"><rect x="15" y="92" width="130" height="58" rx="8" class="u-box"/><text x="80" y="116" class="u-title" text-anchor="middle">URL berubah</text><text x="80" y="134" class="u-lbl" text-anchor="middle">/keranjang</text><line x1="145" y1="121" x2="180" y2="121" class="u-line"/><rect x="185" y="82" width="150" height="78" rx="8" class="u-box"/><text x="260" y="106" class="u-title" text-anchor="middle">BrowserRouter</text><text x="260" y="124" class="u-lbl" text-anchor="middle">peta rute</text><text x="260" y="140" class="u-lbl" text-anchor="middle">/katalog/*</text><line x1="335" y1="121" x2="370" y2="121" class="u-line"/><rect x="375" y="82" width="150" height="78" rx="8" class="u-box"/><text x="450" y="106" class="u-title" text-anchor="middle">lazy remote</text><text x="450" y="124" class="u-lbl" text-anchor="middle">manifest + federation</text><text x="450" y="140" class="u-lbl" text-anchor="middle">Suspense skeleton</text><line x1="525" y1="121" x2="560" y2="121" class="u-line"/><rect x="565" y="92" width="180" height="58" rx="8" class="u-hl"/><text x="655" y="116" class="u-title" text-anchor="middle">remote di slot</text><text x="655" y="134" class="u-lbl" text-anchor="middle">atau fallback error</text><line x1="80" y1="150" x2="80" y2="200" class="u-dash"/><line x1="80" y1="200" x2="655" y2="200" class="u-dash"/><text x="380" y="224" class="u-lbl" text-anchor="middle">boot: GET /api/remotes + refresh sesi (cookie httpOnly) + feature flags</text></svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Dari URL sampai remote tampil, lengkap dengan jalur kegagalan dan boot sesi</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'BrowserRouter dan layout dasar',
      lang: 'tsx',
      output: false,
      code: `// apps/shell/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@tokomicro/ui-kit/tokens.css';
import './shell.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// apps/shell/src/App.tsx — kerangka layout
export default function App() {
  return (
    <>
      <ErrorBoundary name="header" fallback={<HeaderFallback />}>
        <Suspense fallback={<div className="skeleton skeleton-hd" />}>
          <Header ctx={ctx} />
        </Suspense>
      </ErrorBoundary>
      <main className="view" ref={viewRef} tabIndex={-1}>
        <Routes>{/* rute shell */}</Routes>
      </main>
      <div className="toast-root" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={'toast toast-' + item.type}>
            {item.message}
          </div>
        ))}
      </div>
    </>
  );
}`,
      explain: [
        '<code>BrowserRouter</code> dipasang sekali di shell. Remote tidak boleh membuat <code>BrowserRouter</code> baru karena akan menabrak URL host.',
        '<code>main</code> memiliki <code>tabIndex={-1}</code> agar fokus dapat dipindahkan setelah navigasi, sehingga pengguna pembaca layar tahu konten berganti.',
        '<code>aria-live="polite"</code> membuat toast diumumkan tanpa merebut fokus dari kontrol yang sedang dipakai.'
      ]
    },
    {
      type: 'example',
      title: 'Boot manifest, feature flags, dan sesi',
      lang: 'tsx',
      output: false,
      code: `const [manifest, setManifest] = useState<RemoteManifest | null>(null);
const manifestRef = useRef<RemoteManifest | null>(null);
const [session, setSession] = useState<Session | null>(null);

useEffect(() => {
  let alive = true;

  (async () => {
    const started = performance.now();
    const [manifestResult, flagsResult, sessionResult] = await Promise.allSettled([
      fetchManifest(),   // GET /api/remotes
      fetchFlags(),      // GET /api/flags
      refreshSession()   // POST /api/refresh, cookie httpOnly
    ]);

    if (!alive) return;
    const nextManifest =
      manifestResult.status === 'fulfilled'
        ? manifestResult.value
        : createDefaultManifest();

    manifestRef.current = nextManifest;
    setManifest(nextManifest);

    if (flagsResult.status === 'fulfilled') setFlags(flagsResult.value);
    if (sessionResult.status === 'fulfilled' && sessionResult.value) {
      setSession(sessionResult.value); // token akses hanya di memori
    }

    telemetry.metric('boot_ms', performance.now() - started);
  })();

  return () => { alive = false; };
}, []);`,
      explain: [
        '<code>Promise.allSettled</code> dipakai agar kegagalan manifest tidak membatalkan pemulihan sesi, dan sebaliknya. Shell dapat memakai manifest cadangan.',
        'Token akses disimpan di state memori, bukan <code>localStorage</code>. Refresh token berada di cookie <code>httpOnly</code> sehingga JavaScript tidak dapat membacanya.',
        'Selama manifest belum siap, shell menampilkan layar boot. Ini mencegah permintaan remote dengan URL yang belum diketahui.'
      ]
    },
    {
      type: 'example',
      title: 'Peta rute, protected route, dan 404',
      lang: 'tsx',
      output: false,
      code: `const route = location.pathname.split('/').filter(Boolean)[0] ?? 'katalog';
const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

const ctx = useMemo<AppContext>(() => ({
  route,
  params,
  href: (path) => (path.startsWith('/') ? path : '/' + path),
  navigate: (path, options) => navigate(path.startsWith('/') ? path : '/' + path, options),
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
}), [route, params, session, locale, flags, theme, telemetry, navigate]);

<Routes>
  <Route path="/" element={<Navigate to="/katalog" replace />} />
  <Route path="/katalog/*" element={<RemoteSlot name="products" label="Katalog" ctx={ctx} />} />
  <Route path="/keranjang/*" element={<RemoteSlot name="cart" label="Keranjang" ctx={ctx} />} />
  <Route
    path="/akun/*"
    element={
      <ProtectedRoute ctx={ctx}>
        <RemoteSlot name="account" label="Akun" ctx={ctx} />
      </ProtectedRoute>
    }
  />
  <Route path="/masuk" element={<LoginView ctx={ctx} />} />
  <Route path="*" element={<NotFound route={route} />} />
</Routes>

function ProtectedRoute({ ctx, children }: { ctx: AppContext; children: ReactNode }) {
  const location = useLocation();
  if (!ctx.user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={'/masuk?next=' + next} replace />;
  }
  return <>{children}</>;
}`,
      explain: [
        'Rute remote memakai pola <code>/*</code> agar remote dapat memiliki rute bersarang seperti <code>/katalog/detail/kb-01</code> tanpa diketahui shell.',
        '<code>ProtectedRoute</code> menyimpan tujuan awal di query <code>next</code>, sehingga setelah login pengguna kembali ke halaman yang diminta.',
        'Rute <code>*</code> menangkap URL tak dikenal dan menampilkan 404 di dalam layout shell; header dan toast tetap hidup.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Praktik: Membaca App.tsx dan Menambah /bantuan</h3><ol><li>Buka <code>apps/shell/src/App.tsx</code>. Temukan blok <code>&lt;Routes&gt;</code> di dalam <code>&lt;main&gt;</code>.</li><li>Perhatikan bahwa setiap remote memakai <code>RemoteSlot</code> dengan nama, label, dan <code>ctx</code> yang sama.</li><li>Buat komponen <code>HelpPage</code> di berkas yang sama atau <code>apps/shell/src/HelpPage.tsx</code>; gunakan <code>&lt;Link to="/katalog"&gt;</code> untuk kembali.</li><li>Tambahkan <code>&lt;Route path="/bantuan" element={&lt;HelpPage /&gt;} /&gt;</code> sebelum rute <code>*</code>.</li><li>Jalankan <code>npm run typecheck -w @tokomicro/shell</code>, lalu <code>npm run build</code> dan <code>npm start</code>.</li><li>Buka <code>http://localhost:4173/bantuan</code> langsung, lalu dari tautan header. Keduanya harus menampilkan halaman yang sama tanpa reload penuh.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint Shell</h3><p>Shell dianggap sehat bila semua pemeriksaan ini lolos:</p><ul><li><code>GET http://localhost:4173/api/remotes</code> mengembalikan 200 dan daftar remote dengan URL <code>remoteEntry.js</code>.</li><li><code>/bantuan</code> dapat dibuka langsung; server mengembalikan <code>index.html</code>, bukan 404 HTTP.</li><li>Rute <code>/tidak-ada</code> menampilkan halaman 404 milik shell, bukan layar putih.</li><li><code>/akun</code> tanpa sesi mengarah ke <code>/masuk?next=%2Fakun</code>.</li><li>Console tidak menampilkan error, dan mematikan satu remote hanya memunculkan fallback pada slotnya.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Jangan Menaruh Token di localStorage',
      text: 'Token akses harus hidup di memori dan diperbarui lewat refresh token cookie <code>httpOnly</code>. Menyimpannya di <code>localStorage</code> membuatnya dapat dibaca skrip mana pun yang berhasil menyusup ke halaman. Selain itu, jangan memasang <code>BrowserRouter</code> di dalam remote: satu router untuk satu halaman, dan itu milik shell. Remote yang membutuhkan navigasi cukup memakai <code>ctx.navigate</code> atau <code>Link</code> dari react-router-dom.'
    },
    {
      type: 'vocab',
      items: [
        ['BrowserRouter', 'Router react-router-dom yang memakai History API dan URL asli tanpa tanda #.'],
        ['AppContext', 'Objek kontrak dari shell ke remote: rute, navigasi, toast, pengguna, token, tema, dan i18n.'],
        ['Manifest', 'Dokumen dari /api/remotes yang memetakan nama remote ke URL remoteEntry.js dan versinya.'],
        ['React.lazy', 'Fungsi React untuk memuat komponen secara dinamis saat rute dibutuhkan.'],
        ['Suspense', 'Komponen yang menampilkan fallback selama komponen lazy masih dimuat.'],
        ['Error boundary', 'Komponen yang menangkap galat render dan menampilkan UI pengganti.'],
        ['Protected route', 'Rute yang hanya boleh diakses setelah pengguna terautentikasi.'],
        ['Deep link', 'Membuka URL langsung ke rute tertentu, bukan dari halaman awal.'],
        ['SPA fallback', 'Aturan server yang mengembalikan index.html untuk rute yang tidak menunjuk berkas statis.']
      ]
    }
  ],
  recap: [
    'Shell mengatur halaman; remote melayani fitur dan tidak mengatur navigasi global.',
    'BrowserRouter dipasang sekali di shell; remote memakai Routes bersarang atau MemoryRouter saat mandiri.',
    'Boot memakai Promise.allSettled untuk manifest, flags, dan sesi; token akses tetap di memori.',
    'React.lazy, Suspense, dan ErrorBoundary memberi lazy loading serta isolasi kegagalan per slot.',
    'Protected route, toast, 404, dan deep link adalah tanggung jawab shell, bukan remote.'
  ]
});
