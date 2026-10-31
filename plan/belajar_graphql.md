# 📋 Planning Materi Belajar GraphQL
> Berdasarkan Roadmap: `roadmap_belajar_graphql.md`

---

## ⚙️ Konfigurasi Environment

| Item | Detail |
|---|---|
| **Database** | MariaDB |
| **Host** | `localhost` |
| **Port** | `3306` |
| **User** | `root` |
| **Password** | `rootpassword` |
| **Runtime** | Node.js |
| **GraphQL Server** | Apollo Server / GraphQL Yoga |
| **ORM** | Prisma (koneksi ke MariaDB) |

---

## 🗺️ Overview Fase Belajar

```mermaid
flowchart LR
    F1["📍 Fase 1\nKonsep Dasar"] --> F2["📍 Fase 2\nSintaksis & Operasi"]
    F2 --> F3["📍 Fase 3\nGraphQL Server"]
    F3 --> F4["📍 Fase 4\nFrontend Integration"]
    F4 --> F5["📍 Fase 5\nTeknik Lanjutan"]
    F5 --> F6["📍 Fase 6\nArsitektur Skala Besar"]
```

---

## 📍 Fase 1 — Konsep Dasar & Alasan Menggunakan GraphQL

> **Target**: Memahami *mengapa* GraphQL dibuat dan perbedaannya dari REST API.

### 🎯 Topik yang Dipelajari

#### 1.1 Perbandingan REST API vs GraphQL

| Aspek | REST API | GraphQL |
|---|---|---|
| Endpoint | Banyak (`/users`, `/posts`) | Satu (`/graphql`) |
| Data Fetching | Fixed response | Declarative (klien menentukan field) |
| Over-fetching | ✅ Sering terjadi | ❌ Tidak terjadi |
| Under-fetching | ✅ Sering terjadi | ❌ Tidak terjadi |

#### 1.2 Dasar-Dasar GraphQL

- **Schema & Type System** — SDL (*Schema Definition Language*) yang *strongly-typed*
- **3 Operasi Utama**:
  - `Query` → Membaca data (setara GET)
  - `Mutation` → Mengubah/menambah/menghapus data (setara POST/PUT/DELETE)
  - `Subscription` → Komunikasi real-time via WebSocket

### 📝 Tugas Praktik Fase 1
- [ ] Install GraphQL Playground / Altair GraphQL Client
- [ ] Eksplorasi endpoint GraphQL publik (misal: https://countries.trevorblades.com)
- [ ] Tulis query sederhana dan amati perbedaan response dengan REST

---

## 📍 Fase 2 — Sintaksis & Operasi Klien

> **Target**: Mahir menulis query dan mutation dari sisi klien.

### 🎯 Topik yang Dipelajari

#### 2.1 Menulis Query

```graphql
# Selection Sets & Arguments
query GetUser {
  user(id: "1") {
    id
    name
    email
  }
}

# Aliases — menghindari konflik nama field
query ComparePosts {
  published: posts(status: PUBLISHED) { title }
  drafts: posts(status: DRAFT) { title }
}

# Fragments — reuse field groups
fragment UserFields on User {
  id
  name
  email
}

query GetUsers {
  users {
    ...UserFields
  }
}
```

#### 2.2 Menulis Mutation

```graphql
# Mutation dengan Variables
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    createdAt
  }
}
```

#### 2.3 Directives

```graphql
query GetUser($withPosts: Boolean!) {
  user(id: "1") {
    name
    posts @include(if: $withPosts) {
      title
    }
  }
}
```

### 📝 Tugas Praktik Fase 2
- [ ] Tulis minimal 5 query dengan berbagai fitur (arguments, aliases, fragments)
- [ ] Tulis minimal 3 mutation
- [ ] Eksperimen dengan `@include` dan `@skip` directives

---

## 📍 Fase 3 — Pembangunan GraphQL Server (Backend)

> **Target**: Membangun GraphQL Server dengan Node.js yang terhubung ke **MariaDB**.

### ⚙️ Setup Proyek

```bash
# Inisialisasi proyek
mkdir graphql-server && cd graphql-server
npm init -y

# Install dependencies
npm install @apollo/server graphql
npm install prisma @prisma/client
npm install -D typescript ts-node @types/node

# Inisialisasi Prisma dengan MySQL (kompatibel dengan MariaDB)
npx prisma init --datasource-provider mysql
```

### 🔧 Konfigurasi Prisma (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "mysql"
  url      = "mysql://root:rootpassword@localhost:3306/graphql_db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
```

> [!IMPORTANT]
> Buat database `graphql_db` di MariaDB terlebih dahulu:
> ```sql
> CREATE DATABASE graphql_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> ```

### 🎯 Topik yang Dipelajari

#### 3.1 Schema Definition Language (SDL)

| Elemen | Contoh | Keterangan |
|---|---|---|
| Scalar Types | `Int`, `Float`, `String`, `Boolean`, `ID` | Tipe data primitif |
| Custom Types | `type User { ... }` | Objek data kustom |
| Enums | `enum Status { DRAFT PUBLISHED }` | Nilai terbatas |
| Input Types | `input CreateUserInput { ... }` | Khusus untuk Mutation |
| Non-Null | `name: String!` | Field wajib ada |
| Lists | `posts: [Post!]!` | Array |

```graphql
# Contoh Schema Lengkap
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: String!
}

