/* ============================================================
   Pelajaran Micro-Frontend — Bab 12: Error Boundary, Suspense & Isolasi
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-resilience',
  title: 'Error Boundary, Suspense, dan Isolasi Kegagalan',
  chapter: 'Identitas & Ketahanan',
  duration: '18 menit',
  intro: [
    'Pada arsitektur monolith, satu galat JavaScript bisa membuat seluruh halaman putih. Pada micro-frontend, risikonya lebih besar karena kegagalan bisa datang dari empat origin berbeda, jaringan yang lambat, atau versi remote yang baru saja dirilis. Pertanyaannya bukan "bagaimana mencegah semua galat", melainkan <b>seberapa jauh kerusakan menyebar</b>.',
    'Prinsipnya sederhana: kegagalan satu remote harus berhenti di slotnya. Header tetap bisa dipakai, navigasi tetap berjalan, dan pengguna masih bisa membuka halaman lain. Untuk itu kamu membutuhkan tiga lapis: <b>error boundary</b> untuk galat render, <b>Suspense</b> untuk keadaan menunggu, dan <b>timeout</b> untuk pemuatan yang tidak pernah selesai.',
    'Bab ini menunjukkan cara memasang ketiganya di TokoMicro React, membatasi retry agar tidak menjadi badai permintaan, serta menguji isolasi dengan memblokir origin cart 4176 dari browser. Kamu akan melihat sendiri bahwa header tetap hidup saat keranjang mati.'
  ],
  objectives: [
    'Memasang error boundary per remote, bukan satu boundary global',
    'Menghubungkan Suspense dengan skeleton yang sesuai ukuran konten',
    'Menerapkan timeout dan batas retry pada pemuatan remote',
    'Menguji isolasi kegagalan dengan memblokir satu origin',
    'Mencatat kegagalan remote beserta konteks yang berguna'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Bentuk Kegagalan yang Berbeda</h3><p>Remote bisa gagal dengan cara yang tidak sama, dan penanganannya pun berbeda:</p><ul><li><b>Gagal diunduh.</b> <code>import()</code> ditolak karena origin mati, CORS salah, atau <code>remoteEntry.js</code> 404. Ini muncul sebagai promise rejection saat lazy loading.</li><li><b>Gagal dirender.</b> Modul berhasil dimuat, tetapi komponen melempar galat saat render, misalnya karena data berbentuk tak terduga.</li><li><b>Terlalu lambat.</b> Tidak ada galat, tetapi promise tidak pernah selesai. Tanpa timeout, pengguna melihat skeleton selamanya.</li></ul><p>Error boundary menangani dua kasus pertama. Untuk kasus ketiga, kamu perlu membungkus pemuatan dengan batas waktu.</p>'
    },
    {
      type: 'text',
      html: '<h3>Suspense Bukan Pengganti Error Boundary</h3><p><code>Suspense</code> hanya menampilkan fallback selama komponen lazy belum siap. Ia tidak menangkap galat. Sebaliknya, error boundary tidak tahu apakah anaknya sedang menunggu atau sudah selesai. Karena itu susunannya selalu:</p><pre><code class="language-tsx">&lt;ErrorBoundary fallback={...}&gt;\n  &lt;Suspense fallback={&lt;Skeleton /&gt;}&gt;\n    &lt;Remote ctx={ctx} /&gt;\n  &lt;/Suspense&gt;\n&lt;/ErrorBoundary&gt;</code></pre><p>Skeleton sebaiknya menyerupai ukuran konten akhir. Lompatan layout besar saat remote muncul akan meningkatkan CLS dan membuat halaman terasa lebih lambat daripada sebenarnya.</p>'
    },
    {
      type: 'example',
      title: 'Error boundary per remote dengan kunci attempt',
      lang: 'tsx',
      output: false,
      code: `import { Suspense, useMemo } from 'react';
import type { AppContext, RemoteManifest, RemoteName } from '@tokomicro/contracts';
import ErrorBoundary from './ErrorBoundary';
import { createRemoteComponent, type RemoteLoadInfo } from './remoteLoader';

interface Props {
  name: RemoteName;
  label: string;
  ctx: AppContext;
  manifestRef: { current: RemoteManifest | null };
  attempt: number;
  onRetry: () => void;
  onLoaded: (info: RemoteLoadInfo) => void;
}

export function RemoteSlot({
  name, label, ctx, manifestRef, attempt, onRetry, onLoaded
}: Props) {
  const Remote = useMemo(
    () => createRemoteComponent(name, label, manifestRef, onLoaded),
    [name, label, manifestRef, onLoaded, attempt]
  );

  return (
    <ErrorBoundary
      name={name}
      key={name + ':' + attempt}
      onError={(error) => ctx.telemetry.error(error, { remote: name, attempt })}
      fallback={
        <div className="error-box" role="alert">
          <h2>Modul {label} tidak dapat dimuat</h2>
          <p>Kerusakan terisolasi. Shell dan modul lain tetap berfungsi.</p>
          <button onClick={onRetry}>Coba lagi</button>
        </div>
      }
    >
      <Suspense fallback={<div className="skeleton" aria-hidden="true" />}>
        <Remote ctx={ctx} />
      </Suspense>
    </ErrorBoundary>
  );
}`,
      explain: [
        '<code>key={name + ":" + attempt}</code> memaksa React memasang ulang boundary dan lazy component saat retry. Tanpa kunci baru, state galat lama bisa bertahan.',
        'Boundary membungkus <b>satu slot</b>. Kegagalan katalog tidak menyentuh header, dan sebaliknya.',
        '<code>role="alert"</code> memberi tahu pembaca layar bahwa ada bagian yang gagal dimuat.',
        '<code>onError</code> mengirim nama remote dan nomor percobaan, bukan hanya pesan galat.'
      ]
    },
    {
      type: 'example',
      title: 'Timeout dan batas retry di lapisan loader',
      lang: 'ts',
      output: false,
      code: `const MAX_ATTEMPT = 2;
const LOAD_TIMEOUT_MS = 8000;

export class RemoteTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super('Remote ' + label + ' tidak merespons dalam ' + ms + ' ms');
    this.name = 'RemoteTimeoutError';
  }
}

export async function withTimeout<T>(
  task: Promise<T>,
  label: string,
  ms = LOAD_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new RemoteTimeoutError(label, ms)), ms);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* Di komponen: retry berhenti setelah dua percobaan. */
