/* ============================================================
   Pelajaran Micro-Frontend — Bab 14: Observability & Web Vitals
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-observability',
  title: 'Observability: Telemetry, Web Vitals, dan Status',
  chapter: 'Kualitas & Operasi',
  duration: '19 menit',
  intro: [
    'Saat pengguna melapor "aplikasinya lambat", kamu perlu menjawab pertanyaan yang lebih tajam: remote mana yang lambat, versi berapa yang sedang aktif, dan apakah masalahnya di jaringan, render, atau API? Tanpa data, jawabannya hanya tebakan.',
    '<b>Observability</b> adalah kemampuan menjawab pertanyaan itu dari luar sistem. Di TokoMicro React, jawabannya datang dari tiga sinyal: <b>event</b> untuk alur pengguna, <b>error</b> untuk kegagalan, dan <b>metric</b> untuk angka seperti <code>boot_ms</code>, <code>remote_load_ms</code>, serta Web Vitals LCP, CLS, dan INP.',
    'Semua sinyal dikirim ke <code>/api/telemetry</code> dan diringkas di <code>/api/metrics/summary</code>. Halaman <code>/status</code> menampilkan versi remote sekaligus angka telemetri. Bab ini juga membahas batas privasi: data yang berguna tidak boleh berubah menjadi kebocoran PII.'
  ],
  objectives: [
    'Membedakan event, error, dan metric serta memilih sinyal yang tepat',
    'Mengirim telemetri dengan sendBeacon dan fallback fetch keepalive',
    'Mencatat boot_ms, remote_load_ms, dan Web Vitals LCP/CLS/INP',
    'Menambahkan metrik checkout_ms dan memverifikasinya di /status',
    'Menjaga privasi data serta menetapkan alert yang masuk akal'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Sinyal, Satu Amplop</h3><p>Setiap kiriman telemetri memakai amplop yang sama: <code>app</code>, <code>type</code>, <code>name</code>, <code>value</code>, <code>payload</code>, dan <code>at</code>. Tiga tipe yang dipakai:</p><ul><li><b>event</b> — sesuatu terjadi: <code>page_view</code>, <code>add_to_cart</code>, <code>checkout_completed</code>.</li><li><b>error</b> — sesuatu gagal: nama galat, pesan, stack, dan konteks seperti <code>remote: "cart"</code>.</li><li><b>metric</b> — sesuatu bisa diukur: <code>boot_ms</code>, <code>remote_load_ms</code>, <code>LCP</code>, <code>CLS</code>, <code>INP</code>.</li></ul><p>Jangan memakai event untuk hal yang bisa dihitung sebagai metrik, dan jangan mengirim metric tanpa nama yang stabil. Nama adalah kontrak; kalau berubah-ubah, grafiknya tidak bisa dibandingkan antar rilis.</p>'
    },
    {
      type: 'text',
      html: '<h3>Web Vitals dan Konteks Remote</h3><p><b>LCP</b> mengukur kapan elemen terbesar terlihat, <b>CLS</b> mengukur pergeseran layout, dan <b>INP</b> mengukur respons terhadap interaksi. Ketiganya dikirim oleh shell melalui <code>web-vitals</code>.</p><p>Angka itu baru berguna bila dikaitkan dengan konteks. Karena itu shell juga mengirim <code>boot_ms</code> — waktu dari mulai boot sampai manifest, flag, dan sesi siap — serta <code>remote_load_ms</code> per remote. Dengan begitu kamu bisa membedakan "shell lambat" dari "remote katalog lambat".</p><p>Korelasi minimum yang perlu ada: <code>app</code>, <code>remote</code>, <code>version</code>, dan waktu. Tanpa versi, kamu tidak tahu apakah lonjakan error berasal dari rilis 1.0.1 atau sudah ada sebelumnya.</p>'
    },
    {
      type: 'example',
      title: 'Paket telemetry: sendBeacon dengan fallback fetch',
      lang: 'ts',
      output: false,
      code: `import type { Telemetry } from '@tokomicro/contracts';

interface Envelope {
  app: string;
  type: 'event' | 'error' | 'metric';
  name: string;
  value?: number;
  payload?: Record<string, unknown>;
  at: string;
}

function send(endpoint: string, envelope: Envelope): void {
  const body = JSON.stringify(envelope);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
  } catch {
    /* sendBeacon bisa diblokir; lanjut ke fetch. */
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {
    /* Telemetri tidak boleh menjatuhkan aplikasi. */
  });
}

