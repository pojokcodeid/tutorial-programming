/* ============================================================
   Pelajaran Micro-Frontend — Bab 11: Manifest Dinamis & Feature Flag
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-manifest-flags',
  title: 'Manifest Dinamis dan Feature Flag',
  chapter: 'Identitas & Ketahanan',
  duration: '18 menit',
  intro: [
    'Bayangkan tim katalog sudah memperbaiki bug harga dan ingin merilis sore ini, sementara kamu sedang menyiapkan rute baru di shell. Kalau URL remote ditanam saat build, shell harus dibangun ulang hanya untuk menunjuk berkas yang sudah ada. Itulah masalah yang diselesaikan <b>manifest dinamis</b>.',
    'Manifest adalah daftar kecil berisi remote mana yang aktif, versi berapa, dan di URL mana <code>remoteEntry.js</code> berada. Shell membacanya saat runtime, lalu memuat remote dari alamat itu. Selama bentuk kontrak <code>ctx</code> tidak berubah, tidak ada build shell yang diperlukan.',
    'Bab ini juga membahas <b>feature flag</b>: saklar untuk menyalakan fitur baru, mematikan remote bermasalah, atau mengarahkan sebagian pengguna ke perilaku lama. Manifest menjawab "versi mana", feature flag menjawab "fitur mana". Keduanya adalah alat operasi, bukan sekadar konfigurasi.'
  ],
  objectives: [
    'Menjelaskan alur manifest dari cdn/manifest.json sampai remoteEntry.js',
    'Membaca dan mengubah URL remote lewat /api/remotes tanpa build shell',
    'Memakai remoteLoader.ts dengan virtual:__federation__ dan fallback build-time',
    'Menerapkan feature flag newCheckout, accountRemote, dan legacyCatalog',
    'Melakukan rilis canary serta rollback satu remote dengan aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Manifest sebagai Pointer, Bukan Salinan Build</h3><p><code>cdn/manifest.json</code> menyimpan versi aktif tiap remote. Server membacanya, membentuk URL lengkap sesuai host yang dipakai, lalu menyajikannya di <code>GET /api/remotes</code>. Shell tidak perlu tahu isi folder CDN; ia hanya perlu satu pointer yang valid.</p><p>Bentuk responsnya kurang lebih seperti ini:</p><pre><code class="language-json">{\n  "generatedAt": "2026-10-27T16:14:22.451Z",\n  "remotes": {\n    "products": {\n      "version": "1.0.1",\n      "url": "http://localhost:4175/v/1.0.1/assets/remoteEntry.js",\n      "owner": "Tim Katalog",\n      "status": "stable",\n      "releasedAt": "2026-10-27T16:20:00.000Z"\n    }\n  }\n}</code></pre><p>Perhatikan bahwa <code>url</code> memuat versi. Saat <code>scripts/release.mjs</code> menyalin build ke <code>cdn/products/1.0.1</code> dan memperbarui manifest, alamat yang dibaca shell ikut berubah. Tidak ada satu baris pun kode shell yang disentuh.</p>'
    },
    {
      type: 'text',
      html: '<h3>Rantai dari Manifest ke RemoteEntry</h3><p>Alurnya pendek, tetapi setiap mata rantai bisa gagal secara berbeda:</p><ol><li>Shell memanggil <code>/api/remotes</code> saat boot.</li><li>Server membaca <code>cdn/manifest.json</code> dan memeriksa apakah <code>cdn/&lt;remote&gt;/&lt;versi&gt;/assets/remoteEntry.js</code> benar-benar ada.</li><li>Bila ada, URL menjadi <code>/v/&lt;versi&gt;/assets/remoteEntry.js</code>; bila tidak, server kembali ke <code>/assets/remoteEntry.js</code> milik build terakhir.</li><li><code>remoteLoader.ts</code> memanggil <code>__federation_method_setRemote</code>, lalu mengambil modul <code>./App</code>.</li></ol><p>Karena manifest dibaca saat runtime, <b>rollback</b> cukup mengganti pointer. Sebaliknya, manifest yang di-cache terlalu lama membuat rollback tidak terlihat oleh pengguna. Atur <code>Cache-Control: no-cache</code> untuk endpoint ini.</p>'
    },
    {
      type: 'example',
      title: 'remoteLoader.ts: URL dari manifest, fallback dari build',
      lang: 'ts',
      output: false,
      code: `import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { RemoteAppProps, RemoteManifest, RemoteName } from '@tokomicro/contracts';
import {
  __federation_method_getRemote,
  __federation_method_setRemote,
  __federation_method_unwrapDefault
} from 'virtual:__federation__';

/* Fallback build-time: dipakai bila manifest gagal dimuat. */
const fallbackLoaders: Record<RemoteName, () => Promise<unknown>> = {
  header: () => import('header/App'),
  products: () => import('products/App'),
  cart: () => import('cart/App'),
  account: () => import('account/App')
};

