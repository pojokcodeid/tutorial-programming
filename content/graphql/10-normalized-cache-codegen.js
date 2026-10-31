/* ============================================================
   GraphQL — Bab 10: Normalized Cache & GraphQL Code Generator
   ============================================================ */
'use strict';
window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];
window.GRAPHQL_LESSONS.push({
  id: 'normalized-cache-codegen',
  title: 'Normalized Cache & GraphQL Code Generator',
  chapter: 'Frontend Integration',
  duration: '15 menit',
  intro: [
    'Apollo Client tidak hanya mengirim request — ia menyimpan setiap data yang diterima dalam sebuah <b>normalized store</b>. Memahami cara kerjanya akan membantumu menulis kode yang lebih efisien dan menghindari bug data yang sudah usang (stale data).',
    'Di bagian kedua pelajaran ini, kita akan mengenal <b>GraphQL Code Generator</b>: alat yang secara otomatis menghasilkan TypeScript types dari schema GraphQL. Tidak perlu lagi menulis interface secara manual!'
  ],
  objectives: [
    'Memahami cara Apollo menyimpan data dalam normalized cache (store by ID)',
    'Menjelaskan mengapa normalisasi penting untuk performa dan konsistensi data',
    'Memperbarui cache secara manual setelah mutation menggunakan cache.modify dan readQuery/writeQuery',
    'Menginstall dan mengkonfigurasi GraphQL Code Generator',
    'Men-generate TypeScript types dari schema GraphQL secara otomatis'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Normalized Cache?</h3><p>Saat Apollo menerima data dari server, ia tidak menyimpannya apa adanya. Ia memecah dan menyimpan setiap objek secara terpisah berdasarkan <b>tipe + ID</b>. Proses ini disebut <b>normalisasi</b>.</p><table><thead><tr><th>Cara biasa (non-normalized)</th><th>Apollo Normalized Cache</th></tr></thead><tbody><tr><td>Data disimpan sesuai shape response</td><td>Setiap objek disimpan sebagai entry terpisah</td></tr><tr><td>User yang sama bisa tersimpan di 2 tempat berbeda</td><td>User hanya ada 1 salinan, direferensikan di mana-mana</td></tr><tr><td>Update di satu tempat tidak memengaruhi tempat lain</td><td>Update 1 entry langsung memengaruhi semua komponen yang menampilkannya</td></tr></tbody></table><p>Hasilnya: saat kamu update data user di satu komponen, komponen lain yang menampilkan user yang sama <b>otomatis ikut terupdate</b> — tanpa fetch ulang.</p>'
    },
    {
      type: 'example',
      title: 'Visualisasi: Bagaimana Apollo Menyimpan Data di Cache',
      lang: 'text',
      output: false,
      code: `Response dari server (shape asli):
{
  "data": {
    "users": [
      { "id": "1", "name": "Budi", "email": "budi@mail.com" },
      { "id": "2", "name": "Ani",  "email": "ani@mail.com"  }
    ]
  }
}

                   ↓  Apollo memproses & menormalisasi  ↓

Apollo Cache Store (simplified):
{
  "ROOT_QUERY": {
    "__typename": "Query",
    "users": [
      { "__ref": "User:1" },   ← referensi, bukan salinan data
      { "__ref": "User:2" }
    ]
  },
  "User:1": {
    "__typename": "User",
    "id": "1",
    "name": "Budi",
    "email": "budi@mail.com"
  },
  "User:2": {
    "__typename": "User",
    "id": "2",
    "name": "Ani",
    "email": "ani@mail.com"
  }
}`,
      explain: [
        'Kunci cache untuk setiap objek adalah <code>TypeName:id</code>, misalnya <code>User:1</code>.',
        '<code>ROOT_QUERY.users</code> tidak berisi data langsung, melainkan <b>referensi</b> (<code>__ref</code>) ke entry terpisah.',
        'Jika query lain (mis. <code>getUser(id: "1")</code>) juga mengembalikan user id 1, Apollo <b>tidak membuat entry baru</b> — ia menggunakan entry <code>User:1</code> yang sudah ada.',
        'Inilah kekuatan normalisasi: satu sumber kebenaran (single source of truth) per entitas.'
      ]
    },
    {
      type: 'example',
      title: 'Update Cache Manual Setelah Mutation — Cara 1: cache.modify',
      lang: 'typescript',
      output: false,
      code: `// Gunakan cache.modify untuk update data tanpa re-fetch ke server
// Cocok untuk update sebagian field atau tambah item ke daftar

const [createUser] = useMutation(CREATE_USER, {
  update(cache, { data }) {
    const newUser = data?.createUser;
    if (!newUser) return;

    cache.modify({
      // Modifikasi ROOT_QUERY
      fields: {
        // Fungsi ini menerima daftar users lama, kita kembalikan daftar baru
        users(existingUserRefs = []) {
          // Tulis data user baru ke cache terlebih dahulu
          const newUserRef = cache.writeFragment({
            data: newUser,
            fragment: gql\`
              fragment NewUser on User {
                id
                name
                email
                createdAt
              }
            \`,
          });
          // Tambahkan referensi ke user baru di daftar
          return [...existingUserRefs, newUserRef];
        },
      },
    });
  },
});`,
      explain: [
        'Fungsi <code>update</code> pada <code>useMutation</code> dipanggil setelah mutation berhasil, menerima <code>cache</code> dan <code>data</code> response.',
        '<code>cache.modify</code> memungkinkan kita mengubah field spesifik di cache tanpa menghapus seluruh entry.',
        '<code>cache.writeFragment</code> menulis data user baru ke cache dengan format yang dapat direferensikan.',
        'Keuntungan cara ini: <b>tidak ada request tambahan ke server</b> — lebih cepat dari <code>refetchQueries</code>.',
        'Gunakan <code>cache.modify</code> saat kamu yakin data yang dikembalikan mutation sudah lengkap dan akurat.'
      ]
    },
    {
      type: 'example',
      title: 'Update Cache Manual — Cara 2: readQuery + writeQuery',
      lang: 'typescript',
      output: false,
      code: `// Cara alternatif: baca query lama dari cache, modifikasi, lalu tulis kembali
// Lebih eksplisit dan mudah dipahami untuk pemula

const [createUser] = useMutation(CREATE_USER, {
  update(cache, { data }) {
    const newUser = data?.createUser;
    if (!newUser) return;

    // Baca data yang ada di cache untuk query GET_USERS
    const existing = cache.readQuery<{ users: User[] }>({
      query: GET_USERS,
    });

    if (!existing) return;

    // Tulis kembali ke cache dengan data yang sudah diperbarui
    cache.writeQuery({
      query: GET_USERS,
      data: {
        users: [...existing.users, newUser],
      },
    });
  },
});`,
      explain: [
        '<code>cache.readQuery</code> membaca data dari cache sesuai query yang diberikan — hasilnya sama dengan apa yang ditampilkan komponen saat ini.',
        '<code>cache.writeQuery</code> menggantikan data di cache dengan data baru yang kita buat.',
        'Cara ini lebih mudah dipahami karena kita bekerja dengan shape data yang sama seperti response server.',
        'Setelah <code>writeQuery</code>, semua komponen yang menggunakan <code>GET_USERS</code> akan otomatis re-render dengan data terbaru.',
        'Pilih cara ini saat kamu ingin manipulasi data yang lebih kompleks sebelum disimpan ke cache.'
      ]
    },
    {
      type: 'text',
      html: '<h3>GraphQL Code Generator: TypeScript Otomatis dari Schema</h3><p>Menulis TypeScript interface secara manual untuk setiap query dan mutation bisa sangat melelahkan — dan rawan tidak sinkron dengan schema server. <b>GraphQL Code Generator</b> memecahkan masalah ini dengan men-generate types secara otomatis.</p><table><thead><tr><th>Tanpa Code Generator</th><th>Dengan Code Generator</th></tr></thead><tbody><tr><td>Tulis interface manual untuk setiap query</td><td>Generate otomatis dari schema</td></tr><tr><td>Bisa out-of-sync jika schema berubah</td><td>Selalu sinkron — tinggal jalankan <code>codegen</code></td></tr><tr><td>Tidak ada type-safety untuk variables</td><td>Types untuk variables dan response lengkap</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Setup GraphQL Code Generator',
      lang: 'bash',
      output: false,
      code: `# Install package Code Generator dan plugin yang dibutuhkan
npm install -D @graphql-codegen/cli @graphql-codegen/client-preset

# Jalankan wizard setup interaktif (opsional)
npx graphql-codegen init

# Atau buat file konfigurasi manual: codegen.ts di root project
touch codegen.ts`,
      explain: [
        '<code>@graphql-codegen/cli</code> adalah tool utama yang menjalankan proses generate.',
        '<code>@graphql-codegen/client-preset</code> adalah plugin yang menghasilkan types lengkap untuk React + Apollo, termasuk types untuk useQuery dan useMutation.',
        'Flag <code>-D</code> memasang package sebagai devDependency — tidak perlu di production build.',
        'Setelah install, kita perlu membuat file konfigurasi <code>codegen.ts</code> untuk memberitahu Code Generator apa yang harus di-generate.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi: codegen.ts',
      lang: 'typescript',
      output: false,
      code: `// codegen.ts (di root project, sejajar dengan package.json)
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Ambil schema dari server GraphQL yang sedang berjalan
  schema: 'http://localhost:4000/graphql',

  // File mana saja yang berisi operasi GraphQL (query, mutation, subscription)
  documents: ['src/**/*.tsx', 'src/**/*.ts'],

  generates: {
    // Tempat output file yang dihasilkan
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        // Fragment masking membantu TypeScript memastikan fragment
        // hanya dipakai di komponen yang tepat
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
      plugins: [],
    },
  },
};

export default config;`,
      explain: [
        'Properti <code>schema</code> menunjuk ke sumber schema GraphQL — bisa URL server, file .graphql, atau file introspection JSON.',
        'Properti <code>documents</code> adalah glob pattern menentukan file mana yang akan di-scan untuk query dan mutation.',
        'Semua types akan di-generate ke folder <code>src/gql/</code>.',
        'Tambahkan script di <code>package.json</code>: <code>"codegen": "graphql-codegen --config codegen.ts"</code> agar bisa dijalankan dengan <code>npm run codegen</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh Output yang Dihasilkan Code Generator',
      lang: 'typescript',
      output: false,
      code: `// src/gql/graphql.ts (DIHASILKAN OTOMATIS — JANGAN EDIT MANUAL)
// Generated by GraphQL Code Generator

export type Maybe<T> = T | null;
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
};

// Types dari schema
export type User = {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  email: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  users: Array<User>;
  user?: Maybe<User>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createUser: User;
  updateUser: User;
  deleteUser: Scalars['Boolean']['output'];
};

// Types untuk query spesifik yang kamu tulis
export type GetUsersQueryVariables = Record<string, never>;
export type GetUsersQuery = {
  __typename?: 'Query';
  users: Array<{
    __typename?: 'User';
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
};

export type CreateUserMutationVariables = {
  name: Scalars['String']['input'];
  email: Scalars['String']['input'];
};
export type CreateUserMutation = {
  __typename?: 'Mutation';
  createUser: {
    __typename?: 'User';
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
};`,
      explain: [
        'Code Generator menghasilkan types untuk <b>semua entitas di schema</b> (User, Query, Mutation, dll).',
        'Yang paling berguna: types untuk setiap operasi spesifik — <code>GetUsersQuery</code>, <code>GetUsersQueryVariables</code>, dsb.',
        'Import dan gunakan: <code>useQuery&lt;GetUsersQuery, GetUsersQueryVariables&gt;(GET_USERS)</code> — TypeScript akan mendeteksi kesalahan field secara otomatis.',
        'File ini <b>jangan diedit manual</b> karena akan tertimpa setiap kali kamu menjalankan <code>npm run codegen</code>.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Lihat Apollo Cache Store secara Real-time',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; color: #0f172a; background: #f8fafc; }
  h3 { margin: 0 0 10px; font-size: 15px; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; }
  .panel { flex: 1; min-width: 220px; }
  button { padding: 7px 14px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; margin-bottom: 8px; margin-right: 6px; }
  button:hover { background: #1d4ed8; }
  .cache-box { background: #0f172a; color: #e2e8f0; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; white-space: pre; overflow: auto; max-height: 360px; min-height: 200px; }
  .k-query { color: #f59e0b; }
  .k-type { color: #34d399; }
  .k-id { color: #60a5fa; }
  .k-val { color: #e2e8f0; }
  .k-ref { color: #a78bfa; }
  .badge { display: inline-block; background: #dcfce7; color: #166534; border-radius: 99px; padding: 2px 10px; font-size: 12px; font-weight: 700; margin-bottom: 10px; }
  .info { font-size: 12px; color: #64748b; margin-bottom: 8px; }
  .actions { margin-bottom: 10px; }
</style>
</head>
<body>
<div class="badge">🗄️ Apollo Normalized Cache Simulator</div>
<p class="info">Setiap aksi di bawah akan mengubah isi cache. Perhatikan bagaimana data disimpan per entitas (User:1, User:2, dst).</p>

<div class="actions">
  <button id="btnFetch">📡 Fetch Users (GET_USERS)</button>
  <button id="btnAdd">➕ Add User (Ahmad)</button>
  <button id="btnUpdate">✏️ Update User:2 (ganti nama)</button>
  <button id="btnClear">🗑️ Clear Cache</button>
</div>

<div class="row">
  <div class="panel">
    <h3>Apollo Cache Store</h3>
    <div class="cache-box" id="cacheView"><span style="color:#64748b">Cache kosong. Klik "Fetch Users" untuk mulai.</span></div>
  </div>
</div>

<script>
  var store = {};

  function renderCache() {
    var box = document.getElementById('cacheView');
    if (Object.keys(store).length === 0) {
      box.innerHTML = '<span style="color:#64748b">Cache kosong.</span>';
      return;
    }
    var lines = [];
    lines.push('<span class="k-type">{</span>');
    Object.keys(store).forEach(function(key) {
      lines.push('  <span class="k-id">"' + key + '"</span>: {');
      var obj = store[key];
      Object.keys(obj).forEach(function(field) {
        var val = obj[field];
        var rendered;
        if (typeof val === 'string' && val.startsWith('__ref:')) {
          rendered = '<span class="k-ref">{ __ref: "' + val.replace('__ref:', '') + '" }</span>';
        } else if (Array.isArray(val)) {
          rendered = '<span class="k-ref">[ ' + val.map(function(v){ return '{ __ref: "' + v.replace('__ref:', '') + '" }'; }).join(', ') + ' ]</span>';
        } else {
          rendered = '<span class="k-val">"' + val + '"</span>';
        }
        lines.push('    <span class="k-query">"' + field + '"</span>: ' + rendered + ',');
      });
      lines.push('  },');
    });
    lines.push('<span class="k-type">}</span>');
    box.innerHTML = lines.join('\n');
  }

  document.getElementById('btnFetch').onclick = function() {
    var users = [
      { id: '1', name: 'Budi Santoso', email: 'budi@mail.com', __typename: 'User' },
      { id: '2', name: 'Ani Rahayu', email: 'ani@mail.com', __typename: 'User' },
    ];
    users.forEach(function(u) {
      store['User:' + u.id] = { __typename: u.__typename, id: u.id, name: u.name, email: u.email };
    });
    store['ROOT_QUERY'] = store['ROOT_QUERY'] || {};
    store['ROOT_QUERY']['__typename'] = 'Query';
    store['ROOT_QUERY']['users'] = users.map(function(u){ return '__ref:User:' + u.id; });
    renderCache();
  };

  document.getElementById('btnAdd').onclick = function() {
    var newId = String(Object.keys(store).filter(function(k){ return k.startsWith('User:'); }).length + 1);
    var newUser = { __typename: 'User', id: newId, name: 'Ahmad Fauzi', email: 'ahmad@mail.com' };
    store['User:' + newId] = newUser;
    if (!store['ROOT_QUERY']) store['ROOT_QUERY'] = { __typename: 'Query', users: [] };
    if (!store['ROOT_QUERY']['users']) store['ROOT_QUERY']['users'] = [];
    store['ROOT_QUERY']['users'].push('__ref:User:' + newId);
    renderCache();
  };

  document.getElementById('btnUpdate').onclick = function() {
    if (!store['User:2']) { alert('Fetch users dulu!'); return; }
    store['User:2'].name = 'Ani Rahayu (Updated)';
    store['User:2'].email = 'ani.updated@mail.com';
    renderCache();
  };

  document.getElementById('btnClear').onclick = function() {
    store = {};
    renderCache();
  };
</script>
</body>
</html>`,
      hint: 'Klik "Fetch Users" lalu perhatikan struktur cache. Klik "Add User" dan lihat entry baru User:3 muncul. Klik "Update User:2" dan perhatikan bahwa hanya entry User:2 yang berubah — inilah keunggulan normalized cache.'
    },
    {
      type: 'tip',
      title: 'Code Generator menghemat puluhan jam penulisan types manual',
      text: 'Di project dengan 50+ query dan mutation, menulis TypeScript types secara manual bisa memakan waktu berhari-hari dan rentan terhadap kesalahan. Dengan Code Generator, kamu cukup menulis query/mutation GraphQL-nya, jalankan <code>npm run codegen</code>, dan semua types langsung tersedia. Bonus: jika schema server berubah, jalankan codegen lagi dan TypeScript akan langsung memberitahu komponen mana yang perlu diperbarui.'
    },
    {
      type: 'warn',
      title: 'Normalized cache butuh field `id` di setiap query!',
      text: 'Apollo menggunakan field <code>id</code> (atau <code>_id</code>) untuk mengidentifikasi dan menggabungkan data di cache. Jika kamu query user tapi tidak menyertakan field <code>id</code> dalam selection set, Apollo tidak bisa menentukan kunci cache yang unik — akibatnya data tidak bisa di-merge dengan benar, bisa terjadi duplikasi, dan update otomatis antar komponen tidak akan bekerja. Selalu sertakan <code>id</code> di setiap query!'
    },
    {
      type: 'vocab',
      items: [
        ['Normalized Cache', 'Sistem penyimpanan Apollo di mana setiap objek disimpan satu kali berdasarkan tipe dan ID-nya, kemudian direferensikan dari mana saja.'],
        ['Cache Store', 'Representasi internal Apollo Cache berupa flat key-value store dengan kunci berbentuk TypeName:id (mis. User:1).'],
        ['Code Generator', 'Tool yang membaca schema GraphQL dan dokumen operasi (query/mutation) lalu menghasilkan TypeScript types secara otomatis.'],
        ['Type Safety', 'Jaminan bahwa field yang kamu akses memang ada di schema dan tipenya benar, diverifikasi oleh TypeScript saat compile.'],
        ['Cache Update', 'Proses memperbarui data di Apollo Cache setelah mutation, baik dengan refetchQueries, cache.modify, maupun readQuery+writeQuery.'],
        ['optimisticResponse', 'Fitur Apollo yang memungkinkan UI berubah instan sebelum server merespons, dengan menebak response mutation terlebih dahulu.']
      ]
    }
  ],
  recap: [
    'Apollo menyimpan data secara <b>normalized</b>: setiap objek tersimpan satu kali dengan kunci <code>TypeName:id</code>.',
    'Normalisasi membuat satu update data secara otomatis memengaruhi semua komponen yang menampilkan entitas yang sama.',
    'Update cache setelah mutation: gunakan <code>refetchQueries</code> (mudah), <code>cache.modify</code> (efisien), atau <code>readQuery + writeQuery</code> (eksplisit).',
    '<b>GraphQL Code Generator</b> menghasilkan TypeScript types dari schema secara otomatis dengan perintah <code>npm run codegen</code>.',
    'Selalu sertakan field <code>id</code> di setiap query agar normalized cache bekerja dengan benar.'
  ]
});
