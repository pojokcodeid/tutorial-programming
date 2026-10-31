/* ============================================================
   GraphQL — Bab 12: Keamanan — Autentikasi, Otorisasi & Hardening
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'keamanan-otorisasi',
  title: 'Keamanan GraphQL: Autentikasi, Otorisasi & Hardening',
  chapter: 'Teknik Lanjutan',
  duration: '22 menit',
  intro: [
    'GraphQL punya satu keunikan yang membuatnya sekaligus powerful dan berbahaya: <b>satu endpoint melayani semua operasi</b>. Tidak ada URL yang bisa diblokir per-fitur, introspeksi schema terbuka secara default, dan satu query bersarang bisa membuat server bekerja keras hingga kehabisan sumber daya. Penyerang tidak perlu menebak-nebak endpoint — cukup satu POST ke <code>/graphql</code>.',
    'Dalam pelajaran ini kamu akan memasang tiga lapis pertahanan: <b>autentikasi JWT</b> lewat context (kamu siapa), <b>otorisasi</b> di resolver dan directive (kamu boleh apa), dan <b>hardening</b> berupa depth limit, complexity limit, rate limiting, serta penonaktifan introspeksi di produksi.'
  ],
  objectives: [
    'Mengautentikasi klien dengan JWT dan menyuntikkannya ke GraphQL context',
    'Menerapkan otorisasi pada level field (resolver) untuk data milik pengguna',
    'Membuat directive kustom @auth untuk deklaratif otorisasi pada schema',
    'Membatasi kedalaman dan kompleksitas query untuk mencegah serangan DoS',
    'Menonaktifkan introspeksi dan menerapkan rate limiting di produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa GraphQL Butuh Pertahanan Khusus?</h3><p>Banyak tim menganggap GraphQL "sudah aman karena berbasis HTTP dan bisa dipasangi middleware". Kenyataannya, pola serangan GraphQL berbeda dari REST:</p><table><thead><tr><th>Ancaman</th><th>Cara Kerja</th><th>Tangkapan di REST</th></tr></thead><tbody><tr><td><b>Introspeksi bocor</b></td><td>Klien bisa meminta <code>__schema</code> dan mengetahui SELURUH API-mu, termasuk field rahasia</td><td>Tidak ada setara — REST tidak punya schema queryable</td></tr><tr><td><b>Query bomb</b></td><td>Query bersarang ratusan level membuat resolver dipanggil jutaan kali</td><td>URL terbatas, sulit dibuat sedalam itu</td></tr><tr><td><b>Batching abuse</b></td><td>Ratusan alias dalam satu request untuk menggandakan beban</td><td>Terbatas oleh jumlah endpoint</td></tr><tr><td><b>Akses lintas data</b></td><td><code>user(id: "2")</code> padahal seharusnya hanya boleh melihat miliknya sendiri</td><td>Sering lolos karena cuma 1 endpoint</td></tr></tbody></table><p>Karena itu pertahanan GraphQL harus aktif di dua lapis sekaligus: <b>data</b> (siapa boleh apa) dan <b>query</b> (seberapa berat permintaan yang boleh dieksekusi).</p>'
    },
    {
      type: 'example',
      title: 'Autentikasi: Login Mutation + Context JWT',
      lang: 'javascript',
      output: false,
      code: `// src/auth.ts — verifikasi token & bangun context
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET!;

// Dipanggil Apollo Server untuk SETiap request
export async function buildContext({ req }: { req: any }) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');

  let currentUser = null;
  if (token) {
    try {
      currentUser = jwt.verify(token, JWT_SECRET); // { id, role }
    } catch (e) {
      // token kadaluarsa/tampered: dianggap anonim, TIDAK error
    }
  }
  return { currentUser };  // tersedia sebagai argumen ke-3 resolver
}

// src/resolvers.ts — mutation login
const resolvers = {
  Mutation: {
    login: async (_p, { email, password }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new GraphQLError('Email atau password salah', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      return { token, user };
    }
  }
};`,
      explain: [
        'Context dibuat <b>sekali per request</b> — verifikasi token cukup satu kali, lalu hasilnya dipakai semua resolver yang berjalan pada request tersebut.',
        'Token yang tidak valid diperlakukan sebagai pengguna anonim, bukan error fatal — agar query publik tetap bisa jalan.',
        'Payload JWT menyimpan <b>id dan role saja</b>, bukan data profil. JWT harus ringan karena dikirim bolak-balik di setiap request.'
      ]
    },
    {
      type: 'example',
      title: 'Otorisasi Level Resolver: Tolak Bukan Milikmu',
      lang: 'javascript',
      output: false,
      code: `// src/resolvers.ts — field-level authorization
const resolvers = {
  Mutation: {
    updatePost: async (_p, { id, input }, { prisma, currentUser }) => {
      // 1. Wajib login
      if (!currentUser) {
        throw new GraphQLError('Silakan login dulu', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 2. Cek kepemilikan — jangan percaya id dari klien!
      const post = await prisma.post.findUnique({ where: { id: Number(id) } });
      if (!post) throw new GraphQLError('Post tidak ditemukan', {
        extensions: { code: 'NOT_FOUND' }
      });
      if (post.authorId !== currentUser.id) {
        throw new GraphQLError('Bukan post milikmu', {
          extensions: { code: 'FORBIDDEN' }   // 403, bukan 401
        });
      }

      return prisma.post.update({ where: { id: post.id }, data: input });
    },

    deletePost: async (_p, { id }, { prisma, currentUser }) => {
      if (!currentUser) throw new GraphQLError('Silakan login dulu');
      const post = await prisma.post.findUnique({ where: { id: Number(id) } });
      if (!post || (post.authorId !== currentUser.id && currentUser.role !== 'ADMIN')) {
        throw new GraphQLError('Tidak berhak menghapus post ini', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      await prisma.post.delete({ where: { id: post.id } });
      return true;
    }
  },

  Query: {
    // Field privat: hanya terlihat oleh pemiliknya
    me: (_p, _a, { prisma, currentUser }) => {
      if (!currentUser) return null;
      return prisma.user.findUnique({ where: { id: currentUser.id } });
    }
  }
};`,
      explain: [
        'Urutan pemeriksaan yang benar: <b>autentikasi dulu (401), baru otorisasi (403)</b> — membedakan "belum login" vs "sudah login tapi tidak berhak".',
        'Pemeriksaan dilakukan dengan <b>membaca data dari database</b>, bukan mempercayai argument klien — itulah inti mencegah Insecure Direct Object Reference (IDOR).',
        'Error GraphQL memakai <code>extensions.code</code> standar (UNAUTHENTICATED, FORBIDDEN, NOT_FOUND) sehingga klien bisa menanganinya secara programatik.'
      ]
    },
    {
      type: 'example',
      title: 'Directive Kustom @auth & @hasRole pada Schema',
      lang: 'javascript',
      output: false,
      code: `// src/schema-auth.ts — direktif deklaratif
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

const AUTH_DIRECTIVE = 'auth';
const ROLE_DIRECTIVE  = 'hasRole';

export function authDirectiveTransformer(schema: any) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const auth = getDirective(schema, fieldConfig, AUTH_DIRECTIVE)?.[0];
      const role = getDirective(schema, fieldConfig, ROLE_DIRECTIVE)?.[0];
      if (!auth && !role) return fieldConfig;

      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async function (source, args, ctx, info) {
        // @auth: wajib sudah login
        if (auth && !ctx.currentUser) {
          throw new GraphQLError('Autentikasi diperlukan', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }
        // @hasRole: wajib punya peran tertentu
        if (role && ctx.currentUser?.role !== role.required) {
          throw new GraphQLError('Peran ' + role.required + ' diperlukan', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        return resolve.call(this, source, args, ctx, info);
      };
      return fieldConfig;
    }
  });
}

// Penggunaan di SDL — deklaratif, tanpa if di resolver:
// type Mutation {
//   createPost(input: CreatePostInput!): Post!   @auth
//   deletePost(id: ID!): Boolean!                @auth @hasRole(required: ADMIN)
// }
// type Query {
//   users: [User!]!                              @auth @hasRole(required: ADMIN)
//   posts: [Post!]!                              # publik, tanpa direktif
// }`,
      explain: [
        'Directive mengubah otorisasi menjadi <b>deklarasi di schema</b> — pembaca schema langsung tahu field mana yang terproteksi tanpa menggali isi resolver.',
        'Transformer bekerja setelah schema dibangun (schema wrapping), mengganti resolver bawaan dengan pembungkus yang memeriksa context terlebih dahulu.',
        'Pola ini terukur: satu fungsi transformer dipakai ulang untuk seluruh proyek, dan aturan peran tidak tersebar di puluhan resolver.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membatasi Berat Query: Depth, Complexity, Alias</h3><p>Setelah masalah <i>siapa</i> selesai, kini masalah <i>seberapa berat</i>. Query GraphQL bisa dibuat sedalam dan selebar apa pun oleh klien. Dua metrik utama:</p><ul><li><b>Depth</b> — seberapa dalam nestingsinya. <code>a { b { c { d { ... } } } }</code> berarti depth 4. Setiap level bisa memicu query DB baru.</li><li><b>Complexity</b> — berapa total "berat" seluruh field × multiplier-nya. Satu field <code>posts</code> dengan limit 1000 jauh lebih berat dari <code>id</code>.</li></ul><p>Keduanya harus <b>ditolak sebelum resolver berjalan</b> (pada tahap validasi) — bukan di tengah jalan ketika database sudah terlanjur bekerja.</p>'
    },
    {
      type: 'example',
      title: 'Depth Limit + Complexity Limit + Matikan Introspeksi',
      lang: 'javascript',
      output: false,
      code: `// src/server.ts — hardening Apollo Server v4
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';
import { ApolloServer } from '@apollo/server';

const isProd = process.env.NODE_ENV === 'production';

const server = new ApolloServer({
  typeDefs,
  resolvers,

  // 1) Tolak query lebih dari 7 level bersarang
  validationRules: [
    depthLimit(7),
    // 2) Tolak query bernilai complexity > 1000
    //    (mis. field posts dihitung 10 × limit-nya)
    createComplexityLimitRule(1000, {
      scalarCost: 1,
      objectCost: 10,
      listFactor: 10
    })
  ],

  // 3) Introspeksi hanya di development
  introspection: !isProd,

  // 4) Sematkan pesan error standar tanpa membocorkan stack
  includeStacktraceInErrorResponses: false
});

// 5) Rate limiting — batasi request per IP per menit
//    (misal dengan express-rate-limit di depan Apollo Server)
// limiter: rateLimit({ windowMs: 60_000, max: 120 })`,
      explain: [
        '<code>depthLimit(7)</code> menolak query bomb sebelum resolver mana pun dipanggil — biaya pencegahan jauh lebih murah daripada menyelamatkan.',
        'Complexity rule memberi <b>bobot per tipe</b>: objek bernilai 10, list dikalikan 10 — sehingga <code>posts(limit: 1000)</code> otomatis melampaui batas.',
        '<code>introspection: false</code> di produksi menyembunyikan peta API, sementara developer tetap dapat schema lengkap di lingkungan dev.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Query Bomb vs Pertahanan GraphQL',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; color: #0f172a; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; }
  .panel { flex: 1; min-width: 260px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
  textarea { width: 100%; height: 90px; box-sizing: border-box; font-family: monospace; font-size: 11px;
             border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; resize: vertical; }
  .chk { margin: 6px 0; font-size: 12px; }
  button { padding: 7px 12px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; color: #fff; }
  .go { background: #2563eb; } .reset { background: #64748b; }
  .meter { height: 14px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin: 6px 0; }
  .meter i { display: block; height: 100%; width: 0; transition: width .4s; }
  .out { background: #0f172a; color: #94a3b8; padding: 8px; border-radius: 6px; min-height: 130px;
         font-family: monospace; font-size: 11px; white-space: pre-wrap; }
  .out .bad { color: #f87171; } .out .good { color: #4ade80; } .out .warn { color: #facc15; }
  .badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-weight: 700; font-size: 11px; color: #fff; }
  .ok { background: #16a34a; } .no { background: #dc2626; }
  label { user-select: none; }
</style>
</head>
<body>
<h3>🛡️ Uji pertahanan: depth limit, complexity &amp; introspeksi</h3>
<div class="row">
  <div class="panel">
    <h4>Query yang dikirim klien</h4>
    <textarea id="q">query {
  user(id: "1") {
    name
    posts { title comments { author { posts { title } } } }
  }
}</textarea>
    <div class="chk"><label><input type="checkbox" id="depth" checked> Depth limit (7)</label></div>
    <div class="chk"><label><input type="checkbox" id="cx" checked> Complexity limit (1000)</label></div>
    <div class="chk"><label><input type="checkbox" id="intro"> Introspeksi aktif (dev mode)</label></div>
    <button class="go" id="btnRun">Kirim ke POST /graphql</button>
    <button class="reset" id="btnReset">Reset</button>
    <div style="margin-top:8px;font-size:12px">Depth terdeteksi: <b id="depthVal">0</b> · Complexity: <b id="cxVal">0</b></div>
    <div class="meter"><i id="meterBar"></i></div>
  </div>
  <div="panel" class="panel">
    <h4>Respons server <span id="status"></span></h4>
    <div class="out" id="out">Menunggu request...</div>
  </div>
</div>
<script>
  var DEFAULT_Q = 'query {\\n  user(id: "1") {\\n    name\\n    posts { title comments { author { posts { title } } } }\\n  }\\n}';
  var BOMB = 'query {\\n  user(id:"1"){ posts { comments { author { posts { comments { author { id } } } } } } }\\n  a1: user(id:"2"){ id } a2: user(id:"2"){ id } a3: user(id:"2"){ id }\\n  a4: user(id:"2"){ id } a5: user(id:"2"){ id } a6: user(id:"2"){ id }\\n}';

  function analyze(q) {
    var depth = 0, max = 0;
    for (var i = 0; i < q.length; i++) {
      if (q[i] === '{') { depth++; if (depth > max) max = depth; }
      else if (q[i] === '}') depth--;
    }
    var aliases = (q.match(/[a-z0-9]+\\s*:/g) || []).length;
    var lists = (q.match(/\\{/g) || []).length;
    var cx = 10 + aliases * 10 + lists * 10 + (q.match(/posts|comments/g) || []).length * 50;
    return { depth: max, cx: cx };
  }

  function setBadge(id, ok) {
    document.getElementById(id).innerHTML =
      ok ? '<span class="badge ok">DITERIMA 200</span>' : '<span class="badge no">DITOLAK 400</span>';
  }

  document.getElementById('btnRun').onclick = function () {
    var q = document.getElementById('q').value;
    var a = analyze(q);
    var useDepth = document.getElementById('depth').checked;
    var useCx = document.getElementById('cx').checked;
    var intro = document.getElementById('intro').checked;

    document.getElementById('depthVal').textContent = a.depth;
    document.getElementById('cxVal').textContent = a.cx;
    var pct = Math.min(100, Math.round(a.cx / 1000 * 100));
    document.getElementById('meterBar').style.width = pct + '%';
    document.getElementById('meterBar').style.background =
      pct > 100 ? '#dc2626' : pct > 60 ? '#f59e0b' : '#22c55e';

    var out = document.getElementById('out');
    var log = '';
    log += '→ POST /graphql\\n';

    // Introspeksi
    if (/__schema|__type/.test(q)) {
      if (intro) {
        log += '<span class="warn">← 200 OK — introspeksi TERBUKA</span>\\n';
        log += '{ "data": { "__schema": { "types": [ ... 47 tipe ... ] } } }\\n';
        log += '<span class="warn">⚠ Seluruh peta API (termasuk field admin) bocor ke penyerang!</span>';
      } else {
        log += '<span class="bad">← 400 Bad Request</span>\\n';
        log += 'GraphQL introspection is not allowed...\\n';
        log += '<span class="good">✓ Introspeksi dimatikan — penyerang buta peta API.</span>';
      }
      out.innerHTML = log;
      setBadge('status', intro);
      return;
    }

    // Depth limit
    if (useDepth && a.depth > 7) {
      log += '<span class="bad">← 400 Bad Request</span>\\n';
      log += 'Query exceeds maximum depth 7 (dapat: ' + a.depth + ')\\n';
      log += '<span class="good">✓ Query bomb DITOLAK sebelum resolver berjalan.</span>';
      out.innerHTML = log;
      setBadge('status', false);
      return;
    }

    // Complexity limit
    if (useCx && a.cx > 1000) {
      log += '<span class="bad">← 400 Bad Request</span>\\n';
      log += 'Query complexity ' + a.cx + ' exceeds maximum 1000\\n';
      log += '<span class="good">✓ Query berat DITOLAK sebelum menyentuh database.</span>';
      out.innerHTML = log;
      setBadge('status', false);
      return;
    }

    if (a.cx > 1000 || a.depth > 7) {
      log += '<span class="warn">⚠ Pertahanan NONAKTIF — query berat lolos!</span>\\n';
      log += '<span class="bad">Server memproses... resolver dipanggil ribuan kali...</span>\\n';
      log += '<span class="bad">✗ Risiko: latensi melonjak / OOM di produksi</span>';
      out.innerHTML = log;
      setBadge('status', true);
      return;
    }

    log += '<span class="good">← 200 OK</span>\\n';
    log += '{ "data": { "user": { "name": "Budi Santoso", ... } } }';
    out.innerHTML = log;
    setBadge('status', true);
  };

  document.getElementById('btnReset').onclick = function () {
    document.getElementById('q').value = DEFAULT_Q;
    document.getElementById('depth').checked = true;
    document.getElementById('cx').checked = true;
    document.getElementById('intro').checked = false;
    document.getElementById('out').textContent = 'Menunggu request...';
    document.getElementById('status').innerHTML = '';
    document.getElementById('depthVal').textContent = '0';
    document.getElementById('cxVal').textContent = '0';
    document.getElementById('meterBar').style.width = '0';
  };
</script>
</body>
</html>`,
      hint: 'Kirim query default dengan pertahanan aktif (diterima), lalu aktifkan "Introspeksi" untuk melihat kebocoran schema, lalu ganti query dengan query bomb untuk melihat penolakan depth/complexity. Matikan centang untuk melihat apa yang terjadi bila pertahanan dimatikan.'
    },
    {
      type: 'tip',
      title: 'Urutan menerapkan keamanan di proyek nyata',
      text: '<b>1.</b> Context JWT + autentikasi login · <b>2.</b> Otorisasi di resolver untuk semua data milik pengguna · <b>3.</b> Depth + complexity limit · <b>4.</b> Introspeksi OFF di produksi · <b>5.</b> Rate limiting per IP/API key · <b>6.</b> Directive @auth untuk menyatukan aturan.<br><br>Enam langkah ini menutup 90% vektor serangan GraphQL yang paling sering ditemukan pada audit keamanan.'
    },
    {
      type: 'warn',
      title: 'Jangan mempercayai context tanpa memperbaruinya',
      text: 'Jika kamu menyimpan data pengguna <b>sebelum</b> mengubahnya (mis. role lama), resolver bisa tetap menggunakan izin lama — perbarui context setelah mutasi peran. Selain itu, jangan simpan token atau password di context lebih lama dari satu request, dan ingat bahwa <b>payload JWT bisa dibaca siapa pun</b> (hanya tanda tangan yang tidak bisa dipalsukan) — jangan pernah menaruh rahasia di dalamnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Authentication (Autentikasi)', 'Proses memverifikasi IDENTITAS pengguna — "siapa kamu". Biasanya lewat login yang menghasilkan token JWT.'],
        ['Authorization (Otorisasi)', 'Proses memverifikasi IZIN aksi — "kamu boleh apa". Misal: hanya penulis yang boleh menghapus postingannya.'],
        ['JWT (JSON Web Token)', 'Token berisi payload identitas yang ditandatangani server. Dikirim via header Authorization: Bearer ... pada setiap request.'],
        ['GraphQL Context', 'Objek yang dibuat sekali per request (berisi prisma, currentUser) dan disuntikkan ke resolver ke-3 — tempat token diproses.'],
        ['Depth Limiting', 'Menolak query yang bersarang melebihi batas level tertentu untuk mencegah query bomb dan N+1 ekstrem.'],
        ['Complexity Analysis', 'Menghitung total "berat" query (bobot per field × list factor) dan menolaknya bila melebihi batas.'],
        ['Rate Limiting', 'Membatasi jumlah request per IP/API key dalam periode waktu untuk meredam brute force dan spam.'],
        ['Introspection', 'Fitur GraphQL yang memungkinkan klien menanyakan schema. Penting untuk developer, berbahaya bila terbuka di produksi.'],
        ['@auth Directive', 'Direktif kustom yang menandai field wajib autentikasi/otorisasi langsung di schema, tanpa if di setiap resolver.']
      ]
    }
  ],
  recap: [
    'GraphQL melayani semua operasi lewat <b>satu endpoint</b>, sehingga ancamannya berbeda REST: introspeksi terbuka, query bomb, dan akses lintas data.',
    '<b>Autentikasi JWT</b> diproses sekali di <b>context</b> lalu tersedia ke semua resolver; token tidak valid diperlakukan sebagai pengguna anonim.',
    '<b>Otorisasi</b> wajib diperiksa <i>di dalam resolver</i> dengan membaca data dari database (bukan mempercayai argument klien), membedakan 401 (belum login) dan 403 (tidak berhak).',
    'Directive kustom <code>@auth</code> / <code>@hasRole</code> membuat aturan keamanan <b>deklaratif</b> pada schema dan menghapus pengulangan if di banyak resolver.',
    'Pertahanan query: <b>depth limit</b> (kedalaman), <b>complexity limit</b> (berat), <b>introspeksi OFF</b> di produksi, dan <b>rate limiting</b> — semuanya sebaiknya menolak sebelum resolver berjalan.'
  ]
});
