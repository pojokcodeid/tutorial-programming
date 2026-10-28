/* ============================================================
   Pelajaran Micro-Frontend — Bab 9: Data, API, BFF, dan Validasi Kontrak
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-data-api',
  title: 'Data, API, BFF, dan Validasi Kontrak',
  chapter: 'Kontrak & Data',
  duration: '18 menit',
  intro: [
    'Setiap remote boleh punya tampilan sendiri, tetapi data tidak boleh saling pinjam. Remote products memanggil <code>/api/products</code>, remote cart memanggil <code>/api/orders</code>, dan shell mengurus <code>/api/me</code> serta sesi. Tidak ada remote yang memanggil API remote lain.',
    'Di dunia nyata, respons API bisa berubah tanpa pemberitahuan: field hilang, angka berubah menjadi string, atau server mengembalikan halaman HTML karena galat. Remote yang langsung memakai <code>res.json()</code> akan menampilkan layar rusak. Karena itu bentuk respons harus dianggap sebagai kontrak yang perlu divalidasi.',
    'Bab ini membangun lapisan data remote: fetch milik sendiri, <code>AbortController</code>, status loading/error/empty, validasi Zod dengan <code>safeParse</code>, BFF untuk agregasi, cache HTTP, dan CORS. Kamu akan menguji filter kategori di sisi klien serta menangani respons rusak tanpa menjatuhkan halaman.'
  ],
  objectives: [
    'Menentukan pemilik endpoint untuk setiap remote dan alasan remote tidak memanggil remote lain',
    'Menulis fetch dengan AbortController serta status loading, error, empty, dan ready',
    'Memvalidasi respons yang tidak dipercaya memakai Zod safeParse',
    'Menjelaskan peran BFF, cache HTTP, dan konfigurasi CORS yang aman',
    'Menguji filter kategori dan membuktikan UI tetap hidup saat respons rusak'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu Remote, Satu Pemilik Data</h3><table class="vocab"><tr><th>Remote</th><th>Endpoint</th><th>Catatan</th></tr><tr><td>header</td><td>tidak ada</td><td>Membaca shared state dan <code>ctx.user</code>.</td></tr><tr><td>products</td><td><code>GET /api/products</code></td><td>Katalog, filter kategori, detail produk.</td></tr><tr><td>cart</td><td><code>POST /api/orders</code></td><td>Checkout memakai token dari <code>ctx.getToken()</code>.</td></tr><tr><td>account</td><td><code>GET /api/me</code>, <code>GET /api/orders</code></td><td>Profil dan riwayat pesanan pengguna.</td></tr><tr><td>shell</td><td><code>/api/login</code>, <code>/api/refresh</code>, <code>/api/logout</code></td><td>Sesi dan token adalah milik shell.</td></tr></table><p>Bila cart membutuhkan nama produk, jangan panggil <code>/api/products</code> dari dalam cart. Minta backend menyertakan nama pada item pesanan, atau sediakan endpoint BFF yang menggabungkan data. Panggilan HTTP antar-remote menciptakan <b>distributed monolith</b>: dua tim harus rilis dan gagal bersamaan.</p>'
    },
    {
      type: 'example',
      title: 'Klien API dengan Zod dan AbortSignal',
      lang: 'ts',
      output: false,
      code: `// apps/products/src/api/products.ts
import { z } from 'zod';
const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  image: z.string().url().optional()
});
const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  total: z.number().int().nonnegative()
});
export type Product = z.infer<typeof ProductSchema>;
export type ProductList = z.infer<typeof ProductListSchema>;
export class ContractError extends Error {
  constructor(public issues: z.ZodIssue[]) {
    super('Bentuk respons /api/products tidak sesuai kontrak');
    this.name = 'ContractError';
  }
}
export async function fetchProducts(category: string, signal: AbortSignal): Promise<ProductList> {
  const url = new URL('/api/products', import.meta.env.VITE_API_BASE_URL);
  if (category !== 'semua') url.searchParams.set('category', category);
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
  const json: unknown = await res.json();
  const parsed = ProductListSchema.safeParse(json);
  if (!parsed.success) throw new ContractError(parsed.error.issues);
  return parsed.data;
}`,
      explain: [
        '<code>json</code> bertipe <code>unknown</code>, bukan <code>any</code>. TypeScript memaksa kamu memvalidasi sebelum mengakses field.',
        '<code>safeParse</code> tidak melempar galat; ia mengembalikan hasil yang bisa diperiksa. Ini memudahkan membedakan galat jaringan dari galat kontrak.',
        '<code>AbortSignal</code> diteruskan ke fetch agar request dibatalkan saat filter berubah atau remote dibongkar.'
      ]
    },
    {
      type: 'example',
      title: 'Empat status UI yang wajib ditangani',
      lang: 'jsx',
      output: false,
      code: `// apps/products/src/App.tsx (potongan komponen Catalog)
import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/products';
export default function Catalog({ ctx }) {
  const [category, setCategory] = useState('semua');
  const [state, setState] = useState({ status: 'loading', items: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', items: [] });
    fetchProducts(category, controller.signal)
      .then((data) => setState({
        status: data.items.length === 0 ? 'empty' : 'ready',
        items: data.items
      }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ status: 'error', items: [], message: error.message });
        ctx.telemetry.error(error, { category });
      });
    return () => controller.abort();
  }, [category, attempt]);
  if (state.status === 'loading') return <p role="status">Memuat katalog…</p>;
  if (state.status === 'error') {
    return (
      <div role="alert">
        <p>Katalog gagal dimuat: {state.message}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)}>Coba lagi</button>
      </div>
    );
  }
  if (state.status === 'empty') return <p>Belum ada produk di kategori ini.</p>;
  return (
    <section>
      <select value={category} onChange={(event) => setCategory(event.target.value)}>
        <option value="semua">Semua</option>
        <option value="kopi">Kopi</option>
        <option value="teh">Teh</option>
      </select>
      <ul>{state.items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
    </section>
  );
}`,
      explain: [
        'Saat kategori berubah, effect lama dibersihkan dan <code>controller.abort()</code> dipanggil. Respons lama tidak boleh menimpa hasil filter baru.',
        'Error ditampilkan dengan tombol coba lagi; empty bukan error. Pengguna perlu tahu bedanya "gagal memuat" dan "memang belum ada isi".',
        'Jangan lupa mencatat kegagalan ke telemetri agar tim tahu kontrak API mulai berubah sebelum pengguna mengeluh.'
      ]
    },
    {
      type: 'text',
      html: '<h3>BFF, Cache, dan CORS</h3><p><b>BFF</b> (Backend for Frontend) adalah satu pintu yang menyiapkan data untuk kebutuhan UI. Ia bisa menggabungkan katalog, promo, dan stok dari beberapa service, menyembunyikan rahasia, serta menerapkan rate limit. Remote tetap memanggil satu endpoint yang bentuknya stabil.</p><p>Gunakan cache HTTP dengan sadar: katalog publik cocok dengan <code>Cache-Control: public, max-age=60, stale-while-revalidate=300</code> dan <code>ETag</code>. Data pribadi seperti <code>/api/me</code> dan <code>/api/orders</code> harus <code>no-store</code>. Jangan pernah memberi header cache publik pada respons yang bergantung pada token.</p><p>CORS diatur server, bukan remote. Origin shell <code>http://localhost:4173</code> dan remote <code>4174</code> sampai <code>4177</code> harus diizinkan secara eksplisit bila memanggil API lintas origin. Bila memakai cookie, server harus mengirim <code>Access-Control-Allow-Credentials: true</code> dan <b>tidak boleh</b> memakai <code>*</code> untuk origin. Di produksi, paling aman menaruh API di origin yang sama melalui gateway.</p>'
    },
    {
      type: 'example',
      title: 'BFF menggabungkan katalog dan promo',
      lang: 'js',
      output: false,
      code: `// ilustrasi BFF di server.js — berjalan di server, bukan di remote
app.get('/api/products', async (req, res) => {
  const category = String(req.query.category ?? 'semua');
  const [catalog, promo] = await Promise.all([
    catalogService.list({ category }),
    promoService.active()
  ]);
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({
    items: catalog.map((product) => ({
      ...product,
      promo: promo[product.id] ?? null
    })),
    total: catalog.length
  });
});`,
      explain: [
        'Remote tidak perlu tahu bahwa promo berasal dari service lain. Bentuk respons yang dilihat UI tetap satu kontrak.',
        'Header cache hanya untuk data publik. Endpoint yang membaca token harus mengirim <code>Cache-Control: no-store</code>.',
        'BFF juga tempat yang tepat untuk memetakan galat backend menjadi status HTTP yang konsisten, misalnya 404 atau 503.'
      ]
    },
    {
      type: 'example',
      title: 'Praktik: filter kategori dan respons rusak',
      lang: 'bash',
      output: false,
      code: `# 1. Build dan jalankan proyek
npm run build -w @tokomicro/products
npm start
# 2. Buka /katalog dan periksa Network.
#    Hanya ada satu GET /api/products; filter kategori dilakukan di memori.
# 3. Uji empty state lewat Local Overrides:
#    ganti respons menjadi { "products": [] }
#    UI harus menampilkan pesan kosong, bukan error.
# 4. Uji kontrak rusak dengan override yang sama:
#    ganti respons menjadi { "products": "bukan-array" }
#    UI harus menampilkan error terkendali dan tombol coba lagi.
# 5. Uji AbortController: buka /katalog lalu segera pindah rute.
#    Request yang belum selesai harus berstatus canceled di Network.

npm run typecheck
npm test
npm run test:e2e`,
      explain: [
        'Filter kategori adalah bagian dari kontrak request. Pastikan nama parameter dan nilai yang diizinkan disepakati dengan backend.',
        'Respons rusak harus berhenti di lapisan API dan menjadi <code>ContractError</code>. Komponen tidak perlu tahu detail Zod.',
        'E2E mengecek alur nyata: pilih kategori, lihat hasil, dan pastikan tidak ada request yang menggantung.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Percaya Bentuk Respons',
      text: '<code>res.json()</code> bisa melempar galat bila server mengembalikan HTML, dan field yang hilang bisa membuat <code>undefined.toLocaleString()</code> menjatuhkan render. Jangan memakai <code>as Product[]</code> untuk membungkam TypeScript, jangan melakukan retry tanpa batas saat API sedang down, dan jangan menaruh token di query string karena bocor ke log serta riwayat. Untuk CORS, jangan kombinasikan <code>Access-Control-Allow-Origin: *</code> dengan credentials; browser akan menolaknya, dan bila dipaksa, itu adalah celah keamanan. Ingat juga: validasi hanya melindungi UI, bukan otorisasi. Server tetap wajib memeriksa token dan peran.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: Network, Kontrak, dan Pemulihan</h3><ol><li>Buka DevTools Network di <code>/katalog</code>. Hanya ada satu request <code>GET /api/products</code>; menekan chip kategori tidak menambah request karena filter berjalan di memori.</li><li>Override respons menjadi <code>{ "products": [] }</code>. Empty state tampil dan tidak disalahartikan sebagai kegagalan jaringan.</li><li>Override respons menjadi <code>{ "products": "bukan-array" }</code>. UI menampilkan error dan tombol coba lagi; konsol tidak dipenuhi error render.</li><li>Kembalikan respons normal, tekan coba lagi. Daftar produk muncul tanpa refresh halaman.</li><li>Buka <code>/katalog</code> lalu segera pindah rute. Request yang belum selesai harus dibatalkan oleh <code>AbortController</code>.</li></ol><p>Bila muncul galat CORS, baca preflight <code>OPTIONS</code> dan header yang diminta. Bila data benar tetapi UI kosong, periksa hasil <code>safeParse</code> dan nama field di kontrak.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['BFF', 'Backend for Frontend: satu pintu API yang menyiapkan data untuk kebutuhan UI.'],
        ['AbortController', 'Objek untuk membatalkan request fetch saat tidak lagi dibutuhkan.'],
        ['AbortError', 'Galat yang muncul ketika request dibatalkan; biasanya diabaikan, bukan ditampilkan.'],
        ['safeParse', 'Metode Zod yang mengembalikan hasil validasi tanpa melempar exception.'],
        ['ContractError', 'Galat khusus ketika bentuk respons tidak sesuai skema yang disepakati.'],
        ['Empty state', 'Tampilan saat request berhasil tetapi tidak ada data.'],
        ['Cache-Control', 'Header yang mengatur apakah respons boleh disimpan dan berapa lama.'],
        ['ETag', 'Penanda versi respons untuk cache kondisional.'],
        ['CORS', 'Aturan browser yang mengizinkan permintaan lintas origin.'],
        ['Distributed monolith', 'Sistem terpisah yang tetap harus rilis dan gagal bersamaan karena saling memanggil.']
      ]
    }
  ],
  recap: [
    'Setiap remote memiliki endpoint dan data sendiri; remote tidak memanggil API remote lain.',
    'AbortController mencegah respons lama menimpa state baru dan membatalkan request saat remote dibongkar.',
    'UI harus menangani loading, error, empty, dan ready sebagai keadaan yang berbeda.',
    'Respons divalidasi dengan Zod safeParse; jangan memakai any atau as untuk membungkam kontrak.',
    'BFF, cache HTTP, dan CORS adalah keputusan server yang membuat data aman dan konsisten.'
  ]
});
