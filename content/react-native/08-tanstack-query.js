/* ============================================================
   Pelajaran React Native — Bab 8: Server State dengan TanStack Query
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-tanstack-query',
  title: 'Server State, Cache, dan Mutation dengan TanStack Query',
  chapter: 'Navigasi & Data',
  duration: '28 menit',
  intro: [
    'Data dari server bukan state biasa. Ia bisa basi, dipakai di beberapa layar, perlu dimuat ulang, dan berubah karena aksi pengguna. Menyimpannya di <code>useState</code> per layar membuat aplikasi memuat data yang sama berulang kali dan menampilkan angka yang berbeda antar tab.',
    'TanStack Query memisahkan <b>server state</b> dari <b>client state</b>. Ia mengurus cache, status loading/error, retry, deduplikasi request, dan invalidasi setelah mutation. Kamu tetap memegang kendali atas query key dan kebijakan cache.',
    'Bab ini menghubungkan daftar pengeluaran Kantong ke server, menambahkan optimistic update, pagination, dan pull-to-refresh. Implementasi manual di bab sebelumnya akan diganti tanpa mengubah tampilan layar.'
  ],
  objectives: [
    'Mengonfigurasi QueryClientProvider dan kebijakan retry yang masuk akal',
    'Menyusun query key yang stabil dan mudah diinvalidasi',
    'Menggunakan useQuery, useMutation, dan useInfiniteQuery',
    'Menerapkan optimistic update dengan rollback saat gagal',
    'Membedakan kapan memakai cache server dan kapan state lokal'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Tidak Cukup useState?</h3><table class="vocab"><tr><th>Kebutuhan</th><th>useState manual</th><th>TanStack Query</th></tr><tr><td>Cache antar layar</td><td>Harus dibuat sendiri</td><td>Otomatis berdasarkan query key</td></tr><tr><td>Request ganda</td><td>Bisa terjadi</td><td>Dideduplikasi</td></tr><tr><td>Retry</td><td>Ditulis manual</td><td>Kebijakan global/per query</td></tr><tr><td>Invalidasi setelah simpan</td><td>Harus memanggil ulang manual</td><td><code>invalidateQueries</code></td></tr><tr><td>Pagination</td><td>State halaman rumit</td><td><code>useInfiniteQuery</code></td></tr><tr><td>Status basi</td><td>Tidak terlihat</td><td><code>isStale</code>, <code>isFetching</code></td></tr></table><p>Tetap gunakan <code>useState</code> untuk hal yang memang milik UI: teks input yang belum disimpan, tab aktif, atau modal terbuka. Jangan menyalin data server ke state lokal hanya agar "lebih mudah diubah".</p>'
    },
    {
      type: 'example',
      title: 'QueryClient dengan kebijakan yang sadar mobile',
      lang: 'ts',
      output: false,
      code: `// src/services/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});`,
      explain: [
        '<code>staleTime</code> 30 detik berarti data dianggap segar dan tidak langsung dimuat ulang saat layar dibuka kembali.',
        'Error 4xx tidak diulang karena biasanya disebabkan input atau auth, bukan gangguan sementara. Error jaringan/5xx boleh dicoba ulang.',
        'Di mobile, <code>refetchOnWindowFocus</code> tidak sepenting di web. Gunakan <code>refetchOnAppFocus</code> atau <code>focusManager</code> bila ingin menyegarkan saat aplikasi kembali aktif.'
      ]
    },
    {
      type: 'example',
      title: 'Query key factory dan hook daftar',
      lang: 'tsx',
      output: false,
      code: `// src/features/expenses/queryKeys.ts
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filter: { month: string; category?: string }) =>
    [...expenseKeys.lists(), filter] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

// src/features/expenses/hooks/useExpenses.ts
import { useQuery } from '@tanstack/react-query';
import { fetchExpenses } from '../api';
import { toExpense } from '@/types/api';
import { expenseKeys } from '../queryKeys';

export function useExpenses(month: string) {
  return useQuery({
    queryKey: expenseKeys.list({ month }),
    queryFn: ({ signal }) => fetchExpenses({ month }, signal),
    select: (dtos) => dtos.map(toExpense),
  });
}`,
      explain: [
        'Query key adalah identitas cache. Gunakan array yang deterministik dan sertakan semua parameter yang memengaruhi hasil.',
        'Factory mencegah salah ketik dan memudahkan invalidasi: <code>invalidateQueries({ queryKey: expenseKeys.lists() })</code>.',
        '<code>select</code> memetakan DTO ke domain tanpa mengubah data cache. Ini menjaga cache tetap berupa data server mentah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mutation: Mengubah Data dan Menyegarkan Cache</h3><p>Setelah <code>POST</code> berhasil, daftar lama tidak otomatis tahu ada item baru. Ada dua pendekatan: <b>invalidasi</b> (muat ulang dari server) atau <b>update cache langsung</b> (lebih cepat, tetapi harus benar). Untuk data yang penting seperti saldo, invalidasi lebih aman. Untuk aksi cepat seperti menandai item, optimistic update memberi pengalaman yang jauh lebih baik.</p><p>Optimistic update berarti UI berubah seolah berhasil sebelum server menjawab. Bila gagal, perubahan harus dikembalikan. Selalu simpan snapshot cache di <code>onMutate</code> dan pulihkan di <code>onError</code>.</p>'
    },
    {
      type: 'example',
      title: 'Mutation dengan optimistic update dan rollback',
      lang: 'tsx',
      output: false,
      code: `import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExpense } from '../api';
import { expenseKeys } from '../queryKeys';
import type { Expense } from '@/types/domain';

type NewExpense = Omit<Expense, 'id' | 'syncState'>;

export function useCreateExpense() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: NewExpense) => createExpense(input),

    onMutate: async (input) => {
      const key = expenseKeys.lists();
      await client.cancelQueries({ queryKey: key });

      const previous = client.getQueriesData<Expense[]>({ queryKey: key });
      const optimistic: Expense = {
        ...input,
        id: \`temp-\${Date.now()}\`,
        syncState: 'pending',
      };

      client.setQueriesData<Expense[]>({ queryKey: key }, (old) =>
        old ? [optimistic, ...old] : [optimistic],
      );

      return { previous };
    },

    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, data]) => {
        client.setQueryData(key, data);
      });
    },

    onSettled: () => {
      void client.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}`,
      explain: [
        '<code>cancelQueries</code> mencegah response lama menimpa update optimistis.',
        '<code>previous</code> menyimpan snapshot semua query daftar yang cocok. Saat gagal, semuanya dikembalikan.',
        '<code>onSettled</code> berjalan baik sukses maupun gagal, sehingga server tetap menjadi sumber kebenaran setelahnya.',
        'ID sementara harus diganti dengan ID server setelah response sukses. Untuk daftar yang kompleks, invalidasi lebih sederhana dan lebih aman.'
      ]
    },
    {
      type: 'example',
      title: 'Infinite query dan pull-to-refresh',
      lang: 'tsx',
      output: false,
      code: `import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchExpensePage } from '../api';
import { expenseKeys } from '../queryKeys';

export function useExpenseFeed() {
  return useInfiniteQuery({
    queryKey: expenseKeys.list({ month: 'all' }),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchExpensePage(pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 15_000,
  });
}

// Di layar:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
//   useExpenseFeed();
//
// <FlatList
//   data={data?.pages.flatMap((page) => page.items) ?? []}
//   onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
//   onEndReachedThreshold={0.4}
//   refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
//   ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
// />`,
      explain: [
        '<code>initialPageParam</code> wajib di TanStack Query v5. <code>getNextPageParam</code> mengembalikan <code>undefined</code> bila tidak ada halaman berikutnya.',
        '<code>data.pages</code> berisi array halaman; ratakan hanya saat merender, bukan dengan mengubah cache.',
        'Selalu cegah <code>fetchNextPage</code> berulang saat <code>isFetchingNextPage</code> masih true.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Menyalin Server State ke Zustand',
      text: 'Menyimpan hasil query ke store global lalu mengubahnya di dua tempat adalah sumber bug sinkronisasi. Zustand cocok untuk state klien seperti filter, keranjang sementara, atau preferensi. Data pengeluaran tetap di cache TanStack Query. Bila butuh data yang sama di banyak layar, panggil hook dengan query key yang sama; cache akan dipakai bersama.'
    },
    {
      type: 'tip',
      title: 'Tune Cache Berdasarkan Data',
      text: 'Profil pengguna bisa <code>staleTime</code> 5 menit. Daftar pengeluaran mungkin 30 detik. Kurs mata uang mungkin 1 jam. Jangan memakai satu nilai untuk semua. Semakin cepat data berubah dan semakin mahal kesalahannya, semakin pendek <code>staleTime</code>-nya.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Pasang <code>@tanstack/react-query</code> dengan <code>npx expo install @tanstack/react-query</code> dan bungkus root layout.</li><li>Ganti hook manual di layar pengeluaran dengan <code>useExpenses</code>. Pastikan loading, error, dan refresh tetap bekerja.</li><li>Tambahkan form tambah pengeluaran memakai <code>useCreateExpense</code>. Amati item optimistis muncul sebelum server menjawab.</li><li>Matikan server saat submit. Pastikan item hilang kembali dan pesan error muncul.</li><li>Implementasikan infinite scroll 20 item dan pull-to-refresh.</li></ol><p><b>Checkpoint:</b> buka dua layar yang memakai query key sama; data tidak dimuat dua kali. Setelah mutation, daftar terbarui tanpa reload aplikasi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Server state', 'Data yang dimiliki server dan disalin ke klien untuk ditampilkan.'],
        ['Client state', 'State milik UI/aplikasi, misalnya filter dan modal.'],
        ['Query key', 'Identitas unik cache query.'],
        ['staleTime', 'Lama data dianggap segar sebelum boleh dimuat ulang.'],
        ['gcTime', 'Lama data tak terpakai disimpan sebelum dibuang dari cache.'],
        ['Invalidate', 'Menandai query basi agar dimuat ulang.'],
        ['Optimistic update', 'Mengubah UI sebelum server mengonfirmasi.'],
        ['Rollback', 'Mengembalikan state sebelumnya ketika mutation gagal.'],
        ['useInfiniteQuery', 'Hook untuk pagination berbasis halaman atau cursor.'],
        ['Deduplikasi', 'Menggabungkan request identik yang berjalan bersamaan.'],
        ['focusManager', 'Pengatur kapan aplikasi dianggap fokus untuk refetch.'],
        ['Mutation', 'Operasi yang mengubah data di server.']
      ]
    }
  ],
  recap: [
    'Server state berbeda dari client state; jangan menyalinnya ke useState atau store global.',
    'Query key yang deterministik adalah dasar cache dan invalidasi.',
    'Retry 4xx tidak masuk akal; retry jaringan/5xx terbatas masuk akal.',
    'Optimistic update harus menyimpan snapshot dan melakukan rollback saat gagal.',
    'Infinite query memakai initialPageParam dan getNextPageParam di v5.'
  ]
});
