/* ============================================================
   GraphQL — Bab 13: GraphQL Subscriptions (Real-time)
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'subscriptions-realtime',
  title: 'GraphQL Subscriptions: Data Real-time dengan WebSocket',
  chapter: 'Teknik Lanjutan',
  duration: '20 menit',
  intro: [
    'Selama ini ketiga operasi GraphQL kamu jalankan lewat HTTP biasa: klien kirim request, server balas, koneksi selesai. Tapi bagaimana jika kamu ingin <b>notifikasi pesanan masuk</b>, <b>chat</b>, atau <b>skor pertandingan langsung</b> tanpa klien harus mempertanyakan server berkali-kali? Di sinilah operasi ketiga — <b>Subscription</b> — bekerja.',
    'Berbeda dari Query dan Mutation yang meminta data sekali, Subscription membuat klien <b>berlangganan</b> satu topik: koneksi dibuka terus-menerus lewat WebSocket, dan setiap kali ada data baru di server, ia dikirimkan otomatis ke semua pelanggan. Dalam pelajaran ini kamu akan memasang subscription lengkap dari server hingga klien React.'
  ],
  objectives: [
    'Membedakan cara kerja Query/Mutation (HTTP) dengan Subscription (WebSocket)',
    'Mendefinisikan tipe Subscription pada schema SDL',
    'Mengimplementasikan resolver subscribe dengan pola PubSub (AsyncIterator)',
    'Mengonfigurasi WebSocket server (graphql-ws) di sisi Apollo Server',
    'Menggunakan useSubscription di Apollo Client untuk menampilkan data langsung'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>HTTP vs WebSocket: Mengapa Subscription Butuh Koneksi Khusus</h3><p>HTTP bersifat <i>request-response</i>: klien bertanya, server menjawab, koneksi ditutup. Model ini tidak cocok untuk data real-time karena klien tidak tahu kapan data baru datang. Tiga solusi yang umum dipakai di dunia web:</p><table><thead><tr><th>Teknik</th><th>Cara Kerja</th><th>Kekurangan</th></tr></thead><tbody><tr><td><b>Polling</b> (HTTP)</td><td>Klien bertanya berkala ("ada yang baru?") setiap 5 detik</td><td>Banyak request sia-sia; jeda hingga 5 detik</td></tr><tr><td><b>Long polling</b></td><td>Server menahan request sampai ada data baru</td><td>Koneksi sering putus; boros resource server</td></tr><tr><td><b>WebSocket</b> (Subscription)</td><td>Koneksi dua arah terbuka sekali, data mengalir kapan saja</td><td>Butuh penanganan koneksi &amp; scaling khusus</td></tr></tbody></table><p>GraphQL menambahkan lapisan formal di atas WebSocket: klien mengirim <b>operasi subscription</b> sekali, lalu server mengalirkan setiap perubahan sebagai response baru — dengan format query yang sama seperti biasa, sehingga klien tetap menentukan field yang diinginkan.</p>'
    },
    {
      type: 'example',
      title: 'Schema SDL: Menambahkan tipe Subscription',
      lang: 'graphql',
      output: false,
      code: `# Schema lengkap dengan tiga operasi

type Subscription {
  # Berlangganan satu post baru
  postCreated: Post!

  # Berlangganan perubahan status pesanan tertentu
  orderStatusChanged(orderId: ID!): Order!

  # Notifikasi chat dalam ruangan tertentu
  messageAdded(roomId: ID!): Message!
}

type Post {
  id: ID!
  title: String!
  status: PostStatus!
  author: User!
}

type Order {
  id: ID!
  status: String!      # PENDING -> PAID -> SHIPPED
  updatedAt: String!
}

# Klien berlangganan (contoh dari Apollo Sandbox / klien WS):
# subscription NotifikasiPost {
#   postCreated { id title author { name } }
# }`,
      explain: [
        'Tipe Subscription mendefinisikan <b>event apa saja</b> yang bisa didengarkan — mirip dengan Query, tapi setiap pemanggilan resolver menghasilkan <b>lebih dari satu response</b> (satu per event).',
        'Subscription menerima argument seperti <code>orderId</code> / <code>roomId</code> sehingga klien hanya menerima event yang relevan (server memfilternya).',
        'Field yang diminta klien di selection set tetap berlaku — inilah keunggulan GraphQL: data real-time pun bisa dipilih persis field-nya.'
      ]
    },
    {
      type: 'example',
      title: 'Server: PubSub + resolver subscribe & publish',
      lang: 'javascript',
      output: false,
      code: `// src/pubsub.ts — broker event sederhana (untuk produksi pakai Redis PubSub)
import { PubSub } from 'graphql-subscriptions';
export const pubsub = new PubSub();

const POST_CREATED = 'POST_CREATED';
// graphql-subscriptions v4 membutuhkan AsyncIterator:
pubsub.asyncIterator(POST_CREATED); // dipakai di resolver

// src/resolvers.ts
const resolvers = {
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(POST_CREATED)
    },
    orderStatusChanged: {
      subscribe: (_p, { orderId }, { pubsub }) =>
        pubsub.asyncIterator('ORDER_STATUS_' + orderId)
    }
  },

  Mutation: {
    createPost: async (_p, { input }, { prisma, currentUser, pubsub }) => {
      if (!currentUser) throw new GraphQLError('Harus login');

      const post = await prisma.post.create({
        data: { ...input, authorId: currentUser.id }
      });

      // PANGGILAN INI mengirim event ke SEMUA pelanggan subscription
      pubsub.publish(POST_CREATED, { postCreated: post });

      return post;
    }
  }
};`,
      explain: [
        'Kerja pasangan: <code>publish</code> di Mutation (saat data berubah) dan <code>subscribe</code> di Subscription (mendengarkan) — keduanya dipisahkan oleh nama channel yang sama.',
        'Payload publish harus berbentuk <code>{ namaFieldSubscription: data }</code> — jika salah menulis nama field, klien menerima data kosong tanpa error.',
        'PubSub bawaan hanya bekerja dalam <b>satu proses</b>. Saat server dijalankan dengan beberapa instance/cluster, gunakan Redis PubSub agar event sampai ke semua instance.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi WebSocket Server (graphql-ws) di Apollo Server v4',
      lang: 'javascript',
      output: false,
      code: `// src/index.ts — HTTP + WebSocket dalam satu port
import { ApolloServer } from '@apollo/server';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
const httpServer = createServer(app);

// 1) WebSocket server menempel di path /graphql
const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

const serverCleanup = useServer(
  {
    schema,
    // 2) Verifikasi token saat handshake koneksi (bukan per pesan)
    context: async (ctx) => {
      const token = (ctx.connectionParams?.authToken as string) || '';
      const currentUser = token ? verifyToken(token) : null;
      return { currentUser, prisma, pubsub };
    }
  },
  wsServer
);

// 3) Apollo Server di atas HTTP server yang sama
const server = new ApolloServer({ schema });
await server.start();
app.use('/graphql', express.json(), expressMiddleware(server, {
  context: async ({ req }) => ({ currentUser: req.currentUser, prisma, pubsub })
}));

// 4) Tutup WebSocket dengan rapi saat server dimatikan
['SIGTERM', 'SIGINT'].forEach((sig) =>
  process.on(sig, async () => {
    await serverCleanup.dispose();
    await server.stop();
    httpServer.close();
  })
);

httpServer.listen(4000, () =>
  console.log('HTTP + WS ready di http://localhost:4000/graphql')
);`,
      explain: [
        'Apollo Server v4 <b>tidak lagi</b> menyediakan subscription bawaan — kamu menambahkan <code>graphql-ws</code> yang berjalan di port dan path yang sama.',
        'Auth dilakukan saat <b>handshake</b> (connectionParams) — satu kali per koneksi, bukan per pesan; token yang sama bisa dipakai ulang untuk semua pesan.',
        'Dispose saat shutdown mencegah kebocoran koneksi dan error "socket hang up" saat deploy/CI.'
      ]
    },
    {
      type: 'example',
      title: 'Klien React: useSubscription + tampilan langsung',
      lang: 'javascript',
      output: false,
      code: `// src/main.tsx — pasang link WebSocket untuk subscription
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: { authToken: localStorage.getItem('token') }
}));

const httpLink = new HttpLink({ uri: 'http://localhost:4000/graphql' });

// Arahkan: query/mutation -> HTTP, subscription -> WebSocket
const link = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({ link, cache: new InMemoryCache() });

// src/components/NotifikasiPost.tsx — berlangganan
import { useSubscription, gql } from '@apollo/client';

const POST_CREATED = gql\`
  subscription NotifikasiPost {
    postCreated { id title author { name } }
  }
\`;

function NotifikasiPost() {
  const { data, loading } = useSubscription(POST_CREATED);

  if (loading) return <p>Menunggu notifikasi...</p>;
  if (!data) return null;

  return (
    <div className="toast">
      📝 {data.postCreated.author.name} menerbitkan:
      "{data.postCreated.title}"
    </div>
  );
}`,
      explain: [
        '<code>split</code> adalah pengalih traffic: operasi <b>subscription</b> dikirim ke WebSocket, sisanya tetap lewat HTTP biasa — satu client untuk dua protokol.',
        '<code>useSubscription</code> bekerja seperti useQuery tapi tanpa <code>data</code> berhenti: setiap event baru memperbarui state dan memicu render ulang otomatis.',
        'Selalu tampilkan indikator "menunggu" — berbeda dari query, subscription tidak pernah benar-benar selesai sampai koneksi ditutup.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Alur publish → WebSocket → beberapa klien',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; color: #0f172a; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; }
  .panel { flex: 1; min-width: 230px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
  .server { text-align: center; background: #f5f3ff; border-color: #c4b5fd; }
  button { padding: 7px 12px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; color: #fff; }
  .pub { background: #7c3aed; } .sub { background: #0891b2; } .off { background: #64748b; }
  .clients { display: flex; gap: 8px; flex-wrap: wrap; }
  .client { flex: 1; min-width: 150px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
  .client h5 { margin: 0 0 4px; font-size: 12px; display: flex; align-items: center; gap: 5px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; display: inline-block; }
  .dot.on { background: #22c55e; box-shadow: 0 0 5px #22c55e; }
  .feed { background: #0f172a; color: #94a3b8; border-radius: 6px; min-height: 90px; max-height: 150px;
          overflow-y: auto; padding: 6px; font-family: monospace; font-size: 11px; }
  .feed .ev { color: #4ade80; }
  .feed .sys { color: #64748b; }
  .pipe { text-align: center; font-size: 18px; color: #a78bfa; margin: 6px 0; letter-spacing: 3px; }
  .hint { font-size: 11px; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>
<h3>📡 Subscription: satu publish, banyak klien terima</h3>

<div class="row">
  <div class="panel server">
    <b>⚙️ GraphQL Server + PubSub</b>
    <div class="pipe" id="pipe">· · ·</div>
    <button class="pub" id="btnPub">Mutation createPost (publish)</button>
    <div class="hint">Channel: <code>POST_CREATED</code></div>
  </div>
</div>

<div class="pipe" id="flow">⬇ WebSocket ⬇</div>

<div class="clients">
  <div class="client">
    <h5><span class="dot" id="d1"></span> Klien A (React Web)</h5>
    <button class="sub" id="s1" style="width:100%;margin-bottom:6px">Subscribe</button>
    <div class="feed" id="f1"><span class="sys">Belum berlangganan.</span></div>
  </div>
  <div class="client">
    <h5><span class="dot" id="d2"></span> Klien B (Mobile App)</h5>
    <button class="sub" id="s2" style="width:100%;margin-bottom:6px">Subscribe</button>
    <div class="feed" id="f2"><span class="sys">Belum berlangganan.</span></div>
  </div>
  <div class="client">
    <h5><span class="dot" id="d3"></span> Klien C (Dashboard)</h5>
    <button class="sub" id="s3" style="width:100%;margin-bottom:6px">Subscribe</button>
    <div class="feed" id="f3"><span class="sys">Belum berlangganan.</span></div>
  </div>
</div>

<div class="hint">Aktifkan minimal satu klien lalu tekan tombol publish — perhatikan event masuk serentak di semua klien yang subscribe, tanpa mereka mengirim request apa pun.</div>

<script>
  var subs = [false, false, false];
  var titles = ['GraphQL Tanpa Mistis', 'Federation di Produksi', 'DataLoader Menyelamatkan', 'Cursor Pagination Praktis', 'Introspeksi & Keamanan'];
  var n = 0;

  function setDot(i, on) {
    document.getElementById('d' + (i + 1)).className = 'dot' + (on ? ' on' : '');
  }
  function addFeed(i, html) {
    var f = document.getElementById('f' + (i + 1));
    if (f.querySelector('.sys') && subs[i]) f.innerHTML = '';
    f.innerHTML += html + '<br>';
    f.scrollTop = f.scrollHeight;
  }

  [0, 1, 2].forEach(function (i) {
    document.getElementById('s' + (i + 1)).onclick = function () {
      subs[i] = !subs[i];
      setDot(i, subs[i]);
      this.textContent = subs[i] ? 'Unsubscribe' : 'Subscribe';
      this.style.background = subs[i] ? '#dc2626' : '#0891b2';
      if (subs[i]) {
        addFeed(i, '<span class="sys">✓ terhubung ws://.../graphql (kirim subscription NotifikasiPost)</span>');
      } else {
        addFeed(i, '<span class="sys">— koneksi ditutup</span>');
      }
    };
  });

  document.getElementById('btnPub').onclick = function () {
    var count = subs.filter(Boolean).length;
    if (count === 0) {
      document.getElementById('flow').textContent = '⚠ Tidak ada pelanggan — event terbuang';
      setTimeout(function () { document.getElementById('flow').textContent = '⬇ WebSocket ⬇'; }, 1800);
      return;
    }
    n++;
    var payload = '{ id: ' + n + ', title: "' + titles[n % titles.length] + '" }';

    // Animasi publish
    var pipe = document.getElementById('pipe');
    pipe.textContent = '▶ publish POST_CREATED';
    setTimeout(function () { pipe.textContent = '· · ·'; }, 900);

    subs.forEach(function (on, i) {
      if (on) {
        setTimeout(function () {
          addFeed(i, '<span class="ev">← {' + payload + '}</span>');
        }, 300 + i * 150); // sedikit jeda visual per klien
      }
    });

    document.getElementById('flow').textContent =
      '⬇ event terkirim ke ' + count + ' pelanggan (tanpa request apa pun) ⬇';
    setTimeout(function () { document.getElementById('flow').textContent = '⬇ WebSocket ⬇'; }, 1800);
  };
</script>
</body>
</html>`,
      hint: 'Aktifkan tombol Subscribe pada dua atau tiga klien, lalu tekan tombol publish beberapa kali — semua klien yang aktif menerima event serentak tanpa mengirim request. Matikan satu klien lalu publish lagi untuk melihat filter langganan.'
    },
    {
      type: 'tip',
      title: 'Kapan pakai Subscription, kapan cukup polling?',
      text: '<b>Pakai Subscription</b> ketika latensi sangat kritikal: chat, notifikasi pesanan live, kolaborasi dokumen (Google Docs), dan skor langsung.<br><br><b>Cukup polling/refetch</b> ketika data hanya berubah sesekali: notifikasi badge, daftar pesanan admin, atau dashboard yang di-refresh tiap 30 detik. Subscription membuka koneksi yang menahan memori server — jangan membukanya untuk data yang jarang berubah hanya karena terlihat "lebih keren".'
    },
    {
      type: 'warn',
      title: 'Skalabilitas: PubSub bawaan hanya untuk satu proses',
      text: 'Objek PubSub in-memory <b>tidak bekerja</b> saat kamu menjalankan aplikasi dengan banyak instance (clustering/PM2/Kubernetes) — instance yang menerima mutation tidak berbagi memori dengan instance tempat klien terhubung. Untuk produksi multi-instance, ganti dengan <b>Redis PubSub</b> (<code>@graphql-pubsub/redis-pubsub</code>) yang menjadi jembatan antar instance. Juga perhatikan: setiap koneksi WebSocket menahan satu socket terbuka — pasang batas koneksi per pengguna dan timeout koneksi idle.'
    },
    {
      type: 'vocab',
      items: [
        ['Subscription', 'Operasi GraphQL yang membuat klien berlangganan event — server mengirim data berulang kali selama koneksi terbuka.'],
        ['WebSocket', 'Protokol komunikasi dua arah di atas HTTP yang mempertahankan koneksi — fondasi transportasi GraphQL Subscriptions.'],
        ['graphql-ws', 'Library standar yang mengimplementasikan protokol WebSocket untuk GraphQL (pengganti subscriptions-transport-ws lama).'],
        ['PubSub (Publish-Subscribe)', 'Pola bus event: satu pihak menerbitkan (publish) ke channel, semua pihak yang berlangganan (subscribe) menerimanya.'],
        ['AsyncIterator', 'Objek yang mewakili aliran data berkelanjutan — objek yang dihasilkan oleh pubsub.asyncIterator(channel) untuk resolver subscribe.'],
        ['Polling', 'Teknik lama: klien bertanya berkala apakah ada data baru — boros request dan memiliki jeda, alternatif murah dari Subscription.'],
        ['ConnectionParams', 'Parameter yang dikirim saat handshake WebSocket (mis. authToken) — tempat autentikasi koneksi subscription dilakukan.']
      ]
    }
  ],
  recap: [
    '<b>Subscription</b> adalah operasi ketiga GraphQL: klien berlangganan topik lewat <b>WebSocket</b>, dan server mengalirkan setiap perubahan tanpa diminta.',
    'Bandingannya: <b>Query/Mutation</b> = HTTP request-response sekali; <b>Subscription</b> = koneksi terbuka yang mengalirkan banyak response.',
    'Dua sisi selalu berpasangan: <code>subscribe</code> (resolver berlangganan) di resolver Subscription, dan <code>publish</code> (mengirim event) dari dalam Mutation setelah data berubah.',
    'Apollo Server v4 membutuhkan <b>graphql-ws</b> terpisah yang menempel di satu port &amp; path yang sama, lengkap dengan verifikasi token saat handshake.',
    'Di klien, gunakan <b>split link</b> (subscription → WS, sisanya → HTTP) dan hook <code>useSubscription</code> yang otomatis me-render ulang tiap event masuk.',
    'Untuk produksi multi-instance, ganti PubSub in-memory dengan <b>Redis PubSub</b> dan pasang batas koneksi WebSocket.'
  ]
});
