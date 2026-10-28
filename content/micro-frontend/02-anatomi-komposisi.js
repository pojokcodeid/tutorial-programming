/* ============================================================
   Pelajaran Micro-Frontend — Bab 2: Anatomi & Teknik Komposisi
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-anatomi',
  title: 'Anatomi, Batas Tanggung Jawab, dan Tujuh Teknik Komposisi',
  chapter: 'Fondasi',
  duration: '20 menit',
  intro: [
    'Setiap micro-frontend, apa pun tooling-nya, tersusun dari tiga bagian yang sama: <b>shell</b>, <b>remote</b>, dan <b>shared module</b>. Kamu perlu mengenali peran ketiganya sebelum menghafal nama pustaka atau konfigurasi bundler.',
    'Setelah anatominya jelas, pertanyaan berikutnya adalah <b>bagaimana</b> remote digabungkan. Ada tujuh teknik yang umum dipakai, dari iframe sampai edge-side include. Masing-masing punya biaya, risiko, dan konteks yang berbeda; tidak ada pemenang mutlak.',
    'Bab ini membantumu memilih teknik dengan alasan yang bisa dipertanggungjawabkan. Untuk TokoMicro React, pilihan jatuh pada <b>Module Federation</b>, tetapi kamu tetap perlu tahu kapan iframe atau paket monorepo justru lebih tepat.'
  ],
  objectives: [
    'Menjelaskan tugas shell, remote, dan shared module beserta batasannya',
    'Membandingkan tujuh teknik komposisi micro-frontend',
    'Memilih teknik komposisi sesuai kebutuhan tim dan produk',
    'Menuliskan kontrak remote yang tidak membocorkan detail internal',
    'Mendokumentasikan keputusan komposisi dalam ADR'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi Tiga Bagian</h3><p><b>Shell</b> adalah pemilik halaman: layout, peta URL, login, error boundary, dan design token. <b>Remote</b> adalah aplikasi kecil yang mengisi slot di halaman dan memiliki API sendiri. <b>Shared module</b> adalah kode yang benar-benar disepakati bersama: state keranjang, kontrak <code>ctx</code>, dan utilitas format.</p><p>Batas paling penting: shell tidak boleh tahu isi internal remote, dan remote tidak boleh mengimpor berkas internal remote lain. Bila batas ini dilanggar, kamu kembali ke monolith yang lebih sulit dilacak, tetapi dengan biaya operasional micro-frontend.</p><p>Pada TokoMicro, shell menyediakan <code>BrowserRouter</code>. Remote hanya merender <code>&lt;Routes&gt;</code> bersarang di dalam rute yang diberikan shell, misalnya products di <code>/katalog/*</code>. Saat berdiri sendiri, remote memakai <code>MemoryRouter</code> agar tidak menabrak URL host.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Batas shell, remote, dan shared module pada TokoMicro"><rect x="20" y="18" width="720" height="110" rx="10" class="u-box"/><text x="40" y="44" class="u-title">SHELL :4173</text><text x="40" y="64" class="u-lbl">BrowserRouter · layout · login · token di memori · error boundary · token --tm-*</text><rect x="40" y="76" width="205" height="38" rx="7" class="u-hl"/><text x="142" y="100" class="u-lbl" text-anchor="middle">tidak tahu isi remote</text><rect x="275" y="76" width="205" height="38" rx="7" class="u-hl"/><text x="377" y="100" class="u-lbl" text-anchor="middle">memuat lewat kontrak</text><rect x="510" y="76" width="205" height="38" rx="7" class="u-hl"/><text x="612" y="100" class="u-lbl" text-anchor="middle">menyediakan ctx</text><rect x="40" y="156" width="200" height="78" rx="8" class="u-box"/><text x="140" y="181" class="u-title" text-anchor="middle">header :4174</text><text x="140" y="200" class="u-lbl" text-anchor="middle">badge · navigasi</text><text x="140" y="217" class="u-lbl" text-anchor="middle">tanpa API sendiri</text><rect x="280" y="156" width="200" height="78" rx="8" class="u-box"/><text x="380" y="181" class="u-title" text-anchor="middle">products :4175</text><text x="380" y="200" class="u-lbl" text-anchor="middle">katalog · filter</text><text x="380" y="217" class="u-lbl" text-anchor="middle">GET /api/products</text><rect x="520" y="156" width="200" height="78" rx="8" class="u-box"/><text x="620" y="181" class="u-title" text-anchor="middle">cart :4176</text><text x="620" y="200" class="u-lbl" text-anchor="middle">jumlah · checkout</text><text x="620" y="217" class="u-lbl" text-anchor="middle">POST /api/orders</text><line x1="140" y1="234" x2="140" y2="262" class="u-dash"/><line x1="380" y1="234" x2="380" y2="262" class="u-dash"/><line x1="620" y1="234" x2="620" y2="262" class="u-dash"/><rect x="150" y="264" width="460" height="30" rx="7" class="u-hl"/><text x="380" y="284" class="u-lbl" text-anchor="middle">shared: kontrak ctx · state keranjang · i18n · telemetry · ui-kit</text></svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Shell memiliki halaman; setiap remote memiliki rute dan API-nya; shared module menyimpan kesepakatan</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Kontrak remote dalam TypeScript',
      lang: 'tsx',
      output: false,
      code: `// packages/contracts/src/index.ts
export interface AppContext {
  route: string;
  params: URLSearchParams;
  navigate(path: string, options?: { replace?: boolean }): void;
  toast(message: string, type?: 'info' | 'success' | 'error'): void;
  user: User | null;
  getToken(): Promise<string | null>;
}

export interface RemoteAppProps {
  ctx: AppContext;
}

// apps/products/src/App.tsx
import { Route, Routes } from 'react-router-dom';
import type { RemoteAppProps } from '@tokomicro/contracts';

export default function Products({ ctx }: RemoteAppProps) {
  return (
    <Routes>
      <Route index element={<ProductList ctx={ctx} />} />
      <Route path="detail/:id" element={<ProductDetail ctx={ctx} />} />
    </Routes>
  );
}

// apps/shell/src/App.tsx
<Route path="/katalog/*" element={<RemoteSlot name="products" ctx={ctx} />} />`,
      explain: [
        'Kontraknya kecil: nama modul, nama ekspos <code>./App</code>, dan props <code>{ ctx }</code>. Struktur folder serta komponen internal remote tidak menjadi bagian kontrak.',
        'Remote memakai <code>&lt;Routes&gt;</code> bersarang karena shell sudah memiliki <code>BrowserRouter</code>. Remote tidak membuat router baru saat berjalan di dalam shell.',
        'Saat mandiri, <code>main.tsx</code> remote membungkus <code>App</code> dengan <code>MemoryRouter</code>, sehingga pengujian tidak mengubah URL shell.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tujuh Teknik Komposisi</h3><table class="vocab"><tr><th>Teknik</th><th>Cara kerja</th><th>Kelebihan</th><th>Kekurangan</th></tr><tr><td><b>iframe</b></td><td>Tiap remote adalah dokumen dan origin sendiri</td><td>Isolasi CSS/JS paling kuat</td><td>Sizing, SEO, fokus, dan UX terpecah</td></tr><tr><td><b>Web Components</b></td><td>Remote mendaftarkan custom element</td><td>Tahan framework, batas jelas</td><td>Styling, event, dan aksesibilitas perlu usaha</td></tr><tr><td><b>Module Federation</b></td><td>Bundler bertukar modul saat runtime lewat remoteEntry.js</td><td>Rilis mandiri, React dapat singleton</td><td>Terikat tooling dan versi dependensi</td></tr><tr><td><b>Import maps</b></td><td>Browser memetakan nama modul ke URL ESM</td><td>Tanpa bundler, standar web</td><td>Kontrol versi dan fallback masih manual</td></tr><tr><td><b>Server-side include</b></td><td>Server menyatukan potongan HTML sebelum dikirim</td><td>Sederhana, TTFB baik</td><td>Interaktivitas tetap di client</td></tr><tr><td><b>Edge-side include</b></td><td>CDN/edge merakit fragmen dari beberapa origin</td><td>Cache per fragmen, dekat pengguna</td><td>Debugging dan konsistensi lebih rumit</td></tr><tr><td><b>Paket monorepo</b></td><td>Remote dipublikasikan sebagai paket lalu di-bundle shell</td><td>Paling sederhana dan type-safe</td><td>Rilis remote menunggu build shell</td></tr></table><p>Perhatikan bahwa dua teknik terakhir mengomposisi di server atau saat build, bukan di browser. Pilihan teknik adalah pilihan <b>di mana</b> dan <b>kapan</b> penggabungan terjadi.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: memilih teknik untuk tiga skenario',
      lang: 'text',
      output: false,
      code: `SKENARIO 1 — Aplikasi legacy :4178
  jQuery, CSS global, SEO tidak penting, tim akan menghapusnya
  dalam 6 bulan.
  PILIHAN: iframe.
  Alasan: isolasi penuh dan migrasi tidak mengganggu shell.

SKENARIO 2 — Header dan katalog TokoMicro
  Tim berbeda, React 18, butuh rilis mandiri, satu sesi login.
  PILIHAN: Module Federation.
  Alasan: remoteEntry.js per remote, shared React singleton,
  kontrak ctx yang sama.

SKENARIO 3 — Footer statis dan halaman bantuan
  Berubah 2 kali setahun, tidak punya tim khusus, tidak butuh
  state atau API.
  PILIHAN: paket monorepo atau server-side include.
  Alasan: build-time sudah cukup; menambah remote hanya
  menambah origin dan pipeline tanpa manfaat.`,
      explain: [
        'Pertanyaan pertama bukan "teknik mana yang paling modern", melainkan "siapa pemiliknya, seberapa sering berubah, dan seberapa kuat isolasi yang dibutuhkan".',
        'Skenario 1 memilih iframe karena batas organisasi dan teknologinya benar-benar asing. Skenario 3 justru menghindari micro-frontend karena tidak ada masalah yang perlu diselesaikan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checkpoint Pemilihan Teknik</h3><ol><li>Tulis satu kalimat masalah yang ingin diselesaikan, bukan nama teknik.</li><li>Tentukan pemilik setiap bagian dan ritme rilisnya.</li><li>Putuskan apakah isolasi CSS/JS harus mutlak; jika ya, iframe patut dipertimbangkan.</li><li>Periksa apakah semua pihak memakai framework dan versi yang sama; jika ya, Module Federation lebih murah.</li><li>Hitung jumlah origin dan pipeline baru yang akan kamu rawat.</li><li>Simpan keputusan beserta alternatif yang ditolak di ADR.</li></ol><p><b>Verifikasi:</b> kamu berhasil bila dapat menjelaskan mengapa teknik yang dipilih lebih murah daripada dua alternatif terdekat, bukan hanya mengapa teknik itu bisa bekerja.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Menaruh Semua Hal di Shared Module',
      text: 'Shared module adalah kontrak paling mahal: satu perubahan di sana bisa memaksa semua tim menyesuaikan diri. Isi hanya yang benar-benar dipakai bersama, seperti kontrak ctx, state keranjang, token desain, dan utilitas murni. Jangan jadikan shared module tempat sampah kode umum, dan jangan pernah mengimpor berkas internal remote lain secara langsung.'
    },
    {
      type: 'tip',
      title: 'Mulai dari Satu Kontrak, Bukan Sepuluh',
      text: 'Kontrak awal cukup: nama remote, nama ekspos, props <code>ctx</code>, awalan CSS, dan API yang dipanggil. Tambahkan kontrak baru hanya ketika ada kebutuhan nyata. Kontrak yang gemuk adalah tanda batas tim mulai kabur.'
    },
    {
      type: 'vocab',
      items: [
        ['Shell', 'Aplikasi induk yang memiliki URL, layout, login, dan pemuatan remote.'],
        ['Remote', 'Aplikasi kecil dengan build sendiri yang dimuat shell lewat kontrak.'],
        ['Shared module', 'Kode yang dipakai bersama dan menjadi tanggung jawab semua tim pemakainya.'],
        ['Module Federation', 'Teknik bundler untuk berbagi modul dan dependensi saat runtime.'],
        ['remoteEntry.js', 'Berkas pintu masuk remote yang dimuat shell.'],
        ['Import map', 'Pemetaan nama modul ke URL yang dipahami browser tanpa bundler.'],
        ['ESI/SSI', 'Edge-side atau server-side include: penggabungan fragmen HTML di server/CDN.'],
        ['Kontrak', 'Kesepakatan bentuk data dan fungsi antar pihak, misalnya props ctx.'],
        ['Komposisi runtime', 'Penggabungan remote yang terjadi di browser saat halaman dibuka.']
      ]
    }
  ],
  recap: [
    'Tiga bagian micro-frontend: shell, remote, dan shared module, masing-masing dengan batas jelas.',
    'Shell memiliki BrowserRouter dan halaman; remote memakai Routes bersarang, atau MemoryRouter saat mandiri.',
    'Ada tujuh teknik komposisi; masing-masing berbeda pada tempat dan waktu penggabungan.',
    'Module Federation dipilih TokoMicro karena rilis mandiri dan React dapat dimuat sekali.',
    'Shared module harus kurus karena setiap isinya mengikat beberapa tim.'
  ]
});