export interface RemoteLoadInfo {
  name: RemoteName;
  ms: number;
}

export function createRemoteComponent(
  name: RemoteName,
  label: string,
  manifestRef: { current: RemoteManifest | null },
  onLoaded?: (info: RemoteLoadInfo) => void
): LazyExoticComponent<ComponentType<RemoteAppProps>> {
  return lazy(async () => {
    const started = performance.now();
    const url = manifestRef.current?.remotes[name]?.url;
    let module: unknown;

    if (url) {
      __federation_method_setRemote(name, {
        url: () => Promise.resolve(url),
        format: 'esm',
        from: 'vite'
      });
      module = await __federation_method_getRemote(name, './App');
    } else {
      module = await fallbackLoaders[name]();
    }

    const Component = __federation_method_unwrapDefault(module);
    const ms = performance.now() - started;
    console.info('[shell] remote "' + label + '" siap dalam ' + ms.toFixed(0) + ' ms');
    onLoaded?.({ name, ms });

    return { default: Component as ComponentType<RemoteAppProps> };
  });
}`,
      explain: [
        'Manifest hanya mengganti alamat; nama ekspos <code>./App</code> tetap sama. Inilah kontrak minimum antara shell dan remote.',
        'Fallback build-time penting agar aplikasi tetap bisa dibuka saat <code>/api/remotes</code> sedang bermasalah.',
        'Fungsi ini dipanggil di dalam <code>lazy</code>, jadi pemuatan remote tetap memakai <code>Suspense</code> dan error boundary.',
        '<code>onLoaded</code> memberi shell durasi muat untuk dikirim sebagai <code>remote_load_ms</code>, tanpa remote perlu tahu tentang telemetri.'
      ]
    },
    {
      type: 'example',
      title: 'Feature flag: tiga saklar yang sering dipakai',
      lang: 'tsx',
      output: false,
      code: `import type { AppContext } from '@tokomicro/contracts';
import { Button } from '@tokomicro/ui-kit';

export function CheckoutButton({ ctx }: { ctx: AppContext }) {
  const label = ctx.flags.newCheckout ? 'Bayar sekarang' : 'Buat pesanan';
  return (
    <Button variant="primary" onClick={() => ctx.navigate('/keranjang/checkout')}>
      {label}
    </Button>
  );
}

/* Shell memilih remote berdasarkan flag dan sesi. */
function AccountRoute({ ctx }: { ctx: AppContext }) {
  if (!ctx.flags.accountRemote) {
    return <p>Halaman akun sedang dipelihara. Coba beberapa saat lagi.</p>;
  }
  return ctx.user ? <AccountRemote ctx={ctx} /> : <Navigate to="/masuk" replace />;
}

/* Aplikasi lama tetap tersedia sebagai jalur mundur. */
const legacy = ctx.flags.legacyCatalog ? '/katalog-lama' : '/katalog';`,
      explain: [
        '<code>newCheckout</code> mengubah perilaku tanpa merilis ulang remote: cukup ubah nilai flag di server.',
        '<code>accountRemote</code> bekerja sebagai kill switch. Bila remote akun bermasalah, shell menampilkan pesan pemeliharaan alih-alih kotak error.',
        '<code>legacyCatalog</code> menjaga jalur migrasi: pengguna bisa kembali ke katalog lama saat katalog baru bermasalah.',
        'Flag dibaca dari <code>ctx</code>, bukan dari variabel global, agar remote tetap bisa diuji dengan nilai berbeda.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: rilis 1.0.1, cek manifest, lalu rollback',
      lang: 'bash',
      output: false,
      code: `# 1. Bangun artefak dan jalankan enam origin.
npm run build
npm start

# 2. Rilis remote produk versi baru. Shell tidak ikut dibangun.
npm run release -- products 1.0.1

# 3. Lihat pointer yang dibaca shell.
curl -s http://localhost:4173/api/remotes | python3 -m json.tool

#    Cari "products". URL harus berubah menjadi:
#    http://localhost:4175/v/1.0.1/assets/remoteEntry.js

