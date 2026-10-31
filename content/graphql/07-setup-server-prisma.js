/* ============================================================
   GraphQL — Bab 7: Setup GraphQL Server dengan Apollo Server & Prisma + MariaDB
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'setup-server-prisma',
  title: 'Setup GraphQL Server dengan Apollo Server & Prisma + MariaDB',
  chapter: 'Membangun GraphQL Server',
  duration: '20 menit',
  intro: [
    'Bab-bab sebelumnya kita sudah memahami schema dan resolver secara konsep. Sekarang waktunya <b>membangun server sungguhan</b> dari nol. Kita akan memakai tiga teknologi yang bekerja sangat baik bersama: <b>Apollo Server</b> sebagai GraphQL server, <b>Prisma</b> sebagai ORM yang modern dan type-safe, dan <b>MariaDB</b> sebagai database relasional.',
    'Bayangkan Apollo Server sebagai <b>resepsionis hotel</b> yang menerima tamu (query GraphQL). Prisma adalah <b>asisten manajer</b> yang tahu di mana setiap barang disimpan di gudang (database). MariaDB adalah <b>gudang</b> itu sendiri. Ketiganya bekerja bersama untuk menjawab setiap permintaan tamu dengan cepat dan akurat.'
  ],
  objectives: [
    'Membuat proyek Node.js + TypeScript dari nol',
    'Menginstal dan mengkonfigurasi Apollo Server dan Prisma',
    'Membuat schema Prisma untuk model User dan Post dengan MariaDB',
    'Menjalankan migration dan seed data awal',
    'Menulis schema GraphQL (SDL) dan resolvers lengkap',
    'Menjalankan server dan mengaksesnya di browser'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Persiapan: Pastikan MariaDB Berjalan</h3><p>Sebelum memulai, pastikan MariaDB sudah berjalan di komputer dan database sudah dibuat:</p><table><thead><tr><th>Konfigurasi</th><th>Nilai</th></tr></thead><tbody><tr><td>Host</td><td><code>localhost</code></td></tr><tr><td>Port</td><td><code>3306</code></td></tr><tr><td>Username</td><td><code>root</code></td></tr><tr><td>Password</td><td><code>rootpassword</code></td></tr><tr><td>Database</td><td><code>graphql_blog</code></td></tr></tbody></table><p>Buat database jika belum ada:</p><pre style="background:#0f172a;color:#e2e8f0;padding:8px;border-radius:6px;font-size:12px">mysql -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS graphql_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"</pre>'
    },
    {
      type: 'example',
      title: 'Langkah 1: Init Proyek & Install Dependencies',
      lang: 'bash',
      output: false,
      code: `# Buat folder proyek
mkdir graphql-blog-server
cd graphql-blog-server

# Inisialisasi proyek Node.js
npm init -y

# Install TypeScript dan tools
npm install --save-dev typescript ts-node @types/node nodemon

# Install Apollo Server dan GraphQL
npm install @apollo/server graphql

# Install Prisma
npm install --save-dev prisma
npm install @prisma/client

# Buat tsconfig.json
npx tsc --init

# Inisialisasi Prisma (buat folder prisma/ dan .env)
npx prisma init --datasource-provider mysql

# Struktur folder yang akan terbentuk:
# graphql-blog-server/
# ├── prisma/
# │   └── schema.prisma      ← definisi model database
# ├── src/
# │   ├── index.ts           ← entry point, Apollo Server
# │   ├── schema.ts          ← SDL type definitions
# │   └── resolvers.ts       ← resolver functions
# ├── .env                   ← DATABASE_URL dan secrets
# ├── package.json
# └── tsconfig.json`,
      explain: [
        '<code>npx prisma init</code> membuat folder <code>prisma/</code> dengan file <code>schema.prisma</code> dan file <code>.env</code> dengan DATABASE_URL kosong.',
        '<code>@apollo/server</code> adalah versi terbaru Apollo Server (v4) — lebih ringan dan modular dari versi sebelumnya.',
        '<code>ts-node</code> memungkinkan kita menjalankan TypeScript langsung tanpa kompilasi manual.',
        'Kita pisahkan schema dan resolvers ke file berbeda agar kode rapi dan mudah dipelihara.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 2: Konfigurasi tsconfig.json dan package.json',
      lang: 'json',
      output: false,
      code: `// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

// package.json — tambahkan scripts ini:
// {
//   "scripts": {
//     "dev": "nodemon --exec ts-node src/index.ts",
//     "build": "tsc",
//     "start": "node dist/index.js",
//     "prisma:generate": "prisma generate",
//     "prisma:migrate": "prisma migrate dev",
//     "prisma:seed": "ts-node prisma/seed.ts",
//     "prisma:studio": "prisma studio"
//   }
// }`,
      explain: [
        '<code>nodemon --exec ts-node</code> akan me-restart server otomatis setiap kali kamu menyimpan file.',
        '<code>prisma generate</code> harus dijalankan setiap kali kamu mengubah schema.prisma agar type TypeScript-nya ikut diperbarui.',
        '<code>prisma studio</code> membuka GUI browser untuk melihat dan mengedit data di database — sangat berguna saat development.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 3: .env — Database Connection String',
      lang: 'bash',
      output: false,
      code: `# .env
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="mysql://root:rootpassword@localhost:3306/graphql_blog"

# PENTING: Tambahkan .env ke .gitignore agar tidak ter-commit!
# Buat file .gitignore:
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore

# Verifikasi koneksi (setelah schema.prisma dikonfigurasi):
# npx prisma db pull    ← baca schema dari DB yang sudah ada
# npx prisma migrate dev ← buat tabel baru dari schema.prisma`,
      explain: [
        'DATABASE_URL harus menyertakan semua info koneksi dalam satu string.',
        '<b>Jangan hardcode</b> kredensial database langsung di kode TypeScript — selalu gunakan environment variable.',
        'File <code>.env</code> dibaca otomatis oleh Prisma — tidak perlu install dotenv untuk Prisma CLI.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 4: prisma/schema.prisma — Model User & Post',
      lang: 'prisma',
      output: false,
      code: `// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"   // MariaDB kompatibel dengan provider mysql
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  bio       String?  // nullable: pakai ? di Prisma
  avatarUrl String?  @map("avatar_url")
  role      Role     @default(READER)
  posts     Post[]   // relasi: satu User bisa punya banyak Post
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")      // nama tabel di database: "users"
}

model Post {
  id        Int        @id @default(autoincrement())
  title     String
  content   String     @db.Text  // kolom TEXT untuk konten panjang
  status    PostStatus @default(DRAFT)
  viewCount Int        @default(0) @map("view_count")
  authorId  Int        @map("author_id")
  author    User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags      String?    // disimpan sebagai JSON string atau CSV
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  @@map("posts")
}

enum Role {
  ADMIN
  EDITOR
  READER
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}`,
      explain: [
        'Prisma schema mendefinisikan model database — Prisma akan generate tipe TypeScript sesuai ini secara otomatis.',
        '<code>@unique</code> pada email memastikan tidak ada dua user dengan email yang sama di database.',
        '<code>String?</code> (dengan tanda tanya) di Prisma = kolom nullable di database — berbeda dari GraphQL yang pakai <code>String</code> tanpa <code>!</code>.',
        '<code>@map("avatar_url")</code> memetakan field TypeScript <code>avatarUrl</code> ke kolom database <code>avatar_url</code> — konvensi snake_case untuk DB.',
        '<code>onDelete: Cascade</code> berarti jika User dihapus, semua Post-nya ikut terhapus otomatis.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 5: src/schema.ts — GraphQL SDL Type Definitions',
      lang: 'typescript',
      output: false,
      code: `// src/schema.ts
export const typeDefs = \`#graphql

  enum Role {
    ADMIN
    EDITOR
    READER
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  type User {
    id:        ID!
    name:      String!
    email:     String!
    bio:       String
    avatarUrl: String
    role:      Role!
    posts:     [Post!]!
    createdAt: String!
    updatedAt: String!
  }

  type Post {
    id:        ID!
    title:     String!
    content:   String!
    status:    PostStatus!
    viewCount: Int!
    author:    User!
    tags:      String
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    name:     String!
    email:    String!
    password: String!
    bio:      String
    role:     Role
  }

  input UpdateUserInput {
    name:      String
    email:     String
    bio:       String
    avatarUrl: String
    role:      Role
  }

  input CreatePostInput {
    title:   String!
    content: String!
    status:  PostStatus
    tags:    String
  }

  input UpdatePostInput {
    title:   String
    content: String
    status:  PostStatus
    tags:    String
  }

  type Query {
    users:              [User!]!
    user(id: ID!):      User
    posts(status: PostStatus): [Post!]!
    post(id: ID!):      Post
  }

  type Mutation {
    createUser(input: CreateUserInput!):             User!
    updateUser(id: ID!, input: UpdateUserInput!):    User!
    deleteUser(id: ID!):                             Boolean!

    createPost(authorId: ID!, input: CreatePostInput!):  Post!
    updatePost(id: ID!, input: UpdatePostInput!):         Post!
    deletePost(id: ID!):                                  Boolean!
  }
\`;`,
      explain: [
        'Template literal dengan <code>#graphql</code> prefix memberikan syntax highlighting di editor (VS Code + GraphQL extension).',
        'Kita ekspor <code>typeDefs</code> sebagai string yang akan diteruskan ke ApolloServer.',
        'SDL di sini harus konsisten dengan model Prisma — perubahan di schema.prisma harus diikuti perubahan di sini.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 6: src/resolvers.ts — CRUD Operations Lengkap',
      lang: 'typescript',
      output: false,
      code: `// src/resolvers.ts
import { PrismaClient } from '@prisma/client';

interface Context {
  prisma: PrismaClient;
}

export const resolvers = {
  Query: {
    users: (_: unknown, __: unknown, ctx: Context) =>
      ctx.prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),

    user: (_: unknown, args: { id: string }, ctx: Context) =>
      ctx.prisma.user.findUnique({ where: { id: parseInt(args.id) } }),

    posts: (_: unknown, args: { status?: string }, ctx: Context) =>
      ctx.prisma.post.findMany({
        where: args.status ? { status: args.status as any } : undefined,
        orderBy: { createdAt: 'desc' },
      }),

    post: (_: unknown, args: { id: string }, ctx: Context) =>
      ctx.prisma.post.findUnique({ where: { id: parseInt(args.id) } }),
  },

  Mutation: {
    createUser: (
      _: unknown,
      args: { input: { name: string; email: string; password: string; bio?: string; role?: string } },
      ctx: Context
    ) =>
      ctx.prisma.user.create({ data: args.input as any }),

    updateUser: (
      _: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: Context
    ) =>
      ctx.prisma.user.update({
        where: { id: parseInt(args.id) },
        data: args.input,
      }),

    deleteUser: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      await ctx.prisma.user.delete({ where: { id: parseInt(args.id) } });
      return true;
    },

    createPost: (
      _: unknown,
      args: { authorId: string; input: { title: string; content: string; status?: string; tags?: string } },
      ctx: Context
    ) =>
      ctx.prisma.post.create({
        data: {
          ...args.input,
          status: (args.input.status as any) ?? 'DRAFT',
          authorId: parseInt(args.authorId),
        },
      }),

    updatePost: (
      _: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: Context
    ) =>
      ctx.prisma.post.update({
        where: { id: parseInt(args.id) },
        data: args.input,
      }),

    deletePost: async (
      _: unknown,
      args: { id: string },
      ctx: Context
    ) => {
      await ctx.prisma.post.delete({ where: { id: parseInt(args.id) } });
      return true;
    },
  },

  // Field-level resolvers untuk relasi
  User: {
    posts: (parent: { id: number }, _: unknown, ctx: Context) =>
      ctx.prisma.post.findMany({ where: { authorId: parent.id } }),
  },

  Post: {
    author: (parent: { authorId: number }, _: unknown, ctx: Context) =>
      ctx.prisma.user.findUnique({ where: { id: parent.authorId } }),
  },
};`,
      explain: [
        'Semua operasi CRUD sudah lengkap: <b>Read</b> (users, user, posts, post), <b>Create</b>, <b>Update</b>, <b>Delete</b>.',
        'Field resolver <b>User.posts</b> dan <b>Post.author</b> menangani relasi — dipanggil hanya jika klien meminta field tersebut.',
        'Penggunaan <code>as any</code> untuk enum Prisma adalah tradeoff — di proyek production kamu bisa menggunakan Prisma enum types secara lebih ketat.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 7: src/index.ts — Apollo Server Entry Point',
      lang: 'typescript',
      output: false,
      code: `// src/index.ts
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const prisma = new PrismaClient();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Aktifkan introspection dan playground (default aktif di development)
  introspection: true,
});

async function main() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => ({ prisma }),
  });

  console.log(\`🚀 GraphQL Server berjalan di: \${url}\`);
  console.log(\`📊 Apollo Sandbox tersedia di: \${url}\`);
}

main().catch((err) => {
  console.error('❌ Server gagal berjalan:', err);
  process.exit(1);
});

// Jalankan dengan: npm run dev
// Lalu buka: http://localhost:4000`,
      explain: [
        'File ini adalah entry point — dijalankan pertama kali saat server start.',
        '<code>startStandaloneServer</code> secara otomatis membuka Apollo Sandbox di browser saat kamu membuka URL server.',
        '<code>main().catch()</code> menangani error saat startup — misalnya database tidak bisa dikoneksi.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 8: prisma/seed.ts — Data Awal',
      lang: 'typescript',
      output: false,
      code: `// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding...');

  // Hapus data lama (opsional, untuk development)
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Buat user pertama
  const budi = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      password: 'hashed_password_123', // gunakan bcrypt di produksi
      bio: 'Pengembang web yang hobi menulis tentang teknologi',
      role: 'EDITOR',
    },
  });

  // Buat user kedua
  const sari = await prisma.user.create({
    data: {
      name: 'Sari Dewi',
      email: 'sari@example.com',
      password: 'hashed_password_456',
      role: 'READER',
    },
  });

  // Buat post untuk Budi
  await prisma.post.createMany({
    data: [
      {
        title: 'Mengenal GraphQL: Lebih dari Sekadar REST',
        content: 'GraphQL adalah query language untuk API yang dikembangkan oleh Facebook pada tahun 2012...',
        status: 'PUBLISHED',
        authorId: budi.id,
        tags: 'graphql,api,backend',
        viewCount: 142,
      },
      {
        title: 'Prisma ORM: Type-Safe Database Access',
        content: 'Prisma adalah ORM modern untuk Node.js dan TypeScript yang memberikan type-safety penuh...',
        status: 'PUBLISHED',
        authorId: budi.id,
        tags: 'prisma,orm,typescript',
        viewCount: 89,
      },
      {
        title: 'Apollo Server v4: Apa yang Baru?',
        content: 'Apollo Server v4 membawa perubahan besar dari versi sebelumnya...',
        status: 'DRAFT',
        authorId: budi.id,
        tags: 'apollo,graphql',
        viewCount: 0,
      },
    ],
  });

  console.log(\`✅ Seed selesai!\`);
  console.log(\`   - 2 users dibuat (id: \${budi.id}, \${sari.id})\`);
  console.log(\`   - 3 posts dibuat untuk user Budi\`);
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Jalankan dengan: npm run prisma:seed`,
      explain: [
        '<code>prisma.user.create()</code> dan <code>prisma.post.createMany()</code> mengisi data awal untuk testing.',
        '<code>deleteMany()</code> di awal memastikan seed bisa dijalankan berulang kali tanpa duplikasi data.',
        'Di produksi, hash password dengan bcrypt — jangan simpan plain text seperti contoh ini.',
        'Jalankan seed setelah migration: <code>npx prisma migrate dev --name init</code> lalu <code>npm run prisma:seed</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 9: Jalankan Migration & Server',
      lang: 'bash',
      output: false,
      code: `# 1. Generate Prisma Client (buat type TypeScript dari schema.prisma)
npx prisma generate

# 2. Jalankan migration (buat tabel di database)
npx prisma migrate dev --name init

# Output yang diharapkan:
# Prisma schema loaded from prisma/schema.prisma
# Datasource "db": MySQL database "graphql_blog" at "localhost:3306"
# ✔ Generated Prisma Client (v5.x.x)
# ✔ Your database is now in sync with your Prisma schema.

# 3. Jalankan seed
npm run prisma:seed

# Output:
# 🌱 Mulai seeding...
# ✅ Seed selesai!
#    - 2 users dibuat (id: 1, 2)
#    - 3 posts dibuat untuk user Budi

# 4. Jalankan server (mode development dengan auto-reload)
npm run dev

# Output:
# 🚀 GraphQL Server berjalan di: http://localhost:4000/
# 📊 Apollo Sandbox tersedia di: http://localhost:4000/`,
      outputText: `Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "graphql_blog" at "localhost:3306"
✔ Generated Prisma Client (v5.22.0)
✔ Your database is now in sync with your Prisma schema.
🌱 Mulai seeding...
✅ Seed selesai!
   - 2 users dibuat (id: 1, 2)
   - 3 posts dibuat untuk user Budi
🚀 GraphQL Server berjalan di: http://localhost:4000/
📊 Apollo Sandbox tersedia di: http://localhost:4000/`,
      explain: [
        '<code>prisma migrate dev</code> membuat file migration SQL di folder <code>prisma/migrations/</code> dan menerapkannya ke database.',
        'Setiap kali kamu mengubah <code>schema.prisma</code>, jalankan <code>prisma migrate dev</code> lagi dengan nama baru.',
        'Setelah server berjalan, buka <code>http://localhost:4000</code> di browser — Apollo Sandbox akan muncul otomatis.'
      ]
    },
    {
      type: 'live',
      title: 'Preview Interaktif: SDL, Resolver & Context (Tabs)',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 12px; margin: 8px; background: #0f172a; color: #e2e8f0; }
  .tabs { display: flex; gap: 4px; margin-bottom: 8px; }
  .tab { padding: 5px 14px; border-radius: 6px 6px 0 0; border: 1px solid #334155; border-bottom: none; cursor: pointer; color: #94a3b8; background: #1e293b; font-size: 12px; font-weight: 600; }
  .tab.active { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
  .panel { display: none; background: #1e293b; border: 1px solid #334155; border-radius: 0 6px 6px 6px; padding: 10px; min-height: 260px; overflow: auto; }
  .panel.active { display: block; }
  pre { margin: 0; font-size: 11px; line-height: 1.5; white-space: pre-wrap; }
  .kw { color: #c084fc; }
  .type { color: #34d399; }
  .str { color: #fbbf24; }
  .cm { color: #64748b; font-style: italic; }
  .fn { color: #60a5fa; }
  .num { color: #f87171; }
</style>
</head>
<body>
<div class="tabs">
  <div class="tab active" onclick="show('sdl')">📄 SDL Schema</div>
  <div class="tab" onclick="show('resolver')">⚙️ Resolvers</div>
  <div class="tab" onclick="show('context')">🎒 Context</div>
</div>
<div class="panel active" id="sdl">
<pre><span class="cm"># src/schema.ts — GraphQL SDL Type Definitions</span>

<span class="kw">type</span> <span class="type">User</span> {
  id:        <span class="type">ID!</span>
  name:      <span class="type">String!</span>
  email:     <span class="type">String!</span>
  bio:       <span class="type">String</span>
  role:      <span class="type">Role!</span>
  posts:     <span class="type">[Post!]!</span>
  createdAt: <span class="type">String!</span>
}

<span class="kw">type</span> <span class="type">Post</span> {
  id:      <span class="type">ID!</span>
  title:   <span class="type">String!</span>
  content: <span class="type">String!</span>
  status:  <span class="type">PostStatus!</span>
  author:  <span class="type">User!</span>
  tags:    <span class="type">String</span>
}

<span class="kw">enum</span> <span class="type">PostStatus</span> {
  DRAFT
  PUBLISHED
  ARCHIVED
}

<span class="kw">type</span> <span class="type">Query</span> {
  users:          <span class="type">[User!]!</span>
  user(id: <span class="type">ID!</span>): <span class="type">User</span>
  posts:          <span class="type">[Post!]!</span>
  post(id: <span class="type">ID!</span>):  <span class="type">Post</span>
}

<span class="kw">type</span> <span class="type">Mutation</span> {
  createUser(input: <span class="type">CreateUserInput!</span>): <span class="type">User!</span>
  deleteUser(id: <span class="type">ID!</span>):               <span class="type">Boolean!</span>
  createPost(authorId: <span class="type">ID!</span>, input: <span class="type">CreatePostInput!</span>): <span class="type">Post!</span>
  deletePost(id: <span class="type">ID!</span>):               <span class="type">Boolean!</span>
}</pre>
</div>
<div class="panel" id="resolver">
<pre><span class="cm">// src/resolvers.ts — Resolver Functions</span>

<span class="kw">export const</span> resolvers = {
  <span class="type">Query</span>: {
    <span class="fn">users</span>: (_, __, ctx) =>
      ctx.prisma.user.<span class="fn">findMany</span>(),

    <span class="fn">user</span>: (_, { id }, ctx) =>
      ctx.prisma.user.<span class="fn">findUnique</span>({
        where: { id: <span class="fn">parseInt</span>(id) }
      }),

    <span class="fn">posts</span>: (_, __, ctx) =>
      ctx.prisma.post.<span class="fn">findMany</span>(),
  },

  <span class="type">Mutation</span>: {
    <span class="fn">createUser</span>: (_, { input }, ctx) =>
      ctx.prisma.user.<span class="fn">create</span>({ data: input }),

    <span class="fn">deleteUser</span>: <span class="kw">async</span> (_, { id }, ctx) => {
      <span class="kw">await</span> ctx.prisma.user.<span class="fn">delete</span>({
        where: { id: <span class="fn">parseInt</span>(id) }
      });
      <span class="kw">return true</span>;
    },
  },

  <span class="cm">// Field-level resolvers untuk relasi</span>
  <span class="type">User</span>: {
    <span class="fn">posts</span>: (parent, _, ctx) =>
      ctx.prisma.post.<span class="fn">findMany</span>({
        where: { authorId: parent.id }
      }),
  },

  <span class="type">Post</span>: {
    <span class="fn">author</span>: (parent, _, ctx) =>
      ctx.prisma.user.<span class="fn">findUnique</span>({
        where: { id: parent.authorId }
      }),
  },
};</pre>
</div>
<div class="panel" id="context">
<pre><span class="cm">// src/index.ts — Context Setup</span>

<span class="kw">import</span> { PrismaClient } <span class="kw">from</span> <span class="str">'@prisma/client'</span>;

<span class="cm">// Satu instance Prisma untuk seluruh aplikasi</span>
<span class="kw">const</span> prisma = <span class="kw">new</span> <span class="fn">PrismaClient</span>();

<span class="kw">const</span> server = <span class="kw">new</span> <span class="fn">ApolloServer</span>({ typeDefs, resolvers });

<span class="kw">const</span> { url } = <span class="kw">await</span> <span class="fn">startStandaloneServer</span>(server, {
  listen: { port: <span class="num">4000</span> },

  <span class="cm">// context() dipanggil SEKALI per HTTP request</span>
  context: <span class="kw">async</span> ({ req }) => {
    <span class="kw">const</span> token = req.headers.authorization || <span class="str">''</span>;

    <span class="cm">// Semua resolver bisa akses ctx.prisma dan ctx.token</span>
    <span class="kw">return</span> {
      prisma,   <span class="cm">// ← akses database</span>
      token,    <span class="cm">// ← autentikasi</span>
    };
  },
});

console.<span class="fn">log</span>(<span class="str">\`🚀 Server: \${url}\`</span>);</pre>
</div>
<script>
  function show(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.target.classList.add('active');
  }
</script>
</body>
</html>`,
      hint: 'Klik tab SDL, Resolvers, atau Context untuk melihat setiap bagian dari server setup.'
    },
    {
      type: 'tip',
      title: 'Gunakan DATABASE_URL di .env, Jangan Hardcode',
      text: 'Selalu simpan kredensial database di file <code>.env</code> dan pastikan file tersebut ada di <code>.gitignore</code>. Jika kamu hardcode <code>"mysql://root:rootpassword@localhost:3306/graphql_blog"</code> langsung di kode, kamu berisiko mengekspos password database ke repository publik. Gunakan variabel lingkungan dan buat <code>.env.example</code> (tanpa nilai asli) sebagai template untuk anggota tim.'
    },
    {
      type: 'warn',
      title: 'prisma migrate dev vs prisma migrate deploy',
      text: '<code>prisma migrate dev</code> digunakan selama <b>development</b>: ia membuat file migration baru, menerapkannya, dan menjalankan seed jika dikonfigurasi. <b>Jangan gunakan ini di production</b> karena bisa menghapus data atau membuat migration yang tidak terduga. Di <b>production</b>, gunakan <code>prisma migrate deploy</code> — ia hanya menerapkan migration yang sudah ada tanpa membuat yang baru, lebih aman dan deterministik.'
    },
    {
      type: 'vocab',
      items: [
        ['Apollo Server', 'Library Node.js untuk membuat GraphQL server. Menangani parsing query, validasi schema, dan pemanggilan resolver.'],
        ['Prisma', 'ORM (Object-Relational Mapper) modern untuk Node.js dan TypeScript. Menyediakan akses database yang type-safe berdasarkan schema.prisma.'],
        ['ORM', 'Object-Relational Mapper — lapisan abstraksi antara kode aplikasi dan database. Kamu tulis kode TypeScript, Prisma yang buat SQL-nya.'],
        ['Migration', 'File SQL yang mendokumentasikan perubahan struktur database dari waktu ke waktu. Memungkinkan database di-update secara konsisten di semua environment.'],
        ['Seed', 'Script untuk mengisi database dengan data awal — berguna untuk development, testing, dan demo.'],
        ['DataSource', 'Konfigurasi koneksi database di Prisma (provider + URL). Mendukung PostgreSQL, MySQL, MariaDB, SQLite, MongoDB, dsb.'],
        ['Connection String', 'URL yang berisi semua informasi untuk terhubung ke database: protocol, username, password, host, port, dan nama database.']
      ]
    }
  ],
  recap: [
    'Setup proyek: <code>npm init</code> → install Apollo Server + Prisma → <code>npx prisma init</code>.',
    '<b>schema.prisma</b> mendefinisikan model database (User, Post); <code>prisma migrate dev</code> membuat tabel di MariaDB.',
    '<b>src/schema.ts</b> berisi SDL GraphQL (type definitions); <b>src/resolvers.ts</b> berisi implementasi setiap operasi.',
    '<b>Context</b> dibuat di <code>startStandaloneServer</code> — Prisma Client dimasukkan agar bisa diakses semua resolver.',
    'Selalu simpan <code>DATABASE_URL</code> di <code>.env</code> dan tambahkan ke <code>.gitignore</code>.',
    '<code>prisma migrate dev</code> untuk development; <code>prisma migrate deploy</code> untuk production.'
  ]
});
