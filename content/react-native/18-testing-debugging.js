/* ============================================================
   Pelajaran React Native — Bab 18: Testing dan Debugging
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-testing-debugging',
  title: 'Testing, Mocking, dan Debugging di Android/iOS',
  chapter: 'Arsitektur & Rilis',
  duration: '32 menit',
  intro: [
    'Bug paling mahal adalah bug yang ditemukan pengguna. Testing bukan tentang mencapai angka coverage 100%, tetapi tentang memberi kepercayaan bahwa perubahan tidak merusak alur penting.',
    'Bab ini menyusun piramida pengujian Kantong: unit untuk aturan bisnis, komponen untuk interaksi UI, integrasi untuk hook + data, dan end-to-end untuk alur nyata. Kita juga membahas mock API, mock native module, serta debugging di Android dan iOS.',
    'Setelah bab ini, kamu bisa menulis test yang bermakna, menjalankannya di CI, dan melacak bug dari pesan error sampai akar penyebab.'
  ],
  objectives: [
    'Menyusun strategi test berdasarkan risiko, bukan jumlah baris',
    'Menulis unit test dan component test dengan Jest + Testing Library',
    'Menguji hook, navigasi, autentikasi, dan error handling',
    'Membuat alur end-to-end dengan Maestro',
    'Menggunakan DevTools, Logcat, dan console untuk debugging'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Piramida yang Realistis</h3><table class="vocab"><tr><th>Jenis</th><th>Yang diuji</th><th>Contoh Kantong</th><th>Jumlah</th></tr><tr><td>Unit</td><td>Fungsi murni, skema, formatter</td><td><code>formatRupiah</code>, <code>toExpense</code>, Zod</td><td>Banyak, cepat</td></tr><tr><td>Komponen</td><td>Render dan interaksi UI</td><td>Form menampilkan error, tombol nonaktif</td><td>Sedang</td></tr><tr><td>Integrasi</td><td>Hook + query + mock API</td><td>Daftar memuat lalu menampilkan data</td><td>Sedikit–sedang</td></tr><tr><td>E2E</td><td>Alur pengguna nyata</td><td>Login → tambah → lihat detail</td><td>Sedikit, kritis</td></tr></table><p>Jangan menguji setiap komponen dengan E2E; lambat dan rapuh. Sebaliknya, jangan mengandalkan unit test saja untuk alur yang melibatkan navigasi dan penyimpanan.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi Jest dan Testing Library',
      lang: 'json',
      output: false,
      code: `{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|expo-router|@react-navigation/.*|@tanstack/.*|zustand)/)"
    ],
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/index.ts"
    ]
  }
}

// jest.setup.ts
import '@testing-library/react-native/extend-expect';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));`,
      explain: [
        '<code>jest-expo</code> menangani preset React Native dan Expo. Tanpa transformIgnorePatterns yang tepat, paket ESM akan gagal di-parse.',
        'Mock native module hanya yang dibutuhkan test. Jangan memalsukan seluruh aplikasi.',
        '<code>collectCoverageFrom</code> membantu melihat bagian yang belum diuji, tetapi bukan target yang harus dikejar buta.'
      ]
    },
    {
      type: 'example',
      title: 'Unit test pemetaan dan formatter',
      lang: 'ts',
      output: false,
      code: `// src/types/api.test.ts
import { toExpense } from './api';

describe('toExpense', () => {
  it('mengubah amount string menjadi bilangan bulat', () => {
    const result = toExpense({
      id: '1',
      amount: '25000',
      note: 'Kopi',
      category_id: 'food',
      spent_at: '2026-11-01T08:00:00.000Z',
    });

    expect(result.amount).toBe(25000);
    expect(result.categoryId).toBe('food');
    expect(result.syncState).toBe('synced');
  });

  it('memetakan kategori tak dikenal menjadi other', () => {
    const result = toExpense({
      id: '2',
      amount: 1000,
      category_id: 'hadiah',
      spent_at: '2026-11-01T08:00:00.000Z',
    });

    expect(result.categoryId).toBe('other');
  });

  it('menolak nominal negatif', () => {
    expect(() => toExpense({
      id: '3', amount: -1, category_id: 'food',
      spent_at: '2026-11-01T08:00:00.000Z',
    })).toThrow('tidak valid');
  });
});`,
      explain: [
        'Unit test menguji perilaku yang penting: normalisasi, fallback, dan penolakan data tidak valid.',
        'Gunakan nama test yang menjelaskan perilaku, bukan nama fungsi. "mengubah amount string..." lebih berguna daripada "test toExpense 1".',
        'Jangan menguji implementasi internal seperti urutan pemanggilan fungsi privat.'
      ]
    },
    {
      type: 'example',
      title: 'Component test form dan error',
      lang: 'tsx',
      output: false,
      code: `// src/features/expenses/components/ExpenseForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ExpenseForm } from './ExpenseForm';

describe('ExpenseForm', () => {
  it('menampilkan error saat catatan terlalu pendek', async () => {
    const onSubmit = jest.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByPlaceholderText('0'), '25000');
    fireEvent.changeText(screen.getByPlaceholderText('Misalnya: makan siang'), 'a');
    fireEvent.press(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Catatan minimal 3 karakter')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('mengirim nilai yang sudah divalidasi', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<ExpenseForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByPlaceholderText('0'), '25000');
    fireEvent.changeText(
      screen.getByPlaceholderText('Misalnya: makan siang'),
      'Makan siang',
    );
    fireEvent.press(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25000, note: 'Makan siang' }),
      expect.anything(),
    );
  });
});`,
      explain: [
        'Test mengakses UI seperti pengguna: placeholder, label peran, dan teks. Hindari mencari berdasarkan testID bila label semantik tersedia.',
        '<code>waitFor</code> diperlukan karena validasi dan submit berjalan asinkron.',
        'Test ini akan gagal jika label aksesibilitas berubah, yang justru berguna: perubahan UI yang memengaruhi pengguna harus disadari.'
      ]
    },
    {
      type: 'example',
      title: 'Integrasi hook dengan QueryClient',
      lang: 'tsx',
      output: false,
      code: `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useExpenses } from './useExpenses';
import * as api from '../api';

jest.mock('../api');

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

it('memetakan hasil API ke domain', async () => {
  jest.spyOn(api, 'fetchExpenses').mockResolvedValue([
    { id: '1', amount: '25000', note: 'Kopi', category_id: 'food',
      spent_at: '2026-11-01T08:00:00.000Z' },
  ]);

  const { result } = renderHook(() => useExpenses('2026-11'), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.[0]?.amount).toBe(25000);
});`,
      explain: [
        'Setiap test mendapat QueryClient baru agar cache tidak bocor antar test.',
        '<code>retry: false</code> membuat test gagal cepat, bukan menunggu retry.',
        'Mock pada lapisan API, bukan pada hook, sehingga pemetaan dan state query tetap diuji.'
      ]
    },
    {
      type: 'example',
      title: 'End-to-end dengan Maestro',
      lang: 'yaml',
      output: false,
      code: `# .maestro/tambah-pengeluaran.yaml
appId: id.contoh.kantong
---
- launchApp:
    clearState: true
- tapOn: "Masuk"
- tapOn: "Email"
- inputText: "demo@kantong.id"
- tapOn: "Kata sandi"
- inputText: "rahasia123"
- tapOn: "Masuk"
- assertVisible: "Pengeluaran"
- tapOn:
    id: "add-expense"
- tapOn: "Nominal"
- inputText: "25000"
- tapOn: "Catatan"
- inputText: "Makan siang"
- tapOn: "Simpan"
- assertVisible: "Makan siang"
- assertVisible: "Rp25.000"`,
      explain: [
        'Maestro memakai label teks dan id aksesibilitas, sehingga test E2E sekaligus memeriksa keterbacaan UI.',
        '<code>clearState: true</code> memastikan test mulai dari kondisi bersih. Jangan mengandalkan data dari test sebelumnya.',
        'Jalankan di build nyata, bukan Expo Go, agar perilaku navigasi, izin, dan keyboard mendekati produksi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Debugging Sistematis</h3><ol><li><b>Baca error pertama.</b> Stack trace teratas biasanya menunjukkan komponen atau modul yang salah.</li><li><b>Reproduksi.</b> Catat langkah, perangkat, versi OS, dan apakah terjadi di build release.</li><li><b>Isolasi.</b> Matikan fitur satu per satu atau gunakan komponen minimal.</li><li><b>Periksa jaringan.</b> Gunakan inspector untuk melihat request, status, dan payload.</li><li><b>Periksa native log.</b> Android Logcat (<code>adb logcat</code>), iOS Console/Xcode.</li><li><b>Uji hipotesis.</b> Ubah satu hal, lalu ulangi. Jangan mengubah lima hal sekaligus.</li></ol><p>React Native DevTools menyediakan console, breakpoint, dan profiler. Untuk crash native, simbolisasi stack trace diperlukan agar nama fungsi terbaca.</p>'
    },
    {
      type: 'warn',
      title: 'Test yang Menyalahkan Implementasi',
      text: 'Test yang memeriksa nama fungsi internal, urutan pemanggilan, atau snapshot seluruh layar akan rapuh dan menghambat refactor. Uji perilaku yang dilihat pengguna: teks muncul, tombol bekerja, data tersimpan, error ditampilkan. Snapshot besar sebaiknya dihindari untuk layar yang sering berubah.'
    },
    {
      type: 'tip',
      title: 'Definisikan "Selesai" untuk Setiap Fitur',
      text: 'Sebuah fitur dianggap selesai bila: alur utama berfungsi, error state teruji, aksesibilitas dasar lulus, dan ada minimal satu test yang melindungi perilaku pentingnya. Ini lebih realistis daripada mengejar coverage tinggi di semua berkas.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Pasang <code>jest-expo</code>, <code>@testing-library/react-native</code>, dan <code>@testing-library/jest-native</code> bila diperlukan.</li><li>Tulis tiga unit test untuk <code>toExpense</code> dan <code>formatRupiah</code>.</li><li>Tulis dua component test untuk form: error validasi dan submit sukses.</li><li>Buat satu alur Maestro: login → tambah pengeluaran → lihat detail.</li><li>Perbaiki satu bug nyata dengan membaca Logcat/Xcode console, lalu tulis test regresi.</li></ol><p><b>Checkpoint:</b> test berjalan di CI, tidak bergantung pada urutan, dan alur kritis terlindungi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Unit test', 'Test untuk fungsi atau modul kecil secara terisolasi.'],
        ['Component test', 'Test yang merender komponen dan meniru interaksi pengguna.'],
        ['Integration test', 'Test beberapa bagian bersama, misalnya hook + API.'],
        ['E2E test', 'Test alur pengguna di aplikasi yang berjalan.'],
        ['Mock', 'Pengganti dependensi untuk mengendalikan kondisi test.'],
        ['Test coverage', 'Persentase kode yang dieksekusi oleh test.'],
        ['Regression test', 'Test yang mencegah bug lama muncul kembali.'],
        ['Maestro', 'Tool E2E berbasis YAML untuk aplikasi mobile.'],
        ['Logcat', 'Log sistem Android untuk debugging.'],
        ['Breakpoint', 'Titik henti eksekusi untuk memeriksa state.'],
        ['Snapshot test', 'Test yang membandingkan output tersimpan; bisa rapuh.'],
        ['Flaky test', 'Test yang kadang lulus kadang gagal tanpa perubahan kode.']
      ]
    }
  ],
  recap: [
    'Uji berdasarkan risiko dan alur penting, bukan sekadar mengejar coverage.',
    'Unit test cepat; E2E sedikit tetapi melindungi alur kritis.',
    'Mock di batas sistem dan gunakan QueryClient baru per test.',
    'Maestro menguji aplikasi nyata lewat label dan id aksesibilitas.',
    'Debugging sistematis: baca error pertama, isolasi, periksa log, uji satu hipotesis.'
  ]
});
