/* ============================================================
   Pelajaran Micro-Frontend — Bab 15: Performa & Budget Bundel
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-performa',
  title: 'Performa dan Budget Bundel',
  chapter: 'Kualitas & Operasi',
  duration: '18 menit',
  intro: [
    'Micro-frontend bisa membuat halaman lebih lambat daripada monolith bila tidak dijaga. Setiap remote membawa bundelnya sendiri, dan tanpa aturan, React, pustaka tanggal, atau seluruh design system bisa masuk berkali-kali ke jaringan.',
    'Kabar baiknya, arsitektur ini juga memberi alat yang tidak dimiliki monolith: kamu bisa mengukur dan membatasi setiap aplikasi secara terpisah. Shell punya budget, tiap remote punya budget, dan laporan <code>npm run perf</code> gagal bila ada yang melewatinya.',
    'Bab ini membahas shared singleton, code splitting, lazy route, preload, cache immutable, kompresi, dan cara membaca laporan ukuran. Prinsip utamanya: <b>ukur dulu, baru optimasi</b>. Menebak bagian mana yang berat biasanya salah sasaran.'
  ],
  objectives: [
    'Menjelaskan mengapa shared singleton mencegah duplikasi React',
    'Memecah rute dan komponen agar bundel awal tetap kecil',
    'Mengatur cache immutable serta kompresi untuk aset ber-hash',
    'Membaca laporan scripts/perf-report.mjs dan menafsirkan budget',
    'Menurunkan ukuran bundel lalu memverifikasi laporan lulus'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Ke Mana Berat Bundel Pergi</h3><p>Ada tiga sumber pembengkakan yang paling sering muncul di micro-frontend:</p><ol><li><b>Dependensi ganda.</b> Setiap remote membawa React, React DOM, dan React Router sendiri. Halaman memuat tiga salinan pustaka yang sama.</li><li><b>Impor barrel.</b> <code>import { Button } from "@tokomicro/ui-kit"</code> bisa menarik seluruh komponen dan token bila tidak di-tree-shake dengan benar.</li><li><b>Rute yang tidak dipecah.</b> Halaman detail, checkout, dan riwayat pesanan ikut diunduh meskipun pengguna baru membuka katalog.</li></ol><p>Shared singleton menyelesaikan yang pertama. Code splitting dan lazy route menyelesaikan yang ketiga. Untuk yang kedua, periksa laporan visualizer dan pastikan hanya komponen yang dipakai ikut masuk.</p>'
    },
    {
      type: 'text',
      html: '<h3>Budget yang Disepakati, Bukan Angka Perasaan</h3><p>Proyek ini memakai anggaran di <code>scripts/perf-report.mjs</code>: shell maksimal <b>320 kB gzip</b>, setiap remote maksimal <b>140 kB gzip</b>. Angka ini cukup longgar untuk React 18 dan design system, tetapi cukup ketat untuk menangkap dependensi berat yang tidak sengaja masuk.</p><p>Aturan cache melengkapinya: aset ber-hash seperti <code>index-abc123.js</code> boleh memakai <code>Cache-Control: public, max-age=31536000, immutable</code>. Sebaliknya, <code>remoteEntry.js</code> dan manifest harus <code>no-cache</code> agar rilis baru langsung terlihat. Kompresi Brotli atau gzip di CDN mengurangi ukuran transfer; budget dihitung dari gzip, bukan ukuran mentah.</p>'
    },
    {
      type: 'example',
      title: 'Shared singleton dan pemecahan chunk di Vite',
      lang: 'ts',
      output: false,
      code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/App.tsx' },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.30.0' }
      } as any
    }),
    ...(process.env.ANALYZE
      ? [visualizer({ filename: 'dist/bundle-report.html', gzipSize: true })]
      : [])
  ],
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
});`,
      explain: [
        '<code>singleton: true</code> memastikan hanya satu React hidup di halaman. Tanpa ini, hook dan context bisa gagal membaca state yang sama.',
        '<code>manualChunks</code> memisahkan vendor dan router agar cache jangka panjang lebih efektif saat kode aplikasi berubah.',
        '<code>ANALYZE=1 npm run build</code> menghasilkan <code>bundle-report.html</code> untuk melihat paket mana yang paling besar.',
        'Jangan memecah terlalu jauh. Terlalu banyak chunk kecil menambah jumlah permintaan dan memperlambat koneksi lambat.'
      ]
    },
    {
      type: 'example',
      title: 'Lazy route dan preload saat niat pengguna terlihat',
      lang: 'tsx',
      output: false,
      code: `import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

/* Rute berat tidak ikut bundel awal. */
const Catalog = lazy(() => import('products/App'));
const Cart = lazy(() => import('cart/App'));
const Account = lazy(() => import('account/App'));

const preload = {
  cart: () => import('cart/App'),
  account: () => import('account/App')
};

export function AppRoutes({ ctx }: { ctx: AppContext }) {
  return (
    <Suspense fallback={<div className="skeleton" aria-hidden="true" />}>
      <Routes>
        <Route path="/katalog/*" element={<Catalog ctx={ctx} />} />
        <Route path="/keranjang/*" element={<Cart ctx={ctx} />} />
        <Route path="/akun/*" element={<Account ctx={ctx} />} />
      </Routes>

      {/* Mulai unduh saat pengguna menunjukkan niat, bukan saat halaman dibuka. */}
      <Link
        to="/keranjang"
        onMouseEnter={() => void preload.cart()}
        onFocus={() => void preload.cart()}
      >
        Keranjang
      </Link>
    </Suspense>
  );
}`,
      explain: [
        'Bundel awal hanya berisi shell dan remote yang benar-benar dibutuhkan untuk rute pertama.',
        '<code>onMouseEnter</code> dan <code>onFocus</code> adalah sinyal niat yang baik; jangan preload semua remote saat boot.',
        'Preload harus aman bila gagal. Bila jaringan bermasalah, route tetap bisa memuat ulang saat pengguna benar-benar menavigasi.',
        'Jangan memakai <code>prefetch</code> untuk remote yang jarang dipakai; itu memindahkan biaya tanpa manfaat.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: baca laporan, kecilkan bundel, verifikasi lulus',
      lang: 'bash',
      output: false,
      code: `# 1. Bangun semua aplikasi.