export function createTelemetry(app: string, endpoint = '/api/telemetry'): Telemetry {
  const emit = (entry: Omit<Envelope, 'app' | 'at'>) => {
    send(endpoint, { ...entry, app, at: new Date().toISOString() });
  };

  return {
    event: (name, payload) => emit({ type: 'event', name, payload }),
    error: (error, meta) => emit({
      type: 'error',
      name: error instanceof Error ? error.name : 'UnknownError',
      payload: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...meta
      }
    }),
    metric: (name, value, meta) => emit({ type: 'metric', name, value, payload: meta })
  };
}`,
      explain: [
        '<code>sendBeacon</code> cocok untuk telemetri saat halaman akan ditutup karena browser mengirimnya tanpa menahan navigasi.',
        'Fallback <code>fetch</code> dengan <code>keepalive</code> menjaga pengiriman tetap berjalan saat tab berpindah.',
        'Semua kegagalan pengiriman ditelan dengan sengaja. Telemetri yang gagal tidak boleh merusak pengalaman pengguna.',
        'Amplop menyertakan <code>app</code> sehingga ringkasan bisa memisahkan shell, header, products, cart, dan account.'
      ]
    },
    {
      type: 'example',
      title: 'Menghubungkan Web Vitals, boot, dan checkout',
      lang: 'tsx',
      output: false,
      code: `import { useCallback, useEffect } from 'react';
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';
import type { AppContext, Telemetry } from '@tokomicro/contracts';

/* Di shell: kirim LCP, CLS, INP sebagai metrik. */
export function useWebVitals(telemetry: Telemetry) {
  useEffect(() => {
    const report = (metric: Metric) => {
      telemetry.metric(metric.name, metric.value, {
        id: metric.id,
        rating: metric.rating
      });
    };
    onCLS(report);
    onINP(report);
    onLCP(report);
  }, [telemetry]);
}

/* Di shell: catat waktu muat tiap remote. */
const onRemoteLoaded = useCallback(
  (info: { name: string; ms: number }) => {
    telemetry.metric('remote_load_ms', info.ms, { remote: info.name });
  },
  [telemetry]
);

/* Di remote cart: ukur checkout dari klik sampai pesanan diterima. */
async function submitOrder(ctx: AppContext) {
  const started = performance.now();
  const order = await createOrder(ctx);
  ctx.telemetry.metric('checkout_ms', performance.now() - started, {
    remote: 'cart',
    orderId: order.id
  });
  ctx.telemetry.event('checkout_completed', { orderId: order.id });
}`,
      explain: [
        '<code>LCP</code>, <code>CLS</code>, dan <code>INP</code> dikirim dengan nama asli agar dashboard standar bisa membacanya.',
        '<code>remote_load_ms</code> memakai <code>payload.remote</code> supaya satu metrik bisa dipecah per remote.',
        '<code>checkout_ms</code> mengukur pengalaman yang benar-benar penting bagi bisnis, bukan hanya waktu muat halaman.',
        'Kirim metrik setelah operasi selesai. Jangan mengukur waktu antrean atau retry sebagai bagian dari durasi checkout.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: tambah checkout_ms dan lihat angkanya di /status',
      lang: 'bash',
      output: false,
      code: `# 1. Jalankan aplikasi dan buka halaman status.
npm start
open http://localhost:4173/status

# 2. Lihat ringkasan mentah sebelum perubahan.
curl -s http://localhost:4173/api/metrics/summary | python3 -m json.tool

# 3. Tambahkan metrik di remote cart, tepat setelah pesanan berhasil.
#    ctx.telemetry.metric('checkout_ms', performance.now() - started,
#      { remote: 'cart', orderId: order.id });

# 4. Build ulang hanya remote cart, lalu rilis.
npm run build
npm run release -- cart 1.1.0

# 5. Lakukan checkout di browser: katalog -> keranjang -> login -> pesanan.