type Post {
  id: ID!
  title: String!
  content: String
  published: Boolean!
  author: User!
  createdAt: String!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  posts: [Post!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
  createPost(title: String!, content: String, authorId: ID!): Post!
  updatePost(id: ID!, published: Boolean): Post!
  deletePost(id: ID!): Boolean!
}
```

#### 3.2 Resolvers

```typescript
// Struktur resolver: (parent, args, context, info)
const resolvers = {
  Query: {
    users: async (_parent, _args, { prisma }) => {
      return prisma.user.findMany();
    },
    user: async (_parent, { id }, { prisma }) => {
      return prisma.user.findUnique({ where: { id: Number(id) } });
    },
  },
  Mutation: {
    createUser: async (_parent, { name, email }, { prisma }) => {
      return prisma.user.create({ data: { name, email } });
    },
  },
  User: {
    // Resolver relasi (menghindari N+1 problem)
    posts: async (parent, _args, { prisma }) => {
      return prisma.post.findMany({ where: { authorId: parent.id } });
    },
  },
};
```

#### 3.3 Context Handling

```typescript
// Menyuntikkan Prisma Client ke dalam context
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => ({
    prisma,
    // token: req.headers.authorization,
  }),
});
```

### 📝 Tugas Praktik Fase 3
- [ ] Setup proyek Node.js + Apollo Server + Prisma
- [ ] Buat koneksi ke MariaDB (`localhost:3306`, user: `root`, pass: `rootpassword`)
- [ ] Buat schema SDL untuk entitas `User` dan `Post`
- [ ] Implementasikan semua resolver untuk Query dan Mutation
- [ ] Test semua operasi via Apollo Sandbox

---

## 📍 Fase 4 — Integrasi Frontend

> **Target**: Menghubungkan GraphQL server dengan framework React menggunakan Apollo Client.

### ⚙️ Setup Frontend

```bash
# Buat proyek React (Vite)
npm create vite@latest graphql-client -- --template react-ts
cd graphql-client

# Install Apollo Client
npm install @apollo/client graphql
```

### 🎯 Topik yang Dipelajari

#### 4.1 Setup Apollo Client

```typescript
// src/lib/apollo.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
  cache: new InMemoryCache(),
});
```

#### 4.2 Menggunakan Hooks Apollo

```typescript
// useQuery — fetch data
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

function UserList() {
  const { loading, error, data } = useQuery(GET_USERS);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <ul>{data.users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// useMutation — modifikasi data
const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
    }
  }
`;

function CreateUserForm() {
  const [createUser, { loading }] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_USERS }],
  });
  // ...
}
```

#### 4.3 Code Generation dengan GraphQL Code Generator

```bash
npm install -D @graphql-codegen/cli @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

```yaml
# codegen.yml
schema: "http://localhost:4000/graphql"
documents: "src/**/*.graphql"
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

### 📝 Tugas Praktik Fase 4
- [ ] Setup React + Apollo Client
- [ ] Buat halaman list Users dan Posts
- [ ] Buat form Create/Update/Delete Post
- [ ] Implementasikan GraphQL Code Generator untuk type-safety

---

## 📍 Fase 5 — Teknik Lanjutan & Optimasi