npm run build

# 2. Baca laporan ukuran dan cek budget.
npm run perf

# Contoh keluaran:
# ┌─────────┬──────────┬──────────┬────────────┬───────────────┐
# │ app     │ raw      │ gzip     │ budget     │ status        │
# ├─────────┼──────────┼──────────┼────────────┼───────────────┤
# │ shell   │ 1.1 MB   │ 301.4 kB │ 320 kB     │ ok            │
# │ cart    │ 512 kB   │ 138.2 kB │ 140 kB     │ ok            │
# └─────────┴──────────┴──────────┴────────────┴───────────────┘

# 3. Bila cart mendekati batas, pecah rute checkout dengan lazy().
#    Build ulang dan bandingkan angka sebelum vs sesudah.

# 4. Setelah stabil, turunkan budget cart dari 140 kB menjadi 130 kB
#    di scripts/perf-report.mjs agar regresi berikutnya tertangkap.

# 5. Verifikasi laporan lulus.
npm run perf
# ✔ Semua bundel berada dalam budget.

# 6. Opsional: lihat telemetri live dari shell yang berjalan.
node scripts/perf-report.mjs --live`,
      explain: [
        'Laporan menghitung ukuran mentah dan gzip untuk setiap berkas JavaScript dan CSS di folder <code>dist</code>.',
        'Status <b>belum build</b> berarti folder <code>dist</code> tidak ada; jalankan <code>npm run build</code> lebih dulu.',
        'Menurunkan budget setelah ukuran stabil adalah cara membuat penghematan bertahan, bukan sekadar kemenangan sekali waktu.',
        'Perintah <code>--live</code> juga membaca <code>/api/metrics/summary</code> sehingga ukuran bundel dan waktu muat terlihat bersama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checkpoint Performa</h3><p>Setelah optimasi, pastikan:</p><ul><li><code>npm run perf</code> mencetak <b>Semua bundel berada dalam budget</b> dan keluar dengan kode 0.</li><li>Shell berada di bawah 320 kB gzip; setiap remote di bawah 140 kB gzip.</li><li>React hanya muncul satu kali di laporan visualizer, bukan sekali per remote.</li><li>Rute <code>/katalog</code> tidak mengunduh bundel checkout dan akun pada kunjungan pertama.</li><li>Aset ber-hash memakai cache immutable, sedangkan manifest dan <code>remoteEntry.js</code> memakai no-cache.</li><li>Angka <code>remote_load_ms</code> di <code>/status</code> tidak memburuk setelah perubahan.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Shared State yang Menarik Semua Remote ke Satu Bundel',
      text: 'Memasukkan seluruh state, API client, dan komponen UI ke satu paket <code>shared</code> terlihat rapi, tetapi bisa membuat setiap remote mengunduh kode yang tidak dipakainya. Lebih buruk lagi, satu impor dari barrel besar dapat menyeret seluruh design system. Bagikan hanya kontrak kecil dan singleton yang benar-benar dipakai semua pihak; biarkan kode spesifik tetap di remote masing-masing.'
    },
    {
      type: 'tip',
      title: 'Ukur Sebelum dan Sesudah, Simpan Angkanya',
      text: 'Catat ukuran gzip dan <code>remote_load_ms</code> sebelum perubahan, lalu bandingkan setelahnya. Optimasi tanpa baseline hanya menghasilkan klaim. Simpan hasil <code>npm run perf</code> di komentar pull request agar keputusan berikutnya punya data, bukan ingatan.'
    },
    {
      type: 'vocab',
      items: [
        ['Shared singleton', 'Satu salinan pustaka bersama untuk semua remote, misalnya React.'],
        ['Code splitting', 'Memecah bundel menjadi beberapa chunk yang dimuat sesuai kebutuhan.'],
        ['Lazy route', 'Rute yang komponennya baru diunduh saat rute tersebut dibuka.'],
        ['Preload', 'Mengunduh sumber daya lebih awal karena pengguna kemungkinan membutuhkannya.'],
        ['Tree shaking', 'Menghapus kode yang tidak dipakai dari bundel akhir.'],
        ['Budget bundel', 'Batas ukuran yang disepakati dan diperiksa otomatis di pipeline.'],
        ['Immutable cache', 'Header cache yang menyatakan aset ber-hash tidak akan berubah.'],
        ['Brotli', 'Algoritma kompresi yang umum dipakai CDN untuk mengurangi ukuran transfer.']
      ]
    }
  ],
  recap: [
    'Setiap remote membawa bundelnya sendiri; duplikasi dependensi adalah musuh utama.',
    'Shared singleton menjaga React hanya satu salinan di seluruh halaman.',
    'Lazy route dan preload berbasis niat menjaga bundel awal tetap kecil.',
    'Budget 320 kB untuk shell dan 140 kB per remote diperiksa oleh npm run perf.',
    'Ukur sebelum optimasi, bandingkan sesudahnya, lalu turunkan budget agar perbaikan bertahan.'
  ]
});