# 4. Buka http://localhost:4173/status untuk melihat versi dan URL.
#    Muat ulang shell: remote produk dimuat dari folder versi baru.

# 5. Rollback ke versi stabil sebelumnya.
npm run rollback -- products

# 6. Pastikan URL kembali ke versi lama tanpa build ulang.
curl -s http://localhost:4173/api/remotes | python3 -m json.tool`,
      explain: [
        'Perintah rilis hanya menyalin <code>apps/products/dist</code> ke <code>cdn/products/1.0.1</code> dan memperbarui manifest secara atomik.',
        'Jika langkah 3 masih menampilkan URL lama, periksa cache atau pastikan server membaca <code>cdn/manifest.json</code> yang benar.',
        'Rollback tidak menghapus versi baru. Artefaknya tetap ada sehingga kamu bisa merilis ulang atau membandingkan keduanya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: URL Berubah Tanpa Build Shell</h3><p>Uji pemahamanmu dengan daftar ini. Semua harus benar sebelum kamu menganggap manifest berfungsi:</p><ul><li><code>/api/remotes</code> menampilkan empat remote dengan <code>version</code>, <code>url</code>, <code>owner</code>, dan <code>status</code>.</li><li>Setelah <code>npm run release -- products 1.0.1</code>, URL produk memakai <code>/v/1.0.1/assets/remoteEntry.js</code>.</li><li>Folder <code>apps/shell/dist</code> tidak berubah setelah rilis tersebut.</li><li>Halaman <code>/status</code> menampilkan versi baru, dan katalog tetap dapat dipakai.</li><li>Setelah <code>npm run rollback -- products</code>, URL kembali ke versi sebelumnya dan halaman tetap hidup.</li></ul><p>Bila salah satu gagal, jangan lanjut ke canary. Perbaiki dulu rantai manifestnya.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Menimpa Artefak dan Jangan Meng-cache Manifest',
      text: 'Dua kesalahan ini sama-sama menghapus kemampuan rollback. Pertama, menimpa folder <code>cdn/products/1.0.1</code> dengan build baru membuat versi lama lenyap. Kedua, meng-cache <code>/api/remotes</code> atau <code>remoteEntry.js</code> dengan <code>max-age</code> panjang membuat browser tetap memakai pointer lama. Simpan artefak per versi, kirim <code>no-cache</code> untuk manifest dan <code>remoteEntry.js</code>, dan gunakan <code>immutable</code> hanya untuk aset ber-hash.'
    },
    {
      type: 'tip',
      title: 'Canary Dulu, Flag Kemudian',
      text: 'Rilis versi baru sebagai <code>canary</code>, arahkan sebagian kecil pengguna lewat flag atau bobot, lalu pantau error rate dan <code>remote_load_ms</code>. Bila aman, ubah status menjadi <code>stable</code>. Feature flag adalah jaring pengaman berikutnya: mematikan fitur jauh lebih cepat daripada membangun dan merilis ulang remote.'
    },
    {
      type: 'vocab',
      items: [
        ['Manifest', 'Daftar remote beserta versi, URL, pemilik, dan status rilis yang dibaca shell saat runtime.'],
        ['Pointer', 'Nilai kecil yang menunjuk ke artefak sebenarnya; di sini versi dan URL remote.'],
        ['remoteEntry.js', 'Berkas pintu masuk remote yang dimuat shell sebelum mengambil modul ./App.'],
        ['virtual:__federation__', 'Modul virtual dari plugin federasi yang menyediakan API runtime untuk mengganti URL remote.'],
        ['Fallback build-time', 'URL remote yang ditanam saat build dan dipakai bila manifest tidak tersedia.'],
        ['Feature flag', 'Saklar runtime untuk menyalakan atau mematikan fitur tanpa mengubah build.'],
        ['Canary', 'Rilis ke sebagian kecil pengguna untuk menguji versi baru sebelum dipakai semua orang.'],
        ['Rollback', 'Mengembalikan pointer manifest ke versi yang sebelumnya stabil.']
      ]
    }
  ],
  recap: [
    'Manifest memisahkan versi remote dari build shell; shell membaca pointer saat runtime.',
    '/api/remotes membentuk URL /v/<versi>/assets/remoteEntry.js dari cdn/manifest.json.',
    'remoteLoader.ts memakai virtual:__federation__ dan menyediakan fallback build-time.',
    'Feature flag mengatur perilaku fitur dan menjadi kill switch, bukan pengganti versioning.',
    'Rilis canary dan rollback hanya mengubah manifest; artefak lama harus tetap tersedia.'
  ]
});