> **Target**: Membuat API GraphQL yang aman, performan, dan production-ready.

### 🎯 Topik yang Dipelajari

#### 5.1 Mengatasi N+1 Problem dengan DataLoader

```bash
npm install dataloader
```

```typescript
// src/dataloaders.ts
import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export const createLoaders = (prisma: PrismaClient) => ({
  postsByAuthorId: new DataLoader(async (authorIds: readonly number[]) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: [...authorIds] } },
    });
    // Kelompokkan posts berdasarkan authorId
    return authorIds.map(id => posts.filter(p => p.authorId === id));
  }),
});
```

#### 5.2 Keamanan (Security Hardening)

```typescript
import { ApolloServer } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(7),                          // Batasi depth query
    createComplexityLimitRule(1000),        // Batasi kompleksitas query
  ],
  introspection: process.env.NODE_ENV !== 'production', // Matikan di production
});
```

#### 5.3 Autentikasi & Otorisasi (JWT)

```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

```typescript
// context.ts — verifikasi JWT
import jwt from 'jsonwebtoken';

const context = async ({ req }) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  let currentUser = null;
  if (token) {
    try {
      currentUser = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) { /* token invalid */ }
  }
  return { prisma, currentUser };
};

// resolver.ts — field-level authorization
const resolvers = {
  Mutation: {
    deletePost: async (_parent, { id }, { prisma, currentUser }) => {
      if (!currentUser) throw new Error('Unauthorized');
      // Cek apakah user adalah pemilik post
      const post = await prisma.post.findUnique({ where: { id: Number(id) } });
      if (post?.authorId !== currentUser.id) throw new Error('Forbidden');
      await prisma.post.delete({ where: { id: Number(id) } });
      return true;
    },
  },
};
```

#### 5.4 Real-time dengan Subscriptions

```bash
npm install graphql-ws ws
```

```typescript
// Tambahkan Subscription ke schema
const typeDefs = `#graphql
  type Subscription {
    postCreated: Post!
  }
`;

// Resolver Subscription
const resolvers = {
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },
  },
  Mutation: {
    createPost: async (_parent, args, { prisma, pubsub }) => {
      const post = await prisma.post.create({ data: args });
      pubsub.publish('POST_CREATED', { postCreated: post }); // Trigger event
      return post;
    },
  },
};
```

### 📝 Tugas Praktik Fase 5
- [ ] Implementasikan DataLoader untuk resolver relasi `User → Posts`
- [ ] Tambahkan depth limit dan complexity limit
- [ ] Implementasikan sistem login (JWT) via Mutation `login`
- [ ] Buat endpoint yang memerlukan autentikasi (createPost, deletePost)
- [ ] Implementasikan Subscription `postCreated` dengan WebSocket

---

## 📍 Fase 6 — Arsitektur Skala Besar

> **Target**: Memahami pola arsitektur GraphQL untuk sistem enterprise/microservices.

### 🎯 Topik yang Dipelajari

#### 6.1 Schema Stitching vs Apollo Federation

```mermaid
flowchart TD
    Client["🖥️ Client"] --> Gateway["🔀 Apollo Gateway / Router"]
    Gateway --> SG1["📦 Subgraph: Users Service\n(localhost:4001)"]
    Gateway --> SG2["📦 Subgraph: Posts Service\n(localhost:4002)"]
    Gateway --> SG3["📦 Subgraph: Orders Service\n(localhost:4003)"]
    SG1 --> DB1["🗄️ MariaDB: users_db"]
    SG2 --> DB2["🗄️ MariaDB: posts_db"]
    SG3 --> DB3["🗄️ MariaDB: orders_db"]
```

```bash
# Install Apollo Federation
npm install @apollo/subgraph @apollo/gateway
```

```typescript
// users-service/schema.ts — mendefinisikan subgraph
import { buildSubgraphSchema } from '@apollo/subgraph';