export function nextAttempt(current: number): number {
  return Math.min(current + 1, MAX_ATTEMPT);
}`,
      explain: [
        'Timeout mengubah pemuatan yang menggantung menjadi galat yang bisa ditangkap error boundary.',
        'Batas dua percobaan mencegah tombol <b>Coba lagi</b> berubah menjadi badai permintaan ke origin yang sedang mati.',
        'Saat batas tercapai, tampilkan pesan yang jujur dan arahkan pengguna ke halaman lain, bukan tombol yang tidak berguna.',
        'Di produksi, kirim <code>RemoteTimeoutError</code> ke telemetry agar kamu tahu remote mana yang lambat.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: blokir origin cart dan pastikan header tetap hidup',
      lang: 'js',
      output: false,
      code: `import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

/* 1. Rusak seluruh origin remote keranjang. */
await page.route('http://localhost:4176/**', (route) => route.abort());
await page.goto('http://localhost:4173/keranjang', { waitUntil: 'domcontentloaded' });

/* 2. Fallback muncul hanya di slot keranjang. */
await page.getByRole('heading', { name: /Modul Keranjang tidak dapat dimuat/ })
  .waitFor({ timeout: 20000 });

/* 3. Header dari origin 4174 tetap terlihat. */
await page.locator('header.hd').waitFor({ state: 'visible', timeout: 10000 });

