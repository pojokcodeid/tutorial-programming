/* ============================================================
   GraphQL — Bab 5: Schema Definition Language (SDL)
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'schema-sdl',
  title: 'Schema Definition Language (SDL): Mendefinisikan Tipe Data GraphQL',
  chapter: 'Membangun GraphQL Server',
  duration: '15 menit',
  intro: [
    'Bayangkan kamu sedang membangun sebuah museum. Sebelum memajang koleksi, kamu perlu membuat <b>katalog</b> yang mendeskripsikan setiap benda: namanya apa, terbuat dari apa, berapa ukurannya, apakah boleh disentuh atau tidak. Tanpa katalog, pengunjung tidak tahu apa yang ada di sana.',
    '<b>Schema Definition Language (SDL)</b> adalah katalog resmi GraphQL. Ia mendefinisikan semua tipe data yang ada di API-mu — apa yang bisa di-query, apa yang bisa di-mutasi, dan bagaimana struktur datanya. Sebelum menulis satu baris resolver pun, kamu harus mendefinisikan schema terlebih dahulu.'
  ],
  objectives: [
    'Memahami peran Schema sebagai "kontrak" antara klien dan server',
    'Menguasai semua Scalar Types bawaan GraphQL beserta penggunaannya',
    'Membuat Object Type, Enum, dan Input Type untuk sebuah blog app',
    'Memahami perbedaan Non-Null (!) dan Nullable serta kapan menggunakannya',
    'Membedakan type vs input type dan kapan masing-masing digunakan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Schema dan SDL?</h3><p>Schema adalah <b>kontrak resmi</b> antara klien dan server GraphQL. Ia menjawab pertanyaan: "Data apa yang bisa saya minta?" dan "Dalam bentuk apa datanya?"</p><p>SDL (Schema Definition Language) adalah <b>bahasa khusus</b> untuk menulis schema GraphQL. Sintaksnya bersih dan mudah dibaca, mirip definisi tipe di TypeScript:</p><table><thead><tr><th>SDL GraphQL</th><th>TypeScript (perbandingan)</th></tr></thead><tbody><tr><td><code>type User { name: String }</code></td><td><code>interface User { name: string }</code></td></tr><tr><td><code>name: String!</code></td><td><code>name: string</code> (wajib ada)</td></tr><tr><td><code>name: String</code></td><td><code>name?: string</code> (opsional)</td></tr><tr><td><code>posts: [Post!]!</code></td><td><code>posts: Post[]</code> (array wajib)</td></tr><tr><td><code>enum Status { ACTIVE }</code></td><td><code>enum Status { ACTIVE = "ACTIVE" }</code></td></tr><tr><td><code>input CreateUserInput { ... }</code></td><td><code>type CreateUserInput = { ... }</code></td></tr></tbody></table><p>Perbedaan mendasar: TypeScript hanya ada di kode JavaScript-mu, sedangkan SDL GraphQL <b>dikirim ke klien</b> dan digunakan untuk validasi otomatis setiap request.</p>'
    },
    {
      type: 'text',
      html: '<h3>Scalar Types: Tipe Data Primitif</h3><p>Scalar Types adalah tipe data <b>paling dasar</b> di GraphQL — seperti bata paling kecil untuk membangun gedung. GraphQL memiliki 5 scalar bawaan:</p><table><thead><tr><th>Scalar</th><th>Deskripsi</th><th>Contoh Nilai</th><th>Setara TypeScript</th></tr></thead><tbody><tr><td><code>Int</code></td><td>Bilangan bulat 32-bit bertanda</td><td><code>1</code>, <code>-5</code>, <code>1000</code></td><td><code>number</code> (bulat)</td></tr><tr><td><code>Float</code></td><td>Bilangan desimal presisi ganda</td><td><code>3.14</code>, <code>-0.5</code>, <code>99.99</code></td><td><code>number</code> (desimal)</td></tr><tr><td><code>String</code></td><td>Teks UTF-8</td><td><code>"Halo"</code>, <code>"user@email.com"</code></td><td><code>string</code></td></tr><tr><td><code>Boolean</code></td><td>Nilai benar/salah</td><td><code>true</code>, <code>false</code></td><td><code>boolean</code></td></tr><tr><td><code>ID</code></td><td>Identifier unik (diserialisasi sebagai String)</td><td><code>"1"</code>, <code>"uuid-abc-123"</code></td><td><code>string</code> atau <code>number</code></td></tr></tbody></table><p>Kamu juga bisa membuat <b>Custom Scalar</b> sendiri seperti <code>Date</code>, <code>JSON</code>, atau <code>Email</code> menggunakan library tambahan — tapi 5 di atas sudah cukup untuk memulai.</p>'
    },
    {
      type: 'example',
      title: 'Schema SDL Lengkap: Blog App (User, Post, Comment)',
      lang: 'graphql',
      output: false,
      code: `# ===== SCALAR TYPES (bawaan GraphQL) =====
# Int, Float, String, Boolean, ID sudah tersedia otomatis

# ===== ENUM =====
enum PostStatus {
  DRAFT       # Tulisan masih draf, belum dipublikasi
  PUBLISHED   # Tulisan sudah live dan bisa dibaca publik
  ARCHIVED    # Tulisan diarsipkan, tidak tampil di feed
}

enum Role {
  ADMIN
  EDITOR
  READER
}

# ===== OBJECT TYPES =====
type User {
  id:        ID!          # Non-null: user pasti punya ID
  name:      String!      # Non-null: nama wajib ada
  email:     String!      # Non-null: email wajib ada
  role:      Role!        # Enum, wajib ada
  bio:       String       # Nullable: bio boleh kosong
  avatarUrl: String       # Nullable: belum tentu punya foto
  posts:     [Post!]!     # Array non-null berisi Post non-null
  createdAt: String!
}

type Post {
  id:        ID!
  title:     String!
  content:   String!
  status:    PostStatus!  # Enum
  author:    User!        # Relasi ke User, wajib ada
  comments:  [Comment!]! # Relasi ke Comment (array)
  tags:      [String!]   # Nullable array of non-null String
  viewCount: Int!
  createdAt: String!
  updatedAt: String!
}

type Comment {
  id:        ID!
  body:      String!
  author:    User!
  post:      Post!
  createdAt: String!
}

# ===== INPUT TYPES (untuk Mutation) =====
input CreateUserInput {
  name:     String!
  email:    String!
  password: String!
  role:     Role
  bio:      String
}

input UpdateUserInput {
  name:      String       # Semua opsional — hanya kirim yang mau diubah
  email:     String
  bio:       String
  avatarUrl: String
  role:      Role
}

input CreatePostInput {
  title:   String!
  content: String!
  status:  PostStatus    # Default DRAFT jika tidak dikirim
  tags:    [String!]
}

input UpdatePostInput {
  title:   String
  content: String
  status:  PostStatus
  tags:    [String!]
}

input CreateCommentInput {
  body:   String!
  postId: ID!
}

# ===== ROOT TYPES =====
type Query {
  users:      [User!]!
  user(id: ID!): User    # Nullable: bisa null jika user tidak ditemukan
  posts(status: PostStatus): [Post!]!
  post(id: ID!): Post
  comments(postId: ID!): [Comment!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!

  createPost(authorId: ID!, input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!

  createComment(authorId: ID!, input: CreateCommentInput!): Comment!
  deleteComment(id: ID!): Boolean!
}`,
      explain: [
        'Setiap <b>Object Type</b> (User, Post, Comment) mendefinisikan field dan tipe-nya — persis seperti interface di TypeScript.',
        '<b>Enum</b> PostStatus membatasi nilai yang valid: hanya DRAFT, PUBLISHED, atau ARCHIVED — tidak bisa "published" huruf kecil atau nilai sembarangan.',
        '<b>Input Type</b> digunakan khusus sebagai argumen Mutation — tidak bisa dipakai di Query response.',
        'Tanda <code>!</code> berarti Non-Null: field itu <b>dijamin tidak pernah null</b>. Tanpa <code>!</code> artinya bisa null.',
        '<code>[Post!]!</code> berarti: array-nya tidak null DAN setiap item di dalamnya juga tidak null.',
        'Root Type <b>Query</b> dan <b>Mutation</b> adalah entry point ke semua operasi API-mu.'
      ]
    },
    {
      type: 'example',
      title: 'Enum: PostStatus',
      lang: 'graphql',
      output: false,
      code: `# Definisi Enum di Schema
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# Cara pakai di Object Type
type Post {
  id:     ID!
  title:  String!
  status: PostStatus!  # hanya bisa DRAFT / PUBLISHED / ARCHIVED
}

# Cara pakai di Query (sebagai filter)
type Query {
  posts(status: PostStatus): [Post!]!
  # Contoh pemanggilan:
  # query { posts(status: PUBLISHED) { id title } }
}

# Cara pakai di Mutation response
type Mutation {
  publishPost(id: ID!): Post!
  # Server akan set status = PUBLISHED dan mengembalikan Post
}`,
      explain: [
        'Enum memastikan hanya nilai yang terdaftar yang boleh dikirim — GraphQL akan <b>menolak otomatis</b> nilai lain sebelum sampai ke resolver.',
        'Enum di SDL ditulis HURUF_KAPITAL_DENGAN_UNDERSCORE (screaming snake case) — ini konvensi resmi GraphQL.',
        'Di sisi klien, enum dikirim sebagai <b>plain string</b> tanpa tanda kutip: <code>status: PUBLISHED</code>, bukan <code>status: "PUBLISHED"</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Input Type: CreatePostInput',
      lang: 'graphql',
      output: false,
      code: `# Input Type — digunakan HANYA sebagai argumen di Mutation/Query
input CreatePostInput {
  title:   String!      # Wajib: judul harus ada
  content: String!      # Wajib: konten harus ada
  status:  PostStatus   # Opsional: jika tidak dikirim, resolver bisa set default DRAFT
  tags:    [String!]    # Opsional: nullable array
}

# Digunakan di Mutation
type Mutation {
  createPost(authorId: ID!, input: CreatePostInput!): Post!
}

# ===========================================
# PERBANDINGAN: type vs input
# ===========================================

# ❌ SALAH: tidak bisa pakai Object Type sebagai argumen
# type Post tidak bisa dipakai di "createPost(post: Post!)"

# ✅ BENAR: gunakan input type
# createPost(input: CreatePostInput!)

# Kenapa dipisah?
# - Object Type bisa punya resolver sendiri untuk tiap field
# - Input Type hanya berisi data polos (tidak ada resolver)
# - Object Type bisa berisi field yang return tipe kompleks (Post.author: User!)
# - Input Type hanya boleh berisi scalar, enum, atau input type lain`,
      explain: [
        '<b>Input Type</b> vs <b>Object Type</b>: meskipun strukturnya mirip, keduanya berbeda peran. Object Type adalah hasil yang dikembalikan server; Input Type adalah data yang dikirim klien.',
        'Field di Input Type boleh semua nullable jika kamu membuat "partial update" — kirim hanya field yang ingin diubah.',
        'Input Type bisa <b>nested</b>: satu input type bisa berisi input type lain — tapi tidak boleh berisi Object Type.'
      ]
    },
    {
      type: 'live',
      title: 'Coba: Visual Schema Builder — Ketik Definisi Type Sederhana',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 10px; background: #0f172a; color: #e2e8f0; }
  .container { display: flex; gap: 12px; }
  .panel { flex: 1; }
  label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
  textarea { width: 100%; height: 180px; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; padding: 8px; font-family: monospace; font-size: 12px; resize: vertical; box-sizing: border-box; }
  .preview { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 10px; min-height: 180px; }
  .type-box { border: 2px solid #3b82f6; border-radius: 8px; overflow: hidden; display: inline-block; margin: 6px; min-width: 150px; }
  .type-header { background: #3b82f6; color: #fff; padding: 4px 10px; font-weight: 700; font-size: 12px; }
  .type-body { background: #1e3a5f; padding: 6px 10px; }
  .field-row { display: flex; gap: 6px; align-items: center; padding: 2px 0; font-size: 11px; font-family: monospace; }
  .field-name { color: #93c5fd; }
  .field-type { color: #34d399; }
  .non-null { color: #f87171; font-weight: 700; }
  .err { color: #f87171; font-size: 11px; margin-top: 6px; }
  .hint { color: #64748b; font-size: 11px; margin-top: 6px; }
</style>
</head>
<body>
<p style="margin:0 0 8px;color:#94a3b8;font-size:12px">Ketik definisi <code>type</code> GraphQL di kiri → diagram otomatis muncul di kanan</p>
<div class="container">
  <div class="panel">
    <label>SDL Input</label>
    <textarea id="sdl">type Product {
  id: ID!
  name: String!
  price: Float!
  description: String
  inStock: Boolean!
  tags: [String!]
}</textarea>
  </div>
  <div class="panel">
    <label>Visual Schema</label>
    <div class="preview" id="preview"></div>
    <div class="hint">⬆ Diagram diperbarui otomatis saat kamu mengetik</div>
  </div>
</div>
<script>
  function parseSDL(text) {
    const types = [];
    const typeRegex = /\\b(type|input|enum)\\s+(\\w+)\\s*\\{([^}]*)\\}/g;
    let m;
    while ((m = typeRegex.exec(text)) !== null) {
      const kind = m[1];
      const name = m[2];
      const body = m[3].trim();
      const fields = [];
      if (kind === 'enum') {
        body.split('\\n').forEach(line => {
          const val = line.trim().replace(/#.*$/, '').trim();
          if (val) fields.push({ name: val, type: '', nonNull: false, isEnum: true });
        });
      } else {
        body.split('\\n').forEach(line => {
          const clean = line.trim().replace(/#.*$/, '').trim();
          if (!clean) return;
          const parts = clean.split(':');
          if (parts.length >= 2) {
            const fname = parts[0].trim();
            const ftype = parts.slice(1).join(':').trim();
            const nonNull = ftype.endsWith('!');
            fields.push({ name: fname, type: ftype, nonNull });
          }
        });
      }
      types.push({ kind, name, fields });
    }
    return types;
  }

  function renderTypes(types) {
    if (!types.length) return '<span style="color:#64748b">Belum ada type yang terdeteksi...</span>';
    const kindColor = { type: '#3b82f6', input: '#a855f7', enum: '#f59e0b' };
    return types.map(t => {
      const hdrColor = kindColor[t.kind] || '#3b82f6';
      const fields = t.fields.map(f => {
        if (f.isEnum) return '<div class="field-row"><span class="field-name">' + f.name + '</span></div>';
        const nn = f.nonNull ? '<span class="non-null">!</span>' : '<span style="color:#64748b"> ?</span>';
        return '<div class="field-row"><span class="field-name">' + f.name + '</span><span style="color:#64748b">:</span><span class="field-type">' + f.type.replace(/!$/, '') + '</span>' + nn + '</div>';
      }).join('');
      return '<div class="type-box" style="border-color:' + hdrColor + ';display:inline-block">'
        + '<div class="type-header" style="background:' + hdrColor + '">' + t.kind.toUpperCase() + ' ' + t.name + '</div>'
        + '<div class="type-body">' + (fields || '<span style="color:#64748b;font-size:11px">kosong</span>') + '</div>'
        + '</div>';
    }).join('');
  }

  const ta = document.getElementById('sdl');
  const preview = document.getElementById('preview');
  function update() {
    try {
      const types = parseSDL(ta.value);
      preview.innerHTML = renderTypes(types);
    } catch(e) {
      preview.innerHTML = '<span class="err">Parse error: ' + e.message + '</span>';
    }
  }
  ta.addEventListener('input', update);
  update();
</script>
</body>
</html>`,
      hint: 'Coba ketik type baru, tambahkan enum, atau ubah field menjadi Non-Null (!) — diagram langsung berubah.'
    },
    {
      type: 'tip',
      title: 'Perbedaan type vs input',
      text: 'Gunakan <b>type</b> untuk mendefinisikan data yang <i>dikembalikan</i> oleh server (Query response, relasi antar entitas). Gunakan <b>input</b> untuk mendefinisikan data yang <i>dikirim</i> klien (argumen Mutation dan Query kompleks). Keduanya punya sintaks serupa tapi <b>tidak bisa saling menggantikan</b> — GraphQL akan error jika kamu mencoba menggunakan Object Type sebagai argumen Mutation.'
    },
    {
      type: 'warn',
      title: 'Non-null (!) vs Nullable — Design Decision Penting',
      text: 'Menambahkan <code>!</code> ke semua field terasa "aman", tapi bisa jadi jebakan. Jika sebuah resolver gagal mengembalikan nilai untuk field Non-Null, GraphQL akan me-<b>null-kan seluruh parent object</b> — ini bisa membuat response yang tadinya parsial menjadi kosong sama sekali. Aturan praktis: gunakan <code>!</code> hanya jika kamu yakin 100% nilai itu <i>selalu ada</i>. Untuk field opsional seperti bio, avatarUrl, atau deskripsi, biarkan nullable agar error tidak merembet ke mana-mana.'
    },
    {
      type: 'vocab',
      items: [
        ['SDL', 'Schema Definition Language — bahasa khusus GraphQL untuk mendefinisikan tipe data dan operasi yang tersedia di API.'],
        ['Scalar Type', 'Tipe data primitif bawaan GraphQL: Int, Float, String, Boolean, dan ID. Tidak bisa dipecah menjadi sub-field.'],
        ['Object Type', 'Tipe kompleks yang terdiri dari kumpulan field. Contoh: User, Post, Comment. Digunakan sebagai hasil kembalian.'],
        ['Enum', 'Tipe dengan nilai yang terbatas dan sudah ditentukan di schema. Contoh: PostStatus dengan nilai DRAFT, PUBLISHED, ARCHIVED.'],
        ['Input Type', 'Tipe khusus yang digunakan sebagai argumen untuk Mutation dan Query. Tidak bisa digunakan sebagai tipe kembalian.'],
        ['Non-Null (!)', 'Tanda seru di belakang tipe menandakan field tersebut tidak boleh null. Server wajib mengembalikan nilai.'],
        ['List ([])', 'Kurung siku menandakan field tersebut berisi array. [Post!]! artinya: array tidak null dan tiap elemennya juga tidak null.'],
        ['Schema', 'Kontrak resmi GraphQL yang mendefinisikan semua tipe, query, dan mutation yang tersedia di API.']
      ]
    }
  ],
  recap: [
    '<b>SDL (Schema Definition Language)</b> adalah cara menulis schema GraphQL — kontrak antara klien dan server.',
    'Ada <b>5 Scalar Type</b> bawaan: <code>Int</code>, <code>Float</code>, <code>String</code>, <code>Boolean</code>, <code>ID</code>.',
    '<b>Object Type</b> mendefinisikan struktur data yang dikembalikan; <b>Input Type</b> mendefinisikan data yang dikirim klien.',
    '<b>Enum</b> membatasi nilai field hanya pada pilihan yang sudah ditentukan — validasi otomatis tanpa kode tambahan.',
    'Tanda <b>!</b> (Non-Null) menjamin field tidak akan null; tanpa <code>!</code> field bisa null. Pilih dengan hati-hati.',
    '<b>[Post!]!</b>: array wajib ada DAN setiap elemennya juga wajib ada — dua tanda <code>!</code>, dua jaminan berbeda.'
  ]
});