const typeDefs = `#graphql
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
  }
`;
```

#### 6.2 Observability & Monitoring

- **Tracing**: Gunakan Apollo Studio atau OpenTelemetry untuk tracing per-resolver
- **Logging**: Catat durasi eksekusi setiap operasi
- **Error Tracking**: Integrasikan Sentry atau Datadog

### 📝 Tugas Praktik Fase 6
- [ ] Buat 2 subgraph terpisah: `users-service` dan `posts-service`
- [ ] Setup Apollo Gateway sebagai entry point tunggal
- [ ] Implementasikan entity reference (`@key`) agar Post dapat me-resolve User
- [ ] Tambahkan basic logging untuk setiap resolver

---

## 🏗️ Proyek Portfolio

### Proyek 1 — Blog API (Pemula) 🟢

**Stack**: Node.js + Apollo Server + Prisma + **MariaDB**

| Fitur | Status |
|---|---|
| CRUD User | ☐ |
| CRUD Post | ☐ |
| Query filter & pagination | ☐ |
| GraphQL Playground | ☐ |

**Koneksi DB**:
```
mysql://root:rootpassword@localhost:3306/blog_db
```

---

### Proyek 2 — Social Media App (Menengah) 🟡

**Stack**: React + Apollo Client + Apollo Server + Prisma + **MariaDB**

| Fitur | Status |
|---|---|
| Autentikasi JWT (Register/Login) | ☐ |
| CRUD Post dengan otorisasi | ☐ |
| Like & Comment | ☐ |
| Cursor-based Pagination | ☐ |
| TypeScript Code Generation | ☐ |

**Koneksi DB**:
```
mysql://root:rootpassword@localhost:3306/social_db
```

---

### Proyek 3 — E-Commerce Microservices (Mahir) 🔴

**Stack**: Apollo Federation + React + Prisma + **MariaDB**

| Fitur | Status |
|---|---|
| Users Subgraph | ☐ |
| Products Subgraph | ☐ |
| Orders Subgraph | ☐ |
| Apollo Gateway | ☐ |
| DataLoader (N+1 fix) | ☐ |
| Rate Limiting | ☐ |
| Subscription (notifikasi order) | ☐ |

**Koneksi DB per service**:
```
mysql://root:rootpassword@localhost:3306/users_db
mysql://root:rootpassword@localhost:3306/products_db
mysql://root:rootpassword@localhost:3306/orders_db
```

---

## 📚 Referensi & Sumber Belajar

| Sumber | Link | Keterangan |
|---|---|---|
| Dokumentasi Resmi | https://graphql.org/ | Referensi utama |
| Apollo Docs | https://www.apollographql.com/docs/ | Apollo Server & Client |
| Prisma Docs | https://www.prisma.io/docs/ | ORM untuk MariaDB |
| GraphQL Yoga | https://the-guild.dev/graphql/yoga-server | Alternatif Apollo Server |
| Apollo Odyssey | https://odyssey.apollographql.com/ | Tutorial interaktif |
| GraphQL Code Generator | https://the-guild.dev/graphql/codegen | Code generation |

---

## ✅ Checklist Progress Keseluruhan

### Fase 1 — Konsep Dasar
- [ ] Memahami perbedaan REST vs GraphQL
- [ ] Memahami 3 operasi: Query, Mutation, Subscription

### Fase 2 — Sintaksis Klien
- [ ] Menulis Query (selection sets, arguments, aliases, fragments)
- [ ] Menulis Mutation dengan variables
- [ ] Menggunakan Directives

### Fase 3 — Backend Server
- [ ] Membuat proyek Node.js + Apollo Server
- [ ] Mendefinisikan SDL Schema
- [ ] Mengimplementasikan Resolvers
- [ ] Koneksi ke MariaDB via Prisma

### Fase 4 — Frontend Integration
- [ ] Setup Apollo Client di React
- [ ] Menggunakan `useQuery` dan `useMutation`
- [ ] Implementasi GraphQL Code Generator

### Fase 5 — Teknik Lanjutan
- [ ] Implementasi DataLoader (N+1 problem)
- [ ] Security: depth limit, complexity limit, disable introspection
- [ ] Autentikasi JWT
- [ ] Otorisasi field-level
- [ ] GraphQL Subscriptions (WebSocket)

### Fase 6 — Arsitektur Skala Besar
- [ ] Memahami Schema Stitching vs Apollo Federation
- [ ] Membuat subgraph dengan Apollo Federation
- [ ] Setup Apollo Gateway
- [ ] Observability & Monitoring

---

> 📅 **Dibuat**: Oktober 2026
> 🎯 **Target Selesai**: Disesuaikan dengan jadwal belajar masing-masing

