/* ============================================================
   Pelajaran React Native — Bab 9: Client State dengan Zustand
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-client-state',
  title: 'Client State: Context, Zustand, dan Batas yang Jelas',
  chapter: 'Navigasi & Data',
  duration: '24 menit',
  intro: [
    'Tidak semua state perlu perpustakaan. State yang hanya dipakai satu komponen cukup dengan <code>useState</code>. State yang dipakai satu fitur bisa diangkat ke Context. State yang dipakai lintas fitur dan berubah sering lebih nyaman di Zustand.',
    'Masalahnya bukan "library mana yang paling populer", tetapi <b>siapa pemilik state</b> dan <b>berapa sering ia berubah</b>. Bab ini memberi aturan pemilihan, lalu membangun store filter dan keranjang sementara Kantong dengan Zustand, termasuk persistensi ke penyimpanan perangkat.',
    'Kita juga akan melihat kapan Redux Toolkit justru pilihan yang lebih baik: tim besar, alur kompleks, DevTools ketat, dan kebutuhan audit yang jelas.'
  ],
  objectives: [
    'Memilih useState, Context, Zustand, atau Redux Toolkit berdasarkan kebutuhan',
    'Membuat store Zustand yang bertipe dan memakai selector',
    'Mempersist state klien ke AsyncStorage dengan hati-hati',
    'Menghindari re-render berlebih akibat selector yang salah',
    'Memisahkan client state dari server state secara tegas'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Aturan Memilih State</h3><table class="vocab"><tr><th>Kebutuhan</th><th>Pilihan</th><th>Contoh Kantong</th></tr><tr><td>Satu komponen</td><td><code>useState</code></td><td>Modal terbuka, teks input</td></tr><tr><td>Satu fitur, sedikit konsumen</td><td>Context + reducer</td><td>Tema, locale, session provider</td></tr><tr><td>Lintas fitur, sering berubah</td><td>Zustand</td><td>Filter, keranjang, preferensi</td></tr><tr><td>Tim besar, alur kompleks, audit</td><td>Redux Toolkit</td><td>Workflow multi-langkah dengan banyak event</td></tr><tr><td>Data dari server</td><td>TanStack Query</td><td>Daftar pengeluaran, profil</td></tr></table><p>Context bukan pengganti state manager. Setiap perubahan value pada Provider merender ulang semua konsumen. Untuk data yang berubah cepat, pecah provider atau gunakan store eksternal.</p>'
    },
    {
      type: 'example',
      title: 'Store filter dengan Zustand',
      lang: 'ts',
      output: false,
      code: `// src/stores/filterStore.ts
import { create } from 'zustand';

export type Period = 'week' | 'month' | 'year';

type FilterState = {
  period: Period;
  category: string | null;
  query: string;
  setPeriod: (period: Period) => void;
  setCategory: (category: string | null) => void;
  setQuery: (query: string) => void;
  reset: () => void;
};

const initial = { period: 'month' as Period, category: null, query: '' };

export const useFilterStore = create<FilterState>((set) => ({
  ...initial,
  setPeriod: (period) => set({ period }),
  setCategory: (category) => set({ category }),
  setQuery: (query) => set({ query }),
  reset: () => set(initial),
}));`,
      explain: [
        'Store hanya berisi state klien. Data pengeluaran tetap di TanStack Query.',
        'Aksi didefinisikan bersama state agar komponen tidak memanggil <code>set</code> mentah dengan objek yang tidak konsisten.',
        '<code>reset</code> memakai objek awal yang sama, sehingga menambah field baru tidak lupa diinisialisasi.'
      ]
    },
    {
      type: 'example',
      title: 'Selector yang mencegah re-render berlebih',
      lang: 'tsx',
      output: false,
      code: `import { useShallow } from 'zustand/react/shallow';
import { useFilterStore } from '@/stores/filterStore';

// Buruk: komponen ikut render saat field apa pun berubah.
const state = useFilterStore();

// Baik: hanya berlangganan field yang dipakai.
const period = useFilterStore((s) => s.period);
const setPeriod = useFilterStore((s) => s.setPeriod);

// Bila butuh beberapa field sekaligus:
const { category, query } = useFilterStore(
  useShallow((s) => ({ category: s.category, query: s.query })),
);`,
      explain: [
        'Zustand membandingkan hasil selector dengan <code>Object.is</code>. Mengembalikan objek baru setiap render akan memicu render ulang terus-menerus.',
        '<code>useShallow</code> membandingkan isi objek secara dangkal, cocok untuk memilih beberapa field.',
        'Jangan memakai satu selector besar hanya agar ringkas. Render yang tidak perlu adalah biaya nyata pada daftar panjang.'
      ]
    },
    {
      type: 'example',
      title: 'Persistensi preferensi ke AsyncStorage',
      lang: 'ts',
      output: false,
      code: `import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Preferences = {
  theme: 'light' | 'dark' | 'system';
  currency: 'IDR' | 'USD';
  setTheme: (theme: Preferences['theme']) => void;
  setCurrency: (currency: Preferences['currency']) => void;
};

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      theme: 'system',
      currency: 'IDR',
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'kantong-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        currency: state.currency,
      }),
    },
  ),
);`,
      explain: [
        '<code>partialize</code> menentukan field yang disimpan. Jangan menyimpan fungsi atau data sensitif.',
        '<code>version</code> memungkinkan migrasi saat bentuk state berubah. Tanpa versi, data lama bisa membuat aplikasi crash setelah update.',
        'AsyncStorage tidak terenkripsi. Token dan data rahasia harus memakai SecureStore, seperti dibahas di Bab 10.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Context Masih Tepat?</h3><p>Context sangat baik untuk nilai yang jarang berubah dan dibutuhkan banyak komponen: tema, locale, session, atau konfigurasi aplikasi. Ia juga membuat dependensi eksplisit dan mudah diuji.</p><p>Untuk nilai yang berubah setiap ketukan (misalnya teks pencarian), Context bisa merender ulang seluruh pohon. Pisahkan provider: <code>ThemeProvider</code> untuk tema, <code>SessionProvider</code> untuk sesi, dan biarkan state pencarian tetap lokal atau di Zustand.</p>'
    },
    {
      type: 'example',
      title: 'Context tema yang dipecah dari state lain',
      lang: 'tsx',
      output: false,
      code: `import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { usePreferences } from '@/stores/preferences';

type Theme = { mode: 'light' | 'dark'; colors: typeof lightColors };

const lightColors = { background: '#F8FAFC', text: '#0F172A', primary: '#0F766E' };
const darkColors = { background: '#0B1220', text: '#E2E8F0', primary: '#2DD4BF' };

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = usePreferences((s) => s.theme);
  const mode = preference === 'system' ? (system ?? 'light') : preference;

  const value = useMemo<Theme>(
    () => ({ mode, colors: mode === 'dark' ? darkColors : lightColors }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme harus dipakai di dalam ThemeProvider');
  return value;
}`,
      explain: [
        'Nilai tema dihitung dari preferensi pengguna dan tema sistem, lalu dimemo agar referensinya stabil.',
        'Hook melempar error jelas bila dipakai di luar provider. Ini lebih baik daripada mengembalikan nilai default yang menyembunyikan kesalahan.',
        'Token warna tetap sebaiknya berada di satu modul, bukan diduplikasi di dalam provider.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Menjadikan Zustand Gudang Segala Hal',
      text: 'Store global yang berisi data server, state form, modal, dan hasil query akan sulit dirawat. Setiap fitur baru menambah field, dan tidak ada yang tahu siapa yang boleh mengubahnya. Batasi store pada state klien yang benar-benar lintas layar. Data server tetap di TanStack Query; state form tetap di React Hook Form.'
    },
    {
      type: 'tip',
      title: 'Uji Logout dan Ganti Akun',
      text: 'Saat pengguna logout, bersihkan store yang berisi data pribadi dan cache query. Jika tidak, pengguna berikutnya bisa melihat sisa data pengguna sebelumnya. Buat fungsi <code>resetAllClientState()</code> yang memanggil <code>queryClient.clear()</code> dan mereset store terkait.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Pasang Zustand dengan <code>npx expo install zustand</code>.</li><li>Buat <code>filterStore</code> dan hubungkan ke layar pengeluaran. Pastikan mengubah filter memengaruhi query key.</li><li>Buat <code>preferences</code> yang menyimpan tema dan mata uang, lalu persist ke AsyncStorage.</li><li>Ganti satu Context yang sudah ada (misalnya tema) menjadi provider yang dipecah dan ukur render dengan React DevTools.</li><li>Buat <code>resetAllClientState</code> dan panggil saat logout.</li></ol><p><b>Checkpoint:</b> tidak ada data server di store, preferensi bertahan setelah restart, dan logout benar-benar membersihkan data pribadi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Client state', 'State yang dimiliki aplikasi, bukan server.'],
        ['Store', 'Tempat menyimpan state global yang bisa diakses banyak komponen.'],
        ['Selector', 'Fungsi yang memilih sebagian state agar komponen hanya berlangganan bagian itu.'],
        ['useShallow', 'Pembanding dangkal untuk selector yang mengembalikan objek.'],
        ['Persist middleware', 'Middleware Zustand untuk menyimpan state ke storage.'],
        ['Partialize', 'Memilih field yang disimpan saat persistensi.'],
        ['Hydration', 'Proses memuat state tersimpan saat aplikasi mulai.'],
        ['Context', 'Mekanisme React untuk meneruskan nilai ke subtree tanpa props.'],
        ['Redux Toolkit', 'State manager dengan pola reducer, action, dan DevTools.'],
        ['State normalization', 'Menyimpan data sebagai map ID untuk menghindari duplikasi.'],
        ['Reset state', 'Mengembalikan store ke kondisi awal, penting saat logout.'],
        ['Server state', 'Data milik server; dikelola TanStack Query, bukan store klien.']
      ]
    }
  ],
  recap: [
    'Pilih state berdasarkan pemilik dan frekuensi perubahan, bukan popularitas library.',
    'Zustand cocok untuk state klien lintas fitur; gunakan selector agar render efisien.',
    'Persist hanya field yang perlu dan aman, dengan version untuk migrasi.',
    'Context tetap berguna untuk nilai stabil seperti tema dan sesi.',
    'Data server tetap di TanStack Query; jangan dicampur ke store klien.'
  ]
});