/* 4. Pulihkan jaringan, lalu tekan Coba lagi. */
await page.unroute('http://localhost:4176/**');
await page.getByRole('button', { name: 'Coba lagi' }).click();
await page.getByRole('button', { name: 'Buat pesanan' }).waitFor({ timeout: 15000 });

await browser.close();`,
      explain: [
        'Memblokir <code>http://localhost:4176/**</code> mensimulasikan tim transaksi yang origin-nya mati, tanpa perlu menghentikan server.',
        'Yang diperiksa bukan hanya fallback, tetapi juga <b>bagian lain yang harus tetap hidup</b>: header dan navigasi.',
        'Setelah rute diblokir dibuka, tombol Coba lagi harus memuat ulang remote karena kunci <code>attempt</code> berubah.',
        'Uji yang sama ada di <code>e2e-smoke.mjs</code> bagian isolasi kegagalan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checkpoint Isolasi</h3><p>Jalankan skenario di atas, lalu pastikan semua poin berikut:</p><ul><li>Halaman <code>/keranjang</code> menampilkan judul <b>Modul Keranjang tidak dapat dimuat</b>, bukan layar putih.</li><li>Header, logo, navigasi, dan tombol tema masih berfungsi.</li><li>Rute <code>/katalog</code> masih bisa dibuka dan katalog tetap tampil.</li><li>Console menunjukkan satu galat yang menyebut remote <code>cart</code>, bukan puluhan galat berantai.</li><li>Setelah jaringan dipulihkan, tombol <b>Coba lagi</b> memuat keranjang tanpa reload halaman penuh.</li><li>Telemetry menerima event error dengan <code>remote: "cart"</code> dan nomor <code>attempt</code>.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Satu Boundary Global dan Retry Tanpa Batas',
      text: 'Membungkus seluruh aplikasi dengan satu error boundary membuat galat keranjang mengganti seluruh halaman, termasuk header. Itu sama saja meniadakan manfaat isolasi. Sebaliknya, tombol retry tanpa batas dapat membanjiri origin yang sedang mati dan memperparah insiden. Pasang boundary per slot, batasi percobaan, dan beri jeda sebelum percobaan berikutnya.'
    },
    {
      type: 'tip',
      title: 'Fallback Header Harus Benar-benar Mandiri',
      text: 'Saat remote header gagal, fallback-nya tidak boleh mengimpor komponen dari remote lain. Cukup logo dan tautan katalog yang ditulis langsung di shell. Uji fallback ini dengan memblokir 4174; bila header fallback ikut bergantung pada remote yang sama, kegagalan akan berputar tanpa akhir.'
    },
    {
      type: 'vocab',
      items: [
        ['Error boundary', 'Komponen React yang menangkap galat render di bawahnya dan menampilkan fallback.'],
        ['Suspense', 'Mekanisme React untuk menampilkan fallback selama komponen lazy belum siap.'],
        ['Blast radius', 'Luas bagian aplikasi yang terdampak oleh satu kegagalan.'],
        ['Skeleton', 'Placeholder berbentuk konten yang memberi petunjuk tata letak saat menunggu.'],
        ['Timeout', 'Batas waktu sebelum operasi asinkron dianggap gagal.'],
        ['Retry', 'Percobaan ulang memuat remote setelah kegagalan sementara.'],
        ['Kill switch', 'Saklar untuk mematikan fitur atau remote bermasalah dengan cepat.'],
        ['Graceful degradation', 'Penurunan kemampuan secara terkendali tanpa membuat aplikasi mati total.']
      ]
    }
  ],
  recap: [
    'Kegagalan remote harus berhenti di slotnya; header dan rute lain tetap hidup.',
    'Error boundary menangani galat unduh dan render; Suspense hanya menangani keadaan menunggu.',
    'Timeout mengubah pemuatan yang menggantung menjadi galat yang bisa ditangani.',
    'Kunci name:attempt memaksa pemasangan ulang saat pengguna menekan Coba lagi.',
    'Batasi retry dan uji isolasi dengan memblokir origin remote di browser.'
  ]
});
