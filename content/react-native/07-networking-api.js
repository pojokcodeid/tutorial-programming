/* ============================================================
   Pelajaran React Native — Bab 7: Networking dan API Client
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-networking',
  title: 'Networking, API Client, dan Penanganan Error',
  chapter: 'Navigasi & Data',
  duration: '27 menit',
  intro: [
    'Aplikasi mobile hidup dengan jaringan yang tidak bisa diandalkan. Sinyal hilang di lift, server lambat, token kedaluwarsa, dan response yang bentuknya berbeda dari dokumentasi. Karena itu, pemanggilan API tidak boleh ditulis langsung di dalam komponen.',
    'Bab ini membangun satu <b>API client</b> untuk Kantong: URL dari environment, timeout, parsing response yang aman, error yang bisa dibedakan, dan dukungan pagination. Semua fitur akan memakai client ini, sehingga perbaikan di satu tempat berlaku untuk seluruh aplikasi.',
    'Kita memakai <code>fetch</code> bawaan karena cukup untuk sebagian besar kebutuhan. Axios bukan larangan; ia berguna bila kamu membutuhkan interceptors dan transformasi request yang kompleks. Yang penting adalah konsepnya tetap sama.'
  ],
  objectives: [
    'Memahami method HTTP, status code, header, dan query parameter',
    'Membuat API client dengan timeout dan error terstruktur',
    'Memisahkan loading, success, empty, dan error di UI',
    'Menerapkan pagination, pull-to-refresh, dan pembatalan request',
    'Mengelola environment variable tanpa membocorkan rahasia'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Yang Perlu Kamu Tahu Sebelum Menulis Client</h3><ul><li><b>2xx</b> sukses, <b>4xx</b> kesalahan klien (validasi, auth, izin), <b>5xx</b> kesalahan server.</li><li><b>401</b> berarti belum terautentikasi atau token tidak valid; <b>403</b> berarti sudah dikenali tetapi tidak berhak.</li><li><code>fetch</code> <b>tidak</b> melempar error untuk status 4xx/5xx. Kamu harus memeriksa <code>response.ok</code>.</li><li>Timeout tidak otomatis. Tanpa timeout, loading bisa menggantung selamanya.</li><li>Header <code>Content-Type: application/json</code> diperlukan saat mengirim JSON.</li></ul>'
    },
    {
      type: 'example',
      title: 'API client dengan timeout dan error yang jelas',
      lang: 'ts',
      output: false,
      code: `// src/services/api.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://jsonplaceholder.typicode.com';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: 'network' | 'timeout' | 'http' | 'parse',
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'signal'> & {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  { timeoutMs = 12_000, signal, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();

  signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(\`\${BASE_URL}\${path}\`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      let details: unknown;
      try { details = await response.json(); } catch { details = undefined; }
      throw new ApiError(
        \`Permintaan gagal (\${response.status})\`,
        response.status,
        'http',
        details,
      );
    }

    if (response.status === 204) return undefined as T;

    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('Response bukan JSON yang valid', response.status, 'parse');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) {
      throw new ApiError('Permintaan melebihi batas waktu', 0, 'timeout');
    }
    throw new ApiError('Tidak dapat terhubung ke server', 0, 'network', error);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}`,
      explain: [
        'Timeout memakai <code>AbortController</code>; ini juga membatalkan permintaan ketika pengguna meninggalkan layar.',
        'Error dibagi menjadi <code>network</code>, <code>timeout</code>, <code>http</code>, dan <code>parse</code> agar UI bisa memberi pesan yang tepat.',
        'Status 204 tidak memiliki body. Memanggil <code>response.json()</code> di sini akan menghasilkan error parsing yang menyesatkan.',
        'Jangan menaruh token di kode ini secara langsung. Token akan disuntikkan lewat header oleh lapisan autentikasi di Bab 10.'
      ]
    },
    {
      type: 'example',
      title: 'Endpoint bertipe untuk Kantong',
      lang: 'ts',
      output: false,
      code: `// src/features/expenses/api.ts
import { apiRequest } from '@/services/api';
import type { ApiEnvelope } from '@/types/api';
import type { ExpenseDto } from '@/types/api';

export type ExpenseQuery = { page?: number; month?: string };

export type ExpensePage = {
  items: ExpenseDto[];
  nextPage: number | null;
};

export function fetchExpenses(
  { page = 1, month }: ExpenseQuery = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    _page: String(page),
    _limit: '20',
    _sort: 'spent_at',
    _order: 'desc',
  });
  if (month) query.set('month', month);

  return apiRequest<ExpenseDto[]>( \`/expenses?\${query}\`, { signal } );
}

export async function fetchExpensePage(
  page = 1,
  signal?: AbortSignal,
): Promise<ExpensePage> {
  const items = await fetchExpenses({ page }, signal);
  return {
    items,
    nextPage: items.length === 20 ? page + 1 : null,
  };
}

export function createExpense(body: {
  amount: number;
  note: string;
  categoryId: string;
  spentAt: string;
}) {
  return apiRequest<ExpenseDto>('/expenses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}`,
      explain: [
        'Query string dibangun dengan <code>URLSearchParams</code> agar karakter khusus di-encode dengan benar.',
        'Fungsi endpoint mengembalikan tipe DTO. Pemetaan ke model domain dilakukan di hook atau repository, bukan di komponen.',
        'Pagination sebaiknya mengikuti kontrak server. Contoh di atas memakai parameter ala json-server; API nyata bisa memakai cursor atau page/size.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Loading, Success, Empty, Error</h3><p>Empat keadaan ini bukan detail kosmetik. Tanpa state yang jelas, pengguna akan melihat layar kosong dan mengira aplikasi rusak. Untuk daftar, bedakan <b>kosong karena belum ada data</b> dan <b>kosong karena filter tidak menemukan apa pun</b>. Untuk error, bedakan <b>tidak ada koneksi</b>, <b>timeout</b>, dan <b>server menolak</b>.</p><p>Jangan menampilkan <code>Alert</code> untuk setiap kegagalan muat data. Alert menghentikan pengguna dan tidak bisa diabaikan. Gunakan state error di layar dengan tombol coba lagi; simpan Alert untuk aksi yang memang membutuhkan keputusan.</p>'
    },
    {
      type: 'example',
      title: 'Hook fetch dengan pembatalan dan retry manual',
      lang: 'tsx',
      output: false,
      code: `import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/services/api';
import { fetchExpenses } from '@/features/expenses/api';
import type { ExpenseDto } from '@/types/api';

export function useExpenseList(page: number) {
  const [items, setItems] = useState<ExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchExpenses({ page }, controller.signal)
      .then(setItems)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.code === 'timeout') {
          setError('Server terlalu lama merespons. Coba lagi.');
        } else {
          setError('Daftar pengeluaran gagal dimuat.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { items, loading, error, retry };
}`,
      explain: [
        'Cleanup membatalkan request ketika layar ditinggalkan atau parameter berubah, sehingga tidak ada <i>setState after unmount</i>.',
        '<code>attempt</code> memaksa effect berjalan ulang saat tombol coba lagi ditekan.',
        'Ini adalah implementasi manual untuk memahami konsep. Bab 8 menggantinya dengan TanStack Query yang menangani cache, retry, dan deduplikasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pagination dan Infinite Scroll</h3><p>Pagination bisa berbasis halaman (<code>page</code>, <code>limit</code>) atau cursor (<code>nextCursor</code>). Cursor lebih tahan terhadap data yang berubah saat pengguna menggulir. Apa pun pilihannya, simpan <code>hasNextPage</code> dan hentikan pemuatan ketika sudah habis.</p><p>Pada FlatList, gunakan <code>onEndReached</code> dengan <code>onEndReachedThreshold={0.5}</code>, tetapi jaga agar tidak memicu request berulang saat daftar masih memuat. Tampilkan <code>ListFooterComponent</code> sebagai indikator.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Simpan Rahasia di EXPO_PUBLIC_',
      text: 'Semua variabel <code>EXPO_PUBLIC_*</code> tertanam di bundel JavaScript dan bisa dibaca siapa pun yang memiliki aplikasi. Jangan pernah menaruh API secret, service role key, atau private key di sana. Yang boleh: URL API publik, nama lingkungan, dan konfigurasi non-rahasia. Rahasia harus berada di server atau backend-for-frontend.'
    },
    {
      type: 'tip',
      title: 'Uji Jaringan Secara Sengaja',
      text: 'Gunakan Network Link Conditioner (iOS), Android emulator network settings, atau mode pesawat untuk mensimulasikan latency, packet loss, dan offline. Uji juga server yang mengembalikan 401, 500, dan JSON rusak. Aplikasi yang hanya diuji dengan WiFi cepat akan gagal di dunia nyata.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat <code>src/services/api.ts</code> dan endpoint <code>fetchExpenses</code> memakai JSONPlaceholder atau API lokal.</li><li>Tampilkan daftar dengan empat keadaan: memuat, kosong, error, dan berisi. Sertakan tombol coba lagi.</li><li>Uji mode pesawat, lalu aktifkan kembali. Pastikan pesan error tepat dan tombol berfungsi.</li><li>Tambahkan pagination 20 item dengan <code>onEndReached</code>. Pastikan tidak ada request ganda saat menggulir cepat.</li><li>Uji timeout dengan server yang sengaja lambat (misalnya delay 20 detik).</li></ol><p><b>Checkpoint:</b> tidak ada <code>fetch</code> langsung di komponen layar, error 401/500/offline dibedakan, dan request dibatalkan saat layar ditinggalkan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['API client', 'Lapisan terpusat untuk memanggil API dengan konfigurasi dan error handling yang konsisten.'],
        ['Timeout', 'Batas waktu menunggu response sebelum permintaan dibatalkan.'],
        ['AbortController', 'Objek untuk membatalkan fetch dan operasi asinkron lain.'],
        ['Status code', 'Kode numerik HTTP yang menunjukkan hasil permintaan.'],
        ['Query parameter', 'Nilai di URL setelah tanda tanya, biasanya untuk filter/pagination.'],
        ['Idempotent', 'Operasi yang hasilnya sama bila diulang, misalnya GET atau PUT.'],
        ['Pagination', 'Pemecahan data besar menjadi beberapa halaman.'],
        ['Infinite scroll', 'Memuat halaman berikutnya saat pengguna mendekati akhir daftar.'],
        ['Pull to refresh', 'Gestur menarik daftar ke bawah untuk memuat ulang.'],
        ['Environment variable', 'Konfigurasi per lingkungan yang dibaca saat build/runtime.'],
        ['Retry', 'Percobaan ulang setelah kegagalan sementara.'],
        ['DTO', 'Bentuk data mentah dari API sebelum dipetakan ke model domain.']
      ]
    }
  ],
  recap: [
    'fetch tidak melempar error untuk status 4xx/5xx; periksa response.ok.',
    'API client harus punya timeout, pembatalan, dan error yang bisa dibedakan.',
    'Endpoint bertipe mengembalikan DTO; pemetaan ke domain dilakukan di lapisan data.',
    'UI perlu membedakan memuat, kosong, error, dan berisi.',
    'Rahasia tidak boleh berada di environment variable publik.'
  ]
});