# 6. Verifikasi bahwa metrik baru masuk.
curl -s http://localhost:4173/api/metrics/summary | python3 -m json.tool
#    "metrics" bertambah, dan "byApp" memuat cart.`,
      explain: [
        'Halaman <code>/status</code> membaca <code>/api/remotes</code> dan <code>/api/metrics/summary</code> sekaligus.',
        'Ringkasan menghitung <code>events</code>, <code>errors</code>, <code>metrics</code>, dan <code>byApp</code>; angka <code>total</code> adalah jumlah semua kiriman.',
        'Metrik <code>checkout_ms</code> baru terlihat setelah ada checkout nyata, bukan setelah build.',
        'Bila angka tidak bertambah, periksa tab Network: pastikan POST ke <code>/api/telemetry</code> mengembalikan 204.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checkpoint Observability</h3><p>Buka <code>http://localhost:4173/status</code> dan pastikan:</p><ul><li>Empat kartu remote tampil dengan versi, pemilik, status, dan URL masing-masing.</li><li>Kartu Telemetry menampilkan jumlah event, error, dan metrik, serta rincian per aplikasi.</li><li>Setelah beberapa navigasi, <code>boot_ms</code>, <code>remote_load_ms</code>, LCP, CLS, dan INP muncul di ringkasan.</li><li>Setelah checkout berhasil, <code>checkout_ms</code> ikut terkirim dengan <code>remote: "cart"</code>.</li><li>Tidak ada token, kata sandi, email lengkap, atau query string sensitif di payload.</li><li>Memblokir <code>/api/telemetry</code> tidak membuat halaman gagal digunakan.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Telemetri Bisa Menjadi Kebocoran Data',
      text: 'Jangan pernah mengirim access token, refresh token, kata sandi, atau isi formulir mentah. Hindari juga URL lengkap yang memuat query sensitif dan email yang tidak perlu. Kirim ID, nama event, durasi, dan konteks teknis secukupnya. Pertimbangkan sampling untuk event bervolume tinggi, dan pastikan pengiriman telemetri tidak pernah menjadi syarat agar aplikasi bisa dipakai.'
    },
    {
      type: 'tip',
      title: 'Alert Berbasis Dampak, Bukan Aktivitas',
      text: 'Alert yang berguna berbunyi saat error rate per remote melewati ambang, LCP p75 memburuk, atau <code>remote_load_ms</code> p95 naik setelah rilis tertentu. Jangan memberi alert untuk setiap error tunggal. Sertakan nama remote dan versi di setiap notifikasi agar orang yang bertugas langsung tahu harus menelepon tim mana.'
    },
    {
      type: 'vocab',
      items: [
        ['Observability', 'Kemampuan memahami kondisi sistem dari event, error, metrik, dan trace.'],
        ['Telemetry', 'Pengumpulan data otomatis tentang perilaku dan kesehatan aplikasi.'],
        ['Envelope', 'Amplop data yang membungkus app, type, name, value, payload, dan waktu.'],
        ['sendBeacon', 'API browser untuk mengirim data kecil tanpa menahan navigasi halaman.'],
        ['Web Vitals', 'Metrik pengalaman pengguna: LCP, CLS, INP, dan metrik pendukung lain.'],
        ['LCP', 'Largest Contentful Paint: waktu elemen terbesar terlihat.'],
        ['CLS', 'Cumulative Layout Shift: jumlah pergeseran layout yang mengganggu.'],
        ['INP', 'Interaction to Next Paint: waktu respons terhadap interaksi pengguna.'],
        ['PII', 'Personally Identifiable Information: data yang dapat mengidentifikasi seseorang.']
      ]
    }
  ],
  recap: [
    'Event mencatat kejadian, error mencatat kegagalan, metric mencatat angka yang bisa dibandingkan.',
    'sendBeacon dan fetch keepalive mengirim telemetri tanpa mengganggu navigasi.',
    'boot_ms dan remote_load_ms memisahkan lambatnya shell dari lambatnya remote.',
    'Web Vitals LCP, CLS, dan INP harus dikaitkan dengan remote dan versi.',
    'Jaga PII, jangan blokir aplikasi karena telemetri, dan alert berdasarkan dampak.'
  ]
});
