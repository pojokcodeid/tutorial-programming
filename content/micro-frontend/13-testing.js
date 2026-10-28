/* ============================================================
   Pelajaran Micro-Frontend — Bab 13: Menguji Micro-Frontend
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-testing',
  title: 'Menguji Micro-Frontend',
  chapter: 'Kualitas & Operasi',
  duration: '18 menit',
  intro: [
    'Micro-frontend memindahkan banyak risiko ke persimpangan antar aplikasi: kontrak <code>ctx</code>, bentuk event, URL manifest, dan perilaku saat satu remote mati. Unit test masing-masing tim bisa hijau semua, tetapi halaman tetap rusak karena kesepakatan di antara mereka berubah.',
    'Karena itu strategi pengujiannya berlapis. Fungsi murni diuji cepat dengan Vitest, kontrak data diuji dengan Zod, komponen diuji dengan Testing Library, alur komposisi diuji dengan Playwright, dan kegagalan remote diuji dengan sengaja memblokir origin. Setiap lapisan menjawab pertanyaan berbeda.',
    'Bab ini juga membahas batas tanggung jawab: kamu akan melihat bahwa shell tidak boleh menguji implementasi internal remote, dan remote tidak boleh menguji seluruh halaman shell. Yang diuji adalah <b>kontrak</b> dan <b>perilaku yang terlihat pengguna</b>, bukan detail privat milik tim lain.'
  ],
  objectives: [
    'Menentukan lapisan pengujian yang tepat untuk setiap risiko',
    'Menulis unit test dan contract test dengan Vitest serta Zod',
    'Menguji komponen remote dengan Testing Library dan ctx palsu',
    'Menjalankan E2E komposisi serta uji isolasi kegagalan',
    'Menghindari pengujian yang terlalu terikat pada implementasi remote'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Piramida yang Menjawab Risiko Berbeda</h3><table class="vocab"><tr><th>Lapisan</th><th>Pertanyaan</th><th>Contoh di TokoMicro</th></tr><tr><td>Unit</td><td>Apakah logikanya benar?</td><td><code>cartSummary</code>, <code>rupiah</code>, <code>changeQty</code></td></tr><tr><td>Contract</td><td>Apakah bentuk datanya masih sesuai?</td><td>Event <code>tokomicro:add-to-cart</code>, manifest remote</td></tr><tr><td>Component</td><td>Apakah UI bereaksi dengan benar?</td><td>Tombol checkout berubah saat flag aktif</td></tr><tr><td>E2E</td><td>Apakah remote benar-benar terpasang?</td><td>Katalog → keranjang → login → pesanan</td></tr><tr><td>Resilience</td><td>Apakah satu remote mati menahan kerusakan?</td><td>Blokir 4176, header tetap hidup</td></tr><tr><td>Visual</td><td>Apakah tampilan tetap konsisten?</td><td>Screenshot terang, gelap, status, mobile</td></tr></table><p>Mulai dari bawah. Unit test murah dan cepat; E2E mahal dan rapuh. Jangan memakai E2E untuk hal yang bisa diperiksa unit test.</p>'
    },
    {
      type: 'text',
      html: '<h3>Uji Kontrak, Bukan Isi Kepala Tim Lain</h3><p>Shell hanya tahu tiga hal tentang remote: nama ekspos <code>./App</code>, bentuk <code>ctx</code>, dan event yang dipertukarkan. Itulah yang boleh diuji dari luar. Shell tidak boleh mengimpor <code>apps/cart/src/Checkout.tsx</code> atau memeriksa nama kelas CSS internal keranjang.</p><p>Sebaliknya, tim cart bertanggung jawab menguji logika checkout-nya sendiri. Ketika kontrak berubah, kedua pihak mengetahuinya lewat contract test yang sama di <code>@tokomicro/contracts</code>. Inilah yang membuat batas tim bertahan saat kode berubah.</p>'
    },
    {
      type: 'example',
      title: 'Contract test Zod: tambah satu pemeriksaan checkout',
      lang: 'ts',
      output: false,
      code: `import { describe, expect, it } from 'vitest';
import {
  checkoutCompletedEventSchema,
  remoteEntrySchema
} from '@tokomicro/contracts';

describe('kontrak checkout', () => {
  it('menerima event checkout yang lengkap', () => {
    const result = checkoutCompletedEventSchema.safeParse({
      orderId: 'ORD-9F2A',
      total: 1_170_000
    });
    expect(result.success).toBe(true);
  });

  it('menolak total negatif', () => {
    const result = checkoutCompletedEventSchema.safeParse({
      orderId: 'ORD-9F2A',
      total: -1
    });
    expect(result.success).toBe(false);
  });
});

describe('entri manifest', () => {
  it('menolak URL remote yang relatif', () => {
    const result = remoteEntrySchema.safeParse({
      version: '1.0.1',
      url: '/v/1.0.1/assets/remoteEntry.js',
      owner: 'Tim Transaksi',
      status: 'stable',
      releasedAt: new Date().toISOString()
    });
    expect(result.success).toBe(false);
  });
});`,
      explain: [
        'Contract test tidak menguji tampilan. Ia memastikan produsen dan konsumen sepakat tentang bentuk data.',
        'Test manifest menangkap kesalahan umum: URL relatif yang akan gagal dimuat lintas origin.',
        'Simpan test ini di dekat paket kontrak agar semua tim menjalankan pemeriksaan yang sama.',
        'Menambah satu test seperti ini menaikkan jumlah unit test dari 24 menjadi 25.'
      ]
    },
    {
      type: 'example',
      title: 'Component test remote dengan ctx palsu',
      lang: 'tsx',
      output: false,
      code: `import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppContext } from '@tokomicro/contracts';
import { CheckoutButton } from '../src/CheckoutButton';

function fakeCtx(flags: Record<string, boolean>): AppContext {
  return {
    flags,
    navigate: vi.fn(),
    t: (key: string) => key,
    toast: vi.fn()
  } as unknown as AppContext;
}

describe('CheckoutButton', () => {
  it('memakai label baru saat newCheckout aktif', () => {
    render(<CheckoutButton ctx={fakeCtx({ newCheckout: true })} />);
    expect(screen.getByRole('button', { name: 'Bayar sekarang' })).toBeInTheDocument();
  });

  it('kembali ke label lama saat flag dimatikan', () => {
    render(<CheckoutButton ctx={fakeCtx({ newCheckout: false })} />);
    expect(screen.getByRole('button', { name: 'Buat pesanan' })).toBeInTheDocument();
  });

  it('menavigasi ke checkout saat diklik', async () => {
    const ctx = fakeCtx({ newCheckout: true });
    render(<CheckoutButton ctx={ctx} />);
    await userEvent.click(screen.getByRole('button'));
    expect(ctx.navigate).toHaveBeenCalledWith('/keranjang/checkout');
  });
});`,
      explain: [
        'Test ini tinggal di paket remote cart, bukan di shell. Tim cart yang memiliki komponen dan perilakunya.',
        '<code>fakeCtx</code> hanya mengisi bagian yang dipakai. Casting ke <code>AppContext</code> dilakukan setelah objek minimal dibuat.',
        'Cari tombol lewat peran dan nama aksesibel, bukan selector kelas CSS. Test tetap valid saat gaya berubah.',
        'Jangan memeriksa kelas internal seperti <code>tm-btn--primary</code> dari shell; itu detail implementasi tim UI.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: jalankan unit, E2E, dan tambah satu kontrak',
      lang: 'bash',
      output: false,
      code: `# 1. Unit test: shared, kontrak, UI, dan i18n.
npm test
# Test Files  4 passed (4)
#      Tests  24 passed (24)

# 2. Tambahkan satu test kontrak, misalnya checkoutCompletedEventSchema.
#    Letakkan di tests/contracts.test.ts, lalu jalankan lagi.
npm test
#      Tests  25 passed (25)

# 3. E2E komposisi: remote, badge, login, checkout, isolasi.
npm run test:e2e
# ✔ Shell memuat remote katalog lewat Module Federation
# ✔ Remote keranjang gagal tanpa menjatuhkan shell
# HASIL: LULUS

# 4. Opsional: tangkapan layar terang, gelap, status, mobile.
npm run test:visual

# 5. Typecheck tetap wajib sebelum rilis.
npm run typecheck`,
      explain: [
        'Jalankan <code>npm test</code> lebih dulu karena cepat. Jangan menunggu E2E untuk menemukan kesalahan tipe data.',
        'E2E menyalakan server sendiri bila belum ada, lalu memakai Playwright untuk memeriksa alur nyata.',
        'Uji isolasi di E2E memblokir <code>http://localhost:4176/**</code> dan memastikan header tetap terlihat.',
        'Angka 24 adalah jumlah test saat proyek ini ditulis; targetmu minimal 24 dan bertambah setiap kali kontrak baru muncul.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checkpoint Kualitas</h3><p>Sebuah perubahan dianggap aman bila semua poin ini terpenuhi:</p><ul><li><code>npm test</code> melaporkan minimal 24 test lulus, tanpa test yang di-skip tanpa alasan.</li><li>Contract test baru benar-benar gagal saat bentuk data dirusak, lalu lulus setelah diperbaiki.</li><li><code>npm run test:e2e</code> mencetak <b>HASIL: LULUS</b> dan tidak ada <code>console.error</code> atau <code>pageerror</code>.</li><li>E2E isolasi membuktikan remote cart bisa mati tanpa menjatuhkan header.</li><li><code>npm run typecheck</code> lulus di seluruh workspace.</li><li>Tidak ada test shell yang mengimpor berkas internal remote.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Jangan Menguji Implementasi Internal Remote dari Shell',
      text: 'Test shell yang mengimpor <code>apps/cart/src/Checkout.tsx</code> menciptakan ketergantungan tersembunyi: setiap refactor internal cart merusak pipeline shell, padahal kontraknya tidak berubah. Uji dari luar lewat <code>remote/App</code>, <code>ctx</code>, dan event. Sebaliknya, jangan memakai E2E untuk memeriksa hal yang bisa diuji unit test; E2E yang terlalu rinci menjadi lambat dan gagal karena alasan yang tidak penting.'
    },
    {
      type: 'tip',
      title: 'Satu E2E untuk Alur yang Paling Mahal',
      text: 'Pilih alur yang kegagalannya paling merugikan: katalog termuat, tambah ke keranjang, login, checkout, dan pesanan diterima. Tambahkan satu skenario isolasi. Selain itu, serahkan sisanya ke unit dan contract test. E2E yang sedikit tetapi stabil lebih berharga daripada dua puluh skenario yang rapuh.'
    },
    {
      type: 'vocab',
      items: [
        ['Unit test', 'Pengujian fungsi atau modul kecil secara terisolasi, cepat, dan tanpa browser.'],
        ['Contract test', 'Pengujian bahwa bentuk data, event, atau API sesuai kesepakatan antar tim.'],
        ['Component test', 'Pengujian komponen dengan render di DOM simulasi dan interaksi pengguna.'],
        ['E2E test', 'Pengujian alur nyata di browser dari awal sampai akhir.'],
        ['Visual regression', 'Deteksi perubahan tampilan dengan membandingkan tangkapan layar.'],
        ['Test double', 'Objek pengganti seperti stub atau mock untuk mengisolasi dependensi.'],
        ['Flaky test', 'Test yang kadang lulus kadang gagal tanpa perubahan kode.'],
        ['Smoke test', 'Pemeriksaan cepat setelah deploy untuk memastikan fungsi utama hidup.']
      ]
    }
  ],
  recap: [
    'Setiap lapisan pengujian menjawab risiko berbeda; mulai dari unit dan contract yang murah.',
    'Contract test menjaga kesepakatan ctx, event, dan manifest antar tim.',
    'Component test dijalankan oleh tim pemilik remote, bukan dari dalam shell.',
    'E2E menguji komposisi nyata, termasuk skenario satu remote diblokir.',
    'Minimal 24 unit test, E2E lulus, dan typecheck bersih sebelum rilis.'
  ]
});
