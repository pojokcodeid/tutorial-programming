/* ============================================================
   GraphQL — Bab 11: Mengatasi N+1 Problem dengan DataLoader
   ============================================================ */
'use strict';
window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];
window.GRAPHQL_LESSONS.push({
  id: 'n-plus-1-dataloader',
  title: 'Mengatasi N+1 Problem dengan DataLoader',
  chapter: 'Teknik Lanjutan',
  duration: '18 menit',
  intro: [
    'Bayangkan kamu minta daftar 10 user beserta postingan masing-masing. Tanpa optimasi, GraphQL akan melakukan <b>11 query ke database</b>: 1 untuk ambil semua user, lalu 10 lagi untuk ambil postingan tiap user. Inilah yang disebut <b>N+1 Problem</b>.',
    '<b>DataLoader</b> adalah library dari Meta yang menyelesaikan masalah ini dengan teknik <b>batching</b>: mengumpulkan semua request dalam satu event loop tick, lalu mengirim satu query tunggal ke database. Hasilnya: dari 11 query menjadi 2.'
  ],
  objectives: [
    'Menjelaskan N+1 Problem dengan contoh query users + posts',
    'Menunjukkan berapa banyak query SQL yang dihasilkan tanpa DataLoader',
    'Mengimplementasikan DataLoader dengan batch function',
    'Mengintegrasikan DataLoader ke dalam context resolver',
    'Menulis resolver yang memanfaatkan DataLoader alih-alih query langsung'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>N+1 Problem: Masalah yang Mudah Terjadi di GraphQL</h3><p>N+1 Problem adalah situasi di mana satu operasi membutuhkan <b>N+1 query database</b> padahal seharusnya bisa dilakukan dengan jauh lebih sedikit.</p><table><thead><tr><th>Langkah</th><th>Operasi</th><th>Query ke DB</th></tr></thead><tbody><tr><td>1</td><td>Query <code>users</code> — ambil semua user</td><td>1 query</td></tr><tr><td>2 s/d 11</td><td>Untuk tiap user, resolver <code>User.posts</code> dipanggil terpisah</td><td>10 query (N = jumlah user)</td></tr><tr><td>Total</td><td>—</td><td><b>11 query (N+1)</b></td></tr></tbody></table><p>Di aplikasi besar dengan ratusan item, ini bisa menghasilkan <b>ratusan query per request</b> — sangat lambat dan membebani database.</p>'
    },
    {
      type: 'example',
      title: 'Kode Resolver yang Menyebabkan N+1 Problem',
      lang: 'typescript',
      output: false,
      code: `// resolvers/userResolver.ts — TANPA DataLoader (bermasalah!)

import { prisma } from '../lib/prisma';

export const userResolver = {
  Query: {
    // Resolver untuk query users
    users: async () => {
      // Query 1: ambil semua user
      const users = await prisma.user.findMany();
      return users; // misalnya menghasilkan 10 user
    },
  },

  User: {
    // Resolver untuk field posts di setiap User
    // Ini dipanggil TERPISAH untuk setiap user yang dikembalikan!
    posts: async (parent: { id: string }) => {
      // Query 2, 3, 4, ... 11: dipanggil 10 kali, satu per user
      const posts = await prisma.post.findMany({
        where: { authorId: parent.id },
      });
      return posts;
    },
  },
};`,
      explain: [
        'Resolver <code>users</code> menjalankan 1 query untuk mengambil semua user.',
        'Resolver <code>User.posts</code> dipanggil <b>sekali per user</b> — jika ada 10 user, ini berarti 10 query terpisah.',
        'GraphQL menjalankan field resolver secara paralel, namun tetap menghasilkan N query terpisah ke database.',
        'Masalah ini tidak terlihat di development (sedikit data), tapi sangat terasa di production dengan ratusan record.'
      ]
    },
    {
      type: 'example',
      title: 'Query SQL yang Dihasilkan (N+1 Problem)',
      lang: 'sql',
      output: false,
      code: `-- Query 1: ambil semua user (dari resolver users)
SELECT * FROM "User";
-- Hasil: 10 baris (user id: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

-- Query 2: posts untuk user id 1
SELECT * FROM "Post" WHERE "authorId" = '1';

-- Query 3: posts untuk user id 2
SELECT * FROM "Post" WHERE "authorId" = '2';

-- Query 4: posts untuk user id 3
SELECT * FROM "Post" WHERE "authorId" = '3';

-- Query 5: posts untuk user id 4
SELECT * FROM "Post" WHERE "authorId" = '4';

-- Query 6: posts untuk user id 5
SELECT * FROM "Post" WHERE "authorId" = '5';

-- Query 7: posts untuk user id 6
SELECT * FROM "Post" WHERE "authorId" = '6';

-- Query 8: posts untuk user id 7
SELECT * FROM "Post" WHERE "authorId" = '7';

-- Query 9: posts untuk user id 8
SELECT * FROM "Post" WHERE "authorId" = '8';

-- Query 10: posts untuk user id 9
SELECT * FROM "Post" WHERE "authorId" = '9';

-- Query 11: posts untuk user id 10
SELECT * FROM "Post" WHERE "authorId" = '10';

-- Total: 11 query untuk satu GraphQL request!
-- Seharusnya cukup 2 query.`,
      explain: [
        'Database menerima 11 koneksi dan query terpisah hanya untuk satu GraphQL request <code>{ users { posts } }</code>.',
        'Dengan DataLoader, query 2-11 akan digabung menjadi: <code>SELECT * FROM "Post" WHERE "authorId" IN (\'1\', \'2\', ..., \'10\')</code>.',
        'Satu query <code>IN</code> jauh lebih efisien: database hanya perlu satu table scan dan satu round-trip network.',
        'Perbedaan performa: 11 query vs 2 query — di database yang sibuk, ini bisa menghemat hingga 5x waktu response.'
      ]
    },
    {
      type: 'example',
      title: 'Implementasi DataLoader (src/loaders/createLoaders.ts)',
      lang: 'typescript',
      output: false,
      code: `// src/loaders/createLoaders.ts
import DataLoader from 'dataloader';
import { prisma } from '../lib/prisma';
import type { Post } from '@prisma/client';

// Batch function: dipanggil SEKALI dengan semua key yang terkumpul
// dalam satu event loop tick
async function batchLoadPostsByAuthorId(
  authorIds: readonly string[]
): Promise<Post[][]> {
  // Satu query untuk semua author sekaligus!
  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: [...authorIds] },
    },
  });

  // DataLoader mengharuskan kita mengembalikan array hasil
  // dengan urutan dan panjang yang SAMA dengan array input (authorIds)
  return authorIds.map((authorId) =>
    posts.filter((post) => post.authorId === authorId)
  );
}

// Factory function: buat semua loaders sekaligus
// Dipanggil sekali per request (di context factory)
export function createLoaders() {
  return {
    postsByAuthorId: new DataLoader<string, Post[]>(batchLoadPostsByAuthorId),
    // Tambahkan loader lain di sini:
    // commentsByPostId: new DataLoader<string, Comment[]>(batchLoadComments),
  };
}

// Type helper untuk digunakan di resolver
export type Loaders = ReturnType<typeof createLoaders>;`,
      explain: [
        'DataLoader menerima <b>batch function</b> yang dipanggil dengan <b>semua key</b> yang terkumpul dalam satu event loop tick.',
        'Kunci untuk DataLoader adalah nilai yang digunakan sebagai filter — dalam hal ini <code>authorId</code>.',
        'Hasil dari batch function harus berupa array dengan panjang yang sama dan urutan yang sama dengan input <code>authorIds</code>.',
        '<code>createLoaders()</code> adalah factory function yang menciptakan instance DataLoader baru untuk setiap request.',
        'Setiap DataLoader instance memiliki cache internal tersendiri — request kedua dengan key yang sama tidak akan memanggil batch function lagi.'
      ]
    },
    {
      type: 'example',
      title: 'Context dengan DataLoader Injected (src/context.ts)',
      lang: 'typescript',
      output: false,
      code: `// src/context.ts
import { Request } from 'express';
import { createLoaders, Loaders } from './loaders/createLoaders';

export interface AppContext {
  loaders: Loaders;
  userId?: string; // dari JWT token (dibahas di bab keamanan)
}

// Fungsi ini dipanggil oleh ApolloServer untuk setiap request masuk
export async function createContext({ req }: { req: Request }): Promise<AppContext> {
  // PENTING: createLoaders() dipanggil di sini — per request, bukan global
  // Ini memastikan cache DataLoader tidak bocor antar request yang berbeda
  const loaders = createLoaders();

  return {
    loaders,
    // userId: extractUserIdFromToken(req.headers.authorization),
  };
}

// Di ApolloServer setup:
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   context: createContext,  // ← inject context factory
// });`,
      explain: [
        'Context factory <code>createContext</code> dipanggil sekali per setiap HTTP request yang masuk.',
        'Karena <code>createLoaders()</code> dipanggil di dalam <code>createContext</code>, setiap request mendapat instance DataLoader yang <b>fresh</b>.',
        'DataLoader cache hanya berlaku selama satu request — tidak ada risiko data dari user A terlihat oleh user B.',
        'Semua resolver dapat mengakses <code>context.loaders.postsByAuthorId</code> untuk melakukan batched query.'
      ]
    },
    {
      type: 'example',
      title: 'Resolver yang Menggunakan DataLoader (Solusi N+1)',
      lang: 'typescript',
      output: false,
      code: `// resolvers/userResolver.ts — DENGAN DataLoader (solusi!)
import { prisma } from '../lib/prisma';
import type { AppContext } from '../context';

export const userResolver = {
  Query: {
    users: async () => {
      // Query 1: ambil semua user — sama seperti sebelumnya
      return prisma.user.findMany();
    },
  },

  User: {
    // Resolver posts sekarang menggunakan DataLoader
    posts: async (
      parent: { id: string },
      _args: unknown,
      context: AppContext  // ← akses loaders dari context
    ) => {
      // DataLoader mengumpulkan semua panggilan ini,
      // lalu mengirim SATU query batch ke database
      return context.loaders.postsByAuthorId.load(parent.id);
    },
  },
};

// Alur eksekusi saat ada 10 user:
// Tick 1: 10 resolver User.posts memanggil .load('1'), .load('2'), ..., .load('10')
// DataLoader mengumpulkan semua key: ['1', '2', ..., '10']
// Tick 2 (microtask): DataLoader memanggil batchFunction(['1', ..., '10'])
// Hasilnya: hanya 1 query SQL dengan WHERE authorId IN (...)`,
      explain: [
        'Ganti <code>prisma.post.findMany()</code> dengan <code>context.loaders.postsByAuthorId.load(parent.id)</code>.',
        'Method <code>.load(key)</code> tidak langsung mengirim query — ia mendaftarkan key ke batch queue.',
        'Setelah semua resolver sync selesai dieksekusi, DataLoader menggabungkan semua key dan memanggil batch function sekali.',
        'Hasilnya: dari 11 query SQL menjadi hanya 2 query — performa meningkat drastis.',
        'Jika dua resolver memanggil <code>.load(\'1\')</code>, DataLoader hanya fetch data satu kali dan meng-cache hasilnya.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Bandingkan N+1 vs DataLoader',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; color: #0f172a; background: #f8fafc; }
  h3 { margin: 0 0 8px; font-size: 15px; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; }
  .panel { flex: 1; min-width: 260px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
  .panel.bad { border-top: 3px solid #ef4444; }
  .panel.good { border-top: 3px solid #22c55e; }
  button { padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 13px; color: #fff; }
  .btn-bad { background: #ef4444; }
  .btn-bad:hover { background: #dc2626; }
  .btn-good { background: #22c55e; }
  .btn-good:hover { background: #16a34a; }
  button:disabled { background: #94a3b8; cursor: not-allowed; }
  .log { background: #0f172a; border-radius: 8px; padding: 10px; font-size: 11px; font-family: monospace; height: 220px; overflow-y: auto; margin: 10px 0; }
  .log-q { color: #f87171; }
  .log-batch { color: #4ade80; }
  .log-info { color: #60a5fa; }
  .log-time { color: #f59e0b; }
  .result { font-size: 13px; font-weight: 700; margin-top: 6px; }
  .result.bad { color: #ef4444; }
  .result.good { color: #22c55e; }
</style>
</head>
<body>
<div class="row">
  <div class="panel bad">
    <h3>❌ Tanpa DataLoader (N+1)</h3>
    <button class="btn-bad" id="btnBad">Jalankan Query</button>
    <div class="log" id="logBad"><span style="color:#475569">Klik tombol untuk simulasi...</span></div>
    <div class="result bad" id="resultBad"></div>
  </div>
  <div class="panel good">
    <h3>✅ Dengan DataLoader (Batching)</h3>
    <button class="btn-good" id="btnGood">Jalankan Query</button>
    <div class="log" id="logGood"><span style="color:#475569">Klik tombol untuk simulasi...</span></div>
    <div class="result good" id="resultGood"></div>
  </div>
</div>

<script>
  var USERS = ['Alice','Bob','Charlie','Diana','Evan','Fiona','George','Hana','Ivan','Julia'];
  var DELAY_PER_QUERY = 120;

  function addLog(boxId, msg, cls) {
    var box = document.getElementById(boxId);
    if (box.querySelector('span')) box.innerHTML = '';
    var line = document.createElement('div');
    line.innerHTML = '<span class="' + (cls||'') + '">' + msg + '</span>';
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  function sleep(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

  document.getElementById('btnBad').onclick = async function() {
    var btn = this;
    btn.disabled = true;
    document.getElementById('logBad').innerHTML = '';
    document.getElementById('resultBad').textContent = '';
    var t0 = Date.now();
    addLog('logBad', '→ [Query 1] SELECT * FROM User', 'log-q');
    await sleep(DELAY_PER_QUERY);
    addLog('logBad', '← 10 users diterima', 'log-info');
    for (var i = 0; i < USERS.length; i++) {
      await sleep(DELAY_PER_QUERY);
      addLog('logBad', '→ [Query ' + (i+2) + '] SELECT * FROM Post WHERE authorId = \'' + (i+1) + '\'', 'log-q');
      await sleep(DELAY_PER_QUERY);
      addLog('logBad', '← Posts untuk ' + USERS[i] + ' diterima', 'log-info');
    }
    var elapsed = Date.now() - t0;
    addLog('logBad', '⏱ Selesai dalam ' + elapsed + 'ms', 'log-time');
    document.getElementById('resultBad').textContent = '⚠️ Total: 11 query SQL | ' + elapsed + 'ms';
    btn.disabled = false;
  };

  document.getElementById('btnGood').onclick = async function() {
    var btn = this;
    btn.disabled = true;
    document.getElementById('logGood').innerHTML = '';
    document.getElementById('resultGood').textContent = '';
    var t0 = Date.now();
    addLog('logGood', '→ [Query 1] SELECT * FROM User', 'log-batch');
    await sleep(DELAY_PER_QUERY);
    addLog('logGood', '← 10 users diterima', 'log-info');
    addLog('logGood', '⚡ DataLoader mengumpulkan 10 authorId...', 'log-info');
    await sleep(60);
    addLog('logGood', '⚡ DataLoader batch: authorId [1,2,3,4,5,6,7,8,9,10]', 'log-info');
    await sleep(DELAY_PER_QUERY);
    addLog('logGood', '→ [Query 2] SELECT * FROM Post WHERE authorId IN (1..10)', 'log-batch');
    await sleep(DELAY_PER_QUERY + 40);
    addLog('logGood', '← Semua posts diterima sekaligus', 'log-info');
    addLog('logGood', '⚡ DataLoader mendistribusikan posts ke masing-masing user', 'log-info');
    var elapsed = Date.now() - t0;
    addLog('logGood', '⏱ Selesai dalam ' + elapsed + 'ms', 'log-time');
    document.getElementById('resultGood').textContent = '✅ Total: 2 query SQL | ' + elapsed + 'ms';
    btn.disabled = false;
  };
</script>
</body>
</html>`,
      hint: 'Klik keduanya dan bandingkan jumlah query dan total waktu. Tanpa DataLoader: 11 query satu per satu. Dengan DataLoader: hanya 2 query dan jauh lebih cepat.'
    },
    {
      type: 'tip',
      title: 'DataLoader juga melakukan caching dalam satu request',
      text: 'Selain batching, DataLoader secara otomatis meng-cache hasil berdasarkan key dalam scope satu request. Artinya, jika dua resolver berbeda memanggil <code>loader.load(\'user:1\')</code> dalam request yang sama, database hanya diquery satu kali — hasil pertama di-cache dan digunakan untuk panggilan kedua. Ini adalah level kedua optimasi di atas batching!'
    },
    {
      type: 'warn',
      title: 'DataLoader cache hanya berlaku per-request, bukan global!',
      text: 'DataLoader <b>harus dibuat ulang untuk setiap HTTP request</b>. Jangan membuat instance DataLoader di level modul (di luar fungsi context). Jika kamu membuat DataLoader secara global, cache-nya akan bocor antar request — request dari user A bisa mendapatkan data yang seharusnya untuk user B. Selalu buat DataLoader di dalam context factory (<code>createContext</code>) yang dipanggil per-request.'
    },
    {
      type: 'vocab',
      items: [
        ['N+1 Problem', 'Situasi di mana satu operasi menghasilkan N+1 query database: 1 untuk list induk, lalu N query untuk setiap item anakan.'],
        ['DataLoader', 'Library dari Meta (Facebook) yang menyelesaikan N+1 Problem dengan teknik batching dan per-request caching.'],
        ['Batching', 'Teknik menggabungkan banyak request individual menjadi satu request bulk yang dikirim ke database sekaligus.'],
        ['Caching per-Request', 'Cache DataLoader yang berlaku hanya selama satu HTTP request, lalu dibuang — aman dari data leakage antar user.'],
        ['Batch Function', 'Fungsi yang diberikan ke DataLoader berisi logika pengambilan data secara bulk — menerima array key, mengembalikan array hasil dengan urutan yang sama.']
      ]
    }
  ],
  recap: [
    'N+1 Problem terjadi saat resolver anak (mis. <code>User.posts</code>) melakukan query database <b>untuk setiap item induk</b> secara terpisah.',
    '10 users + field posts = <b>11 query SQL</b> — seharusnya cukup 2.',
    'DataLoader menyelesaikan ini dengan <b>batching</b>: mengumpulkan semua <code>.load(key)</code> dalam satu tick, lalu memanggil batch function sekali.',
    'Buat DataLoader di dalam <code>createContext</code> (per-request) dan inject ke context — jangan global!',
    'DataLoader juga meng-cache hasil per-request, sehingga key yang sama tidak difetch dua kali dalam satu request.'
  ]
});
