/* ============================================================
   Pelajaran Micro-Frontend — Bab 5: Remote & Module Federation
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-remote-module-federation',
  title: 'Remote Pertama dengan Module Federation',
  chapter: 'Shell & Remote',
  duration: '22 menit',
  intro: [
    'Remote adalah aplikasi React yang hidup sendiri. Ia punya <code>package.json</code>, <code>vite.config.ts</code>, halaman uji mandiri, dan hasil build berupa <code>remoteEntry.js</code>. Shell memuatnya saat rute dibuka, bukan saat halaman pertama kali dimuat.',
    'Bab ini membuat remote <b>header</b> TokoMicro: logo, navigasi, badge keranjang, dan status pengguna. Setelah selesai, kamu bisa membuka header di port 4174 tanpa shell, lalu melihatnya muncul di dalam shell di port 4173.',
    'Yang paling penting bukan konfigurasinya, melainkan <b>kontraknya</b>: nama remote, nama ekspos, props <code>{ ctx }</code>, dan dependensi yang dibagi. Kontrak yang stabil membuat tim lain bisa merilis tanpa saling menunggu.'
  ],
  objectives: [
    'Mengonfigurasi exposes, remotes, dan shared singleton di Vite',
    'Membuat remote React TypeScript yang menerima AppContext',
    'Menjalankan remote secara mandiri dengan MemoryRouter',
    'Memuat remoteEntry.js dari shell lewat manifest dan virtual:__federation__',
    'Memverifikasi status HTTP, CORS, dan error console saat debugging'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Remote sebagai Aplikasi Mandiri</h3><p>Remote bukan komponen biasa yang diimpor dari folder sebelah. Ia adalah aplikasi yang bisa dibuka sendiri, punya API sendiri, dan menghasilkan artefak sendiri. Karena itu tim header bisa mengembangkan komponennya tanpa menjalankan shell, asalkan menyediakan <code>ctx</code> tiruan di halaman mandirinya.</p><p>Saat mandiri, remote memakai <code>MemoryRouter</code> karena tidak ada <code>BrowserRouter</code> dari shell. Saat berjalan di dalam shell, remote menerima <code>BrowserRouter</code> yang sama dan hanya merender <code>&lt;Routes&gt;</code> bersarang. Komponennya tidak berubah; hanya sumber router dan <code>ctx</code>-nya yang berbeda.</p><p>Setiap remote berada di origin berbeda: header 4174, products 4175, cart 4176, account 4177. Perbedaan origin inilah yang membuat CORS dan alamat <code>remoteEntry.js</code> menjadi bagian dari desain, bukan detail sepele.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 280" width="760" role="img" aria-label="Remote header dibangun menjadi remoteEntry.js, didaftarkan di manifest, lalu dimuat shell lintas origin"><rect x="20" y="72" width="180" height="86" rx="8" class="u-box"/><text x="110" y="98" class="u-title" text-anchor="middle">apps/header</text><text x="110" y="117" class="u-lbl" text-anchor="middle">React + Vite + TS</text><text x="110" y="134" class="u-lbl" text-anchor="middle">exposes ./App</text><text x="110" y="150" class="u-lbl" text-anchor="middle">MemoryRouter mandiri</text><line x1="200" y1="115" x2="245" y2="115" class="u-line"/><rect x="250" y="72" width="210" height="86" rx="8" class="u-hl"/><text x="355" y="98" class="u-title" text-anchor="middle">vite build</text><text x="355" y="117" class="u-lbl" text-anchor="middle">dist/assets/remoteEntry.js</text><text x="355" y="134" class="u-lbl" text-anchor="middle">+ chunk App</text><text x="355" y="150" class="u-lbl" text-anchor="middle">target esnext</text><line x1="460" y1="115" x2="505" y2="115" class="u-line"/><rect x="510" y="72" width="230" height="86" rx="8" class="u-box"/><text x="625" y="98" class="u-title" text-anchor="middle">shell :4173</text><text x="625" y="117" class="u-lbl" text-anchor="middle">remotes.header = URL</text><text x="625" y="134" class="u-lbl" text-anchor="middle">manifest /api/remotes</text><text x="625" y="150" class="u-lbl" text-anchor="middle">virtual:__federation__</text><line x1="625" y1="158" x2="625" y2="204" class="u-dash"/><rect x="510" y="208" width="230" height="50" rx="8" class="u-box"/><text x="625" y="229" class="u-title" text-anchor="middle">remote :4174</text><text x="625" y="247" class="u-lbl" text-anchor="middle">origin terpisah + CORS</text><text x="110" y="230" class="u-lbl">Shell tidak tahu struktur internal remote.</text></svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Dari kode remote menjadi remoteEntry.js yang dimuat shell lintas origin</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Konfigurasi Module Federation untuk header',
      lang: 'ts',
      output: false,
      code: `// apps/header/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'header',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' }
      }
    })
  ],
  server: { port: 4174, strictPort: true },
  preview: { port: 4174, strictPort: true },
  base: '/',
  build: { target: 'esnext', minify: false, sourcemap: true }
});`,
      explain: [
        '<code>name</code> harus sama dengan nama yang dipakai shell pada <code>remotes</code>. Bila berbeda, shell tidak menemukan modul.',
        '<code>exposes</code> menentukan apa yang dipancarkan. <code>./App</code> menjadi <code>header/App</code> di sisi shell.',
        '<code>shared</code> dengan <code>singleton: true</code> mencegah React, ReactDOM, dan react-router-dom dimuat dua kali. <code>build.target</code> harus <code>esnext</code> agar plugin federasi bekerja.'
      ]
    },
    {
      type: 'example',
      title: 'Komponen header dan mode mandiri',
      lang: 'tsx',
      output: false,
      code: `// apps/header/src/App.tsx
import { Link, NavLink } from 'react-router-dom';
import type { RemoteAppProps } from '@tokomicro/contracts';
import { Badge, Button } from '@tokomicro/ui-kit';
import { cartSummary, getSnapshot, subscribe } from '@tokomicro/shared';
import { useSyncExternalStore } from 'react';
import './header.css';

export default function Header({ ctx }: RemoteAppProps) {
  const items = useSyncExternalStore(subscribe, getSnapshot);
  const { qty } = cartSummary(items);

  return (
    <header className="hd">
      <Link className="hd-brand" to="/katalog">TokoMicro</Link>
      <nav className="hd-nav" aria-label="Navigasi utama">
        <NavLink to="/katalog">Katalog</NavLink>
        <NavLink to="/keranjang">
          Keranjang {qty > 0 ? <Badge>{qty}</Badge> : null}
        </NavLink>
        {ctx.user ? (
          <Button size="sm" variant="ghost" onClick={ctx.logout}>Keluar</Button>
        ) : (
          <Button size="sm" variant="primary" onClick={() => ctx.navigate('/masuk')}>Masuk</Button>
        )}
      </nav>
    </header>
  );
}

// apps/header/src/main.tsx — hanya untuk mode mandiri
createRoot(document.getElementById('remote-root')!).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={['/katalog']}>
      <Header ctx={mockCtx} />
    </MemoryRouter>
  </React.StrictMode>
);`,
      explain: [
        'Remote tidak memasang listener rute global dan tidak memanggil API remote lain. Ia membaca <code>ctx</code> dan shared state.',
        'Semua kelas CSS berawalan <code>.hd-</code> dan warna memakai token <code>--tm-*</code> agar tidak menimpa remote lain.',
        '<code>MemoryRouter</code> hanya dipakai di <code>main.tsx</code> saat mandiri. Di dalam shell, <code>BrowserRouter</code> milik shell yang aktif.'
      ]
    },
    {
      type: 'example',
      title: 'Mendaftarkan remote di shell dan memuat dari manifest',
      lang: 'ts',
      output: false,
      code: `// apps/shell/vite.config.ts
const remoteUrl = (name: string, port: number) =>
  process.env[name.toUpperCase() + '_REMOTE'] ??
  'http://localhost:' + port + '/assets/remoteEntry.js';

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
  }
});

// apps/shell/src/remoteLoader.ts
import {
  __federation_method_getRemote,
  __federation_method_setRemote,
  __federation_method_unwrapDefault
} from 'virtual:__federation__';

const url = manifestRef.current?.remotes[name]?.url;
if (url) {
  __federation_method_setRemote(name, {
    url: () => Promise.resolve(url),
    format: 'esm',
    from: 'vite'
  });
  const module = await __federation_method_getRemote(name, './App');
  return { default: __federation_method_unwrapDefault(module) };
}`,
      explain: [
        '<code>remotes</code> di konfigurasi build adalah fallback. Saat runtime, shell mengganti URL dengan nilai dari manifest <code>/api/remotes</code> melalui <code>virtual:__federation__</code>.',
        'Manifest memungkinkan rilis dan rollback per remote tanpa membangun ulang shell, asalkan nama ekspos <code>./App</code> tetap sama.',
        'Gunakan <code>HEADER_REMOTE</code> atau variabel serupa untuk staging dan produksi; jangan menanam URL produksi di kode.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Praktik: Remote Header Minimal</h3><ol><li>Buat <code>apps/header/package.json</code> dengan nama <code>@tokomicro/header</code>, script <code>dev</code>, <code>build</code>, <code>preview</code>, dan <code>typecheck</code>, serta dependensi React 18.</li><li>Buat <code>apps/header/vite.config.ts</code> seperti contoh, dengan <code>name: "header"</code>, <code>exposes: { "./App": "./src/App.tsx" }</code>, dan <code>shared</code> singleton.</li><li>Buat <code>index.html</code> berisi <code>&lt;div id="remote-root"&gt;&lt;/div&gt;</code> dan script <code>/src/main.tsx</code>.</li><li>Buat <code>src/App.tsx</code> yang menerima <code>ctx</code>, lalu <code>src/main.tsx</code> dengan <code>MemoryRouter</code> dan <code>mockCtx</code>.</li><li>Jalankan <code>npm install</code>, lalu <code>npm run build -w @tokomicro/header</code>.</li><li>Jalankan <code>npm start</code>, buka <code>http://localhost:4174</code> untuk mode mandiri, lalu buka shell <code>http://localhost:4173</code>.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint dan Debug</h3><p>Verifikasi dari terminal:</p><pre><code class="language-bash">curl -i http://localhost:4174/assets/remoteEntry.js\n# HTTP/1.1 200 OK\n# content-type: text/javascript\n\ncurl -i -H "Origin: http://localhost:4173" \\\n  http://localhost:4174/assets/remoteEntry.js\n# access-control-allow-origin: http://localhost:4173</code></pre><p>Lalu buka DevTools:</p><ul><li><b>Network</b>: <code>remoteEntry.js</code> 200, diikuti chunk <code>App</code> 200 dari origin 4174.</li><li><b>Console</b>: tidak ada <code>Invalid hook call</code>, tidak ada CORS, tidak ada 404.</li><li><b>Elements</b>: <code>&lt;header class="hd"&gt;</code> muncul di dalam shell, dan tautan memakai navigasi client tanpa reload.</li><li><b>Standalone</b>: <code>http://localhost:4174</code> tetap berfungsi meskipun shell dimatikan.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Build Dulu, Jangan Hanya vite dev',
      text: 'Mode <code>vite dev</code> belum mendukung Module Federation pada plugin ini. Federasi bekerja pada hasil build. Karena itu alur pengembangan memakai <code>npm run build</code> lalu <code>npm start</code> atau <code>vite preview</code>, dan setiap perubahan remote perlu build ulang remote tersebut. Gejala lain yang sering tertukar: 404 berarti URL atau path salah, <code>Invalid hook call</code> berarti React dimuat dua kali, layar kosong berarti default export tidak cocok, dan CORS berarti origin remote belum mengizinkan shell. Jangan lupa mengatur cache <code>remoteEntry.js</code> agar rilis baru tidak tertahan versi lama.'
    },
    {
      type: 'vocab',
      items: [
        ['exposes', 'Daftar modul yang dipublikasikan remote untuk diimpor shell.'],
        ['remotes', 'Daftar remote yang dikenal shell beserta alamat remoteEntry.js.'],
        ['remoteEntry.js', 'Berkas pintu masuk federasi yang dimuat shell.'],
        ['shared singleton', 'Pengaturan agar satu pustaka hanya dimuat sekali untuk shell dan semua remote.'],
        ['Origin', 'Kombinasi protokol, host, dan port; misalnya http://localhost:4174.'],
        ['MemoryRouter', 'Router in-memory untuk mode mandiri remote, tanpa mengubah URL host.'],
        ['CORS', 'Aturan browser yang mengizinkan atau menolak permintaan lintas origin.'],
        ['virtual:__federation__', 'Modul virtual plugin yang menyediakan API untuk mengganti URL remote saat runtime.'],
        ['Standalone', 'Kemampuan remote berjalan sendiri tanpa shell.']
      ]
    }
  ],
  recap: [
    'Remote adalah aplikasi React mandiri dengan package.json, build, dan halaman uji sendiri.',
    'name, exposes, dan shared singleton adalah tiga konfigurasi federasi yang wajib benar.',
    'Remote memakai Routes bersarang di dalam shell dan MemoryRouter saat berdiri sendiri.',
    'Shell memuat remoteEntry.js lewat manifest /api/remotes dan virtual:__federation__.',
    'Verifikasi remoteEntry 200, CORS benar, dan console bersih sebelum menyalahkan shell.'
  ]
});
