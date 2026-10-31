/* ============================================================
   GraphQL — Bab 6: Resolvers: Jantung GraphQL Server
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'resolvers',
  title: 'Resolvers: Jantung GraphQL Server',
  chapter: 'Membangun GraphQL Server',
  duration: '18 menit',
  intro: [
    'Kalau Schema adalah <b>daftar menu restoran</b>, maka Resolver adalah <b>juru masak</b> yang benar-benar memasak makanan itu. Kamu bisa punya menu sepanjang apa pun — tapi tanpa juru masak, tidak ada makanan yang bisa disajikan.',
    '<b>Resolver</b> adalah fungsi JavaScript/TypeScript yang dipanggil GraphQL untuk setiap field yang diminta klien. Setiap field di schema — dari <code>user</code> sampai <code>post.author</code> — punya resolver sendiri yang bertanggung jawab mengambil dan mengembalikan data. Inilah yang membuat GraphQL sangat fleksibel: tiap field bisa mengambil data dari sumber yang berbeda-beda.'
  ],
  objectives: [
    'Memahami konsep resolver dan bagaimana ia dipanggil GraphQL',
    'Menguasai 4 parameter resolver: parent, args, context, info',
    'Memahami execution flow dari query ke response',
    'Mengimplementasikan context untuk inject Prisma Client',
    'Membuat field-level resolver untuk relasi antar entitas',
    'Mengenali N+1 problem sebagai bahaya laten resolver'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa Itu Resolver?</h3><p>Resolver adalah <b>fungsi biasa</b> yang tugasnya satu: <b>mengembalikan nilai untuk sebuah field di schema</b>. Setiap field di Query, Mutation, dan bahkan field di dalam Object Type punya potensi resolver sendiri.</p><table><thead><tr><th>Schema (SDL)</th><th>Resolver (JavaScript)</th></tr></thead><tbody><tr><td><code>type Query { user(id: ID!): User }</code></td><td><code>Query: { user: (_, { id }) => db.findUser(id) }</code></td></tr><tr><td><code>type User { posts: [Post!]! }</code></td><td><code>User: { posts: (parent) => db.getPostsByUserId(parent.id) }</code></td></tr><tr><td><code>type Mutation { createUser(...): User }</code></td><td><code>Mutation: { createUser: (_, { input }) => db.createUser(input) }</code></td></tr></tbody></table><p>Jika tidak ada resolver eksplisit untuk sebuah field, GraphQL menggunakan <b>default resolver</b>: ia membaca field dengan nama yang sama dari objek parent. Itulah kenapa field sederhana seperti <code>user.name</code> tidak selalu perlu ditulis resolvernya secara manual.</p>'
    },
    {
      type: 'text',
      html: '<h3>4 Parameter Resolver</h3><p>Setiap resolver function menerima tepat 4 parameter, secara konvensi dinamai: <code>(parent, args, context, info)</code>.</p><table><thead><tr><th>Parameter</th><th>Nama Lain</th><th>Isi</th><th>Kapan Dipakai</th></tr></thead><tbody><tr><td><code>parent</code></td><td><code>root</code>, <code>obj</code></td><td>Nilai yang dikembalikan resolver <b>satu level di atas</b></td><td>Field-level resolver untuk relasi</td></tr><tr><td><code>args</code></td><td>-</td><td>Argumen yang dikirim klien dalam query</td><td>Filtering, pagination, ID lookup</td></tr><tr><td><code>context</code></td><td><code>ctx</code></td><td>Objek bersama untuk <b>semua</b> resolver dalam satu request</td><td>DB, auth, user session, logger</td></tr><tr><td><code>info</code></td><td>-</td><td>Metadata eksekusi: field yang diminta, path, schema</td><td>Optimisasi, logging, advanced</td></tr></tbody></table><p>Dalam praktik sehari-hari, <code>info</code> jarang dipakai langsung. Yang paling sering digunakan adalah <code>args</code> dan <code>context</code>.</p>'
    },
    {
      type: 'example',
      title: 'Setup Apollo Server (index.ts)',
      lang: 'typescript',
      output: false,
      code: `// src/index.ts
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

// Inisialisasi Prisma Client — satu instance untuk seluruh app
const prisma = new PrismaClient();

// Buat Apollo Server
const server = new ApolloServer({
  typeDefs,   // SDL schema dari file schema.ts
  resolvers,  // Resolver functions dari file resolvers.ts
});

// Jalankan server dengan context
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },

  // Context dijalankan SEKALI per request
  // Objek yang dikembalikan bisa diakses oleh SEMUA resolver
  context: async ({ req }) => {
    // Ambil token dari header Authorization
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    // Dalam proyek nyata, verifikasi token di sini
    // const user = await verifyToken(token);

    return {
      prisma,      // Prisma Client — akses ke database
      token,       // Token autentikasi
      // user,     // User yang sedang login (jika sudah diverifikasi)
    };
  },
});

console.log(\`🚀 Server berjalan di: \${url}\`);
// Output: 🚀 Server berjalan di: http://localhost:4000/`,
      explain: [
        '<b>ApolloServer</b> menerima <code>typeDefs</code> (schema SDL) dan <code>resolvers</code> (implementasi).',
        '<b>context function</b> dijalankan sekali per request HTTP — bukan sekali per resolver. Ini yang membuatnya efisien.',
        'Prisma Client diinisialisasi <b>di luar</b> context function agar tidak dibuat ulang setiap request.',
        '<code>startStandaloneServer</code> adalah cara termudah menjalankan Apollo Server — cocok untuk development dan production sederhana.'
      ]
    },
    {
      type: 'example',
      title: 'Resolvers Lengkap: Query dan Mutation (resolvers.ts)',
      lang: 'typescript',
      output: false,
      code: `// src/resolvers.ts
import { PrismaClient } from '@prisma/client';

// Tipe context yang dipakai di semua resolver
interface Context {
  prisma: PrismaClient;
  token: string;
}

export const resolvers = {
  // =====================================================
  // QUERY RESOLVERS
  // =====================================================
  Query: {
    // Ambil semua user
    users: async (_parent: unknown, _args: unknown, ctx: Context) => {
      return ctx.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    // Ambil user berdasarkan ID
    user: async (_parent: unknown, args: { id: string }, ctx: Context) => {
      return ctx.prisma.user.findUnique({
        where: { id: parseInt(args.id) },
      });
      // Jika tidak ditemukan, Prisma mengembalikan null
      // GraphQL akan menampilkan null (karena user(id): User — nullable)
    },

    // Ambil semua post, dengan filter opsional
    posts: async (
      _parent: unknown,
      args: { status?: string },
      ctx: Context
    ) => {
      return ctx.prisma.post.findMany({
        where: args.status ? { status: args.status } : undefined,
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  // =====================================================
  // MUTATION RESOLVERS
  // =====================================================
  Mutation: {
    // Buat user baru
    createUser: async (
      _parent: unknown,
      args: { input: { name: string; email: string; password: string } },
      ctx: Context
    ) => {
      // Dalam produksi: hash password sebelum disimpan!
      // const hashedPassword = await bcrypt.hash(args.input.password, 10);
      return ctx.prisma.user.create({
        data: {
          name: args.input.name,
          email: args.input.email,
          password: args.input.password, // simpan hash di produksi
        },
      });
    },

    // Buat post baru
    createPost: async (
      _parent: unknown,
      args: { authorId: string; input: { title: string; content: string; status?: string } },
      ctx: Context
    ) => {
      return ctx.prisma.post.create({
        data: {
          title: args.input.title,
          content: args.input.content,
          status: args.input.status ?? 'DRAFT',
          authorId: parseInt(args.authorId),
        },
      });
    },

    // Update user
    updateUser: async (
      _parent: unknown,
      args: { id: string; input: { name?: string; bio?: string } },
      ctx: Context
    ) => {
      return ctx.prisma.user.update({
        where: { id: parseInt(args.id) },
        data: args.input,
      });
    },

    // Hapus user
    deleteUser: async (
      _parent: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      await ctx.prisma.user.delete({
        where: { id: parseInt(args.id) },
      });
      return true;
    },
  },

  // =====================================================
  // FIELD-LEVEL RESOLVERS (untuk relasi)
  // =====================================================
  User: {
    // Resolver ini dipanggil setiap kali klien minta field "posts" dari User
    posts: async (parent: { id: number }, _args: unknown, ctx: Context) => {
      // parent.id adalah ID dari User yang sedang diproses
      return ctx.prisma.post.findMany({
        where: { authorId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Post: {
    // Resolver untuk mendapatkan author dari sebuah Post
    author: async (parent: { authorId: number }, _args: unknown, ctx: Context) => {
      return ctx.prisma.user.findUnique({
        where: { id: parent.authorId },
      });
    },
  },
};`,
      explain: [
        '<b>Query resolvers</b> mengambil data dari database melalui Prisma — ctx.prisma adalah Prisma Client dari context.',
        '<b>Mutation resolvers</b> memodifikasi data: create, update, delete. Selalu kembalikan data terbaru agar klien tidak perlu query ulang.',
        '<b>Field-level resolver</b> User.posts: <code>parent</code> adalah objek User yang sudah diambil Query.user — kita gunakan parent.id untuk mencari posts-nya.',
        'Context (<code>ctx</code>) adalah "tas belanja" yang dibawa ke semua resolver — isinya sama untuk semua resolver dalam satu request.'
      ]
    },
    {
      type: 'example',
      title: 'Context Setup dengan Prisma Client',
      lang: 'typescript',
      output: false,
      code: `// src/index.ts — bagian context yang lebih lengkap

import { PrismaClient } from '@prisma/client';
import { verifyJwt } from './auth'; // fungsi verifikasi JWT-mu sendiri

const prisma = new PrismaClient({
  log: ['query', 'error'], // log semua query SQL ke console (dev only)
});

// Context dibuat SEKALI per HTTP request
const contextFunction = async ({ req }: { req: Request }) => {
  // 1. Ambil token dari header
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // 2. Verifikasi token (jika ada)
  let currentUser = null;
  if (token) {
    try {
      currentUser = await verifyJwt(token);
    } catch {
      // Token tidak valid — biarkan null, resolver yang akan memutuskan
    }
  }

  // 3. Kembalikan context — semua resolver bisa akses ini
  return {
    prisma,       // Database client
    currentUser,  // User yang sedang login (atau null)
    token,        // Raw token
  };
};

// Contoh penggunaan di resolver yang butuh autentikasi:
//
// createPost: async (_parent, args, ctx) => {
//   if (!ctx.currentUser) {
//     throw new Error('Harus login terlebih dahulu');
//   }
//   return ctx.prisma.post.create({ data: { ...args.input, authorId: ctx.currentUser.id } });
// }`,
      explain: [
        'Context function menerima HTTP request asli — dari sini kita bisa baca headers, cookies, dan sebagainya.',
        'Verifikasi JWT dilakukan <b>di context</b>, bukan di setiap resolver — ini menghindari duplikasi kode.',
        'Jika token tidak valid, kita biarkan currentUser null dan biarkan resolver memutuskan apakah perlu autentikasi.',
        'Satu instance Prisma (<code>const prisma</code> di luar fungsi) dibagi oleh seluruh request — efisien dan aman.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Resolver Execution Flow',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 10px; background: #0f172a; color: #e2e8f0; }
  .query-box { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; font-family: monospace; font-size: 12px; color: #93c5fd; margin-bottom: 10px; }
  button { padding: 7px 16px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; font-size: 12px; }
  button:disabled { background: #334155; cursor: not-allowed; }
  .steps { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  .step { display: flex; align-items: flex-start; gap: 8px; padding: 7px 10px; border-radius: 6px; background: #1e293b; border: 1px solid #334155; opacity: 0.35; transition: opacity .3s, border-color .3s; }
  .step.active { opacity: 1; border-color: #3b82f6; }
  .step.done { opacity: 1; border-color: #22c55e; }
  .step-num { background: #334155; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .step.active .step-num { background: #2563eb; }
  .step.done .step-num { background: #16a34a; }
  .step-title { font-weight: 700; font-size: 12px; color: #93c5fd; }
  .step.done .step-title { color: #4ade80; }
  .step-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .response { background: #1e293b; border: 1px solid #22c55e; border-radius: 6px; padding: 8px 12px; font-family: monospace; font-size: 11px; color: #4ade80; margin-top: 10px; display: none; }
  .spinner { display: inline-block; width: 10px; height: 10px; border: 2px solid #334155; border-top-color: #60a5fa; border-radius: 50%; animation: spin .6s linear infinite; margin-left: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<p style="margin:0 0 6px;color:#94a3b8;font-size:12px">Query yang akan dieksekusi:</p>
<div class="query-box">query {<br>&nbsp;&nbsp;user(id: "1") {<br>&nbsp;&nbsp;&nbsp;&nbsp;name<br>&nbsp;&nbsp;&nbsp;&nbsp;email<br>&nbsp;&nbsp;&nbsp;&nbsp;posts { title status }<br>&nbsp;&nbsp;}<br>}</div>
<button id="btn" onclick="runFlow()">▶ Kirim Query</button>
<div class="steps" id="steps">
  <div class="step" id="s0"><div class="step-num">1</div><div><div class="step-title">Terima HTTP Request</div><div class="step-desc">Apollo Server menerima POST /graphql dari klien</div></div></div>
  <div class="step" id="s1"><div class="step-num">2</div><div><div class="step-title">Parse Query</div><div class="step-desc">GraphQL mem-parse string query menjadi AST (Abstract Syntax Tree)</div></div></div>
  <div class="step" id="s2"><div class="step-num">3</div><div><div class="step-title">Validasi Schema</div><div class="step-desc">Cek apakah field yang diminta (user, name, posts) ada di schema</div></div></div>
  <div class="step" id="s3"><div class="step-num">4</div><div><div class="step-title">Bangun Context</div><div class="step-desc">Jalankan context function: buat { prisma, currentUser } untuk request ini</div></div></div>
  <div class="step" id="s4"><div class="step-num">5</div><div><div class="step-title">Jalankan Query.user Resolver</div><div class="step-desc">Query.user(_, { id: "1" }, ctx) → prisma.user.findUnique({ where: { id: 1 } })</div></div></div>
  <div class="step" id="s5"><div class="step-num">6</div><div><div class="step-title">Jalankan User.posts Resolver</div><div class="step-desc">User.posts(parent={id:1,...}, _, ctx) → prisma.post.findMany({ where: { authorId: 1 } })</div></div></div>
  <div class="step" id="s6"><div class="step-num">7</div><div><div class="step-title">Susun Response JSON</div><div class="step-desc">GraphQL menggabungkan hasil semua resolver menjadi satu objek JSON</div></div></div>
  <div class="step" id="s7"><div class="step-num">8</div><div><div class="step-title">Kirim HTTP Response</div><div class="step-desc">Status 200 OK + body JSON dikirim kembali ke klien</div></div></div>
</div>
<div class="response" id="response"></div>
<script>
  let running = false;
  function runFlow() {
    if (running) return;
    running = true;
    document.getElementById('btn').disabled = true;
    document.getElementById('response').style.display = 'none';
    for (let i = 0; i < 8; i++) {
      document.getElementById('s' + i).className = 'step';
    }
    const delays = [0, 400, 800, 1300, 1900, 2600, 3300, 3800];
    const doneAt = [300, 700, 1200, 1800, 2500, 3200, 3700, 4200];
    delays.forEach((d, i) => {
      setTimeout(() => {
        document.getElementById('s' + i).className = 'step active';
      }, d);
      setTimeout(() => {
        document.getElementById('s' + i).className = 'step done';
      }, doneAt[i]);
    });
    setTimeout(() => {
      const resp = document.getElementById('response');
      resp.style.display = 'block';
      resp.textContent = JSON.stringify({
        data: {
          user: {
            name: "Budi Santoso",
            email: "budi@example.com",
            posts: [
              { title: "Belajar GraphQL", status: "PUBLISHED" },
              { title: "Prisma ORM Tips", status: "DRAFT" }
            ]
          }
        }
      }, null, 2);
      document.getElementById('btn').disabled = false;
      running = false;
    }, 4500);
  }
</script>
</body>
</html>`,
      hint: 'Klik "Kirim Query" untuk melihat bagaimana GraphQL memproses query step by step — dari HTTP request sampai JSON response.'
    },
    {
      type: 'tip',
      title: 'Context adalah "Tas Belanja" yang Dibawa ke Semua Resolver',
      text: 'Bayangkan context sebagai <b>tas belanja</b> yang kamu bawa saat berbelanja. Saat masuk toko (request datang), tas diisi: Prisma Client, info user yang login, logger, dsb. Selama berbelanja (resolver berjalan), kamu tinggal mengambil dari tas — tidak perlu cari ulang kasir (buat koneksi DB baru) setiap mau ambil barang. Semua resolver dalam satu request berbagi tas yang sama.'
    },
    {
      type: 'warn',
      title: 'N+1 Problem — Bahaya Tersembunyi di Field Resolver',
      text: 'Jika klien query 100 user dan setiap user punya field <code>posts</code>, maka User.posts resolver akan dipanggil <b>100 kali</b> — masing-masing mengirim query SQL ke database. Ini disebut <b>N+1 problem</b>: 1 query untuk users + N query untuk posts. Solusinya adalah <b>DataLoader</b> (dibahas di bab berikutnya) yang mem-batch semua query posts menjadi satu query SQL. Untuk sekarang, cukup sadari bahwa field-level resolver bisa berbahaya jika data bersifat relasional.'
    },
    {
      type: 'vocab',
      items: [
        ['Resolver', 'Fungsi yang bertanggung jawab mengembalikan nilai untuk satu field di schema GraphQL.'],
        ['Parent', 'Parameter pertama resolver — berisi nilai yang dikembalikan resolver level di atasnya. Kosong (null) untuk root Query/Mutation.'],
        ['Args', 'Parameter kedua resolver — berisi argumen yang dikirim klien dalam query, misalnya { id: "1" }.'],
        ['Context', 'Parameter ketiga resolver — objek bersama yang dibuat sekali per request dan bisa diakses semua resolver. Biasanya berisi DB client dan info autentikasi.'],
        ['Info', 'Parameter keempat resolver — metadata eksekusi: field yang diminta, AST, schema. Jarang digunakan secara langsung.'],
        ['Execution Flow', 'Urutan langkah GraphQL memproses query: parse → validasi → context → eksekusi resolver → susun response.'],
        ['Context Injection', 'Pola memasukkan dependency (Prisma, auth) ke dalam context sehingga semua resolver bisa mengaksesnya tanpa import langsung.']
      ]
    }
  ],
  recap: [
    '<b>Resolver</b> adalah fungsi yang mengembalikan nilai untuk setiap field — inilah yang membuat schema "hidup".',
    'Setiap resolver menerima <b>4 parameter</b>: <code>parent</code>, <code>args</code>, <code>context</code>, <code>info</code>.',
    '<b>Context</b> dibuat sekali per request dan dibagikan ke semua resolver — tempat ideal untuk Prisma Client dan info autentikasi.',
    '<b>Field-level resolver</b> (User.posts, Post.author) menangani relasi antar entitas menggunakan <code>parent.id</code>.',
    '<b>N+1 problem</b> terjadi ketika field resolver dipanggil N kali untuk N parent — solusinya adalah DataLoader (bab berikutnya).',
    'GraphQL secara otomatis menggunakan <b>default resolver</b> untuk field yang tidak punya resolver eksplisit.'
  ]
});
