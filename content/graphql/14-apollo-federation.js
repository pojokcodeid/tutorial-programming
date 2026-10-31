/* ============================================================
   GraphQL — Bab 14: Apollo Federation: GraphQL untuk Arsitektur Microservices
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'apollo-federation',
  title: 'Apollo Federation: GraphQL untuk Arsitektur Microservices',
  chapter: 'Arsitektur Skala Besar',
  duration: '22 menit',
  intro: [
    'Bayangkan kamu bekerja di perusahaan teknologi yang terus berkembang. Awalnya satu tim mengelola seluruh API GraphQL, tapi kini ada tim <b>Users</b>, tim <b>Posts</b>, tim <b>Comments</b>, dan tim <b>Products</b>. Satu skema raksasa jadi mimpi buruk — setiap tim harus menunggu tim lain, konflik kode terjadi setiap hari, dan deployment satu fitur bisa mempengaruhi fitur lain.',
    '<b>Apollo Federation</b> hadir sebagai solusi: masing-masing tim memiliki <b>subgraph</b> GraphQL-nya sendiri, dan sebuah <b>gateway</b> menyatukannya menjadi satu API tunggal yang disebut <b>supergraph</b>. Klien tetap mengirim satu query, tapi di balik layar gateway mendistribusikannya ke subgraph yang tepat.'
  ],
  objectives: [
    'Memahami keterbatasan Schema Stitching dan mengapa Apollo Federation lebih baik',
    'Menjelaskan konsep Supergraph, Subgraph, dan Apollo Gateway',
    'Menulis schema subgraph lengkap dengan direktif @key',
    'Memahami cara kerja entity reference antar subgraph',
    'Membuat contoh gateway yang menghubungkan dua subgraph',
    'Memahami kapan sebaiknya menggunakan Federation dan kapan tidak'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Schema Stitching vs Apollo Federation</h3><p>Sebelum Federation hadir, cara umum menggabungkan beberapa GraphQL API adalah <b>Schema Stitching</b>. Tapi pendekatan ini punya banyak kelemahan yang terasa semakin menyakitkan ketika skala tim dan layanan bertambah.</p><table><thead><tr><th>Aspek</th><th>Schema Stitching (Cara Lama)</th><th>Apollo Federation (Cara Modern)</th></tr></thead><tbody><tr><td><b>Definisi schema</b></td><td>Digabung manual di gateway menggunakan merge library</td><td>Setiap subgraph mendefinisikan schema-nya sendiri secara mandiri</td></tr><tr><td><b>Relasi antar layanan</b></td><td>Harus dikonfigurasi manual di sisi gateway, rawan error</td><td>Dideklarasikan dengan direktif <code>@key</code> dan reference resolver di dalam subgraph</td></tr><tr><td><b>Ownership tim</b></td><td>Gateway menjadi bottleneck — satu tim harus tahu semua schema</td><td>Setiap tim hanya perlu mengelola subgraphnya sendiri</td></tr><tr><td><b>Type yang sama di banyak layanan</b></td><td>Harus diduplikasi atau digabung secara manual, konflik sering terjadi</td><td>Type dapat di-extend di subgraph lain menggunakan <code>@key</code> dan entity reference</td></tr><tr><td><b>Pemeliharaan</b></td><td>Sangat kompleks seiring bertambahnya layanan</td><td>Lebih terstruktur, setiap subgraph independen</td></tr><tr><td><b>Performance</b></td><td>Gateway perlu mem-parse dan menyambungkan schema secara runtime</td><td>Apollo Router menghasilkan query plan yang dioptimalkan saat startup</td></tr><tr><td><b>Tooling resmi</b></td><td>Bergantung pada library pihak ketiga yang tidak selalu terawat</td><td>Didukung ekosistem Apollo yang lengkap (Apollo Studio, Rover CLI)</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Konsep Utama Apollo Federation</h3><p>Sebelum melihat kode, pahami dulu empat konsep fondasi ini:</p><ul><li><b>Supergraph</b>: Tampilan API GraphQL tunggal yang dilihat oleh klien. Supergraph adalah hasil penggabungan semua subgraph oleh gateway.</li><li><b>Subgraph</b>: Layanan GraphQL individual yang dimiliki oleh satu tim. Ia memiliki schema, resolver, dan database-nya sendiri.</li><li><b>Apollo Gateway / Apollo Router</b>: Lapisan yang menerima query dari klien, membuat <i>query plan</i>, mendistribusikan query ke subgraph yang tepat, lalu menggabungkan hasilnya.</li><li><b>Entity</b>: Type yang didefinisikan di satu subgraph tapi bisa di-referensikan oleh subgraph lain. Sebuah entity punya <code>@key</code> — field yang menjadi identitas uniknya.</li></ul><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Aturan emas:</b> Setiap entity hanya punya satu subgraph "pemilik", tapi subgraph lain bisa me-referensikannya untuk menambahkan field baru.</blockquote>'
    },
    {
      type: 'example',
      title: 'Users Service — schema + resolver + @key (port 4001)',
      lang: 'javascript',
      output: false,
      code: `// users-service/index.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { gql } = require('graphql-tag');

// Definisi schema subgraph Users
// @key(fields: "id") → menjadikan User sebagai entity yang bisa direferensi subgraph lain
const typeDefs = gql\`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key", "@shareable"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
    me: User
  }
\`;

// Data dummy
const users = [
  { id: '1', name: 'Budi Santoso',  email: 'budi@example.com',  createdAt: '2024-01-10' },
  { id: '2', name: 'Sari Dewi',     email: 'sari@example.com',  createdAt: '2024-02-15' },
  { id: '3', name: 'Raka Pratama',  email: 'raka@example.com',  createdAt: '2024-03-20' },
];

const resolvers = {
  Query: {
    user:  (_, { id }) => users.find(u => u.id === id) ?? null,
    users: ()         => users,
    me:    ()         => users[0], // simulasi user yang sedang login
  },

  // Reference resolver: dipanggil oleh gateway ketika subgraph lain
  // membutuhkan data User berdasarkan { id }
  User: {
    __resolveReference(reference) {
      return users.find(u => u.id === reference.id);
    }
  }
};

async function main() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
  });
  console.log(\`🚀 Users subgraph siap di \${url}\`);
}

main();`,
      explain: [
        '<code>buildSubgraphSchema</code> dari <code>@apollo/subgraph</code> membuat schema yang "sadar Federation" — tidak seperti <code>makeExecutableSchema</code> biasa.',
        '<code>@key(fields: "id")</code> menjadikan <code>User</code> sebuah <b>entity</b>. Gateway tahu bahwa User dapat diidentifikasi dan diambil berdasarkan field <code>id</code>.',
        '<code>__resolveReference</code> adalah resolver khusus Federation: ia dipanggil ketika subgraph lain (misalnya Posts) meminta data User berdasarkan <code>id</code>-nya. Tanpa ini, Federation tidak bisa menyambungkan relasi antar subgraph.',
        'Users service berdiri sendiri di port 4001 dengan database (atau data dummy) miliknya sendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Posts Service — schema + resolver + reference resolver User (port 4002)',
      lang: 'javascript',
      output: false,
      code: `// posts-service/index.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { gql } = require('graphql-tag');

const typeDefs = gql\`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key", "@external", "@requires"])

  # Referensi ke entity User milik users-service
  # Kita hanya mendeklarasikan @key dan field yang dibutuhkan (external)
  type User @key(fields: "id") {
    id: ID!
    # posts adalah field BARU yang ditambahkan oleh posts-service ke entity User
    posts: [Post!]!
  }

  type Post @key(fields: "id") {
    id: ID!
    title: String!
    body: String!
    published: Boolean!
    authorId: ID!
    # author diambil dari users-service via Federation
    author: User!
  }

  type Query {
    post(id: ID!): Post
    posts: [Post!]!
    postsByUser(userId: ID!): [Post!]!
  }

  type Mutation {
    createPost(title: String!, body: String!, authorId: ID!): Post!
  }
\`;

const posts = [
  { id: 'p1', title: 'Belajar GraphQL',         body: 'GraphQL sangat fleksibel...', published: true,  authorId: '1' },
  { id: 'p2', title: 'Apollo Federation Guide',  body: 'Federation memudahkan...',   published: true,  authorId: '1' },
  { id: 'p3', title: 'Prisma dengan MariaDB',    body: 'Prisma adalah ORM modern...', published: false, authorId: '2' },
];

const resolvers = {
  Query: {
    post:         (_, { id })     => posts.find(p => p.id === id) ?? null,
    posts:        ()              => posts,
    postsByUser:  (_, { userId }) => posts.filter(p => p.authorId === userId),
  },

  Mutation: {
    createPost: (_, { title, body, authorId }) => {
      const newPost = {
        id: \`p\${posts.length + 1}\`,
        title, body, authorId,
        published: false,
      };
      posts.push(newPost);
      return newPost;
    }
  },

  Post: {
    // Mengembalikan object { __typename, id } agar gateway bisa
    // mengambil data User lengkap dari users-service
    author: (post) => ({ __typename: 'User', id: post.authorId }),

    __resolveReference(reference) {
      return posts.find(p => p.id === reference.id);
    }
  },

  // Reference resolver untuk entity User yang didefinisikan di sini
  // Posts-service menambahkan field "posts" ke entity User
  User: {
    posts: (user) => posts.filter(p => p.authorId === user.id),

    __resolveReference(reference) {
      // Kita hanya tahu id-nya; data User lengkap ada di users-service
      return { id: reference.id };
    }
  }
};

async function main() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4002 },
  });
  console.log(\`🚀 Posts subgraph siap di \${url}\`);
}

main();`,
      explain: [
        'Posts service <b>me-referensikan</b> entity <code>User</code> dengan mendeklarasikan type <code>User @key(fields: "id")</code>. Ia tidak menduplikasi data user — hanya menggunakan <code>id</code>-nya.',
        'Field <code>author</code> di resolver Post mengembalikan <code>{ __typename: "User", id: post.authorId }</code>. Ini memberi tahu gateway: "butuh data User ini dari users-service."',
        'Posts service juga <b>menambahkan field baru</b> <code>posts</code> ke entity User — contoh nyata bagaimana subgraph dapat memperkaya entity milik subgraph lain.',
        'Dua subgraph ini tidak saling import kode. Mereka berkomunikasi hanya melalui gateway menggunakan protocol Federation.'
      ]
    },
    {
      type: 'example',
      title: 'Apollo Gateway — Menghubungkan kedua subgraph',
      lang: 'javascript',
      output: false,
      code: `// gateway/index.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { ApolloGateway, IntrospectAndCompose } = require('@apollo/gateway');

// IntrospectAndCompose = gateway mengambil schema dari tiap subgraph saat startup
// Alternatif production: gunakan schema yang sudah di-compose dan disimpan (Managed Federation)
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'users', url: 'http://localhost:4001/graphql' },
      { name: 'posts', url: 'http://localhost:4002/graphql' },
    ],
  }),
});

const server = new ApolloServer({ gateway });

async function main() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  console.log(\`🌐 Apollo Gateway (Supergraph) siap di \${url}\`);
  console.log('Semua query dari klien dikirim ke port 4000, gateway yang mendistribusikan.');
}

main();

// package.json dependencies yang diperlukan:
// "@apollo/server": "^4.0.0"
// "@apollo/gateway": "^2.0.0"
// "@apollo/subgraph": "^2.0.0"
// "graphql-tag": "^2.12.0"
// "graphql": "^16.0.0"`,
      explain: [
        '<code>IntrospectAndCompose</code> membuat gateway meng-introspect schema dari setiap subgraph saat pertama kali dijalankan, lalu menyusunnya menjadi supergraph.',
        'Klien <b>hanya perlu tahu satu URL</b>: <code>http://localhost:4000/graphql</code>. Gateway yang mengurus distribusi ke subgraph yang tepat.',
        'Untuk production, sebaiknya gunakan <b>Managed Federation</b> via Apollo Studio — gateway mendapatkan supergraph schema dari Apollo Registry, bukan introspect saat runtime.',
        '<b>Apollo Router</b> (Rust) adalah pengganti gateway yang jauh lebih cepat dan direkomendasikan untuk production skala besar. API konfigurasinya mirip tetapi lebih kaya fitur.'
      ]
    },
    {
      type: 'example',
      title: 'Query melewati Federation — ambil User + Posts dari 2 subgraph',
      lang: 'graphql',
      output: false,
      code: `# Query ini dikirim ke gateway (port 4000)
# Gateway akan:
# 1. Ambil data user dari users-service (port 4001)
# 2. Ambil data posts dari posts-service (port 4002)
# 3. Gabungkan hasilnya sebelum dikembalikan ke klien

query GetUserWithPosts {
  user(id: "1") {
    id
    name
    email
    posts {         # field ini diselesaikan oleh posts-service
      id
      title
      published
    }
  }
}

# Response yang dikembalikan gateway (sudah digabung):
# {
#   "data": {
#     "user": {
#       "id": "1",
#       "name": "Budi Santoso",
#       "email": "budi@example.com",
#       "posts": [
#         { "id": "p1", "title": "Belajar GraphQL", "published": true },
#         { "id": "p2", "title": "Apollo Federation Guide", "published": true }
#       ]
#     }
#   }
# }

# -------------------------------------------
# Query lain: ambil posts beserta data author-nya
query GetPostsWithAuthor {
  posts {
    id
    title
    published
    author {        # field ini trigger ke users-service
      id
      name
      email
    }
  }
}

# -------------------------------------------
# Mutation: buat post baru (dikirim ke posts-service via gateway)
mutation BuatPost {
  createPost(
    title: "Belajar Apollo Router"
    body: "Apollo Router adalah pengganti gateway berbasis Rust..."
    authorId: "2"
  ) {
    id
    title
    author {
      name
    }
  }
}`,
      explain: [
        'Klien mengirim <b>satu query</b> ke gateway. Klien tidak perlu tahu ada dua subgraph berbeda.',
        'Gateway membuat <b>query plan</b>: pertama ambil <code>user</code> dari users-service, lalu gunakan <code>id</code>-nya untuk mengambil <code>posts</code> dari posts-service.',
        'Penggabungan terjadi di gateway sebelum data dikirim ke klien — hasilnya terasa seperti satu GraphQL API monolitik.',
        'Field <code>author</code> di Post juga di-resolve secara otomatis: posts-service memberikan <code>{ __typename, id }</code>, gateway memintanya ke users-service.'
      ]
    },
    {
      type: 'live',
      title: 'Diagram Interaktif: Alur Query melalui Apollo Federation',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; font-size: 13px; background: #0f172a; color: #e2e8f0; padding: 16px; }
  h3 { color: #f8fafc; margin-bottom: 12px; font-size: 15px; }
  .container { display: flex; flex-direction: column; gap: 12px; }
  .arch { display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: nowrap; }
  .node {
    border-radius: 10px; padding: 12px 16px; text-align: center;
    min-width: 110px; border: 2px solid transparent;
    transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
    position: relative;
  }
  .node.active { transform: scale(1.07); box-shadow: 0 0 20px 4px var(--glow); border-color: var(--glow); }
  .client  { background: #1e3a5f; --glow: #60a5fa; }
  .gateway { background: #3b1f6e; --glow: #a78bfa; }
  .users   { background: #064e3b; --glow: #34d399; }
  .posts   { background: #7c2d12; --glow: #fb923c; }
  .node .icon { font-size: 22px; display: block; margin-bottom: 4px; }
  .node .label { font-weight: 700; font-size: 12px; }
  .node .sublabel { font-size: 10px; opacity: 0.7; margin-top: 2px; }
  .arrow {
    font-size: 20px; color: #64748b; padding: 0 6px;
    transition: color 0.3s, transform 0.3s;
    display: flex; align-items: center;
  }
  .arrow.active { color: #fbbf24; transform: scale(1.3); }
  .subgraphs { display: flex; flex-direction: column; gap: 8px; }
  .v-arrow { text-align: center; font-size: 18px; color: #64748b; line-height: 1; transition: color 0.3s; }
  .v-arrow.active { color: #fbbf24; }
  .right-col { display: flex; flex-direction: column; align-items: center; }
  .log {
    background: #1e293b; border-radius: 8px; padding: 12px; min-height: 90px;
    font-size: 12px; line-height: 1.7; border: 1px solid #334155;
  }
  .log .step { opacity: 0; transition: opacity 0.4s; }
  .log .step.show { opacity: 1; }
  .log .step-label { color: #fbbf24; font-weight: 700; }
  .btn {
    padding: 9px 20px; background: #6d28d9; color: #fff; border: none;
    border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px;
    transition: background 0.2s; margin-top: 8px; width: 100%;
  }
  .btn:hover { background: #7c3aed; }
  .btn:disabled { background: #374151; cursor: not-allowed; }
  .phase { font-size: 11px; background: #1e293b; border-radius: 6px; padding: 4px 10px; text-align:center; }
  .phase span { color: #a78bfa; font-weight: 700; }
</style>
</head>
<body>
<h3>🔭 Alur Query Apollo Federation</h3>
<div class="container">
  <div style="display:flex;gap:10px;align-items:flex-start">
    <div style="flex:1">
      <div class="arch" id="arch">
        <div class="node client" id="n-client">
          <span class="icon">💻</span>
          <div class="label">Client</div>
          <div class="sublabel">Browser/App</div>
        </div>
        <div class="arrow" id="a1">→</div>
        <div class="node gateway" id="n-gateway">
          <span class="icon">🌐</span>
          <div class="label">Apollo Gateway</div>
          <div class="sublabel">port 4000</div>
        </div>
        <div class="arrow" id="a2" style="display:none">→</div>
        <div class="right-col" id="right-col" style="display:none">
          <div class="node users" id="n-users">
            <span class="icon">👤</span>
            <div class="label">Users Subgraph</div>
            <div class="sublabel">port 4001</div>
          </div>
          <div class="v-arrow" id="a3">↕</div>
          <div class="node posts" id="n-posts">
            <span class="icon">📝</span>
            <div class="label">Posts Subgraph</div>
            <div class="sublabel">port 4002</div>
          </div>
        </div>
      </div>
      <div class="phase" style="margin-top:10px">
        Fase: <span id="phase-label">Siap</span>
      </div>
    </div>
  </div>

  <div class="log" id="log">
    <div class="step show" id="s0"><span class="step-label">▶ Siap.</span> Tekan tombol untuk mensimulasikan query Federation.</div>
    <div class="step" id="s1"><span class="step-label">[1]</span> Client mengirim query ke gateway (port 4000): <code>{ user(id:"1") { name posts { title } } }</code></div>
    <div class="step" id="s2"><span class="step-label">[2]</span> Gateway menganalisis query dan membuat <b>query plan</b>: butuh Users &amp; Posts subgraph.</div>
    <div class="step" id="s3"><span class="step-label">[3]</span> Gateway → <b>Users subgraph</b>: ambil <code>user(id:"1") { id name }</code></div>
    <div class="step" id="s4"><span class="step-label">[4]</span> Users subgraph → Gateway: <code>{ id:"1", name:"Budi Santoso" }</code> ✓</div>
    <div class="step" id="s5"><span class="step-label">[5]</span> Gateway → <b>Posts subgraph</b>: <code>_entities([{__typename:"User",id:"1"}]) { posts { id title } }</code></div>
    <div class="step" id="s6"><span class="step-label">[6]</span> Posts subgraph → Gateway: <code>[{posts:[{title:"Belajar GraphQL"},{title:"Federation Guide"}]}]</code> ✓</div>
    <div class="step" id="s7"><span class="step-label">[7]</span> Gateway <b>menggabungkan</b> kedua response dan mengirim hasil akhir ke client. 🎉</div>
  </div>

  <button class="btn" id="btn" onclick="runAnim()">▶ Jalankan Simulasi Query</button>
</div>

<script>
function setActive(ids, active) {
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (active) el.classList.add('active');
    else el.classList.remove('active');
  });
}
function showStep(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('show');
}
function setPhase(text) {
  document.getElementById('phase-label').textContent = text;
}
function showRight() {
  document.getElementById('a2').style.display = 'flex';
  document.getElementById('right-col').style.display = 'flex';
}

var steps = [
  // [delay, activeNodes, activeArrows, stepToShow, phase]
  [300,  ['n-client'], ['a1'], 's1', 'Client kirim query'],
  [900,  ['n-gateway'], [],    's2', 'Gateway: query planning'],
  [1700, ['n-gateway','n-users'], ['a1','a2'], 's3', 'Gateway → Users subgraph'],
  [2600, ['n-users'], [], 's4', 'Users subgraph menjawab'],
  [3400, ['n-gateway','n-posts'], ['a2'], 's5', 'Gateway → Posts subgraph'],
  [4300, ['n-posts'], [], 's6', 'Posts subgraph menjawab'],
  [5200, ['n-gateway','n-client'], ['a1'], 's7', 'Gateway gabungkan & kirim ke client'],
  [6100, [], [], null, 'Selesai ✓'],
];

function runAnim() {
  var btn = document.getElementById('btn');
  btn.disabled = true;
  // reset
  ['n-client','n-gateway','n-users','n-posts','a1','a2','a3'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.classList.remove('active');
  });
  ['s1','s2','s3','s4','s5','s6','s7'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.classList.remove('show');
  });
  document.getElementById('a2').style.display = 'none';
  document.getElementById('right-col').style.display = 'none';
  setPhase('Memulai...');

  showRight(); // tampilkan subgraph nodes dulu (tersembunyi via arrow visibility)

  steps.forEach(function(step, i) {
    var delay = step[0], nodes = step[1], arrows = step[2], sid = step[3], phase = step[4];
    setTimeout(function() {
      ['n-client','n-gateway','n-users','n-posts','a1','a2','a3'].forEach(function(id){
        var el=document.getElementById(id); if(el) el.classList.remove('active');
      });
      setActive(nodes, true);
      setActive(arrows, true);
      setPhase(phase);
      if (sid) showStep(sid);
      // Show right col with arrows starting step 3
      if (i >= 2) {
        document.getElementById('a2').style.display = 'flex';
        document.getElementById('right-col').style.display = 'flex';
        document.getElementById('a3').classList.add('active');
      }
      if (i === steps.length - 1) {
        setTimeout(function() { btn.disabled = false; }, 800);
      }
    }, delay);
  });
}
</script>
</body>
</html>`,
      hint: 'Tekan tombol "Jalankan Simulasi Query" untuk melihat langkah-langkah bagaimana gateway mendistribusikan query ke dua subgraph lalu menggabungkan hasilnya.'
    },
    {
      type: 'tip',
      title: 'Mulai dari monolith GraphQL dulu',
      text: 'Jangan langsung loncat ke Federation. Mulailah dengan <b>satu GraphQL server monolitik</b>. Ketika tim sudah besar (3+ tim mengerjakan domain berbeda), codebase mulai konflik, atau ada kebutuhan deploy tiap layanan secara independen — barulah pertimbangkan Federation. Migration path dari monolith ke Federation relatif mudah karena schema-nya kompatibel.'
    },
    {
      type: 'warn',
      title: 'Jangan over-engineer untuk proyek kecil',
      text: 'Apollo Federation memerlukan setup yang lebih kompleks: dua atau lebih server, gateway terpisah, monitoring untuk setiap subgraph, dan pemahaman tim tentang entity dan @key. Untuk <b>startup tahap awal, proyek personal, atau tim kecil (&lt;5 orang)</b>, satu GraphQL server monolith jauh lebih mudah di-maintain. Federation bersinar ketika kamu punya <b>multiple tim independen</b> yang perlu deploy sendiri-sendiri.'
    },
    {
      type: 'vocab',
      items: [
        ['Supergraph', 'Gabungan seluruh subgraph yang terlihat oleh klien sebagai satu GraphQL API tunggal. Dikelola oleh Apollo Gateway atau Apollo Router.'],
        ['Subgraph', 'Layanan GraphQL individual yang dimiliki oleh satu tim. Memiliki schema, resolver, dan database sendiri. Dibangun dengan @apollo/subgraph.'],
        ['Apollo Federation', 'Arsitektur untuk menggabungkan beberapa GraphQL API (subgraph) menjadi satu supergraph, memungkinkan setiap tim bekerja secara mandiri.'],
        ['Apollo Gateway', 'Lapisan tengah yang menerima query dari klien, membuat query plan, mendistribusikan ke subgraph, dan menggabungkan hasilnya. Versi JavaScript dari orchestrator Federation.'],
        ['@key Directive', 'Direktif Federation yang menandai field mana yang menjadi identitas unik sebuah entity. Contoh: type User @key(fields: "id"). Wajib ada agar entity bisa direferensi subgraph lain.'],
        ['Entity Reference', 'Mekanisme Federation di mana satu subgraph mereferensikan entity milik subgraph lain hanya berdasarkan @key-nya, tanpa menduplikasi data. Diselesaikan via __resolveReference.'],
        ['Schema Stitching', 'Pendekatan lama untuk menggabungkan beberapa GraphQL schema secara manual di sisi gateway. Lebih rawan error dan sulit di-maintain dibandingkan Federation untuk skala besar.']
      ]
    }
  ],
  recap: [
    '<b>Schema Stitching</b> adalah cara lama yang rawan konflik; <b>Apollo Federation</b> adalah standar modern untuk arsitektur microservices GraphQL.',
    'Setiap <b>subgraph</b> dibangun dengan <code>buildSubgraphSchema</code> dan memiliki schema serta resolver-nya sendiri.',
    'Type yang menjadi "jembatan" antar subgraph disebut <b>entity</b>, diidentifikasi dengan direktif <b>@key</b> dan diselesaikan via <b>__resolveReference</b>.',
    '<b>Apollo Gateway</b> menjadi titik masuk tunggal bagi klien — ia membuat query plan dan mendistribusikan ke subgraph yang tepat.',
    'Klien cukup mengirim <b>satu query ke satu URL</b>; kompleksitas distribusi sepenuhnya tersembunyi di gateway.',
    '<b>Mulai dari monolith</b>: jangan gunakan Federation sampai benar-benar dibutuhkan karena kompleksitasnya signifikan.'
  ]
});
